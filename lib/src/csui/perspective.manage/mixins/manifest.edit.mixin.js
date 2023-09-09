/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/underscore", "csui/lib/jquery"], function (_, $) {
  "use strict";

  var ManifestEditMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        objectToPrimitive: function (fieldKey) {

          var manifestOrig = $.extend(true, {}, this.manifest),
              field = this.manifest.schema.properties[fieldKey],
              fieldOption = this.manifest.options.fields[fieldKey],
              fieldOptionItems = fieldOption && fieldOption.items.fields,
              itemKey = _.keys(field.items.properties)[0];
          this.manifest.modifiedItems = manifestOrig;
          var fieldItem = field.items.properties[itemKey];
          delete field.items.properties;
          field.items.type = fieldItem.type;
          field.title = fieldItem.title;
          field.required = (field.items.required && field.items.required.length > 0);
          field.itemKey = itemKey;
          if (fieldOptionItems) {
            delete fieldOption.items.fields;
            fieldOption.items = _.values(fieldOptionItems)[0];
          }
        },

        updateDataToPrimitive: function (data, modifiedKey) {
          var arrvalues = [],
              key = this.manifest.schema.properties[modifiedKey].itemKey;
          data[modifiedKey].length == 0 && arrvalues.push("");
          data[modifiedKey].forEach(function (item) {
            arrvalues.push(item[key]);
          });
          data[modifiedKey] = arrvalues;
        },

        getPrimitiveToObjectvalues: function (modifiedKey, formValues) {
          var itemKey = this.manifest.schema.properties[modifiedKey].itemKey;
          if (itemKey) {
            if (this.manifest.modifiedItems) {
              this.manifest.options.fields[modifiedKey].items =
                  this.manifest.modifiedItems.options.fields[modifiedKey].items;

              this.manifest.schema.properties[modifiedKey].items =
                  this.manifest.modifiedItems.schema.properties[modifiedKey].items;
            }

            for (var fieldKeyOne in formValues[modifiedKey]) {
              var sortListArray = {};
              sortListArray[itemKey] = formValues[modifiedKey][fieldKeyOne];
              formValues[modifiedKey][fieldKeyOne] = sortListArray;
            }
            return formValues;
          }
          return formValues;

        }
      });
    },
  };
  return ManifestEditMixin;
});