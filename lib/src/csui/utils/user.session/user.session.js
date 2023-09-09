/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/base',
  'i18n!csui/utils/user.session/impl/nls/lang'
  ], function (module, require, _, $, log, Url, base, lang) {
    'use strict';
    log = log(module.id);

    var singleton = function() {
      log.info("user.session: module.config is: " + JSON.stringify(module.config())) && console.log(log.last);
      var DEFAULT_KINDNESS_PERIOD = 30 * 1000;                // at least 30 sec kindness time needed for refresh-call with still valid ticket
      var DEFAULT_COOKIE_EXPIRATION_MODE = 1;                 // last request
      var DEFAULT_ENABLE_EXPIRATION_HANDLING = false;         // disabled
      var DEFAULT_SESSION_INACTIVITY_TIME = 30 * 60 * 1000;
      var DEFAULT_SESSION_REACTION_TIME = 3 * 60 * 1000;

      var config = _.extend({
            signInPageUrl: 'signin.html',       // only for development
            kindnessPeriod: DEFAULT_KINDNESS_PERIOD,
            cookieExpirationMode: DEFAULT_COOKIE_EXPIRATION_MODE,
            enableExpirationHandling: DEFAULT_ENABLE_EXPIRATION_HANDLING    
          }, module.config()),
          redirectEnabled = config.enableExpirationHandling == null ? DEFAULT_ENABLE_EXPIRATION_HANDLING : config.enableExpirationHandling,
          cookieExpirationMode = config.cookieExpirationMode == null ? DEFAULT_COOKIE_EXPIRATION_MODE : config.cookieExpirationMode,
          sessionInactivity = config.sessionInactivity == null ? DEFAULT_SESSION_INACTIVITY_TIME : config.sessionInactivity,
          sessionReactionTime = config.sessionReactionTime == null ? DEFAULT_SESSION_REACTION_TIME : config.sessionReactionTime,
          kindnessPeriod = config.kindnessPeriod == null ? DEFAULT_KINDNESS_PERIOD : config.kindnessPeriod,
          isCookieExpirationEnabled   = (cookieExpirationMode > 0);
      var usedConfig = {
        enableExpirationHandling: redirectEnabled,
        cookieExpirationMode: cookieExpirationMode,          
        sessionInactivity: sessionInactivity,
        sessionReactionTime: sessionReactionTime,
        kindnessPeriod: kindnessPeriod
      };
      log.warn("user.session: used config: " + JSON.stringify(usedConfig)) && console.warn(log.last);


      var timerId;
      var expWarnDialog;
      var logoutInitiated = false;


      function getSessionReactionTime() {
        return sessionReactionTime;
      }

      function getSessionInactivity() {
        return sessionInactivity;
      }

      function isSessionExpirationEnabled() {
        return redirectEnabled;
      }

      function getCookieExpirationMode() {
        return cookieExpirationMode;
      }

      function currentDateUTC() {
        return (new Date()).toUTCString();
      }
      function _getOverallExpirationTime() {
        return getSessionInactivity() + getSessionReactionTime();
      }
      function _ensureExpiresTime(session) {
        if ( session ) {
          if (!session.expires || !session.serverDate) {
            var dat = new Date();
            session.serverDate = dat.toUTCString();
            session.expires = new Date(dat.getTime() + _getOverallExpirationTime()).toUTCString();          
            log.warn("user.session: _ensureExpiresTime: Adding 'serverDate' and 'expires' information to session (expires: " + session.expires + ").") && console.warn(log.last);
          } else if( new Date(session.expires).getTime() <= new Date(session.serverDate).getTime() ) {
            var dat2 = new Date();
            session.serverDate = dat2.toUTCString();
            session.expires = new Date(dat2.getTime() + _getOverallExpirationTime()).toUTCString();
            log.warn("user.session: _ensureExpiresTime: Provided 'serverDate' is newer or equal than 'expires' value, exceptionally replacing values (expires: " + session.expires + ").") && console.warn(log.last);
          }
        } else {
          log.error("user.session: _ensureExpiresTime: The provided argument 'session' is undefined!") && console.error(log.last);
        }
      }
      function _calcExpirationStartTime(authenticator) {
        var session = authenticator.connection.session;
        var diffTime = 0;

        _ensureExpiresTime(session);

        if ( session && session.expires !== undefined && 
            (typeof session.expires === "string") && session.expires.length > 0 ) {

          var expireDate = new Date(session.expires);
          if (isNaN(expireDate.getTime())) { 
            expireDate = new Date(new Date().getTime() + _getOverallExpirationTime());
            log.info("user.session: _calcExpirationStartTime: Got unparseable date value for expires '" + session.expires + "', using fallback value '" + expireDate.toUTCString() + "'.") && console.log(log.last);
            session.expires = expireDate.toUTCString();
          }
          var expireTime = expireDate.getTime();
          expireTime -= kindnessPeriod;
          if (expireTime < 0) { expireTime = 0; }

          var currentDate = new Date(session.serverDate);
          if (isNaN(currentDate.getTime())) {
            currentDate = new Date();
            log.warn("user.session: _calcExpirationStartTime: Got unparseable date value for serverDate '" + session.serverDate + "', using fallback value '" + currentDate.toUTCString() + "'.") && console.warn(log.last);
            session.serverDate = currentDate.toUTCString();
          }
          var currentTime = currentDate.getTime();
          log.info("user.session: _calcExpirationStartTime: srvDate: " 
            + session.serverDate + ", expires: " + session.expires + " (Date: " + currentDateUTC() + ").") 
            && console.log(log.last);

          if ( currentTime >= expireTime ) {
            diffTime = 0;
          } else {
            diffTime = expireTime - currentTime;
          }
          diffTime /= 1000; // secs
        } else {
          log.error("user.session: _calcExpirationStartTime: The provided authenticator.connection.session has no expiration information.") && console.error(log.last);
        }
        log.info("user.session: _calcExpirationStartTime: secs until expiration: " + diffTime) && console.log(log.last);
        return diffTime;
      }
      function _shouldDisplayExpirationWarning() {
        if ( this.isSessionExpirationEnabled() === true && isCookieExpirationEnabled ) {
          return ( this.getCookieExpirationMode() == 1 );
        } else {
          return false;
        }
      }
      function updateSessionTicket(authenticator, request) {
        if (authenticator && authenticator.isAuthenticated()) {
          if (request && request.settings && request.settings.url) {
            var url = new Url(request.settings.url).getAbsolute().toLowerCase(),
                match = url.match(/^.*\/(api\/[^?]+)/);
            if (match) {
              var call = match[1];
              log.debug("user.session: updateSessionTicket: Resetting expiration timer based on call '" + call + "'.") && console.log(log.last);
              this.clearExpirationTimer();
              this._createExpirationTimer(authenticator);
            }
          } else {
            log.debug("user.session: updateSessionTicket: Resetting expiration timer based on unspecified call.") && console.log(log.last);
            this.clearExpirationTimer();
            this._createExpirationTimer(authenticator);
          }
        } else {
          log.warn("user.session: updateSessionTicket: Authenticator has to be 'authenticated' before updating session ticket!") && console.warn(log.last);
        }
      }
      
      function startExpirationTimer(authenticator) {
        if (authenticator && authenticator.isAuthenticated()) {
          log.debug("user.session: startExpirationTimer: Creating new expiration timer with provided authenticator...") && console.log(log.last);
          this.clearExpirationTimer();
          this._createExpirationTimer(authenticator);
        } else {
          console.warn("user.session: startExpirationTimer: Unable to start expiration timer, you have to provide an (still) authenticated 'authenticator'! Verify your parameter(s) for startExpirationTimer() function.");
        }
      }
      
      function clearExpirationTimer() {
        log.debug("user.session: clearExpirationTimer: called...") && console.log(log.last);
        if ( timerId ) {
          clearInterval(timerId);
          timerId = undefined;
        }
      }
      function _createExpirationTimer(authenticator) {
        var timer = _calcExpirationStartTime(authenticator);
        var self = this;
        var reactionTimeSecs = this.getSessionReactionTime()/1000;
        var doOnce = (function() {
          var executed = false;
          return function(curTimer) {
              if (!executed) {
                  executed = true;
          log.info("user.session: expirationTimer: current time for expiration warning count down: " + self.currentDateUTC()) && console.log(log.last);
                  self.displayExpirationWarning(authenticator, 
                    { startWithWarningContent: true, startTime: curTimer });
              }
          };
        })();

        timerId = setInterval(function () {
          if (--timer < reactionTimeSecs) {
            log.info("user.session: current expiration value: " + timer) && console.log(log.last);
            if ( timer >= 0 ) {
              doOnce(timer);
            } else {
              self.clearExpirationTimer();
              log.info("user.session: expirationTimer: Switching to LoggedOut dialog content due to expired session...") && console.log(log.last);
              self.sendAuthenticatorEvent(authenticator);
              self.performSessionExpired(authenticator, false);
            }
          }
        }, 1000);
      }

      function stopExpirationWarningViewTimer(dialog) {
        if ( dialog ){
          log.debug("user.session: Sending event 'clear:timer' to dialog...") && console.log(log.last);
          dialog.triggerMethod('clear:timer', 'someValue');
        } else {
          log.debug("user.session: Skipping sending event 'clear:timer' to dialog, because dialog is already destroyed.") && console.log(log.last);
        }
      }

      function _showExpirationWarningDialog(authenticator, options) {
        var self = this;
        require([ 'csui/utils/expiration.warning/expiration.warning.dialog'
          ], function(ExpirationWarningDialog) {
            
            var dlgOptions = {
              userSession: self,
              authenticator: authenticator,
              startWithWarningContent: options.startWithWarningContent,
              startTime: options.startTime,
              clearExpirationTimer: function() {  // callback function to clear timer
                self.clearExpirationTimer();
              }
            };
            
            expWarnDialog = ExpirationWarningDialog.createExpirationWarningDialog(dlgOptions);

            ExpirationWarningDialog.showExpirationWarningDialog(expWarnDialog)          
            .always(function(result) {
              log.debug("user.session: _showExpirationWarningDialog: Expiration dialog was finished, setting internal dialog to undefined.") && console.log(log.last);
              expWarnDialog = undefined;
            });        

        });
      }
      function displayExpirationWarning(authenticator, options) {
        if ( expWarnDialog === undefined && this.isSessionExpirationEnabled() === true) {     // we want just one dialog
          if (options && options.startWithWarningContent === true) {
            if ( this._shouldDisplayExpirationWarning() ) {
              return this._showExpirationWarningDialog(authenticator, options);    
            }
          } else {
            if ( isCookieExpirationEnabled ) {
              options = options || {};
              options.startWithWarningContent = false;
              return this._showExpirationWarningDialog(authenticator, options);
            }
          }        
        }
      }

      function redirectToTargetPage(authenticator) {
        log.debug("user.session: redirectToTargetPage: Called ...") && console.log(log.last);
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
        var targetUrl = Url.appendQuery(cgiUrl, 'func=csui.redirecttotarget');
        location.href = targetUrl;
      }

      function performSessionExpired(authenticator, doRedirect) {
        var self = this;
        if (this.isSessionExpirationEnabled() === true) {
          if (!logoutInitiated) {
            logoutInitiated = true;
            log.debug("user.session: performSessionExpired: Initiating automatic logout ...") && console.log(log.last);
            this.clearExpirationTimer();

            if (doRedirect === true) {
              log.info("user.session: performSessionExpired: Session expired, performing requested redirect (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.redirectToTargetPage(authenticator);
            } else {
              log.info("user.session: performSessionExpired: Session expired, performing signOut (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.signOut(authenticator, { onErrorRedirect: true, isSessionExpired: true })
              .done(function() {
                logoutInitiated = false;
                log.debug("user.session: performSessionExpired: Automatic logout requests successfully sent.") && console.log(log.last);
              })
              .fail(function() {
                logoutInitiated = false;
                log.info("user.session: performSessionExpired: Sending automatic logout requests returned error.") && console.log(log.last);
              })
              .always(function() {
                log.info("user.session: performSessionExpired: Sending automatic logout requests finished, spawning redirect timer.") && console.log(log.last);
                var timerRedirectId = setTimeout(function () {
                  logoutInitiated = false;
                  if ( timerRedirectId ) {
                    clearTimeout(timerRedirectId);
                    timerRedirectId = undefined;
                  }
                  log.info("user.session: performSessionExpired: Redirecting to target page...'") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                }, kindnessPeriod);
              });
            }
          } else {
            log.debug("user.session: performSessionExpired: A logout is already executed.") && console.log(log.last);
          }
        } else {
          log.debug("user.session: performSessionExpired: Skipping automatic logout due to disabled expiration handling.") && console.log(log.last);
          this.clearExpirationTimer();
        }
      }

      function continueSession(authenticator) {
        var self = this;
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
        var authUrl = Url.combine(cgiUrl, 'api/v1/auth');
        authenticator.makeAjaxCall({
          url: authUrl,
          headers: { 
              OTCSTicket: authenticator.connection.session.ticket
            },
          success: function (response, textStatus, request) {
              log.debug('Receiving request response from {0}.', authUrl) && console.log(log.last);
              response = authenticator.parseResponse(response, request);
              authenticator.updateAuthenticatedSession(response, request);
            }
        })
        .done(function() {
          self.startExpirationTimer(authenticator);
          log.info("expiration.warning.dialog: Processed continue session (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
        })
        .fail(function(req) {            
          self.sendAuthenticatorEvent(authenticator, 'failedTicketRefresh');          
          var errMsg = lang.errorContinueSession;
          var errDetails = new base.RequestErrorMessage(req);
          var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
          log.error("expiration.warning.dialog: Processing continue session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
          require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
            ModalAlert
              .showError(errMsg + '\n' + errResponse)
              .always(function () {
                self.redirectToTargetPage(authenticator);
              });
          });             
        });      
      }

      function sendAuthenticatorEvent(authenticator, reasonStr) {
        if (authenticator) {
          authenticator.trigger(reasonStr || 'loggedOut', { sender: authenticator });
        }
      }
      function signOut(authenticator, cmdData) {
        var deferred = $.Deferred();
        var self = this;
        cmdData || (cmdData = {});

        if (authenticator && authenticator.isAuthenticated()) {
          var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

          require(['csui/utils/routing',
                   'csui/utils/open.authenticated.page'
            ], function (routing, openAuthenticatedPage) {
            if (routing.routesWithSlashes()) {

              if (self.isSessionExpirationEnabled() === true) {

                if (authenticator && authenticator.makeAjaxCall && typeof authenticator.makeAjaxCall === 'function') {
                  var tokenUrl = Url.combine(cgiUrl, 'api/v1/auth/logouttoken');
                  authenticator.makeAjaxCall({
                    url: tokenUrl,
                    headers: {
                      OTCSTicket: authenticator.connection.session.ticket
                    },
                    success: function (response, textStatus, request) {
                      log.debug('Receiving request response from {0}.', tokenUrl) && console.log(log.last);
                      response = authenticator.parseResponse(response, request);
                      authenticator.updateAuthenticatedSession(response, request);
                    }
                  }).then(function (response) {
                    var queryStr = 'func=csui.dologout&secureRequestToken=' + encodeURIComponent(response.token);
                    if (cmdData.isSessionExpired === true) {
                      queryStr += '&authcontext=sessionexpired';
                    }
                    var logoutFct = Url.appendQuery(cgiUrl, queryStr);
                    openAuthenticatedPage(authenticator.connection, logoutFct, {
                      openInNewTab: false
                    }).always(function() {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.debug("user.session: signOut: The logout request was sent to server (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                      deferred.resolve();
                    });
                  }, function(req) {
                    var errMsg = lang.errorTerminateSession;
                    var errDetails = new base.RequestErrorMessage(req);
                    var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
                    if (cmdData.onErrorRedirect === true) {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.info("user.session: signOut: Terminate session was not successful, redirecting ... (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      self.redirectToTargetPage(authenticator);
                    } else {
                      log.error("user.session: signOut: Terminate session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
                        ModalAlert
                          .showError(errMsg + '\n' + errResponse)
                          .always(function () {
                            authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                            self.redirectToTargetPage(authenticator);
                          });                        
                      });
                    }
                    deferred.reject(req);     
                  });
                } else {
                  authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                  log.debug("user.session: signOut: makeAjaxCall is not available, so performing redirect to target page (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                  deferred.resolve();
                }

              } else {

                log.debug("user.session: signOut: Session expiration handling is disabled, skipping logout (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                deferred.resolve();
              }

            } else {
              authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
              var signInPageUrl = config.signInPageUrl,
                  query = location.search;
              query += query ? '&' : '?';
              query += 'nextUrl=' + encodeURIComponent(location.pathname);
              var logoutUrl = signInPageUrl + query + location.hash;
              log.debug("user.session: signOut: Performed unauthenticate with redirect to development signIn page.") && console.log(log.last);
              location.href = logoutUrl;

              deferred.resolve();
            }
          });   // require

        } else {
          log.info("user.session: signOut: Authenticator is not 'authenticated' anymore, just returning success.") && console.log(log.last);
          deferred.resolve();
        }

        return deferred.promise();
      }    



      return {
        getSessionReactionTime: getSessionReactionTime,
        getSessionInactivity: getSessionInactivity,
        isSessionExpirationEnabled: isSessionExpirationEnabled,
        getCookieExpirationMode: getCookieExpirationMode,
        currentDateUTC: currentDateUTC,
        signOut: signOut,
        continueSession: continueSession,
        redirectToTargetPage: redirectToTargetPage,
        updateSessionTicket: updateSessionTicket,
        startExpirationTimer: startExpirationTimer,
        displayExpirationWarning: displayExpirationWarning,
        performSessionExpired: performSessionExpired,      
        clearExpirationTimer: clearExpirationTimer,
        stopExpirationWarningViewTimer: stopExpirationWarningViewTimer,      
        sendAuthenticatorEvent: sendAuthenticatorEvent,    
        _createExpirationTimer: _createExpirationTimer,
        _shouldDisplayExpirationWarning: _shouldDisplayExpirationWarning,
        _showExpirationWarningDialog: _showExpirationWarningDialog
      };
    };

    return singleton();

  });
  