/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/utils/nodesprites'],
  function ($, Backbone, Url, nodesprites) {
    var FileUploadPanelItem = Backbone.Model.extend({
      defaults: {
        file: null,
        name: '',
        size: 0,
        iconClass: '',
        dataId: null,
        node: null
      }
    });
    var FileUploadPanelItemsCollection = Backbone.Collection.extend({
      constructor: function FileUploadPanelItemsCollection(options) {
        var index = 0,
          files = options.data,
          length = files.length,
          fileDetails = [];
        for (; index < length; index++) {
          fileDetails.push({
            file: files[index],
            name: files[index].name,
            size: files[index].size,
            iconClass: this.getFileTypeIconClass(files[index].type)
          });
        }
        this.options = options;
        Backbone.Collection.prototype.constructor.call(this, fileDetails);
      },
      model: FileUploadPanelItem,
      addUploadedItems: function (files) {
        var index = 0,
          length = files.length;
        for (; index < length; index++) {
          this.add({
            file: files[index],
            name: files[index].name,
            size: files[index].size,
            iconClass: this.getFileTypeIconClass(files[index].type)
          });
        }
      },
      removeUploadedItem: function (model) {
        this.remove(model);
      },
      getFileTypeIconClass: function (type) {
        return nodesprites.findByNode(new Backbone.Model({ 'mime_type': type })).get('className');
      },
      getParentLocationId: function(wsId) {
        var connector = this.options.connector,
          url = Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/fileupload/createtargetfolder'),
          formData,
          promise,
          that = this;
        if ( this.parentId ) {
          promise = Promise.resolve(this.parentId);
        } else {
          promise = new Promise(function(resolve, reject) {
            
            formData = new FormData();
            formData.append('ws_id',  wsId);
            formData.append('file', that.models[0].get('file'));

            connector.makeAjaxCall({
              url: url,
              type: 'POST',
              data: formData,
              success: function (response, status, xhr) {
                if ( response && response.results.ok === true ) {
                  that.models[0].set( 'dataId', response.results.dataID );
                  that.models[0].set( 'node', response.results.node );
                  that.parentId = response.results.parentID;
                  resolve(that.parentId);
                } else {
                  reject('Upload failed');
                }
              },
              error: function(err) {
                reject((err.responseJSON && err.responseJSON.error) || 'Upload failed');
              }
            });
          });
        }
        return promise;
      },
      uploadFiles: function( wsId, parentId ) {
        var formData,
          promises = [], 
          connector = this.options.connector,
          url = Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/fileupload/preupload'),
          promise;
        parentId = parentId || this.parentId || 0;
        this.models.forEach(function(model) {
          if ( !model.get('dataId') ) {
            formData = new FormData();
            formData.append('parent_id', parentId);
            formData.append('ws_id',  wsId);
            formData.append('file', model.get('file'));
            promise = new Promise(function(resolve, reject){
              connector.makeAjaxCall({
                url: url,
                type: 'POST',
                data: formData,
                success: function (response, status, xhr) {
                  if ( response && response.results.ok === true ) {
                    model.set( 'dataId', response.results.dataID );
                    model.set( 'node', response.results.node );
                  }
                },
                error: function(err) {
                  model.set('upload_err', (err.responseJSON && err.responseJSON.error) || err);
                },
                complete: function (xhr, status) {
                  resolve();
                }
              });
            });
            promises.push(promise);
          }
        });
        return Promise.all(promises);
      },
      deletePreviewDocs: function(wsId, parentId) {
        var connector = this.options.connector,
          url = Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/fileupload/preupload/delete'),
          formData,
          promise,
          that = this;
        promise = new Promise(function(resolve, reject) {
          formData = new FormData();
          formData.append('ws_id',  wsId);
          formData.append('parent_id', parentId);
          connector.makeAjaxCall({
            url: url,
            type: 'POST',
            data: formData,
            success: function (response, status, xhr) {
              if ( response && response.results.ok === true ) {
                resolve();
              } else {
                reject('Deletion failed');
              }
            },
            error: function(err) {
              reject((err.responseJSON && err.responseJSON.error) || 'Deletion failed');
            }
          });
        });
        return promise;
      }
    });
    return FileUploadPanelItemsCollection;

  });