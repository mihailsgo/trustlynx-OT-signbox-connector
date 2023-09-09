/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/url',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/browsable/v1.request.mixin', 'nuc/models/member/member.model',
  'nuc/models/member/membercollection.server.adaptor'
], function (_, Backbone, Url, ResourceMixin, BrowsableMixin, BrowsableV1RequestMixin,
    MemberModel, ServerAdaptorMixin) {
  'use strict';
  var MemberCollection = Backbone.Collection.extend({

    model: MemberModel,

    searchTerm: "",

    constructor: function MemberCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeResource(options);
      this.makeBrowsable(options);

      if (options !== undefined && options.member !== undefined && options.member !== null) {
        this.parentId = options.member.get("id");
        this.nodeId = options.member.get("nodeId");
        this.categoryId = options.member.get("categoryId");
        this.groupId = options.member.get("groupId");
      } else {
        this.nodeId = options.nodeId;
        this.categoryId = options.categoryId;
        this.groupId = options.groupId;
      }
      this.query = options.query || "";
      this.type = options.type;
    },

    clone: function () {
      var clone = new this.constructor(this.models, {
        connector: this.connector,
        parentId: this.parentId,
        nodeId: this.nodeId,
        categoryId: this.categoryId,
        groupId: this.groupId,
        query: this.query
      });
      clone.totalCount = this.totalCount;
      return clone;
    },

    search: function (term) {
      this.searchTerm = term;
      this.fetch();
    }

  });

  ResourceMixin.mixin(MemberCollection.prototype);
  BrowsableMixin.mixin(MemberCollection.prototype);
  BrowsableV1RequestMixin.mixin(MemberCollection.prototype);
  ServerAdaptorMixin.mixin(MemberCollection.prototype);

  return MemberCollection;
});
