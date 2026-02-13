<?php
/*
 * Copyright (C) 2024 Anthony Damhet <a.damhet@progiseize.fr>
 * Copyright (C) 2024       Frédéric France         <frederic.france@free.fr>
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

// Load Dolibarr environment
require '../../../../../../main.inc.php';

/**
 * @var DoliDB      $db
 * @var HookManager $hookmanager
 * @var Translate   $langs
 * @var User        $user
 */

// Protection if external user
if ($user->socid > 0) {
	accessforbidden();
}

// Includes
require_once DOL_DOCUMENT_ROOT . '/admin/tools/ui/class/documentation.class.php';
include_once DOL_DOCUMENT_ROOT.'/core/class/html.formfile.class.php';


// Load documentation translations
$langs->load('uxdocumentation');

//
$formfile = new FormFile($db);
$documentation = new Documentation($db);
$group = 'ExperimentalUx';
$experimentName = 'ExperimentalUxInputFileDropZone';

$experimentAssetsPath = $documentation->baseUrl . '/experimental/experiments/inputfile-dropzone/assets/';
$js = [
	'/includes/ace/src/ace.js',
	'/includes/ace/src/ext-statusbar.js',
	'/includes/ace/src/ext-language_tools.js'
];
$css = [
	$experimentAssetsPath . 'inputfiledropzone.css'
];

// Output html head + body - Param is Title
$documentation->docHeader($langs->trans($experimentName, $group), $js, $css);

// Set view for menu and breadcrumb
$documentation->view = [$group, $experimentName];

// Output sidebar
$documentation->showSidebar(); ?>

<div class="doc-wrapper">

	<?php $documentation->showBreadCrumb(); ?>

	<div class="doc-content-wrapper">

		<h1 class="documentation-title"><?php echo $langs->trans($experimentName); ?></h1>

		<?php $documentation->showSummary(); ?>

		<div class="documentation-section" >
			<h2 class="documentation-title" >Drop Zone for input files (Experimental)</h2>
			<p>
				This experimental feature provides a drop zone for standard input files.<br>
				Currently, it is only available in this documentation and may be integrated into the <code>develop</code> branch of Dolibarr in the future.
			</p>
			<h3>How it works</h3>
			<p>
				Le champ est récupéré via Javascript afin de modifier la structure HTML et de répérer les états drag & drop.
			</p>
			<h3>Expected features</h3>
			<ul>
				<li><b>MAIN_INPUTFILE_DROPZONE:</b> 0=Do not use this feature | 1=Use this feature</li>
				<li><b>MAIN_INPUTFILE_DROPZONE_HEIGHT:</b> 0 or empty: default height 64px | > 0 = Dropzone Height</li>
				<li><b>MAIN_INPUTFILE_DROPZONE_AUTOSUBMIT:</b> 0: Default behaviour | 1: Send file on drop</li>
				<li><b>MAIN_INPUTFILE_DROPZONE_FORCEMULTIPLE:</b> 0: Default behaviour | 1: Add multiple</li>
			</ul>
			<h4>Current behavior</h4>
			<div class="documentation-example">
				<input type="file" class="flat" id="noaddedfile" name="addedfile" value="Upload" />
			</div>
			<p><b>New Behavior</b></p>
			<div class="documentation-example">
				<input type="file" class="flat" id="addedfile" name="addedfile" value="Upload" />
			</div>
			<script>
				document.addEventListener('Dolibarr:Init', function(e) {


					Dolibarr.defineTool('dropZoneFile',  (inputFileSelector, param = {}) =>{

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

							// Wrap input with dropzone
							inputFile.wrap(function() {
								return `<div class="ddfilewrap" style="min-height:${param.dropZoneHeight}px;"></div>`;
							});


							// Set Dropzone message
							let msg = Dolibarr.tools.langs.trans('ExperimentalUxInputFileDropZoneText');
							$('.ddfilewrap').append('<div class="ddfiledropinfos">' + msg + '</div>');

							// Drag & Drop classes
							$('.ddfilewrap').on('dragover',function(e) {
								$(this).addClass('dragged');
							});
							$('.ddfilewrap').on('dragleave',function(e) {
								$(this).removeClass('dragged');
							});

							// Display file name on change
							$('.ddfiledropinfos').append('<div class="ddfileinfo"></div>');
							inputFile.on('change', function(e) {
								let files = this.files;
								let fileInfo = $('.ddfileinfo');
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


			Dolibarr.on('Ready', function(data) {

				// Load langs
				Dolibarr.tools.langs.load('uxdocumentation'); // will use cache but need to load lang in new local

				console.log(Dolibarr.tools.langs.trans('ExperimentalUxInputFileDropZoneText'));
				Dolibarr.tools.dropZoneFile('#addedfile', {
					dropZoneHeight : 324, // should be MAIN_INPUTFILE_DROPZONE_HEIGHT'
					forceMultiple : 1,
					dropZoneAutoSubmit : 0,
					// submitBtn : '#addfile'
				})
			});

			</script>
			<?php
			$lines = array(
				'<?php',
					'// Define params',
					'$dropZoneHeight = 324; // should be MAIN_INPUTFILE_DROPZONE_HEIGHT',
					'$dropZoneAutoSubmit = false; // should be MAIN_INPUTFILE_DROPZONE_AUTOSUBMIT',
					'$forceMultiple = false; // should be MAIN_INPUTFILE_DROPZONE_FORCEMULTIPLE',
				'?>',
				'',
				'<script>',
				'$(document).ready(function() {',
				'	let inputFile = $(\'#addedfile\');',
				'	if (inputFile.length) {',
				'',
				'		// Wrap input with dropzone',
				'		inputFile.wrap(function() {',
				'			return \'<div class="ddfilewrap" style="height:<?php print $dropZoneHeight; ?>px;"></div>\';',
				'		}',
				'',
				'		// Set Dropzone message',
				'		let msg = \'<?php echo $langs->trans(\'ExperimentalUxInputFileDropZoneText\'); ?>\';',
				'		$(\'.ddfilewrap\').append(\'<div class="ddfiledropinfos">\' + msg + \'</div>\');',
				'',
				'		// Drag & Drop classes',
				'		$(\'.ddfilewrap\').on(\'dragover\',function(e) {',
				'			$(this).addClass(\'dragged\');',
				'		});',
				'		$(\'.ddfilewrap\').on(\'dragleave\',function(e) {',
				'			$(this).removeClass(\'dragged\');',
				'		});',
				'',
				'		<?php if ($forceMultiple) { ?>',
				'		// Add multiple attribute if not',
				'		let attrMultipleInput = inputFile.attr(\'multiple\');',
				'		if(typeof attrMultipleInput === \'undefined\' || attrMultipleInput === false) {',
				'			inputFile.prop(\'multiple\', true);',
				'			inputFile.attr(\'name\', inputFile.attr(\'name\') + \'[]\');',
				'		}',
				'		<?php } ?>',
				'',
				'		<?php if ($dropZoneAutoSubmit) { ?>',
				'		let buttonSubmitFile = $(\'#addfile\');',
				'		buttonSubmitFile.removeClass(\'reposition\').hide();',
				'		inputFile.on(\'change\', function(e) {',
				'			setTimeout(function(){',
				'				buttonSubmitFile.click();',
				'			}, 50);',
				'		});',
				'		<?php } ?>',
				'	}',
				'});',
				'</script>',
			);
			echo $documentation->showCode($lines, 'php'); ?>
	</div>

</div>
<?php
// Output close body + html
$documentation->docFooter();
?>
