// ==UserScript==
// @name           Democracy Club select election
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.03.19.0
// @match          https://candidates.democracyclub.org.uk/person/create/select_election?*
// @grant          none
// @require        https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require        https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style class="sjo-styles">
		
		.sjo-addperson-listcolumns {xxxcolumn-width: 200px; columns: 5;}
		.sjo-addperson-listcolumns p {font-size: 0.8rem;}
		.sjo-addperson-listcolumns h4 {margin-top: 0.5rem; font-size: 1rem; font-weight: bold;}
		.sjo-addperson-listcolumns h3 {margin-top: 1rem;}
		.sjo-addperson-listitem {margin: 0;}
		
		.sjo-addperson-button {margin: 0 0 0.25em 0; padding: 0.25em 0.5em; text-indent: 0; font-size: 0.8rem; text-align: left; width: 100%; background-color: #e7e7e7; color: black;}
		.sjo-addperson-latest {background-color: gold;}
		
		.sjo-filter {display: inline-block !important; width: 15em !important; padding: 0.1rem !important; height: 1.5rem !important;}
		.sjo-hidden {display: none;}
		
	</style>`).appendTo('head');
	
	var lists = $('[role=list]');
	lists.prev('h3').remove();
	lists.wrapAll('<div class="sjo-addperson-listcolumns"></div>');
	
	lists.each(function(index, element) {
		
		// Format list of buttons into columns
		var list = $(this);
		var listitems = list.find('[role=listitem]');
		listitems.each(function(index, element) {
			
			var listitem = $(this).addClass('sjo-addperson-listitem');
			var button = $('a', listitem).addClass('sjo-addperson-button');
			
			// Add an ID to the button
			var electionID = button.attr('href').match(/\/election\/(.*)\/person\//)[1];
			if (!button.attr('id')) button.attr('id', 'sjo-addperson-button-' + electionID.replace(/\./g, '_'));
			
			// Parse the button text
			var electionName = button.text().trim().replace(/^Add .+? to the /, '');
			electionName = Utils.shortOrgName(electionName, electionID);
			button.text(electionName);
			
		});
		
	});
	
	
	// Get all unique election groups
	var groups = [];
	$('.sjo-addperson-button').each((index, element) => {
		var match = $(element).attr('id').match(/^sjo-addperson-button-(.*?)_(.*_)?(\d{4}-\d{2}-\d{2})$/);
		var group = match[3] + '_' + match[1];
		if (groups.indexOf(group) < 0) groups.push(group);
	});
	
	// Sort election groups
	var types = {
		parl:   {sort: 1, name: 'UK Parliament'},
		sp:     {sort: 2, name: 'Scottish Parliament'},
		senedd: {sort: 3, name: 'Senedd Cymru'},
		gla:    {sort: 4, name: 'London Assembly'},
		mayor:  {sort: 5, name: 'Mayor'},
		pcc:    {sort: 6, name: 'PCC'},
		local:  {sort: 7, name: 'Local'},
	};
	
	groups = groups.sort((a,b) => {
		var [dateA, typeA] = a.split('_');
		var [dateB, typeB] = b.split('_');
		if (dateA < dateB) return -1;
		if (dateA > dateB) return  1;
		if (types[typeA].sort < types[typeB].sort) return -1;
		if (types[typeA].sort > types[typeB].sort) return  1;
		return 0;
	});
	
	// Sort all elections by date and type
	var curDate;
	$.each(groups, (index, group) => {
		
		var [date, type] = group.split('_');
		var listitems = $(`[id^="sjo-addperson-button-${type}"][id\$="${date}"]`).closest('.sjo-addperson-listitem')
				.sort((a,b) => a.innerText < b.innerText ? -1 : a.innerText > b.innerText ?  1 : 0);
		var newList = $('<div role="list"></div>').appendTo('.sjo-addperson-listcolumns').append(listitems);
		
		// Add date heading
		if (date != curDate) {
			$('<h3></h3>').text(moment(date, "YYYY-MM-DD").format("D MMM YYYY")).insertBefore(newList);
		}
		
		// Add subheadings
		if (listitems.length > 50) {
			listitems.filter((i, e) => i == 0 || e.innerText[0] != listitems.get(i - 1).innerText[0])
				.each((i, e) => $(`<h4>${e.innerText[0]}</h4>`).insertBefore(e));
		} else if (!(date != curDate && type == 'local')) {
			$(`<h4>${types[type].name}</h4>`).insertBefore(listitems.first());
		}
		
		curDate = date;
		
	});
	
	// Store button ID when clicked
	$('body').on('click', '.sjo-addperson-button', event => localStorage.setItem('sjo-addperson-button', $(event.target).attr('id')));
	
	// Retrieve button ID on load
	var lastButtonID = localStorage.getItem('sjo-addperson-button');
	if (lastButtonID) $(`[id="${lastButtonID}"]`).addClass('sjo-addperson-latest');
	
	// Add filter
	$('.container h2')
		.after('<label for="sjo-filter">Filter: <input class="sjo-filter" id="sjo-filter"></label>');
	
	var filter = $('.sjo-filter').focus().on('change keyup', event => {
		var filterText = filter.val().trim().toLowerCase();
		
		$('.sjo-addperson-listitem').each((index, element) => {
			var listitem = $(element);
			listitem.toggleClass('sjo-hidden', !listitem.text().trim().toLowerCase().match(filterText));
		});
		
		$('.sjo-addperson-listcolumns h3').each((index, element) => {
			var heading = $(element);
			var list = heading.next('div[role="list"]');
			heading.toggleClass('sjo-hidden', list.has('.sjo-addperson-listitem:not(.sjo-hidden)').length == 0);
			list.find('h4').each((index, element) => {
				var letter = $(element);
				letter.toggleClass('sjo-hidden', letter.nextUntil('h4', '.sjo-addperson-listitem:not(.sjo-hidden)').length == 0);
			});
		});
		
	});
	
}
