/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/base',
  'csui/utils/log',
  'csui/utils/base',
  'csui/controls/list/emptylist.view',
  'conws/controls/selectedmetadataform/selectedmetadataform.view',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/metadata/impl/forms.metadata.update.factory',
  'i18n!conws/widgets/metadata/impl/nls/metadata.lang',
  'hbs!conws/widgets/metadata/impl/metadata',
  'hbs!conws/utils/workspaces/error.template',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'css!conws/widgets/metadata/impl/metadata',
  'css!conws/utils/workspaces/workspaces'
], function (_, $, Marionette, TabableRegionBehavior, base, log, BaseUtils, EmptyListView, SelectedMetadataFormView,
  WorkspaceContextFactory, MetadataUpdateFormFactory, lang, template, errorTemplate, LayoutViewEventsPropagationMixin) {
  var MetadataView = Marionette.LayoutView.extend({
    className: 'conws-metadata',
    template: template,

    ui: {
      loadContainer: '.load-container',
      headerTitle: '.tile-title',
      tileHeader: '.tile-header',
      tileContent: '.tile-content'
    },
    templateHelpers: function (data) {
      return {
        hideHeader: this.hideHeader,
        title: BaseUtils.getClosestLocalizedString(this.headerTitle, lang.defaultMetadataWidgetTitle),
        icon: this.headerIcon,
        loadingMetadata: lang.loadingMetadata
      }
    },

    events: { "keydown .form-metadata": "onKeyInView" },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    onKeyInView: function (event) {
      var ActiveElementInView = document.activeElement,
        Tabable_Elements = this.currentlyFocusedElement(),
        Element_Index = 0;

      if (ActiveElementInView.children.length > 0) {
        ActiveElementInView = ActiveElementInView.children[0];
      }

      if (event.keyCode === 9) {

        if (event.shiftKey) {

          for (Element_Index = 0; Element_Index < Tabable_Elements.length; Element_Index++) {

            if (ActiveElementInView === Tabable_Elements[Element_Index]) {
              if (ActiveElementInView.classList.contains("esoc-user-mini-profile") || ActiveElementInView.classList.contains("reference-generate-number") || (ActiveElementInView.classList.contains("cs-field-read-content") && ActiveElementInView.classList.contains("placeholder")) || Element_Index - 1 < 0) {

                break;
              } else {
                Tabable_Elements[Element_Index - 1].focus();
                break;
              }
            }
          }
        } else {

          for (Element_Index = 0; Element_Index < Tabable_Elements.length; Element_Index++) {
            if (ActiveElementInView === Tabable_Elements[Element_Index] && Element_Index + 1 < Tabable_Elements.length) {

              if (ActiveElementInView.classList.contains("esoc-user-mini-profile") || ActiveElementInView.classList.contains("reference-generate-number") || (ActiveElementInView.classList.contains("cs-field-read-content") && ActiveElementInView.classList.contains("placeholder"))) {

                break;
              } else {
                Tabable_Elements[Element_Index + 1].focus();
                break;
              }
            }
          }
        }
      }
    },

    currentlyFocusedElement: function () {
      var readonly = !!this.$form && this.$form.find('.alpaca-readonly button'),
        tabElements = this.$('button,*[data-cstabindex],*[tabindex]');
      tabElements = this.remove_Elements(tabElements);
      return tabElements;
    },

    remove_Elements: function (tabElements) {
      var Class_List = ["alpaca-array-actionbar-action", "typeahead", "cs-icon", "binf-hidden", "csui-icon-edit", "csui-bulk-edit", "icon-date_picker"];

      for (var Element_Index = 0; Element_Index < tabElements.length; Element_Index++) {

        for (var Class_Index = 0; Class_Index < Class_List.length; Class_Index++) {

          if (tabElements[Element_Index].classList.contains(Class_List[Class_Index])) {

            tabElements.splice(Element_Index, 1);
            Class_Index = Class_List.length;
            Element_Index = Element_Index - 1;
          }
        }
      }
      return tabElements;
    },
    constructor: function MetadataView(options) {
      options || (options = {});
      if (!options.context) {
        throw new Error('Context is missing in the constructor options');
      }

      _.defaults(options, {
        searchTabContentForTabableElements: true
      });

      this.hideHeader = options.data && options.data.hideHeader;
      this.headerTitle = options.data && options.data.title || lang.defaultMetadataWidgetTitle; // from perspective configuration
      this.headerIcon = options.data && options.data.icon || "category1";   // from perspective configuration

      this.noMetadataMessage = lang.noMetadataMessage;
      if (options.data && options.data.noMetadataMessage) {
        this.noMetadataMessage = base.getClosestLocalizedString(
          options.data.noMetadataMessage, this.noMetadataMessage);
      }
      if (!options.workspaceContext) {
        options.workspaceContext = options.context.getObject(WorkspaceContextFactory);
      }
      options.workspaceContext.setWorkspaceSpecific(MetadataUpdateFormFactory);
      this.formViewList = [];

      var modelConfig = options.data;
      if (options.data && options.data.relatedWorkspaces && options.data.relatedWorkspaces.workspaceTypes) {
        modelConfig = $.extend(true, {}, options.data);
        var relationData = _.map(options.data.relatedWorkspaces.workspaceTypes,function(el){
          return {
            workspaceTypeId: el.workspaceTypeId,
            type: "relation"
          };
        })
        if (!_.isEmpty(options.data.relatedWorkspaces.relatedGroupName)) {
          relationData = [{
            attributes: relationData,
            label: options.data.relatedWorkspaces.relatedGroupName,
            type: "group"
          }];
        }
        if (modelConfig.metadata) {
          modelConfig.metadata = relationData.concat(modelConfig.metadata);
        } else {
          modelConfig.metadata = relationData;
        }
      }
      options.model = options.workspaceContext.getObject(MetadataUpdateFormFactory, {
        metadataConfig: modelConfig,
        unique: true,
        connector: options.connector
      });
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(options.model, 'change', this.render);
      this.listenTo(options.model, 'error', this.handleError);

      this.propagateEventsToRegions();
    },

    handleError: function(model,response,options){
      var emptyEl = errorTemplate.call(this, { errorMessage: response.responseJSON.error });
      this.$(".form-metadata").empty();
      this.$('.conws-workspaces-error').remove();
      this.$('.tile-content').append(emptyEl);
      this._hideLoadContainer();
    },

    _hideLoadContainer: function () {
      this.ui.loadContainer.addClass("binf-hidden");
    },
    onRender: function () {
      var titleId = _.uniqueId("dlgTitle");
      this.ui.tileHeader.attr('tabindex', 0);
      this.ui.headerTitle.find('.csui-heading').attr('id', titleId);
      this.ui.tileHeader.parent().attr('role', 'region').attr('aria-labelledby', titleId);
      this.ui.tileContent.attr('aria-labelledby', titleId);

      this._currentShortcutIndex = 0;

      _.each(this.regions,function(region,reg){this.removeRegion(reg);},this);
      this.formViewList.splice(0);
      delete this.formView;

      if (this.model.metadataConfig.length > 0 && !_.isEmpty(this.model.attributes.data)) {
        var attributeList = [];
        var attributeDetails = { data: {}, options: { fields: {} }, schema: { properties: {} } }
        attributeDetails.data = $.extend({}, this.model.attributes.data);
        attributeDetails.options.fields = $.extend({}, this.model.attributes.options.fields);
        attributeDetails.schema.properties = $.extend({}, this.model.attributes.schema.properties);

        _.each(this.model.metadataConfig, function (config, index) {
          if (config.type === 'group') {
            attributeList[index] = { data: {}, options: {}, schema: {} };
            attributeList[index].data = $.extend({}, this.model.attributes.data[config.label]);
            attributeList[index].options = $.extend({}, this.model.attributes.options.fields[config.label]);
            attributeList[index].schema = $.extend({}, this.model.attributes.schema.properties[config.label]);
          } else if (config.type === 'category') {
            attributeList[index] = { data: {}, options: { fields: {} }, schema: { properties: {} } };
            _.each(this.model.attributes.data, function (data, key) {
              if (key.lastIndexOf(config.categoryId+"_",0)===0) {
                attributeList[index].data[key] = this.model.attributes.data[key];
                attributeList[index].options.fields[key] = this.model.attributes.options.fields[key];
                attributeList[index].schema.properties[key] = this.model.attributes.schema.properties[key];
              }
            }, this);
          } else if (config.type === 'relation') {
            attributeList[index] = { data: {}, options: { fields: {} }, schema: { properties: {} } };
            _.each(this.model.attributes.data, function (data, key) {
              var fields = this.model.attributes.options && this.model.attributes.options.fields;
              var workspace_type_id = fields && fields[key] && fields[key].workspace_type_id;
              if (workspace_type_id+""===config.workspaceTypeId+"") {
                attributeList[index].data[key] = this.model.attributes.data[key];
                attributeList[index].options.fields[key] = this.model.attributes.options.fields[key];
                attributeList[index].schema.properties[key] = this.model.attributes.schema.properties[key];
              }
            }, this);
          } else if (config.type === 'attribute') {
            var key = config.categoryId + "_" + config.attributeId
            if (!!config.attributeType) {
              if (config.attributeType === "object") {
                key = key + "_1_" + config.columnId;
              } else {
                key = key + "_x_" + config.columnId;
              }
            }
            attributeList[index] = { data: {}, options: { fields: {} }, schema: { properties: {} } };
            if (typeof this.model.attributes.data[key] !== 'undefined') {
              attributeList[index].data[key] = this.model.attributes.data[key];
              attributeList[index].options.fields[key] = this.model.attributes.options.fields[key];
              attributeList[index].schema.properties[key] = this.model.attributes.schema.properties[key];
            }
          }
        }, this);

        _.each(attributeList, function (attrs, index) {
          if (_.isEmpty(attrs.data) && _.isEmpty(attrs.options.fields) && _.isEmpty(attrs.schema.properties)) {
            return;
          }
          this.model.attributes = attributeList[index];
          var formView = this["formView" + index] = new SelectedMetadataFormView({ model: this.model, context: this.options.context, node: this.model.node });
          this.formViewList.push(formView);
          formView.metadataview = this;

          var reg = "Region" + index;
          $('<div></div>').addClass("form-metadata" + index).appendTo(this.$(".form-metadata"));
          this.addRegion( reg, ".form-metadata" + index );
          this.regions[reg] = $.extend({}, this[reg]);

          formView.listenTo(formView, 'render:form', function () {
            this._hideLoadContainer();
          }.bind(this));
          this[reg].show(formView);
        }, this);
        this.model.attributes = attributeDetails;
      }

      if (this.formViewList.length===0 && (this.model.metadataConfig.length===0 || this.model.attributes.data)) {
        $('<div></div>').addClass("form-metadata0").appendTo(this.$(".form-metadata"));
        this.addRegion("Region0", ".form-metadata0");
        this.regions.Region0 = $.extend({}, this.Region0);
        this.formView = new EmptyListView({ text: this.noMetadataMessage });
        this.Region0.show(this.formView);
        this._hideLoadContainer();
      }

    }

  });

  _.extend(MetadataView.prototype, LayoutViewEventsPropagationMixin);
  return MetadataView;
});
