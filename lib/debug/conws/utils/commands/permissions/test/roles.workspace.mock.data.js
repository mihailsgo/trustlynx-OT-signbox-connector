csui.define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'json!./roles.workspace.data.json', 'csui/lib/jquery.mockjax'
], function (require, _, $, mockdata, mockjax) {

  _.extend($.mockjaxSettings, {
    // Do not allow any call go to the real server
    //throwUnmocked: true,
    // Allow quicker development; the default timeout is 500 ms
    responseTime: 0,
    // Do not add text/plain content type and constant etag by default
    // to mocked response headers and to proxied request headers
    headers: {}
  });

  return {

    enable: function () {

      mockjax({
        url: '//server/otcs/cs/api/v1/members/1000/photo',
        responseTime: 5,
        type: 'GET',
        response: function (settings) {
          this.status = 404;
        }
      });

      mockjax({
        url: '//server/otcs/cs/api/v1/contentauth?id=109661',
        responseTime: 5,
        type: 'GET',
        response: function (settings) {
          this.status = 200;
          this.responseText =
          {"token": "1000\/182623\/158049\/15589\/7f6f59393680830f4a04677d617abae15a9ae3c3"};
        }
      });

      mockjax({
        url: new RegExp('/api/v1/contentauth?id=(\d{5})'),
        responseTime: 5,
        type: 'GET',
        response: function (settings) {
          this.status = 200;
          this.responseText = mockdata.id;
        }
      });

      mockjax({
        url: '//server/otcs/cs/api/v1/members/1000',
        responseTime: 5,
        type: 'GET',
        response: function (settings) {
          this.status = 200;
          this.responseText =
          {
            "data": mockdata.id.data,
          };
        }
      });

      mockjax({
        url: new RegExp('//server/otcs/cs/api/v2/nodes/1112222\\?expand=(.*)$'),
        responseTime: 0,
        responseText: {
          "results": {
            "actions": mockdata.actions,
            "data": {
              "properties": mockdata.properties.BWS
            }
          }
        }
      });
      
      mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/1112222(?:\\?(.*))?$'),
        responseTime: 0,
        responseText: {
          "results": {
            "data": {
              "permissions": [
                {
                  "permissions": [],
                  "right_id": 18350,
                  "right_id_expand": {
                    "deleted": false,
                    "id": 18350,
                    "initials": "1",
                    "leader_id": 17360,
                    "name": "Delete Role",
                    "name_formatted": "Delete Role",
                    "type": 1112222
                  },
                  "type": "custom",      
                },
                {
                  "permissions": [],
                  "right_id": 18345,
                  "right_id_expand": {
                    "deleted": false,
                    "id": 18345,
                    "initials": "1",
                    "leader_id": 17360,
                    "name": "Mock Role",
                    "name_formatted": "Mock Role",
                    "type": 1112222
                  },
                  "type": "custom",      
                }
              ],
              "properties": {
                "container": true,
                "name": "Business Workspace",
                "type": 848,
                "versions_control_advanced": true
              }
            }
          }
        }

      });
      
      mockjax({
        url: "//server/otcs/cs/api/v2/members/1001/members?where_type=1&limit=20&page=1&sort=asc_name",
        responseTime: 0,
        responseText: { }
      });

      mockjax({
        url: new RegExp('//server/otcs/cs/api/v2/nodes/1112222'),
        responseTime: 0,
        responseText: {
          "results": {
            "data": {
              "properties": {
                "body": "",
                "content_type": "",
                "commands_map": {},
                "commands_order": ["default"],
                "container": true,
                "create_date": "2017-08-16T12:26:56",
                "create_user_id": 1000,
                "description": "",
                "favorite": false,
                "icon": "/otsapwksp_workspace_b8.png",
                "id": 1112222,
                "mime_type": null,
                "modify_date": "2017-08-31T12:30:38",
                "modify_user_id": 1000,
                "name": "Business Workspace",
                "original_id": 0,
                "parent_id": 2740,
                "perm_add_major_version": true,
                "size": 1,
                "size_formatted": "1 Items",
                "type": 848,
                "type_name": "Business Workspace",
                "user_id": 1000,
                "volume_id": -2740,
                "wnd_createdate": "2017-08-16T12:26:56",
                "wnd_createdby": 1000,
                "wnd_modifiedby": 1000,
                "wnd_owner": 1000,
              }
            }
          }
        }
      });
      mockjax({
        url: new RegExp('//server/otcs/cs/api/v2/businessworkspaces/1112222/roles'),
        responseTime: 0,
        responseText: {
          "results": {
            "data": {
              "properties": {
                  "description": "",
                  "id": 18346,
                  "inherited_from_id": null,
                  "leader": false,
                  "name": "Role1",
                  "perms": "0"        
              }
            }
          }
        }
      });
      mockjax({
        url: "//server/otcs/cs",
        responseTime: 0,
        responseText: {}
      });
      mockjax({
        url: '//server/otcs/cs/api/v1/serverInfo',
        responseTime: 0,
        responseText: mockdata.serverInfo
      });
    },

    disable: function () {
      mockjax.clear();
    }
  };
});
