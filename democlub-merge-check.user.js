// ==UserScript==
// @name        Democracy Club merge check
// @namespace   sjorford@gmail.com
// @include     https://candidates.democracyclub.org.uk/person/*/update
// @include     https://candidates.democracyclub.org.uk/person/*/update/
// @version     2020.04.28.1
// @grant       none
// ==/UserScript==

$(function() {
	
	var mergeButton = $('#person-merge [type="submit"]').prop('disabled', true);
	var wrapper = $('<div></div>').insertAfter(mergeButton);
	var thisName = $('.person__hero h1').text().replace(/^Editing: /, '');
	var otherID;
	var inputOtherID = $('#other').on('change, keyup', event => {
		if (inputOtherID.val() == otherID) return;
		
		otherID = inputOtherID.val();
		mergeButton.prop('disabled', true);
		wrapper.text('Checking...');
		$.get(`/person/${otherID}`, (data, status, jqxhr) => {
			
			var otherName = $(data).find('.person__hero h1').text();
			wrapper.text('Merging with ' + otherName);
			if (otherName == thisName) {
				mergeButton.removeProp('disabled');
			} else {
				wrapper.append('<div>Are you sure?<div><input type="button" class="button sjo-yesimsure" value="Yes"></div></div>')
			}
			
			$('.sjo-yesimsure').click(event => mergeButton.removeProp('disabled'));
			
		}).fail((jqxhr, status, error) => wrapper.text(status + ': ' + error));
		
	});
	
});
