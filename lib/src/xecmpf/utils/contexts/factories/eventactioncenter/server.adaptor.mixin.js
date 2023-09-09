/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/utils/url','i18n!xecmpf/utils/commands/nls/localized.strings',
], function (_, Url,lang) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function (options) {

          var restUrl = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'),
              'eventactioncenter/eventdefinitions');
          return restUrl;

        },

        parse: function (response) {
          this.options.fetched = false;
          var result = [];
          var NoPlanMessage;
          var result_holder  = {};          
          result_holder.data = {};
     for(var key in response.results.data){                        
         var resultp =  response.results.data[key].filter(function(res){
           return res.status === 1;
          });                        
         result_holder.data[key] = resultp;
         resultp.forEach(function (ele, index) {
          if (ele.status === 1) {
            result.push({
              id: ele.dataID,
              system_name: ele.namespace,
              namespace:ele.namespace,
              name: ele.name,
              event_name:ele.name,
              action_plan_text: ele.actionPlanCountText,
              action_plan_count: ele.actionPlanCount,
              status: 0,
              event_def_id:ele.dataID,
              type: ele.type
            });
          }
        });
       }
   

          return result;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});
