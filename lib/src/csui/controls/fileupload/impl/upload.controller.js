/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/base', 'csui/utils/taskqueue', 'csui/utils/contexts/factories/task.queue.factory', 'csui/utils/contexts/factories/connector',
  'csui/models/version', "csui/utils/url",
  'csui/utils/commandhelper', 'csui/lib/underscore.deepExtend'
], function (module, _, $, Backbone, base, TaskQueue, TaskQueueFactory, ConnectorFactory, VersionModel, URL, CommandHelper) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 3

  });

  function UploadController(options) {
    options || (options = {});
    this.options = options;
    var context = this.options.context;
    this.connector = context.getObject(ConnectorFactory);
    this.container = options.container ? options.container.clone() : null;
    this.originatingView = options.originatingView ? options.originatingView : null; 
    if (options.context) {
      this.queue = options.context.getCollection(TaskQueueFactory, {
        options: {
          parallelism: options.parallelism || config.parallelism,
          permanent: true //To retain task queue collection while switching between folders
        }
      });
    } else {
      this.queue = new TaskQueue({
        parallelism: options.parallelism || config.parallelism
      });
    }
    this.chunkQueue = new TaskQueue({
      parallelism: options.parallelism || config.parallelism
    });
  }

  _.extend(UploadController.prototype, Backbone.Events, {

    scheduleFileForUpload: function (fileUpload) {
      this.queue.pending.add({
        worker: _.bind(this._uploadFile, this, fileUpload)
      });
    },

    _uploadFile: function (fileUpload) {
      var container = fileUpload.container || this.container, jqxhr,
        deferred = fileUpload.deferred,
        node = fileUpload.node,
        version = fileUpload.version || fileUpload.get('newVersion'),
        file = fileUpload.get("file"),
        extendedData = fileUpload.get('extended_data'),
        data;

      if (_.isArray(node.get('versions'))) {
        !!node.attributes && !!node.attributes.versions &&
          node.attributes.versions.push(version.attributes);

      }
      if (version) {
        if (!node.has('id')) {
          node.set('id', fileUpload.get('id'));
        }
        if (!(version instanceof VersionModel)) {
          version = new VersionModel({
            id: node.get('id')
          });
        }
        data = {};
        fileUpload.get('add_major_version') && (data.add_major_version = fileUpload.get('add_major_version'));
      } else {
        if (!container) {
          throw new Error('Container node is missing.');
        }
        data = {
          name: fileUpload.get('newName') || file.name,
          type: node.get('type') !== undefined ? node.get('type') : fileUpload.get('type') !== undefined ? fileUpload.get('type') : 144,
          parent_id: container.get('id'),
          advanced_versioning: !!container.get('versions_control_advanced')
        };
      }
      var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
      if (mlDataEnabled && !!fileUpload.get('multilingual_provided')) {
        _.extend(data, {
          name_multilingual: fileUpload.get('name_multilingual')
        });
      }
      if (extendedData) {
        _.deepExtend(data, extendedData);
      }
      if (container && container.get('type') === 136 && !!fileUpload.get('order_new')) {
        data.order_new = fileUpload.get('order_new');
      }
      if (data.type === 144 || version) {
        data.external_modify_date = fileUpload.get('file').lastModifiedDate;
        if (data.external_modify_date === undefined) {
          data.external_modify_date = new Date(fileUpload.get('file').lastModified);
        }
      }
      if (!node.connector) {
        if (!container) {
          throw new Error('Either node or container have to be connected.');
        }
        container.connector.assignTo(node);
      }
      if (version && !version.connector) {
        node.connector.assignTo(version);
      }

      var self = this;
      config.largeFileSettings = this.originatingView && this.originatingView.largeFileSettingsModel &&
      this.originatingView.largeFileSettingsModel.get('largeFileSettings');
      if ((config.largeFileSettings && config.largeFileSettings.is_enabled
        && (file.size > config.largeFileSettings.min_size) && (file.size < config.largeFileSettings.max_size))) {
        jqxhr = this.getUploadId(file).done(function (data) {
          var state = fileUpload.get('state');
          if ((state !== 'aborted') && (state !== 'stopped')) {
            self.uploadAllParts(data, file, fileUpload).done(function () {
              var state = fileUpload.get('state');
              if ((state !== 'aborted') && (state !== 'stopped')) {
                self.completeUpload(fileUpload).done(function () {
                  var state = fileUpload.get('state');
                  if ((state !== 'aborted') && (state !== 'stopped')) {
                    if (node.get('id')) {
                      var id = node.get('id');

                      self.createVersion(id, fileUpload).done(function (versionResponse) {
                        var sizeinbytes = versionResponse.results.data.versions['file_size'],
                          sizeinkb = base.formatFileSize(sizeinbytes);
                        version.set('file_size_formatted', sizeinkb);
                        version.isLocallyCreated = true;
                        if( versionResponse.results &&  versionResponse.results.data && versionResponse.results.data.properties
                          && versionResponse.results.data.versions) {
                            _.extend(version.attributes,versionResponse.results.data.properties, versionResponse.results.data.versions);
                          }
                        self.fetchNode(versionResponse, node).done(function () {
                          deferred.resolve(fileUpload);
                          return deferred.promise();
                        }).catch(function (errorObj) {
                          var error = new base.RequestErrorMessage(errorObj);
                          deferred.reject(fileUpload, error);
                        });
                      }).catch(function (errorObj) {
                        self.handleCatch(errorObj, fileUpload);
                      });
                    } else {
                      self.createNode(file, fileUpload).done(function (nodeResponse) {
                        self.fetchNode(nodeResponse, node).done(function () {
                          deferred.resolve(fileUpload);
                          return deferred.promise();
                        }).catch(function (errorObj) {
                          var error = new base.RequestErrorMessage(errorObj);
                          deferred.reject(fileUpload, error);
                        });
                      }).catch(function (errorObj) {
                        self.handleCatch(errorObj, fileUpload);
                      });
                    }
                  }
                  else {
                    deferred.reject(fileUpload);
                  }


                }).catch(function (errorObj) {
                  self.handleCatch(errorObj, fileUpload);
                });
              }
              else {
                deferred.reject(fileUpload);
              }
            }).catch(function (errorObj) {
              var chunkRequest;
              for (var index = 0; index < errorObj.length; index++) {
                if (errorObj[index].length > 1) {
                  chunkRequest = errorObj[index][1];
                }
              }
              self.handleCatch(chunkRequest, fileUpload);
            });
          }
          else {
            deferred.reject(fileUpload);
          }
        }).fail(function (errorObj) {
          self.handleCatch(errorObj, fileUpload);
        });
        deferred.fail(function (model, error) {
          if (!error) {
           jqxhr.abort();
          }
        });

      } else {
        jqxhr = (version || node).save(data, {
          data: data,
          files: { file: file }
        });
        jqxhr.progress(function (event, request) {
          deferred.notify(fileUpload, event);
        })
          .then(function (data, result, request) {
            if (node) {
              node = self.checkAndGetIfExistingNode(node);
              return node.fetch({ collection: node.collection, refreshCache: true });
            }
          })
          .done(function (data, result, request) {
            deferred.resolve(fileUpload);
          })
          .fail(function (request, message, statusText) {
            var error = new base.RequestErrorMessage(request);
            deferred.reject(fileUpload, error);
          });
        deferred.fail(function (model, error) {
          if (!error) {
            deferred.reject(fileUpload);
          }
        });
      }

      return fileUpload.promise();
    },

    checkAndGetIfExistingNode: function (node) {
      var nodeId = node.get('id');
      if(!nodeId) {
        return node;
      }
      var existingNode = node.collection && node.collection.findWhere({id: nodeId});
      return existingNode ? existingNode : node;
    },

    getUploadId: function (file) {
      var url = this.connector.getConnectionUrl().getApiBase('v2'),
        formData = {
          'file_size': file.size,
          'file_name': file.name,
          'mime_type': file.type
        },
        ajaxOptions = {
          url: URL.combine(url, 'multipart'),
          type: 'POST',
          data: formData,
          contentType: 'application/x-www-form-urlencoded'
        };


        return this.connector.makeAjaxCall(ajaxOptions);
    },

    uploadAllParts: function (results, file, fileUpload) {
      var data = results.results.data, self = this,
        partSize = data.part_size;
      var largeFile = fileUpload.get('largeFile');
      largeFile.uploadKey = data.upload_key;
      largeFile.maxRetries = data.max_retries;
      largeFile.fileChunks.total = data.num_parts;
      fileUpload.set({ state: "processing" });
      largeFile.state = "processing";

      if (!(largeFile.slicedFiles)) {
        for (var partNumber = 0; partNumber < data.num_parts; partNumber++) {
          largeFile.fileChunks.slicedFiles[partNumber] = file.slice((partNumber) * partSize, (partNumber + 1) * partSize, "application/octet-stream");

        }
      }

      fileUpload.set('largeFile', largeFile);
      fileUpload.attributes.upload_key = data.upload_key;
      var promises = self.uploadChunk(fileUpload);
      return $.whenAll.apply($, promises);

    },
    uploadChunk: function (fileUpload) {
      var largeFile = fileUpload.get('largeFile'), self = this,
      url = this.connector.getConnectionUrl().getApiBase('v2') + "multipart/" + largeFile.uploadKey;

      var promises = largeFile.fileChunks.slicedFiles.map(function (fileChunk, index) {
        var fd = new FormData();
        var deferred = $.Deferred();

        fd.append('part_content', fileChunk);
        var url1 = url + '/' + (index + 1),
          ajaxOptions = {
            'url': url1,
            'method': 'POST',
            'data': fd,
            "processData": false,
            "contentType": false
          };

        self.chunkQueue.pending.add({
          worker: _.bind(function () {
            var promise = self.connector.makeAjaxCall(ajaxOptions)
              .done(function () {
                var size = fileUpload.get('count');
                largeFile = fileUpload.get('largeFile', largeFile);
                fileUpload.set({ count: fileChunk.size + size });
                fileUpload.set('largeFile', largeFile);
                deferred.resolve(fileChunk);
              })
              .catch(function (errorObj) {

                deferred.reject(fileChunk, errorObj);


              });
              var state = fileUpload.get('state');
              if ((state !== 'aborted') && (state !== 'stopped')) {
                return deferred.promise();
              }  
              else{
                deferred.reject(fileUpload);
              }
            
          }, self, ajaxOptions)
        });


        return deferred.promise(promises);
      });
      return promises;
    },

    completeUpload: function (fileUpload) {
      var largeFile = fileUpload.get('largeFile');
      var url = this.connector.getConnectionUrl().getApiBase('v2') + "multipart/" + largeFile.uploadKey;
      var ajaxOptions = {
        url: url,
        type: 'POST',
        contentType: 'application/x-www-form-urlencoded'
      };
      return this.connector.makeAjaxCall(ajaxOptions);
    },

    createNode: function (file, fileUpload) {
      var largeFile = fileUpload.get('largeFile');
      var url = this.connector.getConnectionUrl().getApiBase('v2') + "nodes",
        formData = {
          parent_id: this.container.get('id'),
          type: 144,
          name: file.name,
          upload_key: largeFile.uploadKey,
        },
        ajaxOptions = {
          url: url,
          type: 'POST',
          data: formData,
          contentType: 'application/x-www-form-urlencoded'
        };
        return this.connector.makeAjaxCall(ajaxOptions);
    },

    createVersion: function (nodeId, fileUpload) {
      var largeFile = fileUpload.get('largeFile');
      var url = this.connector.getConnectionUrl().getApiBase('v2') + "nodes/" + nodeId + "/versions",
        formData = {
          upload_key: largeFile.uploadKey,
        },
        ajaxOptions = {
          url: url,
          type: 'POST',
          data: formData,
          contentType: 'application/x-www-form-urlencoded'
        };
        return this.connector.makeAjaxCall(ajaxOptions);
    },


    fetchNode: function (data, node) {
      if (node) {
        node = this.checkAndGetIfExistingNode(node);
        node.attributes = data.results.data.properties;
        data.results.data.versions && node.set('versions', data.results.data.versions);
        return node.fetch({ collection: node.collection, refreshCache: true });
      }
    },
    handleCatch: function (errorObj, fileUpload) {
      var deferred = fileUpload.deferred;
      if (errorObj.status >= 400) {
        var error = new base.RequestErrorMessage(errorObj);
        deferred.reject(fileUpload, error);
      }
      else {
        this.isRetry = true;
        this.retryUpload(fileUpload);
      }

    },
    retryUpload: function (fileUpload) {
      var deferred = fileUpload.deferred;
      var value = navigator.onLine;
      var self = this;
      if (!value) {
        var offlineTimer = setInterval(function () {
          if (navigator.onLine) {
            clearInterval(offlineTimer);
            self.retryUpload(fileUpload);
          }
        }, 2000);
      }
      else {

        if (this.isRetry) {
          this.isRetry = false;
          this.queue = new TaskQueue({
            parallelism: this.options.parallelism || config.parallelism
          });
        }

        var file = fileUpload.get("file");
        var size = file.size;
        var oldLargeFile = fileUpload.get('largeFile');
        var largeFile = {
          size: size,
          uploadKey: "",
          state: "pending",
          fileChunks: {
            slicedFiles: [],
            total: 0
          }
        };
        largeFile.retryCount = oldLargeFile.retryCount;
        largeFile.maxRetries = oldLargeFile.maxRetries;
        fileUpload.set({ count: 0 });
        fileUpload.attributes.upload_key = "";

        fileUpload.set('largeFile', largeFile);
        var state = fileUpload.get('state');
        if ( (!(largeFile.maxRetries) && (state === 'pending')) 
        ||(((state !== 'aborted') && (state !== 'stopped')) && (largeFile.retryCount < largeFile.maxRetries))) {
          largeFile.retryCount = largeFile.retryCount + 1;
          fileUpload.set('largeFile', largeFile);
          this.scheduleFileForUpload(fileUpload);
        }
        else {
          deferred.reject(fileUpload);
        }

      }


    },


  });
  UploadController.extend = Backbone.View.extend;

  return UploadController;


});
