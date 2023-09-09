/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */




 module.exports = function() {
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
      verifySaveSearchDialog: function () {
        this.see('Cancel');
        this.seeElement('.csui-start-locations .binf-dropdown-toggle .cs-label');
        this.seeTextEquals("Admin Home",'.csui-start-locations .binf-dropdown-toggle .cs-label');
        this.seeElement('.cs-add-button:disabled');
      },
      selectLocation: function () {
        this.click('.cs-list .csui-item-standard.binf-list-group-item');
        this.waitMaxTimeForElement('.cs-add-button');
        this.seeElement('.cs-add-button');
      },
      validateAndNavigate: function () {
        this.seeElement('.csui-action-close');
        this.see('Go to location');
        this.click('.csui-messagepanel.csui-success-with-link .csui-message-link');
        this.see('TestExamplesearch');
      },
      backToTableView: function () {
        this.seeElement('.csui-search-header .arrow_back');
        this.click('.csui-search-header .arrow_back');
        this.waitMaxTimeForElement('.csui-table-column-search>.csui-table-search-icon');
        this.seeElement('.csui-table-column-search>.csui-table-search-icon');
      },
      selectToDeleteQuery: function () {
        this.seeElement('.csui-saved-item .csui-table-cell-_select .csui-control');
        this.click('.csui-saved-item .csui-table-cell-_select .csui-control');
        this.waitMaxTimeForElement('.binf-nav-pills.csui-align-left [data-csui-command="delete"]');
        this.seeElement('.binf-nav-pills.csui-align-left [data-csui-command="delete"]');
      },
      clickDeleteQuery: function () {
        this.click('.binf-nav-pills.csui-align-left [data-csui-command="delete"]');
        this.waitMaxTimeForElement('.binf-widgets .cs-dialog .binf-modal-dialog');
        this.seeElement('.binf-widgets .cs-dialog .binf-modal-dialog');
      },
      deleteDialog: function () {
        this.seeElement(".binf-widgets .cs-dialog .binf-modal-footer .binf-btn.csui-yes");
        this.click(".binf-widgets .cs-dialog .binf-modal-footer .binf-btn.csui-yes");
        this.waitMaxTimeForElement('.csui-table-empty.csui-can-add-items .csui-no-result-message');
        this.seeElement('.csui-table-empty.csui-can-add-items .csui-no-result-message');
      },
      updateQuery: function () {
        this.click('.csui-segemented-save-tools .csui-segmented-update-button');
        this.waitMaxTimeForElement('.csui-global-message.position-show');
        this.seeElement('.csui-global-message.position-show');
        this.seeElement('.csui-action-close');
        this.see('Go to location');
        this.seeElement('.csui-messagepanel.csui-success-with-link .csui-message-link');
      }
    });
  };