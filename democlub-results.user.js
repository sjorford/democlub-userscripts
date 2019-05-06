// ==UserScript==
// @name           Democracy Club results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.05.06.1
// @match          https://candidates.democracyclub.org.uk/uk_results/*
// @grant          none
// ==/UserScript==

$(function() {
	
	var form = $('.ballot_paper_results_form');
	var firstBody = form.find('tbody').first();
	
	form.find('tr').each((index, element) => {
		var cells = $(element).find('td');

		if (cells.closest('tbody').is(firstBody)) {
			
			var candMatch = cells.first().text().match(/^(.*?)([^\s]+)\s+\((.*)\)$/);
			cells.first().text(candMatch[1])
				.after(`<td><strong>${candMatch[2]}</strong></td><td>${candMatch[3]}</td>`);
		} else if (cells.find('#id_source').length > 0) {
			cells.last().attr('colspan', '3');
		} else {
			cells.first().attr('colspan', '3');
		}
		
	});
	
	$('.ballot_paper_results_form input[type="number"]')
		.each((index, element) => element.type = 'text')
		.css({marginBottom: '0'})
		.first().focus();
	
	$('<textarea placeholder="Paste results table here"></textarea>').insertBefore(form).on('paste', event => setTimeout(() => {
		var inputs = firstBody.find('input');
		var data = event.target.value.split('\n').map(a => a.split('\t').map(b => b.trim()));
		var fieldsFound = 0;
		$.each(data, (rowIndex, rowValues) => {
			var nameValues = $.grep(rowValues, value => value.match(/[A-Z]{3}/i));
			var numberValues = $.grep(rowValues, value => value.match(/^\d{1,3}(,?\d{3})?(\s+\(?E(lected)?\)?)?$/));
			if (nameValues.length > 0 && numberValues.length > 0) {
				var firstName = nameValues[0].match(/^[^\s]+/)[0].toLowerCase();
				var lastName = nameValues[0].match(/[^\s]+$/)[0].toLowerCase();
				inputs.each((inputIndex, element) => {
					var input = $(element);
					if (!input.val()) {
						if (input.closest('tr').text().toLowerCase().indexOf(firstName) >= 0
						   && input.closest('tr').text().toLowerCase().indexOf(lastName) >= 0) {
							input.val(numberValues[0].replace(/[^\d]/g, ''));
							fieldsFound++;
						}
					}
				});
			}
		});
		if (fieldsFound != inputs.length) alert (fieldsFound + ' != ' + inputs.length);
	}, 0));
	
	var prevSource = localStorage.getItem('sjo-result-source');
	if (prevSource) {
		form.find('table').after(`<div>Previous source: <a href="${prevSource}" target="_blank">${prevSource}</a></div>`);
	}
	
	$('body').on('submit', event => localStorage.setItem('sjo-result-source', $('#id_source').val()));
	
});
