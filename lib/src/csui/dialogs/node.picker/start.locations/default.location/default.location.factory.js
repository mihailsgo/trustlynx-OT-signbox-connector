/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/dialogs/node.picker/start.locations/location.base.factory',
  'csui/models/node.children2/node.children2', 'csui/utils/commands',
  'i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang'
], function (_, $, LocationBaseFactory, NodeChildrenCollection, commands, lang) {
  "use strict";

  var DefaultLocationFactory = LocationBaseFactory.extend({

    updateLocationModel: function (model) {
      var container = this.options.container;
      model.set({
        hide: true,
        invalid: false
      });
      return $.Deferred().resolve().promise();
    },

    getLocationParameters: function () {
      var container = this.options.container;
      var children = new NodeChildrenCollection(undefined, {
        node: this.options.container,
        autoreset: true,
        expand: {
          properties: ['original_id', 'parent_id']
        },
        fields: {
          properties: []
        },
        commands: 'default,open'
      });
      container.set('unselectable', false);
      return {
        container: container,
        collection: children,
        locationName: lang.labelCurrentLocation
      };
    }
  });
  return DefaultLocationFactory;
});
