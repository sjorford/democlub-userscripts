// ==UserScript==
// @name        Democracy Club candidate
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @version     2018.03.07.1
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
		.sjo-list-dt {float: left; width: 8rem;}
		.sjo-list-dt, .sjo-list-dd {margin-bottom: 0px !important;}
		.sjo-list-dd::after {content: "\\a"; white-space: pre-line;}
		.sjo-list-dd {overflow: hidden; margin-left: 8rem;}
		.sjo-list-dd:first-of-type {margin-left: 0;}
		.sjo-heading-note {font-weight: normal; font-size: small;}
		.person__versions {padding-top: 0;}
	</style>`).appendTo('head');
	
	var labelMappings = {
		'Statement to voters':							'Statement',
		'Twitter username (e.g. democlub)': 			'Twitter',
		'Facebook profile URL': 						'FB profile',
		'Facebook page (e.g. for their campaign)': 		'FB page',
		'Homepage URL': 								'Homepage',
		'Wikipedia URL': 								'Wikipedia',
		'LinkedIn URL': 								'LinkedIn',
		"The party's candidate page for this person": 	'Party page',
	};
	labelMappings[`Favourite biscuit ${Unicode.COOKIE}`] = `Biscuit ${Unicode.COOKIE}`;
	
	// Candidate details
	$('dt', '.person__details, .person__versions').each((index, element) => {
		
		var dt = $(element);
		var dd = dt.next('dd');
		
		var link = $('.constituency-value-standing-link a', dd);
		if (link.length > 0) {
			
			// Format election headers
			var date = link.attr('href').match(/(\d{4}(-\d{2}-\d{2})?)\/post\//)[1];
			var council = Utils.shortOrgName(dt.html().trim().replace(/^Contest(ed|ing) the (\d{4} )?| (local|mayoral) election$/g, ''));
			if (link.attr('href').match(/\/election\/mayor\./)) {
				link.text(Utils.shortOrgName(link.text()));
				council = 'Mayor of ' + council;
			}
			dt.html(council + ' <span class="sjo-heading-note">(' + (date.length > 4 ? moment(date).format("D MMM YYYY") : date) + ')</span>');
			
			// Remove duplicate votes
			var result = {'votes': null, 'elected': null};
			$('.candidate-result-confirmed, .vote-count, br', dd).hide();
			/*
			$('.vote-count', dd).each((index, element) => {
				var votesSpan = $(element);
				votesSpan.next('br').hide();
				var electedSpan = votesSpan.prev('.candidate-result-confirmed');
				if (votesSpan.text() == result.votes && electedSpan.text() == result.elected) {
					votesSpan.hide();
					electedSpan.hide().prev('br').hide();
				} else {
					result.votes = votesSpan.text();
					result.elected = electedSpan.text();
				}
			});
			*/
			
		} else if (!dt.text().match('Changes made')) {
			
			// Format fields
			dt.addClass('sjo-list-dt');
			dd.addClass('sjo-list-dd');
			//dd.nextUntil('dt', 'dd').addClass('sjo-list-dd');
			if (dd.text().trim() == 'Unknown') dd.text('');
			
			// Trim labels
			if (labelMappings[dt.text()]) dt.text(labelMappings[dt.text()]);
			
			// Hide reversion button to prevent accidental clicking
			if (dt.text() == 'Revert to this') {
				dt.hide();
				dd.hide();
			}
			
		}
		
	});
	
	// Remove blah
	var blah = [
		'Our database is built by people like you.',
		'Please do add extra details about this candidate – it only takes a moment.',
		'Open data JSON API:',
		'More details about getting <a href="/help/api">the data</a> and <a href="/help/about">its licence</a>.',
	];
	$('.person__actions__action p').filter((index, element) => blah.indexOf(element.innerHTML) >= 0).hide();
	
}
