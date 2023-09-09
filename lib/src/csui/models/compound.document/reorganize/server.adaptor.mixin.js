/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
  ], function (_, $, Url) {
    'use strict';

    var ServerAdaptorMixin = {

        mixin: function (prototype) {

        return _.extend(prototype, {
            makeServerAdaptor: function (options) {
            return this;
            },

            url: function () {
                var url = this.connector.connection.url.replace('/v1', '/v2');
                var query = Url.combineQueryString({
                    expand: 'properties{original_id}'
                });
                return Url.combine(url, 'nodes/' + this.options.nodeId + '/nodes/all?' + query);
            },

            parse: function (response, options) {
            var res = response.results;
            return res;
            },
        });
        }
    };
    return ServerAdaptorMixin;
});