// ==UserScript==
// @name           Democracy Club lock suggestions
// @namespace      sjorford@gmail.com
// @version        2023.04.07.0
// @author         Stuart Orford
// @match          https://candidates.democracyclub.org.uk/moderation/suggest-lock/
// @grant          none
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		.sjo-page__moderation-suggest-lock .content > .container > table > tbody > tr > td:first-of-type {vertical-align: top; padding-top: 15em;}
	</style>`).appendTo('head');
	
	$('td:first-of-type > a[href^="/person/"]').each((i,e) => $(e).after(' (' + e.href.match(/\d+/)[0] + ')'));
	
});
})(jQuery);
