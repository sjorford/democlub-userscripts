// ==UserScript==
// @name           Democracy Club homepage
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.03.19.0
// @match          https://candidates.democracyclub.org.uk/
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// ==/UserScript==

$(function() {
	
	$(`<style class="sjo-styles">
		.sjo-table th, .sjo-table td {padding: .35rem}
	</style>`).appendTo('head');
	
	var futureTable = $('h3:contains("Upcoming by-elections")').next('table');
	futureTable.find('thead tr:first-of-type th:contains("Candidates known")').text('Known');
	formatElectionsTable(futureTable);
	
	var pastTable = $('h3:contains("Recently past elections")').next('table');
	formatElectionsTable(pastTable);
	
	function formatElectionsTable(table) {
		
		table.addClass('sjo-table');
		
		var headerRows = table.find('tbody tr:has(th)');
		headerRows.each((index, element) => {

			// Fix width of subheading
			var headerRow = $(element);
			headerRow.find('th').attr('colspan', '4');
			
			// Loop through rows
			var contentRows = headerRow.nextUntil(headerRows);
			contentRows.each((index, element) => {
				var row = $(element);
				
				// Trim election names
				var electionLink = row.find('td').first().find('a');
				var electionName = electionLink.text().replace(/ local election$/, '');
				electionName = Utils.shortOrgName(electionName);
				electionLink.text(electionName);
				
				// Change lock icons
				var lockCell = row.find('td').eq(3);
				if (lockCell.text().trim() == Unicode.OPEN_LOCK) {
					lockCell.text(Unicode.BUSTS_IN_SILHOUETTE);
				} else if (lockCell.text().trim() == 'No') {
					lockCell.text('');
				}
				
			});

			// Sort elections
			var sortedRows = contentRows.toArray().sort((a, b) => {

				var a0 = a.cells[0].innerText;
				var a1 = a.cells[1].innerText;
				var b0 = b.cells[0].innerText;
				var b1 = b.cells[1].innerText;

				return (
					a0 > b0 ?  1 : 
					a0 < b0 ? -1 : 
					a1 > b1 ?  1 : 
					a1 < b1 ? -1 : 
					0);

			});

			console.log(sortedRows);

			headerRow.after(sortedRows);

		});

	}
	
});
