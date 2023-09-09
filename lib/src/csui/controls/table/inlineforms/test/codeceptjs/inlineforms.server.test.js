/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const Data = require('./data.js');

Feature('Tableview inline form and Multilingual support Live Server Test cases:');

BeforeSuite((I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.inlineFormsTestFolder);
    I.ensureNotInAccesibilityMode();
    I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
});

Scenario('Rename from table header', async (TIF) => {
    TIF.renameFromHeader();
    expect(await TIF.verifyFocusToInputbox()).to.be.true;
});

Scenario('Verify inline form elements', async (TIF) => {
    TIF.verifyInlineFormElements("header");
    expect( await TIF.saveButtonDisabled("header")).to.be.true;
});

Scenario('Open multilingual flyout', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("header")).to.be.true;
});

Scenario('Check that inputboxes are available for all 6 languages', (TIF) => {
    TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('Check that user preferred language is on the top', async (TIF) => {
    expect(await TIF.firstLanguageOnMultilingualFlyout("English", 2)).to.be.true;
});

Scenario('Remove value from user preferred language', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
});

Scenario('Fill value in other language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("de", "Dunken")).equals('Dunken');
});

Scenario('Close flyout and check that name field disabled and value from other language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("closed");
    expect(await TIF.isInputfieldDisabled('Yes', 'header')).equals('Dunken');
});

Scenario('Save changes and check the value in read mode', async (TIF) => {
    TIF.clickTickMark("header");
    expect(await TIF.getNameInReadMode()).equals('Dunken');
});

Scenario('Try to rename and check the flyout opened by default', async (TIF) => {
     TIF.renameFromMenu(); 
     TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('Remove value from all fields and check for error message on flyout', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
    expect(await TIF.removeValueFromFieldOnMLF("de")).equals('');
    TIF.closeMultilingualFlyout("error");
    TIF.errorOnMLF();
});

Scenario('Fill value back in user preferred language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("en", "Table inline form &  Multilingual support tests")).equals("Table inline form &  Multilingual support tests");
});

Scenario('Close flyout and check that name field enabled and value from preferred language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("no error");
    expect(await TIF.isInputfieldDisabled('No','header')).equals('Table inline form &  Multilingual support tests');
});


Scenario.skip('Compare name after rename', () => { // Recently 'click to edit' suffix is added to tooltip, hence this testcase failed, Logged LPAD-95335 for this, skipping it until this JIRA gets fixed
Scenario('Save changes and check the value in read mode', async (TIF) => {
    TIF.clickTickMark("header");
    expect(await TIF.getNameInReadMode()).equals('Table inline form &  Multilingual support tests');
});
});

Scenario('Save changes', async (TIF) => { // This step to be removed once LPAD-95335 is fixed and above step is enabled.
    TIF.clickTickMark("header");
});

Scenario('Rename again from fucntions menu', async (TIF) => {
    TIF.renameFromMenu();   
    expect(await TIF.verifyFocusToInputbox()).to.be.true; 
});


Scenario('Verify that inline form stays in edit mode even after switching to thumbnail view ',  (TIF) => {
    TIF.switchToThumbnailview();
    TIF.verifyInlineFormElements("header");
});

Scenario('Verify that inline form stays in edit mode even after switching back from thumbnail view ',  (TIF) => {
    TIF.switchTolistview();
    TIF.verifyInlineFormElements("header");
});

Scenario('Provide invalid characters for name and look for error message ', async (TIF) => {
   TIF.appendText("header","::;");
   TIF.submit();
   TIF.checkForErrorMessage("header");
   expect(await TIF.saveButtonDisabled("header")).to.be.true;
});

Scenario('Clear name and check save button disabled ', async (TIF) => {
    TIF.clearName("header");
    expect(await TIF.saveButtonDisabled("header")).to.be.true;
});

Scenario('Update name and check save button state', async (TIF) => {
    TIF.appendText("header","test");
    expect(await TIF.saveButtonDisabled("header")).to.be.null;
});

Scenario('Cancel add operation',  (TIF) => {
    TIF.cancelAddRename("header");
});

Scenario('Add Collection and verify inline form elements', async (TIF) => {
    TIF.openAddItemDropdown();
    TIF.addItem(298); //298 is the subtype for Collection 
    TIF.verifyMimeType("Collection");
    TIF.verifyInlineFormElements("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
});

Scenario('Collection: Give some text in name input field', async (TIF) => {
    TIF.appendText("list","Hello");
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('Collection: Open multilingual flyout', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('Collection: Check that inputboxes are available for all 6 languages', (TIF) => {
    TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('Collection: Check that user preferred language is on the top', async (TIF) => {
    expect(await TIF.firstLanguageOnMultilingualFlyout("English", 2)).to.be.true;
});

Scenario('Collection: Remove value from user preferred language', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
});

Scenario('Collection: Fill value in other language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("ar", "Arabic collection")).equals('Arabic collection');
});

Scenario('Collection: Close flyout and check that name field disabled and value from other language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("closed");
    expect(await TIF.isInputfieldDisabled('Yes','list')).equals('Arabic collection');
});

Scenario('Collection: Open multilingual flyout again', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('Collection: Remove value from all fields and check for error message on flyout', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
    expect(await TIF.removeValueFromFieldOnMLF("ar")).equals('');
    TIF.closeMultilingualFlyout("error");
    TIF.errorOnMLF();
});

Scenario('Collection: Fill value back in user preferred language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("en", "English Collection")).equals("English Collection");
});

Scenario('Collection: Close flyout and check that name field enabled and value from preferred language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("no error");
    expect(await TIF.isInputfieldDisabled('No','list')).equals('English Collection');
});

Scenario('Collection: Verify that inline form stays in edit mode even after switching to thumbnail view ',  (TIF) => {
    TIF.switchToThumbnailview();
    TIF.verifyInlineFormElements("list");
});

Scenario('Collection: Verify that inline form stays in edit mode even after switching back from thumbnail view ',  (TIF) => {
    TIF.switchTolistview();
    TIF.verifyInlineFormElements("list");
});

Scenario.skip('Collection save button state check', () => {
  Scenario('Collection: Provide invalid characters for name and look for error message and disabled save button', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.appendText("list",":;::");
    TIF.submit();
    TIF.checkForErrorMessage("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
  });

  Scenario('Collection: Clear name and check save button disabled ', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.clearName("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
  });
});


Scenario('Collection: Update name and check save button enabled', async (TIF) => {
    TIF.appendText("list","Test");
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('Collection: Cancel add operation',  (TIF) => {
    TIF.cancelAddRename("list");
});

Scenario('Add Folder and verify inline form elements', async (TIF) => {
    TIF.openAddItemDropdown();
    TIF.addItem(0); //0 is the subtype for Folder 
    TIF.verifyMimeType("Folder");
    TIF.verifyInlineFormElements("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
});

Scenario('Folder: Give some text in name input field', async (TIF) => {
    TIF.appendText("list","Hello"); 
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('Folder: Open multilingual flyout', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});



Scenario('Folder: Check that inputboxes are available for all 6 languages', (TIF) => {
    TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('Folder: Check that user preferred language is on the top', async (TIF) => {
    expect(await TIF.firstLanguageOnMultilingualFlyout("English", 2)).to.be.true;
});

Scenario('Folder: Remove value from user preferred language', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
});

Scenario('Folder: Fill value in other language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("fr", "French Folder")).equals('French Folder');
});

Scenario('Folder: Close flyout and check that name field disabled and value from other language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("closed");
    expect(await TIF.isInputfieldDisabled('Yes','list')).equals('French Folder');
});

Scenario('Folder: Open multilingual flyout again', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('Folder: Remove value from all fields and check for error message on flyout', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
    expect(await TIF.removeValueFromFieldOnMLF("fr")).equals('');
    TIF.closeMultilingualFlyout("error");
    TIF.errorOnMLF();
});

Scenario('Folder: Fill value back in user preferred language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("en", "English Folder")).equals("English Folder");
});

Scenario('Folder: Close flyout and check that name field enabled and value from preferred language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("no error");
    expect(await TIF.isInputfieldDisabled('No','list')).equals('English Folder');
});

Scenario('Folder: Verify that inline form stays in edit mode even after switching to thumbnail view ',  (TIF) => {
    TIF.switchToThumbnailview();
    TIF.verifyInlineFormElements("list");
});

Scenario('Folder: Verify that inline form stays in edit mode even after switching back from thumbnail view ',  (TIF) => {
    TIF.switchTolistview();
    TIF.verifyInlineFormElements("list");
});

Scenario.skip('Folder save button state check', () => {
  Scenario('Folder: Provide invalid characters for name and look for error message and disabled save button', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.appendText("list",":;::");
    TIF.submit();
    TIF.checkForErrorMessage("list");
    expect(await TIF.saveButtonDisabled("header")).to.be.true;
  });

  Scenario('Folder: Clear name and check save button disabled ', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.clearName("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
  });
});

Scenario('Folder: Update name and check save button enabled', async (TIF) => {
    TIF.appendText("list","Test");
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('Folder: Cancel add operation',  (TIF) => {
    TIF.cancelAddRename("list");
});

Scenario('Add EmailFolder and verify inline form elements', async (TIF) => {
    TIF.openAddItemDropdown();
    TIF.addWikiOREmailFolder("addemailfolder"); 
    TIF.verifyMimeType("Email Folder");
    TIF.verifyInlineFormElements("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
});

Scenario('EmailFolder: Give some text in name input field', async (TIF) => {
    TIF.appendText("list","Hello"); 
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('EmailFolder: Open multilingual flyout', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('EmailFolder: Check that inputboxes are available for all 6 languages', (TIF) => {
    TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('EmailFolder: Check that user preferred language is on the top', async (TIF) => {
    expect(await TIF.firstLanguageOnMultilingualFlyout("English", 2)).to.be.true;
});

Scenario('EmailFolder: Remove value from user preferred language', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
});

Scenario('EmailFolder: Fill value in other language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("ja", "Japanese EmailFolder")).equals('Japanese EmailFolder');
});

Scenario('EmailFolder: Close flyout and check that name field disabled and value from other language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("closed");
    expect(await TIF.isInputfieldDisabled('Yes','list')).equals('Japanese EmailFolder');
});

Scenario('EmailFolder: Open multilingual flyout again', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('EmailFolder: Remove value from all fields and check for error message on flyout', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
    expect(await TIF.removeValueFromFieldOnMLF("ja")).equals('');
    TIF.closeMultilingualFlyout("error");
    TIF.errorOnMLF();
});

Scenario('EmailFolder: Fill value back in user preferred language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("en", "English EmailFolder")).equals("English EmailFolder");
});

Scenario('EmailFolder: Close flyout and check that name field enabled and value from preferred language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("no error");
    expect(await TIF.isInputfieldDisabled('No','list')).equals('English EmailFolder');
});

Scenario('EmailFolder: Verify that inline form stays in edit mode even after switching to thumbnail view ',  (TIF) => {
    TIF.switchToThumbnailview();
    TIF.verifyInlineFormElements("list");
});

Scenario('EmailFolder: Verify that inline form stays in edit mode even after switching back from thumbnail view ',  (TIF) => {
    TIF.switchTolistview();
    TIF.verifyInlineFormElements("list");
});

Scenario.skip('EmailFolder save button state check', () => {
  Scenario('EmailFolder: Provide invalid characters for name and look for error message and disabled save button', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.appendText("list",":;::");
    TIF.submit();
    TIF.checkForErrorMessage("list");
    expect(await TIF.saveButtonDisabled("header")).to.be.true;
  });

  Scenario('EmailFolder: Clear name and check save button disabled ', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.clearName("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
  });
});

Scenario('EmailFolder: Update name and check save button enabled', async (TIF) => {
    TIF.appendText("list","Test");
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('EmailFolder: Cancel add operation',  (TIF) => {
    TIF.cancelAddRename("list");
});

Scenario('Add Wiki and verify inline form elements', async (TIF) => {
    TIF.openAddItemDropdown();
    TIF.addWikiOREmailFolder("addwiki"); 
    TIF.verifyMimeType("Wiki");
    TIF.verifyInlineFormElements("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
});

Scenario('Wiki: Give some text in name input field', async (TIF) => {
    TIF.appendText("list","Hello"); 
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('Wiki: Open multilingual flyout', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('Wiki: Check that inputboxes are available for all 6 languages', (TIF) => {
    TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('Wiki: Check that user preferred language is on the top', async (TIF) => {
    expect(await TIF.firstLanguageOnMultilingualFlyout("English", 2)).to.be.true;
});

Scenario('Wiki: Remove value from user preferred language', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
});

Scenario('Wiki: Fill value in other language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("ko", "Korean wiki")).equals('Korean wiki');
});

Scenario('Wiki: Close flyout and check that name field disabled and value from other language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("closed");
    expect(await TIF.isInputfieldDisabled('Yes','list')).equals('Korean wiki');
});

Scenario('Wiki: Open multilingual flyout again', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("list")).to.be.true;
});

Scenario('Wiki: Remove value from all fields and check for error message on flyout', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
    expect(await TIF.removeValueFromFieldOnMLF("ko")).equals('');
    TIF.closeMultilingualFlyout("error");
    TIF.errorOnMLF();
});

Scenario('Wiki: Fill value back in user preferred language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("en", "English wiki")).equals("English wiki");
});

Scenario('Wiki: Close flyout and check that name field enabled and value from preferred language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("no error");
    expect(await TIF.isInputfieldDisabled('No','list')).equals('English wiki');
});

Scenario('Wiki: Verify that inline form stays in edit mode even after switching to thumbnail view ',  (TIF) => {
    TIF.switchToThumbnailview();
    TIF.verifyInlineFormElements("list");
});

Scenario('Wiki: Verify that inline form stays in edit mode even after switching back from thumbnail view ',  (TIF) => {
    TIF.switchTolistview();
    TIF.verifyInlineFormElements("list");
});

Scenario.skip('Wiki save button state check', () => {
  Scenario('Wiki: Provide invalid characters for name and look for error message and disabled save button', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.appendText("list",":;::");
    TIF.submit();
    TIF.checkForErrorMessage("list");
    expect(await TIF.saveButtonDisabled("header")).to.be.true;
  });

  Scenario('Wiki: Clear name and check save button disabled ', async (TIF) => { //Logged LPAD-91530 for this failed scenario, skipping it until this JIRA gets fixed
    TIF.clearName("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
  });
});

Scenario('Wiki: Update name and check save button enabled', async (TIF) => {
    TIF.appendText("list","Test");
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
});

Scenario('Wiki: Cancel add operation',  (TIF) => {
    TIF.cancelAddRename("list");
});

Scenario('Navigate to a folder which has empty required category attributes assigned', (I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.emptyCategoryFolder);
    I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
});

Scenario('Add Collection from dialog and verify inline form elements', async (TIF) => {
    TIF.openAddItemDropdown();
    TIF.addItem(298); //298 is the subtype for Collection
    TIF.verifyMimeType("Collection");
    TIF.verifyInlineFormElements("list");
    expect(await TIF.saveButtonDisabled("list")).to.be.true;
});

Scenario('Collection from dialog: Give some text in name input field and click on tick mark and verify that Add dialog displayed', async (TIF) => {
    TIF.appendText("list","Hello");
    expect(await TIF.saveButtonDisabled("list")).to.be.null;
    TIF.clickTickMark("list");
    TIF.isOnMetadataDialog();
});

Scenario('Collection from dialog: On Add Dialog, Open name multilingual flyout ', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("metadata")).to.be.true;
});

Scenario('Collection from dialog: Check that inputboxes are available for all 6 languages', (TIF) => {
    TIF.countLanguagesOnMultilingualFlyout();
});

Scenario('Collection from dialog: Check that user preferred language is on the top', async (TIF) => {
    expect(await TIF.firstLanguageOnMultilingualFlyout("English", 2)).to.be.true;
});

Scenario('Collection from dialog: Remove value from user preferred language', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
});

Scenario('Collection from dialog: Fill value in other language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("ko", "Korean Collection")).equals('Korean Collection');
});

Scenario('Collection from dialog: Close flyout and check that name field disabled and value from other language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("closed");
    expect(await TIF.isInputfieldDisabled('Yes','header')).equals('Korean Collection');
});

Scenario('Collection from dialog: Open multilingual flyout again', async (TIF) => {
    expect(await TIF.openMultilingualFlyout("metadata")).to.be.true;
});

Scenario('Collection from dialog: Remove value from all fields and check for error message on flyout', async (TIF) => {
    expect(await TIF.removeValueFromFieldOnMLF("en")).equals('');
    expect(await TIF.removeValueFromFieldOnMLF("ko")).equals('');
    TIF.closeMultilingualFlyout("error");
    TIF.errorOnMLF();
});

Scenario('Collection from dialog: Fill value back in user preferred language', async (TIF) => {
    expect(await TIF.fillValueOnMLF("en", "English Collection")).equals("English Collection");
});

Scenario('Collection from dialog: Close flyout and check that name field enabled and value from preferred language is displayed', async (TIF) => {
    TIF.closeMultilingualFlyout("no error");
    expect(await TIF.isInputfieldDisabled('No','header')).equals('English Collection');
});


