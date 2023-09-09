/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Recently Accessed Widget Live Server Test cases');

BeforeSuite((I) => {
        I.loginTo('CONTENT_SERVER');
        I.ensureNotInAccesibilityMode();
});

Scenario('Hover on recently accessed widget', (RACT) => {
    RACT.hoverOnRecentlyAccessedWidget();
});

Scenario('Verify Widget Title:', (RACT) => {
    RACT.checkTitle();
});

Scenario('Verify Recently Accessed widget header icons ', (RACT) => {
    RACT.verifysRecentlyAccessedWidgetIcons();
});

Scenario('Check more actions on recently accessed item', (RACT) => {
    RACT.hoverOnListItem(1);
    RACT.validateMoreActionsIcon();
}); 

Scenario('Validate Search button in recently accessed widget',async (RACT) => {
    RACT.hoverOnRecentlyAccessedWidget();
    expect(await RACT.validateSearchButton()).to.be.true;
});

Scenario('Validate search input field', (RACT) => {
    RACT.validateSearchInputField();
}); 

Scenario('Check Clear Search  button', (RACT) => {
    RACT.checkClearSearchButton();
});

Scenario('Check close Search button',(RACT) => {
    RACT.checkCloseSearchButton();
});

Scenario('Navigate to Expanded view', (I, RACT) => {
    RACT.hoverOnRecentlyAccessedWidget();
    I.click('.csui-perspective-view [data-csui-widget_type="recentlyaccessed"] .tile-icons .cs-open-perspective-button[title="Open recently accessed view"]');
    I.waitForElement(".csui-recently-accessed-table-view .load-container.binf-hidden", 30);
});

Scenario('Verify CopyLink Command:', (RACT) => {
     RACT.copyLink();
});

Scenario('Validate Recently accessed expanded view', (RACT) => {
    RACT.validateRecentlyAccessedView();
});

Scenario('Select all items in expanded view', (RACT) => {
    RACT.toggleSelectAll();
});

Scenario('Check toolbar  after select all', (RACT) => {
    RACT.checkToolbar();
});

Scenario('Unselect all items', (RACT) => {
    RACT.toggleSelectAll();
});

Scenario('Check inline actions on recently accessed item', (RACT) => {
    RACT.hoverOnExpandedViewRACTItem(1);
    RACT.checkInlineActions();
});

Scenario('Click on search icon', (RACT) => {
    RACT.clickOnSearchInExpandedView();
});

Scenario('Validate search input field in expanded view', (RACT) => {
    RACT.validateSearchInputExpandedView();
});

Scenario('Check clear search icon in expanded view', (RACT) => {
    RACT.checkClearSearchInExpanded();
});

Scenario('Close search in expanded view', (RACT) => {
    RACT.clickOnSearchInExpandedView();
});

Scenario('Navigate to recently accessed widget test folder for testing with KN',(I, Data) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
}).injectDependencies({ Data: require('./data.js') });

Scenario('Shift focus to recently accessed widget',async (RACT) => {
    expect(await RACT.setFocusOnRecentlyAccessedWidget()).to.be.true;
});

Scenario('Enter to open search input field in recently accessed widget',async  (RACT) => {
    expect(await RACT.validateSearchButton('Enter')).to.be.true;
});

Scenario('Validate Search Input field in  recently accessed widget using KN', (RACT) => {
    RACT.validateSearchInputField();
});

Scenario('Shift focus to clear search button and press enter in recently accessed widget', (I, RACT) => {
    I.pressKey('Tab');
    RACT.checkClearSearchButton('Enter');
});

Scenario('Shift focus to close search button and press enter in recently accessed widget', (I, RACT) => {
    I.pressKey('Tab');
    RACT.checkCloseSearchButton('Enter');
});

Scenario('Shift focus to expand icon in  recently accessed widget',async (I) => {
    expect(await I.checkFocusOnElement('.csui-perspective-view .tile-icons .cs-open-perspective-button[title="Open recently accessed view"]','Tab')).to.be.true;
});

Scenario('Shift focus to recently accessed item in  recently accessed widget',async (I) => {
    I.pressKey('Tab');
    expect(await I.checkFocusOnElement(".list-item-title",'Enter',1)).to.be.true;
});

Scenario('Shift focus to more actions icon in  recently accessed widget',async (I) => {
    expect(await I.checkFocusOnElement('.csui-icon-group.csui-menu-btn','ArrowRight')).to.be.true;
});

Scenario('verify more actions using enter key',(RACT) => {
    RACT.validateMoreActionsIcon('Enter');
});

Scenario('Shift focus to expand icon',async (I) => {
    expect(await I.checkFocusOnElement('.csui-perspective-view .cs-recentlyaccessed .tile-icons .cs-open-perspective-button[title="Open recently accessed view"]',['Shift','Tab'])).to.be.true;
});

Scenario('Navigate to expanded view',(I, RACT) => {
    I.pressKey('Enter');
    I.waitForElement(".csui-recently-accessed-table-view .load-container.binf-hidden", 30);
    RACT.validateRecentlyAccessedView();
});

Scenario('Check if name column search is opened and close it',(RACT) => {
    RACT.checkNameSearchOpen();
});

Scenario('Set focus to select all table items in expanded view',async (RACT) => {
    expect(await RACT.setFocusOnSelectAll()).to.be.true;
});

Scenario('Select all items in expanded view using Enter key', (RACT) => {
    RACT.toggleSelectAll('Enter');
});

Scenario('Check toolbar actions after select all ', (RACT) => {
    RACT.checkToolbar();
});

Scenario('Unselect all items using enter key', (RACT) => {
    RACT.toggleSelectAll('Enter');
});

Scenario('Shift focus to mime type',async (I) => {
    expect(await I.checkFocusOnElement('.csui-focusable-table-column-header','ArrowRight',1)).to.be.true;
});

Scenario('Shift focus to name in table header',async (I) => {
    expect(await I.checkFocusOnElement('.csui-focusable-table-column-header','ArrowRight',2)).to.be.true;
});

Scenario('Shift focus to search in table header',async (I) => {
    expect(await I.checkFocusOnElement('.csui-table-search-icon','ArrowRight')).to.be.true;
});

Scenario('Start search in expanded view using Enter key', (RACT) => {
    RACT.clickOnSearchInExpandedView('Enter');
});

Scenario('Validate search input field for table in expanded view', (RACT) => {
    RACT.validateSearchInputExpandedView();
});

Scenario('Shift focus to clear search',async (I) => {
    expect(await I.checkFocusOnElement('.sbclearer.formfield_clear','ArrowRight')).to.be.true;
}); 

Scenario('Check clear search icon in table search in expanded view using Enter key', (RACT) => {
    RACT.checkClearSearchInExpanded('Enter');
});

Scenario('Shift focus to close search in expanded view',async (I) => {
    expect(await I.checkFocusOnElement('.csui-table-search-icon','ArrowRight')).to.be.true;
});

Scenario('Close search in expanded view using Enter key', (RACT) => {
    RACT.clickOnSearchInExpandedView('Enter');
});