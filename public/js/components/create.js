import Modal from './ui/Modal.js';
import Select from './ui/Select.js';
import { D, SVG, Button, Input, Notice, fetchWithTimeout, handleError, uploadFile } from '../utils.js';
import parser from '../impl/snarkdown.js';

const inputClass = 'h-10 w-full rounded-lg border border-violet-500/20 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-500/60';
const labelClass = 'mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-300';
const panelClass = 'space-y-4';
const categories = ['Electronics', 'Fashion', 'Accessories', 'Home & Living', 'Collectibles', 'Other'];

function makeField(label, control, hint) {
	return D('label', [D('span', label, labelClass), control, hint ? D('span', hint, 'mt-1 block text-[11px] text-gray-500') : null], 'block min-w-0');
}

function makeInput(attrs = {}) {
	return Input({ class: inputClass, ...attrs });
}

function imageBlob(canvas) {
	return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process this image')), 'image/jpeg', 0.88));
}

async function prepareImage(blob, aspect, rotation) {
	const bitmap = await createImageBitmap(blob);
	const sideways = Math.abs(rotation % 180) === 90;
	const rotatedWidth = sideways ? bitmap.height : bitmap.width;
	const rotatedHeight = sideways ? bitmap.width : bitmap.height;
	const rotated = document.createElement('canvas');
	rotated.width = rotatedWidth;
	rotated.height = rotatedHeight;
	const rotatedContext = rotated.getContext('2d');
	rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
	rotatedContext.rotate(rotation * Math.PI / 180);
	rotatedContext.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
	bitmap.close();

	const sourceAspect = rotatedWidth / rotatedHeight;
	let cropWidth = rotatedWidth;
	let cropHeight = rotatedHeight;
	if (sourceAspect > aspect) cropWidth = rotatedHeight * aspect;
	else cropHeight = rotatedWidth / aspect;
	const scale = Math.min(1, 1600 / cropWidth, 1600 / cropHeight);
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(cropWidth * scale);
	canvas.height = Math.round(cropHeight * scale);
	canvas.getContext('2d').drawImage(rotated, (rotatedWidth - cropWidth) / 2, (rotatedHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
	return imageBlob(canvas);
}

export default class CreateProductModal {
	constructor(app) {
		this.app = app;
	}

	open() {
		if (this.app.data.userdata === undefined) { this.app.navigateTo(`/login?landing=${this.app.currentScreen.href}`, true); return }
		if (!this.app.data.userdata.verified) {this.app.navigateTo(`/profile`);Notice('Verify your account first!', 'warn');return }

		this.images = [];
		this.colors = [];
		this.sizes = [];
		this.variants = [];
		this.selectedVariants = new Set();
		this.step = 0;
		this.aspect = 1;
		this.content = D('div', null, 'flex-1 space-y-4 px-5 pb-8');

		this.modal = new Modal(this.app, {
			header: 'Create a product',
			content: { html: this.content },
			onClose: () => this.app.loader.useDefaultHandler()
		});
		this.modal.elt.css('max-width: 56rem');
		this.app.loader.setHandler(console.log);
		this.buildContent();
	}

	buildContent() {
		this.titleInput = makeInput({ maxlength: 80, placeholder: 'e.g. Vintage film camera', autocomplete: 'off' }).on('input', () => { this.updateCounter(this.titleInput, this.titleCount, 80); this.updatePreview(); });
		this.brandInput = makeInput({ maxlength: 60, placeholder: 'Brand or maker' }).on('input', () => this.updatePreview());
		this.categorySelect = new Select({ select: categories, name: 'category', change: () => this.updatePreview() });
		this.descriptionInput = D('textarea', null, `${inputClass} min-h-24 resize-y py-2`, { maxlength: 500, placeholder: 'Describe condition, materials, and what makes it special...', rows: 3 }).on('input', () => { this.updateCounter(this.descriptionInput, this.descriptionCount, 500); this.updatePreview(); });
		this.productDetailsInput = D('textarea', null, `${inputClass} min-h-24 resize-y py-2`, { maxlength: 2000, placeholder: 'Add product details such as specifications, features, and any other relevant information.', rows: 5 }).on('input', () => { this.updateCounter(this.productDetailsInput, this.productDetailsCount, 2000); });
		this.titleCount = D('span', '0 / 80 characters', 'text-[10px] text-purple-400');
		this.descriptionCount = D('span', '0 / 500 characters', 'text-[10px] text-purple-400');
		this.productDetailsCount = D('span', '0 / 2000 characters', 'text-[10px] text-purple-400');

		this.stepNames = ['Identification', 'Photos', 'Inventory', 'Pricing & shipping'];
		this.stepBar = D('div', this.stepNames.map((name, index) => D('button', [D('span', String(index + 1), 'grid h-6 w-6 place-items-center rounded-full border border-current text-[10px]'), D('span', name, 'hidden text-[10px] sm:inline')], 'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-gray-500 transition-colors', { type: 'button' }).click(() => { if (index <= this.maxAvailableStep()) this.showStep(index); })), 'flex gap-1 rounded-xl border border-violet-500/20 bg-black/30 p-1');
		this.stepPanels = [this.buildIdentification(), this.buildMedia(), this.buildInventory(), this.buildLogistics()];
		this.previewImage = D('img', null, 'hidden aspect-square w-full object-cover', { alt: 'Product preview' });
		this.previewPlaceholder = D('div', [SVG.product('h-9 w-9 text-gray-600'), D('span', 'Your cover photo', 'text-xs text-gray-500')], 'flex aspect-square w-full flex-col items-center justify-center gap-2 bg-zinc-800');
		this.previewTitle = D('h3', 'Your product title', 'mt-3 line-clamp-2 text-sm font-semibold text-white');
		this.previewMeta = D('p', 'Brand - Category', 'mt-1 truncate text-[11px] text-gray-400');
		this.previewPrice = D('p', '$0.00', 'mt-2 text-sm font-semibold text-purple-300');
		this.previewDescription = D('p', 'Your description will appear here.', 'mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-400');
		this.preview = D('aside', [D('div', [D('div', [SVG.eye('h-4 w-4 text-purple-300'), D('span', 'Buyer preview', 'text-xs font-semibold text-gray-200')], 'flex items-center gap-2'), D('span', 'LIVE', 'rounded-full bg-purple-400/10 px-2 py-0.5 text-[9px] font-bold text-purple-300')], 'flex items-center justify-between px-3 py-2'), D('div', [this.previewPlaceholder, this.previewImage, D('div', [this.previewTitle, this.previewMeta, this.previewPrice, this.previewDescription], 'p-3')], 'overflow-hidden rounded-xl border border-violet-500/20 bg-zinc-950')], 'space-y-2');
		this.progress = D('div', null, 'h-1 rounded-full bg-violet-500 transition-all');
		this.stepTitle = D('h3', null, 'text-sm font-semibold text-white');
		this.stepDescription = D('p', null, 'text-[11px] text-gray-400');
		this.error = D('p', null, 'hidden rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200');
		this.backBtn = Button([SVG.chevronLeft('h-4 w-4'), 'Back'], 'zinc').addClass('border-gray-600/40').click(() => this.showStep(this.step - 1));
		this.nextBtn = Button(['Continue', SVG.chevronRight('h-4 w-4')]).click(() => this.continue());
		this.submitBtn = Button([SVG.check('h-4 w-4'), 'Publish listing']).click(() => this.submit());
		this.content.append(
			this.stepBar,
			D('div', [this.stepTitle, this.stepDescription], 'space-y-1'),
			D('div', [this.progress], 'h-1 overflow-hidden rounded-full bg-zinc-800'),
			D('div', [D('div', this.stepPanels, 'min-w-0'), this.preview], 'grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_220px]'),
			this.error,
			D('div', [this.backBtn, D('div', null, 'flex-1'), this.nextBtn, this.submitBtn], 'flex items-center gap-2 border-t border-violet-500/15 pt-4')
		);
		this.buildVariants();
		this.showStep(0);
		this.updatePreview();
	}

	buildIdentification() {
		this.corePanel = D('section', [
			makeField('Product title', this.titleInput, this.titleCount),
			makeField('Brand', this.brandInput),
			makeField('Category', this.categorySelect.elt),
			makeField('Description', this.descriptionInput, D('span', [this.descriptionCount, D('span', 'Markdown supported', 'ml-2 text-[10px] text-gray-500')], 'flex items-center justify-between')),
			makeField('Product details', this.productDetailsInput, D('span', [this.productDetailsCount, D('span', 'Markdown supported', 'ml-2 text-[10px] text-gray-500')], 'flex items-center justify-between'))
		], `hidden ${panelClass}`);
		return this.corePanel;
	}

	buildMedia() {
		this.fileInput = D('input', null, 'hidden', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true }).on('change', () => { this.addFiles(this.fileInput[0].files); this.fileInput.val(''); });
		this.dropzone = D('button', [SVG.upload('h-7 w-7 text-purple-300'), D('span', 'Drop photos here or browse', 'text-sm font-medium text-gray-200'), D('span', 'JPEG, PNG or WebP · up to 10 MB each · minimum 1000 × 1000 px', 'text-center text-[10px] text-gray-500'), D('div', [D('span', null, 'absolute inset-3 border border-dashed border-purple-200/80'), D('span', '1:1', 'absolute bottom-5 right-5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white')], 'relative mt-1 aspect-square w-28 overflow-hidden rounded-lg border border-purple-300/40 bg-zinc-800/70')], 'flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/40 bg-zinc-900/50 px-4 py-6 text-center transition hover:border-purple-300/60', { type: 'button' }).click(() => this.fileInput[0].click());

		this.dropzone.dragover(event => { event.preventDefault(); this.dropzone.addClass('border-purple-300'); });
		this.dropzone.dragleave(() => this.dropzone.removeClass('border-purple-300'));
		this.dropzone.drop(event => { event.preventDefault(); this.dropzone.removeClass('border-purple-300'); this.addFiles(event.dataTransfer.files); });

		this.aspectOne = Button('1:1', 'zinc').addClass('border-purple-300/60 text-purple-200').click(() => this.setAspect(1));
		this.aspectFourThree = Button('4:3', 'zinc').click(() => this.setAspect(4 / 3));
		this.photoGrid = D('div', null, 'grid grid-cols-2 gap-2 sm:grid-cols-3');
		return D('section', [this.fileInput, this.dropzone, D('div', [D('span', 'Crop preview', 'text-[11px] text-gray-400'), D('div', [this.aspectOne, this.aspectFourThree], 'flex gap-1')], 'flex items-center justify-between'), this.photoGrid], `hidden ${panelClass}`);
	}

	buildInventory() {
		this.colorInput = makeInput({ placeholder: 'Add a color, then press Enter' }).on('keydown', event => this.addToken(event, 'colors', this.colorInput));
		this.sizeInput = makeInput({ placeholder: 'Add a size, then press Enter' }).on('keydown', event => this.addToken(event, 'sizes', this.sizeInput));
		this.colorTags = D('div', null, 'mt-2 flex min-h-8 flex-wrap gap-1.5');
		this.sizeTags = D('div', null, 'mt-2 flex min-h-8 flex-wrap gap-1.5');
		this.bulkPrice = makeInput({ type: 'number', min: '0', step: '0.01', placeholder: 'Price' });
		this.bulkStock = makeInput({ type: 'number', min: '0', step: '1', placeholder: 'Stock' });
		this.bulkWeight = makeInput({ type: 'number', min: '0', step: '0.01', placeholder: 'Weight kg' });
		this.bulkApply = Button('Apply to selected', 'zinc').addClass('h-9 border-gray-600/40 px-2 text-[11px]').click(() => this.applyBulk());
		this.variantRows = D('div', null, 'min-w-[560px] divide-y divide-white/5');
		this.variantTable = D('div', this.variantRows, 'overflow-x-auto rounded-lg border border-violet-500/20');
		
		return D('section', [
			D('p', 'Add optional attributes to generate a SKU matrix. Leave both empty for a single stock item.', 'text-[11px] leading-relaxed text-gray-500'),
			makeField('Colors', this.colorInput), this.colorTags,
			makeField('Sizes', this.sizeInput), this.sizeTags,
			D('div', [D('span', 'Bulk edit selected', 'mr-auto text-[11px] font-medium text-gray-300'), this.bulkPrice, this.bulkStock, this.bulkWeight, this.bulkApply], 'flex flex-wrap items-center gap-2'),
			this.variantTable
		], `hidden ${panelClass}`);
	}

	buildLogistics() {
		this.priceInput = makeInput({ type: 'number', min: '0.01', step: '0.01', placeholder: '0.00' });
		this.saleInput = makeInput({ type: 'number', min: '0', step: '0.01', placeholder: 'Optional' });
		this.weightInput = makeInput({ type: 'number', min: '0', step: '0.01', placeholder: '0.00' });
		this.dimensions = ['Length', 'Width', 'Height'].map(name => makeInput({ type: 'number', min: '0', step: '0.1', placeholder: name }));
		this.stockInput = makeInput({ type: 'number', min: '0', step: '1', value: '1' });
		this.skuInput = makeInput({ maxlength: 64, placeholder: 'Optional seller SKU', title: 'A seller-defined code used to identify and track this product.' });
		this.gtinInput = makeInput({ maxlength: 14, placeholder: 'Optional GTIN / UPC', title: 'A barcode number such as a UPC or EAN, used to identify this product globally.' });
		this.tariffInput = makeInput({ maxlength: 10, placeholder: 'Optional HS code', title: 'A customs classification code used to identify goods in international shipping.' });
		this.stockInput.on('input', () => {
			if (!this.colors.length && !this.sizes.length && this.variants.length === 1) this.variants[0].stock = Number(this.stockInput.val()) || 0;
		});
		for (const input of [this.priceInput, this.saleInput]) input.on('input', () => this.updatePreview());
		const help = (title) => D('span', SVG.circleQuestion('h-3.5 w-3.5'), 'text-gray-500', { title, tabindex: 0 });
		return D('section', [
			D('div', [makeField('Base price (NGN)', this.priceInput), makeField('Sale price (NGN)', this.saleInput, 'Optional. Must be lower than the base price.')], 'grid grid-cols-2 gap-3'),
			D('div', [makeField('Shipping weight (kg)', this.weightInput), makeField('Stock count', this.stockInput)], 'grid grid-cols-2 gap-3'),
			D('div', [D('span', 'Package dimensions (cm)', labelClass), D('div', this.dimensions, 'grid grid-cols-3 gap-2')]),
			D('div', [makeField(['Seller SKU ', help('A seller-defined code used to identify and track this product.')], this.skuInput), makeField(['GTIN / UPC ', help('Barcode number used to identify this product globally.')], this.gtinInput), makeField(['HS Tariff Code ', help('Customs classification code used for international shipping.')], this.tariffInput)], 'grid grid-cols-2 gap-3'),
			D('p', 'Final check: confirm your photos, quantity, and price before publishing.', 'rounded-lg bg-purple-400/5 px-3 py-2 text-[11px] text-gray-400')
		], `hidden ${panelClass}`);
	}

	updateCounter(input, counter, max) {
		const length = input.val().length;
		counter.removeClass('text-purple-400', 'text-amber-300', 'text-red-300').addClass(length / max >= 0.95 ? 'text-red-300' : length / max >= 0.75 ? 'text-amber-300' : 'text-purple-400').text(`${length} / ${max} characters`);
	}

	updatePreview() {
		const title = this.titleInput.val().trim();
		const brand = this.brandInput.val().trim();
		const category = this.categorySelect.val();
		const description = this.descriptionInput.val().trim();		
		this.previewTitle.text(title || 'Your product title');
		this.previewMeta.text([brand || 'Brand', category || 'Category'].join(' - '));
		this.previewDescription.html(parser(description) || 'Your description will appear here.');
		const price = Number(this.saleInput.val()) > 0 ? this.saleInput.val() : this.priceInput.val();
		this.previewPrice.text(`₦${Number(price || 0).toFixed(2)}`);
		if (this.images.length) {
			this.previewImage.attr({ src: this.images[0].src }).removeClass('hidden');
			this.previewPlaceholder.addClass('hidden');
		} else {
			this.previewImage.addClass('hidden');
			this.previewPlaceholder.removeClass('hidden');
		}
	}

	maxAvailableStep() {
		return this.stepPanels.length - 1;
	}

	showStep(step) {
		this.step = Math.max(0, Math.min(step, this.maxAvailableStep()));
		this.stepPanels.forEach((panel, index) => index === this.step ? panel.removeClass('hidden') : panel.addClass('hidden'));
		this.stepTitle.text(`Step ${this.step + 1} · ${this.stepNames[this.step]}`);
		this.stepDescription.text(['Name and describe the item buyers will receive.', 'Add clear photos. The first image is shown as the cover.', 'Build color and size options with stock and seller SKUs.', 'Set pricing and package details before publishing.'][this.step]);
		this.progress.css(`width: ${((this.step + 1) / this.stepPanels.length) * 100}%`);
		this.stepBar.find('button').each((index, button) => {
			button.classList.toggle('text-purple-200', index === this.step);
			button.classList.toggle('text-gray-500', index !== this.step);
			button.classList.toggle('bg-purple-300/10', index === this.step);
		});
		this.backBtn.toggleClass('invisible', this.step === 0);
		this.nextBtn.toggleClass('hidden', this.step === this.maxAvailableStep());
		this.submitBtn.toggleClass('hidden', this.step !== this.maxAvailableStep());
		this.error.addClass('hidden');
	}

	continue() {
		if (this.step === 0 && !this.titleInput.val().trim()) return this.showError('Add a product title to continue.');
		if (this.step === 1 && !this.images.length) return this.showError('Add at least one product photo to continue.');
		this.showStep(this.step + 1);
	}

	showError(message) {
		this.error.removeClass('hidden').text(message);
	}

	async addFiles(files) {
		for (const file of Array.from(files)) {
			if (this.images.length >= 8) { this.showError('You can add up to 8 photos.'); break; }
			if (!file.type.startsWith('image/')) { this.showError('Choose a JPEG, PNG, or WebP image.'); continue; }
			if (file.size > 10 * 1024 * 1024) { this.showError(`${file.name} is larger than 10 MB.`); continue; }
			try {
				const bitmap = await createImageBitmap(file);
				const { width, height } = bitmap;
				bitmap.close();
				if (width < 360 || height < 360) { this.showError(`${file.name}: image resolution is ${width} x ${height}; minimum is 360 x 360 px.`); continue; }
				const image = { file, name: file.name, rotation: 0, src: URL.createObjectURL(file) };
				this.images.push(image);
			} catch (error) {
				this.showError(`${file.name} could not be opened as an image.`);
			}
		}
		this.renderPhotos();
		this.updatePreview();
	}

	setAspect(aspect) {
		this.aspect = aspect;
		this.aspectOne.toggleClass('border-purple-300/60', aspect === 1).toggleClass('text-purple-200', aspect === 1);
		this.aspectFourThree.toggleClass('border-purple-300/60', aspect !== 1).toggleClass('text-purple-200', aspect !== 1);
		this.photoGrid.find('[data-crop-frame]').each((index, frame) => { frame.style.aspectRatio = String(aspect); });
	}

	rotateImage(index) {
		this.images[index].rotation = (this.images[index].rotation + 90) % 360;
		this.renderPhotos();
	}

	removeImage(index) {
		URL.revokeObjectURL(this.images[index].src);
		this.images.splice(index, 1);
		this.renderPhotos();
		this.updatePreview();
	}

	renderPhotos() {
		this.photoGrid.removeChildren().append(this.images.map((image, index) => {
			const thumb = D('div', [
				D('div', [D('img', null, 'h-full w-full object-cover', { src: image.src, alt: image.name, draggable: false, style: `transform: rotate(${image.rotation}deg)` }), D('div', index === 0 ? 'MAIN COVER PHOTO' : `PHOTO ${index + 1}`, 'absolute left-1 top-1 rounded bg-black/80 px-1.5 py-1 text-[8px] font-bold text-white')], 'relative overflow-hidden rounded-t-lg bg-zinc-800', { 'data-crop-frame': '' }, `aspect-ratio: ${this.aspect}`),
				D('div', [D('span', image.name, 'min-w-0 flex-1 truncate text-[9px] text-gray-400'), D('button', SVG.reload('h-3.5 w-3.5'), 'rounded p-1 text-gray-300 hover:bg-white/10 [&_svg]:rotate-90', { type: 'button', title: 'Rotate image 90 degrees' }).click(() => this.rotateImage(index)), D('button', SVG.delete('h-3.5 w-3.5'), 'rounded p-1 text-gray-400 hover:text-red-300', { type: 'button', title: 'Remove image' }).click(() => this.removeImage(index))], 'flex items-center gap-1 p-1.5')
			], 'overflow-hidden rounded-lg border border-violet-500/20 bg-zinc-950', { draggable: true, 'data-image-index': index });

			thumb.dragstart(event => { event.dataTransfer.setData('text/plain', String(index)); event.dataTransfer.effectAllowed = 'move'; });
			thumb.dragover(event => event.preventDefault());
			thumb.drop(event => {
				event.preventDefault();
				const from = Number(event.dataTransfer.getData('text/plain'));
				const [moved] = this.images.splice(from, 1);
				this.images.splice(index, 0, moved);
				this.renderPhotos();
				this.updatePreview();
			});
			return thumb;
		}));
	}

	addToken(event, key, input) {
		if (event.key !== 'Enter' && event.key !== ',') return;
		event.preventDefault();
		const value = input.val().trim().replace(/,$/, '');
		if (!value || this[key].some(item => item.toLowerCase() === value.toLowerCase())) return;
		this[key].push(value);
		input.val('');
		this.renderTokens();
		this.buildVariants();
	}

	renderTokens() {
		for (const [key, target] of [['colors', this.colorTags], ['sizes', this.sizeTags]]) {
			target.removeChildren().append(this[key].map((value, index) => D('button', [D('span', value), SVG.close('h-3 w-3')], 'inline-flex items-center gap-1 rounded-full border border-purple-300/20 bg-purple-300/5 px-2 py-1 text-[10px] text-purple-100', { type: 'button' }).click(() => { this[key].splice(index, 1); this.renderTokens(); this.buildVariants(); })));
		}
	}

	buildVariants() {
		const combinations = this.colors.length || this.sizes.length
			? (this.colors.length ? this.colors : ['Default']).flatMap(color => (this.sizes.length ? this.sizes : ['Default']).map(size => ({ color, size })))
			: [{ color: 'Standard', size: 'One size' }];
			
		const previous = new Map(this.variants.map(variant => [`${variant.color}|${variant.size}`, variant]));
		this.variants = combinations.map(({ color, size }) => previous.get(`${color}|${size}`) || { color, size, sku: '', stock: Number(this.stockInput?.val()) || 1, price: '', weight: 0 });
		this.selectedVariants.clear();
		this.variantRows.removeChildren().append([
			D('div', ['','Option','SKU','Stock','Price (USD)','Weight kg'].map(text => D('span', text, 'px-2 py-2 text-[9px] font-semibold uppercase text-gray-500')), 'grid grid-cols-[32px_1fr_1fr_60px_75px_75px] bg-zinc-900'),
			...this.variants.map((variant, index) => D('div', [
				D('input', null, 'accent-purple-300', { type: 'checkbox', 'data-variant-check': index }).on('change', event => { event.target.checked ? this.selectedVariants.add(index) : this.selectedVariants.delete(index); }),
				D('span', [variant.color, variant.size].filter(value => value !== 'Default' && value !== 'Standard' && value !== 'One size').join(' / ') || 'Standard item', 'truncate px-2 text-[10px] text-gray-300'),
				makeInput({ value: variant.sku, placeholder: 'SKU', title: 'A seller-defined code used to identify and track this product.' }).addClass('h-8 px-2 text-[10px]').on('input', event => { variant.sku = event.target.value; }),
				makeInput({ value: variant.stock, type: 'number', min: '0' }).addClass('h-8 px-2 text-[10px]').on('input', event => { variant.stock = Number(event.target.value); }),
				makeInput({ value: variant.price, type: 'number', min: '0', step: '0.01', placeholder: 'Base' }).addClass('h-8 px-2 text-[10px]').on('input', event => { variant.price = event.target.value; }),
				makeInput({ value: variant.weight, type: 'number', min: '0', step: '0.01', placeholder: 'Base' }).addClass('h-8 px-2 text-[10px]').on('input', event => { variant.weight = Number(event.target.value); })
			], 'grid grid-cols-[32px_1fr_1fr_60px_75px_75px] items-center gap-1 px-2 py-1.5', { key: `${variant.color}|${variant.size}` }))
		]);
	}

	applyBulk() {
		if (!this.selectedVariants.size) return this.showError('Select one or more variants to bulk edit.');
		for (const index of this.selectedVariants) {
			if (this.bulkPrice.val() !== '') this.variants[index].price = this.bulkPrice.val();
			if (this.bulkStock.val() !== '') this.variants[index].stock = Number(this.bulkStock.val());
			if (this.bulkWeight.val() !== '') this.variants[index].weight = Number(this.bulkWeight.val());
		}
		this.buildVariants();
	}

	async submit() {
		if (!this.titleInput.val().trim()) { this.showStep(0); return this.showError('Add a product title before publishing.'); }
		if (!this.images.length) { this.showStep(1); return this.showError('Add at least one product photo before publishing.'); }
		const price = Number(this.priceInput.val());
		const salePrice = Number(this.saleInput.val()) || null;
		if (!Number.isFinite(price) || price <= 0) { this.showStep(3); return this.showError('Enter a base price greater than zero.'); }
		if (salePrice !== null && salePrice >= price) { this.showStep(3); return this.showError('Sale price must be lower than the base price.'); }
		this.submitBtn.addClass('pointer-events-none opacity-60').text('Preparing listing...');
		this.error.addClass('hidden');
		try {
			const imageKeys = [];
			for (const image of this.images) {
				const blob = await prepareImage(image.file, this.aspect, image.rotation);
				imageKeys.push(await uploadFile({ filename: image.name.replace(/\.[^.]+$/, '.jpg'), blob }));
			}
			const payload = {
				name: this.titleInput.val().trim(),
				brand: this.brandInput.val().trim(),
				category: this.categorySelect.val(),
				description: this.descriptionInput.val().trim(),
				details: this.productDetailsInput.val().trim(),
				priceFlat: price,
				salePrice,
				uploadData: imageKeys[0],
				images: imageKeys,
				variants: this.variants.map(variant => ({ ...variant, price: Number(variant.price) || price })),
				inventory: this.variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0),
				shipping: {
					weightKg: Number(this.weightInput.val()) || 0,
					dimensionsCm: this.dimensions.map(input => Number(input.val()) || 0)
				},
				sku: this.skuInput.val().trim(),
				gtin: this.gtinInput.val().trim(),
				hsTariffCode: this.tariffInput.val().trim()
			};
			await fetchWithTimeout('/api/feed/submit-product', { method: 'POST', body: JSON.stringify(payload), headers: await this.app.authHeaders() });
			this.modal.close();
			Notice('Your product listing is live.', 'success');
			this.app.navigateTo('/market');
		} catch (error) {
			this.showError(await handleError(error));
		} finally {
			this.submitBtn.removeClass('pointer-events-none', 'opacity-60').text('Publish listing');
		}
	}
}

