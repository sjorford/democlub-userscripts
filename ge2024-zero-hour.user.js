// ==UserScript==
// @name           GE2024: Zero Hour
// @namespace      sjorford@gmail.com
// @version        2024.03.16.0
// @author         Stuart Orford
// @match          https://action.zerohour.uk/sitemap
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// @require        https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// ==/UserScript==

jQuery.noConflict();

(function($) {
$(function() {
	
	$(`<style>
		.sjo-wrapper {background-color: white; color: black; max-height: 10em; overflow-y: scroll;}
		.sjo-wrapper td {padding: 0 0.5em;}
	</style>`).appendTo('head');
	
	var outputTable = $('<table class="sjo-table"></table>').insertBefore('.sitemap-grid')
			.wrap('<div class="sjo-wrapper"></div>')
			.click(() => outputTable.selectRange());
	
	var urls = $('.sitemap-grid a').toArray().map(a => a.href);
	
	$('<input type="button" value="Download" id="sjo-download">').insertBefore('.sitemap-grid').click(startDownload);
	
	function startDownload() {
		$('#sjo-download').hide();
		getNextPage();
	}
	
	function getNextPage() {
		if (urls.length == 0) return;
		var url = urls.shift();
		$.get(url, parsePage);
	}
	
	function parsePage(data) {
		
		var doc = (new DOMParser()).parseFromString(data, "text/html");
		
		var constituency = $('title', doc).text().match(/(.+) General Election/)[1];
		
		$('.candidate', doc).each((i,e) => {
			
			var name = $('.candidate-name', e).text();
			var party = $('.candidate-party', e).text();
			
			var outputRow = $('<tr></tr>').appendTo(outputTable);
			$('<td></td>').appendTo(outputRow).text(constituency);
			$('<td></td>').appendTo(outputRow).text(name);
			$('<td></td>').appendTo(outputRow).text(party);
			
		});
		
		getNextPage();
		
	}
	
});
})(jQuery);
