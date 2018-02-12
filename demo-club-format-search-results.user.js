// ==UserScript==
// @name           Demo Club format search results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.02.12
// @match          https://candidates.democracyclub.org.uk/search?*
// @grant          none
// ==/UserScript==

$(function() {
	
	// Get search string from input box
	var searchName = $('form.search input[name="q"]').val().trim();
	var regexString = '(^|\\s)' + searchName.replace(/[\.\*\?\[\]\(\)\|\^\$\\\/]/g, '\\$&').replace(/\s+/, '(\\s+|\\s+.*\\s+)') + '$';
	var regex = new RegExp(regexString, 'i');
	
	// Highlight exact matches
	$('.candidates-list__person').each((index, element) => {
		var item = $(element);
		if (item.find('.candidate-name').text().match(regex)) {
			item.addClass('sjo-search-exact');
		}
	});
	
});
