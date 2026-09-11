import { generateRSAKeyPair, exportPublicKeyToPem, importPublicKeyFromPem, loadServerSigningKey, verifyDeviceKeySignature, encryptMessage, decryptMessage, exportPrivateKeyEncrypted, importPrivateKeyFromBackup, generateDeviceId } from './crypto.js';
import { log, fetchWithTimeout, saveKeyPair, loadKeyPair, deleteKeyPair, saveDeviceMeta, loadDeviceMeta, clearAllSessionKeys, wipeAllLocalData, handleError } from '../utils.js';

/**
 * High-level messaging API consumed by the UI layer.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MULTI-DEVICE DESIGN                                                     ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  Each physical device (browser profile) has:                             ║
 * ║    • Its own randomly-generated deviceId (32-hex)                        ║
 * ║    • Its own RSA-4096 key pair                                           ║
 * ║    • Its private key stored in IndexedDB — NEVER leaves the device       ║
 * ║    • Its public key registered in Firestore under userDevices/{userId}   ║
 * ║                                                                          ║
 * ║  When sending a message:                                                 ║
 * ║    1. Fetch ALL active devices of BOTH sender and recipient              ║
 * ║    2. Verify the server's RSA-PSS signature on each device key           ║
 * ║    3. Generate ONE AES-256 key, encrypt the message with it              ║
 * ║    4. RSA-wrap the AES key once per device → encryptedKeys map           ║
 * ║    5. POST { ciphertext, iv, encryptedKeys } to the server               ║
 * ║                                                                          ║
 * ║  When receiving a message:                                               ║
 * ║    1. Pull down the message (SSE or history)                             ║
 * ║    2. Look up encryptedKeys[myDeviceId]                                  ║
 * ║    3. RSA-decrypt that slot with this device's private key → AES key     ║
 * ║    4. AES-GCM-decrypt ciphertext → plaintext                             ║
 * ║                                                                          ║
 * ║  Result: any registered device can decrypt any message sent after it     ║
 * ║  was registered.  Messages sent before registration are unreadable       ║
 * ║  (forward secrecy across device additions).                              ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

let _currentUserId = null;
let _currentDeviceId = null;
let _getIdToken = null;
let _keyPair = null;

const _deviceKeyCache = new Map();

let _authHeaders = null;

export async function registerKey(uid, authHeaders) {
	_currentUserId = uid;
	_authHeaders = authHeaders;

	const { signingPublicKeyPem } = await fetchWithTimeout(`/api/keys/server/signing-key`);
	await loadServerSigningKey(signingPublicKeyPem);

	const existingMeta = await loadDeviceMeta(uid);

	if (existingMeta && existingMeta.uid === uid) {
		_currentDeviceId = existingMeta.deviceId;
		const keyRecord = await loadKeyPair(_currentDeviceId);

		if (keyRecord) {
			_keyPair = keyRecord;
			log(`[messaging] Loaded existing device: ${_currentDeviceId}`);
			return { deviceId: _currentDeviceId, isNewDevice: false };
		}
		log.warn('[messaging] Device meta found but key pair is missing. Re-registering device…');

		log('[messaging] New RSA key pair generated and registered.');
	}

	const newDeviceId = existingMeta?.deviceId || generateDeviceId();
	const resolvedName = detectDeviceName();

	log(`[messaging] Registering new device: ${newDeviceId} (${resolvedName})`);

	const { privateKey, publicKey } = await generateRSAKeyPair();
	const publicKeyPem = await exportPublicKeyToPem(publicKey);

	try {
		await fetchWithTimeout(`/api/keys/register`, {
			method: 'POST',
			headers: _authHeaders,
			body: JSON.stringify({ deviceId: newDeviceId, publicKeyPem, deviceName: resolvedName }),
		});
	} catch (e) {
		throw new Error(`[messaging] Device registration failed: ${await handleError(e)}`);
	}

	await saveDeviceMeta(uid, { deviceId: newDeviceId, deviceName: resolvedName });
	await saveKeyPair(newDeviceId, { privateKey, publicKey });

	_currentDeviceId = newDeviceId;
	_keyPair = { privateKey, publicKey };

	log(`[messaging] New device registered: ${newDeviceId}`);
	return { deviceId: newDeviceId, isNewDevice: true };
}

export async function getVerifiedDevices(userId) {
	if (_deviceKeyCache.has(userId)) return _deviceKeyCache.get(userId);

	let res;

	try {
		res = await fetchWithTimeout(`/api/keys/devices/${userId}`, {
			headers: _authHeaders,
		});
	} catch (err) {
		if (err.status === 404) throw new Error(`[messaging] User ${userId} has no registered devices. Ask them to open the app to generate their keys.`);
		throw new Error('[messaging] Failed to fetch device keys: ' + await handleError(err));
	}

	const { devices } = await res.json();

	// Verify ALL signatures before trusting any key
	const verified = await Promise.all(
		devices.map(async (d) => {
			const isValid = await verifyDeviceKeySignature(
				d.userId, d.deviceId, d.publicKeyPem, d.signature
			);
			if (!isValid) throw new Error(`[messaging] SECURITY ALERT: Device key signature INVALID for user=${d.userId} device=${d.deviceId}. This key may have been tampered with. Aborting.`);
			const publicKey = await importPublicKeyFromPem(d.publicKeyPem);
			return { deviceId: d.deviceId, publicKey, deviceName: d.deviceName };
		})
	);

	_deviceKeyCache.set(userId, verified);
	return verified;
}

export function invalidateDeviceCache(userId) {
	if (userId) {
		_deviceKeyCache.delete(userId);
	} else {
		_deviceKeyCache.clear();
	}
}

async function decryptIncomingMessage(msg) {
	const myEncryptedKey = msg.encryptedKeys?.[_currentDeviceId];

	if (!myEncryptedKey) {
		log.warn(
			`[messaging] No key slot for device ${_currentDeviceId} in message ${msg.messageId}. ` +
			'This message was sent before this device was registered.'
		);
		return null;
	}

	return decryptMessage({
		ciphertext: msg.ciphertext,
		iv: msg.iv,
		encryptedKeyForThisDevice: myEncryptedKey,
		privateKey: _keyPair.privateKey,
	});
}

export async function sendMessage({ recipientId, text, messageType = 'text' }) {
	if (!_keyPair || !_currentUserId) throw new Error('[messaging] Not initialised. Call initMessaging() first.');
	if (!text || text.trim() === '') throw new Error('[messaging] Message text cannot be empty.');

	const senderId = _currentUserId;
	const [senderDevices, recipientDevices] = await Promise.all([
		getVerifiedDevices(senderId),
		getVerifiedDevices(recipientId),
	]);

	const allDevicesMap = new Map();
	for (const d of [...senderDevices, ...recipientDevices]) {
		allDevicesMap.set(d.deviceId, d);
	}
	const allDevices = Array.from(allDevicesMap.values());

	if (allDevices.length === 0) throw new Error('[messaging] No active devices found for either participant.');

	const { ciphertext, iv, encryptedKeys } = await encryptMessage({
		plaintext: text.trim(),
		devices: allDevices,
	});

	try {
		const res = await fetchWithTimeout(`/api/messages/send`, {
			method: 'POST',
			headers: _authHeaders,
			body: JSON.stringify({ recipientId, ciphertext, iv, encryptedKeys, messageType }),
		});

		return res.json();
	} catch (err) {
		throw new Error(`[messaging] Send failed: ${await handleError(err)}`);
	}
}

export function subscribeToConversation(conversationId, onMessage, onError) {
	if (!_keyPair) {
		onError(new Error('[messaging] Not initialised. Call initMessaging() first.'));
		return () => { };
	}

	let sseUrl;
	let eventSource = null;
	let closed = false;

	(async () => {
		try {
			const token = await _getIdToken();
			sseUrl = `/api/messages/${conversationId}/stream?token=${encodeURIComponent(token)}`;

			if (closed) return;

			eventSource = new EventSource(sseUrl);

			eventSource.addEventListener('message', async (event) => {
				try {
					const msg = JSON.parse(event.data);
					const isSender = msg.senderId === _currentUserId;
					const encryptedBlob = isSender
						? msg.encryptedForSender
						: msg.encryptedForRecipient;

					const plaintext = await decryptMessage({
						encryptedBlob,
						iv: msg.iv,
						privateKey: _keyPair.privateKey,
					});

					onMessage(plaintext, {
						messageId: msg.messageId,
						senderId: msg.senderId,
						sentAt: msg.sentAt,
						messageType: msg.messageType,
					});
				} catch (decryptErr) {
					log.error('[messaging/SSE] Decryption failed for message:', decryptErr);
					onError(new Error(`Failed to decrypt message: ${decryptErr.message}`));
				}
			});

			eventSource.onerror = (err) => {
				log.error('[messaging/SSE] Connection error:', err);
				onError(new Error('Real-time connection error. Will attempt to reconnect.'));
			};

		} catch (initErr) {
			onError(initErr);
		}
	})();

	return function unsubscribe() {
		closed = true;
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
	};
}

export async function loadMessages(conversationId, { limit = 30, beforeSentAt } = {}) {
	if (!_keyPair) throw new Error('[messaging] Not initialised.');

	const params = new URLSearchParams({ limit });
	if (beforeSentAt) params.set('beforeSentAt', beforeSentAt);

	let res;

	try {
		res = await fetchWithTimeout(`/api/messages/${conversationId}?${params}`, {
			headers: _authHeaders,
		});
	} catch { throw new Error('[messaging] Failed to load messages.') }

	const { messages } = res;

	return Promise.all(
		messages.map(async (msg) => {
			let plaintext = null;
			let unavailable = false;

			try {
				plaintext = await decryptIncomingMessage(msg);
				if (plaintext === null) unavailable = true;
			} catch (err) {
				log.error(`[messaging] Failed to decrypt ${msg.messageId}:`, err.message);
				unavailable = true;
			}

			return { plaintext, unavailable, messageId: msg.messageId, senderId: msg.senderId, sentAt: msg.sentAt, messageType: msg.messageType, readAt: msg.readAt };
		})
	);
}

export async function listMyDevices() {
	try {
		const { devices } = await fetchWithTimeout(`/api/keys/my-devices`, {
			headers: _authHeaders,
		});

		return devices;
	} catch { throw new Error('[messaging] Failed to list devices.') }
}

export async function revokeDevice(deviceId) {
	try {
		await fetchWithTimeout(`/api/keys/devices/${deviceId}`, {
			method: 'DELETE',
			headers: _authHeaders,
		});

		invalidateDeviceCache(_currentUserId);

		if (deviceId === _currentDeviceId) {
			await wipeAllLocalData();
			_keyPair = null;
			_currentDeviceId = null;
			_currentUserId = null;
		}

		return res.json();
	} catch (err) {
		throw new Error(`[messaging] Revoke failed: ${await handleError(err)}`);
	}
}

export function getCurrentDeviceId() {
	return _currentDeviceId;
}

export async function markMessageRead(conversationId, messageId) {
	try {
		await fetchWithTimeout(`/api/messages/${conversationId}/${messageId}/read`, {
			method: 'PATCH',
			headers: _authHeaders,
		});
	} catch { throw new Error('[messaging] Failed to mark message as read.') }
}

export async function loadConversations() {
	try {
		const res = await fetchWithTimeout('/api/conversations', { headers: _authHeaders });
		const { conversations } = await res.json();
		return conversations;
	} catch { throw new Error('[messaging] Failed to load conversations.') }
}

export async function backupPrivateKey(password) {
	if (!_keyPair) throw new Error('[messaging] Not initialised.');
	if (password.length < 12) {
		throw new Error('[messaging] Backup password must be at least 12 characters.');
	}
	return exportPrivateKeyEncrypted(_keyPair.privateKey, password);
}

export async function restoreFromBackup(backupJson, password) {
	if (!_currentUserId) throw new Error('[messaging] Not initialised (need userId).');

	const backup = JSON.parse(backupJson);
	const restoredDeviceId = backup.deviceId;
	if (!restoredDeviceId) throw new Error('[messaging] Backup missing deviceId field (is this a v2 backup?)');

	const privateKey = await importPrivateKeyFromBackup(backupJson, password);
	let response;

	try {
		response = await fetchWithTimeout(`/api/keys/devices/${_currentUserId}`, {
			headers: _authHeaders,
		});
	} catch {
		throw new Error('[messaging] Failed to fetch device keys during restore.');
	}

	const deviceDoc = response.devices.find((d) => d.deviceId === restoredDeviceId);

	if (!deviceDoc) {
		throw new Error(`[messaging] Device ${restoredDeviceId} not found in server records. It may have been revoked. Register this as a new device instead.`);
	}

	const isValid = await verifyDeviceKeySignature(
		deviceDoc.userId, deviceDoc.deviceId, deviceDoc.publicKeyPem, deviceDoc.signature
	);
	if (!isValid) throw new Error('[messaging] Signature verification failed during restore.');

	const publicKey = await importPublicKeyFromPem(deviceDoc.publicKeyPem);

	await saveDeviceMeta(_currentUserId, { deviceId: restoredDeviceId, deviceName: deviceDoc.deviceName });
	await saveKeyPair(restoredDeviceId, { privateKey, publicKey });

	_currentDeviceId = restoredDeviceId;
	_keyPair = { privateKey, publicKey };

	await clearAllSessionKeys();
	invalidateDeviceCache(_currentUserId);

	log(`[messaging] Restored device ${restoredDeviceId} from backup.`);
}

export async function rotateKeyPair() {
	if (!_currentUserId) throw new Error('[messaging] Not initialised.');

	log.warn('[messaging] Rotating key pair. Old messages will become undecryptable.');

	const { privateKey, publicKey } = await generateRSAKeyPair();
	const publicKeyPem = await exportPublicKeyToPem(publicKey);

	try {
		await fetchWithTimeout('/api/keys/register', {
			method: 'POST',
			headers: _authHeaders,
			body: JSON.stringify({ publicKeyPem }),
		});
	} catch (err) {
		throw new Error(`[messaging] Key rotation failed: ${await handleError(err)}`);
	}

	await deleteKeyPair(currentDeviceId);
	await saveKeyPair(_currentUserId, { privateKey, publicKey });
	_keyPair = { privateKey, publicKey };

	await clearAllSessionKeys();
	_deviceKeyCache.clear();

	log('[messaging] Key pair rotated successfully.');
}

export function signOut() {
	_currentUserId = null;
	_currentDeviceId = null;
	_getIdToken = null;
	_keyPair = null;
	_deviceKeyCache.clear();
}

function detectDeviceName() {
	if (typeof navigator === 'undefined') return 'Node';
	const ua = navigator.userAgent;
	if (/iPhone/.test(ua)) return 'iPhone';
	if (/iPad/.test(ua)) return 'iPad';
	if (/Android/.test(ua)) return 'Android';
	if (/Mac/.test(ua)) return 'Mac';
	if (/Windows/.test(ua)) return 'Windows PC';
	if (/Linux/.test(ua)) return 'Linux';
	return 'Unknown Device';
}
