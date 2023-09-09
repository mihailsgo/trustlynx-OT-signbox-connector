csui.define(['csui/lib/underscore',
  'csui/dialogs/node.picker/start.locations/node.base.factory',
  'i18n!conws/dialogs/node.picker/impl/nls/lang',
  'css!conws/utils/icons/icons'
], function (_, NodeBaseFactory, lang) {
  "use strict";

  var FacetsVolumeFactory = NodeBaseFactory.extend({

    constructor: function FacetsVolumeFactory(options) {
      options = _.defaults({
        node: {
          id: 'volume',
          type: 901
        },
        icon: 'facets_volume',
        unselectable: false,
        defaultName: lang.labelFacetsVolume
      }, options);
      NodeBaseFactory.prototype.constructor.call(this, options);
    },

    updateLocationModel: function (model) {
      return NodeBaseFactory.prototype.updateLocationModel.apply(this,arguments);
    }


  });

  return FacetsVolumeFactory;

});
