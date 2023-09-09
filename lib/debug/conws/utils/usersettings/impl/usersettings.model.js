csui.define(['module',
    'csui/lib/jquery',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/url',
    'csui/utils/log',
    'csui/models/mixins/connectable/connectable.mixin',
    'csui/models/mixins/uploadable/uploadable.mixin',
    'i18n!conws/utils/usersettings/impl/nls/lang'
  ],
  function (module, $, _, Backbone, Url, Log, ConnectableMixin, UploadableMixin, lang) {
    "use strict";

    var log = new Log( module.id );

    var UserSettingsModel = Backbone.Model.extend({

      constructor: function (options) {
        Backbone.Model.prototype.constructor.apply(this, arguments);
        this.set({id: options.userid},{silent: true}); // set some .id so the model not considered new anymore. PUT will be used for saving
        this.makeConnectable(options);
        this.makeUploadable(options);
      },

      validate: function () {
        if (!(this.get('conwsNavigationTreeView') === true || this.get('conwsNavigationTreeView') === false)) {
          var errMsgNav = _.str.sformat(lang.navInvalidAttribute, "conwsNavigationTreeView");
          log.debug(errMsgNav);
          return errMsgNav;
        }
      },

      url: function () {
        var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'members/preferences');
        url = Url.appendQuery(url, "metadata=true&config_name=SmartUI"); // query part will be trimmed for PUT calls
        return url;
      },

      parse: function(response, options) {
        if (Array.isArray(response.results)) {
          // GET
          var data = response.results[0].data;
          var conwsNavigationTreeView = false;
          if (data && data.config_name === 'SmartUI') {
            conwsNavigationTreeView = data.preferences.conwsNavigationTreeView;
          }  else {
            log.debug("could not read conwsNavigationTreeView in response, defaulting to 'false'");
          }
          return {'conwsNavigationTreeView':conwsNavigationTreeView};
        } else {
          // PUT
          var self = response.links.data.self;
          if (self.method !== 'PUT' || self.body.length!==0) {
            // error response, what to do here
            log.debug('incomprehensible response of PUT');
          } else {
            return {};
          }
        }
      },

      // message for upload to the server
      prepare: function (data, options) {
        return {"SmartUI":{"conwsNavigationTreeView":data.conwsNavigationTreeView}};
      }

    });

    ConnectableMixin.mixin(UserSettingsModel.prototype);
    UploadableMixin.mixin(UserSettingsModel.prototype);

    return UserSettingsModel;

  });