/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore",
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/widgets/metadata/impl/versions/metadata.versions.view',
  'csui/models/version'
], function (module, $, _, Backbone, Marionette, MetadataVersionsTableView, VersionModel) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enabled: true
  });

  var MetadataVersionsView = MetadataVersionsTableView.extend({

    constructor: function MetadataVersionsView(options) {
      MetadataVersionsTableView.prototype.constructor.apply(this, arguments);
    }
  },
  {
    enabled: function (options) {
      if (config.enabled === false || options.enabled === false) {
        return false;
      }
      if (options.node instanceof VersionModel) {
        return false;
      }
      return _.contains([144, 736, 749, 5574], options.node.get('type'));
    }
  }
  );
  return MetadataVersionsView;

});
