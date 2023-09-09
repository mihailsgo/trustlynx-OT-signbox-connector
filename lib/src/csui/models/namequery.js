/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/namequery/server.adaptor.mixin'
], function (module, $, _, Backbone,
    ConnectableMixin, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    filesPerQuery: 10
  });

  var NameQuery = Backbone.Model.extend({

    constructor: function NameQuery(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.conflictFiles = [];
      this.cleanFiles = [];
      this.config = config;

      this.makeConnectable(options)
          .makeUploadable(options);
    }
  });

  UploadableMixin.mixin(NameQuery.prototype);
  ConnectableMixin.mixin(NameQuery.prototype);
  ServerAdaptorMixin.mixin(NameQuery.prototype);

  return NameQuery;

});
