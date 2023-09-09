/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3',
    'csui/lib/underscore',
], function(Marionette, _){
    'use strict';

    var VisualCountControlsOption = Marionette.View.extend({

        tagName: 'option',

        template: _.noop,

        className: 'webreports-visual-count-controls-option',

        constructor: function VisualCountControlsOption(options){
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        attributes: function(){
            var model = this.model;

            return {
                value: model.get("value"),
                selected: model.get("selected")
            };
        },

        onRender: function(){
            this.$el.text(this.model.get("label"));
        }
    });

    return VisualCountControlsOption;

});