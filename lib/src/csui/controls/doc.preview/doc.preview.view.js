/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'require', "csui/lib/underscore", 'csui/lib/marionette', 'csui/lib/backbone',
  'csui/utils/contexts/factories/next.node', 'csui/controls/doc.preview/active.plugin',
  'nuc/models/node/node.model', 'css!csui/controls/doc.preview/impl/doc.preview'
], function ($, require, _, Marionette, Backbone, NextNodeModelFactory, ActivePlugin, NodeModel) {
  'use strict';

  var HIGHLIGHT_CLASS_NAME = 'csui-doc-preview-state';
  var responseObject = {
    status: '',
    errorCode: '',
    errorMessage: ''
  };

  var DocPreviewView = Marionette.ItemView.extend({
    className: 'csui-doc-preview-wrapper',
    template: false,

    constructor: function DocPreviewView(options) {
      options || (options = {});
      var defaultOptions = {
        skipDestroyUponCollectionRequest: false
      };
      options = _.defaults(options, defaultOptions);
      Marionette.ItemView.apply(this, arguments);

      this.model = this._getNodeModel(this.model);

      this.listenTo(this, 'open:new:doc:preview',
          _.bind(function (model, originatingView) {
            if (this.plugin && this.plugin.constructor.isSupported(model)) {
              if (!!originatingView) {
                this.options.originatingView = originatingView;
              }
              this.options.originatingView && this._setSelectedNodes();

              this.model = this._getNodeModel(model);

              if (this.selectedNodes.length < 2) {
                this.viewerView.trigger('update:model', this.model);
              } else {
                this.viewerView.trigger('update:collection', this.selectedNodes);
              }

              this.options.originatingView.trigger('doc:preview:generic:actions', this.model,
                  HIGHLIGHT_CLASS_NAME);
            } else {
              this.trigger("error:doc:preview", _.defaults({
                status: 'ERROR',
                errorCode: 'ERR_UN_SUPPORTED',
                errorMessage: 'Neither supported plugin nor supported document exists!'
              }, responseObject));
            }
          }, this));
      this.listenToOnce(this.options.context.getModel(NextNodeModelFactory), 'change:id',
          this._doCleanUp);

      this.listenToOnce(this.options.context, 'change:perspective retain:perspective',
        this._doCleanUp);

      this.listenToOnce(this, 'before:destroy', this._doCleanUp);

      if (this.options.originatingView) {

        this._setSelectedNodes();

        this.options.originatingView.collection &&
        this.listenToOnce(this.options.originatingView.collection, 'request', _.bind(function () {
          if (!this.options.skipDestroyUponCollectionRequest) {
            this._doCleanUp();
          }
        }, this));

        this.options.originatingView.commandController &&
        this.listenToOnce(this.options.originatingView.commandController,
            'before:execute:command', _.bind(function (eventArgs) {
              if(eventArgs.commandSignature !== "DocPreview"){
              this._doCleanUp();
              }
            }, this));
      }

      this._renderViewerView();

      this.listenTo(this, 'panel:expand', this._expandPanel);
      this.listenTo(this, 'panel:collapse', this._collapsePanel);
    },

    _getNodeModel: function (model) {
      return new NodeModel(model.attributes, {connector: model.connector});
    },

    _setSelectedNodes: function () {
      this.selectedNodes = _.isFunction(this.options.originatingView.allSelectedNodes) ?
                           this.options.originatingView.allSelectedNodes() :
                           (this.options.originatingView.collection &&
                            this.options.originatingView.collection.selectedItems ||
                            new Backbone.Collection());
    },

    layoutState: {},
    _expandPanel: function () {
      this.viewerView && this.viewerView.trigger('expand:view');
    },

    _collapsePanel: function () {
      this.viewerView && this.viewerView.trigger('collapse:view');
    },
    _renderViewerView: function () {
      this.options.originatingView.trigger('doc:preview:generic:actions', this.model, HIGHLIGHT_CLASS_NAME);

      var viewerOpts = {
        model: this.model,
        context: this.options.context,
        selectedNodes: this.selectedNodes
      };

      ActivePlugin.getActivePluginView(viewerOpts)
          .then(_.bind(function (args) {
            this.viewerView = args.viewer;
            this.plugin = args.plugin;
            var viewerRegion = new Marionette.Region({
              el: this.$el
            });

            viewerRegion.show(this.viewerView);
            $(".binf-widgets.csui-sidepanel-open").addClass("csui-doc-preview");
            this.listenTo(this.viewerView, 'destroy', _.bind(function () {
              this.destroy();
            }, this));

            this.listenTo(this.viewerView, 'highlight:row', _.bind(function (model) {
              model && this.trigger('highlight:row', model);
            }, this));
            if (this.options.resizableWrapperClass) {
              var resizableEle = this.$el.closest(this.options.resizableWrapperClass);
              this.listenTo(this.viewerView, "expand:click", function () {
                resizableEle[0].style.width = "100%";
              });

              this.listenTo(this.viewerView, "collapse:click", function () {
                if (!!this.layoutState.width) {
                  resizableEle[0].style.width = this.layoutState.width + 'px';
                } else {
                  resizableEle.removeAttr('style');
                }
              });
            }

          }, this))
          .fail(_.bind(function (args) {
            this.trigger("error:doc:preview", _.defaults({
              status: 'ERROR',
              errorCode: 'ERR_UN_SUPPORTED',
              errorMessage: 'Neither supported plugin nor supported document exists!'
            }, responseObject));
          }, this));
    },
    _doCleanUp: function (event) {
        this.viewerView && this.viewerView.destroy();
        $(".binf-widgets").removeClass("csui-doc-preview");
    }
  });

  return DocPreviewView;
});
