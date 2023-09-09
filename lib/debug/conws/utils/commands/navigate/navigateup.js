csui.define(['require', 'module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/log',
  'csui/models/command',
  'conws/utils/navigate/navigate.util',
  'conws/utils/contexts/perspective/plugins/node/impl/conws.main.node.extra.data',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (require, module, $, _, Log,
    CommandModel,
    NavigateUtil,
    ConwsMainNodeExtraData,
    lang) {

  'use strict';

  var log = new Log( module.id );
  var config = module.config();

  var NavigateUpCommand = CommandModel.extend({

    defaults:{
      signature: 'ConwsNavigateUp',
      name: lang.CommandNameNavigateUp
    },

    /**
     * return true, if:
     * - navigation is set to use navigate-up button
     * - is below workspace
     * - no extension does intercept
     *
     * @param {*} status
     * @param {*} options
     */
    enabled: function(status,options) {

      var isEnabled = false;
      if (config.enabled!==false) {
        if (NavigateUtil.checkWorkspaceNavigation(status,options).navigateUp) {
          if (NavigateUtil.checkWorkspaceHierarchy(status.context).level>0) {
            if (status.context.hasModel("node")) {
              var node = status.context.getModel("node");
              if (ConwsMainNodeExtraData.getBwsInfo(node,"up")) {
                isEnabled = NavigateUtil.checkNavigationExtension(status,options).navigation;
              }
            }
          }
        }
      }
      return isEnabled;
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      if (status) {
        status.suppressSuccessMessage = true;
      }
      require([
        'csui/utils/contexts/factories/next.node',
        'csui/utils/contexts/factories/node'
      ], function (NextNodeModelFactory,NodeModelFactory) {
        var context = status && status.context;
        var nextnode = context && context.getModel(NextNodeModelFactory);
        var commandData = status.toolItem && status.toolItem.get("commandData");
        var targetid;
        if (commandData && commandData.nodeid) {
          targetid = commandData.nodeid;
        } else {
          // take targetid from contextual node to be consistent with enabled-function.
          // note: taking the parent_id in case of a subfolder directly in a workspace
          // is correct, as it is really the workspace id and not the (negative) volume id.
          targetid = context.getModel(NodeModelFactory).get("parent_id");
        }
        if (targetid && nextnode) {
          log.debug("navigate to target id {0}",targetid) && console.log(log.last);
          context.viewStateModel && context.viewStateModel.set('conwsNavigate','gotoLocation');
          nextnode.set("id",targetid);
          deferred.resolve(targetid);
        } else {
          deferred.resolve();
        }
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise();
    }
  });

  return NavigateUpCommand;
});
