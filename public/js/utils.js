import './equery.js';

const svgAttr = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
const log = EQuery.createLogger('Crowlock');
const Storage = EQuery.Storage('crowlock', 2);
const D = EQuery.elemt;
const padZero = (n) => n < 10 ? `0${n}` : n;
const count = (a, b, t = (v) => v) => Array.from({ length: b - a + 1 }, (_, i) => t(a + i));
const intersperse = (a, t = () => ' ') => a.reduce((acc, el, i) => i === a.length - 1 ? [...acc, el] : [...acc, el, t()], []);
const monthName = (n, s = 'long') => new Date(new Date().getFullYear(), n).toLocaleString('default', { month: s });
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const cachedImages = {};
const _svg = (cls) => new EQuery.svg().setSize(24, 24).setViewBox(0, 0, 24, 24).attr(svgAttr).addClass(cls);

const SVG = {
	close: cls => _svg(cls).path('M18 6 6 18', 'none').path('m6 6 12 12', 'none').domElement,
	star: cls => _svg(cls).path('M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z', 'currentColor'),
	add: cls => _svg(cls).path('M5 12h14', 'none').path('M12 5v14', 'none').domElement,
	home: cls => _svg(cls).path('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'none').path('M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'none').domElement,
	market: cls => _svg(cls).path('M16 10a4 4 0 0 1-8 0', 'none').path('M3.103 6.034h17.794', 'none').path('M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z', 'none').domElement,
	wallet: cls => _svg(cls).path('M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'none').path('M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4', 'none').domElement,
	activity: cls => _svg(cls).path('M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z', 'none').domElement,
	profile: cls => _svg(cls).path('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'none').circle(12, 7, 4, 'none').domElement,
	transaction: cls => _svg(cls).path('m17 2 4 4-4 4', 'none').path('M3 11v-1a4 4 0 0 1 4-4h14', 'none').path('m7 22-4-4 4-4', 'none').path('M21 13v1a4 4 0 0 1-4 4H3', 'none').domElement,
	chat: cls => _svg(cls).path('M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z', 'none').domElement,
	shoppingCart: cls => _svg(cls).path('M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12', 'none').circle(8, 21, 1, 'none').circle(19, 21, 1, 'none').domElement,
	image: () => _svg('w-4 h-4 mr-2').rect(3, 3, 18, 18, 'none', { rx: 2, ry: 2 }).circle(9, 9, 2, 'none').path('m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21', 'none').domElement,
	product: () => _svg('w-4 h-4 mr-2').path('M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z', 'none').path('M12 22V12', 'none').path('m7.5 4.27 9 5.15').polyline('3.29 7 12 12 20.71 7', 'none').domElement,
	upload: cls => _svg(cls).path('M12 3v12', 'none').path('m17 8-5-5-5 5').path('M21 15v4a2 2 0 0 1-2 2 H5a2 2 0 0 1-2-2v-4'),
	bug: cls => _svg(cls).path('M10 19.655A6 6 0 0 1 6 14v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 3.97', 'none').path('M14 15.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z', 'none').path('M14.12 3.88 16 2', 'none').path('M21 5a4 4 0 0 1-3.55 3.97', 'none').path('M3 21a4 4 0 0 1 3.81-4', 'none').path('M3 5a4 4 0 0 0 3.55 3.97', 'none').path('M6 13H2', 'none').path('m8 2 1.88 1.88', 'none').path('M9 7.13V6a3 3 0 1 1 6 0v1.13', 'none').domElement,
	reload: cls => _svg(cls).path('M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', 'none').path('M21 3v5h-5', 'none').domElement,
	chevronDown: () => _svg('size-4 opacity-50').path('m6 9 6 6 6-6', 'none').domElement,
	chevronUp: () => _svg('size-4 opacity-50').path('m6 18 6-6 6 6', 'none').domElement,
	search: cls => _svg(cls).path('m21 21-4.34-4.34', 'none').circle(11, 11, 8, 'none').domElement,
	slider: cls => _svg(cls).path('M10 5H3', 'none').path('M12 19H3', 'none').path('M14 3v4', 'none').path('M16 7v4', 'none').path('M21 12h-9', 'none').path('M21 19h-5', 'none').path('M21 5h-7', 'none').path('M8 10v4', 'none').path('M8 12v3', 'none').domElement,
	list: cls => _svg(cls).path('M3 5h.01', 'none').path('M3 12h0.1', 'none').path('M3 19h0.1', 'none').path('M8 5h13', 'none').path('M8 12h13', 'none').path('M8 19h13', 'none').domElement,
	grid: cls => _svg(cls).rect(3, 3, 18, 18, 'none', { rx: 2 }).path('M3 9h18', 'none').path('M3 15h18', 'none').path('M9 3v18', 'none').path('M15 3v18', 'none').domElement,
	settings: cls => _svg(cls).path('M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915', 'none').circle(12, 12, 3, 'none').domElement,
	badgeCheck: cls => _svg(cls).path('M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.75z', 'none').path('m9.5 12.5 2 2 4-4', 'none').domElement,
	bell: cls => _svg(cls).path('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'none').path('m13.73 21a2 2 0 0 1-3.46 0', 'none').domElement,
	shield: cls => _svg(cls).path('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'none').domElement,
	shieldCheck: cls => _svg(cls).path('M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'none').path('m9 12 2 2 4-4', 'none').domElement,
	users: cls => _svg(cls).path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'none').path('M16 3.128a4 4 0 0 1 0 7.744', 'none').path('M22 21v-2a4 4 0 0 0-3-3.87', 'none').circle(9, 7, 4, 'none').domElement,
	clock: cls => _svg(cls).circle(12, 12, 10, 'none').path('M12 6v6l4 2', 'none').domElement,
	lock: cls => _svg(cls).rect(3, 11, 18, 11, 'none', { rx: 2, ry: 2 }).path('M7 11V7a5 5 0 0 1 10 0v4', 'none').domElement,
	eye: cls => _svg(cls).path('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'none').circle(12, 12, 3, 'none').domElement,
	eyeoff: cls => _svg(cls).path('M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49', 'none').path('M14.084 14.158a3 3 0 0 1-4.242-4.242', 'none').path('M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143', 'none').path('m2 2 20 20', 'none').domElement,
	copy: cls => _svg(cls).rect(8, 8, 14, 14,  'none', { rx: 2, ry: 2 }).path('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2', 'none').domElement,
	edit: cls => _svg(cls).setViewBox(0, 0, 20, 20).path('m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z').path('M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z').domElement,
	delete: cls => _svg(cls).setViewBox(0, 0, 20, 20).path('M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z').domElement,
	award: cls => _svg(cls).path('M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 15.5a5.5 5.5 0 1 1 5.5-5.5 5.51 5.51 0 0 1-5.5 5.5z', 'none').path('M8.21 21l1.79-4 1.79 4L18 18l-4-1.79L18 14l-4-1.79L12 8l-1.79 4L6 14l4 1.79L8.21 21z', 'none').domElement,
	trendingUp: cls => _svg(cls).path('M3 17L9 11L13 15L21 7', 'none').path('M21 7h-6m0 0v6', 'none').domElement,
	arrowDownLeft: cls =>_svg(cls).path('M17 7 7 17', 'none').path('M17 17H7V7', 'none').domElement,
	arrowUpRight: cls => _svg(cls).path('M7 7h10v10', 'none').path('M7 17 17 7', 'none').domElement,
	heart: cls => _svg(cls).path('M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5', 'none').domElement,
	share: cls => _svg(cls).circle(18, 5, 3, 'none').circle(6, 12, 3, 'none').circle(18, 19, 3, 'none').line(8.59, 15.42, 13.51, 17.49, 'none').line(15.41, 8.59, 6.51, 10.49, 'none').domElement,
	ellipsis: cls => _svg(cls).circle(12, 4, 2, 'none').circle(12, 12, 2, 'none').circle(12, 20, 2, 'none').domElement,
	messageCircle: cls => _svg(cls).path('M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719', 'none').domElement,
	google: cls => _svg(cls).setViewBox(0, 0, 210, 210).path('M0,105C0,47.103,47.103,0,105,0c23.383,0,45.515,7.523,64.004,21.756l-24.4,31.696C133.172,44.652,119.477,40,105,40 c-35.841,0-65,29.159-65,65s29.159,65,65,65c28.867,0,53.398-18.913,61.852-45H105V85h105v20c0,57.897-47.103,105-105,105 S0,162.897,0,105z', 'none').domElement,
	imgPlaceholder: cls => _svg(cls).setViewBox(0, 0, 120, 120).path('M33.2503 38.4816C33.2603 37.0472 34.4199 35.8864 35.8543 35.875H83.1463C84.5848 35.875 85.7503 37.0431 85.7503 38.4816V80.5184C85.7403 81.9528 84.5807 83.1136 83.1463 83.125H35.8543C34.4158 83.1236 33.2503 81.957 33.2503 80.5184V38.4816ZM80.5006 41.1251H38.5006V77.8751L62.8921 53.4783C63.9172 52.4536 65.5788 52.4536 66.6039 53.4783L80.5006 67.4013V41.1251ZM43.75 51.6249C43.75 54.5244 46.1005 56.8749 49 56.8749C51.8995 56.8749 54.25 54.5244 54.25 51.6249C54.25 48.7254 51.8995 46.3749 49 46.3749C46.1005 46.3749 43.75 48.7254 43.75 51.6249Z').domElement,
	moreHorizontal: cls => _svg(cls).path('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'none').path('m13.73 21a2 2 0 0 1-3.46 0', 'none').domElement,
	shoppingBag: cls => _svg(cls).path('M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z', 'none').path('M3.103 6.034h17.794', 'none').path('M16 10a4 4 0 0 1-8 0', 'none').domElement,
	bookmark: cls => _svg(cls).path('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'none').path('m13.73 21a2 2 0 0 1-3.46 0', 'none').domElement,
	loader: cls => _svg(cls).path('M21 12a9 9 0 1 1-6.219-8.56', 'none').domElement,
	alert: cls => _svg(cls).path('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'none').path('M12 9v4', 'none').path('M12 17h.01', 'none').domElement,
	github: cls => _svg(cls).path('M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z', 'none').domElement
};

const Input = (attr = {}) => h('input', { 'data-slot': 'input', class: 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 border px-2 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-zinc-900 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl', ...attr });
const Button = (child, color = 'violet', attr = {}) => h('button', { 'data-slot': 'button', 'data-color': color, class: `inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 border border-violet-500/20 data-[color=violet]:bg-gradient-to-r data-[color=violet]:from-violet-600 data-[color=violet]:to-purple-600 data-[color=zinc]:bg-zinc-800 hover:from-violet-700 hover:to-purple-700 text-white data-color:shadow-lg data-color:shadow-violet-500/30 rounded-xl`, ...attr }, child);
const ImageWithFallback = (opt) => {
	if (opt.src.split(':')[0] === 'blob') return h('img', { class: 'w-full h-full object-contain', ...opt })
	const placeholder = h('div', { class: 'size-full aspect-square animate-pulse' }, SVG.imgPlaceholder('size-full'));
	if (!!cachedImages[opt.src]) {
		opt.src = cachedImages[opt.src];
		return h('img', { class: 'w-full h-full object-contain', ...opt })
	}

	convertURLToBlob(opt.src).then(blob => {
		cachedImages[opt.src] = blob;
		opt.src = blob;
		placeholder.before(h('img', { class: 'w-full h-full object-contain', ...opt })).remove();
	}).catch(e => {
		
	});

	return placeholder;
}

function lineBreak(text, count = 0) {
	if (count == 0) return document.createTextNode(text);
	const lines = [];
	const words = text.split(' ');
	if (words.length < count) return document.createTextNode(text);

	while (words.length > count) {
		lines.push(words.splice(0, count).join(' '));
	}

	lines.push(words.join(' '));

	return intersperse(lines, () => D('br'));
}

function h(tag, props, ...children) {
	let className = props?.class || props?.className;
	let style = props?.style;
	let attributes = { ...props };

	delete attributes.class;
	delete attributes.className;
	delete attributes.style;

	const flatChildren = children.flat(Infinity).map((c) => {
		return typeof c === 'string' || typeof c === 'number' ? String(c) : c;
	});

	return D(
		tag,
		flatChildren.length === 0 ? null : flatChildren,
		className,
		Object.keys(attributes).length ? attributes : undefined,
		style
	);
}

const Fragment = (props) => props.children;

function extractQuery() {
	let arr = {};
	let query = new URLSearchParams(window.location.search);
	query.forEach((v, k) => {
		arr[k] = v;
	});
	return arr;
}

function remainderQuery(d) {
	let query = extractQuery();
	let s = '';
	delete query[d];
	for (let key in query) {
		s += `&${key}=${query[key]}`;
	}
	return s;
}

function truncate(n) {
	const partsDef = [
		[(n / 1e12).toFixed(1), ' T'],
		[(n / 1e9).toFixed(1), ' B'],
		[(n / 1e6).toFixed(1), ' M'],
		[(n / 1e3).toFixed(1), ' K'],
		[n, '']
	];

	const parts = [];
	for (const [value, name] of partsDef) {
		if (value >= 1.1) {
			parts.push(`${value}${name}`);
		}
	}

	return parts[0] || 0;
}

async function Notice(content, type = 'info') {
	const elt = h('div', { class: 'px-3 py-2 mx-auto max-w-[840px] border text-sm animate-slideDown shadow-[2_2_0_#000] text-white data-[notice-type=success]:bg-green-700/80 data-[notice-type=success]:border-green-700 data-[notice-type=error]:bg-red-700/80 data-[notice-type=error]:border-red-700 data-[notice-type=info]:bg-blue-700/80 data-[notice-type=info]:border-blue-700 data-[notice-type=warn]:bg-yellow-600/80 data-[notice-type=warn]:border-yellow-600 z-50', 'data-slot': 'notice', 'data-notice-type': type }, content);
	const parent = EQuery('#container>div:nth-child(2)').removeClass('hidden').append(elt);
	await wait(4000);
	elt.removeClass('animate-slideDown').addClass('animate-toUp');
	await wait(400);
	elt.remove();
	parent[0].children.length === 0 && parent.addClass('hidden');
}

function Toast(content, type = 'info') {
	EQuery('[data-slot=notice]').remove();
	const close = h('button', { class: 'opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4', type: 'button' }, SVG.close('w-4 h-4'));
	const elt = h('div', { class: 'flex items-center justify-between px-3 py-2 mx-auto max-w-[840px] text-sm animate-slideDown shadow-[2_2_0_#000] text-white data-[toast-type=success]:bg-green-700 data-[toast-type=error]:bg-red-700 data-[toast-type=info]:bg-blue-700 data-[toast-type=warn]:bg-yellow-600 z-50', 'data-slot': 'toast', 'data-toast-type': type }, content, close);
	const parent = EQuery('#container>div:nth-child(2)').removeClass('hidden').append(elt);
	close.click(async () => {
	elt.removeClass('animate-slideDown').addClass('animate-toUp');
	await wait(400);
		elt.remove();
		parent[0].children.length === 0 && parent.addClass('hidden');
	});
}

async function handleError(err) {log.error(err)
	let msg = err == 'timedout' ? 'Failed to fetch: Timedout' : 'Failed to complete your request';
	if (err && typeof err.json === 'function') {
		try {
			const body = await err.json();
			msg = body.error || body.message || msg;
		} catch (e) {
			msg = err.statusText || msg;
		}
	} else if (err && err.message) {
		msg = err.message;
	}
	return msg;
}

function renderError(err) {
	const lines = err.stack.split('\n');
	const header = lines[0].replace(/^(\w+):/, '<strong class="error-type">$1</strong>:');
	const formattedFrames = lines.slice(1).map(line => {
		const linkRegex = /(https?:\/\/[^\s)]+?\/)?([^\/\s)]+:\d+:\d+)/;
		const linkedLine = line.replace(linkRegex, (match, urlPath, fileInfo) => {
			const fullUrl = match.trim();
			return `<a href="${urlPath + fileInfo.split(':')[0]}" target="_blank" class="text-[#a8c7fa] word-break-all overflow-hidden text-overflow-ellipsis text-decoration-underline" title="${fullUrl}">${fileInfo}</a>`;
		});

		return `\t<span class="formatted-stack-frame">${linkedLine}</span>\n`;
	}).join('');

	const str = `<pre class="w-full"><div class="flex justify-center mt-3 py-2 bg-red-600/20 border border-red-600/30"><span class="w-full overflow-x-auto"><span class="inline-block w-full text-center">${header}</span>\n${formattedFrames}</span></div></pre>`.trim();
	return (new DOMParser()).parseFromString(str, 'text/html').getElementsByTagName('pre');
}

async function toCrypto(value, currency = 'ethereum') {
	try {
		const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`);
		const data = await response.json();
		const priceInUsd = data[currency].usd;
		return value / priceInUsd;
	} catch (error) {
		log.error('Error fetching price:', error);
	}
}

async function toFlat(value, currency = 'ethereum') {
	try {
		const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`);
		const data = await response.json();
		const priceInUsd = data[currency].usd;
		return value * priceInUsd;
	} catch (error) {
		log.error('Error fetching price:', error);
	}
}

function fromMeta(prop) {
	return EQuery(`meta[name='${prop}']`).attr('content') || '';
}

function toBlob(dataUrl) {
	const [header, base64] = dataUrl.split(',');
	const mine = header.match(/:(.*?);/)[1];
	const binary = atob(base64);
	const array = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		array[i] = binary.charCodeAt(i);
	}

	return new Blob([array], { type: mine });
}

async function uploadFile({ filename, folder = 'user-uploads', blob }) {
	const { uploadUrl, fileKey } = await fetchWithTimeout('/static/generate-upload-url', {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({
		filename, folder,
		contentType: blob.type
	  })
	});

	const uploadResponse = await fetch(uploadUrl, {
	  method: 'PUT',
	  headers: {
		'Content-Type': blob.type
	  },
	  body: blob
	});

	if (uploadResponse.ok) {
		log('Upload complete! File stored in R2 as:', fileKey);
		return fileKey;
	} else {
		throw uploadResponse;
	}
}


async function saveKeyPair(deviceId, { privateKey, publicKey }) {
	await Storage.put('keyPairs', {
		deviceId,
		privateKey,
		publicKey,
		createdAt: Date.now(),
	});
}

async function loadKeyPair(deviceId) {
	return Storage.get('keyPairs', deviceId);
}

async function deleteKeyPair(deviceId) {
	await Storage.delete('keyPairs', deviceId);
}

async function hasKeyPair(deviceId) {
	const record = await loadKeyPair(deviceId);
	return record !== null;
}

async function saveDeviceMeta(uid, { deviceId, deviceName }) {
	await Storage.put('deviceMeta', { deviceId, uid, deviceName });
}

async function loadDeviceMeta(uid) {
	const record = await Storage.get('deviceMeta', uid);
	return record ? { deviceId: record.deviceId, uid: record.uid, deviceName: record.deviceName } : null
}

async function saveSessionKey(conversationId, aesKey) {
	await Storage.put('sessionKeys', {
		aesKey,
		createdAt: Date.now(),
	}, conversationId);
}

async function loadSessionKey(conversationId) {
	const record = await Storage.get('sessionKeys', conversationId);
	return record ? record.aesKey : null;
}

async function clearAllSessionKeys() {
	await Storage.clear('sessionKeys');
}

async function wipeAllLocalData() {
	await Promise.all(['keyPairs', 'sessionKeys', 'deviceMeta'].map(t => Storage.clear(t)));
}

async function convertURLToBlob(url) {
	const response = await fetch(url);
	if (!response.ok) throw response;
	const blobData = await response.blob();
	const blobUrl = URL.createObjectURL(blobData);
	return blobUrl;
}

function dataURLtoFile(dataurl, filename) {
	const arr = dataurl.split(',');
	const mime = arr[0].match(/:(.*?);/)[1];
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}

	return new File([u8arr], filename, { type: mime });
}

function isImage(dataUrl) {
	const [header, base64] = dataUrl.split(',');
	const mine = header.match(/:(.*?);/)[1];
	return 'image' === mine.split('/')[0];
}

function isVideo(dataUrl) {
	const [header, base64] = dataUrl.split(',');
	const mine = header.match(/:(.*?);/)[1];
	return 'video' === mine.split('/')[0];
}

async function fetchWithTimeout(url, options = {}, timeout = 30e4, responseType = 'json') {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort('timedout'), timeout);

	const response = await fetch(`${location.protocol}//crowlock.onrender.com${url}`, {
	// const response = await fetch(`https://laughing-zebra-vrgwpg47p9vfx94-3000.app.github.dev${url}`, {
		...options,
		signal: controller.signal
	});
	clearTimeout(id);

	if (!response.ok) {
		throw response;
	}
	return response[responseType]();
}

export { log, D, Storage, SVG, Button, Input, ImageWithFallback, lineBreak, h, Fragment, extractQuery, remainderQuery, truncate, toBlob, toFlat, toCrypto, dataURLtoFile, isImage, isVideo, saveKeyPair, loadKeyPair, deleteKeyPair, hasKeyPair, saveDeviceMeta, loadDeviceMeta, saveSessionKey, loadSessionKey, clearAllSessionKeys, wipeAllLocalData, uploadFile, fetchWithTimeout, fromMeta, handleError, renderError, Notice, Toast, padZero, count, monthName, wait };
