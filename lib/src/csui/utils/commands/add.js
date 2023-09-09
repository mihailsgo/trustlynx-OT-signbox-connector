/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "require", "csui/lib/jquery", "csui/lib/underscore",
  "csui/utils/log", "csui/models/command", 'csui/models/node/node.model',
  'csui/utils/commands/add/add.mixin',
  'csui/utils/commands/compound.document/compound.document.util',
  "i18n!csui/utils/commands/nls/localized.strings"
], function (module, require, $, _, log, CommandModel, NodeModel, AddMixin, CompoundDocumentsUtil, lang) {
  'use strict';

  var config                   = module.config(),
    supportTypes               = [0, 1, 140, 144, 298, 1307, 1308, 800, 801],
    noFormTypes                = [144, 801, 1307],
      extSignatures            = [],
      extSupportTypes          = config.extSupportTypes || {},
      extNoFormTypes           = config.extNoFormTypes || {},
      extAddCommandsSignatures = config.extAddCommandSignatures || {};

  supportTypes = Array.prototype.concat.apply(supportTypes, _.values(extSupportTypes));
  noFormTypes = Array.prototype.concat.apply(noFormTypes, _.values(extNoFormTypes));
  extSignatures = Array.prototype.concat.apply(extSignatures, _.values(extAddCommandsSignatures));

  var AddCommand = CommandModel.extend({

    defaults: {
      signature: "Add"
    },

    enabled: function (status) {
      status || (status = {});
      if (status.container && status.container.get('container')) {
        if (status.container.get("type") === 298 || (status.container.get("type") === 136 && !CompoundDocumentsUtil.verifyNodeAncestors(status.context))) {
          return false;
        }
        status.data || (status.data = {});
        var addableTypes = status.data.addableTypes;
        return addableTypes && _.any(supportTypes, function (type) {
          return !!addableTypes.get(type);
        });
      }
      return false;
    },

    execute: function (status, options) {
      if (options && options.addableType === undefined) {
        throw new Error('Missing options.addableType');
      }
      var newNode, promise,
          addableTypeName = this._getAddableTypeName(status, options);
      switch (options.addableType) {
      case 0: // folder
      case 298: // collection
      case 1308: // Support Asset Folder
      case 800: // Intelligent Filing Folder
        status.forwardToTable = true;
        newNode = new NodeModel({
          "type": options.addableType,
          "type_name": addableTypeName,
          "container": true,
          "name": "" // start with empty name
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;
      case 136: // compound document
        status.forwardToTable = true;
        newNode = new NodeModel({
          "type": options.addableType,
          "type_name": addableTypeName,
          "container": true,
          "name": "" // start with empty name
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;
      case 140: // url (Content Server SubType)
        status.forwardToTable = true;
        newNode = new NodeModel({
          "type": options.addableType,
          "type_name": addableTypeName,
          "container": false,
          "name": "" // start with empty name
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;
      case 1: // short-cut (Content Server SubType)
        status.forwardToTable = true;
        promise = this._selectShortcutTarget(status, options);
        break;
      case 144: // document (Content Server SubType)
      case 1307: // Support Asset
      case 801: // Document (to be filled)
        status.suppressSuccessMessage = true;
        options.actionType = 'UPLOAD';
        promise = this._selectFilesForUpload(status, options);
        break;
      default :
        promise = this._executeExtCommands(status, options);
      }

      return promise;
    },

    _executeExtCommands: function(status, options) {
      var def = $.Deferred(),
          self = this;

      require(['csui/utils/commands'
      ], function (commands) {
        for (var i = 0; i < extSignatures.length; i++) {
          var command = commands.get(extSignatures[i]);
          if (command.supportTypes &&
              _.indexOf(command.supportTypes, options.addableType) > -1) {
            command.execute(status, options)
              .done(def.resolve)
              .fail(def.reject);
            break;
          }
        }

        if (i === extSignatures.length){
          self.noAddCommandMessage(options)
            .fail(def.reject);
        }
      });
      return def.promise();
    },

    noAddCommandMessage: function (options) {
      var errMsg = "The \"Add\" action for the addableType " +
                   options.addableType + " is not implemented";
      log.debug(errMsg) && console.log(log.last);
      return $.Deferred().reject({
        error: errMsg,
        commandSignature: this.signature
      }).promise();
    },

    _selectShortcutTarget: function (status, options) {
      var self     = this,
          deferred = $.Deferred();
      require(['csui/dialogs/node.picker/node.picker'
      ], function (NodePicker) {
        var pickerOptions   = {
              dialogTitle: lang.ShortcutPickerTitle,
              connector: status.container.connector,
              context: options.context,
              initialContainer: status.container,
              globalSearch: true,
              startLocation: 'recent.containers',
              startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
                'favorites', 'recent.containers'],
              unselectableTypes: [141, 142, 133],
              resolveShortcuts: true,
              resultOriginalNode: true
            },
            addableTypeName = self._getAddableTypeName(status, options);
        self.nodePicker = new NodePicker(pickerOptions);
        return self.nodePicker
          .show()
          .then(function (args) {
            var node = args.nodes[0];
            var newNode = new NodeModel({
              "type": 1,
              "type_name": addableTypeName,
              "container": false,
              "name": node.get('name'),
              "original_id": node.get('id'),
              "original_id_expand": node.attributes
            }, {
              connector: status.container.connector,
              collection: status.collection
            });
            return newNode;
          })
          .done(function () {
            deferred.resolve.apply(deferred, arguments);
          })
          .fail(function () {
            deferred.reject.apply(deferred, arguments);
          });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  }, {

    isAddableTypeWithoutInlineForm: function (addableType) {
      return noFormTypes.indexOf( addableType) !== -1;
    }

  });

  AddMixin.mixin(AddCommand.prototype);

  return AddCommand;

});
