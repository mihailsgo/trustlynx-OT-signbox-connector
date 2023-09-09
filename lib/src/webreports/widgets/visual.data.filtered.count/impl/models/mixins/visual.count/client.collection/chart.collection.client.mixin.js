/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
        'csui/lib/d3',
        'i18n!webreports/widgets/visual.data.filtered.count/impl/models/mixins/visual.count/client.collection/nls/lang'
], function (_,
             d3,
             lang) {
    "use strict";

    var VisualCountClientCollectionMixin = {

        mixin: function (prototype) {
            return _.extend(prototype, {

                nest: function(dataset,activeColumn) {

                    var nestedData = [],
                        index,
                        key,
                        count,
                        initialNestedItem = {},
                        nestedItem = {},
                        countColumn = this.columnCollection.getCountColumn(),
                        activeColumnFormatted = activeColumn + "_formatted",
                        countColumnFormatted = countColumn + "_formatted";

                    _.each(dataset, _.bind(function(row){

                        key = this._removeEmptyValues(row[activeColumn]);
                        index = _.findIndex(nestedData, function(nestedRow){
                            return nestedRow[activeColumn] === key;
                        });
                        if (index === -1){
                            initialNestedItem[activeColumn] = key;
                            initialNestedItem[activeColumnFormatted] = key.toString();
                            initialNestedItem[countColumn] = 1;
                            initialNestedItem[countColumnFormatted] = "1";
                            nestedData.push(initialNestedItem);
                            initialNestedItem = {};
                        } else {
                            nestedItem = nestedData[index];
                            count = nestedItem[countColumn];
                            count = count + 1;
                            nestedItem[countColumn] = count;
                            nestedItem[countColumnFormatted] = count.toString();
                            nestedData[index] = nestedItem;
                        }

                    },this));

                    return nestedData;
                },

                filterBy: function(dataset,filters) {

                    var column = null,
                        value = null,
                        operator = null;

                    function dataFiltered(d) {
                        var filtered,
                            currentValue = this._removeEmptyValues(d[column]);
                        switch(operator) {
                            case '==':
                                filtered = currentValue === value;
                                break;
                            case 'IN':
                                filtered = (value.indexOf(currentValue) !== -1);
                                break;
                            default:
                                filtered = (value.indexOf(currentValue) !== -1);
                        }

                        return filtered;
                    }

                    _.each(filters,_.bind(function(item) {
                        value = this._removeEmptyValues(item.value);
                        column = item.column;
                        operator = item.operator;
                        dataset = dataset.filter(_.bind(dataFiltered, this));
                    }, this));

                    return dataset;
                },

                sortNest: function(dataset,sortOptions) {
                    var activeColumn = this.columnCollection.getActiveColumn(),
                        countColumn = this.columnCollection.getCountColumn(),
                        sorted = [],
                        sortBy,
                        sortDir;

                    sortBy = sortOptions.sortBy;
                    sortDir = sortOptions.sortOrder;

                    dataset = dataset.sort(function(a,b) {
                        switch (sortBy.toLowerCase()) {
                            case 'ordinal':
                                if (isNaN(a[activeColumn])) {
                                    sorted = d3.ascending(a[activeColumn],b[activeColumn]);
                                }
                                else {
                                    sorted = a[activeColumn] - b[activeColumn];
                                }
                                break;
                            case 'count':
                                sorted = a[countColumn] - b[countColumn];
                                break;
                            default:
                        }
                        return sorted;
                    });
                    return (sortDir === 'asc') ? dataset : dataset.reverse();
                },

                groupOutlyingValues: function(dataset,maxItems) {
                    if (dataset.length > maxItems+1 && maxItems > -1) { // only sensible to group values if there are more than 2 of them
                        var activeColumn = this.columnCollection.getActiveColumn(),
                            countColumn = this.columnCollection.getCountColumn(),
                            d1 = dataset.slice(0,maxItems),
                            d2 = dataset.slice(maxItems),
                            oValue = _.pluck(d2,countColumn),
                            oTotal = _.reduce(oValue,function(memo,item) {
                                return memo + item;
                            },0),
                            others = {};

                        others[activeColumn] = "ga_other";
                        others[activeColumn + "_formatted"] = lang.other;
                        others[countColumn] = oTotal;
                        others[countColumn + "_formatted"] = oTotal.toString();

                        d1.push(others);
                        return d1;
                    }
                    else {
                        return dataset;
                    }
                },

                _removeEmptyValues: function(value){
                    return (value === null ||value === "" || value === undefined) ? lang.noValue :value;
                }

            });
        }

    };

    return VisualCountClientCollectionMixin;

});
