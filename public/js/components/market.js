import { D, SVG, Button, Notice, wait, ImageWithFallback, fetchWithTimeout, sanitizeHTML, extractQuery, remainderQuery, handleError } from '../utils.js';
import Select from './ui/Select.js';
import Screen from './ui/Screen.js';
import parser from '../impl/snarkdown.js';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default class Marketplace extends Screen {
    constructor(app) {
        super(app, 'Marketplace');
        this.size = 6;
        this.filterOpened = false;
        this.isGrid = true;
        this.products = [];
        this.loadedProducts = {};
    }

    init() {
        super.init();
        this.initSearch = extractQuery().search;
        this.reloadCount = 0;
        const labelCls = 'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-gray-300';
        this.searchInput = D('input', null, 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 border px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 bg-zinc-900 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl', { placeholder: 'Search products...', 'data-slot': 'input' });
        this.filterBtn = Button(SVG.slider('w-4 h-4'), false).addClass('text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 border-violet-500/20 hover:border-violet-500/50 bg-zinc-900 rounded-xl aria-invalid:border-destructive border');
        this.initSearch && this.searchInput.val(this.initSearch);

        this.categoryBtn = new Select({ name: 'category', select: ['All', 'Electronics', 'Fashion', 'Accessories', 'Home & Living', 'Collectibles', 'Other'] });
        this.priceRangeBtn = new Select({ name: 'price-range', select: ['Unavailable'] });
        this.cryptoTypeBtn = new Select({ name: 'crypto-type', select: ['Unavaliable'] });
        this.locationBtn = new Select({ name: 'location', select: ['Unavaliable'] });

        this.listBtn = Button(SVG.list('w-4 h-4'), false);
        this.gridBtn = Button(SVG.grid('w-4 h-4'), false);

        this.filterBox = D('div', [
            D('div', [D('p', 'Category', labelCls), this.categoryBtn.elt]),
            D('div', [D('p', 'Price Range', labelCls), this.priceRangeBtn.elt.addClass('pointer-events-none')]),
            D('div', [D('p', 'Crypto Type', labelCls), this.cryptoTypeBtn.elt.addClass('pointer-events-none')]),
            D('div', [D('p', 'Location', labelCls), this.locationBtn.elt.addClass('pointer-events-none')]),
            Button([SVG.search('w-4 h-4'), 'Search']).click(() => this.reload(true)).addClass('w-full col-span-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl')
        ], 'grid md:grid-cols-4 grid-cols-1 gap-3 p-4 bg-zinc-900/50 border border-violet-500/20 rounded-xl animate-open')
        this.displayType = D('div', [
            D('p', '0 products found', 'text-sm text-gray-500'),
            D('div', [this.gridBtn, this.listBtn], 'flex gap-1 bg-zinc-900 rounded-lg p-1 border border-violet-500/20')
        ], 'flex items-center justify-between');

        this.inputFilter = D('div', [
            D('div', [
                D('div', [SVG.search('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500'), this.searchInput], 'flex-1 relative'), this.filterBtn
            ], 'flex gap-2'), this.displayType
        ], 'mb-6 space-y-3 animate-fadeIn');

        this.header.append(
            D('h1', 'Marketplace', 'text-2xl bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent'),
            D('p', 'Browse and discover unique items', 'text-gray-400 text-sm mt-1')
        );
        this.inner = D('div', null, 'grid md:grid-cols-4 grid-cols-2 gap-4');
        this.container.append(this.inner);

        this.skeletonLoader = D('div', [
            D('div', D('div', null, 'w-full h-full bg-gray-800 object-cover'), 'relative aspect-square overflow-hidden'),
            D('div', [
                D('div', null, 'w-full h-[15px] bg-gray-800 mb-1 rounded-[10px]'),
                D('div', null, 'w-[40%] h-[10px] bg-gray-800 rounded-[10px] text-sm mb-2'),
                D('div', D('div', null, 'w-[80%] h-[30px] bg-gray-800 rounded-[10px]'), 'space-y-1')
            ], 'p-3 flex-1')
        ], 'bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl overflow-hidden animate-pulse', { 'data-slot': 'item-preview' });

        this.empty = this.createEmptyState('No items here', 'Start listing your products to reach buyers in the community. Check back soon to discover what others are selling.', 'market', Button([SVG.add('w-5 h-5'), 'List a product']).click(() => this.app.create.open(true)));

        this.failed = this.createEmptyState('Failed to load Marketplace', 'Hmm... that wasn\'t supposed to happen', 'market', Button([SVG.reload('w-5 h-5'), 'Try again']).click(() => this.reload(true)));
 
        this.filterBtn.click(() => {
            this.filterOpened = !this.filterOpened;
            this.update();
        });

        this.gridBtn.click(() => {
            this.isGrid = true;
            this.filterOpened = false;
            this.update();
        });

        this.listBtn.click(() => {
            this.isGrid = false;
            this.filterOpened = false;
            this.update();
        });

        this.searchInput.keydown(ev => { if (ev.key === 'Enter') this.reload(true); });
        this.searchInput.on('input', () => { window.history.replaceState(null, '', `/market?search=${encodeURIComponent(this.searchInput.val())}${remainderQuery('search')}`); });

        this.update();
        this.reload();

        window.addEventListener('resize', () => this.update.bind(this));
        this.app.display.mainContent.append(this.header, this.inputFilter, this.container);
    }

    async reload(force = false) {
        if (!this.opened) return;
        if (!force && this.products.length !== 0)
            { this.buildContent(); return; }
        if (force) this.reloadCount = 0;
        if (this.reloadCount >= 10) {
            this.inner.removeChildren().removeClass('md:grid-cols-4', 'grid-cols-2').addClass('grid-cols-1').append(this.failed);
            this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
            return;
        }
        this.failed.remove();
        this.empty.remove();
        this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'off' });
        this.inner.removeChildren().removeClass('grid-cols-1').addClass('md:grid-cols-4 grid-cols-2');
        Array.from({ length: 12 }, _ => this.inner.append(this.skeletonLoader[0].cloneNode(true)));

        try {
            const data = await fetchWithTimeout('/api/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    search: this.searchInput.val(),
                    filters: { category: this.categoryBtn.val(), priceRange: this.priceRangeBtn.val(), cryptoType: this.cryptoTypeBtn.val(), location: this.locationBtn.val() }
                })
            });
            this.products = data.products || [];
        } catch (err) {
            Notice(await handleError(err), 'error');
            if (err.status == 500) { this.inner.removeChildren().removeClass('md:grid-cols-4', 'grid-cols-2').addClass('grid-cols-1').append(this.failed);return }
            await wait(5000);
            this.reloadCount++;
            this.reload();
            return;
        }
        this.buildContent();
    }

    buildContent() {
        if (this.products.length == 0) {
            this.inner.removeChildren().removeClass('md:grid-cols-4', 'grid-cols-2').addClass('grid-cols-1').append(this.empty);
            this.app.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'linear' });
            return;
        }
        const products = this.products.map(product => {
            this.loadedProducts[product.id] = product;
            const a = D('p', null, 'flex-1 mt-1 line-clamp-3 text-[11px] leading-relaxed text-gray-400');
            a.html(sanitizeHTML(parser(product.description)));

            return D('div', D('a', [
                D('div', ImageWithFallback({ src: product.images[0], alt: product.name }), 'relative aspect-square overflow-hidden rounded-t-xl'),
                product.images[1] && D('div', ImageWithFallback({ src: product.images[1], alt: product.name }), 'absolute w-full aspect-square overflow-hidden opacity-0 transition-[opacity] hover:opacity-100 rounded-t-xl'),
                D('div', [
                    D('h3', product.name, 'flex-1 mt-2 line-clamp-2 text-sm font-semibold text-white'),
                    D('p',`${product.brand} - ${product.category}`, 'flex-1 mt-1 truncate text-[11px] text-gray-400'),
                    D('p', [D('span', money(product.salePrice || product.priceFlat)), product.salePrice && D('span', money(product.priceFlat), 'ml-1 line-through text-[10px] text-gray-500')], 'flex-1 mt-2 text-sm font-semibold text-purple-300'), a
                ], 'p-3 flex flex-col flex-1 gap-2')
            ], 'relative flex flex-col', { href: `/product/${product.id}`, 'data-navigation': `/product/${product.id}`, 'data-no-hyperlink': '' }), 'overflow-hidden rounded-xl border border-violet-500/20 bg-zinc-950 animate-fadeIn', { 'data-slot': 'item-preview', 'data-product': product.id });
        });
        this.displayType.find('p').text(`${this.products.length} product${this.products.length > 1 ? 's' : ''} found`);
        this.inner.removeChildren().append(products);
        this.update();
    }

    update() {
        this.filterBtn.find('svg')[this.filterOpened ? 'addClass' : 'removeClass']('text-violet-400');
        if (this.filterOpened) this.displayType.before(this.filterBox);
        else {
            this.filterBox.addClass('animate-close').removeClass('animate-open');
            setTimeout(() => this.filterBox.remove().addClass('animate-open').removeClass('animate-close'), 200);
        }

        if (this.isGrid) {
            this.inner.removeClass('list', 'space-y-2').addClass('grid md:grid-cols-4 grid-cols-2');
            this.inner.find('div[data-slot=item-preview]').removeClass('flex', 'gap-4', 'max-h-40').find('.aspect-square').addClass('rounded-t-xl').removeClass('max-w-40', 'rounded-l-xl');
            this.inner.find('div[data-slot=item-preview]>div.flex').removeClass('py-2', 'pr-2').addClass('px-2 pb-2');
            this.inner.find('a').removeClass('flex-row').addClass('flex-col');
            this.gridBtn.addClass('bg-violet-600 text-white').removeClass('text-gray-400');
            this.listBtn.removeClass('bg-violet-600', 'text-white').addClass('text-gray-400');
        } else {
            this.inner.addClass('list space-y-2').removeClass('grid', 'md:grid-cols-4', 'grid-cols-2');
            this.inner.find('div[data-slot=item-preview]').addClass('flex gap-4 max-h-40').find('.aspect-square').addClass('max-w-40 rounded-l-xl').removeClass('rounded-t-xl');
            this.inner.find('div[data-slot=item-preview]>div.flex').addClass('py-2 pr-2').removeClass('px-2', 'pb-2');
            this.inner.find('a').addClass('flex-row').removeClass('flex-col');
            this.listBtn.addClass('bg-violet-600 text-white').removeClass('text-gray-400');
            this.gridBtn.removeClass('bg-violet-600', 'text-white').addClass('text-gray-400');
        }
    }
}
