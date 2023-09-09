/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
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
  function getWorkspaceObject(wkspCtxt, methodName, params) {

    var model;

    if (wkspCtxt.isWorkspaceSpecific(params[0])) {
      model = Context.prototype[methodName].apply(wkspCtxt, params);
    } else {
      model = wkspCtxt.options.context[methodName].apply(wkspCtxt.options.context, params);
    }

    return model;
  }
  var WorkspaceContextModel = Context.extend({
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
      this.options.node = this.options.context.getModel(NodeModelFactory);
      this.wkspid = getWorkspaceObject(this, "getModel", [WorkspaceContextNodeFactory, {
        creatorReference: privateReference,
        context: this.options.context,
        node: this.options.node,
        connector: this.options.node.connector
      }]);
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
        this.node.set(this.options.node.attributes);
        this._handleDelayedActions("wksp-create");
      }

      this.listenTo(this.options.node,"change:id",function() {
        var wkspid = this.checkWorkspaceHierarchy().wkspid;
        if (wkspid===this.options.node.get("id")) {
          log.debug("id-change propagate") && console.log(log.last);
          this.node.set(this.options.node.attributes);
          this._handleDelayedActions("id-change");
        } else {
          log.debug("id-change delay") && console.log(log.last);
        }
      });

      this.listenTo(this.options.node, 'change', function() {
        if (this.node.get("id") === this.options.node.get("id")) {
          if (!this.options.node.changed.hasOwnProperty("id")) {
            log.debug("node-change propagate") && console.log(log.last);
            this.node.set(this.options.node.changed);
          } else {
            log.debug("node-change skip") && console.log(log.last);
          }
        } else {
          log.debug("node-change ignore") && console.log(log.last);
        }
      });

      if (this.options.node.delayRestCommands) {
        this.listenTo(this.options.node, 'change:csuiDelayedActionsRetrieved', function() {
          this._handleDelayedActions("flag-change");
        });
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
        if (this.options.node.get('csuiDelayedActionsRetrieved')) {
          if (actionsDiffer(this.node.actions.models,this.options.node.actions.models)) {
            log.debug(where+"propagate actions") && console.log(log.last);
            this.node.actions.reset(this.options.node.actions.models);
            this.node.delayedActions.trigger('sync', this.node.delayedActions, {}, {});
          } else {
            log.debug(where+"skip actions") && console.log(log.last);
          }
        } else {
          log.debug(where+"delay actions") && console.log(log.last);
        }
      }
    },
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
    isWorkspaceSpecific: function (Factory) {
      var propertyPrefix = (typeof Factory === 'string') ? Factory : Factory.prototype.propertyPrefix;
      var found = false;
      if (this.workspaceSpecific[propertyPrefix]) {
        found = true;
      } else if (this._isWorkspaceSpecificFactory(Factory)) {
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
    fetch: function () {

      function fetchContext() {
        var promises = [], fetchNode = false, fetchFactories = false;
        var nodeid = this.node.get("id");
        var ctxtid = this.options.node.get("id");
        var wkspid = this.checkWorkspaceHierarchy().wkspid;

        log.debug("wksp check {0}, {1}, {2}, {3}.",wkspid,nodeid,ctxtid,this._fetchid) && console.log(log.last);
        if (this._fetchid!==wkspid) {
          this._fetchid = wkspid;
          fetchFactories = true;
        }
        if (wkspid!==nodeid) {
          if (wkspid) {
            if (wkspid!==ctxtid) {
              fetchNode = true;
              this.node.set("id",wkspid);
            } else {
              this.node.set(this.options.node.attributes);
              this._handleDelayedActions("wksp-fetch");
            }
          } else {
            this.node.clear();
          }
        } else {
          if (wkspid) {
            if (wkspid!==ctxtid) {
              fetchNode = true;
            }
          }
        }

        log.debug("wksp fetch {0}, {1}.",fetchNode,fetchFactories) && console.log(log.last);

        if (fetchNode) {
          promises.push(this.node.fetch());
        }
        if (fetchFactories) {
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
      if (factory.property===this.node || factory.property===this.wkspid) {
        return false;
      }
      return Context.prototype.isFetchable.call(this,factory);
    },
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
