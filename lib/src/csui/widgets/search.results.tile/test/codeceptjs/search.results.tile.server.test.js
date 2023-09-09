/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Search Result widget Live Server Test cases');

Scenario('Login to Server:', (I, Data) => {
   I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
   I.ensureNotInAccesibilityMode();
}).injectDependencies({ Data: require('./data.js') });

Scenario('Validate Search tile :', (I) => {
   I.wait(15);
   I.waitMaxTimeForElement("[data-csui-widget_type='search.results.tile']");
   I.seeElement("[data-csui-widget_type='search.results.tile']");
});

Scenario('Verify Widget Title:', (SRT) => {
   SRT.checkTitle();
});

Scenario('Verify Widget icons:', (SRT) => {
   SRT.hoverOnHeader();
   SRT.verifyHeaderIcons();
});

Scenario ('Validate search on search widget Tile:', async(SRT) => {
   SRT.hoverOnHeader();
   SRT.clickSearchOnWidget();
   expect(await SRT.enterValidSearchKeyOnWidget("test")).to.be.true;
});

Scenario('Close search after valid search', async (SRT) => {
   SRT.closeSearchOnWidget();
 });

 Scenario('Validate invalidsearch on search widget Tile:',async(SRT) => {
   SRT.hoverOnHeader();
   SRT.clickSearchOnWidget();
   expect(await SRT.enterInValidSearchKeyOnWidget("ZZZZ")).to.be.false;
});

Scenario('Close search after Invalid search', async (SRT) => {
   SRT.closeSearchOnWidget();
 });

Scenario('Validate Expand icon on search widget:', (SRT) => {
   SRT.hoverOnHeader();
   SRT.VerifyExpandOption();
});
