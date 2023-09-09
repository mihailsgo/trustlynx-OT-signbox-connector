/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
'module', 'csui/lib/underscore', 
'csui/lib/marionette', 'csui/controls/globalmessage/impl/progresspanel/progresspanel.view',
'csui/controls/globalmessage/progressbar.view.ext',
'csui/utils/base',
'i18n!csui/controls/globalmessage/impl/progresspanel/impl/nls/progresspanel.lang',
'hbs!csui/controls/globalmessage/impl/progresspanel.ext'
], function (module, _, Marionette, ProgressPanelViewImpl, ProgressBarView, Base, lang, panelTemplate) {
  var config = _.defaults(module.config().csui,{
    enhancePanel: false
  });
  var BarStateValues = ["pending", "processing", "rejected", "resolved", "aborted", "stopped", "stopping", "finalizing"];
  

  var ProgressPanelView = ProgressPanelViewImpl.extend({

    constructor: function ProgressPanelView(options) {
      ProgressPanelViewImpl.prototype.constructor.apply(this, arguments);
    },

    template: panelTemplate,

    childView: ProgressBarView,

    childViewOptions: function () {
      return _.extend(this.options, {
        enableCancel: this.options.enableCancel,
        messageHelper: this.options.messageHelper,
        reorderOnSort : true,
        parentView: this
      });
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
      var isCustomisedExpression =     config.enhancePanel ? !!(this.itemsPending && this.itemsPending > 0) : 
      !!(this.itemsProcessing && this.itemsProcessing > 0);
      if (isCustomisedExpression) {
        this.$el.find('.csui-header .csui-stateaction-processing').removeClass('binf-hidden');
        this.$el.find('.csui-header .csui-stateaction-pending').addClass('binf-hidden');
      } else {
        this.$el.find('.csui-header .csui-stateaction-processing').addClass('binf-hidden');
      }
    },

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
      info.detailsListAria = lang.DetailsListAria;
      info.enableCancel = this.options.enableCancel;
      info.expand = lang.Expand;
      info.expandAria = lang.ExpandAria;
      info.collapse = lang.Collapse;
      info.collapseAria = lang.CollapseAria;
      info.close = lang.Close;
      info.closeAria = lang.CloseAria;
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
      info.enhancePanel = !config.enhancePanel;
      return _.extend(info, {
        targetLocationUrl: targetLocationUrl
      });
    },

    computeProgress: function () {
      return ProgressPanelViewImpl.prototype.computeProgress.apply(this, arguments);
    },
    doCancel: function () {
      this.collection.forEach(function (fileUpload) {
        var currentstate = fileUpload.get('state');
        var isCustomisedCondition = config.enhancePanel ? (Boolean(currentstate === 'pending')) : (Boolean(currentstate === 'pending' || currentstate === 'processing'));
        if (isCustomisedCondition) {
          fileUpload.set('abortState', true);
        }
      });
     
      this.collection.abort('stopped');
      this.ui.processingAction.addClass('binf-hidden');
    },
  

  });

  return ProgressPanelView;

});
