// ==UserScript==
// @name        Democracy Club statistics
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/numbers/*
// @version     2020.04.28.1
// @isitfast    yes
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-stats {font-size: 9pt;}
		.sjo-stats tr {background-color: inherit !important;}
		.sjo-stats td, .sjo-stats th {padding: 4px;}
		.sjo-stats-break {border-top: solid 1px #ddd;}
		.sjo-number {text-align: center;}
		.sjo-number-zero {background-color: rgb(255, 230, 153);}
		.sjo-collapsiblesection-buttons {font-size: small;}
		.sjo-nowrap {white-space: nowrap;}
		input.sjo-filter {display: inline-block; width: 30ex; padding: 5px; height: auto;}
		.sjo-hidden {display: none;}
	</style>`).appendTo('head');
	
	// New version - produce raw HTML for speed
	var sections = $('.statistics-elections').each(function(index, element) {
		
		var html = element.innerHTML;
		var htmlSplit = html.match(/([\s\S]+)(<h3>[\s\S]+)/);
		var blocks = htmlSplit[1].replace(/(<h3>)/g, '🤒$1').split('🤒');
		var lastDate = null;
		
		for (var blockIndex = 1; blockIndex < blocks.length; blockIndex++) {
			
			var bits = blocks[blockIndex].replace(/(<h4>[\s\S]*?<div[\s\S]*?<h4>)/g, '😤$1').split('😤');
			for (var bitIndex = 1; bitIndex < bits.length; bitIndex++) {
				
				var bitMatch = bits[bitIndex].match(/<div id="(.*?)">\s*<h4>(.*?)<\/h4>\s*<ul>\s*<li>Total candidates: (\d+)<\/li>([\s\S]*?)<\/ul>/);

				var id = bitMatch[1];
				var matchId = id.match(/^statistics-election-((parl|sp|naw|nia|gla|mayor|pcc|local|europarl)(-(a|r|c))?(-([-a-z]{2,}))?)-(\d{4}-\d{2}-\d{2})$/);
				
				var headerText = bitMatch[2];
				var matchHeader = headerText.match(/^Statistics for the (\d{4} )?(.+?)( (local|[Mm]ayoral))?( [Ee]lection|by-election: (.*) (ward|constituency))?( \((.+)\))?$/, '');
				
				var key = matchId[2] + (matchId[3] ? '.' + matchId[4] : '') + (matchId[5] ? '.' + matchId[6] : '');
				var type = matchId[2];
				var date = matchId[7];
				var area = Utils.shortOrgName(matchHeader[2]) + (matchHeader[8] ? matchHeader[8] : '');
				
				var num = bitMatch[3];
				var items = bitMatch[4]
								.replace(/<(\/)?li>/g, '<$1td class="sjo-nowrap">')
								.replace(/Candidates per/g, 'by')
								.replace(/See progress towards locking all posts/, 'progress');
				
				bits[bitIndex] = `
<tr${date != lastDate ? ' class="sjo-stats-break"' : ''}>
<td>${date}</td>
<td><a href="/election/${key}.${date}/constituencies">${area}</a></td>
<td>${key}</td>
<td class="sjo-number${num == '0' ? ' sjo-number-zero' : ''}">${num}</td>
${items}
</tr>`;
				
				lastDate = date;
			}
			
			blocks[blockIndex] = bits.slice(1).join('');
		}
		
		html = '<table class="sjo-stats">' + blocks.join('') + '</table>';
		element.innerHTML = html;
	});
	
	// Add filter
	var filter = $('<input class="sjo-filter" id="sjo-filter" autocomplete="off">')
		.insertBefore(sections.first())
		.wrap('<label for="sjo-filter"></label>')
		.before('Filter: ')
		.focus().on('change keyup', event => {
			console.log(event.originalEvent, filter.val());
			var filterText = filter.val().trim().toLowerCase();
			$('.sjo-stats tr').each((i,e) => {
				var row = $(e);
				row.toggleClass('sjo-hidden', !row.text().trim().toLowerCase().match(filterText));
			});
		});
	
	// Sort lists of posts
	var postsTableBody = $('.counts_table tbody');
	postsTableBody.append(
		postsTableBody.find('tr').toArray()
			.sort((a,b) => a.innerText < b.innerText ? -1 : a.innerText > b.innerText ? 1 : 0));
	
}
