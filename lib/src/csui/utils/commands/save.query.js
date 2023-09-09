/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/models/command', 'csui/models/node/node.model'
], function (require, _, $, lang, CommandModel, NodeModel) {
  'use strict';
  var GlobalMessage, ConnectorFactory, NextNodeModelFactory, nodeLinks, MetadataSaveQueryController;

  var SaveQueryCommand = CommandModel.extend({
    defaults: {
      signature: "SaveQuery",
      command_key: ['savequery', 'SaveQuery'],
      name: lang.CommandNameSaveQuery,
      verb: lang.CommandVerbSaveQuery
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      status.context = context;
      status.suppressSuccessMessage = true;
      require([
        'csui/controls/globalmessage/globalmessage',
        'csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/next.node',
        'csui/utils/node.links/node.links',
        'csui/widgets/metadata/metadata.save.query.controller'
      ], function () {
        GlobalMessage = arguments[0];
        ConnectorFactory = arguments[1];
        NextNodeModelFactory = arguments[2];
        nodeLinks = arguments[3];
        MetadataSaveQueryController = arguments[4];

        self._selectSaveQueryOptions(status, options)
          .done(function (selectedOptions) {
            var targetFolder = selectedOptions.nodes[0],
              queryName = selectedOptions.filterName,
              multiLingualData = selectedOptions.multiLingualData;
            var ajaxFormData = {
              'type': 258,
              'name': queryName,
              'parent_id': targetFolder.get("id")
            };
            multiLingualData && _.extend(ajaxFormData, {
              name_multilingual: multiLingualData
            });

            var searchQueryModel = new NodeModel(ajaxFormData,
              {
                connector: status.connector
              });
            var metadataController = new MetadataSaveQueryController();

            metadataController._checkForRequiredMetadata(searchQueryModel, status).done(function (resp) {

              if (resp && resp.data) {
                ajaxFormData = _.extend(ajaxFormData, resp.data);
              }
              ajaxFormData = _.extend(ajaxFormData,
                {
                  search_cache_id: options.searching && options.searching.cache_id
                });

              var originatingView = status.originatingView;
              searchQueryModel.save(undefined, {
                data: ajaxFormData
              }).done(function (resp) {
                if (originatingView) {
                  originatingView.previousSavedQuery = resp.id;
                }
                deferred.resolve(resp);
                var savedQueryParentNode = new NodeModel({ id: targetFolder.get("id") },
                  { connector: context.getObject(ConnectorFactory) }),
                  name = ajaxFormData.name,
                  msg = _.str.sformat(lang.SaveQueryCommandSuccessfully, name),
                  options = {
                    context: context,
                    nextNodeModelFactory: NextNodeModelFactory,
                    link_url: nodeLinks.getUrl(savedQueryParentNode),
                    targetFolder: savedQueryParentNode
                  },
                  dets; // leave details as undefined;
                GlobalMessage.showMessage('success_with_link', msg, dets, options);
              }).fail(function (error) {
                  deferred.reject(error);
                  if (error && error.responseText) {
                    var errorObj = JSON.parse(error.responseText);
                    GlobalMessage.showMessage('error', errorObj.error);
                  }
                });
            }).fail(function (error) {
              deferred.reject(error);
              if (error && error.responseText) {
                var errorObj = JSON.parse(error.responseText);
                GlobalMessage.showMessage('error', errorObj.error);
              }
            });
          }).fail(function (error) {
            deferred.reject(error);
          });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    _selectSaveQueryOptions: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      require(['csui/dialogs/node.picker/node.picker'],
        function (NodePicker) {
          var pickerOptions = _.extend({
            command: 'savequery',
            selectableTypes: [-1],
            showAllTypes: true,
            orderBy: 'type asc',
            dialogTitle: lang.DialogTitleSaveQuery,
            startLocation: 'personal.volume',
            propertiesSeletor: false,
            saveFilter: true,
            globalSearch: true,
            context: options ? options.context : status.context,
            startLocations: ['enterprise.volume', 'personal.volume', 'favorites',
              'recent.containers'],
            resolveShortcuts: true,
            resultOriginalNode: true,
            selectButtonLabel: lang.saveButtonLabel
          }, status);

          self.nodePicker = new NodePicker(pickerOptions);

          self.nodePicker
            .show()
            .done(function () {
              deferred.resolve.apply(deferred, arguments);
            })
            .fail(function (error) {
              deferred.reject.apply(deferred, arguments);
            });
        }, function (error) {
          deferred.reject(error);
        });
      return deferred.promise();
    }
  });

  return SaveQueryCommand;
});