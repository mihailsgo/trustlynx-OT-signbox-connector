/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/marionette', 'nuc/lib/backbone',
    'nuc/lib/jquery',
    'nuc/utils/connector',
    'nuc/utils/basicauthenticator',
    'json!./user.profile.data.json',
    'smart/controls/user/user.profile.view',
    '../../../utils/testutils/async.test.utils',]
    , function (Marionette, Backbone, $, Connector
        , BasicAuthenticator, UserMock
        , SimpleUserWidgetView, TestUtils) {

        describe("Simple User Widget", function () {
            var userProfileRegion;

            function initialize() {
                var divContainer = `<div class="user-profile" id="region" style="
                    height: calc(100vh - 96px);
                    width: 425px;
                    position: absolute;
                    margin: 20px 112px; ">
                </div>`;

                $('body').append(divContainer);

                userProfileRegion = new Marionette.Region({
                    el: "#region"
                });
            }

            function destroy() {
                $('body').html('');
                userProfileRegion.destroy();
            }
            var authenticator = new BasicAuthenticator({
                credentials: {
                    username: 'Admin',
                    password: 'livelink'
                }
            });

            var connector = new Connector({
                authenticator: authenticator,
                connection: {
                    url: '//server/otcs/cs/api/v2',
                    supportPath: '/support',
                    session: {
                        ticket: 'dummy'
                    }
                }
            });
            window.tabsLen = 5;
            var data = UserMock.auth.data,
                options = {
                    connector: connector,
                    otherUser: false,
                    userid: "1000", // mandatory
                    loggedUserId: "1000",
                    enableUploadProfilePicture: true,
                    showPresenceIndicator: true,
                    chatEnabled: true,
                    model: new Backbone.Model(data)//{id: "1000",type_name: "User",name: "Admin",display_name: "Admin",userid: "1000" })
                },
                keydownEvent = $.Event('keydown');

            describe("User Widget with chat settings disabled", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    initialize();
                    options = Object.assign(options, { chatEnabled: false });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    simpleUserWidgetView.layoutState = {};

                    userProfileRegion.show(simpleUserWidgetView);
                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    done();
                });

                it("Verifies chat comment button not available", function (done) {
                    var chatBtn = $('.esoc-simple-user-widget .esoc-simple-user-widget-header .esoc-user-profile-chat-comment');
                    expect(chatBtn.length).toEqual(0);
                    done();
                });

                it('Can update profile picture based on enableProfilePicture setting', function (done) {
                    expect($('.edit-user').length).toBe(1);
                    done();
                });

                it('Display title of the user', function (done) {
                    var userTitle = $('.esoc-user-title');
                    expect(userTitle.length).toBe(1);
                    expect(userTitle.text()).toEqual('Administrator');
                    done();
                });

                it('Display the name based on name settings', function (done) {
                    expect($('.smart-user-name:first')[0].firstChild.data.trim()).toBe('Admin');
                    done();
                });

                it('Verify the presence icon is disabled', function (done) {
                    expect($('.esoc-chat-presence-indicator').length).toBe(0);
                    done();
                });

                it('Display initials in profile picture area when no picture or disable the picture enable option',
                    function () {
                        expect(
                            $("img.esoc-full-profile-avatar").css('display')).toBe(
                                'none');
                        expect($(".esoc-userprofile-default-avatar").length).toBe(1);
                    });

                it('Upload a profile picture when we click profile image on logged user', function (done) {
                    $('.esoc-full-profile-avatar-cursor').mouseover();
                    $('.edit-user-image-placeholder.edit-user').trigger("click");
                    $('.esoc-full-profile-avatar-cursor').mouseout();
                    TestUtils.asyncElement('body',
                        '.esoc-simple-user-edit-pic-popover .esoc-simple-user-profile-pic-update:visible').done(
                            function (el) {
                                expect(el.length).toBe(1);
                                var profilePicEdit = $('.esoc-simple-user-profile-pic-edit');
                                expect(profilePicEdit.length).toBe(1);
                                $('.esoc-simple-user-profile-pic-edit').trigger("click");
                                var profilepicInput = $("#esoc-profilepic-desktop-attachment");
                                profilepicInput.triggerHandler('change');
                                done();
                            });
                });

                it('Profile Edit navigation with keyboard events', function (done) {
                    $('.esoc-full-profile-avatar-cursor').mouseover();
                    $('.edit-user-image-placeholder.edit-user').trigger("click");
                    $('.esoc-full-profile-avatar-cursor').mouseout();
                    TestUtils.asyncElement('body',
                        '.esoc-simple-user-edit-pic-popover .esoc-simple-user-profile-pic-update:visible').done(
                            function (el) {
                                expect(el.length).toBe(1);
                                var myKeydownEvent = $.Event('keydown');
                                myKeydownEvent.keyCode = 40;
                                myKeydownEvent.which = 40;
                                $(el.find('.esoc-simple-user-profile-pic-edit')).trigger(myKeydownEvent);
                                done();
                            });
                });

                it('Close Profile Edit popover with escape key', function (done) {
                    $('.esoc-full-profile-avatar-cursor').mouseover();
                    $('.edit-user-image-placeholder.edit-user').trigger("click");
                    $('.esoc-full-profile-avatar-cursor').mouseout();
                    TestUtils.asyncElement('body',
                        '.esoc-simple-user-edit-pic-popover .esoc-simple-user-profile-pic-update:visible').done(
                            function (el) {
                                expect(el.length).toBe(1);
                                var myKeydownEvent = $.Event('keydown');
                                myKeydownEvent.keyCode = 27;
                                myKeydownEvent.which = 27;
                                $(el).trigger(myKeydownEvent);
                                TestUtils.asyncElement('body', '.esoc-simple-user-edit-pic-popover .esoc-simple-user-profile-pic-update:visible', true).done(
                                    function (el) {
                                        expect(el.length).toBe(0);
                                        done();
                                    }
                                );
                            });
                });

                it('validates uploadInProgress', function (done) {
                    simpleUserWidgetView.uploadInProgress();
                    expect($('.esoc-userprofile-actions .esoc-profile-img-load-container .esoc-progress-display').length).toBe(0);
                    expect($('.esoc-userprofile-actions .esoc-full-profile-avatar .esoc-profile-opacity').length).toBe(0);
                    expect($("#esoc-profilepic-desktop-attachment").val()).toBe('');
                    done();
                });

                it('validates updateProfilePicFailure', function (done) {
                    simpleUserWidgetView.updateProfilePicFailure({ parent: userProfileRegion.el, errorContent: 'Test error' });
                    TestUtils.asyncElement('body', '#mdAlert', true).done(
                        function (el) {
                            expect(el).toBeTruthy();
                            $(el).find('.binf-btn.csui-cancel').trigger('click');
                            done();
                        }
                    );
                    done();
                });

                it('validates uploadDone', function (done) {
                    simpleUserWidgetView.uploadDone();
                    expect($('.esoc-simple-profile-img-load-container esoc-simple-profile-img-load-icon').length).toBe(0);
                    done();
                });

                it('delete a profile page when we click profile image on logged user', function (done) {
                    $('.esoc-full-profile-avatar-cursor').mouseover();
                    $('.edit-user-image-placeholder.edit-user').trigger("click");
                    $('.esoc-full-profile-avatar-cursor').mouseout();
                    TestUtils.asyncElement('body',
                        '.esoc-simple-user-edit-pic-popover .esoc-simple-user-profile-pic-update:visible').done(
                            function (el) {
                                expect(el.length).toBe(1);
                                $('.esoc-simple-user-profile-pic-delete').trigger("click");
                                TestUtils.asyncElement('body', '.esoc-upload-image-style:visible', true).done(
                                    function (el) {
                                        expect(el.is(':visible')).toBeFalsy();
                                        done();
                                    });
                            });
                });

                it('validates deletedDone', function (done) {
                    simpleUserWidgetView.deletedDone();
                    expect($('.esoc-userprofile-default-avatar').css('display')).toBe('flex');
                    done();
                });
            });

            describe("User Widget with chat settings disabled", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    initialize();
                    options = Object.assign(options, {
                        chatEnabled: false,
                        enableUploadProfilePicture: false
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    simpleUserWidgetView.layoutState = {};

                    userProfileRegion.show(simpleUserWidgetView);
                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    done();
                });

                it('Can not update profile picture based on enableProfilePicture settings',
                    function (done) {
                        $('.esoc-full-profile-avatar-cursor').mouseover();
                        expect($('.edit-user-image-placeholder .edit-user').length).toBe(0);
                        done();
                    });
            });

            describe("User Widget with chat settings Enabled", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    initialize();
                    options = Object.assign(options, {
                        otherUser: true,
                        chatEnabled: true,
                        showPresenceIndicator: true,
                        enableUploadProfilePicture: true
                    });
                    options.model.set("otherUser", true);
                    options.model.set("chatSettings", {
                        "chatEnabled": true,
                        "presenceEnabled": true
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    simpleUserWidgetView.layoutState = {};

                    userProfileRegion.show(simpleUserWidgetView);

                    simpleUserWidgetView.listenTo(simpleUserWidgetView, "launch:chat:window", function () {
                        console.log("launch:chat:window has been triggered!");
                    });

                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget with chat enabled", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    expect($('.esoc-user-profile-chat-comment').length).toBe(1);
                    done();
                });

                it("Updates presenceIndicator to all available status", function (done) {
                    expect($('.esoc-chat-presence-indicator').length).toBe(1);
                    ['Away', 'Online', 'Offline', 'donodisturb'].forEach(function (status) {
                        simpleUserWidgetView.trigger('update:presence', { showPresenceIndicator: true, status });
                        expect($('.esoc-chat-presence-indicator.esoc-chat-presence-' + status).length).toBe(1);
                        done();
                    });
                });

                it("Launches chat window on chat btn by click", function (done) {
                    $('.esoc-user-profile-chat-comment').trigger('click');
                    done();
                });

                it("Launches chat window on chat by Enter key ", function (done) {
                    keydownEvent.which = 13;
                    keydownEvent.keyCode = 13;
                    $('.esoc-simple-user-widget-view .esoc-user-profile-chat-comment').keydown(function (e) {
                        expect(e.which || e.keyCode).toEqual(13);
                        done();
                    }).trigger(keydownEvent);
                });

                it("Closes user widget on close btn click", function (done) {
                    $('.esoc-simple-user-widget-view .user-widget-view-close').trigger('click');
                    done();
                });
            });

            describe("Close User profile varification", function () {
                var simpleUserWidgetView, userProfileSidePanel;

                beforeAll(function () {
                    initialize();
                    options = Object.assign(options, {
                        otherUser: true,
                        chatEnabled: true,
                        showPresenceIndicator: true,
                        enableUploadProfilePicture: true
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    simpleUserWidgetView.layoutState = {};

                    userProfileRegion.show(simpleUserWidgetView);

                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });
                it("Will not launch chat window on chat by Tab key", function (done) {
                    keydownEvent.which = 9;
                    keydownEvent.keyCode = 9;
                    $('.esoc-simple-user-widget-view .esoc-user-profile-chat-comment').keydown(function (e) {
                        expect(e.which || e.keyCode).toEqual(9);
                        done();
                    }).trigger(keydownEvent);
                });

                it("Will not close user widget after trigger closeSimpleUserWidget on tab key event ", function (done) {
                    var myKeydownEvent = $.Event('keydown');
                    myKeydownEvent.which = 9;
                    myKeydownEvent.keyCode = 9;
                    var closeBtn = $('.user-widget-view-close');
                    expect(closeBtn.length).toBe(1);
                    myKeydownEvent.target = closeBtn;
                    simpleUserWidgetView.closeSimpleUserWidget(myKeydownEvent);
                    done();
                });

                it("Closes user widget by triggering closeSimpleUserWidget", function (done) {
                    var myKeydownEvent = $.Event('keydown');
                    myKeydownEvent.which = 13;
                    myKeydownEvent.keyCode = 13;
                    var closeBtn = $('.user-widget-view-close');
                    expect(closeBtn.length).toBe(1);
                    myKeydownEvent.target = closeBtn;
                    simpleUserWidgetView.closeSimpleUserWidget(myKeydownEvent);
                    done();
                });
            });

            describe("Verify tabs", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    initialize();
                    window.tabsLen = 5;
                    options = Object.assign(options, {
                        otherUser: true,
                        chatEnabled: true,
                        showPresenceIndicator: true,
                        enableUploadProfilePicture: true
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    userProfileRegion.show(simpleUserWidgetView);
                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });
                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    done();
                });

                it("Renders first tab", function (done) {
                    expect($('.tab-content-1').length).toBe(1);
                    done();
                });

                it("Click on second tab", function (done) {
                    $('.esoc-user-profile-loremIpsum2-tab-label').trigger('click');
                    expect($('.tab-content-2').length).toBe(1);
                    done();
                });
               
                it("Closes user widget by triggering closeSimpleUserWidget", function (done) {
                    var myKeydownEvent = $.Event('keydown');
                    myKeydownEvent.which = 13;
                    myKeydownEvent.keyCode = 13;
                    var closeBtn = $('.user-widget-view-close');
                    expect(closeBtn.length).toBe(1);
                    myKeydownEvent.target = closeBtn;
                    simpleUserWidgetView.closeSimpleUserWidget(myKeydownEvent);
                    done();
                });
            });


            describe("Verify tabs KN", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    initialize();
                    window.tabsLen = 5;
                    options.model.set("otherUser", false);
                    options = Object.assign(options, {
                        otherUser: false,
                        chatEnabled: false,
                        showPresenceIndicator: true,
                        enableUploadProfilePicture: true
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    simpleUserWidgetView.layoutState = {};

                    userProfileRegion.show(simpleUserWidgetView);
                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    done();
                });

                it('Close popover', function (done) {
                    $('span.esoc-full-profile-avatar-cursor').mouseover();
                    $('.edit-user-image-placeholder.edit-user').trigger("click");
                    $('.esoc-full-profile-avatar-cursor').mouseout();
                    $('.esoc-simple-user-profile-pic-edit').trigger({ type: 'keydown', keyCode: 27, which: 27 });
                    expect($('.esoc-simple-user-edit-pic-popover').length).toBe(1);
                    done();
                });

                it('SHift tab on profile icon', function (done) {
                    expect($(".esoc-full-profile-avatar-cursor").is(":focus")).toBeTruthy();
                    $('.esoc-full-profile-avatar-cursor').trigger({ type: 'keydown', keyCode: 9, shiftKey: true, which: 9 });
                    expect($(".esoc-user-profile-loremIpsum1-tab-label").is(":focus")).toBeTruthy();
                    done();
                });

                it("Renders first tab", function (done) {
                    expect($('.tab-content-1').length).toBe(1);
                    done();
                });

                it("Traverse to second tab using KN", function (done) {
                    $('.esoc-user-profile-loremIpsum1-tab-label').trigger({ type: 'keydown', keyCode: 39, which: 39 });
                    expect($(".esoc-user-profile-loremIpsum2-tab-label").is(":focus")).toBeTruthy();
                    done();
                });

                it("Traverse to first tab using KN", function (done) {
                    $('.esoc-user-profile-loremIpsum2-tab-label').trigger({ type: 'keydown', keyCode: 37, which: 37 });
                    expect($(".esoc-user-profile-loremIpsum1-tab-label").is(":focus")).toBeTruthy();
                    done();
                });

                it('verify focus back on profile icon', function (done) {
                    expect($(".esoc-user-profile-loremIpsum1-tab-label").is(":focus")).toBeTruthy();
                    $('.esoc-user-profile-loremIpsum1-tab-label').trigger({ type: 'keydown', keyCode: 9, which: 9 });
                    expect($(".esoc-full-profile-avatar-cursor").is(":focus")).toBeTruthy();
                    done();
                });

            });

            describe("Verify tab sequence", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    window.tabsLen = 5;
                    initialize();
                    options = Object.assign(options, {
                        otherUser: true,
                        chatEnabled: true,
                        showPresenceIndicator: true,
                        enableUploadProfilePicture: true,
                        sequence: ["loremIpsum3", "loremIpsum2"]
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    userProfileRegion.show(simpleUserWidgetView);

                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });
                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    done();
                });

                it("Renders first tab", function (done) {
                    expect($('.tab-content-3').length).toBe(1);
                    done();
                });

                it("Click on second tab", function (done) {
                    $('.esoc-user-profile-loremIpsum2-tab-label').trigger('click');
                    expect($('.tab-content-2').length).toBe(1);
                    done();
                });
               
                it("Closes user widget by triggering closeSimpleUserWidget", function (done) {
                    var myKeydownEvent = $.Event('keydown');
                    myKeydownEvent.which = 13;
                    myKeydownEvent.keyCode = 13;
                    var closeBtn = $('.user-widget-view-close');
                    expect(closeBtn.length).toBe(1);
                    myKeydownEvent.target = closeBtn;
                    simpleUserWidgetView.closeSimpleUserWidget(myKeydownEvent);
                    done();
                });
            });

            describe("Verify tabs hidden", function () {
                var simpleUserWidgetView;

                beforeAll(function () {
                    window.tabsLen = 1;
                    initialize();
                    options = Object.assign(options, {
                        otherUser: true,
                        chatEnabled: true,
                        showPresenceIndicator: true,
                        enableUploadProfilePicture: true
                    });

                    simpleUserWidgetView = new SimpleUserWidgetView(options);
                    userProfileRegion.show(simpleUserWidgetView);

                });

                afterAll(function () {
                    destroy();
                    simpleUserWidgetView.trigger("destroy");
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });
                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(simpleUserWidgetView.isRendered).toBeTruthy();
                    done();
                });

                it("Tab header to be hidden", function (done) {
                    expect($('.esoc-simple-user-widget-tabs .tab-links-header').length).toBe(1);
                    done();
                });


            });

        });
    });

