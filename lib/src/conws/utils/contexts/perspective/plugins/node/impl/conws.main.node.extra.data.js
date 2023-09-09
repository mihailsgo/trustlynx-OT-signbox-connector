/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'conws/utils/commands/navigate/navigable'
], function (
  Navigable
) {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        bwsinfo: Navigable.isConwsNavigationTreeView() ? ["id","tree"] : ["id","up"]
      };
    },

    getModelExpand: function (options) {
      return {};
    },
    checkWorkspaceHierarchy: function( node ) {

      var result = {};
      var nodeid = node.get("id");
      if (node.get("type")===848) {
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
