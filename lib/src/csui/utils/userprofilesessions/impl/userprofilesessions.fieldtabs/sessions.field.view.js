/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/userprofilesessions/impl/userprofilesessions.model',
  'i18n!csui/utils/userprofilesessions/impl/nls/lang',
  'hbs!csui/utils/userprofilesessions/impl/sessions.field',
  'css!csui/utils/userprofilesessions/impl/userprofilesessionstab'
], function ($, _, Marionette, UserProfileSessionsModel, lang, Template) {
  "use strict";

  var SessionsFieldView = Marionette.ItemView.extend({

    className: 'user-profile-sessions-field-view',
    template: Template,
    tagName: 'div',
    
    templateHelpers: function(){
      return{
        activeSessionsTitle: lang.activeSessionsTitle,
        previousSessionsTitle: lang.previousSessionsTitle,
        createTime: lang.createTime,
        lastActivity: lang.lastActivity,
        duration: lang.duration,
        lastLogin: lang.lastLogin,
        activeSessionsRecord: this.model.get("active_sessions"), 
        activeSessionsDuration: this.model.get("active_session_duration"),
        previousSessionsRecord: this.model.get("previous_sessions")
      };
    },
    constructor: function (options) {
      this.model = new UserProfileSessionsModel(options);
      this.model.fetch({
        prepare: false,
        async: false
      });
      Marionette.ItemView.prototype.constructor.apply(this);
    },

    onShow: function () {
      this.render();
    }

  });

  return SessionsFieldView;
});