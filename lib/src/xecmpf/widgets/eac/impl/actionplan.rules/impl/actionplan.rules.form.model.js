/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict'

define(['csui/lib/jquery', "csui/utils/base", 'csui/lib/underscore', 'csui/models/form',
    'xecmpf/models/eac/eac.planproperties.factory',
    'i18n!xecmpf/widgets/eac/impl/nls/lang'
], function ($, base, _, FormModel, EACPlanPropertiesFactory, lang) {
    var EACRulesFormModel = FormModel.extend({

        constructor: function EACRulesFormModel(attributes, options) {
            this.options = options || (options = {});
            attributes || (attributes = {
                data: {},
                schema: { properties: {} },
                options: { fields: {} }
            });
            FormModel.prototype.constructor.call(this, attributes, options);
        },
        initialize: function (attributes, options) {
            var event_definition_id = options.eventModel.get('id') ? options.eventModel.get('parent_id') : options.eventModel.get('event_def_id');
            var eacPlanProperties = options.context.getCollection(EACPlanPropertiesFactory, {
                eventModel: options.eventModel,
                attributes: {
                    event_definition_id: event_definition_id
                }
            });
            this.eacPropertiesCollection = eacPlanProperties;
            if (!!eacPlanProperties && !eacPlanProperties.type) {
                this.listenToOnce(eacPlanProperties, 'sync', function () {
                    eacPlanProperties.planProperties = eacPlanProperties.map(function (model) {
                        return model.get('name');
                    });
                    eacPlanProperties.type = eacPlanProperties.map(function (model) {
                        return model.get('alpacaFieldType').toLowerCase();
                    });
                    this._setAttributes(eacPlanProperties, eacPlanProperties.planProperties, eacPlanProperties.type);
                });
                eacPlanProperties.fetch();
            } else {
                this._setAttributes(eacPlanProperties, eacPlanProperties.planProperties, eacPlanProperties.type);
            }
        },
        _setAttributes: function (eacPlanProperties, planProperties, type) {
            var formData = [];
            var modelData = {};
            var attributes, exe, propType;
            if (this.options.collection) {
                formData = this.options.collection.models.map(function (modelObj, index) {
                    exe = modelObj.get('operand');
                    propType = !!exe && eacPlanProperties.findWhere({ name: exe }).get('type');
                    modelData = {
                        from: modelObj.get('operand'),
                        operator: lang.rulesFieldPlaceholder,
                        conjunction: modelObj.get('conjunction'),
                        value: ''
                    }
                    if (!!exe) {
                        modelData["operator" + exe] = modelObj.get('operator');
                        modelData["value" + exe] = modelObj.get('to');
                        if( propType === "Classification" ) {
                            switch (modelObj.get('to')) {
                                case "0":
                                    modelData["value" + exe] = "Unclassified";
                                    break;
                                case "1":
                                    modelData["value" + exe] = "Any";
                                    break;
                                default:    
                                    modelData["value" + exe] = "Custom";
                                    modelData["to2" + exe] = modelObj.get('to');
                                    break;
                            }  
                        }
                        if (exe === "Category Attribute" && modelObj.get('categoryDetails')) {
                            var categoryDetails = modelObj.get('categoryDetails');
                            modelData["categorDetails"] = categoryDetails;
                            switch (categoryDetails.typeName) {
                                case "Date":
                                    modelData["to2" + exe + "date"] = categoryDetails.expValue;
                                    break;
                                case "Integer":
                                    modelData["to2" + exe + "integer"] = categoryDetails.expValue;

                                    break;
                                case "User":
                                    modelData["to2" + exe + "otcs_user_picker"] = categoryDetails.expValue;

                                    break;
                                case "StringField":
                                    modelData["to2" + exe] = categoryDetails.expValue;

                                    break;
                                case "StringPopup":
                                    modelData["to2" + exe] = categoryDetails.expValue;

                                    break;
                                case "IntegerPopup":
                                    modelData["to2" + exe] = categoryDetails.expValue;
                                    break;
                                case "Boolean":
                                    modelData["to2" + exe + "checkbox"] = (categoryDetails.expValue === 'true') ? true : false;
                                    break;
                            }
                        }
                    }
                    for (var i = 0; i < planProperties.length; i++) {
                        if (!modelData["operator" + planProperties[i]]) {
                            modelData["operator" + planProperties[i]] = '';
                            modelData["value" + planProperties[i]] = '';
                        }
                    }
                    return modelData;
                });
            }
            attributes = {
                "options": {
                    "fields": {
                        "rulesSet": {
                            "fields": {
                                "item": {
                                    "fields": {
                                        "conjunction": {
                                            "hidden": false,
                                            "hideInitValidationError": true,
                                            "optionLabels": [lang.conjunctionAndLabel, lang.conjunctionOrLabel],
                                            "label": lang.conjunctionFieldLabel,
                                            "readonly": false,
                                            "type": "select",
                                            "removeDefaultNone": true
                                        },
                                        "from": {
                                            "hidden": false,
                                            "hideInitValidationError": true,
                                            "label": lang.fromFieldLabel,
                                            "readonly": false,
                                            "type": "select"

                                        },
                                        "operator": {
                                            "hidden": false,
                                            "hideInitValidationError": true,
                                            "optionLabels": [lang.rulesFieldPlaceholder, lang.operatorEqualtoLabel, lang.operatorNotequaltoLabel],
                                            "label": lang.operatorFieldLabel,
                                            "readonly": false,
                                            "type": "select",
                                            "dependencies": { "from": "" },
                                            "disabled": true,
                                            "removeDefaultNone": true

                                        },
                                        "value": {
                                            "hidden": false,
                                            "hideInitValidationError": true,
                                            "label": lang.toFieldLabel,
                                            "readonly": false,
                                            "type": "text",
                                            "dependencies": { "from": "" },
                                            "disabled": true,
                                            "placeholder": lang.rulesFieldPlaceholder
                                        }
                                    },
                                    "type": "object"
                                }
                            },
                            "hidden": false,
                            "hideInitValidationError": true,
                            "items": {
                                "showMoveDownItemButton": false,
                                "showMoveUpItemButton": false
                            },
                            "label": "",
                            "toolbarSticky": true,
                            "showMessages": false,
                            "isSetType": true
                        }
                    }
                },
                "schema": {
                    "properties": {
                        "rulesSet": {
                            "items": {
                                "defaultItems": 1,
                                "maxItems": 50,
                                "minItems": 1,
                                "properties": {
                                    "conjunction": {
                                        "enum": ['and', 'or'],
                                        "readonly": false,
                                        "title": lang.conjunctionFieldLabel,
                                        "type": "string"
                                    },
                                    "from": {
                                        "enum": planProperties,
                                        "readonly": false,
                                        "title": lang.fromFieldLabel,
                                        "type": "string"
                                    },
                                    "operator": {
                                        "enum": ['Select value','equal to', 'not equal to'],
                                        "readonly": false,
                                        "title": lang.operatorFieldLabel,
                                        "type": "string",
                                        "dependencies": "from",
                                        "disabled": true
                                    },
                                    "value": {
                                        "maxLength": 248,
                                        "minLength": 1,
                                        "readonly": false,
                                        "title": lang.toFieldLabel,
                                        "type": "string",
                                        "dependencies": "from",
                                        "disabled": true
                                    }
                                },
                                "type": "object"
                            },
                            "title": "",
                            "type": "array"
                        }
                    },
                    "type": "object"
                }
            }
            var actionFieldEnum = [],
                actionFieldLabels = [],
                k, key, planPropertieslength = planProperties.length;
                this.currentTarget=[];
            for ( k = 0; k < planPropertieslength; k++) {
                key = planProperties[k];
                actionFieldEnum.push(key);
                actionFieldLabels.push(key);

                var schema, options, that = this;
                schema = attributes.schema;
    
                schema.properties['rulesSet'].items.properties["operator" + key] = { "enum": {}, "readonly": false, "required": true, "dependencies": "from", "type": "string", "removeDefaultNone": true, "title": lang.operatorFieldLabel, "label": lang.operatorFieldLabel };
                schema.properties['rulesSet'].items.properties["value" + key] = { "dependencies": "from", "type": "string", "title": lang.toFieldLabel, "placeholder": lang.rulesFieldPlaceholder };

                options = attributes.options;
                options.fields['rulesSet'].fields.item.fields["operator" + key] = { "optionLabels": {}, "readonly": false, "type": "select", "required": true, "removeDefaultNone": true, "dependencies": { "from": key }, "label": lang.operatorFieldLabel };
                options.fields['rulesSet'].fields.item.fields["value" + key] = { "dependencies": { "from": key }, "type": "text", "label": lang.toFieldLabel, "placeholder": lang.rulesFieldPlaceholder };
               

                if (!!eacPlanProperties.models[k].get('operators')) {
                    schema.properties['rulesSet'].items.properties["operator" + key].enum = eacPlanProperties.models[k].get('operators');
                    options.fields['rulesSet'].fields.item.fields["operator" + key].optionLabels = eacPlanProperties.models[k].get('operators');
                }
                if (!!eacPlanProperties.models[k].get('key') && ( eacPlanProperties.models[k].get('key') === 'UpdateWorkspaceMetadataEvent.WorkspaceType' ) ) {
                    schema.properties['rulesSet'].items.properties["operator" + key].enum = ["equals", "not equal"];
                    options.fields['rulesSet'].fields.item.fields["operator" + key].optionLabels = [lang.operatorEqualtoLabel, lang.operatorNotequaltoLabel];
                }
                if (eacPlanProperties.models[k].get('values').length > 0) {
                    if (eacPlanProperties.models[k].get('type') === "StringPopup") {
                        schema.properties['rulesSet'].items.properties["value" + key].enum = eacPlanProperties.models[k].get('values');
                        options.fields['rulesSet'].fields.item.fields["value" + key].optionLabels = eacPlanProperties.models[k].get('values');
                        options.fields['rulesSet'].fields.item.fields["value" + key].type = "select";
                    }
                    else {
                        schema.properties['rulesSet'].items.properties["value" + key].enum = eacPlanProperties.models[k].get('values');
                        schema.properties['rulesSet'].items.properties["value" + key].type = "Integer";
                        options.fields['rulesSet'].fields.item.fields["value" + key].optionLabels = eacPlanProperties.models[k].get('values');
                        options.fields['rulesSet'].fields.item.fields["value" + key].type = "select";
                    }
                }
                else {
                    if(!!eacPlanProperties.models[k].get('key') && eacPlanProperties.models[k].get('key') === "UpdateWorkspaceMetadataEvent.CategoryAttribute"){
                        var i = 0, typeArr = ['integer', 'checkbox', 'date', 'otcs_user_picker', 'otcs_node_picker'];
                        schema.properties['rulesSet'].items.properties["to2" + key] = { "dependencies": "valueCategory Attribute", "type": type[k], "required": true };
                        options.fields['rulesSet'].fields.item.fields["to2" + key] = {"hidden":true, "dependencies": {}, "type": type[k], "required": true };
                        options.fields['rulesSet'].fields.item.fields["to2" + key].label = lang.toFieldLabel;
                        options.fields['rulesSet'].fields.item.fields["to2" + key].type = type[k];
                        options.fields['rulesSet'].fields.item.fields["value" + key].validator = function (callback) {
                            var value = this.getValue();
                            if (!that.currentTarget.includes(this)) {
                                that.currentTarget.push(this);
                            }
                            if (value.length > 0 && this.fieldView.preVal !== value) {
                                that.validateValue("category", value).done(function (response) {
                                    if (!!response.results && !response.results.ok) {
                                        callback({
                                            "status": false,
                                            "message": response.results.errMsg
                                        });
                                        that.value = response.links.data.self.href;
                                        that.trigger("field:invalid");
                                    } else {
                                        callback({
                                            "status": true
                                        });
                                        that.categoryResponse = response.results;
                                        that.value = response.links.data.self.href;
                                        that.trigger("field:valid");
                                    }
                                })
                            }
                        }
                        for (i = 0; i < typeArr.length; i++) {
                            schema.properties['rulesSet'].items.properties["to2" + key + typeArr[i]] = { "required": true, "dependencies": "from", "type": typeArr[i], "title": lang.toFieldLabel, "placeholder": lang.rulesFieldPlaceholder };
                            options.fields['rulesSet'].fields.item.fields["to2" + key + typeArr[i]] = { "dependencies": { "from": key }, "hidden": true, "type": typeArr[i], "label": lang.toFieldLabel, "placeholder": lang.rulesFieldPlaceholder };
                        }
                      }
                    if (type[k] === "otcs_node_picker") {
                        if (eacPlanProperties.models[k].get('type') === "Classification") {
                            schema.properties['rulesSet'].items.properties["value" + key].enum = ["Unclassified", "Any", "Custom"];
                            schema.properties['rulesSet'].items.properties["value" + key].type = "select"; 
                            schema.properties['rulesSet'].items.properties["value" + key].required = true;
                            options.fields['rulesSet'].fields.item.fields["value" + key].optionLabels = [lang.Unclassified, lang.Any, lang.Custom];
                            options.fields['rulesSet'].fields.item.fields["value" + key].type = "select";
                            options.fields['rulesSet'].fields.item.fields["value" + key].removeDefaultNone = true;
                            options.fields['rulesSet'].fields.item.fields["value" + key].required = true;
                            schema.properties['rulesSet'].items.properties["to2" + key] = { "dependencies": "valueDocument Type", "type": type[k], "required": true };
                            options.fields['rulesSet'].fields.item.fields["to2" + key] = { "dependencies": {}, "type": type[k] ,"required": true  };
                            options.fields['rulesSet'].fields.item.fields["to2" + key].label = lang.toFieldLabel;
                            options.fields['rulesSet'].fields.item.fields["to2" + key].dependencies["value" + key] = "Custom";
                            options.fields['rulesSet'].fields.item.fields["to2" + key].type_control = {
                                "parameters": {
                                    startLocations: ["classifications/dialogs/node.picker/start.locations/classifications.volume"],
                                    select_types: [196, 199]
                                }
                            };
                            options.fields['rulesSet'].fields.item.fields["to2" + key].type = type[k];

                        } else if (!!eacPlanProperties.models[k].get('key') && ( eacPlanProperties.models[k].get('key') === "UpdateWorkspaceMetadataEvent.WorkspaceTemplate" ) ) {
                            options.fields['rulesSet'].fields.item.fields["value" + key].type_control = {
                                "parameters": {
                                    startLocations: [
                                        "doctemplates/dialogs/node.picker/start.locations/document.templates.volume"
                                    ],
                                    select_types: [848]
                                }
                            };
                            options.fields['rulesSet'].fields.item.fields["value" + key].type = type[k];
                            schema.properties['rulesSet'].items.properties["value" + key].type = type[k];
                        }
                        else {

                            options.fields['rulesSet'].fields.item.fields["value" + key].type_control = {
                                "parameters": {
                                        startLocations: [
                                            "csui/dialogs/node.picker/start.locations/current.location",
                                            "csui/dialogs/node.picker/start.locations/enterprise.volume",
                                            "csui/dialogs/node.picker/start.locations/personal.volume",
                                            "csui/dialogs/node.picker/start.locations/favorites",
                                            "csui/dialogs/node.picker/start.locations/recent.containers",
                                            "csui/dialogs/node.picker/start.locations/perspective.assets.volume",
                                            "xecmpf/dialogs/node.picker/start.locations/extended.ecm.volume.container"
                                        ]
                                    }
                            };
                            options.fields['rulesSet'].fields.item.fields["value" + key].type = type[k];
                            schema.properties['rulesSet'].items.properties["value" + key].type = type[k]; 
                            
                        }

                    }
                    else {
                        options.fields['rulesSet'].fields.item.fields["value" + key].type = type[k];
                        schema.properties['rulesSet'].items.properties["value" + key].type = type[k];
                    }
                    
                }

            }
            attributes.schema.properties["rulesSet"].items.properties["from"].enum = actionFieldEnum;
            attributes.options.fields['rulesSet'].fields.item.fields['from'].optionLabels = actionFieldLabels;
            attributes.data = { rulesSet: formData };
            this.set(attributes);
        },
        validateValue: function (type, value) {
            var deferred = $.Deferred(),
                connector = this.eacPropertiesCollection.connector,
                url = connector.getConnectionUrl().getApiBase('v2') + '/eventactioncenter/validateformfields?field_type=' + type + '&field_value=' + value + '&is_rule=true';

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
        }
    });

    return EACRulesFormModel;
});
