/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/lib/backbone', 'csui/utils/log'
], function (module, _, $, Marionette, Backbone, log) {
  'use strict';

  log = log(module.id);

  var DEFAULT_KEY_NAME = 'key';

  return {
    initSelectionMixin: function (options, collection, key) {

      collection = collection || options.collection;

      var allSelectedNodes = collection.selectedItems || this.getCollectionWithSpecificModelId(collection);

      this.getAllSelectedNodes = function() {
        return allSelectedNodes;
      };
      
      this.allSelectedNodes = function() {
          return allSelectedNodes;
      };

      this.getContext = function() {
        return options.context;
      };

      this.getCollection = function() {
        return collection;
      };

      this.getKey = function () {
        return key || DEFAULT_KEY_NAME;
      };

      this.setSelectionKey = function (newkey) {
        key = newkey;
      };

      this.getConnector = function () {
        return options.connector || collection.connector;
      };

      var context        = this.getContext(),
          viewStateModel = context && context.viewStateModel;

      this.listenTo(allSelectedNodes, 'remove', this.removeItemToAllSelectedItems)
          .listenTo(allSelectedNodes, 'add', this.addItemToAllSelectedItems)
          .listenTo(allSelectedNodes, 'reset', this.resetAllSelectedItems);

      viewStateModel && this.listenTo(viewStateModel, 'change:multiItemOperationRunning', this._multiItemOperationEnded);

      this.listenTo(allSelectedNodes, 'reset update', function () {
        viewStateModel && viewStateModel.get("enabled") &&
        this._saveSelectedNodesInSessionViewState(this.getAllSelectedNodes(), this.getContext());
      }.bind(this));

      this.listenTo(collection, 'sync', this._restoreSelectedNodesFromSessionViewSate);
    },

    addTableViewSelectionEvents: function (tableView) {
      this.listenTo(tableView, 'tableRowSelected', function (args) {
        this.addNodesToSelection(args.nodes);
      });

      this.listenTo(tableView, 'tableRowUnselected', function (args) {
        this.removeNodesFromSelection(args.nodes);
      });
    },
    getCollectionWithSpecificModelId: function (collection) {
      var MultiSelectCollection = Backbone.Collection.extend({
            modelId: function (attr) {
              return attr.id;
            }
          }),
          allSelectedCollection = new MultiSelectCollection();
      if (collection && collection.modelId) {
        allSelectedCollection.modelId = collection.modelId;
      }
      return allSelectedCollection;
    },
    removeItemToAllSelectedItems: function (node) {
      var model = this.getCollection().get(node) || this.getCollection().findWhere({id: node.get('id')});
      if (model) {
        model.set('csuiIsSelected', false); // will be ignored if already false
      } else {
        node.set('csuiIsSelected', false);
      }
      
      this.onRemoveItemFromAllSelectedItems && this.onRemoveItemFromAllSelectedItems(node);
    },
    addItemToAllSelectedItems: function (node) {
      var model = this.getCollection().get(node) || this.getCollection().findWhere({id: node.get('id')});
      if (model) {
        model.set('csuiIsSelected', true); // will be ignored if already true
      } else {
        node.set('csuiIsSelected', true);
      }

      this.onAddItemToAllSelectedItems && this.onAddItemToAllSelectedItems(node);
    },
    resetAllSelectedItems: function () {
      var allSelectedNodes = this.getAllSelectedNodes();
      this.getCollection().each(_.bind(function (node) {
        var selectedNode = allSelectedNodes.get(node);
        node.set('csuiIsSelected', selectedNode !== undefined);// setting to same value is ignored
      }, this));

      this.onResetAllSelectedItems && this.onResetAllSelectedItems();
    },
    
    _saveSelectedNodesInSessionViewState: function () {
      if (this.restoringSelection) {
          return;
      }  
      var context        = this.getContext(),
          viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        var selectedNodes = viewStateModel.getSessionViewState('selected_nodes') || {},
            ids = this.getAllSelectedNodes().models.map(function (model) {
              return model.get('id');
            });
        if (ids.length > 0) {
          if (selectedNodes) {
             selectedNodes = _.clone(selectedNodes);
          }  
          selectedNodes [this.getKey()] = ids;
          viewStateModel.setSessionViewState('selected_nodes', selectedNodes);
        } else {
            selectedNodes && (delete selectedNodes[this.getKey()]);
            if (Object.keys(selectedNodes) > 0) {
                viewStateModel.setSessionViewState('selected_nodes',  _.clone(selectedNodes));
            } else {
                viewStateModel.setSessionViewState('selected_nodes',  undefined);
            }
        }
      }
    },

    _multiItemOperationEnded: function () {
      var context        = this.getContext(),
          viewStateModel = context && context.viewStateModel;

      if (viewStateModel && !viewStateModel.get('multiItemOperationRunning') && this._restoreSelectedNodesPending) {
        this._restoreSelectedNodesFromSessionViewSate();
      }
    },

    _restoreSelectedNodesFromSessionViewSate: function () {

      var context = this.getContext(),
          viewStateModel = context && context.viewStateModel;

      if (viewStateModel && viewStateModel.get('multiItemOperationRunning')) {
        this._restoreSelectedNodesPending = true;
        return true;
      }

      if (viewStateModel && viewStateModel.get('enabled')) {
        var selectedNodes = viewStateModel.getSessionViewState('selected_nodes');
        if (selectedNodes) {
          var ids = selectedNodes[this.getKey()] || [],
              collection = this.getCollection(), connector = this.getConnector();
          ids = this._removeSelectedFetchedNodesIds(ids);
          if (ids && ids.length) {
            this.restoringSelection = true;
            this._getNodesFromCollection(collection, ids, connector)
                .done(this._afterFetchingAllSelectedNodes.bind(this));
          }
        }
      }
    },

    _afterFetchingAllSelectedNodes: function (allSelectedNodes, nodesInCollection) {
      var context = this.getContext(),
          viewStateModel = context && context.viewStateModel,
          sessionState = viewStateModel.get('session_state'),
          state        = viewStateModel.get('state');
      if (allSelectedNodes && sessionState &&
           (sessionState.id === undefined ||
           (state && state.filter && state.filter.length) ||
           (allSelectedNodes[0] && allSelectedNodes[0].get('parent_id') === this.getKey()) ||
           this.getKey() === DEFAULT_KEY_NAME)) {
        if (viewStateModel && viewStateModel.getSessionViewState('selected_nodes')) {
          this._resetSelectedNodeCollections(allSelectedNodes, nodesInCollection);
        }
      }
      this.restoringSelection = false;
    },
    _resetSelectedNodeCollections: function(allSelectedNodes, nodesInCollection) {
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes.reset(allSelectedNodes);
      if (this.isTableViewInTheDom()) {
        nodesInCollection && this.tableView.selectedChildren.reset(nodesInCollection);
      } else if (this.thumbnailView) {
        nodesInCollection && this.thumbnail.selectedChildren.reset(nodesInCollection);
        if (this.collection.length > 0) {
          var selected = this.collection.where({ csuiIsSelected: true }).length;
          if (selected > 0) {
            this.thumbnail.updateSelectAllCheckbox.call(this);
          }
        }
      } else {
          this.getCollection().trigger("sync");
      }
    },

    _removeSelectedFetchedNodesIds: function (ids) {
      var selectedNodes = this.getAllSelectedNodes();
      if (ids && ids.length > 0) {
        if (selectedNodes.length > 0) {
          ids = ids.filter(function (id) {
            var node = selectedNodes.find({id: id});
            return node && node.attributes.length === 1;
          });
        }
      }
      return ids;
    },

    isTableViewInTheDom:function() {
      return this.tableView && this.el && this.el.querySelector('.binf-table');
    },

    setupTableSelection: function (tableView) {
      this.listenTo(tableView.collection, 'sync', _.bind(function () {
        var selectedNodes = this.getAllSelectedNodes();
        selectedNodes && selectedNodes.each(_.bind(function (model) {
          var targetModel = selectedNodes.get(model),
              index       = selectedNodes.findIndex(targetModel);
          if (index !== -1 && selectedNodes.at(index) !== model) {
            this.getAllSelectedNodes().remove(selectedNodes.at(index));
            this.getAllSelectedNodes().add(model, {at: index});
          }
        }, this));

        this.onTableViewCollectionSync();
        this.enableViewState && this._saveSelectedNodesInSessionViewState();
      }, this));
    },

    clearAllSelectedNodes: function () {
      var selectedNodes = this.getAllSelectedNodes();
      selectedNodes && selectedNodes.reset([]);
    },

    addNodesToSelection: function (nodes) {
      if (nodes) {
        var selectedNodes = this.getAllSelectedNodes();
        var selectedModels = selectedNodes.models.slice(0);
        _.each(nodes, function (node) {
          if (!selectedNodes.get(node) && node.get('id') !== undefined) {
            selectedModels.push(node);
          }
        }, this);
        selectedNodes.reset(selectedModels);
      }
    },

    removeNodesFromSelection: function (nodes) {
      if (nodes) {
        var selectedNodes = this.getAllSelectedNodes();
        _.each(nodes, function (node) {
          selectedNodes.remove(node, {silent: true});
        }, this);
        selectedNodes.reset(_.clone(selectedNodes.models));
      }
    }
  };

});
