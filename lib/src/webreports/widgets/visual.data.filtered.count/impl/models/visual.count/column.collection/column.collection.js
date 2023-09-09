/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/backbone',
    'csui/lib/underscore',
    'webreports/widgets/visual.data.filtered.count/impl/models/visual.count/column.collection/column.model'
], function (Backbone, _, VisualCountColumnModel) {

    var VisualCountColumnCollection = Backbone.Collection.extend({
        constructor: function VisualCountColumnCollection(models, options) {
            Backbone.Collection.prototype.constructor.apply(this, arguments);

        },

        model: VisualCountColumnModel,

        getActiveColumn: function(){
            var activeColumnName,
                activeColumnModel;

            activeColumnModel = this.findWhere({active_column:true});

            if (activeColumnModel){
                activeColumnName = activeColumnModel.get("name");
            }

            return activeColumnName;
        },

        getActiveColumnFormatted: function(){
            var activeColumnName,
                activeColumnModel;

            activeColumnModel = this.findWhere({active_column:true});

            if (activeColumnModel){
                activeColumnName = activeColumnModel.get("name_formatted");
            }

            return activeColumnName;
        },

        getCountColumn: function(){
            var countColumnName,
                countColumnModel;

            countColumnModel = this.findWhere({count_column:true});

            if (countColumnModel){
                countColumnName = countColumnModel.get("name");
            }

            return countColumnName;
        },

        getCountColumnFormatted: function(){
            var countColumnName,
                countColumnModel;

            countColumnModel = this.findWhere({count_column:true});

            if (countColumnModel){
                countColumnName = countColumnModel.get("name_formatted");
            }

            return countColumnName;
        },

        updateActiveColumn: function(activeColumn){
            var columnModels = this.models;
            _.each(columnModels, function(columnModel){
                if (columnModel.get("active_column") === true && columnModel.get("name") !== activeColumn){
                    columnModel.set({"active_column":false});
                }

                if (columnModel.get("name") === activeColumn){
                    columnModel.set({"active_column":true});
                }
            });

            this.set(columnModels);

        },

    });

    return VisualCountColumnCollection;

});
