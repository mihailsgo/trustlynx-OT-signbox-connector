/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

csui.require.config({
  config: {
    "smart/controls/progresspanel/progressbar.view.ext": {
      "smart": {
        enableRetry: true,
        enhancePanel: true
      }
    },
    "smart/controls/progresspanel/progresspanel.view.ext": {
      "smart": {
        enableRetry: true,
        enhancePanel: true
      }
    },
    "smart/controls/progresspanel/impl/progresspanel/progressbar.view": {
      "smart": {
        enableRetry: true,
        enhancePanel: true
      }
    },
    "smart/controls/progresspanel/impl/progresspanel/progresspanel.view": {
      "smart": {
        enableRetry: true,
        enhancePanel: true
      }
    }
  }
});

define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/connector', 'nuc/models/node/node.model',
  'nuc/utils/basicauthenticator', 'nuc/models/nodechildren',
  './progresspanel.mock.js',
  'smart/controls/progresspanel/progresspanel',
  "nuc/lib/marionette",
  'nuc/lib/jquery.mockjax',
  '../../../../../utils/testutils/async.test.utils'
], function (_, $, Backbone, Connector, NodeModel, BasicAuthenticator,
    NodeChildrenCollection, mock, ProgressPanel, Marionette, mockjax, TestUtils) {

  describe('Progress Panel', function () {

    var node, testCollection, uploadRegion, view, version, pageContext, connector, authenticator,
      options = {
        actionType: 'UPLOAD',
        allowMultipleInstances: true,
        enableMinimiseButtonOnProgressPanel: true,
        hideGotoLocationSingleSet: false,
        typeIconClass: "csui-icon mime_pdf"
      };

    function initialize(options) {
      var collectionData = options && options.collectionData || mock.collectionData;
      collectionData.forEach(function(item) {
        item.state = options && options.state || 'processing';
        return item;
      });

      if (!node) {
        authenticator = new BasicAuthenticator({
          credentials: {
            username: 'Admin',
            password: 'livelink'
          }
        }),
        connector = new Connector({
          authenticator: authenticator,
          connection: {
            url: '//server/otcs/cs/api/v2',
            supportPath: '/support',
            session: {
              ticket: 'dummy'
            }
          }
        }),
        node = new NodeModel({id: 1234}, {connector: connector});
      }

      const collection = new NodeChildrenCollection(collectionData, {
        node: node
      });

      if(testCollection) {
        testCollection.reset(collectionData);
      }else {
        testCollection = collection;
      }
      var divContainer = '<div class="binf-container"><div class="binf-row"><div class="binf-col-sm-12" id="content"></div></div></div>';
      $('body').append(divContainer);

      uploadRegion = new Marionette.Region({
        el: "#content"
      });

      view = mock.newView();
      uploadRegion.show(view);
    }

    function destroy() {
      ProgressPanel && ProgressPanel.hideFileUploadProgress();
      uploadRegion && uploadRegion.destroy();
      $('body').empty();
    }

    function updateProgress(updateObj) {
      testCollection.forEach(function(fileUpload) {
        fileUpload.set(updateObj);
      });
    }

    beforeAll(function () {
      mockjax.publishHandlers();
      mock.enable();
    });

    afterAll(function () {
      mock.disable();
      destroy();
      TestUtils.cancelAllAsync();
      TestUtils.restoreEnvironment();
    });

    describe('ProgressPanel', function () {
      it('Show progress panel for upload action', function (done) {
        initialize();
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const messageRegionContainer = $('body').find('.csui-message-container');
        expect(messageRegionContainer.length).toEqual(1);
        expect(messageRegionContainer.find(".csui-progresspanel").length).toEqual(1);
        ProgressPanel.setMessageRegionView(view, options);
        expect(messageRegionContainer.find(".csui-progresspanel").length).toEqual(0);
        destroy();
        done();
      });

      it('Show Loader panel', function (done) {
        initialize();
        const options = {
          label: "Download",
          enableCancel: true
        };
        ProgressPanel.setMessageRegionView(view);
        var node = new NodeModel({id: 1234}, {
              connector: connector
            }),
            jqxhr = node.fetch();
        ProgressPanel.showLoader(jqxhr, options);
        TestUtils.asyncElement('body', '.csui-loaderpanel').done(function(el) {
          expect(el.length).toEqual(1);
          ProgressPanel.changeLoaderMessage('New loading message');
          const loadingMsg = $(el).find('#csui-loading-stage');
          expect(loadingMsg.text()).toEqual('New loading message');
          destroy();
          done();
        });
      });

      it('Hide Loader panel on pressing enter on cancel button', function (done) {
        initialize();
        const options = {
          label: "Download",
          enableCancel: true
        };
        ProgressPanel.setMessageRegionView(view);
        var node = new NodeModel({id: 1234}, {
              connector: connector
            }),
            jqxhr = node.fetch();
        ProgressPanel.showLoader(jqxhr, options);
        expect(view.$el.find(".csui-loaderpanel").length).toEqual(1);
        var cancelBtn = view.$el.find(".csui-loader-cancel");
        expect(cancelBtn.length).toEqual(1);
        expect(cancelBtn.is(':focus')).toBeTruthy();
        cancelBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
        TestUtils.asyncElement('body', '.csui-loaderpanel:visible', true).done(function(el) {
          expect(el.length).toEqual(0);
          destroy();
          done();
        });
      });

      it('Checks expand and collapse functionality', function (done) {
        initialize();
        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        const panelEl = view.$el.find(".csui-progresspanel");
        expect(panelEl.length).toEqual(1);

        const expandBtn = panelEl.find('.csui-header .csui-expand-down');
        const collapseBtn = panelEl.find('.csui-header .csui-expand-up');
        expect(expandBtn.length).toEqual(1);
        expandBtn.trigger('click');
        TestUtils.asyncElement('body', '.csui-progresspanel.csui-expanded').done(function (el) {
          expect(el.length).toBe(1);
          expect(collapseBtn.length).toEqual(1);
          collapseBtn.trigger('click');
          TestUtils.asyncElement('body', '.csui-progresspanel.csui-collapsed').done(function (el) {
            expect(el.length).toEqual(1);
            setTimeout(function() {
              destroy();
              done();
            }, 300);
          });
        });
      });

      it('Checks for keyboard navigation functionality', function (done) {
        initialize();

        options.miniProgressBarClass = "csui-progressbar-maximize",
        options.miniProgressBarTarget = view.$el;

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        
        const panelEl = view.$el.find(".csui-progresspanel");
        expect(panelEl.length).toEqual(1);
        panelEl.trigger({type: 'keydown', keyCode: 9, which: 9});
        
        const expandBtn = panelEl.find('.csui-header .csui-expand-down');
        expandBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
        TestUtils.asyncElement('body', '.csui-progresspanel.csui-expanded .csui-items:visible').done(function (el) {
          expect(el.length).toBe(1);
          setTimeout(function() {
            let currentFocusedItem = checkForFocusedRow(el, 0);
            currentFocusedItem.trigger({type: 'keydown', keyCode: 40, which: 40});
            currentFocusedItem = checkForFocusedRow(el, 1);
            currentFocusedItem.trigger({type: 'keydown', keyCode: 38, which: 38});
            currentFocusedItem = checkForFocusedRow(el, 0);
            currentFocusedItem.trigger({type: 'keydown', keyCode: 9, which: 9, shiftKey: true});
            panelEl.trigger({type: 'keydown', keyCode: 9, which: 9, shiftKey: true});
            const collapseBtn = panelEl.find('.csui-header .csui-expand-up');
            expect(collapseBtn.length).toEqual(1);
            collapseBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
            TestUtils.asyncElement('body', '.csui-progresspanel.csui-collapsed .csui-items:visible', true).done(function (el) {
              expect(el.length).toEqual(0);
              const minimizeBtn = panelEl.find('.csui-header .csui-minimize .icon-progresspanel-minimize');
              expect(minimizeBtn.length).toEqual(1);
              minimizeBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
              TestUtils.asyncElement('body', '.csui-progressbar-maximize:visible').done(function(el) {
                expect(el.length).toBe(1);
                const maximizeBtn = view.$el.find('.csui-progressbar-maximize .csui-maximize .csui-button-icon');
                expect(maximizeBtn.length).toBe(1);
                maximizeBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
                TestUtils.asyncElement('body', '.csui-progresspanel:visible').done(function() {
                  expect(el.length).toBe(1);
                  destroy();
                  done();
                });
              });
            });
          }, 100);
        });

        function checkForFocusedRow(parentEl, focusedElIndex) {
          const listItems = $(parentEl).children('.csui-progressbar.csui-progressrow');
          const focusedEl = listItems[focusedElIndex];
          expect(focusedEl.className.indexOf('focused-row')).toBeGreaterThan(-1);
          return $(document.activeElement);
        }
      });
    });

    describe('Progress panel all states', function() {
      it('show pending and then update to processing & resolved', function (done) {
        initialize({state: 'pending'});

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);
        expect(panelEl.find('.csui-header .csui-progress-static-pending.binf-hidden').length).toBe(0);
        updateProgress({state: 'processing'});
        expect(panelEl.find('.csui-header .csui-progress-dynamic.binf-hidden').length).toBe(0);

        let isInProgress = ProgressPanel.isActionInProgress();
        expect(isInProgress).toBeTruthy();
        updateProgress({state: 'resolved'});

        isInProgress = ProgressPanel.isActionInProgress();
        expect(isInProgress).toBeFalsy();
        const gotolocationBtn = panelEl.find('.csui-gotolocation-url');
        expect(gotolocationBtn.length).toBeGreaterThan(0);
        $(gotolocationBtn[0]).trigger('click');
        destroy();
        done();
      });

      it('show finalizing state', function (done) {
        initialize({state: 'finalizing'});

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);
        expect(panelEl.find('.csui-items .csui-name-status .csui-progress-static-finalizing.binf-hidden').length).toBe(0);
        destroy();
        done();
      });

      it('show stopping & stopped state', function (done) {
        initialize({state: 'stopping'});

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);
        expect(panelEl.find('.csui-items .csui-name-status .csui-progress-static-stopping.binf-hidden').length).toBe(0);

        updateProgress({state: 'stopped'});
        expect(panelEl.find('.csui-items .csui-name-status .csui-progress-static-stopped.binf-hidden').length).toBe(0);
        destroy();
        done();
      });

      it('show aborted state', function (done) {
        initialize({state: 'aborted'});

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);
        expect(panelEl.find('.csui-items .csui-name-status .csui-progress-static-aborted.binf-hidden').length).toBe(0);
        destroy();
        done();
      });

      it('show rejected state', function (done) {
        initialize({state: 'rejected'});

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);
        expect(panelEl.find('.csui-items .csui-name-status .csui-progress-static-rejected.binf-hidden').length).toBe(0);
        const closeBtn = panelEl.find('.csui-header .csui-close button');
        expect(closeBtn.length).toBe(1);
        closeBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
        TestUtils.asyncElement('body', '.csui-progresspanel:visible', true).done(function(el) {
          expect(el.length).toBe(0);
          destroy();
          done();
        });
      });

      it('shows single item progresspanel', function(done) {
        initialize({state: 'pending', collectionData: [mock.collectionData[0]]});
        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);

        updateProgress({state: 'processing'});
        updateProgress({state: 'rejected'});

        expect(panelEl.find('.csui-items').children().length).toBe(1);

        destroy();
        done();
      });
    });

    describe('Progress panel with various options', function() {
      let inProgressSpy, completedSpy;

      beforeEach(function() {
        inProgressSpy = jasmine.createSpy('event'),
        completedSpy = jasmine.createSpy('event');
      });

      it('shows progresspanel with server error', function(done) {
        initialize();
        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const panelEl = view.$el.find('.csui-progresspanel');
        expect(panelEl.length).toEqual(1);
        updateProgress({state: 'rejected', serverFailure: true, errorMessage: 'Server failure'});
        const expandBtn = panelEl.find('.csui-header .csui-expand-down');
        expect(expandBtn.length).toBe(1);
        expandBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
        TestUtils.asyncElement('body', '.csui-progresspanel.csui-expanded').done(function (el) {
          expect(el.length).toBe(1);
          const retryBtn = el.find('.csui-show-retry .csui-showRetry');
          expect(retryBtn.length).toBeGreaterThan(1);
          $(retryBtn[0]).trigger({type: 'keydown', keyCode: 13, which: 13});
          const collapseBtn = panelEl.find('.csui-header .csui-expand-up');
          expect(collapseBtn.length).toBe(1);
          collapseBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
          TestUtils.asyncElement('body', '.csui-progresspanel.csui-collapsed').done(function() {
            const retryAllBtn = $(el).find('.csui-header .csui-show-retryAll');
            expect(retryAllBtn.length).toBe(1);
            retryAllBtn.trigger({type: 'keydown', keyCode: 13, which: 13});
            destroy();
            done();
          });
        });
      });
      
      it('shows progresspanel with originatingView', function(done) {
        view.listenTo(view, 'global.alert.inprogress', inProgressSpy);
        view.listenTo(view, 'global.alert.completed', completedSpy);

        options.originatingView = view;
        initialize({state: 'processing'});
        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        expect(inProgressSpy).toHaveBeenCalled();
        updateProgress({state: 'resolved'});
        expect(completedSpy).toHaveBeenCalled();
        destroy();
        done();
      });

      it('shows progresspanel with autoHideSuccessMessage', function(done) {
        const timeout = 5000;

        options.enablePermanentHeaderMessages = false,
        options.hideGotoLocationSingleSet = true,
        options.hideGotoLocationMultiSet = true;

        initialize({state: 'resolved', collectionData: mock.collectionData.map(function(item) {
          delete item.targetLocation;
          return item;
        })});

        ProgressPanel.setMessageRegionView(view, options);
        ProgressPanel.setFileUploadCollection(testCollection);
        ProgressPanel.showProgressPanel(testCollection, options);
        const startTime = new Date();
        TestUtils.asyncElement('body', '.csui-progresspanel:visible', true).done(function (el) {
          const endTime = new Date();
          expect(el.length).toBe(0);
          const timeTaken = (endTime - startTime);
          const expectedMaxTime = timeout + 1000;
          expect(timeTaken).toBeLessThan(expectedMaxTime);
          destroy();
          done();
        });
      });
    });
  });
});
