// ==UserScript==
// @name           Democracy Club select election
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.02.26.0
// @match          https://candidates.democracyclub.org.uk/person/create/select_election?*
// @grant          none
// @require        https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// TODO:
// colour-code elections
// separate May elections from by-elections
// indicate mayoral elections
// put org name in button
// remove . from St. Helens
// that'll do for now
// add filter

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
			var electionName = button.text().trim().match(/^Add .+? to the (.*?)( (local|mayoral) election)?$/)[1];
			electionName = Utils.shortOrgName(electionName);
			button.text('Add').after(` <a class="sjo-addperson-text" href="${button.attr('href')}">${electionName}</a>`);
			
			// Add an ID to the button
			var electionID = button.attr('href').match(/\/election\/(.*)\/person\//)[1];
			if (!listitem.attr('id')) listitem.attr('id', 'sjo-addperson-listitem-' + electionID.replace(/\./g, '_'));
			
			// Flag elections by country
			//listitem.addClass('sjo-addperson-listitem-' + Utils.countryForElection(electionID));
			
		});
		
		list.append(listitems.toArray().sort((a, b) => a.innerText > b.innerText));
		
	});
	
	// Remove headings
	var headings = lists.prev('h3');
	lists.add(headings).wrapAll('<div class="sjo-addperson-listcolumns"></div>');
	headings.remove();
	
	// Get all unique election groups
	var groups = [];
	$('.sjo-addperson-listitem').each((index, element) => {
		var match = $(element).attr('id').match(/^sjo-addperson-listitem-(.*?)_(.*_)?(\d{4}-\d{2}-\d{2})$/);
		var group = match[3] + '_' + match[1];
		if (groups.indexOf(group) < 0) groups.push(group);
	});
	groups = groups.sort();
	console.log(groups);
	
	// Sort all elections by date and type
	// TODO: display local/mayor/etc. subheadings, but not always?
	$.each(groups, (index, group) => {
		var parts = group.split('_');
		var listitems = $(`[id^="sjo-addperson-listitem-${parts[1]}"][id\$="${parts[0]}"]`);
		$('<div role="list"></div>').appendTo('.sjo-addperson-listcolumns').append(listitems).before(`<h4>${moment(parts[0], "YYYY-MM-DD").format("D MMM YYYY")}</h4>`);
	});
	
	// Store button ID when clicked
	$('body').on('click', '.sjo-addperson-listitem', event => localStorage.setItem('sjo-addperson-button', $(event.target).closest('.sjo-addperson-listitem').attr('id')));
	
	// Retrieve button ID on load
	var lastButtonID = localStorage.getItem('sjo-addperson-button');
	if (lastButtonID) $(`[id="${lastButtonID}"]`).addClass('sjo-addperson-latest');
	
}
