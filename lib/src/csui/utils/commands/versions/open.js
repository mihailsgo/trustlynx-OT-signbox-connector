/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/utils/commands/open','csui/utils/url'], function ($, OpenCommand, Url) {
  'use strict';
  var VersionOpenCommand = OpenCommand.extend({
    defaults: {
      signature: 'VersionOpen',
      command_key: ['versions_open','Open'],
      scope: 'single'
    },
    checkPermission: function (version) {
      var permitted = false;
      if(version.actions.get('Open')) {
         permitted = true;
      } else {
        permitted = false;
      }
      return $.Deferred().resolve(permitted).promise();
    },

    _showOverview: function (version, options) {
      var deferred = $.Deferred();
      require([
        'csui/utils/contexts/factories/next.version'
      ], function (NextVersionModelFactory) {
        var nextVersion = options.context.getModel(NextVersionModelFactory);
        nextVersion.set({ id: version.get('id'), version_number: version.get('version_number') });
        deferred.resolve();
      }, deferred.reject);

      return deferred.promise();
    },

    _getContentUrl: function (node, options, action, token) {
      var url = Url.combine(node.connector.connection.url, "nodes",
          node.get('id'), "versions", node.get('version_number'), "content");
      return url + "?action=" + action + "&token=" + encodeURIComponent(token);
    }
  });

  return VersionOpenCommand;
});
