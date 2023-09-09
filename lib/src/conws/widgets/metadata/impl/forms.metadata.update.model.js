/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone",
  'csui/utils/url', 'csui/utils/base',
  'csui/models/mixins/node.connectable/node.connectable.mixin',
  'i18n!conws/widgets/metadata/impl/nls/metadata.lang'
], function ($, _, Backbone, Url, BaseUtils, NodeConnectableMixin, lang) {

  "use strict";

  function updateData(data, changes) {
    _.each(changes, function (value, propertyId) {
      if (data.hasOwnProperty(propertyId)) {
        data[propertyId] = value;
      }
    });
  }

  function collectValues(config,getprop) {
    var props = [];
    _.each(config, function (configElement) {
      var prop = getprop(configElement);
      if (prop!=null && !_.contains(props, prop)) {
        props.push(prop);
      } else if (configElement.type === "group") {
        var inner = collectValues(configElement.attributes,getprop);
        _.each(inner, function (prop) {
          if (!_.contains(props,prop)) {
            props.push(prop);
          }
        })
      }
    }, this);
    return props;
  }

  var MetadataUpdateFormModel = Backbone.Model.extend({

    constructor: function MetadataUpdateFormModel(attributes, options) {

      this.node = options.node;

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeNodeConnectable(options);

      this.metadataConfig = [];
      if (options.metadataConfig) {
        this.metadataConfig = options.metadataConfig.metadata||[];
        this.hideEmptyFields = options.metadataConfig.hideEmptyFields || false;
        this.isReadOnly = options.metadataConfig.readonly ? true : false;
      }

      this.form_models = [];

      this.categoryIds = collectValues(this.metadataConfig,function(el){
        if (el.type === "attribute" || el.type === "category") {
          return el.categoryId
        }
      });
      this.workspaceTypeIds = collectValues(this.metadataConfig,function(el){
        if (el.type === "relation") {
          return el.workspaceTypeId
        }
      });
    },

    url: function () {

      var nodeId = this.node.get('id'),
        url = this.connector.getConnectionUrl().getApiBase('v2'),
        params = {};
      if (this.workspaceTypeIds.length > 0) {
        _.extend(params,{
          where_rel_wksp_type_ids: "{" + this.workspaceTypeIds.join(',') + "}",
          fields: "related_items",
          where_rel_type: "parent"
        });
      }
      if (this.categoryIds.length > 0) {
        _.extend(params,{
          where_category_ids: "{" + this.categoryIds.join(',') + "}"
        });
      }
      params = _.omit(params, function (value) {
        return value === null || value === undefined || value === '';
      });

      var path = "/forms/businessworkspaces/" + nodeId + "/metadata/update",
        resources = _.isEmpty(params) ? path : path + '?' + $.param(params);
      url = Url.combine(url, resources);
      return url;
    },

    fetch: function () {
      if(this.metadataConfig.length > 0){
        return Backbone.Model.prototype.fetch.apply(this,arguments);
      } else {
        return $.Deferred().resolve().promise();
      }
    },

    parse: function (response) {
      this.update(this.metadataConfig, response);
    },

    _getChanges: function (catModel) {
      var changes = catModel.get("data");
      var schema = catModel.get("schema");
      var options = catModel.get('options');
      var key;
      for (key in options.fields) {
        if (options.fields[key].hidden === true) {
          if (schema.properties[key].type === 'string') {
            if (key in changes && changes[key] === null) {
              changes[key] = "";
            }
          }
        }
      }

      return changes;
    },

    restoreData: function (changes) {
      var restore = _.pick(this.oldData, _.keys(changes));
      restore = JSON.parse(JSON.stringify(restore));
      updateData(this.get("data"), restore);
      return restore;
    },

    updateData: function (changes) {
      updateData(this.get("data"), changes);
    },

    update: function (config, formData) {
      var data = {};
      var schema = { properties: {} };
      var options = { fields: {} };
      var destinationModel = {
        data: data,
        properties: schema.properties,
        fields: options.fields,
        title: ""
      };

      this.form_models.splice(0);
      var catId;
      _.each(formData.forms, function (form) {
        if (form.role_name === "categories") {
          _.each(this.categoryIds, function (filterId) {
            var options_fields = form.options && form.options.fields;
            var schema_properties = form.schema && form.schema.properties;
            if (options_fields && options_fields[filterId]) {
              var segments = options_fields[filterId].form.attributes.action.split('categories/');
              if (segments.length > 1) {
                catId = parseInt(segments[segments.length - 1]);
              }
              if (filterId === catId) {
                var cat_form = {
                  id: catId,
                  data: form.data[catId],
                  schema: schema_properties[catId],
                  options: options_fields[catId]
                };
                this.form_models.push(cat_form);
              }
            }
          }, this);
        } else if (form.role_name === "related_items") {
          _.each(this.workspaceTypeIds, function (relWSType) {
            var options_fields = form.options && form.options.fields;
            var schema_properties = form.schema && form.schema.properties;
            _.each(options_fields, function (relbws,relbwskey) {
              if (relbws.workspace_type_id+"" === relWSType+"") {
                var rel_form = {
                  id: relWSType,
                  data: form.data && form.data[relbwskey],
                  schema: schema_properties && schema_properties[relbwskey],
                  options: options_fields && options_fields[relbwskey]
                };
                this.form_models.push(rel_form);
              }
            }, this);
          }, this);
        }
      }, this);

      this._fillModel(config, destinationModel);
      this.set({ data: data, schema: schema, options: options }); // triggers change event
    },

    _fillModel: function (config, destinationModel, prefix) {
      _.each(config, function (configElement) {
        if (configElement.type === "attribute") { // Single attribute row
          this._createAttribute(configElement, destinationModel, prefix);
        } else if (configElement.type === "category") {  // All attributes of a category
          this._createCategory(configElement, destinationModel, prefix);
        } else if (configElement.type === "relation") {  // All related items
          this._createRelation(configElement, destinationModel, prefix);
        } else if (configElement.type === "group") { // Group of attributes
          var groupName = configElement.label;
          var innerData = {};
          var innerProperties = { properties: {} };
          var innerFields = {
            label: BaseUtils.getClosestLocalizedString(configElement.label, "Undefined"),
            fields: {}
          };
          var innerDestinationModel = {
            data: innerData,
            properties: innerProperties.properties,
            fields: innerFields.fields,
            title: ""
          };
          this._fillModel(configElement.attributes, innerDestinationModel, groupName);
          if (!_.isEmpty(innerData)) { // empty groups are hidden
            destinationModel.data[groupName] = innerData;
            destinationModel.properties[groupName] = innerProperties;
            destinationModel.fields[groupName] = innerFields;
          }
        }
      }, this);
    },

    _createAttribute: function (configElement, destinationModel, prefix) {
      var fieldId = configElement.categoryId + "_" + configElement.attributeId, subFieldId;
      _.each(this.form_models, function (modelElement) {
        if (configElement.categoryId === modelElement.id) {
          var sourceModel;
          if (configElement.columnId) {
            var setType = modelElement.schema.properties[fieldId].type;
            if (setType === "object") { // single-row set
              configElement.attributeType = setType;
              subFieldId = fieldId + "_1_" + configElement.columnId;
              sourceModel = {
                data: modelElement.data[fieldId],
                properties: modelElement.schema.properties[fieldId].properties,
                fields: modelElement.options.fields[fieldId].fields
              };
              this._createRow(subFieldId, configElement, destinationModel, sourceModel, prefix);
            } else if (setType === "array") { // multi-row set (has a different, more complex structure)
              configElement.attributeType = setType;
              subFieldId = fieldId + "_x_" + configElement.columnId;
              sourceModel = {
                data: modelElement.data[fieldId][0],
                properties: modelElement.schema.properties[fieldId].items.properties,
                fields: modelElement.options.fields[fieldId].fields.item.fields
              };
              this._createRow(subFieldId, configElement, destinationModel, sourceModel, prefix);
            }
          } else {
            sourceModel = {
              data: modelElement.data,
              properties: modelElement.schema.properties,
              fields: modelElement.options.fields
            };
            this._createRow(fieldId, configElement, destinationModel, sourceModel, prefix);
          }
        }
      }, this);
    },

    _createCategory: function (configElement, destinationModel, prefix) {
      _.each(this.form_models, function (modelElement) {
        if (configElement.categoryId === modelElement.id) {
          var sourceModel = {
            data: modelElement.data,
            properties: modelElement.schema.properties,
            fields: modelElement.options.fields
          };
          _.each(modelElement.data, function (fieldElement, fieldIndex) {
            this._createRow(fieldIndex, configElement, destinationModel, sourceModel, prefix);
          }, this);
        }
      }, this);
    },

    _createRelation: function (configElement, destinationModel, prefix) {
      _.each(this.form_models, function (modelElement) {
        if (configElement.workspaceTypeId === modelElement.id) {
          var sourceModel = {
            data: modelElement.data,
            properties: modelElement.schema.properties,
            fields: modelElement.options.fields
          };
          _.each(modelElement.data, function (fieldElement, fieldIndex) {
            sourceModel.fields[fieldIndex].workspace_type_id = modelElement.options.workspace_type_id;
            this._createRow(fieldIndex, configElement, destinationModel, sourceModel, prefix);
          }, this);
        }
      }, this);
    },

    _createRow: function (fieldId, config, destinationModel, sourceModel, prefix) {
      var fieldVal = sourceModel.data[fieldId],
        prop = sourceModel.properties[fieldId],
        field = sourceModel.fields[fieldId],
        key;
      if (!this.hideEmptyFields || !this._isEmpty(fieldVal)) {
        destinationModel.data[fieldId] = fieldVal;
        destinationModel.properties[fieldId] = prop;
        destinationModel.fields[fieldId] = field;
        if (config.label) {
          destinationModel.fields[fieldId].label =
            BaseUtils.getClosestLocalizedString(config.label, "Undefined");
        }
        if (this.isReadOnly === true || config.readOnly === true) {
          destinationModel.properties[fieldId].readonly = true;
          destinationModel.fields[fieldId].readonly = true;
          if ('items' in prop) {
            for (key in prop.items.properties) {
              prop.items.properties[key].readonly = true;
            }
          }
          if ('properties' in prop) {
            for (key in prop.properties) {
              prop.properties[key].readonly = true;
            }
          }
          if ('fields' in field) {
            for (key in field.fields) {
              field.fields[key].readonly = true;
            }
          }
        }
      }
    },

    _isEmpty: function (val) {
      if (val === null || val === undefined || val === "") {
        return true;
      }
      var uniqueElements = _.uniq(_.values(val));
      if (uniqueElements.length > 0) {
        var allEmpty = true;
        for (var i = 0; i < uniqueElements.length; i++) {
          if (!this._isEmpty(uniqueElements[i])) {
            allEmpty = false;
            break;
          }
        }
        if (allEmpty) {
          return true;
        }
      }
      return false;
    }
  });

  NodeConnectableMixin.mixin(MetadataUpdateFormModel.prototype);

  return MetadataUpdateFormModel;

});
