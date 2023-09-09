/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3', 'hbs!csui/controls/charts/visual.count/impl/visual.count.patterndef'
], function(Marionette, template){
    'use strict';

    var VisualCountPatterndefView = Marionette.View.extend({

        className: 'csui-visual-count-patterndef-container',

        template: template,

        constructor: function VisualCountPatterndefView(options){

            this.viewId = options.viewId;
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        templateContext: function(options) {
            return {
                viewId: this.viewId
            };
        }
    });

    return VisualCountPatterndefView;

});