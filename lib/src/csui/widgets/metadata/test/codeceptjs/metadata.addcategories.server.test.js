/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



 const chai = require('chai')
 const expect = chai.expect;
 const Data = require('./data.js');
 
 Feature('Metadata Page Live Server add categories Test cases');
 
 BeforeSuite((I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
    I.ensureNotInAccesibilityMode();
 });

 Scenario('Go to properties page of document',(MD, Data) => {
    MD.openPropertiesOfDocument(Data.docName);
 }).injectDependencies({ Data: require('./data.js') });
 
 Scenario('Add all attribute category:', async (I, MD) => {
     I.say("Delete all the categories existing category.");
     await MD.deleteCategory();
     let categoryToAdd = "All Attributes";
     await MD.addCategory(categoryToAdd);
     let getCategoryList = await I.grabTextFrom(".tab-links .binf-nav.binf-nav-pills>li");
     expect(getCategoryList[getCategoryList.length - 1] == categoryToAdd).to.be.true;
 });
 
 Scenario('Checks for Text popup:', async (I) => {
     I.say("Verify Text pop up field: 'Select value' should be present by default");
     let defaultValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .btn-container");
     expect(defaultValue == "Select value").to.be.true;
     I.say("Verify the edit icon presence for the pop up");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .cs-field-read .icon-container");
 });
 
 Scenario('Checks for text pop up dropdown menu:', async (I) => {
     I.say("Click to open the dropdown.");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-dropdown-menu");
     I.say("Verify the default option selected as 'None'");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-btn-default");
     I.say("Click on the caret icon and verify the menu is closed.");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-btn-default .cs-icon");
     I.dontSeeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-dropdown-menu");
 });
 
 Scenario('Checks for text selection from menu:', async (I) => {
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-btn-default .cs-icon");
     let dropdownList = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-dropdown-menu>li");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-btn-default .cs-icon");
     I.say("Select every items on the list and verify the text popup value");
     let i = 1;
     while (i <= dropdownList.length) {
         I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-btn-default .cs-icon");
         I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-dropdown-menu");
         let listElement = ".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-dropdown-menu>li:nth-of-type(" + i + ") .cs-label";
         let value = await I.grabTextFrom(listElement);
         I.click(listElement);
         let selectedValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-btn-default .cs-label");
         I.dontSeeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(6) .binf-dropdown-menu");
         expect(value == selectedValue).to.be.true;
         i++;
     }
 });
 
 Scenario('Checks for Text Pop up with values that contain numbers, letters and symbols:', async (I) => {
     I.say("Verify Text pop up field with numbers symbols and letters");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-dropdown-menu");
     let dropdownList = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-dropdown-menu>li");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-btn-default .cs-icon");
     I.say("Select every items on the list and verify the text popup value");
     let i = 1;
     while (i <= dropdownList.length) {
         I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-btn-default .cs-icon");
         I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-dropdown-menu");
         let listElement = ".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-dropdown-menu>li:nth-of-type(" + i + ") .cs-label";
         let value = await I.grabTextFrom(listElement);
         I.click(listElement);
         let selectedValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-btn-default .cs-label");
         I.dontSeeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(1) .binf-dropdown-menu");
         expect(value == selectedValue).to.be.true;
         i++;
     }
 });
 
 Scenario('Checks for Text field with 32 characters', async (I) => {
     I.say("Verify Text field is Empty and 'Add text' is present");
     let textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .btn-container");
     expect(textPresent == "Add text").to.be.true;
     I.say("Verify the edit icon presence for the field");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-read .icon-container");
 });
 
 Scenario('Checks for editing the text field', async (I) => {
     I.say("Click to open the edit field");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-write-inner");
     I.say("Fill text field with 32 characters");
     let text = "A field with 32 characters only.";
     I.fillField(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-write-inner", text);
     I.pressKey("Enter");
     I.say("Verify the entered text in field");
     textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .btn-container");
     expect(textPresent == text).to.be.true;
 });
 
 Scenario('Checks for Text field with no more than 32 characters allowed', async (I) => {
     I.say("Click to open the edit field");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-write-inner");
     I.say("Fill text field with more 32 characters");
     let text = "A field with 32 characters only." + "32";
     I.fillField(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .cs-field-write-inner", text);
     I.pressKey("Enter");
     I.say("Verify the entered text in field");
     textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(2) .btn-container");
     expect(textPresent == text).not.to.be.true;
 });
 
 Scenario('Checks for Text multiline ', async (I) => {
     I.say("Verify Text multiline field is Empty and 'Add text' is present");
     let textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .btn-container");
     expect(textPresent == "Add text").to.be.true;
     I.say("Verify the edit icon presence for the field");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .cs-field-read .icon-container");
 
 });
 
 Scenario('Checks for filiing the text multiline field', async (I) => {
     I.say("Click to open the edit field");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .cs-field-write-inner");
     I.say("Fill text field with 32 characters");
     let text = "This is First Line.\n And we also have second line aswell before third line.\nWe added third line recently.";
     I.fillField(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .cs-field-write-inner", text);
     I.say("Click outside and save");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .binf-control-label ");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .edit-cancel");
     I.say("Verify the entered text in field");
     textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(4) .btn-container .cs-field-textarea-data");
     expect(textPresent == text).to.be.true;
 });
 
 Scenario('Checks for flag', async (I) => {
     I.say("Verify flag is in off state");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(5) .binf-switch.binf-switch-on");
     I.say("Turn on the boolean field");
     I.click(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(5) .binf-switch.binf-switch-on");
     I.dontSeeElementInDOM(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(5) .binf-switch.binf-switch-on");
     I.seeElement(".last-tab-panel .cs-form .cs-form-rightcolumn .alpaca-container-item:nth-of-type(5) .binf-switch.binf-switch-off");
 });
 
 Scenario('Checks for Date Field', async (I) => {
     I.say("Verify default date field with 'Add date'");
     let defaultValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .btn-container");
     expect(defaultValue == "Add date").to.be.true;
     I.say("Verify the edit icon presence for the pop up");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .cs-field-read .icon-container");
     I.say("Click to open the dropdown.");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .cs-field-write-inner");
     I.say("Verify the date picker option is present");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .cs-field-write-inner .icon-date_picker");
 });
 
 Scenario('Select date from the datepicker', async (I) => {
     I.say("Click and open the date picker menu");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .cs-field-write-inner .icon-date_picker");
     I.say("Close the date picker");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .cs-field-write-inner .icon-date_picker");
     I.pressKey("Enter");
     I.say("Vreify the date selected as todays date");
     let dateValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(1) .btn-container");
     let today = new Date();
     let month = today.getMonth() + 1;
     if (month < 10)
         month = "0" + month;
     let day = today.getDate();
     if (day < 10)
         day = "0" + day;
     let date = month + '/' + day + '/' + today.getFullYear();
     expect(dateValue == date).to.be.true;
 });
 
 Scenario('Checks for Date popup:', async (I) => {
     I.say("Verify date pop up field: 'Select value' should be present by default");
     let defaultValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .btn-container");
     expect(defaultValue == "Select value").to.be.true;
     I.say("Verify the edit icon presence for the pop up");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .cs-field-read .icon-container");
 });
 
 Scenario('Checks for date pop up dropdown menu:', async (I) => {
     I.say("Click to open the dropdown.");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-dropdown-menu");
     I.say("Verify the default option selected as 'None'");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-btn-default");
     I.say("Click on the caret icon and verify the menu is closed.");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-btn-default .cs-icon");
     I.dontSeeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-dropdown-menu");
 });
 
 Scenario('Checks for date selection from menu:', async (I) => {
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-btn-default .cs-icon");
     let dropdownList = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-dropdown-menu>li");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-btn-default .cs-icon");
     I.say("Select every items on the list and verify the date popup value");
     let i = 1;
     while (i <= dropdownList.length) {
         I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-btn-default .cs-icon");
         I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-dropdown-menu");
         let listElement = ".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-dropdown-menu>li:nth-of-type(" + i + ") .cs-label";
         let value = await I.grabTextFrom(listElement);
         I.click(listElement);
         let selectedValue = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-btn-default .cs-label");
         I.dontSeeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(2) .binf-dropdown-menu");
         expect(value == selectedValue).to.be.true;
         i++;
     }
 });
 
 Scenario('Checks for Integer field:', async (I) => {
     I.say("Verify Integer field is Empty and 'Add value' is present");
     let textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .btn-container");
     expect(textPresent == "Add value").to.be.true;
     I.say("Verify the edit icon presence for the field");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-read .icon-container");
     I.say("Click to open the edit field");
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-read .icon-container");
     I.seeElement(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-write-inner");
 });
 
 Scenario('Fill the integer field:', async (I) => {
     I.say("Fill text integer with numbers");
     let text = "12345";
     I.fillField(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-write-inner", text);
     I.pressKey("Enter");
     I.say("Verify the entered integer in field");
     textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .btn-container");
     expect(textPresent == text).to.be.true;
 });
 
 Scenario.skip('Fill the integer field with non-integer:', async (I) => {
     I.say("Fill integer field with text");
     let text = "text";
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-read .icon-container");
     I.fillField(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-write-inner", text);
     I.pressKey("Enter");
     I.say("Verify the value present in field present");
     let textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .btn-container");
     expect(textPresent == text).not.to.be.true;
     I.say("Enter integer again");
     text = "12345";
     I.click(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-read .icon-container");
     I.fillField(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .cs-field-write-inner", text);
     I.pressKey("Enter");
     I.say("Verify the entered text in field");
     textPresent = await I.grabTextFrom(".last-tab-panel .cs-form .cs-form-leftcolumn .alpaca-container-item:nth-of-type(4) .btn-container");
     expect(textPresent == text).to.be.true;
 });
 