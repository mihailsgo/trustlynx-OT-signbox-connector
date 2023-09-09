/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Favorties Widget Mock Server Test Cases');

BeforeSuite((I) => {
    I.loadHTML("lib/src/csui/widgets/favorites/test/index.html");
    I.waitMaxTimeForElement('.binf-row[data-csui-widget_type="favorites"] .content-tile');
    I.seeElement('.binf-row[data-csui-widget_type="favorites"] .content-tile');
});

Scenario('Verify favorite widget icons', (FVR) => {
    FVR.verifyFavoritesWidgetIconsForMock(0);
});

Scenario('Check more actions on favorite item', (FVR) => {
    FVR.hoverOnListItem(1);
    FVR.validateMoreActionsIcon(0);
});
Scenario('Validate Search button in favorite widget', async (FVR) => {
    expect(await FVR.validateSearchButton(0)).to.be.true;
});

Scenario('Validate Search Input field', (FVR) => {
    FVR.validateSearchInputField(0);
});

Scenario('Check Clear Search button', (FVR) => {
    FVR.checkClearSearchButton(0);
});
Scenario('Check Close Search Button', (FVR) => {
    FVR.checkCloseSearchButton(0);
});

Scenario('Validate Navigation to Expanded view', (I, FVR) => {
    I.click('.cs-favorites .tile-expand');
    FVR.validateExpandedFavoritesViewForMock();
});

Scenario('Add new favorite group', (FVR) => {
    FVR.addFavoriteGroup();
});

Scenario('Cancel Adding new favorite group', (FVR) => {
    FVR.cancelFavoriteGroup();
});

Scenario('Rename favorite group', (I, FVR) => {
    FVR.renameActiveFavoriteGroup();
    I.waitMaxTimeForElement('.csui-favorite-group.binf-active .csui-favorite-group-name-link[title="a test group"]');
    I.seeElement('.csui-favorite-group.binf-active .csui-favorite-group-name-link[title="a test group"]');
});

Scenario('Select all items', (I, FVR) => {
    FVR.toggleSelectAllFavorites();
    I.waitMaxTimeForElement('.csui-table-cell-_select .csui-checkbox[title="Select all items"][aria-checked="true"]');
    I.seeElement('.csui-table-cell-_select .csui-checkbox[title="Select all items"][aria-checked="true"]');
}); 

Scenario('Check toolbar bar after select all', (I) => {
    I.waitMaxTimeForElement('.csui-rowselection-toolbar.csui-rowselection-toolbar-visible');
    I.seeElement('.csui-rowselection-toolbar.csui-rowselection-toolbar-visible');
});

Scenario('Unselect all items', (I, FVR) => {
    FVR.toggleSelectAllFavorites();
    I.waitMaxTimeForElement('.csui-table-cell-_select .csui-checkbox[title="Select all items"][aria-checked="false"]');
    I.seeElement('.csui-table-cell-_select .csui-checkbox[title="Select all items"][aria-checked="false"]');
});

Scenario('Check inline actions on favorite item', (I, FVR) => {
    FVR.hoverOnExpandedViewFavoriteItem();
    I.waitMaxTimeForElement('.csui-table-cell-name-appendix .csui-table-actionbar');
    I.seeElement('.csui-table-cell-name-appendix .csui-table-actionbar');
    I.waitMaxTimeForElement('.csui-table-cell-name-appendix .csui-toolitem[title="Copy link"]');
    I.seeElement('.csui-table-cell-name-appendix .csui-toolitem[title="Copy link"]');
});

Scenario('Remove first favorite in a group', (FVR) => {
    FVR.removeFavorite();
});

Scenario('Validate removed favorite',async (FVR) => {
    expect(await FVR.validateRemovedFavorite()).to.be.true;
}); 

Scenario('Delete favorite group', (FVR) => {
    FVR.deleteActiveFavoriteGroup();
});

Scenario.skip('Execute Performance tests - Favorites tile', async (I) => {
    I.loadHTML("lib/src/csui/widgets/favorites/test/index.html");
    let data = await I.grabDataFromPerformanceTiming();
    I.say(`Total time to render page: ${data.loadEventEnd}ms`);
    expect(data.loadEventEnd).to.be.lt(350);
 });
