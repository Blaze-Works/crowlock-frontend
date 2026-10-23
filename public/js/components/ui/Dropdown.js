import { D, SVG, wait } from '../../utils.js';

export default class Dropdown {
	constructor(app, options, ev) {
		this.app = app;
		this.overlay = D('div', null, 'fixed inset-0 bg-black bg-opacity-50 z-50').click((e) => e.currentTarget == e.target && history.back());;
		this.elt = D('div', null, 'absolute bg-zinc-900 w-56 border border-zinc-950 p-1 z-50 rounded-md outline-1 -outline-offset-1 outline-white/10 transition transition-discrete overflow-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in');

		const content = this.buildContent(options);
		this.elt.append(content.length === 1 && content.hasClass('py-1') ? content : D('div', content, 'py-1', { role: 'menu-category' })).css(`top: ${ev.pageY}px; left: ${Math.min(window.innerWidth - 254, Math.max(ev.pageX, 30))}px;`);

		(async () => {
			this.app.display.mainContent.after([this.elt, this.overlay]);
			await wait(400);
			this.elt.removeClass('animate-in');
		})();

		this.app.pushState();
		this.app.modals.push(this);
	}

	buildContent(options) {
		if (Array.isArray(options)) {
			return options.map(category => D('div', this.buildContent(category), 'py-1', { role: 'menu-category' }))
		}

		const elts = [];
		for (const [key, value] of Object.entries(options)) {
			if (typeof value[1] !== 'function') elts.push(D('p', key, 'text-2.5'), D('p', value, 'text-gray-400 font-bold text-overflow-ellipsis text-2 overflow-hidden whitespace-nowrap'))
			else if (Array.isArray(value)) elts.push(D('div', [SVG[value[0]]('size-5 mr-3'), key], 'flex px-4 py-2 text-sm text-gray-300 focus:bg-white/5 focus:text-white focus:outline-hidden', { role: 'menuitem' }).click(() => value[1](this)));
			else elts.push(D('div', key, 'block px-4 py-2 text-sm text-gray-300 focus:bg-white/5 focus:text-white focus:outline-hidden', { role: 'menuitem' }).click(() => value(this)));
		}
		return elts;
	}

	close(fn) {
		(async () => {
			this.elt.addClass('animate-out');
			await wait(400);
			this.elt.remove();
			this.overlay.remove();
		})();
		fn && fn();
		this.app.modals.splice(this.app.modals.indexOf(this), 1);
	}
}
