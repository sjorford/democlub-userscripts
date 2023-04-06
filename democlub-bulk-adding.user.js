// ==UserScript==
// @name        Democracy Club bulk adding
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/sopn/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/sopn/*/review/
// @version     2023.04.06.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		thead th label {font-weight: bold;}
		.sopn_adding_table input {margin-bottom: 0;}
		.sjo-extra-row {display: none;}
		.titleCaseNameField {display: none;}
		.sopn_adding_table tbody + tbody::before {display: none;}
	</style>`).appendTo('head');
	
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
	
	// Collapse table
	var table = $('#bulk_add_form .sopn_adding_table');
	table.find('thead').first().empty().append(
		table.find('tbody th').closest('tr').first()
	);
	table.find('thead').not(':first-of-type').remove();
	table.find('tbody th').closest('tr').remove();
	table.find('p')
		.filter((i,e) => e.textContent.trim() == 'If the party is blank on the SOPN, enter "Independent"')
		.remove();
	table.find('br').remove();
	
	/*
	if (table.find('input[id$="-name"]').filter((i,e) => e.value != '').length > 0) {
		table.find('input[id$="-name"]').filter((i,e) => e.value == '')
			.closest('tbody').addClass('sjo-extra-row');
		$('<button type="button" class="tiny" id="sjo-show-extra-rows">Show more rows</button>')
			.click(event => $('tbody').removeClass('sjo-extra-row') 
				   && $('#sjo-show-extra-rows').hide())
			.insertAfter(table).wrap('<div></div>');
	}
	*/
	
	// Add a checkbox for reversed names
	$('<input type="checkbox" id="sjo-reverse" value="reverse"><label for="sjo-reverse">Surname first</label>')
		.insertBefore(table.last()).wrapAll('<div></div>');
	
	var knownCandidates = $('a.not-standing').closest('table');
	knownCandidates.find('tbody tr').appendTo(knownCandidates.first().find('tbody'));
	knownCandidates.slice(1).hide();
	$('.sopn_adding_table').first().before(knownCandidates);
	
	var parsedCandidates = $('input[id$="-DELETE"]').closest('table');
	parsedCandidates.find('tbody tr').appendTo(parsedCandidates.first().find('tbody'));
	parsedCandidates.slice(1).hide();
	
	var newCandidates = $('.sopn_adding_table').not(knownCandidates).not(parsedCandidates);
	newCandidates.find('tbody tr').appendTo(newCandidates.first().find('tbody'));
	newCandidates.slice(1).hide();
	
}
