// ==UserScript==
// @name        Democracy Club versions
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @version     2018.07.02.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/diff-string.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		.sjo-version            {border: none !important; table-layout: fixed; width: 100%}
		.sjo-version tr         {background: transparent !important; border-top: 1px solid white; vertical-align: top;}
		.sjo-version-field      {width: 8rem;  padding: 0.25em 0.5em  0.25em 0;      font-weight: normal;}
		.sjo-version-op         {width: 1.5em; padding: 0.25em 0.25em 0.25em 0.25em; border-left: 1px solid white; text-align: center;}
		.sjo-version-data       {width: 100%;  padding: 0.25em 0.5em  0.25em 0;}
		.sjo-version-delete     {background-color: #fdd;}
		.sjo-version-add        {background-color: #dfd;}
		.sjo-version-delete del {text-decoration: none; background-color: gold;}
		.sjo-version-delete ins {display: none;} 
		.sjo-version-add ins    {text-decoration: none; background-color: gold;}
		.sjo-version-add del    {display: none;} 
	</style>`).appendTo('head');
	
	$('.version-diff').each((index, element) => {
		
		var diffsPara = $(element);
		
		// Create table for version changes
		var versionTable = $('<table class="sjo-version"></table>').insertBefore(diffsPara);
		
		// Reformat version changes as a table
		// TODO: sort fields into input order
		// TODO: indicate recent/ancient versions
		diffsPara.find('span').each(function(index, element) {
			
			var span = $(element);
			var spanText = span.text().replace(/\n|\r/g, ' ');
			var oldText = '', newText = '';
			var fieldName = null;
			
			// Data added
			if (span.hasClass('version-op-add')) {
				var matchAdd = spanText.match(/^Added: (.+) => ["\[\{]([\s\S]*)["\]\}]$/);
				if (matchAdd) [, fieldName, newText] = matchAdd;
				
			// Data replaced
			} else if (span.hasClass('version-op-replace')) {
				var matchReplace = spanText.match(/^At (.+) replaced ["\[\{](.*)["\]\}] with ["\[\{](.*)["\]\}]$/);
				if (matchReplace) [, fieldName, oldText, newText] = matchReplace;
				
			// Data removed
			} else if (span.hasClass('version-op-remove')) {
				var matchDelete = spanText.match(/^Removed: (.+) \(previously it was ["\[\{](.*)["\]\}]\)$/); // TODO: null
				if (matchDelete) [, fieldName, oldText] = matchDelete;
				
			}
			
			oldText = oldText.trim();
			newText = newText.trim();
			
			if (fieldName == 'extra_fields') {
				if (oldText == '"favourite_biscuits": ""') oldText = '';
				if (newText == '"favourite_biscuits": ""') newText = '';
			}
			
			// Add to table
			if (fieldName) {
				addChangeRow(fieldName, oldText, newText, span);
			}
			
		});
		
		function addChangeRow(fieldName, dataFrom, dataTo, original) {
			
			if (dataFrom.length > 0 || dataTo.length > 0) {
				
				// Add a row to the diff table
				var row = $('<tr></tr>')
					.addHeaderHTML(fieldName.replace(/\//g, ' \u203A ').replace(/([_\.])/g, '$1<wbr>'), 'sjo-version-field') // wbr!
					.appendTo(versionTable);
				
				if (fieldName == 'biography' && dataFrom && dataTo) {
					
					// Add highlighted diffs for biographies
					var diffMarkup = diffString(dataFrom, dataTo);
					row.addCell('-', 'sjo-version-delete sjo-version-op')
					   .addCellHTML(cleanData(diffMarkup), 'sjo-version-delete sjo-version-data')
					   .addCell('+', 'sjo-version-add sjo-version-op')
					   .addCellHTML(cleanData(diffMarkup), 'sjo-version-add sjo-version-data');
					  
				} else {
					
					// Deleted value
					if (dataFrom.length > 0) {
						row.addCell('-', 'sjo-version-delete sjo-version-op')
						   .addCellHTML(cleanData(dataFrom), 'sjo-version-delete sjo-version-data');
					} else {
						row.addCell('', 'sjo-version-op')
						   .addCell('', 'sjo-version-data');
					}
					
					// New value
					if (dataTo.length > 0) {
						row.addCell('+', 'sjo-version-add sjo-version-op')
						   .addCellHTML(cleanData(dataTo), 'sjo-version-add sjo-version-data');
					} else {
						row.addCell('', 'sjo-version-op')
						   .addCell('', 'sjo-version-data');
					}
					
				}
				
			}
			
			// Remove original diff
			original.next('br').remove();
			original.remove();
			
		}
		
		function cleanData(data) {
			return data.replace(/\\"/g, '"').replace(/\\r\\n/g, '<br>');
		}
		
	});
	
}
