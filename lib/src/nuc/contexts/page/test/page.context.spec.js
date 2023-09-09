/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define('test-page.context.factory', [
  'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/contexts/factories/factory'
], function (_, Backbone, ModelFactory) {
  'use strict';

  var TestModel = Backbone.Model.extend({});

  var TestModelFactory = ModelFactory.extend({
    propertyPrefix: 'test',

    constructor: function TestModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var test = this.options.test || {};
      if (!(test instanceof Backbone.Model)) {
        test = new TestModel(test.models, _.extend({}, test.options));
      }
      this.property = test;
    }
  });

  return TestModelFactory;
});

define('test-page.context.plugin', [
  'nuc/contexts/context.plugin', 'test-page.context.factory'
], function (ContextPlugin, TestModelFactory) {
  'use strict';

  var TestContextPlugin = ContextPlugin.extend({
    constructor: function TestContextPlugin(options) {
      ContextPlugin.prototype.constructor.apply(this, arguments);
      this.test = this.context.getModel(TestModelFactory);
    }
  });

  return TestContextPlugin;
});

define([
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/contexts/page/page.context',
  'nuc/contexts/factories/factory', 'test-page.context.factory'
], function (_, $, PageContext, Factory, TestModelFactory) {
  'use strict';

  describe('PageContext', function () {
    var fetchSpy, destroySpy;

    var FetchableObjectFactory = Factory.extend({
      propertyPrefix: 'fetchable',

      constructor: function FetchableObjectFactory(context, options) {
        Factory.prototype.constructor.apply(this, arguments);

        this.property = {};

        fetchSpy = spyOn(this, 'fetch');
        fetchSpy.and.callThrough();
        destroySpy = spyOn(this, 'destroy');
        destroySpy.and.callThrough();
      },

      fetch: function () {
        var self = this,
          deferred = $.Deferred();
        setTimeout(function () {
          self.property.fetched = true;
          deferred.resolve();
        }, 1);
        return deferred.promise();
      }
    });

    var NonFetchableObjectFactory = Factory.extend({
      propertyPrefix: 'non-fetchable',

      constructor: function NonFetchableObjectFactory(context, options) {
        Factory.prototype.constructor.apply(this, arguments);

        this.property = {};
      }
    });

    var pageContext, fetchableObject;

    beforeEach(function () {
      pageContext = new PageContext();
      fetchableObject = pageContext.getObject(FetchableObjectFactory);
    });

    it('supports plugins', function () {
      var context = new PageContext();
      expect(context.hasModel(TestModelFactory)).toBeTruthy();
    });

    it('offers method aliases to get contextual objects of different kinds', function () {
      var method1 = PageContext.prototype.getObject,
          method2 = PageContext.prototype.getModel,
          method3 = PageContext.prototype.getCollection;
      expect(method1).toBe(method2);
      expect(method1).toBe(method3);
    });

    it('creates one contextual object for one factory class requested multiple times', function () {
      var fetchableObject2 = pageContext.getObject(FetchableObjectFactory);
      expect(fetchableObject).toBe(fetchableObject2);
    });

    it('fetches only fetchable objects', function () {
      pageContext.getModel(NonFetchableObjectFactory);
      pageContext.fetch();
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('waits for the contextual objects until they are fetched', function (done) {
      expect(fetchableObject.fetched).toBeFalsy();

      pageContext.fetch().then(function() {
        expect(fetchableObject.fetched).toBeTruthy();
        done();
      });
    });

    it('removes object factories when being cleared', function () {
      var property1 = pageContext.getObject(NonFetchableObjectFactory);
      pageContext.clear();
      var property2 = pageContext.getObject(NonFetchableObjectFactory);
      expect(property1).not.toBe(property2);
    });

    it('destroys object factories when being cleared', function () {
      pageContext.clear();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
