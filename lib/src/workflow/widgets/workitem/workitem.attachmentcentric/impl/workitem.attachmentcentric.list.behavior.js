/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette'
], function (_, $, Backbone, Marionette) {
  'use strict';

  var AttachmentMetadataNavigationListBehavior = Marionette.Behavior.extend({

    constructor: function MetadataNavigationListBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      _.extend(view, {

        onBeforeShow: function () {
          this._showChildViews();
        },

        onBeforeDestroy: function () {
          if (this.mdv && this.mdv.internal) {
            this.mdv.destroy();
          }
          if (this.mdn) {
            this.mdn.destroy();
          }
        },

        _showChildViews: function () {
          this.navigationRegion.show(this.mdn);
          if (this.collection.length > 0){
          this.contentRegion.show(this.mdv);
        }
        }

      });
    } 

  });

  return AttachmentMetadataNavigationListBehavior;
});
