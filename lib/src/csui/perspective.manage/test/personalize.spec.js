/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette",
  'csui/lib/backbone', 'csui/utils/contexts/perspective/perspective.context',
  './personalize.mock.js',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/connector',
  'csui/models/perspective/personalization.model',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/perspective.manage/pman.view',
  '../../utils/testutils/async.test.utils.js',
  'csui/lib/bililiteRange',
  'csui/lib/jquery.simulate',
  'csui/lib/jquery.simulate.ext',
  'csui/lib/jquery.simulate.key-sequence'
], function ($, _, Marionette, Backbone, PerspectiveContext, Mock, NodeModelFactory,
    ConnectorFactory,
    PersonalizationModel,
    PerspectivePanelView, PManView, TestUtils) {
  'use strict';

  describe("Personalize Page", function () {

    var context, pmanView, personalizationModel, node, perspectivePanel;

    beforeAll(function (done) {
      Mock.enable();
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

      context.perspective = new Backbone.Model({
        "canEditPerspective": true,
        "id": 22374119,
        "type": "flow",
        "options": {
          "widgets": [
            {
              "kind": "header",
              "options": {
                "message": "As a foundational technology in the Digital Workplace, OpenText Content Suite will pave the way to personal productivity, seamless collaboration, and integration with business processes."
              },
              "type": "csui/widgets/welcome.placeholder",
              "w_id": "pman-1"
            },
            {
              "kind": "tile",
              "options": {},
              "type": "csui/widgets/myassignments",
              "w_id": "pman-2"
            },
            {
              "kind": "tile",
              "options": {},
              "type": "csui/widgets/favorites",
              "w_id": "pman-3"
            },
            {
              "kind": "tile",
              "options": {},
              "type": "csui/widgets/recentlyaccessed",
              "w_id": "pman-4"
            },
            {
              "kind": "tile",
              "options": {
                "shortcutItems": [
                  {
                    "type": "141"
                  },
                  {
                    "type": "141"
                  },
                  {
                    "type": "141"
                  }
                ],
                "shortcutTheme": "csui-shortcut-theme-stone1"
              },
              "type": "csui/widgets/shortcuts",
              "w_id": "pman-5"
            }
          ]
        }
      });

      node = context.getModel(NodeModelFactory);
      personalizationModel = new PersonalizationModel({}, {
        sourceModel: node, context: context,
        perspective: context.perspective,
        connector: context.getObject(ConnectorFactory)
      });
      personalizationModel.setPerspective(context.perspective.toJSON());
      perspectivePanel = new PerspectivePanelView({
        context: context
      });
      $('body').append('<div id="perspective-panel-view"></div>');
      var region = new Marionette.Region({
        el: "#perspective-panel-view"
      });
      region.show(perspectivePanel);
      perspectivePanel.listenTo(perspectivePanel, 'show:perspective', function () {
        pmanView = new PManView({
          context: context,
          perspective: personalizationModel,
          mode: 'personalize'

        });
        pmanView.show();
      });

      context.listenTo(context, 'enter:edit:perspective', function (original) {
        done();
      });
    });

    afterAll(function () {
      Mock.disable();
      TestUtils.cancelAllAsync();
      TestUtils.restoreEnvironment();
    });

    it("should render personalize header", function (done) {
      TestUtils.asyncElement('.perspective-editing', '.pman-header .pman-tools-container').done(
          function ($tools) {
            expect($tools.find('.pman-right-tools .icon-save').length).toEqual(1);
            expect($tools.find(' .pman-right-tools .cancel-edit').length).toEqual(1);
            expect($tools.find(' .pman-right-tools .icon-reset').length).toEqual(1);
            done();
          });
    });

    it("should show emtpy (+) shortcut and existing widgets", function (done) {
      TestUtils.asyncElement('.perspective-editing', '.csui-large.csui-pman-shortcut-new').done(
          function (el) {
            expect(el.length).toEqual(1);
            expect($('.csui-draggable-item.csui-pman-editable-widget').length).toEqual(6);
            done();
          });
    });

    it("should add configured shortcut on clicking emtpy (+) shortcut and another emtpy (+) shortcut should be added",
        function (done) {
          $(".csui-large.csui-pman-shortcut-new .csui-pman-widget-masking").trigger('click');
          TestUtils.asyncElement('.perspective-editing',
              '.csui-pman-editable-widget[data-csui-widget_type="shortcuts"] .csui-pman-shortcut-new  .cs-pman-callout-ready .binf-popover').done(
              function (el) {
                expect($(".csui-pman-shortcut-new .binf-popover").length).toEqual(1);
                el.find(".binf-dropdown-toggle").eq(0).trigger('click');
                el.find(".binf-dropdown-menu:visible li a").eq(1).trigger('click');
                el.find(".cs-formfield input").eq(1).trigger("focus");
                TestUtils.asyncElement('.perspective-editing',
                    '.csui-shortcut-item:not(.csui-pman-shortcut-new) .binf-popover').done(
                    function (el) {
                      expect(el.length).toEqual(1);
                      expect($(".csui-medium.csui-shortcut-item").length).toEqual(2);
                      TestUtils.asyncElement('.perspective-editing',
                          '.csui-large.csui-pman-shortcut-new').done(
                          function (el) {
                            expect(el.length).toEqual(1);
                            expect(
                                $('.csui-draggable-item.csui-pman-editable-widget').length).toEqual(
                                7);
                            done();
                          });
                    });
              });
        });

    it("widget should be hidden on clicking Hide widget button and display widget button should enable on it",
        function (done) {
          var welcome = $(
              '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"]');
          welcome.find('.csui-pman-hide-show-toggle').trigger('click');
          TestUtils.asyncElement('.perspective-editing',
              '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .csui-configure-perspective-widget').done(
              function (el) {
                expect(el.length).toEqual(1);
                expect(el.hasClass('csui-pman-widget-state-hidden')).toBeTruthy();
                done();
              });
        });

    it("myassignments widget should be hidden on clicking Hide widget button", function (done) {
      var myassignments = $('.csui-pman-editable-widget[data-csui-widget_type="myassignments"]');
      myassignments.find('.csui-pman-hide-show-toggle').trigger('click');
      TestUtils.asyncElement('.perspective-editing',
          '.csui-pman-editable-widget[data-csui-widget_type="myassignments"] .csui-configure-perspective-widget').done(
          function (el) {
            expect(el.length).toEqual(1);
            expect(el.hasClass('csui-pman-widget-state-hidden')).toBeTruthy();
            done();
          });
    });

    it("widget should be visible on clicking display widget button and display widget button should disable",
        function (done) {
          var myassignments = $(
              '.csui-pman-editable-widget[data-csui-widget_type="myassignments"]');
          myassignments.find('.csui-pman-hide-show-toggle').trigger('click');
          TestUtils.asyncElement('.perspective-editing',
              '.csui-pman-editable-widget[data-csui-widget_type="myassignments"] .csui-pman-widget-state-shown').done(
              function (el) {
                expect(el.length).toEqual(1);
                expect(el.find('.csui-pman-hide-show-toggle').is(':visible')).toBeFalsy();
                done();
              });
        });
    describe("Keyboard Navigation for Personalize Page", function () {
      it("Focus on Welcome widget", function (done) {
        TestUtils.asyncElement('.perspective-editing',
            '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
            function (el) {
              expect(el.length).toEqual(1);
              el.trigger('focus');
              expect(el.is(':focus')).toBeTruthy();
              TestUtils.asyncElement(el.parent(), '.csui-pman-hide-show-toggle').done(
                  function (el) {
                    expect(el.length).toEqual(1);
                    expect(el.is(':visible')).toBeTruthy();
                    done();
                  });
            });
      });

      it("on Enter, focus should be on Display button", function (done) {
        TestUtils.asyncElement('.perspective-editing',
            '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
            function (el) {
              expect(el.length).toEqual(1);
              expect(el.is(':focus')).toBeTruthy();
              el.trigger({type: 'keydown', keyCode: 13});
              TestUtils.asyncElement(el.parent(), '.csui-pman-hide-show-toggle').done(
                  function (el) {
                    expect(el.length).toEqual(1);
                    expect(el.is(':visible')).toBeTruthy();
                    expect(el.is(':focus')).toBeTruthy();
                    done();
                  });
            });
      });

      it("on Enter,on dispaly button, the widget should display and the hide button should be visible",
          function (done) {
            TestUtils.asyncElement('.perspective-editing',
                '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .csui-configure-perspective-widget').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  expect(el.hasClass('csui-pman-widget-state-hidden')).toBeTruthy();
                  var showBtn = el.find(".csui-pman-hide-show-toggle");
                  showBtn.trigger({type: 'keydown', keyCode: 13});
                  TestUtils.asyncElement(
                      '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"]',
                      '.csui-pman-widget-state-shown').done(
                      function (el) {
                        expect(el.length).toEqual(1);
                        var hideBtn = el.find('.csui-pman-hide-show-toggle');
                        expect(hideBtn.is(':visible')).toBeTruthy();
                        expect(hideBtn.is(':focus')).toBeTruthy();
                        done();
                      });
                });
          });

      it("on Esacpe, the focus should shift back to widget", function (done) {
        TestUtils.asyncElement('.perspective-editing',
            '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .csui-pman-hide-show-toggle').done(
            function (el) {
              expect(el.length).toEqual(1);
              expect(el.is(':focus')).toBeTruthy();
              el.trigger({type: 'keydown', keyCode: 27});
              TestUtils.asyncElement('.perspective-editing',
                  '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
                  function (el) {
                    expect(el.is(':focus')).toBeTruthy();
                    done();
                  });
            });
      });

      it("on shift Tab, the focus should shift to cancel button in header", function (done) {
        TestUtils.asyncElement('.perspective-editing',
            '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
            function (el) {
              expect(el.is(':focus')).toBeTruthy();
              el.trigger({type: 'keydown', keyCode: 9, shiftKey: true});
              TestUtils.asyncElement('.perspective-editing', '.pman-header .cancel-edit').done(
                  function (el) {
                    expect(el.length).toEqual(1);
                    expect(el.is(':focus')).toBeTruthy();
                    done();
                  });
            });
      });

      it("on Tab on Cancel button, the focus should shift to first widget", function (done) {
        TestUtils.asyncElement('.perspective-editing', '.pman-header .cancel-edit').done(
            function (el) {
              expect(el.is(':focus')).toBeTruthy();
              el.trigger({type: 'keydown', keyCode: 9, shiftKey: false});
              TestUtils.asyncElement('.perspective-editing',
                  '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
                  function (el) {
                    expect(el.length).toEqual(1);
                    expect(el.is(':focus')).toBeTruthy();
                    done();
                  });
            });
      });

      it("on ctrl+right ,the welcome widget should move to right, after myassignments widget",
          function (done) {
            TestUtils.asyncElement('.perspective-editing',
                '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
                function (el) {
                  expect(el.is(':focus')).toBeTruthy();
                  el.trigger({type: 'keydown', ctrlKey: true, keyCode: 39});
                  expect(el.is(':focus')).toBeTruthy();
                  setTimeout(function () {
                    TestUtils.asyncElement('.perspective-editing',
                        '.csui-pman-editable-widget[data-csui-widget_type="myassignments"] .wrapper-button').done(
                        function (el) {
                          expect(el.is(':focus')).toBeFalsy();
                          done();
                        });
                  }, 500);
                });
          });

      it("on ctrl+right ,the welcome widget should move to right, after favorites widget",
          function (done) {
            TestUtils.asyncElement('.perspective-editing',
                '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
                function (el) {
                  expect(el.is(':focus')).toBeTruthy();
                  el.trigger({type: 'keydown', ctrlKey: true, keyCode: 39});
                  expect(el.is(':focus')).toBeTruthy();
                  setTimeout(function () {
                    TestUtils.asyncElement('.perspective-editing',
                        '.csui-pman-editable-widget[data-csui-widget_type="favorites"] .wrapper-button').done(
                        function (el) {
                          expect(el.is(':focus')).toBeFalsy();
                          done();
                        });
                  }, 500);
                });
          });

      it("on ctrl+left ,the welcome widget should move to left, before favorites widget",
          function (done) {
            TestUtils.asyncElement('.perspective-editing',
                '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .wrapper-button').done(
                function (el) {
                  expect(el.is(':focus')).toBeTruthy();
                  el.trigger({type: 'keydown', ctrlKey: true, keyCode: 37});
                  expect(el.is(':focus')).toBeTruthy();
                  setTimeout(function () {
                    TestUtils.asyncElement('.perspective-editing',
                        '.csui-pman-editable-widget[data-csui-widget_type="favorites"] .wrapper-button').done(
                        function (el) {
                          expect(el.is(':focus')).toBeFalsy();
                          done();
                        });
                  }, 500);
                });
          });
    });
    xit("should reset to default page configured by admin on clicking Reset to Default button",
        function (done) {
          $(".perspective-editing .icon-reset").trigger('click');
          TestUtils.asyncElement('.perspective-editing',
              '.binf-widgets .binf-modal-dialog .binf-modal-content').done(
              function (el) {
                context.listenToOnce(context, 'enter:edit:perspective', function (original) {
                  expect(context.perspective.get('type')).toEqual(original.get('type'));
                  expect(_.omit(context.perspective.get('options'), 'perspectiveMode')).toEqual(
                      _.omit(original.get('options'), 'perspectiveMode'));
                });
                el.find(".csui-yes").trigger('click');
                TestUtils.asyncElement('.perspective-editing',
                    '.csui-pman-editable-widget[data-csui-widget_type="welcome.placeholder"] .csui-pman-widget-state-shown').done(
                    function (el) {
                      expect(el.length).toEqual(1);
                      expect(el.find('.csui-pman-show-widget').is(':visible')).toBeFalsy();
                      done();
                    });
              });
        });

    xit("should save and exit edit perspective", function (done) {
      $('.pman-right-tools .icon-save').trigger('click');
      context.listenToOnce(context, 'save:perspective', function (perspectiveChanges) {
        expect(perspectiveChanges.perspective.options.widgets[0].w_id).toEqual("pman-2");
        expect(perspectiveChanges.perspective.options.widgets[1].w_id).toEqual("pman-1");
      });
      TestUtils.asyncElement('html', '.perspective-editing', true).done(
          function (el) {
            expect(el.length).toEqual(0);
            done();
          });
    });
  });
});
    
