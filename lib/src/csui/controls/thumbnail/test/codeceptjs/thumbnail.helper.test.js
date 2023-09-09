/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

const { rename } = require("fs-extra");
module.exports = function () {
  return actor({

    async setFocusToThumbnailItem() {
      this.waitMaxTimeForElement('.csui-thumbnail-item');
      await this.executeScript(() => document.getElementsByClassName('csui-thumbnail-item')[0].focus());
      let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
      return check.indexOf('csui-thumbnail-item') >= 0;
    },

    async navigateToThumbnailView() {
      this.click("li[data-csui-command='thumbnail'] > a");
      this.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a[title='Browse view']");
      let hint = await this.grabAttributeFrom(".csui-thumbnail-container", 'class');
      return hint.length > 0;
    },
    navigateToTestFolder: function() {
      this.click("a[title='Thumbnail Test']");
      this.waitMaxTimeForElement(".csui-nodetable");
      this.seeElement(".csui-nodetable",10);
    },

    async navigateToTableView() {
      this.click("li[data-csui-command='thumbnail'] > a");
      this.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a[title='Grid view']");
      let hint = await this.grabAttributeFrom(".csui-nodetable", 'class');
      return hint.length > 0;
    },

    verifyOtherActionItems: function () {
      this.say("Verifying the Favorite icon");
      this.seeElement(".csui-thumbnail-favorite");
      this.say("Verifying the OverView icon");
      this.seeElement(".csui-thumbnail-overview");
      this.say("Verifying the Node icon");
      this.seeElement(".csui-thumbnail-thumbnailIcon");
      this.say("before hover, toolbar action icon should not be displayed");
      this.dontSeeElement(".csui-thumbnail-actionbar > .csui-table-actionbar-bubble");
      this.say("before hover, select icon should not be displayed");
      this.dontSeeElement(".csui-thumbnail-item > .csui-thumbnail-select");
    },

    verifyHeader: function () {
      this.say("verifying select all button");
      this.seeElement(".csui-checkbox-selectAll");
      this.say("verifying item count");
      this.seeElement(".csui-thumbnail-itemcount");
      this.say("verifying sort options");
      this.seeElement(".csui-search-sort-options");
      this.say("verifying search icon");
      this.seeElement(".csui-thumbnail-column-search");
    },

    hoverOnItem: async function (indx) {
      this.moveCursorTo(".csui-thumbnail-item:nth-child(" + indx + ")");
      this.seeElement(".csui-thumbnail-actionbar > .csui-table-actionbar-bubble");
      this.seeElement(".csui-thumbnail-select");
      let verifySelect = await this.grabAttributeFrom('.csui-thumbnail-select', 'class');
      return verifySelect.length > 0;
    },

    async clickonInlineActions(keyEvents) {
      if (keyEvents) {
        this.pressKey(keyEvents);
      }
      else {
        this.waitMaxTimeForElement('.csui-thumbnail-actionbar .csui-table-actionbar-bubble');
        this.moveCursorTo('.csui-thumbnail-actionbar .csui-table-actionbar-bubble');
        this.click(".csui-thumbnail-actionbar .csui-table-actionbar-bubble");
      }
      this.waitMaxTimeForElement(".csui-table-actionbar-bubble .binf-open");
      this.seeElement(".csui-table-actionbar-bubble .binf-open");
      let checkInlineActions = await this.grabAttributeFrom('.csui-table-actionbar-bubble .binf-open', 'class');
      return checkInlineActions.length > 0;
    },

    closeInlineActions(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.moveCursorTo('.csui-thumbnail-header');
    },

    async selectNode() {
      this.moveCursorTo('.csui-thumbnail-item:nth-child(1)');
      this.checkOption('.selectAction');
      this.waitMaxTimeForElement(".csui-table-rowselection-toolbar-visible");
      this.seeElement(".csui-table-rowselection-toolbar-visible");
      let checkToolbarAction = await this.grabAttributeFrom('.csui-table-rowselection-toolbar-visible', 'class');
      return checkToolbarAction.length > 0;
    },

    unselectNode() {
      this.uncheckOption(".selectAction:nth-child(1)");
      this.waitForInvisible('.csui-selected-items-counter-region',5);
      this.seeElement('.csui-nodestable .csui-tabletoolbar');
      this.dontSeeElement(".csui-table-rowselection-toolbar-visible");
      this.dontSeeElement('.csui-selected-items-counter-region');
    },

    async clickOnFavoriteIcon(keyEvents) {
      keyEvents ? this.pressKey(keyEvents) : this.click(".csui-favorite-star-view-container:nth-child(1)");
      this.seeElement(".binf-popover-content .favorite-name-label");
      let checkPopover = await this.grabAttributeFrom('.binf-popover-content .favorite-name-label', 'class');
      return checkPopover.length > 0;
    },

    closeFavoritePopover(keyEvents) {
      if(keyEvents){
        this.wait(1);
        this.pressKey(keyEvents)
      }
      else{
        this.click(".binf-popover-content .cancel-btn");
      }
      this.waitForInvisible('.binf-popover-content .favorite-name-label');
    },

    async clickOnOverviewIcon(keyEvents,index) {
      index= index || 1;
      keyEvents ? this.pressKey(keyEvents) : this.click(`.csui-thumbnail-item:nth-child(${index}) .csui-thumbnail-overview-container`);
      this.waitMaxTimeForElement(".binf-popover-content .csui-overview-container");
      this.seeElement(".binf-popover-content .csui-overview-container");
      let checkPopover = await this.grabAttributeFrom('.binf-popover-content .csui-overview-container', 'class');
      return checkPopover.length > 0;
    },

    selectSort: function(name,order) {
      this.seeElement(`span[data-sortbyid ='${order}']`);
      this.click(`span[data-sortbyid ='${order}']`);
      this.seeTextEquals(name, ".csui-search-sort-options > .binf-btn > .cs-label");
      this.seeElement(".csui-sort-arrow.icon-sortArrowUp");
    },

    verifySortArrow: function() {
      this.click(".csui-sort-arrow.icon-sortArrowUp");
      this.wait(3);
      this.seeElement(".csui-sort-arrow.icon-sortArrowDown");
    },

    verifySortSelected: function(order) {
      this.click(".csui-search-sort-options");
      this.seeElement(".csui-search-sort-options.binf-open");
      this.seeElement(`.icon-listview-checkmark + span[data-sortbyid ='${order}']`);
    },

    rename : async function(index){
      this.hoverOnItem(index);
      let name = await this.grabAttributeFrom(`.csui-thumbnail-item:nth-child(${index}) .csui-thumbnail-name-value`, 'title');
      this.clickonInlineActions();
      this.seeElement(".binf-dropdown-menu li[data-csui-command='inlineedit']");
      this.click(".binf-dropdown-menu li[data-csui-command='inlineedit']");
      this.waitMaxTimeForElement('.csui-inline-editform ');
      let nameInInlineForm = await this.grabAttributeFrom('.csui-inline-editform .csui-inlineform-type-name[type="text"]', 'value');
      return nameInInlineForm === name;
    },   

    modifyText : async function(){
      this.appendField('.csui-inlineform-type-name', 'appended');
      this.seeCssPropertiesOnElements('.csui-btn-save', { 'color': "#232e72"});
      let checkInlineForm = await this.grabAttributeFrom('.csui-inline-editform', 'class');
      return checkInlineForm.length > 0;
    },

    verifyNewValue : async function(val) {
      let newValue = await this.grabAttributeFrom('.csui-thumbnail-item:nth-child(2) .csui-thumbnail-name-value', 'title');
      return newValue === val;
    },
    
    enteronSeletedName : async function(keyEvents) {
      this.pressKey(keyEvents);
      let verifyformstare = await this.grabAttributeFrom('.csui-inline-editform', 'class');
       return verifyformstare.length > 0;
    },

    clickCancel : function(){
      this.click('.csui-inline-action-button-wrapper .csui-btn-cancel');
      this.waitForDetached('.csui-inline-editform');
      this.dontSeeElement('.csui-inline-editform');
    },

    async clickOnAddItem () {
      this.click(".csui-addToolbar .binf-dropdown-toggle");
      this.waitMaxTimeForElement(".csui-addToolbar .binf-dropdown.binf-open");
      this.seeElement(".csui-addToolbar .binf-dropdown.binf-open");
      let dropdown = await this.grabAttributeFrom('.csui-addToolbar .binf-dropdown.binf-open', 'class');
      return dropdown.length > 0;
    },

    async addItem (type) {
      this.click(`li[data-csui-addtype='${type}'] > a`);
      this.waitMaxTimeForElement(".csui-new-thumbnail-item");
      this.seeElement(".csui-new-thumbnail-item");
      this.seeElement(".csui-inlineform-field-container");
      let element = await this.grabAttributeFrom('.csui-new-thumbnail-item .csui-inlineform-field-container', 'class');
      return element.length > 0;
    },

    async newTableItem () {
      this.seeElement(".csui-new-item");
      this.seeElement(".csui-inlineform-field-container");
      let element = await this.grabAttributeFrom('.csui-new-item .csui-inlineform-field-container', 'class');
      return element.length > 0;
    },

    async newThumbnailItem () {
      this.seeElement(".csui-new-thumbnail-item");
      this.seeElement(".csui-inlineform-field-container");
      let element = await this.grabAttributeFrom('.csui-new-thumbnail-item .csui-inlineform-field-container', 'class');
      return element.length > 0;
    },
  });
}