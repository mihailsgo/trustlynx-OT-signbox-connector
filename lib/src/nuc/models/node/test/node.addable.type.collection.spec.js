/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/models/node/node.addable.type.collection',
  'nuc/models/node/node.model', 'nuc/utils/connector',
  './node.addable.type.collection.mock.js'
], function (NodeAddableTypeCollection, NodeModel, Connector, mock) {
  'use strict';

  describe('NodeAddableTypeCollection', function () {
    beforeAll(function () {
      this.connector = new Connector({
        connection: {
          url: '//server/otcs/cs/api/v1',
          supportPath: '/support',
          session: { ticket: 'dummy' }
        }
      });
    });

    beforeEach(function () {
      mock.enable();
    });

    afterEach(function () {
      mock.disable();
    });

    it('retains type and type_name sent by the server', function (done) {
      var node = new NodeModel({ id: 2000 }, { connector: this.connector });
      var addableTypes = new NodeAddableTypeCollection(undefined, { node: node });
      addableTypes
        .fetch()
        .then(function () {
          expect(addableTypes.length).toEqual(2);
          var folder = addableTypes.first();
          expect(folder.get('type')).toEqual(0);
          expect(folder.get('type_name')).toEqual('Folder');
          var document = addableTypes.at(1);
          expect(document.get('type')).toEqual(144);
          expect(document.get('type_name')).toEqual('Document');
          done();
        });
    });
  });
});
