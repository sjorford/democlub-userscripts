// ==UserScript==
// @name           Democracy Club search results
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2022.04.10.0
// @match          https://candidates.democracyclub.org.uk/search?*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

$(`<style class="sjo-styles">
	
	.search_results li {height: 64px;}
	.search_results li + li {height: 64px; margin-top: 1em;}
	.search_results li img {max-height: 64px; object-fit: contain;}
	.search_results li .button.secondary.small {margin-bottom: 0;}
	.sjo-search-exact {background-color: #fff3b1;}
	.sjo-search-id {float: right; padding: 0.25rem; font-size: 75%;}
	
	.sjo-party-bar {width: 10px !important; min-width: 10px; padding: 0; float: left; height: 64px; background-color: lightgrey; border-right: 1px solid white;}
	.sjo-party-bar.sjo-party-conservative-and-unionist-party {background-color: blue;}
	.sjo-party-bar.sjo-party-labour-party                    {background-color: red;}
	.sjo-party-bar.sjo-party-labour-and-co-operative-party   {background-color: red;}
	.sjo-party-bar.sjo-party-liberal-democrats               {background-color: orange;}
	.sjo-party-bar.sjo-party-green-party                     {background-color: #00ea4b;}
	.sjo-party-bar.sjo-party-scottish-green-party            {background-color: #00ea4b;}
	.sjo-party-bar.sjo-party-uk-independence-party-ukip      {background-color: purple;}
	.sjo-party-bar.sjo-party-the-brexit-party                {background-color: #41e7ff;}
	.sjo-party-bar.sjo-party-reform-uk                       {background-color: #41e7ff;}
	.sjo-party-bar.sjo-party-scottish-national-party-snp     {background-color: yellow;}
	.sjo-party-bar.sjo-party-plaid-cymru-the-party-of-wales  {background-color: green;}
	
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
		
		// Add party colour
		var party = item.find('.party').text().trim().match(/^(.+?)( \([^()]+\))?$/)[1];
		var partySlug = party == '' ? 'notstanding' : Utils.slugify(party);
		item.prepend(`<div class="sjo-party-bar sjo-party-${partySlug}"></div>`);

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
