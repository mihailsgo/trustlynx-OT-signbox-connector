/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


module.exports = function () {
  return actor({

    async checkSearchDropDownClosed(config) {
      this.waitForElement(".csui-search-box .csui-input");
      this.seeElement(".csui-search-input-container .csui-input");
      let hint = await this.grabAttributeFrom('.csui-search-options-dropdown', 'class');
      return hint.indexOf('binf-hidden') >= 0;
    },

    async checkSearchDropDown(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-search-input-container .csui-input");
      this.waitMaxTimeForElement(".csui-search-options-dropdown");
      this.seeElement(".csui-search-options-dropdown");
      this.seeElement(".csui-searchbox-slices-wrapper");
      this.seeElement(".csui-searchbox-searchform-wrapper");
      let hint = await this.grabAttributeFrom('.csui-search-options-dropdown', 'class');
      return hint.indexOf('binf-hidden') === -1;
    },

    async selectSlices(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-search-slice-container .csui-search-popover-row:nth-child(1)");
      this.seeElement(".icon-listview-checkmark");
      let hint = await this.grabAttributeFrom('.csui-search-popover-checked.icon-listview-checkmark', 'class');
      return hint.length > 0;
    },

    async unSelectSlices(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-search-slice-container .csui-search-popover-row:nth-child(1)");
      let hint = await this.grabAttributeFrom('.csui-search-popover-checked', 'class');
      return hint.indexOf('icon-listview-checkmark') === -1;
    },

    async expectOnly3Slices(config) {
      this.seeNumberOfVisibleElements('.csui-search-popover-row-body', 3);
      let hint = await this.grabAttributeFrom('.csui-search-popover-row-body', 'class');
      return hint.length === 3;
    },

    async showMoreSlices(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-slices-more");
      let hint1 = await this.grabAttributeFrom('.csui-search-popover-row-body', 'class');
      return hint1.length > 3;
    },

    async openSearchFormsInSidePanel(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-searchforms-popover-row:nth-child(1)");
      this.waitMaxTimeForElement(".csui-sidepanel");
      this.wait(1);
      this.seeElement(".csui-sidepanel");
      this.waitMaxTimeForElement(".csui-side-panel-main");
      this.seeElement(".csui-side-panel-main");
      let hint = await this.grabAttributeFrom('.csui-side-panel-main', 'class');
      return hint.length > 0;
    },

    async openMoreSearchForms(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click('.csui-searchforms-show-more');
      this.waitMaxTimeForElement(".csui-sidepanel");
      this.seeElement(".csui-sidepanel");
      this.waitMaxTimeForElement(".csui-side-panel-main");
      this.seeElement(".csui-side-panel-main");
    },

    async checkSearchFormsCollections(config) {
      this.waitMaxTimeForElement(".csui-search-form-collection");
      this.seeElement(".csui-search-form-collection");
      let hint = await this.grabAttributeFrom('.csui-search-form-collection', 'class');
      return hint.length > 0;
    },

    async closeSidePanel(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click('#csui-side-panel-cancel');
      this.dontSeeElement(".csui-sidepanel");
      let hint = await this.grabAttributeFrom('.binf-widgets', 'class');
      return hint.indexOf('csui-side-panel-main') === -1;

    },

    async slicesOrSearchFormKey(keyEvents, index, query) {
      this.pressKey(keyEvents);
      let checkslices = await this.executeScript(({ query, index }) => document.querySelectorAll(query)[index].getAttribute('class'), { query, index });
      return checkslices.indexOf("active") >= 0;
    }
  });
};