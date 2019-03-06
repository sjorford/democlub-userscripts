// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/
// @version     2019.03.06.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.23.0/moment.min.js
// ==/UserScript==

$(`<style>
	.sjo-posts td {padding: .25rem; vertical-align: top;}
	.sjo-post-incomplete {background-color: #fdd !important;}
	.sjo-post-complete {background-color: #ffb !important;}
	.sjo-post-verified {background-color: #bbf7bb !important;}
	.content h2 {border-bottom: 1px solid #aaa;}
	.sjo-posts-may-button {font-size: 0.875rem; margin-left: 1rem;}
	xxx.sjo-slug {font-size: 0.65rem;}
</style>`).appendTo('head');

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	var byTable;
	
	var dateHeadings = $('.content h2');
	dateHeadings.each((index, element) => {
		
		var h2 = $(element);
		var date = moment(h2.text(), 'Do MMM YYYY');
		
		// Find ballots on this date
		var lists = h2.nextUntil('h2', 'ul');
		if (lists.find('li').length > 50) {
			
			// Separate out big election days
			var wrapper = $('<div class="sjo-posts-may"></div>').append(h2.nextUntil('h2').hide()).insertAfter(h2);
			var expandButton = $(`<a class="sjo-posts-may-button">[Expand]</a>`).appendTo(h2).click(toggleMayElections);
			var collapseButton = $(`<a class="sjo-posts-may-button">[Collapse]</a>`).appendTo(h2).click(toggleMayElections).hide();
			showMayElections();
			
			function toggleMayElections() {
				
				wrapper.toggle();
				expandButton.toggle();
				collapseButton.toggle();
				showMayElections();
				
			}
			
			function showMayElections() {
				
				if (wrapper.is(':visible') && !wrapper.is('.sjo-processed')) {
					
					var localTable = $('<table class="sjo-posts"></table>').prependTo(wrapper);
					var mayorTable = $('<table class="sjo-posts"></table>').insertAfter(localTable);
					processLists(lists, localTable, mayorTable, date);
					wrapper.addClass('sjo-processed');
					
					var numMayors = mayorTable.find('tr').length;
					if (numMayors > 0) {
						mayorTable.before(`<h3>Mayoral elections (${numMayors})</h3>`);
					}
					
				}
				
			}
			
		} else {
			
			// Otherwise, add to main table
			byTable = byTable || $('<table class="sjo-posts"></table>').insertBefore(dateHeadings.first());
			
			processLists(lists, byTable, null, date);
			
			h2.hide();
			h2.nextUntil('h2', 'h3').hide();
			
		}
		
	});
	
	byTable.before(`<h2>By-elections (${byTable.find('tr').length})</h2>`);
	
	$('body').on('click', '.sjo-posts', event => {
		if (!$(event.target).is('a')) $(event.currentTarget).selectRange();
	});
	
	function processLists(lists, localTable, mayorTable, date) {
		
		lists.each((index, element) => {
			
			var table;
			var list = $(element).hide();
			var items = list.find('li');
			
			var h4 = list.prev('h4').hide();
			var a = h4.find('a');
			
			var election = Utils.shortOrgName(h4.text());
			var electionUrl = h4.find('a').attr('href');
			
			items.each((index, element) => {
				var listItem = $(element);
				
				var post = listItem.find('a').text();
				var postUrl = listItem.find('a').attr('href');
				var postSlug = postUrl.match(/^\/elections\/(.+?)(\.by)?\.\d{4}-\d{2}-\d{2}\/$/)[1];
				var lock = listItem.find('abbr').text();
				
				if (mayorTable && postUrl.match(/\/elections\/mayor\./)) {
					post = Utils.shortOrgName(post);
					table = mayorTable;
				} else {
					table = localTable;
				}
				
				$('<tr></tr>')
					.addCell(lock)
					.addCell(date.format('YYYY-MM-DD'))
					.addCellHTML(`<a href="${electionUrl}">${election}</a>`)
					.addCellHTML(`<a href="${postUrl}">${post}</a>`)
					.addCellHTML(`${postSlug}`, 'sjo-slug')
					.addClass(
						date.format('YYYY-MM-DD') == '2019-05-02' ? '' : 
						lock == Unicode.OPEN_LOCK ? 'sjo-post-complete' : 
						lock == Unicode.CLOSED_LOCK_WITH_KEY ? 'sjo-post-verified' : 
						'sjo-post-incomplete')
					.appendTo(table);
				
			});
			
		});
		
	}
	
}
