/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/permission/permission.precheck.server.adaptor'
], function (module, _, $, Backbone, Url, ConnectableMixin, ServerAdaptorMixin) {
  'use strict';

  var PermissionPrecheckModel = Backbone.Model.extend({

    constructor: function PermissionPrecheckModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options = _.pick(options, ['connector']);
      this.makeConnectable(options);
    }
  });
  ConnectableMixin.mixin(PermissionPrecheckModel.prototype);
  ServerAdaptorMixin.mixin(PermissionPrecheckModel.prototype);

  return PermissionPrecheckModel;
});