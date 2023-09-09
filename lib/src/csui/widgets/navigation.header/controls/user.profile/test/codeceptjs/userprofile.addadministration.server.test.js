/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 const chai = require('chai')
 const expect = chai.expect;
 
 Feature('Simple User profile Page Live Server basic functionality Test cases');
 
 BeforeSuite((I) => {
   I.loginTo('CS_DEV_INT');
 });
 
 Scenario('Open Administration for profile dropdown menu for Admin user in landing page:', async (I) => {
   I.say("Open profile dropdown mennu.");
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Admin user");
   I.seeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
   I.say("Open 'Administration'");
   I.click(".csui-profile li[data-csui-command='contentserveradministration'] > a");
   I.wait(5);
   I.say("Login to the classic view");
   I.switchToNextTab();
   I.fillField('input[id=otds_username]', 'admin');
   I.fillField('input[id=otds_password]', 'livelink');
   I.click('Sign in');
   I.wait(2);
   I.say("Verify the opened URL");
   let url = await I.grabCurrentUrl();
   let administrationURL = "http://cssmartviewqa01.otxlab.net/alpha/cs.exe?func=admin.index";
   expect(url == administrationURL).to.be.true;
   I.say("Close the current tab");
   I.closeCurrentTab();
 });
 
 Scenario('Check Administration option in nodestable :', (I) => {
   I.navigateToTestFolder('CS_DEV_INT', '345143');
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Admin user");
   I.seeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 Scenario('Check Administration option in metadata page for Admin:', (I) => {
   I.navigateToTestFolder('CS_DEV_INT', '415574/metadata');
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Admin user");
   I.seeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 Scenario('Check Administration option in doc overview page for Admin:', (I) => {
   I.navigateToTestFolder('CS_DEV_INT', '414804');
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Admin user");
   I.seeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 Scenario('Open Administration for profile dropdown menu for Non-Admin user in landing page:', (I) => {
   I.navigateToTestFolder('CS_DEV_INT_KRISTEN', '');
   I.say("Open profile dropdown mennu.");
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Non-Admin user");
   I.dontSeeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 Scenario('Check Administration option in nodestable for Non-Admin :', (I) => {
   I.navigateToTestFolder('CS_DEV_INT_KRISTEN', '345143');
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Non-Admin user");
   I.dontSeeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 Scenario('Check Administration option in metadata page for Non-Admin:', (I) => {
   I.navigateToTestFolder('CS_DEV_INT_KRISTEN', '415574/metadata');
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Non-Admin user");
   I.dontSeeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 Scenario('Check Administration option in doc overview page for Non-Admin:', (I) => {
   I.navigateToTestFolder('CS_DEV_INT_KRISTEN', '414804');
   I.click(".csui-navbar img.csui-profile-image");
   I.say("Check for 'Administration' option for Non-Admin user");
   I.dontSeeElement(".csui-profile li[data-csui-command='contentserveradministration'] > a");
 });
 
 