// ==UserScript==
// @name           Demo Club select election
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.02.12
// @match          https://candidates.democracyclub.org.uk/person/create/select_election?*
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

$(`<style>
	.sjo-addperson-listcolumns {column-width: 200px; -moz-column-width: 200px;}
	.sjo-addperson-listcolumns p {font-size: 0.8rem}
	.sjo-addperson-listitem {margin: 0; padding-left: 3.05em; text-indent: -3.05em;}
	.sjo-addperson-button {margin: 0 0 0.25em 0; padding: 0.25em 0.5em; text-indent: 0; font-size: 0.8rem}
	.sjo-addperson-text {color: inherit;}
	.sjo-addperson-latest .sjo-addperson-button {background-color: #fc0 !important;}
	.sjo-addperson-latest .sjo-addperson-text {font-weight: bold;}
</style>`).appendTo('head');

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	var lists = $('[role=list]');
	lists.each(function(index, element) {
		
		// Format list of buttons into columns
		var list = $(this);
		var listitems = list.find('[role=listitem]');
		listitems.each(function(index, element) {
			
			// Parse the button text
			var listitem = $(this).addClass('sjo-addperson-listitem');
			var button = $('a', listitem).addClass('sjo-addperson-button');
			
			// Move the election name out of the button
			var electionName = button.text().trim().match(/^Add .+? to the (\d{4} )?(The |Mayor of |City of |City and County of |Council of the |Comhairle nan )?(.+?)(( County| County Borough| Metropolitan Borough| City)? Council| Combined Authority)?( (local|mayoral) election)?$/)[3];
			electionName = electionName == 'London Corporation' ? 'City of London' : electionName;
			button.text('Add').after(` <a class="sjo-addperson-text" href="${button.attr('href')}">${electionName}</a>`);
			
			// Add an ID to the button
			var electionID = button.attr('href').match(/\/election\/(.*)\/person\//)[1];
			if (!listitem.attr('id')) listitem.attr('id', 'sjo-addperson-listitem-' + electionID.replace(/\./g, '_'));
			
			// Flag elections by country
			listitem.addClass('sjo-addperson-listitem-' + Utils.getCountryForElection(electionID));
			
		});
		
		list.append(listitems.toArray().sort((a, b) => a.innerText > b.innerText));
		
	});
	
	// Remove headings
	var headings = lists.prev('h3');
	lists.add(headings).wrapAll('<div class="sjo-addperson-listcolumns"></div>');
	var localHeading = headings.filter(':contains("Local Elections")');
	headings.not(localHeading).hide();
	
	// Sort local elections by country
	var localList = localHeading.next('div');
	$.each({'EN': 'England', 'SC': 'Scotland', 'WA': 'Wales', 'NI': 'Northern Ireland'}, (key, country) => {
		var listitems = $('.sjo-addperson-listitem-' + key, localList);
		if (listitems.length > 0) {
			$('<div role="list"></div>').appendTo('.sjo-addperson-listcolumns').append(listitems).before(`<h3>${country}</h3>`);
		}
	});
	if (localList.find('p').length === 0) localList.add(localHeading).hide();
	
	// Store button ID when clicked
	$('body').on('click', '.sjo-addperson-listitem', event => localStorage.setItem('sjo-addperson-button', $(event.target).closest('.sjo-addperson-listitem').attr('id')));
	
	// Retrieve button ID on load
	var lastButtonID = localStorage.getItem('sjo-addperson-button');
	if (lastButtonID) $(`[id="${lastButtonID}"]`).addClass('sjo-addperson-latest');
	
}
