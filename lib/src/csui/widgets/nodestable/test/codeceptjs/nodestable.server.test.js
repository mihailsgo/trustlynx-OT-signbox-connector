/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 const chai = require('chai')
 const expect = chai.expect;
 const outputSettings = {
    ignoreAreasColoredWith: { r: 250, g: 250, b: 250, a: 0 },
 };
 
 require('events').EventEmitter.prototype._maxListeners = 100;
 
 Feature('Nodestable Widget Server Test cases');
 
 BeforeSuite((I) => {
    I.navigateToEnterprise('CONTENT_SERVER');
    I.ensureNotInAccesibilityMode();
    I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
    I.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a");
    I.seeElement("li[data-csui-command='thumbnail'] > a");
});

Scenario('verifying header', (NT) => {
    NT.verifyHeader();
});

 Scenario('Open facet panel', (NT) => {
    NT.openFacetPanel();
 });

 Scenario('Navigate to child folder and verify facet panel is open', (I, NT) => {
    NT.navigateToChildFolder();
    I.seeElement('.csui-table-facetview .csui-facet-panel');
 });

 Scenario('Hide facet panel', (NT) => {
    NT.hideFacetPanel();
 });

 Scenario('Navigate back to parent folder and verify facet panel is hidden', (I, NT) => {
    NT.navigateToParentFolder();
    I.dontSeeElement('.csui-table-facetview .csui-facet-panel');
 });