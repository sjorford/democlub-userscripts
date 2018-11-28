// ==UserScript==
// @name           Democracy Club extracts - find splits
// @namespace      sjorford@gmail.com
// @author         Stuart Orford
// @version        2018.11.28.0
// @match          https://candidates.democracyclub.org.uk/help/api
// @grant          none
// @require        https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// ==/UserScript==

$('body').on('sjo-api-loaded', function() {
	
	// Add button
	var button = $('<input type="button" value="Search for splits">')
		.appendTo('.sjo-api-actions').click(searchForSplits).hide();
	
	$('body').on('sjo-api-action', event => {
		if (sjo.api.action == null && sjo.api.tableData) {
			button.show();
		} else if (sjo.api.action != 'split') {
			button.hide();
		}
	});
	
	function searchForSplits() {
		console.log('searchForSplits');
		
		// Check global action flag
		if (sjo.api.action || !sjo.api.tableData) return;
		
		// Set global action flag
		sjo.api.action = 'split';
		$('body').trigger('sjo-api-action')
		
		// Create table
		$('.sjo-api-actions-output').empty();
		var table = $('<table></table>').appendTo('.sjo-api-actions-output');
		
		var idsChecked = [];
		
		// TODO: shallow copy list and sort by id, then groups are consecutive and grep not needed
		
		eachAsync(sjo.api.tableData, (index, firstCandidacy) => {
			
			// Check if this group has already been done
			if (idsChecked.indexOf(firstCandidacy.id) >= 0) return;
			idsChecked.push(firstCandidacy.id);
			
			var parties = [], areas = [];
			
			// Group candidacies by id
			var group = $.grep(sjo.api.tableData, (candidacy, index) => {
				if (candidacy.id == firstCandidacy.id) {
					
					// TODO: populate area in main script
					if (parties.indexOf(candidacy._party_group_id) < 0) parties.push(candidacy._party_group_id);
					if (areas.indexOf(candidacy.area) < 0) areas.push(candidacy.area);
					return true;
					
				} else {
					return false;
				}
			});
			
			if (group.length <= 1) return;
			if (parties.length > 1 || areas.length > 1) {
				console.log(group[0].id, group[0].name, parties, group);
				
				var tableBody = $('<tbody></tbody>').appendTo(table);
				$.each(group, (index, candidacy) => {
					
					$('<tr></tr>')
						.addCell(candidacy.id)
						.addCellHTML(`<a href="/person/${candidacy.id}">${candidacy.name}</a>`)
						.addCell(candidacy.election_date)
						.addCell(candidacy._election_name)
						.addCell(candidacy.party_name)
						.addCell(candidacy._post_label)
						.appendTo(tableBody);
					
				});
				
			}
			
		}, () => {
			
			// Return control
			sjo.api.action = null;
			console.log('searchForSplits done');
			
		});
		
	}
	
});

// TODO: put this in function lib
function eachAsync(array, loopFunction, completeFunction) {
	
	var index = 0;
	next();
	
	function next() {
		
		if (index >= array.length) {
			completeFunction();
			return;
		}
		
		loopFunction.call(null, index, array[index]);
		index++;
		window.setTimeout(next, 0);
		
	}
	
}

