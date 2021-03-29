// ==UserScript==
// @name        Democracy Club Every Election tweaks
// @namespace   sjorford@gmail.com
// @include     https://elections.democracyclub.org.uk/*
// @version     2021.03.29.0
// @grant       none
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// @require     https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		
		.sjo-election-sublist {font-size: 10pt;}
		.sjo-date-picker {clear: both; margin-bottom: 1em;}
		.sjo-date-normal a {background-color: #7eeab5 !important;}
		.sjo-date-normal a.ui-state-active {background-color: #007fff !important;}
		
		.block-label {background: inherit; border: none; margin: 0; padding: 0 0 0 30px; float: none;}
		.block-label input {top: -2px; left: 0;}
		.sjo-columns {column-width: 15em;}
		.sjo-hidden, .sjo-hidden-nir {color: #bbb; display: none;}
		.sjo-election-sublist a {color: #333}
		a[href="/accounts/login/"] {border: 3px solid black; background-color: yellow; border-radius: 5px; margin-left: 0.5rem;}
		
	</style>`).appendTo('head');
	
	// Add link to radar
	//$('.menu').append('<li><a href="/election_radar/?status=new">Radar</a></li>');
	
	if (location.href == 'https://elections.democracyclub.org.uk/') {
		//displaySubIDs();
	} else if (location.href.indexOf('/elections/') >= 0) {
		updateTitle($('.election h1').first().text());
	} else if (location.href.indexOf('/id_creator/election_type/') >= 0) {
		updateTitle('ID Creator');
		$('input[name="election_type-election_type"][value="local"]').click(); // temp default
	} else if (location.href.indexOf('/id_creator/date/') >= 0) {
		updateTitle('ID Creator');
		displayDatePicker();
	} else if (location.href.indexOf('/id_creator/election_organisation/') >= 0) {
		updateTitle('ID Creator');
		trimCouncilNames();
	} else if (location.href.indexOf('/id_creator/election_organisation_division/') >= 0) {
		updateTitle('ID Creator');
		formatDivisions();
	}
	
	function updateTitle(newText) {
		window.document.title = newText + window.document.title;
	}
	
}

function displaySubIDs() {
	
	// Display sub-IDs on front page
	var elections = {};
	$('.card h3:contains("Upcoming elections") + ul li').addClass('sjo-election-top').each((index, element) => {
		
		var key = $('a', element).attr('href').match(/\/elections\/([^\/]+)\//)[1];
		var date = key.split('.')[1];
		var dateMoment = moment(date, 'yyyy-MM-dd');
		if (dateMoment.month() == 4 && dateMoment.date() <= 7) return; // month() is zero-indexed
		
		// Get data for this key
		if (!elections[date]) {
			elections[date] = {};
			$.getJSON('https://elections.democracyclub.org.uk/api/elections.json?poll_open_date=' + date, data => {
				
				$.each(data.results, (index, element) => elections[date][element.election_id] = element);
				
				$.each(elections[date], (index, element) => {
					var top = $('.sjo-election-top > a[href*="' + element.election_id + '"]').closest('li');
					if (top.length == 0) {
						return;
					}
					var list = $('<ul class="sjo-election-sublist"></ul>').appendTo(top);
					populateList(element);
					
					function populateList(election) {
						if (election.children.length > 0) {
							$.each(election.children, (index, element) => populateList(elections[date][element])); // why yes, this _is_ the fourth time I have declared (index, element) in this script, thank you for noticing
						} else {
							$(`<li><a href="/elections/${election.election_id}/">${election.election_id}</a></li>`).appendTo(list);
						}
					}
					
				});
				
			});
		}
		
	});
	
}

function displayDatePicker() {
	
	$('<link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet" type="text/css">').appendTo('head');
	
	var today = moment();
	var defaultDate = moment(today).subtract(today.day(), 'days').add(39, 'days');
	defaultDate = moment('2021-05-06'); // temp default
	
	var wrapper = $('<div class="sjo-date-picker"></div>').insertAfter('.form-date').wrap('<div></div>');
	wrapper.datepicker({
		defaultDate: defaultDate.format('YYYY-MM-DD'),
		dateFormat: 'yy-mm-dd',
		showOtherMonths: true,
		selectOtherMonths: true,
		beforeShowDay: date => {
			var _date = moment(date);
			return [true, _date.day() == 4 && _date.isAfter(today) ? 'sjo-date-normal' : '', ''];
		},
		onSelect: datePicked,
	});
	
	datePicked(defaultDate);
	
	function datePicked(dateInput) {
		var date = moment(dateInput);
		$('.form-group-year input').val(date.format('YYYY'));
		$('.form-group-month input').val(date.format('M'));
		$('.form-group-day input').val(date.format('D'));
	}
	
}

function trimCouncilNames() {
	
	// Hide Northern Ireland councils
	// TODO: put these in a config file
	var oldNICouncils = ['Antrim', 'Ards', 'Armagh', 'Ballymena', 'Ballymoney', 'Banbridge', 'Carrickfergus', 'Castlereagh', 'Coleraine', 'Cookstown', 'Craigavon', 'Derry', 'Down', 'Dungannon and South Tyrone', 'Fermanagh', 'Larne', 'Limavady', 'Lisburn', 'Magherafelt', 'Moyle', 'Newry and Mourne', 'Newtownabbey', 'North Down', 'Omagh', 'Strabane'];
	var newNICouncils = ["Antrim and Newtownabbey", "Ards and North Down", "Armagh, Banbridge and Craigavon", "Belfast", "Causeway Coast and Glens", "Derry and Strabane", "Fermanagh and Omagh", "Lisburn and Castlereagh", "Mid and East Antrim", "Mid Ulster", "Newry, Mourne and Down"];
	var allNICouncils = oldNICouncils.concat(newNICouncils);
	
	// Trim council names and re-sort
	var labels = $('.block-label');
	labels.each((index, element) => {
		var label = $(element);
		var textElement = label.contents().filter((index, element) => element.nodeType == 3 && element.nodeValue.trim() != '')[0];
		var council = Utils.shortOrgName(textElement.nodeValue);
		textElement.nodeValue = council;
		if (allNICouncils.indexOf(council) >= 0) {
			label.addClass('sjo-hidden-nir');
		}
	});
	var sortedElements = labels.toArray().sort((a, b) => a.innerText > b.innerText);
	var wrapper = labels.first().parent().addClass('sjo-columns').append(sortedElements);
	
	// Add filter
	wrapper.find('legend').append('<label for="sjo-filter">Filter: <input class="sjo-filter" id="sjo-filter" autocomplete="off"></label>');
	var filter = $('.sjo-filter').focus().on('change keyup', event => {
		console.log(event.originalEvent, filter.val());
		var filterText = filter.val().trim().toLowerCase();
		$('.block-label').each((index, element) => {
			var label = $(element);
			label.toggleClass('sjo-hidden', !(label.text().trim().toLowerCase().match(filterText) || label.has('input:checked').length > 0));
		});
	});
	
}

function formatDivisions() {
	
	$(`<style>
		.sjo-group {margin-top: 0.5em !important;}
		.sjo-group:hover, .sjo-group:hover label {background-color: #ffc359;}
		.sjo-group fieldset {width: auto; display: inline-block;}
		.sjo-division {width: 15em; display: inline-block;}
	</style>`).appendTo('head');
	
	// Move fieldset legend out of the fieldset
	$('.inline_radios .form-group legend').each((index, element) => {
		var legend = $(element);
		var group = legend.closest('.form-group').addClass('sjo-group');
		$('<span class="sjo-division"></span>').text(legend.text()).prependTo(group);
		legend.remove();
	});
	
}
