// ==UserScript==
// @name           GE2024: Wikipedia pages
// @namespace      sjorford@gmail.com
// @version        2024.03.23.0
// @author         Stuart Orford
// @match          https://en.wikipedia.org/wiki/User:*/sandbox*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// ==/UserScript==

window.setTimeout(onready, 500);

function onready() {
$(function() {
	
	$(`<style>
		.sjo-wrapper {max-height: 10em; overflow-y: scroll; border: 1px solid black;}
	</style>`).appendTo('head');
	
	var outputTable = $('<table></table>').prependTo('#mw-content-text')
			.wrap('<div class="sjo-wrapper"></div>').click(event => outputTable.selectRange());
	
	$('.vcard').closest('table').each((i,e) => {
		var electionTable = $(e);
		
		var caption = electionTable.find('caption').text().trim();
		if (caption.toLowerCase().match('by-election')) return;
		var match = caption.match(/^(?:Next|202[45]) (?:United Kingdom )?(?:[Gg]eneral )?[Ee]lection: (.+?)(?:\[\d+\])*$/);
		console.log(caption, match);
		caption = match ? match[1].trim() : caption;
		
		electionTable.find('.vcard').each((i,e) => {
			var vcard = $(e);
			var row = $('<tr></tr>').appendTo(outputTable);
			var party = vcard.find('.org').text().trim();
			var name = vcard.find('.fn') .text().trim();
			if (name === '' || party === '') return; 
			$('<td></td>').appendTo(row).text(caption);
			$('<td></td>').appendTo(row).text(party);
			$('<td></td>').appendTo(row).text(name);
		});
		
	});

});
};
