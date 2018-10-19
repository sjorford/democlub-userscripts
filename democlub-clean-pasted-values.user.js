// ==UserScript==
// @name        Democracy Club clean pasted values
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @version     2018.10.19.0
// @grant       none
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
	var value = input.value.trim().replace(/\s+/g, ' ');
	
	// Reformat names
	if (input.name == 'q' || input.id == 'id_name' || input.id == 'alt-name' 
		|| input.id.match(/^id_form-\d+-name$/)
		|| input.id.match(/^id_\d+-\d+-name$/)) {
		var reverse = $('#sjo-reverse').is(':checked');
		value = cleanInputName(value, reverse);
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
	
	value = value.replace(/\u200B/g, ' ').replace(/[`\u2019]/g, "'").trim();
	value = value.replace(/ - /g, '-');
	
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
	if (debug) console.log('properCaseName', name, name.codePointAt(0));
	
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
