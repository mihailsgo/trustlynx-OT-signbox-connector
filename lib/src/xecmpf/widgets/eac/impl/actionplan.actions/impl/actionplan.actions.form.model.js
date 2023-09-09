/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict'

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
    'csui/models/form',
    'csui/utils/contexts/factories/connector',
    'xecmpf/models/eac/eac.complete.reminder.model',
    'xecmpf/models/eac/eac.planproperties.factory',
    'xecmpf/models/eac/eac.defaultplans.factory',
    'xecmpf/models/eac/eac.action.reminder.model',
    'xecmpf/models/eac/eac.action.workflow.attributes.model',
    'xecmpf/widgets/eac/impl/actionplan.actions/impl/actionplan.actions.webreport',
    'xecmpf/widgets/eac/impl/actionplan.actions/impl/actionplan.actions.centralworkspace',
    'i18n!xecmpf/widgets/eac/impl/nls/lang'
], function (_, $, base, Form, ConnectorFactory, ReminderCompleteFormModel, EACPlanProperties, EACDefaultPlansFactory, ReminderFormModel, WorkflowAttrModel, Webreport, CentralWorkspace, lang) {

    var EACActionsFormModel = Form.extend({

        constructor: function (attributes, options) {
            this.options = options || (options = {});
            attributes || (attributes = {
                data: {},
                options: {},
                schema: {}
            });

            Form.prototype.constructor.call(this, attributes, options);
        },

        initialize: function (attributes, options) {
            var promises = [],
                namespace = !!options.eventModel ? options.eventModel.namespace : undefined,
                eventname = !!options.eventModel ? options.eventModel.event_name : undefined,
                eacDefaultPlans = options.context.getCollection(EACDefaultPlansFactory),
                connector = options.context.getModel(ConnectorFactory),
                eacPlanProperties = options.context.getCollection(EACPlanProperties, {
                    eventModel: options.eventModel,
                    attributes: {
                        namespace: namespace,
                        event_name: eventname
                    }
                }), promise;

            this.escModel = new ReminderCompleteFormModel({}, { connector: connector });
            this.attrModel = new WorkflowAttrModel({}, { connector: connector });

            if (!!options.context && !options.context.formModel) {
                this.formModel = new ReminderFormModel({}, { connector: connector });
                promise = this.formModel.fetch();
                options.context.formModel = this.formModel;
                options.context.promise = promise;
            } else {
                promise = options.context.promise;
                this.formModel = options.context.formModel;
            }

            if (!eacDefaultPlans.fetched) {
                promises.push(eacDefaultPlans.fetch());
            }

            if (!eacPlanProperties.planProperties) {
                promises.push(eacPlanProperties.fetch());
            }
            options.eventModel.actionAttributeCollection = eacDefaultPlans;

            $.when.apply($, promises).done(function () {
                eacPlanProperties.planProperties = eacPlanProperties.map(function (model) {
                    return model.get('name');
                });
                var that = this;
                promise.done(function () {
                    if (!!options && !!options.eventModel.data && !!options.eventModel.data.actions) {
                        eacDefaultPlans.actions = options.eventModel.data[options.eventModel.data.actions + "_fields"];
                        that._setAttributes(eacDefaultPlans, eacPlanProperties.planProperties, that.formModel);
                    } else {
                        that._setAttributes(eacDefaultPlans, eacPlanProperties.planProperties, that.formModel);
                    }
                });
                promise.fail(function () {
                    if (!!options && !!options.eventModel.data && !!options.eventModel.data.actions) {
                        eacDefaultPlans.actions = options.eventModel.data[options.eventModel.data.actions + "_fields"];
                        that._setAttributes(eacDefaultPlans, eacPlanProperties.planProperties);
                    } else {
                        that._setAttributes(eacDefaultPlans, eacPlanProperties.planProperties);
                    }
                });
            }.bind(this));
        },
        
        _setAttributes: function (eacDefaultPlans, planProperties, formModel) {
            var that = this,
                attributes = {
                "options": {
                    "fields": {
                        "actions_Data": {
                            "fields": {
                                "item": {
                                    "type": "object",
                                    "fields": {
                                        "action": {
                                            "readonly": false,
                                            "type": "select",
                                            "label": lang.actions,
                                            "fieldclass": "eac-action-label",
                                            "onFieldChange": function(event) {       
                                                that.trigger('update:error',event);   
                                            }
                                        }

                                    }
                                }
                            }
                        }
                    }
                },
                "schema": {
                    "type": "object",
                    "properties": {
                        "actions_Data": {
                            "type": "array",
                            "items": {
                                "defaultItems": 1,
                                "maxItems": 50,
                                "minItems": 1,
                                "type": "object",
                                "properties": {
                                    "action": {
                                        "enum": ["CreateOrUpdateEventAction.Create Or Update Workspace", "DocGenEventAction.Create document"],
                                        "readonly": false,
                                        "required": true,
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                }
            };

            attributes.schema.properties['actions_Data'].items.properties["actionattrnameDependsOn"] = {
                "helper": lang.DependsOn,
                "required": false,
                "type": "text",
                "default": lang.DependsOn
            };
            attributes.options.fields['actions_Data'].fields.item.fields["actionattrnameDependsOn"] = {
                "type": "text",
                "hidden": false,
                "label": lang.DependsOn
            };
            attributes.schema.properties['actions_Data'].items.properties["valueDependsOn"] = {
                "readonly": false,
                "required": false,
                "title": "Enabled",
                "type": "checkbox"
            };
            attributes.options.fields['actions_Data'].fields.item.fields["valueDependsOn"] = {
                "hidden": false,
                "hideInitValidationError": true,
                "label": "Enabled",
                "readonly": false,
                "type": "checkbox",
                "helper": lang.DependsOnText
            };

            var wschema, woptions, wAschema, wAoptions;
            var actionFieldEnum = [],
                actionFieldLabels = [];
                attributes.data = this.getFormData(this.options.collection, eacDefaultPlans);

            for (var k = 0; k < eacDefaultPlans.models.length; k++) {
                var key = eacDefaultPlans.models[k].get("action_key");
                actionFieldEnum.push(key);
                actionFieldLabels.push(eacDefaultPlans.models[k].get('action_name'));
                var schema, options, actionProperties, actionFields, dependentValue, value;

                schema = attributes.schema;
                schema.properties['actions_Data'].items.properties[key + "_fields"] = { "properties": {}, "dependencies": "action", "type": "object" };
                var properties = schema.properties['actions_Data'].items.properties[key + "_fields"].properties;

                options = attributes.options;
                options.fields['actions_Data'].fields.item.fields[key + "_fields"] = { "fields": {}, "dependencies": { "action": key } };
                var fields = options.fields['actions_Data'].fields.item.fields[key + "_fields"].fields;
                
                if (eacDefaultPlans.models[k].get("action_key") === "StartWorkflowEventAction.Start workflow") {

                    properties["actionattributes"] = {
                        "type": "object",
                        "properties": {
                        }
                    };

                    fields["actionattributes"] = {
                        "type": "object",
                        "fields": {
                        }
                    };
                    this.updateAttributeValues(attributes, true);
                    actionProperties = schema.properties['actions_Data'].items.properties[key + "_fields"].properties["actionattributes"].properties;
                    actionFields = options.fields['actions_Data'].fields.item.fields[key + "_fields"].fields["actionattributes"].fields;
                    if (eacDefaultPlans.models[k].get('actions_attributes').length > 0) {
                        var workflowAttributes = eacDefaultPlans.models[k].get('actions_attributes');
                        for (var j = 0; j < workflowAttributes.length; j++) {
                            var wrequiredField = workflowAttributes[j].required,
                                wfieldKey = workflowAttributes[j].key,
                                wsourceKey = "valueWorkflowInitiator",
                                workflowProperties = planProperties.slice();
                            workflowProperties.unshift(lang.rulesFieldPlaceholder);

                            actionProperties["key" + j] = {
                                "required": false,
                                "type": "text",
                                "hidden": true,
                                "label": lang.actionAttrParameterNameLabel,
                                "default": wfieldKey
                            };
                            actionFields["key" + j] = {
                                "type": "text",
                                "label": lang.actionAttrParameterNameLabel,
                                "hidden": true
                            };
                            if (wfieldKey === "Workflow") {

                                schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                    "helper": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "required": eacDefaultPlans.models[k].attributes.actions_attributes[j].required,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 1,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "type": "otcs_node_picker",
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "type": "otcs_node_picker",
                                    "order": 2,
                                    "label": lang.actionAttrValueLabel,
                                    "type_control": {
                                        "parameters": {
                                            "select_types": [
                                                128
                                            ],
                                            "startLocation": "csui/dialogs/node.picker/start.locations/current.location",
                                            "startLocations": [
                                                "csui/dialogs/node.picker/start.locations/current.location",
                                                "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                                "csui/dialogs/node.picker/start.locations/personal.volume",
                                                "csui/dialogs/node.picker/start.locations/favorites",
                                                "csui/dialogs/node.picker/start.locations/recent.containers",
                                                "csui/dialogs/node.picker/start.locations/category.volume",
                                                "csui/dialogs/node.picker/start.locations/perspective.assets.volume",
                                                "recman/dialogs/node.picker/start.locations/classifications.volume", "xecmpf/dialogs/node.picker/start.locations/extended.ecm.volume.container"
                                            ]
                                        }
                                    },
                                    "dependencies": [key + "_fields"],
                                    "validator": function (callback) {
                                       var value = this.getValue();
                                       if (value) {
                                         that.updateAttributeValues(attributes, false, value, this);
                                       }
                                     }
                                };

                            }
                            else if (wfieldKey === "WorkflowInitiator") {
                                schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                    "required": eacDefaultPlans.models[k].attributes.actions_attributes[j].required,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 3,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "type": "string",
                                    "enum": [null, "ContentServerUser", "eventProp"],
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "type": "select",
                                    "order": 4,
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + wfieldKey,
                                    "removeDefaultNone": true,
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.ContentServerUser, lang.eventPropLabel],
                                    "dependencies": [key + "_fields"]
                                };

                            } else if (wfieldKey === 'WorkflowEvtProp') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {

                                    "required": eacDefaultPlans.models[k].attributes.actions_attributes[j].required,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": wsourceKey
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 5,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}
                                };

                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "dependencies": wsourceKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "string",
                                    "enum": workflowProperties
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "type": "select",
                                    "order": 6,
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "removeDefaultNone": true,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + wfieldKey,
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey].dependencies[wsourceKey] = "eventProp";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey].dependencies[wsourceKey] = "eventProp";

                            } else if (wfieldKey === 'WorkflowUser') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                    "required": eacDefaultPlans.models[k].attributes.actions_attributes[j].required,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": wsourceKey
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 7,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}
                                };

                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "dependencies": wsourceKey,
                                    "type": "otcs_member_picker"
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "order": 8,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "otcs_member_picker",
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey].dependencies[wsourceKey] = "ContentServerUser";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey].dependencies[wsourceKey] = "ContentServerUser";
                            } else if (wfieldKey === 'WorkflowAttributes') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                    "helper": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "required": eacDefaultPlans.models[k].attributes.actions_attributes[j].required,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 9,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "readonly": false,
                                    "required": false,
                                    "title": "Enabled",
                                    "type": "checkbox",
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "hidden": false,
                                    "hideInitValidationError": true,
                                    "order": 10,
                                    "label": "Enabled",
                                    "readonly": false,
                                    "type": "checkbox",
                                    "dependencies": [key + "_fields"]
                                };
                            } else if (wfieldKey === 'WorkflowAttribute') {

                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "dependencies": "valueWorkflowAttributes",
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "Attribute": {
                                                "enum": [null],
                                                "readonly": false,
                                                "required": true,
                                                "type": "string"
                                            }
                                        }
                                    }
                                };


                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "order": 11,
                                    "fields": {
                                        "item": {
                                            "type": "object",
                                            "fields": {
                                                "Attribute": {
                                                    "readonly": false,
                                                    "hideInitValidationError": true,
                                                    "optionLabels": [lang.rulesFieldPlaceholder],
                                                    "type": "select",
                                                    "onFieldChange": function (event) {
                                                        that.trigger('update:valueField', event);
                                                    },
                                                    "label": lang.Attribute
                                                }
                                            }
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey].dependencies["valueWorkflowAttributes"] = true;
                                wschema = attributes.schema;
                                woptions = attributes.options;
                            } else if (wfieldKey === 'WorkflowAttributeValueFrom') {
                                wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["actionattrname" + wfieldKey] = {
                                    "required": true,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name
                                };
                                woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 12,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name
                                };
                                wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["value" + wfieldKey] = {
                                    "type": "string",
                                    "required": true,
                                    "enum": [null, "csObj", "evtProp", "UserInput", "prevAct"]
                                };
                                woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey] = {
                                    "type": "select",
                                    "order": 13,
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + wfieldKey,
                                    "removeDefaultNone": true,
                                    "onFieldChange": function (event) {
                                        that.trigger('update:userInput', event);
                                    },
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.csObjLabel, lang.evtPropLabel, lang.userInput, lang.fromPreviousAction]
                                };
                            } else if (wfieldKey === 'WorkflowAttributeCSObject') {
                                wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["actionattrname" + wfieldKey] = {
                                    "required": true,
                                    "dependencies": "valueWorkflowAttributeValueFrom",
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name

                                };
                                woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 14,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}

                                };
                                wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["value" + wfieldKey] = {
                                    "dependencies": "valueWorkflowAttributeValueFrom",
                                    "type": "string",
                                    "required": true
                                };
                                woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey] = {
                                    "type": "otcs_node_picker",
                                    "order": 15,
                                    "label": lang.actionAttrValueLabel,
                                    "type_control": {
                                        "parameters": {
                                            "startLocation": "csui/dialogs/node.picker/start.locations/current.location",
                                            "startLocations": [
                                                "csui/dialogs/node.picker/start.locations/current.location",
                                                "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                                "csui/dialogs/node.picker/start.locations/personal.volume",
                                                "csui/dialogs/node.picker/start.locations/favorites",
                                                "csui/dialogs/node.picker/start.locations/recent.containers",
                                                "csui/dialogs/node.picker/start.locations/category.volume",
                                                "csui/dialogs/node.picker/start.locations/perspective.assets.volume",
                                                "recman/dialogs/node.picker/start.locations/classifications.volume", "xecmpf/dialogs/node.picker/start.locations/extended.ecm.volume.container"
                                            ]
                                        }
                                    },
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey].dependencies["valueWorkflowAttributeValueFrom"] = "csObj";
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey].dependencies["valueWorkflowAttributeValueFrom"] = "csObj";
                            } else if (wfieldKey === 'WorkflowAttributeEvtProp') {

                                wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["actionattrname" + wfieldKey] = {
                                    "required": true,
                                    "dependencies": "valueWorkflowAttributeValueFrom",
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name

                                };
                                woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 16,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}
                                };

                                wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["value" + wfieldKey] = {
                                    "dependencies": "valueWorkflowAttributeValueFrom",
                                    "label": lang.actionAttrValueLabel,
                                    "required": true,
                                    "type": "string",
                                    "enum": workflowProperties
                                };
                                woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey] = {
                                    "type": "select",
                                    "order": 17,
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "removeDefaultNone": true,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + wfieldKey,
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey].dependencies["valueWorkflowAttributeValueFrom"] = "evtProp";
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey].dependencies["valueWorkflowAttributeValueFrom"] = "evtProp";
                            } else if (wfieldKey === 'WorkflowAttributeUserInput') {
                                var n, typeArr = ['text', 'integer', 'checkbox', 'date', 'otcs_user_picker'];
                                for (n = 0; n < typeArr.length; n++) {
                                    wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["actionattrname" + wfieldKey + typeArr[n]] = { "required": true, "dependencies": "Attribute", "type": "text", "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name };
                                    woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey + typeArr[n]] = { "dependencies": {}, "order": 18 + n, "type": "text", "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name };
                                    wschema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["value" + wfieldKey + typeArr[n]] = { "required": true, "dependencies": "Attribute", "type": typeArr[n], "placeholder": lang.rulesFieldPlaceholder };
                                    woptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey + typeArr[n]] = { "dependencies": {}, "order": 19 + n, "type": typeArr[n], "placeholder": lang.rulesFieldPlaceholder };
                                    options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["value" + wfieldKey + typeArr[n]].dependencies["Attribute"] = "";
                                    options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["actionattrname" + wfieldKey + typeArr[n]].dependencies["Attribute"] = "";
                                }
                            } else if (wfieldKey === 'WorkflowAttachments') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                    "helper": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "required": false,
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 24,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": key + "_fields"
                                };
                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "readonly": false,
                                    "required": false,
                                    "title": "Enabled",
                                    "type": "checkbox",
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "hidden": false,
                                    "hideInitValidationError": true,
                                    "order": 25,
                                    "label": "Enabled",
                                    "readonly": false,
                                    "type": "checkbox",
                                    "dependencies": [key + "_fields"]
                                };
                            } else if (wfieldKey === 'WorkflowAttachmentsValueFrom') {
                                schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                    "dependencies": "valueWorkflowAttachments",
                                    "type": "array",
                                    "items": {
                                        "maxItems": 1,
                                        "type": "object",
                                        "properties": {
                                            "Attachments": {
                                                "enum": [null, "csObj", "fromDesktop", "fromShortcut", "prevAct"],
                                                "readonly": false,
                                                "required": true,
                                                "type": "string"
                                            }
                                        }
                                    }
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                    "order": 26,
                                    "fields": {
                                        "item": {
                                            "type": "object",
                                            "fields": {
                                                "Attachments": {
                                                    "readonly": false,
                                                    "hideInitValidationError": true,
                                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.csObjLabel, lang.fromDesktop, lang.fromShortcut, lang.fromPreviousAction],
                                                    "type": "select",
                                                    "onFieldChange": function (event) {
                                                        that.trigger('update:valueFromDesktop', event);
                                                    },
                                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name
                                                }
                                            }
                                        }
                                    },
                                    "dependencies": {}
                                };
                                wAschema = attributes.schema;
                                wAoptions = attributes.options;
                                options.fields['actions_Data'].fields.item.fields["value" + wfieldKey].dependencies["valueWorkflowAttachments"] = true;
                            } else if (wfieldKey === 'WorkflowAttachmentsValueFromCSObject') {
                                wAschema.properties['actions_Data'].items.properties["valueWorkflowAttachmentsValueFrom"].items.properties["actionattrname" + wfieldKey] = {
                                    "required": true,
                                    "dependencies": "Attachments",
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name
                                };
                                wAoptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 27,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}
                                };
                                wAschema.properties['actions_Data'].items.properties["valueWorkflowAttachmentsValueFrom"].items.properties["value" + wfieldKey] = {
                                    "dependencies": "Attachments",
                                    "type": "string",
                                    "required": true
                                };
                                wAoptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["value" + wfieldKey] = {
                                    "type": "otcs_node_picker",
                                    "order": 28,
                                    "label": lang.actionAttrValueLabel,
                                    "type_control": {
                                        "parameters": {
                                            "select_types": [
                                                848, 298, 136, 144, 751, 0, 123469, 1, 140, 5573
                                            ],
                                            "startLocation": "csui/dialogs/node.picker/start.locations/current.location",
                                            "startLocations": [
                                                "csui/dialogs/node.picker/start.locations/current.location",
                                                "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                                "csui/dialogs/node.picker/start.locations/personal.volume",
                                                "csui/dialogs/node.picker/start.locations/favorites",
                                                "csui/dialogs/node.picker/start.locations/recent.containers"
                                            ]
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["value" + wfieldKey].dependencies["Attachments"] = "csObj";
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["actionattrname" + wfieldKey].dependencies["Attachments"] = "csObj";
                            } else if (wfieldKey === 'WorkflowAttachmentsValueFromDesktop') {
                                wAschema.properties['actions_Data'].items.properties["valueWorkflowAttachmentsValueFrom"].items.properties["actionattrname" + wfieldKey] = {
                                    "required": false,
                                    "dependencies": "Attachments",
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name
                                };
                                wAoptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 29,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}
                                };
                                wAschema.properties['actions_Data'].items.properties["valueWorkflowAttachmentsValueFrom"].items.properties["value" + wfieldKey] = {
                                    "dependencies": "Attachments",
                                    "type": "string",
                                    "required": false
                                };
                                wAoptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["value" + wfieldKey] = {
                                    "type": "otcs_node_picker",
                                    "order": 30,
                                    "label": lang.actionAttrValueLabel,
                                    "type_control": {
                                        "parameters": {
                                            "select_types": [
                                                848, 298, 136, 144, 751, 0, 123469, 1, 140, 5573
                                            ],
                                            "startLocation": "csui/dialogs/node.picker/start.locations/current.location",
                                            "startLocations": [
                                                "csui/dialogs/node.picker/start.locations/current.location",
                                                "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                                "csui/dialogs/node.picker/start.locations/personal.volume",
                                                "csui/dialogs/node.picker/start.locations/favorites",
                                                "csui/dialogs/node.picker/start.locations/recent.containers"
                                            ]
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["value" + wfieldKey].dependencies["Attachments"] = "fromDesktop";
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["actionattrname" + wfieldKey].dependencies["Attachments"] = "fromDesktop";
                            } else if (wfieldKey === 'WorkflowAttachmentsValueFromAddShortcut') {
                                wAschema.properties['actions_Data'].items.properties["valueWorkflowAttachmentsValueFrom"].items.properties["actionattrname" + wfieldKey] = {
                                    "required": true,
                                    "dependencies": "Attachments",
                                    "type": "text",
                                    "default": eacDefaultPlans.models[k].attributes.actions_attributes[j].name
                                };
                                wAoptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["actionattrname" + wfieldKey] = {
                                    "type": "text",
                                    "order": 31,
                                    "label": eacDefaultPlans.models[k].attributes.actions_attributes[j].name,
                                    "dependencies": {}
                                };
                                wAschema.properties['actions_Data'].items.properties["valueWorkflowAttachmentsValueFrom"].items.properties["value" + wfieldKey] = {
                                    "dependencies": "Attachments",
                                    "type": "string",
                                    "required": true
                                };
                                wAoptions.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["value" + wfieldKey] = {
                                    "type": "otcs_node_picker",
                                    "order": 32,
                                    "label": lang.actionAttrValueLabel,
                                    "type_control": {
                                        "parameters": {
                                            "select_types": [
                                                848, 298, 136, 144, 751, 0, 123469, 1, 140, 5573
                                            ],
                                            "startLocation": "csui/dialogs/node.picker/start.locations/current.location",
                                            "startLocations": [
                                                "csui/dialogs/node.picker/start.locations/current.location",
                                                "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                                "csui/dialogs/node.picker/start.locations/personal.volume",
                                                "csui/dialogs/node.picker/start.locations/favorites",
                                                "csui/dialogs/node.picker/start.locations/recent.containers"
                                            ]
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["value" + wfieldKey].dependencies["Attachments"] = "fromShortcut";
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttachmentsValueFrom"].fields.item.fields["actionattrname" + wfieldKey].dependencies["Attachments"] = "fromShortcut";
                            }
                        }
                    }
                } else if (eacDefaultPlans.models[k].get("action_key") === "StartWebreportEventAction.Start webreport") {
                    Webreport.buildWebreportModel(that, eacDefaultPlans.models[k], planProperties, actionProperties, actionFields, properties, fields, schema, options);
                } else if (eacDefaultPlans.models[k].get("action_key") === "CreateOrUpdateCentralWorkspace.Create Or Update Central Workspace") {
                    CentralWorkspace.buildCentralWorkspaceModel(that, eacDefaultPlans.models[k], planProperties, actionProperties, actionFields, properties, fields, schema, options);
                } else if (eacDefaultPlans.models[k].get("action_key") === "ReminderEventAction.Add A Reminder" && formModel) {
                    properties["actionattributes"] = {
                        "type": "object",
                        "properties": {
                        }
                    };

                    fields["actionattributes"] = {
                        "type": "object",
                        "fields": {
                        }
                    };
                    this.updateTypeValues(attributes);
                    actionProperties = schema.properties['actions_Data'].items.properties[key + "_fields"].properties["actionattributes"].properties;
                    actionFields = options.fields['actions_Data'].fields.item.fields[key + "_fields"].fields["actionattributes"].fields;
                    if (eacDefaultPlans.models[k].get('actions_attributes').length > 0) {
                        var ReminderAttributes = eacDefaultPlans.models[k].get('actions_attributes');
                        for (var l = 0; l < ReminderAttributes.length; l++) {
                            var reminderField = ReminderAttributes[l].required,
                                rfieldKey = ReminderAttributes[l].key,
                                rsourceKey = "valueReminderDueDateFrom",
                                assigneeKey = "valueReminderAssigneeFrom",
                                metadataKey = "valueReminderAssigneePWMetadata",
                                rescalationKey = "valueReminderEscalationTo",
                                rescalationMetadata ="valueReminderEscalationToPWMetadata",
                                reminderProperties = planProperties.slice();
                                reminderProperties.unshift(lang.rulesFieldPlaceholder);

                            actionProperties['key' + l] = {
                                "required": false,
                                "type": "text",
                                "hidden": true,
                                "label": lang.actionAttrParameterNameLabel,
                                "default": rfieldKey
                            };
                            actionFields["key" + l] = {
                                "type": "text",
                                "label": lang.actionAttrParameterNameLabel,
                                "hidden": true
                            };
                            schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey] = {
                                "required": reminderField,
                                "type": "text"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey] = {
                                "type": "text",
                                "dependencies": {}
                            };
                            if (rfieldKey === 'Reminder_client') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 1;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = "ReminderEventAction.Add A Reminder_fields";
                                this.getPlaceholder(null,formModel.attributes.schema.properties.followup_client_name.enum);
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": [key + "_fields"],
                                    "type": "string",
                                    "enum": formModel.attributes.schema.properties.followup_client_name.enum
                                };
                                this.getPlaceholder(lang.reminderClientPlaceholder,formModel.attributes.options.fields.followup_client_name.optionLabels);
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "order": 2,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "optionLabels": formModel.attributes.options.fields.followup_client_name.optionLabels,
                                    "onFieldChange": function(event) {
                                        that.trigger('change:client',event);
                                    },
                                    "removeDefaultNone":true,
                                    "dependencies": {},
                                    "placeholder": lang.reminderClientPlaceholder
                                };
                            } else if (rfieldKey === 'Reminder_type') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = "ReminderEventAction.Add A Reminder_fields";
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 3;
                                for (var val = 0; val < formModel.attributes.schema.properties.followup_client_name.enum.length; val++) {
                                        value = formModel.attributes.schema.properties.followup_client_name.enum[val];
                                        dependentValue = !!value ? value : "";
                                    schema.properties['actions_Data'].items.properties["value" + rfieldKey + value] = {
                                        "dependencies": "valueReminder_client",
                                        "type": "string",
                                        "enum": [null] //TO DO: need to remove once LPAD-88277 is fixed
                                    };
                                    options.fields['actions_Data'].fields.item.fields["value" + rfieldKey + value] = {
                                        "type": "select",
                                        "order": 4,
                                        "label": lang.actionAttrValueLabel,
                                        "fieldClass": "value" + rfieldKey + value,
                                        "optionLabels": [lang.reminderTypePlaceholder],//TO DO: need to remove once LPAD-88277 is fixed
                                        "removeDefaultNone": true,
                                        "placeholder": lang.reminderTypePlaceholder,
                                        "dependencies": { "valueReminder_client": dependentValue },
                                        "onFieldChange": function (event) {
                                            that.trigger('change:type', event);
                                        },
                                    };
                                }
                            } else if (rfieldKey === 'ReminderAddFor') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = "ReminderEventAction.Add A Reminder_fields";
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 5;
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": [key + "_fields"],
                                    "type": "string",
                                    "default": lang.reminderInitLabel,
                                    "enum": [lang.reminderInitLabel]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "order": 6,
                                    "removeDefaultNone": true,
                                    "label": lang.actionAttrValueLabel,
                                    "dependencies": {},
                                    "fieldClass": "value" + rfieldKey
                                };
                            }  else if (rfieldKey === 'ReminderDueDateFrom') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = "ReminderEventAction.Add A Reminder_fields";
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 13;
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "type": "string",
                                    "enum": [null, "eventProp","initObj", "pWorkspace", "evtInitDay"],
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "order": 14,
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "removeDefaultNone": true,
                                    "fieldClass": "value" + rfieldKey,
                                    "label": lang.actionAttrValueLabel,
                                    "helper": lang.selectSourceForDueDate,
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.eventPropLabel, lang.reminderInitLabel, lang.workspaceLabel, lang.eventInitDay],
                                    "dependencies": [key + "_fields"]
                                };
                            } else if (rfieldKey === 'ReminderDueDateEvtProp') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 15;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rsourceKey;
    
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rsourceKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "string",
                                    "enum": reminderProperties
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "removeDefaultNone":true,
                                    "order": 16,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "dependencies": {},
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rsourceKey] = "eventProp";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rsourceKey] = "eventProp";
                            } else if (rfieldKey === 'ReminderDueDateCategoryAttr') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 15;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rsourceKey;
                                
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rsourceKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 16,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("category", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rsourceKey] = "initObj";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rsourceKey] = "initObj";
                            } else if (rfieldKey === 'ReminderDueDatePWCategoryAttr') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 15;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rsourceKey;
                               
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rsourceKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 16,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("category", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rsourceKey] = "pWorkspace";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rsourceKey] = "pWorkspace";
                            } else if (rfieldKey === 'ReminderDueDateCompleteIn') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 15;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rsourceKey;
                               
                                schema.properties['actions_Data'].items.properties["value1" + rfieldKey] = {
                                    "dependencies": rsourceKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "integer",
                                    "maximum": 99,
                                    "minimum":1,
                                    "default": 1
                                };
                                options.fields['actions_Data'].fields.item.fields["value1" + rfieldKey] = {
                                    "type": "integer",
                                    "order": 16,
                                    "fieldClass": "value1" + rfieldKey,
                                    "onFieldChange": function(event) {
                                        that.trigger('change:dueDate',event);
                                    },
                                    "dependencies": {}
                                };
                                schema.properties['actions_Data'].items.properties["value2" + rfieldKey] = {
                                    "dependencies": rsourceKey,
                                    "type": "string",
                                    "label": lang.actionAttrValueLabel,
                                    "default": lang.days,
                                    "enum": [lang.days, lang.weeks, lang.months, lang.years]
                                };
                                options.fields['actions_Data'].fields.item.fields["value2" + rfieldKey] = {
                                    "type": "select",
                                    "order": 17,
                                    "fieldClass": "value2" + rfieldKey,
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rsourceKey] = "evtInitDay";
                                options.fields['actions_Data'].fields.item.fields["value1" + rfieldKey].dependencies[rsourceKey] = "evtInitDay";
                                options.fields['actions_Data'].fields.item.fields["value2" + rfieldKey].dependencies[rsourceKey] = "evtInitDay";
                            } else if (rfieldKey === 'ReminderAssigneeFrom') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = "ReminderEventAction.Add A Reminder_fields";
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 7;
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": [key + "_fields"],
                                    "type": "string",
                                    "enum": [null, "eventProp", "initObj", "pWorkspace"]
                                };

                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "order": 8,
                                    "helper": lang.selectSourceForAssignee,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "removeDefaultNone":true,
                                    "dependencies": {},
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.eventPropLabel, lang.reminderInitLabel, lang.workspaceLabel]
                                };
                            } else if (rfieldKey === 'ReminderAssigneeEvtProp') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 9;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = assigneeKey;
    
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": assigneeKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "string",
                                    "enum": reminderProperties
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "order": 10,
                                    "removeDefaultNone":true,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[assigneeKey] = "eventProp";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[assigneeKey] = "eventProp";
                            } else if (rfieldKey === 'ReminderAssigneeCategoryAttr') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 9;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = assigneeKey;
                                
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": assigneeKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 10,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("category", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[assigneeKey] = "initObj";
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[assigneeKey] = "initObj";
                            } else if (rfieldKey === 'ReminderAssigneePWMetadata') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 9;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = assigneeKey;
    
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": assigneeKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "string",
                                    "enum": [null, "Role", "CategoryAttr"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "order": 10,
                                    "removeDefaultNone":true,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "dependencies": {},
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.roleLabel, lang.categoryAttrLabel]
                                };
                                
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[assigneeKey] = "pWorkspace";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[assigneeKey] = "pWorkspace";
                            } else if (rfieldKey === 'ReminderAssigneePWRole') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 11;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = metadataKey;
                                
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": metadataKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 12,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("role", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[metadataKey] = "Role";
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[metadataKey] = "Role";
                            } else if (rfieldKey === 'ReminderAssigneePWCategoryAttr') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 11;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = metadataKey;
                                
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": metadataKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 12,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("category", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[metadataKey] = "CategoryAttr";
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[metadataKey] = "CategoryAttr";
                            }  else if (rfieldKey === 'ReminderEscalationTo') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = "ReminderEventAction.Add A Reminder_fields";
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 18;
                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": [key + "_fields"],
                                    "type": "string",
                                    "enum": [null, "eventProp", "initObj", "pWorkspace"],
                                };

                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "order": 19,
                                    "helper": lang.selectSourceForEscalation,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "removeDefaultNone":true,
                                    "dependencies": {},
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.eventPropLabel, lang.reminderInitLabel, lang.workspaceLabel]
                                };
                            } else if (rfieldKey === 'ReminderEscalationToEvtProp') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 20;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rescalationKey;

                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rescalationKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "string",
                                    "enum": reminderProperties
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "order": 21,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "dependencies": {},
                                    "removeDefaultNone":true,
                                    "placeholder": lang.rulesFieldPlaceholder
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rescalationKey] = "eventProp";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rescalationKey] = "eventProp";
                            } else if (rfieldKey === 'ReminderEscalationToCategoryAttr') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 20;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rescalationKey;

                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rescalationKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 21,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("category", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rescalationKey] = "initObj";
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rescalationKey] = "initObj";
                            } else if (rfieldKey === 'ReminderEscalationToPWMetadata') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 20;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rescalationKey;

                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rescalationKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "string",
                                    "enum": [null, "Role", "CategoryAttr"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "select",
                                    "placeholder": lang.rulesFieldPlaceholder,
                                    "order": 21,
                                    "removeDefaultNone": true,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "dependencies": {},
                                    "optionLabels": [lang.rulesFieldPlaceholder, lang.roleLabel, lang.categoryAttrLabel]
                                };

                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rescalationKey] = "pWorkspace";
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rescalationKey] = "pWorkspace";
                            } else if (rfieldKey === 'ReminderEscalationToPWRole') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 22;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rescalationMetadata;

                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rescalationMetadata,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 23,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("role", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rescalationMetadata] = "Role";
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rescalationMetadata] = "Role";
                            }
                            else if (rfieldKey === 'ReminderEscalationToPWCategoryAttr') {
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].default = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].label = ReminderAttributes[l].name;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].order = 22;
                                schema.properties['actions_Data'].items.properties["actionattrname" + rfieldKey].dependencies = rescalationMetadata;

                                schema.properties['actions_Data'].items.properties["value" + rfieldKey] = {
                                    "dependencies": rescalationMetadata,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey] = {
                                    "type": "text",
                                    "order": 23,
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "value" + rfieldKey,
                                    "validator": function(callback) {
                                        var value = this.getValue();
                                        if( value.length > 0 ) {
                                            that.validateValue("category", value).done(function(response) {
                                                if ( !!response.results && !response.results.ok ) {
                                                    callback({
                                                        "status": false,
                                                        "message": response.results.errMsg
                                                    });
                                                    that.trigger("field:invalid");
                                                } else {
                                                    callback({
                                                        "status": true
                                                    });
                                                }
                                            })
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].dependencies[rescalationMetadata] = "CategoryAttr";
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].dependencies[rescalationMetadata] = "CategoryAttr";
                            }
                            if(rfieldKey === 'ReminderEscalationTo'){
                                options.fields['actions_Data'].fields.item.fields["value" + rfieldKey].hidden = true;
                                options.fields['actions_Data'].fields.item.fields["actionattrname" + rfieldKey].hidden = true;
                            }
                        }     
                    }
                } else {

                    properties["actionattributes"] = {
                        "type": "object",
                        "properties": {
                            "parametername": {
                                "readonly": true,
                                "required": false,
                                "type": "text",
                                "default": lang.actionAttrParameterNameLabel
                            },
                            "sourcelabel": {
                                "readonly": true,
                                "required": false,
                                "type": "text",
                                "default": lang.actionAttrSourceLabel
                            },
                            "valuelabel": {
                                "readonly": true,
                                "required": false,
                                "type": "text",
                                "default": lang.actionAttrValueLabel
                            }
                        }
                    };

                    fields["actionattributes"] = {
                        "type": "object",
                        "fields": {
                            "parametername": {
                                "type": "text",
                                "label": lang.actionAttrParameterNameLabel,
                                "readonly": true
                            },
                            "sourcelabel": {
                                "type": "text",
                                "label": lang.actionAttrSourceLabel,
                                "readonly": true
                            },
                            "valuelabel": {
                                "type": "text",
                                "label": lang.actionAttrValueLabel,
                                "readonly": true
                            }
                        }
                    };
                    actionProperties = schema.properties['actions_Data'].items.properties[key + "_fields"].properties["actionattributes"].properties;
                    actionFields = options.fields['actions_Data'].fields.item.fields[key + "_fields"].fields["actionattributes"].fields;
                    if (eacDefaultPlans.models[k].get('actions_attributes').length > 0 && (eacDefaultPlans.models[k].get("action_key") !== "ReminderEventAction.Add A Reminder" ||
                        (eacDefaultPlans.models[k].get("action_key") === "ReminderEventAction.Add A Reminder" && formModel))) {
                        var actionAttributes = eacDefaultPlans.models[k].get('actions_attributes');
                        if ( key === "DocGenEventAction.Generate Document" ) {
                          actionAttributes = this.orderActionAttributes(key, actionAttributes);
                        }

                        for (var i = 0; i < actionAttributes.length; i++) {
                            var requiredField = actionAttributes[i].required,
                                fieldKey = actionAttributes[i].key,
                                sourceKey = "source" + fieldKey,
                                fieldTypeDetails = this.getFieldTypeForAttr(key, fieldKey);

                            actionProperties['key' + i] = {
                                "required": false,
                                "type": "text",
                                "hidden": true,
                                "label": lang.actionAttrParameterNameLabel,
                                "default": fieldKey
                            };
                            actionFields["key" + i] = {
                                "type": "text",
                                "label": lang.actionAttrParameterNameLabel,
                                "hidden": true
                            };
                            schema.properties['actions_Data'].items.properties["actionattrname" + fieldKey] = {
                                "helper": eacDefaultPlans.models[k].attributes.actions_attributes[i].name,
                                "label": lang.actionAttrParameterLabel,
                                "required": eacDefaultPlans.models[k].attributes.actions_attributes[i].required,
                                "type": "text",
                                "default": eacDefaultPlans.models[k].attributes.actions_attributes[i].name,
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + fieldKey] = {
                                "type": "text",
                                "label": eacDefaultPlans.models[k].attributes.actions_attributes[i].name,
                                "dependencies": key + "_fields"
                            };
                            if (fieldTypeDetails.fieldType === "default") {

                                schema.properties['actions_Data'].items.properties["source" + fieldKey] = {
                                    "type": "string",
                                    "enum": ["csObj", "evtProp", "prevAct"],
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["source" + fieldKey] = {
                                    "type": "select",
                                    "fieldClass": "source" + fieldKey,
                                    "label": lang.sourceLabel,
                                    "optionLabels": [lang.csObjLabel, lang.evtPropLabel, lang.prevActLabel],
                                    "onFieldChange": function(event) {       
                                        that.trigger('update:field',event);   
                                    },
                                    "dependencies": [key + "_fields"]
                                };
    
                                schema.properties['actions_Data'].items.properties["csObj_field" + fieldKey] = {
                                    "dependencies": sourceKey,
                                    "type": "string",
                                };
                                schema.properties['actions_Data'].items.properties["evtProp_field" + fieldKey] = {
                                    "dependencies": sourceKey,
                                    "type": "string",
                                    "enum": planProperties
                                };
                                schema.properties['actions_Data'].items.properties["prevAct_field" + fieldKey] = {
                                    "dependencies": sourceKey,
                                    "type": "string",
                                };
                                options.fields['actions_Data'].fields.item.fields["csObj_field" + fieldKey] = {
                                    "type": "otcs_node_picker",
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "csObj_field" + fieldKey,
                                    "type_control": {
                                        "parameters": {
                                            "startLocations": [
                                                "csui/dialogs/node.picker/start.locations/current.location",
                                                "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                                "csui/dialogs/node.picker/start.locations/personal.volume",
                                                "csui/dialogs/node.picker/start.locations/favorites",
                                                "csui/dialogs/node.picker/start.locations/recent.containers",
                                                "csui/dialogs/node.picker/start.locations/category.volume",
                                                "csui/dialogs/node.picker/start.locations/perspective.assets.volume",
                                                "recman/dialogs/node.picker/start.locations/classifications.volume", "xecmpf/dialogs/node.picker/start.locations/extended.ecm.volume.container"
                                            ]
                                        }
                                    },
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["evtProp_field" + fieldKey] = {
                                    "type": "select",
                                    "label": lang.actionAttrValueLabel,
                                    "fieldClass": "evtProp_field" + fieldKey,
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["prevAct_field" + fieldKey] = {
                                    "fieldClass": "prevAct_field" + fieldKey,
                                    "label": lang.actionAttrValueLabel,
                                    "type": "text",
                                    "dependencies": {}
                                };
                                options.fields['actions_Data'].fields.item.fields["csObj_field" + fieldKey].dependencies[sourceKey] = "csObj";
                                options.fields['actions_Data'].fields.item.fields["evtProp_field" + fieldKey].dependencies[sourceKey] = "evtProp";
                                options.fields['actions_Data'].fields.item.fields["prevAct_field" + fieldKey].dependencies[sourceKey] = "prevAct";
                                if ( key === "DocGenEventAction.Generate Document" ) {
                                    schema.properties['actions_Data'].items.properties["source" + fieldKey].required = eacDefaultPlans.models[k].attributes.actions_attributes[i].required;
                                }
                            } else {
                                schema.properties['actions_Data'].items.properties["value" + fieldKey] = {
                                    "type": fieldTypeDetails.fieldType,
                                    "dependencies": [key + "_fields"]
                                };
                                options.fields['actions_Data'].fields.item.fields["value" + fieldKey] = {
                                    "type": fieldTypeDetails.fieldType,
                                    "fieldClass": "value" + fieldKey,
                                    "label": lang.actionAttrValueLabel,
                                    "onFieldChange": function(event) {       
                                        that.trigger('update:field',event);   
                                    },
                                    "dependencies": [key + "_fields"]
                                };
                                if (fieldTypeDetails.fieldType === "select") {
                                  _.extend(schema.properties['actions_Data'].items.properties["value" + fieldKey], fieldTypeDetails.schema);
                                  _.extend(options.fields['actions_Data'].fields.item.fields["value" + fieldKey], fieldTypeDetails.options);
                                }
                            }
                            
                        }
                    }
                }

            }
            attributes.schema.properties["actions_Data"].items.properties["action"].enum = actionFieldEnum;
            attributes.options.fields['actions_Data'].fields.item.fields['action'].optionLabels = actionFieldLabels;
            this.set(attributes);
        },
        getFieldTypeForAttr: function (attrKey, attrName) {
            var details = { fieldType: "default" }
            if ( attrKey === "DocGenEventAction.Generate Document" ) {
                if (attrName === "PdContext") {
                    details.fieldType = "select";
                    details.schema = {
                      enum: ["User", "Candidate","JobApplication"]
                    };
                    details.options = {
                      optionLabels: ["User", "Candidate","Job Application"]
                    };
                } 
            }
            return details;
        },
        orderActionAttributes: function (attrKey, actionAttributes) {
          var attributesOrder = ["DocumentType", "UserId", "PdContext", "EffectiveDate", "BoType_CreateDoc", "BoKey_CreateDoc"];
          if ( attrKey === "DocGenEventAction.Generate Document" ) {
              return actionAttributes.sort(function(attr1, attr2) {
                return attributesOrder.indexOf(attr1.key) - attributesOrder.indexOf(attr2.key);
              });
          }
          return actionAttributes;
        },      

        getFormData: function (collection, eacDefaultPlans) {
            var formData = [],
              actionAttrMappings,
              clientId = null;
            if (collection.models && collection.models.length > 0) {
                formData = collection.models.map(function (modelObj, index) {
                    var actionKey = modelObj.get("action_key"),
                        dependsOn = modelObj.get("depends_on");
                        if (dependsOn === 1) {
                            dependsOn = true;
                        } else {
                            dependsOn = false;
                        }
                    var modelObjItem = {
                            action: actionKey,
                            valueDependsOn: dependsOn
                        };
                    if ( actionKey === "CreateOrUpdateCentralWorkspace.Create Or Update Central Workspace" ) {
                      actionAttrMappings = CentralWorkspace.validateCentralWorkspaceActionAttributes (modelObj.get('attribute_mappings'));
                      modelObj.set('attribute_mappings', actionAttrMappings);
                    }

                    eacDefaultPlans.models.forEach(function (eacDefaultPlanModel) {
                        var keyName = eacDefaultPlanModel.get('action_key') + '_fields';
                        var obj = {};
                        var objAttach = {};
                        modelObjItem[keyName] = {
                            'actionattributes': {
                                'parametername': lang.actionAttrParameterNameLabel,
                                'sourcelabel': lang.actionAttrSourceLabel,
                                'valuelabel': lang.actionAttrValueLabel
                            }
                        };
                        eacDefaultPlanModel.get("actions_attributes").filter(function (actionAttr) {
                            modelObjItem[keyName][actionAttr.key] = {
                                'actionattrname': '',
                                'source': '',
                                'value': '',
                                'csObj_field': '',
                                'evtProp_field': '',
                                'prevAct_field': ''
                            }
                            if (actionAttr.key === 'WorkflowAttribute') {
                                modelObjItem['value' + actionAttr.key] = [];
                                obj["Attribute"] = "";
                            } else if (actionAttr.key === 'WorkflowAttributeValueFrom') {
                                obj['actionattrname' + actionAttr.key] = "";
                                obj['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttributeEvtProp') {
                                obj['actionattrname' + actionAttr.key] = "";
                                obj['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttributeCSObject') {
                                obj['actionattrname' + actionAttr.key] = "";
                                obj['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttributeUserInput') {
                                obj['actionattrname' + actionAttr.key] = "";
                                obj['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttributeFromPreviousAction') {
                                obj['actionattrname' + actionAttr.key] = "";
                                obj['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttachmentsValueFrom') {
                                modelObjItem['value' + actionAttr.key] = [];
                                objAttach["Attachments"] = "";
                            } else if (actionAttr.key === 'WorkflowAttachmentsValueFromCSObject') {
                                objAttach['actionattrname' + actionAttr.key] = "";
                                objAttach['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttachmentsValueFromDesktop') {
                                objAttach['actionattrname' + actionAttr.key] = "";
                                objAttach['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttachmentsValueFromAddShortcut') {
                                objAttach['actionattrname' + actionAttr.key] = "";
                                objAttach['value' + actionAttr.key] = "";
                            } else if (actionAttr.key === 'WorkflowAttachmentsFromPreviousAction') {
                                objAttach['actionattrname' + actionAttr.key] = "";
                                objAttach['value' + actionAttr.key] = "";
                            } else {
                                modelObjItem['actionattrname' + actionAttr.key] = '';
                                modelObjItem['source' + actionAttr.key] = '';
                                modelObjItem['csObj_field' + actionAttr.key] = '';
                                modelObjItem['evtProp_field' + actionAttr.key] = '';
                                modelObjItem['prevAct_field' + actionAttr.key] = '';
                                modelObjItem['value' + actionAttr.key] = '';
                            }
                        });
                        if (modelObjItem['valueWorkflowAttribute']) {
                            modelObjItem['valueWorkflowAttribute'].push(obj);
                        }
                        if (modelObjItem['valueWorkflowAttachmentsValueFrom']) {
                            modelObjItem['valueWorkflowAttachmentsValueFrom'].push(objAttach);
                        }
                        if (eacDefaultPlanModel.get('action_key') === actionKey) {
                            var i, j, attributeDetails;
                            modelObj.get('attribute_mappings').forEach(function (attribute) {

                                var attributeInfo = eacDefaultPlanModel.get("actions_attributes").filter(function (actionAttr) {
                                    return (actionAttr.key === attribute.mappingAttributeName);
                                }),
                                    source = '',
                                    value = '',
                                    propVal = '',
                                    csObj_propVal = '',
                                    evtProp_propVal = '';

                                if (attribute.hasOwnProperty('WorkflowAttributes')) {
                                    if (modelObjItem['valueWorkflowAttribute']) {
                                        modelObjItem['valueWorkflowAttribute'].pop();
                                    }
                                    for (i = 0; i < attribute.WorkflowAttributes.length; i++) {
                                        var objAttr = {};
                                        for (j = 0; j < attribute.WorkflowAttributes[i].length; j++) {
                                            attributeDetails = eacDefaultPlanModel.get("actions_attributes").filter(function (actionAttr) {
                                                return (actionAttr.key === attribute.WorkflowAttributes[i][j].mappingAttributeName);
                                            });
                                            if (attribute.WorkflowAttributes[i][j].mappingAttributeName === 'WorkflowAttribute') {
                                                objAttr["Attribute"] = attribute.WorkflowAttributes[i][j].mappingData;
                                            } else if (attributeDetails.length) {
                                                objAttr["actionattrname" + attributeDetails[0].key] = attributeDetails[0].name;
                                                objAttr["value" + attributeDetails[0].key] = attribute.WorkflowAttributes[i][j].mappingData;
                                            } else {
                                                objAttr["actionattrname" + attribute.WorkflowAttributes[i][j].mappingAttributeName] = attribute.WorkflowAttributes[i][j].mappingMethod;
                                                objAttr["value" + attribute.WorkflowAttributes[i][j].mappingAttributeName] = attribute.WorkflowAttributes[i][j].mappingData;
                                            }
                                        }
                                        modelObjItem['valueWorkflowAttribute'].push(objAttr);
                                    }
                                } else if (attribute.hasOwnProperty('WorkflowAttachments')) {
                                    if (modelObjItem['valueWorkflowAttachmentsValueFrom']) {
                                        modelObjItem['valueWorkflowAttachmentsValueFrom'].pop();
                                    }
                                    for (i = 0; i < attribute.WorkflowAttachments.length; i++) {
                                        var attachmentObj = {};
                                        for (j = 0; j < attribute.WorkflowAttachments[i].length; j++) {
                                            attributeDetails = eacDefaultPlanModel.get("actions_attributes").filter(function (actionAttr) {
                                                return (actionAttr.key === attribute.WorkflowAttachments[i][j].mappingAttributeName);
                                            });
                                            if (attribute.WorkflowAttachments[i][j].mappingAttributeName === 'WorkflowAttachmentsValueFrom') {
                                                attachmentObj["Attachments"] = attribute.WorkflowAttachments[i][j].mappingData;
                                            } else if (attributeDetails.length) {
                                                attachmentObj["actionattrname" + attributeDetails[0].key] = attributeDetails[0].name;
                                                attachmentObj["value" + attributeDetails[0].key] = attribute.WorkflowAttachments[i][j].mappingData;
                                            } else {
                                                attachmentObj["actionattrname" + attribute.WorkflowAttachments[i][j].mappingAttributeName] = attribute.WorkflowAttachments[i][j].mappingMethod;
                                                attachmentObj["value" + attribute.WorkflowAttachments[i][j].mappingAttributeName] = attribute.WorkflowAttachments[i][j].mappingData;
                                            }
                                        }
                                        modelObjItem['valueWorkflowAttachmentsValueFrom'].push(attachmentObj);
                                    }
                                } else {
                                    attributeInfo = attributeInfo.length > 0 ? attributeInfo[0] : attributeInfo;
                                    source = attribute.mappingMethod;
                                    propVal = attribute.mappingData;

                                    if (source === 'Content Server Object') {
                                        source = "csObj";
                                        csObj_propVal = propVal;
                                    } else if (source === 'Event Property') {
                                        source = "evtProp";
                                        evtProp_propVal = propVal;
                                    } else if (source === 'Result from previous Action') {
                                        source = "prevAct";
                                    } else if (source === 'NA') {
                                        value = (attributeInfo.key === "WorkflowUser" || attributeInfo.key === "Reminder_client" || attributeInfo.key === "Reminder_type") ? parseInt(propVal) : propVal;
                                    }
                                    modelObjItem[actionKey + '_fields'][attribute.mappingAttributeName] = {
                                        "actionattrname": attributeInfo.name,
                                        "source": source,
                                        "value": value,
                                        "csObj_field": csObj_propVal,
                                        "evtProp_field": evtProp_propVal,
                                        "prevAct_field": "Result from previous action"
                                    };
                                    if (attributeInfo.key === "ReminderDueDateCompleteIn") {
                                        modelObjItem["actionattrname" + attributeInfo.key] = attributeInfo.name;
                                        modelObjItem["value1" + attributeInfo.key] = value.split(',')[0];
                                        modelObjItem["value2" + attributeInfo.key] = value.split(',')[1];
                                    } else if (attributeInfo.key === "Reminder_type") {
                                        modelObjItem["actionattrname" + attributeInfo.key] = attributeInfo.name;
                                        modelObjItem["value" + attributeInfo.key + modelObjItem["valueReminder_client"]] = value;
                                    }
                                    else {
                                        modelObjItem["actionattrname" + attributeInfo.key] = attributeInfo.name;
                                        modelObjItem["source" + attributeInfo.key] = source;
                                        modelObjItem["csObj_field" + attributeInfo.key] = csObj_propVal;
                                        modelObjItem["evtProp_field" + attributeInfo.key] = evtProp_propVal;
                                        modelObjItem["prevAct_field" + attributeInfo.key] = "Result from previous action";
                                        modelObjItem["value" + attributeInfo.key] = value;
                                    }
                                    modelObjItem[actionKey + '_fields']["actionattributes"]["key" + (attribute.position - 1)] = attributeInfo.key
                                }
                            });
                        }
                    });
                    return modelObjItem;
                });
            } else {
                var emptyModel = {
                    action: '',
                    valueDependsOn: ''
                };
                eacDefaultPlans.models.forEach(function (eacPlan) {
                    var keyName = eacPlan.get('action_key') + '_fields';
                    var obj = { Attribute: "" };
                    var objAttach = { Attachments: "" };
                    emptyModel[keyName] = {
                        'actionattributes': {
                            'parametername': lang.actionAttrParameterNameLabel,
                            'sourcelabel': lang.actionAttrSourceLabel,
                            'valuelabel': lang.actionAttrValueLabel
                        }
                    };
                    eacPlan.get("actions_attributes").filter(function (actionAttr) {
                        emptyModel[keyName][actionAttr.key] = {
                            'actionattrname': '',
                            'source': '',
                            'value': '',
                            'csObj_field': '',
                            'evtProp_field': '',
                            'prevAct_field': ''
                        }
                        emptyModel['actionattrname' + actionAttr.key] = '';
                        emptyModel['source' + actionAttr.key] = '';
                        emptyModel['csObj_field' + actionAttr.key] = '';
                        emptyModel['evtProp_field' + actionAttr.key] = '';
                        emptyModel['prevAct_field' + actionAttr.key] = '';
                        if (actionAttr.key === 'WorkflowAttribute') {
                            emptyModel['value' + actionAttr.key] = [];

                        } else if (actionAttr.key === 'WorkflowAttributeValueFrom') {
                            obj['actionattrname' + actionAttr.key] = "";
                            obj['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttributeEvtProp') {
                            obj['actionattrname' + actionAttr.key] = "";
                            obj['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttributeCSObject') {
                            obj['actionattrname' + actionAttr.key] = "";
                            obj['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttributeUserInput') {
                            obj['actionattrname' + actionAttr.key] = "";
                            obj['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttributeFromPreviousAction') {
                            obj['actionattrname' + actionAttr.key] = "";
                            obj['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttachmentsValueFrom') {
                            emptyModel['value' + actionAttr.key] = [];
                        } else if (actionAttr.key === 'WorkflowAttachmentsValueFromCSObject') {
                            objAttach['actionattrname' + actionAttr.key] = "";
                            objAttach['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttachmentsValueFromDesktop') {
                            objAttach['actionattrname' + actionAttr.key] = "";
                            objAttach['value' + actionAttr.key] = "";
                        } else if (actionAttr.key === 'WorkflowAttachmentsValueFromAddShortcut') {
                            objAttach['actionattrname' + actionAttr.key] = "";
                            objAttach['value' + actionAttr.key] = "";
                        } else {
                            emptyModel['actionattrname' + actionAttr.key] = '';
                            emptyModel['value' + actionAttr.key] = '';
                        }
                    });
                    if (emptyModel['valueWorkflowAttribute']) {
                        emptyModel['valueWorkflowAttribute'].push(obj);
                    }
                    if (emptyModel['valueWorkflowAttachmentsValueFrom']) {
                        emptyModel['valueWorkflowAttachmentsValueFrom'].push(objAttach);
                    }
                });
                formData.push(emptyModel);
            }
            return {
                actions_Data: formData
            };
        },        
        getPlaceholder: function(value, collection){
            if (!collection.includes(value)) {
                collection.splice(0, 0, value);
            }
         },

        validateValue: function(type, value) {
            var deferred        = $.Deferred(),
            connector       = this.formModel.connector,
            url             = connector.getConnectionUrl().getApiBase('v2')+ '/eventactioncenter/validateformfields?field_type=' + type + '&field_value=' + value;

            $.ajax(connector.extendAjaxOptions({
                url: url,
                type: "GET",
                contentType: false,
                crossDomain: true,
                processData: false,
                success: function (response, status, jXHR) {
                  deferred.resolve(response);
                },
                error: function (xhr, status, text) {
                  var error = new base.RequestErrorMessage(xhr);
                  deferred.reject(xhr, status, error.toString());
                }
            }));

            return deferred.promise();   
        },

        updateAttributeValues: function (attributes, hasValue, id, ele) {
            var i, promises, schema = attributes.schema, options = attributes.options, $el = ele,
                that = this, rawWhen = $.when, deferred = $.Deferred();
            $.whenAll = function (promise) {
                if ($.isArray(promise)) {
                    var dfd = $.Deferred();
                    rawWhen.apply($, promise).done(function () {
                        dfd.resolve(Array.prototype.slice.call(arguments));
                    }).fail(function () {
                        dfd.reject(Array.prototype.slice.call(arguments));
                    });
                    return dfd.promise();
                }
                else {
                    return rawWhen.apply($, arguments);
                }
            };
            promises = attributes.data.actions_Data.map(function (actions_Data) {
                if (actions_Data.valueWorkflow && hasValue) {
                    that.attrModel.set('workflow_id', actions_Data.valueWorkflow);
                    return that.attrModel.fetch();
                } else if (!(hasValue) && id) {
                    that.attrModel.set('workflow_id', id);
                    return that.attrModel.fetch();
                }
            });
            $.whenAll(promises)
                .then(function (values) {
                    var j;
                    for (j = 0; j < values.length; j++) {
                        if (!!values[j]) {
                            var enumarray = [], labelsarray = [], results;
                            if (values[j].results) {
                                results = values[j].results;
                            } else {
                                results = values[j][0].results;
                            }
                            for (i = 0; i < results.length; i++) {
                                enumarray.push(results.data[i].name);
                                labelsarray.push(results.data[i].name);
                            }
                            schema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.maxItems = results.length;
                            if (enumarray.length) {
                                schema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["Attribute"].enum = enumarray;
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["Attribute"].optionLabels = labelsarray;
                            } else {
                                schema.properties['actions_Data'].items.properties["valueWorkflowAttribute"].items.properties["Attribute"].enum = '';
                                options.fields['actions_Data'].fields.item.fields["valueWorkflowAttribute"].fields.item.fields["Attribute"].optionLabels = '';
                            }
                            that.trigger('update:attributeValue', $el, results);
                            deferred.resolve(true);
                        }
                    }
                });
        },

        updateTypeValues: function(attributes){
            var i, promises, schema = attributes.schema, options = attributes.options,
                that = this, rawWhen = $.when, deferred = $.Deferred();
            $.whenAll = function (promise) {
                if ($.isArray(promise)) {
                    var dfd = $.Deferred();
                    rawWhen.apply($, promise).done(function () {
                        dfd.resolve(Array.prototype.slice.call(arguments));
                    }).fail(function () {
                        dfd.reject(Array.prototype.slice.call(arguments));
                    });
                    return dfd.promise();
                }
                else {
                    return rawWhen.apply($, arguments);
                }
            };

            promises = attributes.data.actions_Data.map(function (actions_Data) {
                if (actions_Data.valueReminder_client) {
                    that.escModel.set('id', actions_Data["valueReminder_type" + actions_Data.valueReminder_client]);
                    that.escModel.set('client_id', actions_Data.valueReminder_client);
                    return that.escModel.fetch();
                }
            });
            $.whenAll(promises)
                .then(function (values) {
                    if (!!values[0]) {
                        var  enumarray, labelsarray, model;
                        for (i = 0; i < values.length; i++) {
                            if (!!values[i]) {
                                model = !!values[i].forms ? values[i].forms[0] : (!!values[i][0] && !!values[i][0].forms ? values[i][0].forms[0] : undefined);
                            }
                            if (model) {
                                enumarray = model.schema.properties.followup_type_name.enum;
                                labelsarray = model.options.fields.followup_type_name.optionLabels;
                                schema.properties['actions_Data'].items.properties["valueReminder_type" + model.data.followup_client_name].enum = '';
                                options.fields['actions_Data'].fields.item.fields["valueReminder_type" + model.data.followup_client_name].optionLabels = '';
                                if (enumarray[0] != null) {
                                    that.getPlaceholder(null, enumarray);
                                    that.getPlaceholder(lang.reminderTypePlaceholder, labelsarray);
                                }
                                schema.properties['actions_Data'].items.properties["valueReminder_type" + model.data.followup_client_name].enum = enumarray;
                                options.fields['actions_Data'].fields.item.fields["valueReminder_type" + model.data.followup_client_name].optionLabels = labelsarray;
                                if (model.data.escalation_alert) {
                                    attributes.data.actions_Data[i].escalation = true;
                                    options.fields.actions_Data.fields.item.fields.actionattrnameReminderEscalationTo.hidden = false;
                                    options.fields.actions_Data.fields.item.fields.valueReminderEscalationTo.hidden = false;

                                }
                            }
                        }
                        deferred.resolve(true);
                    }
                });
        }

    });

    return EACActionsFormModel;

});
