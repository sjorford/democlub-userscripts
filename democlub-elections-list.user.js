// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/
// @include     https://candidates.democracyclub.org.uk/elections/?*
// @version     2025.05.02.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.23.0/moment.min.js
// ==/UserScript==

$(`<style class="sjo-styles">
	
	.sjo-posts td {padding: .25rem; vertical-align: top;}
	.sjo-post-incomplete {background-color: #fdd !important;}
	.sjo-post-complete {background-color: #ffb !important;}
	.sjo-post-verified {background-color: #bbf7bb !important;}
	
	.ballot_table th, .ballot_table td {padding: 0.25rem;}
	.sjo-posts-heading {
		background-color: hsl(195, 80%, 80%);
		border: 2px solid #222;
		padding: 0.25rem 0.5rem;
	}
	.sjo-posts-heading-main {
		background-color: hsl(195, 80%, 60%);
		color: black;
		cursor: pointer;
	}
	
	.sjo-toc {
		font-size: 0.75rem;
		clear: both;
	}
	.sjo-toc li {
		margin-right: 1.5em;
		float: left;
	}
	.sjo-toc li:last-of-type {
		margin-bottom: 1em;
	}
	.sjo-posts-subhead {
		clear: both;
	}

	input.sjo-filter {display: inline-block; width: 30ex; padding: 5px; height: auto;}
	
	.ds-filter-cluster ul {margin-top: 0.5rem; margin-bottom: 0;}
	.ds-filter-label {min-width: 10em;}
	#id_for_postcode {display: inline; width: 8em; margin-bottom: 0;}
	
	.sjo-summary-wrapper {
		column-count: 3;
	}
	
    .ballot_table td              {width: auto !important;}
    .ballot_table td:nth-child(1) {width: 33% !important;}
    .ballot_table td:nth-child(2) {width:  2% !important;}
    .ballot_table td:nth-child(3) {width: 40% !important;}
	
</style>`).appendTo('head');

$(function() {
	
	var electionTypes = {
		'parl':     'UK Parliament',
		'europarl': 'European Parliament',
		'sp.c':     'Scottish Parliament (constituencies)',
		'sp.r':     'Scottish Parliament (regions)',
		'naw.c':    'Welsh Assembly (constituencies)',
		'naw.r':    'Welsh Assembly (regions)',
		'senedd.c': 'Senedd Cymru (constituencies)',
		'senedd.r': 'Senedd Cymru (regions)',
		'nia':      'Northern Ireland Assembly',
		'pcc':      'Police and Crime Commissioner',
		'gla.c':    'Greater London Assembly (constituencies)',
		'gla.a':    'Greater London Assembly (additional)',
		'mayor':    'Mayoral elections',
		'local':    'Local elections',
	};
	
	// Loop through tables
	$('.ballot_table').each((i,e) => {
		
		var table = $(e);
		
		// Get header row
		//table.find('th:contains("Candidates known")').text('Known');
		var theadHTML = table.find('thead')[0].outerHTML.replace(/Candidates known/, 'Known').replace(/<th>Ballot/, '<th></th>$&');
		
		// Format heading
		var heading = table.prev('h3').addClass('sjo-posts-heading');
		var date = moment(heading.text(), 'Do MMM YYYY');
		heading.html(date.format('D MMMM YYYY') + (date.day() == 4 ? '' : ` <small>(${date.format('dddd')})</small>`));
		
		// Wrap table
		var wrapper = $('<div class="sjo-posts-wrapper"></div>').insertBefore(table).append(table);
		heading.click(() => wrapper.toggle());
		// if (date.month() == 4 && date.date() <= 7) heading.click();
		
		// Get collection of all rows as raw HTML
		var rowsAllSets = {};
		
		// Loop through tables
		var electionSlug, electionType, electionName, electionGroup;
		table.find('tbody tr').each((i,e) => {
			
			// Find table rows with an election link
			var tr = $(e);
			var electionLink = tr.find('td').first().find('a');
			if (electionLink.length > 0) {
				
				electionSlug = electionLink[0].href.match(/([^\/]+)\/$/)[1];
				electionType = electionSlug.match(/(\w+(?:\.\w)?)\./)[1];
				electionName = Utils.shortOrgName(electionLink.text(), electionSlug);
				electionGroup = (electionType == 'mayor' || electionType == 'pcc') ? electionType : electionSlug;
				
				if (!electionTypes[electionType]) electionTypes[electionType] = 'Unknown';
				if (!rowsAllSets[electionType]) rowsAllSets[electionType] = {};
				if (!rowsAllSets[electionType][electionGroup]) rowsAllSets[electionType][electionGroup] = {name: electionName, rows: []};
				
			}
			
			var postName = tr.find('td').eq(1).text().trim();
			var byFlag = tr.find('td').eq(1).find('a').attr('href').match(/\.by\./) ? '☆' : '';
			
			// Save raw HTML for speed of redrawing page
			var html = e.outerHTML.trim();
			html = html.replace(/<td>[\s\S]*?<\/td>/, `<td><strong><a href="/elections/${electionSlug}/">${electionName}</a></strong></td><td>${byFlag}</td>`);
			html = html.replace(/<td>0<\/td>\s*<td>\s*True\s*<\/td>\s*<\/tr>/, '<td><\/td><td>❌<\/td><\/tr>');
			
			// Save this set of rows
			rowsAllSets[electionType][electionGroup].rows.push({
				postName: postName,
				html: html
			});
			
		});
		
		var newHTML = '';
		
		// Create a table for each election type
		$.each(electionTypes, (electionType, description) => {
			var rows = rowsAllSets[electionType];
			if (!rows) return;
			
			var fullElections = [];
			var otherElections = [];
			
			$.each(rows, (electionGroup, groupObj) => {
				if (electionType == 'local' && groupObj.rows.length >= 5) {
					fullElections.push(groupObj);
				} else {
					otherElections.push(groupObj);
				}
			});
			
			var summaryHTML = '';
			if (fullElections.length > 1) {
				summaryHTML += `<h4 class="sjo-posts-subhead">${description} - summary</h4>`;
				summaryHTML += `<div class="sjo-summary-wrapper">`;
				summaryHTML += `<table class="sjo-summary-table">`;
			}

			var fullElectionsHTML = '';
			$.each(fullElections, (index, election) => {

				var subheadText = description + (electionType == 'local' ? ` - ${election.name}` : '');
				fullElectionsHTML += `<h4 class="sjo-posts-subhead">${subheadText}</h4>`;
				fullElectionsHTML += `<table class="ballot_table">`;
				fullElectionsHTML += theadHTML;

				var rowsHTML = election.rows
						.sort((a,b) => a.postName > b.postName ? 1 : a.postName < b.postName ? -1 : 0)
						.map(row => row.html).join('\n');
				fullElectionsHTML += rowsHTML;

				fullElectionsHTML += `</table>`;

				if (summaryHTML) {
					var totalKnown = election.rows
							.map(e => parseInt((e.html.match(/<td>(\d+)<\/td>/) || [,'0'])[1], 10))
							.reduce((total, value) => total + value);
					summaryHTML += `<tr><td><a href="#slughere">${election.name}</a></td><td>${totalKnown}</td></tr>`;
					//summaryHTML += `<p><a href="#slughere">${election.name}</a></p>`;
				}
				
			});
				
			if (false && summaryHTML) {
				summaryHTML += `</table>`;
				summaryHTML += `</div>`;
				newHTML += summaryHTML;
			}
			
			newHTML += fullElectionsHTML;
			
			var subheadText = description; // + (electionType == 'local' ? ` - ${election.name}` : '');
			newHTML += `<h4 class="sjo-posts-subhead">${subheadText}</h4>`;
			newHTML += `<table class="ballot_table">`;
			newHTML += theadHTML;
			
			$.each(otherElections, (index, election) => {
				var rowsHTML = election.rows
								.sort((a,b) => a.postName > b.postName ? 1 : a.postName < b.postName ? -1 : 0)
								.map(row => row.html).join('\n');
				newHTML += rowsHTML;
			});
			
			newHTML += `</table>`;
			
		});
		
		// Overwrite table with new HTML
		wrapper.html(newHTML);
		
	});
	
	// Add filter
	var filter = $('<input class="sjo-filter" id="sjo-filter" autocomplete="off">')
		.insertAfter('.ds-filter')
		.wrap('<label for="sjo-filter"></label>')
		.before('Filter: ')
		.on('change keyup', event => {
			console.log(event.originalEvent, filter.val());
			
			// Find rows that match filter text
			var filterText = filter.val().trim().toLowerCase();
			var rows = $('.sjo-posts-wrapper tbody tr').filter((i,e) => {
				var row = $(e);
				var rowText = row.find('td').first().text() + ' ' + row.find('td').eq(2).text() + ' ' + row.find('a').eq(1).attr('href').replace(/.*\/elections\//, '');
				rowText = rowText.replace(/\s+/g, ' ').trim().toLowerCase();
				return rowText.indexOf(filterText) >= 0;
			});
			
			// Hide everything
			$('.sjo-posts-heading, .sjo-posts-wrapper, .ballot_table, .ballot_table tbody tr, .sjo-posts-subhead').hide();
			
			// Show matching rows and their headings
			rows.show()
				.closest('.ballot_table').show()
				.prev('.sjo-posts-subhead').show().end()
				.closest('.sjo-posts-wrapper').show()
				.prev('.sjo-posts-heading').show();
			
		});
	
	// Format filters
	// FIXME: bug in innerText???
	$('li.ds-filter-label:contains("Election Type") ~ li a').not(':contains("All")')
		.each((i,e) => e.innerText = e.href.match(/election_type=([^&]+)/)[1]);
	$('li.ds-filter-label:contains("Filter by region") ~ li a').not(':contains("All")')
		.each((i,e) => {
			//console.log(e, e.innerText, $(e).text());
			var a = $(e);
			a.text(a.text().trim().match(/(?:^(\w)\w+ (\w)\w+$|(\w\w))/).slice(1).join('').toUpperCase());
		});
	
	$('span').filter((i,e) => e.innerHTML.trim() == 'Results may be added by ResultsBot').text('RB');
	
});
