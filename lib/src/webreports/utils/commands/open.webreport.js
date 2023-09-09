/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/marionette',
    'csui/utils/command.error',
    'csui/utils/commandhelper',
    'csui/models/command',
    'webreports/utils/contexts/factories/run.webreport.pre.controller.factory'
], function (require,
             _,
             $,
             Marionette,
             CommandError,
             CommandHelper,
             CommandModel,
             RunWrPreControllerFactory) {

    var OpenWebReportCommand = CommandModel.extend({

        constructor: function OpenWebReportCommand() {
            CommandModel.prototype.constructor.call(this);
        },

        defaults: {
            signature: 'OpenWebReport',
            scope: "single"
        },

        enabled: function (status) {
            var node = CommandHelper.getJustOneNode(status);
            return node && node.get('type') === 30303;
        },

        execute: function (status, options) {
            var showPrompts,
                self = this,
                deferred = $.Deferred();

            if (!(_.has(options, "node"))) {
                options.node = status.nodes.models[0];
            }

            $.when(this.fetchOriginalNode(options)).then(function() {
                self.RunWRController = options.context.getObject(RunWrPreControllerFactory,{
                    detached: true,
                    permanent: true,
                    attributes: {
                        id: options.node.get("id")
                    },
                    options: {
                        id: options.node.get("id")
                    }
                });

                self.RunWRController.commandStatus = status;
                require(['webreports/utils/url.webreports'], function (WRUtil) {

                    if (_.has(options, "parameters")) {
                        options.parameters = WRUtil.getWebReportParametersAsData(options.parameters);
                    }
                    showPrompts = self.RunWRController.checkForPromptParameters(options);

                    showPrompts.done(function () {
                        deferred.resolve();
                    })
                    .fail(function (error) {
                        deferred.reject();
                    });

                });
            });

            return deferred.promise();
        },

        fetchOriginalNode: function(options) {
            var deferred = $.Deferred();

            if (options.node.has('name')) {
                deferred.resolve(); // no fetch needed
            }
            else {
                options.node.fetch({
                    success: deferred.resolve,
                    error: deferred.reject
                });
            }

            return deferred.promise();
        }

    });

    return OpenWebReportCommand;

});