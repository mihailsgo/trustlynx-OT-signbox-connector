/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/backbone', 'csui/utils/connector',
  'csui/models/version', 'csui/utils/commands/versions/open',
  './open.mock.js', 'csui/models/node.actions'
], function (Backbone, Connector, VersionModel, OpenVersionCommand,
    mock, NodeActionCollection) {
  'use strict';

  describe('OpenVersionCommand', function () {

    var connector, cgiUrl, openCommand,
        originalWindowOpen, openedWindow, openForm;

    beforeAll(function () {
      cgiUrl = '//server/otcs/cs';
      connector = new Connector({
        connection: {
          url: cgiUrl + '/api/v1',
          supportPath: '/support',
          session: {
            ticket: 'dummy'
          }
        }
      });

      openCommand = new OpenVersionCommand();
      openForm = null;

      originalWindowOpen = window.open;
      window.open = function (url) {
        var openedDocument = document.createDocumentFragment();
        openedDocument.body = openedDocument;
        openedDocument.createElement = function createMockElement (name) {
          var el = document.createElement.apply(document, arguments);
          if (name === 'form') {
            el.submit = function submitMock () { openForm = el; };
          }
          return el;
        };
        openedWindow = {
          document: openedDocument,
          location: {
            href: url
          },
          focus: function () {}
        };
        return openedWindow;
      };

      mock.enable();
    });

    afterAll(function () {
      window.open = originalWindowOpen;

      mock.disable();
    });

    it('Navigates to version-specific REST URL', function (done) {
      var version = new VersionModel({
            id: 2001,
            mime_type: 'text/plain',
            version_number: 2
          }, {
            connector: connector
          });

      var openables = new NodeActionCollection(undefined, {
        connector: connector,
        nodes: [ version.get('id') ],
        commands: [ 'open' ]
      });
      openables.fetch().then(function () {
        var Id = version.get('id');
        var openable = openables.get(Id);
        version.actions.add(openable.actions.models);
        var status = {
          nodes: new Backbone.Collection([version])
        };
        var promise = openCommand.execute(status);
        promise.then(function () {
            expect(openForm).toBeTruthy();
            var fields = openForm.querySelectorAll('[name]');
            expect(fields.length).toEqual(3);
            expect(fields[0].name).toEqual('func');
            expect(fields[0].value).toEqual('csui.authenticate');
            expect(fields[1].name).toEqual('otcsticket');
            expect(fields[1].value).toEqual('dummy');
            expect(fields[2].name).toEqual('nexturl');
            expect(fields[2].value)
              .toEqual(cgiUrl + '?func=doc.fetchcsui&nodeid=2001&vernum=2');
            done();
          });
      });
    });

  });

});
