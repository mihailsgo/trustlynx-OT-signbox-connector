/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/ancestors',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/log',
  'csui/models/node.children2.lite/node.children2.lite',
  'csui/controls/treebrowse/tree.view',
  'i18n',
  'hbs!csui/controls/treebrowse/impl/node.tree',
  'i18n!csui/controls/treebrowse/impl/nls/lang',
  'css!csui/controls/treebrowse/impl/node.tree'
], function (module, $, _, Marionette, PerfectScrollingBehavior, NextNodeModelFactory,
    AncestorCollectionFactory, GlobalMessage, log, NodeChildren2LiteCollection, TreeView, i18n,
    template, lang
) {
  'use strict';

  log = log(module.id);

  var DEFAULT_SHOW_ITEMS_BLOCK_SIZE = 10;

  return Marionette.LayoutView.extend({

    className: 'csui-tree-browse-panel',
    template: template,

    regions: {
      treeRegion: '.csui-tree-browse-container'
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      }
    },

    constructor: function NodeTreeView(options) {
      if (!options || !options.originatingView) {
        throw new Error('originatingView option is mandatory');
      }
      _.defaults(options, {
        lazyTree: true
      });

      this.context = options.originatingView.context;
      this.connector = options.originatingView.connector;
      this.originatingView = options.originatingView;
      this.showItemsBlockSize = options.showItemsBlockSize || DEFAULT_SHOW_ITEMS_BLOCK_SIZE;
      this.rootNodes = options.rootNodes || options.originatingView.rootNodes;
      this.lazyLoading = options.lazyTree;
      this.ancestors = this.context.getCollection(AncestorCollectionFactory);

      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(this.originatingView.collection, 'add', this._modelAdded, this);
      this.listenTo(this.originatingView.collection, 'remove', this._modelRemoved, this);
      this.listenTo(this.originatingView.collection, 'change:name sync', this._modelRenamed, this);
      this.listenTo(this.originatingView.container, 'change:name', this._modelRenamed, this);
      this.listenTo(this.originatingView.container, 'delete', this._modelRemoved, this);
    },

    is: "NodeTreeView",

    onRender: function () {
      this.treeView = new TreeView(this._buildTreeOptions());
      this.treeRegion.show(this.treeView);
    },

    updateNodes: function () {
      var self = this,
          activeNode = this.treeView.tree.activeNode;
      if (activeNode) {
        var updatedAncestors  = this.getUpdatedAncestors(this.ancestors),
            ancestorTreeNodes = activeNode.getParentList(false, true),
            index             = 0;
        ancestorTreeNodes.forEach(function (treeNode) {
          if (treeNode.title !== updatedAncestors[index].name) {
            self._updateNodeTitle(treeNode, updatedAncestors[index].name);
          }
          index++;
        });
        if (activeNode.isExpanded()) {
          var folderNodes       = this.originatingView.collection.filter(function (node) {
                return node.get('container') === true;
              }),
              treeChildrenNodes = activeNode.getChildren();

          folderNodes.forEach(function (collectionNode) {
            var node = _.find(treeChildrenNodes, function (treeNode) {
              return collectionNode.get('id').toString() === treeNode.key;
            });
            if (node && node.key !== collectionNode.get(name)) {
              self._updateNodeTitle(node, collectionNode.get('name'));
            }
          });
        }
      }
    },
    getUpdatedAncestors: function (ancestors) {
      if (!this.updateAncestors) {
        return ancestors.map(function (ancestor) {
          return {
            id: ancestor.get('id').toString(),
            name: ancestor.get('name')
          };
        });
      } else {
        var updatedAncestors = [];
        var rootFound = false;
        ancestors.each(function (ancestor) {
          if (rootFound) {
            updatedAncestors.push({
              id: ancestor.get('id').toString(),
              name: ancestor.get('name')
            });
          } else {
            this.rootNodes.some(function (rootNode) {
              if (rootNode.get('id') === ancestor.get('id')) {
                rootFound = true;
                updatedAncestors.push({
                  id: ancestor.get('id').toString(),
                  name: ancestor.get('name')
                });
                return true;
              }
              return false;
            });

          }
        }, this);

        return updatedAncestors;
      }

    },

    onDomRefresh: function () {
      this._clearTabIndexes();
    },

    _clearTabIndexes: function () {
      var clearTabIndexesSelector = ".ps-scrollbar-x[tabindex], .ps-scrollbar-y[tabindex]",
          targetElems = this.el.querySelectorAll(clearTabIndexesSelector);
      if (targetElems.length) {
        for(var i = 0; i < targetElems.length; i++) {
          targetElems[i].setAttribute("tabindex", -1);
        }
      }
    },

    _buildTreeOptions: function () {
      var nextNode    = this.context.getModel(NextNodeModelFactory),
          ancestors   = this.context.getCollection(AncestorCollectionFactory),
          treeOptions = _.extend({

            rtl: i18n && i18n.settings.rtl ? true : false,
            source: function () {
              var nodes = [];
              if (this.rootNodes && this.rootNodes.length > 0) {
                _.each(this.rootNodes, function (rootNode) {
                  nodes.push(rootNode);
                });
                this.updateAncestors = true;
              } else {
                nodes.push(ancestors.first());
              }
              return _.map(nodes, this._createTreeNode);
            },

            init: function (event, data) {
              var self = this;

              function syncTree(firstLoad) {
                self._activateNode(data.tree, self.getUpdatedAncestors(ancestors), undefined,
                    firstLoad);
                !firstLoad && self.updateNodes();
              }
              this.listenTo(ancestors, 'update reset', function () {
                syncTree(false);
              });
              data.tree.data.firstLoad = true;
              syncTree(true);
            },

            lazyLoad: function (event, data) {
              var deferred = $.Deferred(),
                  treeNode = data.node;
              this._fetchNodeChildren(treeNode, 0, this._getInitialFetchLimit(treeNode)).done(
                  _.bind(function (collection) {
                    treeNode.hasError = false;
                    var limit       = this._getInitialShowLimit(treeNode),
                        result      = _.map(collection.models, this._createTreeNode),
                        allChildren = _.clone(result);
                    treeNode.data.totalCount = collection.totalCount; // store total count info in parent node
                    treeNode.data.allChildren = allChildren;

                    if (treeNode.data.totalCount > limit) {
                      result.splice(limit);
                      this._addPagingNode(result, allChildren, treeNode.data.totalCount, limit);
                    }
                    deferred.resolve(result);
                  }, this)).fail(function (error) {
                treeNode.setStatus("ok");
                if (error.status === 404) {
                  treeNode.hasError = true;
                  this._makeErrorNode(treeNode);
                } else {
                  GlobalMessage.showMessage('error',
                      _.str.sformat(lang.expandNetworkError, treeNode.title));
                }
              }.bind(this));

              data.result = deferred.promise();
            },

            focus: function (event, data) {
              data.node.scrollIntoView(true);
            },

            expand: function () {
              this.trigger('update:scrollbar');
            },

            collapse: function (event, data) {
              this.trigger('update:scrollbar');
              data.node.resetLazy();
            },

            click: function (event, data) {
              if (_.isEmpty(data.node.data) || !!data.node.hasError ||
                  !!data.node.data.isErrorNode) {
                event.preventDefault();
                event.stopPropagation();
                return false;
              }
              data.tree.activateKey(false, {noEvents: true});
            },

            dblclick: function () {
              return false;
            },

            keydown: function (event, data) {
              if (event.which === 13 || event.which === 32) {
                if(!!data.node.hasError|| !!data.node.data.isErrorNode) {
                  return false;
                }
                data.tree.activateKey(false, {noEvents: true});
              }
            },

            clickPaging: function (event, data) {
              this._clickPagingNode(data.node);
            },

            beforeActivate: function (event, data) {
              if (data.node.isPagingNode()) {
                data.tree.options.clickPaging.apply(this, arguments);
                return false;
              }
              return true;
            },

            activate: function (event, data) {
              var origId = nextNode.get('id').toString();
              if (origId != data.node.key) {
                nextNode.trigger('before:change:id', data.node.data.origNode, this);
                nextNode.set({
                  id: data.node.key
                });
              }
              if (origId === data.node.key && !data.tree.data.firstLoad) {
                this.originatingView.collection.fetch({reload: true});
              }
              data.tree._currActiveNodeKey = data.node.key;
            }

          }, this.options);
      for (var key in treeOptions) {
        if (_.isFunction(treeOptions[key])) {
          treeOptions[key] = treeOptions[key].bind(this);
        }
      }

      return treeOptions;
    },

    _clickPagingNode: function (node) {
      var deferred = $.Deferred();
      if (!this.lazyLoading) {
        this._clickPagingNodePrefetch(node).done(deferred.resolve);
      } else {
        this._clickPagingNodeLazy(node).done(deferred.resolve);
      }
      return deferred.promise();
    },

    _makeErrorNode: function (treeNode) {
      var errorNode = treeNode.addNode({
        title: lang.nodeDoesNotExistMsg,
        isErrorNode: true
      });
      treeNode.setExpanded(true, {noEvents: true});
    },

    _getInitialFetchLimit: function (node) {
      var initialFetch;
      if (this.lazyLoading) {
        initialFetch = this.showItemsBlockSize;
      } else {
        initialFetch = 2 * this.showItemsBlockSize;

      }
      return initialFetch;
    },

    _getInitialShowLimit: function (node) {
      return this.showItemsBlockSize;
    },

    _createTreeNode: function (node) {
      var isContainer = !!node.get('container');
      return {
        key: node.get('id'),
        origNode: node,
        title: node.get('name'),
        tooltip: node.get('name'),
        folder: isContainer,
        lazy: isContainer
      };
    },

    _fetchNodeChildren: function (node, fetchStartIndex, size) {
      var deferred   = $.Deferred(),
          collection = new NodeChildren2LiteCollection([],
              _.defaults({
                    autoreset: true,
                    fields: {
                      properties: []
                    }
                  },
                  {node: node.data.origNode}
              )
          );
      collection.setFilter(-1, 'type', {fetch: false});
      this._setCollectionOptions(collection, node.data.origNode, fetchStartIndex, size);
      collection.fetch().done(function () {
        deferred.resolve(collection);
      }).fail(deferred.reject);
      return deferred.promise();
    },

    _activateNode: function (tree, ancestors, lastNode, firstLoad) {
      var me = this,
          key, treeNode;

      if (ancestors.length > 0) {
        key = ancestors[0].id;
        if (!lastNode) {
          var rootNodes = tree.rootNode.getChildren();
          treeNode = _.find(rootNodes, {key: key});
        }

        if (!treeNode) {
          var lastActedNode = lastNode || tree.activeNode;
          treeNode = lastActedNode && _.find(lastActedNode.getChildren(), function (n) {
            return n.key === key;
          });
        }

        if (!treeNode) {
          treeNode = tree.getNodeByKey(key);
        }

        if (treeNode) {
          if (ancestors.length === 1) {
            if (firstLoad === true) {
              treeNode.setExpanded(true).done(function() {
                treeNode.setActive(true);
              });
              tree.data.firstLoad = false;
            } else {
              treeNode.setActive(true);
            }
          } else {
            treeNode.setExpanded(true).done(function () {
              ancestors.splice(0, 1);
              me._activateNode(tree, ancestors, treeNode, firstLoad);
            });
          }
        } else {
          if (lastNode) {
            var lastChild = lastNode.getLastChild();
            if (lastChild && lastChild.statusNodeType === 'paging' && lastChild.data.showMore) {
              me._clickPagingNode(lastChild).done(function () {
                me._activateNode(tree, ancestors, lastNode, firstLoad);
              });
              return;
            }
          }
          log.error('Ancestor ' + key + ' not found in the tree, while trying to activate the node')
          && console.error(log.last);
        }
      }
    },

    _addPagingNode: function (output, allChildren, totalCount, currPageListSize) {
      var showMore = currPageListSize < totalCount;
      output.push({
        statusNodeType: 'paging',
        title: showMore ? lang.ShowMore : lang.ShowLess,
        data: {
          allChildren: allChildren,
          currPageListSize: currPageListSize,
          showMore: showMore,
        }
      });
    },

    _displayLoader: function (node) {
      var spanEle        = $(node.span),
          spanElePadding = parseFloat(spanEle.css('padding-left')),
          spanEleWidth   = spanEle.width();
      this.treeView.tree.nodeSetStatus({node: node}, "loading");
      spanEle.find('.fancytree-title').addClass('binf-hidden');
      if(i18n && i18n.settings.rtl) {
        spanEle.css({
          paddingRight: spanElePadding + (spanEleWidth / 2)
        });
      } else {
        spanEle.css({
          paddingLeft: spanElePadding + (spanEleWidth / 2)
        });
      }
    },

    _clickPagingNodeLazy: function (node, collapse) {
      var me               = this,
          deferred         = $.Deferred(),
          parentNode       = node.getParent(),
          allChildren      = node.data.allChildren, // array that contains all the fetched children of a node
          totalCount       = parentNode.data.totalCount,
          currPageListSize = node.getIndex(),//node.data.currPageListSize,
          showMore         = node.data.showMore && collapse !== true,
          newPageListSize,
          newResult;

      if (showMore) {
        newPageListSize = currPageListSize + this.showItemsBlockSize;
        me._displayLoader(node);
        me._fetchNodeChildren(parentNode, currPageListSize, me.showItemsBlockSize).done(
            function (collection) {
              newResult = _.map(collection.models, me._createTreeNode);
              (totalCount > allChildren.length) && allChildren.push.apply(allChildren, newResult);
              me.treeView.tree.nodeSetStatus({node: node}, "ok");
              me._addPagingNode(newResult, allChildren, totalCount, newPageListSize);
              me._replacePagingNodeWithChildren(node, newResult, showMore, collapse).done(
                  deferred.resolve);
            }).fail(function (error) {
          me.treeView.tree.nodeSetStatus({node: node}, "ok");
          GlobalMessage.showMessage('error', _.str.sformat(lang.showMoreNetworkError));
        });
      } else {
        newResult = [];
        newPageListSize = me._getInitialShowLimit(node.parent);
        me._addPagingNode(newResult, allChildren, totalCount, newPageListSize);
        for (var i = parentNode.children.length - 2; i >= newPageListSize; i--) {
          parentNode.removeChild(parentNode.children[i]);
        }
        me._replacePagingNodeWithChildren(node, newResult, showMore, collapse).done(
            deferred.resolve);
      }
      return deferred.promise();
    },

    _clickPagingNodePrefetch: function (node, collapse) {
      var me               = this,
          deferred         = $.Deferred(),
          parentNode       = node.getParent(),
          allChildren      = node.data.allChildren, // array that contains all the fetched children of a node
          totalCount       = parentNode.data.totalCount,
          currPageListSize = node.getIndex(),//node.data.currPageListSize,
          showMore         = node.data.showMore && collapse !== true,
          promise          = parentNode.data.promise, // promise of the previous prefetch
          newPageListSize,
          newResult;

      if (showMore) {  // if user clicked on show more
        newPageListSize = currPageListSize + me.showItemsBlockSize; // calculate the new page size
        if (!promise || promise.finish) { // checking if the previous prefetch call is a success
          newResult = allChildren.slice(currPageListSize, newPageListSize);
          newPageListSize = allChildren.length < newPageListSize ? allChildren.length :
                            newPageListSize;
          prefetchChildren();
          me._addPagingNode(newResult, allChildren, totalCount, newPageListSize);
          me._replacePagingNodeWithChildren(node, newResult, showMore, collapse).done(
              deferred.resolve);
        }
        else if (!promise.finish && !promise.rejected) {
          me._displayLoader(node);
          promise.done(function () {
            me.treeView.tree.nodeSetStatus({node: node}, "ok");
            newResult = allChildren.slice(currPageListSize, newPageListSize);
            prefetchChildren();
            me._addPagingNode(newResult, allChildren, totalCount, newPageListSize);
            me._replacePagingNodeWithChildren(node, newResult, showMore, collapse).done(
                deferred.resolve);
          }).fail(function () {
            console.error('Network issue fetching show more results');
          });
        } else if (promise.rejected) {
          GlobalMessage.showMessage('error', _.str.sformat(lang.showMoreNetworkError));
        } else {
          console.error('Network issue fetching show more results');
        }
      } else {
        newResult = [];
        newPageListSize = me._getInitialShowLimit(node.parent);
        me._addPagingNode(newResult, allChildren, totalCount, newPageListSize);
        for (var i = parentNode.children.length - 2; i >= newPageListSize; i--) {
          parentNode.removeChild(parentNode.children[i]);
        }
        me._replacePagingNodeWithChildren(node, newResult, showMore, collapse).done(
            deferred.resolve);
      }

      function prefetchChildren() {
        var fetchStartIndex = allChildren.length;
        if (totalCount > allChildren.length) {
          promise = me._fetchNodeChildren(parentNode, fetchStartIndex, me.showItemsBlockSize);
          parentNode.data.promise = promise; // storing the promise in parent node
          promise.done(function (collection) {
            var preFetchedNodes = _.map(collection.models, me._createTreeNode);
            promise.finish = true;
            allChildren.push.apply(allChildren, preFetchedNodes);
          }).fail(function () {
            promise.rejected = true;
          });
        }
      }

      return deferred.promise();
    },

    _replacePagingNodeWithChildren: function (node, newResult, showMore, collapse) {
      var parentNode = node.getParent(),
          focusIndex = node.getIndex(),
          deferred   = $.Deferred();
      node.replaceWith(newResult).done(function () {
        this.trigger('update:scrollbar');
        if (showMore && node.tree._currActiveNodeKey &&
            _.any(newResult, {key: node.tree._currActiveNodeKey})) {
          this._getActiveNode().setActive(true, {noFocus: true, noEvents: true});
        }
        if (collapse !== true) {
          parentNode.children[focusIndex].setFocus(true);
        }
        deferred.resolve();
      }.bind(this)).fail(deferred.reject);

      return deferred.promise();
    },

    _setCollectionOptions: function (collection, node, currPageListSize, showItemsBlockSize) {
      collection.node = node;
      collection.skipCount = currPageListSize;
      collection.topCount = showItemsBlockSize;
    },

    _getActiveNode: function () {
      var tree = this.treeView.tree;
      return tree.getNodeByKey(tree._currActiveNodeKey);
    },

    _addNewNode: function (parentNode, newNode) {
      var lastChild     = parentNode.getLastChild(), pos, addedInMainList,
          hasPagingNode = lastChild && lastChild.statusNodeType === 'paging',
          children      = hasPagingNode ? lastChild.data.allChildren : parentNode.getChildren(),
          childIdNames  = _.map(children, function (item) {
            return {
              key: item.key,
              title: item.title
            };
          });
      childIdNames.push(newNode);
      childIdNames = _.sortBy(childIdNames, function (item) {
        return item.title.toLowerCase();
      });
      _.find(childIdNames, function (item, index) {
        if (item.key === newNode.key) {
          pos = index;
          return true;
        }
      });
      if (pos < parentNode.getChildren().length) {
        parentNode.addChildren([newNode], pos === -1 ? null : pos);
        addedInMainList = true;
      } else if (pos === parentNode.getChildren().length && !hasPagingNode) {
        parentNode.addChildren([newNode]);
        addedInMainList = true;
      }
      if (hasPagingNode) {
        lastChild.data.allChildren.splice(pos, 0, newNode);
        if (addedInMainList) {
          lastChild.data.currPageListSize = lastChild.data.currPageListSize + 1;
        }
      }
    },

    _removeNode: function (parentNode, modelId) {
      var nodeToBeRemoved = _.find(parentNode.getChildren(), {key: modelId.toString()});
      if (nodeToBeRemoved) {
        nodeToBeRemoved.remove();
      }
      var lastChild = parentNode.getLastChild();
      if (lastChild && lastChild.statusNodeType === 'paging') {
        lastChild.data.allChildren = _.reject(lastChild.data.allChildren, {key: modelId});
        if (nodeToBeRemoved) {
          lastChild.data.currPageListSize = lastChild.data.currPageListSize - 1;
        }
        if (lastChild.data.allChildren.length === lastChild.data.currPageListSize) {
          parentNode.removeChild(lastChild);
        }
      }
    },

    _modelAdded: function (model) {
      var me             = this,
          addModelToTree = function (model) {
            var activeNode      = me._getActiveNode(),
                activeNodeKey   = activeNode.key,
                treeParentNodes = me.treeView.tree.findAll(function (node) {
                  return node.isLoaded() && activeNodeKey === node.key;
                });

            _.each(treeParentNodes, function (parentNode) {
              me._addNewNode(parentNode, me._createTreeNode(model));
            });
          };
      if (model.get('container')) {
        if (!model.get('id')) {
          me.listenToOnce(model, 'sync', function () {
            addModelToTree(model);
          });
        } else {
          addModelToTree(model);
        }
      }
    },

    _modelRemoved: function (model) {
      var me = this;
      if (model.get('container')) {
        var modelId     = model.get('id'),
            parentNodes = me.treeView.tree.findAll(function (node) {
              if (node.isLoaded() && node.hasChildren()) {
                if (_.any(node.getChildren(), {key: modelId.toString()})) {
                  return true;
                }
                var lastChild = node.getLastChild();
                if (lastChild.statusNodeType === 'paging') {
                  return _.any(lastChild.data.allChildren, {key: modelId});
                }
              }
              return false;
            });

        _.each(parentNodes, function (parentNode) {
          me._removeNode(parentNode, modelId);
        });
      }
    },

    _modelRenamed: function (model) {
      var me = this;
      if (model.get('container') && !!model.changed.name) {
        var modelId   = model.get('id'),
            treeNodes = me.treeView.tree.findAll(function (node) {
              if (node.statusNodeType === 'paging') {
                _.each(node.data.allChildren, function (child) {
                  if (child.key === modelId) {
                    child.title = model.get('name');
                  }
                });
                return false;
              } else {
                return modelId.toString() === node.key;
              }
            });

        _.each(treeNodes, function (treeNode) {
          me._updateNodeTitle(treeNode, model.get('name'));
        });
      }
    },

    _updateNodeTitle: function(node, name){
      node.tooltip = name;
      node.setTitle(name);
    }

  });

});
