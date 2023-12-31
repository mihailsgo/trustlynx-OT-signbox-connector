/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/children',
  'csui/models/node/node.model',
  'csui/models/nodes',
  'csui/controls/table/table.view',
  'csui/controls/progressblocker/blocker',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/controls/table/inlineforms/inlineform.factory',
  'csui/controls/table/table.columns',
  'csui/utils/commands',
  './inlineform.mock.js',
  'csui/lib/jquery.mockjax',
  'css!csui/widgets/nodestable/impl/nodestable'
], function (module, $, _,
    Marionette,
    PageContext,
    ConnectorFactory,
    ChildrenCollectionFactory,
    NodeModel,
    NodeCollection,
    TableView,
    BlockingView,
    DefaultActionController,
    inlineFormViewFactory,
    tableColumns,
    commands,
    mock, mockjax) {
  'use strict';

  describe('Inline Form: Add Collection', function () {

    var tableViewControl, context, connector;

    beforeEach(function () {
      mockjax.publishHandlers();
      mock.enable();
    });

    afterEach(function () {
      mock.disable();
    });

    beforeEach(function (done) {

      $('body').empty();
      context = new PageContext({
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
            attributes: {id: 205659}
          }
        }
      });
      var el = $('<div style="width: 1300px;height: 900px">', {id: 'target'});

      connector = context.getObject(ConnectorFactory);
      var defaultActionController = new DefaultActionController();
      var commands           = defaultActionController.commands,
          defaultActionItems = defaultActionController.actionItems;
      var collection = context.getCollection(
          ChildrenCollectionFactory, {
            options: {
              commands: defaultActionController.commands,
              defaultActionCommands: defaultActionItems.getAllCommandSignatures(commands),
              delayRestCommands: true
            }
          });

      var options = {
        el: el,
        collection: collection,
        tableColumns: tableColumns.deepClone(), // table.view needs columns
        columnsWithSearch: ["name"],
        context: context
      };

      tableViewControl = new TableView(options);
      tableViewControl.render();
      tableViewControl.on("render", function () {
        if (options.collection && options.collection.length > 0) {
          setTimeout(done, 0);
        }
      });
      $('body').append(el);

      tableViewControl.triggerMethod('show');

      context.fetch().then(function () {
      });
    });

    it('collection is shown in table', function (done) {
      var subType = 298;  // Collection
      var inlineFormView = inlineFormViewFactory.getInlineFormView(subType);
      var newNode = new NodeModel({
        "type": subType,
        "type_name": "Collection",
        "container": true,
        "name": "" // start with empty name
      }, {connector: connector});

      expect(inlineFormView).toBeDefined();
      if (inlineFormView) {
        tableViewControl.startCreateNewModel(newNode, inlineFormView);

        var inlineFormDivInTable$El = tableViewControl.$el.find(
           'tbody > tr > td .csui-inlineform-group');
        expect(inlineFormDivInTable$El.length).toBe(1);

        var inputInInlineForm$El = inlineFormDivInTable$El.find('input.csui-inlineform-type-name');
        expect(inputInInlineForm$El.length).toBe(1);

        var saveButtonInInlineForm$El = inlineFormDivInTable$El.find('button.csui-btn-save');
        expect(saveButtonInInlineForm$El.length).toBe(1);

        var cancelButtonInInlineForm$El = inlineFormDivInTable$El.find('button.csui-btn-cancel');
        expect(cancelButtonInInlineForm$El.length).toBe(1);

        tableViewControl.cancelAnyExistingInlineForm();
        tableViewControl.destroy();
        done();
      }
    });

    it('collection closed on Add when a name is specified', function (done) {
      var subType = 298;  // collection
      var inlineFormView = inlineFormViewFactory.getInlineFormView(subType);
      var newNode = new NodeModel({
        "type": subType,
        "type_name": "Collection",
        "container": true,
        "name": "" // start with empty name
      }, {connector: connector});

      newNode.listenTo(newNode, 'sync', function (model, resp, options) {
        tableViewControl.listenTo(tableViewControl, 'tableBodyRendered',
            function (model, resp, options) {
              inlineFormDivInTable$El = tableViewControl.$el.find(
                  'tbody > tr > td .csui-inlineform-group');
              expect(inlineFormDivInTable$El.length).toBe(0);

              tableViewControl.destroy();
              done();
            });
      });

      expect(inlineFormView).toBeDefined();
      if (inlineFormView) {
        tableViewControl.startCreateNewModel(newNode, inlineFormView);

        var inlineFormDivInTable$El = tableViewControl.$el.find(
            'tbody > tr > td .csui-inlineform-group');
        expect(inlineFormDivInTable$El.length).toBe(1);

        var inputInInlineForm$El = inlineFormDivInTable$El.find('input.csui-inlineform-type-name');
        expect(inputInInlineForm$El.length).toBe(1);

        var input$El = inputInInlineForm$El.first();
        input$El.trigger('keyup');
        input$El.val('a new Collection');
        input$El.trigger('keyup');
        input$El.trigger('blur');

        var saveButtonInInlineForm$El = inlineFormDivInTable$El.find('button.csui-btn-save');
        expect(saveButtonInInlineForm$El.length).toBe(1);

        var saveButton = $(saveButtonInInlineForm$El[0]);
        saveButton.prop('disabled', false);
        saveButton.trigger('click');

      }
    });

    it('collection does not close on Add when no name is specified', function (done) {
      var subType = 298;  // Collection
      var inlineFormView = inlineFormViewFactory.getInlineFormView(subType);
      var newNode = new NodeModel({
        "type": subType,
        "type_name": "Collection",
        "container": true,
        "name": "" // start with empty name
      }, {connector: connector});

      expect(inlineFormView).toBeDefined();
      if (inlineFormView) {
        tableViewControl.startCreateNewModel(newNode, inlineFormView);

        var inlineFormDivInTable$El = tableViewControl.$el.find(
            'tbody > tr > td .csui-inlineform-group');
        expect(inlineFormDivInTable$El.length).toBe(1);

        var saveButtonInInlineForm$El = inlineFormDivInTable$El.find('button.csui-btn-save');
        expect(saveButtonInInlineForm$El.length).toBe(1);

        var saveButton = $(saveButtonInInlineForm$El[0]);
        saveButton.trigger('click');

        setTimeout(function () {
          inlineFormDivInTable$El = tableViewControl.$el.find('tbody > tr > td .csui-inlineform-group');
          expect(inlineFormDivInTable$El.length).toBe(1);

          tableViewControl.cancelAnyExistingInlineForm();
          tableViewControl.destroy();
          done();

        }, 1000);
      }
    });

  });

});