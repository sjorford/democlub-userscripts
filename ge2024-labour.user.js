// ==UserScript==
// @name           GE24: Labour
// @namespace      sjorford@gmail.com
// @version        2024.03.06.0
// @author         Stuart Orford
// @match          https://vote.labour.org.uk/results
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// @require        https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		.sjo-wrapper {background-color: white; color: black}
		.sjo-wrapper td {padding: 0 0.5em;}
	</style>`).appendTo('head');
	
	var outputTable = $('<table class="sjo-table"></table>').prependTo('main')
			.wrap('<div class="sjo-wrapper"></div>')
			.click(() => outputTable.selectRange());
	
	$('.grid > div').each((i,e) => {
		
		var box = $(e);
		var constituency = box.find('p').last().text().trim();
		var candidate = box.find('p.font-bold').first().text().trim();
		var incumbent = box.find('p:contains("Sitting MP")').text().trim();
		
		var outputRow = $('<tr></tr>').appendTo(outputTable);
		$('<td></td>').appendTo(outputRow).text(constituency);
		$('<td></td>').appendTo(outputRow).text(candidate);
		$('<td></td>').appendTo(outputRow).text(incumbent);
	
	});
	
});
})(jQuery);
