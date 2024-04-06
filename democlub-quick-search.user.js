// ==UserScript==
// @name        Democracy Club quick search
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @version     2024.04.06.0
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
	var storage = localStorage.getItem('sjo-candidates-index');
	var candidates = JSON.parse(storage || '[]');
	//console.log('candidates', candidates.length, candidates);
	
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
		var matching = candidates.filter(c => c.id == id);
		if (matching.length == 0) {
			var newCand = {id: id, name: name, names: []};
			//console.log('adding', newCand);
			candidates.push(newCand);
			matching = [newCand];
		}
		
		// Update primary name
		matching[0].name = name;
		
		// Add name to list of names
		if (matching[0].names.indexOf(name) < 0) matching[0].names.push(name);
		
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
	//console.log(Object.keys(candidates).length, candidates);
	storage = JSON.stringify(candidates);
	//console.log('writing storage', storage.length);
	localStorage.setItem('sjo-candidates-index', storage);
	
	// Add hook to search boxes
	var searchBox = $('input[name="q"]').attr('autocomplete', 'off'); // TODO: front screen
	var dropdown = $('<div class="sjo-quick-search"></div>').appendTo(searchBox.closest('div.columns'));
	searchBox.on('keyup', event => {
		
		var searchBox = $(event.target);
		var query = event.target.value.replace(/\s+/, ' ').trim().toLowerCase();
		if (query.length < 3) return dropdown.hide();
		query = query.split(' ');
		
		var matching = candidates.filter(c => c.names.filter(n => query.filter(q => n.toLowerCase().indexOf(q) >= 0).length == query.length).length > 0); //.slice(0, 50);
		//console.log(q, matching)
		
		//if no change don't flash
		if (matching.length == 0) return dropdown.hide();
		
		dropdown.empty().show();
		$.each(matching, (i,c) => {
			
			var link = $('<a></a>')
				.attr('href', `/person/${c.id}`)
				.appendTo(dropdown).wrap('<div></div>');
			
			link.append(c.id + ' - ' + c.name);
			
		});
		
	});
	
});
})(jQuery);
