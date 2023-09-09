/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'], function (mockjax) {

    var mocks = [];

    return {

        enable: function () {
            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v1/nodes/218890/output',
                proxy: '../../../../test/mock.animals.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/10930024*',
                proxy: './mock.emailbutton.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/10930027*',
                proxy: './mock.csvbutton.json'
            }));

            mocks.push(mockjax({
                url: '//server/cgi/cs.exe/api/v2/nodes/10930030*',
                proxy: './mock.savesnapshot.json'
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

