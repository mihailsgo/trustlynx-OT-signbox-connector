/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

const { rename } = require("fs-extra");
module.exports = function () {
  return actor({

    renameFromHeader: function() {
      this.waitMaxTimeForElement("h2 > button > span.csui-item-name-block");
      this.seeElement("h2 > button > span.csui-item-name-block");
      this.say("Click on item name to rename from header");
      this.click("h2 > button > span.csui-item-name-block");
      this.waitMaxTimeForElement(".csui-item-name>.csui-item-name-edit>input");
      this.seeElement(".csui-item-name>.csui-item-name-edit>input");
    },

    renameFromMenu: function() {
      this.waitMaxTimeForElement(".csui-item-title-dropdown-menu>.binf-dropdown .csui-button-icon");
      this.seeElement(".csui-item-title-dropdown-menu>.binf-dropdown .csui-button-icon");
      this.click(".csui-item-title-dropdown-menu>.binf-dropdown .csui-button-icon");
      this.click("li[data-csui-command='rename'] > a");
    },

    async getNameInReadMode() {
      this.waitMaxTimeForElement(".csui-tabletoolbar .csui-item-name-readonly");
      this.seeElement(".csui-tabletoolbar .csui-item-name-readonly");
      return (await this.grabAttributeFrom(".csui-tabletoolbar .csui-item-name-readonly", 'title'));
    },

    async verifyFocusToInputbox() {
      let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
      return (check.indexOf('title-input csui-multilingual-input') >= 0);
    },

    async verifyInlineFormElements(area) {
      this.say("Verifying the multi-lingual icon");
      this.seeElement("button.csui-multilingual-icon", 10);
      if (area == 'header') {
      this.say("Verifying the tickmark/save icon");
      this.seeElement(".csui-undo.csui-edit-save.inline-edit-icon ", 10);
      this.say("Verifying the cancel icon");
      this.seeElement(".csui-undo.csui-edit-cancel.inline-edit-icon", 10);
      } else if(area == 'list'){
      this.say("Verifying the tickmark icon");
      this.seeElement(".csui-inlineform-group .csui-btn-save", 10);
      this.say("Verifying the cancel icon");
      this.seeElement(".csui-inlineform-group .csui-btn-cancel", 10);
      }
    },

    async saveButtonDisabled(area){
      let locator;
      if (area == 'header'){
      locator = ".csui-undo.csui-edit-save.inline-edit-icon ";
      }else {
      locator = ".csui-inlineform-group .csui-btn-save";
      }
      this.say("Verifying the tickmark icon");
      this.seeElement(locator, 10);
      return (await this.grabAttributeFrom(locator, 'disabled'));
    },

    async clickTickMark(area){
      let locator;
      if (area == 'header'){
      locator = ".csui-undo.csui-edit-save.inline-edit-icon ";
      }else {
      locator = ".csui-inlineform-group .csui-btn-save";
      }
      this.seeElement(locator, 10);
      this.click(locator);
    },

    async openMultilingualFlyout(area) {
      let locator;
      if (area == 'header'){
        locator = "button.csui-multilingual-icon";
      }else if(area == 'metadata'){
        locator = ".cs-metadata-item-name .csui-multilingual-icon-label button";
      }else {
        locator = ".csui-inlineform-text-field.csui-multilingual-input .csui-multilingual-icon";
      }
      this.wait(1);
      this.waitForEnabled(locator);
      this.waitMaxTimeForElement(locator);
      this.seeElement(locator);
      this.waitForClickable(locator);
      this.say("Click on globe icon");
      this.click(locator);
      this.wait(1);
      this.say("Check for multilingual form");
      this.waitMaxTimeForElement(".csui-multilingual-input-wrapper.binf-popover .cs-multilingual-form");
      this.seeElement(".csui-multilingual-input-wrapper.binf-popover .cs-multilingual-form");
      let checkMLflyout = await this.grabAttributeFrom('.csui-multilingual-input-wrapper.binf-popover .cs-multilingual-form', 'class');
      return checkMLflyout.length > 0;
    },

    async countLanguagesOnMultilingualFlyout() {
      this.seeNumberOfVisibleElements(".cs-ml-form-container .binf-row", 7);
    },

    async firstLanguageOnMultilingualFlyout(fl, position) {
      let lang = await this.grabAttributeFrom('.cs-ml-form-container .binf-row:nth-child('+position+') > label', 'title');
      return (lang == fl);
    },

    async removeValueFromFieldOnMLF(code) {
      this.clearField('.cs-ml-form-container input#input-'+code+'');
      return ( await this.grabValueFrom('.cs-ml-form-container input#input-'+code+''));
    },

    async fillValueOnMLF(code, value) {
      this.seeElement('.cs-ml-form-container input#input-'+code+'');
      this.clearField('.cs-ml-form-container input#input-'+code+'');
      this.appendField('.cs-ml-form-container input#input-'+code+'', value);
      return (await this.grabValueFrom('.cs-ml-form-container input#input-'+code+''));
    },

    async isInputfieldDisabled(flag, area) {
      let locator,value;
      if (area == 'header'){
        locator = '.title-input.csui-multilingual-input.mlDisabled';
        value = '.title-input.csui-multilingual-input';
      } else{
        locator = '.binf-form-control.csui-inlineform-type-name.mlDisabled';
        value = '.binf-form-control.csui-inlineform-type-name';
      }

      if (flag == 'Yes'){
      this.waitMaxTimeForElement(locator);
      this.seeElement(locator);
      } else{
      this.dontSeeElement(locator)
      }
      return (await this.grabValueFrom(value));
    },

    async closeMultilingualFlyout(check) {
      this.waitMaxTimeForElement(".globe-icon-mask");
      this.seeElement(".globe-icon-mask");
      this.say("Click on globe icon");
      this.click(".globe-icon-mask");
      this.say("Check multilingual form not displayed");
      if(check == 'error'){
        this.seeElement(".csui-multilingual-input-wrapper.binf-popover .cs-multilingual-form")
        }
        else{
          this.dontSeeElement(".csui-multilingual-input-wrapper.binf-popover .cs-multilingual-form");
        }
        this.wait(1);
    },

    async errorOnMLF() {
      this.seeElement(".cs-multilingual-form .csui-text-danger");
    },

    async appendText(area, text) {
      let locator;
      if (area == 'header'){
      locator = ".csui-item-name>.csui-item-name-edit>input";
      }else {
      locator = ".csui-inlineform-text-field.csui-multilingual-input>input";
      }
      this.say("Append some text to name field");
      this.appendField(locator, text);
    },

    async submit() {
      this.pressKey('Enter');
    },

    async checkForErrorMessage(area) {
      let locator;
      if (area == 'header'){
      locator = ".csui-item-name-error";
      }else {
      locator = ".csui-inline-editform .csui-inlineform-group-error";
      }
      this.say("Look for error message");
      this.seeElement(locator); 
    },

    async clearName(area) {
      let locator;
      if (area == 'header'){
      locator = ".csui-item-name>.csui-item-name-edit>input";
      }else {
      locator = ".csui-inlineform-text-field.csui-multilingual-input>input";
      }
      this.say("Clear name field");
      this.clearField(locator);
    },

    cancelAddRename: function (area) {
      let locator;
      if (area == 'header'){
      locator = ".csui-undo.csui-edit-cancel.inline-edit-icon";
      }else {
      locator = ".csui-btn-cancel.csui-inline";
      }
      this.say("Cancel rename operation");
      this.click(locator);
      this.say("Verify name in read mode and no cancel button displayed now");
      this.dontSeeElement(locator);
    },

    switchToThumbnailview: function() {
      this.say("Click on thumbnail view icon");
      this.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a[title='Grid view']");
      this.click("li[data-csui-command='thumbnail'] > a[title='Grid view']");
      this.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a[title='Browse view']");
    },

    switchTolistview: function() {
      this.say("Click on list view icon");
      this.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a[title='Browse view']");
      this.click("li[data-csui-command='thumbnail'] > a[title='Browse view']");
      this.waitMaxTimeForElement("li[data-csui-command='thumbnail'] > a[title='Grid view']");
    },

    openAddItemDropdown: function() {
      this.say("Click add item button");
      this.click("li > a[title='Add item']"); 
      this.waitMaxTimeForElement(".csui-more-dropdown-menu");
      this.seeElement(".csui-more-dropdown-menu");
    },

    async addItem(subtype) {
      this.say("Click on respective subtype in add item dropdown");
      this.click(`li[data-csui-addtype='${subtype}'] > a`);
      this.say("Add item dropdown gets closed");
      this.dontSeeElement(".csui-more-dropdown-menu");
    },

    async verifyMimeType(mimeType) {
      this.seeElement(".csui-table-cell-no-default-action > span[title='"+mimeType+"']");
    },

    async addWikiOREmailFolder(subtype) {
      this.say("Click on respective subtype in add item dropdown");
      this.click("li[data-csui-command='"+subtype+"'] > a");
      this.say("Add item dropdown gets closed");
      this.dontSeeElement(".csui-more-dropdown-menu");
    },

    async deleteAllItems(){
      this.waitMaxTimeForElement("button[aria-label = 'Select all items']");
      this.seeElement("button[aria-label='Select all items']");
      this.click("button[aria-label = 'Select all items']");
      this.waitMaxTimeForElement("ul.csui-toolbar > li[data-csui-command='delete'] >a");
      this.click("ul.csui-toolbar > li[data-csui-command='delete'] > a");
      this.waitMaxTimeForElement("div.binf-modal-footer > button.csui-yes");
      this.click("div.binf-modal-footer > button.csui-yes");
      this.waitMaxTimeForElement(".csui-progresspanel div.csui-names-progress");
      this.click(".csui-progresspanel div.csui-names-progress");
      this.waitMaxTimeForElement("div.csui-table-empty.csui-table-empty-default.csui-can-add-items"); //check that table is empty now
    },

    async isOnMetadataDialog() {
      this.waitMaxTimeForElement(".cs-item-action-metadata.cs-dialog.binf-modal");
      this.seeElement(".cs-item-action-metadata.cs-dialog.binf-modal");
    }

  });
}