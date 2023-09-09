/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 module.exports = function () {
    return actor({
      openAddItemDropdown: function () {
        this.waitMaxTimeForElement('.csui-addToolbar .csui-toolbar .binf-dropdown-toggle');
        this.seeElement('.csui-addToolbar .csui-toolbar .binf-dropdown-toggle');
        this.click('.csui-addToolbar .csui-toolbar .binf-dropdown-toggle');
        this.waitMaxTimeForElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu');
        this.seeElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu');
      },

      addCompoundDocument: function(CDName){
        this.waitMaxTimeForElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="136"]');
        this.seeElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="136"]');
        this.click('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="136"]');
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-icon-group[title="Compound Document"]');
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-editform input.csui-inlineform-type-name');
        this.say('Verify save icon is disabled before filling');
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save[disabled]');
        this.fillField('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-editform input.csui-inlineform-type-name', CDName);
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save');
      },

      createCompoundDocument: function (CDName) {
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save');
        this.click('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save');
        this.waitMaxTimeForElement(".csui-nodetable .csui-table-cell-name-value[title='" + CDName + "']");
        this.seeElement(".csui-nodetable .csui-table-cell-name-value[title='" + CDName + "']");
      },

      selectCDTableView: function (CDName) {
        this.waitMaxTimeForElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
        this.seeElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
        this.click(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
        this.waitMaxTimeForElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
        this.seeElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
      },

      unSelectCDTableView: function (CDName) {
        this.seeElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
        this.click(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
        this.seeElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + CDName + "']");
      },
      
      verifyBulkCDMenuOption: async function () {
        this.waitMaxTimeForElement('.csui-nodestable .csui-alternating-toolbars .csui-table-rowselection-toolbar .csui-table-rowselection-toolbar-view');
        let options = await this.grabAttributeFrom('.csui-table-rowselection-toolbar .csui-toolbar-region > ul.binf-nav li[data-csui-command]','data-csui-command');
        return options.indexOf("compounddocument") > 0;
      },

      openToolbarSubmenu: function () {
        this.seeElement('.csui-table-rowselection-toolbar .csui-toolbar-region > ul.binf-nav li.binf-dropdown');
        this.click('.csui-table-rowselection-toolbar .csui-toolbar-region > ul.binf-nav li.binf-dropdown');
        this.seeElement('.csui-table-rowselection-toolbar .csui-toolbar-region > ul.binf-nav li.binf-dropdown.binf-open');
      },

      openCDSubmenu: function () {
        this.seeElement('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"]');
        this.click('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"]');
        this.waitMaxTimeForElement('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"] .csui-toolitem[aria-expanded="true"]');
        this.seeElement('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"] .csui-toolitem[aria-expanded="true"]');
        this.seeElement('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"] .binf-dropdown-menu');
      },

      verifyCDSubmenuOptions: async function (expectedCDOptions) {
        this.waitMaxTimeForElement('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"]');
        let CDOptions = await this.grabAttributeFrom('.csui-toolbar-region li.binf-dropdown-submenu[data-csui-command="compounddocument"] .binf-dropdown-menu li','data-csui-command');
        return JSON.stringify(CDOptions) === JSON.stringify(expectedCDOptions);
      },

      verifyInlineCDOptions: async function (CDName) {
        this.seeElement(".csui-nodetable .csui-table-cell-name-value[title='" + CDName + "']");
        this.moveCursorTo(".csui-nodetable .csui-table-cell-name-value[title='" + CDName + "']");
        this.wait(2);
        this.waitMaxTimeForElement('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble');
        this.seeElement('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble');
        this.seeElement('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble .binf-dropdown');
        this.click('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble .binf-dropdown');
        this.waitMaxTimeForElement('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble .binf-dropdown.binf-open');
        this.seeElement('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble .binf-dropdown.binf-open');
        this.seeElement('.csui-nodetable .csui-table-actionbar .binf-dropdown.binf-open li[data-csui-command="compounddocument"]');
        this.click('.csui-nodetable .csui-table-actionbar .binf-dropdown.binf-open li[data-csui-command="compounddocument"]');
        this.waitMaxTimeForElement('.csui-nodetable .csui-table-actionbar .binf-dropdown.binf-open li[data-csui-command="compounddocument"] .binf-dropdown-menu');
        this.seeElement('.csui-nodetable .csui-table-actionbar .binf-dropdown.binf-open li[data-csui-command="compounddocument"] .binf-dropdown-menu');
        let CDOptions = await this.grabAttributeFrom('.csui-nodetable .csui-table-actionbar .binf-dropdown.binf-open li[data-csui-command="compounddocument"] .binf-dropdown-menu li','data-csui-command');
        let expectedCDOptions = ['createrelease', 'createrevision', 'reorganize', 'viewreleases'];
        return JSON.stringify(CDOptions) === JSON.stringify(expectedCDOptions);
      },

      createEmptyFolder: function (FolderName) {
        this.seeElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="0"]');
        this.click('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="0"]');
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-icon-group[title="Folder"]');
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-editform input.csui-inlineform-type-name');
        this.say('Verify save icon is disabled before filling');
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save[disabled]');
        this.fillField('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-editform input.csui-inlineform-type-name', FolderName);
        this.seeElement('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save');
        this.click('.csui-nodetable .csui-new-item.csui-table-row-shows-inlineform .csui-inline-action-button-wrapper .csui-btn-save');
        this.waitMaxTimeForElement(".csui-nodetable .csui-table-cell-name-value[title='" + FolderName + "']");
        this.seeElement(".csui-nodetable .csui-table-cell-name-value[title='" + FolderName + "']");
      },

      deleteAllItems: function () {
        this.seeElement('.csui-nodetable .csui-control.csui-checkbox[title="Select all items"]');
        this.click('.csui-nodetable .csui-control.csui-checkbox[title="Select all items"]');
        this.seeElement('.csui-nodetable .csui-control.csui-checkbox[title="Select all items"][aria-checked="true"]');
        this.seeElement('.csui-table-rowselection-toolbar .csui-toolbar-region > ul.binf-nav li[data-csui-command="delete"]');
        this.click('.csui-table-rowselection-toolbar .csui-toolbar-region > ul.binf-nav li[data-csui-command="delete"]');
        this.waitMaxTimeForElement('.csui-alert .binf-modal-dialog .csui-yes');
        this.seeElement('.csui-alert .binf-modal-dialog .csui-yes');
        this.click('.csui-alert .binf-modal-dialog .csui-yes');
        this.waitMaxTimeForElement('.csui-table-empty.csui-can-add-items .csui-no-result-message');
        this.seeElement('.csui-table-empty.csui-can-add-items .csui-no-result-message');
      },

      openCompoundDocument:async function (CDName) {
        this.seeElement(".csui-nodetable .csui-table-cell-name-value[title='" + CDName + "']");
        this.click(".csui-nodetable .csui-table-cell-name-value[title='" + CDName + "']");
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-icon-group[title="Compound Document"]');
        this.seeElement('.csui-toolbar-caption .csui-icon-group[title="Compound Document"]');
        let containerName = await this.grabAttributeFrom('.csui-toolbar-caption .csui-item-name-block','innerText');
        return containerName === CDName;
      },

      navigateToAncestor: async function (ancestor) {
        let verifySubCrumb = await this.executeScript(() => document.querySelector(".csui-perspective-breadcrumb .binf-breadcrumb .csui-subcrumb") !== null);
        if (verifySubCrumb) {
          this.click('.csui-perspective-breadcrumb .binf-breadcrumb .csui-subcrumb');
        }
        this.seeElement(".csui-perspective-breadcrumb .binf-breadcrumb li a.csui-breadcrumb[title='" + ancestor + "']");
        this.click(".csui-perspective-breadcrumb .binf-breadcrumb li a.csui-breadcrumb[title='" + ancestor + "']");
        this.wait(2);
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-icon-group[title="Folder"]');
        this.seeElement('.csui-toolbar-caption .csui-icon-group[title="Folder"]');
        let containerName = await this.grabAttributeFrom('.csui-toolbar-caption .csui-item-name-block', 'innerText');
        return containerName === ancestor;
      },

      verifyCDAddItemDropdown: function () {
        this.seeElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu');
        this.say("Compound document and document options must be available")
        this.seeElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="136"]');
        this.seeElement('.csui-addToolbar .binf-dropdown-menu.csui-more-dropdown-menu > li[data-csui-addtype="144"]');
      },

      openCDHeaderMenu: function () {
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu');
        this.click('.csui-toolbar-caption .csui-item-title-menu');
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"]');
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"]');
      },

      openCDSubMenuInHeader: function () {
        this.scrollTo('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"]');
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"]');
        this.click('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"] .csui-toolitem .csui-caret');
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open ul');
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open ul.csui-fixed-submenu');
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open ul.csui-fixed-submenu');
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open ul.csui-fixed-submenu');
      },

      verifyCDHeaderOptions:async function (expectedCDOptions) {
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open ul.csui-fixed-submenu li');
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open ul.csui-fixed-submenu li');
        let CDOptions = await this.grabAttributeFrom('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open .binf-dropdown-menu li','data-csui-command');
        return JSON.stringify(CDOptions) === JSON.stringify(expectedCDOptions);
      },

      openCreateReleaseDialog: function () {
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-item-title-menu li[data-csui-command="compounddocument"].binf-open ul.binf-dropdown-menu li[data-csui-command="createrelease"]');
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu li[data-csui-command="compounddocument"].binf-open ul.binf-dropdown-menu li[data-csui-command="createrelease"]');
        this.click('.csui-toolbar-caption .csui-item-title-menu li[data-csui-command="compounddocument"].binf-open ul.binf-dropdown-menu li[data-csui-command="createrelease"]');
        this.waitMaxTimeForElement('.csui-create-release-dialog .binf-modal-dialog');
        this.seeElement('.csui-create-release-dialog .binf-modal-dialog');
      },

      validateCreateReleaseDialog:async function () {
        this.seeElement('.binf-modal-body .csui-create-release .csui-document-name input');
        this.seeElement('.binf-modal-body .csui-create-release .csui-version');
        let releaseName = await this.grabAttributeFrom('.binf-modal-body .csui-create-release .csui-document-name input','value');
        this.seeElement('.binf-modal-footer .cs-add-button');
        return releaseName === 'Release 1.0';
      },

      createRelease: function () {
        this.seeElement('.binf-modal-footer .cs-add-button');
        this.click('.binf-modal-footer .cs-add-button');
        this.waitMaxTimeForElement('.csui-messagepanel.csui-success .csui-text[title="Created new release ‘Release 1.0’ successfully."]');
        this.seeElement('.csui-messagepanel.csui-success .csui-text[title="Created new release ‘Release 1.0’ successfully."]');
        this.say('Verify that "Go to location" option is available in global message');
        this.seeElement('.csui-messagepanel.csui-success .csui-gotolocation-url');
      },

      goToReleasesTab: function () {
        this.seeElement('.csui-messagepanel.csui-success .csui-gotolocation-url');
        this.click('.csui-messagepanel.csui-success .csui-gotolocation-url');
        this.dontSeeElement('.csui-messagepanel.csui-success');
      },

      verifyReleaseTab: function (CDName) {
        this.seeElement(".csui-perspective-breadcrumb .binf-breadcrumb > li .csui-breadcrumb[title='" + CDName + "']");
        this.seeElement('.csui-perspective-breadcrumb .binf-breadcrumb > li .csui-breadcrumb[title="Release 1.0"]');
        this.seeElement('.csui-perspective-breadcrumb .binf-breadcrumb > li.binf-active');
      },

      navigateToCDMainFolder:async function (CDName) {
        this.seeElement(".csui-perspective-breadcrumb .binf-breadcrumb > li .csui-breadcrumb[title='" + CDName + "']");
        this.click(".csui-perspective-breadcrumb .binf-breadcrumb > li .csui-breadcrumb[title='" + CDName + "']");
        this.waitMaxTimeForElement('.csui-toolbar-caption .csui-icon-group[title="Compound Document"]');
        this.seeElement('.csui-toolbar-caption .csui-icon-group[title="Compound Document"]');
        let containerName = await this.grabAttributeFrom('.csui-toolbar-caption .csui-item-name-block','innerText');
        return containerName === CDName;
      },

      openCreateRevisionDialog: function () {
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open .binf-dropdown-menu li[data-csui-command="createrevision"]');
        this.click('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open .binf-dropdown-menu li[data-csui-command="createrevision"]');
        this.waitMaxTimeForElement('.csui-create-revision-dialog .binf-modal-dialog');
        this.seeElement('.csui-create-revision-dialog .binf-modal-dialog');
      },

      validateCreateRevisionDialog:async function (revisionValue) {
        this.seeElement('.binf-modal-body .csui-create-revision .csui-document-name input');
        this.seeElement('.binf-modal-body .csui-create-revision .csui-version');
        let revisionName = await this.grabAttributeFrom('.binf-modal-body .csui-create-revision .csui-document-name input','value');
        this.seeElement('.binf-modal-footer .cs-add-button');
        return revisionName === revisionValue;
      },

      createRevision: function () {
        this.seeElement('.binf-modal-footer .cs-add-button');
        this.click('.binf-modal-footer .cs-add-button');
        this.waitMaxTimeForElement('.csui-messagepanel.csui-success .csui-text[title="Created new revision ‘Revision 1.1’ successfully."]');
        this.seeElement('.csui-messagepanel.csui-success .csui-text[title="Created new revision ‘Revision 1.1’ successfully."]');
        this.say('Verify that "Go to location" option is available in global message');
        this.seeElement('.csui-messagepanel.csui-success .csui-gotolocation-url');
      },

      verifyRevisionTab: function (CDName) {
        this.seeElement(".csui-perspective-breadcrumb .binf-breadcrumb > li .csui-breadcrumb[title='" + CDName + "']");
        this.seeElement('.csui-perspective-breadcrumb .binf-breadcrumb > li .csui-breadcrumb[title="Revision 1.1"]');
        this.seeElement('.csui-perspective-breadcrumb .binf-breadcrumb > li.binf-active');
      },

      verifyErrorMessageForInputField: function (keyEvents) {
        this.fillField('.binf-modal-body .csui-document-name input', ':');
        keyEvents ? this.pressKey(keyEvents):this.click('.binf-modal-footer .cs-add-button');
        this.seeElement('.csui-document-name .title-error-div');
      },

      cancelDialog: function(keyEvents){
        keyEvents ? this.pressKey(keyEvents):this.click('.binf-modal-dialog .binf-modal-footer .binf-btn-default');
        this.waitForDetached('.binf-modal-dialog');
        this.dontSeeElement('.binf-modal-dialog');
      },

      setFocusToHeaderDropdownMenu : async function(){
        await this.executeScript(() => document.getElementsByClassName('.csui-tabletoolbar button.binf-dropdown-toggle').focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('.csui-tabletoolbar button.binf-dropdown-toggle') >= 0;
      },

      setFocusToCompoundDocumentSubmenu : async function(){
        await this.executeScript(() => document.getElementsByClassName('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open li[data-csui-command="compounddocument"]').focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown.binf-open li[data-csui-command="compounddocument"]') >= 0;
      },

      clickOnReorganizeCommand: function () {
        this.seeElement('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open .binf-dropdown-menu li[data-csui-command="reorganize"]');
        this.click('.csui-toolbar-caption .csui-item-title-menu .binf-dropdown-menu li[data-csui-command="compounddocument"].binf-open .binf-dropdown-menu li[data-csui-command="reorganize"]');
        this.waitMaxTimeForElement('.csui-sidepanel .csui-sidepanel-heading[title="Reorganize"]');
        this.seeElement('.csui-sidepanel .csui-sidepanel-heading[title="Reorganize"]');
      },

      validateReorganizeSidepanel: function () {
        this.seeElement('.csui-sidepanel .csui-sidepanel-heading[title="Reorganize"]');
        this.seeElement('.csui-sidepanel .csui-sidepanel-body .csui-compound-document-form .csui-master-button-section');
        this.seeElement('.csui-sidepanel .csui-sidepanel-body .csui-compound-document-form .csui-compound-document-reorder-section .csui-reorder-list');
        this.seeElement('.csui-sidepanel .csui-sidepanel-footer');
      },

      clickOnMasterSwitch: function () {
        this.seeElement('.csui-sidepanel-body .csui-master-button-section .required-fields-switch .binf-switch');
        this.click('.csui-sidepanel-body .csui-master-button-section .required-fields-switch .binf-switch');
      },

      submitReorganize: function () {
        this.seeElement('.csui-sidepanel-footer .cs-sidepanel-btngroup #submit');
        this.click('.csui-sidepanel-footer .cs-sidepanel-btngroup #submit');
        this.waitMaxTimeForElement('.csui-messagepanel .csui-header .csui-text[title="Reorganization of items completed successfully."]');
        this.seeElement('.csui-messagepanel .csui-header .csui-text[title="Reorganization of items completed successfully."]');
      },

      validateReorganizeSidepanelForEmptyCompoundDocument: function () {
        this.seeElement('.csui-compound-document-form .required-fields-switch .binf-switch-disabled');
        this.seeElement('.csui-sidepanel-footer .cs-footer-right .binf-disabled');
      },

      openViewReleases: function () {
        this.openToolbarSubmenu();
        this.openCDSubmenu();
        this.waitMaxTimeForElement('.csui-toolbar-region .binf-dropdown li[data-csui-command="viewreleases"]');
        this.seeElement('.csui-toolbar-region .binf-dropdown li[data-csui-command="viewreleases"]');
        this.click('.csui-toolbar-region .binf-dropdown li[data-csui-command="viewreleases"]');
        this.waitMaxTimeForElement('.binf-tab-content .csui-releases-table');
        this.seeElement('.binf-tab-content .csui-releases-table');
      },

      hoverOverFile: function(fileName){
        this.seeElement(".csui-nodetable .csui-table-cell-name-value[title='" + fileName + "']");
        this.moveCursorTo(".csui-nodetable .csui-table-cell-name-value[title='" + fileName + "']");
        this.seeElement('.csui-nodetable .csui-table-actionbar.csui-table-actionbar-bubble');
      },

      verifyViewReleasesActions: async function(selector, expectedOptions){
        this.waitMaxTimeForElement(selector);
        this.seeElement(selector);
        let Options = await this.grabAttributeFrom(selector,'data-csui-command');
        return JSON.stringify(Options) === JSON.stringify(expectedOptions);
      },
    });
}