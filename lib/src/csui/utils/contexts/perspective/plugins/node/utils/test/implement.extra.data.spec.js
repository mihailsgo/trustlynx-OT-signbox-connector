/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data'
], function (implementExtraData) {
  'use strict';

  function createTestSuite(method) {
    describe(method, function () {
      it('handles no extension', function () {
        var implemented = implementExtraData();
        var result = implemented[method]();
        expect(typeof result).toBe('object');
      });

      it('handles empty extension array', function () {
        var implemented = implementExtraData([]);
        var result = implemented[method]();
        expect(typeof result).toBe('object');
      });

      it('handles an extension array', function () {
        var implemented = implementExtraData([
          {
            [method]: function () {
              return { properties: ['id'] };
            }
          },
          {
            [method]: function () {
              return {
                properties: ['name'],
                columns: []
              };
            }
          }
        ]);
        var result = implemented[method]();
        expect(typeof result).toBe('object');
        expect(result.properties).toBeTruthy();
        expect(Array.isArray(result.properties)).toBeTruthy();
        expect(result.properties.length).toBe(2);
        expect(result.properties.indexOf('id')).toBeGreaterThanOrEqual(0);
        expect(result.properties.indexOf('name')).toBeGreaterThanOrEqual(0);
        expect(result.columns).toBeTruthy();
        expect(Array.isArray(result.columns)).toBeTruthy();
        expect(result.columns.length).toBe(0);
      });
    });
  }

  describe('implementExtraData', function () {
    it('implements expected functions', function () {
      var implemented = implementExtraData();
      expect(typeof implemented).toBe('object');
      expect(typeof implemented.getModelFields).toBe('function');
      expect(typeof implemented.getModelExpand).toBe('function');
    });

    createTestSuite('getModelFields');
    createTestSuite('getModelExpand');
  });
});
