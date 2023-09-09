/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore',                             // Cross-browser utility belt
  'nuc/lib/jquery',
  'nuc/lib/marionette',                             // MVC application support
  'smart/utils/smart.base',
  'module',
  'nuc/utils/base',
  'smart/utils/accessibility',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'smart/controls/progresspanel/impl/progresspanel/progressbar.view',
  'i18n!smart/controls/progresspanel/impl/progresspanel/impl/nls/progresspanel.lang',  // Use localizable texts
  'hbs!smart/controls/progresspanel/impl/progresspanel/impl/progresspanel',     // Template to render the HTML
  'css!smart/controls/progresspanel/impl/progresspanel/impl/progresspanel',            // Stylesheet needed for this view
  'css!smart/controls/globalmessage/globalmessage_icons'
],  function (_, $, Marionette, /*i18n,*/ smartBase, module, Base, Accessibility, /*PerfectScrollingBehavior,*/ TabableRegionBehavior,
  ProgressBarView, lang, panelTemplate) {
  'use strict';
  var config = _.defaults((module.config().csui || {}), (module.config().smart || {}), {
    panelRefreshThrottle : 400 // This delay is calculated considering slide-in animation delay of progress panel list view
  });

  var BarStateValues = ["pending", "processing", "rejected", "resolved", "aborted", "stopped", "stopping", "finalizing"];

  var getContainerName = function (model) {
    var container = model.uploadContainer || model.container;
    return container && container.get('name');
  };
  var isMultiContainer = function (models) {
    var firstFolder = getContainerName(models[0]),
    lastFolder = getContainerName(models.reduce(function(currentModel, nextmodel) {
      return (getContainerName(currentModel) === getContainerName(nextmodel)) ? currentModel : !nextmodel;
    }));
    return firstFolder !== lastFolder;
  };

  var ProgressPanelView = Marionette.CompositeView.extend({
    constructor: function ProgressPanelView(options) {
      options || (options = {});
      this.focusChildIndex = -1;
      this.currentFocusIndex = 0;
      this.loadingCount = 0;
      _.defaults(options, {
        oneFileSuccess: lang.UploadOneItemSuccessMessage,
        multiFileSuccess: lang.UploadManyItemsSuccessMessage,
        oneFilePending: lang.UploadingSingleItem,
        oneFileFinalizing: lang.FinalizingSingleItem,
        multiFilePending: lang.UploadingItems,
        multiFileOneFailure: lang.MultiUploadOneItemFailMessage,
        oneFileFailure: lang.UploadOneItemFailMessage,
        multiFileFailure: lang.UploadManyItemsFailMessage,
        someFileSuccess: lang.UploadSomeItemsSuccessMessage,
        someFilePending: lang.UploadingSomeItems,
        someFileFailure: lang.UploadSomeItemsFailMessage2,
        oneItemStopped: lang.UploadingOneItemStopped,
        allItemsStopped: lang.UploadingAllItemsStopped,
        someItemsStopped: lang.UploadSomeItemsStopped,
        locationLabelPending : lang.UploadingLocation,
        locationLabelCompleted: lang.UploadedLocation,
        gotoLocationLinkLabel: lang.GotoLocationLinkLabel,
        enableCancel: true,
        isLoadTimeAvailable: false,
        stoppingLabel : lang.State_stopping
      });
      if (options.enableCancel) {
        this.panelStateValues = ["resolved", "rejected", "aborted", "processing"];
      }
      else {
        this.panelStateValues = ["resolved", "rejected", "aborted"];
      }
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.listenTo(this.collection, 'change',  this._updateHeader);
      this.listenTo(this.collection, 'sort', this.setLocationName);
      this.originatingView = options.originatingView;
      if (!!this.originatingView) {
        this.originatingView.trigger('global.alert.inprogress');
      }
      this.isMultiContainer = isMultiContainer(this.collection.models);
      this.setLocationName();
    },

    updateProgressArea: function (elem, info) {
      var errorElem = elem.find(".csui-progress-static-rejected");
      if (info.dynamic === undefined ? info.state === "processing" : info.dynamic) {
        var progressBar = elem.find(".binf-progress-bar");
        this.options.messageHelper.switchField(elem, ".csui-progress", "dynamic",
            ["static", "dynamic"]);
        var bytesOfSize = _.str.sformat(lang.BytesOfSize,
            Base.getReadableFileSizeString(info.count),
            Base.getReadableFileSizeString(info.total));
        elem.find(".csui-progress-text").text(bytesOfSize);
        progressBar.attr("aria-valuenow", info.percentage);
        progressBar.css("width", _.str.sformat("{0}%", info.percentage));
        elem.find(".csui-progress-dynamic .csui-percent").text( _.str.sformat("{0}%", info.percentage));

      } else {
        this.options.messageHelper.switchField(elem, ".csui-progress", "static", ["static", "dynamic"]);
        this.options.messageHelper.switchField(elem, ".csui-progress-static", info.state, BarStateValues);
      }

      errorElem.text(info.errorMessage);
      errorElem.attr("title", info.errorMessage);
      if (info.errorMessage) {
        elem.addClass('csui-error');
      }
      this.options.messageHelper.switchField(elem, ".csui-stateaction", info.state,
          BarStateValues);
      if (this.itemsProcessing && this.itemsProcessing > 0) {
        this.$el.find('.csui-header .csui-stateaction-processing').removeClass('binf-hidden');
        this.$el.find('.csui-header .csui-stateaction-pending').addClass('binf-hidden');
      } else {
        this.$el.find('.csui-header .csui-stateaction-processing').addClass('binf-hidden');
      }
    },

    onDestroy: function () {
      this.handleProgressComplete();
      this.focusChildIndex = -1;
      this.focusingOnList = false;
      this.currentFocusIndex = 0;
      this.trigger('tabable:not');
    },

    handleProgressComplete: function (allFailures) {
      this.originatingView && this.originatingView.trigger('global.alert.completed');
      this.parentView && this.parentView.trigger('processing:completed');
      if (!allFailures) {
        this.ui.gotoLocationElem && this.ui.gotoLocationElem.removeClass('binf-hidden');
        this.children.invoke('showGotoLocationElem');
      }
      this.children.invoke('handleProgressComplete');
      setTimeout(_.bind(function () {
         $(this.$el).trigger('focus');
      }, this), 10);

    },
    autoHideSuccessBanner: function() {
      var self = this,
      hasLinks = _.find(this.collection.models, function (model) {
        return !_.isUndefined(model.get("targetLocation"));
      });
      if (!this.options.enablePermanentHeaderMessages &&
        !Accessibility.isAccessibleMode() &&
        (this.options.hideGotoLocationSingleSet ||
          this.options.hideGotoLocationMultiSet ||
          !hasLinks)) {
        setTimeout(function () {
          if (Base.isIE11()) {
            self.closePanel = true;
          }
          self.doClose();
        }, 5000);
      }
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    isProgressFailed: function () {
      return $.inArray(this.state, ['rejected']) !== -1;
    },

    isProgressCompleted: function () {
      var state = $.inArray(this.state, ['resolved', 'rejected', 'aborted', 'stopped', 'stopping']) !== -1;
      if(state && this.originatingView && this.originatingView.container && this.originatingView.container.get('type')===136){
        this.originatingView.container.unset("fileOrder"); //unsetting fileOrder to fetch order_next attribute for next upload
      }
      return state;
    },

    isProgressFinalizing: function () {
      return $.inArray(this.state, ['stopping']) !== -1;
    },

    getLocalizedLocation: function(model) {
      var langForStatus = this.isProgressCompleted() ? this.options.locationLabelCompleted : this.options.locationLabelPending;
      return _.str.sformat(langForStatus, getContainerName(model));
    },

    setLocationName: function() {
      var bundleNumber, location, currentLocation,
      self = this;
      this.collection.forEach(function(model) {
        if (model.get('bundleNumber') === bundleNumber) {
          model.unset('location');
          model.unset('bundleDivider');
        } else {
          model.set({bundleDivider : true},{silent: true}); // Show seperation between every bundle
          bundleNumber = model.get('bundleNumber');
          currentLocation = getContainerName(model);
          if (currentLocation === location) {
            model.unset('location');
          } else {
            self.isMultiContainer && model.set({location : self.getLocalizedLocation(model)}, {silent: true}); //Location is shown only when upload is happening from multiple folder
            location = currentLocation;
          }
        }
      });
      this.collection.reset(this.collection.models);
    },

    updateProgressPanel: function (failedCount) {
      var notificationIcon, allFailures;      
      if (this.isProgressFailed()) {
        this.parentView && this.parentView.trigger('processing:error');
        notificationIcon = 'csui-global-error';
        allFailures = failedCount === this.collection.length;
      } else {
        notificationIcon = 'csui-global-success';
        this.autoHideSuccessBanner();
      }
      this.ui.processingAction.addClass('binf-hidden');
      this.ui.closeAction.parent('.csui-close').removeClass('binf-hidden');
      this.ui.header.find('.csui-minimize').addClass('binf-hidden');
      this.ui.header.find('.csui-progress').addClass('binf-hidden');
      this._isRendered && this.collection.sort();
      this.handleProgressComplete(allFailures);
      this.showretryAll();
      this.currentlyFocusedElement().trigger('focus');
      if(this.options.actionType && this.options.actionType === "ADD_VERSION"){
        return;
      }
      this.$el.addClass(notificationIcon);
    },

    showretryAll: function () {
      if (config.enableRetry && this.showretryAllElem) {
        this.ui.retryAll.removeClass('binf-hidden');
      }
    },

    showProgressBar: function (show) {
      if(show) {
        this.ui.progressBar && this.ui.progressBar.removeClass('binf-hidden');
        this.ui.loadingDots && this.ui.loadingDots.addClass('binf-hidden');
      } else {
        this.ui.progressBar.addClass('binf-hidden');
        this.ui.loadingDots.removeClass('binf-hidden');
      }
    },

    _updateHeader: function () {
      var info = this.computeProgress(),
      options = this.options;
      this.state = info.state;
      this.showProgressBar(info.isLoadTimeAvailable);
      switch (info.state) {
        case 'pending': 
        case 'processing':
          info.label = this._getFormatString(options.oneFilePending, options.multiFilePending, this.collection.length);
          break;
        case 'resolved':
          if(options.actionType && options.actionType === "ADD_VERSION"){
            break; //don't need to show uploaded message while adding version
          }
          info.label = this._getFormatString(options.oneFileSuccess, options.multiFileSuccess, this.collection.length);
          break;
        case 'stopping':
          info.label = options.stoppingLabel;
          break;
        case 'stopped':
          info.label = this._getFormatString(options.oneItemStopped, options.someItemsStopped, this.collection.length);
          break;
        case 'aborted':
          info.label = this._getFormatString(options.oneItemStopped, options.allItemsStopped, this.collection.length);
          break;
        case 'finalizing':
          info.label = this._getFormatString(options.oneFileFinalizing, options.multiFilePending, this.collection.length);
          break;
        default:
          var isMultiFileOneFailure = this.collection.length > 1 && info.failed === 1;
          info.label = isMultiFileOneFailure ? options.multiFileOneFailure :
                       this._getFormatString(options.oneFileFailure, options.multiFileFailure, info.failed);
      }
      this.ui.header.find(".csui-title").text(info.label);
      !this.isProgressFinalizing() && this.isProgressCompleted() && this.updateProgressPanel(info.failed); // Apply styles for progressPanel progress completion
      this.updateProgressArea(this.ui.header, info);
      this.ui.headerWrapper = this.$el;
      (this.options && this.options.actionType === 'UPLOAD') ? this.ui.headerWrapper.addClass('progressBar-active')
          : this.ui.headerWrapper.removeClass('progressBar-active');

      if(this.collection.length === 1 && info.state === "rejected") {        
        this.ui.header.removeClass('smart-singleitem');
        this.ui.expandIcon.removeClass('binf-hidden');
      } else {
        this.$el.find(".csui-items-wrapper .csui-names-progress").removeClass('binf-hidden');
      }
    
      if (!this.options.allowMultipleInstances) {
        this.ui.minimizeButton.parent(".csui-minimize").addClass('binf-hidden');
      } else {
        if(this.parentView) {
          this.parentView.trigger('processbar:update', info.percentage);
        }
        if (info.state === 'processing') {
          this.ui.minimizeButton.parent(".csui-minimize").removeClass('binf-hidden');
        }
      }
      if (!this.stateExpandCollapse) {
        var arrow = this.ui.header.find(".csui-expand").find(":not(.binf-hidden)");
        if (arrow.hasClass("csui-expand-up")) {
          this.doExpand(false);
        } else if (arrow.hasClass("csui-expand-down")) {
          this.doCollapse(false);
        }
      }
      var isempty = !this.collection || this.collection.length === 0;
      if (this.$el.hasClass("csui-empty")) {
        if (!isempty) {
          this.$el.removeClass("csui-empty");
        }
      } else {
        if (isempty) {
          this.$el.addClass("csui-empty");
        }
      }
    },

    _getFormatString: function (str1, str2, count) {
      var formattedString, fileName;
      if (count === 1) {
        fileName = this.collection.models[0].get('newName') || this.collection.models[0].get('name');
        formattedString = _.str.sformat(str1, fileName);
      } else {
        formattedString = _.str.sformat(str2, count);
      }
      return formattedString;
    },

    computeProgress: function () {
      var allDone    = true,
          processing = false,
          allAborted = true,
          stopped    = false,
          finalizing = false,
          failed     = 0,
          aborted    = 0,
          count      = 0,
          total      = 0;
          this.itemsPending = 0;
          this.itemsProcessing = 0;
      var self = this;
      this.collection.forEach(function (item) {
        count += item.get('count');
        total += item.get('total');

        if (self._isRendered && item.get('errorMessage') && item.get("state") === "pending") {
          item.set("state", "rejected", {silent: true});
       }
        if (item.get("state") === "stopped") {
          stopped = true;
        }
        if (item.get("state") === "aborted") {
          ++aborted;
        }
        if (item.get("state") === "processing") {
          self.loadingCount += item.get('count');
          (self.itemsProcessing)++;
        }
        if (item.get("state") === "pending" || item.get("state") === "processing" || item.get("state") === "finalizing" || item.get("state") === "stopping") {
          allDone = false;
        }
        if (item.get("state") !== "pending") {
          processing = true;
        }
        if (item.get("state") === "pending") {
          if (self.itemsProcessing === 0) {
            self.itemsProcessing = 1;
          }
          (self.itemsPending)++;
        }
        if (item.get("state") === "rejected") {
          ++failed;
          item.set({sequence : 2}, {silent: true});
          self.showretryAllElem = !!item.get('serverFailure');
        }
        if (item.get("state") === "resolved" || item.get("state") === "rejected") {
          allAborted = false;
        }
      });
     
      var percentage = (total > 0) ? Math.floor(count / total * 100) : 0;
      if (percentage === 100 && !allDone) {
        percentage = 99;
        finalizing = true;
      }
      if (allDone || finalizing) {
        this.itemsProcessing = 0;
      }
      var state   = allDone ? failed ? "rejected" : stopped || aborted ? allAborted ? "aborted" : "stopped" : "resolved" :
                    stopped ? "stopping" : finalizing ? "finalizing" : processing ? "processing" : "pending",
          dynamic = state !== "pending";
      return {
        count: count,
        total: total,
        failed: failed,
        percentage: percentage,
        state: state,
        dynamic: dynamic,
        isLoadTimeAvailable : this.loadingCount > 0
      };
    },
    className: 'csui-progresspanel',

    childView: ProgressBarView,
    childViewContainer: ".csui-items",
    childEvents: {
      'click:gotolocation': 'navigateToLocation',
      'keydown:item': 'onChildViewKeydown'
    },
    childViewOptions: function () {
      return _.extend(this.options, {
        enableCancel: this.options.enableCancel,
        messageHelper: this.options.messageHelper,
        reorderOnSort : true,
        parentView: this
      });
    },
    template: panelTemplate,

    templateHelpers: function () {
      var targetLocation, 
      targetLocationUrl,
      info = this.computeProgress(),
      singleItem = this.collection.length === 1;
      if (!this.options.hideGotoLocationSingleSet && !this.isMultiContainer) {
        targetLocation = this.collection.models[0].get('targetLocation');
        targetLocationUrl = targetLocation && targetLocation.url;
      }
      BarStateValues.forEach(function (value) {
        info["state_" + value] = lang["State_" + value];
      });
      this.panelStateValues.forEach(function (value) {
        info["stateaction_" + value] = lang["StateAction_" + value];
        info["stateaction_all_" + value] = lang["StateAction_all_" + value];
      });
      info.cancel = lang.Cancel;
      info.enableCancel = this.options.enableCancel;
      info.expand = lang.Expand;
      info.collapse = lang.Collapse;
      info.close = lang.Close;
      info.closeAria = lang.CloseAria;
      info.detailsListAria = lang.DetailsListAria;
      info.processing = (info.state === "processing") ? true : false;
      info.progressTitleId = _.uniqueId("progressTitle");
      this.progressTitleId = info.progressTitleId;
      info.singleItem = singleItem;
      info.enableMinimiseButton = this.options.enableMinimiseButton;
      info.minimize = lang.minimize;
      info.minimizeAria = lang.minimizeAria;
      info.gotoLocation = this.options.gotoLocationLinkLabel;
      info.retryAll = lang.RetryAll;
      info.enableRetry = config.enableRetry;
      return _.extend(info, {
        targetLocationUrl: targetLocationUrl
      });
    },

    onRender: function () {
      this.$el.find('.csui-header').attr('tabindex','0');
      this.$el.attr('role', 'dialog');
      this.$el.attr('aria-labelledby', this.progressTitleId);
      this.currentlyFocusedElement();
      this._updateHeader();
      this.collection.comparator = function (currentModel , nextModel) {
        if(currentModel.get('bundleNumber') === nextModel.get('bundleNumber')) {
          return nextModel.get('sequence') - currentModel.get('sequence');
        }
      };
    },

    ui: {
      header: '.csui-header',
      progressBar : '.csui-header .binf-progress',
      loadingDots : '.csui-header .loading-dots',
      pendingAction: '.csui-header .csui-stateaction-pending',
      processingAction: '.csui-header .csui-stateaction-processing',
      closeAction: '.csui-header .csui-close button',
      collapseAction: '.csui-header .csui-expand-up',
      expandAction: '.csui-header .csui-expand-down',
      minimizeButton: '.csui-header .csui-minimize .icon-progresspanel-minimize',
      expandIcon: '.csui-header .csui-expand',
      gotoLocationElem : '.csui-gotolocation-url',
      retryAll: '.csui-show-retryAll',
      childContainer: '.csui-items'
    },

    events: {
      'click @ui.pendingAction': 'doCancel',
      'click @ui.processingAction': 'doCancel',
      'click @ui.closeAction': 'doClose',
      'keydown @ui.closeAction': 'handleKeydownOnClose',
      'click @ui.collapseAction': 'doCollapse',
      'click @ui.expandAction': 'doExpand',
      'keydown @ui.expandAction': 'handleKeydownOnExpand',
      'keydown @ui.collapseAction': 'handleKeydownOnCollapse',
      'click @ui.minimizeButton': '_doProcessbarMinimize',
      'keydown @ui.minimizeButton': 'onKeyInViewMinimize',  
      'click @ui.gotoLocationElem': 'handleGotoLocationClick',
      'keydown @ui.gotoLocationElem': 'handleGotoLocationClick',
      'click @ui.retryAll': 'processRetryAll',
      'keydown @ui.retryAll': 'processRetryAll',
      'keydown': 'onKeyInParentView'
    },

    doCancel: function () {
      this.collection.abort('stopped');
      this.ui.processingAction.addClass('binf-hidden');
    },

    positionChange: function (newWidth) {
      if (newWidth !== undefined) {
        var parentWidth = this.$el.parent().width();
        var translateX = (parentWidth - newWidth) / 2;
        translateX > 0 || (translateX = 0);
        translateX = !!smartBase.isRTL() ? -translateX : translateX;
        translateX = 'translateX(' + translateX + 'px)';
        this.$el.css({ 'transform': translateX });
      }
    },

    doCollapse: function (animated) {
      this.$el.removeClass('csui-expanded');
      animated = (animated === false) ? false : true;
      var items = this.$el.find(".csui-items");
      items.find('.focused-row').removeClass('focused-row');
      this.options.messageHelper.switchField(this.$el.find(".csui-header"),
        ".csui-expand", "down",
        ["up", "down"]);
      this.options.messageHelper.collapsePanel(this, items, items, animated);
      this.stateExpandCollapse = "collapsed";
      this.$el.find('.csui-expand-down').trigger('focus');
      this.focusChildIndex = -1;
      this.focusingOnList = false;
      setTimeout(_.bind(function () {
        this.positionChange(this.collapsedWidth);
        this.$el.removeClass('csui-expanded-panel');
      }, this), 280);
    },

    doExpand: function (animated) {
      var items = this.$el.find(".csui-items"),
        event = animated,
        self = this;
      animated = (animated === false) ? false : true;
      if(this.$el.width()){
        this.collapsedWidth= this.$el.width();
      }
      this.options.messageHelper.switchField(this.$el.find(".csui-header"),
        ".csui-expand", "up",
        ["up", "down"]);
      this.options.messageHelper.expandPanel(this, items, items, animated);
      if(this.$el.width()) {
        this.expandedWidth= this.$el.width();
      }
      this.positionChange(this.expandedWidth);
      this.stateExpandCollapse = "expanded";
      this.$el.one(this.options.messageHelper.transitionEnd(), function () {
        self.trigger('ensure:scrollbar');
        self.$el.addClass('csui-expanded');
        self.$el.addClass('csui-expanded-panel');
      });
      if (event.type === 'keydown' && (event.keyCode === 32 || event.keyCode === 13)) {
        items.find('.focused-row').removeClass('focused-row');
        setTimeout(function() {
          self.children.findByIndex(0).setFocus();
        });
        this.focusChildIndex = 0;
        this.focusingOnList = true;
      } else {
        this.ui.collapseAction.trigger('focus');
      }
    },

    handleKeydownOnExpand: function (event) {
      event.preventDefault();
      if(event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32)) {
        this.doExpand(event);
      }
    },

    handleKeydownOnCollapse: function (event) {
      event.preventDefault();
      if(event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32)) {
        this.doCollapse(event);
      }
    },

    onKeyInViewMinimize: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this._doProcessbarMinimize();
      }
    },

    onKeyInParentView: function(event) {
      var focusChanged = false;
      switch(event.keyCode) {
        case 9: // TAB
        var allFocusableElements = this._getAllFocusableElements(),
        activeElement = this.currentlyFocusedElem.length > 0 ? this.currentlyFocusedElem : document.activeElement;
        if(activeElement === allFocusableElements[0][0]) {
          this.currentFocusIndex = 0;
        }
        if (this.ui.childContainer.has(event.target).length) {
          if (event.shiftKey) {
            this.currentFocusIndex = allFocusableElements.length - 1;
            this.focusingOnList = false;
            focusChanged = true;
          }
        } else {
          var nextFocus = this.currentFocusIndex;
          if (event.shiftKey) {
            nextFocus -- ;
          } else {
            nextFocus ++ ;
          }
          if (nextFocus >= 0 && nextFocus < allFocusableElements.length) {
            this.currentFocusIndex = nextFocus;
            focusChanged = true;
          } else if (nextFocus === allFocusableElements.length && this.focusChildIndex >= 0) {
            focusChanged = true;
            this.focusingOnList = true;
          }
        }
        break;
      }

      if (focusChanged) {
        this.trigger('changed:focus', this);
        this.currentlyFocusedElement();
        $(this.currentlyFocusedElem)[0].focus();
        this.$el.find('.focused-row') && this.$el.find('.focused-row').removeClass('focused-row');
        return false;
      }
    },

    onChildViewKeydown: function (childview, event) {
      var nextFocusIndex = this.focusChildIndex;
      switch (event.keyCode) {
        case 40: //arrow down
        nextFocusIndex < (this.children.length - 1) && ++nextFocusIndex;
          break;
        case 38: //arrow up
          nextFocusIndex > 0 && --nextFocusIndex;          
          break;
      }
      if (nextFocusIndex < 0 || nextFocusIndex >= this.children.length) {
        return;
      }
      if (this.focusChildIndex >= 0 ){
        this.children.findByIndex(this.focusChildIndex).removeFocus();
      }
      this.focusChildIndex = nextFocusIndex;
      this.children.findByIndex(this.focusChildIndex).setFocus();
      this.trigger('changed:focus', this);
      return false;
    },

    _doProcessbarMinimize: function () {
      this.$el.addClass('binf-hidden');
      this.parentView.trigger('processbar:minimize');
    },

    doShow: function (relatedView, parentView) {
      this.options.messageHelper.showPanel(this, relatedView, parentView);
      this.parentView = parentView;
      this.parentView.trigger('processbar:finished');
      this.listenTo(this.parentView, 'processbar:maximize', function () {
        if (!this.isDestroyed) {
          this.$el.removeClass('binf-hidden');
          this.ui.minimizeButton.trigger("focus");
        }
      });
      this.$el.trigger('globalmessage.shown', this);
      this.trigger('dom:refresh');
      this.ui.header.focus();
    },

    currentlyFocusedElement: function () {
        if(this.isDestroyed){
          return $();
        }
        if (this.focusingOnList && this.focusChildIndex >= 0) {
          this.currentlyFocusedElem = this.children.findByIndex(this.focusChildIndex).setFocus();
        } else  {
          var allFocusableElements = this._getAllFocusableElements();
          this.currentlyFocusedElem = $(allFocusableElements[this.currentFocusIndex]);
        } 
        return this.currentlyFocusedElem;
      },

    _getAllFocusableElements: function() {
      var allFocusableElements = this.ui.header.find("*[tabindex]:visible").toArray();
       allFocusableElements.unshift(this.ui.header);
       return allFocusableElements;
    },

    doClose: function () {
      var self = this, panel = _.extend({
        csuiAfterHide: function () {
          self.destroy();
          if (self.isProgressFailed()) {
            self.trigger('escaped:focus');
          }
          this.parentView.trigger('processbar:finished');
        }
      }, this);
      this.options.messageHelper.fadeoutPanel(panel);
      if (this.closePanel) {
        this.closePanel = false;
        panel.csuiAfterHide();
      }
    },

    handleKeydownOnClose: function (event) {
      if(event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32)) {
        this.doClose(event);
      }
    },

    handleGotoLocationClick: function(event) {
      if ((event.type === 'keydown' && (event.keyCode === 32 || event.keyCode === 13)) || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        this.navigateToLocation();
      }
    },

    navigateToLocation: function (chidlView) {
      this.trigger('navigate:to:location', chidlView);
      this.doCollapse();
    },

    processRetryAll: function (event) {
      if ((event.type === 'keydown' && (event.keyCode === 32 || event.keyCode === 13)) || (event.type === 'click')) {
        this.trigger('retry:all');
      }
    }
  });
  return ProgressPanelView;

});
