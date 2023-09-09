/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/utils/errormessage'], function (Messages) {
  'use strict';

  describe('RequestErrorMessage', function () {

    it('shows text, if connection to server was closed without response', function () {
      var request = {
            readyState: 4,
            responseText: '',
            status: 0,
            statusText: '',
            type: 'GET',
            url: '//server/otcs/cs/api/v1/auth'
          },
          error = new Messages.RequestErrorMessage(request);
      expect(error.message).toEqual('Network communication failed.');
    });

    it('shows text, if server sent an empty OK (200) response', function () {
      var request = {
            readyState: 4,
            responseText: '',
            status: 200,
            statusText: 'OK',
            type: 'GET',
            url: '//server/otcs/cs/api/v1/auth'
          },
          error = new Messages.RequestErrorMessage(request);
      expect(error.message).toEqual('Invalid response received.');
    });

    it('shows text, if server sent an invalid response', function () {
      var request = {
            readyState: 4,
            responseText: 'dunny',
            status: 200,
            statusText: 'OK',
            type: 'GET',
            url: '//server/otcs/cs/api/v1/auth'
          },
          error = new Messages.RequestErrorMessage(request);
      expect(error.message).toEqual('Invalid response received.');
    });

  });

});
