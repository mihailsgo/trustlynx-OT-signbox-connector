/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'require', 'csui/lib/underscore', 'csui/utils/contexts/context',
  'csui-ext!conws/utils/commands/navigate/workspace',
  'conws/utils/contexts/perspective/plugins/node/impl/conws.main.node.extra.data',
  'conws/utils/commands/navigate/navigable'
], function ( require, _, Context,
  NavigateExtensions,
  ConwsMainNodeExtraData,
  Navigable ) {

  'use strict';

  var NavigateUtil = {
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
    checkNavigationExtension: function( status, options ) {
      var proceed = true;
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