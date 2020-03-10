// ==UserScript==
// @name        Democracy Club candidate edit
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*/update
// @include     https://candidates.democracyclub.org.uk/person/*/update/
// @include     https://candidates.democracyclub.org.uk/person/*/update?highlight_field=*
// @include     https://candidates.democracyclub.org.uk/person/*/other-names/create
// @include     https://candidates.democracyclub.org.uk/election/*/person/create/*
// @version     2020.03.10.1
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		
		.sjo-formitem {margin-bottom: 6px;}
		
		.sjo-formitem select.standing-select {width: 120px; display: inline-block; height: 1.75rem; padding: 0px 8px; margin-bottom: 0;}
		.sjo-formitem .select2-container {width: 390px !important; display: inline-block !important;}
		
		.sjo-label {float: left; width: 125px; margin-top: 4px; margin-bottom: 0px; font-weight: bold;}
		.sjo-label[for="id_biography"] {float: none;}
		
		input.sjo-input {height: 2rem; margin: 0 0 0.25em 0; padding: 0.25rem 0.5rem;}
		input.sjo-input[type="url"],
		input.sjo-input[type="text"],
		input.sjo-input[type="email"],
		input.sjo-input[type="number"] {width: 390px; display: inline-block;}
		
		input.sjo-input-invalid {background-color: #fcc;}
		
		select[id^="id_tmp_person_identifiers-"] {height: 2rem; margin-bottom: 0.25em; padding: 0.25rem;}
		.sjo-linktype-duplicate {background-color: #fcc;}
		
		.sjo-noelections-warning {margin-left: 0.5em; font-weight: bold; color: red;}
		
		[id^="id_standing_"], label[for^="id_standing_"] {display: none;}
		.sjo-candidacy-clear {margin-left: 0.5em; font-weight: bold; color: red;}

		.sjo-link-wrapper {
    		position: absolute;
    		margin-left: 0.5rem;
    		padding-top: 0.5rem;
    		font-size: .875rem;
    		font-weight: bold;
		}
		
	</style>`).appendTo('head');
	
	if (location.href.indexOf('/person/create/') >= 0) {
		$('.person__versions').hide();
	}
	
	// ================================================================
	// Format fields and labels
	// ================================================================
	
	var candidateFields = {
		'id_honorific_prefix':				'Title',
		'id_name':							'Name',
		'id_honorific_suffix':				'Suffix',
		'id_gender':						'Gender',
		'id_birth_date':					'Date of birth',
		'id_death_date':					'Date of death',
		'id_biography':						'Statement',
		'id_favourite_biscuit':				'Biscuit \u{1F36A}',
		'add_more_elections':				'Election',
		
		// Additional fields for /other-names page
		'id_note':							'Note',
		'id_start_date':					'Start date',
		'id_end_date':						'End date',
		
		'id_tmp_person_identifiers-0-value': 'hello world',
		
	};
	
	var electionFields = {
		'id_standing_{slug}':				'Standing',
		'id_constituency_{slug}':			'Constituency',
		'id_party_GB_{slug}':				'Party',
		'id_party_NI_{slug}':				'Party',
		'id_party_list_position_GB_{slug}':	'Position',
		'id_party_list_position_NI_{slug}':	'Position',
	};
	
	// Format general candidate fields
	//$.each(candidateFields, (key, value) => formatField(key, value, null));
	$('input[type="text"], textarea', '#person-details').each((i,e) => formatField(e.id));
	
	// Find heading of candidacy section
	var heading = $('#add_election_button').closest('div:has(h2)').find('h2');
	
	// Add a checkbox to show all parties
	//$('<input type="checkbox" id="sjo-allparties" value="allparties"><label for="sjo-allparties">Show all parties</label>')
	//	.insertAfter(heading).wrapAll('<div></div>').change(Utils.showAllParties);
	
	// Format current election headings
	heading.closest('div').find('h3').each((index, element) => {
		var subHeading = $(element);
		var slug = subHeading.next('.form-item').find('.standing-select').attr('name').replace(/^standing_/, '');
		var electionName = Utils.shortOrgName(subHeading.text(), slug);
		subHeading.text(electionName);
	});
	
	// Format election fields on page load
	$('[id^="id_standing_"]')
		.each((index, element) => 
			$.each(electionFields, (key, value) => formatField(key, value, element.id.replace('id_standing_', ''))))
		.closest('p').hide();
	
	// Detect new election
	var refreshTimerChange;
	$('body').on('change', '#add_more_elections', electionChanged);
	$('body').on('click', '#add_election_button', () => formatField('add_more_elections', 'Election'));
	
	function electionChanged(event) {
		var slug = event.target.value;
		console.log('electionChanged', slug);
		
		// Update saved election
		localStorage.setItem('sjo-addperson-button', 'sjo-addperson-button-' + slug.replace(/\./g, '_'));
		
		// Wait for form to load
		if (!refreshTimerChange) {
			refreshTimerChange = setInterval(checkFieldsLoaded, 0);
		}
		
		// Check if fields have loaded
		function checkFieldsLoaded() {
			console.log('checkFieldsLoaded', slug);
			var select = $(`[id="id_standing_${slug}"]`);
			if (select.length > 0) {
				clearInterval(refreshTimerChange);
				refreshTimerChange = null;
				
				select.val('standing').change().closest('p').hide();
				$.each(electionFields, (key, value) => formatField(key, value, slug));
				updateElectionsWarning();
				
				selectSinglePost(slug);
				
			}
		}
		
	}
	
	var newElectionID = location.pathname.match(/(\/election\/(.+?)\/person\/create\/)?/)[2];
	if (newElectionID) selectSinglePost(newElectionID);
	
	// If there is only one post, select it automatically
	function selectSinglePost(id) {
		console.log('selectSinglePost', id);
		var postSelect = $(`[id="id_constituency_${id}"]`);
		var options = postSelect.find('option[value!=""]');
		if (options.length == 1) postSelect.val(options.val()).change();
	}
	
	// Format an input field
	function formatField(id, labelText, slug) {
		if (slug) id = id.replace('{slug}', slug);
		if (!labelText) labelText = candidateFields[id];
		//console.log('formatField', id, labelText, slug);
		
		// Find wrapper and label
		var input = $(`[id="${id}"]`);
		var formItem = input.closest('.form-item, .row');
		if (formItem.length == 0 && input.closest('.extra_elections_forms').length > 0) {
			formItem = input.closest('p');
		}
		var label = $('label', formItem).first();
		
		// Reformat field
		formItem.addClass('sjo-formitem');
		label.addClass('sjo-label').text(labelText + ':');
		input.addClass('sjo-input');
		if (formItem.parent().is('.columns')) formItem.unwrap();
		formItem.find('select[id^="id_tmp_person_identifiers-"]').unwrap();
		
		// Add placeholder
		if (input.val() != '') {
			input.attr('placeholder', input.val());
		}
		
		// Trim party selection
		if (input.is('select.party-select')) {
			Utils.formatPartySelects(input);
		}
		
		// Hide date of death field
		if (id == 'id_death_date' && input.val() == '') {
			input.hide();
			var showDeath = $('<a class="sjo-show-death">Add</a>').insertAfter(input)
				.click(event => {showDeath.hide(); input.show();});
		}
		
		// Format names with unexpected characters
		// TODO: remove the class once the name is edited
		if (id == 'id_name') {
			Utils.validateNameField(input);
		}
		
		if (input.is('.standing-select')) {
			$('<a href="#" class="sjo-candidacy-clear">×</a>')
				.appendTo(input.closest('.form-item').prev('h3'))
				.click(event => input.val('not-standing').change().closest('p').show() && event.preventDefault());
		}
		
	}
	
	// Display a warning message if this person has no current elections
	$('<span class="sjo-noelections-warning">WARNING: no current elections</span>')
		.insertAfter('input.button[value="Save changes"]');
	updateElectionsWarning();
	
	function updateElectionsWarning() {
		$('.sjo-noelections-warning').toggle($('.post-select').length == 0);
	}
	
	// Hide extra buttons
	$('#id_name + button:contains("Title Case")').hide();
	
	// Sort social media types
	$('select[id^="id_tmp_person_identifiers-"]').each((i,e) => {
		var select = $(e);
		var value = select.val();
		var sortedOptions = select.find('option').toArray().sort((a,b) => a.innerText < b.innerText ? -1 : 1);
		select.append(sortedOptions).val(value);
	});
	
	var linkInputs = $('input[id^="id_tmp_person_identifiers-"][id$="-value"]');
	var linkSelects = $('select[id^="id_tmp_person_identifiers-"][id$="-value_type"]');
	
	linkInputs.each((i,e) => {
		
		var input = $(e).change(updateLink);
		var row = input.closest('.row');
		var select = row.find(linkSelects).change(updateLink);
		
		var link = $('<a class="sjo-link" target="_blank">Open</a>')
			.appendTo(row)
			.wrap('<span class="sjo-link-wrapper"></span>')
			.hide();
		
		updateLink();
		
		function updateLink() {
			
			var href = input.val();
			var valueType = select.val();
			
			if (href == '' || valueType == '' || valueType == 'email') {
				link.hide();
			} else {
				if (valueType == 'wikidata_id') href = `https://www.wikidata.org/wiki/${href}`;
				if (valueType == 'twitter_username') href = `https://twitter.com/${href}`;
				link.attr('href', href).show();
			}
			
			linkSelects.each((i,e) => {
				var testType = e.value;
				var same = linkSelects.filter((i,e) => e.value == testType);
				same.toggleClass('sjo-linktype-duplicate', testType != '' && same.length > 1);
			});
			
		}
		
	});
	
	// ================================================================
	// Format list of elections
	// ================================================================
	
	var refreshTimerAdd;
	$('body').on('click', '#add_election_button', getElectionsList);
	
	function getElectionsList(event) {
		console.log('getElectionsList');
		
		// Wait for form to load
		if (!refreshTimerAdd) {
			refreshTimerAdd = setInterval(checkElectionsLoaded, 0);
		}
		
		// Check if fields have loaded
		function checkElectionsLoaded() {
			console.log('checkElectionsLoaded');
			if ($(`#select2-add_more_elections-container`).length > 0) {
				clearInterval(refreshTimerAdd);
				refreshTimerAdd = null;
				$.getJSON('/api/current-elections/', formatElectionsList);
			}
		}
		
	}
	
	function formatElectionsList(data) {
		console.log('formatElectionsList');
		//console.log(data);
		
		var elections = $.map(data, (value, key) => {
			return {
				id: key,
				name: Utils.shortOrgName(value.name.replace(/ local election$/, ''), key),
				election_date: value.election_date
			};
		});
		//console.log(elections);
		
		elections = elections.sort((a, b) => 
			a.id.match(/^parl\./) && !b.id.match(/^parl\./) ? -1 : 
			!a.id.match(/^parl\./) && b.id.match(/^parl\./) ? 1 : 
			a.election_date < b.election_date ? -1 : 
			a.election_date > b.election_date ? +1 : 
			a.name < b.name ? -1 : 
			a.name > b.name ? +1 : 
			0
		);
		//console.log(elections);
		
		elections = $.map(elections, function(value, index) {
			return {
				id: value.id,
				text: value.name + ' (' + value.election_date + ')'
			};
		});
		//console.log(elections);
		
		$("#add_more_elections").select2({data: elections});
		
	}
	
	// Warn on unload
	var initialFormData = JSON.stringify(getFormData('#person-details'));
	$(window).on("beforeunload", function(event) {
		if (event.target.activeElement.type == "submit") return;
		var currentFormData = JSON.stringify(getFormData('#person-details'));
		if (currentFormData != initialFormData)
			return "Are you sure?";
	});
	
	function getFormData(selector) {
		var form = $(selector).first();
		if (!form.is('form')) return null;
		var formData = {};
		$.each(form[0].elements, (i, e) => formData[e.name] = e.value);
		return formData;
	}
	
	// Add link to heading
	var personID = location.pathname.match(/\/person\/(\d+)?/)[1];
	if (personID)
		$('.person__hero h1').html((i, html) => html.replace(/: (.*)/, `: <a href="person/${personID}">$1</a>`));
	
}
