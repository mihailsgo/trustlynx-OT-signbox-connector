/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

require([
  "module",
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/marionette",
  "csui/lib/handlebars",
  "csui/widgets/nodestable/nodestable.view",
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/page/page.context',
  'csui/models/view.state.model',
  './compound.document.mock.js',
], function (module, $, _, Marionette,Handlebars, NodesTableView,AncestorsCollectionFactory, PageContext, ViewStateModel, mock) {
  mock.enable();
  var config = module.config();
  _.defaults(config, {
    enableGridView: true
  });
  var el = $("#content");
  var nodeIdCustomColumns = 2000;
  var pageSize = 30;

  var context = new PageContext({
    factories: {
      connector: {
        connection: {
          url: '//server/otcs/cs/api/v1',
          supportPath: '/support',
          session: {
            ticket: 'dummy'
          }
        }
      },
      node: {
        attributes: { id: nodeIdCustomColumns }
      }
    }
  });

  context.viewStateModel = new ViewStateModel();

  var options = {
    context: context,
    data: {
      pageSize: pageSize
    }
  };

  var nodesTableView, regionEl, ancestorsCollection;
  nodesTableView = new NodesTableView(options,{
    context: context
  });
  var viewStateModel = context && context.viewStateModel;
  if (viewStateModel) {
    context.viewStateModel.setSessionViewState('selected_nodes', []);
    context.viewStateModel.set(context.viewStateModel.CONSTANTS.STATE, { order_by: 'order_asc', page: '30_0' }, { silent: true });
    context.viewStateModel.set(context.viewStateModel.CONSTANTS.DEFAULT_STATE, {}, { silent: true });
  }
  nodesTableView.render();

  ancestorsCollection = context.getCollection(AncestorsCollectionFactory);
  context.fetch().then(function () {
    regionEl = $('<div></div>').appendTo(document.body);
    new Marionette.Region({
      el: regionEl
    }).show(nodesTableView);
    ancestorsCollection.fetch();
  });
}
);
