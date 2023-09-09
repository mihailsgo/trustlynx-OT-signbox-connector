/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/backbone','nuc/models/node/node.model',
  'nuc/models/node.children2/node.children2', 'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'nuc/utils/connector', 'nuc/utils/url', './v2.delayed.commandable.mixin.mock.js','nuc/models/node.actions'
], function (Backbone,NodeModel, NodeChildrenCollection, ConnectableMixin, DelayedCommandableV2Mixin, Connector, Url, mock, NodeActionCollection) {
  'use strict';

  describe('DelayedCommandableV2Mixin', function () {
    beforeAll(function () {
      this.TestModel = Backbone.Model.extend({
        constructor: function TestModel(attributes, options) {
          this.actions = new Backbone.Collection();
          Backbone.Model.call(this, attributes, options);
          this
            .makeConnectable(options)
            .makeDelayedCommandableV2(options);
        },
        url: function () {
          var url = Url.combine(this.connector.connection.url, 'nodes', this.id);
          var query = Url.combineQueryString(this.getRequestedCommandsUrlQuery());
          return Url.appendQuery(url, query);
        },
        parse: function (response) {
          this.actions.reset(response.actions);
          return response;
        }
      });
      ConnectableMixin.mixin(this.TestModel.prototype);
      DelayedCommandableV2Mixin.mixin(this.TestModel.prototype);

      this.connector = new Connector({
        connection: {
          url: '//server/otcs/cs/api/v1',
          supportPath: '/support',
          session: { ticket: 'dummy' }
        }
      });

      mock.enable();
    });

    afterAll(function () {
      mock.disable();
    });

    it('updates actions before delayedActions triggers the "sync" event', function (done) {
      var testModel = new this.TestModel({ id: 2000 }, {
        connector: this.connector,
        commands: ['default', 'delayed'],
        defaultActionCommands: ['default'],
        delayRestCommands: true,
        promoteSomeRestCommands: false
      });
      var testModelSync;
      expect(testModel.actions.length).toBe(0);
      testModel.delayedActions
        .once('sync', function () {
          expect(testModelSync).toBe(true);
          expect(testModel.actions.length).toBe(2);
          done();
        });
      testModel
        .once('sync', function () {
          testModelSync = true;
          expect(testModel.actions.length).toBe(1);
        })
        .fetch();
    });

    it('allows filtering of actions', function (done) {
      var testModel = new this.TestModel({ id: 2000 }, {
        connector: this.connector,
        commands: ['default', 'delayed', 'toBeFiltered'],
        defaultActionCommands: ['default'],
        delayRestCommands: true,
        promoteSomeRestCommands: false
      });

      var testModelSync;
      expect(testModel.actions.length).toBe(0);
      testModel.delayedActions
        .once('sync', function () {
          expect(testModelSync).toBe(true);
          expect(testModel.actions.length).toBe(2);
          done();
        });

      testModel
        .once('sync', function () {
          testModelSync = true;
          expect(testModel.actions.length).toBe(1);
        })
        .once('before:update:actions', function (args) {
          args.newActions.remove(args.newActions.findRecursively('toBeFiltered'));
        })
        .fetch();
    });

    it('createDelayedActions(), createAdditionalActions() factory methods returns NodeActionCollection',function () {
      var testModel = new this.TestModel(undefined, {
        connector: this.connector
      });

      expect(testModel.delayedActions instanceof NodeActionCollection).toBeTruthy();
      expect(testModel.additionalActions instanceof NodeActionCollection).toBeTruthy();
    });

    it('delayedActions and additionalActions custom options', function() {
      var nodeCollection1 = new NodeChildrenCollection(undefined, {
        connector: this.connector,
        delayedActionsOptions: {
          test: 1
        }
      });

      var nodeCollection2 = new NodeChildrenCollection(undefined, {
        connector: this.connector,
        additionalActionsOptions: {
          test: 1
        }
      });

      expect(nodeCollection1.delayedActionsOptions).toBeDefined();
      expect(nodeCollection1.delayedActionsOptions.test).toBe(1);

      expect(nodeCollection2.additionalActionsOptions).toBeDefined();
      expect(nodeCollection2.additionalActionsOptions.test).toBe(1);
    });
  });

  describe('Non promoted actions', function () {
    var nodeModel1,nodeModel2;
    beforeAll(function () {
      this.connector = new Connector({
        connection: {
          url: '//server/otcs/cs/api/v1',
          supportPath: '/support',
          session: { ticket: 'dummy' }
        }
      });
      mock.enable();
      nodeModel1 = new NodeModel({id: 2000}, {connector: this.connector});
      nodeModel2 = new NodeModel({id: 2001}, {connector: this.connector});
    });

    afterAll(function () {
      mock.disable();
    });

    it('set and reset nonPromotedActionsOptions', function() {
      var nodeCollection = new NodeChildrenCollection(undefined, {
        connector: this.connector,
        nonPromotedActionsOptions: {
          test: 1
        }
      });

      expect(nodeCollection.nonPromotedActionsOptions).toBeDefined();
      expect(nodeCollection.nonPromotedActionsOptions.test).toBe(1);

      nodeCollection.setNonPromotedActionsOptions({test2: 2, test3: 3});
      expect(nodeCollection.nonPromotedActionsOptions).toBeDefined();
      expect(nodeCollection.nonPromotedActionsOptions.test).toBe(1);
      expect(nodeCollection.nonPromotedActionsOptions.test2).toBe(2);
      expect(nodeCollection.nonPromotedActionsOptions.test3).toBe(3);

      nodeCollection.resetNonPromotedActionsOptions('test');
      expect(nodeCollection.nonPromotedActionsOptions.test).toBeUndefined();
      expect(Object.keys(nodeCollection.nonPromotedActionsOptions).length).toBe(2);

      nodeCollection.resetNonPromotedActionsOptions(['test2']);
      expect(nodeCollection.nonPromotedActionsOptions.test2).toBeUndefined();
      expect(Object.keys(nodeCollection.nonPromotedActionsOptions).length).toBe(1);

      nodeCollection.resetNonPromotedActionsOptions();
      expect(Object.keys(nodeCollection.nonPromotedActionsOptions).length).toBe(0);
    });

    it('createNonPromotedActionsOptions() factory method returns NodeActionCollection', function(done) {
      var nodeCollection = new NodeChildrenCollection({id: 2000}, {
        connector: this.connector,
        nonPromotedActionOptions: {
          test: 1
        },
        node: nodeModel1,
        commands: ['default', 'delayed'],
        defaultActionCommands: ['default'],
        delayRestCommands: true
      });

      nodeCollection.models[0].nonPromotedActionCommands = ['copy'];
      nodeCollection.models[0]._updateOriginalActionsAfterLazyActions = function (nodeActionCollection) {
        expect(nodeActionCollection instanceof NodeActionCollection).toBeTruthy();
        done();
      };
      nodeCollection.models[0]._requestsNonPromotedRestActions();
    });

    it('Fetch non promoted actions concurrently', function (done) {
      var nodeCollection = new NodeChildrenCollection({id: 2000}, {
        connector: this.connector,
        node: nodeModel1,
        commands: ['default', 'delayed'],
        defaultActionCommands: ['default'],
        delayRestCommands: true
      });
      nodeCollection.add(nodeModel2);
      nodeCollection._requestDelayedActions();
      nodeCollection.delayedActions
      .once('sync', function () {
        expect(nodeCollection.delayedActions.length).toBe(1);
      });
      nodeCollection.models[0].nonPromotedActionCommands = ['copy'];
      nodeCollection.models[0]._requestsNonPromotedRestActions()
        .done(function () {
          expect(nodeCollection.models[0].get('csuiLazyActionsRetrieved')).toBe(true);
          expect(nodeCollection.models[1].get('csuiLazyActionsRetrieved')).toBe(undefined);
        });
      nodeCollection.models[1].nonPromotedActionCommands = ['copy'];
      nodeCollection.models[1]._requestsNonPromotedRestActions();
      nodeCollection.models[1].nonPromotedActionCommands = ['move'];
      nodeCollection.models[1]._requestsNonPromotedRestActions()
        .done(function () {
          expect(nodeCollection.models[1].actions.length).toBe(2);
          done();
        });
    });
  });
});
