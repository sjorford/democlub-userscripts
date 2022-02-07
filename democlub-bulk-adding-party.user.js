// ==UserScript==
// @name        Democracy Club bulk adding by party
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/party/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/party/europarl*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/*/review/
// @version     2022.02.07.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-table td, .sjo-table th {padding: 0.25rem; vertical-align: top;}
		.sjo-table h4 {font-size: 1rem; font-weight: bold; margin: 0;}
		.sjo-table input {margin: 0; padding: 0.25rem; height: auto; display: block; width: 20em;}
		.sjo-nowrap {white-space: nowrap;}
	</style>`).appendTo('head');
	
	// Format rows into a table
	var form = $('.container form');
	var table = $('<table class="sjo-table"></table>').insertAfter('#id_source');
	form.find('div').each((index, element) => {
		var div = $(element);
		var row = $('<tr></tr>').appendTo(table);
		$('<th></th>').appendTo(row)
			.append(div.find('h4').text());
		$('<td></td>').appendTo(row)
			.append(div.find('input[type="text"]'));
		$('<td class="sjo-nowrap"></td>').appendTo(row)
			.append(div.find('ul'))
			.append(div.find('p').first().text().replace(/ contested.$/, ''));
		div.hide();
	});
	
	// Add an option for number of rows
	$('<label for="sjo-reverse">Number of candidates per ward: <input type="number" id="sjo-numrows" value="3" style="display: inline-block; width: 4em;"></label>')
		.insertAfter('#id_source').wrapAll('<div></div>')
		.change(() => {
			var numRows = $('#sjo-numrows').val();
			var selector = `input:nth-of-type(${numRows}) ~ input`;
		console.log(numRows, selector);
			$('.sjo-table input').show().filter(selector).hide()
		})
		.change();
	
	// Add a checkbox for reversed names
	$('<input type="checkbox" id="sjo-reverse" value="reverse"><label for="sjo-reverse">Surname first</label>')
		.insertAfter('#id_source').wrapAll('<div></div>');
	
	// Check source is entered before submitting
	$('.content button[type="submit"]').click(() => {
		var input = $('#id_source');
		if (input.val() == '') {
			$('<ul class="errorlist"><li>This field is required.</li></ul>').insertBefore(input);
			$('html, body').scrollTop(0);
			return false;
		}
	});
	
}
