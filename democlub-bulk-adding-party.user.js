// ==UserScript==
// @name        Democracy Club bulk adding by party
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/party/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/party/europarl*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/*/review/
// @version     2020.04.30.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-table td, .sjo-table th {padding: 0.25rem;}
		.sjo-middle {vertical-align: middle;}
		.sjo-table h4 {font-size: 1rem; font-weight: bold; margin: 0;}
		.sjo-table input {margin: 0; padding: 0.25rem; height: auto;}
		.sjo-nowrap {white-space: nowrap;}
	</style>`).appendTo('head');
	
	// Format rows into a table
	var form = $('.container form');
	var table = $('<table class="sjo-table"></table>').insertAfter('#id_source');
	form.find('div').each((index, element) => {
		var div = $(element);
		var row = $('<tr></tr>').appendTo(table);
		$('<th class="sjo-middle"></th>').appendTo(row)
			.append(div.find('h4').text());
		$('<td></td>').appendTo(row)
			.append(div.find('input[type="text"]').first())
			.append(div.find('li a').first());
		$('<td></td>').appendTo(row)
			.append(div.find('input[type="text"]').first())
			.append(div.find('li a').first());
		$('<td></td>').appendTo(row)
			.append(div.find('input[type="text"]'))
			.append(div.find('li a'));
		$('<td class="sjo-nowrap sjo-middle"></td>').appendTo(row).append(div.find('p').first().text().replace(/ contested.$/, ''));
		div.hide();
	});
	
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
