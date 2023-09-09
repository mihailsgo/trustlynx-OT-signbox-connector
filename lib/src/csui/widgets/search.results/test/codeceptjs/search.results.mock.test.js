/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const outputSettings = {
  ignoreAreasColoredWith: {r: 250, g: 250, b: 250, a: 0},
};

Feature('Search Results Mock Test cases');

BeforeSuite((I) => {
    I.loadHTML("lib/src/csui/widgets/search.results/test/index.html");
    I.waitMaxTimeForElement(".csui-search-item-row-wrapper");
    I.seeElement(".csui-search-item-row-wrapper");
});

 Scenario('Verify search header', (SRV) => {
    SRV.verifyHeader();
});

Scenario('Validate header count with total container items', async (SRV) => {
    expect(await SRV.validateItemCount()).to.be.true;
});

Scenario('validate filter icon', (SRV) => {
    SRV.validateFilterIcon();
});

Scenario('validate facet in filter', async (SRV) => {
    expect(await SRV.validateFacet(2)).to.be.true;
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

Scenario('select an item', (SRV) => {
    SRV.selectNode(1);
});

Scenario('unselect an item', (I,SRV) => {
    SRV.unselectNode(1);
    I.dontSeeElement(".csui-selected-count.csui-acc-tab-region.binf-hidden");
})

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

Scenario('Verify Search settings options', (SREV) => {
    SREV.searchSettingsOptions();
});

Scenario('Verify column setting option', (SREV) => {
    SREV.columnSettingsOption();
});

Scenario('Verify Summary description setting option', (SREV) => {
    SREV.summaryDescriptionSettingsOption();
});

Scenario('Check Sort by options', async(SRV) => {
    expect(await SRV.checkSortByOptions()).to.equal('Sort by Relevance');
});

Scenario('Change sort option to Date', async (SRV) => {
    expect(await SRV.changeSortOption()).to.equal('Date: Click to sort ascending');
});
Scenario.skip('Execute Performance tests - Search Results View', async (I) => {
    I.loadHTML("lib/src/csui/widgets/search.results/test/index.html");
    I.waitMaxTimeForElement(".csui-search-item-row-wrapper");
    I.seeElement(".csui-search-item-row-wrapper");
    let data = await I.grabDataFromPerformanceTiming();
    I.say(`Total time to render page: ${data.loadEventEnd}​​​​ms`);
    expect(data.loadEventEnd).to.be.lt(300);
 });