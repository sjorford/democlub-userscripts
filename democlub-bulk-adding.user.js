// ==UserScript==
// @name        Democracy Club bulk adding
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/sopn/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/sopn/*/review/
// @version     2021.11.13.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	// Sort europarl candidates by party
	if (window.location.href.indexOf('/europarl.') >= 0) {
		var table = $('.bulk-add__known-people .sopn_adding_table');
		var sections = table.find('tbody');
		var sectionElementsSorted = sections.toArray().sort((a, b) => {
			var partyA = $(a).find('tr').first().find('td').eq(2).text();
			var partyB = $(b).find('tr').first().find('td').eq(2).text();
			return partyA > partyB ? 1 : partyA < partyB ? -1 : 0;
		});
		console.log(sectionElementsSorted);
		table.append(sectionElementsSorted);
	}
	
	$('summary:contains("How to add or check candidates")').parent('details').hide();
	
}
