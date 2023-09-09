/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
    'csui/lib/jquery',
    'csui/lib/jquery.mockjax',
    'conws/utils/test/testutil',
    'conws/widgets/header/header.view',
    './header.mock.testmanager.js',
    'csui/controls/dialog/dialog.view'
], function ($, mockjax, TestUtil, HeaderView, TestManager, ModalDialogView)
    {
      describe('HeaderViewShowError', function () {

        var view, dialog;

        describe('show error', function () {

          beforeEach(function () {
            TestManager.reset();
            TestManager.init(4711);
            TestManager.prepareError(4711);

            view = TestManager.view;

            dialog = new ModalDialogView({
              view: view,
              className: 'conws-team-header'
            });
            dialog.show();
          });

          afterEach(function(){
            mockjax.clear();
            if (dialog) {
              dialog.destroy();
              dialog = undefined;
            }
            $('.cs-dialog.binf-modal').remove();
          });

          it('... for status 400', function (done) {

            view.model.fetch().then(function() {
              done.fail(new Error("fetch unexpectedly successful"));
            },function(){
              TestUtil.waitFor(function () {
                return (view.$('.conws-header-error').length === 1);
              }, 'loading error dialog', 200).then(function(){
                expect(view instanceof HeaderView).toBeTruthy;
                var errorIconClass = view.$('.conws-header-error-icon');
                expect(errorIconClass.length).toEqual(1);
                var errorMessage = view.$('.conws-header-message');
                expect(errorMessage.text()).toEqual('Invalid datatype specified for argument "bw_id".');
                done();
              },done.fail);
            });
        });

        });
    });
});