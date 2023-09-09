/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Thumbnail Live Server Test cases');

BeforeSuite((I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER','Automation test data(Do not delete folder or subitems)');
});

Scenario('verify the ThumbnailView functionality', async (TH) => {
    TH.navigateToTestFolder();
    expect(await TH.navigateToThumbnailView()).to.be.true;
});

Scenario('verifying action items in thumbnail item', async (TH) => {
    TH.verifyOtherActionItems();
});

Scenario('verifying header', async (TH) => {
    TH.verifyHeader();
});

Scenario('Hovering on the node', async (TH) => {
    expect(await TH.hoverOnItem(1)).to.be.true;
});

Scenario('verify inline actions', async (TH) => {
    expect(await TH.clickonInlineActions()).to.be.true;
});

Scenario('close inline actions', async (I, TH) => {
    TH.closeInlineActions();
    I.dontSeeElement(".csui-table-actionbar-bubble .binf-open");
});

Scenario('select an item', async (TH) => {
    expect(await TH.selectNode()).to.be.true;
});

Scenario('unselect an item', async (TH) => {
    TH.unselectNode();
});

Scenario('Clicking on overview icon', async (TH) => {
    expect(await TH.clickOnOverviewIcon()).to.be.true;
});

Scenario('Clicking on favorite icon', async (TH) => {
    expect(await TH.clickOnFavoriteIcon()).to.be.true;
});

Scenario('Close Favorite popover', async (TH) => {
    TH.closeFavoritePopover();
});

Scenario('try to rename an element', async (TH) => {
    expect(await TH.rename(1)).to.be.true;
 });

 Scenario('try to rename another element', async (TH) => {
    expect(await TH.rename(4)).to.be.true;
 });

 Scenario('append text in input field', async (TH) => {
    expect(await TH.modifyText()).to.be.true;
 });
 
 Scenario('cancel inline form', async (TH, I) => {
    TH.clickCancel();
 });

 Scenario('try to rename another element', async (TH) => {
    expect(await TH.rename(1)).to.be.true;
 });
 
 Scenario('hovering on the save icon', async (TH, I) => {
    TH.moveCursorTo('.csui-inline-action-button-wrapper button.csui-btn-save');
    I.seeAttributesOnElements('button.csui-btn-save', { title: "Save"});
 });
 
 Scenario('hovering on the cancel icon', async (TH, I) => {
    I.moveCursorTo('.csui-inline-action-button-wrapper button.csui-btn-cancel');
    I.seeAttributesOnElements('button.csui-btn-cancel', { title: "Cancel"});
 });
 
 Scenario('By default the previous name is selected', async (I) => {
    I.seeCssPropertiesOnElements('.csui-inline-action-button-wrapper button.csui-edit-save', { 'color': "#999999"});
 });
 
 Scenario('hit enter with the previous name selected', async (TH) => {
    expect(await TH.enteronSeletedName('Enter')).to.be.true;
 });
 
 Scenario('Clear the name field and hit enter', async (TH, I) => {
    I.pressKey('Backspace');
    expect(await TH.enteronSeletedName('Enter')).to.be.true;
 });
 
 Scenario('cancel inline form', async (TH, I) => {
    TH.clickCancel();
    I.dontSeeElement('.csui-inline-editform');
 });
 
 Scenario('Verify there is no inline form', async (I) => {
    I.dontSeeElement('.csui-thumbnail-item-form');
 });

Scenario('Sort by name asc', async (I) => {
    I.seeTextEquals("Name", ".csui-search-sort-options > .binf-btn > .cs-label");
    I.seeElement(".csui-sort-arrow.icon-sortArrowUp");
    var names = sortName = await I.grabTextFrom('.csui-thumbnail-name .csui-thumbnail-name-link-text');
    sortName.sort();
    expect(JSON.stringify(names) == JSON.stringify(sortName)).to.be.true;

});

Scenario('Sort by name desc', async (I) => {
    I.click(".csui-sort-arrow.icon-sortArrowUp");
    I.waitMaxTimeForElement(".csui-sort-arrow.icon-sortArrowDown");
    I.seeElement(".csui-sort-arrow.icon-sortArrowDown");
    var names = sortName = await I.grabTextFrom('.csui-thumbnail-name .csui-thumbnail-name-link-text');
    sortName.sort().reverse();
    expect(JSON.stringify(names) == JSON.stringify(sortName)).to.be.true;

});

Scenario('Check name is selected', async (I) => {
    I.click(".csui-search-sort-options");
    let hint = await I.grabAttributeFrom('.csui-search-sort-options', 'class');
    expect(hint.indexOf('binf-open')).to.be.gte(0);
    I.seeElement(".icon-listview-checkmark + span[data-sortbyid ='name']");
});

Scenario('Check type is selected', async (TH) => {
    await TH.selectSort("Type", "type");
    await TH.verifySortArrow();
    await TH.verifySortSelected("type");
});

Scenario('Check size is selected', async (TH) => {
    await TH.selectSort("Size", "size");
});

Scenario('Very size asc', async (TH, I) => {
    await TH.clickOnOverviewIcon(null, 2);
    I.waitMaxTimeForElement("p.csui-thumbnail-size-value");
    I.wait(2);
    var first = (await I.grabTextFrom("p.csui-thumbnail-size-value")).split(" ");
    await TH.clickOnOverviewIcon(null, 15);
    I.waitMaxTimeForElement("p.csui-thumbnail-size-value");
    I.wait(2);
    var mid = (await I.grabTextFrom("p.csui-thumbnail-size-value")).split(" ");
    await TH.clickOnOverviewIcon(null, 29);
    I.waitMaxTimeForElement("p.csui-thumbnail-size-value");
    I.wait(2);
    var last = (await I.grabTextFrom("p.csui-thumbnail-size-value")).split(" ");
    expect(mid[0]).to.be.gte(first[0]);
    expect(last[0]).to.be.gte(mid[0]);
});

Scenario('Very size desc', async (TH, I) => {
    await TH.verifySortArrow();
    await TH.clickOnOverviewIcon(null, 2);
    I.waitMaxTimeForElement("p.csui-thumbnail-size-value");
    I.wait(2);
    var first = (await I.grabTextFrom("p.csui-thumbnail-size-value")).split(" ");
    await TH.clickOnOverviewIcon(null, 15);
    I.waitMaxTimeForElement("p.csui-thumbnail-size-value");
    I.wait(2);
    var mid = (await I.grabTextFrom("p.csui-thumbnail-size-value")).split(" ");
    await TH.clickOnOverviewIcon(null, 29);
    I.waitMaxTimeForElement("p.csui-thumbnail-size-value");
    I.wait(2);
    var last = (await I.grabTextFrom("p.csui-thumbnail-size-value")).split(" ");
    expect(first[0]).to.be.gte(mid[0]);
    expect(mid[0]).to.be.gte(last[0]);
});

Scenario('Check size is checked', async (TH) => {
    await TH.verifySortSelected("size");
});

Scenario('Check Modified is selected', async (TH) => {
    await TH.selectSort("Modified", "modify_date");
});

Scenario('Very Modified asc', async (TH, I) => {
    await TH.clickOnOverviewIcon(null, 2);
    I.waitMaxTimeForElement("p.csui-thumbnail-date-value");
    I.wait(2);
    var first = new Date(await I.grabTextFrom("p.csui-thumbnail-date-value"));
    await TH.clickOnOverviewIcon(null, 15);
    I.wait(2);
    I.waitMaxTimeForElement("p.csui-thumbnail-date-value");
    var mid = new Date(await I.grabTextFrom("p.csui-thumbnail-date-value"));
    await TH.clickOnOverviewIcon(null, 29);
    I.wait(2);
    I.waitMaxTimeForElement("p.csui-thumbnail-date-value");
    var last = new Date(await I.grabTextFrom("p.csui-thumbnail-date-value"));
    expect(mid).to.be.gte(first);
    expect(last).to.be.gte(mid);
});

Scenario('Very modified desc', async (TH, I) => {
    await TH.verifySortArrow();
    await TH.clickOnOverviewIcon(null, 2);
    I.waitMaxTimeForElement("p.csui-thumbnail-date-value");
    I.wait(2);
    var first = new Date(await I.grabTextFrom("p.csui-thumbnail-date-value"));
    await TH.clickOnOverviewIcon(null, 15);
    I.wait(2);
    I.waitMaxTimeForElement("p.csui-thumbnail-date-value");
    var mid = new Date(await I.grabTextFrom("p.csui-thumbnail-date-value"));
    await TH.clickOnOverviewIcon(null, 29);
    I.wait(2);
    I.waitMaxTimeForElement("p.csui-thumbnail-date-value");
    var last = new Date(await I.grabTextFrom("p.csui-thumbnail-date-value"));
    expect(first).to.be.gte(mid);
    expect(mid).to.be.gte(last);
});

Scenario('Check modifed is checked', async (TH) => {
    await TH.verifySortSelected("modify_date");
});

Scenario('Click on filter icon', async (I) => {
    I.seeElement(".csui-table-facetview.csui-facetview-hidden")
    I.click("li[data-csui-command='filter']");
    I.seeElement(".csui-table-facetview:not(.csui-facetview-hidden)");
});

Scenario('Max filters shown', async (I) => {
    I.seeElement(".csui-facet-header");
    I.seeElement(".csui-facet-content .csui-facet-item");
    var filters = await I.grabNumberOfVisibleElements('.csui-facet:first-of-type .csui-facet-content .csui-facet-item');
    expect(filters).to.be.lt(6);
});

Scenario('Show more in filter panel', async (I) => {
    let check = await I.executeScript(() => document.querySelector(".csui-facet:first-of-type .csui-facet-content .csui-filter-more") !== null);
    if (check) {
        I.seeTextEquals('Show more', '.csui-facet:first-of-type .csui-filter-more .csui-more-text');
        I.click('.csui-facet:first-of-type .csui-filter-more .csui-more-text');
        I.wait(2);
        var filters = await I.grabNumberOfVisibleElements('.csui-facet:first-of-type .csui-facet-content .csui-facet-item');
        expect(filters).to.be.gt(5);
    }
});

Scenario('Show less in filter panel', async (I) => {
    let check = await I.executeScript(() => document.querySelector(".csui-facet:first-of-type .csui-facet-content .csui-filter-more") !== null);
    if (check) {
        I.seeTextEquals('Show less', '.csui-facet:first-of-type .csui-filter-more .csui-more-text');
        I.click('.csui-facet:first-of-type .csui-filter-more .csui-more-text');
        I.wait(2);
        var filters = await I.grabNumberOfVisibleElements('.csui-facet:first-of-type .csui-facet-content .csui-facet-item');
        expect(filters).to.be.lt(6);
    }
});

Scenario('Apply filter', async (I) => {
    I.seeElement(".csui-facet:first-of-type .csui-facet-content .csui-facet-item:first-of-type");
    I.click(".csui-facet:first-of-type .csui-facet-content .csui-facet-item:first-of-type .csui-facet-item-checkbox ");
    I.seeElement(".csui-facet-controls.csui-multi-select .csui-apply");
    I.click(".csui-facet-controls.csui-multi-select .csui-apply");
    I.waitMaxTimeForElement(".csui-facet-bar:not(.csui-facet-bar-hidden)");
    I.seeElement(".csui-facet-bar:not(.csui-facet-bar-hidden)");
});

Scenario('Clear filter', async (I) => {
    I.seeElement(".csui-clear-all");
    I.click(".csui-clear-all");
    I.waitMaxTimeForElement(".csui-facet-bar.csui-facet-bar-hidden");
    I.seeElement(".csui-facet-bar.csui-facet-bar-hidden");
    I.seeElement(".csui-table-facetview:not(.csui-facetview-hidden)");
});

Scenario('Close side panel', async (I) => {
    I.click("li[data-csui-command='filter']");
    I.seeElement(".csui-table-facetview.csui-facetview-hidden");
});

Scenario('Table search', async (I) => {
    I.seeElement(".csui-table-search-icon");
    I.click(".csui-table-search-icon");
    I.seeElement(".search-box.csui-table-searchbox:not(.binf-hidden)");
    I.fillField('.csui-table-search-input', 'Image');
    I.wait(3);
    var names = sortName = await I.grabTextFrom('.csui-thumbnail-name .csui-thumbnail-name-link-text');
    for (let i = 0; i < names.length; i++) {
        expect(names[i].toLowerCase().indexOf('image')).to.be.gte(0);
    }
});
Scenario.skip('Gallery view', async (I) => {
    I.seeElement(".csui-thumbnail-icon-view");
    I.click(".csui-thumbnail-item:first-of-type .csui-thumbnail-icon-view");
    I.waitMaxTimeForElement(".binf-gallery-container .csui-preview-carousal");
    I.seeElement(".binf-gallery-container .csui-preview-carousal");
    var count = await I.grabTextFrom(".csui-current-total-items");
    expect(count.split(" ")[0]).to.equal("1");
});

Scenario.skip('Gallery view right', async (I) => {
    I.waitMaxTimeForElement(".binf-right .icon-next-gallery");
    I.seeElement(".binf-right .icon-next-gallery");
    I.click(".binf-right .icon-next-gallery");
    I.wait(2);
    var count = await I.grabTextFrom(".csui-current-total-items");
    expect(count.split(" ")[0]).to.equal("2");
});

Scenario.skip('Gallery view left', async (I) => {
    I.waitMaxTimeForElement(".binf-left .icon-previous-gallery");
    I.seeElement(".binf-left .icon-previous-gallery");
    I.click(".binf-left .icon-previous-gallery");
    I.wait(2);
    var count = await I.grabTextFrom(".csui-current-total-items");
    expect(count.split(" ")[0]).to.equal("1");
});

Scenario.skip('Close Gallery view', async (I) => {
    I.click('.cs-close');
    I.dontSeeElement(".binf-gallery-container .csui-preview-carousal");
});

Scenario('Close table search box', async (I) => {
    I.seeElement(".csui-table-search-icon");
    I.click(".csui-table-search-icon");
    let hint = await I.grabAttributeFrom('.search-box.csui-table-searchbox', 'class');
    expect(hint.indexOf('binf-hidden')).to.be.gte(0);
});

Scenario('check for add icon', async (I) => {
    I.seeElement(".csui-addToolbar .binf-dropdown-toggle");
 });
 
 Scenario('click on add icon for collection', async (TH) => {
    expect(await TH.clickOnAddItem()).to.be.true;
 });
 
 Scenario('click on collection', async (TH) => {
    expect(await TH.addItem(298)).to.be.true;
 });
 
 Scenario('click on add icon for web address', async (TH) => {
    expect(await TH.clickOnAddItem()).to.be.true;
 });
 
 Scenario('click on web address', async (TH) => {
    expect(await TH.addItem(140)).to.be.true;
 });
 
 Scenario('click on add icon for folder', async (TH) => {
    expect(await TH.clickOnAddItem()).to.be.true;
 });
 
 Scenario('click on folder', async (TH) => {
    expect(await TH.addItem(0)).to.be.true;
 });

 Scenario('click to cancel add action', async (I) => {
    I.seeElement(".csui-inline-action-button-wrapper .csui-btn-cancel");
    I.click(".csui-inline-action-button-wrapper .csui-btn-cancel");
 });
 
 Scenario('Verify there is no newly added item', async (I) => {
    I.dontSeeElement(".csui-new-thumbnail-item");
 });

 Scenario('click on add icon for folder again', async (TH) => {
    expect(await TH.clickOnAddItem()).to.be.true;
 });
 
 Scenario('click on folder again', async (TH) => {
    expect(await TH.addItem(0)).to.be.true;
 });
 
 Scenario('rename the folder', async (TH) => {
    await TH.rename(2);
 });
 
 Scenario('click to cancel add action again', async (I) => {
    I.seeElement(".csui-inline-action-button-wrapper .csui-btn-cancel");
    I.click(".csui-inline-action-button-wrapper .csui-btn-cancel");
 });
 
 Scenario('Verify there is no newly added folder', async (I) => {
    I.dontSeeElement(".csui-new-thumbnail-item");
 });

Scenario('Login to Server', (I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER','Automation test data(Do not delete folder or subitems)');
});

Scenario('verify the ThumbnailView functionality', async (TH) => {
    TH.navigateToTestFolder();
    expect(await TH.navigateToThumbnailView()).to.be.true;
});

Scenario('Shift focus to thumbnailitem', async (TH) => {
    expect(await TH.setFocusToThumbnailItem()).to.be.true;
});

Scenario('Shift focus to selectIcon', async (I) => {
    expect(await I.checkFocusOnElement('.selectAction', 'Enter', 0)).to.be.true;
});

Scenario('Shift focus to inline actions', async (I) => {
    expect(await I.checkFocusOnElement('.csui-thumbnail-actionbar .csui-table-actionbar-bubble .binf-dropdown-toggle', 'Tab')).to.be.true;
});

Scenario('Keydown to open inline actions', async (TH) => {
    expect(await TH.clickonInlineActions('Enter')).to.be.true;
});

Scenario('Keydown to close inline actions', async (I, TH) => {
    TH.closeInlineActions('Escape');
    I.dontSeeElement(".csui-table-actionbar-bubble .binf-open");
});

Scenario('Shift focus on mime type icon', async (I) => {
    expect(await I.checkFocusOnElement('.csui-thumbnail-content-icon', 'Tab', 0)).to.be.true;
});

Scenario('Shift focus on name', async (I) => {
    expect(await I.checkFocusOnElement('.csui-thumbnail-name-value', 'Tab', 0)).to.be.true;
});

Scenario('Focus on thumbnail item', async (I) => {
    expect(await I.checkFocusOnElement('.csui-thumbnail-item', 'Escape')).to.be.true;
});

Scenario('Focus on next thumbnail item', async (I) => {
    expect(await I.checkFocusOnElement('.csui-thumbnail-item', 'ArrowRight', 1)).to.be.true;
});

Scenario('Focus on previous thumbnail item', async (I) => {
    expect(await I.checkFocusOnElement('.csui-thumbnail-item', 'ArrowLeft', 0)).to.be.true;
});