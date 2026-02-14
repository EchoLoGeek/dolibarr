
document.addEventListener('Dolibarr:Init', function(e) {


	Dolibarr.defineTool('dropZoneFile', async (inputFileSelector, param = {}) =>{

		await Dolibarr.tools.langs.load('uxdocumentation'); // will use cache but need to load lang in new local

		let inputFile = $(inputFileSelector);
		if(inputFile.length == 0) {
			return;
		}

		const defaultParams = {
			dropZoneHeight : null,
			forceMultiple : 1,
			dropZoneAutoSubmit : 0,
			submitBtnSelector : false
		}

		param = { ...defaultParams, ...param };

		// TODO vérifier que le param.submitBtnSelector est bien un id de type #xxxxxxxx si il est différent de false

		if (inputFile.length) {

			inputFile.addClass('dropzone-input-file');

			// Wrap input with dropzone
			inputFile.wrap(function() {
				return `<div class="ddfilewrap" style="min-height:${param.dropZoneHeight}px;"></div>`;
			});

			// Set Dropzone message
			let msg = Dolibarr.tools.langs.trans('ExperimentalUxInputFileDropZoneText');
			let ddfilewrap = inputFile.parent('.ddfilewrap');
			ddfilewrap.append('<div class="ddfiledropinfos">' + msg + '</div>');

			// Drag & Drop classes
			ddfilewrap.on('dragover',function(e) {
				$(this).addClass('dragged');
			});
			ddfilewrap.on('dragleave',function(e) {
				$(this).removeClass('dragged');
			});

			// Display file name on change
			ddfilewrap.find('.ddfiledropinfos').append('<div class="ddfileinfo"></div>');
			inputFile.on('change', function(e) {
				let files = this.files;
				let fileInfo = ddfilewrap.find('.ddfileinfo');
				if (files.length > 0) {
					let names = [];
					for (let i = 0; i < files.length; i++) {
						names.push(files[i].name);
					}
					let langMsg = Dolibarr.tools.langs.trans('Files');
					let filequeue = `<b>${langMsg}:</b><br>` + names.join('<br>');
					fileInfo.html(filequeue).show();
				} else {
					fileInfo.text('').hide();
				}
			});

			if (param.forceMultiple) {
				// Add multiple attribute if not
				let attrMultipleInput = inputFile.attr('multiple');
				if(typeof attrMultipleInput === 'undefined' || attrMultipleInput === false) {
					inputFile.prop('multiple', true);
					inputFile.attr('name', inputFile.attr('name') + '[]');
				}
			}

			if (param.dropZoneAutoSubmit) {
				if(param.submitBtnSelector) {
					let buttonSubmitFile = $(param.submitBtnSelector);
					buttonSubmitFile.removeClass('reposition').hide();
					inputFile.on('change', function(e) {
						setTimeout(function() {
							buttonSubmitFile.click();
						}, 50);
					});
				}
				else{
					// TODO : submit le form
				}
			}
		}
	});
});
