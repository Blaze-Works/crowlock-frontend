import { D, SVG, Button, log, wait, fetchWithTimeout, count, padZero, monthName, handleError, lineBreak } from '../../utils.js';
import Select from '../ui/Select.js';

const months = count(0, 11, monthName);
export default class RegisterForm {
	constructor(app) {
		this.app = app;
		this.size = 2;
		this.isForm = true;
		this.nodes = ['username', 'confirm-email', 'avatar'];
	}

	init(node) {
		const _this = this;
		this.showPsw = false;
		this.node = node;
		this.currentTab = 0;

		if (this.node !== undefined)
			if (this.app.data.userdata === undefined || this.nodes.indexOf(this.node) === -1) { this.app.navigateTo('/register'); return; }

		this.googlePendingBtn = Button([D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), D('span', 'Continuing with Google', 'truncate')], 'zinc').addClass('w-full opacity-50 pointer-events-none');
		this.googleBtn = Button([D('div', SVG.google('[&>path]:fill-white'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), D('span', 'Continue with Google', 'truncate')], 'zinc').addClass('w-full');
		this.hiddenGoogleBtn = D('div', null, 'absolute top-0 left-0 right-0 bottom-0 opacity-0 [&_iframe]:!size-full [&_iframe]:!m-0');

		this.backBtn = D('button', [SVG.home('w-5 h-5 transition-colors text-white'), 'Back to home'], 'fixed right-12 top-12 flex gap-2 items-center justify-center whitespace-nowrap text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl z-50').click(function () { _this.app.navigateTo('/home'); });
		this.errorBox = D('div', null, 'text-red-400 text-sm text-center font-bold mb-4 hidden', { 'data-slot': 'error' });

		this.header = D('div', [
			D('h1', lineBreak('Create an account, join the community', 3), 'text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent', null, 'line-height: 3rem')
		], 'mb-6');

		const labelCls = 'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-gray-300';
		const inputCls = 'dark:bg-input/30 flex h-9 w-full min-w-0 border-b px-4 py-1 text-base transition-[background-color,color,box-shadow] outline-none disabled:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:bg-zinc-900 hover:bg-zinc-900/30 border-violet-500/20 hover:border-violet-500/40 focus:border-violet-500/50 text-white focus:rounded-xl bg-transparent';
		const btnCls = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl';

		this.options = D('div', [
			D('div', [this.googleBtn, this.hiddenGoogleBtn], 'flex items-center relative overflow-hidden').click(() => { this.googleBtn.before(this.googlePendingBtn).remove() })
		], 'flex flex-col gap-2 mb-6');

		this.divider = D('div', [D('div', null, 'flex-grow border border-gray-300/30'), D('div', 'Or', 'flex-shrink text-gray-200/50'), D('div', null, 'flex-grow border border-gray-300/30')], 'flex items-center gap-6');

		this.letter = D('p', 'A lowercase letter', 'px-1 py-4 font-l data-[state=invalid]:text-red-600 data-[state=valid]:text-green-600', { 'data-state': 'invalid' });
		this.capital = D('p', 'A uppercase letter', 'px-1 py-4 font-l data-[state=invalid]:text-red-600 data-[state=valid]:text-green-600', { 'data-state': 'invalid' });
		this.number = D('p', 'A number', 'px-1 py-4 font-l data-[state=invalid]:text-red-600 data-[state=valid]:text-green-600', { 'data-state': 'invalid' });
		this.length = D('p', 'Minimum 8 Charaters', 'px-1 py-4 font-l data-[state=invalid]:text-red-600 data-[state=valid]:text-green-600', { 'data-state': 'invalid' });
		this.message = D('div', [D('h4', 'Password must contain the following:'), this.letter, this.capital, this.number, this.length], 'absolute top-0 z-90 bg-zinc-900 border border-violet-500/60 p-8 rounded-3 z-6 shadow-[0px_0px_5px_0px_rgba(0,0,0,0)]');

		this.firstnameInput = D('input', null, inputCls, { id: 'firstname', type: 'text', placeholder: 'Enter your Firstname', name: 'firstname', 'data-slot': 'input' });
		this.lastnameInput = D('input', null, inputCls, { id: 'lastname', type: 'text', placeholder: 'Enter your Lastname', name: 'firstname', 'data-slot': 'input' });
		this.emailInput = D('input', null, inputCls, { id: 'email', type: 'email', placeholder: 'Enter a valid email address', name: 'email', 'data-slot': 'input' });
		this.contactInput = D('input', null, inputCls, { type: 'text', name: 'contact', placeholder: 'Enter a valid phone number', 'data-slot': 'input' });
		this.phoneInput = D('input', null, 'hidden', { id: 'contact' });
		this.passwordInput = D('input', null, inputCls, { id: 'password', type: 'password', placeholder: 'Enter your password', name: 'paassword', 'data-slot': 'input' }).addClass('pr-10');
		this.passwordCInput = D('input', null, inputCls, { id: 'cpassword', type: 'password', placeholder: 'Enter your password again', name: 'cpaassword', 'data-slot': 'input' });
		this.usernameInput = D('input', null, inputCls, { id: 'username', type: 'text', placeholder: 'Your unique username', name: 'username', 'data-slot': 'input' });
		this.cemailInput = D('input', null, inputCls, { id: 'cemail', type: 'text', placeholder: 'Enter 6-digit code here', name: 'cemail', 'data-slot': 'input' });

		this.hidePswBtn = D('a', SVG.eye('w-5 h-5'), 'absolute top-5 right-2 text-gray-400 hover:text-violet-400');

		this.yearSelect = new Select({ name: 'year', select: count(1980, 2010) });
		this.monthSelect = new Select({ name: 'month', select: months });
		this.dateSelect = new Select({ name: 'date', select: count(1, 31, padZero) });
		this.contactSelect = new Select({ name: 'country', select: ['+234 (Nigeria)'] });

		this.resendEmail = D('button', 'Didn\'t receive an email, resend it!', 'text-sm text-gray-400 underline underline-offset-2 bg-transparent border-0 p-0').click(() => this.sendEmail());
		this.resendCountdown = D('span', null, 'text-sm text-gray-400');

		this.prevBtn = D('button', 'Back', btnCls, { 'data-slot': 'button' }).removeClass('bg-gradient-to-r', 'from-violet-600', 'to-purple-600').addClass('bg-gray-600');
		this.nextBtn = D('button', 'Next', btnCls, { 'data-slot': 'button' });
		this.submitBtn = D('button', 'Register', btnCls, { 'data-slot': 'button' });

		this.links = D('div', [D('button', ['Have an account? ', D('a', 'Login', 'underline underline-offset-2', { href: '/login', 'data-navigation': '/login', 'data-no-hyperlink': '' }).click(async () => { this.left.addClass('animate-toRight'); this.container.addClass('lg:animate-toDown animate-toLeft'); await wait(200); this.app.navigateTo('/login'); })], 'text-sm text-gray-400 bg-transparent border-0 p-0', { type: 'button' })], 'flex justify-between items-center mt-3');
		
		this.footer = D('div', D('p', ['By creating an account, you agree to our ', D('a', 'Terms of Service', 'text-[#8b5cf6] text-none', { href: '/terms', 'data-navigation': '/terms' }), ' and ', D('a', 'Privacy Policy', 'text-[#8b5cf6] text-none', { href: '/privacy-policy', 'data-navigation': '/privacy-policy' })], 'text-sm text-center text-gray-600'), 'flex flex-col gap-3')

		this.wizard = [
			D('div', [
				D('div', [D('label', 'Firstmame', labelCls, { for: 'firstname' }), this.firstnameInput], 'space-y-2'),
				D('div', [D('label', 'Lastname', labelCls, { for: 'lastname' }), this.lastnameInput], 'space-y-2')
			], 'space-y-6', { 'data-role': 'tab' }),
			D('div', [
				D('div', [D('label', 'Email', labelCls, { for: 'email' }), this.emailInput], 'space-y-2'),
				D('div', [D('label', 'Contact', labelCls, { for: 'contact' }), D('div', [this.contactSelect.elt.addClass('col-start-1 col-end-2'), this.contactInput.addClass('col-start-2 col-end-6')], 'grid grid-col-5 items-center gap-3'), this.phoneInput], 'space-y-2')
			], 'space-y-6', { 'data-role': 'tab' }),
			D('div', [
				D('div', [
					D('div', [D('label', 'Year', labelCls, { for: 'year' }), this.yearSelect.elt], 'space-y-2'),
					D('div', [D('label', 'Month', labelCls, { for: 'month' }), this.monthSelect.elt], 'space-y-2'),
					D('div', [D('label', 'Date', labelCls, { for: 'date' }), this.dateSelect.elt], 'space-y-2')
				], 'grid grid-cols-3 items-center gap-3')
			], 'space-y-6', { 'data-role': 'tab' }),
			D('div', [
				D('div', [D('label', 'Password', labelCls, { for: 'password' }), this.passwordInput, this.hidePswBtn], 'relative space-y-2'),
				D('div', [D('label', 'Repeat Password', labelCls, { for: 'cpassword' }), this.passwordCInput], 'space-y-2')
			], 'space-y-6', { 'data-role': 'tab' })
		];

		this.alt = {
			'username': D('div', [
				D('div', [D('label', 'Enter your username', labelCls, { for: 'username' }), this.usernameInput], 'space-y-2')
			], 'space-y-6', { 'data-role': 'tab' }),
			'confirm-email': D('div', [
				D('div', null, 'space-y-2')
			], 'space-y-6', { 'data-role': 'tab' }),
			'avatar': D('div')
		};

		this.dot = Array.from({ length: 4 }, () => D('div', null, 'w-2 h-2 bg-gray-400 rounded-full'));
		this.dots = D('div', this.dot, 'flex justify-center items-center gap-3');
		this.btns = D('div', null, 'flex items-center justify-around gap-4');

		this.formBox = D('div', [this.errorBox, D('div', this.wizard), this.btns, this.dots, this.links, this.footer], 'space-y-4');

		this.left = D('div', [
			D('div', [
				D('h1', lineBreak('Create an account to start your Crowlock journey', 4), 'text-4xl text-white mb-6'),
				D('p', lineBreak('__subtext__', 6), 'text-sm text-gray-400')
			]).css('direction: rtl')
		], 'lg:flex hidden items-center justify-center flex-grow h-full animate-slideLeft');

		this.container = D('div', [this.header, this.options, this.divider, this.formBox], 'flex flex-col flex-shrink lg:w-[40%] lg:max-w-[560px] lg:px-12 w-full justify-center items-center lg:[&>div]:w-full lg:[&>div]:p-0 md:[&>div]:w-[640px] [&>div]:min-w-[300px] [&>div]:max-w-[640px] [&>div]:px-6 [&>div]:w-full shadow-lg duration-200 bg-zinc-900/50 lg:border-l border-0 border-violet-500/30 backdrop-blur-3xl text-white lg:animate-slideUp animate-slideRight');

		this.wrapper = D('div', [this.left, this.container], 'flex size-full');

		this.hidePswBtn.click(() => {
			this.showPsw = !this.showPsw;
			this.hidePswBtn.removeChildren().append(SVG[this.showPsw ? 'eyeoff' : 'eye']('w-5 h-5'));
			this.passwordInput.attr({ type: this.showPsw ? 'text' : 'password' });
			this.passwordCInput.attr({ type: this.showPsw ? 'text' : 'password' });
		});
		this.prevBtn.click(() => this.nextPrev(-1));
		this.nextBtn.click(() => this.nextPrev(1));
		this.submitBtn.click(() => this.node !== undefined ? this.handleNode() : this.submit());
		this.passwordInput.focus(e => this.wizard[3].append(_this.message.css(`top: ${this.passwordInput.findPosition().top + 35}px`)));
		this.passwordInput.blur(() => this.message.remove());
		this.app.display.mainContent.append(this.wrapper);

		this.app.navigation.hide();

		if (!!this.node) {
			this.backBtn.remove();
			this.currentTab = 4;
			this.header.remove();
			this.dots.remove();
			this.links.remove();
			this.divider.remove();
			this.options.remove();
			this.node === 'username' && this.app.data.userdata.username !== undefined && this.app.data.userdata.username !== '' && this.app.navigateTo('/register/confirm-email');
			this.node === 'confirm-email' && this.app.data.userdata.emailVerified && this.app.reload(true);
			this.node === 'confirm-email' && this.sendEmail();
		}

		this.showTab(this.currentTab);
		this.validatePsw();
		
		if (window.google === undefined || !!this.node) return;
		google.accounts.id.renderButton(this.hiddenGoogleBtn[0], { theme: 'outline', size: 'large' });
		google.accounts.id.prompt(); 
	}

	showTab(n = 0) {
		this.formBox.find('[data-role=tab]').remove();
		this.errorBox.after(this.wizard[n]);

		if (n === 0) {
			this.nextBtn.addClass('w-full').removeClass('w-1/2');
			this.prevBtn.remove().removeClass('w-full').removeClass('w-1/2');
			this.submitBtn.remove();
			this.btns.append(this.nextBtn);
		} else if (n > 0 && n < 3) {
			this.nextBtn.removeClass('w-full').addClass('w-1/2');
			this.prevBtn.removeClass('w-full').addClass('w-1/2');
			this.submitBtn.remove();
			this.btns.append(this.prevBtn, this.nextBtn);
		} else if (n == 3) {
			this.nextBtn.remove();
			this.prevBtn.removeClass('w-full').addClass('w-1/2');
			this.submitBtn.removeClass('w-full').addClass('w-1/2');
			this.btns.append(this.prevBtn, this.submitBtn);
		} else {
			this.submitBtn.addClass('w-full').removeClass('w-1/2').text('Submit');
			this.nextBtn.remove();
			this.prevBtn.remove();
			this.divider.remove();
			this.btns.append(this.submitBtn);
			this.node === 'confirm-email' && this.submitBtn.remove();
			this.wizard.forEach(i => i.remove());
			this.errorBox.after(this.alt[this.node]);
		}
		if (n > 4) this.fixStepIndicator(this.currentTab);
	}

	nextPrev(n) {
		if (n === 1 && !this.validateForm()) return false;
		else {
			this.currentTab += n;
			if (this.currentTab >= this.wizard.length) {
				this.nextBtn.hide();
				this.prevBtn.hide();
				this.submitBtn.show();
				return false;
			}
			this.showTab(this.currentTab);
		}
	}

	fixStepIndicator(n) {
		for (let i = 0; i < this.dot.length; i++) {
			this.dot[i].removeClass('bg-opacity-80');
		}
		this.dot[n].addClass('bg-opacity-80');
	}

	validateForm() {
		let valid = true;
		const inputs = this.wizard[this.currentTab].find('input:not([data-slot=select], [data-slot=select] *, .hidden)');
		inputs.each((i, input) => {
			if (input.value === '') {
				EQuery(input).addClass('bg-red-600/60');
				valid = false;
			} else {
				EQuery(input).removeClass('bg-red-600/60');
				valid = true;
			}
		});

		if (valid) this.dot[this.currentTab].removeClass('bg-gray-400').addClass('bg-green-600');
		return valid;
	}

	validatePsw() {
		let l, u, n, c;
		const _this = this;
		const lowerCaseLetters = /[a-z]/g;
		const upperCaseLetters = /[A-Z]/g;
		const numbers = /[0-9]/g;

		this.passwordInput.keyup(function () {
			if (this.value.match(lowerCaseLetters)) {
				_this.letter.attr({ 'data-state': 'valid' });
				l = true;
			} else {
				_this.letter.attr({ 'data-state': 'invalid' });
				l = false;
			}

			if (this.value.match(upperCaseLetters)) {
				_this.capital.attr({ 'data-state': 'valid' });
				u = true;
			} else {
				_this.capital.attr({ 'data-state': 'invalid' });
				u = false;
			}

			if (this.value.match(numbers)) {
				_this.number.attr({ 'data-state': 'valid' });
				n = true;
			} else {
				_this.number.attr({ 'data-state': 'invalid' });
				n = false;
			}

			if (this.value.length >= 8) {
				_this.length.attr({ 'data-state': 'valid' });
				c = true;
			} else {
				_this.length.attr({ 'data-state': 'invalid' });
				c = false;
			}
			if (l && u && n && c)
				this.validpsw = true;
			else {
				this.validpsw = false;
			}
		});
	}

	async submit() {
		this.errorBox.addClass('hidden').text('');
		this.formBox.find('input').removeClass('bg-red-900/40');

		const countryFull = this.contactSelect.input.val();
		const phoneVal = this.contactInput.val();
		const phoneCode = countryFull.split(' ')[0];
		const country = countryFull.split(' ')[1].replace(' ', '').replace('(', '').replace(')', '');

		if (phoneVal.indexOf(phoneCode) !== -1) {
			this.phoneInput.val(phoneVal);
		} else if (phoneVal.indexOf('+') !== -1) {
			this.errorBox.removeClass('hidden').text('Avoid adding the country code');
			this.contactInput.addClass('bg-red-900/40');
			this.showTab(1);
			return;
		} else {
			this.phoneInput.val(`${phoneCode}${Number(phoneVal)}`);
		}

		this.app.display.mainContent.find('button').addClass('opacity-50 pointer-events-none');
		const prevText = this.submitBtn.text();
		this.submitBtn.removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Registering...');

		const formData = {
			firstname: this.firstnameInput.val(),
			lastname: this.lastnameInput.val(),
			email: this.emailInput.val(),
			contact: this.phoneInput.val(),
			country: country,
			psw: this.passwordInput.val(),
			dob: new Date(this.yearSelect.val(), months.indexOf(this.monthSelect.val()), this.dateSelect.val()),
			sub: false
		};

		try {
			const response = await fetchWithTimeout('/api/user/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			this.app.data = this.app.data || {};
			this.app.data.userdata = response.user;
			this.app.storage.put('authToken', response.token, response.user.uid);
			this.app.reload(true);
		} catch (err) {
			this.errorBox.removeClass('hidden').text(await handleError(err));
		} finally {
			this.app.display.mainContent.find('button').removeClass('opacity-50', 'pointer-events-none');
			this.submitBtn.text(prevText || 'Register');
		}
	}

	async handleNode() {
		this.errorBox.addClass('hidden').text('');
		this.formBox.find('input').removeClass('bg-red-900/40');

		this.submitBtn.addClass('opacity-50 pointer-events-none');
		const prevText = this.submitBtn.text();
		this.submitBtn.removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Submitting...');

		switch (this.node) {
			case 'username':
				try {
					const data = await fetchWithTimeout('/api/user/update', {
						method: 'POST',
						headers: await this.app.authHeaders(),
						body: JSON.stringify({ userdata: { username: this.usernameInput.val() } })
					});

					this.app.data = this.app.data || {};
					this.app.data.userdata = data.user || data;
					this.app.storage.set(this.app.data);
					this.app.navigateTo('/register/confirm-email');
				} catch (err) {
					this.errorBox.removeClass('hidden').text(await handleError(err));
				} finally {
					this.submitBtn.removeClass('opacity-50', 'pointer-events-none').text(prevText || 'Submit');
				}
				break;

			case 'confirm-email':
				this.sendEmail();
				break;

			default:
				this.app.navigateTo('/register', true);
				log.warn('Invalid node:', this.node);
				break;
		}
	}

	async sendEmail() {
		const elt = D('div', Array.from({ length: 3 }).map((_, i) => D('div', null, `w-2 h-2 bg-violet-400 rounded-full animate-[floatUp_1s_ease-in-out_infinite_.${i * 2}s]`)), 'mt-12 flex justify-center gap-1');
		this.submitBtn.remove();
		this.errorBox.addClass('hidden').text('');
		this.alt[this.node].find('.space-y-2').append(elt);

		if (this.app.data.userdata.emailVerified) { this.app.reload(true); return; }

		try {
			const response = await fetchWithTimeout('/api/user/email-verified-status', {
				method: 'POST',
				headers: await this.app.authHeaders()
			});
			if (response.verified) {
				this.errorBox.removeClass('hidden', 'text-red-400').addClass('text-white').text('Email is already verified!');
				this.app.data.userdata = response.user;
				this.app.reload(true);
			} else {
				try {
					await fetchWithTimeout('/api/user/request-email-verification', {
						method: 'POST',
						headers: await this.app.authHeaders()
					});
					elt.after(D('p', 'Check your email for a verfication link'));
				} catch (err) {
					this.errorBox.removeClass('hidden').text(await handleError(err));
					this.submitBtn.text('Retry');
					this.btns.append(this.submitBtn);
				}
			}
		} catch (err) {
			if (typeof err.json === 'function' && (await err.json()).code === 'auth/id-token-expired') {
				await this.app.logout();
			} else {
				this.errorBox.removeClass('hidden').text(await handleError(err));
				this.submitBtn.text('Retry');
				this.btns.append(this.submitBtn);
			}
		} finally { elt.remove(); }
	}

	close() {
		this.app.display.container.prepend(this.app.data.userdata && this.app.display.addBtn).append(this.app.display.nodePos[3]);
		this.app.display.container.find('[data-gradient-overlay]').removeClass('overflow-hidden').attr({ 'data-gradient-overlay': 'off' });
		this.app.navigation.show();
		this.app.display.mainContent.removeChildren().removeClass(`max-w-${this.size}xl`);
	}
}