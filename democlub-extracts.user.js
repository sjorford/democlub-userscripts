// ==UserScript==
// @name           Democracy Club extracts
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.11.28.2
// @match          https://candidates.democracyclub.org.uk/help/api
// @grant          GM_xmlhttpRequest
// @connect        raw.githubusercontent.com
// @require        https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/chosen/1.6.2/chosen.jquery.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.4/papaparse.min.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// Global variables
var pageNo = 1, maxPageNo = 1;
var sortColumn = -1, sortOrder = 1;
var currentExtract, currentTemplate, currentSet, currentIndex; // TODO: singletonize this
var tableColumns = {};
var maxTableRows = 100;
var allCandidatesUrl = '/media/candidates-all.csv';
var electionMappings = {};

// Styles
$('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chosen/1.6.2/chosen.css">').appendTo('head');
$(`<style>
	
	#sjo-api-header {margin: 1rem;}
	.sjo-api-wrapper {margin-top: 0.5rem;}
	.sjo-api-option-extract {background-color: white; margin-right: 0.5rem; border: 1px solid black; padding: 1px 3px;}
	.sjo-api-option-extract-selected {background-color: #77f; color: white;}
	#sjo-api-select-extract {width: 30rem;}
	#sjo-api-select-template {width: 15rem;}
	#sjo-api-status {font-style: italic; margin-right: 1rem;}
	#sjo-api-error {font-weight: bold; color: red;}
	#sjo-api-button-truncate {margin-right: 1rem;}
	.sjo-api-disabled {color: #bbb; pointer-events:none;}
	.sjo-api-paging-current {color: black; pointer-events:none;}
	
	#sjo-api-table {margin: 0.5rem 0;}
	#sjo-api-table th, #sjo-api-table td, #sjo-api-table-dupes th, #sjo-api-table-dupes td {padding: 0.25rem; font-size: 0.75rem !important;}
	#sjo-api-table th {user-select: none; -moz-user-select: none; text-align: center; background-repeat: no-repeat; background-position: center right;}
	#sjo-api-table th.sjo-api-th-sort-up {background-image:url(//en.wikipedia.org/w/resources/src/jquery/images/sort_up.png);}
	#sjo-api-table th.sjo-api-th-sort-down {background-image:url(//en.wikipedia.org/w/resources/src/jquery/images/sort_down.png);}
	
	.sjo-api-col				{width: 1.5em;	min-width: 1.5em;}
	.sjo-api-col-id				{width: 3em;	min-width: 3em;}
	.sjo-api-col-name			{width: 12em;	min-width: 12em;}
	.sjo-api-col-election_date	{width: 5em;	min-width: 5em;}
	.sjo-api-col-_country		{width: 2em;	min-width: 2em;}
	.sjo-api-col-_election_area	{width: 12em;	min-width: 12em;}
	.sjo-api-col-_election_name	{width: 12em;	min-width: 12em;}
	.sjo-api-col-_post_label		{width: 12em;	min-width: 12em;}
	.sjo-api-col-party_id		{width: 5em;	min-width: 5em;}
	.sjo-api-col-party_name		{width: 12em;	min-width: 12em;}
	.sjo-api-col-birth_date		{width: 5em;	min-width: 5em;}
	.sjo-api-col-birth_date		{width: 5em;	min-width: 5em;}
	.sjo-api-col-age			{width: 3em;	min-width: 3em;}
	
	#sjo-api-row-filter td {font-weight: normal; vertical-align: middle;}
	#sjo-api-row-filter ul {font-size: 0.75rem !important;}
	.sjo-api-filter-checkbox {margin: 0 !important;}
	.sjo-api-filter {min-width: 4rem; max-width: 20rem;}
	#sjo-api-row-filter .chosen-results .sjo-api-filter-unavailable {color: #ccc;}
	
	.sjo-api-row-elected {background-color: #fbf2af !important;}
	#sjo-api-table td.sjo-api-cell-icon {font-size: 1rem !important; text-align: center;}
	td.sjo-api-invalid {background-color: #ffd4d4 !important;}
	#sjo-api-table.sjo-api-invalidonly tbody tr {display: none;}
	#sjo-api-table.sjo-api-invalidonly tbody tr.sjo-api-invalid {display: table-row;}
	
	.sjo-api-dupes-first {border-top: 1px black solid;}
	.sjo-api-dupes-verymuch {background-color: bisque !important;}
	#sjo-api-button-help {margin-top: 0.5rem;}
	
	#sjo-api-textarea-raw {min-height: 10em;}
	
</style>`).appendTo('head');

// Validation functions
var isValid = {
	'name':		(val, cand) => val.match(/^[A-ZÓ]/) && val.match(/^[-.' a-zàáâçèéëíòóôöüŷ]+$/i) && !val.match(/[A-Z]{2,}/) && !val.match(/Mc[^A-Z]/),
	'email':	(val, cand) => true || !val.match(/\.gov\.uk$/),
	'fb': 		(val, cand) => val.match(/^https?:\/\/((www|en-gb)\.)?facebook\.com\//),
	'wp': 		(val, cand) => val.match(/^https?:\/\/en\.wikipedia\.org\//),
	'li': 		(val, cand) => val.match(/^https?:\/\/((uk|www)\.)?linkedin\.com\//),
	'hp': 		(val, cand) => !isValid.fb(val) && !isValid.wp(val) && !isValid.li(val),
	'ppc': 		(val, cand) => !isValid.fb(val) && !isValid.wp(val) && !isValid.li(val),
	'gender': 	(val, cand) => cand._gender !== '?',
	'party': 	(val, cand) => !((cand.party_id == 'party:130' && cand._country != 'SC') || (cand.party_id == 'party:63' && cand._country == 'SC')),
};

// Available fields
var dataFields = {};

// Download buttons
var buttonSpecs = {};
var defaultButton = 'local1819';

// Fields to be displayed
var templates = {};

// Other data
var parties = {};

// Load configuration
var configList = [
	{
		url: 'https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/data/extract-fields.json',
		callback: response => dataFields = response
	},
	{
		url: 'https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/data/extract-selections.json',
		callback: response => buttonSpecs = response
	},
	{
		url: 'https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/data/extract-templates.json',
		callback: response => templates = response
	},
	{
		url: 'https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/data/parties.json',
		callback: response => parties = response
	},
];

$(function() {
	$.each(configList, (i, config) => {

		GM_xmlhttpRequest({
			method: 'GET',
			responseType: 'json',
			url: config.url,
			onload: data => {
				config.callback.call(this, data.response);
				configList.splice(configList.indexOf(config), 1);
				if (configList.length == 0) initialize();
			}
		});
		
	});
});

// Initialize page
function initialize() {
	console.log('initialize');
	
	// Put data in page so it can be shared between userscripts
	$('<script>var sjo = {api: {}};</script>').appendTo('head');
	sjo.api.tableData = null;
	
	// Insert wrapper at top of page
	var wrapper = $('<div id="sjo-api-header"></div>').prependTo('.content');
	
	// Add checkboxes for options
	var optionsWrapper = $('<div></div>').appendTo(wrapper);
	$('<input type="checkbox" id="sjo-api-option-raw" value="raw" checked><label for="sjo-api-option-raw">Raw output</label>').appendTo(optionsWrapper);
	$('<input type="checkbox" id="sjo-api-current" value="current"><label for="sjo-api-current">Current only</label>').appendTo(optionsWrapper).change(applyCurrentFlag);
	$('<input type="checkbox" id="sjo-api-autotruncate" value="truncate" checked><label for="sjo-api-autotruncate">Auto truncate</label>').appendTo(optionsWrapper);
	
	function redoRender() {
		if (!sjo.api.tableData) return;
		resetPage();
		prepareRender();
	}
	
	// Add extract options
	var extractWrapper = $('<div class="sjo-api-wrapper"></div>').appendTo(wrapper);
	$.each(buttonSpecs, (key, extract) => {
		var button = $(`<input type="button" id="sjo-api-option-extract-${key}" class="sjo-api-option-extract" value="${extract.text}">`).data('sjo-api-extract', JSON.stringify(extract)).appendTo(extractWrapper);
		if (key == 'other') button.wrap('<div class="sjo-api-wrapper"></div>');
		if (key == defaultButton) button.addClass('sjo-api-option-extract-selected');
	});
	
	$('.sjo-api-option-extract').click(event => {
		var button = $('.sjo-api-option-extract').removeClass('sjo-api-option-extract-selected').filter(event.target).addClass('sjo-api-option-extract-selected');
		var extract = JSON.parse(button.data('sjo-api-extract'));
		console.log('click', button, extract);
		$('#sjo-api-select-template').val(extract.template).trigger('chosen:updated');
	});
	
	// Add extract dropdown
	var dropdown = $('<select id="sjo-api-select-extract"></select>').insertAfter('#sjo-api-option-extract-other');
	buildDownloadList(dropdown);
	dropdown.change(event => $('#sjo-api-option-extract-other').click());
	
	// Add template dropdown
	$('<select id="sjo-api-select-template"></select>').append(Object.keys(templates).map(key => `<option value="${key}">${templates[key].display}</option>`).join(''))
		.appendTo(wrapper).wrap('<div class="sjo-api-wrapper"></div>').before('Template: ')
		.val(buttonSpecs[defaultButton].template)
		.chosen();
	
	// Add start button
	$('<input type="button" id="sjo-api-button-download" value="Extract">').appendTo(wrapper).wrap('<div class="sjo-api-wrapper"></div>').click(startDownload).attr('disabled', true);
	$('<input type="button" id="sjo-api-button-redo" value="Re-render">').insertAfter('#sjo-api-button-download').click(redoRender).hide();
	
	// Add actions wrapper
	$('<div class="sjo-api-wrapper sjo-api-actions"></div>').appendTo(wrapper);
	$('<div class="sjo-api-wrapper sjo-api-actions-output"></div>').appendTo(wrapper);
	
	// Add other options
	$('<span id="sjo-api-status"></span>').appendTo(wrapper).wrap('<div class="sjo-api-wrapper"></div>').hide();
	$('<input type="button" id="sjo-api-button-truncate" value="Truncate">').insertAfter('#sjo-api-status').hide().click(truncateDataTable);
	$('<div class="sjo-api-wrapper" id="sjo-api-error"></div>').appendTo(wrapper).hide();
	$('<div class="sjo-api-wrapper" id="sjo-api-invalidonly-wrapper"><input type="checkbox" id="sjo-api-invalidonly" value="invalidonly"><label for="sjo-api-invalidonly">Show only exceptions</label></div>').appendTo(wrapper).hide().click(toggleInvalidOnly);
	
	// Create table
	var table = $(`<table id="sjo-api-table"></table>`).appendTo(wrapper).hide();
	
	// Create raw output area
	$('<textarea id="sjo-api-textarea-raw" readonly="readonly"></textarea>').appendTo(wrapper).hide().click((event) => event.target.select());
	
	// Paging buttons
	table.before('<div class="sjo-api-paging"></div>');
	table.after('<div class="sjo-api-paging"></div>');
	$('.sjo-api-paging').append('<a class="sjo-api-paging-all" role="button">All</a> <a class="sjo-api-paging-prev" role="button">Previous</a> <span class="sjo-api-paging-pages"></span> <a class="sjo-api-paging-next" role="button">Next</a>').hide();
	$('.sjo-api-paging-prev').click(event => gotoPage(pageNo - 1));
	$('.sjo-api-paging-next').click(event => gotoPage(pageNo + 1));
	$('.sjo-api-paging-all').click(event => gotoPage(Infinity));
	$('.sjo-api-paging-pages').on('click', 'a', event => gotoPage(parseInt(event.target.innerHTML)));
	
	// Hide rest of page
	var helpWrapper = $('.help-api').hide();
	$('<input type="button" id="sjo-api-button-help" value="Show/hide API help">')
		.appendTo(wrapper).click(event => $(helpWrapper).toggle());
	
	// Reapply filters on filter change
	$('body').on('change', 'select.sjo-api-filter', function(event) {
		applyFilters();
	});
	
	// Click on column header to sort
	$('body').on('click', '#sjo-api-row-header th', function() {
		sortData($(this).prop('cellIndex'));
		renderTable();
	});
	
	$('#sjo-api-button-download').attr('disabled', false);
	
	// Trigger event for other scripts
	$('body').trigger('sjo-api-loaded');
	
}

// Build list of download options
function buildDownloadList(dropdown) {
	
	// Loop through groups of elections
	var dropdownHtml = '';
	$('a[href$=".csv"]').closest('ul').each(function(index, element) {
		var list = $(element);
		
		// Get CSV links
		var links = list.find('a');
		//console.log(links.length, links.attr('href'));
		if (links.length == 1 && links.attr('href') == allCandidatesUrl) return;
		
		// Find headings
		var h3 = list.prevAll('h3').first();
		var h4 = list.prevUntil(h3, 'h4').first();
		var h5 = list.prevUntil(h4, 'h5').first();
		
		// Construct group name
		var groupName = '';
		if (h5.length > 0) {
			var groupMoment = moment(h4.text(), 'Do MMMM YYYY');
			if (groupMoment.month() == 4 && groupMoment.date() <= 7) {
				groupName = `${h5.text()} (${groupMoment.year()})`;
			} else {
				groupName = `${h5.text()} (${groupMoment.format('D MMM YYYY')})`;
			}
		} else if (h4.length > 0) {
			groupName = h4.text();
		} else {
			groupName = h3.text();
		}
		
		// Process all links in this group
		var groupHtml = '';
		links.each((index, element) => {
			
			// Add option to group
			var downloadName = element.innerHTML.trim().match(/^Download the (\d{4} )?(.*?)( (local|mayoral) election)? candidates$/)[2];
			downloadName = Utils.shortOrgName(downloadName);
			groupHtml += `<option value="${element.href}">${downloadName}</option>`;
			
			// Add election to mapping table
			var electionIdMatch = element.href.match(/\/candidates-(.+)\.csv$/);
			if (electionIdMatch) {
				var electionId = electionIdMatch[1];
				if (!electionMappings[electionId]) {
					var electionName = downloadName.replace(/\s+by-election.*$/, '');
					electionMappings[electionId] = electionName;
				}
			}
			
		});
		
		// Add group to dropdown
		groupHtml = `<optgroup label="${groupName}">${groupHtml}</option>`;
		dropdownHtml += groupHtml;
		
	});
	console.log('buildDownloadList', electionMappings);
	
	// Add all downloads to dropdown
	dropdown.html(dropdownHtml);
	
	// Select default election
	var lastUrl = localStorage.getItem('sjo-api-url');
	console.log('buildDownloadList', lastUrl);
	if (lastUrl) {
		dropdown.find(`option[value="${lastUrl}"]`).first().prop({selected: true});
		dropdown.trigger('change');
	}
	
	// Style dropdown after adding options
	dropdown.chosen();

}

function applyCurrentFlag() {
	if ($('#sjo-api-option-raw').is(':checked')) {
		outputRaw();
	} else {
		applyFilters();
	}
}

function gotoPage(newPageNo) {
	console.log('gotoPage', newPageNo);
	if ((newPageNo >= 1 && newPageNo <= maxPageNo) || newPageNo == Infinity) {
		pageNo = newPageNo;
		renderTable();
	}
}

function toggleInvalidOnly() {
	$('#sjo-api-table').toggleClass('sjo-api-invalidonly', $('#sjo-api-invalidonly').prop('checked'));
}

function startDownload(event) {
	
	var extract = JSON.parse($('.sjo-api-option-extract-selected').data('sjo-api-extract'));
	if (!extract.urls) {
		extract.urls = [$('#sjo-api-select-extract').val()];
		localStorage.setItem('sjo-api-url', extract.urls[0]);
	}
	currentExtract = extract;
	currentTemplate = templates[$('#sjo-api-select-template').val()];
	console.log('startDownload', currentExtract, currentTemplate);
	
	// Reset download status
	$('#sjo-api-status').empty().hide();
	$('#sjo-api-error').empty().hide();
	resetPage();
	
	// Reset dupe finding
	$('#sjo-api-dupes-wrapper').hide();
	$('#sjo-api-button-dupes-pause, #sjo-api-button-dupes-resume, #sjo-api-button-dupes-more').hide();
	$('#sjo-api-status-dupes').empty();
	$('#sjo-api-table-dupes').empty().hide();
	
	// Download first file
	sjo.api.tableData = [];
	currentSet = 0;
	currentIndex = 0;
	doDownload();
	
}

function resetPage() {
	
	// Reset page before re-rendering
	$('#sjo-api-invalidonly').prop('checked', false);
	$('#sjo-api-invalidonly-wrapper').hide();
	$('#sjo-api-textarea-raw').hide();
	$('#sjo-api-table').empty().hide();
	$('.sjo-api-paging').hide();
	pageNo = 1;

}

function doDownload() {
	console.log('doDownload', currentSet, currentExtract);
	
	// Download and parse CSV
	Papa.parse(currentExtract.urls[currentSet], {
		'download': true,
		'header': true,
		'delimiter': ',',
		'newline': '\r\n',
		'quoteChar': '"',
		'skipEmptyLines': true,
		'complete': parseComplete,
	});
	
}

function parseComplete(results) {
	console.log('parseComplete', results);
	
	// Display errors
	if (results.errors.length > 0) {
		$('#sjo-api-error').append(results.errors.map(error => `<div>${error}</div>`).join('')).show();
	}
	
	// Check for new fields in metadata
	if (results.meta.fields) {
		var newFields = $.grep(results.meta.fields, fieldName => !dataFields[fieldName]);
		if (newFields.length > 0) {
			$('#sjo-api-error').append(`<div>New fields found: ${newFields.join(', ')}</div>`).show();
		}
	}
	
	if (results.data && results.data.length > 0) {
		
		// Clean data
		console.log('parseComplete', results.data.length);
		$.each(results.data, (index, candidate) => cleanData(index, candidate));
		console.log('parseComplete', results.data);
		
	}
	
	sjo.api.tableData = sjo.api.tableData.concat(results.data);
	
	nextDownload();
	
	function nextDownload() {
		
		// Do the next download, or render the data if no more downloads
		currentSet++;
		currentIndex = 0;
		if (currentSet < currentExtract.urls.length) {
			doDownload();
		} else {
			prepareRender();
		}
		
	}
	
}

function prepareRender() {
	console.log('prepareRender', sjo.api.tableData.length);
	
	// Auto truncate
	if (currentExtract.urls[0] == allCandidatesUrl) {
		
		// Limit to current candidates only
		if ($('#sjo-api-current').is(':checked') && $('#sjo-api-autotruncate').is(':checked')) {
			sjo.api.tableData = $.grep(sjo.api.tableData, record => record.election_current);
			console.log('prepareRender', sjo.api.tableData.length);
		}
		
	}
	
	// Limit by values
	// FIXME: is this slow?
	if (currentExtract.limits) {
		$.each(currentExtract.limits, (key, values) => {
			console.log('prepareRender', 'limits', key, values);
			if (Array.isArray(values)) {
				sjo.api.tableData = $.grep(sjo.api.tableData, record => !record || values.indexOf(record[key]) >= 0);
			} else {
				if (values.from) {
					sjo.api.tableData = $.grep(sjo.api.tableData, record => !record || record[key] >= values.from);
				}
				if (values.to) {
					sjo.api.tableData = $.grep(sjo.api.tableData, record => !record || record[key] <= values.to);
				}
			}
		});
		console.log('prepareRender', sjo.api.tableData.length);
	}
	
	// Parse template
	console.log('prepareRender', 'currentTemplate', currentTemplate);
	tableColumns = currentTemplate.columns.map(fieldName => {
		var column = {'name': fieldName, 'has': false};
		if (column.name.substr(0, 4) == 'has:') {
			column.name = column.name.slice(4);
			column.has = true;
		}
		return column;
	});
	console.log('prepareRender', 'tableColumns', tableColumns);
	
	// Set initial sort
	if (currentTemplate.sort) {
		
		// Sort by template
		sortColumn = currentTemplate.sort[0].column;
		sortOrder = currentTemplate.sort[0].order;
		
		sjo.api.tableData = sjo.api.tableData.sort((a, b) => {
			for (var i = 0; i < currentTemplate.sort.length; i++) {
				
				var aValue = a[currentTemplate.sort[i].column];
				var bValue = b[currentTemplate.sort[i].column];
				
				if (aValue > bValue) {
					return currentTemplate.sort[i].order;
				} else if (aValue < bValue) {
					return -currentTemplate.sort[i].order;
				}
				
			}
			return 0;
		});
		
	} else {
		
		// Default sort
		sortColumn = currentTemplate.columns.indexOf('_row');
		sortOrder = 1;
		
	}
	
	console.log('prepareRender', 'sortColumn', sortColumn, sortOrder);
	updateSortIcon();
	
	// Render table
	if ($('#sjo-api-option-raw').is(':checked')) {
		outputRaw();
	} else {
		initializeTable();
	}
	
	// Display buttons
	$('#sjo-api-dupes-wrapper').show();
	$('#sjo-api-button-dupes').show();
	$('#sjo-api-button-splits').show();
	$('#sjo-api-button-redo').show();
	
	$('body').trigger('sjo-api-action');
	
}

// TODO: make a class
function cleanData(index, candidate) {
	
	candidate._row = index + 1;
	candidate.__filters = [];
	
	// Parse integer values
	candidate.id = candidate.id === '' ? '' : parseInt(candidate.id);
	candidate.party_list_position = candidate.party_list_position === '' ? '' : parseInt(candidate.party_list_position);
	
	// Parse boolean values
	// TODO: parse party_list_position here?
	candidate.election_current = candidate.election_current == 'True';
	candidate.party_lists_in_use = candidate.party_lists_in_use == 'True';
	candidate.elected = candidate.elected == 'True';
	
	// Tweak historical general election IDs for consistency
	candidate._election = 
		candidate.election == '2010' ? 'parl.2010-05-06' :
		candidate.election == '2015' ? 'parl.2015-05-07' :
		candidate.election;
	
	// Tweak ward names
	candidate._post_label = candidate.post_label.replace(/^(Police and Crime Commissioner for|London Borough of) | (ward|Police|Constabulary|Combined Authority|Borough Council)$/g, '').trim();
	if (candidate._post_label == 'Sheffield Brightside and Hillsborough') candidate._post_label = 'Sheffield, Brightside and Hillsborough';
	
	// Election
	var electionMatch = candidate._election.match(/^((parl|nia|pcc|mayor)|((sp|naw|gla)\.[a-z])|((local)\.[^\.]+))\.(.+\.)?(\d{4}-\d{2}-\d{2})$/);
	candidate._election_type = electionMatch[2] || electionMatch[3] || electionMatch[6] || null;
	candidate._election_area = electionMatch[1];
	candidate._election_name = electionMappings[candidate.election];
	
	// Election year and age at election
	// TODO: fix sorting of ages outside the range 10-99
	candidate._election_year = +candidate.election_date.substr(0, 4);
	if (candidate.birth_date) {
		if (candidate.birth_date.length == 4) {
			var ageThisYear = candidate._election_year - candidate.birth_date;
			candidate._age_at_election = (ageThisYear - 1) + '-' + ageThisYear;
		} else {
			candidate._age_at_election = '' + moment(candidate.election_date).diff(moment(candidate.birth_date), 'years');
		}
	} else {
		candidate._age_at_election = '';
	}
	
	// Gender
	// TODO: clean up name-gender mapping file and put on Github
	candidate.gender = candidate.gender.trim();
	candidate._gender = 
		candidate.gender === '' ? '' : 
		candidate.gender.match(/^(m|male|mr\.?)$/i) ? 'm' :
		candidate.gender.match(/^(f|female|(mrs|miss|ms)\.?)$/i) ? 'f' :
		'?';
	candidate._gender_icon = {'m': '\u2642', 'f': '\u2640', '?': '?', '': ''}[candidate._gender];
	
	// Parse Wikipedia titles
	var urlMatch = candidate.wikipedia_url ? candidate.wikipedia_url.match(/\/wiki\/(.*)$/) : null;
	candidate._wikipedia = !candidate.wikipedia_url ? '' : !urlMatch ? '?' : decodeURIComponent(urlMatch[1]).replace(/_/g, ' ');
	
	// Party groups
	candidate._party_group_id = parties[candidate.party_id] ? parties[candidate.party_id].group : candidate.party_id;
	
	return candidate;
	
}

// Truncate the data table
function truncateDataTable() {
	console.log('truncateDataTable');
	
	// Reduce the data table to just the filtered rows
	sjo.api.tableData = $.grep(sjo.api.tableData, record => record.__filters.every(value => value));
	
	// Rebuild the filters
	buildFilters();

}

// Reapply filters on checkbox change
// https://css-tricks.com/indeterminate-checkboxes/
function cycleCheckbox(event) {
	
	var filter = $(event.target);
	var colIndex = filter.closest('td').prop('cellIndex');
	var column = tableColumns[colIndex];
	var field = dataFields[column.name];
	console.log(colIndex, field.group, event.ctrlKey);
	
	// If Ctrl is pressed, apply the change to all columns in the same group
	var checkboxes = (field.group && event.ctrlKey) ? $('.sjo-api-filter-group-' + field.group) : filter;
	console.log(checkboxes);
	
	switch(filter.data('sjo-api-checked')) {

	// unchecked, going indeterminate
	case 0:
		checkboxes.data('sjo-api-checked', 1);
		checkboxes.prop('indeterminate', true);
		break;

	// indeterminate, going checked
	case 1:
		checkboxes.data('sjo-api-checked', 2);
		checkboxes.prop('indeterminate', false);
		checkboxes.prop('checked', true);                
		break;

	// checked, going unchecked
	default:
		checkboxes.data('sjo-api-checked', 0);
		checkboxes.prop('indeterminate', false);
		checkboxes.prop('checked', false);

	}
	
	applyFilters();
	
}

function initializeTable() {
	console.log('initializeTable');
	
	// Create table header
	// TODO: specify fixed widths to stop table from jumping
	var colGroupsHtml = tableColumns.map(column => '<col class="sjo-api-col sjo-api-col-' + (column.has ? '__has_' : '') + column.name + '">');
	var headerCellsHtml = tableColumns.map(column => 
		'<th class="sjo-api-cell-' + (column.has ? '__has_' : '') + column.name + '">' + 
			(dataFields[column.name].display && !column.has ? Utils.escapeHtml(dataFields[column.name].display) : '\u00B7') + '</th>');
	var filterCellsHtml = tableColumns.map(column => '<td class="sjo-api-cell-' + (column.has ? '__has_' : '') + column.name + '"></td>');
	$('#sjo-api-table').empty().html(`<colgroup>${colGroupsHtml.join('')}</colgroup><thead>
		<tr id="sjo-api-row-header">${headerCellsHtml.join('')}</tr>
		<tr id="sjo-api-row-filter">${filterCellsHtml.join('')}</tr></thead><tbody></tbody>`);
	
	// Build filters
	buildFilters();
	
}

// Display filters on selected columns
function buildFilters() {
	console.log('buildFilters');
	
	// Remove existing filters
	var cells = $('#sjo-api-row-filter td').empty();
	
	// Don't build filters on short data set
	// TODO: parameterise this
	if (sjo.api.tableData.length >= 10) {
		
		// Loop through filterable fields
		var values;
		$.each(tableColumns, (colIndex, column) => {
			var field = dataFields[column.name];
			
			if (column.has) {
				
				// Add checkbox to table header
				// TODO: add checkboxes to other sparse data (DOB, link fields, image, gender, elected)
				$(`<input type="checkbox" class="sjo-api-filter-checkbox" id="sjo-api-filter-__has_${column.name}">`)
					.addClass(field.group ? 'sjo-api-filter-group-' + field.group : '')
					.prop('indeterminate', true).data('sjo-api-checked', 1).click(cycleCheckbox).appendTo(cells[colIndex]);
				
			} else if (field.filter) {
				
				// Build list of filter options
				values = [];
				$.each(sjo.api.tableData, (index, record) => {
					if (values.indexOf(record[column.name]) < 0) {
						values.push(record[column.name]);
						
						// Add wildcard options
						if (column.name == '_election_area' && currentExtract.urls[0] == allCandidatesUrl && record._election_type != record._election_area) {
							var wildcardOption = record._election_type + '.*';
							if (values.indexOf(wildcardOption) < 0) {
								values.push(wildcardOption);
							}
						}
						
					}
				});
				
				// Don't show filter for only one value
				console.log('buildFilters', column, field, values);
				if (values.length <= 1) return;
				
				// Add dropdown to table header
				var dropdownId = 'sjo-api-filter-' + column.name;
				var dropdown = $(`<select multiple class="sjo-api-filter" id="${dropdownId}"></select>`)
					.html(values.sort().map(value => `<option>${Utils.escapeHtml(value)}</option>`).join(''))
					.appendTo(cells[colIndex]);
				
			}
			
		});
			
	}
	
	// Apply the new filters
	applyFilters(formatFilters);
	
	function formatFilters() {
		$('select.sjo-api-filter').chosen({
			'placeholder_text_multiple': ' ',
			'search_contains': true,
			'inherit_select_classes': true,
			//'width': field['filter-width'],
			'width': '100%',
		});

	}
	
}

// Apply a filter selection
function applyFilters(callback) {
	if (!sjo.api.tableData) return;
	console.log('applyFilters', sjo.api.tableData);
	
	// Reset the null record flag
	$.each(sjo.api.tableData, (index, record) => record.__filters[tableColumns.length + 1] = true);

	$('select.sjo-api-filter, .sjo-api-filter-checkbox').each(function(index, element) {
		
		// Get filter parameters
		var filter = $(element);
		var colIndex = filter.closest('td').prop('cellIndex');
		var column = tableColumns[colIndex];
		
		if (filter.is('[type="checkbox"]')) {
			
			// Get checkbox status
			var checked = filter.prop('checked');
			var indeterminate = filter.prop('indeterminate');
			console.log('applyFilters', colIndex, column, checked, indeterminate, filter);
			
			// Update the data set with the filter value
			$.each(sjo.api.tableData, (index, record) => {
				if (!record) {
					if (checked && !indeterminate) record.__filters[tableColumns.length + 1] = false;
				} else {
					record.__filters[colIndex] = indeterminate || checked === !!record[column.name];
				}
			});
			
		} else {
			
			// Get selected values
			var values = filter.val();
			console.log('applyFilters', colIndex, column, values, filter);
			
			// Parse numeric values
			// TODO: rename "sort" as something like "type"
			if (values && dataFields[column.name].sort == '#') {
				values = values.map(value => value === '' ? '' : parseInt(value));
			}
			
			// Update the data set with the filter value
			$.each(sjo.api.tableData, (index, record) => {
				if (!record) {
					if (values) record.__filters[tableColumns.length + 1] = false;
					return;
				}
				record.__filters[colIndex] = values === null || values.indexOf(record[column.name]) >= 0 || 
					(column.name == '_election_area' && values.indexOf(record[column.name].split('.')[0] + '.*') >= 0);
			});
			
			// Hide extra space in dropdowns
			// TODO: this makes it impossible to type a second search term
			filter.closest('td').find('.search-field').toggle(!values);
			
		}
		
	});
	
	// Apply the current elections filter
	var current = currentExtract.urls[0] == allCandidatesUrl && $('#sjo-api-current').is(':checked');
	console.log('applyFilters', current);
	$.each(sjo.api.tableData, (index, record) => {
		record.__filters[tableColumns.length] = current ? record.election_current : true;
	});
	
	// Render table
	renderTable(callback);
	
}

// Sort data on selected column
function sortData(col) {
	console.log('sortData', col);
	
	var column = tableColumns[col];
	var field = dataFields[column.name];
	
	// Reverse sort if column is already sorted
	sortOrder = column == sortColumn ? -sortOrder : 1;
	sortColumn = column;
	console.log('sortData', sortColumn, sortOrder, field);
	
	// Store current order to produce a stable sort
	$.each(sjo.api.tableData, (index, record) => record.__index = index);
	console.log('sortData', sjo.api.tableData);
	
	// Sort data
	sjo.api.tableData.sort(function(a, b) {
		
		// Check for blank values
		if (isNull(a[column.name]) && isNull(b[column.name])) return a.__index - b.__index;
		if (isNull(a[column.name])) return +1;
		if (isNull(b[column.name])) return -1;
		
		// Don't sort abbreviation fields
		if (column.has) return a.__index - b.__index;
		
		// If values are the same, keep in current order
		if (a[column.name] == b[column.name]) return a.__index - b.__index;
		
		// Sort numbers and strings correctly
		if (field.sort == '#') {
			return sortOrder * (a[column.name] - b[column.name]);
		} else {
			return sortOrder * a[column.name].localeCompare(b[column.name], {'sensitivity': 'base', 'ignorePunctuation': true});
		}
		
	});
	
	function isNull(value) {
		return value === null || value === '' || (column.has && value === false);
	}
	
	// Remove the temporary index column
	$.each(sjo.api.tableData, (index, record) => delete record.__index);
	
	// Update the column header
	updateSortIcon();
	
}

function updateSortIcon() {
	
	// Display icon in header
	// TODO: prettify this
	if (sortColumn >= 0) {
		$('#sjo-api-row-header th')
			.removeClass('sjo-api-th-sort-down sjo-api-th-sort-up')
			.eq(sortColumn).addClass(sortOrder == 1 ? 'sjo-api-th-sort-up' : 'sjo-api-th-sort-down');
	}
	
}

// Rebuild table
function renderTable(callback) {
	console.log('renderTable');
	
	// Build the table rows to be displayed
	var renderData = buildTableRows();
	console.log('renderTable', renderData);
	
	// Check that the selected page shows some rows
	maxPageNo = Math.ceil(renderData.numRowsMatched / maxTableRows);
	maxPageNo = maxPageNo < 1 ? 1 : maxPageNo;
	if (pageNo > maxPageNo && pageNo < Infinity) {
		pageNo = maxPageNo;
		if (renderData.numRowsMatched > 0) {
			renderData = buildTableRows();
		}
	}
	console.log('renderTable', pageNo, maxPageNo);
	
	// Replace the table body
	$('#sjo-api-table tbody').html(renderData.bodyHtml.join(''));
	$('#sjo-api-table').show();
	$('#sjo-api-table tr:has(.sjo-api-invalid)').addClass('sjo-api-invalid');
	
	// Change status message
	$('#sjo-api-status').text('Matched ' + 
		(renderData.numRowsMatched == sjo.api.tableData.length ? '' : 
			renderData.numRowsMatched + ' of ') + sjo.api.tableData.length + ' rows' + 
		(renderData.numRowsDisplayed == renderData.numRowsMatched ? '' : 
			' (displaying ' + (renderData.startRowNo) + '-' + (renderData.startRowNo + renderData.numRowsDisplayed - 1) + ')')).show();
	
	// Display paging buttons
	// TODO: if there are a lot, only ... display ... selected ... pages
	$('.sjo-api-paging-pages').html((new Array(maxPageNo)).fill(0).map((value, index) => 
		'<a role="button"' + (index + 1 == pageNo ? ' class="sjo-api-paging-current"' : '') + '">' + (index + 1) + '</a>').join(' '));
	$('.sjo-api-paging-prev').toggleClass('sjo-api-disabled', pageNo == 1 || pageNo == Infinity);
	$('.sjo-api-paging-next').toggleClass('sjo-api-disabled', pageNo == maxPageNo || pageNo == Infinity);
	$('.sjo-api-paging-all').toggleClass('sjo-api-paging-current', pageNo == Infinity);
	$('.sjo-api-paging').show(); //toggle(renderData.numRowsMatched > maxTableRows);
	
	// Toggle display of columns
	$('#sjo-api-table').toggleClass('sjo-api-table-has-party-lists', sjo.api.tableData.some(record => record && record.party_lists_in_use));
	$('#sjo-api-table').toggleClass('sjo-api-table-has-results', sjo.api.tableData.some(record => record && record.elected));
	
	// Toggle display of truncation button
	// TODO: base this on row count?
	var current = $('#sjo-api-current').is(':checked');
	var currents = new Set(sjo.api.tableData.map(record => record.election_current));
	console.log('renderTable', current, currents);
	$('#sjo-api-button-truncate').toggle(
		(current && currents.has(false)) 
		|| $('.sjo-api-filter option:selected').length > 0 
		|| $('.sjo-api-filter-checkbox').filter((index, element) => $(element).data('sjo-api-checked') != 1).length > 0);
	
	// Display invalid rows only
	$('#sjo-api-invalidonly-wrapper').show();
	toggleInvalidOnly();
	
	// Set up filters on first render
	if (callback) callback.call();
	
	// Clean up the filter lists
	tidyFilters();
	
}

// Build table as raw HTML for rendering speed
function buildTableRows() {
	console.log('buildTableRows');

	// Initialise row count
	var bodyHtml = [];
	var numRowsMatched = 0;
	var numRowsDisplayed = 0;
	var startRowNo = pageNo == Infinity ? 1 : maxTableRows * (pageNo - 1) + 1;
	var endRowNo = pageNo == Infinity ? Infinity : startRowNo + maxTableRows;
	console.log('buildTableRows', pageNo, maxTableRows, startRowNo, endRowNo);
	
	// Loop through all data rows
	$.each(sjo.api.tableData, function(index, record) {
		
		// Check if this row passes all the filters
		if (!record.__filters.every(value => value)) return;
		numRowsMatched++;
		
		// Show only selected page
		if (numRowsMatched >= startRowNo && numRowsMatched < endRowNo) {
			
			// Add row to table body
			bodyHtml.push('<tr' + (record && record.elected ? ' class="sjo-api-row-elected"' : '') + '>' + buildTableRowCells(record).join('') + '</tr>');
			numRowsDisplayed++;
			
		}
		
	});
	
	// Calculate actual end row
	endRowNo = startRowNo + numRowsDisplayed;
	
	// Return values as an object
	return {
		'bodyHtml': 		bodyHtml,
		'numRowsMatched': 	numRowsMatched,
		'numRowsDisplayed': numRowsDisplayed,
		'startRowNo': 		startRowNo,
		'endRowNo': 		endRowNo,
	};
	
}

// Build cells for a single table row
function buildTableRowCells(record) {
	
	// Loop through columns
	var cellsHtml = tableColumns.map(column => {
		
		// Get field
		var field = dataFields[column.name];
		
		// Build cell content
		// TODO: add popups for has: values
		var content = '', title = '';
		if (record && record[column.name] !== null && record[column.name] !== false && record[column.name] !== '') {
			var value = column.has ? (field.abbr ? field.abbr : 'Y') : field.dp ? record[column.name].toFixed(field.dp) : Utils.escapeHtml(record[column.name]);
			content = field.link ? `<a href="${Utils.getLinkAddress(field, record)}">${value}</a>` : value;
			title = column.has ? Utils.escapeHtml(record[column.name]) : '';
		}
		
		// Set classes
		var classes = [`sjo-api-cell-${column.has ? '__has_' : ''}${column.name}`];
		if (field.icon) classes.push('sjo-api-cell-icon');
		//FIXME
		//if (content && field.validate && !field.validate.call(this, record[column.name], record)) classes.push('sjo-api-invalid');
		
		// Return cell HTML
		return `<td class="${classes.join(' ')}" title="${title}">${content}</td>`;
		
	});
	
	return cellsHtml;
	
}

// Sort available filters at the top, and grey out others
function tidyFilters() {
	
	// Check if current flag is checked
	var current = currentExtract.urls[0] == allCandidatesUrl && $('#sjo-api-current').is(':checked');
	console.log('tidyFilters', current);
	
	// Go through all filterable fields
	// TODO: make this loop the same as buildFilters, or vice versa
	$.each(tableColumns, (colIndex, column) => {
		var field = dataFields[column.name];
		if (!field.filter) return;
		
		// Get the dropdown for this field
		var dropdown = $('#sjo-api-filter-' + (column.has ? '__has_' : '') + column.name);
		if (dropdown.length === 0) return;
		console.log('tidyFilters', dropdown.val(), dropdown);
		
		// Reset all options for this dropdown
		var options = dropdown.find('option');
		options.removeClass('sjo-api-filter-unavailable');
		dropdown.append(options.toArray().sort((a, b) => a.innerHTML > b.innerHTML));
		options = dropdown.find('option');
		
		// Only sort this dropdown if other dropdowns are selected
		if (current || $('.sjo-api-filter').not(dropdown).find(':checked').length > 0) {
			
			// Go through data and find values that are valid when accounting for other filters
			var values = [];
			$.each(sjo.api.tableData, function(index, record) {
				if (record.__filters.every((value, filterIndex) => filterIndex == colIndex || value)) {
					values.push(record[column.name]);
					
					// Add wildcard options
					// TODO: this is duplicate code?
					if (column.name == '_election_area' && currentExtract.urls[0] == allCandidatesUrl && record._election_type != record._election_area) {
						if (values.indexOf(record._election_type + '.*') < 0) {
							values.push(record._election_type + '.*');
						}
					}
					
				}
			});
			
			// Sort the available options at the top
			var validOptions = options.filter((index, option) => values.indexOf(option.value) >= 0);
			dropdown.prepend(validOptions);
			options.not(validOptions).addClass('sjo-api-filter-unavailable');
		}
		
		// Refresh the fancy dropdown
		dropdown.trigger('chosen:updated');
		
	});
	
}

// ================================================================
// Output raw data
// ================================================================

function outputRaw() {
	
	var renderData = buildRawOutput();
	
	$('#sjo-api-textarea-raw').html(renderData.bodyHtml.join('\r\n')).show();

	// Change status message
	$('#sjo-api-status').text('Matched ' + 
		(renderData.numRowsMatched == sjo.api.tableData.length ? '' : 
			renderData.numRowsMatched + ' of ') + sjo.api.tableData.length + ' rows').show();
	
	$('#sjo-api-button-truncate').hide();
	$('#sjo-api-invalidonly-wrapper').hide();
	$('#sjo-api-button-dupes').show();
	
}

function buildRawOutput() {
	console.log('buildRawOutput');

	// Initialise row count
	var bodyHtml = [];
	var numRowsMatched = 0;
	var numRowsDisplayed = 0;
	var current = $('#sjo-api-current').is(':checked');
	console.log('buildRawOutput', current, sjo.api.tableData);
	
	// Loop through all data rows
	$.each(sjo.api.tableData, function(index, dataRow) {
		//console.log(index, dataRow);
		
		// Check if this row passes all the filters
		if (current && (!dataRow[0] || !dataRow[0].election_current)) return;
		numRowsMatched++;
		
		// Add row to table body
		bodyHtml.push(buildRawOutputRow(dataRow).join('\t'));
		numRowsDisplayed++;
		
	});
	console.log('buildRawOutput', numRowsMatched, numRowsDisplayed);
	
	// Return values as an object
	return {
		'bodyHtml': 		bodyHtml,
		'numRowsMatched': 	numRowsMatched,
		'numRowsDisplayed': numRowsDisplayed,
	};
	
}

function buildRawOutputRow(dataRow) {
	
	var cellValues = tableColumns.map(column => {
		
		// Get field
		var field = dataFields[column.name];
		
		if (dataRow[column.name] === null || dataRow[column.name] === false || dataRow[column.name] === '') {
			return '';
		} else {
			return column.has ? field.abbr : 
				   field.dp ? dataRow[column.name].toFixed(field.dp) : 
				   typeof dataRow[column.name] == 'string' ? dataRow[column.name].replace(/\s+/g, ' ') : 
				   dataRow[column.name];
		}
		
	});
	
	return cellValues;
	
}
