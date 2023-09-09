/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



 const serverDetails =  require('../../../../../codeceptjs/cs.server.config.js');
 module.exports = function() {
    return actor({
      openVersionOverviewPage: function (config, docId, versionNumber) {
        this.amOnPage(`${serverDetails[config].url}/nodes/`+ docId+ '/versions/'+ versionNumber);
        this.fillField('User name', serverDetails[config].userId);
        this.fillField('Password', serverDetails[config].password);
        this.click('Sign in');
        this.wait(10); 
        this.waitMaxTimeForElement(".cs-version-overview-wrapper .cs-content-container");
        this.seeElement(".cs-version-overview-wrapper .cs-content-container");
      },

      verifyActions:async function() {
          this.seeElement('.csui-metadata-item-name-dropdown .binf-dropdown-menu li');
          let expectedActions = ['Properties', 'Download', 'Delete'];
          let versionActions = await this.grabAttributeFrom('.csui-metadata-item-name-dropdown .binf-dropdown-menu li a','innerText');
          this.say(versionActions);
          return JSON.stringify(expectedActions) === JSON.stringify(versionActions);
      }
    });
  };