/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/backbone',
'nuc/models/mixins/expandable/expandable.mixin',
'nuc/models/mixins/resource/resource.mixin',
'nuc/models/mixins/uploadable/uploadable.mixin',
'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
'nuc/models/member/server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
  UploadableMixin, IncludingAdditionalResourcesMixin, ServerAdaptorMixin) {
    'use strict';

  var MemberModel = Backbone.Model.extend({

    imageAttribute: 'photo_url',
    
    constructor: function MemberModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeIncludingAdditionalResources(options)
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

  IncludingAdditionalResourcesMixin.mixin(MemberModel.prototype);
  ExpandableMixin.mixin(MemberModel.prototype);
  UploadableMixin.mixin(MemberModel.prototype);
  ResourceMixin.mixin(MemberModel.prototype);
  ServerAdaptorMixin.mixin(MemberModel.prototype);

  return MemberModel;
});
