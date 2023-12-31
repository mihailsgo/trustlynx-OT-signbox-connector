/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette',
  'csui/utils/log',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/children',
  'csui/models/node/node.addable.type.factory',
  'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/widgets/nodestable/toolbaritems',
  'conws/utils/commands/test/addconws.open.bws.mock.data',
  'conws/utils/commands/addconws',
  'csui/utils/commandhelper',
  'conws/utils/test/testutil',
  'csui/models/nodes',
  'csui/controls/globalmessage/globalmessage',
  'i18n!conws/utils/commands/nls/commands.lang',
  'csui/utils/contexts/factories/next.node',
], function ($, _, Marionette,
    log,
    PageContext,
    ChildrenCollectionFactory,
    AddableTypeCollectionFactory,
    TableToolbarView,
    toolbarItems,
    MockData,
    AddConwsCommand,
    CommandHelper,
    TestUtil,
    NodeCollection,
	GlobalMessage,
    CommandsLang,
    NextNodeModelFactory,
    ReferenceTabLang) {

  describe('Create and open new workspace: test', function () {
	  
	 var originalTimeout = 0;

	  beforeAll(function() {
		originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
	  });

	  afterAll(function() {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
	  });

    function initTestInfo(testInfo,folderid) {
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
          },
          node: {
            attributes: {id: folderid},
            get: function () {
              return folderid;
            }
          }
        }
      });
      testInfo.collection = testInfo.context.getCollection(ChildrenCollectionFactory);
      testInfo.addableTypes = testInfo.context.getCollection(AddableTypeCollectionFactory);
      testInfo.selectedNodes = new NodeCollection();
      testInfo.requestSent = false;
    }

    var executeStatusData = {
      29725: {
        subType: 848,
        template: {
          id: 29725,
          name: "Contract Workspace",
          subType: 848
        },
        wsType: {
          id: 2,
          name: "Contract Workspace Type",
          templates: [
            {
              id: 29725,
              name: "Contract Workspace",
              subType: 848
            }
          ]
        }
      },
      502179: {
        subType: 848,
        template: {
          id: 502179,
          name: "Material",
          subType: 848
        },
        wsType: {
          id: 437,
          name: "Mat Ws Type",
          templates: [
            {
              id: 502179,
              name: "Material",
              subType: 848
            }
          ]
        }
      }
    };

    function waitForSetFocusTimeout(done) {
      var timeoutReached = false;
      TestUtil.run(done,function(){
        timeoutReached = false;
        setTimeout(function(){
          timeoutReached = true;
        }, 500 );
      });
      TestUtil.waitFor(done,function() {
        var reached = timeoutReached===true;
        timeoutReached = false;
        return reached;
      },"focus timeout to be elapsed", 600);
    }

    function createDialog(done,testInfo,templateid) {
      testInfo.addWorkspaceCommand = new AddConwsCommand();
      TestUtil.run(done,function () {
        testInfo.executeStatus = {
          nodes: testInfo.selectedNodes,
          container: testInfo.collection.node,
          collection: testInfo.collection,
          context: testInfo.context,
          data: executeStatusData[templateid]
        };
        testInfo.executeOptions = {
          context: testInfo.context,
          addableType: 848,
          addableTypeName: "Contract Workspace"
        };
        testInfo.promiseFromCommand = testInfo.addWorkspaceCommand.execute(
            testInfo.executeStatus,
            testInfo.executeOptions
        );
        testInfo.promiseFromCommand
            .done(function () {
              testInfo.commandResult = "resolved";
            })
            .fail(function () {
              testInfo.commandResult = "rejected";
            });
      });

      TestUtil.waitFor(done,function () {
        if (testInfo.executeStatus) {
          if (testInfo.executeStatus.metadataAddItemController) {
            if (testInfo.executeStatus.metadataAddItemController.metadataAddItemPropView) {
              if (testInfo.executeStatus.metadataAddItemController.metadataAddItemPropView.metadataPropertiesView) {
                testInfo.metadataPropertiesView = testInfo.executeStatus.metadataAddItemController.metadataAddItemPropView.metadataPropertiesView;
                return true;
              }
            }
          }
        }
        return false;
      }, "dialog to be created", 6000);

      var isRendered = false;
      TestUtil.run(done,function () {
        testInfo.metadataPropertiesView.on('render:forms', function () {
          isRendered = true;
        });
      });

      TestUtil.waitFor(done,function () {
        return isRendered === true;
      }, "dialog to be rendered", 6000); // long timeout, so we get network errors in test output

      TestUtil.run(done,function(done) {
        waitForSetFocusTimeout(done);
      });

      TestUtil.waitFor(done,function () {
        testInfo.htmlDialog = $(".cs-item-action-metadata.cs-dialog.binf-modal");
        testInfo.htmlCreateForm = $(testInfo.htmlDialog).find(".cs-add-item-metadata-form");
        testInfo.htmlSaveButton = $(testInfo.htmlDialog)
            .find(".binf-modal-footer .binf-btn-primary:contains('" + CommandsLang.AddConwsMetadataDialogAddButtonTitle + "')");
        return testInfo.htmlCreateForm && testInfo.htmlCreateForm.length>0
          && testInfo.htmlSaveButton && testInfo.htmlSaveButton.length>0;
      }, "dialog elements to be available", 6000);
    }

    describe("Create and open new workspace: verify that", function () {

      var testInfo = {}, folderid = 25980, templateid = 29725;

      it("workspace creation dialog can be created", function (done) {

        MockData["testContract"].enable();
        initTestInfo(testInfo,folderid);
        var nextNode = testInfo.context.getModel(NextNodeModelFactory);
        nextNode.on('change:id',  function () {
          testInfo.requestSent = true;
        });
        createDialog(done, testInfo,templateid);
        TestUtil.run(done,function() {
          expect(testInfo.htmlDialog.length).toEqual(1);
        });

      });

      it("workspace creation dialog can be saved", function (done) {
        var nameVal = "Test Contract Workspace 001";
        var htmlNameFieldInput;
        TestUtil.run(done,function () {
          htmlNameFieldInput = $(testInfo.htmlCreateForm).find(".cs-metadata-item-name input");
          htmlNameFieldInput.trigger('keydown');
          htmlNameFieldInput.val(nameVal);
          htmlNameFieldInput.trigger('keyup');
          htmlNameFieldInput.trigger('blur');
          testInfo.executeStatus.metadataAddItemController.metadataAddItemPropView.blockActions();
          testInfo.htmlSaveButton.trigger('click');
        });
        TestUtil.waitFor(done,function () {
          if (testInfo.commandResult) {
            return true;
          }
          return false;
        }, "command to be resolved", 3000);
        TestUtil.run(done,function () {
          expect(testInfo.commandResult).toEqual("resolved");
        });
      });

      it("workspace creation dialog is closed and removed after save", function (done) {
        waitForCreateDialogToBeClosed(done, testInfo);
      });

      it("open new workspace request was sent", function(done) {
        expect(testInfo.requestSent).toBeTrue;
        MockData["testContract"].disable();
		done();
      });

    });


    function waitForCreateDialogToBeClosed(done, testInfo) {
      TestUtil.waitFor(done,function () {
        testInfo.htmlDialog = $(".cs-item-action-metadata.cs-dialog.binf-modal");
        return testInfo.htmlDialog.length === 0;
      }, "dialog to be closed", 3000);
      TestUtil.run(done,function () {
        expect(testInfo.htmlDialog.length).toEqual(0);
        if (testInfo.htmlDialog.length>0) {
          testInfo.htmlDialog.remove();
          testInfo.htmlDialog = $(".cs-item-action-metadata.cs-dialog.binf-modal");
        }
      });
    }

  });

});
