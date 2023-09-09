/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax',
  'json!./V2Nodes12066Actions.json', 
	'json!./AuthWithPerspective.json',
  'json!./AncestorsOf12066.json', 'json!./Actions12066.json',
  'json!./AppContainer12066.json', 'json!./V2Nodes75702.json',
  'json!./AppContainer75702.json',
  'json!./AncestorsOf75702.json',
	'json!./Members.json'
], function (MockJax, V2Nodes12066Actions,
  AuthWithPerspective, AncestorsOf12066, Actions12066, AppContainer12066,
  V2Nodes75702, AppContainer75702,
  AncestorsOf75702, Members) {
  var mocks = [];

  return {
    enable: function () {

      mocks.push(MockJax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/12066\\?actions='),
        responseText: V2Nodes12066Actions
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
        url: '//server/otcs/cs/api/v2/members/objecttypes',
        responseText: Members
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
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop())) {
        MockJax.clear(mock);
      }
    }
  };
});