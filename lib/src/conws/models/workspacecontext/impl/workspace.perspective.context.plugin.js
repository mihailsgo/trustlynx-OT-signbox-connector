/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/log',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'conws/utils/navigate/navigate.util'
], function (module, $, _, Log,
    PerspectiveContextPlugin,
    NodeModelFactory,
    NextNodeModelFactory,
    NavigateUtil) {
  'use strict';

  var log = new Log(module.id);

  function hasContextTabbedPerspective(context) {
    var perspective = context && context.perspective;
    var options = perspective && perspective.get("options");
    return !!(options && options.tabs);
  }

  function setupConwsNavigate(context, node, view) {
    var viewStateModel = context && context.viewStateModel;
    if (view && viewStateModel) {
      var conwsNavigate = viewStateModel.get('conwsNavigate');
      if (!conwsNavigate || conwsNavigate==="refreshed") {
        conwsNavigate = 'conwsLink';
        if (view.is==='BreadcrumbCollectionView') {
          conwsNavigate = 'gotoLocation';
        } else if (view.is==='NodeTreeView') {
          var root = view.rootNodes && view.rootNodes.length>0 && view.rootNodes[0];
          if (root && root.get("id")===node.get("id")) {
            conwsNavigate = 'gotoLocation';
          }
        }
        log.debug('Conws conwsNavigate set "{0}"', conwsNavigate) && console.log(log.last);
        viewStateModel.set('conwsNavigate',conwsNavigate);
      }
    }
  }

  function setupContextModelListener(context, factoryName, callback) {
    var model;
    if (context.hasModel(factoryName)) {
      model = context.getModel(factoryName);
      callback.call(this,context,model);
    }
    this.listenTo(context,'add:factory',function(context,name,factory){
      if (name===factoryName){
        var old = model;
        model = factory && factory.property;
        callback.call(this,context,model,old);
      }
    });
  }
  var WorkspacePerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function WorkspacePerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);
      setupContextModelListener.call(this, this.context, "nextNode", function(context, nextNode, oldModel) {
        oldModel && this.stopListening(oldModel);
        nextNode && this.listenTo(nextNode,"before:change:id",function(node, view){
          setupConwsNavigate(context, node, view);
        })
      });
      setupContextModelListener.call(this, this.context, "workspaceContext", function(context, workspaceContext, oldWkspContext) {
        var oldWkspModel = oldWkspContext && oldWkspContext.getModel("node");
        oldWkspModel && this.stopListening(oldWkspModel);
        var workspaceModel = workspaceContext && workspaceContext.getModel("node");
        workspaceModel && this.listenTo(workspaceModel,"sync error change:name",function() {
          context.viewStateModel.setSessionViewState('wkspname',workspaceModel.get("name"));
        });
      });
      this.listenTo(this.context.viewStateModel,'navigate',function(historyEntry){

        var wkspId = NavigateUtil.checkWorkspaceHierarchy(this.context).wkspid||0;
        this.context.viewStateModel.setSessionViewState('wkspid', wkspId);

        var wkspModel = NavigateUtil.getWorkspaceModel(this.context);
        var wkspName = (wkspModel && wkspModel.get("id")===wkspId) ? wkspModel.get("name") : undefined;
        this.context.viewStateModel.setSessionViewState('wkspname', wkspName);
        this.context.viewStateModel.set('conwsNavigated', undefined);
      });
    },
    onApply: function (sourceModel, forceChange) {

      var context = this.context;
      if (context) {

        var oldHierarchy = NavigateUtil.checkWorkspaceHierarchy(context.getModel(NodeModelFactory)),
            newHierarchy = NavigateUtil.checkWorkspaceHierarchy(context.getModel(NextNodeModelFactory));
        var oldId = oldHierarchy.wkspid||0,
            newId = newHierarchy.wkspid||0;
        var viewStateModel = context.viewStateModel;
        var conwsNavigate = viewStateModel.get('conwsNavigate');
        log.debug('Conws conwsNavigate get "{0}"', conwsNavigate) && console.log(log.last);
        viewStateModel.set({
          conwsNavigate: undefined,
          conwsNavigated: conwsNavigate
        });

        log.debug('Conws::onApply checking change for {0} {1}', newId, forceChange) && console.log(log.last);
        if (oldId || newId) {

          if (oldId !== newId) {
            if (!forceChange && hasContextTabbedPerspective(context)) {
              log.debug('Conws::onApply forcing change') && console.log(log.last);
              return {forceChange: true};
            }
          } else {
            if (forceChange) {
              log.debug('Conws::onApply reject change') && console.log(log.last);
              return {forceChange: false};
            }
          }
        }
        log.debug('Conws::onApply skipping change') && console.log(log.last);
      } else {
        log.debug('Conws::onApply no context') && console.log(log.last);
      }
    }

  });

  return WorkspacePerspectiveContextPlugin;

});