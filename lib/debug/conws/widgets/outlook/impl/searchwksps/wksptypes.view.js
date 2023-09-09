csui.define([
    'csui/lib/underscore',
    "csui/lib/jquery",
    'csui/lib/backbone',
    'csui/lib/marionette',
    'hbs!conws/widgets/outlook/impl/searchwksps/impl/wksptype' 
], function (_, $, Backbone, Marionette, template) {

    var WkspTypesView = Marionette.LayoutView.extend({
        tagName: 'option',

        template: template,

        templateHelpers: function () {
            return {
                value: this.id,
                name: this.name
            }
        },

        initialize: function (options) {
            var wkspTypes = options.model.get('results');
            this.collection = new Backbone.Collection(wkspTypes);
        },

        constructor: function WkspTypesView(options) {
            this.model = options.model;
            this.name = options.model.get('data').properties.wksp_type_name;
            this.id = options.model.get('data').properties.wksp_type_id;

            Marionette.LayoutView.prototype.constructor.call(this, options);
        },

        onRender: function () {
            // Get rid of that pesky wrapping-div.
            // Assumes 1 child element present in template.
            this.$el = this.$el.children();
            // Unwrap the element to prevent infinitely 
            // nesting elements during re-render.
            this.$el.unwrap();
            this.setElement(this.$el);
        }
    });

    return WkspTypesView;

});