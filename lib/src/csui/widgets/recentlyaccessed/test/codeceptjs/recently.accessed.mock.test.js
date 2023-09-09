/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const outputSettings = {
  ignoreAreasColoredWith: {r: 250, g: 250, b: 250, a: 0},
};

Feature('Recently Accessed Widget Mock Test cases');

BeforeSuite((I) => {
  I.loadHTML("lib/src/csui/widgets/recentlyaccessed/test/index.html");
  I.waitMaxTimeForElement('.cs-recentlyaccessed');
  I.seeElement('.cs-recentlyaccessed');
});

Scenario('Verify Widget Title:',(RACT) => {
  RACT.checkTitle();  
});

Scenario.skip('Compare Recently Accessed Screenshots', async (I) => {
  I.saveScreenshot("RCAWidgetImg.png", true);
  I.seeVisualDiff("RCAWidgetImg.png", { prepareBaseImage: true, tolerance: 1});  
}); 

Scenario('Verify Recently Accessed widget header icons ', (RACT) => {
    RACT.verifysRecentlyAccessedWidgetIconsForMock();
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
    I.click('.cs-recentlyaccessed .tile-expand');
    I.waitMaxTimeForElement(".csui-recently-accessed-table-view .load-container.binf-hidden");
    I.waitMaxTimeForElement('.binf-widgets.binf-modal-open .recentlyaccessed.csui-expanded');
    I.waitForVisible('.binf-widgets.binf-modal-open .recentlyaccessed.csui-expanded');
});

Scenario('Verify CopyLink Command:', async (RACT) => {
  RACT.copyLink();
});
Scenario.skip('Execute Performance tests - Recently Accessed View', async (I) => {
  I.loadHTML("lib/src/csui/widgets/recentlyaccessed/test/index.html");
  let data = await I.grabDataFromPerformanceTiming();
  I.say(`Total time to render page: ${data.loadEventEnd}ms`);
  expect(data.loadEventEnd).to.be.lt(350);
});