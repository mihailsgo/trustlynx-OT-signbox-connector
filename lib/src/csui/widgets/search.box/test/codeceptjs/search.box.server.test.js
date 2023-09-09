/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Search Box Widget Live Server Test cases');

BeforeSuite((I) => {
        I.loginTo('CONTENT_SERVER');
        I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
        I.ensureNotInAccesibilityMode();
});

Scenario('Click on global search icon', (I) => {
        I.seeElement(".csui-search-box .icon-global-search");
        I.click(".csui-search-box .icon-global-search");
        I.waitMaxTimeForElement(".csui-search-input-container .csui-input", 10);
        I.seeElement(".csui-search-input-container .csui-input");
});

Scenario('Search Box dropdown must be hidden initially', async (SB) => {
        expect(await SB.checkSearchDropDownClosed()).to.be.true;
});

Scenario('Search dropdown must be open when we click on search box', async (I, SB) => {
        expect(await SB.checkSearchDropDown()).to.be.true;
});

Scenario('Verifying search dropdown labels ', async (I) => {
        I.waitMaxTimeForElement(".csui-search-label");
        I.seeElement(".csui-search-label");
        let searchLabel = await I.grabTextFrom('.csui-search-label');
        expect(searchLabel[0]).to.equal("Search within");
        expect(searchLabel[1]).to.equal("Recent search forms");
});

Scenario('"Seach within here" should not be present in landing page ', async (I) => {
        I.waitMaxTimeForElement(".csui-search-options-dropdown");
        I.dontSeeElement(".csui-searchbox-option");
});

Scenario('Check slice ', async (I, SB) => {
        I.waitMaxTimeForElement(".csui-search-popover-row");
        I.seeElement(".csui-search-popover-row");
        let check = await I.grabAttributeFrom('.csui-search-popover-checked', 'class');
        expect(check[0].indexOf("icon-listview-checkmark")).to.be.lt(0);
        expect(await SB.selectSlices()).to.be.true;
});

Scenario('Uncheck slice', async (SB) => {
        expect(await SB.unSelectSlices()).to.be.true;
});

Scenario('Show more slices ', async (I, SB) => {
        expect(await SB.expectOnly3Slices()).to.be.true;
        let check = await I.executeScript(() => document.querySelector(".csui-slices-more") !== null);
        if (check) {
                expect(await SB.showMoreSlices()).to.be.true;
        }
});

Scenario('Search form shown in side panel', async (SB) => {
        expect(await SB.openSearchFormsInSidePanel()).to.be.true;
});

Scenario('Close side panel', async (SB) => {
        expect(await SB.closeSidePanel()).to.be.true;
});

Scenario('More search forms', async (SB) => {
        expect(await SB.checkSearchDropDown()).to.be.true;
        SB.openMoreSearchForms();
});

Scenario('Close side panel', async (SB) => {
        expect(await SB.closeSidePanel()).to.be.true;
});

Scenario('Navigate to Enterprise', async (I) => {
        I.navigateToEnterprise('CONTENT_SERVER');
        I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
        I.seeElement(".csui-search-box .icon-global-search");
        I.click(".csui-search-box .icon-global-search");
        I.waitMaxTimeForElement(".csui-search-input-container .csui-input");
        I.seeElement(".csui-search-input-container .csui-input");
});

Scenario('Search Box dropdown must be hidden initially in Enterprise', async (SB) => {
        expect(await SB.checkSearchDropDownClosed()).to.be.true;
});

Scenario('Search Box dropdown must be open when we click on search box in Enterprise', async (SB) => {
        expect(await SB.checkSearchDropDown()).to.be.true;
});

Scenario('Verify Seach within here is present in Enterprise', async (I) => {
        I.waitMaxTimeForElement(".csui-searchbox-option");
        I.seeElement(".csui-searchbox-option");
        I.seeCheckboxIsChecked('.csui-searchbox-option');
});

Scenario('Uncheck "Seach within here" in Enterprise', async (I) => {
        I.click('.csui-searchbox-option');
        I.dontSeeCheckboxIsChecked('.csui-searchbox-option');
});

Scenario.skip('Search dropdown using KN', () => {
        Scenario('Login to server', async (I, SB) => {
                I.loginTo('CONTENT_SERVER');
                I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
                I.seeElement(".csui-search-box .icon-global-search");
                I.wait(10);
                I.pressKey('Tab');
                let check = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(check.indexOf('icon-global-search')).to.be.gte(0);
                let searchBox = await I.grabAttributeFrom('.csui-search', 'class');
                expect(searchBox.indexOf("search-input-open")).to.be.lt(0);
                I.pressKey('Enter');
                I.waitMaxTimeForElement(".csui-search.search-input-open");
                I.seeElement(".csui-search.search-input-open");
                expect(await SB.checkSearchDropDown("Enter")).to.be.true;
        
        });
        
        Scenario('Select and unselect slices', async (SB) => {
                expect(await SB.slicesOrSearchFormKey('Tab', 0, '.csui-search-popover-row-body')).to.be.true;
                expect(await SB.selectSlices("Enter")).to.be.true;
                expect(await SB.unSelectSlices("Enter")).to.be.true;
        });
        
        Scenario('Arrow up and down keys for slices', async (SB) => {
                expect(await SB.slicesOrSearchFormKey('ArrowDown', 1, '.csui-search-popover-row-body')).to.be.true;
                expect(await SB.slicesOrSearchFormKey('ArrowUp', 0, '.csui-search-popover-row-body')).to.be.true;
        });
        
        Scenario('Show more slices', async (I, SB) => {
                let checkShowMore = await I.executeScript(function () {
                        return document.querySelector(".csui-slices-more") !== null;
                });
                if (checkShowMore) {
                        expect(await I.checkFocusOnElement('.csui-slices-more', 'Tab')).to.be.true;
                        expect(await SB.showMoreSlices()).to.be.true;
                }
        });
        
        Scenario('Arrow up and down keys for search forms', async (I,SB) => {
                expect(await I.checkFocusOnElement('.csui-searchforms-popover-row', 'Tab')).to.be.true;
                expect(await SB.slicesOrSearchFormKey('ArrowDown', 1, ".csui-search-form-item")).to.be.true;
                expect(await SB.slicesOrSearchFormKey('ArrowUp', 0, ".csui-search-form-item")).to.be.true;
        });
        
        Scenario('Open search forms', async (SB) => {
                expect(await SB.openSearchFormsInSidePanel('Enter')).to.be.true;
        });
        
        Scenario('Close search forms', async (I) => {
                I.wait(3);
                let checkClose;
                do {
                        I.pressKey(['Shift', 'Tab']);
                        checkClose = await I.executeScript(() => document.activeElement.getAttribute('class'));
                } while (checkClose === null || checkClose.indexOf('csui-sidepanel-close') < 0);
                I.pressKey('Enter');
                I.wait(5);
                let check = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(check.indexOf('icon-global-search')).to.be.gte(0);
                I.pressKey(['Shift', 'Tab']);
                check = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(check.indexOf('csui-input')).to.be.gte(0);
        });
        
        Scenario('More search forms', async (I, SB) => {
                I.pressKey('Tab');
                I.pressKey('Tab');
                await I.executeScript(() => document.querySelector(".csui-slices-more") !== null) ? I.pressKey('Tab') : null;
                I.pressKey('Tab');
                let checkShowMoreForms = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(checkShowMoreForms.indexOf('csui-searchforms-show-more')).to.be.gte(0);
                SB.openMoreSearchForms('Enter');
        });
        
        Scenario('Close more search forms', async (I) => {
                let checkClose;
                do {
                        I.pressKey('Tab');
                        checkClose = await I.executeScript(() => document.activeElement.getAttribute('class'));
                } while (checkClose === null || checkClose.indexOf('csui-sidepanel-close') < 0);
                I.pressKey('Enter');
                I.wait(5);
                let check = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(check.indexOf('icon-global-search')).to.be.gte(0);
        });
        
        Scenario('Navigate to Enterprise', async (I) => {
                I.navigateToEnterprise('CONTENT_SERVER');
                I.waitMaxTimeForElement(".cs-perspective-panel .load-container.binf-hidden");
                I.seeElement(".csui-search-box .icon-global-search");
        });
        
        Scenario('Open Search dropdown', async (I, SB) => {
                I.wait(10);
                for (let i = 0; i < 3; i++) {
                        I.pressKey('Tab');
                }
                let check = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(check.indexOf('icon-global-search')).to.be.gte(0);
                let searchBox = await I.grabAttributeFrom('.csui-search', 'class');
                expect(searchBox.indexOf("search-input-open")).to.be.lt(0);
                expect(await SB.checkSearchDropDown('Enter')).to.be.true;
        });
        Scenario('Search within check', async (I) => {
                expect(await I.checkFocusOnElement('.csui-searchbox-option.selected', 'Tab')).to.be.true;
                I.pressKey('Enter');
                let check = await I.executeScript(() => document.activeElement.getAttribute('class'));
                expect(check.indexOf('selected')).to.be.lt(0);
        });
       
});

