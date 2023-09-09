/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

module.exports = function () {
  return actor({
    openDropdownMenu: function () {
      this.seeElement('.csui-item-title-menu .binf-btn.binf-dropdown-toggle');
      this.click('.csui-item-title-menu  .binf-btn.binf-dropdown-toggle');
      this.waitMaxTimeForElement('.binf-dropdown.binf-open .binf-dropdown-menu');
      this.seeElement('.binf-dropdown.binf-open .binf-dropdown-menu');
    },

    closeDropdownMenu: function () {
      this.click('.csui-item-title-menu .binf-btn.binf-dropdown-toggle');
      this.dontSeeElement('.binf-dropdown.binf-open .binf-dropdown-menu');
    },

    selectAll: function () {
      this.click(locate('.csui-control-view.csui-checkbox-view button.csui-control.csui-checkbox').first());
      this.waitMaxTimeForElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
      this.seeElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
    },

    unSelectAll: function () {
      this.click(locate('.csui-control-view.csui-checkbox-view button.csui-control.csui-checkbox').first());
      this.waitMaxTimeForElement('.csui-table-rowselection-toolbar.binf-hidden');
      this.dontSeeElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
      this.dontSeeCheckboxIsChecked(locate('.csui-control-view.csui-checkbox-view .csui-control.csui-checkbox').first());
    },

    selectItemInTableView: function () {
      this.checkOption(locate('.csui-control-view.csui-checkbox-view .csui-control.csui-checkbox').last());
      this.waitMaxTimeForElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
      this.seeElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
    },

    unSelectItemInTableView: function () {
      this.checkOption(locate('.csui-control-view.csui-checkbox-view .csui-control.csui-checkbox').last());
      this.waitMaxTimeForElement('.csui-table-rowselection-toolbar.binf-hidden');
      this.dontSeeElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
      this.dontSeeCheckboxIsChecked(locate('.csui-control-view.csui-checkbox-view .csui-control.csui-checkbox').last());
    },

    changeToThumbnailView: function () {
      this.seeElement(".csui-toolbar.binf-nav.csui-align-right li[data-csui-command = 'thumbnail'] > a");
      this.click(".csui-toolbar.binf-nav.csui-align-right li[data-csui-command = 'thumbnail'] > a");
      this.waitMaxTimeForElement('#csui-thumbnail-results');
      this.seeElement('#csui-thumbnail-results');
    },

    selectItemInThumbnail: function () {
      this.moveCursorTo(locate('.csui-thumbnail-collection .csui-thumbnail-item').last());
      this.checkOption(locate('.csui-selected-checkbox input.selectAction').last());
      this.waitMaxTimeForElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
      this.seeElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
    },

    unSelectItemInThumbnail: function () {
      this.moveCursorTo(locate('.csui-thumbnail-collection .csui-thumbnail-item').last());
      this.click(locate('.csui-selected-checkbox input.selectAction').last());
      this.waitMaxTimeForElement('.csui-table-rowselection-toolbar.binf-hidden');
      this.dontSeeElement('.csui-table-rowselection-toolbar.csui-table-rowselection-toolbar-visible');
      this.dontSeeCheckboxIsChecked(locate('.csui-selected-checkbox input.selectAction').last());
    },    

    openPermissionsPageDropDown: function () {
      this.seeElement('.cs-dropdown-menu .binf-btn.binf-dropdown-toggle');
      this.click('.cs-dropdown-menu .binf-btn.binf-dropdown-toggle');
      this.waitMaxTimeForElement('.cs-dropdown-menu .binf-dropdown-menu');
      this.seeElement('.cs-dropdown-menu .binf-dropdown-menu');
    },

    closePermissionsPageDropdown: function () {
      this.click('.cs-dropdown-menu .binf-btn.binf-dropdown-toggle');
      this.dontSeeElement('.cs-dropdown-menu .binf-dropdown-menu');
    },

    hoverOnItemInTableView: function () {
      this.moveCursorTo(locate('.binf-table .csui-saved-item').last());
      this.waitMaxTimeForElement('.csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix');
      this.seeElement('.csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix');
    },

    checkInlineActionsInTableView: function () {
      this.seeElement('.csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix .binf-dropdown-toggle');
      this.click('.csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix .binf-dropdown-toggle');
      this.waitMaxTimeForElement('.csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix .binf-dropdown-menu');
      this.seeElement('.csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix .binf-dropdown-menu');
    },

    hoverOnItemInThumbnailView: function () {
      this.moveCursorTo(locate('.csui-thumbnail-collection .csui-thumbnail-item').last());
      this.waitMaxTimeForElement('.csui-thumbnail-collection .csui-thumbnail-item .csui-table-actionbar .binf-dropdown .binf-dropdown-toggle');
      this.seeElement('.csui-thumbnail-collection .csui-thumbnail-item .csui-table-actionbar .binf-dropdown .binf-dropdown-toggle');
    },

    checkInlineActionsInThumbnailView: function () {
      this.click('.csui-thumbnail-collection .csui-thumbnail-item .csui-table-actionbar .binf-dropdown .binf-dropdown-toggle');
      this.waitMaxTimeForElement(".csui-thumbnail-collection .csui-thumbnail-item .csui-table-actionbar .binf-dropdown.binf-open .binf-dropdown-menu");
      this.seeElement(".csui-thumbnail-collection .csui-thumbnail-item .csui-table-actionbar .binf-dropdown.binf-open .binf-dropdown-menu");
      this.seeElement(".csui-thumbnail-collection .csui-thumbnail-item .csui-table-actionbar .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command='permissions'] > a");
    },

    verifyPermissionsPage: function () {
      this.seeElement(".cs-permissions-content-header .csui-add-permissions-content .csui-add-permission");
      this.seeElement("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-form-control.cs-search");
      this.seeElement("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.cs-search-icon");
      this.seeElement(".csui-table-list-header .csui-table-header .csui-table-header-cell[title = 'Permission level'] .csui-table-header-cell-container > span");
      this.seeElement(".csui-table-list-header .csui-table-header .csui-table-header-cell[title = 'User / Group'] .csui-table-header-cell-container > span");
      this.seeElement(".csui-tabletoolbar .csui-rightToolbar .csui-toolbar.binf-nav.csui-align-left li[data-csui-command = 'explorepermissions'] > a");
    },

    hoverOnUserInPermissionsPage: function (userName) {
      this.moveCursorTo(locate('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row').withText(userName));
      this.waitMaxTimeForElement('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row .csui-inlinetoolbar .csui-table-actionbar .tile-nav.binf-nav.binf-nav-pills');
      this.seeElement('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row .csui-inlinetoolbar .csui-table-actionbar .tile-nav.binf-nav.binf-nav-pills');
    },

    clickEditInPermissionsPage: function () {
      this.seeElement('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row .csui-inlinetoolbar .csui-table-actionbar li[data-csui-command = "editpermission"] > a');
      this.click('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row .csui-inlinetoolbar .csui-table-actionbar li[data-csui-command = "editpermission"] > a');
      this.waitMaxTimeForElement(".binf-popover .binf-popover-content ul.csui-permission-levels");
      this.seeElement(".binf-popover .binf-popover-content ul.csui-permission-levels");
    },

    editPermissions: function (permissionLevel) {
      this.seeElement(".binf-popover .binf-popover-content ul.csui-permission-levels li[aria-label = '" + permissionLevel + "'] a span.cs-icon");
      this.seeElement(".binf-popover .binf-popover-content ul.csui-permission-levels li[aria-label = '" + permissionLevel + "'] a span.cs-label");
      this.click(".binf-popover .binf-popover-content ul.csui-permission-levels li[aria-label = '" + permissionLevel + "'] a");
      if (permissionLevel === 'Custom...') {
        this.waitForDetached(".csui-edit-permission-popover-container .binf-popover ul.csui-permission-levels");
        this.dontSeeElement(".csui-edit-permission-popover-container .binf-popover ul.csui-permission-levels");
      } else{
        this.waitForDetached(".csui-edit-permission-popover-container .binf-popover");
        this.dontSeeElement(".csui-edit-permission-popover-container .binf-popover");
      }
    },

    checkUpdatedPermissions: function (permissionLevel) {
      this.waitForText(permissionLevel, locate("div[data-csui-attribute = 'permissions'] .csui-permission-level-container span.csui-permission-level[aria-label = '" + permissionLevel + " Permission for DontDeleteUser']"));
      this.seeTextEquals(permissionLevel, locate("div[data-csui-attribute = 'permissions'] .csui-permission-level-container span.csui-permission-level[aria-label = '" + permissionLevel + " Permission for DontDeleteUser']"));
    },

    displayCustomPermissionAttributes: function () {
      this.waitMaxTimeForElement(".binf-popover .binf-popover-content .csui-permission-attributes.csui-acc-tab-region");
      this.seeElement(".binf-popover .binf-popover-content .csui-permission-attributes.csui-acc-tab-region");
    },

    selectAllCustomAttributes: function () {
      this.waitMaxTimeForElement(".csui-permission-attributes input#node_edit_permissions");
      this.checkOption(".csui-permission-attributes input#node_edit_permissions");
      this.seeCheckboxIsChecked(".csui-permission-attributes input#node_edit_permissions");
    },

    submitCustomAttributeChanges: function () {
      this.seeElement(".binf-popover .binf-popover-content .csui-permission-attributes .csui-permission-attribute-buttons-container .cs-save-btn");
      this.click(".binf-popover .binf-popover-content .csui-permission-attributes .csui-permission-attribute-buttons-container .cs-save-btn");
      this.waitForDetached(".csui-edit-permission-popover-container .binf-popover");
      this.dontSeeElement(".csui-edit-permission-popover-container .binf-popover");
    },

    unselectEditPermissions: function () {
      this.waitMaxTimeForElement(".csui-permission-attributes input#node_edit_permissions");
      this.click(".csui-permission-attributes input#node_edit_permissions");
      this.dontSeeCheckboxIsChecked(".csui-permission-attributes input#node_edit_permissions");
    },

    clickDeleteInPermissionsPage: function (userName) {
      this.seeElement('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row .csui-inlinetoolbar .csui-table-actionbar li[data-csui-command = "deletepermission"] > a');
      this.click('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row .csui-inlinetoolbar .csui-table-actionbar li[data-csui-command = "deletepermission"] > a');
      this.waitForDetached(".csui-user-container span.csui-user-display-name[aria-label = 'User " + userName + "']");
      this.dontSeeElement(".csui-user-container span.csui-user-display-name[aria-label = 'User " + userName + "']");
    },

    clickAddInPermissionsPage: function () {
      this.seeElement('.cs-permissions-content-header .csui-add-permissions-content .csui-add-permission');
      this.click('.cs-permissions-content-header .csui-add-permissions-content .csui-add-permission');
      this.waitMaxTimeForElement(".cs-permissions-content-header .csui-add-permissions-content .binf-dropdown-menu");
      this.seeElement(".cs-permissions-content-header .csui-add-permissions-content .binf-dropdown-menu");
    },

    clickAddUserOrGroups: function () {
      this.seeElement('.cs-permissions-content-header .csui-add-permissions-content .binf-dropdown-menu li[data-csui-command = "adduserorgroup"] > a');
      this.click('.cs-permissions-content-header .csui-add-permissions-content .binf-dropdown-menu li[data-csui-command = "adduserorgroup"] > a');
      this.waitMaxTimeForElement(".binf-modal-dialog .binf-modal-content");
      this.seeElement(".binf-modal-dialog .binf-modal-content");
    },

    searchUserToAdd: function (userName) {
      this.seeElement('.binf-modal-body .cs-folder-name .csui-folder-name .cs-icon.icon-sv-search');
      this.click('.binf-modal-body .cs-folder-name .csui-folder-name .cs-icon.icon-sv-search');
      this.waitMaxTimeForElement(".cs-folder-name .csui-folder-name.binf-hidden");
      this.seeElement(".cs-modal-filter .binf-form-group .binf-form-control.cs-filter-input");
      this.fillField('.cs-modal-filter .binf-form-group .binf-form-control.cs-filter-input',userName);
      this.waitMaxTimeForElement(".list-content .binf-list-group li[aria-label = 'User: " + userName + "']");
      this.seeElement(".list-content .binf-list-group li[aria-label = 'User: " + userName + "']");
    },

    selectUser: function (userName) {
      this.click(".list-content .binf-list-group li[aria-label = 'User: " + userName + "']");
      this.waitMaxTimeForElement(".list-content .binf-list-group li.select[aria-label = 'User: " + userName + "']");
      this.seeElement(".list-content .binf-list-group li.select[aria-label = 'User: " + userName + "']");
    },

    addUserForPermissions: function () {
      this.seeElement(".binf-modal-footer button.cs-add-button");
      this.waitForEnabled(".binf-modal-footer button.cs-add-button");
      this.click(".binf-modal-footer button.cs-add-button");
      this.waitMaxTimeForElement(".binf-modal-dialog .binf-modal-content .csui-permission-levels");
      this.seeElement(".binf-modal-dialog .binf-modal-content .csui-permission-levels");
    },

    addPermissionForNewUser: function (userName) {
      this.seeElement(".binf-modal-dialog .binf-modal-content .binf-modal-footer button[title = 'Done']");
      this.click(".binf-modal-dialog .binf-modal-content .binf-modal-footer button[title = 'Done']");
      this.waitForDetached(".binf-widgets .binf-modal-dialog .binf-modal-content");
      this.dontSeeElement(".binf-widgets .binf-modal-dialog .binf-modal-content");
      this.seeElement(".csui-table-list-body .csui-table-row.active-row span.csui-user-display-name[aria-label = 'User " + userName + "']");
    },

    clickGoBackButton: function () {
      this.seeElement(".metadata-sidebar .cs-simplelist.binf-panel .cs-header.binf-panel-heading.cs-header-with-go-back");
      this.click(".metadata-sidebar .cs-simplelist.binf-panel .cs-header.binf-panel-heading.cs-header-with-go-back");
    },

    fillUserNameInSearchField: function (userName) {
      this.click("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-form-control.cs-search");
      this.fillField('#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-form-control.cs-search',userName);
      this.waitMaxTimeForElement("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-dropdown-menu");
      this.seeElement("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-dropdown-menu");
    },

    clickUserInSearchDropdown: function () {
      this.click(locate("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-dropdown-menu li").first());
      this.waitForInvisible("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-dropdown-menu");
      this.dontSeeElement("#csui-permissions-user-picker .cs-item-picker.csui-control-userpicker .typeahead.binf-dropdown-menu");
    },

    verifySearchResultsInPermissionPage: function () {
      this.waitMaxTimeForElement(locate('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row').first().withText('DontDeleteUser'));
      this.seeElement(locate('.csui-table-list .csui-table-list-body .csui-table-body .csui-table-row').first().withText('DontDeleteUser'));
    }
  });
}