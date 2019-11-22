// ==UserScript==
// @name           Democracy Club leaderboard
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.11.22.0
// @match          https://candidates.democracyclub.org.uk/leaderboard
// @grant          none
// ==/UserScript==

$(function() {
	
	$(`<style>
		.leaderboard {width: auto !important; margin-right: 2em;}
	</style>`).appendTo('head');
	
	$('.leaderboard td:first-of-type').each((i,e) => {
		var cell = $(e);
		var username = cell.text().trim();
		var bot = 
		cell.html(`<a href="/recent-changes?username=${username}">${username + (username.match(/Bot$/) ? ' 🤖' : '')}</a>`)
	});
	
});
