/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v1.request.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/browsable/client-side.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model',
  'i18n!xecmpf/widgets/fileupload/impl/nls/lang'
], function (_, Backbone, Url, ConnectableMixin, FetchableMixin,
  CommandableV2Mixin,
  BrowsableMixin,
  BrowsableV1RequestMixin,
  BrowsableV2ResponseMixin,
  DelayedCommandableV2Mixin,
  ClientSideMixin,
  NodeChildrenColumnModel,
  NodeChildrenColumnCollection,
  NodeModel,
  lang) {

  'use strict';
  var FileUploadColumnModel = NodeChildrenColumnModel.extend({

    constructor: function FileUploadColumnModel(attributes, options) {

      if (attributes && !attributes.title) {
          var columnKey = attributes.column_key;
          attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }

  });

  var FileUploadColumnCollection = NodeChildrenColumnCollection.extend({
    model: FileUploadColumnModel,

    constructor: function FileUploadColumnCollection(models, options) {

      if (!models) {
        models = [
          {
            key: 'classification_name',
            type: -1,
            name: lang.documentType
          },
          {
            key: 'label',
            type: -1,
            name: lang.status
          },
          {
            key: 'name',
            type: -1,
            name: lang.documentName
          },
          {
            key: 'location_name',
            type: -1,
            name: lang.locations
          }
        ];

        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);
    }
  });

  var FileUploadModel = NodeModel.extend({

    cidPrefix: 'fileupload',

    constructor: function FileUploadModel(attributes, options) {
      options || (options = {});
      if (!options.connector) {
        options.connector = options.collection && options.collection.connector || undefined;
      }
      NodeModel.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options);
    }

  });

  var FileUploadCollection = Backbone.Collection.extend({
    model: FileUploadModel,

    constructor: function FileUploadCollection(attributes, options) {
      options = options || {};
      this.options = options;
      this.wsid = options.wsid ? options.wsid : 0;
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset', 'node',
          'includeResources', 'fields', 'expand', 'commands', 'attributes']);
      }

      this.makeConnectable(options)
          .makeFetchable(options);
      this.columns = new FileUploadColumnCollection();
    },

    clone: function () {
      var clone = new this.constructor(this.models, this.options);
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
     
      return clone;
    },
    url: function (options) {
      
      var url = this.connector.getConnectionUrl().getApiBase('v2'), query = {};
      if (this.status && this.status.length >= 1) {
        query.status = this.status;
      }
      if (this.locations && this.locations.length >= 1) {
        query.locations = this.locations;
      }
      query = Url.combineQueryString(query);

      var path = '/businessworkspaces/' + this.wsid + '/fileupload';

      url = Url.combine(url, path);
      url = Url.appendQuery(url, query);
      
      return url;
    },
    parse: function (response) {
      var docTypeData = [], index;
      for(index = 0; index < response.results.data.length; index++){
        var docTypeGrp = response.results.data[index].data;
        var key = response.results.data[index].key;
        var icon = response.results.data[index].icon;
        var label = response.results.data[index].label;
        var count = response.results.data[index].count;
        for(var i = 0; i < docTypeGrp.length; i++){
          var docType = docTypeGrp[i];
          docType.key = key;
          docType.icon = icon;
          docType.label = label;
          docType.count = count;
          docTypeData.push(docType);
        }
      }
      return docTypeData;
    },

    fetch: function () {
      return Backbone.Collection.prototype.fetch.apply(this, arguments);
    }
  });

  ConnectableMixin.mixin(FileUploadCollection.prototype);
  FetchableMixin.mixin(FileUploadCollection.prototype);
  BrowsableMixin.mixin(FileUploadCollection.prototype);
  BrowsableV1RequestMixin.mixin(FileUploadCollection.prototype);
  BrowsableV2ResponseMixin.mixin(FileUploadCollection.prototype);
  CommandableV2Mixin.mixin(FileUploadCollection.prototype);
  DelayedCommandableV2Mixin.mixin(FileUploadCollection.prototype);
  ClientSideMixin.mixin(FileUploadCollection.prototype);

  return FileUploadCollection;
});