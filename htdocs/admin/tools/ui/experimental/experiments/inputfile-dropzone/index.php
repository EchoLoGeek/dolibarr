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
	'/includes/ace/src/ext-language_tools.js',
	$experimentAssetsPath . 'inputfiledropzone.js'
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
				<li><b>MAIN_INPUTFILE_DROPZONE_HEIGHT:</b> 0 or empty: default height 64px | > 0 = Dropzone Height</li>
				<li><b>MAIN_INPUTFILE_DROPZONE_AUTOSUBMIT:</b> 0: Default behaviour | 1: Send file on drop</li>
			</ul>
			<h4>Current behavior</h4>
			<div class="documentation-example">
				<input type="file" class="flat" id="noaddedfile" name="addedfile" value="Upload"  />
			</div>
			<p><b>New Behavior : Default values</b></p>
			<div class="documentation-example">
				<input type="file" class="flat" id="addedfile" name="addedfile" value="Upload"  accept=".jpg,.png',.pdf" multiple />
			</div>
			<p><b>New Behavior : Overridden values</b></p>
			<div class="documentation-example">
				<input type="file" class="flat" id="addedfile-override" name="addedfile" value="Upload" />
			</div>
			<script>

				Dolibarr.on('Ready', function() {
					// New Behavior : Default values
					Dolibarr.tools.dropZoneFile('#addedfile');

					// New Behavior : Overridden values
					Dolibarr.tools.dropZoneFile('#addedfile-override', {
						dropZoneHeight : 324, // should be MAIN_INPUTFILE_DROPZONE_HEIGHT'
						dropZoneAutoSubmit : 0,
						// submitBtn : '#addfile'
						maxFileSize: 5 * 1024 * 1024,   // 5 MB max
						allowedTypes: ['.jpg', '.png'],// , '.pdf' // only these extensions
						showMaxFileSize: true,          // show max size info in dropzone
						showAllowedTypes: true          // show allowed types info
					})
				});

			</script>
			<?php
			$lines = array(

				'',
				'<script>',
				'Dolibarr.on(\'Ready\', function() {',
				'	// New Behavior : Default values',
				'	Dolibarr.tools.dropZoneFile(\'#addedfile\'); ',
				'',
				'	// New Behavior : Override values',
				'	Dolibarr.tools.dropZoneFile(\'#addedfile-override\', {',
				'		dropZoneHeight : 324, // should be MAIN_INPUTFILE_DROPZONE_HEIGHT',
				'		dropZoneAutoSubmit : 0, // should be MAIN_INPUTFILE_DROPZONE_AUTOSUBMIT, default 0',
				'		// submitBtn : \'#addfile\' // Default false',
				'	});',
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
