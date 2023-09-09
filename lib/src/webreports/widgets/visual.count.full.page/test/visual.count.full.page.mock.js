/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'], function (mockjax) {

    var mocks = [];

    return {

        enable: function () {
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/218890/output',
                proxy: '../../visual.data.filtered.count/test/mock.animals.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/12345',
                proxy: '../../visual.data.filtered.count/mock.emailbutton.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/54321*',
                proxy: '../../visual.data.filtered.count/mock.csvbutton.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/88888*',
                proxy: '../../visual.data.filtered.count/mock.savesnapshot.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/forms/nodes/run?id=218890',
                responseTime: 10,
                proxy: './mock.run.form.json'
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

