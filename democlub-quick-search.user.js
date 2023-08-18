// ==UserScript==
// @name        Democracy Club quick search
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @version     2023.08.18.1
// @grant       none
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		
	</style>`).appendTo('head');
	
	// Get storage
	//EMERGENCY BLATT
	//localStorage.setItem('sjo-candidates-index', '');
	var candidates = JSON.parse(localStorage.getItem('sjo-candidates-index') || '[]');
	//console.log(candidates);
	
	// Add names to storage
	$('a[href*="/person/"]').each((i,e) => {
		//console.log(e.href);
		
		if (e.href.indexOf('https://candidates.democracyclub.org.uk/person/') < 0) return;
		if (e.href.indexOf('/update') > 0) return;
		
		var id = e.href.match(/\d+/)[0];
		var name = e.innerText.trim();
		
		if ($.grep(candidates, cand => cand.id === id && cand.name === name).length == 0) {
			candidates.push({id: id, name: name});
		}
		
	});
	
	// Write back to storage
	//console.log(candidates);
	localStorage.setItem('sjo-candidates-index', JSON.stringify(candidates));
	
	// Add hook to search boxes
	
	
	
});
})(jQuery);
