/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

csui.define([
  'csui/lib/jquery',
  'csui/lib/backbone'
], function ($, Backbone) {
    return {
        navigate: function (node, options) {
          var context = options.context;
          if (context && context.forceFail) {
            return $.Deferred().reject().promise();
          }

          var extensionNodeId = 5000;
          var nextNode = options.context.getModel('nextNode');
          nextNode.set('id', extensionNodeId);
          return $.Deferred().resolve().promise();
        }
    };
});
