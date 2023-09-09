/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/user.session/user.session', 'csui/utils/connector'
], function (UserSession, Connector) {
  'use strict';

  describe('UserSession', function () {
    it('does not fail if the connection URL does not contain "/api"', function () {
      var connector = new Connector({
        connection: {
          url: '//server/rest',
          session: { ticket: 'dummy' }
        }
      });
      var request = {
        settings: { url: '//server/rest/test' }
      };
      UserSession.updateSessionTicket(connector.authenticator, request);
    });
  });
});
