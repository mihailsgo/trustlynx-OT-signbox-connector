/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
var assert = require('assert');

Feature('Search Results Test cases');

BeforeSuite((I) => {
    I.loginTo('CONTENT_SERVER');
    I.ensureNotInAccesibilityMode();
    I.waitMaxTimeForElement(".icon-global-search");
    I.seeElement(".icon-global-search");
});

Scenario('Validate Global search Icon', (I) => {
    I.waitMaxTimeForElement(".icon-global-search");
    I.seeElement(".icon-global-search");
    I.click(".icon-global-search");
});

Scenario('Validate icons on Search box:', (SRV) => { 
    SRV.validateSearchBoxIcons('*');
});

Scenario('Check whether Search from here is there in global search(Should not be there)',(I)=>{
    I.dontSeeElement('.csui-ellipsis');
});

Scenario('Validate start search', (I, SRV) => {
    I.click("[title='Start search']");
    SRV.verifyHeader();
});

Scenario('Validate header count with total container items', async (SRV) => {
    expect(await SRV.validateItemCount()).to.be.true;
});

Scenario('Search results go back button tooltip',async (I) => {
    let tooltip=await I.grabAttributeFrom('.icon.arrow_back.cs-go-back.search_results_nodata.search_results_data','title');
    I.say(tooltip+' is tooltip obtained for search results go back button');
    expect(tooltip).to.equal("Go back to 'back'");
});

Scenario('Tabular search view icon tooltip',async (I) => {
    tooltip=await I.grabAttributeFrom('.csui-search-header-action.csui-tabular-view','title');
    I.say(tooltip+' is tooltip obtained for tabular search view icon');
    expect(tooltip).to.equal('Tabular search view');
});

Scenario('Setting Icon tooltip',async (I) => {
    tooltip=await I.grabAttributeFrom('.csui-setting-icon','title');
    I.say(tooltip+' is tooltip obtained for settings icon');
    expect(tooltip).to.equal('Search Settings');
});

Scenario('Select all tooltip',async (I) => {
    tooltip=await I.grabAttributeFrom('.csui-control.csui-checkbox','title');
    I.say(tooltip[0]+' is tooltip obtained for select all button');
    expect(tooltip[0]).to.equal('Select all results on current page.');
});

Scenario('Search header expand all tooltip',async (I) => {
    tooltip=await I.grabAttributeFrom('.csui-search-header-expand-all','title');
    I.say(tooltip+' is tooltip obtained for search header expand all button');
    expect(tooltip).to.equal('Expand all');
});

Scenario('validate filter icon', (SRV) => {
    SRV.validateFilterIcon();
});

Scenario('validate facet in filter', async (SRV) => {
    expect(await SRV.validateFacet(2)).to.be.true;
});

Scenario('Apply filter',(SRV) => {
    SRV.applyFilter();
});

Scenario('Close filter', (I) => {
    I.click('.csui-icon-v2-on.csui-icon-v2__csui_action_filter32');
    I.seeElement('.csui-icon-v2__csui_action_filter32');
});

Scenario('select all', (SRV) => {
    SRV.selectAll();
});

Scenario('unselect all', (SRV) => {
    SRV.unselectAll();
});

Scenario('Select all and increase page size to check select all changes accordingly',async (SRV)=> {
    expect(await SRV.validateSelectAllButton()).to.be.true;
    SRV.unselectAll();
});

Scenario('select an item', (SRV) => {
    SRV.selectNode(1);
});

Scenario('unselect an item', (I, SRV) => {
    SRV.unselectNode(1);
    I.dontSeeElement(".csui-selected-count.csui-acc-tab-region.binf-hidden");
});

Scenario('Validate expand/collapse', (SRV) => {
    SRV.validateExpandCollapse();
});

Scenario('Verify pagination view', (SREV) => {
    SREV.verifyPaginationView();
});

Scenario('Verify pagination menu', async (SREV) => {
    expect(await SREV.verifyPaginationMenu()).to.be.true;
});

Scenario('Change the page size', async (SREV) => {
    expect(await SREV.changePageSize()).to.be.true;
});

Scenario('Navigate to enterprise/automation test folder', (I, Data) => {
    I.navigateToTestFolderByName('CONTENT_SERVER',Data.automationFolder);
}).injectDependencies({ Data: require('./data.js') });

Scenario(' search in test folder', async (I, SRV) => {
    I.click('.icon-global-search');
    I.waitMaxTimeForElement('.csui-ellipsis');
    I.seeElement('.csui-ellipsis');
    let searchFromHere = await I.grabAttributeFrom('.csui-ellipsis','innerText');
    assert.equal(searchFromHere,'Search from here (Automation test data(Do not delete folder or subitems))');
    expect(await SRV.validateSearchInTestFolder()).to.be.true;
    SRV.validateSearchBoxIcons('test');
    I.click(".csui-search.search-input-open [title='Start search']");
    I.waitMaxTimeForElement('.csui-search-header-title');
});

Scenario('Verify Search settings options', (SREV) => {
    SREV.searchSettingsOptions();
});

Scenario('Verify column setting option', (SRV) => {
    SRV.columnSettingsOption();
});

Scenario('Click on expand all icon', (I) => {
    I.seeElement('.csui-search-header-expand-all[title="Expand all"]');
    I.click('.csui-search-header-expand-all[title="Expand all"]');
    I.seeElement('.csui-search-header-expand-all .icon-expandArrowUp');
});

Scenario('Verify category column on test folder', (SRV) => {
    SRV.verifyCategoryColumn();
});

Scenario('Verify Category multivalue',async (SRV) => {
    expect(await SRV.verifyCategoryMultiValue()).to.be.true;
});

Scenario('Open and verify multivalue category popover list',(SRV) => {
    SRV.openCategoryListPopover();
});

Scenario('Check whether number of categories on popover matches with count displayed',async (SRV) => {
    expect(await SRV.checkCategoryPopoverCount()).to.be.true;
});

Scenario('Verify up and down arrows in the flyout',async (SRV) => {
    expect(await SRV.verifyUpDownArrowsInPopover()).to.be.true;
});

Scenario('Press Escape key and verify whether popover is closed', (SRV) => {
    SRV.verifyEscapeOnPopover();
});

Scenario('Reopen category popover', (SRV) => {
    SRV.openCategoryListPopover();
});

Scenario('click outside and check whether popover is closed', (SRV) => {
    SRV.clickOutsideToClosePopover();
}); 

Scenario('Switch to table view',(I) => {
    I.seeElement('.csui-icon-v2__csui_action_table_tabular32');
    I.click('.csui-icon-v2__csui_action_table_tabular32');
    I.waitMaxTimeForElement('.csui-search-header-action.csui-tabular-view.csui-toggledView');
    I.seeElement('.csui-search-header-action.csui-tabular-view.csui-toggledView');
});

Scenario('Check category column in tabular view', (I) => {
    I.seeElement('.binf-table.dataTable .csui-table-cell-category');
});

Scenario('Verify Category multivalue in table view', async (SRV) => {
    expect(await SRV.verifyCategoryMultiValueTable()).to.be.true;
});

Scenario('Open and verify multivalue category popover list in table view',(SRV) => {
    SRV.openCategoryListPopoverTableView();
});

Scenario('Check whether number of categories on popover matches with count displayed in table view',async (SRV) => {
    expect(await SRV.checkCategoryPopoverCountTableView()).to.be.true;
});

Scenario('Verify up and down arrows in the flyout in table view',async (SRV) => {
    expect(await SRV.verifyUpDownArrowsInPopover()).to.be.true;
});

Scenario('Press Escape key and verify whether popover is closed in table view', (SRV) => {
    SRV.verifyEscapeOnPopover();
});

Scenario('Reopen category popover in table view', (SRV) => {
    SRV.openCategoryListPopoverTableView();
});

Scenario('Click outside the category popover and check whether popover is closed in table view', (SRV) => {
    SRV.clickOutsideToClosePopover();
});

Scenario('Switch back to standard search view', (I) => {
    I.seeElement('.csui-search-header-action.csui-tabular-view.csui-toggledView[title="Standard search view"]');
    I.click('.csui-search-header-action.csui-tabular-view.csui-toggledView[title="Standard search view"]');
    I.waitMaxTimeForElement('.csui-search-header-action.csui-tabular-view');
    I.seeElement('.csui-search-header-action.csui-tabular-view');
});

Scenario('Verify Summary description setting option', (I,SRV) => {
    I.waitMaxTimeForElement(".csui-search-header .csui-setting-icon");
    I.seeElement('.csui-search-header .csui-setting-icon');
    I.click('.csui-search-header .csui-setting-icon');
    SRV.summaryDescriptionSettingsOption();
});
Scenario.skip('Check Sort by options',async (SRV) => {
    expect(await SRV.checkSortByOptions()).to.equal('Sort by Relevance');
});

Scenario.skip('Change sort option to Date',async (SRV) => {
    expect(await SRV.changeSortOption()).to.equal('Date: Click to sort ascending');
});

Scenario('Validate close search button', (SRV) => {
   SRV.validateCloseSearchButton();
});

Scenario('Press Enter to start search',async (I) => {
    expect(await I.checkFocusOnElement('.icon-global-search','Enter')).to.be.true;
});

Scenario('Shift focus to Search From here in search dropdown',async (I) => {
    expect(await I.checkFocusOnElement('.csui-searchbox-option.selected','Tab')).to.be.true;
});

Scenario('Uncheck and check Search from here option',async (I) => {
    I.pressKey('Enter');
    expect(await I.checkFocusOnElement('.csui-searchbox-option.selected','Enter')).to.be.true;
});

Scenario('Shift focus to Search within rows',async (I) => {
    expect(await I.checkFocusOnElement('.csui-slice-option','Tab',0)).to.be.true;
});

Scenario('Uncheck and check Search within row',async (I) => {
    I.pressKey('Enter');
    expect(await I.checkFocusOnElement('.csui-slice-option','Enter',0)).to.be.true;
});

Scenario('Shift focus to search forms row in search dropdown',async (I) => {
    expect(await I.checkFocusOnElement('.csui-searchforms-popover-row','Tab')).to.be.true;
});

Scenario('Shift focus to show more search forms row in search dropdown',async (I) => {
    expect(await I.checkFocusOnElement('.csui-searchforms-show-more','Tab')).to.be.true;
});

Scenario('Shift focus to clear search icon in search header',async (I) => {
    expect(await I.checkFocusOnElement('.csui-clearer.formfield_clear','Tab')).to.be.true;
});

Scenario('Clear search in input box and fill search input field',(I, SRV) => {
    I.pressKey('Enter');
    SRV.validateSearchBoxIcons('test');
});

Scenario('Start search using Enter keyword', (I) => {
    I.pressKey('Enter');
    I.waitMaxTimeForElement('.csui-search-header-title');
    I.seeElement('.csui-search-header-title');
});

Scenario('Login to  Server with other user credentials(not admin):', (I) => {
    I.loginTo('CS_DEV_INT_KRISTEN');
    I.ensureNotInAccesibilityMode();
    I.waitMaxTimeForElement(".icon-global-search");
    I.seeElement(".icon-global-search");
});

Scenario('Start global search', (I,SRV) => {
    I.seeElement(".icon-global-search");
    I.click(".icon-global-search");
    SRV.validateSearchBoxIcons('*');
    I.click("[title='Start search']");
    SRV.verifyHeader();
});

Scenario('Open Facet filter', (I) => {
    I.click('.search-icon');
    I.seeElement('.csui-icon-v2__csui_action_filter32');
    I.click('.csui-icon-v2__csui_action_filter32');
    I.seeElement('.csui-icon-v2-on.csui-icon-v2__csui_action_filter32');
    I.seeElement('.cs-title');
});

Scenario('Verify count beside filter value(Should not be present)',(SRV) => {
    SRV.verifyFacetFilterCount(1);
});