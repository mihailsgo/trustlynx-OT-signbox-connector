/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin'],
  function ( $, Backbone, Url, ConnectableMixin, FetchableMixin ) {

    var FileUploadPanelDocTypeModel = Backbone.Model.extend({
      constructor: function FileUploadPanelDocTypeModel(options) {
        this.options = options;
        Backbone.Model.prototype.constructor.call(this);
        this.makeConnectable(options);
        this.makeFetchable(options);
      },
      url: function () {
        var query = Url.combineQueryString(
            {
              skip_validation: false,
              document_type_rule: true,
              document_generation_only: false,
              sort_by: 'DocumentType'
            }
        );
        return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),
          '/businessworkspaces/' + this.options.wsId + '/doctypes?' + query);
      },
      parse: function (response) {
        if (response.results) {
          return {
            docTypes: response.results.map(function(val) { return val.data.properties; })
          }
        }
        return undefined;
      },
      getCategoryFormModel: function(docTypeId) {
        var docTypeInfo = this.get('docTypes').filter(function(val) { return val.classification_id === docTypeId }),
            connector = this.options.connector,
            that = this,
            url;
        if ( docTypeInfo && docTypeInfo.length > 0 ) {
          if ( this.get(docTypeInfo[0].category_id ) ) {
            return Promise.resolve(this.get(docTypeInfo[0].category_id ));
          } else {
            url =  Url.combine(connector.getConnectionUrl().getApiBase('v1'),
            '/forms/nodes/categories/create?id=' + this.options.wsId + '&category_id=' + docTypeInfo[0].category_id );
            return new Promise(function(resolve, reject) {
              connector.makeAjaxCall({
                url: url,
                type: 'GET',
                success: function (response, status, xhr) {
                  if ( response && response.forms && response.forms.length > 0 ) {
                    that.set( docTypeInfo[0].category_id, response.forms[0] );
                    resolve(response.forms[0]);
                  }
                },
                error: function() {
                  reject();
                }
              });
            });
          }
        }
        return Promise.reject();
      },
      getCategoryIdForDocType: function( docTypeId ) {
        var categoryId,
            docTypeInfo = this.get('docTypes').filter(function(val) { return val.classification_id === parseInt(docTypeId) });
        if ( docTypeInfo && docTypeInfo.length > 0 ) {
          categoryId = docTypeInfo[0].category_id;
        }
        return categoryId;
      }
    });

    ConnectableMixin.mixin(FileUploadPanelDocTypeModel.prototype);
    FetchableMixin.mixin(FileUploadPanelDocTypeModel.prototype);

    return FileUploadPanelDocTypeModel;

  });