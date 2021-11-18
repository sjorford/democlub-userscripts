// ==UserScript==
// @name        Democracy Club bulk adding review
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/bulk_adding/*/review/
// @version     2021.11.18.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-bulkadd-listitem {list-style-type: none; margin-top: 0.5rem;}
		.sjo-bulkadd-selected {background-color: #fff1a3;}
		.sjo-bulkadd-listitem input {margin-bottom: 0 !important}
		.sjo-bulkadd-data {font-size: 0.75rem; xxxcolor: #aaa; margin-bottom: 0rem !important; list-style-type: none;}
		.sjo-bulkadd-link {font-weight: bold;}
		.multiple-choice {width: auto !important;} /* FIXME */
	</style>`).appendTo('head');
	
	$('form h2').each((index, element) => {
		
		var nameMatch = element.innerText.trim().match(/^Candidate:\s+(\S+)\s+((.+)\s+)?(\S+)$/);
		console.log('addSearchLink', index, element, nameMatch);
		if (nameMatch && nameMatch[3]) {
			
			var fullName = nameMatch[1] + ' ' + nameMatch[3] + ' ' + nameMatch[4];
			var shortName = nameMatch[1] + ' ' + nameMatch[4];
			element.innerHTML = 'Candidate: <a href="https://candidates.democracyclub.org.uk/search?q=' + encodeURIComponent(shortName) + '" target="_blank">' + fullName + '</a>';
			
		}
		
	});
	
	$('form input[type="radio"]').each((index, element) => {
		
		// Get ID of matching person
		var input = $(element);
		var link = input.closest('label').addClass('sjo-bulkadd-listitem').find('a').addClass('sjo-bulkadd-link');
		if (link.length > 0) link.html(link.html().replace(/\(previously stood in [\s\S]*? candidate\)/, ''));
		link.closest('div').contents().filter((index, element) => element.nodeType == Node.TEXT_NODE && element.textContent.match(/^\s*(Mark|as standing in .*)\s*$/)).remove();
		
		var personID = input.val();
		if (personID == '_new') return;
		
		// Call API
		$.getJSON(`/api/v0.9/persons/${personID}/`, data => renderBulkAddData(input, data));

	});
	
	function renderBulkAddData(input, data) {
		
		// Parse returned data
		var candidacies = data.memberships.map(member => {
			var election = Utils.shortOrgName(member.election.name.replace(/^\d{4} | local election$/g, ''));
			var year = member.election.id.match(/\d{4}/)[0];
			return {year: year, election: election, post: trimPost(member.post.label), party: member.on_behalf_of.name};
		});
		
		// Sort by year
		candidacies = candidacies.sort((a, b) => b.year - a.year);
		
		// Insert after radio buton
		input.closest('label')
			.append('<ul class="sjo-bulkadd-data">' 
				+ candidacies.map(c => `<li>${c.year} - ${c.election} (${c.post}) - ${c.party}</li>`).join('') 
				+ '</ul>');
		
	}
	
	function trimPost(postName) {
		return postName.match(/^(Member of (the Scottish )?Parliament for )?(.*?)( ward)?$/)[3];
	}
	
}
