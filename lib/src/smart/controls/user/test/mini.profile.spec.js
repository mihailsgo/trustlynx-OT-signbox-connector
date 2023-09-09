/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/marionette', 'nuc/lib/backbone',
    'nuc/lib/jquery',
    'nuc/utils/connector',
    'nuc/utils/basicauthenticator',
    'json!./user.profile.data.json',
    'smart/controls/user/miniprofile.view',
    '../../../utils/testutils/async.test.utils',]
    , function (Marionette, Backbone, $, Connector
        , BasicAuthenticator, UserMock
        , MiniProfileView, TestUtils) {

        describe("Mini Profile view", function () {
            var miniProfileRegion;

            function initialize() {
                var divContainer = `<div class="mini-profile" id="region"  style="
                position: absolute;
                margin: 20px 112px;">
                </div>`;

                $('body').append(divContainer);

                miniProfileRegion = new Marionette.Region({
                    el: "#region"
                });
            }

            function destroy() {
                $('body').html('');
                miniProfileRegion.destroy();
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
                };

            describe("Mini profile with chat settings disabled", function () {
                var miniProfileView;

                beforeAll(function () {
                    initialize();
                    options = Object.assign(options, { chatEnabled: false });

                    miniProfileView = new MiniProfileView(options);
                    miniProfileView.layoutState = {};

                    miniProfileRegion.show(miniProfileView);

                });

                afterAll(function () {
                    destroy();
                    miniProfileView.trigger("destroy");
                    miniProfileView = undefined;
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(miniProfileView.isRendered).toBeTruthy();

                    done();
                });

                it("Verifies chat comment button not available", function (done) {
                    var chatBtn = $('.esoc-simple-user-widget .esoc-simple-user-widget-header .esoc-user-profile-chat-comment');
                    expect(chatBtn.length).toEqual(0);
                    done();
                });

                it('Verify the presence icon is disabled', function (done) {
                    expect($(".esoc-mini-profile-presence-indicator").hasClass("binf-hidden")).toBeTruthy();
                    done();
                });

            });

            describe("Mini profile with chat settings disabled other user", function () {
                var miniProfileView;

                beforeAll(function () {
                    initialize();
                    options = Object.assign(options, { chatEnabled: false });
                    options.model.set("otherUser", true);
                    miniProfileView = new MiniProfileView(options);
                    miniProfileView.layoutState = {};

                    miniProfileRegion.show(miniProfileView);
                    var data = {
                        chatSettings: {
                            chatDomain: "opentext.com",
                            chatEnabled: false,
                            presenceEnabled: true
                        }
                    };
                    miniProfileView.trigger("show:display:actions", data);

                });

                afterAll(function () {
                    destroy();
                    miniProfileView.trigger("destroy");
                    miniProfileView = undefined;
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(miniProfileView.isRendered).toBeTruthy();

                    done();
                });

                it("Verifies chat comment button not available", function (done) {
                    var chatBtn = $('.esoc-simple-user-widget .esoc-simple-user-widget-header .esoc-user-profile-chat-comment');
                    expect(chatBtn.length).toEqual(0);
                    done();
                });

                it('Verify the presence icon is disabled', function (done) {
                    expect($(".esoc-mini-profile-presence-indicator").hasClass("binf-hidden")).toBeTruthy();
                    done();
                });

            });

            describe("Mini Profile with chat settings enabled", function () {
                var miniProfileView;

                beforeAll(function () {
                    initialize();
                    options.model.get("chatSettings").chatEnabled = true;
                    options.model.set("otherUser", true);
                    miniProfileView = new MiniProfileView(options);
                    miniProfileView.layoutState = {};

                    miniProfileRegion.show(miniProfileView);
                    miniProfileView.trigger("update:presence:indicator", {
                        showPresenceIndicator: true
                    });
                    var data = {
                        chatSettings: {
                            chatDomain: "opentext.com",
                            chatEnabled: true,
                            presenceEnabled: true
                        }
                    };
                    miniProfileView.trigger("show:display:actions", data);

                });

                afterAll(function () {
                    destroy();
                    miniProfileView.trigger("destroy");
                    miniProfileView = undefined;
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(miniProfileView.isRendered).toBeTruthy();
                    done();
                });
                it("Verifies chat comment button not available", function (done) {
                    var chatBtn = $('.esoc-mini-profile-chat-comment');
                    expect(chatBtn.length).toEqual(1);
                    done();
                });

                it('Verify the presence icon is not disabled', function (done) {
                    expect($(".esoc-mini-profile-presence-indicator").hasClass("binf-hidden")).toBeFalsy();
                    done();
                });

                it("Launches chat window on chat btn by click", function (done) {
                    const keyDownEv = new Event('click');
                    spyOn(miniProfileView, 'launchChatWindow');
                    $('.esoc-miniprofile-chat-action-1000').trigger('click');
                    expect(miniProfileView.launchChatWindow).toHaveBeenCalled();

                    done();
                });

            });

            describe("Mini Profile KN", function () {
                var miniProfileView;

                beforeAll(function () {
                    initialize();
                    options.model.get("chatSettings").chatEnabled = true;
                    options.model.set("otherUser", true);
                    options.model.id = null;
                    miniProfileView = new MiniProfileView(options);
                    miniProfileView.layoutState = {};

                    miniProfileRegion.show(miniProfileView);
                    miniProfileView.trigger("update:presence:indicator", {
                        showPresenceIndicator: true
                    });
                    miniProfileView.trigger("show:display:actions");

                });

                afterAll(function () {
                    destroy();
                    miniProfileView.trigger("destroy");
                    miniProfileView = undefined;
                    TestUtils.cancelAllAsync();
                    TestUtils.restoreEnvironment();
                });

                it("Renders SimpleUserWidgetView widget", function (done) {
                    expect(miniProfileView.isRendered).toBeTruthy();
                    done();
                });
                it("Put focus one first element", function (done) {
                    var ele = miniProfileView.$el.find('a[href], *[tabindex]');
                    ele[0].focus();
                    expect($(ele[0]).is(":focus")).toBeTruthy();
                    done();
                });

                it("Verifies shift tab on first element", function (done) {
                    var ele = miniProfileView.$el.find('a[href], *[tabindex]');
                    $(ele[0]).trigger({ type: 'keydown', keyCode: 9, shiftKey: true, which: 9 });
                    expect($(ele[4]).is(":focus")).toBeTruthy();
                    done();
                });

                it("Verifies tab on last element", function (done) {
                    var ele = miniProfileView.$el.find('a[href], *[tabindex]');
                    $(ele[4]).trigger({ type: 'keydown', keyCode: 9, which: 9 });
                    expect($(ele[0]).is(":focus")).toBeTruthy();
                    done();
                });



            });



        });
    });

