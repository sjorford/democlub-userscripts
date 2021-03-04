// ==UserScript==
// @name           Democracy Club extracts stats for May 2021
// @namespace      sjorford@gmail.com
// @version        2021.03.04.0
// @author         Stuart Orford
// @match          https://candidates.democracyclub.org.uk/api/docs/csv/
// @grant          GM_xmlhttpRequest
// ==/UserScript==

$(function() {
	
	$(`<style>
		
	</style>`).appendTo('head');
	
	
	
	$('body').on('sjo-api-action', event => {
		
		console.log('stats for May 2021', sjo.api);
		
		$.each(sjo.api.tableData, (index, tableRow) => {
			
		});
		
	});
	
	
	
	
	
	
	
	
	
});
