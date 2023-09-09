/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


module.exports = function() {
    return actor({
      checkTitle: function() {
        this.waitMaxTimeForElement('.cs-recentlyaccessed .tile-header');
        this.seeTextEquals('Recently Accessed','.cs-recentlyaccessed .tile-header .csui-heading')
      },

      copyLink: function() {
        this.click("tbody .csui-table-cell-_select  .csui-checkbox-view .csui-checkbox:nth-child(1)");
        this.waitMaxTimeForElement('.csui-toolbar-region [data-csui-command="copylink"]');
        this.click('.csui-toolbar-region [data-csui-command="copylink"]');
        this.waitMaxTimeForElement(".csui-messagepanel.csui-success");
        this.seeElement(".csui-messagepanel.csui-success");
      },

      hoverOnRecentlyAccessedWidget: function () {
        this.scrollTo('.csui-perspective-view .cs-recentlyaccessed');
        this.moveCursorTo('.csui-perspective-view .cs-recentlyaccessed .tile-header');
      },

      verifysRecentlyAccessedWidgetIconsForMock: function () {
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .icon.title-recentlyaccessed');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-icons .cs-search-button[title="Search"]');
        this.seeElement('.cs-recentlyaccessed .tile-expand');
      },

      verifysRecentlyAccessedWidgetIcons: function () {
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .icon.title-recentlyaccessed');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-icons .cs-search-button[title="Search"]');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-icons .cs-open-perspective-button[title="Open recently accessed view"]');
      },

      hoverOnListItem : function(index) {
        this.seeElement(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(" + index + ")");
        this.moveCursorTo(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(" + index + ")");
      },

      validateMoreActionsIcon : function (keyEvents) {
        this.waitMaxTimeForElement(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(1) .csui-menu-btn");
        this.seeElement(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(1) .csui-menu-btn");
        keyEvents ? this.pressKey(keyEvents) : this.click(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(1) .csui-menu-btn");
        this.waitMaxTimeForElement(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='copylink']");
        this.seeElement(".csui-perspective-view .cs-recentlyaccessed .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='copylink']");
      },

      validateSearchButton: async function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-view .cs-recentlyaccessed .tile-icons [title="Search"]');
        this.waitMaxTimeForElement('.csui-perspective-view .cs-recentlyaccessed .tile-controls.search-enabled');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-controls.search-enabled');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-controls.search-enabled .icon-search-placeholder');
        this.say('Check tooltip for input field');
        let inputFieldTooltip = await this.grabAttributeFrom('.csui-perspective-view .cs-recentlyaccessed .tile-controls .search','title');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .cs-search-close-button');
        let closeSearchTooltip = await this.grabAttributeFrom('.csui-perspective-view .cs-recentlyaccessed .cs-search-close-button','title');
        return inputFieldTooltip == "Search Recently Accessed" && closeSearchTooltip == "Close search";
      },

      validateSearchInputField : async function () {
        this.wait(1);
        this.fillField('.csui-perspective-view .cs-recentlyaccessed .tile-controls .search','a');
        this.waitMaxTimeForElement('.csui-perspective-view .cs-recentlyaccessed .search-enabled .clearer[title="Clear"]');
        this.seeElement('.csui-perspective-view .cs-recentlyaccessed .search-enabled .clearer[title="Clear"]');
        let resultList = await this.grabAttributeFrom('.csui-perspective-view .cs-recentlyaccessed .tile-content .binf-list-group-item','class');
        if( resultList.length == 0) {
          this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-content .cs-emptylist-text');
        }
        else if( resultList.length > 0) {
          this.dontSeeElement('.csui-perspective-view .cs-recentlyaccessed .tile-content .cs-emptylist-text');
          this.seeElement('.csui-perspective-view .cs-recentlyaccessed .tile-content .binf-list-group-item:nth-child(1)');
        }
      },

      checkClearSearchButton : function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-view .cs-recentlyaccessed .clearer[title="Clear"]');
        this.dontSeeElement('.csui-perspective-view .cs-recentlyaccessed .clearer[title="Clear"]');
      },

      checkCloseSearchButton : function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-view .cs-recentlyaccessed .search-enabled .cs-search-close-button');
        this.waitForDetached('.csui-perspective-view .cs-recentlyaccessed .tile-controls.search-enabled .search');
        this.dontSeeElement('.csui-perspective-view .cs-recentlyaccessed .tile-controls .search');
      },

      validateRecentlyAccessedView : function () {
        this.seeInCurrentUrl('/recentlyaccessed');
        this.waitMaxTimeForElement('.title-recentlyaccessed');
        this.seeElement('.title-recentlyaccessed');
      },

      toggleSelectAll: function (keyEvents) {
        this.seeElement('.csui-table-cell-_select .csui-checkbox[title="Select all items"]');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-table-cell-_select .csui-checkbox[title="Select all items"]');
      },

      checkToolbar: function () {
        this.seeElement('.csui-rowselection-toolbar.csui-rowselection-toolbar-visible');
      },

      hoverOnExpandedViewRACTItem: function() {
        this.seeElement('.binf-table .csui-saved-item:nth-child(1)');
        this.moveCursorTo('.binf-table .csui-saved-item:nth-child(1)');
        this.wait(1);
      },

      checkInlineActions: function () {
        this.seeElement('.csui-table-cell-name-appendix .csui-toolitem[title="Properties"]');
        this.seeElement('.csui-table-cell-name-appendix .binf-dropdown-toggle');
        this.click('.csui-table-cell-name-appendix .binf-dropdown-toggle');
        this.seeElement('.csui-table-cell-name-appendix .binf-dropdown-menu .csui-toolitem');
      },

      clickOnSearchInExpandedView: function (keyEvents) {
        this.seeElement('.csui-table-search-icon');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-table-search-icon');
        this.wait(1);
      },

      validateSearchInputExpandedView:async function () {
        this.seeElement('.csui-table-searchbox .csui-table-search-input');
        this.fillField('.csui-table-searchbox .csui-table-search-input','b');
        let searchResults = await this.grabAttributeFrom('.binf-table','class');
        if( searchResults.indexOf("csui-table-empty") < 0 ){
          this.seeElement('.binf-table .csui-saved-item:nth-child(1)');
        }
        else {
          this.seeElement('.binf-table .csui-no-result-message');
        }
      },

      checkClearSearchInExpanded: function (keyEvents) {
        this.seeElement('.csui-table-searchbox .formfield_clear');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-table-searchbox .formfield_clear');
        this.dontSeeElement('.csui-table-searchbox .formfield_clear');
      },

      setFocusOnRecentlyAccessedWidget:async function () {
        this.wait(1);
        await this.executeScript(() => document.getElementsByClassName('cs-search-button')[0].focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('cs-search-button') >= 0;
      },

      setFocusOnSelectAll:async function () {
        this.wait(1);
        await this.executeScript(() => document.getElementsByClassName('csui-control csui-checkbox')[0].focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('csui-control') >= 0;
      },

      checkNameSearchOpen: async function () {
        let searchIconTitle = await this.grabAttributeFrom('.csui-table-column-search .csui-table-search-icon','title');
        if(searchIconTitle === "Close search"){
          this.click('.csui-table-column-search .csui-table-search-icon');
        }
        this.waitMaxTimeForElement('.csui-table-column-search .csui-table-search-icon[title="Search in Name"]');
        this.seeElement('.csui-table-column-search .csui-table-search-icon[title="Search in Name"]');
      }
    });
  };