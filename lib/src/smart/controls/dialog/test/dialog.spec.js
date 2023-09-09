/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    "nuc/lib/jquery",
    "nuc/lib/underscore",
    'nuc/lib/backbone',
    "smart/controls/dialog/dialog.view",
    'smart/controls/dialog/footer.view',
    'smart/controls/dialog/header.view',
    "../../../utils/testutils/async.test.utils.js"
],
    function ($, _, Backbone, DialogView, DialogFooterView, DialogHeaderView, TestUtils) {

        describe("Dialog Control", function () {
            var promise;

            beforeAll(function () {
                $(document.body).html('');
            });

            afterAll(function () {
                $('body').empty();
            });

            afterAll(function () {
                TestUtils.cancelAllAsync();
                TestUtils.restoreEnvironment();
            });


            var dialogView = new DialogView({
                title: 'Title',
                content: new Backbone.View(),
                bodyMessage: "Lorem Ipsum....",
                buttons: [
                    { id: 'cancel1', label: 'Button1', default: true, close: true },
                    { id: 'cancel', label: 'Button2', close: true }
                ],
                smallSize: true
            });

            var headerView = new DialogHeaderView({
                ui: {
                    headerControl: '.cs-header-control',
                    closeButton: '.cs-close'
                }
            });
            var footerView = new DialogFooterView({});

            var renderFooter, renderHeader;

            beforeEach(function () {
            });

            afterEach(function () {
            });

            it("Should show a Small Dialog", function () {
                var modal;
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    smallSize: true,
                    buttons: [
                        { id: 'cancel1', label: 'FullDialog Btn1', default: true, close: true },
                        { id: 'cancel', label: 'FullDialog Btn1', close: true }
                    ],
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true,
                            iconNameRight: 'Close'
                        }
                    ]
                });
                dialogView.show();
                headerView.render();
                footerView.render();
                modal = dialogView.$el.find('.binf-modal-dialog');
                expect(modal.hasClass('binf-modal-sm')).toBeTruthy();
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();


            });

            it("Should show a Large Dialog", function () {
                var modal;
                var dialogView = new DialogView({
                    title: 'Title Large',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    largeSize: true,
                    buttons: [
                        { id: 'cancel1', label: 'LargeDialog Btn1', default: true, close: true },
                        { id: 'cancel', label: 'LargeDialog Btn1', close: true }
                    ],
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });
                dialogView.show();
                headerView.render();
                footerView.render();
                modal = dialogView.$el.find('.binf-modal-dialog');
                expect(modal.hasClass('binf-modal-lg')).toBeTruthy();
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();
            });

            it("Should show a Medium Dialog", function () {
                var modal;
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    midSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });

                dialogView.show();
                headerView.render();
                footerView.render();
                modal = dialogView.$el.find('.binf-modal-dialog');
                expect(modal.hasClass('binf-modal-md')).toBeTruthy();
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();
            });

            it("Should show Trigger click and close Dialog on space bar on Header", function () {
                var modal;
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    fullSize: true,
                    buttons: [
                        { id: 'cancel1', label: 'FullDialog Btn1', default: true, close: true },
                        { id: 'cancel', label: 'FullDialog Btn1', close: true }
                    ],
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });

                dialogView.show();
                headerView.render();
                footerView.render();
                setTimeout(function () {
                    modal = dialogView.$el.find('div.cs-dialog.binf-modal.binf-fade.binf-in');
                    headerView.onKeyInView({
                        keyCode: 32,
                        target: '<div>Close</div>'
                    });
                    expect(modal.is(':visible')).toBeFalsy();
                }, 100);
            });

            it("Should render Header and Footer view", function () {
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Button1', default: true, close: true },
                        { id: 'cancel', label: 'Button2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true,
                            iconNameRight: 'Close'
                        }
                    ],
                    headerControl: ''
                });
                var footerView = new DialogFooterView();
                dialogView.show();
                var modal = dialogView.$el.find('.binf-modal-dialog');
                expect(modal.hasClass('binf-modal-sm')).toBeTruthy();
                headerView.render();
                footerView.render();
                var header = dialogView.$el.find('.binf-modal-header');
                var footer = dialogView.$el.find('.binf-modal-footer');
                var heading = header.find("h2");
                expect(heading.hasClass('binf-modal-title')).toBeTruthy();
                expect(header.text().trim()).toEqual('Title');
                expect(footer.hasClass('binf-hidden')).toBeFalsy();
            });

            it("Should close the Modal on click of Cancel Button", function () {
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Button1', default: true, close: true },
                        { id: 'cancel', label: 'Button2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });

                dialogView.show();
                var modal = dialogView.$el.find('.binf-modal-dialog');
                var footer = dialogView.$el.find('.binf-modal-footer');

                var cancel = $('#cancel');
                expect(cancel.length).toEqual(1);
                cancel && cancel.click();

                expect(footer.hasClass('binf-hidden')).toBeFalsy();
                expect(modal.is(':visible')).toBeFalsy();
            });

            it("Should close the Modal on click of Close Icon", function () {
                var dialogView = new DialogView({
                    title: 'Close Icon Test',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });

                dialogView.show();
                var modal = dialogView.$el.find('.binf-modal-dialog');
                var footer = dialogView.$el.find('.binf-modal-footer');

                var closeIcon = dialogView.$el.find('.cs-close');
                expect(closeIcon.length).toEqual(1);
                expect(footer.hasClass('binf-hidden')).toBeTruthy();  // footer should be hidden if Close Icon is visible
                closeIcon && closeIcon.click();
                expect(modal.is(':visible')).toBeFalsy();
            });

            it("Should Kill the view", function () {
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Button1', default: true, close: true },
                        { id: 'cancel', label: 'Button2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });

                dialogView.show();
                expect(dialogView.kill()).toEqual(true);
            });

            it("Should Update the Button Text is available", function () {
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Button1', default: true, close: true },
                        { id: 'cancel', label: 'Button2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });

                var attribute = {
                    close: true,
                    default: true,
                    label: "New Text Label",
                    id: "cancel1"
                };

                dialogView.show();
                var modal = dialogView.$el.find('.binf-modal-dialog');
                var footer = dialogView.$el.find('.binf-modal-footer');
                expect(footer.hasClass('binf-hidden')).toBeFalsy();
                dialogView.updateButton('cancel1', attribute);
                var btn = $('#cancel1');
            });

            it("Should show the Dialog", function () {
                var dialogView = new DialogView({
                    title: 'Show Title',
                    content: new Backbone.View(),
                    bodyMessage: "Show Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Show1', default: true, close: true },
                        { id: 'cancel', label: 'Show2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });
                dialogView.show();
                headerView.render();
                footerView.render();
                var spy = jasmine.createSpy('event');
                dialogView.on('after:show', spy);
                
                var modal = dialogView.$el.find('div.cs-dialog.binf-modal.binf-fade.binf-in');
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();
            });

            it("Should Destroy the view", function () {
                var modal;
                var dialogView = new DialogView({
                    title: 'Title Large',
                    content: new Backbone.View(),
                    bodyMessage: "336 Lorem Ipsum....",
                    largeSize: true,
                    buttons: [
                        { id: 'cancel1', label: 'LargeDialog Btn1', default: true, close: true },
                        { id: 'cancel', label: 'LargeDialog Btn1', close: true }
                    ],
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });
                dialogView.show();
                headerView.render();
                footerView.render();
                modal = dialogView.$el.find('.binf-modal-dialog');
                expect(modal.hasClass('binf-modal-lg')).toBeTruthy();
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();
                dialogView.$el.show();
                dialogView.destroy();
                modal = dialogView.$el.find('div.cs-dialog.binf-modal.binf-fade.binf-in');
                expect(modal.is(':visible')).toBeFalsy();
            });

            it("Should close the Modal on keycode 27", function () {
                var modal;

                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Key Code - 27, Escape, Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Btn1', default: true, close: true },
                        { id: 'cancel', label: 'Btn2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true
                        }
                    ]
                });
                dialogView.show();
                headerView.render();
                footerView.render();
                modal = dialogView.$el.find('.binf-modal-dialog');
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();
                dialogView.onKeyInView({
                    keyCode: 27,
                    isDefaultPrevented: function () { return false; },
                    stopPropagation: function () { return true; }
                });
                expect(modal.is(':visible')).toBeFalsy();
            });

            it("Should handle the Modal on keycode Shift", function () {
                var modal;
                var dialogView = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "Key Code - 9 - No Shift, Lorem Ipsum....",
                    buttons: [
                        { id: 'cancel1', label: 'Btn1', default: true, close: true },
                        { id: 'cancel', label: 'Btn2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true,
                            iconNameRight: 'Close'
                        }
                    ]
                });
                dialogView.show();
                headerView.render();
                footerView.render();
                modal = dialogView.$el.find('.binf-modal-dialog');
                expect(dialogView.$el.hasClass('cs-dialog binf-modal binf-fade')).toBeTruthy();
                dialogView.$el.focus();
                dialogView.$el.trigger('focus');
                dialogView.onKeyInView({
                    keyCode: 9,
                    shiftKey: false,
                    stopPropagation: function () { return true; }
                });
                expect(modal.is(':visible')).toBeFalsy();
                dialogView.kill();
            });

            it("Should handle the Modal on keycode Shift-tab", function () {
                var modal;
                var dialogView1 = new DialogView({
                    title: 'Title',
                    content: new Backbone.View(),
                    bodyMessage: "222 Should handle the Modal on keycode Shift only.... onKeyInView ",
                    buttons: [
                        { id: 'cancel1', label: 'KeyView1', default: true, close: true },
                        { id: 'cancel', label: 'KeyView2', close: true }
                    ],
                    smallSize: true,
                    headers: [
                        {
                            title: 'Title',
                            iconRight: true,
                            class: 'some-class',
                            actionIconLeft: true,
                            iconNameRight: 'Close'
                        }
                    ]
                });
                dialogView1.show();
                headerView.render();
                footerView.render();
                setTimeout(function () {

                    headerView.render();
                    footerView.render();
                    modal = dialogView1.$el.find('div.cs-dialog.binf-modal.binf-fade.binf-in');
                    dialogView1.$el.focus();
                    dialogView1.$el.trigger('focus');
                    dialogView1.onKeyInView({
                        keyCode: 9,
                        shiftKey: true,
                        stopPropagation: function () { return true; }
                    });
                    expect(modal.is(':visible')).toBeFalsy();
                    dialogView.kill();
                }, 200);
            });

        });
    });
