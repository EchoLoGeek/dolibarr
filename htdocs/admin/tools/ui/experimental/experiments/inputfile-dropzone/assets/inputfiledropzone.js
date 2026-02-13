$( document ).ready(function() {

	let inputFile = $('#addedfile');

	// Si champ input file
	if (inputFile.length) {

		let buttonSubmitFile = $('#addfile');
		buttonSubmitFile.removeClass('reposition').hide();

		// Wrap input with dropzone
		inputFile.wrap(function(){
			 return '<div class="ddfilewrap"></div>';
		});

		// Add multiple attribute if not
		var attrMultipleInput = inputFile.attr('multiple');
		if(typeof attrMultipleInput === 'undefined' || attrMultipleInput === false) {
			inputFile.prop('multiple', true);
			inputFile.attr('name', inputFile.attr('name') + '[]');
		}

		let msg = 'Drop items here or <b>Browse files</b>';
		if (document.documentElement.lang == 'fr') {
			msg = 'Déplacez vos fichiers ici ou <b>cliquez ici pour choisir des fichiers</b>';
		}

		// Set Dropzone message
		$('.ddfilewrap').append('<div class="ddfiledropinfos">'+msg+'</div>');

		jQuery('.ddfilewrap').on('dragover',function(e){ jQuery(this).addClass('dragged'); });
		jQuery('.ddfilewrap').on('dragleave',function(e){ jQuery(this).removeClass('dragged'); });

		inputFile.on('change', function(e) {
			setTimeout(function(){
				buttonSubmitFile.click();
			}, 50);
		});
	}
});