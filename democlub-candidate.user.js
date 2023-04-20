// ==UserScript==
// @name        Democracy Club candidate
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @exclude     https://candidates.democracyclub.org.uk/person/create/*
// @exclude     https://candidates.democracyclub.org.uk/person/*/other-names
// @exclude     https://candidates.democracyclub.org.uk/person/*/duplicate?*
// @version     2023.04.20.0
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style class="sjo-styles">
		
		.person__actions__action {padding: 1em; margin-bottom: 1em;}
		.person__details dl {margin-bottom: 1em;}
		.sjo-list-dt {float: left; width: 9rem;}
		.sjo-list-dt, .sjo-list-dd {margin-bottom: 0px !important;}
		/* .sjo-list-dd::after {content: "\\a"; white-space: pre-line;} */
		.sjo-list-dd {overflow: hidden; margin-left: 9rem;}
		.sjo-list-dd:first-of-type {margin-left: 0;}
		.sjo-heading-note {font-weight: normal; font-size: small;}
		.person__versions {padding-top: 0;}
		.candidate-result-confirmed {font-weight: normal;}
		.person__actions__action p {font-size: 0.8em;}
		.person__photo a:hover {border: none;}
		.sjo-watchlist {float: right; font-size: x-large;}
		.sjo-duplicate-aka {background-color: lightgray;}
		.sjo-aka-notes {font-size: small;}
		
		.sjo-marker {
			font-size: 66%;
			font-weight: normal;
			padding: 0.25em 0.5em;
			border-radius: 1em;
			vertical-align: text-bottom;
		}
		
		.sjo-marker, .sjo-marker a {
			color: white;
		}
		
		.sjo-marker-byelection        {background-color: darkgoldenrod;}
		.sjo-marker-main              {background-color: royalblue;}
		.sjo-heading-past .sjo-marker {background-color: darkgrey;} /* wtf is darkgrey lighter than grey? */
		
		.sjo-copyaslink {float: right; clear: right; background: transparent; border-radius: 12px;}
		.sjo-copyaslink:hover {background: white;}
		
		.sjo-lastupdate {font-size: 12px; float: right; color: #b5e4de; margin-top: .2rem;}
		
		.sjo-parl {
			background-image: url(https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/img/portcullis.svg);
			background-repeat: no-repeat;
			padding-left: 20px;
			background-size: 15px;
			background-position-y: center;
		}
		
		.header {position: sticky; top: 0px; z-index: 9999;}
		body {height: fit-content; }
		
	</style>`).appendTo('head');
	
	var labelMappings = {
		'Statement to voters':							'Statement',
		'TheyWorkForYou Profile': 						'TheyWorkForYou',
		'Facebook Personal':							'FB personal',
		'Facebook Page': 								'FB page',
		'Linkedin_Url':									'LinkedIn',
		'Party candidate page':							'Party page',
	};
	
	var today = moment();
	
	// Candidate details
	$('dt', '.person__details, .person__versions').each((index, element) => {
		
		var dt = $(element);
		var dd = dt.nextUntil(':not(dd)', 'dd');
		var heading = dt.parent('dl').prev('h2');
		
		//console.log(dt, dt.text().replace(/\s+/g, ' ').trim(), 
		//			dd, dd.text().replace(/\s+/g, ' ').trim().substr(0, 50));
		
		if (heading.text() == 'Candidacies:') {
			
			// Format election headers
			var headingText = dt.html().trim();
			var date = moment(headingText.match(/\((\d+ \w+ \d{4}|\w+\.? \d+, \d{4})\)$/)[1].replace(/\./, ''));
			headingText = headingText.replace(/^Contest(ed|ing) the (\d{4} )?/, '');
			headingText = headingText.replace(/ \([^\(\)]+ \d{4}\)$/, '');
			
			var link = dd.find('a');
			var href = link.attr('href') || '';
			var slug = (href.match(/\/elections\/(.*)\//) || [])[1];
			var council = Utils.shortOrgName(headingText, slug);
			
			// TODO: move this to Utils
			if (href.match(/\/elections\/mayor\./) && !council.startsWith('Mayor of ')) {
				council = 'Mayor of ' + council;
			}
			
			if (href.match(/\/elections\/parl\./)) {
				council = "UK Parliament";
				dt.addClass('sjo-parl');
			}
			
			// Can't use slug for date, as there may be no election link
			//var date = moment(slug.match(/\d{4}-\d{2}-\d{2}/)[0]);
			dt.html(`${council} <span class="sjo-heading-note">(${date.format("D MMM YYYY")})</span>`);
			link.text(Utils.shortPostName(link.text()));
			
			// Add markers for current elections and by-elections
			if (href.match(/\.by\./)) {
				dt.append(' <span class="sjo-marker sjo-marker-byelection">by</span>');
			} else if (date.month() == 4 && date.day() <= 7 && date.year() >= moment().year()) {
				dt.append(` <span class="sjo-marker sjo-marker-main">${date.year()}</span>`);
			}
			
			// Highlight future elections
			if (date.isSameOrAfter(today, 'day')) {
				dt.addClass('sjo-heading-future');
			} else {
				dt.addClass('sjo-heading-past');
			}
			
		} else if (!dt.text().match('Changes made')) {
			
			// Format fields
			dt.addClass('sjo-list-dt');
			dd.addClass('sjo-list-dd');
			if (dd.text().trim() == 'Unknown') dd.text('');
			
			// Trim labels
			if (labelMappings[dt.text()]) dt.text(labelMappings[dt.text()]);
			
			// Add links
			if (dd.find('a').length == 0) {
				if (heading.text() == 'Links and social media:') {
					var linkText = dd.text().trim();
					if (dt.text() == 'Twitter' && linkText.match(/[a-z0-9_]{1,15}/i)) {
						dd.html(`<a target="_blank" href="https://twitter.com/${linkText}">${linkText}</a>`);
					}
				} else if (dt.text() == 'Source') {
					dd.html(dd.text().replace(/(https?:[^\s]+)/gi, '<a target="_blank" href="$1">$1</a>'));
				}
			}
			
			// Highlight duplicate AKAs
			if (dt.text().trim() == 'Also known as') {
				dd.html((i, html) => html.replace(/\(.*\)/, '<span class="sjo-aka-notes">$&</span>'));
				dd.addClass(i => ((dd.eq(i).text().replace(/\(.*\)/, '').trim() == $('.person__hero h1').text().trim()) ? 'sjo-duplicate-aka' : ''));
			}
			
			// Format age and dates of birth/death
			if (dt.text() == 'Age') {
				
				var dobMatch = dd.first().find('.dob').text().match(/\(Born: (.*)\)/);
				if (dobMatch) {
					var dob = dobMatch[1].trim().replace(/(\d+)(st|nd|rd|th)/, '$1');
					var age = dd.first().text().match(/\d+( or \d+)?/)[0];
					dt.text('Born');
				}
				
				var dodMatch = dd.last().text().match(/Died: (.*)/);
				if (dodMatch) {
					var dod = dodMatch[1].trim().replace(/(\d+)(st|nd|rd|th)/, '$1');
					dd.last().before('<dt class="sjo-list-dt">Died</dt>');
				}
				
				if (dob && dod) {
					dd.first().text(`${dob}`);
					dd.last().text(`${dod} (age ${age})`);
				} else if (dob) {
					dd.first().text(`${dob} (age ${age})`);
				} else if (dod) {
					dt.hide();
					dd.first().hide();
					dd.last().text(`${dod}`);
				}
				
			}
			
			// Link usernames
			if (dt.text().trim() == 'Username') {
				dd.html(`<a href="/recent-changes?username=${dd.text().trim()}">${dd.text()}</a>`);
			}
			
			// Format timestamps
			if (dt.text().trim() == 'Timestamp') {
				var timestampMoment = moment(dd.text());
				dd.text(timestampMoment.format('YYYY-MM-DD HH:mm:ss'));
			}
			
			// Hide blank fields
			if (dd.text().trim() == '' && dt.text() != 'Revert to this') {
				dt.hide();
				dd.hide();
			}

		}
		
		//console.log(dt, dt.text().replace(/\s+/g, ' ').trim(), 
		//			dd, dd.text().replace(/\s+/g, ' ').trim().substr(0, 50));
		
	});
	
	var personID = window.location.href.match(/\/person\/(\d+)/)[1];
	
	// Add link to alt names
	$(`<a href="/person/${personID}/other-names" class="button">Manage alternative names</a>`)
		.insertAfter('.person__actions a:contains("Edit candidate")');
	
	// Hide long data URI
	// https://candidates.democracyclub.org.uk/person/768/martin-mcguinness
	$('.person__photo-credit').text((index,text) => text.replace(/(data:image\/jpeg;base64,.{20}).*(.{3}==)/, '$1[...]$2'));
	
	// Show last update time in header
	var updateTime = $('dt:contains("Timestamp")').first().next('dd').text().trim();
	$(`<div class="sjo-lastupdate">Last updated: ${updateTime}</div>`).insertAfter('.person__photo');
	
	// Disable button
	$('a:contains("Request photo removal")').attr('disabled', true);
	
	// Disable autocomplete
	$('#other_person_id').attr('autocomplete', 'off');
	
}
