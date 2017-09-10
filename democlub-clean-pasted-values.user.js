// ==UserScript==
// @name        Demo Club clean pasted values
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/*
// @version     2017-10-09
// @grant       none
// ==/UserScript==

$(function() {
	
	// Clean pasted values
	$('body').on('paste', 'input', event => setTimeout(() => event.target.value = cleanInputValue(event.target), 0));
	
});

function cleanInputValue(input) {
	
	// Trim all values
	var value = input.value.trim().replace(/\s+/g, ' ');
	
	// Reformat names
	if (input.name == 'q' || input.id == 'id_name' || input.id == 'alt-name' || input.id.match(/^id_form-\d+-name$/)) {
		var reverse = $('#sjo-reverse').is(':checked');
		value = cleanInputName(value, reverse);
	}
	
	return value;
	
}

// Trim pasted names and fix upper case names
function cleanInputName(value, reverse) {
	
	var match;
	
	// Check for Surname, Forenames
	match = value.match(/^([^,]+),(.+)$/);
	if (match) {
		return properCaseName(match[2]) + ' ' + properCaseName(match[1]);
	}
	
	// Check for SURNAME Forenames
	match = value.match(/^([-'A-Z ]{2,})\s+(.*[a-z].*)$/);
	if (match) {
		return properCaseName(match[2]) + ' ' + properCaseName(match[1]);
	}
	
	// Check for reverse flag
	if (reverse) {
		match = value.match(/^(\S+)\s+(.*)$/);
		if (match) {
			return properCaseName(match[2]) + ' ' + properCaseName(match[1]);
		}
	}
	
	return properCaseName(value);

}

function properCaseName(name) {
	
	name = name.trim();
	
	if (name.indexOf(' ') >= 0) return name.split(' ').map(value => properCaseName(value)).join(' ');
	if (name.indexOf('-') >= 0) return name.split('-').map(value => properCaseName(value)).join('-');
	
	if (name.match(/[a-z]/)) return name;
	
	if (name.substr(0, 2) == "O'") return "O'" + properCaseName(name.substr(2));
	if (name.substr(0, 2) == "MC") return "Mc" + properCaseName(name.substr(2));
	
	return name.substr(0, 1) + name.substr(1).toLowerCase();
	
}
