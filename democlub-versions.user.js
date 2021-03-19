// ==UserScript==
// @name        Democracy Club versions
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @exclude     https://candidates.democracyclub.org.uk/person/create/*
// @exclude     https://candidates.democracyclub.org.uk/person/*/other-names
// @version     2021.03.19.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/diff-string.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style class="sjo-styles">
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
		.sjo-former-name        {color: red; border: solid red; border-width: 1px 0;}
		.sjo-name-suffix        {font-size: 75%;}
	</style>`).appendTo('head');
	
	var partyList = {
		'PP52': 'Conservative and Unionist Party',
		'PP53': 'Labour Party',
		'joint-party:53-119': 'Labour and Co-operative Party',
		'PP90': 'Liberal Democrats',
		'PP63': 'Green Party',
		'PP130': 'Scottish Green Party',
		'PP85': 'UK Independence Party (UKIP)',
		'PP7931': 'The Brexit Party',
		'PP102': 'Scottish National Party (SNP)',
		'PP77': 'Plaid Cymru - The Party of Wales',
		'PP83': 'Ulster Unionist Party',
		'PP70': 'Democratic Unionist Party - D.U.P.',
		'PP55': 'SDLP (Social Democratic & Labour Party)',
		'PP39': 'Sinn Féin',
		'PP103': 'Alliance - Alliance Party of Northern Ireland',
		'PP804': 'Trade Unionist and Socialist Coalition',
		'PP106': 'British National Party',
		'PP17': 'English Democrats',
		'ynmp-party:2': 'Independent',
	};
	
	var oldNames = [];
	
	$('.version-diff').each((index, element) => {
		
		var diffsPara = $(element);
		
		// Create table for version changes
		var versionTable = $('<table class="sjo-version"></table>').insertBefore(diffsPara);
		
		function parseValue(key, text) {
			var value = JSON.parse(text);
			return flattenValue(key, value);
		}
		
		function flattenValue(key, value) {
			var flatValue = {};
			if (Array.isArray(value)) {
				$.each(value, (arrayIndex, arrayValue) => {
					$.each(flattenValue(arrayIndex, arrayValue), (k,v) => {
						flatValue[key + '/' + k] = v;
					});
				});
			} else if (typeof value == 'object' && value !== null) {
				$.each(value, (k, v) => {
					flatValue[key + '/' + k] = v;
				});
			} else {
				flatValue[key] = value;
			}
			return flatValue;
		}
		
		// Reformat version changes as a table
		// TODO: indicate recent/ancient versions
		diffsPara.find('span').each(function(index, element) {
			
			var changeRows = [];
			var span = $(element);
			var spanText = span.text().replace(/\n|\r/g, ' ').trim();
			
			// Data added
			if (span.hasClass('version-op-add')) {
				var matchAdd = spanText.match(/^Added: (.+) => ([\s\S]+)$/);
				if (matchAdd) {
					$.each(parseValue(matchAdd[1], matchAdd[2]), (key, newValue) => {
						changeRows.push({fieldName: key, 
										 oldValue: null, 
										 newValue: newValue, 
										 span: span});
					});
				}
				
			// Data replaced
			} else if (span.hasClass('version-op-replace')) {
				var matchReplace = spanText.match(/^At (.+) replaced ("([\s\S]*)"|null) with ("([\s\S]*)"|null)$/);
				if (matchReplace) {
					changeRows.push({fieldName: matchReplace[1], 
									 oldValue: matchReplace[3], 
									 newValue: matchReplace[5], 
									 span: span});
				}
				
			// Data removed
			} else if (span.hasClass('version-op-remove')) {
				var matchDelete = spanText.match(/^Removed: (.+) \(previously it was ([\s\S]*)\)$/);
				if (matchDelete) {
					$.each(parseValue(matchDelete[1], matchDelete[2]), (key, oldValue) => {
						changeRows.push({fieldName: key, 
										 oldValue: oldValue, 
										 newValue: null, 
										 span: span});
					});
				}
				
			}
			
			changeRows.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
			$.each(changeRows, (index, row) => {
				addChangeRow(row.fieldName, row.oldValue, row.newValue, row.span);
			});
			
		});
		
		function addChangeRow(fieldName, dataFrom, dataTo, original) {
			
			if ((dataFrom && dataFrom.length > 0) || (dataTo && dataTo.length > 0)) {
				
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
					if (dataFrom && dataFrom.length > 0) {
						row.addCell('-', 'sjo-version-delete sjo-version-op')
						   .addCellHTML(cleanData(dataFrom, fieldName), 'sjo-version-delete sjo-version-data');
					} else {
						row.addCell('', 'sjo-version-op')
						   .addCell('', 'sjo-version-data');
					}
					
					// New value
					if (dataTo && dataTo.length > 0) {
						row.addCell('+', 'sjo-version-add sjo-version-op')
						   .addCellHTML(cleanData(dataTo, fieldName), 'sjo-version-add sjo-version-data');
					} else {
						row.addCell('', 'sjo-version-op')
						   .addCell('', 'sjo-version-data');
					}
					
				}
				
			}
			
			// Remove original diff
			original.next('br').remove();
			original.remove();
			
			// Gather previous names
			if (dataTo && (fieldName == 'name' || fieldName.match(/^other_names\/\d+\/name$/))) {
				if (oldNames.indexOf(cleanChars(dataTo)) < 0) {
					oldNames.push(cleanChars(dataTo));
				}
			}
			
		}
		
		function cleanData(data, fieldName) {
			var cleanData = data.replace(/\\"/g, '"').replace(/\\r\\n/g, '<br>');
			if (fieldName == 'twitter_username') {
				cleanData = `<a target="_blank" href="https://twitter.com/${cleanData}">${cleanData}</a>`;
			}
			var partyMatch = cleanData.match(/^stood for (\S+)$/);
			if (partyMatch && partyList[partyMatch[1]]) {
				cleanData += ` (${partyList[partyMatch[1]]})`;
			}
			return cleanData;
		}
		
	});
	
	// Display previous names in header
	var partyLabel = $('.person__details dt').filter((i,e) => e.innerText.trim() == "Party");
	var latestVersion = JSON.parse($('.full-version-json').first().text());
	var currentNames = latestVersion.other_names ? latestVersion.other_names.map(a => cleanChars(a.name)) : [];
	currentNames.push(cleanChars(latestVersion.name));
	$.each(oldNames, (index, name) => {
		if (!currentNames.includes(name)) {
			$('<dd class="sjo-list-dd sjo-former-name"></dd>').text(name).insertBefore(partyLabel);
		}
	});
	$('.sjo-former-name').first().before('<dt class="sjo-list-dt sjo-former-name">Previous names</dt>');
	
	// Format name prefix and suffix
	var nameItem = $('.sjo-list-dt').filter((i,e) => e.innerText == 'Name').next('dd').text(latestVersion.name);
	if (latestVersion.honorific_prefix) nameItem.prepend(`<span class="sjo-name-prefix">${latestVersion.honorific_prefix}</span> `);
	if (latestVersion.honorific_suffix) nameItem.append(` <span class="sjo-name-suffix">${latestVersion.honorific_suffix}</span>`);
	
	// Clean white space and non-printing chars
	function cleanChars(text) {
		return text.replace(/[\s\u200F\u200B]+/g, ' ').replace(/’/g, "'").trim();
	}
	
}
