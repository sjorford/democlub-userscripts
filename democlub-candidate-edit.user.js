// ==UserScript==
// @name        Democracy Club candidate edit
// @namespace   sjorford@gmail.com
// @version     2024.07.01.0
// @include     https://candidates.democracyclub.org.uk/person/*/update
// @include     https://candidates.democracyclub.org.uk/person/*/update/
// @include     https://candidates.democracyclub.org.uk/person/*/update?highlight_field=*
// @include     https://candidates.democracyclub.org.uk/person/*/other-names/create
// @include     https://candidates.democracyclub.org.uk/election/*/person/create/*
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// @require     https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	// Style sheet for datepicker
	$('<link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet" type="text/css">').appendTo('head');
	
	$(`<style class="sjo-styles">
		
		.sjo-formitem {margin-bottom: 6px;}
		
		.sjo-formitem select.standing-select {width: 120px; display: inline-block; height: 1.75rem; padding: 0px 8px; margin-bottom: 0;}
		.sjo-formitem .select2-container {width: 390px !important; display: inline-block !important;}
		
		.sjo-label {float: left; width: 125px; margin-top: 4px; margin-bottom: 0px; font-weight: bold;}
		.sjo-label[for="id_biography"] {float: none;}
		
		input.sjo-input, .sjo-input-static {margin: 0 0 0.25em 0; padding: 0.25rem 0.5rem;}
		input.sjo-input {height: 2rem;}
		input.sjo-input[type="url"],
		input.sjo-input[type="text"],
		input.sjo-input[type="email"],
		input.sjo-input[type="number"],
		.sjo-input-static {width: 390px; display: inline-block;}
		
		#id_gender, #id_birth_date, #id_death_date {width: 100px;}
		.sjo-formitem-id_birth_date p {float: left; margin-right: 3em;}
		input.sjo-input[id^="id_party_list_position_"] {width: 100px;}
		
		input.sjo-input-invalid {background-color: #fcc;}
		input.sjo-input-http {background-color: #e7e7e7;}
		
		select[id^="id_tmp_person_identifiers-"] {height: 2rem; margin-bottom: 0.25em; padding: 0.25rem;}
		.sjo-linktype-duplicate {background-color: #fcc;}
		
		.source-confirmation {width: 900px;}
		#id_source {width: 100%}
		.sjo-noelections-warning {margin-left: 1em; margin-right: 1em; font-weight: bold; color: red;}
		
		[id^="id_standing_"], label[for^="id_standing_"] {display: none;}
		.sjo-candidacy-clear {margin-left: 0.5em; font-weight: bold; color: red;}

		.sjo-link-wrapper {
    		position: absolute;
    		margin-left: 0.5rem;
    		padding-top: 0.5rem;
    		font-size: .875rem;
    		font-weight: bold;
		}
		
		.sjo-link-delete {color: red; margin-right: 0.25em;}
		
		.sjo-expanded {height: 50em !important;}
		
		.titleCaseNameField {display: none;}
		
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
		'id_birth_date':					'Year of birth',
		'id_death_date':					'Date of death',
		'id_biography':						'Statement',
		'id_favourite_biscuit':				'Biscuit \u{1F36A}',
		
		// Additional fields for /other-names page
		'id_note':							'Note',
		'id_start_date':					'Start date',
		'id_end_date':						'End date',
		
	};
	
	// Display ID
	var dcid = $('[name="memberships-0-person"]').val();
	$('#person-details h2').first().after(`<div class="form-item sjo-formitem"><p><label class="sjo-label">ID:</label><span class="sjo-input sjo-input-static">${dcid}</span></p></div>`);
	
	// Format candidate fields
	$.each(candidateFields, (key, value) => formatField(key, value));
	
	var linkFieldIDs = $('[id^="id_tmp_person_identifiers-"][id$="-value"]').toArray().map(e => e.id);
	$.each(linkFieldIDs, (key, value) => formatField(value, ''));
	
	// Format an input field
	function formatField(id, labelText, slug) {
		if (slug) id = id.replace('{slug}', slug);
		//console.log('formatField', id, labelText, slug);
		
		// Find wrapper and label
		var input = $(`[id="${id}"]`);
		var formItem = input.closest('.form-item, .row'); // FIXME: .row is too generic
		if (formItem.length == 0) return;
		var label = $('label', formItem).first();
		
		// Reformat field
		formItem.addClass('sjo-formitem');
		formItem.addClass('sjo-formitem-' + id);
		label.addClass('sjo-label').text(labelText + ':');
		input.addClass('sjo-input');
		if (formItem.parent().is('.columns')) formItem.unwrap();
		formItem.find('select[id^="id_tmp_person_identifiers-"]').unwrap();
		
		// Add placeholder
		if (input.val() != '') {
			input.attr('placeholder', input.val());
		}
		
		// Make year of birth a standard text field so numbers with trailing whitespace can be pasted in
		if (id == 'id_birth_date') {
			input.attr('type', 'text');
		}
		
		// Disable autocomplete for date fields
		if (id == 'id_birth_date' || id == 'id_death_date') {
			input.attr('autocomplete', 'off');
		}
		
		// Show date pickers
		if (id == 'id_death_date') {
			var datePickerOptions = {
				dateFormat: 'dd/mm/yy',
				showOtherMonths: true,
				selectOtherMonths: true,
			};
			input.datepicker(datePickerOptions);
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
	var submitButton = $('#person-details input[type="submit"]').attr('disabled', 'disabled');
	var submitWarning = $('<span class="sjo-noelections-warning">WARNING: no current elections</span>').insertAfter(submitButton);
	var dismissWarning = $('<a class="sjo-noelections-dismiss" href="#">Dismiss</a>').insertAfter(submitWarning).click(hideWarning);
	if ($('.post-select, input[name^="standing_"][value="standing"]').length > 0) hideWarning()
	
	function hideWarning() {
		submitWarning.hide();
		dismissWarning.hide();
		submitButton.removeAttr('disabled');
		return false;
	}
	
	// FIXME
	hideWarning();
	
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
		
		var input = $(e).change(updateLink).on('input', updateLink);
		var row = input.closest('.row');
		var select = row.find(linkSelects).change(updateLink);
		
		var link = $('<a class="sjo-link" target="_blank">Open</a>')
			.appendTo(row)
			.wrap('<span class="sjo-link-wrapper"></span>')
			.hide();
		
		var deleteButton = $('<a class="sjo-link-delete" target="#">Delete</a>')
			.insertBefore(link)
			.click(deleteLink)
			.hide();
		
		updateLink();
		
		function updateLink() {
			
			var href = input.val().trim();
			
			// Strip tracking links
			href = href.replace(/(\?|&)(originalSubdomain|fbclid|ref|utm_source|hl|lang|locale|paipv)=.*/, '');
			
			input.val(href).removeClass('sjo-input-invalid sjo-input-http');
			
			// Detect link types
			var match;
			if (select.val() == '')
				if (match = href.match(/^(?:mailto\:)?([-_\.a-z0-9]+@[-_\.a-z0-9]+)$/i)) {
					select.val('email');
					input.val(match[1]);
				} else if (href.match(/facebook.com/)) {
					if (!select.val().match(/facebook/))
						select.val('facebook_page_url');
				} else if (href.match(/instagram.com/)) {
					select.val('instagram_url');
				} else if (href.match(/linkedin.com/)) {
					select.val('linkedin_url');
				} else if (href.match(/wikipedia.org/)) {
					select.val('wikipedia_url');
				} else if (match = href.match(/^(?:https:\/\/www.wikidata.org\/wiki\/)?(Q[0-9]+)$/)) {
					select.val('wikidata_id');
					href = match[1];
					input.val(href);
				} else if (href.match(/youtube.com/)) {
					select.val('youtube_profile');
				} else if (href.match(/^Q[0-9]+$/)) {
					select.val('wikidata_id');
				} else if (match = href.match(/^(?:https:\/\/(?:mobile\.)?(?:twitter|x).com\/)?([_a-z0-9]{1,15})$/i)) {
					select.val('twitter_username');
					href = match[1];
					input.val(href);
				} else if (href.match(/^https?:\/\/[^\/]*(conservative|labour|libdem|greenparty|reform|workersparty)/i)) {
					select.val('party_ppc_page_url');
				} else if (href.match(/bsky.app/)) {
					select.val('blue_sky_url');
				} else if (href.match(/threads.net/)) {
					select.val('threads_url');
				} else if (href.match(/tiktok.com/)) {
					select.val('tiktok_url');
				}
			
			var valueType = select.val();
			
			if (href == '' && valueType == '') {
				deleteButton.hide();
			} else {
				deleteButton.show();
			}
			
			if (href == '' || valueType == '' || valueType == 'email') {
				link.hide();
			} else {
				if (valueType == 'wikidata_id') {
					href = `https://www.wikidata.org/wiki/${href}`;
				} else if (valueType == 'twitter_username') {
					href = `https://twitter.com/${href}`;
				} else if (href.match(/^http:/)) {
					input.addClass('sjo-input-http');
				} else if (!(href.match(/^https?:/))) {
					href = 'http://' + href;
					input.addClass('sjo-input-invalid');
				}
				link.attr('href', href).show();
			}
			
			linkSelects.each((i,e) => {
				var testType = e.value;
				var same = linkSelects.filter((i,e) => e.value == testType);
				same.toggleClass('sjo-linktype-duplicate', testType != '' && same.length > 1);
			});
			
		}
		
		function deleteLink() {
			var formItem = deleteButton.closest('.sjo-formitem');
			formItem.find('input').val('');
			formItem.find('select').val('');
			updateLink();
			return false;
		}
		
	});
	
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
	
	// Remove autocomplete from merge ID field
	$('#other').attr('autocomplete', 'off');
	
	// Expand bio field
	var bioField = $('#id_biography').on('input', expandBioField);
	expandBioField();
	
	function expandBioField(event) {
		console.log('expandBioField');
		var curHeight = bioField.css('height').replace(/px$/, '') - 0;
		var scrollHeight = bioField.prop('scrollHeight') - 0;
		var newHeight = scrollHeight + 3;
		if (newHeight < curHeight) return;
		bioField.css('height', newHeight + 'px');
	}
	
}
