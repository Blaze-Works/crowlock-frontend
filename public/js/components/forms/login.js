import { D, SVG, Button, lineBreak, fetchWithTimeout, handleError, wait, extractQuery } from '../../utils.js';

export default class LoginForm {
	constructor(app) {
		this.app = app
		this.size = 2;
		this.isForm = true;
	}

	init() {
		const _this = this;
		this.showPsw = false;

		if (this.app.data.userdata) {
			if (extractQuery().landing !== undefined) this.app.navigateTo(new URL(extractQuery().landing).pathname, true);
			else this.app.navigateTo('/home', true);
			return;
		}

		this.googlePendingBtn = Button([D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), D('span', 'Continuing with Google', 'truncate')], 'zinc').addClass('w-full opacity-50 pointer-events-none');
		this.googleBtn = Button([D('div', SVG.google('[&>path]:fill-white'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), D('span', 'Continue with Google', 'truncate')], 'zinc').addClass('w-full');
		this.hiddenGoogleBtn = D('div', null, 'absolute top-0 left-0 right-0 bottom-0 opacity-0 [&_iframe]:!size-full [&_iframe]:!m-0');

		this.backBtn = Button([SVG.home('w-5 h-5 transition-colors text-white'), 'Back to home']).addClass('fixed right-12 top-12 z-50').click(() => { this.app.navigateTo('/home'); });
		this.errorBox = D('div', null, 'text-red-400 text-sm text-center font-bold mb-4 hidden', { 'data-slot': 'error' });

		this.header = D('div', [
			D('h1', 'Welcome back', 'mt-8 mb-2 text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('h2', 'Sign in to your account', 'text-sm text-foreground-light')
		]);

		this.options = D('div', [
			D('div', [this.googleBtn, this.hiddenGoogleBtn], 'flex items-center relative overflow-hidden').click(() => { this.googleBtn.before(this.googlePendingBtn).remove() })
		], 'flex flex-col gap-2 mb-6');

		this.divider = D('div', [D('div', null, 'flex-grow border border-gray-300/30'), D('div', 'Or', 'flex-shrink text-gray-200/50'), D('div', null, 'flex-grow border border-gray-300/30')], 'flex items-center gap-6');

		const inputCls = 'dark:bg-input/30 flex h-9 w-full min-w-0 border-b px-4 py-1 text-base transition-[background-color,color,box-shadow] outline-none disabled:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:bg-zinc-900 hover:bg-zinc-900/30 border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500/50 text-white focus:rounded-xl bg-transparent';

		this.emailInput = D('input', null, inputCls, { id: 'email', type: 'email', placeholder: 'Your Email', name: 'email', 'data-slot': 'input' });
		this.passwordInput = D('input', null, inputCls, { id: 'password', type: 'password', placeholder: 'Password', name: 'password', 'data-slot': 'input' }).addClass('pr-10');

		this.hidePswBtn = D('a', SVG.eye('w-5 h-5'), 'absolute top-0 right-2 text-gray-400 hover:text-violet-400');

		this.submitBtn = D('button', 'Login', 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl', { 'data-slot': 'button' });

		this.links = D('div', [
			D('a', 'Reset password', 'text-sm text-gray-400 underline underline-offset-2 bg-transparent border-0 p-0', { type: 'button', href: '/recover', 'data-navigation': '/recover' }),
			D('button', ['Don\'t have an account yet? ', D('a', 'Sign up', 'underline underline-offset-2', { href: '/register', 'data-navigation': '/register', 'data-no-hyperlink': '' }).click(async () => { this.right.addClass('animate-toLeft');this.container.addClass('lg:animate-toDown animate-toRight');await wait(200);this.app.navigateTo('/register') })], 'text-sm text-gray-400 bg-transparent border-0 p-0', { type: 'button' })
		], 'flex justify-between items-center mt-3');

		this.formBox = D('div', [this.errorBox, D('div', this.emailInput, 'space-y-2'), D('div', [this.passwordInput, this.hidePswBtn], 'relative space-y-2'), this.submitBtn, this.links], 'space-y-6');
		this.container = D('div', [this.header, this.options, this.divider, this.formBox], 'flex flex-col flex-shrink gap-4 lg:w-[40%] lg:max-w-[560px] lg:px-12 w-full justify-center items-center lg:[&>div]:w-full lg:[&>div]:p-0 md:[&>div]:w-[640px] [&>div]:min-w-[300px] [&>div]:max-w-[640px] [&>div]:px-6 [&>div]:w-full shadow-lg duration-200 bg-zinc-900/80 lg:border-r border-0 border-violet-500/30 backdrop-blur-3xl text-white lg:animate-slideUp animate-slideLeft');

		this.right = D('div', [
			D('div', [
				D('h1', lineBreak('A new way to connect, engage and network with traders', 4), 'text-4xl text-white mb-6'),
				D('p', lineBreak('__subtext__', 6), 'text-sm text-gray-400')
			], '')
		], 'hidden lg:flex items-center justify-center flex-grow h-full animate-slideRight');

		this.wrapper = D('div', [this.container, this.right], 'flex size-full');

		this.submitBtn.click(() => this.submit());
		this.hidePswBtn.click(() => {
			this.showPsw = !this.showPsw;
			this.hidePswBtn.removeChildren().append(SVG[this.showPsw ? 'eyeoff' : 'eye']('w-5 h-5'));
			this.passwordInput.attr({ type: this.showPsw ? 'text' : 'password' });
		});

		this.emailInput.keydown(function(ev) { if (ev.key === 'Enter') _this.submit(); });
		this.passwordInput.keydown(function(ev) { if (ev.key === 'Enter') _this.submit(); });

		this.app.display.mainContent.append(this.wrapper);
		this.app.navigation.hide();

		google.accounts.id.renderButton(this.hiddenGoogleBtn[0], { theme: 'outline', size: 'large' });
		google.accounts.id.prompt();
	}

	async submit() {
		this.errorBox.addClass('hidden').text('');

		const email = this.emailInput.val();
		const password = this.passwordInput.val();

		if (!email || !password) {
			this.errorBox.removeClass('hidden').text('Please enter both email and password');
			return;
		}

		this.app.display.mainContent.find('button').addClass('opacity-50 pointer-events-none');
		const prevText = this.submitBtn.text();
		this.submitBtn.removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Logging in...');

		try {
			const response = await fetchWithTimeout('/api/user/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email, password: password })
			});

			response.data.expiresIn = (new Date() / 1000) + Number(response.data.expiresIn);

			this.app.data = this.app.data || {};
			this.app.data.userdata = response.user;
			this.app.storage.put('authToken', response.data, response.user.uid);
			if (extractQuery().landing !== undefined) {
				const landingPath = new URL(extractQuery().landing).pathname;
				await this.app.storage.set(this.app.data || {});
				this.app.navigateTo(landingPath, true);
				this.app.update();
				return;
			}
			this.app.reload(true);
		} catch (err) {
			this.errorBox.removeClass('hidden').text(await handleError(err));
		} finally {
			this.app.display.mainContent.find('button').removeClass('opacity-50', 'pointer-events-none');
			this.submitBtn.text(prevText || 'Login');
		}
	}

	close() {
		this.app.display.container.prepend(this.app.data.userdata && this.app.display.addBtn).append(this.app.display.nodePos[3]);
		this.app.display.container.find('[data-gradient-overlay]').removeClass('overflow-hidden').attr({ 'data-gradient-overlay': 'off'});
		this.app.navigation.show();
		this.app.display.mainContent.removeChildren().removeClass(`max-w-${this.size}xl`);
	}
};
