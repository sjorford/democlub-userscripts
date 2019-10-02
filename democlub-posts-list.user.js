// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/
// @version     2019.10.02.0
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
		border: 1px solid #222;
		border-radius: 7px;
		padding: 0.25rem 0.5rem;
		width: 18rem;
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
		var wrapper = $('<div></div>').insertBefore(table).append(table);
		
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
						
						// Sort posts
						var sortedRows = rows.toArray().sort((a,b) => a.cells[1].innerText < b.cells[1].innerText ? -1 : a.cells[1].innerText > b.cells[1].innerText ? 1 : 0);
						
						// Separate out whole elections
						var electionTable = $(`<table class="ballot_table"></table>`).appendTo(wrapper);
						table.find('thead').clone().appendTo(electionTable);
						electionTable.append(sortedRows);
						$('<h4></h4>').text(electionType.description + ' - ' + electionName).insertBefore(electionTable);
						
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
		
		return;
		
		table.find('td:first-of-type a').each((i,e) => {
			var electionLink = $(e);
			var slug = electionLink.attr('href').match(/\/elections\/(.*)\//)[1];
			electionLink.text(Utils.shortOrgName(electionLink.text(), slug));
			//var postLink = $(e).next('td'
		});
		
		// Collapse May elections
		var heading = table.prev('h3').addClass('sjo-posts-heading');
		var date = moment(heading.text(), 'Do MMM YYYY');
		heading.html(date.format('D MMMM YYYY') 
				+ (date.day() == 4 ? '' : ` <small>(${date.format('dddd')})</small>`));
		if (date.month() == 4 && date.date() <= 7) {
			
			// Auto collapse
			var wrapper = $('<div></div>').insertBefore(table).append(table).hide();
			heading.addClass('sjo-posts-heading-main').html(`<span class="sjo-posts-may-heading">${heading.html()}</span>`).click(function() {
				wrapper.toggle();
			});
			
		
			// Create a table for each election type
			$.each(electionTypes, (i, electionType) => {
				var links = table.find(`td:first-of-type a[href*="/${electionType}."]`);
				if (links.length > 0) {
					var newTable = $(`<table class="ballot_table sjo-table-${electionType}"></table>`).appendTo(wrapper);
					table.find('thead').clone().appendTo(newTable);
					var rows = links.closest('tr');
					rows.nextUntil('tr:has(td:first-of-type a)').add(rows).appendTo(newTable)
				}
			});
			
		
		}
		
	});
	
});
