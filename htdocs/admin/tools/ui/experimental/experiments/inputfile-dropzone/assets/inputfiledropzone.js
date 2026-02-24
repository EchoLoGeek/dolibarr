document.addEventListener('Dolibarr:Init', function () {

	Dolibarr.defineTool('dropZoneFile', async (inputFileSelector, param = {}) => {

		// --- Load language for messages ---
		await Dolibarr.tools.langs.load('uxdocumentation');

		// --- Default parameters ---
		const defaultParams = {
			dropZoneHeight: null,          // Min height of the dropzone
			dropZoneAutoSubmit: 0,         // 0 = no auto submit, 1 = submit after change
			submitBtnSelector: false,      // Submit button selector if any

			maxFileSize: null,             // Maximum file size in bytes (e.g., 5242880 for 5MB)
			allowedTypes: null,            // Array of MIME types or extensions (['image/png','.jpg'])
			showMaxFileSize: true,         // Show max file size info in dropzone
			showAllowedTypes: true,        // Show allowed types info in dropzone
			showImagePreview: true,         // Show image preview

			showDeleteBtn : true
		};

		// --- Merge params ---
		param = { ...defaultParams, ...param };

		// ----------------------
		// Resolve input elements
		// ----------------------
		let inputElements = [];
		if (typeof inputFileSelector === 'string') {
			inputElements = document.querySelectorAll(inputFileSelector);
		} else if (inputFileSelector instanceof Element) {
			inputElements = [inputFileSelector];
		} else if (inputFileSelector instanceof NodeList || Array.isArray(inputFileSelector)) {
			inputElements = inputFileSelector;
		} else {
			console.warn('Dolibarr tool dropZoneFile: invalid selector');
			return;
		}
		if (!inputElements.length) return;

		// --------------------------------
		// Validation for submitBtnSelector
		// --------------------------------
		let submitButton = null;
		if (param.submitBtnSelector !== false) {
			if (typeof param.submitBtnSelector !== 'string' || !param.submitBtnSelector.startsWith('#')) {
				console.warn('Dolibarr tool dropZoneFile: submitBtnSelector must be an id starting with #');
				return;
			}
			submitButton = document.querySelector(param.submitBtnSelector);
			if (!submitButton) {
				console.warn('Dolibarr tool dropZoneFile: submit button not found');
				return;
			}
		}

		// -----------------------
		// Process each input file
		// -----------------------
		inputElements.forEach(inputFile => {

			// --- Read multiple and accept directly from input ---
			param.multiple = inputFile.hasAttribute('multiple');

			if (!param.allowedTypes) {
				const acceptAttr = inputFile.getAttribute('accept');
				param.allowedTypes = acceptAttr ? acceptAttr.split(',').map(a => a.trim()) : null;
			}

			// --- Validate element ---
			if (!(inputFile instanceof HTMLInputElement) || inputFile.type !== 'file') {
				console.warn('Dolibarr tool dropZoneFile: element is not an input type="file"');
				return;
			}

			inputFile.classList.add('dropzone-input-file');

			// --- Wrap the input ---
			const wrapper = document.createElement('div');
			wrapper.className = 'ddfilewrap';
			if (param.dropZoneHeight !== null) wrapper.style.minHeight = `${param.dropZoneHeight}px`;
			inputFile.parentNode.insertBefore(wrapper, inputFile);
			wrapper.appendChild(inputFile);

			// --- Message dropzone ---
			const msg = Dolibarr.tools.langs.trans(param.multiple ? 'ExperimentalUxInputFilesDropZoneText' : 'ExperimentalUxInputFileDropZoneText');
			const infoContainer = document.createElement('div');
			infoContainer.className = 'ddfiledropinfos';
			const msgDiv = document.createElement('div');
			msgDiv.className = 'ddfiledropmsg';
			msgDiv.innerHTML = msg;
			infoContainer.appendChild(msgDiv);

			// --- Constraints display ---
			const constraints = [];
			if (param.maxFileSize && param.showMaxFileSize) {
				const sizeMB = (param.maxFileSize / 1024 / 1024).toFixed(2);
				constraints.push(Dolibarr.tools.langs.trans('MaxFileSize') + ' : ' + sizeMB + ' MB');
			}
			if (param.allowedTypes && param.showAllowedTypes) {
				constraints.push(Dolibarr.tools.langs.trans('Allowed') + ' : ' + param.allowedTypes.join(', '));
			}
			if (constraints.length) {
				const constraintDiv = document.createElement('div');
				constraintDiv.className = 'ddfileconstraints';
				constraintDiv.style.fontSize = '12px';
				constraintDiv.style.marginTop = '8px';
				constraintDiv.innerHTML = constraints.join('<br>');
				infoContainer.appendChild(constraintDiv);
			}

			// --- File info display ---
			const fileInfo = document.createElement('div');
			fileInfo.className = 'ddfileinfo';
			infoContainer.appendChild(fileInfo);

			wrapper.appendChild(infoContainer);

			// ---------------------------
			// Drag events
			// ---------------------------
			wrapper.addEventListener('dragover', function (e) {
				e.preventDefault();
				wrapper.classList.add('dragged');
			});

			wrapper.addEventListener('dragleave', function () {
				wrapper.classList.remove('dragged');
			});

			wrapper.addEventListener('drop', function (e) {
				e.preventDefault();
				wrapper.classList.remove('dragged');
				if (e.dataTransfer.files.length) {
					const dt = new DataTransfer();
					Array.from(inputFile.files).forEach(f => dt.items.add(f));
					Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
					inputFile.files = dt.files;
					inputFile.dispatchEvent(new Event('change'));
				}
			});

			// ---------------------------
			// Display files and validate
			// ---------------------------
			inputFile.addEventListener('change', function () {

				const files = inputFile.files;
				const errors = [];
				const dt = new DataTransfer(); // To store valid files
				fileInfo.innerHTML = '';

				if (!files || !files.length) return;

				Array.from(files).forEach(file => {

					let valid = true;

					// --- Size validation ---
					if (param.maxFileSize && file.size > param.maxFileSize) {
						const msg = Dolibarr.tools.langs.trans('DropZoneFileExceedsMaxSize', file.name);
						errors.push(msg);
						Dolibarr.tools.setEventMessage(msg, 'errors');
						valid = false;
					}

					// --- Type validation ---
					if (param.allowedTypes && Array.isArray(param.allowedTypes)) {
						const typeOk = param.allowedTypes.some(t => t.startsWith('.') ? file.name.toLowerCase().endsWith(t.toLowerCase()) : file.type === t);
						if (!typeOk) {
							const msg = Dolibarr.tools.langs.trans('InvalidFileType', file.name);
							errors.push(msg);
							Dolibarr.tools.setEventMessage(msg, 'errors');
							valid = false;
						}
					}

					if (!valid) return;

					dt.items.add(file);
					fileInfo.style.display = 'block';

					// --- File size ---
					const sizeFmt = file.size > 1024 * 1024
						? (file.size / 1024 / 1024).toFixed(2) + ' MB'
						: (file.size / 1024).toFixed(1) + ' KB';

					// --- File row: thumbnail | name + size | delete ---
					const fileRow = document.createElement('div');
					fileRow.className = 'ddfile-row';

					// Thumbnail
					const thumb = document.createElement('div');
					thumb.className = 'ddfile-thumb';

					// Meta (name + size)
					const meta = document.createElement('div');
					meta.className = 'ddfile-meta';
					meta.innerHTML = `<span class="ddfile-name">${file.name}</span><span class="ddfile-size">${sizeFmt}</span>`;

					fileRow.appendChild(thumb);
					fileRow.appendChild(meta);

					if (param.showDeleteBtn) {
						const removeBtn = document.createElement('button');
						removeBtn.type = 'button';
						removeBtn.innerHTML = '<i class="fas fa-times em092"></i>';
						removeBtn.addEventListener('click', (e) => {
							e.preventDefault();
							e.stopPropagation();
							fileInfo.removeChild(fileRow);
							updateInputFiles();
						});
						fileRow.appendChild(removeBtn);
					}

					fileInfo.appendChild(fileRow);

					// --- Image preview in thumbnail ---
					if (param.showImagePreview && file.type.startsWith('image/')) {
						const reader = new FileReader();
						reader.onload = function(e) {
							thumb.style.backgroundImage = `url(${e.target.result})`;
						};
						reader.readAsDataURL(file);
					}


				});

				// --- Update inputFile.files after removing ---
				function updateInputFiles() {
					const remainingFiles = [];
					const fileRows = fileInfo.querySelectorAll('.ddfile-row .ddfile-name');
					fileRows.forEach(span => {
						const name = span.textContent;
						Array.from(dt.files).forEach(f => { if (f.name === name) remainingFiles.push(f); });
					});
					const newDT = new DataTransfer();
					remainingFiles.forEach(f => newDT.items.add(f));
					inputFile.files = newDT.files;
				}

				// --- Show errors in dropzone ---
				if (errors.length) {
					fileInfo.innerHTML = '<div class="ddfile-error">' + errors.join('<br>') + '</div>';
					fileInfo.style.display = 'block';
				}

				// --- Autosubmit ---
				if (param.dropZoneAutoSubmit && inputFile.files.length) {
					setTimeout(() => {
						if (submitButton) { submitButton.click(); return; }
						const form = inputFile.closest('form');
						if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
					}, 50);
				}

			});

			// -------------------
			// Multiple management
			// -------------------
			if (param.multiple) {
				const currentName = inputFile.getAttribute('name');
				if (currentName && !currentName.endsWith('[]')) inputFile.setAttribute('name', currentName + '[]');
			}

			// ------------------------------------
			// Hide button if autosubmit is enabled
			// ------------------------------------
			if (param.dropZoneAutoSubmit && submitButton) {
				submitButton.classList.remove('reposition');
				submitButton.style.display = 'none';
			}

		}); // end foreach inputFile
	}); // end defineTool
}); // end event listener
