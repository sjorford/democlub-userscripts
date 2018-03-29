// ==UserScript==
// @name        Democracy Club bulk adding by party
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/party/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/*/review/
// @version     2018.03.29.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-table td {padding: 0.25rem; vertical-align: middle;}
		.sjo-table h4 {font-size: 1rem; font-weight: bold; margin: 0;}
		.sjo-table p {font-size: 0.75rem; margin: 0;}
		.sjo-table input {margin: 0; padding: 0.25rem; height: auto;}
	</style>`).appendTo('head');
	
	// Format rows into a table
	var form = $('.container form');
	var table = $('<table class="sjo-table"></table>').insertAfter('#id_source');
	form.find('div').each((index, element) => {
		var div = $(element);
		var row = $('<tr></tr>').appendTo(table);
		$('<td></td>').appendTo(row).append(div.find('h4'));
		$('<td></td>').appendTo(row).append(div.find('input[type="text"]'));
		$('<td></td>').appendTo(row).append(div.find('p').first());
		$('<td></td>').appendTo(row).append(div.find('p'));
		div.find('label').hide();
	});
	
	// Add a checkbox for reversed names
	$('<input type="checkbox" id="sjo-reverse" value="reverse"><label for="sjo-reverse">Surname first</label>')
		.insertAfter('#id_source').wrapAll('<div></div>');
	
}
