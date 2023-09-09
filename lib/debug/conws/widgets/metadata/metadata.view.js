// Business Workspace Metadata View
csui.define([
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

  // initialize the Metadata View
  var MetadataView = Marionette.LayoutView.extend({

    // CSS class names
    className: 'conws-metadata',

    // Template is used to render the HTML for the view
    template: template,

    ui: {
      loadContainer: '.load-container',
      headerTitle: '.tile-title',
      tileHeader: '.tile-header',
      tileContent: '.tile-content'
    },

    // The template helpers are used to provide placeholders for the widget
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
      // current focussed element in the view
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

              // special-case only for User attribute
              if (ActiveElementInView.classList.contains("esoc-user-mini-profile") || ActiveElementInView.classList.contains("reference-generate-number") || (ActiveElementInView.classList.contains("cs-field-read-content") && ActiveElementInView.classList.contains("placeholder")) || Element_Index - 1 < 0) {

                break;
              } else {

                // focus the next element in the view
                Tabable_Elements[Element_Index - 1].focus();
                break;
              }
            }
          }
        } else {

          // TAB (NO shift) -> put focus into table body view if in header   esoc-user-mini-profile   cs-field-read-content placeholder

          for (Element_Index = 0; Element_Index < Tabable_Elements.length; Element_Index++) {

            // special-case only for User attribute
            if (ActiveElementInView === Tabable_Elements[Element_Index] && Element_Index + 1 < Tabable_Elements.length) {

              if (ActiveElementInView.classList.contains("esoc-user-mini-profile") || ActiveElementInView.classList.contains("reference-generate-number") || (ActiveElementInView.classList.contains("cs-field-read-content") && ActiveElementInView.classList.contains("placeholder"))) {

                break;
              } else {

                // focus the next element in the view
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
        // tabable elements selector
        tabElements = this.$('button,*[data-cstabindex],*[tabindex]');
      tabElements = this.remove_Elements(tabElements);
      return tabElements;
    },

    remove_Elements: function (tabElements) {
      // removing some unwanted elements which have tabindex
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

    // The constructor gives an explicit name the the object in the debugger and
    // can update the options for the parent view
    constructor: function MetadataView(options) {

      // context is required
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

      // get workspace context
      if (!options.workspaceContext) {
        options.workspaceContext = options.context.getObject(WorkspaceContextFactory);
      }
      options.workspaceContext.setWorkspaceSpecific(MetadataUpdateFormFactory);

      //initially there are no form views.
      this.formViewList = [];

      var modelConfig = options.data;
      if (options.data && options.data.relatedWorkspaces && options.data.relatedWorkspaces.workspaceTypes) {
        // convert related items config to appropriate metadata config.
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
        //add the related workspaces config before the metadata config
        if (modelConfig.metadata) {
          modelConfig.metadata = relationData.concat(modelConfig.metadata);
        } else {
          modelConfig.metadata = relationData;
        }
      }

      // get model collection from the model factory
      options.model = options.workspaceContext.getObject(MetadataUpdateFormFactory, {
        metadataConfig: modelConfig,
        unique: true,
        connector: options.connector
      });

      // wire models and collections also to the parent view
      Marionette.LayoutView.prototype.constructor.call(this, options);

      // changes of the model are rendered immediately
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

    // The view is rendered whenever the model changes.
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

        /*
        * from metadataConfig,
        * if the config type is a group, adding the group details to attributeList
        * if the config type is a category, search for all the category attributes and add details to attributeList at same index
        *  if the config type is a attribute, checking if it has a column and row ids and adding the details to atributeList
        *  ( As we add all the elements even group data is added in else part, hence it is further removed when groups are added individually )
        */

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

          /*
          * Creating and adding individual formViews for each region
          */

        _.each(attributeList, function (attrs, index) {
          if (_.isEmpty(attrs.data) && _.isEmpty(attrs.options.fields) && _.isEmpty(attrs.schema.properties)) {
            return;
          }
          this.model.attributes = attributeList[index];
          var formView = this["formView" + index] = new SelectedMetadataFormView({ model: this.model, context: this.options.context, node: this.model.node });
          /*
          * Adding the metadataview to the created formView.
          * this is done because every formView can be accessed from from all formViews.
          * And a change in one formView can be used to modify in other.
              *
          * For Example:
          *
          * In a scenario when single attributes are configured in metadata widgets like id, old_reference, reference.
          * Here, reference attribute depends on id and old_reference contains previous reference value.
          * If we configure attributes to perspective we get equal number of form views. As we have dedicated regions and formViews for each single attribute configurations.
          * As the user has configured 3 attributes (id,old_reference,reference) we get 3 formViews.
          * Previously a change in reference could easily modify old_reference as they are in a single formView.
          * but, now the Metadata Widget can have multiple formViews (Based on the configuration done in PMan).
          * So, a new object 'formViewList' is introduced in MetadataView which will store all the formViews.
          * And a new object metadataview is added to every formView which will store the reference to MetadataView.
          *
          */
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
        // if there is no formview display the empty view.
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

  // return the initialized view
  return MetadataView;
});
