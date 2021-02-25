// ==UserScript==
// @name        Democracy Club format election
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/*
// @exclude     https://candidates.democracyclub.org.uk/elections/
// @version     2021.02.25.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/js/master/sjo-jq.js
// ==/UserScript==

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	polyfill();
	
	$(`<style>
		
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
		.sjo-page-election .sjo-results-votes {width: 100px;}
		.sjo-results-votes {text-align: right;}
		.sjo-results-pos   {text-align: center;}
		.sjo-sort-hidden {display: none;}
		
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
		
		.candidates-list td {width: 33%;}
		
		.button.show-new-candidate-form, .candidates-list__person .button {display: none;}
		
		.sjo-action {margin-right: 2em;}
		.sjo-action-selected {font-weight: bold;}
		
	</style>`).appendTo('head');
	
	$('div.panel').filter((index, element) => element.innerText.fullTrim() == 'These candidates haven\'t been confirmed by the official "nomination papers" from the council yet. This means they might not all end up on the ballot paper. We will manually verify each candidate when the nomination papers are published.').hide();
	
	$('#constituency-name').html((index, html) => html.replace('Police and Crime Commissioner', 'PCC'));
	
	if (document.title.match(/Known candidates for each ballot/)) {
		
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
			
			// Group by party
			$('.container h3').first().nextAll().addBack().wrapAll('<div class="sjo-view"></div>');
			var wrapper = $('<div class="sjo-view"></div>').insertAfter('.sjo-view').hide();
			var tableHeader = $('.sjo-election-results thead').first();
			
			var parties = $('td.sjo-results-party').toArray().map(e => e.innerText.trim());
			parties = [...new Set(parties)].sort();
			console.log(parties);
			$.each(parties, (i,party) => {
				$('<h3></h3>').text(party).appendTo(wrapper);
				
				var table = $('<table></table>').appendTo(wrapper).append();
				tableHeader.clone().appendTo(table)
					.find('.sjo-results-party').text('Ward').removeClass('sjo-results-party').addClass('sjo-results-ward');
				
				$('td.sjo-results-party').filter((i,e) => e.innerText.trim() == party).each((i,e) => {
					var row = $(e).closest('tr');
					var ward = row.closest('table').prevAll('h3').first().text().trim();
					var newRow = row.clone().appendTo(table);
					newRow.find('.sjo-results-party').text(ward).removeClass('sjo-results-party').addClass('sjo-results-ward');
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
		items.closest('.columns').hide();
		
		$('.candidates-list').each((index, element) => {
			formatResultsTable(element);
		});
		
		$('h1').html((index, text) => text.replace('Police and Crime Commissioner', 'PCC'));
		
		// Split lists into parties
		if (window.location.pathname.match(/\/(sp.r|senedd.r|naw.r|gla.a|europarl)\./)) {
			
			var table = $('.candidates-list');
			var head = table.children('thead');
			var rows = $('.candidates-list > tbody > tr');
			var parties = $('td.sjo-results-party', rows).toArray().map(e => e.innerText.trim());
			parties = [...new Set(parties)].sort();
			
			$.each(parties, (index,party) => {
				var partyRows = rows.filter((i,e) => $(e).children('td.sjo-results-party').text().trim() == party);
				$('<h3></h3>').text(party).insertBefore(table);
				$('<table></table>').attr('class', table.attr('class')).insertBefore(table).append(head.clone()).append(partyRows);
			});
			
			if (table.find('tbody > tr').length == 0) {
				table.hide();
			}
			
		}
		
	}
	
	function formatResultsTable(selector) {
		
		var surnameRegex = /(\b(de|de la|la|le|von|van|van der) )?[^\s]+$/i;
		
		var table = $(selector);
		var tbody = table.find('tbody:first-of-type');
		var headers = table.getTableHeaders();
		
		// Add table classes
		table.addClass('sjo-election-results');
		var posIndex = headers.indexOf('List position');
		if (posIndex >= 0) {
			table.find('th').eq(posIndex).text('Pos');
			$('body').addClass('sjo-election-haslists');
		}
		
		// Add blank party column to not-standing table
		var partyCol = headers.indexOf('Party');
		if (partyCol < 0) {
			var nameCol = headers.indexOf('Name');
			table.find(`thead tr th:nth-of-type(${nameCol+1})`).after('<th>Party</th>');
			table.find(`tbody tr td:nth-of-type(${nameCol+1})`).after('<td></td>');
			headers = table.getTableHeaders();
			partyCol = headers.indexOf('Party');
		}
		
		// Add colour bar
		table.find('tbody tr').each((index, element) => {
			var tr = $(element);
			var party = tr.find('td').eq(partyCol).text().trim();
			var partySlug = party == '' ? 'notstanding' : slugify(party);
			tr.prepend(`<td class="sjo-party-bar sjo-party-${partySlug}"></td>`);
		});
		headers = table.find('thead tr').prepend('<th class="sjo-party-bar"></th>');
		headers = table.getTableHeaders();
		
		// Highlight elected candidates
		var electedIndex = headers.indexOf('Elected?');
		if (electedIndex >= 0) {
			table.find('th').eq(electedIndex).text('').addClass('sjo-results-elected');
			tbody.find('tr').each((i,e) => {
				var cell = $(e).find('td').eq(electedIndex).addClass('sjo-results-elected');
				cell.text(cell.text().replace(/^Yes$/, '★').replace(/^No$/, ''));
			});
		} else {
			
			// Split out new column
			var resultsIndex = headers.indexOf('Results');
			if (resultsIndex >= 0) {
				table.find('th').eq(resultsIndex).text('Votes');
				table.find('tr').each((i,e) => {
					var tr = $(e);
					var resultsCell = tr.find('td, th').eq(resultsIndex);
					var electedCell = (resultsCell.is('th')) ? $('<th></th>') : $('<td></td>');
					electedCell.addClass('sjo-results-elected').insertAfter(resultsCell);
					if (resultsCell.text().match(/ \(elected\)/)) {
						electedCell.text('★');
						resultsCell.text(resultsCell.text().replace(/ \(elected\)/, ''));
					}
				});
			}
			
		}
		
		// Refresh table headers
		headers = table.getTableHeaders();
		
		// Add cell classes
		table.find('tr').each((i,e) => {
			$(e).find('td, th').each((i,e) => {
				var td = $(e);
				if (headers[i] == 'Name')  td.addClass('sjo-results-name');
				if (headers[i] == 'Pos')   td.addClass('sjo-results-pos');
				if (headers[i] == 'Party') td.addClass('sjo-results-party');
				
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
		
		// Click to sort
		table.on('click', 'th', event => {
			
			var index = event.target.cellIndex;
			var cell = $(event.target);
			var sort = (cell.is('.sjo-results-name')) ? nameSort : 
			           (cell.is('.sjo-results-votes') || cell.is('.sjo-results-elected')) ? inverseSort : plainSort;
			tbody.append(tbody.find('tr').toArray().sort(sort));
			
			function nameSort(a, b) {
				var aName = a.cells[index].textContent.trim();
				var bName = b.cells[index].textContent.trim();
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
			
		});
		
		// Default sort by name
		if (posIndex < 0) {
			table.find('th.sjo-results-name').click();
		}
		
	}
	
	function polyfill() {
			
		if (!String.prototype.fullTrim) {
			String.prototype.fullTrim = function() {
				return this.trim().replace(/(\s|\n|\r)+/g, ' ');
			};
		}
		
	}
	
	// TODO: move this to Utils
	function slugify(text) {
		return text.toLowerCase().replace(/[^a-z0-9'’]+/g, ' ').trim().replace(/\s+/g, '-')
	}
	
}