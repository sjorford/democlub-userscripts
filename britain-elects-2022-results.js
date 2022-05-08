// ==UserScript==
// @name           Britain Elects 2022 results
// @namespace      sjorford@gmail.com
// @version        2022.05.07
// @author         Stuart Orford
// @match          https://sotn.newstatesman.com/2022/05/2022-uk-election-results/
// @grant          none
// @require        https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.4/papaparse.min.js
// ==/UserScript==

jQuery(function() {
	
	var $ = jQuery;
	
	$(`<style>
		.sjo-textarea {width:100%; height: 10em;}
	</style>`).appendTo('head');
	
	var outputArea = $('<textarea class="sjo-textarea"></textarea>').insertAfter('#nsmg-le22-table')
			.click(event => event.target.select());
	//var allWards = [];
	
	var url = 'https://nsmg-data-public.s3.eu-west-2.amazonaws.com/nsmg-le22/live/wards/map.csv';
	
	// Download and parse CSV
	Papa.parse(url, {
		'download': true,
		'header': true,
		'delimiter': ',',
		'newline': '\n',
		'quoteChar': '"',
		'skipEmptyLines': true,
		'complete': parseComplete,
	});
	
	function parseComplete(results) {
		console.log(results);
		var wards = results.data.map(e => e.id + '\t' + e.Authority + '\t' + e.Ward + '\t' + e.Win);
		outputArea.text(wards.join('\n'));
	}
	
	/*
	get('en');
	get('wa');
	get('sc');
	
	function get(country) {
		$.get('https://nsmg-projects-public.s3.eu-west-2.amazonaws.com/live/nsmg-105/data/wards-' + country + '-22.json', processJSON);

		function processJSON(data) {
			var wards = data.objects['wards-' + country + '-22'].geometries.map(e => e.properties)
							.map(e => e.id + '\t' + e.name.replace(/\/\//, '\t') + '\t' + e.party);
			allWards = allWards.concat(wards);
			outputArea.text(allWards.join('\n'));
		}
		
	}
	*/
	
});
