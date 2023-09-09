/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette3',
        'csui/lib/backbone',
        'csui/lib/underscore',
        'csui/utils/commands',
        'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/visual.count.button.view',
        'hbs!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/visual.count',
        'css!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/visual.count'
], function (Marionette, Backbone, _, commands, VisualCountButtonView, template){

    var VisualCountFooterView = Marionette.CollectionView.extend({

        className: 'webreports-visual-count-footer binf-modal-footer',

        template: template,

        childView: VisualCountButtonView,

        constructor: function VisualCountFooterView(options) {
            this.collection = this._createCommandCollection(options);
            Marionette.CollectionView.prototype.constructor.apply(this, arguments);
        },

        _createCommandCollection: function(options){
            var commandCollection,
                toolbarItems = options.toolbarItems;

            if (toolbarItems && _.has(toolbarItems, "footer")){
                commandCollection = toolbarItems.footer.collection;
                if (commandCollection){
                    var disabledToolItem = commandCollection.findWhere({signature: 'disabled'});
                    if (disabledToolItem){
                        commandCollection.remove(disabledToolItem);
                    }
                }
            } else {
                commandCollection = new Backbone.Collection();
            }

            return commandCollection;
        },

        onChildviewClickButton: function(childView) {
            var options = this.options,
                originatingView = options.originatingView;

            if (originatingView){
                originatingView.trigger("button:clicked", childView, options);
            } else {
                throw 'VisualCountView requires an originatingView if buttons are used';
            }
        }

    });

    return VisualCountFooterView;

});
