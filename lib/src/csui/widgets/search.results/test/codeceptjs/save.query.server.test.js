/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 const chai = require('chai')
 const expect = chai.expect;

 Feature('Save and Update Search Query Live Server Test Cases');
 Scenario('Login to Server:', (I) => {
    I.loginTo('CONTENT_SERVER');
    I.ensureNotInAccesibilityMode();
    I.waitMaxTimeForElement(".icon-global-search");
    I.seeElement(".icon-global-search");
});

Scenario('Validate Global search Icon', (I) => {
    I.waitMaxTimeForElement(".icon-global-search");
    I.seeElement(".icon-global-search");
});

Scenario('Validate icons on Search box:', (I,SQ) => {
    I.click(".icon-global-search");
    SQ.validateSearchBoxIcons('*');
});

Scenario('Validate start search', (I,SQ) => {
    I.click("[title='Start search']");
    SQ.verifyHeader();
});

Scenario('Validate save as button', (I) => {
    I.waitMaxTimeForElement('.csui-query-save');
    I.seeElement('.csui-query-save');
    I.click('.csui-query-save');
    I.waitMaxTimeForElement('.binf-modal-content');
    I.seeElement('.binf-modal-content');
});

Scenario('Validate Save search dialog', (SQ) => {
    SQ.verifySaveSearchDialog();
});

Scenario('Enter search query name', (I) => { 
    I.seeElement('.binf-widgets .csui-filtername');
    I.fillField('.binf-widgets .csui-filtername','TestExamplesearch');
    I.seeElement('.target-browse .cs-folder-name .cs-icon');
});

Scenario('Open Search Box to search for location', (I) => {
    I.click('.target-browse .cs-folder-name .cs-icon');
    I.waitMaxTimeForElement('.cs-modal-filter .cs-filter-input');
    I.seeElement('.cs-modal-filter .cs-filter-input');   
});

Scenario('Enter location', (I) => { 
    I.fillField('.cs-modal-filter .cs-filter-input',"SaveSearchAutomation");
    I.waitMaxTimeForElement('.cs-list .csui-item-standard.binf-list-group-item');
    I.seeElement('.cs-list .csui-item-standard.binf-list-group-item');
});

Scenario('Select location', (SQ) => { 
    SQ.selectLocation();
});

Scenario('Perform save operation',(I) => {
    I.click('.cs-add-button');
    I.waitMaxTimeForElement('.csui-global-message.position-show');
    I.seeElement('.csui-global-message.position-show');
});

Scenario('Validate Banner message and Navigate',(SQ) => { 
    SQ.validateAndNavigate();
});

Scenario('Clicking on saved search query to perform Search', (I) => { 
    I.click(".csui-table-cell-name-value[aria-label='TestExamplesearch']");
    I.waitMaxTimeForElement('.csui-search-header');
    I.seeElement('.csui-search-header');
});

Scenario('Change search term',async (I) => {
    I.seeElement('.csui-field-text[data-alpaca-container-item-name="FullText_value1"] input');
    I.click('.csui-field-text[data-alpaca-container-item-name="FullText_value1"] input');
    I.waitMaxTimeForElement('.csui-field-text[data-alpaca-container-item-name="FullText_value1"] input');
    I.fillField('.csui-field-text[data-alpaca-container-item-name="FullText_value1"] input',"test");
    expect(await I.checkFocusOnElement('.csui-field-text[data-alpaca-container-item-name="FullText_value1"] input')).to.be.true;
});

Scenario('Perform updated search',(I) => {
    I.pressKey('Enter');
    I.waitMaxTimeForElement('.csui-segemented-save-tools .csui-segmented-update-button');
    I.seeElement('.csui-segemented-save-tools .csui-segmented-update-button');
});

Scenario('Update the query',(SQ) => {
    SQ.updateQuery();
});

Scenario('navigate back to folder', (SQ) => {
    SQ.backToTableView();
});

Scenario('Select saved query', (SQ) => {
    SQ.selectToDeleteQuery();
});

Scenario('Delete saved query', (SQ) => {
    SQ.clickDeleteQuery();
});

Scenario('Confirm Delete', (SQ) => {
    SQ.deleteDialog();
});

