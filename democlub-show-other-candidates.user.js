// ==UserScript==
// @name        Democracy Club show other candidates
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*/update
// @include     https://candidates.democracyclub.org.uk/election/*/person/create/*
// @version     2019.12.23.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// TODO: also handle inline form on https://candidates.democracyclub.org.uk/election/*/post/*
// TODO: does this handle multiple current elections?

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-post-candidates {background-color: #ff9;}
		.sjo-post-candidates p {margin-bottom: 0.25em;}
		.sjo-is-current {font-weight: bold;}
	</style>`).appendTo('head');
	
	$('select.post-select').each((index, element) => getPostCandidates(element));
	$('body').on('change', 'select.post-select', event => getPostCandidates(event.target));
	
	function getPostCandidates(input) {
		
		// Get election and post
		var electionID = input.id.match(/id_constituency_(.*)/)[1];
		$('#sjo-post-candidates-' + electionID.replace(/\./g, '_')).empty();
		var selected = $(':checked', input);
		if (selected.length === 0) return;
		var postName = selected.text();
		var postID = selected.val();
		
		// Call API
		$.getJSON(`/api/v0.9/posts/${postID}/`, data => renderPostCandidates(electionID, postID, postName, data));

	}
	
	function renderPostCandidates(electionID, postID, postName, data) {
		
		var blockID = `#sjo-post-candidates-${electionID.replace(/\./g, '_')}`;
		var block = $(blockID);
		if (block.length === 0) {
			block = $(`<div class="person__actions__action sjo-post-candidates" id="${blockID}"></div>`).appendTo('.person__actions');
			var electionsTop = $('#add_election_button').closest('div:has(h2)').offset().top;
			if (block.offset().top < electionsTop) {
				block.offset({top: electionsTop});
			}
		}
		block.append(`<h2>Current candidates for ${postName}</h2>`);
		
		var candidates = $.grep(data.memberships, member => member.election.id == electionID);
		if (candidates.length === 0) {
			block.append('<p>There are currently no candidates for this post</p>');
		} else {
			
			var match = location.href.match(/\/person\/(\d+)\//);
			var currentID = match ? match[1] : '';
			var parties = [];
			var partyListsInUse = (electionID.match(/^(europarl|sp\.r|naw\.r|gla\.a)\./) != null);
			$.each(candidates, (i, candidate) => {
				
				// Add party heading
				if (partyListsInUse && parties.indexOf(candidate.on_behalf_of.name) < 0) {
					$('<h3></h3>').text(candidate.on_behalf_of.name).appendTo(block);
					parties.push(candidate.on_behalf_of.name);
				}
				
				var item = $('<p></p>').appendTo(block);
				if (candidate.person.id == currentID) {
					$('<span class="sjo-is-current"></span>').text(candidate.person.name).appendTo(item);
				} else {
					$(`<a href="/person/${candidate.person.id}"></a>`).text(candidate.person.name).appendTo(item);
				}
				if (!partyListsInUse) item.append(` (${Utils.shortPartyName(candidate.on_behalf_of)})`);
				
			});
			
		}
		
	}
	
}
