/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/url', 'csui/utils/command.error',
  'csui/models/command', 'csui/utils/commandhelper',
  'csui/models/version',
  'i18n!csui/utils/commands/nls/lang',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/node.info.sprites',
  'csui/lib/underscore.string'
], function (module, require, _, $, Url, CommandError, CommandModel,
    CommandHelper, VersionModel, publicLang, lang, extraLinksInfo) {
  'use strict';

  var config = _.extend({
    rewriteApplicationURL: false,
    enableAppleSupport: false,
    appleNodeLinkBase: 'x-otm-as-cs16://?launchUrl=nodes/'
  }, module.config());

  var nodeLinks, GlobalMessage,
      NEW_LINE = '\n'; // constant variable to add new line.

  var EmailLinkCommand = CommandModel.extend({
    defaults: {
      signature: 'EmailLink',
      name: lang.CommandNameEmailLink,
      verb: lang.CommandVerbEmailLink
    },

    enabled: function (status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      return nodes && nodes.length;
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      status.suppressFailMessage = true;

      require([
        'csui/utils/node.links/node.links',
        'csui/controls/globalmessage/globalmessage'
      ], function () {
        nodeLinks = arguments[0];
        GlobalMessage = arguments[1];
        if (status.originatingView && status.originatingView.blockActions) {
          status.originatingView.blockActions();
        }
        var context = status.context || (options && options.context);
        setTimeout(function () {
          var nodes = CommandHelper.getAtLeastOneNode(status);
          var applicationUrl = self._getApplicationUrl(nodes, context);
          var body = self._getNodesLinks(nodes, applicationUrl, context);
          var newHref = 'mailto:?subject=' + self._getEMailSubject(nodes) + '&body=' + encodeURIComponent(body);
          var error = self._openNewHref(newHref);

          if (error) {
            var message = error.errorDetails || error.message;
            GlobalMessage.showMessage("error", message);
            deferred.reject(error);
          } else {
            deferred.resolve();
          }

          if (status.originatingView && status.originatingView.unblockActions) {
            status.originatingView.unblockActions();
          }
        }, 100);
      }, deferred.reject);

      return deferred.promise();
    },

    _getEMailSubject: function(nodes) {
      var title = " ";
      if (nodes && nodes.length === 1) {
        title = nodes.first().get('name');
      }
      return encodeURIComponent(title);
    },

    _getApplicationUrl: function (nodes) {
      var connector = nodes.first().connector;
      return Url.combine(new Url(connector.connection.url).getCgiScript(), '/app');
    },

    _openNewHref: function (newHref) {
      if (newHref.length > 2048) {
        return new CommandError(lang.EmailLinkCommandFailedWithTooMuchItemsErrorMessage);
      } else {
        window.location.href = newHref;
      }
    },

    isiOSEnabled: function (nodes) {
      return config.enableAppleSupport && !(nodes.first() instanceof VersionModel);
    },

    _getNodesLinks: function (nodes, applicationUrl, context) {

      var iOSEnabled  = this.isiOSEnabled(nodes),
          iOSText     = lang.EmailAppleLinkFormat,
          androidText = publicLang.EmailLinkDesktop + NEW_LINE,
          desktopText = nodes.map(function (node) {
            var name         = node.get('name') + ":",
                actionUrl = nodeLinks.getUrl(node, {context: context}),
                nodeLinkInfo = '';
            
            if (config.rewriteApplicationURL) {
              var hash = actionUrl.lastIndexOf('#');
              if (hash >= 0) {
                actionUrl = applicationUrl + '/' + actionUrl.substr(hash + 1);
              }
            }

            if (iOSEnabled) {
              var nodeId = (node.get('type') === 1) ? node.original.get('id') : node.get('id');
              iOSText += NEW_LINE + name + NEW_LINE + config.appleNodeLinkBase +
                         nodeId;
            }

            nodeLinkInfo = name + NEW_LINE + actionUrl;
            if (extraLinksInfo && !(node instanceof VersionModel)) {
              extraLinksInfo.each(function (extraLinkInfo) {
                var nodeLinksOptions = {
                      NEW_LINE: NEW_LINE,
                      context: context,
                      node: node
                    },
                    extraInfo        = '';
                try {
                  extraInfo = $.trim(extraLinkInfo.get('getCustomUrl')(nodeLinksOptions));
                } catch (error) {
                  console.error(error);
                }
                nodeLinkInfo += extraInfo.length ? (NEW_LINE + extraInfo + NEW_LINE) : '';
              });
            }

            return nodeLinkInfo;
          }).join(NEW_LINE);

      return iOSEnabled ? androidText + desktopText + NEW_LINE + NEW_LINE + iOSText : desktopText;

    }
  });

  return EmailLinkCommand;
});
