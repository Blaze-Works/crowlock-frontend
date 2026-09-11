/**
 *
 * EQuery.js 3.0.4
 * By Sharon Abodunrin
 */

(function (global, factory) {
	global = global || self, global.EQuery = factory(global.window, global.document);
	if (!global.document) { throw new Error('EQuery requires a window and a document'); }
}(this, (function (window$1, document) {

	window$1 = window$1 && Object.prototype.hasOwnProperty.call(window$1, 'default') ? window$1['default'] : window$1;
	document = document && Object.prototype.hasOwnProperty.call(document, 'default') ? document['default'] : document;

	/**
	 * @file create-logger.js
	 * @module create-logger
	 */

	let _func;
	let history = [];
	let time = () => { return `[${/\d\d\:\d\d\:\d\d/.exec(Date())[0]}]` };
	let LogByTypeFactory = function LogByTypeFactory(name, log) {
		return function (type, level, args) {
			let _args = args
			let lvl = log.levels[level];
			let lvlRegExp = new RegExp('^(' + lvl + ')$');

			if (type !== 'log') {
				args.unshift(type.toUpperCase() + ':');
			}

			args.unshift(`${time()} ${name}:`);

			if (history) {
				history.push([].concat(args));

				let splice = history.length - 1000;
				history.splice(0, splice > 0 ? splice : 0);
			}

			if (!console) { return; }
			let fn = console[type];
			if (!fn && type === 'debug') { fn = console.info || console.log; }
			if (!fn || !lvl || !lvlRegExp.test(type)) { return; }

			fn[Array.isArray(args) ? 'apply' : 'call'](console, args);
			if (_func !== undefined) _func(_args);
		};
	};

	function createLogger(name) {
		var level = 'info';

		var logByType;
		/**
		 * Logs plain debug messages. Similar to `console.log`.
		 *
		 * Due to [limitations](https://github.com/jsdoc3/jsdoc/issues/955#issuecomment-313829149)
		 * of our JSDoc template, we cannot properly document this as both a function
		 * and a namespace, so its function signature is documented here.
		*
		* Any combination of values that could be passed to `console.log()`.
		*
		* #### Return Value
		*
		* `undefined`
		*
		* @namespace
		* @param    {Mixed[]} args
		*           One or more messages or objects that should be logged.
		*/

		var log = function log() {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			logByType('log', level, args);
		};


		logByType = LogByTypeFactory(name, log);

		log.createLogger = function (subname) {
			return createLogger(name + ': ' + subname);
		};


		log.levels = {
			all: 'debug|log|warn|error',
			off: '',
			debug: 'debug|log|warn|error',
			info: 'log|warn|error',
			warn: 'warn|error',
			error: 'error',
			DEFAULT: level
		};

		log.level = function (lvl) {
			if (typeof lvl === 'string') {
				if (!log.levels.hasOwnProperty(lvl)) {
					throw new Error('\'' + lvl + '\' in not a valid log level');
				}

				level = lvl;
			}

			return level;
		};

		log.history = function () {
			return history ? [].concat(history) : [];
		};

		log.history.filter = function (fname) {
			return (history || []).filter(function (historyItem) {
				return new RegExp('.*' + fname + '.*').test(historyItem[0]);
			});
		};

		log.history.clear = function () {
			if (history) {
				history.length = 0;
			}
		};

		log.history.disable = function () {
			if (history !== null) {
				history.length = 0;
				history = null;
			}
		};

		log.history.enable = function () {
			if (history === null) {
				history = [];
			}
		};

		log.error = function () {
			for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				args[_key2] = arguments[_key2];
			}

			return logByType('error', level, args);
		};

		log.warn = function () {
			for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
				args[_key3] = arguments[_key3];
			}

			return logByType('warn', level, args);
		};

		log.debug = function () {
			for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
				args[_key4] = arguments[_key4];
			}

			return logByType('debug', level, args);
		};

		return log;
	}

	const log = createLogger('EQuery');

	/**
	 * @file guid.js
	 * @module guid
	 */
	let _initialGuid = 3;
	let _guid = _initialGuid;
	function newGUID() {
		return _guid++;
	}

	/**
	 * @file dom-data.js
	 * @module dom-data
	 */
	let FakeWeakMap;

	if (!window$1.WeakMap) {
		FakeWeakMap = function () {
			function FakeWeakMap() {
				this.vdata = `vdata${Math.floor(window$1.performance && window$1.performance.now() || Date.now())}`;
				this.data = {};
			}

			let _proto = FakeWeakMap.prototype;

			_proto.set = function set(key, value) {
				let access = key[this.vdata] || newGUID();

				if (!key[this.vdata]) {
					key[this.vdata] = access;
				}

				this.data[access] = value;
				return this;
			};

			_proto.get = function get(key) {
				let access = key[this.vdata];

				if (access) {
					return this.data[access];
				}

				log('We have no data for this element', key);
				return undefined;
			};

			_proto.has = function has(key) {
				let access = key[this.vdata];
				return access in this.data;
			};

			_proto['delete'] = function _delete(key) {
				let access = key[this.vdata];

				if (access) {
					delete this.data[access];
					delete key[this.vdata];
				}
			};

			return FakeWeakMap;
		}();
	}

	let DomData = window$1.WeakMap ? new WeakMap() : new FakeWeakMap();

	function _cleanUpEvents(elemt, type) {
		if (!DomData.has(elemt)) {
			return;
		}
	
		let data = DomData.get(elemt);
	
		if (data.handlers[type].length === 0) {
			delete data.handlers[type];
	
			if (elemt.removeEventListener) {
				elemt.removeEventListener(type, data.dispatcher, false);
			} else if (elemt.detachEvent) {
				elemt.detachEvent(`on${type}`, data.dispatcher);
			}
		}
	
	
		if (Object.getOwnPropertyNames(data.handlers).length <= 0) {
			delete data.handlers;
			delete data.dispatcher;
			delete data.disabled;
		}
	
	
		if (Object.getOwnPropertyNames(data).length === 0) {
			DomData['delete'](elemt);
		}
	}
	
	function _handleMultipleEvents(fn, elemt, types, callback) {
		types.forEach(function (type) {
			fn(elemt, type, callback);
		});
	}
	
	function fixEvent(event) {
		if (event.fixed_) {
			return event;
		}
	
		function returnTrue() {
			return true;
		}
	
		function returnFalse() {
			return false;
		}
	
		if (!event || !event.isPropagationStopped) {
			let old = event || window$1.event;
			event = {};
			for (let key in old) {
				if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation' && key !== 'webkitMovementX' && key !== 'webkitMovementY') {
					if (!(key === 'returnValue' && old.preventDefault)) {
						event[key] = old[key];
					}
				}
			}
	
	
			if (!event.target) {
				event.target = event.srcElement || document;
			}
	
	
			if (!event.relatedTarget) {
				event.relatedTarget = event.fromElement === event.target ? event.toElement: event.fromElement;
			}
	
	
			event.preventDefault = function () {
				if (old.preventDefault) {
					old.preventDefault();
				}
	
				event.returnValue = false;
				old.returnValue = false;
				event.defaultPrevented = true;
			};
	
			event.defaultPrevented = false;
	
			event.stopPropagation = function () {
				if (old.stopPropagation) {
					old.stopPropagation();
				}
	
				event.cancelBubble = true;
				old.cancelBubble = true;
				event.isPropagationStopped = returnTrue;
			};
	
			event.isPropagationStopped = returnFalse;
	
			event.stopImmediatePropagation = function () {
				if (old.stopImmediatePropagation) {
					old.stopImmediatePropagation();
				}
	
				event.isImmediatePropagationStopped = returnTrue;
				event.stopPropagation();
			};
	
			event.isImmediatePropagationStopped = returnFalse;
	
			if (event.clientX !== null && event.clientX !== undefined) {
				let doc = document.documentElement;
				let body = document.body;
				event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
			}
	
	
			event.which = event.charCode || event.keyCode;
	
			if (event.button !== null && event.button !== undefined) {
				event.button = event.button & 1 ? 0: event.button & 4 ? 1: event.button & 2 ? 2: 0;
			}
		}
	
		event.fixed_ = true;
	
		return event;
	}
	
	function _getListenerOptions(type, customOptions) {
		if (customOptions !== undefined && customOptions !== null) {
			if (typeof customOptions === 'boolean') {
				return customOptions;
			}
	
			if (typeof customOptions === 'object') {
				let opts = { ...customOptions };
	
				if (passiveEvents.indexOf(type) > -1 && 
					supportsPassive() && 
					opts.passive === undefined) {
					opts.passive = true;
				}
	
				return supportsPassive() ? opts : false;
			}
		}
	
		if (supportsPassive() && passiveEvents.indexOf(type) > -1) {
			return { passive: true };
		}
	
		return false;
	}
	
	let _supportsPassive;
	
	let supportsPassive = function supportsPassive() {
		if (typeof _supportsPassive !== 'boolean') {
			_supportsPassive = false;
	
			try {
				let opts = Object.defineProperty({}, 'passive', {
					get: function get() {
						_supportsPassive = true;
					}
				});
				window$1.addEventListener('test', null, opts);
				window$1.removeEventListener('test', null, opts);
			} catch (e) {}
		}
	
		return _supportsPassive;
	};
	
	function setPassiveEvents(events) {
		if (Array.isArray(events)) {
			passiveEvents = events;
		}
	}
	
	let passiveEvents = ['touchstart', 'touchmove'];
	
	/**
	* Adds an event listener to an element (supports multiple event types via array).
	* @param {Element} elemt - Target DOM element
	* @param {string|string[]} type - Event type or array of types (e.g. 'click' or ['touchstart','touchmove'])
	* @param {Function} fn - Event handler function (receives event and optional hash)
	* @param {boolean|Object} [options] - Optional addEventListener options. If true/false, uses default behavior.
	*/
	function on(elemt, type, fn, options) {
		if (Array.isArray(type)) {
			return _handleMultipleEvents(on, elemt, type, fn, options);
		}
	
		if (!DomData.has(elemt)) {
			DomData.set(elemt, {});
		}
	
		let data = DomData.get(elemt);
	
		if (!data.handlers) {
			data.handlers = {};
		}
	
		if (!data.handlers[type]) {
			data.handlers[type] = [];
		}
	
		if (!fn.guid) {
			fn.guid = newGUID();
		}
	
		data.handlers[type].push(fn);
	
		if (!data.dispatcher) {
			data.disabled = false;
	
			data.dispatcher = function (event, hash) {
				if (data.disabled) {
					return;
				}
	
				event = fixEvent(event);
				let handlers = data.handlers[event.type];
	
				if (handlers) {
					let handlersCopy = handlers.slice(0);
	
					for (let m = 0, n = handlersCopy.length; m < n; m++) {
						if (event.isImmediatePropagationStopped()) {
							break;
						} else {
							try {
								handlersCopy[m].call(elemt, event, hash);
							} catch (e) {
								log.error(e);
							}
						}
					}
				}
			};
		}
	
		if (data.handlers[type].length === 1) {
			if (elemt.addEventListener) {
				let listenerOptions = _getListenerOptions(type, options);
				elemt.addEventListener(type, data.dispatcher, listenerOptions);
			} else if (elemt.attachEvent) {
				elemt.attachEvent(`on${type}`, data.dispatcher);
			}
		}
	}
	
	/**
	* Removes event listeners previously attached with `on`.
	* If `type` is omitted, removes all handlers for the element.
	* @param {Element} elemt - Target DOM element
	* @param {string|string[]} [type] - Event type or array of types
	* @param {Function} [fn] - Specific handler to remove (if omitted removes all handlers for the type)
	*/
	function off(elemt, type, fn) {
		if (!DomData.has(elemt)) {
			return;
		}
	
		let data = DomData.get(elemt);
	
		if (!data.handlers) {
			return;
		}
	
		if (Array.isArray(type)) {
			return _handleMultipleEvents(off, elemt, type, fn);
		}
	
		let removeType = function removeType(el, t) {
			data.handlers[t] = [];
			_cleanUpEvents(el, t);
		};
	
		if (type === undefined) {
			for (let t in data.handlers) {
				if (Object.prototype.hasOwnProperty.call(data.handlers || {}, t)) {
					removeType(elemt, t);
				}
			}
			return;
		}
	
		let handlers = data.handlers[type];
	
		if (!handlers) {
			return;
		}
	
	
		if (!fn) {
			removeType(elemt, type);
			return;
		}
	
	
		if (fn.guid) {
			for (let n = 0; n < handlers.length; n++) {
				if (handlers[n].guid === fn.guid) {
					handlers.splice(n--, 1);
				}
			}
		}
	
		_cleanUpEvents(elemt, type);
	}
	
	/**
	* Triggers an event on an element. `event` may be an event object or a string event type.
	* @param {Element} elemt - Target DOM element
	* @param {string|Object} event - Event type string or event-like object
	* @param {any} [hash] - Optional additional data passed to handlers
	* @returns {boolean} False if event.defaultPrevented, otherwise true
	*/
	function trigger(elemt, event, hash) {
		let elemData = DomData.has(elemt) ? DomData.get(elemt): {};
		let parent = elemt.parentNode || elemt.ownerDocument;
	
		if (typeof event === 'string') {
			event = {
				type: event,
				target: elemt
			};
		} else if (!event.target) {
			event.target = elemt;
		}
	
		event = fixEvent(event);
	
		if (elemData.dispatcher) {
			elemData.dispatcher.call(elemt, event, hash);
		}
	
		if (parent && !event.isPropagationStopped() && event.bubbles === true) {
			trigger.call(null, parent, event, hash);
		} else if (!parent && !event.defaultPrevented && event.target && event.target[event.type]) {
			if (!DomData.has(event.target)) {
				DomData.set(event.target, {});
			}
	
			let targetData = DomData.get(event.target);
	
			if (event.target[event.type]) {
				targetData.disabled = true;
	
				if (typeof event.target[event.type] === 'function') {
					event.target[event.type]();
				}
	
				targetData.disabled = false;
			}
		}
	
		return !event.defaultPrevented;
	}
	
	/**
	* Adds an event listener that will be called at most once.
	* @param {Element} elemt - Target DOM element
	* @param {string|string[]} type - Event type or array of types
	* @param {Function} fn - Handler function
	*/
	function one(elemt, type, fn, options) {
		if (Array.isArray(type)) {
			return _handleMultipleEvents(one, elemt, type, fn, options);
		}
	
		let func = function func() {
			off(elemt, type, func);
			fn.apply(this, arguments);
		};
	
		func.guid = fn.guid = fn.guid || newGUID();
		on(elemt, type, func, options);
	}
	
	/**
	* Alias for adding a one-time event listener (keeps name parity with other libs).
	* @param {Element} elemt - Target DOM element
	* @param {string|string[]} type - Event type or array of types
	* @param {Function} fn - Handler function
	*/
	function any(elemt, type, fn, options) {
		let func = function func() {
			off(elemt, type, func);
			fn.apply(this, arguments);
		};
	
		func.guid = fn.guid = fn.guid || newGUID();
		on(elemt, type, func, options);
	}
	
	/**
	* Lightweight EventTarget-like helper used by EQuery objects.
	* Provides .on/.off/.one/.any/.trigger methods on objects.
	* @constructor
	*/
	let EventTarget = function EventTarget() {};
	
	EventTarget.prototype.allowedEvents_ = {};
	
	EventTarget.prototype.on = function (type, fn) {
		let ael = this.addEventListener;
		this.addEventListener = function () {};
		on(this, type, fn);
		this.addEventListener = ael;
	};
	
	EventTarget.prototype.addEventListener = EventTarget.prototype.on;
	
	EventTarget.prototype.off = function (type, fn) {
		off(this, type, fn);
	};
	
	EventTarget.prototype.removeEventListener = EventTarget.prototype.off;
	
	EventTarget.prototype.one = function (type, fn) {
		let ael = this.addEventListener;
		this.addEventListener = function () {};
		one(this, type, fn);
		this.addEventListener = ael;
	};
	
	EventTarget.prototype.any = function (type, fn) {
		let ael = this.addEventListener;
		this.addEventListener = function () {};
		any(this, type, fn);
		this.addEventListener = ael;
	};
	
	EventTarget.prototype.trigger = function (event) {
		let type = event.type || event;
	
		if (typeof event === 'string') {
			event = {
				type: type
			};
		}
	
		event = fixEvent(event);
	
		if (this.allowedEvents_[type] && this[`on${type}`]) {
			this[`on${type}`](event);
		}
	
		trigger(this, event);
	};
	
	EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;
	let EVENT_MAP;
	
	EventTarget.prototype.queueTrigger = function (event) {
		let _this = this;
		if (!EVENT_MAP) {
			EVENT_MAP = new Map();
		}
	
		let type = event.type || event;
		let map = EVENT_MAP.get(this);
	
		if (!map) {
			map = new Map();
			EVENT_MAP.set(this, map);
		}
	
		let oldTimeout = map.get(type);
		map['delete'](type);
		window$1.clearTimeout(oldTimeout);
		let timeout = window$1.setTimeout(function () {
			if (map.size === 0) {
				map = null;
				EVENT_MAP['delete'](_this);
			}
	
			_this.trigger(event);
		},
			0);
		map.set(type, timeout);
	};

	/**
	 * The EQuery stored variable where all functions below is stored on an object,
	 * able to allow custom functions into it. For example:
	 * the `EQuery.fn.css` function return the `css` function {@link css}.
	 *
	 * @see [EQuery Spec]{@link https://github.com/blaze-works/equery/}
	 * @see [EQuery func]{@link init @alias q.fn.init}
	 * @class EQuery
	 */

	/**
	 * EQuery selector factory — returns an EQuery collection wrapping DOM nodes.
	 * @param {string|Element|Array<Element>} selector - CSS selector, element, or array of elements
	 * @param {Element|Document} [context] - Optional context for query selection
	 * @returns {q} EQuery collection object
	 */
	let q = function (selector, context) {
		return new q.fn.init(selector, context);
	};

	let arr = [], slice = arr.slice, push = arr.push, toString = {}.toString;

	q.fn = q.prototype = {
		equery: q,
		constructor: q,
		length: 0,
		toArray: function () {
			return slice.call(this);
		},
		get: function (a) {
			return a == null ? slice.call(this) : (a < 0 ? this[a + this.length] : this[a]);
		},
		pushStack: function (a) {
			let ret = q.merge(this.constructor(), a);
			ret.prevObject = this;
			return ret;
		},
		each: function (callback) {
			return q.each(this, callback);
		},
		map: function (callback) {
			return this.pushStack(q.map(this, function (elem, i) {
				return callback.call(elem, i, elem);
			}));
		},
		slice: function () {
			return this.pushStack(slice.apply(this, arguments));
		},
		first: function () {
			return this.eq(0);
		},
		last: function () {
			return this.eq(-1);
		},
		eq: function (i) {
			let len = this.length,
				j = +i + (i < 0 ? len : 0);
			return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
		},
		end: function () {
			return this.prevObject || this.constructor();
		},
		push: push,
		sort: arr.sort,
		splice: arr.splice
	};

	/**
	 * 
	 * @param {Element|String} elemt 
	 * @param {Boolean} x 
	 * @param {Boolean} y 
	 * @param {Boolean} resize
	 * 
	 * Gives an element a dragging effect. For instance if the element has a 
	 * child with id name: `element.id + '-header'`, the child will have the dragging
	 * effect that will move the entire element else the entire element will be
	 * moved on its own.
	 * 
	 * The element can also be resized by the {@link resize} function
	 */
	let dragElement = function (elemt, x, y, resize) {
		elemt = typeof elemt == 'string' ? getElemt(elemt) : elemt;
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		if (elemt.querySelector(`#${elemt.id}-header`)) {
			on(elemt.querySelector(`#${elemt.id}-header`), 'mousedown', dragMouseDown);
		} else {
			on(elemt, 'mousedown', dragMouseDown);
		}

		if (resize) resize(elemt, x, y);

		function dragMouseDown(event) {
			event = event || window.event;
			event.preventDefault();
			pos3 = event.clientX;
			pos4 = event.clientY;
			document.onmouseup = closeDragElement;
			document.onmousemove = elementDrag;
		}

		function elementDrag(event) {
			event = event || window.event;
			event.preventDefault();
			pos1 = pos3 - event.clientX;
			pos2 = pos4 - event.clientY;
			pos3 = event.clientX;
			pos4 = event.clientY;

			if (x && !y) {
				css(elemt, `left: ${(elemt.offsetLeft - pos1)}px !important;`);
			} else if (!x && y) {
				css(elemt, `top: ${(elemt.offsetTop - pos2)}px !important;`);
			} else if (x && y || !x && !y) {
				css(elemt, `top: ${(elemt.offsetTop - pos2)}px !important;`);
				css(elemt, `left: ${(elemt.offsetLeft - pos1)}px !important;`);
			}

			if (!hasClass(elemt, 'selected')) addClass(elemt, 'selected');
			removeClass('.selected', 'selected');
			addClass(elemt, 'selected');
		}

		function closeDragElement() {
			document.onmouseup = null;
			document.onmousemove = null;
		}
	};

	/**
	 * 
	 * @param {Element|String} elemt 
	 * @param {Boolean} x 
	 * @param {Boolean} y 
	 *   
	 */
	let resize = function (elt, x, y) {
		elt = typeof elemt == 'string' ? getElemt(elt) : elt;

		let ne = elemt('div', null, 'e-display-topright', null, 'width: 10px;height: 10px;cursor: ne-resize');
		let n = elemt('div', null, 'e-display-top', null, 'width: calc(100% - 20px);height: 10px;margin-left: 31px;cursor: n-resize');
		let nw = elemt('div', null, 'e-display-topleft', null, 'width: 10px;height: 10px;cursor: nw-resize');
		let se = elemt('div', null, 'e-display-bottomright', null, 'width: 10px;height: 10px;cursor: nw-resize');
		let s = elemt('div', null, 'e-display-bottom', null, 'width: calc(100% - 20px);height: 10px;margin-left: 10px;cursor: s-resize');
		let sw = elemt('div', null, 'e-display-bottomleft', null, 'width: 10px;height: 10px;cursor: ne-resize');
		let ep = elemt('div', null, 'e-display-right', null, 'height: calc(100% - 20px);width: 10px;margin-top: 10px;cursor: e-resize');
		let w = elemt('div', null, 'e-display-left', null, 'height: calc(100% - 20px);width: 10px;margin-top: 10px;cursor: w-resize');

		let cont = elemt('div', [nw, n, ne, sw, s, se, ep, w], 'e-resize-container e-overlay');
		elt.append(cont);

		if (x) {

		} else if (y) {

		} else if (!x && !y || x && y) {

		}
	};

	/**
	 * 
	 * @param {Element|String} elemt 
	 * @param {string} style 
	 * @returns 
	 */
	let getStyleValue = function (elemt, style) {
		elemt = typeof elemt == 'string' ? getElemt(elemt) : elemt;
		if (window.getComputedStyle) {
			return window.getComputedStyle(elemt, null).getPropertyValue(style);
		} else {
			return elemt.currentStyle[style];
		}
	};

	let toCssPx = function (pixels) {
		if (!window.isFinite(pixels)) {
			log.error(`Pixel value is not a number: ${pixels}`);
		}
		return `${Math.round(pixels)}px`;
	};

	let magnify = function (img, zoom) {
		remove('.e-img-magnifier-glass');
		img = typeof img == 'string' ? getElemt(img) : img;
		let glass = elemt('div', null, 'e-img-magnifier-glass dragable');
		img.parentNode.insertBefore(glass, img);
		css(glass, `background-image: url('${img.src}')`);
		css(glass, 'background-repeat: no-repeat');
		css(glass, `background-size: ${toCssPx(img.width * zoom)} ${toCssPx(img.height * zoom)}`);
		let bw = 3, w = glass.offsetWidth / 2, h = glass.offsetHeight / 2;

		on(glass, 'mousemove', moveMagnifier);
		on(img, 'mousemove', moveMagnifier);

		on(glass, 'touchmove', moveMagnifier);
		on(img, 'touchmove', moveMagnifier);

		function moveMagnifier(event) {
			event.preventDefault();
			let pos = getCursorPos(event);
			let x = pos.x;
			let y = pos.y;

			if (x > img.width - (w / zoom)) { x = img.width - (w / zoom); }
			if (x < w / zoom) { x = w / zoom; }
			if (y > img.height - (h / zoom)) { y = img.height - (h / zoom); }
			if (y < h / zoom) { y = h / zoom; }

			css(glass, `left: ${toCssPx(x - w)}`);
			css(glass, `top: ${toCssPx(y - h)}`);

			css(glass, `background-position: -${((x * zoom) - w + bw)}px -${toCssPx((y * zoom) - h + bw)}`);
		}

		function getCursorPos(event) {
			let x = 0, y = 0;
			event = event || window.event;
			let a = img.getBoundingClientRect();

			x = event.pageX - a.left;
			y = event.pageY - a.top;

			x = x - window.pageXOffset;
			y = y - window.pageYOffset;
			return { x: x, y: y };
		}
	};

	let spinner = function (parent) {
		if (!(this instanceof spinner)) return new spinner(parent);
		parent = typeof parent == 'string' ? getElemt(parent) : parent;

		this.rightCircle = elemt('div', null, 'e-spinner-circle');
		this.leftCircle = elemt('div', null, 'e-spinner-circle');
		this.spinnerRight = elemt('div', [this.rightCircle], 'e-spinner-right');
		this.spinnerLeft = elemt('div', [this.leftCircle], 'e-spinner-left');
		this.rotator = elemt('div', [this.spinnerLeft, this.spinnerRight], 'e-spinner-rotator');
		this.container = elemt('div', [this.rotator], 'e-spinner-container')
		this.spinner = elemt('div', [this.container], 'e-spinner e-center');

		append(parent, this.spinner);
	};

	let pickRandom = function (items) {
		let min = 0;
		let max = items.length;
		return items[Math.floor(Math.random() * (max - min)) + min];
	};

	let newComment = function (txt, type) {
		let c = this;
		if (!type) { type = 'error' }
		if (txt) {
			c.closeBtn = elemt('strong', 'x', 'alert-closeBtn');
			c.alertSpan = elemt('span', txt);
			c.comment = elemt('div', [c.alertSpan, c.closeBtn], `e-alert e-display-bottom e-shadow e-display-fixed e-alert-${type}`);
			append(document.body, c.comment);
		}
		c.closeBtn.onclick = function () {
			let div = this.parentElement;
			div.style.opacity = '0';
			setTimeout(function () { remove(div); }, 600);
		}
	};

	let throwIfWhitespace = function (str) {
		if (str.indexOf(' ') >= 0) {
			log.error('class has illegal whitespace characters');
		}
	};

	/**
	 * Creates a DOM element and wraps it in an EQuery collection.
	 * @param {string} tag - Tag name to create (e.g. 'div')
	 * @param {string|Node|Array|q} [content] - Content to append (string, node, or array)
	 * @param {string} [className] - CSS class(es) to add
	 * @param {Object} [attributes] - Attributes to set on the element
	 * @param {string} [style] - Inline css text to apply
	 * @param {Function|q} [self=q] - Optional wrapper function (defaults to q)
	 * @returns {q} Wrapped element as an EQuery collection
	 */
	let elemt = function (tag, content, className, attributes, style, self = q) {
		let elt = document.createElement(tag);
		
		if (self) elt = self(elt);

		if (className) elt.addClass(className);

		if (style) elt.css(style);

		if (content) elt.append(content);
		if (attributes) elt.attr(attributes);
		return elt;
	};

	/**
	 * Remove an element from the DOM.
	 * @param {Element|string} elt - Element or selector
	 * @returns {void}
	 */
	let remove = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (elt.parentNode) elt.parentNode.removeChild(elt);
		else elt.remove();
	};

	/**
	 * Hide an element (sets display:none).
	 * @param {Element|string} elt - Element or selector
	 * @returns {void}
	 */
	let hide = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		css(elt, 'display: none');
	};

	/**
	 * Show an element (sets display:block).
	 * @param {Element|string} elt - Element or selector
	 * @returns {void}
	 */
	let show = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		css(elt, 'display: block');
	};

	/**
	 * Toggle element visibility.
	 * @param {Element|string} elt - Element or selector
	 * @returns {void}
	 */
	let toggleShow = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (elt.style.display == 'none') {
			show(elt);
		} else {
			hide(elt);
		}
	};

	let classRegExp = function (className) {
		return new RegExp(`(^|\\s)${className}($|\\s)`);
	}

	/**
	 * Check whether an element has the provided class.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} classToCheck - Class name to test
	 * @returns {boolean}
	 */
	let hasClass = function (elt, classToCheck) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		throwIfWhitespace(classToCheck);

		if (elt.classList) {
			return elt.classList.contains(classToCheck);
		}

		return classRegExp(classToCheck).test(elt.className);
	};

	/**
	 * Adds a class (or space-separated classes) to an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} classN - Class name(s) to add
	 * @returns {Element} The element
	 */
	let addClass = function (elt, classN) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (classN.indexOf(' ') !== -1) {
			let classList = classN.split(' ');
			classList.forEach(_class => addClass(elt, _class));
		} else if (elt.classList) {
			classN.length !== 0 && elt.classList.add(classN);
		} else if (!hasClass(elt, classN)) {
			elt.className = (`${elt.className} ${classN}`).trim();
		}
	};

	/**
	 * Removes class(es) from an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {...string} classes - One or more class names to remove
	 * @returns {Element} The element
	 */
	let removeClass = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (arguments.length === 1) return elt;
		for (let i = 1; i < arguments.length; i++) {
			let classN = arguments[i];
			if (elt.classList) {
				elt.classList.remove(classN);
			} else {
				throwIfWhitespace(classN);
				elt.className = elt.className.split(/\s+/).filter(function (c) {
					return c !== classN;
				}).join(' ');
			}
		};
	};

	/**
	 * Toggle a class on an element with optional predicate.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} classToToggle - Class to toggle
	 * @param {boolean|Function} [predicate] - If boolean, forces add/remove; if function receives (elt,class) and returns boolean
	 * @returns {Element} The element
	 */
	let toggleClass = function (elt, classToToggle, predicate) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		let has = hasClass(elt, classToToggle);

		if (typeof predicate === 'function') {
			predicate = predicate(elt, classToToggle);
		}

		if (typeof predicate !== 'boolean') {
			predicate = !has;
		}


		if (predicate === has) {
			return;
		}

		if (predicate) {
			addClass(elt, classToToggle);
		} else {
			removeClass(elt, classToToggle);
		}
	};

	/**
	 * Get or set attributes on an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string|Object} attr - Attribute name or object of attributes to set
	 * @param {string} [value] - Value when setting a single attribute
	 * @returns {string|undefined} When getting, returns the attribute value
	 */
	let attr = function (elt, attr, value) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (typeof attr == 'object') {
			setAttributes(elt, attr);
		} else if (typeof attr == 'string' && value) {
			let obj = {};
			obj[attr] = value;
			setAttributes(elt, obj);
		} else {
			return getAttributes(elt)[attr];
		}
	}

	/**
	 * Sets multiple attributes on an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {Object} attributes - Map of attribute names to values
	 * @returns {void}
	 */
	let setAttributes = function (elt, attributes) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
			let attrValue = attributes[attrName];

			if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
				elt.removeAttribute(attrName);
			} else {
				elt.setAttribute(attrName, attrValue === true ? '' : attrValue);
			}
		});
	};

	/**
	 * Returns attributes map for an element.
	 * @param {Element|string} elt - Element or selector
	 * @returns {Object.<string,string|boolean>} Map of attribute names to values
	 */
	let getAttributes = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		let obj = {};
		if (elt && elt.attributes && elt.attributes.length > 0) {
			let attrs = elt.attributes;

			for (let i = attrs.length - 1; i >= 0; i--) {
				let attrName = attrs[i].name;
				let attrVal = attrs[i].value;

				if (typeof elt[attrName] === 'boolean') {
					attrVal = attrVal !== null ? true : false;
				}

				obj[attrName] = attrVal;
			}
		}

		return obj;
	};

	/**
	 * Resolves a selector or element into a DOM element.
	 * @param {string|Element} elt - Selector string or element
	 * @returns {Element} First matching element
	 */
	let getElemt = function (elt) {
		if (typeof elt == 'string') { return q(document).find(elt)[0] }
		else { return elt }
	};

	/**
	 * Returns an EQuery collection or array for the given selector/element.
	 * @param {string|Element} elt - Selector string or element
	 * @returns {q|Array<Element>} EQuery collection or array-wrapped element
	 */
	let getElements = function (elt) {
		if (typeof elt == 'object') { return [elt] }
		else {
			return q(elt)
		}
	};

	let removeAttr = function (elt, attribute) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		elt.removeAttribute(attribute);
	};

	/**
	 * Get or set inline CSS on an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} [style] - CSS text to append or property name
	 * @param {string} [val] - Value when setting a single property
	 * @returns {string|void} When getting returns cssText
	 */
	let css = function (elt, style, val) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (style && val) { elt.style.setProperty(style, val) }
		else if (style) { elt.style.cssText += style; }
		else { return elt.style.cssText }
	};

	/**
	 * Removes child nodes from a parent element.
	 * @param {Element|string} parent - Parent element or selector
	 * @param {Array<Node>} child - Array of child nodes to remove
	 * @returns {void}
	 */
	let removeChild = function (parent, child) {
		if (typeof parent == 'string') {
			getElements(parent).each((i, elt) => {
				for (let i = 0; i < child.length; i++) { if (hasChild(elt, child[i])) elt.removeChild(child[i]); }
			});
		} else {
			for (let i = 0; i < child.length; i++) {
				if (parent.elt) {
					if (hasChild(parent.elt, child[i])) parent.elt.removeChild(child[i]);
				} else {
					if (hasChild(parent, child[i])) parent.removeChild(child[i]);
				}
			}
		}
	};

	/**
	 * Removes all child nodes from an element.
	 * @param {Element|string} elt - Element or selector
	 * @returns {Element} The cleared element
	 */
	let removeChildren = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		for (let count = elt.childNodes.length; count > 0; --count) { elt.removeChild(elt.firstChild); }
		return elt;
	};

	/**
	 * Returns bounding rectangle measurements for an element (subset of getBoundingClientRect).
	 * @param {Element|string} elt - Element or selector
	 * @returns {Object|undefined} Object with bottom,height,left,right,top,width when available
	 */
	let getBoundingClientRect = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (elt && elt.getBoundingClientRect && elt.parentNode) {
			let rect = elt.getBoundingClientRect();
			let result = {};
			['bottom', 'height', 'left', 'right', 'top', 'width'].forEach(function (k) {
				if (rect[k] !== undefined) {
					result[k] = rect[k];
				}
			});

			if (!result.height) {
				result.height = parseFloat(computedStyle(elt, 'height'));
			}

			if (!result.width) {
				result.width = parseFloat(computedStyle(elt, 'width'));
			}

			return result;
		}
	};

	/**
	 * Finds the position of an element relative to the document.
	 * @param {Element|string} elt - Element or selector
	 * @returns {{left:number,top:number}} Position object
	 */
	let findPosition = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (!elt || elt && !elt.offsetParent) {
			return {
				left: 0,
				top: 0,
				width: 0,
				height: 0
			};
		}

		let width = elt.offsetWidth;
		let height = elt.offsetHeight;
		let left = 0;
		let top = 0;

		do {
			left += elt.offsetLeft;
			top += elt.offsetTop;
			elt = elt.offsetParent;
		} while (elt);

		return {
			left: left,
			top: top,
			width: width,
			height: height
		};
	};

	/**
	 * Finds the position of an element relative to the document.
	 * @param {Element|string} elt - Element or selector
	 * @returns {{left:number,top:number}} Position object
	 */
	let getPointerPosition = function (elt, event) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		let position = {};
		let boxTarget = findPosition(event.target);
		let box = findPosition(elt);
		let boxW = box.width;
		let boxH = box.height;
		let offsetY = event.offsetY - (box.top - boxTarget.top);
		let offsetX = event.offsetX - (box.left - boxTarget.left);

		if (event.changedTouches) {
			offsetX = event.changedTouches[0].pageX - box.left;
			offsetY = event.changedTouches[0].pageY - box.top;
		}

		position.y = 1 - Math.max(0, Math.min(1, offsetY / boxH));
		position.x = Math.max(0, Math.min(1, offsetX / boxW));
		return position;
	};

	let hasChild = function (parent, child) {
		return parent.contains(child);
	};

	let isTextNode = function (value) {
		return isObject(value) && value.nodeType === 3;
	};

	let clearElemt = function (elt) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		while (elt.firstChild) {
			elt.removeChild(elt.firstChild);
		}

		return elt;
	};

	let normalizeContent = function (content) {
		if (typeof content === 'function') {
			content = content();
		}

		return (Array.isArray(content) ? content : [content]).map(function (value) {
			if (typeof value === 'function') {
				value = value();
			}

			if (isEl(value) || isTextNode(value)) {
				return value;
			}

			if (typeof value === 'string' && /\S/.test(value)) {
				return document.createTextNode(value);
			}
		}).filter(function (value) {
			return value;
		});
	};

	let appendContent = function (elt, content) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		normalizeContent(content).forEach(function (node) {
			return elt.appendChild(node);
		});
		return elt;
	};

	let insertContent = function (elt, content) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		return appendContent(emptyEl(elt), content);
	};

	let isSingleLeftClick = function (event) {
		if (event.button === undefined && event.buttons === undefined) {
			return true;
		}

		if (event.button === 0 && event.buttons === undefined) {
			return true;
		}


		if (event.type === 'mouseup' && event.button === 0 && event.buttons === 0) {
			return true;
		}

		if (event.button !== 0 || event.buttons !== 1) {
			return false;
		}

		return true;
	};

	let copyObj = function (obj, target, overwrite) {
		if (!target) { target = {}; }
		for (let prop in obj) {
			if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)) && Number(prop) !== 0) { target[prop] = obj[prop]; }
		}
		return target;
	};

	let createObj = function (base, props) {
		let inst;
		if (Object.create) {
			inst = Object.create(base);
		} else {
			nothing.prototype = base;
			inst = new nothing();
		}
		if (props) { copyObj(props, inst); }
		return inst
	};

	let select = function (place, data) {
		let _this = this;
		if (!(this instanceof select)) return new select(place, data);
		place = typeof place == 'string' ? getElemt(place) : place instanceof q ? place[0] : place;
		data = data ? copyObj(data) : {}

		if (data.select) {
			this.select = elemt('select');
			for (let i = 0; i < data.select.length; i++) {
				this.option = elemt('option', data.select[i], null, { 'value': i });
				this.select.append(this.option);
			}
		}
		else { this.select = null }
		this.input = EQuery.elemt('input', null, 'e-select-input', { name: data.name });
		this.panel = elemt('div', [this.select, this.input], 'e-select', null, 'margin-bottom: 10px;padding: 5px')
		this.input.on('input', function () {
			let txt = this.value;
			_this.panel.find('.e-select-item>div').each((i, elt) => {
				if (elt.innerHTML.toLowerCase().indexOf(txt.toLowerCase()) === -1) {
					hide(elt);
				} else {
					show(elt);
				}
			});
		});
		append(place, this.panel);
		editSelect(this.panel);
		return this;
	};

	let editSelect = function (place) {
		let elt = place.find('select')[0];
		let input = place.find('input');
		let a = elemt('div', elt.options[0].innerText, 'e-selected');
		let b = elemt('div', null, 'e-select-item e-select-hidden');

		a.text(elt.options[0].innerText);
		input.css(`width: ${place.find('.e-selected').getStyleValue('width')}`);
		for (let i = 0; i < elt.options.length; i++) {
			let c = elemt('div', elt.options[i].innerHTML);
			b.append(c);
		}
		b[0].firstChild.classList.add('e-same-as-selected');
		place.append(a);
		place.append(b);
		a.click(function (event) {
			event.stopPropagation();
			input.val(' ');
			input[0].focus();
			closeAllSelect();
			input.css('z-index: 1');
			this.nextSibling.classList.toggle('e-select-hidden');
			this.classList.toggle('e-select-arrow-active');
			let d = place.find('.e-select-item>div');
			d.click(function (i) {
				input.val(this.innerHTML);
				this.parentElement.parentElement.children[2].innerHTML = this.innerHTML;
				place.find('.e-select-item>div').each((i, elt) => {
					removeClass(elt, 'e-same-as-selected');
				});
				this.classList.add('e-same-as-selected');
			});
		});

		updateSelect(place);
		on(document, 'click', closeAllSelect);
	};

	let updateSelect = function (place) {
		let elt = place.find('select')[0];
		let selects = [];

		for (let i = 0; i < elt.options.length; i++) {
			selects.push(elt.options[i].innerText);
		}

		on(elt, 'click', function () {
			let index = selects.indexOf(this.selectedOptions[0].innerText);
			place.find('.e-selected').text(elt.selectedOptions[0].innerText);
			getElements('.e-select-item>div').each((i, _elt) => {
				removeClass(_elt, 'e-same-as-selected');
				addClass(getElements('.e-select-item>div')[index], 'e-same-as-selected');
			});
		});

		place.find('.e-select-item').click(function () {
			let selected = place.find('.e-same-as-selected')[0];
			elt.value = selects.indexOf(selected.innerText);
		});

		on(window$1, 'load', function () {
			if (window$1.innerHeight > 520) {
				let height = this.innerHeight / 4;
				place.find('.e-select-item').css(`max-height: ${height}px`);
			} else {
				place.find('.e-select-item').css('max-height: 300px');
			}
			place.find('input').css(`width: ${place.find('.e-selected').width()}`);
		});

		on(window$1, ['resize', 'click'], function () {
			if (window$1.innerHeight > 520) {
				let height = this.innerHeight / 4;
				place.find('.e-select-item').css(`max-height: ${height}px`);
			} else {
				place.find('.e-select-item').css('max-height: 300px');
			}
			place.find('input').css(`width: ${place.find('.e-selected').width()}`);
		});

		if (window$1.innerHeight > 520) {
			let height = window$1.innerHeight / 4;
			place.find('.e-select-item').css(`max-height: ${height}px`);
		} else {
			place.find('.e-select-item').css('max-height: 300px');
		}
	}

	let closeAllSelect = function (elt) {
		let arrNo = [];
		let x = getElements('.e-select-item');
		let y = getElements('.e-selected');
		y.each((i, _elt) => {
			if (elt == _elt) {
				arrNo.push(i)
			} else {
				removeClass(_elt, 'e-select-arrow-active');
			}
		});
		x.each((i, _elt) => {
			if (arrNo.indexOf(i)) {
				addClass(_elt, 'e-select-hidden');
			}
		});
		css('.e-select-input', 'z-index: 0');
		show('.e-select-item>div');
	};

	let input = function (place, data) {
		place = typeof place == 'string' ? getElemt(place) : place;
		if (!(this instanceof input)) return new input(place, data);
		if (data.input) {
			this.inputWrapper = elemt('div', null, null, 'max-width: 220px;padding: 5px;');
			for (let i in data.input) {
				let type, placeholder, value;
				let input = data.input[i] ? copyObj(data.input[i]) : {}
				if (input.type) { type = input.type }
				else { type = 'text' }
				if (input.placeholder) { placeholder = input.placeholder }
				else { placeholder = '' }
				if (input.value) { value = input.value }
				else { value = '' }
				this.input = elemt('input', null, 'e-input-root e-input-base-input')
				this.input.type = type;
				this.input.placeholder = placeholder;
				this.input.value = value;
				this.inputContainer = elemt('div', [this.input], 'e-input-base-root', 'position: relative;border-radius: 4px; border: 1px solid #999;background-color: #222');
				append(this.inputWrapper, this.inputContainer)
			}
		} else {
			this.inputWrapper = null;
		}
		append(place, this.inputWrapper);
		return this.inputWrapper
	};

	let table = function (parent, data) {
		parent = typeof parent == 'string' ? getElemt(parent) : parent;
		if (!(this instanceof table)) return new table(parent, data);
		let col = 0, row = 0;
		parent = typeof parent == 'string' ? getElemt(parent) : parent || document.body;
		data = data ? copyObj(data) : {};

		this.row = elemt('tr');
		this.tbody = elemt('tbody', [this.row]);
		this.table = elemt('table', [this.tbody], 'e-table-all');
		append(parent, this.table);

		if (data.col) col = data.col;
		if (data.heading) {
			col = data.heading.length;
			for (let i = 0; i < col; i++) {
				this.heading = elemt('th', data.heading[i]);
				append(this.row, this.heading);
			}
		}

		if (data.content) {
			row = data.content.length / col;
			for (let i = 0; i < row; i++) {
				this.row2 = elemt('tr');
				let cells = data.content[i];
				append(this.tbody, this.row2);
			}
		}
	};

	let setCookie = function (cname, cvalue, exDays, path) {
		let d = new Date();
		d.setTime(d.getTime() + (exDays * 24 * 60 * 60 * 1000));
		let expires = `expires=${d.toUTCString()}`;
		document.cookie = `${cname}=${cvalue};${expires};path=${path ? path : '/'}`;
	};

	let getCookie = function (cname) {
		let name = `${cname}=`;
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	};

	let includeHTML = function (callback) {
		let elemt, file, xHttp;
		elemt = getElements('*');
		elemt.each((i, elt) => {
			file = elt.getAttribute('include-html');
			if (file) {
				xHttp = new XMLHttpRequest();
				xHttp.onreadystatechange = function () {
					if (this.readyState == 4) {
						html(elt, this.responseText);
						if (this.status == 200) { html(elt, this.responseText); }
						if (this.status == 403) { html(elt, 'Access Denied.'); }
						if (this.status == 404) { html(elt, 'Page not found.'); }
						elt.removeAttribute('include-html');
						if (callback) callback();
					}
				}
				xHttp.open('GET', file, true);
				xHttp.send();
				return;
			}
		});
	};

	let getHttp = function (url, callback, onload, onerror) {
		onload = onload || function () { };

		if (url) {
			let xHttp = new window$1.XMLHttpRequest(), response;
			on(xHttp, 'readystatechange', function () {
				if (this.readyState == 4) {
					response = this.responseText;
					if (callback) callback(response);
					return response;
				}
			});
			on(xHttp, 'progress', onload);
			on(xHttp, 'error', onerror);
			xHttp.open('GET', url, true);
			xHttp.send();
		} else {
			log.warn('getHttp need a url to perform it XMLHttpRequest');
		}
	};

	let slideShow = function (elt, ms, func) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		let ss, x = elt;
		ss = {};
		ss.current = 1;
		ss.x = x;
		ss.onDisplayChange = func;
		if (!isNaN(ms) || ms == 0) {
			ss.milliseconds = ms;
		} else {
			ss.milliseconds = 1000;
		}
		ss.start = function () {
			ss.display(ss.current)
			if (ss.onDisplayChange) { ss.onDisplayChange(); }
			if (ss.milliseconds > 0) {
				window.clearTimeout(ss.timeout);
				ss.timeout = window.setTimeout(ss.next, ss.milliseconds);
			}
		};
		ss.next = function () {
			ss.current += 1;
			if (ss.current > ss.x.length) { ss.current = 1; }
			ss.start();
		};
		ss.previous = function () {
			ss.current -= 1;
			if (ss.current < 1) { ss.current = ss.x.length; }
			ss.start();
		};
		ss.display = function (n) {
			for (let i = 0; i < ss.x.length; i++) { css(ss.x[i], 'display: none'); }
			css(ss.x[n - 1], 'display: block');
		}
		ss.start();
		return ss;
	};

	let slideImage = function (elt, ms, func) {
		let ss, x = elt;
		ss = {};
		ss.current = 1;
		ss.x = x;
		ss.ondisplaychange = func;
		if (!isNaN(ms) || ms == 0) {
			ss.milliseconds = ms;
		} else {
			ss.milliseconds = 1000;
		}
		ss.start = function () {
			ss.display(ss.current)
			if (ss.ondisplaychange) { ss.ondisplaychange(); }
			if (ss.milliseconds > 0) {
				window.clearTimeout(ss.timeout);
				ss.timeout = window.setTimeout(ss.next, ss.milliseconds);
			}
		};
		ss.next = function () {
			ss.current += 1;
			if (ss.current > ss.x.length) { ss.current = 1; }
			ss.start();
		};
		ss.previous = function () {
			ss.current -= 1;
			if (ss.current < 1) { ss.current = ss.x.length; }
			ss.start();
		};
		ss.display = function (n) {
			for (let i = 0; i < ss.x.length; i++) { css(ss.x[i], 'display: none'); }
			styleElemt(ss.x[n - 1], 'display: block');
		}
		ss.start();
		return ss;
	};

	let filterHTML = function (elemt, sel, val) {
		let hit;
		elemt = getElements(elemt);
		elemt.each((i, _elemt) => {
			sel = getElements(sel);
			sel.each((j, _sel) => {
				hit = 0;
				if (_sel.innerText.toLowerCase().indexOf(val.toLowerCase) > -1) {
					hit = 1;
				}
				let elt = getElements(`${sel} *`);
				elt.each((b, _elt) => {
					if (_elt.innerText.toLowerCase().indexOf(val.toLowerCase) > -1) {
						hit = 1;
					}
				});
				if (hit == 1) {
					hide(_sel);
				} else {
					show(_sel);
				}
			});
		});
	};

	let sortHTML = function (elemt, sel, val) {
		let cc, y, by, val1, val2;
		elemt = typeof elemt == 'string' ? getElements(elemt) : elemt;
		for (let i = 0; i < elemt.length; i++) {
			for (let a = 0; a < 2; a++) {
				cc = 0;
				y = 1;
				while (y == 1) {
					y = 0;
					sel = typeof sel == 'string' ? elemt[i].querySelectorAll(sel) : sel;
					for (let b = 0; b < sel.length; i++) {
						by = 0;
						if (val) {
							val1 = sel[b].querySelector(val).innerText.toLowerCase();
							val2 = sel[b + 1].querySelector(val).innerText.toLowerCase();
						} else {
							val1 = sel[b].innerText.toLowerCase();
							val2 = sel[b + 1].innerText.toLowerCase();
						}
						if ((j == 0 && (v1 > v2)) || (j == 1 && (v1 < v2))) {
							by = 1;
							break;
						}
					}
					if (by == 1) {
						sel[b].parentNode.insertBefore(sel[b + 1], sel[b]);
						y = 1;
						cc++;
					}
				}
				if (cc > 0) break;
			}
		}
	};

	/**
	 * Get or set the value of a form element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} [val] - Value to set
	 * @returns {string|void} Current value when getting
	 */
	let val = function (elt, val) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (!val) return elt.value;
		else elt.value = val;
	};

	/**
	 * Get or set the innerText of an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} [_text] - Text to set
	 * @returns {string|void} Current text when getting
	 */
	let text = function (elt, _text) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (!_text) return elt.innerText;
		else elt.innerText = _text;
	};

	/**
	 * Get or set the innerHTML of an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string} [html] - HTML to set
	 * @returns {string|void} Current HTML when getting
	 */
	let html = function (elt, html) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (!html) return elt.innerHTML;
		else elt.innerHTML = html;
	};

	/**
	 * Appends content (string, node, or array of nodes) to an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string|Node|Array<Node>} content - Content to append
	 * @returns {void}
	 */
	let append = function (elt, content) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;

		if (arguments.length > 2) append(elt, Array.from(arguments).splice(1));
		else if (typeof content == 'string') elt.appendChild(document.createTextNode(content));
		else if (content) {
			if (content.nodeType) elt.appendChild(content);
			else for (let i = 0; i < content.length; i++) append(elt, content[i]);
		}
	};

	/**
	 * Prepends content to an element.
	 * @param {Element|string} elt - Element or selector
	 * @param {string|Node|Array<Node>} content - Content to prepend
	 * @returns {void}
	 */
	let prepend = function (elt, content) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (typeof content == 'string') elt.insertBefore(document.createTextNode(content), elt.childNodes[0]);
		else if (content) {
			if (content.nodeType) elt.insertBefore(content, elt.childNodes[0]);
			else for (let i = 0; i < content.length; i++) prepend(elt, content[i]);
		}
	};

	let before = function (elt, content) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (typeof content == 'string') elt.parentNode.insertBefore(document.createTextNode(content), elt);
		else if (content) {
			if (content.nodeType) elt.parentNode.insertBefore(content, elt);
			else for (let i = 0; i < content.length; i++) before(elt, content[i]);
		}
	};

	let after = function (elt, content) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (typeof content == 'string') {
			if (elt.nextSibling) elt.parentNode.insertBefore(document.createTextNode(content), elt.nextSibling);
			else elt.parentNode.appendChild(document.createTextNode(content));
		} else if (content) {
			if (content.nodeType) {
				if (elt.nextSibling) elt.parentNode.insertBefore(content, elt.nextSibling);
				else elt.parentNode.appendChild(content);
			} else {
				for (let i = 0; i < content.length; i++) after(elt, content[i]);
			}
		}
	};

	let height = function (elt, val) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (typeof val == 'string') css(elt, `height: ${val}`);
		else if (val) css(elt, `height: ${toCssPx(val)}`);
		else return Number(getStyleValue(elt, 'height').replaceAll('px', ''));
	};

	let width = function (elt, val) {
		elt = typeof elt == 'string' ? getElemt(elt) : elt;
		if (typeof val == 'string') css(elt, `width: ${val}`);
		else if (val) css(elt, `width: ${toCssPx(val)}`);
		else return Number(getStyleValue(elt, 'width').replaceAll('px', ''));
	};

	let contains = /^[^{]+\{\s*\[native \w/.test(document.documentElement.contains) ?
		function (a, b) {
			let adown = a.nodeType === 9 ? a.documentElement : a, bup = b && b.parentNode;
			return a === bup || !!(bup && bup.nodeType === 1 && (
				adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
			));
		} : function (a, b) {
			if (b) {
				while ((b = b.parentNode)) {
					if (b === a) return true;
				}
			}
			return false;
		};

	class SVG {
		constructor() {
			if (!(this instanceof SVG)) { return new SVG(); }
			let _this = this, _svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), _svgHeight, _svgWidth, _minX, _minY, _width, _height;
			_this.domElement = _svg;

			_this.setSize = function (width, height) {
				_svgWidth = width; _svgHeight = height;

				attr(_svg, 'height', _svgHeight);
				attr(_svg, 'width', _svgWidth);
				return _this;
			};

			_this.setViewBox = function (minX, minY, width, height) {
				_minX = minX;
				_minY = minY;
				_width = width;
				_height = height;

				attr(_svg, 'viewBox', `${_minX} ${_minY} ${_width} ${_height}`);
				return _this;
			};

			_this.getSize = function () {
				return {
					width: _svgWidth,
					height: _svgHeight
				};
			};

			_this.clear = function () {
				while (_svg.childNodes.length > 0) {
					_svg.removeChild(_svg.childNodes[0]);
				}
				return _this;
			};

			_this.zoom = function (val1, val2) {
				_width += val1;
				_height += val2;
				attr(_svg, 'viewBox', `${_minX} ${_minY} ${_width} ${_height}`);
				return _this;
			};

			_this.polyline = function (points, fill = '#000', attr) {
				let _polyline = _this.svgElement('polyline');
				_polyline.attr({ 'points': points, fill: fill });
				_polyline.attr(attr);
				_this.append(_polyline);
				return _this;
			}

			_this.line = function (x1, x2, y1, y2, fill = '#000', attr) {
				let _line = _this.svgElement('line');
				_line.attr({ x1: x1, y1: y1, x2: x2, y2: y2, fill: fill })
				_line.attr(attr);
				_this.append(_line);
				return _this;
			}

			_this.path = function (path, fill = '#000', attr) {
				let _path = _this.svgElement('path');
				_path.attr({ 'd': path, fill: fill });
				_path.attr(attr);
				_this.append(_path);
				return _this;
			};

			_this.rect = function (x, y, w, h, fill = '#000', attr) {
				let _rect = _this.svgElement('rect');
				_rect.attr({ x: x, y: y, width: w, height: h, fill: fill });
				_rect.attr(attr);
				_this.append(_rect);
				return _this;
			};

			_this.circle = function (cx, cy, r, fill = '#000', attr) {
				let _circle = _this.svgElement('circle');
				_circle.attr({ cx: cx, cy: cy, r: r, fill: fill });
				_circle.attr(attr);
				_this.append(_circle);
				return _this;
			};

			_this.append = function (child) {
				append(_svg, child);
				return _this;
			};

			_this.hide = function () {
				hide(_svg);
				return _this;
			};

			_this.show = function () {
				show(_svg);
				return _this;
			};

			_this.toggleShow = function () {
				toggleShow(_svg);
				return _this;
			};

			_this.attr = function (attribute, value) {
				attr(_svg, attribute, value);
				return _this;
			};

			_this.addClass = function (className) {
				addClass(_svg, className);
				return _this;
			};

			_this.removeClass = function () {
				removeClass(_svg, ...[arguments])
				return _this;
			}

			_this.removeAttr = function (attribute) {
				removeAttr(_svg, attribute);
				return _this;
			};

			_this.css = function (style) {
				css(_svg, style);
				return _this;
			};

			_this.svgElement = function (tag) {
				let _svgElt = document.createElementNS('http://www.w3.org/2000/svg', tag);
				_svgElt.hide = function () {
					hide(_svgElt);
					return _svgElt;
				};

				_svgElt.show = function () {
					show(_svgElt);
					return _svgElt;
				};

				_svgElt.toggleShow = function () {
					toggleShow(_svgElt);
					return _svgElt;
				};

				_svgElt.attr = function (attribute, value) {
					attr(_svgElt, attribute, value);
					return _svgElt;
				};

				_svgElt.addClass = function (className) {
					addClass(_svgElt, className);
					return _svgElt;
				};

				_svgElt.removeAttr = function (attribute) {
					removeAttr(_svgElt, attribute);
					return _svgElt;
				};

				_svgElt.css = function (style) {
					css(_svgElt, style);
					return _svgElt;
				};
				_svgElt.append = function (child) {
					append(_svgElt, child);
					return _svgElt;
				};
				return _svgElt;
			};

			return this;
		}
	}

	class Canvas {
		constructor() {
			if (!(this instanceof Canvas)) { return new Canvas(); }
			let _canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'), _canvasHeight, _canvasWidth, _pixelRatio = 1, _this = this;
			this.ctx = _canvas.getContext('2d');
			this.domElement = _canvas;
			css(_canvas, 'display: block');

			this.setSize = function (width, height, updateStyle) {
				_canvasWidth = Math.floor(width * _pixelRatio);
				_canvasHeight = Math.floor(height * _pixelRatio);

				_canvas.height = _canvasHeight;
				_canvas.width = _canvasWidth;

				if (updateStyle != false) {
					css(_canvas, `height: ${toCssPx(_canvasHeight)}`);
					css(_canvas, `width: ${toCssPx(_canvasWidth)}`);
				}
				return this;
			};

			this.resize = function (updateStyle) {
				on(window, 'resize', function () {
					_canvas.height = _canvasHeight;
					_canvas.width = _canvasWidth;

					if (updateStyle != false) {
						css(_canvas, `height: ${toCssPx(_canvasHeight)}`);
						css(_canvas, `width: ${toCssPx(_canvasWidth)}`);
					}
				});
				return this;
			};

			this.setPixelRatio = function (val) {
				if (val === undefined) return;
				_pixelRatio = val;
				return this.setSize(_canvasWidth, _canvasHeight, false);
			};

			this.getSize = function () {
				return {
					width: _canvasWidth,
					height: _canvasHeight
				};
			};

			this.getPixelRatio = function () {
				return _pixelRatio;
			};

			this.getContext = function () {
				return this.ctx;
			};

			this.drawImage = function (source, x, y, w, h) {
				this.ctx.drawImage(source, x, y, w, h);
				return this;
			};

			this.dataUrl = function (type, quality) {
				return _canvas.toDataURL(type, quality);
			};

			this.drawCircle = function (x1, y1, r, color = 'black', stroke = 'black', width = 1) {
				this.ctx.beginPath();
				this.ctx.arc(x1, y1, r, 0, Math.PI * 2);
				this.ctx.strokeStyle = stroke;
				this.ctx.fillStyle = color;
				this.ctx.lineWidth = width;
				this.ctx.fill();
				this.ctx.stroke();
				return this;
			}

			this.drawLine = function (x1, y1, x2, y2, stroke = 'black', width = 1) {
				this.ctx.beginPath();
				this.ctx.moveTo(x1, y1);
				this.ctx.lineTo(x2, y2);
				this.ctx.strokeStyle = stroke;
				this.ctx.lineWidth = width;
				this.ctx.stroke();
				return this;
			};

			this.drawBox = function (x, y, width, height, color = 'black', stroke = 'black', strokeWidth = 1) {
				this.ctx.beginPath();
				this.ctx.rect(x, y, width, height);
				if (color) this.ctx.fillStyle = color; this.ctx.fillRect(x, y, width, height);
				if (stroke) this.ctx.lineColor = strokeWidth; this.ctx.strokeStyle = stroke; this.ctx.strokeRect((x - width / 2), (y - height / 2), width, height);
				return this;
			};

			this.fillBox = function (x, y, width, height, color = 'black') {
				this.ctx.beginPath();
				this.ctx.rect(x, y, width, height);
				this.ctx.fillStyle = color;
				this.ctx.fillRect(x, y, width, height);
				return this;
			};

			this.path = function () {
				this.ctx.beginPath();

				return this;
			};

			this.clear = function () {
				this.ctx.clearRect(0, 0, _canvasWidth, _canvasHeight);
				return this;
			};

			this.kill = function () {
				remove(_canvas);
			};
			this.hide = function () {
				hide(_canvas);
			};

			this.show = function () {
				show(_canvas);
			};

			this.toggleShow = function () {
				toggleShow(_canvas);
			};

			this.attr = function (attribute, value) {
				attr(_canvas, attribute, value);
			};

			this.addClass = function (className) {
				addClass(_canvas, className);
			};

			this.removeAttr = function (attribute) {
				removeAttr(_canvas, attribute);
			};

			this.css = function (style) {
				css(_canvas, style);
			};

			return this;
		}
	}

	let Storage = function Storage(name, version = 1) {
		let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
		if (indexedDB === undefined) {
			log.warn('Storage: IndexedDB not available.');
			return {
				init: function () { },
				get: function () { },
				set: function () { },
				put: function () { },
				clear: function () { },
				delete: function () { }
			};
		}
		
		let _dbPromise;
		return {
			init: function (...storeObj) {
				if (_dbPromise) return _dbPromise;
				_dbPromise = new Promise((resolve, reject) => {
					let request = indexedDB.open(name, version);
					request.onupgradeneeded = function (event) {
						let db = event.target.result;

						if (db.objectStoreNames.contains('states') === false) {
							db.createObjectStore('states');
						}
						storeObj.forEach(obj => {
							if (db.objectStoreNames.contains(obj.name) === false) {
								const { name, ...rest } = obj;
								db.createObjectStore(name, rest);
							}
						});
					};
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				});
				return _dbPromise;
			},

			get: async function (storeName = 'states', record = 0) {
				let database = await _dbPromise;
				return new Promise((resolve, reject) => {
					let transaction = database.transaction(storeName, 'readonly');
					let objectStore = transaction.objectStore(storeName);
					let request = objectStore.get(record);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error ?? null);
				});
			},

			set: async function (data) {
				let database = await _dbPromise;
				return new Promise((resolve, reject) => {
					let start = performance.now();
					let transaction = database.transaction(['states'], 'readwrite');
					let objectStore = transaction.objectStore('states');
					let request = objectStore.put(data, 0);
					request.onsuccess = () => {
						log(`Saved state to IndexedDB. ${(performance.now() - start).toFixed(2)}ms`);
						resolve(request.result);
					};
					request.onerror = () => reject(request.error);
				});
			},

			put: async function (storeName, data, record) {
				let database = await _dbPromise;
				return new Promise((resolve, reject) => {
					let start = performance.now();
					let transaction = database.transaction(storeName, 'readwrite');
					let objectStore = transaction.objectStore(storeName);
					let request = objectStore.put(data, record);
					request.onsuccess = () => {
						log(`Saved state to IndexedDB. ${(performance.now() - start).toFixed(2)}ms`);
						resolve(request.result);
					};
					request.onerror = () => reject(request.error);
				});
			},

			clear: async function (storeName = 'states') {
				let database = await _dbPromise;
				return new Promise((resolve, reject) => {
					if (database === undefined)
						return;
					let transaction = database.transaction(storeName, 'readwrite');
					let objectStore = transaction.objectStore(storeName);
					let request = objectStore.clear();
					request.onsuccess = () => {
						resolve(request.result);
						log('Cleared IndexedDB.');
					};
					request.onerror = () => reject(request.error);
				});
			},

			delete: async function (storeName, key) {
				let database = await _dbPromise;
				return new Promise((resolve, reject) => {
					let transaction = database.transaction(storeName, 'readwrite');
					let objectStore = transaction.objectStore(storeName);
					let request = objectStore.put(key);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				});
			}
		};
	};

	let isArrayLike = function (obj) {
		let b = !!obj && 'length' in obj && obj.length,
			c = q.type(obj);
		return c !== 'function' && !(obj != null && obj === obj.window) && (c === 'array' || b === 0 || (typeof b === 'number' && b > 0 && (b - 1) in obj));
	};

	q.add = q.fn.add = function () {
		let options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;

		if (typeof target === 'boolean') {
			deep = target;
			target = arguments[i] || {};
			i++;
		}

		if (typeof target !== 'object' && !q.isFunction(target)) {
			target = {};
		}

		if (i === length) {
			target = this;
			i--;
		}

		for (; i < length; i++) {
			if ((options = arguments[i]) != null) {
				for (name in options) {
					src = target[name];
					copy = options[name];

					if (target === copy) {
						continue;
					}

					if (deep && copy && (q.isPlainObject(copy) || (copyIsArray = q.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && q.isArray(src) ? src : [];
						} else {
							clone = src && q.isPlainObject(src) ? src : {};
						}

						target[name] = q.add(deep, clone, copy);
					} else if (copy !== undefined) {
						target[name] = copy;
					}
				}
			}
		}

		return target;
	};

	q.add({
		isFunction: function (obj) {
			return typeof obj === 'function';
		},
		isArray: Array.isArray,
		isPlainObject: function (obj) {
			return toString.call(obj) === '[object Object]';
		},
		each: function (obj, callback) {
			let length, i = 0;

			if (isArrayLike(obj)) {
				length = obj.length;
				for (; i < length; i++) {
					if (callback.call(obj[i], i, obj[i]) === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (callback.call(obj[i], i, obj[i]) === false) {
						break;
					}
				}
			}

			return obj;
		},
		map: function (elemt, callback) {
			let value, ret = [];

			if (isArrayLike(elemt)) {
				for (let i = 0; i < elemt.length; i++) {
					value = callback(elemt[i], i);
					if (value != null) {
						ret.push(value);
					}
				}
			} else {
				for (i in elemt) {
					value = callback(elemt[i], i);
					if (value != null) {
						ret.push(value);
					}
				}
			}

			return ret;
		},
		type: function (obj) {
			if (obj == null) {
				return `${obj}`;
			}
			return typeof obj === 'object' || typeof obj === 'function' ?
				toString.call(obj) || 'object' :
				typeof obj;
		},
		merge: function (first, second) {
			let i = first.length;

			for (let j = 0; j < +second.length; j++) {
				first[i++] = second[j];
			}

			first.length = i;

			return first;
		},
		contains: function (parent, child) {
			return (parent.ownerDocument || parent) !== document && q.setDoc(parent), contains(parent, child);
		},
		setDoc: function (doc) {

		}
	});

	q.fn.add({
		find: function (selector) {
			let i, c = [], _this = this;
			if (typeof selector != 'string') {
				return this.pushStack(q(selector).filter(function () {
					for (i = 0; i < _this.length; i++) {
						if (q.contains(_this[i], this)) return !0
					}
				}));
			}

			for (i = 0; i < this.length; i++) c.push(...Array.from(this[i].querySelectorAll(selector)));

			return this.pushStack(Array.from(new Set(c)));
		}
	});

	let init = q.fn.init = function (selector, context) {
		context = context || document;
		if (!selector) {
			return this;
		}

		if (typeof selector === 'string') {
			let match = q(context).find(selector);
			Array.prototype.push.apply(this, match);
			return this;
		}

		if (selector.nodeType) {
			this[0] = selector;
			this.length = 1;
			return this;
		}

		if (q.isFunction(selector)) {
			return document.readyState !== 'loading' ? selector(q) : on(document, 'DOMContentLoaded', selector.bind(q));
		}

		return q.makeArray(selector, this);
	};

	init.prototype = q.fn;

	q.fn.ready = function (fn) {
		on(document, 'DOMContentLoaded', fn);
		return this;
	};

	q.makeArray = function (arr, results) {
		let ret = results || [];

		if (arr != null) {
			if (isArrayLike(Object(arr))) {
				q.merge(ret, typeof arr === 'string' ? [arr] : arr);
			} else {
				push.call(ret, arr);
			}
		}

		return ret;
	};

	q.Callbacks = function (options) {
		options = typeof options === 'string' ? (function (opt) { let arr = {}; return q.each(opt.match(/[^\x20\t\r\n\f]+/g) || [], function () { arr[arguments[1]] != 0 }), arr })(options) : q.add({}, options);

		let list = [], queue = [], firing, memory, fired, locked;
		let fire = function () {
			locked = options.once;
			fired = firing = true;
			for (; queue.length; memory = queue.shift()) {
				while (++firingIndex < list.length) {
					if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
						firingIndex = list.length;
						memory = false;
					}
				}
			}
			if (!options.memory) {
				memory = false;
			}
			firing = false;
			if (locked) {
				list = memory ? [] : '';
			}
		};
		let self = {
			add: function () {
				if (list) {
					if (memory && !firing) {
						firingIndex = list.length - 1;
						queue.push(memory);
					}

					(function add(args) {
						q.each(args, function (_, arg) {
							if (q.isFunction(arg)) {
								if (!options.unique || !self.has(arg)) {
									list.push(arg);
								}
							} else if (arg && arg.length && typeof arg !== 'string') {
								add(arg);
							}
						});
					})(arguments);

					if (memory && !firing) {
						fire();
					}
				}
				return this;
			},
			remove: function () {
				q.each(arguments, function (_, arg) {
					let index;
					while ((index = q.inArray(arg, list, index)) > -1) {
						list.splice(index, 1);
						if (index <= firingIndex) {
							firingIndex--;
						}
					}
				});
				return this;
			},
			has: function (fn) {
				return fn ? q.inArray(fn, list) > -1 : list.length > 0;
			},
			empty: function () {
				if (list) {
					list = [];
				}
				return this;
			},
			disable: function () {
				locked = queue = [];
				list = memory = '';
				return this;
			},
			disabled: function () {
				return !list;
			},
			lock: function () {
				locked = queue = [];
				if (!memory && !firing) {
					list = memory = '';
				}
				return this;
			},
			locked: function () {
				return !!locked;
			},
			fireWith: function (context, args) {
				if (!locked) {
					args = args || [];
					args = [context, args.slice ? args.slice() : args];
					queue.push(args);
					if (!firing) {
						fire();
					}
				}
				return this;
			},
			fire: function () {
				self.fireWith(this, arguments);
				return this;
			},
			fired: function () {
				return !!fired;
			}
		};

		return self;
	};

	q.fn.add({
		forEach: function (func, args) {
			args = args || [];
			for (let i = 0; i < this.length; i++) {
				if (this[i].nodeType) {
					for (var _len = args.length, _arg = new Array(_len), _key = 0; _key < _len; _key++) {
						_arg[_key] = args[_key];
					}
					func(...[this[i], ..._arg]);
				}
			}
			return this;
		},
		dragElement: function () { return this.forEach(dragElement, arguments) },
		resize: function () { return this.forEach(resize, arguments) },
		getStyleValue: function (style) { for (let i = 0; i < this.length; i++) return getStyleValue(this[i], style); },
		magnify: function () { return this.forEach(magnify, arguments) },
		remove: function () { return this.forEach(remove, arguments) },
		hide: function () { return this.forEach(hide, arguments) },
		show: function () { return this.forEach(show, arguments) },
		toggleShow: function () { return this.forEach(toggleShow, arguments) },
		hasClass: function (classToCheck) { for (let i = 0; i < this.length; i++) return hasClass(this[i], classToCheck); },
		addClass: function () { return this.forEach(addClass, arguments) },
		removeClass: function () { return this.forEach(removeClass, arguments) },
		toggleClass: function () { return this.forEach(toggleClass, arguments) },
		attr: function () { return this.forEach(attr, arguments) },
		getAttr: function (attribute) { for (let i = 0; i < this.length; i++) return attr(this[i], attribute) },
		removeAttr: function () { return this.forEach(removeAttr, arguments) },
		css: function () { return this.forEach(css, arguments) },
		rmChild: function () { return this.forEach(removeChild, arguments) },
		removeChildren: function () { return this.forEach(removeChildren, arguments) },
		getBoundingClientRect: function () { for (let i = 0; i < this.length; i++) return getBoundingClientRect(this[i]) },
		findPosition: function () { for (let i = 0; i < this.length; i++) return findPosition(this[i]) },
		getPointerPosition: function (event) { for (let i = 0; i < this.length; i++) return getPointerPosition(this[i], event) },
		clearElemt: function () { return this.forEach(clearElemt, arguments) },
		appendContent: function () { return this.forEach(appendContent, arguments) },
		insertContent: function () { return this.forEach(insertContent, arguments) },
		select: function (data) { for (let i = 0; i < this.length; i++) return select(this[i], data) },
		input: function () { return this.forEach(input, arguments) },
		table: function () { return this.forEach(table, arguments) },
		spinner: function () { return this.forEach(spinner, arguments) }
	});

	q.add({
		pickRandom: function (items) { return pickRandom(items) },
		copyObj: function (obj, target, overwrite) { return copyObj(obj, target, overwrite) },
		createObj: function (base, props) { return createObj(base, props) },
		setCookie: function (cname, cvalue, exDays, path) { setCookie(cname, cvalue, exDays, path) },
		getCookie: function (cname) { getCookie(cname) },
		isSingleLeftClick: function () { return isSingleLeftClick() },
		includeHTML: function (cb) { includeHTML(cb) },
		getHttp: function (url, cb) { return getHttp(url, cb) },
		newComment: function (txt, type) { newComment(txt, type) },
		elemt: function (tag, content, className, attributes, style) { return elemt(tag, content, className, attributes, style, this) },
		createLogger: createLogger
	});

	q.fn.add({
		slideShow: function () { return this.forEach(slideShow, arguments) },
		slideImage: function () { return this.forEach(slideImage, arguments) },
		filterHTML: function () { return this.forEach(filterHTML, arguments) },
		sortHTML: function () { return this.forEach(sortHTML, arguments) }
	});

	q.fn.add({
		on: function () { return this.forEach(on, arguments) },
		one: function () { return this.forEach(one, arguments) },
		once: function () { return this.forEach(once, arguments) },
		off: function () { return this.forEach(off, arguments) },
		click: function () { return this.forEach(on, ['click', ...arguments]) },
		dblclick: function () { return this.forEach(on, ['dblclick', ...arguments]) },
		hover: function () { return this.forEach(on, ['hover', ...arguments]) },
		blur: function () { return this.forEach(on, ['blur', ...arguments]) },
		change: function () { return this.forEach(on, ['change', ...arguments]) },
		canplay: function () { return this.forEach(on, ['canplay', ...arguments]) },
		copy: function () { return this.forEach(on, ['copy', ...arguments]) },
		cut: function () { return this.forEach(on, ['cut', ...arguments]) },
		drag: function () { return this.forEach(on, ['drag', ...arguments]) },
		dragend: function () { return this.forEach(on, ['dragend', ...arguments]) },
		dragenter: function () { return this.forEach(on, ['dragenter', ...arguments]) },
		dragleave: function () { return this.forEach(on, ['dragleave', ...arguments]) },
		dragover: function () { return this.forEach(on, ['dragover', ...arguments]) },
		dragstart: function () { return this.forEach(on, ['dragstart', ...arguments]) },
		drop: function () { return this.forEach(on, ['drop', ...arguments]) },
		emptied: function () { return this.forEach(on, ['emptied', ...arguments]) },
		error: function () { return this.forEach(on, ['error', ...arguments]) },
		focus: function () { return this.forEach(on, ['focus', ...arguments]) },
		keypress: function () { return this.forEach(on, ['keypress', ...arguments]) },
		keydown: function () { return this.forEach(on, ['keydown', ...arguments]) },
		keyup: function () { return this.forEach(on, ['keyup', ...arguments]) },
		load: function () { return this.forEach(on, ['load', ...arguments]) },
		mousedown: function () { return this.forEach(on, ['mousedown', ...arguments]) },
		mouseenter: function () { return this.forEach(on, ['mouseenter', ...arguments]) },
		mouseleave: function () { return this.forEach(on, ['mouseleave', ...arguments]) },
		mousemove: function () { return this.forEach(on, ['mousemove', ...arguments]) },
		mouseup: function () { return this.forEach(on, ['mouseup', ...arguments]) },
		mousewheel: function () { return this.forEach(on, ['mousewheel', ...arguments]) },
		paste: function () { return this.forEach(on, ['paste', ...arguments]) },
		reset: function () { return this.forEach(on, ['reset', ...arguments]) },
		resize: function () { return this.forEach(on, ['resize', ...arguments]) },
		scroll: function () { return this.forEach(on, ['scroll', ...arguments]) },
		search: function () { return this.forEach(on, ['search', ...arguments]) },
		submit: function () { return this.forEach(on, ['submit', ...arguments]) },
		touchend: function () { return this.forEach(on, ['touchend', ...arguments]) },
		touchmove: function () { return this.forEach(on, ['touchmove', ...arguments]) },
		touchstart: function () { return this.forEach(on, ['touchstart', ...arguments]) },
	});

	q.fn.add({
		val: function (content) { for (let i = 0; i < this.length; i++) return val(this[i], content) },
		text: function (content) { for (let i = 0; i < this.length; i++) return text(this[i], content) },
		html: function (content) { for (let i = 0; i < this.length; i++) return html(this[i], content) },
		append: function () { return this.forEach(append, arguments) },
		prepend: function () { return this.forEach(prepend, arguments) },
		before: function () { return this.forEach(before, arguments) },
		after: function () { return this.forEach(after, arguments) },
		height: function (value) { for (let i = 0; i < this.length; i++) return height(this[i], value) },
		width: function (value) { for (let i = 0; i < this.length; i++) return width(this[i], value) }
	});

	q.add({
		svg: SVG,
		canvas: Canvas,
		Storage: Storage
	});

	return (window$1.EQuery = q), q;
})));
