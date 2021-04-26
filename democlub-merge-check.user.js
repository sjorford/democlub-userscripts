// ==UserScript==
// @name        Democracy Club merge check
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*/duplicate?*
// @version     2021.04.26.1
// @grant       none
// ==/UserScript==

$(function() {
	
	$('#suggestion').hide();
	
	var nameRow = $('td').filter((i,e) => e.innerText.trim() == 'Name').closest('tr');
	var thisName = nameRow.find('td').eq(1).text().trim();
	var otherName = nameRow.find('td').eq(2).text().trim();
	
	if (thisName != otherName) {
		var mergeButton = $('#merge button[type="submit"]').prop('disabled', true);
		$('<div>The primary names of the candidates are not the same - are you sure?<div><input type="button" class="button sjo-yesimsure" value="Yes"></div></div>').insertAfter('h3');
		$('.sjo-yesimsure').click(event => mergeButton.prop('disabled', false));
	}
	
});
