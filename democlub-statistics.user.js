// ==UserScript==
// @name        Democracy Club statistics
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/numbers/
// @version     2018.08.27.0
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
	</style>`).appendTo('head');
	
	var futureTable = $('<table class="sjo-stats"></table>');
	var cutoffDate = moment().add(30, 'days');
	var mayDate = moment('2019-05-02');
	
	$('.statistics-elections').each(function(index, element) {
		var wrapper = $(element);
		
		var table = $('<table class="sjo-stats"></table>')
			.insertAfter(wrapper.find('h2'));
		
		if (wrapper.hasClass('current')) {
			futureTable.insertAfter(wrapper).wrap('<div class="statistics-elections">').before('<h2>Future Elections </h2>');
		}
		
		var lastDate = null;
		
		$('div', wrapper).each(function(index, element) {
			
			var div = $(element);
			
			var id = div.attr('id');
			id = id == 'statistics-election-2010' ? 'statistics-election-parl-2010-05-06' : id == 'statistics-election-2015' ? 'statistics-election-parl-2015-05-07' : id;
			
			var matchId = id.match(/^statistics-election-((parl|sp|naw|nia|gla|mayor|pcc|local)(-(a|r|c))?(-([-a-z]{2,}))?)-(\d{4}-\d{2}-\d{2})$/);
			
			var headerText = div.find('h4').text();
			var matchHeader = headerText.match(/^Statistics for the (\d{4} )?(.+?)( (local|[Mm]ayoral))?( [Ee]lection|by-election: (.*) (ward|constituency))?( \((.+)\))?$/, '');
			
			if (matchId && matchHeader) {
				
				var key = matchId[2] + (matchId[3] ? '.' + matchId[4] : '') + (matchId[5] ? '.' + matchId[6] : '');
				var type = matchId[2];
				var date = matchId[7];
				var area = Utils.shortOrgName(matchHeader[2]) + (matchHeader[8] ? matchHeader[8] : '');
				
				var bullets = div.find('li');
				
				var row = $('<tr></tr>')
					.addCell(date)
					.addCellHTML(`<a href="/election/${key}.${date}/constituencies">${area}</a>`)
					.addCell(key);
				
				if (date != lastDate) {
					row.addClass('sjo-stats-break');
					lastDate = date;
				}
				
				bullets.each(function(index, element) {
					var bullet = $(element);
					var link = bullet.find('a');
					if (link.length > 0) {
						link.html(link.html()
							.replace(/^Candidates per /, 'by ')
							.replace(/^See progress towards locking all posts$/, 'progress'));
						$('<td class="sjo-nowrap"></td>').append(link).appendTo(row);
						bullet.addClass('sjo-remove');
					} else if (bullet.text().indexOf(':') >= 0) {
						var num = bullet.text().split(':')[1].trim();
						row.addCell(num, 'sjo-number' + (num == '0' ? ' sjo-number-zero' : ''));
						bullet.addClass('sjo-remove');
					}
				});
				
				if (moment(date).isAfter(cutoffDate) && moment(date).isSameOrAfter(mayDate)) {
					row.appendTo(futureTable);
				} else {
					row.appendTo(table);
				}
				
				$('.sjo-remove').remove();
				if (div.find('li').length === 0) {
					div.remove();
				}
				
			}
			
		});
		
		$('h3, h4', wrapper).filter((index, element) => {
			var heading = $(element);
			return heading.next().length == 0 || heading.next('h3, h4').length > 0;
		}).remove();
		
	});
	
	$('.statistics-elections').each((index, element) => {
		var wrapper = $(element);
		Utils.collapseSection(wrapper.find('.sjo-stats'), wrapper.find('h2'), wrapper.hasClass('current'));
	});
	
	$('body').on('click', '.sjo-stats', event => {
		if (event.target.tagName != 'A') {
			$(event.target).closest('.sjo-stats').selectRange();
		}
	});
	
}
