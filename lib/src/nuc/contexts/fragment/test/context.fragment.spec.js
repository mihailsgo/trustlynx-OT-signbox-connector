/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/contexts/context', 'nuc/contexts/factories/factory',
  'nuc/contexts/fragment/context.fragment'
], function (_, Backbone, Context, Factory, ContextFragment) {
  'use strict';

  describe('ContextFragment', function () {
    var context, contextFragment;
    var TestModel, TestFactory, NestedContextFactory;

    beforeAll(function () {
      TestModel = Backbone.Model.extend({});

      TestFactory = Factory.extend({
        propertyPrefix: 'test',
        constructor: function TestFactory() {
          Factory.prototype.constructor.apply(this, arguments);
          this.property = new TestModel();
          this.fetched = 0;
        },
        fetch: function () {
          ++this.fetched;
        }
      });

      NestedContextFactory = Factory.extend({
        propertyPrefix: 'nestedContext',
        constructor: function NestedContextFactory() {
          Factory.prototype.constructor.apply(this, arguments);
          this.property = new Context();
        },
        fetch: function (options) {
          return this.property.fetch(options);
        }
      });
    });

    beforeEach(function () {
      context = new Context();
      contextFragment = new ContextFragment(context);
    });

    it('collects factories added to context', function () {
      context.getObject(TestFactory);
      expect(contextFragment._items.length).toEqual(1);
      var item = contextFragment._items[0];
      expect(item.propertyName).toEqual('test');
      expect(item.factory).toBe(context._factories['test']);
    });

    it('fetches collected factories', function (done) {
      context.getObject(TestFactory);
      var requested = 0;
      var synced = 0;
      var promise = contextFragment
          .on('request', function () {
            ++requested;
          })
          .on('sync', function () {
            ++synced;
            expect(requested).toEqual(1);
            expect(contextFragment._items[0].factory.fetched).toEqual(1);
            expect(contextFragment.fetching).toBeFalsy();
            expect(contextFragment.fetched).toBeTruthy();
            expect(contextFragment.error).toBeFalsy();
          })
          .fetch();
      expect(contextFragment.fetching).toBe(promise);
      expect(contextFragment.fetched).toBeFalsy();
      expect(contextFragment.error).toBeFalsy();
      promise.then(function () {
        expect(synced).toEqual(1);
        done();
      });
    });

    it('does not fetch temporary factories', function (done) {
      context.getObject(TestFactory, { temporary: true });
      contextFragment
          .fetch()
          .then(function () {
            expect(contextFragment._items[0].factory.fetched).toEqual(0);
            done();
          });
    });

    it('fetching triggers events on the original context too', function (done) {
      var requested = 0;
      context
          .on('request', function () {
            ++requested;
          })
          .on('sync', function () {
            expect(requested).toEqual(1);
            done();
          });
      contextFragment.fetch();
    });

    it('clearing removes collected factories', function () {
      context.getObject(TestFactory);
      contextFragment.clear();
      expect(contextFragment._items.length).toEqual(0);
    });

    it('fetching a factory with a nested context does not fetch the factories twice', function (done) {
      var nestedContext = context.getObject(NestedContextFactory);
      nestedContext.getObject(TestFactory);
      contextFragment
          .fetch()
          .then(function () {
            expect(nestedContext._factories['test'].fetched).toEqual(1);
            done();
          });
    });
  });
});
