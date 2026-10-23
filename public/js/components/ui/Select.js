/**
 * Custom select dropdown component.
 */

import { D, SVG } from '../../utils.js';

const inputCls = 'flex-grow h-9 min-w-0 border-none py-1 text-base outline-none md:text-sm bg-zinc-900 border-violet-500/20 focus:border-violet-500/50 text-white rounded-xl';


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
		this.input = D('input', null, `flex-1 ${inputCls}`, null, 'width: calc(100% - 16px)');
		this.search = D('div', [this.input, SVG.search('w-5 h-5 text-gray-500')], 'relative inline-flex items-center justify-between gap-2 whitespace-nowrap text-sm font-medium transition-all h-9 px-4 py-2 w-full bg-zinc-900 text-white rounded-t-xl border border-violet-500/60 border-b-0 hidden', { 'data-slot': 'select-input' });
		this.select = D('select', this.data.select.map((i, n) => D('option', String(i), null, { value: n, 'data-slot': 'select-option' })), 'hidden');
		this.panel = D('div', [this.select, this.search], 'relative user-select-none mb-1', { 'data-slot': 'select' }, 'margin: 10px 0;padding: 7px');
		this.elt = D('div', this.panel, null, { 'data-slot': 'select-outer' });
		this.elt[0].select = this;
		
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
		this.a = D('div', SVG.chevronDown('w-5 h-5'), `relative relative inline-flex items-center justify-between gap-2 whitespace-nowrap text-sm font-medium transition-all h-9 px-4 py-2 w-full bg-zinc-900 text-white rounded-xl border border-violet-500/60`, { 'data-slot': 'select-selected' });
		this.b = D('div', null, 'absolute top-[43px] bg-zinc-700 overflow-hidden rounded-b-xl border border-violet-500/60 border-t-0 z-50 data-[visible=hidden]:hidden', { 'data-slot': 'select-item', 'data-visible': 'hidden' });

		this.a.prepend(this.data.select[0]);
		this.input.val(this.data.select[0]);
		this.b.append(this.data.select.map(s => D('div', s, 'inline-flex items-center whitespace-nowrap text-sm font-medium h-9 px-4 py-2 w-full bg-zinc-800 text-white hover:bg-zinc-900/70 hover:cursor-pointer data-[slot=same-as-selected]:bg-zinc-900')));
		this.b[0].firstChild.setAttribute('data-slot', 'same-as-selected');
		this.panel.append(this.a, this.b);

		this.a.click(function (event) {
			event.stopPropagation();
			_this.closeAllSelect();
			_this.search.removeClass('hidden');
			_this.input.val('');
			_this.input[0].focus();
			this.nextSibling.toggleAttribute('data-visible');
			this.toggleAttribute('data-select-arror');
			this.nextSibling.scrollTop = 0;
			_this.b.css(`width: ${EQuery(this).width()}px`);
			_this.a.addClass('hidden');
			const d = _this.panel.find('[data-slot=select-item]>div');
			d.click(function (i) {
				_this.input.val(this.innerText);
				EQuery(this.parentElement.parentElement.children[2]).removeChildren().append(this.innerHTML, SVG.chevronDown('w-5 h-5'));
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
			_this.panel.find('[data-slot=select-selected]').removeChildren().append(elt.selectedOptions[0].innerText, SVG.chevronDown('w-5 h-5'));
			for (let i = 0; i < _this.b.find('div').length; i++) {
				EQuery(_this.b.find('div')[i]).removeAttr('data-slot');
				EQuery(_this.b.find('div')[index]).attr({ 'data-slot': 'same-as-selected' });
			}
		});

		this.b.click(() => {
			const selected = this.panel.find('[data-slot=same-as-selected]')[0];
			elt.value = selects.indexOf(selected.innerText);
		});

		if (window.innerHeight > 520) {
			let height = this.innerHeight / 4;
			this.b.css(`max-height: ${height}px`);
		} else {
			this.b.css('max-height: 300px');
		}
		this.panel.find('input').css(`width: ${this.panel.find('[data-slot=select-selected]').width() - 20}px`);

		EQuery(window).on(['resize', 'click'], function () {
			if (window.innerHeight > 520) {
				const height = this.innerHeight / 4;
				_this.b.css(`max-height: ${height}px`);
			} else {
				_this.b.css('max-height: 300px');
			}
			_this.panel.find('input').css(`width: ${_this.panel.find('[data-slot=select-selected]').width() - 20}px`);
		});

		if (window.innerHeight > 520) {
			const height = this.innerHeight / 4;
			this.b.css(`max-height: ${height}px`);
		} else {
			this.b.css('max-height: 300px');
		}
	}

	close() {
		this.a.removeClass('hidden');
		this.b.addClass('hidden');
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

		y.removeClass('hidden');
		EQuery('[data-slot=select-input]').addClass('hidden');
		EQuery('[data-slot=select-item]>div').show();
	}
}