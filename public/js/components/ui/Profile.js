import { log, D, SVG, Button, Notice, truncate, ImageWithFallback, fetchWithTimeout, handleError } from '../../utils.js';
import Drawer from './Drawer.js';

export default class Profile {
	static post(app, user) {
		return D('div', [
			D('div', ImageWithFallback({ src: user.avatar, alt: user.username }), 'w-10 h-10 border-2 border-violet-500/30 rounded-full overflow-hidden'),
			D('div', [
				D('div', [D('span', !(!user.firstname && user.firstname !== '') ? `@${user.username}` : `${user.firstname} ${user.lastname}`, 'text-white text-sm'), (user.verified && SVG.badgeCheck('w-4 h-4 text-violet-400'))], 'flex items-center gap-2'),
				D('p', `@${user.username}`, 'text-xs text-gray-500')
			], 'flex-1'),
			(user.verified && D('span', 'Verified Trader', 'inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-accent [a&]:hover:text-accent-foreground border-violet-500/50 text-violet-400 text-xs'))
		], 'p-4 flex items-center gap-3').click(function () { Profile.openPopup(app, user, EQuery(this).getBoundingClientRect()) });
	}

	static profileImage(app, user) {
		return D('div', ImageWithFallback({ src: user.avatar, alt: user.username }), 'w-10 h-10 border-2 border-violet-500/30 rounded-full overflow-hidden').click(function () { Profile.openPopup(app, user, EQuery(this).getBoundingClientRect()) });
	}

	static small(app, user) {
		return D('div', [D('span', `@${user.username}`, 'text-xs text-gray-500'), (user.verified && SVG.badgeCheck('w-4 h-4 text-violet-400'))], 'flex items-center gap-2').click(function () { Profile.openPopup(app, user, EQuery(this).getBoundingClientRect()) });
	}

	static async openPopup(app, user, pos) {
		const content = [
			D('div', D('div', SVG.ellipsis('w-4 h-4 [&>circle]:fill-gray-100'), 'absolute right-4 top-4 rounded-full p-1 bg-black/20').click(() => {}), `h-[155px] ${user.bannerColor || 'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600'}`),
			D('div', [
				D('div', D('div', ImageWithFallback({ src: user.avatar, alt: `@${user.username}` }), 'size-[110px] rounded-full overflow-hidden z-10 bg-zinc-900 border-4 border-zinc-900'), 'flex items-center gap-4 -mt-[55px]'),
				D('div', !(!user.firstname && user.firstname !== '') ? `@${user.username}` : `${user.firstname} ${user.lastname}`, 'mt-3 text-white text-2xl font-semibold'),
				D('div', `@${user.username}`, 'text-[#9DA1A9] text-sm'),
				D('div', [
					D('div', `${truncate(user.followers)} Followers`, 'flex items-center gap-1'),
					D('div', `${truncate(user.following)} Following`, 'flex items-center gap-1')
				], 'flex gap-4 items-center mt-3 text-[#C2C4C8] text-sm'),
				D('div', [
					Button([SVG.add('a'), ' Connect']).addClass('flex-1'),
					D('div', SVG.messageCircle('a'), 'w-10 h-10 rounded-full bg-[#3A3C43] flex items-center justify-center text-white')
				], 'flex items-center gap-4 mt-5'),
				D('div', [
					D('div', 'Bio', 'text-[#8F9298] text-xs'),
					D('div', user.bio, 'flex-1 mt-1'),
					D('div', ['Joined Since', D('div', user.createdAt, 'text-white')], 'flex gap-2 items-center mt-4 text-[#8F9298] text-xs')
				], 'flex flex-col mt-5 bg-[#2A2B30] rounded-xl p-4 text-white text-sm')
			], 'px-6')
		];

		const drawer = new Drawer(app, { content });
		drawer.closeBtn.remove();
		drawer.content.addClass('-mt-6');

		try {
			const response = await fetchWithTimeout(`/api/user/uid/${user.uid}`);
			drawer.data
			response.user;
		} catch (err) {
			Notice(await handleError(err), 'error');
		} finally {

		}
	}
}
