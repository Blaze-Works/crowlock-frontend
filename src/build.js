// src/build.js

const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const limit = pLimit(2);
const { minify } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');
const logger = require('./core/logger');

const srcDir = path.join('./public');
const distDir = path.join('./dist');
const nonIncluded = ['/js/equery.d.ts'];
const skipObfucate = ['tailwind.js'];
const allJsFiles = [];
const log = logger.createLogger('Build');

async function collect(dir) {
	const files = await fs.readdir(dir);

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = await fs.stat(fullPath);

		if (stat.isDirectory()) {
			await collect(fullPath);
		} else if (skipObfucate.indexOf(file) !== -1) {
			return;
		} else if (file.endsWith('.js')) {
			allJsFiles.push(fullPath);
		}
	}
}

async function processDirectory(dir) {
	await collect(dir);

	await Promise.all(allJsFiles.map(fullPath => limit(() => trackDuration(async () => {
		const stat = await fs.stat(fullPath);
		const start = performance.now();
		const originalCode = await fs.readFile(fullPath, 'utf8');

		try {
			const minified = await minify(originalCode, { compress: { passes: 2 }, mangle: { toplevel: true } });

			const obfuscated = JavaScriptObfuscator.obfuscate(minified.code, {
				compact: true,
				controlFlowFlattening: false,
				numbersToExpressions: false,
				simplify: true,
				stringArray: true,
				stringArrayThreshold: 0.3
			});

			await fs.writeFile(fullPath, obfuscated.getObfuscatedCode());
		} catch (err) {
			log.error(`Error processing ${fullPath}:`, err);
		}

		return { fullPath, start };
	}))));
}

async function trackDuration(promiseFactory) {
	try {
		const { fullPath, start } = await promiseFactory() || { fullPath: null, start: 0 };
		fullPath && log(`Processed: ${fullPath} - ${(performance.now() - start).toFixed(2)} ms`);
	} catch (error) {
		throw error;
	}
}

async function build() {
	log('Cleaning dist directory...');
	await fs.emptyDir(distDir);

	log('Copying source to dist...');
	await fs.copy(srcDir, distDir);
	await Promise.all(nonIncluded.map(async i => await fs.remove(path.join(distDir, i))));

	log('Starting minification and obfuscation...');

	const start = performance.now();
	await processDirectory(distDir);

	log('Build completed successfully, Elapsed time: ', (performance.now() - start).toFixed(2), 'ms');
}

module.exports = build();
