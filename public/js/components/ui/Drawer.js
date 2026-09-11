import { D, SVG, wait } from '../../utils.js';

export default class Drawer {
	constructor(app, data) {
		this.app = app;
		this.data = data;
		this.overlay = D('div', null, 'fixed inset-0 bg-black bg-opacity-50 z-30');
		this.closeBtn = D('button', SVG.close('h-6 w-6'), 'absolute top-3 right-4');
		this.header = D('div', D('div', [
			D('div', null, 'w-10 h-1 bg-gray-400 z-20 mt-1 hover:bg-gray-200 rounded-3xl shadow-xl'), data.header && D('h2', data.header, 'font-semibold text-gray-300 text-lg'),
		], `flex flex-col items-center p-2 ${data.header !== undefined ? 'border-b ' : ''}border-gray-500`));
		this.content = data.content instanceof EQuery ? data.content.addClass('flex-1 z-10 pb-12 overflow-y-auto') : D('div', data.content, 'flex-1 z-10 pb-12 overflow-y-auto')
		this.drawer = D('div', [
			this.header, this.closeBtn, this.content
		], 'relative flex flex-col h-full bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden max-w-[480px] mx-auto mt-0 mb-0 shadow-xl')
		this.elt = D('div', this.drawer, 'fixed bottom-0 data-[orientation=portrait]:inset-x-0 data-[orientation=portrait]:top-[30%] data-[orientation=landscape]:top-0 data-[orientation=landscape]:right-0 z-50 translate-y [&>div]:data-[orientation=landscape]:min-w-[400px] [&>div]:data-[orientation=portrait]:rounded-t-3xl [&_.h-1]:data-[orientation=landscape]:hidden data-[orientation=portrait]:animate-slideUp data-[orientation=landscape]:animate-slideLeft');

		this.closeBtn.click(() => history.back());
		this.overlay.click(() => history.back());
		this.elt.click(e => e.currentTarget == e.target && history.back());

		let startY = 0, pos1, pos2;

		this.header.touchstart(e => {
			startY = pos2 = e.touches[0].clientY;

			this.drawer.removeAttr('style');
			this.elt.removeClass('transition-all').removeAttr('style');
		}, { passive: true });

		this.header.touchmove(e => {
			pos1 = pos2 - e.touches[0].clientY;
			pos2 = e.touches[0].clientY;
			const dy = this.elt[0].offsetTop - pos1;
			if (e.cancelable) e.preventDefault();
			dy > window.innerHeight * 0.15 && this.elt.css(`top: ${dy}px !important`);
		}, { passive: false });

		this.header.touchend(e => {
			const endY = e.changedTouches[0].clientY;
			const dy = endY - startY;
			this.drawer.removeAttr('style');
			this.elt.removeAttr('style');

			if (Math.abs(dy) > 150) {
				if (dy > 0) history.back();
				else if (dy < 0) { this.elt.css('top: 30px !important;'); this.drawer.css('max-width: 640px') }
			}
		});

		this.elt.touchstart(e => {
			if (this.content[0].scrollTop > 0) return;
			startY = pos2 = e.touches[0].clientY;

			this.drawer.removeAttr('style');
			this.elt.removeClass('transition-all').removeAttr('style');
		}, { passive: true });

		this.elt.touchmove(e => {
			if (this.content[0].scrollTop > 0) return;
			pos1 = pos2 - e.touches[0].clientY;
			if (pos1 > 0) return;
			pos2 = e.touches[0].clientY;
			const dy = this.elt[0].offsetTop - pos1;
			if (e.cancelable) e.preventDefault();
			dy > window.innerHeight * 0.15 && this.elt.css(`top: ${dy}px !important`);
		}, { passive: false });

		this.elt.touchend(e => {
			if (this.content[0].scrollTop > 0) return;
			const endY = e.changedTouches[0].clientY;
			const dy = endY - startY;
			this.drawer.removeAttr('style');
			this.elt.removeAttr('style');

			if (Math.abs(dy) > 150) {
				if (dy > 0) history.back();
				else if (dy < 0) { this.elt.css('top: 30px !important;'); this.drawer.css('max-width: 640px') }
			}
		});

		this.app.currentDrawer?.close();
		this.app.currentDrawer = this;
		this.app.pushState();
		this.resize();
		(async () => {
			this.app.display.mainContent.after([this.overlay, this.elt]);
			await wait(400);
			this.elt.removeClass(this.isLandscape ? 'animate-slideLeft' : 'animate-slideUp');
		})();
		window.addEventListener('resize', () => this.resize());
	}

	resize() {
		this.isLandscape = window.innerWidth > 1280 && window.innerWidth > window.innerHeight;
		this.elt.attr({ 'data-orientation': this.isLandscape ? 'landscape' : 'portrait' });
		this.app.display.container.find('[data-gradient-overlay]').css(this.isLandscape && !!this.app.currentDrawer ? 'padding-right: 400px' : 'padding-right: 0');
	}

	close() {
		this.elt.off(['touchstart', 'touchmove', 'touchend']);
		this.app.display.container.find('[data-gradient-overlay]').css('padding-right: 0')
		this.header.off(['touchstart', 'touchmove', 'touchend']);
		this.app.currentDrawer = null;
		this.data.onClose && this.data.onClose();
		(async () => {
			this.elt.addClass('transition-all').css(this.isLandscape ? 'right: -100%' : 'top: 100%');
			await wait(150);
			this.elt.remove();
			this.overlay.remove();
		})();
	}
}
