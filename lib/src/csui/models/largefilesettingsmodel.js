/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/server.adaptors/largefilesettings.mixin'
], function (_, $, Backbone, Url, ConnectableMixin, FetchableMixin, ServerAdaptorMixin) {
  "use strict";

  var LargeFileSettingsModel = Backbone.Model.extend({

    constructor: function LargeFileSettingsModel(models, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    }
  });

  ConnectableMixin.mixin(LargeFileSettingsModel.prototype);
  FetchableMixin.mixin(LargeFileSettingsModel.prototype);
  ServerAdaptorMixin.mixin(LargeFileSettingsModel.prototype);

  _.extend(LargeFileSettingsModel.prototype, {

    isFetchable: function () {
      return !this.get('largeFileSettings');
    }

  });

  return LargeFileSettingsModel;

});