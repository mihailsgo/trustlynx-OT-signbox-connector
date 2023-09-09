/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore",
  'csui/lib/backbone',
  'csui/lib/marionette',
  'xecmpf/widgets/workflows/impl/metadata.workflows.view'
], function (module, $, _, Backbone, Marionette, MetadataWorkflowTableView) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    isAIBConfigured: false
  });

  var MetadataWorkflowView = MetadataWorkflowTableView.extend({

        constructor: function MetadataWorkflowView(options) {
          MetadataWorkflowTableView.prototype.constructor.apply(this, arguments);
        }
      },
      {
        enabled: function (options) {
          return !!config.isAIBConfigured;
        }
      }
  );
  return MetadataWorkflowView;

});