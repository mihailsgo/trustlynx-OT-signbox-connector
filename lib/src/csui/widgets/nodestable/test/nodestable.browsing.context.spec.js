/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/marionette',
  'csui/widgets/nodestable/nodestable.view',
  'csui/utils/contexts/browsing/browsing.context', './nodestable.mock.js'
], function ($, Marionette, NodesTableView, BrowsingContext, mock) {
  'use strict';

  describe('NodesTableView in the browsing context', function () {
    var context, nextNode, nodesTableView, region;
    var renders = {};
    var events = {};

    beforeAll(function () {
      mock.enable();
    });
    beforeAll(createContext);
    beforeAll(createWidget);
    beforeAll(watchForRendering.bind(null, 'create'));
    beforeAll(watchForChanges.bind(null, 'create'));
    beforeAll(fetchData);
    beforeAll(waitForQuiet);
    beforeAll(stopWatchingForRendering.bind(null, 'create'));
    beforeAll(watchForRendering.bind(null, 'change'));
    beforeAll(watchForChanges.bind(null, 'change'));
    beforeAll(changeContainer);

    afterAll(waitForQuiet);
    afterAll(function () {
      region.empty();
    });
    afterAll(mock.disable);

    it('renders the table just once during data loading', function () {
      expect(renders.create.count).toEqual(1);
    });

    it('renders the table just once during a drill-down', function () {
      expect(renders.change.count).toEqual(1);
    });

    it('columns and children are reset after the context is requested when the first data are fetched', function () {
      expect(events.create.length).toEqual(4);
      expect(events.create[0]).toEqual('start');
      expect(events.create[3]).toEqual('end');
    });

    it('children are reset after the context is requested during a drill-down', function () {
      expect(events.change.length).toEqual(3);
      expect(events.change[0]).toEqual('start');
      expect(events.change[1]).toEqual('children');
      expect(events.change[2]).toEqual('end');
    });

    function createContext () {
      context = new BrowsingContext({
        factories: {
          connector: {
            connection: {
              url: '//server/otcs/cs/api/v1',
              supportPath: '/support',
              session: { ticket: 'dummy' }
            }
          }
        }
      });
      nextNode = context.getModel('nextNode');
    }

    function createWidget () {
      nodesTableView = new NodesTableView({ context: context });
      region = new Marionette.Region({ el: 'body' });
      region.show(nodesTableView);
    }

    function fetchData (done) {
      context.once('sync', done);
      nextNode.set('id', 2000);
    }

    function changeContainer (done) {
      context.once('sync', done);
      nextNode.set('id', 2001);
    }

    function waitForQuiet (done) {
      setTimeout(done, 700);
    }

    function watchForRendering (phase) {
      function handler () {
        ++renders[phase].count;
      }
      renders[phase] = {
        count: 0,
        handler: handler
      };
      nodesTableView.tableView.on('render', handler);
    }

    function stopWatchingForRendering (phase) {
      nodesTableView.tableView.off('render', renders[phase].handler);
    }

    function watchForChanges (phase) {
      events[phase] = [];
      context
          .once('request', function () {
            events[phase].push('start');
          })
          .once('sync', function () {
            events[phase].push('end');
          });
      nodesTableView.columns.once('reset', function () {
        events[phase].push('columns');
      });
      nodesTableView.collection.once('reset', function () {
        events[phase].push('children');
      });
    }
  });
});
