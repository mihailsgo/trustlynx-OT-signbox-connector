/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

const { rename } = require("fs-extra");
module.exports = function () {
  return actor({
    verifyHeader: function () {
      this.say("verifying select all button");
      this.seeElement(".csui-table-cell-_select.sorting_disabled");
      this.say("verifying item count");
      this.seeElement(".csui-total-container-items");
      this.say("verifying search icon");
      this.seeElement(".csui-table-search-icon");
    },

    openFacetPanel: function (keyEvents) {
      this.dontSeeElement('.csui-table-facetview .csui-facet-panel');
      this.seeElement('li[data-csui-command="filter"]');
      keyEvents ? this.pressKey(keyEvents) : this.click('li[data-csui-command="filter"]');
      this.waitMaxTimeForElement('.csui-table-facetview .csui-facet-panel');
      this.seeElement('.csui-table-facetview .csui-facet-panel');
    },

    hideFacetPanel: function (keyEvents) {
      this.seeElement('.csui-table-facetview .csui-facet-panel');
      this.seeElement('li[data-csui-command="filter"]');
      keyEvents ? this.pressKey(keyEvents) : this.click('li[data-csui-command="filter"]');
      this.dontSeeElement('.csui-table-facetview .csui-facet-panel');
    },

    navigateToChildFolder: function () {
      this.click('.binf-table .csui-table-cell-name-value:nth-child(1)');
      this.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
      this.waitMaxTimeForElement(".csui-nodestable");
      this.seeElement(".csui-nodestable");
    },

    navigateToParentFolder: function () {
      this.click('.binf-breadcrumb .csui-breadcrumb:nth-child(1)');
      this.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
      this.waitMaxTimeForElement(".csui-nodestable");
      this.seeElement(".csui-nodestable");
    }

  });
}