/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'], function (mockjax) {

    var mocks = [];

    return {

        enable: function () {
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/73602/output?format=webreport*',
                responseTime: 10,
                proxy: '../../../widgets/nodestable.report/test/mock.urls.json'
            }));
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/forms/nodes/run?id=73602',
                responseTime: 10,
                proxy: '../../../widgets/nodestable.report/test/mock.run.form.json'
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
