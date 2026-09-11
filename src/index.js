// src/index.js

const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const log = require('./logger.js');
const htmlRes = require('./htmlRes.js');
require('dotenv').config();

async function createApp() {
	log(`v${process.env.VERSION}`);

	const app = express();

	app.use(helmet({
		noSniff: true,
		crossOriginOpenerPolicy: false,
		originAgentCluster: false,
		contentSecurityPolicy: {
			directives: {
				'img-src': ['*', 'blob:', 'data:'],
				'script-src': ['\'self\'', 'https://esm.run', 'https://cdn.jsdelivr.net', 'https://accounts.google.com/gsi/client', 'https://accounts.google.com'],
				'connect-src': ['\'self\'', 'https://accounts.google.com/gsi/', '*'],
				'frame-src': ['\'self\'', 'https://accounts.google.com/gsi/', 'https://verify.walletconnect.org'],
				'default-src': ['\'self\'', 'https://crowlock.onrender.com/'],
			},
		},
		frameguard: { action: 'deny' },
		hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
	}));

	app.use(express.json({ limit: '64kb' }));

	app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

	app.use(express.static(path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist/' : 'public/')));

	app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

	app.get(/.*/, htmlRes);

	app.use((err, req, res, next) => {
		const status = err.statusCode || 500;
		const message = err.message;
		(process.env.NODE_ENV === 'production' ? log.error(status, err) : log.error(status, err, `\n${err?.stack}`));

		res.status(status).json({ success: false, status, message });
	});

	if (process.env.USE_VERCEL) return app;

	const httpsOptions = {
		key: process.env.HTTPS_KEY,
		cert: process.env.HTTPS_CERT
	};

	const HTTP_PORT = process.env.HTTP_PORT || 8080;
	const HTTPS_PORT = process.env.HTTPS_PORT || 8443

	const httpServer = http.createServer(app);
	httpServer.listen(HTTP_PORT, () => log(`HTTP server running on port ${HTTP_PORT}`));
	
	if (process.env.USE_HTTPS)
		{ const httpsServer = https.createServer(httpsOptions, app); httpsServer.listen(HTTPS_PORT, () => log(`HTTPS server running on port ${HTTPS_PORT}`)); }

	return app;
}

module.exports = createApp();
