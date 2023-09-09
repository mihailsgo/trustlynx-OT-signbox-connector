/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore',
  'csui/utils/authenticators/ticket.authenticator',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator'
], function (module, _, TicketAuthenticator,
    InteractiveCredentialsAuthenticator, RedirectingFormAuthenticator) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['csui/utils/interactiveauthenticator'] || {},
      enableInteractiveAuthenticator = config.enabled,
      originalConfig = module.config();
  config = _.extend({
    enableInteractiveAuthenticator: originalConfig.enableRedirectingFormAuthenticator === undefined &&
                                    enableInteractiveAuthenticator !== false,
    enableRedirectingFormAuthenticator: false
  }, originalConfig);
  var FallbackAuthenticator =
    config.enableInteractiveAuthenticator ?
      InteractiveCredentialsAuthenticator :
      config.enableRedirectingFormAuthenticator ?
        RedirectingFormAuthenticator :
        TicketAuthenticator;

  return [
    {
      sequence: 500,
      authenticator: FallbackAuthenticator
    }
  ];
});
