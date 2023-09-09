/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require',
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/url',
  'csui/models/command',
  'csui/utils/commandhelper',
  'csui/utils/contexts/factories/connector',
  'xecmpf/utils/createdocument/embed.powerdocs.view',
  'i18n!xecmpf/utils/commands/nls/localized.strings',
  'css!xecmpf/utils/commands/impl/createdocument/createdocument'
], function (require, module, _, $, Url, CommandModel, CommandHelper, ConnectorFactory, EmbedPowerDocsView, lang) {
  var csTypeEcmWorkspace = 848,
      SidePanelView,
      ensureDependencies = _.once(function () {
        var deferred = $.Deferred();
        require(['csui/controls/side.panel/side.panel.view'
        ], function () {
          SidePanelView = arguments[0];
          deferred.resolve();
        }, function (err) {
          deferred.reject(err);
        });
        return deferred.promise();
      }),
      config = module.config();
  var CreateDocumentCommand = CommandModel.extend({
    defaults: {
      signature: 'XECMPFCreateDocument',
      command_key: ['xecmpfcreatedocument', 'XECMPFCreateDocument'],
      name: lang.createDocumentCommand,
      scope: 'single',
      types: [csTypeEcmWorkspace]
    },
    _getNodesByScope: function (status, scope) {
      var nodes;
      if (status.toolItem.attributes.type === "leftToolbar") {
        nodes = [status.container];
      } else {
        nodes = CommandModel.prototype._getNodesByScope.apply(this, arguments);
      }
      return nodes;
    },
    execute: function (status, options) {
      var nodeModel,
          connector = status.container && status.container.connector;
      if (status.toolItem.attributes.type === "leftToolbar") {
        nodeModel = status.container;
      } else {
        nodeModel = CommandHelper.getJustOneNode(status);
      }
      if (connector === undefined) {
        nodeModel && (connector = nodeModel.connector)
      }
      options = _.extend({}, options, {
        context: options ? options.context : status.context,
        connector: connector,
        model: nodeModel
      });
      this._openFormInSidepanel(options);
    },
    _openFormInSidepanel: function (options) {
      ensureDependencies().then(function () {
        var sidePanel, embeddedPowerDocsView, connector, cgiUrl, wsId;

        embeddedPowerDocsView = new EmbedPowerDocsView();
        connector = options.connector;
        cgiUrl = new Url(connector.connection.url).getCgiScript();
        wsId = options.model.get("id");
        sidePanel = new SidePanelView({
          slides: [{
            title: lang.createDocumentDialogTitle,
            content: embeddedPowerDocsView,
            containerClass: 'xecmpf-create-document-slide'
          }],
          backdrop: "sidepanel-backdrop",
          sidePanelClassName: "xecmpf-create-document-side-panel",
          layout: {
            header: true,
            resize: true,
            footer: true,
            mask: true
          }
        });
        sidePanel.show();
        embeddedPowerDocsView.loadPFPowerDocsUrl(cgiUrl, wsId, 'xecmpfdocgen.XECMPFPowerDocsPayload' );
      });
    } 
  });

  return CreateDocumentCommand;
});
