/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const Data = require('./data.js');

Feature('Compound Document Live Server Test Cases');

BeforeSuite((I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
    I.ensureNotInAccesibilityMode();
});

Scenario('Open add item dropdown', (CD) => {
    CD.openAddItemDropdown();
});

Scenario('Add compound document',(CD) => {
    CD.addCompoundDocument("Test Compound Document");
});

Scenario('Create compound document',(CD) => {
    CD.createCompoundDocument("Test Compound Document");
});

Scenario('Verify inline actions for created compound document',async (CD) => {
    expect(await CD.verifyInlineCDOptions("Test Compound Document")).to.be.true;
});

Scenario('Select created compound document in table view', (CD) => {
    CD.selectCDTableView("Test Compound Document");
});

Scenario('Verify Compound Document submenu option in bulk actions for selected CD',async (CD) => {
    expect(await CD.verifyBulkCDMenuOption()).to.be.true;
});

Scenario('Open Compound documents submenu in bulk actions',(CD) => {
    CD.openToolbarSubmenu();
    CD.openCDSubmenu();
});

Scenario('Verify CD submenu options (4 options must be available)',async (CD) => {
    let expectedCDOptions = ['createrelease', 'createrevision', 'reorganize', 'viewreleases'];
    expect(await CD.verifyCDSubmenuOptions(expectedCDOptions)).to.be.true;
});

Scenario('Unselect compound document',(CD) => {
    CD.unSelectCDTableView("Test Compound Document");
});

Scenario('Create another Compound Document',(CD) => {
    CD.openAddItemDropdown();
    CD.addCompoundDocument("Test Compound Document 2");
    CD.createCompoundDocument("Test Compound Document 2");
});

Scenario('Select both compound documents',(CD) => {
    CD.selectCDTableView("Test Compound Document");
    CD.selectCDTableView("Test Compound Document 2");
});

Scenario('Verify Compound Document submenu option in bulk actions for both selected CDs',async (CD) => {
    expect(await CD.verifyBulkCDMenuOption()).to.be.true;
});

Scenario('Open Compound documents submenu in bulk actions for both CDs',(CD) => {
    CD.openToolbarSubmenu();
    CD.openCDSubmenu();
});

Scenario('Verify CD submenu options (only releases option  must be available)',async (CD) => {
    let expectedCDOptions = 'viewreleases';
    expect(await CD.verifyCDSubmenuOptions(expectedCDOptions)).to.be.true;
});

Scenario('Unselect both compound documents',(CD) => {
    CD.unSelectCDTableView("Test Compound Document");
    CD.unSelectCDTableView("Test Compound Document 2");
});

Scenario('Add any empty folder',(CD) => {
    CD.openAddItemDropdown();
    CD.createEmptyFolder("Empty test folder");
});

Scenario('Select a compound document and empty folder',(CD) => {
    CD.selectCDTableView("Test Compound Document");
    CD.selectCDTableView("Empty test folder");
});

Scenario('Verify that Compount Document option is NOT available for selected documents',async (CD) => {
    expect(await CD.verifyBulkCDMenuOption()).to.be.false;
});

Scenario('Unselect items',(CD) => {
    CD.unSelectCDTableView("Test Compound Document");
    CD.unSelectCDTableView("Empty test folder");
});

Scenario('Open any one of the compound documents',async (CD) => {
    expect(await CD.openCompoundDocument("Test Compound Document")).to.be.true;
});

Scenario('Open add item dropdown inside compound document',(CD) => {
    CD.openAddItemDropdown();
});

Scenario('Verify items in add item dropdown',(CD) => {
    CD.verifyCDAddItemDropdown();
}); 

Scenario('Add compound document inside compound document',(CD) => {
    CD.addCompoundDocument("Compound Document in CD");
 });

Scenario('Create Compound document inside compound document',(CD) => {
    CD.createCompoundDocument("Compound Document in CD");
});

Scenario('Open Compound document menu in header',(CD) => {
    CD.openCDHeaderMenu();
});

Scenario('Open Compound document options submenu in header',(CD) => {
    CD.openCDSubMenuInHeader();
});

Scenario('Verify Compound documents options inside CD submenu',async (CD) => {
    let expectedCDOptions = ['createrelease', 'createrevision', 'reorganize', 'viewreleases'];
    expect(await CD.verifyCDHeaderOptions(expectedCDOptions)).to.be.true;
});

Scenario('Click on create release option',(CD) => {
    CD.openCreateReleaseDialog();
});

Scenario('Validate Create Release dialog',async (CD) => {
    expect(await CD.validateCreateReleaseDialog()).to.be.true;
});

Scenario('Create release on clicking submit button',(CD) => {
    CD.createRelease();
});

Scenario('Go to releases tab by clicking on Go to location',(CD) => {
    CD.goToReleasesTab();
});

Scenario('Verify releases tab',(CD) => {
    CD.verifyReleaseTab("Test Compound Document");
});

Scenario('Navigate to compound document main folder',async (CD) => {
    expect(await CD.navigateToCDMainFolder("Test Compound Document")).to.be.true;
});

Scenario('Open Compound document options submenu in header to create revision',(CD) => {
    CD.openCDHeaderMenu();
    CD.openCDSubMenuInHeader();
});

Scenario('Click on create revision option',(CD) => {
    CD.openCreateRevisionDialog();
});

Scenario('Validate Create Revision dialog',async (CD) => {
    expect(await CD.validateCreateRevisionDialog('Revision 1.1')).to.be.true;
});

Scenario('Create revision on clicking submit button',(CD) => {
    CD.createRevision();
});

Scenario('Go to revisions tab by clicking on Go to location',(CD) => {
    CD.goToReleasesTab();
});

Scenario('Verify revisions tab',(CD) => {
    CD.verifyRevisionTab("Test Compound Document");
});

Scenario('Navigate to compound document test folder',async (CD) => {
    expect(await CD.navigateToAncestor('Compound Document Test')).to.be.true;
});

Scenario('Delete all items',(CD) => {
    CD.deleteAllItems();
});

Scenario('Navigate to automation folder',async (CD,I) => {
    I.wait(1);
    expect(await CD.navigateToAncestor('Automation test data(Do not delete folder or subitems)')).to.be.true;
});
Scenario('Navigate to Compound Document Reorganize and Order column folder', (I) => {
    I.searchAndOpenFolderByName('Compound Document Reorganize and Order column');
});

Scenario('Navigate to compound document', async (CD) => {
    expect(await CD.openCompoundDocument("Compound document")).to.be.true;
});

Scenario('Verify that order column is present for compound document', (I) => {
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[data-csui-attribute="order"]');
});

Scenario('Verify that default sort is on order column', (I) => {
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort descending"]');
});

Scenario('Verify order values before sort', async (I, CD) => {
    let order = await I.grabAttributeFrom('.binf-table .csui-table-cell-generic-text[data-csui-attribute="order"] .csui-table-cell-text', 'innerText');
    expect(order[order.length - 1]).to.be.gte(order[0]);
});

Scenario('Click on order column to change the sorting order', async (I, CD) => {
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort descending"]');
    I.click('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort descending"]');
    I.wait(1);
    I.waitMaxTimeForElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort ascending"]');
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort ascending"]');
});

Scenario('Verify order values after sort', async (I) => {
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort ascending"]');
    let order = await I.grabAttributeFrom('.binf-table .csui-table-cell-generic-text[data-csui-attribute="order"] .csui-table-cell-text', 'title');
    expect(order[order.length - 1]).to.be.lte(order[0]);
});

Scenario('Click on order column to change the sorting order', async (I, CD) => {
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort ascending"]');
    I.click('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort ascending"]');
    I.waitMaxTimeForElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort descending"]');
    I.seeElement('.csui-nodetable .binf-table .csui-table-cell-generic-text[title="Order - Click to sort descending"]');
});

Scenario('Open Compound document options submenu in header to reorganize', (CD) => {
    CD.openCDHeaderMenu();
    CD.openCDSubMenuInHeader();
});

Scenario('Click on reorganize option', (CD) => {
    CD.clickOnReorganizeCommand();
});

Scenario('Validate Reorganize side panel', (CD) => {
    CD.validateReorganizeSidepanel();
});

Scenario('Verify that master document switch is disabled initially', (I) => {
    I.seeElement('.csui-sidepanel-body .csui-master-button-section .required-fields-switch .binf-switch.binf-switch-on');
});

Scenario('Enable master document switch', (CD, I) => {
    CD.clickOnMasterSwitch();
    I.seeElement('.csui-sidepanel-body .csui-master-button-section .required-fields-switch .binf-switch.binf-switch-off');
    I.seeElement('.csui-sidepanel-body .csui-compound-document-reorder-section .csui-reorder-item[data-order-id="0"]');
});

Scenario('Verify that master document is enabled', (CD, I) => {
    CD.submitReorganize();
    I.waitMaxTimeForElement('.csui-table-cell-generic-text[data-csui-attribute="order"] .csui-table-cell-text[title="Master"]');
    I.seeElement('.csui-table-cell-generic-text[data-csui-attribute="order"] .csui-table-cell-text[title="Master"]');
});

Scenario('Open Compound document options submenu in header to reorganize', (CD) => {
    CD.openCDHeaderMenu();
    CD.openCDSubMenuInHeader();
});

Scenario('Click on reorganize option', (CD) => {
    CD.clickOnReorganizeCommand();
});

Scenario('Disable master document switch', (CD, I) => {
    CD.clickOnMasterSwitch();
    I.seeElement('.csui-sidepanel-body .csui-master-button-section .required-fields-switch .binf-switch.binf-switch-on');
    I.dontSeeElement('.csui-sidepanel-body .csui-compound-document-reorder-section .csui-reorder-item[data-order-id="0"]');
});

Scenario('Submit changes in sidepanel', (CD, I) => {
    CD.submitReorganize();
    I.wait(1);
    I.dontSeeElement('.csui-table-cell-generic-text[data-csui-attribute="order"] .csui-table-cell-text[title="Master"]');
});

Scenario('Navigate to empty compound document', async (CD) => {
    expect(await CD.openCompoundDocument("Compound document")).to.be.true;
}
);

Scenario('Open Compound document options submenu in header to create revision', (CD) => {
    CD.openCDHeaderMenu();
    CD.openCDSubMenuInHeader();
});

Scenario('Click on reorganize option', (CD) => {
    CD.clickOnReorganizeCommand();
});

Scenario('Verify that master switch and submit buttom are disabled', (CD) => {
    CD.validateReorganizeSidepanelForEmptyCompoundDocument();
});

Scenario('Close reorganize sidepanel', (I) => {
    I.click('.csui-side-panel-main .csui-sidepanel-close');
    I.dontSeeElement('.csui-sidepanel');
});

Scenario('Navigate to compound document test folder', async(CD) => {
    expect(await CD.navigateToAncestor("Compound Document Reorganize and Order column")).to.be.true;
});

Scenario('Select compund document ', (CD) => {
    CD.selectCDTableView("Compound document");
 });

Scenario('open view releases tab', (I,CD) => {
    CD.openViewReleases();
});

Scenario('Select Revision', (CD) => {
    CD.selectCDTableView("Revision 1.1");    
});

Scenario('Verify actions available for revision', async (I, CD) => {
    I.wait(1);
    let expectedOptions = ['releasesproperties', 'copylink', 'inlineedit', 'lock', 'delete'], 
        selector = '.csui-compound-document-releases .csui-toolbar li[data-csui-command]';
    expect(await CD.verifyViewReleasesActions(selector, expectedOptions)).to.be.true;
});

Scenario('Unselect Revision', (CD) => {
    CD.unSelectCDTableView("Revision 1.1");
})

Scenario('Select release', (CD) => {
    CD.selectCDTableView("Release 1.0");    
});

Scenario('Verify actions available for revision', async (CD) => {
    let expectedOptions = ['releasesproperties', 'copylink', 'inlineedit', 'lock', 'delete'],
        selector = '.csui-compound-document-releases .csui-toolbar li[data-csui-command]';
    expect(await CD.verifyViewReleasesActions(selector, expectedOptions)).to.be.true;
});

Scenario('Select Revision', (CD) => {
    CD.selectCDTableView("Revision 1.1");    
});

Scenario('Verify actions available for both Release and Revision', async (CD) => {
    let expectedOptions = ['releasesproperties', 'lock', 'delete'],
        selector = '.csui-compound-document-releases .csui-toolbar li[data-csui-command]';
    expect(await CD.verifyViewReleasesActions(selector, expectedOptions)).to.be.true;
});


Scenario('Verify Unselecting of both Release and Revision', (CD) => {
    CD.unSelectCDTableView("Revision 1.1");
    CD.unSelectCDTableView("Release 1.0");
})

Scenario('Show Inline actions for Revision', (CD) => {
    CD.hoverOverFile("Revision 1.1")
});

Scenario('Verify Inline actions for Revision', async (CD) => {
    let expectedOptions = ['releasesproperties', 'copylink', 'inlineedit', 'lock', 'delete'],
        selector = '.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble li[data-csui-command]';
    expect(await CD. verifyViewReleasesActions(selector, expectedOptions)).to.be.true;
});

Scenario('Show Inline actions for Release', (CD) => {
    CD.hoverOverFile("Release 1.0")
});

Scenario('Verify Inline actions for Release', async (CD) => {
    let expectedOptions = ['releasesproperties', 'copylink', 'inlineedit', 'lock', 'delete'],
        selector = '.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble li[data-csui-command]';
    expect(await CD. verifyViewReleasesActions(selector, expectedOptions)).to.be.true;
});

Scenario('Select Revision', (CD) => {
    CD.selectCDTableView("Revision 1.1");    
});

Scenario('Verify lock action availability and perform lock action', (I, CD) => {
    I.waitMaxTimeForElement('.csui-compound-document-releases .csui-toolbar li[data-csui-command="lock"]');
    I.seeElement('.csui-compound-document-releases .csui-toolbar li[data-csui-command="lock"]'); 
    I.click('.csui-compound-document-releases .csui-toolbar li[data-csui-command="lock"]');
});

Scenario('Verify success global message after lock action', (I) => {
    I.waitMaxTimeForElement('.csui-messagepanel.csui-success .csui-text[title="1 item successfully locked."]');
    I.seeElement('.csui-messagepanel.csui-success .csui-text[title="1 item successfully locked."]');
});

Scenario('Verify lock icon shown beside name', (I) => {
    I.waitMaxTimeForElement('tr.odd.csui-has-details-row.csui-saved-item > td.csui-table-cell-node-state .csui-node-state-locked');
    I.seeElement('tr.odd.csui-has-details-row.csui-saved-item > td.csui-table-cell-node-state .csui-node-state-locked');
});

Scenario('Verify delete action is not shown for locked', (I) => {
    I.dontSeeElement('.csui-compound-document-releases .csui-toolbar li[data-csui-command="delete"]');
});

Scenario('Verify unlock action', (I) => {
    I.seeElement('.csui-compound-document-releases .csui-toolbar li[data-csui-command="unlock"]');
    I.click('.csui-compound-document-releases .csui-toolbar li[data-csui-command="unlock"]');
});

Scenario('Verify success global message after unlock action', (I) => {
    I.waitMaxTimeForElement('.csui-messagepanel.csui-success .csui-text[title="1 item successfully unlocked."]');
    I.seeElement('.csui-messagepanel.csui-success .csui-text[title="1 item successfully unlocked."]');
});

Scenario('Verify lock icon disappears', (I) => {
    I.dontSeeElement('tr.odd.csui-has-details-row.csui-saved-item > td.csui-table-cell-node-state .csui-node-state-locked');
});

Scenario('Open Revision 1.1', (I) => {
    I.waitMaxTimeForElement('.csui-nodetable .csui-table-cell-name-value[title="Revision 1.1"]');
    I.seeElement('.csui-nodetable .csui-table-cell-name-value[title="Revision 1.1"]');
    I.click('.csui-nodetable .csui-table-cell-name-value[title="Revision 1.1"]');
});

Scenario('Verify Add and Filter are not available for Revision', (I) => {
    I.waitMaxTimeForElement('.csui-nodestable .csui-tabletoolbar');
    I.dontSeeElement('.csui-table-tabletoolbar .csui-filterToolbar');
    I.dontSeeElement('.csui-table-tabletoolbar .csui-addToolbar');
});

