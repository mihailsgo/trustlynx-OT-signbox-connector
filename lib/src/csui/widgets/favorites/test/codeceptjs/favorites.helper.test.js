/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


module.exports = function () {
    return actor({
      clickOnGlobalFavoriteIcon: function(keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click(".csui-icon-favorites.favorite_header_icon");
      },

      verifyGlobalFavoriteIcons: function () {
        this.seeElement('.csui-favorites-view-container .tile-title[title="Favorites"]');
        this.seeElement('.csui-favorites-view-container .tile-icons .cs-search-button[title="Search"]');
        this.seeElement('.csui-favorites-view-container .tile-icons .cs-open-perspective-button[title="Open favorites view"]');
      },

      verifyFavoritesWidgetIconsForMock: function (index) {
        this.waitMaxTimeForElement('.csui-perspective-view .cs-favorites .icon.title-favourites');
        this.seeElement('.csui-perspective-view .cs-favorites .icon.title-favourites');
        this.waitMaxTimeForElement('.csui-perspective-view .cs-favorites .tile-title[title="Favorites"]');
        this.seeElement('.csui-perspective-view .cs-favorites .tile-title[title="Favorites"]');
        this.waitMaxTimeForElement('.csui-perspective-view .cs-favorites .tile-icons .cs-search-button[title="Search"]');
        this.seeElement('.csui-perspective-view .cs-favorites .tile-icons .cs-search-button[title="Search"]');
        this.waitMaxTimeForElement('.csui-perspective-view .cs-favorites .tile-expand');
        this.seeElement('.csui-perspective-view .cs-favorites .tile-expand');
      },

      hoverOnGlobalFavoritesHeader: function () {
        this.moveCursorTo('.csui-favorites-view-container .tile-header');
      },

      hoverOnGlobalListItem : function(index) {
        this.seeElement(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(" + index + ")");
        this.moveCursorTo(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(" + index + ")");
      },

      validatGlobalFavoriteMoreActionsIcon : function (keyEvents) {
        this.seeElement(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn");
        keyEvents ? this.pressKey(keyEvents) : this.click(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn");
        this.waitMaxTimeForElement(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='properties']");
        this.seeElement(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='properties']");
        this.seeElement(".csui-favorites-view-container .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='copylink']");
      },

      validateGlobalFavoriteSearchButton: async function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorites-view-container .tile-icons .cs-search-button[title="Search"]');
        this.waitMaxTimeForElement('.csui-favorites-view-container .tile-controls .search');
        this.seeElement('.csui-favorites-view-container .tile-controls .search');
        this.seeElement('.csui-favorites-view-container .tile-controls .icon-search-placeholder');
        this.say('Check tooltip for input field');
        let inputFieldTooltip = await this.grabAttributeFrom('.csui-favorites-view-container .tile-controls .search','title');
        this.seeElement('.csui-favorites-view-container .cs-search-close-button[title="Close search"]');
        let closeSearchTooltip = await this.grabAttributeFrom('.csui-favorites-view-container .cs-search-close-button[title="Close search"]','title');
        return inputFieldTooltip == "Search Favorites" && closeSearchTooltip == "Close search";
      },

      validateGlobalFavoriteSearchInputField : async function () {
        this.wait(1);
        this.fillField('.csui-favorites-view-container .tile-controls .search','all');
        this.waitMaxTimeForElement('.csui-favorites-view-container .clearer[title="Clear"]');
        this.seeElement('.csui-favorites-view-container .clearer[title="Clear"]');
        let resultList = await this.grabAttributeFrom('.csui-favorites-view-container .tile-content .cs-list-group .binf-list-group-item','class');
        if( resultList.length == 0) {
          this.seeElement('.csui-favorites-view-container .tile-content .cs-emptylist-text');
        }
        else if( resultList.length > 0) {
          this.dontSeeElement('.csui-favorites-view-container .tile-content .cs-emptylist-text');
          this.seeElement('.csui-favorites-view-container .tile-content .cs-list-group .binf-list-group-item:nth-child(1)');
        }
      },

      checkGlobalFavoriteClearSearchButton : function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorites-view-container .clearer[title="Clear"]');
        this.dontSeeElement('.csui-favorites-view-container .clearer[title="Clear"]');
      },

      checkGlobalFavortieCloseSearchButton : function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorites-view-container .cs-search-close-button[title="Close search"]');
        this.dontSeeElement('.csui-favorites-view-container .tile-controls .search');
      },

      checkFavoritesWidget: function () {
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"]');
      },

      hoverOnFavoriteWidget: function () {
        this.scrollTo('.csui-perspective-view [data-csui-widget_type="favorites"]');
        this.moveCursorTo('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-header');
      },

      verifyFavoritesWidgetIcons: function () {
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .icon.title-favourites');
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-title[title="Favorites"]');
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-icons .cs-search-button[title="Search"]');
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-icons .cs-open-perspective-button[title="Open favorites view"]');
      },

      validateSearchButton: async function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-icons [title="Search"]');
        this.waitMaxTimeForElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled');
        this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled');
        this.waitMaxTimeForElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled .icon-search-placeholder');
        this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled .icon-search-placeholder');
        this.say('Check tooltip for input field');
        let inputFieldTooltip = await this.grabAttributeFrom('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled .search','title');
        this.waitMaxTimeForElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled .cs-search-close-button');
        this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled .cs-search-close-button');
        let closeSearchTooltip = await this.grabAttributeFrom('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls.search-enabled .cs-search-close-button','title');
        return inputFieldTooltip == "Search Favorites" && closeSearchTooltip == "Close search";
      },

      validateSearchInputField : async function () {
        this.wait(1);
        this.fillField('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls .search','all');
        this.waitMaxTimeForElement('.csui-perspective-view [data-csui-widget_type="favorites"] .clearer[title="Clear"]');
        this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .clearer[title="Clear"]');
        let resultList = await this.grabAttributeFrom('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-list-group .binf-list-group-item','class');
        if( resultList.length == 0) {
          this.waitMaxTimeForElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-emptylist-text');
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-emptylist-text');
        }
        else if( resultList.length > 0) {
          this.waitForDetached('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-emptylist-text');
          this.dontSeeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-emptylist-text');
          this.waitMaxTimeForElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-list-group .binf-list-group-item:nth-child(1)');
          this.seeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-content .cs-list-group .binf-list-group-item:nth-child(1)');
        }
      },

      checkClearSearchButton : function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-view [data-csui-widget_type="favorites"] .clearer[title="Clear"]');
        this.dontSeeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .clearer[title="Clear"]');
      },

      checkCloseSearchButton : function (keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-view [data-csui-widget_type="favorites"] .cs-search-close-button');
        this.dontSeeElement('.csui-perspective-view [data-csui-widget_type="favorites"] .tile-controls .search');
      },

      hoverOnListItem : function(index) {
        this.waitMaxTimeForElement(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(" + index + ")");
        this.seeElement(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(" + index + ")");
        this.moveCursorTo(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(" + index + ")");
      },

      validateMoreActionsIcon : function (keyEvents) {
        this.waitMaxTimeForElement(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn");
        this.seeElement(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn");
        keyEvents ? this.pressKey(keyEvents) : this.click(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .csui-menu-btn");
        this.waitMaxTimeForElement(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='copylink']");
        this.seeElement(".csui-perspective-view [data-csui-widget_type='favorites'] .flatten-tree .cs-list-group .binf-list-group-item:nth-child(1) .binf-dropdown-menu [data-csui-command='copylink']");
      },

      validateExpandedFavoritesViewForServer : function () {
        this.seeInCurrentUrl('/favorites');
        this.waitMaxTimeForElement('.csui-perspective-view .csui-fav2-table');
        this.seeElement('.csui-perspective-view .csui-fav2-table');
        this.waitMaxTimeForElement('.title-favourites');
        this.seeElement('.title-favourites');
        this.waitMaxTimeForElement('.csui-favorite-groups-header .csui-groups-header-plus');
        this.seeElement('.csui-favorite-groups-header .csui-groups-header-plus');
        this.waitMaxTimeForElement('.csui-perspective-toolbar .cs-go-back');
        this.seeElement('.csui-perspective-toolbar .cs-go-back');
      },

      validateExpandedFavoritesViewForMock : function () {
        this.waitMaxTimeForElement('.binf-modal-dialog .csui-fav2-table');
        this.seeElement('.binf-modal-dialog .csui-fav2-table');
        this.waitMaxTimeForElement('.csui-favorite-groups-header .csui-groups-header-plus');
        this.seeElement('.csui-favorite-groups-header .csui-groups-header-plus');
        this.waitMaxTimeForElement('.tile-header .cs-close');
        this.seeElement('.tile-header .cs-close');
      },

      clickGoBackInFavoritesView : function (keyEvents){
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-perspective-toolbar .cs-go-back');
        this.waitMaxTimeForElement('.csui-greeting');
        this.seeElement('.csui-greeting');
      },

      addFavoriteGroup: function (keyEvents) {
        this.seeElement('.csui-favorite-groups-header .csui-groups-header-plus');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorite-groups-header .csui-groups-header-plus');
        this.waitMaxTimeForElement('.csui-favorite-group.csui-favorite-group-rename .csui-favorite-group-input-name');
        this.seeElement('.csui-favorite-group.csui-favorite-group-rename .csui-favorite-group-input-name');
        this.waitMaxTimeForElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save[disabled]");
        this.seeElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save[disabled]");
        this.fillField('.csui-favorite-group.csui-favorite-group-rename .csui-favorite-group-input-name','a test grou');
        this.waitMaxTimeForElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save");
        this.seeElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save");
      },

      saveFavoriteGroup: function(keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorite-group.csui-favorite-group-rename .csui-btn-save');
        this.waitMaxTimeForElement('.csui-favorite-group.csui-in-focus .csui-btn-edit-start');
        this.seeElement('.csui-favorite-group.csui-in-focus .csui-btn-edit-start');
      },

      cancelFavoriteGroup: function(keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorite-group.csui-favorite-group-rename .csui-btn-cancel');
        this.waitMaxTimeForElement('.csui-favorite-group.csui-in-focus .csui-btn-edit-start');
        this.seeElement('.csui-favorite-group.csui-in-focus .csui-btn-edit-start');
      },

      renameActiveFavoriteGroup: function(keyEvents) {
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorite-group.csui-in-focus .csui-btn-edit-start');
        this.waitMaxTimeForElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save[disabled]");
        this.seeElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save[disabled]");
        this.fillField('.csui-favorite-group.csui-favorite-group-rename .csui-favorite-group-input-name','a test group');
        this.waitMaxTimeForElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save");
        this.seeElement(".csui-favorite-group.csui-favorite-group-rename .csui-btn-save");
        this.saveFavoriteGroup();
      },

      checkNewGroupInGlobalFavorites:async function(keyEvents) {
        this.seeElement('.csui-favorite-groups-rows .csui-favorite-group:nth-child(3) .csui-favorite-group-name-link');
        let newgroupName = await this.grabAttributeFrom('.csui-favorite-groups-rows .csui-favorite-group:nth-child(3) .csui-favorite-group-name-link','title');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorites .csui-icon-favorites');
        let globalGroupName = await this.grabAttributeFrom('.csui-favorites-view-container .cs-simpletreelistitem:nth-child(3) .cs-title','title');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorites .csui-icon-favorites');
        return newgroupName === globalGroupName;
      },

      clickFavoriteIconOnFolder: function (index, keyEvents) {
        this.seeElement(".csui-table-tableview .csui-saved-item:nth-child(" + index + ") .csui-favorite-star");
        keyEvents ? this.pressKey(keyEvents) : this.click(".csui-table-tableview .csui-saved-item:nth-child(" + index + ") .csui-favorite-star");
        this.waitMaxTimeForElement('.favorite-name-label');
        this.seeElement('.favorite-name-label');
      },

      matchFavoriteFolderName: async function(index) {
        let folderName = await this.grabAttributeFrom(".csui-table-tableview .csui-saved-item:nth-child(" + index + ") .csui-table-cell-name-link-text",'innerText');
        let favoriteName = await this.grabAttributeFrom('.binf-popover-content .favorite-name-input','value');
        return folderName === favoriteName;
      },

      addFolderToFavoriteGroup: function (index, keyEvents) {
        this.seeElement('.favorite-groups-container #grpSelectId');
        keyEvents ? this.pressKey(keyEvents) : this.click('.favorite-groups-container #grpSelectId');
        this.waitMaxTimeForElement('.favorite-groups-dropdown');
        keyEvents ? this.pressKey(keyEvents) : this.click('.favorite-groups-dropdown .favorite_group[title="a test group"]');
        this.click('.favorite-buttons-container .add-btn');
        this.waitMaxTimeForElement(".csui-table-tableview .csui-saved-item:nth-child(" + index + ") .csui-favorite-star.selected");
        this.seeElement(".csui-table-tableview .csui-saved-item:nth-child(" + index + ") .csui-favorite-star.selected");
      },

      validateFavoriteIconSelected: function(index) {
        this.seeElement(".csui-table-tableview .csui-saved-item:nth-child(" + index + ") .csui-favorite-star.selected");
      },

      checkNewFavoriteFolderInGlobalFavorites: async function(keyEvents) {
        this.seeElement(".csui-favorites-view-container .cs-simpletreelistitem:nth-child(1) .icon-expandArrowDown");
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorites-view-container .cs-simpletreelistitem:nth-child(1) .icon-expandArrowDown');
        this.seeElement('.csui-favorites-view-container .cs-simpletreelistitem:nth-child(1) .binf-list-group-item');
        let folderName = await this.grabAttributeFrom(".csui-table-tableview .csui-saved-item:nth-child(1) .csui-table-cell-name-link-text",'innerText');
        let favoriteName = await this.grabAttributeFrom(".csui-favorites-view-container .cs-simpletreelistitem:nth-child(1) .list-item-title",'innerText');
        return folderName === favoriteName[0];
      },

      toggleSelectAllFavorites: function (keyEvents) {
        this.seeElement('.csui-table-cell-_select .csui-checkbox[title="Select all items"]');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-table-cell-_select .csui-checkbox[title="Select all items"]');
      },

      checkToolbarActions: function () {
        this.seeElement('.csui-rowselection-toolbar.csui-rowselection-toolbar-visible');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="properties"]');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="sendto"]');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="permissions"]');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="copy"]');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="move"]');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="collect"]');
        this.seeElement('.csui-rowselection-toolbar-visible [data-csui-command="zipanddownload"]');
      },

      hoverOnExpandedViewFavoriteItem: function() {
        this.seeElement('.csui-table-view .csui-saved-item:nth-child(1)');
        this.moveCursorTo('.csui-table-view .csui-saved-item:nth-child(1)');
        this.wait(1);
      },

      checkInlineActions: function () {
        this.seeElement('.csui-table-cell-name-appendix .csui-toolitem[title="Properties"]');
        this.seeElement('.csui-table-cell-name-appendix .binf-dropdown-toggle');
        this.click('.csui-table-cell-name-appendix .binf-dropdown-toggle');
        this.seeElement('.csui-table-cell-name-appendix .binf-dropdown-menu .csui-toolitem');
      },

      removeFavorite: function () {
        this.seeElement(".csui-table-view .csui-saved-item:nth-child(1) .csui-favorite-star.selected");
        this.click(".csui-table-view .csui-saved-item:nth-child(1) .csui-favorite-star.selected");
        this.waitForDetached(".csui-table-view .csui-saved-item:nth-child(1) .csui-favorite-star.selected");
        this.dontSeeElement(".csui-table-view .csui-saved-item:nth-child(1) .csui-favorite-star.selected");
      },

      validateRemovedFavorite: async function () {
        this.seeElement(".csui-table-view .csui-saved-item:nth-child(1) .csui-table-cell-name-value");
        let removedFavorite = await this.grabAttributeFrom(".csui-table-view .csui-saved-item:nth-child(1) .csui-table-cell-name-value",'title');
        this.click('.csui-favorite-group .csui-favorite-group-name-link[title="Ungrouped"]');
        this.waitMaxTimeForElement('.csui-favorite-group.binf-active .csui-favorite-group-name-link[title="Ungrouped"]');
        this.seeElement('.csui-favorite-group.binf-active .csui-favorite-group-name-link[title="Ungrouped"]');
        this.click('.csui-favorite-group .csui-favorite-group-name-link[title="a test group"]');
        this.waitMaxTimeForElement('.csui-favorite-group.binf-active .csui-favorite-group-name-link[title="a test group"]');
        this.seeElement('.csui-favorite-group.binf-active .csui-favorite-group-name-link[title="a test group"]');
        this.wait(1);
        let otherFavorite = await this.grabAttributeFrom(".csui-table-view .csui-saved-item:nth-child(1) .csui-table-cell-name-value",'title');
        this.say(removedFavorite+" "+otherFavorite);
        return removedFavorite !== otherFavorite;
      },

      deleteActiveFavoriteGroup: function(keyEvents) {
        this.seeElement('.csui-favorite-group.binf-active .csui-btn-delete');
        keyEvents ? this.pressKey(keyEvents) : this.click('.csui-favorite-group.binf-active .csui-btn-delete');
        this.waitMaxTimeForElement('.binf-modal-dialog .csui-yes');
        keyEvents ? this.pressKey(keyEvents) : this.click('.binf-modal-dialog .csui-yes');
        this.waitForDetached('.csui-alert .binf-modal-dialog');
        this.dontSeeElement('.csui-alert .binf-modal-dialog');
      },

      deletedFavoriteInGlobalFavorites: function () {
        this.dontSeeElement('.csui-favorites-view-container .cs-simpletreelistitem .cs-title[title="a test group"]');
      },

      setFocusOnGlobalFavoriteIcon: async function () {
        this.wait(1);
        await this.executeScript(() => document.getElementsByClassName('csui-favorites-icon-container')[0].focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('csui-favorites-icon-container') >= 0;
      },

      setFocusOnFavoriteGroupInExpandedView: async function () {
        this.wait(1);
        await this.executeScript(() => document.getElementsByClassName('csui-favorite-group-name-link')[0].focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('csui-favorite-group-name-link') >= 0;
      },

      setFocusOnFavoritesWidget:async function () {
        this.wait(1);
        await this.executeScript(() => document.getElementsByClassName('cs-search-button')[0].focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('cs-search-button') >= 0;
      },

      setFocusOnTestFolder:async function () {
        this.wait(1);
        await this.executeScript(() => document.getElementsByClassName('csui-table-cell-name-value')[0].focus());
        let check = await this.executeScript(() => document.activeElement.getAttribute('class'));
        return check.indexOf('csui-table-cell-name-value') >= 0;
      }
    });
}
