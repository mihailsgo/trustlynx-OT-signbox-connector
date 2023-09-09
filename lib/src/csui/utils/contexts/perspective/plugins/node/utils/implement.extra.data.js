/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data'
], function (mergeExtraData) {
  'use strict';
  return function implementExtraData(extraNodeData) {
    return {
      getModelFields: function (options) {
        if (!extraNodeData) {
          return {};
        }
        var objects = extraNodeData.map(function (nodeData) {
          return nodeData.getModelFields && nodeData.getModelFields(options);
        });
        return mergeExtraData(objects);
      },

      getModelExpand: function (options) {
        if (!extraNodeData) {
          return {};
        }
        var objects = extraNodeData.map(function (nodeData) {
          return nodeData.getModelExpand && nodeData.getModelExpand(options);
        });
        return mergeExtraData(objects);
      }
    };
  };
});
