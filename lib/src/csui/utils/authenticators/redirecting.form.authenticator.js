/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/utils/log',
  'csui/utils/authenticators/request.authenticator',
  'csui/utils/user.session/user.session',
  'hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',
  'i18n!csui/utils/authenticators/impl/nls/lang',
  'css!csui/utils/authenticators/impl/redirecting.form.authenticator'
], function (require, module, _, Backbone, $, log, RequestAuthenticator, 
             UserSession, CloseButton, lang) {
  'use strict';
  log = log(module.id);

  var config                      = module.config(),
      authenticationIFrameTimeout = config.authenticationIFrameTimeout || 3000,
      showCloseButtonOnError      = config.showCloseButtonOnError;
  var RedirectingFormAuthenticator = RequestAuthenticator.extend({
    interactive: function() {      
      return false;      
    },

    constructor: function RedirectingFormAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }
      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.initiateLoginSequence, this, succeeded, failed));
    },

    
    updateAuthenticatedSession: function (response, request) {
      RequestAuthenticator.prototype.updateAuthenticatedSession.call(this, response, request);

      if (this.connection.session && this.connection.session.ticket) {        
        if ( UserSession ) {
          UserSession.updateSessionTicket(this, (request ? request : response));
        } else {
          log.info("redirecting.form.authenticator: updateAuthenticatedSession: UserSession is undefined, unable to updateSessionTicket in UserSession.") && console.log(log.last);
        }
      } else {
        log.error("redirecting.form.authenticator: updateAuthenticatedSession: Cannot get 'ticket' from just updated session, invalid request!") && console.error(log.last);
      }

    },

    unauthenticate: function (options) {
      var authen = this.isAuthenticated();
      if (authen && options && options.reason 
        && (options.reason === 'logged-out' || options.reason === 'expired') ) {
          if (UserSession && UserSession.isSessionExpirationEnabled() === true) {
            log.debug("redirecting.form.authenticator: unauthenticate: clearing expiration timer based on logged-out or expired.") && console.log(log.last);
            UserSession.clearExpirationTimer();
          }
      }
      return RequestAuthenticator.prototype.unauthenticate.apply(this, arguments);
    },


    initiateLoginSequence: function (succeeded, failed) {
      var self = this;
      var timer, dialog, urlOrigin;
      var skipFailedEvent = false;
      if ( !isTruthy( self.getUserId() ) ) {
        showErrorMessage();
      } else {
        window.addEventListener('message', receiveMessage, false);
        createIFrame()
          .done(waitForLogin);
      }

      function showErrorMessage() {
        require([
          'csui/controls/dialog/dialog.view',
          'csui/widgets/error.global/error.global.view'
        ], function (DialogView, ErrorGlobalView) {
          var errorModel    = new Backbone.Model({
              message:  'The userId is undefined, the preceding authentication failed. Please initialize CSUI in a correct way.',
              hideNavigationButtons: true,
              showCloseButton: showCloseButtonOnError,
              errorCode: 401,
              showLogout: false
            }),
            errorGlobalView = new ErrorGlobalView({
              model: errorModel
            });

            var edialog = new DialogView({
              standardHeader: false,
              view: errorGlobalView,
              fullSize: true
            });
  
            edialog
              .on('destroy', handleDestroy)
              .on('childview:destroy', handleDestroy)
              .show();

            function handleDestroy() {
              reportFailedTicketRefresh();
              edialog.off('destroy', handleDestroy);
              edialog.off('childview:destroy', handleDestroy);
              edialog.destroy();
            }
          suppressBlockingView();
        });
      }      

      function reportFailedTicketRefresh()  {
        if (skipFailedEvent === false && !self.isAuthenticated()) {
          log.warn("redirecting.form.authenticator: Sending 'failedTicketRefresh' event...") && console.log(log.last);
          self.trigger('failedTicketRefresh', { sender: self });
        }        
      }

      function createIFrame() {
        var deferred = $.Deferred();
        require([
          'csui/lib/marionette', 
          'csui/controls/dialog/dialog.view',
          'csui/utils/url'          
        ], function (Marionette, DialogView, Url) {
          var src = Url.appendQuery(new Url(self.connection.url).getCgiScript(), 'func=csui.ticket');
          src = Url.appendQuery(src, 'userid=' + self.getUserId());
          urlOrigin = new Url(self.connection.url).getOrigin();

          var view = new Marionette.View({
            el: $('<iframe>', {
              width: '100%',
              height: '100%',
              src: src
            })
          });

          var ControlView = Marionette.ItemView.extend({

            ui: {
              closeButton: 'button.csui-signin-close'
            },

            templateHelpers: function () {
              return {
                dialogCloseButtonTooltip: lang.dialogCloseButtonTooltip,
                dialogCloseAria: lang.dialogCloseButtonAria,
                iconName: 'csui_action_close_white32',
                on: 'false'
              };
            },

            template: CloseButton,

            events: {
              'click @ui.closeButton': 'onButtonClick'
            },

            onButtonClick: function(event) {
              dialog.onClickClose(event);
            }

          });

          dialog = new DialogView({
            className: 'csui-signin-close',
            standardHeader: false,
            view: view,
            fullSize: true,
            footerView: new ControlView()
          });
          view.render();
          dialog
            .on('destroy', function () {
              reportFailedTicketRefresh();
            })
            .show({render: false});

          dialog.$el.css({'z-index': '1061'});  // higher than popover
          dialog.$el.addClass('binf-hidden');
          deferred.resolve();
        }, deferred.reject);
        return deferred.promise();
      }

      function removeIFrame() {
        resumeBlockingView();
        skipFailedEvent = true;
        dialog && dialog.destroy();
        skipFailedEvent = false;
      }

      function suppressBlockingView() {
        require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.suppressAll();
            });
      }

      function resumeBlockingView() {
        require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.resumeAll();
            });
      }

      function receiveMessage(event) {
        if (event.origin !== urlOrigin) {
          log.warn('redirecting.form.authenticator: event.origin and urlOrigin differ, aborting!') && console.warn(log.last);
          return;
        }
        if (event.data === 'csuiTicketLoaded') {
          log.info('redirecting.form.authenticator: Sending getOrigin back to child.') && console.log(log.last);
          event.source.postMessage('getOrigin', '*');
        } else {
          if (event.data.ticket) {
            log.debug('redirecting.form.authenticator: Redirecting Form Authenticator received new ticket.') && console.log(log.last);
            window.removeEventListener('message', receiveMessage, false);
            timer && clearTimeout(timer);
            timer = undefined;
            removeIFrame();
            var session = self.connection.session || (self.connection.session = {});
            session.ticket = event.data.ticket;
            session.expires = event.data.expires;
            session.serverDate = event.data.serverDate;
            succeeded && succeeded(self.connection);
            if (UserSession) {
              UserSession.updateSessionTicket(self);
            }
            log.info("redirecting.form.authenticator: Sending 'loggedIn' event...") && console.log(log.last);
            self.trigger('loggedIn', {
              sender: self,
              connection: self.connection
            });            
          }
        }
      }

      function waitForLogin() {
        timer = setTimeout(enableInteactiveLogin, authenticationIFrameTimeout);
      }

      function enableInteactiveLogin() {
        if (dialog) {
          dialog.$el.removeClass('binf-hidden');
          suppressBlockingView();
        }
      }

      function reportError(error) {
        require(['csui/dialogs/modal.alert/modal.alert'
        ], function (ModalAlert) {
          ModalAlert.showError(error.message);
        });
        failed(error, self.connection);
      }
      function isTruthy(n) {
        return !!n;
      }

    }
  });

  return RedirectingFormAuthenticator;
});
