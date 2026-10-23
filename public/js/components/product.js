import { D, SVG, Button, Notice, wait, ImageWithFallback, fetchWithTimeout, sanitizeHTML, handleError, Input } from '../utils.js';
import Screen from './ui/Screen.js';
import Modal from './ui/Modal.js';
import Profile from './ui/Profile.js';
import Select from './ui/Select.js';
import { sendMessage } from '../impl/messaging.js';
import parser from '../impl/snarkdown.js';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const safeText = value => value === undefined || value === null || value === '' ? '' : String(value);

export default class Product extends Screen {
    constructor(app) {
        super(app, 'Product');
        this.size = 7;
        this.selectedImage = 0;
        this.quantity = 1;
        this.saved = false;
    }

    init(node) {
        super.init(!!node);
        this.pid = node;
        this.reloadCount = 0;

        this.skeletonLoader = D('div', [
            D('div', null, 'aspect-square animate-pulse rounded-xl bg-zinc-800'),
            D('div', [D('div', null, 'h-6 w-3/4 animate-pulse rounded bg-zinc-800'), D('div', null, 'mt-4 h-5 w-1/3 animate-pulse rounded bg-zinc-800'), D('div', null, 'mt-4 h-20 animate-pulse rounded bg-zinc-800')], 'space-y-2')
        ], 'grid gap-6 md:grid-cols-2');

        this.failed = this.createEmptyState('Failed to load product details', 'Hmm.. that\'s not supposed to happen. Have another go?', 'activity', Button([SVG.reload('size-4'), 'Try again']).click(() => this.reload()));

        this.app.display.mainContent.append(this.header.addClass('h-16'), this.container);
        this.reload();
    }

    async reload(force = false) {
        if (!this.opened) return;
        if (force) this.reloadCount = 0;
        if (this.reloadCount >= 10) {
            this.container.removeChildren().append(this.failed);
            this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
            return;
        }
        this.failed.remove();
        this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
        this.container.removeChildren();
        this.container.append(this.skeletonLoader[0].cloneNode(true));

        this.app.display.addBtn.remove();

        try {
            this.details = await fetchWithTimeout(`/api/marketplace/${this.pid}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            Notice(await handleError(err), 'error');
            if (err.status == 500) { this.container.removeChildren().append(this.failed);return }
            await wait(5000);
            this.reloadCount++;
            this.reload();
            return;
        }
        this.selectedImage = 0;
        this.buildContent();
    }

    buildContent() {
        const product = this.details;
        if (!product || !product.id) {
            this.container.removeChildren().append(this.createEmptyState('Listing not found', 'This product may have been removed or is no longer available.', 'market', Button('Back to marketplace').click(() => this.app.navigateTo('/market'))));
            return;
        }
        this.app.display.addBtn.remove();

        this.variants = Array.isArray(product.variants) ? product.variants : [];
        this.selectedVariant = null;
        this.quantity = 1;
        const inventory = product.inventory === null || product.inventory === undefined
            ? this.variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0)
            : Number(product.inventory);
        this.inventory = inventory;
        this.isSeller = this.app.data.userdata?.uid && this.app.data.userdata.uid === product.user?.uid;
        this.saved = this.readSaved().includes(product.id);

        this.mainImage = product.imagePath
            ? D('div', ImageWithFallback({ src: product.imagePath, alt: product.name }), 'aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 [&_img]:h-full [&_img]:w-full [&_img]:object-contain')
            : D('div', [SVG.imgPlaceholder('h-16 w-16 text-gray-600'), D('span', 'No product photos', 'text-xs text-gray-500')], 'grid aspect-square place-items-center rounded-xl bg-zinc-900');
        this.gallery = D('div', null, 'grid grid-cols-5 gap-2');
        this.renderGallery();

        const ratingSummary = this.ratingSummary(product);
        const currentPrice = this.selectedVariant?.price || product.salePrice || product.priceFlat;

        this.price = D('div', money(currentPrice), 'text-2xl font-bold text-emerald-300');
        this.oldPrice = product.salePrice !== currentPrice ? D('span', money(product.priceFlat), 'text-sm text-gray-500 line-through') : D('span');
        this.stockLine = D('p', this.stockLabel(), 'text-xs font-medium');
        this.variantSelect = this.buildVariantSelect();
        this.price.text(money(this.selectedVariant?.price || product.salePrice || product.priceFlat));
        this.quantityInput = Input({ class: 'h-10 w-20 rounded-lg border border-violet-500/20 bg-zinc-900 px-2 text-center text-sm text-white', type: 'number', min: '1', max: String(Math.max(1, inventory)), value: '1', 'aria-label': 'Quantity' });

        this.quantityInput.on('change', () => {
            this.quantity = Math.max(1, Math.min(Number(this.quantityInput.val()) || 1, Math.max(1, this.availableStock())));
            this.quantityInput.val(String(this.quantity));
        });

        this.buyButton = Button([SVG.shoppingBag('h-4 w-4'), 'Request to buy']).addClass('h-11 w-full').attr({ title: 'Starts a conversation with the seller. Escrow checkout is not available yet.' }).click(() => this.contactSeller(true));
        this.contactButton = Button([SVG.messageCircle('h-4 w-4'), 'Contact seller'], 'zinc').addClass('h-11 w-full border-gray-600/50').click(() => this.contactSeller(false));

        if (this.isSeller) {
            this.buyButton.addClass('hidden');
            this.contactButton.addClass('hidden');
        }
        if (inventory <= 0) {
            this.buyButton.addClass('pointer-events-none opacity-50');
            this.stockLine.text('Out of stock').removeClass('text-emerald-300').addClass('text-red-300');
        }

        this.saveButton = Button(SVG.bookmark('h-4 w-4'), 'zinc').addClass('h-10 w-10 px-0 border-gray-600/40').attr({ title: this.saved ? 'Remove from saved items' : 'Save item', 'aria-label': this.saved ? 'Remove from saved items' : 'Save item' }).click(() => this.toggleSaved());
        this.shareButton = Button(SVG.share('h-4 w-4'), 'zinc').addClass('h-10 w-10 px-0 border-gray-600/40').attr({ title: 'Share listing', 'aria-label': 'Share listing' }).click(() => this.share());
        this.reportButton = D('button', 'Report listing', 'text-[11px] text-gray-500 underline decoration-gray-700 underline-offset-4 hover:text-red-300').click(() => this.report());

        const seller = product.user || {};
        this.sellerBlock = D('div', [
            Profile.minimal(this.app, seller),
            D('div', [D('span', 'Seller rating', 'text-[11px] text-gray-400'), D('span', ratingSummary.seller ? `${ratingSummary.seller.toFixed(1)} / 5` : 'No seller rating yet', 'text-[11px] font-medium text-gray-300')], 'flex items-center justify-between px-1')
        ], 'space-y-2');

        this.reviews = this.buildReviews(product.reviews || [], ratingSummary.product, ratingSummary.count);
        this.specs = this.buildSpecs(product);
        this.fulfillment = this.buildFulfillment(product);
        this.protection = D('section', [D('div', [SVG.shieldCheck('h-5 w-5 text-emerald-300'), D('h2', 'Buyer protection', 'text-sm font-semibold text-gray-100')], 'flex items-center gap-2'), D('p', 'Crowlock escrow and dispute tools are available for supported transactions. Confirm protection and terms with the seller before paying; this listing does not include a confirmed escrow checkout yet.', 'mt-2 text-[11px] leading-relaxed text-gray-400'), D('button', 'Learn about disputes', 'mt-2 text-[11px] font-medium text-emerald-300 underline underline-offset-4').click(() => this.app.dispute?.open())], 'border-t border-white/10 py-5');
        this.related = D('section', [D('h2', 'More in this category', 'text-base font-semibold text-white'), D('div', null, 'mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4')], 'mt-10 border-t border-white/10 py-6');

        const title = D('h1', product.name, 'text-2xl font-semibold leading-tight text-white');
        const ratingLink = D('button', [D('span', '★', 'text-amber-300'), D('span', ratingSummary.product ? `${ratingSummary.product.toFixed(1)} · ${ratingSummary.count} reviews` : 'No product reviews yet', 'text-xs text-gray-400')], 'flex items-center gap-1.5 text-left').click(() => this.reviewsSection[0].scrollIntoView({ behavior: 'smooth', block: 'start' }));
        const badges = D('div', [D('span', product.condition || product.details?.condition || 'Condition not provided', 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-gray-300'), D('span', product.category || 'Uncategorized', 'rounded-md border border-white/10 px-2 py-1 text-[10px] text-gray-400')], 'flex flex-wrap gap-2');
        this.reviewsSection = D('section', [D('div', [D('h2', 'Buyer reviews', 'text-base font-semibold text-white'), D('span', ratingSummary.product ? `${ratingSummary.product.toFixed(1)} / 5` : 'No ratings yet', 'text-xs text-gray-400')], 'flex items-center justify-between'), this.reviews], 'mt-8 border-t border-white/10 py-6');

        const a = D('p', null, 'mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-300');
        a.html(sanitizeHTML(parser(product.description)) || 'The seller has not added a description.');

        this.container.removeChildren().append(
            D('nav', [D('button', 'Marketplace', 'text-xs text-gray-500 hover:text-white').click(() => this.app.navigateTo('/market')), SVG.chevronRight('h-3 w-3 text-gray-600'), D('span', product.category || 'Product', 'text-xs text-gray-400')], 'mb-4 flex items-center gap-2'),
            D('div', [
                D('section', [this.inventory == 0 && D('div', 'OUT OF STOCK', 'absolute top-5 left-5 bg-zinc-800 text-white font-bold p-4'), this.mainImage, this.gallery], 'relative min-w-0 space-y-2'),
                D('section', [
                    D('div', [D('div', [D('span', product.brand || product.category || 'Marketplace', 'text-[10px] font-semibold uppercase text-emerald-300'), title, ratingLink], 'min-w-0 space-y-2'), D('div', [this.saveButton, this.shareButton], 'flex shrink-0 gap-2')], 'flex items-start justify-between gap-3'),
                    badges,
                    D('div', [this.price, this.oldPrice], 'flex items-baseline gap-2'),
                    this.stockLine,
                    this.variantSelect,
                    D('div', [D('span', 'Quantity', 'text-xs text-gray-400'), this.quantityInput], 'flex items-center gap-3'),
                    D('div', [this.buyButton, this.contactButton], 'grid gap-2 sm:grid-cols-2'),
                    D('p', 'Taxes, delivery charges, and final terms are confirmed with the seller before payment.', 'text-[10px] leading-relaxed text-gray-500'),
                    this.sellerBlock,
                    this.fulfillment
                ], 'min-w-0 space-y-4')
            ], 'grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'),
            D('div', [
                D('section', [D('h2', 'About this item', 'text-base font-semibold text-white'), a], 'border-t border-white/10 py-6'),
                this.specs,
                this.protection
            ], 'mt-8 max-w-3xl'),
            this.reviewsSection,
            this.related,
            D('div', this.reportButton, 'pb-8 text-right')
        );
        this.loadRelated();
    }

    update() {
        if (!this.details) return;
        this.stockLine?.text(this.stockLabel());
        if (this.inventory <= 0) this.buyButton?.addClass('pointer-events-none opacity-50');
    }

    renderGallery() {
        this.gallery.removeChildren().append(this.details.images.map((image, index) => D('button', ImageWithFallback({ src: image, alt: `${this.details.name}, photo ${index + 1}` }), `aspect-square overflow-hidden rounded-md border transition ${index === this.selectedImage ? 'border-emerald-300' : 'border-white/10 opacity-70 hover:opacity-100'}`, { type: 'button', 'aria-label': `View photo ${index + 1}` }).click(() => {
            this.selectedImage = index;
            this.mainImage.removeChildren().append(ImageWithFallback({ src: image, alt: `${this.details.name}, photo ${index + 1}` }));
            this.renderGallery();
        })));
    }

    buildVariantSelect() {
        if (!this.variants.length) return D('p', 'Standard item · no options', 'text-xs text-gray-500');
        this.variantSelectElement = D('select', this.variants.map((variant, index) => {
            const parts = [variant.color, variant.size].filter(value => value && !['Default', 'Standard', 'One size'].includes(value));
            const label = parts.join(' / ') || variant.name || `Option ${index + 1}`;
            return D('option', `${label}${Number(variant.stock) <= 0 ? ' · Sold out' : ''}`, null, { value: index, disabled: Number(variant.stock) <= 0 });
        }), 'h-10 w-full rounded-lg border border-violet-500/20 bg-zinc-900 px-3 text-sm text-gray-200');
        this.variantSelectElement.on('change', () => {
            this.selectedVariant = this.variants[Number(this.variantSelectElement.val())];
            this.price.text(money(this.selectedVariant.price || this.details.salePrice || this.details.priceFlat));
            this.inventory = Number(this.selectedVariant.stock) || 0;
            this.quantityInput.attr({ max: String(Math.max(1, this.inventory)) });
            this.quantity = Math.min(this.quantity, Math.max(1, this.inventory));
            this.quantityInput.val(String(this.quantity));
            this.update();
        });
        this.selectedVariant = this.variants[Number(this.variantSelectElement.val())] || this.variants[0];
        this.inventory = Number(this.selectedVariant.stock) || 0;
        return D('label', [D('span', 'Options', 'mb-1.5 block text-xs font-medium text-gray-400'), this.variantSelectElement], 'block');
    }

    availableStock() {
        return this.selectedVariant ? Number(this.selectedVariant.stock) || 0 : this.inventory;
    }

    stockLabel() {
        if (this.inventory <= 0) return 'Out of stock';
        if (this.inventory <= 5) return `Only ${this.inventory} left`;
        return `${this.inventory} available`;
    }

    ratingSummary(product) {
        const reviews = Array.isArray(product.reviews) ? product.reviews : [];
        const ratings = product.ratings;
        const productRating = typeof ratings === 'number' ? ratings : Number(ratings?.average ?? ratings?.rating) || (reviews.length ? reviews.reduce((total, review) => total + (Number(review.rating) || 0), 0) / reviews.length : 0);
        const sellerRating = Number(product.user?.rating ?? product.user?.ratings?.average) || 0;
        return { product: productRating || 0, seller: sellerRating || 0, count: Number(ratings?.count) || reviews.length };
    }

    buildSpecs(product) {
        const details = product.details && typeof product.details === 'object' ? product.details : {};
        const excluded = new Set(['condition', 'shipping', 'returns', 'cancellation']);
        const values = (typeof details === 'string' && details.trim() ? [['Seller details', details]] : Object.entries(details)).filter(([key, value]) => !excluded.has(key.toLowerCase()) && value !== null && value !== undefined && value !== '').slice(0, 12);
        const entries = [['Brand', product.brand], ['Category', product.category], ...values.map(([key, value]) => [key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase()), typeof value === 'object' ? JSON.stringify(value) : value])].filter(([, value]) => safeText(value));
        return D('section', [D('h2', 'Specifications', 'text-base font-semibold text-white'), entries.length ? D('dl', entries.map(([key, value]) => D('div', [D('dt', key, 'text-xs text-gray-500'), D('dd', safeText(value), 'text-right text-xs text-gray-300')], 'flex items-start justify-between gap-4 border-b border-white/5 py-2')), 'mt-3') : D('p', 'No additional specifications provided.', 'mt-3 text-xs text-gray-500')], 'border-t border-white/10 py-6');
    }

    buildFulfillment(product) {
        const shipping = product.shipping || product.details?.shipping || {};
        const shippingCopy = shipping.cost !== undefined ? `Shipping: ${money(shipping.cost)}` : 'Shipping cost and delivery estimate are arranged with the seller.';
        const terms = product.details?.returns || product.details?.cancellation || 'Ask the seller about pickup, returns, and cancellation before payment.';
        return D('section', [D('h2', 'Delivery and terms', 'text-sm font-semibold text-white'), D('p', shippingCopy, 'mt-2 text-[11px] text-gray-400'), shipping.estimate && D('p', `Estimated delivery: ${shipping.estimate}`, 'mt-1 text-[11px] text-gray-400'), shipping.pickup && D('p', `Pickup: ${shipping.pickup}`, 'mt-1 text-[11px] text-gray-400'), shipping.weightKg && D('p', `Package weight: ${shipping.weightKg} kg`, 'mt-1 text-[11px] text-gray-400'), D('p', terms, 'mt-2 text-[11px] leading-relaxed text-gray-500')], 'border-t border-white/10 py-4');
    }

    buildReviews(reviews, rating, ratingCount) {
        if (!reviews.length) return D('p', 'No buyer reviews for this product yet.', 'mt-4 text-sm text-gray-500');
        return D('div', [D('p', rating ? `${rating.toFixed(1)} average from ${ratingCount} review${ratingCount === 1 ? '' : 's'}` : `${reviews.length} buyer review${reviews.length === 1 ? '' : 's'}`, 'mt-2 text-xs text-gray-400'), ...reviews.slice(0, 6).map(review => D('article', [D('div', [D('span', review.user?.username ? `@${review.user.username}` : 'Buyer', 'text-xs font-medium text-gray-200'), D('span', `${Number(review.rating) || 0} / 5`, 'text-[10px] text-amber-300')], 'flex items-center justify-between'), D('p', review.comment || review.content || 'No written comment.', 'mt-2 text-xs leading-relaxed text-gray-400'), review.date && D('p', review.date, 'mt-2 text-[10px] text-gray-600')], 'mt-3 rounded-lg border border-white/5 bg-zinc-900/50 p-3'))], '');
    }

    readSaved() {
        try { return JSON.parse(localStorage.getItem('crowlock:saved-products') || '[]'); }
        catch (_) { return []; }
    }

    toggleSaved() {
        const saved = this.readSaved();
        this.saved = !this.saved;
        const next = this.saved ? [...new Set([...saved, this.details.id])] : saved.filter(id => id !== this.details.id);
        localStorage.setItem('crowlock:saved-products', JSON.stringify(next));
        this.saveButton.attr({ title: this.saved ? 'Remove from saved items' : 'Save item', 'aria-label': this.saved ? 'Remove from saved items' : 'Save item' });
        this.saveButton.find('svg').toggleClass('text-emerald-300', this.saved);
        Notice(this.saved ? 'Listing saved on this device.' : 'Listing removed from saved items.', 'success');
    }

    async share() {
        const url = `${window.location.origin}/product/${this.details.id}`;
        try {
            if (navigator.share) await navigator.share({ title: this.details.name, text: `Product listing on Crowlock`, url });
            else { await navigator.clipboard.writeText(url); Notice('Listing link copied.', 'success'); }
        } catch (error) {
            if (error.name !== 'AbortError') Notice('Could not share this listing.', 'error');
        }
    }

    async contactSeller(requestPurchase = false) {
        const sellerId = this.details.user?.uid;
        if (!this.app.data.userdata) { this.app.navigateTo(`/login?landing=${encodeURIComponent(window.location.pathname)}`, true); return; }
        if (!sellerId || sellerId === this.app.data.userdata.uid) { Notice('You cannot contact yourself about this listing.', 'warn'); return; }
        const variant = this.selectedVariant ? [this.selectedVariant.color, this.selectedVariant.size].filter(Boolean).join(' / ') : 'standard option';
        const text = requestPurchase
            ? `Hello, I would like to buy ${this.quantity} x ${this.details.name} (${variant}). Please confirm availability, shipping, and escrow/payment terms.`
            : `Hello, I have a question about your listing: ${this.details.name}.`;
        try {
            const result = await sendMessage({ recipientId: sellerId, text });
            this.app.navigateTo(`/chat/${result.conversationId}`);
        } catch (error) {
            Notice(error.message || 'Could not contact the seller.', 'error');
        }
    }

    async report() {
        if (!this.app.data.userdata) { this.app.navigateTo(`/login?landing=${encodeURIComponent(window.location.pathname)}`, true); return; }
        const reason = new Select({ name: 'reason', select: ['Counterfeit or misleading', 'Prohibited item', 'Incorrect information', 'Other'] });
        const modal = new Modal(this.app, {
            header: 'Report listing',
            content: { 
                html: D('div', [D('p', 'Choose the closest reason. Reports are reviewed by the Crowlock team.', 'text-xs text-gray-400'), reason.elt], 'space-y-3') 
            }, btns: { 'Submit report': async dialog => {
            try {
                await fetchWithTimeout(`/api/marketplace/${this.details.id}/report`, {
                    method: 'POST',
                    headers: await this.app.authHeaders(),
                    body: JSON.stringify({ reason: reason.val() })
                });
                dialog.close();
                Notice('Report submitted for review.', 'success');
            } catch (error) { Notice(await handleError(error), 'error'); }
        } } });
        return modal;
    }

    async loadRelated() {
        const target = this.related.find('div');
        try {
            const data = await fetchWithTimeout('/api/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search: '', filters: { category: this.details.category || 'All', priceRange: '', cryptoType: '', location: '' } })
            });

            const related = (data.products || []).filter(item => item.id !== this.details.id).slice(0, 4);
            if (!related.length) { this.related.remove(); return; }
            target.append(related.map(item => D('a', [D('div', ImageWithFallback({ src: item.images?.[0] || '', alt: item.name }), 'aspect-square overflow-hidden rounded-t-lg bg-zinc-900'), D('div', [D('p', item.name, 'line-clamp-2 text-xs font-medium text-gray-200'), D('p', money(item.salePrice || item.priceFlat), 'mt-1 text-xs font-semibold text-emerald-300')], 'p-2')], 'overflow-hidden rounded-lg border border-white/5 bg-zinc-950 hover:border-emerald-300/30', { href: `/product/${item.id}`, 'data-navigation': `/product/${item.id}` })));
        } catch (_) {
            this.related.remove();
        }
    }
};
