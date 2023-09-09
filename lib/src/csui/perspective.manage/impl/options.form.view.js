/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
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
        this.ui.description.hide();
        this.ui.unSupportedConfig.show();
        this.trigger('render:form');
      }
    },
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
      if (!this.hasValidSchema) {
        var reqVal = true;
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
      return this.widgetOptionsFormView.validate();
    },

    _isPreviewWidget: function () {
      return this.options.widgetConfig.type ===
             'csui/perspective.manage/widgets/perspective.widget';
    },

    _prepareFormModel: function () {
      var data = this._getOptionsData();
      var modifiedProperties = [];
      for (var fieldKey in this.manifest.schema.properties) {
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
          this.manifest.modifiedProperties && data[fieldKey] &&
          this.updateDataToPrimitive(data, fieldKey);
        }
      }

      if (modifiedProperties.length > 0) {
        this.manifest.modifiedProperties = modifiedProperties;
      }
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
    _getOptionsData: function () {
      var data = this.options.widgetConfig.options || {};
      if (this._isPreviewWidget()) {
        data = data.options || {};
      }
      return data;
    },
    _addWidgetSizePropertyIfSupported: function (schema, options, data) {
      if (!this.options.perspectiveView.getSupportedWidgetSizes) {
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
      this.alpaca.options.hideInitValidationError = false;
    }
  });

  _.extend(WidgetOptionsFormView.prototype, LayoutViewEventsPropagationMixin);
  ManifestEditMixin.mixin(WidgetOptionsFormWrapperView.prototype);
  return WidgetOptionsFormWrapperView;

});
