// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/*
// @version     2021.01.15.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.23.0/moment.min.js
// ==/UserScript==

// TODO:
// sort posts alphabetically
// fix names of elections/posts for mayor/pcc etc

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
				rowsAllSets[electionType][electionGroup] = {name: electionName, rows: []};
				
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
		
		return;
		
		var table = $(e);
		table.find('th:contains("Candidates known")').text('Known');
		
		// Format heading
		var heading = table.prev('h3').addClass('sjo-posts-heading');
		var date = moment(heading.text(), 'Do MMM YYYY');
		heading.html(date.format('D MMMM YYYY') 
			+ (date.day() == 4 ? '' : ` <small>(${date.format('dddd')})</small>`));
		
		// Wrap table
		var wrapper = $('<div class="sjo-posts-wrapper"></div>').insertBefore(table).append(table);
		heading.click(() => wrapper.toggle());
		
		// Format election names
		var links = table.find(`td:first-of-type a`);
		links.each((index, element) => {
			
			var link = $(element);
			var slug = link.attr('href').match(/\/elections\/(.*)\//)[1];
			var electionName = Utils.shortOrgName(link.text(), slug);
			electionName = electionName.trim().replace(/ elections \((Constituencies|Regions|Additional)\)$/, '');
			link.text(electionName);
			
			// Copy election names down
			var firstCell = link.closest('td')
			var firstRow = firstCell.closest('tr').addClass('sjo-firstrow');
			firstRow.nextUntil('tr:has(td:first-of-type a)').find('td:first-of-type').html(firstCell.html());
			
		});
		
		// Split large elections only
		//if (!(date.month() == 4 && date.date() <= 7 && date.day() == 4)) return;
		if (table.find('tr').length < 50) return;
		heading.addClass('sjo-posts-heading-main');
		
		// Create TOC
		var tocWrapper = $('<div></div>').appendTo(wrapper);
		var toc = $('<ul class="sjo-toc"></ul>').appendTo(tocWrapper);
		
		// Create a table for each election type
		$.each(electionTypes, (index, electionType) => {
			var links = table.find(`.sjo-firstrow td:first-of-type a[href*="/${electionType.type}."]`);
			if (links.length > 0) {
				
				var subTable = $(`<table class="ballot_table"></table>`).appendTo(wrapper);
				table.find('thead').clone().appendTo(subTable);
				var subhead = $(`<h4 class="sjo-posts-subhead" id="sjo-posts-subhead-${electionType.type}"></h4>`).text(electionType.description).insertBefore(subTable);
				var tocEntry = $('<li></li>').appendTo(toc);
				var tocEntryLink = $(`<a href="#sjo-posts-subhead-${electionType.type}"></a>`).text(electionType.description).appendTo(tocEntry);
				var tocMore = $('<ul class="sjo-toc"></ul>').appendTo(tocWrapper);
				
				// Find all rows for this election
				links.each((index, element) => {
					
					var link = $(element);
					var slug = link.attr('href').match(/\/elections\/(.*)\//)[1];
					
					var firstRow = $(element).closest('tr');
					var rows = firstRow.nextUntil('.sjo-firstrow').add(firstRow);
					
					if (rows.length > 4) {
						
						// Separate out whole elections
						var electionTable = $(`<table class="ballot_table"></table>`).appendTo(wrapper);
						table.find('thead').clone().appendTo(electionTable);
						var subhead = $(`<h4 class="sjo-posts-subhead" id="sjo-posts-subhead-${slug}"></h4>`).text(electionType.description).insertBefore(electionTable);
						if (electionType.type == 'local') {
							subhead.text(subhead.text() + ' - ' + link.text());
							var tocMoreEntry = $('<li></li>').appendTo(tocMore);
							$(`<a href="#sjo-posts-subhead-${slug}"></a>`).text(link.text()).appendTo(tocMoreEntry);
						}
						
						// Sort posts
						var sortedRows = rows.toArray().sort((a,b) => a.cells[1].innerText < b.cells[1].innerText ? -1 : a.cells[1].innerText > b.cells[1].innerText ? 1 : 0);
						electionTable.append(sortedRows);
						
					} else {
						
						// Put all other elections in a catch-all table
						subTable.append(rows);
						
					}
					
				});
				
				// Remove catch-all table if empty
				if (subTable.find('tbody tr').length == 0) {
					tocEntryLink.attr('href', '#' + subTable.nextAll('h4').first().attr('id'));
					subTable.prev('h4').remove();
					subTable.remove();
				}
				
				// Add link to open sub-TOC
				if (tocMore.children().length > 0) {
					$('<a href="#">(more...)</a>').click(event => tocMore.toggle() && false).appendTo(tocEntry).before(' ');
				} else {
					tocMore.remove();
				}
				
			}
			
		});
		
		if (table.find('tbody tr').length == 0) table.remove();
		
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
