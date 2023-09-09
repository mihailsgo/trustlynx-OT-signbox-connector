/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'i18n!csui/widgets/navigation.header/controls/help/impl/nls/localized.strings',
  'i18n', 'csui/behaviors/keyboard.navigation/tabable.region.behavior', 'csui/utils/context.help/context.help.ids',
  'csui/models/server.module/server.module.collection', 'csui/lib/othelp',
  'hbs!csui/widgets/navigation.header/controls/help/impl/help'
], function (module, _, $, Marionette, base, localizedStrings, i18n, TabableRegionBehavior, contextHelpIds,
  ServerModuleCollection, OTHHUrlBuilder, template) {
  'use strict';
  var config = window.csui.requirejs.s.contexts._.config
    .config['csui/pages/start/impl/navigationheader/navigationheader.view'] || {};
  _.extend(config, module.config());
  config.help || (config.help = {});
  _.defaults(config.help, {
    language: i18n.settings.locale.replace(/[-_]\w+$/, ''),
    preserve: true
  });
  if (config.help.urlRoot === '') {
    config.help.urlRoot = undefined;
  }
  if (config.help.tenant === '') {
    config.help.tenant = undefined;
  }
  if (config.help.type === '') {
    config.help.type = undefined;
  }

  var HelpView = Marionette.ItemView.extend({
    tagName: 'a',

    attributes: {
      href: '#',
      title: localizedStrings.HelpIconTitle,
      'aria-label': localizedStrings.HelpIconAria
    },

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.HelpIconTitle
      };
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 50
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function HelpView(options) {
      Marionette.ItemView.call(this, options);
      this.listenTo(this, 'click:help', this._onClick);
    },

    onRender: function () {
      var self = this;
      this.$el.on('click', function (event) {
        if (base.isControlClick(event)) {
        } else {
          self.triggerMethod('click:help');
        }
      });
      this.$el.on('keydown', function (event) {
        if (event.keyCode === 32) {
          event.preventDefault();
          self.triggerMethod('click:help');
        }
      });
    },

    _onClick: function () {
      var serverModules = new ServerModuleCollection();
      var appScopeId = this.options.context._applicationScope.attributes.id;
      var context = this.options.context;
      var contextHelpModel = contextHelpIds.findByApplicationScope({ context: context });

      if (contextHelpModel) {
        var contextHelpId = contextHelpModel.get('contextHelpId');
        contextHelpId = typeof contextHelpId === 'function' ? contextHelpId({ context:context }) : contextHelpId;
      }

      serverModules
        .fetch()
        .then(
          function () {
            var modulesWithHelp, urlBuilder, documentsOptions, helpURL, browserTab, topicId,
              modulesHelpDocIdArr = [];
            modulesWithHelp = serverModules.filter(function (serverModule) {
              return !!serverModule.get('helpDocId');
            });

            urlBuilder = new OTHHUrlBuilder({
              urlRoot: config.help.urlRoot
            });

            documentsOptions = {
              preserve: config.help.preserve,
              documents: []
            };
            _.each(modulesWithHelp, function (serverModule) {
              var currmoduleId = serverModule.get('helpDocId');
              if (modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]]) {
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]].push(serverModule);
              }
              else {
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]] = [];
                modulesHelpDocIdArr[currmoduleId.match(/[^\d]+|\d+/g)[0]][0] = serverModule;
              }

            });
            Object.keys(modulesHelpDocIdArr).forEach(function (key) {
              var contextualHelp, sortedObjs = [], modulesHelpDocIdArrLastMatch = [];
              _.each(modulesHelpDocIdArr[key], function (serverModule) {
                if (serverModule.get('contextualHelp')) {
                  contextualHelp = serverModule.get('contextualHelp');
                }
                var topicId = contextHelpId;
                if (!topicId && contextualHelp && !!appScopeId) {
                  topicId = contextualHelp[appScopeId];
                }
                var helpDocId = serverModule.get('helpDocId');
                var lastHiphenIndex = serverModule.get('helpDocId').lastIndexOf('-');
                var everythingAfterTheFinalHiphen = serverModule.get('helpDocId').substring(lastHiphenIndex + 1);
                if (modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen]) {
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen].push({ "helpDocId": helpDocId, "topicId": topicId });
                }
                else {
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen] = [];
                  modulesHelpDocIdArrLastMatch[everythingAfterTheFinalHiphen][0] = { "helpDocId": helpDocId, "topicId": topicId };
                }
              });
              var index = 0, count =0;
              Object.keys(modulesHelpDocIdArrLastMatch).forEach(function (key) {
                sortedObjs[key] = _.sortBy(modulesHelpDocIdArrLastMatch[key], function (module) {
                  return parseInt(module['helpDocId'].match(/[^\d]+|\d+/g)[1]);
                }).reverse();
              });
               Object.keys(sortedObjs).forEach(function (key) {
                 if (sortedObjs[key].length === 2) {
                   index = sortedObjs[key][0]['topicId'] ? 0 : sortedObjs[key][1]['topicId'] ? 1 : 0;
                 }
                 else if (sortedObjs[key].length > 2) {
                   for (var i = 1; i < sortedObjs[key].length; i++) {
                     if (sortedObjs[key][0]['helpDocId'] === sortedObjs[key][i]['helpDocId']) {
                       count++;
                     }
                   }
                   if (count == sortedObjs[key].length - 1) {
                     sortedObjs[key].filter(function (sortedObj, postion) {
                      if (sortedObj['topicId']) {
                        index = postion;
                        return true;
                      }
                    });
                   }
                 }
                documentsOptions.documents.push({
                  module: sortedObjs[key][index]['helpDocId'],
                  topic: sortedObjs[key][index]['topicId'] ? sortedObjs[key][index]['topicId'] : (sortedObjs[key][0]['helpDocId'].indexOf('cssui') === 0 ? 'sui-overview-bg' : undefined)
                });
                if (documentsOptions.documents[documentsOptions.documents.length - 1]['topic']) {
                  documentsOptions.documents[documentsOptions.documents.length - 1].active = true;
                }
              });
            });

            helpURL = urlBuilder.buildHelpUrl(config.help.language,
              documentsOptions, {
              tenant: config.help.tenant,
              type: config.help.type,
              options: { search: 'allModules' }
            });
            browserTab = window.open(helpURL, '_blank');
            browserTab.focus();
          }), function (error) {
            console.error(error);
          };
    }
  });

  return HelpView;
});
