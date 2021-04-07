// ==UserScript==
// @name           Democracy Club photo review
// @namespace      sjorford@gmail.com
// @version        2021.04.07.0
// @author         Stuart Orford
// @match          https://candidates.democracyclub.org.uk/moderation/photo/review/*
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		.sjo-photo-prev {float: left;}
		.sjo-photo-next {float: right;}
	</style>`).appendTo('head');
	
	var curID = window.location.href.match(/(\d+)/)[1] - 0;
	var prevURL = `https://candidates.democracyclub.org.uk/moderation/photo/review/${curID - 1}`;
	var nextURL = `https://candidates.democracyclub.org.uk/moderation/photo/review/${curID + 1}`;
	
	$(`<a type="button" href="${prevURL}" class="button sjo-photo-prev">Prev</a>`).prependTo('.photo-review__primary');
	$(`<a type="button" href="${nextURL}" class="button sjo-photo-next">Next</a>`).prependTo('.photo-review__primary');
	
});
})(jQuery.noConflict());
