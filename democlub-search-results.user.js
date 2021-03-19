// ==UserScript==
// @name           Democracy Club search results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.03.19.0
// @match          https://candidates.democracyclub.org.uk/search?*
// @grant          none
// ==/UserScript==

$(`<style class="sjo-styles">
	.search_results li {height: 68px;}
	.search_results li + li {height: 68px; margin-top: 1em;}
	.search_results li img {max-height: 64px; object-fit: contain;}
	.search_results li .button.secondary.small {margin-bottom: 0;}
	.sjo-search-exact {border: 2px solid gold; padding: 5px; margin-left: -7px; border-radius: 4px; background-color: #fff3b1;}
	.sjo-search-id {float: right; padding: 0.25rem; font-size: 75%;}
</style>`).appendTo('head');

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	// Get search string from input box
	var searchName = $('form.search input[name="q"]').val().trim();
	var regexString = '(^|\\s)' + searchName.replace(/[\.\*\?\[\]\(\)\|\^\$\\\/]/g, '\\$&').replace(/\s+/, '(\\s+|\\s+.*\\s+)') + '$';
	var regex = new RegExp(regexString, 'i');
	
	$('.candidates-list__person').each((index, element) => {
		
		// Highlight exact matches
		var item = $(element);
		if (item.find('.candidate-name').text().trim().match(regex)) {
			item.addClass('sjo-search-exact');
		}
		
		// Display ID numbers
		var id = item.find('.candidate-name').attr('href').match(/\d+/);
		$('<span class="sjo-search-id"></span>').text(id)
			.appendTo(item.find('.person-name-and-party'));
		
	});
	
	// Capitalise name in new candidate button
	var createName = searchName;
	if (createName == createName.toLowerCase()) {
		createName = createName.replace(/\b([a-z]+)\b/g, m => m.substr(0, 1).toUpperCase() + m.substr(1));
	}
	var button = $('a[href^="/person/create/select_election?name="]');
	if (createName != button.text().match(/"(.*)"/)[1]) {
		button.attr('href', '/person/create/select_election?name=' + createName);
		button.text(`Add "${createName}" as a new candidate`);
	}

}
