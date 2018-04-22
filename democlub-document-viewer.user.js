// ==UserScript==
// @name           Democracy Club document viewer
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.04.22.0
// @match          https://candidates.democracyclub.org.uk/upload_document/*
// @grant          none
// ==/UserScript==

// https://stackoverflow.com/questions/35298724/google-docs-viewer-occasionally-failing-to-load-content-in-iframe/46095583#46095583

$(function() {
	
	$('<style>.sjo-docviewer {width: 100%; height: 600px;}</style>').appendTo('head');
	
	// Set window title
	var postLink = $('a[href^="/election/"]');
	document.title = `${postLink.text()} - nomination paper`;
	
	// Find target document
	var iframe = $('.document_viewer');
	var viewerUrl = iframe.attr('src');
	var match = viewerUrl.match(/^https:\/\/docs\.google\.com\/viewer\?url=(.*?(\.docx?)?)&embedded=true$/);
	if (!match) return;
	if (match[2]) return;
	
	// Insert native object
	var url = decodeURIComponent(match[1]);
	var obj = $(`
		<object class="sjo-docviewer" data="${url}" type="application/pdf">
			<embed src="${url}" type="application/pdf"></embed>
		</object>`);
	iframe.after(obj).remove();
	
});
