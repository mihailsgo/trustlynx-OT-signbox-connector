/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
    "csui/lib/backbone",
    'csui/utils/testutils/async.test.utils',
    "xecmpf/widgets/workspaces/workspaces.widget",
    "xecmpf/widgets/workspaces/test/workspace.mock",
    'csui/utils/contexts/perspective/perspective.context',
    'csui/utils/contexts/factories/node'
], function ($, Backbone, AsyncUtils, WorkspacesWidget,
             Mock, PerspectiveContext) {
    'use strict';

    describe('Complete and Create Workspace Reference Widget - ', function () {

        var context,
            workspacesWidget,
            originalTimeout,
            currentView;

        beforeAll(function () {
            Mock.enable();
            $('head').append('<link rel="stylesheet" href="/base/csui/themes/carbonfiber/theme.css">');
            $('body').addClass("binf-widgets");

            $('body').css(
                {
                    "margin": 0,
                    "height": "100%",
                    "overflow-y": "hidden",
                    "overflow-x": "hidden",
                    "padding-right": "0px !important"
                }
            )

            $('body').append('<div id="widgetWMainWindow" style="height:100vh"></div>');

            context = new PerspectiveContext({
                factories: {
                    connector: {
                        connection: {
                            url: '//server/otcs/cs/api/v1',
                            supportPath: '/support',
                            session: {
                                ticket: 'dummy'
                            }
                        }
                    }
                }
            });
        });

        beforeEach(function () {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });
        afterEach(function () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('starts and shows widget', function () {
            workspacesWidget = new WorkspacesWidget({
                context: context,
                data: {
                    busObjectId: '0000003456',
                    busObjectType: 'KNA1',
                    extSystemId: 'D9A',
                    viewMode: {
                        mode: 'folderBrowse',
                        viewIframe: false
                    }
                }
            });
            workspacesWidget.show({placeholder: '#widgetWMainWindow'});
            context.fetch();
        });

        describe('The Select Workspace View - ', function () {
            it('initializes view', function (done) {
                setTimeout(function() {
                    currentView = workspacesWidget.region.currentView
                    expect(currentView).not.toBeNull();
                    done();
                }, 3000);
            });

            it('displays 11 early workspaces', function (done) {
                setTimeout(function() {
                    expect(currentView.$el.find("tr.odd").length + currentView.$el.find("tr.even").length).toEqual(11);
                    done();
                }, 1000);
            });

            it('navigates to Complete Reference View', function () {
                currentView.$("a[title='Early Workspace 2']").trigger("click");
            });
        });

        describe('The Complete Workspace View - ', function () {
            it('initializes view', function (done) {
                setTimeout(function() {
                    currentView = workspacesWidget.region.currentView;
                    expect(currentView).not.toBeNull();
                    done();
                }, 5000);
            });

            it('displays metadata panel for early workspace', function () {
                expect(currentView.$("div[title='09/22/2016 8:59 AM']")).not.toBeNull();
            });

            it('navigates to Display Workspace View', function () {
                currentView.$(".binf-btn-primary").trigger("click");
            });
        });

        describe('The Display Workspace View - ', function () {
            it('initializes view', function (done) {
                setTimeout(function() {
                    currentView = workspacesWidget.region.currentView;
                    expect(currentView).not.toBeNull();
                    done();
                }, 2000);
            });

            it('displays folder from workspace template', function () {
                expect(currentView.browser.region.$el.find("a[title='Folder 1']")).not.toBeNull();
            });
        });

        describe('Deleting the workspace', function () {
            it('selecting delete action from context menu', function (done) {
                var dropDownMenu = currentView.browser.region.$el.find('.csui-item-title-dropdown-menu .csui-button-icon');
                dropDownMenu.trigger('click');
                AsyncUtils.asyncElement(currentView.browser.region.$el, '.csui-item-title-dropdown-menu .binf-dropdown-menu li').done(
                    function () {
                        var deleteButton = currentView.browser.region.$el.find('.csui-item-title-dropdown-menu .binf-dropdown-menu li[data-csui-command=delete] a');
                        deleteButton.trigger('click');
                        done();
                });
            });

            it('confirming the delete operation', function (done) {
                AsyncUtils.asyncElement('body .binf-widgets', '.binf-modal-dialog .binf-modal-footer .csui-yes').done(
                    function () {
                        var yesButton = $('body .binf-widgets .binf-modal-dialog .binf-modal-footer .csui-yes');
                        yesButton.trigger('click');
                        done();
                });
            });

            it('shows the create/complete widget', function (done) {
                currentView = workspacesWidget.region;
                AsyncUtils.asyncElement(currentView.$el, '#content').done(
                    function () {
                        var headerText = currentView.$el.find('#content .csui-heading').text();
                        expect(headerText).toBe('Create or complete business workspace');
                        done();
                });
            });

            it('displays 11 early workspaces', function (done) {
                AsyncUtils.asyncElement(currentView.$el, '#content .xecmpf_workspacestable #tableview .binf-table').done(
                    function () {
                        expect(currentView.$el.find("#tableview .binf-table tr.odd").length +
                        currentView.$el.find("#tableview .binf-table tr.even").length).toEqual(11);
                        done();
                });
            });
        });

        afterAll(function () {
            Mock.disable();
            $('#widgetWMainWindow').remove();
            $("link[href='/base/csui/themes/carbonfiber/theme.css']").remove();
            $('body').empty();
            sessionStorage.removeItem('create_complete_wksp');
            Backbone.history.stop();
        });
    })
});
