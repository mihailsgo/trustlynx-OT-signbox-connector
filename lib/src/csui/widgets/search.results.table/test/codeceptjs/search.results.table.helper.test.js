/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

const { rename } = require("fs-extra");
module.exports = function () {
  return actor({


    VerifyExpandOption: function () {
      this.waitMaxTimeForElement(".cs-open-perspective-button");
      this.seeElement(".cs-open-perspective-button");
      this.click(".cs-open-perspective-button");
      this.waitMaxTimeForElement(".csui-setting-icon");
      this.seeElement(".csui-setting-icon");
      this.seeElement(".cs-back-button-container");
    },

    verifyHeader: function () {
      this.waitMaxTimeForElement(".title-icon.title-customviewsearch");
      this.seeElement('.title-icon.title-customviewsearch');
      this.see("Search Query Results");
      this.seeElement('.csui-setting-icon');
      this.seeElement('.cs-go-back');
      this.say("verifying select all button");
      this.seeElement(".csui-checkbox.csui-focusable-table-column-header");
    },

    async verifyTableIsLoaded() {
      this.seeElement('.csui-expandedtable .binf-table');
      this.say('Checking results');
      this.seeElement('.csui-has-details-row');
      var items = await this.grabAttributeFrom('.csui-has-details-row');
      return items.length > 0;
    },

    hoverOnItem: async function (indx) {
      this.moveCursorTo(".csui-saved-item:nth-child(" + indx + ")");
      this.seeElement(".csui-table-actionbar");
    },

    closeInlineActions(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.moveCursorTo('.csui-search-results-table-view');
      this.waitForDetached(".csui-table-actionbar");
      this.dontSeeElement(".csui-table-actionbar");
    },

    async selectNode(indx, keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-saved-item:nth-child(" + indx + ") .csui-checkbox");
      this.seeElement(".csui-rowselection-toolbar-visible");
      let checkToolbarAction = await this.grabAttributeFrom('.csui-rowselection-toolbar-visible', 'class');
      return checkToolbarAction.length > 0;
    },

    async unselectNode(indx, keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-saved-item:nth-child(" + indx + ") .csui-checkbox");
    },

    async selectAll(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-checkbox.csui-focusable-table-column-header");
      this.waitMaxTimeForElement(".csui-rowselection-toolbar-visible");
      this.seeElement(".csui-rowselection-toolbar-visible");
      let checkToolbarAction = await this.grabAttributeFrom('.csui-rowselection-toolbar-visible', 'class');
      return checkToolbarAction.length > 0;
    },

    async unselectAll(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-checkbox.csui-focusable-table-column-header");
    },

    verifyPaginationView: function () {
      this.say('I see total item count');
      this.seeElement('.csui-total-container-items');
      this.say('I see page size');
      this.seeElement('.csui-pager .csui-pageSize');
      this.say('I see pagination nav bar');
      this.seeElement('.csui-pagination .csui-paging-navbar .binf-nav');
    },

    verifyPaginationMenu: async function (keyEvents) {
      this.dontSeeElement('.csui-pager .csui-dropdown.binf-open')
      keyEvents ? this.pressKey(keyEvents) : this.click('.csui-pager .binf-dropdown-toggle');
      this.waitMaxTimeForElement('.csui-pager .csui-dropdown.binf-open');
      this.seeElement('.csui-pager .csui-dropdown.binf-open');
      var paginationMenu = await this.grabAttributeFrom('.csui-pager .csui-dropdown .binf-dropdown-menu', 'class');
      return paginationMenu.length > 0;
    },

    changePageSize: async function (keyEvents) {
      var pageSize = await this.grabAttributeFrom('.csui-pager .csui-pageSize', 'innerText');
      keyEvents ? this.pressKey(keyEvents) : this.click("a[data-pagesize='25']");
      this.waitMaxTimeForElement('.csui-pager .csui-dropdown');
      var pageSize1 = await this.grabAttributeFrom('.csui-pager .csui-pageSize', 'innerText');
      return pageSize === pageSize1;
    },

    async setFocusToPaginationDropdown() {
      await this.executeScript(() => document.getElementsByClassName('binf-dropdown-toggle')[1].focus());
      let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
      return check.indexOf('binf-dropdown-toggle') >= 0;
    },

    async setFocusToSelectAll() {
      await this.executeScript(() => document.querySelector('.csui-checkbox.csui-focusable-table-column-header').focus());
      let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
      return check.indexOf('csui-checkbox') >= 0;
    },

    searchSettingsOptions: async function () {
      this.waitMaxTimeForElement(".csui-setting-icon");
      this.seeElement('.csui-setting-icon');
      this.click('.csui-setting-icon');
      this.waitMaxTimeForElement("[title='Column settings']");
      this.seeElement("[title='Column settings']");
      this.seeElement("[title='Summary / description']");
    },

    columnSettingsOption: async function () {
      this.waitMaxTimeForElement("[title='Column settings']");
      this.seeElement("[title='Column settings']");
      this.click("[title='Column settings']");
      this.waitMaxTimeForElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".add-button");
      this.click(".csui-settings-container .column-header .arrow_back");
      this.say("verify if setting dropdown is displayed");
      this.seeElement("[title='Column settings']");
      this.seeElement("[title='Summary / description']");

    },
    summaryDescriptionSettingsOption: async function () {
      this.waitMaxTimeForElement("[title='Summary / description']");
      this.seeElement("[title='Summary / description']");
      this.click("[title='Summary / description']");
      this.waitMaxTimeForElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".icon-listview-checkmark.selected");
      this.click(".csui-settings-container .column-header .arrow_back");
      this.say("clicking outside to close the dropdown")
      this.click(".csui-total-container-items");
      this.say("verify that settings dropdown is closed");
      this.dontSeeElement(".settings-dropdown-container");
    }

  });

}