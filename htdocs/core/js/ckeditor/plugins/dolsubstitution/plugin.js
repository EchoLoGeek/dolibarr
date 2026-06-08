/*
 * Copyright (C) 2026 Dolibarr contributors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * \file    htdocs/core/js/ckeditor/plugins/dolsubstitution/plugin.js
 * \brief   CKEditor 4 plugin to insert Dolibarr substitution variables.
 *
 * The plugin adds a toolbar button ('DolSubstitution') that opens a searchable
 * panel listing the available substitution variables (grouped, with a preview of
 * the value). Clicking an entry inserts either the resolved value or the __KEY__
 * marker, depending on editor.config.dolsubstitution.mode.
 *
 * Data is provided per editor instance through editor.config.dolsubstitution:
 *   {
 *     mode:   'value' | 'key',
 *     list:   { '__KEY__': 'preview/value', ... },
 *     labels: { title, search, empty, groupObject, groupCompany, groupThirdparty, groupUser, groupDate }
 *   }
 */

(function () {
	'use strict';

	// Styles for the toolbar button icon and the dropdown panel.
	// NOTE: these elements live in the MAIN document (toolbar + panel appended to body), not in the
	// editable iframe, so we must NOT use CKEDITOR.addCss() (which targets the iframe contents).
	var DOLSUBSTIT_CSS = (
		'.cke_button__dolsubstitution_icon {' +
		'	background-image: url("data:image/svg+xml;charset=utf-8,' +
		encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="%23333" d="M5.6 1.6C4.3 1.6 3.6 2.3 3.6 3.6v2.1c0 .8-.3 1.1-1.1 1.1H2v1.9h.5c.8 0 1.1.3 1.1 1.1v2.1c0 1.3.7 2 2 2h1V12h-.6c-.5 0-.7-.2-.7-.7V9.1c0-.8-.4-1.3-1-1.5.6-.2 1-.7 1-1.5V4c0-.5.2-.7.7-.7h.6V1.6h-1zM10.4 1.6c1.3 0 2 .7 2 2v2.1c0 .8.3 1.1 1.1 1.1h.5v1.9h-.5c-.8 0-1.1.3-1.1 1.1v2.1c0 1.3-.7 2-2 2h-1V12h.6c.5 0 .7-.2.7-.7V9.1c0-.8.4-1.3 1-1.5-.6-.2-1-.7-1-1.5V4c0-.5-.2-.7-.7-.7h-.6V1.6h1z"/></svg>') +
		'") !important;' +
		'	background-size: 16px 16px !important;' +
		'	background-position: center center !important;' +
		'	background-repeat: no-repeat !important;' +
		'}' +
		'.dolsubstit_panel {' +
		'	position: absolute; z-index: 100000; background: #fff;' +
		'	border: 1px solid #bbb; border-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);' +
		'	width: 360px; max-width: 90vw; font-size: 13px; color: #333;' +
		'}' +
		'.dolsubstit_searchwrap { padding: 8px; border-bottom: 1px solid #eee; }' +
		'.dolsubstit_search { width: 100%; box-sizing: border-box; padding: 5px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 13px; }' +
		'.dolsubstit_list { max-height: 320px; overflow-y: auto; }' +
		'.dolsubstit_group { padding: 6px 10px 2px 10px; font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: .03em; }' +
		'.dolsubstit_item { display: flex; justify-content: space-between; gap: 12px; padding: 5px 10px; cursor: pointer; }' +
		'.dolsubstit_item:hover, .dolsubstit_item.dolsubstit_active { background: #f0f4ff; }' +
		'.dolsubstit_key { color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
		'.dolsubstit_val { color: #2a6ed4; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%; }' +
		'.dolsubstit_empty { padding: 12px 10px; color: #999; font-style: italic; }'
	);

	/**
	 * Inject the plugin stylesheet into the main document head, only once per page.
	 *
	 * @return  {void}
	 */
	function injectStyles() {
		if (CKEDITOR.dolsubstitStylesInjected) {
			return;
		}
		CKEDITOR.dolsubstitStylesInjected = true;
		var style = new CKEDITOR.dom.element('style');
		style.setAttribute('type', 'text/css');
		style.setText(DOLSUBSTIT_CSS);
		CKEDITOR.document.getHead().append(style);
	}

	/**
	 * Return the group code for a substitution key.
	 *
	 * @param   {string}  key   The substitution key, e.g. "__MYCOMPANY_NAME__".
	 * @return  {string}        One of: company, user, thirdparty, date, object.
	 */
	function getGroupForKey(key) {
		if (/^__MYCOMPANY_/.test(key)) {
			return 'company';
		}
		if (/^(__USER_|__SENDEREMAIL_)/.test(key)) {
			return 'user';
		}
		if (/^(__THIRDPARTY_|__CONTACT_|__MEMBER_)/.test(key)) {
			return 'thirdparty';
		}
		if (/^(__DATE_|__NOW_|__DAY|__MONTH|__YEAR|__NEXT_|__PREVIOUS_)/.test(key)) {
			return 'date';
		}
		return 'object';
	}

	CKEDITOR.plugins.add('dolsubstitution', {
		init: function (editor) {
			var cfg = editor.config.dolsubstitution || {};
			var mode = (cfg.mode === 'key') ? 'key' : 'value';
			var list = cfg.list || {};
			var labels = cfg.labels || {};

			injectStyles();

			// Ordered group definitions (code => label).
			var groupOrder = [
				['object', labels.groupObject || 'Object'],
				['thirdparty', labels.groupThirdparty || 'Third party'],
				['company', labels.groupCompany || 'Company'],
				['user', labels.groupUser || 'User'],
				['date', labels.groupDate || 'Date']
			];

			var panel = null;       // The DOM panel element (lazy-built).
			var searchInput = null; // The search <input> element.

			/**
			 * Insert the chosen variable into the editor content.
			 *
			 * @param   {string}  key  The substitution key.
			 * @return  {void}
			 */
			function insertVariable(key) {
				var text = (mode === 'key') ? key : (list[key] !== undefined && list[key] !== null ? String(list[key]) : key);
				editor.focus();
				editor.insertText(text);
				hidePanel();
			}

			/**
			 * Build the grouped list HTML according to the current filter.
			 *
			 * @param   {string}  filter  Lower-cased search string.
			 * @return  {void}
			 */
			function renderList(filter) {
				var listEl = panel.findOne('.dolsubstit_list');
				listEl.setHtml('');
				filter = (filter || '').toLowerCase();

				var buckets = {};
				var k;
				for (k in list) {
					if (!Object.prototype.hasOwnProperty.call(list, k)) {
						continue;
					}
					var val = (list[k] === null || list[k] === undefined) ? '' : String(list[k]);
					if (filter && k.toLowerCase().indexOf(filter) === -1 && val.toLowerCase().indexOf(filter) === -1) {
						continue;
					}
					var g = getGroupForKey(k);
					if (!buckets[g]) {
						buckets[g] = [];
					}
					buckets[g].push(k);
				}

				var html = '';
				var hasContent = false;
				for (var i = 0; i < groupOrder.length; i++) {
					var code = groupOrder[i][0];
					var glabel = groupOrder[i][1];
					if (!buckets[code] || !buckets[code].length) {
						continue;
					}
					hasContent = true;
					html += '<div class="dolsubstit_group">' + CKEDITOR.tools.htmlEncode(glabel) + '</div>';
					for (var j = 0; j < buckets[code].length; j++) {
						var key = buckets[code][j];
						var preview = (list[key] === null || list[key] === undefined) ? '' : String(list[key]);
						html += '<div class="dolsubstit_item" data-key="' + CKEDITOR.tools.htmlEncode(key) + '">'
							+ '<span class="dolsubstit_key">' + CKEDITOR.tools.htmlEncode(key) + '</span>'
							+ '<span class="dolsubstit_val">' + CKEDITOR.tools.htmlEncode(preview) + '</span>'
							+ '</div>';
					}
				}
				if (!hasContent) {
					html = '<div class="dolsubstit_empty">' + CKEDITOR.tools.htmlEncode(labels.empty || 'No variable found') + '</div>';
				}
				listEl.setHtml(html);

				// Attach click handlers on items.
				var items = listEl.find('.dolsubstit_item');
				for (var n = 0; n < items.count(); n++) {
					(function (itemEl) {
						itemEl.on('click', function () {
							insertVariable(itemEl.getAttribute('data-key'));
						});
					})(items.getItem(n));
				}
			}

			/**
			 * Build the panel DOM once and append it to the document body.
			 *
			 * @return  {void}
			 */
			function buildPanel() {
				panel = new CKEDITOR.dom.element('div');
				panel.addClass('dolsubstit_panel');
				panel.setHtml(
					'<div class="dolsubstit_searchwrap"><input type="text" class="dolsubstit_search" placeholder="'
					+ CKEDITOR.tools.htmlEncode(labels.search || 'Search a variable...') + '"></div>'
					+ '<div class="dolsubstit_list"></div>'
				);
				CKEDITOR.document.getBody().append(panel);

				searchInput = panel.findOne('.dolsubstit_search');
				searchInput.on('keyup', function (ev) {
					if (ev.data.getKeystroke() === 27) { // Escape
						hidePanel();
						return;
					}
					renderList(searchInput.getValue());
				});

				// Prevent a click inside the panel from bubbling to the global close handler.
				panel.on('mousedown', function (ev) {
					ev.data.stopPropagation();
				});
			}

			/**
			 * Position the panel just below the toolbar button and show it.
			 *
			 * @return  {void}
			 */
			function showPanel() {
				if (!panel) {
					buildPanel();
				}
				// Locate the button element for this editor instance.
				var btn = null;
				var space = editor.ui.space('top') || editor.ui.space('toolbar');
				if (space) {
					btn = space.findOne('.cke_button__dolsubstitution');
				}
				panel.setStyle('display', 'block');
				if (btn) {
					var rect = btn.getClientRect();
					var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
					var scrollY = window.pageYOffset || document.documentElement.scrollTop;
					panel.setStyle('top', (rect.bottom + scrollY + 2) + 'px');
					panel.setStyle('left', (rect.left + scrollX) + 'px');
				}
				renderList('');
				if (searchInput) {
					searchInput.setValue('');
					searchInput.focus();
				}
			}

			/**
			 * Hide the panel if it is currently visible.
			 *
			 * @return  {void}
			 */
			function hidePanel() {
				if (panel) {
					panel.setStyle('display', 'none');
				}
			}

			/**
			 * Toggle the panel visibility.
			 *
			 * @return  {void}
			 */
			function togglePanel() {
				if (panel && panel.getStyle('display') === 'block') {
					hidePanel();
				} else {
					showPanel();
				}
			}

			editor.addCommand('dolsubstitution', {
				exec: function () {
					togglePanel();
					return true;
				}
			});

			editor.ui.addButton('DolSubstitution', {
				label: labels.title || 'Insert a variable',
				command: 'dolsubstitution',
				toolbar: 'insert,90'
			});

			// Make the button appear in the current toolbar WITHOUT requiring an edit in the theme config.js
			// (which is cached aggressively by browsers). editor.config.toolbar holds the toolbar set name
			// (e.g. 'dolibarr_mailings'); we append our button group to editor.config.toolbar_<name>, which is
			// already merged from the theme config at plugin init time and resolved into the bar afterwards.
			var tbName = editor.config.toolbar;
			if (typeof tbName === 'string' && tbName) {
				var tb = editor.config['toolbar_' + tbName];
				if (CKEDITOR.tools.isArray(tb)) {
					var present = false;
					for (var t = 0; t < tb.length; t++) {
						if (CKEDITOR.tools.isArray(tb[t]) && CKEDITOR.tools.indexOf(tb[t], 'DolSubstitution') !== -1) {
							present = true;
							break;
						}
					}
					if (!present) {
						tb.push(['DolSubstitution']);
					}
				}
			}

			// Close the panel when clicking outside of it and outside of the toolbar button.
			// We do NOT close on editor 'blur', because focusing our own search input blurs the editor.
			CKEDITOR.document.on('mousedown', function (ev) {
				var node = ev.data.getTarget().$;
				while (node) {
					if (node.className && typeof node.className === 'string'
						&& (node.className.indexOf('cke_button__dolsubstitution') !== -1 || node.className.indexOf('dolsubstit_panel') !== -1)) {
						return; // Click on the button (let the toggle command handle it) or inside the panel.
					}
					node = node.parentNode;
				}
				hidePanel();
			});
			editor.on('destroy', function () {
				if (panel) {
					panel.remove();
					panel = null;
				}
			});
		}
	});
})();
