export function bufToBase64(buf) {
	return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function base64ToBuf(b64) {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

export function pemToArrayBuffer(pem) {
	const b64 = pem
		.replace(/-----BEGIN [^-]+-----/, '')
		.replace(/-----END [^-]+-----/, '')
		.replace(/\s+/g, '');
	return base64ToBuf(b64);
}

export function arrayBufferToPem(buf, label = 'PUBLIC KEY') {
	const b64 = bufToBase64(buf);
	const chunks = b64.match(/.{1,64}/g).join('\n');
	return `-----BEGIN ${label}-----\n${chunks}\n-----END ${label}-----`;
}

export async function generateRSAKeyPair() {
	const keyPair = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['encrypt', 'decrypt']);
	return keyPair;
}

export async function exportPublicKeyToPem(publicKey) {
	const spki = await crypto.subtle.exportKey('spki', publicKey);
	return arrayBufferToPem(spki, 'PUBLIC KEY');
}

export async function importPublicKeyFromPem(pem) {
	const spki = pemToArrayBuffer(pem);
	return crypto.subtle.importKey('spki', spki, { name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['encrypt']);
}

let _serverSigningKey = null;

export async function loadServerSigningKey(pem) {
	const spki = pemToArrayBuffer(pem);
	_serverSigningKey = await crypto.subtle.importKey('spki', spki, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['verify']);
}

export async function verifyDeviceKeySignature(userId, deviceId, publicKeyPem, signatureBase64) {
	if (!_serverSigningKey) {
		throw new Error('[crypto] Server signing key not loaded. Call loadServerSigningKey() first.');
	}
	const payload = new TextEncoder().encode(`${userId}:${deviceId}:${publicKeyPem}`);
	const signature = base64ToBuf(signatureBase64);
	return crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, _serverSigningKey, signature, payload);
}

export async function verifyPublicKeySignature(userId, publicKeyPem, signatureBase64) {
	if (!_serverSigningKey) {
		throw new Error('[crypto] Server signing key not loaded. Call loadServerSigningKey() first.');
	}

	const payload = new TextEncoder().encode(`${userId}:${publicKeyPem}`);
	const signature = base64ToBuf(signatureBase64);

	return crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, _serverSigningKey, signature, payload);
}

export async function generateAESKey() {
	return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function exportAESKey(aesKey) {
	return crypto.subtle.exportKey('raw', aesKey);
}

async function importAESKey(rawBuf) {
	return crypto.subtle.importKey('raw', rawBuf, { name: 'AES-GCM' }, false, ['decrypt']);
}

export async function encryptMessage({ plaintext, devices }) {
	if (!devices || devices.length === 0) {
		throw new Error('[crypto] encryptMessage: at least one device must be provided.');
	}

	const aesKey = await generateAESKey();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const rawAESKey = await exportAESKey(aesKey);
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, new TextEncoder().encode(plaintext));

	const wrappedKeys = await Promise.all(
		devices.map(async ({ deviceId, publicKey }) => {
			const encKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAESKey);
			return [deviceId, bufToBase64(encKey)];
		})
	);

	return { ciphertext: bufToBase64(ciphertext), iv: bufToBase64(iv), encryptedKeys: Object.fromEntries(wrappedKeys) };
}

export async function decryptMessage({ ciphertext, iv, encryptedKeyForThisDevice, privateKey }) {
	if (!encryptedKeyForThisDevice) {
		throw new Error('[crypto] No encrypted key found for this device. The message was sent before this device was registered, or this device has been revoked.');
	}

	const rawAESKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, base64ToBuf(encryptedKeyForThisDevice));
	const aesKey = await importAESKey(rawAESKey);
	const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(base64ToBuf(iv)), tagLength: 128 }, aesKey, base64ToBuf(ciphertext));

	return new TextDecoder().decode(plainBuf);
}

export async function exportPrivateKeyEncrypted(privateKey, password, deviceId) {
	const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
	const salt = crypto.getRandomValues(new Uint8Array(32));
	const iv = crypto.getRandomValues(new Uint8Array(12));

	const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
	const wrappingKey = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
	const encryptedPrivateKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, pkcs8);

	return JSON.stringify({
		version: 1,
		deviceId: deviceId || 'unknown',
		kdf: 'PKDF2',
		kdfIterations: 600_000,
		kdfHash: 'SHA-256',
		salt: bufToBase64(salt),
		iv: bufToBase64(iv),
		encryptedPrivateKey: bufToBase64(encryptedPrivateKey),
	}, null, 2);
}

export async function importPrivateKeyFromBackup(backupJson, password) {
	const backup = JSON.parse(backupJson);

	if (backup.version !== 1) {
		throw new Error(`[crypto] Unsupported backup version: ${backup.version}`);
	}

	const salt = base64ToBuf(backup.salt);
	const iv = base64ToBuf(backup.iv);
	const enc = base64ToBuf(backup.encryptedPrivateKey);

	const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);

	const wrappingKey = await crypto.subtle.deriveKey({ name: backup.kdf, salt, iterations: backup.kdfIterations, hash: backup.kdfHash }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);

	let pkcs8;
	try {
		pkcs8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, wrappingKey, enc);
	} catch {
		throw new Error('[crypto] Decryption failed. Incorrect password or corrupted backup.');
	}

	return crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['decrypt']);
}

export function generateDeviceId() {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
