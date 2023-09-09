// Business Workspace Header View
csui.define(['module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/nodesprites',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/progressblocker/blocker',
  'csui/utils/high.contrast/detector!',
  'csui/utils/node.links/node.links',
  'hbs!conws/widgets/header/impl/navitem',
  'esoc/widgets/activityfeedwidget/activityfeedfactory',
  'esoc/widgets/activityfeedwidget/activityfeedcontent',
  'csui-ext!conws/utils/commands/navigate/workspace',
  'conws/utils/navigate/navigate.util',
  'conws/utils/commands/back.to.previous.location',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/header/impl/editicon.view',
  'conws/widgets/header/impl/header.model.factory',
  'conws/widgets/header/impl/header.icon.model',
  'conws/widgets/header/impl/headertoolbaritems',
  'conws/widgets/header/impl/headertoolbaritems.masks',
  'conws/models/favorite.model',
  'conws/controls/description/description.view',
  'conws/widgets/header/impl/headertoolbar.view',
  'conws/widgets/header/impl/icon.view',
  'csui/controls/icon/icon.view',
  'i18n!conws/widgets/header/impl/nls/header.lang',
  'csui/utils/contexts/factories/node',
  'hbs!conws/widgets/header/impl/header',
  'hbs!conws/widgets/header/impl/error.template',
  'css!conws/widgets/header/impl/header'
], function (module, require, _, $, Backbone, Marionette,
    base, Log, Url, NodeSpriteCollection,
    ModalAlert, BlockingView, highContrast,
    nodeLinks, headerNavItemTemplate,
    ActivityFeedFactory, ActivityFeedContent,
    NavigateExtensions, NavigateUtil, BackToPreviousLocation,
    WorkspaceContextFactory, EditIconView, HeaderModelFactory,
    HeaderIconModel, HeaderToolbarItems, HeaderToolbarItemsMask, FavoriteModel, DescriptionView,
    HeaderToolbarView, IconView, CsuiIconView, lang, NodeModelFactory, template, errorTemplate) {

  // strict javascript execution
  'use strict';

  // activity feed widget
  var constants = {'activityfeedwidget': 'esoc/widgets/activityfeedwidget'};

  var moduleConfig = module.config();
  var log = new Log(module.id);

  // highContrast is 1 for white on dark and 2 for dark on white background.
  // in header we have dark background by default. show the "dark" theme icon
  // by default and when background is dark due to high contrast setting.

  var _useIconsForDarkBackground;

  if (highContrast === 2) {
    _useIconsForDarkBackground = false;
  }
  else {
    _useIconsForDarkBackground = true;
  }

  var backCommand = new BackToPreviousLocation();
  function goToPrevious() {
    this.backToPrevious.done = true;
    backCommand.execute({
      context: this.options.context,
      data: { index: this.backToPrevious.index }
    })
  }
  function hasPreviousLink() {
    return this.backToPrevious.router!=="Landing" && this.backToPrevious.index>=0;
  }

  var HeaderNavItemView = Marionette.ItemView.extend({

    template: headerNavItemTemplate,

    className: 'conws-header-navitem',

    constructor: function HeaderNavItemView() {
      Marionette.ItemView.prototype.constructor.apply(this,arguments);
    },

    onRender: function() {
      // render icon in navigation back link.
      var target = this.$('.conws-header-navicon');
      var backLinkIcon = new CsuiIconView({
        iconName: 'conws_action_backv2',
        states: 'true',
        size: 'normal',
        theme: _useIconsForDarkBackground ? 'dark' : ''
      });
      backLinkIcon.render();
      backLinkIcon.$el.addClass(target[0].className);
      target.replaceWith(backLinkIcon.el);
    }

  });

  var HeaderNavBarView = Marionette.CollectionView.extend({

    className: 'conws-header-navbar',

    childView: HeaderNavItemView,

    events: {
      "click .conws-header-navlink": "clickLink"
    },

    clickLink: function(e){
      this.trigger("click:link",e);
    },

    constructor: function HeaderNavBarView() {
      Marionette.CollectionView.prototype.constructor.apply(this,arguments);
    }

  });

  var keys = [
    "hideToolbar", "hideToolbarExtension", "hideActivityFeed",
    "hideDescription", "hideWorkspaceType", "hasMetadataExtension",
    "toolbarBlacklist", "extensionToolbarBlacklist", "enableCollapse"
  ];

  // initialize the Header View
  var HeaderView = Marionette.LayoutView.extend({

    // CSS class names
    className: 'conws-header',

    // Template is used to render the HTML for the view
    template: template,

    // The template helpers are used to provide placeholders
    // for the widget
    templateHelpers: function () {
      var obj = {
        title: this.resolveProperty('title'),
        type: this.resolveProperty('type'),
        description: this.resolveProperty('description'),
        hasChildView: this.hasChildView(),
        hasDescription: !this.options.hideDescription,
        isDescriptionEmpty: this.hasEmptyDescription(),
        hasWorkspaceType: !this.options.hideWorkspaceType,
        hasMetadataExtension: this.options.hasMetadataExtension,
        hasMetadata: !this.options.hideDescription || !this.options.hideWorkspaceType ||
                     this.options.hasMetadataExtension
      };
      return obj;
    },

    // the header is separated in the following regions:
    // - child view region contains the configured nested view. this
    //   is currently only the activity view.
    // - Toolbar region contains the commands like comments,favorites and other extensions
    regions: {
      childViewRegion: '#conws-header-childview',
      toolBarRegion: '.conws-header-toolbar',
      descriptionRegion: '.conws-header-desc',
      iconViewRegion: '.conws-header-image'
    },

    events: {
      'keydown': 'onKeyDown'
    },

    onClickLink: function (e) {
      e.preventDefault();
      e.stopPropagation();
      goToPrevious.call(this);
    },

    isTabable: function () {
      // the header icon shouldn't be tabable in collapsed mode
      return $('.cs-tabbed-perspective.cs-collapse').length === 0;
    },

    currentlyFocusedElement: function () {
      // get header icon as focusable element
      return this.$el.find('.conws-header-edit');
    },

    onKeyDown: function (e) {
      if (e.keyCode === 13 || e.keyCode === 32) {
        // open image editor in case the header isn't collapsed
        if ($(e.target).hasClass('conws-header-edit')) {
          // stall event
          e.preventDefault();
          e.stopPropagation();
          if ($('.cs-collapse').length === 0) {
            // show popover
            $(e.target).binf_popover('show');
          }
        } else if ($(e.target).hasClass('conws-header-navlink')) {
          // stall event
          e.preventDefault();
          e.stopPropagation();
          goToPrevious.call(this);
        }
      }
    },

    // The constructor gives an explicit name the the object in the debugger and
    // can update the options for the parent view
    constructor: function HeaderView(options) {
      // context is required
      options || (options = {});
      if (!options.context) {
        throw new Error('Context is missing in the constructor options');
      }
      options.hideToolbar = options.hideToolbar ? !!options.hideToolbar :
                            !!moduleConfig.hideToolbar;
      options.hideToolbarExtension = options.hideToolbarExtension ? !!options.hideToolbarExtension :
                                     !!moduleConfig.hideToolbarExtension;
      options.hideActivityFeed = options.hideActivityFeed ? !!options.hideActivityFeed :
                                 !!moduleConfig.hideActivityFeed;
      options.hideDescription = options.hideDescription ? !!options.hideDescription :
                                !!moduleConfig.hideDescription;
      options.hideWorkspaceType = options.hideWorkspaceType ? !!options.hideWorkspaceType :
                                  !!moduleConfig.hideWorkspaceType;
      options.hasMetadataExtension = options.hasMetadataExtension ? !!options.hasMetadataExtension :
                                     !!moduleConfig.hasMetadataExtension;
      options.toolbarBlacklist = options.toolbarBlacklist ? options.toolbarBlacklist :
                                 moduleConfig.toolbarBlacklist;
      options.extensionToolbarBlacklist = options.extensionToolbarBlacklist ?
                                          options.extensionToolbarBlacklist :
                                          moduleConfig.extensionToolbarBlacklist;
      options.expandDescription = true;
      options.enableCollapse = options.enableCollapse === undefined ?
                                !!moduleConfig.enableCollapse : !!options.enableCollapse;

      if (NavigateExtensions) {
        for (var ii=0; ii<NavigateExtensions.length; ii++) {
          var extension = NavigateExtensions[ii];
          if (extension.checkHeaderViewOptions) {
            var extended = extension.checkHeaderViewOptions( {context: options.context}, _.pick(options,keys));
            if (extended) {
              _.extend(options,_.pick(extended,keys));
              break;
            }
          }
        }
      }

      // get workspace context
      if (!options.workspaceContext) {
        options.workspaceContext = options.context.getObject(WorkspaceContextFactory);
        options.workspaceContext.setWorkspaceSpecific(HeaderModelFactory);
        options.workspaceContext.setWorkspaceSpecific(ActivityFeedFactory);
      }
      // get the model from the model factory
      options.model = options.workspaceContext.getModel(HeaderModelFactory);

      // set child widget and options if the type is 'activityfeed'
      if (options.data.widget && options.data.widget.type &&
          options.data.widget.type === 'activityfeed') {
        options.data.widget.type = constants.activityfeedwidget;
        options.data.widget.options || (options.data.widget.options = {});
      }

      // Masking the toolbar items in the right section of header
      if ((Array.isArray(options.toolbarBlacklist) && options.toolbarBlacklist.length > 0) ||
          (Array.isArray(options.delayedToolbarBlacklist) &&
           options.delayedToolbarBlacklist.length > 0)) {
        options.headerToolbarItemsMask = new HeaderToolbarItemsMask({
          "rightToolbar": {blacklist: options.toolbarBlacklist},
          "delayedActionsToolbar": {blacklist: options.delayedToolbarBlacklist}
        });
      }

      // Masking the toolbar items in the toolbar extension area of tabbed perspective
      if ((Array.isArray(options.extensionToolbarBlacklist) &&
           options.extensionToolbarBlacklist.length > 0) ||
          (Array.isArray(options.extensionToolbarDelayedActionsBlacklist) &&
           options.extensionToolbarDelayedActionsBlacklist.length > 0)) {
        options.headerExtensionToolbarItemsMask = new HeaderToolbarItemsMask({
          "rightToolbar": {blacklist: options.extensionToolbarBlacklist},
          "delayedActionsToolbar": {blacklist: options.extensionToolbarDelayedActionsBlacklist}
        });
      }

      options.workspaceNode = options.workspaceContext.getModel(NodeModelFactory);

      // wire models and collections also to the parent view
      Marionette.LayoutView.prototype.constructor.call(this, options);

      // listen to the window resize event
      $(window).on('resize', _.bind(this.onWindowResize, this));
      this.model.fetched = false;
      // changes of the header model are rendered immediately
      this.listenTo(this.model, 'change', _.bind(function () {
        this.model.fetched = true;
        this.render();
      }, this));

      //Show errors
      this.listenTo(this.model, 'error', this.handleError);

      if (this.hasChildView()) {
        var widget = this.options.data.widget;
        if (widget.type === constants.activityfeedwidget) {
          // because nodeid is part of id of activity feed factory/model in context, we must create
          // the widget every time the id changes. and we must do it before render,
          // so it is fetched together with the other nodes, to get smooth animations.
          this._makeActivityWidget();
          this.listenTo(this.model.node, 'change:id', this._makeActivityWidget);
        }
      }

      this.options.workspaceNode.nonPromotedActionCommands = this.getDelayedHeaderViewActions();
      // Render toolbar items (comments, favorites) as an extension in tab links section of tabbed perspective
      if (!this.options.hideToolbarExtension) {

        this.tabBarRightExtensionView = HeaderToolbarView;

        this.tabBarRightExtensionViewOptions = {
          context: this.options.context,
          node: this.options.workspaceNode,
          toolbarItems: this.options.headerExtensionToolbaritems || HeaderToolbarItems,
          container: this.options.workspaceNode,
          originatingView: this,
          toolbarItemsMasks: this.options.headerExtensionToolbarItemsMask,
          useIconsForDarkBackground: _useIconsForDarkBackground,
          customClass: "conws-header-toolbar-extension conws-header-toolbar"
        };
        // Not showing the extension in the condensed header
        this.disableExtensionOnOtherTabs = true;
      }

      // listen to the dom:refresh event to do line clamping...
      this.listenTo(this, 'dom:refresh', this.onDomRefresh);

      this.listenTo(this, "active:tab", function () {
        this.triggerMethod("adjust:toolbar");
        //have to render icon first and than set the right tabindex for the icon
        this.renderWorkspaceIcon();
        this.isTabable() ? this.currentlyFocusedElement().attr("tabindex", "0") :
                           this.currentlyFocusedElement().attr("tabindex", "-1");
      });
      this.listenTo(this, "render", this.postCallbackFunction);

      // add listeners to ensure back link is updated after it was clicked, even when perspective does not change.
      var viewStateModel = this.options.context.viewStateModel;
      this.listenTo(viewStateModel,"navigate",function(){
        if (this.backToPrevious && this.backToPrevious.done) {
          // if back link was clicked and perspective was not changed so far, then update the backlink explicitly.
          this.renderNavigationBar(true);
        }
      });
      this.listenTo(this.options.context,"change:perspective",function(){
        if (this.backToPrevious && this.backToPrevious.done) {
          // if back link was clicked and perspective changes no need to update the backlink explicitly.
          this.backToPrevious && delete this.backToPrevious.done;
        }
      });

      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
    },

    postCallbackFunction: function () {
      // Render toolbar items (comments, favorites) in the header right section
      // and additional toolbar for extension of other actions.

      this.headerToolbarView = new HeaderToolbarView(
          {
            context: this.options.context,
            node: this.options.workspaceNode,
            toolbarItems: this.options.headertoolbaritems ? this.options.headertoolbaritems :
                          HeaderToolbarItems,
            toolbarItemsMasks: this.options.headerToolbarItemsMask,
            container: this.options.workspaceNode,
            originatingView: this,
            hideToolbar: this.options.hideToolbar,
            useIconsForDarkBackground: _useIconsForDarkBackground,
            statusIndicatorsView: this.options.statusIndicatorsView,
            statusIndicatorsViewOptions: this.options.statusIndicatorsViewOptions,
            enableCollapse: this.options.enableCollapse
          });

      this.toolBarRegion.show(this.headerToolbarView);
    },

    renderWorkspaceIcon: function () {
      this.iconView = new IconView(
        _.defaults(this.options, {type: this.resolveProperty('type'), parentView: this})
      );
      this.iconViewRegion.show(this.iconView);
    },

    addActivityFeedClass: function () {
      if (this.$el.find('#conws-header-childview').find('.esoc-activityfeed-contentwidget').has(
              '.esoc-activityfeed-list-item').length) {
        this.$el.parent().addClass('conws-activityfeed-configured').removeClass(
            'conws-activityfeed-configured-nodata');
      } else if (this.$el.find('#conws-header-childview').has(
              '.esoc-activityfeed-contentwidget .esoc-empty-activityfeed-message').length) {
        this.$el.parent().addClass('conws-activityfeed-configured-nodata').removeClass(
            'conws-activityfeed-configured');
      } else {
        this.$el.parent().removeClass('conws-activityfeed-configured-nodata').removeClass(
            'conws-activityfeed-configured');
      }
    },

    onDomRefresh: function () {
      this.addActivityFeedClass();
      // line clamping
      this._clampTexts();
      // tab indexes are maintained in the 'dom:refresh' event. unfortunately the event isn't
      // executed on nested views. therefore we have to manually trigger them on the nested views.
      if (this.hasChildView()) {
        this.childViewRegion.currentView &&
        this.childViewRegion.currentView.triggerMethod('dom:refresh');
      }

      this.headerToolbarView.triggerMethod('dom:refresh');

      if (this.descriptionView && this.descriptionView.ui.readMore.is && this.descriptionView.ui.showLess.is) {
        if (this.descriptionView.ui.readMore.is(":hidden") && this.descriptionView.ui.showLess.is(":visible")) {
          this.descriptionView.ui.showLess.trigger('click');
          this.currentlyFocusedElement().trigger('focus');
        }
      }

      this.isTabable() ? this.currentlyFocusedElement().attr("tabindex", "0") :
      this.currentlyFocusedElement().attr("tabindex", "-1");

    },

    onWindowResize: function () {
      // line clamping
      this._clampTexts();
    },

    onDestroy: function () {
      // unbind resize event
      $(window).off('resize', this.onWindowResize);
      // release the observer
      if (this._observer) {
        this._observer.disconnect();
      }

      if (this.iconView) {
        this.iconView.destroy();
      }

      if (this.headerToolbarView) {
        this.headerToolbarView.destroy();
      }

      if (this.navigationBar){
        this.navigationBar.destroy();
      }
    },

    onShow: function () {
      var self = this;
      // create observer ...
      var perspective = $('.cs-perspective-panel');
      if (perspective.length === 1) {
        this._observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            var target = $(mutation.target);
            if (target.hasClass('cs-tabbed-perspective')) {
              self.titleClampLines = target.hasClass('cs-collapse') ? 1 : 2;
              self._clampTexts();
            }
          });
        });
        // ... and observe
        this._observer.observe(perspective[0],
            {attributes: true, attributeFilter: ['class'], subtree: true});
      }
    },

    // The view is rendered whenever the model changes.
    onRender: function () {
      if (this._parent && this._parent.$el) {
        this._parent.$el.parents('.cs-tabbed-perspective').addClass('conws-header-active');
      }
      // render icon and text in navigation back link.
      this.renderNavigationBar();
      if (this.model.fetched) {
        this.$el.parent().addClass('conws-header-widget');
        var self = this;

        // Render Icon
        this.renderWorkspaceIcon();

        if (this.hasChildView()) {
          // Render activityfeed if necessary
          if (!self.activityFeedContent) {
            this._makeActivityWidget();
          }
          if (self.activityFeedContent) {
            var listView = self.activityFeedContent.contentView.unblockActions();
            self.childViewRegion.show(listView);
            self.activityFeedContent = undefined;
          }
        }

        // Render description
        if (!this.options.hideDescription && !this.hasEmptyDescription()) {
          var data = {
            view: this,
            complete_desc: this.resolveProperty('description'),
            expandDescription: this.options.expandDescription
          };
          this.descriptionView = new DescriptionView(data);
          this.descriptionRegion.show(this.descriptionView);
          this.$el.parent().addClass('conws-description-available');
        }
      }
    },

    renderNavigationBar: function(update) {

      var backToPreviousTitle, backToPreviousLink = '#';
      this.backToPrevious = backCommand.getLinkInfo(this.options.context);
      var showBackLink = hasPreviousLink.call(this);
      log.debug('HeaderView backToPrevious: {0} {1}', showBackLink, this.backToPrevious.index) && console.log(log.last);

      if (this._parent && this._parent.$el) {
        if (showBackLink) {
          this._parent.$el.parents('.cs-tabbed-perspective').addClass('conws-backlink-visible');
          this._parent.$el.addClass('conws-header-with-link');
        } else {
          this._parent.$el.parents('.cs-tabbed-perspective').removeClass('conws-backlink-visible');
          this._parent.$el.removeClass('conws-header-with-link');
        }
      }

      if (this.navigationBar && (!showBackLink||!update)) {
        this.$('.conws-header-navwrap').remove();
        this.navigationBar.destroy();
        delete this.navigationBar;
      }
      if (showBackLink) {
        backToPreviousTitle = this.backToPrevious.title;
        if (this.backToPrevious.id) {
          var crumb = new Backbone.Model({id:this.backToPrevious.id});
          backToPreviousLink = nodeLinks.getUrl(crumb, {connector: this.model.connector}) || '#';
        }

        if (this.navigationBar) {
          this.navigationBar.$('.conws-header-navlink').attr({
            "href": backToPreviousLink,
            "title": backToPreviousTitle
          });
          this.navigationBar.$('.conws-header-navtext').text(backToPreviousTitle);
        } else {
          var navbar = new HeaderNavBarView({
            collection: new Backbone.Collection([{
              backToPreviousLink: backToPreviousLink,
              backToPreviousTitle: backToPreviousTitle
            }])
          });
          navbar.render();
          this.listenTo(navbar,"click:link",this.onClickLink);
          $('<div class="conws-header-navwrap"></div>').append(navbar.el).insertBefore(this.$('.conws-header-wrapper'));
          this.navigationBar = navbar;
        }
      }
    },

    hasEmptyDescription: function () {
      var description = this.resolveProperty('description');
      return (description === "");
    },

    _clampTexts: function () {
      // clear timer
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      // renew timer
      this.resizeTimer = setTimeout(_.bind(function () {
        // title
        var title = $('.conws-header-title > p');
        if (title.length !== 0) {
          title.text(title.attr('title'));
          this.clamp(title[0], title.parent().outerHeight());
        }
      }, this), 200);
    },

    // Get the header configuration property
    _makeActivityWidget: function () {
      // create activity widget if we have an id.
      // set it to undefined, if we have no id or activityfeed is not configured.
      this.activityFeedContent = undefined;
      if (this.model.node.get('id')) {
        var widget = (this.options.data && this.options.data.widget);
        if (widget && widget.type === constants.activityfeedwidget) {
          var widgetOptions = $.extend({}, widget.options, {
            feedsize: 10,
            feedtype: "all",
            feedSettings: {
              enableComments: true,
              enableFilters: false
            },
            feedsource: {
              source: 'pulsefrom',
              id: this.model.node.get('id')
            },
            hideExpandIcon: true,
            context: this.options.workspaceContext,
            headerView: true
          });
          this.activityFeedContent = new ActivityFeedContent(widgetOptions);
          this.listenTo(this.activityFeedContent.contentView.collection, 'sync', this.addActivityFeedClass);
        }
      }
    },

    // Get the header configuration property
    configProperty: function (name) {
      var props = (this.options.data && this.options.data.workspace &&
                   this.options.data.workspace.properties) || {};
      return props[name];
    },

    // Gets the widget properties from the view and resolves replacement tags if
    // available.
    resolveProperty: function (name) {
      var ret = '';
      // resolve widget property only in case the model is
      // already a business workspace
      if (this.model.isWorkspaceType()) {
        // get the property from the widget workspace configuration
        var prop = this.configProperty(name);
        //for backword compatability
        if (prop === '{business_properties.description}') {
          prop = '{description}'
        }
        if (prop && (prop.length > 0)) {
          // find placeholders in the format '{x}'
          var tags = prop.match(/{(.*?)}/g);
          if (tags) {
            var self = this;
            _.each(tags, function (tag) {
              prop = prop.replace(tag, self.format(self.resolveModelValue(tag)).formatted || '');
            });
          }
          ret = prop;
        }
      }
      return ret;
    },

    // Gets properties from the model.
    // - Supports node / category properties
    // - Multi-value fields are supported, values are comma-separated.
    // - Returns name, value and metadata information
    resolveModelValue: function (name) {
      // initialize return
      var ret = {
        name: name,
        value: name,
        metadata: undefined
      };
      // resolve the model value
      if (name.indexOf('{') === 0) {
        // set node values and split replacement tag
        var value = this.model.attributes || {};
        var metadata = this.model.metadata && this.model.metadata.properties || {};
        var names = name.substring(1, name.length - 1).split('.');
        var metadataNames = names;
        // in case of categories replacement tag switch to categories
        // object and adopt the replacement tag elements.
        var section = (names.length > 1) ? names[0] : undefined;
        if (section === 'categories') {
          // set the categories value, metadata field
          value = this.model.categories || {};
          metadata = this.model.metadata && this.model.metadata.categories || {};
          // extend array from [categories, catid_fieldid]
          // to [categories, catid, catid_fieldid]
          var parts = names[1].split('_');
          names = [parts[0], names[1]];
          //
          if (parts.length > 2) {
            parts[2] = 'x';
          }
          metadataNames = [parts[0], parts.join('_')];
        } else if (section === 'business_properties') {
          // set the business properties value, metadata field
          value = this.model.business_properties || {};
          metadata = {};
          // remove 'business_properties' tag
          names.splice(0, 1);
        }
        // find the replacement tag in the workspace
        // information.
        _.find(names, function (name) {
          value = value[name];
          if (value === undefined) {
            return true;
          }
        });
        // find the value metadata
        _.find(metadataNames, function (name) {
          metadata = metadata[name];
          if (metadata === undefined) {
            return true;
          }
        });
        // expand the category values
        if (section === 'categories') {
          if (metadata && metadata.type === 2) {
            if (metadata.persona === 'user' || metadata.persona === 'group' ||
                metadata.persona === 'member') {
              this.model.expandMemberValue({name: names[1], value: value, metadata: metadata});
            }
          }
        }
        // return value
        ret.name = name;
        ret.value = value;
        ret.metadata = metadata;
      }
      // return
      return ret;
    },

    // returns a culture and type specifically formatted
    // model value.
    format: function (value) {
      // format depending on metadata
      var typeId = value.metadata && value.metadata.type;
      switch (typeId) {
      case -7:
        // format date value
        value.formatted = this.formatDate(value.value);
        break;
      case 2:
        // in case of integer the value could also represent a user/group id
        var persona = value.metadata.persona;
        switch (persona) {
        case 'user':
        case 'group':
        case 'member':
          // users and groups must be expanded before they are formatted
          var expprop = '{' + value.name.substring(1, value.name.length - 1) + '_expand}';
          var expval = this.resolveModelValue(expprop);
          value.formatted = this.formatMember(expval.value);
          break;
        default:
          // default integer values are displayed as they are
          value.formatted = this.formatValue(value.value);
          break;
        }
        break;
      default:
        // all other types are displayed as they are
        value.formatted = this.formatValue(value.value);
        break;
      }

      // return the value
      return value;
    },

    formatDate: function (value) {
      // ensure value is array
      value = _.isArray(value) ? value : [value];
      // return formatted string
      return _.map(value, function (element) {
        return base.formatDate(element);
      }).join('; ');
    },

    formatMember: function (value) {
      // ensure value is array
      value = _.isArray(value) ? value : [value];
      // return formatted string
      var map = _.map(value, function (element) {
        if (!element) {
          return '';
        } else if (element.display_name !== undefined) {
          return element.display_name;
        } else if (element.name_formatted !== undefined) {
          return element.name_formatted;
        } else {
          return base.formatMemberName(element);
        }
      });
      var mapstr = map.join('; ');
      return mapstr;
    },

    formatValue: function (value) {
      // ensure value is array
      value = _.isArray(value) ? value : [value];
      // return formatted string
      return value.join('; ');
    },

    // Evaluates whether the header contains a child widget or not.
    hasChildView: function () {
      return !this.options.hideActivityFeed && (this.options.data && this.options.data.widget &&
             this.options.data.widget.type && this.options.data.widget.type !== "none");
    },

    clamp: function (elem, height) {

      var truncChars = '...';
      var splitChars = ['.', ',', ' '];
      var splitChar = null;

      var chunk = null;
      var chunks = null;

      function truncate(textElem) {

        // get the value
        var value = textElem.nodeValue.replace(truncChars, '');

        // if no chunks exist get them
        if (!chunks) {
          // get the next splitchar
          splitChar = splitChars.length ? splitChars.shift() : '';
          // get the chunks
          chunks = value.split(splitChar);
        }

        // chunks exist
        if (chunks.length > 1) {
          // remove last chunk
          chunk = chunks.pop();
          // assign new value
          textElem.nodeValue = chunks.join(splitChar) + truncChars;
        } else {
          // reset chunks
          chunks = null;
        }

        if (chunks) {
          // if the text fits into the element we have to check if we
          // can improve the result by splitting by the next character.
          if (elem.clientHeight <= height) {
            if (splitChars.length) {
              // assign new value and additionally the last chunk that was
              // removed. The actual chuck can split up into smaller parts.
              textElem.nodeValue = chunks.join(splitChar) + splitChar + chunk;
              // reset chunks
              chunks = null;
            } else {
              // we're finished with truncating and can return
              return;
            }
          }
        } else {
          // there are no valid chunks even when
          // splitting by letters so we stop here
          if (!truncChars.length) {
            textElem.nodeValue = truncChars;
            return;
          }
        }

        // truncate remaining text
        truncate(textElem);
      }

      // return if truncation isn't required.
      if (elem.clientHeight <= height) {
        return;
      }
      // truncate
      truncate(elem.lastChild);
    },

    adjustToolbar: function () {
      if (!this.options.hideToolbar) {
        this.headerToolbarView.triggerMethod('dom:refresh');
      }
    },

    getDelayedHeaderViewActions: function () {
      var headerToolbarDelayedActions = (this.options.headertoolbaritems &&
                                         this.options.headertoolbaritems['delayedActionsToolbar']) ?
                                        this.options.headertoolbaritems['delayedActionsToolbar'].collection :
                                        HeaderToolbarItems['delayedActionsToolbar'].collection;

      return _.chain(headerToolbarDelayedActions.pluck('signature'))
          .unique()
          .value();
    },

    handleError: function (model, response, option) {
      if (response){
        if (response.responseJSON.error) {
          var emptyEl = errorTemplate.call(this, { errorMessage: response.responseJSON.error });
          if(this.$el.find('.conws-header-error').length > 0)
          {
            this.$el.find('div').remove('.conws-header-error');
          }
          this.$el.append(emptyEl);
          this.$el.find('.conws-header-wrapper').hide();
        }
      }
    }
  });

  // return the initialized view
  return HeaderView;
});
