/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'nuc/lib/underscore',                             // Cross-browser utility belt
    'nuc/lib/jquery',
    'nuc/lib/marionette',                             // MVC application support
    'module',
    'i18n!smart/controls/progresspanel/impl/progresspanel/impl/nls/progresspanel.lang',  // Use localizable texts
    'hbs!smart/controls/progresspanel/impl/progresspanel/impl/progressbar',       // Template to render the HTML
    'css!smart/controls/progresspanel/impl/progresspanel/impl/progresspanel',            // Stylesheet needed for this view
    'css!smart/controls/globalmessage/globalmessage_icons'
  ],  function (_, $, Marionette, module, lang, barTemplate) {
    'use strict';
    var config = _.defaults((module.config().csui || {}), (module.config().smart || {}), {
      panelRefreshThrottle : 400 // This delay is calculated considering slide-in animation delay of progress panel list view
    });

    var BarStateValues = ["pending", "processing", "rejected", "resolved", "aborted", "stopped", "stopping", "finalizing"];

    var ProgressBarView = Marionette.ItemView.extend({
        constructor: function ProgressBarView(options) {
          Marionette.ItemView.prototype.constructor.call(this, options);
          var model = this.model;
          if (!!model.node && model.node.get('mime_type') === undefined) {
            model.node.set({
              container: false,
              type: model.node.get('type') !== undefined ?
                model.node.get('type') : model.get('type') !== undefined ?
                  model.get('type') : 144,
              mime_type: model.get('mime_type') || model.get('type')
            }, {silent: true});
          }
          this.listenTo(this.model, 'change',  _.throttle(this._updateItem, config.panelRefreshThrottle));
          this.listenTo(this.model, 'change:state', this._updateItem); //Update immediatly when state is changed
        },

        _updateItem: function () {
          var info = this.computeProgress(),
              elem = this.$el;
          this.options.parentView.updateProgressArea(elem, info);
          if (this.model.get("state") === 'processing') {
            this.$el.find(".csui-stateaction-pending").addClass('binf-hidden');
            this.$el.find(".csui-stateaction-processing").addClass('binf-hidden');
          }
        },

        computeProgress: function () {
            var count      = this.model.get('count'),
                total      = this.model.get('total'),
                state      = this.model.get("state"),
                percentage = (total > 0 && count >= 0) ? Math.floor(count / total * 100) : 0;
            if (percentage === 100 && state === 'processing') {
              state = 'finalizing';
              this.model.set({state : state});
              if (this.$el.find('.csui-name-status button').not(".binf-hidden").is(':focus')) {
                this.ui.itemRow.trigger('focus');
              }
              this.$el.find(".csui-stateaction-processing").addClass('binf-hidden');
            }
            return {
              count: count,
              total: total,
              percentage: percentage,
              state: this.model.get('errorMessage') ? "rejected" : state,
              errorMessage: this.model.get("errorMessage"),
              label: _.str.sformat("{0} {1}", this.options.oneFilePending, this.getItemLabel())
            };
          },

        className: "csui-progressbar csui-progressrow",

        template : barTemplate,

        getItemLabel: function () {
          return this.model.get('newName') || this.model.get('name');
        },

        templateHelpers: function () {
            var info        = this.computeProgress(),
                model       = this.model,
                singleItem  = this.collection.length === 1,
                name        = this.getItemLabel(),
                cancelAria  = _.str.sformat(lang.CancelAria, name),
                commandName = !!model.get('commandName') || model.get('commandName'),
                targetLocation = !this.options.hideGotoLocationMultiSet &&
                                  !!model.get('location') ? model.get('targetLocation') : undefined;
            info.name = name;
            info.enableCancel = this.options.enableCancel;
            info.type_icon_class = this.options.typeIconClass || "";
            BarStateValues.forEach(function (value) {
              info["state_" + value] = lang["State_" + value];
            });
            info.cancel = lang.Cancel;
            info.cancelAria = cancelAria;
            info.expand = lang.Expand;
            info.collapse = lang.Collapse;
            info.close = lang.Close;
            info.singleItem = singleItem;
            info.minimize = lang.minimize;
            info.minimizeAria = lang.minimizeAria;
            info.retry = lang.Retry;
            info.gotoLocation = this.options.parentView.options.gotoLocationLinkLabel;
            info.targetLocationUrl = targetLocation ? targetLocation.url : undefined;
            info.enableRetry = config.enableRetry;
            info.errorIconAria = lang.ErrorIconAria;
            info.successIconAria = lang.SuccessIconAria;
            return info;
        },

        onRender: function () {
          this._updateItem();
        },

        ui: {
          pendingAction: '.csui-stateaction-pending',
          processingAction: '.csui-stateaction-processing',
          error: '.csui-error',
          retryContainer: '.csui-show-retry',
          retryButton: '.csui-showRetry',
          gotoLocationElem: '.csui-gotolocation-url',
          cancelButton : '.csui-name-status button',
          itemRow : '.csui-name-status'
        },

        events: {
          'click @ui.pendingAction': 'doCancel',
          'click @ui.processingAction': 'doCancel',
          'keydown @ui.pendingAction': 'handleKeydownOnCancel',
          'keydown @ui.processingAction': 'handleKeydownOnCancel',
          'click @ui.retryButton': 'processRetry',
          'keydown @ui.retryButton': 'processRetry',
          'click @ui.gotoLocationElem' : 'hanldleClickGotoLocation',
          'keydown' : 'handleKeydownEvent'
        },

        setFocus: function () {
          this.$el.addClass('focused-row');
          var button = this.$el.find('button').not(".binf-hidden");
          if (button.length !== 0) {
            button.trigger('focus');
            return button;
          } else {
            this.ui.itemRow.trigger('focus');
            return this.ui.itemRow;
          }
        },

        removeFocus: function () {
          this.$el.removeClass('focused-row');
        },

        doCancel: function () {
          this.model.abort();
        },

        handleKeydownOnCancel: function (event) {
          if ((event.keyCode === 32 || event.keyCode === 13) && this.ui.cancelButton.not(".binf-hidden").is(':focus')) {
            this.ui.itemRow.trigger('focus');
            this.doCancel();
          }
        },

        processRetry: function (event) {
          if ((event.type === 'keydown' && (event.keyCode === 32 || event.keyCode === 13)) || (event.type === 'click')) {
           this.model.trigger("try:again");
          }
        },

        showGotoLocationElem: function () {
          this.ui.gotoLocationElem && this.ui.gotoLocationElem.removeClass("binf-hidden");
        },

        showRetryElem: function () {
          if (config.enableRetry && !!this.model.get('serverFailure')) {
            this.ui.retryContainer.removeClass("binf-hidden");
          }
        },

        handleKeydownEvent: function (event) {
          if (event.keyCode === 38 || event.keyCode === 40) {
            this.trigger("keydown:item", event);
          }
        },

        hanldleClickGotoLocation: function(event) {
          event.preventDefault();
          event.stopPropagation();
          this.trigger("click:gotolocation");
        },

        handleProgressComplete : function () {
          this.showGotoLocationElem();
          this.showRetryElem();
        }
    
      });

      return ProgressBarView;
});