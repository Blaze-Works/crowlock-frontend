import { D, SVG, Notice, truncate, log, Input, Button, ImageWithFallback, wait, fetchWithTimeout, handleError } from '../utils.js';
import Screen from './ui/Screen.js';
import Drawer from './ui/Drawer.js';
import Profile from './ui/Profile.js';

export default class HomeFeed extends Screen {
	constructor(app) {
		super(app, 'Home Feed');
		this.posts = [];
		this.loadedPosts = {};
	}

	init(node) {
		super.init();
		this.reloadCount = 0;
		this.header.append(
			D('h1', 'Social Feed', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
			D('p', 'Discover and trade with the community', 'text-gray-400 text-sm mt-1')
		);

		this.replyOverlay = D('div', null, 'fixed inset-0 bg-black bg-opacity-50 z-30');
		this.replyScroller = D('div', null, 'flex-1 overflow-y-auto p-4 space-y-4');
		this.replyInput = Input({ type: 'text', placeholder: 'Add a reply...', name: 'replay-input' }).addClass('flex-1 p-2 border rounded-full focus:outline-none');
		this.replySendBtn = Button('Send');
		this.replyClose = D('button', SVG.close('h-6 w-6'), 'absolute top-3 right-4');
		this.replyDrawer = D('div', [
			D('div', [
				D('div', [
					D('div', null, 'w-10 h-1 bg-gray-500 hover:bg-gray-300 rounded-3xl shadow-xl'),
					D('h2', 'Replies', 'font-semibold text-gray-300 text-lg'),
				], 'flex flex-col items-center p-2 border-b border-gray-500'), this.replyClose, this.replyScroller
			], 'relative flex flex-col h-full bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-t-3xl max-w-4xl mx-auto mt-0 mb-0 shadow-xl')
		], 'fixed inset-x-0 bottom-0 top-[30%] z-40 translate-y animate-slideUp');

		this.empty = this.createEmptyState('No Posts yet', 'Be the first to share something with the community', 'feed', Button([SVG.add('w-5 h-5'), 'Create your first post']).click(() => this.app.createPostmodal.open()));
		this.failed = this.createEmptyState('Failed to load feed', 'Hmm... that wasn\'t supposed to happen', 'feed', Button([SVG.reload('w-5 h-5'), 'Try again']).click(() => this.reload(true)));

		this.container.addClass('space-y-6');

		this.skeletonLoader = [D('div', [
			D('div', [
				D('div', [
					D('div', [D('div', null, 'bg-gray-800 w-full h-full object-cover')], 'w-10 h-10 rounded-full overflow-hidden'),
					D('div', [
						D('div', [D('div', null, 'w-40 h-[15px] bg-gray-800 rounded-[10px]')], 'flex items-center gap-2'), D('div', null, 'w-20 h-[10px] bg-gray-800 rounded-[10px] mt-2')
					], 'flex-1')
				], 'p-4 flex items-center gap-3'),
				D('div', [D('div', null, 'w-full h-full bg-gray-800 object-cover')], 'relative aspect-square overflow-hidden'),
				D('div', [
					D('div', [D('div', null, 'w-[40%] h-5 bg-gray-800 rounded-[12px] mb-2'), D('div', null, 'w-full h-3 bg-gray-800 rounded-[12px]')]),
					D('div', null, 'w-full h-[40px] bg-gray-800 rounded-xl')
				], 'p-4 space-y-3')
			])
		], 'bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden animate-pulse'), D('div', [
			D('div', [
				D('div', [
					D('div', [D('div', null, 'bg-gray-800 w-full h-full object-cover')], 'w-10 h-10 rounded-full overflow-hidden'),
					D('div', [
						D('div', [D('div', null, 'w-40 h-[15px] bg-gray-800 rounded-[10px]')], 'flex items-center gap-2'), D('div', null, 'w-20 h-[10px] bg-gray-800 rounded-[10px] mt-2')
					], 'flex-1')
				], 'p-4 flex items-center gap-3'),
				D('div', [
					D('div', [D('div', null, 'w-[40%] h-5 bg-gray-800 rounded-[12px] mb-2'), D('div', null, 'w-full h-3 bg-gray-800 rounded-[12px]')])
				], 'p-4 space-y-3')
			])
		], 'bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden animate-pulse'),  D('div', [
			D('div', [
				D('div', [
					D('div', [D('div', null, 'bg-gray-800 w-full h-full object-cover')], 'w-10 h-10 rounded-full overflow-hidden'),
					D('div', [
						D('div', [D('div', null, 'w-40 h-[15px] bg-gray-800 rounded-[10px]')], 'flex items-center gap-2'), D('div', null, 'w-20 h-[10px] bg-gray-800 rounded-[10px] mt-2')
					], 'flex-1')
				], 'p-4 flex items-center gap-3'),
				D('div', [
					D('div', [D('div', null, 'w-[40%] h-5 bg-gray-800 rounded-[12px] mb-2'), D('div', null, 'w-full h-3 bg-gray-800 rounded-[12px]')]),
				], 'p-4 space-y-3')
			])
		], 'bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden animate-pulse')];

		this.app.display.mainContent.append(this.header, this.container);

		if (!!node) { this.openReplys(node, true); return }
		this.reload();
	}

	async reload(force = false) {
		if (!this.opened) return;
		if (force) this.reloadCount = 0;
		if (!force && this.posts.length !== 0)
			{ this.buildContent(); return; }
		if (this.reloadCount >= 10) {
			this.container.removeChildren().append(this.failed);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.empty.remove();
		this.failed.remove();
		this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
		this.container.removeChildren().append(this.skeletonLoader);

		try {
			const data = await fetchWithTimeout('/api/feed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			this.posts = data.posts || [];
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

	isUserLiking(post) {
		const uid = this.app.data.userdata?.uid;
		return uid && post.likes.includes(uid);
	}

	postBuilder(post) {
		const _this = this;
		const heartSVG = SVG.heart('w-5 h-5 text-gray-400');
		this.isUserLiking(post) && EQuery(heartSVG).removeClass('text-gray-400').addClass('text-red-400').find('path').attr({ 'fill': 'currentColor' });
		return post.isProduct ? D('div', [
			Profile.post(this.app, post.user),
			D('div', [ImageWithFallback({ src: post.image, alt: post.name }), D('div', null, 'absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300')], 'relative aspect-square overflow-hidden'),
			D('div', [
				D('div', [
					D('h3', post.name, 'text-white mb-1'),
					D('p', post.description, 'text-sm text-gray-400')
				], 'select-text'),
				D('div', [
					D('div', [
						D('p', 'Price', 'text-xs text-gray-500'),
						D('div', [D('span', post.priceCrypto, 'text-violet-400'), D('span', `≈ $${post.priceFlat}`, 'text-sm text-gray-500')], 'flex items-baseline gap-2')
					], 'flex-1'), Button([SVG.shoppingBag('w-4 h-4 mr-2'), 'Buy via Escrow'])
				], 'flex items-center gap-4 p-3 bg-black/40 rounded-xl border border-violet-500/20'),
				D('div', [
					D('div', [
						D('button', [heartSVG, D('span', truncate(post.likes.length.toString()), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 [&>svg]:hover:text-red-400 transition-colors').on('click', async function () {
							if (!_this.app.data.userdata) return;
							if (post.likes.indexOf(_this.app.data.userdata.uid) === -1) {
								const likes = (await fetchWithTimeout(`/api/feed/like/products/${post.id}`, { method: 'put', headers: _this.app.authHeaders() })).likes;
								EQuery(this).find('svg path').attr({ fill: '#f87171' });
								EQuery(this).find('span').text(likes);
							} else {
								const likes = (await fetchWithTimeout(`/api/feed/rmlike/products/${post.id}`, { method: 'put', headers: _this.app.authHeaders() })).likes;
								EQuery(this).find('svg path').attr({ fill: 'none' });
								EQuery(this).find('span').text(likes);
							}
						}),
						D('button', [SVG.messageCircle('w-5 h-5 text-gray-400'), D('span', post.replyCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 [&>svg]:hover:text-violet-400 transition-colors').click(async () => await this.openReplys(post.id)),
						D('button', [SVG.share('w-5 h-5 text-gray-400'), D('span', post.shareCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 [&>svg]:hover:text-violet-400 transition-colors').click(async function () {
							try {
								await navigator.share({ title: 'Crowlock', text: `Product listing from @${post.user.username} on Crowlock`, url: `/home/${post.id}` });
								const count = (await fetchWithTimeout(`/api/share/products/${post.id}`, { method: 'put' })).share;
								EQuery(this).find('span').text(count);
								post.shareCount = count;
							} catch (err) { log(await handleError(err)); }
						})
					], 'flex items-center gap-6'),
					D('div', [D('button', SVG.bookmark('w-5 h-5 text-gray-400'), 'text-gray-400 hover:text-violet-400 [&>svg]:hover:text-violet-400'), D('div', post.createdAt, 'text-xs text-gray-400')])
				], 'flex items-center justify-between pt-2')
			], 'p-4 space-y-3')
		], 'bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-violet-500/20 animate-fadeIn', { 'data-product': post.id }) : D('div', [
			Profile.post(this.app, post.user),
			post.image && D('div', [ImageWithFallback({ src: post.image }), D('div', null, 'absolute inset-0 bg-gradient-to-t from-violet-900/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300')], 'relative w-full overflow-hidden'),
			D('div', [
				D('div', [
					D('p', post.content, 'text-sm')
				], 'select-text'),
				D('div', [
					D('div', [
						D('button', [SVG.heart('w-5 h-5 text-gray-400'), D('span', truncate(post.likes.length.toString()), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 [&>svg]:hover:text-red-400 transition-colors').click(async function () {
							if (!_this.app.data.userdata) return;
							if (post.likes.indexOf(_this.app.data?.userdata.uid) === -1) {
								const likes = (await fetchWithTimeout(`/api/feed/like/posts/${post.id}`, { method: 'put', headers: _this.app.authHeaders() })).likes;
								EQuery(this).find('svg path').attr({ fill: '#f87171' });
								EQuery(this).find('span').text(likes);
							} else {
								const likes = (await fetchWithTimeout(`/api/feed/rmlike/posts/${post.id}`, { method: 'put', headers: _this.app.authHeaders() })).likes;
								EQuery(this).find('svg path').attr({ fill: 'none' });
								EQuery(this).find('span').text(likes);
							}
						}),
						D('button', [SVG.messageCircle('w-5 h-5 text-gray-400'), D('span', post.replyCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 [&>svg]:hover:text-violet-400 transition-colors').click(async () => await this.openReplys(post.id)),
						D('button', [SVG.share('w-5 h-5 text-gray-400'), D('span', post.shareCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 [&>svg]:hover:text-violet-400 transition-colors').click(async function () {
							try {
								await navigator.share({ title: 'Crowlock', text: `Post from @${post.user.username} on Crowlock`, url: `/home/${post.id}` });
								const count = (await fetchWithTimeout(`/api/feed/share/posts/${post.id}`, { method: 'put' })).share;
								EQuery(this).find('span').text(count);
								post.shareCount = count;
							} catch (err) { log.error(await handleError(err)); }
						})
					], 'flex items-center gap-6'), D('div', post.createdAt, 'text-xs text-gray-400')
				], 'flex items-center justify-between pt-2')
			], 'p-4 space-y-3')
		], 'bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-violet-500/20 animate-fadeIn', { 'data-post': post.id })
	}

	buildContent() {
		if (this.posts.length == 0) {
			this.container.removeChildren().append(this.empty);
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
			return;
		}
		this.container.removeChildren();
		const posts = [];
		this.posts.forEach(post => {
			posts.push(this.postBuilder(post));
			this.loadedPosts[post.id] = post;
		});
		this.container.append(posts);
	}

	buildReplyTree(replies, parent, isChild = false) {
		const _this = this;

		if (replies.length === 0) {
			return D('div', D('div', this.app.data.userdata ? 'Be the first to reply' : 'Login to create a reply', 'text-sm text-gray-200'), 'relative p-4 pb-0 flex justify-center space-y-3 gap-3');
		}
		return replies.map(reply => D('div', [
			isChild && D('div', null, 'absolute left-0 top-6 w-6 h-6 border-l-2 border-b-2 border-gray-800 rounded-bl-full -ml-2', { 'data-slot': 'branch' }),
			Profile.profileImage(this.app, reply.user),
			D('div', [
				Profile.small(this.app, reply.user),
				D('p', reply.content, 'text-sm text-gray-100'),
				D('div', [
					D('div', [
						D('button', [SVG.heart('w-5 h-5 text-gray-400 hover:text-red-400'), D('span', reply.likes.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors').click(async function () {
							if (!_this.app.data.userdata) return;
							const likes = (await fetchWithTimeout(`/api/feed/like/reply/${reply.id}`, { method: 'put', headers: await _this.app.authHeaders() })).likes;
							EQuery(this).find('span').text(likes);
						}),
						this.app.data.userdata && D('button', [SVG.messageCircle('w-5 h-5 text-gray-400 hover:text-violet-400'), D('span', reply.replyCount.toString(), 'text-sm')], 'flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors').click(function () {
							let overlay;
							const _reply = EQuery(`[data-reply='${reply.id}']`);
							const parent = _reply[0].parentElement;
							const sibling = _reply[0].nextSibling;
							const pos = _reply.getBoundingClientRect();
							const replace = D('div', null, `h-[${pos.height}px] w-[${pos.width}px]`);
							const input = Input({ type: 'text', placeholder: 'Add a reply...' }).addClass('flex-1 p-2 border rounded-full focus:outline-none')
							const replyBar = D('div', [
								D('div', ImageWithFallback({ src: _this.app.data.userdata.avatar, alt: `@${_this.app.data.userdata.username}` }), 'w-9 h-9 rounded-full overflow-hidden'),
								input, Button('Send').click(async function () {
									try {
										if (input.val().length == 0) return;
										EQuery(this).addClass('opacity-50 pointer-events-none').removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Sending...');
										replies = await fetchWithTimeout('/api/feed/submit-reply', {
											method: 'POST',
											headers: await _this.app.authHeaders(),
											body: JSON.stringify({ parentId: reply.id, content: input.val() })
										}).replies;

										overlay[0].click();
										input.val('');
										parent.append(_this.buildReplyTree(replies, parent, true));
									} catch (err) {
										Notice(await handleError(err), 'error');
									} finally {
										EQuery(this).removeClass('opacity-50', 'pointer-events-none').text('Send');
									}
								})
							], 'border-t border-gray-500 p-3 mt-2 flex items-center space-x-3 animate-slideUp');

							_reply.find('[data-slot=\'reply-content\']').append(replyBar);
							_reply.addClass('w-screen max-w-3xl').after(replace);
							overlay = D('div', D('div', _reply, 'fixed', null, `top: ${pos.top}px; left: ${pos.left}px;${pos.right < 0 ? ' right: 0' : ''}`), 'fixed inset-0 bg-black bg-opacity-50 z-40').click(function (e) {
								if (e.currentTarget !== e.target) return;
								EQuery(this).remove();
								sibling ? EQuery(sibling).before(_reply.removeClass('w-screen', 'max-w-4xl')) :
									EQuery(parent).append(_reply.removeClass('w-screen', 'max-w-4xl'));
								replace.remove();
								replyBar.remove();
							});
							_this.app.display.container.append(overlay);
							input.keydown(e => e.keyCode == 13 && input[0].nextSibling.click())[0].focus();
							screen.orientation.addEventListener('change', () => overlay[0].click());
						}),
						reply.replyCount > 0 && D('button', D('span', 'Show replies', 'text-sm'), 'flex items-center gap-2 text-gray-400 hover:text-violet-400 transition-colors', { 'data-hide': 'true' }).click(function () {
							if (this.dataset.hide === 'false') {
								EQuery(this).find('span').text('Show replies');
								EQuery(`[data-reply='${reply.id}']`).find('[data-slot=reply-children]').addClass('hidden').removeChildren();
								this.dataset.hide = 'true';
							} else {
								EQuery(this).find('span').text('Hide replies')
								const _parent = EQuery(`[data-reply='${reply.id}']`).find('[data-slot=reply-children]');
								_parent.removeClass('hidden').append(_this.buildReplyTree(reply.replies, _parent, true));
								this.dataset.hide = 'false';
							}
						})
					], 'flex items-center gap-6')
				], 'flex flex-col gap-2 pt-2'),
				D('div', null, 'relative pl-[6px] border-l-2 border-gray-800 -ml-10 hidden animate-[open_.6s_ease]', { 'data-slot': 'reply-children' })
			], 'flex-1', { 'data-slot': 'reply-content' })
		], 'relative p-4 pb-0 flex space-y-3 gap-3', { 'data-parent': reply.parentId, 'data-reply': reply.id }));
	}

	async openReplys(postId, hideFeed = false) {
		if (!this.loadedPosts[postId]) {
			if (!this.opened) return;
			if (this.reloadCount >= 10) {
				this.container.removeChildren().after(this.failed);
				this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
				return;
			}
			this.empty.remove();
			this.failed.remove();
			this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
			this.container.removeChildren().append(this.skeletonLoader);
			try {
				const data = await fetchWithTimeout(`/api/feed/${postId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				});
				this.loadedPosts[postId] = data;
			} catch (err) {
				if (err.status == 404) {
					this.container.removeChildren();
					this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'radial' })
					this.app.display.mainContent.append(this.app.display.error404);
					return;
				}
				Notice(await handleError(err), 'error');
				await wait(10000);
				this.reloadCount++;
				this.openReplys(postId);
				return;
			}
		}

		const replies = this.loadedPosts[postId].replies;
		const bottom = D('div', [
			D('div', ImageWithFallback({ src: this.app.data.userdata?.avatar, alt: `@${this.app.data.userdata?.username}` }), 'w-9 h-9 rounded-full overflow-hidden'),
			this.replyInput, this.replySendBtn
		], 'border-t border-gray-500 p-3 flex items-center space-x-3');

		this.replyScroller.append(this.buildReplyTree(replies, this.replyScroller));
		const forceClose = () => {
			this.replyScroller.removeChildren();
			bottom.remove();
		};

		const drawer = new Drawer(this.app, { header: 'Replies', content: this.replyScroller, close: forceClose });

		hideFeed && this.container.removeChildren().append(this.postBuilder(this.loadedPosts[postId]));
		this.app.data.userdata && this.replyScroller.after(bottom);

		this.replyInput.keydown(e => e.keyCode == 13 && this.replySendBtn[0].click());
		this.replySendBtn.click(async () => {
			try {
				if (this.replyInput.val().length === 0) return;
				this.replySendBtn.addClass('opacity-50 pointer-events-none').removeChildren().append(D('div', SVG.loader('animate-spin'), 'inline-flex items-center justify-center shrink-0 [&;_svg]:h-[20px] [&;_svg]:w-[20px] text-foreground-lighter'), 'Sending...');
				const response = await fetchWithTimeout('/api/feed/submit-reply', {
					method: 'POST',
					headers: await this.app.authHeaders(),
					body: JSON.stringify({ parentId: postId, content: this.replyInput.val() })
				});
				this.replyInput.val('');
				this.loadedPosts[postId].replies = response.replies;
				this.replyScroller.removeChildren().append(this.buildReplyTree(response.replies))
			} catch (err) {
				Notice(await handleError(err), 'error');
			} finally {
				this.replySendBtn.removeClass('opacity-50', 'pointer-events-none').text('Send');
			}
		});

		await wait(400);
		this.replyDrawer.removeClass('animate-slideUp');
	}
}
