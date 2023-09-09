/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
    'csui/utils/contexts/factories/connector', 'csui/controls/form/form.view', 'csui/controls/progressblocker/blocker',
    'csui/controls/globalmessage/globalmessage',
    'csui/models/node/node.model',
    'xecmpf/widgets/eac/impl/actionplan.actions/impl/actionplan.actions.form.model',
    'xecmpf/widgets/eac/impl/actionplan.actions/impl/actionplan.Attachments.FromDesktop',
    'hbs!xecmpf/widgets/eac/impl/actionplan.actions/impl/actionplan.actions',
    'i18n!xecmpf/widgets/eac/impl/nls/lang',
    'css!xecmpf/widgets/eac/impl/actionplan.actions/impl/actionplan.actions',
], function (_, $, Backbone, Marionette, ConnectorFactory, FormView, BlockingView,
    GlobalMessage, NodeModel, EACActionFormModel, AddFromFileSysCommand, template, lang) {

    var EACActionsView = FormView.extend({

        className: function () {
            var computedClassName = FormView.prototype.className.call(this);
            computedClassName += ' xecmpf-eac-actions xecmpf-eac-actions-read xecmpf-eac-actions-hide-validation-errors';
            return computedClassName;
        },

        constructor: function (options) {
            options || (options = {});
            var actionPlanActionsModels,
                actions = options.eventModel && (options.eventModel.get('data') ? options.eventModel.get('data').actions : options.eventModel.get('actions')) || [];
            actionPlanActionsModels = actions.map(function (action, index) {
                return new Backbone.Model({
                    sequence: index + 1,
                    depends_on: action.dependsOn,
                    action_key: action.actionKey,
                    attribute_mappings: action.actionAttributeMappings
                });
            });
            var actionPlanId = options.eventModel.attributes.event_def_id;
            this.container = new NodeModel({ id: actionPlanId }, { connector: options.context.getModel(ConnectorFactory) });
            this.addFromFileSysCommand = new AddFromFileSysCommand();
            this.collection = new Backbone.Collection();
            this.collection.add(actionPlanActionsModels);
            options.model = new EACActionFormModel(undefined, {
                context: options.context,
                eventModel: options.eventModel,
                collection: this.collection
            });
            options.mode = 'update';
            options.layoutMode = 'doubleCol';
            options.breakFieldsAt = 3;
            FormView.prototype.constructor.call(this, options);
            this.listenTo(this, 'change:field', this._ValidateActions);
            this.listenTo(this.model, 'update:error', this.updateError);
            this.listenTo(this.model, 'update:field', this._updateActions);
            this.listenTo(this.model, 'change:client', this.OnClientChange);
            this.listenTo(this.model, 'change:type', this.OnTypeChange);
            this.listenTo(this.model, "change:dueDate", this.onChangeDuedate);
            this.listenTo(this, 'render:form', this._getDetails);
            this.listenTo(this.model, 'field:invalid', this.disableSave);
            this.listenTo(this.model, 'change:parameter', this.OnChangeParameter);
            this.listenTo(this.model, 'update:parameter', this.RemoveParameter);
            this.listenTo(this.model, 'update:attributeValue', this.UpdateAttribute);
            this.listenTo(this.model, 'update:valueFromDesktop', this.attachmentFromDesktop);
        },


        formTemplate: template,

        events: {
            "click .inline-edit-icon": "_doEditActions",
            "focusout .xecmpf-eac-actions-container-wrapper": "onFocusout",
            "focusout .xecmpf-eac-actions-container .cs-pull-left": "showInReadMode"
        },

        attachmentFromDesktop: function (event) {
            if (event.target.innerText.trim() === 'From desktop') {
                var that = this;
                var status = {
                    originatingView: this,
                    context: this.options.context,
                    container: this.container,
                    data: 144
                };
                var fileSysOptions = {
                    context: this.options.context,
                    addableType: 144,
                    addableTypeName: "document"
                };
                this.addFromFileSysCommand.execute(status, fileSysOptions).done(function (fileInfo) {
                    if (fileInfo && fileInfo.node) {
                        var currentAction = that.form.childrenByPropertyId.actions_Data.children.map(function (child) {
                            var attrField = child.childrenByPropertyId.valueWorkflowAttachmentsValueFrom.children.filter(function (e) {
                                return e.id === event.currentTarget.parentNode.getAttribute('data-alpaca-container-item-parent-field-id');
                            })
                            return attrField;
                        })
                        var i;
						for (i = 0; i < currentAction.length; i++) {
							if (currentAction[i].length > 0) {
								currentAction[0] = currentAction[i];
							}
						}
                        currentAction[0][0].childrenByPropertyId["valueWorkflowAttachmentsValueFromDesktop"].fieldView.setValue(fileInfo.node.get('id'), true);
                        currentAction[0][0].childrenByPropertyId["valueWorkflowAttachmentsValueFromDesktop"].fieldView.node.set(fileInfo.node.attributes);
                    }
                });
            }
        },

        UpdateAttribute: function (event, response) {
            var result = response, that = this, j;
            if (response.length && this.form) {
                var currentAction = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                    return e.id === $(event.containerItemEl).closest(".alpaca-field").attr('data-alpaca-field-id');
                })
                var typeArray = [], i, k;
                for (i = 0; i < currentAction[0].childrenByPropertyId["valueWorkflowAttribute"].children.length; i++) {
                    if (currentAction[0].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].fieldView.collection.findWhere({ 'id': null })) {
                        typeArray.push(currentAction[0].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].fieldView.collection.findWhere({ 'id': null }));
                    }
                    currentAction[0].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].fieldView.collection.reset();
                    for (k = 0; k < response.length; k++) {
                        typeArray.push(new Backbone.Model({ 'id': response.data[k].name, 'name': response.data[k].name }));
                    }
                    currentAction[0].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].fieldView.collection.reset(typeArray);
                }
            }
            if (response.length && this.model) {
                for (j = 0; j < response.length; j++) {
                    if ((response.data[j].type_name === 'Integer') && (response.data[j].persona === '')) {
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.valueWorkflowAttributeUserInputinteger.dependencies["Attribute"] = response.data[j].name;
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.actionattrnameWorkflowAttributeUserInputinteger.dependencies["Attribute"] = response.data[j].name;
                    } else if (response.data[j].type_name === 'String') {
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.valueWorkflowAttributeUserInputtext.dependencies["Attribute"] = response.data[j].name;
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.actionattrnameWorkflowAttributeUserInputtext.dependencies["Attribute"] = response.data[j].name;
                    } else if (response.data[j].type_name === 'Date') {
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.valueWorkflowAttributeUserInputdate.dependencies["Attribute"] = response.data[j].name;
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.actionattrnameWorkflowAttributeUserInputdate.dependencies["Attribute"] = response.data[j].name;
                    } else if (response.data[j].type_name === 'Boolean') {
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.valueWorkflowAttributeUserInputcheckbox.dependencies["Attribute"] = response.data[j].name;
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.actionattrnameWorkflowAttributeUserInputcheckbox.dependencies["Attribute"] = response.data[j].name;
                    } else if ((response.data[j].type_name === 'Integer') && (response.data[j].persona === 'user')) {
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.valueWorkflowAttributeUserInputotcs_user_picker.dependencies["Attribute"] = response.data[j].name;
                        this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueWorkflowAttribute.fields.item.fields.actionattrnameWorkflowAttributeUserInputotcs_user_picker.dependencies["Attribute"] = response.data[j].name;
                    }
                }
                this.listenTo(this.model, 'update:valueField', function (event) {
                    var k;
                    for (k = 0; k < result.length; k++) {
                        if (result.data[k].name === event.target.innerText) {
                            that.enableValueField(event, result.data[k].type_name, result.data[k].persona);
                        }
                    }
                });
            }
        },

        enableValueField: function (event, type, persona) {
            var currentAction = this.form.childrenByPropertyId.actions_Data.children.map(function (child) {
                var attrField = child.childrenByPropertyId.valueWorkflowAttribute.children.filter(function (e) {
                    return e.id === event.currentTarget.parentNode.getAttribute('data-alpaca-container-item-parent-field-id');
                })
                return attrField;
            })
            var i, that = this;
            for (i = 0; i < currentAction.length; i++) {
                if (currentAction[i].length > 0) {
                    currentAction[0] = currentAction[i];
                }
            }
            this.listenTo(this.model, 'update:userInput', function (event) {
                if (event.target.innerText === 'User Input') {
                    that.displayUserInputField(currentAction, type, persona);
                } else {
                    this.hideDependentUserInputFields(currentAction);
                }
            });
            if (currentAction[0][0].childrenByPropertyId["valueWorkflowAttributeValueFrom"].fieldView.getEditValue().attributes.name === 'User Input') {
                that.displayUserInputField(currentAction, type, persona);
            } else {
                this.hideDependentUserInputFields(currentAction);
            }
            currentAction[0][0].childrenByPropertyId["Attribute"].containerItemEl.removeClass('cs-worflow-error');
            currentAction[0][0].childrenByPropertyId["actionattrnameWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block');
            currentAction[0][0].childrenByPropertyId["valueWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block');
        },

        hideDependentUserInputFields: function (currentAction, text) {
            var types = ["text", "date", "integer", "checkbox", "otcs_user_picker"];
            types.forEach(function (value) {
                if (value !== text) {
                    currentAction[0][0].childrenByPropertyId["valueWorkflowAttributeUserInput" + value].containerItemEl.css('display', 'none');
                    currentAction[0][0].childrenByPropertyId["actionattrnameWorkflowAttributeUserInput" + value].containerItemEl.css('display', 'none');
                }
            })
        },

        showUserInputField: function (currentAction, text) {
            if (text) {
                currentAction[0][0].childrenByPropertyId["valueWorkflowAttributeUserInput" + text].field.removeClass('binf-hidden');
                currentAction[0][0].childrenByPropertyId["actionattrnameWorkflowAttributeUserInput" + text].field.removeClass('binf-hidden');
                currentAction[0][0].childrenByPropertyId["actionattrnameWorkflowAttributeUserInput" + text].containerItemEl.removeClass('binf-hidden');
                currentAction[0][0].childrenByPropertyId["valueWorkflowAttributeUserInput" + text].containerItemEl.removeClass('binf-hidden');
                currentAction[0][0].childrenByPropertyId["valueWorkflowAttributeUserInput" + text].containerItemEl.css('display', 'block');
                currentAction[0][0].childrenByPropertyId["actionattrnameWorkflowAttributeUserInput" + text].containerItemEl.css('display', 'block');
            }
        },
        enableUserInputField: function (currentAction) {
            if (!!currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputcheckbox"].data) {
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputcheckbox"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputcheckbox"].containerItemEl.css('display', 'block');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputcheckbox"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputcheckbox"].containerItemEl.css('display', 'block');
            } else if (!!currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputdate"].data) {
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputdate"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputdate"].containerItemEl.css('display', 'block');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputdate"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputdate"].containerItemEl.css('display', 'block');
            } else if (!!currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputinteger"].data) {
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputinteger"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputinteger"].containerItemEl.css('display', 'block');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputinteger"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputinteger"].containerItemEl.css('display', 'block');
            } else if (!!currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputotcs_user_picker"].data) {
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputotcs_user_picker"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputotcs_user_picker"].containerItemEl.css('display', 'block');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputotcs_user_picker"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputotcs_user_picker"].containerItemEl.css('display', 'block');
            } else if (!!currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputtext"].data) {
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputtext"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["actionattrnameWorkflowAttributeUserInputtext"].containerItemEl.css('display', 'block');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputtext"].field.removeClass('binf-hidden');
                currentAction.childrenByPropertyId["valueWorkflowAttributeUserInputtext"].containerItemEl.css('display', 'block');
            }
        },
        displayUserInputField: function (currentAction, type, persona) {
            var text;
            if (type === "String") {
                text = 'text';
                this.hideDependentUserInputFields(currentAction, text);
                this.showUserInputField(currentAction, text);
            } else if (type === "Integer" && persona === '') {
                text = 'integer';
                this.hideDependentUserInputFields(currentAction, text);
                this.showUserInputField(currentAction, text);
            } else if (type === "Date") {
                text = 'date';
                this.hideDependentUserInputFields(currentAction, text);
                this.showUserInputField(currentAction, text);
            } else if (type === "Boolean") {
                text = 'checkbox';
                this.hideDependentUserInputFields(currentAction, text);
                this.showUserInputField(currentAction, text);
            } else if (type === "Integer" && persona === 'user') {
                text = 'otcs_user_picker';
                this.hideDependentUserInputFields(currentAction, text);
                this.showUserInputField(currentAction, text);
            }
        },

        enableParameters: function (event) {
            var currentField;
            currentField = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                return e.id === event.currentTarget.closest('.csui-field-checkbox').getAttribute('data-alpaca-container-item-parent-field-id');
            })
            currentField[0].childrenByPropertyId["valueWebreportParameters"].fieldView.setValue(event.currentTarget.checked, true);
        },

        enableAttribute: function (event) {
            var currentField;
            currentField = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                return e.id === event.currentTarget.closest('.csui-field-checkbox').getAttribute('data-alpaca-container-item-parent-field-id');
            })
            currentField[0].childrenByPropertyId["valueWorkflowAttributes"].fieldView.setValue(event.currentTarget.checked, true);
        },

        enableAttachments: function (event) {
            var currentField;
            currentField = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                return e.id === event.currentTarget.closest('.csui-field-checkbox').getAttribute('data-alpaca-container-item-parent-field-id');
            })
            currentField[0].childrenByPropertyId["valueWorkflowAttachments"].fieldView.setValue(event.currentTarget.checked, true);
        },

        onChangeDuedate: function (event) {
            var currentAction, value, len;
            currentAction = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                return e.id === event.currentTarget.parentNode.getAttribute('data-alpaca-container-item-parent-field-id');
            })
            this.completeInField = currentAction[0].childrenByPropertyId["value1ReminderDueDateCompleteIn"];
            this.completeInDaysField = currentAction[0].childrenByPropertyId["value2ReminderDueDateCompleteIn"];
            len = this.completeInField.fieldView.getEditValue().length;
            value = parseInt(this.completeInField.fieldView.getEditValue());
            if (len > 1) {
                this.completeInField.containerItemEl.addClass("eac-action-completeIn-Field");
                this.completeInDaysField.containerItemEl.addClass("eac-action-completeIn-Field");
            } else {
                this.completeInField.containerItemEl.removeClass("eac-action-completeIn-Field");
                this.completeInDaysField.containerItemEl.addClass("eac-action-completeIn-Field");
            }
            if (this.completeInField.fieldView.getEditValue() === '' || (value !== parseInt(value, 10))) {
                this.completeInField.containerItemEl.addClass("eac-action-completeIn-Field");
            } else {
                this.completeInField.containerItemEl.removeClass("eac-action-completeIn-Field");
            }
        },

        disableSave: function () {
            this.$el.closest(".xecmpf-actionpan-details-view").find(".xecmpf-eac-save-actionplan").prop("disabled", true);
        },

        showErrorMsg: function (cancelAction) {
            var reminderField = ["valueReminderAssigneeCategoryAttr", "valueReminderAssigneePWCategoryAttr", "valueReminderAssigneePWRole", "valueReminderDueDateCategoryAttr",
                "valueReminderDueDatePWCategoryAttr", "valueReminderEscalationToCategoryAttr", "valueReminderEscalationToPWCategoryAttr", "valueReminderEscalationToPWRole"];
            if (this.options.model.attributes.data.actions_Data) {
                var data, actionLength, setAttributes;
                var that = this;
                if (cancelAction) {
                    actionLength = this.form.data.actions_Data.length;
                } else {
                    actionLength = this.options.model.attributes.data.actions_Data.length;
                }
                for (var i = 0; i < actionLength && (this.form.data.actions_Data[i].action === "ReminderEventAction.Add A Reminder" || this.options.model.attributes.data.actions_Data[i].action === "ReminderEventAction.Add A Reminder"); i++) {
                    for (var j = 0; j < reminderField.length; j++) {
                        if (cancelAction) {
                            data = this.form.childrenByPropertyId["actions_Data"].children[i].data[reminderField[j]];
                        } else {
                            data = this.options.model.attributes.data.actions_Data[i][reminderField[j]];
                        }
                        if (!!data) {
                            setAttributes = this.form.childrenByPropertyId["actions_Data"].children[i].childrenByPropertyId[reminderField[j]];
                            !!setAttributes && setAttributes.fieldView.alpacaField.refreshValidationState(false, function () {
                                if (that.$el.find(".binf-has-error").is(":visible")) {
                                    if (that.$el.find('.csui-bulk-edit-actions_Data') && !cancelAction) {
                                        that.$el.find('.csui-bulk-edit-actions_Data').trigger('click');
                                    }
                                }
                            });
                        }
                    }
                }
            }
        },

        showInReadMode: function (event) {
            if (!event.currentTarget.contains(event.target) && event.relatedTarget == null) {
                this.$el.removeClass("xecmpf-eac-actions-write");
                this.$el.addClass("xecmpf-eac-actions-read");
            }
        },

        OnChangeParameter: function (event) {
            var oldValue, containerItem, dropdownText, multivalueContainer, val, firstChild, isEvent, element, target, i, j,
                currentAction, elementValue, duplicateEvent = false, count = 0, that = this, latestcount = 0;
            if (!!event && !!event.currentTarget) {
                multivalueContainer = $(event.currentTarget).closest(".csui-multivalue-container");
                val = multivalueContainer.children().length;
                currentAction = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                    return e.id === $(event.currentTarget).closest(".csui-field-array").attr('data-alpaca-container-item-parent-field-id');
                });
                element = $(event.currentTarget);
                target = event.target;
                isEvent = true;
            } else {
                multivalueContainer = $(this.paramField[0]).find(".csui-multivalue-container");
                val = multivalueContainer.children().length;
                currentAction = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                    return e.id === that.paramField.closest(".csui-field-array").attr('data-alpaca-container-item-parent-field-id');
                });
                element = this.paramField;
                target = this.paramField.find('.binf-dropdown-toggle');
            }
            this.parameterField = currentAction[0].childrenByPropertyId["valueWebreportParametersList"];
            for (i = 0; i < this.parameterField.children.length; i++) {
                if (this.parameterField.children[i].containerItemEl.is(element.closest(".cs-form-multi-action-container"))) {
                    oldValue = this.parameterField.children[i].fieldView.getOldValue().id;
                }
            }
            if (!isEvent && val === 2) {
                for (j = 0; j < val; j++) {
                    containerItem = multivalueContainer.children('[data-alpaca-container-item-index="' + j + '"]');
                    if (containerItem.find('.binf-text-danger').length) {
                        containerItem.find('.binf-text-danger').remove();
                    }
                }
            }
            for (j = 0; j < val; j++) {
                containerItem = multivalueContainer.children('[data-alpaca-container-item-index="' + j + '"]');
                dropdownText = containerItem.find(".binf-dropdown-toggle").text().trim();
                elementValue = isEvent ? ($(event.target).text().trim()) : $($(this.event.relatedTarget.parentElement.parentElement.parentElement.children[0]).find('.binf-dropdown-toggle')[0]).text().trim();
                if (isEvent) {
                    if ((elementValue === dropdownText) && !(containerItem.has(target).length)) {
                        duplicateEvent = true;
                    }
                } else  if(val>2){
                    if (containerItem.find('.alpaca-array-actionbar')[0] !== $(this.event.relatedTarget).parent()[0]) {
                        if ((elementValue === dropdownText)) {
                            latestcount++;
                            if (latestcount === 1) {
                                firstChild = containerItem;
                            }
                            duplicateEvent = true;
                        }
                        
                    }

                }
                if (oldValue === dropdownText) {
                    count++;
                    if (count === 1) {
                        firstChild = containerItem;
                    }
                }
            }
            if (duplicateEvent) {
                if (!(element.find(".binf-text-danger").length)) {
                    $('<div class="binf-text-danger"><span class="csui-text-danger">' + lang.selectDifferentParameter + '</span></div>')
                        .appendTo(element.find('.binf-col-sm-9'));
                }
            } else {
                    if (isEvent && element.find(".binf-text-danger").length) {
                        element.find(".binf-text-danger").remove();
                    }
            }
            if ((latestcount === 1 || count === 1) && firstChild.find(".binf-text-danger").length) {
                firstChild.find(".binf-text-danger").remove();
            }
        },

        OnClientChange: function (event) {
            if (!!event.currentTarget) {
                this.initializeField(event);
                if (!!this.EscalationToField && this.EscalationToSelectField && this.followuptypefield) {
                    this.listenTo(this.followuptypefield.fieldView, "selection:changed", this.updateEscalationModel);
                }
                this.updateFormViewModel();
            }
        },

        initializeField: function (event) {
            var currentAction = this.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                return e.id === event.currentTarget.parentNode.getAttribute('data-alpaca-container-item-parent-field-id');
            })
            this.currentAction = currentAction[0];
            this.followupClientField = currentAction[0].childrenByPropertyId["valueReminder_client"];
            this.EscalationToField = currentAction[0].childrenByPropertyId["actionattrnameReminderEscalationTo"];
            this.EscalationToSelectField = currentAction[0].childrenByPropertyId["valueReminderEscalationTo"];
            this.followuptypefield = currentAction[0].childrenByPropertyId["valueReminder_type"+this.followupClientField.data];
            if (!!currentAction[0].childrenByPropertyId["valueReminderEscalationToPWMetadata"] && currentAction[0].childrenByPropertyId["valueReminderEscalationToPWMetadata"].data === 'Role') {
                this.model.escModel.set('role', true);
            } else {
                this.model.escModel.set('role', false);
            }
        },

        OnTypeChange: function (event) {
            if (!!event.currentTarget) {
                this.initializeField(event);
                this.updateEscalationModel();
            }
        },

        updateError: function (event) {
            if (event.target.innerText.trim() === "Add a reminder") {
                if (!!this.EscalationToField && this.followuptypefield.isEscalation) {
                    this.EscalationToField.containerItemEl.removeClass("binf-hidden")
                    this.EscalationToSelectField.containerItemEl.removeClass("binf-hidden");
                    this.EscalationToField.field.removeClass('binf-hidden');
                    this.EscalationToSelectField.field.removeClass('binf-hidden');
                    this.EscalationToSelectField.field.parent().find('.binf-help-block-standalone').removeClass('binf-hidden');
                }
                if (!!this.options.model.formModel.error) {
                    $('<div class="csui-inlineform-group csui-inlineform-group-error">' + '<div class="binf-text-danger"><span class="csui-text-danger">' + lang.noReminderTypes + '</span></div></div>')
                        .appendTo($(event.currentTarget).find('.binf-col-sm-9'));
                }
            } else {
                $(event.currentTarget).find(".csui-inlineform-group-error").remove();
            }
            if (event.target.innerText.trim() === "Start webreport") {
                this.updateBooleanField();
            }
            if (event.target.innerText.trim() === "Start workflow") {
                this.updateAttributeField();
                this.updateAttachmentsField();
            }
            this.updateDependsOnField();
            this._updateActions();
        },

        updateDependsOnField: function () {
            if (!!this.form.children) {
                this.form.childrenByPropertyId["actions_Data"].children[0].childrenByPropertyId["actionattrnameDependsOn"].containerItemEl.addClass("binf-hidden");
                this.form.childrenByPropertyId["actions_Data"].children[0].childrenByPropertyId["valueDependsOn"].containerItemEl.addClass("binf-hidden");
            }
        },

        updateBooleanField: function () {
            var length, l;
            if (!!this.form.children) {
                length = this.form.children[0].children.length;
                for (l = 0; l < length; l++) {
                    var inputField = this.form.childrenByPropertyId["actions_Data"].children[l].childrenByPropertyId["valueWebreportParameters"].fieldView.ui.flagWriteField;
                    inputField.on("switchChange.binfSwitch", _.bind(this.enableParameters, this));
                }
            }
        },

        updateAttributeField: function () {
            var length, l;
            if (!!this.form.children) {
                length = this.form.children[0].children.length;
                for (l = 0; l < length; l++) {
                    var inputField = this.form.childrenByPropertyId["actions_Data"].children[l].childrenByPropertyId["valueWorkflowAttributes"].fieldView.ui.flagWriteField;
                    inputField.on("switchChange.binfSwitch", _.bind(this.enableAttribute, this));
                }
            }
        },

        updateAttachmentsField: function () {
            var length, l;
            if (!!this.form.children) {
                length = this.form.children[0].children.length;
                for (l = 0; l < length; l++) {
                    var inputField = this.form.childrenByPropertyId["actions_Data"].children[l].childrenByPropertyId["valueWorkflowAttachments"].fieldView.ui.flagWriteField;
                    inputField.on("switchChange.binfSwitch", _.bind(this.enableAttachments, this));
                }
            }
        },

        updateEscalationModel: function () {
            var client_idValue = this.followupClientField.fieldView.getEditValue().id;
            var type_idValue = this.followuptypefield.fieldView.getEditValue().id;
            if (!!client_idValue && !!type_idValue) {
                this.options.model.escModel.set("client_id", client_idValue);
                this.options.model.escModel.set("id", type_idValue);
                this.followuptypefield.fieldView.setValue(this.followuptypefield.fieldView.getEditValue());
                this.options.model.escModel.fetch().done(_.bind(function (response) {
                    if (response.forms[0].data.escalation_alert) {
                        this.options.model.escModel.set('escalationData',this.EscalationToSelectField.data);
                        this.hideDependentFields(false);
                        this._updateActions();
                    } else if (!response.forms[0].data.escalation_alert) {
                        this.options.model.escModel.set('escalationData',this.EscalationToSelectField.data);
                        this.hideDependentFields(true);
                    }
                }, this));
            }
        },

        onFocusout: function (event) {
            var invalidField = this.$el.find('.cs-formfield.cs-formfield-invalid');
            if (invalidField.length) {
                invalidField.removeClass('cs-formfield-invalid');
            }
        },

        _doEditActions: function () {
            var that = this;
            if (this.form.childrenByPropertyId["actions_Data"].children.length > 0) {
                this.$el.addClass("xecmpf-eac-actions-write");
                this.$el.removeClass("xecmpf-eac-actions-read");
                $(document).on('click.' + this.cid, {view: this}, this._documentClick);
                this.$el.off('tab:content:field:changed');
            } else {
                this.$el.removeClass("xecmpf-eac-actions-write");
                this.$el.addClass("xecmpf-eac-actions-read");
                $(document).off('click.' + this.cid, {view: this}, this._documentClick);
                this.$el.on('tab:content:field:changed', function (event) {
                    if ($(event.target).find(".csui-bulk-edit-cancel").length) {
                        that.updateDependsOnField();
                        that.showErrorMsg(true);
                        that._Validate("actions_Data");
                        that.form.childrenByPropertyId.actions_Data.children.filter(function (e) {
                            if (e.childrenByPropertyId["action"].data === "StartWorkflowEventAction.Start workflow") {
                                that.currentAction = e;
                                if (that.currentAction.childrenByPropertyId["valueWorkflowAttributes"].data === 'true' || that.currentAction.childrenByPropertyId["valueWorkflowAttributes"].data === true) {
                                    for (var i = 0; i < that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children.length; i++) {
                                        if (that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeValueFrom"].data !== '') {
                                            that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["actionattrnameWorkflowAttributeValueFrom"].field.removeClass('binf-hidden');
                                            that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["actionattrnameWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block');
                                            that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeValueFrom"].field.removeClass('binf-hidden');
                                            that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block');
                                            switch (that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeValueFrom"].data) {
                                                case 'csObj':
                                                    that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeCSObject"].field.removeClass('binf-hidden');
                                                    that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeCSObject"].containerItemEl.css('display', 'block');

                                                    break;
                                                case 'evtProp':
                                                    that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeEvtProp"].field.removeClass('binf-hidden');
                                                    that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["valueWorkflowAttributeEvtProp"].containerItemEl.css('display', 'block');
                                                    break;
                                                case 'UserInput':
                                                    that.enableUserInputField(that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[i]);
                                                    break;
                                            }
                                        }
                                    }
                                }
                                that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[0].childrenByPropertyId["actionattrnameWorkflowAttributeValueFrom"].field.removeClass('binf-hidden');
                                that.currentAction.childrenByPropertyId["valueWorkflowAttribute"].children[0].childrenByPropertyId["actionattrnameWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block')
                            }
                            if (e.childrenByPropertyId["action"].data === "ReminderEventAction.Add A Reminder") {
                                that.currentAction = e;
                                that.EscalationToField = e.childrenByPropertyId["actionattrnameReminderEscalationTo"];
                                that.EscalationToSelectField = e.childrenByPropertyId["valueReminderEscalationTo"];
                                that.followuptypefield = e.childrenByPropertyId["valueReminder_type" + e.childrenByPropertyId["valueReminder_client"].data];
                                that.followuptypefield.fieldView.collection.add(new Backbone.Model({ 'id': null, 'name': lang.reminderTypePlaceholder }), { at: 0 })
                                if (that.model.escModel.get('escalation' + that.followuptypefield.data)) {
                                    that.options.model.escModel.set('escalationData', that.EscalationToSelectField.data);
                                    that.hideDependentFields(false);
                                }
                                else {
                                    that.options.model.escModel.set('escalationData', that.EscalationToSelectField.data);
                                    that.hideDependentFields(true);
                                }
                            }
                        })
                    }
                });
            }
        },

        _documentClick: function (event) {
            var self = event.data.view,
                element = $(event.target);
            if (!self.$el.find('.xecmpf-eac-actions-container').has(event.target).length && !element.hasClass('csui-perfect-scrolling')) {
                self.$el.removeClass("xecmpf-eac-actions-write");
                self.$el.addClass("xecmpf-eac-actions-read");
            }
        },
        _Validate: function (name) {
            var i, j, k, l, len, setAttributes, attrLen, attrName;
            len = this.form.children[0].children.length;
            for (i = 0; i < len; i++) {
                setAttributes = this.form.childrenByPropertyId[name].children[i].children,
                    attrLen = setAttributes.length;
                for (j = 1; j < attrLen; j++) {
                    if ( (setAttributes[j].name.search('valueWorkflowAttribute') !== -1)) {
                        if(!!setAttributes[j].children && setAttributes[j].children.length >= 1){
                          for(k=0;k<setAttributes[j].children.length;k++){
                            for(l=0 ;l<setAttributes[j].children[k].children.length;l++) {
                              if(setAttributes[j].children[k].children[l].containerItemEl.css('display') === 'none' && setAttributes[j].children[k].children[l].name.search("valueWorkflowAttributeUserInput") !== -1 && setAttributes[j].children[k].children[l].field.hasClass('binf-has-error'))
                              {
                                setAttributes[j].children[k].children[l].field.removeClass('binf-has-error');
                              }
                            }
                          }
                        }
                    
                    }
                    if ( (setAttributes[j].name.search('valueWorkflowAttachmentsValueFrom') !== -1)) {
                      for(k=0;k<setAttributes[j].children.length;k++){
                        
                          if(setAttributes[j].children[k].children[0].field.hasClass('binf-has-error'))
                          {
                            setAttributes[j].children[k].children[0].field.removeClass('binf-has-error');
                          }
                        
                      }
                  
                  
                  }
                    if (!setAttributes[j].isHidden()) {
                        if ((setAttributes[j].name.search('Workflow') !== -1) && ((setAttributes[j].data === '') || (setAttributes[j].data === null) || (setAttributes[j].data && setAttributes[j].data.name === ''))) {
                            setAttributes[j].getFieldEl().addClass('binf-has-error');
                            setAttributes[j].displayMessage(lang.requiredField);
                            attrName = setAttributes[j].name.substr(setAttributes[j].name.search('value'));
                            if (!!this.form.schema.properties.actions_Data.items.properties[attrName]) {
                                this.form.schema.properties.actions_Data.items.properties[attrName].required = true;
                            }
                        }
                        else if ((setAttributes[j].name.search('Webreport') !== -1) && setAttributes[j].children) {
                            var length;
                            length = setAttributes[j].children.length;
                            for (k = 0; k < length; k++) {
                                if (setAttributes[j].children[k].data === "Select value" || (setAttributes[j].children[k].fieldView && setAttributes[j].children[k].fieldView.getEditValue().id === "Select value")) {
                                    setAttributes[j].getFieldEl().addClass('binf-has-error');
                                    setAttributes[j].displayMessage(lang.requiredField);
                                    attrName = setAttributes[j].name.substr(setAttributes[j].name.search('value'));
                                    if (!!this.form.schema.properties.actions_Data.items.properties[attrName]) {
                                        this.form.schema.properties.actions_Data.items.properties[attrName].required = true;
                                    }
                                }
                            }
                        }
                        else if (this.isActionPlanFieldRequired(setAttributes[j].name) &&
                                 ((setAttributes[j].fieldView &&
                                   setAttributes[j].fieldView.getEditValue() &&
                                   setAttributes[j].fieldView.getEditValue().id === null) ||
                                 setAttributes[j].data === '')) {
                            setAttributes[j].getFieldEl().addClass('binf-has-error');
                            setAttributes[j].displayMessage(lang.requiredField);
                            if (!!this.form.schema.properties.actions_Data.items.properties[setAttributes[j].options.fieldClass]) {
                                this.form.schema.properties.actions_Data.items.properties[setAttributes[j].options.fieldClass].required = true;
                            }
                        }
                        else if (setAttributes[j].options.fieldClass) {
                            if (!!this.form.schema.properties.actions_Data.items.properties[setAttributes[j].options.fieldClass]) {
                                this.form.schema.properties.actions_Data.items.properties[setAttributes[j].options.fieldClass].required = false;
                            }
                        }
                    }
                }
            }
            this.updateDependsOnField();
            this.updateBooleanField();
            this.updateAttributeField();
            this.updateAttachmentsField();
        },
        isActionPlanFieldRequired: function (name){
            var actionPlanFields = ["sourceEffectiveDate", "valuePdContext", "sourceBoKey_CreateDoc", "sourceBoType_CreateDoc", "central_workspace_templateId"];
            return actionPlanFields.every(function (field){
                return name.indexOf(field) === -1;
            });
        },

        _ValidateActions: function (args) {
            this.$el.removeClass("xecmpf-eac-actions-write");
            this.$el.addClass("xecmpf-eac-actions-read");
            var emptyCheck, name;
            emptyCheck = args.targetField.value[0] ? args.targetField.value[0].action :
                args.targetField.value.action,
                name = args.parentField.name;
            if (emptyCheck.length > 0) {
                this._Validate(name);
            }
        },

        _updateActions: function () {
            var Id, k, l, len, setAttributes, attrLen;
            len = this.form.children[0].children.length;
            for (k = 0; k < len; k++) {
                setAttributes = this.form.childrenByPropertyId["actions_Data"].children[k].children,
                    attrLen = setAttributes.length;
                for (l = 1; l < attrLen; l++) {
                    if (!setAttributes[l].isHidden() && setAttributes[l].type === 'select' && setAttributes[l].fieldView) {
                        Id = setAttributes[l].fieldView.getEditValue().id;
                        if (Id === undefined) {
                            setAttributes[l].fieldView.setValue(setAttributes[l].fieldView.collection.findWhere({ 'id': null }));
                        }
                    }
                }
            }
        },

        formTemplateHelpers: function () {
            return {
                actionsLabel: lang.actionsTabLabel
            };
        },
        _getLayout: function () {
            var retVal = FormView.prototype._getLayout.call(this);
            var template = this.getOption('formTemplate'),
                html = template.call(this, {
                    data: this.alpaca.data,
                    mode: this.mode
                }),
                bindings = this._getBindings(),
                view = {
                    parent: 'bootstrap-csui',
                    layout: {
                        template: html,
                        bindings: bindings
                    }
                };
            return view;
        },

        _getBindings: function () {
            return {
                actions_Data: '.xecmpf-eac-actions-container'
            };
        },
        getSubmitData: function () {
            var data = this.getValues().actions_Data;
            return data;
        },
        updateFormViewModel: function () {
            var cliend_idValue = this.followupClientField.fieldView.getEditValue().id,
                that = this, model;
            this.options.model.formModel.set("client_id", cliend_idValue);
            this.previousValues = this.getValues().actions_Data;
            this.options.model.formModel.fetch().done(function (response) {
                var typeArray = [], i,
                    enumarray = response.forms[0].schema.properties.followup_type_name.enum,
                    labelsarray = response.forms[0].options.fields.followup_type_name.optionLabels;
                if (that.followuptypefield.fieldView.collection.findWhere({ 'id': null })) {
                    typeArray.push(that.followuptypefield.fieldView.collection.findWhere({ 'id': null }));
                }
                that.followuptypefield.fieldView.collection.reset();
                for (i = 0; i < enumarray.length; i++) {
                    typeArray.push(new Backbone.Model({ 'id': enumarray[i], 'name': labelsarray[i] }));
                }
                that.followuptypefield.fieldView.collection.reset(typeArray);
                that.model.attributes.schema.properties.actions_Data.items.properties["valueReminder_type"+that.followupClientField.data].enum = enumarray;
                that.model.attributes.options.fields.actions_Data.fields.item.fields["valueReminder_type"+that.followupClientField.data].optionLabels = labelsarray;
                if (!!that.followuptypefield.fieldView.getValue() && that.followuptypefield.fieldView.getValue().attributes.id) {
                    for (model in typeArray) {
                        if (typeArray[model].get('id') === that.followuptypefield.fieldView.getValue().attributes.id) {
                            that.followuptypefield.fieldView.setValue(typeArray[model]);
                        }
                    }
                } else {
                    that.followuptypefield.fieldView.setValue(typeArray[0]);
                }
                if( !!that.currentAction && (that.currentAction.childrenByPropertyId["valueReminder_typenull"].getFieldEl().hasClass('binf-has-error') || that.currentAction.childrenByPropertyId["valueReminderEscalationTo"].getFieldEl().hasClass('binf-has-error'))){
                  that.currentAction.childrenByPropertyId["valueReminder_typenull"].getFieldEl().removeClass('binf-has-error');
                  that.currentAction.childrenByPropertyId["valueReminderEscalationTo"].getFieldEl().removeClass('binf-has-error');
                }
                that.updateEscalationModel();
            });
        },
        hideDependentFields: function (hide) {
            if (hide) {
                if(!!this.followuptypefield ){
                    this.options.model.escModel.set('escalation' + this.followuptypefield.data, false);
                    this.followuptypefield.isEscalation = false;
                  }
                this.EscalationToField.containerItemEl.addClass("binf-hidden");
                this.EscalationToSelectField.containerItemEl.addClass("binf-hidden");
                this.EscalationToField.field.addClass('binf-hidden');
                this.EscalationToSelectField.field.addClass('binf-hidden');
                this.options.model.attributes.options.fields.actions_Data.fields.item.fields.actionattrnameReminderEscalationTo.hidden = true;
                this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueReminderEscalationTo.hidden = true;
                switch (this.options.model.escModel.get('escalationData')) {
                    case 'eventProp':
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToEvtProp"].field.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToEvtProp"].containerItemEl.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToEvtProp"].containerItemEl.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToEvtProp"].field.addClass("binf-hidden");
                        break;
                    case 'initObj':
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToCategoryAttr"].containerItemEl.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToCategoryAttr"].containerItemEl.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToCategoryAttr"].field.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToCategoryAttr"].field.addClass("binf-hidden");
                        break;
                    case 'pWorkspace':
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWMetadata"].containerItemEl.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToPWMetadata"].containerItemEl.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWMetadata"].field.addClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToPWMetadata"].field.addClass("binf-hidden");
                        if (this.options.model.escModel.get('role')) {
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWRole"].containerItemEl.addClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWRole"].containerItemEl.addClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWRole"].field.addClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWRole"].field.addClass("binf-hidden");
                        } else {
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWCategoryAttr"].containerItemEl.addClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWCategoryAttr"].containerItemEl.addClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWCategoryAttr"].field.addClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWCategoryAttr"].field.addClass("binf-hidden");
                        }
                        break;
                }
            } else {
                if(!!this.followuptypefield ){
                    this.options.model.escModel.set('escalation' + this.followuptypefield.data, true);
                    this.followuptypefield.isEscalation = true;
                  }
                this.EscalationToField.containerItemEl.removeClass("binf-hidden")
                this.EscalationToSelectField.containerItemEl.removeClass("binf-hidden");
                this.EscalationToField.field.removeClass('binf-hidden');
                this.EscalationToSelectField.field.removeClass('binf-hidden');
                this.EscalationToSelectField.field.parent().find('.binf-help-block-standalone').removeClass('binf-hidden');
                this.options.model.attributes.options.fields.actions_Data.fields.item.fields.actionattrnameReminderEscalationTo.hidden = false;
                this.options.model.attributes.options.fields.actions_Data.fields.item.fields.valueReminderEscalationTo.hidden = false;
                switch (this.options.model.escModel.get('escalationData')) {
                    case 'eventProp':
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToEvtProp"].field.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToEvtProp"].containerItemEl.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToEvtProp"].containerItemEl.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToEvtProp"].field.removeClass("binf-hidden");
                        break;
                    case 'initObj':
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToCategoryAttr"].containerItemEl.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToCategoryAttr"].containerItemEl.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToCategoryAttr"].field.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToCategoryAttr"].field.removeClass("binf-hidden");
                        break;
                    case 'pWorkspace':
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWMetadata"].containerItemEl.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToPWMetadata"].containerItemEl.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWMetadata"].field.removeClass("binf-hidden");
                        this.currentAction.childrenByPropertyId["valueReminderEscalationToPWMetadata"].field.removeClass("binf-hidden");
                        if (this.options.model.escModel.get('role')) {
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWRole"].containerItemEl.removeClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWRole"].containerItemEl.removeClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWRole"].field.removeClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWRole"].field.removeClass("binf-hidden");
                        } else {
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWCategoryAttr"].containerItemEl.removeClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWCategoryAttr"].containerItemEl.removeClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["actionattrnameReminderEscalationToPWCategoryAttr"].field.removeClass("binf-hidden");
                            this.currentAction.childrenByPropertyId["valueReminderEscalationToPWCategoryAttr"].field.removeClass("binf-hidden");
                        }
                        break;
                }
              
            }
            this.options.model.escModel.set('escalationData','');
        },

        showUserField: function (currentAction, text) {
            currentAction.childrenByPropertyId["actionattrname" + text].containerItemEl.removeClass("binf-hidden");
            currentAction.childrenByPropertyId["actionattrname" + text].field.removeClass("binf-hidden");
            currentAction.childrenByPropertyId["value" + text].containerItemEl.removeClass("binf-hidden");
            currentAction.childrenByPropertyId["value" + text].field.removeClass("binf-hidden");
            currentAction.childrenByPropertyId["value" + text].containerItemEl.css('display', 'block');
            currentAction.childrenByPropertyId["actionattrname" + text].containerItemEl.css('display', 'block');
        },

        _getDetails: function () {
            var i, text,
                that = this,
                typeArray = [],
                length = !!this.model.attributes.data.actions_Data ? this.model.attributes.data.actions_Data.length : 0;
            for (i = 0; i < length; i++) {
                if (this.model.attributes.data.actions_Data[i].action === "ReminderEventAction.Add A Reminder" && !that.options.model.formModel.error) {
                    that.currentAction = that.form.childrenByPropertyId["actions_Data"].children[i];
                    that.followupClientField = that.currentAction.childrenByPropertyId["valueReminder_client"];
                    that.EscalationToField = that.currentAction.childrenByPropertyId["actionattrnameReminderEscalationTo"];
                    that.EscalationToSelectField = that.currentAction.childrenByPropertyId["valueReminderEscalationTo"];
                    var client_Value = !!that.followupClientField.data ? that.followupClientField.data : null;
                    that.followuptypefield = that.currentAction.childrenByPropertyId["valueReminder_type" + client_Value];
                    if (!that.followuptypefield) {
                        if (!that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_client.enum.includes(client_Value)) {
                            that.model.attributes.data.actions_Data[i].valueReminder_client = "";
                            if (that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_client.enum[0] === that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_client.enum[1]) {
                                that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_client.enum.shift(0);
                                that.model.attributes.options.fields.actions_Data.fields.item.fields.valueReminder_client.optionLabels.shift(0);
                            }
                            typeArray.push(new Backbone.Model({ 'id': that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_client.enum[0], 'name': that.model.attributes.options.fields.actions_Data.fields.item.fields.valueReminder_client.optionLabels[0] }));
                            that.followupClientField.fieldView.setValue(typeArray[0]);
                            that.followupClientField.getFieldEl().addClass('binf-has-error');
                            that.followupClientField.displayMessage(lang.requiredField);
                            typeArray.pop();
                        }
                        typeArray.push(new Backbone.Model({ 'id': that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_typenull.enum[0], 'name': that.model.attributes.options.fields.actions_Data.fields.item.fields.valueReminder_typenull.optionLabels[0] }));
                        that.followuptypefield = that.currentAction.childrenByPropertyId["valueReminder_typenull"];
                        that.followuptypefield.fieldView.setValue(typeArray[0]);
                        that.followuptypefield.getFieldEl().addClass('binf-has-error');
                        that.followuptypefield.displayMessage(lang.requiredField);
                    } else if (!that.followuptypefield.getEnum().includes(that.followuptypefield.data)) {
                        typeArray.push(new Backbone.Model({ 'id': that.model.attributes.schema.properties.actions_Data.items.properties.valueReminder_typenull.enum[0], 'name': that.model.attributes.options.fields.actions_Data.fields.item.fields.valueReminder_typenull.optionLabels[0] }));
                        that.followuptypefield.fieldView.setValue(typeArray[0]);
                        that.followuptypefield.getFieldEl().addClass('binf-has-error');
                        that.followuptypefield.displayMessage(lang.requiredField);
                    }
                    if (this.model.attributes.data.actions_Data[i].escalation) {
                        if (!!that.model.attributes.data.actions_Data[i].valueReminderEscalationToPWMetadata && that.model.attributes.data.actions_Data[i].valueReminderEscalationToPWMetadata === 'Role') {
                            that.model.escModel.set('role', true);
                        } else {
                            that.model.escModel.set('role', false);
                        }
                        that.model.escModel.set('escalationData', that.model.attributes.data.actions_Data[i].valueReminderEscalationTo
                        );
                        that.hideDependentFields(false);
                    } else {
                        that.hideDependentFields(true);
                    }
                }
                for (var j = 0; j < this.form.data.actions_Data[i].valueWorkflowAttribute.length; j++) {
                    if (this.form.data.actions_Data[i].valueWorkflowAttribute[j].Attribute) {
                        if (this.form.data.actions_Data[i].valueWorkflowAttribute[j].valueWorkflowAttributeUserInputtext) {
                            text = "WorkflowAttributeUserInputtext";
                            that.showUserField(this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j], text);
                        } else if (this.form.data.actions_Data[i].valueWorkflowAttribute[j].valueWorkflowAttributeUserInputinteger) {
                            text = "WorkflowAttributeUserInputinteger";
                            that.showUserField(this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j], text);
                        } else if (this.form.data.actions_Data[i].valueWorkflowAttribute[j].valueWorkflowAttributeUserInputdate) {
                            text = "WorkflowAttributeUserInputdate";
                            that.showUserField(this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j], text);
                        } else if (this.form.data.actions_Data[i].valueWorkflowAttribute[j].valueWorkflowAttributeUserInputcheckbox) {
                            text = "WorkflowAttributeUserInputcheckbox";
                            that.showUserField(this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j], text);
                        } else if (this.form.data.actions_Data[i].valueWorkflowAttribute[j].valueWorkflowAttributeUserInputotcs_user_picker) {
                            text = "WorkflowAttributeUserInputotcs_user_picker";
                            that.showUserField(this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j], text);
                        }

                        this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j].childrenByPropertyId["valueWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block');
                        this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j].childrenByPropertyId["actionattrnameWorkflowAttributeValueFrom"].containerItemEl.css('display', 'block');
                        if (this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j].childrenByPropertyId["Attribute"].fieldView.getValue().attributes.name === undefined) {
                            var enumArray = [];
                            enumArray.push(this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].fieldView.collection.findWhere({ 'id': null }));
                            this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].fieldView.setValue(enumArray[0]);
                            this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[i].childrenByPropertyId["Attribute"].containerItemEl.addClass('cs-worflow-error');
                            this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j].childrenByPropertyId["Attribute"].getFieldEl().addClass('binf-has-error');
                            this.form.childrenByPropertyId.actions_Data.children[i].childrenByPropertyId["valueWorkflowAttribute"].children[j].childrenByPropertyId["Attribute"].displayMessage(lang.requiredField);
                        }
                    }
                }
            }
            this.updateDependsOnField();
            this.updateBooleanField();
            this.updateAttributeField();
            this.updateAttachmentsField();
            this.showErrorMsg();
        },
        RemoveParameter: function (fieldParent) {
            if (!!event && !!event.relatedTarget && $(event.relatedTarget).attr('data-alpaca-array-actionbar-action') === 'remove') {
                this.paramParent = fieldParent;
                this.paramField = fieldParent.field;
                this.event = event;
                this.OnChangeParameter();
            }
        }

    });

    return EACActionsView;

});
