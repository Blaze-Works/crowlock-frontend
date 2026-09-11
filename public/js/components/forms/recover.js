import { D, SVG, fetchWithTimeout, handleError } from '../../utils.js';

export default class ResetForm {
	constructor(app) {
		this.app = app
		this.size = 2;
		this.isForm = true;
	}

	init() {
		const _this = this;

		this.backBtn = D('button', [SVG.home('w-5 h-5 transition-colors text-white'), 'Back to home'], 'fixed left-12 top-12 flex gap-2 items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl').click(function () { _this.app.navigateTo('/home'); });
		this.errorBox = D('div', null, 'text-red-400 text-sm text-center font-bold mb-4 hidden', { 'data-slot': 'error' });

		this.header = D('div', [
			D('h1', 'Forgot your password', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('p', 'Provide your email address to reset your password', 'text-gray-400 text-sm mt-1')
		], 'mb-6 animate-slideDown');

		const labelCls = 'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-gray-300';
		const inputCls = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 border px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 bg-zinc-900 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl';

		this.emailInput = D('input', null, inputCls, { id: 'email', type: 'email', placeholder: 'johndoe@example.com', name: 'email', 'data-slot': 'input' });

		this.submitBtn = D('button', 'Submit', 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl', { 'data-slot': 'button' });

		this.links = D('div', [
			D('button', 'Back to login', 'text-sm text-gray-400 underline underline-offset-2 bg-transparent border-0 p-0', { type: 'button' }).click(function() { _this.app.navigateTo('/login'); })
		], 'flex justify-between items-center mt-3');

		this.formBox = D('div', [this.errorBox, D('div', [D('label', 'Email', labelCls, { for: 'email'} ), this.emailInput], 'space-y-2'), this.submitBtn, this.links], 'space-y-6');

		this.wrapper = D('div', [this.header, this.formBox], 'grid w-full gap-3 rounded-lg border p-6 shadow-lg duration-200 bg-zinc-900 border-violet-500/30 text-white animate-slideUp');

		this.submitBtn.click(() => this.submit());

		this.emailInput.keydown(function(ev) { if (ev.key === 'Enter') _this.submit(); });

		this.app.display.mainContent.append([this.wrapper]);
		this.app.navigation.hide();
	}

	async submit() {
		this.errorBox.addClass('hidden').text('');

		const email = this.emailInput.val();

		if (!email) {
			this.errorBox.removeClass('hidden').text('Please enter your email');
			return;
		}

		this.submitBtn.addClass('opacity-50 pointer-events-none');
		const prevText = this.submitBtn.text();
		this.submitBtn.text('Submitting...');

		try {
			const response = await fetchWithTimeout('/api/user/request-psw-reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});


		} catch (err) {
			this.errorBox.removeClass('hidden').text(await handleError(err));
		} finally {
			this.submitBtn.removeClass('opacity-50', 'pointer-events-none').text(prevText || 'Submit');
		}
	}

	close() {
		this.app.display.container.prepend(this.app.display.addBtn).append(this.app.display.nodePos[3]);
		this.app.navigation.show();
		this.app.display.mainContent.removeChildren().removeClass(`max-w-${this.size}xl`);
	}
};
