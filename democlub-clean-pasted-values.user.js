// ==UserScript==
// @name        Democracy Club clean pasted values
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @version     2022.03.24.0
// @grant       none
// @require     https://raw.githubusercontent.com/sjorford/democlub-userscripts/master/lib/utils.js
// ==/UserScript==

var debug = false;

// temporary fix due to c.dc script errors
// $(onready);
window.setTimeout(onready, 0);

function onready() {
	
	// Clean pasted values
	$('body').on('paste', 'input', event => setTimeout(() => event.target.value = cleanInputValue(event.target), 0));
	$('body').on('paste', '#id_biography', event => setTimeout(() => event.target.value = event.target.value.trim(), 0));
	
}

function cleanInputValue(input) {
	
	// Trim all values
	var value = input.value.replace(/\s+/g, ' ').trim();
	
	// Trim trailing LTR isolate
	// c.f. https://twitter.com/RBKIndependents/status/1505227320176615435
	value = value.replace(/\s*\u2066\s*$/, '');
	
	// Replace Greek/Cyrillic characters
	// c.f. https://twitter.com/NicolaFR_
	var nonLatin = 'ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ' + 'АВЕЅІЈМНОРСТХ';
	var latin    = 'ABEZHIKMNOPTYX' + 'ABESIJMHOPCTX';
	var charArray = value.split(''); // string type is immutable, so use array instead
	for (var pos = 0; pos < charArray.length; pos++) {
		charArray[pos] = latin[nonLatin.indexOf(charArray[pos])] || charArray[pos];
	}
	value = charArray.join('');
	
	// Reformat names
	if (input.name == 'q' || input.id == 'id_name' || input.id == 'alt-name' 
		|| input.id.match(/^id_form-\d+-name$/)
		|| input.id.match(/^id_\d+-\d+-name$/)) {
		var reverse = $('#sjo-reverse').is(':checked');
		value = cleanInputName(value, reverse);
		setTimeout(() => Utils.validateNameField(input), 0);
	}
	
	// Remove @ from Twitter handle
	if (input.name == 'twitter_username') {
		value = value.replace(/^@/, '');
	}
	
	return value;
	
}

// Trim pasted names and fix upper case names
function cleanInputName(value, reverse) {
	if (debug) console.log('cleanInputName', value, reverse);
	
	// Replace non standard characters
	value = value
		.replace(/[\u200B]/g, ' ')
		.replace(/[\u0060\u2019]/g, "'")
		.replace(/[\u2010]/g, "-")
		.trim();
	
	// Fix hyphen spacing
	value = value.replace(/ ?- ?/g, '-');
	
	var match, cleanedName;
	
	// Check for Surname, Forenames
	match = value.match(/^([^,]+?)\s*,\s*(.+?)$/);
	if (match) {
		if (debug) console.log('cleanInputName route 1');
		cleanedName = properCaseName(match[2]) + ' ' + properCaseName(match[1]);
		if (debug) console.log('cleanInputName', cleanedName);
		return cleanedName;
	}
	
	// Check for SURNAME Forenames
	match = value.match(/^([-'A-Z ]{2,}|Mc[-'A-Z ]{2,})\s+(.*[a-z].*)$/);
	if (match) {
		if (debug) console.log('cleanInputName route 2');
		cleanedName = properCaseName(match[2]) + ' ' + properCaseName(match[1]);
		if (debug) console.log('cleanInputName', cleanedName);
		return cleanedName;
	}
	
	// Check for SURNAMEForenames
	match = value.match(/^([-'A-Z ]{2,}|Mc[-'A-Z ]{2,})([A-Z].*[a-z].*)$/);
	if (match) {
		if (debug) console.log('cleanInputName route 4');
		cleanedName = properCaseName(match[2]) + ' ' + properCaseName(match[1]);
		if (debug) console.log('cleanInputName', cleanedName);
		return cleanedName;
	}
	
	// Check for reverse flag
	if (reverse) {
		match = value.match(/^(\S+)\s+(.*)$/);
		if (match) {
			if (debug) console.log('cleanInputName route 3');
			cleanedName = properCaseName(match[2]) + ' ' + properCaseName(match[1]);
			if (debug) console.log('cleanInputName', cleanedName);
			return cleanedName;
		}
	}
	
	if (debug) console.log('cleanInputName default route');
	cleanedName = properCaseName(value);
	if (debug) console.log('cleanInputName', cleanedName);
	return cleanedName;
	
}

function properCaseName(name) {
	if (debug) console.log('properCaseName', name);
	
	// Split names at spaces and hyphens
	if (name.indexOf(' ') >= 0) return name.split(' ').map(value => properCaseName(value)).join(' ');
	if (name.indexOf('-') >= 0) return name.split('-').map(value => properCaseName(value)).join('-');
	
	// Convert McNAME format
	if (name.match(/^Mc[A-Z]+$/)) return name.substr(0, 3) + name.substr(3).toLowerCase();
	
	// Otherwise, if the name has any lower case letters, return it unchanged
	if (name.match(/[a-z]/)) return name;
	
	// Convert upper case prefixes separately from the remainder
	if (name.substr(0, 2) == "O'") return "O'" + properCaseName(name.substr(2));
	if (name.substr(0, 2) == "MC") return "Mc" + properCaseName(name.substr(2));
	
	// Proper case upper case names
	return name.substr(0, 1) + name.substr(1).toLowerCase();
	
}
