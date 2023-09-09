/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai');
const expect = chai.expect;
const outputSettings = {
   ignoreAreasColoredWith: { r: 250, g: 250, b: 250, a: 0 },
};

require('events').EventEmitter.prototype._maxListeners = 100;

Feature('ThumbnailView Mock Test cases');

BeforeSuite((I) => {
   I.loadHTML("lib/src/csui/controls/thumbnail/test/index.html");
   I.waitMaxTimeForElement(".cs-thumbnail-wrapper");
   I.seeElement(".cs-thumbnail-wrapper");
});

Scenario('verifying action items in thumbnail item', (TH) => {
   TH.verifyOtherActionItems();
});

Scenario('verifying header', (TH) => {
   TH.verifyHeader();
});

Scenario('Hovering on the node', async (TH) => {
   expect(await TH.hoverOnItem(1)).to.be.true;
});

Scenario('verify inline actions', async (TH) => {
   expect(await TH.clickonInlineActions()).to.be.true;
});

Scenario('close inline actions', (I, TH) => {
   TH.closeInlineActions();
   I.dontSeeElement(".csui-thumbnail-actionbar .csui-table-actionbar-bubble .binf-open");
});

Scenario('check for add icon', (I) => {
   I.waitMaxTimeForElement(".csui-addToolbar .binf-dropdown-toggle");
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

Scenario('click to cancel add action', (I) => {
   I.seeElement(".csui-inline-action-button-wrapper .csui-btn-cancel");
   I.click(".csui-inline-action-button-wrapper .csui-btn-cancel");
});

Scenario('Verify there is no newly added item', (I) => {
   I.dontSeeElement(".csui-new-thumbnail-item");
});

Scenario('click on add icon for folder again', async (TH) => {
   expect(await TH.clickOnAddItem()).to.be.true;
});

Scenario('click on folder again', async (TH) => {
   expect(await TH.addItem(0)).to.be.true;
});

Scenario('rename the item', async (TH) => {
   expect(await TH.rename(2)).to.be.true;
});

Scenario('click on cancel icon to cancel add action', (I) => {
   I.seeElement(".csui-inline-action-button-wrapper .csui-btn-cancel");
   I.click(".csui-inline-action-button-wrapper .csui-btn-cancel");
   I.waitForDetached(".csui-new-thumbnail-item");
   I.dontSeeElement(".csui-new-thumbnail-item");
});

Scenario('Clicking on overview icon', async (TH) => {
   expect(await TH.clickOnOverviewIcon()).to.be.true;
});

Scenario('Clicking on favorite icon', async (TH) => {
   expect(await TH.clickOnFavoriteIcon()).to.be.true;
});

Scenario('Close favorite popover',(I, TH) => {
   TH.closeFavoritePopover();
   I.dontSeeElement(".binf-popover-content .favorite-name-label");
});

Scenario('try to rename an element', async (TH) => {
   expect(await TH.rename(1)).to.be.true; 
});

Scenario('try to rename another element', async (TH) => {
   expect(await TH.rename(4)).to.be.true;
});

Scenario('cancel rename', (TH) => {
   TH.clickCancel();
});

Scenario('try to rename another element for verify new', async (TH) => {
   expect(await TH.rename(1)).to.be.true;
});

Scenario('hovering on the save icon', (TH, I) => {
   TH.moveCursorTo('.csui-inline-action-button-wrapper button.csui-btn-save');
   I.seeAttributesOnElements('button.csui-btn-save', { title: "Save"});
});

Scenario('hovering on the cancel icon', (I) => {
   I.moveCursorTo('.csui-inline-action-button-wrapper button.csui-btn-cancel');
   I.seeAttributesOnElements('button.csui-btn-cancel', { title: "Cancel"});
});

Scenario('By default the previous name is selected',(I) => {
   I.seeCssPropertiesOnElements('.csui-inline-action-button-wrapper button.csui-edit-save', { 'color': "#999999"});
});

Scenario('hit enter with the previous name selected', async (TH) => {
   expect(await TH.enteronSeletedName('Enter')).to.be.true;
});

Scenario('Clear the name field and hit enter', async (TH, I) => {
   I.pressKey('Backspace');
   expect(await TH.enteronSeletedName('Enter')).to.be.true;
});

Scenario('cancel inline form', (TH) => {
   TH.clickCancel();
});

Scenario('append text in input field for verify new', async (TH) => {
   expect(await TH.rename(2)).to.be.true;
});

Scenario('modify text in the input field', async (TH) => {
   expect(await TH.modifyText()).to.be.true;
});

Scenario('click on save button to verify that inline form is not displayed',(I) => {
   I.click('button.csui-btn-save');
   I.waitForDetached('csui-inline-editform');
   I.dontSeeElement('.csui-inline-editform');
});

Scenario('checking new value', async (TH, I) => {
   expect(await TH.verifyNewValue("appended")).to.be.true;
   I.dontSeeElement('.csui-inline-editform');
   I.moveCursorTo('.csui-thumbnail-item', 0,0);
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

Scenario('keydown to open inline actions', async (TH) => {
   expect(await TH.clickonInlineActions('Enter')).to.be.true;
});

Scenario('keydown to close inline actions', (I, TH) => {
   TH.closeInlineActions('Escape');
   I.wait(1);
   I.waitForDetached('.csui-thumbnail-actionbar .csui-table-actionbar-bubble .binf-open');
   I.dontSeeElement(".csui-thumbnail-actionbar .csui-table-actionbar-bubble .binf-open");
});
Scenario.skip('shift focus on mime type icon', async (I) => {
   I.waitMaxTimeForElement(".csui-thumbnail-actionbar .csui-table-actionbar-bubble");
   I.seeElement(".csui-thumbnail-actionbar .csui-table-actionbar-bubble");
   I.wait(1);
   expect(await I.checkFocusOnElement('.csui-thumbnail-content-icon', 'Tab', 0)).to.be.true;
});

Scenario.skip('shift focus on name', async (I) => {
   expect(await I.checkFocusOnElement('.csui-thumbnail-name-value', 'Tab', 0)).to.be.true;
});

Scenario.skip('shift focus on favorite icon', async (I) => {
   expect(await I.checkFocusOnElement('.csui-favorite-star', 'Tab', 1)).to.be.true;
});

Scenario.skip('keydown to open favorite popover', async (TH) => {
   expect(await TH.clickOnFavoriteIcon('Enter')).to.be.true;
});

Scenario.skip('keydown to close favorite popover', (I, TH) => {
   TH.closeFavoritePopover('Escape');
   I.dontSeeElement(".binf-popover-content .favorite-name-label");
});

Scenario.skip('shift focus to thumbnail popover icon', async (I) => {
   expect(await I.checkFocusOnElement('.csui-thumbnail-overview-icon', 'Tab', 1)).to.be.true;
});

Scenario.skip('keydown to open thumbnail popover icon', async (TH) => {
   expect(await TH.clickOnOverviewIcon('Enter')).to.be.true;
});

Scenario.skip('keydown to close thumbnail popover icon', async (I) => {
   expect(await I.checkFocusOnElement('.csui-thumbnail-overview-icon', 'Escape', 1)).to.be.true;
   I.dontSeeElement(".binf-popover-content .csui-overview-container");
});

Scenario('focus on thumbnail item', async (I) => {
   expect(await I.checkFocusOnElement('.csui-thumbnail-item', 'Escape')).to.be.true;
});

Scenario('focus on next thumbnail item', async (I) => {
   expect(await I.checkFocusOnElement('.csui-thumbnail-item', 'ArrowRight', 1)).to.be.true;
});

Scenario('focus on previous thumbnail item', async (I) => {
   expect(await I.checkFocusOnElement('.csui-thumbnail-item', 'ArrowLeft', 0)).to.be.true;
});

Scenario('select an item', async (TH) => {
   expect(await TH.selectNode()).to.be.true;
});

Scenario('unselect an item', (TH) => {
   TH.unselectNode();
});
Scenario.skip('Execute Performance tests - Thumbnail View', async (I, TH) => {
   I.loadHTML("lib/src/csui/controls/thumbnail/test/index.html");
   I.waitMaxTimeForElement(".cs-thumbnail-wrapper");
   I.seeElement(".cs-thumbnail-wrapper");
   let data = await I.grabDataFromPerformanceTiming();
   I.say(`Total time to render page: ${data.loadEventEnd}​​​​ms`);
   expect(data.loadEventEnd).to.be.lt(3500);
});