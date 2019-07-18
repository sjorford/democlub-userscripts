// ==UserScript==
// @name        Democracy Club format election
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/elections/*
// @version     2019.07.18.2
// @grant       none
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
		
		.sjo-election-summary tr > *:nth-of-type(1) {width: 250px;}
		.sjo-election-summary tr > *:nth-of-type(2) {width: 300px;}
		.sjo-election-summary tr > *:nth-of-type(3) {width: 100px; text-align: right;}
		
		.sjo-election-summary-lists tr > *:nth-of-type(1) {width: 250px;}
		.sjo-election-summary-lists tr > *:nth-of-type(2) {text-align: center;}
		.sjo-election-summary-lists tr > *:nth-of-type(3) {width: 300px;}
		.sjo-election-summary-lists tr > *:nth-of-type(4) {width: 100px; text-align: right;}
		
		.sjo-party-bar {float: left; width: 0.5rem; height: 4em; margin-right: 0.25rem; background-color: lightgrey;}
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
		
	</style>`).appendTo('head');
	
	$('div.panel').filter((index, element) => element.innerText.fullTrim() == 'These candidates haven\'t been confirmed by the official "nomination papers" from the council yet. This means they might not all end up on the ballot paper. We will manually verify each candidate when the nomination papers are published.').hide();
	
	$('#constituency-name').html((index, html) => html.replace('Police and Crime Commissioner', 'PCC'));
	
	if (document.title.match(/Known candidates for each ballot/)) {

		// Election summary pages
		// ================================

		$('.container table').each((index, element) => {
			
			var table = $(element);
			var tbody = table.find('tbody');
			if (table.find('th:nth-of-type(2)').text().trim() == 'List position') {
				table.find('th:nth-of-type(2)').text('Pos');
				table.addClass('sjo-election-summary-lists');
			} else {
				table.addClass('sjo-election-summary');
			}
			
			// Sort candidates
			tbody.append(tbody.find('tr').toArray().sort((a, b) => {
				var nameA = a.cells[0].innerText.trim();
				var nameB = b.cells[0].innerText.trim();
				var surnameA = nameA.match(/[^\s]+$/)[0];
				var surnameB = nameB.match(/[^\s]+$/)[0];
				return surnameA > surnameB ? 1 : surnameA < surnameB ? -1 : nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
			}));
			
			// Highlight elected candidates
			table.find('th:nth-of-type(4)').html('');
			tbody.find('tr td:nth-of-type(4)').each((index, element) => {
				if (element.innerHTML == 'Yes') {
					element.innerHTML = '★';
				} else if (element.innerHTML == 'No') {
					element.innerHTML = '';
				}
			});
			
		});
		
	} else {
		
		// Post pages
		// ================================
		
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
		
		// Add colour bar to photos
		$('.candidates-list__person').each((index, element) => {
			var partySlug = $('.party', element).text().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');
			var avatar = $('.person-avatar', element).before(`<div class="sjo-party-bar sjo-party-${partySlug}"></div>`);
		});
		
	}
	
	function polyfill() {
			
		if (!String.prototype.fullTrim) {
			String.prototype.fullTrim = function() {
				return this.trim().replace(/(\s|\n|\r)+/g, ' ');
			};
		}
		
	}
	
}
