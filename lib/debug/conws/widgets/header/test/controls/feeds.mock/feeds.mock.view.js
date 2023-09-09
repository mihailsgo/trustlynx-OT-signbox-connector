// Shows the latest activity feeds
csui.define([
    'csui/lib/backbone',
    'csui/lib/marionette',
    'hbs!conws/widgets/header/test/controls/feeds.mock/feeds.mock',
    'css!conws/widgets/header/test/controls/feeds.mock/feeds.mock'
    ], function(Backbone, Marionette, feedsTemplate ){

    var FeedsView = Marionette.ItemView.extend({

        className: 'conws-feeds',

        template: feedsTemplate,

        constructor: function FeedsView(options){

            // default options
            options || (options = {});

            // create model
            if (!options.model){
                options.model = new Backbone.Model({});
            }

            // set prototype
            Marionette.ItemView.prototype.constructor.call(this, options);
        }
    });

    return FeedsView;
});
