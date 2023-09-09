/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'nuc/lib/jquery.mockjax', 'nuc/lib/jquery.binary.ajax', 'nuc/lib/jquery.parse.param'
], function (_, $, mockjax, binaryAjax) {

  var mocks = [];

  return {

    enable: function () {
      binaryAjax.setOption({
        enabled: false,
        mocked: true
      });
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/businessworkspaces/42587/doctypes?skip_validation=true&document_type_rule=false&document_generation_only=false&sort_by=DocumentType',
        responseTime: 0,
        response: function () {
          this.responseText = {
            "links": {
              "data": {
                "self": {
                  "body": "",
                  "content_type": "",
                  "href": "/api/v2/businessworkspaces/42587/doctypes?document_type_rule=false",
                  "method": "GET",
                  "name": ""
                }
              }
            },
            "results": [
              {
                "data": {
                  "properties": {
                    "classification_id": 36470,
                    "classification_name": "Employment Contract"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36398,
                    "classification_name": "Offer Letter"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36342,
                    "classification_name": "Medical leave"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36342,
                    "classification_name": "Resume"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36343,
                    "classification_name": "Sick Leave"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36385,
                    "classification_name": "Working time for employees"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36384,
                    "classification_name": "Timesheet Approvals"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36346,
                    "classification_name": "Vacation"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36471,
                    "classification_name": "Benefits and enrollment forms"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36392,
                    "classification_name": "Certifications / trainings"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36344,
                    "classification_name": "Employee contracts / agreement"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36345,
                    "classification_name": "Employee info"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36347,
                    "classification_name": "Employee sick notification"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36389,
                    "classification_name": "Job description"
                  }
                }
              },
              {
                "data": {
                  "properties": {
                    "classification_id": 36379,
                    "classification_name": "Medical note"
                  }
                }
              }
            ]
          };
        },

      }));

    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
      binaryAjax.setOption({
        enabled: true,
        mocked: false
      });
    }

  };

});
