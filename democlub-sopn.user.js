// ==UserScript==
// @name           Democracy Club SOPN
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2023.04.27.0
// @match          https://candidates.democracyclub.org.uk/elections/*/sopn/
// @grant          none
// ==/UserScript==

$(function() {
	
	var heading = $('.pdf_container').closest('.container').find('h2 a').first();
	var headingText = heading.text().replace(/\s+/g, ' ').trim();
	var headingMatch = headingText.match(/(.*): (.*)/);
	
	var title = headingMatch[2] + ' - SOPN for ' + headingMatch[1];
	title = title.replace(/\s+/g, ' ').trim();
	
	document.title = title;
	
	// Page up/down
	$('body').on('keydown', event => {
		if (!(event.key == 'PageDown' || event.key == 'PageUp')) return;
		console.log(event);
		event.preventDefault();
		
		var pages = $('.page_container');
		
		if (event.key == 'PageDown') {
			var nextPage = pages.filter((i,e) => e.offsetTop > window.scrollY + 1).first();
			if (nextPage.length == 1) nextPage[0].scrollIntoView();
			
		} else if (event.key == 'PageUp') {
			var prevPage = pages.filter((i,e) => e.offsetTop < window.scrollY - 1).last();
			if (prevPage.length == 1) prevPage[0].scrollIntoView();
			
		}
		
	});
	
	
});
