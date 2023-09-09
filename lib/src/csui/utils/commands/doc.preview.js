/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper',
  'csui/utils/commands/preview.plugins/preview.plugins',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (require, _, $, CommandModel, CommandHelper, previewPlugins, lang) {
  'use strict';

  var commandData = {
    includeContainers: true,
    ifNotOpenDelegate: true,
    fullView: false
  };

  var DocPreviewCommand = CommandModel.extend({
    defaults: {
      signature: 'DocPreview',
      command_key: ['docpreview', 'DocPreview'],
      scope: 'multiple',
      name: lang.DocumentPreview
    },

    delegatableOpenCommand: 'OpenDocument',

    enabled: function (status, options) {
      var disablePreview = status.originatingView && status.originatingView.disablePreview;
      if (disablePreview) {
        return false;
      }

      var nodes = CommandHelper.getAtLeastOneNode(status),
          valid = true;
      if (nodes && nodes.length) {
        nodes.each(_.bind(function (node) {
          var validateCurrentNode = valid && this._validateCurrentNode(node, status, options);
          if (!validateCurrentNode) {
            valid = false;
          }
        }, this));
      } else {
        valid = false;
      }

      return valid;
    },

    _getData: function (status) {
      var data    = status && status.data ? status.data : {},
          cmdData = _.defaults(data, commandData);
      return cmdData;
    },

    _validateCurrentNode: function (node, status, options) {

      var context = status.context || options && options.context,
          plugin  = previewPlugins.findByNode(node, {context: context}),
          cmdData = this._getData(status);

      if (!plugin) {
        return false;
      }
      if (!cmdData.includeContainers && !!node.get('container')) {
        return false;
      }
      var validateNode = plugin.validateNode || this.validateNode;

      if (!validateNode(node, status)) {
        return false;
      }
      var isOpenDelegate = cmdData && cmdData.ifNotOpenDelegate &&
                           getOpenDelegateSignature(this, status, options) ===
                           this.get('signature');
      if (isOpenDelegate) {
        return false;
      }
      return true;
    },
    validateNode: function (node, status) {
      return false;
    },

    execute: function (status, options) {
      var nodes           = CommandHelper.getAtLeastOneNode(status),
          context         = status.context || options && options.context,
          originatingView = status.originatingView || options.originatingView,
          cmdData         = this._getData(status),
          fullViewMode    = (cmdData && cmdData.fullView) || (options && options.fullView) ||
                            (status.originatingView && status.originatingView.previewInFullMode);

      if (fullViewMode) {
        var nodez      = nodes.models[0],
            pluginz    = previewPlugins.findByNode(nodez, {context: context}),
            WidgetView = pluginz.widgetView;

        var deferred = $.Deferred();
        require([
          'csui/utils/commands/impl/full.page.modal/full.page.modal.view',
          WidgetView
        ], function (FullPageModal, widgetView) {
          var viewerView    = new widgetView({
                context: context,
                model: nodez
              }),
              fullPageModal = new FullPageModal({
                view: viewerView
              });
          fullPageModal.on('destroy', function () {
                deferred.resolve();
              })
              .show();
          fullPageModal.$el.on('shown.binf.modal', function () {
            var firstBtn = $(fullPageModal.$el.find('button')[0]);
            firstBtn && firstBtn.trigger('focus');
          });

        }, deferred.reject);
        return deferred.promise();

      } else {

        originatingView = originatingView.options && originatingView.options.originatingView ||
                          originatingView;
        var selectedNodes = originatingView.collection && originatingView.collection.length ?
                            _.filter(originatingView.collection.models, function (model) {
                              var id = model.get('id');
                              if (nodes.find(id)) {
                                return model;
                              }
                            }) : nodes.models[0],
            firstNode     = selectedNodes.length ?
                            _.intersection(originatingView.collection.models, nodes.models)[0] :
                            nodes.models[0];
        firstNode = !firstNode ? nodes.models[0] : firstNode;
        if (!!originatingView.ensureSidePanel ||
            ( this.docPreviewView && !!this.docPreviewView.openSidePanel)) {
          this.docPreviewView.trigger('open:new:doc:preview', firstNode, originatingView);
        } else {
          originatingView.ensureSidePanel = true;
          var plugin = previewPlugins.findByNode(firstNode, {context: context});

          this._openInSidepanel(firstNode, plugin, originatingView, context);
        }

        return $.Deferred().resolve().promise();
      }
    },
    _openInSidepanel: function (node, plugin, originatingView, context) {
      var self = this;
      require([
        'csui/controls/side.panel/side.panel.view',
        'csui/controls/doc.preview/doc.preview.view'
      ], function (SidePanelView, DocumentPreviewView) {
        var documentPreviewView = new DocumentPreviewView({
              model: node,
              plugin: plugin,
              originatingView: originatingView,
              context: context,
              resizableWrapperClass: '.csui-sidepanel-container'
            }),
            sidePanelView       = new SidePanelView({
              slides: [{
                content: documentPreviewView
              }],
              sidePanelClassName: 'csui-sidepanel-doc-preview',
              layout: {header: false, footer: false, mask: false, resize: true, size: 'medium'},
              contentView: documentPreviewView,
              thresholdWidth: 95,
              context: context,
              keyboard: false
            });

        sidePanelView.show();
        documentPreviewView.openSidePanel = true;
        self.docPreviewView = documentPreviewView;
        var viewStateModel = context.viewStateModel,
            cleanup        = function () {
              sidePanelView.stopListening(viewStateModel,
                  'change:' + viewStateModel.CONSTANTS.STATE);
              originatingView.ensureSidePanel = false;
              documentPreviewView.openSidePanel = false;
              $('.csui-doc-preview-state').removeClass('csui-doc-preview-state');
              self.docPreviewView.trigger("destroy");
              self.docPreviewView = undefined;
              sidePanelView.hide();
              sidePanelView.destroy();
              originatingView && originatingView.trigger('doc:preview:closed');
            };

        sidePanelView.listenTo(documentPreviewView, 'before:destroy', cleanup);
        viewStateModel && sidePanelView.listenTo(viewStateModel,
            'change:' + viewStateModel.CONSTANTS.STATE, cleanup);
      });
    }
  });

  function getOpenDelegateSignature(command, status, options) {
    var commands = command.collection;
    if (commands) {
      var openCommand = commands.get(command.delegatableOpenCommand);
      if (openCommand) {
        var delegate = openCommand.getDelegatedCommand(status, options);
        return delegate && delegate.get('signature');
      }
    }
  }

  return DocPreviewCommand;
});
