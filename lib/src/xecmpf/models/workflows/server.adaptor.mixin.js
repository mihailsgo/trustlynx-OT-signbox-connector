/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },
        url: function () {

          var url   = this.options.node.connector.getConnectionUrl().getApiBase('v2'),
              query = Url.combineQueryString(
                  {
                    status: this.options.status
                  }
              );
          return Url.combine(url, 'nodes/xecmpfappintgn/workflows', this.options.node.get('id'),
              "?" + query);
        },

        parse: function (response, options) {

          _.each(response.results, function (workflow) {
            workflow.type = '678'; // TODO: update it from RestAPI
            workflow.inactive = false;
            workflow.id = workflow.WorkflowID;
            workflow.defaultActionUrl = workflow.OpenURL
          });

          this.columns && this.columns.resetColumnsV2(response, this.options);

          return response.results;
        },

        isFetchable: function () {
          return !!this.options;
        },

      });
    }

  };

  return ServerAdaptorMixin;
});