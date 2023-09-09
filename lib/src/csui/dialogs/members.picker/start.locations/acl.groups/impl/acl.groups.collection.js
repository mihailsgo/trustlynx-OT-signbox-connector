/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/member/member.model', 'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin', 'csui/models/browsable/client-side.mixin',
  'csui/models/browsable/v2.response.mixin', 'csui/models/permission/acl.group.server.adaptor.mixin'
], function (module, _, $, Backbone, Url, MemberModel, ConnectableMixin, FetchableMixin,
    ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ServerAdaptorMixin) {
  "use strict";

  var AclContainerCollection = Backbone.Collection.extend({

    model: MemberModel,

    constructor: function AclContainerCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeClientSideBrowsable(options)
          .makeBrowsableV2Response(options);
    }
  });

  ClientSideBrowsableMixin.mixin(AclContainerCollection.prototype);
  BrowsableV2ResponseMixin.mixin(AclContainerCollection.prototype);
  ConnectableMixin.mixin(AclContainerCollection.prototype);
  FetchableMixin.mixin(AclContainerCollection.prototype);
  ServerAdaptorMixin.mixin(AclContainerCollection.prototype);

  return AclContainerCollection;
});