/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/models/member', 'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/member/members.server.adaptor'
], function (_, $, Backbone, Url, MemberModel, ResourceMixin, ServerAdaptorMixin) {
  'use strict';

  var MemberCollection = Backbone.Collection.extend({

    constructor: function MemberCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeResource(options);

      options || (options = {});

      this.limit = options.limit || 10;
      this.query = options.query || "";
      this.orderBy = options.orderBy;
      this.expandFields = options.expandFields || [];
      if (options.memberFilter && options.memberFilter.type) {
        this.memberType = options.memberFilter.type;
      }
      this.memberType || (this.memberType = [0, 1]);
    },

    model: MemberModel,

    clone: function () {
      return new this.constructor(this.models, {
        connector: this.connector,
        limit: this.limit,
        query: this.query,
        expandFields: _.clone(this.expandFields),
        memberFilter: {type: this.memberType}
      });
    }
  });

  ResourceMixin.mixin(MemberCollection.prototype);
  ServerAdaptorMixin.mixin(MemberCollection.prototype);

  return MemberCollection;
});