// ==UserScript==
// @name        Democracy Club version tree
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*
// @version     2018.02.26
// @grant       none
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	$(`<style>
		
		table.sjo-tree tr {background-color: inherit;}
		.sjo-tree td, .sjo-tree th {font-size: 8pt; padding: 2px; min-width: 20px;}
		#sjo-versions-showall {display: block; font-size: 8pt; margin-bottom: 1em;}
		.sjo-tree-current {xxxbackground-color: gold; border: 1px solid black; border-radius: 0.25em;}
		
		.sjo-tree thead {background-color: inherit;}
		.sjo-tree-year-inner {background: white;}
		.sjo-tree-year {text-align: center; background: left center repeat-x url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY2BgYAAAAAQAAVzN/2kAAAAASUVORK5CYII=');}
		
		.sjo-tree-horiz {background: repeat-x url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAAAsSURBVDhPY/wPBAxUBExQmmpg1EDKweA3kBGIR9MhZWA0L1MORg2kFDAwAAB9tQkdVRptbgAAAABJRU5ErkJggg==');}
		.sjo-tree-turnup {background: no-repeat url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAABOSURBVDhPY/wPBAx4ACMjI5QFAQSUMzBBaaqBUQMpB/Q1ED3JEANAOvAnLDQwuNMhIdeBANEGEmMYCBDMy6SCgQ1DYsCogZQDKhvIwAAApcUVF6f1O7gAAAAASUVORK5CYII=');}
		.sjo-tree-vert {background: repeat-y url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAAAySURBVDhPY/wPBAx4ACMjI5QFAQSUMzBBaaqBUQMpB6MGUg5GDaQcjBpIORjsBjIwAAAaYgckACvF4gAAAABJRU5ErkJggg==');}
		.sjo-tree-mergein {background: no-repeat  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAoCAYAAAD+MdrbAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAASdEVYdFNvZnR3YXJlAEdyZWVuc2hvdF5VCAUAAABOSURBVEhLY/wPBAxUBExQmmpg1EDKweA3kBGIR9MhZYBgXmZkBAUzKsCnhWQXEipLRmCkjBpIORg1kHIwaiDlYNRAysGogZSDEWcgAwMAmLEPQjc8JtAAAAAASUVORK5CYII=');}
		
		.sjo-tree-version {font-size: 12pt; xxxcolor: gold;}
		
	</style>`).appendTo('head');
	
	// Group versions by ID
	var versionData = [];
	var editsPerYear = [];
	$('.full-version-json').each((index, element) => {
		
		// Parse and flatten version JSON
		var version = JSON.parse(element.innerText);
		//version = flattenObject(version);
		
		// Add version header
		var div = $(element).closest('.version');
		var header = div.find('dt').toArray().reduce((obj, el) => {
			obj[el.innerText] = $(el).next('dd').text().trim();
			return obj;
		}, {});
		version._version_id = header['Version'].split(' ')[0];
		version._username   = header['Username'];
		version._timestamp  = header['Timestamp'];
		version._source     = header['Source'];
		div.data({'sjo-version': version._version_id, 'sjo-person': version.id});
		
		// Add to list of versions
		versionData.push(version);
		
		// Count number of edits per year
		var year = version._timestamp.substr(0, 4);
		if (!editsPerYear[year]) editsPerYear[year] = 0;
		editsPerYear[year]++;
		
	});
	
	// Sort versions in ascending date order
	if (versionData.length === 0) return;
	versionData.sort((a, b) => a._timestamp > b._timestamp);
	
	// Create version tree table
	var headerCellsHtml = editsPerYear.map((num, year) => 
		num == 1 ? `<th></th><th>${year}</th>` : 
		num ? `<th></th><th class="sjo-tree-year" colspan="${num * 2 - 1}"><span class="sjo-tree-year-inner">${year}</span></th>` : '');
	var treeTable = $('<table class="sjo-tree"></table>')
		.insertAfter('.person__versions h2')
		.append('<thead><tr>' + headerCellsHtml.join('') + '</tr></thead>');
	
	// Push the ID of the last version onto the stack
	var stack = [];
	stack.push({'id': versionData[versionData.length - 1].id});
	while (stack.length > 0) {
		
		// Pop an ID off the stack
		var currentId = stack.pop();
		var sequenceNo;
		
		// Join versions with this ID
		var nextVersion = null;
		for (sequenceNo = versionData.length - 1; sequenceNo >= 0; sequenceNo--) {
			if (versionData[sequenceNo].id == currentId.id) {
				if (nextVersion) {
					nextVersion._prev_version = versionData[sequenceNo];
				}
				nextVersion = versionData[sequenceNo];
			}
		}
		
		// Write a new table row
		var treeRow = $(`<tr><th>${currentId.id}</th>` + '<td></td>'.repeat(versionData.length * 2 - 1) + '</tr>').appendTo(treeTable);
		var treeRowCells = treeRow.find('td');
		
		// Render versions with this ID
		var minColNo = null, maxColNo = null, colNo = null;
		for (sequenceNo = versionData.length - 1; sequenceNo >= 0; sequenceNo--) {
			if (versionData[sequenceNo].id == currentId.id) {
				colNo = sequenceNo * 2;
				
				// If this is a merge, add the merged ID to the stack
				var sourceMatch = versionData[sequenceNo]._source.match(/^After merging person (\d+)$/);
				if (sourceMatch) {
					versionData[sequenceNo]._merge = true;
					stack.push({'id': sourceMatch[1], 'mergeColNo': colNo - 1});
				}
				
				// Write this version to the tree
				$('<a class="sjo-tree-version"></a>')
					.html(versionIcon(versionData[sequenceNo]))
					.data('sjo-tree-version', versionData[sequenceNo]._version_id)
					.appendTo(treeRowCells.eq(sequenceNo * 2));
				
				// Keep track of first and last versions for this ID
				if (!minColNo || colNo < minColNo) minColNo = colNo;
				if (!maxColNo || colNo > maxColNo) maxColNo = colNo;
				
			}
		}
		
		// Add the joining lines
		treeRowCells.filter(`:lt(${maxColNo}):gt(${minColNo})`).filter((index, element) => element.innerHTML == '').addClass('sjo-tree-horiz');
		if (maxColNo < versionData.length * 2 - 1) {
			treeRowCells.filter(`:lt(${currentId.mergeColNo}):gt(${maxColNo})`).addClass('sjo-tree-horiz');
			treeRowCells.eq(currentId.mergeColNo).addClass('sjo-tree-turnup');
			var treeRows = treeTable.find('tbody tr');
			for (var joinRow = treeRows.length - 2; joinRow >= 0; joinRow--) {
				var joinCell = treeRows.eq(joinRow).find('td').eq(currentId.mergeColNo);
				if (joinCell.hasClass('sjo-tree-horiz')) {
					joinCell.removeClass('sjo-tree-horiz').addClass('sjo-tree-mergein');
					break;
				} else {
					joinCell.removeClass('sjo-tree-horiz').addClass('sjo-tree-vert');
				}
			}
		}
		
	}
	
	function versionIcon(version) {
		
		var Unicode = {
			BLACK_DIAMOND:					'\u25C6',
			WHITE_DIAMOND:					'\u25C7',
			BLACK_STAR:						'\u2605',
			WHITE_STAR:						'\u2606',
			FEMALE_SIGN:					'\u2640',
			MALE_SIGN:						'\u2642',
			MALE_AND_FEMALE_SIGN:			'\u26A5',
			MEDIUM_WHITE_CIRCLE:			'\u26AA',
			MEDIUM_BLACK_CIRCLE:			'\u26AB',
			PENCIL:							'\u270F',
			BLACK_QUESTION_MARK_ORNAMENT:	'\u2753',
			WHITE_QUESTION_MARK_ORNAMENT:	'\u2757',
			HEAVY_PLUS_SIGN:				'\u2795',
			HEAVY_MINUS_SIGN:				'\u2796',
			WHITE_MEDIUM_STAR:				'\u2B50',
			COOKIE:							'\u{1F36A}',
			SPEECH_BALLOON:					'\u{1F4AC}',
			PAGE_WITH_CURL:					'\u{1F4C3}',
			CALENDAR:						'\u{1F4C5}',
			AUTOMOBILE:						'\u{1F697}',
		};

		console.log(version);
		
		var prev_version = version._prev_version || {};
		
		var icons = [];
		
		// Merge
		if (version._merge) {
			icons.push(Unicode.WHITE_DIAMOND);
		} else {
			
			// New person
			if (!version._prev_version)
				icons.push(`<span style="color: gold;">${Unicode.BLACK_STAR}</span>`);

			// New candidacy
			$.each(version.standing_in, (key, value) => {
				if (!prev_version.standing_in || !prev_version.standing_in[key]) {
					icons.push(Unicode.HEAVY_PLUS_SIGN);
					return false;
				} else {
					return true;
				}
			});
			
			// Deleted candidacy
			if (prev_version.standing_in) {
				$.each(prev_version.standing_in, (key, value) => {
					if (!version.standing_in[key]) {
						icons.push(Unicode.HEAVY_MINUS_SIGN);
						return false;
					} else {
						return true;
					}
				});
			}
			
			// TODO: display different icons for different actions:
			// change post name		U+2753	question
			// change party name	U+2757	exclamation
			// change name/details	U+270F	pencil
			// Updated by the automated Twitter account checker (candidates_update_twitter_usernames)
			// [Quick update from the constituency page]
			
			// Changed gender
			if (version.gender != prev_version.gender) {
				if (!version.gender) {
					icons.push(iconColor(Unicode.MALE_AND_FEMALE_SIGN, 'red'));
				} else if (!prev_version.gender) {
					icons.push(iconColor(Unicode.MALE_AND_FEMALE_SIGN, 'black'));
				} else {
					icons.push(iconColor(Unicode.MALE_AND_FEMALE_SIGN, 'blue'));
				}
			}
			
			if (version.biography != prev_version.biography)
				icons.push(Unicode.SPEECH_BALLOON);
			
			if (version.extra_fields && version.extra_fields.favourite_biscuits && (!versionprev_version.extra_fields || !prev_version.extra_fields.favourite_biscuits || version.extra_fields.favourite_biscuits != prev_version.extra_fields.favourite_biscuits))
				icons.push(Unicode.COOKIE);
			
		}
		
		if (icons.length == 0) icons.push(version._version_id.substr(0, 4));
		return icons.join('');
	}
	
	// Button to show all versions
	var allVersions = $('.version');
	$('<a id="sjo-versions-showall">Show all versions</a>').insertAfter('.sjo-tree').hide().click((event) => {
		allVersions.show();
		$('#sjo-versions-showall').hide();
		$('.sjo-tree-current').removeClass('sjo-tree-current');
	});
	
	// Show selected version
	// TODO: stop the page jumping
	$('.sjo-tree').on('click', '.sjo-tree-version', event => {
		var button = $(event.target);
		var versionId = button.data('sjo-tree-version');
		var selectedVersion = allVersions.filter((index, element) => $(element).data('sjo-version') == versionId).show();
		allVersions.not(selectedVersion).hide();
		$('#sjo-versions-showall').show();
		$('.sjo-tree-current').removeClass('sjo-tree-current');
		button.addClass('sjo-tree-current');
	});
	
	function iconColor(icon, color) {
		return `<span style="color: ${color};">${icon}</span>`;
	}
	
}
