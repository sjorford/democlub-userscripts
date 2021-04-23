// ==UserScript==
// @name           Democracy Club results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.04.23.0
// @match          https://candidates.democracyclub.org.uk/uk_results/*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

$(function() {
	
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
		.first().focus();
	
	$('<textarea placeholder="Paste results table here"></textarea>').insertBefore(form).on('paste', event => setTimeout(() => {
		
		var inputs = firstBody.find('input');
		var data = event.target.value.split('\n').map(a => a.split('\t').map(b => b.trim()));
		var fieldsFound = 0, numbersFound = 0;
		$.each(data, (rowIndex, rowValues) => {
			
			var nameValues = $.grep(rowValues, value => value.match(/[A-Z]{3}/i));
			var numberValues = $.grep(rowValues, value => value.match(/\d{1,3}(,?\d{3})?/));
			if (nameValues.length > 0 && numberValues.length > 0) {
				numbersFound++;
				
				var nameMatch = nameValues[0].match(/^([^,]+)(,(.*?))?$/);
				var name = ((nameMatch[3] || '') + ' ' + nameMatch[1]).trim();
				var firstName = name.match(/^[^\s]+/)[0].toLowerCase().trim();
				var lastName = name.match(/[^\s]+$/)[0].toLowerCase().trim();
				console.log(name, firstName, lastName, numberValues[0]);
				
				inputs.each((inputIndex, element) => {
					var input = $(element);
					if (!input.val()) {
						if (input.closest('tr').text().toLowerCase().indexOf(firstName) >= 0
						   && input.closest('tr').text().toLowerCase().indexOf(lastName) >= 0) {
							input.val(numberValues[0].replace(/[^\d]/g, ''));
							fieldsFound++;
							return false;
						}
					}
				});
				
			}
			
		});
		
		if (fieldsFound != inputs.length || numbersFound != inputs.length) 
			alert (fieldsFound + ' != ' + numbersFound + ' != ' + inputs.length);
		
	}, 0));
	
	/*
	var prevSource = localStorage.getItem('sjo-result-source');
	if (prevSource) {
		var sourceWrapper = $(`<div>Previous source: <a href="${prevSource}" target="_blank">${prevSource}</a></div>`)
			.insertAfter(form.find('table'));
		$('<button type="button">Use same source</button>').appendTo(sourceWrapper).wrap('<div></div>').click(event => $('#id_source').val(prevSource));
	}
	
	$('body').on('submit', event => localStorage.setItem('sjo-result-source', $('#id_source').val()));
	*/
	
	// Format sources
	$('caption q').each((index, element) => {
		var html = element.innerText.replace(/\b(https?:\/\/\S+)/g, '<a href="$1">$1</a>');
		$('<span></span>').html(html).insertAfter(element).prev('q').remove();
	});
	
});
