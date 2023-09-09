/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/jquery.mockjax'
], function (mockjax) {
  'use strict';

  var mocks = [];
  return {
    enable: function () {
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/2000/addablenodetypes(?:\\?(.*))?$'),
        responseText: {
          data: {
            folder: 'api/v1/forms/nodes/create?type=0&parent_id=2000',
            document: 'api/v1/forms/nodes/create?type=144&parent_id=2000'
          },
          definitions: {
            folder: {
              name: 'Folder',
              type: 0
            },
            document: {
              name: 'Document',
              type: 144
            },
            definitions_order: ['document', 'folder']
          }
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
