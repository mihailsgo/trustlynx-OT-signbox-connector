/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/models/node/node.addable.type.factory',
  'conws/utils/commands/test/addbwsfromsidepanel.mock',
  'conws/utils/commands/addbwsfromsidepanel',
  "csui/utils/testutils/async.test.utils"
], function ($,
  Marionette,
  PageContext,
  AddableTypeCollectionFactory,
  MockData,
  AddBWSFromSidePanelCommand,
  TestUtils) {

  describe('Create BWS from Template side panel test', function () {

    beforeAll(function () {
      $('body').empty();
      MockData.enable();
    });

    afterAll(function () {
      $('body').removeClass('csui-sidepanel-open');
      $('body').empty();
      MockData.disable();
    });

    function initTestInfo(testInfo) {
      testInfo.context = new PageContext({
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

      testInfo.addableTypes = testInfo.context.getCollection(AddableTypeCollectionFactory);

      var CreateWorkspaceView = new Marionette.View();
      CreateWorkspaceView.$el.appendTo(document.body);
      testInfo.originatingView = CreateWorkspaceView;
    }

    function openSidePanel(done, testInfo) {
      var isRendered = false;
      testInfo.addbwsfromsidepanel = new AddBWSFromSidePanelCommand();
      testInfo.executeStatus = {
        context: testInfo.context,
        originatingView: testInfo.originatingView
      };

      testInfo.executeOptions = {
        addableType: 848,
        addableTypeName: "Contract Workspace"
      };

      testInfo.promiseFromCommand = testInfo.addbwsfromsidepanel.execute(
        testInfo.executeStatus
      );

      testInfo.promiseFromCommand
        .done(function () {
          testInfo.commandResult = "resolved";
          isRendered = true;
          done();
        })
        .fail(function () {
          testInfo.commandResult = "rejected";
        });

    }

    describe("verify side panel elements for 'Create Business Workspace'", function () {
      var testInfo = {}

      beforeAll(function (done) {
        initTestInfo(testInfo);
        openSidePanel(done, testInfo);
        done();
      });

      it("sort drop down is available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var sortButton = el.find('.template-sort-search-container .template-sorting-container');
            expect(sortButton.length).toEqual(1);
            done();
          });
      });

      it("search option is available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var searchButton = el.find('.template-sort-search-container .template-column-search');
            expect(searchButton.length).toEqual(1);
            done();
          });
      });

      it("close button is available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var closeButton = el.find('.csui-sidepanel-close');
            expect(closeButton.length).toEqual(1);
            done();
          });
      });

      it("switch view button is available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var switchButton = el.find('.template-sort-search-container .template-layout-swtich');
            expect(switchButton.length).toEqual(1);
            done();
          });
      });

      it("cancel button is available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer").done(function (el) {
            expect(el.length).toEqual(1);
            var footerRightBtns = el.find('.cs-footer-right .binf-btn');
            expect(footerRightBtns.get(1) && footerRightBtns.get(1).textContent).toBe("Cancel");
            done();
          });
      });

      it("next button is available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer").done(function (el) {
            expect(el.length).toEqual(1);
            var footerRightBtns = el.find('.cs-footer-right .binf-btn');
            expect(footerRightBtns.get(0) && footerRightBtns.get(0).textContent).toBe("Next");
            done();
          });
      });

      it("back button should not be available in the first slide of side panel", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer").done(function (el) {
            expect(el.length).toEqual(1);
            var backButton = el.find('.cs-footer-btn .cs-go-back .arrow_back');
            expect(backButton.length).toEqual(0);
            done();
          });
      });

      it("create button should not be available in the first slide of side panel", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer").done(function (el) {
            expect(el.length).toEqual(1);
            var footerRightBtns = el.find('.cs-footer-right .binf-btn'),
              index = 0;
            while (index < footerRightBtns.length) {
              expect(footerRightBtns[index] && footerRightBtns[index].textContent).not.toBe("Create");
              index++;
            }
            done();
          });
      });

      it("by default list view should be available", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var listView = el.find('.template-table-list'),
              index = 0;
            expect(listView.length).toEqual(1);
            while (index < listView.length) {
              expect(listView[index].hidden).toBeFalsy();
              index++;
            }
            done();
          });
      });

      it('displays custom image for Contract Workspace A in list view', function (done) {
        TestUtils.waitFor(function(){
          return TestUtils.isElementVisible($(".csui-table-cell-type img.csui-icon")[0],$(".csui-sidepanel")[0]);
        },"custom image to appear").then(function(){
          var el = $(".csui-table-cell-type img.csui-icon");
          expect(el.length).toEqual(2,"has 2 custom images in list view");
          el = $(el[0]);
          var imgurl = el.attr("src");
          expect(imgurl).toContain("data:image/svg+xml;base64,");
          el.on('load',function(){done();}).on('error',function(){done.fail("custom image not loaded");}).attr("src",imgurl);
        },done.fail);
      });

      it("switch from list view to grid view in first page of side panel", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var switchViewButton = el.find('.template-sort-search-container a.switch-view-link:not(.binf-hidden)');
            expect(switchViewButton.length).toEqual(1);
            switchViewButton.trigger('click');
            done();
          });
      });

      it("check for grid view in first page of side panel", function (done) {
        TestUtils.waitFor(function(){
          var listVisible = TestUtils.isElementVisible($(".template-in-sidepanel .csui-sidepanel-container .template-table-list")[0],$(".csui-sidepanel")[0]);
          var gridVisible = TestUtils.isElementVisible($(".template-in-sidepanel .csui-sidepanel-container .template-table-grid")[0],$(".csui-sidepanel")[0]);
          return !listVisible && gridVisible;
        },"list to disappear, grid to appear").then(done,done.fail);
      });

      it('displays custom thumbnail icon for Contract Workspace A in grid view', function (done) {
        TestUtils.waitFor(function(){
          return TestUtils.isElementVisible($(".csui-thumbnail-icon-view img.csui-icon")[0],$(".csui-sidepanel")[0]);
        },"custom image to appear").then(function(){
          var el = $(".csui-thumbnail-item img.csui-icon");
          expect(el.length).toEqual(4,"has 4 custom images in grid view");
          el = $(".csui-thumbnail-icon-view img.csui-icon");
          var imgurl = el.attr("src");
          expect(imgurl).toContain("data:image/svg+xml;base64,");
          el.on('load',function(){done();}).on('error',function(){done.fail("custom image not loaded");}).attr("src",imgurl);
        },done.fail);
      });

      it("switch back from grid view to list view in first page of side panel", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            var switchViewButton = el.find('.template-sort-search-container a.switch-view-link:not(.binf-hidden)');
            expect(switchViewButton.length).toEqual(1);
            switchViewButton.trigger('click');
            done();
          });
      });

      it("check for list view in first page of side panel", function (done) {
        TestUtils.waitFor(function(){
          var listVisible = TestUtils.isElementVisible($(".template-in-sidepanel .csui-sidepanel-container .template-table-list")[0],$(".csui-sidepanel")[0]);
          var gridVisible = TestUtils.isElementVisible($(".template-in-sidepanel .csui-sidepanel-container .template-table-grid")[0],$(".csui-sidepanel")[0]);
          return listVisible && !gridVisible;
        },"list to appear, grid to disappear").then(done,done.fail);
      });

      it("check for available BWS Templates section of side panel", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .template-title").done(function (el) {
            expect(el.length).toEqual(1);
            expect(el[0].innerText).toEqual("Available business workspace templates");
            done();
          });
      });

      it("next button should be disabled before template selection", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            TestUtils.asyncElement(document.body,
              ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer button.binf-disabled").done(function (el2) {
                expect(el2.length).toEqual(1);
                var footerRightBtns = el.find('.cs-footer-right .binf-btn');
                expect(footerRightBtns.get(0) && footerRightBtns.get(0).textContent).toBe("Next");
                expect(footerRightBtns.get(0).disabled).toBeTruthy();
                done();
              });
          });
      });

      it("After selecting first template Next button should be enabled and clickable", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container").done(function (el) {
            expect(el.length).toEqual(1);
            TestUtils.asyncElement(document.body,
              ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer button.binf-disabled").done(function (el2) {
                expect(el2.length).toEqual(1);
                var footerRightBtns = el.find('.cs-footer-right .binf-btn');
                expect(footerRightBtns.get(0) && footerRightBtns.get(0).textContent).toBe("Next");
                expect(footerRightBtns.get(0).disabled).toBeTruthy();
                $('.csui-saved-item:first').find('.csui-table-cell-_select .csui-checkbox').trigger('click')
                TestUtils.asyncElement(document.body,
                  ".template-in-sidepanel .csui-sidepanel-container .csui-saved-item.DTTT_selected").done(function (el3) {
                    expect(el3.length).toEqual(1);
                    footerRightBtns = el.find('.cs-footer-right .binf-btn')
                    expect(footerRightBtns.get(0).disabled).toBeFalsy();
                    TestUtils.asyncElement(document.body,
                      ".template-in-sidepanel .csui-sidepanel-container #continue-btn.binf-disabled", true).done(function (el4) {
                        footerRightBtns = el.find('.cs-footer-right .binf-btn')
                        $(footerRightBtns.get(0)).trigger('click');
                        done();
                      });
                  });
              });
          });
      });


      it("Check for metadata page footer buttons", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .cs-add-item-metadata-form.csui-slide-visible").done(function (el) {
            expect(el.length).toEqual(1);
            TestUtils.asyncElement(document.body,
              ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer").done(function (el2) {
                expect(el2.length).toEqual(1);
                var footerRightBtns = el2.find('.cs-footer-right .binf-btn');
                expect(footerRightBtns.get(0) && footerRightBtns.get(0).textContent).not.toBe("Next");
                expect(footerRightBtns.get(0) && footerRightBtns.get(0).textContent).toBe("Create");
                TestUtils.asyncElement(document.body,
                  ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer .cs-footer-left .arrow_back").done(function (el3) {
                    expect(el3.length).toEqual(1);
                    done();
                  });
              });
          });
      });

      it("click on create button, side panel should be closed", function (done) {
        TestUtils.asyncElement(document.body,
          ".template-in-sidepanel .csui-sidepanel-container .cs-add-item-metadata-form.csui-slide-visible").done(function (el) {
            expect(el.length).toEqual(1);
            TestUtils.asyncElement(document.body,
              ".template-in-sidepanel .csui-sidepanel-container .csui-sidepanel-footer").done(function (el2) {
                expect(el2.length).toEqual(1);
                var footerRightBtns = el2.find('.cs-footer-right .binf-btn');
                expect(footerRightBtns.get(0) && footerRightBtns.get(0).textContent).toBe("Create");
                expect(footerRightBtns.get(0).disabled).toBeFalsy();
                footerRightBtns.trigger('click');
                TestUtils.asyncElement(document.body,
                  ".template-in-sidepanel .csui-sidepanel-container", true).done(function (el3) {
                    expect(el3.length).toEqual(0);
                    done();
                  });
              });
          });
      });

    });
  });
});