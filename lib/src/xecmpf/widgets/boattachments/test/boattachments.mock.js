/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax',
  'json!./nodesexpand.json',
  'json!./businessattachments.json', 'json!./businessworkspace.json', 'json!./businessworkspacetypes.json',
  'json!./favorites.json', 'json!./searchform.json', 'json!./nodefields.json',
  'json!./searchqueries.json', 'json!./searchtemplate.json', 'json!./searchresults.json'
], function (MockJax, NodeExpand,
  BusinessAttachments, BusinessWorkspace, BusinessWorkspaceTypes, Favorites, SearchForm, NodeFields,
  SearchQueries, SearchTemplate, SearchResults) {
  var mocks = [];

  return {
    enable: function () {
      mocks.push(MockJax({
        url: /\/\/server\/otcs\/cs\/api\/v2\/nodes\/[0-9]+\?expand/,
        responseText: NodeExpand
      }));
      mocks.push(MockJax({
        url: /\/\/server\/otcs\/cs\/api\/v2\/businessobjects\/([0-9]|[A-Z])+\/([0-9]|[A-Z])+\/[0-9]+\/businessattachments(?:(.*))$/,
        responseText: BusinessAttachments
      }));
      mocks.push(MockJax({
        url: /\/\/server\/otcs\/cs\/api\/v2\/businessworkspaces\/[0-9]+\?metadata/,
        responseText: BusinessWorkspace
      }));
      mocks.push(MockJax({
        url: /\/\/server\/otcs\/cs\/api\/v2\/businessworkspacetypes\?ext_system_id=([0-9]|[A-Z])+\&expand_templates=true\&bo_type=([0-9]|[A-Z])+/,
        responseText: BusinessWorkspaceTypes
      }));
      mocks.push(MockJax({
        url: /\/\/server\/otcs\/cs\/api\/v2\/members\/favorites\/tabs\?/,
        responseText: {
          results: []
        }
      }));
      mocks.push(MockJax({
        url: /\/\/server\/otcs\/cs\/api\/v2\/members\/favorites\?fields/,
        responseText: Favorites
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/search/template/settings/display',
        responseText: SearchForm
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/nodes(?:\\?(.*))?'),
        responseText: NodeFields
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v1/searchqueries/[0-9]+'),
        responseText: SearchQueries
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/search/template/[0-9]+/settings/display'),
        responseText: SearchTemplate
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/search',
        responseText: SearchResults
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/nodes/actions',
        responseText: {}
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop())) {
        MockJax.clear(mock);
      }
    }
  };
});