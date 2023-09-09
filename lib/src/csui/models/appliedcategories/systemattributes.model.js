/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/backbone',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/appliedcategories/systemattributes.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var SystemAttributesModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function SystemAttributesModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.node = options.node;
      this.id = options.id;

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(SystemAttributesModel.prototype);
  UploadableMixin.mixin(SystemAttributesModel.prototype);
  ResourceMixin.mixin(SystemAttributesModel.prototype);
  ServerAdaptorMixin.mixin(SystemAttributesModel.prototype);

  return SystemAttributesModel;
});
