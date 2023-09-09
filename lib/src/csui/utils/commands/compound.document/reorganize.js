/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["require", "csui/lib/underscore", "csui/lib/jquery",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command"
], function (require, _, $, lang, CommandHelper,
    CommandModel) {
    'use strict';
    var  DialogView;

    var ReorganizeCommand = CommandModel.extend({

        defaults: {
            signature: "Reorganize",
            command_key: ['Reorganize', 'reorganize'],
            name: lang.Reorganize,
            verb: lang.Reorganize,
            doneVerb: lang.Reorganize,
            scope: "single",
            selfBlockOnly: true
        },

        execute: function (status, options) {
            this.set('isExecuting', true);
            if (this.stagesModel) {
                delete this.stagesModel;  // to prepare fresh model with new job id
            }
            var nodes = CommandHelper.getAtLeastOneNode(status),
                self = this;
                var node = CommandHelper.getJustOneNode(status);
                this.model = node;
            this.options = options || {};
            this._deferred = $.Deferred();
            this.originatingView = status.originatingView;
            this.originatingView.blockActions();
            this.connector = this.options.connector ||
                status.collection && status.collection.connector ||
                status.container && status.container.connector ||
                nodes.models && nodes.models[0].connector;

            require(["csui/controls/side.panel/side.panel.view", 
            "csui/controls/compound.document/reorganize/reorganize.view",
            'csui/controls/globalmessage/globalmessage',
            'nuc/utils/url'
            ], function (SidePanelView, ReorganizeView, GlobalMessage, URL) {
                DialogView = arguments[0];
                var reorganizeView = new ReorganizeView({
                    context: status.context,
                    connector: self.connector,
                    originatingView: self.originatingView,
                    node: self.model
                    });
                self.sidePanel = new SidePanelView({
                    title: lang.Reorganize,
                    content: reorganizeView,
                    footer: {
                        buttons: [{
                        label: lang.submitButton,
                        id: 'submit',
                        className: 'binf-btn binf-btn-primary csui-submit',
                        }]
                    }
                });
                reorganizeView.options.sidePanel = self.sidePanel;
                reorganizeView.listenToOnce(reorganizeView.collection, 'sync', function() {
                    var sidePanel = self.sidePanel;
                    var collection = sidePanel.options.content.collection;
                    sidePanel.options.footer.buttons[0].disabled = collection.length === 0;
                    sidePanel.show();
                    sidePanel.listenTo(sidePanel.footerView, "button:click", function(event) {
                        $('body .ghostElem').remove();
                        sidePanel.hide();
                        if (event.id === 'submit') {
                            var that = self,
                                nodeId = that.model.get('id'),
                                formData = {
                                    "order": collection.orderedList,"compact": true
                                };
                            var url = that.connector.getConnectionUrl().getApiBase('v2'),
                                ajaxOptions = {
                                    url: URL.combine(url, 'nodes/' + nodeId + '/order'),
                                    type: 'PUT',
                                    data: formData,
                                    contentType: 'application/x-www-form-urlencoded'
                                };
                            that.connector.makeAjaxCall(ajaxOptions).done(function (response) {
                                that._deferred.resolve();
                                GlobalMessage.showMessage('success', lang.ReorganizeSuccessMsg);
                                that.originatingView.collection.fetched = false;
                                that.originatingView.collection.fetch();
                            }).fail(function (error) {
                                that._deferred.reject();
                                if (error && error.responseText) {
                                    var errorObj = JSON.parse(error.responseText);
                                    GlobalMessage.showMessage('error', errorObj.error);
                                }
                            });
                        }
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'before:hide', function () {
                       self._deferred.resolve();
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'after:show', function () {
                        if (this.options.content.collection.length && 
                            _.contains([1, 2, 136],this.options.content.collection.models[0].get('type'))) {
                            this.footerView.$el.find('.csui-submit').length &&
                            $(this.footerView.$el.find('.csui-submit')).prop('disabled', true);
                        }
                        if (self.sidePanel.$el.find('.binf-switch').hasClass('binf-switch-disabled')) {
                            self.sidePanel.$el.find('.binf-switch-container > input').attr('tabindex', -1);
                            self.sidePanel.$el.find('.csui-sidepanel-close').trigger('focus');
                        }
                        else {
                            self.sidePanel.$el.find('.binf-switch-container > input').trigger('focus');
                        }
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'keydown', function (event) {
                        if (event.target.id === "submit" && event.keyCode === 9 && event.shiftKey) {
                            event.preventDefault();
                            event.stopPropagation();
                            this.contentHolders[0].reorganizeListView.focusIndex = 0;
                            $(this.contentHolders[0].reorganizeListView.$el.find('.csui-reorder-item')).removeClass('active');
                            var firstItem = $(this.contentHolders[0].reorganizeListView.$el.find('.csui-reorder-item')[0]);
                            firstItem.trigger('focus');
                            firstItem.addClass('active');
                        }
                    });
                });
                self.originatingView.unblockActions();
            });
            this._deferred.always(function () {
                self.set('isExecuting', false);
            });
            return this._deferred.promise();
        },
    });
    return ReorganizeCommand;
});
