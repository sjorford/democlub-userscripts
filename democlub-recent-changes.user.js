// ==UserScript==
// @name           Democracy Club recent changes
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.05.15.0
// @match          https://candidates.democracyclub.org.uk/recent-changes*
// @grant          none
// @require        https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

var maxUrlLength = 40;

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style class="sjo-styles">
		.sjo-changes td, .sjo-changes th {padding: 4px;}
		.sjo-nowrap {white-space: nowrap;}
		.sjo-number {text-align: right;}
		.sjo-mychanges {background-color: #ffeb99 !important;}
		.sjo-changes-bot {background-color: #9ed79e !important;}
		.sjo-changes-bot.sjo-changes-twitter-removed {background-color: #5cc45c !important;}
		.sjo-changes-candidacy-delete {background-color: pink !important;}
		.sjo-changes-sopn-upload * {background-color: goldenrod !important;}
		.sjo-changes-photo-upload *, .sjo-changes-photo-approve *, .sjo-changes-photo-reject *, .sjo-changes-photo-ignore * {color: #ccc !important;}
	</style>`).appendTo('head');
	
	var username = 'sjorford'; // TODO: get this from top of page?
	var now = moment();
	
	// Get table and headings
	var table = $('.container table').addClass('sjo-changes');
	table.find('th').addClass('sjo-nowrap');
	var headings = Utils.tableHeadings(table);
	
	table.find('tr').each(function(index, element) {
		var row = $(element);
		var cells = row.find('td');
		if (cells.length === 0) return;
		
		/*
		// Reformat dates
		var dateCell = cells.eq(headings['Date and time']);
		var time = moment(dateCell.html().replace(/\./g, ''), 'MMMM D, YYYY, h:mm a');
		dateCell.html(time.format('D MMM' + (time.year() == now.year() ? '' : ' YYYY') + ' HH:mm'));
		*/
		
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
		row.addClass('sjo-changes-' + cells.eq(headings['Action']).text());
		
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
	
}
