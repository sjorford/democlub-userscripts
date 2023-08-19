// ==UserScript==
// @name        Democracy Club quick search
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @version     2023.08.19.0
// @grant       none
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		.sjo-quick-search {
			display: none; position: absolute; z-index: 99999;
			width: 100%; max-height: 10em; overflow-x: hidden; overflow-y: scroll;
			background: white; border: 1px solid #ddd;
		}
		.sjo-quick-search a {
			color: #029db9;
		}
	</style>`).appendTo('head');
	
	// Get storage
	//localStorage.setItem('sjo-candidates-index', '');
	var candidates = JSON.parse(localStorage.getItem('sjo-candidates-index') || '{}');
	//console.log(Object.keys(candidates).length, candidates);
	
	// Add names to storage
	$('a[href*="/person/"]').each((i,e) => {
		
		var url = e.href;
		if (url.indexOf('/person/') > 0) {
			if (url.slice(0, url.indexOf('/person/')) != 'https://candidates.democracyclub.org.uk') return;
			url = url.slice(url.indexOf('/person/'));
		}
		
		if (!url.match(/\/person\/\d+\/[^\/]+\/?$/)) return;
		if (url.match(/(update|change)\/?$/)) return;
		
		var id = url.match(/\d+/)[0];
		var name = e.innerText.trim();
		//console.log(id, name);
		
		// Find candidate by ID
		if (!candidates[id]) candidates[id] = {id: id, names: []};
		
		// Update primary name and url
		candidates[id].name = name;
		candidates[id].url = url;
		
		// Add name to list of names
		if (candidates[id].names.indexOf(name) < 0) candidates[id].names.push(name);
		
	});
	
	// TODO:
	// pick up alt names from candidate pages
	// - pick them up from history to ignore notes
	//   - fix this on candidate pages as well
	// handle candidate merges
	// store photos?
	// store candidacies/areas
	// store parties
	
	// cases:
	// search results
	// candidate page (/edit page?)
	// alt names page
	// election
	// election post
	
	// Write back to storage
	console.log(Object.keys(candidates).length, candidates);
	localStorage.setItem('sjo-candidates-index', JSON.stringify(candidates));
	
	// Add hook to search boxes
	var searchBox = $('input[name="q"]').attr('autocomplete', 'off'); // TODO: front screen
	var dropdown = $('<div class="sjo-quick-search"></div>').appendTo(searchBox.closest('div.columns'));
	searchBox.on('keyup', event => {
		
		var searchBox = $(event.target);
		var q = event.target.value.trim().toLowerCase();
		if (q.length < 1) {
			dropdown.hide();
			return;
		}
		
		var matching = Object.values(candidates).filter(c => c.names.filter(n => n.toLowerCase().indexOf(q) >= 0).length > 0); //.slice(0, 50);
		//console.log(q, matching)
		
		//if no change don't flash
		
		dropdown.empty().show();
		$.each(matching, (i,c) => {
			
			var link = $('<a></a>')
				.attr('href', c.url || `/person/${c.id}`)
				.appendTo(dropdown).wrap('<div></div>');
			
			link.append(c.id + ' - ' + c.name);
			
		});
		
	});
	
});
})(jQuery);
