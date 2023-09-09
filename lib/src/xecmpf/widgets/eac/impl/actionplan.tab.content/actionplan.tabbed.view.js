/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/lib/marionette',
    'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
    'csui/utils/page.leaving.blocker',
    'xecmpf/widgets/eac/impl/actionplan.tab.content/actionplan.tab.content.view',
    'i18n!xecmpf/widgets/eac/impl/nls/lang',
    'hbs!xecmpf/widgets/eac/impl/actionplan.tab.content/impl/actionplan.tabbed.view',
    'css!xecmpf/widgets/eac/impl/actionplan.tab.content/impl/actionplan.tabbed.view'
], function(_, $, Backbone, Marionette, ViewEventsPropagationMixin, PageLeavingBlocker, ActionPlanContentView, lang, template) {

    var ActionPlanTabbedView = Marionette.ItemView.extend({

        className: 'metadata-inner-wrapper xecmpf-eac-actionplan-tabbed-inner-wrapper',

        template: template,

        templateHelpers: function() {
            return {
                save: !!(!!this.model.get('data')?this.model.get('data').ruleID:this.model.get('rule_id'))? lang.saveLabel : lang.createLabel,
                cancel: lang.closeLabel
            }
        },

        events: {
            'click .xecmpf-eac-save-actionplan': 'saveEventActionPlan',
            'click .xecmpf-eac-cancel-actionplan': 'cancelEventActionPlan'
        },

        constructor: function ActionPlanTabbedView(options) {
            options || (options = {});
            Marionette.ItemView.prototype.constructor.call(this, options);

            var tabOptions = {
                context: this.options.context,
                node: this.options.model,
                eventname: this.options.eventname,
                namespace: this.options.namespace,
                actionplanSettingsView: this,
                isAddActionPlan: this.options.isAddActionPlan
            }

            this.actionPlanContentView = new ActionPlanContentView(tabOptions);
            this.propagateEventsToViews(this.actionPlanContentView);
        },
        onRender: function() {
            var that = this;
            var childTabView = this.actionPlanContentView.render();
            Marionette.triggerMethodOn(childTabView, 'before:show', childTabView, this);
            this.$el.find('.xecmpf-eac-actionplan-content').append(childTabView.el);
            Marionette.triggerMethodOn(childTabView, 'show', childTabView, this);
            this.listenTo(this.actionPlanContentView, 'refresh:current:action:plan:item', function(data) {
                that.trigger('refresh:current:action:plan:item', data);
            });
           var _tabbedViewContainsChanges = null;
            Object.defineProperty(this, 'tabbedViewContainsChanges', {
                get: function() {
                    return _tabbedViewContainsChanges;
                },
                set: function(containsChanges) {
                    _tabbedViewContainsChanges = containsChanges;
                    that.updateSaveButtonDisableStatus(!containsChanges);
                    that.$el.find('.cs-nodepicker .cs-field-read a').on('click.' + that.cid, function(event){
                        var ele = $(event.currentTarget);
                        event.preventDefault();
                        event.stopPropagation();
                        that.trigger('actionplan:click:link', ele, that);
                    });
                    if (containsChanges && !PageLeavingBlocker.isEnabled()) {
                        PageLeavingBlocker.enable(lang.warningMsgOnActionPlanNavigation);
                    } else if (!containsChanges) {
                        PageLeavingBlocker.disable();
                    }
                }
            });

           
            this.tabbedViewContainsChanges = false;

            if (this.options.isAddActionPlan || this.model.get('create')) {
                this.updateSaveButtonDisableStatus(true);
            }
            this.actionPlanContentView.tabContent.children.forEach(function (tabContentView) {
                tabContentView.content.$el.on('focusout keydown', function (event) { 
                    if (that.$el.find(".binf-has-error").is(':visible') || that.$el.find(".binf-text-danger").is(':visible') || (event.keyCode === 13 && event.target.value === "")) {
                        that.updateSaveButtonDisableStatus(true);
                    }
                });
                that.listenTo(tabContentView.content, 'change:field', function (eventInfo) {
                    this.model.set('data',this.options.apData);
                    var mode = this.model.get('data') ? this.model.get('data').ruleID : this.model.get('rule_id');
                    if(!mode){
                        that.rulesContainsChanges = true;
                    }
                    if (eventInfo.name === 'rulesSet') {
                        that.dataChange = false;
                        that.rulesHasData = false;
                        that.checkChanges(eventInfo.view.form.children[0].children);
                        if (eventInfo.value.length === 1 && eventInfo.value[0].from === "") {
                            that.rulesContainsChanges = true;
                        }
                        else if ((!mode || eventInfo.value.length !== that.model.get('data').ruleConditions.length ||
                            that.dataChange) && eventInfo.view.isFormValid()) {
                            that.rulesContainsChanges = true;
                            that.rulesHasData = true;
                        }
                        else {
                            that.rulesContainsChanges = false;
                        }
                    }
                    else if (eventInfo.name === 'actions_Data') {
                        that.dataChange = false;
                        that.checkChanges(eventInfo.view.form.children[0].children);
                        if ((!mode || that.dataChange || eventInfo.value.length !== that.model.get('data').actions.length)
                            && !(that.$el.find(".binf-has-error").is(':visible'))) {
                            that.actionsContainsChanges = true;
                        }
                        else {
                            that.actionsContainsChanges = false;
                        }
                    }else if(eventInfo.name === 'run_as' || eventInfo.name === 'process_mode') {
                        that.dataChange = false;
                        that.checkChanges(eventInfo.view.form.children);
                        that.processContainsChanges = that.dataChange;
                    }
                    if (this.model.attributes.planCreated && (that.rulesContainsChanges && that.actionsContainsChanges && that.processContainsChanges)) {
                        that.tabbedViewContainsChanges = true;
                    }
                    else if (!mode && that.rulesContainsChanges && that.actionsContainsChanges && that.processContainsChanges) {
                        that.tabbedViewContainsChanges = true;
                    }
                    else if (mode && (((that.model.get('data').ruleConditions[0] || that.rulesHasData) && (that.rulesContainsChanges || that.actionsContainsChanges || that.processContainsChanges)) || that.actionsContainsChanges || that.processContainsChanges)) {
                        that.tabbedViewContainsChanges = true;
                    }
                    else {
                        that.tabbedViewContainsChanges = false;
                    }
                });
            });

        },

        checkChanges: function (elements) {
            var that = this;
            $.each(elements, function (index, ele) {
                if (!!ele.fieldView) {
                    if ((ele.fieldView.alpacaField.type === 'otcs_node_picker' || ele.fieldView.alpacaField.type === 'otcs_user') && ele.fieldView.getValue()) {
                        that.dataChange = true;
                        return (false);
                    } else if (ele.fieldView.alpacaField.type === 'date' && ele.fieldView.getOldValue() !== ele.fieldView.getEditValue()) {
                        that.dataChange = true;
                        return (false);
                    }
                    else if (!!ele.fieldView.getOldValue() && ele.fieldView.getOldValue().id !== ele.fieldView.getEditValue().id && ele.fieldView.getOldValue().id !== "") {
                        that.dataChange = true;
                        return (false);
                    }
                }
                else if (!!ele.children) {
                    that.checkChanges(ele.children);
                }
            });
        },
        saveEventActionPlan: function() {
            var that = this;
            this.actionPlanContentView.saveActionPlanContent().then(function() {
                that.tabbedViewContainsChanges = false; 
            }, function(errMsg) {
            });
        },

        cancelEventActionPlan: function() {
            this.trigger('actionplan:click:back');
        },
        updateSaveButtonDisableStatus: function(disableIt) {
            var $saveBtn = this.$el.find('.xecmpf-eac-save-actionplan');
            $saveBtn.prop('disabled', disableIt);
        },
        onDestroy: function() {
            if (PageLeavingBlocker.isEnabled()) {
                PageLeavingBlocker.disable();
            }
        }
    });

    _.extend(ActionPlanTabbedView.prototype, ViewEventsPropagationMixin);

    return ActionPlanTabbedView;
});
