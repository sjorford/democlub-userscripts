// ==UserScript==
// @name           Democracy Club extract flat
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2019.04.27.0
// @match          https://candidates.democracyclub.org.uk/help/api
// @grant          none
// ==/UserScript==

$(function() {
	
	var columns = [
		'id',
		'name',
		'_first_name',
		'_last_name',
		'email',
		'twitter_username',
		'facebook_page_url',
		'party_ppc_page_url',
		'facebook_personal_url',
		'homepage_url',
		'wikipedia_url',
		'linkedin_url',
	];
	
	var repeatColumns = [
		'election',
		'post_label',
		'party_name',
	];
	
	$('body').on('sjo-api-loaded', event => {
		
		$('<input type="button" value="Flat">').insertAfter('#sjo-api-button-download').click(event => {
			
			var rawData = sjo.api.tableData;
			var flatData = {};
			
			$.each(rawData, (index, candObj) => {
				if (!flatData[candObj.id]) {
					flatData[candObj.id] = [candObj];
				} else {
					flatData[candObj.id].push(candObj);
				}
			});
			
			var html = buildRawOutput(flatData);
			
			$('#sjo-api-textarea-raw').html(html.join('\r\n')).show();

		});
		
	});
	
	function buildRawOutput(data) {
		
		var bodyHtml = [];
		
		$.each(data, function(index, dataRow) {
			
			// Sort candidacies
			var dataRowSorted = dataRow.sort((a, b) => a.election_date < b.election_date ? 1 : a.election_date > b.election_date ? -1 : 0);
			
			bodyHtml.push(buildRawOutputRow(dataRowSorted).join('\t'));
			
		});
		
		return bodyHtml;
		
	}
	
	function buildRawOutputRow(dataRow) {
		
		var cellValues = columns.map(column => {
			if (dataRow[0][column] === null || dataRow[0][column] === false || dataRow[0][column] === '') {
				return '';
			} else {
				return typeof dataRow[0][column] == 'string' ? dataRow[0][column].replace(/\s+/g, ' ') : dataRow[0][column];
			}
		});
		
		$.each(dataRow, (index, candObj) => {
			$.each(repeatColumns, (index, column) => {
				cellValues.push(candObj[column]);
			});
		});
		
		return cellValues;
		
	}
	
});
