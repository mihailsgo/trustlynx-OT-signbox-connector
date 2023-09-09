/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/perspectives/grid/grid.perspective.view',
  'json!./two-rows.layout.json'
], function (_, GridPerspectiveView, twoRowsLayout) {
  'use strict';

  describe('GridPerspectiveView', function () {
    describe('given empty configuration', function () {
      var perspectiveView;

      beforeAll(function () {
        perspectiveView = new GridPerspectiveView();
        perspectiveView.render();
      });

      it('assigns right classes', function () {
        var className = perspectiveView.$el.attr('class');
        expect(className).toBeDefined();
        var classes = className.split(' ');
        expect(classes).toContain('cs-perspective');
        expect(classes).toContain('cs-grid-perspective');
      });

      it('renders empty output', function () {
        expect(perspectiveView.$el.html()).toBe('');
      });
    });

    describe('given a configuration with nested rows', function () {
      var perspectiveView;

      beforeEach(function () {
        perspectiveView = new GridPerspectiveView({ rows: twoRowsLayout.rows });
      });

      it('recognizes one outer row', function () {
        var outerRows = perspectiveView.collection;
        expect(outerRows.length).toEqual(1);
      });

      it('recognizes two columns in the outer row', function () {
        var outerRow = perspectiveView.collection.first();
        expect(outerRow.columns).toBeDefined();
        expect(outerRow.columns.length).toEqual(2);
      });

      it('recognizes a widget in the first column', function () {
        var outerRow = perspectiveView.collection.first();
        var firstColumn = outerRow.columns.first();
        expect(firstColumn.get('widget')).toBeDefined();
        expect(firstColumn.rows).toBeUndefined();
      });

      it('recognizes two sub-rows in the second column', function () {
        var outerRow = perspectiveView.collection.first();
        var secondColumn = outerRow.columns.last();
        expect(secondColumn.get('widget')).toBeUndefined();
        expect(secondColumn.rows).toBeDefined();
        expect(secondColumn.rows.length).toEqual(2);
      });

      it('recognizes widgets in the two sub-rows', function () {
        var outerRow = perspectiveView.collection.first();
        var secondColumn = outerRow.columns.at(1);
        var innerRows = secondColumn.rows;
        var topColumn = innerRows.first().columns.first();
        var bottomColumn = innerRows.last().columns.first();
        expect(topColumn.get('widget')).toBeDefined();
        expect(bottomColumn.get('widget')).toBeDefined();
      });
    });
  });
});
