/**
 * Custom select dropdown component.
 */

import { D, SVG } from '../../utils.js';

const inputCls = 'absolute flex h-9 min-w-0 border px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 bg-zinc-900 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl z-0';
const btnCls = 'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 w-full bg-gradient-to-r bg-zinc-900 text-white rounded-xl';


export default class Select {
	/**
	 * Creates a select component.
	 * @param {Object} data - Configuration object
	 * @param {string} data.name - The name attribute for the select element
	 * @param {Array<string|number>} data.select - Array of options to display
	 */
	constructor(data) {
		let _this = this;
		this.data = data;
		this.input = D('input', null, `absolute ${inputCls}`, { 'data-slot': 'select-input' }, 'width: calc(100% - 16px)');
		this.select = D('select', this.data.select.map((i, n) => D('option', String(i), null, { value: n, 'data-slot': 'select-option' })), 'hidden');
		this.panel = D('div', [this.select, this.input], 'relative user-select-none mb-1', { 'data-slot': 'select' }, 'margin: 10px 0;padding: 7px');
		this.elt = D('div', [this.panel], null, { 'data-slot': 'select-outer' });
		
		this.editSelect();
		this.input.on('input', function () {
			let txt = this.value;
			_this.elt.find('[data-slot=select-item]>div').each((i, elt) => {
				if (elt.innerHTML.toLowerCase().indexOf(txt.toLowerCase()) === -1) {
					EQuery(elt).hide();
				} else {
					EQuery(elt).show();
				}
			});
		});
	}

	/**
	 * Gets the current selected value.
	 * @returns {string|number} The value of the selected option
	 */
	val() {
		return this.data.select[this.select.val()];
	}

	/**
	 * Converts a select element into a custom searchable select component.
	 * @returns {void}
	 */
	editSelect() {
		const _this = this;
		const elt = this.select[0];
		const a = D('div', SVG.chevronDown('w-5 h-5'), `relative ${btnCls} border border-violet-500/60`, { 'data-slot': 'select-selected' });
		const b = D('div', null, 'absolute top-[40px] bg-zinc-700 w-full z-50 data-[visible=hidden]:hidden', { 'data-slot': 'select-item', 'data-visible': 'hidden' });

		a.append(elt.options[0].innerText);
		this.input.val(elt.options[0].innerText);
		for (let i = 0; i < elt.options.length; i++) {
			const c = D('div', elt.options[i].innerHTML, 'w-full bg-opacity px-4 py-3 cursor-pointer user-select-none hover:opacity-75 data-[slot=same-as-selected]:bg-zinc-800');
			b.append(c);
		}
		b[0].firstChild.setAttribute('data-slot', 'same-as-selected');
		this.panel.append([a, b]);
		a.click(function (event) {
			event.stopPropagation();
			_this.closeAllSelect();
			_this.input.removeClass('z-0').addClass('z-10').val('');
			_this.input[0].focus();
			this.nextSibling.toggleAttribute('data-visible');
			this.toggleAttribute('data-select-arror');
			const d = _this.panel.find('[data-slot=select-item]>div');
			d.click(function (i) {
				_this.input.val(this.innerHTML);
				this.parentElement.parentElement.children[2].innerHTML = this.innerHTML;
				_this.panel.find('[data-slot=select-item]>div').each((i, elt) => {
					EQuery(elt).removeAttr('data-slot');
				});
				this.setAttribute('data-slot', 'same-as-selected');
			});
		});
		this.updateSelect();
		EQuery(document).click(this.closeAllSelect);
	}

	/**
	 * Updates the select component with current options.
	 * @returns {void}
	 */
	updateSelect() {
		const _this = this;
		const elt = this.select[0];
		const selects = [];

		for (let i = 0; i < elt.options.length; i++) {
			selects.push(elt.options[i].innerText);
		}

		EQuery(elt).click(function () {
			let index = selects.indexOf(this.selectedOptions[0].innerText);
			_this.panel.find('[data-slot=select-selected]').text(elt.selectedOptions[0].innerText);
			for (let i = 0; i < EQuery('[data-slot=select-item]>div').length; i++) {
				EQuery(EQuery('[data-slot=select-item]>div')[i]).removeAttr('data-slot');
				EQuery(EQuery('[data-slot=select-item]>div')[index]).attr({ 'data-slot': 'same-as-selected' });
			}
		});

		this.panel.find('[data-slot=select-item]').click(function () {
			const selected = _this.panel.find('[data-slot=same-as-selected]')[0];
			elt.value = selects.indexOf(selected.innerText);
		});

		if (window.innerHeight > 520) {
			let height = this.innerHeight / 4;
			this.panel.find('[data-slot=select-item]').css(`max-height: ${height}px`);
		} else {
			this.panel.find('[data-slot=select-item]').css('max-height: 300px');
		}
		this.panel.find('input').css(`width: ${this.panel.find('[data-slot=select-selected]').width() - 20}px`);

		EQuery(window).on(['resize', 'click'], function () {
			if (window.innerHeight > 520) {
				const height = this.innerHeight / 4;
				_this.panel.find('[data-slot=select-item]').css(`max-height: ${height}px`);
			} else {
				_this.panel.find('[data-slot=select-item]').css('max-height: 300px');
			}
			this.panel.find('input').css(`width: ${this.panel.find('[data-slot=select-selected]').width() - 20}px`);
		});

		if (window.innerHeight > 520) {
			const height = this.innerHeight / 4;
			this.panel.find('[data-slot=select-item]').css(`max-height: ${height}px`);
		} else {
			this.panel.find('[data-slot=select-item]').css('max-height: 300px');
		}
	}

	/**
	 * Closes all open select dropdowns.
	 * @returns {void}
	 */
	closeAllSelect(elt) {
		let arrNo = [];
		let x = EQuery('[data-slot=select-item]');
		let y = EQuery('[data-slot=select-selected]');

		y.each((i, _elt) => {
			if (elt === _elt) {
				arrNo.push(i);
			} else {
				EQuery(_elt).attr({ 'data-select-arror': 'inactive' });
			}
		});

		x.each((i, elt) => {
			if (arrNo.indexOf(i)) {
				EQuery(elt).attr({ 'data-visible': 'hidden' });
			}
		});

		EQuery('[data-slot=select-input]').removeClass('z-10').addClass('z-0');
		EQuery('[data-slot=select-item]>div').show();
	}
}