import { D, SVG, Button, ImageWithFallback, Notice, wait, fetchWithTimeout, handleError } from '../utils.js';
import Modal from './ui/Modal.js';
import Screen from './ui/Screen.js';

export default class HomeScreen extends Screen {
	constructor(app) {
		super(app, 'Home');
		this.balanceVisible = false;
		this.loaded = false;

		this.actions = [
			{ icon: SVG.add, label: 'Create Escrow', color: 'from-violet-600 to-purple-600', fn: () => this.app.createEscrow() },
			{ icon: SVG.arrowDownLeft, label: 'Fund', color: 'from-green-600 to-emerald-600', fn: () => this.app.web3Impl.fundWallet() },
			{ icon: SVG.arrowUpRight, label: 'Withdraw', color: 'from-red-600 to-rose-600', fn: () => this.app.web3Impl.withdraw() },
			{ icon: SVG.clock, label: 'My Transactions', color: 'from-blue-600 to-cyan-600', fn: () => this.app.navigateTo('/transactions') }
		];
	}

	init() {
		super.init();

		if (!this.app.data.userdata) {
			this.app.navigateTo('/welcome', true);
			return;
		}

		this.reloadCount = 0;
		this.hideBalanceBtn = D('button', null, 'text-gray-400 mt-10 hover:text-violet-400')

		this.header.append(D('div', [
			D('div', [
				D('h1', 'My Wallet', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
				D('p', 'Manage your digital assets', 'text-gray-400 text-sm mt-1')
			]), this.hideBalanceBtn
		], 'flex items-center justify-between'));

		this.container.addClass('space-y-6');

		this.balanceSkeleton = D('div', [
			D('div', null, 'absolute top-0 right-0 w-40 h-40 bg-gray-800 rounded-full blur-3xl'),
			D('div', null, 'absolute bottom-0 left-0 w-32 h-32 bg-gray-800 rounded-full blur-2xl'),
			D('div', [
				D('div', D('div', null, 'w-20 h-5 bg-gray-800 rounded'), 'mb-4'),
				D('div', D('div', null, 'w-32 h-8 bg-gray-800 rounded'), 'mb-1'),
				D('div', D('div', null, 'w-24 h-4 bg-gray-800 rounded'), '')
			], 'relative z-10 p-6'),
			D('div', [
				D('div', D('div', null, 'w-40 h-4 bg-gray-800 rounded'), ''),
				D('div', D('div', null, 'w-6 h-6 bg-gray-800 rounded'), '')
			], 'mt-6 flex items-center gap-2 p-3 bg-gray-800 rounded-xl')
		], 'relative mb-6 p-6 bg-gray-800 rounded-2xl overflow-hidden animate-pulse');

		this.actionsSkeleton = D('div', Array.from({ length: 4 }).map(() =>
			D('div', [
				D('div', D('div', null, 'w-6 h-6 bg-gray-800 rounded'), 'mb-2'),
				D('div', D('div', null, 'w-12 h-3 bg-gray-800 rounded'), '')
			], 'flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-xl')
		), 'grid grid-cols-4 gap-3 mb-6 animate-pulse');

		this.assetsSkeleton = D('div', [
			D('div', D('div', null, 'w-16 h-5 bg-gray-800 rounded'), 'mb-3'),
			D('div', Array.from({ length: 3 }).map(() =>
				D('div', [
					D('div', D('div', null, 'w-10 h-10 bg-gray-800 rounded-full'), ''),
					D('div', [
						D('div', [
							D('div', D('div', null, 'w-20 h-4 bg-gray-800 rounded'), 'mb-1'),
							D('div', D('div', null, 'w-16 h-4 bg-gray-800 rounded'), '')
						], 'flex items-center justify-between mb-1'),
						D('div', [
							D('div', D('div', null, 'w-12 h-3 bg-gray-800 rounded'), ''),
							D('div', [
								D('div', D('div', null, 'w-16 h-3 bg-gray-800 rounded'), ''),
								D('div', D('div', null, 'w-10 h-3 bg-gray-800 rounded'), '')
							], 'flex items-center gap-2')
						], 'flex items-center justify-between')
					], 'flex-1')
				], 'flex items-center gap-3 p-4 bg-gray-800 rounded-xl')
			), 'space-y-2')
		], 'mb-6 animate-pulse');

		this.transactionsSkeleton = D('div', [
			D('div', D('div', null, 'w-32 h-5 bg-gray-800 rounded'), 'mb-3'),
			D('div', Array.from({ length: 3 }).map(() =>
				D('div', [
					D('div', D('div', null, 'w-10 h-10 bg-gray-800 rounded-full'), ''),
					D('div', [
						D('div', [
							D('div', D('div', null, 'w-16 h-4 bg-gray-800 rounded'), 'mb-1'),
							D('div', D('div', null, 'w-20 h-4 bg-gray-800 rounded'), '')
						], 'flex items-center justify-between mb-1'),
						D('div', [
							D('div', D('div', null, 'w-24 h-3 bg-gray-800 rounded'), ''),
							D('div', [
								D('div', D('div', null, 'w-12 h-3 bg-gray-800 rounded'), ''),
								D('div', D('div', null, 'w-8 h-3 bg-gray-800 rounded'), '')
							], 'flex items-center gap-2')
						], 'flex items-center justify-between')
					], 'flex-1')
				], 'flex items-center gap-3 p-4 bg-gray-800 rounded-xl')
			), 'space-y-2')
		], 'animate-pulse');

		this.failed = this.createEmptyState('Failed to load Wallet', 'How about another go?', 'wallet', Button([SVG.reload('size-4'), 'Try again']).click(() => this.reload(true)));
		this.invalid = this.createEmptyState('No linked wallet', 'We couldn\'t find any wallet linked to your account', 'wallet', Button([SVG.add('size-4'), 'Link a wallet']).click(() => this.app.web3Impl.appkit.open()/* this.openLinkWallet() */));
		this.app.display.mainContent.append(this.header, this.container);
		this.reload();
	}

	async reload(force = false) {
		if (!this.opened) return;
		if (!force && this.loaded)
			{ this.buildContent();return; }
		if (force) this.reloadCount = 0;
		if (this.reloadCount >= 10) {
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		if (!!this.app.data.userdata && !this.app.data.userdata?.walletAddress) {
			this.container.removeChildren().append(this.invalid);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
	   }

		this.app.data.userdata && this.app.data.userdata.walletAddress !== this.app.impl.appkit.getAddress() && this.app.web3Impl.appkit.open();

		this.failed.remove();
		this.invalid.remove();
		this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
		this.container.removeChildren().append(this.balanceSkeleton, this.actionsSkeleton, this.assetsSkeleton, this.transactionsSkeleton);

		try {
			const data = await fetchWithTimeout('/api/web3/wallet', {
				method: 'POST',
				headers: await this.app.authHeaders()
			});

			this.app.data.wallet = this.app.data.wallet || {};
			this.app.data.wallet.address = data.address;
			this.app.data.wallet.balance = data.balance || {};
			this.assets = data.assets || [];
			this.transactions = data.transactions || [];
			this.loaded = true;

			this.balanceSkeleton.remove();
			this.actionsSkeleton.remove();
			this.assetsSkeleton.remove();
			this.transactionsSkeleton.remove();
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
		this.copyBtn = D('button', SVG.copy('w-4 h-4'), 'text-white hover:bg-white/20').click(async () => { try { await navigator.clipboard.writeText(this.app.address); Notice('Copied to clipboard'); } catch (e) { Notice('Failed to copy to clipboard', 'error'); } });
		this.walletAddress = D('div', [
			D('code', this.app.data.wallet.address, 'flex-1 text-xs text-white/90 truncate'), this.copyBtn
		], 'mt-6 flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl');

		this.balanceCard = D('div', [
			D('div', null, 'absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl1'),
			D('div', null, 'absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl'),
			D('div', null, 'absolute -right-16 -top-10 h-56 w-56 rounded-full bg-white/10 pointer-events-none blur-3xl'),

			D('div', [
				D('div', [
					SVG.wallet('w-5 h-5 text-white/80'),
					D('span', 'Total Balance', 'text-white/80 text-sm')
				], 'flex items-center gap-2 mb-4')
			], 'relative z-10'), this.walletAddress
		], 'relative mb-6 p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 rounded-2xl shadow-2xl shadow-violet-500/30 overflow-hidden animate-[enter_.4s_ease_.1s]')
		this.quickActions = D('div', this.actions.map((action, index) => D('button', [
				action.icon('w-6 h-6 text-white'),
				D('span', action.label, 'text-xs text-white')
			], `flex flex-col items-center gap-2 p-4 bg-gradient-to-br ${action.color} rounded-xl shadow-lg hover:scale-105 transition-transform animate-[enter_.4s_ease_${.3 + index * .05}s`).click(async () => await action.fn())
		), 'grid grid-cols-4 gap-3 mb-6 animate-slideUp delay-[.2s]');

		this.asset = D('div', [
			D('h3', 'Assets', 'text-white mb-3'),
			D('div', this.assets.map(asset => D('div', [
					D('div', asset.logo, 'w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-xl'),
					D('div', [
						D('div', [
							D('span', asset.name, 'text-white text-sm'),
							D('span', asset.amount, 'text-white')
						], 'flex items-center justify-between mb-1'),
						D('div', [
							D('span', asset.symbol, 'text-xs text-gray-500'),
							D('div', [
								D('span', asset.value, 'text-sm text-gray-400'),
								D('span', asset.change, `text-xs ${asset.change.startsWith('+') ? 'text-green-400' : 'text-gray-500'}`)
							], 'flex items-center gap-2')
						], 'flex items-center justify-between')
					], 'flex-1')
				], 'flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-violet-500/20 hover:border-violet-500/40 transition-colors'))
			, 'space-y-2')
		], 'mb-6 animate-fadeIn delay-[.3s]');

		this.recentTransactions = D('div', [
			D('div', [D('h2', 'Recent Transactions', 'text-base font-semibold text-secondary'), D('a', 'See more', 'text-xs font-medium text-primary', {'data-navigation': '/transactions'})], 'mt-6 flex items-center'),
			D(),
			D('div', this.transactions.map(tx =>
				D('div', [
					D('div', [
						(tx.type === 'receive' ? SVG.arrowDownLeft('w-5 h-5 text-green-400') : tx.type === 'send' ? SVG.arrowUpRight('w-5 h-5 text-red-400') : SVG.shield('w-5 h-5 text-violet-400'))
					], `w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'receive' ? 'bg-green-600/20' : tx.type === 'send' ? 'bg-red-600/20' : 'bg-violet-600/20'}`),
					D('div', [
						D('div', [
							D('span', tx.type, 'text-white text-sm capitalize'),
							D('span', `${tx.type === 'receive' ? '+' : '-'}${tx.amount} ${tx.currency}`, `text-white ${tx.type === 'receive' ? 'text-green-400' : tx.type === 'send' ? 'text-red-400' : 'text-violet-400'}`)
						], 'flex items-center justify-between mb-1'),
						D('div', [
							D('span', tx.from ? `From ${tx.from}` : tx.to ? `To ${tx.to}` : '', 'text-xs text-gray-500'),
							D('div', [
								D('span', tx.date, 'text-xs text-gray-500'),
								SVG.badgeCheck(`text-xs ${tx.status === 'completed' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
									tx.status === 'escrow' ? 'bg-violet-600/20 text-violet-400 border-violet-600/30' :
										'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
									}`)
							], 'flex items-center gap-2')
						], 'flex items-center justify-between')
					], 'flex-1')
				], 'flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-violet-500/20', { 'data-key': tx.id })
			), 'space-y-2')
		], 'animate-fadeIn delay-[.4s]');

		this.container.removeChildren().append(this.balanceCard, this.quickActions, this.asset, this.recentTransactions);

		this.hideBalanceBtn.click(() => {
			this.balanceVisible = !this.balanceVisible;
			this.update();
		});

		this.update();
	}

	update() {
		this.hideBalanceBtn.removeChildren().append((this.balanceVisible ? SVG.eyeoff : SVG.eye)('w-5 h-5'));

		this.balanceCard.find('h2, p').remove();
		this.walletAddress.before(
			this.balanceVisible ? [D('h2', `$ ${this.app.data.wallet.balance.usdValue}`, 'text-4xl text-white mb-1'), D('p', `≈ ${this.app.data.wallet.balance.eth} ETH`, 'text-white/70 text-sm')] :
				D('h2', '********', 'text-4xl text-white mb-1')
		);
	}
}
