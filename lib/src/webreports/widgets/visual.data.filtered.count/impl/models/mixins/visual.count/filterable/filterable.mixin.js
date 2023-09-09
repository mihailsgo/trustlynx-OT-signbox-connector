/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
    'csui/lib/backbone',
    'csui/models/facets',
    'csui/models/facettopics',
    'webreports/utils/general.utils',
    'i18n!webreports/widgets/visual.data.filtered.count/impl/models/mixins/visual.count/filterable/nls/lang'
], function (_,
             Backbone,
             FacetCollection,
             FacetTopicCollection,
             generalUtils,
             lang) {
    "use strict";

    var VisualCountFilterableMixin = {

        mixin: function (prototype) {
            return _.extend(prototype, {

                makeFilterable: function () {
                    this.facetCollection = new FacetCollection();
                    this.facetCollection.filters = [];
                },

                setFacetData: function (filteredData) {
                    var availableValues = [],
                        facets = this.columnCollection.toJSON(),
                        activeColumn = _.findWhere(facets, {active_column: true}),
                        activeColumnName = activeColumn.name,
                        facetModel = this.facetCollection.findWhere({id: activeColumn.id}),
                        facetModelInCollection = !_.isUndefined(facetModel),
                        filterStillApplied = !_.isUndefined(_.findWhere(this.facetCollection.filters, {id: activeColumn.id})),
                        countColumn = this.columnCollection.getCountColumn(),
                        activeFacet = {},
                        facetObj = {};

                    if (!facetModelInCollection || (facetModelInCollection && !filterStillApplied)) {

                        activeFacet[activeColumn.id] = _.map(filteredData, _.bind(function (groupedItem) {
                            var activeColumnFormattedValue = generalUtils.getCaseInsensitiveProperty(groupedItem, activeColumn.name + "_formatted"),
                                activeColumnValue = generalUtils.getCaseInsensitiveProperty(groupedItem, activeColumnName);

                            return {
                                name: activeColumnFormattedValue || activeColumnValue,
                                value: (activeColumnValue === null) ? "" : activeColumnValue.toString(),
                                valueNative: activeColumnValue,
                                total: groupedItem[countColumn],
                                percentage: this.getPercentageOfTotal(groupedItem[countColumn])
                            };
                        }, this));

                        activeFacet[activeColumn.id] = _.reject(activeFacet[activeColumn.id], function (facet) {
                            return facet.name === lang.other;
                        });

                        availableValues[0] = activeFacet;

                        _.each(facets, function (facet) {
                            facetObj[facet.id] = facet;
                        });

                        _.each(availableValues, _.bind(function (item) {
                            var id = _.keys(item)[0],
                                topics = item[id] || [],
                                object = {};

                            object[id] = facetObj[id];
                            facetObj[id].name = facetObj[id].name_formatted;

                            facetModel = new Backbone.Model(facetObj[id]);
                            facetModel.topics = new FacetTopicCollection(topics);
                            facetModel.set({
                                "topics": topics,
                                "total_displayable": topics.length,
                                "items_to_show": 10
                            });
                        }, this));
                    }

                    facetModel = this._setAsSelected(facetModel);
                    facetModel.topics.reset(facetModel.get("topics"));

                    if (this.facetCollection) {
                        var otherFilteredFacets = this._getOtherFilteredFacets();

                        otherFilteredFacets.push(facetModel);

                        this.facetCollection.reset(otherFilteredFacets);
                    } else {
                        this.makeFilterable();
                    }
                },
                getFCFilters: function () {
                    return this.unMapFilterData();
                },
                getFacetFilters: function () {
                    return this.facetCollection.filters;
                },
                setFacetFilters: function (filters) {
                    filters = filters || [];

                    if (!this.facetCollection.filters) {
                        this.facetCollection.filters = this.mapFilterData(filters);
                        this.facetCollection.trigger('reset');
                    }
                },
                mapFilterData: function (filters) {
                    return _.map(filters, function (filtersToMap) {
                            return {
                                id: filtersToMap.column.toString(),
                                values: [{id: filtersToMap.value.toString()}]
                            };
                        }
                    );
                },
                unMapFilterData: function () {
                    var fcFilters = [],
                        self = this,
                        filters = this.getFacetFilters();

                    if (filters.length > 0) {

                        _.each(filters, function (filter) {
                            var columnModel = self.columnCollection.findWhere({id: filter.id}),
                                values = _.map(filter.values, function (value) {
                                    return value.id;
                                });

                            values = self.resolveToActualValues(filter.id, values);

                            var unMappedFilter = {
                                column: columnModel.get("name"),
                                operator: 'IN',
                                value: values
                            };
                            fcFilters.push(unMappedFilter);
                        });
                    }

                    return fcFilters;
                },

                getTotalCount: function () {
                    var filteredData = this.filteredData,
                        countColumn = this.columnCollection.getCountColumn();

                    return _.reduce(filteredData, function (memo, value) {
                        return memo + value[countColumn];
                    }, 0);
                },

                getPercentageOfTotal: function (value) {
                    return ((value / this.getTotalCount()) * 100);
                },

                getActualColumnName: function (formattedColumnName) {
                    var actualColumnName = formattedColumnName,
                        columnCollection = this.columnCollection,
                        columnModel = columnCollection.findWhere({name_formatted: formattedColumnName});

                    if (columnModel && (columnModel.get("name") !== columnModel.get("name_formatted"))) {
                        actualColumnName = columnModel.get("name");
                    }

                    return actualColumnName;
                },

                onFiltersUpdated: function () {
                    if (this.grouped_on_server) {
                        this.fetch();
                    } else {
                        this.set(this.sortGroupAndFilter());
                        this.facetCollection.trigger("reset");
                    }
                },

                resolveToActualValues: function (id, formattedValues) {
                    var facetTopicModel,
                        actualValues = [],
                        facetTopicCollection = this._getFacetTopicCollection(id);

                    if (facetTopicCollection) {
                        _.each(formattedValues, function (formattedValue) {
                            facetTopicModel = facetTopicCollection.findWhere({value: formattedValue});
                            actualValues.push(facetTopicModel.get("valueNative"));
                        });
                        return actualValues;
                    } else {
                        return formattedValues;
                    }
                },

                _getFacetTopicCollection: function (id) {
                    var facetModel = this.facetCollection.findWhere({id: id});
                    return facetModel.topics;
                },

                _setAsSelected: function (facetModel) {
                    var self = this,
                        newTopics = [],
                        id = facetModel.get("id"),
                        filters = this.facetCollection.filters,
                        topics = facetModel.get("topics");

                    _.each(topics, function (topic) {
                        var facetModelFilter = _.filter(filters, function (filter) {
                            return filter.id === id;
                        });

                        if (facetModelFilter.length > 0) {
                            var selected = !_.isUndefined(_.findWhere(facetModelFilter[0].values, {id: topic.value}));

                            if (selected === true) {
                                topic.selected = selected;
                                topic.count = null;
                                topic.percentage = null;
                                newTopics.push(topic);
                            }
                        } else {
                            newTopics.push(topic);
                        }
                    });

                    facetModel.set({
                        "topics": newTopics
                    });

                    return facetModel;
                },

                _getOtherFilteredFacets: function () {
                    var activeColumn = this.columnCollection.findWhere({active_column: true}),
                        filters = this.facetCollection.filters;
                    return this.facetCollection.filter(function (facetModel) {
                        return facetModel.get("id") !== activeColumn.get("id") && _.findWhere(filters, {id: facetModel.get("id")});
                    });
                }
            });
        }

    };

    return VisualCountFilterableMixin;

});
