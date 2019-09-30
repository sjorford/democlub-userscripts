// ==UserScript==
// @name        Democracy Club elections list
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/
// @version     2019.09.30.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/unicode.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.23.0/moment.min.js
// ==/UserScript==

// TODO:
// sort posts alphabetically
// fix names of elections/posts for mayor/pcc etc

$(`<style>
	.sjo-posts td {padding: .25rem; vertical-align: top;}
	.sjo-post-incomplete {background-color: #fdd !important;}
	.sjo-post-complete {background-color: #ffb !important;}
	.sjo-post-verified {background-color: #bbf7bb !important;}
	
	.ballot_table th, .ballot_table td {padding: 0.25rem;}
	.sjo-posts-heading-main {
		border: 1px solid #222;
		border-radius: 7px;
		padding: 0.25rem 0.5rem;
		width: 18rem;
	}
	.sjo-posts-heading-main {
		background-color: hsl(195, 80%, 60%);
		color: black;
		cursor: pointer;
	}


</style>`).appendTo('head');

$(function() {
	
	var electionTypes = 'parl,sp,naw,nia,pcc,gla,mayor,local'.split(',');
	
	$('.ballot_table').each((i,e) => {
		
		var table = $(e);
		table.find('th:contains("Candidates known")').text('Known');
		
		table.find('td:first-of-type a').each((i,e) => {
			var electionLink = $(e);
			electionLink.text(Utils.shortOrgName(electionLink.text()));
		});
		
		// Collapse May elections
		var heading = table.prev('h3').addClass('sjo-posts-heading');
		var date = moment(heading.text(), 'Do MMM YYYY');
		heading.html(date.format('D MMMM YYYY') 
				+ (date.day() == 4 ? '' : ` <small>(${date.format('dddd')})</small>`));
		if (date.month() == 4 && date.date() <= 7) {
			
			// Auto collapse
			var wrapper = $('<div></div>').insertBefore(table).append(table).hide();
			heading.addClass('sjo-posts-heading-main').html(`<span class="sjo-posts-may-heading">${heading.html()}</span>`).click(function() {
				wrapper.toggle();
			});
			
			// Create a table for each election type
			$.each(electionTypes, (i, electionType) => {
				var links = table.find(`td:first-of-type a[href*="/${electionType}."]`);
				if (links.length > 0) {
					var newTable = $(`<table class="ballot_table sjo-table-${electionType}"></table>`).appendTo(wrapper);
					table.find('thead').clone().appendTo(newTable);
					var rows = links.closest('tr');
					rows.nextUntil('tr:has(td:first-of-type a)').add(rows).appendTo(newTable)
				}
			});
			
		}
		
	});
	
	/*
	
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
	*/
	
});
