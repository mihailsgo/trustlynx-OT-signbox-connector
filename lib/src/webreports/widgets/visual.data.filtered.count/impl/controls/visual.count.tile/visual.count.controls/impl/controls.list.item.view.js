/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3',
    'csui/lib/backbone',
    'csui/lib/underscore',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/controls.select.view',
    'hbs!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/controls.list.item'
], function(Marionette, Backbone, _, VisualCountControlsSelectView, template){
    'use strict';

    var VisualCountListItemView = Marionette.View.extend({

        tagName: 'li',

        template: template,

        className: 'webreports-visual-count-controls-list-item',

        constructor: function VisualCountSelectListItemView(options){
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        regions: {
            selectList: {
                el: '.webreports-visual-count-controls-select',
                replaceElement: true
            }
        },

        templateContext: function(){
            var model = this.model;

            return {
                id: model.get("id"),
                label: model.get("label"),
                name: model.get("name")
            };
        },

        onRender: function(){
            this.showChildView('selectList', new VisualCountControlsSelectView({
                originatingView: this.options.originatingView,
                collection: new Backbone.Collection(this.model.get("options")),
                model: this.model
            }));
        },
    });

    return VisualCountListItemView;

});