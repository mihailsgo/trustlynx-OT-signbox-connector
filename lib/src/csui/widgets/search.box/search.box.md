# SearchBoxView

Shows a text-box to enter a simple full-text search query.

A control waiting for the search query to be set and executing it is expected
to be placed on the page, otherwise there would be no effect.

### Example

```javascript
var queryRegion = new Marionette.Region({el: '#query'}),
    resultsRegion = new Marionette.Region({el: '#results'}),
    pageContext = new PageContext(),
    searchBoxView = new SearchBoxView({context: pageContext}),
    searchResultsView = new SearchResultsView({context: pageContext});

queryRegion.show(searchBoxView);
resultsRegion.show(searchResultsView);
```
### Extension support for quick links in Search box

Search box drop-down with recent search form (in search form container), renders based on the type, for example (quick, direct,undefined).

### How does these 'type' help in rendering search form?

"quick": When the model having the type as 'quick', the search forms container is prepared with search item as                quicklink in the form, which on clicking refines the search using the parameter 'where' and displays the standard search results.

"direct": When the model having the type as 'direct', the search form container is prepared with search item as search query in the form, which on clicking displays the custom view search.

### Attributes used

quickLink : returns boolean value, based on the type of the model. If type is 'quick' it enables the csui-icon-standard-search icon, else enables the csui-icon-query-form-search icon.

skipHeading : returns true if the search form has atleast one model with type as quick. If true, the heading of the form container is hidden.

#### parameters:

* `config.showOptionsDropDown` - *Boolean* flag to show/hide options dropdown.
Default: True.

* `config.enableSearchBarSettings` - *Boolean* flag to enable/disable support of stemming in search results.
Default: True.
