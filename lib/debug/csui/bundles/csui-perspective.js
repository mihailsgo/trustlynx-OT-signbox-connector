csui.define('csui/perspective.manage/mixins/manifest.edit.mixin',["csui/lib/underscore", "csui/lib/jquery"], function (_, $) {
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

          //maintain manifest before modifying to use while conversion to object
          this.manifest.modifiedItems = manifestOrig;

          //updating filed data
          var fieldItem = field.items.properties[itemKey];
          delete field.items.properties;
          field.items.type = fieldItem.type;
          field.title = fieldItem.title;
          field.required = (field.items.required && field.items.required.length > 0);
          field.itemKey = itemKey;

          //updating field schema
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
            // update manifest to original inline with values
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

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/options.form.wrapper',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-pman-form-header\">\r\n    <div class=\"csui-pman-form-title\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":2,"column":38},"end":{"line":2,"column":49}}}) : helper)))
    + "</div>\r\n    <div class=\"csui-pman-form-description\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"description") || (depth0 != null ? lookupProperty(depth0,"description") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"description","hash":{},"loc":{"start":{"line":3,"column":44},"end":{"line":3,"column":61}}}) : helper)))
    + "</div>\r\n    <div class=\"csui-pman-config-unsupported\">\r\n        <div class=\"csui-state\">\r\n            <span class=\"csui-state-icon csui-icon csui-icon-notification-error-white\"></span>\r\n        </div>\r\n        <div class=\"csui-error-message\">\r\n            <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"configNotSupported") || (depth0 != null ? lookupProperty(depth0,"configNotSupported") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"configNotSupported","hash":{},"loc":{"start":{"line":9,"column":18},"end":{"line":9,"column":42}}}) : helper)))
    + "</span>\r\n        </div>\r\n    </div>\r\n</div>\r\n<div class=\"csui-pman-form-content cs-formview-wrapper\"></div>\r\n";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_options.form.wrapper', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/options.form',[],function(){});
csui.define('csui/perspective.manage/impl/options.form.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/lib/alpaca/js/alpaca.lite',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/perspective.manage/mixins/manifest.edit.mixin',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/form/form.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/options.form.wrapper',
  'csui/utils/perspective/perspective.util',
  'css!csui/perspective.manage/impl/options.form',
], function (_, $, Backbone, Marionette, Alpaca, LayoutViewEventsPropagationMixin,
    ManifestEditMixin,
    PerfectScrollingBehavior,
    FormView, lang, template, PerspectiveUtil) {

  var WidgetOptionsFormWrapperView = Marionette.LayoutView.extend({

    template: template,

    className: 'csui-pman-form-wrapper',

    regions: {
      bodyRegion: '.csui-pman-form-content'
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        scrollYMarginOffset: 1
      }
    },

    templateHelpers: function () {
      return {
        title: this.options.manifest.title,
        description: this.options.manifest.description,
        configNotSupported: lang.configNotSupported
      }
    },

    ui: {
      unSupportedConfig: '.csui-pman-config-unsupported',
      description: '.csui-pman-form-description'
    },

    events: {
      'keydown': '_onKeyDown'
    },

    constructor: function WidgetOptionsFormHeaderView(options) {
      this.options = options || {};
      this.manifest = this.options.manifest;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    _createForm: function (formModel) {
      this.widgetOptionsFormView = new WidgetOptionsFormView({
        context: this.options.context,
        model: formModel,
        mode: 'create'
      });

      this.listenToOnce(this.widgetOptionsFormView, 'render:form', function () {
        this.trigger('render:form');
      }.bind(this))

      this.listenTo(this.widgetOptionsFormView, 'change:field', function (field) {
        this.trigger('change:field', field);
        this.trigger('ensure:scrollbar');
      }.bind(this))
    },

    _hasSchema: function () {
      return this.manifest && this.manifest.hasConfigForm;
    },

    refresh: function (callback) {
      if (!!this.widgetOptionsFormView) {
        this.widgetOptionsFormView.refresh(callback);
      } else {
        callback();
      }
    },

    onRender: function () {
      this.ui.unSupportedConfig.hide();
      var hasSchema = this._hasSchema();
      if (!hasSchema) {
        // No schema defined for widget
        this.trigger('render:form');
        return;
      }
      var formModel = this._prepareFormModel();
      this.hasValidSchema = WidgetOptionsFormWrapperView._normalizeOptions(
          formModel.attributes.schema.properties, formModel.attributes.options.fields,
          formModel.attributes.data);
      if (this.hasValidSchema) {
        this._createForm(formModel);
        this.bodyRegion.show(this.widgetOptionsFormView);
      } else {
        // Widget configuration schema has unsupported alpaca fields
        this.ui.description.hide();
        this.ui.unSupportedConfig.show();
        this.trigger('render:form');
      }
    },
    //To change the border color to red for non supported widgets.
    onPopoverShow: function (popover) {
      if (this._hasSchema() && !this.hasValidSchema) {
        popover.find('.binf-popover-content').addClass("invalid-options");
        popover.find('.binf-arrow').addClass("invalid-options");
      }
      this._focusField('.alpaca-container-item-first');
    },

    _focusField: function (fieldSelector) {
      var itemFirst = this.$el.find(fieldSelector);
      if (itemFirst.length) {
        itemFirst = itemFirst.first();
        var ele = itemFirst.find(
            'input:visible, textarea:visible, button.binf-dropdown-toggle:visible'),
            browseIcon = itemFirst.find('.cs-browse-icon');
        if (ele.length) {
          if (browseIcon.length) {
            browseIcon.trigger('focus');
          } else {
            ele.first().trigger('focus');
          }
        }
      }
    },

    _onKeyDown: function (event) {
      var continueEvent = true,
          $target = $(event.target);
      switch (event.keyCode) {
      case 9:
        if (!event.shiftKey && $target.parents('.alpaca-container-item-last').length) {
          this._focusField('.alpaca-container-item-first');
          continueEvent = false;
        } else if (event.shiftKey && $target.parents('.alpaca-container-item-first').length) {
          this._focusField('.alpaca-container-item-last');
          continueEvent = false;
        }
        break;
      }
      return continueEvent;
    },

    getValues: function () {
      if (!this._hasSchema()) {
        return undefined;
      }
      if (this.hasValidSchema) {
        var formValues = this.widgetOptionsFormView.getValues();
        if (this.manifest.modifiedProperties) {
          for (var modKey in _.keys(formValues)) {
            if (this.manifest.modifiedProperties.indexOf(_.keys(formValues)[modKey]) >= 0) {
              formValues = this.getPrimitiveToObjectvalues(_.keys(formValues)[modKey], formValues);
            }
          }
        }
        return formValues;
      } else {
        return this._getOptionsData();
      }
    },

    validate: function () {
      if (!this._hasSchema()) {
        return true;
      }
      // Widget configuration schema has unsupported alpaca fields
      if (!this.hasValidSchema) {
        var reqVal = true;
        //Has required fields
        //TODO to handle required fields of recursive schema
        if (PerspectiveUtil.hasRequiredFields(this.manifest)) {
          var data = this._getOptionsData();
          var reqFields = this.manifest.schema.required;
          _.each(reqFields, function (fieldName) {
            if (!data[fieldName]) {
              reqVal = false;
            }
          });
        }
        return reqVal;
      }
      // Widget configuration schema has supported alpaca fields
      return this.widgetOptionsFormView.validate();
    },

    _isPreviewWidget: function () {
      return this.options.widgetConfig.type ===
             'csui/perspective.manage/widgets/perspective.widget';
    },

    _prepareFormModel: function () {
      var data = this._getOptionsData();
      var modifiedProperties = [];
      //iterate manifest and update fields to primitive type if it has only one item
      for (var fieldKey in this.manifest.schema.properties) {
        //TODO: Need to expect the falg from respective manifest file to render multivalue block as set.
        //something like field.alwaysSet : true
        //until then hardcoded with the key name.
        if (fieldKey !== 'businessobjecttypes') {
          break;
        }
        var filed = this.manifest.schema.properties[fieldKey];
        if (filed.type === 'array' && filed.items.type === 'object' &&
            _.keys(filed.items.properties).length === 1) {
          modifiedProperties.push(fieldKey);
          this.objectToPrimitive(fieldKey);
          data[fieldKey] && this.updateDataToPrimitive(data, fieldKey);
        } else {
          // update only data to inline with modified manifest
          this.manifest.modifiedProperties && data[fieldKey] &&
          this.updateDataToPrimitive(data, fieldKey);
        }
      }

      if (modifiedProperties.length > 0) {
        this.manifest.modifiedProperties = modifiedProperties;
      }

      // Clone schema and options from manifest as they would change by form.view
      var schema = JSON.parse(JSON.stringify(this.manifest.schema)),
          formOptions = JSON.parse(JSON.stringify(this.manifest.options || {}));
      if (!formOptions) {
        formOptions = {};
      }
      if (!formOptions.fields) {
        formOptions.fields = {};
      }
      this._addWidgetSizePropertyIfSupported(schema, formOptions, data);

      var model = new Backbone.Model({
        schema: schema,
        options: formOptions,
        data: data
      });
      return model;
    },

    //Common method to get widget config data
    _getOptionsData: function () {
      var data = this.options.widgetConfig.options || {};
      if (this._isPreviewWidget()) {
        // For widgets added using DnD, widget will be added as preview for original widget
        // Resolve original widget options from preview widget's options
        data = data.options || {};
      }
      return data;
    },

    /**
     * Add a new properties to form to change "Size" if widgets.
     * Size that can be configured depends on perspective's supported sizes as well as supported sizes of widget
     *
     */
    _addWidgetSizePropertyIfSupported: function (schema, options, data) {
      if (!this.options.perspectiveView.getSupportedWidgetSizes) {
        // Perspective view doesn't support configuring widget sizes
        return;
      }
      var supportedKinds = this.options.perspectiveView.getSupportedWidgetSizes(this.manifest,
        this.options.widgetView);
      if (this.options.context && this.options.context.perspective) {
        if (!((this.options.context.perspective.type == 'sidepanel-right') ||
          (this.options.context.perspective.type == 'sidepanel-left'))) {
          supportedKinds = _.filter(supportedKinds, function (supportedItem) {
            return supportedItem.kind !== 'heroTile';
          });
        } else {
          if (this.options.perspectiveView.$el.hasClass('cs-bcs-perspective-banner')) {
            delete schema.properties['titlefield'];
          }
        }
      }
      if (!supportedKinds || supportedKinds.length === 0) {
        // No supported sizes found for widget
        return;
      }
      var kindSchema = {
        title: lang.widgetSizeTitle,
        description: lang.widgetSizeDescription,
        type: 'string',
        enum: _.map(supportedKinds, function (sk) {
          return sk.kind;
        })
      };
      var kindOption = {
        type: 'select',
        optionLabels: _.map(supportedKinds, function (sk) {
          return sk.label;
        }),
        removeDefaultNone: true
      };
      var selectedKind = _.find(supportedKinds, function (size) {return size.selected;});
      if (!!selectedKind) {
        data[WidgetOptionsFormWrapperView.widgetSizeProperty] = selectedKind.kind;
      }
      var sizeSchema = {};
      sizeSchema[WidgetOptionsFormWrapperView.widgetSizeProperty] = kindSchema;
      schema.properties = _.extend(sizeSchema, schema.properties);

      var sizeOptions = {};
      sizeOptions[WidgetOptionsFormWrapperView.widgetSizeProperty] = kindOption;
      options.fields = _.extend(sizeOptions, options.fields);

      schema.required = schema.required || [];
      schema.required.push(WidgetOptionsFormWrapperView.widgetSizeProperty);
    },

  }, {
    widgetSizeProperty: '__widgetSize',

    /**
     * NOTE: Duplicate of Alpaca.createFieldInstance since this code is not exposed as function
     */
    _resolveOptionsType: function (schema, data) {
      var type = schema.type;
      if (!type) {
        type = Alpaca.getSchemaType(data);
      }
      if (!type) {
        if (data && Alpaca.isArray(data)) {
          type = "array";
        } else {
          type = "object"; // fallback
        }
      }
      if (schema && schema["enum"]) {
        if (schema["enum"].length > 3) {
          return "select";
        } else {
          return "radio";
        }
      } else {
        return Alpaca.defaultSchemaFieldMapping[type];
      }
    },

    /**
     * Recursively fill options for all respective schemas
     */
    _normalizeOptions: function (schemaProperies, optionFields, data) {
      var hasValidTypes = true;
      _.each(schemaProperies, function (field, fieldId) {
        var fieldOpts = optionFields[fieldId];
        var fieldData = data[fieldId];
        if (!fieldOpts) {
          optionFields[fieldId] = fieldOpts = {}
        }

        var optType = fieldOpts.type;
        if (!optType && !!field.type) {
          // Options not defined.. So resolve option type from Alp JSON schema type
          optType = WidgetOptionsFormWrapperView._resolveOptionsType(field, fieldData);
        }

        if (!Alpaca.getFieldClass(optType)) {
          hasValidTypes = false;
        }

        switch (field.type) {
        case 'array':
          if (!fieldOpts.fields) {
            _.defaults(fieldOpts, {
              fields: {
                item: {}
              }
            });
          }
          if (!!fieldOpts.items) {
            fieldOpts.fields.item = fieldOpts.items;
          }
          if (field.items.type === 'object') {
            if (!!fieldOpts.fields.item.type && !Alpaca.getFieldClass(fieldOpts.fields.item.type)) {
              hasValidTypes = false;
            }
            fieldOpts.fields.item.fields || (fieldOpts.fields.item.fields = {});
            if (!fieldData || fieldData.length === 0) {
              data[fieldId] = fieldData = [{}];
            }
            var hasValidArrayType = WidgetOptionsFormWrapperView._normalizeOptions(
                field.items.properties, fieldOpts.fields.item.fields,
                fieldData[0]);
            if (!hasValidArrayType) {
              hasValidTypes = false;
            }
          }
          if (!fieldData) {
            data[fieldId] = [null];
          }
          break;
        case 'object':
          if (!fieldData) {
            data[fieldId] = fieldData = {};
          }
          if (!fieldOpts.fields) {
            fieldOpts.fields = {};
          }
          var hasValidObjectType = WidgetOptionsFormWrapperView._normalizeOptions(field.properties,
              fieldOpts.fields, fieldData);
          if (!hasValidObjectType) {
            hasValidTypes = false;
          }
          break;
        default:
          if (_.isUndefined(fieldData)) {
            // Consider default value specified in schema if set
            data[fieldId] = field.default || null;
          }
          break;
        }
      });
      return hasValidTypes;
    }
  });

  var WidgetOptionsFormView = FormView.extend({
    className: function () {
      var className = FormView.prototype.className.call(this);
      return className + ' perspective-widget-form';
    },
    constructor: function WidgetOptionsFormView(options) {
      FormView.apply(this, arguments);
    },
    popover : false,
    refresh: function (callback) {
      this.form && this.form.refresh(callback);
    },

    _modifyModel: function () {
      FormView.prototype._modifyModel.apply(this, arguments);
      // Dont hide initial validation since there is an issue in alpaca with  alpaca.refresh()
      this.alpaca.options.hideInitValidationError = false;
    }
  });

  _.extend(WidgetOptionsFormView.prototype, LayoutViewEventsPropagationMixin);
  ManifestEditMixin.mixin(WidgetOptionsFormWrapperView.prototype);
  return WidgetOptionsFormWrapperView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/widget.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\r\n        <div class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"draggable") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":11,"column":20},"end":{"line":11,"column":76}}})) != null ? stack1 : "")
    + "\"\r\n             data-widget-type=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"dataAttr") : stack1), depth0))
    + "\"\r\n             data-widget-allow-multiple=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"allowMultiple") : stack1), depth0))
    + "\">\r\n          <div class=\"csui-widget-item icon-draggable-handle csui-draggable-widget-item\"\r\n               data-widget-index=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"index") : stack1), depth0))
    + "\" draggable=\"true\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "\">\r\n            <span>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</span>\r\n            <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></div>\r\n          </div>\r\n        </div>\r\n\r\n        <div class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"draggable") : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(2, data, 0),"loc":{"start":{"line":21,"column":20},"end":{"line":21,"column":76}}})) != null ? stack1 : "")
    + "\" data-widget-type=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"dataAttr") : stack1), depth0))
    + "\"\r\n             data-widget-allow-multiple=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"allowMultiple") : stack1), depth0))
    + "\">\r\n          <div class=\"csui-widget-item icon-draggable-handle\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"disableTitle") : stack1), depth0))
    + "\">\r\n            <span>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + "</span>\r\n            <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></div>\r\n          </div>\r\n        </div>\r\n\r\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "";
},"4":function(container,depth0,helpers,partials,data) {
    return " binf-hidden ";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-accordion-header\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\">\r\n  <div class=\"csui-accordion-header-title\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "</div>\r\n  <div class=\"csui-button-icon cs-icon icon-expandArrowDown\"></div>\r\n  <div class=\"csui-button-icon cs-icon icon-expandArrowUp\"></div>\r\n</div>\r\n<div class=\"csui-accordion-content\">\r\n  <div class=\"cs-content csui-list-pannel\">\r\n    <div class=\"cs-list-group\">\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"widgets") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":6},"end":{"line":29,"column":15}}})) != null ? stack1 : "")
    + "    </div>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_widget.item', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/widget.drag.template',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-widget-template\">\r\n  <div class=\"csui-template-header\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"header") : depth0), depth0))
    + "</div>\r\n  <div class=\"csui-template-body\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"body") : depth0), depth0))
    + "</div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_widget.drag.template', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/perspective.manage/impl/widget.list.view',['module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/perspective.manage/impl/options.form.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'csui/models/widget/widget.collection',
  'hbs!csui/perspective.manage/impl/widget.item',
  'hbs!csui/perspective.manage/impl/widget.drag.template'
], function (module, _, $, Backbone, Marionette, base, PerfectScrollingBehavior,
    WidgetOptionsFormView, Lang,
    WidgetCollection,
    WidgetItemTemplate, WidgetDragTemplate) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    dragImageOffsetTop: 50,
    dragImageOffsetLeft: 50
  });

  var WidgetItemView = Marionette.ItemView.extend({

    constructor: function WidgetItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',

    className: 'csui-module-group',

    template: WidgetItemTemplate,

    templateHelpers: function () {
      var widgetCollection = new Backbone.Collection(this.model.attributes.widgets),
          disableTitle     = Lang.disableTitle,
          idx              = 0;

      widgetCollection.models.forEach(function (model) {
        model.set({
          'draggable': !!model.get('canDragAndDrop'),
          'disableTitle': disableTitle,
          'dataAttr': model.get('id').replace(/\//g, "-"),
          'allowMultiple': !!model.get('allowMultiple'),
          'index': idx++
        }, {'silent': true});
      });
      return {
        widgets: widgetCollection.models
      }
    },

    ui: {
      accordionHeader: '.csui-accordion-header',
      accordionContent: '.csui-accordion-content',
      accordionHeaderIcon: '.csui-accordion-header .cs-icon',
      widget: '.csui-draggable-widget-item'
    },

    events: {
      'click @ui.accordionHeader': "toggle",
      'keydown @ui.accordionHeader': 'toggle',
      'dragstart @ui.widget': 'onDragStart',
      'dragend @ui.widget': 'onDragEnd'
    },

    toggle: function () {
      var isClosed = this.ui.accordionHeader.hasClass('csui-accordion-expand');
      this.ui.accordionHeader.toggleClass("csui-accordion-expand");
      this.options.parentView.$el.find(".csui-module-group").removeClass('csui-accordion-visible')
          .find('.csui-accordion-header').removeClass('csui-accordion-expand');
      if (!isClosed) {
        this.$el.addClass("csui-accordion-visible");
        this.ui.accordionHeader.addClass("csui-accordion-expand");
      }

      base.onTransitionEnd(this.ui.accordionContent, function () {
        this.trigger('widgets:expanded');
      }, this);
    },

    onRender: function () {
      var dndContainer = $('.perspective-editing .csui-dnd-container');
      if (dndContainer.length) {
        // Current perspective using sortable plugin for DnD. Get ready for it.
        this._makeWidgetSortable();
      } else {
        // Current perspective relaying on HTML5 DnD. Get ready with IE workarounds
        var hasDragDropNative = (typeof document.createElement("span").dragDrop === "function");
        if (!this._hasNativeDragImageSupport() && hasDragDropNative) {
          this.ui.widget.on("mousedown", this._handleDragImageForIE.bind(this));
        }
      }
    },

    _makeWidgetSortable: function () {
      var self              = this,
          draggableChildren = this.$el.find('.csui-widget-item.csui-draggable-widget-item'),
          widgetEls         = draggableChildren.parent();
      widgetEls.data('pman.widget', this.model.get('widgets'));
      widgetEls.sortable({
        connectWith: [".perspective-editing .csui-dnd-container",
          ".perspective-editing .pman-trash-area"],
        containment: ".perspective-editing ",
        helper: function (event, ui) {
          // Drag Image
          var widgetModel = ui.data('widget-index');
          self.widgetDragTemplate = new widgetDragTemplateView({
            title: self.model.get("widgets")[widgetModel].get('title'),
            newWidget: self.model.get("widgets")[widgetModel]
          });
          self.widgetDragTemplate.render();
          //Set width and height to prevent jquery ui overriding Drag item width and height
          self.widgetDragTemplate.$el.width('220px');
          self.widgetDragTemplate.$el.height('220px');
          self.widgetDragTemplate.$el.css({opacity: 0.75});
          self.widgetDragTemplate.$el.appendTo(
              self.options.parentView.$el.closest('.pman-pannel-wrapper'));
          return self.widgetDragTemplate.$el;
        },
        tolerance: 'pointer',
        cursorAt: {top: config.dragImageOffsetTop, left: config.dragImageOffsetLeft},
        start: function (event, ui) {
          ui.item.css('display', 'block');
          ui.placeholder.css('display', 'block');
          self.dragStart();
        },
        stop: function () {
          self.dragEnd();
        }
      });
    },

    _handleDragImageForIE: function (e) {
      var originalEvent = e.originalEvent,
          idx           = $(event.currentTarget).data('widget-index'),
          $img          = $('.csui-template-wrapper').clone(),
          widget        = this.model.get("widgets")[idx];
      $img.find(".csui-template-header").text(widget.get("title"));
      $img.css({
        "top": Math.max(0, originalEvent.pageY - config.dragImageOffsetTop) + "px",
        "left": Math.max(0, originalEvent.pageX - config.dragImageOffsetLeft) + "px",
        "position": "absolute",
        "pointerEvents": "none"
      }).appendTo(document.body);

      setTimeout(function () {
        $img.remove();
      });
      $img.on('dragstart', _.bind(function (event) {
        var widget       = this.model.get("widgets")[idx],
            dataTransfer = event.originalEvent.dataTransfer;
        dataTransfer.setData("text", JSON.stringify(widget.toJSON()));
        this.dragStart();
      }, this));
      $img.on('dragend', _.bind(function (event) {
        this.dragEnd();
      }, this));
      $img[0].dragDrop();
    },

    onDragStart: function (event) {
      var idx          = $(event.currentTarget).data('widget-index'),
          widget       = this.model.get("widgets")[idx],
          dataTransfer = event.originalEvent.dataTransfer;
      var template = $('.csui-template-wrapper');
      template.find(".csui-template-header").text(widget.get("title"));
      if (this._hasNativeDragImageSupport()) {
        dataTransfer.setData("text", JSON.stringify(widget.toJSON()));
        // IE11 doesn't support 'setDragImage'. See `_handleDragImageForIE` function for Drag Image handling in IE.
        dataTransfer.setDragImage(template[0], config.dragImageOffsetLeft,
            config.dragImageOffsetTop);
      }
      this.dragStart();
    },

    _hasNativeDragImageSupport: function () {
      var dataTransfer = window.DataTransfer || window.Clipboard;
      return ("setDragImage" in dataTransfer.prototype);
    },

    onDragEnd: function (event) {
      this.dragEnd();
    },

    dragStart: function () {
      this.$el.closest(".csui-pman-panel").addClass("csui-pman-drag-start");
      $(document.body).addClass('csui-pman-dnd-active');
    },

    dragEnd: function () {
      this.$el.closest(".csui-pman-panel").removeClass("csui-pman-drag-start");
      $(document.body).removeClass('csui-pman-dnd-active');
    }

  });

  var widgetDragTemplateView = Marionette.ItemView.extend({
    constructor: function WidgetItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',

    className: 'csui-template-wrapper',

    template: WidgetDragTemplate,

    templateHelpers: function () {
      return {
        header: this.options && this.options.title,
        body: Lang.templateMessage

      }
    },
    onRender: function () {
      this.$el.data('pman.widget', this.options.newWidget);
    }
  });

  var WidgetListView = Marionette.ItemView.extend({
    tagName: 'div',

    template: WidgetItemTemplate,

    constructor: function WidgetListView(options) {
      options || (options = {});
      options.data || (options.data = {});

      options.existsWidgetTypes || (options.existsWidgetTypes = []);
      Marionette.ItemView.call(this, options);
      this.context = this.options.pmanView.context;
      var self = this;
      self.widegtsUpdated = false;
      this.allWidgets = new WidgetCollection();
      this.allWidgets.fetch().done(function () {
        self.collection = self._groupWidgetsByModule();
        // self._sanitiseWidgetLibrary();
        self.render();
        self.trigger("items:fetched");
      });

      // TODO: need to render using collection view instead of rendering all items within item view.
      // By that  events can handle through model instead-of DOM elements.
      this.listenTo(this.context, 'update:widget:panel', _.bind(function (opts) {
        this.widegtsUpdated = true;
        var newEleToBeProcess = opts.widgetModel && opts.widgetModel.type ? opts.widgetModel.type :
                                undefined,
            oldEleToBeProcess = opts.oldWidgetModel && opts.oldWidgetModel.type ?
                                opts.oldWidgetModel.type : undefined;

        if (!!newEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, newEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          else {
            this.options.existsWidgetTypes.push(newEleToBeProcess);
          }
          newEleToBeProcess = newEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + newEleToBeProcess +
                                             '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass('binf-hidden') : '';
        }
        if (!!oldEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, oldEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          oldEleToBeProcess = oldEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + oldEleToBeProcess +
                                             '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass('binf-hidden') : '';
        }
      }, this));

      this.listenTo(this.context, 'reset:widget:panel', _.bind(function (opts) {
        this.options.existsWidgetTypes = [];
        this.widegtsUpdated = true;
      }, this));
    },

    initialize: function () {
      _.bindAll(this, "renderItem");
    },

    className: 'cs-module-list',

    render: function () {
      this.collection && this.collection.each(this.renderItem);
    },

    renderItem: function (model) {
      var parentView = this;
      var itemView = new WidgetItemView({
        model: model,
        parentView: parentView,
        context: this.context
      });
      itemView.render();
      this.listenTo(itemView, 'widgets:expanded', _.bind(this.trigger, this, 'dom:refresh', this));
      $(this.el).append(itemView.el);
    },

    _groupWidgetsByModule: function () {
      // creates a data model where widgets are grouped according to their module
      var moduleCollection = new Backbone.Collection();
      var widgets = this.allWidgets.filter(function (widget) {
        var manifest = widget.get('manifest');
        if (!manifest || !_.has(manifest, 'title') || !_.has(manifest, 'description') ||
            manifest.deprecated) {
          return false;
        }
        var schema        = JSON.parse(JSON.stringify(manifest.schema || {})),
            options       = JSON.parse(JSON.stringify(manifest.options || {})),
            isValidSchema = WidgetOptionsFormView._normalizeOptions(
                schema.properties, options.fields || {}, {});
        if (!isValidSchema) {
          // Found unknown properties.. hence widget unsupported.
          return false;
        }
        return true;
      });

      _.each(widgets, _.bind(function (widget) {
        var manifest       = _.defaults(widget.get('manifest'), {
              'allowMultiple': true,
              'title': Lang.noTitle
            }),
            canDragAndDrop = manifest.allowMultiple;

        if (!canDragAndDrop) {
          canDragAndDrop = $.inArray(widget.get('id'), this.options.existsWidgetTypes) === -1;
        }

        widget.set({
          'allowMultiple': manifest.allowMultiple,
          'canDragAndDrop': canDragAndDrop,
          'title': manifest.title
        });
      }, this));

      _.each(_.groupBy(widgets, function (widget) {
        return widget.serverModule.id;
      }), function (val, key) {
        var title = _.first(val).serverModule.get('title');
        // remove superfluous OpenText prefix.
        title = title ? title.replace(/OpenText /, '') :
                _.first(val).serverModule.get('id').toUpperCase();
        moduleCollection.add({
          id: key,
          title: title,
          widgets: val
        })
      });
      return moduleCollection;
    },

    _sanitiseWidgetLibrary: function () {
      // checks to see if any widget groups or widgets have been whitelisted or blacklisted
      // alpha-sorts the groups and the widgets within them.
    },

    onInitWidgets: function () {
      this.$el.empty(); // FIXME Make this ItemView as CollectionView
       if(this.widegtsUpdated){
        this.collection = this._groupWidgetsByModule();
        this.widegtsUpdated = false;
      }
      this.render();
    },

  });

  return WidgetListView;

});


csui.define('csui/perspective.manage/impl/perspectivelayouts',['module',
    'csui/lib/underscore',
    'i18n!csui/perspective.manage/impl/nls/lang',
    // Load extra layout items to be added
    'csui-ext!perspective.manage/impl/perspectivelayouts'
], function(module,_, Lang, extraPerspectiveLayouts) {
    var config = _.extend({       
        enableNewlayoutOption: false,
      }, module.config());

    var perspectivelayouts = [
        {
            title: Lang.LcrLayoutTitle,
            type: "left-center-right",
            icon: "csui-layout-lcr"
        },
        {
            title: Lang.FlowLayoutTitle,
            type: "flow",
            icon: "csui-layout-flow"
        }
    ];
    if (config.enableNewlayoutOption) {
        perspectivelayouts.push(
            {
                title: Lang.RSPLayoutTitle,
                type: "sidepanel-right",
                icon: "csui-layout-sidepanel-right"
            },
            {
                title: Lang.LSPLayoutTitle,
                type: "sidepanel-left",
                icon: "csui-layout-sidepanel-left"
            }
        );
    }


    if(extraPerspectiveLayouts) {
        perspectivelayouts = _.union(perspectivelayouts, extraPerspectiveLayouts);
    }

    return perspectivelayouts;
});

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/pman.panel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-tab-pannel\">\r\n  <div class=\"csui-layout-tab\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"layoutTabTitle") : depth0), depth0))
    + "\">\r\n    "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"layoutTabTitle") : depth0), depth0))
    + "\r\n  </div>\r\n  <div class=\"csui-AddWidget-tab\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"widgetTabTitle") : depth0), depth0))
    + "\">\r\n    "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"widgetTabTitle") : depth0), depth0))
    + "\r\n  </div>\r\n  <div class=\"csui-widget-tab\"></div>\r\n</div>\r\n<div class=\"csui-list-pannel\"></div>\r\n<div class=\"csui-template-overlay\"></div>\r\n<div class=\"csui-template-wrapper\">\r\n  <div class=\"csui-widget-template\">\r\n    <div class=\"csui-template-header\"></div>\r\n    <div class=\"csui-template-body\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"templateMessage") : depth0), depth0))
    + "</div>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_pman.panel', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/list.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"className") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\"\r\n     draggable=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"draggable") : depth0), depth0))
    + "\" tabindex= \"-1\">\r\n  <span>"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "</span>\r\n  <div class=\"csui-layout-icon "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"iconClass") : depth0), depth0))
    + "\"></div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_list.item', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/list',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-header binf-panel-heading cs-header-with-go-back\" role=\"link\"\r\n     aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackAria") || (depth0 != null ? lookupProperty(depth0,"goBackAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackAria","hash":{},"loc":{"start":{"line":2,"column":17},"end":{"line":2,"column":31}}}) : helper)))
    + "\">\r\n  <span class=\"icon circular arrow_back cs-go-back\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTooltip") || (depth0 != null ? lookupProperty(depth0,"goBackTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTooltip","hash":{},"loc":{"start":{"line":3,"column":59},"end":{"line":3,"column":76}}}) : helper)))
    + "\"></span>\r\n</div>\r\n<div class=\"cs-content\">\r\n  <div class=\"cs-list-group\"></div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_list', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/pman.panel',[],function(){});
csui.define('csui/perspective.manage/impl/pman.panel.view',['require', 'module', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/underscore', 'csui/lib/marionette',
  "csui/controls/progressblocker/blocker",
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/perspective.manage/impl/widget.list.view',
  'csui/perspective.manage/impl/perspectivelayouts',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman.panel',
  'hbs!csui/perspective.manage/impl/list.item',
  'hbs!csui/perspective.manage/impl/list',
  'hbs!csui/perspective.manage/impl/widget.drag.template',
  'css!csui/perspective.manage/impl/pman.panel'

], function (require, module, $, Backbone, _, Marionette, BlockerView, PerfectScrollingBehavior,
    WidgetListView, perspectiveLayouts, Lang, template, ListItemTemplate, ListTemplate,
    WidgetDragTemplate) {
  'use strict';

  var PManPanelView = Marionette.ItemView.extend({
    tagName: 'div',

    template: template,

    events: {
      'click @ui.layoutTab': "onTabClicked",
      'keydown @ui.layoutTab': "onKeyDown"
    },

    ui: {
      tabPannel: ".csui-tab-pannel",
      listPannel: ".csui-list-pannel",
      layoutTab: ".csui-layout-tab",
      widgetTab: ".csui-widget-tab",
      template: ".csui-widget-template"
    },

    className: 'csui-pman-panel',

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-tab-pannel, .csui-list-pannel',
        suppressScrollX: true,
        scrollYMarginOffset: 8
      }
    },

    templateHelpers: function () {
      return {
        layoutTabTitle: Lang.layoutTabTitle,
        widgetTabTitle: Lang.widgetTabTitle,
        templateMessage: Lang.templateMessage
      }
    },

    onPanelOpen: function () {
      this.accordionView.triggerMethod("init:widgets");
      this.trigger('ensure:scrollbar');
    },

    onRender: function () {
      this.ui.widgetTab.hide();
      this.ui.layoutTab.hide();
      this.accordionRegion = new Marionette.Region({
        el: this.ui.widgetTab
      });
      this.accordionView = new WidgetListView(this.options);
      this.accordionRegion.show(this.accordionView);
      this.blockActions();
      this.listenTo(this.accordionView, "items:fetched", function () {
        this.unblockActions();
        this.ui.layoutTab.show();
        this.ui.widgetTab.show();
      });
      this.listenTo(this.accordionView, "dom:refresh", function () {
        // Dom refresh to ensure perfect scrollbar
        this.trigger('dom:refresh');
      });
    },

    constructor: function PManPanelView(options) {
      this.options = options || {};
      this.options.existsWidgetTypes = this._getExistsWidgetTypes() || [];
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      BlockerView.imbue(this);
      this.listenTo(this, 'reset:items', function () {
        this.listView && this.listView.destroy();
      });
    },

    _getExistsWidgetTypes: function () {
      var perspective       = this.options.pmanView.perspective.get('perspective'),
          type              = perspective.type,
          perpeCollection   = {},
          existsWidgetTypes = [];

      //Handling 'flow' and 'LCR' perspectives as these two only support edit page.
      if (type == 'flow') {
        perpeCollection = perspective.options;
        perpeCollection.widgets.forEach(
            _.bind(function (widget) {
              if (!!widget.type) {
                existsWidgetTypes.push(widget.type);
              }
            }, this));
      } else if (type == 'left-center-right') {
        perpeCollection = perspective.options;
        perpeCollection.center && existsWidgetTypes.push(perpeCollection.center.type);
        perpeCollection.right && existsWidgetTypes.push(perpeCollection.right.type);
        perpeCollection.left && existsWidgetTypes.push(perpeCollection.left.type);
      }
      return existsWidgetTypes;
    },

    onTabClicked: function (options) {
      var args = options.data ? options : {
        data: {
          items: perspectiveLayouts
        }
      };
      args.draggable = !!args.data.draggable;
      args.itemClassName = "csui-layout-item";
      args.pmanView = this.options.pmanView;

      this.ui.tabPannel.addClass("binf-hidden");
      this.listregion = new Marionette.Region({
        el: this.ui.listPannel
      });
      this.listView = new ListView(args);
      this.listregion.show(this.listView);
      this.$el.find('.cs-go-back').attr('tabindex', 0);
      var ele = this.$el.find('.csui-layout-item.binf-active');
      $(ele[0]).attr('tabindex', 0);
      ele.focus();
      // Register events on listview to handle back
      this.listenTo(this.listView, "before:destroy", function () {
        this.ui.tabPannel.removeClass("binf-hidden");
      }).listenTo(this.listView, "click:back", function () {
        this.listView.destroy();
      });
    },

    onKeyDown: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onTabClicked(event);
      }
    }
  });

  var ListItemView = Marionette.ItemView.extend({
    constructor: function ListItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',
    template: ListItemTemplate,

    templateHelpers: function () {
      return {
        draggable: !!this.options.draggable,
        className: this.options.itemClassName,
        iconClass: this.model.get('icon')
      }
    },

    events: {
      'click .csui-layout-item:not(.binf-active)': _.debounce(function () {
        this.trigger('change:layout');
      }, 200, true),
      'keydown .csui-layout-item': _.debounce(function (event) {
        if (event.keyCode === 13 || event.keyCode === 32) {
          this.trigger('change:layout');
        } else if (event.keyCode === 9 || event.keyCode === 16) {
          this.$el.find('.csui-layout-item').attr('tabindex', -1);
          //this.$el.find('.csui-layout-item').removeClass('binf-active');
          if (event.keyCode === 9 && event.shiftKey) {
            event.preventDefault();
            this.options.pmanView.$el.find('.cs-go-back').focus();
          } else if (event.keyCode === 9) {
            event.preventDefault();
            $(this.options.pmanView.$el.find('.binf-btn.icon-save')).focus();
            $(this.options.pmanView.$el.find('.csui-layout-item.binf-active')[0]).attr('tabindex', 0);
          } else if (!event.shiftKey) {
            $(this.options.pmanView.$el.find('.csui-layout-item.binf-active')[0]).attr('tabindex', 0);
          }
        } else {
          this.handleKeydown(event);
        }
      }, 200, true),
    },

    handleKeydown: function (event) {
        if (event.keyCode === 38 || event.keyCode === 40) {
          this.$el.find('.csui-layout-item').attr('tabindex', -1);
          event.preventDefault();
          event.stopPropagation();
          if (event.keyCode === 38) { // up arrow key
            var previousEle = this.$el.prev().find('.csui-layout-item');
            if (previousEle.length > 0) {
              previousEle.trigger('focus');
            }
          } else if (event.keyCode === 40) { // down arrow key
            var nextEle = this.$el.next().find('.csui-layout-item');
            if (nextEle.length > 0) {
              nextEle.trigger('focus');
            }
          }
        }
    },

    onRender: function () {
      if (this.model.get('type') === this.options.pmanView.perspective.get('perspective').type) {
        this.trigger('set:active');
      }
    }

  });

  var ListView = Marionette.CompositeView.extend({

    constructor: function ListView(options) {
      options || (options = {});
      options.data || (options.data = {});

      // Provide the perfect scrollbar to every list view by default
      // (Behaviors cannot be inherited; add the PerfectScrolling
      //  to the local clone of the descendant's behaviors.)
      if (!(this.behaviors && _.any(this.behaviors, function (behavior, key) {
        return behavior.behaviorClass === PerfectScrollingBehavior;
      }))) {
        this.behaviors = _.extend({
          PerfectScrolling: {
            behaviorClass: PerfectScrollingBehavior,
            contentParent: '.csui-pman-list',
            suppressScrollX: true,
            // like bottom padding of container, otherwise scrollbar is shown always
            scrollYMarginOffset: 15
          }
        }, this.behaviors);
      }

      Marionette.CompositeView.call(this, options);

      // TODO: Deprecate this, or fix it, so that a collection can be created
      // without breaking the client
      // Passing a collection without knowing its model schema and identifier
      // is not possible in Backbone, where the collections should be indexed
      if (this.options.data && this.options.data.items) {
        if (!this.collection) {
          var ViewCollection = Backbone.Collection.extend({
            model: Backbone.Model.extend({
              idAttribute: null
            })
          });
          this.collection = new ViewCollection();
        }
        this.collection.add(this.options.data.items);
      }
    },

    ui: {
      back: '.cs-go-back'
    },
    className: 'csui-pman-list',

    events: {
      'click @ui.back': 'onClickBack',
      'keydown @ui.back': 'onKeyInView'
    },

    childEvents: {
      'change:layout': 'onChangeLayout',
      'set:active': 'setActive'
    },

    template: ListTemplate,

    templateHelpers: function () {
      return {
        goBackTooltip: Lang.goBackTooltip
      };
    },

    childViewContainer: '.cs-list-group',

    childView: ListItemView,

    childViewOptions: function () {
      return this.options;
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger('click:back');
    },

    onKeyInView: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickBack(event);
        this.options.pmanView.$el.find('.csui-layout-tab').focus();
      } else if (event.keyCode === 9) {
        if (!event.shiftKey) {
          event.preventDefault();
          this.$el.find('.csui-layout-item.binf-active').focus();
        }
      }
    },

    setActive: function (childView) {
      this.$el.find('.csui-layout-item').removeClass('binf-active');
      childView.$el.find('.csui-layout-item').addClass('binf-active');
    },

    onChangeLayout: function (childView) {
      var self = this,
        newLayout = childView.model.get('type'),
        currentLayout = this.options.pmanView.perspective.get('perspective').type;
      if ((currentLayout === 'sidepanel-right' || currentLayout === 'sidepanel-left')
        && (newLayout === 'sidepanel-right' || newLayout === 'sidepanel-left')) {
        //swapping the layouts without any warning message and also retaining the widgets
        // while switching between sidepanel-left and sidepanel-right
        self.setActive(childView);
        self.options.pmanView.trigger("swap:layout", newLayout);
      }
      else {
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlertView) {
          ModalAlertView.confirmWarning(Lang.changePageLayoutConfirmatonText, Lang.layoutTabTitle,
            {
              buttons: {
                showYes: true,
                labelYes: Lang.proceedButton,
                showNo: true,
                labelNo: Lang.changeLayoutCancelButton
              }
            })
            .done(function (labelYes) {
              if (labelYes) {
                self.setActive(childView);
                self.options.pmanView.trigger("change:layout", childView.model.get('type'));
                self.options.pmanView.context.trigger("reset:widget:panel");
              }
            });
        });
      }
    }

  });

  return PManPanelView;
});


csui.define('csui/perspectives/mixins/draganddrop.kn.mixin',["csui/lib/underscore", "csui/lib/jquery",'i18n'], function (_, $, i18n) {
  "use strict";

  var DragAndDropKNMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        moveToRight: function (movableEle, focusableEle, widgetCells) {
          var self = this, isRtl = i18n && i18n.settings.rtl,
              nextEle = movableEle.next();

          function callback() {
            movableEle && movableEle.insertAfter(nextEle);
            focusableEle && focusableEle.trigger("focus");
            self.swapIndexPositions(widgetCells, movableEle.index(), nextEle.index());
          }

          nextEle.length && this.animation(movableEle, nextEle, !isRtl, callback);
        },

        moveToLeft: function (movableEle, focusableEle, widgetCells) {
          var self = this, isRtl = i18n && i18n.settings.rtl,
              prevEle = movableEle.prev();

          function callback() {
            movableEle && movableEle.insertBefore(prevEle);
            focusableEle && focusableEle.trigger("focus");
            self.swapIndexPositions(widgetCells, movableEle.index(), prevEle.index());
          }
          prevEle.length && this.animation(movableEle, prevEle, isRtl, callback);
        },

        animation: function (movableEle, destEle, isMovingRight, callback) {
          var positions = this.findPositions(movableEle, destEle),
              isEleInSameRow = (positions.destEle.top === positions.movableEle.top),
              destEleWidth = destEle.width(),
              movableEleWidth = movableEle.width(),self = this,duration = 400;
          movableEle.css('zIndex', 99999);
          destEle.css('zIndex', 99998);
          if(self.isAnimationInProgress){
            /* stop current running animation*/
            duration = 0;
            this.movableEleAnimate && this.movableEleAnimate.stop();
            this.destEleAnimate && this.destEleAnimate.stop();
          }
          self.isAnimationInProgress = true;
          this.movableEleAnimate =  movableEle.animate(
            {
              left: isEleInSameRow &&
                    isMovingRight ? destEleWidth :
                    positions.destEle.left - positions.movableEle.left,
              top: isEleInSameRow ? 0 : positions.destEle.top - positions.movableEle.top,
            },
            {duration: duration, easing: "easeInOutCubic", queue: false}
          );
          this.destEleAnimate =  destEle.animate(
            {
              left: isEleInSameRow ?
                    isMovingRight ? positions.movableEle.left - positions.destEle.left :
                    movableEleWidth < destEleWidth ? movableEleWidth : destEleWidth :
                    positions.movableEle.left - positions.destEle.left,
              top: isEleInSameRow ? 0 : positions.movableEle.top - positions.destEle.top,
            },
            {duration: duration, easing: "easeInOutCubic", queue: false}
          );
         $.when(
          this.movableEleAnimate , this.destEleAnimate
          ).always(function () {
            self.isAnimationInProgress = false;
            movableEle.css({
              top: 0,
              left: 0,
              zIndex: 'initial'
            });
            destEle.css({
              top: 0,
              left: 0,
              zIndex: 'initial'
            });
            callback();
          });
        },

        swapIndexPositions: function (widgetCells, old_index, new_index) {
          var temp = widgetCells[old_index];
          widgetCells[old_index] = widgetCells[new_index];
          widgetCells[new_index] = temp;
          return widgetCells;
        },

        findPositions: function (movableEle, destEle) {
          return {
            movableEle: movableEle.offset(),
            destEle: destEle.offset()
          };
        }
      });
    },
  };

  return DragAndDropKNMixin;
});


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/impl/pman',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <li>\r\n            <button class=\"binf-btn icon-reset\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "\"\r\n                    aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"resetAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"reset") : depth0), depth0))
    + "</button>\r\n          </li>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"pman-backdrop\"></div>\r\n<div class=\"pman-header\">\r\n  <div class=\"pman-header-backdrop\"></div>\r\n  <div class=\"pman-tools-container\">\r\n    <div class=\"pman-left-tools\">\r\n      <ul>\r\n        <li class=\"pman-toolitem\">\r\n          <button class=\"icon icon-toolbarAdd\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"addWidget") : depth0), depth0))
    + "\"></button>\r\n        </li>\r\n      </ul>\r\n      <div class=\"pman-pannel-wrapper\"></div>\r\n    </div>\r\n    <div class=\"pman-right-tools\">\r\n      <ul>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"personalizeMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":15,"column":8},"end":{"line":20,"column":15}}})) != null ? stack1 : "")
    + "        <li>\r\n          <button class=\"binf-btn icon-save\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "\"\r\n                  aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"saveAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"save") : depth0), depth0))
    + "</button>\r\n        </li>\r\n        <li>\r\n          <button class=\"binf-btn cancel-edit\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "\"\r\n                  aria-label=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancelAriaLabel") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"cancel") : depth0), depth0))
    + "</button>\r\n        </li>\r\n      </ul>\r\n    </div>\r\n  </div>\r\n  <div class=\"pman-trash-area\">\r\n    <div class=\"pman-trash-banner\"></div>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_impl_pman', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/impl/pman',[],function(){});
csui.define('csui/perspective.manage/behaviours/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/perspective.manage/behaviours/impl/nls/root/lang',{
  deleteConfirmMsg: 'Widget will be removed from the page.',
  deleteConfirmTitle: 'Remove Widget',
  replaceConfirmMsg: 'Do you want to replace this widget?',
  replaceConfirmTitle: 'Replace Widget',
  widgetSizeTitle: 'Widget size',
  widgetSizeDescription: 'Determines how much space the widget occupies. Note that widgets are re-sized automatically to display optimally on smaller screens.',
  removeWidget: 'Remove widget',
  editWidget: 'Widget settings',
  replace: 'Replace',
  remove: 'Remove',
  cancel: 'Cancel',
  configNeeded: 'Configuration needed.',
  hideWidget: 'Hide',
  showWidget: 'Display',
  personalizeModewidgetFocusLabel: '{0} widget. Press Enter to access {1} action. Press Ctrl+ Right or Left Arrow to move the widget to the right or left .',
  personalizeShortcutwidgetFocusLabel: '{0}. Press Enter to access {1} action. Press Ctrl+ Right or Left Arrow to move the widget to the right or left .',
  editModewidgetFocusLabel: '{0} widget. Press Enter to access associated actions. Press Ctrl+ Right or Left  Arrow to move the widget to the right or left.',
  widgetSettings: '{0} widget settings',
  objects: '{0} widget shows {0} objects of the current user',
  delete: 'remove {0} Widget',
  hideWidgetAriaLabel: 'Hide {0} Widget',
  showWidgetriaLabel: 'Display {0} Widget',
  info: 'Info about {0}'
});



/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/behaviours/impl/widget.masking',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-pman-widget-error\">\r\n      <div class=\"csui-pman-widget-error-heading\"> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":7,"column":51},"end":{"line":7,"column":66}}}) : helper)))
    + "</div>\r\n      <div class=\"csui-pman-widget-error-body\">\r\n        <div class=\"csui-pman-widget-error-icon\"></div>\r\n        <div class=\"csui-pman-widget-error-message\"> "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"configNeeded") || (depth0 != null ? lookupProperty(depth0,"configNeeded") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"configNeeded","hash":{},"loc":{"start":{"line":10,"column":53},"end":{"line":10,"column":69}}}) : helper)))
    + "</div>\r\n      </div>\r\n    </div>\r\n    <div class=\"csui-pman-perspective-actions\">\r\n      <button class=\"csui-pman-perspective-btn csui-pman-widget-edit icon-edit\"\r\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editWidget") || (depth0 != null ? lookupProperty(depth0,"editWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editWidget","hash":{},"loc":{"start":{"line":15,"column":21},"end":{"line":15,"column":35}}}) : helper)))
    + "\"></button>\r\n      <button class=\"csui-pman-perspective-btn csui-pman-widget-close clear-icon\"\r\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"removeWidget") || (depth0 != null ? lookupProperty(depth0,"removeWidget") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"removeWidget","hash":{},"loc":{"start":{"line":17,"column":21},"end":{"line":17,"column":37}}}) : helper)))
    + "\"></button>\r\n    </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-pman-widget-personalize-mask text-center\">\r\n      <button class=\"binf-btn csui-pman-personalize-btn csui-pman-hide-show-toggle\"\r\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideShowToggle") || (depth0 != null ? lookupProperty(depth0,"hideShowToggle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideShowToggle","hash":{},"loc":{"start":{"line":22,"column":21},"end":{"line":22,"column":39}}}) : helper)))
    + "\"\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isWidgetHidden") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"loc":{"start":{"line":23,"column":8},"end":{"line":27,"column":15}}})) != null ? stack1 : "")
    + "      >"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideShowToggle") || (depth0 != null ? lookupProperty(depth0,"hideShowToggle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideShowToggle","hash":{},"loc":{"start":{"line":28,"column":7},"end":{"line":28,"column":25}}}) : helper)))
    + "\r\n      </button>\r\n    </div>\r\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showWidgetriaLabel") || (depth0 != null ? lookupProperty(depth0,"showWidgetriaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showWidgetriaLabel","hash":{},"loc":{"start":{"line":24,"column":26},"end":{"line":24,"column":48}}}) : helper)))
    + "\"\r\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"hideWidgetAriaLabel") || (depth0 != null ? lookupProperty(depth0,"hideWidgetAriaLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"hideWidgetAriaLabel","hash":{},"loc":{"start":{"line":26,"column":26},"end":{"line":26,"column":49}}}) : helper)))
    + "\"\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-pman-popover-right csui-pman-popover-holder\"></div>\r\n<div class=\"csui-pman-popover-left csui-pman-popover-holder\"></div>\r\n<button class=\"binf-btn wrapper-button\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetName") || (depth0 != null ? lookupProperty(depth0,"widgetName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetName","hash":{},"loc":{"start":{"line":3,"column":52},"end":{"line":3,"column":66}}}) : helper)))
    + "\"></button>\r\n<div class=\"csui-pman-widget-masking\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isEditMode") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":5,"column":2},"end":{"line":31,"column":9}}})) != null ? stack1 : "")
    + "</div>\r\n\r\n";
}});
Handlebars.registerPartial('csui_perspective.manage_behaviours_impl_widget.masking', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/behaviours/impl/widget.masking',[],function(){});
/**
 * Responsibilities:
 *  - Masking the unit level widget of perpsective. In case of grid.view, it will be cell
 *  - Listen and handle DnD of widgets and act accordingly - replace widgets
 *  - Fire "replace:widget" on dropping of any widget
 *  - Deleting a widget from perspective
 *  - Configuration of widget using callouts
 *
 * Usage:
 *  - Should be applied to widgets of perspective to be able to configure them
 *
 * Required Inputs:
 *  - perspectiveView
 *  - widgetView
 *
 * Events:
 *  - replace:widget
 *    - Fires on perspectiveView
 *    - When dropping any widget from tools on perpsective widget
 *  - delete:widget
 *    - Fires on perspectiveView
 *    - When deleting a perspective widget
 *  - update:widget:size
 *    - Firex Fires on perspectiveView
 *    - When change in size of widget
 *  - update:widget:config
 *    - Firex Fires on perspectiveView
 *    - When widget configuration options updated
 */
csui.define('csui/perspective.manage/behaviours/pman.widget.config.behaviour',['require', 'i18n', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/base', 'csui/lib/backbone', 'csui/utils/log',
  'csui/models/widget/widget.model',
  'csui/perspective.manage/impl/options.form.view',
  'i18n!csui/perspective.manage/behaviours/impl/nls/lang',
  'hbs!csui/perspective.manage/behaviours/impl/widget.masking',
  'csui/utils/perspective/perspective.util',
  'css!csui/perspective.manage/behaviours/impl/widget.masking',
], function (require, i18n, _, $, Marionette, base, Backbone, log, WidgetModel,
    WidgetOptionsFormView, lang, maskingTemplate, PerspectiveUtil) {
  'use strict';

  var DEFAULTS = {
    removeConfirmMsg: lang.deleteConfirmMsg,
    removeConfirmTitle: lang.deleteConfirmTitle,
    configNeededMessage: lang.configNeeded,
    confirmOnRemove: true,
    allowReplace: true,
    notifyUpdatesImmediatly: false,
    perspectiveMode: 'edit'
  };

  /**
   * View to mask the perspective widget and handles the widget configuration
   */
  var WidgetMaskingView = Marionette.ItemView.extend({
    template: maskingTemplate,
    className: function () {
      var classNames = [WidgetMaskingView.className, 'csui-widget-focusable'];
      classNames.push('csui-pman-widget-mode-' + this.options.perspectiveMode);
      classNames.push(this._getStateClass());
      return _.unique(classNames).join(' ');
    },

    _getStateClass: function () {
      var isHidden = PerspectiveUtil.isHiddenWidget(this.options.widgetConfig),
          widgetState = isHidden ? 'hidden' : 'shown';
      return 'csui-pman-widget-state-' + widgetState;
    },

    templateHelpers: function () {
      var hideShowToggle = PerspectiveUtil.isHiddenWidget(this.options.widgetConfig) ?
                           lang.showWidget : lang.hideWidget;
      return {
        removeWidget: this.options.removeConfirmTitle,
        editWidget: lang.editWidget,
        widgetTitle: this.manifest && this.manifest.title,
        configNeeded: this.options.configNeededMessage,
        isEditMode: this.isEditPage(),
        isWidgetHidden: PerspectiveUtil.isHiddenWidget(this.options.widgetConfig),
        hideShowToggle: hideShowToggle,
        widgetName: this._getWidgetName(),
        hideWidgetAriaLabel: _.str.sformat(lang.hideWidgetAriaLabel, this._getWidgetName()),
        showWidgetriaLabel: _.str.sformat(lang.showWidgetriaLabel, this._getWidgetName())
      }
    },

    ui: {
      edit: '.csui-pman-widget-edit',
      delete: '.csui-pman-widget-close',
      masking: '.csui-pman-widget-masking',
      widgetTitle: '.csui-pman-widget-error-heading',
      wrapperButton: '.wrapper-button',
      hideShowToggle: '.csui-pman-hide-show-toggle'
    },

    configureEvents: {
      'click @ui.masking': '_showCallout',
      'click @ui.delete': 'onDeleteClick'
    },

    personalizationEvents: {
      'click @ui.hideShowToggle': '_onHideShowWidget'
    },

    events: function () {
      var evts = {
        'keydown': 'onKeyDown',
        'click @ui.wrapperButton': '_onClicked'
      };
      switch (this.options.perspectiveMode) {
      case 'edit':
        evts = _.extend(evts, this.configureEvents);
        if (!!this.options.allowReplace) {
          evts = _.extend(evts, {
            'drop': 'onDrop',
            'dragover': 'onDragOver',
            'dragenter': 'onDragEnter',
            'dragleave': 'onDragLeave'
          });
        }
        break;
      case 'personalize':
        evts = _.extend(evts, this.personalizationEvents);
        if (this.options.personalizable) {
          evts = _.extend(evts, this.configureEvents);
        }
        break;
      }
      return evts;
    },

    constructor: function WidgetMaskingView(options) {
      options = _.defaults(options, DEFAULTS);
      Marionette.ItemView.apply(this, arguments);
      this.dropCounter = 0;
      this.manifest = options.manifest;
      this.perspectiveView = options.perspectiveView;
      this.widgetView = options.widgetView;
      this.widgetConfig = options.widgetConfig;
      this.perspectiveMode = options.perspectiveMode;
      this.listenTo(this.widgetView, 'refresh:mask', this._doRefreshMask);
      this.listenTo(this.widgetView, 'reposition:flyout', function () {
        if (!!this.$popoverEl && this.$popoverEl.data('binf.popover')) {
          this._previousFocusElm = document.activeElement;
          this.$popoverEl.binf_popover('show');
          // restore focus on previous focusing element
          this.options.notifyUpdatesImmediatly && this._previousFocusElm &&
          $(this._previousFocusElm).trigger('focus');
        }
      });
    },

    _onClicked: function (event) {
      var $target = $(event.target);
      if ($target.is(this.$el.find('.wrapper-button'))) {
        this._enterConfiguration(event);
        return false;
      }
      return true;
    },

    handlePopoverClick:  function (event) {
       var self = event.data.view;
       self.writeFieldClicked = true;
    },

    onKeyDown: function (event) {
      var continueEvent = true,
          $target = $(event.target),
          isFormEvent = this.optionsFormView && this.optionsFormView.$el.has($target).length,
          cancelBtn = $('.perspective-editing .pman-header .cancel-edit'),
          perspective = $('.perspective-editing .cs-perspective-panel .cs-perspective'),
          isMac = base.isMacintosh(),
          superKey = isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey && event.ctrlKey;
      if (superKey && ($target.is('input:text') || $target.is('textarea'))) {
        event.stopPropagation();
      }
      //TODO: need to find a check to avoid clearFocuable everytime
      //this logic only happens in edit mode specific to KN, so perfomance wise low impact
      !this.widgetView.$el.find('.binf-popover').length &&
      base.clearFocusables(perspective.find('.tile, .csui-nodestable'));
      switch (event.keyCode) {
      case 13: // ENTER
      case 32: // SPACE
        if ($target.is(this.ui.hideShowToggle)) {
          continueEvent = this._onHideShowWidget();
        } else {
          continueEvent = this._onClicked(event);
        }
        break;
      case 27: // ESCAPE
        if (isFormEvent) {
          this._hideCallout();
          if (!this.options.useEnterToConfigure) {
            this.ui.edit && this.ui.edit.trigger('focus');
            continueEvent = false;
          }
        } else if (!this.options.useEnterToConfigure &&
                   !$target.is(this.$el.find('.wrapper-button'))) {
          this._exitConfiguration();
          continueEvent = false;
        }
        break;
      case 9: // TAB
        if (!isFormEvent && this.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
          var $target = $(event.target);
          if (!$target.is(this.$el.find('.wrapper-button'))) {
            this.ui.delete.is(":focus") ? this.ui.edit.trigger('focus') :
            this.ui.delete.trigger('focus');
            continueEvent = false;
          }
        } else if (event.shiftKey && $target.is($('.wrapper-button').first())) {
          cancelBtn.trigger('focus');
          continueEvent = false;
        }
        if (event.shiftKey && $target.is($('.wrapper-button'))) {
          var index = $(document.activeElement).closest(
              '.csui-draggable-item.csui-pman-editable-widget').index(),
              widgetEle = $('.csui-dnd-container>.csui-pman-editable-widget'),
              prevWidgetEleTop = widgetEle.eq(index - 1).offset().top,
              isWidgetInSameRow = widgetEle.eq(index).offset().top === prevWidgetEleTop;
          if (!isWidgetInSameRow) {
            var scrollPosition = index < 0 ? 0 : prevWidgetEleTop - $('.pman-header').height();
            // $('html, body') is because of web browser inconsistency.  The browsers Firefox & IE utilize
            // the html portion , Safari and Chrome respond to the body
            $("html, body").animate({
              scrollTop: scrollPosition
            }, 0);
          }
        }
        break;
      default:
        if ($target.is('.csui-pman-perspective-btn') || $target.is('.csui-pman-personalize-btn')) {
          // Cancel all events on buttons - SHOW/HIDE/DELETE/EDIT
          continueEvent = false;
        }
      }
      return continueEvent;
    },

    _enterConfiguration: function (event) {
      this.$el.addClass('csui-pman-widget-active');
      if (this.options.useEnterToConfigure) {
        // For empty placeholder, pressing ENTER when the focus on it, the flyout should open directly
        this._showCallout(event);
      } else {
        this.$el.find('button:not(.wrapper-button):visible') &&
        this.$el.find('button:not(.wrapper-button):visible').first().trigger('focus');
      }
    },

    _exitConfiguration: function () {
      this.$el.removeClass('csui-pman-widget-active');
      this.ui.wrapperButton.trigger('focus');
      this._hideCallout();
    },

    _getWidgetName: function () {
      return this.manifest && this.manifest.title ? this.manifest.title :
             this.options && this.options.widgetConfig &&
             this.options.widgetConfig.type.split("/").pop();
    },

    _clearViewTabIndexes: function () {
      this.widgetView.$el.off();
      var that = this;
      function clearTabIndex() {
        var isHidden = PerspectiveUtil.isHiddenWidget(that.options.widgetConfig);
        !that.widgetView.$el.find('.binf-popover').length &&
        base.clearFocusables(that.widgetView.$el);
        var focusableEle = that.$el.find('.wrapper-button'),
            widgetFocusAriaLabel = that._getWidgetName(),
            notifyUpdatesImmediatly = that.options.notifyUpdatesImmediatly;
        if (that.options.ItemsInGroupAriaLabel) {
          widgetFocusAriaLabel = " " + that.options.ItemsInGroupAriaLabel;
          focusableEle = focusableEle
              .closest(".csui-draggable-item").children('.csui-pman-widget-mode-personalize')
              .find(".wrapper-button");
        }
        if (that.options.perspectiveMode === "edit" && !notifyUpdatesImmediatly) {
          widgetFocusAriaLabel = _.str.sformat(lang.editModewidgetFocusLabel, widgetFocusAriaLabel);
        } else {
          isHidden && focusableEle.attr('data-hidden', isHidden);
          var action = focusableEle.attr('data-hidden') ? lang.showWidget : lang.hideWidget,
              label = notifyUpdatesImmediatly ? lang.personalizeShortcutwidgetFocusLabel :
                      lang.personalizeModewidgetFocusLabel;
          widgetFocusAriaLabel = _.str.sformat(label, widgetFocusAriaLabel, action);
        }
        focusableEle
            .attr("tabindex", 0)
            .attr("aria-label", widgetFocusAriaLabel);
      }

      this.listenTo(this.widgetView, "dom:refresh", clearTabIndex);
      clearTabIndex();
    },

    _isConfigurable: function () {
      return !!this.widgetConfig && !_.isEmpty(this.widgetConfig) &&
             this.widgetConfig.type !== WidgetMaskingView.placeholderWidget &&
             this.widgetConfig.type !== 'csui/widgets/error';
    },

    isEditPage: function () {
      return this.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE;
    },

    onRender: function () {
      if (!this._isConfigurable()) {
        this._clearViewTabIndexes();
        // Widget configuration not found. Hence cannot show callout
        return;
      }
      var self = this;
      this._loadManifest().done(function (manifest) {
        var configurableWidgetClass = manifest.hasConfigForm ? 'csui-widget-perspective-config' :
                                      'csui-widget-perspective-info';
        self.$el.addClass(configurableWidgetClass);

        if (self.options.perspectiveMode === "edit") {
          if (self.$el.parent().find(".cs-no-expanding").length) {
            self.ui.edit
                .attr(
                    "aria-label",
                    _.str.sformat(lang.objects, manifest.title)
                ).attr('title', _.str.sformat(lang.info, manifest.title));
          } else {
            self.ui.edit.attr(
                "aria-label",
                _.str.sformat(lang.widgetSettings, manifest.title)
            );
          }
          self.ui.delete.attr(
              "aria-label",
              _.str.sformat(lang.delete, manifest.title)
          );
        }
        self.ui.widgetTitle.text(manifest.title);
        if (self.manifest.selfConfigurable) {
          self._adoptToSelfConfigurableWidget();
        } else if (self.isEditPage() || self.options.personalizable) {
          self._clearViewTabIndexes();
          self._createOptionsForm(function () {
            if (this.isDestroyed) {
              // Masking destroyed even before form render. No action required.
              return;
            }
            var openCallout = !!self.widgetConfig.options &&
                              (self.widgetConfig.options.___pman_isdropped ||
                               self.widgetConfig.options.___pman_opencallout);
            var isWidgetReplaced = self._updateWidgetOptions(false, true);
            // Refresh form to remove validation error messages created by default validation (above statement)
            self.optionsFormView.refresh(function () {
              self.$el.addClass('cs-pman-callout-ready');
              self.$el.addClass('cs-pman-config-ready');
              if (openCallout && !isWidgetReplaced) {
                self._showOptionsCallout(manifest, true);
              }
            });
          });
        } else {
          self.$el.addClass('cs-pman-config-ready');
          self._clearViewTabIndexes();
        }
      });
    },

    onDestroy: function () {
      this.optionsFormView && this.optionsFormView.destroy();
    },

    _adoptToSelfConfigurableWidget: function () {
      if (!PerspectiveUtil.isEmptyPlaceholder(this.widgetConfig, this.perspectiveMode)
          && this.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE &&
          !PerspectiveUtil.isPersonalWidget(this.widgetConfig)) {
        // Though this widget self configurable, only personal widget can be configured in "Personalize Page".
        this._clearViewTabIndexes();
        return;
      }
      this.$el.addClass('csui-has-editing-capability');
      delete this.widgetConfig.options.___pman_isdropped;
      this.listenTo(this.widgetView, 'update:widget:options', function (options) {
        delete this.widgetConfig.options.___pman_isdropped;
        this._notifyConfigChanges(options, options.isValid, false);
      });
      this.listenTo(this.widgetView, 'remove:widget', this._doDeleteWidget);
      this.listenTo(this.widgetView, 'replace:widget', this.onDrop);
    },

    // Instead of re-rendering the whole mask, which would close flyout, just update DOM manually with titles, text changes etc.,
    _doRefreshMask: function (options) {
      this.options = _.extend({}, this.options, DEFAULTS, options);
      this.ui.delete.attr("title", this.options.removeConfirmTitle);
    },

    _showCallout: function (event) {
      if (this.isDestroyed) {
        return;
      }
      if (!this._isConfigurable()) {
        // Widget configuration not found. Hence cannot show callout
        return;
      }
      // To prevent default click action and open fly out
      event.preventDefault();
      event.stopPropagation();
      if (!!this.ui.delete.is(event.target)) {
        // avoid showing popover on click of remove widget icon
        return;
      }
      // open widget configuration callout
      this._loadManifest().done(function (manifest) {
        this._showOptionsCallout(manifest);
      }.bind(this));
      $('.perspective-editing .cs-perspective-panel .cs-field-write').off('click.' + this.cid).on(
        'mousedown.' + this.cid, {
          view: this
        },
        this.handlePopoverClick);
    },

    _showOptionsCallout: function (manifest, forceShow) {
      if (this.isDestroyed) {
        return;
      }
      //To resolve LPAD-73913 defect.
      if (base.isIE11() && !!document.activeElement) {
        document.activeElement.blur();
      }
      if (!!this.$popoverEl && this.$popoverEl.data('binf.popover')) {
        // Currently showing popover. Close it.
        this.$popoverEl.binf_popover('destroy');
        return;
      }
      if (this.$el.closest(".cs-perspective").find(".binf-popover").length) {
        this._closePopover();
        if (!forceShow) {
          // Callee asked to show flyout, hence, continue showing it. Dont return.
          return;
        }
      }
      this._calculatePopoverPlacement();

      if (!!this.optionsFormView) {
        // Toggle. Open popover with existing form.view
        this._showPopover();
      } else {
        this._createOptionsForm();
      }
    },

    _closePopover: function () {
      this.$el.closest(".cs-perspective").find('.' + WidgetMaskingView.className +
                                               ' .csui-pman-popover-holder').binf_popover(
          'destroy');
    },

    _createOptionsForm: function (afterRenderCallback) {
      this.optionsFormView = new WidgetOptionsFormView(_.defaults({
        context: this.perspectiveView.options.context,
        manifest: this.manifest
      }, this.options));
      if (!!afterRenderCallback) {
        this.optionsFormView.listenToOnce(this.optionsFormView, 'render:form', afterRenderCallback);
      }
      this.optionsFormView.render();
      this.optionsFormView.listenTo(this.optionsFormView, 'change:field',
          this._onChangeField.bind(this));
    },

    _calculatePopoverPlacement: function () {
      var adjust = this._determineCalloutPlacement();
      this.$popoverEl = this.$el.find('.csui-pman-popover-' + adjust.placement);
      if (adjust.mirror) {
        adjust.placement = adjust.placement == 'right' ? 'left' : 'right';
      }
      this.placement = adjust.placement;
      this.$popoverContainer = $(
          '<div class="binf-popover pman-widget-popover pman-ms-popover" role="tooltip" tabindex=0><div class="binf-arrow"></div><h3 class="binf-popover-title"></h3><div class="binf-popover-content"></div></div>');
      this.$popoverContainer.css("max-width", adjust.availableSpace + "px");
    },

    /**
     * Determite callout position and show widget configuration callout
     */
    _showPopover: function () {
      var popoverOptions = {
        html: true,
        content: this.optionsFormView.el,
        trigger: 'manual',
        viewport: { // Limit popover placement to perspective panel only
          selector: this.options.perspectiveView && this.options.perspectiveView.$el.parent()[0], //this.options.perspectiveSelector,
          padding: 18
        },
        placement: this.placement,
        template: this.$popoverContainer,
        animation: false
      };
      this.$popoverEl.binf_popover(popoverOptions);
      this.$popoverEl.off('hidden.binf.popover')
          .on('hidden.binf.popover', this._handleCalloutHide.bind(this));
      this.$popoverEl.binf_popover('show');
      //To change the border color to red for non supported widgets.
      this.optionsFormView.onPopoverShow(this.$popoverContainer);
      this.optionsFormView.$el.find('.cs-formview-wrapper').trigger('refresh:setcontainer');
      this._registerPopoverEvents();
      this.optionsFormView.trigger('ensure:scrollbar');
      // TODO Use title of on formview as labelledBy instead of hidden popover title.
      // Currently empty H tag failed html validation, hence fill it will title.
      var popover = this.$popoverEl.next(".binf-popover"),
          popoverLabelElemId = _.uniqueId('popoverLabelId'),
          popoverHeader = popover.find('>.binf-popover-title');
      if (popoverHeader) {
        popoverHeader.attr('id', popoverLabelElemId);
        popoverHeader.html(this.manifest.title);
        popover.attr('aria-labelledby', popoverLabelElemId);
      }
      $('.perspective-editing .cs-perspective-panel .cs-field-write').on('keydown.' + this.cid).on(
        'mousedown.' + this.cid, {
          view: this
        },
        this.handlePopoverClick);
    },

    _hideCallout: function () {
      this.$popoverEl && this.$popoverEl.binf_popover('destroy');
      $('.perspective-editing .cs-perspective-panel .cs-field-write').off('keydown.' + this.cid).off(
        'mousedown.' + this.cid);
    },

    _registerPopoverEvents: function () {
      $('.perspective-editing .cs-perspective-panel').off('click.' + this.cid).on(
          'click.' + this.cid, {
            view: this
          },
          this._documentClickHandler);
      $('.pman-container').off('click.' + this.cid).on('click.' + this.cid, {
        view: this
      }, this._documentClickHandler);
      $(window).off('click.' + this.cid).on('resize.' + this.cid, {
        view: this
      }, this._windowResizeHandler);
    },

    _windowResizeHandler: function (event) {
      var self = event.data.view;
      // closing opened popover on window resize
      self._hideCallout();
    },

    _unregisterPopoverEvents: function () {
      $('.perspective-editing .cs-perspective-panel').off('click.' + this.cid,
          this._documentClickHandler);
      $('.pman-container').off('click.' + this.cid, this._documentClickHandler);
      $(window).off('resize.' + this.cid, this._windowResizeHandler);
    },

    /**
     * Handle callout data update to widget on hidding of popover
     */
    _handleCalloutHide: function () {
      this._validateWidgetConfig();
      this._unregisterPopoverEvents();
      delete this.widgetConfig.options.___pman_opencallout;
      this._updateWidgetOptions(true);
      this._enableorDisableSaveButton();
    },

    _validateWidgetConfig: function () {
      var options = this.optionsFormView.getValues(),
          isValid = this.optionsFormView.validate();
      if (_.isFunction(this.widgetView.validateConfiguration)) {
        isValid = isValid && this.widgetView.validateConfiguration(options);
      }
      var action = !isValid ? 'addClass' : 'removeClass';
      this.$el[action]('binf-perspective-has-error');
    },

    _enableorDisableSaveButton: function () {
      var saveBtn = $('.perspective-editing .pman-header .icon-save'),
          hasError = $('.perspective-editing').find(".binf-perspective-has-error").length > 0;
      saveBtn.prop('disabled', hasError);
    },

    /**
     * Triggered on changing of any widget's options on form.
     * Recreates the widgets with latest options (only if valid) to make sure widget is showing live data.
     *
     * Parameters:
     *  - reloadForLiveData: widget required to be re-created to get the changes reflected
     *  - softUpdate: Trigger change even without reloading the widget
     *
     */
    _updateWidgetOptions: function (reloadForLiveData, softUpdate) {
      var isValid = this.optionsFormView.validate(),
          options = this.optionsFormView.getValues();
      softUpdate = _.isUndefined(softUpdate) ? !reloadForLiveData : softUpdate
      var isWidgetReplaced = this._notifyConfigChanges(options, isValid, reloadForLiveData,
          softUpdate);
      this._enableorDisableSaveButton();
      return isWidgetReplaced;
    },

    _notifyConfigChanges: function (options, isValid, reloadForLiveData, softUpdate) {
      options = options || {};
      var oldOptions = this.widgetConfig.options || {};
      var isOptionsSame = _.isEqual(oldOptions, options);
      this.perspectiveView.trigger("update:widget:options", {
        widgetView: this.widgetView,
        isValid: isValid,
        options: options,
        softUpdate: softUpdate
      });

      if (isOptionsSame) {
        // Avoid widget recreation when options not changed.
        return;
      }

      if (!!isValid) {
        // Check if widget should be recreated on options change (for live data). 
        if (!this.manifest.callback && (reloadForLiveData || oldOptions.___pman_isdropped)) {
          // Recreate with widget (for live data) for the first time after drop to provde widget the options with default values (from manifest)
          // OR Recreate widget with updated options.
          var widgetType = this.widgetConfig.type;
          if (this._isPreviewWidget()) {
            // Has valid options to initialize origianl widgets now
            var originalWidget = this.widgetConfig.options.widget;
            widgetType = originalWidget.id;
          }
          if (!!oldOptions.___pman_isdropped) {
            options = _.extend({___pman_opencallout: oldOptions.___pman_isdropped}, options);
          }
          var widgetToReplace = {
            type: widgetType,
            kind: this.widgetConfig.kind,
            options: options,
            cid: _.uniqueId('pman')
          };
          this.perspectiveView.trigger('replace:widget', this.widgetView, widgetToReplace);
          return true;
        }
      }
    },

    /**
     * Listen document click to close callouts
     */
    _documentClickHandler: function (event) {
      var self = event.data.view;
      if (!!$(event.target).closest('.binf-popover').length || self.writeFieldClicked) {
        // Click on popover
        self.writeFieldClicked = false;
        return;
      }
      if (!Marionette.isNodeAttached(event.target)) {
        // after click on element in popover, the element not exist in dom
        self.widgetView.trigger('reposition:flyout');
        return;
      }
      if (self.$el.is(event.target) ||
          (!!self.$el.has(event.target).length && !self.ui.delete.is(event.target)) ||
          self.widgetView.$el.is(event.target) || self.widgetView.$el.has(event.target).length) {
        // Click on current widget
        return;
      }
      self._unregisterPopoverEvents();
      self._hideCallout();
    },

    _onChangeField: function (field) {
      if (field.name === WidgetOptionsFormView.widgetSizeProperty) {
        // Notify perspective panel about size change to do respective DOM / style updates
        this.perspectiveView.trigger("update:widget:size", this.options.widgetView, field.value);
        // Close popover for now.
        this.$popoverEl.binf_popover('destroy');
        // TODO Re-position popover as widget size may change
        // this._calculatePopoverPlacement();
        // this._showPopover();
      } else if (this.options.notifyUpdatesImmediatly) {
        this._updateWidgetOptions(false, false);
        this.widgetView.trigger('reposition:flyout');
      }
    },

    _evalRequiredFormWidth: function () {
      // var formContainer = $("<div class='pman-widget-popover'/>");
      // formContainer.appendTo(document.body);

      this.optionsFormView.$el.addClass('pman-prerender-form');
      this.optionsFormView.$el.addClass('pman-widget-popover');
      this.optionsFormView.$el.appendTo(document.body);
      this.optionsFormView.$el.find('.cs-formview-wrapper').trigger('refresh:setcontainer');
      var formWidth = this.optionsFormView.$el.width();
      if (this.optionsFormView.$el.find('.csui-scrollablecols').length > 0) {
        formWidth += this.optionsFormView.$el.find('.csui-scrollablecols')[0].scrollWidth -
                     this.optionsFormView.$el.find('.csui-scrollablecols')[0].offsetWidth;
      }
      this.optionsFormView.$el.removeClass('pman-widget-popover');
      return formWidth;
    },

    _calculateSpaceAroundWidget: function () {
      var elWidth = this.$el.width(),
          elWidth = (elWidth / 2),
          documentWidth = $(document).width(),
          leftOffset = this.$el.find('.csui-pman-popover-left').offset().left,
          rightOffset = documentWidth - this.$el.find('.csui-pman-popover-right').offset().left;

      var aroundSpaces = {
        right: {
          placement: 'right',
          mirror: false,
          availableSpace: rightOffset
        },
        rightFlip: {
          placement: 'right',
          mirror: true,
          availableSpace: (documentWidth - rightOffset)
        },
        left: {
          placement: 'left',
          mirror: false,
          availableSpace: leftOffset
        },
        leftFlip: {
          placement: 'left',
          mirror: true,
          availableSpace: (documentWidth - leftOffset)
        }
      };
      return aroundSpaces;
    },

    _determineCalloutPlacement: function () {
      var isRtl = i18n && i18n.settings.rtl,
          formWidth = this._evalRequiredFormWidth() + 20, // For additional spacing around Form
          allSpaces = this._calculateSpaceAroundWidget(),
          i, perfectSpace, highSpace;

      var spacings = !isRtl ?
          [allSpaces.right, allSpaces.left, allSpaces.leftFlip, allSpaces.rightFlip] :
          [allSpaces.rightFlip, allSpaces.leftFlip, allSpaces.left, allSpaces.right];

      for (i = 0; i < spacings.length; i++) {
        var current = spacings[i];
        if (formWidth < current.availableSpace) {
          perfectSpace = current;
          break;
        }
        if (!highSpace || current.availableSpace > highSpace.availableSpace) {
          highSpace = current;
        }
      }
      if (!perfectSpace) {
        // Widget is not perfect fit in any edge. So take high availability
        perfectSpace = highSpace;
      }
      perfectSpace.availableSpace -= 20; // For additional spacing around popover.

      return perfectSpace;
    },

    _isPreviewWidget: function () {
      return this.widgetConfig.type === WidgetMaskingView.perspectiveWidget;
    },

    _addMoreManifestInfo: function () {
      var hasConfigForm = true;
      if (!this.manifest || !this.manifest.schema || !this.manifest.schema.properties ||
          _.isEmpty(this.manifest.schema.properties)) {
        // No configuration is available for this widget
        hasConfigForm = false;
      }
      this.manifest.hasConfigForm = hasConfigForm;
      return;
    },

    _loadManifest: function () {
      if (this.manifest !== undefined) {
        this._addMoreManifestInfo();
        return $.Deferred().resolve(this.manifest);
      }
      if (this._isPreviewWidget()) {
        // For widgets added using DnD, get manifest from perspective widget's options 
        // since Perspective widget will be added as preview for original widget
        this.manifest = this.widgetConfig.options.widget.get('manifest');
        return this._loadManifest();
      }
      var deferred    = $.Deferred(),
          widgetModel = new WidgetModel({
            id: this.widgetConfig.type
          });
      widgetModel.fetch().then(_.bind(function () {
        this.manifest = widgetModel.get('manifest');
        this._addMoreManifestInfo();
        deferred.resolve(this.manifest);
      }, this), function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    onDeleteClick: function (event) {
      this._closePopover();
      event.preventDefault();
      if (!this.options.confirmOnRemove) {
        this._doDeleteWidget();
      } else {
        var self = this;
        var index = this.$el.parents('.csui-draggable-item.csui-pman-editable-widget').index();
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
          alertDialog.confirmQuestion(self.options.removeConfirmMsg,
              self.options.removeConfirmTitle,
              {
                buttons: {
                  showYes: true,
                  labelYes: lang.remove,
                  showNo: true,
                  labelNo: lang.cancel
                }
              })
              .always(function (result) {
                if (result) {
                  self._doDeleteWidget();
                  self._doSpecificWidgetFocusble(index);
                } else {
                  self.ui.delete.trigger('focus');
                }
              });
        });
      }
    },

    // accepts the index of widget and make that widget focusable
    _doSpecificWidgetFocusble: function (index) {
      var widgetEle = $('.csui-dnd-container>.csui-pman-editable-widget').eq(index).children(
          '.csui-widget-focusable').find('.wrapper-button');
      widgetEle.trigger('focus');
    },

    _doDeleteWidget: function () {
      this.perspectiveView.trigger("delete:widget", this.widgetView);

      this.perspectiveView.options.context.trigger('update:widget:panel', {
        'action': 'delete',
        'widgetModel': this.widgetView.model.get('widget')
      });

      this._enableorDisableSaveButton();
    },

    _doReplaceWidget: function (widgetToReplace, existingWidget) {
      var manifest = (widgetToReplace.get('manifest') || {}),
          newWidget = { // Widget is able to intialize with default (empty) options.
            type: widgetToReplace.id,
            kind: manifest.kind
          };
      if (!PerspectiveUtil.isEligibleForLiveWidget(manifest)) {
        // Widget has few required options / has callback. Hence create generic "perspective widget preview" widget
        newWidget = {
          type: WidgetMaskingView.perspectiveWidget,
          kind: manifest.kind,
          options: {
            options: {}, // To be used and filled by callout form
            widget: widgetToReplace
          }
        };
      }
      newWidget.options = _.extend({___pman_isdropped: true}, newWidget.options);
      this.perspectiveView.trigger('replace:widget', this.widgetView, newWidget);

      this.perspectiveView.options.context.trigger('update:widget:panel', {
        'action': !!existingWidget ? 'replace' : 'add',
        'widgetModel': newWidget,
        'oldWidgetModel': existingWidget
      });
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDragEnter: function (event) {
      event.preventDefault();
      this.dropCounter++;
      this.$el.siblings(".csui-perspective-placeholder").addClass('csui-widget-drop');
    },

    onDragLeave: function () {
      this.dropCounter--;
      if (this.dropCounter === 0) {
        this.$el.siblings(".csui-perspective-placeholder").removeClass('csui-widget-drop');
      }
    },

    _extractWidgetToDrop: function (event) {
      var dragData = event.originalEvent.dataTransfer.getData("text");
      if (!dragData) {
        return undefined;
      }
      try { // TODO get rid of try catch and handle like non-droppable object
        var widgetToReplace = new WidgetModel(JSON.parse(dragData));
        return widgetToReplace;
      } catch (e) {
        // Unsupported drop
        return false;
      }
    },

    onDrop: function (event) {
      event.preventDefault();
      this.onDragLeave();
      var widgetToReplace = this._extractWidgetToDrop(event);
      if (!widgetToReplace) {
        return;
      }
      if (this.widgetConfig.type === WidgetMaskingView.placeholderWidget) {
        this._doReplaceWidget(widgetToReplace);
      } else {
        var self = this;
        csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
          alertDialog.confirmQuestion(lang.replaceConfirmMsg, lang.replaceConfirmTitle, {
            buttons: {
              showYes: true,
              labelYes: lang.replace,
              showNo: true,
              labelNo: lang.cancel
            }
          })
              .done(function (userConfirmed) {
                if (userConfirmed) {
                  self._doReplaceWidget(widgetToReplace, self.widgetConfig);
                }
              });
        });
      }
    },

    _updateStyles: function () {
      var className = _.result(this, 'className');
      this.$el.attr('class', className);
    },

    _updateConfigChanges: function (isVisible) {
      this.$el.removeClass(this._getStateClass());
      PerspectiveUtil.setWidgetHidden(this.widgetConfig, isVisible);
      this._notifyConfigChanges(this.widgetConfig.options, true, false);
      this.$el.addClass(this._getStateClass());
    },

    _onHideShowWidget: function () {
      var hideShowBtnText;
      if (PerspectiveUtil.isHiddenWidget(this.options.widgetConfig)) {
        this.perspectiveView.trigger('before:show:widget', this.widgetView);
        this._updateConfigChanges(false);
        this.perspectiveView.trigger('show:widget', this.widgetView);
        hideShowBtnText = lang.hideWidget;
        this.ui.hideShowToggle.attr('aria-label',
        _.str.sformat(lang.hideWidgetAriaLabel, this._getWidgetName()))
        .attr('title',
            hideShowBtnText).text(hideShowBtnText);
      } else {
        this.perspectiveView.trigger('before:hide:widget', this.widgetView);
        this._updateConfigChanges(true);
        this.perspectiveView.trigger('hide:widget', this.widgetView);
        hideShowBtnText = lang.showWidget;
        this.ui.hideShowToggle.attr('aria-label',
        _.str.sformat(lang.showWidgetriaLabel, this._getWidgetName()))
        .attr('title',
            hideShowBtnText).text(hideShowBtnText);
      }
      this.$el.find('.wrapper-button').attr('aria-label',
          _.str.sformat(lang.personalizeModewidgetFocusLabel, this._getWidgetName(),
              hideShowBtnText));
      return false;
    }

  }, {
    className: 'csui-configure-perspective-widget',
    perspectiveWidget: 'csui/perspective.manage/widgets/perspective.widget',
    placeholderWidget: 'csui/perspective.manage/widgets/perspective.placeholder',
    widgetSizeProperty: '__widgetSize'
  });

  var PerspectiveWidgetConfigurationBehaviour = Marionette.Behavior.extend({
    defaults: {      
      perspectiveSelector: '.perspective-editing .cs-perspective > div'
    },

    constructor: function PerspectiveWidgetConfigurationBehaviour(options, view) {
      options || (options = {});
      options.perspectiveView = options.perspectiveView || view;
      this.perspectiveView = options.perspectiveView;
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      _.extend(this.perspectiveView, {
        getPManPlaceholderWidget: function () {
          return {
            type: WidgetMaskingView.placeholderWidget,
            options: {}
          };
        }
      })
    },

    _ensureWidgetElement: function () {
      if (!_.isObject(this.$widgetEl)) {
        // Consider element to add mask can be provided through options
        this.$widgetEl = this.options.el ? $(this.options.el) : this.view.$el;
      }
      if (!this.$widgetEl || this.$widgetEl.length === 0) {
        throw new Marionette.Error('An "el" ' + this.$widgetEl.selector + ' must exist in DOM');
      }
      return true;
    },

    _checkAndApplyMask: function () {
      this._ensureWidgetElement();
      if (this.$widgetEl.children('.' + WidgetMaskingView.className).length > 0) {
        // Mask exist
        return;
      }

      // Get data configured to widget
      var widgetConfig = this._resolveWidgetConfiguration();
      if (!widgetConfig) {
        throw new Marionette.Error({
          name: 'NoWidgetConfigurationError',
          message: 'A "widgetConfig" must be specified'
        });
      }
      if (this.maskingView && this.$widgetEl.has(this.maskingView.$el).length &&
          _.isEqual(widgetConfig, this.options.widgetConfig)) {
        // No change in configuration. No rerender of mask required.
        return;
      }
      this.maskingView && this.maskingView.destroy();
      this.maskingView = new WidgetMaskingView(
          _.extend(this.options, {
            widgetView: this.view,
            widgetConfig: widgetConfig
          }));
      this.maskingView.render();
      this.$widgetEl.append(this.maskingView.el);
      this.$widgetEl.addClass('csui-pman-editable-widget')
      // To be used perspective.view to show placeholder watermark
      this.$widgetEl.data('pman.widget', {
        attributes: {
          manifest: widgetConfig
        }
      });
      if (widgetConfig.type === WidgetMaskingView.placeholderWidget) {
        // Prevent perspective placeholder to participate in sorting.
        this.$widgetEl.removeClass('csui-draggable-item');
      }
    },

    _resolveWidgetConfiguration: function () {
      if (!!this.view.model && !!this.view.model.get('widget')) {
        // Try model of widget view - Flow, LCR, Grid.. who even using grid control 
        return this.view.model.get('widget');
      }
      if (!!this.view.getPManWidgetConfig && _.isFunction(this.view.getPManWidgetConfig)) {
        // Widget configuration can be provided though a function 
        return this.view.getPManWidgetConfig();
      }
      if (!!this.options.widgetConfig) {
        // Can be provided through behaviour's options
        return _.result(this.options, 'widgetConfig');
      }
    },

    onRender: function () {
      if (this.options.notifyUpdatesImmediatly && this.view.isUpdating) {
        return;
      }
      this._checkAndApplyMask();
      this.maskingView && this.maskingView._enableorDisableSaveButton();
    },

    onDestroy: function () {
      this.maskingView && this.maskingView.destroy();
      this.maskingView = undefined;
    }

  });

  return PerspectiveWidgetConfigurationBehaviour;

})
;
csui.define('csui/perspective.manage/pman.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/perspective.manage/impl/pman.panel.view',
  'csui/utils/perspective/perspective.util',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/user',
  'csui/models/perspective/personalization.model',
  'csui/perspectives/mixins/draganddrop.kn.mixin',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman',
  'i18n',
  'css!csui/perspective.manage/impl/pman',
  'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
  'csui/lib/jquery.ui/js/jquery-ui'
], function (_, $, Backbone, Marionette, base, NonEmptyingRegion, PManPanelView, PerspectiveUtil,
    ApplicationScopeModelFactory,
    NodeModelFactory, UserModelFactory, PersonalizationModel, DragAndDropKNMixin, lang, template, i18n) {

  var pmanContainer;

  var PManView = Marionette.ItemView.extend({
    className: function () {
      var classNames = ['pman', 'pman-container'];
      classNames.push('pman-mode-' + this.options.mode);
      return _.unique(classNames).join(' ');
    },

    template: template,

    templateHelpers: function () {
      return {
        addWidget: lang.addWidget,
        save: lang.save,
        saveAriaLabel: lang.saveAriaLabel,
        cancel: lang.cancel,
        cancelAriaLabel: lang.cancelAriaLabel,
        reset: lang.reset,
        resetAriaLabel: lang.resetAriaLabel,
        personalizeMode: this.mode === PerspectiveUtil.MODE_PERSONALIZE &&
                         (this.options.perspective.has('perspective_id') ||
                          this.options.perspective.has('id'))
      };
    },

    ui: {
      "pmanPanel": ".pman-header .pman-pannel-wrapper",
      'cancelEdit': '.pman-header .cancel-edit',
      'addIcon': '.pman-header .icon-toolbarAdd',
      'saveBtn': '.pman-header .icon-save',
      'trashArea': '.pman-header .pman-trash-area',
      'resetBtn': '.pman-header .icon-reset'
    },

    events: {
      'click @ui.cancelEdit': "onClickClose",
      'click @ui.addIcon': "togglePannel",
      'click @ui.saveBtn': "onClickSave",
      'click @ui.resetBtn': "onClickReset",
      'keydown': 'onKeyDown'
    },

    constructor: function PManView(options) {
      options || (options = {});
      _.defaults(options, {
        applyMasking: this.applyMasking.bind(this),
        container: document.body,
        mode: PerspectiveUtil.MODE_EDIT_PERSPECTIVE
      });
      options.container = $(options.container);
      this.context = options.context;
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.mode = options.mode;
      this._prepareForEdit(options.perspective);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._registerEventHandler();
    },

    _registerEventHandler: function () {
      this.listenTo(this, 'change:layout', function (newLayoutType) {
        this.perspective.setPerspective({
          type: newLayoutType,
          options: {perspectiveMode: this.mode}
        }, {silent: true});
        this._triggerEditMode();
        this.togglePannel();
      });
      this.listenTo(this, 'swap:layout', function (newLayoutType) {
        this.perspective.setPerspective({
          type: newLayoutType,
          options: this.perspective.attributes.perspective.options
        }, {silent: true});
        this.context.triggerMethod('swap:layout', this.perspective);
      });
      this.listenTo(this.context, 'save:perspective', this._savePerspective);
      // listen to change perspective and exit from edit mode
      this.listenTo(this.context, 'change:perspective', this._onChangePerspective);
      this.listenTo(this.context, 'retain:perspective', this._doExitPerspective);
      this.listenTo(this.context, 'finish:exit:edit:perspective', this._doCleanup);
    },

    _prepareForEdit: function (originalPerspective) {
      if (!originalPerspective) {
        throw new Error("Missing perspective");
      }
      this.perspective = this._clonePrespective(originalPerspective);
      if (this.perspective.isNew() && this.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        // No perspectives are configues to current node
        this.perspective.setPerspective(this._getDefaultPerspectiveConfig());
      }
      // var perspectiveOptions = this.perspective.getPerspective().options || {};
      // perspectiveOptions.perspectiveMode = this.mode;
    },

    _clonePrespective: function (original) {
      var perspectiveConfig = original.getPerspective();
      var config = JSON.parse(JSON.stringify(perspectiveConfig));
      original.setPerspective(config);
      return original;
    },

    show: function () {
      var container = this.getContainer(),
          region = new NonEmptyingRegion({
            el: container
          });
      region.show(this);
      return this;
    },

    getContainer: function () {
      if (!pmanContainer || !$.contains(this.options.container, pmanContainer)) {
        pmanContainer = $('<div>', {'class': 'binf-widgets'}).appendTo(this.options.container)[0]
      }
      return pmanContainer;
    },

    /**
     * Default perspective when no perspectives configured for a container
     */
    _getDefaultPerspectiveConfig: function () {
      // TODO check if LCR is relevant to all containers.
      return {
        "type": "left-center-right",
        "options": {
          "center": {
            "type": "csui/widgets/nodestable"
          }
        }
      };
    },

    /**
     * Updates / creates perspective
     */
    _savePerspective: function (perspectiveChanges) {
      if (!!perspectiveChanges && !!perspectiveChanges.error) {
        this.ui.saveBtn.prop('disabled', false);
        return;
      }
      this.perspective.update(perspectiveChanges);
      // Save perspective to server
      this.perspective.save().then(_.bind(this._onSaveSuccess, this),
          _.bind(this._onSaveError, this));
    },

    _onSaveSuccess: function () {
      var self = this;
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        this._showMessage("success", lang.perspectiveSaveSuccess);
      } else {
        this._showMessage("success", lang.personalizationSaveSuccess);
      }
      // Update context's perspective and exit from inline editing
      var contextPerspectiveMode = self.context.perspective.get('perspectiveMode') ||
                                   PerspectiveUtil.MODE_EDIT_PERSPECTIVE,
          sourceModel = self._getSourceModel();

      var updatePerspective = self.perspective.getPerspective();
      updatePerspective.id = self.perspective.getPerspectiveId();

      // Keep the perspective / personalization at sourceModel (received from server) up to date.
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        // Update only personalization of sourceModel's perspective
        var originalPerspective = sourceModel.get('perspective');
        sourceModel.set('perspective', _.defaults(updatePerspective, originalPerspective));
      } else {
        // Update only personalization of sourceModel's perspective
        var originalPerspective = sourceModel.get('perspective');
        sourceModel.set('perspective',
            _.defaults({personalizations: self.perspective.toJSON()}, originalPerspective));
      }

      if (contextPerspectiveMode === self.mode) {
        self.context.perspective.set(updatePerspective);
      } else if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        // Original perspective changed. And the current user has personalization of current page.
        // Merge latest perspective updates to personalization
        var personalization = new PersonalizationModel({}, {perspective: updatePerspective});
        personalization.setPerspective(self.context.perspective.toJSON());
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);

      } else if (self.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        // Update the personalizations to context. Since content is currently showing admin's perspective.
        // Probablt this is the first time user personalizing the page.
        var personalization = new PersonalizationModel({},
            {perspective: sourceModel.get('perspective')});
        personalization.setPerspective(updatePerspective);
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);
      }
      self._doExitPerspective();
    },

    _onSaveError: function (error) {
      this.ui.saveBtn.prop('disabled', false);
      // API error while saving..
      var errorMessage;
      if (error && error.responseJSON && error.responseJSON.error) {
        errorMessage = error.responseJSON.error;
      } else {
        var errorHtml = base.MessageHelper.toHtml();
        base.MessageHelper.reset();
        errorMessage = $(errorHtml).text();
      }
      this._showMessage("error", errorMessage);
    },

    _showMessage: function (type, message) {
      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        GlobalMessage.showMessage(type, message);
      });
    },

    onClickSave: function () {
      this.ui.saveBtn.prop('disabled', true);
      //Close collout if any open
      var popoverTarget = this.options.container.find(".binf-popover");
      if (popoverTarget.length) {
        popoverTarget.binf_popover('hide');
        // Added timeout to wait for closing popover, thus widget options will update properly
        setTimeout(_.bind(function () {
          this.context.triggerMethod('serialize:perspective', this.perspective);
        }, this), 1500);
      } else {
        this.context.triggerMethod('serialize:perspective', this.perspective);
      }
    },

    onClickReset: function () {
      var self = this;
      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        alertDialog.confirmQuestion(lang.resetConfirmMsg,
            lang.reset,
            {
              buttons: {
                showYes: true,
                labelYes: lang.reset,
                showNo: true,
                labelNo: lang.cancel
              }
            })
            .done(function (yes) {
              if (yes) {
                self._doReset();
              }
            });
      });
    },

    _doReset: function () {
      var sourceModel = this._getSourceModel();
      originalPerspective = JSON.parse(JSON.stringify(sourceModel.get('perspective')));
      originalPerspective.options = originalPerspective.options || {};
      originalPerspective.options.perspectiveMode = this.mode;
      var originalConfig = new Backbone.Model(originalPerspective);
      this.context.triggerMethod('enter:edit:perspective', originalConfig);
      this.listenToOnce(this.context, 'finish:enter:edit:perspective', function () {
        this._showMessage("success", lang.resetSuccessful);
      });
    },

    _getSourceModel: function (params) {
      var sourceModel;
      if (this.applicationScope.get('id') === 'node') {
        sourceModel = this.context.getModel(NodeModelFactory);
      } else if (!this.applicationScope.get('id')) {
        sourceModel = this.context.getModel(UserModelFactory);
      }
      return sourceModel;
    },

    onClickClose: function () {
      this._doExitPerspective();
    },

    togglePannel: function (event) {
      if (!this.ui.pmanPanel.hasClass('binf-active')) {
        // Reset before showing panel
        if (!(event.originalEvent.pointerType === 'mouse')) {
          this.$el.find('.csui-layout-tab').attr('tabindex', 0);
          this.$el.find('.csui-layout-tab').focus();
        }
        this._openToolsPanel();
      } else {
        this.$el.find('.csui-layout-tab').attr('tabindex', -1);
        this.$el.find('.cs-go-back').attr('tabindex', -1);
        this._closeToolsPanel();
      }
    },

    _openToolsPanel: function () {
      this.pmanPanelView.trigger('reset:items');
      this.ui.addIcon.addClass('binf-active');
      this.ui.addIcon.attr("title", lang.close);
      this.ui.pmanPanel.addClass('binf-active');
      this.pmanPanelView.triggerMethod("panel:open");
    },

    _closeToolsPanel: function () {
      this.ui.pmanPanel.removeClass('binf-active');
      this.ui.addIcon.attr("title", lang.addWidget);
      this.ui.addIcon.removeClass('binf-active');
    },

    applyMasking: function () {

    },

    _initializeWidgets: function () {
      if (this.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        // Personalize doesn't need to load all available widgets for DnD
        return;
      }
      this.pmanPanelRegion = new Marionette.Region({
        el: this.ui.pmanPanel
      });
      this.pmanPanelView = new PManPanelView({
        pmanView: this
      });
      this.pmanPanelRegion.show(this.pmanPanelView);
      _.isFunction(this.ui.trashArea.droppable) && this.ui.trashArea.droppable({
        tolerance: 'pointer',
        hoverClass: "pman-trash-hover",
        accept: function () {
          return false;
        }
      });
    },

    _triggerEditMode: function () {
      var perspectiveConfig = this.perspective.getPerspective();
      perspectiveConfig.options = perspectiveConfig.options || {};
      perspectiveConfig.options.perspectiveMode = this.mode;
      var perspective = new Backbone.Model(perspectiveConfig);
      this.context.triggerMethod('enter:edit:perspective', perspective);
      this.listenToOnce(this.context, 'finish:enter:edit:perspective', this._setFocusOnFirstWidget);
    },

    _beforeTransition: function () {
      var perspectiveContainer = this.options.container.find('.cs-perspective');
      this.options.container.addClass('perspective-editing-transition');
      base.onTransitionEnd(perspectiveContainer, function () {
        this.options.container.removeClass('perspective-editing-transition');
      }, this);
    },

    onRender: function () {
      var self = this;
      this._beforeTransition();
      this.options.container.addClass('perspective-editing');
      this.options.applyMasking();
      this._initializeWidgets();
      this._triggerEditMode();
      $(document).on('click.' + this.cid, {view: this}, this._documentClick);
      // applying draganddropmixin for flow perpective, for reordering widgets
      var applyKNMixin = this.perspective.get('type') === 'sidepanel-right' ||
        this.perspective.get('type') === 'sidepanel-left' ||
        this.perspective.get('type') === "flow" ||
        this.perspective.get('perspective').type === 'sidepanel-right' ||
        this.perspective.get('perspective').type === 'sidepanel-left' ||
        this.perspective.get('perspective').type === "flow";
      if (applyKNMixin) {
        $(document).on('keydown', {view: this}, this.onKeyInView);
      }
    },

    onKeyInView: function (event) {
      var isRtl = i18n && i18n.settings.rtl,
        self = event.data && event.data.view,
        continueEvent = true,
        isMac = base.isMacintosh();
      if ($(document.activeElement).parents('#banner').length > 0) {
        return;
      }
      if (isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey &&
          event.ctrlKey) {
        var $target = $(event.target),
            $targetParent = $target.closest('.csui-draggable-item'),
            widgetCells = self.options && self.options.context &&
                          self.options.context.widgetCollection &&
                          self.options.context.widgetCollection.at(0).columns.models;
        switch (event.keyCode) {
        case 39:
          isRtl ? self.moveToLeft($targetParent, $target, widgetCells) : self.moveToRight($targetParent, $target, widgetCells);
          continueEvent = false;
          break;
        case 37:
          isRtl ? self.moveToRight($targetParent, $target, widgetCells) : self.moveToLeft($targetParent, $target, widgetCells);
          continueEvent = false;
          break;
        }
      }
      return continueEvent;
    },


    _documentClick: function (event) {
      var self = event.data.view;
      if (self.ui.addIcon.is(event.target) || !!self.ui.addIcon.has(event.target).length) {
        // Add Icon
        return;
      }
      if (self.ui.pmanPanel.is(event.target) || !!self.ui.pmanPanel.has(event.target).length) {
        // Pman panel
        return;
      }
      self._closeToolsPanel();
    },

    _onChangePerspective: function () {
      this._doCleanup();
    },

    _doCleanup: function () {
      var popoverTarget = this.options.container.find(".binf-popover");
      this._beforeTransition();
      if (popoverTarget.length) {
        popoverTarget.binf_popover('destroy');
      }
      this.options.container.removeClass('perspective-editing');
      $(document).off('click.' + this.cid, this._documentClick);
      $(document).off('keydown', this.onKeyInView);
      this.trigger('destroy');
    },

    /**
     * Edit from perspective inline editing mode.
     */
    _doExitPerspective: function () {
      this.context.triggerMethod('exit:edit:perspective', this.perspective);
    },

    // Move focus to first widget of Perspective Panel
    _setFocusOnFirstWidget: function () {
      var focusableEle = this.options.container.find(
          '.cs-perspective-panel .cs-perspective .csui-pman-editable-widget').first(),
          shortcutButton = focusableEle.find('.shortcut-group-wrapper');
      if (shortcutButton.attr('tabindex') === '0') {
        shortcutButton[0].focus();
      } else {
        focusableEle.find('.wrapper-button')[0].focus();
      }
    },

    onKeyDown: function (event) {
      switch (event.keyCode) {
      case 9: //TAB
        if (!event.shiftKey && $(event.target).is(this.ui.cancelEdit)) {
          this._setFocusOnFirstWidget();
          return false;
        }
      }
    }

  });
  DragAndDropKNMixin.mixin(PManView.prototype);
  return PManView;
});

csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});
  
csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/root/lang',{
  dndWidgetsHere: 'Drag and Drop widgets here',
  dndHTMLWidgetsHere: 'Drag and Drop HTML tiles only',
});
  


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-placeholder-title\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndWidgetsHere") || (depth0 != null ? lookupProperty(depth0,"dndWidgetsHere") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndWidgetsHere","hash":{},"loc":{"start":{"line":1,"column":43},"end":{"line":1,"column":61}}}) : helper)))
    + "\">\r\n  <div class=\"csui-placeholder-icon\"></div>\r\n  <div>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dndWidgetsHere") || (depth0 != null ? lookupProperty(depth0,"dndWidgetsHere") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dndWidgetsHere","hash":{},"loc":{"start":{"line":3,"column":7},"end":{"line":3,"column":25}}}) : helper)))
    + "</div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_widgets_perspective.placeholder_impl_perspective.placeholder', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',[],function(){});
/**
 * Placeholder view to represent an empty widget in perpsective.
 * This will be replaces by perspective.widget (preview) on dropping of widgets on this
 */
csui.define('csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.view',['csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'i18n!csui/perspective.manage/widgets/perspective.placeholder/impl/nls/lang',
  'hbs!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder',
  'css!csui/perspective.manage/widgets/perspective.placeholder/impl/perspective.placeholder'
], function (_, Backbone, Marionette, lang, template) {
  var PerspectivePlaceholderView = Marionette.ItemView.extend({
    className: 'csui-perspective-placeholder',
    template: template,
    templateHelpers: function () {
      return {
        dndWidgetsHere: this.options.widgetContainer && this.options.widgetContainer.options.grid.allowHTMLTilesOnly ?
                          lang.dndHTMLWidgetsHere : lang.dndWidgetsHere
      }
    },

    constructor: function (options) {
      Marionette.ItemView.apply(this, arguments);
    },

    onShow: function() {
      this.$el.parent().addClass('csui-pman-placeholder-container');
    },

    onDestroy: function() {
      this.$el.parent().removeClass('csui-pman-placeholder-container');
    }

  });
  return PerspectivePlaceholderView;
});
csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});
  
csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/root/lang',{
  noConfig: 'No configuration needed',
  clickToConfig: 'Configuration needed'
});
  


/* START_TEMPLATE */
csui.define('hbs!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-header\">\r\n  <div class=\"tile-title\">\r\n    <h2 class=\"csui-heading\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":3,"column":36},"end":{"line":3,"column":51}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetTitle") || (depth0 != null ? lookupProperty(depth0,"widgetTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetTitle","hash":{},"loc":{"start":{"line":3,"column":53},"end":{"line":3,"column":68}}}) : helper)))
    + "</h2>\r\n  </div>\r\n</div>\r\n<div>\r\n  <div title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetMessage") || (depth0 != null ? lookupProperty(depth0,"widgetMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetMessage","hash":{},"loc":{"start":{"line":7,"column":14},"end":{"line":7,"column":31}}}) : helper)))
    + "\" class=\"csui-pman-widget-msg\">\r\n    <div class=\"csui-pman-widget-icon\"></div>\r\n    <div>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"widgetMessage") || (depth0 != null ? lookupProperty(depth0,"widgetMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"widgetMessage","hash":{},"loc":{"start":{"line":9,"column":9},"end":{"line":9,"column":26}}}) : helper)))
    + "</div>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_perspective.manage_widgets_perspective.widget_impl_perspective.widget', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',[],function(){});
/**
 * Preview view of any widget
 */
csui.define('csui/perspective.manage/widgets/perspective.widget/perspective.widget.view',['csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'i18n!csui/perspective.manage/widgets/perspective.widget/impl/nls/lang',
  'hbs!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget',
  'css!csui/perspective.manage/widgets/perspective.widget/impl/perspective.widget'
], function (_, Backbone, Marionette, lang, template) {
  var PerspectiveWidgetView = Marionette.ItemView.extend({
    className: 'csui-pman-widget',
    template: template,
    templateHelpers: function () {
      var wConfig  = this.widget && this.widget.get("manifest"),
          wTitle   = this.widget && this.widget.get('title'),
          noConfig = !wConfig || !wConfig.schema || !wConfig.schema.properties ||
                     _.isEmpty(wConfig.schema.properties);
      return {
        widgetTitle: wTitle || lang.noTitle,
        widgetMessage: noConfig ? lang.noConfig : lang.clickToConfig
      }
    },

    constructor: function (options) {
      options || (options = {});
      options = _.defaults(options, {
        data: {},
      });
      Marionette.ItemView.apply(this, arguments);
      this.widget = options.data.widget;
    }
  });
  return PerspectiveWidgetView;
});

csui.define('json!csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  }
}
  
);


csui.define('json!csui/perspective.manage/widgets/perspective.widget/perspective.widget.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  }
}
);

csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/perspective.placeholder.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/perspective.manage/widgets/perspective.placeholder/impl/nls/root/perspective.placeholder.manifest',{
  dndWidgetsHere: 'Drag and Drop widgets here'
});


csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/perspective.widget.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/perspective.manage/widgets/perspective.widget/impl/nls/root/perspective.widget.manifest',{
  noConfig: 'No configuration needed',
  clickToConfig: 'Configuration needed'
});


csui.define('bundles/csui-perspective',[
    'csui/perspective.manage/pman.view',
    'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
    'csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.view',
    'csui/perspective.manage/widgets/perspective.widget/perspective.widget.view',
    
    // widgets manifests
    'json!csui/perspective.manage/widgets/perspective.placeholder/perspective.placeholder.manifest.json',
    'json!csui/perspective.manage/widgets/perspective.widget/perspective.widget.manifest.json',

    'i18n!csui/perspective.manage/widgets/perspective.placeholder/impl/nls/perspective.placeholder.manifest',
    'i18n!csui/perspective.manage/widgets/perspective.widget/impl/nls/perspective.widget.manifest',
], {});
  
csui.require(['require', 'css'], function (require, css) {
    css.styleLoad(require, 'csui/bundles/csui-perspective', true);
});
  
