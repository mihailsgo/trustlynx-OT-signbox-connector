csui.define([
    'csui/utils/contexts/factories/factory',
    'csui/utils/contexts/factories/node',
    'conws/models/categoryforms/categoryforms.model',
    'conws/widgets/metadata/impl/forms.metadata.update.model'
], function (ModelFactory, NodeModelFactory, CategoryFormCollection, MetadataUpdateFormModel) {

    var MetadataUpdateFormFactory = ModelFactory.extend({

        // unique prefix for the metadata model instance.
        propertyPrefix: 'forms.metadata.update',

        constructor: function SelectedMetadataFormFactory(context, options) {

            ModelFactory.prototype.constructor.apply(this, arguments);

            var node = context.getModel(NodeModelFactory);
            this.property = new MetadataUpdateFormModel(undefined, {
                node: node,
                metadataConfig: options[this.propertyPrefix].metadataConfig,
                autofetch: true,
                autoreset: true
            });

        },

        fetch: function (options) {
            // fetch the model contents exposed by this factory.
            return this.property.fetch(options);
        }
    });

    return MetadataUpdateFormFactory;
});
