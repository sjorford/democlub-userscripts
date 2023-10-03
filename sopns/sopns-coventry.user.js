// ==UserScript==
// @name           SOPNs: Coventry
// @namespace      sjorford@gmail.com
// @version        2023.10.03.0
// @author         Stuart Orford
// @match          https://www.coventry.gov.uk/elections-voting/*
// @grant          none
// @require        https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function($) {
$(function() {
	
	$(`<style>
		@media print {
			.site-announcement, nav, footer, .mobile-th, aside, .supplement--contact {display: none !important;}
			td {vertical-align: top; display: table-cell !important;}
			body {display: block; line-height: 1.25;}
			tr {page-break-inside: avoid; display: table-row !important;}
			.editor {margin-bottom: 0;}
			thead {display: table-row-group;}
		}
	</style>`).appendTo('head');
	
});
})(jQuery.noConflict());
