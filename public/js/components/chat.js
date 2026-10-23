import { D, SVG, Notice, truncate, log, Input, Button, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';
import Profile from './ui/Profile.js';
import { loadMessages } from '../impl/messaging.js';

export default class Chat extends Screen {
	constructor(app) {
		super(app, 'Chat');

		this.size = 4;
		this.loaded = false;
		this.convId = null;
	}

	init(node) {
		super.init(!!node);

		if (!this.app.data.userdata) { this.app.navigateTo('/welcome', true);return; }
		if (!node) { this.app.navigateTo('/activity', true);return; }

		this.app.display.nodePos[3].remove();
		this.app.display.addBtn.remove();

		this.header.append(
			D('div', D('a', SVG.chevronLeft('h-5 w-5'), 'grid h-10 w-10 place-items-center cursor-pointer rounded-full bg-zinc-800').click(() => this.app.navigateTo('/activity')), 'w-10'),
			D('div', null, 'h-4 w-24 my-auto rounded bg-gray-600 animate-pulse'), 
			D('div', D('div', SVG.shieldCheck('h-4 w-4'), 'grid h-9 w-9 place-items-center rounded-full bg-green-600/15 text-gray-400'), 'w-10 flex justify-end')
		).addClass('flex item-center justify-between');

		this.skeleton = [
			D('div', D('div', [
				D('div', null, 'h-10 w-10 rounded-full bg-gray-600 animate-pulse'),
				D('div', [D('div', null, 'h-4 w-24 rounded bg-gray-600 animate-pulse'), D('div', null, 'h-4 w-16 rounded bg-gray-600 animate-pulse')], 'flex-1 min-w-0 space-y-1')
			], 'flex items-center gap-3'), 'absolute left-0 right-0 h-[66px] mx-4 mb-3 block rounded-2xl p-3 bg-zinc-900 z-20'),
			D('div', [
				D('div', D('div', D('div', 
					D('div', Array.from({ length: 3 }).map(_ => D('div', [
						D('div', [
							D('div', [
								D('div', null, 'h-8 w-8 rounded-full bg-gray-600 animate-pulse'),
								D('div', [
									D('div', null, 'h-3 w-16 rounded-[12px] bg-gray-600'),
									D('div', null, 'h-3 w-10 mt-0.5 rounded-[12px] bg-gray-600')
								], 'h-12 w-32 p-2 rounded-xl bg-zinc-800 animate-pulse')
							], 'flex gap-3 justify-start mb-2'),

							D('div', [
								D('div', [
									D('div', null, 'h-3 w-16 rounded-[12px] bg-gray-600'),
									D('div', null, 'h-3 w-10 mt-0.5 rounded-[12px] bg-gray-600')
								], 'h-12 w-32 p-2 rounded-xl bg-zinc-800 animate-pulse'),
							], 'flex justify-end mb-2')

						], 'mx-auto w-full max-w-3xl flex flex-col')
					], 'relative w-full visibility-visible')), 'h-full w-full pt-[72px] overflow-x-hidden overflow-y-auto pointer-coarse:overscroll-y-contain')
				, 'relative flex min-h-0 w-full flex-1 shrink'), 'flex min-h-0 flex-1 flex-col'), 'relative isolate w-full flex-1 flex-col overflow-y-auto'),
				D('div', D('div', D('div', D('div', [
					D('div', null, 'h-6 w-32 rounded-xl bg-gray-600 animate-pulse'),
					D('div', null, 'h-3 w-40 rounded-xl bg-gray-600 animate-pulse'),
					D('div', [
						D('div', D('div', null, 'h-7 w-7 rounded-full bg-gray-600 animate-pulse'), 'flex shrink-0 items-center'),,
						D('div', [D('div', null, 'h-7 w-[70px] rounded-xl bg-gray-600 animate-pulse'), D('div', null, 'h-7 w-7 rounded-full bg-gray-600 animate-pulse')], 'ml-auto flex shrink-0 items-center gap-1.5'),
					], '@container flex items-center gap-1 flex-nowrap')
				], 'flex flex-col bg-zinc-900 shadow-surface-xl transition-colors duration-150 rounded-xl ease-in-out rounded-6.5 gap-2 p-3 relative z-10'), 'relative z-20'), 'mx-auto w-full max-w-xl flex max-h-[calc(100%-37px)] shrink-0 pb-2 flex-col overflow-visible px-2'), 'flex')
			], 'fs-mask flex min-h-0 w-full flex-grow flex-col overflow-y-auto')
		];

		this.chatScroller =  D('div', null, 'relative flex min-h-0 w-full flex-1 shrink');

		this.container.addClass('relative flex flex-col overflow-y-hidden');

		this.empty = this.createEmptyState('No Recent Transactions', 'Create an Escrow to view it\'s history here', 'transaction');

		this.failed = this.createEmptyState('Failed to load chat', 'Something went wrong, have another go?', 'transaction', Button([SVG.reload('size-4'), 'Try again']).click(() => this.reload(true)));
		this.app.display.mainContent.append(this.header, this.container).addClass('h-screen');
		this.app.display.container.find('[data-gradient-overlay]').removeClass('min-h-screen').addClass('h-screen overflow-y-hidden');
		this.convId = node;
		this.reload();

	}

	async reload(force = false) {
		if (!this.opened) return;
		if (force) this.reloadCount = 0;
		if (this.reloadCount >= 4) {
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.empty.remove();
		this.failed.remove();
		this.app.display.nodePos[3].removeChildren();
		this.app.display.addBtn.remove();
		this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
		this.container.removeChildren().append(this.skeleton);

		if (!this.app.ready) {
			await wait(5000);
			this.reload();
			return;
		}

		try {
			const res = await loadMessages(this.convId, { limit: 100 });
			this.message = res.messages;
			this.participants = res.participants;
			this.container.removeChildren();
		} catch (err) {
			Notice(await handleError(err), 'error');
			if (err.status == 500) { this.container.removeChildren().append(this.failed);return }
			await wait(5000);
			this.reloadCount++;
			this.reload();
			return;
		}
		this.buildContent();
	}

	buildContent() {
		this.header.removeChildren().append(
			D('div', D('a', SVG.chevronLeft('h-5 w-5'), 'grid h-10 w-10 place-items-center cursor-pointer rounded-full bg-zinc-800').click(() => this.app.navigateTo('/activity')), 'w-10'),
			D('div', `Chat with @${this.participants[0].username}`, 'my-auto text-gray-400 font-bold'), 
			D('div', D('div', SVG.shieldCheck('h-4 w-4'), 'grid h-9 w-9 place-items-center rounded-full bg-green-600/15 text-gray-400'), 'w-10 flex justify-end')
		);

		this.outer = D('div', this.chatScroller, 'fs-mask flex min-h-0 w-full flex-grow flex-col overflow-y-auto');
		this.container.append(this.outer);

		this.buildChatBox();
		this.buildChats();
	}

	buildChatBubble(chat, isSent) {

	}

	buildChats() {
		const chat = 0;
	}

	buildChatBox() {
		this.addBtn = Button(SVG.add('w-5 h-5'), 'zinc').removeClass('h-9', 'px-4', 'py-2', 'has-[>svg]:px-3', 'rounded-xl').addClass('p-1 rounded-full');
		this.sendBtn = Button(SVG.send('w-5 h-5'), 'zinc').removeClass('h-9', 'px-4', 'py-2', 'has-[>svg]:px-3', 'rounded-xl').addClass('p-1 rounded-full');

		this.dropper = D('div', null, 'mt-3 flex flex-warp gap-2');
		this.messageInput = D('textarea', null, 'min-h-6 max-h-32 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-gray-500', { id: 'chat-input', rows: 1, placeholder: 'Write a message...', 'aria-label': 'Message' }).on('input', event => {
			event.target.style.height = 'auto';
			event.target.style.height = `${event.target.scrollHeight}px`;
		});
		this.inputContainer = D('div', D('div', this.messageInput, 'relative grid w-full flex-1'), 'w-full min-w-0');
		this.q = D('div', [
				D('div', this.addBtn, 'flex shrink-0 items-center'),
				D('div', this.sendBtn, 'ml-auto flex shrink-0 items-center gap-1.5')
			], 'flex items-center gap-1 flex-nowrap');

		this.textbox = D('div', D('div', D('div', D('div', [this.inputContainer, this.q], 'flex flex-col bg-zinc-900 shadow-surface-xl transition-all duration-150 rounded-xl ease-in-out rounded-6.5 gap-2 p-3 relative z-10') , 'relative z-20') , 'mx-auto w-full max-w-xl flex max-h-[calc(100%-37px)] shrink-0 pb-2 flex-col overflow-visible px-2') , 'flex');
		this.outer.append(this.textbox);
	}

	update() {
		!this.pendingFiles.length && this.dropper.remove();
		this.dropper.removeChildren().append(this.pendingFiles.map((a, i) => D('div', [
			'image' == a.kind ? D('div', ImageWithFallback({ src: a.src }), 'h-8 w-8 rounded-md') :
			SVG[a.kind == 'video' ? 'video' : 'file']('h-4 w-4 text-violet-400'),
			D('span', a.name, 'max-w-[7rem] truncate text-[11px] font-medium text-gray-400'),
			D('button', SVG.close('w-4 h-4'), 'ring-offset-background focus:ring-ring rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0', { type: 'button' }).click(() => { this.pendingFiles = this.pendingFiles.filter((_, idx) => idx !== i); this.update() })
		], 'relative flex items-center gap-2 rounded-xl border border-gray-400/40 bg-zinc-800/20 h-10 px-2.5 py-2', { key: i })));
		this.inputContainer.before(this.dropper);
	}
}
