/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/utils/base', 
    'csui/utils/contexts/factories/connector',
    'csui/controls/tab.panel/tab.panel.view',
    'csui/controls/tab.panel/tab.links.ext.view',
    'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
    'csui/models/form', 
    'csui/controls/form/form.view',
    'csui/controls/globalmessage/globalmessage',
    'csui/widgets/metadata/metadata.properties.view',
    'csui/controls/progressblocker/blocker',
    'csui/controls/tile/behaviors/perfect.scrolling.behavior',
    'xecmpf/widgets/eac/impl/actionplan.processmode/actionplan.processmode.view',
    'xecmpf/widgets/eac/impl/actionplan.processmode/impl/actionplan.processmode.form.model',
    'xecmpf/widgets/eac/impl/actionplan.rules/impl/actionplan.rules.form.model',
    'xecmpf/widgets/eac/impl/actionplan.rules/actionplan.rules.view',
    'xecmpf/widgets/eac/impl/actionplan.actions/actionplan.actions.view',
    'xecmpf/widgets/eac/impl/actionplan.tab.content/actionplan.empty.content.view',
    'i18n!xecmpf/widgets/eac/impl/nls/lang'
], function(_, $, Backbone, base, ConnectorFactory, TabPanelView, TabLinkCollectionViewExt,
    TabLinksScrollMixin, FormModel, FormView, GlobalMessage, MetaDataPropertiesView, BlockingView, PerfectScrollingBehavior, ProcessModeView, ProcessModeFormModel, EACRuleFormModel, RulesView, ActionsView, EmptyContentView, lang) {
    var ACTIONPLAN_CONTENT_VIEW_CONST = {
        ERROR_ACTION_PLAN_CREATION: lang.genericWarningMsgOnDeletion
    };
    var ActionPlanContentView = TabPanelView.extend({

        className: (base.isTouchBrowser() ? 'cs-touch-browser ' : '') +
            'cs-metadata-actionplan-content cs-metadata-properties binf-panel binf-panel-default',

        contentView: function(model) {
            var contentView = FormView;
            var panel = _.findWhere(this._propertyPanels, {
                model: model
            });
            if (panel) {
                return panel.contentView || FormView;
            } 
            if (!this.options.isAddActionPlan) {
                switch (model.get('role_name')) {
                    case 'rules':
                        contentView = RulesView;                    
                    break;
                    case 'actions':
                        contentView = ActionsView;
                    break;
                    case 'processMode':
                        contentView = ProcessModeView;
                    break;
                }
            } else {
                this.$el.addClass("eac-newactionplan-content");
                contentView = EmptyContentView;
            }
            return contentView;
        },

        contentViewOptions: function(model) {
            var eventModel = this.options.node;
            var options = {
                    eventModel: eventModel,
                    context: this.options.context
                },
                panel = _.findWhere(this._propertyPanels, {
                    model: model
                });

            switch (model.get('role_name')) {
                case 'rules':
                    var actionPlanRuleModels,
                        actionPlanRulescollection = new Backbone.Collection(),
                        actionPlanRules = [{}];
                    if (!!eventModel && !!eventModel.get('data') && !!eventModel.get('data').ruleConditions && eventModel.get('data').ruleConditions.length > 0) {
                        actionPlanRules = eventModel.get('data').ruleConditions;
                    }
                    actionPlanRuleModels = actionPlanRules.map(function(rule, index) {
                        return new Backbone.Model({
                            sequence: index + 1,
                            operand: rule.operand || '',
                            operator: rule.operation || '',
                            to: rule.value || '',
                            conjunction: rule.logicalConnective || '',
                            categoryDetails: rule.categoryDetails || ''
                        });
                    });
                    actionPlanRulescollection.set(actionPlanRuleModels);
                    this.eacRuleFormModel = new EACRuleFormModel(undefined, {
                        context: this.options.context,
                        eventModel: eventModel,
                        collection: actionPlanRulescollection
                    });
                    _.extend(options, {
                        mode: 'update',
                        model: this.eacRuleFormModel,
                        isNewActionPlan: !eventModel.get('plan_id')
                    }); 
                break;
                case 'actions':
                    _.extend(options, {
                        summary: false
                    });
                break;
                case 'processMode':
                    var processModeModel = new ProcessModeFormModel(undefined, {
                        context: this.options.context,
                        eventModel: eventModel
                    });
                    _.extend(options, {
                        mode: 'create',
                        model: processModeModel
                    });
            }
            if (panel) {
                _.extend(options, panel.contentViewOptions);
            }            
            return options;
        },
        isTabable: function() {
            if (this.options.notTabableRegion === true) {
                return false;
            }
            return true; // this view can be reached by tab
        },

        constructor: function ActionPlanContentView(options) {
            options || (options = {});

            _.defaults(options, {
                tabType: 'binf-nav-pills',
                mode: 'spy',
                extraScrollTopOffset: 3,
                formMode: 'update',
                toolbar: true,
                contentView: this.getContentView,
                TabLinkCollectionViewClass: TabLinkCollectionViewExt,
                tabContentAccSelectors: 'a[href], area[href], input:not([disabled]),' +
                    ' select:not([disabled]), textarea:not([disabled]),' +
                    ' button:not([disabled]), iframe, object, embed,' +
                    ' *[tabindex], *[cstabindex], *[contenteditable]'
            });
            options.collection = new Backbone.Collection();
            var tabItemsCollection = new Backbone.Collection();
            var tabItems = [{
                role_name: "rules",
                title: lang.rulesTabLabel
            }, {
                role_name: "actions",
                title: lang.actionsTabLabel,
                required: true
            }, {
                role_name: 'processMode',
                title: lang.processModeTabLabel,
                required: true
            }];
            tabItems.forEach(function(tabItem) {
                tabItemsCollection.push(new Backbone.Model(tabItem));
            });
            this.eacEventActionPlans = tabItemsCollection;            

            TabPanelView.prototype.constructor.apply(this, arguments);
            this.connector = this.options.context.getObject(ConnectorFactory);

            if (this.options.blockingParentView) {
                BlockingView.delegate(this, this.options.blockingParentView);
            } else {
              BlockingView.imbue(this);
            }

            this.listenTo(this.eacEventActionPlans, "request", this.blockActions)
                .listenTo(this.eacEventActionPlans, "request", this._checkFormFetching)
                .listenTo(this.eacEventActionPlans, "sync", this._syncForms)
                .listenTo(this.eacEventActionPlans, "sync", this.unblockActions)
                .listenTo(this.eacEventActionPlans, "destroy", this.unblockActions)
                .listenTo(this.eacEventActionPlans, "error", this.unblockActions)
                .listenTo(this.collection, "reset", this.render);

            this.eacEventActionPlans.trigger('sync');
            if (this.eacEventActionPlans.fetching) {
                this.blockActions();
            }

            $(window).on('resize', _.bind(this._onWindowResize, this));
            this.listenTo(this, 'render', this.onRendered);
        },
        behaviors: {
            PerfectScrolling: {
                behaviorClass: PerfectScrollingBehavior,
                contentParent: '> .binf-tab-content',
                suppressScrollX: true,
                scrollYMarginOffset: 15
            }
        },
        onBeforeDestroy: function() {
            $(window).off('resize', this._onWindowResize);
        },

        render: function() {            
            TabPanelView.prototype.render.apply(this);
            this._initializeOthers();
            return this;
        },

        onRendered: function() {
            this._setTablinksAttributes();
            setTimeout(_.bind(this._setTablinksAttributes, this), 300);
            this.tabLinks.stopListening(this.collection, 'reset');
            this.tabContent.stopListening(this.collection, 'reset');
            this.tabLinks.$el.addClass('binf-hidden');
            this.tabContent.$el.addClass('binf-hidden');

            this.blockActions();

            var allFormsRendered = [],
                self = this;
            this.tabContent.children.each(_.bind(function(childView) {
                var formRendered = $.Deferred();
                allFormsRendered.push(formRendered.promise());
                if (childView.content instanceof FormView) {
                    this.listenTo(childView.content, 'render:form', function() {
                        formRendered.resolve();
                    });
                } else {
                    formRendered.resolve();
                }
            }, this));
            $.when.apply($, allFormsRendered).done(function() {
                self.unblockActions();
                self.tabLinks.$el.removeClass('binf-hidden');
                self.tabContent.$el.removeClass('binf-hidden');
                self._initializeOthers();
                self.triggerMethod('render:forms', this);
                var event = $.Event('tab:content:render');
                self.$el.trigger(event);

                self.trigger('update:scrollbar');

            });
        },

        onPanelActivated: function() {
            setTimeout(_.bind(function() {
                this._setTablinksAttributes();
                this._enableToolbarState('.tab-links .tab-links-bar > ul li');
            }, this), 300);
        },

        _setTablinksAttributes: function() {
            var i, limit = 5;
            var siblings, parent = this.$el.parent();
            for (i = 0; i < limit; i++) {
                siblings = parent.siblings('.cs-tab-links.binf-dropdown');
                if (siblings.length > 0) {
                    var width = $(siblings[0]).width();
                    if (width > 15) {
                        var newWidth = width - 12,
                            widForEle = newWidth + "px",
                            dirForEle = this.rtlEnabled ? "margin-right" : "margin-left",
                            tabLinksEle = this.$el.find('.tab-links');

                        tabLinksEle.css({
                            "width": function() {
                                return "calc(100% - " + widForEle + ")";
                            }
                        });

                        tabLinksEle.css(dirForEle, widForEle);
                    }
                    break;
                }
                parent = parent.parent();
            }
        },

        _syncForms: function() {
            this._fetchingForms = false;
            var panelModels = this.eacEventActionPlans.where({
                role_name: 'rules'
            });
            panelModels = _.union(panelModels, this.eacEventActionPlans.where({
                role_name: 'actions'
            }));
            panelModels = _.union(panelModels, this.eacEventActionPlans.where({
                role_name: 'processMode'
            }));

            this.panelModelsLength = panelModels.length;
            this._normalizeModels(panelModels);
            this.collection.reset(panelModels);
        },

        _normalizeModels: function(models) {
            _.each(models, function(model) {
                if (model instanceof FormModel) {
                    var schema = model.get('schema');
                    if (schema && schema.title) {
                        model.set('title', schema.title);
                    }
                }
                if (model.get('id') == null) {
                    model.set('id', model.cid);
                }
                if (model.collection) {
                    model.collection.remove(model);
                }
            });
        },
        _initializeOthers: function() {
            var options = {
                gotoPreviousTooltip: '',
                gotoNextTooltip: ''
            };
            this._initializeToolbars(options);
            this._listenToTabEvent();
            setTimeout(_.bind(this._enableToolbarState, this), 300);
        },

        _onWindowResize: function() {
            if (this.resizeTimer) {
                clearTimeout(this.resizeTimer);
            }
            this.resizeTimer = setTimeout(_.bind(function() {
                this._setTablinksAttributes();
                this._enableToolbarState();
            }, this), 200);
        },
        saveActionPlanContent: function() {
            if (this.isAllFormsValid()) { // validate forms
               return this.makeActionPlanServiceCall();
            } else {
                return $.Deferred().reject('FORM_NOT_VALID');
            }
        }, 
        isAllFormsValid: function() {
            var formIsValid = true;
            this.tabContent.children.forEach(function(childView) {
                var roleName = childView.model.get('role_name');                
                if (childView.content.isFormValid) {
                    if (!childView.content.isFormValid()) {
                        formIsValid = false;
                    }
                } else if (childView.content instanceof FormView) {
                    if (!childView.content.validate() && roleName !== 'actions') {
                        formIsValid = false;
                    }
                } 
            });
            return formIsValid;
        },
        getFormsData: function() {
            var formsData = {};
            this.tabContent.children.forEach(function(childView) {
                var roleName = childView.model.get('role_name');
                roleName = roleName === 'processMode'? 'summary' : roleName;   

                if (childView.content.getSubmitData) {
                    formsData[roleName] = childView.content.getSubmitData(); 
                } else if (childView.content instanceof FormView) {
                    formsData[roleName] = childView.content.getValues();
                } 
            });
            return formsData;
        },
        getGeneralInformation: function() {
            var generalInfo = {};
            var actionPlanModel = this.options.node,
                eventName = !!actionPlanModel.get('event_name') ? actionPlanModel.get('event_name') : 
                            (!!this.options.context.viewStateModel ? this.options.context.viewStateModel.get('back_to_title') : undefined),
                            namespace = !!actionPlanModel.get('namespace')? actionPlanModel.get('namespace') :actionPlanModel.namespace;
            generalInfo['event_def_id'] = !!this.options.node.get('id') ? actionPlanModel.get('parent_id') : actionPlanModel.get('event_def_id');
            generalInfo['event_id'] = actionPlanModel.get('eventType');
            generalInfo['namespace'] = !!actionPlanModel.get('data') ? actionPlanModel.get('data').systemName : namespace;
            generalInfo['event_name'] = !!actionPlanModel.get('data') ? actionPlanModel.get('data').eventName : eventName;
            generalInfo['rule_id'] = !!actionPlanModel.get('data') ? actionPlanModel.get('data').ruleID : actionPlanModel.get('rule_id');
            generalInfo['plan_id'] = actionPlanModel.get('id');
            return generalInfo;
        },              
        makeActionPlanServiceCall: function() {
            var i, k, actionModel, actionAttributeCount, actionModelCollection, fromValue, toValue, operatorValue, propType, that = this, action_key, action_source, action_actionattrname,action_value, action_field,
                expValue, alpacaFieldTypeMap,
                actionPlanUrl = this.connector.getConnectionUrl().getApiBase('v2') + '/nodes', 
                actionPlanDetailsUrl = this.connector.getConnectionUrl().getApiBase('v2') + '/eventactioncenter/actionplan',               
                actionPlanRequestData = new FormData(),
                actionPlanDetailsRequestData = new FormData(),
                actionPlanData = new FormData(),
                requestData = this.getFormsData(),
                $deferred = $.Deferred();
            if (!!requestData.rules) {
                for (i = 0; i < requestData.rules.length; i++) {
                    fromValue = requestData.rules[i].from;
                    if (!!fromValue) {
                        toValue = requestData.rules[i]["value" + fromValue];
                        propType = !!fromValue && this.eacRuleFormModel.eacPropertiesCollection.findWhere({ name: fromValue }).get('type');
                        if (propType === "Classification") {
                            switch (toValue) {
                                case "Unclassified":
                                    toValue = 0;
                                    break;
                                case "Any":
                                    toValue = 1;
                                    break;
                                case "Custom":
                                    toValue = requestData.rules[i]["to2" + fromValue];
                                    break;
                            }
                        }
                        if (fromValue === "Category Attribute") {
                          propType = this.eacRuleFormModel.categoryResponse.typeName
                          alpacaFieldTypeMap = {
                            'Date': 'date',
                            'Integer': 'integer',
                            'User': 'otcs_user_picker',
                            'StringField': '',
                            'Boolean': 'checkbox'
                          } 
                          expValue = requestData.rules[i][ "to2" + fromValue + alpacaFieldTypeMap[propType] ];    
                          requestData.rules[i].expValue = expValue;
                        }
                        operatorValue = requestData.rules[i]["operator" + fromValue];
                        requestData.rules[i].operator = operatorValue;
                        requestData.rules[i].to = toValue;
                    } else {
                        requestData.rules[i] = {};
                    }
                }
            }
            if (!!requestData.actions) {
                for (i = 0; i < requestData.actions.length; i++) {
                    actionModel = requestData.actions[i];
                    if (requestData.actions[i].valueDependsOn) {
                        requestData.actions[i].valueDependsOn = 1;
                    } else {
                        requestData.actions[i].valueDependsOn = 0;
                    }
                    actionModelCollection =  !!this.options.node.actionAttributeCollection && this.options.node.actionAttributeCollection.findWhere({action_key:actionModel.action});
                    actionAttributeCount = !!actionModelCollection ? actionModelCollection.attributes.actions_attribute_count : 0;
                    for (k = 0; k < actionAttributeCount; k++) {
                        if( actionModel.action === 'ReminderEventAction.Add A Reminder' || actionModel.action === 'DocGenEventAction.Generate Document' || actionModel.action === 'CreateOrUpdateCentralWorkspace.Create Or Update Central Workspace' || actionModel.action === 'StartWorkflowEventAction.Start workflow') {
                            action_key = actionModelCollection.attributes.actions_attributes[k].key
                        }
                        else {
                            action_key = actionModel[actionModel.action + "_fields"]['actionattributes']['key' + k];
                        } 
                        action_source = actionModel["source" + action_key];
                        action_field = actionModel[action_source + '_field' + action_key];
                        if (!!action_key) {
                            action_actionattrname = actionModel["actionattrname" + action_key];
                            if (actionModel.action === 'ReminderEventAction.Add A Reminder' || actionModel.action === 'StartWorkflowEventAction.Start workflow' || actionModel.action === 'StartWebreportEventAction.Start webreport' || actionModel.action === 'CreateOrUpdateCentralWorkspace.Create Or Update Central Workspace') {
                                if( action_key === 'ReminderDueDateCompleteIn' && !!actionModel["value1" + action_key] ) {
                                    var dueDateVal =  actionModel["value1" + action_key].toString(),
                                    dueDateUnit = actionModel["value2" + action_key];
                                    actionModel[actionModel.action + '_fields'][action_key] = {
                                        "actionattrname": action_actionattrname,
                                        "value": dueDateVal.concat(',', dueDateUnit)
                                    }
                                } else if (action_key === 'Reminder_type') {
                                    action_value = actionModel["value" + action_key + actionModel["valueReminder_client"]];
                                    actionModel[actionModel.action + '_fields'][action_key] = {
                                        "actionattrname": action_actionattrname,
                                        "value": action_value
                                    }
                                } else if (action_key === 'WorkflowAttribute') {
                                    action_value = actionModel["value" + action_key];
                                    if (action_value && action_value.length) {
                                        var j;
                                        for (j = 0; j < action_value.length; j++) {
                                            if (action_value[j]["valueWorkflowAttributeValueFrom"] === 'prevAct') {
                                                action_value[j]["valueWorkflowAtrributeFromPreviousAction"] = true;
                                            }
                                            if (action_value[j]["valueWorkflowAttributeValueFrom"] === "evtProp" || action_value[j]["valueWorkflowAttributeValueFrom"] === "csObj") {
                                                action_value[j]["valueWorkflowAttributeUserInput"+action_value[j]["Attribute"]] = '';
                                            }
                                        }
                                    }
                                    actionModel[actionModel.action + '_fields'][action_key] = action_value;
                                } else if (action_key === 'WorkflowAttachmentsValueFrom') {
                                    action_value = actionModel["value" + action_key];
                                    if (action_value && action_value.length) {
                                        var n;
                                        for (n = 0; n < action_value.length; n++) {
                                            if (action_value[n]["Attachments"] === 'prevAct') {
                                                action_value[n]["valueWorkflowAttachmentsFromPreviousAction"] = true;
                                            }
                                        }
                                    }
                                    actionModel[actionModel.action + '_fields'][action_key] = action_value;
                                }
                                else {
                                    action_value = actionModel["value" + action_key];
                                    actionModel[actionModel.action + '_fields'][action_key] = {
                                        "actionattrname": action_actionattrname,
                                        "value": action_value
                                    }
                                }
                                if (actionModel[actionModel.action + '_fields'][action_key]) {
                                    actionModel[actionModel.action + '_fields'][action_key][action_source + '_field'] = action_field;
                                }
                            } else if ( actionModel.action === 'DocGenEventAction.Generate Document' ) { 
                                if ( ["PdContext"].indexOf(action_key) !== -1 ) {
                                    action_value = actionModel["value" + action_key];
                                    actionModel[actionModel.action + '_fields'][action_key] = {
                                        "actionattrname": action_actionattrname,
                                        "value": action_value
                                    }
                                } else {
                                    actionModel[actionModel.action + '_fields'][action_key] = {
                                        "actionattrname": action_actionattrname,
                                        "source": action_source
                                    }
                                    actionModel[actionModel.action + '_fields'][action_key][action_source + '_field'] = action_field;
                                }
                            } else {
                                actionModel[actionModel.action + '_fields'][action_key] = {
                                    "actionattrname": action_actionattrname,
                                    "source": action_source
                                }
                                actionModel[actionModel.action + '_fields'][action_key][action_source + '_field'] = action_field;
                            }
                        }
                    }
                }
            }

            actionPlanRequestData.append('name', this.options.node.attributes.name );
            actionPlanRequestData.append('type', 875 );
            actionPlanRequestData.append('parent_id', this.options.node.attributes.event_def_id );

            requestData['gen_information'] = that.getGeneralInformation(); // general information
            requestData.mode = requestData.gen_information.rule_id === '' ? 'Create' : 'Update';
            requestData.actionPlanName = that.options.node.attributes.name;
            requestData.actionPlanId = requestData.gen_information.plan_id;
            requestData.eventDefinitionId = requestData.gen_information.event_def_id               
            actionPlanDetailsRequestData.append('action_plan_items', JSON.stringify(requestData));

            this.blockActions();
            if( requestData.mode === 'Create' ) {
                this.connector.makeAjaxCall({
                    type: "Post",
                    url: actionPlanUrl,
                    data: actionPlanRequestData,
                    processData: false,
                    contentType: false
                 }).then(function (response) {
                    if (!!response.results.data) {
                        that.options.node.set('plan_id', response.results.data.properties.id, { silent: true });
                        that.options.node.set('id', response.results.data.properties.id, { silent: true });
                        that.options.node.set('name', response.results.data.properties.name, { silent: true });  
                        requestData.gen_information.plan_id = response.results.data.properties.id;
                        requestData.actionPlanId = requestData.gen_information.plan_id;
                        actionPlanData.append('action_plan_items', JSON.stringify(requestData));                      
    
                        that.connector.makeAjaxCall({
                            type: "PUT",
                            url: actionPlanDetailsUrl,
                            data: actionPlanData,
                            processData: false,
                            contentType: false
                        }).then(function(response) {
                            if (response.results.statusCode === 200 && response.results.ok) {
                                GlobalMessage.showMessage('success', response.results.msg);
                                var eventInfo = {
                                    planID: response.results.data.planID,
                                    operation: requestData.gen_information.plan_id !== ''? 'update' : 'create',
                                    event_def_id: requestData.gen_information.event_def_id
                                };
                                that.trigger('refresh:current:action:plan:item', eventInfo); // Only current action plan item should be refreshed
                                $deferred.resolve(); // saved
                            } else {
                                $deferred.reject('FORM_NOT_SAVED'); // not saved
                            }
            
                        }, function(xhr) {
                            that.options.node.destroy();
                            var messageToShow = (xhr.responseJSON && (xhr.responseJSON.errorDetail || xhr.responseJSON.error)) || ACTIONPLAN_CONTENT_VIEW_CONST.ERROR_ACTION_PLAN_CREATION;
                            GlobalMessage.showMessage('error', messageToShow);
                            $deferred.reject('FORM_NOT_SAVED'); // not saved
                        }).always(function() {
                            that.unblockActions();
                        });
    
                    }
                }, function (xhr) {
                    var messageToShow = (xhr.responseJSON && (xhr.responseJSON.errorDetail || xhr.responseJSON.error));
                    that.setErrorMessage(messageToShow, 'create');
                })
            }
            else {
                that.connector.makeAjaxCall({
                    type: "PUT",
                    url: actionPlanDetailsUrl,
                    data: actionPlanDetailsRequestData,
                    processData: false,
                    contentType: false
                }).then(function(response) {
                    if (response.results.statusCode === 200 && response.results.ok) {
                        GlobalMessage.showMessage('success', response.results.msg);
                        var eventInfo = {
                            planID: response.results.data.planID,
                            operation: requestData.gen_information.plan_id !== ''? 'update' : 'create',
                            event_def_id: requestData.gen_information.event_def_id
                        };
                        that.trigger('refresh:current:action:plan:item', eventInfo); // Only current action plan item should be refreshed
                        $deferred.resolve(); // saved
                    } else {
                        $deferred.reject('FORM_NOT_SAVED'); // not saved
                    }
    
                }, function(xhr) {
                    var messageToShow = (xhr.responseJSON && (xhr.responseJSON.errorDetail || xhr.responseJSON.error)) || ACTIONPLAN_CONTENT_VIEW_CONST.ERROR_ACTION_PLAN_CREATION;
                    GlobalMessage.showMessage('error', messageToShow);
                    $deferred.reject('FORM_NOT_SAVED'); // not saved
                }).always(function() {
                    that.unblockActions();
                });
            }
                  
            return $deferred.promise();
        }

    });

    _.extend(ActionPlanContentView.prototype, TabLinksScrollMixin);

    return ActionPlanContentView;
});
