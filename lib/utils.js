var Utils = {};

$(`<style>
	#sjo-party-select-original, #sjo-party-select-trimmed {display: none;}
</style>`).appendTo('head');

// ================================================
// Show only active parties in dropdowns
// ================================================

(function() {
	
	var selects, original, trimmed;
	
	Utils.formatPartySelects = formatPartySelects;
	Utils.showAllParties = showAllParties;
	
	function formatPartySelects(selector) {
		
		original = $('#sjo-party-select-original');
		trimmed = $('#sjo-party-select-trimmed');
		
		if (original.length == 0) {
			
			original = $('<select id="sjo-party-select-original"></select>').appendTo('body');
			trimmed = $('<select id="sjo-party-select-trimmed"></select>').appendTo('body');
			
			selects = $(selector);
			var options = selects.eq(0).children();
			
			options.each((index, element) => {
				var option = $(element);
				
				if (option.is('optgroup')) {
					var match = option.attr('label').match(/([\s\S]*)\((\d+) candidates?\)([\s\S]*)/);
					if (match) {
						option.attr('label', match[1] + ' [' + match[2] + ']' + match[3]);
						var trimmedOption = option.children('option').first().clone().appendTo(trimmed);
						trimmedOption.text(trimmedOption.text() + ' [' + match[2] + ']' + match[3]);
					}
				}
				
				if (option.is('option')) {
					if (index == 0) {
						option.clone().appendTo(trimmed);
					} else {
						var match = option.text().match(/([\s\S]*)\((\d+) candidates?\)([\s\S]*)/);
						if (match) {
							option.text(match[1] + ' [' + match[2] + ']' + match[3]).clone().appendTo(trimmed);
						}
					}
				}
				
			});
			
			original.append(options);
			
		}
		
		selects.html(trimmed.html());
		
	}

	function showAllParties() {
		
		var checked = $('#sjo-allparties').prop('checked');
		
		selects.each((index, element) => {
			var select = $(element);
			var val = select.find(':selected').val();
			if (!checked && trimmed.find('option').filter((index, element) => element.value == val).length == 0) {
				original.find('option').filter((index, element) => element.value == val).clone().appendTo(trimmed);
			}
		});

		var html = $(checked ? original : trimmed).html();
		
		selects.each((index, element) => {
			var select = $(element);
			var val = select.find(':selected').val();
			select.html(html).val(val);
		});
		
	}

})();

// ================================================
// Shorten organisation names
// ================================================

(function() {
	
	Utils.shortOrgName = shortOrgName;
	Utils.countryForElection = countryForElection;
	
	function shortOrgName(text) {
		var shortName = text.trim();
		if (shortName == 'City of London Corporation' || shortName == 'City of London') return 'City of London';
		return shortName.replace(/^(The )?(Borough of |Borough Council of |London Borough of |Royal Borough of |City of |City and County of |Council of the |Comhairle nan )?(.+?)(( County| County Borough| Borough| Metropolitan Borough| Metropolitan District| District| City and District| City)? Council| Combined Authority)?$/, '$3').replace(/ City(?! Region)/g, '');
	}
	
	function countryForElection(electionID) {
		var country = 'EN';
		if (electionID.match(/^sp\.|^(local|parl)\.[^.]*(aberdeen|airdrie|angus|argyll|ayrshire|banff|berwickshire|caithness|carrick|clackmannan|coatbridge|cumbernauld|dumfries|dundee|du[mn]barton|east-kilbride|edinburgh|eilean-siar|eileanan-an-iar|falkirk|fife|glasgow|glenrothes|gordon|hamilton|highland|inverclyde|inverness|kilmarnock|kirkcaldy|lanark|livingston|lothian|moray|motherwell|orkney|perth|renfrew|scottish-borders|shetland|skye|stirling)/)) {
			country = 'SC';
		} else if (electionID.match(/^naw\.|^(local|parl|pcc)\.[^.]*(aberavon|anglesey|arfon|brecon|bridgend|caerphilly|cardiff|carmarthen|ceredigion|clwyd|conwy|cynon|deeside|delyn|denbigh|flint|glamorgan|gower|gwent|gwynedd|islwyn|llanelli|meirionnydd|merthyr|monmouth|montgomery|neath|newport|ogmore|pembroke|pontypridd|powys|rhondda|swansea|torfaen|wales|wrexham|ynys-m)/)) {
			country = 'WA';
		} else if (electionID.match(/^nia\.|^(local|parl)\.[^.]*(antrim|armagh|belfast|causeway|derry|(north|south)-down([^s]|$)|fermanagh|foyle|lagan-valley|lisburn|newry|strangford|tyrone|ulster|upper-bann)/)) {
			country = 'NI';
		}
		return country;
	}

})();

// ================================================
// Collapse a section
// ================================================

(function() {
	
	Utils.collapseSection = collapseSection;
	
	function collapseSection(section, heading, expand) {
		
		var sectionWrapper = $('<div class="sjo-collapsiblesection"></div>').insertBefore(section);
		sectionWrapper.append(section); // avoiding wrapAll because it creates a new wrapper element
		
		var buttonWrapper = $('<span class="sjo-collapsiblesection-buttons"></span>').appendTo(heading);
		var expandButton = $('<a>[Expand]</a>').appendTo(buttonWrapper);
		var collapseButton = $('<a>[Collapse]</a>').appendTo(buttonWrapper);
		
		if (expand) {
			expandButton.hide();
		} else {
			collapseButton.hide();
			sectionWrapper.hide();
		}
		
		var buttons = expandButton.add(collapseButton);
		var toggleTargets = buttons.add(sectionWrapper);
		buttons.click(() => toggleTargets.toggle());
		
		return {sectionWrapper: sectionWrapper, buttonWrapper: buttonWrapper, expandButton: expandButton, collapseButton: collapseButton};
		
	}
	
})();

// ================================================
// Create links from raw URLs
// ================================================

(function() {
	
	Utils.formatLinks = formatLinks;
	
	function formatLinks(html, maxLength) {
		return html.replace(/https?:\/\/[^\s]+/g, function(match) {
			return '<a href="' + match + '">' + (maxLength && match.length > maxLength ? (match.substr(0, maxLength) + '...') : match) + '</a>';
		});
	}
	
})();

// ================================================
// Get table headings
// ================================================

(function() {
	
	Utils.tableHeadings = tableHeadings;
	
	function tableHeadings(element) {
		var headings = {};
		$(element).filter('table').eq(0).find('th').first().closest('tr').find('th').each(function(index, element) {
			var text = $(element).text();
			headings[text] = index;
			headings[index] = text;
		});
		return headings;
	}
	
})();

// ================================================
// Shorten party names
// ================================================

(function() {
	
	Utils.shortPartyName = shortPartyName;
	
	function shortPartyName(party) {
		return parties[party.id] ? parties[party.id] : party.name;
	}
	
	var parties = {
		
		'party:52':  			'Conservative',
		'party:53':  			'Labour',
		'joint-party:53-119':  	'Labour/Co-op',
		'party:90':  			'Lib Dem',
		'party:63':  			'Green',
		'party:130': 			'Green',
		'party:85':  			'UKIP',
		'party:102': 			'SNP',
		'party:77': 			'Plaid Cymru',
		'party:804': 			'TUSC',
		
		'party:83':  			'UUP',
		'party:70':  			'DUP',
		'party:55':  			'SDLP',
		'party:39':  			'Sinn Féin',
		'party:103':  			'Alliance',
		'party:305': 			'Green',
		'party:773': 			'PBP',
		'party:680':  			'TUV',
		'party:101':  			'PUP',
		'party:51':  			'Conservative',
		'party:84':  			'UKIP',
		
		'ynmp-party:2': 		'Ind',
		
	};
	
})();
