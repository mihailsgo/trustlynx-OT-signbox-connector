/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/models/command',
  'csui/utils/url', 'csui/utils/commands/open.classic.page',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel, Url, OpenClassicPageCommand, lang) {

  'use strict';
  var ConnectorFactory;
  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/contexts/factories/user'] || {};
  config = _.extend({
    initialResponse: {
      data: {
        privilege_system_admin_rights: false
      }
    },
    openInNewTab: null
  }, config, module.config());

  if (config.openInNewTab === null) {
    config.openInNewTab = OpenClassicPageCommand.openInNewTab;
  }

  var ContentServerAdministration = CommandModel.extend({

    defaults: {
      signature: 'ContentServerAdministration',
      name: lang.ContentServerAdministrationCommandName
    },

    enabled: function (status, options) {
      return config.initialResponse.data.privilege_system_admin_rights;
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          context  = status.context || options && options.context,
          target   = config.openInNewTab && window.open('', '_blank') || window,
          self     = this;
      target.focus();
      require(['csui/utils/contexts/factories/connector',
      ], function () {
        ConnectorFactory = arguments[0];
        target.location.href = self._getUrl(context, status);
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },

    _getUrl: function (context, status) {
      var connector          = context.getObject(ConnectorFactory),
          cgiUrl             = new Url(connector.connection.url).getCgiScript(),
          urlQueryParameters = this._getUrlQueryParameters(context, status),
          urlQuery           = Url.combineQueryString(urlQueryParameters);
      return Url.appendQuery(cgiUrl, urlQuery);
    },

    _getUrlQueryParameters: function (context, status) {
      var parameters = {func: 'admin.index'};
      return parameters;
    }

  });

  return ContentServerAdministration;

});