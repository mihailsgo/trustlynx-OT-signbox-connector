/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore",
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/widgets/metadata/impl/audit/metadata.audit.view'
], function (module, $, _, Backbone, Marionette, MetadataAuditTableView) {
  'use strict';

  var MetadataAuditView = MetadataAuditTableView.extend({

    constructor: function MetadataAuditView(options) {
      MetadataAuditTableView.prototype.constructor.apply(this, arguments);
    }
  },
  {
    enabled: function (options) {
      var config = module.config();
      _.defaults(config, {
        enabled: true
      });
      if (config.enabled === false) {
        return false;
      }
      return !!options.node.get('id');
    }
  }
  );
  return MetadataAuditView;

});
