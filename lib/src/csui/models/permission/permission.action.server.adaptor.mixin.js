/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        urlBase: function () {
          var type              = this.get('type'),
              right_id          = this.get('right_id'),
              nodeId            = this.nodeId,
              apply_to          = this.apply_to,
              include_sub_types = this.include_sub_types,
              queryString       = "",
              url               = this.options.connector.getConnectionUrl().getApiBase('v2');
          if (!_.isNumber(nodeId) || nodeId > 0) {
            url = Url.combine(url, 'nodes', nodeId, 'permissions');
            if (apply_to) {
              queryString = Url.combineQueryString(queryString, {apply_to: apply_to});
            }
            if (include_sub_types) {
              _.each(include_sub_types, function (subtype) {
                queryString = Url.combineQueryString(queryString, {include_sub_types: subtype});
              });
            }

            queryString = queryString.length > 0 ? "?" + queryString : queryString;
            if (!type) {
              url = Url.combine(url, 'custom' + queryString);
            } else if (type !== 'custom') {
              url = Url.combine(url, type + queryString);
            } else if (!_.isNumber(right_id) || right_id > 0) {
              url = Url.combine(url, type, right_id + queryString);
            } else {
              throw new Error('Unsupported permission type or user id');
            }
          } else {
            throw new Error('Unsupported id value');
          }
          return url;
        },

        url: function () {
          var url   = this.urlBase(),
              query = null;
          return query ? url + '?' + query : url;
        },

        parse: function (response, options) {
          if (this.collection) {
            var addItemsOptionIndex = response.permissions ?
                                      response.permissions.indexOf('add_items') : -1,
                addMajorVersionOptionIndex;
            if (!this.collection.isContainer) {
              if (addItemsOptionIndex !== -1) {
                response.permissions.splice(addItemsOptionIndex, 1);
              }
              addMajorVersionOptionIndex = response.permissions ?
                                           response.permissions.indexOf("add_major_version") : -1;
              if (!(this.collection.options.node &&
                  this.collection.options.node.get('advanced_versioning')) &&
                  addMajorVersionOptionIndex !== -1) {
                response.permissions.splice(addMajorVersionOptionIndex, 1);
              }
            } else {
              addMajorVersionOptionIndex = response.permissions ?
                                           response.permissions.indexOf("add_major_version") : -1;
              if (!(this.collection.options.node &&
                  this.collection.options.node.get('advancedVersioningEnabled')) &&
                  addMajorVersionOptionIndex !== -1) {
                response.permissions.splice(addMajorVersionOptionIndex, 1);
              }
            }
          }
          return response;
        }
      });
    },

    getPermissionLevel: function (permissions, isContainer, versionControlAdvanced, node, permissionModel) {
      var value,
          permissionsCount = 9;
      if (isContainer) {
        permissionsCount++;
        if (!node.get('advancedVersioningEnabled')) {
          permissionsCount--;
        }
      } else if (!versionControlAdvanced) {
        permissionsCount--;
      }
      if (permissions && permissions.length > 0 && (node.get('permissions_model') !== 'simple')) {
        if (permissions.indexOf("edit_permissions") >= 0 &&
            permissions.length === permissionsCount) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
        } else if (permissions.indexOf("edit_permissions") < 0 &&
                   permissions.indexOf("delete") >= 0 &&
                   permissions.length === (permissionsCount - 1)) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
        } else if (permissions.indexOf("see_contents") >= 0 &&
                   permissions.length === 2) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
        } else {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM;
        }
      } else if (permissions && permissions.length > 0 &&
                 (node.get('permissions_model') === 'simple')) {
        if (permissions.indexOf("edit_permissions") >= 0) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
        } else if (permissions.indexOf("edit_permissions") < 0 &&
                   permissions.indexOf("delete") >= 0) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
        } else if (permissions.indexOf("see_contents") >= 0 &&
                   permissions.length === 2) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
        }
      } else if (permissionModel.get("type") === "public" || !!permissionModel.get("right_id")) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_NONE;
      }
      return value;
    },

    getReadPermissions: function () {
      return ["see", "see_contents"];
    },

    getWritePermissions: function (isContainer, versionControlAdvanced, advancedVersioningEnabled) {
      var permissions = ["see", "see_contents", "modify", "edit_attributes", "add_items", "reserve",
        "add_major_version", "delete_versions", "delete"];
      if (!isContainer) {
        permissions.splice(permissions.indexOf('add_items'), 1);
        if (!versionControlAdvanced) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      } else {
        if (!advancedVersioningEnabled) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      }
      return permissions;
    },

    getFullControlPermissions: function (isContainer, versionControlAdvanced,
        advancedVersioningEnabled) {
      var permissions = ["see", "see_contents", "modify", "edit_attributes", "add_items", "reserve",
        "add_major_version", "delete_versions", "delete", "edit_permissions"];
      if (!isContainer) {
        permissions.splice(permissions.indexOf('add_items'), 1);
        if (!versionControlAdvanced) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      } else {
        if (!advancedVersioningEnabled) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      }
      return permissions;
    },

    getPermissionsByLevelExceptCustom: function (level, isContainer, versionControlAdvanced,
        advancedVersioningEnabled) {
      var permissions = null;
      switch (level) {
      case ServerAdaptorMixin.PERMISSION_LEVEL_NONE:
        permissions = [];
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_READ:
        permissions = ServerAdaptorMixin.getReadPermissions();
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_WRITE:
        permissions = ServerAdaptorMixin.getWritePermissions(isContainer, versionControlAdvanced,
            advancedVersioningEnabled);
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL:
        permissions = ServerAdaptorMixin.getFullControlPermissions(isContainer,
            versionControlAdvanced,
            advancedVersioningEnabled);
        break;
      }
      return permissions;
    }

  };

  ServerAdaptorMixin.PERMISSION_LEVEL_NONE = 0;
  ServerAdaptorMixin.PERMISSION_LEVEL_READ = 1;
  ServerAdaptorMixin.PERMISSION_LEVEL_WRITE = 2;
  ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL = 3;
  ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM = 4;
  return ServerAdaptorMixin;
});
