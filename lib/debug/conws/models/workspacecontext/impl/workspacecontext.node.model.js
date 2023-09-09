// Fetches the workspace id of the effective businessworkspace for a given node.
csui.define(['require', 'module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
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

  // need WorkspaceContextModel to determine, whether to issue a deprecated message in constructor.
  // must require it dynamically as static require would lead to cycle.
  var WorkspaceContextModel;
  require([
    'conws/models/workspacecontext/workspacecontext.model'
  ],function(_WorkspaceContextModel){
    WorkspaceContextModel = _WorkspaceContextModel;
  });

  var log = new Log(module.id);

  /**
   * just log deprecated message.
   * @param {*} name
   */
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

  /**
   * wrap a function and return the wrapping function that logs a deprecated
   * warning and then calls the original function passing all arguments.
   * As functions might be called multiple times or recursively during the
   * same call stack, it might be that the call is a consequence of a previous
   * call on the stack where a message was already logged and thus this one should
   * not be logged. To determine that, the wrapping function keeps track in the flag
   * 'state.logged': true -> already logged, false -> nothing logged yet.
   *
   * @param {function} func function to wrap
   * @param {object} state object to store deprecated flag
   * @param {boolean} internal if true, don't log message as no message is wanted in
   * an internal call. Note: also for internal calls 'state.logged' is set to true so
   * also in internal calls no message is logged in subsequent calls of the call chain.
   * @param {boolean} reset if true, start a new call chain: i.e. set the
   * 'state.logged' flag to false just before calling the wrapped method.
   * @param {string} name function name used for log message
   *
   * returns the wrapping function.
   */
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

  /**
   * fill the attributes of the model using the context node
   */
  function fill() {
    var logobj = {
      toString: function () {
        // Format a string for logging purposes
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

          // log deprecated warning if constructor is not called by WorkspaceContextModel
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

          // in "internal" functions allow calls of deprecated functions.
          var sync = deprecate(fill,state,true,false);
          var syncToNode = deprecate(this.syncToNode,state,true,false);
          // prepare some methods to issue a deprecated warning, but only when called from outside.
          // set "flag" to false, if LPAD-92235 is resolved and we can deprecate usage of this model.
          var flag = true;
          this.get = deprecate(this.get, state, flag, false, "get");
          this.set = deprecate(this.set, state, flag, false, "set");
          this.syncToNode = deprecate(this.syncToNode, state, false, false, "syncToNode");
          this.url = deprecate(this.url, state, false, false, "url");
          this.fetch = deprecate(this.fetch, state, flag, false, "fetch");
          this.parse = deprecate(this.parse, state, flag, false, "parse");
          this.trigger = deprecate(this.trigger, state, flag, true, "trigger");

          // if we have access to the navigation context
          if (this.options.context) {

            // new style construction
            this.listenTo(this.options.context.getModel(NodeModelFactory), 'change:id', sync);

            // and initially set id if it fits.
            sync.call(this);

          } else {

            // old style construction. log deprecated, if needed.
            if (!state.logged) {
              logDeprecated( "constructor", log.getStackTrace(2) );
              state.logged = true;
            }

            this.listenTo(this.options.node, 'change:id', syncToNode);

            // and initially set id if it fits.
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
        // URLs like /nodes/:id/blablabla
        //var url = this.node.urlBase() + '/blablabla';
        // Alternative for URLs like /businessworkspace/:id
        var url = Url.combine(this.options.connector.getConnectionUrl().getApiBase('v1'), 'nodes', nodeId,
            'businessworkspace'); // yes, we need to send a v1 call!!!
        return url;
      },

      fetch: function (options) {
        var logobj = {
          options: this.options,
          toString: function () {
            // Format a string for logging purposes
            return "node:" + (this && this.options && this.options.node && this.options.node.get('id'));
          }
        };

        if (this.options.node.get('type')!==848) {
          log.debug("Fetching the workspace id for {0} from server.", logobj) && console.log(log.last);
          options || (options = {});
          // If not overridden, Use the v1 URL for GET requests
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
