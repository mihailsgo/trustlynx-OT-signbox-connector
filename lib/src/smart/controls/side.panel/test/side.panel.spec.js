/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define(["nuc/lib/backbone", 'nuc/lib/marionette', 'nuc/lib/underscore', 'nuc/lib/jquery',
  "smart/controls/side.panel/side.panel.view",
  "../../../utils/testutils/async.test.utils.js",
  "../../../utils/testutils/drag-mock.js",
  "smart/controls/icons.v2/icons.v2"
], function (Backbone, Marionette, _, $, SidePanelView, TestUtils, DragMock, v2Icons) {

  describe("SidePanel Control", function () {

    beforeAll(function () {

    });

    afterAll(function () {
      TestUtils.cancelAllAsync();
      TestUtils.restoreEnvironment();
      $('body').empty();
    });

    describe("Initialization check", function () {
      it("Simple usage: intialize with a content", function (done) {
        var content = new Backbone.View();
        var sidePanel = new SidePanelView({
          title: 'Title',
          subTitle: 'SubTitle here',
          content: content,
          buttons: [{
            id: 'btn1',
            disabled: true
          },
            {
              id: 'btn2',
              hidden: true
            }
          ]
        });
        sidePanel.show(function () {
          var dropdown = sidePanel.$el.find('.csui-sidepanel-footer .binf-dropdown-toggle');
          if (dropdown && dropdown.length) {
            dropdown.trigger('click');
            var ele = $('.csui-sidepanel-footer .binf-dropdown-menu').children.length;
            expect(ele).toBeGreaterThan(0);
            var cancel = $('.csui-sidepanel-footer .binf-dropdown-menu').lastElementChild.lastElementChild;
            cancel && cancel.click();
          } else {
            var cancelBtn = sidePanel.$el.find('.csui-sidepanel-footer #csui-side-panel-cancel');
            expect(cancelBtn.length).toEqual(1);
            cancelBtn.trigger('click');
          }
          TestUtils.asyncElement('body', '.csui-sidepanel', true).done(function () {
            done();
          });
        });
      });
      it("Wizard style initiazation", function (done) {
        var sidePanel = new SidePanelView({
          slides: [{
            title: 'Title',
            content: new Backbone.View(),
            buttons: [{
              id: 'btn1',
              disabled: true
            },
              {
                id: 'btn2',
                hidden: true
              }
            ]
          }]
        });
        sidePanel.show(function () {
          sidePanel.destroy();
          done();
        });
      });

      it("with no backdrop; backdrop: false", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          backdrop: false
        });
        sidePanel.show(function () {
          var backdropEl = sidePanel.$el.find('.csui-sidepanel-backdrop');
          expect(backdropEl.length).toEqual(0);
          sidePanel.destroy();
          done();
        });
      });

      it("with backdrop; backdrop: true; close on backdrop click", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          backdrop: true
        });
        sidePanel.show(function () {
          var backdropEl = sidePanel.$el.find('.csui-sidepanel-backdrop');
          expect(backdropEl.length).toEqual(1);
          backdropEl.trigger('click');
          TestUtils.asyncElement('body', '.csui-sidepanel', true).done(function () {
            done();
          });
        });
      });

      it("with static backdrop; backdrop: 'static'; modal", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          backdrop: 'static' // DEFAULT
        });
        sidePanel.show(function () {
          var backdropEl = sidePanel.$el.find('.csui-sidepanel-backdrop');
          expect(backdropEl.length).toEqual(1);
          backdropEl.trigger('click');
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });
      it("layout: {header:false}, Side panel without header", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            header: false
          }
        });
        sidePanel.show(function () {
          var withoutHeader = sidePanel.$el.find('.csui-sidepanel-header');
          expect(withoutHeader.length).toEqual(0);
          expect(withoutHeader.is(':visible')).toBeFalsy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });

        });
      });

      it("layout: {header:true}, Side panel with header", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            header: true
          },
        });
        sidePanel.show(function () {
          var withHeader = sidePanel.$el.find('.csui-sidepanel-header');
          expect(withHeader.length).toEqual(1);
          expect(withHeader.is(':visible')).toBeTruthy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("layout: {footer:false}: false, Side panel without footer", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            footer: false
          }
        });
        sidePanel.show(function () {
          var withoutFooter = sidePanel.$el.find('.csui-sidepanel-footer');
          expect(withoutFooter.length).toEqual(0);
          expect(withoutFooter.is(':visible')).toBeFalsy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("layout: {footer:true}, Side panel with footer", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            footer: true
          }
        });
        sidePanel.show(function () {
          var withFooter = sidePanel.$el.find('.csui-sidepanel-footer');
          expect(withFooter.length).toEqual(1);
          expect(withFooter.is(':visible')).toBeTruthy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("should have v2Icon as footer button", function (done) {
        var sidePanel = new SidePanelView({
          title: 'v2Icon in footer',
          content: new Marionette.View(),
          layout: {
            footer: true
          },
          footer: {
            rightButtons: [
              {
                close: true,
                v2Icon: {
                  iconName: 'csui_action_close_32',
                  states: true
                }
              }
            ]
          }
        });
        sidePanel.show(function () {
          var withFooter = sidePanel.$el.find('.csui-sidepanel-footer');
          expect(withFooter.length).toEqual(1);
          var v2IconSVG = $(withFooter).find('svg.csui-icon-v2');
          expect(v2IconSVG.length).toEqual(1);
         
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("layout: {mask:false}, unmask the overlay behind side panel", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            mask: false
          }
        });
        sidePanel.show(function () {
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-no-mask')).toBeTruthy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("layout: {mask:true}, mask the overlay behind side panel", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            mask: true
          }
        });
        sidePanel.show(function () {
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-no-mask')).toBeFalsy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("layout: {resize:true}, Applies resize capabilities to side panel", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            resize: true
          }
        });
        sidePanel.show(function () {
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-resize')).toBeTruthy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

      it("layout: {header:false}, layout: {footer:false}, layout: {mask:false}, layout: {resize:true} side panel with no header, footer, mask, but with resize",
          function (done) {
            var sidePanel = new SidePanelView({
              title: 'Title',
              content: new Backbone.View(),
              layout: {
                header: false,
                footer: false,
                mask: false,
                resize: true
              }
            });
            sidePanel.show(function () {
              var withoutHeader = sidePanel.$el.find('.csui-sidepanel-header');
              expect(withoutHeader.length).toEqual(0);
              expect(withoutHeader.is(':visible')).toBeFalsy();
              var withoutFooter = sidePanel.$el.find('.csui-sidepanel-footer');
              expect(withoutFooter.length).toEqual(0);
              expect(withoutFooter.is(':visible')).toBeFalsy();
              expect(sidePanel.$el.hasClass('csui-sidepanel-with-no-mask')).toBeTruthy();
              expect(sidePanel.$el.hasClass('csui-sidepanel-with-resize')).toBeTruthy();
              TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
                sidePanel.destroy();
                done();
              });
            });
          });

      it("layout: {resize:false}, no resize capabilities to side panel", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            resize: false
          }
        });
        sidePanel.show(function () {
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-resize')).toBeFalsy();
          TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
            sidePanel.destroy();
            done();
          });
        });
      });

    });

    describe("", function () {
      var sidePanel, content;
      beforeAll(function (done) {
        content = new Backbone.View();
        sidePanel = new SidePanelView({
          sidePanelClassName: 'customized-cls',
          slides: [{
            title: 'Step1',
            containerClass: 'step1',
            content: content,
            buttons: [{
              id: 'btn1',
              disabled: true,
              label: "Button1"
            }, {
              id: 'btn2',
              label: "Button2",
              close: true
            }]
          }, {
            title: 'Step2',
            containerClass: 'step2',
            content: content,
            buttons: [{
              id: 'btn3',
              label: "Button3",
              hidden: true
            }, {
              id: 'btn4',
              label: "Button4"
            }]
          }]
        });
        sidePanel.show(done);
      });

      afterAll(function (done) {
        sidePanel.hide(done);
      });

      it("Check if step1 is displayed", function () {
        var container = sidePanel.$el.find('.csui-sidepanel-container');
        expect(container.hasClass('step1')).toBeTruthy();
      });

      it("Enable footer buttons", function () {
        var disabledBtn = sidePanel.$el.find('.csui-sidepanel-footer #btn1');
        expect(disabledBtn.hasClass('binf-disabled')).toBeTruthy();
        expect(disabledBtn.is(":disabled")).toBeTruthy();
        sidePanel.updateButton("btn1", {
          disabled: false
        });
        expect(disabledBtn.hasClass('binf-disabled')).toBeFalsy();
        expect(disabledBtn.is(":disabled")).toBeFalsy();
      });

      it("Move forward to next step in wizard", function () {
        sidePanel.trigger("click:next");
        var container = sidePanel.$el.find('.csui-sidepanel-container');
        expect(container.hasClass('step2')).toBeTruthy();
        sidePanel.updateButton("btn3", {
          hidden: false
        });
      });

      it("Move backward to previous step in wizard", function () {
        sidePanel.trigger("click:previous");
        var container = sidePanel.$el.find('.csui-sidepanel-container');
        expect(container.hasClass('step1')).toBeTruthy();
      });

      it("Close using custom button", function (done) {
        var customClose = sidePanel.$el.find('.csui-sidepanel-footer #btn2');
        expect(customClose.length).toEqual(1);
        customClose.trigger('click');
        TestUtils.asyncElement('body', '.csui-sidepanel', true).done(function () {
          done();
        });
      });
    });

    describe("Header Close button handler", function() {
      var sidePanel;
      beforeAll(function(done) {
        sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            header: true
          }
        });
        sidePanel.show(done);
      });

      afterAll(function (done) {
        sidePanel.hide(done);
      });

      it("Closes panel using header close button", function(done) {
        var headerCloseBtn = sidePanel.$el.find('.csui-sidepanel-header .csui-sidepanel-close');
        expect(headerCloseBtn.length).toEqual(1);
        headerCloseBtn.trigger('click');
        TestUtils.asyncElement('body', '.csui-sidepanel', true).done(function () {
          done();
        });
      });
    });

    describe("Update header title dynamically", function () {
      var sidePanel, content, ContentWithHeader,
          newTitle = 'New main title',
          titleObject = {
            title: 'new heading from footer',
            subTitle: 'new sub heading from footer'
          };
      beforeAll(function (done) {
        content = new Backbone.View();
        ContentWithHeader = Marionette.ItemView.extend({
          className: 'step-view',
          template: function () {
            return _.template(
                '<button class="binf-btn binf-btn-default" id="updateHeader">update Header</button>');
          },
          events: {
            'click #updateHeader': function () {
              this.trigger('update:header', {
                title: newTitle,
                subTitle: ''
              });
            }
          },
          onRender: function () {
            this.listenTo(this, "button:click", function (actionButton) {
              if (!!actionButton.updateHeader) {
                this.trigger('update:header', actionButton.updateHeader);
              }
            });
          }
        });
        sidePanel = new SidePanelView({
          sidePanelClassName: 'customized-cls',
          slides: [{
            title: 'Step1',
            containerClass: 'step1',
            content: content,
            buttons: [{
              id: 'btn1',
              disabled: true,
              label: "Button1"
            }, {
              id: 'btn2',
              label: "Button2",
              close: true
            }]
          }, {
            title: 'Step2',
            subTitle: '',
            containerClass: 'step2',
            content: new ContentWithHeader(),
            buttons: [{
              id: 'btn3',
              label: "Button3",
              hidden: true
            }, {
              id: 'btn4',
              label: "Button4",
              close: true
            }],
            footer: {
              buttons: [
                {
                  label: '(Custom) update header',
                  type: 'action',
                  id: 'footerBtn',
                  updateHeader: titleObject
                }]
            }
          }]
        });
        sidePanel.show(done);
      });

      afterAll(function (done) {
        sidePanel.hide(done);
      });

      it("Check if step1 is displayed", function () {
        var container = sidePanel.$el.find('.csui-sidepanel-container');
        expect(container.hasClass('step1')).toBeTruthy();
      });

      it("Enable footer buttons", function () {
        var disabledBtn = sidePanel.$el.find('.csui-sidepanel-footer #btn1');
        expect(disabledBtn.hasClass('binf-disabled')).toBeTruthy();
        expect(disabledBtn.is(":disabled")).toBeTruthy();
        sidePanel.updateButton("btn1", {
          disabled: false
        });
        expect(disabledBtn.hasClass('binf-disabled')).toBeFalsy();
        expect(disabledBtn.is(":disabled")).toBeFalsy();
      });

      it("Move forward to next step in wizard", function () {
        sidePanel.trigger("click:next");
        var container = sidePanel.$el.find('.csui-sidepanel-container');
        expect(container.hasClass('step2')).toBeTruthy();
        sidePanel.updateButton("btn3", {
          hidden: false
        });
      });

      it("Update header from body in wizard", function () {
        var header = sidePanel.headerView,
            currentSlide = sidePanel.currentSlide,
            updateButton = sidePanel.$el.find('#updateHeader');
        expect(updateButton.length).toEqual(1);
        expect(header.ui.title.text()).toEqual(currentSlide.title);
      });

      it("Check header title updated or not", function () {
        var updateButton = sidePanel.$el.find('#updateHeader'),
            header = sidePanel.headerView;
        updateButton.trigger("click");
        expect(header.ui.title.text()).toEqual(newTitle);
      });

      it("Move backward to previous step in wizard", function () {
        sidePanel.trigger("click:previous");
        var container = sidePanel.$el.find('.csui-sidepanel-container');
        expect(container.hasClass('step1')).toBeTruthy();
      });

      it("Move forward to next step in wizard and verify previous updated title showing or not",
          function () {
            sidePanel.trigger("click:next");
            var container = sidePanel.$el.find('.csui-sidepanel-container'),
                headerView = sidePanel.headerView;
            expect(container.hasClass('step2')).toBeTruthy();
            sidePanel.updateButton("btn3", {
              hidden: false
            });
            expect(headerView.ui.title.text()).toEqual(newTitle);
            expect(headerView.ui.subTitle.text()).toEqual('');
          });

      it("Check titles are updated or not from footer", function () {
        var headerView = sidePanel.headerView;
        sidePanel.$el.find('.csui-sidepanel-footer #footerBtn').trigger('click');
        expect(headerView.ui.title.text()).toEqual(titleObject.title);
        expect(headerView.ui.subTitle.text()).toEqual(titleObject.subTitle);
      });
    });


    describe("Resize Side Panel", function () {
      var finish, doResize = function (num1, num2, options) {
        var opt = _.extend({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            resize: true
          }
        }, options);
        var sidePanel = new SidePanelView(opt);
        sidePanel.show();
        setTimeout(function () {
          var ele = sidePanel.$el.find('.csui-side-panel-resizer ');
          window.sidePanel = sidePanel;
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-resize')).toBeTruthy();
          window.w1 = sidePanel.$el.find(".csui-sidepanel-container").width();
          $(ele[0]).trigger('click');
          $(ele[0]).trigger('focus');    
          DragMock
            .dragStart(ele[0], { clientX: num1, clientY: 258 }).dragEnter(ele[0], { clientX: num1, clientY: 258 })
            .dragOver(ele[0], { clientX: num1, clientY: 258 })
            .dragLeave(ele[0], { clientX: num2, clientY: 258 })
            .drop(ele[0], { clientX: num2, clientY: 258 }, function (event) {
              finish();
            });
        }, 200);
      };

      it("Expand Side Panel", function (done) {
        doResize(627, 550);
        finish = function () {
          TestUtils.asyncElement('body',
            '.binf-widgets .csui-sidepanel .csui-sidepanel-container').done(
              function (el) {
                setTimeout(function () {
                  window.w2 = window.sidePanel.$el.find(".csui-sidepanel-container").width();
                  expect(window.w2).toBeGreaterThan(window.w1);
                  TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
                    window.sidePanel.destroy();
                    done();
                  });
                }, 300);
              });
        };
      });

      it("Shrink Side Panel", function (done) {
        doResize(627, 700);
        finish = function () {
          TestUtils.asyncElement('body',
            '.binf-widgets .csui-sidepanel .csui-sidepanel-container').done(
              function (el) {
                setTimeout(function () {
                  window.w2 = window.sidePanel.$el.find(".csui-sidepanel-container").width();
                  expect(window.w1).toBeGreaterThan(window.w2);
                  TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
                    window.sidePanel.destroy();
                    done();
                  });
                }, 300);
              });
        };
      });

      it("With View and Threshold", function (done) {
        var view = new Marionette.ItemView();
        view.layoutState = {};
        var options = {
          thresholdWidth: 40,
          contentView: view
        };
        doResize(627, 700, options);
        finish = function () {
          TestUtils.asyncElement('body',
            '.binf-widgets .csui-sidepanel .csui-sidepanel-container').done(
              function (el) {
                setTimeout(function () {
                  window.w2 = window.sidePanel.$el.find(".csui-sidepanel-container").width();
                  expect(Math.floor($(document).width())).toBeGreaterThanOrEqual(Math.floor(window.w2));
                  TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
                    window.sidePanel.destroy();
                    done();
                  });
                }, 300);
              });
        };
      });

      it("Sets threshold", function (done) {
        var view = new Marionette.ItemView({
          className: "test",
          constructor: function TestView(options) {
            Marionette.LayoutView.prototype.constructor.apply(this, arguments);

          }
        });
        view.layoutState = {};
        var options = {
          thresholdWidth: 100,
          contentView: view

        };
        doResize(627, 700, options);
        finish = function () {
          TestUtils.asyncElement('body',
            '.binf-widgets .csui-sidepanel .csui-sidepanel-container').done(
              function (el) {
                setTimeout(function () {
                  window.w2 = window.sidePanel.$el.find(".csui-sidepanel-container").width();
                  expect(window.w1).toBeGreaterThan(window.w2);
                  TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
                    window.sidePanel.destroy();
                    done();
                  });
                }, 300);
              });
        };
      });
      it("Greater threshold", function (done) {
        var view = new Marionette.ItemView({
          className: "test",
          constructor: function TestView(options) {
            Marionette.LayoutView.prototype.constructor.apply(this, arguments);
            this.fullPagePreview = true;
          }
        });
        view.layoutState = {};
        view.fullPagePreview = true;
        var options = {
          thresholdWidth: 40,
          contentView: view
        };
        doResize(627, 700, options);
        finish = function () {
          TestUtils.asyncElement('body',
            '.binf-widgets .csui-sidepanel .csui-sidepanel-container').done(
              function (el) {
                setTimeout(function () {
                  window.w2 = window.sidePanel.$el.find(".csui-sidepanel-container").width();
                  expect(window.w1).toBeGreaterThan(window.w2);
                  TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
                    window.sidePanel.destroy();
                    done();
                  });
                }, 300);
              });
        };
      });

    });

    describe("Resize Side panel using KN", function () {

      it("Left arrow key", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            resize: true
          }
        });
        sidePanel.show(function () {
          var ele = sidePanel.$el.find('.csui-side-panel-resizer ');
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-resize')).toBeTruthy();
          var w1 = sidePanel.$el.find(".csui-sidepanel-container").width();
          $(ele[0]).trigger('click');
          $(ele[0]).trigger('focus');
          $(ele[0]).trigger({ type: 'keydown', keyCode: 37 });
          setTimeout(function () {
            var w2 = sidePanel.$el.find(".csui-sidepanel-container").width();
            expect(w2).toBeGreaterThan(w1);
            TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
              sidePanel.destroy();
              done();
            });
          }, 500);

        });
      });

      it("Right arrow key", function (done) {
        var sidePanel = new SidePanelView({
          title: 'Title',
          content: new Backbone.View(),
          layout: {
            resize: true
          }
        });
        sidePanel.show(function () {
          var ele = sidePanel.$el.find('.csui-side-panel-resizer ');
          expect(sidePanel.$el.hasClass('csui-sidepanel-with-resize')).toBeTruthy();
          var w1 = sidePanel.$el.find(".csui-sidepanel-container").width();
          $(ele[0]).trigger('click');
          $(ele[0]).trigger('focus');
          $(ele[0]).trigger({ type: 'keydown', keyCode: 39 });
          setTimeout(function () {
            var w2 = sidePanel.$el.find(".csui-sidepanel-container").width();
            expect(w1).toBeGreaterThan(w2);
            TestUtils.asyncElement('body', '.csui-sidepanel').done(function () {
              sidePanel.destroy();
              done();
            });
          }, 500);

        });
      });

    });

  });
});