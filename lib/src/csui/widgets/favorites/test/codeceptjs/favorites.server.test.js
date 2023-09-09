/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


const chai = require('chai')
const expect = chai.expect;

Feature('Favorties Widget Live Server Test Cases');

BeforeSuite((I) => {
    I.loginTo('CONTENT_SERVER');
    I.ensureNotInAccesibilityMode();
});

Scenario('Check Global Favorite Icon', (I) => {
    I.seeElement('.csui-icon-favorites.favorite_header_icon');
});

Scenario('Click on favorite global icon', (FVR) => {
    FVR.clickOnGlobalFavoriteIcon();
});

Scenario('Check icons in global favorite container', (FVR) => {
    FVR.hoverOnGlobalFavoritesHeader();
    FVR.verifyGlobalFavoriteIcons();
});

Scenario('Validate Search button in global favorites', (FVR) => {
    FVR.validateGlobalFavoriteSearchButton();
});

Scenario('Validate Search Input filed in Global Favorites', (FVR) => {
    FVR.validateGlobalFavoriteSearchInputField();
});

Scenario('Check Clear Search button in Global Favorite', (FVR) => {
    FVR.checkGlobalFavoriteClearSearchButton();
});

Scenario('Check Close Search Button in Global Favorite', (FVR) => {
    FVR.checkGlobalFavortieCloseSearchButton();
});

Scenario('Verify Open Expanded view button in Global favorites', (I, FVR) => {
    I.click('.csui-favorites-view-container .tile-icons [title="Open favorites view"]');
    FVR.validateExpandedFavoritesViewForServer();
});

Scenario('Verify back button in Favorites view', (FVR) => {
    FVR.clickGoBackInFavoritesView();
});

Scenario('Hover on Favorite Widget', (FVR) => {
    FVR.hoverOnFavoriteWidget();
});

Scenario('Check favorite widget tile', (FVR) => {
    FVR.checkFavoritesWidget();
});

Scenario('Verify favorite widget icons', (FVR) => {
    FVR.verifyFavoritesWidgetIcons();
});

Scenario('Check more actions on favorite item', (FVR) => {
    FVR.hoverOnListItem(1);
    FVR.validateMoreActionsIcon();
});

Scenario('Validate Search button in favorite widget', async (FVR) => {
    FVR.hoverOnFavoriteWidget();
    expect(await FVR.validateSearchButton()).to.be.true;
});

Scenario('Validate Search Input field', (I, FVR) => {
    FVR.validateSearchInputField();
});

Scenario('Check Clear Search button', (FVR) => {
    FVR.checkClearSearchButton();
});

Scenario('Check Close Search Button', (FVR) => {
    FVR.checkCloseSearchButton();
});

Scenario('Navigate to Expanded view', (I, FVR) => {
    FVR.hoverOnFavoriteWidget();
    I.click('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-icons [title="Open favorites view"]');
    FVR.validateExpandedFavoritesViewForServer();
});

Scenario('Add new favorite group', (FVR) => {
    FVR.addFavoriteGroup();
    FVR.saveFavoriteGroup();
});

Scenario('Rename new favorite group', (FVR) => {
    FVR.renameActiveFavoriteGroup();
});

Scenario('check New Group In GlobalFavorites',async (FVR) => {
    expect(await FVR.checkNewGroupInGlobalFavorites()).to.be.true;
});

Scenario('Navigate to automation test folder', (I, Data) => {
    I.navigateToTestFolderByName('CONTENT_SERVER',Data.automationFolder);
}).injectDependencies({ Data: require('./data.js') });

Scenario('Click favorite icon on a folder', (FVR) => {
    FVR.clickFavoriteIconOnFolder(1);
});

Scenario('Check whether folder name and favorite name are same',async (FVR) => {
    expect(await FVR.matchFavoriteFolderName(1)).to.be.true;
});

Scenario('Add folder to favorite group', (FVR) => {
    FVR.addFolderToFavoriteGroup(1);
});

Scenario('Validate favorite icon after adding folder to favorites', (FVR) => {
    FVR.validateFavoriteIconSelected(1);
});

Scenario('Add multiple folders to favorites', (FVR) => {
    FVR.clickFavoriteIconOnFolder(2);
    FVR.addFolderToFavoriteGroup(2);
    FVR.clickFavoriteIconOnFolder(3);
    FVR.addFolderToFavoriteGroup(3);
});

Scenario('Check newly added favorite folder in global favorites',async (FVR) => {
    FVR.clickOnGlobalFavoriteIcon();
    expect(await FVR.checkNewFavoriteFolderInGlobalFavorites()).to.be.true;
}); 

Scenario('Navigate to expanded view', (I, FVR) => {
    I.click('.csui-favorites-view-container .tile-icons [title="Open favorites view"]');
    FVR.validateExpandedFavoritesViewForServer();
});

Scenario('Select all items', (FVR) => {
    FVR.toggleSelectAllFavorites();
}); 

Scenario('Check toolbar bar actions after select all', (FVR) => {
    FVR.checkToolbarActions();
});

Scenario('Unselect all items', (FVR) => {
    FVR.toggleSelectAllFavorites();
});

Scenario('Check inline actions on favorite item', (FVR) => {
    FVR.hoverOnExpandedViewFavoriteItem();
    FVR.checkInlineActions();
});

Scenario('Remove first favorite in a group', (FVR) => {
    FVR.removeFavorite();
});

Scenario('Validate removed favorite',async (FVR) => {
    expect(await FVR.validateRemovedFavorite()).to.be.true;
}); 

Scenario('Delete favorite group', (FVR) => {
    FVR.deleteActiveFavoriteGroup();
});

Scenario('Check deleted favorite not to be present in Global favorites', (FVR) => {
    FVR.clickOnGlobalFavoriteIcon();
    FVR.deletedFavoriteInGlobalFavorites();
    FVR.clickOnGlobalFavoriteIcon();
});

Scenario('Shift focus to user profile icon',async (I) => {
    expect(await I.checkFocusOnElement('.binf-dropdown-toggle.nav-profile.csui-navbar-icons.csui-acc-focusable.csui-acc-focusable-active','Tab')).to.be.true;
});

Scenario('Shift focus to go back button',async (I) => {
    expect(await I.checkFocusOnElement('.cs-back-button-container','Tab')).to.be.true;
});

Scenario('Shift focus to add favorite button',async (I) => {
    expect(await I.checkFocusOnElement('.csui-favorite-groups-header .csui-groups-header-plus','Tab')).to.be.true;
});

Scenario('Press Enter on add group button and add new group', (I, FVR) => {
    FVR.addFavoriteGroup('Enter');
    I.say('Shift focus to save button');
    FVR.saveFavoriteGroup('Enter');
});

Scenario('Shift focus to rename icon and rename favorite group', (I, FVR) => {
    I.wait(1);
    I.pressKey('Tab');
    FVR.renameActiveFavoriteGroup('Enter');
});

Scenario('Set focus on global favorite icon',async(FVR) => {
    expect(await FVR.setFocusOnGlobalFavoriteIcon()).to.be.true;
});

Scenario('Check newly added group in global favorite by clicking Enter', (FVR) => {
    FVR.checkNewGroupInGlobalFavorites('Enter');
});

Scenario('Navigate to automation test folder ', (I, Data) => {
    I.navigateToTestFolderByName('CONTENT_SERVER',Data.automationFolder);
}).injectDependencies({ Data: require('./data.js') });

Scenario('Set focus to test folder',async (FVR) => {
    expect(await FVR.setFocusOnTestFolder()).to.be.true;
});

Scenario('Shift focus to add favorite icon',async (I) => {
    I.wait(1);
    for(let i = 1; i <= 4; i++) 
        I.pressKey('ArrowRight');
    expect(await  I.checkFocusOnElement('.csui-favorite-star','ArrowRight',1)).to.be.true;
});

Scenario('Add multiple folders to favorite group using KN',async (I, FVR) => {
    for(let i =1; i <= 3; i++){
        FVR.clickFavoriteIconOnFolder(i, 'Enter');
        I.wait(1);
        I.pressKey('Tab');
        FVR.addFolderToFavoriteGroup(i,'Enter');
        I.wait(1);
        I.pressKey('ArrowDown');
    }
    expect(await FVR.setFocusOnGlobalFavoriteIcon()).to.be.true;
});

Scenario('Press enter on global favorite icon in test folder',(I, FVR) => {
    FVR.clickOnGlobalFavoriteIcon('Enter');
});

Scenario('Shift focus to expand icon in global favorites container',async (I) => {
    expect(await I.checkFocusOnElement('.csui-favorites-view-container .tile-icons .cs-open-perspective-button[title="Open favorites view"]','Tab')).to.be.true;
});

Scenario('Shift focus to favorite group in global favorites container',async (I)=> {
    expect(await I.checkFocusOnElement('.csui-favorites-view-container .cs-simpletreelistitem:nth-child(1)','Tab')).to.be.true;
});

Scenario('Check newly added favorite folder in global favorites using KN',async (FVR) => {
    expect(await FVR.checkNewFavoriteFolderInGlobalFavorites('Enter')).to.be.true;
});

Scenario('Navigate to expanded view by shifitng focus to expand icon', (I, FVR) => {
    I.pressKey(['Shift', 'Tab']);
    I.pressKey('Enter');
    FVR.validateExpandedFavoritesViewForServer();
});

Scenario('Shift focus to favorite group in expanded view',async (FVR) => {
    expect(await FVR.setFocusOnFavoriteGroupInExpandedView()).to.be.true;
});

Scenario('Delete favorite group',(I, FVR) => {
    I.wait(1);
    I.pressKey('Enter');
    FVR.deleteActiveFavoriteGroup();
});

Scenario('Navigate to favorite widget test folder',(I, Data) => {
    I.navigateToTestFolderByName('CONTENT_SERVER', Data.folderName);
}).injectDependencies({ Data: require('./data.js') });

Scenario('Shift focus to favorite widget',async (FVR) => {
    expect(await FVR.setFocusOnFavoritesWidget()).to.be.true;
});

Scenario('Enter to open search input field in favorite widget',  (FVR) => {
    FVR.validateSearchButton('Enter');
});

Scenario('Validate Search Input field in  Favorites widget using KN', (FVR) => {
    FVR.validateSearchInputField();
});

Scenario('Shift focus to clear search button and press enter in favorites widget', (I, FVR) => {
    I.pressKey('Tab');
    FVR.checkClearSearchButton('Enter');
});

Scenario('Shift focus to close search button and press enter in favorites widget', (I, FVR) => {
    I.pressKey('Tab');
    FVR.checkCloseSearchButton('Enter');
});

Scenario('Shift focus to expand icon in  favorites widget',async (I) => {
    expect(await I.checkFocusOnElement('.csui-perspective-view .tile-icons .cs-open-perspective-button[title="Open favorites view"]','Tab')).to.be.true;
});

Scenario('Shift focus to favorite group from expand icon in  favorites widget',async (I) => {
    expect(await I.checkFocusOnElement('.csui-perspective-view .cs-simpletreelistitem:nth-child(1)','Tab')).to.be.true;
});

Scenario('Shift focus to favorite item in  favorites widget',async (I) => {
    I.pressKey('ArrowDown');
    expect(await I.checkFocusOnElement(".list-item-title",'Enter',1)).to.be.true;
});

Scenario('Shift focus to more actions icon in  favorites widget',async (I) => {
    expect(await I.checkFocusOnElement('.csui-perspective-view .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn','ArrowRight')).to.be.true;
});

Scenario('verify more actions using enter key',(FVR) => {
    FVR.validateMoreActionsIcon('Enter');
});

Scenario('Set focus on global favorite icon to test KN',async(FVR) => {
    expect(await FVR.setFocusOnGlobalFavoriteIcon()).to.be.true;
});

Scenario('Enter to open global favorites', (I, FVR) => {
    FVR.clickOnGlobalFavoriteIcon('Enter');
    I.seeElement('.csui-favorites-view-container .tile-title[title="Favorites"]');
});

Scenario('Enter to open search input field',  (FVR) => {
    FVR.validateGlobalFavoriteSearchButton('Enter');
});

Scenario('Validate Search Input field in Global Favorites', (FVR) => {
    FVR.validateGlobalFavoriteSearchInputField();
});

Scenario('Shift focus to clear search button and press enter', (I, FVR) => {
    I.pressKey('Tab');
    FVR.checkGlobalFavoriteClearSearchButton('Enter');
});

Scenario('Shift focus to close search button and press enter', (I, FVR) => {
    I.pressKey('Tab');
    FVR.checkGlobalFavortieCloseSearchButton('Enter');
});

Scenario('Shift focus to expand icon in global favorites',async (I) => {
    expect(await I.checkFocusOnElement('.csui-favorites-view-container .tile-icons .cs-open-perspective-button[title="Open favorites view"]','Tab')).to.be.true;
});

Scenario('Shift focus to favorite group from expand icon in global favorites ',async (I) => {
    expect(await I.checkFocusOnElement('.csui-favorites-view-container .cs-simpletreelistitem:nth-child(1)','Tab')).to.be.true;
});

Scenario('Shift focus to favorite item in global favorites',async (I) => {
    I.pressKey('ArrowDown');
    expect(await I.checkFocusOnElement(".list-item-title",'Enter',1)).to.be.true;
});

Scenario('Shift focus to more actions icon in global favorites',async (I) => {
    expect(await I.checkFocusOnElement('.csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn','ArrowRight')).to.be.true;
});

Scenario('verify more actions using enter key in global favorites',(FVR) => {
    FVR.validatGlobalFavoriteMoreActionsIcon('Enter');
});