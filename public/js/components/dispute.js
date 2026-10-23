
import Modal from './ui/Modal.js';
import { D, SVG, mimeType, fileMatchesAccept, toBlob, Button, ImageWithFallback, wait, Notice, fetchWithTimeout, handleError, uploadFile } from '../utils.js';

export default class CreateDisputeModal {
	constructor(app) {
		this.app = app;
	}

	async open(txId) {
		const _this= this;
		if (this.app.data.userdata === undefined) { this.app.navigateTo('/welcome', true); return; }
		this.reasons = ['Item not received', 'Item damaged or defective', 'Item different from description', 'Counterfeit or fake product', 'Seller unresponsive', 'Other'];
		this.types = [{ i: SVG.image, l: 'Photos', a: 'image/*', t: 'image' }, { i: SVG.video, l: 'Videos', a: 'video/*', t: 'video' }, { i: SVG.file, l: 'Docs', a: '.pdf,.doc,.docx,.txt', t: 'document' }, { i: SVG.chat, l: 'Chat', a: 'image/*', t: 'image' }];
		this.reloadCount = 0;
		this.selected = 0;
		this.evidence = [];
		this.accept = null;
		this.uploadKey = null;
		this.fileType = null;
		this.txId = null;
		this.app.loader.setHandler(function () { _this.uploadHandler.apply(_this, [...arguments])});

		this.skeleton = [
			D('div', 'skeleton placeholder', '')
		];
		this.content = D('div', null, 'flex-1 outline-none space-y-4');

		this.modal = new Modal(this.app, {
			header: 'Dispute Center',
			content: { html: this.content },
			onClose: () => this.app.loader.useDefaultHandler()
		});

		if (!txId) {
			this.content.removeChildren().append(D('div', SVG.shieldPlus('h-7 w-7'), 'grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 text-white'), D('h2', 'No escrow yet', 'mt-4 text-base font-semibold text-gray-400'), D('p', 'Disputes apply to a specific escrow - create one first.', 'mt-1 text-[12.5px] leading-relaxed text-gray-400'), Button('Create an Escrow').addClass('mt-5 h-12 rounded-2xl px-6').click(() => this.app.createEscrow.open())).addClass('flex flex-col items-center justify-center px-9 pb-16 text-center');
			return;
		}

		this.txId = txId;
		this.reload();
	}

	buildContent() {
		const _this = this;

		this.choice = D('div', this.reasons.map(r => D('button', [D('span', r, 'font-medium'), D('div', SVG.check('h-3 w-3'))], null, { key: r }).click(() => { this.selected = this.reasons.indexOf(r);this.update() })), 'mt-2 space-y-2');
		this.upload = D('div', this.types.map(({i, l, a}) => D('button', [i('h-5 w-5'), D('span', l, 'text-[10px] font-semibold text-gray-200')], 'flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-violet-400 border-dashed bg-zinc-900/40 text-violet-400', { key: l }).click(() => { this.app.display.filePicker.attr({ accept: a })[0].click();this.accept = a; })), 'mt-2 grid grid-cols-4 gap-2');
		this.textarea = D('textarea', null, 'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full border px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-black/40 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl resize-none', { id: 'post-caption', placeholder: 'Describe what happened in details...', rows: 3, 'data-slot': 'textarea' });
		this.dropper = D('div', null, 'mt-3 flex flex-warp gap-2');
		this.sendBtn = Button([SVG.upload('h-4 w-4'), 'Submit Dispute']).addClass('w-full').attr({ 'data-slot': 'button' }).click(() => this.submit());

		this.content.removeChildren().removeClass('flex', 'flex-col', 'items-center', 'justify-center', 'px-9', 'pb-16', 'text-center').append(
			D('div', [
				D('div', SVG.alertOct('h-4 w-4'), 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-300/15 text-red-300'),
				D('div', [
					D('p', 'Crowlock Buyer Protection', 'text-[13px] font-semibold text-red-300'),
					D('p', 'Our team responds with 24 hours. Funds stay safely locked during review.', 'text-[11px] text-gray-400')
				])
			], 'flex items-start gap-3 rounded-2xl bg-red-300/10 border-red-300/20 p-3'),
			D('p', `Escrow ${this.txId} · ${this.context.label}`, 'mt-3 text-[11px] text-gray-400'),
			D('h3', 'Select a reason', 'mt-5 text-sm font-semibold text-gray-300'), this.choice, 
			D('h3', 'Upload Evidence', 'mt-5 text-sm font-semibold text-gray-300'), this.upload,
			this.uploadBox, this.textarea, this.sendBtn, D('p', 'By submitting, you agree Crowlock may review chat history and transaction details.', 'mt-3 text-center text-[11px] text-gray-600')
		);

		this.update();

	}

	async reload() {
		if (this.reloadCount >= 10) {
			this.content.removeChildren().append(D('div', SVG.shieldPlus('h-7 w-7'), 'grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 text-white'), D('h2', 'Failed to get dispute details', 'mt-4 text-base font-semibold text-gray-400'), D('p', 'Cannot get dispute details at the moment.', 'mt-1 text-[12.5px] leading-relaxed text-gray-400'), Button([SVG.reload('h-4 w-4'), 'Try again']).addClass('mt-5 h-12 rounded-2xl px-6').click(() => { this.reloadCount = 0;this.reload(txId); })).addClass('flex flex-col items-center justify-center px-9 pb-16 text-center');
			return;
		}

		this.content.removeChildren().append(this.skeleton);

		try {
			this.context = await fetchWithTimeout(`/api/wallet/dispute/${this.txId}`, {
				method: 'GET',
				headers: await this.app.authHeaders()
			});
		} catch (err) {
			if (err.status == 404) {
				this.content.removeChildren().append(D('div', SVG.shieldPlus('h-7 w-7'), 'grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 text-white'), D('h2', 'Escrow not found', 'mt-4 text-base font-semibold text-gray-400'), D('p', err.message, 'mt-1 text-[12.5px] leading-relaxed text-gray-400'), Button([SVG.reload('h-4 w-4'), 'Try again']).addClass('mt-5 h-12 rounded-2xl px-6').click(() => { this.reloadCount = 0;this.reload(this.txId); })).addClass('flex flex-col items-center justify-center px-9 pb-16 text-center');		
				return;
			}
			Notice(await handleError(err), 'error');
			await wait(10000);
			this.reloadCount++;
			await this.reload(this.txId);
			return;
		}

		this.buildContent();
	}

	update() {
		this.choice.find('button').each((i, b) => {
			const active = i === this.selected;
			EQuery(b).attr({ class: `flex w-full items-center justify-between rounded-2xl border p-3 text-left text-[13px] transition ${active ? 'border-violet-600 bg-violet-800/20 text-gray-300' : 'border-gray-400/40 bg-zinc-800/20 text-gray-400'}` })
				.find('div').attr({ class: `grid h-5 w-5 place-items-center rounded-full border-2 ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-400'}` })
				.removeChildren().append(active ? SVG.check('h-3 w-3') : null);
		});

		!this.evidence.length && this.dropper.remove();
		this.dropper.removeChildren().append(this.evidence.map((a, i) => D('div', [
			'image' == a.kind ? D('div', ImageWithFallback({ src: a.src }), 'h-8 w-8 rounded-md') :
			SVG[a.kind == 'video' ? 'video' : 'file']('h-4 w-4 text-violet-400'),
			D('span', a.name, 'max-w-[7rem] truncate text-[11px] font-medium text-gray-400'),
			D('button', SVG.close('w-4 h-4'), 'ring-offset-background focus:ring-ring rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0', { type: 'button' }).click(() => { this.evidence = this.evidence.filter((_, idx) => idx !== i); this.update() })
		], 'relative flex items-center gap-2 rounded-xl border border-gray-400/40 bg-zinc-800/20 h-10 px-2.5 py-2', { key: i })));
		this.textarea.before(this.dropper);
	}

	async uploadHandler(result, filename, ext) {
		if (!fileMatchesAccept(result, ext, this.accept)) {
			const fileType = this.types.filter(p => p.a == this.accept)[0].t;
			new Modal(this.app, {
				header: 'Unsupported File type',
				content: { text: `Upload a supported ${fileType}` },
				btns: { 'Okay': (modal) => modal.close() }
			});
			return;
		}

		const blob = toBlob(result);

		if (blob.size > 104857600) {
			new Modal(this.app, {
				header: 'Image too large',
				content: { text: 'Upload an file up to 100MB' },
				btns: { 'Okay': (modal) => modal.close() }
			});
			return;
		}

		const src = URL.createObjectURL(blob);
		const kind = mimeType(result).split('/')[0];
		this.textarea.before(this.dropper.append(D('div', [
			SVG.loader('text-gray-400 animate-spin z-10'),
			D('span', `${filename}.${ext}`, 'max-w-[7rem] truncate text-[11px] font-medium text-gray-400')
		], 'relative flex items-center gap-2 rounded-xl border border-gray-400/40 bg-zinc-800/20 h-10 px-2.5 py-2')));

		this.sendBtn.addClass('opacity-50 pointer-events-none').removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Uploading...');

		try {
			this.uploadKey = await uploadFile({ filename: `${filename}.${ext}`, blob });
			this.evidence.push({ name: `${filename}.${ext}`, kind, src, uploadKey: this.uploadKey });
			this.dropper.removeChildren();
		} catch (e) {
			Notice(await handleError(e));
		} finally {
			this.update();
			this.sendBtn.removeClass('opacity-50', 'pointer-events-none').text('Submit Dispute');
		}
	}

	async submit() {
		if (this.textarea.val().length == 0 && !this.evidence.length == 0) { Notice('Describe your issue or upload an image', 'warn');return; }
		const evidence =  [...this.evidence].map(q => { delete q.src;return q; })

		this.sendBtn.addClass('opacity-50 pointer-events-none').removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Submitting...');

		try {
			await fetchWithTimeout(`/api/wallet/dispute/${this.txId}`, {
				method: 'PUT',
				body: JSON.stringify({ content: this.textarea.val(), reason: this.reasons[this.selected], evidence}),
				headers: await this.app.authHeaders()
			});

			this.modal.close();

		} catch (err) {
			Notice(await handleError(err), 'error');
		} finally {
			this.sendBtn.removeClass('opacity-50', 'pointer-events-none').text('Submit Dispute');
		}
	}
};
