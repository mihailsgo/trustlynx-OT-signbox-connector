/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax', 'json!./Account1001.json',
  'json!./V2Nodes12066Actions.json', 'json!./V2Nodes27686Actions.json', 
	'json!./AuthWithPerspective.json',
  'json!./AncestorsOf12066.json', 'json!./AncestorsOf12686.json', 
	'json!./BusinessWorkspaces12066.json',
  'json!./MissingDocuments12066.json', 'json!./Actions12066.json',
  'json!./AppContainer12066.json', 'json!./V2Nodes75702.json',
  'json!./V2NodesExpand12066.json', 'json!./AppContainer75702.json',
  'json!./AncestorsOf75702.json', 'json!./V2Nodes12066Expand.json',
	'json!./Members.json', 'json!./Metadata27686.json', 'json!./Missing27686.json', 'json!./Members27686.json',
	'json!./Outdated27686.json', 'json!./Fields27686.json'
], function (MockJax, Account1001, V2Nodes12066Actions, V2Nodes27686Actions,
  AuthWithPerspective, AncestorsOf12066, AncestorsOf12686, BusinessWorkspaces12066,
  MissingDocuments12066, Actions12066, AppContainer12066,
  V2Nodes75702, V2NodesExpand12066, AppContainer75702,
  AncestorsOf75702, V2Nodes12066Expand, Members, Metadata27686, MissingDoc27686, Members27686, Outdated27686, Fields27686) {
  var mocks = [];

  return {
    enable: function () {
      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/externalsystems/C4C/botypes/Account/boids/1001?limit=30&page=1&sort=asc_name&metadata',
        responseText: Account1001
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/12066\\?actions='),
        responseText: V2Nodes12066Actions
      }));

			mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/27686\\?actions='),
        responseText: V2Nodes27686Actions
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/12066\\?expand='),
        responseText: V2Nodes12066Expand
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/nodes/actions',
        responseText: Actions12066
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v1/auth?perspective=true',
        responseText: AuthWithPerspective
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v1/nodes/12066/ancestors',
        responseText: AncestorsOf12066
      }));

			mocks.push(MockJax({
        url: '//server/otcs/cs/api/v1/nodes/27686/ancestors',
        responseText: AncestorsOf12686
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/12066\\?'),
        responseText: BusinessWorkspaces12066
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/businessworkspaces/12066/missingdocuments',
        responseText: MissingDocuments12066
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/businessworkspaces/12066/roles?fields=members',
        responseText: {
          results: []
        }
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/businessworkspaces/12066/outdateddocuments',
        responseText: {
          results: []
        }
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/multipart/settings',
        responseText: {
          results: {
            data: {
              is_enabled: false
            }
          }
        }
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/app/container/12066\\?fields'),
        responseText: AppContainer12066
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/75702\\?actions'),
        responseText: V2Nodes75702
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/12066\\?expand'),
        responseText: V2NodesExpand12066
      }));

			mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/members/objecttypes',
        responseText: Members
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v1/objectsocialinfo?csid=12066&includes=comment_count',
        responseText: {
          available_settings: {
            attachementsEnabled: true,
            commentCount: 0,
            commentingOpen: true,
            commentsEnabled: true,
            CSID: 12066,
            likesEnabled: true,
            pulseEnabled: true,
            shortcutsEnabled: true,
            taggingEnabled: false,
            threadingEnabled: true
          }
        }
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v2/businessworkspaces/75702/outdateddocuments',
        responseText: {
          results: []
        }
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/app/container/75702\\?fields'),
        responseText: AppContainer75702
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v1/nodes/75702/ancestors',
        responseText: AncestorsOf75702
      }));

      mocks.push(MockJax({
        url: '//server/otcs/cs/api/v1/nodes/75702/businessworkspacetypes',
        responseText: {
          businessworkspacetypes: []
        }
      }));

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/75702/doctemplates\\?subtypes'),
        responseText: {
          results: []
        }
      }));

			mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/27686\\?metadata&fields=categories'),
        responseText: Metadata27686
      }));

			mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/27686/missingdocuments'),
        responseText: MissingDoc27686
      }));

			mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/27686/roles\\?fields=members'),
        responseText: Members27686
      }));

			mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/27686/outdateddocuments'),
        responseText: Outdated27686
      }));

			mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/app/container/27686\\?fields=external_source'),
        responseText: Fields27686
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