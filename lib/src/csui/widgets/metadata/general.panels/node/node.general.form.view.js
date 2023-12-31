/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/controls/form/form.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/widgets/metadata/general.form.fields/general.form.field.behavior',
  'csui/widgets/metadata/general.action.fields/general.action.field.behavior',
  'csui/models/version',
  'csui/controls/globalmessage/globalmessage',
  'csui/models/appliedcategories/systemattributes.model',
  'hbs!csui/widgets/metadata/general.panels/node/impl/node.general.form',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/utils/base',
  'i18n',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/commands', 'csui/utils/commands/versions', 'csui/utils/url',
  'css!csui/widgets/metadata/general.panels/node/impl/node.general.form'
], function (_, $, Backbone, FormView, DefaultActionBehavior,
    GeneralFormFieldBehavior, GeneralActionFieldBehavior, VersionModel,
    GlobalMessage, SystemAttributesModel, formTemplate, lang, base, i18n, NextNodeModelFactory, commands,
    versionCommands, Url) {
  'use strict';

  var NodeGeneralFormView = FormView.extend({
    behaviors: {
      defaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      generalFormFields: {
        behaviorClass: GeneralFormFieldBehavior,
        fieldParent: '.csui-extra-general-fields',
        fieldDescriptors: function () {
          return this.options.generalFormFieldDescriptors;
        },
        fieldViewOptions: function () {
          return {
            context: this.options.context,
            node: this.node,
            mode: this.options.mode,
            originatingView: this,
            metadataView: this.options.metadataView
          };
        }
      },
      generalActionFields: {
        behaviorClass: GeneralActionFieldBehavior,
        fieldParent: '.csui-action-fields',
        fieldDescriptors: function () {
          return this.options.generalActionFieldDescriptors;
        },
        fieldViewOptions: function () {
          return {
            context: this.options.context,
            node: this.node,
            mode: this.options.mode,
            originatingView: this,
            metadataView: this.options.metadataView
          };
        }
      }
    },

    className: 'cs-form csui-general-form',
    fieldToRefresh: ['modify_date', 'reserve_info'],

    constructor: function NodeGeneralFormView(options) {
      FormView.prototype.constructor.call(this, options);
      this.node = this.options.node;
      this.fieldToRefresh = _.union(this.fieldToRefresh, (options.fieldToRefresh || []));
      this.listenTo(this, 'change:field', this._saveField);
      this.listenTo(this.node, 'change', _.bind(function () {
        if (this.mode !== "create") {
          this.model.fetch();
        }
        var event = $.Event('tab:content:field:changed');
        this.$el.trigger(event);
      }, this));
      this.listenTo(this, 'before:destroy', this._stopListeningToThumbnailClick);
      this.listenTo(this, 'update:scrollbar', this.updateScrollbar);
      var action = this.defaultActionController.getAction(this.options.node);
      if (!action) {
        this.noDefaultActionExist = true;
      }
      this.mlDataAvailable = base.getMetadataLanguageInfo().enabled;
    },

    formTemplate: formTemplate,

    onRequestProcessing: function (view) {
      this.propagatedView = view;
    },

    updateScrollbar: function () {
      this.$el.closest('.binf-tab-content').scrollTop(0);
    },

    formTemplateHelpers: function () {
      var type_name = this.node.get('type_name'),
          node_name = this.node.get('name');
      return {
        showThumbnail: this.mode !== 'create',
        showitemId: this.model.get('data').itemId !== null && this.model.get('data').itemId !== undefined
                      && this.model.get('data').itemId !== "",
        showSize: (this.model.get('data').size && this.model.get('data').size !== "") ||
          (this.model.get('data').size_formatted && this.model.get('data').size_formatted !== ""),
        reserved: this.node.get('reserved'),
        title: this.noDefaultActionExist ? "" : _.str.sformat(lang.openDoc, type_name),

        showShortcutSection: !(this.options.metadataView.options.model.original && (this.options.metadataView.options.model.original.get('type') === undefined || this.options.metadataView.options.model.original.get('type') < 0) || !this.options.metadataView.options.model.get('original_id')),
        aria_label: this.noDefaultActionExist ? "" :
          _.str.sformat(lang.openDocAria, type_name, node_name)
      };
    },

    _getLayout: function () {
      if (this.alpaca.options.fields.description) {
        this.alpaca.options.fields.description.isTextareaAutoHeight = true;
        if (this.mlDataAvailable) {
          this.alpaca.options.fields.description.type = 'otcs_multilingual_textarea';
          this.alpaca.options.fields.description.keyAttribute = 'description_multilingual';
        }
      }
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
      var bindings = {
        name: 'name_section',
        create_date: '.owner_section',
        create_user_id: '.owner_section',
        modify_date: '.owner_section',
        owner_user_id: '.owner_section',
        mime_type: '.typename_section',
        description: '.description_section',
        itemId: '.owner_section',
        size: '.size_section'
      };
      if (this.node.get("reserved")) {
        bindings = _.extend(bindings, {
          reserve_info: ".reserve_info"
        });
      }
      if (this.node.systemattributes) {
        var formdata = this.node.systemattributes;
        Object
            .keys(formdata.data)
            .forEach(function (data) {
              bindings[data] = ".systemattributes_section";
            });
      }
      if (this.node instanceof VersionModel) {
        bindings = _.extend(bindings, {
          version_number_name: ".owner_section",
          owner_id: ".owner_section"
        });
      }
      return bindings;
    },

    _saveField: function (args) {
      if (this.mode === 'create') {
        return;
      }

      var field = args.targetField,
          changes = {},

          defaultLocale = base.getMetadataLanguageInfo().defaultLanguage;
      changes[field.name] = this.mlDataAvailable && _.isObject(field.value) ?
                            field.value[defaultLocale] : field.value;
      if (args && args.fieldView && args.fieldView.mlDataChanged && args.fieldView.alpacaField
          && args.fieldView.alpacaField.type === 'otcs_multilingual_textarea') {
        var key = args.fieldView.keyAttribute,
            mlData = args.model && args.model.node &&
                     args.model.node.get(key);
        key && (changes[key] = mlData);
      }
      this._saveChanges(changes);
    },

    _saveChanges: function (changes) {
      var MN = '{0}:_saveGeneralChanges {1} {2}';
      var node = this.model.options.node,
          self = this,
          isThumbnailView = self.options.metadataView &&
                            self.options.metadataView.thumbnailViewState,
          isSystemAttributeFields = this._checkSystemAttributeFields(changes),
          fieldsUpdated = isSystemAttributeFields ?
                          this._systemAttributesSave(changes, node) :
                          this._nodesave(changes, node, isThumbnailView);
      this.isDataUpdating = true;
      fieldsUpdated.then(function () {
        if (isSystemAttributeFields) {
          var attr = node.systemattributes,
              changefield = _.toArray(Object.keys(changes));
          attr.data[changefield[0]] = self.changes[changefield[0]];
        }
        return node.fetch();
      }).fail(function (jqxhr) {
        var preValues = self.model.get('data');
        self.form.children.forEach(function (formField) {
          formField.setValue(preValues[formField.propertyId]);
          formField.refresh();
        });
        var error = new base.Error(jqxhr);
        GlobalMessage.showMessage('error', error.message);
        self.trigger('forms:error');
        if (self.alpaca.options.fields.description &&
            self.alpaca.options.fields.description.isTextareaAutoHeight) {
          self.trigger('update:scrollbar');
        }
      })
          .always(_.bind(function () {
            this.isDataUpdating = false;
            this.options.metadataView && this.options.metadataView.unblockActions && 
              this.options.metadataView.unblockActions();
            this.trigger("request:completed", this.propagatedView);
            this._unblockActions();
          }, this));
    },

    updateRenderedForm: function (options) {
      this.updateReserveFieldDisplay();
      FormView.prototype.updateRenderedForm.apply(this, arguments);

      this._showDefaultImage();
      this._listenToThumbnailClick();
      this.$('.thumbnail_section')
          .on("focusin", function (event) {
            base.checkAndScrollElemToViewport(event.currentTarget);
          });
      var generalFormFieldDescriptors = this.options.generalFormFieldDescriptors;
      if (generalFormFieldDescriptors && generalFormFieldDescriptors.length) {
        this.listenToOnce(this, 'render:general:form:fields', options.async());
      }
    },

    setFocus: function () {
      var nonReadOnlyFields = this.$form.find('.alpaca-field:not(.alpaca-readonly) button');
      if (nonReadOnlyFields.length > 0) {
        nonReadOnlyFields.first().trigger('focus');
      }
    },

    updateForm: function () {
      if (!!this.node.isReservedClicked || !!this.node.isUnreservedClicked) {
        this.render();
        this.node.isReservedClicked = false;
        this.node.isUnreservedClicked = false;
      }
      var alpacaForm = this.$el.alpaca('get'),
          requiredSwitch = !!this.node.collection && !!this.node.collection.requireSwitched;
      if (!!alpacaForm) {
        var data = this.model.get('data');
        for (var i = 0; i < this.fieldToRefresh.length; i++) {
          var field = alpacaForm.childrenByPropertyId[this.fieldToRefresh[i]],
              value = data[this.fieldToRefresh[i]];
          if (!!field && field.getValue() !== value && !requiredSwitch) {
            field.setValue(value);
            field.refresh();
          }
        }
      }
      if (!this.thumbnail || (!this.thumbnail.imgUrl && (!this.thumbnail.node || !this.thumbnail.node.get('csuiThumbnailImageUrl')))) {
        this._showDefaultImage();
      }
      this.updateReserveFieldDisplay();
      return this;
    },

    updateReserveFieldDisplay: function () {
      var reserveInfoElem = this.$el.find(".reserve_info");
      if (!!this.node.get('reserved')) {
        if (reserveInfoElem.hasClass("binf-hidden")) {
          reserveInfoElem.removeClass("binf-hidden");
        }
      } else {
        if (!reserveInfoElem.hasClass("binf-hidden")) {
          reserveInfoElem.addClass("binf-hidden");
        }
      }
    },

    _showDefaultImage: function () {
      var defaultThumbnailEl = this.$el.find('.default_thumbnail'),
          className = 'thumbnail_missing';
      if (!!this.options && !!(this.options.model.get('data'))) {
        className = this.options.model.get('data').mimeTypeClassName;
      }
      defaultThumbnailEl.addClass(className);
      defaultThumbnailEl.removeClass('thumbnail_empty');
      var event = $.Event('tab:content:render');
      this.$el.trigger(event);
      if (!!this.noDefaultActionExist) {
        this.$el.find('.default_thumbnail').addClass('thumbnail_disabled');
      }
    },

    _listenToThumbnailClick: function () {
      this._stopListeningToThumbnailClick();
      this._thumbnailClickHandler = _.bind(this._handleThumbnailClick, this);
      this.$('.thumbnail_section')
          .on('click', this._thumbnailClickHandler);
    },

    _stopListeningToThumbnailClick: function () {
      if (this._thumbnailClickHandler) {
        this.$('.thumbnail_section')
            .off('click', this._thumbnailClickHandler);
        this._thumbnailClickHandler = undefined;
      }
    },

    _handleThumbnailClick: function () {
      var context = this.options.context;
      var node = this.options.node;
      var status = {nodes: new Backbone.Collection([node])};
      var options = {
        context: context,
        originatingView: this
      };
      var command;
      if (node instanceof VersionModel) {
        command = versionCommands.get('VersionOpen');
        return command.execute(status, options);
      }
      command = commands.get('Open');
      if (command.enabled(status, options)) {
        return command.execute(status, options);
      }
      var nextNode = this.options.context.getModel(NextNodeModelFactory);
      if (node.get("container") && node.get('id') ===
          nextNode.get("id")) {
        if (this.options.metadataView) {
          this.options.metadataView._closeMetadata();
        }
        return;
      }

      this.triggerMethod('execute:DefaultAction', node);
    },

    _checkSystemAttributeFields: function (changes) {
      var formdata = this.node && this.node.systemattributes,
          fields = formdata && formdata.options && formdata.options.fields,
          systemattributefields = fields && _.toArray(Object.keys(fields)),
          changefield = _.toArray(Object.keys(changes));
      return _.contains(systemattributefields, changefield[0]);
    },

    _nodesave: function (changes, node, isThumbnailView) {
      return node.save(changes, {
        wait: true,
        silent: isThumbnailView,
        patch: true
      });
    },

    _systemAttributesSave: function (changes, node) {
      var deferred = $.Deferred(),
          connector = node.connector,
          self = this;
      self.changes = changes;
      var systemAttributesModel = new SystemAttributesModel({}, {
        connector: this.node.connector,
        node: this.node,
        id: node.get('id')
      });
      return systemAttributesModel.save(changes, {
        type: 'PUT',
        processData: false,
        contentType: false
      });
    }
  });

  return NodeGeneralFormView;
});
