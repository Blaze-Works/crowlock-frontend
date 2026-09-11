// src/htmlRes.js

const fs = require('fs');

async function fromPath(url) {
	let title;
	const parts = url.split('/');

	switch (parts[1]) {
		case 'home':
			title = `Home | `;
			break;

		case 'transactions':
			title = 'Transaction | ';
			break;

		case 'chat':
			title = 'Chat | ';
			break;

		case 'profile':
			title = 'Profile | ';
			break;
	}
	return title;
}

module.exports = async function (req, res, next) {
	const icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGhlaWdodD0iODAiIHdpZHRoPSI4MCIgdmlld0JveD0iMCAwIDI0IDI0IiBjbGFzcz0icmVsYXRpdmUgei0xMCBteC1hdXRvIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48ZGVmPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM4YjVjZjYiPjwvc3RvcD48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjMDg0ZmMiPjwvc3RvcD48L2xpbmVhckdyYWRpZW50PjwvZGVmPjxyZWN0IHg9IjMiIHk9IjExIiB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIGZpbGw9Im5vbmUiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxwYXRoIGQ9Ik03IDExVjdhNSA1IDAgMCAxIDEwIDB2NCIgZmlsbD0ibm9uZSI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAyIEwxNCA1IEwxMiA4IiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEuNSI+PC9wYXRoPjxwYXRoIGQ9Ik0xMiAyIEwxMCA1IEwxMiA4IiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEuNSI+PC9wYXRoPjwvc3ZnPg==';
	const title = await fromPath(req.url);
	const def = {
		title: `${title || ''}Crowlock`,
		url: 'https://crowlock.vercel.app',
		des: 'Trade with confidence.'
	};

	const entryFile = process.env.NODE_ENV === 'production' ? JSON.parse(fs.readFileSync('./dist/.vite/manifest.json', 'utf8'))['public/js/app.js'].file : '/js/app.js'

	const response = ({ title, image, url, des }) => `<!DOCTYPE html><html lang="en-gb"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><meta name="referrer" content="strict-origin-when-cross-origin" /><title>${title}</title><meta name="description" content="${des}"><meta property="og:title" content="${title}" /><meta property="og:type" content="website" /><meta property="og:url" content="${url}" /><meta property="og:description" content="${des}" /><meta property="envType" content="${process.env.NODE_ENV}" /><link rel="icon" type="image/svg" href="${icon}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"><script src="https://accounts.google.com/gsi/client" async defer></script><script src="/js/tailwind.js"></script><script type="module" src="${entryFile}"></script></head><body><div id="container"></div></body></html>`;

	res.send(response(def));
};
