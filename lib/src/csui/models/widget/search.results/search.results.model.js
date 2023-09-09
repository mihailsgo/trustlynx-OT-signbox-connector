/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/models/node/node.model', 'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin', 'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v1.request.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/widget/search.results/search.response.mixin',
  'csui/models/widget/search.results/server.adaptor.mixin',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data',
  'i18n!csui/models/widget/nls/lang', 'csui/utils/deepClone/deepClone'
], function (_, $, Backbone, NodeModel, ConnectableMixin, FetchableMixin,
    BrowsableMixin, BrowsableV1RequestMixin, BrowsableV2ResponseMixin, StateRequestorMixin,
    DelayedCommandableV2Mixin, AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin,
    SearchResponseMixin, ServerAdaptorMixin, nodeExtraData, mergeExtraData, lang) {
  'use strict';

  var SearchResultCollection = Backbone.Collection.extend({
    model: NodeModel,

    constructor: function SearchResultCollection(models, options) {
      this.options = options || (options = {});
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.title = lang.searchResults;
      if (!options.fields) {
        options.fields = nodeExtraData.getModelFields();
      }
      if (!options.expand) {
        options.expand = mergeExtraData(
          nodeExtraData.getModelExpand(), {
            properties: [
              'reserved_user_id', 'original_id', 'owner_user_id',
              'create_user_id', 'owner_id', 'reserved_user_id', 'parent_id'
            ]
          }
        );
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeBrowsable(options)
          .makeBrowsableV1Request(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeBrowsableV2Response(options)
          .makeStateRequestor(options)
          .makeDelayedCommandableV2(options)
          .makeSearchResponse(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.models, {
        connector: this.connector,
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: _.clone(this.orderBy),
        expand: _.clone(this.expand),
        includeActions: this.includeActions,
        commands: _.clone(this.commands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands
      });
    },

    isFetchable: function () {
      return (!!this.options.query.get('where') || !!this.options.query.get('query_id'));
    },

    setDefaultPageNum: function () {
      this.skipCount = 0;
    },

    setPreviousOrder: function (attributes, fetch) {
      if (this.previousOrderBy != attributes) {
        this.previousOrderBy = attributes;
        if (fetch !== false) {
          this.fetch({skipSort: false});
        }
        return true;
      }
    },

    getResourceScope: function () {
      return _.deepClone({
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }
  });

  BrowsableMixin.mixin(SearchResultCollection.prototype);
  BrowsableV1RequestMixin.mixin(SearchResultCollection.prototype);
  BrowsableV2ResponseMixin.mixin(SearchResultCollection.prototype);
  FieldsV2Mixin.mixin(SearchResultCollection.prototype);
  ExpandableV2Mixin.mixin(SearchResultCollection.prototype);
  ConnectableMixin.mixin(SearchResultCollection.prototype);
  FetchableMixin.mixin(SearchResultCollection.prototype);
  StateRequestorMixin.mixin(SearchResultCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(SearchResultCollection.prototype);
  SearchResponseMixin.mixin(SearchResultCollection.prototype);
  ServerAdaptorMixin.mixin(SearchResultCollection.prototype);
  DelayedCommandableV2Mixin.mixin(SearchResultCollection.prototype);

  return SearchResultCollection;
});
