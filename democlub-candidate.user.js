// ==UserScript==
// @name        Democracy Club candidate
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @exclude     https://candidates.democracyclub.org.uk/person/create/*
// @exclude     https://candidates.democracyclub.org.uk/person/*/other-names
// @version     2021.03.19.0
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
		.sjo-marker-main.sjo-marker-replacement {background-color: red;}
		
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
		
		if (heading.text() == 'Candidacies:') {
		
			// Format election headers
			var headingText = dt.html().trim();
			var date = moment(headingText.match(/\((.*?)\)$/)[1], 'Do MMMM YYYY');
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
			
			dt.html(`${council} <span class="sjo-heading-note">(${date.format("D MMM YYYY")})</span>`);
			link.text(Utils.shortPostName(link.text()));
			
			// Add markers for current elections and by-elections
			if (href.match(/\.by\./)) {
				dt.append(' <span class="sjo-marker sjo-marker-byelection">by</span>');
			} else if (date.month() == 4 && date.day() <= 7 && date.year() >= moment().year()) {
				dt.append(` <span class="sjo-marker sjo-marker-main">${date.year()}</span>`);
				
				if (href.match(/2020/)) {
					if ($('.sjo-marker-main:contains("2021")').length == 0) {
						var href2021 = href.replace(/2020-05-07/, '2021-05-06');
						dt.append(` <span class="sjo-marker sjo-marker-main sjo-marker-replacement"><a href="${href2021}">2021</a></span>`);
					}
				}
				
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
			
			// Hide reversion button to prevent accidental clicking
			//if (dt.text() == 'Revert to this') {
			//	dt.hide();
			//	dd.hide();
			//}
			
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
					var age = dd.first().text().match(/[-\d]+/)[0];
					dt.text('Born');
				}
				
				var dodMatch = dd.last().text().match(/Died: (.*)/);
				if (dodMatch) {
					var dod = dodMatch[1].trim().replace(/(\d+)(st|nd|rd|th)/, '$1');
					dd.last().before('<dt class="sjo-list-dt">Died</dt>');
				}
				
				if (dob && dod) {
					
					// Recalculate age at death
					age = dod.substr(-4) - dob.substr(-4);
					if (dod.length > 4 && dob.length > 4) {
						if (moment(dob).add(age, 'years').isAfter(dod)) age--;
					}
					
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
		
	});
	
	var personID = window.location.href.match(/\/person\/(\d+)/)[1];
	
	// Add link to alt names
	$(`<a href="/person/${personID}/other-names" class="button">Manage alternative names</a>`)
		.insertAfter('.person__actions a:contains("Edit candidate")');
	
	// Add link to photo
	var avatar = $('.person-avatar');
	if (!avatar.attr('src').match(/blank-person/)) {
		avatar.wrap(`<a href="//static-candidates.democracyclub.org.uk/media/images/images/${personID}.png"></a>`);
	}
	
	// Hide long data URI
	// https://candidates.democracyclub.org.uk/person/768/martin-mcguinness
	$('.person__photo-credit').text((index,text) => text.replace(/(data:image\/jpeg;base64,.{20}).*(.{3}==)/, '$1[...]$2'));
	
}
