/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command", "csui/utils/url",
], function (module, _, $, Backbone, lang, CommandHelper, CommandModel, URL) {
    'use strict';

    var config = module.config();
    _.defaults(config, {
        enableAboutBox: false,
        aboutBoxContentView: "csui/controls/about.box/about.box.view"
    });

    var AboutBoxCommand = CommandModel.extend({

        defaults: {
            signature: "AboutBox",
            command_key: ['AboutBox', 'AboutBox'],
            scope: "single"
        },

        enabled: function (status, options) {
            return config.enableAboutBox;
        },

        execute: function (status, options) {
            var nodes = CommandHelper.getAtLeastOneNode(status),
                node = CommandHelper.getJustOneNode(status);
            return this.showAboutBox();
        },

        showAboutBox: function () {
            var deferred = $.Deferred();
            var self                = this,
                aboutBoxContentView = config.aboutBoxContentView;
            require(["csui/controls/dialog/dialog.view", "i18n!csui/pages/start/nls/lang",
                aboutBoxContentView
            ], function (DialogView, PublicLang, AboutBoxView) {
                var aboutBoxView = new AboutBoxView(),
                    dialogView   = new DialogView({
                        view: aboutBoxView,
                        midSize: true,
                        className: 'csui-about-box',
                        title: lang.brandTitle + PublicLang.ProductName,
                        headers: [
                            {
                                class: 'csui-logo-image'
                            }],

                    });
                dialogView.show();
                deferred.resolve();
                aboutBoxView &&
                aboutBoxView.listenToOnce(dialogView, 'destroy', function () {
                    aboutBoxView.trigger('destroy');
                });
            });
            return deferred.promise();
        }
    });
    return AboutBoxCommand;
});