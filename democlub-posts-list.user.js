// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/*
// @version     2021.02.17.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.23.0/moment.min.js
// ==/UserScript==

$(`<style>
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
	
	$('.ballot_table').each((i,e) => {
		
		var table = $(e);
		table.find('th:contains("Candidates known")').text('Known');
		var theadHTML = table.find('thead')[0].outerHTML;
		
		// Format heading
		var heading = table.prev('h3').addClass('sjo-posts-heading');
		var date = moment(heading.text(), 'Do MMM YYYY');
		heading.html(date.format('D MMMM YYYY') 
			+ (date.day() == 4 ? '' : ` <small>(${date.format('dddd')})</small>`));
		
		// Wrap table
		var wrapper = $('<div class="sjo-posts-wrapper"></div>').insertBefore(table).append(table);
		heading.click(() => wrapper.toggle());
		
		// Get collection of all rows
		var rowsAllSets = {};
		var electionSlug, electionType, electionName, electionGroup;
		table.find('tbody tr').each((i,e) => {
			
			var links = $('a[href^="/elections/"]', e);
			if (links.length >= 2) {
				
				electionSlug = links[0].href.match(/([^\/]+)\/$/)[1];
				electionType = electionSlug.match(/(\w+(?:\.\w)?)\./)[1];
				electionName = Utils.shortOrgName(links[0].innerText, electionSlug);
				electionGroup = (electionType == 'mayor' || electionType == 'pcc') ? electionType : electionSlug;
				
				if (!electionTypes[electionType]) electionTypes[electionType] = 'Unknown';
				if (!rowsAllSets[electionType]) rowsAllSets[electionType] = {};
				if (!rowsAllSets[electionType][electionGroup]) rowsAllSets[electionType][electionGroup] = {name: electionName, rows: []};
				
			}
			
			var postName = links[links.length - 1].innerText.trim();
			var html = e.outerHTML.trim().replace(/<td>[\s\S]*?<\/td>/, `<td><strong><a href="/elections/${electionSlug}/">${electionName}</a></strong></td>`);
			
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
			var elections = Object.values(rows).sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
			console.log(electionType, elections);
			
			$.each(elections, (i,election) => {
				
				var subheadText = description + (electionType == 'local' ? ` - ${election.name}` : '');
				newHTML += `<h4 class="sjo-posts-subhead">${subheadText}</h4>`;
				newHTML += `<table class="ballot_table">`;
				newHTML += theadHTML;
				
				var rowsHTML = election.rows
								.sort((a,b) => a.postName > b.postName ? 1 : a.postName < b.postName ? -1 : 0)
								.map(row => row.html).join('\n');
				newHTML += rowsHTML;
				
				newHTML += `</table>`;

			});
			
		});
		
		// Overwrite table with new HTML
		wrapper.html(newHTML);
		
	});
	
	// Add filter
	var filter = $('<input class="sjo-filter" id="sjo-filter" autocomplete="off">')
		.insertAfter('.filters')
		.wrap('<label for="sjo-filter"></label>')
		.before('Filter: ')
		.focus().on('change keyup', event => {
			console.log(event.originalEvent, filter.val());
			
			// Find rows that match filter text
			var filterText = filter.val().trim().toLowerCase();
			var rows = $('.sjo-posts-wrapper tbody tr').filter((i,e) => {
				var row = $(e);
				var rowText = row.find('td').slice(0, 2).text() + ' ' + row.find('a').eq(1).attr('href').replace(/.*\/elections\//, '');
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
	
});
