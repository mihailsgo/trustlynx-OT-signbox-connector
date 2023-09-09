/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


module.exports = function () {
  return actor({
    validateSearchBoxIcons(searchText) {
      this.waitMaxTimeForElement(".csui-search-input-container .csui-input");
      this.seeElement(".csui-search-input-container .csui-input");
      this.fillField('.csui-search-input-container .csui-input', searchText);
      this.waitMaxTimeForElement('.csui-clearer[title="Clear keywords"]');
      this.seeElement('.csui-clearer[title="Clear keywords"]');
      this.waitMaxTimeForElement(".csui-formfield-search[title='Start search']");
      this.seeElement(".csui-formfield-search[title='Start search']");
    },
    verifyHeader: function () {
      this.waitMaxTimeForElement('.csui-setting-icon');
      this.seeElement('.csui-icon-v2__csui_action_filter32');
      this.seeElement('.csui-setting-icon');
      this.seeElement('.cs-go-back');
      this.seeElement('.csui-results-title');
      this.seeElement('#headerCount');
      this.seeElement('.csui-icon-v2__csui_action_table_tabular32');   
    },
    validateFilterIcon: function () {
      this.seeElement('.csui-icon-v2__csui_action_filter32');
      this.click('.csui-icon-v2__csui_action_filter32');
      this.seeElement('.csui-icon-v2-on.csui-icon-v2__csui_action_filter32');
      this.seeElement('.cs-title');
      this.seeElement('.cs-list-group .csui-facet-header [title="Creation Date"]');
      this.seeElement('.cs-icon.csui-button-icon.icon-expandArrowUp');
      this.seeElement('.csui-facet-content');
      this.click('.cs-list-group .csui-facet-header [title="Creation Date"]');
      this.seeElement('.cs-icon.csui-button-icon.icon-expandArrowDown');
      this.dontSeeElement('.cs-facet-content');
      this.click('.cs-list-group .csui-facet-header [title="Creation Date"]');
    },
    validateCloseSearchButton: function () {
      this.waitMaxTimeForElement(".icon-global-search[title='Close search']");
      this.seeElement(".icon-global-search[title='Close search']");
      this.click(".icon-global-search[title='Close search']");
      this.waitMaxTimeForElement(".icon-global-search");
      this.seeElement(".icon-global-search");
    },
    async validateFacet(facetIndx, keyEvents){
      this.seeElement(".csui-facet:nth-child(" + facetIndx + ") .csui-filter-more");
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-facet:nth-child(" + facetIndx + ") .csui-filter-more");
      for(let i=1;i<=5;i++){
        keyEvents ? this.pressKey(keyEvents) : this.click(".csui-facet:nth-child(" + facetIndx + ") .csui-facet-item:nth-child(" + i + ") .csui-checkbox");
      }
      let status = await this.grabAttributeFrom(".csui-checkbox",'disabled');
      let filterSelectCount = await this.grabAttributeFrom(".csui-facet:nth-child(" + facetIndx + ") .header-count",'innerText');
      this.seeElement(".csui-facet:nth-child(" + facetIndx + ") .csui-btn.binf-btn.binf-btn-secondary.csui-clear");
      this.click(".csui-facet:nth-child(" + facetIndx + ") .csui-btn.binf-btn.binf-btn-secondary.csui-clear");
      return status.length > 0 && filterSelectCount == 5;
    },
    applyFilter:async function(keyEvents){
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-facet:nth-child(" + 1 + ") .csui-facet-item:nth-child(" + 1 + ") .csui-checkbox");
      this.seeElement('.csui-facet:nth-child(1) .csui-btn.binf-btn.binf-btn-primary.csui-apply');
      this.click('.csui-facet:nth-child(1) .csui-btn.binf-btn.binf-btn-primary.csui-apply');
      this.say('Check whether filter is applied');
      this.waitMaxTimeForElement('.csui-facet-bar');
      this.dontSeeElement('.cs-list-group .csui-facet-header [title="Creation Date"]');
      this.seeElement('#facetbarview .csui-facet-bar');
      this.seeElement("#facetbarview .csui-facet-bar .csui-facet-item:nth-child(1)");
      this.seeElement('#facetbarview .csui-facet-bar .csui-clear-all');
      this.click('#facetbarview .csui-facet-bar .csui-clear-all');
      this.waitMaxTimeForElement('.cs-list-group .csui-facet-header [title="Creation Date"]');
      this.seeElement('.cs-list-group .csui-facet-header [title="Creation Date"]');
    },
    selectNode(indx, keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".binf-list-group-item:nth-child(" + indx + ") .csui-checkbox");
      this.seeElement(".csui-selected-count.csui-acc-tab-region");
    },
    unselectNode(indx, keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".binf-list-group-item:nth-child(" + indx + ") .csui-checkbox");
    },
    selectAll(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-control.csui-checkbox");
      this.seeElement(".csui-search-tool-container");
    },
    unselectAll(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-control.csui-checkbox");
    },
    validateExpandCollapse(keyEvents){
      this.see('Expand all');
      this.seeElement("[title='Expand all']");
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-search-header-expand-all");
      this.see('Collapse all');
      this.seeElement("[title='Collapse all']");
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-search-header-expand-all");
      this.see('Expand all');
      this.seeElement("[title='Expand all']");
    },
    async validateItemCount(){
      this.seeElement('.headerCount');
      let count = await this.grabAttributeFrom('.headerCount', 'innerText');
      this.seeElement('.csui-total-container-items');
      let footerCount= await this.grabAttributeFrom('.csui-total-container-items','innerText');
      var header = count.split(" ");
      var footer = footerCount.split(" ");
      return header[1]===footer[1];
    },
    clickOnColumnSettings: function () {
      this.waitMaxTimeForElement("#search-setting-wrapper .csui-settings-option[title='Column settings']");
      this.seeElement("#search-setting-wrapper .csui-settings-option[title='Column settings']");
      this.click("#search-setting-wrapper .csui-settings-option[title='Column settings']");
      this.waitMaxTimeForElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".csui-settings-container .selected-columns-container.csui-settings-show .add-button");
    },
    columnSettingsOption: async function () {
      this.clickOnColumnSettings();
      this.say('Delete current column settings');
      let slice = await this.grabAttributeFrom('.selected-columns-container.csui-settings-show .column-item','class');
      let length=slice.length;
      for( let i=1;i<=length;i++) {
        this.moveCursorTo(".selected-columns-container.csui-settings-show .column-item:nth-child(" + i + ")");
        if(i<=2){
          this.dontSeeElement(".selected-columns-container.csui-settings-show .column-item:nth-child(" + i + ") .remove-button.icon.circle_delete");
        }
        else{
          this.seeElement(".selected-columns-container.csui-settings-show .column-item:nth-child(" + i + ") .remove-button.icon.circle_delete");
          this.click(".selected-columns-container.csui-settings-show .column-item:nth-child(" + i + ") .remove-button.icon.circle_delete");
          i--;
          length--;
        }
      }
      this.say('Check whether settings changed');
      this.seeElement(".csui-search-header-title");
      this.click(".csui-search-header-title");
      this.waitForDetached('.csui-settings-container');
      this.dontSeeElement('.csui-settings-container');
      this.dontSeeElement('.csui-breadcrumb.csui-acc-focusable');
      this.dontSeeElement('.csui-search-metadata[title="Date"]');
      this.dontSeeElement('.csui-search-metadata[title="Size"]');
      this.waitMaxTimeForElement(".csui-search-header .csui-setting-icon");
      this.seeElement('.csui-search-header .csui-setting-icon');
      this.say('Add column settings again with add icon');
      this.click('.csui-search-header .csui-setting-icon');
      this.clickOnColumnSettings();
      this.click(".csui-settings-container .selected-columns-container.csui-settings-show .add-button");
      this.waitMaxTimeForElement(".selected-columns-container.csui-settings-show .column-title");
      this.seeElement(".selected-columns-container.csui-settings-show .column-title");
      this.seeElement('.column-item-container[title="Date"]');
      this.click('.column-item-container[title="Date"]');
      this.seeElement('.column-item-container[title="Size"]');
      this.click('.column-item-container[title="Size"]');
      this.seeElement('.column-item-container[title="Category"]');
      this.click('.column-item-container[title="Category"]');
      this.seeElement(".csui-search-header-title");
      this.click(".csui-search-header-title");
      this.waitForDetached('.csui-settings-container');
      this.dontSeeElement(".csui-settings-dropdown .settings-dropdown-container");
      this.seeElement('.csui-breadcrumb.csui-acc-focusable');
      this.seeElement('.csui-search-metadata[title="Size"]');
      this.seeElement('.csui-search-metadata[title="Date"]');
    },
    summaryDescriptionSettingsOption: function () {
      this.waitMaxTimeForElement("#search-setting-wrapper .csui-settings-option[title='Summary / description']");
      this.seeElement("#search-setting-wrapper .csui-settings-option[title='Summary / description']");
      this.click("#search-setting-wrapper .csui-settings-option[title='Summary / description']");
      this.waitMaxTimeForElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".csui-settings-container .column-header .arrow_back");
      this.seeElement(".icon-listview-checkmark.selected");
      this.seeElement(".summary-description-container.csui-settings-show [title='Descriptions only']");
      this.click(".summary-description-container.csui-settings-show [title='Descriptions only']");
      this.click(".csui-settings-container .column-header .arrow_back");
      this.say("clicking outside to close the dropdown");
      this.click(".csui-search-header-title-container #resultsTitle");
      this.say("verify that settings dropdown is closed");
      this.dontSeeElement(".csui-settings-dropdown .settings-dropdown-container");
      this.say("Description is visible");
      this.seeElement('.csui-search-item-row:nth-child(1) .csui-search-item-desc');
    },
    validateSearchInTestFolder: async function () {
      this.seeElement('.csui-search-options-dropdown .csui-searchbox-option.selected');
      this.click('.csui-search-options-dropdown .csui-searchbox-option.selected');
      this.dontSeeElement('.csui-search-options-dropdown .csui-searchbox-option.selected');
      this.click('.csui-search-options-dropdown .csui-searchbox-option');
      this.seeElement('.csui-search-options-dropdown .csui-search-label');
      let slice = await this.grabAttributeFrom('.csui-search-options-dropdown .csui-search-popover-row','class');
      let length=slice.length;
      this.say(length);
      let i=1;
      for( i = 1; i <= length; i++){
        this.click(".csui-search-options-dropdown .csui-search-popover-row:nth-child(" + i + ")");
        this.seeElement('.csui-search-options-dropdown .csui-search-popover-checked.icon-listview-checkmark');
        this.click(".csui-search-options-dropdown .csui-search-popover-row:nth-child(" + i + ")");
        this.seeElement('.csui-search-options-dropdown .csui-search-popover-checked');
      }
      return i == length+1;
    },
    validateSelectAllButton:async function (keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-control.csui-checkbox");
      this.seeElement(".csui-search-tool-container");
      this.seeElement('.csui-pagesize-menu .binf-dropdown-toggle');
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-pagesize-menu .binf-dropdown-toggle");
      this.waitMaxTimeForElement('a[data-pagesize="25"]');
      keyEvents ? this.pressKey(keyEvents) : this.click("a[data-pagesize='25']");
      this.waitMaxTimeForElement('.csui-pager .csui-dropdown');
      this.seeElement('#selectAllCheckBox [title="Select all results on current page."]');
      let ariaLabel=await this.grabAttributeFrom('#selectAllCheckBox [title="Select all results on current page."]','aria-checked');
      let selectedCount= await this.grabAttributeFrom('.binf-badge.binf-badge-light.csui-selected-counter-value','innerText');
      this.say(ariaLabel);
      this.say(selectedCount);
      var count = parseInt( selectedCount );
      return ariaLabel == "true" && count <= 10;
    },
    checkSortByOptions: async function () {
      this.waitMaxTimeForElement('.csui-search-sorting .binf-dropdown-toggle');
      this.seeElement('.csui-search-sorting .binf-dropdown-toggle');
      let sortByOption = await this.grabAttributeFrom('.csui-search-sorting .binf-dropdown-toggle','title');
      this.seeElement('.csui-search-sort-options .cs-icon.icon-caret-down');
      this.click('.csui-search-sorting .binf-dropdown-toggle');
      this.waitMaxTimeForElement('.csui-search-sort-options .binf-dropdown-menu');
      this.seeElement('.csui-search-sort-options .binf-dropdown-menu');
      return sortByOption;
    },
    changeSortOption: async function () {
      this.seeElement('.csui-search-sort-options [role="presentation"] .csui-sort-option [title="Date "]');
      this.click('.csui-search-sort-options [role="presentation"] .csui-sort-option [title="Date "]');
      this.waitMaxTimeForElement('.cs-icon.search-sort-btn.icon-sortArrowDown');
      this.seeElement('.cs-icon.search-sort-btn.icon-sortArrowDown');
      let title=await this.grabAttributeFrom('.cs-icon.search-sort-btn.icon-sortArrowDown','title');
      return title;
    },
    async verifyFacetFilterCount(facetIndx, keyEvents){
      this.seeElement(".csui-facet:nth-child(" + facetIndx + ")");
      let filters =await this.grabAttributeFrom(".csui-facet:nth-child(" + facetIndx + ") .csui-facet-item","class");
      let filterLength = filters.length;
      for(let i=1; i <= filterLength; i++){
        this.dontSeeElement(".csui-facet:nth-child(" + facetIndx + ") .csui-facet-item:nth-child(" + i + ") .csui-filter-name .csui-total");
      }
    },
    verifyCategoryColumn : function () {
      this.seeElement('.csui-result-list .binf-list-group-item');
      this.seeElement('.csui-result-list .binf-list-group-item .csui-search-metadata[title="Category"]');
    },
    verifyCategoryMultiValue : async function () {
      this.seeElement('.csui-result-list .binf-list-group-item .csui-search-metadata[title="Category"]');
      let multiValue = await this.grabAttributeFrom('.csui-result-list .binf-list-group-item .csui-search-item-details:nth-child(3) .csui-count','innerText');
      let count = parseInt( multiValue[0].substring(1) );
      this.say('Number of categories = '+ (count + 1));
      let firstValue = await this.grabAttributeFrom('.csui-result-list .binf-list-group-item .csui-search-item-details:nth-child(3) .searchDetails','innerText');
      this.say('First multi value = ' + firstValue[0]);
      let tooltip = firstValue[0] + ' and ' + count + ' more';
      let title = await this.grabAttributeFrom('.csui-result-list .binf-list-group-item .csui-search-item-details:nth-child(3) .csui-search-metadata-value','title');
      this.say(tooltip + ' must be equal to '+ title[0]);
      return tooltip == title[0];
    },
    openCategoryListPopover : function () {
      this.seeElement('.csui-result-list .binf-list-group-item .csui-search-item-details:nth-child(3) .csui-count');
      this.click('.csui-result-list .binf-list-group-item .csui-search-item-details:nth-child(3) .csui-count');
      this.waitMaxTimeForElement('.binf-popover-content .csui-category-collection');
      this.seeElement('.binf-popover-content .csui-category-collection');
    },
    checkCategoryPopoverCount : async function () {
      let popoverList = await this.grabAttributeFrom('.binf-popover-content .csui-category-collection .csui-category-item','class');
      let popoverCount = popoverList.length;
      let multiValue = await this.grabAttributeFrom('.csui-result-list .binf-list-group-item .csui-search-item-details:nth-child(3) .csui-count','innerText');
      let actualCount = parseInt( multiValue[0].substring(1) ) + 1;
      return popoverCount == actualCount;
    },
    verifyUpDownArrowsInPopover : async function () {
      this.say('Initially focus must be on first category value');
      let expectedFocus = true;
      let tabIndex = await this.grabAttributeFrom('.binf-popover-content .csui-category-collection .csui-category-item:nth-child(1) .csui-category-value','tabindex');
      if (tabIndex != 0) {
        expectedFocus = false;
        return expectedFocus;
      }
      this.say('Press down arrows and check focus');
      let popoverList = await this.grabAttributeFrom('.binf-popover-content .csui-category-collection .csui-category-item','class');
      let count = popoverList.length;
      for (let i = 2; i <= count; i++){
        this.pressKey('ArrowDown');
        tabIndex = await this.grabAttributeFrom('.binf-popover-content .csui-category-collection .csui-category-item:nth-child('+ i +') .csui-category-value','tabindex');
        if (tabIndex != 0) {
          expectedFocus = false;
          return expectedFocus;
        }
      }
      this.say('Press up arrows and check focus');
      for (let i = count; i >= 1; i--){
        tabIndex = await this.grabAttributeFrom('.binf-popover-content .csui-category-collection .csui-category-item:nth-child('+ i +') .csui-category-value','tabindex');
        if (tabIndex != 0) {
          expectedFocus = false;
          return expectedFocus;
        }
        this.pressKey('ArrowUp');
      }
      return expectedFocus;
    },
    verifyEscapeOnPopover : function () {
      this.pressKey('Escape');
      this.dontSeeElement('.binf-popover-content .csui-category-collection');
    },
    verifyCategoryMultiValueTable : async function () {
      this.seeElement('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-categories-text');
      let multiValue = await this.grabAttributeFrom('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-categories-text .csui-count','innerText');
      let count = parseInt( multiValue[0].substring(1) );
      this.say('Number of categories = '+ (count + 1));
      let firstValue = await this.grabAttributeFrom('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-categories-title','innerText');
      this.say('First multi value = ' + firstValue[0]);
      let tooltip = firstValue[0] + ' and ' + count + ' more';
      let title = await this.grabAttributeFrom('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-category','title');
      this.say(tooltip + ' must be equal to '+ title);
      return title.indexOf(tooltip)>0;
    },
    openCategoryListPopoverTableView : function () {
      this.seeElement('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-categories-text .csui-count');
      this.click('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-categories-text .csui-count');
      this.waitMaxTimeForElement('.binf-popover-content .csui-category-collection');
      this.seeElement('.binf-popover-content .csui-category-collection');
    },
    checkCategoryPopoverCountTableView : async function () {
      let popoverList = await this.grabAttributeFrom('.binf-popover-content .csui-category-collection .csui-category-item','class');
      let popoverCount = popoverList.length;
      let multiValue = await this.grabAttributeFrom('.csui-perfect-scrolling .csui-saved-item .csui-table-cell-categories-text .csui-count','innerText');
      let actualCount = parseInt( multiValue[0].substring(1) ) + 1;
      return popoverCount == actualCount;
    },
    clickOutsideToClosePopover : function () {
      this.click(".csui-search-header-title-container #resultsTitle");
      this.dontSeeElement('.binf-popover-content .csui-category-collection');
    }
  });
}