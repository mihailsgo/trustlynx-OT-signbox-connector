csui.define([
  'conws/utils/commands/navigate/navigable'
], function (
  Navigable
) {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        // see also note in navigate.workspace.md
        bwsinfo: Navigable.isConwsNavigationTreeView() ? ["id","tree"] : ["id","up"]
      };
    },

    getModelExpand: function (options) {
      return {};
    },

    /**
     * check workspace hierarchy in given node.
     * returns an object with:
     * level<0: outside workspace.
     * level=0: in workspace root.
     * level>0: somewhere in the hierarchy below a workspace.
     * wkspid: the workspace id in case of level >= 0.
     * wkspid=null: in case of level<0.
     * delivers both properties (level and wkspid) undefined if node does not contain bwsinfo data.
     *
     * @param {*} node a node where the extra data is contained
     */
    checkWorkspaceHierarchy: function( node ) {

      var result = {};
      var nodeid = node.get("id");
      if (node.get("type")===848) {
        // in any case take a node with type 848 as the top workspace.
        // this works even if the bwsinfo data was not sent by the server.
        // also this is a concession to the javascript unit tests and all
        // scenarios, where a workspace node is being constructed on the client.
        result.level = 0;
        result.wkspid = nodeid;
      } else {
        var data = node.get('data');
        if (data && data.bwsinfo) {
          var bwsinfo = data.bwsinfo;
          if (bwsinfo.id) {
            result.wkspid = bwsinfo.id;
            if (bwsinfo.id===nodeid) {
              result.level = 0;
            } else {
              result.level = 1;
            }
          } else {
            result.wkspid = null;
            result.level= -1;
          }
        }
      }
      return result;
    },

    /**
     *  Get data from the bwsinfo in a node.
     *
     * @param {*} node a node where the extra data is contained
     * @param {*} name the name of the data field
     * @returns value of the requested data part
     */
     getBwsInfo: function( node, name ) {

      var result, data = node.get('data');
      if (data) {
        if (name) {
          result = data.bwsinfo ? data.bwsinfo[name] : undefined;
        } else {
          result = data.bwsinfo;
        }
      }
      return result;
    }

  };

});
