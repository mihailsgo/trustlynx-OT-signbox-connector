/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/autofetchable/autofetchable.mixin'
], function (_, ConnectableMixin, FetchableMixin, AutoFetchableMixin) {
  'use strict';

 var ResourceMixin = {

    mixin: function (prototype) {
      ConnectableMixin.mixin(prototype);
      FetchableMixin.mixin(prototype);
      AutoFetchableMixin.mixin(prototype);

      return _.extend(prototype, {

        makeResource: function (options) {
          return this.makeConnectable(options)
              .makeFetchable(options)
              .makeAutoFetchable(options);
        }

      });
    }

  };

  return ResourceMixin;

});
