// ==UserScript==
// @name        Democracy Club tweaks
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @exclude     https://candidates.democracyclub.org.uk/media/*
// @version     2023.04.07.0
// @grant       none
// ==/UserScript==

// Parameters
var rootUrl = 'https://candidates.democracyclub.org.uk/';

// Styles
$(`<style class="sjo-styles">
	
	.header__masthead {padding: 0.25em 1em;}
	.header__nav {padding: 0.25em 0 0 0;}
	.header__hero {padding-bottom: 0.5em;}
	button, .button {margin-bottom: 0.5em;}
	
	.sjo-mysuggestion {background-color: #ffeb99 !important;}
	
	.counts_table td, .counts_table th {padding: 4px !important;}
	.select2-results {max-height: 500px !important;}
	.version .button {padding: 2px 4px !important}
	
	.content {padding-top: 0.5em;}
	
	h2 {margin-top: 0.5em !important; margin-bottom: 0.25em !important; padding-bottom: 0.25em !important; clear: both;}
	h3 {font-size: 1.2rem;}
	h4 {font-size: 1.1rem;}
	#add_election_button {margin-bottom: 0;}
	
	.sjo-results-label {float: left; width: 50%; height: 1.5rem; padding-top: 7px;}
	.sjo-results-num {width: 100px !important; margin-bottom: 5px !important; text-align: right; -moz-appearance: textfield !important;}
	.sjo-total-error {background-color: #fbb !important;}
	#id_source {max-height: 80px;}
	.header__nav .large-4 {width: 33.33333% !important;}
	.header__nav .large-6 {width: 50% !important;}
	.header__nav .large-8 {width: 66.66667%; !important;}
	.missing_field {display: none;}
	.person__party_emblem img {max-height: 5em;}
	.finder__forms__container {width: 60% !important;}
	.header__hero {padding-top: 0 !important;}
	.header__hero h1 {font-size: 2rem !important;}
	p {margin-bottom: 0.5rem;}
	.header__nav {padding: 1em 0 0 0;}
	h2 {font-size: 1.5rem;}
	
	.select2-result-label {font-size: 0.8rem; padding: 2px !important;}
	
	.document_viewer {min-height: 600px;}
	
	label {color: #222;}
	.finder__forms__container {max-width: 1000px; width: auto !important;}
	
	.leaderboard {width: auto !important; margin-right: 2em;}
	
</style>`).appendTo('head');

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	var pathname = window.location.pathname;
	
	// Add page type class
	var slug = pathname.replace(/^\/|\/$/g, '').replace(/[\.:]/g, '_').replace(/\//g, '-');
	$('html').addClass('sjo-page__' + slug);
	
	// Reformat various pages
	if (pathname.indexOf('/uk_results/posts/') === 0) {
		formatResultsPage();
	} else if (pathname.indexOf('/uk_results/') === 0) {
		formatResultsPostList();
	} else if (pathname.indexOf('/moderation/photo/upload/') === 0) {
		formatPhotoUpload();
	}
	
	// Hide empty header
	var hero = $('.header__hero');
	var container = hero.find('.container');
	if (container.html().trim() === '') container.remove();
	if (hero.html().trim() === '') hero.remove();
	
	// Shortcuts
	$('body').on('keydown', event => {
		if (event.shiftKey && event.altKey && !event.ctrlKey && event.key == 'F') {
			$('html').scrollTop(0);
			$('input[name="q"]').first().focus().select();
			event.preventDefault();
		}
	});
	
	// Direct link to CSV downloads page
	$('a[href="/api/docs/"]').attr('href', '/api/docs/csv/');
	
	// Collapse filters by default
	// https://github.com/DemocracyClub/yournextrepresentative/issues/1119
	$('.advance_filters').removeAttr('open');
	
	// Default image upload reason
	$('#id_why_allowed_2, #id_why_allowed_url_2').click();
	
	// Override search button
	$('form[action="/search"] button[type="submit"]').click(event => {
		var input = $(event.target).closest('form').find('input[name="q"]');
		var value = input.val().trim();
		if (value == 'v') return false;
		if (value.match(/^[\d ]+$/)) {
			var ids = [...new Set(value.split(' '))];
			$.each(ids.slice(1), (i,id) => window.open('/person/' + id));
			window.location.href = '/person/' + ids[0];
			return false;
		}
	});
	
}

// ================================================================
// Results
// ================================================================

function formatResultsPostList() {
	
	$('.content .columns h3').each((index, element) => {
		var heading = $(element);
		heading.closest('div').find('a').after(' ' + element.innerText);
		heading.hide();
	});
	
}

function formatResultsPage() {
	
	$('input[id^=id_memberships], #id_num_turnout_reported, #id_num_spoilt_ballots')
		.addClass('sjo-results-num')
		.prev('label')
		.addClass('sjo-results-label')
		.unwrap();
	
	// Check total
	$('body').on('input', '.sjo-results-num', validateResults);
	
	function validateResults() {
		
		// Get entered total
		var totalCell = $('#id_num_turnout_reported');
		if (totalCell.val() === '') return;
		var enteredTotal = parseInt(totalCell.val(), 10);
		
		// Sum all cells except total
		var sumTotal = $('.sjo-results-num').toArray().map(function(element, index) {
			var cell = $(element);
			return cell.prop('id') == 'id_num_turnout_reported' ? 0 : cell.val() === '' ? 0 : parseInt(cell.val(), 10);
		}).reduce(function(prev, curr) {
			return prev + curr;
		});
		
		// Compare values
		if (sumTotal == enteredTotal) {
			totalCell.removeClass('sjo-total-error');
		} else {
			totalCell.addClass('sjo-total-error');
			console.log('sum of votes', sumTotal, 'difference', sumTotal - enteredTotal);
		}
		
	}
	
	// Paste values
	$('<textarea id="sjo-results-paste"></textarea>').insertAfter('.container h1:first-of-type').on('paste', parsePastedResults);
	
	// TODO: add a checkbox to remember the source for next time
	//$('#id_source').val('http://gis.worcestershire.gov.uk/website/Elections/result2017.aspx');
	
	function parsePastedResults(event) {
		console.log(event);
		
		var text = event.originalEvent.clipboardData.getData('text');
		console.log(text);
		
		$('.sjo-results-label').each((index, element) => {
			var label = $(element);
			var input = label.next('.sjo-results-num');
			var name = label.text().match(/^(.*?)\s+\(/)[1];
			var regex = new RegExp(name + '\\s+([^0-9]+\\s+)?(\\d+)', 'i');
			var votesMatch = text.match(regex);
			console.log(name, regex, votesMatch);
			if (votesMatch) {
				input.val(votesMatch[2]);
			}
		});
		
		validateResults();
		
	}
	
}

// ================================================================
// Photo upload page
// ================================================================

function formatPhotoUpload() {
	
	$(`<style class="sjo-styles">
		.sjo-tab {padding: 0.5em; display: inline-block; width: 50%; color: #ccc;
			border: 2px solid #ccc; margin-bottom: 0 !important;
			border-bottom-width: 0; box-sizing: border-box;}
		.sjo-tab-first {border-left-width: 2px;}
		.sjo-active {color: black; border-color: black;}
		.sjo-form {border: 2px solid black; padding: 0.5em;}
		.sjo-notice {border: 2px solid black; padding: 0.5em; background-color: gold;
			border-bottom-width: 0;}
		.sjo-notice ul {margin-bottom: 0;}
	</style>`).appendTo('head');
	
	var forms = $('.content form').addClass('sjo-form').hide();
	var tabs = forms.prev('h2').addClass('sjo-tab').insertBefore(forms.first());
	tabs.first().addClass('sjo-tab-first');
	
	if (forms.eq(0).children().first().is('p:has(strong)')) {
		forms.eq(0).children().first().next('ul').addBack().insertBefore(forms.first())
			.wrapAll('<div class="sjo-notice"></div>');
	}
	
	forms.each((i,e) => {
		var form = $(e);
		var tab = tabs.eq(i)
			.click(() => {
				forms.hide();
				form.show();
				tabs.removeClass('sjo-active');
				tab.addClass('sjo-active');
			});
	});
	
	tabs.eq(1).click();
	
}

// ================================================================
// General functions
// ================================================================

if (!String.prototype.fullTrim) {
	String.prototype.fullTrim = function() {
		return this.trim().replace(/(\s|\n|\r)+/g, ' ');
	};
}
