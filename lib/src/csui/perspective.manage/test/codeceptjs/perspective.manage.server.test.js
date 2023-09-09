/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 const chai = require('chai')
 const expect = chai.expect;
 const Data = require('./data.js');
 
 Feature('Perspective Manager Live Server Test cases');

 BeforeSuite((I) => {
    I.navigateToTestFolderByName('CONTENT_SERVER',Data.folderName);
    I.ensureNotInAccesibilityMode();
});

Scenario('Open perspective manager',(PM) => {
    PM.openPerspectiveManager();
});

Scenario('Verify Perspective Manager header',(PM) => {
    PM.verifyPerspectiveManagerHeader();
});

Scenario('Click On add perspective', (PM) => {
    PM.checkAddPerspectiveSidePanel();
});

Scenario('Verify change page layout ',(PM) => {
    PM.verifyChangePageLayout();
});

Scenario('Click on a widget without configuration and form should not be displayed',(PM) => {
    PM.verifyWidgetWithoutConfiguration();
});

Scenario('Click on widget with configuration and check whether popover is closed',(PM) => {
    PM.clickOnWidgetWithConfig();
});

Scenario('Click on a widget with configuration and form should be displayed',(PM) => {
    PM.verifyWidgetWithConfiguration();
});

Scenario('Click outside config widget and check popover is closed',(PM) => {
    PM.checkPopoverClosed();
});

Scenario('Add shortcut widget to perspective view',async (PM) => {
    PM.openPerspectiveSidePanel();
    expect(await PM.showAccordionListOfModules('"Standard Widgets"')).to.be.true;
    PM.dragAndDropWidget('"Shortcut Group"','"shortcuts"');
});

Scenario('Check emtpy (+) shortcut and open callout after dropping of shortcut widget', (PM) => {
    PM.verifyEmptyShortcutWidget(); 
});

Scenario('Verify error message by clicking outside of empty(+) shortcut',async (PM) => {
    expect(await PM.verifyEmptyShortcutError()).to.be.true;
});

Scenario('Remove shortcut widget by clicking close button',(PM) => {
    PM.deleteShortcutWidget();
});

Scenario('Add shortcut widget again to configure',async (PM) => {
    PM.openPerspectiveSidePanel();
    expect(await PM.showAccordionListOfModules('"Standard Widgets"')).to.be.true;
    PM.dragAndDropWidget('"Shortcut Group"','"shortcuts"');
});

Scenario(' click outside of empty(+) shortcut and check error message',async (PM) => {
    expect(await PM.verifyEmptyShortcutError()).to.be.true;
});

Scenario('Configure shortcut widget',(PM) => {
    PM.configureShortcut();
});

Scenario('Verify whether error message is removed and save button is enabled after configuration',async (PM) => {
    expect(await PM.verifyShortcutAfterConfig(2)).to.be.true;
});

Scenario('out focus and check pop over is closed', (PM) => {
    PM.outFocusToRemovePopover();
});

Scenario('Add another shorcut(2nd) by configuring widget',(PM) => {
    PM.configureShortcut();
});

Scenario('Popover should remain open after configuring',(I) => {
    I.seeElement('.csui-pman-editable-widget .binf-popover');
});

Scenario('verify second shortcut after config and length of shortcut items must be 3',async (PM) => {
    expect(await PM.verifyShortcutAfterConfig(3)).to.be.true;
});

Scenario('out focus to add another shortcut and check pop over is closed', (PM) => {
    PM.outFocusToRemovePopover();
});

Scenario('Add third shorcut by configuring widget',(PM) => {
    PM.configureShortcut();
});

Scenario('Popover should remain open after configuring third shortcut',(I) => {
    I.seeElement('.csui-pman-editable-widget .binf-popover');
});

Scenario('verify third shortcut after config and length of shortcut items must be 4',async (PM) => {
    expect(await PM.verifyShortcutAfterConfig(4)).to.be.true;
});

Scenario('out focus to add fourth shortcut and check pop over is closed', (PM) => {
    PM.outFocusToRemovePopover();
});

Scenario('Add fourth shorcut by configuring widget',(PM) => {
    PM.configureShortcut();
});

Scenario('Popover should remain open after configuring fourth shortcut',(I) => {
    I.seeElement('.csui-pman-editable-widget .binf-popover');
});

Scenario('verify fourth shortcut after config and length of shortcut items must be 4 and empty(+) shortcut should not be there',async (PM) => {
    expect(await PM.verifyFourthShortcutAfterConfig(4)).to.be.true;
});

Scenario('out focus from shortcut widget',(PM) => {
    PM.outFocusToRemovePopover();
});

Scenario('Change any shortcut item configuration and verify live data',(PM) => {
    PM.changeShortcutConfig(3);
});

Scenario('Popover should remain open after changing configuration of any shortcut',(I) => {
    I.seeElement('.csui-pman-editable-widget .binf-popover');
});

Scenario('Open and verify standard widget modules accordion',async (PM) => {
    PM.openPerspectiveSidePanel();
    expect(await PM.showAccordionListOfModules('"Standard Widgets"')).to.be.true;
});

Scenario('Drag and drop favorites widget from standard widgets into Perspective view',(PM) => {
    PM.dragAndDropWidget('"Favorites"','"favorites"');
});

Scenario('Close perspective panel',(PM) => {
    PM.closePerspectivePanel();
});

Scenario('Check empty placeholder in flow perspective',(PM) => {
    PM.checkEmptyPlaceholder();
});

Scenario('Verify existing widget', (PM) => {
    PM.verifyExistingWidget();
});

Scenario('Delete favorites widget from perspective',(PM) => {
    PM.deleteWidgetFromPerspective();
});

Scenario('Open perspective side panel',(PM) => {
    PM.openPerspectiveSidePanel();
});

Scenario('Open layout side panel', (PM) => {
    PM.openLayoutTab();
});

Scenario('Check that current layout is highlighted', (I) => {
    I.seeElement('.csui-layout-item.binf-active[title="Flow layout"] .csui-layout-flow');
});

Scenario('Change layout from flow to LCR layout',(PM) => {
    PM.clickOnChangePageLayout();
});

Scenario('Confirm change in page layout by clicking yes on dialog',(PM) => {
    PM.changePageLayout();
});

Scenario('Verify all widgets are removed after changing layout',async (PM) => {
    expect(await PM.verifyAllWidgetsRemoved()).to.be.true;
});