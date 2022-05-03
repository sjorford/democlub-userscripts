// ==UserScript==
// @name           Democracy Club recent changes
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2022.05.03.0
// @match          https://candidates.democracyclub.org.uk/recent-changes*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style class="sjo-styles">
		.sjo-changes td, .sjo-changes th {padding: 4px;}
		.sjo-nowrap {white-space: nowrap;}
		.sjo-number {text-align: right;}
	</style>`).appendTo('head');
	
	var maxUrlLength = 40;
	var username = $('.nav-links__item:contains("Signed in as") strong').text().trim();
	
	// Get table and headings
	var table = $('.container table').addClass('sjo-changes');
	table.find('th').addClass('sjo-nowrap');
	table.closest('.container').css({maxWidth: 'fit-content'});
	var headings = Utils.tableHeadings(table);
	
	table.find('tr').each(function(index, element) {
		var row = $(element);
		var cells = row.find('td');
		if (cells.length === 0) return;
		
		// Stop columns wrapping
		cells.eq(headings['Date and time']).addClass('sjo-nowrap');
		cells.eq(headings['Action']).addClass('sjo-nowrap');
		
		// Add links
		var sourceCell = cells.eq(headings['Information source']);
		sourceCell.html(Utils.formatLinks(sourceCell.html(), maxUrlLength));
		
		// Flag internally-sourced edits
		if (sourceCell.text().trim().match(/democracyclub/)) {
			row.addClass('sjo-changes-internal');
		}
		
		// Highlight my changes
		if (cells.eq(headings['User']).text().trim() == username) {
			row.addClass('sjo-mychanges');
		}
		
		// Flag all rows by action
		row.addClass('sjo-changes-' + slugify(cells.eq(headings['Action']).text()));
		
		// Flag bot edits
		if (cells.eq(headings['User']).text().trim().match(/Bot$/)) {
			row.addClass('sjo-changes-bot');
			if (cells.eq(headings['Information source']).text().match(/This Twitter .* no longer exists; removing it/)) {
				row.addClass('sjo-changes-twitter-removed');
			}
		}
		
	});
	
	// Fix next/previous page links
	$('.step-links a').each((i,e) => {
		var currentParams = new URLSearchParams(window.location.search);
		var targetParams = new URLSearchParams((new URL(e.href)).search);
		currentParams.set('page', targetParams.get('page'));
		e.href = '?' + currentParams.toString();
	})
	
	
	// Convert action types to buttons
	var actionSelect = $('#id_action_type').hide();
	var actionOptions = actionSelect.find('option').each((i,e) => {
		$(`<a href="#" data-value="${e.value}" ${e.selected ? ' aria-current="true"' : ''}>${e.innerText}</a>`)
			.insertBefore(actionSelect).wrap('<li class="sjo-changes-action"></li>');
	});
	
	$('.sjo-changes-action').click(event => {
		var button = $(event.target);
		var option = actionOptions.filter((i,e) => e.value == button.data('value'));
		if (button.attr('aria-current')) {
			option.prop('selected', false);
			button.removeAttr('aria-current');
		} else {
			option.prop('selected', true);
			button.attr('aria-current', true);
		}
		return false;
	});
	
	function slugify(text) {
		return text.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/, '').replace(/[^a-z0-9]+/, '-');
	}
	
}
