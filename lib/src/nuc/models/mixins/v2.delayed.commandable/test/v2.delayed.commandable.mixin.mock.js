/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/jquery.mockjax', 'nuc/lib/jquery.parse.param'
], function (mockjax, parseParams) {
  'use strict';

  var mocks = [];

  return {
    enable: function () {
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/2000(?:\\?(.*))?$'),
        urlParams: ['query'],
        response: function (settings) {
          var parameters = parseParams(settings.urlParams.query);
          var actions = parameters.actions;
          actions = (Array.isArray(actions) ? actions: [actions])
            .map(function (action) {
              return { signature: action };
            });
          this.responseText = { id: 2000, actions: actions };
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/actions'),
        type: 'POST',
        response: function (settings) {
          var body = JSON.parse(settings.data.body);
          var id = body.ids[0];
          var actions = body.actions;
          var data = (Array.isArray(actions) ? actions: [actions])
            .reduce(function (result, signature) {
              result[signature] = {};
              return result;
            }, {});
          var results = {};
          results[id.toString()] = { data: data, map: {}, order: {} };
          this.responseText = { results: results };
        }
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }
  };
});
