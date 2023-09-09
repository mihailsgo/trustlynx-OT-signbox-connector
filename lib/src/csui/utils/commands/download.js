/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/url', 'csui/utils/commandhelper',
  'csui/models/command', 'csui/models/version'
], function (_, $, base, lang, Url, CommandHelper,
    CommandModel, VersionModel) {
  'use strict';
  var config = window.csui.requirejs.s.contexts._.config.config['csui/utils/commands/open'];

  var DownloadCommand = CommandModel.extend({
    defaults: {
      signature: "Download",
      command_key: ['download', 'Download'],
      name: lang.CommandNameDownload,
      verb: lang.CommandVerbDownload,
      doneVerb: lang.CommandDoneVerbDownload,
      scope: "single"
    },

    execute: function (status, options) {
      var node = this._getNode(status);

      if (base.isAppleMobile()) {
        return this._openContent(node, options);
      } else {
        return this._downloadContent(node, options);
      }
    },

    _getNode: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      var type = node.get('type');
      var generationVersionNumber = node.get('version_number');
      if (node.original && node.original.get('id') > 0) {
        if (type === 1 || type === 2) {  // Shortcut or Generation
          node = node.original;
        }
        if (type === 2 && generationVersionNumber !== undefined) {  // Generation
          node.set('version_number', generationVersionNumber, {silent: true});
        }
      }
      var versionsObj = node.get('versions');
      var currentVersion = !(versionsObj && (versionsObj.current_version === false));
      if (!(node instanceof VersionModel) && type !== 2 && currentVersion) {
        var cloneNode = node.clone();
        var versionNumProps = ['version_number', 'version_number_major', 'version_number_minor',
          'version_number_name'];
        versionNumProps.forEach(function (property) {
          cloneNode.unset(property, {silent: true});
          if (cloneNode.attributes.versions && _.isObject(cloneNode.attributes.versions)) {
            delete cloneNode.attributes.versions[property];
          }
        });
        return cloneNode;
      }

      return node;
    },

    _downloadContent: function (node, options) {
      return this._downloadContentWithPage(node, options);
    },

    _downloadContentWithPage: function (node, options) {
      var deferred = $.Deferred();
      options || (options = {});
      options.openInNewTab = !!options.openInNewTab;    // default should be false
      require(['csui/utils/open.authenticated.page'], function (openAuthenticatedPage) {
        var cgiUrl = new Url(node.connector.connection.url).getCgiScript();
        var query = {
          func: 'doc.fetchcsui',
          nodeid: node.get('id'),
          action: 'download'
        };
        var versionNumber = node.get('version_number');
        if (versionNumber != null) {
          query.vernum = versionNumber;
        }
        var downloadUrl = Url.appendQuery(cgiUrl, Url.combineQueryString(query));
        return openAuthenticatedPage(node.connector, downloadUrl, options)
          .then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },

    _openContent: function (node, options) {
      options || (options = {});
      var content = window.open("");
      var downloadOptions = { window: content };
      if (!content || !content.location) {
        downloadOptions = { window: parent.window };
        content = null;
      }
      return this._downloadContentWithPage(node, _.extend(options, downloadOptions))
      .then(function() {
        if (content) {
          content.focus();
        }
        return $.Deferred().resolve();
      }, function() {
        if (content) {
          content.close();
        }
        return $.Deferred().reject();
      });
    }

  });

  return DownloadCommand;
});
