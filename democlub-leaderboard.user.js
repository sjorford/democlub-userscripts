// ==UserScript==
// @name           Democracy Club leaderboard
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2021.03.19.0
// @match          https://candidates.democracyclub.org.uk/leaderboard
// @grant          none
// ==/UserScript==

$(function() {
	
	$(`<style class="sjo-styles">
		.leaderboard {width: auto !important; margin-right: 2em; float: left;}
		.leaderboard td {max-width: 200px !important;}
		.leaderboard td:last-of-type {text-align: right;}
	</style>`).appendTo('head');
	
	$('.leaderboard th').filter((i,e) => $(e).text().trim() == 'Number of edits').text('Edits');
	
	$('.leaderboard td:first-of-type').each((i,e) => {
		var cell = $(e);
		var username = cell.text().trim();
		cell.html(`<a href="/recent-changes?username=${username}">${username + (username.match(/Bot$/) ? ' 🤖' : '')}</a>`)
	});
	
});
