// ==UserScript==
// @name           Democracy Club results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.05.09.1
// @match          https://candidates.democracyclub.org.uk/uk_results/*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

$(function() {
	
	$(`<style class="sjo-styles">
		.sjo-results-winner {background-color: #ffc947 !important;}
	</style>`).appendTo('head');
	
	var form = $('.ballot_paper_results_form');
	var firstBody = form.find('tbody').first();
	
	form.find('tr').each((index, element) => {
		var cells = $(element).find('td');
		
		// contrast:
		// (UKIP)    https://candidates.democracyclub.org.uk/uk_results/mayor.doncaster.2017-05-04/
		// (Stratts) https://candidates.democracyclub.org.uk/uk_results/pcc.gloucestershire.2021-05-06/
		
		if (cells.closest('tbody').is(firstBody)) {
			var candMatch = cells.first().text().trim().match(/^(.+)\s+\(([^\(\)]+|[^\(\)]*\([^\(\)]+\)[^\(\)]*)\)$/i); // just the two problems
			var nameSplit = Utils.splitName(candMatch[1]);
			cells.first().text(nameSplit[0]).after(`<td><strong>${nameSplit[1]}</strong></td><td>${candMatch[2]}</td>`);
		} else if (cells.find('#id_source').length > 0) {
			cells.last().attr('colspan', '3');
		} else {
			cells.first().attr('colspan', '3');
		}
		
	});
	
	// Re-sort names
	firstBody.append(firstBody.find('tr').toArray().sort((a, b) => {
		var surnameA = a.cells[1].innerText.toLowerCase();
		var surnameB = b.cells[1].innerText.toLowerCase();
		var forenamesA = a.cells[0].innerText.toLowerCase();
		var forenamesB = b.cells[0].innerText.toLowerCase();
		return
			surnameA > surnameB ? 1 : surnameA < surnameB ? -1 : 
			forenamesA > forenamesB ? 1 : forenamesA < forenamesB ? -1 : 0;
	}));
	
	$('.ballot_paper_results_form input[type="number"]')
		.each((index, element) => element.type = 'text')
		.css({marginBottom: '0'})
		.addClass('sjo-results-number')
		.attr('autocomplete', 'off')
		.first().focus();
	$('body').on('paste', '.sjo-results-number', event => setTimeout(() => event.target.value = event.target.value.replace(/[^0-9\.]+/g, ''), 0));
	
	// Format sources
	$('caption q').each((index, element) => {
		var html = element.innerText.replace(/\b(https?:\/\/\S+)/g, '<a href="$1">$1</a>');
		$('<span></span>').html(html).insertAfter(element).prev('q').remove();
	});
	
	$('td:contains("required")').html((i,html) => html.replace(/ \((Number, )?Not required\)/i, ''));
	
	// Estimate number of seats up
	var voteInputs = $('input[id^="id_memberships_"]');
	var numSeats = 1;
	var parties = {};
	voteInputs.each((i,e) => {
		var party = $(e).closest('td').prev('td').text().trim();
		if (party != 'Independent') {
			if (!parties[party]) parties[party] = 0;
			parties[party]++;
			if (parties[party] > numSeats) numSeats = parties[party];
		}
	});
	
	voteInputs.on('change keyup', checkVotes);
	checkVotes();
	
	function checkVotes() {
		var votes = voteInputs.toArray().map(e => parseInt(e.value));
		for (var i = 0; i < voteInputs.length; i++) {
			
			var input = voteInputs.eq(i);
			var row = input.closest('tr');
			row.removeClass('sjo-results-winner').find('.sjo-results-tie').remove();
			if (isNaN(votes[i])) continue;
			
			var tie = false;
			var pos = 1;
			var unknown = false;
			
			for (var k = 0; k < voteInputs.length; k++) {
				if (k != i) {
					if (isNaN(votes[k])) {
						unknown = true;
					} else if (votes[k] == votes[i]) {
						tie = true;
					} else if (votes[k] > votes[i]) {
						pos++;
					}
				}
			}
			
			// Highlight ties
			if (tie) {
				var suffix = ['th','st','nd','rd','th','th','th','th','th','th'][(''+pos).substr(-1)];
				voteInputs.eq(i).closest('td').after(`<td class="sjo-results-tie">tie for ${pos}${suffix}</td>`);
			}
			
			// Highlight winners
			if (pos <= numSeats && !unknown) row.addClass('sjo-results-winner');
			
		}
	}
	
	// Calculate percentage
	$('#id_total_electorate, #id_num_turnout_reported').on('change keyup', event => {
		var turnout = $('#id_num_turnout_reported').val();
		var electorate = $('#id_total_electorate').val();
		if (turnout && electorate) {
			$('#id_turnout_percentage').attr('placeholder', (100 * turnout / electorate).toFixed(2));
		}
	});
	
});
