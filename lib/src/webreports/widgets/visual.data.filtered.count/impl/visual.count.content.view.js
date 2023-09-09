/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.tile.view',
    'webreports/mixins/webreports.view.mixin',
    'webreports/widgets/visual.data.filtered.count/impl/mixins/visual.count.view.mixin'
], function (VisualCountTileView,
             WebReportsViewMixin,
             VisualCountViewMixin) {

    var VisualCountContentView = VisualCountTileView.extend({

        constructor: function VisualCountContentView(options) {

            var tileOptions = this.setVisualCountWidgetOptions(options);

            VisualCountTileView.prototype.constructor.apply(this, [tileOptions]);

            this.options = tileOptions;
        }
    });

    WebReportsViewMixin.mixin(VisualCountContentView.prototype);
    VisualCountViewMixin.mixin(VisualCountContentView.prototype);

    return VisualCountContentView;

});
