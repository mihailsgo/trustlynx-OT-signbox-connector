/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
      'csui/lib/jquery',
      'csui/lib/underscore',
      'i18n!xecmpf/widgets/eac/impl/nls/lang',
      'csui/utils/deepClone/deepClone'
    ],
    function (module, $, _, lang) {
      var centralWorkspace = {
        buildCentralWorkspaceModel: function ( that,eacDefaultPlans, planProperties, actionProperties, actionFields, properties, fields, schema, options) {
            var key = eacDefaultPlans.get("action_key"),
                centralWorkspaceProperties = planProperties.slice();

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
                var centralWorkspaceAttributes = eacDefaultPlans.get('actions_attributes');
                for (var j = 0; j < centralWorkspaceAttributes.length; j++) {
                    var wfieldKey = centralWorkspaceAttributes[j].key;

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

                    switch( wfieldKey ) {
                        case 'central_workspace_boType':
                            schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                "helper": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "required": eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "text",
                                "default": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                "type": "text",
                                "order": 1,
                                "label": eacDefaultPlans.attributes.actions_attributes[j].name,
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
                                        "startLocations": [
                                            'xecmpf/dialogs/node.picker/start.locations/businessobjecttypes.container'
                                        ]
                                    }
                                },
                                "fieldClass": "value" + wfieldKey,
                                "dependencies": [key + "_fields"]
                            };
                            break;
                        case 'central_workspace_userId':
                            schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                "helper": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "required": eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "text",
                                "default": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                "type": "text",
                                "order": 3,
                                "label": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": {}
                            };
                            schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                "label": lang.actionAttrValueLabel,
                                "enum": centralWorkspaceProperties,
                                "type": "string",
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                "hidden": false,
                                "order": 4,
                                "type": "select",
                                "removeDefaultNone": false,
                                "label": lang.actionAttrValueLabel,
                                "fieldClass": "value" + wfieldKey,
                                "placeholder": lang.rulesFieldPlaceholder,
                                "dependencies": {}
                            };
                            break;
                        case 'central_workspace_templateId':
                            schema.properties['actions_Data'].items.properties["actionattrname" + wfieldKey] = {
                                "helper": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "required": eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "text",
                                "default": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["actionattrname" + wfieldKey] = {
                                "type": "text",
                                "order": 5,
                                "label": eacDefaultPlans.attributes.actions_attributes[j].name,
                                "dependencies": {}
                            };
                            schema.properties['actions_Data'].items.properties["value" + wfieldKey] = {
                                "label": lang.actionAttrValueLabel,
                                "required":  eacDefaultPlans.attributes.actions_attributes[j].required,
                                "type": "integer",
                                "dependencies": key + "_fields"
                            };
                            options.fields['actions_Data'].fields.item.fields["value" + wfieldKey] = {
                                "hidden": false,
                                "order": 6,
                                "type": "integer",
                                "hideInitValidationError": true,
                                "label": lang.actionAttrValueLabel,
                                "fieldClass": "value" + wfieldKey,
                                "placeholder": lang.centralWorkspaceTemplateIdPlaceholder,
                                "dependencies": {}
                            };
                            break;
                        case 'central_workspace_synchronize_permissions':
                            this.createCheckbox( eacDefaultPlans.attributes.actions_attributes[j], schema, options, wfieldKey, key, 7, true);
                            break;
                        case 'central_workspace_synchronize_candidates':
                            this.createCheckbox( eacDefaultPlans.attributes.actions_attributes[j], schema, options, wfieldKey, key, 9, true);
                            break;
                        case 'central_workspace_update_candidates':
                            this.createCheckbox( eacDefaultPlans.attributes.actions_attributes[j], schema, options, wfieldKey, key, 11, false);
                            break;
                        case 'central_workspace_remove_candidate_reference':
                            this.createCheckbox( eacDefaultPlans.attributes.actions_attributes[j], schema, options, wfieldKey, key, 13, false);
                            break;
                        case 'central_workspace_synchronize_assignments':
                            this.createCheckbox( eacDefaultPlans.attributes.actions_attributes[j], schema, options, wfieldKey, key, 15, true);
                            break;
                    }
                }
            } 
        },
        createCheckbox: function( actions_attributes, schema, options, attribute_key, action_key, order, defaltValue ) {
            schema.properties['actions_Data'].items.properties["actionattrname" + attribute_key] = {
                "helper": actions_attributes.name,
                "required": actions_attributes.required,
                "type": "text",
                "default": actions_attributes.name,
                "dependencies": action_key + "_fields"
            };
            options.fields['actions_Data'].fields.item.fields["actionattrname" + attribute_key] = {
                "type": "text",
                "order": order,
                "label": actions_attributes.name,
                "dependencies": action_key + "_fields"
            };
            schema.properties['actions_Data'].items.properties["value" + attribute_key] = {
                "readonly": false,
                "required": false,
                "title": "Enabled",
                "type": "checkbox",
                "default": defaltValue,
                "dependencies": [action_key + "_fields"]
            };
            options.fields['actions_Data'].fields.item.fields["value" + attribute_key] = {
                "hidden": false,
                "order": order + 1,
                "hideInitValidationError": true,
                "label": "Enabled",
                "value": true,
                "readonly": false,
                "type": "checkbox",
                "dependencies": [action_key + "_fields"]
            };
        },
        transformToBooleanValue: function (val) {
          var result = !!val;
          if ( typeof val === "string" ) {
            result = ( val.toLowerCase() === "true" );
          }
          return result;
        },
        validateCentralWorkspaceActionAttributes: function ( actionAttributes ) {
          var actionAttr = _.deepClone(actionAttributes),
              propsList = ["central_workspace_remove_candidate_reference", "central_workspace_synchronize_assignments", "central_workspace_synchronize_candidates", "central_workspace_synchronize_permissions", "central_workspace_update_candidates"],
              that = this;
          
          propsList.forEach(function(prop) {
            var filteredList = actionAttr.filter( function(attr) {
              if ( attr.mappingAttributeName === prop ) {
                return true;
              }
            });
            if ( filteredList.length > 0 ) {
              filteredList[0].mappingData = that.transformToBooleanValue(filteredList[0].mappingData);
            } else {
              actionAttr.push({
                mappingAttributeName: prop,
                mappingMethod: "NA",
                mappingData: false,
                position: actionAttr.length + 1
              });
            }
          });
          return actionAttr;
        }
      }

      return centralWorkspace;
    });
