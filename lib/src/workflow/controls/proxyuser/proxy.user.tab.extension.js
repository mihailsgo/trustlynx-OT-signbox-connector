/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui-ext!workflow/controls/proxyuser/proxy.user.tab.extension',
    'workflow/controls/proxyuser/proxy.user.tab.view',
    'workflow/models/proxyuser/proxy.user.form.model',
    'i18n!workflow/controls/proxyuser/impl/nls/lang'
  ],
  function (_, RegisterdTabs, ProxyTabView, ProxyUserFormModel, lang) {
    'use strict';
    var workflowTab = {
        tabName: "proxyTab",
        tabDisplayName: lang.ProxiesTabDisplayName,
        tabContentView: ProxyTabView,
        showTab: function(model, options) {
          var show = false, form;
          if (model.get('id') === options.connector.authenticator.userId) {
            form = new ProxyUserFormModel({
              userId: options.connector.authenticator.userId
            }, {
              connector: options.connector,
              parentView: this
            });
            form.fetch({async:false}).done(function () {
              show = form.get('isFormToDisplay');
            });
          }
          return show;
        }

      },
      extraTabs = [],
      egovProxyTab;

    if (RegisterdTabs) {
      extraTabs = _.flatten(RegisterdTabs, true);
      egovProxyTab = _.find(extraTabs, function (tab) {
        return tab.isEgovProxyTab;
      });
    }
    if (!egovProxyTab) {
      extraTabs.push(workflowTab);
    }
    return extraTabs;
  });