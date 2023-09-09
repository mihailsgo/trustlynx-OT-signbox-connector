/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const outputSettings = {
   ignoreAreasColoredWith: { r: 250, g: 250, b: 250, a: 0 },
};

require('events').EventEmitter.prototype._maxListeners = 100;

Feature('Search Box Widget Mock Test cases');

BeforeSuite((I) => {
   I.loadHTML("lib/src/csui/widgets/search.box/test/index.html");
   I.waitMaxTimeForElement(".csui-search-box");
   I.seeElement(".csui-search-box");
});

Scenario('Verify search options dropdown is displayed', async (SB) => {
   expect(await SB.checkSearchDropDown()).to.be.true;
});

Scenario('Select a slice', async (SB) => {
   expect(await SB.selectSlices()).to.be.true;
});

Scenario('Unselect a slice', async (SB) => {
   expect(await SB.unSelectSlices()).to.be.true;
});

Scenario('Verify only 3 slices are present in dropdown', async (SB) => {
   expect(await SB.expectOnly3Slices()).to.be.true;
});

Scenario('Click on show more slice to view more slices', async (SB) => {
   expect(await SB.showMoreSlices()).to.be.true;
});

Scenario('Click and open any search form', async (SB) => {
   expect(await SB.openSearchFormsInSidePanel()).to.be.true;
});

Scenario('Click on cancel to close the sidepanel', async (SB) => {
   expect(await SB.closeSidePanel()).to.be.true;

});

Scenario('Verify search options dropdown is displayed', (I) => {
   I.click(".csui-search-input-container .csui-input");
   I.waitForElement(".csui-search-options-dropdown");
   I.seeElement(".csui-search-options-dropdown");
   I.seeElement(".csui-searchbox-slices-wrapper");
   I.seeElement(".csui-searchbox-searchform-wrapper");
});

Scenario('Click on more search form button', (SB) => {
   SB.openMoreSearchForms();
});

Scenario('Verify search forms collection is displayed', async (SB) => {
   expect(await SB.checkSearchFormsCollections()).to.be.true;
});

Scenario('Click on cancel to close the sidepanel', async (SB) => {
   expect(await SB.closeSidePanel()).to.be.true;
});

Scenario('Focus on search box input and verify search opions dropdown is opened', async (I, SB) => {
   expect(await SB.checkSearchDropDown('Tab')).to.be.true;
});

Scenario('Shift the focus onto 1st slice', async (SB) => {

   expect(await SB.slicesOrSearchFormKey('Tab', 0, '.csui-search-popover-row-body')).to.be.true;
});

Scenario('Shift the focus onto 2nd slice', async (SB) => {
   expect(await SB.slicesOrSearchFormKey('ArrowDown', 1, '.csui-search-popover-row-body')).to.be.true;
});

Scenario('Shift the focus onto 1st slice using arrowup', async (SB) => {
   expect(await SB.slicesOrSearchFormKey('ArrowUp', 0, '.csui-search-popover-row-body')).to.be.true;
});

Scenario('Select a slice', async (SB) => {
   expect(await SB.selectSlices('Enter')).to.be.true;
});

Scenario('Unselect a slice', async (SB) => {
   expect(await SB.unSelectSlices("Enter")).to.be.true;
});

Scenario('Shift focus to more search forms', async (I) => {
   expect(await I.checkFocusOnElement('.csui-slices-more', 'Tab')).to.be.true;
});

Scenario('Press enter to view more slices', async (SB) => {
   expect(await SB.showMoreSlices('Enter')).to.be.true;
});

Scenario('Shift the focus onto 1st search form', async (I,SB) => {
   expect(await I.checkFocusOnElement('.csui-searchforms-popover-row', 'Tab')).to.be.true;
});

Scenario('Shift the focus onto 2nd search form', async (SB) => {
   expect(await SB.slicesOrSearchFormKey('ArrowDown', 1, ".csui-search-form-item")).to.be.true;
});

Scenario('Shift the focus onto 1st search form using arrowup', async (SB) => {
   expect(await SB.slicesOrSearchFormKey('ArrowUp', 0, ".csui-search-form-item")).to.be.true;
});

Scenario('Open search forms', async (SB) => {
   expect(await SB.openSearchFormsInSidePanel('Enter')).to.be.true;

});

Scenario('Shift focus to close icon on side panel', async (I) => {
   I.waitMaxTimeForElement(".csui-side-panel-main");
   I.seeElement(".csui-side-panel-main");
   expect(await I.checkFocusOnElement('.csui-sidepanel-close', ['Shift', 'Tab'])).to.be.true;
});

Scenario('Close the search form',async (SB) => {
   expect(await SB.closeSidePanel('Enter')).to.be.true;
});

Scenario('Open More search forms', (I, SB) => {
   for (let i = 0; i < 5; i++) {
      I.pressKey('Tab');
   }
   SB.openMoreSearchForms('Enter');

});

Scenario('Shift focus to close icon on more search forms side panel', async (I) => {
   I.waitMaxTimeForElement(".csui-side-panel-main");
   I.seeElement(".csui-side-panel-main");
   expect(await I.checkFocusOnElement('.csui-sidepanel-close', ['Shift', 'Tab'])).to.be.true;
});

Scenario('Close the more search forms side panel',async (SB) => {
   expect(await SB.closeSidePanel('Enter')).to.be.true;
});
Scenario.skip('Execute Performance tests - Search Box View', async (I) => {
   I.loadHTML("lib/src/csui/widgets/search.box/test/index.html");
   let data = await I.grabDataFromPerformanceTiming();
   I.say(`Total time to render page: ${data.loadEventEnd}​​​​ms`);
   expect(data.loadEventEnd).to.be.lt(350);
});