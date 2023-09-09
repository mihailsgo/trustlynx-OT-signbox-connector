/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/controls/toolbar/toolitem.model',
  'csui/controls/toolbar/toolitems.factory', 'csui/utils/commands',
  'csui/utils/log'
], function (module, require, _, $, Backbone, ToolItemModel, ToolItemsFactory,
    commands, log) {
  'use strict';

  log = log(module.id);

  var FilteredToolItemsCollection = Backbone.Collection.extend({
    constructor: function FilteredToolItemsCollection(models, options) {
      if (_.isArray(models)) {
        this.unfilteredModels = models; // save for re-filter
      } else {
        if (models instanceof ToolItemsFactory) {
          var collection = models.getCollection();
          this.unfilteredModels = collection.models;
          this.listenTo(collection, 'add', this.refilter, this)
          .listenTo(collection, 'remove', this.refilter, this)
          .listenTo(collection, 'reset', function () {
            this.unfilteredModels = collection.models;
            this.refilter();
          }, this);
        } else {
          if (models instanceof Backbone.Collection &&
              models.model instanceof ToolItemModel) {
            this.unfilteredModels = models.models;
          }
        }
      }

      options || (options = {});
      this.commands = options.commands || commands;
      this.addTrailingDivider = models.options ? models.options.addTrailingDivider :
                                options.addTrailingDivider;
      this.addGroupSeparators = models.options ? models.options.addGroupSeparators !== false :
                                options.addGroupSeparators !== false;
      this.suppressGroupSeparators = models.options ? models.options.suppressGroupSeparators :
                                     options.suppressGroupSeparators;
      this.setStatus(options.status);
      this.delayedActions = options.delayedActions;
      this.mask = options.mask;
      this._filtering = 0;

      Backbone.Collection.prototype.constructor.call(this,
          this.unfilteredModels, options);

      if (this.delayedActions) {
        this.listenTo(this.delayedActions, 'sync', this.refilter)
        .listenTo(this.delayedActions, 'error', this.refilter);
      }
      if (this.mask) {
        this.listenTo(this.mask, 'update', this.refilter);
      }
    },

    sort: function (options) {
      options || (options = {});
      var array = this.models,
          comparator = function (leftIndex, rightIndex) {
            var thisLazy = !!array[leftIndex].get('csuiNonPromotedItem'),
                otherLazy = !!array[rightIndex].get('csuiNonPromotedItem');
            if (!thisLazy && otherLazy) {
              return -1;
            } else if (thisLazy && !otherLazy) {
              return 1;
            }
            return (leftIndex - rightIndex);
          };
      this.models = array
      .map(function (item, index) {
        return index;
      })
      .sort(comparator)
      .map(function (index) {
        return array[index];
      });
      if (!options.silent) {
        this.trigger('sort', this, options);
      }
      return this;
    },

    destroy: function () {
      this.stopListening();
    },

    refilter: function () {
      if (this._isActive === false) {
        return;
      }
      if (!this._filtering) {
        ++this._filtering;
        var resolving = this._resolveCustomViews();
        if (resolving) {
          resolving.always(updateCollection.bind(this));
        } else {
          updateCollection.call(this);
        }
      }

      function updateCollection() {
        var filteredModels = this.filterModels(this.unfilteredModels);
        var doReset = this.length !== filteredModels.length || this._forceResetOnNextRefilter;
        if (!doReset) {
          doReset = this.some(function (exCommand, index) {
            var newCommand = filteredModels[index];
            return (!_.isEqual(exCommand.attributes, newCommand.attributes)
                    || !_.isEqual(exCommand.toolItems, newCommand.toolItems));
          });
        }
        if (doReset) {
          var resetOptions = (!!this.silentFetch && !this._forceResetOnNextRefilter) ?
              {silent: true} : undefined;
          this.reset(filteredModels, resetOptions);
          delete this._forceResetOnNextRefilter;
        } else {
          this.trigger('remain', this);
        }
        this.silentFetch = false;
        --this._filtering;
      }
    },
    set: function (models, options) {
      if (!this._filtering) {
        models = this.filterModels(models);
      }
      return Backbone.Collection.prototype.set.call(this, models, options);
    },

    setStatus: function (status) {
      if (status) {
        if (this.status) {
          if (this.status.nodes) {
            this.status.nodes.remove(this.status.container);
            this.stopListening(this.status.nodes);
          }
          this.status.container && this.stopListening(this.status.container);
        }
        this.status = status;

        if (status.nodes) {
          var listenEvents = ['change', 'reset'];
          listenEvents = _.union(listenEvents, status.listenEvents);
          var events = listenEvents.join(' ');

          this.listenTo(status.nodes, events, this.refilter);
        }
        if (status.container) {
          this.listenTo(status.container, 'change', this.refilter);
        }
      }
    },

    updateStatus: function (updates) {
      this.status = _.extend({}, this.status, updates);
    },

    setActive: function (isActive) {
      if (this._isActive === false && this._isActive !== isActive) {
        this._forceResetOnNextRefilter = true;
      }
      this._isActive = isActive;
    },

    filterModels: function (models) {
      ++this._filtering;
      var filteredModels = this._filterToolItems(models);
      filteredModels = _.reject(filteredModels, function (model) {
        if (model.toolItems) {
          var subItems = this._makeSubItems(model.toolItems);
          if (subItems.length) {
            subItems = removeExtraGroupSeparators.call(this, subItems);
            model.toolItems.set(subItems, {silent: true});
          } else {
            return this._checkCommandEnableOrDisable(model);
          }
        }
      }, this);

      filteredModels = removeExtraGroupSeparators.call(this, filteredModels);

      --this._filtering;
      return filteredModels;

      function removeExtraGroupSeparators(allModels) {
        var previousModelisSeperator,
            filterdItems = _.reject(allModels, function (model) {
              if (model.isSeparator()) {
                if (!!previousModelisSeperator) {
                  return true;
                } else {
                  previousModelisSeperator = true;
                }
              } else {
                previousModelisSeperator = false;
              }
            }, this);
        filterdItems.length && filterdItems[filterdItems.length - 1].isSeparator() &&
        filterdItems.pop();
        return filterdItems;
      }
    },
    _checkCommandEnableOrDisable: function (model) {
      var signature = model.get('signature'),
          command = signature && this.commands.get(signature);
      if (command) {
        var data = _.extend({}, this.status.data, model.get('commandData')),
            status = _.defaults({
              toolItem: model,
              data: data
            }, this.status);
        return isCommandDisabled(model, command, status);
      } else {
        return true;
      }
    },
    _makeSubItems: function (toolitems) {
      var subItems = _.reject(toolitems.models, function (flyout) {
        if (flyout.get('subItemOf')) {
          var flyoutitem = toolitems.find({signature: flyout.get('subItemOf')});
          if (flyoutitem !== undefined) {
            flyoutitem.toolItems.push(flyout);
            return true;
          }
        }
      }, this);

      return _filterSubMenuToolItems.call(this, subItems);
      function _filterSubMenuToolItems(subToolitems) {
        return _.reject(subToolitems, function (model) {
          if (!model.toolItems || (model.toolItems && model.toolItems.length === 0)) {
            if (!model.isSeparator()) {
              return this._checkCommandEnableOrDisable(model);
            }
          } else {
            var sublevelItems = _filterSubMenuToolItems.call(this, model.toolItems.models);
            
              sublevelItems.length && sublevelItems[0].isSeparator() && sublevelItems.shift();
              sublevelItems.length && sublevelItems[sublevelItems.length - 1].isSeparator() && sublevelItems.pop();
              if(sublevelItems.length) {
                model.toolItems.set(sublevelItems, {silent: true});
              }else {
                return true;
              }
          }
        }, this);
      }
    },

    _filterToolItems: function (models) {
      var filteredModels = new Backbone.Collection(undefined,
          {model: ToolItemModel});
      _.each(models, function (model) {
        if (this.mask && !this.mask.passItem(model)) {
          return;
        }
        model = model.clone();
        var flyout = model.get('flyout'),
            toolItems = filteredModels;
        if (flyout) {
          var flyoutItem = filteredModels.findWhere({flyout: flyout});
          if (flyoutItem) {
            toolItems = flyoutItem.toolItems;
          }
          model.toolItems = new Backbone.Collection(undefined,
              {model: ToolItemModel});
        }
        var command = this.commands.get(model.get('signature')),
            forceEnabled = model.get('enabled');
        if (command) {
          var data = _.extend({}, this.status.data, model.get('commandData')),
              status = _.defaults({
                toolItem: model,
                data: data
              }, this.status);
          if (command.isNonPromoted && !!command.isNonPromoted(status)) {
            model.set('csuiNonPromotedItem', true);
          }
          if (isCommandDisabled(model, command, status) && !forceEnabled) {
            model = null;
          } else if (flyout) {
            var actions = model.get('actions');
            if (actions) {
              actions = new Backbone.Collection(actions,
                  {model: ToolItemModel});
              actions = this._filterToolItems(actions.models);
              model.toolItems.reset(actions);
            }
          }
        } else if (!model.toolItems && !forceEnabled) {
          model = null;
        }
        if (model) {
          var group = model.get('group'),
              subItem = model.get('subItemOf'),
              index = toolItems.findLastIndex(function (model) {
                return model.get('group') === group;
              });

          if (index < 0) {
            if (toolItems.length > 0 && this.addGroupSeparators &&
                !this.suppressGroupSeparators) {
              var separator = ToolItemModel.createSeparator();
              !!subItem && (separator.set({'subItemOf': subItem, silent: true}));
              toolItems.push(separator);
            }
            toolItems.push(model);
          } else {
            toolItems.add(model, {at: index + 1});
          }
          model.status = this.status;
        }

      }, this);
      return filteredModels.models;
    },

    _resolveCustomViews: function () {
      var customToolItems = this.unfilteredModels.filter(function (toolItem) {
        return typeof toolItem.get('customView') === 'string';
      });
      if (!customToolItems.length) {
        return;
      }
      var customModules = customToolItems.map(function (toolItem) {
            return toolItem.get('customView');
          }),
          deferred = $.Deferred();
      require(customModules,
          function () {
            for (var i = 0, count = customModules.length; i < count; ++i) {
              customToolItems[i].set('customView', arguments[i]);
            }
            deferred.resolve();
          }, function (error) {
            for (var i = 0, count = customModules.length; i < count; ++i) {
              customToolItems[i].set('customView', error);
            }
            deferred.reject(error);
          });
      return deferred.promise();
    }
  });

  function isCommandDisabled(model, command, status) {
    try {
      return command.enabled && !command.enabled(status, {
        data: model.get('commandData')
      });
    } catch (error) {
      log.warn('Evaluating the command "{0}" failed.\n{1}',
          command.get('signature'), error.message) && console.warn(log.last);
      return true;
    }
  }

  return FilteredToolItemsCollection;
});
