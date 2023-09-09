/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 module.exports = function() {
    return actor({
      openPerspectiveManager: function() {
        this.seeElement('.csui-profile a.nav-profile');
        this.click('.csui-profile a.nav-profile');
        this.waitMaxTimeForElement('.csui-profile-dropdown [data-csui-command="editperspective"]');
        this.seeElement('.csui-profile-dropdown [data-csui-command="editperspective"]');
        this.click('.csui-profile-dropdown [data-csui-command="editperspective"]');
        this.waitMaxTimeForElement('.pman-header .pman-left-tools .icon-toolbarAdd');
        this.seeElement('.pman-header .pman-left-tools .icon-toolbarAdd');
      },

      verifyPerspectiveManagerHeader: function() {
        this.waitMaxTimeForElement('.pman-header .pman-left-tools .icon-toolbarAdd');
        this.seeElement('.pman-header .pman-left-tools .icon-toolbarAdd');
        this.waitMaxTimeForElement('.pman-header .pman-right-tools .icon-save');
        this.seeElement('.pman-header .pman-right-tools .icon-save');
        this.waitMaxTimeForElement('.pman-header .pman-right-tools .cancel-edit');
        this.seeElement('.pman-header .pman-right-tools .cancel-edit');
      },

      checkAddPerspectiveSidePanel: function(){
        this.click('.pman-tools-container .pman-left-tools> ul > li .icon-toolbarAdd');
        this.waitMaxTimeForElement('.pman-pannel-wrapper.binf-active');
        this.seeElement('.pman-pannel-wrapper.binf-active');
        this.waitMaxTimeForElement('.csui-pman-panel .load-container.binf-hidden');
        this.dontSeeElement('.csui-pman-panel .load-container');
        this.waitMaxTimeForElement('.csui-tab-pannel .csui-layout-tab');
        this.seeElement('.csui-tab-pannel .csui-layout-tab');
        this.seeElement('.csui-tab-pannel .csui-widget-tab');
      },

      openPerspectiveSidePanel: function () {
        this.click('.pman-tools-container .pman-left-tools> ul > li .icon-toolbarAdd');
        this.waitMaxTimeForElement('.pman-pannel-wrapper.binf-active');
        this.seeElement('.pman-pannel-wrapper.binf-active');
      },

      closePerspectivePanel: function () {
        this.click('.pman-tools-container .pman-left-tools> ul > li .icon-toolbarAdd');
        this.waitForDetached('.pman-pannel-wrapper.binf-active');
        this.dontSeeElement('.pman-pannel-wrapper.binf-active');
      },

      verifyChangePageLayout: function () {
        this.click('.csui-tab-pannel .csui-layout-tab');
        this.waitMaxTimeForElement('.csui-list-pannel .csui-layout-item');
        this.seeElement('.csui-list-pannel .csui-layout-item');
        this.click('.csui-pman-list .arrow_back');
        this.waitForDetached('.csui-list-pannel .csui-layout-item');
        this.dontSeeElement('.csui-list-pannel .csui-layout-item');
        this.seeElement('.csui-tab-pannel .csui-widget-tab');
      },

      showAccordionListOfModules:async function (accordionHeaderTitle){
        this.seeElement('.cs-module-list .csui-module-group .csui-accordion-header[title=' + accordionHeaderTitle + ']');
        this.click('.cs-module-list .csui-module-group .csui-accordion-header[title=' + accordionHeaderTitle + ']');
        this.waitMaxTimeForElement('.csui-module-group.csui-accordion-visible');
        this.seeElement('.csui-module-group.csui-accordion-visible');
        let modulesList = await this.grabAttributeFrom('.csui-module-group.csui-accordion-visible .csui-widget-item','class');
        return modulesList.length > 0;
      },

      dragAndDropWidget: function (widgetTitle, widgetType) {
        this.seeElement('.csui-module-group.csui-accordion-visible .csui-widget-item[title=' + widgetTitle + ']');
        this.scrollTo('.csui-perspective-placeholder');
        this.seeElement('.csui-perspective-placeholder');
        this.wait(1);
        this.dragAndDrop('.csui-module-group.csui-accordion-visible .csui-widget-item[title=' + widgetTitle + ']',
                         '.csui-perspective-placeholder',
                          '.csui-pman-dnd-active .csui-widget-template');
        this.waitMaxTimeForElement('.csui-pman-editable-widget[data-csui-widget_type=' + widgetType + ']');
        this.seeElement('.csui-pman-editable-widget[data-csui-widget_type=' + widgetType + ']');
      },

      checkEmptyPlaceholder: function () {
        this.seeElement('.cs-perspective .csui-pman-editable-widget.csui-pman-placeholder-container');
      },

      verifyExistingWidget: function () { 
        this.seeElement('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"]');
      },

      deleteWidgetFromPerspective: function(){
        this.scrollTo('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"]');
        this.moveCursorTo('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"]');
        this.waitForVisible('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"] .csui-pman-widget-close');
        this.seeElement('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"] .csui-pman-widget-close');
        this.click('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"] .csui-pman-widget-close');
        this.waitMaxTimeForElement('.binf-widgets .binf-modal-dialog .binf-modal-footer .csui-yes');
        this.click('.binf-widgets .binf-modal-dialog .binf-modal-footer .csui-yes');
        this.waitForDetached('.binf-widgets .binf-modal-dialog .binf-modal-footer .csui-yes');
        this.waitForDetached('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"]');
        this.dontSeeElement('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="favorites"]');
      },

      verifyWidgetWithoutConfiguration: function () {
        this.seeElement('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="myassignments"]');
        this.click('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="myassignments"]');
        this.waitMaxTimeForElement('.csui-pman-editable-widget .binf-popover.binf-in');
        this.seeElement('.csui-pman-editable-widget .binf-popover.binf-in');
        this.dontSeeElement('.csui-pman-editable-widget .binf-popover.binf-in .cs-form.cs-form-create');
      },

      clickOnWidgetWithConfig: function () {
        this.seeElement('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"]');
        this.click('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"]');
        this.waitForDetached('.csui-pman-editable-widget .binf-popover.binf-in');
        this.dontSeeElement('.csui-pman-editable-widget .binf-popover.binf-in');
      },

      verifyWidgetWithConfiguration: function () {
        this.seeElement('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"]');
        this.click('.cs-perspective .csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"]');
        this.waitMaxTimeForElement('.csui-pman-editable-widget .binf-popover.binf-in');
        this.seeElement('.csui-pman-editable-widget .binf-popover.binf-in');
        this.waitMaxTimeForElement('.csui-pman-editable-widget .binf-popover.binf-in .cs-form.cs-form-create');
        this.seeElement('.csui-pman-editable-widget .binf-popover.binf-in .cs-form.cs-form-create');
      },

      checkPopoverClosed: function () {
        this.click('.pman-header');
        this.waitForDetached('.csui-pman-editable-widget .binf-popover.binf-in');
        this.dontSeeElement('.csui-pman-editable-widget .binf-popover.binf-in');
      },

      verifyEmptyShortcutWidget: function () {
        this.seeElement('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .binf-popover');
        this.seeElement('.csui-large.csui-pman-shortcut-new');
      },

      verifyEmptyShortcutError:async function () {
        this.click('.pman-header');
        this.waitForDetached('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .binf-popover');
        this.dontSeeElement('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .binf-popover');
        this.seeElement('.csui-pman-shortcut-new .binf-perspective-has-error');
        this.say("Save button should be disabled for perspective manager");
        this.seeElement('.pman-right-tools .icon-save[disabled]');
        let errorMessage = await this.grabAttributeFrom('.csui-pman-shortcut-new .csui-pman-widget-error-message','innerText');
        return errorMessage == "Configuration needed.";
      },

      deleteShortcutWidget: function () {
        this.moveCursorTo('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"]');
        this.seeElement('.csui-pman-shortcut-new .csui-pman-widget-close');
        this.click('.csui-pman-shortcut-new .csui-pman-widget-close');
        this.waitMaxTimeForElement('.binf-modal-dialog .csui-yes');
        this.click('.binf-modal-dialog .csui-yes');
        this.dontSeeElement('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"]');
      },

      configureShortcut: function () {
        this.click('.csui-pman-shortcut-new .csui-pman-widget-masking');
        this.waitMaxTimeForElement('.csui-pman-shortcut-new .binf-popover');
        this.seeElement('.csui-pman-shortcut-new .binf-popover');
        this.seeElement('.csui-pman-shortcut-new .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-toggle');
        this.click('.csui-pman-shortcut-new .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-toggle');
        this.waitMaxTimeForElement('.csui-pman-shortcut-new .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-menu li:nth-child(2)');
        this.seeElement('.csui-pman-shortcut-new .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-menu li:nth-child(2)');
        this.click('.csui-pman-shortcut-new .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-menu li:nth-child(2)');
        this.waitForInvisible('.csui-pman-shortcut-new .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-menu li:nth-child(2)');
        this.click('.csui-pman-shortcut-new .binf-popover .cs-formfield input:nth-child(1)');
        this.waitForDetached('.csui-pman-shortcut-new .binf-perspective-has-error');
        this.dontSeeElement('.csui-pman-shortcut-new .binf-perspective-has-error');
      },

      outFocusToRemovePopover: function () {
        this.click('.pman-header');
        this.waitForDetached('.pman-pannel-wrapper.binf-active');
        this.dontSeeElement('.pman-pannel-wrapper.binf-active');
        this.click('.pman-header');
        this.waitForDetached('.csui-pman-editable-widget .binf-popover');
        this.dontSeeElement('.csui-pman-editable-widget .binf-popover');
      },

      verifyShortcutAfterConfig:async function (itemLength) {
        this.dontSeeElement('.csui-pman-shortcut-new .binf-perspective-has-error');
        this.dontSeeElement('.pman-right-tools .icon-save[disabled]');
        this.waitMaxTimeForElement('.csui-pman-shortcut-new');
        this.seeElement('.csui-pman-shortcut-new');
        let shortcutItems = await this.grabAttributeFrom('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .csui-shortcut-item','class');
        return itemLength == shortcutItems.length;
      },

      verifyFourthShortcutAfterConfig:async function (itemLength) {
        this.dontSeeElement('.csui-pman-shortcut-new .binf-perspective-has-error');
        this.dontSeeElement('.pman-right-tools .icon-save[disabled]');
        this.dontSeeElement('.csui-pman-shortcut-new');
        let shortcutItems = await this.grabAttributeFrom('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .csui-shortcut-item','class');
        return itemLength == shortcutItems.length;
      },

      changeShortcutConfig: function (shortcutIndex) {
        this.seeElement('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .csui-shortcut-item:nth-child(' + shortcutIndex + ')');
        this.click('.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .csui-shortcut-item:nth-child(' + shortcutIndex + ')');
        this.seeElement('.csui-pman-editable-widget .binf-popover');
        this.seeElement('.csui-pman-editable-widget .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-toggle');
        this.click('.csui-pman-editable-widget .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-toggle');
        this.seeElement('.csui-pman-editable-widget .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-menu li:nth-child(4)');
        this.click('.csui-pman-editable-widget .binf-popover .csui-field-select:nth-child(3) .binf-dropdown-menu li:nth-child(4)');
        this.click('.csui-pman-editable-widget .binf-popover .cs-formfield input:nth-child(1)');
        this.dontSeeElement('.csui-pman-shortcut-new');
      },

      clickOnChangePageLayout: function () {
        this.click('.csui-layout-item .csui-layout-lcr');
        this.waitMaxTimeForElement('.csui-alert .binf-modal-dialog');
        this.seeElement('.csui-alert .binf-modal-dialog');
      },

      changePageLayout: function () {
        this.click('.csui-alert .binf-modal-dialog .csui-yes');
        this.waitForDetached('.csui-alert .binf-modal-dialog .csui-yes');
        this.dontSeeElement('.csui-alert .binf-modal-dialog .csui-yes');
        this.waitMaxTimeForElement('.cs-left-center-right-perspective [data-csui-widget_type="perspective.placeholder"]')
        this.seeElement('.cs-left-center-right-perspective [data-csui-widget_type="perspective.placeholder"]');
      },

      openLayoutTab: function () {
        this.click('.csui-tab-pannel .csui-layout-tab');
        this.waitMaxTimeForElement('.csui-list-pannel .csui-layout-item');
        this.seeElement('.csui-list-pannel .csui-layout-item');
      },

      verifyAllWidgetsRemoved: async function () {
        this.seeElement('.cs-perspective .csui-pman-editable-widget.csui-pman-placeholder-container');
        let emptyPlaceholders = await this.grabAttributeFrom('.cs-perspective .csui-pman-editable-widget.csui-pman-placeholder-container','class');
        return emptyPlaceholders.length == 3;
      }
    });
};