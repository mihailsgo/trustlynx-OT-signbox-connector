/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/backbone',
    'csui/lib/underscore'
], function (Backbone, _) {

    var ChartControlsModel = Backbone.Model.extend({

        defaults: {
            active_column: '',
            active_column_formatted: '',
            theme_name: '',
            count_column: '',
            column_names: [],
            column_names_formatted: [],
            sort_by: 'Count',
            sort_order: 'desc',
            view_value_as_percentage: false,
            group_after: 10,
        },
        constructor: function ChartControlsModel(attributes, options) {
            Backbone.Model.prototype.constructor.apply(this, arguments);
        },

        updateColumnData: function(columnCollection){
            var columnsExcludingCount = columnCollection.filter(function(model){
                return (model.get("count_column") !== true);
            });

            this.set({
                column_names_formatted: _.map(columnsExcludingCount, function(model){
                    return model.get("name_formatted") || model.get("name");
                }),
                column_names: _.map(columnsExcludingCount, function(model){
                    return model.get("name");
                }),
                active_column: columnCollection.getActiveColumn(),
                active_column_formatted: columnCollection.getActiveColumnFormatted(),
                count_column: columnCollection.getCountColumn(),
                count_column_formatted: columnCollection.getCountColumnFormatted()
            });
        }
    });

    return ChartControlsModel;

});
