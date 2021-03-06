// ==UserScript==
// @name        Democracy Club bulk adding
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/*
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/*/review/
// @exclude     https://candidates.democracyclub.org.uk/bulk_adding/party/*
// @version     2019.04.25.0
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
	
	/*
	$(`<style>
		#bulk_add_form .form_group {display: none;}
		#bulk_add_form .form_group h3 {display: none;}
		#bulk_add_form .form_group p {display: inline-block; vertical-align: top; width: 48%; padding-right: 1%; margin-bottom: 0;}
		#bulk_add_form .form_group p input {margin-bottom: 0.5rem;}
	</style>`).appendTo('head');
	
	// TODO: allow party dropdowns to be deselected
	
	// Trim party selection
	Utils.formatPartySelects('select.party-select');
	
	// Add a checkbox for reversed names
	// TODO: add this to other edit pages
	$('<input type="checkbox" id="sjo-reverse" value="reverse" checked><label for="sjo-reverse">Surname first</label>')
		.insertBefore('#bulk_add_form').wrapAll('<div></div>');
	
	// Add a checkbox to show all parties
	//$('<input type="checkbox" id="sjo-allparties" value="allparties"><label for="sjo-allparties">Show all parties</label>')
	//	.insertBefore('#bulk_add_form').wrapAll('<div></div>').change(Utils.showAllParties);
	
	// Show rows incrementally
	$('#bulk_add_form .form_group').first().show();
	$('#bulk_add_form input').on('change', event => $(event.target).closest('.form_group').next('.form_group').show());
	
	// Hide noobstructions
	var heading = $('h3:contains("How to add or check candidates")');
	heading.next('ol').addClass('sjo-bulkadd-instructions').hide();
	$('<a role="button" style="font-size: small;">Show</a>').click(event => $('.sjo-bulkadd-instructions').toggle()).appendTo(heading).before(' ');
	*/
	
}
