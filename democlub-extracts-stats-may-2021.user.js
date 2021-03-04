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
	
	var jsonPromise = new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/areas-2021.json',
            onload: resolve
        });
    });
	
	$('body').on('sjo-api-action', event => {
		console.log(sjo.api.tableData);
		jsonPromise.then(response => {
			var areas = JSON.parse(response.responseText);
			console.log(areas);
			
			var rowGroups = {};
			$.each(sjo.api.tableData, (index, row) => {
				if (!rowGroups.hasOwnProperty(row.id)) rowGroups[row.id] = [];
				rowGroups[row.id].push(row);
			});
			
			$.each(rowGroups, (id, rows) => {
				if (rows.length < 2) return;
				
				var sensible = true;
				for (var i = 0; i < rows.length - 1; i++) {
					for (var j = i + 1; j < rows.length; j++) {
						if (!isOverlap(rows[i], rows[j])) sensible = false;
					}
				}
				
				console.log(sensible, rows.map(row => row._election + '/' + row._post_label));
				
			});
			
			function isOverlap(row1, row2) {
				
				var overlap12 = _isOverlap(row1, row2);
				var overlap21 = _isOverlap(row2, row1);
				var overlap = overlap12 || overlap21;
				return overlap;
				
				function _isOverlap(row1, row2) {
					var type1 = row1._election_type;
					var type2 = row2._election_type;
					var area1 = (type1 == 'local' || type1 == 'mayor') ? row1._election_name : row1._post_label;
					var area2 = (type2 == 'local' || type2 == 'mayor') ? row2._election_name : row2._post_label;
					
					var result = 
						areas[type1] && 
						areas[type1][area1] &&
						areas[type1][area1][type2] && 
						areas[type1][area1][type2].indexOf(area2) >= 0;
					
					return result;
				}
				
			}
			
		});
	});
	
});
