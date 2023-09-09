/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command", "csui/utils/url",
], function (_, $, Backbone, lang, CommandHelper, CommandModel, URL) {
    'use strict';

    var CreateRevisionCommand = CommandModel.extend({

        defaults: {
            signature: "CreateRelease",
            command_key: ['CreateRelease', 'createrelease'],
            name: lang.createReleaseHeaderTitle,
            verb: lang.createReleaseHeaderTitle,
            doneVerb: lang.createReleaseHeaderTitle,
            scope: "single"
        },

        execute: function (status, options) {
            var nodes = CommandHelper.getAtLeastOneNode(status),
                self = this,
                node = CommandHelper.getJustOneNode(status);
            this.model = node;
            this.options = options || {};
            this.context = status && status.context;
            this._deferred = $.Deferred();
            this.connector = this.options.connector ||
                status.collection && status.collection.connector ||
                status.container && status.container.connector ||
                nodes.models && nodes.models[0].connector;
            self._showDialogBox();
            return this._deferred.promise();
        },

        _showDialogBox: function () {
            var self = this;
            require(["csui/controls/dialog/dialog.view",
                "csui/controls/compound.document/dialog.view/create.release.revision.view",
                "csui/controls/progressblocker/blocker"
            ], function (DialogView, CreateReleaseView, BlockingView) {
                var nodeId = self.model.get('id'),
                    url = self.connector.getConnectionUrl().getApiBase('v2'),
                    ajaxOptions = {
                        url: URL.combine(url, 'nodes/' + nodeId + '/releases'),
                        type: 'GET',
                        contentType: 'application/x-www-form-urlencoded'
                    };
                self.connector.makeAjaxCall(ajaxOptions).done(function (resp) {
                    var releaseNumber = 0, newReleaseNumber;
                    _.each(resp.results, function (node) {
                        if (node.data.properties.type_name === "Release") {
                            releaseNumber = releaseNumber > node.data.properties.release ?
                                releaseNumber : node.data.properties.release;
                        }
                    });
                    newReleaseNumber = releaseNumber + 1;

                    self._view = new CreateReleaseView({
                        iconLeft: 'notification_warning',
                        currentVersionLabel: lang.currentRelease,
                        currentVersionNumber: releaseNumber === 0 ? lang.noneLabel : releaseNumber + '.' + 0,
                        newVersionLabel: lang.newRelease,
                        newVersionNumber: newReleaseNumber + '.' + 0,
                        versionNameLabel: lang.releaseName,
                        versionNameNumber: lang.release + newReleaseNumber + '.' + 0,
                        originatingView: self,
                        arialabel: lang.createReleaseHeaderTitle,
                        className: 'csui-create-release'
                    });

                    self._dialog = new DialogView({
                        headerTitle: lang.createReleaseHeaderTitle,
                        view: self._view,
                        standardHeader: false,
                        midSize: true,
                        className: 'csui-create-release-dialog',
                        headers: [
                            {
                                label: lang.createReleaseHeaderTitle,
                                class: 'csui-heading'
                            }],
                        buttons: [
                            {
                                id: 'submit',
                                label: lang.submitButton,
                                click: _.bind(self.onClickSubmitButton, self),
                                'default': true
                            }, {
                                label: lang.cancelButton,
                                close: true,
                                click: _.bind(self.onClickCancelButton, self)
                            }
                        ],
                        dialogTxtAria: lang.createReleaseHeaderTitle
                    });
                    self._view.listenTo(self._view, 'after:show', function () {
                        self._view.ui.nameInput.trigger('focus');
                    });
                    BlockingView.imbue(self._dialog);
                    self._dialog.listenTo(self._dialog, 'hide', _.bind(self.onHideDialog, self));
                    self._dialog.show();
                });
            });
        },

        onHideDialog: function () {
            if (this._deferred) {
                if (this._deferred.state() === 'pending') {
                    this._deferred.reject({ cancelled: true });
                }
            }
        },

        onClickSubmitButton: function () {
            var that = this, successMsg, targetLocation,
                validationSuccess = this._view._validate();
            if (validationSuccess || _.isUndefined(validationSuccess)) {
                require(["csui/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/next.node", "csui/utils/node.links/node.links", "csui/models/nodechildren", "csui/models/node/node.model"
                ], function (GlobalMessage, NextNodeModelFactory, nodeLinks, NodeChildrenCollection, NodeModel) {
                    that._dialog.blockActions();
                    var value = that._dialog.$el.find('.csui-archive-name').val().trim(),
                        nodeId = that.model.get('id');
                    var url = that.connector.getConnectionUrl().getApiBase('v2'),
                        formData = {
                            "name": value
                        },
                        ajaxOptions = {
                            url: URL.combine(url, 'nodes/' + nodeId + '/releases?'),
                            type: 'POST',
                            data: formData,
                            contentType: 'application/x-www-form-urlencoded'
                        };
                    successMsg = _.str.sformat(lang.releaseSuccessMsg, formData.name);
                    that.connector.makeAjaxCall(ajaxOptions).done(function (response) {
                        that._dialog.unblockActions();
                        that._dialog.destroy();
                        delete that._dialog;
                        that._deferred.resolve();
                        var hasLinks, nodeUrl,
                            node = new NodeModel({
                                id: response.results.data.properties.id
                            }, {
                                connector: that.connector
                            }),
                            childrenCollection, childNode, childNodeId;
                        childrenCollection = new NodeChildrenCollection(undefined, { node: node, autoreset: true });
                        childrenCollection.fetch().done(function (resp) {
                            childNode = _.has(resp.data[0], 'id') && resp.data[0].id;
                            childNodeId = !!childNode ? childNode : node;
                            nodeUrl = new Backbone.Model(resp.data[0]);
                            targetLocation = {
                                id: childNodeId,
                                url: nodeLinks.getUrl(nodeUrl)
                            };
                            hasLinks = targetLocation && targetLocation.url ? true : false;
                            GlobalMessage.showMessage('success', successMsg, '', {
                                gotoLocation: lang.GotoLocationLinkLabel,
                                targetLocation: targetLocation,
                                targetLocationUrl: targetLocation && targetLocation.url,
                                doAutoClose: hasLinks,
                                context: that.context,
                                nextNodeModelFactory: NextNodeModelFactory
                            });
                        });
                    }).fail(function (error) {
                        that._dialog.unblockActions();
                        that._dialog.destroy();
                        delete that._dialog;
                        that._deferred.reject();
                        if (error && error.responseText) {
                            var errorObj = JSON.parse(error.responseText);
                            GlobalMessage.showMessage('error', errorObj.error);
                        }
                    });
                });
            }
        },

        onClickCancelButton: function () {
            this._dialog.destroy();
            delete this._dialog;
        }
    });
    return CreateRevisionCommand;
});