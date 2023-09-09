csui.define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/log',
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
        // view.is: 'NodesTableView', 'BreadcrumbCollectionView', 'NodeTreeView', ...
        // by default indicate 'conwsLink' (see tab.index.preferences.extension for more).
        conwsNavigate = 'conwsLink';
        if (view.is==='BreadcrumbCollectionView') {
          // clicking on the breadcrumb always opens the folder browser tab, in a workspace navigation.
          conwsNavigate = 'gotoLocation';
        } else if (view.is==='NodeTreeView') {
          var root = view.rootNodes && view.rootNodes.length>0 && view.rootNodes[0];
          if (root && root.get("id")===node.get("id")) {
            // clicking on the tree view root node opens the folder browser tab, in a workspace navigation.
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

      // register for navigate event to set view state at correct point in time
      this.listenTo(this.context.viewStateModel,'navigate',function(historyEntry){

        var wkspId = NavigateUtil.checkWorkspaceHierarchy(this.context).wkspid||0;
        // perhaps only set when this is true: historyEntry || viewState.getSessionViewState('wkspid')===undefined
        this.context.viewStateModel.setSessionViewState('wkspid', wkspId);

        var wkspModel = NavigateUtil.getWorkspaceModel(this.context);
        var wkspName = (wkspModel && wkspModel.get("id")===wkspId) ? wkspModel.get("name") : undefined;
        this.context.viewStateModel.setSessionViewState('wkspname', wkspName);
        this.context.viewStateModel.set('conwsNavigated', undefined);
      });
    },

    /**
     * Purposes of this override in conws:
     * 1. Maintain flags to determine from where navigation was triggered.
     * 2. Check whether to force a perspective change and return appropriate value.
     *
     * for 1.
     *
     * The flag "conwsNavigate" can be set before the navigation is triggered.
     * This is used for example by the conws goto.location extension or by the listener
     * for the "before:change:id" event in this file.
     * Because we cannot intercept ALL navigation steps BEFORE the navigation in order
     * to set (or reset) the flag, but onApply is called for each navigation step,
     * we can use this point in time to reset the "conwsNavigate" flag.
     * To make it usable for all other components we keep the value as "conwsNavigated" flag.
     *
     * for 2.
     *
     * With  the introduction of deferred tab loading it is faster to render one
     * tab and load its models than loading all models of a large full perspective.
     * On navigation to the same tab perspective, without interception, all models
     * would be loaded. We must prevent this here and force a "perspective change"
     * in this situation. Forcing a "perspective change" has the effect, that the
     * perspective is cleared and/or created newly from scratch thus and only the
     * models on the first displayed tab are loaded.
     *
     * In the other situation - when the target is a different perspective - the
     * navigation anyway forces a "perspective change". So we don't need
     * to handle that situation here.
     *
     * The perspective stored in sourceModel will be used for the navigated node.
     * However it can be changed by any other plugin later. So inspecting this, we
     * don't really know, whether the perspective will be a tabbed perspective or not.
     * Therefore and as we only need to prevent the case where the perspective stays
     * the same, we look at the previous perspective and if it is a tab perspective
     * we force a change if the next node is a different workspace than before.
     * Of course thereby we also force a change in the case, when the old perspective
     * is a tab perspective and the new is not. But this does no harm, as in that
     * case the standard navigation mechanism anyway forces a "perspective change".
     *
     * So to check whether to force a perspective change, we use the old perspective,
     * still available in context.perspective.
     *
     * @param {NodeModel} sourceModel the new node, to navigate to
     * @param {Boolean}   forceChange flag if "perspective change" is already forced
     */
    onApply: function (sourceModel, forceChange) {

      var context = this.context;
      if (context) {

        var oldHierarchy = NavigateUtil.checkWorkspaceHierarchy(context.getModel(NodeModelFactory)),
            newHierarchy = NavigateUtil.checkWorkspaceHierarchy(context.getModel(NextNodeModelFactory));
        var oldId = oldHierarchy.wkspid||0,
            newId = newHierarchy.wkspid||0;

        // get hint, where request comes from and save it in view state for later usage
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
            // we are about to leave or enter a workspace or to switch to another workspace:
            // check if to force/reject a perspective change

            // force if perspective change is not yet forced.
            if (!forceChange && hasContextTabbedPerspective(context)) {
              // there is no force yet on a tabbed perspective -> force change
              log.debug('Conws::onApply forcing change') && console.log(log.last);
              return {forceChange: true};
            }
          } else {
            // here we know, that we stay in the workspace.

            // reject if perspective change is forced.
            if (forceChange) {
              // there is a force, but we will stay in the same workspace -> reject change
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