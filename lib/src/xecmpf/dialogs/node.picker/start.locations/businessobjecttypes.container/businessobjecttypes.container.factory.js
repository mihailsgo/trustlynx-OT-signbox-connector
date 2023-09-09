/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/dialogs/node.picker/start.locations/node.base.factory',
  'xecmpf/dialogs/node.picker/start.locations/businessobjecttypes.container/impl/businessobjecttypes.collection',
  'i18n!xecmpf/dialogs/node.picker/start.locations/impl/nls/lang'
], function (_, $, NodeBaseFactory, BusinessObjectTypesCollection,lang) {
  "use strict";
  var BusinessObjectTypesContainerFactory = NodeBaseFactory.extend({
    constructor: function BusinessWorkspaceVolumeFactory(options) {
      options = _.defaults({
        node: {
          type: 888
        }
      }, options);
      NodeBaseFactory.prototype.constructor.call(this, options);
    },
    updateLocationModel: function (model) {
      model.set({
        name: lang.labelBusinessObjectTypes,
        icon: "xecmpf-icon_businessobjecttype"
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function () {
      var nodes = new BusinessObjectTypesCollection(undefined, {
        connector: this.options.connector,
        autoreset: true,
        expand: ['node']
      });
      return {
        container: null,
        collection: nodes,
        locationName: lang.labelBusinessObjectTypes
      };
    }
  });
  return BusinessObjectTypesContainerFactory;
});

