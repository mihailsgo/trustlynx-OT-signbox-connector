/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const outputSettings = {
  ignoreAreasColoredWith: {r: 250, g: 250, b: 250, a: 0},
};

Feature('Search Result tile Mock Test cases');

BeforeSuite((I) => {
  I.loadHTML("lib/src/csui/widgets/search.results.tile/test/index.html");
  I.waitMaxTimeForElement("[aria-label='Search in Search Results']");
  I.seeElement("[aria-label='Search in Search Results']");
});

 Scenario('Verify Widget Title:', (SRT) => {
  SRT.checkTitle();
});

Scenario('Verify Widget icons:', (I,SRT) => {
  SRT.hoverOnHeader();
  SRT.verifyHeaderIcons();
});

Scenario('Validate valid search on search widget Tile:', async(SRT) => {
  SRT.hoverOnHeader();
  SRT.clickSearchOnWidget();
  expect(await SRT.enterValidSearchKeyOnWidget("test")).to.be.true;
});

Scenario('Close search after valid search', async (SRT) => {
  SRT.closeSearchOnWidget();
});

Scenario('Validate invalid search on search widget Tile:', async (I,SRT) => {
  SRT.hoverOnHeader();
  SRT.clickSearchOnWidget();
  expect(await SRT.enterInValidSearchKeyOnWidget("ZZZZ")).to.be.false;
});

Scenario('Close search after Invalid search', async (SRT) => {
  SRT.closeSearchOnWidget();
});

Scenario('Verify more button when hovering on the item', async (SRT) => {
  expect(await SRT.hoverOnItem(1)).to.be.true;
});

Scenario('verify inline actions', async (SRT) => {
  expect(await SRT.clickonInlineActions()).to.be.true;
});

Scenario('close inline actions', (I, SRT) => {
  SRT.closeInlineActions();
});

Scenario.skip('Execute Performance tests - Search Results Tile View', async (I) => {
  I.loadHTML("lib/src/csui/widgets/search.results.tile/test/index.html");
  I.waitMaxTimeForElement("[aria-label='Search in Search Results']");
  let data = await I.grabDataFromPerformanceTiming();
  I.say(`Total time to render page: ${data.loadEventEnd}​​​​ms`);
  expect(data.loadEventEnd).to.be.lt(450);
});