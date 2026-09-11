import { D, SVG, Notice, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';
import Profile from './ui/Profile.js';
import '../impl/messaging.js';

export default class ActivityScreen extends Screen {
	constructor(app) {
		super(app, 'Activity');
		this.activeTab = 'notifications';
		this.notifications = [];
		this.messages = [];
	}

	init() {
		const _this = this;
		super.init();

		if (!this.app.data.userdata) {
			this.app.navigateTo('/welcome', true);
			return;
		}

		this.reloadCount = 0;
		this.header.append([
			D('h1', 'Activity', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('p', 'Stay updated with your transactions and messages', 'text-gray-400 text-sm mt-1')
		]);

		this.tabsList = D('div', [
			D('button', [SVG.bell('w-4 h-4 mr-2'), 'Notification'], 'dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-background dark:text-muted-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 flex-1 data-[state=active]:bg-violet-600', { id: `radix-:rc:-trigger-notification`, type: 'button', role: 'tab', 'aria-selected': false, 'aria-controls': 'radix-:rc:-content-pos', 'data-state': 'inactive', 'data-slot': 'tabs-trigger', tabindex: '-1', 'data-panel': 'notifications', 'data-orientation': 'horizontal', 'data-radix-collection-item': '' }),
			D('button', [SVG.activity('w-4 h-4 mr-2'), 'Messages'], 'dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-background dark:text-muted-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 flex-1 data-[state=active]:bg-violet-600', { id: `radix-:rc:-trigger-messages`, type: 'button', role: 'tab', 'aria-selected': false, 'aria-controls': 'radix-:rc:-content-pos', 'data-state': 'inactive', 'data-slot': 'tabs-trigger', tabindex: '-1', 'data-panel': 'messages', 'data-orientation': 'horizontal', 'data-radix-collection-item': '' })
		], 'text-muted-foreground h-9 items-center justify-center rounded-xl flex flex-shrink-0 w-full bg-black/40 border border-violet-500/20 p-1', { role: 'tablist', 'aria-orientation': 'horizontal', 'data-slot': 'tabs-list', tabindex: '0', 'data-orientation': 'horizontal' }, 'outline: false');

		this.notificationsSkeleton = D('div', Array.from({ length: 5 }).map(() =>
			D('div', [
				D('div', D('div', null, 'w-10 h-10 bg-gray-800 rounded-full'), 'mb-2'),
				D('div', [
					D('div', D('div', null, 'w-32 h-4 bg-gray-800 rounded'), 'mb-1'),
					D('div', D('div', null, 'w-48 h-3 bg-gray-800 rounded'), ''),
					D('div', D('div', null, 'w-20 h-3 bg-gray-800 rounded'), '')
				], 'flex-1')
			], 'flex items-start gap-3 p-4 bg-gray-800 rounded-xl')
		), 'space-y-3 animate-pulse');

		this.messagesSkeleton = D('div', [
			D('div', [SVG.search('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500'), D('div', null, 'w-full h-9 bg-gray-800 rounded-xl')], 'relative mb-4'),
			D('div', Array.from({ length: 4 }).map(() =>
				D('div', [
					D('div', D('div', null, 'w-12 h-12 bg-gray-800 rounded-full'), 'mb-2'),
					D('div', [
						D('div', [
							D('div', D('div', null, 'w-24 h-4 bg-gray-800 rounded'), 'mb-1'),
							D('div', D('div', null, 'w-16 h-3 bg-gray-800 rounded'), '')
						], 'flex items-center justify-between mb-1'),
						D('div', D('div', null, 'w-40 h-3 bg-gray-800 rounded'), '')
					], 'flex-1')
				], 'flex items-center gap-3 p-4 bg-gray-800 rounded-xl')
			), 'space-y-3')
		], 'animate-pulse');

		this.failed = D('div', null, '');

		this.notificationTab = D('div', this.notificationsSkeleton, 'flex-1 outline-none overflow-y-auto space-y-3', { 'data-state': 'inactive', 'data-orientation': 'horizontal', role: 'tabpanel', 'aria-labelledby': 'radix-:rf:-trigger-notifications', id: 'radix-:rf:-content-notifications', tabindex: 0, 'data-slot': 'tabs-content', 'data-panel': 'notifications', hidden: '' });
		this.messageSearchInput = D('input', null, 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 border px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 bg-zinc-900 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl', { placeholder: 'Search messages...', 'data-slot': 'input' });
		this.messageTab = D('div', this.messagesSkeleton, 'flex-1 outline-none overflow-y-auto space-y-3', { 'data-state': 'inactive', 'data-orientation': 'horizontal', role: 'tabpanel', 'aria-labelledby': 'radix-:rf:-trigger-messages', id: 'radix-:rf:-content-messages', tabindex: 0, 'data-slot': 'tabs-content', 'data-panel': 'messages', hidden: '' });

		this.tabContent = D('div', [this.notificationTab, this.messageTab], 'flex flex-col flex-grow gap-2 w-full py-5', { dir: 'ltr', 'data-orientation': 'horizontal', 'data-slot': 'tab' });
		this.container.addClass('space-y-6').append(D('div', [this.tabsList, this.tabContent], 'w-full flex flex-col', { 'data-slot': 'tabs' }));
		this.app.display.mainContent.append([this.header, this.container]);

		this.tabsList.find('button').click(function () {
			const _tab = EQuery(this).getAttr('data-panel');
			_this.tabsList.find('button').removeClass('text-foreground').addClass('text-background').attr({ 'data-state': 'inactive' });
			EQuery(this).addClass('text-foreground').removeClass('text-background').attr({ 'data-state': 'active' });
			_this.tabContent.find('div[data-panel]').attr({ hidden: true, 'data-state': 'inactive' });
			_this.tabContent.find(`div[data-panel=${_tab}]`).attr({ 'data-state': 'active' }).removeAttr('hidden');
			_this.activeTab = _tab;
		});

		this.tabsList.find('button')[0].click();
		this.reload();
	}

	async reload(force = false) {
		if (!this.opened) return;
		if (!force && this.notifications.length !== 0)
			{ this.buildContent();return; }
		if (force) this.reloadCount = 0;
		if (this.reloadCount >= 10) {
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.failed.remove();

		try {
			const data = await fetchWithTimeout('/api/activity', {
				method: 'POST',
				headers: await this.app.authHeaders()
			});
			this.notifications = data.notifications || [];
			this.messages = data.messages || [];
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
		this.notificationTab.removeChildren();
		this.messageTab.removeChildren();

		this.notificationTab.append(this.notifications.map(this.notificationBuilder));

		const messageSearchContainer = D('div', [SVG.search('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500'), this.messageSearchInput], 'relative mb-4');
		const messageBottom = D('div', [
			D('div', [
				D('div', SVG.shield('w-5 h-5 text-violet-400'), 'w-10 h-10 bg-violet-600/20 rounded-full flex items-center justify-center'),
				D('div', [
					D('h4', 'Secure In-Wallet Chat', 'text-white text-sm mb-1'),
					D('p', 'All messages are encrypted end-to-end', 'text-xs text-gray-400')
				])
			], 'flex items-center gap-3')
		], 'mt-6 p-4 bg-gradient-to-r from-violet-600/10 to-purple-600/10 rounded-xl border border-violet-500/20');

		this.messageTab.append(messageSearchContainer, this.messages.map(this.messageBuilder), messageBottom);

		this.tabsList.find('button:first-child').append(this.notifications.filter(n => !n.read).length > 0 && D('span', this.notifications.filter(n => !n.read).length, 'absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center'));
		this.tabsList.find('button:last-child').append(this.messages.reduce((sum, m) => sum + m.unread, 0) > 0 && D('span', this.messages.reduce((sum, m) => sum + m.unread, 0), 'absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center'));
	}

	notificationBuilder(notification, index) {
		const Icon = this.getNotificationIcon(notification.type);
		return D('div', [
			D('div', [
				D('div', [(
					notification.avatar ?
						D('div', D('img', null, 'w-full h-full object-cover', { src: notification.avatar, alt: 'User' }), 'w-full h-full rounded-full overflow-hidden') :
						Icon('h-5 w-5')
				)], `w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${this.getNotificationColor(notification.type)}`),
				D('div', [
					D('div', [
						D('h4', notification.title, 'text-white text-sm'),
						D('span', notification.time, 'text-xs text-gray-500 whitespace-nowrap ml-2')
					], 'flex items-start justify-between mb-1'),
					D('p', notification.message, 'text-sm text-gray-400'), (!notification.read && D('div', D('div', 'New', 'bg-violet-600/20 text-violet-400 border-violet-600/30 text-xs'), 'mt-2'))
				], 'flex-1')
			], 'flex gap-3')
		], `p-4 bg-zinc-900 rounded-xl border transition-colors ${notification.read ? 'border-violet-500/20' : 'border-violet-500/50 bg-gradient-to-r from-violet-900/10 to-transparent'} animate-slideRight delay-[${index * 0.05}s]`, { 'data-notification': notification.id })
	}

	messageBuilder(message, index) {
		return D('div', [
			D('div', [
				D('div', [
					Profile.profileImage(this.app, message.user),
					(message.user.online && D('div', null, 'absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900'))
				], 'relative'),
				D('div', [
					D('div', [
						D('div', [
							D('h4', `${message.user.firstname} ${message.user.lastname}`, 'text-white text-sm'),
							D('p', message.user.content, 'text-xs text-gray-500')
						]),
						D('div', [
							D('span', message.time, 'text-xs text-gray-500 whitespace-nowrap'), (message.unread > 0 && D('div', message.unread, 'w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-xs'))
						], 'flex flex-col items-end gap-1')
					], 'flex items-center justify-between mb-1'),
					D('p', message.lastMessage, 'text-sm text-gray-400 truncate')
				], 'flex-1 min-w-0')
			], 'flex gap-3')
		], `p-4 bg-zinc-900 rounded-xl border hover:border-violet-500/50 transition-colors cursor-pointer ${message.unread > 0 ? 'border-violet-500/50 bg-gradient-to-r from-violet-900/10 to-transparent' : 'border-violet-500/20'} animate-slideRight delay-[${index * 0.05}s]`, { 'data-message': message.id })
	}

	getNotificationIcon(type) {
		switch (type) {
			case 'transaction':
				return SVG.trendingUp;
			case 'delivery':
				return SVG.package;
			case 'escrow':
				return SVG.shield;
			case 'social':
				return SVG.bell;
			default:
				return SVG.bell;
		}
	}

	getNotificationColor(type) {
		switch (type) {
			case 'transaction':
				return 'bg-green-600/20 text-green-400';
			case 'delivery':
				return 'bg-blue-600/20 text-blue-400';
			case 'escrow':
				return 'bg-violet-600/20 text-violet-400';
			case 'social':
				return 'bg-purple-600/20 text-purple-400';
			default:
				return 'bg-gray-600/20 text-gray-400';
		}
	}
}
