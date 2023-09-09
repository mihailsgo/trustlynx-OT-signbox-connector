/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'nuc/lib/underscore',
  'nuc/utils/authenticators/ticket.authenticator',
  'nuc/utils/authenticators/basic.authenticator',
  'nuc/utils/authenticators/credentials.authenticator',
  'nuc/utils/authenticators/regular.header.authenticator',
  'nuc/utils/authenticators/initial.header.authenticator'
], function (module, _, TicketAuthenticator, BasicAuthenticator,
     CredentialsAuthenticator, RegularHeaderAuthenticator,
     InitialHeaderAuthenticator) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['nuc/utils/interactiveauthenticator'] || {},
      originalConfig = module.config();
  config = _.extend({
    forceBasicAuthenticator: false,
    preferBasicAuthenticator: false,
    preferRegularHeaderAuthenticator: false
  }, originalConfig);

  return [
    {
      authenticator: BasicAuthenticator,
      sequence: 50,
      decides: function (connection) {
        return config.forceBasicAuthenticator ||
               connection.credentials && config.preferBasicAuthenticator;
      }
    },
    {
      authenticator: RegularHeaderAuthenticator,
      sequence: 50,
      and: {
        has: 'authenticationHeaders',
        decides: function () {
          return config.preferRegularHeaderAuthentication;
        }
      }
    },
    {
      authenticator: CredentialsAuthenticator,
      has: 'credentials'
    },
    {
      authenticator: InitialHeaderAuthenticator,
      has: 'authenticationHeaders'
    },
    {
      sequence: 1000,
      authenticator: TicketAuthenticator
    }
  ];
});
