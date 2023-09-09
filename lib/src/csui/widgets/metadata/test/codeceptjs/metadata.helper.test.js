/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


module.exports = function () {
    return actor({
        openPropertiesOfDocument(docName) {
            this.seeElement(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + docName + "']");
            this.click(".csui-nodetable .csui-saved-item .csui-checkbox[title='Select " + docName + "']");
            this.waitMaxTimeForElement('.csui-table-rowselection-toolbar .csui-toolbar-region');
            this.seeElement('.csui-table-rowselection-toolbar .csui-toolbar-region');
            this.click('.csui-toolbar-region li[data-csui-command="properties"]');
            this.waitMaxTimeForElement(".metadata-content .metadata-content-header");
            this.seeElement(".metadata-content .metadata-content-header");
        },

        async checkList(dropdownList, menuList) {
            for (var i = 0; i < menuList.length; i++) {
                if(dropdownList.indexOf(menuList[i]) < 0) {
                    return false;
                }
            }
            return true;
        },

        async turnOnOnlyRequiredFields(keyEvents) {
            this.seeElement(".only-required-fields-label");
            this.seeElement(".csui-tab-contents-header .required-field-switch .binf-switch-on");
            keyEvents ? this.pressKey(keyEvents) : this.click(".csui-tab-contents-header .required-field-switch .binf-switch-on");
            this.dontSeeElement(".csui-tab-contents-header .required-field-switch .binf-switch-on");
            this.seeElement(".csui-tab-contents-header .required-field-switch .binf-switch-off");
        },

        async turnOffOnlyRequiredFields(keyEvents) {
            this.seeElement(".only-required-fields-label");
            this.seeElement(".csui-tab-contents-header .required-field-switch .binf-switch-off");
            keyEvents ? this.pressKey(keyEvents) : this.click(".csui-tab-contents-header .required-field-switch .binf-switch-off");
            this.dontSeeElement(".csui-tab-contents-header .required-field-switch .binf-switch-off");
            this.seeElement(".csui-tab-contents-header .required-field-switch .binf-switch-on");
        },

        async updateDescriptionField(keyEvents) {
            keyEvents ? this.pressKey(keyEvents) : this.click(".metadata-pane-right .description_section.general-information .btn-container");
            this.seeElement(".metadata-pane-right .description_section.general-information  .editable");
            let text = await this.grabTextFrom(".metadata-pane-right .description_section.general-information .editable");
            this.fillField('.metadata-pane-right .description_section.general-information .editable', Date.now());
            let updatedText = await this.grabTextFrom(".metadata-pane-right .description_section.general-information .editable");
            this.click(".cs-form.csui-general-form");
            return (updatedText.length > text.length);
        },

        async addRequiredCategory() {
            this.say("Click on add category");
            this.click(".icon-toolbarAdd");
            this.click(".metadata-add-properties .binf-dropdown-menu>li:nth-of-type(1)");
            this.waitMaxTimeForElement(".binf-modal-content");
            this.seeElement(".binf-modal-content");
            this.say("Click on search category.");
            this.click(".cs-icon.icon-sv-search.csui-acc-focusable-active");
            this.waitForElement(".binf-form-control.cs-filter-input");
            this.seeElement(".binf-form-control.cs-filter-input");
            this.say("Search for 'req'");
            this.fillField(".binf-form-control.cs-filter-input", "req");
            this.wait(2);
            let categoryToAdd = await this.grabTextFrom(".csui-item-standard.binf-list-group-item:nth-of-type(1) .csui-list-item-title");
            this.say("Select the first category");
            this.click(".csui-item-standard.binf-list-group-item:nth-of-type(1)");
            this.click(".binf-btn.binf-btn-primary");
            this.say("Fill the required integer field");
            this.fillField(".binf-modal-content .cs-field-write-inner>input", "" + Math.floor(Math.random() * 10));
            this.say("Click on add");
            this.seeElement(".binf-btn.binf-btn-primary");
            this.click(".binf-btn.binf-btn-primary");
            this.wait(2);
            return categoryToAdd;
        },

        async addCategory(categoryName) {
            this.say("Click on add category");
            this.click(".icon-toolbarAdd");
            this.click(".metadata-add-properties .binf-dropdown-menu>li:nth-of-type(1)");
            this.seeElement(".binf-modal-content");
            this.say("Click on search category.");
            this.click(".cs-icon.icon-sv-search.csui-acc-focusable-active");
            this.waitForElement(".binf-form-control.cs-filter-input");
            this.say("Search for: Automation");
            this.fillField(".binf-form-control.cs-filter-input", 'Automation');
            this.wait(2);
            this.say("Select the Automation category folder");
            this.click(".csui-item-standard.binf-list-group-item:nth-of-type(1)");
            this.say("Click on search category in the right side");
            this.click(".cs-icon.icon-sv-search.csui-acc-focusable-active");
            this.waitForElement(".csui-slideMidLeft .binf-form-control.cs-filter-input.csui-acc-focusable-active");
            this.say("Search for: " + categoryName);
            this.fillField(".csui-slideMidLeft .binf-form-control.cs-filter-input", categoryName);
            this.wait(2);
            this.say("Select the " + categoryName + " category");
            this.click(".csui-slideMidLeft .csui-item-standard.binf-list-group-item:nth-of-type(1)");
            this.click(".binf-btn.binf-btn-primary");
            this.say("Click on add");
            this.seeElement(".binf-btn.binf-btn-primary");
            this.click(".binf-btn.binf-btn-primary");
            this.wait(2);
        },

        async deleteCategory() {
            let getCategoryList = await this.grabTextFrom(".metadata-inner-wrapper .tab-links .binf-nav.binf-nav-pills>li");
            let categoryLength = getCategoryList.length;
            while (categoryLength > 2) {
                this.seeElement(".cs-tablink-delete:first-of-type .icon.category_delete");
                this.click(".cs-tablink-delete:first-of-type .icon.category_delete");
                this.seeElement(".binf-modal-header.warning-header");
                this.seeElement(".binf-btn.binf-btn-primary");
                this.click(".binf-btn.binf-btn-primary");
                this.dontSeeElement(".binf-modal-header.warning-header");
                categoryLength--;
            }
        }
    });
};