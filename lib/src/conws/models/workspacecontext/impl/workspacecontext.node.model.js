/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['require', 'module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log',
  'csui/utils/url',
  'csui/models/resource',
  'csui/utils/contexts/factories/node',
  'conws/utils/contexts/perspective/plugins/node/impl/conws.main.node.extra.data'
], function (require, module, $, _, Backbone,
  Log,
  Url,
  ResourceModel,
  NodeModelFactory,
  ConwsMainNodeExtraData) {
  var WorkspaceContextModel;
  require([
    'conws/models/workspacecontext/workspacecontext.model'
  ],function(_WorkspaceContextModel){
    WorkspaceContextModel = _WorkspaceContextModel;
  });

  var log = new Log(module.id);
  function logDeprecated(name,stacktrace) {
    var message = "DEPRECATED: don't use 'workspacecontext.node.model' anymore. Depend " +
    "on 'conws/utils/navigate/navigate.util' as NavigateUtil and use " +
    "NavigateUtil.checkWorkspaceHierarchy(context) or " +
    "NavigateUtil.getWorkspaceModel(context).";
    if (name) {
      message += "\nCalled function: "+ name;
    }
    if (stacktrace) {
      message += "\n"+ stacktrace;
    }
    console.warn( message );
  }
  function deprecate(func,state,internal,reset,name) {
    return function() {
      var result, logged = state.logged;
      try {
        if (!logged) {
          if (!internal) {
            logDeprecated( name, log.getStackTrace(2) );
          }
          state.logged = true;
        }
        if (reset) {
          state.logged = false;
        }
        result = func.apply(this,arguments);
      } finally {
        state.logged = logged;
      }
      return result;
    };
  }
  function fill() {
    var logobj = {
      toString: function () {
        var str = "sync workspace id from ";
        str = str + node.get('id') + ", " + node.get('type') + ", " + node.get('volume_id');
        str = str + " -> " + ctxtWkspId;
        return str;
      }
    };

    var node = this.options.context.getModel(NodeModelFactory);
    var ctxtWkspId = ConwsMainNodeExtraData.checkWorkspaceHierarchy(node).wkspid;
    if (ctxtWkspId!==this.get("id")) {
      log.debug("Do {0}.", logobj) && console.log(log.last);
      if (ctxtWkspId) {
        this.set({ id: ctxtWkspId, type: 848 });
      } else {
        this.set({ id: undefined, type: undefined });
      }
    } else {
      log.debug("No need to {0}.", logobj) && console.log(log.last);
    }

    this._fetchSucceeded();
    return $.Deferred().resolve().promise();
  }

  var WorkspaceContextNode = Backbone.Model.extend(
    _.defaults({

      workspaceSpecific: true,

      constructor: function WorkspaceContextNode(attributes, options) {
        options || (options = {});

        var state = {};
        try {
          var reference;
          if (!WorkspaceContextModel) {
            delete options.workspaceReference;
          } else if (WorkspaceContextModel.isPrivateReference(options.creatorReference)) {
            reference = options.creatorReference;
            delete options.workspaceReference;
          }
          if (!reference) {
            logDeprecated( "constructor", log.getStackTrace(2) );
            state.logged = true;
          }

          Backbone.Model.prototype.constructor.call(this, attributes, options);

          this.options = options;

          this.makeResource(options);
          var sync = deprecate(fill,state,true,false);
          var syncToNode = deprecate(this.syncToNode,state,true,false);
          var flag = true;
          this.get = deprecate(this.get, state, flag, false, "get");
          this.set = deprecate(this.set, state, flag, false, "set");
          this.syncToNode = deprecate(this.syncToNode, state, false, false, "syncToNode");
          this.url = deprecate(this.url, state, false, false, "url");
          this.fetch = deprecate(this.fetch, state, flag, false, "fetch");
          this.parse = deprecate(this.parse, state, flag, false, "parse");
          this.trigger = deprecate(this.trigger, state, flag, true, "trigger");
          if (this.options.context) {
            this.listenTo(this.options.context.getModel(NodeModelFactory), 'change:id', sync);
            sync.call(this);

          } else {
            if (!state.logged) {
              logDeprecated( "constructor", log.getStackTrace(2) );
              state.logged = true;
            }

            this.listenTo(this.options.node, 'change:id', syncToNode);
            syncToNode.call(this);
          }
        } finally {
          state.logged = false;
        }
      },

      syncToNode: function() {
        var node = this.options.node;
        var node_id = node.get("id");
        if (node.get("type")===848) {
          this.set({id:node_id,type:848});
        }
      },

      url: function () {
        var nodeId = this.options.node.get('id');
        var url = Url.combine(this.options.connector.getConnectionUrl().getApiBase('v1'), 'nodes', nodeId,
            'businessworkspace'); // yes, we need to send a v1 call!!!
        return url;
      },

      fetch: function (options) {
        var logobj = {
          options: this.options,
          toString: function () {
            return "node:" + (this && this.options && this.options.node && this.options.node.get('id'));
          }
        };

        if (this.options.node.get('type')!==848) {
          log.debug("Fetching the workspace id for {0} from server.", logobj) && console.log(log.last);
          options || (options = {});
          if (!options.url) {
            options.url = _.result(this, 'url');
          }
          return this.Fetchable.fetch.call(this, options);
        } else {
          log.debug("Fetching the workspace id for {0} from node.", logobj) && console.log(log.last);
          this.set({id:this.options.node.get('id'),type:848});
          return $.Deferred().resolve().promise();
        }
      },

      parse: function (response) {
        return {id:response.id,type:response.type};
      }

    }, ResourceModel(Backbone.Model)));

  return WorkspaceContextNode;

});
