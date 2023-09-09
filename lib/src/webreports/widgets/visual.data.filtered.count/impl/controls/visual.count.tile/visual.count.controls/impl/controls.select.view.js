/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3',
    'csui/lib/underscore',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/control.options.view',
], function (Marionette, _, VisualCountOptionsView) {

    var VisualCountControlsSelectView = Marionette.CollectionView.extend({

        className: "webreports-visual-count-controls-select",

        tagName: "select",

        template: _.noop,

        attributes: function(){
            return {
                name: this.model.get("name"),
                id: this.model.get("id")
            };
        },

        events: {
            "change": "onOptionChanged"
        },

        constructor: function VisualCountControlsSelectView(options) {
            this.model = options.model;
            Marionette.CollectionView.prototype.constructor.apply(this, arguments);
        },

        childView: VisualCountOptionsView,

        onOptionChanged: function(){
            var selectModel = this.model,
                originatingView = this.options.originatingView,
                optionCollection = this.collection,
                value = this.$el.val();

            originatingView.trigger("option:changed", {
                selectModel: selectModel,
                optionCollection: optionCollection,
                value: value
            });

        }

    });

    return VisualCountControlsSelectView;

});
