/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/lib/marionette',
    'csui/utils/contexts/factories/connector',
    'csui/controls/checkbox/checkbox.view',
    'csui/utils/commandhelper',
    'csui/controls/tableactionbar/tableactionbar.view',
    'xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.toolbaritems',
    'hbs!xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.listitem',
    'i18n!xecmpf/widgets/eac/impl/nls/lang',
    'css!xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.listitem'
], function (_, $, Backbone, Marionette, ConnectorFactory, CheckboxView, CommandHelper, TableActionBarView, toolbarItems, ActionPlanListItemTemplate, lang) {
    var ActionPlanListItemView = Marionette.LayoutView.extend({
        tagName: 'li',
        className: function () {
            var className = 'xecmpf-eac-action-plan-list-item';
            className += (!this.model.get('id') ? ' xecmpf-new-eac-action-plan-list-item' : '');
            return className;
        },
        template: ActionPlanListItemTemplate,
        constructor: function ActionPlanListItemView(options) {
            options = (options || {});
            Marionette.LayoutView.prototype.constructor.call(this, options);
            var that = this;
            this.listenTo(this.model, "show:inline:action:bar", this.onRender);
            this.listenTo(this.model, "delete:action:plan", this.deleteActionPlan);
            this.listenTo(this.model, "change:csuiInlineFormErrorMessage", this.onRenameMode);
            this.listenTo(this.model, "destroy", function () {
                this.options.originatingView.onActionPlanDelete(this)
            });
            this.listenTo(this.model, "toggle:checkbox", function () {
                this.checkboxView.$el.trigger('click');
            });
        },
        modelEvents: {
            'change': 'onActionPlanListItemModelUpdate'
        },
        regions: {
            checkBoxListRegion: '.xecmpf-eac-check-box-list',
            actionBarRegion: '.xecmpf-eac-action-plan-actions'
        },
        templateHelpers: function () {
            return {
                tabindex: this._index === 0 ? '0' : '-1',
                name:  this.model.get('name'),
                username: this.model.get('username'),
                deleteTooltip: lang.deleteActionPlanButton,
                deleteAria: lang.deleteActionPlanButtonAria + ' ' + this.model.get('name'),
                nodeId: this.model.get('id'),
                namePlaceHolder: lang.actionPlanTitlePlaceholder,
                cancel: lang.cancelLabel,
                hideCheckbox: !this.model.attributes.hideCheckbox
            }
        },
        triggers: {
            'click .xecmpf-eac-action-plan-name-link': 'click:actionplan:item'
        },

        ui: {
            actionPlanNameButton: '.xecmpf-eac-action-plan-name-link',
            actionPlanName: '.xecmpf-eac-action-plan-name',
            actionPlanNameInput: '.actionplan-object-name-input',
            actionPlanNameCancel: '.actionplan-object-name-cancel',
            actionPlanErrorMsg: '.actionplan-error',
            checkBoxList: '.xecmpf-eac-check-box-list',
            acctions: '.xecmpf-eac-action-plan-actions',
            titleCancel: '.actionplan-object-title-cancel',
            titleInput: '.xecmpf-eac-action-plan-input',
            actionPlanErr: '.actionplan-err-message',
            actionPlanErrParent: '.actionplan-error-message'
        },
        events: {
            'click .actionplan-object-name-cancel': '_cancelEdit',
            'focusout .xecmpf-eac-action-plan-list-item-input': 'onFocusOutActionPlan',
            'focusout @ui.actionPlanNameInput' : 'onFocusOutRename',
            'click .actionplan-object-title-cancel': 'onTitleCancel',
            'focus @ui.actionPlanNameButton': function (event) {
                this._hasFocus = true;
            },
            'focusin': function (event) {
                this.ui.acctions.css('display','block');
                this.ui.checkBoxList.css('display','block');
                this.$el.addClass("action-plan-list-item-focus");
            },
            'focusout': 'onFocusOut',
            "keydown ": 'onkeyInView',
            'keydown .xecmpf-eac-action-plan-list-item-input': 'onKeyInRenameMode',
            'mouseover': 'showHideInlineActionBar',
            'mouseout':function () {
                this.ui.acctions.css('display','none');
                this.model.get('checked') ?
                    this.ui.actionPlanNameButton.css('margin-left', '8px')
                    : (this.ui.checkBoxList.css('display', 'none') &&
                        this.ui.actionPlanNameButton.css('margin-left', '22px'));
            },
        },
        showHideInlineActionBar: function () {
            if (!this.model.attributes.checked) {
                !!this.tableActionBarView && this.tableActionBarView.$el.show();
            }
            else {
                !!this.tableActionBarView && this.tableActionBarView.$el.hide();
            }
            this.ui.checkBoxList.css('display','block');
            this.ui.acctions.css('display','block');
            !this.$el.hasClass('xecmpf-new-eac-action-plan-list-item') && this.ui.actionPlanNameButton.css('margin-left','8px');
        },
        onFocusOut: function (event) {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this.ui.acctions.css('display', 'none');
                this.$el.removeClass("action-plan-list-item-focus");
                this.model.get('checked') ?
                    this.ui.actionPlanNameButton.css('margin-left', '8px')
                    : (this.ui.checkBoxList.css('display', 'none') &&
                        this.ui.actionPlanNameButton.css('margin-left', '22px'));
            }
        },

        onFocusOutRename: function (event) {
            if (!event.delegateTarget.contains(event.relatedTarget) && $(event.currentTarget).is(":visible")) {
                this._submitDescription();
            }
        },
       
        onKeyInRenameMode: function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                this.onFocusOutActionPlan(event);
            }
        },
        onTitleCancel: function () {
            this.options.originatingView.onActionPlanDelete(this);
        },
        onRenameMode: function () {
            var commandCS = this.model.actions.findWhere({ signature: 'rename' });
            var commandCI = this.model.actions.findWhere({ signature: 'delete' });
            var emptyModel;
            if (!_.isUndefined(commandCS) || !_.isUndefined(commandCI) && !this._parent.errorCase) {

                if (!this.ui.actionPlanName.hasClass('binf-hidden')) {

                    var fileName = this.model.get("name");
                    this.ui.actionPlanNameInput.val(fileName);
                    this.ui.actionPlanName.addClass('binf-hidden');
                    this.ui.actionPlanNameButton.addClass('binf-hidden');
                    this.ui.actionPlanErrorMsg.addClass('binf-hidden');
                    this.ui.actionPlanNameInput.removeClass("binf-hidden");
                    this.ui.checkBoxList.addClass('binf-hidden');
                    this.ui.acctions.addClass('binf-hidden');
                    this.ui.actionPlanNameCancel.removeClass('binf-hidden');
                    this.ui.actionPlanNameInput.trigger('focus');
                    emptyModel = this.options.originatingView.collection.findWhere({plan_id:''});
                    if(emptyModel){
                        this.options.originatingView.collection.remove(emptyModel);
                    }
                    this.options.originatingView.onActionPlanRenameCancel(this);
                }
            }
        },
        _checkName: function () {
            return this.ui.actionPlanName.hasClass("binf-hidden") ?
                this.ui.actionPlanNameInput.val().trim() : this.model.get("name");
        },
        setErrorMessage: function (message,mode) {
            if(mode === 'rename'){
            this.$el.addClass('cs-form-error');
            this.ui.actionPlanErr.text(message);
            this.ui.actionPlanErrParent.attr('title', message);
            if (this.ui.actionPlanErrorMsg.hasClass("binf-hidden")) {
                this.ui.actionPlanErrorMsg.removeClass("binf-hidden");
            }
        }else{
            this.$el.addClass('cs-form-error');
            this.$el.find('.actionplan-create-err-message').text(message);
            this.$el.find('.actionplan-create-error-message').attr('title',message);
            if (this.$el.find('.actionplan-create-error').hasClass("binf-hidden")) {
                this.$el.find('.actionplan-create-error').removeClass("binf-hidden");
            }
        }

        },
        _submitDescription: function () {
            if (!!this.ui.actionPlanName && this.ui.actionPlanName.hasClass('binf-hidden')) {
                var actionPlanData, newName = this._checkName(),
                    that = this;
                if (newName.length > 0) {
                    actionPlanData = this.model.get('data');
                    this.model.save({ 'name': newName },
                        { wait: true, patch: true, includeActions: true })
                        .done(_.bind(function () {
                            var promise = CommandHelper.refreshModelAttributesFromServer(this.model);
                            this.model.set('name', newName);
                            promise.done(function () {
                                that.model.attributes.create = false;
                                that.model.set('data',actionPlanData);
                                that.render();
                            });
                            this.$el.find('.csui-inlineform-group-error').hide();
                            this.$el.removeClass('cs-form-error');
                        }, this))
                        .fail(_.bind(function (error) {
                            this.setErrorMessage(error.responseJSON.error,'rename');
                        }, this));
                }
            }
        },
        _cancelEdit: function () {
            this.ui.actionPlanNameInput.addClass("binf-hidden");
            this.ui.actionPlanNameCancel.addClass('binf-hidden');
            this.onFocusOutActionPlan();
        },
        onMouseEnter: function () {
            var that = this,
                data, event_def_id;
            if (!!this.model.get('id')) {
                if (this.model.fetched) {
                    data = this.model.get('data');
                    event_def_id = this.model.get('event_def_id');
                }
                this.model.fetch().done(function () {
                    that.model.set('data', data);
                    that.model.set('event_def_id', event_def_id);
                    that.tableActionBarView = new TableActionBarView(_.extend({
                        context: that.options.context,
                        collection: toolbarItems.inlineActionbar,
                        status: {
                            context: that.options.context,
                            originatingView: that.options.originatingView,
                            model: that.model
                        },
                        model: that.model,
                        originatingView: that.options.originatingView
                    }, toolbarItems.inlineActionbar.options, { maxItemsShown: 1 }));
                    that.tableActionBarView.actionState.set('state', 'full');
                    that.actionBarRegion.show(that.tableActionBarView);
                    that.listenTo(that.tableActionBarView, 'after:execute:command', function (eventArgs) {
                        if (eventArgs.commandSignature === 'Delete') {
                            that.model.planID = that.model.attributes.plan_id;
                            that.model.event_def_id = that.model.attributes.event_def_id;
                            that.options.actionPlanListView.refreshCurrentActionPlanItem(that.model);
                        }
                    });
                });
            }         
        },
        deleteActionPlan: function (eventArgs) {
            if (!eventArgs || eventArgs.commandSignature === 'Delete') {
                this.options.originatingView.onActionPlanDelete(this)
            }
        },
        onRender: function () {
            var showCheckBox = this.model.attributes.create ? true : this.model.attributes.hideCheckBox;
            if (!showCheckBox ) {
                this.checkboxView = new CheckboxView({
                    checked: false,
                    disabled: false,
                    ariaLabel: lang.selectAllAria,
                    title: lang.selectAll
                });
                this.listenTo(this.checkboxView.model, 'change:checked', function (event) {
                    if (event.changed.checked) {
                        event.changed.checked === 'true' ? this.model.set('checked', true) :
                            this.model.set('checked', false);
                    }
                    this.triggerMethod("show:actionplan:moreButton");
                });

                this.model.set('checked', false, { silet: true });
                this.checkBoxListRegion.show(this.checkboxView);
            }
            this.listenToOnce(this.model,"change:csuiInlineFormErrorMessage", this.onRenameMode);
            this.onMouseEnter();

        },
        onFocusOutActionPlan: function (event) {
            if (this.model.attributes.plan_id === '') {
                if (!this.ui.titleCancel.is(event.relatedTarget) || event.keyCode === 13) {
                    if (this.$el.find('.xecmpf-eac-action-plan-list-item-input').val()) {
                        var actionPlanName = this.$el.find('.xecmpf-eac-action-plan-list-item-input').val(),
                        alreadyexists = this.options.originatingView.collection.findWhere({ name: actionPlanName });
                        if( alreadyexists ) {
                            var messageToShow = _.str.sformat(lang.actionPlanCreateError, actionPlanName);
                            this.setErrorMessage(messageToShow, 'create');    
                        }
                        else {
                            this.trigger('click:actionplan:item');
                            this.model.set('name', actionPlanName, { silent: true });
                            this.model.set('isAddActionPlan',false, { silent: true });
                            this.model.set('planCreated',true, { silent: true });
                            this.model.attributes.hideCheckBox = true;
                            this.$el.removeClass('cs-form-error');
                            this.render();
                        }
                    }
                }
            } else if (!event) {
                this.model.set('hideCheckBox', false, { silent: true });
                this.model.set('create', false, { silent: true });
                this.$el.removeClass('cs-form-error');
                this.render();
            }
        },
        onkeyInView: function (event) {
            var keyCode = event.keyCode;
            switch (keyCode) {
                case 13:
                case 32:
                    if (event.target.classList.contains('cs-input')) {
                        if (keyCode === 13) {
                            event.preventDefault();
                            event.stopPropagation();
                            this._submitDescription();
                        }
                    } else if (event.target.classList.contains('actionplan-object-name-cancel')) {
                        event.preventDefault();
                        event.stopPropagation();
                        this._cancelEdit();
                    } else if (event.target.classList.contains('actionplan-object-title-cancel')) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.onTitleCancel();
                    } 
                    break;
                case 27:
                    if (event.target.classList.contains('xecmpf-eac-action-plan-list-item-input')) {
                            event.preventDefault();
                            event.stopPropagation();
                            this.onTitleCancel();
                    } else if (this.ui.actionPlanNameInput.is($(event.target))) {
                        event.preventDefault();
                        event.stopPropagation();
                        this._cancelEdit();
                    }
                    break;
                case 9:
                    if (event.target.classList.contains('actionplan-object-title-cancel')) {
                        this.onFocusOutActionPlan(event);
                    }
                    break;
                case 39:
                    if (this.ui.actionPlanNameButton.is($(event.target))) {
                        this.ui.acctions.find('.binf-dropdown-toggle').prop('tabindex', 0).trigger("focus");
                    } else if (event.target.classList.contains('csui-checkbox')) {
                        this.ui.actionPlanNameButton.prop('tabindex', 0).trigger("focus");
                    } 
                    break;
                case 37:
                    if (this.ui.actionPlanNameButton.is($(event.target))) {
                        this.$el.find('.csui-checkbox').prop('tabindex', 0).trigger("focus");
                    } else if (this.ui.acctions.find('.binf-dropdown-toggle').is($(event.target))) {
                        this.ui.actionPlanNameButton.prop('tabindex', 0).trigger("focus");
                    }
            }
        },
        _setFocus: function () {
            if (this.ui.actionPlanNameButton.length > 0) {
                this.ui.actionPlanNameButton.trigger('focus');
            } else if (this.$el.find('.xecmpf-eac-action-plan-list-item-input').length) {
                this.$el.find('.xecmpf-eac-action-plan-list-item-input').trigger('focus');
            }
        },
        onActionPlanListItemModelUpdate: function () {
            this.updateNewActionPlanIndication();
        },
        updateNewActionPlanIndication: function () {
            this.$el.removeClass('xecmpf-new-eac-action-plan-list-item');
            !this.model.get('id') &&
                this.$el.addClass('xecmpf-new-eac-action-plan-list-item');
        }
    });
    return ActionPlanListItemView;
});
