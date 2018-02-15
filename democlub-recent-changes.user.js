// ==UserScript==
// @name           Democracy Club recent changes
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.02.15
// @match          https://candidates.democracyclub.org.uk/recent-changes*
// @grant          none
// @require        https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

var maxUrlLength = 40;

$(`<style>
	.sjo-nowrap {white-space: nowrap;}
	.sjo-number {text-align: right;}
</style>`).appendTo('head');

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	var username = 'sjorford'; // TODO: get this from top of page?
	var now = moment();
	
	// Get table and headings
	var table = $('.container table').addClass('sjo-lesspadding');
	table.find('th').addClass('sjo-nowrap');
	var headings = Utils.tableHeadings(table);
	
	table.find('tr').each(function(index, element) {
		var row = $(element);
		var cells = row.find('td');
		if (cells.length === 0) return;
		
		// Reformat dates
		var dateCell = cells.eq(headings['Date and time']);
		var time = moment(dateCell.html().replace(/\./g, ''), 'MMMM D, YYYY, h:mm a');
		dateCell.html(time.format('D MMM' + (time.year() == now.year() ? '' : ' YYYY') + ' HH:mm'));
			
		// Stop columns wrapping
		dateCell.add(cells.eq(headings['Action'])).addClass('sjo-nowrap');
		
		// Add links
		var sourceCell = cells.eq(headings['Information source']);
		sourceCell.html(Utils.formatLinks(sourceCell.html(), maxUrlLength));
		
		// Highlight my changes
		if (cells.eq(headings['User']).text() == username) {
			row.addClass('sjo-mychanges');
		}
		
		// Flag all rows by action
		row.addClass('sjo-changes-' + cells.eq(headings['Action']).text());
		
	});
	
}
