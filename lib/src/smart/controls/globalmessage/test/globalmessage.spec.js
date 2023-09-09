/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'nuc/lib/underscore',
    'nuc/lib/jquery',
    'nuc/lib/marionette',
    'smart/controls/globalmessage/globalmessage',
    '../../../utils/testutils/async.test.utils'
], function (_, $, Marionette, GlobalMessage, TestUtils) {
    'use strict';

    describe('Global Message', function () {
        let messageRegionView;

        function initialize() {
            var divContainer = '<div id="container" class="svf-globalmsg"></div>';
            $('body').append(divContainer);

            messageRegionView = new Marionette.Region({
                el: '#container'
            });

            GlobalMessage.setMessageRegionView(messageRegionView);
        }

        function destroy() {
            messageRegionView && messageRegionView.destroy();
            $('body').empty();
        }

        afterAll(function() {
            destroy();
            TestUtils.cancelAllAsync();
            TestUtils.restoreEnvironment();
        });

        describe('Show Info Message with all other functionalities', function () {
            it('should show message in default message region', function(done){
                GlobalMessage.showMessage('info', 'test');
                expect($('.csui-message-container').length).toBe(1);
                done();
            });

            it('should show default info message', function (done) {
                initialize();
                GlobalMessage.showMessage(null, 'This is default info');
                expect($('.csui-global-message').length).toEqual(1);
                expect($('.csui-global-message.csui-info').length).toEqual(1);
                destroy();
                done();
            });

            it('should show info message without details', function (done) {
                initialize();
                GlobalMessage.showMessage('info', 'This is default info');
                expect($('.csui-global-message.csui-info').length).toEqual(1);
                destroy();
                done();
            });

            it('should show info message with details', function (done) {
                initialize();
                GlobalMessage.showMessage('info', 'This is default info', 'Dummy details message.');
                var messageEl = $('.csui-global-message');

                var header = $(messageEl).find('.csui-header');
                var moreDetails = $(header).find('.csui-action-moredetails');
                var fewerDetails = $(header).find('.csui-action-fewerdetails');
                moreDetails.trigger('click');
                expect($('.csui-global-message.csui-collapsed').length).toBe(0);

                var detailText = $(messageEl).find('.csui-details .csui-text');
                expect(detailText.text()).toEqual('Dummy details message.');
                fewerDetails.trigger('click');
                fewerDetails.trigger('click');
                TestUtils.asyncElement('body', '.csui-global-message.csui-collapsed').done(
                    function (el) {
                        expect(el.length).toBe(1);
                        destroy();
                        done();
                    }
                );
            });

            it('closes message panel when close btn is clicked', function(done) {
                initialize();
                GlobalMessage.showMessage('info', 'Test message', 'More details');
                var messageEl = $('.csui-global-message');
                var messageHeader = $(messageEl).find('.csui-header');

                var closeBtn = $(messageHeader).find('.csui-action-close');
                expect($(closeBtn).length).toEqual(1);
                closeBtn.click();

                TestUtils.asyncElement('body', '.csui-global-message:visible', true).done(
                    function (el) {
                        expect(el.length).toBe(0);
                        destroy();
                        done();
                    }
                );
            });

            it('closes success message panel after certain time {5000 milliseconds} if doAutoClose is not defined (auto close behavior)', function(done) {
                const timeout = 5000;

                initialize();
                GlobalMessage.showMessage('success', 'Close after ' + timeout + ' milliseconds.', 'detailed message');
                const startTime = new Date();
                TestUtils.asyncElement('body', '.csui-global-message:visible', true).done(
                    function (el) {
                        const endTime = new Date();
                        expect(el.length).toBe(0);
                        const timeTaken = (endTime - startTime);
                        const expectedMaxTime = timeout + 1000;
                        expect(timeTaken).toBeLessThan(expectedMaxTime);
                        destroy();
                        done();
                    }
                );
            });

            it('closes success message panel after specified time when doAutoClose is true (auto close behavior)', function(done) {
                const timeout = 1000;
                const options = {doAutoClose: true, autoCloseTimeout: timeout};

                initialize();
                GlobalMessage.showMessage('success', 'Close after ' + timeout + ' milliseconds.', 'detailed message', options);
                const startTime = new Date();
                TestUtils.asyncElement('body', '.csui-global-message:visible', true).done(
                    function (el) {
                        const endTime = new Date();
                        expect(el.length).toBe(0);
                        const timeTaken = (endTime - startTime);
                        const expectedMaxTime = timeout + 1000;
                        expect(timeTaken).toBeLessThan(expectedMaxTime);
                        destroy();
                        done();
                    }
                );
            });

            it('should show multiple messages within same message region view', function(done) {
                initialize();
                GlobalMessage.showMessage('info', 'info message');
                GlobalMessage.showMessage('info', 'info message');
                var messages = $('.svf-globalmsg').find('.csui-global-message');
                expect(messages.length).toBeGreaterThan(1);
                destroy();
                done();
            });

            it('should show multiple messages within same message region view', function(done) {
                initialize();
                GlobalMessage.showMessage('info', 'info message');
                GlobalMessage.showMessage('info', 'info message');
                var messages = $('.svf-globalmsg').find('.csui-global-message');
                expect(messages.length).toBeGreaterThan(1);
                destroy();
                done();
            });
        });

        describe('Show other variants for global message', function(){
            it('should show success message', function(done){
                initialize();

                GlobalMessage.showMessage('success', 'success message');
                var messageEl = $('.csui-global-message.csui-success');
                expect($(messageEl).length).toBe(1);
                
                destroy();
                done();
            });

            it('should show error message', function(done){
                initialize();

                GlobalMessage.showMessage('error', 'error message');
                var messageEl = $('.csui-global-message.csui-error');
                expect($(messageEl).length).toBe(1);
                
                destroy();
                done();
            });

            it('should show warning message', function(done){
                initialize();

                GlobalMessage.showMessage('warning', 'warning message');
                var messageEl = $('.csui-global-message.csui-warning');
                expect($(messageEl).length).toBe(1);
                
                destroy();
                done();
            });

            it('should show custom view', function(done){
                let view =  new Marionette.ItemView({
                    tagName: 'h1',
                    className: 'custom-view-message',
                    template: _.template('This is custom view'),
                    onRender() {
                        return this;
                    }
                });

                initialize();
                GlobalMessage.showCustomView(view);
                expect($('.csui-global-message').find('.custom-view-message').length).toBe(1);
                destroy();
                done();
            });
        });
    });
});