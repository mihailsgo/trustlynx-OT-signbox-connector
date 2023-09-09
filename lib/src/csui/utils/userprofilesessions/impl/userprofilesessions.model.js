/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/url',
    'csui/models/mixins/connectable/connectable.mixin',
    'csui/utils/types/date'
  ],
  function ($, _, Backbone, Url, ConnectableMixin, DateType) {
    "use strict";

    var UserProfileSessionsModel = Backbone.Model.extend({

      constructor: function (options) {
        Backbone.Model.prototype.constructor.apply(this, arguments);
        this.set({id: options.userid},{silent: true});
        this.makeConnectable(options);
      },

      url: function () {
        
         var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'members/sessions');
        return url;
      },

      parse: function(response, options) {
        
        var return_value = {};
        var active_sessions = [];
        var previous_sessions = [];
        var response_data = response.results;
        var response_active_sessions = response_data.active_sessions.recs;
        var response_previous_sessions = response_data.previous_sessions.recs;


        if ( response_data.active_sessions.ok == true ){  
                    
          response_active_sessions.forEach(function(element){
            var formatted_rec = {};
            formatted_rec.createTime = DateType.formatExactDateTime(DateType.deserializeDate(element.create_time));
            formatted_rec.lastActivity = DateType.formatExactDateTime(DateType.deserializeDate(element.last_activity));
            formatted_rec.duration = element.duration;
            active_sessions.push(formatted_rec);
          });

        } else {
          var formatted_rec = {
            createTime: response_data.active_sessions.errMsg, 
            lastActivity: response_data.active_sessions.errMsg,
            duration: response_data.active_sessions.errMsg
          };
          
          active_sessions.push(formatted_rec);
        }

        return_value.active_sessions = active_sessions;

        if ( response_data.previous_sessions.ok == true ){  
          
          response_previous_sessions = _.difference(response_previous_sessions, active_sessions);

          response_previous_sessions.forEach(function(element){
            previous_sessions.push(DateType.formatExactDateTime(DateType.deserializeDate(element)));
          });
          return_value.previous_sessions = previous_sessions;

        } else {
          return_value.previous_sessions.push(response_data.previous_sessions.errMsg);
        }

        return return_value;
        
      }
    });

    ConnectableMixin.mixin(UserProfileSessionsModel.prototype);

    return UserProfileSessionsModel;

  });