/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/backbone',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/marionette',
    'csui/utils/contexts/factories/connector',
    'csui/utils/contexts/page/page.context',
    'csui/models/node/node.model',
    'webreports/controls/run.webreport.pre/run.webreport.pre.controller',
    'webreports/controls/parameter.prompt/parameter.prompt.view',
    'i18n!webreports/controls/parameter.prompt/impl/nls/parameter.prompt.lang',
    './parameter.prompt.mock.js'
], function (Backbone, _, $, Marionette, ConnectorFactory, PageContext, NodeModel, RunWebReportPreController, ParameterPromptView, lang, mock) {
    'use strict';

    describe('ParameterPromptView', function () {

        describe('on creation, by default', function () {
            var context,
                promptParameters,
                RunWRController,
                options,
                promptView,
                promptRegion,
                factories = {
                    factories: {
                        connector: {
                            connection: {
                                url: '//server/otcs/cs/api/v1',
                                supportPath: '/support',
                                credentials: {
                                    username: 'Admin',
                                    password: 'livelink'
                                }
                            }
                        }
                    }
                };

            beforeAll(function (done) {
                var $body = $('body').addClass('binf-widgets'),
                    $container = $('<div class="binf-container-fluid grid-rows"></div>'),
                    node = new NodeModel({
                        id: 22550,
                        type: 30303
                    });

                RunWRController = new RunWebReportPreController();

                if (!context) {
                    context = new PageContext({
                        factories: factories
                    });
                }

                mock.enable();
                $container.append('<div class="binf-row"><div class="binf-col-md-8 binf-col-xl-6"><div id="promptView" class="cs-tile tile"></div></div></div>');
                $container.appendTo($body);


                if (!context) {
                    context = new PageContext({
                        factories: factories
                    });
                }

                options = {
                    context: context,
                    node: node,
                    suppressPromptView: true, // default behavior of the checkForPromptParameters control is to invoke a complete prompt view. We want to create our own view
                    showCancelBtn: true
                };

                promptParameters = RunWRController.checkForPromptParameters(options);

                $.when(promptParameters).then(function(promptRoute) {
                    options.promptRoute = promptRoute;
                    options.model = RunWRController.runWRPreModel;
                    promptView = new ParameterPromptView(options);
                    promptRegion = new Marionette.Region({
                        el: "#promptView"
                    });
                    promptRegion.show(promptView);
                    done();
                });

            });

            it('checks for prompt parameters', function () {
                expect(options.promptRoute === 'showSmartPrompts').toBeTruthy();
            });

            it('has a form model', function() {
                expect(_.isObject(options.model) && !_.isEmpty(options.model)).toBeTruthy();
            });

            it('instantiates a prompt view', function () {
                expect(promptView instanceof ParameterPromptView).toBeTruthy();
            });

            it('shows form in prompt view', function () {
                var $form = $('.cs-form','#promptView');
                expect ($form.length).toBeTruthy();
            });

        });


    });

});