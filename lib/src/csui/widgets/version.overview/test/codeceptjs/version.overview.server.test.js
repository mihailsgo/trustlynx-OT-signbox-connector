/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const Data = require('./data.js');

Feature('Document overview page for versions Live server test cased');

BeforeSuite((VO) => {
    VO.openVersionOverviewPage('CONTENT_SERVER', Data.documentId, Data.versionNumber);
});

Scenario('Open version dropdown menu', (I) => {
    I.seeElement('.csui-metadata-item-name-dropdown .binf-btn');
    I.click('.csui-metadata-item-name-dropdown .binf-btn');
    I.waitMaxTimeForElement('.cs-dropdown-menu .binf-dropdown.binf-open');
    I.seeElement('.cs-dropdown-menu .binf-dropdown.binf-open');
});

Scenario('Verify actions for the version',async (VO) => {
    expect(await VO.verifyActions()).to.be.true;
});

Scenario('Close version dropdown menu', (I) => {
    I.seeElement('.csui-metadata-item-name-dropdown .binf-btn');
    I.click('.csui-metadata-item-name-dropdown .binf-btn');
    I.dontSeeElement('.cs-dropdown-menu .binf-dropdown.binf-open');
});

Scenario('Validate version label', (I) => {
    I.seeElement('.overview-page-version-label .csui-overview-version-label');
});

Scenario('Verify version thumbnail and tooltip', (I) => {
    I.seeElement('.thumbnail_section.metadata-preview.preview-section[title="Open"]');
    I.seeElement('.thumbnail_section .img-doc-preview');
});