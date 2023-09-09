/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/controls.list.item.view'
], function(Marionette, VisualCountControlsListItemView){
    'use strict';

    var VisualCountControlListView = Marionette.CollectionView.extend({

        tagName: 'ul',

        className: 'webreports-visual-count-controls-list',

        childView: VisualCountControlsListItemView,

        childViewOptions: function(){
          return {
              originatingView: this.options.originatingView
          };
        },

        constructor: function VisualCountSelectListView(options){
            Marionette.CollectionView.prototype.constructor.apply(this, arguments);
        }
    });

    return VisualCountControlListView;

});