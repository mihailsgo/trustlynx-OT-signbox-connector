/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/backbone',
  'nuc/models/browsable/browsable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/browsable/v1.request.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/node/node.model',
  'csui/models/compound.document/reorganize/server.adaptor.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin'
], function (_, Backbone, BrowsableMixin, ConnectableMixin, FetchableMixin, BrowsableV1RequestMixin,
  BrowsableV2ResponseMixin, NodeModel, ServerAdaptorMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin,
  ExpandableV2Mixin, StateRequestorMixin, DelayedCommandableV2Mixin) {

var ReorganizeCollection = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function ReorganizeCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeBrowsableV2Response(options)
        .makeAdditionalResourcesV2Mixin(options)
        .makeFieldsV2(options)
        .makeExpandableV2(options)
        .makeStateRequestor(options)
        .makeServerAdaptor(options);
    }
  });

  BrowsableMixin.mixin(ReorganizeCollection.prototype);
  BrowsableV1RequestMixin.mixin(ReorganizeCollection.prototype);
  BrowsableV2ResponseMixin.mixin(ReorganizeCollection.prototype);
  ConnectableMixin.mixin(ReorganizeCollection.prototype);
  FetchableMixin.mixin(ReorganizeCollection.prototype);
  ServerAdaptorMixin.mixin(ReorganizeCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(ReorganizeCollection.prototype);
  FieldsV2Mixin.mixin(ReorganizeCollection.prototype);
  ExpandableV2Mixin.mixin(ReorganizeCollection.prototype);
  StateRequestorMixin.mixin(ReorganizeCollection.prototype);
  DelayedCommandableV2Mixin.mixin(ReorganizeCollection.prototype);

  return ReorganizeCollection;
});