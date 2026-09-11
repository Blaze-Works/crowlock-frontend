import { D, SVG, Button, ImageWithFallback, Notice, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';
import Profile from './ui/Profile.js';
import Dropdown from './ui/Dropdown.js';

export default class ProfileScreen extends Screen {
	constructor(app) {
		super(app, 'Profile');
		this.size = 3;
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
			D('h1', 'Profile', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('p', 'Manage your account', 'text-gray-400 text-sm mt-1')
		);

		this.skipBtn = Button(['Skip.to saved data', SVG.home('w-5 h-5 transition-colors text-white')]).addClass('fixed right-12 top-12 z-50 animate-slideRight').click(() => { this.reloadCount = 999;this.reload();this.skipBtn.remove(); });
		this.container.addClass('space-y-6');

		this.profileSkeleton = D('div', [
			D('div', [
				D('div', null, 'absolute inset-0 bg-black/20'),
			], 'h-32 bg-gray-800 rounded-t-2xl relative overflow-hidden'),

			D('div', [
				D('div', [
					D('div', null, 'w-24 h-24 border-4 border-zinc-900 rounded-full overflow-hidden'),
					D('div', [
						D('div', [
							D('div', null, 'text-xl bg-gray-800 rounded'),
						], 'flex items-center gap-2 mb-1'),
						D('div', null, 'h-5 w-[60%] bg-gray-800 rounded')
					], 'flex-1 mt-14')
				], 'flex items-end gap-4 -mt-12 mb-4'),
				D('div', Array.from({ length: 4 }).map(() =>
					D('div', [
						D('div', null, 'h-5 w-[60%] bg-gray-800 rounded mb-1'),
						D('div', null, 'h-4 w-[40%] bg-gray-800 rounded')
					], 'text-center p-2 bg-black/40 rounded-lg')
				), 'grid grid-cols-4 gap-2 mb-4'),
				D('div', null, 'flex items-center justify-between p-3 bg-gray-800 rounded')
			], 'bg-zinc-900 rounded-b-2xl border border-violet-500/20 p-5 pt-0')
		], 'relative top-0 mb-6 pt-4 animate-pulse');

		this.tokensSkeleton = D('div', Array.from({ length: 2 }).map(() => D('div', [
			D('div', D('div', null, 'w-20 h-5 bg-gray-800 rounded'), 'mb-2'),
			D('div', D('div', null, 'w-16 h-8 bg-gray-800 rounded'), 'mb-1'),
			D('div', D('div', null, 'w-24 h-3 bg-gray-800 rounded'), 'mt-1')
		], 'p-4 bg-zinc-900 rounded-xl border border-violet-500/20')), 'grid grid-cols-2 gap-3 mb-6 animate-pulse');

		this.achievementsSkeleton = D('div', [
			D('div', D('div', null, 'w-32 h-5 bg-gray-800 rounded'), 'mb-3'), ...Array.from({ length: 2 }).map(() =>
			D('div', [
				D('div', D('div', null, 'w-10 h-10 bg-gray-800 rounded-full'), 'mb-2'),
				D('div', D('div', null, 'w-16 h-4 bg-gray-800 rounded'), '')
			], 'flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-violet-500/20')
		)], 'mb-6 animate-pulse');

		this.tabsSkeleton = D('div', [
			D('div', Array.from({ length: 3 }).map(() => D('div', null, 'w-16 h-8 bg-gray-800 rounded')), 'w-full bg-zinc-900 border border-violet-500/20 rounded-xl p-1 flex gap-1'),
			D('div', Array.from({ length: 3 }).map(() => D('div', D('div', null, 'w-full h-32 bg-gray-800 rounded'), 'aspect-square rounded-lg overflow-hidden mb-1')), 'grid grid-cols-3 gap-1 mt-4')
		], 'animate-pulse');

		this.failed = this.createEmptyState('Failed to load account Profile', 'Something went wrong, have another go?', 'profile', Button([SVG.reload('size-4'), 'Try again']).click(() => this.reload(true)));
		this.app.display.mainContent.append(this.header, this.container);
		this.reload();
	}

	async reload(force = false) {
		if (!this.opened) return;
		if (!force && this.loaded) { this.buildContent(); return; }
		if (this.reloadCount >= 4 && !force) {
			if (this.app.data.profile !== undefined) {
				this.container.removeChildren();
				this.buildContent();
				this.loaded = true;
				Notice('Profile data may not be up to date', 'warn');
				return;
			}
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.failed.remove();
		this.container.removeChildren().append(this.profileSkeleton, this.tokensSkeleton, this.achievementsSkeleton, this.tabsSkeleton);

		try {
			const data = await fetchWithTimeout('/api/user/profile', {
				method: 'POST',
				headers: await this.app.authHeaders()
			});

			this.app.data.profile = data.profile || {};
			this.app.data.userdata = data.user;

			this.profileSkeleton.remove()
			this.tokensSkeleton.remove();
			this.achievementsSkeleton.remove();
			this.tabsSkeleton.remove();
			this.skipBtn.remove();
			this.app.storage.set(this.app.data);
			this.loaded = true;
		} catch (err) {
			Notice(await handleError(err), 'error');
			if (err.status == 500) { this.container.removeChildren().append(this.failed);return }
			await wait(2000);
			!!(this.app.data.profile && this.app.data.alpha) && this.container.after(this.skipBtn);
			this.reloadCount++;
			this.reload();
			return;
		}

		this.buildContent();
	}

	buildContent() {
		this.container.removeChildren();
		this.profile = D('div', [
			D('div', [
				D('div', null, 'absolute inset-0 bg-black/20'),
				D('div', null, 'absolute -right-8 top-2 h-20 w-20 rounded-full bg-white/10 blur-3x1'),
				D('div', [
					D('button', SVG.settings('w-5 h-5'), 'bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full').click(ev => {
						const dropdown = new Dropdown(this.app, [
							{ 'Signed in as': `@${this.app.data.userdata.username }` },
							{ 'Account Settings': ['settings', () => this.opwnSettings()] },
							{ 'Sign Out': ['out', () => this.app.logout(true)] }
						], ev)
					})
				], 'absolute top-2 right-2')
			], 'h-32 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 rounded-t-2xl relative overflow-hidden'),

			D('div', [
				D('div', [
					D('div', [
						ImageWithFallback({ src: this.app.data.userdata.avatar, alt: 'Profile' }),
						this.app.data.userdata.verified && D('span', SVG.badgeCheck('w-5 h-5'), 'absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-white shadow-glow')
					], 'relative w-24 h-24 bg-zinc-900 border-4 z-[4] border-zinc-900 rounded-full overflow-hidden'),
					D('div', [
						D('div', [
							D('h2', `${this.app.data.userdata.firstname} ${this.app.data.userdata.lastname}`, 'text-xl text-white'), this.app.data.userdata.verified && SVG.badgeCheck('w-5 h-5 text-violet-400')
						], 'flex items-center gap-2 mb-1'),
						D('p', `@${this.app.data.userdata.username}${this.app.data.userdata.verified && ' • Verified'}`, 'text-gray-500 text-sm')
					], 'flex-1 mt-16')
				], 'flex items-center gap-4 -mt-14'),
				D('div', [
					{ label: 'Posts', value: this.app.data.profile.stats.posts },
					{ label: 'Products', value: this.app.data.profile.stats.products },
					{ label: 'Followers', value: this.app.data.profile.stats.followers },
					{ label: 'Following', value: this.app.data.profile.stats.following }
				].map(stat =>
					D('div', [
						D('div', stat.value.toString(), 'text-white mb-1'),
						D('div', stat.label, 'text-xs text-gray-500')
					], 'text-center p-2 bg-black/40 rounded-lg', { 'data-key': stat.label })
				), 'grid grid-cols-4 gap-2'),
				D('div', [
					D('div', [
						SVG.product('w-5 h-5 text-violet-400'),
						D('span', 'Trader Mode', 'text-sm text-white')
					], 'flex items-center gap-2'),
					D('input', null, 'ml-auto', { type: 'checkbox', checked: true }).click(() => { })
				], 'flex items-center justify-between p-3 bg-black/40 rounded-xl border border-violet-500/20')
			], 'bg-zinc-900 rounded-b-2xl border border-violet-500/20 p-5 pt-0 space-y-4')
		], 'relative top-0 pt-4 animate-slideDown');

		this.tokens = D('div', [
			D('div', [
				D('div', [
					SVG.star('w-5 h-5 text-yellow-300'),
					D('span', 'Crow Tokens', 'text-sm text-white/80')
				], 'flex items-center gap-2 mb-2'),
				D('p', this.app.data.profile.stats.crowTokens.total.toString(), 'text-2xl text-white'),
				D('p', `+${this.app.data.profile.stats.crowTokens.inc} this month`, 'text-xs text-white/60 mt-1')
			], 'p-4 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30'),
			D('div', [
				D('div', [
					SVG.star('w-5 h-5 text-yellow-400'),
					D('span', 'Rating', 'text-sm text-gray-400')
				], 'flex items-center gap-2 mb-2'),
				D('p', this.app.data.profile.stats.rating.toString(), 'text-2xl text-white'),
				D('p', `${this.app.data.profile.stats.totalSales} sales`, 'text-xs text-gray-500 mt-1')
			], 'p-4 bg-zinc-900 rounded-xl border border-violet-500/20')
		], 'grid grid-cols-2 gap-3 animate-fadeIn', null, 'animation-delay: 0.1s');

		this.verification = D('div', [
			D('h3', 'Verification', 'text-white mb-3'),
			D('div',  [
				{ label: 'Email address', value: this.app.data.profile.stats.verification.email, fn: () => {} },
				{ label: 'Phone number', value: this.app.data.profile.stats.verification.phone, fn: () => {} },
				{ label: 'Government ID', value: this.app.data.profile.stats.verification.govId, fn: () => {} },
				{ label: 'Home Address', value: this.app.data.profile.stats.verification.address, fn: () => {} }
			].map(item =>
				D('div', [
					D('span', item.label, 'flex-grow text-md font-medium text-gray-600'),
					D('div', 'Not started', 'rounded-full px-2 py-0.5 text-[10px] font-semibold data-[state=Verified]:text-green-600 data-[state=Verified]:bg-green-700/20 data-[state=Pwnsing]:color-yellow-600 data-[state=Pending]:bg-yellow-600/20 text-red-600 bg-red-700/20', { 'data-state': item.value }),
					D('div', SVG.arrowUpRight('w-5 h-5'), 'ml-2')
				], 'flex items-center justify-between rounded-2xl border border-violet-500/20 bg-black/40 p-3')
			), 'bg-zinc-900 rounded-2xl border border-violet-500/20 p-5 mt-2 space-y-2')
		], 'animate-fadeIn', null, 'animation-delay: 0.2s');

		this.achievements = D('div', [
			D('h3', 'Achievements', 'text-white mb-3'),
			D('div', this.achievementBuilder(this.app.data.profile.achievements), 'grid grid-cols-2 gap-2 [&:has(div:nth-child(1):last-child)]:grid-cols-1')
		], 'animate-fadeIn', null, 'animation-delay: 0.3s');

		const tabHeader = D('div', [
			D('button', 'Posts', 'flex-1 data-[state=active]:bg-violet-600 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:text-foreground text-background dark:text-muted-foreground', { 'data-panel': 'posts', 'data-state': 'inactive' }),
			D('button', 'Products', 'flex-1 data-[state=active]:bg-violet-600 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:text-foreground text-background dark:text-muted-foreground', { 'data-panel': 'products', 'data-state': 'inactive' }),
			D('button', 'Reviews', 'flex-1 data-[state=active]:bg-violet-600 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:text-foreground text-background dark:text-muted-foreground', { 'data-panel': 'reviews', 'data-state': 'inactive' })
		], 'w-full bg-zinc-900 border border-violet-500/20 rounded-xl p-1 flex');
		const tabContent = D('div', [
			D('div', this.postBuilder(this.app.data.profile.posts), 'flex flex-col gap-3', { 'data-panel': 'posts', 'data-state': 'active' }),
			D('div', this.productsBuilder(this.app.data.profile.products), 'grid grid-cols-3 gap-3 [&:has(div:nth-child(1):last-child)]:grid-cols-1 hidden', { 'data-panel': 'products', 'data-state': 'inactive' }),
			D('div', this.reviewsBuilder(this.app.data.profile.reviews), 'space-y-3 hidden', { 'data-panel': 'reviews', 'data-state': 'inactive' })
		], 'mt-4');

		tabHeader.find('button').click(function () {
			const _tab = EQuery(this).getAttr('data-panel');
			tabHeader.find('button').removeClass('text-foreground').addClass('text-background').attr({ 'data-state': 'inactive' });
			EQuery(this).addClass('text-foreground').removeClass('text-background').attr({ 'data-state': 'active' });
			tabContent.find('div[data-panel]').addClass('hidden').attr({ 'data-state': 'inactive' });
			tabContent.find(`div[data-panel=${_tab}]`).removeClass('hidden').attr({ 'data-state': 'active' });
		});

		tabHeader.find('button:first-child')[0].click();
		this.tabs = D('div', [tabHeader, tabContent], 'animate-fadeIn', null, 'animation-delay: 0.4s');

		this.optiona = D('div');

		this.container.append(this.profile, this.verification, this.achievements, this.options, null);
	}

	achievementBuilder(achievements) {
		if (achievements.length == 0) return this.createEmptyState('No achievements obtained', '');
		return achievements.map(achievement => D('div', [
			SVG[achievement.icon](`w-5 h-5 text-[${achievement.color}]`),
			D('span', achievement.name, 'text-sm text-white')
		], 'flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-violet-500/20'));
	}

	postBuilder(posts) {
		if (posts.length == 0) return this.createEmptyState('No posts found', 'You haven\'t made any posts', 'post', Button([SVG.add('size-4'), 'Create one']).click(() => this.app.createPostmodal.open()));
		return posts.map(post => D('div', [
			D('div', SVG.ellipsis('w-4 h-4 [&>circle]:fill-gray-100'), 'absolute right-4 top-4 rounded-full p-1 bg-black/20').click(e => new Dropdown(this.app, {
				'Edit': ['edit', () => this.openPostEdit(post.id)],
				'Delete': ['delete', () => this.requestPostDelete(post.id)]
			}, e)),
			Profile.post(this.app, post.user),
			post.image && D('div', [ImageWithFallback({ src: post.image }), D('div', null, 'absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300')], 'relative w-full overflow-hidden'),
			D('div', [
				D('div', [
					D('p', post.content, 'text-sm')
				], 'select-text'),
				D('div', [
					D('div', [
						D('button', [SVG.heart('w-5 h-5 text-gray-400 hover:text-red-400'), D('span', post.likes.length.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 transition-colors'),
						D('button', [SVG.messageCircle('w-5 h-5 text-gray-400 hover:text-violet-400'), D('span', post.replyCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors', { 'data-navigation': `/home/${post.id}` }),
						D('button', [SVG.share('w-5 h-5 text-gray-400 hover:text-violet-400'), D('span', post.shareCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 transition-colors pointer')
					], 'flex items-center gap-6'), , D('div', post.createdAt, 'text-xs text-gray-400')
				], 'flex items-center justify-between pt-2')
			], 'p-4 space-y-3')
		], 'relative bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-violet-500/20 animate-fadeIn', { 'data-post': post.id }));
	}

	productsBuilder(products) {
		if (products.length == 0) return this.createEmptyState('No products found', 'There\'re no listed products here', 'product', Button([SVG.add('size-4'), 'Create a listing']).click(() => this.app.createPostmodal.open(true)));
		return products.slice(0, 4).map(product => D('div', [
			ImageWithFallback({ src: product.image, alt: 'Product' }),
			D('div', [
				D('span', product.price, 'bg-violet-600 text-white px-2 py-1 rounded text-xs')
			], 'absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center')
		], 'aspect-square rounded-lg overflow-hidden border border-violet-500/20 relative group cursor-pointer'));
	}

	reviewsBuilder(reviews) {
		if (reviews.length == 0) return this.createEmptyState('No reviews yet', 'Reviews come from your buyers, try ...', 'reviews');
		return reviews.map(review => D('div', [
			D('div', [
				Profile.profileImage(this.app, review.user),
				D('div', [
					D('div', [
						D('span', review.user.username, 'text-sm text-white'),
						D('span', review.date, 'text-xs text-gray-500')
					], 'flex items-center justify-between mb-1'),
					D('div', Array.from({ length: 5 }).map((_, i) =>
						SVG.star(`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`)
					), 'flex gap-1 mb-2'),
					D('p', review.comment, 'text-sm text-gray-400')
				], 'flex-1')
			], 'flex items-start gap-3 mb-2')
		], 'p-4 bg-zinc-900 rounded-xl border border-violet-500/20'));
	}

	openPostEdit(pid) {
		const post = this.app.data.profile.posts.filter(p => p.id = pid);
	}

	requestPostDelete(pid) {
		const post = this.postBuilder(this.app.data.profile.posts.filter(p => p.id = pid));
		const deleteBtn = Button('Delete Post').addClass('font-semibold text-4 px-10 bg-red-500');
		post.find('.absolute').remove();
		const Modal = new Modal(this.app, {
			header: 'Delete this post?',
			content: { html: D('div', [
				D('div', 'Deleting a post may affect your interaction score'),
				D('div', post, deleteBtn)
			]) },
		});

		deleteBtn.click(async () => {
			const prevText = deleteBtn.text();
			deleteBtn.addClass('opacity-50 pointer-events-none').removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Deleting...');

			try {
				await fetchWithTimeout(`/api/feed/${pid}`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (err) { Notice(await handleError(err)); }
			finally { deleteBtn.removeClass('opacity-50', 'pointer-events-none').text(prevText) }
		});
	}
}
