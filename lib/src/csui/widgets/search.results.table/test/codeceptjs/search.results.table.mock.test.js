/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const outputSettings = {
  ignoreAreasColoredWith: {r: 250, g: 250, b: 250, a: 0},
};

Feature('Search Result Table Mock Test cases');

BeforeSuite((I) => {
  I.loadHTML("lib/src/csui/widgets/search.results.table/test/index.html");
  I.waitMaxTimeForElement(".csui-search-results-table-view");
  I.seeElement(".csui-search-results-table-view");
});

Scenario('Verify table header', (SREV) => {
  SREV.verifyHeader();
});

Scenario('Verify table is loaded or not', async (SREV) => {
  expect(await SREV.verifyTableIsLoaded()).to.be.true;
});

Scenario('Check for inline actions', (SREV) => {
  SREV.hoverOnItem(1);
});

Scenario('Close inline actions', (SREV) => {
  SREV.closeInlineActions();
});

Scenario('select an item', async (SREV) => {
  expect(await SREV.selectNode(1)).to.be.true;
});

Scenario('unselect an item', (I, SREV) => {
  SREV.unselectNode(1);
  I.dontSeeElement(".csui-table-rowselection-toolbar-visible");
});

Scenario('select all', async (SREV) => {
  expect(await SREV.selectAll()).to.be.true;
});

Scenario('unselect all', async (I, SREV) => {
  SREV.unselectAll();
  I.dontSeeElement(".csui-table-rowselection-toolbar-visible");
});

Scenario('Verify pagination view', (SREV) => {
  SREV.verifyPaginationView();
});

Scenario('Verify pagination menu', async (SREV) => {
  expect(await SREV.verifyPaginationMenu()).to.be.true;
});

Scenario('Change the page size', async (SREV) => {
  expect(await SREV.changePageSize()).to.be.false;
});
Scenario('Move focus to select all', async (I, SREV) => {
  expect(await SREV.setFocusToSelectAll()).to.be.true;
});

Scenario('Press enter to select all', async (I, SREV) => {
  expect(await SREV.selectAll('Enter')).to.be.true;
});

Scenario('Press enter to unselect all', (I,SREV) => {
  SREV.unselectAll('Enter');
  I.dontSeeElement(".csui-table-rowselection-toolbar-visible");
});

Scenario('Move focus to select a node', async (I, SREV) => {
  for (let i = 0; i < 3; i++) {
      I.wait(1);
      I.pressKey('Tab');
  }
  expect(await SREV.selectNode(1,'Enter')).to.be.true;
});

Scenario('Press enter to unselect node', (I,SREV) => {
  SREV.unselectNode(1,'Enter');
  I.dontSeeElement(".csui-table-rowselection-toolbar-visible");
});

Scenario('Shift focus to inline actions', async (SREV) => {
  expect(await SREV.setFocusToPaginationDropdown()).to.be.true;
});

Scenario('Verify pagination menu', async (SREV) => {
  expect(await SREV.verifyPaginationMenu('Enter')).to.be.true;
});

Scenario('Change page size to 10 per page', async (I, SREV) => {
  for (let i = 0; i < 3; i++) {
      I.pressKey('ArrowDown');
  }
  expect(await SREV.changePageSize('Enter')).to.be.false;
});
Scenario.skip('Execute Performance tests - Search Results Table View', async (I) => {
  I.loadHTML("lib/src/csui/widgets/search.results.table/test/index.html");
  let data = await I.grabDataFromPerformanceTiming();
  I.say(`Total time to render page: ${data.loadEventEnd}ms`);
  expect(data.loadEventEnd).to.be.lt(750);
});