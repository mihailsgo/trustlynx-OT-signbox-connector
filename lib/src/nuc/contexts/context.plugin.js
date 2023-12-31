/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/lib/backbone'
], function (_, Backbone) {
  'use strict';

  function ContextPlugin(options) {
    this.cid = _.uniqueId('contextPlugin');
    this.context = options.context;
  }

  _.extend(ContextPlugin.prototype, Backbone.Events, {
    isFetchable: function (factory) {}
  });

  ContextPlugin.extend = Backbone.Model.extend;

  return ContextPlugin;
});
