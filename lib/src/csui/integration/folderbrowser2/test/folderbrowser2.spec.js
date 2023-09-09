/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette',
  'csui/widgets/nodestable/nodestable.view',
  'csui/integration/folderbrowser2/folderbrowser2.widget',
  './folderbrowser2.mock.data.js'
], function (module, $, _, Marionette, NodesTableView,
    FolderBrowserWidget2, folderBrowserMock) {
  'use strict';

  describe('FolderBrowserWidget2 container', function () {
    var enableLog = false;
    function initHtmlBody(el) {
      document.body.innerHTML =
          '<div class="container">' +
          '<div class="row">' +
          '<div id ="content"></div>' +
          '</div></div>';
      return true;
    }
    function clearHtmlBody(el) {
      document.body.innerHTML = '</div></div>';
      return true;
    }

    beforeAll(function (done) {
      var par = null;
      initHtmlBody(par);
      if (enableLog) {
        console.log("Created HTML elements");
      }
      folderBrowserMock.test.enable();
      done();
    });

    afterAll(function (done) {
      folderBrowserMock.test.disable();
      if (enableLog) {
        console.log("Disabled mock in afterAll");
      }
      clearHtmlBody(null);
      if (enableLog) {
        console.log("Deleted HTML elements");
      }
      done();
    });

    describe('FolderBrowserWidget2', function () {
      var connection = {
        url: '//server/otcs/cs/api/v1',
        supportPath: '/support',
        session: {
          ticket: 'dummy'
        }
      };

      beforeAll(function () {
      });

      afterEach(function () {
      });

      it('can be created and destroyed without showing', function () {
        var folderBrowser = new FolderBrowserWidget2({
          connection: connection,
          start: {id: 101}
        });
        folderBrowser.destroy();
      });

    });

  });
});
