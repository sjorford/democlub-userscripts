// ==UserScript==
// @name           GE2024: Wikipedia pages
// @namespace      sjorford@gmail.com
// @version        2024.05.29.0
// @author         Stuart Orford
// @match          https://en.wikipedia.org/wiki/User:*/sandbox*
// @grant          none
//// @require        https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// ==/UserScript==

var timer = window.setInterval(jQueryCheck, 100);

function jQueryCheck() {
	if (!$) return;
	window.clearInterval(timer);
	//$('<script src="https://sjorford.github.io/js/sjo-jq.js"></script>').appendTo('head');
	timer = window.setInterval(sjoQueryCheck, 100);
}

function sjoQueryCheck() {
	if (!$.fn.indexCells) return;
	window.clearInterval(timer);
	
	$(`<style>
		.sjo-wrapper {max-height: 10em; overflow-y: scroll; border: 1px solid black;}
	</style>`).appendTo('head');
	
	var outputTable = $('<table></table>').prependTo('#mw-content-text')
			.wrap('<div class="sjo-wrapper"></div>').click(event => outputTable.selectRange());
	
	$('.vcard').closest('table').each((i,e) => {
		var electionTable = $(e);
		
		var caption = electionTable.find('caption').text().trim();
		if (caption.toLowerCase().match('by-election')) return;
		var match = caption.match(/^(?:Next |2024 )?(?:United Kingdom )?(?:[Gg]eneral )?[Ee]lection(?: 2024)?: (.+?)(?:\[\d+\])*$/);
		console.log(caption, match);
		caption = match ? match[1].trim() : caption;
		
		electionTable.find('.vcard').each((i,e) => {
			var vcard = $(e);
			var party = vcard.find('.org').text().trim();
			var name = vcard.find('.fn') .text().trim();
			if (name === '' || party === '') return; 
			var row = $('<tr></tr>').appendTo(outputTable);
			$('<td></td>').appendTo(row).text(caption);
			$('<td></td>').appendTo(row).text(party);
			$('<td></td>').appendTo(row).text(name);
		});
		
	});

//});
}
