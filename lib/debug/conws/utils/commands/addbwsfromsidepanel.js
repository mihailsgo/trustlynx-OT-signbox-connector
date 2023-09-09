csui.define([
    'module',
    'require',
    'csui/lib/jquery',
    'csui/lib/underscore',
    'csui/utils/commandhelper',
    'csui/models/command',
    "csui/dialogs/modal.alert/modal.alert",
    'csui/utils/log',
    'i18n!conws/utils/commands/nls/commands.lang'
], function (module, require, $, _, CommandHelper, CommandModel, ModalAlert, log, lang) {
    'use strict';

    var addBwsEnabled = module.config();
    var visibleFlag;
    var showQuickCreation = {
        enabled:function() {
            return addBwsEnabled;
        }
    }
    var AddWorkspaceFromSidePanelCommand = CommandModel.extend({
        defaults: {
            signature: 'AddBWSFromSidePanel',
            name: lang.CommandNameCreateConnectedWorkspace,
            scope: 'single'
        },

        enabled: function () {
            return showQuickCreation.enabled();
        },

       visible: function(){
        return visibleFlag;
       },

        execute: function (status) {
            var deferred = $.Deferred(),
                context = status.context;

            require(
                [   'csui/lib/backbone',
                    'csui/utils/contexts/factories/connector',
                    'csui/controls/side.panel/side.panel.view',
                    "csui/widgets/metadata/metadata.action.one.item.properties.view",
                    'csui/utils/commands',
                    'csui/models/nodes',
                    'csui/models/node/node.model',
                    'csui/controls/list/emptylist.view',
                    'doctemplates/dialogs/instance.from.template/select.template.view',
                    'conws/models/workspacecreateforms',
                    'conws/models/metadata.controller',
                    'csui/controls/globalmessage/globalmessage',
                    'csui/behaviors/default.action/default.action.behavior',
                    'csui/utils/contexts/factories/next.node',
                    'conws/models/addbwsfromsidepanel/addbwsfromsidepanel.model.factory'
                ], function (Backbone,ConnectorFactory, SidePanelView, MetadataActionOneItemPropertiesView, commands, NodeCollection, NodeModel,
                    EmptyView, SelectTemplateView,
                    WorkspaceCreateFormCollection,
                    WorkspaceMetadataController,
                    GlobalMessage,
                    DefaultActionBehavior,
                    NextNodeModelFactory,
                    AddbwsfromsidepanelCollectionFactory) {

                    var businessWorkspaceTypes,
                        selectTemplateView,
                        formCollection,
                        template = {},
                        metadataAddItemPropView,
                        connector = context.getObject(ConnectorFactory),
                        metadataController = new WorkspaceMetadataController(undefined, undefined),
                        bwsTemplates = [],
                        bwsTemplatesGroups = [],
                        selectedTemplate;


                    var wsTypesCollection = context && context.getCollection(
                            AddbwsfromsidepanelCollectionFactory,
                                {
                                detached: true,
                                permanent: true,
                                connector: connector,
                                }
                        );

                    wsTypesCollection.fetch()
                    .then(function(){
                        businessWorkspaceTypes =  wsTypesCollection.models[0].attributes;
                        if (businessWorkspaceTypes && businessWorkspaceTypes.results && businessWorkspaceTypes.results.length > 0) {
                            businessWorkspaceTypes = businessWorkspaceTypes.results;

                            businessWorkspaceTypes.forEach(function(bwtype) {

                                if (bwtype.data !== undefined && bwtype.data.properties !== undefined) {

                                    var wsType =[];
                                    var wksp_type_icon = bwtype.data.wksp_info && bwtype.data.wksp_info.wksp_type_icon;

                                    wsType = {
                                        wksp_type_id: bwtype.data.properties.wksp_type_id,
                                        wksp_type_name: bwtype.data.properties.wksp_type_name,
                                        rm_enabled: bwtype.data.properties.rm_enabled
                                    }

                                    if(bwtype.data.properties.templates !== undefined && bwtype.data.properties.templates.length > 0) {
                                        bwtype.data.properties.templates.forEach(function(tmpl){
                                            var bwsTemplate = {
                                                id: tmpl.id,
                                                name: tmpl.name,
                                                type: tmpl.subtype,
                                                wksp_type: wsType,
                                                type_name: lang.BusinessWorkspaceTypeName,
                                                image_url: wksp_type_icon
                                            };
                                            bwsTemplates.push(bwsTemplate);
                                        });
                                    }
                                }
                            });

                            //sorting
                            if (bwsTemplates.length) {
                                bwsTemplates = _.sortBy(bwsTemplates, function (template) {
                                    return template.name.toLowerCase();
                                });
                            }

                            var data = status.data || {},
                                groupName = data.groupName || lang.AvailableBWSTemplate,
                                title = data.title || lang.CreateBusinessWorkspace,
                                subtitle = data.subtitle || "",
                                sidePanelSize = data.size,
                                sidePanelResize = data.resize;

                                //select.template.view expect a list of groups including templates, so one group will be created
                                bwsTemplatesGroups[0] = {id:1, name: groupName, templates: bwsTemplates};

                                //First slide view
                                selectTemplateView = new SelectTemplateView({
                                    context: context,
                                    templatesGroup: bwsTemplatesGroups
                                });

                            var newNode = new NodeModel({type:848}, {connector: connector});
                            status.nodes = new NodeCollection([newNode]);
                            var nodes = CommandHelper.getAtLeastOneNode(status),
                                node = nodes.length > 0 ? nodes.models[0] : null;

                            formCollection = new WorkspaceCreateFormCollection(undefined, {
                                node: newNode,
                                type: 848,
                                wsType: 0
                            });

                            metadataAddItemPropView = new MetadataActionOneItemPropertiesView({
                                model: node,
                                connector: connector,
                                container: status.container || undefined,
                                context: context,
                                commands: commands,
                                action: 'create',
                                formCollection: formCollection
                            });

                            var sidePanel = new SidePanelView({
                                slides: [{
                                    title: title,
                                    subTitle: subtitle,
                                    content: selectTemplateView,
                                    footer: {
                                        buttons: [{
                                            label: lang.sidePanelNextButton,
                                            type: 'next',
                                            id: 'continue-btn',
                                            disabled: false,
                                            className: 'binf-btn binf-btn-primary'
                                        }]
                                    }
                                },
                                {
                                    title: lang.CreateBusinessWorkspace,
                                    content: metadataAddItemPropView,
                                    footer: {
                                        buttons: [{
                                            className: 'binf-btn binf-btn-primary'
                                        }]
                                    }
                                }],
                                sidePanelClassName: 'template-in-sidepanel',
                                layout: {
                                    size: sidePanelSize,
                                    resize: sidePanelResize
                                }
                            });

                            selectTemplateView.listenTo(selectTemplateView, 'template:selected', function (templateData) {
                                template = templateData || {};
                                sidePanel.trigger('update:button', 'continue-btn', { disabled: false });
                            });

                            selectTemplateView.listenTo(selectTemplateView, 'template:unselected', function () {
                                sidePanel.trigger('update:button', 'continue-btn', { disabled: true });
                            });

                            selectTemplateView.listenTo(selectTemplateView, "templates:rendered", function () {
                                sidePanel.ui.header && sidePanel.ui.header.find('.csui-sidepanel-close').trigger('focus');
                            })

                            metadataAddItemPropView.listenTo(metadataAddItemPropView, "update:button", _.bind(function (args) {
                                sidePanel.slides[1].footer.buttons[0].label = lang.sidePanelCreateButton;
                                sidePanel.slides[1].footer.buttons[0].type = 'action';
                                sidePanel.slides[1].footer.buttons[0].id = 'create-btn';
                                sidePanel.trigger('update:button', 'create-btn', args);
                            }, this));

                            sidePanel.listenTo(metadataAddItemPropView, "button:click", function (actionButton) {
                                if (actionButton.id === 'create-btn') {
                                    var valid = metadataAddItemPropView.validate();
                                    if (valid) {
                                        var data = metadataAddItemPropView.getValues();
                                        metadataAddItemPropView.metadataPropertiesView.blockActions();
                                        metadataController.createItem(node, data)
                                            .done(_.bind(function () {
                                                metadataAddItemPropView.metadataPropertiesView.unblockActions();
                                                deferred.resolve({ name: data.name });
                                                sidePanel.hide();
                                                if (node.attributes.direct_open){
                                                    openNewWorkspace(node);
                                                } else {
                                                    successWithLinkMessage(node);
                                                }
                                            }, this))
                                            .fail(_.bind(function (resp) {
                                                metadataAddItemPropView.metadataPropertiesView.unblockActions();
                                                var error = lang.failedToCreateItem;
                                                if (resp) {
                                                    if (resp.responseJSON && resp.responseJSON.error) {
                                                        error = resp.responseJSON.error;
                                                    } else if (resp.responseText) {
                                                        error = resp.responseText;
                                                    }
                                                    ModalAlert.showError(error);
                                                }
                                            }, this));
                                    }
                                }
                            });

                            sidePanel.listenTo(metadataAddItemPropView, "button:click", function (actionButton) {
                                if (actionButton.type === "back"){
                                    metadataAddItemPropView.model.newCategories = new Backbone.Collection();
                                }
                            });

                            sidePanel.listenTo(selectTemplateView, "button:click", function (actionButton) {
                                if (actionButton.id === 'continue-btn') {

                                    if(selectedTemplate !== template) {
                                        selectedTemplate = template;
                                        if(metadataAddItemPropView.metadataPropertiesView.$el){
                                            metadataAddItemPropView.metadataPropertiesView.$el.hide();
                                            metadataAddItemPropView.metadataPropertiesView.once("render:forms",function() {
                                                metadataAddItemPropView.metadataPropertiesView.$el.show();
                                            });
                                        }

                                        //metadataAddItemController dummy to prepare an anchor
                                        //for search/add business objects in xecmpf e.g. reference.panel.controller ....
                                        var addReferenceAnchor = {
                                            sidePanel: sidePanel,
                                            metadataAddItemPropView: metadataAddItemPropView.metadataPropertiesView,
                                            metadataController: metadataController
                                        }

                                        delete formCollection.bo_type_id;
                                        delete formCollection.bo_id;
                                        formCollection.options.metadataAddItemController = addReferenceAnchor;
                                        formCollection.options.wsType =template.wksp_type.wksp_type_id;

                                        metadataAddItemPropView.metadataPropertiesView.allForms.formCollection = formCollection;

                                        formCollection.on("sync",function(){ updateNameAndView(newNode,formCollection,metadataAddItemPropView);});
                                        formCollection.on("error",function(response){
                                            sidePanel.trigger('update:button', 'create-btn', { disabled: true });
                                            var errmsg = response && response.error.message || lang.errorGettingCreateForm;
                                            log.error("Fetching the create forms failed: {0}",errmsg) && console.error(log.last);
                                            ModalAlert.showError(errmsg);
                                            selectedTemplate = undefined;
                                            delete response._events["error"];
                                        });

                                        formCollection.options.template = template;
                                        metadataController.options.template = template;

                                        sidePanel.slides[1].title = _.str.sformat(lang.sidePanelTitle, template.name||lang.BusinessWorkspace);

                                        var subTypeName = template.type === 848 ? lang.BusinessWorkspaceTypeName : '';
                                        newNode.set({
                                            //to call update:button event
                                            "name": template.name,
                                            "type_name": subTypeName,
                                            "rm_enabled": template.wksp_type.rm_enabled,
                                        });

                                        metadataAddItemPropView.firstFocusCalled = undefined;
                                        metadataAddItemPropView.metadataPropertiesView.allForms.fetch();
                                    }
                                }
                            });

                            sidePanel.listenTo(sidePanel, "after:show", function () {
                                selectTemplateView.trigger('dom:refresh');
                                sidePanel.trigger('update:button', 'continue-btn', { disabled: true });
                            });

                            sidePanel.listenTo(sidePanel, "before:show", function () {
                                visibleFlag = true;
                            });

                            sidePanel.listenTo(sidePanel, "before:hide", function () {
                                visibleFlag = false;
                                deferred.resolve();
                            });

                            if (bwsTemplates.length === 0)
                            {
                                var emptyTemplatesList = new EmptyView({text: lang.noResults});
                                sidePanel.slides[0].content = emptyTemplatesList;
                            }

                            sidePanel.show();
                            var originatingView = status.originatingView;
                            originatingView.$el.append(sidePanel.$el);
                        }
                    }, function (error) {
                        deferred.reject(error);
                        }
                    );

                   function successWithLinkMessage(newNode) {
                        var message = _.str.sformat(lang.BusinessWorkspaceSuccessfullyCreated, newNode.get('name'));
                        var msgOptions = {
                            context: status.context,
                            nextNodeModelFactory: NextNodeModelFactory,
                            link_url: DefaultActionBehavior.getDefaultActionNodeUrl(newNode),
                            link_label: lang.CommandMessageOpen,
                            targetFolder: newNode
                        };
                        GlobalMessage.showMessage('success_with_link', message, undefined, msgOptions);
                    }

                    // if enabled open new BWS after creation CWS-4584
                    function openNewWorkspace(newNode) {
                        var nextNode = status.context.getModel(NextNodeModelFactory);
                        nextNode.set('id', newNode.get('id'));
                    }

                    function updateNameAndView (nodeModel, formCollection, metadataAddItemPropView) {
                        // we have special behavior for the name field, depending on the forms result.
                        // so we put the code here, where we have access to the name field in the dialog header.
                        var general = formCollection.at(0);
                        if (!nodeModel.get("id")) {
                            // due to LPAD-50061, the form collection is fetched after save.
                            // to avoid CWS-1140, we change the name only if id is not set.
                            var data = general.get("data");
                            if (data) {
                                var name = data.name,
                                    parent_id = data.parent_id;
                                log.debug("name fetched and used: {0}",name) && console.log(log.last);
                                nodeModel.set("name",name);
                                nodeModel.set("parent_id",parent_id);
                                var containerId = new NodeModel({id:parent_id });
                                metadataAddItemPropView.metadataPropertiesView.options.container = containerId;
                            } else {
                                // if no server data object is set, then we set an empty name.
                                log.debug("name set to empty.") && console.log(log.last);
                                nodeModel.set("name","");
                            }
                        }

                        var headerView = metadataAddItemPropView && metadataAddItemPropView.metadataHeaderView,
                            nameView = headerView && headerView.metadataItemNameView;
                        if (nameView) {
                            var gs = general.get("schema"),
                                isReadOnly = (gs && gs.properties && gs.properties.name && gs.properties.name.readonly) ? true : false,
                                placeHolder = isReadOnly ? lang.nameIsGeneratedAutomatically : undefined;
                            nameView.setPlaceHolder(placeHolder);
                            if (isReadOnly && metadataAddItemPropView && metadataAddItemPropView.metadataPropertiesView) {
                            metadataAddItemPropView.metadataPropertiesView.once("render:forms",function() {
                                //If read only, remove the role for the place holder text
                                this.options.metadataView.metadataHeaderView.metadataItemNameView.$el.find('span.title').removeAttr("role");
                                var focusEl = this.currentlyFocusedElement();
                                if (focusEl) {
                                focusEl.trigger('focus');
                                }
                            });
                            }
                        }
                    }
                }, function (error) {
                        deferred.reject(error);
                });

            return deferred.promise();
        }
    });

    return AddWorkspaceFromSidePanelCommand;
});