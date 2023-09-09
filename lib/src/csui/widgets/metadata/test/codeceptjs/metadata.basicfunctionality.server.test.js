/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const Data = require('./data.js');

Feature('Metadata Page Live Server basic functionality Test cases');

BeforeSuite((I) => {
  I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
  I.ensureNotInAccesibilityMode();
});

Scenario('Go to properties page of document',(MD, Data) => {
  MD.openPropertiesOfDocument(Data.docName);
}).injectDependencies({ Data: require('./data.js') });

Scenario('Check for name dropdown menu :', async (I, MD) => {
  let menuList = ["Copy link","Edit", "Apply hold", "Assign cross-reference", "Mail as link", "View permissions", "Rename", "Download", "Reserve", "Copy", "Move", "Add version", "Delete",
  "Collect", "Add reminder"];
  I.say("Verifying the dropdown menu");
  I.seeElement(".csui-metadata-item-name-dropdown");
  I.click(".csui-metadata-item-name-dropdown");
  I.waitMaxTimeForElement(".csui-metadata-item-name-dropdown .binf-dropdown>ul>li>a.csui-toolitem");
  I.seeElement(".csui-metadata-item-name-dropdown .binf-dropdown>ul>li>a.csui-toolitem");
  I.say("Wait for non-promoted actions to load");
  I.wait(1);
  I.say("Click on the caret icon and verify the dropdown menu.");
  let dropdownList = await I.grabAttributeFrom(".csui-metadata-item-name-dropdown .binf-dropdown>ul>li>a.csui-toolitem",'innerText');
  expect(await MD.checkList(dropdownList, menuList)).to.be.true;
  I.say("Click on the caret icon and verify the dropdown menu is closed.");
  I.click(".csui-metadata-item-name-dropdown");
  I.dontSeeElement(".csui-metadata-item-name-dropdown .binf-dropdown>ul");
});

Scenario('Check for sticky header and switch through all categories:', async (I) => {
  I.say("Verify the sticky header is present");
  I.seeElement(".tab-links .binf-nav.binf-nav-pills");
  let getCategoryList = await I.grabTextFrom(".tab-links .binf-nav.binf-nav-pills>li");
  I.click(".tab-links .binf-nav.binf-nav-pills>li:nth-of-type(1)");
  expect((getCategoryList.length > 0) && (getCategoryList[0] == "General")).to.be.true;
});

Scenario('Check "Only required fields" switch should not be displayed :', async (I) => {
  I.say("Verify 'Only required field' switch will not be present");
  I.seeElementInDOM(".required-field-switch.binf-hidden");
});

Scenario('Adding one new Required category :', async (I, MD) => {
  I.say("Delete if any category exist.");
  await MD.deleteCategory();
  I.say("Add one new required category");
  let categoryAdded = await MD.addRequiredCategory();
  let getCategoryList = await I.grabTextFrom(".tab-links .binf-nav.binf-nav-pills>li");
  I.say("Verify added required category presence");
  expect(getCategoryList[getCategoryList.length - 1] == categoryAdded).to.be.true;
});

Scenario('Check "Only required fields" switch should be present as mandatory category is configured :', async (I) => {
  I.say("Verify 'Only required fields' switch will be present");
  I.dontSeeElementInDOM(".required-field-switch.binf-hidden");
});

Scenario('Turning on Only required fields switch :', async (I, MD) => {
  I.say("Turn on the required field switch");
  let allCategory = await I.grabTextFrom(".tab-links .binf-nav.binf-nav-pills>li .cs-tablink");
  MD.turnOnOnlyRequiredFields();
  I.say("Verify only the required cateogries are being displayed in the category header");
  let hiddenCategory = await I.grabTextFrom(".tab-links-bar .binf-hidden.hidden-by-switch .cs-tablink");
  expect(allCategory.length - 1 == hiddenCategory.length).to.be.true;
});

Scenario('Turning off Only required fields switch :', async (I, MD) => {
  I.say("Turn off the 'Only required field' switch");
  MD.turnOffOnlyRequiredFields();
  I.say("Verify all the categories should be displayed.");
  I.dontSeeElement(".tab-links-bar .binf-hidden.hidden-by-switch .cs-tablink");
});

Scenario('Delete category and Check "Only required fields" switch should not be displayed :', async (I, MD) => {
  I.say("Delete the added category");
  await MD.deleteCategory();
  I.say("Verify the required field switch should not be present");
  I.seeElementInDOM(".required-field-switch.binf-hidden");
});

Scenario('Check for Properties dropdown menu :', async (I, MD) => {
  I.say("Verify the properties tab dropdown menu is present");
  I.seeElement(".cs-tab-links");
  I.seeElement(".cs-metadata-item-name .csui-icon-group");
  I.say("Verify the default option to be 'Properties'");
  let defaultOption = await I.grabTextFrom(".cs-tab-links.binf-dropdown .binf-btn-default .cs-label");
  expect(defaultOption == "Properties").to.be.true;
  let menuList = ["Properties", "Versions", "Audit", "Business Objects", "Workflows", "Holds", "Rendition", "Cross-references"];
  I.say("Click and open the dropdown menu");
  I.click(".cs-tab-links.binf-dropdown .binf-btn-default .cs-label");
  I.waitMaxTimeForElement(".cs-tab-links.binf-dropdown >ul>li");
  I.say("Verify the dropdown menu list");
  let dropdownList = await I.grabTextFrom(".cs-tab-links.binf-dropdown >ul>li");
  expect(await MD.checkList(dropdownList, menuList)).to.be.true;
  I.say("Click agin on the dropdown menu and verify the menu is closed");
  I.click(".cs-tab-links.binf-dropdown .binf-btn-default .cs-label");
  I.dontSeeElement(".cs-tab-links.binf-dropdown >ul");
});






