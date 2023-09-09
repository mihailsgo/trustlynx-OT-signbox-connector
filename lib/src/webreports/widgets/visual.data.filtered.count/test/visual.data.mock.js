/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax',
        'json!./mock.animals.json',
        'json!./mock.doctypes.json',
        'json!./mock.docsize.json',
        'json!./mock.audit.json',
        'json!./mock.empty.json',
        'json!./mock.animals.one.column.json',
        'json!./mock.nodes.json',
        'json!./mock.send.as.email.button.node.json',
        'json!./mock.export.to.csv.button.node.json',
        'json!./mock.save.as.snapshot.button.node.json'
], function (mockjax,
             mockAnimalsData,
             mockDocTypesData,
             mockDocSizeData,
             mockAuditData,
             mockEmptyData,
             mockAnimalsOneColumnData,
             mockNodesData,
             mockSendAsEmailButtonNode,
             mockExportToCSVButtonNode,
             mockSaveAsSnapshotButtonNode) {

    var mocks = [];

    return {
        enable: function () {
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/218890/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockAnimalsData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/239645/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockDocTypesData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/255548/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockDocSizeData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/255591/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockAuditData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/123456/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockEmptyData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/98765/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockAnimalsOneColumnData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/98649/output',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockNodesData;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/12345?fields=properties',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockSendAsEmailButtonNode;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/54321?fields=properties',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockExportToCSVButtonNode;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/88888?fields=properties',
                responseTime: 500,
                dataType: "json",
                response: function(){
                    this.responseText = mockSaveAsSnapshotButtonNode;
                }
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/auth',
                responseText: {
                    "data": {
                        "id": 1000,
                        "name": "Admin"
                    }
                }
            }));
        },

        disable: function () {
            var mock;
            while ((mock = mocks.pop())) {
                mockjax.clear(mock);
            }
        }

    };

});

