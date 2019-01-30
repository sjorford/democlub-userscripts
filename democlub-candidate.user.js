// ==UserScript==
// @name        Democracy Club candidate
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @exclude     https://candidates.democracyclub.org.uk/person/create/*
// @version     2019.01.30.2
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
		
		.person__actions__action {padding: 1em; margin-bottom: 1em;}
		.person__details dl {margin-bottom: 1em;}
		.sjo-list-dt {float: left; width: 9rem;}
		.sjo-list-dt, .sjo-list-dd {margin-bottom: 0px !important;}
		.sjo-list-dd::after {content: "\\a"; white-space: pre-line;}
		.sjo-list-dd {overflow: hidden; margin-left: 9rem;}
		.sjo-list-dd:first-of-type {margin-left: 0;}
		.sjo-heading-note {font-weight: normal; font-size: small;}
		.person__versions {padding-top: 0;}
		.candidate-result-confirmed {font-weight: normal;}
		
		.sjo-heading-byelection::after {
			content: "by";
			font-size: 66%;
			font-weight: normal;
			color: white;
			background-color: darkgoldenrod;
			padding: 0.25em;
			border-radius: 1em;
			margin-left: 0.5em;
		}
		
	</style>`).appendTo('head');
	
	var labelMappings = {
		'Statement to voters':							'Statement',
		'TheyWorkForYou Profile': 						'TheyWorkForYou',
		'Facebook_Personal_Url':						'FB profile',
		'Facebook Page': 								'FB page',
		'Linkedin_Url':									'LinkedIn',
		'Party candidate page':							'Party page',
	};
	
	// Candidate details
	$('dt', '.person__details, .person__versions').each((index, element) => {
		
		var dt = $(element);
		var dd = dt.nextUntil(':not(dd)', 'dd');
		
		var link = $('a', dd);
		if (link.parents().is('.constituency-value-standing-link')) {
			
			// Format election headers
			var date = link.attr('href').match(/(\d{4}(-\d{2}-\d{2})?)\//)[1];
			var council = Utils.shortOrgName(dt.html().trim().replace(/^Contest(ed|ing) the (\d{4} )?/, ''));
			if (link.attr('href').match(/\/elections\/mayor\./) && !council.startsWith('Mayor of ')) {
				council = 'Mayor of ' + council;
			}
			dt.html(council + ' <span class="sjo-heading-note">(' + (date.length > 4 ? moment(date).format("D MMM YYYY") : date) + ')</span>');
			
			// Add by-election marker
			if (link.attr('href').match(/\.by\./)) {
				$('<span class="sjo-heading-byelection"></span>').appendTo(dt);
			}
			
		} else if (!dt.text().match('Changes made')) {
			
			// Format fields
			dt.addClass('sjo-list-dt');
			dd.addClass('sjo-list-dd');
			if (dd.text().trim() == 'Unknown') dd.text('');
			
			// Trim labels
			if (labelMappings[dt.text()]) dt.text(labelMappings[dt.text()]);
			
			// Hide reversion button to prevent accidental clicking
			if (dt.text() == 'Revert to this') {
				dt.hide();
				dd.hide();
			}
			
			// Add Twitter links
			if (dt.text() == 'Twitter' && link.length == 0) {
				var handle = dd.text().trim();
				dd.html(`<a href="https://twitter.com/${handle}">${handle}</a>`);
			}
			
			// Hide blank fields
			if (dd.text().trim() == '') {
				dt.hide();
				dd.hide();
			}

		}
		
	});
	
	var personID = window.location.href.match(/\/person\/(\d+)/)[1];
	
	// Add link to alt names
	$(`<a href="/person/${personID}/other-names" class="button">Manage alternative names</a>`)
		.insertAfter('.person__actions a:contains("Edit candidate")');
	
	// Add link to WCIVF
	$(`
		<div class="person__actions__action">
			<h2>On other sites</h2>
			<p>View on <a href="https://whocanivotefor.co.uk/person/${personID}/">Who Can I Vote For?</a></p>
		</div>`).appendTo('.person__actions');
	
	// Remove blah
	var blah = [
		'Our database is built by people like you.',
		'Please do add extra details about this candidate – it only takes a moment.',
		'Open data JSON API:',
		'More details about getting <a href="/help/api">the data</a> and <a href="/help/about">its licence</a>.',
	];
	$('.person__actions__action p').filter((index, element) => blah.indexOf(element.innerHTML) >= 0).hide();
	
}
