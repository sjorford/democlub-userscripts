// ==UserScript==
// @name           Democracy Club extracts
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2022.12.13.1
// @match          https://candidates.democracyclub.org.uk/help/api
// @match          https://candidates.democracyclub.org.uk/api/docs/csv/
// @grant          GM_xmlhttpRequest
// @connect        raw.githubusercontent.com
// @require        https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/chosen/1.8.7/chosen.jquery.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.4/papaparse.min.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require        https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// ==/UserScript==

// Global variables
var pageNo = 1, maxPageNo = 1;
var sortColumn = -1, sortOrder = 1;
var currentExtract, currentSet, currentIndex; // TODO: singletonize this
var maxTableRows = 100;
var allCandidatesUrl = '/media/candidates-all.csv';
var templateDropdown;
var electionsList = {};
var organisationsList = {};
var datesList = {};

// External stylesheets
$('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chosen/1.6.2/chosen.css">').appendTo('head');
$('<link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet" type="text/css">').appendTo('head');
	
// Styles
$(`<style>
	
	#sjo-api-header {margin: 1rem;}
	.sjo-api-wrapper {margin-top: 0.5rem;}
	.sjo-api-option-extract {background-color: white; margin-right: 0.5rem; border: 1px solid black; padding: 1px 3px;}
	.sjo-api-option-extract-selected {background-color: #77f; color: white;}
	
	#sjo-api-filters select      {width: 15rem;}
	#sjo-api-filters select#sjo-api-select-election     {width: 30rem;}
	#sjo-api-filters select#sjo-api-select-organisation {width: 30rem;}
	#sjo-api-select-template     {width: 15rem;}
	#sjo-api-status {font-style: italic; margin-right: 1rem;}
	#sjo-api-error {font-weight: bold; color: red;}
	#sjo-api-button-truncate {margin-right: 1rem;}
	.sjo-api-disabled {color: #bbb; pointer-events:none;}
	.sjo-api-paging-current {color: black; pointer-events:none;}
	
	#sjo-api-table {margin: 0.5rem 0;}
	#sjo-api-table th, #sjo-api-table td {padding: 0.25rem; font-size: 0.75rem !important;}
	#sjo-api-table th {user-select: none; -moz-user-select: none; text-align: center; background-repeat: no-repeat; background-position: center right;}
	#sjo-api-table th.sjo-api-th-sort-up {background-image:url(//en.wikipedia.org/w/resources/src/jquery/images/sort_up.png);}
	#sjo-api-table th.sjo-api-th-sort-down {background-image:url(//en.wikipedia.org/w/resources/src/jquery/images/sort_down.png);}
	
	#sjo-api-row-filter td {font-weight: normal; vertical-align: middle;}
	#sjo-api-row-filter ul {font-size: 0.75rem !important;}
	.sjo-api-filter-checkbox {margin: 0 !important;}
	.sjo-api-filter {xxxmin-width: 4rem; max-width: 20rem;}
	#sjo-api-row-filter .chosen-results .sjo-api-filter-unavailable {color: #ccc;}
	#sjo-api-row-filter .chosen-drop {width: auto; white-space: nowrap;}
	#sjo-api-row-filter .chosen-results li {padding-right: 2em;}
	
	.sjo-api-row-elected {background-color: #fbf2af !important;}
	#sjo-api-table td.sjo-api-cell-icon {font-size: 1rem !important; text-align: center;}
	
	#sjo-api-button-help {margin-top: 0.5rem;}
	
	#sjo-api-textarea-raw {min-height: 10em;}
	
	#sjo-api-filters input[type="checkbox"] + label {min-width: 6em;}
	#sjo-api-filters label {display: inline-block;}
	input.sjo-api-date {width: 6em; display: inline-block; margin-right: 1em; margin-left: 0.5em; height: auto; padding: 0.25rem;}
	.sjo-api-date-normal a {background-color: #2ad581 !important;}
	.sjo-api-date-weird  a {background-color: #7eeab5 !important;}
	.sjo-api-date-normal a.ui-state-active {background-color: #007fff !important;}
	.sjo-api-date-weird  a.ui-state-active {background-color: #007fff !important;}
	
	.sjo-nowrap {white-space: nowrap;}
	
	.sjo-section-heading::before {content: '▶ '; display: inline-block; width: 1em;}
	.sjo-section-heading.sjo-expanded::before {content: '▼ ';}
	.sjo-api-type-wrapper {margin-right: 1em;}
	
</style>`).appendTo('head');

// Available fields
var dataFields = {};

// Download buttons
//var buttonSpecs = {};

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
	/*
	{
		url: 'https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/data/extract-selections.json',
		callback: response => buttonSpecs = response
	},
	*/
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
	
	console.log('fields', dataFields);
	//console.log('extracts', buttonSpecs);
	console.log('templates', templates);
	
	// Put data in page so it can be shared between userscripts
	$('<script>var sjo = {};</script>').appendTo('head');
	sjo.api = {};
	sjo.api.tableData = null;
	sjo.api.addTemplateOption = addTemplateOption;
	
	sjo.api.tableColumns = {};
	
	// Insert wrapper at top of page
	var wrapper = $('<div id="sjo-api-header"></div>').prependTo('.content');
	
	// Add filters
	var filterWrapper = $('<div id="sjo-api-filters"></div>').appendTo(wrapper);
	
	// Extract single election
	var electionDropdown = $('<select id="sjo-api-select-election"></select>')
			.appendTo(filterWrapper)		
			.wrap('<div></div>')
			.before('<input type="checkbox" name="sjo-api-filter-checkbox" id="sjo-api-filter-checkbox-election" value="election">')
			.before('<label for="sjo-api-filter-checkbox-election">Election: </label>');
	
	// Extract single organisation
	var organisationDropdown = $('<select id="sjo-api-select-organisation"></select>')
			.appendTo(filterWrapper)
			.wrap('<div></div>')
			.before('<input type="checkbox" name="sjo-api-filter-checkbox" id="sjo-api-filter-checkbox-organisation" value="organisation">')
			.before('<label for="sjo-api-filter-checkbox-organisation">Organisation: </label>');
	
	// Extract all of an election type
	var electionTypes = 'all,all except local,parl,local,mayor,europarl,sp,naw/senedd,nia,gla,pcc'.split(',');
	$('<select id="sjo-api-select-type"></select>')
			.append(electionTypes.map(type => $('<option></option>').val(type).text(type)))
			.appendTo(filterWrapper)
			.wrap('<div></div>')
			.before('<input type="checkbox" name="sjo-api-filter-checkbox" id="sjo-api-filter-checkbox-type" value="type">')
			.before('<label for="sjo-api-filter-checkbox-type">Type: </label>');
	
	// Extract all of a local election subtype
	var localSubtypes = 'LBO,MBO,UTA,DIS,CTY,WAL,SCO,NIR'.split(',');
	$('<select id="sjo-api-select-subtype"></select>')
			.append(localSubtypes.map(subtype => $('<option></option>').val(subtype).text(subtype)))
			.appendTo(filterWrapper)
			.wrap('<div></div>')
			.before('<input type="checkbox" name="sjo-api-filter-checkbox" id="sjo-api-filter-checkbox-subtype" value="subtype">')
			.before('<label for="sjo-api-filter-checkbox-subtype">Subtype: </label>');
	
	// Extract all of a country
	var countries = [['EN', 'England'], ['WA', 'Wales'], ['SC', 'Scotland'], ['NI', 'Northern Ireland']];
	$('<select id="sjo-api-select-country"></select>')
			.append(countries.map(country => $('<option></option>').val(country[0]).text(country[1])))
			.appendTo(filterWrapper)
			.wrap('<div></div>')
			.before('<input type="checkbox" name="sjo-api-filter-checkbox" id="sjo-api-filter-checkbox-country" value="country">')
			.before('<label for="sjo-api-filter-checkbox-country">Country: </label>');
	
	// Highlight elections in date picker
	var datePickerOptions = {
			dateFormat: 'yy-mm-dd',
			showOtherMonths: true,
			selectOtherMonths: true,
			beforeShowDay: date => {
				var dateISO = date.toISOString().split('T')[0];
				var elections = $.grep(Object.values(electionsList), element => element.date == dateISO);
				var className = elections.length == 0 ? '' : (date.getDay() == 4 ? 'sjo-api-date-normal' : 'sjo-api-date-weird');
				return [true, className, ''];
			},
		};
	
	// Extract by date range
	var dateWrapper = $('<div></div>')
			.appendTo(filterWrapper)
			.append('<input type="checkbox" name="sjo-api-filter-checkbox" id="sjo-api-filter-checkbox-date" value="date">')
			.append('<label for="sjo-api-filter-checkbox-date">Date: </label>');
	var startDate = $('<input type="text" id="sjo-api-date-start" class="sjo-api-date">')
			.appendTo(dateWrapper)
			.before('<label for="sjo-api-date-start">From: </label>')
			.datepicker(datePickerOptions);
	var endDate = $('<input type="text" id="sjo-api-date-end" class="sjo-api-date">')
			.appendTo(dateWrapper)
			.before('<label for="sjo-api-date-end">To: </label>')
			.datepicker(datePickerOptions);
	
	// Build lists of elections
	buildDownloadList();
	
	$('#sjo-api-filters select').chosen();
	
	
	
	
	
	
	
	
	// Deselect incompatible filters
	$('select, input', '#sjo-api-filters').change(event => {
		if (event.target.type == 'checkbox' && event.target.checked == false) return;
		
		var filter = event.target.id.replace(/.*-/, '');
		console.log(filter);
		
		switch (filter) {
				
			case 'election':
				$('[name="sjo-api-filter-checkbox"]').prop('checked', false);
				$('#sjo-api-filter-checkbox-election').prop('checked', true);
				break;
				
			case 'organisation':
				$('[name="sjo-api-filter-checkbox"]').not('#sjo-api-filter-checkbox-date').prop('checked', false);
				$('#sjo-api-filter-checkbox-organisation').prop('checked', true);
				break;
				
			case 'subtype':
				$('[name="sjo-api-filter-checkbox"]').not('#sjo-api-filter-checkbox-date').prop('checked', false);
				$('#sjo-api-filter-checkbox-subtype').prop('checked', true);
				break;
				
			case 'type':
				$('[name="sjo-api-filter-checkbox"]').not('#sjo-api-filter-checkbox-date').not('#sjo-api-filter-checkbox-country').prop('checked', false);
				$('#sjo-api-filter-checkbox-type').prop('checked', true);
				break;
				
			case 'country':
				$('[name="sjo-api-filter-checkbox"]').not('#sjo-api-filter-checkbox-date').not('#sjo-api-filter-checkbox-type').prop('checked', false);
				$('#sjo-api-filter-checkbox-country').prop('checked', true);
				break;
				
			case 'date':
				$('#sjo-api-filter-checkbox-election').prop('checked', false);
				break;
				
		}
		
	});
		
		
	
	
	
	
	
	
	// Extract all
	//buttonsWrapper.append('<input type="button" id="sjo-api-option-extract-all" class="sjo-api-option-extract" value="All">');
	
	
	
	
	
	// Include cancelled elections
	$('<input type="checkbox" id="sjo-api-cancelled" value="cancelled" checked>')
		.appendTo(filterWrapper)
		.wrap('<div></div>')
		.after('<label for="sjo-api-cancelled">Include cancelled</label>');
	
	// Highlight selected option
	$('.sjo-api-option-extract').click(event => {
		var option = event.target.id.match(/[^-]+$/)[0];
		$('.sjo-api-params-wrapper').hide().filter(`#sjo-api-params-wrapper-${option}`).show();
		$('.sjo-api-option-extract').removeClass('sjo-api-option-extract-selected').filter(event.target).addClass('sjo-api-option-extract-selected');
	});
	
	
	
	
	
	// Add template dropdown
	templateDropdown = $('<select id="sjo-api-select-template"></select>')
		.appendTo(wrapper).wrap('<div class="sjo-api-wrapper"></div>').before('Template: ');
	$.each(templates, (key, template) => {
		addTemplateOption(key, template);
	});
	templateDropdown.chosen();
	
	// Add start button
	$('<input type="button" id="sjo-api-button-download" value="Extract">').appendTo(wrapper).wrap('<div class="sjo-api-wrapper"></div>').click(startDownload).attr('disabled', true);
	// TODO: make this automatic
	$('<input type="button" id="sjo-api-button-redo" value="Re-render">').insertAfter('#sjo-api-button-download').click(redoRender).hide();
	
	// Add actions wrapper
	$('<div class="sjo-api-wrapper sjo-api-actions"></div>').appendTo(wrapper);
	$('<div class="sjo-api-wrapper sjo-api-actions-output"></div>').appendTo(wrapper);
	
	// Add other options
	$('<span id="sjo-api-status"></span>').appendTo(wrapper).wrap('<div class="sjo-api-wrapper"></div>').hide();
	$('<input type="button" id="sjo-api-button-truncate" value="Truncate">').insertAfter('#sjo-api-status').hide().click(truncateDataTable);
	$('<div class="sjo-api-wrapper" id="sjo-api-error"></div>').appendTo(wrapper).hide();
	
	// Get previously selected values from local storage
	var lastExtract = localStorage.getItem('sjo-api-extract');
	var lastOrganisation = localStorage.getItem('sjo-api-organisation');
	var lastUrl = localStorage.getItem('sjo-api-url');
	var lastStartDate = localStorage.getItem('sjo-api-date-start');
	var lastEndDate = localStorage.getItem('sjo-api-date-end');
	var lastTemplate = localStorage.getItem('sjo-api-template');
	console.log('localStorage', lastExtract, lastUrl, lastStartDate, lastEndDate, lastTemplate);
	
	// Set previously selected values
	$('.sjo-api-params-wrapper').hide();
	if (lastExtract) $(`#sjo-api-option-extract-${lastExtract}`).click();
	if (lastOrganisation) organisationDropdown.val(lastOrganisation).trigger('chosen:updated');
	if (lastUrl) electionDropdown.val(lastUrl).trigger('chosen:updated');
	if (lastStartDate) startDate.val(lastStartDate);
	if (lastEndDate) endDate.val(lastEndDate);
	if (lastTemplate) templateDropdown.val(lastTemplate).trigger('chosen:updated');
	
	
	
	
	
	$(`<style>
		.sjo-api-tabs {display: none;}
		.sjo-api-tab {display: inline-block; border: 1px solid grey; padding: 0.25em 0.5em; color: xxxlightgrey; cursor: pointer;}
		.sjo-api-tab.active {cursor: auto; border: 2px solid black;}
		.sjo-api-tab, .sjo-api-tab.active {border-bottom: 0;}
		.sjo-api-output {border: 2px solid black; padding: 0.5em; display: none;}
		.sjo-api-tab.active {background-color: white; color: black;}
	</style>`).appendTo('head');
	
	// Create tabs
	var tabsWrapper = $('<div class="sjo-api-tabs"></div>')
		.append('<div class="sjo-api-tab" data-sjo-api-tab="#sjo-api-output-raw">Raw output</div>')
		.append('<div class="sjo-api-tab" data-sjo-api-tab="#sjo-api-output-table">Table</div>')
		.appendTo(wrapper);
	$('body').on('click', '.sjo-api-tab', switchTab);
	
	// Create table
	var table = $(`<table id="sjo-api-table"></table>`).appendTo(wrapper)
		.wrap('<div class="sjo-api-output" id="sjo-api-output-table"></div>');
	
	// Create raw output area
	$('<textarea id="sjo-api-textarea-raw" readonly="readonly"></textarea>').appendTo(wrapper)
		.wrap('<div class="sjo-api-output" id="sjo-api-output-raw"></div>')
		.click((event) => event.target.select());
		
	function switchTab() {
		$('.sjo-api-tab').removeClass('active');
		var tabID = $(this).addClass('active').data('sjo-api-tab');
		$('.sjo-api-output').hide();
		$(tabID).show();
	}
	
	// TODO: make this automatic on changing template/tab
	function redoRender() {
		if (!sjo.api.tableData) return;
		//resetPage();
		prepareRender();
	}
	
	
		
	
	
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
	
	// Collapse list of CSVs
	$('#current, #future, #past').each((i,e) => {
		var section = $(e);
		var heading = section.find('h3').addClass('sjo-section-heading sjo-expanded').insertBefore(section)
			.click(event => {
				heading.toggleClass('sjo-expanded');
				section.toggle();
			});
		if (section.is('#past')) heading.click();
	});
	
}

function addTemplateOption(key, template) {
	templates[key] = template;
	$('<option></option>').val(key).text(template.display).appendTo(templateDropdown);
	templateDropdown.trigger('chosen:updated');
}

// Build list of download options
function buildDownloadList() {
	
	// Loop through groups of elections
	var electionsHtml = '';
	$('a[href$=".csv"]').closest('td').addClass('sjo-nowrap')
		.closest('table').each(function(index, element) {
		
		var list = $(element);
		
		// Get CSV links
		var links = list.find('a[href$=".csv"]');
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
			groupName = `${h5.text()} (${groupMoment.format('D MMM YYYY')})`;
		} else if (h4.length > 0) {
			groupName = h4.text();
		} else {
			groupName = h3.text();
		}
		
		// Process all links in this group
		var electionsGroupHtml = '';
		links.each((index, element) => {
			
			// Parse election ID
			var electionIdMatch = element.href.match(/\/candidates-(.+)\.csv$/);
			var electionId = electionIdMatch ? electionIdMatch[1] : '';
			var electionDate = electionId.match(/\d{4}-\d{2}-\d{2}$/)[0];
			var electionType = electionId.match(/^([^\.]+)./)[1];
			
			// Parse election name
			//var electionName = element.innerHTML.trim().match(/^Download the (\d{4} )?(.*?) candidates$/)[2];
			var electionName = $(element).closest('td').prev('td').text();
			electionName = Utils.shortOrgName(electionName, electionId);
			electionName = electionName.replace(/\s+by-election.*$/, '');
			if (electionId.startsWith('parl.') && electionName != 'General Election') {
				electionName = 'UK Parliament';
			} else if (electionId.startsWith('pcc.')) {
				electionName = 'Police and Crime Commissioner';
			} else if (electionId.startsWith('mayor.') && !electionName.startsWith('Mayor of ')) {
				electionName = 'Mayor of ' + electionName;
			}
			
			// Add option to group
			electionsGroupHtml += `<option value="${element.href}">${electionName}</option>`;
			
			// Add election to list
			electionsList[electionId] = {
				id: electionId,
				date: electionDate,
				type: electionType,
				name: electionName,
				url: element.href,
			};
			
			if (!organisationsList[electionName]) {
				organisationsList[electionName] = {
					organisation: electionName,
					urls: [],
				};
			}
			organisationsList[electionName].urls.push(element.href);
			
			if (!datesList[electionDate]) {
				datesList[electionDate] = {
					date: electionDate,
					url: `/media/candidates-${electionDate}.csv`,
				};
			}
			
		});
		
		// Add group to dropdown
		electionsGroupHtml = `<optgroup label="${groupName}">${electionsGroupHtml}</option>`;
		electionsHtml += electionsGroupHtml;
		
	});
	console.log('buildDownloadList', electionsList, datesList);
	
	var organisationsHtml = Object.keys(organisationsList).sort().map(value => `<option value="${value}">${value}</option>`).join('');

	// Add all downloads to dropdown
	$('#sjo-api-select-election').html(electionsHtml);
	$('#sjo-api-select-organisation').html(organisationsHtml);

}

function gotoPage(newPageNo) {
	console.log('gotoPage', newPageNo);
	if ((newPageNo >= 1 && newPageNo <= maxPageNo) || newPageNo == Infinity) {
		pageNo = newPageNo;
		renderTable();
	}
}

function startDownload(event) {
	
	// TODO
	// Filter combinations:
	//   - single election
	//   - organisation
	//       + date range
	//   - subtype [LBO, MBO...]
	//       + date range
	//   - type [local, parl...]
	//   -   + date range
	//   -   + country
	//   - country
	//   -   + date range
	//   - date range
	
	// single election:
	//   extract the single CSV for that election
	
	// organisation:
	//   extract all CSVs for that organisation
	//     optionally filtered by date range
	
	// subtype:
	//   extract all CSVs for that subtype
	//     optionally filtered by date range
	//     if there are few dates, consider extracting the CSVs for those dates and filtering afterwards
	//     if there are a lot, consider extracting the all-candidates CSV and filtering afterwards
	
	// type:
	//   extract all CSVs for that type
	//     optionally filtered by date range
	//     optionally filtered by country
	//     if there are few dates, consider extracting the CSVs for those dates and filtering afterwards
	//     if there are a lot, consider extracting the all-candidates CSV and filtering afterwards
	
	// country:
	//   extract all CSVs for that country
	//     optionally filtered by date range
	//     if there are few dates, consider extracting the CSVs for those dates and filtering afterwards
	//     if there are a lot, consider extracting the all-candidates CSV and filtering afterwards
	
	// date range:
	//   extract all CSVs in that date range
	//     if there are a lot, consider extracting the all-candidates CSV and filtering afterwards
	
	
	
	
	
	
	
	
	var extract = {}
	var selectedButton = $('[name="sjo-api-filter-checkbox"]:checked');
	
	if (selectedButton.is('#sjo-api-filter-checkbox-election')) {
		
		// Extract a single election
		var extractURL = $('#sjo-api-select-election').val();
		extract.urls = [extractURL];
		localStorage.setItem('sjo-api-extract', 'election');
		localStorage.setItem('sjo-api-url', extractURL);
		
	} else if (selectedButton.is('#sjo-api-filter-checkbox-organisation')) {
		
		// Extract a single organisation
		var organisation = $('#sjo-api-select-organisation').val();
		extract.urls = organisationsList[organisation].urls.reverse();
		localStorage.setItem('sjo-api-extract', 'organisation');
		localStorage.setItem('sjo-api-organisation', organisation);
		
	} else if (selectedButton.is('#sjo-api-filter-checkbox-date')) {
		
		// Extract all elections in date range
		var startDate = $('#sjo-api-date-start').val();
		var endDate = $('#sjo-api-date-end').val();
		var electionType = $('#sjo-api-select-type').val();
		if (electionType == 'all') {
			extract.urls = $.grep(Object.values(datesList), element => (startDate == '' || element.date >= startDate) && (endDate == '' || element.date <= endDate)).map(element => element.url);
		} else if (electionType == 'all except local') {
			extract.urls = $.grep(Object.values(electionsList), element => (startDate == '' || element.date >= startDate) && (endDate == '' || element.date <= endDate) && element.type !== 'local').map(element => element.url);
		} else {
			var electionTypes = electionType.split('/');
			extract.urls = $.grep(Object.values(electionsList), element => (startDate == '' || element.date >= startDate) && (endDate == '' || element.date <= endDate) && electionTypes.indexOf(element.type) >= 0).map(element => element.url);
		}
		console.log(startDate, endDate, extract.urls);
		localStorage.setItem('sjo-api-extract', 'date');
		localStorage.setItem('sjo-api-date-start', startDate);
		localStorage.setItem('sjo-api-date-end', endDate);
		
	} else { //if (selectedButton.is('#sjo-api-option-extract-all')) {
		
		extract.urls = [allCandidatesUrl];
		localStorage.setItem('sjo-api-extract', 'all');
		
		/*
	} else if (selectedButton.is('#sjo-api-option-extract-results_ge2019')) {
		
		extract.urls = [resultsGE2019Url];
		localStorage.setItem('sjo-api-extract', 'results_ge2019');
		*/
		
	}
	
	localStorage.setItem('sjo-api-template', $('#sjo-api-select-template').val());
	
	if ($('#sjo-api-cancelled:checked').val() != 'cancelled') {
		extract.limits = extract.limits || {};
		extract.limits.cancelled_poll = [false];
	}
	
	currentExtract = extract;
	console.log('startDownload', currentExtract);
	
	// Reset download status
	$('#sjo-api-status').empty().hide();
	$('#sjo-api-error').empty().hide();
	//resetPage();
	
	// Download first file
	sjo.api.tableData = [];
	currentSet = 0;
	currentIndex = 0;
	doDownload();
	
}

// TODO: delete?
function resetPage() {
	
	// Reset page before re-rendering
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
		'error': parseError,
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
	
	
	var selectedButton = $('.sjo-api-option-extract-selected');
	var isResults = selectedButton.is('#sjo-api-option-extract-results_ge2019');
	if (results.data && results.data.length > 0) {
		
		// Clean data
		console.log('parseComplete', results.data.length);
		$.each(results.data, (index, candidate) => cleanData(index, candidate, isResults));
		console.log('parseComplete', results.data);
		
	}
	
	sjo.api.tableData = sjo.api.tableData.concat(results.data);
	
	nextDownload();
	
}

function parseError(error, file) {
	console.log('parseError', error, file);
	
	// If error is 403 Forbidden, assume there are no candidates for this date
	if (error == 'Forbidden') nextDownload();
	
}

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

function prepareRender() {
	console.log('prepareRender', sjo.api.tableData.length);
	
	// Limit by values
	// FIXME: is this slow?
	if (currentExtract.limits) {
		$.each(currentExtract.limits, (key, values) => {
			console.log('prepareRender', 'limits', key, values);
			if (key.startsWith('has:')) {
				key = key.substr(4);
				sjo.api.tableData = $.grep(sjo.api.tableData, record => !!record[key] == !!values);
			} else if (Array.isArray(values)) {
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
	var currentTemplate = templates[$('#sjo-api-select-template').val()];
	console.log('prepareRender', 'currentTemplate', currentTemplate);
	sjo.api.tableColumns = currentTemplate.columns.map(fieldName => {
		var column = {name: fieldName, has: false, url: false};
		if (column.name.substr(0, 4) == 'has:') {
			column.name = column.name.slice(4);
			column.has = true;
		} else if (column.name.substr(0, 4) == 'url:') {
			column.name = column.name.slice(4);
			column.url = true;
		}
		return column;
	});
	console.log('prepareRender', 'tableColumns', sjo.api.tableColumns);
	
	// Set initial sort
	if (currentTemplate.sort) {
		
		// Sort by template
		var sortColumnName, sortField;
		for (var i = currentTemplate.sort.length - 1; i >= 0; i--) {
			sortColumnName = currentTemplate.sort[i].column;
			sortColumn = sjo.api.tableColumns[currentTemplate.columns.indexOf(sortColumnName)];
			sortOrder = currentTemplate.sort[i].order;
			sortField = dataFields[sortColumn.name];
			sjo.api.tableData = sjo.api.tableData.sort((a, b) => sortCompare(sortColumn, sortField, a, b));
		}

	} else {
		
		// Default sort
		sortColumn = currentTemplate.columns.indexOf('_row');
		sortOrder = 1;
		
	}
	
	console.log('prepareRender', 'sortColumn', sortColumn, sortOrder);
	updateSortIcon();
	
	// Render table
	//if ($('#sjo-api-option-raw').is(':checked')) {
		outputRaw();
	//} else {
		initializeTable();
	//}
	
	// Display buttons
	//$('#sjo-api-button-redo').show();
	
	
	
	if ($('.sjo-api-tab.active').length == 0) {
		$('.sjo-api-tabs').show();
		$('.sjo-api-tab').first().click();
	}
	
	// Change status message
	if (currentExtract.urls.length > 1) {
		var status = $('#sjo-api-status').html(`<span class="sjo-api-status-found">${sjo.api.tableData.length}</span> records found in ${currentExtract.urls.length} files <a href="#" id="sjo-api-status-listurls">(list)</a>`).show();
		var list = $('<ul id="sjo-api-status-urls"></ul>').html(currentExtract.urls.map(url => `<li><a href="${url}">${url}</a></li>`).join('')).appendTo(status).hide();
		$('#sjo-api-status-listurls').click(event => list.toggle() && event.preventDefault());
	} else {
		$('#sjo-api-status').html(`<span class="sjo-api-status-found">${sjo.api.tableData.length}</span> records found in <a href="${currentExtract.urls[0]}">${currentExtract.urls[0]}</a>`).show();
	}
	
	$('body').trigger('sjo-api-action');
	
}

// TODO: make a class
function cleanData(index, candidate, isResults) {
	
	candidate._row = index + 1;
	candidate.__filters = [];
	
	if (isResults) return candidate;
	
	// Parse integer values
	candidate.id = candidate.id === '' ? '' : parseInt(candidate.id);
	candidate.party_list_position = candidate.party_list_position === '' ? '' : parseInt(candidate.party_list_position);
	
	// Parse boolean values
	$.each(dataFields, (key, field) => {
		if (field.boolean) {
			candidate[key] = (candidate[key] == 'True');
		}
	});
	
	// Tweak historical general election IDs for consistency
	candidate._election = candidate.election;
	
	// Election
	var electionMatch = candidate.election.match(/^((parl|nia|pcc|mayor|europarl)|((sp|naw|senedd|gla)\.[a-z])|((local)\.[^\.]+))\.(.+\.)?(\d{4}-\d{2}-\d{2})$/);
	candidate._election_type = electionMatch[2] || electionMatch[3] || electionMatch[6] || null;
	candidate._election_area = electionMatch[1];
	candidate._election_name = electionsList[candidate.election].name;
	
	// Tweak ward names
	candidate._post_label = candidate.post_label;
	if (candidate._election_type == 'local') {
		candidate._post_label = candidate._post_label.replace(/ ward$/, '');
	} else if (candidate._election_type == 'mayor' || candidate._election_type == 'pcc') {
		candidate._post_label = Utils.shortPostName(candidate._post_label);
	}
	
	// Country
	var fakeSlug = candidate._election_area + (candidate._election_area == candidate._election_type ? '.' + candidate.post_label.toLowerCase().trim().replace(/\s+/g, '-') : '');
	candidate._country = Utils.countryForElection(fakeSlug);
	
	// Election year and age at election
	// TODO: fix sorting of ages outside the range 10-99
	candidate._election_year = +candidate.election_date.substr(0, 4);
	if (candidate.birth_date) {
		
		// Fix dates in yyyy-00-00 format
		// https://github.com/DemocracyClub/yournextrepresentative/issues/1418
		candidate.birth_date = candidate.birth_date.replace(/-00-00$/, '');
		
		if (candidate.birth_date.length == 4) {
			var ageThisYear = candidate._election_year - candidate.birth_date;
			candidate._age_at_election = (ageThisYear - 1) + '-' + ageThisYear;
			candidate._age_at_election_min = '' + (ageThisYear - 1)
		} else if (candidate.birth_date.substr(-2) == '00') {
		} else {
			candidate._age_at_election = '' + moment(candidate.election_date).diff(moment(candidate.birth_date), 'years');
			candidate._age_at_election_min = candidate._age_at_election;
		}
	} else {
		candidate._age_at_election = '';
		candidate._age_at_election_min = '';
	}
	
	// Gender
	// TODO: clean up name-gender mapping file and put on Github
	candidate.gender = candidate.gender.trim();
	if (candidate.gender === '') {
		candidate._gender = 
			candidate.honorific_prefix.match(/mrs|miss|ms/i) ? 'f' :
			candidate.honorific_prefix.match(/mr/i) ? 'm' :
			'';
	} else {
		candidate._gender = 
			candidate.gender.match(/^(f|female|(mrs|miss|ms)\.?|woman)$/i) ? 'f' :
			candidate.gender.match(/^(m|male|mr\.?|man)$/i) ? 'm' :
			'?';
	}
	candidate._gender_icon = {'m': '\u2642', 'f': '\u2640', '?': '?', '': ''}[candidate._gender];
	
	// Parse Wikipedia titles
	var urlMatch = candidate.wikipedia_url ? candidate.wikipedia_url.match(/\/wiki\/(.*)$/) : null;
	candidate._wikipedia = !candidate.wikipedia_url ? '' : !urlMatch ? '?' : decodeURIComponent(urlMatch[1]).replace(/_/g, ' ');
	
	// Parse Wikidata ID
	urlMatch = candidate.wikidata_url ? candidate.wikidata_url.match(/\/wiki\/(.*)$/) : null;
	candidate._wikidata = !candidate.wikidata_url ? '' : !urlMatch ? '?' : urlMatch[1];
	
	// Party groups
	candidate._party_group_id = parties[candidate.party_id] ? parties[candidate.party_id].group : candidate.party_id;
	
	// Name parts
	var trimmedName = candidate.name.replace(/\s+/g, ' ').trim();
	
	var suffixMatch = trimmedName.match(/^(.*?) ((J|S)n?r\.?|MBE)$/i);
	if (suffixMatch) {
		candidate._suffix = suffixMatch[2];
		trimmedName = suffixMatch[1];
	}
	
	// TODO: split double-barrelled surnames
	// watch out for hyphenated prefixes, including the list below and also:
	// Charlie O-Macauley
	// Pol Oh-Again
	// Sue Ap-Roberts
	// Ateeque Ur-Rehman
	// Motin Uz-Zaman
	// Lilian El-Doufani
	// Leila Ben-Hassel
	
	var surnameMatch = trimmedName.match(/^(.*?) ((van de|van der|van den|van|von|de la|de|la|le|di|al) [^ ]+)$/i);
	if (!surnameMatch) surnameMatch = trimmedName.match(/^(.*?) ([^ ]+)$/);
	
	if (surnameMatch) {
		var forenames = surnameMatch[1];
		var forenamesMatch = forenames.match(/^([^\s]+)( (.*))?$/);
		candidate._first_name = forenamesMatch[1];
		candidate._middle_names = forenamesMatch[3];
		candidate._last_name = surnameMatch[2];
	} else {
		candidate._last_name = trimmedName;
	}
	
	return candidate;
	
}

// Truncate the data table
function truncateDataTable() {
	console.log('truncateDataTable');
	
	// Reduce the data table to just the filtered rows
	sjo.api.tableData = $.grep(sjo.api.tableData, record => record.__filters.every(value => value));
	$('.sjo-api-status-found').text(sjo.api.tableData.length);
	
	// Rebuild the filters
	buildFilters();
	
	// Rebuild raw output
	outputRaw();

}

// Reapply filters on checkbox change
// https://css-tricks.com/indeterminate-checkboxes/
function cycleCheckbox(event) {
	
	var filter = $(event.target);
	var colIndex = filter.closest('td').prop('cellIndex');
	var column = sjo.api.tableColumns[colIndex];
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
	var colGroupsHtml = sjo.api.tableColumns.map(column => '<col class="sjo-api-col sjo-api-col-' + (column.has ? '__has_' : '') + column.name + '">');
	var headerCellsHtml = sjo.api.tableColumns.map(column => 
		'<th class="sjo-api-cell-' + (column.has ? '__has_' : '') + column.name + '"' + 
			(dataFields[column.name].width ? ` style="width: ${dataFields[column.name].width};"` : '') + '>' + 
			(dataFields[column.name].display && !column.has ? Utils.escapeHtml(dataFields[column.name].display) : '\u00B7') + '</th>');
	var filterCellsHtml = sjo.api.tableColumns.map(column => '<td class="sjo-api-cell-' + (column.has ? '__has_' : '') + column.name + '"></td>');
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
		$.each(sjo.api.tableColumns, (colIndex, column) => {
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
	
	$('select.sjo-api-filter, .sjo-api-filter-checkbox').each(function(index, element) {
		
		// Get filter parameters
		var filter = $(element);
		var colIndex = filter.closest('td').prop('cellIndex');
		var column = sjo.api.tableColumns[colIndex];
		
		if (filter.is('[type="checkbox"]')) {
			
			// Get checkbox status
			var checked = filter.prop('checked');
			var indeterminate = filter.prop('indeterminate');
			console.log('applyFilters', colIndex, column, checked, indeterminate, filter);
			
			// Update the data set with the filter value
			$.each(sjo.api.tableData, (index, record) => {
				record.__filters[colIndex] = indeterminate || checked === !!record[column.name];
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
				record.__filters[colIndex] = values === null || values.indexOf(record[column.name]) >= 0 || 
					(column.name == '_election_area' && values.indexOf(record[column.name].split('.')[0] + '.*') >= 0);
			});
			
			// Hide extra space in dropdowns
			// TODO: this makes it impossible to type a second search term
			filter.closest('td').find('.search-field').toggle(!values);
			
		}
		
	});
	
	// Render table
	renderTable(callback);
	
}

// Sort data on selected column
function sortData(col) {
	console.log('sortData', col);
	
	var column = sjo.api.tableColumns[col];
	var field = dataFields[column.name];
	
	// Reverse sort if column is already sorted
	sortOrder = column == sortColumn ? -sortOrder : 1;
	sortColumn = column;
	console.log('sortData', sortColumn, sortOrder, field);
	
	// Store current order to produce a stable sort
	$.each(sjo.api.tableData, (index, record) => record.__index = index);
	console.log('sortData', sjo.api.tableData);
	
	// Sort data
	sjo.api.tableData.sort((a, b) => sortCompare(column, field, a, b));
	
	// Remove the temporary index column
	$.each(sjo.api.tableData, (index, record) => delete record.__index);
	
	// Update the column header
	updateSortIcon();
	
}

function sortCompare(column, field, a, b) {
	
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
	
	function isNull(value) {
		return value === null || value === '' || (column.has && value === false);
	}
	
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
	
	/*
	// Change status message
	$('#sjo-api-status').text('Matched ' + 
		(renderData.numRowsMatched == sjo.api.tableData.length ? '' : 
			renderData.numRowsMatched + ' of ') + sjo.api.tableData.length + ' rows' + 
		(renderData.numRowsDisplayed == renderData.numRowsMatched ? '' : 
			' (displaying ' + (renderData.startRowNo) + '-' + (renderData.startRowNo + renderData.numRowsDisplayed - 1) + ')')).show();
	*/
	var statusText = (renderData.numRowsMatched == sjo.api.tableData.length ? '' : 'Filtered ' + renderData.numRowsMatched + ' of ')
		+ sjo.api.tableData.length;
	$('.sjo-api-status-found').text(statusText);
	
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
	var cellsHtml = sjo.api.tableColumns.map(column => {
		
		// Get field
		var field = dataFields[column.name];
		
		// Build cell content
		// TODO: add popups for has: values
		var content = '', title = '';
		if (record && record[column.name] !== null && record[column.name] !== false && record[column.name] !== '') {
			var valueURL = field.link ? Utils.getLinkAddress(field, record) : '';
			var value = column.has ? (field.abbr ? field.abbr : 'Y') : column.url ? valueURL : Utils.escapeHtml(record[column.name]);
			content = field.link ? `<a href="${valueURL}">${value}</a>` : value;
			title = column.has ? Utils.escapeHtml(record[column.name]) : '';
		}
		
		// Set classes
		var classes = [`sjo-api-cell-${column.has ? '__has_' : ''}${column.name}`];
		if (field.icon) classes.push('sjo-api-cell-icon');
		
		// Return cell HTML
		return `<td class="${classes.join(' ')}" title="${title}">${content}</td>`;
		
	});
	
	return cellsHtml;
	
}

// Sort available filters at the top, and grey out others
function tidyFilters() {
	
	// Go through all filterable fields
	// TODO: make this loop the same as buildFilters, or vice versa
	$.each(sjo.api.tableColumns, (colIndex, column) => {
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
		if ($('.sjo-api-filter').not(dropdown).find(':checked').length > 0) {
			
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
	
}

function buildRawOutput() {
	console.log('buildRawOutput');

	// Initialise row count
	var bodyHtml = [];
	var numRowsMatched = 0;
	var numRowsDisplayed = 0;
	console.log('buildRawOutput', sjo.api.tableData);
	
	// Loop through all data rows
	$.each(sjo.api.tableData, function(index, dataRow) {
		
		// Check if this row passes all the filters
		numRowsMatched++;
		
		// Add row to table body
		bodyHtml.push(buildRawOutputRow(dataRow).join('\t').replace(/\t+$/, ''));
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
	
	var cellValues = sjo.api.tableColumns.map(column => {
		
		// Get field
		var field = dataFields[column.name];
		
		if (dataRow[column.name] === null || dataRow[column.name] === false || dataRow[column.name] === '') {
			return '';
		} else {
			return column.has ? field.abbr : 
				   column.url ? Utils.getLinkAddress(field, dataRow) :
				   typeof dataRow[column.name] == 'string' ? dataRow[column.name].replace(/\s+/g, ' ') : 
				   dataRow[column.name];
		}
		
	});
	
	return cellValues;
	
}
