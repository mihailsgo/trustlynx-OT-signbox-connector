/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone',
  'xecmpf/utils/contexts/factories/eventactioncenter/eventactioncentercolumncollection',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/browsable/client-side.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/node/node.model',
  'xecmpf/utils/contexts/factories/eventactioncenter/server.adaptor.mixin',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone, EventActionCenterColumnCollection, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin,
    CommandableV2Mixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin,
    BrowsableV2ResponseMixin, NodeModel, ServerAdaptorMixin) {
  'use strict';

  var EventActionCenterdModel = NodeModel.extend({});

  var EventActionCenterCollection = Backbone.Collection.extend({

    model: EventActionCenterdModel,

    constructor: function EventActionCenterCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand', 'eventactioncenter']);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeCommandableV2(options)
          .makeClientSideBrowsable(options)
          .makeBrowsableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);

      this.columns = new EventActionCenterColumnCollection();
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }

  });

  ClientSideBrowsableMixin.mixin(EventActionCenterCollection.prototype);
  BrowsableV2ResponseMixin.mixin(EventActionCenterCollection.prototype);
  ConnectableMixin.mixin(EventActionCenterCollection.prototype);
  FetchableMixin.mixin(EventActionCenterCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(EventActionCenterCollection.prototype);
  FieldsV2Mixin.mixin(EventActionCenterCollection.prototype);
  ExpandableV2Mixin.mixin(EventActionCenterCollection.prototype);
  CommandableV2Mixin.mixin(EventActionCenterCollection.prototype);
  DelayedCommandableV2Mixin.mixin(EventActionCenterCollection.prototype);
  ServerAdaptorMixin.mixin(EventActionCenterCollection.prototype);

  return EventActionCenterCollection;

});
