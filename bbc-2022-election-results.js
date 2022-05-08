// ==UserScript==
// @name           BBC 2022 election results
// @namespace      sjorford@gmail.com
// @version        2022.05.07.0
// @author         Stuart Orford
// @match          https://www.bbc.co.uk/news/uk-politics-60695244
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		.sjo-textarea {width:100%; height: 10em;}
	</style>`).appendTo('head');
	
	var outputArea = $('<textarea class="sjo-textarea"></textarea>').insertAfter('#main-heading')
			.click(event => event.target.select());
	var allUrls = [];
	var allResults = [];
	
	$.get('https://www.bbc.co.uk/news/election/2022/england/councils', parseCountry);
	$.get('https://www.bbc.co.uk/news/election/2022/wales/councils', parseCountry);
	$.get('https://www.bbc.co.uk/news/election/2022/scotland/councils', parseCountry);
	
	function parseCountry(data) {
		var doc = $(data);
		var links = $('a[class*="-EntryLink"]', doc);
		var urls = links.toArray().map(e => e.href);
		allUrls = allUrls.concat(urls);
		getNextCouncil();
	}
	
	function getNextCouncil() {
		if (allUrls.length == 0) return;
		var url = allUrls.shift();
		console.log(url);
		$.get(url, parseCouncil);
	}
	
	function parseCouncil(data) {
		var doc = $(data);
		var council = $('h2[id="basic-scoreboard"]', doc).text().replace(/ scoreboard$/, '');
		var wrappers = $('div[class*="-ScorecardWrapper"]', doc);
		var results = wrappers.each((i,e) => {
			var party = $('span[class*="-Title"]', e).text();
			var numbers = $('span[class*="-ResultValue"]', e).toArray().map(e => e.innerText.trim());
			allResults.push(council + '\t' + party + '\t' + numbers.join('\t'));
		});
		outputArea.text(allResults.join('\n'));
		window.setTimeout(getNextCouncil, 0);
	}
	
});
})(jQuery.noConflict());
