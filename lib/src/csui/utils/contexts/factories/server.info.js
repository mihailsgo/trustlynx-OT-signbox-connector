/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/backbone',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/factory',
  'csui/models/server.info'
], function (Backbone, ConnectorFactory, ModelFactory, ServerInfoModel) {

  var ServerInfoModelFactory = ModelFactory.extend({

    propertyPrefix: 'serverInfo',

    constructor: function ServerInfoModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var connector       = context.getObject(ConnectorFactory, {
            permanent: true
          }),
          serverInfoModel = this.options.serverInfoModel || {};

      if (!(serverInfoModel instanceof Backbone.Model)) {
        serverInfoModel = new ServerInfoModel(undefined, {connector: connector});
      }
      this.property = serverInfoModel;
    }

  });

  return ServerInfoModelFactory;
});
