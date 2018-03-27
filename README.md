# Democracy Club userscripts
Userscripts for wombles (womblescripts?) for use on https://candidates.democracyclub.org.uk/

To install:
1. Install [Tampermonkey](https://tampermonkey.net/) or another user script manager
2. Open the script on github.com
3. Click "Raw"
4. The script will install

Scripts will be updated automatically by Tampermonkey when there is a new version

## Script details



### democlub-candidate.user.js
Compact candidate pages:
* Line up labels and fields in tabular format
* Remove banners

### democlub-candidate-edit.user.js
Improvements to the candidate edit form:
* Line up labels and fields in tabular format
* Clean up and sort dropdown list of elections
* Display a warning if a candidate has no current elections

### democlub-show-other-candidates.user.js
Addition to the candidate edit form:
* Display a box in the sidebar showing other candidates already entered for this post (to avoid double-entry)

### democlub-clean-pasted-values.user.js
Automatically clean data pasted into any input field:
* Convert names from any format into Firstname Lastname
* Trim extra whitespace



### democlub-select-election.user.js
Compact the list of election buttons when adding a new candidate:
* Shorten text in buttons and show list in columns
* Sort by date and separate out mayoral elections
* Highlight the most recently selected election
* Add a search box to filter the list of elections



### democlub-bulk-adding.user.js
Speed up bulk add page:
* Line up labels and fields in tabular format
* Show one row at a time
* Option to include only active parties in the dropdown list (those with at least one candidate in a current election)
* Hide instructions

### democlub-bulk-adding-review.user.js
Improvements to bulk adding review page:
* Display list of previous candidacies for each name suggestion
* Add search links to candidate names
* Highlight radio button selection



### democlub-versions.user.js
Compact previous versions on candidate pages:
* Show fields in a table
* Highlight added and deleted data
* Highlight diffs in candidate statements (NOTE: this occasionally shows an incorrect diff when a completely new statement is pasted in, so don't rely on it)

### democlub-version-tree.user.js
Display previous versions as a tree, showing which IDs have been merged together and when

Suggestions on how to improve this by showing more useful data in the tree are welcome...




### democlub-format-post.user.js

### democlub-posts-list.user.js

### democlub-recent-changes.user.js

### democlub-search-results.user.js

### democlub-statistics.user.js
