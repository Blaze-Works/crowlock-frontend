import { D, Storage, SVG, fetchWithTimeout, ImageWithFallback, log, wait, fromMeta, dataURLtoFile, isImage, toBlob, handleError, renderError, extractQuery, Notice, Toast, Button } from './utils.js';
import { registerKey } from './impl/messaging.js';

(function (window) {
	const document = window.document;

	if (document == undefined) {
		throw new Error('A document is required to run');
	}

	const userAgent = navigator.userAgent;
	const platform = navigator.platform;

	const edge = /Edge\/(\d+)/.exec(userAgent);
	const presto = /Opera\//.test(userAgent);

	const ios = !edge && /AppleWebKit/.test(userAgent) && /isMobile\/\w+/.test(userAgent);
	const android = /Android/.test(userAgent);

	const mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
	const mac = ios || /Mac/.test(platform);

	tailwind.config = {
		darkMode: 'class',
		theme: {
			extend: {
				transitionTimingFunction: {
					'spring-snappy': 'linear(0, 0.402, 0.733, 0.958, 1.08, 1.124, 1.112, 1.072, 1.028, 0.996, 0.978, 0.973, 0.978, 0.987, 0.996, 1, 1)',
				},
				keyframes: {
					fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
					fadeOut: { '0%': { opacity: 1 }, '100%': { opacity: 0 } },
					fadeUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'none' } },
					orbPulse: { '0%, 100%': { transform: 'scale(1)', opacity: .3 }, '50%': { transform: 'scale(1.25)', opacity: .5 } },
					rotateY: { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(360deg)' } },
					glowPulse: { '0%, 100%': { opacity: .5, transform: 'scale(1)' }, '50%': { opacity: .8, transform: 'scale(1.2)' } },
					rotateIn: { 'from': { scale: 0, transform: 'rotate(-180deg)' } },
					floatUp: { '0%, 100%': { transform: 'translateY(0)', opacity: .3 }, '50%': { transform: 'translateY(-10px)', opacity: 1 } },
					enter: { 'from': { opacity: 0, transform: 'translate3d(0, 0, 0) scale(0.95) rotate(0)' } },
					exit: { 'to': { opacity: 0, transform: 'translate3d(0, 0, 0) scale(0.95) rotate(0)' } },
					open: { 'from': { opacity: 0, height: 0 }, 'to': { opacity: 1, height: 'auto' } },
					close: { 'from': { opacity: 1, height: 'auto' }, 'to': { opacity: 0, height: 0 } },
					toLeft: { 'to': { opacity: 0, transform: 'translate(-20px)' } },
					toRight: { 'to': { opacity: 0, transform: 'translate(20px)' } },
					toDown: { 'to': { opacity: 0, transform: 'translateY(20px)' } },
					toUp: { 'to': { opacity: 0, transform: 'translateY(-20px)' } },
					slideLeft: { 'from': { opacity: 0, transform: 'translate(20px)' } },
					slideRight: { 'from': { opacity: 0, transform: 'translate(-20px)' } },
					slideDown: { 'from': { opacity: 0, transform: 'translateY(-20px)' } },
					slideUp: { 'from': { opacity: 0, transform: 'translateY(20px)' } }
				},
				animation: {
					in: 'enter .15s ease',
					out: 'exit .15s ease',
					open: 'open .4s ease',
					close: 'close .4s ease',
					fadeIn: 'fadeIn .4s ease',
					fadeOut: 'fadeOut .4s ease',
					rotateIn: 'rotateIn .8s linear(0, 0.0008 0.4%, 0.0073 1.19%, 0.0278 2.38%, 0.0719, 0.131 5.55%, 0.2583 8.32%, 0.6392 15.85%, 0.7609 18.62%, 0.8503, 0.9245, 0.9837, 1.0285 28.13%, 1.0644 30.9%, 1.078 32.49%, 1.0889, 1.094, 1.0945 38.43%, 1.0903 40.81%, 1.0808 43.58%, 1.036 53.09%, 1.0183 57.45%, 1.0061 61.41%, 0.9973 65.77%, 0.9924 70.53%, 0.991 76.07%, 0.9996 99.85%)',
					toLeft: 'toLeft .4s ease',
					toRight: 'toRight .4s ease',
					toDown: 'toDown .4s ease',
					toUp: 'toUp .4s ease',
					slideLeft: 'slideLeft .4s ease',
					slideRight: 'slideRight .4s ease',
					slideDown: 'slideDown .4s ease',
					slideUp: 'slideUp .4s ease'
				}
			}
		}
	};

	/**
	 * Adds event listeners for drag-drop, file upload, navigation, and routing.
	 * @param {App} app - The application instance
	 * @returns {void}
	 */
	function addEventListeners(app) {
		const display = app.display;

		display.addBtn.click(() => app.createPostModal.open());
		display.filePicker.change(function () { app.loader.loadFiles(this.files) });

		EQuery(document).click(function (event) {
			if (event.target && (event.target.hasAttribute('data-navigation') || event.target.hasAttribute('data-no-hyperlink'))) {
				event.preventDefault();
				if (event.target.hasAttribute('data-no-hyperlink')) return;
				app.navigateTo(event.target.getAttribute('data-navigation'));
			}
		});

		EQuery(document).dragover(function (event) {
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		}, false);

		EQuery(document).dragenter(function (event) {
			event.preventDefault();
			app.overlay(true);
		}, false);

		EQuery(document).dragend(function (event) {
			event.preventDefault();
			app.overlay(false);
		}, false);

		EQuery(document).dragleave(function (event) {
			event.preventDefault();
			app.overlay(false);
		}, false);

		EQuery(document).drop(function (event) {
			event.preventDefault();
			app.overlay(false);
			if (event.dataTransfer.types[0] === 'text/plain') return;
			if (event.dataTransfer.items) app.loader.loadItemList(event.dataTransfer.items);
			else app.loader.loadFiles(event.dataTransfer.files);
		}, false);

		window.addEventListener('popstate', function (ev) {
			if (app.modals.length > 0) {
				ev.preventDefault();
				app.modals[app.modals.length - 1].close();
				return;
			}
			if (app.currentDrawer !== null) {
				ev.preventDefault();
				app.currentDrawer.close();
				return;
			}
			const state = ev.state || {};
			const path = state.path || window.location.pathname;

			const targetScreen = app.getScreenByPath(path);
			app.currentSegment = path.split('/')[1];
			app.setScreen(targetScreen);

			if (typeof state.idx === 'number') {
				app._historyIndex = state.idx;
			}
		});
	}

	/**
	 * Manages the display UI and layout of the application.
	 */
	class Display {
		/**
		 * Creates the Display instance and builds all UI elements.
		 */
		constructor() {
			const d = this;
			d.error404 = D('div', [
				D('div', [
					D('div', '404', 'text-[303px] max-sm:text-[120px] max-md:text-[150px] max-lg:text-[200px] font-extrabold tracking-tight text-transparent bg-[linear-gradient(90deg,rgba(45,35,95,1)_15%,rgba(143,52,235,1)_50%,rgba(45,35,95,1)_85%)] bg-clip-text', null, '-webkit-text-stroke: #411ec55c 2px;'),
					D('h2', 'Page Not Found', 'text-[51px] max-sm:text-[28px] max-md:text:[36px] pb-2 leading-[1] font-["Urbanist",sans-serif] font-bold text-transparent bg-clip-text bg-[linear-gradient(#f8f8f8_56%,#7670de)]'),
					D('p', 'It seems the page you\'re looking for doesn\'t exist. Lets get you', 'mt-4 text-[15px] leading-[1.8] text-[#a4a7b8] max-w-[430px]'),
					D('p', 'back on track.', 'text-[15px] leading-[1.8] text-[#a4a7b8] max-w-[430px]'),
					D('div', [
						Button('Return to Home', null, { class: 'h-[44px] px-7 rounded-[8px] bg-[#6f4cff] text-white text-[12px] font-semibold border border-[#8b73ff] shadow-[0_8px_25px_rgba(111,76,255,0.45)]', 'data-navigation': './home' })
					], 'flex items-center gap-3 mt-10')
				], 'flex flex-col items-center relative text-center overflow-hidden')
			], 'fixed top-[40%] left-0 right-0 z-50 flex justify-center translate-y-[-50%] gap-4 duration-200 text-gray-400 min-width-[60vw]')
			d.mainContent = D('div', null, 'relative mx-auto flex flex-col min-h-full px-4 pt-6 pb-4', { 'data-slot': 'main' });
			d.addBtn = D('button', [D('div', null, 'absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full animate-ping opacity-20'), SVG.add('w-6 h-6 text-white relative z-10')], 'fixed bottom-28 right-10 z-20 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full shadow-2xl shadow-violet-500/50 flex items-center justify-center group', { tabindex: 0 }, 'transform: none');
			d.loginBtn = D('button', 'Login', 'whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl', { 'data-slot': 'button', 'data-navigation': '/login' });
			d.registerBtn = D('button', 'Register', 'whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl', { 'data-slot': 'button', 'data-navigation': '/register' });
			d.activityBtn = D('button', [SVG.bell('size-4.5'), D('span', null, 'absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F59E0B]')], 'relative grid h-10 w-10 place-items-center rounded-full bg-transparent hover:text-white text-gray-400 [&_span]:data-[has-unread=false]:hidden', { 'data-has-unread': 'false' });
			d.profileBtn = D('button', SVG.profile('absolute top-0 left-0 size-8 transition-colors text-gray-400'), 'relative grid h-11 w-11 place-items-center rounded-full bg-transparent')
			d.nodePos = [
				D('div', null, 'fixed inset-0 bg-gradient-to-br from-violet-950/30 via-black to-black pointer-events-none'),
				D('div', null, 'fixed top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none'),
				D('div', null, 'fixed bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none'),
				D('div', null, 'fixed top-6 right-6 flex items-center gap-4 z-20')
			];
			d.overlay = D('div', null, 'fixed top-0 left-0 min-h-screen w-full bg-black/40 z-20 overflow-hidden', { 'data-slot': 'overlay' });
			d.filePicker = D('input').attr({ type: 'file', hidden: '' });
			d.container = D('div', [
				D('div', [...d.nodePos, D('div', d.mainContent, 'relative data-[has-form]:h-screen min-h-screen h-full transition-all font-["DM_Sans",sans-serif] before:content-[\'\'] data-[gradient-overlay=off]:before:opacity-0 data-[gradient-overlay=linear]:before:opacity-1 data-[gradient-overlay=radial]:before:opacity-1 before:transition-[opacity] before:duration-500 before:absolute before:inset-0 data-[gradient-overlay=linear]:before:bg-[linear-gradient(180deg,_rgba(26,26,46,0)_0%,_rgba(26,26,46,0.8)_20%,_rgba(26,26,46,1)_100%)] data-[gradient-overlay=radial]:before:blur-3xl data-[gradient-overlay=radial]:before:bg-[radial-gradient(circle_at_50%_0%,_rgba(140,120,242,.8)_0%,_rgba(50,46,107,1)_23%,_rgba(29,27,63,.8),_51%,_rgba(26,26,46,0)_69%,_rgba(18,17,40,1)_97%)]', { 'data-gradient-overlay': 'off' })], 'min-h-screen bg-black text-white relative')
			], 'node-0_7_container');
			d.wrapper = D('div', d.filePicker, 'tailwind min-h-screen min-w-screen bg-black text-white select-none');
			d.toastContainer = D('div', null, 'fixed top-0 left-0 right-0 max-h-32 overflow-auto z-50');
		}
	}

	class SplashScreen {
		constructor() {
			this.l = new EQuery.svg();
			this.l.setSize(80, 80).setViewBox(0, 0, 24, 24).addClass('relative z-10 mx-auto').attr({ fill: 'none', stroke: '#8b5cf6', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
			this.l.append(this.l.svgElement('def').append(this.l.svgElement('linearGradient').attr({ id: 'gradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }).append(this.l.svgElement('stop').attr({ offset: '0%', 'stop-color': '#8b5cf6' }), this.l.svgElement('stop').attr({ offset: '100%', 'stop-color': '#c084fc' }))));
			this.l.rect(3, 11, 18, 11, 'none', { rx: 2, ry: 2 }).path('M7 11V7a5 5 0 0 1 10 0v4', 'none').path('M12 2 L14 5 L12 8', 'none', { 'stroke-width': 1.5 }).path('M12 2 L10 5 L12 8', 'none', { 'stroke-width': 1.5 });

			this.wrapper = D('div', [
				D('div', null, 'absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-950 to-black animate-[fadeIn_1s_ease-out]'),
				D('div', null, 'absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl animate-[orbPulse_3s_ease-in-out_infinite]'),
				D('div', null, 'absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl animate-[orbPulse_3s_ease-in-out_infinite_.5s]'),

				D('div', [
					D('div', [
						D('div', [
							D('div', [
								D('div', null, 'absolute inset-0 bg-violet-500 rounded-full blur-xl animate-[glowPulse_2s_linear_infinite]')
							], 'absolute inset-0 flex items-center justify-center'), this.l.domElement
						], 'w-24 h-24 relative animate-[rotateY_2s_ease-in-out_.5s_forwards]')
					], 'relative animate-rotateIn'),

					D('div', [
						D('h1', 'CROWLOCK', 'text-4xl tracking-wider bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent'),
						D('p', 'Where Trading Meets Connection.', 'text-sm text-gray-400 mt-2 tracking-wide animate-[fadeIn_0.8s_ease-out_1.5s_forwards] opacity-0')
					], 'mt-8 text-center animate-[fadeUp_1s_ease-out_1s_forwards] opacity-0'),

					D('div', Array.from({ length: 3 }).map((_, i) => D('div', null, `w-2 h-2 bg-violet-400 rounded-full animate-[floatUp_1s_ease-in-out_infinite_.${i * 2}s]`)), 'mt-12 flex gap-1 animate-[fadeIn_0.5s_ease-out_2s_forwards] opacity-0')
				], 'relative z-10 flex flex-col items-center')
			], 'h-screen w-screen bg-black flex items-center justify-center fixed top-0 left-0 z-50 overflow-hidden');
		}
	}

	/**
	 * Manages file loading and progress tracking.
	 */
	class LoadingManager {
		/**
		 * Creates a LoadingManager instance.
		 * @param {Function} [onLoad] - Callback when all items finish loading
		 * @param {Function} [onProgress] - Callback for progress updates (url, itemsLoaded, itemsTotal)
		 * @param {Function} [onError] - Callback for load errors (url)
		 */
		constructor(onLoad, onProgress, onError) {
			this.isLoading = false;
			this.itemsLoaded = 0;
			this.itemsTotal = 0;
			this.urlModifier = undefined;
			this.handlers = [];

			this.onStart = undefined;
			this.onLoad = onLoad;
			this.onProgress = onProgress;
			this.onError = onError;
		}

		/**
		 * Marks the start of loading an item.
		 * @param {string} url - The URL/identifier of the item being loaded
		 * @returns {void}
		 */
		itemStart(url) {
			this.itemsTotal++;
			if (this.isLoading === false) {
				if (this.onStart !== undefined) {
					this.onStart(url, this.itemsLoaded, this.itemsTotal);
				}
			}
			this.isLoading = true;
		}

		/**
		 * Marks the end of loading an item.
		 * @param {string} url - The URL/identifier of the item that finished loading
		 * @returns {void}
		 */
		itemEnd(url) {
			this.itemsLoaded++;
			if (this.onProgress !== undefined) {
				this.onProgress(url, this.itemsLoaded, this.itemsTotal);
			}
			if (this.itemsLoaded === this.itemsTotal) {
				this.isLoading = false;
				if (this.onLoad !== undefined) {
					this.onLoad();
				}
			}
		}

		/**
		 * Marks an item as having an error.
		 * @param {string} url - The URL/identifier of the item with an error
		 * @returns {void}
		 */
		itemError(url) {
			if (this.onError !== undefined) {
				this.onError(url);
			}
		}

		/**
		 * Resolves a URL using the URL modifier if set.
		 * @param {string} url - The URL to resolve
		 * @returns {string} The resolved URL
		 */
		resolveURL(url) {
			if (this.urlModifier) {
				return this.urlModifier(url);
			}
			return url;
		}

		/**
		 * Sets a URL modifier function for transforming URLs.
		 * @param {Function} transform - Function that transforms a URL
		 * @returns {LoadingManager} This instance (for chaining)
		 */
		setURLModifier(transform) {
			this.urlModifier = transform;
			return this;
		}

		/**
		 * Adds a handler for a specific regex pattern.
		 * @param {RegExp} regex - Pattern to match file names
		 * @param {Function} loader - Handler function for matching files
		 * @returns {LoadingManager} This instance (for chaining)
		 */
		addHandler(regex, loader) {
			this.handlers.push(regex, loader);
			return this;
		}

		/**
		 * Removes a handler by its regex pattern.
		 * @param {RegExp} regex - The pattern to remove
		 * @returns {LoadingManager} This instance (for chaining)
		 */
		removeHandler(regex) {
			const index = this.handlers.indexOf(regex);
			if (index !== -1) {
				this.handlers.splice(index, 2);
			}
			return this;
		}

		/**
		 * Gets the appropriate handler for a file.
		 * @param {string} file - The file name to match
		 * @returns {Function|null} The handler function or null if no match
		 */
		getHandler(file) {
			for (let i = 0, l = this.handlers.length; i < l; i += 2) {
				const regex = this.handlers[i];
				const loader = this.handlers[i + 1];
				if (regex.global)
					regex.lastIndex = 0;
				if (regex.test(file)) {
					return loader;
				}
			}
			return null;
		}
	}

	/**
	 * Handles file loading and reading with FileReader API.
	 */
	class FileLoader {
		/**
		 * Creates a FileLoader instance.
		 * @param {App} app - The application instance
		 */
		constructor(app) {
			this.app = app;
			this.handler = app.fromFile;
		}

		/**
		 * Resets the handler to the default application file handler.
		 * @returns {void}
		 */
		useDefaultHandler() {
			this.handler = this.app.fromFile;
		}

		/**
		 * Sets a custom handler for file reading.
		 * @param {Function} handler - Function to call with (result, filename, extension)
		 * @returns {void}
		 */
		setHandler(handler) {
			this.handler = handler;
		}

		/**
		 * Loads a single file and reads it as a data URL.
		 * @param {File} file - The file to load
		 * @returns {void}
		 */
		loadFile(file) {
			const _this = this;
			let filename = file.name;
			let ext = filename.split('.').pop().toLowerCase();
			let reader = new FileReader();
			reader.onprogress = (event) => {
				let size = `(${Math.floor(event.total / 1000)} KB)`;
				let progress = `${Math.floor((event.loaded / event.total) * 100)}%`;
				log('Loading', filename, size, progress);
			};
			reader.onload = () => {
				this.handler(reader.result, filename.split('.')[0], ext);
			};
			reader.readAsDataURL(file);
		}

		/**
		 * Loads multiple files.
		 * @param {FileList|Array<File>} files - The files to load
		 * @param {Object} [filesMap] - Optional map of file paths to File objects
		 * @returns {void}
		 */
		loadFiles(files, filesMap) {
			if (files.length > 0) {
				filesMap = filesMap || this.createFileMap(files);
				let manager = new LoadingManager();
				manager.setURLModifier(function (url) {
					url = url.replace(/^(\.?\/)/, '');
					let file = filesMap[url];
					if (file) {
						log('Loading: ', url);
						return URL.createObjectURL(file);
					}
					return url;
				});
				for (let i = 0; i < files.length; i++) {
					this.loadFile(files[i]);
				}
			}
		}

		/**
		 * Creates a map of file names to File objects.
		 * @param {FileList|Array<File>} files - The files to map
		 * @returns {Object.<string, File>} Map of file names to File objects
		 */
		createFileMap(files) {
			let map = {};
			for (let i = 0; i < files.length; i++) {
				let file = files[i];
				map[file.name] = file;
			}
			return map;
		}

		/**
		 * Loads files from a drag-drop DataTransferItemList.
		 * @param {DataTransferItemList} items - The items from a drag-drop event
		 * @returns {void}
		 */
		loadItemList(items) {
			let _this = this;
			this.getFilesFromItemList(items, function (files, filesMap) {
				_this.loadFiles(files, filesMap);
			});
		}
		/**
		 * Recursively extracts files from a DataTransferItemList.
		 * @param {DataTransferItemList} items - The items from drag-drop
		 * @param {Function} onDone - Callback with (files, filesMap) when complete
		 * @returns {void}
		 */
		getFilesFromItemList(items, onDone) {
			let itemsCount = 0;
			let itemsTotal = 0;
			let files = [];
			let filesMap = {};

			function onEntryHandled() {
				itemsCount++;
				if (itemsCount === itemsTotal) {
					onDone(files, filesMap);
				}
			}

			function handleEntry(entry) {
				if (entry.isDirectory) {
					let reader = entry.createReader();
					reader.readEntries(function (entries) {
						for (let i = 0; i < entries.length; i++) {
							handleEntry(entries[i]);
						}
						onEntryHandled();
					});
				} else if (entry.isFile) {
					entry.file(function (file) {
						files.push(file);
						filesMap[entry.fullPath.substr(1)] = file;
						onEntryHandled();
					});
				}
				itemsTotal++;
			}

			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				if (item.kind === 'file') {
					handleEntry(item.webkitGetAsEntry());
				}
			}
		}
	}

	/**
	 * Main application controller.
	 */
	class App {
		/**
		 * Creates the App instance and initializes all components.
		 * @param {EQueryCollection} mount - The container element to mount the app into
		 */
		constructor(mount) {
			this.VERSION = '1.0.0';
			this.VERSION_NUMBER = 0;
			this._historyIndex = 0;
			this.currentSegment = 'home';
			this.envType = fromMeta('envType');
			this.data = {};
			this.metadata = { name: 'Crowlock', description: 'Escrow FinTech App', url: window.location.host, icons: ['/static/icon.png'] };

			this.modals = [];
			this.mount = mount;
			this.currentScreen = null;
			this.currentDrawer = null;

			this.storage = Storage;
			this.splashScreen = new SplashScreen();
			this.display = new Display(this);
			this.loader = new FileLoader(this);
			mount.append(this.display.wrapper, this.display.toastContainer);
		}

		async init() {
			this.inNav = {
				'home': this.home,
				'transaction': this.transaction,
				'chat': this.chat,
				'profile': this.profile
			};

			this.screens = {
				...this.inNav,
				welcome: this.welcome,
				'login': this.login,
				'register': this.register,
				'recover': this.recover
			};
			addEventListeners(this);

			Object.assign(app.data, await fetchWithTimeout('/api/additionals'));
			// this.web3Impl.init();

		}

		setScreen(screen, node) {
			if (!screen) {
				this.display.container.find('[data-gradient-overlay]').attr({ 'data-gradient-overlay': 'radial' })
				this.display.mainContent.append(this.display.error404);
				return;
			}

			if (this.currentScreen) this.currentScreen.close();
			this.prevScreen = this.currentScreen;
			this.currentScreen = screen;
			this.currentScreen.init(node);
			!this.currentScreen.isForm && this.display.mainContent.addClass(`max-w-${this.currentScreen.size}xl`);
			this.currentScreen === this.prevScreen && !this.currentScreen.isForm && screen.reload(true);
			this.navigation.setActive(this.currentSegment);
			this.display.mainContent.addClass('min-h-full flex-col px-4 pt-6 pb-4').removeClass('h-full');
			this.display.container.find('[data-gradient-overlay]').removeClass('overflow-hidden').attr({ 'data-gradient-overlay': 'off' }).removeAttr('data-has-form');
			if (this.currentScreen.isForm) {
				this.display.mainContent.addClass('h-full').removeClass('flex-col', 'px-4', 'pt-6', 'pb-4', 'min-h-full');
				this.display.container.find('[data-gradient-overlay]').addClass('overflow-hidden').attr({ 'data-gradient-overlay': 'radial', 'data-has-form': '' });
				this.navigation.hide();
				this.display.nodePos[3].remove();
				this.display.addBtn.remove();
			} else if (this.data && this.data.userdata) {
				this.display.container.prepend(this.display.addBtn);
				this.display.nodePos[3].removeClass('px-4', 'py-2').removeChildren().append(this.display.activityBtn, this.display.profileBtn);
			} else {
				this.display.addBtn.remove();
				this.display.nodePos[3].addClass('px-4 py-2').append(this.display.loginBtn, this.display.registerBtn);
			}
			document.title = this.currentScreen.title || 'Crowlock';
			window.scrollTo(0, 0);
		}

		getScreenByPath(path) {
			const segment = path.replace(/\?.*/, '').split('/')[1] || 'home';
			if (!this.screens[segment]) log.warn(`Path segment: ${segment} is invalid`);
			return this.screens[segment];
		}

		navigateTo(path, replace = false, search = '') {
			if (!replace) this._historyIndex++;

			const state = { path, search, idx: this._historyIndex };
			const method = replace ? 'replaceState' : 'pushState';
			history[method](state, '', path + (search || ''));
			const targetScreen = this.getScreenByPath(path);
			this.display.mainContent.removeChildren();
			this.currentSegment = path.split('/')[1] || 'home';
			this.setScreen(targetScreen, path.split('/')[2]);
		}

		pushState() {
			this._historyIndex++;
			const path = window.location.pathname;
			const state = { path, idx: this._historyIndex }
			history.pushState(state, '', path);
		}

		fromFile(result, filename, ext) {
			this.createPostModal[this.app.currentSegment === 'market' ? 'productImage' : 'postImage'] = dataURLtoFile(result, `${filename}.${ext}`);
			if (!isImage(result)) {
				new Modal(this.app, {
					header: 'Unsupported File type',
					content: { text: 'Upload an image file' },
					btns: { 'Okay': (Modal) => Modal.close() }
				});
				return;
			}

			const blob = toBlob(result);

			if (blob.size > 10485760) {
				new Modal(this.app, {
					header: 'Image too large',
					content: { text: 'Upload an image up to 10MB' },
					btns: { 'Okay': (Modal) => Modal.close() }
				});
				return;
			}

			const src = URL.createObjectURL(blob);
			const img = D('img', null, 'w-full h-full object-cover', { src: src });
			this.createPostModal.open(this.app.currentSegment === 'market');
			this.createPostModal[this.app.currentSegment === 'market' ? 'productDropper' : 'postDropper'].removeChildren().append(img);
		}

		async fromOAuth(token) {
			const idToken = token.credential;
			let prevText;
			if (app.currentScreen.isForm) {
				app.display.mainContent.find('button').addClass('opacity-50 pointer-events-none');
				try { app.currentScreen.googleBtn.before(app.currentScreen.googlePendingBtn).remove() } catch (e) {}
				prevText = app.currentScreen.submitBtn.text();
				app.currentScreen.submitBtn.text('Logging in...');
			} else {}

			try {
				const response = await fetchWithTimeout('/api/user/google-callback', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ idToken })
				}, 6e4);
				response.data.expiresIn = (new Date() / 1000) + Number(response.data.expiresIn);
				app.data = this.data || {};
				app.data.userdata = response.user;
				app.storage.put('authToken', response.data, response.user.uid);
				if (extractQuery().landing !== undefined) {
					const landingPath = new URL(extractQuery().landing).pathname;
					await app.storage.set(app.data);
					app.navigateTo(landingPath, true);
					app.update();
					return;
				}
				app.reload(true);
			} catch (e) {
				Notice(await handleError(e), 'error');
			} finally {
				if (app.currentScreen.isForm) {
					app.currentScreen.googlePendingBtn.before(app.currentScreen.googleBtn).remove();
					app.display.mainContent.find('button').removeClass('opacity-50', 'pointer-events-none');
					app.currentScreen.submitBtn.text(prevText || 'Login');
				} else {}
			}
		}

		async logoutOAuth() {
			const auth2 = gapi.auth2.getAuthInstance();
			await auth2.signOut();
			await this.logout();
			log('Google user signed out.');
		}

		async fromJSON(json) {
			if (!json || typeof json !== 'object' || Object.keys(json).length === 0) {
				this.display.nodePos[3].addClass('px-4 py-2').append(this.display.loginBtn, this.display.registerBtn);
				return;
			}
			this.data = json;
			if (!this.data.userdata) return;
			if (!this.data.userdata.uid) {
				Notice('Invalid saved state. Clearing...', 'warn');
				await wait(2000);
				this.storage.clear();
				this.reload(true);
			}
			if (this.data && this.data.userdata) {
				await this.update();
				if (this.data.userdata.username === undefined || this.data.userdata.username === '') {
					if (location.pathname === '/register/username') return;
					this.navigateTo('/register/username');
					return;
				}
				if (!this.data.userdata.emailVerified) {
					if (location.pathname === '/register/confirm-email') return;
					this.navigateTo('/register/confirm-email');
					return;
				}
				if (!this.data.userdata.avatar == this.data.userdata.avatar === '') {
					if (location.pathname === '/register/avatar') return;
					this.navigateTo('/register/avatar');
					return;
				}
			}
			this.display.nodePos[3].removeClass('px-4', 'py-2').removeChildren().append(this.display.activityBtn, this.display.profileBtn);
			this.display.container.prepend(this.display.addBtn);
		}

		overlay() {
			if (arguments.length !== 0) {
				this.display.wrapper[(arguments[0] ? 'append' : 'rmChild')](this.display.overlay);
			} else {
				const exists = this.display.wrapper.find('[data-slot=overlay]').length !== 0;
				this.display.wrapper[(exists ? 'rmChild' : 'append')](this.display.overlay);
			}
		}

		async reload(toRoot) {
			await this.storage.set(this.data || {});
			if (toRoot) location = '/';
			else location.reload();
		}

		async logout(toRoot = false) {
			this.data = {};
			await this.storage.clear();
			await this.storage.clear('authToken');
			if (toRoot) this.reload(true);
			else this.navigateTo('/login', true);
		}

		async update() {
			try {
				const response = await fetchWithTimeout('/api/user/fetch', {
					method: 'post',
					headers: await this.authHeaders()
				});

				this.data.userdata = response.user;
				this.storage.set(this.data);

				this.display.profileBtn.append(D('div', ImageWithFallback({ src: response.user.avatar, alt: response.user.username }), 'h-full w-full rounded-full overflow-hidden z-10'));
				this.display.activityBtn.attr({ 'data-has-unread': String(response.user.hasUnread) })

				await registerKey(this.data.userdata.uid, await this.authHeaders());
			} catch (err) {
				if (err.status === 401) {
					Notice('Session expired, please login again', 'warn');
					this.data = {};
					this.navigateTo('/login', true);
					return;
				} else if (err === 'timedout') {
					Notice('Timed out, failed to update user info', 'warn');
					return;
				}
				Notice(await handleError(err), 'error');
			}
		}

		async authHeaders() {
			if (!this.data.userdata) {
				this.navigateTo(`/login?landing=${this.currentScreen.href}`, true);
				throw new Error('Not authenticated');
			}
			let { idToken, expiresIn, refreshToken } = await this.storage.get('authToken', this.data.userdata.uid);

			const now = new Date() / 1000;
			if (now > (expiresIn - 300)) {
				log('[auth] Token expired. Refreshing...');

				const newToken = await fetchWithTimeout('/api/user/refresh-tokens', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refreshToken })
				});

				idToken = newToken.id_token;
				expiresIn = now + Number(newToken.expires_in);
				refreshToken = newToken.refresh_token;

				await this.storage.put('authToken', { idToken, expiresIn, refreshToken, uid: this.data.userdata.uid }, this.data.userdata.uid);
			}
			return { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' }
		}
	}

	/**
	 * Initializes the application when the document is ready.
	 */
	EQuery(async function () {
		const mount = EQuery('#container');
		const app = window.app = new App(mount);
		const d = app.display;
		log(`Crowlock v${app.VERSION}`);

		d.wrapper.append(app.splashScreen.wrapper);

		const componentList = {
			active: './components/active.js',
			chat: './components/chat.js',
			create: './components/create.js',
			dispute: './components/dispute.js',
			home: './components/home.js',
			payment: './components/payment.js',
			profile: './components/profile.js',
			review: './components/review.js',
			transaction: './components/transaction.js',
			navigation: './components/navigation.js',
			welcome: './components/welcome.js',
			login: './components/forms/login.js',
			register: './components/forms/register.js',
			recover: './components/forms/recover.js'
		};

		async function loadAppComponents() {
			let cachePath;
			log('Loading app modules');
			try {
				let importPromises;
				const keys = Object.keys(componentList);

				if (app.envType === 'production') {
					const modulesGlob = import.meta.glob(['./components/*.js', './components/forms/*.js']);//*/
					importPromises = keys.map(key => {
						const path = componentList[key];
						cachePath = path;

						return modulesGlob[path]();
					});
				} else importPromises = keys.map(key => { cachePath = componentList[key];return import(cachePath); });

				const modules = await Promise.all(importPromises);

				modules.forEach((module, index) => {
					const key = keys[index];
					cachePath = componentList[key];
					app[key] = new (module.default)(app);
				});

				app.init();
				app.navigation.init();

				log('App components loaded: ', app.inNav);

			} catch (err) {
				log.error('Failed to load components:', err);
				d.container.removeChildren().append(D('div', [
					D('div', [app.splashScreen.l.domElement.cloneNode(true)], 'w-24 h-24 mb-2'),
					D('div', 'Failed to load components:', 'text-red-500 text-md font-[monospace]'), renderError(err),
					D('div', ['Target Component: ', D('strong', cachePath)], 'text-red-500 text-sm font-[monospace]')
				], 'h-screen w-screen bg-black flex flex-col items-center justify-center fixed top-0 left-0 z-50 overflow-hidden'));
				d.wrapper.append(d.container);
				throw new Error('Application halted.');
			} finally {
				app.splashScreen.wrapper.addClass('animate-fadeOut');
				await wait(400);
				app.splashScreen.wrapper.remove();
			}
		}

		await app.storage.init({ name: 'keyPairs', keyPath: 'deviceId' }, { name: 'sessionKeys', keyPath: 'conversationId' }, { name: 'deviceMeta', keyPath: 'uid' }, { name: 'authToken' });
		await loadAppComponents();
		d.wrapper.append(d.container);

		log('Reading from localdb...')
		const state = await app.storage.get();
		app.fromJSON(state);
		app.data.alpha && Toast([SVG.alert('w-5 h-5'), 'This app is still in development, be careful with sensistive information'], 'warn');
		app.storage.set(app.data);

		window.google?.accounts.id.initialize({
			client_id: app.data.OAUTH_CLIENTID || '525979073587-ikftj9rfmo1i7853kj3a3cvm7qrc2mnd.apps.googleusercontent.com',
			callback: app.fromOAuth,
			ux_mode: 'popup',
			use_fedcm_for_prompt: false
		});

		// initialize history index and state
		app._historyIndex = app._historyIndex || 0;
		history.replaceState({ path: window.location.pathname, search: window.location.search, idx: app._historyIndex }, '', window.location.pathname + window.location.search);
		if (window.location.pathname !== '/') {
			app.navigateTo(window.location.pathname, false, window.location.search);
		} else {
			app.navigateTo(app.data.userdata ? '/home' : '/welcome', true);
		}
	});

	if ('serviceWorker' in navigator) {
		try {
			navigator.serviceWorker.register('/sw.js');
		} catch (error) {
			log.error(error);
		}
	} else log.warn('ServiceWorker not supported');
})(window);
