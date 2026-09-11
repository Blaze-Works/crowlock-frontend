self.importScripts('exponea-sw.js');
'use strict';

(() => {
	const CACHE_NAME = 'crowlock-pwa-cache-v1';
	const PENDING_REQUEST_TIMEOUT_MS = 3e4;
	let assetUrlMap = /* @__PURE__ */ new Map();
	let pendingRequests = /* @__PURE__ */ new Map();
	let assetMapInitialized = false;

	function handleAssetUrlMapUpdate(assets) {
		assetMapInitialized = false;
		assetUrlMap.clear();

		for (const [path, url] of Object.entries(assets)) {
			assetUrlMap.set(path, url);
			resolvePendingRequests(path, url);
		}

		assetMapInitialized = true;
		releaseUnmatchedPendingRequests();
	}

	function waitForAsset(pathname, request) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				removePendingRequest(pathname, entry);
				resolve(new Response("Asset not available", { status: 408 }));
			}, PENDING_REQUEST_TIMEOUT_MS);
			const entry = { resolve, reject, timer, request };
			if (!pendingRequests.has(pathname)) {
				pendingRequests.set(pathname, []);
			}
			pendingRequests.get(pathname).push(entry);
		});
	}

	function resolvePendingRequests(pathname, s3Url) {
		const entries = pendingRequests.get(pathname);
		if (!entries || entries.length === 0) return;
		pendingRequests.delete(pathname);
		for (const entry of entries) {
			clearTimeout(entry.timer);
			fetch(s3Url).then(entry.resolve, entry.reject);
		}
	}

	function releaseUnmatchedPendingRequests() {
		for (const [pathname, entries] of pendingRequests) {
			if (!assetUrlMap.has(pathname)) {
				pendingRequests.delete(pathname);
				for (const entry of entries) {
					clearTimeout(entry.timer);
					entry.resolve(fetch(entry.request ?? pathname));
				}
			}
		}
	}

	function removePendingRequest(pathname, entry) {
		const entries = pendingRequests.get(pathname);
		if (!entries) return;
		const idx = entries.indexOf(entry);
		if (idx !== -1) entries.splice(idx, 1);
		if (entries.length === 0) pendingRequests.delete(pathname);
	}

	function looksLikeFilePath(pathname) {
		const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
		return lastSegment.includes('.');
	}

	function shouldInterceptRequest(request, origin) {
		const url = new URL(request.url);
		if (url.origin !== origin) return false;
		if (url.pathname === '/') return false;
		if (request.method !== 'GET') return false;
		if (request.mode === 'navigate') return looksLikeFilePath(url.pathname);
		return true;
	}

	function resolveAssetPathname(url) {
		try {
			return decodeURIComponent(url.pathname);
		} catch {
			return url.pathname;
		}
	}

	self.addEventListener('activate', (event) => {
		const cacheWhitelist = [CACHE_NAME];
		event.waitUntil(
			(async function () {
				const keyList = await caches.keys();
				await Promise.all(keyList.map(key => {
					if (!cacheWhitelist.includes(key)) {
						console.log('[service-worker] Deleting cache: ' + key);
						return caches.delete(key);
					}
				}));

				if ('navigationPreload' in self.registration) {
					await self.registration.navigationPreload.enable();
				}
			})()
		);

		self.clients.claim();
	});

	self.addEventListener('install', function () {
		self.skipWaiting();
	});

	self.addEventListener('message', (event) => {
		const data = event.data;
		if (data && data.type === 'update-asset-url-map') {
			const assets = data.assets;
			if (!assets || typeof assets !== 'object') return;
			handleAssetUrlMapUpdate(assets);
		}
	});

	self.addEventListener('fetch', (event) => {
		const { request } = event;
		if (!shouldInterceptRequest(request, self.location.origin)) return;
		const url = new URL(request.url);
		const pathname = resolveAssetPathname(url);
		const s3Url = assetUrlMap.get(pathname);

		if (s3Url) {
			event.respondWith(fetch(s3Url));
			return;
		}
		if (!assetMapInitialized) {
			event.respondWith(waitForAsset(pathname, request));
			return;
		}
	});
});