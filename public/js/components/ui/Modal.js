import { D, SVG } from '../../utils.js';

export default class Modal {
	constructor(app, data) {
		this.app = app;
		this.data = data;
		this.closeBtn = D('button', [SVG.close('w-4 h-4'), D('span', 'Close', 'sr-only')], 'ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4', { type: 'button' });
		this.bottom = D('div', null, 'flex w-full items-center justify-center rounded-xl p-1');
		this.content = D('div', null, 'flex flex-col gap-2 w-full', { dir: 'ltr', 'data-orientation': 'horizontal', 'data-slot': 'tab' });
		this.header = D('div', [D('h2', data.header, 'text-lg leading-none font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent', { id: 'radix-:r4:', 'data-slot': 'Modal-title' })], 'flex flex-col gap-2 text-center mb-6 sm:mb-0 sm:text-left', { 'data-slot': 'Modal-header' });
		this.elt = D('div', null, 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 flex flex-col sm:pt-6 pt-12 w-full sm:max-h-[80vh] overflow-y-auto gap-4 sm:rounded-lg mb-border p-6 shadow-lg sm:max-w-lg max-sm:w-screen max-sm:h-screen bg-zinc-900 border-violet-500/30 text-white', { role: 'diaolg', id: 'radix-:r3:', 'aria-describedby': 'radix-:r5:', 'aria-labelledby': 'radix-:r4:', 'data-state': 'open', 'data-slot': 'Modal-content', tabindex: -1 });
		this.outer = D('div', [this.elt], 'fixed top-0 left-0 flex items-center justify-center min-h-screen w-full bg-black/40 z-50 overflow-hidden', { 'data-slot': 'overlay' });

		if (data.replace) app.display.wrapper.find('[data-slot=overlay]').remove();
		app.display.wrapper.append(this.outer);

		if (data.header !== undefined) this.elt.append(this.header, this.closeBtn);
		if (data.content !== undefined) {
			this.elt.append(this.content);
			for (let type in data.content) {
				if (type == 'tabs') {
					const tabHeader = D('div', null, 'text-muted-foreground h-9 items-center justify-center rounded-xl flex w-full bg-black/40 border border-violet-500/20 p-1', { role: 'tablist', 'aria-orientation': 'horizontal', 'data-slot': 'tabs-list', tabindex: '0', 'data-orientation': 'horizontal' }, 'outline: false');
					this.content.append(tabHeader);
					for (let tab in data.content.tabs) {
						const content = this.content;
						const tabBtn = D('button', [data.content.tabs[tab].header.icon(), data.content.tabs[tab].header.text], 'dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-background dark:text-muted-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 flex-1 data-[state=active]:bg-violet-600', { id: `radix-:rc:-trigger-${tab}`, type: 'button', role: 'tab', 'aria-selected': false, 'aria-controls': 'radix-:rc:-content-pos', 'data-state': 'inactive', 'data-slot': 'tabs-trigger', tabindex: '-1', 'data-panel': tab, 'data-orientation': 'horizontal', 'data-radix-collection-item': '' });
						data.content.tabs[tab].html.attr({ 'data-panel': tab });
						tabHeader.append(tabBtn);
						this.content.append(data.content.tabs[tab].html);

						tabBtn.click(() => {
							const _tab = tabBtn.getAttr('data-panel');
							tabHeader.find('button').removeClass('text-foreground').addClass('text-background').attr({ 'data-state': 'inactive' });
							tabBtn.addClass('text-foreground').addClass('text-foreground').removeClass('text-background').attr({ 'data-state': 'active' });
							content.find('div[data-panel]').attr({ hidden: true, 'data-state': 'inactive' });
							content.find(`div[data-panel=${_tab}]`).attr({ hidden: false, 'data-state': 'active' });
							if (data.content.tabs[tab] && typeof data.content.tabs[tab].onClick === 'function') {
								data.content.tabs[tab].onClick();
							}
						});

						if (data.content.tabs[tab].isActive) tabBtn[0].click();
					}
				} else if (type = 'html') {
					this.content.append(data.content.html);
				} else if (type = 'text') {
					this.content.append(D('div', data.content.text));
				}
			}
		}
		if (data.btns) {
			const self = this;
			for (let btn in data.btns) {
				let _btn = D('button', btn, 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl', { 'data-slot': 'button' });
				this.bottom.append(_btn);

				_btn.click(() => {
					if (typeof data.btns[btn] === 'function') data.btns[btn](self);
				});
			}
			this.elt.append(this.bottom);
		}

		this.app.currentDrawer?.close();
		this.app.pushState();
		this.app.modals.push(this);

		this.closeBtn.click(() => history.back());
		this.outer.click((e) => e.currentTarget == e.target && history.back());
	}

	close() {
		this.elt.attr({ 'data-state': 'closed' });
		this.data.content.tabs && this.content.find('div:first-child button').off('click');
		this.data.onClose && this.data.onClose(this);
		setTimeout(() => this.outer.remove(), 150);
		this.app.modals.splice(this.app.modals.indexOf(this), 1);
	}
}
