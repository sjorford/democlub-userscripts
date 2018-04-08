// ==UserScript==
// @name           Democracy Club SOPN queue
// @namespace      sjorford@gmail.com
// @match          https://candidates.democracyclub.org.uk/moderation/sopn-review-required/
// @version        2018.04.08.0
// @grant          none
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-wrapper ul {column-width: 15em;}
	</style>`).appendTo('head');
	
	var shortWords = ['and', 'under', 'upon', 'on'];
	
	var container = $('.content .container');
	var wrapper = $('<div class="sjo-wrapper"></div>').appendTo(container);
	var buttons = container.find('a.button[href*="/bulk_adding/sopn/"]');
	
	var buttonsSorted = buttons.toArray().sort((a, b) => a.href < b.href ? -1 : a.href > b.href ? 1 : 0);
	$.each(buttonsSorted, (index, element) => {
		
		var button = $(element);
		
		var match = button.attr('href').match(/\/sopn\/(([^\/\.]+)\.([^\/\.]+)\.([^\/]+))\//);
		var areaSlug = match[3];
		var areaName = properCase(areaSlug.replace(/-/g, ' '));
		
		var heading = $('.sjo-heading-' + areaSlug);
		if (heading.length == 0) {
			heading = $(`<h4 class="sjo-heading-${areaSlug}">${areaName}</h4>`).appendTo(wrapper)
				.after('<ul class="sjo-list"></ul>');
		}
		
		var item = button.closest('li').appendTo(heading.next('ul'));
		button.text('Add').prependTo(item);
		
	});
	
	function properCase(text) {
		return text.replace(/\w\S*/g, function(word) {
			return shortWords.indexOf(word) >= 0 ? word : word.charAt(0).toUpperCase() + word.substr(1);
		});
	};

}
