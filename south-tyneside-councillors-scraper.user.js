// ==UserScript==
// @name           South Tyneside councillors scraper
// @namespace      sjorford@gmail.com
// @version        2021.12.08.3
// @author         Stuart Orford
// @match          https://www.southtyneside.gov.uk/article/60209/Councillors-A-to-Z*
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		.id-atoz {display: none;}
	</style>`).appendTo('head');
	
	var tables = $('#COUNCILLORSLISTBYNAME_PAGE1_HTML table');
	tables.find('caption').remove();
	
	tables.find('tr').each((i,e) => {
		var row = $(e);
		var nameCell  = row.find('td, th').eq(0);
		var imageCell = row.find('td, th').eq(1);
		var wardCell  = row.find('td, th').eq(2);
		wardCell.insertBefore(nameCell);
		imageCell.remove();
	});
	
	var rows = tables.find('tbody tr:has(a)')
	rows.each((i,e) => {
		var row = $(e);
		row.prepend('<td>South Tyneside</td>');
		var link = row.find('a');
		var name = link.closest('td').text().trim().replace(/^Councillor /, '');
		link.closest('td').text(name);
		$('<td></td>').text('[South Tyneside:' + name + ']').appendTo(row);
	});
	
	tables.first().append(rows).find('thead tr')
		.prepend('<th>Council</th>').append('<th>URL</th>');
	tables.not(tables.first()).remove();
	
});
})(jQuery.noConflict());
