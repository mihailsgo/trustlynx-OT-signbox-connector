/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data'
], function (mergeExtraData) {
  'use strict';

  describe('mergeExtraData', function () {
    it('handles no input', function () {
      var merged = mergeExtraData();
      expect(typeof merged).toBe('object');
    });

    it('handles undefined input', function () {
      var merged = mergeExtraData(undefined, undefined);
      expect(typeof merged).toBe('object');
    });

    it('handles objects with distinct keys', function () {
      var merged = mergeExtraData([
        { properties: [] }, { columns: [] }
      ]);
      expect(typeof merged).toBe('object');
      expect(merged.properties).toBeTruthy();
      expect(Array.isArray(merged.properties)).toBeTruthy();
      expect(merged.properties.length).toBe(0);
      expect(merged.columns).toBeTruthy();
      expect(Array.isArray(merged.columns)).toBeTruthy();
      expect(merged.columns.length).toBe(0);
    });

    it('handles objects with the same keys', function () {
      var merged = mergeExtraData([
        { properties: ['id'] }, { properties: ['name'] }
      ]);
      expect(typeof merged).toBe('object');
      expect(merged.properties).toBeTruthy();
      expect(Array.isArray(merged.properties)).toBeTruthy();
      expect(merged.properties.length).toBe(2);
      expect(merged.properties.indexOf('id')).toBeGreaterThanOrEqual(0);
      expect(merged.properties.indexOf('name')).toBeGreaterThanOrEqual(0);
    });

    it('handles multiple objects as arguments', function () {
      var merged = mergeExtraData({ properties: [] }, { columns: [] });
      expect(typeof merged).toBe('object');
      expect(merged.properties).toBeTruthy();
      expect(Array.isArray(merged.properties)).toBeTruthy();
      expect(merged.properties.length).toBe(0);
      expect(merged.columns).toBeTruthy();
      expect(Array.isArray(merged.columns)).toBeTruthy();
      expect(merged.columns.length).toBe(0);
    });
  });
});
