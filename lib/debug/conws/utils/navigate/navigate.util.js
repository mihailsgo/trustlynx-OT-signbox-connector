csui.define([ 'require', 'csui/lib/underscore', 'csui/utils/contexts/context',
  'csui-ext!conws/utils/commands/navigate/workspace',
  'conws/utils/contexts/perspective/plugins/node/impl/conws.main.node.extra.data',
  'conws/utils/commands/navigate/navigable'
], function ( require, _, Context,
  NavigateExtensions,
  ConwsMainNodeExtraData,
  Navigable ) {

  'use strict';

  var NavigateUtil = {

    /**
     * checks, which navigation elements are activated according the user's preferences.
     *
     * returns an object with
     *
     * treeView: true, if the tree view enabled according the user's preferences.
     * navigateUp: true, if the navigateUp button is enabled according the user's preferences.
     *
     * Both returned flags (treeView and navigateUp) are derived from the boolean flag in the
     * user's preferences: conwsNavigationTreeView = false(default)|true.
     * The requirement to enable only one of these elements, never both, is ensured by this method.
     * However, the result from the user settings is passed to the navigate workspace extension,
     * so it can override the settings and set an arbitrary combination of the flags.
     *
     * @param {*} status as passed to command.enabled()
     * @param {*} options as passed to command.enabled()
     */
    checkWorkspaceNavigation: function( status, options ) {
      var conwsNavigationTreeView = Navigable.isConwsNavigationTreeView();
      var elements = { treeView: conwsNavigationTreeView, navigateUp: !conwsNavigationTreeView };
      var keys = _.keys(elements);

      if (NavigateExtensions) {
        for (var ii=0; ii<NavigateExtensions.length; ii++) {
          var extension = NavigateExtensions[ii];
          if (extension.checkNodesTableToolbarElements) {
            var extended = extension.checkNodesTableToolbarElements(status, options, _.pick(elements,keys));
            if (extended) {
              _.each(_.pick(extended,keys),function(val,key){
                if (val===false||val===true) {
                  elements[key] = val;
                }
              });
              break;
            }
          }
        }
      }

      return elements;
    },

    /**
     * checks, whether an extension is plugged in, calls it passing status and options.
     * returns an object with:
     * navigation: true if extension doesn't care or explicitly wants to enable the workspace navigation.
     * navigation: false if extension explicitly wants to disable the workspace navigation.
     *
     * @param {*} status as passed to command.enabled()
     * @param {*} options as passed to command.enabled()
     */
    checkNavigationExtension: function( status, options ) {
      var proceed = true;
      // check for an extension, that wants to enable|disable the navigation buttons in specific situations.
      var enabled;
      if (NavigateExtensions) {
        for (var ii=0; ii<NavigateExtensions.length; ii++) {
          var extension = NavigateExtensions[ii];
          if (extension.isWorkspaceNavigationEnabled) {
            enabled = extension.isWorkspaceNavigationEnabled(status, options);
            if (enabled===false||enabled===true) {
              proceed = enabled;
              break;
            }
          }
        }
      }
      return { navigation: proceed };
    },

    getNavigationContext: function(context) {

      if (context && context.options && context.options.context) {
        return context.options.context;
      }

      return context;
    },

    getWorkspaceContext: function(context) {

      var result;
      if (context && context.options && context.options.context) {
        result = context;
      } else if (context.hasObject("workspaceContext")) {
        result = context.getObject("workspaceContext");
      }
      return result;
    },

    /**
     * input param can be a node or a context.
     * check where navigation is in the workspace hierarchy.
     * returns an object with:
     * level<0: outside workspace.
     * level=0: in workspace root.
     * level>0: somewhere in the hierarchy below a workspace.
     * wkspid: the workspace id in case of level >= 0.
     * delivers both properties (level and wkspid) undefined if node does not contain bwsinfo data.
     *
     * @param {*} obj a context or a node
     */
    checkWorkspaceHierarchy: function( obj ) {

      var result;
      var node;
      if (obj instanceof Context) {
        var workspaceContext = this.getWorkspaceContext(obj);
        if (workspaceContext) {
          result = workspaceContext.checkWorkspaceHierarchy();
        } else if (obj.hasModel("node")) {
          node = obj.getModel("node");
        }
      } else {
        node = obj;
      }
      if (node) {
        result = ConwsMainNodeExtraData.checkWorkspaceHierarchy(node);
      }
      return result||{};
    },

    /**
     * returns the node model for the current workspace
     * returns undefined outside a workspace.
     *
     * @param {*} context the navigation context
     */
    getWorkspaceModel: function( context ) {

      var result;
      if (this.checkWorkspaceHierarchy(context).level>=0) {
        var workspaceContext = this.getWorkspaceContext(context);
        if (workspaceContext && workspaceContext.hasObject("node")) {
          result = this.getWorkspaceContext(context).getModel("node");
        }
      }
      return result;
    }

  };

  return NavigateUtil;
});