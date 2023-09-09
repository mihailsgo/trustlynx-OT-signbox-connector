/**
 * Created by stefang on 24.11.2015.
 */
csui.define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  "csui/utils/log",
  'csui/utils/contexts/context',
  'csui/utils/commands',
  'csui/utils/defaultactionitems',
  'csui/utils/contexts/factories/node',
  'conws/models/workspacecontext/impl/workspacecontext.node.factory',
  'conws/utils/contexts/perspective/plugins/node/impl/conws.main.node.extra.data'
], function (module, $, _, Backbone,
    Log,
    Context,
    commands,
    defaultActionItems,
    NodeModelFactory,
    WorkspaceContextNodeFactory,
    ConwsMainNodeExtraData) {

  var log = new Log(module.id);

  /**
   * local helper method to get an object silently without deprecation warning.
   *
   * @param {*} wkspCtxt
   * @param {*} methodName
   * @param {*} params
   */
  function getWorkspaceObject(wkspCtxt, methodName, params) {

    var model;

    if (wkspCtxt.isWorkspaceSpecific(params[0])) {
      model = Context.prototype[methodName].apply(wkspCtxt, params);
    } else {
      model = wkspCtxt.options.context[methodName].apply(wkspCtxt.options.context, params);
    }

    return model;
  }

  /**
   * A workspace context provides functionality to manage workspace specific data.
   *
   * A workspace context is similar to a navigation context.
   * The main (or even only?) purpose of a navigation context ({@link 'csui/utils/contexts/context'})
   * is to fetch its associated objects during a navigation step, i.e. when the current
   * navigation location is changed.
   * The task of the workspace context is also to fetch its associated objects at such
   * a navigation step, but to do this for workspace specific objects only if the previous
   * and new nodes are associated to a different workspace node (called workspace navigation
   * step).
   *
   * A navigation node is considered as associated to a workspace node if it is the
   * workspace node itself or if it is located below a workspace node and no other
   * workspace node is in between.
   *
   * Similar to the node model representing the current navigation node, which is
   * provided by the navigation context, the workspace context provides a node model
   * representing the workspace node.
   *
   * A workspace context provides the same interface as navigation context ({@link 'csui/utils/contexts/context'})
   * plus one additional method {@link setWorkspaceSpecific} to let the workspace
   * context know that it has to treat an object as a workspace specific object.
   * A workspace specific object is stored in the workspace context itself whereas
   * all other objects are stored in the associated navigation context.
   *
   * Usage example:
   *
   * require 'conws/models/workspacecontext/workspacecontext.factory' as WorkspaceContextFactory
   *
   * var wkspContext, myWkspInfo, myNaviInfo;
   *
   * wkspContext = context.get(WorkspaceContextFactory);
   * wkspContext.setWorkspaceSpecific(MyWkspInfoModelFactory);
   * myWkspInfo = wkspContext.getModel(MyWkspInfoModelFactory);
   * myNaviInfo = wkspContext.getModel(MyNaviInfoModelFactory);
   *
   * After above code myWkspInfo represents a model fetched only in a workspace
   * navigation step while myNaviInfo is fetched in any navigation step.
   */
  var WorkspaceContextModel = Context.extend({

    /**
     * @deprecated
     *
     * instead of wkspContext.wkspid require 'conws/utils/navigate/navigate.util' as
     * NavigateUtil and use NavigateUtil.checkWorkspaceHierarchy(wkspContext) or
     * NavigateUtil.getWorkspaceModel(wkspContext).
     */
    wkspid: undefined,

    constructor: function WorkspaceContextModel(attributes, options) {
      options || (options = {});

      Context.prototype.constructor.apply(this, arguments);

      this.options = options;

      this.workspaceSpecific = {};
      this.workspaceSpecific[NodeModelFactory.prototype.propertyPrefix] = true;
      this.workspaceSpecific[WorkspaceContextNodeFactory.prototype.propertyPrefix] = true;

      this.workspaceSpecificFactories = [
        NodeModelFactory,
        WorkspaceContextNodeFactory
      ];

      // get the navigation node, that triggers the workspace node
      this.options.node = this.options.context.getModel(NodeModelFactory);

      // set wkspid model for compatibility only. we don't use it anymore.
      this.wkspid = getWorkspaceObject(this, "getModel", [WorkspaceContextNodeFactory, {
        creatorReference: privateReference,
        context: this.options.context,
        node: this.options.node,
        connector: this.options.node.connector
      }]);

      // and provide a workspace node, for compatibility with the outer context
      this.node = this.getModel(NodeModelFactory, {
        node: {
          options: {
            delayRestCommands: true,
            promoteSomeRestCommands: false,
            defaultActionCommands: defaultActionItems.getAllCommandSignatures(commands),
            commands: commands.getAllSignatures()
          }
        }
      });

      log.debug("wksp create {0}",this.options.node.get("type")) && console.log(log.last);
      if (this.options.node.get("type")===848) {
        // initialize node with all available attributes
        this.node.set(this.options.node.attributes);
        this._handleDelayedActions("wksp-create");
      }

      this.listenTo(this.options.node,"change:id",function() {
        var wkspid = this.checkWorkspaceHierarchy().wkspid;
        // navigation step in process wherever it is: to/from a workspace and to/from anywhere else.
        if (wkspid===this.options.node.get("id")) {
          // workspace is the navigation node.
          // independently whether we were in the same workspace before or anywhere else, set attributes
          // to reflect potential changes in workspace node and to let name in header view
          // and tree view be in sync with name in navigate-up button and bread-crumb.
          // Note: This case might occur also if we are outside a workspace and the navigation node
          // has no id. If this is a valid case for a navigation node at all, then it is valid for
          // a workspace node as well. And if not, then any stable code is good enough.
          // And: even if the navigation node has no id, views should render smoothly in this case.
          log.debug("id-change propagate") && console.log(log.last);
          this.node.set(this.options.node.attributes);
          this._handleDelayedActions("id-change");
        } else {
          // this case is handled in fetch method.
          log.debug("id-change delay") && console.log(log.last);
        }
      });

      this.listenTo(this.options.node, 'change', function() {
        if (this.node.get("id") === this.options.node.get("id")) {
          if (!this.options.node.changed.hasOwnProperty("id")) {
            log.debug("node-change propagate") && console.log(log.last);
            // only propagate changed attributes, otherwise we would generate disturbing changes
            this.node.set(this.options.node.changed);
          } else {
            // already processed in "change:id" handler
            log.debug("node-change skip") && console.log(log.last);
          }
        } else {
          log.debug("node-change ignore") && console.log(log.last);
        }
      });

      if (this.options.node.delayRestCommands) {
        // The boolean flag indicates the readiness of node.actions after fetching in delayed mode.
        this.listenTo(this.options.node, 'change:csuiDelayedActionsRetrieved', function() {
          this._handleDelayedActions("flag-change");
        });
        // Watching for the flag is not enough, if the workspace is entered indirectly,
        // by following a shortcut to a sub-folder or jumping directly into a sub-folder.
        this.listenTo(this.options.node.actions, 'reset', function() {
          this._handleDelayedActions("actions-reset");
        });
      }
    },

    _handleDelayedActions: function(where) {
      function actionsDiffer(actions1,actions2) {
        if (actions1.length!==actions2.length) {
          return true;
        }
        for (var ii = 0; ii<actions1.length; ii++) {
          if (actions1[ii].get("signature")!==actions2[ii].get("signature")) {
            return true;
          }
        }
        return false;
      }

      if (this.options.node.delayRestCommands && this.node.get("id") === this.options.node.get("id")) {
        where = where ? where+" " : "";
        // If the flag is true node.actions are complete after fetching in delayed mode.
        if (this.options.node.get('csuiDelayedActionsRetrieved')) {
          // to avoid flickering propagate actions only if they really differ
          if (actionsDiffer(this.node.actions.models,this.options.node.actions.models)) {
            log.debug(where+"propagate actions") && console.log(log.last);
            // Actions on the workspace node got fetched in the delayed mode.
            this.node.actions.reset(this.options.node.actions.models);
            // The delayed-actions event is relayed because toolbars
            // in some widget may listen to the workspace node.
            this.node.delayedActions.trigger('sync', this.node.delayedActions, {}, {});
          } else {
            log.debug(where+"skip actions") && console.log(log.last);
          }
        } else {
          log.debug(where+"delay actions") && console.log(log.last);
        }
      }
    },

    /**
     * declare a factory to be handled as workspace specific.
     *
     * A workspace specific factory (thus its object and model) is fetched in a navigation
     * step only if the previous and new nodes are associated to a different workspace node.
     *
     * @param {*} Factory
     */
    setWorkspaceSpecific: function(Factory) {
      if (typeof Factory === 'string') {
        this.workspaceSpecific[Factory] = true;
      } else {
        this.workspaceSpecific[Factory.prototype.propertyPrefix] = true;
        if (!this._isWorkspaceSpecificFactory(Factory)) {
          this.workspaceSpecificFactories.push(Factory);
        }

      }
    },

    /**
     * check, whether a factory is workspace specific.
     *
     * @param {*} Factory
     */
    isWorkspaceSpecific: function (Factory) {
      var propertyPrefix = (typeof Factory === 'string') ? Factory : Factory.prototype.propertyPrefix;
      var found = false;
      if (this.workspaceSpecific[propertyPrefix]) {
        found = true;
      } else if (this._isWorkspaceSpecificFactory(Factory)) {
        // remember property prefix, so we find it faster next time.
        this.workspaceSpecific[propertyPrefix] = true;
        found = true;
      }
      return found;
    },

    _isWorkspaceSpecificFactory: function (Factory) {
      var ii, found = false;
      if (typeof Factory === 'string') {
        for (ii=0; ii<this.workspaceSpecificFactories.length; ii++) {
          if (this.workspaceSpecificFactories[ii].prototype.propertyPrefix===Factory) {
            found = true;
            break;
          }
        }
      } else {
        for (ii=0; ii<this.workspaceSpecificFactories.length; ii++) {
          if (this.workspaceSpecificFactories[ii]===Factory) {
            found = true;
            break;
          }
        }
      }
      return found;
    },

    /**
     * @deprecated
     *
     * instead of wkspContext.getOuterContext() require 'conws/utils/navigate/navigate.util'
     * as NavigateUtil and use NavigateUtil.getNavigationContext(wkspContext).
     */
    getOuterContext: function () {
      console.warn(
        "DEPRECATED: instead of wkspContext.getOuterContext() require 'conws/utils/navigate/navigate.util " +
        "as NavigateUtil and use NavigateUtil.getNavigationContext(wkspContext)."
      );
      return this.options.context;
    },

    getModel: function () { return this._getWorkspaceObject("getModel", arguments); },
    getCollection: function () { return this._getWorkspaceObject("getCollection", arguments); },
    getObject: function () { return this._getWorkspaceObject("getObject", arguments); },

    _getWorkspaceObject: function (methodName, params) {

      function isa(a,b) {
        if (typeof a === 'string') {
          return a===b.prototype.propertyPrefix;
        } else {
          return a===b;
        }
      }

      var factory = params[0];
      if (isa(factory,WorkspaceContextNodeFactory)) {
        console.warn(
          "DEPRECATED: don't use 'workspacecontext.node.factory' anymore. Depend " +
          "on 'conws/utils/navigate/navigate.util' as NavigateUtil and use " +
          "NavigateUtil.checkWorkspaceHierarchy(context) or " +
          "NavigateUtil.getWorkspaceModel(context)." +
          log.getStackTrace(3)
        );
      }

      return getWorkspaceObject(this,methodName,params);
    },

    /**
     * fetch the models in the workspace.
     *
     */
    fetch: function () {

      function fetchContext() {
        var promises = [], fetchNode = false, fetchFactories = false;
        var nodeid = this.node.get("id");
        var ctxtid = this.options.node.get("id");
        var wkspid = this.checkWorkspaceHierarchy().wkspid;

        log.debug("wksp check {0}, {1}, {2}, {3}.",wkspid,nodeid,ctxtid,this._fetchid) && console.log(log.last);

        // do fetch of registered factories only if workspace id of last fetch is different.
        if (this._fetchid!==wkspid) {
          this._fetchid = wkspid;
          fetchFactories = true;
        }

        // check if we have to fetch the workspace node
        // or copy the attributes from the navigation node
        // or do nothing regarding the workspace node.
        if (wkspid!==nodeid) {
          if (wkspid) {
            if (wkspid!==ctxtid) {
              // navigating somewhere in the workspace hierarchy while node is still set with
              // anything else. set node id and fetch node.
              fetchNode = true;
              this.node.set("id",wkspid);
            } else {
              // navigating directly into a workspace while node is still set with anything else.
              // set node attributes. don't fetch node.
              this.node.set(this.options.node.attributes);
              this._handleDelayedActions("wksp-fetch");
            }
          } else {
            // navigating away from a workspace and still some objects request a workspace model.
            // but there is none. Clear node to have an empty model with no id.
            // Views connected to that model should render smoothly in this case.
            this.node.clear();
          }
        } else {
          if (wkspid) {
            if (wkspid!==ctxtid) {
              // navigation step somewhere in the same workspace hierarchy. fetch node to
              // reflect potential changes in workspace node and to let name in header view
              // and tree view be in sync with name in navigate-up button and bread-crumb.
              fetchNode = true;
            }
            // the else case (wkspid===ctxtid): is already handled in "change:id" handler.
            // don't change the node here anymore.
          }
          // the else case (!wkspid) is: navigating around outside a workspace
          // and still some objects request a workspace model.
          // But there is none and node already has no id. so no need to change the node.
        }

        log.debug("wksp fetch {0}, {1}.",fetchNode,fetchFactories) && console.log(log.last);

        if (fetchNode) {
          // for compatibility with past implementation do not pass options to the fetch method.
          promises.push(this.node.fetch());
        }
        if (fetchFactories) {
          // for compatibility with past implementation do not pass options to the fetch method.
          promises = promises.concat(Context.prototype.fetch.call(this));
        }

        if (promises.length) {
          return $.when.apply($,promises);
        } else {
          return $.Deferred().resolve().promise();
        }
      }

      function fetchWkspid() {
        if (ConwsMainNodeExtraData.checkWorkspaceHierarchy(this.options.node).wkspid===undefined) {
          return this.wkspid.fetch().then(_.bind(function(){
            return fetchContext.call(this);
          },this));
        } else {
          return fetchContext.call(this);
        }
      }

      if (this.options.node.fetching) {
        return this.options.node.fetching.then(_.bind(function(){
          return fetchWkspid.call(this);
        },this));
      } else {
        return fetchWkspid.call(this);
      }
    },

    isFetchable: function (factory) {
      // never fetch workspace node and workspace context node together with the other factories.
      // if at all, then they are explicitly fetched in the fetch method itself.
      if (factory.property===this.node || factory.property===this.wkspid) {
        return false;
      }
      return Context.prototype.isFetchable.call(this,factory);
    },

    /**
     * check where we are in a workspace hierarchy.
     * returns an object with:
     * level<0: outside workspace.
     * level=0: in workspace root.
     * level>0: somewhere in the hierarchy below a workspace.
     * wkspid: the workspace id in case of level >= 0.
     * wkspid=null: in case of level<0.
     * delivers both properties (level and wkspid) undefined
     * if this.options.node does not contain bwsinfo data and
     * this.wkspid also contains undefined as workspace id.
     */
    checkWorkspaceHierarchy: function() {
      var node = this.options.node;
      var result = ConwsMainNodeExtraData.checkWorkspaceHierarchy(node);
      if (result.wkspid===undefined) {
        var wkspid = this.wkspid.get("id");
        if (wkspid!==undefined) {
          result.wkspid = wkspid;
          if (wkspid) {
            if (wkspid===node.get("id")) {
              result.level = 0;
            } else {
              result.level = 1;
            }
          } else {
            result.level= -1;
          }
        }
      }
      return result;
    }

  });

  var privateReference = {};
  WorkspaceContextModel.isPrivateReference = function (key) {
    return key===privateReference;
  }
  return WorkspaceContextModel;

});
