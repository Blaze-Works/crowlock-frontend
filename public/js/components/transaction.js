import { D, SVG, Notice, lineBreak, Button, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';

function statusColor(status) {
	switch (status) {
		case 'Pending': return 'bg-yellow-400/20 text-yellow-400';
		case 'Completed': return 'bg-green-400/20 text-green-400';
		case 'Disputed': return 'bg-red-400/20 text-red-400';
		default: return 'bg-gray-400/20 text-gray-400';
	}
}

export default class Transaction extends Screen {
	constructor(app) {
		super(app, 'Transactions');
		this.balanceVisible = false;
		this.loadedTx = {};
		this.loaded = false;

		this.i = 0;
		this.opt = [
			{ label: 'All', fn: () => { this.i = 0; this.update(); } },
			{ label: 'Pending', fn: () => { this.i = 1; this.update(); }  },
			{ label: 'Completed', fn: () => { this.i = 2; this.update(); }  },
			{ label: 'Disputed', fn: () => { this.i = 3; this.update(); }  }
		];
	}

	init(node) {
		super.init(!!node);

		if (!this.app.data.userdata) {
			this.app.navigateTo('/welcome', true);
			return;
		}

		this.reloadCount = 0;

		this.header.append(
			D('h1', node ? 'Transaction Details' : 'My Transactions', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('p', 'View pending and successful transactions', 'text-gray-400 text-sm mt-1')
		);

		this.selSkeleton = D('div');
		this.listSkeleton = D('div',
			Array.from({ length: 5 }).map(() => D('div', [
				D('div', null, 'grid h-11 w-11 place-items-center rounded-xl bg-gray-600/20'),
				D('div', [
					D('div', null, 'h-5 bg-gray-800 rounded'),
					D('div', null, 'w-28 h-3 mt-[2px] bg-gray-800 rounded')
				], 'flex-1 min-w-0'),
				D('div', [
					D('div', null, 'w-10 h-4 bg-gray-800 rounded'),
					D('div', null, 'w-20 h-4 bg-gray-800 inline-flex items-center gap-1 rounded-full')
				], 'flex flex-col items-end gap-1')
			], 'flex items-start gap-3 p-4 bg-zinc-900 rounded-xl animate-pulse'))
		, 'flex-1 outline-none space-y-3');

		this.sel = D('div', null, 'mt-3 flex gap-2 overflow-x-ato pb-1 -mx-1 px-1');
		this.list = D('div', null, 'flex-1 outline-none overflow-y-auto space-y-3');

		this.container.addClass('space-y-6');

		this.empty = this.createEmptyState('No Recent Transactions', 'Create an Escrow to view it\'s history here', 'transaction');

		this.failed = this.createEmptyState('Failed to load account transactions', 'Something went wrong, have another go?', 'transaction', Button([SVG.reload('size-4'), 'Try again']).click(() => this.reload(true)));
		this.app.display.mainContent.append(this.header, this.container);

		if (!!node) { this.buildTxReport(node); return; }
		this.reload();

	}

	async reload(force = false) {
		if (!this.opened) return;
		if (force) this.reloadCount = 0;
		if (!force && this.loaded) { this.buildContent(); return; }
		if (this.reloadCount >= 10 && !force) {
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.failed.remove();
		this.container.removeChildren().append(this.selSkeleton, this.listSkeleton);
		this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
		this.sel.removeChildren();
		this.list.removeChildren();

		try {
			const data = await fetchWithTimeout('/api/wallet/transactions', {
				method: 'POST',
				body: '',
				headers: await this.app.authHeaders()
			});

			this.app.data.transactions = Object.fromEntries(data.transactions.map(item => [item.id, item])) || {};

			this.selSkeleton.remove();
			this.listSkeleton.remove();
			this.app.storage.set(this.app.data);

			this.loaded = true;
		} catch (err) {
			Notice(await handleError(err), 'error');
			if (err.status == 500) {
				this.container.removeChildren().append(this.failed);
				this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
				return;
			}
			await wait(2000);
			this.reloadCount++;
			this.reload();
			return;
		}

		this.buildContent();
	}

	buildContent() {
		const entries = Object.entries(this.app.data.transactions);
		this.btns = this.opt.map((b) => Button(b.label, 'zinc').click(b.fn));
		this.sel.append(this.btns);
		this.list.append(entries.length ? entries.map((tx, i) => D('a', [
			D('div', SVG.wallet('h-5 w-5'), 'grid h-11 w-11 place-items-center rounded-xl bg-violet-600/20 text-violet-600'),
			D('div', [
				D('p', tx[1].label, 'truncate text-sm font-semibold'),
				D('p', `${tx[1].id} • ${tx[1].who}`, 'text-[11px] text-gray-600')
			], 'flex-1 min-w-0'),
			D('div', [
				D('span', `$${tx[1].amount}`, 'text-sm font-bold text-gray-100'),
				D('span', [SVG.clock('w-3 h-3'), tx[1].status], `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(tx[1].status)}`)
			], 'flex flex-col items-end gap-1')

		], 'flex items-center gap-3 rounded-2x1 bg-zinc-900 rounded-2xl border border-violet-500/20 p-4 animate-slideUp', { href: `/transaction/${tx[1].id}`, 'data-navigation': `/transaction/${tx[1].id}`, 'data-no-hyperlink': '', 'data-tx-status': tx[1].status }, `animation-delay: ${i * 50}ms`)
		) : this.empty);
		this.container.append(this.sel, this.list);
		this.update();
	}

	update() {
		this.btns.forEach(b => b.attr({ 'data-color': 'zinc' }));
		this.btns[this.i].attr({ 'data-color': 'violet'  });

		const a = [/\.*/, /Pending/, /Completed/, /Disputed/];
		this.list.find('a').each((i, e) => {
			e = EQuery(e).addClass('hidden');
			let status = e.getAttr('data-tx-status');
			a[this.i].test(status) && e.removeClass('hidden');
		});

	}

	async buildTxReport(txId) {
		if (!this.loadedTx[txId]) {
			if (!this.opened) return;
			if (this.reloadCount >= 10) {
                        	this.container.removeChildren().after(this.failed);
				this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
				return;
			}
			this.empty.remove();
			this.failed.remove();
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
			this.container.removeChildren().append(this.selSkeleton, this.listsSkeleton);
			try {
				const data = await fetchWithTimeout(`/api/wallet/transactions/${txId}`, {
					method: 'POST',
					headers: await this.app.authHeaders()
				});
				this.loadedTx[txId] = data;
			} catch (err) {
				if (err.status == 404) {
					this.container.removeChildren();
					this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'radial' });
					this.app.display.mainContent.append(this.app.display.error404);
					return;
				}
				Notice(await handleError(err), 'error');
				await wait(10000);
				this.reloadCount++;
				this.buildTxReport(txId);
        			return;
			}
		}

		const tx = this.loadedTx[txId];

		const n = 2 * Math.PI * 55;
		const svg = new EQuery.svg();
		const svgCircle = i => svg.setViewBox(0, 0, 120, 120).addClass('h-full w-full -rotate-90').attr({ 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' })
			.circle(60, 60, 55, 'none', { stroke: '#1a1a1d', 'stoke-width': 3 })
			.circle(60, 60, 55, 'none', { stroke: 'url(#tx-grad)', 'stroke-dasharray': n, 'stroke-dashoffset': (1 - i) * n, style: 'transistion: stroke-dashoffset 2.0s' })
			.append(svg.svgElement('def').append(
				svg.svgElement('linearGradient').attr({ id: 'tx-grad', x1: 0, y1: 0, x2: 1, y2: 1}).append([svg.svgElement('stop').attr({ offset: '0%', 'stop-color': '#8B5CFF' }), svg.svgElement('stop').attr({ offset: '100%', 'stop-color': '#4B1FD6' })])
			)).domElement;

		this.statusCircle = D('div', [
			svgCircle(tx.timeline.filter(t => t.done).length / tx.timeline.length), 
			D('div', D('div', [D('div', SVG.shieldCheck('h-5 w-5'), 'mx-auto grid h-10 w-10 place-items-center rounded-full bg-zinc-900 text-white shadow-glow'), D('p', 'Status', 'mt-1 text-[11px] font-medium uppersacse tracking-wider text-white'), D('p', lineBreak(tx.status, 1), 'text-[13px] font-bold text-gray-200')]), 'absolute inset-0 grid place-items-center text-center')
		], 'relative mx-auto flex h-40 w-40 items-center justify-center');

		this.txDetails = D('div', [
			D('div', [
				D('div', [D('p', 'Escrow #', 'text-[11px] uppercase tracking-wider text-gray-300'), D('p', txId, 'text-sm font-bold text-white')]),
				D('div', [D('p', 'Amount', 'text-[11px] uppercase tracking-wider text-gray-400'), D('p', this.app.data.transactions[txId].amount.toString(), 'text-lg font-bold text-white')], 'text-right')
			], 'flex items-center justify-between'),

			D('div', null, 'my-3 border-t border-dashed border-violet-700/60'),

			D('ol', tx.timeline.map((s, i) => D('li', [
				D('div', s.done ? SVG.check('h-4 w-4') : D('span', (i + 1).toString(), 'text-[10px] font-bold'), `mt-0.5 grid h-6 w-6 place-items-center rounded-full ${s.done ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white' : 'bg-gray-700 text-gray-200'} ${s.current ? 'ring-4 ring-primary/15' : ''}`),
				D('div', [
					D('p', s.t, `text-[13px] font-semibold ${s.done ? 'text-gray-300' : 'text-gray-500'}`),
					D('p', s.d, 'text-[11px] text-gray-500')
				], 'flex-1')
			], 'flex items-start gap-3', { key: s.t } )), 'space-y-3')
		], 'mt-2 rounded-3xl border border-violet-700/30 bg-zinc-900 p-4');

		this.btns = D('div', [
			Button([SVG.check('mr-2 h-4 w-4'), tx.released ? ' Payment Relased' : ' Release Payment'], 'violet', { disabled: tx.released }).addClass('col-span-2 h-14 rounded-2xl').click(() => {
				if (tx.status == 'draft') { Notice('Fund the escrow first', 'error');return; }

			}),
			Button([SVG.alertOct('h-4 w-4'), ' Raise Dispute'], 'zinc').addClass('h-12 rounded-2xl border border-red-300/30 bg-red-300/5 text-red-300').click(() => this.app.dispute.open(txId)),
			Button([SVG.download('h-4 w-4'), ' Download Receipt'], 'zinc').addClass('h-12 rounded-2xl border border-gray-600').click(() => {  }),
		], 'mt-4 grid grid-cols-2 gap-3');

		this.outer = D('div', [this.statusCircle, this.txDetails, this.btns], 'flex-1 px-5 pb-6');

		this.container.append(this.outer);

	}
}
