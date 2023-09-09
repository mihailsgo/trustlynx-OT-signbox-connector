/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/url',
  'csui/utils/base',
  'csui/models/command',
  'csui/utils/command.error',
  'i18n!csui/utils/commands/nls/root/localized.strings'
], function (require, module, _, $, Url, base, CommandModel, CommandError, lang) {
  'use strict';

  var config = _.extend({}, module.config());
  _.defaults(config, {
    actionType: 'restructure'
  });

  var RestructureView, GlobalMessage, DialogView, SidePanelView, ModalAlert, NodeLinks,
      ConflictResolver,
      ApplyPropertiesSelectorView,
      ensureDependencies = _.once(function () {
        var deferred = $.Deferred();
        require(['csui/controls/globalmessage/globalmessage',
          'csui/dialogs/restructure/restructure.dialog',
          'csui/controls/dialog/dialog.view',
          'csui/dialogs/modal.alert/modal.alert',
          'csui/controls/side.panel/side.panel.view',
          'csui/utils/node.links/node.links',
          'csui/controls/conflict.resolver/conflict.resolver',
          'csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view',
          'csui/utils/page.leaving.blocker',
          'csui/utils/contexts/factories/application.scope.factory'
        ], function (arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
          GlobalMessage = arg1;
          RestructureView = arg2;
          DialogView = arg3;
          ModalAlert = arg4;
          SidePanelView = arg5;
          NodeLinks = arg6;
          ConflictResolver = arg7;
          ApplyPropertiesSelectorView = arg8;
          deferred.resolve();
        }, function (error) {
          deferred.reject(error);
        });
        return deferred.promise();
      });

  var RestructureCommand = CommandModel.extend({
    defaults: {
      signature: "Restructure",
      command_key: ["restructure", "restructure"],
      name: lang.CommandNameRestructure,
      scope: "multiple",
      labels: {
        actionName: lang.RestructuringNodes,
        actionNode: lang.RestructuringNode,
        commandTitle: lang.CommandTitleRestructure,
        commandName: lang.CommandNameRestructure,
        dialogTitle: lang.DialogTitleRestructure,
        dialogTitleSingle: lang.DialogTitleSingleRestructure,
        titleNotAllowed: lang.RestructureNotAllowed,
      },
    },

    enabled: function (status, options) {
      return CommandModel.prototype.enabled.call(this, status, options);
    },

    execute: function (status, options) {
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      status.restructureCommand = this;
      status.connector = this.connector =
          status.originatingView && status.originatingView.connector;

      this.context = status.context || (options && options.context);
      this.status = status;

      var self = this;

      return ensureDependencies().then(function () {
        var contentView = new RestructureView(status);
        var restructureDialog = new SidePanelView({
          title: lang.RestructureDialogTitle,
          subTitle: status.nodes.length + " " + lang.files,
          content: contentView,
          id: "csui-restructure-Slide-Panel",
          buttons: [
            {
              id: "restructure",
              className: "binf-btn binf-btn-primary",
              label: lang.Restructure,
              default: true,
              disabled: true,
              click: _.bind(self.onClickRestructureButton, self),
            },
          ],
        });
        self.restructureDialog = restructureDialog;
        self.contentView = contentView;
        restructureDialog.show();
      });
    },

    onClickRestructureButton: function () {
      var self     = this,
          deferred = $.Deferred();

      this._performRestructure()
          .done(function () {
            ModalAlert.showInformation(lang.confirmationRestructure, {
              titleIcon: "csui-icon-notification-information",
            });
            self.restructureDialog.destroy();
            deferred.resolve();
            self.status.nodes.reset();
          })
          .fail(function (error) {
            self._showError(error);
            deferred.reject();
          })
          .always(function () {
            self._unblockActions(self.contentView);
          });
    },

    _performRestructure: function () {
      var self     = this,
          deferred = $.Deferred();

      var selectedNodes = this.contentView.selectedNodes;
      var selectedOptions =
              this.contentView.restructureFormView.selectedOptions;
      var targetFolder =
              this.contentView.restructureFormView.selectedOptions[0];
      var applyProperties =
              this.contentView.restructureFormView.applyProperties;
      var bundleNumber = new Date().getTime();
      var labels = this.get("labels");
      var context = this.context;
      selectedOptions.applyProperties = applyProperties;
      selectedOptions.openSelectedProperties =
          this.contentView.restructureFormView.openSelectedProperties;


      this.restructureDialog.hide();
      var namesToResolve = selectedNodes.map(function (node) {
        var returnObj = {
          id: node.get("id"),
          name: node.get("name"),
          container: node.get("container"),
          mime_type: node.get("mime_type"),
          original_id: node.get("original_id"),
          original: node.original,
          type: node.get("type"),
          size: node.get("size"),
          type_name: node.get("type_name"),
          state: "pending",
          count: 0,
          total: 1,
          enableCancel: false,
          bundleNumber: bundleNumber,
        };
        var type = node.get("type");
        if (type === 144 || type === 749 || type === 736 || type === 30309) {
          returnObj.size_formatted = node.get("size_formatted");
        } else if (type === 140) {
          returnObj.url = node.get("url");
        }
        returnObj.actions = node.actions;
        returnObj.targetLocation = {
          id: targetFolder.get("id"),
          url: NodeLinks.getUrl(targetFolder),
        };
        var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
        if (mlDataEnabled) {
          (returnObj.multilingual_provided = true),
          !!node.has("name_multilingual") &&
          (returnObj.name_multilingual = node.get("name_multilingual"));
          !!node.has("description_multilingual") &&
          (returnObj.description_multilingual = node.get(
              "description_multilingual"
          ));
        }
        return returnObj;
      });
      var actionNamesToResolve = _.map(namesToResolve, function (name) {
        return _.clone(name);
      });

      this._resolveNamingConflicts(targetFolder, actionNamesToResolve, labels)
          .done(function (actionInstructions) {
            _.each(actionInstructions, function (instruction) {
              if (instruction.id === undefined) {
                instruction.id = _.findWhere(namesToResolve, {
                  name: instruction.name,
                }).id;
              }
            });
            var that = self;
            self
                ._metadataHandling(
                    actionInstructions,
                    labels,
                    _.extend(selectedOptions, {
                      context: context,
                      targetFolder: targetFolder,
                    })
                )
                .done(function () {
                  var connector, startProcess, notifyUsers, reference, comment, values,
                      selectedNodes, applyProperties, openSelectedProperties, selectedNodeIDs;
                  values = that.contentView.restructureFormView.getValues();
                  connector = that.status.container && that.status.container.connector;
                  selectedNodes = that.status && that.status.nodes;
                  applyProperties = selectedOptions.applyProperties;
                  selectedNodeIDs = [];

                  if (values) {
                    startProcess = values.startProcessAt;
                    notifyUsers = values.notifyUsers;
                    reference = values.reference;
                    comment = values.comment;
                  }

                  _.each(selectedNodes.models, function (model) {
                    selectedNodeIDs.push({dataid: model.get("id")});
                  });

                  var options = {
                    connector: connector,
                    targetFolder: targetFolder,
                    applyProperties: applyProperties ? applyProperties - 1 : 0,
                    status: that.status,
                    context: context,
                    collection: that.status.collection,
                    startProcess: startProcess,
                    notifyUsers: notifyUsers,
                    reference: reference,
                    comment: comment,
                    selectedNodeIDs: selectedNodeIDs,
                  };

                  that
                      .getExternalBodyParams(
                          options.connector,
                          options.selectedNodeIDs
                      )
                      .then(function (extBodyParams) {
                        that
                            ._restructureNodeWithMetadata(
                                actionInstructions,
                                extBodyParams,
                                options
                            )
                            .done(function () {
                              deferred.resolve();
                            })
                            .fail(function (error) {
                              var errObj = new CommandError(error);
                              deferred.reject(errObj);
                            });
                      });
                })
                .fail(function () {
                  deferred.reject();
                });
          })
          .fail(function (error) {
            if (
                error &&
                error.userAction &&
                error.userAction === "cancelResolveNamingConflicts"
            ) {
              self.trigger("resolve:naming:conflicts:cancelled");
            } else if (error && !error.cancelled) {
              self.showError(error);
            }
            deferred.reject();
          });

      return deferred.promise();
    },

    checkMultilingualInfo: function (instructions, params) {
      _.each(instructions, function (instruction) {
        _.each(params.nodes, function(node){
            if((node.dataid === instruction.id) && !!instruction.multilingual_provided) {
              instruction.name_multilingual &&
             (node.name_multilingual = instruction.name_multilingual);
              instruction.description_multilingual &&
             (node.description_multilingual = instruction.description_multilingual);
            }
        });
      });
    },

    _resolveNamingConflicts: function (targetFolder, nodeNames, labels) {
      var h1 =
              nodeNames.length === 1
              ? labels.actionNode
              : _.str.sformat(labels.actionName, nodeNames.length);
      var conflictResolver = new ConflictResolver({
        h1Label: h1,
        actionBtnLabel: labels.commandName,
        excludeAddVersion: true,
        container: targetFolder,
        files: nodeNames,
        originatingView: this.originatingView,
      });
      return conflictResolver.run();
    },

    _metadataHandling: function (items, labels, options) {
      var deferred = $.Deferred();
      this.originatingView &&
      this.originatingView._blockingCounter === 0 &&
      this.originatingView.blockActions();
      require([
        "csui/widgets/metadata/metadata.copy.move.items.controller",
      ], function (MetadataCopyMoveItemsController) {
        var openMetadata = options.openSelectedProperties;
        var applyProperties = options.applyProperties;
        var metadataController = new MetadataCopyMoveItemsController();
        var controllerFunction;
        if (openMetadata) {
          controllerFunction = metadataController.CopyMoveItemsWithMetadata;
        } else if (
            applyProperties ===
            ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES ||
            applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES
        ) {
          controllerFunction = metadataController.CopyMoveItemsRequiredMetadata;
        } else {
          return deferred.resolve();
        }

        if (
            applyProperties ===
            ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES
        ) {
          options.inheritance = "original";
        } else if (
            applyProperties ===
            ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES
        ) {
          options.inheritance = "destination";
        } else if (
            applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES
        ) {
          options.inheritance = "merged";
        }

        options.action = config.actionType;
        controllerFunction
            .call(metadataController, items, options)
            .done(function () {
              deferred.resolve();
            })
            .fail(function (error) {
              deferred.reject(error);
            });
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise();
    },

    _showError: function (error) {
      if (error && !error.cancelled) {
        var cmdErr = new CommandError(error);

        GlobalMessage.showMessage(
            "error",
            lang.errorRestructure,
            cmdErr.errorDetails || cmdErr.message
        );
      }
      this.restructureDialog.destroy();
    },

    _blockActions: function (view) {
      var collectionView = view && (view.resultsView || view.tableView);
      collectionView && collectionView.blockActions();
    },

    _unblockActions: function (view) {
      var collectionView = view && (view.resultsView || view.tableView);
      collectionView && collectionView.unblockActions();
    },

    getExternalBodyParams: function (connector, selectedNodeIds) {
      return $.Deferred().resolve(this.externalBodyParams).promise();
    },

    externalBodyParams: {},

    _restructureNodeWithMetadata: function (
        instructions,
        extBodyParams,
        options
    ) {
      var bodyParam, url;

      url = Url.combine(
          this.connector.getConnectionUrl().getApiBase("v2") + "restructure"
      );
      bodyParam = {
        parent_id: options.targetFolder.get("id"),
        nodes: options.selectedNodeIDs,
        startdate: options.startProcess,
        userstobenotified: options.notifyUsers,
        subject: options.reference,
        message: options.comment,
        AttrSourceType: options.applyProperties,
      };
      _.extend(bodyParam, extBodyParams);
      _.isFunction(this.checkMultilingualInfo) &&
      this.checkMultilingualInfo(instructions, bodyParam);
      _.each(instructions, function (instruction) {
        _.each(bodyParam.nodes , function(node) {
            if(node.dataid === instruction.id) {
              node.roles = instruction.extended_data && instruction.extended_data.roles;
            }
        });
      });

      var restructureOptions = this.connector.extendAjaxOptions({
        url: url,
        method: "PUT",
        data: bodyParam,
        contentType: this.connector.getAjaxContentType(),
      });

      return this.connector.makeAjaxCall(restructureOptions);
    },
  });
  return RestructureCommand;
});