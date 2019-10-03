// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/
// @version     2019.10.03.2
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
	.sjo-posts-heading-main {
		border: 2px solid #222;
		padding: 0.25rem 0.5rem;
	}
	.sjo-posts-heading-main {
		background-color: hsl(195, 80%, 60%);
		color: black;
		cursor: pointer;
	}


</style>`).appendTo('head');

$(function() {
	
	var electionTypes = [
		{type: 'parl',     description: 'UK Parliament'},
		{type: 'europarl', description: 'European Parliament'},
		{type: 'sp',       description: 'Scottish Parliament'},
		{type: 'naw',      description: 'Welsh Assembly'},
		{type: 'nia',      description: 'Northern Ireland Assembly'},
		{type: 'pcc',      description: 'Police and Crime Commissioner'},
		{type: 'gla',      description: 'Greater London Assembly'},
		{type: 'mayor',    description: 'Mayoral elections'},
		{type: 'local',    description: 'Local elections'},
	];
	
	$('.ballot_table').each((i,e) => {
		
		var table = $(e);
		table.find('th:contains("Candidates known")').text('Known');
		
		// Format heading
		var heading = table.prev('h3').addClass('sjo-posts-heading');
		var date = moment(heading.text(), 'Do MMM YYYY');
		heading.html(date.format('D MMMM YYYY') 
			+ (date.day() == 4 ? '' : ` <small>(${date.format('dddd')})</small>`));
		
		// Wrap table
		var wrapper = $('<div></div>').insertBefore(table).append(table);
		heading.click(() => wrapper.toggle());
		
		// Split May elections only
		if (!(date.month() == 4 && date.date() <= 7 && date.day() == 4)) return;
		heading.addClass('sjo-posts-heading-main');
		
		// Create a table for each election type
		$.each(electionTypes, (index, electionType) => {
			var links = table.find(`td:first-of-type a[href*="/${electionType.type}."]`);
			if (links.length > 0) {
				
				var subTable = $(`<table class="ballot_table"></table>`).appendTo(wrapper);
				table.find('thead').clone().appendTo(subTable);
				$('<h4></h4>').text(electionType.description).insertBefore(subTable);
				
				// Find all rows for this election
				links.each((index, element) => {
					
					var link = $(element);
					var slug = link.attr('href').match(/\/elections\/(.*)\//)[1];
					var electionName = Utils.shortOrgName(link.text(), slug);
					link.text(electionName);
					
					var firstRow = $(element).closest('tr');
					var rows = firstRow.nextUntil('tr:has(td:first-of-type a)').add(firstRow);
					if (rows.length > 5) {
						
						// Separate out whole elections
						var electionTable = $(`<table class="ballot_table"></table>`).appendTo(wrapper);
						table.find('thead').clone().appendTo(electionTable);
						$('<h4></h4>').text(electionType.description + (electionType.type == 'local' ? ' - ' + electionName : '')).insertBefore(electionTable);
						
						// Sort posts
						var sortedRows = rows.toArray().sort((a,b) => a.cells[1].innerText < b.cells[1].innerText ? -1 : a.cells[1].innerText > b.cells[1].innerText ? 1 : 0);
						electionTable.append(sortedRows);
						electionTable.find('tbody tr:first-of-type td:first-of-type').append(firstRow.find('td:first-of-type').contents());
						
					} else {
						
						// Put all other elections in a catch-all table
						subTable.append(rows);
						
					}
					
				});
				
				if (subTable.find('tbody tr').length == 0) {
					subTable.prev('h4').remove();
					subTable.remove();
				}
				
			}
			
		});
		
		if (table.find('tbody tr').length == 0) table.remove();
		
	});
	
});
