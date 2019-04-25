// ==UserScript==
// @name           Democracy Club SOPN
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.04.25.0
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
	
});
