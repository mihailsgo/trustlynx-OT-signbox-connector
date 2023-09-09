/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/underscore",
  'csui/widgets/metadata/impl/releases/metadata.releases.view',
  'csui/utils/commands/compound.document/compound.document.util'
], function (module, _, MetadataReleasesTableView, CompoundDocumentsUtil) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enabled: true
  });

  var MetadataReleasesView = MetadataReleasesTableView.extend({

    constructor: function MetadataReleasesView() {
      MetadataReleasesTableView.prototype.constructor.apply(this, arguments);
    }
  },
    {
      enabled: function (options) {
        if (config.enabled === false) {
          return false;
        }
        if (options.node.get('type') === 136) {
          return CompoundDocumentsUtil.verifyNodeAncestors(options.context);
        }
        else {
          return false;
        }
      }
    }
  );
  return MetadataReleasesView;

});
