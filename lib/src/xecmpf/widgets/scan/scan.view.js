/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  "csui/lib/backbone",
  'csui/controls/tile/tile.view',
  'xecmpf/widgets/scan/scan.content.view',
  'csui/utils/perspective/perspective.util',
  'csui/utils/contexts/factories/node',
  'i18n!xecmpf/widgets/scan/impl/nls/lang',
  'csui/models/node/node.model',
  'css!xecmpf/widgets/scan/impl/scan'
], function (_, $, Backbone, TileView, ScanContentView, PerspectiveUtil,
  NodeModelFactory, Lang, NodeModel) {

  var ScanCollection = Backbone.Collection.extend({
    constructor: function (models, options) {
      options || (options = {});
      _.defaults(options, {
        model: NodeModel
      });
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }
  });

  var ScanView = TileView.extend({
    constructor: function ScanView(options) {
      TileView.prototype.constructor.call(this, options);
    },
    contentView: ScanContentView,
    title: Lang.title,
    
    initialize: function () {
      if (this.options.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        this.scanItemsCollection = new ScanCollection([]);

        this._getScanItems().always(_.bind(function () {
          this.scanItemsCollection.reset(this.items);
        }, this));
      }
    },

    _getScanItems: function () {
      var businessObjectTypes = this.options.data.businessobjecttypes;
      var self = this;
      this.items = _.map(businessObjectTypes, function (item) {
        if (item.id) {
          var model = self.options.context.getModel(NodeModelFactory, {
            attributes: {
              id: item.id,
              type: 889
            }
          });
          return model;
        }
      });
      this.items = _.compact(this.items); // to remove any undefined/null items

      var modelPromises = _.map(this.items, function (model) {
        return model.fetch({ suppressError: true });
      });

      var result = $.whenAll.apply($, modelPromises);
      result.always(function () {
        _.each(businessObjectTypes, function (item, index) {
          item.node = self.items[index];
        });
      });
      return result;
    },
    contentViewOptions: function () {
      this.scanItemsCollection = new ScanCollection(this.items);
      var viewoptions = {
        showTitleIcon: false,
        hideSearch: true,
        collection: this.scanItemsCollection
      }
      return viewoptions;
    }
  });
  return ScanView;
});
