/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;
const Data = require('./data.js');

Feature('View Permissions Live Server Test Cases');

BeforeSuite((I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
    I.ensureNotInAccesibilityMode();
});

Scenario('Verifying view permissions in dropdown menu', (I, PER) => {
    PER.openDropdownMenu();
    I.seeElement(".binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Closing dropdown menu', (PER) => {
    PER.closeDropdownMenu();
});

Scenario('Verifying view permissions when select all is selected in table view', (PER, I) => {
    PER.selectAll();
    I.seeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Unselecting select all checkbox in table view', (PER) => {
    PER.unSelectAll();
});

Scenario('Verifying view permissions when an item is selected in table view', (PER, I) => {
    PER.selectItemInTableView();
    I.seeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Unselecting selected items in Table view', (PER) => {
    PER.unSelectItemInTableView();
});

Scenario('Hovering on an item in Table view', (PER) => {
    PER.hoverOnItemInTableView();
});

Scenario('Clicking inline more actions in Table view', (PER, I) => {
    PER.checkInlineActionsInTableView();
    I.seeElement(".csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix .binf-dropdown-menu li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".csui-saved-item.csui-state-hover .csui-table-cell-name.csui-table-actionbar-shown .csui-table-cell-name-appendix .binf-dropdown-menu li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Changing view to thumbnail View', (PER) => {
    PER.changeToThumbnailView();
});

Scenario('Hovering on an item in Thumbnail view', (PER) => {
    PER.hoverOnItemInThumbnailView();
});

Scenario('Clicking inline more actions in Thumbnail view', (PER) => {
    PER.checkInlineActionsInThumbnailView();
});

Scenario('Verifying view permissions in dropdown in thumbnail view', (I, PER) => {
    PER.openDropdownMenu();
    I.seeElement(".binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Closing dropdown menu in thumbnail view', (PER) => {
    PER.closeDropdownMenu();
});

Scenario('Verifying view permissions when select all is selected in thumbnail view', (PER, I) => {
    PER.selectAll();
    I.seeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Unselecting select all checkbox in thumbnail view', (PER) => {
    PER.unSelectAll();
});

Scenario('Verifying view permissions when an item is selected in thumbnail view', (PER, I) => {
    PER.selectItemInThumbnail();
    I.seeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] > a");
    I.dontSeeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] a[disabled]");
});

Scenario('Unselecting selected items in Thumbnail view', (PER) => {
    PER.unSelectItemInThumbnail();
});

Scenario('Selecting an item in thumbnail view', (PER) => {
    PER.selectItemInThumbnail();
});

Scenario('Navigating to permissions page', (I) => {
    I.seeElement(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] > a");
    I.click(".csui-toolbar-region .csui-toolbar li[data-csui-command = 'permissions'] > a");
    I.waitMaxTimeForElement('.cs-metadata .cs-permissions.csui-acc-tab-region');
    I.seeElement('.cs-metadata .cs-permissions.csui-acc-tab-region');
});

Scenario('Verifying Dropdown menu in permissions page', (PER, I) => {
    PER.openPermissionsPageDropDown();
    I.dontSeeElement(".binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command = 'permissions'] > a");
});

Scenario('Closing dropdown menu in permissions page', (PER) => {
    PER.closePermissionsPageDropdown();
});

Scenario('Verifying elements in permissions page', (PER) => {
    PER.verifyPermissionsPage();
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking edit button of a user in permissions page', (PER) => {
    PER.clickEditInPermissionsPage();
});

Scenario('Editing permission level to None in permissions page', (PER) => {
    PER.editPermissions('None');
});

Scenario('Checking updated value of None permission level in permissions page', (PER) => {
    PER.checkUpdatedPermissions('None');
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking edit button of a user in permissions page', (PER) => {
    PER.clickEditInPermissionsPage();
});

Scenario('Editing permission level to Read in permissions page', (PER) => {
    PER.editPermissions('Read');
});

Scenario('Checking updated value of Read permission level in permissions page', (PER) => {
    PER.checkUpdatedPermissions('Read');
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking edit button of a user in permissions page', (PER) => {
    PER.clickEditInPermissionsPage();
});

Scenario('Editing permission level to Write in permissions page', (PER) => {
    PER.editPermissions('Write');
});

Scenario('Checking updated value of Write permission level in permissions page', (PER) => {
    PER.checkUpdatedPermissions('Write');
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking edit button of a user in permissions page', (PER) => {
    PER.clickEditInPermissionsPage();
});

Scenario('Editing permission level to Full control in permissions page', (PER) => {
    PER.editPermissions('Full control');
});

Scenario('Checking updated value of Full control permission level in permissions page', (PER) => {
    PER.checkUpdatedPermissions('Full control');
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking edit button of a user in permissions page', (PER) => {
    PER.clickEditInPermissionsPage();
});

Scenario('Editing permission level to Custom in permissions page', (PER) => {
    PER.editPermissions('Custom...');
});

Scenario('Display Custom attributes in permissions page', (PER) => {
    PER.displayCustomPermissionAttributes();
});

Scenario('Selecting all Custom attributes in permissions page', (PER) => {
    PER.selectAllCustomAttributes();
});

Scenario('Saving changes of Custom attributes in permissions page', (PER) => {
    PER.submitCustomAttributeChanges();
});

Scenario('Checking updated value of Full control permission level in permissions page', (PER) => {
    PER.checkUpdatedPermissions('Full control');
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking edit button of a user in permissions page', (PER) => {
    PER.clickEditInPermissionsPage();
});

Scenario('Editing permission level to Custom in permissions page', (PER) => {
    PER.editPermissions('Custom...');
});

Scenario('Display Custom attributes in permissions page', (PER) => {
    PER.displayCustomPermissionAttributes();
});

Scenario('Deselecting Edit Permission attribute in permissions page', (PER) => {
    PER.unselectEditPermissions();
});

Scenario('Saving changes of Custom attributes in permissions page', (PER) => {
    PER.submitCustomAttributeChanges();
});

Scenario('Checking updated value of Write permission level in permissions page', (PER) => {
    PER.checkUpdatedPermissions('Write');
});

Scenario('Hovering on user in permissions page', (PER) => {
    PER.hoverOnUserInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking delete button of a user in permissions page', (PER) => {
    PER.clickDeleteInPermissionsPage('DontDeleteUser');
});

Scenario('Clicking add button to add a user in permissions page', (PER) => {
    PER.clickAddInPermissionsPage();
});

Scenario('Clicking add user/groups to add a user', (PER) => {
    PER.clickAddUserOrGroups();
});

Scenario('Searching for a user', (PER) => {
    PER.searchUserToAdd('DontDeleteUser');
});

Scenario('Selecting user', (PER) => {
    PER.selectUser('DontDeleteUser');
});

Scenario('Adding user in permissions page', (PER) => {
    PER.addUserForPermissions();
});

Scenario('Submitting changes of permission level of added user in permissions page', (PER) => {
    PER.addPermissionForNewUser('DontDeleteUser');
});

Scenario('Filling input search field with a username in permissions page', (PER) => {
    PER.fillUserNameInSearchField('DontDeleteUser');
});

Scenario('Clicking a user in search dropdown in permissions page', (PER) => {
    PER.clickUserInSearchDropdown();
});

Scenario('Verifying search results in permissions page', (PER) => {
    PER.verifySearchResultsInPermissionPage();
});

Scenario('Clicking back button in permissions page', (PER, I) => {
    PER.clickGoBackButton();
    I.waitMaxTimeForElement("#csui-thumbnail-results");
    I.seeElement("#csui-thumbnail-results");
});