/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
"csui/controls/list/simplelist.view",
  "csui/controls/listitem/listitemstandard.view",
  'csui/utils/nodesprites',
  'i18n!xecmpf/widgets/scan/impl/nls/lang',
  'css!xecmpf/widgets/scan/impl/scan'
], function (_,  SimpleListView, StandardListItem, NodeSpriteCollection, Lang) {

  var ScanListView = SimpleListView.extend({
    constructor: function ScanListView(options) {
      if (!options) {
        options = {};
      }
      SimpleListView.prototype.constructor.apply(this, arguments);
    },

    className: 'xecmpf-scan-list',
    templateHelpers: function () {
      return {        
        hideSearch: true,
      };
    },

    emptyViewOptions: {
      text: Lang.defaultTextForDesktop
    },

    childView: StandardListItem,

    childViewOptions: function () {
      return {
        templateHelpers: function () {
          return {
            name: this.model.get('name'),
            icon:  NodeSpriteCollection.findClassByNode(this.model),
            enableIcon: true
          };
        }
      }
    }

  });
  return ScanListView;
});