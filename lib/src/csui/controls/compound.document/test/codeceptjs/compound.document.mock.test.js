/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai');
const expect = chai.expect;
const outputSettings = {
   ignoreAreasColoredWith: { r: 250, g: 250, b: 250, a: 0 },
};

require('events').EventEmitter.prototype._maxListeners = 100;

Feature('Compound Document Mock Test cases');

BeforeSuite((I) => {
   I.loadHTML("lib/src/csui/controls/compound.document/test/index.html");
   I.waitMaxTimeForElement(".csui-nodestable");
   I.seeElement(".csui-nodestable");
});

Scenario('Open add item dropdown', (CD) => {
   CD.openAddItemDropdown();
});

Scenario('Add compound document', (CD) => {
   CD.addCompoundDocument("Test Compound Document");
});

Scenario('Verify inline actions fo compound document', async (CD) => {
   expect(await CD.verifyInlineCDOptions("First child")).to.be.true;
});

Scenario('Select created compound document in table view', (CD) => {
   CD.selectCDTableView("First child");
});

Scenario('Verify Compound Document submenu option in bulk actions for selected CD', async (CD) => {
   expect(await CD.verifyBulkCDMenuOption()).to.be.true;
});

Scenario('Open Compound documents submenu in bulk actions', (CD) => {
   CD.openCDSubmenu();
});

Scenario('Verify CD submenu options (4 options must be available)', async (CD) => {
   let expectedCDOptions = ['createrelease', 'createrevision', 'reorganize', 'viewreleases'];
   expect(await CD.verifyCDSubmenuOptions(expectedCDOptions)).to.be.true;
});

Scenario('Select another compound document', (CD) => {
   CD.selectCDTableView("child 2");
});

Scenario('Verify Compound Document submenu option in bulk actions for both selected CDs', async (CD) => {
   expect(await CD.verifyBulkCDMenuOption()).to.be.true;
});

Scenario('Open Compound documents submenu in bulk actions for both CDs', (CD) => {
   CD.openCDSubmenu();
});

Scenario('Verify CD submenu options (only releases option  must be available)', async (CD) => {
   let expectedCDOptions = 'viewreleases';
   expect(await CD.verifyCDSubmenuOptions(expectedCDOptions)).to.be.true;
});

Scenario('Unselect a compound document', (CD) => {
   CD.unSelectCDTableView("child 2");
});

Scenario('Select a compound document and a document', (CD) => {
   CD.selectCDTableView("My Document.docx");
});

Scenario('Verify that Compount Document option is NOT available for selected documents', async (CD) => {
   expect(await CD.verifyBulkCDMenuOption()).to.be.false;
});

Scenario('Unselect document', (CD) => {
   CD.unSelectCDTableView("My Document.docx");
   CD.unSelectCDTableView("First child");
});

Scenario('Open Compound document menu in header to create release', (CD) => {
   CD.openCDHeaderMenu();
});

Scenario('Open Compound document options submenu in header', (CD) => {
   CD.openCDSubMenuInHeader();
});

Scenario('Verify Compound documents options inside CD submenu', async (CD) => {
   let expectedCDOptions = ['createrelease', 'createrevision', 'reorganize', 'viewreleases'];
   expect(await CD.verifyCDHeaderOptions(expectedCDOptions)).to.be.true;
});

Scenario('Click on create release option', (CD) => {
   CD.openCreateReleaseDialog();
});

Scenario('Validate Create Release dialog', async (CD) => {
   expect(await CD.validateCreateReleaseDialog()).to.be.true;
});

Scenario('Enter invalid text to verify error message on create release dialog', (CD) => {
   CD.verifyErrorMessageForInputField();
});

Scenario('Verify destroying dialog with cancel button on create release dialog', (CD) => {
   CD.cancelDialog();
});
Scenario('KN:Open Compound document menu in header to create release', (CD) => {
   CD.openCDHeaderMenu();
});

Scenario('KN:Open Compound document options submenu in header', (CD) => {
   CD.openCDSubMenuInHeader();
});

Scenario('KN:Click on create release option', (CD) => {
   CD.openCreateReleaseDialog();
});

Scenario('KN: Verify focus on create release input field', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-body .csui-create-release .csui-document-name input')).to.be.true;
});

Scenario('KN: Enter invalid text to verify error message on create release dialog', (CD) => {
   CD.verifyErrorMessageForInputField('Enter');
});

Scenario('Shift focus to submit button on create release dialog', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-dialog .binf-modal-footer .cs-add-button', 'Tab')).to.be.true;
});

Scenario('Shift focus to cancel button on create release dialog', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-dialog .binf-modal-footer .binf-btn-default', 'Tab')).to.be.true;
});

Scenario.skip('Shift focus to input field', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-body .csui-create-release .csui-document-name input', 'Tab')).to.be.true;
});

Scenario('Verify destroying dialog with ESC button on create release dialog', (CD) => {
   CD.cancelDialog('Escape');
});
Scenario('Open Compound document menu in header to create revision', (CD) => {
   CD.openCDHeaderMenu();
});

Scenario('Open Compound document options submenu in header to create revision', (CD) => {
   CD.openCDSubMenuInHeader();
});

Scenario('Click on create revision option', (CD) => {
   CD.openCreateRevisionDialog();
});

Scenario('Validate Create Revision dialog', async (CD) => {
   expect(await CD.validateCreateRevisionDialog('Revision 0.1')).to.be.true;
});

Scenario('Enter invalid text to verify error message', (CD) => {
   CD.verifyErrorMessageForInputField();
});

Scenario('Verify destroying dialog with cancel button', (CD) => {
   CD.cancelDialog();
});
Scenario('KN: Open Compound document menu in header to create revision', (CD) => {
   CD.openCDHeaderMenu();
});

Scenario('KN: Open Compound document options submenu in header to create revision', (CD) => {
   CD.openCDSubMenuInHeader();
});

Scenario('KN: Click on create revision option', (CD) => {
   CD.openCreateRevisionDialog();
});

Scenario('KN: Verify focus on create revision input field', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-body .csui-create-revision .csui-document-name input')).to.be.true;
});

Scenario('KN: Enter invalid text to verify error message on create revision dialog', (CD) => {
   CD.verifyErrorMessageForInputField('Enter');
});

Scenario('Shift focus to submit button on create revision dialog', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-dialog .binf-modal-footer .cs-add-button', 'Tab')).to.be.true;
});

Scenario('Shift focus to cancel button on create revision dialog', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-dialog .binf-modal-footer .binf-btn-default', 'Tab')).to.be.true;
});

Scenario.skip('Shift focus to input field', async (I) => {
   expect(await I.checkFocusOnElement('.binf-modal-body .csui-create-revision .csui-document-name input', 'Tab')).to.be.true;
});

Scenario('Verify destroying dialog with ESC button on create revision dialog', (CD) => {
   CD.cancelDialog('Escape');
});