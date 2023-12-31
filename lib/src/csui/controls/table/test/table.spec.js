/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/children',
  "csui/controls/table/table.view",
  'csui/controls/table/table.columns',
  'csui/behaviors/default.action/impl/defaultaction',
  './table.mock.data.js',
  'csui/lib/jquery.mockjax',
  '../../../utils/testutils/async.test.utils.js',
  'css!csui/themes/carbonfiber/theme',
  'css!csui/controls/table/impl/table',
  'css!csui/widgets/nodestable/impl/nodestable'
], function ($, _,
    Marionette,
    PageContext,
    ConnectorFactory,
    ChildrenCollectionFactory,
    TableView,
    tableColumns,
    DefaultActionController,
    mock,
    mockjax,
    TestUtils) {
  'use strict';

  describe("TableView", function () {
    var tableViewControl, context, connector, collection, delayedActionsLoaded;

    beforeAll(function (done) {
      TestUtils.restoreEnvironment();
      mockjax.publishHandlers();
      mock.enable();
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
            attributes: {id: 183718}
          }
        }
      });

      connector = context.getObject(ConnectorFactory);
      var defaultActionController = new DefaultActionController();
      var commands           = defaultActionController.commands,
          defaultActionItems = defaultActionController.actionItems;
      collection = context.getCollection(
          ChildrenCollectionFactory, {
            options: {
              commands: defaultActionController.commands,
              defaultActionCommands: defaultActionItems.getAllCommandSignatures(commands),
              delayRestCommands: true
            }
          });

      delayedActionsLoaded = false;
      collection.delayedActions.once('sync', function () {
        delayedActionsLoaded = true;
      });

      context.fetch().done(done);
    });

    afterAll(function () {
      mock.disable();
      TestUtils.cancelAllAsync();
      TestUtils.restoreEnvironment();
    });

    describe("Testing TableView", function () {
      beforeAll(function (done) {
        tableViewControl = new TableView({
          collection: collection,
          tableColumns: tableColumns.deepClone(), // table.view needs columns
          columnsWithSearch: ["name"],
          context: context,
          tableAria: 'MyStuff'
        });

        tableViewControl.once('render', function () {
          if (collection.length && tableViewControl.columns.length) {
            setTimeout(done);
          }
        });

        var el = $('<div style="width: 960px;height: 500px">');
        $(document.body)
            .empty()
            .append(el);

        var target = new Marionette.Region({el: el});
        target.show(tableViewControl);
      });

      afterAll(function () {
        tableViewControl.destroy();
        TestUtils.restoreEnvironment();
      });

      it('can be instantiated', function () {
        expect(tableViewControl instanceof TableView).toBeTruthy();
      });

      function showSearchInput() {
        tableViewControl.triggerMethod('dom:refresh');
        expect(tableViewControl.collection.length).toBeGreaterThan(0);
        expect(tableViewControl.searchBoxes).toBeDefined();
        expect(tableViewControl.searchBoxes.length).toBe(1);
        var sbView = tableViewControl.searchBoxes[0];
        sbView.showSearchInput();

        var searchIconDiv = sbView.$el.find('.csui-table-search-icon');
        var searchInput = sbView.$el.find('input');
        expect(searchInput.length).toBe(1);
        expect(searchIconDiv.length).toBe(1);
        return searchIconDiv;
      }

      function testSearchElementsNotOverflowing() {
        var searchIconDiv = showSearchInput();

        var searchIconDivDomEl = searchIconDiv[0];
        var searchDiv = searchIconDivDomEl.offsetParent;
        var searchInputEl = $(searchDiv).find('input')[0];
        var iconElOffsetRight = searchIconDivDomEl.offsetLeft + searchIconDivDomEl.offsetWidth;
        var searchDivRight = searchDiv.clientLeft + searchDiv.clientWidth;
        expect(searchDivRight).toBeGreaterThan(iconElOffsetRight);
        var inputElOffsetRight = searchInputEl.offsetLeft + searchInputEl.offsetWidth;
        expect(searchDivRight).toBeGreaterThan(inputElOffsetRight);
      }

      function testSearchDivNotOverflowing() {
        var searchIconDiv = showSearchInput();
        var searchIconDivDomEl = searchIconDiv[0];
        var searchDiv = searchIconDivDomEl.parentElement;
        var searchDivOffsetRight = searchDiv.offsetLeft + searchDiv.offsetWidth;
        var searchDivParentOffsetRight = searchDiv.parentElement.offsetLeft +
                                         searchDiv.parentElement.offsetWidth;

        expect(searchDivParentOffsetRight).toBeGreaterThanOrEqual(searchDivOffsetRight);
      }

      it('table tag has the configured aria-label', function() {
        var ariaLabel = tableViewControl.$('table').attr('aria-label');
        expect(ariaLabel).toBe('MyStuff');
      });
      
      it("has the right name in the first row", function () {
        var txt = tableViewControl.$('table>tbody>tr:first-child>td:nth-child(3)').text();
        var i = txt.indexOf("Sulzer");
        expect(i > -1).toBeTruthy();
      });

      describe('shows the sorting indicator', function () {
        it("(ascending) in the name column", function () {
          var cols = tableViewControl.$('table>thead>tr:first-child>th');
          expect($(cols[2]).hasClass('sorting_asc')).toBeTruthy();
        });

        it("(descending) in the name column after clicking it",
            function (done) {
              var cols = tableViewControl.$('table>thead>tr:first-child>th');
              var e = $(cols[2]).find('span.csui-sort-arrow');
              var iconSpan = $(e[0]);
              expect(e.length).toBe(1);
              var hasSortingArrowUpClass = iconSpan.hasClass('icon-sortArrowUp');
              expect(hasSortingArrowUpClass).toBeTruthy();
              $(cols[2]).trigger('click');
              TestUtils.asyncElement(
                "th[data-csui-attribute='name']",
                "span.icon-sortArrowDown").done(
                function ($el) {
                  expect($el.is(':visible')).toBeTruthy();
                  done();
                });
            }
        );

        it('sorting type by pressing enter', function (done) {
          var e = $.Event("keydown", {keyCode: 39});
          $("th[data-csui-attribute='_select']").trigger(e);
          var ev = $.Event("keydown", {keyCode: 13});
          $("th[data-csui-attribute='type']").trigger(ev);
          TestUtils.asyncElement(
              "th[data-csui-attribute='type']",
              "span.icon-sortArrowUp").done(
              function ($el) {
                expect($el.is(':visible')).toBeTruthy();
                done();
              });
        });

        it('focus shifts from tablebody to tableheader on pressing tab + shift', function () {
          var e = $.Event("keydown", {keyCode: 9, shiftKey: true});
          $("tbody > tr:first").trigger(e);
          expect(tableViewControl.accFocusedState.focusView).toBe('tableHeader');
        });

        it('focus shifts from tableheader to tablebody on pressing tab', function () {
          var e = $.Event("keydown", {keyCode: 9});
          $("th[data-csui-attribute='_select']").trigger(e);
          expect(tableViewControl.accFocusedState.focusView).toBe('tableBody');
        });

      });

      describe('with inline edit forms', function () {
        it("displays no inline edit form when the edit icon was not clicked", function () {
          var cellEditorEl = tableViewControl.$('div.csui-td-content-edit');
          expect(cellEditorEl.length).toBe(0);
        });

        it("displays the inline edit form", function (done) {
          var node;
          var collection = context.getCollection(ChildrenCollectionFactory);
          expect(collection.length).toBeGreaterThan(0);
          node = collection.at(0);
          tableViewControl.startInlineFormForEdit(node);

          var inlineFormEl = tableViewControl.$('table>tbody>tr>td .csui-inlineform-group');
          expect(inlineFormEl.length).toBe(1);
          var inputEl = $(inlineFormEl[0]).find('input');
          expect(inputEl.length).toBe(1);
          var val = $(inputEl[0]).val();
          expect(val).toMatch(node.get('name'));
          var saveButtonEl = $(inlineFormEl[0]).find('button.csui-btn-save');
          expect(saveButtonEl.length).toBe(1);
          var cancelButtonEl = $(inlineFormEl[0]).find('button.csui-btn-cancel');
          expect(cancelButtonEl.length).toBe(1);
          done();
        });

        it("re-renders without inline edit form when the edit was canceled", function (done) {
          var collection = context.getCollection(ChildrenCollectionFactory);
          expect(collection.length).toBeGreaterThan(0);
          var node = collection.at(0);
          tableViewControl.startInlineFormForEdit(node);

          var inlineFormEl = tableViewControl.$('table>tbody>tr>td .csui-inlineform-group');
          expect(inlineFormEl.length).toBe(1);
          var inputEl = $(inlineFormEl[0]).find('input');
          expect(inputEl.length).toBe(1);
          var saveButtonEl = $(inlineFormEl[0]).find('button.csui-btn-save');
          expect(saveButtonEl.length).toBe(1);
          var cancelButtonEl = $(inlineFormEl[0]).find('button.csui-btn-cancel');
          expect(cancelButtonEl.length).toBe(1);
          cancelButtonEl.trigger('click');
          inlineFormEl = tableViewControl.$('table>tbody>tr>td>div.csui-inlineform-group');
          expect(inlineFormEl.length).toBe(0);
          done();
        });
        it("when renaming, does not close the inline form before the node gets updated",
          function (done) {
            var node;
            expect(tableViewControl.collection.length).toBeGreaterThan(0);
            node = tableViewControl.collection.first();
            tableViewControl.startInlineFormForEdit(node);
            TestUtils.asyncElement('tr.csui-has-details-row:first-child',
              '.csui-inlineform form').done(function (inlineFormEl) {
                expect(inlineFormEl.length).toEqual(1);
                var inputEl = inlineFormEl.find('input');
                inputEl.val('Sulzer edited');
                inlineFormEl.trigger('submit');
              });
            done();
          });
        it('verify renamed item in the list', function (done) {
          TestUtils.asyncElement("tr.csui-has-details-row:first-child",
            ".csui-table-cell-name .csui-table-cell-name-div").done(
              function (el) {
                expect(el.find('.csui-table-cell-name-link-text').text().trim()).toBe(
                  'Sulzer edited');
              });
          done();
        });
      });

      describe('has the filtering input field', function () {
        it('completely visible when name filter is opened', function () {
          testSearchDivNotOverflowing();
        });

        it('and magnifier glass completely visible when name filter is opened',
            function () {
              testSearchElementsNotOverflowing();
            }
        );

        it('completely visible when name filter is opened' +
           ' even on a small browser width', function () {
          tableViewControl.$el.width('600px');
          testSearchDivNotOverflowing();
        });

        it('and magnifier glass are completely visible when name filter is opened' +
           ' even on a small browser width', function () {
          tableViewControl.$el.width('510px');
          testSearchElementsNotOverflowing();
        });
      });

      describe('multiple-row (default)', function () {
        it('shows the select-all checkbox', function () {
          var checkbox = tableViewControl.$('thead .csui-table-cell-_select button');
          expect(checkbox.length).toEqual(1);
        });
      });

    });

    describe('with the selection mode', function () {

      describe('multiple-row without the select-all checkbox', function () {
        beforeAll(function () {
          this.tableView = new TableView({
            selectRows: 'multiple',
            selectAllColumnHeader: false,
            collection: collection,
            tableColumns: tableColumns.deepClone(),
            context: context
          });

          this.tableParent = $('<div style="width: 960px;height: 500px">');
          $(document.body).append(this.tableParent);

          this.tableRegion = new Marionette.Region({el: this.tableParent});
          this.tableRegion.show(this.tableView);
        });

        afterAll(function () {
          this.tableRegion.empty();
          this.tableParent.remove();
          TestUtils.restoreEnvironment();
        });

        it('hides the select-all checkbox', function (done) {

          var self = this;
          TestUtils.asyncElement(
              "body", "table").done(
              function ($el) {
                var checkbox = self.tableView.$('thead .csui-table-cell-_select button');
                expect(checkbox.length).toEqual(0);
                done();
              });

        });

        it('allows selecting a row', function () {
          var checkbox = this.tableView.$('tbody .csui-table-cell-_select button')[0];
          click(checkbox);
          expect(this.tableView.selectedChildren.length).toEqual(1);
        });

        it('allows unselecting a row', function () {
          var checkbox = this.tableView.$('tbody .csui-table-cell-_select button')[0];
          click(checkbox);
          expect(this.tableView.selectedChildren.length).toEqual(0);
        });
      });

      describe('single-row', function () {
        beforeAll(function () {
          this.tableView = new TableView({
            selectRows: 'single',
            collection: collection,
            tableColumns: tableColumns.deepClone(),
            context: context
          });

          this.tableParent = $('<div style="width: 960px;height: 500px">');
          $(document.body).append(this.tableParent);
          this.tableRegion = new Marionette.Region({el: this.tableParent});
          this.tableRegion.show(this.tableView);
        });

        afterAll(function () {
          this.tableRegion.empty();
          this.tableParent.remove();
          TestUtils.restoreEnvironment();
        });

        it('hides the select-all checkbox', function (done) {
          var self = this;
          TestUtils.asyncElement(
              "body",
              "table").done(
              function ($el) {
                var checkbox = self.tableView.$('thead .csui-table-cell-_select button');
                expect(checkbox.length).toEqual(0);
                done();
              });

        });

        it('allows selecting a row', function () {
          var checkbox = this.tableView.$('tbody .csui-table-cell-_select button')[0];
          click(checkbox);
          expect(this.tableView.selectedChildren.length).toEqual(1);
        });
      });

      describe('none', function () {
        beforeAll(function () {
          this.tableView = new TableView({
            filterBy: {'name': 'gs'},
            selectRows: 'none',
            collection: collection,
            tableColumns: tableColumns.deepClone(),
            context: context
          });

          this.tableParent = $('<div style="width: 960px;height: 500px">');
          $(document.body).append(this.tableParent);

          this.tableRegion = new Marionette.Region({el: this.tableParent});
          this.tableRegion.show(this.tableView);
        });

        afterAll(function () {
          this.tableRegion.empty();
          this.tableParent.remove();
          TestUtils.restoreEnvironment();
        });

        it('hides the whole selection column', function () {
          var checkbox = this.tableView.$('.csui-table-cell-_select');
          expect(checkbox.length).toEqual(0);
        });

        it('clicking on toggle details show/hide table details rows', function (done) {
          $("th[data-csui-attribute='_toggledetails'] .csui-control.csui-disclosure").click();
          TestUtils.asyncElement(
              "tbody",
              "tr.csui-details-row").done(
              function ($el) {
                expect($el.is(':visible')).toBeTruthy();
                $("th[data-csui-attribute='_toggledetails'] .csui-control.csui-disclosure").click();
                TestUtils.asyncElement(
                    "tbody",
                    "tr.csui-details-row").done(
                    function ($el) {
                      expect($el.is(':visible')).toBeFalsy();
                      done();
                    });
              });
        });

      });
    });

    describe('when columns change', function () {
      describe('by updating the column collection', function () {
        beforeAll(function () {
          this.tableView = new TableView({
            collection: collection,
            tableColumns: tableColumns.deepClone(),
            context: context
          });

          this.tableParent = $('<div style="width: 960px;height: 500px">');
          $(document.body).append(this.tableParent);

          this.tableRegion = new Marionette.Region({ el: this.tableParent });
          this.tableRegion.show(this.tableView);
        });

        afterAll(function () {
          this.tableRegion.empty();
          this.tableParent.remove();
        });

        it('the table gets re-rendered', function (done) {
          var columnsUpdated;
          this.tableView
            .on('columnDefinitionsBuilt', function () {
              columnsUpdated = true;
            })
            .on('render', function () {
              expect(columnsUpdated).toBeTruthy();
              done();
            });
          this.tableView.columns.remove(
            this.tableView.columns.findWhere({ column_key: 'create_date' }));
        });
      });
    });
  });
});

function click(element) {
  var event = new MouseEvent('click', {
    isTrusted: true,
    bubbles: true,
    cancelable: true,
    view: window
  });
  return element.dispatchEvent(event);
}
