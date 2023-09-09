/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
    'csui/utils/contexts/factories/connector', 'csui/controls/form/form.view', 'csui/controls/progressblocker/blocker',
    'xecmpf/widgets/eac/impl/actionplan.rules/impl/actionplan.rules.form.model',
    'hbs!xecmpf/widgets/eac/impl/actionplan.rules/impl/actionplan.rules',
    'csui/controls/globalmessage/globalmessage',
    'i18n!xecmpf/widgets/eac/impl/nls/lang',
    'css!xecmpf/widgets/eac/impl/actionplan.rules/impl/actionplan.rules'
], function (_, $, Backbone, Marionette,
    ConnectorFactory, FormView, BlockingView,
    EACRuleFormModel, formTemplate, GlobalMessage, lang) {
        var EACRulesView = FormView.extend({
            className: function() {
                var computedClassName = FormView.prototype.className.call(this);
                computedClassName += ' xecmpf-eac-rules xecmpf-eac-rules-read xecmpf-eac-rules-hide-validation-errors';
                computedClassName += (this.options.isNewActionPlan ? ' xecmpf-eac-new-action-plan-rules' : '');
                return computedClassName;
            },
            constructor: function(options) {
                FormView.prototype.constructor.call(this, options);
                this.listenTo(this, "change:field", this.onFieldChanged);
                this.listenTo(this.model, 'field:invalid', this.disableSave);
                this.listenTo(this.model, 'field:valid', this.enableProperties);
                this.listenTo(this, 'render:form', this.displayField);
            },
            ui: {
                pullRight: '.cs-pull-right',
				editIcon: '.inline-edit-icon',
                expressionButton: '.alpaca-container-item-first.csui-field-select .cs-field-write button'
            },
            events: {
                "mouseenter @ui.pullRight": "onMouseEnterOnActionButtons",
                "mouseleave @ui.pullRight": "onMouseLeaveFromActionButtons",
                "click @ui.editIcon": "_doEditActions",
                "focusout .alpaca-field-array": "showInReadMode",
                "click @ui.expressionButton": "onExpressionClick"
            },
            formTemplate: formTemplate,
            formTemplateHelpers: function () {
                return {
                    rulesLabel: lang.rulesLabel,
                    rulesSetLegend: lang.rulesSetLegend
                };
            },
            onRenderForm: function() {
                var rulesRowsSelector = ".xecmpf-eac-rules-container .cs-form-set .cs-array.alpaca-container-item";
                this.$el.find(rulesRowsSelector).addClass("xecmpf-eac-existing-rule");
                if (this.alpaca.options.fields.rulesSet && this.alpaca.options.fields.rulesSet.actionbar) {
                    var removeAction = this.alpaca.options.fields.rulesSet.actionbar.actions.filter(function (action) { return (action.action === 'remove'); })[0];
                    var orgClick = removeAction.click;
                    var self = this;
                    removeAction.click = function (key, action, itemIndex) {
                        orgClick.call(this, key, action, itemIndex);
                        if (itemIndex === 1) {
                            self.form.childrenByPropertyId["rulesSet"].children[0].childrenByPropertyId["from"].fieldView.ui.toggle.trigger("focus");
                        }
                    };
                    var addAction = this.alpaca.options.fields.rulesSet.actionbar.actions.filter(function (action) { return (action.action === 'add'); })[0];
                    var addOrgClick = addAction.click;
                    addAction.click = function (key, action, itemIndex) {
                        if (!self.addBlockClickCheck) {
                            addOrgClick.call(this, key, action, itemIndex);
                            self.addBlockClickCheck = true;
                            self.form.field.on("fieldupdate", { self: self, rowCount: self.form.children[0].children.length, itemIndex: itemIndex }, self.addActionFieldUpdateListener);
                        }
                    }
                }
                
            },  
            
            _getLayout: function () {
                FormView.prototype._getLayout.call(this);
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
                    rulesSet: '.xecmpf-eac-rules-container'
                };
            }, 
            isFormValid: function() {
                this.$el.removeClass('xecmpf-eac-rules-hide-validation-errors'); // error indications can be shown after calling this method
                return this.validate();
            },  
            getSubmitData: function () {
                var data = this.getValues().rulesSet;
                data.length === 1 && !data[0].operator && !data[0].from && !data[0].to && (data = []);                
                return data;
            },
            onMouseEnterOnActionButtons: function(event) {
                var $currentTarget = $(event.currentTarget);
                if ($currentTarget.find('button').hasClass('binf-hidden')) {
                    $currentTarget.parent().find('.cs-pull-left .cs-field-write').trigger('mouseenter');
                }
            },
            onMouseLeaveFromActionButtons: function(event) {
                var $currentTarget = $(event.currentTarget);
                if (!$currentTarget.find('button').hasClass('binf-hidden')) {
                    $currentTarget.parent().find('.cs-pull-left .cs-field-write').trigger('mouseleave');
                }
            },
            _doEditActions: function () {
                var that = this;
                if (this.form.childrenByPropertyId["rulesSet"].children.length > 0) {
                    this.$el.addClass("xecmpf-eac-rules-write");
                    this.$el.removeClass("xecmpf-eac-rules-read");
                    $(document).on('click.' + this.cid, {view: this}, this._documentClick);
                } else {
                    this.$el.removeClass("xecmpf-eac-rules-write");
                    this.$el.addClass("xecmpf-eac-rules-read");
                    $(document).off('click.' + this.cid, {view: this}, this._documentClick);
                    this.$el.on('tab:content:field:changed', function (event) {
                        if ($(event.target).find(".csui-bulk-edit-cancel").length) {
                            that.displayField(false);
                        }
                    });
                }
                var fromField, i,
                    ruleSetField = this.form.childrenByPropertyId["rulesSet"].childrenById;
                for (i in ruleSetField) {
                    fromField = i;
                }
               
                if (!!this.form.childrenByPropertyId["rulesSet"].children[0]) {
                    this.form.childrenByPropertyId["rulesSet"].children[0].childrenByPropertyId["conjunction"].containerItemEl.css('visibility', 'hidden');
                    this.form.childrenByPropertyId["rulesSet"].children[0].childrenByPropertyId["conjunction"].containerItemEl.css('display', 'block');
                }
                if (!!this.form.childrenByPropertyId["rulesSet"].childrenById[fromField]) {
                    this.form.childrenByPropertyId["rulesSet"].childrenById[fromField].childrenByPropertyId["from"].fieldView.ui.toggle.trigger("focus");
                }
            },

            _documentClick: function (event) {
                var self = event.data.view;
                if (!self.$el.find('.xecmpf-eac-rules-container').has(event.target).length && !($(event.target).is('.csui-array-icon-delete-toolbarSticky'))) {
                    self.$el.removeClass("xecmpf-eac-rules-write");
                    self.$el.addClass("xecmpf-eac-rules-read");
                }
            },

            showInReadMode: function () {
                var invalidField = this.$el.find('.cs-formfield.cs-formfield-invalid');
                if (invalidField.length) {
                    invalidField.removeClass('cs-formfield-invalid');
                }
                var ruleSetField, i, readField, writeFieldText,
                    length = this.form.childrenByPropertyId["rulesSet"].children.length;
                	this.onFieldChanged();
                if (length > 1) {
                    for (i = 1; i < length; i++) {
                        ruleSetField = this.form.childrenByPropertyId["rulesSet"].children[i];
                        readField = ruleSetField.childrenByPropertyId["conjunction"].fieldView.ui.readField.children()[0];
                        writeFieldText = ruleSetField.childrenByPropertyId["conjunction"].fieldView.ui.writeField.children()[0].innerText;
                        readField.innerText = writeFieldText;
                    }
                }
            },
            onFieldChanged: function () {
                var length = this.alpaca.options.fields.rulesSet.fields.item.fields.from.optionLabels.length;
                var i, ele, label;
                for (var rule in this.form.childrenByPropertyId["rulesSet"].childrenById) {
                    for (i = 0; i < length; i++) {
                        label = this.alpaca.options.fields.rulesSet.fields.item.fields.from.optionLabels[i];
                        this.setRequireStatus(rule, label, "value");
                        this.setRequireStatus(rule, label, "to2");
                    }
                }
            },
            setRequireStatus: function (rule, label, field) {
                var ele = this.form.childrenByPropertyId["rulesSet"].childrenById[rule].childrenByPropertyId[field + label];
                if (!!ele) {
                    if (!ele.isHidden()) {
                        if (ele.isEmpty()) {
                            this.form.schema.properties.rulesSet.items.properties[field + label].required = true;
                            ele.displayMessage(lang.requiredField);
                            ele.getFieldEl().addClass('binf-has-error');
                        }
                        else if(!this.form.options.fields.rulesSet.fields.item.fields[field + label].removeDefaultNone){
                            this.form.schema.properties.rulesSet.items.properties[field + label].required = false;
                        }
                    }
                    else {
                        if (this.form.schema.properties.rulesSet.items.properties[field + label].required &&
                            !this.form.options.fields.rulesSet.fields.item.fields[field + label].removeDefaultNone) {
                            this.form.schema.properties.rulesSet.items.properties[field + label].required = false;
                        }

                    }
                }
            },
            onExpressionClick: function (event) {
                if ($(event.currentTarget).parents('.cs-array.alpaca-container-item').attr('data-alpaca-container-item-index') !== '1') {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.listenTo(this.form.children[0].children[1].children[0].fieldView, "childview:click:link", function (selectFieldItemView) {
                    var value = {}, rowExpressionFieldview;
                    value.id = this.form.children[0].children[1].children[0].fieldView.model.id;
                    value.name = this.form.children[0].children[1].children[0].fieldView.model.attributes.name;
                    for (var i = 2; i < this.form.children[0].children.length; i++) {
                        rowExpressionFieldview = this.form.children[0].children[i].children[0].fieldView;
                        if (!!rowExpressionFieldview) {
                            rowExpressionFieldview.options.model.attributes.data = value.id;
                            rowExpressionFieldview.model.set(value);
                            rowExpressionFieldview.alpacaField && rowExpressionFieldview.alpacaField.setValue(rowExpressionFieldview.model.id);
                        }
                    }
                });
            },
            addActionFieldUpdateListener: function (event) {
                var self = event.data.self, itemIndex = event.data.itemIndex;
                if (self.form.children[0].children.length > event.data.rowCount) {
                    self.form.field.off("fieldupdate", self.addActionFieldUpdateListener);
                    self.addBlockClickCheck = false;
                    self.form.children[0].children[itemIndex + 1].children[0].containerItemEl.find('button').on('focus', { self: self, itemIndex: itemIndex }, self.setExpressionValue);
                }
            },
            setExpressionValue: function (event) {
                var self = event.data.self, itemIndex = event.data.itemIndex + 1;
                var rowExpressionField = self.form.children[0].children[itemIndex].children[0];
                var value = {};
                if (itemIndex === 1) {
                    value.id = (self.form.children[0].children[2] && self.form.children[0].children[2].children[0].fieldView.model.id) || "and";
                    value.name = (self.form.children[0].children[2] && self.form.children[0].children[2].children[0].fieldView.model.id) || "and";
                }
                else {
                    value.id = self.form.children[0].children[1].children[0].fieldView.model.id || "and";
                    value.name = self.form.children[0].children[1].children[0].fieldView.model.attributes.name || "and";
                }
                if (!!rowExpressionField) {
                    rowExpressionField.containerItemEl.find('button').off('focus', self.setExpressionValue);
                    rowExpressionField.fieldView.options.model.attributes.data = value.id;
                    rowExpressionField.fieldView.model.set(value);
                    rowExpressionField.fieldView.alpacaField && rowExpressionField.fieldView.alpacaField.setValue(rowExpressionField.fieldView.model.id);
                    rowExpressionField.containerItemEl.find('button').trigger('focus');
                }
            },
            UpdateDependantCatAttrs: function (children, type) {
                var element = children.find(function (ele) {
                    return ele.name.includes('to2Category Attribute') && ele.type !== type && !ele.isHidden();
                });
                if (!!element) {
                    element.containerItemEl.addClass('binf-hidden');
                    element.field.addClass('binf-hidden');
                    switch (element.type) {
                        case "date":
                            this.alpaca.options.fields.rulesSet.fields.item.fields["to2Category Attributedate"].hidden = true;
                            break;
                        case "integer":
                            this.alpaca.options.fields.rulesSet.fields.item.fields["to2Category Attributeinteger"].hidden = true;
                            break;
                        case "otcs_user":
                            this.alpaca.options.fields.rulesSet.fields.item.fields["to2Category Attributeotcs_user_picker"].hidden = true;
                            break;
                        case "string":
                            this.alpaca.options.fields.rulesSet.fields.item.fields["to2Category Attribute"].hidden = true;
                            break;
                        case "text":
                            this.alpaca.options.fields.rulesSet.fields.item.fields["to2Category Attribute"].hidden = true;
                            break;
                        case "checkbox":
                            this.alpaca.options.fields.rulesSet.fields.item.fields["to2Category Attributecheckbox"].hidden = true;
                            break;
                    }
                }
            },
            UpdateOperators: function (operators, field, value) {
                var typeArray = [], i = 0, j = 0;
                field.fieldView.collection.reset();
                for (i = 0; i < operators.length; i++) {
                    if (value === operators[i]) {
                        j = i;
                    }
                    typeArray.push(new Backbone.Model({ 'id': operators[i], 'name': operators[i] }));
                }
                field.fieldView.collection.reset(typeArray);
                this.model.attributes.options.fields.rulesSet.fields.item.fields["operatorCategory Attribute"].optionLabels = operators;
                this.model.attributes.schema.properties.rulesSet.items.properties["operatorCategory Attribute"].enum = operators;
                field.fieldView.collection.reset(typeArray);
                field.fieldView.setValue(typeArray[j]);
            },
           
            enableProperties: function () {
                var type, currentRule, operators, currentOperator;
                if (!!this.model.categoryResponse && !!this.model.categoryResponse.typeName) {
                    type = this.model.categoryResponse.typeName;
                    operators = this.model.categoryResponse.operators;
                    if (this.model.currentTarget.length > 0) {
                        for (var i = 0; i < this.model.currentTarget.length; i++) {

                            if (this.model.currentTarget[i].data === this.model.value.split("&")[1].split('=')[1]) {
                                currentRule = this.form.childrenByPropertyId["rulesSet"].childrenById[this.model.currentTarget[i].parent.id];
                                this.model.currentTarget.splice(i, 1);
                                this.enableFieldbyType(type, currentRule, operators, currentOperator);
                            }
                        }
                    }

                } else {
                    if (!!this.model.children) {
                        type = this.model.typeName;
                        currentRule = this.model.children;
                        operators = this.model.operators;
                        currentOperator = this.model.currentOperator;
                    }
                    this.enableFieldbyType(type, currentRule, operators, currentOperator);
                }
            },
            enableFieldbyType: function (type, currentRule, operators, currentOperator) {
                switch (type) {
                    case "Date":
                        this.hideDependentFields(true, type, currentRule);
                        currentRule.childrenByPropertyId["to2Category Attributedate"].field.removeClass('binf-hidden');
                        currentRule.childrenByPropertyId["to2Category Attributedate"].containerItemEl.removeClass('binf-hidden');
                        break;
                    case "Integer":
                        this.hideDependentFields(true, type, currentRule);
                        currentRule.childrenByPropertyId["to2Category Attributeinteger"].field.removeClass('binf-hidden');
                        currentRule.childrenByPropertyId["to2Category Attributeinteger"].containerItemEl.removeClass('binf-hidden');
                        break;
                    case "User":
                        this.hideDependentFields(true, type, currentRule);
                        currentRule.childrenByPropertyId["to2Category Attributeotcs_user_picker"].field.removeClass('binf-hidden');
                        currentRule.childrenByPropertyId["to2Category Attributeotcs_user_picker"].containerItemEl.removeClass('binf-hidden');
                        break;
                    case "StringField":
                        this.hideDependentFields(true, type, currentRule);
                        if (currentRule.childrenByPropertyId["to2Category Attribute"].isHidden()) {
                            currentRule.childrenByPropertyId["to2Category Attribute"].field.removeClass('binf-hidden');
                            currentRule.childrenByPropertyId["to2Category Attribute"].containerItemEl.removeClass('binf-hidden');
                        }
                        break;
                    case "Boolean":
                        this.hideDependentFields(true, type, currentRule);
                        currentRule.childrenByPropertyId["to2Category Attributecheckbox"].field.removeClass('binf-hidden');
                        currentRule.childrenByPropertyId["to2Category Attributecheckbox"].containerItemEl.removeClass('binf-hidden');
                        break;
                }
                this.UpdateOperators(operators, currentRule.childrenByPropertyId["operatorCategory Attribute"], currentOperator);
                this._doEditActions();    
            },
            disableSave: function () {
                var currentRule;
                if (this.model.currentTarget.length > 0) {
                    for (var i = 0; i < this.model.currentTarget.length; i++) {

                        if (this.model.currentTarget[i].data === this.model.value.split("&")[1].split('=')[1]) {
                            currentRule = this.form.childrenByPropertyId["rulesSet"].childrenById[this.model.currentTarget[i].parent.id];
                            this.UpdateDependantCatAttrs(currentRule.children, this.model.currentTarget.type);
                            this.hideDependentFields(true, this.model.currentTarget.type, currentRule);
                        }
                    }
                }
                this.$el.closest(".xecmpf-actionpan-details-view").find(".xecmpf-eac-save-actionplan").prop("disabled", true);
            },
            displayField: function (EditAction) {
                var i, children, type, that = this, setAttributes;
                that.model.currentTarget = [];
                if (!!this.form && !!this.form.childrenByPropertyId) {
                    for (i = 0; i < this.form.childrenByPropertyId["rulesSet"].children.length; i++) {
                        if (!!this.model.attributes.data.rulesSet[i] && !!this.model.attributes.data.rulesSet[i]["valueCategory Attribute"]) {
                            setAttributes = this.form.childrenByPropertyId["rulesSet"].children[i].childrenByPropertyId["valueCategory Attribute"];
                            !!setAttributes && setAttributes.fieldView.alpacaField.refreshValidationState(false, function () {
                                if (that.$el.find(".binf-has-error").length > 0) {
                                    if (that.$el.find('.csui-bulk-edit-rulesSet') && !!EditAction) {
                                        that.$el.find('.csui-bulk-edit-rulesSet').trigger('click');
                                    }
                                }
                                that.$el.off('tab:content:field:changed');
                            });
                        } else {
                            if (!!this.model.get('data').rulesSet[i] && !!this.model.get('data').rulesSet[i]["categorDetails"]) {
                                this.model.children = children = this.form.childrenByPropertyId["rulesSet"].children[i];
                                type = this.model.typeName = this.model.get('data').rulesSet[i]["categorDetails"].typeName;
                                this.model.operators = this.model.get('data').rulesSet[i]["categorDetails"].operators;
                                this.model.currentOperator = this.model.get('data').rulesSet[i]["operatorCategory Attribute"];
                                this.enableProperties();
                                this.hideDependentFields(true, type, children);
                            }
                            setAttributes = this.form.childrenByPropertyId["rulesSet"].children[i].childrenByPropertyId["valueCategory Attribute"];
                            that.model.currentTarget.push(setAttributes);
                            !!setAttributes && setAttributes.fieldView.alpacaField.refreshValidationState(false, function (event) {
                                that.$el.off('tab:content:field:changed');
                            });
                        }
                    }
                }
            },
            getFieldOnType: function (child, type) {
                switch (type) {
                    case "Date":
                        return child.childrenByPropertyId["to2Category Attributedate"];
                    case "Integer":
                        return child.childrenByPropertyId["to2Category Attributeinteger"];
                    case "StringField":
                        return child.childrenByPropertyId["to2Category Attribute"];
                    case "User":
                        return child.childrenByPropertyId["to2Category Attributeotcs_user_picker"];
                    case "Boolean":
                        return child.childrenByPropertyId["to2Category Attributecheckbox"];
                }
            },
            hideDependentFields: function (hide, type, child) {
                var types = ["Date", "StringField", "Integer", "User", "Boolean"], element, that = this;
                types.forEach(function (value) {
                    if (value !== type) {
                        if (hide) {
                            element = that.getFieldOnType(child, value);
                            element.containerItemEl.addClass('binf-hidden');
                        } else {
                            element = that.getFieldOnType(child, value);
                            element.containerItemEl.removeClass('binf-hidden');
                        }
                    }
                })
            }
        });
        return EACRulesView;
    });
