/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'], function (mockajax) {
  return function () {
    var mocks = [];
    return {
      mocks: [],
      enable: function () {
        mocks.push(mockajax({
          url: 'http://server/otcs/cs/api/v2/eventactioncenter/actions',
          responseTime: 0,
          responseText: {
            results: {
              actions: [{ 'action_key': 'CreateOrUpdateEventAction.Create Or Update Workspace', 'action_name': 'Create Or Update Workspace', 'actions_attribute_count': 2, 'actions_attributes': [{ 'name': 'Business Object Type', 'key': 'boType', 'required': true }, { 'name': 'Business Object Key', 'key': 'userId', 'required': true }] }, { 'action_key': 'DocGenEventAction.Generate Document', 'action_name': 'Generate Document', 'actions_attribute_count': 2, 'actions_attributes': [{ 'name': 'Document Type', 'key': 'DocumentType', 'required': true }, { 'name': 'Generate document for', 'key': 'UserId', 'required': true }] }]
            }
          }
        }));
        mocks.push(mockajax({
            url: 'http://server/otcs/cs/api/v2//eventactioncenter/actionplan',
            responseTime: 0,
            responseText:{}
          }));
          mocks.push(mockajax({
            url: 'http://server/otcs/cs/api/v1/forms/nodes/followup/getClientTypes',
            responseTime: 10,
            responseText: {
                "forms": [
                    {
                        "data": {
                            "followup_type_name": 5,
                            "followup_client_name": 69911,
                            "due_on": null,
                            "description": null,
                            "assignees": [
                                1000
                            ],
                            "activation_alert": {
                                "send_in": {
                                    "activationAlert1": 0,
                                    "activationAlert2": 1
                                }
                            }
                        },
                        "form": {
                            "attributes": {
                                "action": "/api/v1/forms/nodes/followup/getClientTypes",
                                "method": "GET"
                            },
                            "renderForm": true
                        },
                        "options": {
                            "fields": {
                                "activation_alert": {
                                    "escal_to": 1,
                                    "fields": {
                                        "send_in": {
                                            "fields": {
                                                "activationAlert1": {
                                                    "hidden": false,
                                                    "hideInitValidationError": true,
                                                    "readonly": true,
                                                    "type": "integer"
                                                },
                                                "activationAlert2": {
                                                    "helper": "before due date",
                                                    "hidden": false,
                                                    "hideInitValidationError": true,
                                                    "optionLabels": [
                                                        "business days ",
                                                        "weeks",
                                                        "months",
                                                        "years"
                                                    ],
                                                    "readonly": true,
                                                    "type": "select"
                                                }
                                            },
                                            "hidden": false,
                                            "hideInitValidationError": true,
                                            "label": "Activate in",
                                            "readonly": true,
                                            "type": "object"
                                        }
                                    },
                                    "hideInitValidationError": true,
                                    "label": " ",
                                    "readonly": true,
                                    "type": "object"
                                },
                                "assignees": {
                                    "fields": {
                                        "item": {
                                            "type": "otcs_member_picker",
                                            "type_control": {
                                                "1000": {
                                                    "action": "api/v1/members",
                                                    "method": "GET",
                                                    "name": "Admin",
                                                    "parameters": {
                                                        "filter_types": [
                                                            0,
                                                            1
                                                        ],
                                                        "select_types": [
                                                            0,
                                                            1
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "hidden": false,
                                    "hideInitValidationError": true,
                                    "items": {
                                        "type": "object"
                                    },
                                    "label": "Assignee",
                                    "readonly": false,
                                    "toolbarSticky": false,
                                    "type": "array"
                                },
                                "description": {
                                    "hidden": false,
                                    "hideInitValidationError": true,
                                    "label": "Description",
                                    "readonly": false,
                                    "type": "textarea"
                                },
                                "due_on": {
                                    "hideInitValidationError": true,
                                    "label": "Due on",
                                    "readonly": false,
                                    "required": true,
                                    "type": "date"
                                },
                                "followup_client_name": {
                                    "hidden": false,
                                    "hideInitValidationError": true,
                                    "label": "Reminder client",
                                    "optionLabels": [
                                        "reminder_client"
                                    ],
                                    "readonly": false,
                                    "removeDefaultNone": true,
                                    "type": "select"
                                },
                                "followup_type_name": {
                                    "hidden": false,
                                    "hideInitValidationError": true,
                                    "label": "Reminder type",
                                    "optionLabels": [
                                        "EScalation_Reminder"
                                    ],
                                    "readonly": false,
                                    "removeDefaultNone": true,
                                    "type": "select"
                                }
                            }
                        },
                        "schema": {
                            "properties": {
                                "activation_alert": {
                                    "properties": {
                                        "send_in": {
                                            "properties": {
                                                "activationAlert1": {
                                                    "readonly": true,
                                                    "required": false,
                                                    "type": "integer"
                                                },
                                                "activationAlert2": {
                                                    "enum": [
                                                        1,
                                                        2,
                                                        3,
                                                        4
                                                    ],
                                                    "readonly": true,
                                                    "required": false,
                                                    "type": "select"
                                                }
                                            },
                                            "readonly": true,
                                            "required": false,
                                            "title": "Activate in",
                                            "type": "object"
                                        }
                                    },
                                    "readonly": true,
                                    "title": " ",
                                    "type": "object"
                                },
                                "assignees": {
                                    "items": {
                                        "maxItems": 1,
                                        "maxLength": 1,
                                        "minItems": 1,
                                        "minLength": 1,
                                        "type": "otcs_member_picker"
                                    },
                                    "readonly": false,
                                    "required": true,
                                    "title": "Assignee",
                                    "type": "array"
                                },
                                "description": {
                                    "maxLength": 250,
                                    "readonly": false,
                                    "required": false,
                                    "title": "Description",
                                    "type": "textarea"
                                },
                                "due_on": {
                                    "readonly": false,
                                    "required": true,
                                    "title": "Due on",
                                    "type": "date"
                                },
                                "followup_client_name": {
                                    "enum": [
                                        69911
                                    ],
                                    "readonly": false,
                                    "required": false,
                                    "title": "Reminder client",
                                    "type": "select"
                                },
                                "followup_type_name": {
                                    "enum": [
                                        5
                                    ],
                                    "read_only": "true",
                                    "readonly": false,
                                    "required": false,
                                    "title": "Reminder type",
                                    "type": "select"
                                }
                            },
                            "title": null,
                            "type": "object"
                        }
                    }
                ]
            }
        }));
        mocks.push(mockajax({
            url: 'http://server/otcs/cs/api/v2//eventactioncenter/actionplandetails?action_plan_id=38725',
            responseTime: 0,
            responseText: {
              results:{
                "links": {
                    "data": {
                        "self": {
                            "body": "",
                            "content_type": "",
                            "href": "/api/v2/eventactioncenter/actionplandetails?action_plan_id=38725",
                            "method": "GET",
                            "name": ""
                        }
                    }
                },
                "results": {
                    "data": {
                        "actions": [
                            {
                                "actionAttributeMappings": [
                                    {
                                        "actionAttributeID": 163,
                                        "cfgID": 82,
                                        "mappingAttributeName": "DocumentType",
                                        "mappingData": "Document Type",
                                        "mappingMethod": "Event Property",
                                        "position": 1
                                    },
                                    {
                                        "actionAttributeID": 164,
                                        "cfgID": 82,
                                        "mappingAttributeName": "UserId",
                                        "mappingData": "Document Location",
                                        "mappingMethod": "Event Property",
                                        "position": 2
                                    }
                                ],
                                "actionKey": "DocGenEventAction.Generate Document",
                                "cfgID": 82,
                                "planID": 38725,
                                "position": 1
                            }
                        ],
                        "eventName": "Content Server",
                        "eventType": "Content Server.Upload Document",
                        "planID": 38725,
                        "processMode": "Asynchronously",
                        "ruleConditions": [
                            {
                                "logicalConnective": "and",
                                "operand": "Document Type",
                                "operation": "equals",
                                "position": 1,
                                "ruleID": 24,
                                "value": "0"
                            }
                        ],
                        "ruleID": 24,
                        "runAs": 22388,
                        "systemName": "Content Server"
                    },
                    "ok": true,
                    "statusCode": 200
                }
            }
          }
        }));
        mocks.push(mockajax({
          url: 'http://server/otcs/cs/api/v1/members/18206',
          responseTime: 0,
          responseText: { 'available_actions': [{ 'parameterless': true, 'read_only': false, 'type': 'delete', 'type_name': 'Delete', 'webnode_signature': null }, { 'parameterless': false, 'read_only': false, 'type': 'create', 'type_name': 'Create', 'webnode_signature': null }, { 'parameterless': false, 'read_only': false, 'type': 'update', 'type_name': 'Update', 'webnode_signature': null }], 'data': { 'birth_date': null, 'business_email': null, 'business_fax': null, 'business_phone': null, 'cell_phone': null, 'deleted': false, 'display_name': 'jbaker', 'first_name': 'Jada', 'gender': null, 'group_id': 1001, 'home_address_1': null, 'home_address_2': null, 'home_fax': null, 'home_phone': null, 'id': 16521, 'initials': 'j', 'last_name': 'Baker', 'middle_name': null, 'name': 'jbaker', 'office_location': null, 'pager': null, 'personal_email': null, 'personal_interests': null, 'personal_url_1': null, 'personal_url_2': null, 'personal_url_3': null, 'personal_website': null, 'photo_id': null, 'photo_url': null, 'privilege_grant_discovery': false, 'privilege_login': true, 'privilege_modify_groups': false, 'privilege_modify_users': false, 'privilege_public_access': true, 'privilege_system_admin_rights': false, 'privilege_user_admin_rights': false, 'time_zone': -1, 'title': null, 'type': 0, 'type_name': 'User' }, 'definitions': { 'birth_date': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'include_time': false, 'key': 'birth_date', 'key_value_pairs': false, 'multi_value': false, 'name': 'Birthday', 'persona': '', 'read_only': false, 'required': false, 'type': -7, 'type_name': 'Date', 'valid_values': [], 'valid_values_name': [] }, 'business_email': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'business_email', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Business E-mail', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'business_fax': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'business_fax', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Business Fax', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'business_phone': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'business_phone', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Business Phone', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'cell_phone': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'cell_phone', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Cell Phone', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'deleted': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'deleted', 'key_value_pairs': false, 'multi_value': false, 'name': 'Deleted', 'persona': '', 'read_only': true, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'first_name': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'first_name', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'First Name', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'gender': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'gender', 'key_value_pairs': false, 'max_value': null, 'min_value': null, 'multi_value': false, 'name': 'Gender', 'persona': '', 'read_only': false, 'required': false, 'type': 2, 'type_name': 'Integer', 'valid_values': [], 'valid_values_name': [] }, 'group_id': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'group_id', 'key_value_pairs': false, 'max_value': null, 'min_value': null, 'multi_value': false, 'name': 'Group', 'persona': 'group', 'read_only': false, 'required': false, 'type': 2, 'type_name': 'Integer', 'valid_values': [], 'valid_values_name': [] }, 'home_address_1': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'home_address_1', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Home Address', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'home_address_2': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'home_address_2', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Home Address', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'home_fax': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'home_fax', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Home Fax', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'home_phone': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'home_phone', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Home Phone', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'id': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'id', 'key_value_pairs': false, 'max_value': null, 'min_value': null, 'multi_value': false, 'name': 'ID', 'persona': 'user', 'read_only': false, 'required': true, 'type': 2, 'type_name': 'Integer', 'valid_values': [], 'valid_values_name': [] }, 'last_name': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'last_name', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Last Name', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'middle_name': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'middle_name', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Middle Name', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'name': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'name', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Name', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': true, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'office_location': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'office_location', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'OfficeLocation', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'pager': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'pager', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Pager', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'personal_email': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'personal_email', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Personal Email', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'personal_interests': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'personal_interests', 'key_value_pairs': false, 'max_length': 255, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Interests', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'personal_url_1': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'personal_url_1', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Favorites', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'personal_url_2': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'personal_url_2', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Favorites', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'personal_url_3': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'personal_url_3', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Favorites', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'personal_website': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'personal_website', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Home Page', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'photo_id': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'photo_id', 'key_value_pairs': false, 'max_value': null, 'min_value': null, 'multi_value': false, 'name': 'Photo ID', 'persona': '', 'read_only': false, 'required': false, 'type': 2, 'type_name': 'Integer', 'valid_values': [], 'valid_values_name': [] }, 'privilege_grant_discovery': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_grant_discovery', 'key_value_pairs': false, 'multi_value': false, 'name': 'eDiscovery Rights', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'privilege_login': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_login', 'key_value_pairs': false, 'multi_value': false, 'name': 'Log-in', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'privilege_modify_groups': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_modify_groups', 'key_value_pairs': false, 'multi_value': false, 'name': 'Create\/Modify Groups', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'privilege_modify_users': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_modify_users', 'key_value_pairs': false, 'multi_value': false, 'name': 'Create\/Modify Users', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'privilege_public_access': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_public_access', 'key_value_pairs': false, 'multi_value': false, 'name': 'Public Access', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'privilege_system_admin_rights': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_system_admin_rights', 'key_value_pairs': false, 'multi_value': false, 'name': 'System Administration Rights', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'privilege_user_admin_rights': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'privilege_user_admin_rights', 'key_value_pairs': false, 'multi_value': false, 'name': 'User Administration Rights', 'persona': '', 'read_only': false, 'required': false, 'type': 5, 'type_name': 'Boolean', 'valid_values': [], 'valid_values_name': [] }, 'time_zone': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': -1, 'description': null, 'hidden': false, 'key': 'time_zone', 'key_value_pairs': false, 'max_value': null, 'min_value': null, 'multi_value': false, 'name': 'TimeZone', 'persona': '', 'read_only': false, 'required': false, 'type': 2, 'type_name': 'Integer', 'valid_values': [], 'valid_values_name': [] }, 'title': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'title', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Title', 'password': false, 'persona': '', 'read_only': false, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] }, 'type': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'type', 'key_value_pairs': false, 'max_value': null, 'min_value': null, 'multi_value': false, 'name': 'Type', 'persona': '', 'read_only': true, 'required': false, 'type': 2, 'type_name': 'Integer', 'valid_values': [], 'valid_values_name': [] }, 'type_name': { 'allow_undefined': false, 'bulk_shared': false, 'default_value': null, 'description': null, 'hidden': false, 'key': 'type_name', 'key_value_pairs': false, 'max_length': null, 'min_length': null, 'multi_value': false, 'multiline': false, 'multilingual': false, 'name': 'Type', 'password': false, 'persona': '', 'read_only': true, 'regex': '', 'required': false, 'type': -1, 'type_name': 'String', 'valid_values': [], 'valid_values_name': [] } }, 'definitions_order': ['id', 'type', 'type_name', 'name', 'deleted', 'first_name', 'last_name', 'middle_name', 'group_id', 'title', 'business_email', 'business_phone', 'business_fax', 'office_location', 'time_zone', 'privilege_grant_discovery', 'privilege_login', 'privilege_public_access', 'privilege_modify_users', 'privilege_modify_groups', 'privilege_user_admin_rights', 'privilege_system_admin_rights', 'birth_date', 'cell_phone', 'personal_url_1', 'personal_url_2', 'personal_url_3', 'gender', 'home_address_1', 'home_address_2', 'home_fax', 'personal_website', 'home_phone', 'personal_interests', 'pager', 'personal_email', 'photo_id'], 'type': 0, 'type_name': 'User' }
        }));
        mocks.push(mockajax({
          url: 'http://server/otcs/cs/api/v2/nodes/63551?actions=default&actions=open&actions=download&actions=browse&fields=properties',
          responseTime: 0,
          responseText: {
            results: {
              'actions': { 'data': { 'download': { 'body': '', 'content_type': '', 'form_href': '', 'href': '\/api\/v2\/nodes\/63551\/content?download', 'method': 'GET', 'name': 'Download' }, 'open': { 'body': '', 'content_type': '', 'form_href': '', 'href': '\/api\/v2\/nodes\/63551\/content', 'method': 'GET', 'name': 'Open' }, 'properties': { 'body': '', 'content_type': '', 'form_href': '', 'href': '\/api\/v2\/nodes\/63551', 'method': 'GET', 'name': 'Properties' } }, 'map': { 'default_action': 'open', 'more': ['properties'] }, 'order': ['open', 'download'] }, 'data': { 'properties': { 'advanced_versioning': false, 'container': false, 'container_size': 0, 'create_date': '2019-10-18T16:12:16', 'create_user_id': 18088, 'description': '', 'description_multilingual': { 'ar': '', 'de': '', 'en': '' }, 'external_create_date': null, 'external_identity': '', 'external_identity_type': '', 'external_modify_date': null, 'external_source': '', 'favorite': false, 'id': 63551, 'mime_type': 'application\/pdf', 'modify_date': '2020-01-05T16:49:18', 'modify_user_id': 1000, 'name': 'BankStatementProof2.pdf', 'name_multilingual': { 'ar': '', 'de': '', 'en': 'BankStatementProof2.pdf' }, 'owner': 'Admin', 'owner_group_id': 1001, 'owner_user_id': 1000, 'parent_id': 17779, 'permissions_model': 'advanced', 'reserved': false, 'reserved_date': null, 'reserved_shared_collaboration': false, 'reserved_user_id': 0, 'size': 8060867, 'size_formatted': '8 MB', 'type': 144, 'type_name': 'Document', 'versionable': true, 'versions_control_advanced': false, 'volume_id': 17744 } }
            }
          }
        }));
        mocks.push(mockajax({
          url: 'http://server/otcs/cs/api/v2//eventactioncenter/actionplan',
          responseTime: 0,
          responseText: {
            'results': {
              msg: 'Action Plan created successfully',
              statusCode: 200,
              ok: true,
              data: {
                planID: '1122'
              }
            }
          }
        }));
      },

      disable: function () {
        var mock;
        while ((mock = mocks.pop())) {
          mockajax.clear(mock);
        }
      }
    };
  }
});
