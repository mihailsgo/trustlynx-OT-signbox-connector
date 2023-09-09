/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.adaptors/objecttypes.mixin'
], function (_, Backbone, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  var ObjectTypesModel = Backbone.Model.extend({

    constructor: function ObjectTypesModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(ObjectTypesModel.prototype);
  FetchableMixin.mixin(ObjectTypesModel.prototype);
  ServerAdaptorMixin.mixin(ObjectTypesModel.prototype);

  _.extend(ObjectTypesModel.prototype, {

    isFetchable: function () {
      return !this.get('objecttypes');
    }

  });

  return ObjectTypesModel;

});