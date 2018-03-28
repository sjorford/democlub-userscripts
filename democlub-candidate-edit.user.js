// ==UserScript==
// @name        Democracy Club candidate edit
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*/update
// @include     https://candidates.democracyclub.org.uk/person/*/update?highlight_field=*
// @include     https://candidates.democracyclub.org.uk/election/*/person/create/*
// @version     2018.03.28.0
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
		.sjo-formitem div.select2-container {width: 390px !important; display: inline-block !important;}
		
		.sjo-label {float: left; width: 125px; margin-top: 4px; margin-bottom: 0px; font-weight: bold;}
		.sjo-label[for="id_biography"] {float: none;}
		
		input.sjo-input {height: 2rem; padding: 0.25rem 0.5rem;}
		input.sjo-input[type="url"],
		input.sjo-input[type="text"],
		input.sjo-input[type="email"],
		input.sjo-input[type="number"] {width: 390px; display: inline-block;}
		
		input.sjo-input-empty {background-color: #ffc;}
		
		.sjo-input#id_twitter_username {width: 360px; margin-left: -4px; display: inline-block;}
		.sjo-prefix {display: inline-block; width: 30px; position: relative; top: 1px; height: 2rem; line-height: 2rem;}
		
		.sjo-noelections-warning {margin-left: 0.5em; font-weight: bold; color: red;}
		
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
		'id_honorific_suffix':				'Honours',
		'id_email':							'Email',
		'id_twitter_username':				'Twitter',
		'id_facebook_personal_url':			'FB profile',
		'id_facebook_page_url':				'FB page',
		'id_homepage_url':					'Homepage',
		'id_wikipedia_url':					'Wikipedia',
		'id_linkedin_url':					'LinkedIn',
		'id_party_ppc_page_url':			'Party page',
		'id_gender':						'Gender',
		'id_birth_date':					'Date of birth',
		'id_biography':						'Statement',
		'id_favourite_biscuits':			'Biscuit \u{1F36A}',
		'add_more_elections':				'Election',
	};
	
	var electionFields = {
		'id_standing_{slug}':				'Standing',
		'id_constituency_{slug}':			'Constituency',
		'id_party_gb_{slug}':				'Party',
		'id_party_ni_{slug}':				'Party',
		'id_party_list_position_gb_{slug}':	'Position',
		'id_party_list_position_ni_{slug}':	'Position',
	};
	
	// Format general candidate fields
	$.each(candidateFields, (key, value) => formatField(key, value, null));
	
	// Format election fields on page load
	$('[id^="id_standing_"]').each((index, element) => 
		$.each(electionFields, (key, value) => formatField(key, value, element.id.replace('id_standing_', ''))));
	
	// Detect new election
	var refreshTimerChange;
	$('body').on('change', '#add_more_elections', electionChanged);
	
	function electionChanged(event) {
		var slug = event.target.value;
		console.log('electionChanged', slug);
		
		// Update saved election
		localStorage.setItem('sjo-addperson-button', 'sjo-addperson-listitem-' + slug.replace(/\./g, '_'));
		
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
				
			}
		}
		
	}
	
	// Format an input field
	function formatField(id, labelText, slug) {
		if (slug) id = id.replace('{slug}', slug);
		//console.log('formatField', id, labelText, slug);
		
		var input = $(`[id="${id}"]`);
		var formItem = input.closest('.form-item');
		if (formItem.length === 0) formItem = input.closest('p');
		var label = $('label', formItem).first();
		
		// Reformat field
		formItem.addClass('sjo-formitem');
		label.text(labelText + ':');
		label.addClass('sjo-label');
		input.addClass('sjo-input');
		if (input.val() === '') input.addClass('sjo-input-empty');
		$('.columns', formItem).addClass('sjo-form-columns');
		
		// Format Twitter prefix
		var prefix = $('.prefix', formItem);
		if (input.parent().hasClass('columns') && input.parent().parent().hasClass('row') && prefix.parent().hasClass('columns')) {
			prefix.unwrap().addClass('sjo-prefix');
			input.unwrap().unwrap();
		}
		
		// Trim party selection
		if (input.is('select.party-select')) {
			Utils.formatPartySelects(input);
		}
		
	}
	
	// Display a warning message if this person has no current elections
	$('<span class="sjo-noelections-warning">WARNING: no current elections</span>')
		.insertAfter('input.button[value="Save changes"]');
	updateElectionsWarning();
	
	function updateElectionsWarning() {
		$('.sjo-noelections-warning').toggle($('.post-select').length == 0);
	}
	
	// ================================================================
	// Format list of elections
	// ================================================================
	
	var heading = $('#add_election_button').closest('div:has(h2)').find('h2');
	
	// Add a checkbox to show all parties
	$('<input type="checkbox" id="sjo-allparties" value="allparties"><label for="sjo-allparties">Show all parties</label>')
		.insertAfter(heading).wrapAll('<div></div>').change(Utils.showAllParties);
	
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
			if ($(`#s2id_add_more_elections`).length > 0) {
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
				name: Utils.shortOrgName(value.name.replace(/ local election$/, '')),
				election_date: value.election_date
			};
		});
		//console.log(elections);
		
		elections = elections.sort((a, b) => 
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
				text: (value.id.split('.')[0] == 'mayor' ? 'Mayor of ' : '') + value.name + ' (' + value.election_date + ')'
			};
		});
		//console.log(elections);
		
		$("#add_more_elections").select2({data: elections});
		
	}
	
}
