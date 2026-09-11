import { D, SVG, Notice, truncate, log, Input, Button, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';

export default class Transaction extends Screen {
	constructor(app) {
		super(app, 'Transactions');
		this.balanceVisible = false;
		this.loaded = false;
	}

	init() {
		super.init();

		if (!this.app.data.userdata) {
			this.app.navigateTo('/welcome', true);
			return;
		}

		this.reloadCount = 0;

		this.header.append(
			D('h1', 'My Transactions', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('p', 'View pending and successful transactions', 'text-gray-400 text-sm mt-1')
		);

		this.container.addClass('space-y-6');

		this.tabsSkeleton = D('div', [
			D('div', Array.from({ length: 3 }).map(() => D('div', null, 'w-16 h-8 bg-gray-800 rounded')), 'w-full bg-zinc-900 border border-violet-500/20 rounded-xl p-1 flex gap-1'),
			D('div', Array.from({ length: 3 }).map(() => D('div', D('div', null, 'w-full h-32 bg-gray-800 rounded'), 'aspect-square rounded-lg overflow-hidden mb-1')), 'grid grid-cols-3 gap-1 mt-4')
		], 'animate-pulse');

		this.failed = this.createEmptyState('Failed to load account transactions', 'Something went wrong, have another go?', 'profile', Button([SVG.reload('size-4'), 'Try again']).click(() => this.reload(true)));
		this.app.display.mainContent.append(this.header, this.container);
		this.reload();

	}

	async reload(force = false) {
		if (!this.opened) return;
		if (!force && this.loaded) { this.buildContent(); return; }
		if (this.reloadCount >= 10 && !force) {
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.failed.remove();
		this.container.removeChildren().append(this.skeleton);

		try {
			const data = await fetchWithTimeout('/api/transactions', {
				method: 'POST',
				body: '',
				headers: await this.app.authHeaders()
			});

			this.app.data.transactions = data.transactions || [];

			this.skeleton.remove();
			this.app.storage.set(this.app.data);
			this.loaded = true;
		} catch (err) {
			Notice(await handleError(err), 'error');
			if (err.status == 500) { this.container.removeChildren().append(this.failed);return }
			await wait(2000);
			this.reloadCount++;
			this.reload();
			return;
		}

		this.buildContent();
	}

	buildContent() {

		this.app.data.transactions.map((tx, i) => D('a', [
			D('div', SVG.wallet('h-5 w-5'), 'grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary'),
			D('div', [
				D('p', tx.itemName, 'truncate text-sm font-semibold text-secondary'),
				D('p', tx.details)
			], 'flex-1 min-w-0'),

		], 'flex items-center gap-3 rounded-2x1 border border-border/60 bg-card p-3 shadow-card animation-float-up', null, `animation-delay: ${i * 60}ms`));

	}

	update() {

	}
}
