import { D, SVG } from '../utils.js';

export default class NavigationBar {
	constructor(app) {
		this.app = app;
	}

	init() {
		this.states = Object.keys(this.app.inNav);
		this.currentState = null;

		this.navBtns = (() => {
			const _obj = {};
			this.states.forEach(b => {
				_obj[b] = D('button', [
					D('div', [SVG[b]('size-6 transition-colors text-gray-400')], 'relative z-10'),
					D('span', this.app.inNav[b].name, 'relative z-10 text-xs transition-colors text-gray-400')
				], 'relative flex flex-col items-center gap-1 py-2 px-1 rounded-x1 transition-all [&_span]:text-gray-400 [&_svg]:text-gray-400 ', { 'data-category': b, 'data-route': `/${b}`, 'data-selected': 'inactive' }).click(e => {
					e.preventDefault();
					this.app.navigateTo(`/${b}`);
				});
			});
			return _obj;
		})();

		this.navOutline = D('div', null, 'absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl animate-fadeIn');
		this.nav = D('div', [
			D('div', [
				D('div', [
					D('div', Object.values(this.navBtns), 'grid gap-1 p-2')
				], 'overflow-hidden')
			], 'max-w-2xl mx-auto')
		], 'fixed left-0 z-20 data-[orientation=portrait]:right-0 data-[orientation=landscape]:top-[50%] data-[orientation=landscape]:translate-y-[-50%] data-[orientation=portrait]:bottom-0 [&>div]:data-[orientation=portrait]:px-4 [&>div]:data-[orientation=portrait]:pb-4 [&>div]:data-[orientation=portrait]:py-4 [&>div]:data-[orientation=landscape]:pl-4 [&_.grid]:data-[orientation=landscape]:grid-rows-4 [&_.grid]:data-[orientation=portrait]:grid-cols-4 [&>div>div]:data-[orientation=portrait]:bg-zinc-900/20 [&>div>div]:data-[orientation=portrait]:backdrop-blur-xl [&>div>div]:data-[orientation=portrait]:border [&>div>div]:data-[orientation=portrait]:border-violet-500/20 [&>div>div]:data-[orientation=portrait]:rounded-2xl [&>div>div]:data-[orientation=portrait]:shadow-[0_4px_30px_rgba(139,92,246,.2)] [&[data-orientation=landscape]_button_.absolute]:!-translate-x-32 [&[data-orientation=landscape]_[data-selected=active]_span]:text-violet-400 [&[data-orientation=landscape]_[data-selected=active]_svg]:text-violet-400 [&[data-orientation=portrait]_[data-selected=active]_span]:text-white max-sm:[&[data-orientation=portrait]_span]:hidden max-sm:[&[data-orientation=portrait]_button>div:first-child]:py-3 [&[data-orientation=portrait]_[data-selected=active]_svg]:text-white');

		this.show();
		this.resize();
		window.addEventListener('resize', () => this.resize());
	}

	setActive(category) {
		this.currentState = category;
		if (this.states.indexOf(this.currentState) == -1) {
			this.currentState = 'home';
		} else this.moveElementWithAnimation(this.navOutline, this.navBtns[this.currentState]);

		this.nav.find('button svg, button span').addClass('text-gray-400').removeClass('text-white');
		this.nav.find('button').attr({ 'data-selected': 'inactive' });
		this.navBtns[this.currentState].find(`svg, span`).removeClass('text-gray-400').addClass('text-white');
		this.navBtns[this.currentState].attr({ 'data-selected': 'active' });
	}

	moveElementWithAnimation(child, parent) {
		const firstRect = child.getBoundingClientRect();
		parent.append(child);

		const lastRect = child.getBoundingClientRect();

		if (firstRect == undefined || lastRect == undefined) return;

		const dx = firstRect.left - lastRect.left;
		const dy = firstRect.top - lastRect.top;

		child.css(`transition: none;transform: translate(${dx}px, ${dy}px)`);
		requestAnimationFrame(() => {
			child.css('transition: transform .5s linear(0, 0.402, 0.733, 0.958, 1.08, 1.124, 1.112, 1.072, 1.028, 0.996, 0.978, 0.973, 0.978, 0.987, 0.996, 1, 1);transform: translate(0, 0)');
			child[0].addEventListener('transitionend', () => {
				child.css('transform: none;transition-duration: .8s;');
			}, { once: true });
		});
	}

	resize() {
		const isLandscape = window.innerWidth > 1280 && window.innerWidth > window.innerHeight;
		this.nav.attr({ 'data-orientation': isLandscape ? 'landscape' : 'portrait' });
		this.app.display.container.find('[data-gradient-overlay]').css(isLandscape && !this.isHidden ? 'padding-left: 100px' : 'padding-left: 0');
	}

	hide() {
		this.isHidden = true;
		this.nav.remove();
		this.app.display.container.find('[data-gradient-overlay]').css('padding-left: 0');
	}

	show() {
		this.isHdden = false;
		this.app.display.container.append(this.nav);
		this.resize();
	}
}
