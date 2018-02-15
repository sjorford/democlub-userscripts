// ==UserScript==
// @name        Democracy Club show other candidates
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*/update
// @include     https://candidates.democracyclub.org.uk/election/*/person/create/*
// @version     2018.02.15
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// TODO: also handle inline form on https://candidates.democracyclub.org.uk/election/*/post/*

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
		
		var block = $('#sjo-post-candidates-' + electionID.replace(/\./g, '_'));
		if (block.length === 0) {
			block = $('<div class="person__actions__action sjo-post-candidates" id="sjo-post-candidates-' + electionID.replace(/\./g, '_') + '"></div>').appendTo('.person__actions');
		}
		block.append(`<h2>Current candidates for ${postName}</h2>`);
		
		var candidates = $.grep(data.memberships, member => member.election.id == electionID);
		if (candidates.length === 0) {
			block.append('<p>There are currently no candidates for this post</p>');
		} else {
			var match = location.href.match(/\/person\/(\d+)\//);
			var currentID = match ? match[1] : '';
			block.append(candidates.map(candidate => 
				`<p>` + (candidate.person.id == currentID ? `<span class="sjo-is-current"> ${candidate.person.name}</span>` : `<a href="/person/${candidate.person.id}">${candidate.person.name}</a>`) + 
				` (${Utils.shortPartyName(candidate.on_behalf_of)})</p>`).join(''));
		}
		
	}
	
}