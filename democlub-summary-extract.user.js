// ==UserScript==
// @name           Democracy Club summary extract
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.09.03.0
// @match          https://candidates.democracyclub.org.uk/help/api
// @grant          none
// @require        https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.4/papaparse.min.js
// ==/UserScript==

$(function() {
	
	$('body').on('sjo-api-loaded', initialize);
	
	function initialize() {
		
		// Add button
		$('<input type="button" id="sjo-api-button-summary" value="Extract summary table">')
			.appendTo('#sjo-api-header').wrap('<div class="sjo-api-wrapper"></div>')
			.click(startDownload);
		
	}
	
	function startDownload(event) {
		console.log('startDownload');
		
		// Download and parse CSV
		Papa.parse('https://candidates.democracyclub.org.uk/media/candidates-all.csv', {
			'download': true,
			'header': true,
			'delimiter': ',',
			'newline': '\r\n',
			'quoteChar': '"',
			'skipEmptyLines': true,
			'complete': parseComplete,
		});
		
	}

	function parseComplete(results) {
		console.log('parseComplete');

		// Display errors
		if (results.errors.length > 0) {
			$('#sjo-api-error').append(results.errors.map(error => `<div>${error}</div>`).join('')).show();
		}
		
		// Sort by ID
		results.data.sort((a, b) => a.id - b.id);
		
		allValues = [];
		
		for (var i = 0; i < results.data.length; i++) {
			
			var parties = [];
			for (var j = i; j < results.data.length; j++) {
				if (results.data[i].id != results.data[j].id) break;
				if (parties.indexOf(results.data[j].party_name) < 0) {
					parties.push(results.data[j].party_name);
				}
			}
			
			var values = [
				results.data[i].id,
				results.data[i].name.replace(/\s+/g, ' ').trim(),
				(results.data[i].twitter_username == '' ? '' : 'Yes'),
				(results.data[i].facebook_page_url == '' && results.data[i].facebook_personal_url == '' ? '' : 'Yes'),
				(results.data[i].homepage_url == '' ? '' : 'Yes'),
				(results.data[i].email == '' ? '' : 'Yes'),
				(results.data[i].wikipedia_url == '' ? '' : 'Yes'),
				(parties == '' ? '' : '|' + parties.join('|') + '|')
			];
			
			allValues.push(values.join('\t'));
			
			i = j - 1;
		}
		
		$('#sjo-api-textarea-raw').html(allValues.join('\r\n')).show();
		
		$('.sjo-api-tabs').show();
		$('.sjo-api-tab[data-sjo-api-tab="#sjo-api-output-raw"]').first().click();
		
	}
	
});
