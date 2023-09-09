/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/marionette',
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'smart/dialogs/modal.alert/modal.alert',
  'i18n!smart/dialogs/modal.alert/impl/nls/lang'
], function (Marionette, _, $, ModalAlert, lang) {
  'use strict';

  describe('ModalAlert', function () {
    var promise,
    transitionDelay = 800,
    keydownEvent = $.Event('keydown');

    beforeAll(function () {
      $(document.body).html('');
    });

    afterAll(function() {
      $('body').empty();
    });

    afterEach(function (done) {
      promise
          .close()
          .always(done);
    });

    describe('Show Message', function() {
      it('Uses message provided and default message title', function(done) {
        promise = ModalAlert
          .showMessage('Test Message')
          .progress(function() {
            var title = $('.csui-alert .title-text');
            var messageBodyEl = $('.csui-alert .csui-simple-message-view');
            expect(title.text()).toEqual(lang.DefaultMessageTitle);
            expect(messageBodyEl.text()).toEqual('Test Message');
            done();
          });
      });
    });

    describe('Show Warning', function () {
      it('Uses default warning title when no title provided', function (done) {
        promise = ModalAlert
            .showWarning('test warning')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultWarningTitle);
              done();
            });
      });

      it('Uses title provided', function (done) {
        promise = ModalAlert
            .showWarning('test warning', 'Ham')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual('Ham');
              done();
            });
      });
    });

    describe('Show Error', function () {
      it('Uses default error title when no title provided', function (done) {
        promise = ModalAlert
            .showError('test error')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultErrorTitle);
              done();
            });
      });

      it('Uses title provided', function (done) {
        promise = ModalAlert
            .showError('test error', 'Abc')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual('Abc');
              done();
            });
      });
    });

    describe('Show Information', function () {
      it('Uses default info title when no title provided', function (done) {
        promise = ModalAlert
            .showInformation('test info')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultInfoTitle);
              done();
            });
      });

      it('Uses title provided', function (done) {
        promise = ModalAlert
            .showInformation('test info', 'Inf')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual('Inf');
              done();
            });
      });
    });

    describe('Show Success', function () {
      it('Uses default success title when no title provided', function (done) {
        promise = ModalAlert
            .showSuccess('test success')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultSuccessTitle);
              done();
            });
      });

      it('Uses title provided', function (done) {
        promise = ModalAlert
            .showSuccess('test success', 'Scss')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual('Scss');
              done();
            });
      });
    });

    describe('Confirm Message', function () {
      it('Uses default message title when no title is provided', function (done) {
        promise = ModalAlert
            .confirmMessage('test confirm message')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultMessageTitle);
              done();
            });
      });

      it('Uses title when provided', function (done) {
        promise = ModalAlert
            .confirmMessage('test confirm message', 'Confirm Message')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual('Confirm Message');
              done();
            });
      });
    });

    describe('Confirm Warning', function () {
      it('Uses default warning title, when no title is provided', function (done) {
        promise = ModalAlert
            .confirmWarning('test confirm warning')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultWarningTitle);
              done();
            });
      });
    });

    describe('Confirm Error', function () {
      it('Uses default error title, when no title is provided', function (done) {
        promise = ModalAlert
            .confirmError('test confirm error')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultErrorTitle);
              done();
            });
      });
    });

    describe('Confirm Information', function () {
      it('Uses default information title, when no title is provided', function (done) {
        promise = ModalAlert
            .confirmInformation('test confirm information')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultInfoTitle);
              done();
            });
      });
    });

    describe('Confirm Success', function () {
      it('Uses default success title, when no title is provided', function (done) {
        promise = ModalAlert
            .confirmSuccess('test confirm success')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultSuccessTitle);
              done();
            });
      });
    });

    describe('Confirm Question', function () {
      it('Uses default question title, when no title is provided', function (done) {
        promise = ModalAlert
            .confirmQuestion('test confirm question')
            .progress(function () {
              var title = $('.csui-alert .title-text');
              expect(title.text()).toEqual(lang.DefaultQuestionTitle);
              done();
            });
      });
    });

    describe('Modal Alert Interaction validation', function() {
      it('Clicks Yes', function(done) {
        promise = ModalAlert
          .confirmMessage({
            title: 'Clicks Yes',
            message: 'Yes button will be click',
            callback: function(result) {
              expect(result).toBeTrue();
            },
            buttons: ModalAlert.buttons.YesNoCancel,
            modalClass: 'click-yes-btn'
          })
          .progress(function() {
            var footer = $('.csui-alert.click-yes-btn .binf-modal-footer');
            var btnEl = $(footer).find('.binf-btn.csui-yes');
            if(btnEl) {
              btnEl.trigger('click');
              setTimeout(function() {
                var alertEl = $('.csui-alert.click-yes-btn');
                expect(alertEl.length).toBeLessThan(1);
                done();
              }, transitionDelay);
            }
          });
      });

      it('Clicks No', function(done) {
        promise = ModalAlert
          .confirmMessage({
            title: 'Clicks No',
            message: 'No button will be click',
            callback: function(result) {
              expect(result).toBeFalse();
            },
            buttons: ModalAlert.buttons.YesNoCancel,
            modalClass: 'click-no-btn'
          })
          .progress(function() {
            var footer = $('.csui-alert.click-no-btn .binf-modal-footer');
            var btnEl = $(footer).find('.binf-btn.csui-no');
            if(btnEl) {
              btnEl.trigger('click');
              setTimeout(function() {
                var alertEl = $('.csui-alert.click-no-btn');
                expect(alertEl.length).toBeLessThan(1);
                done();
              }, transitionDelay);
            }
          });
      });

      it('Presses Enter Key on main element to trigger default btn click', function(done) {
        promise = ModalAlert
          .confirmMessage({
            title: 'Presses Enter Key on main element',
            message: 'Enter key will be pressed main element and alert will be closed!',
            buttons: ModalAlert.buttons.YesNoCancel,
            modalClass: 'enter-on-main-el'
          })
          .progress(function() {
            keydownEvent.which = 13;
            keydownEvent.keyCode = 13;
            var alertEl = $('.csui-alert.enter-on-main-el');
            $(alertEl).keydown(function(e) {
              expect(e.which || e.keyCode).toEqual(13);
              setTimeout(function() {
                var alertEl = $('.csui-alert.enter-on-main-el');
                expect(alertEl.length).toBeLessThan(1);
                done();
              }, transitionDelay);
            }).trigger(keydownEvent);
          });
      });
      it('Presses Tab Key', function(done) {
        promise = ModalAlert
          .confirmMessage({
            title: 'Presses Tab Key',
            message: 'Tab key will be pressed!',
            buttons: ModalAlert.buttons.YesNoCancel,
            modalClass: 'press-tab-key'
          })
          .progress(function() {
            keydownEvent.which = 9;
            keydownEvent.keyCode = 9;
            var alertEl = $('.csui-alert.press-tab-key');
            $(alertEl).keydown(function(e) {
              expect(e.which || e.keyCode).toEqual(9);
              var alertEl = $('.csui-alert.press-tab-key');
              expect(alertEl.length).toBeGreaterThan(0);
              done();
            }).trigger(keydownEvent);
          });
      });
    });

    describe('Initialization checks', function() {
      it('Uses modalClass provided', function(done) {
        promise = ModalAlert
          .showSuccess('test modal class provided', {modalClass: 'my-custom-modal-class'})
          .progress(function() {
            var modalEl = $('.csui-alert.my-custom-modal-class');
            expect(modalEl.length).toBeGreaterThan(0);
            done();
          });
      });

      it('No static backdrop check, should close alert on backdrop click', function(done) {
        promise = ModalAlert
          .showSuccess('static backdrop is false', {staticBackdrop: false, modalClass: 'no-static-backdrop'})
          .progress(function() {
            var backdropEl = $('.csui-alert.no-static-backdrop .binf-modal-backdrop');
            expect(backdropEl.length).toEqual(1);
            backdropEl.trigger('click');
            setTimeout(function() {
              var alertEl = $('.csui-alert.no-static-backdrop');
              expect(alertEl.length).toBeLessThan(1);
              done();
            }, transitionDelay);
          });
      });

      it('Uses no buttons configuration', function(done) {
        promise = ModalAlert
          .showSuccess('test no buttons configuration', {buttons: []})
          .progress(function() {
            var footer = $('.csui-alert.binf-modal .binf-modal-footer');
            var closeBtnEl = $(footer).find('.binf-btn.csui-cancel');
            expect(closeBtnEl.length).toBeGreaterThan(0);
            done();
          });
      });

      it('Uses buttons provided', function(done) {
        promise = ModalAlert
          .showSuccess('test buttons provided', {buttons: ModalAlert.buttons.YesNoCancel})
          .progress(function() {
            var footer = $('.csui-alert.binf-modal .binf-modal-footer');
            ['.csui-yes', '.csui-no', '.csui-cancel'].forEach(function(btnClass) {
              var btnEl = $(footer).find('.binf-btn' + btnClass);
              expect(btnEl.length).toBeGreaterThan(0);
            });
            done();
          });
      });

      it('Uses empty message provided', function(done) {
        promise = ModalAlert
          .showMessage({message: ''})
          .progress(function() {
            var messageBodyEl = $('.csui-alert .csui-simple-message-view');
            expect(messageBodyEl.text()).toEqual('');
            done();
          });
      });

      it('Uses close btn provided', function(done) {
        promise = ModalAlert
          .showSuccess({buttons: ModalAlert.buttons.Close})
          .progress(function() {
            var footer = $('.csui-alert .binf-modal-footer');
            var btnEl = $(footer).find('.binf-btn.csui-cancel');
            expect(btnEl.length).toBeGreaterThan(0);
            done();
          });
      });
      
      it('Uses bodyView provided', function(done) {
        promise = ModalAlert
          .showSuccess({
            bodyView: Marionette.ItemView.extend({
              className: 'my-custom-body-view',
              template: function() {
                return _.template(
                  '<p class="my-text" style="color: red;">Custom body view</p>'
                );
              }
            })
          })
          .progress(function() {
            var bodyViewEl = $('.csui-alert .my-custom-body-view');
            expect(bodyViewEl.length).toBeGreaterThan(0);
            done();
          });
      });
    });
  });
});
