csui.define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'json!./roles.subitem.data.json', 'csui/lib/jquery.mockjax'
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
            { "token": "1000\/182623\/158049\/15589\/7f6f59393680830f4a04677d617abae15a9ae3c3" };
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
        url: new RegExp('//server/otcs/cs/api/v2/nodes/1112226\\?expand=(.*)$'),
        responseTime: 0,
        responseText: {
          "results": {
            "actions": mockdata.actions,
            "data": {
              "properties": mockdata.properties.Document
            }
          }
        }
      });

      mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/1112226(?:\\?(.*))?$'),
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
                    "type": 1112226
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
                    "type": 1112226
                  },
                  "type": "custom",
                }
              ],
              "properties": {
                "container": false,
                "name": "Document",
                "type": 144,
                "versions_control_advanced": true
              }
            }
          }
        }

      });

      mockjax({
        url: "//server/otcs/cs/api/v2/members/1001/members?where_type=1&limit=20&page=1&sort=asc_name",
        responseTime: 0,
        responseText: {}
      });

      mockjax({
        url: new RegExp('//server/otcs/cs/api/v2/nodes/1112226'),
        responseTime: 0,
        responseText: {
          "results": {
            "data": {
              "properties": {
                "container": false,
                "create_user_id": 1000,
                "favorite": true,
                "id": 1112226,
                "mime_type": "application\/pdf",
                "modify_date": "2017-05-15T17:20:16",
                "modify_user_id": 1000,
                "name": "Document",
                "name_multilingual": { "en_IN": "Document" },
                "owner_group_id": 1001,
                "owner_user_id": 1000,
                "parent_id": 41381,
                "size": 1244967,
                "size_formatted": "2 MB",
                "type": 144,
                "type_name": "Document",
                "versions_control_advanced": true,
                "volume_id": -1112222
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
    },

    disable: function () {
      mockjax.clear();
    }
  };
});
