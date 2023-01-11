// ==UserScript==
// @name           Democracy Club recent changes
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2023.01.11.0
// @match          https://candidates.democracyclub.org.uk/recent-changes*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style class="sjo-styles">
		
		.recent-changes {margin-top: 1.25rem;}
		.recent-changes td, .recent-changes th {padding: 4px;}
		.sjo-nowrap {white-space: nowrap;}
		.sjo-number {text-align: right;}
		.recent-changes > tbody + tbody::before {display: none;}
		.recent-changes th:nth-of-type(3) {min-width: 10em;}
		.recent-changes th:nth-of-type(5) {width: 50%;}
		
		.sjo-changes-mine {background-color: #ffeb99 !important;}
		.sjo-changes-bot {background-color: #e7e7e7 !important;}
		.sjo-changes-internal {background-color: #d5646496 !important;}
		.sjo-changes-candidacy-deleted {background-color: pink !important;}
		.sjo-changes-photo-uploaded *, .sjo-changes-photo-approved *, 
		.sjo-changes-photo-rejected *, .sjo-changes-photo-ignored * {color: #ccc !important;}
		
		.sjo-filters label {display: inline; font-weight: bold;}
		.sjo-filters-detail {display: inline-block; margin-right: 2em; font-size: .875rem;}
		
		.sjo-fieldname {
			background-color: #ffb;
			font-style: normal;
			font-size: 8pt;
			padding: 0 5px;
			border: thin lightgray solid;
			border-radius: 5px;
			white-space: nowrap;
			margin: 3px 3px 0 0;
			display: inline-block;
		}

	</style>`).appendTo('head');
	
	var maxUrlLength = 80;
	var username = $('.nav-links__item:contains("Signed in as") strong').text().trim();
	
	// Get table
	var table = $('.container table');
	table.find('th').addClass('sjo-nowrap');
	table.closest('.container').css({maxWidth: 'fit-content'});
	var rows = table.find('tbody:not(.diff-row) > tr');
	
	// Split date into separate column
	rows.each(function(index, element) {
		var row = $(element);
		var td = row.find('td').first();
		$('<td></td>').append(td.find('a')).insertAfter(td);
	});
	table.find('th').first().before('<th class="sjo-nowrap">Date</th>');
	
	// Get headings
	var headings = Utils.tableHeadings(table);
	table.find('th').eq(headings['Edited']).text('Candidate');
	table.find('th').eq(headings['Flagged']).text('');
	table.find('th').eq(headings['View diff']).text('Diff');
	
	rows.each(function(index, element) {
		var row = $(element);
		var cells = row.find('td');
		if (cells.length === 0) return;
		
		// Add links
		var sourceCell = cells.eq(headings['Source']);
		var sourceText = sourceCell.html();
		sourceCell.html(Utils.formatLinks(sourceText, maxUrlLength));
		
		// Flag internally-sourced edits
		if (sourceText.trim().match(/democracyclub/) && !sourceText.trim().match(/sopn/)) {
			row.addClass('sjo-changes-internal');
		}
		
		// Highlight my changes
		if (cells.eq(headings['User']).text().trim() == username) {
			row.addClass('sjo-changes-mine');
		}
		
		// Flag all rows by action
		row.addClass('sjo-changes-' + slugify(cells.eq(headings['Change']).contents().first().text()));
		
		// Flag bot edits
		if (cells.eq(headings['User']).text().trim().match(/Bot$/)) {
			row.addClass('sjo-changes-bot');
			if (cells.eq(headings['Information source']).text().match(/This Twitter .* no longer exists; removing it/)) {
				row.addClass('sjo-changes-twitter-removed');
			}
		}
		
		// Format field names
		cells.eq(headings['Change']).find('em').each((i,e) => {
			var em = $(e);
			em.html(em.html().replace(/Ppc/g, 'PPC').replace(/Url/g, 'URL')
					.replace(/([^\s,][^,]+)(, )?/g, '<span class="sjo-fieldname">$1</span>'));
		});
		
		// Show ID numbers
		cells.eq(headings['Edited']).find('a').each((i,e) => {
			var a = $(e);
			a.after(' (' + a.attr('href').match(/(\d+)/)[1] + ')');
		});
		
		// Hide buttons with no diff
		if (row.closest('tbody').next('tbody.diff-row').text().trim().match(/^Couldn't find version/)) {
			row.find('[id^=diff-button-]').hide();
		}
		
		// Add missing cell
		if (row.find('[id^=diff-button-]').length == 0) {
			row.append('<td></td>');
		}
		
		// TODO: format diffs like candidate pages
		
	});
	
	// Copy pagination links to top
	$('.pagination').clone().insertBefore('.recent-changes');
	
	// Convert action types to buttons
	var actionSelect = $('#id_action_type').hide();
	actionSelect.append(actionSelect.find('option').toArray().sort((a,b) => a.innerText < b.innerText ? -1 : a.innerText > b.innerText ? 1 : 0));
	actionSelect.find('option').each((i,e) => {
		$(`<a href="#" data-value="${e.value}" ${e.selected ? ' aria-current="true"' : ''}>${e.innerText}</a>`)
			.insertBefore(actionSelect).wrap('<li class="sjo-changes-action"></li>');
	});
	
	$('.sjo-changes-action').click(event => {
		var button = $(event.target);
		var option = actionSelect.find('option').filter((i,e) => e.value == button.data('value'));
		if (button.attr('aria-current')) {
			option.prop('selected', false);
			button.removeAttr('aria-current');
		} else {
			option.prop('selected', true);
			button.attr('aria-current', true);
		}
		return false;
	});
	
	// Close panel by default
	$('.ds-filter details').removeAttr('open');
	
	// Display filter text
	$('<div class="sjo-filters"></div>').appendTo('.ds-filter');
	$('.ds-advanced-filters ul').each((i,e) => {
		var ul = $(e);
		var filters = ul.find('a[aria-current="true"]').not((i,e) => e.innerText.trim() == 'All');
		var username = ul.find('#id_username').val() || '';
		console.log(username);
		if (filters.length > 0 || username.length > 0) {
			$('<span class="sjo-filters-detail"></div>')
				.append('<label>' + ul.find('.ds-filter-label').text().trim() + '</label> ')
				.append(filters.toArray().map(e => e.innerText.trim()).join(', '))
				.append(username)
				.appendTo('.sjo-filters');
		}
	});
	
	// Utility functions
	function slugify(text) {
		return text.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/, '').replace(/[^a-z0-9]+/, '-');
	}
	
}
