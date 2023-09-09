/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Search Result widget in Expand view Live Server Test cases');

Scenario('Login to Server:', (I, Data) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
    I.ensureNotInAccesibilityMode();
}).injectDependencies({ Data: require('./data.js') });

Scenario('Validate Expand icon on search widget:', (I, SRT, SREV) => {
    SRT.hoverOnHeader();
    SREV.VerifyExpandOption();
});

Scenario('Verify table header after expanding', async (SREV) => {
    SREV.verifyHeader();
});


Scenario('Check for inline actions', async (SREV) => {
    SREV.hoverOnItem(1);
});

Scenario('Close inline actions', async (SREV) => {
    SREV.closeInlineActions();
});

Scenario('select an item', async (SREV) => {
    expect(await SREV.selectNode(1)).to.be.true;
});

Scenario('unselect an item', async (I, SREV) => {
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

Scenario('Verify pagination view', async (SREV) => {
    SREV.verifyPaginationView();
});

Scenario('Verify pagination menu', async (SREV) => {
    expect(await SREV.verifyPaginationMenu()).to.be.true;
});

Scenario('Change the page size', async (SREV) => {
    expect(await SREV.changePageSize()).to.be.true;
});


Scenario('Verify Search settings options', async (SREV) => {
    SREV.searchSettingsOptions();
});
Scenario('Verify column setting option', async (SREV) => {
    SREV.columnSettingsOption();
});
Scenario('Verify Summary description setting option', async (SREV) => {
    SREV.summaryDescriptionSettingsOption();
});


