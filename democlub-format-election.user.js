// ==UserScript==
// @name        Democracy Club format election
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/*
// @exclude     https://candidates.democracyclub.org.uk/elections/
// @exclude     https://candidates.democracyclub.org.uk/elections/*/sopn/
// @version     2022.04.07.0
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	polyfill();
	
	$(`<style class="sjo-styles">
		
		.sjo-api-timeline {margin-bottom: 0.5rem;}
		.sjo-api-timeline-item {display: inline-block; border: 2px solid white; font-size: small; padding: 2px 2px 2px 16px;}
		.sjo-api-timeline-item:first-of-type {padding-left: 6px; border-top-left-radius: 5px; border-bottom-left-radius: 5px;}
		.sjo-api-timeline-item:last-of-type {padding-right: 6px; border-top-right-radius: 5px; border-bottom-right-radius: 5px; }
		
		.sjo-api-timeline-status_not_started {background-color: darkgrey; color: white;}
		.sjo-api-timeline-status_in_progress {background-color: #f6cd59; color: white;}
		.sjo-api-timeline-status_done {background-color: #8ccc8c; color: white;}
		
		.sjo-api-timeline-arrow.sjo-api-timeline-status_not_started:after {border-left-color: darkgrey;}
		.sjo-api-timeline-arrow.sjo-api-timeline-status_in_progress:after {border-left-color: #f6cd59;}
		.sjo-api-timeline-arrow.sjo-api-timeline-status_done:after {border-left-color: #8ccc8c;}

		/* http://www.cssarrowplease.com/ */
		.sjo-api-timeline-arrow {
			position: relative;
		}
		.sjo-api-timeline-arrow:after, .sjo-api-timeline-arrow:before {
			left: 100%;
			top: 50%;
			border: solid transparent;
			content: " ";
			height: 0;
			width: 0;
			position: absolute;
			pointer-events: none;
		}
		.sjo-api-timeline-arrow:after {
			border-width: 12px;
			margin-top: -12px;
		}
		.sjo-api-timeline-arrow:before {
			border-left-color: #ffffff;
			border-width: 15px;
			margin-top: -15px;
		}
		
		.sjo-page-election .sjo-results-name  {width: 250px;}
		.sjo-page-election .sjo-results-party {width: 300px;}
		.sjo-page-election .sjo-results-ward  {width: 300px;}
		.sjo-page-election .sjo-results-votes {width: 100px;}
		td.sjo-results-id, .sjo-results-votes {text-align: right;}
		th.sjo-results-id                     {text-align: center;}
		.sjo-results-votes-missing            {background-color: lightgray;}
		.sjo-results-pos                      {text-align: center;}
		.sjo-sort-hidden                      {display: none;}
		
		.sjo-party-bar {width: 10px !important; min-width: 10px; padding: 0;}
		tbody .sjo-party-bar {background-color: lightgrey; border: solid 1px #ddd;}
		.sjo-party-bar.sjo-party-notstanding                     {background-color: unset; border: unset;}
		.sjo-party-bar.sjo-party-conservative-and-unionist-party {background-color: blue;}
		.sjo-party-bar.sjo-party-labour-party                    {background-color: red;}
		.sjo-party-bar.sjo-party-labour-and-co-operative-party   {background-color: red;}
		.sjo-party-bar.sjo-party-liberal-democrats               {background-color: orange;}
		.sjo-party-bar.sjo-party-green-party                     {background-color: #00ea4b;}
		.sjo-party-bar.sjo-party-scottish-green-party            {background-color: #00ea4b;}
		.sjo-party-bar.sjo-party-uk-independence-party-ukip      {background-color: purple;}
		.sjo-party-bar.sjo-party-the-brexit-party                {background-color: #41e7ff;}
		.sjo-party-bar.sjo-party-scottish-national-party-snp     {background-color: yellow;}
		.sjo-party-bar.sjo-party-plaid-cymru-the-party-of-wales  {background-color: green;}
		
		.sjo-election-link-next a {border: 1px solid gray; padding: 5px; border-radius: 8px; background-color: gold; color: black;}
		
		.sjo-results-name, .sjo-results-party, .sjo-results-actions {width: 33%;}
		
		.button.show-new-candidate-form, .candidates-list__person .button {display: none;}
		
		.sjo-action {margin-right: 2em;}
		.sjo-action-selected {font-weight: bold;}
		
		.sjo-coop-logo {max-height: 18px; float: right;}
		.sjo-coop-logo path {fill: #3f1d70;}
		
		.sjo-previous-ballot {float: right; border: 1px solid gray; border-radius: 5px; padding: 2px 6px; background-color: #fdd;}
		
		.sjo-date-heading {float: right; font-size: larger; margin-top: 0.8rem !important;}
		
	</style>`).appendTo('head');
	
	$('div.panel').filter((index, element) => element.innerText.fullTrim() == 'These candidates haven\'t been confirmed by the official "nomination papers" from the council yet. This means they might not all end up on the ballot paper. We will manually verify each candidate when the nomination papers are published.').hide();
	
	$('#constituency-name').html((index, html) => html.replace('Police and Crime Commissioner', 'PCC'));
	
	var dateMatch = window.location.href.match(/\d{4}-\d{2}-\d{2}/);
	if (dateMatch) {
		$('<span class="sjo-date-heading"><span>').text(moment(dateMatch[0]).format("D MMM YYYY")).insertBefore('h1');
	}
	
	if (document.title.trim() == 'All ballots in current or future elections') {
		
		// All elections page
		// ================================
		
	} else if (document.title.trim().match(/^Known candidates for each ballot/)) {
		
		// Election summary pages
		// ================================
		
		$('body').addClass('sjo-page-election');
		
		$('.container table').each((index, element) => {
			formatResultsTable(element);
		});
		
		if ($('body').is('.sjo-election-haslists')) {
			
			// Collapse lists
			$('.container h3').each((i,e) => {
				var h3 = $(e);
				var collapsibles = h3.nextUntil('h3');
				var inner = $('<div class="sjo-list-inner"></div>').insertAfter(h3).append(collapsibles);
				var outer = $('<div class="sjo-list-outer"></div>').insertBefore(h3).append(h3).append(inner);
				$('<a class="sjo-list-expanded" href="#">▼</a>').prependTo(h3).click(event => collapseList(outer));
				$('<a class="sjo-list-collapsed" href="#">►</a>').prependTo(h3).click(event => expandList(outer)).hide();
			});
			
			var actions = $('<div></div>').insertBefore('.sjo-list-outer:first-of-type');
			$('<a href="#" style="font-weight: bold;">Collapse all</a>').click(event => collapseList('.sjo-list-outer') && false).appendTo(actions);
			$('<a href="#" style="font-weight: bold; margin-left: 1em;">Expand all</a>').click(event => expandList('.sjo-list-outer') && false).appendTo(actions);
			
			function collapseList(selector) {
				var wrapper = $(selector);
				wrapper.find('.sjo-list-inner').hide();
				wrapper.find('.sjo-list-expanded').hide();
				wrapper.find('.sjo-list-collapsed').show();
				return false;
			}
			
			function expandList(selector) {
				var wrapper = $(selector);
				wrapper.find('.sjo-list-inner').show();
				wrapper.find('.sjo-list-expanded').show();
				wrapper.find('.sjo-list-collapsed').hide();
				return false;
			}
			
		} else {
			
			// Highlight missing results
			$('.sjo-results-votes').filter((i,e) => e.innerText.trim() != '')
				.closest('.sjo-election-results')
				.find('.sjo-results-votes').filter((i,e) => e.innerText.trim() == '')
				.addClass('sjo-results-votes-missing');
			
			// Group by party
			$('.container h3').first().nextAll().addBack().wrapAll('<div class="sjo-view"></div>');
			var wrapper = $('<div class="sjo-view"></div>').insertAfter('.sjo-view').hide();
			var tableHeader = $('.sjo-election-results thead').first();
			
			var parties = $('td.sjo-results-party').toArray().map(e => e.innerText.trim());
			parties = [...new Set(parties)].sort();
			$.each(parties, (i,party) => {
				if (party == 'Labour and Co-operative Party') return;
				$('<h3></h3>').text(party).appendTo(wrapper);
				
				var table = $('<table class="sjo-election-results"></table>').appendTo(wrapper).on('click', 'th', sortResultsTable);
				tableHeader.clone().appendTo(table)
					.find('.sjo-results-party').text('Ward').removeClass('sjo-results-party').addClass('sjo-results-ward');
				
				$('td.sjo-results-party').filter((i,e) => e.innerText.trim().replace(/^Labour and Co-operative Party$/, 'Labour Party') == party).each((i,e) => {
					var row = $(e).closest('tr');
					var wardLink = row.closest('table').prevAll('h3').first().find('a'); //.text().replace(/🔐/, '').trim();
					var newRow = row.clone().appendTo(table);
					if (newRow.find('.sjo-results-party').text().trim() == 'Labour and Co-operative Party') {
						newRow.find('.sjo-results-name').append(coopLogo);
					}
					newRow.find('.sjo-results-party').empty().append(wardLink.clone()).removeClass('sjo-results-party').addClass('sjo-results-ward');
				});
				
			});
			
			var actions = $('<div></div>').insertBefore('.sjo-view:first-of-type');
			$('<a href="#" class="sjo-action">By ward</a>').click(event => toggleViews() && false).appendTo(actions).addClass('sjo-action-selected');
			$('<a href="#" class="sjo-action">By party</a>').click(event => toggleViews() && false).appendTo(actions);
			
			function toggleViews() {
				$('.sjo-action').toggleClass('sjo-action-selected');
				$('.sjo-view').toggle();
			}
			
		}
		
	} else {
		
		// Post pages
		// ================================
		
		$('body').addClass('sjo-page-post');
		
		// Add election link
		var electionName = document.title.match(/ in the (.*)/)[1];
		var slug = window.location.pathname.match(/\/elections\/(.*?)\//)[1];
		var slugParts = slug.match(/^([^\.]+(?:\.[acr])?)((\.[^\.]+)?\.[^\.]{3,}(?:\.by)?)?(\.\d\d\d\d-\d\d-\d\d)$/);
		if (slugParts[2]) {
			var parentSlug = slugParts[1] + (slugParts[3] ? slugParts[3] : '') + slugParts[4];
			$('<a></a>').text('➢ ' + electionName).attr('href', `/elections/${parentSlug}`)
				.prependTo($('.candidates-list, .no-candidates').closest('.columns')).wrap('<h3></h3>');
		}
		
		// Convert the timeline to a breadcrumb type thing
		var timeline = $('<div class="sjo-api-timeline"></div>').prependTo('.content .container');
		var items = $('.timeline_item div');
		items.each((index, element) => {
			var item = $(element);
			var text = item.find('strong').text().replace(/"|\.$/g, '');
			$('<div class="sjo-api-timeline-item"></div>')
				.text(text)
				.addClass(index == items.length - 1 ? '' : 'sjo-api-timeline-arrow')
				.addClass('sjo-api-timeline-' + item.attr('class'))
				.css({'zIndex': 99 - index})
				.appendTo(timeline);
		});
		items.closest('.columns').hide().prev('.columns').removeClass('large-9');
		
		$('.candidates-list').each((index, element) => {
			formatResultsTable(element);
		});
		
		$('h1').html((index, text) => text.replace('Police and Crime Commissioner', 'PCC'));
		
		// Shrink panel
		var panel = $('h3 + .panel:contains("🔄 This ballot replaces")');
		panel.find('a').insertBefore(panel.prev('h3')).addClass('sjo-previous-ballot');
		panel.remove();
		
		// Split lists into parties
		if (window.location.pathname.match(/\/(sp.r|senedd.r|naw.r|gla.a|europarl)\./)) {
			
			var table = $('.candidates-list').first();
			var head = table.children('thead');
			var rows = table.find('tbody > tr');
			var parties = $('td.sjo-results-party', rows).toArray().map(e => e.innerText.trim());
			parties = [...new Set(parties)].sort().sort((a,b) => a == 'Independent' ? 1 : b == 'Independent' ? -1 : 0);
			
			$.each(parties, (index,party) => {
				var partyRows = rows.filter((i,e) => $(e).children('td.sjo-results-party').text().trim() == party);
				if (party == 'Independent') {
					partyRows.each((i,e) => {
						addPartyTable(party, e);
					});
				} else {
					addPartyTable(party, partyRows);
				}
			});
			
			function addPartyTable(party, partyRows) {
				$('<h3></h3>').text(party).insertBefore(table);
				$('<table></table>').attr('class', table.attr('class')).insertBefore(table).append(head.clone()).append(partyRows);
			}
			
			if (table.find('tbody > tr').length == 0) {
				table.hide();
			}
			
		}
		
	}
	
	function formatResultsTable(selector) {
		
		var table = $(selector);
		var tbody = table.find('tbody:first-of-type');
		
		// Add table classes
		table.addClass('sjo-election-results');
		var posCol = table.getTableHeaders().indexOf('List position');
		if (posCol >= 0) {
			table.find('th').eq(posCol).text('Pos');
			$('body').addClass('sjo-election-haslists');
		}
		
		// Add blank party column to not-standing table
		if (table.getTableHeaders().indexOf('Party') < 0) {
			var nameCol = table.getTableHeaders().indexOf('Name');
			table.find(`thead tr th:nth-of-type(${nameCol+1})`).after('<th>Party</th>');
			table.find(`tbody tr td:nth-of-type(${nameCol+1})`).after('<td></td>');
		}
		
		// Add IDs column
		table.find('tbody tr').each((index, element) => {
			var tr = $(element);
			var nameCol = table.getTableHeaders().indexOf('Name');
			var id = tr.find('td').eq(nameCol).find('a').attr('href').match(/\/(\d+)\//)[1];
			tr.prepend(`<td class="sjo-results-id">${id}</td>`);
		});
		table.find('thead tr').prepend('<th class="sjo-results-id">ID</th>');
		
		// Add colour bar
		table.find('tbody tr').each((index, element) => {
			var tr = $(element);
			var partyCol = table.getTableHeaders().indexOf('Party');
			var party = tr.find('td').eq(partyCol).contents().first().text().trim();
			var partySlug = party == '' ? 'notstanding' : Utils.slugify(party);
			tr.prepend(`<td class="sjo-party-bar sjo-party-${partySlug}"></td>`);
		});
		table.find('thead tr').prepend('<th class="sjo-party-bar"></th>');
		
		// Highlight elected candidates
		var electedCol = table.getTableHeaders().indexOf('Elected?');
		if (electedCol >= 0) {
			
			table.find('th').eq(electedCol).text('').addClass('sjo-results-elected');
			tbody.find('tr').each((i,e) => {
				var cell = $(e).find('td').eq(electedCol).addClass('sjo-results-elected');
				cell.text(cell.text().replace(/^Yes$/, '★').replace(/^No$/, ''));
			});
			
		} else {
			
			// Split out new column
			var resultsCol = table.getTableHeaders().indexOf('Results');
			if (resultsCol >= 0) {
				table.find('th').eq(resultsCol).text('Votes');
				table.find('tr').each((i,e) => {
					var tr = $(e);
					var resultsCell = tr.find('td, th').eq(resultsCol);
					var electedCell = resultsCell.is('th') ? $('<th></th>') : $('<td></td>');
					electedCell.addClass('sjo-results-elected').insertAfter(resultsCell);
					if (resultsCell.text().match(/ \(elected\)/)) {
						electedCell.text('★');
						resultsCell.text(resultsCell.text().replace(/ \(elected\)/, ''));
					}
				});
			}
			
		}
		
		// Flag tied results
		var votesCol = table.getTableHeaders().indexOf('Votes');
		table.find('tr').each((i,e) => {
			var tr = $(e);
			
			var votesCell = tr.find('td, th').eq(votesCol);
			var tiedCell = (votesCell.is('th') ? $('<th></th>') : $('<td></td>')).addClass('sjo-results-tied').appendTo(tr);
			var votes = parseInt(votesCell.text().trim(), 10);
			if (votes === NaN) return;
			
			var ties = table.find('tr').not(tr).filter((i,e) => {
				var votesTied = parseInt($(e).find('td, th').eq(votesCol).text().trim(), 10);
				if (votes === NaN) return false;
				return (Math.abs(votes - votesTied) == 0);
			});
			
			var nearTies = table.find('tr').not(tr).filter((i,e) => {
				var votesTied = parseInt($(e).find('td, th').eq(votesCol).text().trim(), 10);
				if (votes === NaN) return false;
				return (Math.abs(votes - votesTied) == 1);
			});
			
			if (ties.length > 0) {
				tiedCell.text('(tie)');
			} else if (nearTies.length > 0) {
				tiedCell.text('(tie?)');
			}
			
		});
		
		// Add cell classes
		var headers = table.getTableHeaders();
		table.find('tr').each((i,e) => {
			$(e).find('td, th').each((i,e) => {
				var td = $(e);
				if (headers[i] == 'Name')    td.addClass('sjo-results-name');
				if (headers[i] == 'Pos')     td.addClass('sjo-results-pos');
				if (headers[i] == 'Party')   td.addClass('sjo-results-party');
				if (headers[i] == 'Actions') td.addClass('sjo-results-actions');
				
				// Format votes
				if (headers[i] == 'Votes') {
					td.addClass('sjo-results-votes');
					if (td.is('td') && td.text().trim() !== '') {
						var votes = td.text().trim() - 0;
						var votesSort = ('0000000000' + votes).substr('-10');
						var votesFormatted = votes.toLocaleString();
						td.html(`<span class="sjo-sort-hidden">${votesSort}</span> ${votesFormatted}`);
					}
				}
				
			});
		});
		
		table.on('click', 'th', sortResultsTable);
		
		// Default sort by votes first, name second
		if (posCol < 0 && !window.location.href.match(/\.[ar]\./)) {
			table.find('th.sjo-results-name').click();
			table.find('th.sjo-results-votes').click();
		}
		
	}
	
	// Click to sort tables
	function sortResultsTable(event) {
		
		var index = event.target.cellIndex;
		var cell = $(event.target);
		var sort = 
			(cell.is('.sjo-results-name')) ? nameSort : 
			(cell.is('.sjo-results-votes') || cell.is('.sjo-results-elected')) ? inverseSort : plainSort;
		var tbody = cell.closest('table').find('tbody');
		tbody.append(tbody.find('tr').toArray().sort(sort));
		return false;
		
		function nameSort(a, b) {
			var surnameRegex = /(\b(de( la)?|la|le|v[ao]n( de[rn]?)?) )?[^\s]+$/i;
			var aName = $(a.cells[index]).contents().not('svg').text().trim().toLowerCase();
			var bName = $(b.cells[index]).contents().not('svg').text().trim().toLowerCase();
			var aSurname = aName.match(surnameRegex)[0];
			var bSurname = bName.match(surnameRegex)[0];
			return (
				aSurname > bSurname ? 1 : aSurname < bSurname ? -1 : 
				aName    > bName    ? 1 : aName    < bName    ? -1 : 0);
		}
		
		function plainSort(a, b) {
			return _plainSort(a, b, 1);
		}
		
		function inverseSort(a, b) {
			return _plainSort(a, b, -1);
		}
		
		function _plainSort(a, b, order) {
			var aText = a.cells[index].textContent.trim();
			var bText = b.cells[index].textContent.trim();
			var sort;
			if (aText.match(/^\d+$/) && bText.match(/^\d+$/)) {
				var aNum = aText - 0;
				var bNum = bText - 0;
				sort = aNum > bNum ? 1 : aNum < bNum ? -1 : 0;
			} else {
				sort = aText > bText ? 1 : aText < bText ? -1 : 0;
			}
			return (order === -1) ? -sort : sort;
		}
		
	}
	
	function polyfill() {
			
		if (!String.prototype.fullTrim) {
			String.prototype.fullTrim = function() {
				return this.trim().replace(/(\s|\n|\r)+/g, ' ');
			};
		}
		
	}
	
	function coopLogo() {
		return `<svg class="sjo-coop-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.5 51.5">
<title>Labour and Co-operative Party</title>
<path d="M39.58,19.24A14.9,14.9,0,0,1,38.11,21a4,4,0,0,1-1.48,1A2.25,2.25,0,0,0,35,21c-1.82-.41-6.21.12-8.07.38a4.66,4.66,0,0,0-.21-1.05c1.15-.45,4.2-1.68,6.8-3A12.19,12.19,0,0,1,38,16.09a2.65,2.65,0,0,1,2.44.74c.28.43,0,1.29-.83,2.41M29.9,15l-.43.34-.22.18-.2.18c-.28.24-.55.5-.8.76l-.19.2-.18.21-.18.21-.17.22-.66.89a7.76,7.76,0,0,1-.74.89,5.14,5.14,0,0,0-.65-.75l0-.05.08-.09.14-.2.15-.2.08-.11.08-.11.16-.21c.06-.07.11-.15.17-.23l.38-.44a5.7,5.7,0,0,1,.43-.42c.14-.14.31-.26.46-.39a6,6,0,0,1,1-.6l.27-.12.29-.1a3.9,3.9,0,0,1,.59-.14Zm-4.71-.85c-.17.37-.37.7-.55,1s-.33.66-.52,1l-.1.16a3.57,3.57,0,0,0-.51-.45l0,0a4.91,4.91,0,0,1,.68-1,3.15,3.15,0,0,1,1-.72m-3,1.86A2.47,2.47,0,0,1,24,17.36a7.24,7.24,0,0,0-1.47-.21h-.69a7.34,7.34,0,0,0-1.47.21A2.46,2.46,0,0,1,22.21,16m-1.31-.11a4.22,4.22,0,0,0-.51.45,1.29,1.29,0,0,1-.09-.16c-.19-.35-.35-.68-.53-1s-.37-.66-.55-1a3.15,3.15,0,0,1,1,.72,4.91,4.91,0,0,1,.68,1l0,0m-2,2.43a5.14,5.14,0,0,0-.65.75,7.76,7.76,0,0,1-.74-.89c-.22-.3-.43-.6-.66-.89l-.17-.22-.18-.21-.18-.21-.19-.2a9.66,9.66,0,0,0-.8-.76l-.2-.18-.22-.18L14.51,15l.06-.08a3.9,3.9,0,0,1,.59.14l.29.1.27.12a6,6,0,0,1,1,.6,5.9,5.9,0,0,1,.46.39,5.7,5.7,0,0,1,.43.42l.38.44.17.23.16.21.08.11.08.11.15.2.22.29,0,.05m-8.07-.95c2.61,1.28,5.65,2.51,6.8,3a4.66,4.66,0,0,0-.21,1.05c-1.86-.26-6.25-.79-8.07-.38a2.25,2.25,0,0,0-1.6.88A4,4,0,0,1,6.3,21a16.1,16.1,0,0,1-1.47-1.73c-.81-1.12-1.1-2-.82-2.41a2.63,2.63,0,0,1,2.44-.74,12.2,12.2,0,0,1,4.41,1.32M8.3,22.29s0,0,0-.06a.79.79,0,0,1,.39-.32,3.38,3.38,0,0,1,.8-.26,8.94,8.94,0,0,1,1.71-.13,53.48,53.48,0,0,1,6.21.53,4.27,4.27,0,0,0,.14.95,1.54,1.54,0,0,0,.05.17h0a1.54,1.54,0,0,0,.05.17.08.08,0,0,0,0,0l-.41.2a10.31,10.31,0,0,1-4.17,1.17,5.68,5.68,0,0,1-3.91-1.33l-.07-.05a2.71,2.71,0,0,1-.8-.83.47.47,0,0,1,0-.25M12.92,36.8a11.64,11.64,0,0,0,1.64-3.73,16.89,16.89,0,0,0,.35-2c.09-.68.14-1.37.22-2.06,0-.17,0-.34.08-.52s0-.17,0-.26L15.3,28l.06-.26.07-.25a2.58,2.58,0,0,1,.08-.26,2.41,2.41,0,0,1,.08-.25,4.94,4.94,0,0,1,1.14-1.78l.16-.15a13.75,13.75,0,0,0-.53,2.47c0,.25-.05.5-.07.76h0c0,.27,0,.54,0,.81a10.61,10.61,0,0,0,.18,2,1.85,1.85,0,0,1,0,.23,10.52,10.52,0,0,1-.25,1.08l-.08.27a2.76,2.76,0,0,1-.08.27l-.1.26c0,.09-.06.18-.1.27a8.16,8.16,0,0,1-1.12,2,1.84,1.84,0,0,1-.17.22c-.06.07-.12.15-.19.22s-.12.14-.19.2l-.2.2a5.28,5.28,0,0,1-.87.69Zm4-7.74v-.42a10.87,10.87,0,0,0,10.53,0v.42A8.7,8.7,0,0,1,27,32a13.65,13.65,0,0,1-9.59,0,8.7,8.7,0,0,1-.47-2.91m.81,3.74a14.36,14.36,0,0,0,8.92,0,6.75,6.75,0,0,1-2.65,3h0l-.23.14-.1.06-.12.08-.1.06-.21.15-.13.08-.37.28-.05,0-.23.19-.06,0-.09.09h0l-.12.12L22.09,37h0l-.05,0h0l-.14-.13,0,0,0,0-.1-.08,0,0-.09-.07-.05,0c-.17-.13-.38-.28-.62-.44l-.1-.06-.45-.28h0a6.74,6.74,0,0,1-2.64-3m10.39-3.74c0-.27,0-.54,0-.81s0-.51-.07-.76A12.94,12.94,0,0,0,27.52,25l.16.15A4.94,4.94,0,0,1,28.82,27a2.41,2.41,0,0,1,.08.25,2.58,2.58,0,0,1,.08.26l.07.25.06.26.05.25c0,.09,0,.18,0,.26s.05.35.08.52c.08.69.13,1.38.22,2.06a16.89,16.89,0,0,0,.35,2,11.86,11.86,0,0,0,1.64,3.73l-.13.09a5,5,0,0,1-.88-.69,4.89,4.89,0,0,1-.39-.4,2,2,0,0,1-.19-.22l-.18-.22a8.12,8.12,0,0,1-1.11-2c0-.09-.07-.18-.1-.27l-.1-.26a2.76,2.76,0,0,1-.08-.27l-.08-.27A10.52,10.52,0,0,1,28,31.24,1.7,1.7,0,0,1,28,31a10.64,10.64,0,0,0,.18-2m-1.73-5,0,0c.05.1.09.2.13.3a12.42,12.42,0,0,1,.79,3h0c0,.2,0,.4.07.6a10.16,10.16,0,0,1-10.43,0c0-.19,0-.39.07-.58a12.15,12.15,0,0,1,.8-3c0-.1.08-.2.12-.3l0,0a6.94,6.94,0,0,0,8.41,0m-.06-1.67h0a3.9,3.9,0,0,1-.19.82.58.58,0,0,1-.05.14,1.39,1.39,0,0,1-.12.28l-.08.06-.06.05a6.35,6.35,0,0,1-7.29,0l-.06-.05-.08-.06a1.39,1.39,0,0,1-.12-.28.58.58,0,0,1-.05-.14,3.9,3.9,0,0,1-.19-.82,4.58,4.58,0,0,1,0-.53h0c0-.11,0-.21,0-.32a4.4,4.4,0,0,1,.21-1,3.85,3.85,0,0,1,.19-.47,4.91,4.91,0,0,1,.28-.5,4.3,4.3,0,0,1,.59-.69l.11-.11a4.17,4.17,0,0,1,5.58,0l.11.11a4.82,4.82,0,0,1,.58.69A4.91,4.91,0,0,1,26,20a3.85,3.85,0,0,1,.19.47,3.56,3.56,0,0,1,.21,1c0,.11,0,.21,0,.32h0a4.55,4.55,0,0,1,0,.53m8.85,1.07a5.68,5.68,0,0,1-3.91,1.33h-.07a10.46,10.46,0,0,1-4.1-1.17l-.4-.2s0,0,0,0l.06-.17h0c0-.06,0-.11,0-.17a4.36,4.36,0,0,0,.14-.95c1.78-.24,6.19-.78,7.92-.4a3.38,3.38,0,0,1,.8.26.89.89,0,0,1,.4.32l0,.06a.47.47,0,0,1,0,.25,2.71,2.71,0,0,1-.8.83Zm9.21,15V12.82L22.21,0,0,12.82V38.46L22.21,51.28Z"></path>
</svg>`;
	}
	
}
