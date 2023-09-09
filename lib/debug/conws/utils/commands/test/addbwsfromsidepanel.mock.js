csui.define(['csui/lib/jquery.mockjax'],
  function (mockjax) {

    return {
      mocks: [],
      enable: function () {
        this.mocks.push(mockjax({
          url: '//server/otcs/cs/api/v2/businessworkspacetypes?where_manual_creation=true&where_fixed_creation_location=true&expand_templates=true&expand_wksp_info=true',
          responseTime: 0,
          responseText: {
            links: {
              data: {
                self: {
                  body: "",
                  content_type: "",
                  href: "/api/v2/businessworkspacetypes?expand_templates=true&expand_wksp_info=true&where_fixed_creation_location=true&where_manual_creation=true",
                  method: "GET",
                  name: ""
                }
              }
            },
            results: [
              {
                data: {
                  properties: {
                    rm_enabled: false,
                    templates: [
                      {
                        id: 4,
                        name: "Material A",
                        parentId: 1,
                        subtype: 848,
                      },
                      {
                        id: 3,
                        name: "Material B",
                        parentId: 1,
                        subtype: 848
                      }
                    ],
                    wksp_type_id: 2,
                    wksp_type_name: "Material Ws Type"
                  },
                  wksp_info: {
                    "wksp_type_icon": null,
                    "wksp_type_icon_content_type": "type_base64_content"
                  }
                }
              },
              {
                data: {
                  properties: {
                    rm_enabled: false,
                    templates: [
                      {
                        id: 2,
                        name: "Contract Workspace A",
                        parentId: 1,
                        subtype: 848
                      },
                      {
                        id: 1,
                        name: "Contract Workspace B",
                        parentId: 1,
                        subtype: 848
                      }
                    ],
                    wksp_type_id: 1,
                    wksp_type_name: "Contract Workspace Type"
                  },
                  wksp_info: {
                    "wksp_type_icon": "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRpdGxlPnJlc2VydmVTaGFyZTwvdGl0bGU+PGcgaWQ9ImVkaXRfaWNvbiIgZGF0YS1uYW1lPSJlZGl0IGljb24iPjxwYXRoIGQ9Ik0yMCwxMEgxOVY2LjdBNi43MjIsNi43MjIsMCwwLDAsMTIuMywwaC0uNkE2LjcyMiw2LjcyMiwwLDAsMCw1LDYuN1YxMEg0YTEsMSwwLDAsMC0xLDFWMjNhMSwxLDAsMCwwLDEsMUgyMGExLDEsMCwwLDAsMS0xVjExQTEsMSwwLDAsMCwyMCwxMFpNNyw2LjdBNC43MDcsNC43MDcsMCwwLDEsMTEuNywyaC42QTQuNzA3LDQuNzA3LDAsMCwxLDE3LDYuN1YxMEg3WiIgc3R5bGU9ImZpbGw6IzUxNTE1MSIvPjwvZz48cGF0aCBkPSJNMTUsMThhMi4xMjcsMi4xMjcsMCwwLDAtMS41LjdMMTEsMTcuNHYtLjhsMi41LTEuM0EyLjEyNywyLjEyNywwLDAsMCwxNSwxNmEyLDIsMCwxLDAtMi0ydi40bC0yLjUsMS4zQTIuMTI3LDIuMTI3LDAsMCwwLDksMTVhMiwyLDAsMSwwLDAsNCwyLjEyNywyLjEyNywwLDAsMCwxLjUtLjdMMTMsMTkuNlYyMGEyLDIsMCwxLDAsMi0yWiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjwvc3ZnPg==",
                    "wksp_type_icon_content_type": "type_base64_content"
                  }
                }
              }
            ]
          }
        }));
        this.mocks.push(mockjax({
          url: '//server/otcs/cs/api/v2/forms/businessworkspaces/create?type=848&template_id=2',
          responseText: {
            "forms": [
              { //general form
                "data": {
                  "description": "",
                  "external_create_date": null,
                  "external_identity": "",
                  "external_identity_type": "",
                  "external_modify_date": null,
                  "external_source": "",
                  "name": null,
                  "parent_id": 1,
                  "reference_type": 1,
                  "type": 848
                },
                "options": {
                  "fields": {
                    "description": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "Description",
                      "readonly": false,
                      "type": "textarea"
                    },
                    "external_create_date": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "External Create Date",
                      "readonly": false,
                      "type": "datetime"
                    },
                    "external_identity": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "External Identity",
                      "readonly": false,
                      "type": "text"
                    },
                    "external_identity_type": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "External Identity Type",
                      "readonly": false,
                      "type": "text"
                    },
                    "external_modify_date": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "External Modify Date",
                      "readonly": false,
                      "type": "datetime"
                    },
                    "external_source": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "External Source",
                      "readonly": false,
                      "type": "text"
                    },
                    "name": {
                      "hidden": false,
                      "hideInitValidationError": true,
                      "label": "Name",
                      "readonly": true,
                      "required": false,
                      "type": "text"
                    },
                    "parent_id": {
                      "hidden": true,
                      "hideInitValidationError": true,
                      "label": "Location",
                      "readonly": false,
                      "type": "otcs_node_picker"
                    },
                    "reference_type": {
                      "hidden": true,
                      "hideInitValidationError": true,
                      "label": "Workspace Type",
                      "readonly": true,
                      "required": false,
                      "type": "text"
                    },
                    "type": {
                      "hidden": true,
                      "hideInitValidationError": true,
                      "type": "integer"
                    }
                  },
                  "form": {
                    "attributes": {
                      "action": "api\/v1\/nodes",
                      "method": "POST"
                    },
                    "renderForm": true
                  }
                },
                "schema": {
                  "properties": {
                    "description": {
                      "default": "",
                      "readonly": false,
                      "required": false,
                      "title": "Description",
                      "type": "string"
                    },
                    "external_create_date": {
                      "readonly": false,
                      "required": false,
                      "title": "External Create Date",
                      "type": "date"
                    },
                    "external_identity": {
                      "default": "",
                      "readonly": false,
                      "required": false,
                      "title": "External Identity",
                      "type": "string"
                    },
                    "external_identity_type": {
                      "default": "",
                      "readonly": false,
                      "required": false,
                      "title": "External Identity Type",
                      "type": "string"
                    },
                    "external_modify_date": {
                      "readonly": false,
                      "required": false,
                      "title": "External Modify Date",
                      "type": "date"
                    },
                    "external_source": {
                      "default": "",
                      "readonly": false,
                      "required": false,
                      "title": "External Source",
                      "type": "string"
                    },
                    "name": {
                      "maxLength": 248,
                      "minLength": 1,
                      "readonly": true,
                      "required": false,
                      "title": "Name",
                      "type": "string"
                    },
                    "parent_id": {
                      "readonly": false,
                      "required": true,
                      "title": "Location",
                      "type": "integer"
                    },
                    "reference_type": {
                      "readonly": true,
                      "required": false,
                      "title": "Workspace Type",
                      "type": "string"
                    },
                    "type": {
                      "required": true,
                      "type": "integer"
                    }
                  },
                  "type": "object"
                }
              },
              { //categories form
                "data": {
                  "5075": {
                    "5057_1": {}
                  }
                },
                "options": {
                  "fields": {
                    "5075": {}
                  },
                  "role_name": "categories"
                },
                "schema": {
                  "properties": {
                    "5075": {
                      "properties": {},
                    },
                    "type": "object",
                    "title": "Categories"
                  }
                }
              },
              { //classifications form
                "data": {},
                "options": {},
                "role_name": "classifications",
                "schema": {
                  "properties": {},
                  "title": "Classifications",
                  "type": "object"
                }
              }
            ]
          }
        }));
        this.mocks.push(mockjax({
          //url:' //server/otcs/cs/api/v2/nodes/1?actions=docpreview&actions=opendocumentwebedit&actions=default&actions=open&actions=download&actions=properties&actions=browse&actions=initiateworkflow&actions=openform&fields=properties',
          url: new RegExp('^//server/otcs/cs/api/v2/nodes/1\\?.*'),
          responseText: {
            links: {
              data: {
                self: {
                  body: "",
                  content_type: "",
                  href: "/api/v2/nodes/1?actions=opendocumentwebedit&actions=open&actions=download&actions=properties&actions=initiateworkflow&actions=openform&fields=properties",
                  method: "GET",
                  name: ""
                }
              }
            },
            results: {
              actions: {
                data: {
                  open: {
                    body: "",
                    content_type: "",
                    form_href: "",
                    href: "/api/v2/nodes/1/nodes",
                    method: "GET",
                    name: "Open"
                  },
                  properties: {
                    body: "",
                    content_type: "",
                    form_href: "",
                    href: "/api/v2/nodes/1",
                    method: "GET",
                    name: "Properties"
                  }
                },
                map: {
                  default_action: "open",
                  more: ["properties"]
                },
                order: ["open"]
              },
              data: {
                properties: {
                  advanced_versioning: null,
                  container: true,
                  container_size: 35,
                  create_date: "2019-07-17T10:23:07",
                  create_user_id: 1000,
                  description: "",
                  description_multilingual: { en: "" },
                  external_create_date: null,
                  external_identity: "",
                  external_identity_type: "",
                  external_modify_date: null,
                  external_source: "",
                  favorite: false,
                  hidden: false,
                  icon: "/img/webdoc/folder.gif",
                  icon_large: "/img/webdoc/folder_large.gif",
                  id: 1,
                  mime_type: null,
                  modify_date: "2021-06-16T08:29:32",
                  modify_user_id: 1000,
                  name: "Create WS folder",
                  name_multilingual: { en: "Create WS folder" },
                  owner: "User1",
                  owner_group_id: 999,
                  owner_user_id: 16071,
                  parent_id: 1,
                  permissions_model: "advanced",
                  reserved: false,
                  reserved_date: null,
                  reserved_shared_collaboration: false,
                  reserved_user_id: 0,
                  size: 35,
                  size_formatted: "35 Items",
                  status: null,
                  type: 0,
                  type_name: "Folder",
                  versionable: false,
                  versions_control_advanced: false,
                  volume_id: -2000,
                }
              }
            }
          }
        }));
        this.mocks.push(mockjax({
          url: '//server/otcs/cs/api/v1/nodes/1/ancestors',
          responseText: {
            "ancestors": [
              {
                "id": 2000,
                "name": "Enterprise",
                "parent_id": -1,
                "type": 141,
                "volume_id": -2000,
                "type_name": "Enterprise Workspace"
              },
              {
                "id": 1,
                "name": "Workspaces",
                "parent_id": 2000,
                "type": 0,
                "volume_id": -2000,
                "type_name": "Folder"
              }
            ]
          }
        }));
      },
      disable: function () {
        var mock;
        while ((mock = this.mocks.pop())) {
          mockjax.clear(mock);
        }
      }

    };

  });


