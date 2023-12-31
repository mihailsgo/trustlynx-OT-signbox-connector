/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/connector', 'nuc/models/node/node.model', 'nuc/models/nodechildren',
  './server-side.mock.js'
], function (_, $, Backbone, Connector, NodeModel, NodeChildrenCollection, mock) {
  'use strict';

  describe('NodeChildrenCollection', function () {

    var node, testCollection, testCollectionFetchSpy;

    function initialize(options) {
      if (!node) {
        var connector = new Connector({
          connection: {
            url: '//server/otcs/cs/api/v1',
            supportPath: '/support',
            session: {
              ticket: 'dummy'
            }
          }
        });
        node = new NodeModel({id: 2000}, {connector: connector});
      }
      testCollection = new NodeChildrenCollection(undefined, _.extend({
        node: node
      }, options));
      testCollectionFetchSpy = spyOn(testCollection, 'fetch');
      testCollectionFetchSpy.and.callThrough();
    }

    beforeAll(function () {
      mock.enable();
    });

    afterAll(function () {
      mock.disable();
    });

    it('can be constructed', function () {
      initialize();
      expect(testCollection instanceof NodeChildrenCollection).toBeTruthy();
    });

    describe('fetch', function () {

      it('loads all models from the full collection by default', function (done) {
        initialize();
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBe(7);
              expect(testCollection.first().get('id')).toBe(1);
              expect(testCollection.last().get('id')).toBe(7);
              done();
            });
      });

      it('loads part of the full collection with settings from the constructor', function (done) {
        initialize({
          skip: 2,
          top: 2,
          orderBy: 'name desc',
          filter: {name: 't', type: [1, 3]}
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBe(2);
              expect(testCollection.first().get('id')).toBe(1);
              expect(testCollection.last().get('id')).toBe(5);
              done();
            });
      });

      it('loads part of the full collection with later provided settings', function (done) {
        initialize();
        testCollection.setLimit(2, 2, false);
        testCollection.setOrder('name desc', false);
        testCollection.setFilter({name: 't', type: [1, 3]}, false);
        testCollection.fetch()
            .then(function () {
              expect(testCollection.length).toBe(2);
              expect(testCollection.first().get('id')).toBe(1);
              expect(testCollection.last().get('id')).toBe(5);
              done();
            });
      });

      it('reloads the part of the full collection with the previous settings', function (done) {
        initialize({
          skip: 2,
          top: 2,
          orderBy: 'name desc',
          filter: {name: 't', type: [1, 3]}
        });
        testCollection.fetch()
            .then(function () {
              expect(testCollection.length).toBe(2);
              testCollection.reset([]);
              testCollection.fetch()
                  .then(function () {
                    expect(testCollection.length).toBe(2);
                    done();
                  });
            });
      });

    });

    describe('continuous fetch', function () {

      it('loads the initial top items if called at first', function (done) {
        initialize({
          skip: 0,
          top: 2
        });
        testCollection.fetch({
          remove: false,
          merge: false
        })
            .then(function () {
              expect(testCollection.length).toBe(2);
              expect(testCollection.first().get('id')).toBe(1);
              done();
            });

      });

      it('loads another top items if called later', function (done) {
        initialize({
          skip: 0,
          top: 2
        });
        testCollection.fetch()
            .then(function () {
              expect(testCollection.length).toBe(2);
              expect(testCollection.first().get('id')).toBe(1);
              testCollection.setSkip(testCollection.skipCount + testCollection.topCount, false);
              testCollection.fetch({
                remove: false,
                merge: false
              })
                  .then(function () {
                    expect(testCollection.length).toBe(4);
                    expect(testCollection.first().get('id')).toBe(1);
                    expect(testCollection.at(2).get('id')).toBe(3);
                    done();
                  });
            });
      });

      it('keeps the sorting and filtering parameters', function (done) {
        initialize({
          skip: 0,
          top: 2,
          orderBy: 'name',
          filter: {name: 'h'}
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBe(2);
              expect(testCollection.first().get('id')).toBe(5);
              testCollection.setSkip(testCollection.skipCount + testCollection.topCount, false);
              testCollection.fetch({
                remove: false,
                merge: false
              })
                  .then(function(){
                    expect(testCollection.length).toBe(4);
                    expect(testCollection.first().get('id')).toBe(5);
                    expect(testCollection.at(2).get('id')).toBe(7);
                    done();
                  });
            });
        });

    });

    describe('setLimit', function () {

      it('tops items at the specified index', function (done) {
        initialize({
          top: 3
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBe(3);
              expect(testCollection.first().get('id')).toBe(1);
              done();
            });
      });

      it('limits items to the specified count starting at the specified index', function (done) {
        initialize({
          skip: 3,
          top: 3
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBe(3);
              expect(testCollection.first().get('id')).toBe(4);
              done();
            });
      });

      it('fetches if the passed in parameters change the collection state', function (done) {
        initialize({
          skip: 2,
          top: 2
        });
        var syncCount = 0;
        testCollection.on('sync', function () {
          syncCount++;
          if (syncCount === 1){
            expect(testCollection.length).toBe(3);
            expect(testCollection.first().get('id')).toBe(1);
            expect(testCollection.setLimit(3, 3)).toBeTruthy();
            expect(testCollectionFetchSpy).toHaveBeenCalledTimes(2);
          }
          else{
            expect(testCollection.length).toBe(3);
            expect(testCollection.first().get('id')).toBe(4);
            done();
          }
        });
        expect(testCollection.setLimit(2, 3)).toBeTruthy();
        expect(testCollectionFetchSpy).toHaveBeenCalledTimes(1);
      });

      it('can delay the fetch if the parameters change the collection state', function () {
        initialize({
          skip: 2,
          top: 2
        });
        expect(testCollection.setLimit(2, 3, false)).toBeTruthy();
        expect(testCollectionFetchSpy).not.toHaveBeenCalled();
      });

      it('does not do anything if the parameters do not change the collection state', function () {
        initialize({
          skip: 2,
          top: 2
        });
        expect(testCollection.setLimit(2, 2)).toBeFalsy();
        expect(testCollectionFetchSpy).not.toHaveBeenCalled();
      });

    });

    describe('setOrder', function () {

      it('sorts ascending by default', function (done) {
        initialize({
          orderBy: 'name'
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBeGreaterThan(0);
              expect(testCollection.first().get('id')).toBe(5);
              done();
            });
      });

      it('sorts ascending when specified', function (done) {
        initialize({
          orderBy: 'name asc'
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBeGreaterThan(0);
              expect(testCollection.first().get('id')).toBe(5);
              done();
            });
      });

      it('sorts descending when specified', function (done) {
        initialize({
          orderBy: 'name desc'
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBeGreaterThan(0);
              expect(testCollection.first().get('id')).toBe(3);
              done();
            });
      });

      it('fetches if the passed in parameters change the collection state', function (done) {
        initialize({
          orderBy: 'type'
        });

        testCollection.on('sync', function () {
          expect(testCollection.length).toBe(7);
          expect(testCollection.first().get('id')).toBe(5);
          done();
        });
        expect(testCollection.setOrder('name')).toBeTruthy();
        expect(testCollectionFetchSpy).toHaveBeenCalledTimes(1);

      });

      it('can delay the fetch if the parameters change the collection state', function () {
        initialize({
          orderBy: 'type'
        });
        expect(testCollection.setOrder('name', false)).toBeTruthy();
        expect(testCollectionFetchSpy).not.toHaveBeenCalled();
      });

      it('does not do anything if the parameters do not change the collection state', function () {
        initialize({
          orderBy: 'type'
        });
        expect(testCollection.setOrder('type')).toBeFalsy();
        expect(testCollectionFetchSpy).not.toHaveBeenCalled();
      });

    });

    describe('setFilter', function () {

      it('given multiple property values treats them with the OR operation', function (done) {
        initialize({
          filter: {
            'name': ['d', 'i']
          }
        });
        testCollection.fetch()
            .then(function(){
              expect(testCollection.length).toBe(5);
              expect(testCollection.first().get('id')).toBe(1);
              done();
            });
      });

      it('given multiple properties treats them with the AND operation', function (done) {
        initialize({
          filter: {
            'name': ['d', 'i'],
            'type': 3
          }
        });
       testCollection.fetch()
           .then(function(){
             expect(testCollection.length).toBe(2);
             expect(testCollection.first().get('id')).toBe(5);
             done();
           });
      });

      it('fetches if the passed in parameters change the collection state', function (done) {
        initialize({
          filter: {'name': 't'}
        });
        var sync;
        testCollection.on('sync', function () {
          expect(testCollection.length).toBe(2);
          expect(testCollection.first().get('id')).toBe(2);
          done();
        });
        expect(testCollection.setFilter({'name': 'd'})).toBeTruthy();
        expect(testCollectionFetchSpy).toHaveBeenCalledTimes(1);

      });

      it('can delay the fetch if the parameters change the collection state', function () {
        initialize({
          filter: {'name': 't'}
        });
        expect(testCollection.setFilter({'name': 'd'}, false)).toBeTruthy();
        expect(testCollectionFetchSpy).not.toHaveBeenCalled();
      });

      it('does not do anything if the parameters do not change the collection state', function () {
        initialize({
          filter: {'name': 't'}
        });
        expect(testCollection.setFilter({'name': 't'})).toBeFalsy();
        expect(testCollectionFetchSpy).not.toHaveBeenCalled();
      });

    });

    describe('totalCount', function(){

      var node2, testCollection2;

      it('takes on the total_count provided by the server', function(done){
        var connector = new Connector({
          connection: {
            url: '//server/otcs/cs/api/v1',
            supportPath: '/support',
            session: {
              ticket: 'dummy'
            }
          }
        });

        node2 = new NodeModel({id: 2000}, {connector: connector});

        testCollection2 = new NodeChildrenCollection(undefined, {node: node2});

        testCollection2.fetch()
            .then(function () {
              expect(testCollection2.length).toBe(7);
              expect(testCollection2.totalCount).toBe(7);
              done();
            });
      });

      it('gets a zero value if total_count is not provided by server', function(done){
        node2.set('id', 2003, {silent: true});
        testCollection2.fetch()
            .then(function () {
              expect(testCollection2.length).toBe(0);
              expect(testCollection2.totalCount).toBe(0);
              done();
            });
      });
    });

  });

});
