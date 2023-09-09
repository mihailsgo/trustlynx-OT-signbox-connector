/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module',
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 
    'csui/lib/backbone',
    'csui/utils/base',    
    'hbs!csui/utils/expiration.warning/impl/expiration.warning',
    'i18n!csui/utils/expiration.warning/impl/nls/lang',
    'csui/utils/log',    
    'csui/utils/expiration.warning/impl/minutes.view',
    'csui/utils/expiration.warning/impl/seconds.view',
    'csui/lib/handlebars',
    'css!csui/utils/expiration.warning/impl/expiration.warning'
  ], function (module, _, $, Marionette, Backbone, base, 
            template, lang, log, 
            MinutesView, SecondsView, Handlebars
            ) {
    'use strict';
    log = log(module.id);

    var TimevalueModel = Backbone.Model.extend({
      defaults: {
        initTime: Date.now(),
        timer: -1,
        minutes: 0,
        seconds: 0
      }
    });


    var ExpirationWarningView = Marionette.LayoutView.extend({
      className: 'csui-expiration-warning',
  
      template: template,
      templateHelpers: function () {
        return {
          isExpirationWarningContent: true,
          warningText: lang.dialogExpirationWarningText,
          msgId: _.uniqueId('msg')
        };
      },

      regions: {
        timeValueMinRegion: 'span.csui-time-value-min',
        timeValueSecRegion: 'span.csui-time-value-sec'
      },
    
      constructor: function ExpirationWarningView(options) {
        options || (options = {});
        this.authenticator = options.authenticator;
        this.shouldDisplayExpirationWarning = options.shouldDisplayExpirationWarning;
        this.UserSession = options.userSession;
        this.startTime = options.startTime;
        this.timerId = undefined;
        this.isFinished = false;
        this.timeAriaTemplate = Handlebars.compile(lang.dialogExpirationWarningAriaTime);

        options.model = this._createModel();

        Marionette.LayoutView.prototype.constructor.call(this, options);
        if (base.isIE11()) {
          var self = this;
          var resizeHandler = function () {
            self.render();
          };
          $(window).on('resize', resizeHandler);
          this.once('before:destroy', function () {
            $(window).off('resize', resizeHandler);
          });
        }

        this._createTimer();
      },

      _createModel: function() {
        var timeVal = this._getReactionDuration();
        var convertedTime = this._getMinutesSeconds(timeVal);
        var TimeModel = new TimevalueModel({ timer: timeVal, 
                                             minutes: convertedTime.minutes, 
                                             seconds: convertedTime.seconds
                                           });
        return TimeModel;
      },
      _updateAriaTimeLabel: function(timeInSec) {
        var timeAriaLabel;
        if (timeInSec <= 0) {
          timeAriaLabel = lang.dialogExpirationWarningAriaSessionExpired;
          document.getElementById('csui-expiration-timer-live').setAttribute('aria-label', timeAriaLabel);
        } else {
          if ((timeInSec % 10) == 0) {
            timeAriaLabel = this.timeAriaTemplate({overallSeconds: timeInSec});
            document.getElementById('csui-expiration-timer-live').setAttribute('aria-label', timeAriaLabel);
          }
        }        
      },

      _createTimer: function() {
        var timeVal = this.model.get('timer');
        var self = this;
        self.model.set({initTime: Date.now()}, {silent: true}); // do not trigger change
        var expectedEndTime = self.model.get('initTime') + (timeVal * 1000);
        this.isFinished = false;          

        log.info("expiration.warning.view: _createTimer: used sessionReactionTime: " + self._getReactionDuration() + " (Date: " + self.UserSession.currentDateUTC() + ")." ) && console.log(log.last);
        
        this.timerId = setInterval(function() {
          var currTimer = self.model.get('timer');
          if (--currTimer < 0) {
            currTimer = 0;
            self._clearWarningTimer();
            log.info("expiration.warning.view: _createTimer: Expiration warning timeout expired, session timed out (Date: " + self.UserSession.currentDateUTC() + ")." ) && console.log(log.last);
            self._updateAriaTimeLabel(currTimer);
            self.UserSession.performSessionExpired(self.authenticator, false);
            self.isFinished = true;
          }

          if (!self.isFinished) {
            var nowTime = Date.now();
            var timeDiff = (expectedEndTime - nowTime + 500) / 1000;
            if ( timeDiff < currTimer) {
              if (timeDiff > 0) {
                log.info("expiration.warning.view: _createTimer: Adjusting timer value to actual time, using: " + timeDiff + "(currentTimer was: " + currTimer + ")") && console.log(log.last);
                currTimer = timeDiff;
              }
            }
            log.debug("expiration.warning.view: _createTimer: Setting timer in model to " + currTimer) && console.log(log.last);
            var convertedTime = self._getMinutesSeconds(currTimer);            
            self.model.set({ timer: currTimer,
                             minutes: convertedTime.minutes,
                             seconds: convertedTime.seconds 
                           });
            self._updateAriaTimeLabel(currTimer);            

            log.debug("expiration.warning.view: _createTimer: Expected end time in ms: " + expectedEndTime + " (current: " + nowTime + ", diff: " + (expectedEndTime - nowTime) + ")") && console.log(log.last);
          }

        }, 1000);
      },
      onClearTimer: function() {
        log.debug("expiration.warning.view: onClearTimer: clearing view timer...") && console.log(log.last);
        this._clearWarningTimer();
      },

      onBeforeDestroy: function() {
        this._clearWarningTimer();
      },

      _clearWarningTimer: function() {
        if ( this.timerId ) {
          clearInterval(this.timerId);
          this.timerId = undefined;
        }
      },

      _getReactionDuration: function() {
        var reactTime = this.startTime !== undefined ? this.startTime : this.UserSession.getSessionReactionTime()/1000 - 1;
        if (reactTime < 0 ) {
          reactTime = 0;
        }
        return reactTime;
      },

      _getMinutesSeconds: function(timeSecs) {
        var minutes, seconds;
        minutes = parseInt(timeSecs / 60, 10);
        seconds = parseInt(timeSecs % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes; // add leading 0
        seconds = seconds < 10 ? "0" + seconds : seconds; // add leading 0

        return { 
          minutes: minutes,
          seconds: seconds
        };
      },
      
      onRender: function() {        
        if ( this.shouldDisplayExpirationWarning && !this.isFinished && this.isRendered) {
          var minutesView = new MinutesView({ model: this.model });
          var secondsView = new SecondsView({ model: this.model });
          this.showChildView('timeValueMinRegion', minutesView);
          this.showChildView('timeValueSecRegion', secondsView);
        }
      },
  
      onKeyInView: function (event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          event.stopPropagation();
          $(event.target).trigger('click');
        }
      }
  
    });
  
    return ExpirationWarningView;
  });
  