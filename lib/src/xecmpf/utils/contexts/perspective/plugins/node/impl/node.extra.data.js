/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([], function () {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        external_source: [],
        bwsinfo: ['up'],
        showworkflowicon: '',
      };
    },

    getModelExpand: function (options) {
      return {};
    }
  };

});