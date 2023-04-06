// ==UserScript==
// @name        Democracy Club bulk adding
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/sopn/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/sopn/*/review/
// @version     2023.04.06.1
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
	
	var knownCandidates = $('a.not-standing').closest('.sopn_adding_table');
	knownCandidates.slice(1).insertAfter(knownCandidates.first());
	$('.sopn_adding_table').first().before(knownCandidates);
	
	var parsedCandidates = $('input[id$="-DELETE"]').closest('.sopn_adding_table');
	parsedCandidates.insertAfter(knownCandidates.last());
	
}
