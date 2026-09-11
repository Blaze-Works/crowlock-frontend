import { h, SVG } from '../../utils.js';

export default class Screen {
	constructor(app, name) {
		this.app = app;
		this.name = name;
		this.title = `${this.name} | Crowlock`;
		this.size = 2;
		this.opened = false;
	}

	init() {
		this.opened = true;
		this.href = window.location.href;
		this.container = h('div', { class: 'flex-grow pb-24 animate-slideUp' });
		this.header = h('div', { class: 'sticky top-6 mb-6 pt-4 z-10 animate-slideDown before:fixed before:block before:top-0 before:left-0 before:right-0 data-[backdrop=inactive]:before:opacity-0 data-[backdrop=active]:before:opacity-1 before:transition-[opacity] before:duration-50 before:h-28 before:-z-10 before:bg-gradient-to-br before:from-violet-950/20 before:to-black/20 before:shadow-[0_4px_30px_rgba(0,0,0,.1)] before:border before:border-black/10 before:backdrop-blur-md', 'data-backdrop': 'inactive' });

		this.guiIcon = {
			'feed': h('div', { class: 'relative w-[200px] h-[200px] mb-8' }, h('div', { class: 'absolute w-[140px] h-[100px] bg-violet-700/10 border border-violet-700/30 rounded-[12px] top-5 left-2.5 p-3 flex flex-col justify-between' },h('div', { class: 'w-10 h-10 bg-violet-700/20 rounded-full' }), h('div', { class: 'h-[4px] w-[80%] bg-violet-700/20 rounded-[2px]' }), h('div', { class: 'h-[3px] w-[60%] bg-violet-700/15 rounded-[2px]' })), h('div', { class: 'absolute w-[140px] h-[100px] bg-blue-600/10 border border-blue-600/30 rounded-[12px] bottom-5 right-2.5 p-3 flex flex-col justify-between' }, h('div', { class: 'w-10 h-10 bg-blue-600/20 rounded-full' }), h('div', { class: 'h-[4px] w-[80%] bg-blue-600/20 rounded-[2px]' }), h('div', { class: 'h-[3px] w-[60%] bg-blue-600/15 rounded-[2px]' }))),
			'market': h('div', { class: 'w-20 h-20 bg-[rgba(139, 92, 246, 0.1)] flex items-center justify-center mb-6' }, SVG.shoppingCart('size-full')),
			'wallet': '',
			'activity': '',
			'message': '',
		}

		let startY = 0, pos1, pos2, top;

		// TODO: Need to improve

		/*
		this.container.touchstart(e => {
			if (window.pageYOffset > 0) return;
			startY = pos2 = e.touches[0].clientY;
			top = this.container.getBoundingClientRect().top;
		});

		this.container.touchmove(e => {
			if (window.pageYOffset > 0) {
				this.container.removeAttr('style');
				return;
			}
			pos1 = pos2 - e.touches[0].clientY;
			pos2 = e.touches[0].clientY;

			const dy = this.container[0].offsetTop - pos1;
			if (dy < top) return;

			this.container.css(`position: absolute;top: ${Math.min(300, Math.max(dy, top))}px !important;`).width(this.header.width())
		});

		this.container.touchend(async e => {
			const endY = e.changedTouches[0].clientY;
			const dy = endY - startY;

			if (dy > 0) {
				this.container.addClass('transition-[top] duration-100 ease-out').css(`position: absolute;top: ${top}px !important;`);
				await wait(100);
				this.container.removeClass('transition-[top]', 'ease-out').removeAttr('style');
			}

			if (Math.abs(dy) > 150 && window.pageYOffset == 0) {
				if (dy > 0) this.reload(true);
			}
		});
		*/

		window.addEventListener('scroll', () => {
			if (window.pageYOffset >= 12) this.header.attr({ 'data-backdrop': 'active' });
			else this.header.attr({ 'data-backdrop': 'inactive' });
		});
	}

	createEmptyState(title, description, icon, action) {
		return h('div', { class: 'flex flex-col items-center justify-center px-12 py-6 text-center' },
			icon && this.guiIcon[icon],
			h('h2', { class: 'font-bold mb-2 text-white' }, title),
			h('p', {class: 'text-sm text-gray-500 mb-6'}, description),
			action
		);
	}

	reload() { }

	close() {
		this.opened = false;
		this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off'});
		this.app.display.mainContent.removeChildren().removeClass(`max-w-${this.size}xl`);
	}
}
