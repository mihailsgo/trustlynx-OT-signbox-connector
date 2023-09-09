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
          return Url.combine(url, 'search/members/info?enterprise_slices=true');
        },

        parse: function (response, options) {
          var res = response.results,
              sliceLabels = res.slices,
              returnData  = {},
              slices      = [];
          returnData.search_forms = {};

          $.each(sliceLabels, function (sliceIdx) {
            slices.push({
              sliceId: sliceLabels[sliceIdx].id,
              sliceDisplayName: sliceLabels[sliceIdx].name
            });
          });

          returnData = {
            search_forms: {
              recent_search_forms: this.createSearchFormsList(res.recent_search_forms),
              personal_search_forms: this.createSearchFormsList(res.personal_search_forms),
              system_search_forms: this.createSearchFormsList(res.system_search_forms)
            },
            slices: slices,
            search_bar_settings: res.search_bar_settings
          };
          return returnData;
        },

        createSearchFormsList: function (list) {
          var form = [];
          $.each(list, function (listIdx) {
            if (list[listIdx].name !== null || !!list[listIdx].name) {
              form.push(list[listIdx]);
            }
          });
          return form;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});
