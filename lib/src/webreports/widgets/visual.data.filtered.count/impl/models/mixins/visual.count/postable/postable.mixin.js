/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
        'webreports/utils/url.webreports'
], function (_,
             UrlWebReports) {
    "use strict";

    var VisualCountPostableMixin = {

        mixin: function (prototype) {
            var originalFetch = prototype.fetch;

            prototype.fetch = function (options) {
                options || (options = {});

                var requestExtensions,
                    data = {
                        format: 'webreport',
                        method: 'GET'
                    },
                    chartQueryParms = this.getFilteredCountQuery(options);

                data = _.extend(data, chartQueryParms);

                requestExtensions = {
                    type:'POST',
                    data: data
                };
                if (options){
                    _.extend(options,requestExtensions);
                } else {
                    options = requestExtensions;
                }

                return originalFetch.call(this, options);
            };

            return _.extend(prototype, {

                getFilteredCountQuery: function(options){
                    var postData = {},
                        context = this.options.context || undefined,
                        csuiContainerID = UrlWebReports.getCurrentContainerID(context),
                        wrParameters = this.options.parameters || [],
                        parameterData = UrlWebReports.getWebReportParametersAsData(wrParameters);
                    if (!_.isUndefined(csuiContainerID)){
                        postData = _.extend(postData, {csuiContainerID: csuiContainerID} );
                    }
                    _.extend(postData, parameterData, this.getFilteredCountParms());

                    return postData;
                },

                getFilteredCountParms: function(){
                    var parms = {};

                    parms.filterable = (this.options.filterable === true);
                    parms.expandable = (this.options.expandable === true);

                    _.extend(parms, this.chartControlsModel.attributes);

                    if (parms.sort_by === 'ordinal' ){
                        parms.sort_by = parms.active_column;
                    }

                    parms.fc_filters = JSON.stringify(this.getFCFilters());

                    parms.total_count = this.getTotalCount();

                    return parms;
                }

            });
        }

    };

    return VisualCountPostableMixin;

});
