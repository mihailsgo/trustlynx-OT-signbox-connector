/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/backbone', 'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',
  'nuc/utils/connector', 'nuc/utils/url', './delayed.commandable.mixin.mock.js'
], function (Backbone, ConnectableMixin, DelayedCommandableMixin, Connector, Url, mock) {
  'use strict';

  describe('DelayedCommandableV2Mixin', function () {
    beforeAll(function () {
      this.TestModel = Backbone.Model.extend({
        constructor: function TestModel(attributes, options) {
          this.actions = new Backbone.Collection();
          Backbone.Model.call(this, attributes, options);
          this
            .makeConnectable(options)
            .makeDelayedCommandable(options);
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
      DelayedCommandableMixin.mixin(this.TestModel.prototype);

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
  });
});
