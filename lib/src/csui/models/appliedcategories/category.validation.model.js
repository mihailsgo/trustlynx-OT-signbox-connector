/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/backbone',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/appliedcategories/category.validation.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var CategoryValidationModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function CategoryValidationModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

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

  ExpandableMixin.mixin(CategoryValidationModel.prototype);
  UploadableMixin.mixin(CategoryValidationModel.prototype);
  ResourceMixin.mixin(CategoryValidationModel.prototype);
  ServerAdaptorMixin.mixin(CategoryValidationModel.prototype);

  return CategoryValidationModel;
});
