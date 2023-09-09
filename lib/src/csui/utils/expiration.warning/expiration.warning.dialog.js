/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module',
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
    'csui/utils/expiration.warning/impl/expiration.warning.view',
    'csui/dialogs/modal.alert/modal.alert',
    'i18n!csui/utils/expiration.warning/impl/nls/lang',
    'csui/utils/log',
    'css!csui/utils/expiration.warning/impl/expiration.warning',
  ], function (module, _, $, Marionette,
            ExpirationWarningView, ModalAlertView,
            lang, log) {
    'use strict';
    log = log(module.id);

    var dialogSize = 'md',
      dlgOptions;
    function _getButtonsData(isExpWarning) {
      var buttonArr = [];
      if ( isExpWarning === true ) {
        buttonArr.push({
          showYes: true,
          labelYes: lang.dialogExpirationWarningButtonContinueSession,
          tooltipYes: lang.dialogExpirationWarningButtonContinueSessionTooltip,
          ariaYes: lang.dialogExpirationWarningButtonContinueSessionAria,
          clickYes: function(dialog) {
            var cloptions = _.extend({ dialogOptions: dlgOptions }, { dialog: dialog });

            if (cloptions.dialogOptions.authenticator.isAuthenticated() === true) {
              cloptions.dialogOptions.cbClearExpirationTimer();
            }
            if ( cloptions.dialog && !cloptions.dialog.isDestroyed ) {
              cloptions.dialog.updateButtons({ disableYes: true, disableNo: true });
            }
            log.info("expiration.warning.dialog: User continued session, performing REST-call (Date: " + cloptions.dialogOptions.userSession.currentDateUTC() + ").") && console.log(log.last);
            cloptions.dialogOptions.userSession.continueSession(cloptions.dialogOptions.authenticator);
          }          
        });
        buttonArr.push({
          showNo: true,
          labelNo: lang.dialogExpirationWarningButtonTerminateSession,
          tooltipNo: lang.dialogExpirationWarningButtonTerminateSessionTooltip,
          ariaNo: lang.dialogExpirationWarningButtonTerminateSessionAria,
          clickNo: function(dialog) {
            var cloptions = _.extend({ dialogOptions: dlgOptions }, { dialog: dialog });
            cloptions.dialogOptions.cbClearExpirationTimer();
            if ( cloptions.dialog && !cloptions.dialog.isDestroyed ) {
              cloptions.dialog.updateButtons({ disableNo: true, disableYes: true});
            }
            log.info("expiration.warning.dialog: User terminated session, performing signOut (Date: " + cloptions.dialogOptions.userSession.currentDateUTC() + ").") && console.log(log.last);
            cloptions.dialogOptions.userSession.signOut(cloptions.dialogOptions.authenticator);            
          }
        });
      } else {
        buttonArr.push({
          showYes: true,
          labelYes: lang.dialogExpirationWarningButtonLeave,
          tooltipYes: lang.dialogExpirationWarningButtonLeaveTooltip,
          ariaYes: lang.dialogExpirationWarningButtonLeaveAria,
          clickYes: function(dialog) {
            var cloptions = _.extend({ dialogOptions: dlgOptions }, { dialog: dialog });
            cloptions.dialogOptions.cbClearExpirationTimer();
            if ( cloptions.dialog && !cloptions.dialog.isDestroyed ) {
              cloptions.dialog.updateButtons({disableYes: true});
            }
            log.info("expiration.warning.dialog: Redirecting to target page...'") && console.log(log.last);
            cloptions.dialogOptions.userSession.redirectToTargetPage(cloptions.dialogOptions.authenticator);
          }
        });

      }
      var i, 
          bLen = buttonArr.length,
          combined = { showYes: false, showNo: false, showCancel: false};
      for (i = 0; i < bLen; i++) {
        combined = _.extend(combined, buttonArr[i]);
      }

      return combined;
    }

    function createExpirationWarningDialog(options) {
      options || (options = {});

      this.UserSession = options.userSession;   // avoid cyclic dependendy and let pass-in the UserSession
      this.authenticator = options.authenticator;
      if ( !this.authenticator ) {
        log.error("expiration.warning.dialog: showExpirationWarningDialog: Given authenticator is 'undefined'!") && console.error(log.last);
      }
      this.shouldDisplayExpirationWarning = (options.startWithWarningContent && options.startWithWarningContent === true) ? true : false;
      this.cbClearExpirationTimer = options.clearExpirationTimer;  // callback function to clear timer on demand
      this.startTime = options.startTime;
      
      this.buttonsData = _getButtonsData(this.shouldDisplayExpirationWarning);      

      dlgOptions = {
        userSession: this.UserSession,
        authenticator: this.authenticator,
        shouldDisplayExpirationWarning: this.shouldDisplayExpirationWarning,
        startTime: this.startTime,
        cbClearExpirationTimer: this.cbClearExpirationTimer,
        buttonsData: this.buttonsData
      };

      var dlg = _createExpiration(dlgOptions);

      return dlg;
    }

    function showExpirationWarningDialog(dialog) {
      var self = this;
      var deferred = $.Deferred();

      dialog.show()
      .then(
        function success(result) {
          self.buttonsData.clickYes(dialog);
          deferred.resolve(result);
        }, 
        function failure(result) {
          self.buttonsData.clickNo(dialog);
          deferred.reject(result);
        }
      );
      return deferred.promise();
    }

    function _createExpiration(options) {

      var expDlg = new ModalAlertView(_.defaults({
          dialogSize: dialogSize
      }, {
          bodyView: ExpirationWarningView,
          bodyViewOptions: {
              userSession: options.userSession,
              authenticator: options.authenticator,
              startTime: options.startTime,
              shouldDisplayExpirationWarning: options.shouldDisplayExpirationWarning 
          },
          title: lang.dialogExpirationWarningTitle,
          showTitleCloseButton: false,
          staticBackdrop: true,
          closeWithEsc: false,
          buttons: options.buttonsData
        },
        ModalAlertView.defaultOptions.Warning ));

      return expDlg;
  }

  return {
    createExpirationWarningDialog: createExpirationWarningDialog,
    showExpirationWarningDialog: showExpirationWarningDialog
  };

});