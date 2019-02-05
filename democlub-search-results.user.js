// ==UserScript==
// @name           Democracy Club search results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.02.05.0
// @match          https://candidates.democracyclub.org.uk/search?*
// @grant          none
// ==/UserScript==

$(`<style>
	.sjo-search-exact {border: 2px solid gold; padding: 5px; margin-left: -7px; border-radius: 4px; background-color: #fff3b1;}
</style>`).appendTo('head');

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	// Get search string from input box
	var searchName = $('form.search input[name="q"]').val().trim();
	var regexString = '(^|\\s)' + searchName.replace(/[\.\*\?\[\]\(\)\|\^\$\\\/]/g, '\\$&').replace(/\s+/, '(\\s+|\\s+.*\\s+)') + '$';
	var regex = new RegExp(regexString, 'i');
	
	// Highlight exact matches
	$('.candidates-list__person').each((index, element) => {
		var item = $(element);
		if (item.find('.candidate-name').text().trim().match(regex)) {
			item.addClass('sjo-search-exact');
		}
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
