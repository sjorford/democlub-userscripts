// ==UserScript==
// @name           Democracy Club leaderboard
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.10.31.0
// @holiday        🎃
// @match          https://candidates.democracyclub.org.uk/leaderboard
// @grant          none
// ==/UserScript==

$(function() {
	
	$(`<style>
		.leaderboard {width: auto !important; margin-right: 2em;}
	</style>`).appendTo('head');
	
	$('.leaderboard td:first-of-type').filter((i,e) => e.innerText.match(/[a-z]Bot$/)).html((i, html) => html + ' 🤖');
	
});
