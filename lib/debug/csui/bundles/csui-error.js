csui.define('csui/utils/contexts/factories/application.scope.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var ApplicationScopeModel = Backbone.Model.extend({});

  var ApplicationScopeModelFactory = ModelFactory.extend({

    propertyPrefix: 'applicationScope',

    constructor: function ApplicationScopeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var applicationScope = this.options.applicationScope || {};
      if (!(applicationScope instanceof Backbone.Model)) {
        var config = module.config();
        applicationScope = new ApplicationScopeModel(applicationScope.models, _.extend({},
            applicationScope.options, config.options));
      }
      this.property = applicationScope;
    }

  });

  return ApplicationScopeModelFactory;

});

csui.define('csui/utils/contexts/factories/global.error',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {
  'use strict';

  var GlobalError = Backbone.Model.extend({
    defaults: {
      message: null,
      details: null
    }
  });

  var GlobalErrorFactory = ModelFactory.extend({
    propertyPrefix: 'globalError',

    constructor: function GlobalErrorModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var globalError = this.options.globalError || {};
      if (!(globalError instanceof Backbone.Model)) {
        var config = module.config();
        globalError = new GlobalError(globalError.attributes, _.extend({},
            globalError.options, config.options));
        // The default global error model should be permanent to
        // survive a perspective switch to the error perspective.
        this.options.permanent = true;
      }
      this.property = globalError;
    }
  });

  return GlobalErrorFactory;
});

csui.define('csui/behaviors/keyboard.navigation/tabables.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base'
], function (module, _, $, Marionette, log, base) {
  'use strict';

  log = log(module.id);

  // Default static options for the behaviour object
  var config = module.config();

  var accessibilityRegionClass = 'csui-acc-tab-region';
  var accessibilityActiveRegionClass = 'csui-acc-tab-region-active';

  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  // This behavior implements a controller for one or more views with the tabable.region.behavior
  // applied.
  var TabablesBehavior = Marionette.Behavior.extend({

        constructor: function TabablesBehavior(options, view) {
          Marionette.Behavior.prototype.constructor.apply(this, arguments);

          var self = this;

          this.view = view;
          this._pushTabableHandler();

          this.tabableRegions = [];
          this.mustSortTabableRegions = false;

          // Backbone/Marionette events (are removed in destroy)
          this.listenTo(view, 'render', this._registerEventHandlers);
          this.listenTo(view, 'destroy', this._popTabableHandler);
          this.listenTo(view, 'dom:refresh', this.setFocusInActiveTabableRegion);

          //In order to prevent tab from going outside a contained area (i.e. dialog),
          //keydown is monitored on the behavioral view. The event listener will only prevent
          //tab outside the behavior view if parameter "containTabFocus' is set to true.
          // LPAD-54770, Make sure that keydown event is registered only once after view creation
          setTimeout(function () {
            view.$el.on('keydown.csui-tabables', function (event) {
              if (event.keyCode === 9 && getOption.call(self, 'containTabFocus')) {
                return self._maintainTabFocus(event);
              }
            });
          });

          //Used for cases where focus should be removed from the active behavior region
          //and placed in the text focusable region. For example when 'escape' is used to
          //to move focus outside of a textbox area to the next tabable region.
          this.listenTo(view, 'changed:focus', this._setFocusToNextRegion);
          this.listenTo(view, 'switch:view', function () {
            TabablesBehavior.switchViewDialog();
          });
        }, // constructor

        registerTabableRegion: function (tabableRegion) {
          if ($.contains(this.view.el, tabableRegion.view.el)) {
            this.unregisterTabableRegionBehavior(tabableRegion);
            this.tabableRegions.push(tabableRegion);
            this.mustSortTabableRegions = true;
            return true;
          } else {
            log.debug('registerTabableRegion: not registering non descendant view ' +
                      tabableRegion.view.constructor.name) &&
            console.log(log.last);
            return false;
          }
        },

        unregisterTabableRegionBehavior: function (tabableRegion) {
          if (tabableRegion) {
            if (_.contains(this.tabableRegions, tabableRegion)) {
              // remove that tabableRegionBehavior from the tabableRegions array
              log.debug('unregisterTabableRegion for view' + tabableRegion.view.constructor.name) &&
              console.log(log.last);

              this.tabableRegions = _.reject(this.tabableRegions,
                  function (trb) { return trb === tabableRegion; });

              // log.debug("Unsorted tabable regions:") && console.log(log.last);
              // _.each(this.tabableRegions, function (tabableRegionBehavior) {
              //   log.debug(" " + tabableRegionBehavior.view.constructor.name) &&
              //   console.log(log.last);
              // });

            }
          }
        },

        _pushTabableHandler: function () {
          log.debug('_pushTabableHandler in view ' + this.view.constructor.name) &&
          console.log(log.last);
          if (TabablesBehavior.tabablesHandlers.length > 0) {
            var topTabablesHandler = _.last(TabablesBehavior.tabablesHandlers);

            /*
                        var activeIdx = this._getActiveIndex();
                        if (activeIdx !== undefined) {
                          this.activeTabableRegionIndexBeforePush = activeIdx;
                          var activeTabableRegion = this.tabableRegions[activeIdx];
                          this.focusedElementBeforePush = activeTabableRegion.getCurrentlyFocusedElementFromView();
                        } else {
                          delete this.focusedElementBeforePush;
                          delete this.activeTabableRegionIndexBeforePush;
                        }
            */

            // invalidate all tabindexes in the current tabable regions before adding the new
            // "layer" of tabable regions at the top of the stack.
            // This prevents navigating by tab to any of this tabable regions.
            _.each(topTabablesHandler.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
              topTabablesHandler._clearTabIndexes.call(topTabablesHandler, tabableRegion.view);
            }, this);

          }
          TabablesBehavior.tabablesHandlers.push(this);

          // log.debug("Tabables after Push:");
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name);
          // });
        },

        _popTabableHandler: function () {
          if (TabablesBehavior.tabablesHandlers.length > 0) {

            var tabableHandlerToPop = _.last(TabablesBehavior.tabablesHandlers);

            log.debug('_popTabableHandler in view ' + tabableHandlerToPop.view.constructor.name) &&
            console.log(log.last);

            _.each(tabableHandlerToPop.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
            });

            // LPAD-54770. Remove keydown listener
            tabableHandlerToPop.view.$el.off('keydown.csui-tabables');

            tabableHandlerToPop.stopListening(tabableHandlerToPop.view);
            TabablesBehavior.tabablesHandlers.pop();

            // after removing the tabables handler from the stack let the tabable regions, that
            // are now on top of the stack re-set its tabindex values to make it keyboard
            // navigable again
            if (TabablesBehavior.tabablesHandlers.length > 0) {
              var topTabableHandler = _.last(TabablesBehavior.tabablesHandlers);
              _.each(topTabableHandler.tabableRegions, function (tabableRegion) {
                tabableRegion.setInitialTabIndex.call(tabableRegion);
                tabableRegion._registerEventHandlers.call(tabableRegion);
              });

              topTabableHandler._setFocusInActiveTabableRegion();
            }
          }
          // log.debug("Tabables after Pop:") && console.log(log.last);
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name) &&
          //   console.log(log.last);
          // });
        },

        _sortTabableRegions: function () {
          var tabableRegions = this.tabableRegions;
          var sortedTabableRegions = [];
          var tabableRegionElements = this.view.$el.find('.' + accessibilityRegionClass);
          tabableRegionElements.each(function (index, el) {
            var trb = _.find(tabableRegions, function (tabableRegion) {
              return tabableRegion.view.el === el;
            });
            if (trb) {
              sortedTabableRegions.push(trb);
            }
          });
          this.tabableRegions = sortedTabableRegions;
          this.mustSortTabableRegions = false;

          // log.debug("Sorted tabable regions:") && console.log(log.last);
          // _.each(this.tabableRegions, function (tabableRegion) {
          //   log.debug("    " + tabableRegion.view.constructor.name) && console.log(log.last);
          // });
        },

        //Get the next tabable region with an accessible focusable element.
        _getNextActiveRegion: function (shiftTab, recursiveNavigate) {
          var regions = this.tabableRegions, i, tabableRegion;

          // don't select regions for tabable which are hidden.
          regions = _.filter(regions, function (region) {
            return !region.$el.hasClass('binf-hidden');
          });

          var lastIndex   = regions.length - 1,
              activeIndex = this._getActiveIndex(regions);

          if (recursiveNavigate) {
            i = shiftTab ? (activeIndex === 0 ? lastIndex : activeIndex - 1) :
                (activeIndex === lastIndex ? 0 : activeIndex + 1);
          } else {
            i = shiftTab ? (activeIndex === 0 ? 0 : activeIndex - 1) :
                (activeIndex === lastIndex ? lastIndex : activeIndex + 1);
          }

          // return tabableRegion if it has only one tabable element.
          if (regions.length === 1) {
            tabableRegion = regions[0];
            return tabableRegion;
          }

          while (i != activeIndex) {
            tabableRegion = regions[i];
            var elToFocus = tabableRegion.getCurrentlyFocusedElementFromView(shiftTab);
            if (tabableRegion.view.isTabable() && elToFocus &&
                base.isVisibleInWindowViewport(elToFocus)) {
              // Do not focus elements out of the visible viewport rectangle;
              // it brings them to the visible screen, ignoring the absolute
              // positioning or transforms, if they were applied earlier
              return tabableRegion;
            }

            if (shiftTab) {
              if (i === 0) {
                i = recursiveNavigate ? lastIndex : activeIndex;
              }
              else if (i > 0) {
                --i;
              }
            }
            else {
              if (i === lastIndex) {
                i = recursiveNavigate ? 0 : activeIndex;
              }
              else if (i < lastIndex) {
                ++i;
              }
            }
          }
        },
        //Due to cases (like the target browser where regions are added and removed throughout a dialog
        //display) where regions may be placed out of order due to views being dynamically added and removed
        //throughout the life cycle of the parent container, sort order is reset on every index request.
        _getActiveIndex: function (regions) {
          if (this.currentlyActiveTabableRegion) {
            this._sortTabableRegions();
            var currentlyActive = this.currentlyActiveTabableRegion,
              tabableRegions  = this.tabableRegions;
            if (!!regions) {
              tabableRegions = regions;
            }
            for (var i = 0; i < tabableRegions.length; i++) {
              if (currentlyActive.view.cid === tabableRegions[i].view.cid) {
                return i;
              }
            }
          }
        },

        _deactivateCurrentActiveTabableRegion: function () {
          var activeIdx = this._getActiveIndex();

          if (activeIdx !== undefined && !!this.tabableRegions[activeIdx]) {
            var activeView = this.tabableRegions[activeIdx].view;
            var tabRegionEl = activeView.$el;

            tabRegionEl.removeClass(accessibilityActiveRegionClass);
            delete this.currentlyActiveTabableRegion;
            if (activeView.accDeactivateTabableRegion) {
              log.debug('deactivating tabable region ' + activeView.constructor.name) &&
              console.log(log.last);

              this.tabableRegions[activeIdx].ignoreFocusEvents = true;
              activeView.accDeactivateTabableRegion.call(activeView);
              this.tabableRegions[activeIdx].ignoreFocusEvents = false;
            }
          }
          return activeIdx;
        },

        _setTabableRegionActive: function (tabableRegion, shiftTab) {
          log.debug('activating ' + tabableRegion.view.constructor.name + ' as active tabable' +
                    ' region') && console.log(log.last);

          this._deactivateCurrentActiveTabableRegion();
          tabableRegion.view.$el.addClass(accessibilityActiveRegionClass);
          this.currentlyActiveTabableRegion = tabableRegion;
          if (tabableRegion.view.accActivateTabableRegion) {
            tabableRegion.ignoreFocusEvents = true;
            tabableRegion.view.accActivateTabableRegion.call(tabableRegion.view, shiftTab);
            tabableRegion.ignoreFocusEvents = false;
          }
        },

        _setFocusInActiveTabableRegion: function (shiftTab) {
          if (this.currentlyActiveTabableRegion && 
                document.body.contains(this.currentlyActiveTabableRegion.el)) {
            // this._setTabableRegionActive(this.currentlyActiveTabableRegion);
            this.currentlyActiveTabableRegion.setFocus(shiftTab);
          } else {
            // try to focus on a preferred region if no one is known as the active region, but
            // don't store it as the currently active one. This must be actively done by a
            // tabable region.
            var tabableRegionsByWeight = _.sortBy(this.tabableRegions, function (tabableRegion) {
              return tabableRegion.view.options.initialActivationWeight;
            });
            //var preferredRegion = _.last(tabableRegionsByWeight);

            var preferredRegion;
            tabableRegionsByWeight.reverse().some(function(region) {
              if (!region.options.notSetFocus) {
                preferredRegion = region;
                return true;
              }
            });

            if (preferredRegion && preferredRegion.view.options.initialActivationWeight > 0) {
              log.debug("setFocus: " + preferredRegion.view.constructor.name) && console.log(log.last);
              var didFocus = preferredRegion.setFocus(shiftTab);

              if (didFocus && document.activeElement) {
                if (document.activeElement.tagName === 'BODY') {
                  log.debug("setFocus Failed: " + preferredRegion.view.constructor.name) && console.log(log.last);
                }
                log.debug("document.activeElement: " + document.activeElement.tagName) && console.log(log.last);
              }
            }
          }
        },

        _clearTabIndexes: function (view) {
          // log.debug('_clearTabIndexes in view ' + view.constructor.name) && console.log(log.last);
          // find tabable/focusable elements including the view.$el element
          var focusables = view.$el.find(TabablesBehavior.focusablesSelector).addBack(
              TabablesBehavior.focusablesSelector);
          if (focusables.length) {
            // log.debug('set tabindex=-1 on ' + focusables.length + ' elements') && console.log(log.last);
            focusables.prop('tabindex', -1);
          } else {
            log.debug('_clearTabIndexes: no focusables found in ' + view.constructor.name) &&
            console.log(log.last);
          }
        },

        _maintainTabFocus: function (event) {
          var shiftTab    = event.shiftKey,
              activeIndex = this._getActiveIndex();
          //If an activeIndex is not available it is because regional focus has not
          //been set yet and this is the first tab request.
          if (activeIndex !== undefined) {
            var activeRegion = this.tabableRegions[activeIndex];
            var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
            if (!!activeRegion && activeRegion.onLastTabElement(shiftTab, event)) {
              var nextActiveRegion = this._getNextActiveRegion(shiftTab, false);
              if (!nextActiveRegion) {
                nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);

              }
              if (nextActiveRegion) {
                this._setTabableRegionActive(nextActiveRegion, shiftTab);
                this._setFocusInActiveTabableRegion(shiftTab);
              }
              return false;
            }
          }
          return true;
        },

        _setFocusToNextRegion: function setFocusToNextRegion(shiftTab) {
          var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
          var nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);
          if (nextActiveRegion) {
            this._setTabableRegionActive(nextActiveRegion);
            this._setFocusInActiveTabableRegion();
          }
        }
      },
      {
        // array with all TabablesBehavior instances
        tabablesHandlers: [],

        focusablesSelector: 'a[href], area[href], input, select, textarea, button,' +
                            ' iframe, object, embed, *[tabindex], *[contenteditable]',

        clearTabIndexes: function (view) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, view.el)) {
            tabablesBehavior._clearTabIndexes.call(tabablesBehavior, view);
          }
        },

        setTabableRegionActive: function (tabableRegion) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, tabableRegion.view.el)) {
            tabablesBehavior._setTabableRegionActive.call(tabablesBehavior, tabableRegion);
          }
        },

        registerTabableRegion: function (tabableRegion) {
          log.debug('registerTabableRegion for view ' + tabableRegion.view.constructor.name) &&
          console.log(log.last);

          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            return tabablesBehavior.registerTabableRegion.call(tabablesBehavior, tabableRegion);
          }
        },

        unregisterTabableRegion: function (tabableRegion) {
          if (tabableRegion) {
            // make it simple: don't search for the tabables behavior instance. Just remove it
            // from everyone.
            _.each(TabablesBehavior.tabablesHandlers, function (tabablesBehavior) {
              tabablesBehavior.unregisterTabableRegionBehavior.call(tabablesBehavior,
                  tabableRegion);
            });
          }
        },

        // Activate (set focus) of the region that has the highest weight value in the tabable
        // region behavior options.
        //  This should be called when regions are actually shown in the dom.
        //  If a region is already active, skip initial activation.

        setFocusInActiveTabableRegion: function activateInitialTabableRegion() {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          }
        },

        popTabableHandler: function () {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._popTabableHandler();
          }
        },
        switchViewDialog: function(){
        

        var self = this;
        var tabablesBehaviorRemove = 
        self.tabablesHandlers[TabablesBehavior.tabablesHandlers.length-1];
       
        
        tabablesBehaviorRemove.view.$el.off('keydown.csui-tabables');

        tabablesBehaviorRemove.stopListening(tabablesBehaviorRemove.view);

        if(TabablesBehavior.tabablesHandlers.length>1){ // to avoid the removal of parent of dialog
          TabablesBehavior.tabablesHandlers.pop();
        }



          // re-register
          var tabablesBehavior = 
          this.tabablesHandlers[this.tabablesHandlers.length-1];

         tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          _.each(tabablesBehavior.tabableRegions, function (tabableRegion) {
           
            tabableRegion.setInitialTabIndex.call(tabableRegion);
            tabableRegion._registerEventHandlers.call(tabableRegion);
            setTimeout(function () {
              tabableRegion.view.$el.on('keydown.csui-tabables', function (event) {
                if (event.keyCode === 9 && getOption.call(tabablesBehavior, 'containTabFocus')) {
                  return tabablesBehavior._maintainTabFocus(event);
                }
              });
            });
          });
         
        }

      });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, source) {
    var options = source || this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return TabablesBehavior;
});

csui.define('csui/behaviors/keyboard.navigation/tabable.region.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabables.behavior'
], function (module, _, $, Marionette, log, base, TabablesBehavior) {
  'use strict';


  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  var TabableRegionBehavior = Marionette.Behavior.extend({

      defaults: {
        initialActivationWeight: 0
      },

      constructor: function TabableRegionBehavior(options, view) {
        Marionette.Behavior.prototype.constructor.apply(this, arguments);

        this.view = view;
        view.tabableRegionBehavior = this;

        // merge behavior defaults into view
        _.extend(view, this.defaults);

        // add default implementation to view if it does not have one
        _.defaults(view, {
            // TODO remove use of isTabable because there is no code that gets called when the user
            // presses the tab key
            isTabable: function () {
              return true;  // default: this view can be reached by tab
            },
            onLastTabElement: function () {
              return true;  //most regions will only have one tab, with further navigation handled through arrow keys
            }
          }
        );

        if (view.options && !view.options.initialActivationWeight) {
          view.options.initialActivationWeight = this.options.initialActivationWeight;
        }

        this._registerEventHandlers();

      },

      _registerEventHandlers: function () {
        if (!this._eventsRegistered) {
          var view = this.view;
          var self = this;

          // log.debug('_registerEventHandlers ' + view.constructor.name) && console.log(log.last);

          this.listenTo(view, 'render', this._applyClasses);
          this.listenTo(view, 'dom:refresh', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              self.isRegistered = true;
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'refresh:tabindexes', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (self.isRegistered) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });

          this.listenTo(view, 'destroy', function () {
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            self.isRegistered = false;
          });
          this.listenTo(view, 'tabable', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'tabable:not', function () {
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            this.isRegistered = false;
          });

          this.listenTo(view, 'changed:focus', function () {
            if (self.isRegistered) {
              this.moveTabIndex();
            }
          });

          this.listenTo(view, 'escaped:focus', function () {
            TabablesBehavior.setFocusInActiveTabableRegion();
          });
          this._eventsRegistered = true;
        }
      },

      _unregisterEventHandlers: function () {
        var view = this.view;
        // log.debug('_unregisterEventHandlers ' + view.constructor.name) && console.log(log.last);

        this.stopListening(view);
        this._eventsRegistered = false;
      },

      getCurrentlyFocusedElementFromView: function (shiftTab) {
        if (_.isFunction(this.view.currentlyFocusedElement)) {
          var focusEl = this.view.currentlyFocusedElement({shiftKey: shiftTab});
          return (focusEl instanceof $ ? focusEl : $(focusEl));
        } else {
          if (_.isString(this.view.currentlyFocusedElement)) {
            return this.view.$(this.view.currentlyFocusedElement);
          } else {
            log.debug('setInitialTabIndex: ' + this.view.constructor.name + ' does not have' +
              ' currentlyFocusedElement -> not setting tabindex in that view ') &&
            console.log(log.last);
            return $();
          }
        }
      },

      onLastTabElement: function (shiftTab, event) {
        return this.view.onLastTabElement(shiftTab, event);
      },

      setFocus: function (shiftTab) {
        // Not set focus if the view is requested so that the behavior is not stealing the focus.
        // After rendering, the view is setting focus on element at same location by itself.
        if (this.options.notSetFocus) {
          return;
        }

        var elToFocus = this.getCurrentlyFocusedElementFromView(shiftTab);
        // Do not focus elements out of the visible viewport rectangle;
        // it brings them to the visible screen, ignoring the absolute
        // positioning or transforms, if they were applied earlier
        if (elToFocus && base.isVisibleInWindowViewport(elToFocus)) {
          this.ignoreFocusEvents = true;
          elToFocus[0].focus();
          this.ignoreFocusEvents = false;
          return true;
        }
      },

      setInitialTabIndex: function () {
        // TabablesBehavior.clearTabIndexes(this.view);
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
        }
        if (this.view.isTabable()) {
          try {
            this.currentlyFocusedElement = this.getCurrentlyFocusedElementFromView();
            if (this.currentlyFocusedElement && this.currentlyFocusedElement.length > 0) {
              var self = this;
              this.currentlyFocusedElement.prop('tabindex', 0);
              this.currentlyFocusedElement.addClass(
                TabableRegionBehavior.accessibilityActiveElementClass);
              this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
                if (!self.ignoreFocusEvents) {
                  TabablesBehavior.setTabableRegionActive(self);
                }
              });
            }
          } catch (e) {
            console.warn('Could not set as active element: ', this.view.cid, e.message);
          }

        } else {
          this.currentlyFocusedElement = $();
        }
      },

      moveTabIndex: function () {
        var self = this;
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
          this.currentlyFocusedElement.prop('tabindex', -1);
          this.currentlyFocusedElement.removeClass(
            TabableRegionBehavior.accessibilityActiveElementClass);
          this.currentlyFocusedElement = $();

        }
        var newlyFocusedElement = this.getCurrentlyFocusedElementFromView();
        newlyFocusedElement.prop('tabindex', 0);
        this.currentlyFocusedElement = newlyFocusedElement;
        this.currentlyFocusedElement.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
          if (!self.ignoreFocusEvents) {
            TabablesBehavior.setTabableRegionActive(self);
          }
        });
      },

      _applyClasses: function () {
        this.$el.addClass(TabableRegionBehavior.accessibilityRegionClass);
      }
    },
    {
      accessibilityRegionClass: 'csui-acc-tab-region',
      accessibilityActiveRegionClass: 'csui-acc-tab-region-active',
      accessibilityFocusableClass: 'csui-acc-focusable',
      accessibilityActiveElementClass: 'csui-acc-focusable-active'
    }
  );

  return TabableRegionBehavior;
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

csui.define('csui/utils/non-attaching.region/non-attaching.region',['csui/lib/marionette'], function (Marionette) {
  'use strict';

  var NonAttachingRegion = Marionette.Region.extend({

    constructor: function NonAttachingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function (view) {}

  });

  return NonAttachingRegion;

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

csui.define('bundles/csui-error',[
  // Pages
  'csui/pages/error.page/error.page.view',
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-error', true);
});

