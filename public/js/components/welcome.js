import { D, SVG, Notice, lineBreak, log, Input, Button, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';

export default class Welcome extends Screen {
	constructor(app) {
		super(app, 'Welcome');
		this.size = 2;
	}

	init () {
		super.init();

		if (this.app.data.userdata) {
			this.app.navigateTo('/home', true);
			return;
		}
		
		this.app.navigation.hide();
		this.app.display.nodePos[3].remove();
		this.app.display.addBtn.remove();

		this.logo = new EQuery.svg();
		this.logo.setSize(24, 24).setViewBox(0, 0, 24, 24).addClass('relative z-10').attr({ fill: 'none', stroke: '#8b5cf6', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
		this.logo.append(this.logo.svgElement('defs').append(this.logo.svgElement('linearGradient').attr({ id: 'gradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }).append(this.logo.svgElement('stop').attr({ offset: '0%', 'stop-color': '#8b5cf6' }), this.logo.svgElement('stop').attr({ offset: '100%', 'stop-color': '#c084fc' }))));
		this.logo.rect(3, 11, 18, 11, 'none', { rx: 2, ry: 2 }).path('M7 11V7a5 5 0 0 1 10 0v4', 'none').path('M12 2 L14 5 L12 8', 'none', { 'stroke-width': 1.5 }).path('M12 2 L10 5 L12 8', 'none', { 'stroke-width': 1.5 });

		this.shield = new EQuery.svg();
		this.shield.setSize(224, 224).setViewBox(0, 0, 24, 24).addClass('relative');
		this.shield.path('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', '#fff');

		this.header.append(D('div', [
			this.logo.domElement.cloneNode(true),
			D('h1', 'Crowlock', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent')
		], 'flex item-center justify-center gap-1'));

		this.container.addClass('space-y-6').append(
			D('div', D('div', D('div', [
				D('div', [
					D('div', null, 'absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/30 [mask-image:linear-gradient(to_bottom_left,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_70%)]'),
					D('div', null, 'absolute top-[14.5%] right-[14.5%] h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee,0_0_30px_#22d3ee]')
				], 'absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]'),
				this.shield.domElement.cloneNode(true)
			], 'relative h-56 w-56'), 'mx-auto flex justify-center'), 'relative mt-8 w-full'),

			D('div', [
				D('h1', lineBreak('Secure Every Transaction.', 2), 'text-[28px] font-bold leading-tight tracking-tight text-secondary'),
				D('p', 'Crowlock protects buyers and sellers by securely holding funds until both parties fulfill their agreement.', 'mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground')
			], 'mt-6 text-center animate-float-up'),

			D('div', [{ icon: 'shieldCheck', text: 'Escrow' }, { icon: 'users', text: 'P2P Safe' }, { icon: 'lock', text: 'E2E Encrypted' }].map((i) => D('div', [
				D('div', SVG[i.icon](''), 'grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white'),
				D('span', i.text, 'text-xs font-medium text-secondary')
			], 'flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-900/20 p-3')), 'mt-7 grid w-full grid-cols-3 gap-2'),

			D('div', [
				Button('Create Account').addClass('flex h-14 w-full items-center justify-center rounded-2xl gradient-primary text-[15px] font-semibold text-white shadow-glow transition-transform active:scale-[0.98]').attr({ 'data-navigation': '/register' }),
				Button('Login', 'zinc').addClass('flex h-14 w-full items-center justify-center rounded-2xl border border-border text-[15px] font-semibold text-secondary shadow-soft transition-transform active:scale-[0.98]').attr({ 'data-navigation': '/login' }),
				D('div', D('p', ['By creating an account, you agree to our ', D('a', 'Terms of Service', 'text-[#8b5cf6] text-none', { href: '/terms', 'data-navigation': '/terms' }), ' and ', D('a', 'Privacy Policy', 'text-[#8b5cf6] text-none', { href: '/privacy-policy', 'data-navigation': '/privacy-policy' })], 'text-sm text-center text-gray-600'), 'flex flex-col gap-3')
			], 'mt-auto w-full space-y-3 pt-8')
		);
		
		this.app.display.mainContent.append(this.header, this.container);
	}

	close() {
		this.app.display.container.prepend(this.app.data.userdata && this.app.display.addBtn).append(this.app.display.nodePos[3]);
		this.app.display.container.find('[data-gradient-overlay]').removeClass('overflow-hidden').attr({ 'data-gradient-overlay': 'off'});
		this.app.navigation.show();
		this.app.display.mainContent.removeChildren().removeClass(`max-w-${this.size}xl`);
	}
}
