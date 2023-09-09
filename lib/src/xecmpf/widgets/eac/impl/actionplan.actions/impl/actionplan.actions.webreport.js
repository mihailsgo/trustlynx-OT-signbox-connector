/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
      'csui/lib/jquery',
      'csui/lib/underscore',
      'i18n!xecmpf/widgets/eac/impl/nls/lang'
    ],
    function (module, $, _, lang) {
      var webreport = {
        buildWebreportModel: function (that, eacDefaultPlans, planProperties, actionProperties, actionFields, properties, fields, schema, options) {
            var key = eacDefaultPlans.get("action_key"),
                webreportsProperties = planProperties.slice();
                webreportsProperties.unshift(lang.rulesFieldPlaceholder);

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
            actionProperties = schema.properties['actions_Data'].items.properties[key + "_fields"].properties["actionattributes"].properties;
            actionFields = options.fields['actions_Data'].fields.item.fields[key + "_fields"].fields["actionattributes"].fields;
                if (eacDefaultPlans.get('actions_attributes').length > 0) {
                    var webreportAttributes = eacDefaultPlans.get('actions_attributes');
                    for (var j = 0; j < webreportAttributes.length; j++) {
                        var wfieldKey = webreportAttributes[j].key;

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
                        if (wfieldKey === 'Webreport') {

                            schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                "helper": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "required": eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "text",
                                "default": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                "type": "text",
                                "label": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": key + "_fields"
                            };
                            schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                "type": "otcs_node_picker",
                                "dependencies": [key + "_fields"]
                            };
                            options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                "type": "otcs_node_picker",
                                "label": lang.actionAttrValueLabel,
                                "type_control": {
                                    "parameters": {
                                        "select_types": [
                                            30303
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
                                "fieldClass": "value" + wfieldKey,
                                "dependencies": [key + "_fields"]
                            };

                        } else if (wfieldKey === 'WebreportParameters') {
                            schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                "helper": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "required": eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "text",
                                "default": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                "type": "text",
                                "label": eacDefaultPlans.attributes.actions_attributes[j].name,
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
                                "label": "Enabled",
                                "readonly": false,
                                "type": "checkbox",
                                "dependencies": [key + "_fields"]
                            };
                        } else if (wfieldKey === 'WebreportParametersList') {
                            schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                "helper": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "required": eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "text",
                                "default": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": "valueWebreportParameters"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                "type": "text",
                                "label": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": {}
                            };
                            schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                "dependencies": "valueWebreportParameters",
                                "type": "array",
                                "label": lang.actionAttrValueLabel,
                                "items": {
                                    "defaultItems": 1,
                                    "maxItems": planProperties.length,
                                    "minItems": 1,
                                    "enum": webreportsProperties,
                                    "type": "string",
                                    "default": lang.rulesFieldPlaceholder
                                }
                            };
                            options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                "fields": {
                                    "item": {
                                        "hidden": false,
                                        "type": "select",
                                        "removeDefaultNone": true,
                                        "label": lang.actionAttrValueLabel,
                                        "fieldClass": "value" + wfieldKey,
                                        "placeholder": lang.rulesFieldPlaceholder,
                                        "onFieldChange": function(event) {
											that.trigger('change:parameter',event);
										}
                                    }
                                },
                                "dependencies": {},
                                "validator": function (callback) {
                                    that.trigger('update:parameter', this);
                                }
                            }; 
                            options.fields['actions_Data'].fields.item.fields["value" + wfieldKey].dependencies["valueWebreportParameters"] = true;
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey].dependencies["valueWebreportParameters"] = true;
                        }
                    }
                }
            
        }
      }
      return webreport;
    });
