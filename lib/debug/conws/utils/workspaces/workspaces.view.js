/**
 * The workspaces view to show a list of workspaces of a specific type
 * Provides:
 *   - infinite scrolling
 *   - Empty view in case no workspaces to show
 *   - Title icon
 */
csui.define(['csui/lib/marionette', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery',
  'csui/utils/base',
  'csui/controls/list/list.view',
  'csui/utils/nodesprites',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/list/behaviors/list.view.keyboard.behavior',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/controls/icon/icon.view',
  'csui/utils/contexts/factories/node',
  'csui/controls/progressblocker/blocker',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/dialogs/modal.alert/modal.alert',
  'i18n!conws/utils/workspaces/impl/nls/lang',
  'css!conws/utils/workspaces/workspaces',
  'hbs!conws/utils/workspaces/error.template'
], function (Marionette, module, _, Backbone, $, base, ListView, NodeSpriteCollection,
    LimitingBehavior, ExpandingBehavior, TabableRegionBehavior, ListViewKeyboardBehavior,
    InfiniteScrollingBehavior, IconView, NodeModelFactory, BlockingView, NodeTypeIconView, ModalAlert, lang, css, errorTemplate) {

  var config = module.config();

  /**
   * own behavior needed, to be able to trigger the closing
   * of the dialog from within the expanded view itself.
   * Also connect collapsed and expanded view, while expanded view is open,
   * to provide access to each other and disconnect views on close.
   */
  var WorkspacesExpandingBehavior = ExpandingBehavior.extend({

    constructor: function WorkspacesExpandingBehavior( options, view ) {
      options = _.extend({collapsedView:view},options);
      ExpandingBehavior.prototype.constructor.call(this, options,view );
      this.listenTo(view.options.context, "close:expanded", function(ev) {
        if (ev.widgetView===this.expandedView && this.dialog && this.dialog.body && this.dialog.body.currentView===ev.widgetView ) {
          this.dialog.destroy();
        }
      });
    },
    _expandOtherView: function (expand) {
      if (expand===false) {
        // this is on opening the expanded view
        this.expandedView.collapsedView = this.view;
        this.view.expandedView = this.expandedView;
      }
      var result = ExpandingBehavior.prototype._expandOtherView.apply(this, arguments);
      return result;
    },

    _enableExpandingAgain: function () {
      var result = ExpandingBehavior.prototype._enableExpandingAgain.apply(this, arguments);
      // this is on closing the expanded view
      this.expandedView.collapsedView = undefined;
      this.view.expandedView = undefined;
      return result;
    }

  });

  var WorkspacesView = ListView.extend({

    constructor: function WorkspacesView(options) {
      if (options === undefined || !options.context) {
        throw new Error('Context required to create WorkspacesView');
      }

      options.data || (options.data = {});
      ListView.prototype.constructor.apply(this, arguments);

      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }

      this.options.data.pageSize = config.defaultPageSize || 30;

      this.configOptionsData = _.clone(options.data);

      // Prepare server side filter
      this.lastFilterValue = "";

      // Per default show expand icon if more than 0 workspaces are displayed
      this.limit = 0;

      // Render workspace icon
      this.listenTo(this.collection, "sync", this._renderWorkspaceTitleIcon);

      //Show errors
      this.listenTo(this.collection, 'error', this.handleError);

      // In case node model is changed reset data (needed in case other workspaces is opened in
      // same perspective)
      var nodeModel = this.getContext().getObject(NodeModelFactory, options.context.options);
      this.listenTo(nodeModel, 'change:id', this._reset);

      // Note on this.messageOnError
      // Set this property with an action specific error message before triggering the refetch
      // of the collection. If the fetch runs into an error this message is displayed in a modal
      // error message. In any case, error or success, after the server call this message is
      // reset to undefined.

      // Loading animation
      this.listenTo(this.collection, "request", this.blockActions)
          .listenTo(this.collection, "sync", function () {
            this.messageOnError = undefined;
            this.unblockActions.apply(this, arguments);
          })
          .listenTo(this.collection, "destroy", this.unblockActions)
          .listenTo(this.collection, "error", function () {
            this.unblockActions.apply(this, arguments);
            if (this.messageOnError) {
              ModalAlert.showError(this.messageOnError);
              this.messageOnError = undefined;
            }
          });
      // No empty view in case of loading animation
      this.listenTo(this.collection, "request", this.destroyEmptyView);

      // to reload the collapsed view only in case, the expanded view changed something,
      // we want to check the changed flag of the expanded view.
      this.listenTo(this, "go:away", function() {
        // listen to "go:away", which is triggered on open, and then listen to the "destroy" event of the expanded view.
        // we cannot listen to "go:back" as in some scenarios (CWS-5702, CWS-5807) "hide" events are triggered multiple times.
        var expandedView = this.expandedView;
        if (expandedView) {
          this.listenTo(expandedView, "destroy", function() {
            // called, when expanded view is closed/destroyed.
            // when expanded view was just opened and closed without changing anything,
            // to avoid reloading, check for the changed flag of expanded view.
            if (expandedView && expandedView.changed) {
              this.collection.fetch();
              expandedView = undefined;
            }
          });
        }
      });

    },

    getContext: function () {
      return this.options.context;
    },

    initialize: function () {
      // Limiting behaviour needs complete collection, but other behaviours expect collection ...
      this.collection = this.completeCollection;
    },

    onRender: function () {
      // Load initially only one page
      this._resetInfiniteScrolling();
      ListView.prototype.onRender.call(this);
    },

    onClickHeader: function (target) {
      this.triggerMethod('expand');
    },

    _resetInfiniteScrolling: function () {
      // reset infinite scrolling in case filter is changed
      this.collection.setLimit(0, this.options.data.pageSize, false);
    },

    templateHelpers: function () {
      return {
        title: this._getTitle(),
        imageUrl: this._getTitleIcon().src,
        imageClass: 'conws-workspacestitleicon',
        searchPlaceholder: this._getSearchPlaceholder()
      };
    },

    childEvents: {
      'click:item': 'onClickItem',
      'render': 'onRenderItem'
    },

    onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    className: function () {
      // conws-relatedworkspaces conws-workspacetype-xxx cs-list
      var className       = this.viewClassName,
          workspaceType   = this.options.data.workspaceType,
          parentClassName = _.result(ListView.prototype, 'className');
      if (workspaceType) {
        className = className + ' conws-workspacetype-' + workspaceType;
      }
      if (parentClassName) {
        className = className + ' ' + parentClassName;
      }
      return className;
    },

    /**
     * Reset the current model/query and filter
     * Needed that it's not reused in in case widget is accessed again
     * on same perspective but with different node.
     *
     * @private
     */
    _reset: function () {
      // reset paging due to infinite scrolling
      // Page have to be reset in case wiget is accessed again
      if (this.collection) {
        this.collection.resetLimit();
      }

      // Reset filter
      if (this.ui.searchInput && this.ui.searchInput.val() !== "") {
        if (this.collection) {
          this.collection.clearFilter(false);
        }
        this.ui.searchInput.val('');
      }

      // Call search clicked if search is visible, this will cause the search box to slide out
      if (this.ui.searchInput && this.ui.searchInput.is(':visible')) {
        this.searchClicked(new CustomEvent(''));
      }
    },

    workspacesCollectionFactory: undefined,
    workspacesTableView: undefined,
    viewClassName: undefined,
    dialogClassName: undefined,
    lang: undefined,

    behaviors: {

      // Limits the rendered collection length with a More link to expand it
      LimitedList: {
        behaviorClass: LimitingBehavior,
        // Show expand if more than 0 workspaces are displayed
        limit: function () {
          return this.limit;
        },
        completeCollection: function () {
          return this.getContext().getCollection(this.workspacesCollectionFactory, {
            attributes: this._getCollectionAttributes(),
            options: this._getCollectionOptions()
          });
        }
      },

      ExpandableList: {
        behaviorClass: WorkspacesExpandingBehavior,
        expandedView: function () {
          return this.workspacesTableView;
        },
        expandedViewOptions: function () {
          return this._getExpandedViewOptions();
        },
        dialogTitle: function () {
          return this._getTitle();
        },
        dialogTitleIconNameRight: "csui_action_minimize32",
        dialogClassName: function () {
          return "conwsworkspacestable" + (this.dialogClassName ? " "+this.dialogClassName : "");
        },
        titleBarImageUrl: function () {
          return this._getTitleIcon().src;
        },
        titleBarImageClass: function () {
          return this._getTitleIcon().cssClass || 'conws-workspacestitleicon';
        }
      },

      InfiniteScrolling: {
        behaviorClass: InfiniteScrollingBehavior,
        // selector for scrollable area
        contentParent: '.tile-content',
        fetchMoreItemsThreshold: 80
      },

      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },

      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      }
    },

    _getCollectionOptions: function() {
      return { query: this._getCollectionUrlQuery() };
    },

    _getExpandedViewOptions: function() {
      return { data: _.clone(this.configOptionsData) };
    },

    filterChanged: function (event) {
      if (event && event.type === 'keyup' && event.keyCode === 27) {
        // Hitting Esc should get rid of the filtering control; it resets
        // the filter value automatically
        this.searchClicked();
      }

      var filterValue = this.ui.searchInput.val();
      if (this.lastFilterValue !== filterValue) {
        this.lastFilterValue = filterValue;
        // Wait 1 second to execute
        if (this.filterTimeout) {
          clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(function (self) {
          self.filterTimeout = undefined;
          // reset infinite scrolling because in case filter is changed only first page should be fetched
          self._resetInfiniteScrolling();
          // reset collection that only the returned workspaces are displayed
          // if not reset also old workspaces are displayed ...
          self.collection.reset();
          // execute server side filtering
          var propertyName;
          if (self._getFilterPropertyName) {
            propertyName = self._getFilterPropertyName();
          }
          var filterOptions = {};
          filterOptions[propertyName || "name"] = filterValue;
          if (self.collection.setFilter(filterOptions, {fetch: false})) {
            self.messageOnError = lang.errorFilteringFailed;
            self.collection.fetch();
          }
        }, 1000, this);
      }
    },

    /**
     * Get the title icon for the widget.
     * Initially an invisible icon is returned until the rest call returns.
     * In case the rest call provides an title image this is returned as src, otherwise
     * the default workspace title image is returned as css.
     */
    _getTitleIcon: function () {
      // Set transparent gif that it can be replaced later with proper image
      var icon = {
        src: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
        cssClass: undefined
      };

      if (this.collection && this.collection.titleIcon) {
        // For each workspace type one icon exist
        icon.src = this.collection.titleIcon;
      } else if (this.collection && this.collection.titleIcon === null) {
        // Need to return as class, because URL would not point to proper image
        icon.src = undefined;
      }
      return icon;
    },

    /**
     * Render workspace icon after rest call returns.
     * Depending on what and if rest call returns an icon,
     * set icon as IconView (default icon) or the configured one as src.
     * Icons are set via DOM manipulation.
     */
    _renderWorkspaceTitleIcon: function () {
      var titleDivEl = this.$el.find('.tile-type-image')[0],
          titleImgEl = titleDivEl && this.$el.find('.tile-type-image').find("img")[0];
      if (titleImgEl) {
        var icon = this._getTitleIcon();
        if ($(titleImgEl).attr('src') !== icon.src) {
          $(titleImgEl).attr('src', icon.src);
        }

        if (icon.src === undefined) {
          //render default icon with icons-v2
          var titleIconView = new IconView({iconName: 'conws_mime_workspace', size: 'large'});
          var titleIconRegion = new Marionette.Region({el: titleDivEl});
          titleIconRegion.show(titleIconView);
          titleIconView.$el.addClass("tile-type-icon tile-type-icon-img");
        }
      }
    },

    _getTitle: function () {
      var ret = this.lang.dialogTitle;

      if (this.options.data.title) {
        ret = base.getClosestLocalizedString(this.options.data.title, this.lang.dialogTitle);
      }

      return ret;
    },

    _getSearchPlaceholder: function () {
      return this.lang.searchPlaceholder.replace("%1", this._getTitle());
    },

    _getNoResultsPlaceholder: function () {
      var ret = this.options.data &&
                this.options.data.collapsedView &&
                this.options.data.collapsedView.noResultsPlaceholder;

      if (ret) {
        ret = base.getClosestLocalizedString(ret, this.lang.noResultsPlaceholder);
      } else {
        ret = this.lang.noResultsPlaceholder;
      }

      return ret;
    },

    // To use default empty view from ListView, the following functions are needed
    collectionEvents: {
      'reset': 'onCollectionSync'
    },

    onCollectionSync: function () {
      this.synced = true;
    },

    isEmpty: function () {
      return this.synced && (this.collection.models.length === 0);
    },

    onRenderItem: function (childView) {
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$('.csui-type-icon').get(0),
        node: childView.model
      });
      childView._nodeIconView.render();
      childView.$el.attr('role', 'option');
    },

    handleError: function () {
      if (this.collection.error && this.collection.error.message) {
        var emptyEl = errorTemplate.call(this, { errorMessage: this.collection.error.message });
        if(this.$el.find('.conws-workspaces-error').length > 0)
        {
          this.$el.find('div').remove('.conws-workspaces-error');
        }
        this.$el.find('.tile-content').append(emptyEl);
      }
    }

  });

  return WorkspacesView;

});
