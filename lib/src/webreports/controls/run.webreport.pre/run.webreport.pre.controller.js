/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/underscore', 'csui/lib/jquery',
    'csui/models/nodes',
    'csui/utils/command.error',
    'webreports/utils/contexts/factories/run.webreport.pre.factory',
    'webreports/utils/commands/open.classic.webreport',
    'webreports/utils/commands/execute.webreport',
    'i18n!webreports/controls/run.webreport.pre/impl/nls/lang'
], function (require, _, $,
             NodeCollection,
             CommandError,
             RunWRPreModelFactory,
             OpenClassicWebReport,
             ExecuteWebReportCommand,
             lang) {
    'use strict';

    function RunWebReportPreController() {
    }

    _.extend(RunWebReportPreController.prototype, {

        runWRPreModel: undefined,
        destinationModel: undefined,
        parametersModel: undefined,
        promptCheckPromise: undefined,

        _getCommandStatus: function () {
            var status;
            if (typeof this.commandStatus === "undefined") {
                status = {
                    nodes: new NodeCollection(this.options.node)
                };
            } else {
                status = this.commandStatus;
            }

            return status;
        },
        switchToPromptView: function (initialStatus, options) {
            var context,
                originatingView,
                self = this,
                deferred = $.Deferred(),
                status = this._getCommandStatus(),
                selected = status.nodes;

            context = status.context || options && options.context;

            originatingView = status.originatingView || options.originatingView;
            require(['csui/lib/marionette', 'csui/lib/backbone',
                'webreports/widgets/parameter.prompt.form/parameter.prompt.form.view',
                'csui/controls/dialog/dialog.view',
                'csui/utils/contexts/factories/next.node',
                'csui/utils/contexts/factories/previous.node',
                'csui/utils/contexts/factories/node',
                'csui/widgets/nodestable/nodestable.view'
            ], function (Marionette, Backbone, PromptView, DialogView, NextNodeFactory, PreviousNodeFactory, NodeFactory, NodesTableWidget) {

                var attrs,
                    parm,
                    promptView,
                    newAttrs = {},
                    previousNode = context.getModel(PreviousNodeFactory),
                    nextNode = context.getModel(NextNodeFactory),
                    thisNode = context.getModel(NodeFactory),
                    promptViewOptions = {
                        RunWRController: self,
                        model: selected,
                        originatingView: originatingView,
                        context: context,
                        showCloseIcon: originatingView ? false : true,
                        showBackIcon: originatingView ? true : false
                    };
                previousNode.clear({silent: true});
                previousNode.set(thisNode.attributes);
                nextNode.clear({silent: true});

                promptView = new PromptView(promptViewOptions);
                if (originatingView instanceof NodesTableWidget) {

                    var _showOriginatingView,
                        $wrPrompts,
                        $originatingView = originatingView.$el,
                        ntWidthVal = $originatingView.width(),
                        ntWidth = ntWidthVal + 'px';

                    $originatingView.parent().append("<div class='wr-prompt-parameters-wrapper'></div>");
                    $wrPrompts = $($originatingView.parent().find('.wr-prompt-parameters-wrapper')[0]);
                    $wrPrompts.hide();

                    promptView.render();
                    Marionette.triggerMethodOn(promptView, 'before:show');
                    $wrPrompts.append(promptView.el);

                    $originatingView.hide('blind', {
                        direction: 'left',
                        complete: function () {
                            $wrPrompts.show('blind',
                                {
                                    direction: 'right',
                                    complete: function () {
                                        Marionette.triggerMethodOn(promptView, 'show');
                                    }
                                },
                                100);
                        }
                    }, 100);

                    $originatingView.promise().done(function () {
                        originatingView.isDisplayed = false;
                        deferred.resolve();
                    });

                    _showOriginatingView = function () {
                        $wrPrompts.hide('blind', {
                            direction: 'right',
                            complete: function () {
                                $originatingView.show('blind',
                                    {
                                        direction: 'left',
                                        complete: function () {
                                            originatingView.triggerMethod('dom:refresh');
                                            originatingView.isDisplayed = true;
                                            !!status.collection && (status.collection.requireSwitched = false);
                                        }
                                    },
                                    100);
                                promptView.destroy();
                                $wrPrompts.remove();
                                deferred.resolve();
                            }
                        }, 100);

                    };

                    Backbone.listenTo(promptView, 'promptView:close', _.bind(_showOriginatingView, self));
                    Backbone.listenTo(promptView, 'promptView:close:without:animation', function () {
                        $originatingView.show('blind',
                            {
                                direction: 'left',
                                complete: function () {
                                    originatingView.triggerMethod('dom:refresh');
                                    !!status.collection && (status.collection.requireSwitched = false);
                                }
                            },
                            100);
                        promptView.destroy();
                        $wrPrompts.remove();
                        deferred.resolve();
                    });

                } else {  // show PromptView in a modal dialog

                    self.dialog = new DialogView({
                        className: 'wr-prompt-parameters',
                        largeSize: true,
                        view: promptView
                    });

                    self.dialog.show();
                    self.dialog.ui.header.hide();
                    self.dialog.listenTo(promptView, 'promptView:close', function () {
                        self.dialog.destroy();
                        deferred.resolve();
                    });

                    self.dialog.listenTo(promptView, 'promptView:close:without:animation', function () {
                        self.dialog.destroy();
                        deferred.resolve();
                    });

                }
            }, function (error) { // error require-ing;
                deferred.reject(new CommandError(error));
            });
            return deferred.promise();
        },
        _getAtLeastOneNode: function (status) {
            if (!status.nodes) {
                return new NodeCollection();
            }

            if (status.nodes.length === 1 && status.collection) {
                return status.collection;
            } else {
                return status.nodes;
            }

        },
        checkForPromptParameters: function (options) {
            var showPrompts,
                promptCheckPromise,
                self = this,
                deferred = $.Deferred(),
                suppressPromptView = (options && _.has(options, 'suppressPromptView')) ? options.suppressPromptView : false;


            this.options = options;
            this._blockParentActions();

            this.getRunWRPreModel(options)
                .done(function () {
                    showPrompts = self._checkPrompts(suppressPromptView);
                    deferred.resolve(showPrompts);
                })
                .fail(function () {
                    self._unblockParentActions();
                    self._cleanupFactory();
                    deferred.reject();
                });

            promptCheckPromise = deferred.promise();
            this.promptCheckPromise = promptCheckPromise;

            return promptCheckPromise;

        },

        getPromptCheckPromise: function(){
            return this.promptCheckPromise;
        },
        getFormView: function (options) {
            var formView,
                WRRunModel = (_.has(this, "runWRPreModel")) ? this.runWRPreModel : (_.has(options, "promptModel")) ? options.promptModel : undefined, // 2nd case is for special scenarios like test pages
                deferred = $.Deferred();
            if (typeof WRRunModel !== "undefined") {

                require([
                    'csui/controls/form/form.view'
                ], function (FormView) {
                    formView = new FormView({
                        context: options.context,
                        model: WRRunModel,
                        mode: 'create'
                    });

                    deferred.resolve(formView);

                }, function (error) {
                    deferred.reject();
                });

            } else {
                deferred.reject();
            }

            return deferred.promise();
        },
        executeWR: function (parms) {
            var executeWRCommand,
                executionMethod,
                status,
                self = this,
                options = _.extend(this.options, {
                    destinationModel: this.destinationModel
                }),
                destinationModel = this.destinationModel,
                outputDestination = destinationModel.get("output_destination");
            executionMethod = this._checkExecutionRoute();

            if (executionMethod === "classic") {
                this.openInClassic(parms);
                this._unblockParentActions();

            } else {
                if (typeof parms !== "undefined") {
                    _.extend(parms, {"prompting": "done"}); // let the server know that prompting is complete.
                    this.options.parameters = parms;

                    this._blockParentActions();
                }
                if (outputDestination === "fullpagewidget") {
                    self._showOutputPerspective();
                } else {

                    executeWRCommand = new ExecuteWebReportCommand();
                    if (typeof this.commandStatus === "undefined") {
                        status = {
                            nodes: new NodeCollection(options.node)
                        };
                    } else {
                        status = this.commandStatus;
                    }
                    if (executeWRCommand.enabled(status)) {
                        executeWRCommand
                            .execute(status, this.options)
                            .done(function (results, executeModel, runInBackground) {

                                if (self.destinationModel.get("show_status_screen") === true) {
                                    self.statusScreenOptions = _.extend(self.options, {
                                        executeModel: executeModel,
                                        runInBackground: runInBackground
                                    });
                                    self.showStatusScreen();
                                } else {
                                    self._unblockParentActions();
                                }
                            })
                            .fail(function () {
                                self._unblockParentActions();
                            });

                    }

                }

            }

        },
        _showOutputPerspective: function () {
            var self = this,
                options = this.options,
                node = options && options.node,
                id = node && node.get("id");

            if (id) {
                require([
                    'csui/utils/contexts/factories/next.node',
                    'csui/utils/contexts/factories/previous.node',
                    'csui/utils/contexts/factories/node'
                ], function (NextNodeFactory, PreviousNodeFactory, NodeFactory) {

                    self.previousNode = self.options.context.getModel(PreviousNodeFactory);
                    self.nextNode = self.options.context.getModel(NextNodeFactory);
                    self.node = self.options.context.getModel(NodeFactory);
                    self.previousNode.clear({silent: true});
                    self.previousNode.set(self.node.attributes);
                    self.nextNode.clear({silent: true});
                    self.nextNode.set({id: id});

                    self._unblockParentActions();
                });
            } else {
                console.error("Unable to get node ID for WebReport");
            }

        },
        openInClassic: function (parms) {
            var status,
                OpenClassic = new OpenClassicWebReport();
            if (typeof parms !== "undefined") {
                _.extend(parms, {"prompting": "done"}); // let the classic UI know that prompting is complete.
                this.options.parameters = parms;
            }
            if (typeof this.commandStatus !== "undefined") {
                status = this.commandStatus;
            } else {
                OpenClassic.openInNewTab = false;
                status = {
                    nodes: new NodeCollection(this.options.node)
                };
            }
            OpenClassic.execute(status, this.options);

        },
        getRunWRPreModel: function (options) {
            var self = this,
                deferred = $.Deferred();

            this.runWRPreModel = this.getRunWrPreFactory(options);

            this.runWRPreModel
                .fetch()
                .done(function (data, status, jqxhr) {
                    self.destinationModel = self.runWRPreModel.destinationModel;
                    self.parametersModel = self.runWRPreModel.parametersModel;
                    deferred.resolve();
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    deferred.reject();
                });

            return deferred.promise();
        },

        getRunWrPreFactory: function(options){
            return options.context.getModel(RunWRPreModelFactory, {
                        unique: true,
                        attributes: {
                            id: options.node.get("id")
                        },
                        options: {
                            id: options.node.get("id")
                        }
                    });
        },
        additionalModelMap: {
            node: {
                primary: "outputData.node_id",
                secondary: "destination_data.destination_specific.create_in_id"
            },

            version: {
                primary: "destination_data.destination_specific.add_version_to_id"
            },

            workflow: {
                primary: "destination_data.destination_specific.workflow_map_id",
                secondary: "outputData.work_id"
            }
        },
        _getStatusScreenModels: function () {
            var options = this.statusScreenOptions,
                outputData = options.executeModel.get("data"),
                destination_data = outputData.destination_data,
                self = this,
                deferred = $.Deferred();
            require(["csui/utils/contexts/factories/node",
                    "workflow/models/workitem/workitem.model.factory"],
                function (NodeFactory, WorkItemModelFactory) {
                    var primaryID,
                        secondaryID,
                        primaryFactory,
                        primaryNode,
                        secondaryNode,
                        secondaryFactory,
                        promises = [],
                        target = destination_data.output_destination;
                    if (target === "node") {
                        if (_.has(destination_data.destination_specific, "add_version_to_id")) {
                            target = "version";
                        }
                    }

                    primaryFactory = NodeFactory;
                    secondaryFactory = NodeFactory;
                    primaryID = eval(self.additionalModelMap[target].primary);
                    if (destination_data.output_destination === 'workflow') {
                        if (destination_data.destination_specific.workflow_attach_output === true) {
                            secondaryFactory = WorkItemModelFactory;
                            secondaryID = eval(self.additionalModelMap[target].secondary);
                        } else {
                            secondaryID = undefined;
                        }
                    } else {
                        secondaryID = eval(self.additionalModelMap[target].secondary);
                    }
                    primaryNode = options.context.getModel(primaryFactory, {
                        attributes: {
                            id: primaryID
                        }
                    });

                    promises.push(primaryNode.fetch());
                    if (typeof secondaryID !== "undefined") {

                        secondaryNode = options.context.getModel(secondaryFactory, {
                            attributes: {
                                id: secondaryID
                            }
                        });

                        if (destination_data.output_destination === 'workflow' && destination_data.destination_specific.workflow_attach_output === true) {
                            secondaryNode.set({
                                process_id: secondaryID,
                                subprocess_id: secondaryID,
                                task_id: 1
                            }, {
                                silent: true  // prevent any of the callbacks from running and changing the perspective
                            });
                        }

                        promises.push(secondaryNode.fetch());

                    }

                    $.whenAll.apply($, promises).then(function (results) {

                        var dataPackages,
                            attachmentsID,
                            wfAttachmentsNode;

                        options.primaryNode = primaryNode;
                        options.secondaryNode = secondaryNode;

                        if (destination_data.output_destination === "workflow" && destination_data.destination_specific.workflow_attach_output === true) {
                            if (secondaryNode.has("data_packages")) {

                                dataPackages = secondaryNode.get("data_packages");

                                if (_.isArray(dataPackages)
                                    && dataPackages.length > 0
                                    && _.has(dataPackages[0], "data")
                                    && _.has(dataPackages[0].data, "attachment_folder_id")
                                ) {

                                    attachmentsID = dataPackages[0].data.attachment_folder_id;

                                    wfAttachmentsNode = options.context.getModel(NodeFactory, {
                                        attributes: {
                                            id: attachmentsID
                                        }
                                    });

                                    wfAttachmentsNode
                                        .fetch()
                                        .then(function () {
                                            self.options.wfAttachmentsNode = wfAttachmentsNode;
                                            self._renderStatusScreen();
                                        });

                                } else {
                                    console.warn("The dataID for the Workflow Attachments is not available.");
                                    self._unblockParentActions();
                                }

                            } else {
                                console.warn("Could not get data packages from Workflow model.");
                                self._unblockParentActions();
                            }

                        } else {
                            self._renderStatusScreen();
                        }
                    });

                }, function (error) {
                    self._unblockParentActions();
                }); // require

        },
        _renderStatusScreen: function () {
            var dialogTitle,
                statusScreenDialog,
                statusScreenView,
                hasSecondaryNode,
                self = this,
                options = this.statusScreenOptions,
                specifics = options.destinationModel.get("destination_specific"),
                outputDestination = options.destinationModel.get("output_destination"),
                deferred = $.Deferred();

            if (outputDestination === "node") {
                if (_.has(specifics, "add_version_to_id")) {
                    outputDestination = "version";
                }
            }

            dialogTitle = (options.destinationModel.get("run_in_background")) ? lang.WebReportExecutingInBackground : lang.WebReportExecutedSuccessfully;

            this._unblockParentActions();
            require([
                    'csui/controls/dialog/dialog.view',
                    'webreports/controls/status.screen/status.screen.view'],
                function (DialogView,
                          StatusScreen) {
                    statusScreenDialog = new DialogView({
                        title: dialogTitle,
                        buttons: [
                            {
                                label: lang.okLabel,
                                close: true,
                                click: _.bind(self._onCloseStatusScreen, self)
                            }
                        ]
                    });
                    statusScreenView = new StatusScreen(_.extend(options, {dialogView: statusScreenDialog}));
                    statusScreenDialog.options.view = statusScreenView;
                    statusScreenView.on("onClickNodeLink", _.bind(self._onCloseStatusScreen, self))
                        .on("onClickSecondaryLink", _.bind(self._onCloseStatusScreen, self));
                    statusScreenDialog.show();

                    deferred.resolve();

                },
                function () {
                    deferred.reject();
                }
            ); // end require

        },

        _onCloseStatusScreen: function () {
            this._unblockParentActions();
            this._cleanupFactory();
        },

        showStatusScreen: function () {
            var options = this.statusScreenOptions,
                rib = options.runInBackground,
                destination_data = (rib) ? options.destinationModel.toJSON() : options.executeModel.get("data").destination_data // if it's running in background, use the destination info from the runPre forms result since we don't have the actual output yet
            ;
            if (!rib && destination_data.output_destination in this.additionalModelMap) {
                this._getStatusScreenModels();
            } else {
                this._renderStatusScreen();
            }
        },
        _checkExecutionRoute: function (parms) {

            var executionRoute,
                destinationModel = this.destinationModel;

            switch (destinationModel.get("output_destination")) {
                case "browser":
                case "desktop":
                    executionRoute = "classic";
                    break;

                default:
                    executionRoute = "smart_ui";
                    break;

            }

            return executionRoute;
        },
        _checkPrompts: function (suppressPromptView) {
            var parm,
                currentSchema,
                currentOptions,
                formSchema,
                formOptions,
                promptRoute = "noPrompts",
                parametersModel = this.parametersModel,
                promptFileId = parametersModel.get("prompt_file_id"),
                hasCustomPromptScreen = false,
                runWRPreModel = this.runWRPreModel,
                destinationModel = this.destinationModel,
                outputDestination = destinationModel.get("output_destination"),
                fullPageWidget = (outputDestination === "fullpagewidget"),
                self = this;

            if (typeof runWRPreModel !== "undefined") {

                hasCustomPromptScreen = (typeof promptFileId !== "undefined" && promptFileId !== "");

                if (hasCustomPromptScreen) {
                    promptRoute = "showClassicPrompts";
                } else {
                    formSchema = runWRPreModel.get("schema");
                    formOptions = runWRPreModel.get("options");

                    if (typeof formSchema !== "undefined" && typeof formOptions !== "undefined") {

                        for (parm in formSchema.properties) {

                            if (formSchema.properties.hasOwnProperty(parm)) {

                                currentSchema = formSchema.properties[parm];
                                currentOptions = formOptions.fields[parm];
                                if (currentOptions.hidden === false) {
                                    if (currentSchema.type === "Custom") {
                                        promptRoute = "showClassicPrompts";
                                        break;
                                    } else {
                                        promptRoute = "showSmartPrompts";
                                    }
                                }

                            }

                        }

                    }

                }
            }

            if (!suppressPromptView) {
                if (fullPageWidget) {
                    this._unblockParentActions();
                    this.executeWR(this.options.parameters);
                } else {
                    switch (promptRoute) {
                        case 'showSmartPrompts':
                            this.switchToPromptView(status, this.options)
                                .done(function () {
                                    self._unblockParentActions();
                                });
                            break;
                        case 'showClassicPrompts':
                            this.openInClassic();
                            this._unblockParentActions();
                            break;
                        default:
                            this._unblockParentActions();
                            this.executeWR(this.options.parameters);
                    }
                }
            }

            this.promptRoute = promptRoute;

            return promptRoute;
        },

        _blockParentActions: function () {
            var origView;
            if (_.has(this, "options") && _.has(this.options, "originatingView")) {
                origView = this.options.originatingView;
                origView && origView.blockActions && origView.blockActions();
                origView && origView.tableView && origView.tableView.blockActions && origView.tableView.blockActions();
            }
        },

        _unblockParentActions: function () {
            var origView;
            if (_.has(this, "options") && _.has(this.options, "originatingView")) {
                origView = this.options.originatingView;
                origView && origView.unblockActions && origView.unblockActions();
                origView && origView.tableView && origView.tableView.unblockActions && origView.tableView.unblockActions();
            }
        },

        _cleanupFactory: function () {
            var options = this.options;

            if (_.has(options, "executeModel")){
                options.executeModel.clear({silent: true});
            }
        }

    });

    _.extend(RunWebReportPreController, {version: "1.0"});

    return RunWebReportPreController;

});