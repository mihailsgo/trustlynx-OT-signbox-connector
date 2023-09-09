csui.define(['require',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/base',
  'csui/utils/log',
  'csui/models/command',
  'csui/models/node/node.model',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (require, $, _, base, log,
  CommandModel,
  NodeModel,
  lang) {

    var DocTemplateVolumeType = 20541;

    var AddWorkspaceTemplateCommand = CommandModel.extend({

      defaults: {
        signature: 'AddCONWSTemplate',
        name: lang.CommandNameAddCONWSTemplate,
        scope: 'single'
      },

      enabled: function (status) {
        var node = status.data && status.data.addableTypes && status.data.addableTypes.node,
          nodeData = node && node.get('data'),
          doctemplatesInfo = nodeData && nodeData.doctemplates_info,
          bwsinfo = nodeData && nodeData.bwsinfo;
        return (doctemplatesInfo && bwsinfo && !bwsinfo.id) ? doctemplatesInfo.isInDocTemplateVolTree : false;
      },

      execute: function (status, options) {

        var deferred = $.Deferred(),
          subType = options.addableType,
          subTypeName = options.addableTypeName,
          newNode = new NodeModel({
            "type": subType,
            "type_name": subTypeName,
            "container": true,
            "name": "",
            "parent_id": status.container.attributes.id,
            "is_doctemplate": true
          }, {
              connector: status.container.connector
            });

        status.forwardToTable = true;
        deferred.resolve(newNode);
        return deferred.promise();
      }
    });

    return AddWorkspaceTemplateCommand;
  });



