// ==UserScript==
// @name           Democracy Club duplicate suggestions
// @namespace      sjorford@gmail.com
// @version        2023.03.26.0
// @author         Stuart Orford
// @match          https://candidates.democracyclub.org.uk/duplicates/
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		table.table table thead {display: none;}
		table.table td {vertical-align: top;}
		table.table tr:last-of-type td {vertical-align: middle;}
	</style>`).appendTo('head');
	
	$('th:contains("Field")').closest('table.table').each((i,e) => {
		
		var table = $(e);
		var idRow = $('td', table).filter((i,e) => e.innerText.trim() == "ID").closest('tr').hide();
		var nameRow = $('td', table).filter((i,e) => e.innerText.trim() == "Name").closest('tr');
		
		var ids = $('td', idRow).slice(1).toArray().map(e => e.innerText.trim());
		$('td', nameRow).slice(1).html((i,html) => `<a href="/person/${ids[i]}">${html}</a> (${ids[i]})`);
		
		$('td', table).filter((i,e) => e.innerText.trim() == "No other names known").text('');
		
	});
	
	
});
})(jQuery);