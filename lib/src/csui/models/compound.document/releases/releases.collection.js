/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/backbone',
  'nuc/models/browsable/browsable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/browsable/v1.request.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/compound.document/releases/server.adaptor.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model'
], function (_, Backbone, BrowsableMixin, ConnectableMixin, FetchableMixin, BrowsableV1RequestMixin,
  BrowsableV2ResponseMixin, ServerAdaptorMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin,
  ExpandableV2Mixin, StateRequestorMixin, DelayedCommandableV2Mixin, NodeChildrenColumnModel,
  NodeChildrenColumnCollection, NodeModel) {

  var releaseObject = {
    type: 'release_type',
    type_name:'type_name',
    name: 'name',
    reserved:'reserved',
    release_value: 'release_value',
    created: 'release_date',
    createdBy: 'create_user_name',
    favorite: 'favorite',
    dateType: '-7',
  };

  var ReleasesColumnModel = NodeChildrenColumnModel.extend({
    constructor: function ReleasesColumnModel(attributes, options) {
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });

  var ReleasesColumnCollection = NodeChildrenColumnCollection.extend({
    model: ReleasesColumnModel,

    resetColumnsV2: function (response, options) {
      if (!this.models.length) {// Stopping reset as event data is static and doesn't change after first fetch
        this.resetCollection(this.getV2Columns(response), options);
      }
    },

    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
        this, columnKeys, definitions);
      return columns;
    },

    getV2Columns: function () {
      var definitions = {},
        releaseObjectKeys = Object.keys(releaseObject);
      _.each(releaseObjectKeys, function (column) {
        definitions[column] = {};
        definitions[column].key = releaseObject[column];
      });
      definitions.created.type = releaseObject.dateType;
      definitions.type.type_name = releaseObject.type_name;
      var columnKeys = _.keys(definitions);
      return this.getColumnModels(columnKeys, definitions);
    }
  });

  var ReleasesModel = NodeModel.extend({});

  var ReleasesCollection = Backbone.Collection.extend({
    model: ReleasesModel,
    constructor: function ReleasesCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeBrowsableV2Response(options)
        .makeAdditionalResourcesV2Mixin(options)
        .makeFieldsV2(options)
        .makeExpandableV2(options)
        .makeStateRequestor(options)
        .makeDelayedCommandableV2(options)
        .makeServerAdaptor(options);
      this.columns = new ReleasesColumnCollection();
    }
  });

  BrowsableMixin.mixin(ReleasesCollection.prototype);
  BrowsableV1RequestMixin.mixin(ReleasesCollection.prototype);
  BrowsableV2ResponseMixin.mixin(ReleasesCollection.prototype);
  ConnectableMixin.mixin(ReleasesCollection.prototype);
  FetchableMixin.mixin(ReleasesCollection.prototype);
  ServerAdaptorMixin.mixin(ReleasesCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(ReleasesCollection.prototype);
  FieldsV2Mixin.mixin(ReleasesCollection.prototype);
  ExpandableV2Mixin.mixin(ReleasesCollection.prototype);
  StateRequestorMixin.mixin(ReleasesCollection.prototype);
  DelayedCommandableV2Mixin.mixin(ReleasesCollection.prototype);

  return ReleasesCollection;
});