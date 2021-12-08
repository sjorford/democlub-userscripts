// ==UserScript==
// @name           South Tyneside councillors scraper
// @namespace      sjorford@gmail.com
// @version        2021.12.08.0
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
	var rows = tables.find('tbody tr:has(a)')
	rows.find('a').text((i,text) => text.trim().replace(/^Councillor /, ''));
	tables.find('tr td:nth-of-type(2), tr th:nth-of-type(2)').remove();
	tables.first().append(rows).find('caption').remove();
	tables.not(tables.first()).remove();
	
});
})(jQuery.noConflict());
