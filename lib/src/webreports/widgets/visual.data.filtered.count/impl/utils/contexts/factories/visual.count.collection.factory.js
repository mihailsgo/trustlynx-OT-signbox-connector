/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/contexts/factories/factory',
    'csui/utils/contexts/factories/connector',
    'webreports/widgets/visual.data.filtered.count/impl/models/visual.count/chart.collection/chart.collection',
    'webreports/widgets/visual.data.filtered.count/impl/models/visual.count/column.collection/column.collection'

], function (module,_, Backbone, CollectionFactory, ConnectorFactory, VisualCountChartCollection, VisualCountColumnCollection) {

    var VisualCountCollectionFactory = CollectionFactory.extend({
        propertyPrefix: 'webreportsVisualCount',

        constructor: function VisualCountCollectionFactory(context, options) {
            CollectionFactory.prototype.constructor.apply(this, arguments);
            var connector = context.getObject(ConnectorFactory, options);
            options.connector = connector;
            var webreportsVisualCount = this.options.webreportsVisualCount || {};

            if (!(webreportsVisualCount instanceof Backbone.Collection)) {
                var config = module.config();
                webreportsVisualCount = new VisualCountChartCollection(webreportsVisualCount.models, _.extend({
                    connector: connector}, webreportsVisualCount.attributes, config.options, {
                    autoreset: true
                }));

                var webreportsVisualCountColumns = this.options.columnCollection || {};

                if (!(webreportsVisualCountColumns instanceof Backbone.Collection)) {
                    webreportsVisualCount.columnCollection = new VisualCountColumnCollection();
                }
            }
            this.property = webreportsVisualCount;
        },

        fetch: function (options) {

            options = _.extend({
                headers: {}
            }, options);
            _.extend(options.headers, {
                'X-OriginParams': location.search
            });

            return this.property.fetch(options);
        }

    });

    return VisualCountCollectionFactory;

});
