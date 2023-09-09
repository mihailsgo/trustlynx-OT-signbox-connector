/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'require', 'csui/lib/jquery', 'csui/utils/commandhelper',
    'csui/models/command', 'i18n!csui/utils/commands/nls/localized.strings'
  ], function (require, $, CommandHelper, CommandModel, lang) {
    'use strict';
  
    var ExecuteSearchFormQueryCommand = CommandModel.extend({
      defaults: {
        signature: 'ExecuteSearchForm',
        scope: 'single'
      },
  
      enabled: function (status) {
        var node = CommandHelper.getJustOneNode(status);
        return node && node.get('type') === 292;
      },
  
      execute: function (status, options) {
        var node    = CommandHelper.getJustOneNode(status),
            context = status.context || options && options.context;
        if (node.get('type')) {
          return this._openFormInSidepanel(node, context);
        } else {
          this._triggerSearchResults(node, context);
        }
      },
  
      _triggerSearchResults: function (node, context) {
        var deferred = $.Deferred();
        require([
          'csui/utils/contexts/factories/search.formquery.factory'
        ], function (SearchQueryModelFactory) {
          var searchQuery = context.getModel(SearchQueryModelFactory);
          searchQuery.clear({silent: true});
          searchQuery.set('query_id', node.get('id'));
          deferred.resolve();
        }, deferred.reject);
        return deferred.promise();
      },
  
      _openFormInSidepanel: function (node, context) {
        var deferred = $.Deferred();
        require(
            ['csui/controls/side.panel/side.panel.view',
              'csui/widgets/search.forms/search.form.view',
              'csui/widgets/search.forms/search.form.factory'],
            function (SidePanelView, SearchFormView, SearchFormQueryFactory) {
              var savedQuery = context.getCollection(SearchFormQueryFactory, {
                attributes: {
                  id: node.get('id')
                }
              });
              savedQuery.ensureFetched().then(function () {
                var schema = savedQuery.get('schema'),
                    title  = schema.title ? schema.title : node.get('name');
  
                var searchFormView = new SearchFormView({
                  context: context,
                  model: savedQuery,
                  searchFormId: node.get('id'),
                  hideSearchButton: true,
                  showInSearchResultsNewPerspective: true
                });
  
                var sidePanel = new SidePanelView({
                  slides: [{
                    title: title,
                    content: searchFormView,
                    footer: {
                      buttons: [{
                        label: lang.searchButtonMessage,
                        type: 'action',
                        id: 'search-btn',
                        className: 'binf-btn binf-btn-primary',
                        disabled: false
                      }]
                    }
                  }],
                  sidePanelClassName: 'cvs-in-sidepanel'
                });
                searchFormView.listenTo(searchFormView, 'render:form', function() {
                  sidePanel.triggerMethod('set:focus');
                });
                sidePanel.show();
                sidePanel.listenTo(searchFormView, "button:click", function (actionButton) {
                  if (actionButton.id === 'search-btn') {
                    searchFormView.loadCustomSearch();
                  }
                  sidePanel.hide();
                });
  
                sidePanel.listenTo(searchFormView, 'enable:search', function (isSearchEnabled) {
                    searchFormView.trigger("update:button", "search-btn", {
                    disabled: !isSearchEnabled
                  });
                });
  
                sidePanel.listenTo(searchFormView, 'click:search', function () {
                  sidePanel.hide();
                });
                deferred.resolve();
              })
                  .fail(function () {
                    deferred.reject();
                  });
            }, deferred.reject);
        return deferred.promise();
      }
    });
  
    return ExecuteSearchFormQueryCommand;
  });
  