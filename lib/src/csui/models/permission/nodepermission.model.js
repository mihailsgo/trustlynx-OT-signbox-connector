/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/permission/permission.action.server.adaptor.mixin'
], function (module, _, $, Backbone, Url, ConnectableMixin, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var NodePermissionModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    defaults: {
      "addEmptyAttribute": true
    },

    constructor: function NodePermissionModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options = _.pick(options, ['connector']);
      this.makeConnectable(options)
          .makeUploadable(options);
    },

    isNew: function () {
      return !this.get('type') || !(this.has('right_id') || this.get('type') === 'public');
    }

  }, {
    getPermissionLevel: getPermissionLevel,
    getReadPermissions: ServerAdaptorMixin.getReadPermissions,
    getWritePermissions: ServerAdaptorMixin.getWritePermissions,
    getFullControlPermissions: ServerAdaptorMixin.getFullControlPermissions,
    getPermissionsByLevelExceptCustom: ServerAdaptorMixin.getPermissionsByLevelExceptCustom
  });

  function getPermissionLevel () {
    return ServerAdaptorMixin.getPermissionLevel(this.get("permissions"),
        this.collection.isContainer, this.collection.options.node &&
                                     this.collection.options.node.get('advanced_versioning'),
        this.collection.options.node, this);
  }

  NodePermissionModel.prototype.PERMISSION_LEVEL_NONE = NodePermissionModel.PERMISSION_LEVEL_NONE = ServerAdaptorMixin.PERMISSION_LEVEL_NONE;
  NodePermissionModel.prototype.PERMISSION_LEVEL_READ = NodePermissionModel.PERMISSION_LEVEL_READ = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
  NodePermissionModel.prototype.PERMISSION_LEVEL_WRITE = NodePermissionModel.PERMISSION_LEVEL_WRITE = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
  NodePermissionModel.prototype.PERMISSION_LEVEL_FULL_CONTROL = NodePermissionModel.PERMISSION_LEVEL_FULL_CONTROL = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
  NodePermissionModel.prototype.PERMISSION_LEVEL_CUSTOM = NodePermissionModel.PERMISSION_LEVEL_CUSTOM = ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM;

  NodePermissionModel.prototype.getPermissionLevel = NodePermissionModel.getPermissionLevel;
  NodePermissionModel.prototype.getReadPermissions = NodePermissionModel.getReadPermissions;
  NodePermissionModel.prototype.getWritePermissions = NodePermissionModel.getWritePermissions;
  NodePermissionModel.prototype.getFullControlPermissions = NodePermissionModel.getFullControlPermissions;
  NodePermissionModel.prototype.getPermissionsByLevelExceptCustom = NodePermissionModel.getPermissionsByLevelExceptCustom;

  ConnectableMixin.mixin(NodePermissionModel.prototype);
  UploadableMixin.mixin(NodePermissionModel.prototype);
  ServerAdaptorMixin.mixin(NodePermissionModel.prototype);

  return NodePermissionModel;
});
