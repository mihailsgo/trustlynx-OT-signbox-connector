/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url', 'csui/models/fileupload'
], function ($, _, Url, FileUploadModel) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.connector.connection.url, 'validation/nodes');
        },

        queryNames: function (files) {
          var containerId = this.get('containerId'),
              deferred    = $.Deferred();
          this.fileGroups = this._getFileNameGroups(files);

          if (this.fileGroups.length === 0) {
            deferred.reject();
          }
          else {
            this._runQuery(0, containerId, deferred);
          }

          return deferred.promise();
        },

        runQuery: function (parentId, queryName) {
          var data = {
            'parent_id': parentId,
            'names': queryName
          };

          return this._jqxhr(data);
        },

        _jqxhr: function (data) {
          var deferred = $.Deferred();

          this.save(data, {data: data})
              .done(deferred.resolve)
              .fail(deferred.reject);

          return deferred.promise();
        },

        _runQuery: function (index, parentId, deferred) {
          var self       = this,
              fileGroups = this.fileGroups;
          if (fileGroups && fileGroups[index]) {
            var data = {
              'parent_id': parentId,
              'names': this._getFileNames(fileGroups[index])
            };

            this._jqxhr(data)
                .done(function (data, result, request) {
                  self._addResults(data, fileGroups[index]);
                  if (fileGroups[++index]) {
                    self._runQuery(index, parentId, deferred);
                  }
                  else {
                    deferred.resolve(self.cleanFiles, self.conflictFiles);
                  }
                })
                .fail(function (request, message, statusText) {
                  deferred.reject(request);
                });

          }

        },

        _addResults: function (data, fileGroup) {
          _.each(fileGroup, function (groupFile) {
            var name = groupFile.newName || groupFile.name ||
                       groupFile.get('newName') || groupFile.get('name'),
                item = _.find(data.results, function (item) {
                      return item.name === name;
                    }) || {}; // Old API did not send anything in case of no conflict

            if (groupFile instanceof FileUploadModel) {
              var groupFileSubtype = groupFile.get('subType');
              if (groupFileSubtype === 0) { // for newly created folders
                item.type = 0;
              }
            } else if (groupFile.type === 0) { // after renaming folder, set the type to 0.
              item.type = 0;
            }
            updateGroupFile.call(this, groupFile, item);
            if (item.id) {
              this.conflictFiles.push(groupFile);
            } else {
              this.cleanFiles.push(groupFile);
            }
          }, this);

          function updateGroupFile(groupFile, item) {
            if (groupFile instanceof FileUploadModel) {
              groupFile.set({
                type: (item.type !== undefined && item.type !== null) ? item.type : groupFile.get('subType'),
                versioned: item.versioned
              });
              item.id && groupFile.set('id', item.id);
            } else {
              _.extend(groupFile, {
                id: item.id,
                type: item.type,
                versioned: item.versioned
              });
            }
          }
        },

        _getFileNames: function (files) {
          var names = [];
          _.each(files, function (file) {
            var name = '';
            if (file instanceof FileUploadModel) {
              name = file.get('newName') || file.get('name');
            }
            else {
              name = file.newName || file.name;
            }
            names.push(name);
          });
          return names;
        },

        _getFileNameGroups: function (files) {
          var fileArray       = $.isArray(files) ? files : files.models,
              i               = 0, counter = 1,
              numFiles        = fileArray.length,
              fileQueryGroups = [];

          while (i < numFiles) {
            var group = [],
                limit = this.config.filesPerQuery * counter++;

            for (; i < numFiles && i < limit; i++) {
              fileArray[i].index = i;
              group.push(fileArray[i]);
            }
            fileQueryGroups.push(group);
          }

          return fileQueryGroups;
        }

      });
    }
  };
  return ServerAdaptorMixin;
});