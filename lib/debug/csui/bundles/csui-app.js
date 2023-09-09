// Expands the limited view by showing the full one in a modal dialog
csui.define('csui/behaviors/expanding/expanding.behavior',['require', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette'
], function (require, _, Backbone, Marionette) {

  var ExpandingBehavior = Marionette.Behavior.extend({

    constructor: function ExpandingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      // The perspective begins to change with an animation before the
      // previous one is destroyed; the expanded view should be hidden
      // previous one is.
      var destroyWithAnimation = _.bind(this._destroyExpandedView, this, false),
          destroyImmediately   = _.bind(this._destroyExpandedView, this, true),
          context              = view.options && view.options.context;
      this.listenTo(this, 'before:destroy', destroyWithAnimation);
      if (context) {
        // The hiding animation finishes before the context is fetched
        // and the page is re-rendered.  If it becomes problem, use
        // destroyImmediately here.
        this.listenTo(context, 'request', destroyWithAnimation)
            .listenTo(context, 'request:perspective', destroyWithAnimation);
      }
    },

    onExpand: function () {
      // If the expanding event is triggered multiple times, it should be
      // handled just once by showing the expanded view; it is likely, that
      // the expanding button was clicked quickly twice
      if (this.expanded) {
        return;
      }
      // Do not use the later initialized this.dialog property; loading
      // the modules with the expanded view below may take some time.
      this.expanded = true;

      var self = this;
      // TODO: remove completeCollection and limiting behavior.  Both
      // client- and server-side browsable collections should provide
      // the same interface and use the according mixins.
      var collection = this.view.completeCollection ?
                       this.view.completeCollection.clone() :
                       this.view.collection.clone();

      // pass filter from the collapsed tile to the expanded table
      if (this.view.currentFilter !== undefined) {
        collection.setFilter(this.view.currentFilter, {fetch: false});
      }
      // close and clear the filter in the collapsed tile
      this.view.isSearchOpen() && this.view.searchClicked();

      var expandedViewValue = self.getOption('expandedView');
      var expandedViewClass = expandedViewValue;
      if (_.isString(expandedViewValue) !== true) {
        expandedViewClass = expandedViewValue.prototype instanceof Backbone.View ?
                            expandedViewValue :
                            expandedViewValue.call(self.view);
      }
      var requiredModules = ['csui/controls/dialog/dialog.view'];
      if (_.isString(expandedViewClass)) {
        requiredModules.push(expandedViewClass);
      }
      require(requiredModules, function (DialogView) {
        if (_.isString(expandedViewClass)) {
          expandedViewClass = arguments[1];
        }
        var expandedViewOptions = getOption(self.options, 'expandedViewOptions', self.view);
        self.expandedView = new expandedViewClass(_.extend({
          context: self.view.options.context,
          collection: collection,
          orderBy: getOption(self.options, 'orderBy', self.view),
          filterBy: self.view.currentFilter,
          limited: false,
          isExpandedView: true
        }, expandedViewOptions));
        // todo: remove old icon* attributes (without 'Name' in name) when SmartUI has been
        //  migrated completely to icons-v2
        self.dialog = new DialogView({
          iconLeft: getOption(self.options, 'titleBarIcon', self.view) ||
                    getOption(self.view.options, 'titleBarIcon', self.view),
          iconNameLeft: getOption(self.options, 'titleBarIconName', self.view) ||
                    getOption(self.view.options, 'titleBarIconName', self.view),
          actionIconLeft: getOption(self.options, 'actionTitleBarIcon', self.view) ||
                          getOption(self.view.options, 'actionTitleBarIcon', self.view),
          actionIconNameLeft: getOption(self.options, 'actionTitleBarIconName', self.view) ||
                          getOption(self.view.options, 'actionTitleBarIconName', self.view),
          imageLeftUrl: getOption(self.options, 'titleBarImageUrl', self.view),
          imageLeftClass: getOption(self.options, 'titleBarImageClass', self.view),
          title: getOption(self.options, 'dialogTitle', self.view),
          iconRight: getOption(self.options, 'dialogTitleIconRight', self.view),  // legacy
          iconNameRight: getOption(self.options, 'dialogTitleIconNameRight', self.view),
          className: getClassName(self.options, 'dialogClassName', self.view),
          largeSize: true,
          view: self.expandedView,
          headerView: getOption(self.options, 'headerView', self.view)
        });
        self.listenTo(self.dialog, 'before:hide', self._expandOtherView)
            .listenTo(self.dialog, 'destroy', self._enableExpandingAgain);
        self._expandOtherView(false);
        self.dialog.show();
      }, function (error) {
        // If the module from the csui base cannot be loaded, something is so
        // rotten, that it does not make sense trying to load other module to
        // show the error message.
        // There will be more information on the browser console.
        self.expanded = false;
      });
    },

    _destroyExpandedView: function (immediately) {
      if (this.dialog) {
        var method = immediately ? 'kill' : 'destroy';
        this.dialog[method]();
        this.dialog = undefined;
      }
    },

    _expandOtherView: function (expand) {
      this.options.collapsedView && this.options.collapsedView.triggerMethod(
          expand === false ? 'go:away' : 'go:back');
    },

    _enableExpandingAgain: function () {
      this.expanded = false;
      if (this.view.tabableRegionBehavior) {
        var navigationBehavior = this.view.tabableRegionBehavior,
            targetElement      = this.view.ui.tileExpand;
        navigationBehavior.currentlyFocusedElement &&
        navigationBehavior.currentlyFocusedElement.prop('tabindex', -1);
        targetElement && targetElement.prop('tabindex', 0);
        targetElement.trigger('focus');
        navigationBehavior.setInitialTabIndex();
        this.view.currentTabPosition = 2;
      }
    }

  });

  // TODO: Expose this functionality and make it generic for functiona objects too.
  function getOption(object, property, context) {
    if (object == null) {
      return void 0;
    }
    var value = object[property];
    return _.isFunction(value) ? object[property].call(context) : value;
  }

  function getClassName(options, property, context) {
    var className = getOption(options, property, context);
    if (className) {
      className += ' csui-expanded';
    } else {
      className = 'csui-expanded';
    }
    return className;
  }

  return ExpandingBehavior;

});

csui.define('csui/behaviors/item.error/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/behaviors/item.error/impl/nls/root/lang',{
  itemCannotBeAccessed : 'Item cannot be accessed.'
});


csui.define('csui/behaviors/item.error/item.error.behavior',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/error/error.view',
  'i18n!csui/behaviors/item.error/impl/nls/lang',
  'csui/lib/binf/js/binf'
], function (_, Backbone, Marionette, ErrorView, lang) {
  'use strict';

  var ItemErrorBehavior = Marionette.Behavior.extend({

    constructor: function ItemErrorBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      this.view = view;

      // Behaviors are created before the model is stored in the view
      var model = getBehaviorOption.call(this, 'model') ||
                  view.model || view.options.model;
      this._setupErrorHandling(model);

      var errorView = this.getOption('errorView');
      if (_.isFunction(errorView) &&
          !(errorView.prototype instanceof Backbone.View)) {
        errorView = errorView.call(view);
      }
      errorView || (errorView = ErrorView);

      // Disable the view's template and content, if fetching the model
      // failed and the error should not be placed in part of the view
      var getTemplate = view.getTemplate,
          self        = this;
      view.getTemplate = function () {
        if (this.model && this.model.error) {
          // A string selector would point to a part of the view's content
          // rendered using the view's template
          var el = getBehaviorOption.call(self, 'el');
          if (typeof el !== 'string') {
            if (!getBehaviorOption.call(self, 'region')) {
              return false;
            }
          }
        }
        return getTemplate.apply(view, arguments);
      };

      var errorRegion;
      this.listenTo(view, 'render', function () {
        // Render an inner error control, if fetching the data failed
        var error = this.model && this.model.error;
        if (error) {
          if (errorRegion) {
            errorRegion.empty();
          }
          errorRegion = getBehaviorOption.call(this, 'region');
          if (!errorRegion) {
            var el = getBehaviorOption.call(this, 'el') || view.el;
            if (typeof el === 'string') {
              el = view.$(el);
            }
            errorRegion = new Marionette.Region({el: el});
          }
          errorRegion.show(new errorView(
              _.extend({
                model: new Backbone.Model({
                  message: lang.itemCannotBeAccessed,
                  title: error.message
                })
              }, getBehaviorOption.call(this, 'errorViewOptions'))
          ));
        }
      })
          .listenTo(view, 'before:destroy', function () {
            // Destroy the inner error control
            if (errorRegion) {
              errorRegion.empty();
            }
          })
          .listenTo(view, 'update:model', this._setupErrorHandling);
    },

    _setupErrorHandling: function (model) {
      this.model && this.stopListening(this.model);
      this.model = model;
      this.listenTo(this.model, 'error', function () {
        // Re-render the view, if fetching the data failed
        this.view.render();
      });
    }

  });

  function getBehaviorOption(property) {
    var value = this.getOption(property);
    return (_.isFunction(value) ? value.call(this.view) : value);
  }

  return ItemErrorBehavior;
});


/* START_TEMPLATE */
csui.define('hbs!csui/behaviors/item.state/impl/item.state',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":11}}}) : helper)))
    + "\r\n";
}});
Handlebars.registerPartial('csui_behaviors_item.state_impl_item.state', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/behaviors/item.state/item.state.view',[
  'csui/lib/underscore', 'csui/lib/marionette',
  'hbs!csui/behaviors/item.state/impl/item.state'
], function (_, Marionette, template) {
  'use strict';

  var ItemStateView = Marionette.ItemView.extend({

    className: 'csui-item-state',

    template: template,

    constructor: function ItemStateView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, 'change:state', this.render)
          .listenTo(this, 'render', this._updateClasses);
    },

    serializeData: function () {
      return _.extend(this.model.toJSON(), {
        // empty, loading, failed
        message: this.options.stateMessages[this.model.get('state')]
      });
    },

    _updateClasses: function () {
      this.$el
          .removeClass('csui-state-loading csui-state-failed')
          .addClass('csui-state-' + this.model.get('state'));
    }

  });

  return ItemStateView;
});

csui.define('csui/behaviors/item.state/item.state.behavior',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/behaviors/item.state/item.state.view'
], function (_, Backbone, Marionette, ItemStateView) {
  'use strict';

  var ItemStateBehavior = Marionette.Behavior.extend({

    constructor: function ItemStateBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      this.view = view;

      // Behaviors are created before the model is stored in the view
      var model = getBehaviorOption.call(this, 'model') ||
                  view.model || view.options.model;
      this.listenTo(model, 'request', this._fetchingCollectionStarted)
          .listenTo(model, 'sync', this._fetchingCollectionSucceeded)
          .listenTo(model, 'error', this._fetchingCollectionFailed);

      this.itemState = new Backbone.Model({
        state: model.fetching ? 'loading' :
               model.error ? 'failed' : 'loaded'
      });

      var stateView = this.getOption('stateView');
      if (_.isFunction(stateView) &&
          !(stateView.prototype instanceof Backbone.View)) {
        stateView = stateView.call(view);
      }
      this.stateView = stateView || ItemStateView;

      // Disable the view's template and content, if fetching the model
      // failed and the error should not be placed in part of the view
      var getTemplate = view.getTemplate,
          self = this;
      view.getTemplate = function () {
        if (!model.fetched) {
          // A string selector would point to a part of the view's content
          // rendered using the view's template
          var el = getBehaviorOption.call(self, 'el');
          if (typeof el !== 'string') {
            if (!getBehaviorOption.call(self, 'region')) {
              return false;
            }
          }
        }
        return getTemplate.apply(view, arguments);
      };

      var stateRegion;
      this.listenTo(view, 'render', function () {
            if (!model.fetched) {
              if (stateRegion) {
                stateRegion.empty();
              }
              stateRegion = getBehaviorOption.call(this, 'region');
              if (!stateRegion) {
                var el = getBehaviorOption.call(this, 'el') || view.el;
                if (typeof el === 'string') {
                  el = view.$(el);
                }
                stateRegion = new Marionette.Region({el: el});
              }
              stateRegion.show(new this.stateView(
                  _.extend({
                    model: this.itemState,
                    stateMessages: getBehaviorOption.call(this, 'stateMessages') || {}
                  }, getBehaviorOption.call(this, 'stateViewOptions'))
              ));
            }
          })
          .listenTo(view, 'before:destroy', function () {
            // Destroy the inner error control
            if (stateRegion) {
              stateRegion.empty();
            }
          });
    },

    _fetchingCollectionStarted: function () {
      this.itemState.set('state', 'loading');
      this.view.render();
      this.view.blockWithoutIndicator && this.view.blockWithoutIndicator();
    },

    _fetchingCollectionSucceeded: function (model) {
      this.itemState.set('state', 'loaded');
      this.view.unblockActions && this.view.unblockActions();
    },

    _fetchingCollectionFailed: function () {
      this.itemState.set('state', 'failed');
      this.view.unblockActions && this.view.unblockActions();
    }

  });

  function getBehaviorOption(property) {
    var value = this.getOption(property);
    return (_.isFunction(value) ? value.call(this.view) : value);
  }

  return ItemStateBehavior;
});

// Limits the rendered collection length with a More link to expand it
csui.define('csui/behaviors/limiting/limiting.behavior',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette'
], function (_, Backbone, Marionette) {
  "use strict";

  var LimitingBehavior = Marionette.Behavior.extend({
    defaults: {
      limit: 6,
      filterByProperty: 'name'
    },

    collectionEvents: {'reset': 'enableMoreLink'},

    events: {
      'click .cs-more': 'onMoreLinkClick',
      'click .tile-expand': 'onMoreLinkClick',
    },

    ui: {moreLink: '.cs-more'},

    constructor: function LimitingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
    },

    // Initialize is called after the constructor of the parent view, which
    // assigns the collection and which we need here.  The collection
    // assignment cannot be delayed till the before:render is triggered.
    initialize: function (options, view) {
      if (view.options.limited !== false) {
        var completeCollection = view.collection,
            completeCollectionOptions;
        if (!completeCollection) {
          completeCollection = this.getOption('completeCollection');
          if (!(completeCollection instanceof Backbone.Collection)) {
            completeCollectionOptions = this.getOption('completeCollectionOptions');
            if (completeCollection.prototype instanceof Backbone.Collection) {
              completeCollection = new completeCollection(undefined, completeCollectionOptions);
            } else {
              completeCollection = completeCollection.call(view);
              if (!(completeCollection instanceof Backbone.Collection)) {
                completeCollection = new completeCollection(undefined, completeCollectionOptions);
              }
            }
          }
        }
        if (view.options.orderBy) {
          completeCollection.setOrder(view.options.orderBy, false);
        }

        this.listenTo(completeCollection, 'add', this._addItem)
            .listenTo(completeCollection, 'remove', this._removeItem)
            .listenTo(completeCollection, 'reset', this.enableMoreLink)
            .listenTo(completeCollection, 'sync', function (object) {
              if (object instanceof Backbone.Collection) {
                this.synchronizeCollections();
              }
            });
        view.completeCollection = completeCollection;
        var ViewCollection = Backbone.Collection.extend(
            completeCollection ? {model: completeCollection.model} : {}
        );
        view.collection = new ViewCollection();
        this.synchronizeCollections();
        this.listenTo(view, 'change:filterValue', this.synchronizeCollections);
      }
    },

    synchronizeCollections: function () {
      // no need to synchronize if collections are one and the same object.
      if (this.view.collection===this.view.completeCollection) {
        return;
      }
      var models;
      // search has value
      if (this.view.options.filterValue && this.view.options.filterValue.length > 0) {
        var keywords = this.view.options.filterValue.toLowerCase().split(' ');
        var filterByProperty = getOption(this.options, 'filterByProperty', this.view);

        this.view.currentFilter = {};
        this.view.currentFilter[filterByProperty] = this.view.options.filterValue.toLowerCase();

        models = this.view.completeCollection.filter(function (item) {
          var name = item.get(filterByProperty),
              isMatch;
          if (name) {
            // FIXME: Apply collation rules
            name = name.trim().toLowerCase();
            isMatch = _.reduce(keywords, function (result, keyword) {
              return result && name.indexOf(keyword) >= 0;
            }, true);
          }
          return isMatch;
        });
      } else {
        // no filtering
        this.view.currentFilter = undefined;
        models = this.view.completeCollection.models;
      }
      this.view.collection.reset(models);
    },

    enableMoreLink: function () {
      var limit  = getOption(this.options, 'limit', this.view),
          enable = this.view.completeCollection &&
                   this.view.completeCollection.length > limit;
      if (this.ui.moreLink instanceof Object) {
        this.ui.moreLink[enable ? 'removeClass' : 'addClass']('binf-hidden');
      }
    },

    onMoreLinkClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      // TODO this is actually required to make the expanding behaviour work!?
      this.view.triggerMethod('expand');
    },

    _addItem: function (model) {
      var index = this.view.completeCollection.indexOf(model);
      this.view.collection.add(model, { at: index });
    },

    _removeItem: function (model) {
      this.view.collection.remove(model);
    }
  });

  // TODO: Expose this functionality and make it generic for functional objects too.
  function getOption(object, property, context) {
    if (object == null) {
      return void 0;
    }
    var value = object[property];
    return _.isFunction(value) ? object[property].call(context) : value;
  }

  return LimitingBehavior;
});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/tile/behaviors/impl/expanding.behavior',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-more tile-expand\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandIconTitle") || (depth0 != null ? lookupProperty(depth0,"expandIconTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandIconTitle","hash":{},"loc":{"start":{"line":1,"column":40},"end":{"line":1,"column":59}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"expandIconAria") || (depth0 != null ? lookupProperty(depth0,"expandIconAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"expandIconAria","hash":{},"loc":{"start":{"line":1,"column":73},"end":{"line":1,"column":91}}}) : helper)))
    + "\"\r\n     role=\"button\">\r\n  "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"iconName":"csui_action_expand32"},"loc":{"start":{"line":3,"column":2},"end":{"line":3,"column":48}}})) != null ? stack1 : "")
    + "\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_controls_tile_behaviors_impl_expanding.behavior', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/tile/behaviors/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/controls/tile/behaviors/impl/nls/root/lang',{
  expandIconTooltip: 'Expand',
  expandIconAria: 'Expand {0} widget'

});


csui.define('csui/controls/tile/behaviors/expanding.behavior',['require', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette',
  'hbs!csui/controls/tile/behaviors/impl/expanding.behavior',
  'i18n!csui/controls/tile/behaviors/impl/nls/lang',
  'csui/controls/icons.v2'
], function (require, _, Backbone, Marionette, template, lang, iconRegistry) {
  "use strict";

  var ExpandingBehavior = Marionette.Behavior.extend({

    defaults: {
      expandButton: '.tile-footer'
    },

    triggers: {
      'click .cs-more': 'expand',
      'click .tile-header': 'expand'
    },

    constructor: function ExpandingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, 'render', this._renderExpandButton);
      this.listenTo(view, 'expand', this._expand);
      // The perspective begins to change with an animation before the
      // previous one is destroyed; the expanded view should be hidden
      // previous one is.
      var destroyWithAnimation = _.bind(this._destroyExpandedView, this, false),
          destroyImmediately = _.bind(this._destroyExpandedView, this, true),
          context = view.options && view.options.context;
      this.listenTo(this, 'before:destroy', destroyWithAnimation);
      if (context) {
        // The hiding animation finishes before the context is fetched
        // and the page is re-rendered.  If it becomes problem, use
        // destroyImmediately here.
        this.listenTo(context, 'request', destroyWithAnimation)
            .listenTo(context, 'request:perspective', destroyWithAnimation);
      }
    },

    _renderExpandButton: function () {
      var expandButtonSelector = getOption.call(this, 'expandButton'),
          expandButton = this.view.$(expandButtonSelector),
          iconTitle = getOption.call(this, 'expandIconTitle'),
          expandIconTitle = iconTitle ? iconTitle : lang.expandIconTooltip,
          dialogTitle = getOption.call(this, 'dialogTitle'),
          iconAria = getOption.call(this, 'expandIconAria'),
          expandIconAria = iconAria ? iconAria : _.str.sformat(lang.expandIconAria, dialogTitle),
          data = {
            expandIconTitle: expandIconTitle,
            expandIconAria: expandIconAria
          };
      expandButton.html(template(data));
    },

    _expand: function () {
      if (this.expanded || (this.view && !!this.view.errorExists)) {
        return;
      }
      this.expanded = true;
      var expandedViewValue = this.getOption('expandedView'),
          expandedViewClass = expandedViewValue.prototype instanceof Backbone.View ?
                              expandedViewValue : expandedViewValue.call(this.view),
          requiredModules = ['csui/controls/dialog/dialog.view'],
          self = this;
      if (_.isString(expandedViewClass)) {
        requiredModules.push(expandedViewClass);
      }
      require(requiredModules, function (DialogView) {
        if (_.isString(expandedViewClass)) {
          expandedViewClass = arguments[1];
        }
        var expandedViewOptions = getOption.call(self, 'expandedViewOptions'),
            expandedView = new expandedViewClass(expandedViewOptions);
        self._dialog = new DialogView({
          iconLeft: getOption.call(self, 'titleBarIcon'),
          imageLeftUrl: getOption.call(self, 'titleBarImageUrl'),
          imageLeftClass: getOption.call(self, 'titleBarImageClass'),
          title: getOption.call(self, 'dialogTitle'),
          iconRight: getOption.call(self, 'dialogTitleIconRight'),
          className: 'cs-expanded ' + (getOption.call(self, 'dialogClassName') || ''),
          largeSize: true,
          view: expandedView
        });
        self.listenTo(self._dialog, 'hide', function () {
          self.triggerMethod('collapse');
        }).listenTo(self._dialog, 'destroy', self._enableExpandingAgain);
        self._dialog.show();
      });
    },

    _enableExpandingAgain: function () {
      this.expanded = false;
    },

    _destroyExpandedView: function () {
      if (this._dialog) {
        this._dialog.destroy();
        this._dialog = undefined;
      }
    }

  });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property) {
    var options = this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return ExpandingBehavior;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/tile/impl/tile',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"tile-type-icon\">\r\n      <span class=\"icon title-icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":5,"column":35},"end":{"line":5,"column":43}}}) : helper)))
    + "\" aria-hidden=\"true\"></span>\r\n    </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"imageUrl") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"tile-type-image "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imageClass") || (depth0 != null ? lookupProperty(depth0,"imageClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imageClass","hash":{},"loc":{"start":{"line":9,"column":34},"end":{"line":9,"column":48}}}) : helper)))
    + "\">\r\n        <span class=\"tile-type-icon tile-type-icon-img\"><img src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imageUrl") || (depth0 != null ? lookupProperty(depth0,"imageUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imageUrl","hash":{},"loc":{"start":{"line":10,"column":66},"end":{"line":10,"column":78}}}) : helper)))
    + "\" alt=\"\" aria-hidden=\"true\"></span>\r\n      </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-header\">\r\n\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"icon") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":2},"end":{"line":13,"column":9}}})) != null ? stack1 : "")
    + "\r\n  <div class=\"tile-title\" >\r\n    <h2 class=\"csui-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":16,"column":29},"end":{"line":16,"column":38}}}) : helper)))
    + "</h2>\r\n  </div>\r\n\r\n  <div class=\"tile-controls\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":19,"column":36},"end":{"line":19,"column":45}}}) : helper)))
    + "\"></div>\r\n\r\n</div>\r\n\r\n<div class=\"tile-content\"></div>\r\n\r\n<div class=\"tile-footer\"></div>\r\n";
}});
Handlebars.registerPartial('csui_controls_tile_impl_tile', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/controls/tile/impl/tile',[],function(){});
csui.define('csui/controls/tile/tile.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'hbs!csui/controls/tile/impl/tile',
  /* FIXME: Merge this with the list control */
  'css!csui/controls/list/impl/list',
  'css!csui/controls/tile/impl/tile'
], function (_, $, Backbone, Marionette, ViewEventsPropagationMixin, template) {

  var TileView = Marionette.LayoutView.extend({

    className: 'cs-tile cs-list tile content-tile initialLoading',

    template: template,

    regions: {
      headerControls: '.tile-controls',
      content: '.tile-content',
      footer: '.tile-footer'
    },

    ui: {
      footer: '.tile-footer',
      headerControls: '.tile-controls'
    },

    constructor: function TileView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'render', this._renderContentView);
      this.listenToOnce(this.collection, "sync", function () {
        this.$el.removeClass("initialLoading");
      });
      this.listenToOnce(this.collection, "error", _.bind(this.handleError, this));
      this.listenToOnce(this.model, "error", _.bind(this.handleError, this));
    },

    /**
     * The handleError method provides default error handling for tile.view.
     * Can be overridden in custom tiles for different error handling.
     */

    handleError: function () {
      this.errorExists = true;
      this.ui.headerControls.addClass('binf-hidden');
      this.ui.footer.addClass('binf-hidden');
    },

    serializeData: function () {
      return _.reduce(['icon', 'imageUrl', 'imageClass', 'title'],
          function (result, property) {
            result[property] = getOption.call(this, property);
            return result;
          }, {}, this);
    },

    _renderContentView: function () {
      var ContentView = getOption.call(this, 'contentView');
      if (!ContentView) {
        throw new Marionette.Error({
          name: 'NoContentViewError',
          message: 'A "contentView" must be specified'
        });
      }
      var contentViewOptions = getOption.call(this, 'contentViewOptions');
      this.contentView = new ContentView(contentViewOptions);
      this.propagateEventsToViews(this.contentView);
      this.content.show(this.contentView);
    }

  });

  _.extend(TileView.prototype, ViewEventsPropagationMixin);

  // TODO: Expose this functionality and make it generic for other views too
  function getOption(property, source) {
    var value;
    if (source) {
      value = source[property];
    } else {
      value = getOption.call(this, property, this.options || {});
      if (value === undefined) {
        value = this[property];
      }
    }
    return _.isFunction(value) && !(value.prototype instanceof Backbone.View) ?
           value.call(this) : value;
  }

  return TileView;

});

csui.define('csui/controls/iconpreload/icon.preload.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/non-emptying.region/non-emptying.region', 'csui/lib/binf/js/binf'
], function (module, _, $, Marionette, NonEmptyingRegion) {
  'use strict';

  var iconClasses = module.config().iconClasses || {};
  iconClasses = Array.prototype.concat.apply([], _.values(iconClasses));

  var IconPreloadView = Marionette.ItemView.extend({
    id: 'csui-icon-preload',
    template: false,

    onRender: function () {
      this._preloadIcons();
    },

    constructor: function IconPreloadView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    _preloadIcons: function () {
      _.each(iconClasses, function (icon) {
        this.$el.append('<span class="csui-icon ' + icon +
                        '" style="position:fixed;top:-100px;left:-100px;"></span>');
      }, this);
    }
  });

  IconPreloadView.ensureOnThePage = function () {
    //if (base.isIE11()) {
      if (!$("#csui-icon-preload").length) {
        var iconPreloadView = new IconPreloadView(),
            binfContainer   = $.fn.binf_modal.getDefaultContainer(),
            region          = new NonEmptyingRegion({el: binfContainer});
        region.show(iconPreloadView);
      }
    //}
  };

  return IconPreloadView;
});
csui.define('csui/widgets/html.editor/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/html.editor/impl/nls/root/lang',{
  ConfirmQuestionMessage: 'Are you sure to leave this page?',
  ConfirmQuestionTitle: 'Cancel edits?',
  CancelConfirmMessage: 'Are you sure you want to cancel?',
  cancelTitle: "Cancel",
  cancelAria: "Cancel edit",
  saveTitle: "Save",
  saveAria: "Save contents",
  moreActionsAria: "{0} actions menu",
  PageDefaultContent: 'your content goes here',
  noWikiPageFound: 'Item cannot be accessed.',
  RestoreDialogMessage: "You have unsaved changes. Do you want to restore changes and continue" +
                        " editing?",
  RestoreDiaglogTitle: "Restore changes",
  reservedBy: 'Reserved by {0}\n{1}',
  more: 'more',
  properties: 'Properties',
  permissions: 'View permissions',
  Edit: 'Edit',
  unreserve: 'Unreserve',
  Continue: 'Continue',
  Discard: 'Discard',
  insertContentServerLink: 'Insert Content Server Link',
  contentServerLink: 'Content Server Link',
  versionDifferenceConfirmMessage: 'Another user has saved an alternate version of this' +
                                   ' page. Do you still want to add a new version?',
  versionDifferenceConfirmTitle: 'Intermediate version added',
  brokenLinkMessage: "Sorry, the item you requested could not be accessed. Either it does not" +
                     " exist, or you do not have permission to access it. If you were sent a" +
                     " link to this item, please contact the sender for assistance.",
  goToTooltip: "go to {0}",
  previewUnavailable: "Preview Unavailable",
  cannotFindObject: "Cannot find object"
});

csui.define('csui/controls/rich.text.editor/impl/rich.text.util',["csui/lib/underscore", "csui/lib/jquery", "csui/utils/url", 'csui/models/node/node.model',
  'csui/utils/base', 'csui/utils/commands', 'i18n!csui/widgets/html.editor/impl/nls/lang',
  'csui/utils/log'
], function (_, $, Url, NodeModel, base, commands, lang, log) {

  var RichTextEditorUtils = {
    isEmptyContentElement: function (el) {
      return $.trim($(el).text());
    },

    checkDomain: function (view, event) {

      var domainUrl = view.connector.connection.url,
          link      = event.target.href;
      //checks the similarity of links after the domain name.
      view.options.isSameDomain = link.search(new RegExp(domainUrl.split('/api')[0], 'i')) !== -1;
      return view.options.isSameDomain;
    },

    getUrl: function (view, event) {
      var deferred = $.Deferred();
      if (!!event.target.href) {
        var smartLink    = event.target.href.match(/^.*\/app\/(.+)$/i),
            absolute     = new Url(event.target.href).isAbsolute(),
            isSameDomain = absolute ? this.checkDomain(view, event) : true,
            wikiUrl      = event.target.href.match(/^.*\/wiki\/(.+)$/i),
            nodeUrl      = event.target.href.match(/^.*\/open\/(.+)$/i) ||
                           event.target.href.match(/^.*\/nodes\/(.+)$/i),
            objid        = event.target.href.match(/^.*objId\=(.+)$/i), id,
            self         = this;
        if (!smartLink && isSameDomain) { // classic urls of same domain
          if (wikiUrl || objid) { //  urls containing "wiki" or "objId" words
            self.renderLinks({
              event: event,
              connector: view.connector,
              callingViewInstance: view
            }).done(function () {
              deferred.resolve();
            });
          } else if (nodeUrl) { // classic url containing open or nodes of samedomain
            id = nodeUrl[1];
            this.updateLink(event, id);
            deferred.resolve();
          }
          else { // classic url of samedomain that doesnt contain  wiki or nodes or objid or not proper
            deferred.resolve();
          }
        } else {  // smart url or (or) and different domain url
          deferred.resolve();
        }

      }
      return deferred.promise();
    },

    renderLinks: function (args) {
      var node, deferred = $.Deferred();
      var target = !!args.event.target.href ? $(args.event.target) :
                   $(args.event.target).parents('a'),
          that   = args.callingViewInstance,
          self   = this;
      args.event.target = target[0];
      if (!!args.event.target.href.match(/^.*\/wiki\/[0-9]+\/(.+)$/i) ||
          !!args.event.target.href.match(/^.*\/wiki\/[0-9]+$/i)) {
        args.event.stopPropagation();
        args.event.preventDefault();
        if (!!args.event.target.href.match(/^.*\/wiki\/[0-9]+\/(.+)$/i)) {
          node = args.event.target.href.match(/^.*\/wiki\/(.+)\/(.+)$/i);
          node = parseInt(node[1]);
          self._getWikiPageId(args, node, args.event.target.href).done(function (res, node) {
            self.id = res;
            if (!!node) {
              self.updateLink(args.event, node.id);
            } else {
              log.info(lang.brokenLinkMessage);
            }
            deferred.resolve();
          });
        } else if (!!args.event.target.href.match(/^.*\/wiki\/[0-9]+$/i)) {
          node = args.event.target.href.match(/^.*\/wiki\/(.+)$/i);
          node = parseInt(node[1]);
          self.updateLink(args.event, node);
          deferred.resolve();
        }

      }
      else if (!!args.event.target.href.match(/^.*objId\=(.+)$/)) {
        args.event.stopPropagation();
        args.event.preventDefault();
        var objIdIndex = args.event.target.href.match(/^.*objId\=(.+)$/)[1];
        if (objIdIndex !== -1) {
          node = this.getNewNodeModel({
            attributes: {
              id: parseInt(objIdIndex)
            },
            connector: args.connector
          });
          self.updateLink(args.event, node.attributes.id);
        }
        deferred.resolve();
      }
      return deferred.promise();
    },

    getNewNodeModel: function (options) {
      return new NodeModel(options.attributes, {
        connector: options.connector,
        commands: commands.getAllSignatures(),
        fields: options.fields || {},
        expand: options.expand || {}
      });
    },

    updateLink: function (el, nodeId) {
      var cslinkPattern = /^.*\/(cs\.\w{3}|livelink\.\w{3}|llisapi\.\w{3}|llisapi|cs|livelink).*$/,
          id            = !!nodeId && nodeId,
          cslink        = el.target.href.match(cslinkPattern),
          newHref       = !!cslink && cslink.length && el.target.href.substring(0,
              el.target.href.indexOf("/".concat(cslink[1])) + "/".concat(cslink[1]).length);
      el.target.href = !!newHref && newHref.length ?
                       newHref.concat("/app/nodes/", id) : el.target.href;
    },

    _getWikiPageId: function (self, wikiId, targetHref) {
      var $wikiPageName  = decodeURIComponent(targetHref.substring(
          targetHref.lastIndexOf("/") + 1, targetHref.length)),
          dfd            = $.Deferred(),
          connector      = self.connector,
          collectOptions = {
            url: this._getWikiContainerUrl(self, wikiId),
            type: 'GET'
          };

      connector.makeAjaxCall(collectOptions).done(function (resp) {
        resp.targetWikiPageNode = resp.results.find(function (element) {
          if (element.name === $wikiPageName) {
            return element;
          }
        });
        if (!!resp.targetWikiPageNode && !!resp.targetWikiPageNode.id) {
          dfd.resolve(resp.targetWikiPageNode.id, resp.targetWikiPageNode);
        } else {
          dfd.resolve(-1);
        }
      }).fail(function (resp) {
        dfd.reject(resp);
      });
      return dfd.promise();
    },

    _getWikiContainerUrl: function (self, wikiContainerId) {
      return Url.combine(self.connector.getConnectionUrl().getApiBase('v2') , '/wiki/' + wikiContainerId +
             "/wikipages");
    },

    _getNicknameId: function (self, nickName) {
      var deferred       = $.Deferred(),
          collectOptions = {
            url: Url.combine(self.connector.getConnectionUrl().getApiBase('v2') ,
                 "/wiki/nickname/" + nickName + "?actions=open"),
            requestType: "nickname",
            view: this,
            type: "GET"
          };
      nickName && self.connector.makeAjaxCall(collectOptions).done(function (response) {
        deferred.resolve(response);
      }).fail(function(){
        deferred.reject();
      });
      return deferred.promise();
    }
  };
  return RichTextEditorUtils;

});


csui.define('css!csui/widgets/html.editor/impl/html.editor',[],function(){});

csui.define('css!csui/lib/ckeditor/plugins/cssyntaxhighlight/styles/shCoreDefault',[],function(){});
csui.define('csui/controls/rich.text.editor/rich.text.editor',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/ckeditor/ckeditor',
      'csui/controls/rich.text.editor/impl/rich.text.util',
      'css!csui/widgets/html.editor/impl/html.editor',
      'css!csui/lib/ckeditor/plugins/cssyntaxhighlight/styles/shCoreDefault'
    ],
    function ($, _, Backbone, ckeditor, RichTextEditorUtils) {
      'use strict';

      var getCSSName = function (part) {
        // code from ckeditor to get the stylesheet name based on the browser type.
        var uas = window.CKEDITOR.skin['ua_' + part],
            env = window.CKEDITOR.env;
        if (uas) {
          uas = uas.split(',').sort(function (a, b) {
            return a > b ? -1 : 1;
          });
          for (var i = 0, ua; i < uas.length; i++) {
            ua = uas[i];

            if (env.ie) {
              if ((ua.replace(/^ie/, '') == env.version) || (env.quirks && ua == 'iequirks')) {
                ua = 'ie';
              }
            }

            if (env[ua]) {
              part += '_' + uas[i];
              break;
            }
          }
        }
        return part + '.css';
      };

      var getRichTextEditor = function (config) {
        config = config || {};
        _.each(ckeditor.instances, function (ckInstance) {
          ckInstance.destroy();
        });

        var csuiDefaults = {
          custcsuiimage_imageExtensions: 'gif|jpeg|jpg|png',
          skin: 'otskin',
          format_tags: 'p;h1;h2;h3;h4;h5',
          allowedContent: true,
          disableAutoInline: true,
          autoHideToolbar: false,
          title: false,
          cs_syntaxhighlight_hideGutter: true,
          enterMode: ckeditor.ENTER_P,
          extraPlugins: 'filebrowser,find,panelbutton,colorbutton,font,selectall,smiley,dialog,' +
                        'sourcedialog,print,preview,justify,otsave,cancel,cssyntaxhighlight,cslink',
          toolbar: [
            ['Undo', 'Redo', '-', 'Font', 'FontSize', '-', 'Styles', 'Format', 'TextColor'],
            '/',
            ['Bold', 'Italic', 'Blockquote', '-', 'Replace', '-', 'NumberedList',
              'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter',
              'JustifyRight', '-', 'Link', 'cslink', '-', 'Image', 'Table', 'Sourcedialog']
          ]
        };

        if (config.externalPlugins) {
          if (!_.isArray(config.externalPlugins)) {
            throw TypeError('externalPlugins must be array type');
          } else {
            if (config.externalPluginsBasePath &&
                typeof config.externalPluginsBasePath === 'string') {
              if (config.externalPluginsBasePath.charAt(
                      config.externalPluginsBasePath.length - 1) !== '/') {
                config.externalPluginsBasePath += '/';
              }
              var extraPlugins = [];
              config.externalPlugins.map(function (pluginName) {
                ckeditor.plugins.addExternal(pluginName,
                    config.externalPluginsBasePath + pluginName + '/', 'plugin.js');
                extraPlugins.push(pluginName);
              });
              // delete to avoid conflicts if any
              delete config.externalPlugins;
              delete config.externalPluginsBasePath;
              extraPlugins = extraPlugins.join();
              if (!!config.extraPlugins) {
                if (config.extraPlugins.length) {
                  extraPlugins = config.externalPlugins + ',' + extraPlugins;
                }
                config.extraPlugins = extraPlugins;
              } else {
                csuiDefaults.extraPlugins += ',' + extraPlugins;
              }
            } else {
              throw Error('externalPluginsBasePath option missing or is not a string');
            }
          }
        }

        config = _.defaults(config, csuiDefaults, ckeditor.config);
        ckeditor.config = config;
        ckeditor.on("dialogDefinition", function (event) {
          var dialogName = event.data.name,
              dialogDefinition = event.data.definition;

          // add one unique classname for all ckeditor dialogs.
          event.data.definition.dialog.getElement().addClass('csui-ckeditor-control-dialog');
          event.data.definition.dialog.getElement().addClass('csui-ckeditor-dialog-' + dialogName);

          if (dialogName == 'link') {
            //if upload dialog has to be enabled pass the value true to config.linkShowUploadTab
            if (!config.linkShowUploadTab) {
              var uploadTab = dialogDefinition.getContents('upload');
              uploadTab.hidden = true;
            }
          }
        });
        return ckeditor;
      };

      var getRichTextEditorUtils = function getRichTextEditorUtils() {
        return RichTextEditorUtils;
      };

      var isEmptyContent = function (content) {
        // as there are only three entermode in ckeditor DIV, P, BR. checking for them, along with the any empty spaces.
        return !!content &&
               content.getData().replace(/<\/div>|<div>|<\/p>|<p>|&nbsp;|<br \/>|\s/g, '');
      };

      return {
        getRichTextEditor: getRichTextEditor,
        getRichTextEditorUtils: getRichTextEditorUtils,
        isEmptyContent: isEmptyContent
      };
    });

/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.count',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-selected-counter-region\">\r\n  <button type=\"button\" class=\"binf-btn binf-btn-primary\"\r\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedButtonAria") || (depth0 != null ? lookupProperty(depth0,"selectedButtonAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedButtonAria","hash":{},"loc":{"start":{"line":3,"column":22},"end":{"line":3,"column":44}}}) : helper)))
    + "\" aria-haspopup=\"true\"\r\n          title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedButtonTitle") || (depth0 != null ? lookupProperty(depth0,"selectedButtonTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedButtonTitle","hash":{},"loc":{"start":{"line":4,"column":17},"end":{"line":4,"column":40}}}) : helper)))
    + "\"><span\r\n      class=\"csui-selected-counter-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedLabel") || (depth0 != null ? lookupProperty(depth0,"selectedLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedLabel","hash":{},"loc":{"start":{"line":5,"column":42},"end":{"line":5,"column":59}}}) : helper)))
    + "</span><span\r\n      class=\"binf-badge binf-badge-light csui-selected-counter-value\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"selectedCount") || (depth0 != null ? lookupProperty(depth0,"selectedCount") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"selectedCount","hash":{},"loc":{"start":{"line":6,"column":70},"end":{"line":6,"column":87}}}) : helper)))
    + "</span>\r\n  </button>\r\n</div>\r\n<div class=\"csui-dropmenu-container binf-hidden\">\r\n  <span class=\"csui-selected-count-clearall binf-hidden\"><span\r\n      class=\"csui-selected-count-clearall-label\"\r\n      role=\"button\" tabindex=\"0\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearAllAria") || (depth0 != null ? lookupProperty(depth0,"clearAllAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearAllAria","hash":{},"loc":{"start":{"line":12,"column":45},"end":{"line":12,"column":61}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearAll") || (depth0 != null ? lookupProperty(depth0,"clearAll") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearAll","hash":{},"loc":{"start":{"line":12,"column":63},"end":{"line":12,"column":75}}}) : helper)))
    + "</span></span>\r\n\r\n  <ul class=\"csui-selected-items-dropdown\" role=\"menu\"></ul>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.count', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/controls/selected.count/impl/selected.list.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-selected-list-item-icon csui-type-icon\"></span>\r\n<div class=\"csui-selected-list-item-name-wrapper\">\r\n    <span class=\"csui-selected-list-item-name\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":47},"end":{"line":3,"column":55}}}) : helper)))
    + "</span>\r\n  <span class=\"csui-icon formfield_clear csui-deselected-icon\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearItem") || (depth0 != null ? lookupProperty(depth0,"clearItem") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearItem","hash":{},"loc":{"start":{"line":4,"column":75},"end":{"line":4,"column":88}}}) : helper)))
    + "\"\r\n        title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"clearItem") || (depth0 != null ? lookupProperty(depth0,"clearItem") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"clearItem","hash":{},"loc":{"start":{"line":5,"column":15},"end":{"line":5,"column":28}}}) : helper)))
    + "\">\r\n  </span>\r\n</div>";
}});
Handlebars.registerPartial('csui_controls_selected.count_impl_selected.list.item', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/selected.count/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/controls/selected.count/impl/nls/root/lang',{
  clearAll: "Clear all",
  clearAllAria: "Clear all selections",
  selectedLabel: "Selected",
  selectedButtonTitle: "Selected {0}",
  selectedButtonAria: "{0} selected items",
  unselectAria: "Unselect {0} {1}",// {0} - "name" {1} - "mime-type"
  clearItem: "Clear item",
  dialogTitle: "Clear all",
  dialogTemplate: "Do you want to clear your selection?",
  parentName: "/{0}"
});



csui.define('css!csui/controls/selected.count/impl/selected.count',[],function(){});
csui.define('csui/controls/selected.count/selected.count.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/dialogs/modal.alert/modal.alert',
  "csui/utils/base",
  'hbs!csui/controls/selected.count/impl/selected.count',
  'hbs!csui/controls/selected.count/impl/selected.list.item',
  'i18n!csui/controls/selected.count/impl/nls/lang',
  'css!csui/controls/selected.count/impl/selected.count'
], function (_, $, Backbone, Marionette, NodeTypeIconView,
    PerfectScrollingBehavior, TabableRegionBehavior, ModalAlert,
    base, selectedCountTemplate, selectedListItemTemplate, lang) {
  'use strict';

  var SelectedNodeItemView = Marionette.ItemView.extend({
    className: 'csui-selected-item',
    template: selectedListItemTemplate,
    tagName: 'li',
    events: {
      'keydown': 'onKeyInView'
    },

    modelEvents: {
      'change': 'onModelChange'
    },

    triggers: {
      'click .csui-deselected-icon': 'remove:selected:item'
    },

    templateHelpers: function () {
      return {
        name: this.options.model.get('name'),
        clearItem: lang.clearItem
      };
    },

    constructor: function SelectedNodeItemView(options) {
      this.model = options.model;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    onRender: function () {
      this._nodeIconView = new NodeTypeIconView({
        el: this.$('.csui-type-icon').get(0),
        node: this.model,
        size: 'contain'
      });
      this._nodeIconView.render();
      this.$el.attr('tabindex', "-1");
      this.$el.attr('role', 'menuitem');
      this.$el.attr('aria-label', _.str.sformat(lang.unselectAria, this.model.get('name'), this._nodeIconView.$el.attr('aria-label')));
    },

    onModelChange: function () {
      this.render();
    },

    onKeyInView: function (event) {
      this.trigger('keydown:item', event);
    }
  });

  var SelectedCountView = Marionette.CompositeView.extend({

    className: 'csui-selected-count',
    template: selectedCountTemplate,
    templateHelpers: function () {
      var selectedCount = this.collection && this.collection.length;
      return {
        selectedCount: selectedCount,
        clearAll: lang.clearAll,
        clearAllAria: lang.clearAllAria,
        selectedLabel: lang.selectedLabel,
        selectedButtonTitle: _.str.sformat(lang.selectedButtonTitle, selectedCount),
        selectedButtonAria: _.str.sformat(lang.selectedButtonAria, selectedCount),
      };
    },
    childViewContainer: ".csui-selected-items-dropdown",
    childView: SelectedNodeItemView,
    childEvents: {
      'remove:selected:item': 'onRemoveSelectedItem',
      'keydown:item': 'onKeydownItem'
    },

    ui: {
      selectedCountButton: '.csui-selected-counter-region button',
      selectedCountValue: '.csui-selected-counter-region .csui-selected-counter-value',
      dropdownContainer: '.csui-dropmenu-container',
      clearAll: '.csui-selected-count-clearall',
      ClearAllButton: '.csui-selected-count-clearall > span'
    },
    events: {
      'click @ui.selectedCountButton': 'onClickSelectedCount',
      'click @ui.ClearAllButton': 'onClickClearAll',
      'mouseenter @ui.selectedCountButton': 'onMouseEnterSelectedCounterView',
      'mouseleave @ui.selectedCountButton': 'onMouseLeaveSelectedCounterView',
      'mouseenter @ui.dropdownContainer': 'onMouseEnterSelectedCounterView',
      'mouseleave @ui.dropdownContainer': 'onMouseLeaveSelectedCounterView',
      'mouseup @ui.clearAll': 'onMouseUpClearAll',
      'blur  @ui.selectedCountButton': 'onBlurSelectedCountButton',
      'blur @ui.dropdownContainer': 'onBlurSelectedCounterView',
      'keydown': 'onKeydownSelectedCount',
      'keyup': 'onKeyupItem'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-selected-items-dropdown',
        suppressScrollX: true,
        scrollYMarginOffset: 5
      }
    },

    currentlyFocusedElement: function () {
      return this.ui.selectedCountButton;
    },

    constructor: function SelectedCountView(options) {
      options = _.defaults(options, {showOnlyOnSelection: true});
      this.collection = options.collection;
      SelectedCountView.__super__.constructor.apply(this, arguments);
      this.currentlyFocusedIndex = 0;
      this.showClearAll = false;
      this.selectedItemInFocus = false;
      this.scrollableParent = options.scrollableParent;
      this.listenTo(this.collection, "reset remove add", function () {
        !this.isDestroyed && this.onCollectionUpdate();
      });
      this.selectedCount = this.collection.length;
      if (!!this.scrollableParent) {
        this.windowResizeHandler = _.bind(this.setDropdownCss, this);
        $(window).on('resize', this.windowResizeHandler);
      }
    },

    onRender: function () {
      if (!this.selectedCount) {
        this.options.showOnlyOnSelection && this.$el.addClass('binf-hidden');
      } else {
        this.ui.dropdownContainer.addClass('binf-hidden');
        $(document).off("mouseup.csui.select.count");
      }
    },

    onDestroy: function () {
      // stopListening is needed here, because only the event listeners on this (view) are stopped
      // automatically during destroying of the view
      this.stopListening(this.collection, 'reset remove add');
      if (!!this.windowResizeHandler) {
        $(window).off('resize', this.windowResizeHandler);
      }
    },

    onClickClearAll: function (event) {
      this.selectedItemInFocus = true;
      ModalAlert.confirmQuestion(
          _.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {})
          .always(_.bind(function (result) {
            if (result) {
              this.collection.reset([]);
            } else {
              // setFocus back to Clear all(Keyboard)
              this.ui.ClearAllButton.trigger('focus');
              this._moveTabindexToFocusedElement();
            }
            this.selectedItemInFocus = false;
          }, this));
          this.currentlyFocusedIndex = 0;
    },

    onMouseUpClearAll: function (event) {
      //On clicking clearall parent, we should set focus to the clear all button.
      event.preventDefault();
      event.stopPropagation();
      this.ui.ClearAllButton.trigger('focus');
    },

    isDDOpen: function () {
      return !this.ui.dropdownContainer[0].classList.contains("binf-hidden") &&
             !this.el.classList.contains("binf-hidden");
    },

    _focusOnSelectedCountButton: function () {
      this.ui.selectedCountButton.trigger('focus');
      this.selectedCountViewInFocus = true;
    },

    onMouseEnterSelectedCounterView: function () {
      this.selectedCountViewInFocus = true;
    },

    onMouseLeaveSelectedCounterView: function () {
      //Don't update this.selectedCountViewInFocus if any item in view has focus
      if (this.selectedItemInFocus === false) {
        this.selectedCountViewInFocus = false;
      }
    },

    onClickSelectedCount: function (event) {
      event.preventDefault();
      event.stopPropagation();
      // close all the open dropdowns with 'binf-open' class, before opening select counter view.
      var toggleDropdown = this.$el.find('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      if (this.ui.dropdownContainer.hasClass('binf-hidden')) {
        this._showItemView();
      } else {
        this._hideItemView();
      }
    },

    resetState: function () {
      var toggleDropdown = this.$el.find('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      this._hideItemView();
    },

    _showItemView: function () {
      this.selectedCountViewInFocus = true;
      this.ui.dropdownContainer.removeClass('binf-hidden');
      this.ui.selectedCountButton.addClass('binf-open');
      this.ui.selectedCountButton.attr('aria-expanded', 'true');
      if (this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass('binf-hidden');
      }
      if (!!this.scrollableParent) {
        this.setDropdownCss();
      }
      if (!this.perfectScrollingEnabled) {
        this.triggerMethod("ensure:scrollbar");  // for perfect scrollbar
        this.perfectScrollingEnabled = true;
      }
      if (this.ui.clearAll.hasClass('binf-hidden')) {
        this.ui.dropdownContainer.find('.csui-selected-item:first').trigger('focus');
      } else {
        this.ui.clearAll.find('.csui-selected-count-clearall-label').trigger('focus');
      }
      $(document).on("mouseup.csui.select.count", _.bind(this.onDocumentClick, this));
    },

    onDocumentClick: function (event) {
      //Check the target element lies inside or outside of Dropdown
      //When click on clear all and press 'no' drop-down menu should not close
      if (this.$el[0] !== event.target && !(this.$el).has(event.target).length &&
          !this.selectedItemInFocus) {
        this._hideItemView();
      }
    },

    setDropdownCss: function () {
      var dropdownEle = this.ui.dropdownContainer.find(".csui-selected-items-dropdown"),
          scrollableParent = $(this.scrollableParent),
          offsetDiff, scrollableParentHeight, elementSetBacks;
      if (!!scrollableParent && scrollableParent.length > 0) {
        scrollableParentHeight = scrollableParent.height();
        elementSetBacks = parseInt(scrollableParent.css("margin-top")) +
                          parseInt(scrollableParent.css("margin-bottom"));
        offsetDiff = dropdownEle.offset().top - scrollableParent.offset().top;
        // check whether dropdown menu overlaps on it's parent scrollable element.
        // reducing 24px to set some gap between scrollable parent's bottom and dropdown height.
        // dropdownEle.offset().top should be same as scrollableparent.offset().top then only we can compare the height of dropdown.
        // offsetDiff -> difference between two elements start (top) position.
        var heightOfDD = Math.abs(scrollableParentHeight - elementSetBacks);
        dropdownEle.css({
          "max-height": heightOfDD - (24 + offsetDiff) + "px"
        });
        //bug with perfect-scrollbar that does not show bar for the first time
        this.trigger("dom:refresh");
      }
    },

    _hideItemView: function (event) {
      this.selectedCountViewInFocus = false;
      _.isFunction(this.ui.dropdownContainer.addClass) && this.ui.dropdownContainer.addClass('binf-hidden');
      this.ui.selectedCountButton.removeClass('binf-open');
      this.ui.selectedCountButton.attr('aria-expanded', 'false');
      $(document).off("mouseup.csui.select.count");
    },

    onRemoveSelectedItem: function (view) {
      //maintaining index value as view getting changed after removing the model
      var currentIndex = view._index, itemViews;
      this.selectedCountViewInFocus = true;
      this.collection.remove(view.model);
      itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
      if (currentIndex === this.selectedCount) { //if last element
        itemViews[currentIndex - 1] &&
        itemViews[currentIndex - 1].$el.trigger('focus');
      } else {
        itemViews[currentIndex] &&
        itemViews[currentIndex].$el.trigger('focus');
      }
    },

    onCollectionUpdate: function () {
      //update selected Counter
      this.selectedCount = this.collection.length;
      if (this.selectedCount && !this.isDDOpen()) {
        this.options.showOnlyOnSelection && this.$el.removeClass('binf-hidden');
        _.isFunction(this.ui.dropdownContainer.addClass) && this.ui.dropdownContainer.addClass('binf-hidden');
        this.trigger('show:counter', true);
      } else if (!this.selectedCount) {
        this.ui.selectedCountButton.removeClass('binf-open');
        this.options.showOnlyOnSelection && this.$el.addClass('binf-hidden');
        $(document).off("mouseup.csui.select.count");
        this.trigger('show:counter', false);
      }
      //dont rerender entire view, update dom elements
      this.ui.selectedCountValue.text(this.selectedCount);
      this.ui.selectedCountButton.attr('aria-label', _.str.sformat(lang.selectedButtonAria, this.selectedCount));
      this.ui.selectedCountButton.attr('title', _.str.sformat(lang.selectedButtonTitle, this.selectedCount));
      //showing clear all based on selected count
      if (!this.showClearAll && this.selectedCount > 4) {
        this.showClearAll = true;
        this.ui.clearAll.removeClass('binf-hidden');
      } else if (this.selectedCount <= 4 && this.showClearAll) {
        this.showClearAll = false;
        this.ui.clearAll.addClass('binf-hidden');
      }
      if (this.selectedCount > 0) {
        this._moveTabindexToFocusedElement();
      }
    },

    _moveTabindexToFocusedElement: function () {
      this._focusableElements = base.findFocusables(this.el);
      for (var i = 0; i < this._focusableElements.length; i++) {
        this._focusableElements[i].setAttribute('tabindex', '0');
      }
    },

    onBlurSelectedCountButton: function (event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },

    onBlurSelectedCounterView: function (event) {
      if (!this.selectedCountViewInFocus) {
        this._hideItemView();
      }
    },

    onKeydownSelectedCount: function (event) {
      switch (event.keyCode) {
      case 9:  //tab
      if(event.shiftKey && !(this.ui.dropdownContainer.hasClass('binf-hidden'))) {   
        event.preventDefault();
        event.stopPropagation();
        this.ui.ClearAllButton.trigger('focus');
      }
      else {
        var itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
        this.selectedCountViewInFocus = true;
        if (this.ui.ClearAllButton.is(':focus')) {
        itemViews[this.currentlyFocusedIndex].$el.trigger('focus');
        event.stopPropagation();
        event.preventDefault();
        }
      }
        break;
      case 13: //Enter
        if(this.ui.ClearAllButton.is(':focus')) {
          this.onClickClearAll(event);
        }
        break;
      case 32: //Space
        if (this.ui.selectedCountButton.is(':focus')) {
          this.selectedCountViewInFocus = true;
          this.onClickSelectedCount(event);
        }
        break;
      case 46: //Delete
        if (this.ui.ClearAllButton.is(':focus')) {
          this.selectedCountViewInFocus = true;
          this.onClickClearAll(event);
        }
        break;
      case 37: //arrow left
        event.stopPropagation();
        break;
      case 39: //arrow right
        event.stopPropagation();
        break;
      }
    },

    onKeydownItem: function (view, event) {
      //other than these keys are handled in the onKeydownSelectedCount as event is propagated.
      var itemViews = _.sortBy(this.children.toArray(), 'cid'); //IE11, returns wrong index and view in each loop;
      event.preventDefault();
      switch (event.keyCode) {
      case 46: //Delete
      case 13: //Enter
      case 32: //Space
        this.onRemoveSelectedItem(view);
        event.stopPropagation();
        break;
      case 40: //arrow down
        this.selectedCountViewInFocus = true;
        if (view._index !== (this.selectedCount - 1)) {
          itemViews[view._index + 1].$el.trigger('focus');
          this.currentlyFocusedIndex = view._index + 1;
        }
        event.stopPropagation();
        break;
      case 38: //arrow up
        this.selectedCountViewInFocus = true;
        if (view._index > 0) {
          itemViews[view._index - 1].$el.trigger('focus');
          this.currentlyFocusedIndex = view._index - 1;
        }
        event.stopPropagation();
        break;
      case 37: //arrow left
        event.stopPropagation();
        break;
      case 39: //arrow right
        event.stopPropagation();
        break;
      }
    },

    onKeyupItem: function (event) {
      if (event.keyCode === 27 && this.isDDOpen()) { //Esc on select counter view should close Drop-down first
        this.currentlyFocusedIndex = 0;
        event.preventDefault();
        event.stopPropagation();
        this._hideItemView();
        this._focusOnSelectedCountButton();
      }
    }

  });
  return SelectedCountView;

});

/*!
 * jQuery Simulate v0.0.1 - simulate browser mouse and keyboard events
 * https://github.com/jquery/jquery-simulate
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: Sun Dec 9 12:15:33 2012 -0500
 */

csui.define('csui/lib/jquery.simulate',['module', 'csui/lib/jquery'
], function (module, jQuery) {


    ;
    (function ($, undefined) {
        "use strict";

        var rkeyEvent = /^key/,
            rmouseEvent = /^(?:mouse|contextmenu)|click/,
            rdocument = /\[object (?:HTML)?Document\]/;

        function isDocument(ele) {
            return rdocument.test(Object.prototype.toString.call(ele));
        }

        function windowOfDocument(doc) {
            for (var i = 0; i < window.frames.length; i += 1) {
                if (window.frames[i] && window.frames[i].document === doc) {
                    return window.frames[i];
                }
            }
            return window;
        }

        $.fn.simulate = function (type, options) {
            return this.each(function () {
                new $.simulate(this, type, options);
            });
        };

        $.simulate = function (elem, type, options) {
            var method = $.camelCase("simulate-" + type);

            this.target = elem;
            this.options = options || {};

            if (this[method]) {
                this[method]();
            } else {
                this.simulateEvent(elem, type, this.options);
            }
        };

        $.extend($.simulate, {

            keyCode: {
                BACKSPACE: 8,
                COMMA: 188,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                LEFT: 37,
                NUMPAD_ADD: 107,
                NUMPAD_DECIMAL: 110,
                NUMPAD_DIVIDE: 111,
                NUMPAD_ENTER: 108,
                NUMPAD_MULTIPLY: 106,
                NUMPAD_SUBTRACT: 109,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                PERIOD: 190,
                RIGHT: 39,
                SPACE: 32,
                TAB: 9,
                UP: 38
            },

            buttonCode: {
                LEFT: 0,
                MIDDLE: 1,
                RIGHT: 2
            }
        });

        $.extend($.simulate.prototype, {

            simulateEvent: function (elem, type, options) {
                var event = this.createEvent(type, options);
                this.dispatchEvent(elem, type, event, options);
            },

            createEvent: function (type, options) {
                if (rkeyEvent.test(type)) {
                    return this.keyEvent(type, options);
                }

                if (rmouseEvent.test(type)) {
                    return this.mouseEvent(type, options);
                }
            },

            mouseEvent: function (type, options) {
                var event,
                    eventDoc,
                    doc = isDocument(this.target) ? this.target : (this.target.ownerDocument || document),
                    docEle,
                    body;


                options = $.extend({
                    bubbles: true,
                    cancelable: (type !== "mousemove"),
                    view: windowOfDocument(doc),
                    detail: 0,
                    screenX: 0,
                    screenY: 0,
                    clientX: 1,
                    clientY: 1,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    button: 0,
                    relatedTarget: undefined
                }, options);


                if (doc.createEvent) {
                    event = doc.createEvent("MouseEvents");
                    event.initMouseEvent(type, options.bubbles, options.cancelable,
                        options.view, options.detail,
                        options.screenX, options.screenY, options.clientX, options.clientY,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                        options.button, options.relatedTarget || doc.body.parentNode);

                    // IE 9+ creates events with pageX and pageY set to 0.
                    // Trying to modify the properties throws an error,
                    // so we define getters to return the correct values.
                    if (event.pageX === 0 && event.pageY === 0 && Object.defineProperty) {
                        eventDoc = isDocument(event.relatedTarget) ? event.relatedTarget : (event.relatedTarget.ownerDocument || document);
                        docEle = eventDoc.documentElement;
                        body = eventDoc.body;

                        Object.defineProperty(event, "pageX", {
                            get: function () {
                                return options.clientX +
                                    ( docEle && docEle.scrollLeft || body && body.scrollLeft || 0 ) -
                                    ( docEle && docEle.clientLeft || body && body.clientLeft || 0 );
                            }
                        });
                        Object.defineProperty(event, "pageY", {
                            get: function () {
                                return options.clientY +
                                    ( docEle && docEle.scrollTop || body && body.scrollTop || 0 ) -
                                    ( docEle && docEle.clientTop || body && body.clientTop || 0 );
                            }
                        });
                    }
                } else if (doc.createEventObject) {
                    event = doc.createEventObject();
                    $.extend(event, options);
                    // standards event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
                    // old IE event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
                    // so we actually need to map the standard back to oldIE
                    event.button = {
                            0: 1,
                            1: 4,
                            2: 2
                        }[event.button] || event.button;
                }

                return event;
            },

            keyEvent: function (type, options) {
                var event, doc;
                options = $.extend({
                    bubbles: true,
                    cancelable: true,
                    view: windowOfDocument(doc),
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    keyCode: 0,
                    charCode: undefined
                }, options);

                doc = isDocument(this.target) ? this.target : (this.target.ownerDocument || document);
                if (doc.createEvent) {
                    try {
                        event = doc.createEvent("KeyEvents");
                        event.initKeyEvent(type, options.bubbles, options.cancelable, options.view,
                            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                            options.keyCode, options.charCode);
                        // initKeyEvent throws an exception in WebKit
                        // see: http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
                        // and also https://bugs.webkit.org/show_bug.cgi?id=13368
                        // fall back to a generic event until we decide to implement initKeyboardEvent
                    } catch (err) {
                        event = doc.createEvent("Events");
                        event.initEvent(type, options.bubbles, options.cancelable);
                        $.extend(event, {
                            view: options.view,
                            ctrlKey: options.ctrlKey,
                            altKey: options.altKey,
                            shiftKey: options.shiftKey,
                            metaKey: options.metaKey,
                            keyCode: options.keyCode,
                            charCode: options.charCode
                        });
                    }
                } else if (doc.createEventObject) {
                    event = doc.createEventObject();
                    $.extend(event, options);
                }

                if (!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) || (({}).toString.call(window.opera) === "[object Opera]")) {
                    event.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
                    event.charCode = undefined;
                }

                return event;
            },

            dispatchEvent: function (elem, type, event, options) {
                if (options.jQueryTrigger === true) {
                    $(elem).trigger($.extend({}, event, options, {type: type}));
                }
                else if (elem.dispatchEvent) {
                    elem.dispatchEvent(event);
                } else if (elem.fireEvent) {
                    elem.fireEvent("on" + type, event);
                }
            },

            simulateFocus: function () {
                var focusinEvent,
                    triggered = false,
                    $element = $(this.target);

                function trigger() {
                    triggered = true;
                }

                $element.on('focus', trigger);
                $element.first().trigger('focus');

                if (!triggered) {
                    focusinEvent = $.Event("focusin");
                    focusinEvent.preventDefault();
                    $element.trigger(focusinEvent);
                    $element.triggerHandler("focus");
                }
                $element.unbind("focus", trigger);
            },

            simulateBlur: function () {
                var focusoutEvent,
                    triggered = false,
                    $element = $(this.target);

                function trigger() {
                    triggered = true;
                }

                $element.on('blur', trigger);
                $element.first().trigger('blur');

                // blur events are async in IE
                setTimeout(function () {
                    // IE won't let the blur occur if the window is inactive
                    if ($element[0].ownerDocument.activeElement === $element[0]) {
                        $($element[0].ownerDocument.body).trigger('focus');
                    }

                    // Firefox won't trigger events if the window is inactive
                    // IE doesn't trigger events if we had to manually focus the body
                    if (!triggered) {
                        focusoutEvent = $.Event("focusout");
                        focusoutEvent.preventDefault();
                        $element.trigger(focusoutEvent);
                        $element.triggerHandler("blur");
                    }
                    $element.off("blur", trigger);
                }, 1);
            }
        });


        /** complex events **/

        function findCenter(elem) {
            var offset,
                $document,
                $elem = $(elem);

            if (isDocument($elem[0])) {
                $document = $elem;
                offset = {left: 0, top: 0};
            }
            else {
                $document = $($elem[0].ownerDocument || document);
                offset = $elem.offset();
            }

            return {
                x: offset.left + $elem.outerWidth() / 2 - $document.scrollLeft(),
                y: offset.top + $elem.outerHeight() / 2 - $document.scrollTop()
            };
        }

        function findCorner(elem) {
            var offset,
                $document,
                $elem = $(elem);

            if (isDocument($elem[0])) {
                $document = $elem;
                offset = {left: 0, top: 0};
            }
            else {
                $document = $($elem[0].ownerDocument || document);
                offset = $elem.offset();
            }

            return {
                x: offset.left - document.scrollLeft(),
                y: offset.top - document.scrollTop()
            };
        }

        $.extend($.simulate.prototype, {
            simulateDrag: function () {
                var i = 0,
                    target = this.target,
                    options = this.options,
                    center = options.handle === "corner" ? findCorner(target) : findCenter(target),
                    x = Math.floor(center.x),
                    y = Math.floor(center.y),
                    coord = {clientX: x, clientY: y},
                    dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
                    dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
                    moves = options.moves || 3;

                this.simulateEvent(target, "mousedown", coord);

                for (; i < moves; i++) {
                    x += dx / moves;
                    y += dy / moves;

                    coord = {
                        clientX: Math.round(x),
                        clientY: Math.round(y)
                    };

                    this.simulateEvent(target.ownerDocument, "mousemove", coord);
                }

                if ($.contains(document, target)) {
                    this.simulateEvent(target, "mouseup", coord);
                    this.simulateEvent(target, "click", coord);
                } else {
                    this.simulateEvent(document, "mouseup", coord);
                }
            }
        });

    })(jQuery);

});

csui.define('csui/lib/othelp',[],function () {
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(u,l){var d={},n=d.lib={},p=function(){},s=n.Base={extend:function(a){p.prototype=this;var c=new p;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
q=n.WordArray=s.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=l?c:4*a.length},toString:function(a){return(a||v).stringify(this)},concat:function(a){var c=this.words,m=a.words,f=this.sigBytes;a=a.sigBytes;this.clamp();if(f%4)for(var t=0;t<a;t++)c[f+t>>>2]|=(m[t>>>2]>>>24-8*(t%4)&255)<<24-8*((f+t)%4);else if(65535<m.length)for(t=0;t<a;t+=4)c[f+t>>>2]=m[t>>>2];else c.push.apply(c,m);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=u.ceil(c/4)},clone:function(){var a=s.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],m=0;m<a;m+=4)c.push(4294967296*u.random()|0);return new q.init(c,a)}}),w=d.enc={},v=w.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var m=[],f=0;f<a;f++){var t=c[f>>>2]>>>24-8*(f%4)&255;m.push((t>>>4).toString(16));m.push((t&15).toString(16))}return m.join("")},parse:function(a){for(var c=a.length,m=[],f=0;f<c;f+=2)m[f>>>3]|=parseInt(a.substr(f,
2),16)<<24-4*(f%8);return new q.init(m,c/2)}},b=w.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var m=[],f=0;f<a;f++)m.push(String.fromCharCode(c[f>>>2]>>>24-8*(f%4)&255));return m.join("")},parse:function(a){for(var c=a.length,m=[],f=0;f<c;f++)m[f>>>2]|=(a.charCodeAt(f)&255)<<24-8*(f%4);return new q.init(m,c)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(b.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return b.parse(unescape(encodeURIComponent(a)))}},
r=n.BufferedBlockAlgorithm=s.extend({reset:function(){this._data=new q.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,m=c.words,f=c.sigBytes,t=this.blockSize,b=f/(4*t),b=a?u.ceil(b):u.max((b|0)-this._minBufferSize,0);a=b*t;f=u.min(4*a,f);if(a){for(var e=0;e<a;e+=t)this._doProcessBlock(m,e);e=m.splice(0,a);c.sigBytes-=f}return new q.init(e,f)},clone:function(){var a=s.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});n.Hasher=r.extend({cfg:s.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){r.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,m){return(new a.init(m)).finalize(c)}},_createHmacHelper:function(a){return function(c,m){return(new e.HMAC.init(a,
m)).finalize(c)}}});var e=d.algo={};return d}(Math);
(function(){var u=CryptoJS,l=u.lib.WordArray;u.enc.Base64={stringify:function(d){var n=d.words,l=d.sigBytes,s=this._map;d.clamp();d=[];for(var q=0;q<l;q+=3)for(var w=(n[q>>>2]>>>24-8*(q%4)&255)<<16|(n[q+1>>>2]>>>24-8*((q+1)%4)&255)<<8|n[q+2>>>2]>>>24-8*((q+2)%4)&255,v=0;4>v&&q+0.75*v<l;v++)d.push(s.charAt(w>>>6*(3-v)&63));if(n=s.charAt(64))for(;d.length%4;)d.push(n);return d.join("")},parse:function(d){var n=d.length,p=this._map,s=p.charAt(64);s&&(s=d.indexOf(s),-1!=s&&(n=s));for(var s=[],q=0,w=0;w<
n;w++)if(w%4){var v=p.indexOf(d.charAt(w-1))<<2*(w%4),b=p.indexOf(d.charAt(w))>>>6-2*(w%4);s[q>>>2]|=(v|b)<<24-8*(q%4);q++}return l.create(s,q)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
(function(u){function l(b,e,a,c,m,f,t){b=b+(e&a|~e&c)+m+t;return(b<<f|b>>>32-f)+e}function d(b,e,a,c,m,f,t){b=b+(e&c|a&~c)+m+t;return(b<<f|b>>>32-f)+e}function n(b,e,a,c,m,f,t){b=b+(e^a^c)+m+t;return(b<<f|b>>>32-f)+e}function p(b,e,a,c,m,f,t){b=b+(a^(e|~c))+m+t;return(b<<f|b>>>32-f)+e}for(var s=CryptoJS,q=s.lib,w=q.WordArray,v=q.Hasher,q=s.algo,b=[],x=0;64>x;x++)b[x]=4294967296*u.abs(u.sin(x+1))|0;q=q.MD5=v.extend({_doReset:function(){this._hash=new w.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(r,e){for(var a=0;16>a;a++){var c=e+a,m=r[c];r[c]=(m<<8|m>>>24)&16711935|(m<<24|m>>>8)&4278255360}var a=this._hash.words,c=r[e+0],m=r[e+1],f=r[e+2],t=r[e+3],y=r[e+4],q=r[e+5],s=r[e+6],w=r[e+7],v=r[e+8],u=r[e+9],x=r[e+10],z=r[e+11],A=r[e+12],B=r[e+13],C=r[e+14],D=r[e+15],g=a[0],h=a[1],j=a[2],k=a[3],g=l(g,h,j,k,c,7,b[0]),k=l(k,g,h,j,m,12,b[1]),j=l(j,k,g,h,f,17,b[2]),h=l(h,j,k,g,t,22,b[3]),g=l(g,h,j,k,y,7,b[4]),k=l(k,g,h,j,q,12,b[5]),j=l(j,k,g,h,s,17,b[6]),h=l(h,j,k,g,w,22,b[7]),
g=l(g,h,j,k,v,7,b[8]),k=l(k,g,h,j,u,12,b[9]),j=l(j,k,g,h,x,17,b[10]),h=l(h,j,k,g,z,22,b[11]),g=l(g,h,j,k,A,7,b[12]),k=l(k,g,h,j,B,12,b[13]),j=l(j,k,g,h,C,17,b[14]),h=l(h,j,k,g,D,22,b[15]),g=d(g,h,j,k,m,5,b[16]),k=d(k,g,h,j,s,9,b[17]),j=d(j,k,g,h,z,14,b[18]),h=d(h,j,k,g,c,20,b[19]),g=d(g,h,j,k,q,5,b[20]),k=d(k,g,h,j,x,9,b[21]),j=d(j,k,g,h,D,14,b[22]),h=d(h,j,k,g,y,20,b[23]),g=d(g,h,j,k,u,5,b[24]),k=d(k,g,h,j,C,9,b[25]),j=d(j,k,g,h,t,14,b[26]),h=d(h,j,k,g,v,20,b[27]),g=d(g,h,j,k,B,5,b[28]),k=d(k,g,
h,j,f,9,b[29]),j=d(j,k,g,h,w,14,b[30]),h=d(h,j,k,g,A,20,b[31]),g=n(g,h,j,k,q,4,b[32]),k=n(k,g,h,j,v,11,b[33]),j=n(j,k,g,h,z,16,b[34]),h=n(h,j,k,g,C,23,b[35]),g=n(g,h,j,k,m,4,b[36]),k=n(k,g,h,j,y,11,b[37]),j=n(j,k,g,h,w,16,b[38]),h=n(h,j,k,g,x,23,b[39]),g=n(g,h,j,k,B,4,b[40]),k=n(k,g,h,j,c,11,b[41]),j=n(j,k,g,h,t,16,b[42]),h=n(h,j,k,g,s,23,b[43]),g=n(g,h,j,k,u,4,b[44]),k=n(k,g,h,j,A,11,b[45]),j=n(j,k,g,h,D,16,b[46]),h=n(h,j,k,g,f,23,b[47]),g=p(g,h,j,k,c,6,b[48]),k=p(k,g,h,j,w,10,b[49]),j=p(j,k,g,h,
C,15,b[50]),h=p(h,j,k,g,q,21,b[51]),g=p(g,h,j,k,A,6,b[52]),k=p(k,g,h,j,t,10,b[53]),j=p(j,k,g,h,x,15,b[54]),h=p(h,j,k,g,m,21,b[55]),g=p(g,h,j,k,v,6,b[56]),k=p(k,g,h,j,D,10,b[57]),j=p(j,k,g,h,s,15,b[58]),h=p(h,j,k,g,B,21,b[59]),g=p(g,h,j,k,y,6,b[60]),k=p(k,g,h,j,z,10,b[61]),j=p(j,k,g,h,f,15,b[62]),h=p(h,j,k,g,u,21,b[63]);a[0]=a[0]+g|0;a[1]=a[1]+h|0;a[2]=a[2]+j|0;a[3]=a[3]+k|0},_doFinalize:function(){var b=this._data,e=b.words,a=8*this._nDataBytes,c=8*b.sigBytes;e[c>>>5]|=128<<24-c%32;var m=u.floor(a/
4294967296);e[(c+64>>>9<<4)+15]=(m<<8|m>>>24)&16711935|(m<<24|m>>>8)&4278255360;e[(c+64>>>9<<4)+14]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(e.length+1);this._process();b=this._hash;e=b.words;for(a=0;4>a;a++)c=e[a],e[a]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return b},clone:function(){var b=v.clone.call(this);b._hash=this._hash.clone();return b}});s.MD5=v._createHelper(q);s.HmacMD5=v._createHmacHelper(q)})(Math);
(function(){var u=CryptoJS,l=u.lib,d=l.Base,n=l.WordArray,l=u.algo,p=l.EvpKDF=d.extend({cfg:d.extend({keySize:4,hasher:l.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(d,l){for(var p=this.cfg,v=p.hasher.create(),b=n.create(),u=b.words,r=p.keySize,p=p.iterations;u.length<r;){e&&v.update(e);var e=v.update(d).finalize(l);v.reset();for(var a=1;a<p;a++)e=v.finalize(e),v.reset();b.concat(e)}b.sigBytes=4*r;return b}});u.EvpKDF=function(d,l,n){return p.create(n).compute(d,
l)}})();
CryptoJS.lib.Cipher||function(u){var l=CryptoJS,d=l.lib,n=d.Base,p=d.WordArray,s=d.BufferedBlockAlgorithm,q=l.enc.Base64,w=l.algo.EvpKDF,v=d.Cipher=s.extend({cfg:n.extend(),createEncryptor:function(m,a){return this.create(this._ENC_XFORM_MODE,m,a)},createDecryptor:function(m,a){return this.create(this._DEC_XFORM_MODE,m,a)},init:function(m,a,b){this.cfg=this.cfg.extend(b);this._xformMode=m;this._key=a;this.reset()},reset:function(){s.reset.call(this);this._doReset()},process:function(a){this._append(a);return this._process()},
finalize:function(a){a&&this._append(a);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(m){return{encrypt:function(f,b,e){return("string"==typeof b?c:a).encrypt(m,f,b,e)},decrypt:function(f,b,e){return("string"==typeof b?c:a).decrypt(m,f,b,e)}}}});d.StreamCipher=v.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var b=l.mode={},x=function(a,f,b){var c=this._iv;c?this._iv=u:c=this._prevBlock;for(var e=0;e<b;e++)a[f+e]^=
c[e]},r=(d.BlockCipherMode=n.extend({createEncryptor:function(a,f){return this.Encryptor.create(a,f)},createDecryptor:function(a,f){return this.Decryptor.create(a,f)},init:function(a,f){this._cipher=a;this._iv=f}})).extend();r.Encryptor=r.extend({processBlock:function(a,f){var b=this._cipher,c=b.blockSize;x.call(this,a,f,c);b.encryptBlock(a,f);this._prevBlock=a.slice(f,f+c)}});r.Decryptor=r.extend({processBlock:function(a,b){var c=this._cipher,e=c.blockSize,d=a.slice(b,b+e);c.decryptBlock(a,b);x.call(this,
a,b,e);this._prevBlock=d}});b=b.CBC=r;r=(l.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,e=c<<24|c<<16|c<<8|c,d=[],l=0;l<c;l+=4)d.push(e);c=p.create(d,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};d.BlockCipher=v.extend({cfg:v.cfg.extend({mode:b,padding:r}),reset:function(){v.reset.call(this);var a=this.cfg,c=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var b=a.createEncryptor;else b=a.createDecryptor,this._minBufferSize=1;this._mode=b.call(a,
this,c&&c.words)},_doProcessBlock:function(a,c){this._mode.processBlock(a,c)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var c=this._process(!0)}else c=this._process(!0),a.unpad(c);return c},blockSize:4});var e=d.CipherParams=n.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),b=(l.format={}).OpenSSL={stringify:function(a){var c=a.ciphertext;a=a.salt;return(a?p.create([1398893684,
1701076831]).concat(a).concat(c):c).toString(q)},parse:function(a){a=q.parse(a);var c=a.words;if(1398893684==c[0]&&1701076831==c[1]){var b=p.create(c.slice(2,4));c.splice(0,4);a.sigBytes-=16}return e.create({ciphertext:a,salt:b})}},a=d.SerializableCipher=n.extend({cfg:n.extend({format:b}),encrypt:function(a,c,b,d){d=this.cfg.extend(d);var l=a.createEncryptor(b,d);c=l.finalize(c);l=l.cfg;return e.create({ciphertext:c,key:b,iv:l.iv,algorithm:a,mode:l.mode,padding:l.padding,blockSize:a.blockSize,formatter:d.format})},
decrypt:function(a,c,b,e){e=this.cfg.extend(e);c=this._parse(c,e.format);return a.createDecryptor(b,e).finalize(c.ciphertext)},_parse:function(a,c){return"string"==typeof a?c.parse(a,this):a}}),l=(l.kdf={}).OpenSSL={execute:function(a,c,b,d){d||(d=p.random(8));a=w.create({keySize:c+b}).compute(a,d);b=p.create(a.words.slice(c),4*b);a.sigBytes=4*c;return e.create({key:a,iv:b,salt:d})}},c=d.PasswordBasedCipher=a.extend({cfg:a.cfg.extend({kdf:l}),encrypt:function(c,b,e,d){d=this.cfg.extend(d);e=d.kdf.execute(e,
c.keySize,c.ivSize);d.iv=e.iv;c=a.encrypt.call(this,c,b,e.key,d);c.mixIn(e);return c},decrypt:function(c,b,e,d){d=this.cfg.extend(d);b=this._parse(b,d.format);e=d.kdf.execute(e,c.keySize,c.ivSize,b.salt);d.iv=e.iv;return a.decrypt.call(this,c,b,e.key,d)}})}();
(function(){function u(b,a){var c=(this._lBlock>>>b^this._rBlock)&a;this._rBlock^=c;this._lBlock^=c<<b}function l(b,a){var c=(this._rBlock>>>b^this._lBlock)&a;this._lBlock^=c;this._rBlock^=c<<b}var d=CryptoJS,n=d.lib,p=n.WordArray,n=n.BlockCipher,s=d.algo,q=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],w=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,
55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],v=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],b=[{"0":8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,
2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,
1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{"0":1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,
75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,
276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{"0":260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,
14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,
17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{"0":2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,
98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,
1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{"0":128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,
10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,
83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{"0":268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,
2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{"0":1048576,
16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,
496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{"0":134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,
2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,
2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],x=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],r=s.DES=n.extend({_doReset:function(){for(var b=this._key.words,a=[],c=0;56>c;c++){var d=q[c]-1;a[c]=b[d>>>5]>>>31-d%32&1}b=this._subKeys=[];for(d=0;16>d;d++){for(var f=b[d]=[],l=v[d],c=0;24>c;c++)f[c/6|0]|=a[(w[c]-1+l)%28]<<31-c%6,f[4+(c/6|0)]|=a[28+(w[c+24]-1+l)%28]<<31-c%6;f[0]=f[0]<<1|f[0]>>>31;for(c=1;7>c;c++)f[c]>>>=
4*(c-1)+3;f[7]=f[7]<<5|f[7]>>>27}a=this._invSubKeys=[];for(c=0;16>c;c++)a[c]=b[15-c]},encryptBlock:function(b,a){this._doCryptBlock(b,a,this._subKeys)},decryptBlock:function(b,a){this._doCryptBlock(b,a,this._invSubKeys)},_doCryptBlock:function(e,a,c){this._lBlock=e[a];this._rBlock=e[a+1];u.call(this,4,252645135);u.call(this,16,65535);l.call(this,2,858993459);l.call(this,8,16711935);u.call(this,1,1431655765);for(var d=0;16>d;d++){for(var f=c[d],n=this._lBlock,p=this._rBlock,q=0,r=0;8>r;r++)q|=b[r][((p^
f[r])&x[r])>>>0];this._lBlock=p;this._rBlock=n^q}c=this._lBlock;this._lBlock=this._rBlock;this._rBlock=c;u.call(this,1,1431655765);l.call(this,8,16711935);l.call(this,2,858993459);u.call(this,16,65535);u.call(this,4,252645135);e[a]=this._lBlock;e[a+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});d.DES=n._createHelper(r);s=s.TripleDES=n.extend({_doReset:function(){var b=this._key.words;this._des1=r.createEncryptor(p.create(b.slice(0,2)));this._des2=r.createEncryptor(p.create(b.slice(2,4)));this._des3=
r.createEncryptor(p.create(b.slice(4,6)))},encryptBlock:function(b,a){this._des1.encryptBlock(b,a);this._des2.decryptBlock(b,a);this._des3.encryptBlock(b,a)},decryptBlock:function(b,a){this._des3.decryptBlock(b,a);this._des2.encryptBlock(b,a);this._des1.decryptBlock(b,a)},keySize:6,ivSize:2,blockSize:2});d.TripleDES=n._createHelper(s)})();
/* (c) Copyright Open Text Corporation 2016. Version 16.4.0.46 */ 
var OTHHUrlBuilder=function(t){var u="product",A="version",w="http://docsapi.opentext.com/mapperpi",y={tboolean:"touch bookmarks toc bookmarkEntries sectionNumbers caseSensitive highContrast".split(" "),nameValuePair:{find:["anyWord","allWords","exactWord"],search:["allModules","document","section","page"],sort:["match","divisions"]},tstring:"query"};Array.isArray||(Array.isArray=function(a){return a instanceof Array});"undefined"==typeof String.prototype.endsWith&&(String.prototype.endsWith=function(a){return this.lastIndexOf(a)==
this.length-a.length});"undefined"==typeof debug&&(debug=!1);"undefined"==typeof trace&&(trace=!1);t&&(u=t.product||u,A=t.version||A,w=t.urlRoot||w);try{console||(console={error:function(){},log:function(){},warn:function(){}})}catch(a){console={error:function(){},log:function(){},warn:function(){}}}return{buildHelpUrl:function(a,b,c){if(!a||!b)return console.error("Please specify 'locale' and 'context'"),"";if("string"==typeof a&&0>a.indexOf(",")&&"string"==typeof b)return this._.generateSixParam(a,
b,c);var d=null,d="string"==typeof a&&-1<a.indexOf(",")?a.split(","):"string"==typeof a?[a]:a;return this._.generateComplexParam(d,b,c)},optionConstants:y,_:{generateComplexParam:function(a,b,c){var d,f=[],p,m,g=[],e=null,e=!1,n=[],l=[],h,q,t,u,k,z,r,v,x;if(!a||!b)return console.error("Missing parameter!, Please specify 'locale', and 'context', not:",a,b,c),"";if("object"!=typeof a||"object"!=typeof b||c&&"object"!=typeof c)return console.error("Invalid parameter!:",a,b,c,"are not objects. Parameter order should be ([],{},{})"),
"";q=c?c.tenant:null;t=c?c.type||"ofh1":"ofh1";u=function(a,b){if(a){z=!1;for(r in b)z|=b[r]==a;z||b.push(a)}};d="";for(h in b.documents)k=b.documents[h],k.active&&!0===k.active&&(e&&delete k.active,e=!0),!0===k.exclude&&f.push(k),this.fixApp(k),u(k.version,l),k.err||n.push(k);if("object"==typeof c&&c.options){debug&&console.log("Complex params options: ",c.options);e={find:1,search:10,sort:100};k=0;v=1;for(h in y.tboolean)r=y.tboolean[h],r=c.options[r],"boolean"==typeof r&&(k+=r?v:0),v*=2;k=k.toString(16);
"0"!=k&&(d+=2>k.length?"0"+k:k);k=0;for(h in c.options)if(r=y.nameValuePair[h])for(v=c.options[h],x=0;x<r.length;x++)if(r[x]==v){k+=(x+1)*e[h];break}0<k&&121!=k&&(k=k.toString(16),d+=(0===d.length?"00":"")+(2>k.length?"0"+k:k));"string"==typeof c.options.query&&(d+="S"+encodeURI(c.options.query));c.options.flags&&(p=(""+c.options.flags).replace(/[^a-zA-Z0-9]/g,""));if(c.options.custom)for(k in m="",c.options.custom)0<=",ml,t,o,f,key,type,".indexOf(","+k+",")||(r=""+k.replace(/[^a-zA-Z0-9]/g,"")+"="+
encodeURIComponent(c.options.custom[k]),m+="&"+r)}debug&&console.log("Complex params: ",q,t,JSON.stringify(n),d);c=w+"?ml=";c+=this.altArray(a);1==l.length&&(c=c+","+l[0]);for(h=0;h<n.length;h++)e=n[h].module,n[h].version&&(e+=n[h].version),n[h].release&&(e+="-"+n[h].release),n[h].help&&(e+="-"+n[h].help),n[h].docType&&(e+="-"+n[h].docType),n[h].locale&&(e+="-"+n[h].locale),n[h].PageID&&(e+="."+n[h].PageID),n[h].exclude&&(e+="_"),n[h].active&&(e+="~"),u(e,g);debug&&(console.log("Complex params: ",
l,c,JSON.stringify(f)),console.log("Compressable: ",JSON.stringify(g)));e=this.compress({docs:g,preserve:b.preserve,locale:a},a[0]);debug&&console.log("Compressed:",e);q&&(e+="&t="+encodeURIComponent(q));d&&(0<parseInt(d,16)||0<=d.indexOf("S"))&&(e+="&o="+d);p&&(e+="&f="+p);m&&(e+=m);a=this.generateKey();return w+"?type="+t+"&ml="+(e+("&key="+a))},compress:function(a,b){var c=a.locale,d,f;d=null;var p=[],m,g="NotAPossibleValue",e=g,n=!0,l=g,h=!0,q;c||(c=b);c&&null!==c||(c="en");d=a.docs;!0!==a.preserve&&
(d=d.sort());f=this.altArray(c);p=[];m=null;e=g="NotAPossibleValue";n=!0;l=g;h=!0;for(q in d)m=this.parseRevnum(d[q]),p.push(m),n&&e!=m.help&&(e==g?e=m.help:e!=m.help&&(n=!1)),h&&l!=m.release&&(l==g?l=m.release:l!=m.release&&(h=!1));2>d.length&&(h=n=!1);h&&null!==l&&(f=f+"-"+l.toUpperCase());n&&null!==e&&(f+="-",f+=e);e=g=q=null;for(m in p){d=p[m];null===q||q!=d.product?(f+="$",q=d.product,g=e=null,f+=q):f+=",";l=d.version;h||null===d.release||d.release&&(l+="-"+d.release.toUpperCase());if(null===
g||g!=l)f+=l,g=l,e=null;l="";d.docType&&(l+=d.docType);null!==d.locale&&c!=d.locale&&(l+="-",l+=d.locale);null!==d.PageID&&0<d.PageID.length&&(l+=".",l+=window.encodeURIComponent(d.PageID));if(null===e||e!=l)null!==e&&","!=f.substring(f.length-1)&&(f+=","),e=l,n||null===d.help||(f+=d.help,f+="-"),f+=e;null!==d.flag&&(f+=d.flag)}return f},fixApp:function(a){var b=null,c;if(a){a.version||(b=this.parseRevnum(a.module),a.module=b.product,a.version=b.version&&0<b.version.length?b.version:"0",a.release=
b.release&&0<b.release.length?b.release:null,a.docType=b.docType,a.help=b.help,a.err=b.err);"v"==a.version[0]&&(a.version=a.version.substring(1));if(-1<a.module.indexOf("-")){b=a.module.split(/(?=-)/);b[0]=b[0].split(/\d+$/)[0];a.module=b[0]+a.version;for(c=1;c<b.length;c++)a.module+=b[c];b=this.parseRevnum(a.module);a.module=b.product;a.version=b.version;a.release=b.release;a.docType=b.docType;a.help=b.help;a.err=b.err}b||(b=this.parseRevnum(a.module));a.locale=b.locale&&0<b.locale.length&&!a.locale?
b.locale:a.locale;a.PageID=b.PageID&&0<b.PageID.length&&!a.topic?b.PageID:a.topic;a.module=a.module.split(/\d+$/)[0]}},generateSixParam:function(a,b,c){var d=null,f=null,p=null,m=null,g;c&&(d=c.product,f=c.version,p=c.module,m=c.type);"string"==typeof m&&0===m.length&&(m=null);c=this.generateKey();d=d||u;f=f||A;g=w;"string"!=typeof p&&"string"!=typeof m&&0<g.indexOf("mapperpi")&&(g=g.substring(0,g.length-2));g=g+"?"+("product="+encodeURIComponent(d));g+="&version="+encodeURIComponent(f);g+="&locale="+
encodeURIComponent(a);g+="&context="+encodeURIComponent(b);if("string"==typeof p&&"string"==typeof m)g+="&module="+encodeURIComponent(p),g+="&type="+encodeURIComponent(m);else if(!p&&m||!m&&p)return console.error("'module' and 'type' need to be either BOTH or NEITHER defined"),"";g+="&key="+c;debug&&console.log(g);return g},generateKey:function(){var a=this.generatePassPhrase();return this.encryptByDES("Vignette",a)},parseRevnum:function(a){var b=null,c;if(b=a.match(/^([a-zA-Z]+)(\d+(-\d+\w*)?)((-[a-z])?)(-[a-z]+)?(-[_a-z]+)?(-\d+)?(\.([a-zA-Z0-9#.\_\-]+))?([\_\~])?$/i)){a=
b[2];b[3]&&"-"==b[3][0]&&(a=a.substring(0,a.length-b[3].length));b={product:b[1],version:a,release:b[3],help:b[4],docType:b[6],locale:b[7],revision:b[8],PageID:b[10],flag:b[11]};for(c in b)b[c]&&"-"==b[c][0]?b[c]=b[c].substring(1):b[c]||(b[c]=null);null!==b.PageID&&null===b.flag&&b.PageID.endsWith("_")&&(b.flag="_",b.PageID=b.PageID.substring(0,b.PageID.length-1))}else b={product:a,version:null,release:null,help:null,docType:null,locale:null,revision:null,PageID:null,flag:null,err:!0};return b},generatePassPhrase:function(){var a=
new Date,b=a.getFullYear(),c=a.getMonth(),a=a.getDate(),d=""+c,f=""+a;10>c&&(d="0"+d);10>a&&(f="0"+f);return b+d+f},encryptByDES:function(a,b){var c;c=CryptoJS.enc.Utf8.parse(b);var d=CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse("ruhulio!").toString(CryptoJS.enc.Hex));trace&&(console.log(CryptoJS.enc.Utf8.stringify(c),CryptoJS.enc.Hex.stringify(c)),console.log(CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse(b).toString(CryptoJS.enc.Hex))));c=CryptoJS.DES.encrypt(a,c,{iv:d,mode:CryptoJS.mode.CBC,
padding:CryptoJS.pad.Pkcs7});trace&&(console.log("encrypted.toString()  -> base64(ciphertext)  :",c.toString()),console.log("base64(ciphertext)    <- encrypted.toString():",c.ciphertext.toString(CryptoJS.enc.Base64)),console.log("ciphertext.toString() -> ciphertext hex      :",c.ciphertext.toString()));return c.ciphertext.toString()},altArray:function(a){var b="",c,d;if(Array.isArray(a)){for(c=0;c<a.length;c++)d=a[c],b=0===c%2?b+d.toLowerCase():b+d.toUpperCase();return b}return a}}}};
return OTHHUrlBuilder;
});



csui.define('css!csui/widgets/navigation.header/impl/navigation.header.controls',[],function(){});
csui.define('csui/widgets/navigation.header/navigation.header.controls',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui-ext!csui/widgets/navigation.header/navigation.header.controls',
  'css!csui/widgets/navigation.header/impl/navigation.header.controls'
], function (module, _, Backbone, extraNavIcons) {
  'use strict';

  var config = module.config();

  var logo = new Backbone.Model(_.extend({
    location: 'center'
  }, config.logo));

  var leftSide = new Backbone.Collection([
    {
      id: 'csui/widgets/navigation.header/controls/help/help.view',
      sequence: 100,
      parentClassName: 'csui-help csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/home/home.view',
      sequence: 200,
      parentClassName: 'csui-home-item csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view',
      sequence: 300,
      parentClassName: 'tile-breadcrumb'
    }
  ], {
    comparator: 'sequence'
  });

  var rightSide = new Backbone.Collection([
    {
      id: 'csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',
      sequence: 100,
      // show progressbar-maximize only while uploading any item.
      parentClassName: 'csui-progressbar-maximize binf-hidden csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/search/search.view',
      sequence: 100,
      parentClassName: 'csui-search csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/favorites/favorites.view',
      sequence: 200,
      parentClassName: 'csui-favorites csui-icons'
    },
    {
      id: 'csui/widgets/navigation.header/controls/user.profile/user.profile.view',
      sequence: 300,
      parentClassName: 'csui-profile csui-icons'
    }
  ], {
    comparator: 'sequence'
  });

  if (extraNavIcons) {
    _.filter(extraNavIcons, function (toolItem) {
      // allowing only “iwatch” module’s icon in navigation header controls as per LPAD-55595
      // allowing "conws" module's add workspace icon in navigation header controls as per LPAD-97464
      return (toolItem.id.indexOf('iwatch/') === 0 || toolItem.id.indexOf('conws/') === 0)  && rightSide.add(toolItem);
    });
  }

  var masks = _.reduce(_.values(config.masks || {}), function (result, mask) {
    return {
      blacklist: result.blacklist.concat(mask.blacklist || []),
      whitelist: result.whitelist.concat(mask.whitelist || [])
    };
  }, {
    blacklist: [],
    whitelist: []
  });
  masks = {
    blacklist: _.unique(masks.blacklist),
    whitelist: _.unique(masks.whitelist)
  };

  function filterComponentByMask(component) {
    return !_.contains(masks.blacklist, component.id) &&
           (!masks.whitelist.length ||
            _.contains(masks.whitelist, component.id));
  }

  leftSide.remove(leftSide.reject(filterComponentByMask));
  rightSide.remove(rightSide.reject(filterComponentByMask));

  return {
    logo: logo,
    leftSide: leftSide,
    rightSide: rightSide
  };
});


/* START_TEMPLATE */
csui.define('hbs!csui/pages/start/impl/navigationheader/impl/navigationheader',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-global-message\"></div>\r\n<nav class=\"csui-navbar binf-navbar binf-navbar-default zero-gutter\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mainNavigationAria") || (depth0 != null ? lookupProperty(depth0,"mainNavigationAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mainNavigationAria","hash":{},"loc":{"start":{"line":2,"column":81},"end":{"line":2,"column":103}}}) : helper)))
    + "\">\r\n  <div class=\"binf-container-fluid\">\r\n    <span class=\"binf-navbar-brand binf-collapse binf-navbar-collapse\">\r\n      <span class=\"csui-logo\">\r\n        <span class=\"csui-logo-image\"></span>\r\n      </span>\r\n    </span>\r\n    <div class=\"binf-nav binf-navbar-nav binf-navbar-left\"></div>\r\n    <div class=\"binf-nav binf-navbar-nav binf-navbar-right\" ></div>\r\n    <div class=\"binf-nav binf-navbar-nav csui-navbar-message\"></div>\r\n  </div>\r\n</nav>\r\n";
}});
Handlebars.registerPartial('csui_pages_start_impl_navigationheader_impl_navigationheader', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/pages/start/impl/navigationheader/impl/navigationheader',[],function(){});
csui.define('csui/pages/start/impl/navigationheader/navigationheader.view',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/globalmessage/globalmessage',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/widgets/navigation.header/navigation.header.controls',
  'hbs!csui/pages/start/impl/navigationheader/impl/navigationheader',
  'i18n!csui/pages/start/impl/nls/lang',
  'css!csui/pages/start/impl/navigationheader/impl/navigationheader',
  'csui/lib/jquery.when.all'
], function (require, module, _, $, Backbone, Marionette, GlobalMessage,
    LayoutViewEventsPropagationMixin, controls, template, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enableMinimiseButtonOnProgressPanel: true
  });

  var NavigationHeaderView = Marionette.LayoutView.extend({
    template: template,

    regions: {
      messageRegion: '.csui-navbar-message'
    },

    ui: {
      branding: '.binf-navbar-brand',
      logo: '.csui-logo',
      left: '.binf-navbar-left',
      right: '.binf-navbar-right'
    },

    templateHelpers: function () {
      return {
        mainNavigationAria: lang.mainNavigationAria
      };
    },

    constructor: function NavigationHeaderView(options) {
      Marionette.LayoutView.call(this, options);
      this.propagateEventsToRegions();
      this.listenTo(this, 'render:controls', this._adjustControls.bind(this));
      this.listenTo(this, 'processbar:minimize processbar:maximize',
          this._adjustControlsWithAnimation.bind(this));
      this.listenTo(this, 'before:destroy', _.bind(function () {
        $(window).off('resize.' + this.cid, this._adjustControls.bind(this));
      }, this));
      $(window).on('resize.' + this.cid, this._adjustControls.bind(this));
    },

    _adjustControls: function () {
      var totalWidth          = this.el.offsetWidth,
          leftToolbarEle      = this.el.getElementsByClassName('binf-navbar-left')[0],
          leftToolbarWidth    = 0,
          rightToolbarEle     = this.el.getElementsByClassName('binf-navbar-right')[0],
          rightToolbarWidth   = 0,
          logoEle             = this.el.getElementsByClassName('csui-logo')[0],
          logoLocation        = controls.logo.get('location'),
          logoWrapper         = this.el.getElementsByClassName('csui-logo-' + logoLocation)[0],
          isLogoInAbsolutePos = logoWrapper && window.getComputedStyle(logoWrapper).position === 'absolute',
          bufferForLogo       = 40,
          logoEleWidth        = logoEle.offsetWidth + bufferForLogo;

      for (var i = 0; i < rightToolbarEle.childElementCount; i++) {
        rightToolbarWidth += (rightToolbarEle.children[i].offsetWidth || 0);
      }
      for (i = 0; i < leftToolbarEle.childElementCount; i++) {
        leftToolbarWidth += (leftToolbarEle.children[i].offsetWidth || 0);
      }

      // if the logo's wrapper has relative position, then obtain logo element overlapping by
      // calculating all the elements against total width.
      var isLogoOverlapped = !(isLogoInAbsolutePos ?
                             ((leftToolbarWidth + logoEleWidth / 2 < totalWidth / 2) &&
                              (rightToolbarWidth + logoEleWidth / 2 < totalWidth / 2)) :
                             totalWidth > (leftToolbarWidth + rightToolbarWidth + logoEleWidth));

      if (isLogoOverlapped) {
        logoEle.classList.add('binf-logo-hide');
      } else {
        if(logoEleWidth > 40){
          logoEle.classList.remove('binf-logo-hide');
        }
      }
      this.listenTo(this, "header:control:clicked", _.bind(function() {
        this.trigger("control:clicked");
      }, this));
    },

    _adjustControlsWithAnimation: function () {
      // considering progress panel's maximize and minimize animation effects.
      setTimeout(_.bind(function () {
        this._adjustControls();
      }, this), 301);
    },

    onRender: function () {
      var context = this.options.context,
          self    = this;

      GlobalMessage.setMessageRegionView(this, {
        classes: "csui-global-message",
        enableMinimiseButtonOnProgressPanel: config.enableMinimiseButtonOnProgressPanel
      });

      var logoLocation = controls.logo.get('location');
      if (logoLocation === 'none') {
        this.ui.logo.addClass('binf-hidden');
      } else {
        this.ui.branding.addClass('csui-logo-' + logoLocation);
      }

      this._resolveComponents()
          .done(function () {
            self.trigger('before:render:controls', self);
            controls.leftSide.each(createControls.bind(self, self.ui.left));
            controls.rightSide.each(createControls.bind(self, self.ui.right));
            self.trigger('render:controls', self);
          });

      function createControls(target, control) {
        var View = control.get('view');
        if (View) {
          var el     = $('<div>').addClass(control.get('parentClassName'))
              .appendTo(target),
              region = self.addRegion(_.uniqueId('csui:navigation.header.control'), {selector: el}),
              view   = new View({
                context: context,
                parentView: self
              });
          region.show(view);
        }
      }
    },

    _resolveComponents: function () {
      if (this._controlsResolved) {
        return this._controlsResolved;
      }

      function resolveControl(name) {
        var deferred = $.Deferred();
        require([name], deferred.resolve, deferred.reject);
        return deferred.promise();
      }

      var allComponents = controls.leftSide.models.concat(controls.rightSide.models),
          promises      = allComponents.map(function (control) {
            return resolveControl(control.id);
          }),
          deferred      = $.Deferred();
      $.whenAll.apply($, promises)
          .always(function (views) {
            views.forEach(function (view, index) {
              allComponents[index].set('view', view);
            });
            deferred.resolve();
          });
      this._controlsResolved = deferred.promise();
      return this._controlsResolved;
    }
  });

  _.extend(NavigationHeaderView.prototype, LayoutViewEventsPropagationMixin);

  return NavigationHeaderView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/error.global/impl/error.global',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " aria-describedby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"msgId") || (depth0 != null ? lookupProperty(depth0,"msgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"msgId","hash":{},"loc":{"start":{"line":5,"column":92},"end":{"line":5,"column":101}}}) : helper)))
    + "\" ";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class='server-error-message-wrapper'>\r\n          <div class='server-error-message horizontal-center-align'>\r\n            <span id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"msgId") || (depth0 != null ? lookupProperty(depth0,"msgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"msgId","hash":{},"loc":{"start":{"line":12,"column":22},"end":{"line":12,"column":31}}}) : helper)))
    + "\" class='csui-acc-focusable'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":12,"column":60},"end":{"line":12,"column":71}}}) : helper)))
    + "</span>\r\n          </div>\r\n        </div>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class='navigation-control-container' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"noHistory") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":20,"column":50},"end":{"line":20,"column":97}}})) != null ? stack1 : "")
    + ">\r\n          <a class='go-back-button circle-border horizontal-center-align' href=\"#\"\r\n            title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":22,"column":19},"end":{"line":22,"column":34}}}) : helper)))
    + "' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":22,"column":48},"end":{"line":22,"column":63}}}) : helper)))
    + "' class='csui-acc-focusable'>\r\n              <span class='icon icon-back'></span>\r\n          </a>\r\n          <div class='go-back-text button-text horizontal-center-align' title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backTooltip") || (depth0 != null ? lookupProperty(depth0,"backTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backTooltip","hash":{},"loc":{"start":{"line":25,"column":79},"end":{"line":25,"column":94}}}) : helper)))
    + "'>\r\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"backText") || (depth0 != null ? lookupProperty(depth0,"backText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"backText","hash":{},"loc":{"start":{"line":26,"column":20},"end":{"line":26,"column":32}}}) : helper)))
    + "</span>\r\n          </div>\r\n        </div>\r\n        <div class='navigation-control-container'>\r\n          <a class='go-home-button circle-border horizontal-center-align' href=\"#\"\r\n            title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":31,"column":19},"end":{"line":31,"column":34}}}) : helper)))
    + "' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":31,"column":48},"end":{"line":31,"column":63}}}) : helper)))
    + "' class='csui-acc-focusable'>\r\n              <span class='icon icon-home'></span>\r\n          </a>\r\n          <div class='go-home-text button-text horizontal-center-align' title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeTooltip") || (depth0 != null ? lookupProperty(depth0,"homeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeTooltip","hash":{},"loc":{"start":{"line":34,"column":79},"end":{"line":34,"column":94}}}) : helper)))
    + "'>\r\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"homeText") || (depth0 != null ? lookupProperty(depth0,"homeText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"homeText","hash":{},"loc":{"start":{"line":35,"column":20},"end":{"line":35,"column":32}}}) : helper)))
    + "</span>\r\n          </div>\r\n        </div>\r\n";
},"6":function(container,depth0,helpers,partials,data) {
    return " style='display:none;' ";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showCloseButton") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":39,"column":8},"end":{"line":43,"column":15}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <div class='navigation-control-container'>\r\n            <button type=\"submit\" class=\"close-button highlighted-btn\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeText") || (depth0 != null ? lookupProperty(depth0,"closeText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeText","hash":{},"loc":{"start":{"line":41,"column":71},"end":{"line":41,"column":84}}}) : helper)))
    + "</button>\r\n          </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='main-area-container' role='region' aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"regionAria") || (depth0 != null ? lookupProperty(depth0,"regionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"regionAria","hash":{},"loc":{"start":{"line":1,"column":59},"end":{"line":1,"column":73}}}) : helper)))
    + "'>\r\n  <div class='main-area-group'>\r\n    <div class='error-message-area'>\r\n      <div class='error-message-wrapper'>\r\n        <h2 class='error-message horizontal-center-align' "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"message") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":58},"end":{"line":5,"column":110}}})) != null ? stack1 : "")
    + " >\r\n          <span class='csui-acc-focusable'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"errorMessage") || (depth0 != null ? lookupProperty(depth0,"errorMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"errorMessage","hash":{},"loc":{"start":{"line":6,"column":43},"end":{"line":6,"column":59}}}) : helper)))
    + "</span>\r\n        </h2>\r\n      </div>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"message") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":6},"end":{"line":15,"column":13}}})) != null ? stack1 : "")
    + "    </div>\r\n\r\n    <div class='navigation-area horizontal-center-align'>\r\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hideNavigationButtons") : depth0),{"name":"unless","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(8, data, 0),"loc":{"start":{"line":19,"column":6},"end":{"line":44,"column":17}}})) != null ? stack1 : "")
    + "    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_error.global_impl_error.global', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/error.global/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/error.global/impl/nls/root/lang',{

  errorMessage: 'There was a problem serving the requested page.',
  backText: 'Go back',
  backTooltip: 'Navigate back to previous URL',
  homeText: 'Home',
  homeTooltip: 'Navigate to landing page',
  closeText: 'Close',
  closeTooltip: 'Close the error page',
  globalErrorRegionAria: 'Global error'

});



csui.define('css!csui/widgets/error.global/impl/error.global',[],function(){});
csui.define('csui/widgets/error.global/error.global.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/utils/contexts/factories/global.error', 'csui/utils/contexts/factories/application.scope.factory',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/error.global/impl/error.global',
  'i18n!csui/widgets/error.global/impl/nls/lang',
  'csui/utils/log',
  'module',
  'css!csui/widgets/error.global/impl/error.global'
], function (_, $, Marionette, base, GlobalErrorModelFactory,
    ApplicationScopeModelFactory, TabableRegionBehavior, template, lang, log, module) {
  'use strict';
  log = log(module.id);

  var GlobalErrorView = Marionette.ItemView.extend({
    className: 'csui-global-error',

    template: template,
    templateHelpers: function () {
      return {
        errorMessage: lang.errorMessage,
        backText: lang.backText,
        backTooltip: lang.backTooltip,
        homeText: lang.homeText,
        homeTooltip: lang.homeTooltip,
        closeText: lang.closeText,
        closeTooltip: lang.closeTooltip,
        msgId: _.uniqueId('msg'),
        regionAria: lang.globalErrorRegionAria,
        noHistory: this.noHistory
      };
    },

    TabableRegion: {
      behaviorClass: TabableRegionBehavior,
      initialActivationWeight: 100
    },

    ui: {
      errorMessage: '.error-message > span',
      closebutton: '.close-button'
    },

    events: {
      'keydown': 'onKeyInView',
      'click .go-home-button': 'onClickHome',
      'click .go-home-text': 'onClickHome',
      'click .go-back-button': 'onClickBack',
      'click .go-back-text': 'onClickBack',
      'click @ui.closebutton': 'onClickClose'
    },

    constructor: function GlobalErrorView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      if (!this.model) {
        this.model = options.context.getModel(GlobalErrorModelFactory, options);
      }

      this.noHistory = options.context &&
                       options.context.viewStateModel &&
                       options.context.viewStateModel.getHistory().length < 1;

      // IE11 fails to update CSS center styling correctly on window resize
      if (base.isIE11()) {
        var self = this;
        var resizeHandler = function () {
          self.render();
        };
        $(window).on('resize', resizeHandler);
        this.once('before:destroy', function () {
          $(window).off('resize', resizeHandler);
        });
      }
    },

    currentlyFocusedElement: function (event) {
      return this.ui.errorMessage;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger('click');
      }
    },

    onClickHome: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var context = this.options.context,
          viewStateModel = context && context.viewStateModel,
          start_id = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.START_ID);
      if (start_id) {
        var nextNode = context.getModel('nextNode');
        nextNode.set('id', start_id);
      } else {
        var applicationScope = context.getModel(ApplicationScopeModelFactory);
        applicationScope.set('id', '');
      }
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.history.back();
    },

    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      // destroy view, the caller should listen to 'destroy' and 'childview:destroy'
      // to get informed about closing this view
      this.destroy();
    }

  });

  return GlobalErrorView;
});


csui.define('css!csui/pages/error.page/impl/error.page',[],function(){});
// Places the error page view to the page body
csui.define('csui/pages/error.page/error.page.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/widgets/error.global/error.global.view',
  'csui/utils/url',
  'csui/utils/non-attaching.region/non-attaching.region',
  'css!csui/pages/error.page/impl/error.page'
], function (_, $, Marionette, PageContext, ApplicationScopeModelFactory,
    GlobalErrorView, Url, NonAttachingRegion) {

  var ErrorPageView = Marionette.ItemView.extend({

    template: false,

    constructor: function ErrorPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.ItemView.prototype.constructor.call(this, options);

      // Namespace for binf widgets
      this.$el.addClass('binf-widgets csui-error-page-container');

      this.context = new PageContext();
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change:id', this._onChangeId);
      this.globalErrorView = new GlobalErrorView({
        model: options.model,
        context: this.context
      });
    },

    onRender: function () {
      this.globalErrorView.render();
      this.$el.empty().append(this.globalErrorView.el);

      // Do not send showing events before triggering the first render event
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({el: this.el});
        bodyRegion.show(this, {render: false});
      }, this));
    },

    _onChangeId: function () {
	    location.href = Url.combine(new Url(new Url(location.pathname).getCgiScript()), 'app');
    }

  });

  return ErrorPageView;
});


csui.define('css!csui/pages/start/impl/start.page',[],function(){});
// Places navigation bar and the perspective pane to the page body
csui.define('csui/pages/start/start.page.view',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone','csui/lib/marionette', 'csui/utils/routing',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/factories/connector',
  'csui/pages/start/perspective.routing', 'csui/utils/base',
  'csui/pages/start/impl/navigationheader/navigationheader.view',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/utils/non-attaching.region/non-attaching.region',
  'csui/utils/page.leaving.blocker', 'csui/controls/iconpreload/icon.preload.view',
  'csui/pages/error.page/error.page.view',
  'css!csui/pages/start/impl/start.page'
], function (module, _, $, Backbone, Marionette, routing, PerspectiveContext, ConnectorFactory,
    PerspectiveRouting, base, NavigationHeaderView, PerspectivePanelView,
    ViewEventsPropagationMixin, TabablesBehavior, TabableRegionBehavior, NonEmptyingRegion,
    NonAttachingRegion, PageLeavingBlocker, IconPreloadView, ErrorPageView) {
  'use strict';

  var config = _.extend({
    signInPageUrl: 'signin.html',
    redirectToSignInPage: !routing.routesWithSlashes()
  }, module.config());

  var StartPageView = Marionette.ItemView.extend({
    template: false,

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },

    constructor: function StartPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.View.prototype.constructor.call(this, options);

      // Create application context for this page
      var context = options.context || new PerspectiveContext();
      var connector = context.getObject(ConnectorFactory);
      this.context = context;

      // Check if the page has authentication information
      // Use Basic Authentication (known credentials)
      if (!connector.connection.credentials &&
          // Use pre-authenticated session (session.ticket)
          !connector.authenticator.isAuthenticated() &&
          // Try pre-authenticated session from session storage
          !connector.authenticator.syncStorage().isAuthenticated() &&
          // Try pre-authenticated session from session storage
          !(connector.authenticator.interactive && connector.authenticator.interactive()) ) {
        if (!config.redirectToSignInPage) {
          // we are in app-mode and we have no credentials provided => show error
          this._showMissingCredentialsError();
        } else {
          this._navigateToSignIn();
        }
        return;
      }

      // If some call fails with an expired session, redirect to sign-in
      connector.authenticator.on('loggedOut', function (args) {
        // User's intentional logging out is followed by a redirect to the
        // logout page; do not change the location here too.
        if (args.reason === 'failed') {
          this._navigateToSignIn();
        }
        context.viewStateModel && context.viewStateModel.clean();
      }, this);

      // Create child views
      this.navigationHeader = new NavigationHeaderView({
        context: context,
        signInPageUrl: this.options.signInPageUrl
      });

      this.context = context;

      this.perspectivePanel = new PerspectivePanelView({
        context: context
      });

      // .mouse-blocked {
      // pointer-events: none;
      // }
      this.listenTo(this.perspectivePanel, 'before:start:perspective:loading', function () {
        // Block whole start page view from mouse clicks
        this.el.classList.add('mouse-blocked');
      })
      .listenTo(this.perspectivePanel, 'after:finish:perspective:loading', function () {
        // Unblock whole start page view for mouse clicks
        this.el.classList.remove('mouse-blocked');
      });

      // if applyFastTheme flag is enabled, then...
      // 1) hide the navigation header while starting the perspective loading
      // 2) show the navigation header as soon the perspective finishes loading
      if (this.options.applyFastTheme && this.perspectivePanel) {
        document.body.classList.add('csui-pre-loading');

        this.listenToOnce(this.perspectivePanel, 'before:start:perspective:loading', function () {
          // nothing to do at this moment.
        });

        this.listenToOnce(this.perspectivePanel, 'after:finish:perspective:loading', function () {
          var preLoaderElement = this.options.preLoaderEle || '#csui-pre-loader';
          $('body > ' + preLoaderElement).remove();
          document.body.classList.remove('csui-pre-loading');
        });
      }

      this.propagateEventsToViews(this.navigationHeader, this.perspectivePanel);

      var routing = PerspectiveRouting.getInstance({
        context: context
      });
      // Initialize URL routing and fetch the first perspective
      routing.start();

      // Namespace for binf widgets
      this.$el.addClass('binf-widgets');

      // Enable styling workarounds for Safari on iPad.  We might want to
      // put them to a separate CSS file loaded dynamically, instead of
      // having them in the same file identified by this class, if the size
      // of the workaround styles grows too much.
      if (base.isAppleMobile()) {
        this.$el.addClass('csui-on-ipad');
      }
      
      if (base.isIOSBrowser()) {
        this.$el.addClass('csui-on-macintosh');
      }

      csui.require(['csui/utils/accessibility'
      ], function (Accessibility) {
        Accessibility.isAccessibleMode() && this.$el.addClass('accessibility');
      }.bind(this));

      // Workaround for the back-forward cache in Safari, which ignores the
      // no-store cache control flag and loads the page from cache, when the
      // back button is clicked.  As long as logging out does not invalidate
      // the LLCookie/OTCSTicket and we write the ticket to the /app, going
      // back would allow the logged-out user working with the REST API again.
      //
      // http://madhatted.com/2013/6/16/you-do-not-understand-browser-history
      // http://www.mobify.com/blog/beginners-guide-to-http-cache-headers/
      $(window).on('unload', function () {});
    },

    onRender: function () {
      if (this._redirecting) {
        return this;
      }

      IconPreloadView.ensureOnThePage();

      this._appendView(this.navigationHeader);
      this._appendView(this.perspectivePanel);
      this.$el.children('.cs-perspective-panel').attr('role', 'main');

      // Do not send showing events before triggering the first render event
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({el: this.el});
        bodyRegion.show(this, {render: false});
      }, this));

      // Listen to global message show event to make it tababable.
      // Note: Doing it from here since messagepanel.view is bundled with csui-data
      this.$el.on('globalmessage.shown', function (event, view) {
        var messageTabable = new TabableRegionBehavior(view.options, view);
      });
    },

    onBeforeDestroy: function () {
      this.navigationHeader && this.navigationHeader.destroy();
      this.perspectivePanel && this.perspectivePanel.destroy();
    },

    _appendView: function (view) {
      var region = new NonEmptyingRegion({el: this.el});
      region.show(view);
    },

    _navigateToSignIn: function () {
      // The development HTML pages do not use OTDS login page
      if (!config.redirectToSignInPage) {
        // If the session expires or is not available, reload the /app page;
        // authentication should be performed by the server redirecting to
        // the OTDS login page
        PageLeavingBlocker.forceDisable();
        location.reload();
      } else {
        var signInPageUrl = this.options.signInPageUrl || config.signInPageUrl,
            query         = location.search;
        query += query ? '&' : '?';
        query += 'nextUrl=' + encodeURIComponent(location.pathname);
        location.href = signInPageUrl + query + location.hash;
      }
      // The REST of the view rendering continues, until the context
      // is switched, and the page would quickly show its content
      // before the location change finally kicks in.
      // before the location change finally kicks in.
      this._redirecting = true;
    },

    _showMissingCredentialsError: function() {
      // show error page;
      // missing credentials is a programmer error and we must not translate this message
      var errorModel    = new Backbone.Model({
          message:  'The StartPageView was created without providing valid authentication data.',
          hideNavigationButtons: true,
          errorCode: 401,
          showLogout: false
        }),
        errorPageView = new ErrorPageView({
          model: errorModel
        });
      errorPageView.render();
    }

  });

  _.extend(StartPageView.prototype, ViewEventsPropagationMixin);

  return StartPageView;
});

csui.define('csui/widgets/navigation.header/controls/help/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/navigation.header/controls/help/impl/nls/root/localized.strings',{
  HelpIconTitle: 'Help',
  HelpIconAria: 'Help pages, opens in new window'
});



csui.define('csui/utils/context.help/context.help.ids',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external perspectives
  'csui-ext!csui/utils/context.help/context.help.ids'
], function (_, Backbone, RulesMatchingMixin, extraHelpIds) {

  var ContextHelpIdModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      important: false,
      module: null
    },

    constructor: function ContextHelpIdModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(ContextHelpIdModel.prototype);

  var ContextHelpIdCollection = Backbone.Collection.extend({

    model: ContextHelpIdModel,
    comparator: "sequence",

    constructor: function ContextHelpIdCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByApplicationScope: function (options) {
      return this.find(function (item) {
        return item.matchRules(options, item.attributes);
      });
    }

  });

  var helpIds = new ContextHelpIdCollection([
    { // versions page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel && options.context.viewStateModel.get('state').dropdown === 'versions';
      },
      contextHelpId: 'qs-versionpg-bg'
    },
    { // audit page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel && options.context.viewStateModel.get('state').dropdown === 'audit';
      },
      contextHelpId: 'qs-audithistory-bg'
    },
    { // Collection
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 298;
      },
      contextHelpId: 'qs-addtocollection-bg'
    },
    { // Compound documents
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 136;
      },
      contextHelpId: 'compound-documents-so' 
    },
    { // email folder
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 751;
      },
      contextHelpId: 'qs-itemtypes-bg' 
    },
    { // permissions dialog
      sequence: 50,
      decides: function (options) {
        return options.context.viewStateModel.get('session_state') && options.context.viewStateModel.get('session_state').permissions;
      },
      contextHelpId: 'qs-permissions-bg'
    }
  ]);

  if (extraHelpIds) {
    helpIds.add(_.flatten(extraHelpIds, true));
  }

  return helpIds;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/help/impl/help',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"icon-help\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":30},"end":{"line":1,"column":39}}}) : helper)))
    + "\"></div>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_help_impl_help', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/navigation.header/controls/help/help.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'i18n!csui/widgets/navigation.header/controls/help/impl/nls/localized.strings',
  'i18n', 'csui/behaviors/keyboard.navigation/tabable.region.behavior', 'csui/utils/context.help/context.help.ids',
  'csui/models/server.module/server.module.collection', 'csui/lib/othelp',
  'hbs!csui/widgets/navigation.header/controls/help/impl/help'
], function (module, _, $, Marionette, base, localizedStrings, i18n, TabableRegionBehavior, contextHelpIds,
  ServerModuleCollection, OTHHUrlBuilder, template) {
  'use strict';

  // Read configuration from the original place for compatibility.
  var config = window.csui.requirejs.s.contexts._.config
    .config['csui/pages/start/impl/navigationheader/navigationheader.view'] || {};
  _.extend(config, module.config());
  config.help || (config.help = {});
  _.defaults(config.help, {
    language: i18n.settings.locale.replace(/[-_]\w+$/, ''),
    preserve: true
  });

  //Make sure the value provide by CS is not an empty string.
  //The othhURLBuilder does not account for empty strings, only
  //undefined values.
  if (config.help.urlRoot === '') {
    config.help.urlRoot = undefined;
  }
  if (config.help.tenant === '') {
    config.help.tenant = undefined;
  }
  if (config.help.type === '') {
    config.help.type = undefined;
  }

  var HelpView = Marionette.ItemView.extend({
    tagName: 'a',

    attributes: {
      href: '#',
      title: localizedStrings.HelpIconTitle,
      'aria-label': localizedStrings.HelpIconAria
    },

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.HelpIconTitle
      };
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 50
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function HelpView(options) {
      Marionette.ItemView.call(this, options);
      this.listenTo(this, 'click:help', this._onClick);
    },

    onRender: function () {
      var self = this;
      this.$el.on('click', function (event) {
        if (base.isControlClick(event)) {
          // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
          // command+click in mac.
        } else {
          self.triggerMethod('click:help');
        }
      });
      this.$el.on('keydown', function (event) {
        if (event.keyCode === 32) {
          event.preventDefault();
          self.triggerMethod('click:help');
        }
      });
    },

    _onClick: function () {
      var serverModules = new ServerModuleCollection();
      var appScopeId = this.options.context._applicationScope.attributes.id;
      var context = this.options.context;
      var contextHelpModel = contextHelpIds.findByApplicationScope({ context: context });

      if (contextHelpModel) {
        var contextHelpId = contextHelpModel.get('contextHelpId');
        contextHelpId = typeof contextHelpId === 'function' ? contextHelpId({ context:context }) : contextHelpId;
      }

      serverModules
        .fetch()
        .then(
          function () {
            var modulesWithHelp, urlBuilder, documentsOptions, helpURL, browserTab, topicId,
              modulesHelpDocIdArr = [];
            modulesWithHelp = serverModules.filter(function (serverModule) {
              return !!serverModule.get('helpDocId');
            });

            urlBuilder = new OTHHUrlBuilder({
              urlRoot: config.help.urlRoot
            });

            documentsOptions = {
              preserve: config.help.preserve,
              documents: []
            };
            // grouping the available helpmodules
            _.each(modulesWithHelp, function (serverModule) {
              var currmoduleId = serverModule.get('helpDocId');
              //splitting helpdocid and fetching the prenumeric part as below
              // cseng200200-h-uxe -> cseng, cssui160210 - > cssui to group the modules with same name
              if (modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]]) {
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]].push(serverModule);
              }
              else {
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]] = [];
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]][0] = serverModule;
              }

            });

            //[csels:[{serverModule}],cseng:[{serverModule,serverModule,serverModule}],cssui:[{serverModule,serverModule,serverModule}]]
            // creating document options and adding context page to buildurl based on availability in each group
            Object.keys(modulesHelpDocIdArr).forEach(function (key) {
              var contextualHelp, sortedObjs = [], modulesHelpDocIdArrLastMatch = [];
              // splitting each prenumeric group and grouping based on post numeric and post hyphen string
              _.each(modulesHelpDocIdArr[key], function (serverModule) {
                if (serverModule.get('contextualHelp')) {
                  contextualHelp = serverModule.get('contextualHelp');
                }
                var topicId = contextHelpId;
                if (!topicId && contextualHelp && !!appScopeId) {
                  topicId = contextualHelp[appScopeId];
                }
                var helpDocId = serverModule.get('helpDocId');
                var lastHiphenIndex = serverModule.get('helpDocId').lastIndexOf('-');
                var everythingAfterTheFinalHiphen = serverModule.get('helpDocId').substring(lastHiphenIndex + 1);
                //splitting helpdocid and fetching the prenumeric part as below
                // cseng200200-h-uxe -> uxe,  cseng200200-h-axe - > axe to group the modules with same last name
                //{ugd:[serverModule,serverModule],axe:[serverModule,serverModule,serverModule],axe:[serverModule,serverModule]}
                if (modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen]) {
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen].push({ "helpDocId": helpDocId, "topicId": topicId });
                }
                else {
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen] = [];
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen][0] = { "helpDocId": helpDocId, "topicId": topicId };
                }
              });
              var index = 0, count =0;
              // sorting to descending order in the available group array for each group based on helpdocid
              Object.keys(modulesHelpDocIdArrLastMatch).forEach(function (key) {
                sortedObjs[key] = _.sortBy(modulesHelpDocIdArrLastMatch[key], function (module) {
                  return parseInt(module['helpDocId'].match(/[^\d]+|\d+/g)[1]);
                }).reverse();
              });
              // creating document options to send helpdocid and topicid to url builder

              /*    0: {helpDocId: "cssui210400-h-ugd", topicId: undefined}
                    1: {helpDocId: "cssui210400-h-ugd", topicId: undefined}
                    2: {helpDocId: "cssui210400-h-ugd", topicId: "permexp-so"}
                    3: {helpDocId: "cssui210400-h-ugd", topicId: "csui-permexp-so"} 
              */
               Object.keys(sortedObjs).forEach(function (key) {
                 if (sortedObjs[key].length === 2) {
                   index = sortedObjs[key][0]['topicId'] ? 0 : sortedObjs[key][1]['topicId'] ? 1 : 0;
                 }
                 else if (sortedObjs[key].length > 2) {
                   for (var i = 1; i < sortedObjs[key].length; i++) {
                     if (sortedObjs[key][0]['helpDocId'] === sortedObjs[key][i]['helpDocId']) {
                       count++;
                     }
                   }
                   if (count == sortedObjs[key].length - 1) {
                     sortedObjs[key].filter(function (sortedObj, postion) {
                      if (sortedObj['topicId']) {
                        index = postion;
                        return true;
                      }
                    });
                   }
                 }
                documentsOptions.documents.push({
                  module: sortedObjs[key][index]['helpDocId'],
                  topic: sortedObjs[key][index]['topicId'] ? sortedObjs[key][index]['topicId'] : (sortedObjs[key][0]['helpDocId'].indexOf('cssui') === 0 ? 'sui-overview-bg' : undefined)
                });
                if (documentsOptions.documents[documentsOptions.documents.length - 1]['topic']) {
                  documentsOptions.documents[documentsOptions.documents.length - 1].active = true;
                }
              });
            });

            helpURL = urlBuilder.buildHelpUrl(config.help.language,
              documentsOptions, {
              tenant: config.help.tenant,
              type: config.help.type,
              options: { search: 'allModules' }
            });
            browserTab = window.open(helpURL, '_blank');
            browserTab.focus();
          }), function (error) {
            console.error(error);
          };
    }
  });

  return HelpView;
});

csui.define('csui/widgets/navigation.header/controls/home/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/navigation.header/controls/home/impl/nls/root/localized.strings',{
  HomeIconTitle: 'Home',
  HomeIconAria: 'Home page'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/home/impl/home',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-icon-home\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":35},"end":{"line":1,"column":44}}}) : helper)))
    + "\"></div>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_home_impl_home', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/navigation.header/controls/home/home.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/url', 'csui/utils/base',
  'i18n!csui/widgets/navigation.header/controls/home/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/contexts/factories/application.scope.factory', 'csui/utils/node.links/node.links',
  'hbs!csui/widgets/navigation.header/controls/home/impl/home'
], function (_, $, Marionette, Url, base, localizedStrings, TabableRegionBehavior,
    ApplicationScopeModelFactory, NodeLinks, template) {
  'use strict';

  var HomeView = Marionette.ItemView.extend({
    tagName: 'a',

    className: 'csui-home binf-hidden',

    attributes: {
      href: '',
      title: localizedStrings.HomeIconTitle,
      'aria-label': localizedStrings.HomeIconAria
    },

    events: {
      'click': 'onClickHomeIcon',
      'keydown': 'onKeydownHomeIcon'
    },

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.HomeIconTitle
      };
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function HomeView(options) {
      Marionette.ItemView.call(this, options);
      this.listenTo(options.context, 'sync error', this._toggleVisibility);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
    },

    onRender: function () {
      var connector = this.options && this.options.context && this.options.context._user && this.options.context._user.connector,
          serverUrl = new Url(connector && connector.connection.url || location.href),
          link      = NodeLinks.getHomeUrl(serverUrl);
      this.$el.attr('href', link);
    },

    onClickHomeIcon: function (e) {
      if (base.isControlClick(e)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
      e.preventDefault();
      this.applicationScope.set('id', '');
      }
    },

    onKeydownHomeIcon: function (e) {
      if (e.keyCode === 32) {
        this.onClickHomeIcon(e);
      }
    },

    _toggleVisibility: function () {
      if (this._isRendered) {
        // Detect the user landing page.
        if (!this.applicationScope.id) {
          this.$el.addClass('binf-hidden');
        } else {
          this.$el.removeClass('binf-hidden');
        }
      }
    }
  });

  return HomeView;
});

csui.define('csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/root/localized.strings',{
  ShowBreadcrumbs: 'Show Breadcrumbs',
  HideBreadcrumbs: 'Hide Breadcrumbs'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-button-icon csui-breadcrumb-caret-type "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"breadcrumbsCaretName") || (depth0 != null ? lookupProperty(depth0,"breadcrumbsCaretName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"breadcrumbsCaretName","hash":{},"loc":{"start":{"line":1,"column":57},"end":{"line":1,"column":81}}}) : helper)))
    + "\"></span>\r\n<span class=\"csui-breadcrumb-btn-innertext\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"breadcrumbsText") || (depth0 != null ? lookupProperty(depth0,"breadcrumbsText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"breadcrumbsText","hash":{},"loc":{"start":{"line":2,"column":44},"end":{"line":2,"column":63}}}) : helper)))
    + "</span>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_breadcrumbs_impl_breadcrumbs', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',[],function(){});
csui.define('csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'i18n!csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/application.scope.factory',
  'hbs!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',
  'css!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs'
], function (_, $, Marionette, localizedStrings, TabableRegionBehavior,
    AncestorCollectionFactory, ApplicationScopeModelFactory,
    template) {
  'use strict';

  var BreadcrumbsView = Marionette.ItemView.extend({
    tagName: 'button',

    attributes: {
      'type': 'button'
    },

    className: 'breadcrumbs-handle binf-btn',

    ui: {
      breadcrumbsTextContainer: '.csui-breadcrumb-btn-innertext',
      breadcrumbsCaretContainer: '.csui-breadcrumb-caret-type'
    },

    serializeData: function () {
      var flag = !!this.applicationScope.get('breadcrumbsVisible'),
          data = {
            breadcrumbsText: localizedStrings.ShowBreadcrumbs,
            breadcrumbsCaretName: 'icon-expandArrowDownWhite'
          };

      if (flag) {
        data = {
          breadcrumbsText: localizedStrings.HideBreadcrumbs,
          breadcrumbsCaretName: 'icon-expandArrowUpWhite',
        };
      }
      return data;
    },

    template: template,

    events: {
      'keydown': 'onKeyInView',
      'click': '_toggleBreadCrumbs'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onRender: function () {
      if (matchMedia) {
        this._mq = window.matchMedia("(max-width: 1124px)");
        this._mq.addListener(_.bind(this._windowsWidthChange, this));
        this._windowsWidthChange(this._mq);
      }
    },

    constructor: function BreadcrumbsView(options) {
      Marionette.ItemView.call(this, options);

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.stopListening(this.applicationScope, 'change:breadcrumbsVisible')
          .listenTo(this.applicationScope, 'change:breadcrumbsVisible',
              this._breadcrumbVisibilityChanged)
          .listenTo(this.applicationScope, 'change:breadcrumbsVisible',
              this._breadcrumbUpdateText);

      this.stopListening(this.applicationScope, 'change:breadcrumbsAvailable')
          .listenTo(this.applicationScope, 'change:breadcrumbsAvailable',
              this._breadcrumbAvailabilityChanged);

      this.stopListening(this.applicationScope, 'change:hideToggleButton')
          .listenTo(this.applicationScope, 'change:hideToggleButton',
              this._hideToggleButton);

      this._breadcrumbVisibilityChanged();
      this._breadcrumbAvailabilityChanged();
    },

    _breadcrumbVisibilityChanged: function () {
      this._breadcrumbsVisible = this.applicationScope.get('breadcrumbsVisible');
      if (this._breadcrumbsVisible) {
        this.$el.removeClass('csui-breadcrumbs-hidden');
        this.triggerMethod('refresh:tabindexes');
      } else {
        this.$el.addClass('csui-breadcrumbs-hidden');
      }
    },

    _hideToggleButton: function (bcNode) {
      var hideBtn = !!bcNode.get('hideToggleButton');
      var btnElement = this.$el.closest('.tile-breadcrumb');
      if (btnElement.length) {
        btnElement[!!hideBtn ? 'addClass' : 'removeClass']('binf-hidden');
      }
    },

    _breadcrumbAvailabilityChanged: function () {
      this._breadcrumbsAvailable = this.applicationScope.get('breadcrumbsAvailable');
      if (this._breadcrumbsAvailable) {
        this.$el.removeClass('csui-breadcrumbs-not-available');
        this.triggerMethod('refresh:tabindexes');
      } else {
        this.$el.addClass('csui-breadcrumbs-not-available');
      }
    },
    _breadcrumbUpdateText: function () {
      if (!!this.applicationScope.get('breadcrumbsVisible')) {
        this.$el.attr('aria-label', localizedStrings.HideBreadcrumbs);
        this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowDownWhite').addClass(
            'icon-expandArrowUpWhite');
        this.ui.breadcrumbsTextContainer.text(localizedStrings.HideBreadcrumbs);
      } else {
        this.$el.attr('aria-label', localizedStrings.ShowBreadcrumbs);
        this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowUpWhite').addClass(
            'icon-expandArrowDownWhite');
        this.ui.breadcrumbsTextContainer.text(localizedStrings.ShowBreadcrumbs);
      }
    },

    _showBreadcrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', true);
    },

    _hideBreadcrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', false);
    },
    _toggleBreadCrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', !this._breadcrumbsVisible);
    },

    _windowsWidthChange: function (mq) {
      if (mq.matches) {
        this._previousBreadcrumbState = this.applicationScope.get('breadcrumbsVisible');
        this.applicationScope.set('breadcrumbsVisible', true);
      } else {
        this.applicationScope.set('breadcrumbsVisible', this._previousBreadcrumbState);
      }
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 9:
        // tab
        this.ignoreFocusBlur = false;
        break;
      case 13:
      case 32:
        // enter or space key
        this.ignoreFocusBlur = false;
        event.preventDefault();
        this.applicationScope.set('breadcrumbsVisible', !this._breadcrumbsVisible);
        break;
      }
    }

  });

  return BreadcrumbsView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.slices/impl/search.slices',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<label class=\"csui-search-popover-row-body\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":1,"column":58},"end":{"line":1,"column":69}}}) : helper)))
    + "\">\r\n    <input type=\"radio\" class=\"csui-slice-option\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":2,"column":64},"end":{"line":2,"column":75}}}) : helper)))
    + "\" name=\"slice\" value=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceDisplayName") || (depth0 != null ? lookupProperty(depth0,"sliceDisplayName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceDisplayName","hash":{},"loc":{"start":{"line":2,"column":97},"end":{"line":2,"column":119}}}) : helper)))
    + "\">\r\n        <span class=\"csui-search-popover-checked\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":3,"column":64},"end":{"line":3,"column":75}}}) : helper)))
    + "\"></span>\r\n        <span class=\"csui-search-popover-label\" data-sliceid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceId") || (depth0 != null ? lookupProperty(depth0,"sliceId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceId","hash":{},"loc":{"start":{"line":4,"column":62},"end":{"line":4,"column":73}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sliceDisplayName") || (depth0 != null ? lookupProperty(depth0,"sliceDisplayName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sliceDisplayName","hash":{},"loc":{"start":{"line":4,"column":75},"end":{"line":4,"column":97}}}) : helper)))
    + "</span>\r\n</label>";
}});
Handlebars.registerPartial('csui_widgets_search.slices_impl_search.slices', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.slices/search.slices.item.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'hbs!csui/widgets/search.slices/impl/search.slices'
], function (_, $, Marionette, SearchSlicesTemplate) {
  'use strict';
  var SearchSlicesItemView = Marionette.View.extend({
    className: 'csui-search-popover-row',
    template: SearchSlicesTemplate,
    attributes: function () {
      return {
        id: this.model.get('sliceId'),
        title: this.model.get('sliceTooltip'),
        'aria-label': this.model.get('sliceDisplayName'),
        tabindex: "-1",
      };
    },

    templateContext: function () {
      var sliceDisplayName = this.model && this.model.get('sliceDisplayName'),
        sliceId = this.model && this.model.get('sliceId');
      return {
        sliceDisplayName: sliceDisplayName,
        sliceId: sliceId
      };
    },

    events: {
      'click .csui-search-popover-row-body': 'setSlices',
      'keydown .csui-search-popover-row-body': 'accessibility',
      'keyup .csui-search-popover-row-body': 'keyUpHandler',
    },

    constructor: function SearchSlicesItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },

    setSlices: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var sliceId = this.model.get('sliceId'),
        _currentEleChecked = this.$el.find('.icon-listview-checkmark').length;
      this.options.originatingView.options.sliceString = "";
      this.options.parentView.removePreviousSelection();
      if (!_currentEleChecked) {
        this.$el.find('.csui-search-popover-checked').addClass("icon-listview-checkmark");
        this.options.originatingView.options.sliceString = "{" + sliceId + "}";
        this.$el.find('.csui-slice-option').prop("checked", true);
      }
      else{
        this.$el.find('.csui-slice-option').prop("checked", false);
      }
      this.options.originatingView.namedLocalStorage.set('selectedSlice',  this.options.originatingView.options.sliceString);
      this.options.originatingView.options.model.attributes.slice = this.options.originatingView.options.sliceString;
    },

    accessibility: function (event) {
      switch (event.keyCode) {
        case 9:
          if (event.shiftKey) {
            if (this.options.originatingView.$el.find('.csui-selected-checkbox').length) {
              this.options.originatingView.$el.find('.csui-selected-checkbox').addClass('active');
              this.options.originatingView.$el.find('.csui-selected-checkbox input[type="checkbox"]')[0].focus();
            }
            else {
              this.options.originatingView.ui.input[0].focus();
            }
          } else {
            if (this.options.originatingView.$el.find('.csui-slices-more').hasClass('binf-hidden') || !this.options.originatingView.$el.find('.csui-slices-more').length) {
              if (this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-popover-row').length) {
                this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-popover-row')[0].focus();
              }
              else {
                $(this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-show-more')[0]).focus();
              }
            } else {
              this.options.originatingView.$el.find('.csui-slices-more')[0].focus();
            }
          }
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          break;
        case 38:
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          if (this.$el.prev().length) {
            this.$el.prev().find('.csui-search-popover-row-body').addClass('active');
            this.$el.prev().find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          } else {
            var el = this.options.parentView.$el.find('.csui-search-popover-row-body');
            $(el[el.length - 1]).addClass('active');
            $(el[el.length - 1]).find('input[type="radio"]')[0].focus();
          }
          break;
        case 40:
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          if (this.$el.next().length) {
            this.$el.next().find('.csui-search-popover-row-body').addClass('active');
            this.$el.next().find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          } else {
            $(this.options.parentView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
            $(this.options.parentView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
          }
          break;
        case 32:
          this.setSlices(event);
          this.$el.find('.csui-search-popover-row-body').addClass('active');
          this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          break;
        case 27:
          this.$el.removeClass('active');
          if (this.options.originatingView.options.data.showOptionsDropDown) {
            this.options.originatingView.hideSearchOptionsDropDown();
          }
          break;
        case 13:
          this.setSlices(event);
          this.$el.find('.csui-search-popover-row-body').addClass('active');
          this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          break;
      }
      event.preventDefault();
    },

     // supress bubbling of keyup space  event to document when tried to  toggle radiobutton on firefox browser
     keyUpHandler: function (event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
  });
  return SearchSlicesItemView;
});
csui.define('csui/widgets/search.slices/search.slices.list.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'csui/widgets/search.slices/search.slices.item.view'
], function (_, $, Marionette, SearchSlicesItemView) {
  'use strict';
  var SearchSlicesListView = Marionette.CollectionView.extend({
    className: 'csui-search-slice-container',
    childView: SearchSlicesItemView,
    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this
      };
    },

    constructor: function SearchSlicesListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },

    removePreviousSelection: function () {
      var _checkedEle = this.$el.find(".csui-search-popover-checked");
      $(_checkedEle).removeClass("icon-listview-checkmark");
     this.$el.find('.active').removeClass('active');
      return;
    },

    getSelectedSlice: function () {
      if (!this.options.originatingView.options.sliceString && this.options.originatingView.options.model && this.options.originatingView.options.model.get("slice")) {
        this.options.originatingView.options.sliceString = this.options.originatingView.options.model.get("slice");
      }
      this.$el.find(".csui-search-popover-checked").removeClass('icon-listview-checkmark');
      this._setSliceValue(this.options.originatingView.options.sliceString);
    },

    _setSliceValue: function (sliceVal) {
      sliceVal = sliceVal ? sliceVal : this.options.originatingView.namedLocalStorage.get('selectedSlice');
      if (!!sliceVal && sliceVal !== "{}") {
        this.$el.find("#" + sliceVal.substring(1, sliceVal.length - 1)).find('.csui-search-popover-checked').addClass(
          "icon-listview-checkmark");
        this.$el.find("#" + sliceVal.substring(1, sliceVal.length - 1)).find('.csui-slice-option').prop('checked', true);
      }
    },
  });
  return SearchSlicesListView;
});
csui.define('csui/widgets/search.forms/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.forms/impl/nls/root/lang',{
  personalSearchFormsLabel: 'My search forms',
  systemSearchFormsLabel: 'Shared search forms',
  recentSearchFormsLabel: 'Recent search forms',
  searchFormLabel :'Search forms',
  search: "Search",
  loading:"Loading...",
  showMore: "More search forms",
  openSearchFormsAria: "Open search forms dialog",
  showMoreSearchFormsAria : "Open more search forms dialog",
  searchFormTooltip: "Open: {0}",
  btnBack: 'Back',
  btnBackAriaLabel : 'Back to search forms',
  btnSearch: 'Search'
});



csui.define('css!csui/widgets/search.forms/impl/search.forms',[],function(){});
csui.define('csui/widgets/search.forms/search.forms',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/lib/backbone',
    'csui/utils/non-emptying.region/non-emptying.region',
    'i18n!csui/widgets/search.forms/impl/nls/lang',
    'css!csui/widgets/search.forms/impl/search.forms'
], function (_, $, Marionette, Backbone, NonEmptyingRegion, lang) {
    "use strict";
    var SearchForm = Marionette.View.extend({

        className: 'csui-search-form-container',
        constructor: function SearchForm(options) {
            options || (options = {});
            this.models = new Backbone.Collection();
            Marionette.View.prototype.constructor.call(this, options);
        },

        findButton: function (ele, btnType, value) {
            var button = _.find(ele, function (item) {
                return item.get("btnType") === btnType;
            });
            button && button.set("hidden", value);
        },

        openFormInSidepanel: function (searchFormCollectionOrModel, searchFormId) {
            var deferred = $.Deferred();
            var self = this;
            csui.require(
                ['csui/controls/side.panel/side.panel.view',
                    'csui/widgets/search.forms/search.form.view',
                    'csui/widgets/search.forms/search.forms.container.view'
                ],
                function (SidePanelView, SearchFormView, SearchFormsContainerView) {
                    var title;
                    if (searchFormId) {
                        var schema = searchFormCollectionOrModel.get('schema');
                        title = schema.title ? schema.title : searchFormCollectionOrModel.get('name');
                        self.customSearchForm = new SearchFormView({
                            model: searchFormCollectionOrModel,
                            searchFormId: searchFormId,
                            hideSearchButton: true,
                            showInSearchResultsNewPerspective: true,
                            context: self.options.options.context
                        });
                        self.sidePanel ? self.sidePanel.options.slides[0].content = self.customSearchForm : '';
                    } else {
                        if (!self.searchFormsContainerView) {
                            self.searchFormsContainerView = new SearchFormsContainerView({
                                searchFormsList: searchFormCollectionOrModel,
                                originatingView: self
                            });
                        }
                        title = lang.searchFormLabel;
                        self.sidePanel ? self.sidePanel.options.slides[0].content = self.searchFormsContainerView : '';
                        self.searchFormsContainerView.$el.removeClass('binf-hidden');
                    }

                    if (!self.sidePanel || self.sidePanel && self.sidePanel.isDestroyed) {
                        var sidePanel = new SidePanelView({
                            slides: [{
                                title: title,
                                content: searchFormId ? self.customSearchForm : self.searchFormsContainerView,
                                footer: {
                                    leftButtons: [{
                                        type: 'action',
                                        v2Icon: {
                                            iconName: 'csui_action_back32',
                                            states: true
                                        },
                                        btnType: 'back',
                                        className: 'cs-go-back arrow_back csui-has-v2icon',
                                        attributes: {
                                            'title': lang.btnBack,
                                            'aria-label': lang.btnBackAriaLabel
                                        },
                                        disabled: !!self.options.originatingView.hideBackButton
                                    }],
                                    rightButtons: [{
                                        label: lang.search,
                                        type: 'action',
                                        id: 'search-btn',
                                        btnType: 'search',
                                        attributes: {
                                            'title': lang.btnSearch,
                                            'aria-label': lang.btnSearch
                                        },
                                        className: 'binf-btn binf-btn-primary csui-custom-search-form-submit cs-search',
                                        disabled: false
                                    }]
                                }
                            }],
                            sidePanelClassName: 'cvs-in-sidepanel'
                        });
                        self.sidePanel = sidePanel;
                        sidePanel.show();

                    } else if (self.sidePanel.$el.is(':visible')) {
                        var bodyRegion = new NonEmptyingRegion({
                            el: self.sidePanel.ui.body
                        });
                        self.sidePanel.slides[0].title = title;
                        if (searchFormId) {
                            bodyRegion.$el.find('.csui-search-forms-list').addClass('binf-hidden');
                            bodyRegion.$el.find('.csui-search-form-collection').addClass('binf-hidden');
                            bodyRegion.$el.find('.csui-custom-view-search').removeClass('binf-hidden');

                        } else {
                            bodyRegion.$el.find('.csui-search-forms-list').removeClass('binf-hidden');
                            bodyRegion.$el.find('.csui-search-form-collection').removeClass('binf-hidden');
                            bodyRegion.$el.find('.csui-custom-view-search').remove();
                            self.sidePanel.trigger('after:show');
                        }
                        self.sidePanel.headerView.update(self.sidePanel.options.slides[0]);
                        if (searchFormId) {
                            bodyRegion.show(self.sidePanel.options.slides[0].content);
                        }
                    }
                    var defaultValues = _.filter(_.flatten(_.map(self.customSearchForm && self.customSearchForm.model.get("data"), _.values)),
                    function (val) {return val; });
                    var disableSearch = !!defaultValues && defaultValues.length === 0;
                    if (!disableSearch) {
                        $(".cs-search").removeClass("binf-disabled").removeClass(
                            "csui-search-form-submit-disabled");
                        self.trigger('enable:search', true);
                    } else {
                        $(".cs-search").addClass("binf-disabled").addClass(
                            "csui-search-form-submit-disabled");
                        self.trigger('enable:search', false);
                    }
                    if (!searchFormId) {
                        self.findButton(self.sidePanel.footerView.leftCollection.models, 'back', true);
                        self.findButton(self.sidePanel.footerView.rightCollection.models, 'search', true);
                    } else {
                        if (!self.options.originatingView.hideBackButton) {
                            self.findButton(self.sidePanel.footerView.leftCollection.models, 'back', false);
                        } else {
                            self.findButton(self.sidePanel.footerView.leftCollection.models, 'back', true);
                        }
                        self.customSearchForm.listenTo(self.customSearchForm, 'render:form', function () {
                            self.sidePanel.triggerMethod('set:focus');
                            self.sidePanel.trigger('ensure:scrollbar');
                        });
                        self.findButton(self.sidePanel.footerView.rightCollection.models, 'search', false);
                    }
                    self.sidePanel && self.sidePanel.footerView.trigger('update:footer');
                    self.options.originatingView.$el.find('.csui-searchforms-popover-row').removeClass('binf-disabled');
                    self.sidePanel && self.sidePanel.$el.find('.csui-searchforms-popover-row').removeClass('binf-disabled');
                    self.sidePanel.listenTo(self.customSearchForm, "button:click", function (actionButton) {
                        if (actionButton.btnType === 'search') {
                            self.customSearchForm.options.query = self.options.options.model;
                            self.customSearchForm.loadCustomSearch();
                        } else if (actionButton.btnType === 'back') {
                            self.openFormInSidepanel(
                                self.options.originatingView.searchboxModel.get('search_forms'));
                            return;
                        }
                        self.sidePanel.hide();
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'after:show', function () {
                        if (self.isNewForm) {
                            self.customSearchForm.customFormView.formView.isFormChanged = undefined;
                        }
                       self.sidePanel.trigger('update:scrollbar');
                       if (this.$el.find('.csui-searchforms-popover-row').length && self.isKeyPress) {
                        this.$el.find('.csui-searchforms-popover-row')[0].focus();
                        self.isKeyPress = false;
                       }
                       var cid = self.options.originatingView.cid;
                       $(document).off('click.' + cid + ' keydown.' + cid);
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'before:hide', function () {
                        var searchBoxView = self.options.originatingView;
                        $(document).on('click.' + searchBoxView.cid + ' keydown.' + searchBoxView.cid,
                            searchBoxView, searchBoxView._hideSearchBar);
                        self.options.originatingView.ui.input.attr('tabindex', 0);
                    });
                    self.sidePanel.listenTo(self.customSearchForm, 'enable:search', function (isSearchEnabled) {
                        self.customSearchForm.trigger("update:button", "search-btn", {
                            disabled: !isSearchEnabled
                        });
                    });

                    self.sidePanel.listenTo(self.sidePanel, 'keydown', function (event) {
                       if (event.keyCode === 9) {
                        if (event.shiftKey && $(event.target)[0].id ==='csui-side-panel-cancel') {
                            var that = self;
                            if(!!that.searchFormsContainerView){
                                setTimeout(function () {
                                    that.searchFormsContainerView.systemSearchForms.$el
                                    .find('.csui-searchforms-popover-row')[0].focus();
                                },0);
                            }
                        }
                       }
                    });

                    self.sidePanel.listenTo(self.customSearchForm, 'click:search', function () {
                        // Close Side panel when search triggered from CVS as it would navigate to search result.
                        self.sidePanel.hide();
                    });

                    deferred.resolve();
                }, deferred.reject);
            return deferred.promise();
        },

        isModelFetched: function (searchFormId) {
            this.isNewForm = true;
            if (this.models && this.models.length && this.models.get(searchFormId)) {
                var data = JSON.parse(JSON.stringify(this.models.get(searchFormId).originalAttributesData));
                this.models.get(searchFormId).set('data', data);
                this.openFormInSidepanel(this.models.get(searchFormId), searchFormId);
            } else {
                var self = this;
                csui.require(
                    [
                        'csui/widgets/search.forms/search.form.model'
                    ],
                    function (SearchFormModel) {
                        var searchFormModel = new SearchFormModel({
                            id: searchFormId
                        }, {
                            connector: self.options.connector,
                            options: self.options
                        });
                        searchFormModel.fetch().then(function (result) {
                            var data = JSON.parse(JSON.stringify(searchFormModel.attributes.data));
                            searchFormModel.originalAttributesData = data;
                            self.models.push(searchFormModel);
                            self.openFormInSidepanel(searchFormModel, searchFormId);
                        });
                    });
            }

        },

    });
    return SearchForm;
});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.forms/impl/search.forms',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"csui-icon-standard-search\"></span>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <span class=\"csui-icon-query-form-search\"></span>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"javascript:void(0)\" class=\"csui-searchforms-popover-row\"\r\n   data-searchformid=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormId") || (depth0 != null ? lookupProperty(depth0,"searchFormId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormId","hash":{},"loc":{"start":{"line":2,"column":22},"end":{"line":2,"column":39}}}) : helper)))
    + "\" id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormId") || (depth0 != null ? lookupProperty(depth0,"searchFormId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormId","hash":{},"loc":{"start":{"line":2,"column":45},"end":{"line":2,"column":62}}}) : helper)))
    + "\" title='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormTooltip") || (depth0 != null ? lookupProperty(depth0,"searchFormTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormTooltip","hash":{},"loc":{"start":{"line":2,"column":71},"end":{"line":2,"column":94}}}) : helper)))
    + "'\r\n   aria-label='"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormName") || (depth0 != null ? lookupProperty(depth0,"searchFormName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormName","hash":{},"loc":{"start":{"line":3,"column":15},"end":{"line":3,"column":35}}}) : helper)))
    + "'>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"quickLink") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":4,"column":2},"end":{"line":8,"column":9}}})) != null ? stack1 : "")
    + "  <span class=\"cs-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormName") || (depth0 != null ? lookupProperty(depth0,"searchFormName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormName","hash":{},"loc":{"start":{"line":9,"column":25},"end":{"line":9,"column":45}}}) : helper)))
    + "</span>\r\n</a>";
}});
Handlebars.registerPartial('csui_widgets_search.forms_impl_search.forms', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.forms/search.forms.item.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'hbs!csui/widgets/search.forms/impl/search.forms',
  'i18n!csui/widgets/search.forms/impl/nls/lang',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (_, $, Marionette, SearchFormsTemplate, lang) {
  'use strict';
  var SearchFormsItemView = Marionette.View.extend({
    className: 'csui-search-form-item',
    template: SearchFormsTemplate,

    templateContext: function () {
      var searchFormName = this.model && this.model.has('name') && this.model.get('name'),
          searchFormId = this.model && this.model.has('id') && this.model.get('id');
      searchFormName = searchFormName && searchFormName.toLowerCase();
      searchFormName = searchFormName && searchFormName.charAt(0).toUpperCase() +
                       searchFormName.slice(1);
      return {
        quickLink: this.model.get('type') === 'quick',
        searchFormName: searchFormName,
        searchFormId: searchFormId,
        searchFormTooltip : _.str.sformat(lang.searchFormTooltip, searchFormName)
      };
    },

    events: {
      'click .csui-searchforms-popover-row': 'openFormView',
      'keydown .csui-searchforms-popover-row': 'openFormView'
    },

    constructor: function SearchFormsItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },

    openFormView: function (event) {
      event.preventDefault();
      event.stopPropagation();

      var model = this.model,
          params = model.get('params') || {};
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
        if (model.get('type') === 'quick') {
          // SVF-557 Include the search from here nodeId in query based on the
          // searchFromHere option
          params.location_id1 = "";
          var originatingView = this.options.originatingView;
          if (originatingView.options && originatingView.options.data) {
            // The search from here checkbox state is in the options.data
            if (originatingView.options.data.searchFromHere) {
              if (originatingView.searchOptions) {
                // Current folder is in the nodeId
                if (originatingView.searchOptions.nodeId) {
                  params.location_id1 = originatingView.searchOptions.nodeId;
                }
              }
            }
          }
          params.where = params.where || '*';
          this.options.originatingView.trigger('refine:search', event, params);
          // SVF-559 Do not show the search form for quick search
          return;
        } else if (this.model.get('type') === 'direct' && !!this.options.parentView &&
                   !!this.options.parentView.options && !!this.options.parentView.options.options &&
                   !!this.options.parentView.options.options.fromSearchBox) {
          //TODO: remove the above conditional logic later.
          _.extend(params, {
            forcePerspectiveChange: true,
            enableSearchForm: true
          });
          this.options.originatingView.trigger('refine:search', event, params);
          // SVF-559 Do not show the search form for quick search
          return;
        }
        if (this.$el.find('.csui-searchforms-popover-row').hasClass('binf-disabled')) {
          return;
        }
        this.$el.find('.csui-searchforms-popover-row').addClass('binf-disabled');
        var id = this.model.get('params') && this.model.get('params').query_id ?
                 this.model.get('params').query_id : this.model.get('id');

        if (!!this.options.originatingView.isModelFetched) {
          this.options.originatingView.isModelFetched(id);
        } else {
          this.options.originatingView.hideSearchOptionsDropDown(event);
          this.options.originatingView.searchForms.isModelFetched(id);
        }
        this.options.originatingView.searchFormsContainerView.$el.addClass('binf-hidden');
      } else if (event.type === 'keydown') {
        this._handleKeyEvents(event);
      }
    },

    _handleKeyEvents: function (event) {
      event.preventDefault();
      switch (event.keyCode) {
        case 9: //tab
          var searchFormContainerView = this.options.parentView.options.parentView,
              parentView = this.options.parentView;
          if (!event.shiftKey) {
            if (this.options.originatingView.$el.find('.csui-searchforms-show-more').length) {
              this.options.originatingView.$el.find('.csui-searchforms-show-more').focus();
            } else if (!!searchFormContainerView.personalSearchForms &&
              parentView.options.listName !== 'system_search_forms' &&
              (parentView.options.listName !== 'personal_search_forms')) {
              searchFormContainerView.personalSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.systemSearchForms && (parentView.options.listName !== 'system_search_forms')) {
              searchFormContainerView.systemSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else {
              var cancel = searchFormContainerView.options.originatingView.sidePanel.$el.find('[id = "csui-side-panel-cancel"]');
              cancel.addClass('active');
              setTimeout(function () {
                cancel.trigger('focus');
              },0);
            }
          } else if (event.shiftKey) {
            if (!!searchFormContainerView.personalSearchForms && (parentView.options.listName !== 'personal_search_forms')) {
              searchFormContainerView.personalSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.recentSearchForms && (parentView.options.listName !== 'recent_search_forms')) {
              searchFormContainerView.recentSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.recentSearchForms && (parentView.options.listName === 'recent_search_forms') ||
              !!searchFormContainerView.personalSearchForms && (parentView.options.listName === 'personal_search_forms') ||
              !!searchFormContainerView.systemSearchForms && (parentView.options.listName === 'system_search_forms')) {
              if (this.options.originatingView.sidePanel) {
                this.options.originatingView.sidePanel.$el.find('.csui-sidepanel-close').trigger('focus');
              } else {
                if (this.options.originatingView.$el.find('.csui-slices-more').length>0 && !this.options.originatingView.$el.find('.csui-slices-more').hasClass('binf-hidden')) {
                  this.options.originatingView.$el.find('.csui-slices-more')[0].focus();
                } else {
                  $(this.options.originatingView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
                  $(this.options.originatingView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
                }
              }
            } else if (this.options.originatingView.$el.find('.csui-selected-checkbox').length) {
                this.options.originatingView.$el.find('.csui-selected-checkbox').addClass('active');
                this.options.originatingView.$el.find('.csui-selected-checkbox input[type="checkbox"]').trigger('focus');
            } else {
              $(this.options.originatingView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
              $(this.options.originatingView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
            }
          }
          break;
        case 38: //up arrow
          if (this.$el.prev().length) {
            this.$el.removeClass('active');
            (this.$el.prev().addClass('active')).find('.csui-searchforms-popover-row')[0].focus();
          } else {
             var el = this.options.parentView.$el.find('.csui-searchforms-popover-row');
             el[el.length -1].focus();
          }
          break;
        case 40: //down arrow
          if (this.$el.next().length) {
            this.$el.removeClass('active');
            (this.$el.next().addClass('active')).find('.csui-searchforms-popover-row')[0].focus();
          } else {
            this.options.parentView.$el.find('.csui-searchforms-popover-row')[0].focus();
          }
          break;
        case 27: //escape
          var originatingViewOptions = this.options.originatingView &&
                                       this.options.originatingView.options,
              originatingView = originatingViewOptions && originatingViewOptions.originatingView;
          this.$el.removeClass('active');
          originatingView &&
          originatingViewOptions.options &&
          originatingViewOptions.options.data &&
          originatingViewOptions.options.data.showOptionsDropDown &&
          originatingView.hideSearchOptionsDropDown(event);
          break;
      }
    } 
  });
  return SearchFormsItemView;
});

csui.define('csui/widgets/search.forms/search.forms.list.view',['csui/lib/underscore', 'csui/lib/marionette3',
  'csui/widgets/search.forms/search.forms.item.view',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (_, Marionette, SearchFormsItemView) {
  'use strict';
  var SearchFormsListView = Marionette.CollectionView.extend({
    className: 'csui-search-form-list',
    childView: SearchFormsItemView,
    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this,
      };
    },
    constructor: function SearchFormsListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
  });
  return SearchFormsListView;
});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.forms/impl/search.forms.container',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <nav aria-labelledby='recent_search_forms_header'>\r\n    <h2 id='recent_search_forms_header'\r\n        class='csui-search-label "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"skipHeading") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":33},"end":{"line":4,"column":72}}})) != null ? stack1 : "")
    + "'>\r\n      "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"labels") : depth0)) != null ? lookupProperty(stack1,"recentSearchFormsLabel") : stack1), depth0))
    + "\r\n    </h2>\r\n    <div id='recent_search_forms' class=\"csui-recent-search-form-container\"></div>\r\n  </nav>\r\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " binf-hidden ";
},"4":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-more-forms\">\r\n    <a href=\"javascript:void(0)\" role=\"button\" class=\"csui-searchforms-show-more\"\r\n       data-searchformid=\"loadAllForms\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMoreAria") || (depth0 != null ? lookupProperty(depth0,"showMoreAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMoreAria","hash":{},"loc":{"start":{"line":14,"column":52},"end":{"line":14,"column":68}}}) : helper)))
    + "\">\r\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMorelabel") || (depth0 != null ? lookupProperty(depth0,"showMorelabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMorelabel","hash":{},"loc":{"start":{"line":15,"column":6},"end":{"line":15,"column":23}}}) : helper)))
    + "</a>\r\n  </div>\r\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <nav aria-labelledby='personal_search_forms_header'>\r\n    <h2 id='personal_search_forms_header'\r\n        class='csui-search-label'>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"labels") : depth0)) != null ? lookupProperty(stack1,"personalSearchFormsLabel") : stack1), depth0))
    + "</h2>\r\n    <div id='personal_search_forms' class=\"csui-personal-search-form-container\"></div>\r\n  </nav>\r\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <nav aria-labelledby='system_search_forms_header'>\r\n    <h2 id='system_search_forms_header'\r\n        class='csui-search-label'>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"labels") : depth0)) != null ? lookupProperty(stack1,"systemSearchFormsLabel") : stack1), depth0))
    + "</h2>\r\n    <div id='system_search_forms' class=\"csui-system-search-form-container\"></div>\r\n  </nav>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"searchForms") : depth0)) != null ? lookupProperty(stack1,"recent_search_forms") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":9,"column":7}}})) != null ? stack1 : "")
    + "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showMore") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":11,"column":0},"end":{"line":17,"column":7}}})) != null ? stack1 : "")
    + "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"searchForms") : depth0)) != null ? lookupProperty(stack1,"personal_search_forms") : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":0},"end":{"line":25,"column":7}}})) != null ? stack1 : "")
    + "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"searchForms") : depth0)) != null ? lookupProperty(stack1,"system_search_forms") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"loc":{"start":{"line":27,"column":0},"end":{"line":33,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_search.forms_impl_search.forms.container', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.forms/search.forms.container.view',['csui/lib/backbone', 'csui/lib/underscore', 'csui/lib/marionette3',
  'csui/widgets/search.forms/search.forms.list.view',
  'hbs!csui/widgets/search.forms/impl/search.forms.container',
  'i18n!csui/widgets/search.forms/impl/nls/lang',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (Backbone, _, Marionette, SearchFormsListView, SearchFormsContainerTemplate, lang) {
  'use strict';
  var SearchFormsContainerView = Marionette.View.extend({
    className: 'csui-search-form-collection',
    template: SearchFormsContainerTemplate,
    templateContext: function () {
      return {
        searchForms: this.options.searchFormsList,
        labels: lang,
        showMore: !!this.options.showMore,
        skipHeading: !!this.options.hasQuickSearches && !!this.options.fromSearchBox,
        showMorelabel: this.options.searchFormsList.recent_search_forms.length ? lang.showMore :
                       lang.searchFormLabel,
        showMoreAria: this.options.searchFormsList.recent_search_forms.length ?
                      lang.showMoreSearchFormsAria : lang.openSearchFormsAria
      };
    },

    regions: function () {
      var regions = {};
      _.each(this.options.searchFormsList, function (list, searchFormId) {
        regions[searchFormId] = '#' + searchFormId;
      });
      return regions;
    },

    constructor: function SearchFormsContainerView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    onRender: function () {
      _.each(this.options.searchFormsList, _.bind(function (list, region) {
        var collection = this._createCollection(list);
        if (collection.length) {
          if (region === 'recent_search_forms') {
            collection = !!this.options.hasQuickSearches ? collection :
                         new Backbone.Collection(collection.filter(function (model) {
                           return model.get('type') !== 'quick';
                         }));
            this.recentSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.recentSearchForms);
          } else if (region === 'system_search_forms') {
            this.systemSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.systemSearchForms);
          } else if (region === 'personal_search_forms') {
            this.personalSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.personalSearchForms);
          }
        }
      }, this));
    },

    _createListView: function (collection, region) {
      var listView =new SearchFormsListView({
                          options: this.options,
                          originatingView: this.options.originatingView,
                          collection: collection,
                          listName: region,
                          parentView: this
                        });
      return listView;
    },

    _createCollection: function (list) {
      var model,
          collection = new Backbone.Collection();
      _.each(list, function (item) {
        model = new Backbone.Model(item);
        collection.add(model);
      });
      return collection;
    },
  });
  return SearchFormsContainerView;
});
csui.define('csui/widgets/search.box/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.box/impl/nls/root/lang',{
  placeholder: 'Search',
  clearerTitle: 'Clear keywords',
  searchBoxTitle: 'Enter your search term',
  searchOptionsTitle: 'Show search options',
  searchOptionsHideTitle: 'Hide search options',
  searchFromHere: 'Search from here',
  searchIconTitle: 'Search',
  searchIconAria: 'Search in Content Server',
  searchOptionTooltip: 'Select: {0}',
  startSearch: 'Start search',
  searchLandmarkAria: 'Global content search',
  searchWithinLabel : 'Search within',
  showMore:'Show more',
  showMoreAria:'Show more slices',
  closeSearch: 'Close search'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.box/impl/search.box',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"csui-search-options-dropdown binf-hidden\" >\r\n        <div class=\"csui-search-options-wrapper\"></div>\r\n        </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"search-bar\" role=\"dialog\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchLandmarkAria") : stack1), depth0))
    + "\" aria-expanded=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"showOptionsDropDown") : stack1), depth0))
    + "\">\r\n  <div class=\"search-bar-content\">\r\n    <div class=\"csui-search-input-container\">\r\n      <input type=\"search\" class=\"csui-input\" placeholder=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"placeholder") : stack1), depth0))
    + "\"\r\n             title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchBoxTitle") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchBoxTitle") : stack1), depth0))
    + "\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"showOptionsDropDown") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":6,"column":6},"end":{"line":10,"column":13}}})) != null ? stack1 : "")
    + "    </div>\r\n    <span class=\"csui-clearer formfield_clear\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"clearerTitle") : stack1), depth0))
    + "\"\r\n          aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"clearerTitle") : stack1), depth0))
    + "\" role=\"button\"></span>\r\n    <span class=\"csui-separator\"></span>\r\n    <span class=\"csui-formfield-search formfield_search\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"startSearchTitle") : stack1), depth0))
    + "\"\r\n          aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"startSearchTitle") : stack1), depth0))
    + "\" role=\"button\"></span>\r\n  </div>\r\n</div>\r\n<div role=\"search\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchLandmarkAria") : stack1), depth0))
    + "\" class=\"search-icon\">\r\n  <a href=\"javascript:void(0);\"\r\n     class=\"icon icon-global-search icon-header-search csui-header-search-icon csui-acc-focusable\"\r\n     title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchIconTitle") : stack1), depth0))
    + "\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchIconAria") : stack1), depth0))
    + "\"\r\n     aria-expanded=\"false\"></a>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_search.box_impl_search.box', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.box/impl/search.slices.popover',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-search-popover-row\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\"\r\n         title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceTooltip") : depth0), depth0))
    + "\" role=\"radio\" aria-checked=\"false\" tabindex=\"-1\">\r\n      <div class=\"csui-search-popover-row-body\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\">\r\n        <div class=\"csui-search-popover-checked\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\" id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\"></div>\r\n        <div class=\"csui-search-popover-label\" data-sliceid=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceId") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"sliceDisplayName") : depth0), depth0))
    + "</div>\r\n      </div>\r\n    </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-slice-container\" role=\"radiogroup\">\r\n  <div class=\"csui-search-slice-container-first\" role=\"presentation\"></div>\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"slices") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":3,"column":2},"end":{"line":11,"column":11}}})) != null ? stack1 : "")
    + "  <div class=\"csui-search-slice-container-last\" role=\"presentation\"></div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_search.box_impl_search.slices.popover', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.box/impl/search.slice.dropdown',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-selected-checkbox csui-slice-checkbox csui-checkbox-primary csui-searchbox-dd-panel\" >\r\n  <label class=\"csui-search-slice-name csui-selectlabel\" for=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeIdSO") : depth0), depth0))
    + "\"\r\n          title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"fromHere") : depth0), depth0))
    + " "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeName") : depth0), depth0))
    + "\">\r\n    <input type=\"checkbox\" "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"checked") || (depth0 != null ? lookupProperty(depth0,"checked") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"checked","hash":{},"loc":{"start":{"line":5,"column":27},"end":{"line":5,"column":38}}}) : helper)))
    + " aria-checked=\"true\"  class=\"csui-searchbox-option\" name=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeId") : depth0), depth0))
    + "\" id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeIdSO") : depth0), depth0))
    + "\"\r\n           tabindex=\"-1\" value=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeId") : depth0), depth0))
    + "\">\r\n      <span class=\"csui-icon\"></span>\r\n      <span class=\"csui-ellipsis\" aria-hidden=\"true\" >"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"fromHere") : depth0), depth0))
    + " "
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"nodeName") : depth0), depth0))
    + "</span>\r\n  </label>\r\n  </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-searchbox-slices-wrapper csui-searchbox-dd-panel\">\r\n    <fieldset>\r\n      <legend class=\"csui-search-label\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"searchWithinLabel") : stack1), depth0))
    + "</legend>\r\n      <div class=\"csui-search-slice-region\" ></div>\r\n    </fieldset>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"more") : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":4},"end":{"line":24,"column":11}}})) != null ? stack1 : "")
    + "  </div>\r\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"csui-slices-more\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"showMoreAria") : stack1), depth0))
    + "\" tabindex=\"-1\" >\r\n        <span  class=\"csui-more-text\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"slices") : depth0)) != null ? lookupProperty(stack1,"showMore") : stack1), depth0))
    + "</span>\r\n       <span class=\"csui-button-icon icon-caret-down\"></span>\r\n    </button>\r\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"csui-searchbox-searchform-wrapper csui-searchbox-dd-panel\">\r\n    <div class=\"csui-recent-searchforms-container\" >\r\n    </div>\r\n  </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"nodeId") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":11,"column":7}}})) != null ? stack1 : "")
    + "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"slices") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":13,"column":0},"end":{"line":26,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"search_forms") : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"loc":{"start":{"line":27,"column":0},"end":{"line":32,"column":7}}})) != null ? stack1 : "")
    + "\r\n";
}});
Handlebars.registerPartial('csui_widgets_search.box_impl_search.slice.dropdown', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/search.box/impl/search.box',[],function(){});
csui.define('csui/widgets/search.box/search.box.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/lib/backbone',
  'csui/models/node/node.model', 'csui/utils/contexts/factories/search.box.factory',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/namedlocalstorage',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/search.slices/search.slices.list.view',
  'csui/widgets/search.forms/search.forms',
  'csui/widgets/search.forms/search.forms.container.view',
  'csui/utils/contexts/factories/next.node',
  'i18n!csui/widgets/search.box/impl/nls/lang',
  'csui/utils/namedsessionstorage',
  'hbs!csui/widgets/search.box/impl/search.box',
  'hbs!csui/widgets/search.box/impl/search.slices.popover',
  'hbs!csui/widgets/search.box/impl/search.slice.dropdown', 'i18n', 'csui/utils/base',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'css!csui/widgets/search.box/impl/search.box',
  'csui/lib/jquery.ui/js/jquery-ui', 'csui/lib/binf/js/binf'
], function (module, _, $, Marionette, Backbone, NodeModel, SearchBoxFactory,
  SearchQueryModelFactory, ApplicationScopeModelFactory, NamedLocalStorage,
  TabableRegionBehavior, SearchSlicesListView,  SearchForms, SearchFormsContainerView,NextNodeModelFactory,
  lang, NamedSessionStorage, template,
  SlicePopOverTemplate, SliceDropDownTemplate, i18n, base, PerfectScrollingBehavior) {
  "use strict";

  var config = _.defaults({}, module.config(), {
    showOptionsDropDown: true,
    showSearchInput: false,
    showInput: false,
    inputValue: '',
    slice: '',
    nodeId: '',
    nodeName: '',
    searchFromHere: true,
    enableSearchBarSettings: true,
    customSearchIconClass: "icon-header-search",
    customSearchIconNoHoverClass: "icon-header-search-nohover",
    customSearchIconCloseClass: "icon-header-search_close"
  });

  var SearchBoxView = Marionette.ItemView.extend({
    className: 'csui-search-box',
    template: template,
    templateHelpers: function () {
      var messages = {
        showOptionsDropDown: this.options.data.showOptionsDropDown,
        placeholder: this.options.data.placeholder || lang.placeholder,
        clearerTitle: lang.clearerTitle,
        startSearchTitle:  lang.startSearch,
        searchIconTitle: lang.searchIconTitle,
        searchIconAria: lang.searchIconAria,
        searchBoxTitle: lang.searchBoxTitle,
        searchOptionsTitle: lang.searchOptionsTitle,
        startSearch: lang.startSearch,
        searchLandmarkAria: lang.searchLandmarkAria
      };
      return {
        messages: messages
      };
    },
    slicePopOverTemplate: SlicePopOverTemplate,
    sliceDropDownTemplate: SliceDropDownTemplate,
    namedSessionStorage: new NamedSessionStorage(),
    ui: {
      input: '.csui-input',
      clearer: '.csui-clearer',
      formfieldSearch: '.csui-formfield-search',
      innerSeparator: '.csui-separator',
      searchIcon: '.csui-header-search-icon',
      dropDown: '.csui-search-options-dropdown',
      dropDownWrapperClass : '.csui-search-options-wrapper'
    },
    events: {
      'click @ui.searchIcon': 'searchHeaderIconClicked',
      'keydown .csui-header-search-icon': 'searchIconKeyPressed',
      'click @ui.input': 'inputClicked',
      'keydown @ui.input': 'inputTyped',
      'keyup @ui.input': 'inputChanged',
      'paste @ui.input': 'inputChanged',
      'change @ui.input': 'inputChanged',
      'click @ui.clearer': 'clearerClicked',
      'click @ui.formfieldSearch': 'formfieldSearchClicked',
      'click .csui-searchbox-option': 'selectSearchOption',
      'keydown @ui.clearer': 'keyDownOnClear',
      'keydown @ui.formfieldSearch': 'keyDownOnFormfieldSearch',
      'keydown .csui-selected-checkbox': 'accessibility',
      'keyup .csui-selected-checkbox': 'keyUpHandler',
      'keyup .csui-slices-more': 'keyUpHandler',
      'keydown .csui-slices-more': '_handleSlicesShowMore',
      'click .csui-slices-more': 'showMore',
      'click .csui-searchforms-show-more': 'openSearchForm',
      'keydown .csui-searchforms-show-more': 'openSearchForm',
      'focus @ui.input': 'focusedOnSearchInput'
    },

    currentlyFocusedElement: function (arg) {
      if (this.$el) {
        var focusables = this.$el.find('*[data-cstabindex=-1]');
        if (focusables.length) {
          focusables.prop('tabindex', 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (!shiftKey && this.$el.find(".search-bar").length &&
            this.$el.find(".search-bar").is(":visible")) {
          this.focusElement = this.$el.find('.csui-input');
          this.skipShowingDropdown = true;
        } else if (this.$el.find('a.csui-acc-focusable').length) {
          this.focusElement = this.$el.find('a.csui-acc-focusable');
        }
      }
      return this.focusElement;
    },
     
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-search-options-wrapper',
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    namedLocalStorage: new NamedLocalStorage('search_bar_settings'),

    constructor: function SearchBoxView(options) {
      options || (options = {});
      options.data = _.defaults({}, options.data, config);
      this.direction = i18n.settings.rtl ? 'left' : 'right';

      var context = options.context;
      if (!options.model) {
        options.model = context.getModel(SearchQueryModelFactory);
      }
      this.applicationScope = context.getModel(ApplicationScopeModelFactory);

      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.listenTo(this.model, 'change:where', this._updateInput);

      // Enable pre-fetching from /app, which sets the initial
      // response via the context model factory.
      this.searchBoxFactory = context.getFactory(SearchBoxFactory);
      this.searchboxModel = this.searchBoxFactory.property;

      if (this.options.data.showOptionsDropDown) {
        this.listenTo(context, 'sync:perspective', this._perspectiveSynced);
        this.listenTo(context, 'change:current:node', this._currentNodeChanged);
        this.listenTo(this.searchboxModel, "change", this.prepareOptionsdropdown);
        this.listenTo(this.searchboxModel, "change", this.prepareSlicePopover);
        this.listenTo(this.searchboxModel, "change", this.prepareSearchFormsPopover);
        this.listenTo(this, "refine:search", this._refineSearch);
      }

      if (this.options.data.enableSearchBarSettings) {
        this.listenTo(this.searchboxModel, "change", this.updateSearchBarSettings);
      }

      if (!!this.model.get("where") || this.options.data.showSearchInput) {
        $(document).on('click.' + this.cid + ' keydown.' + this.cid, this, this._hideSearchBar);
      }
      $(document).on('keydown.' + this.cid, this, this._shortcutToQuery);

      this.searchForms = new SearchForms({
        options: this.options,
        connector: this.searchboxModel && this.searchboxModel.connector,
        originatingView: this
      });
    },

    _refineSearch: function(event, params) {
      this.model.clear({silent: true});
      this.model.set(params);
      this.hideSearchOptionsDropDown(event);
    },

    updateSearchBarSettings: function () {
      this.search_bar_settings = this.searchboxModel.get('search_bar_settings');
      if (this.search_bar_settings && this.search_bar_settings.full_text) {
        this.namedLocalStorage.set('full_text', this.search_bar_settings.full_text);
        if (!!this.model) {
          var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
          this.model.set('modifier', full_text.modifier, {silent: true});
          this.model.set('lookfor', full_text.lookfor, {silent: true});
        }
      }
    },

    _shortcutToQuery: function (event) {
      // CTRL+F3: shortcut to Query/Search
      if (event.ctrlKey && event.keyCode == 114) {
        var self = event.data;
        if (self.isSearchInputVisible()) {
          self.ui.input.trigger('focus');
        } else {
          self.searchIconClicked(event);
        }
      }
    },

    onBeforeDestroy: function () {
      $(document).off('click.' + this.cid).off('keydown.' + this.cid);
    },

    isSearchbarVisible: function () {
      return this.$('.search-bar').is(':visible');
    },

    isSearchInputVisible: function () {
      return this.$('.csui-input').is(':visible');
    },

    handleKeydownNavbar: function (event) {
      var allFocusableElements = $('.csui-navbar.binf-navbar .binf-container-fluid')
        .find("*[tabindex]:visible").toArray();
      var elements = allFocusableElements.unshift(this.$el);
      if (document.activeElement === allFocusableElements[elements - 1]) {
        $(document).find('.csui-help .csui-acc-tab-region').trigger('focus');
      }
      // TODO: check why focus is not going on help 
    },

    _perspectiveSynced: function (context, perspectiveSource) {
      this._currentNodeChanged(perspectiveSource);
    },

    _currentNodeChanged: function (currentNode) {
      if (currentNode instanceof NodeModel &&
        currentNode.get('container')) {
        this.searchboxModel.nodeId = currentNode.get('id');
        this.searchboxModel.nodeName = currentNode.get('name');
        this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
        this.searchboxModel.trigger("change");
      } else {
        this.searchboxModel.nodeId = undefined;
        this.searchboxModel.nodeName = undefined;
        this.searchboxModel.trigger("change");
      }
    },

    _dataSynced: function (context, perspectiveSource) {
      if (this.searchboxModel) {
        if ((this.options.data && this.options.data.alwaysFetchDropdown) || !(this.searchboxModel && this.searchboxModel.fetched)) {
          this.searchBoxFactory.fetch();
        }
      }
    },

    onRender: function (event) {
      if (this.options.data.showSearchInput) {
        this.$el.find(".search-bar").show();
        this.searchIconToClose();
      }
      var value = this.options.data.inputValue || this.model.get('where');
      this.slice = this.options.data.slice || this.model.get('slice');
      if (value) {
        this._setInputValue(value);
        this.$el.find(".search-bar").show();
      }
      if (this.options.data.showInput || value) {
        this.triggerMethod('before:show:input', this);
        this.ui.input.show();
        this.triggerMethod('show:input', this);
      }

      if (event && event.data) {
        this.$el.find('.csui-search-box .csui-header-search-icon').removeClass(
          event.data.options.data.customSearchIconCloseClass).addClass(
            event.data.options.data.customSearchIconClass);
      }

    },

    _createSliceCollection: function (list) {
      var model,
        collection = new Backbone.Collection();
      _.each(list, function (item) {
          model = new Backbone.Model({
            sliceId: item.sliceId,
            sliceDisplayName: item.sliceDisplayName,
            sliceTooltip: item.sliceTooltip
          });
          collection.add(model);
      });
      return collection;
    },

    prepareSlicePopover: function (e) {
      var slices = this.searchboxModel.get('slices'),
        collection = slices && slices.length > 3 ? this._createSliceCollection(slices.slice(0, 3)) : this._createSliceCollection(slices);
      if (this.options.data.showOptionsDropDown) {
        if (slices) {
          _.each(slices, function (slice) {
            var sliceDisplayName = slice.sliceDisplayName;
            slice.sliceTooltip = _.str.sformat(lang.searchOptionTooltip, sliceDisplayName);
          });
          if (!this.searchSlicesListView) {
            this.searchSlicesListView = new SearchSlicesListView({
              originatingView: this,
              collection: collection
            });
          }
        }
        if ($('.search-bar').is(':visible')) {
          $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
        }
      }
    },

    showSlices: function () {
      if (!!this.searchSlicesListView) {
        this.searchSlicesRegion = new Marionette.Region({ el: '.csui-search-slice-region' });
        //TODO: need to remove  this.searchFormsRegion.$el.length null check once the jasmine testcases are refactored
        this.searchSlicesRegion.$el.length && this.searchSlicesRegion.show(this.searchSlicesListView);
        this.searchSlicesListView.getSelectedSlice();
      }
    },

    prepareSearchFormsPopover: function () {
      var searchForms       = this.searchboxModel.get('search_forms'),
          recentSearchForms = searchForms && searchForms.recent_search_forms || [];

      var hasQuickSearches = _.findIndex(recentSearchForms, {type: 'quick'}) !== -1;
      this.searchFormsContainerView = new SearchFormsContainerView({
        searchFormsList: {
          recent_search_forms: recentSearchForms.slice(0, 5)
        },
        originatingView: this,
        showMore: true,
        hasQuickSearches: hasQuickSearches,
        fromSearchBox: true
      });
    },

    showSearchForms: function () {
      if (this.$el.hasClass('csui-search-expanded') && this.searchFormsContainerView && !this.searchFormsContainerView._isRendered) {
        this.searchFormsRegion = new Marionette.Region({el: '.csui-recent-searchforms-container'});
        this.searchFormsRegion.$el.length  && this.searchFormsRegion.show(this.searchFormsContainerView);
      }
    },

    accessibility: function (event) {
      this.$el.find('.csui-selected-checkbox')
        .attr('tabindex', '0').removeClass('active');
      switch(event.keyCode){
        case 13: this.selectSearchOption(event);
        event.preventDefault();
        break;
        case 32: this.selectSearchOption(event);
        event.preventDefault();
        break;
        case 27:  this.$el.find('.csui-selected-checkbox').attr('tabindex', '-1');
        this.$el.find('.active').removeClass('active');
        if (this.options.data.showOptionsDropDown) {
          this.hideSearchOptionsDropDown(event);
        }
        break;
        case 9:  if (event.shiftKey) {
          this.ui.input[0].focus();
         } else {
          var slices = this.$el.find('.csui-search-popover-row-body');
          $(slices[0]).addClass('active');
          $(slices[0]).find('input[type="radio"]')[0].focus();
         }
         event.preventDefault();
         break;
      }
    },

    // supress bubbling of keyup space  event to document when tried to  toggle  checkbox on firefox browser
    keyUpHandler: function (event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    },

    hidePopover: function (event) {
      if (this.options.data.showOptionsDropDown) {
        this.$el.find('.csui-selected-checkbox').attr('tabindex', '-1');
        this.$el.find('.active').removeClass('active');
        this.showOptionsDropdown(event);
      }
    },

    resetPageDefaults: function (event) {
      this.model.resetDefaults = true;
    },

    searchIconKeyPressed: function (event) {
      if (event.keyCode === 32) {
        event.preventDefault();
        this.searchIconClicked(event);
      }
    },

    searchHeaderIconClicked: function (event) {
      if ($('.search-bar').is(':visible')) {
        this._hideSearchBar(event);
        this._hideSearchPanel(event);
      } else {
        this.searchIconToClose();
        this.searchIconClicked(event);
      }
      var parentView = this.options && this.options.parentView;
      parentView && parentView.listenToOnce(parentView, "control:clicked", _.bind(function() {
        if ($('.search-bar').is(':visible')) {
          this._hideSearchBar(event);
          this._hideSearchPanel(event);
        }
      }, this));
    },

    /**
     * This method executes when the focus is set within search input field.
     * In general, search input field opens when user clicks on search icon, then it opens the
     * search input field and showing drop-down is happening from this point, not when the focus
     * is set in search input field which is already in open state. This method shows the
     * dropdown if explict focus event happened on this search input field.
     *
     * @param event
     * @param skip
     */
    focusedOnSearchInput: function (event) {
      if (this.skipShowingDropdown || this._isDropdownVisible()) {
        this.skipShowingDropdown = false;
        return;
      } else {
        event.preventDefault();
        this._dataSynced();
        this.$el.addClass('csui-search-expanded');
        this.ui.input.prop('tabindex', 0);
        this.$el.addClass('csui-searchbox-ready');
        if (!(this.searchboxModel && this.searchboxModel.fetched)) {
          this.listenTo(this.searchboxModel, "change", function () {
            this.showSearchForms();
            this.showSlices();
            if (document.querySelector('.csui-search.search-input-open') &&
                this.applicationScope.get('id') !== 'search'
                && $(document.activeElement)[0] === this.ui.input[0]) {
              this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
            }
          });

          this._updateInput();

          if (this.options.data.showOptionsDropDown) {
            if (!this.searchboxModel.get('slices')) {
              this.prepareSlicePopover();
            }
            if (!this.searchboxModel.get('search_forms_slice')) {
              this.prepareSearchFormsPopover();
            }
          }
        } else {
          this.showSearchForms();
          this.showSlices();
          this.closeDropdown = false;
          if ($(document.activeElement)[0] === this.ui.input[0]) {
            this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
          }
        }
      }
    },

    searchIconClicked: function (event) {
      this._dataSynced();
      this.$el.parent().addClass("search-input-open");
      this.ui.searchIcon.attr('aria-expanded', 'true');
      // TODO: Need to handle click events on csui controls.
      var searchBoxOptions = this.$el.find('.csui-searchbox-option')[0];
      $(document).on('click.' + this.cid + ' keydown.' + this.cid, this, this._hideSearchBar);
      this.resetPageDefaults(event);
      if (this.options.data.showOptionsDropDown && !!searchBoxOptions) {
        this.searchboxModel.nodeId !== undefined ?
          (this.$el.find('.csui-searchbox-option')[0].checked = this.options.data.searchFromHere) :
          "";
      }
      if ($('.search-bar').is(':visible')) {
        var value = this.ui.input.val().trim();
        if (!!value) {
          this._setInputValue(value);
          $(event.currentTarget).attr("title", lang.startSearch);
          $(event.currentTarget).attr("aria-label", lang.startSearch);
          this.trigger("hide:breadcrumbspanel");
        }
        var searchOption = "",
          _selOption = this.$el.find(".csui-searchbox-option.selected");
        if (this.options.data.showOptionsDropDown) {
          if (!!_selOption) {
            searchOption = _selOption.val();
          }
        } else {
          searchOption = this.options.data.nodeId;
        }

        if (!!history.state && !!history.state.search) {
          this.previousState = history.state.search;
        }
        if (!!value) {
          this._setSearchQuery(value, this.options.sliceString, searchOption, event);
          this._updateInput();
          if (!this.options.data.searchFromHere) {
            $(this.ui.dropDown).addClass('csui-selected-checkbox-hidden');
          }
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown(event);
          }
          this.options.data.searchFromHere = true;

        }
        if (!!this.previousState) {
          this.model["prevSearchState"] = this.previousState;
        }
      } else {
        this.$el.addClass('csui-search-expanded');
        base.onTransitionEnd(this.$el.parent(), function () {
          if (this.isDestroyed) {
            return;
          }
          this.skipShowingDropdown = true;
          this.ui.input.trigger('focus');
          this.ui.input.prop('tabindex', 0);
          this.$el.addClass('csui-searchbox-ready');
          if (!(this.searchboxModel && this.searchboxModel.fetched)) {
            this.listenTo(this.searchboxModel, "change",function () {
              this.showSearchForms();
              this.showSlices();
              if (document.querySelector('.csui-search.search-input-open') &&
                  this.applicationScope.get('id') !== 'search'
                  && $(document.activeElement)[0] === this.ui.input[0]) {
                this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
              }
            });
          } else {
            this.showSearchForms();
            this.showSlices();
            this.closeDropdown = false;
            if ($(document.activeElement)[0] === this.ui.input[0]) {
              this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
            }
          }
        }, this);
        this._updateInput();
        $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
        if (this.options.data.showOptionsDropDown) {
          if (!this.searchboxModel.get('slices')) {
            this.prepareSlicePopover();
          }
          if (!this.searchboxModel.get('search_forms_slice')) {
            this.prepareSearchFormsPopover();
          }
        }
        if (this.model.attributes.where === "") {
          event.currentTarget.title = "";
          $(event.currentTarget).addClass(this.options.data.customSearchIconNoHoverClass);
        }
      }
    },

    inputTyped: function (event) {
      var value = this.ui.input.val().trim();
      if (event.which === 13) {
        event.preventDefault();
        event.stopPropagation();
        this._setInputValue(value);
        if (!!value) {
          this.closeDropdown = true;
          this.searchIconClicked(event);
        } else {
          this.closeDropdown = false;
        }
        if (this.previousValue != value) {
          this.previousValue = value;
        }
      } else if (event.which === 27) {
        event.preventDefault();
        event.stopPropagation();
        this._hideSearchPanel(event);        
      } else {
        this.closeDropdown = false;
        if (event.which === 9 && this._isDropdownVisible() && !event.shiftKey) {
          if (this.$el.find('.csui-selected-checkbox').is(':visible')) {
            this.$el.find('.csui-selected-checkbox').attr('tabindex', '0').addClass('active');
            this.$el.find('.csui-selected-checkbox input[type="checkbox"]')[0].focus();
          } else {
            var slices = this.$el.find('.csui-search-popover-row-body');
            $(slices[0]).addClass('active');
            $(slices[0]).find('input[type="radio"]').trigger('focus');
          }
          event.preventDefault();
        }
        else if (event.shiftKey && event.key === 'Tab') {
          this.$el.find('.active').removeClass('active');
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown(event);
          }
        }
        else {
          this.inputChanged(event);
        }
      }
    },

    inputChanged: function (event) {
      var value = this.ui.input.val();
      this.ui.clearer.prop('tabindex', value !== '' ? 0 : -1);
      this.ui.formfieldSearch.prop('tabindex', value !== '' ? 0 : -1);
      this.ui.clearer.toggle(!!value.length);
      this.ui.innerSeparator.toggle(!!value.length);
      this.ui.formfieldSearch.toggle(!!value.length);
      if (event.keyCode === 13 && !!value) {
        if (!!value) {
          this.closeDropdown = true;
        } else {
          this.closeDropdown = false;
        }
      }
      if (this.options.data.showOptionsDropDown) {
        this.showOptionsDropdown(event);
      }
    },

    inputClicked: function (event) {
      if (!!this.closeDropdown) {
        this.closeDropdown = false;
      }
      this.hidePopover(event);
    },

    showOptionsDropdown: function (event) {
      this.hideBackButton = true;
      if (!this._isDropdownVisible()) {
        if (this.options.data.showOptionsDropDown) {
          var _e = event || window.event,
            slices = this.getSlices(),
            collection = slices && slices.length > 3 ? this._createSliceCollection(slices.slice(0, 3)) : this._createSliceCollection(slices);
          // If node is available, then show "search from here" dropdown.
          // If searching inside a container, show dropdown.
          if (!this.searchboxModel.nodeId || (this.applicationScope.get('id') === 'search' &&
            $(this.ui.dropDown).hasClass('csui-selected-checkbox-hidden'))) {
            this.$el.find('.csui-selected-checkbox').addClass('binf-hidden');
            $(this.ui.dropDown).addClass('csui-selected-checkbox-hidden');
          } else {
            $(this.ui.dropDown).removeClass('csui-selected-checkbox-hidden');
          }
          if (_e.keyCode !== 27 && (!this.closeDropdown)) {
            $(this.ui.dropDown).removeClass('binf-hidden');
            if (this.$el.find('.csui-selected-checkbox').is(':visible')) {
              this.$el.find('.csui-searchbox-option')[0].checked = this.options.data.searchFromHere;
            }
            if (!$(document.body).hasClass('binf-modal-open')) {
              $(document.body).addClass('binf-search-box-open');
              $(document).find('.csui-navbar.binf-navbar').addClass('masked');
              if (!$(document).find('.search-box-widget-mask').length) {
                var compositeMask =  document.createElement('div');
                compositeMask.className = 'search-box-widget-mask';
                $(document.body).find('.binf-widgets').append(compositeMask);
              }
              $(document).find('.csui-navbar.binf-navbar').on(' keydown.',this.handleKeydownNavbar);
            }
          }
          if (this.options.data.searchFromHere) {
            this.$el.find('.csui-searchbox-option').addClass('selected');
            this.$el.find('.csui-icon').addClass('icon-listview-checkmark');
            this.$el.find('.csui-icon').addClass('icon-checkbox-selected');
          }
          if (slices) {
            if (this.searchboxModel.get('slices').more) {
              this.$el.find('.csui-slices-more').removeClass('binf-hidden');
            }
            this.searchSlicesListView = new SearchSlicesListView({
              originatingView: this,
              collection: collection
            });
          }
          if (this.$el.find('.csui-search-form-collection').length) {
            this.$el.find('.csui-search-form-collection').removeClass('binf-hidden');
          }
          this.showSearchForms();
          this.showSlices();
        }
      }
      this.ui.dropDownWrapperClass.scrollTop(this.ui.dropDownWrapperClass.position().top);
      this.trigger('ensure:scrollbar');
    },

    prepareOptionsdropdown: function (e) {
      if (this.options.data.showOptionsDropDown) {
        // Fetch nodeid when _perspectiveSynced() is not called
        if (!this.searchboxModel.nodeId) {
          var currentNode = _.has(this.options, 'context') && this.options.context.getModel(NextNodeModelFactory);
          if (currentNode && currentNode instanceof NodeModel &&
            currentNode.get('container')) {
            this.searchboxModel.nodeId = currentNode.get('id');
            this.searchboxModel.nodeName = currentNode.get('name');
            this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
          }
        }
        if (!this.searchboxModel.nodeId && this.model.get('location_id1')) {
          this.searchboxModel.nodeId = this.model.get('location_id1');
          if (!!this.namedSessionStorage.get(this.searchboxModel.nodeId)) {
            this.searchboxModel.nodeName = this.namedSessionStorage.get(this.searchboxModel.nodeId);
          }
        }
        this.searchOptions = {};
        if (this.searchboxModel.nodeId) {
          this.searchOptions.nodeId = this.searchboxModel.nodeId;
          this.searchOptions.nodeIdSO = _.uniqueId('csui-so-' + this.searchboxModel.nodeId);
          if (!this.searchboxModel.nodeName && this.options.data.nodeName) {
            this.searchboxModel.nodeName = this.options.data.nodeName;
          }
          if (this.searchboxModel.nodeName) {
            this.searchOptions.nodeName = " (" + this.searchboxModel.nodeName + ")";
          }
          this.searchOptions.select = lang.searchOptionsSelect;
          this.searchOptions.fromHere = lang.searchFromHere;
          this.searchOptions.checked = this.options.data.searchFromHere ? 'checked' : '';
        }
        if (!!this.searchboxModel.get('slices')) {
          this.searchOptions = _.extend(this.searchOptions, this.searchboxModel.attributes);
          this.searchOptions.slices.searchWithinLabel = lang.searchWithinLabel;
          this.searchOptions.slices.showMore = lang.showMore;
          this.searchOptions.slices.showMoreAria = lang.showMoreAria;
          this.searchOptions.slices.more = this.searchOptions.slices.length > 3 ? true : false;
        }
        // The dropdown should be available even if there are no slices
        var content = this.sliceDropDownTemplate(this.searchOptions);
        this.ui.dropDownWrapperClass.html(content);
        if (this.searchOptions.fromHere) {
          this.$el.find('.csui-searchbox-option').addClass('selected');
          this.$el.find('.csui-icon').addClass('icon-listview-checkmark icon-checkbox-selected');
          this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', true);
        }
      }
    },

    destroyOptionspopover: function (e) {
      // if node is not available destroy the search options dropdown
      this.ui.dropDown.html("");
      this.ui.dropDown.addClass('binf-hidden');
    },

    selectSearchOption: function (e) {
      if (e.type === "keydown" && (e.keyCode === 13 || event.keyCode === 32)) {
        this.$el.find('.csui-selected-checkbox').attr('tabindex', '0').addClass('active');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').trigger('focus');
      } else if (e.type === "click") {
        this.$el.find('.active').removeClass('active');
        this.$el.find('.csui-selected-checkbox')
          .attr('tabindex', '0').removeClass('active').trigger('focus');
      }
      if (!this.options.data.searchFromHere) {
        this.options.data.searchFromHere = true;
        this.$el.find('.csui-searchbox-option').addClass('selected');
        this.$el.find('.csui-icon').addClass('icon-listview-checkmark');
        this.$el.find('.csui-icon').addClass('icon-checkbox-selected');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', true);
      } else {
        this.options.data.searchFromHere = false;
        this.$el.find('.csui-searchbox-option').removeClass('selected');
        this.$el.find('.csui-icon').removeClass('icon-listview-checkmark');
        this.$el.find('.csui-icon').removeClass('icon-checkbox-selected');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', false);
      }
    },


    handleSelectCheckbox: function (e) {
      if (e.keyCode === 40) {
        var elms = this.$el.find('.csui-search-popover-row-body'),
          index = elms.index(elms.filter('.active'));
        index = (index >= 0) ? index : 0;
        $(elms[index]).attr('tabindex', 0);
        $(elms[index]).addClass('active');
        $(elms[index]).find('input[type="radio"]')[0].focus();
      }
    },

    hideSearchOptionsDropDown: function (event) {
      var that = this;
      if (that.$el.find('.csui-searchbox-option')[0] === document.activeElement) {
        return false;
      } else if (that.options.data.showOptionsDropDown) {
        var self = that;
        self.showSearchOptionDropDown(event);
        return true;
      }
    },

    showSearchOptionDropDown: function (event) {
      if (this.options.data.showOptionsDropDown) {
        if (!(this.ui.dropDown.is(":hover")) || event.type === 'click') {
          this.ui.dropDown && this.ui.dropDown.addClass('binf-hidden');
          if ($(document.body).hasClass('binf-search-box-open')) {
            $(document.body).removeClass('binf-search-box-open');
            $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
            $(document.body).find('.search-box-widget-mask').remove();
            $(document).find('.csui-navbar.binf-navbar').off(' keydown.', this.handleKeydownNavbar);
          }
        } else if (this.popoverTimer) {
          clearTimeout(this.popoverTimer);
        }
      }
    },

    keyDownOnClear: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.clearerClicked(event);
      }
    },
    clearerClicked: function (event) {
      event.preventDefault();
      event.stopPropagation();

      this._setInputValue('');
      this.hidePopover(event);
      this.ui.input.trigger('focus');
    },

    keyDownOnFormfieldSearch: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.formfieldSearchClicked(event);
      }
    },
    formfieldSearchClicked: function (event) {
      this.searchIconClicked(event);
    },

    _setSearchQuery: function (value, sliceString, searchOption, event) {
      this.model.clear({ silent: true });
      var params = {};
      if (!!sliceString) {
        params['slice'] = sliceString;
      }
      if (!!searchOption) {
        params['location_id1'] = searchOption;
      }
      if (value) {
        params['where'] = value;
      }
      //update search_bar_settings
      var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
      if (full_text && (full_text.modifier || full_text.lookfor)) {
        params['modifier'] = full_text.modifier;
        params['lookfor'] = full_text.lookfor;
      }
      this.model.set(params);
      //this.hidePopover(event);
    },

    getSlices: function () {
      var selectedSlice, slices,
          selectedSliceId = this.options.model && this.options.model.get("slice") ? this.options.model.get("slice") :
                            this.namedLocalStorage.get('selectedSlice');
      this.options.sliceString = selectedSliceId;
      if (selectedSliceId) {
        slices = _.filter(this.searchboxModel.get('slices'), function (item) {
          if (item.sliceId != selectedSliceId.substring(1, selectedSliceId.length - 1)) {
            return true;
          } else {
            selectedSlice = item;
          }
        });
      }
      else {
        slices = this.searchboxModel.get('slices');
      }
      selectedSlice && slices.unshift(selectedSlice);
      return slices;
    },

    showMore: function () {
      var collection = this._createSliceCollection(this.getSlices());
      this.searchSlicesListView = new SearchSlicesListView({
        originatingView: this,
        collection: collection
      });
      this.$el.find('.csui-slices-more').addClass('binf-hidden');
      this.showSlices();
      $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body input[type="radio"]')[3])[0].focus();
      this.trigger('ensure:scrollbar');
    },

    _handleSlicesShowMore: function (event) {
      switch (event.keyCode) {
        case 27:
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown();
          }
          break;
        case 32: this.showMore();
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[3]).addClass('active');
          break;
        case 13: this.showMore();
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[3]).addClass('active');
          break;
        case 9: if (event.shiftKey) {
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
        } else {
          if (this.searchFormsContainerView.$el.find('.csui-searchforms-popover-row').length) {
            this.searchFormsContainerView.$el.find('.csui-searchforms-popover-row')[0].focus();
          }
          else {
            this.searchFormsContainerView.$el.find('.csui-searchforms-show-more')[0].focus();
          }
        }
          break;
      }
      event.preventDefault();
    },

    openSearchForm: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
        if (this.$el.find('.csui-searchforms-popover-row').hasClass('binf-disabled')) {
          return;
        }
        this.$el.find('.csui-searchforms-popover-row').addClass('binf-disabled');
        this.hideSearchOptionsDropDown(event);
        var id = $(event.currentTarget).data("searchformid");
        if (id === "loadAllForms") {
          this.hideBackButton = false;
          this.searchForms.isKeyPress = event.keyCode === 13 || event.keyCode === 32;
          this.searchForms.openFormInSidepanel(this.searchboxModel.get('search_forms'));
        }
      } else if (event.keyCode === 9) {
        event.preventDefault();
        if (event.shiftKey) {
          if (this.$el.find('.csui-searchforms-popover-row').length) {
            var self = this;
            setTimeout(function () {
              self.$el.find('.csui-searchforms-popover-row')[0].focus();
            }, 0);
          } else if (!this.$el.find('.csui-slices-more').hasClass('binf-hidden')) {
            this.$el.find('.csui-slices-more').focus();
          } else if (this.$el.find('.csui-search-popover-row-body').length) {
            $(this.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
            $(this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0]).focus();
          } else if (this.ui.input) {
            this.ui.input.trigger('focus');
          }
        }
        else{
          this.hideSearchOptionsDropDown();
          if(this.$el.find('.csui-clearer').is(':visible'))
          {
            this.$el.find('.csui-clearer').focus();
          }else{
            this.$el.find('.csui-header-search-icon').focus();
          }
        }
      }
     else if(event.keyCode === 27 && this.options.data.showOptionsDropDown){
        this.hideSearchOptionsDropDown();
     }
    },

    _hideSearchPanel: function (event) {
      event.data = event.data || this;
      var _e              = event || window.event,
          ele             = $('.search-bar'),
          self            = event.data,
          searchContainer = self.$el.parent();
      $(document).find("." + event.data.options.data.customSearchIconNoHoverClass).removeClass(
          event.data.options.data.customSearchIconNoHoverClass);
      $(document).find('.csui-input').val('');
      searchContainer.removeClass('search-input-open');
      base.onTransitionEnd(searchContainer, function () {
        self.options.parentView && self.options.parentView.trigger("render:controls");
        if (this.isDestroyed) {
          return;
        }
        $(".binf-navbar-brand").addClass("binf-navbar-collapse");
        self.$el.removeClass('csui-searchbox-ready').removeClass('csui-search-expanded');
      }, this);

      $(document).find('.csui-search-box .csui-header-search-icon')[0].title = lang.searchIconTitle;
      $($(document).find('.csui-search-box .csui-header-search-icon')[0]).attr("aria-label",
          lang.searchIconTitle);
      $($(document).find('.csui-search-box .csui-header-search-icon')[0]).attr("aria-expanded",
          'false');
      event.data.slice = event.data.model.get('slice');
      event.data.ui.dropDown.addClass('binf-hidden');
      if ($(document.body).hasClass('binf-search-box-open')) {
        $(document.body).removeClass('binf-search-box-open');
        $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
        $(document.body).find('.search-box-widget-mask').remove();
        $(document).find('.csui-navbar.binf-navbar').off(' keydown.', this.handleKeydownNavbar);
      }
      $(document).find('.csui-search-box .csui-header-search-icon').removeClass(
          event.data.options.data.customSearchIconCloseClass).addClass(
          event.data.options.data.customSearchIconClass);

      $(document).off('click.' + this.cid + ' keydown.' + this.cid);

      var view = event.data;
      view.trigger("hide:searchbar");
      $('.csui-input').prop('tabindex', -1);
      self.$el.find('.active').removeClass('active');
      _.isObject(self.ui.searchIcon) && self.ui.searchIcon.trigger('focus');
    },

    /**
     * This private method returns whether search form's drop-down is already opened or not.
     *
     * @returns boolean
     * @private
     */
    _isDropdownVisible: function () {
      return this.ui.dropDown.is(':visible');
    },

    _hideSearchBar: function (event) {
      event.data = event.data || this;
      var _e = event || window.event,
        ele = $('.search-bar'),
        self = event.data,
        searchContainer = self.$el.parent(),
        value = self.ui.input.val().trim(),
        searchOptionsDropdown = ele.find('.csui-search-options-dropdown');
      // Allow dropdown to close even after value is cleared
      if (searchContainer.hasClass('search-input-open') &&
        (value) &&
        !$(event.target).is('.csui-input') &&
        self._isDropdownVisible() &&
        searchOptionsDropdown.find(event.target).length === 0) {
        searchOptionsDropdown.addClass('binf-hidden');
        //Remove masked class from navbar
        $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
        $(document.body).find('.search-box-widget-mask').remove();
      } else {
        if (self.applicationScope.get('id') !== "search" && ele.is(':visible') || $(event.target).find('.search-input-open').length ||
            $(event.target).siblings().find('.search-input-open').length || $(event.target).hasClass('search-input-open')) {
          if ((_e.type === 'keydown' && (_e.keyCode === 27 || _e.which === 27) &&
            !$('.search-bar-content .binf-popover').is(":visible")) ||
            (!$(_e.target).closest(ele).length &&
              _e.type === 'click') && (!$(_e.target).closest('.csui-header-search-icon').length) &&
            !$(_e.target).closest('.esoc-activityfeed-invisiblebutton').length) {
              self._hideSearchPanel(event);
          }
        }
      }
    },

    _updateInput: function () {
      if (this._isRendered) {
        var value = this.model.get('where') || '';
        this._setInputValue(value);
      }
    },

    _setInputValue: function (value) {
      this.ui.input.val(value);
      this.ui.clearer.toggle(!!value.length);
      this.ui.innerSeparator.toggle(!!value.length);
      this.ui.formfieldSearch.toggle(!!value.length);
      if (this.options.data.showOptionsDropDown) {
        this.options.data.nodeName = this.searchboxModel.nodeName;
      }
    },

    searchIconToClose: function () {
      _.isObject(this.ui.searchIcon) && this.ui.searchIcon.hasClass(this.options.data.customSearchIconClass) && this.ui.searchIcon.removeClass(this.options.data.customSearchIconClass).addClass(
        this.options.data.customSearchIconCloseClass);
      this.ui.input.addClass("csui-input-focus");
      $(this.ui.searchIcon).attr("title", lang.closeSearch);
      $(this.ui.searchIcon).attr("aria-label", lang.closeSearch);
      $(this.ui.searchIcon).removeClass(this.options.data.customSearchIconNoHoverClass);
    }
  });

  return SearchBoxView;

});

csui.define('csui/widgets/navigation.header/controls/search/search.view',[
  'csui/widgets/search.box/search.box.view',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/controls/globalmessage/globalmessage'
], function (SearchBoxView, SearchQueryModelFactory, GlobalMessage) {
  'use strict';

  var SearchView = SearchBoxView.extend({
    constructor: function SearchView(options) {
      SearchBoxView.call(this, options);
      this.searchQuery = options.context.getModel(SearchQueryModelFactory);
    },

    onRender: function () {
      var resizetrigger = function () { GlobalMessage.trigger('resize'); };
      this.listenTo(this, 'hide:input', resizetrigger);
      this.listenTo(this, 'show:input', resizetrigger);
    }

  });

  return SearchView;
});

csui.define('csui/widgets/navigation.header/controls/favorites/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/navigation.header/controls/favorites/impl/nls/root/localized.strings',{
  FavoritesIconTitle: 'Favorites',
  FavoritesTitleAria: 'Content Server Favorites'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/favorites/impl/favorites',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-favorites-icon-container\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":50},"end":{"line":1,"column":59}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"favoritesTitleAria") || (depth0 != null ? lookupProperty(depth0,"favoritesTitleAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"favoritesTitleAria","hash":{},"loc":{"start":{"line":1,"column":73},"end":{"line":1,"column":95}}}) : helper)))
    + "\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">\r\n  <span class=\"csui-icon-favorites favorite_header_icon\"></span>\r\n</div>\r\n<div class=\"csui-favorites-view-container\"></div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_favorites_impl_favorites', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/tabletoolbar/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/controls/tabletoolbar/impl/nls/root/localized.strings',{

  ToolbarAria: 'Table toolbar',

  // controls/tabletoolbar
  ToolbarItemFilter: 'Show filters',
  ToolbarItemFilterAria: 'Show filter panel',
  ToolbarItemOpen: 'Open',
  ToolbarItemDownload: 'Download',
  ToolbarItemBrowse: 'Browse',
  ToolbarItemCopy: 'Copy',
  ToolbarItemEmailLink: 'Mail as link',
  ToolbarItemEmailLinkShort: 'Mail as link',
  ToolbarItemPaste: 'Paste',
  ToolbarItemMove: 'Move',
  ToolbarItemShare: 'Share',
  ToolbarItemSendTo: 'Send to',
  ToolbarItemNavigate: 'Visit',
  ToolbarItemViewProperties: 'Properties',
  ToolbarItemVersionHistory: 'Version history',
  ToolbarItemDelete: 'Delete',
  ToolbarItemReserve: 'Reserve',
  ToolbarItemUnreserve: 'Unreserve',
  ToolbarItemLock: 'Lock',
  ToolbarItemUnlock: 'Unlock',
  ToolbarItemEdit: 'Edit',
  ToolbarItemRename: 'Rename',
  ToolbarItemRenameFavorite: 'Rename favorite',
  ToolbarItemOpenSavedQuery: 'Open',
  ToolbarItemExecuteSavedQuery: 'Execute',
  ToolbarItemInfo: 'Properties',
  ToolbarItemTimeline: 'Timeline',
  ToolbarItemToggleTableLayout: 'Toggle layout',
  ToolbarItemSettings: 'Settings',
  ToolbarItemAddFolder: 'Folder',
  ToolbarItemAddDocument: 'Document',
  ToolbarItemAdd: 'Add',
  ToolbarItemAddItem: 'Add item',
  ToolbarItemAddVersion: 'Add version',
  ToolbarItemAddCategories: 'Add categories',
  ToolbarItemMore: 'More actions',
  ToolbarItemPrint: 'Print',
  ToolbarItemOriginalEdit: 'Edit original',
  ToolbarItemOriginalShare: 'Share original',
  ToolbarItemOriginalReserve: 'Reserve original',
  ToolbarItemOriginalUnreserve: 'Unreserve original',
  ToolbarItemOriginalCopy: 'Copy original',
  ToolbarItemOriginalMove: 'Move original',
  ToolbarItemOriginalDownload: 'Download original',
  ToolbarItemOriginalDelete: 'Delete original',
  ToolbarItemCopyLink: 'Copy link',
  ToolbarItemOriginalCopyLink: 'Copy link original',
  ToolbarItemPermissions: 'View permissions',
  ToolbarItemDeletePermission: 'Remove from list',
  ToolbarItemEditPermission: 'Edit permissions',
  ToolbarItemApplyPermission: 'Apply permissions to sub-items',
  ToolbarItemChangeOwnerPermission: 'Change owner',
  ToolbarItemRemoveCollectionItems: 'Remove from collection',
  ToolbarItemInformation: 'Properties',
  ToolbarGoToLocation:'Go to location',
  ToolbarCollect:'Collect',
  ToolbarItemZipAndDownload: 'Download',
  ToolbarItemGoBack: 'Go back',
  ToolbarItemTreeBrowse: 'Show navigation tree',
  ToolbarItemRestructure: 'Restructure',

  // dropdown menu in table header caption
  MenuItemUploadFile: 'Upload file',
  MenuItemAddNewFolder: 'Add new Folder',
  MenuItemZipAndDownload: 'Download',
  MenuItemCopy: 'Copy',
  MenuItemMove: 'Move',
  MenuItemEmailLink: 'Email link',
  MenuItemShare: 'Share',
  MenuItemReserve: 'Reserve',
  MenuItemUnreserve: 'Unreserve',
  MenuItemDelete: 'Delete',
  MenuItemSendToDevice: 'Send to device',
  MenuItemRename: 'Rename',
  MenuItemTimeline: 'Timeline',
  MenuItemInformation: 'Properties',
  MenuItemCopyLink: 'Copy link',
  MenuItemRestructure: 'Restructure',

  // right toolbar
  ToolbarItemComment: 'Comment',
  ToolbarItemShowDescription: 'Show description',
  ToolbarItemConfiguration: 'Configuration',
  ToolbarItemMaximizeWidgetView: 'Maximize widget view',
  ToolbarItemRestoreWidgetViewSize: 'Restore widget view size',

  // permission dropdown command names

  AddUserOrGroups: 'Add user or groups',
  AddOwnerOrGroup: 'Add owner or owner group',
  RestorePublicAccess: 'Restore public access',

  //Title for add toolbar items as 'add folder'
  AddToolbarItemsTitle: 'Add {0}',
  ToolbarItemThumbnail: "Grid view",
  ToolbarItemListView: "List view",
  ThumbnailTitle: "Grid view",
  ListViewTitle: "List view",

   //Document preview
   ToolbarItemDocPreview: 'View',

   //Compound document
   CreateRelease:"Create release",
   CreateRevision: "Create revision",
   ToolbarItemViewReleases: 'View releases',
   compoundDocument: "Compound document",

   // Reorganize
   Reorganize :"Reorganize"
});



csui.define('csui/widgets/favorites/tileview.toolbaritems',['csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/recentlyaccessed/tileview.toolbaritems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';
  var toolbarItems = {

    // inline action bar
    inlineActionbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              commandData: {dialogView: true},
              iconName: "csui_action_properties32"
            },
            {
              signature: "DocPreview",
              name: lang.ToolbarItemDocPreview,
              iconName: "csui_action_preview32",
              commandData: {
                ifNotOpenDelegate: true,
                fullView: false,
                includeContainers: false
              }
            }
          ],
          share: [
            {
              signature: "CopyLink", name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {
              signature: "Edit", name: lang.ToolbarItemEdit,
              iconName: "csui_action_edit32"
            }
          ],
          other: [
            {
              signature: "Download", name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "goToLocation", name: lang.ToolbarGoToLocation
            }
          ]
        },
        {
          maxItemsShown: 1,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});

csui.define('csui/widgets/favorites/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/favorites/impl/nls/root/lang',{
  dialogTitle: 'Favorites',
  searchTitle: 'Search Favorites',
  searchPlaceholder: 'Favorites',
  searchAria: 'Search for favorites',
  expandAria: 'Expand the Favorites widget',
  emptyGroupDefaultText: 'This group is empty.',
  emptyListText: 'There are no items to display.',
  loadingListText: 'Loading results...',
  failedListText: 'Loading results failed.',
  loadingText: "Loading favorites",
  favoritesGroupAria: '{0}, Favorites Group',
  favoritesEmptyGroupAria: '{0}, Empty Favorites Group',
  addFav: 'Add Favorite',
  removeFav: 'Remove Favorite',
  addFavoriteNameLabel: 'Favorite name',
  addFavoriteNamePlaceHolder: 'Enter name',
  addFavoriteGroupLabel: 'Group',
  addFavoriteAddButtonLabel: 'Add',
  addFavoriteCancelButtonLabel: 'Cancel',
  nameErrorMaxLengthExceed: 'Name cannot be longer than 248 characters.',
  nameErrorContainSemiColon: 'Name cannot contain a colon.',
  updateFavoriteFailMessage: 'Failed to update Favorite for node "{0}". \n\n{1}',
  openFavoritesView: 'Open favorites view'
});





csui.define('css!csui/widgets/favorites/impl/favorites.view',[],function(){});
// Shows a list of links to favorite nodes
csui.define('csui/widgets/favorites/favorites.view',['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/contexts/factories/favorites2',
  'csui/controls/list/list.view',
  'csui/controls/listitem/listitemstandard.view',
  'csui/controls/listitem/simpletreelistitem.view',
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/list/behaviors/list.view.keyboard.behavior',
  'csui/behaviors/collection.state/collection.state.behavior',
  'csui/controls/list/list.state.view',
  'csui/utils/contexts/factories/favorite2groups',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/models/favorites2', 'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/progressblocker/blocker',
  'csui/widgets/favorites/tileview.toolbaritems',
  'csui/utils/commands',
  'i18n!csui/widgets/favorites/impl/nls/lang',
  'i18n!csui/controls/listitem/impl/nls/lang',
  'css!csui/widgets/favorites/impl/favorites.view'
], function (module, $, _, Backbone, Marionette,
    Favorite2CollectionFactory, ListView, StandardListItem, SimpleTreeListView,
    ExpandingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    Favorite2GroupsCollectionFactory, ApplicationScopeModelFactory,
    Favorite2Collection, NodeTypeIconView, BlockingView, tileViewToolbarItems, commands,
    lang, listItemLang) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    openInPerspective: true
  });

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var FavoritesView = ListView.extend({

    templateHelpers: function () {
      return {
        title: this.options.data.title || lang.dialogTitle,
        icon: this.options.data.titleBarIcon,
        searchPlaceholder: lang.searchPlaceholder,
        searchTitle: lang.searchTitle,
        searchAria: lang.searchAria,
        expandAria: lang.expandAria,
        openPerspectiveAria: lang.openFavoritesView,
        openPerspectiveTooltip: lang.openFavoritesView,
        enableOpenPerspective: this._enableOpenPerspective
        // "hideSearch: true" could be used to get get rid of the search option
      };
    },

    events: {
      'click .tile-expand': 'onMoreLinkClick'
    },

    behaviors: {
      ExpandableList: {
        behaviorClass: ExpandingBehavior,
        expandedView: 'csui/widgets/favorites2.table/favorites2.table.view',
        orderBy: function () { return this.options.orderBy; },
        titleBarIcon: function () { return this.options.data.titleBarIcon; },
        dialogTitle: lang.dialogTitle,
        dialogTitleIconNameRight: 'csui_action_minimize32',
        dialogClassName: 'favorites'
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        collection: function () {
          return this.completeCollection;
        },
        stateView: ListStateView,
        stateMessages: {
          empty: lang.emptyListText,
          loading: lang.loadingListText,
          failed: lang.failedListText
        }
      }
    },

    getChildView: function (item) {
      if (this.showFlatList) {
        return StandardListItem;
      } else {
        return SimpleTreeListView;
      }
    },

    childViewOptions: function () {
      return {
        templateHelpers: function () {
          if (this instanceof StandardListItem) {
            return {
              name: this.model.get('favorite_name'),
              enableIcon: true,
              showInlineActionBar: this.showInlineActionBar,
              itemLabel: _.str.sformat(listItemLang.itemTitleLabel, this.model.get('favorite_name'))
            };
          } else {
            var ariaName;
            var name = this.model.get('name');
            if (this.model.childrenCollection && this.model.childrenCollection.length === 0) {
              ariaName = _.str.sformat(lang.favoritesEmptyGroupAria, name);
            } else {
              ariaName = _.str.sformat(lang.favoritesGroupAria, name);
            }
            return {
              icon: 'mime_fav_group32',
              name: name,
              ariaName: ariaName,
              expand: this.model.searchMode
            };
          }
        },

        childViewTemplateHelpers: function () {
          return {
            icon: this.model.get('icon'),
            name: this.model.get('favorite_name'),
            text: lang.emptyGroupDefaultText,
            showInlineActionBar: this.showInlineActionBar,
            itemLabel: _.str.sformat(listItemLang.itemTitleLabel, this.model.get('favorite_name'))
          };
        },
        checkDefaultAction: true,
        context: this.context,
        iconSize: this.options.iconSize,
        //Set these values inorder to disaply Inline Actions
        toolbarData: this.toolbarData,
        refetchNodeActions: true

      };
    },

    childEvents: {
      'click:item': '_onClickItem',  // event for flat list
      'click:tree:item': '_onClickTreeItem',
      'click:tree:header': '_onClickTreeHeader',
      'render': 'onRenderItem',
      'before:destroy': 'onBeforeDestroyItem',
      'changed:focus': 'onChangedfocus'
    },

    constructor: function FavoritesView(options) {
      options || (options = {});
      _.defaults(options, {
          orderBy: 'favorite_name asc',
          iconSize: 'contain'
        });
      options.data || (options.data = {});
      options.data.titleBarIcon = options.data.showTitleIcon === false ?
                                  undefined : 'title-icon title-favourites';

      var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);

      this.completeCollection = options.collection ||
                                options.context.getCollection(
                                    Favorite2GroupsCollectionFactory,
                                    {
                                      detached: true,
                                      permanent: true,
                                      favorites: {
                                        options: {
                                          promotedActionCommands: [],
                                          nonPromotedActionCommands: nonPromotedActionCommands
                                        }
                                      }
                                    }
                                );
      var limitedRS = Favorite2CollectionFactory.getLimitedResourceScope();
      this.completeCollection.favorites.setResourceScope(limitedRS);

      var ViewCollection = Backbone.Collection.extend({
        model: this.completeCollection.model
      });
      options.collection = new ViewCollection();
      this.showInlineActionBar = options.showInlineActionBar === false ?
                                 options.showInlineActionBar : true;

      var context        = options.context,
          viewStateModel = context && context.viewStateModel;
      this._enableOpenPerspective = config.openInPerspective &&
                                    viewStateModel && viewStateModel.get('history');

      ListView.prototype.constructor.apply(this, arguments);
      this.loadingText = lang.loadingText;
      BlockingView.imbue(this);

      // TODO: Set up collection parameters here to get the best performance;
      // set up both this.completeCollection and this.completeCollection.favorites
      // Node: must listen for sync to update when new model was successfully saved, otherwise
      // it would show up empty.
      this.listenTo(this.completeCollection, 'update sync',
          _.bind(this._synchronizeCollections, this));

      this._synchronizeCollections();

      this.listenTo(this, 'render', this._onRender);
      this.listenTo(this, 'change:filterValue', this._synchronizeCollections);

      if (this.showInlineActionBar) {
        options.tileViewToolbarItems = tileViewToolbarItems;
        this.context = context;
        this.toolbarData = {
          toolbaritems: tileViewToolbarItems,
          collection: this.completeCollection.favorites
        };
      }

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this, 'doc:preview:generic:actions', this._highlightRow);
    },

     /**
     * This method highlight's the row for which document is getting to be previewed.
     *
     * @param targetRow
     * @private
     */
      _highlightRow: function (targetNode, HIGHLIGHT_CLASS_NAME) {
        $('.' + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
        var groupIndex,rowIndex;
         groupIndex= _.findIndex(this.collection.models, function (node) {
           rowIndex= _.findIndex(node.get("favorites"), function (childnode) {
                    return childnode.id === targetNode.get("id");
                  });
                    return rowIndex!=-1;
                  });
        // ensure current viewing document exists in current page, then only high-light the row.
        // if the document exists in previous or next pages, let's do nothing for now.
        if (rowIndex !== -1) {
          var child = this.$childViewContainer.find(_.str.sformat("div:nth-child({0})", groupIndex+1));
          var target = child && child.find(".cs-list-group a");
          var targetRow = target && target.eq(rowIndex);
          targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
        }
      },

    _onRender: function () {
      this.$el.addClass('cs-favorites');
      this.completeCollection.ensureFetched();
      this.$el.on('keydown', _.bind(this.onKeyDown, this));
      // the parent view is always rendered first with its current collection
      this._updateAccAttributes();
    },

    _updateAccAttributes: function () {
      // remove existing attributes first, shifting the aria-labelledby
      var tileContent = this.$el.find('.tile-content');
      var labelledBy = tileContent.attr('aria-labelledby');
      tileContent.removeAttr('role aria-expanded aria-labelledby');

      // set attributes
      if (this.showFlatList) {  // flat list
        this.$el.find('.tile-content > .binf-list-group').attr({'role': 'listbox', 'aria-labelledby': labelledBy});
      } else {  // tree list
        this.$el.find('.tile-content > .binf-list-group').attr({'role': 'tree', 'aria-labelledby': labelledBy});
      }
    },

    onRenderCollection: function () {
      // the collection can optionally be synced later, needs to update accessibility attributes
      this._updateAccAttributes();
    },

    onRenderItem: function (childView) {
      if (this.showFlatList) {
        childView._nodeIconView = new NodeTypeIconView({
          el: childView.$('.csui-type-icon').get(0),
          node: childView.model,
          size: this.options.iconSize
        });
        childView._nodeIconView.render();
        childView.$el.attr('role', 'option');
        childView.$el.attr('aria-label',
            _.str.sformat(listItemLang.typeAndNameAria, childView._nodeIconView.model.get('title'),
                childView.model.get('favorite_name')));
      } // for tree view the role is set in the simpletreelistitem
    },

    onBeforeDestroyItem: function (childView) {
      if (this.showFlatList && childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    },

    onChangedfocus: function () {
      this.trigger('changed:focus');
    },

    _onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    _onClickTreeItem: function (target, src) {
      this.triggerMethod('execute:defaultAction', src.model);
    },

    _onClickTreeHeader: function (target) {
      // tree list view expands or collapses, update the scrollbar
      this.trigger('update:scrollbar');
    },

    onClickHeader: function (target) {
      if (this.options.avoidOpenPerspectiveOnHeader) {
        return;
      }
      this.onClickOpenPerspective(target);
    },

    onClickOpenPerspective: function (target) {
      this.applicationScope.set('id', 'favorites');
      this.trigger('open:favorites:perspective');
    },

    onMoreLinkClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.triggerMethod('expand');
    },

    _synchronizeCollections: function () {
      var favoritesCollection,
          self = this,
          firstGroup = this.completeCollection.at(0),
          options = {
            connector: this.completeCollection.connector
          },
          filterObj = {
            favorite_name: this.options.filterValue
          };

      if (this.completeCollection.length === 1 && firstGroup.get('tab_id') === -1) {

        // there is only the Unsorted group (tab_id = -1), show a flat list as UX requested
        this.showFlatList = true;
        favoritesCollection = new Favorite2Collection(undefined, options);
        favoritesCollection.reset(firstGroup.favorites && firstGroup.favorites.models || []);
        favoritesCollection.setFilter(filterObj);
        // if not searching or search still has empty value, set it to all models
        if (!self.options.filterValue || self.options.filterValue.length === 0) {
          self.collection.reset(favoritesCollection.models);
        } else {
          // setFilter is now asynchronous, listen to sync event to update the collection
          self.listenTo(favoritesCollection, 'sync', function () {
            self.collection.reset(favoritesCollection.models);
          });
        }

      } else {

        // show favorite groups and items in a tree list
        self.showFlatList = false;
        var searchMode = this.isSearchOpen();
        var groups = new Backbone.Collection();
        var promises = [];

        _.each(this.completeCollection.models, function (group) {
          favoritesCollection = new Favorite2Collection(undefined, options);
          favoritesCollection.reset(group.favorites.models);
          favoritesCollection.setFilter(filterObj);

          var groupModel = new Backbone.Model(group.attributes);
          groupModel.childrenCollection = favoritesCollection;
          groupModel.searchMode = searchMode;
          // flatten the unsorted Favorites group
          (groupModel.get('tab_id') === -1) && groupModel.set('flatten', true);
          groups.add(groupModel);

          // searching with some non-empty string, wait for the setFilter() asynchronous call
          if (self.options.filterValue && self.options.filterValue.length > 0) {
            var deferred = $.Deferred();
            promises.push(deferred.promise());
            // setFilter is now asynchronous, listen to sync event to update the collection
            self.listenTo(favoritesCollection, 'sync', function () {
              // UX specs: don't show empty groups during search
              if (groupModel.childrenCollection.length === 0) {
                groups.remove(groupModel);
              }
              deferred.resolve();
            });
          }

        });

        // searching with some non-empty string, wait for all promises done then set collection
        if (self.options.filterValue && self.options.filterValue.length > 0) {
          $.when.apply($, promises).then(function () {
            self.collection.reset(groups.models);
          });
        } else {
          // set models to collection when not in the progress of searching or empty string search
          self.collection.reset(groups.models);
        }

      }
    },

    // Override the ListView::getElementByIndex method.
    // Return the jQuery list item element by index for keyboard navigation use
    getElementByIndex: function (index, event) {
      if (this.showFlatList) {
        return ListView.prototype.getElementByIndex.call(this, index);
      }

      if (isNaN(index) || (index < 0)) {
        return null;
      }
      var childView = this.children.findByIndex(index);
      if (childView && childView.currentlyFocusedElement) {
        return childView.currentlyFocusedElement(event);
      } else {
        return null;
      }
    }

  });

  return FavoritesView;

});


csui.define('css!csui/widgets/navigation.header/controls/favorites/impl/favorites',[],function(){});
csui.define('csui/widgets/navigation.header/controls/favorites/favorites.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'i18n!csui/widgets/navigation.header/controls/favorites/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/navigation.header/controls/favorites/impl/favorites',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/widgets/favorites/favorites.view', 'csui/utils/contexts/factories/favorites2',
  'css!csui/widgets/navigation.header/controls/favorites/impl/favorites'
], function (_, $, Marionette, localizedStrings, TabableRegionBehavior, template,
    LayoutViewEventsPropagationMixin, FavoritesView) {
  'use strict';

  var FavoritesButtonView = Marionette.LayoutView.extend({
    className: 'csui-favorites-view initialLoading',

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.FavoritesIconTitle,
        favoritesTitleAria: localizedStrings.FavoritesTitleAria
      };
    },

    regions: {
      favoritesViewContainerRegion: '.csui-favorites-view-container'
    },

    ui: {
      favoritesButtonContainer: '.csui-favorites-icon-container',
      favoritesViewContainer: '.csui-favorites-view-container'
    },

    events: {
      'dragenter': '_hideFavoritesView',
      'keydown': 'onKeyInView',
      'mouseenter .csui-favorites-view-container': 'onMouseEnterFavoritesView',
      'mouseenter .csui-favorites-icon-container': 'onMouseEnterFavoritesView',
      'mouseleave .csui-favorites-view-container': 'onMouseLeaveFavoritesView',
      'mouseleave .csui-favorites-icon-container': 'onMouseLeaveFavoritesView',
      'mouseenter .clicked-no-hover': 'onMouseEnterClickedNoHoverItem',
      'focus .csui-favorites-icon-container': 'onFocusButton',
      'blur .csui-favorites-icon-container': 'onBlurButton',
      'blur .csui-favorites-view-container': 'onBlurFavoritesViewContainer',
      'click .csui-favorites-icon-container': 'onClickFavoritesIcon'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function (event) {
      var $favoriteSearch = this.ui.favoritesViewContainer.find(
        '.content-tile .cs-search-button');
      if (event.shiftKey && $favoriteSearch .length > 0) {
        return this.favoritesView._focusSearchButton();
      } else {
        return this.ui.favoritesButtonContainer;
      }
    },

    constructor: function FavoritesButtonView(options) {
      Marionette.LayoutView.call(this, options);
      
      this.propagateEventsToRegions();
      this.listenTo(options.context, 'change:perspective', this._hideFavoritesView);
    },

    onBeforeDestroy: function () {
      this.favoritesView && this.favoritesView.destroy();
    },

    onRender: function () {
      this.ui.favoritesViewContainer.addClass('binf-hidden');
    },

    onFocusButton: function () {
      this.$el.find('.csui-icon-favorites').addClass('fav_header42_mo');
    },

    onBlurButton: function () {
      this.$el.find('.csui-icon-favorites').removeClass('fav_header42_mo');
      if (this.favoritesViewInFocus !== true &&
          document.activeElement !== this.ui.favoritesButtonContainer[0]) {
        this._hideFavoritesView();
      }
    },

    onBlurFavoritesViewContainer: function (event) {
      if (this.favoritesViewInFocus !== true && this.keyboardAction !== true) {
        this._hideFavoritesView();
      }
    },

    onMouseEnterFavoritesView: function () {
      this.favoritesViewInFocus = true;
    },

    onMouseLeaveFavoritesView: function () {
      this.favoritesViewInFocus = false;
    },

    onMouseEnterClickedNoHoverItem: function (event) {
      event && event.target && $(event.target).removeClass('clicked-no-hover');
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 9:  // tab
        var favoritesButtonInFocus = this.ui.favoritesButtonContainer.is(':focus');
        if (favoritesButtonInFocus && event.shiftKey !== true &&
            !this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
          // move to the favorites list
          this._focusOnFavoriteSearch(event);
        } else if (!favoritesButtonInFocus && event.shiftKey) {
          // move to the favorites button
          event.preventDefault();
          event.stopPropagation();
          this._focusOnFavoriteButton();
        } else if (!$(event.target).closest('.tile-header').length){
          this._hideFavoritesView();
        }
        break;
      case 13:  // enter
      case 32:  // space
        if (!$(event.target).closest('.tile-header').length) {
        this.triggerMethod('click:favorites:icon', event);
          if (!this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
            this._focusOnFavoriteSearch(event);
          }
        }
        break;
      case 40:  // arrow down
        if (!this.favoritesView || this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
          this.triggerMethod('click:favorites:icon', event);
          this._focusOnFavoriteSearch(event);
        } else if (this.favoritesViewInFocus !== true) {
          this._focusOnFavoriteSearch(event);
        }
        break;
      case 27:  // escape
        this._focusOnFavoriteButton();
        this._hideFavoritesView();
        break;
      }
    },

    _focusOnFavoriteButton: function () {
      this.ui.favoritesButtonContainer.trigger('focus');
      this.favoritesViewInFocus = false;
    },

    _focusOnFavoriteSearch: function (event) {
      var $favoriteSearch = this.ui.favoritesViewContainer.find(
        '.content-tile .cs-search-button');
      if ($favoriteSearch.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        this.favoritesViewInFocus = true;
        this.favoritesView._moveTo(event, this.favoritesView._focusSearchButton());
      }
    },

    _focusOnFavoriteList: function (event) {
      var $favorites     = this.ui.favoritesViewContainer.find(
          '> .content-tile > .tile-content > .binf-list-group'),
          $favoriteItems = this.favoritesView.showFlatList ?
                           $favorites.find('> .binf-list-group-item') :
                           $favorites.find('> .cs-simpletreelistitem');
      if ($favoriteItems.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        this.favoritesViewInFocus = true;
        this.favoritesView._moveTo(event, this.favoritesView._focusList());
      }
    },

    _handleClickEvent: function (event) {
      // check to see if the click is NOT on the popover
      if (!$(event.target).parents('.csui-favorites-view-container').length &&
          !$(event.target).parents('.csui-favorites-icon-container').length) {
        this._hideFavoritesView();
      }
    },

    _toggleFavoritesView: function () {
      if (this.ui.favoritesViewContainer.hasClass('binf-hidden')) {
        this._showFavoritesView();
      } else {
        this._hideFavoritesView();
      }
    },

    _showFavoritesView: function () {
      this.ui.favoritesViewContainer.removeClass('binf-hidden');
      this.ui.favoritesViewContainer.find('.csui-perfect-scrolling').perfectScrollbar('update');
      this.ui.favoritesButtonContainer.attr('aria-expanded', 'true');
      this.$el.addClass('showing-favorites-view');
      this.favoritesViewContainerRegion.show(this.favoritesView);
      $(document).off('click.' + this.cid).on('click.' + this.cid,
          _.bind(this._handleClickEvent, this));
    },

    _hideFavoritesView: function () {
      $(document).off('click.' + this.cid);
      if (this.favoritesView && this.favoritesView.isSearchOpen()) {
        this.favoritesView.searchClicked(event); // reset search to default
      }
      this.favoritesViewInFocus = false;
      this.ui.favoritesViewContainer.addClass('binf-hidden');
      this.ui.favoritesButtonContainer.attr('aria-expanded', 'false');
      this.$el.removeClass('showing-favorites-view');
    },

    onClickFavoritesIcon: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.options && this.options.parentView && 
      this.options.parentView.trigger("header:control:clicked");
      var toggleDropdown = $('.binf-open>.binf-dropdown-toggle');
      if (toggleDropdown.length > 0) {
        toggleDropdown.binf_dropdown('toggle');
      }
      this._ensureFavoritesView();
      this._toggleFavoritesView();
      this._focusOnFavoriteSearch(event);
    },

    _ensureFavoritesView: function () {
      if (!this.favoritesView) {
        var self = this;
        var options = _.extend(this.options, {showInlineActionBar: true, avoidOpenPerspectiveOnHeader: true});
        this.favoritesView = new FavoritesView(options);
        this.favoritesView.listenToOnce(this.favoritesView.completeCollection, "request", this.favoritesView.blockActions);
        this.favoritesView.listenToOnce(this.favoritesView.completeCollection, "sync error", this.favoritesView.unblockActions);
        this.listenToOnce(this.favoritesView.completeCollection, "sync", function () {
          this.$el.removeClass("initialLoading");
        });
        this.favoritesView.blockingView.showloadingWheel = false;
        this.listenTo(this.favoritesView, 'childview:click:tree:item', function (target, src) {
          src.$el && src.$el.addClass('clicked-no-hover');
          self._hideFavoritesView();
          self._focusOnFavoriteButton();
        });
        this.listenTo(this.favoritesView, 'childview:click:item', function (src) {
          src.$el && src.$el.addClass('clicked-no-hover');
          self._hideFavoritesView();
          self._focusOnFavoriteButton();
        });
        this.listenTo(this.favoritesView, 'childview:before:execute:command', function (src) {
          self._hideFavoritesView();
          self._focusOnFavoriteButton();
        });
        this.listenTo(this.favoritesView,
            'before:keyboard:change:focus childview:before:keyboard:change:focus', function () {
              self.keyboardAction = true;
            });
        this.listenTo(this.favoritesView,
            'after:keyboard:change:focus childview:after:keyboard:change:focus', function () {
              self.keyboardAction = false;
            });

        this.listenTo(this.favoritesView, 'open:favorites:perspective', function() {
          this._hideFavoritesView();
        });
      }
    }
  });

  _.extend(FavoritesButtonView.prototype, LayoutViewEventsPropagationMixin);

  return FavoritesButtonView;
});

csui.define('csui/widgets/navigation.header/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/navigation.header/impl/nls/root/lang',{
  profileMenuItemLabel: 'Profile',
  switchToClassicMenuItemLabel: 'Classic view',
  signOutMenuItemLabel: 'Sign out',
  EditPerspective: "Edit page",
  CreatePerspective: "Edit page",
  personalizePage: "Personalize page",
  ContentServerAdministrationMenuItemLabel: 'Administration',
  AboutBox: 'About'
});



csui.define('csui/widgets/navigation.header/profile.menuitems',['csui/lib/underscore',
  'i18n!csui/widgets/navigation.header/impl/nls/lang',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items from the previous module location
  'csui-ext!csui/widgets/navigation.header/profile.menuitems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';

  var menuItems = {
    profileMenu: new ToolItemsFactory({
        profile: [
          {signature: 'UserProfile', name: lang.profileMenuItemLabel}
        ],
        others: [
          {signature: 'SwitchToClassic', name: lang.switchToClassicMenuItemLabel},
          {signature: 'EditPerspective', name: lang.EditPerspective},
          {signature: 'ContentServerAdministration', name: lang.ContentServerAdministrationMenuItemLabel},
          {signature: 'AboutBox', name: lang.AboutBox}
       ],
        signout: [
          {signature: 'SignOut', name: lang.signOutMenuItemLabel}
        ]
      },
      {
        maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
        dropDownIconName: "csui_action_caret_down32"
      }
    )
  };

  if (extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = menuItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return menuItems;
});

csui.define('csui/widgets/navigation.header/profile.menuitems.mask',[
  'module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  var ProfileMenuItemsMask = ToolItemMask.extend({

    constructor: function ProfileMenuItemsMask() {
      var config = module.config(),
          globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        this.extendMask(source);
      }, this);
      // Enable restoring the mask to its initial state
      this.storeMask();
    }

  });

  return ProfileMenuItemsMask;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a href=\"#\" data-binf-toggle=\"dropdown\" role=\"button\" aria-expanded=\"false\" aria-haspopup=\"true\"\r\n   class=\"binf-dropdown-toggle nav-profile csui-navbar-icons csui-acc-focusable\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"profileMenuTitle") || (depth0 != null ? lookupProperty(depth0,"profileMenuTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"profileMenuTitle","hash":{},"loc":{"start":{"line":2,"column":88},"end":{"line":2,"column":108}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"profileMenuAria") || (depth0 != null ? lookupProperty(depth0,"profileMenuAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"profileMenuAria","hash":{},"loc":{"start":{"line":2,"column":122},"end":{"line":2,"column":141}}}) : helper)))
    + "\">\r\n  <span class=\"csui-profile-default-image image_user_placeholder\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"initials") || (depth0 != null ? lookupProperty(depth0,"initials") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"initials","hash":{},"loc":{"start":{"line":3,"column":66},"end":{"line":3,"column":78}}}) : helper)))
    + "</span>\r\n  <img class=\"csui-profile-image binf-img-circle binf-hidden\" alt=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"profileImageAlt") || (depth0 != null ? lookupProperty(depth0,"profileImageAlt") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"profileImageAlt","hash":{},"loc":{"start":{"line":4,"column":67},"end":{"line":4,"column":86}}}) : helper)))
    + "\" src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgSrc") || (depth0 != null ? lookupProperty(depth0,"imgSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgSrc","hash":{},"loc":{"start":{"line":4,"column":93},"end":{"line":4,"column":103}}}) : helper)))
    + "\">\r\n</a>\r\n<ul class=\"binf-dropdown-menu csui-profile-dropdown\" role=\"menu\"></ul>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_user.profile_impl_user.profile', t);
return t;
});
/* END_TEMPLATE */
;


csui.define('css!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',[],function(){});
csui.define('csui/widgets/navigation.header/controls/user.profile/user.profile.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette', 'csui/utils/url',
  'csui/utils/log', 'csui/utils/base', 'csui/utils/commands',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/user',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/toolbar/toolitems.filtered.model',
  'csui/controls/toolbar/toolitem.view',
  'csui/widgets/navigation.header/profile.menuitems',
  'csui/widgets/navigation.header/profile.menuitems.mask',
  'csui/utils/user.avatar.color',
  'csui/controls/globalmessage/globalmessage',
  'hbs!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',
  'csui-ext!csui/widgets/navigation.header/controls/user.profile/user.profile.view',
  'i18n!csui/pages/start/impl/nls/lang',
  'css!csui/widgets/navigation.header/controls/user.profile/impl/user.profile',
  'csui/lib/jquery.binary.ajax'
], function (module, _, $, Backbone, Marionette, Url, log, base,
    commands, ConnectorFactory, UserModelFactory, TabableRegionBehavior,
    FilteredToolItemsCollection, ToolItemView, menuItems, MenuItemsMask, UserAvatarColor,
    GlobalMessage, template, menuHandlers, lang) {
  'use strict';

  log = log(module.id);

  var ProfileView = Marionette.CompositeView.extend({
    classname: 'binf-dropdown',

    template: template,

    templateHelpers: function () {
      var username = base.formatMemberName(this.model);

      return {
        profileMenuTitle: lang.profileMenuTitle,
        profileMenuAria: _.str.sformat(lang.profileMenuAria, username),
        profileImageAlt: _.str.sformat(lang.profileImageAlt, username),
        // a 1x1 transparent gif, to avoid an empty src tag
        imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
        initials: this.options.model.attributes.initials
      };
    },

    serializeData: function () {
      return {
        items: this.collection.toJSON()
      };
    },

    childView: ToolItemView,

    childViewContainer: '> .csui-profile-dropdown',

    ui: {
      userProfileMenu: '> .csui-profile-dropdown',
      userProfileMenuHandle: '> a',
      personalizedImage: '.csui-profile-image',
      defaultImage: '.csui-profile-default-image',
      profileDropdownToggler: '> .nav-profile'
    },

    events: {
      'keydown @ui.profileDropdownToggler': '_showDropdown',
      'keydown @ui.userProfileMenu': '_showDropdown',
      'focusout @ui.profileDropdownToggler': '_toggleDropdown',
      'focusout @ui.userProfileMenu': '_toggleDropdown'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: '> .csui-acc-focusable',

    constructor: function ProfileView(options) {
      options || (options = {});
      this._ensureModels(options);

      Marionette.CompositeView.prototype.constructor.call(this, options);

      this.connector = this.options.context.getModel(ConnectorFactory);
      this.listenTo(this.model, 'change', this._refreshUser)
          .listenTo(options.context, 'sync error', this._refreshActions)
          .listenTo(this, 'render', this._displayUser)
          .listenTo(this, 'destroy', this._releasePhotoUrl)
          .listenTo(this, 'childview:toolitem:action', this._triggerMenuItemAction)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle);
    },

    _ensureModels: function (options) {
      var context = options.context,
          user    = context.getModel(UserModelFactory);

      this.username = "ensured";

      this.staticMenuItems = menuItems.profileMenu.collection.toJSON();
      options.model = user;

      options.collection = new FilteredToolItemsCollection(
          menuItems.profileMenu, {
            status: {context: context},
            commands: commands,
            mask: new MenuItemsMask()
          });
    },

    _refreshUser: function () {
      // Properties is being destroyed on changing the context node. Both destroyer
      // and a sub-view refreshed are listening on node changes. Although listening
      // is stopped during the destruction, already registered handlers will be
      // triggered nevertheless.
      if (this._isRendered && !this.isDestroyed) {
        this.render();
      }
    },

    _refreshActions: function () {
      // Properties is being destroyed on changing the context node. Both destroyer
      // and a sub-view refreshed are listening on node changes. Although listening
      // is stopped during the destruction, already registered handlers will be
      // triggered nevertheless.
      if (this._isRendered && !this.isDestroyed) {
        if (menuHandlers) {
          var options  = {context: this.options.context},
              promises = _.chain(menuHandlers)
                  .flatten(true)
                  .map(function (menuHandler) {
                    return menuHandler(options);
                  })
                  .value(),
              self     = this;
          $.whenAll
              .apply($, promises)
              .always(function (dynamicMenuItems) {
                var mask = new MenuItemsMask();
                dynamicMenuItems = _.chain(dynamicMenuItems)
                    .flatten()
                    .pluck('profileMenu')
                    .flatten()
                    .value();
                dynamicMenuItems = self.staticMenuItems.concat(dynamicMenuItems);
                dynamicMenuItems = mask.maskItems(dynamicMenuItems);
                menuItems.profileMenu.reset(dynamicMenuItems);
              });
        } else {
          this.collection.refilter();
        }
      }
    },

    _triggerMenuItemAction: function (toolItemView, args) {
      // close the dropdown menu before triggering the event
      this.ui.profileDropdownToggler.binf_dropdown('toggle');
      this._executeAction(args.toolItem);
    },

    _executeAction: function (toolItem) {
      var signature = toolItem.get('signature'),
          command   = commands.findWhere({signature: signature}),
          context   = this.options.context,
          status    = {
            context: context,
            toolItem: toolItem,
            data: toolItem.get('commandData')
          },
          self      = this;
      try {
        // If the command was not found and the toolitem is executable, it is
        // a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        this.$el.addClass('binf-disabled');
        command.execute(status)
            .done(function (item) {
              // TODO: Add success reporting; do not build the sentence
              // from separate verbs and subjects; the command has to
              // return the full sentence
            })
            .fail(function (error) {
              if (error) {
                error = new base.Error(error);
                GlobalMessage.showMessage('error', error.message,
                    error.errorDetails);
              }
            })
            .always(function () {
              self.$el.removeClass('binf-disabled');
            });
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}',
            command.get('signature'), error.message) && console.warn(log.last);
      }
    },

    _displayUser: function () {
      if (this.model.get('id')) {
        this._displayProfileImage();
        this._assignUserColor();
      }
    },

    _displayProfileImage: function () {
      var photoUrl = this._getUserPhotoUrl();
      if (photoUrl) {
        var getPhotoOptions = {
          url: photoUrl,
          dataType: 'binary'
        };
        this.connector.makeAjaxCall(getPhotoOptions)
            .always(_.bind(function (response, statusText, jqxhr) {
              if (jqxhr.status === 200) {
                this._showPersonalizedImage(response);
              } else {
                this._showDefaultImage();
              }
            }, this));
      } else {
        this._showDefaultImage();
      }
    },

    _getUserPhotoUrl: function () {
      var connection = this.connector.connection,
          cgiUrl     = new Url(connection.url).getCgiScript(),
          photoPath  = this.model.get('photo_url');
      // If the URL does not contain the cache-busting parameter derived from
      // the picture's latest change, there was a problem retrieving it.  It
      // does not make sense to try it once more from the client side, waste
      // time and server resources and litter the log by 404 errors.
      if (photoPath && photoPath.indexOf('?') > 0) {
        return Url.combine(cgiUrl, photoPath);
      }
    },

    _showPersonalizedImage: function (imageContent) {
      this._releasePhotoUrl();
      this._photoUrl = URL.createObjectURL(imageContent);
      this.ui.defaultImage.addClass('binf-hidden');
      this.ui.personalizedImage.attr('src', this._photoUrl)
          .removeClass('binf-hidden');
      // after coming from keyboard once update the profile put focus to the resp. image.
      this.$el.parents().find('.esoc-userprofile-pic-actions img').length &&
      this.$el.parents().find('.esoc-userprofile-pic-actions img').trigger('focus');
    },

    _showDefaultImage: function (imageContent) {
      this._releasePhotoUrl();
      this.ui.personalizedImage.addClass('binf-hidden');
      this.ui.defaultImage[0].innerText = this.options.model.attributes.initials;
      this.ui.defaultImage.removeClass('binf-hidden');
      this.$el.parents().find(' span.esoc-full-profile-avatar-cursor').length &&
      this.$el.parents().find(' span.esoc-full-profile-avatar-cursor').trigger('focus');
    },

    _releasePhotoUrl: function () {
      if (this._photoUrl) {
        URL.revokeObjectURL(this._photoUrl);
        this._photoUrl = undefined;
      }
    },

    _closeToggle: function () {
      if (this.$el.hasClass('binf-open')) {
        this.ui.userProfileMenuHandle.trigger('click');
      }
    },

    _showDropdown: function (event) {
      var elms          = this.ui.userProfileMenu.find('> li > a'),
          index         = 0,
          activeElement = this.$el.find(document.activeElement);
      if (activeElement.length > 0) {
        index = elms.index(activeElement[0]);
        if (event.keyCode === 38 || event.keyCode === 40) {
          event.preventDefault();
          if (event.keyCode === 38) { // up arrow key
            index = index === -1 ? (elms.length - 1) : index - 1;
          }
          if (event.keyCode === 40) { // down arrow key
            index = index === (elms.length - 1) ? -1 : index + 1;
          }
          if (index === -1) {
            this.ui.profileDropdownToggler.trigger('focus');
          } else {
            $(elms[index]).trigger('focus');
          }
        } else if (event.keyCode === 27 &&
                   $(activeElement).closest('ul').is('.csui-profile-dropdown')) {
          event.stopPropagation();
          this.ui.profileDropdownToggler.trigger('click').trigger('focus');
        } else if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          event.stopPropagation();
          $(activeElement).trigger('click');
        }
      }
    },

    _toggleDropdown: function (event) {
      var that = this;
      setTimeout(function () {
        if (!!document.activeElement.offsetParent &&
            !document.activeElement.offsetParent.classList.contains(
                'csui-profile-dropdown') &&
            document.activeElement !== that.ui.profileDropdownToggler[0] &&
            that.ui.userProfileMenu.is(':visible')) {
          // closes the menu when keyboard moves focus out of the profile area
          $(that.ui.profileDropdownToggler).trigger('click');
        }
      }, 100);
    },

    _assignUserColor: function () {
      var userbackgroundcolor = UserAvatarColor.getUserAvatarColor(this.model.attributes);
      this.ui.defaultImage.css("background", userbackgroundcolor);
    }
  });

  return ProfileView;
});

// Lists explicit locale mappings and fallbacks

csui.define('csui/widgets/navigation.header/controls/progressbar.maximize/impl/nls/progressbar-maximize.lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/navigation.header/controls/progressbar.maximize/impl/nls/root/progressbar-maximize.lang',{
  // minimize
  maximize: 'Show message banner',
  maximizeAria: 'Show message banner'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/navigation.header/controls/progressbar.maximize/impl/progressbar.maximize',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-maximize\">\r\n<div class=\"icon-progresspanel-pending csui-button-icon binf-btn-default\"\r\n    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"maximizeAria") || (depth0 != null ? lookupProperty(depth0,"maximizeAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"maximizeAria","hash":{},"loc":{"start":{"line":3,"column":16},"end":{"line":3,"column":32}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"maximize") || (depth0 != null ? lookupProperty(depth0,"maximize") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"maximize","hash":{},"loc":{"start":{"line":3,"column":41},"end":{"line":3,"column":53}}}) : helper)))
    + "\" tabindex=\"0\">\r\n    <div class=\"csui-progressbar-animation\">\r\n    <!--<span class=\"icon-progresspanel-maximize-arrow binf-glyphicon binf-glyphicon-open\"></span>-->\r\n      <div class=\"csui-progressbar-pie-wrapper progress progressbar\">\r\n        <div class=\"csui-progressbar-pie\">\r\n          <div class=\"csui-progressbar-left-side csui-progressbar-half-circle\"></div>\r\n          <div class=\"csui-progressbar-right-side csui-progressbar-half-circle\"></div>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_navigation.header_controls_progressbar.maximize_impl_progressbar.maximize', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/navigation.header/controls/progressbar.maximize/impl/progressbar-maximize',[],function(){});
csui.define('csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
    'csui/controls/globalmessage/globalmessage',
    'i18n!csui/widgets/navigation.header/controls/progressbar.maximize/impl/nls/progressbar-maximize.lang',  // Use localizable texts
    'hbs!csui/widgets/navigation.header/controls/progressbar.maximize/impl/progressbar.maximize',
    'css!csui/widgets/navigation.header/controls/progressbar.maximize/impl/progressbar-maximize',
], function (_, $, Marionette, GlobalMessage, lang, template) {
    'use strict';

    var ProgressbarMaximizeView = Marionette.ItemView.extend({
        className: 'csui-progressbar-maximize-view',

        template: template,

        templateHelpers: function () {
            return {
                maximize: lang.maximize,
                maximizeAria: lang.maximizeAria
            };
        },

        ui: {
            favoritesButtonContainer: '.csui-favorites-icon-container',
            favoritesViewContainer: '.csui-favorites-view-container',
            progresspanelMaximize: '.csui-maximize .csui-button-icon',
            progressRight : '.csui-progressbar-pie .csui-progressbar-right-side',
            progressLeft : '.csui-progressbar-pie .csui-progressbar-left-side',
            wrapper: '.csui-progressbar-pie-wrapper.progress .csui-progressbar-pie'
        },

        events: {
            'click': '_onClick',
            'keydown @ui.progresspanelMaximize': 'onKeyInView',
        },

        constructor: function ProgressbarMaximizeView(options) {
            Marionette.ItemView.prototype.constructor.apply(this, arguments);
            this.listenTo(options.parentView, "processbar:minimize", this._doProcessbarMaximize);
            this.listenTo(options.parentView, "processbar:update", this._doProgressbarAnimation);
            this.listenTo(options.parentView, "processbar:finished", this._doFinishedProgressbar);
            this.listenTo(options.parentView, "processing:completed", this._onClick); //Open progres panel automatically once upload is 100% completed
            this.listenTo(options.parentView, "processing:error", this._doFailedProgressbar);
        },

        _doProcessbarMaximize: function () {
            this.options.parentView.$el.find('.csui-progressbar-maximize').removeClass('binf-hidden');
            this.$el.find('.csui-progressbar-animation').removeClass('binf-hidden');
            this.ui.progresspanelMaximize.removeClass('icon-progresspanel-success');
            this.ui.progresspanelMaximize.removeClass('icon-progresspanel-error');
            this.ui.progresspanelMaximize.trigger("focus");
        },

        onKeyInView: function (event) {
            if (event.keyCode === 13 || event.keyCode === 32) {
                // enter key(13) or space(32)
                this._onClick();
                return false;
            }
        },

        _doFailedProgressbar: function(){
            this.ui.progresspanelMaximize.addClass('icon-progresspanel-error');
            this.ui.progresspanelMaximize.removeClass('icon-progresspanel-success');
        },
        
        _doFinishedProgressbar: function () {
            this.ui.wrapper.css('clip', 'rect(0, 1em, 1em, 0.5em)');
            this.ui.progressLeft.css('transform', 'rotate(' + 360 + 'deg)');
            this.ui.progressRight.css('transform', 'rotate(' + 0 + 'deg)');
            this.options.parentView.$el.find('.csui-progressbar-maximize').addClass('binf-hidden');
        },

        _doProgressbarAnimation: function (progressPercent) {
            // Calculation to convert horizontal progress bar(100%) to circular progress bar(360 deg) 
            var calc = Math.round(3.6 * progressPercent);
            if (progressPercent <= 50) {
                this.ui.wrapper.css('clip', 'rect(0, 1em, 1em, 0.5em)');
                this.ui.progressLeft.css('transform', 'rotate(' + 360 + 'deg)');
                this.ui.progressRight.css('transform', 'rotate(' + calc + 'deg)');
            }
            if (progressPercent >= 50 && progressPercent <= 100) {
                this.ui.wrapper.css('clip', 'rect(auto, auto, auto, auto)');
                this.ui.progressRight.css('transform', 'rotate(' + 180 + 'deg)');
                this.ui.progressLeft.css('transform', 'rotate(' + calc + 'deg)');
            }
        },

        _onClick: function () {
            this.options.parentView.$el.find('.csui-progressbar-maximize').addClass('binf-hidden');
            this.options.parentView.trigger('processbar:maximize');
        },

        onRender: function () {

        }

    });


    return ProgressbarMaximizeView;
});


csui.define('json!csui/utils/contexts/perspective/impl/perspectives/error.global.json',{
  "type": "grid",
  "options": {
    "rows": [
      {
        "columns": [
          {
            "sizes": {
              "md": 12
            },
            "heights": {
              "xs": "full"
            },
            "widget": {
              "type": "csui/widgets/error.global",
              "options": {
              }
            }
          }
        ]
      }
    ]
  }
}
);

csui.define('csui/widgets/myassignments/myassignments.columns',["csui/lib/backbone"], function (Backbone) {

  var TableColumnModel = Backbone.Model.extend({

    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }

  });

  var TableColumnCollection = Backbone.Collection.extend({

    model: TableColumnModel,
    comparator: "sequence",

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new TableColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }

  });

  // Fixed (system) columns have sequence number < 100, dynamic columns
  // have sequence number > 1000

  var MyAssignmentsTableColumns = new TableColumnCollection([
    {
      key: 'type',
      titleIconInHeader: 'mime_type',
      sequence: 10
    },
    {
      key: 'name',
      sequence: 20
    },
    {
      key: 'location_name',
      sequence: 30
    },
    {
      key: 'date_due',
      sequence: 40
    },
    {
      key: 'priority',
      sequence: 50
    },
    {
      key: 'status',
      sequence: 60
    },
    {
      key: 'from_user_name',
      sequence: 70
    }
  ]);

  return MyAssignmentsTableColumns;

});

csui.define('csui/widgets/myassignments/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/myassignments/impl/nls/root/lang',{
  dialogTitle: 'My Assignments',
  searchTitle: 'Search My Assignments',
  searchPlaceholder: 'My Assignments',
  searchAria: 'Search for assignments',
  expandAria: 'Expand the My Assignments widget',
  emptyListText: 'No item to display.',
  loadingListText: 'Loading results...',
  loadingText : "Loading my assignments",
  failedListText: 'Loading results failed.',
  openMyAssignmentsView: 'Open my assignments view'

  // Note: column titles are defined on the module
  // Note: use the exact 'column_key' for the client-side column titles
});



csui.define('css!csui/widgets/myassignments/impl/myassignments',[],function(){});
// Shows a list of links to current user's assignments
csui.define('csui/widgets/myassignments/myassignments.view',['module', 'csui/lib/underscore',
  'csui/utils/base',
  'csui/lib/marionette',
  'csui/controls/list/list.view',
  'csui/controls/listitem/listitemstateful.view',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/list/behaviors/list.view.keyboard.behavior',
  'csui/behaviors/collection.state/collection.state.behavior',
  'csui/controls/list/list.state.view',
  'csui/utils/contexts/factories/myassignments',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/progressblocker/blocker',
  'i18n!csui/widgets/myassignments/impl/nls/lang',
  'css!csui/widgets/myassignments/impl/myassignments'
], function (module, _, base, Marionette, ListView, ExpandedListitem, LimitingBehavior,
    ExpandingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    MyAssignmentCollectionFactory, ApplicationScopeModelFactory, NodeTypeIconView, BlockingView, lang) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    openInPerspective: true
  });

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var MyAssignmentsView = ListView.extend({

    constructor: function MyAssignmentsView(options) {
      options || (options = {});
      _.defaults(options, {orderBy: 'date_due asc'});
      options.data || (options.data = {});
      options.data.titleBarIcon = options.data.showTitleIcon === false ?
                                  undefined : 'title-icon title-assignments';

      var context = options.context,
          viewStateModel = context && context.viewStateModel;
      this._enableOpenPerspective = config.openInPerspective &&
                                    viewStateModel && viewStateModel.get('history');

      ListView.prototype.constructor.apply(this, arguments);
      this.loadingText=lang.loadingText;
      BlockingView.imbue(this);
      this.context = context;
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
    },

    childEvents: {
      'click:item': 'onClickItem',
      'render': 'onRenderItem',
      'before:destroy': 'onBeforeDestroyItem'
    },

    templateHelpers: function () {
      return {
        title: this.options.data.title || lang.dialogTitle,
        icon: this.options.data.titleBarIcon,
        searchPlaceholder: lang.searchPlaceholder,
        searchTitle: lang.searchTitle,
        searchAria: lang.searchAria,
        expandAria: lang.expandAria,
        openPerspectiveAria: lang.openMyAssignmentsView,
        openPerspectiveTooltip: lang.openMyAssignmentsView,
        enableOpenPerspective: this._enableOpenPerspective
      };
    },

    childView: ExpandedListitem,

    childViewOptions: {
      templateHelpers: function () {

        var dueDate = this.model.get('date_due');
        var dateValue = new Date(dueDate);
        var currentDate = new Date();
        var infoState = dateValue < currentDate ? 'Warning' : 'Success';
        var info = base.formatFriendlyDate(dueDate);
        var description = this.model.get('description');
        var type_name = this.model.get('location_name') || this.model.get('type_name');
        type_name || (type_name = "Workflow");
        description || (description = type_name);

        return {
          name: this.model.get('short_name'),
          enableIcon: true,
          description: description,
          info: info,
          infoState: infoState,
          type: type_name
        };
      },
      checkDefaultAction: true
    },

    behaviors: {
      LimitedList: {
        behaviorClass: LimitingBehavior,
        completeCollection: function () {
          var collection = this.options.collection ||
                           this.options.context.getCollection(MyAssignmentCollectionFactory);
          // Limit the scope of the response
          collection.excludeResources();
          collection.resetFields();
          collection.setFields({assignments: []});
          collection.resetExpand();
          return collection;
        },
        limit: 0
      },
      ExpandableList: {
        behaviorClass: ExpandingBehavior,
        expandedView: 'csui/widgets/myassignmentstable/myassignmentstable.view',
        orderBy: function () { return this.options.orderBy; },
        titleBarIcon: function () { return this.options.data.titleBarIcon; },
        dialogTitle: lang.dialogTitle,
        dialogTitleIconNameRight: "csui_action_minimize32",
        dialogClassName: 'assignments'
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        collection: function () {
          return this.completeCollection;
        },
        stateView: ListStateView,
        stateMessages: {
          empty: lang.emptyListText,
          loading: lang.loadingListText,
          failed: lang.failedListText
        }
      }
    },

    onRender: function () {
      ListView.prototype.onRender.apply(this, arguments);
      this.$el.addClass('cs-assignments');
    },

    onRenderItem: function (childView) {
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$('.csui-type-icon').get(0),
        node: childView.model
      });
      childView._nodeIconView.render();

      childView.$el.attr('role', 'option');
    },

    onBeforeDestroyItem: function (childView) {
      if (childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    },

    onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    onClickHeader: function (target) {
      this.onClickOpenPerspective(target);
    },

    onClickOpenPerspective: function (target) {
      this.applicationScope.set('id','myassignments');
      this.trigger('open:myassignments:perspective');
    }

  });

  return MyAssignmentsView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/placeholder/impl/placeholder',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return container.escapeExpression(((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"label","hash":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":9}}}) : helper)))
    + "\r\n";
}});
Handlebars.registerPartial('csui_widgets_placeholder_impl_placeholder', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/placeholder/impl/placeholder',[],function(){});
csui.define('csui/widgets/placeholder/placeholder.view',['csui/lib/backbone', 'csui/lib/marionette',
  'hbs!./impl/placeholder', 'css!./impl/placeholder'
], function (Backbone, Marionette, placeholderTemplate) {

  var PlaceholderView = Marionette.ItemView.extend({

    className: 'cs-placeholder tile',
    template: placeholderTemplate,

    constructor: function PlaceholderView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!options.model) {
        options.model = new Backbone.Model({
          label: options.data.label,
          bgcolor: options.data.bgcolor,
          color: options.data.color
        });
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    onRender: function () {
      this.$el.css({
        color: this.model.get('color'),
        backgroundColor: this.model.get('bgcolor')
      });
    }

  });

  return PlaceholderView;
});

csui.define('csui/widgets/recentlyaccessed/recentlyaccessed.columns',["csui/lib/backbone"], function (Backbone) {

  var TableColumnModel = Backbone.Model.extend({

    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }

  });

  var TableColumnCollection = Backbone.Collection.extend({

    model: TableColumnModel,
    comparator: "sequence",

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new TableColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }

  });

  // Fixed (system) columns have sequence number < 100, dynamic columns
  // have sequence number > 1000

  var RecentlyAccessedTableColumns = new TableColumnCollection([
    {
      key: 'type',
      titleIconInHeader: 'mime_type',
      sequence: 10
    },
    {
      key: 'name',
      sequence: 20
    },
    {
      key: 'reserved',
      title: 'State',
      sequence: 30,
      noTitleInHeader: true // don't display a column header
    },
    {
      key: 'parent_id',
      sequence: 40
    },
    {
      key: 'access_date_last',
      sequence: 50
    },
    {
      key: 'size',
      sequence: 60
    },
    {
      key: 'modify_date',
      sequence: 70
    },
    {
      key: 'favorite',
      sequence: 910,
      noTitleInHeader: true, // don't display a column header
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  ]);

  return RecentlyAccessedTableColumns;

});

csui.define('csui/widgets/recentlyaccessed/tileview.toolbaritems',['csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/recentlyaccessed/tileview.toolbaritems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';
  var toolbarItems = {

    // inline action bar
    inlineActionbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              commandData: {dialogView: true},
              iconName: "csui_action_properties32"
            },
            {
              signature: "DocPreview",
              name: lang.ToolbarItemDocPreview,
              iconName: "csui_action_preview32",
              commandData: {
                ifNotOpenDelegate: true,
                fullView: false,
                includeContainers: false
              }
            }
          ],
          share: [
            {
              signature: "CopyLink", name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {
              signature: "Edit", name: lang.ToolbarItemEdit,
              iconName: "csui_action_edit32"
            }
          ],
          other: [
            {
              signature: "Download", name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "goToLocation", name: lang.ToolbarGoToLocation
            }
          ]
        },
        {
          maxItemsShown: 1,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});

csui.define('csui/widgets/recentlyaccessed/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/recentlyaccessed/impl/nls/root/lang',{
  dialogTitle: 'Recently Accessed',
  searchTitle: 'Search Recently Accessed',
  searchPlaceholder: 'Recently Accessed',
  searchAria: 'Search for recently accessed objects',
  expandAria: 'Expand the Recently Accessed widget',
  emptyListText: 'There are no items to display.',
  loadingListText: 'Loading results...',
  loadingText: "Loading recently accessed",
  failedListText: 'Loading results failed.',
  // Note: use the exact 'column_key' for the client-side column titles
  access_date_last: 'Last Accessed',
  parent_id: 'Location',
  openRecentlyAccessedView: 'Open recently accessed view'
});



csui.define('css!csui/widgets/recentlyaccessed/impl/recentlyaccessed',[],function(){});
// Shows a list of links to current user's recently accessed nodes
csui.define('csui/widgets/recentlyaccessed/recentlyaccessed.view',['module', 'csui/lib/underscore', 'csui/lib/marionette',
  'csui/controls/list/list.view',
  'csui/controls/listitem/listitemstandard.view',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/list/behaviors/list.view.keyboard.behavior',
  'csui/behaviors/collection.state/collection.state.behavior',
  'csui/controls/list/list.state.view',
  'csui/utils/contexts/factories/recentlyaccessed',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/progressblocker/blocker',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/commands',
  'csui/widgets/recentlyaccessed/tileview.toolbaritems',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/base',
  'i18n!csui/widgets/recentlyaccessed/impl/nls/lang',
  'i18n!csui/controls/listitem/impl/nls/lang',
  'css!csui/widgets/recentlyaccessed/impl/recentlyaccessed'
], function (module, _, Marionette, ListView, ListItemStandard,
    LimitingBehavior, ExpandingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    RecentlyAccessedCollectionFactory, NodeTypeIconView, BlockingView, ApplicationScopeModelFactory,
    commands, tileViewToolbarItems, GlobalMessage, base, lang, listItemLang) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    openInPerspective: true
  });

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var RecentlyAccessedView = ListView.extend({

    constructor: function RecentlyAccessedView(options) {
      options || (options = {});
      _.defaults(options, {orderBy: 'access_date_last desc'});
      options.data || (options.data = {});
      options.data.titleBarIcon = options.data.showTitleIcon === false ?
                                  undefined : 'title-icon title-recentlyaccessed';

      options.tileViewToolbarItems = tileViewToolbarItems;
      this.context = options.context;
      this.showInlineActionBar = options.showInlineActionBar === false ?
                                 options.showInlineActionBar : true;

      var context        = options.context,
          viewStateModel = context && context.viewStateModel;
      this._enableOpenPerspective = config.openInPerspective &&
                                    viewStateModel && viewStateModel.get('history');

      ListView.prototype.constructor.call(this, options);
      this.loadingText = lang.loadingText;
      BlockingView.imbue(this);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
    },

    childEvents: {
      'click:item': 'onClickItem',
      'render': 'onRenderItem',
      'before:destroy': 'onBeforeDestroyItem'
    },

    templateHelpers: function () {
      return {
        title: this.options.data.title || lang.dialogTitle,
        icon: this.options.data.titleBarIcon,
        searchPlaceholder: lang.searchPlaceholder,
        searchTitle: lang.searchTitle,
        searchAria: lang.searchAria,
        expandAria: lang.expandAria,
        openPerspectiveAria: lang.openRecentlyAccessedView,
        openPerspectiveTooltip: lang.openRecentlyAccessedView,
        enableOpenPerspective: this._enableOpenPerspective
      };
    },

    childView: ListItemStandard,

    childViewOptions: function () {
      var toolbarData = this.showInlineActionBar ? {
        toolbaritems: this.options.tileViewToolbarItems,
        collection: this.completeCollection
      } : undefined;

      return {
        templateHelpers: function () {
          return {
            name: this.model.get('short_name'),
            enableIcon: true,
            showInlineActionBar: this.showInlineActionBar,
            itemLabel: _.str.sformat(listItemLang.itemTitleLabel, this.model.get('short_name'))
          };
        },
        context: this.context,
        checkDefaultAction: true,
        // Set these values in order to display Inline Actions
        toolbarData: toolbarData,
        refetchNodeActions: true
      };
    },

    behaviors: {
      LimitedList: {
        behaviorClass: LimitingBehavior,
        completeCollection: function () {
          //add edit permissions Action
          var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);
          var collection = this.options.collection ||
                           this.options.context.getCollection(RecentlyAccessedCollectionFactory, {
                             options: {
                               promotedActionCommands: [],
                               nonPromotedActionCommands: nonPromotedActionCommands
                             }
                           });
          var limitedRS = RecentlyAccessedCollectionFactory.getLimitedResourceScope();
          //add editpermissions command action to fetch node level edit permissions - LPAD-72260
          limitedRS && limitedRS.commands && limitedRS.commands.push('editpermissions');
          collection.setResourceScope(limitedRS);
          collection.setEnabledDelayRestCommands(false);
          collection.setEnabledLazyActionCommands(false);
          return collection;
        },
        limit: 0
      },
      ExpandableList: {
        behaviorClass: ExpandingBehavior,
        expandedView: 'csui/widgets/recentlyaccessedtable/recentlyaccessedtable.view',
        orderBy: function () { return this.options.orderBy; },
        titleBarIcon: function () { return this.options.data.titleBarIcon; },
        dialogTitle: lang.dialogTitle,
        dialogTitleIconNameRight: "csui_action_minimize32",
        dialogClassName: 'recentlyaccessed'
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListViewKeyboardBehavior: {
        behaviorClass: ListViewKeyboardBehavior
      },
      CollectionState: {
        behaviorClass: CollectionStateBehavior,
        collection: function () {
          return this.completeCollection;
        },
        stateView: ListStateView,
        stateMessages: {
          empty: lang.emptyListText,
          loading: lang.loadingListText,
          failed: lang.failedListText
        }
      }
    },

    onRender: function () {
      ListView.prototype.onRender.apply(this, arguments);
      this.$el.addClass('cs-recentlyaccessed');

      if (this.completeCollection.delayedActions) {
        this.listenTo(this.completeCollection.delayedActions, 'error',
            function (collection, request, options) {
              var error = new base.Error(request);
              GlobalMessage.showMessage('error', error.message);
            });
      }
    },

    onRenderItem: function (childView) {
      childView._nodeIconView = new NodeTypeIconView({
        el: childView.$('.csui-type-icon').get(0),
        node: childView.model
      });
      childView._nodeIconView.render();

      childView.$el.attr('role', 'option');
      childView.$el.attr('aria-label',
          _.str.sformat(listItemLang.typeAndNameAria, childView._nodeIconView.model.get('title'),
              childView.model.get('short_name')));
    },

    onBeforeDestroyItem: function (childView) {
      if (childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    },

    onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    onClickHeader: function (target) {
      this.onClickOpenPerspective(target);
    },

    onClickOpenPerspective: function (target) {
      this.applicationScope.set('id', 'recentlyaccessed');
      this.trigger('open:recentlyaccessed:perspective');
    }

  });

  return RecentlyAccessedView;

});

csui.define('csui/widgets/generic.tile/tileview.toolbaritems',['csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory'
], function (_, lang, ToolItemsFactory) {
  'use strict';
  var toolbarItems = {

    // inline action bar
    inlineActionbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              commandData: {dialogView: true},
              iconName: "csui_action_properties32"
            },
            {
              signature: "DocPreview",
              name: lang.ToolbarItemDocPreview,
              iconName: "csui_action_preview32",
              commandData: {
                ifNotOpenDelegate: true,
                fullView: false,
                includeContainers: false
              }
            }
          ],
          share: [
            {
              signature: "CopyLink", name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {
              signature: "Edit", name: lang.ToolbarItemEdit,
              iconName: "csui_action_edit32"
            }
          ],
          other: [
            {
              signature: "Download", name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "goToLocation", name: lang.ToolbarGoToLocation
            }
          ]
        },
        {
          maxItemsShown: 1,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };

  return toolbarItems;

});

csui.define('csui/widgets/generic.tile/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/generic.tile/nls/root/lang',{
  searchButtonMessage: "Search",
  title: "Search Query Results",
  dialogTitle: 'Search Query Results',
  searchTitle: 'Search',
  searchPlaceholder: 'Search',
  searchAria: 'Search in Search Results',
  expandAria: 'Expand the Search Query Results',
  emptyListText: 'There are no items to display.',
  loadingListText: 'Loading results...',
  loadingText: "Loading tile",
  failedListText: 'Loading results failed.',
  openSearchCustomResultsView: 'Open Search Query Results view'
});


csui.define('csui/widgets/generic.tile/generic.tile.view',['module', 'csui/lib/underscore',
    'csui/controls/list/list.view',
    'csui/controls/listitem/listitemstandard.view',
    'csui/behaviors/limiting/limiting.behavior',
    'csui/behaviors/default.action/default.action.behavior',
    'csui/behaviors/keyboard.navigation/tabable.region.behavior',
    'csui/controls/list/behaviors/list.view.keyboard.behavior',
    'csui/behaviors/collection.state/collection.state.behavior',
    'csui/controls/list/list.state.view',
    'csui/controls/node-type.icon/node-type.icon.view',
    'csui/controls/progressblocker/blocker',
    'csui/utils/contexts/factories/application.scope.factory',
    'csui/utils/commands',
    'csui/widgets/generic.tile/tileview.toolbaritems',
    'csui/controls/globalmessage/globalmessage',
    'csui/utils/base',
    'i18n!csui/widgets/generic.tile/nls/lang',
    'i18n!csui/controls/listitem/impl/nls/lang',
], function (module, _, ListView, ListItemStandard,
    LimitingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    NodeTypeIconView, BlockingView, ApplicationScopeModelFactory,
    commands, tileViewToolbarItems, GlobalMessage, base, lang, listItemLang) {
    'use strict';

    var config = _.defaults({}, module.config(), {
        openInPerspective: true,
        filterByProperty : "name"
    });

    /*
     Constructor options:
      -- showTitleIcon: boolean to show or hide the icon in the title bar
    */
    var GenericTileView = ListView.extend({

        constructor: function GenericTileView(options) {
            options || (options = {});
            options.data || (options.data = {});

            _.defaults(options, {
                titleBarIconName: 'title-icon title-customviewsearch',
                loadingText: lang.loadingText
            });

            options.data.titleBarIcon = options.data.showTitleIcon === false ?
                undefined : options.titleBarIconName;

            options.tileViewToolbarItems = tileViewToolbarItems;
            this.context = options.context;
            this.showInlineActionBar = options.showInlineActionBar === false ?
                options.showInlineActionBar : true;

            var viewStateModel = this.context && this.context.viewStateModel;
            this._enableOpenPerspective = config.openInPerspective &&
                viewStateModel && viewStateModel.get('history');

            this.options = options;

            var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);
            //Create unique id to handle edge cases of user creating multiple widgets with same query id
            var factoryUID = this.options.data.savedSearchQueryId + Math.floor(Math.random() * 100);
            this.collection = this.options.collection ||
                this.options.context.getCollection(this.options.collectionFactory, {
                    options: {
                        promotedActionCommands: [],
                        nonPromotedActionCommands: nonPromotedActionCommands,
                        factoryUID: factoryUID,
                        query_id: this.options.data.savedSearchQueryId,
                        limit: this.options.limit,
                        isTileView: this.options.isTileView
                    }
                });
            var limitedRS = this.options.collectionFactory.getLimitedResourceScope();
            //add editpermissions command action to fetch node level edit permissions - LPAD-72260
            limitedRS && limitedRS.commands && limitedRS.commands.push('editpermissions');
            this.collection.setEnabledDelayRestCommands(false);
            this.collection.setEnabledLazyActionCommands(false);

            ListView.prototype.constructor.call(this, options);
            this.loadingText = options.loadingText;
            BlockingView.imbue(this);
            this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
        },

        childEvents: {
            'click:item': 'onClickItem',
            'render': 'onRenderItem',
            'before:destroy': 'onBeforeDestroyItem'
        },

        templateHelpers: function () {
            return {
                title: this.options.displayName || this.options.data.title || lang.dialogTitle,
                icon: this.options.titleBarIconName,
                searchPlaceholder: this.options.searchPlaceholder || lang.searchPlaceholder,
                searchTitle: lang.searchTitle,
                searchAria: lang.searchAria,
                expandAria: lang.expandAria,
                openPerspectiveAria: lang.openSearchCustomResultsView,
                openPerspectiveTooltip: lang.openSearchCustomResultsView,
                enableOpenPerspective: this._enableOpenPerspective
            };
        },

        childView: ListItemStandard,


        childViewOptions: function () {
            var toolbarData = this.showInlineActionBar ? {
                toolbaritems: this.options.tileViewToolbarItems,
                collection: this.collection
            } : undefined;

            return {
                templateHelpers: function () {
                    return {
                        name:  this.model.get('short_name') || this.model.get('name'),
                        enableIcon: true,
                        showInlineActionBar: this.showInlineActionBar,
                        itemLabel: _.str.sformat(listItemLang.itemTitleLabel,  this.model.get('short_name') || this.model.get('name'))
                    };
                },
                context: this.context,
                checkDefaultAction: true,
                // Set these values in order to display Inline Actions
                toolbarData: toolbarData,
                refetchNodeActions: true
            };
        },

        behaviors: {
            DefaultAction: {
                behaviorClass: DefaultActionBehavior
            },
            TabableRegion: {
                behaviorClass: TabableRegionBehavior
            },
            ListViewKeyboardBehavior: {
                behaviorClass: ListViewKeyboardBehavior
            },
            CollectionState: {
                behaviorClass: CollectionStateBehavior,
                collection: function () {
                    return this.completeCollection;
                },
                stateView: ListStateView,
                stateMessages: function() {
                    return {
                        empty: this.options.emptyListText || lang.emptyListText,
                        loading:this.options.loadingListText || lang.loadingListText,
                        failed: this.options.failedListText || lang.failedListText
                    };
                }
            }
        },

        onRender: function () {
            ListView.prototype.onRender.apply(this, arguments);
            if (this.collection.delayedActions) {
                this.listenTo(this.collection.delayedActions, 'error',
                    function (collection, request, options) {
                        var error = new base.Error(request);
                        GlobalMessage.showMessage('error', error.message);
                    });
            }
            this.listenTo(this, 'change:filterValue', this.filterCollection);
            this.listenTo(this.collection, 'sync', function () {
                this.completeCollection = this.collection.clone();
            });
        },
        
        filterCollection: function () {
            var models;
            if (this.options.filterValue && this.options.filterValue.length > 0) {
                var keywords = this.options.filterValue.toLowerCase().split(' ');
                var filterByProperty = config.filterByProperty;

                this.currentFilter = {};
                this.currentFilter[filterByProperty] = this.options.filterValue.toLowerCase();

                models = this.completeCollection.filter(function (item) {
                    var name = item.get(filterByProperty),
                        isMatch;
                    if (name) {
                        name = name.trim().toLowerCase();
                        isMatch = _.reduce(keywords, function (result, keyword) {
                            return result && name.indexOf(keyword) >= 0;
                        }, true);
                    }
                    return isMatch;
                });
            } else {
                // no filtering
                this.currentFilter = undefined;
                models = this.completeCollection.models;
            }
            this.collection.reset(models);
        },

        onRenderItem: function (childView) {
            childView._nodeIconView = new NodeTypeIconView({
                el: childView.$('.csui-type-icon').get(0),
                node: childView.model
            });
            childView._nodeIconView.render();

            childView.$el.attr('role', 'option');
            childView.$el.attr('aria-label',
                _.str.sformat(listItemLang.typeAndNameAria, childView._nodeIconView.model.get('title'),
                    childView.model.get('short_name') ? childView.model.get('short_name') : childView.model.get('name') )); 
        },

        onBeforeDestroyItem: function (childView) {
            if (childView._nodeIconView) {
                childView._nodeIconView.destroy();
            }
        },

        onClickItem: function (target) {
            this.triggerMethod('execute:defaultAction', target.model);
        },

    });

    return GenericTileView;

});
csui.define('csui/widgets/search.results.tile/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.results.tile/impl/nls/root/lang',{
  searchButtonMessage: "Search",
  title: "Search Query Results",
  dialogTitle: 'Search Query Results',
  searchTitle: 'Search',
  searchPlaceholder: 'Search',
  searchAria: 'Search in Search Results',
  expandAria: 'Expand the Search Query Results',
  emptyListText: 'There are no items to display.',
  loadingListText: 'Loading results...',
  loadingText: "Loading search results",
  failedListText: 'Loading results failed.',
  openSearchCustomResultsView: 'Open Search Query Results view'
});


csui.define('csui/widgets/search.results.tile/search.results.tile.view',['module', 'csui/lib/underscore',
  'csui/widgets/generic.tile/generic.tile.view',
  'csui/utils/namedlocalstorage',
  'csui/utils/contexts/factories/search.results.table.factory',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/behaviors/collection.error/collection.error.behavior',
  'i18n!csui/widgets/search.results.tile/impl/nls/lang',
], function (module, _, GenericTileView, NamedLocalStorage,
    SearchResultsCollectionFactory, InfiniteScrollingBehavior, CollectionErrorBehavior, lang) {
  'use strict';

  var config = _.extend({
    limit: 20
  }, module.config());

  /*
   Constructor options:
    -- showTitleIcon: boolean to show or hide the icon in the title bar
  */
  var SearchResultsTileView = GenericTileView.extend({

    namedLocalStorage: new NamedLocalStorage('widgetOptions'),

    constructor: function SearchResultsTileView(options) {
      options || (options = {});
      options.titleBarIcon = options.data.showTitleIcon === false ?
        undefined : 'title-icon title-customviewsearch';
      options.isTileView = true;
      options.loadingText = lang.loadingText;
      options.displayName = options.data.displayName;
      options.limit = config.limit;
      options.collectionFactory = SearchResultsCollectionFactory;
      this.behaviors = _.extend({
        InfiniteScrolling: {
          behaviorClass: InfiniteScrollingBehavior,
          contentParent: ".tile-content"
        },
        CollectionError: {
          behaviorClass: CollectionErrorBehavior
        }
      }, this.behaviors);
      GenericTileView.prototype.constructor.call(this, options);
      this.bindEventListeners();
    },

    bindEventListeners: function () {
      this.listenTo(this, 'before:collection:scroll:fetch', _.bind(function () {
        this.blockActions();
      }, this));
      this.listenTo(this, 'collection:scroll:fetch', function () {
        this.scrollTop = this.$el.find(".tile-content").scrollTop();
        this.render();
      });
      this.listenTo(this, 'render', _.bind(function () {
        if (this.scrollTop) {
          this.$el.find(".tile-content").scrollTop(this.scrollTop);
        }
      }, this));

    },

    handleError: function () {
      this.errorExists = true;
      this.$el.addClass('csui-list-view-error');
      this.$el.find('.csui-message').html(this.collection.error.message);
    },

    onClickOpenPerspective: function (target) {
      var query_id          = this.options.data.savedSearchQueryId ||
                              this.options.savedSearchQueryId,
          widgetDisplayName = this.options.data.displayName || lang.dialogTitle,
          options           = this.namedLocalStorage.get(query_id) || {};
      if (!!widgetDisplayName) {
        var widgetOptions = _.extend(options, {name: widgetDisplayName});
        this.namedLocalStorage.set(query_id, widgetOptions);
      }
      this.applicationScope.set('query_id', query_id);
      this.applicationScope.set('id', 'searchresults');
      this.trigger('open:searchresults:perspective');
    }

  });

  return SearchResultsTileView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcut/impl/shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-header\">\r\n  <div class=\"tile-title\">\r\n    <h2 class=\"csui-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"short_name") || (depth0 != null ? lookupProperty(depth0,"short_name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"short_name","hash":{},"loc":{"start":{"line":3,"column":29},"end":{"line":3,"column":43}}}) : helper)))
    + "</h2>\r\n  </div>\r\n</div>\r\n\r\n<div class=\"tile-icon\">\r\n  <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":8,"column":19},"end":{"line":8,"column":27}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":8,"column":36},"end":{"line":8,"column":45}}}) : helper)))
    + "\"></div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_shortcut_impl_shortcut', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/shortcut/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/shortcut/impl/nls/root/lang',{
  loadingText: 'Loading...'
});



csui.define('css!csui/widgets/shortcut/impl/shortcut',[],function(){});
// Shows the Shortcut widget of a specific node
csui.define('csui/widgets/shortcut/shortcut.view',[
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/utils/contexts/factories/node', 'csui/utils/node.links/node.links',
  'csui/utils/defaultactionitems', 'csui/utils/commands',
  'hbs!csui/widgets/shortcut/impl/shortcut',
  'i18n!csui/widgets/shortcut/impl/nls/lang',
  'css!csui/widgets/shortcut/impl/shortcut',
], function (Backbone, Marionette, DefaultActionBehavior, TabableRegionBehavior,
    ItemErrorBehavior, NodeModelFactory, nodeLinks, defaultActionItems, commands,
    shortcutTemplate, lang) {
  'use strict';

  //
  // Constructor options:
  // - node.id: The object (node) ID.  Either node.id or node.type is mandatory.
  // - node.type: The object type for known volumes (e.g. type=141 for Enterprise Workspace)
  // - icon: css icon class
  // - background: css background class
  //
  var ShortcutView = Marionette.ItemView.extend({
    tagName: 'a',

    attributes: {
      href: '#'
    },

    className: function () {
      var background = this.options.data.background || 'cs-tile-background-default';
      return 'cs-shortcut tile ' + background;
    },

    modelEvents: {
      'change': 'render'
    },

    triggers: {
      'click': 'click:link'
    },

    template: shortcutTemplate,

    templateHelpers: function () {
      var name, short_name, first_space;
      if (this.model.fetched) {
        name = this.getName();
        short_name = name.length > 38 ? name.substr(0, 38) + '...' : name;
        first_space = short_name.indexOf(' ');
        if (short_name.length >= 20 && (first_space < 0 || first_space > 20)) {
          short_name = short_name.substr(0, 18) + '...';
        }
      } else {
        short_name = lang.loadingText;
      }
      return {
        short_name: short_name,
        icon: this.options.data.icon || "icon-folder",
        title: name
      };
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },

      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },

      ItemError: {
        behaviorClass: ItemErrorBehavior
      }
    },

    events: {"keydown": "onKeyInView"},

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod("click:link");
      }
    },

    constructor: function ShortcutView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!options.model) {
        options.model = options.context.getModel(NodeModelFactory, {
          attributes: {
            id: options.data.id || 'volume',
            type: options.data.type
          }
        });
      }

      Marionette.ItemView.prototype.constructor.call(this, options);

      // Limit the scope of the response
      this.model.excludeResources();
      this.model.resetFields();
      this.model.setFields({
        'properties': ['container', 'id', 'name', 'original_id', 'type'],
        'versions.element(0)': ['mime_type']
      });
      this.model.resetExpand();
      this.model.setExpand({
        properties: ['original_id']
      });
      this.model.resetCommands();
      this.model.setCommands(defaultActionItems.getAllCommandSignatures(commands));
    },

    onRender: function () {
      var disabled = !this.model.fetched ||
                     !this.defaultActionController.hasAction(this.model);
      this.$el[disabled ? 'addClass' : 'removeClass']('csui-disabled');
      this.$el.attr('href', nodeLinks.getUrl(this.model) || '#');
    },

    getName: function() {
      if(( this.options.data.displayName || "" ).trim().length > 0) {
        return this.options.data.displayName;
      } else {
        return this.model.get('name') || '';
      }
    },

    onClickLink: function () {
      this.triggerMethod('execute:defaultAction', this.model);
    }
  });

  return ShortcutView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-details\">\r\n    <div class=\"tile-icon\">\r\n        <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":50}}}) : helper)))
    + "\" aria-hidden=\"true\"></div>\r\n    </div>\r\n\r\n    <div class=\"tile-title\">\r\n        <span class=\"csui-heading\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"shortcutAria") || (depth0 != null ? lookupProperty(depth0,"shortcutAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"shortcutAria","hash":{},"loc":{"start":{"line":7,"column":47},"end":{"line":7,"column":63}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":7,"column":65},"end":{"line":7,"column":73}}}) : helper)))
    + "</span>\r\n    </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_shortcuts_impl_shortcut_impl_small.shortcut', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-details\">\r\n    <div class=\"tile-icon\">\r\n        <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":50}}}) : helper)))
    + "\" aria-hidden=\"true\"></div>\r\n    </div>\r\n\r\n    <div class=\"tile-title\">\r\n        <span class=\"csui-heading\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"shortcutAria") || (depth0 != null ? lookupProperty(depth0,"shortcutAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"shortcutAria","hash":{},"loc":{"start":{"line":7,"column":47},"end":{"line":7,"column":63}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":7,"column":65},"end":{"line":7,"column":73}}}) : helper)))
    + "</span>\r\n    </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_shortcuts_impl_shortcut_impl_medium.shortcut', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"tile-group\">\r\n    <div class=\"tile-icon\">\r\n        <div class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"icon") || (depth0 != null ? lookupProperty(depth0,"icon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon","hash":{},"loc":{"start":{"line":3,"column":25},"end":{"line":3,"column":33}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":50}}}) : helper)))
    + "\" aria-hidden=\"true\"></div>\r\n    </div>\r\n    <div class=\"tile-title\">\r\n        <span class=\"csui-heading\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"shortcutAria") || (depth0 != null ? lookupProperty(depth0,"shortcutAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"shortcutAria","hash":{},"loc":{"start":{"line":6,"column":47},"end":{"line":6,"column":63}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":6,"column":65},"end":{"line":6,"column":73}}}) : helper)))
    + "</span>\r\n    </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_shortcuts_impl_shortcut_impl_large.shortcut', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/shortcuts/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/shortcuts/impl/nls/root/lang',{
  loadingText: 'Loading shortcuts...',
  shortcutPrefixAria: 'Shortcut to {0}',
  addShortcut: 'Add shortcut',
  removeShortcut: 'Remove shortcut',
  removeShortcutCnfrmMsg: 'Shortcut will be removed from the group.',
  groupAria: 'Shortcut Group',
  emptyGroup: 'Add a shortcut to the group. Max. 4 shortcuts can be added',
  maxItemsGroup: 'Shortcut group, 4 shortcuts added. Press "Enter" to access the list of shortcuts. Press "Ctrl+ Right or Left Arrow" to move the shortcut group to the right or left.',
  addShortcutToGroup: 'Add shortcut to the group',
  shortcutSettings: '{0} shortcut settings',
  accessShortcutActions: 'Shortcut {0}, press ENTER to access its actions',
  shortcutGroupWithOneItem: 'Shortcut Group. {0} shortcut added. {1} more can be added. Press Enter to access the list of shortcuts. Press Ctrl+ Right or Left Arrow to move the shortcut group to the right or left.',
  shortcutGroupWithMixedItems: 'Shortcut Group. {0} shortcuts added. {1} more can be added. Press Enter to access the list of shortcuts. Press Ctrl+ Right or Left Arrow to move the shortcut group to the right or left.',
  removeShortcutItem: 'Remove {0} Shortcut'
});



csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/shortcut',[],function(){});

csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',[],function(){});

csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',[],function(){});

csui.define('css!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut',[],function(){});
// Shows the Shortcuts widget of specific nodes
csui.define('csui/widgets/shortcuts/impl/shortcut/shortcut.view',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/utils/contexts/factories/node',
  'csui/utils/defaultactionitems',
  'csui/utils/commands',
  'csui/utils/node.links/node.links',
  'hbs!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',
  'hbs!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',
  'hbs!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut',
  'i18n!csui/widgets/shortcuts/impl/nls/lang',
  'css!csui/widgets/shortcuts/impl/shortcut/impl/shortcut',
  'css!csui/widgets/shortcuts/impl/shortcut/impl/small.shortcut',
  'css!csui/widgets/shortcuts/impl/shortcut/impl/medium.shortcut',
  'css!csui/widgets/shortcuts/impl/shortcut/impl/large.shortcut'
], function (
    _,
    $,
    Backbone,
    Marionette,
    base,
    DefaultActionBehavior,
    ItemErrorBehavior,
    NodeModelFactory,
    defaultActionItems,
    commands,
    nodeLinks,
    smallShortcutTemplate,
    mediumShortcutTemplate,
    largeShortcutTemplate,
    lang) {

  'use strict';

  //
  // Constructor options:
  // - node.id: The object (node) ID.  Either node.id or node.type is mandatory.
  // - node.type: The object type for known volumes (e.g. type=141 for Enterprise Workspace)
  // - icon: css icon class
  // - theme: css theme class
  //
  var ShortcutView = Marionette.ItemView.extend({

    constructor: function MiniShortcutView(options) {
      options || (options = {});
      options.model = options.model || new Backbone.Model();
      options.model.set(_.defaults(options.model.attributes, {
        icon: ShortcutView.DEFAULT_ICON,
        theme: 'csui-shortcut-theme-grey-shade1',
        layout: 'small',
        id: '',
        displayName: ''
      }));

      Marionette.ItemView.prototype.constructor.call(this, options);
      this.node = this.model.get('node');
      if (!this.node) {
        this._ensureNode();
      }
      this._ensureNodeFetched();
      $(window).on('resize.' + this.cid, this._applyEllipsis.bind(this));
    },

    tagName: 'a',

    className: function () {
      var classArr = [];

      classArr.push('csui-shortcut-item');
      classArr.push('csui-acc-focusable');
      classArr.push(this.model.get('theme'));
      classArr.push('csui-' + this.model.get('layout'));

      return classArr.join(' ');
    },

    getTemplate: function () {
      switch (this.model.get('layout')) {
      case 'small':
        return smallShortcutTemplate;
      case 'medium':
        return mediumShortcutTemplate;
      default:
        return largeShortcutTemplate;
      }
    },

    templateHelpers: function () {
      var scName = this.getName();
      return {
        icon: this.model.get('icon') || ShortcutView.DEFAULT_ICON,
        name: scName,
        shortcutAria: _.str.sformat(lang.shortcutPrefixAria, scName)
      };
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      ItemError: {
        behaviorClass: ItemErrorBehavior,
        model: function () {
          return this.options.model.get('node');
        },
        errorViewOptions: function () {
          return {
            low: this.model.get('layout') === 'small'
          };
        }
      }
    },

    modelEvents: {
      change: 'render',
      'change:shortcutTheme': '_onThemeChange',
      'change:id': '_ensureNode',
      'change:type': '_ensureNode'
    },

    events: {
      'click': 'onClicked',
      'keydown': 'onKeyInView'
    },

    onRender: function () {
      this._updateElement();
      this._updateNodeState();
    },

    onKeyInView: function (event) {
     if (event.keyCode === 32 || event.keyCode === 13) {
        this.trigger('click');
      }
    },

    _updateElement: function() {
      if (!!this.node) {
        this.$el.attr('href', nodeLinks.getUrl(this.node));
      }
      this.$el.attr("class", _.result(this, 'className')).attr("title", this.getName());
    },

    onDomRefresh: function () {
      this._applyEllipsis();
    },

    _applyEllipsis: function () {
      var name = this.$el.find('.tile-title');
      base.applyEllipsis(name, 2);
    },

    onDestroy: function () {
      $(window).off('resize.' + this.cid, this._applyEllipsis.bind(this));
    },

    _onThemeChange: function () {
      this.trigger('change:shortcutTheme');
    },

    onClicked: function (event) {
      if (base.isControlClick(event)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
        event.preventDefault();
        this.triggerMethod('execute:defaultAction', this.node);
      }
    },

    getName: function () {
      if ((this.model.get('displayName') || "").trim().length > 0) {
        return this.model.get('displayName');
      } else {
        return this.node.fetched ? this.node.get('name') : lang.loadingText;
      }
    },

    _ensureNode: function () {
      this.node = this.options.context.getModel(NodeModelFactory, {
        attributes: {
          id: this.options.model.get('id') || 'volume',
          type: this.options.model.get('type') || 141
        }
      });
      ShortcutView.prepareModelToFetch(this.node);
      this.model.set('node', this.node, {silent: true});
      this.trigger('update:model', this.node);
      this._ensureNodeFetched();
    },

    _ensureNodeFetched: function () {
      this.listenToOnce(this.node, 'change', this.render);
      this.node.ensureFetched({suppressError: true});
    },
    _updateErrorState: function () {
      if (this.node.error) {
        this.$el.addClass('csui-failed');
        this.$el.removeAttr( "title" );
      } else {
        this.$el.removeClass('csui-failed');
      }
    },
    _updateNodeState: function () {
      if (this.node.fetched && this.defaultActionController.hasAction(this.node)) {
        this.$el.removeClass('csui-disabled');
      } else {
        this.$el.addClass('csui-disabled');
      }
      this._updateErrorState();
    },

    focus: function() {
      this.$el.trigger('focus');
    },

  }, {
    prepareModelToFetch: function (model) {
      // Limit the scope of the response
      model.excludeResources();
      model.resetFields();
      model.setFields({
        'properties': ['container', 'id', 'name', 'original_id', 'type', 'custom_view_search'],
        'versions.element(0)': ['mime_type']
      });
      model.resetExpand();
      model.setExpand({
        properties: ['original_id']
      });
      model.resetCommands();
      model.setCommands(defaultActionItems.getAllCommandSignatures(commands));
    },
    DEFAULT_ICON: 'icon-folder'
  });

  return ShortcutView;

});

csui.define('csui/widgets/shortcuts/impl/nls/shortcuts.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/shortcuts/impl/nls/root/shortcuts.manifest',{
  "widgetTitle": "Shortcut Group",
  "shortcutWidgetTitle": "Shortcut",
  "widgetDescription": "Tile representing a hyperlink to an object; it navigates to its page when clicked",
  "shortcutItemsTitle": "Shortcut Items",
  "shortcutItemsDescription": "Shortcut Items description",
  "idTitle": "Target object",
  "idDescription": "An object to open by this shortcut",
  "typeTitle": "Volume",
  "typeDescription": "Sub-type number of a global volume to open by this shortcut if no object has been selected",
  "displayNameTitle": "Display name",
  "shortcutThemeTitle": "Theme",
  "shortcutThemeDescription": "Styling of the shortcuts",
  "typeEnterpriseVolume": "Enterprise",
  "typePersonalVolume": "Personal",
  "typeCategoryVolume": "Categories",
  "shortcutThemeStone1": "Stone Group 1",
  "shortcutThemeStone2": "Stone Group 2",
  "shortcutThemeTeal1": "Teal Group 1",
  "shortcutThemeTeal2": "Teal Group 2",
  "shortcutThemePink1": "Pink Group 1",
  "shortcutThemePink2": "Pink Group 2",
  "shortcutThemeIndigo1": "Indigo Group 1",
  "shortcutThemeIndigo2": "Indigo Group 2"
});



csui.define('json!csui/widgets/shortcuts/impl/shortcut/shortcut.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{shortcutWidgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      },
      "displayName": {
        "title": "{{displayNameTitle}}",
        "type": "string"
      },
      "type": {
        "title": "{{typeTitle}}",
        "description": "{{typeDescription}}",
        "type": "integer",
        "enum": [
          141,
          142,
          133
        ]
      },
      "shortcutTheme": {
        "title": "{{shortcutThemeTitle}}",
        "description": "{{shortcutThemeDescription}}",
        "type": "string",
        "enum": [
          "csui-shortcut-theme-stone1",
          "csui-shortcut-theme-stone2",
          "csui-shortcut-theme-teal1",
          "csui-shortcut-theme-teal2",
          "csui-shortcut-theme-pink1",
          "csui-shortcut-theme-pink2",
          "csui-shortcut-theme-indigo1",
          "csui-shortcut-theme-indigo2"
        ]
      }
    }
  },
  "options": {
    "fields": {
      "shortcutTheme": {
        "type": "select",
        "optionLabels": [
          "{{shortcutThemeStone1}}",
          "{{shortcutThemeStone2}}",
          "{{shortcutThemeTeal1}}",
          "{{shortcutThemeTeal2}}",
          "{{shortcutThemePink1}}",
          "{{shortcutThemePink2}}",
          "{{shortcutThemeIndigo1}}",
          "{{shortcutThemeIndigo2}}"
        ]
      },
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": [],
            "startLocations": [
             "csui/dialogs/node.picker/start.locations/enterprise.volume",
             "csui/dialogs/node.picker/start.locations/personal.volume",
             "csui/dialogs/node.picker/start.locations/favorites",
             "csui/dialogs/node.picker/start.locations/recent.containers"
           ]
          }
        }
      },
      "type": {
        "type": "select",
        "optionLabels": [
          "{{typeEnterpriseVolume}}",
          "{{typePersonalVolume}}",
          "{{typeCategoryVolume}}"
        ]
      }
    }
  }
});

// Shows the Shortcuts widget of specific nodes
csui.define('csui/widgets/shortcuts/impl/shortcut/editable.shortcut.view',[
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/widgets/shortcuts/impl/shortcut/shortcut.view',
  'csui/models/widget/widget.model',
  'csui/utils/base',
  'i18n!csui/widgets/shortcuts/impl/nls/lang',
  'i18n!csui/widgets/shortcuts/impl/nls/shortcuts.manifest',
  'json!csui/widgets/shortcuts/impl/shortcut/shortcut.manifest.json',
], function (require, _, $, Backbone,
    MiniShortcutView, WidgetModel, base, lang, manifestLang, shortcutManifest) {

  'use strict';

  // Resolve translations.
  shortcutManifest = WidgetModel.resolveLocalizedManifest('shortcut.manifest', shortcutManifest,
      manifestLang);

  /**
   * To be used when shortcutview in editmode to provide configuration capability
   */
  var EditableMiniShortcutView = MiniShortcutView.extend({

    constructor: function EditableMiniShortcutView(options) {
      options || (options = {});
      options.model = options.model || new Backbone.Model();
      this._injectConfigurationBehaviour(options);
      if (options.container.options.data.___pman_isdropped &&
          options.collection.getShortcuts().length === 0) {
        options.model.set('___pman_opencallout', true, {silent: true});
      }
      MiniShortcutView.prototype.constructor.apply(this, arguments);
      this._registerEventHandlers();
    },

    // Use DIV as container, since Anchor shouldn't have focusable elements childrens.
    // Also In EditMode, this shortcut item container, is not required to be a link
    tagName: 'div',

    modelEvents: _.defaults({
      'refresh:mask': 'onRefreshMask',
    }, _.result(MiniShortcutView.prototype, 'modelEvents')),

    onRefreshMask: function () {
      var configOptions = this._getDefaultWidgetConfig();
      this.trigger('refresh:mask', configOptions);
    },

    /**
     *  Keep the masking element attached to the DOM to keep flyout open if the shortcut has a popover flyout
     */
    attachElContent: function (html) {
      var flyoutConfig = this.$el.find('.csui-configure-perspective-widget .pman-widget-popover');
      if (flyoutConfig.length) {
        this.$el.children().not('.csui-configure-perspective-widget').remove();
        this.$el.prepend($(html));
      } else {
        this.$el.html(html);
      }
      return true;
    },

    _getDefaultWidgetConfig: function (options) {
      options || (options = this.options);
      var shortcutItemsInGroup = lang.groupAria + ' ';
      options.collection.getShortcuts().forEach(function (shortcut, index) {
        if (index > 0) {
          shortcutItemsInGroup += ', ';
        }
        shortcutItemsInGroup += (shortcut.get('displayName') || (shortcut.get('node')).get('name'));
      });
      var configOptions = {
        allowReplace: false,
        notifyUpdatesImmediatly: true,
        useEnterToConfigure: this._isNewPlaceholder(options),
        ItemsInGroupAriaLabel: shortcutItemsInGroup
      };
      if (options.collection.getShortcuts().length > 1) {
        configOptions = _.extend(configOptions, {
          removeConfirmTitle: lang.removeShortcut,
          removeConfirmMsg: lang.removeShortcutCnfrmMsg,
          confirmOnRemove: false
        });
      }
      return configOptions;
    },

    _injectConfigurationBehaviour: function (options) {
      var configOptions = this._getDefaultWidgetConfig(options);
      this.behaviors = _.defaults({
        PerspectiveWidgetConfig: _.extend({ // For widget editing
          behaviorClass: require(
              'csui/perspective.manage/behaviours/pman.widget.config.behaviour'),
          widgetConfig: function () {
            return {
              options: options.model.attributes
            };
          },
          manifest: shortcutManifest
        }, configOptions)
      }, this.behaviors);
    },

    isShortcutValid: function (options) {
      var isValid = true;
      if (this.collection.getShortcuts().length === 0 && this.options.perspectiveMode === "edit") {
        isValid = this.isOptionsValid(options);
      }
      return isValid;
    },

    validateConfiguration: function (options) {
      var isValid = this.isShortcutValid(options);
      var action = !isValid ? 'addClass' : 'removeClass';
      this.$el.find(".tile-group")[action]('binf-hidden');
      this.$el[action]('csui-pman-shortcut-error');
      return isValid;
    },

    isOptionsValid: function (options) {
      return (!!options.id || !!options.type);
    },

    _updateShortcut: function (args) {
      if (this.isShortcutValid(args.options)) {
        this.$el.find('.csui-configure-perspective-widget').removeClass(
            'binf-perspective-has-error');
      }
    },

    _registerEventHandlers: function () {
      this.listenTo(this, 'delete:widget', function () {
        delete this.options.container.options.data.___pman_opencallout;
      });
      this.listenTo(this, 'update:widget:options', this._updateShortcut);
    },

    // START of Overriden functions from MiniShortcutView
    _updateElement: function () {
      // Since DIV is being used as container, this doesn't need HREF attribute
      this.$el.attr("class", _.result(this, 'className'));
    },

    _ensureNode: function () {
      if (!this._isNewPlaceholder()) {
        MiniShortcutView.prototype._ensureNode.apply(this, arguments);
      } else {
        // Dummy placeholder node
        this.node = new Backbone.Model();
      }
    },

    _ensureNodeFetched: function () {
      if (!this._isNewPlaceholder()) {
        this.isUpdating = true;
        MiniShortcutView.prototype._ensureNodeFetched.apply(this, arguments);
        delete this.isUpdating;
      }
    },

    _updateNodeState: function () {
      if (!this._isNewPlaceholder()) {
        MiniShortcutView.prototype._updateErrorState.apply(this, arguments);
      }
    },

    getName: function () {
      if (!this._isNewPlaceholder()) {
        return MiniShortcutView.prototype.getName.apply(this, arguments);
      } else {
        return lang.addShortcut;
      }
    },

    onRender: function () {
      MiniShortcutView.prototype.onRender.apply(this, arguments);
      if (this._isNewPlaceholder()) {
        this.$el.addClass('csui-pman-shortcut-new');
      }
      this.$el.addClass('csui-pman-editable-widget');
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
    },

    onDomRefresh: function () {
      var wrapperBtn = this.$el.find('.wrapper-button');
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
      if (this._isNewPlaceholder()) {
        wrapperBtn.attr('aria-label', lang.addShortcutToGroup);
      } else {
        var shortcutName = this.model.get('displayName') || this.model.get('node').get('name');
        wrapperBtn.attr('aria-label', _.str.sformat(lang.accessShortcutActions, shortcutName));
        this.$el.find('.icon-edit').attr('aria-label',
            _.str.sformat(lang.shortcutSettings, shortcutName));
        this.$el.find('.clear-icon').attr('aria-label',
            _.str.sformat(lang.removeShortcutItem, shortcutName));
      }
    },

    onClicked: function (event) {
      event.preventDefault();
      if (!this.$el.find('.pman-widget-popover').has(event.target).length) {
        event.stopPropagation();
      }
    },

    _isNewPlaceholder: function (options) {
      return (options || this.options).model.isAddShortcut();
    },

    focus: function () {
      this.$el.find('.csui-configure-perspective-widget .wrapper-button').trigger('focus');
    }
  });

  return EditableMiniShortcutView;

});


csui.define('css!csui/widgets/shortcuts/impl/shortcuts',[],function(){});
// Shows the Shortcuts widget of specific nodes
csui.define('csui/widgets/shortcuts/shortcuts.view',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/shortcuts/impl/shortcut/shortcut.view',
  'csui/widgets/shortcuts/impl/shortcut/editable.shortcut.view',
  'csui/utils/contexts/factories/node',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/utils/perspective/perspective.util',
  'smart/controls/progressblocker/blocker',
  'i18n!csui/widgets/shortcuts/impl/nls/lang',
  "css!csui/widgets/shortcuts/impl/shortcuts"
], function (_,
    $,
    Backbone,
    Marionette,
    base,
    TabableRegionBehavior,
    MiniShortcutView,
    EditableShortcutView,
    NodeModelFactory,
    ViewEventsPropagationMixin,
    PerspectiveUtil,
    BlockingView,
    lang) {

  'use strict';

  var THEME_SUFFIX = ["shade1", "shade2", "shade3", "shade4"];

  var ShortcutModel = Backbone.Model.extend({
    idAttribute: 'shortcutItemId',

    isAddShortcut: function () {
      return this.get('isAddNew') === true;
    }
  });

  var ShortcutsCollection = Backbone.Collection.extend({

    constructor: function (models, options) {
      options || (options = {});
      _.defaults(options, {
        model: ShortcutModel,
        comparator: function (a, b) {
          if (b.get('isAddNew')) {
            return -1;
          }
          return 0;
        }
      });
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    getShortcuts: function () {
      return this.filter(function (model) {
        return !model.isAddShortcut();
      });
    },

    evaluateAddNewExistence: function () {
      var widgetId = this.options[PerspectiveUtil.KEY_WIDGET_ID];
      if (this.options.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE &&
          (widgetId && !PerspectiveUtil.isPersonalWidgetId(widgetId))) {
        return;
      }
      var newItem = this.where(function (model) {
        return model.isAddShortcut();
      });
      if (this.length < 4 && newItem.length === 0) {
        this.add({
          id: '',
          isAddNew: true,
          icon: 'icon-new',
          displayName: ''
        });
        return true;
      } else if (this.length > 4 && newItem.length > 0) {
        this.remove(newItem);
        return true;
      }
      return false;
    }
  });

  //
  // Constructor options:
  // - shortcutItems: Array
  //    - 
  // - node.id: The object (node) ID.  Either node.id or node.type is mandatory.
  // - node.type: The object type for known volumes (e.g. type=141 for Enterprise Workspace)
  // - icon: css icon class
  // - shortcutTheme: css theme class
  //
  var ShortcutsView = Marionette.CollectionView.extend({

    constructor: function ShortcutsView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options = _.defaults(options, {
        reorderOnSort: true,
        widgetContainer: this
      });
      options.data = this._normalizeData(options.data);

      options.collection = options.collection || new ShortcutsCollection([],
          _.pick(options, 'perspectiveMode', PerspectiveUtil.KEY_WIDGET_ID));
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },

    tagName: 'div',

    className: "csui-shortcut-container tile initialLoading csui-shortcut-group-container" +
               " csui-widget-focusable",

    attributes: function () {
      var attrs = {};
      if (!this._isInlineEditMode()) {
        attrs = _.extend({
          role: 'navigation',
          "aria-label": lang.groupAria
        }, attrs);
      }
      return attrs;
    },

    regions: {
      "shortcut0": ".shortcut-region-0",
      "shortcut1": ".shortcut-region-1",
      "shortcut2": ".shortcut-region-2",
      "shortcut3": ".shortcut-region-3"
    },

    behaviors: function () {
      if (!this._isInlineEditMode()) {
        return {
          TabableRegion: {
            behaviorClass: TabableRegionBehavior
          }
        };
      }
    },

    events: function () {
      var evts = {};

      if (this._isInlineEditMode()) {
        evts = _.extend(evts, {
          "drop": "onDrop",
          "dragover": "onDragOver",
          "dragenter": "onDragEnter",
          "keydown": "_onEditKeyDown"
        });
      } else {
        evts = _.extend(evts, {
          "keydown": "onKeyInView"
        });
      }

      return evts;
    },

    childView: MiniShortcutView,
    childEvents: {
      'change:shortcutTheme': '_onChangeTheme',
      'add:shortcut': '_onAddShortcut',
      'delete:widget': '_onRemoveShortcut',
      'update:widget:options': '_updateShortcutOptions'
    },
    childViewOptions: function (model, index) {
      return {
        context: this.options.context,
        collection: this.options.collection,
        container: this,
        perspectiveMode: this.options.perspectiveMode
      };
    },

    buildChildView: function (child, ChildViewClass, childViewOptions) {
      if (this._isInlineEditMode()) {
        ChildViewClass = EditableShortcutView;
      } else {
        ChildViewClass = MiniShortcutView;
      }
      return Marionette.CollectionView.prototype.buildChildView.call(this, child, ChildViewClass,
          childViewOptions);
    },

    _normalizeData: function (data) {
      data || (data = {shortcutItems: []});
      data.shortcutTheme || (data.shortcutTheme = '');
      return data;
    },

    initialize: function () {
      this.loadingText = lang.loadingText;
      this.darkBackground = true;
      BlockingView.imbue(this);

      this.listenTo(this.collection, 'add', this._onCollectionChange)
          .listenTo(this.collection, 'remove', this._onCollectionChange)
          .listenTo(this.collection, 'reset', this._onCollectionChange);

      if (this._isInlineEditMode()) {
        this.listenTo(this.collection, 'add', this._onCollectionInlineAdd)
            .listenTo(this.collection, 'remove', this._onCollectionInlineRemove);
      }

      var shortcutItems = _.map(_.first(this.options.data.shortcutItems || [], 4), _.clone);
      // Fetch all models before rendering tiles.
      this._fetchModels(shortcutItems).always(_.bind(function () {
        this._setupCollection(shortcutItems);
      }, this));
      this._currentShortcutIndex = 0;
      this.listenTo(this, 'add:child', this.propagateEventsToViews);
    },

    _fetchModels: function (shortcutItems) {
      this.blockActions();

      var self = this;
      var models = _.map(shortcutItems, function (item) {
        item.id = item.id || item.launchButtonID;
        var model = self.options.context.getModel(NodeModelFactory, {
          attributes: {
            id: (item.id || item.launchButtonID) || 'volume',
            type: item.type
          }
        });
        MiniShortcutView.prepareModelToFetch(model);
        return model;
      });

      var modelPromises = _.map(models, function (model) {
        return model.fetch({suppressError: true});
      });

      var result = $.whenAll.apply($, modelPromises);
      result.always(function () {
        _.each(shortcutItems, function (item, index) {
          item.node = models[index];
        });
        self.unblockActions();
      });
      return result;
    },

    _setupCollection: function (shortcutItems) {
      if (!this._isInlineEditMode()) {
        // Remove invalid / unknow nodes.
        var validShortcuts = _.filter(shortcutItems, function (item) {
          return !item.node.error;
        });
        if (validShortcuts.length > 0) {
          shortcutItems = validShortcuts;
        } else {
          // When all nodes are invalid, keep first to show "error" message / tile.
          shortcutItems = _.first(shortcutItems, 1);
        }
      }
      shortcutItems = shortcutItems || [];
      this.collection.reset(shortcutItems);
    },

    _isInlineEditMode: function () {
      return !!this.options.perspectiveMode;
    },

    _onCollectionChange: function () {
      if (this._isInlineEditMode()) {
        this.collection.evaluateAddNewExistence();
      }
      this._updateShortcutStyles();
    },

    _onCollectionInlineAdd: function () {
      this.collection.each(function (model) {
        model.trigger('refresh:mask');
      });
    },

    _onCollectionInlineRemove: function () {
      this.collection.each(function (model) {
        model.trigger('refresh:mask');
      });
    },

    _getLayout: function (size) {
      var layout = "small";
      if (size === 1) {
        layout = "large";
      } else if (size === 2) {
        layout = "medium";
      }
      return layout;
    },

    _getShortcutTheme: function (itemIndex, numberOfItems) {
      var theme = this.options.data.shortcutTheme ? this.options.data.shortcutTheme :
                  "csui-shortcut-theme-grey";
      if (numberOfItems > 1) {
        itemIndex += (4 - numberOfItems);
        theme += "-" + THEME_SUFFIX[itemIndex];
      }

      return theme;
    },

    _updateShortcutOptions: function (shortcutItemView, args) {
      var itemModel = shortcutItemView.model,
          updatedOptions = args.options;
      if (itemModel.get('isAddNew')) {
        if (args.softUpdate) {
          return;
        }
        if (!args.isValid || !shortcutItemView.isOptionsValid(updatedOptions)) {
          if (this.options.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
            this._notifyOptionsChange(!shortcutItemView.isShortcutValid(updatedOptions));
          }
          return;
        }
        itemModel.set({'isAddNew': undefined, displayName: undefined, icon: undefined},
            {silent: true, unset: true});
      }
      shortcutItemView.isUpdating = true;
      this._setDefaultOptions(updatedOptions);
      itemModel.set(updatedOptions);
      this._notifyOptionsChange();
      var isCollChanged = this.collection.evaluateAddNewExistence();
      delete shortcutItemView.isUpdating;
      if (!isCollChanged) {
        this._updateShortcutStyles();
        shortcutItemView.model.trigger('refresh:mask');
      }
      this.triggerMethod('dom:refresh');
    },

    /**
     * Since "Enterprise volume" as default value removed from manifest
     * to avoid creating shortcuts for empty placeholder, handle / fill default values manually.
     *
     * @param {JSONObject} updatedOptions
     */
    _setDefaultOptions: function (updatedOptions) {
      updatedOptions.type = updatedOptions.type || 141;
    },

    _onRemoveShortcut: function (shortcutItemView) {
      var getNextItemToFocus = this.collection.indexOf(shortcutItemView.model);
      this.collection.remove(shortcutItemView.model);
      var shortcutItems = this.collection.getShortcuts();
      if (shortcutItems.length === 0) {
        // No shortcuts left in the group. Hence remove widget
        this.options.widgetContainer.trigger('remove:widget');
      } else {
        // Otherwise, notify to update options
        this._notifyOptionsChange();
        this.children.findByIndex(getNextItemToFocus).focus();
      }
    },

    _notifyOptionsChange: function (isInvalid) {
      var shortcutItems = this.collection.getShortcuts().map(function (model) {
        return {
          id: model.get('id'),
          type: model.get('type'),
          displayName: model.get('displayName'),
          icon: model.has('icon') ? model.get('icon') : ''
        };
      });
      this.options.widgetContainer.trigger('update:widget:options', {
        shortcutTheme: this.collection.first().get('shortcutTheme'),
        shortcutItems: shortcutItems,
        isValid: !isInvalid
      });
    },

    _onChangeTheme: function (childView) {
      this.options.data.shortcutTheme = childView.model.get('shortcutTheme');
      this._updateShortcutStyles();
    },

    _onAddShortcut: function (childView, model) {
      this.collection.add({
        id: '',
        icon: '',
        displayName: '',
        type: 141,
        shortcutTheme: this.options.data.shortcutTheme
      }, {at: this.collection.length - 1});
      this.collection.sort();
      this._notifyOptionsChange();
    },

    _updateShortcutStyles: function () {
      var shortcutTheme = this.options.data.shortcutTheme,
          layout = this._getLayout(this.collection.length);
      this.collection.each(function (model, index) {
        var totalShortcuts = !this._isInlineEditMode() ? this.collection.length :
                             this.collection.getShortcuts().length,
            theme = this._getShortcutTheme(index, totalShortcuts);
        model.set({
          layout: layout,
          theme: theme,
          shortcutTheme: shortcutTheme
        });
      }, this);
    },

    onDrop: function (event) {
      this.options.widgetContainer.trigger('replace:widget', event);
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDragEnter: function (event) {
      event.preventDefault();
    },

    onRender: function () {
      this._clearShortcutTabIndexes();
    },

    onDomRefresh: function () {
      if (this._isInlineEditMode()) {
        var btnRequired = true,
            shortcutGroup = lang.groupAria,
            shortcutCount = this.collection.getShortcuts().length,
            shortcutAriaLabel = '',
            wrapperEle = this.$el.parent().find('.shortcut-group-wrapper');
        if (wrapperEle.length > 0) {
          btnRequired = false;
        }
        btnRequired && this.$el.before(
            "<div class='shortcut-group-button-wrapper'><button class='shortcut-group-wrapper binf-btn' tabindex='0'></button></div>");
        this.$el.parent().off('click', '.shortcut-group-wrapper', this._onEditEnterPress).on(
            'click', '.shortcut-group-wrapper', this._onEditEnterPress.bind(this));
        this.$el.parent().off('keydown', '.shortcut-group-wrapper',
            this._onKeyInEmptyPlaceHolder).on(
            'keydown', '.shortcut-group-wrapper', _.bind(this._onKeyInEmptyPlaceHolder, this));

        switch (shortcutCount) {
        case 0:
          // shortcut group with 0 items
          shortcutAriaLabel = lang.emptyGroup;
          break;
        case 1:
          // shortcut group with 1 item
          shortcutAriaLabel = _.str.sformat(lang.shortcutGroupWithOneItem, shortcutCount,
              4 - shortcutCount);
          break;
        case 4:
          // shortcut group with max items 4
          shortcutAriaLabel = lang.maxItemsGroup;
          break;
        default:
          // shortcut group with 1 or more items and a empty placeholder
          shortcutAriaLabel = _.str.sformat(lang.shortcutGroupWithMixedItems, shortcutCount,
              4 - shortcutCount);
        }
        this.$el.parent().find('.shortcut-group-wrapper').attr('aria-label', shortcutAriaLabel);
      }
    },

    _clearShortcutTabIndexes: function () {
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
    },

    /** START: KN handling */
    currentlyFocusedElement: function () {
      var currentItem = this._currentlyFocusedShortcut();
      return currentItem && currentItem.$el;
    },

    _currentlyFocusedShortcut: function () {
      return this.children.findByIndex(this._currentShortcutIndex);
    },

    _onEditEnterPress: function (event) {
      var $target = $(event.target);
      if (this.collection.getShortcuts().length === 0 && this.$el.has($target).length === 0) {
        this.$el.find('.csui-pman-widget-masking').trigger('click');
        return false;
      } else if ($target.is(this.$el.parent().find('.shortcut-group-wrapper'))) {
        this._enterConfiguration();
        return false;
      }
      return true;
    },

    _onEditKeyDown: function (event) {
      var continueEvent = true,
        $target = $(event.target);
      switch (event.keyCode) {
        case 13: // ENTER
        case 32: // SPACE
          continueEvent = this._onEditEnterPress(event);
          break;
        case 27: // ESCAPE
          if (this.collection.getShortcuts().length > 0) {
            if ($target.is(this.$el.find('.wrapper-button'))) {
              this.$el.parent().find('.shortcut-group-wrapper').trigger(
                'focus');
            } else {
              this.$el.find('.csui-pman-shortcut-new .wrapper-button').trigger(
                'focus');
            }
            continueEvent = false;
          } else if (this.collection.getShortcuts().length === 0) {
            // Exit from configuration, focus back to widget
            this._exitConfiguration();
            continueEvent = false;
          }
          break;
        case 38: // UP
          this._selectPreviousShortcut();
          break;
        case 40: // DOWN
          this._selectNextShortcut();
          break;
      }
      return continueEvent;
    },

    _enterConfiguration: function () {
      this._currentShortcutIndex = -1;
      this._selectShortcut(0);
    },

    _exitConfiguration: function () {
      this.$el.parent().find('.shortcut-group-wrapper').trigger('focus');
      this._clearShortcutTabIndexes(this.$el);
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 13: // ENTER
      case 32:
        this.currentlyFocusedElement().trigger('click');
        break;
      case 38:
        this._selectPreviousShortcut();
        break;
      case 40:
        this._selectNextShortcut();
        break;
      }
    },

    _onKeyInEmptyPlaceHolder: function (event) {
      switch (event.keyCode) {
      case 9:
        if (event.shiftKey && $(event.target).is($('.shortcut-group-wrapper'))) {
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
      }
    },

    _selectNextShortcut: function () {
      var index = Math.min(this._currentShortcutIndex + 1, this.collection.length - 1);
      this._selectShortcut(index);
    },

    _selectPreviousShortcut: function () {
      var index = Math.max(this._currentShortcutIndex - 1, 0);
      this._selectShortcut(index);
    },

    _selectShortcut: function (index) {
      if (index !== this._currentShortcutIndex) {
        this._currentShortcutIndex = index;
        this.trigger('changed:focus', this);
        this._currentlyFocusedShortcut().focus();
      }
    }
    /** END: KN handling */
  }, {
    migrateSingleShortcut: function (options) {
      var shortcutTheme;
      switch (options.background) {
      case 'cs-tile-background1':
        shortcutTheme = 'csui-shortcut-theme-stone1';
        break;
      case 'cs-tile-background2':
        shortcutTheme = 'csui-shortcut-theme-teal2';
        break;
      case 'cs-tile-background3':
        shortcutTheme = 'csui-shortcut-theme-pink1';
        break;
      }
      return {shortcutItems: [options], shortcutTheme: shortcutTheme};
    },

    migrateData: function (widgetType, options) {
      switch (widgetType) {
      case 'shortcut':
      case 'csui/widgets/shortcut':
        return ShortcutsView.migrateSingleShortcut(options);
      default:
        return options;
      }
    }
  });

  _.extend(ShortcutsView.prototype, ViewEventsPropagationMixin);

  return ShortcutsView;

});

csui.define('csui/widgets/welcome.placeholder/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/welcome.placeholder/impl/nls/root/lang',{
  greetingWithName: 'Hello {0}',
  greetingWithoutName: 'Hello',
  greetingMorning: 'Good morning, {0}!',
  greetingAfternoon: 'Good afternoon, {0}!',
  greetingEvening: 'Good evening, {0}!',
  greetingMorningNoName: 'Good morning!',
  greetingAfternoonNoName: 'Good afternoon!',
  greetingEveningNoName: 'Good evening!',
  videoLabel: 'Smart UI introduction video',
  videoSrc: '//sunnyside.vidavee.com/opentext/rest/file/GetFileAsset/EBC85A92D0C5DE3A272CC1C165E85A78/introVideo_2020.mp4',
  videoPoster: '//sunnyside.vidavee.com/opentext/rest/file/GetFileThumbnail/EBC85A92D0C5DE3A272CC1C165E85A78/thumbnail.jpg',
  message: 'As a foundational technology in the Digital Workplace, OpenText Content Suite will pave the way to personal productivity, seamless collaboration, and integration with business processes.'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\r\n  <div class=\"binf-modal-dialog\">\r\n    <div class=\"binf-modal-content csui-video\">\r\n      <video  preload=\"none\"\r\n             poster=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"videoPoster") || (depth0 != null ? lookupProperty(depth0,"videoPoster") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"videoPoster","hash":{},"loc":{"start":{"line":5,"column":21},"end":{"line":5,"column":36}}}) : helper)))
    + "\"\r\n             controls=\"controls\">\r\n        <source\r\n          src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"videoSrc") || (depth0 != null ? lookupProperty(depth0,"videoSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"videoSrc","hash":{},"loc":{"start":{"line":8,"column":15},"end":{"line":8,"column":27}}}) : helper)))
    + "\"\r\n          type=\"video/mp4\">\r\n        </source>\r\n      </video>\r\n\r\n    </div>\r\n  </div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_welcome.placeholder_impl_welcome.video_welcome.video', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',[],function(){});
csui.define('csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base', "csui/utils/url", 'csui/utils/contexts/factories/node',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/lang',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',
  'css!csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video',
  'csui/lib/binf/js/binf'
], function (_, $, Marionette, base, Url, NodeModelFactory, lang,
  TabablesBehavior, TabableRegionBehavior, template) {

  var WelcomeVideo = Marionette.ItemView.extend({

    _dataDefaults:{
      videoSrc: lang.videoSrc,
      videoPoster: lang.videoPoster
    },

    className: 'cs-dialog welcome-video binf-modal binf-fade',

    template: template,

    events: {
      'hide.binf.modal': 'onDestroy',
      'hidden.binf.modal': 'onDestroy',
      'keydown video' : 'onKeyDown',
      'shown.binf.modal': 'onShown'
    },

    templateHelpers: function(){
      var optionsData = this.options.data;
      return {
        videoSrc: optionsData.videoSrc,
        videoPoster: optionsData.videoPoster
      };
    },

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function WelcomeVideo(options) {
      options || (options = {});
      options.data || (options.data = {});
      _.each(this._dataDefaults, function(value,key){
        var serverValue = options.data[key];
        if (!serverValue){
          options.data[key] = value;
        }
      });
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.connection = options.context.getModel(NodeModelFactory).connector.connection;
    },

    onKeyDown: function(event) {
      if(event.keyCode === 27) {
        this.destroy();
      }
    },

    onDestroy: function(){
      TabablesBehavior.popTabableHandler();
      this.$el.remove();
    },


    show: function () {
      this.render();
      if (base.isAppleMobile()){
        this.$el.addClass('mobile');
      }
      this.$el.binf_modal('show');
    },

    onShown: function () {
    this.$('video').trigger('focus');
   }



  });

  return WelcomeVideo;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/welcome.placeholder/impl/welcome.placeholder',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"csui-videoButton\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"videoLabel") || (depth0 != null ? lookupProperty(depth0,"videoLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"videoLabel","hash":{},"loc":{"start":{"line":9,"column":49},"end":{"line":9,"column":63}}}) : helper)))
    + "\"></button>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-message\">\r\n      <p title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":13,"column":16},"end":{"line":13,"column":27}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":13,"column":29},"end":{"line":13,"column":40}}}) : helper)))
    + "</p>\r\n    </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\r\n<div class=\"csui-hero-tile\">\r\n  <div class=\"csui-hero-left\">\r\n    <div class=\"csui-greeting\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"greeting") || (depth0 != null ? lookupProperty(depth0,"greeting") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"greeting","hash":{},"loc":{"start":{"line":4,"column":31},"end":{"line":4,"column":43}}}) : helper)))
    + "</div>\r\n    <span class=\"csui-date\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"date") || (depth0 != null ? lookupProperty(depth0,"date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"date","hash":{},"loc":{"start":{"line":5,"column":28},"end":{"line":5,"column":36}}}) : helper)))
    + "</span>\r\n  </div>\r\n    <div class=\"csui-hero-right\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"includeVideo") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":4},"end":{"line":10,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"includeMessage") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":11,"column":4},"end":{"line":15,"column":11}}})) != null ? stack1 : "")
    + "  </div>\r\n\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_welcome.placeholder_impl_welcome.placeholder', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/welcome.placeholder/impl/welcome.placeholder',[],function(){});
csui.define('csui/widgets/welcome.placeholder/welcome.placeholder.view',[
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/contexts/factories/user',
  'csui/utils/types/date',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video.view',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/lang',
  'hbs!csui/widgets/welcome.placeholder/impl/welcome.placeholder',
  'css!csui/widgets/welcome.placeholder/impl/welcome.placeholder'
], function ($,
    _,
    Marionette,
    base,
    UserModelFactory,
    DateType,
    TabableRegionBehavior,
    WelcomeVideo,
    lang,
    placeholderTemplate) {

  var WelcomeView = Marionette.ItemView.extend({

    _dataDefaults: {
      includeMessage: true,
      includeVideo: true,
      message: lang.message
    },

    className: 'tile hero',

    template: placeholderTemplate,

    ui: {
      welcomeMessageContainer: '> .csui-hero-tile .csui-message',
      welcomeMessage: '> .csui-hero-tile .csui-message > p',
      greetingsMessage: '> .csui-hero-tile .csui-hero-left .csui-greeting'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    triggers: {
      'click .csui-hero-tile': 'show:video'
    },

    templateHelpers: function () {
      var optionsData = this.options.data,
          firstName   = this.user.get('first_name'),
          date        = new Date(),
          hour        = date.getHours(),
          greeting    = this._getGreeting(firstName, hour);

      return {
        videoSrc: optionsData.videoSrc,
        videoPoster: optionsData.videoPoster,
        includeMessage: optionsData.includeMessage,
        includeVideo: optionsData.includeVideo,
        greeting: greeting,
        message: optionsData.message,
        videoLabel: lang.videoLabel,
        date: DateType.formatExactDate(DateType.deserializeDate(date))
      };
    },

    events: {"keydown": "onKeyInView"},

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space(32) or enter(13)
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod("show:video");
      }
    },

    constructor: function WelcomeView(options) {
      options || (options = {});
      options.data || (options.data = {});
      _.each(this._dataDefaults, function(value,key){
        var serverValue = options.data[key];
        if (serverValue == null || serverValue === ''){
          options.data[key] = value;
        }
      });
      Marionette.ItemView.call(this, options);
      this.user = options.context.getModel(UserModelFactory);
      this.listenTo(this.user, 'change', this._updateGreeting);
      $(window).on("resize.app", this.render);
      this.listenTo(this, 'dom:refresh', this._setTextEllipse);
    },

    onRender: function() {
      var helpers = this.templateHelpers();
      if (helpers.includeVideo) {
        this.$el.attr('aria-label', helpers.greeting + " " + helpers.videoLabel);
      }
    },

    onDestroy: function () {
      $(window).off("resize.app", this.render);
    },

    onShowVideo: function () {
      var welcomeVideo = new WelcomeVideo(this.options);
      welcomeVideo.show();
    },

    _setTextEllipse: function () {
      var welcomeMessage  = this.ui.welcomeMessage,
          containerHeight = this.ui.welcomeMessageContainer.height(),
          lineHeight      = parseInt(welcomeMessage.css('line-height'), 10);

      if (lineHeight <= containerHeight) {
        while (welcomeMessage.outerHeight() > containerHeight) {
          var text = welcomeMessage.text();
          var shortenedText = text.replace(/\W*\s(\S)*$/, '...');
          if (shortenedText.length < text.length) {
            welcomeMessage.text(shortenedText);
          } else {
            break;
          }
        }
        this.ui.welcomeMessageContainer.removeClass('binf-hidden');
      }
      else {
        this.ui.welcomeMessageContainer.addClass('binf-hidden');
      }
    },

    _getGreeting: function(firstName, hour){
      return this._generateGreetingMessage(firstName, hour);
    },

    _updateGreeting: function(){      
      $(this.ui.greetingsMessage).text(this._generateGreetingMessage(this.user.get('first_name'), new Date().getHours()));
    },

    _generateGreetingMessage: function(firstName, hour){
      var greeting;
      if(firstName){
        greeting = hour < 12 ? lang.greetingMorning : hour < 18 ? lang.greetingAfternoon : lang.greetingEvening;
        greeting = _.str.sformat(greeting, firstName);
      }else{
        greeting = hour < 12 ? lang.greetingMorningNoName : hour < 18 ? lang.greetingAfternoonNoName : lang.greetingEveningNoName;
      }
      return greeting;
    }
  });

  return WelcomeView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/cslink.preview/cslink.preview',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "      <div id=\"cs-link-content\" class=\"cs-link-content\"></div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div id=\"cs-link-image\" class=\"cs-link-image\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"LinkPreviewImage") || (depth0 != null ? lookupProperty(depth0,"LinkPreviewImage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"LinkPreviewImage","hash":{},"loc":{"start":{"line":11,"column":52},"end":{"line":11,"column":74}}}) : helper))) != null ? stack1 : "")
    + "</div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"cs-link\" class=\"cs-link\">\r\n  <div class=\"cs-link-popoverhead\">\r\n    <div id=\"cs-link-heading\" class=\"cs-link-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"LinkHeading") || (depth0 != null ? lookupProperty(depth0,"LinkHeading") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"LinkHeading","hash":{},"loc":{"start":{"line":3,"column":54},"end":{"line":3,"column":69}}}) : helper)))
    + "</div>\r\n    <div id=\"cs-link-expand\" class=\"cs-link-expand cs-link-expand-icon\"></div>\r\n  </div>\r\n  <div class=\"cs-link-preview-content\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isPreviewContent") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":4},"end":{"line":9,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isLinkPreviewImage") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":10,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + "  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_cslink.preview_cslink.preview', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/html.editor/impl/cslink.preview/cslink.preview',[],function(){});
csui.define(
    'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
      'csui/behaviors/default.action/default.action.behavior',
      'csui/controls/rich.text.editor/impl/rich.text.util',
      'csui/models/node/node.model', 'csui/utils/commands', 'csui/utils/url',
      'hbs!csui/widgets/html.editor/impl/cslink.preview/cslink.preview',
      'i18n!csui/widgets/html.editor/impl/nls/lang',
      'css!csui/widgets/html.editor/impl/cslink.preview/cslink.preview'
    ], function ($, _, Backbone, Marionette, DefaultActionBehavior, Utils, NodeModel,
        commands, Url, linkTemplate, lang) {

      var CSLinkPreview = Marionette.ItemView.extend({
        template: linkTemplate,
        className: 'cs-link',
        behaviors: {
          DefaultAction: {
            behaviorClass: DefaultActionBehavior
          }
        },
        subTypeName: 'wiki',
        constructor: function CSLinkPreview(options) {
          options || (options = {});
          Marionette.ItemView.prototype.constructor.call(this, options);
          this.options = options;
          this.subTypeName = options.subTypeName || this.subTypeName;
          this.modelFetched = false;
          this.linkPreviewContent = null;
          this.linkPreviewImage = null;
          this.model = this.options.previewModel;
          var that = this;
          if (!this.model) {
            this._obtainId().done(function () {
              that._executeProcess();
            });
          }
        },

        _obtainId: function () {
          this.id = this.options.objId || -1;
          var targetEle  = this.options.targetEle,
              targetHref = targetEle.href || targetEle.closest('a').href;
          var hrefMatcher = targetHref.match(/^.*\/open\/(.+)$/i) ||
                            targetHref.match(/^.*\/nodes\/(.+)$/i),
              deferred    = $.Deferred(),
              that        = this,
              canResolve  = true;

          if (this.options.isSameDomain) {  // if link is of same domain
            if (!!hrefMatcher) {  // if the links contain nodes
              if (isNaN(parseInt(hrefMatcher[1]))) {    // if nodeid in link is not a number
                canResolve = false;
                var nickName = this.options.targetEle.href &&
                               this.options.targetEle.href.substring(
                                   this.options.targetEle.href.lastIndexOf("/") + 1,
                                   this.options.targetEle.href.length),
                    node;
                Utils._getNicknameId(that.options, nickName).done(function (response) {
                  node = Utils.getNewNodeModel({}, {connector: that.options.connector});
                  node.attributes = node.parse(response);
                  node = Utils.getNewNodeModel({attributes: node.attributes},
                      {connector: that.options.connector});
                  that.model = node;
                  that.id = that.model.get("id");
                  deferred.resolve();
                }).fail(function(){
                  $(that.options.targetEle).attr("title", lang.cannotFindObject);
                });
              } else {   // if nodeid is a number
                this.id = hrefMatcher[1];
              }
            }
          }
          if (!!canResolve) {
            deferred.resolve();
          }
          return deferred.promise();
        },

        _executeProcess: function () {
          if (this.id !== -1) {
            this.model = new NodeModel({
              id: this.id
            }, {
              connector: this.options.connector,
              commands: commands.getAllSignatures(),
              fields: this.options.fields || {},
              expand: this.options.expand || {}
            });

            this.model.fetch().fail(_.bind(function () {
              $(this.options.targetEle).attr("title", lang.cannotFindObject);
            }, this));
            this.listenTo(this.model, 'sync', function (e) {
              // trigger to parent content view to cache the model and avoid re-fetch.
              this.trigger('model:fetched', this.model);
              this.linkHeading = this.model.attributes.name;
              var that    = this,
                  promise = this._getContent();
              promise.done(function (res) {
                if (that.model.get('type') === 5574) {
                  that._callbackExecuteProcess(res);
                }
                else {
                  $(that.options.targetEle).attr("title",
                      _.str.sformat(lang.goToTooltip, that.model.get("name")));
                }
              });
            });
          }
          else {
            $(this.options.targetEle).attr("title", lang.previewUnavailable);
          }
        },

        _getContent: function () {
          var deferred       = $.Deferred(),
              connector      = this.options.connector,
              collectOptions = {
                url: this._getUrl(),
                type: 'GET'
              };

          connector.makeAjaxCall(collectOptions).done(function (resp) {
            deferred.resolve(resp);
          }).fail(function (resp) {
            deferred.reject(resp);
          });
          return deferred.promise();
        },

        _getUrl: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'), '/' +
                 this.subTypeName +
                 '/' + this.id + "/previewcontent");
        },

        _callbackExecuteProcess: function (res) {
          this.modelFetched = true;
          this.linkPreviewImage = res.results.data.firstImage;
          this.linkPreviewContent = res.results.data.previewContent;
          var content = $("<div>" + this.linkPreviewContent + "</div>").find("*").text().trim();
          this.isEmptyContent = (content === "" || content === lang.pageDefaultContent);
          if (!this.isDestroyed) {
            $(this.options.targetEle).attr({"title":"","data-binf-original-title":""});
            if ((this.linkPreviewContent !== null && !this.isEmptyContent) ||
                this.linkPreviewImage !== null) {
              this.render();
              $(this.options.targetEle).binf_popover('show');
              if (this.linkPreviewContent !== null && !this.isEmptyContent) {
                $('.cs-link-content').html(this.linkPreviewContent);
              }
              else {
                $('.cs-link-preview-content').addClass('cs-link-image-only');
              }
              this.eventHandlers();
            } else {
              $(this.options.targetEle).attr("title",
                  _.str.sformat(lang.goToTooltip, this.model.get("name")));
            }
          }
        },

        onDestroy: function () {
          this.hidePopover();
        },
        eventHandlers: function () {
          var that = this;
          $('.cs-link-popover').on("mouseleave", function (e) {
            if ($("#" + e.target.id).attr("aria-describedby") !==
                $(that.options.targetEle).attr("aria-describedby")) {
              that.hidePopover();
            }
          });
          $('.cs-link-expand').on('click', function (e) {
            that.expandLinkView();
          });
        },
        hidePopover: function () {
          $(this.options.targetEle).binf_popover('hide');
          $(this.options.targetEle).binf_popover('destroy');
        },
        expandLinkView: function () {
          this.triggerMethod("execute:defaultAction", this.model);
        },
        onRender: function () {
          var that = this, targetEle = this.options.targetEle;
          if (this.modelFetched) {

            var contentparams = {
                  "LinkHeading": this.linkHeading,
                  "isLinkPreviewImage": this.linkPreviewImage !== null ? true : false,
                  "LinkPreviewImage": this.linkPreviewImage,
                  "isPreviewContent": !this.isEmptyContent,
                  "linkPreviewContent": this.linkPreviewContent
                },
                content       = this.template(contentparams);

            $(targetEle).binf_popover({
              html: true,
              trigger: "manual",
              content: content,
              container: $.fn.binf_modal.getDefaultContainer(),
              placement: function (context) {
                $(context).addClass("cs-link-popover");
                var _tempElement = $('<div/>')
                    .attr("style", "display:none")
                    .addClass("cs-link-popover binf-popover cs-link-popover-temp-div")
                    .append(linkTemplate);
                $(targetEle).append(_tempElement);
                if (that.linkPreviewImage === null ||
                    (that.linkPreviewContent === null || that.isEmptyContent)) {
                  $(context).addClass('cs-link-preview-width');
                }
                var popOverMaxHeight = $(".cs-link-popover-temp-div").height() + 40,
                    popOverMaxWidth  = $(".cs-link-popover-temp-div").width() + 40;
                _tempElement.remove();
                var popOverSource = $(targetEle),
                    offset        = popOverSource.offset(),
                    window_left   = offset.left,
                    window_top    = offset.top,
                    window_right  = (($(window).width()) -
                                     (window_left + popOverSource.outerWidth())),
                    window_bottom = (($(window).height()) -
                                     (window_top + popOverSource.outerHeight(true)));
                if (window_bottom > popOverMaxHeight) {
                  that.popoverPosition = "bottom";
                  return "bottom";
                } else if (window_top > popOverMaxHeight) {
                  that.popoverPosition = "top";
                  return "top";
                } else if (window_right > popOverMaxWidth) {
                  that.popoverPosition = "right";
                  return "right";
                } else if (window_left > popOverMaxWidth) {
                  that.popoverPosition = "left";
                  return "left";
                } else {
                  that.popoverPosition = "auto";
                  return "auto";
                }
              }
            });
          } else if (this.model && !this.model.fetching) {
            $(targetEle).attr("title",
                _.str.sformat(lang.goToTooltip, this.model.get("name")));
          }

          $("*").one('scroll', function () {
            that.destroy();
          });
          $(this.options.targetEle).one("remove", function () {
            that.destroy();
          });
          // hide the popover on mouseleave of target element
          $(this.options.targetEle).off("mouseleave").on("mouseleave", function (e) {
            setTimeout(function () {
              if ($(".cs-link-popover:hover").length === 0) {
                that.destroy();
              }
            }, 10);
          });
        }
      });
      return CSLinkPreview;
    });

csui.define('csui/widgets/html.editor/impl/html.editor.model',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/node/node.model'
], function (_, $, Backbone, Url, NodeModel) {
  "use strict";

  var HtmlEditorModel = NodeModel.extend({

    constructor: function HtmlEditorModel(options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, options);
      //this.options.connector.assignTo(this);
      this.makeConnectable(options).makeFetchable(options);
    }
  });

  _.extend(HtmlEditorModel.prototype, {

    isFetchable: function () {
      return !!this.options;
    },

    url: function () {
      var url = Url.combine(this.options.connector.connection.url,
          "nodes/" + this.options.id + "/content");
      return url;
    },

    parse: function (response) {
      return {
        'data': response,
        'oldData': response //old Data required on cancel after updating data with autosaved
      };
    }
  });

  return HtmlEditorModel;

});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/html.editor',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class='csui-richtext-message-wrapper'>\r\n  <div id=\"csui-richtext-content-body-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":2,"column":38},"end":{"line":2,"column":46}}}) : helper)))
    + "\" class=\"csui-richtext-message\"\r\n       contentEditable=\"false\" data-placeholder = \""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"placeholder") || (depth0 != null ? lookupProperty(depth0,"placeholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"placeholder","hash":{},"loc":{"start":{"line":3,"column":51},"end":{"line":3,"column":66}}}) : helper)))
    + "\">\r\n    "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"data") || (depth0 != null ? lookupProperty(depth0,"data") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"data","hash":{},"loc":{"start":{"line":4,"column":4},"end":{"line":4,"column":16}}}) : helper))) != null ? stack1 : "")
    + "\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_html.editor', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"binf-dropdown\">\r\n    <a title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tooltip") || (depth0 != null ? lookupProperty(depth0,"tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tooltip","hash":{},"loc":{"start":{"line":3,"column":14},"end":{"line":3,"column":25}}}) : helper)))
    + "\" class=\"binf-dropdown-toggle csui-html-editor-control\"\r\n       href=\"#\" data-binf-toggle=\"dropdown\" role=\"button\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"moreActionsAria") || (depth0 != null ? lookupProperty(depth0,"moreActionsAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"moreActionsAria","hash":{},"loc":{"start":{"line":4,"column":70},"end":{"line":4,"column":89}}}) : helper)))
    + "\"\r\n       aria-expanded=\"false\">\r\n      <span class=\"csui-icon "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"reserved") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":6,"column":29},"end":{"line":6,"column":84}}})) != null ? stack1 : "")
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconClass") || (depth0 != null ? lookupProperty(depth0,"iconClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconClass","hash":{},"loc":{"start":{"line":6,"column":85},"end":{"line":6,"column":98}}}) : helper)))
    + "\">\r\n      </span>\r\n    </a>\r\n    <ul class=\"binf-dropdown-menu\" role=\"menu\"></ul>\r\n  </div>\r\n";
},"2":function(container,depth0,helpers,partials,data) {
    return " csui-html-editor-reserved-icon ";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"reserved") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":12,"column":2},"end":{"line":15,"column":9}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"csui-icon csui-html-editor-reserved-readonly "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconClass") || (depth0 != null ? lookupProperty(depth0,"iconClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconClass","hash":{},"loc":{"start":{"line":13,"column":62},"end":{"line":13,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tooltip") || (depth0 != null ? lookupProperty(depth0,"tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tooltip","hash":{},"loc":{"start":{"line":13,"column":84},"end":{"line":13,"column":95}}}) : helper)))
    + "\">\r\n    </span>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"haveEditPermission") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":16,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_dropdown.menu_dropdown.menu', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.option',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<a tabindex=\"-1\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"actionName") || (depth0 != null ? lookupProperty(depth0,"actionName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"actionName","hash":{},"loc":{"start":{"line":1,"column":24},"end":{"line":1,"column":38}}}) : helper)))
    + "\">\r\n  "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"actionName") || (depth0 != null ? lookupProperty(depth0,"actionName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"actionName","hash":{},"loc":{"start":{"line":2,"column":2},"end":{"line":2,"column":16}}}) : helper)))
    + "\r\n</a>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_dropdown.menu_dropdown.option', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
      'csui/lib/marionette', 'csui/models/nodes', 'csui/utils/commands',
      'csui/utils/contexts/factories/member',
      'csui/utils/base',
      'i18n!csui/widgets/html.editor/impl/nls/lang',
      'hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu',
      'hbs!csui/widgets/html.editor/impl/dropdown.menu/dropdown.option'],
    function (module, _, $, Backbone, Marionette, NodeCollection, commands,
        MemberModelFactory, base, lang, TemplateDropdownMenu, TemplateDropdownOption) {
      'use strict';

      var DropdownOption = Marionette.ItemView.extend({
        tagName: 'li',
        template: TemplateDropdownOption,
        events: {
          'click a': '_executeAction',
          'keyup a': 'onKeyUp'
        },
        templateHelpers: function () {
          return {
            actionName: lang[this.model.get('signature') || this.model.get('name')]
          };
        },
        constructor: function (options) {
          Marionette.ItemView.prototype.constructor.apply(this, arguments);
        },
        _executeAction: function () {
          if (this.options.openForEdit) {
            this.options.openForEdit();
          } else {
            var cmdExe = this.options.command.execute(this.options.status);
            cmdExe.always(_.bind(function () {
              this.trigger('csui.command.executed', cmdExe);
            }, this));
          }
        },

        onKeyUp: function (event) {
          if ([13, 32].indexOf(event.keyCode) !== -1) { // enter, space
            this._executeAction();
          }
        }
      });

      var DropdownMenuView = Marionette.CompositeView.extend({
        className: "csui-html-editor-dropdown",
        template: TemplateDropdownMenu,
        childView: DropdownOption,
        childViewContainer: "ul.binf-dropdown-menu",
        childEvents: {
          'csui.command.executed': 'afterCommandExecution'
        },
        ui: {
          'dropdownMenu': '.binf-dropdown-menu'
        },
        childViewOptions: function (actionModel) {
          var signature = !!actionModel.get('openForEdit') ? 'HTMLEdit' :
                          actionModel.get('signature');
          //from restapi actionModel getting all small
          //but command signature is first cap in actual
          //signature = signature.charAt(0).toUpperCase() + signature.substring(1);
          var options = {
            status: this.status,
            node: this.options.node
          };
          if (signature === 'HTMLEdit') {
            options.openForEdit = this.options.openForEdit;
          } else {
            if (signature === 'properties') {
              //signature of properties command starts with Capital char
              //deviation from other this.model signature.
              signature = "Properties";
            } else if (['reserve', 'unreserve'].indexOf(signature) !== -1) {
              if (signature === 'unreserve') {
                signature = "Unreserve";
              } else {
                signature = "Reserve";
              }
              signature += 'Doc';
            }
            options.command = commands.get(signature);
          }
        
        
          return options;
        },
        templateHelpers: function () {
          var helpers = {
            haveEditPermission: this.haveEditPermissions,
            tooltip: lang.more,
            iconClass: 'icon-html-edit-toolbar-more',
            reserved: this.node.get('reserved'),
            moreActionsAria: _.str.sformat(lang.moreActionsAria,
                !!this.parentView.options.title ? this.parentView.options.title : '')
          };
          if (helpers.reserved) {
            var selfReserved = this.node.get('reserved_user_id') === this.user.get(
                    'id');
            if (!selfReserved) {
              helpers.tooltip = _.str.sformat(lang.reservedBy, this.node.get('reserved_user_id'),
                  base.formatExactDate((
                      this.node.get('reserved_date'))));
            }
            helpers.iconClass = selfReserved ? 'icon-html-editor-reserved-owned' :
                                'icon-html-editor-reserved_other';
          }
          return helpers;
        },

        constructor: function DropdownMenuView(options) {
          this.parentView = options.parentView;
          this.node = options.node;
          this.user = options.user;
          this.haveEditPermissions = !!(options.node.actions.get('reserve') || options.node.actions
              .get('unreserve'));
          options.collection = this.buildCollection();
          Marionette.CompositeView.prototype.constructor.apply(this, arguments);
          this.listenTo(this.options.node, 'change', this.updateActionCollection);
          this.status = {
            context: this.options.context,
            container: this.options.node,
            nodes: new NodeCollection([this.options.node])
          };
          if (this.node.get('reserved') &&
              this.node.get('reserved_user_id') !== this.user.get('id')) {
            this.reservedByUserModel = this.options.context.getModel(MemberModelFactory, {
              attributes: {
                id: this.node.get('reserved_user_id')
              }
            });
          }
        },

        buildCollection: function () {
          // it should be better if we manipulate the collection rather than creating new
          // but for now let it be this way
          var collection = new Backbone.Collection();
          if (this.haveEditPermissions) {
            if (!this.node.get('reserved') ||
                this.node.get('reserved_user_id') === this.user.get('id')) {
              collection.add(new Backbone.Model({
                openForEdit: true,
                name: 'Edit'
              }));
            }
            var action, supportedActions = ['properties', 'permissions', 'unreserve'],
                self                     = this;
            supportedActions.map(function (action) {
              action = self.node.actions.get(action);
              action && collection.add(action);
            });
          }
          return collection;
        },

        updateActionCollection: function () {
          this.haveEditPermissions = !!(this.options.node.actions.get('reserve') ||
                                        this.options.node.actions.get('unreserve'));
          this.collection = this.buildCollection();
          this.render();
        },

        afterCommandExecution: function (childView, promise) {
          promise.fail(_.bind(function () {
            // add fail callbacks here
            if (childView.model.get('name') === 'Unreserve') {
              // concurrent scenerio where unreserve is shown
              // but item has been unreserved already
              this.node.fetch();
            }
          }, this));
        },
        adjustDropdownMenu: function () {
          if (document.dir === 'rtl') {
            return false;
          }
          this.ui.dropdownMenu.removeClass("csui-html-editor-floating-dd-menu");
          var dropdownLeftOffset   = this.ui.dropdownMenu.offset().left,
              dropdownWidth        = this.ui.dropdownMenu.outerWidth(),
              originatingViewWidth = document.body.scrollWidth,
              ddMenuOverlaps       = dropdownLeftOffset + (2 * dropdownWidth) <=
                                     originatingViewWidth;
          if (ddMenuOverlaps) {
            this.ui.dropdownMenu.addClass("csui-html-editor-floating-dd-menu");
          }
        },
        onRender: function () {
          var dropDown = this.$el.find('.binf-dropdown');
          dropDown.on('binf.dropdown.before.show', _.bind(function () {
            dropDown.on('binf.dropdown.after.show', this.adjustDropdownMenu.bind(this));
            $(window).on('resize.html.editor.dropdown.menu', this.adjustDropdownMenu.bind(
                this));
          }, this));
          dropDown.on('hide.binf.dropdown', _.bind(function () {
            dropDown.off('binf.dropdown.after.show');
            $(window).off('resize.html.editor.dropdown.menu');
          }));
          if (!!this.reservedByUserModel && !this.reservedByUserModel.fetched) {
            this.reservedByUserModel.fetch().done(_.bind(function (response) {
              this.$el.find('.binf-dropdown-toggle.csui-html-editor-control,' +
                            ' .csui-html-editor-reserved-readonly').attr('title',
                  _.str.sformat(lang.reservedBy, response.data.display_name,
                      base.formatExactDate((
                          this.node.get('reserved_date')))));
            }, this));
          }
        }
      });
      return DropdownMenuView;
    });


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/edit.icon',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span class=\"csui-rich-text-edit-icon-wrapper csui-rich-text-edit-icon-wrapper-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":1,"column":79},"end":{"line":1,"column":87}}}) : helper)))
    + "\">\r\n  <span title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"editLable") || (depth0 != null ? lookupProperty(depth0,"editLable") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"editLable","hash":{},"loc":{"start":{"line":2,"column":15},"end":{"line":2,"column":30}}}) : helper)))
    + "\" class=\"icon icon-edit icon-edit-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":2,"column":64},"end":{"line":2,"column":72}}}) : helper)))
    + "\"></span>\r\n</span>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_edit.icon', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/html.editor.action.buttons',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-html-editor-action-buttons\">\r\n  <button type=\"button\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"saveLabel") || (depth0 != null ? lookupProperty(depth0,"saveLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"saveLabel","hash":{},"loc":{"start":{"line":2,"column":31},"end":{"line":2,"column":44}}}) : helper)))
    + "\" role=\"button\" data-cstabindex=\"-1\" tabindex=\"-1\"\r\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"saveAria") || (depth0 != null ? lookupProperty(depth0,"saveAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"saveAria","hash":{},"loc":{"start":{"line":3,"column":22},"end":{"line":3,"column":34}}}) : helper)))
    + "\"\r\n          class=\"icon circular csui-html-edit-icon csui-html-edit-save\"></button>\r\n  <button type=\"button\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cancelLabel") || (depth0 != null ? lookupProperty(depth0,"cancelLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cancelLabel","hash":{},"loc":{"start":{"line":5,"column":31},"end":{"line":5,"column":46}}}) : helper)))
    + "\" role=\"button\" data-cstabindex=\"-1\" tabindex=\"-1\"\r\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cancelAria") || (depth0 != null ? lookupProperty(depth0,"cancelAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cancelAria","hash":{},"loc":{"start":{"line":6,"column":22},"end":{"line":6,"column":36}}}) : helper)))
    + "\"\r\n          class=\"icon circular csui-html-edit-icon csui-html-edit-cancel\"></button>\r\n</div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_html.editor.action.buttons', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/html.editor/impl/html.editor.content.view',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  "csui/lib/radio",
  'csui/utils/contexts/factories/connector',
  'csui/utils/url',
  'csui/utils/base',
  'csui/models/node/node.model',
  'csui/utils/contexts/factories/user',
  'csui/widgets/html.editor/impl/html.editor.model',
  'hbs!csui/widgets/html.editor/impl/html.editor', 'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/progressblocker/blocker',
  'csui/controls/error/error.view',
  'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',
  'csui/controls/rich.text.editor/rich.text.editor',
  'csui/widgets/html.editor/impl/dropdown.menu/dropdown.menu.view',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/node.links/node.links',
  'i18n!csui/widgets/html.editor/impl/nls/lang',
  'hbs!csui/widgets/html.editor/impl/edit.icon',
  'hbs!csui/widgets/html.editor/impl/html.editor.action.buttons',
  'css!csui/widgets/html.editor/impl/html.editor'
], function ($, _, Backbone, Marionette, Radio, ConnectorFactory, Url, base, NodeModel, UserModelFactory,
    HtmlEditorModel, htmlEditorTemplate, ModalAlert,
    BlockingView, ErrorView,
    LinkPreview, RichTextEditor, DropdownMenu, GlobalMessage, NodeLinks, lang, template,
    htmlEditorButtonsTemplate) {

  'use strict';
  var HtmlEditorContentView = Marionette.ItemView.extend({

    className: 'csui-html-editor-wrapper',

    modelEvents: {
      'change': 'render',
      'error': 'render'
    },

    ui: {
      richText: '.csui-richtext-message'
    },

    events: {
      'mouseenter .csui-richtext-message[contenteditable="false"] a': '_showPreview',
      'focusin .csui-richtext-message[contenteditable="true"]': '_actionButtonsPositionInEdge',
      'focusin .csui-richtext-message[contenteditable="false"] a': '_updateUrl',
      'keyup': '_validateState'
    },

    getTemplate: function () {
      return this.model.error ? false : htmlEditorTemplate;
    },

    templateHelpers: function () {
      return {
        'placeholder': lang.PageDefaultContent,
        'id': this.model.get('id'),
        'data': this.model.get('data')
      };
    },

    constructor: function HtmlEditorContentView(options) {
      options || (options = {});
      options.id = options.wikiPageId;
      options = _.extend(options, (options.data = {}));
      this.parentView = options.parentView;
      this.ui.richTextEle = '#csui-richtext-content-body' + options.id;
      BlockingView.imbue(this);
      this.context = options.context;
      this.connector = this.context.getObject(ConnectorFactory);
      //wiki page node model
      this.node = new NodeModel({
        id: options.id
      }, {
        connector: this.connector,
        expand: {
          properties: ['original_id', 'parent_id'], //parent_id -> we need image_folder_id
        },
        commands: ['permissions', 'properties', 'reserve', 'unreserve',
          'addcategory', 'editpermissions']
      });
      this.user = this.context.getModel(UserModelFactory);
      if (!options.model) {
        //model for html content
        options.model = new HtmlEditorModel({
          connector: this.connector,
          context: this.context,
          id: options.id
        });
        var url = Url.combine(this.connector.connection.url,
            "nodes/" + options.id + "/content");
        options.model.fetch({
          url: url,
          success: options.model.fetchSuccess,
          error: options.model.fetchError,
          dataType: "text"
        }).done(_.bind(function (htmlContent) {
          //fetch the latest version
          Radio.channel("quicklink:Tiles").trigger("transparent:background");
          this._getLatestVersion().done(_.bind(function () {
            this.oldVersion = this.model.get('version');
          }, this));
        }, this));
      }

      options.richTextElementId = 'csui-richtext-content-body-' + options.id;

      Marionette.ItemView.prototype.constructor.call(this, options);

      this._errorRegion = new Marionette.Region({
        el: this.el
      });

      this.listenTo(this.model, 'sync', _.bind(function () {
        if (!this.model.error) {
          this.user.ensureFetched().done(this._renderActionsDropdown.bind(this));
        }
      }, this));

      this.mode = 'read';
      //RichText Util class That contain utility methods
      this.utils = RichTextEditor.getRichTextEditorUtils();
      this.enableSaveButton = false;

      // store all the preview link views to avoid re-fetch on every hover.
      this.previewLinkViews = {};
    },

    onRender: function () {
      var error = this.model.error;
      this.$el[error ? 'addClass' : 'removeClass']('csui-disabled');
      error ? this.$el.parent().addClass('csui-html-editor-error') : this.$el.parent().removeClass('csui-html-editor-error');
      // If fetching the node failed, render error widget over this one.
      if (error) {
        this._errorRegion.show(new ErrorView({
          model: new Backbone.Model({
            message: lang.noWikiPageFound,
            title: error.message
          })
        }));
      }
      this.$el.addClass(this.options.header ? '' : 'csui-html-editor-no-header');
      this.$el.parent().addClass(this.options.header || error ? '' : 'tile');
      this.filterHtmlContent();
      this.refreshTabableElements();
    },

    /**
     * This method filters below obsolete data from html content.
     * Attributes:
     *  border, cellspacing, cellpadding from table element.
     * Elements:
     *  big.
     */
    filterHtmlContent: function () {
      this.$el.find('table').each(function (index, table) {
        $(table).css({
          'border': table.getAttribute('border') + 'px solid',
          'borderSpacing': table.getAttribute('cellspacing') + 'px',
          'text-align': table.getAttribute('align')
        }).removeAttr('cellpadding cellspacing border align');
        $(table).find('th,td').css('padding', table.getAttribute('cellpadding') + 'px');
      });
      this.$el.find('big').each(function (index, bigEle) {
        //TODO: add attributes if any.
        $(bigEle).replaceWith('<span class="csui-big">' + $(bigEle).html() + '</span>');
      });
    },

    refreshTabableElements: function () {
      if (this.mode === 'read') {
        this.tabableElements = this.$el.find('a').toArray();
      } else {
        this.tabableElements = [];
        this.tabableElements.push(this.editorInstance.element.$);
        this.tabableElements = this.tabableElements.concat(
            $('#cke_' + this.options.richTextElementId +
              ' .csui-html-editor-action-buttons > button:not([disabled])').toArray());
      }
      this.currentlyFocusedElementIndex = -1;
    },

    moveTab: function (event) {
      this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
      var currentFocus  = $(this.tabableElements[this.currentlyFocusedElementIndex]),
          resetTabIndex = false;
      if (event.keyCode === 9) {
        if (event.shiftKey) {
          if (this.currentlyFocusedElementIndex > 0) {
            this.currentlyFocusedElementIndex -= 1;
            $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            event.stopPropagation();
            event.preventDefault();
          } else {
            resetTabIndex = true;
          }
        } else {
          if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
            this.currentlyFocusedElementIndex += 1;
            $(this.tabableElements[this.currentlyFocusedElementIndex]).prop('tabindex', 0).trigger('focus');
            event.stopPropagation();
            event.preventDefault();
          } else {
            resetTabIndex = true;
          }
        }
        if (resetTabIndex) {
          if (this.mode === 'write') {
            if (event.shiftKey) {
              this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
            } else {
              this.currentlyFocusedElementIndex = 0;
            }
            $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
          } else {
            currentFocus.on('focusout', _.bind(function () {
              currentFocus.off('focusout');
              this.currentlyFocusedElementIndex = -1;
            }, this));
          }
        }
        if (this.mode === 'write') {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    },

    _showPreview: function (event) {
      var linkPreview, options;
      this.utils.getUrl(this, event).done(_.bind(function () {
        options = _.extend({
          targetEle: event.target,
          connector: this.connector
        }, this.options);
        if (!this.previewLinkViews[event.target.href]) {
          linkPreview = new LinkPreview(options);
          // store the model once the linkPreview view fetches it.
          this.listenTo(linkPreview, 'model:fetched', function (model) {
            this.previewLinkViews[event.target.href] = model;
          });
        } else {
          // pass the model to the view if already fetched.
          options.previewModel = this.previewLinkViews[event.target.href];
          linkPreview = new LinkPreview(options);
        }
        linkPreview.render();
      }, this));

    },

    _updateUrl: function (event) {
      this.utils.getUrl(this, event);
    },

    _renderActionsDropdown: function () {
      this.node.fetch().done(_.bind(function (response) {
        this.dropdownMenu = new DropdownMenu({
          openForEdit: this._openForEdit.bind(this),
          node: this.node,
          user: this.user,
          context: this.options.context,
          parentView: this
        });
        new Marionette.Region({
          el: this.parentView.$el.find(".tile-controls")
        }).show(this.dropdownMenu);

        this.grandParentEle = this.$el.closest('.csui-html-editor-grand-parent');

        this.listenTo(this.dropdownMenu, 'render', _.bind(function () {
          this.refreshTabableElements();
          this.trigger('refresh:tabindexes');
        }, this));

        this.editIconEle = this.parentView.$el.find(".tile-controls");
        if (!!this.options.header) {
          var tileHeaderEleTitle = this.options.titlefield || '';
          this.editIconEle.closest('.tile-header').attr({
            'title': tileHeaderEleTitle,
            'aria-label': tileHeaderEleTitle
          });
        }
      }, this));
    },

    editModeAccessibility: function () {
      $(document).on('keydown.html.editor', _.bind(function (event) {
        if (!$.contains($('#cke_' + this.options.richTextElementId +
                          '.csui-rich-text-editor-toolbar .cke_inner')[0], event.target)) {
          if (event.keyCode === 9) {
            this.moveTab(event);
          } else if ([13, 32].indexOf(event.keyCode) !== -1 &&
                     $(event.target).hasClass('csui-html-edit-icon')) {
            $(event.target).trigger('click');
            event.preventDefault();
          }
        }
      }, this));
    },

    removeEditModeAccessibility: function () {
      $(document).off('keydown.html.editor');
    },

    _openForEdit: function () {
      this.editModeAccessibility();
      this.blockActions();
      this._getLatestVersion().done(_.bind(function () {
        this._toggleReserve(true).done(_.bind(function () {
          if (this.oldVersion === this.model.get('version')) {
            this._getLatestContent().done(_.bind(function () {
              this._editContent();
            }, this));

          } else {
            //Mean while new version get added, inform same to user through modal dialog
            ModalAlert.confirmQuestion(_.bind(function (result) {

              if (result) {
                //dontGetLatestcontent
                this._editContent();
                this.enableSaveButton = true;
              } else {
                //GetTheLatestContent
                this._getLatestContent().done(_.bind(function () {
                  this._editContent();
                  this.oldVersion = this.model.get('version');
                  this.enableSaveButton = false;
                }, this));
              }

              this.alreadyTriggered = true;

            }, this), lang.versionDifferenceConfirmMessage, lang.versionDifferenceConfirmTitle);

          }
        }, this)).fail(this.unblockActions.bind(this));
      }, this)).fail(this.unblockActions.bind(this));
      if (base.isAppleMobile()) {
        this.$el.find(".csui-richtext-message").attr("contenteditable", true).trigger('focus');
      }
    },

    _editContent: function () {
      var self            = this,
          url             = this.connector.connection.url,
          ckeditorConfig  = {
            'skin': 'otskin,' + this.connector.connection.supportPath +
                    '/csui/lib/ckeditor/skins/otskin/',
            'custcsuiimage_imageExtensions': 'gif|jpeg|jpg|png',
            'filebrowserUploadUrl': url.substring(0, url.indexOf('api')),
            'floatingWrapper': this.grandParentEle,
            'extraPlugins': 'csfloatingspace,filebrowser,custimage,custcsuiimage,find,panelbutton,colorbutton,' +
                            'font,selectall,smiley,dialog,sourcedialog,print,preview,justify,' +
                            'otsave,cancel,cssyntaxhighlight,cslink',
            'removePlugins': 'image,floatingspace',
            'cancel': {
              label: 'Cancel',
              onCancel: function (e) {
                self.blockActions();
                var contentDiv       = self.editorInstance,
                    isContentChanged = e.getData().length ?
                                       contentDiv.checkDirty() :
                                       self.model.get('data') !== lang.PageDefaultContent;

                if (isContentChanged) {
                  ModalAlert.confirmQuestion(function (result) {
                    if (result) {
                      self._getLatestVersion().done(function () {
                        if (self.oldVersion !== self.model.get('version')) {
                          self._getLatestContent().done(_.bind(function () {
                            self.oldVersion = this.model.get('version');
                            e.setData(self.model.get('oldData'));
                          }, self));
                        } else {
                          e.setData(self.model.get('oldData'));
                        }
                        self.trigger('updateScrollbar');
                        destroyCKEditor(e);
                        self.autoSaved && self.deleteAutoSavedContent({
                          connector: self.connector,
                          wikiId: self.node.get('parent_id'),
                          pageId: self.model.get('id')
                        });
                        self._toggleReserve();
                      });
                    } else {
                      $(self.options.richTextElementId).trigger('focus');
                      self.unblockActions();
                    }
                  }, lang.CancelConfirmMessage, lang.cancelTitle);
                } else {
                  self._getLatestVersion().done(function () {
                    if (self.oldVersion !== self.model.get('version')) {
                      self._getLatestContent().done(_.bind(function () {
                        self.oldVersion = this.model.get('version');
                        e.setData(self.model.get('oldData'));
                      }, self));
                    } else {
                      e.setData(self.model.get('oldData'));
                    }
                    destroyCKEditor(e);
                    self._toggleReserve();
                  });


                }

              }
            },
            'otsave': {
              label: 'Save',
              url: self.connector.connection.url + '/nodes/' + self.options.id,
              type: "PUT",
              useJSON: false,
              ticket: self.connector.connection.session.ticket,
              postData: function (editor) {
                return {
                  TextField: editor.getData()
                };
              },
              onSave: function (editor) {
                self.blockActions();
                self._getLatestVersion().done(function () {
                  if (!!self.alreadyTriggered || self.oldVersion === self.model.get('version')) {
                    self.enableSaveButton = false;
                    self.alreadyTriggered = false;
                    self._saveContent(editor);
                  } else {
                    ModalAlert.confirmQuestion(function (result) {
                          if (result) {
                            self.enableSaveButton = false;
                            self._saveContent(editor);
                          } else {

                            $(self.options.richTextElementId).trigger('focus');
                            self.unblockActions();
                          }
                        }, lang.versionDifferenceConfirmMessage,
                        lang.versionDifferenceConfirmTitle);
                  }
                });
              },
              onSuccess: function (editor, data) {
                //upon success, reset the model with latest data.
                self.model.set({
                  'data': editor.getData(),
                  'oldData': editor.getData()
                });
                self._getLatestVersion().done(function () {
                  self.oldVersion = self.model.get('version');
                  destroyCKEditor(editor);
                });

              },
              onFailure: function (editor, status, request) {
                destroyCKEditor(editor);
                self.render();
                self.trigger('updateScrollbar');
              }
            },
            'image': {
              url: self.connector.connection.url.replace("/api/v1", "")
            },
            'addimage': {
              url: function () {
                return url + "/nodes";
              },
              imageBrowseEnabled: function () {
                return self.node.get('parent_id_expand').imagebrowseenabled;
              },
              parent_id: self.node.get('parent_id_expand').image_folder_id,
              type: "POST",
              documentType: 144,
              ticket: self.connector.connection.session.ticket
            }
          },
          ckeditor        = RichTextEditor.getRichTextEditor(ckeditorConfig),
          destroyCKEditor = function (CKEditor) {
            $(".csui-rich-text-mask").remove();
            $(".csui-html-editor-zindex").removeClass('csui-html-editor-zindex');
            $("#csui-richtext-sharedspace").remove();
            $(".cui-rich-editor-widget-wrapper").removeAttr('style');
            self.editIconEle.removeClass('binf-hidden');
            self.$el.find(".csui-richtext-message").attr("contenteditable", false);
            CKEditor.destroy();
            self.unblockActions();
            self._unbindEvents();
            self.parentView.$el.find(".csui-html-editor-action-buttons").remove();
            $(window).off('resize');
            self.removeEditModeAccessibility();
            self.mode = 'read';
            self.refreshTabableElements();
            $('.csui-html-editor-zero-zindex').removeClass('csui-html-editor-zero-zindex');
          };

      var $rteEle = self.$("#" + this.options.richTextElementId);
      $rteEle.attr("contenteditable", true);

      this.editIconEle.addClass('binf-hidden');
      var rteMask          = document.createElement('div'),
          rteBodyMask      = document.createElement('div'),
          defaultContainer = $.fn.binf_modal.getDefaultContainer();

      rteMask.className = 'csui-rich-text-mask';
      rteBodyMask.className = 'csui-rich-text-mask csui-rich-text-body-mask';

      self.grandParentEle.before(rteMask);
      $(defaultContainer).append(rteBodyMask);

      if (base.isMSBrowser()) {
        // breadcrumb's z-index is more than the perspective container, so let's degrade it's z-index.
        !!$('#breadcrumb-wrap') &&
        $('#breadcrumb-wrap').addClass('csui-html-editor-zero-zindex');
      }

      var $rteMask     = $(rteMask),
          $rteBodyMask = $(rteBodyMask),
          // tile view with header, tile-header height is 70px, and it's padding-top is 10px, so reduce it.
          $maskOfffset = this.grandParentEle.find('.csui-html-editor-no-header').length > 0 ?
                         5 :
                         80,
          resetMasking = function () {
            $rteEle.closest('.ps-container').scrollTop(0);
            $rteBodyMask.css("height", "0px");
            $rteMask.css("top", "0px");

            var rteMaskTop        = ($rteEle.offset().top - $(rteMask).offset().top -
                                     $maskOfffset),
                rteBodyMaskHeight = $rteEle.offset().top - $maskOfffset;

            rteBodyMaskHeight = rteMaskTop < 0 ? rteBodyMaskHeight + -rteMaskTop :
                                rteBodyMaskHeight;
            rteMaskTop = rteMaskTop < 0 ? 0 : rteMaskTop;

            $rteBodyMask.css("height", rteBodyMaskHeight + "px");
            $rteMask.css({
              "height": document.body.scrollHeight - rteBodyMask.offsetHeight,
              "top": rteMaskTop
            });

            $(rteMask).parent().addClass('csui-html-editor-zindex');
          };

      resetMasking();
      $(window).on('resize', resetMasking);
      $('.csui-richtext-message').on('change', resetMasking);

      window.onbeforeunload = function (e) {
        return false;
      };

      csui.require(['csui/dialogs/node.picker/node.picker'], function (NodePicker) {
        ckeditor.config.csLink = {
          lang: {
            insertContentServerLink: lang.insertContentServerLink
          },
          nodeLink: NodeLinks,
          nodePicker: function () {
            return new NodePicker({
              connector: self.connector,
              dialogTitle: lang.contentServerLink,
              context: self.options.context,
              resolveShortcuts: true,
              resultOriginalNode: false,
              currentUser: self.options.context.getModel(UserModelFactory)
            });
          },
          enableSaveButton: function () {
            self._enableSaveButton();
          }
        };
      });

      self.editorInstance = ckeditor.inline(this.options.richTextElementId, {
        toolbar: [
          ['Undo', 'Redo', '-', 'FontSize', '-', 'Styles', 'Format', 'TextColor', '-', 'Bold',
            'Italic'],
          '/',
          ['Replace', '-', 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-',
            'JustifyLeft', 'JustifyCenter', 'JustifyRight', '-', 'Link', 'cslink', '-',
            'addImage', 'Table', 'Sourcedialog']
        ]
      });

      ckeditor.once('instanceReady', function (event) {
        if (self.ui.richText.text().trim() === lang.PageDefaultContent) {
          self.ui.richText.empty();
        }
        self.mode = 'write';
        $("#cke_" + self.options.richTextElementId).addClass(
            'csui-rich-text-editor-toolbar');
        self.unblockActions();
        self._appendActionButtons();
        $(event.editor).trigger('focus');
        self.$el.find('.csui-richtext-message').trigger('focus');
        self.editorInstance.on('change', _.throttle(function () {
          self._autoSaveContent(ckeditor);
        }, self.options.autosaveInterval, {
          leading: false
        }));
        self.editorInstance.on('change', function () {
          self._validateState();
        });
        self._actionButtonsPosition();
        self._actionButtonsPositionInEdge();
        self.refreshTabableElements();

        if (!!self.autoSaved) {
          self.deleteAutoSavedContent({
            connector: self.connector,
            wikiId: self.node.get('parent_id'),
            pageId: self.model.get('id')
          });
        }
      });

    },

    _saveContent: function (editor) {
      editor.config.otsave.request.send(editor.config.otsave.json);
      this.autoSaved && this.deleteAutoSavedContent({
        connector: this.connector,
        wikiId: this.node.get('parent_id'),
        pageId: this.model.get('id')
      });
      this._toggleReserve();
    },

    _disableSaveButton: function () {
      var toolbar    = $("#cke_csui-richtext-content-body-" + this.id),
          saveButton = toolbar.find(".csui-html-edit-save");
      if (saveButton.length) {
        saveButton[0].disabled = true;
      }

    },
    _enableSaveButton: function () {
      var toolbar    = $("#cke_csui-richtext-content-body-" + this.id),
          saveButton = toolbar.find(".csui-html-edit-save");
      if (saveButton.length) {
        saveButton[0].disabled = false;
      }

    },

    _toggleReserve: function (toEditMode) {
      var deferred = $.Deferred();
      if (!!toEditMode && this.node.get('reserved')) {
        if (this.node.get('reserved_user_id') === this.user.get('id')) {
          // no need to reserve again if current user has reserved
          deferred.resolve();
          return deferred;
        }
      }
      var contentUrl = this.connector.connection.url + '/nodes/' + this.node.get('id'),
          self       = this,
          formData   = new FormData();
      if (!!toEditMode) {
        !this.node.get('reserved') && formData.append('reserved_user_id', this.user.get('id'));
      } else {
        this.node.get('reserved') && formData.append('reserved_user_id', null);
      }
      this.updateAjaxCall({
        url: contentUrl,
        connector: this.connector,
        data: formData,
        type: 'PUT'
      }).done(function () {
        deferred.resolve();
      }).fail(function (xhr) {
        //GlobalMessage.showMessage("error", xhr.responseJSON.errorDetail);
        deferred.reject();
      }).always(function () {
        // refreshing node actions for concurrent case
        self.node.fetch();
      });
      return deferred;
    },

    _autoSaveContent: function (ckeditor) {
      var contentDiv = this.editorInstance;
      if (!!contentDiv && contentDiv.checkDirty()) {
        contentDiv.resetDirty();
        var source   = contentDiv.getData(),
            formData = new FormData();
        formData.append("wikiId", this.node.get('parent_id'));
        formData.append("pageId", this.model.get('id'));
        formData.append("source", source);

        this.updateAjaxCall({
          connector: this.connector,
          url: Url.combine(this.connector.getConnectionUrl().getApiBase('v2'),
               "/wiki/autosave"),
          type: "POST",
          data: formData,
          view: this
        });
        this.autoSaved = true;
      }
    },

    _getLatestContent: function () {
      var ajaxParams = {
        "url": Url.combine(this.connector.getConnectionUrl().getApiBase('v2') , "/wiki/" +
               this.model.get('id') + "/autosave"),
        "type": "GET",
        "requestType": "getContent",
        "connector": this.connector,
        "view": this
      };
      return this.updateAjaxCall(ajaxParams);
    },

    _getLatestVersion: function () {
      var ajaxParams = {
        "url": Url.combine(this.connector.getConnectionUrl().getApiBase('v2') , "/nodes/" +
               this.model.get('id')),
        "type": "GET",
        "requestType": "versions-reserve",
        "connector": this.connector,
        "view": this
      };
      return this.updateAjaxCall(ajaxParams);
    },

    _validateState: function () {
      this.utils = this.utils || RichTextEditor.getRichTextEditorUtils();

          // as there are only three entermode in ckeditor DIV, P, BR. checking for them, along with the any empty spaces.
        var  editorText=  RichTextEditor.isEmptyContent(this.editorInstance);

       if (!!this.editorInstance && this.editorInstance.checkDirty() &&
          !(editorText === lang.PageDefaultContent || editorText.length === 0)) {
        this._enableSaveButton();
        this.refreshTabableElements();
      } else {
        this._disableSaveButton();
        this.refreshTabableElements();
      }
    },
    /**
     * this method adds action buttons (save and cancel) to html editor view.
     *
     * @private
     */
    _appendActionButtons: function () {
      var toolbar = $("#cke_csui-richtext-content-body-" + this.id),
          data    = {
            'saveLabel': lang.saveTitle,
            'cancelLabel': lang.cancelTitle,
            'cancelAria': lang.cancelAria,
            'saveAria': lang.saveAria
          };

      toolbar.append(htmlEditorButtonsTemplate(data));

      toolbar.find(".csui-html-edit-save").on("click", _.bind(function () {
        this.editorInstance.execCommand('otsave');
      }, this));

      toolbar.find(".csui-html-edit-cancel").on("click", _.bind(function () {
        this.editorInstance.execCommand('cancel');
      }, this));
    },

    _actionButtonsPosition: function () {
      if (!!this.enableSaveButton) {
        this._enableSaveButton();
        this.refreshTabableElements();
      } else {
        this._disableSaveButton();
        this.refreshTabableElements();
      }
    },

    _actionButtonsPositionInEdge: function () {
      // only for edge browser actions buttons are mis-aligned, handling it here.
      var toolbar = $("#cke_csui-richtext-content-body-" + this.id);
      if (base.isEdge() && toolbar.attr("style").indexOf('right') !== -1) {
        toolbar.find('.cke_inner').css('float', 'right');
      }
    },

    _unbindEvents: function () {
      window.onbeforeunload = null;
    },

    updateAjaxCall: function (args) {
      var deferred    = $.Deferred(),
          url         = args.url,
          data        = args.data,
          type        = args.type,
          connector   = args.connector,
          self        = args.view,
          requestType = args.requestType;
      connector.makeAjaxCall({
        url: url,
        type: type,
        data: data,
        contentType: false,
        crossDomain: true,
        processData: false,
        success: function (response, status, jXHR) {
          switch (requestType) {
          case "getContent":
            if (!!response.results.data.autoSaved) {
              self.autoSaved = true;
              ModalAlert.confirmQuestion(function (result) {
                    var content = response.results.data.content;
                    if (result) {
                      content = response.results.data.autoSaved;
                      self.enableSaveButton = true;
                    } else {
                      self.enableSaveButton = false;
                    }
                    self.model.set({
                      'data': content
                    });
                    deferred.resolve();
                  }, lang.RestoreDialogMessage, lang.RestoreDiaglogTitle,
                  ModalAlert.buttonData.Yes = { 
                    label: lang.Continue, 
                    tooltip: lang.Continue, 
                    aria: ''},
                  ModalAlert.buttonData.No = { 
                    label: lang.Discard, 
                    tooltip: lang.Discard, 
                    aria: ''});
            } else {
              self.model.set({
                'data': response.results.data.content,
                'oldData': response.results.data.content
              });
              deferred.resolve();
            }
            break;
          case 'versions-reserve':
            self.model.attributes.version = response.results.data.versions.length;
            self.node.set({
              'reserved': response.results.data.properties.reserved,
              'reserved_user_id': response.results.data.properties.reserved_user_id
            });

            deferred.resolve();
            break;
          default:
            deferred.resolve(response);
          }
        },
        error: function (xhr, status, text) {
          deferred.reject(xhr);
        }
      });
      return deferred.promise();
    },

    deleteAutoSavedContent: function (args) {
      if (this.autoSaved) {
        args.type = "DELETE";
        args.url = Url.combine(args.connector.getConnectionUrl().getApiBase('v2') , "/wiki/" +
                   args.wikiId + "/autosave/" + args.pageId);
        this.updateAjaxCall(args);
        this.autoSaved = false;
      }
      window.clearInterval(this.intervalId);
    }
  });

  return HtmlEditorContentView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/html.editor/impl/html.editor.wrapper.template',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-html-editor-tile-controls tile-controls\"></div>\r\n<div class=\"csui-html-editor-wrapper-parent cui-rich-editor-widget-wrapper\r\ncsui-html-editor-wrapper-parent-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":3,"column":32},"end":{"line":3,"column":40}}}) : helper)))
    + "\">\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_html.editor_impl_html.editor.wrapper.template', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/html.editor/html.editor.view',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/models/node/node.model',
  'csui/models/node.children2/node.children2',
  'csui/utils/contexts/factories/node',
  'csui/utils/commands',
  'csui/controls/tile/tile.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/widgets/html.editor/impl/html.editor.content.view',
  'hbs!csui/widgets/html.editor/impl/html.editor.wrapper.template',
  'i18n!csui/widgets/html.editor/impl/nls/lang'
], function (_, $, Handlebars, Marionette, NodeModel, NodeChildren2Collection, NodeModelFactory, commands, TileView, PerfectScrollingBehavior,
    TabableRegionBehavior, DefaultActionBehavior, HtmlEditorContentView, template, lang) {

  var HtmlEditorTileView = TileView.extend({

    constructor: function HtmlEditorTileView(options) {
      options || (options = {});
      options.icon = 'cs-wiki-icon-wiki';
      this.context = options.context;
      options.id = 'csui-html-tile-wrapper-' + options.wikiPageId;

      TileView.prototype.constructor.call(this, options);

      options = options.data ? _.extend(options, options.data) : options;
      this.options = options;
      this.options.parentView = this;
      this.contentViewOptions = this.options;
    },

    contentView: HtmlEditorContentView,
    contentViewOptions: function () {
      _.extend(this.options, {parentView: this});
    },

    onShow: function () {
      this.$el.addClass(
          'cui-rich-editor-widget-wrapper cui-rich-editor-widget-wrapper-' +
          this.options.wikiPageId);
    }

  });

  var HtmlEditorWidgetView = Marionette.CompositeView.extend({
    tagName: 'div',

    className: 'csui-html-editor-grand-parent',

    templateHelpers: function () {
      return {};
    },

    template: template,

    ui: {
      editIcon: '.tile-controls',
      contentAreaLinks: '.csui-html-editor-wrapper a'
    },

    events: {
      'keydown': 'onKeyInView',
      'click @ui.contentAreaLinks': 'onClickLink'
    },

    constructor: function HtmlEditorWidgetView(options) {
      options = options || {};
      options.data || (options.data = {});
      _.extend(options, options.data);
      options.wikiPageId = options.wikipageid || options.id;
      options.id = "csui-html-editor-grand-parent-" + options.wikiPageId;
      options.title = options.titlefield || options.title;
      options.header = !!options.title;
      options.scrollableParent = !!options.header ? '.tile-content' :
                                 '.csui-html-editor-wrapper-parent';
      this.context = options.context;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: function () {
          return this.options.scrollableParent;
        },
        suppressScrollX: true
      },
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
    },
    onClickLink: function(event){
      var target = !!$(event.target).attr('href') ? $(event.target) : $(event.target).parents('a');
      if (!!target[0] && !!target.attr('href')) {
        this._handleClickLink({
          event: event,
          connector: this.options.model.connector,
          callingViewInstance: this
        });
      }
    },
    _handleClickLink: function (args) {
      var node;
      var target = !!$(args.event.target).attr("href") ? $(args.event.target) :
                   $(args.event.target).parents('a'),
          that = args.callingViewInstance,
          self = this,
          hrefValue = target.attr("href") ? target.attr("href") : "";
        if(this.htmlEditorContentView && this.htmlEditorContentView.mode === 'read'){
           if (!!hrefValue.match(/^.*\/open|Open\/(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            if (hrefValue.indexOf("open/") !== -1 || hrefValue.indexOf("Open/") !== -1) {
              var nodeId = hrefValue.substring(
                  hrefValue.lastIndexOf("/") + 1,
                  hrefValue.length);
              if(nodeId.match(/^[0-9]+$/)) {
                node = this.getNewNodeModel({
                  attributes: {
                    id: parseInt(hrefValue.substring(
                        hrefValue.lastIndexOf("/") + 1,
                        hrefValue.length), 10)
                  },
                  connector: args.connector
                });
                node.fetch()
                    .done(function () {
                      that.triggerMethod("execute:defaultAction", node);
                    }).fail(function (xhr, status, text) {
                  window.location.href = hrefValue;
                });
              } else {
                this.updateAjaxCall({
                  url: args.connector.getConnectionUrl().getApiBase("v2")+"/wiki/nickname/"+nodeId+"?actions=open&fields=properties",
                  connector: args.connector,
                  view: args.callingViewInstance,
                  type: "GET"
                }).done(function(response){
                  node = self.getNewNodeModel({},{connector: args.connector});
                  node.attributes = node.parse(response);
                  node = self.getNewNodeModel({attributes: node.attributes},{connector: args.connector});
                  that.triggerMethod("execute:defaultAction", node);
                }).fail(function(){
                  window.location.href = hrefValue;
                });
              }
            }
          } else if (!!hrefValue.match(/^.*\/wiki\/[0-9]+\/(.+)$/) ||
                    !!hrefValue.match(/^.*\/wiki\/[0-9]+$/)) {
            var wikipage;
            args.event.stopPropagation();
            args.event.preventDefault();
          if (!!hrefValue.match(/^.*\/wiki\/[0-9]+\/(.+)$/)) {
              wikipage = decodeURIComponent(hrefValue.substring(
                  hrefValue.lastIndexOf("/") + 1,
                  hrefValue.length));
            } else if (!!hrefValue.match(/^.*\/wiki\/[0-9]+$/)) {
              var url = decodeURIComponent(hrefValue.substring(0,
                  hrefValue.lastIndexOf("/") - 5));
              wikipage = decodeURIComponent(url.substring(
                  url.lastIndexOf("/") + 1,
                  url.length));
            }
            this.updateAjaxCall({
              url:  args.connector.getConnectionUrl().getApiBase("v2")+"/wiki/"+this.options.wikiid+"/wikipages",
              connector: args.connector,
              view: args.callingViewInstance,
              type: "GET"
            }).done(function(response){
              node = response.results.find(function (element) {
                if (element.name === wikipage) {
                  return element;
                }
              });
              if (!!node) {
                node = self.getNewNodeModel({
                  attributes: node,
                  connector: args.connector
                });
                node.fetch()
                    .done(function () {
                      args.callingViewInstance.triggerMethod("execute:defaultAction", node);
                    }).fail(function (xhr, status, text) {
                      window.location.href = hrefValue;
                });
              } else {
                window.location.href = hrefValue;
              }
            }).fail(function(){
              window.location.href = hrefValue;
            });

          } else if (!!hrefValue.match(/^.*objId\=(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            var objIdIndex = hrefValue.indexOf("objId=");
            if (objIdIndex !== -1) {
              node = this.getNewNodeModel({
                attributes: {
                  id: parseInt(hrefValue.substring(objIdIndex + 6,
                      (hrefValue.substring(objIdIndex + 1,
                          hrefValue.length).indexOf('&') + objIdIndex + 1)), 10)
                },
                connector: args.connector
              });
              node.fetch()
                  .done(function () {
                    args.callingViewInstance.triggerMethod("execute:defaultAction", node);
                  }).fail(function (xhr, status, text) {
                window.location.href = hrefValue;
              });
            }
          } else if (!!hrefValue.match(/^.*\/app\/nodes\/(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            if (hrefValue.indexOf("nodes/") !== -1) {
              node = this.getNewNodeModel({
                attributes: {
                  id: parseInt(hrefValue.substring(
                      hrefValue.lastIndexOf("/") + 1,
                      hrefValue.length), 10)
                },
                connector: args.connector
              });
              node.fetch().done(function () {
                that.triggerMethod("execute:defaultAction", node);
              }).fail(function (xhr, status, text) {
                window.location.href = hrefValue;
              });
            }
          }
        }
    },
    updateAjaxCall: function (args) {
      var deferred    = $.Deferred(),
          url         = args.url,
          data        = args.data,
          type        = args.type,
          connector   = args.connector;
      this.ajaxRequest = $.ajax(connector.extendAjaxOptions({
        url: url,
        type: type,
        data: data,
        contentType: false,
        crossDomain: true,
        processData: false,
        success: function (response, status, jXHR) {
          deferred.resolve(response);
        },
        error: function (xhr, status, text) {
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    currentlyFocusedElement: function () {
      if (!!this.htmlEditorContentView.dropdownMenu &&
          !this.htmlEditorContentView.dropdownMenu.haveEditPermissions) {
        return this.htmlEditorContentView.$el.find('a:first');
      } else {
        return this.$el.find('.csui-html-editor-dropdown .csui-html-editor-control');
      }
    },
    getNewNodeModel: function (options) {
      return new NodeModel(options.attributes, {
        connector: options.connector,
        commands: commands.getAllSignatures(),
        fields: options.fields || {},
        expand: options.expand || {}
      });
    },

    onKeyInView: function (event) {
      if (this.htmlEditorContentView.mode === 'read') {
        this.htmlEditorContentView.moveTab(event);
      }
    },

    onRender: function (e) {
      var that = this;
      this.getWikiDetails().done(function() {
        var _htmlView;
        that.options.autosaveInterval = 60000;
        if (that.options.header === undefined || that.options.header) { // with header
          _htmlView = new HtmlEditorTileView(that.options);
          that.listenToOnce(_htmlView, 'show', _.bind(function () {
            that.htmlEditorContentView = _htmlView.getChildView('content');
          }, that));
        } else { // without header
          that.options.parentView = that;
          _htmlView = new HtmlEditorContentView(that.options);
          that.htmlEditorContentView = _htmlView;
        }
  
        new Marionette.Region({
          el: that.$el.find(".csui-html-editor-wrapper-parent")
        }).show(_htmlView);
        that._triggerView = that;
  
        that
            .listenTo(that.htmlEditorContentView, 'refresh:tabindexes', _.bind(function () {
              that.trigger('refresh:tabindexes');
            }, that))
            .listenTo(that.htmlEditorContentView, 'updateScrollbar', _.bind(function () {
              that.trigger('dom:refresh');
            }, that));
      });
    },

    getWikiDetails: function() {    
      var model = this.options.context.getModel(NodeModelFactory),
      isInBws = !!model.get('data') && !!model.get('data').bwsinfo && !!model.get('data').bwsinfo.id, 
      that = this,
      deferred = $.Deferred(),
      wiki, wikiPage, mainPageId; 

      // If the Widget is not in a BWS object or Wiki/Wiki page is configured in the HTML tile perspective, 
      // then go ahead with the default behaviour.  
      if ( !isInBws || !!this.options.data.wikicontainerid || !!this.options.data.wikitemplateid ) { 
        deferred.resolve();
      }
      else {
        // If model is not the bws object, then set it to the parent BWS object
        model = model.get('type') === 848 ? model : new NodeModel({id: model.get('data').bwsinfo.id}, {connector: model.connector});
        // If the Widget is inside the BWS, then fetch the first created Wiki object 
        var children = this.getChildren( model, 5573, ['id', 'main_page_id'] );
        children.fetch().done(function () {  
          // Check that the wiki object exists and get the main page id
          wiki = children.length > 0 ? children.models[0] : undefined;
          if( !!wiki ) {
            mainPageId = wiki.get('main_page_id');
            if( !!mainPageId ) {
              // If main page is configured, then set the main page of the wiki as the tile content  
              that.options.wikiid = wiki.get('id');
              that.options.wikiPageid = mainPageId;
              that.options.wikiPageId = mainPageId;
              deferred.resolve();
            }
            else {
              // If main page is not configured, then get the first created wiki page 
              var wikiChildren = that.getChildren( wiki, 5574, ['id'] );
              wikiChildren.fetch().done(function () {
                wikiPage = wikiChildren.length > 0 ? wikiChildren.models[0] : undefined;
                if( !!wikiPage ) {
                  // If wiki page exists, set the first created wiki page as the tile content
                  that.options.wikiid = wiki.get('id');
                  that.options.wikiPageid = wikiPage.get('id');
                  that.options.wikiPageId = wikiPage.get('id');
                }
                deferred.resolve();
              });
            }  
          }
          else {
            // Do nothing
            deferred.resolve(); 
          }
        });           
      }
      return deferred.promise();
    },

    getChildren: function( parentNode, childType, properties ) {
      var children = new NodeChildren2Collection({}, _.defaults({
        // Fetch the TOP first object only
        top: 1,
        // Prefer refreshing the entire table to render one row after another.
        autoreset: true,
        // Minimize the response information;
        fields: {
          properties: properties
        },
        delayRestCommands: false,
        // Sort the objects by create date
        orderBy: "create_date",
        // Get the children of type specified
        filter: {type: childType}
      },
      // Parent node for the children to be fetched
      {node: parentNode}
      ));

      return children;
    }

  });
  return HtmlEditorWidgetView;
});

csui.define('csui/widgets/document.overview/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/document.overview/impl/nls/root/lang',{
  ToolbarItemOpen: 'Open',
  ToolbarItemDownload: 'Download',
  ToolbarItemEdit: 'Edit',
  ToolbarItemProperties: 'Properties',
  location: "Location",
  docPreviewImgAlt: 'Document Preview',
  name: "Name",
  description: "Description",
  created: "Created",
  createdBy: "Created by",
  type: "Type",
  modified: "Modified",
  ownedBy: "Owned by",
  size: "Size",
  reservedBy: 'Reserved by',
  noValue: 'No value',
  reservedByUnreserve: 'Reserved by {0}, Press to unreserve',
  goBackTitle: 'Go back',
  goBackAria: 'Go back'
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/document.overview/impl/document.overview',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"overview-page-backbutton icon arrow_back cs-go-back csui-acc-focusable-active\"\r\n           aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackAria") || (depth0 != null ? lookupProperty(depth0,"goBackAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackAria","hash":{},"loc":{"start":{"line":6,"column":23},"end":{"line":6,"column":37}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTitle") || (depth0 != null ? lookupProperty(depth0,"goBackTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTitle","hash":{},"loc":{"start":{"line":6,"column":46},"end":{"line":6,"column":61}}}) : helper)))
    + "\" role=\"link\" tabindex=\"0\"></div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"description_section doc-overview-general-information\">\r\n          <div class=\"doc-overview-form-group\">\r\n            <label class=\"doc-overview-control-label\" for=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":99,"column":63},"end":{"line":99,"column":73}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":99,"column":82},"end":{"line":99,"column":96}}}) : helper)))
    + "\">\r\n              "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":100,"column":14},"end":{"line":100,"column":28}}}) : helper)))
    + "\r\n            </label>\r\n            <div class=\"binf-col-sm-9\">\r\n              <button disabled id=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":103,"column":39},"end":{"line":103,"column":49}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":103,"column":63},"end":{"line":103,"column":77}}}) : helper)))
    + ":\r\n              "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":104,"column":14},"end":{"line":104,"column":28}}}) : helper)))
    + "\"><span class=\"csui-ellipsis-area no-ellipsis\"><span><span\r\n                  class=\"cs-field-textarea-data\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":105,"column":49},"end":{"line":105,"column":63}}}) : helper)))
    + "</span></span>\r\n                </span>\r\n              </button>\r\n            </div>\r\n            <div style=\"clear:both;\"></div>\r\n          </div>\r\n        </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-content-wrapper cs-content-overlay-wrapper\">\r\n\r\n  <div class=\"cs-content-header\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"back_button") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"title-container\"></div>\r\n    <div class=\"actions-container\">\r\n      <div class=\"commentRegion\"></div>\r\n      <div class=\"favoriteRegion\"></div>\r\n    </div>\r\n  </div>\r\n  <div class=\"cs-content-container\">\r\n    <div class=\"description-container cs-content\">\r\n\r\n      <div class=\"created_by_section doc-overview-general-information\">\r\n        <div class=\"doc-overview-form-group\">\r\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\">\r\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <div class=\"csui-doc-overview-created-by-pic\"></div>\r\n            <div class=\"csui-doc-overview-created-by-user\"></div>\r\n          </div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"modified_section doc-overview-general-information\">\r\n        <div class=\"doc-overview-form-group\">\r\n          <label class=\"doc-overview-control-label\" for=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":31,"column":61},"end":{"line":31,"column":71}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":31,"column":80},"end":{"line":31,"column":96}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":32,"column":12},"end":{"line":32,"column":28}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button disabled id=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":35,"column":37},"end":{"line":35,"column":47}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":35,"column":61},"end":{"line":35,"column":77}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":35,"column":79},"end":{"line":35,"column":94}}}) : helper)))
    + "\">\r\n              <span title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":36,"column":27},"end":{"line":36,"column":42}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":36,"column":44},"end":{"line":36,"column":59}}}) : helper)))
    + "</span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"type_section doc-overview-general-information\">\r\n        <div class=\"doc-overview-form-group\">\r\n          <label class=\"doc-overview-control-label\" for=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":45,"column":61},"end":{"line":45,"column":71}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":45,"column":80},"end":{"line":45,"column":94}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":46,"column":12},"end":{"line":46,"column":26}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button title=\"Microsoft Word\" id=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":49,"column":51},"end":{"line":49,"column":61}}}) : helper)))
    + "\" disabled\r\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":50,"column":32},"end":{"line":50,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":50,"column":48},"end":{"line":50,"column":61}}}) : helper)))
    + "\">\r\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":51,"column":20},"end":{"line":51,"column":33}}}) : helper)))
    + "</span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"size_section doc-overview-general-information\">\r\n        <div class=\"doc-overview-form-group\">\r\n          <label class=\"doc-overview-control-label\" for=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":60,"column":61},"end":{"line":60,"column":71}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":60,"column":80},"end":{"line":60,"column":94}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":61,"column":12},"end":{"line":61,"column":26}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_full_value") || (depth0 != null ? lookupProperty(depth0,"size_full_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_full_value","hash":{},"loc":{"start":{"line":64,"column":27},"end":{"line":64,"column":46}}}) : helper)))
    + "\" id=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":64,"column":56},"end":{"line":64,"column":66}}}) : helper)))
    + "\" disabled\r\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":65,"column":32},"end":{"line":65,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":65,"column":48},"end":{"line":65,"column":62}}}) : helper)))
    + "\">\r\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":66,"column":20},"end":{"line":66,"column":34}}}) : helper)))
    + "</span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"reserve_info doc-overview-general-information binf-hidden\">\r\n        <div class=\"doc-overview-form-group\">\r\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"reservedBy") : stack1), depth0))
    + "\">\r\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"reservedBy") : stack1), depth0))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <div class=\"doc-overview-reserve\">\r\n              <div class=\"csui-doc-overview-reserve-btn\"></div>\r\n              <div class=\"csui-doc-overview-reserve-user\"></div>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"location-container doc-overview-general-information\">\r\n        <div class=\"doc-overview-form-group\">\r\n          <label class=\"doc-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\">\r\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9 location-view\"></div>\r\n        </div>\r\n      </div>\r\n\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_description") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":96,"column":6},"end":{"line":112,"column":13}}})) != null ? stack1 : "")
    + "\r\n    </div>\r\n\r\n    <div class=\"binf-col-md-4 thumbnail-container binf-hidden binf-text-left cs-content\">\r\n      <div class=\"metadata-tab\">\r\n        <div class=\"thumbnail_section metadata-preview preview-section\"\r\n             title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "\">\r\n          <img role=\"link\" src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgSrc") || (depth0 != null ? lookupProperty(depth0,"imgSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgSrc","hash":{},"loc":{"start":{"line":120,"column":32},"end":{"line":120,"column":42}}}) : helper)))
    + "\" class=\"img-doc-preview binf-hidden\" alt=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgAlt") || (depth0 != null ? lookupProperty(depth0,"imgAlt") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgAlt","hash":{},"loc":{"start":{"line":120,"column":85},"end":{"line":120,"column":95}}}) : helper)))
    + "\" />\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n  <div class=\"cs-fadeout-container\"></div>\r\n  <div class=\"cs-content-footer\">\r\n    <button class=\"binf-btn primary-btn command-btn open-btn\" type=\"button\"\r\n            data-signature=\"Open\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "</button>\r\n    <button class=\"binf-btn default-btn command-btn csui-doc-overview-download-btn\" type=\"button\"\r\n            data-signature=\"Download\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemDownload") : stack1), depth0))
    + "</button>\r\n    <button class=\"binf-btn default-btn command-btn edit-btn\" type=\"button\"\r\n            data-signature=\"Edit\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemEdit") : stack1), depth0))
    + "</button>\r\n    <button class=\"binf-btn default-btn command-btn\" type=\"button\"\r\n            data-signature=\"Properties\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemProperties") : stack1), depth0))
    + "</button>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_document.overview_impl_document.overview', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/document.overview/impl/document.overview',[],function(){});
csui.define('csui/widgets/document.overview/document.overview.view',[
  'module', 'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/types/date',
  'csui/utils/nodesprites',
  'csui/utils/contexts/factories/node',
  'csui/utils/thumbnail/thumbnail.object',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/models/nodes',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/commands',
  'csui/utils/commandhelper',
  'csui/controls/progressblocker/blocker',
  'i18n!csui/widgets/document.overview/impl/nls/lang',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/next.node',
  'hbs!csui/widgets/document.overview/impl/document.overview',
  'css!csui/widgets/document.overview/impl/document.overview'
], function (module, _, Marionette, $, log,
    Url,
    DateType,
    NodeSpriteCollection,
    NodeModelFactory, Thumbnail,
    ToolbarCommandController,
    NodeCollection,
    PerfectScrollingBehavior,
    commands, CommandHelper,
    BlockingView, lang, LargeFileSettingsFactory,
    NextNodeModelFactory, documentOverviewTemplate) {
  'use strict';

  log = log(module.id);

  var DocumentOverviewView = Marionette.ItemView.extend({
    className: 'cs-form csui-general-form cs-document-overview-wrapper',
    template: documentOverviewTemplate,
    templateHelpers: function () {
      var back_button    = true,
          mimeType       = NodeSpriteCollection.findTypeByNode(this.options.node),
          sizeValue      = this.options.node.get("size_formatted"),
          sizeFullValue  = this.options.node.get("size"),
          modifyDate     = DateType.formatExactDateTime(
              DateType.deserializeDate(this.options.node.get("modify_date"))),
          descValue      = this.options.node.get("description"),
          hasDescription = !!descValue,
          messages       = {
            unique: _.uniqueId('_doc'),
            lang: lang,
            back_button: back_button,
            mime_type: mimeType,
            has_description: hasDescription,
            size_value: sizeValue,
            size_full_value: sizeFullValue,
            modify_date: modifyDate,
            desc_value: descValue,
            type_label: lang.type,
            size_label: lang.size,
            modify_label: lang.modified,
            desc_label: lang.description,
            // a 1x1 transparent gif, to avoid an empty src tag
            imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
            imgAlt: lang.docPreviewImgAlt,
            goBackTitle: lang.goBackTitle,
            goBackAria: lang.goBackAria
          };
      return messages;
    },

    ui: {
      location: '.location-view',
      back: '.cs-go-back',
      titleContainer: '.title-container',
      commentButtonRegion: '.commentRegion',
      favoriteStarRegion: '.favoriteRegion',
      thumbnailContainer: '.thumbnail-container',
      modifySectionBtn: '.modified_section button',
      mimeTypeBtn: '.type_section button',
      sizeSectionBtn: '.size_section button',
      thumbnailImg: '.img-doc-preview',
      reserveInfo: '.reserve_info',
      reserveUser: '.csui-doc-overview-reserve-user',
      reserverBtn: '.csui-doc-overview-reserve-btn',
      createdBy: '.created_by_section .binf-col-sm-9',
      creadyByUser: '.csui-doc-overview-created-by-user',
      createdByPic: '.csui-doc-overview-created-by-pic',
      openBtn: '.open-btn',
      editBtn: '.edit-btn',
      downloadBtn: '.csui-doc-overview-download-btn'
    },

    events: {
      "click .command-btn": "_handleClickButton",
      "click .thumbnail_section": "_handleClickThumbnail",
      'click @ui.back': 'onBackButton',
      'keydown': 'onKeyInView'
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".cs-content-container",
        suppressScrollX: true
      }
    },

    constructor: function DocumentOverviewView(options) {
      options || (options = {});
      BlockingView.imbue(this);
      options.data || (options.data = {});
      if (!options.node) {
        options.node = options.context.getModel(NodeModelFactory, {
          attributes: options.data.id && {id: options.data.id},
          temporary: true
        });
      }
      this.options = options;
      var viewStateModel = options.context && options.context.viewStateModel;
      this.back_button = viewStateModel && viewStateModel.hasRouted();
      this.largeFileSettingsFactory = this.options.context.getFactory(LargeFileSettingsFactory);
      this.largeFileSettingsModel = this.largeFileSettingsFactory && this.largeFileSettingsFactory.property;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.commandController = new ToolbarCommandController({
        commands: options.commands || commands
      });

      this.commands = this.commandController.commands;
      this.reloadWidget = false;
      this.parentNode = undefined;
      this.supportOriginatingView = true;

      this.listenTo(this.options.node, 'change', _.bind(this._handleNodeChange, this));
      this.listenTo(this, 'new:version:added', _.bind(this._handleVersionChange, this));
      this.listenTo(this.options.node, 'delete',  _.bind(this._navigateToParent, this));

      viewStateModel && this.listenTo(viewStateModel, "navigate", function (historyEntry) {
        if (historyEntry && !this.back_button) {
          this.ui.back.show();
        }
      });

      this.blockActions();
    },

    onRender: function () {
      this._showMetadataItemName();
      this._addCommentView();
      this._addFavoriteView();
      this._showThumbnail();
      this._addLocationView();
      this._showCreatedByUserName();
      this._showReserveRow();
      this._checkPermissions();
      if (!this.back_button) {
        this.ui.back.hide();
      }
    },

    _unblockActions: function () {
      this.unblockActions();
      this.$el.find('.cs-content-wrapper').removeClass('cs-content-overlay-wrapper');
    },

    onShow: function () {
      this.$el.addClass("adjust-scroll");
    },

    onDomRefresh: function () {
      this.metadataItemNameView && this.metadataItemNameView.triggerMethod('dom:refresh');
    },

    _isReserved: function () {
      return this.options.node.get('reserved') === true;
    },

    _showMetadataItemName: function () {

      csui.require(['csui/widgets/metadata/impl/header/item.name/metadata.item.name.view'],
          _.bind(function (MetadataItemNameView) {

            if (this.metadataItemNameView) {
              this.metadataItemNameView.destroy();
            }

            this.metadataItemNameView = new MetadataItemNameView({
              model: this.options.node,
              container: this.options.node.parent,
              containerCollection: this.options.containerCollection,
              collection: this.options.collection,
              context: this.options.context,
              nameSchema: {},
              commands: this.commands,
              originatingView: this,
              showDropdownMenu: true,
              showPropertiesCommand: true,
              noMetadataNavigation: true
            });

            this.listenTo(this.metadataItemNameView, "metadata:item:name:save", this._saveItemName);
            var inv = this.metadataItemNameView.render();
            Marionette.triggerMethodOn(inv, "before:show", inv, this);
            this.ui.titleContainer.append(inv.el);
            Marionette.triggerMethodOn(inv, "show", inv, this);

          }, this));

    },

    _saveItemName: function (args) {
      var self = this,
          itemName = args.sender.getValue(),
          name = {name: itemName},
          model = args.sender && args.sender.model,
          node = this.options.model || this.options.node;

      model && model.changed.name_multilingual && _.extend(name, {
        name_multilingual: model.changed.name_multilingual,
      });

      node.setFields("versions.element(0)", "owner_id");
      var data = _.clone(node.attributes);
      return node
          .save(data, {
            data: name,
            wait: true,
            silent: true
          })
          .then(function () {
            node.fetch({silent: true}).done(function () {
              self._updateModifyDateAndTimeStamp();
              args.success();
              node.set(name, {silent: true});
            });
          })
          .fail(function (error) {
            args.error(error);
          });
    },

    _addCommentView: function () {
      csui.require(['csui/controls/tableheader/comment/comment.button.view',
            'esoc/widgets/utils/commentdialog/commentdialog.view'],
          _.bind(function (CommentView) {
            var commentOptions = this.options;
            commentOptions.originatingView = this;
            commentOptions.model = this.options.node || this.options.model;
            var commentView = new CommentView(commentOptions);

            var commentRegion = new Marionette.Region({
              el: this.ui.commentButtonRegion
            });
            commentRegion.show(commentView);
            this._unblockActions();
          }, this));
    },

    _addFavoriteView: function () {
      csui.require(['csui/widgets/favorites/favorite.star.view'],
          _.bind(function (FavoriteStarView) {
            var favoriteOptions = this.options;
            favoriteOptions.model = this.options.node || this.options.model;
            favoriteOptions.popoverAtBodyElement = true;
            var favoriteView = new FavoriteStarView(favoriteOptions);

            var favoriteRegion = new Marionette.Region({
              el: this.ui.favoriteStarRegion
            });
            favoriteRegion.show(favoriteView);
          }, this));
    },

    _updateFieldsToRefresh: function () {
      this._updateModifyDateAndTimeStamp();
      this._updateMimeType();
      this._updateSize();
      this._updateReserveField();
    },

    _handleNodeChange: function () {
      if (!!this.options.node.isReservedClicked || this.options.node.isUnreservedClicked) {
        this._updateReserveField();
        this._updateModifyDateAndTimeStamp();
        this.options.node.isReservedClicked = false;
        this.options.node.isUnreservedClicked = false;
      } else if (this.options.node.changed.csuiDelayedActionsRetrieved) {
        this.isReserved = false;
        this._updateReserveField();
        this._checkPermissions();
      }
      else {
        this._updateFieldsToRefresh();
      }
    },

    _handleVersionChange: function () {
      this.ui.thumbnailContainer.addClass("binf-hidden");
      this.$el.removeClass("cs-document-overview-wrapper-with-thumbnail");
    },

    _updateModifyDateAndTimeStamp: function () {
      var modifyBtnEle  = this.ui.modifySectionBtn,
          modifySpanEle = modifyBtnEle.find('span'),
          modifyDate    = DateType.formatExactDateTime(
              DateType.deserializeDate(this.options.node.get("modify_date")));

      if (modifySpanEle.text() != modifyDate) {
        modifyBtnEle.attr('aria-label', lang.modified + ':' + modifyDate);
        modifySpanEle.attr('title', modifyDate).text(modifyDate);
      }
    },

    _updateMimeType: function () {
      var mimeTypeBtnEle  = this.ui.mimeTypeBtn,
          mimeTypeSpanEle = mimeTypeBtnEle.find('span'),
          mimeType        = NodeSpriteCollection.findTypeByNode(this.options.node);

      if (mimeTypeSpanEle.text() != mimeType) {
        mimeTypeBtnEle.attr({
          'aria-label': lang.type + ':' + mimeType,
          'title': mimeType
        });
        mimeTypeSpanEle.text(mimeType);
      }
    },

    _updateSize: function () {
      var sizeBtnEle  = this.ui.sizeSectionBtn,
          sizeSpanEle = sizeBtnEle.find('span'),
          sizeFullVal = this.options.node.get('size'),
          sizeVal     = this.options.node.get('size_formatted');

      if (sizeSpanEle.text() != sizeVal) {
        sizeBtnEle.attr({
          'aria-label': lang.size + ':' + sizeVal,
          'title': sizeFullVal
        });
        sizeSpanEle.text(sizeVal);
      }
    },

    _showThumbnail: function () {
      this.thumbnail =
          this.options.thumbnail ||
          new Thumbnail({
            node: this.options.node
          });
      this.listenTo(this.thumbnail, "loadUrl", this._showImage);
      this.listenTo(this.thumbnail, "error", this._showDefaultImage);
      this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));

      if (!this.thumbnailSet) {
        var self = this;
        this.thumbnailSet = true;
        //Just show image if url is available,otherwise load thumbnail
        if (this.thumbnail.hasOwnProperty("imgUrl") && !!this.thumbnail.imgUrl) {
          this._showImage();
        } else {
          this.thumbnail.loadUrl();
        }
      }
    },

    _showImage: function () {
      this.$el.addClass("cs-document-overview-wrapper-with-thumbnail");
      this.ui.thumbnailContainer.removeClass("binf-hidden");
      this.trigger("thumbnail:show:image");
      var self = this,
          img  = this.ui.thumbnailImg;
      img.attr("src", this.thumbnail.imgUrl);
      img.prop("tabindex", "0");
      img.one("load", function (evt) {
        if (evt.target.clientHeight >= evt.target.clientWidth) {
          img.addClass("cs-form-img-vertical");
        } else {
          img.addClass("cs-form-img-horizontal");
        }
        img.addClass("cs-form-img-border");
        img.removeClass("binf-hidden");

        // event for keyboard navigation
        var event = $.Event("tab:content:render");
        self.$el.trigger(event);
      });
    },

    _showDefaultImage: function (thumbnail, error) {
      log.warn(error.message);
    },

    _destroyThumbnail: function () {
      if (this.thumbnail) {
        this.thumbnail.destroy();
        this.thumbnail = undefined;
      }
      this.thumbnailSet = false;
    },

    _addLocationView: function () {
      var self           = this,
          renderLocation = function () {
            csui.require(['csui/controls/table/cells/parent/parent.view'],
                _.bind(function (ParentCellView) {
                  var field = new ParentCellView({
                    model: self.options.node,
                    context: self.options.context,
                    nameEdit: false,
                    iconSize: 'contain',
                    el: self.$el.find(self.ui.location)
                  });
                  field.render();
                }, this));
          };

      if (!this.options.node.get("parent_id_expand")) {
        var node        = this.options.node,
            parent_id   = node.get('parent_id'),
            connector   = node.connector,
            fullUrl     = Url.combine(connector.getConnectionUrl().getApiBase('v2'),
                '/nodes/' + parent_id +
                '/properties'),
            ajaxOptions = {
              type: 'GET',
              url: fullUrl
            };

        connector
            .makeAjaxCall(ajaxOptions)
            .done(_.bind(function (resp) {
              node.set('parent_id_expand', resp.results.data.properties, {silent: true});
              renderLocation();
            }, this));
      } else {
        renderLocation();
      }
    },

    _showReserveRow: function () {
      this._updateReserveField();
    },

    _cleanAndInitReserveRow: function () {
      this.ui.reserveInfo.addClass('binf-hidden');
      this.reserveFieldView.$el.html();
      this.ui.reserveUser.html();
    },

    _updateReserveField: function () {
      var isNodeReserved = this._isReserved();
      if (isNodeReserved && !this.isReserved) {
        this.ui.reserveInfo.removeClass('binf-hidden');
        var opts = {
              context: this.options.context,
              tableView: this,
              model: this.options.node || this.options.model,
              reservedByLabel: lang.reservedByUnreserve
            },
            self = this;

        csui.require(['csui/controls/node.state/impl/reservation/reservation.view'],
            function (ReserveFieldView) {
              self.reserveFieldView = new ReserveFieldView(opts);
              var reserveFieldRegion = new Marionette.Region({
                el: self.ui.reserverBtn
              });

              self.reserveFieldView.tagName = 'span';

              reserveFieldRegion.show(self.reserveFieldView);
              // this mitigates the isolated li of the reservation icon and makes the button usable per keyboard
              self.$el.find('li.csui-node-state-reservation').attr('role','none').find('button').removeAttr('tabindex');

              self._getUserField({
                userid: self.options.node.get('reserved_user_id'),
                placeholder: self.ui.reserveUser,
                showUserProfileLink: true
              });
              self.isReserved = true;
            });
      } else if (!isNodeReserved && !!this.isReserved) {
        this.reserveFieldView && this.reserveFieldView.destroy();
        this._cleanAndInitReserveRow();
        this.isReserved = false;
      }
    },

    _showCreatedByUserName: function () {
      var userOptions = {
        baseElement: this.ui.createdBy,
        userId: this.options.node.get("create_user_id")
      };
      this._showUserName(userOptions);
    },

    _showUserName: function (userOptions) {

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.creadyByUser,
        showUserProfileLink: true
      });

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.createdByPic,
        userWidgetWrapperClass: "",
        showUserWidgetFor: 'profilepic'
      });
    },

    _getUserField: function (userOptions) {
      csui.require(['esoc/controls/userwidget/userwidget.view'],
          _.bind(function (UserWidgetView) {

            var userWidgetOptions = _.extend({
              context: this.options.context,
              showMiniProfile: true,
              connector: this.options.node.connector,
              imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
            }, userOptions);

            var userwidgetview = new UserWidgetView(userWidgetOptions),
                contentRegion  = new Marionette.Region({
                  el: $(userOptions.placeholder)
                });
            contentRegion.show(userwidgetview);
          }, this));
    },

    /**
     * This method define specific action's options and invokes the checkPermissionFor method
     * for that specific action.
     *
     * @private
     */
    _checkPermissions: function () {
      var editCmdOptions     = {
            'signature': 'Edit',
            'actionBtnEle': this.ui.editBtn
          },
          downloadCmdOptions = {
            'signature': 'Download',
            'actionBtnEle': this.ui.downloadBtn
          },
          openCmdOptions = {
            'signature': 'Open',
            'actionBtnEle': this.ui.openBtn
          };

      this._checkPermForOpenAction(openCmdOptions);
      this._checkPermForSpecificAction(editCmdOptions);
      this._checkPermForSpecificAction(downloadCmdOptions);
    },

    _checkPermForOpenAction: function (cmdOptions) {
      // the open command provides a separate public method 'checkPermission'.
      var command = this.commands.findWhere({signature: cmdOptions.signature});
      command.checkPermission(this.options.node).then(function (permitted) {
        if(!permitted) {
          cmdOptions.actionBtnEle.addClass('binf-hidden');
        } else {
          cmdOptions.actionBtnEle.removeClass('binf-hidden');
        }
      });
    },

    /**
     * This method checks whether the given action signature is permitted or not, and based on
     * the output it handles the respective view element.
     *
     * @param cmdOptions, Object which contains command options.
     * @private
     */
    _checkPermForSpecificAction: function (cmdOptions) {
      var command = this.commands.findWhere({signature: cmdOptions.signature}),
          status  = {
            nodes: new NodeCollection([this.options.node]),
            container: this.options.node.parent
          },
          options = {
            context: this.options.context
          };

      if (!(command && command.enabled(status, options))) {
        cmdOptions.actionBtnEle.addClass("binf-hidden");
      } else {
        cmdOptions.actionBtnEle.removeClass("binf-hidden");
      }
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 13 || event.keyCode === 32) {
        if (!(this.$el.find('.title-input').is(event.target))) {
           // enter key(13) or space(32)
          event.preventDefault();
          event.stopPropagation();
          $(target).trigger('click');
        }
      }
    },

    onBackButton: function () {
      if (!this.backButtonClicked) {
        var options = this.options,
            context = options && options.context,
            viewStateModel = context && context.viewStateModel;
        viewStateModel && viewStateModel.restoreLastFragment();
        this.backButtonClicked = true;
      }
    },

    _handleClickThumbnail: function (event) {
      event.stopImmediatePropagation();
      this._executeCommand("Open");
    },

    _handleClickButton: function (event) {
      event.stopImmediatePropagation();
      var signature = $(event.target).data("signature");
      this._executeCommand(signature);
    },

    _executeCommand: function (signature) {
      var command = this.commands.get(signature);
      var originatingView = this;
      originatingView.collection = new NodeCollection([this.options.node]);

      var status = {
        nodes: new NodeCollection([this.options.node]),
        container: this.options.node,
        originatingView: originatingView
      };
      var options = {
        context: this.options.context
      };

      try {
        // If the command was not found and the toolitem is executable, it is
        // a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        var promise = command.execute(status, options);
        CommandHelper.handleExecutionResults(
            promise, {
              command: command,
              suppressSuccessMessage: status.suppressSuccessMessage,
              suppressFailMessage: status.suppressFailMessage
            });
      } catch (error) {
        log.warn(
            'Executing the command "{0}" failed.\n{1}',
            command.get("signature"),
            error.message
        ) && console.warn(log.last);
      }
    },

    _navigateToParent: function () {
      var parentId = this.options.model.get('parent_id');
      if (parentId) {
        this._setNextNodeModelFactory(parentId);
      } 
    },

    _setNextNodeModelFactory: function (id) {
      if (this.options.context && id !== undefined) {
        var nextNode = this.options.context.getModel(NextNodeModelFactory);
        if (nextNode) {
          if (nextNode.get('id') === id) {
            // when id is same as nextNode's id, nextNode.set(id) event is not triggered
            nextNode.unset('id', {silent: true});
          }
          nextNode.set('id', id);
        }
      }
    }

  });

  return DocumentOverviewView;

});

csui.define('csui/widgets/version.overview/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
});

csui.define('csui/widgets/version.overview/impl/nls/root/lang',{
    ToolbarItemOpen: 'Open',
    ToolbarItemDownload: 'Download',
    ToolbarItemProperties: 'Properties',
    location: "Location",
    docPreviewImgAlt: 'Version Preview',
    name: "Name",
    description: "Description",
    created: "Created",
    createdBy: "Created by",
    type: "Type",
    modified: "Modified",
    ownedBy: "Owned by",
    size: "Size",
    noValue: 'No value',
    goBackTitle: 'Go back',
    goBackAria: 'Go back',
    versionText: 'v {0}',
    versionAria: 'version {0}'
  });


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/version.overview/impl/version.overview',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"overview-page-backbutton icon arrow_back cs-go-back csui-acc-focusable-active\"\r\n           aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackAria") || (depth0 != null ? lookupProperty(depth0,"goBackAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackAria","hash":{},"loc":{"start":{"line":6,"column":23},"end":{"line":6,"column":37}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTitle") || (depth0 != null ? lookupProperty(depth0,"goBackTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTitle","hash":{},"loc":{"start":{"line":6,"column":46},"end":{"line":6,"column":61}}}) : helper)))
    + "\" role=\"link\" tabindex=\"0\"></div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "binf-hidden";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-content-wrapper cs-content-overlay-wrapper\">\r\n\r\n  <div class=\"cs-content-header\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"back_button") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"title-container\"></div>\r\n    <div class=\"overview-page-version-label\">\r\n      <span class=\"csui-overview-version-label\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"versionAria") || (depth0 != null ? lookupProperty(depth0,"versionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"versionAria","hash":{},"loc":{"start":{"line":10,"column":60},"end":{"line":10,"column":75}}}) : helper)))
    + "\">\r\n        "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"versionText") || (depth0 != null ? lookupProperty(depth0,"versionText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"versionText","hash":{},"loc":{"start":{"line":11,"column":8},"end":{"line":11,"column":23}}}) : helper)))
    + "\r\n      </span>\r\n    </div>\r\n  </div>\r\n  <div class=\"cs-content-container\">\r\n    <div class=\"description-container cs-content\">\r\n\r\n      <div class=\"created_by_section version-overview-general-information\">\r\n        <div class=\"version-overview-form-group\">\r\n          <label class=\"version-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\">\r\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"createdBy") : stack1), depth0))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <div class=\"csui-version-overview-created-by-pic\"></div>\r\n            <div class=\"csui-version-overview-created-by-user\"></div>\r\n          </div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"modified_section version-overview-general-information\">\r\n        <div class=\"version-overview-form-group\">\r\n          <label class=\"version-overview-control-label\" for=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":32,"column":65},"end":{"line":32,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":32,"column":84},"end":{"line":32,"column":100}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":33,"column":12},"end":{"line":33,"column":28}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button disabled id=\"modi"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":36,"column":37},"end":{"line":36,"column":47}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_label") || (depth0 != null ? lookupProperty(depth0,"modify_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_label","hash":{},"loc":{"start":{"line":36,"column":61},"end":{"line":36,"column":77}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":36,"column":79},"end":{"line":36,"column":94}}}) : helper)))
    + "\">\r\n              <span title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":37,"column":27},"end":{"line":37,"column":42}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"modify_date") || (depth0 != null ? lookupProperty(depth0,"modify_date") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"modify_date","hash":{},"loc":{"start":{"line":37,"column":44},"end":{"line":37,"column":59}}}) : helper)))
    + "</span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"type_section version-overview-general-information\">\r\n        <div class=\"version-overview-form-group\">\r\n          <label class=\"version-overview-control-label\" for=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":46,"column":65},"end":{"line":46,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":46,"column":84},"end":{"line":46,"column":98}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":47,"column":12},"end":{"line":47,"column":26}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":50,"column":27},"end":{"line":50,"column":40}}}) : helper)))
    + "\" id=\"type"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":50,"column":50},"end":{"line":50,"column":60}}}) : helper)))
    + "\" disabled\r\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type_label") || (depth0 != null ? lookupProperty(depth0,"type_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"type_label","hash":{},"loc":{"start":{"line":51,"column":32},"end":{"line":51,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":51,"column":48},"end":{"line":51,"column":61}}}) : helper)))
    + "\">\r\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mime_type") || (depth0 != null ? lookupProperty(depth0,"mime_type") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mime_type","hash":{},"loc":{"start":{"line":52,"column":20},"end":{"line":52,"column":33}}}) : helper)))
    + "</span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"size_section version-overview-general-information\">\r\n        <div class=\"version-overview-form-group\">\r\n          <label class=\"version-overview-control-label\" for=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":61,"column":65},"end":{"line":61,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":61,"column":84},"end":{"line":61,"column":98}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":62,"column":12},"end":{"line":62,"column":26}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_full_value") || (depth0 != null ? lookupProperty(depth0,"size_full_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_full_value","hash":{},"loc":{"start":{"line":65,"column":27},"end":{"line":65,"column":46}}}) : helper)))
    + "\" id=\"size"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":65,"column":56},"end":{"line":65,"column":66}}}) : helper)))
    + "\" disabled\r\n                    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_label") || (depth0 != null ? lookupProperty(depth0,"size_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_label","hash":{},"loc":{"start":{"line":66,"column":32},"end":{"line":66,"column":46}}}) : helper)))
    + ": "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":66,"column":48},"end":{"line":66,"column":62}}}) : helper)))
    + "\">\r\n              <span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"size_value") || (depth0 != null ? lookupProperty(depth0,"size_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"size_value","hash":{},"loc":{"start":{"line":67,"column":20},"end":{"line":67,"column":34}}}) : helper)))
    + "</span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"location-container version-overview-general-information\">\r\n        <div class=\"version-overview-form-group\">\r\n          <label class=\"version-overview-control-label\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\">\r\n            "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"location") : stack1), depth0))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9 location-view\"></div>\r\n        </div>\r\n      </div>\r\n\r\n      <div class=\"description_section version-overview-general-information "
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_description") : depth0),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":83,"column":75},"end":{"line":83,"column":124}}})) != null ? stack1 : "")
    + "\">\r\n        <div class=\"version-overview-form-group\">\r\n          <label class=\"version-overview-control-label\" for=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":85,"column":65},"end":{"line":85,"column":75}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":85,"column":84},"end":{"line":85,"column":98}}}) : helper)))
    + "\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":86,"column":12},"end":{"line":86,"column":26}}}) : helper)))
    + "\r\n          </label>\r\n          <div class=\"binf-col-sm-9\">\r\n            <button disabled id=\"desc"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"unique") || (depth0 != null ? lookupProperty(depth0,"unique") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"unique","hash":{},"loc":{"start":{"line":89,"column":37},"end":{"line":89,"column":47}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_label") || (depth0 != null ? lookupProperty(depth0,"desc_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_label","hash":{},"loc":{"start":{"line":89,"column":61},"end":{"line":89,"column":75}}}) : helper)))
    + ":\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":90,"column":12},"end":{"line":90,"column":26}}}) : helper)))
    + "\"><span class=\"csui-ellipsis-area no-ellipsis\"><span><span\r\n                class=\"cs-field-textarea-data\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"desc_value") || (depth0 != null ? lookupProperty(depth0,"desc_value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"desc_value","hash":{},"loc":{"start":{"line":91,"column":47},"end":{"line":91,"column":61}}}) : helper)))
    + "</span></span>\r\n              </span>\r\n            </button>\r\n          </div>\r\n          <div style=\"clear:both;\"></div>\r\n        </div>\r\n      </div>\r\n\r\n    </div>\r\n\r\n    <div class=\"binf-col-md-4 thumbnail-container binf-hidden binf-text-left cs-content\">\r\n      <div class=\"metadata-tab\">\r\n        <div class=\"thumbnail_section metadata-preview preview-section\"\r\n             title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "\">\r\n          <img role=\"link\" src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgSrc") || (depth0 != null ? lookupProperty(depth0,"imgSrc") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgSrc","hash":{},"loc":{"start":{"line":105,"column":32},"end":{"line":105,"column":42}}}) : helper)))
    + "\" class=\"img-doc-preview binf-hidden\" alt=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imgAlt") || (depth0 != null ? lookupProperty(depth0,"imgAlt") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imgAlt","hash":{},"loc":{"start":{"line":105,"column":85},"end":{"line":105,"column":95}}}) : helper)))
    + "\" />\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n  <div class=\"cs-fadeout-container\"></div>\r\n  <div class=\"cs-content-footer\">\r\n    <button class=\"binf-btn primary-btn command-btn open-btn\" type=\"button\"\r\n            data-signature=\"VersionOpen\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemOpen") : stack1), depth0))
    + "</button>\r\n    <button class=\"binf-btn default-btn command-btn csui-version-overview-download-btn\" type=\"button\"\r\n            data-signature=\"VersionDownload\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemDownload") : stack1), depth0))
    + "</button>\r\n    <button class=\"binf-btn default-btn command-btn\" type=\"button\"\r\n            data-signature=\"VersionProperties\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"lang") : depth0)) != null ? lookupProperty(stack1,"ToolbarItemProperties") : stack1), depth0))
    + "</button>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_version.overview_impl_version.overview', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/version.overview/impl/version.overview',[],function(){});
csui.define('csui/widgets/version.overview/version.overview.view',[
    'module', 'csui/lib/underscore',
    'csui/lib/marionette',
    'csui/lib/jquery',
    'csui/utils/log',
    'csui/utils/contexts/factories/version',
    'csui/utils/commands/versions',
    'csui/utils/base',
    'csui/utils/thumbnail/thumbnail.object',
    'csui/widgets/document.overview/document.overview.view',
    'csui/controls/progressblocker/blocker',
    'i18n!csui/widgets/version.overview/impl/nls/lang',
    'hbs!csui/widgets/version.overview/impl/version.overview',
    'css!csui/widgets/version.overview/impl/version.overview'
  ], function (module, _, Marionette, $, log,
      VersionModelFactory,
      VersionCommands,
      base,
      Thumbnail,
      DocumentOverviewView,
      BlockingView, lang,
      VersionOverviewTemplate) {
    'use strict';

    log = log(module.id);

    var VersionOverviewView = DocumentOverviewView.extend({
      className: 'cs-form csui-general-form cs-version-overview-wrapper',
      template: VersionOverviewTemplate,
      templateHelpers: function () {

        var sizeFullValue  = this.options.node.get("file_size"),
            sizeValue      = this.getFormattedSizeValue(sizeFullValue),
            versionName    = this.options.node.get('version_number_name');

        var messages = DocumentOverviewView.prototype.templateHelpers.call(this);
        _.extend(messages, {
          size_value: sizeValue,
          size_full_value: sizeFullValue,
          versionText: _.str.sformat(lang.versionText, versionName),
          versionAria: _.str.sformat(lang.versionAria, versionName)
        });

        return messages;
      },

      ui: function () {
        return _.extend({}, DocumentOverviewView.prototype.ui, {
          creadyByUser: '.csui-version-overview-created-by-user',
          createdByPic: '.csui-version-overview-created-by-pic',
          downloadBtn: '.csui-version-overview-download-btn',
          locationContainer: '.location-container',
          descriptionSection: '.description_section',
          descriptionSectionBtn: '.description_section button',
          descriptionField: '.description_section span.cs-field-textarea-data'
        });
      },

      constructor: function VersionOverviewView(options) {
        options || (options = {});
        BlockingView.imbue(this);
        options.data || (options.data = {});

        if (!options.node) {
          options.node = options.context.getModel(VersionModelFactory);
        }

        this.options = options;

        var viewStateModel = options.context && options.context.viewStateModel;
        this.back_button = viewStateModel && viewStateModel.hasRouted();

        Marionette.ItemView.prototype.constructor.apply(this, arguments);

        this.commands = VersionCommands;
        this.isReloading = false;
        this.parentNode = undefined;
        this.supportOriginatingView = true;

        this.listenTo(this.options.node, 'change:id change:version_number',  _.bind(this.handleFetch, this));
        this.listenTo(this.options.node.actions, 'reset', _.bind(this._checkPermissions, this));

        // listen to possible changes in the node.
        this.listenTo(this.options.node, 'change:modify_date', _.bind(this._updateModifyDateAndTimeStamp, this));
        this.listenTo(this.options.node, 'change:description', _.bind(this._updateDescription, this));

        this.listenTo(this.options.node, 'delete',  _.bind(this._navigateToParent, this));
        this.blockActions();
      },

      onRender: function () {
        if(!this.options.node.fetched) {
          return;
        }
        this._showMetadataItemName();
        this._showThumbnail();
        this._addLocationView();
        this._showCreatedByUserName();
        this._checkPermissions();
      },

      handleFetch: function () {
        if(this.isReloading) {
          return;
        }
        this.isReloading = true;
        // unset the thumbnail so that it will be set again after the widget re-renders.
        this.thumbnailSet = false;
        this.backButtonClicked = false;
        this.render();
      },

      _showMetadataItemName: function () {

        csui.require(['csui/widgets/metadata/impl/header/item.name/metadata.item.name.view'],
            _.bind(function (MetadataItemNameView) {

              if (this.metadataItemNameView) {
                this.metadataItemNameView.destroy();
              }

              this.metadataItemNameView = new MetadataItemNameView({
                model: this.options.node,
                container: this.options.node.parent,
                containerCollection: this.options.containerCollection,
                collection: this.options.collection,
                context: this.options.context,
                nameSchema: {},
                commands: this.commands,
                originatingView: this,
                showDropdownMenu: true,
                showPropertiesCommand: true,
                noMetadataNavigation: true
              });

              var inv = this.metadataItemNameView.render();
              Marionette.triggerMethodOn(inv, "before:show", inv, this);
              this.ui.titleContainer.append(inv.el);
              Marionette.triggerMethodOn(inv, "show", inv, this);

              this._unblockActions();
              if(this.isReloading) {
                this.isReloading = false;
              }

            }, this));

      },

      _updateDescription: function () {
        var newDescription = this.options.node.get('description');

        if(!newDescription) {
          this.ui.descriptionSectionBtn.removeAttr('aria-label');
          this.ui.descriptionField.text(null);
          this.ui.descriptionSection.addClass('binf-hidden');
        }
        else {
          this.ui.descriptionSectionBtn.attr('aria-label', lang.description + ':' + newDescription);
          this.ui.descriptionField.text(newDescription);
          this.ui.descriptionSection.removeClass('binf-hidden');
        }

      },

      _showThumbnail: function () {
        // the thumbnail subview fetches the new thumbnail and re-renders on node:id change.
        // so do not create a new object again if it is reloading to avoid memory leaks.
        if(!this.isReloading) {
          this.thumbnail =
            this.options.thumbnail ||
            new Thumbnail({
              node: this.options.node
            });
          this.listenTo(this.thumbnail, "loadUrl", this._showImage);
          this.listenTo(this.thumbnail, "error", this._showDefaultImage);
          this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));
        }

        if (!this.thumbnailSet) {
          var self = this;
          this.thumbnailSet = true;
          //Just show image if url is available,otherwise load thumbnail
          if (this.thumbnail.hasOwnProperty("imgUrl") && !!this.thumbnail.imgUrl) {
            this._showImage();
          } else {
            this.thumbnail.loadUrl();
          }
        }
      },

      _showImage: function () {
        this.$el.addClass("cs-version-overview-wrapper-with-thumbnail");
        this.ui.thumbnailContainer.removeClass("binf-hidden");
        this.trigger("thumbnail:show:image");
        var self = this,
            img  = this.ui.thumbnailImg;
        img.attr("src", this.thumbnail.imgUrl);
        img.prop("tabindex", "0");
        img.one("load", function (evt) {
          if (evt.target.clientHeight >= evt.target.clientWidth) {
            img.addClass("cs-form-img-vertical");
          } else {
            img.addClass("cs-form-img-horizontal");
          }
          img.addClass("cs-form-img-border");
          img.removeClass("binf-hidden");

          // event for keyboard navigation
          var event = $.Event("tab:content:render");
          self.$el.trigger(event);
        });
      },

      _addLocationView: function () {
        var self           = this,
            renderLocation = function () {
              csui.require(['csui/controls/table/cells/parent/parent.view'],
                  _.bind(function (ParentCellView) {
                    self.parentContainer = self.ancestors.at(self.ancestors.length - 2);
                    if(self.parentContainer && self.parentContainer.attributes) {
                      var field = new ParentCellView({
                        parent: self.parentContainer.attributes,
                        context: self.options.context,
                        nameEdit: false,
                        iconSize: 'contain',
                        el: self.$el.find(self.ui.location),
                        connector: self.options.node.connector
                      });
                      field.render();
                    }
                  }, this));
            };
        this.ancestors = this.options.context.getCollection('ancestors');
        if(!this.ancestors) {
          this._hideLocationField();
          return;
        }

        this.listenTo(this.ancestors, 'sync', function () {
          renderLocation();
        });
        this.listenTo(this.ancestors, 'error', this._hideLocationField);
        renderLocation();
      },

      _hideLocationField: function () {
        this.ui.locationContainer.addClass('binf-hidden');
      },

      _showCreatedByUserName: function () {
        var userOptions = {
          baseElement: this.ui.createdBy,
          userId: this.options.node.get("owner_id")
        };
        this._showUserName(userOptions);
      },

      /**
       * This method define specific action's options and invokes the checkPermissionFor method
       * for that specific action.
       *
       * @private
       */
      _checkPermissions: function () {
        var downloadCmdOptions = {
              'signature': 'VersionDownload',
              'actionBtnEle': this.ui.downloadBtn
            },
            openCmdOptions = {
              'signature': 'VersionOpen',
              'actionBtnEle': this.ui.openBtn
            };

        this._checkPermForSpecificAction(openCmdOptions);
        this._checkPermForSpecificAction(downloadCmdOptions);
      },

      getFormattedSizeValue: function (value) {
        return base.formatFriendlyFileSize(value);
      },

      _handleClickThumbnail: function (event) {
        event.stopImmediatePropagation();
        this._executeCommand("VersionOpen");
      },

      _navigateToParent: function () {
        var parentId = this.parentContainer.get('id') || (this.options.node.get('id_expand') && this.options.node.get('id_expand').parent_id);
        if (parentId) {
          this._setNextNodeModelFactory(parentId);
        }
      }

    });

    return VersionOverviewView;

  });


csui.define('json!csui/widgets/error.global/error.global.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {
    "type": "object",
    "properties": {
      "serverError": {
        "title": "{{serverErrorTitle}}",
        "description": "{{serverErrorDescription}}",
        "type": "string"
      }
    }
  },
  "options": {
  }
}
);


csui.define('json!csui/widgets/favorites/favorites.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  },
  "actions": [
    {
      "toolItems": "csui/widgets/favorites2.table/toolbaritems",
      "toolItemMasks": "csui/widgets/favorites2.table/toolbaritems.masks",
      "toolbars": [
        {
          "id": "tableHeaderToolbar",
          "title": "{{tableHeaderToolbarTitle}}",
          "description": "{{tableHeaderToolbarDescription}}"
        },
        {
          "id": "inlineActionbar",
          "title": "{{inlineActionbarTitle}}",
          "description": "{{inlineActionbarDescription}}"
        }
      ]
    }
  ]
}
);


csui.define('json!csui/widgets/myassignments/myassignments.manifest.json',{
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


csui.define('json!csui/widgets/placeholder/placeholder.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "supportedKinds": ["tile", "header", "fullpage"],
  "schema": {
    "type": "object",
    "properties": {
      "label": {
        "title": "{{labelTitle}}",
        "description": "{{labelDescription}}",
        "type": "string"
      },
      "color": {
        "title": "{{foregroundColorTitle}}",
        "description": "{{foregroundColorDescription}}",
        "type": "string"
      },
      "bgcolor": {
        "title": "{{backgroundColorTitle}}",
        "description": "{{backgroundColorDescription}}",
        "type": "string"
      }
    }
  }
}
);


csui.define('json!csui/widgets/recentlyaccessed/recentlyaccessed.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{title}}",
  "description": "{{description}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  },
  "actions": [
    {
      "toolItems": "csui/widgets/recentlyaccessedtable/toolbaritems",
      "toolItemMasks": "csui/widgets/recentlyaccessedtable/toolbaritems.masks",
      "toolbars": [
        {
          "id": "tableHeaderToolbar",
          "title": "{{tableHeaderToolbarTitle}}",
          "description": "{{tableHeaderToolbarDescription}}"
        },
        {
          "id": "inlineActionbar",
          "title": "{{inlineActionbarTitle}}",
          "description": "{{inlineActionbarDescription}}"
        }
      ]
    }
  ]
}
);


csui.define('json!csui/widgets/shortcut/shortcut.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "deprecated": true,
  "useInstead": "csui/widgets/shortcuts",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      },
      "type": {
        "title": "{{typeTitle}}",
        "description": "{{typeDescription}}",
        "type": "integer",
        "enum": [141, 142, 133],
        "default": 141
      },
      "background": {
        "title": "{{backgroundTitle}}",
        "description": "{{backgroundDescription}}",
        "type": "string",
        "enum": [
          "cs-tile-background1",
          "cs-tile-background2",
          "cs-tile-background3"
        ]
      },
      "displayName": {
        "title": "{{displayNameTitle}}",
        "type": "string"
      }
    },
    "oneOf": [{
      "required": ["id"]
    }, {
      "required": ["type"]
    }]
  },
  "options": {
    "fields": {
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": []
          }
        }
      },
      "type": {
        "type": "select",
        "optionLabels": [
          "{{typeEnterpriseVolume}}",
          "{{typePersonalVolume}}",
          "{{typeCategoryVolume}}"
        ]
      },
      "background": {
        "type": "select",
        "optionLabels": [
          "{{backgroundGrey}}",
          "{{backgroundGreen}}",
          "{{backgroundOrange}}"
        ]
      }
    }
  }
}
);


csui.define('json!csui/widgets/shortcuts/shortcuts.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "selfConfigurable": true,
  "schema": {
    "type": "object",
    "properties": {
      "shortcutTheme": {
        "title": "{{shortcutThemeTitle}}",
        "description": "{{shortcutThemeDescription}}",
        "type": "string",
        "enum": [
          "csui-shortcut-theme-stone1",
          "csui-shortcut-theme-stone2",
          "csui-shortcut-theme-teal1",
          "csui-shortcut-theme-teal2",
          "csui-shortcut-theme-pink1",
          "csui-shortcut-theme-pink2",
          "csui-shortcut-theme-indigo1",
          "csui-shortcut-theme-indigo2"
        ]
      },
      "shortcutItems": {
        "title": "{{shortcutItemsTitle}}",
        "description": "{{shortcutItemsDescription}}",
        "type": "array",
        "minItems": 1,
        "maxItems": 4,
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "title": "{{idTitle}}",
              "description": "{{idDescription}}",
              "type": "integer"
            },
            "type": {
              "title": "{{typeTitle}}",
              "description": "{{typeDescription}}",
              "type": "integer",
              "enum": [141, 142, 133]
            },
            "displayName": {
              "title": "{{displayNameTitle}}",
              "type": "string"
            }
          },
          "oneOf": [{
            "required": ["id"]
          }, {
            "required": ["type"]
          }]
        }
      }
    }
  },
  "options": {
    "fields": {
      "shortcutItems": {
        "items": {
          "fields": {
            "id": {
              "type": "otcs_node_picker",
              "type_control": {
                "parameters": {
                  "select_types": []
                }
              }
            },
            "type": {
              "type": "select",
              "optionLabels": [
                "{{typeEnterpriseVolume}}",
                "{{typePersonalVolume}}",
                "{{typeCategoryVolume}}"
              ]
            }
          }
        }
      },
      "shortcutTheme": {
        "type": "select",
        "optionLabels": [
          "{{shortcutThemeStone1}}",
          "{{shortcutThemeStone2}}",
          "{{shortcutThemeTeal1}}",
          "{{shortcutThemeTeal2}}",
          "{{shortcutThemePink1}}",
          "{{shortcutThemePink2}}",
          "{{shortcutThemeIndigo1}}",
          "{{shortcutThemeIndigo2}}"
        ]
      }
    }
  }
}
);


csui.define('json!csui/widgets/welcome.placeholder/welcome.placeholder.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "header",
  "schema": {
    "type": "object",
    "properties": {
      "message": {
        "title": "{{messageTitle}}",
        "description": "{{messageDescription}}",
        "type": "string"
      },
      "videoPoster": {
        "title": "{{videoPosterTitle}}",
        "description": "{{videoPosterDescription}}",
        "type": "string"
      },
      "videoSrc": {
        "title": "{{videoSourceTitle}}",
        "description": "{{videoSourceDescription}}",
        "type": "string"
      }
    }
  }
}
);


csui.define('json!csui/widgets/html.editor/html.editor.manifest.json',{
	"$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
	"title": "{{title}}",
	"description": "{{description}}",
	"kind": "tile",
	"supportedKinds": ["tile", "header", "heroTile", "fullpage"],
	"schema": {
		"type": "object",
		"properties": {
			"titlefield": {
				"title": "{{titleLabel}}",
				"description": "{{titleDesc}}",
				"type": "string",
				"default": ""
			},
			"wikicontainerid": {
				"title": "{{wikiContainerID}}",
				"description": "{{wikiContainerIDDesc}}",
				"type": "integer"
			},
			"wikitemplateid": {
				"title": "{{wikiTemplateID}}",
				"description": "{{wikiTemplateIDDesc}}",
				"type": "integer"
			},
			"wikiid": {
				"title": "{{wikiContainerID}}",
				"description": "{{wikiContainerIDDesc}}",
				"type": "integer"
			},
			"wikipageid": {
				"title": "{{wikiTemplateID}}",
				"description": "{{wikiTemplateIDDesc}}",
				"type": "integer"
			}
		}
	},
	"options": {
		"fields": {
			"wikicontainerid": {
				"type": "otcs_node_picker",
				"type_control": {
					"parameters": {
						"select_types": [
							5573
						],
						"startLocations": [
						   "csui/dialogs/node.picker/start.locations/enterprise.volume",
						   "csui/dialogs/node.picker/start.locations/personal.volume",
						   "csui/dialogs/node.picker/start.locations/favorites",
						   "csui/dialogs/node.picker/start.locations/recent.containers",
						   "csui/dialogs/node.picker/start.locations/perspective.assets.volume"
						 ]
					}
				}
			},
			"wikitemplateid": {
				"type": "otcs_node_picker",
				"type_control": {
					"parameters": {
						"select_types": [
							5574
						],
						"startLocation": "csui/dialogs/node.picker/start.locations/perspective.assets.volume",
						"startLocations": [
						   "csui/dialogs/node.picker/start.locations/enterprise.volume",
						   "csui/dialogs/node.picker/start.locations/personal.volume",
						   "csui/dialogs/node.picker/start.locations/favorites",
						   "csui/dialogs/node.picker/start.locations/recent.containers",
						   "csui/dialogs/node.picker/start.locations/perspective.assets.volume"
						 ]
					}
				}
			},
			"wikipageid": {
				"type": "otcs_node_picker",
				"hidden": true,
				"type_control": {
					"parameters": {
						"select_types": [
							5574
						]
					}
				}
			},
			"wikiid": {
				"type": "otcs_node_picker",
				"hidden": true,
				"type_control": {
					"parameters": {
						"select_types": [
							5573
						]
					}
				}
			},
			"width": {
				"type": "select",
				"optionLabels": [
					"{{default}}",
					"{{full}}",
					"{{half}}",
					"{{quarter}}"
				]
			}
		}
	},
	"callback": "wiki/callbacks/wikiHookCallback"
}
);


csui.define('json!csui/widgets/document.overview/document.overview.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      }
    },
    "required": ["id"]
  },
  "options": {
    "fields": {
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": [144]
          }
        }
      }
    }
  }
}
);

csui.define('csui/widgets/favorites/impl/nls/favorites.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/favorites/impl/nls/root/favorites.manifest',{
  "title": "Favorites",
  "description": "Shows favorite objects of the current user.",
  "tableHeaderToolbarTitle": "Table Header Toolbar",
  "tableHeaderToolbarDescription": "Toolbar, which is activated in the table header, once a table row is selected.",
  "inlineActionbarTitle": "Inline Action Bar",
  "inlineActionbarDescription": "Toolbar, which is displayed inside a table row, when the mouse cursor is moving above it."
});

csui.define('csui/widgets/myassignments/impl/nls/myassignments.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/myassignments/impl/nls/root/myassignments.manifest',{
  "title": "My Assignments",
  "description": "Shows personal assignments of the current user."
});

csui.define('csui/widgets/placeholder/impl/nls/placeholder.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/placeholder/impl/nls/root/placeholder.manifest',{
  "widgetTitle": "Placeholder",
  "widgetDescription": "Shows a colorful tile taking the space instead of a real widget.",
  "labelTitle": "Label",
  "labelDescription": "Label of the tile",
  "foregroundColorTitle": "Foreground color",
  "foregroundColorDescription": "Color for the label of the tile",
  "backgroundColorTitle": "Background color",
  "backgroundColorDescription": "Color for the background of the tile"
});


csui.define('csui/widgets/recentlyaccessed/impl/nls/recentlyaccessed.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/recentlyaccessed/impl/nls/root/recentlyaccessed.manifest',{
  "title": "Recently Accessed",
  "description": "Shows documents accessed recently by the current user.",
  "tableHeaderToolbarTitle": "Table Header Toolbar",
  "tableHeaderToolbarDescription": "Toolbar, which is activated in the table header, once a table row is selected.",
  "inlineActionbarTitle": "Inline Action Bar",
  "inlineActionbarDescription": "Toolbar, which is displayed inside a table row, when the mouse cursor is moving above it."
});


csui.define('csui/widgets/shortcut/impl/nls/shortcut.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/shortcut/impl/nls/root/shortcut.manifest',{
  "widgetTitle": "Single Shortcut",
  "widgetDescription": "Tile representing a hyperlink to an object; it navigates to its page when clicked",
  "idTitle": "Target object",
  "idDescription": "An object to open by this shortcut",
  "typeTitle": "Volume",
  "typeDescription": "Sub-type number of a global volume to open by this shortcut if no object has been selected",
  "backgroundTitle": "Background",
  "backgroundDescription": "Styling of the background below the shortcut tile",
  "typeEnterpriseVolume": "Enterprise",
  "typePersonalVolume": "Personal",
  "typeCategoryVolume": "Categories",
  "displayNameTitle": "Display name",
  "backgroundGrey": "Grey",
  "backgroundGreen": "Green",
  "backgroundOrange": "Orange"
});


csui.define('csui/widgets/welcome.placeholder/impl/nls/welcome.placeholder.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/welcome.placeholder/impl/nls/root/welcome.placeholder.manifest',{
  "widgetTitle": "Welcome Header",
  "widgetDescription": "Shows a wide widget with initial information for the user home page.",
  "messageTitle": "Display message",
  "messageDescription": "Message to be displayed at the bottom of the tile",
  "videoPosterTitle": "Video thumbnail",
  "videoPosterDescription": "Web address of the poster to show when the video is not playing",
  "videoSourceTitle": "Video location",
  "videoSourceDescription": "Web address of the video to play"
});


csui.define('csui/widgets/html.editor/impl/nls/html.editor.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/html.editor/impl/nls/root/html.editor.manifest',{
	'title': 'HTML Tile',
	'description': 'Returns the HTML output of an object and inserts it into a tile.',
	'widthLabel': 'Width',
	'widthDesc': 'The maximum width on the largest screen-size.',
	'default': 'Default',
	'full': 'Full',
	'half': 'Half',
	'quarter': 'Quarter',
	'titleLabel': 'Title',
	'titleDesc': 'Title for the tile',
	'objIdLabel': 'Object ID',
	'objIdDesc': 'Object ID for which we have to render and allow users to edit rich text content.',
	'wikiContainerID': 'Target wiki for HTML Content (optional)',
	'wikiTemplateID': 'Template wiki page (optional)',
	'wikiContainerIDDesc': 'If not specified, a target wiki will be created automatically in perspective asset volume',
	'wikiTemplateIDDesc': 'If not specified, a target wiki template will be pointed automatically from perspective asset folder'
});


csui.define('csui/widgets/document.overview/impl/nls/document.overview.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/document.overview/impl/nls/root/document.overview.manifest',{
  "widgetTitle": "Document Overview",
  "widgetDescription": "Shows basic information about a document and offers the most often actions for it.",
  "idTitle": "Document",
  "idDescription": "A document to show the overview for"
});


csui.define('bundles/csui-app',[
  // Behaviours
  'csui/behaviors/expanding/expanding.behavior',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/behaviors/item.state/item.state.behavior',
  'csui/behaviors/item.state/item.state.view',
  'csui/behaviors/limiting/limiting.behavior',

  // Controls
  'csui/controls/tile/behaviors/expanding.behavior',
  'csui/controls/tile/tile.view',
  'csui/controls/iconpreload/icon.preload.view',
  'csui/controls/rich.text.editor/rich.text.editor',
  'csui/controls/selected.count/selected.count.view',

  // Control behaviours

  // 3rd-party libraries

  // TODO: Remove this as long as we mock only for testing purposes;
  // currently we do it a lot to present our features and we need
  // the mockjax in the production output
  'csui/lib/jquery.simulate',
  'csui/lib/othelp',

  // Pages
  'csui/pages/start/start.page.view',

  // Navigation Header
  'csui/widgets/navigation.header/controls/help/help.view',
  'csui/widgets/navigation.header/controls/home/home.view',
  'csui/widgets/navigation.header/controls/breadcrumbs/breadcrumbs.view',
  'csui/widgets/navigation.header/controls/search/search.view',
  'csui/widgets/navigation.header/controls/favorites/favorites.view',
  'csui/widgets/navigation.header/controls/user.profile/user.profile.view',
  'csui/widgets/navigation.header/controls/progressbar.maximize/progressbar.maximize.view',
  'csui/widgets/navigation.header/navigation.header.controls',

  // Routers

  // Utilities

  // Commands
  // FIXME: Create a public module instead of this private one.
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/tabletoolbar/impl/nls/localized.strings',

  // Contexts and factories
  // Client-side perspectives
  'json!csui/utils/contexts/perspective/impl/perspectives/error.global.json',

  // Application widgets
  'csui/widgets/error.global/error.global.view',
  'csui/widgets/favorites/favorites.view',
  'csui/widgets/favorites/tileview.toolbaritems',
  'csui/widgets/myassignments/myassignments.columns',
  'csui/widgets/myassignments/myassignments.view',
  'csui/widgets/navigation.header/profile.menuitems',
  'csui/widgets/navigation.header/profile.menuitems.mask',
  'csui/widgets/placeholder/placeholder.view',
  'csui/widgets/recentlyaccessed/recentlyaccessed.columns',
  'csui/widgets/recentlyaccessed/recentlyaccessed.view',
  'csui/widgets/recentlyaccessed/tileview.toolbaritems',
  'csui/widgets/search.results.tile/search.results.tile.view',
  'csui/widgets/search.box/search.box.view',
  'csui/widgets/shortcut/shortcut.view',
  'csui/widgets/shortcuts/shortcuts.view',
  'csui/widgets/welcome.placeholder/welcome.placeholder.view',

  'csui/widgets/html.editor/impl/cslink.preview/cslink.preview.view',
  'csui/widgets/html.editor/html.editor.view',
  'csui/widgets/document.overview/document.overview.view',
  'csui/widgets/version.overview/version.overview.view',


  // Application widgets manifests
  'json!csui/widgets/error.global/error.global.manifest.json',
  'json!csui/widgets/favorites/favorites.manifest.json',
  'json!csui/widgets/myassignments/myassignments.manifest.json',
  'json!csui/widgets/placeholder/placeholder.manifest.json',
  'json!csui/widgets/recentlyaccessed/recentlyaccessed.manifest.json',
  'json!csui/widgets/shortcut/shortcut.manifest.json',
  'json!csui/widgets/shortcuts/shortcuts.manifest.json',
  'json!csui/widgets/welcome.placeholder/welcome.placeholder.manifest.json',

  'json!csui/widgets/html.editor/html.editor.manifest.json',
  'json!csui/widgets/document.overview/document.overview.manifest.json',

  'i18n!csui/widgets/favorites/impl/nls/favorites.manifest',
  'i18n!csui/widgets/myassignments/impl/nls/myassignments.manifest',
  'i18n!csui/widgets/placeholder/impl/nls/placeholder.manifest',
  'i18n!csui/widgets/recentlyaccessed/impl/nls/recentlyaccessed.manifest',
  'i18n!csui/widgets/shortcut/impl/nls/shortcut.manifest',
  'i18n!csui/widgets/shortcuts/impl/nls/shortcuts.manifest',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/welcome.placeholder.manifest',

  'i18n!csui/widgets/html.editor/impl/nls/html.editor.manifest',
  'i18n!csui/widgets/document.overview/impl/nls/document.overview.manifest',

  // Shared for favoritestable from csui-browse
  'i18n!csui/widgets/favorites/impl/nls/lang',
  // Shared for myassignmentstable from csui-browse
  'i18n!csui/widgets/myassignments/impl/nls/lang',
  // Shared for recentlyaccessedtable from csui-browse
  'i18n!csui/widgets/recentlyaccessed/impl/nls/lang',
  // shared for searchformview from csui-search
  'i18n!csui/widgets/search.forms/impl/nls/lang',
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-app', true);
});

