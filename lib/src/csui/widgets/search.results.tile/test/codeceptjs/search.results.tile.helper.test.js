/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 module.exports = function() {
  return actor({
    checkTitle: function(config) {
      this.see("Search Query Results");
    },

    hoverOnHeader: function () {
      this.waitMaxTimeForElement(".tile-header");
      this.moveCursorTo(".tile-header");
      this.waitMaxTimeForElement(".cs-search-button");
    },

    verifyHeaderIcons: function () {
      this.waitMaxTimeForElement(".cs-search-button");
      this.seeElement(".cs-search-button");
      this.waitMaxTimeForElement(".cs-open-perspective-button");
      this.seeElement(".cs-open-perspective-button");
      this.waitMaxTimeForElement(".title-icon.title-customviewsearch");
      this.seeElement(".title-icon.title-customviewsearch");
    },

    clickSearchOnWidget: function () {
      this.waitMaxTimeForElement(".cs-search-button");
      this.seeElement(".cs-search-button");
      this.click(".cs-search-button");
    },

    closeSearchOnWidget: function() {
      this.waitMaxTimeForElement('.cs-search-close-button[title="Close search"]');
      this.seeElement('.cs-search-close-button[title="Close search"]');
      this.click('.cs-search-close-button[title="Close search"]');
      this.waitForDetached('.tile-header .search-enabled');
      this.dontSeeElement('.tile-header .search-enabled');
    },

    enterValidSearchKeyOnWidget : async function(key){
      this.waitMaxTimeForElement(".search-box .search");
      this.seeElement(".search-box .search");
      this.wait(3);
      this.fillField('.search-box .search',key);
      this.wait(5);
      this.waitMaxTimeForElement(".csui-item-standard.binf-list-group-item");
      this.seeElement(".csui-item-standard.binf-list-group-item");
      let numOfResults = await this.grabNumberOfVisibleElements('.csui-item-standard.binf-list-group-item');
      this.say("search results for search key "+key +" are "+numOfResults);
      return numOfResults > 0;
    },

    enterInValidSearchKeyOnWidget : async function(key){
      this.waitMaxTimeForElement(".search-box .search");
      this.seeElement(".search-box .search");
      this.wait(3);
      this.fillField('.search-box .search',key);
      this.wait(5);
      this.waitMaxTimeForElement('.csui-no-result-message');
      this.seeElement(".csui-no-result-message");
      this.seeTextEquals("There are no items to display.",'.csui-no-result-message');
      let numOfResults = await this.grabNumberOfVisibleElements('.csui-item-standard.binf-list-group-item');
      this.say("search results for search key "+key +" are "+numOfResults);
      return numOfResults > 0;
    },

    VerifyExpandOption: function() {
      this.waitMaxTimeForElement(".cs-open-perspective-button");
      this.seeElement(".cs-open-perspective-button");
      this.click(".cs-open-perspective-button");
      this.waitMaxTimeForElement(".csui-setting-icon");
      this.seeElement(".csui-setting-icon");
      this.waitMaxTimeForElement(".cs-back-button-container");
      this.seeElement(".cs-back-button-container");
      this.click(".cs-back-button-container");
      this.waitMaxTimeForElement("[data-csui-widget_type='search.results.tile']");
      this.seeElement("[data-csui-widget_type='search.results.tile']");
    },

      hoverOnItem: async function (indx) {
        this.moveCursorTo(".csui-item-standard:nth-child(" + indx + ")");
        this.waitMaxTimeForElement(".csui-inline-menu > .csui-menu-btn");
        this.seeElement(".csui-inline-menu > .csui-menu-btn");
        let verifySelect = await this.grabAttributeFrom('.csui-menu-btn', 'class');
        return verifySelect.length > 0;
      },

      async clickonInlineActions(keyEvents) {
        if (keyEvents) {
          this.pressKey(keyEvents);
        }
        else {
          this.waitMaxTimeForElement('.csui-inline-menu > .csui-menu-btn');
          this.seeElement('.csui-inline-menu > .csui-menu-btn');
          this.moveCursorTo('.csui-inline-menu > .csui-menu-btn');
          this.click(".csui-inline-menu > .csui-menu-btn");
        }
        this.waitMaxTimeForElement(".csui-table-actionbar");
        this.seeElement(".csui-table-actionbar");
        let checkInlineActions = await this.grabAttributeFrom('.csui-table-actionbar', 'class');
        return checkInlineActions.length > 0;
      },

      closeInlineActions(keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.moveCursorTo('.tile-header .csui-heading');
        this.waitForDetached(".csui-table-actionbar");
        this.dontSeeElement(".csui-table-actionbar");
      },

    });
  };