/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/perspectives/tabbed/tab.index/tab.index.preferences'
], function (tabIndexPreferences) {
  'use strict';

  describe('TabIndexPreferenceCollection', function () {
    var testPlugin1, testPlugin2, testIndex1, testIndex2, context;

    beforeAll(function () {
      testPlugin1 = new tabIndexPreferences.model({
        getPreferredTabIndex: function (options) {
          expect(options).toBeDefined();
          expect(options.context).toBeDefined();
          return testIndex1;
        }
      });
      testPlugin2 = new tabIndexPreferences.model({
        sequence: 200,
        getPreferredTabIndex: function () {
          return testIndex2;
        }
      });
      tabIndexPreferences.add([testPlugin1, testPlugin2]);
      context = {};
    });

    afterAll(function () {
      tabIndexPreferences.remove([testPlugin1, testPlugin2]);
    });

    it('returns undefined if every plugin returns undefined', function () {
      testIndex1 = testIndex2 = undefined;
      var result = tabIndexPreferences.getPreferredTabIndex({ context: context });
      expect(result).toBeUndefined();
    });

    it('skips plugins returning undefined until a number is returned', function () {
      testIndex1 = undefined;
      testIndex2 = 1;
      var result = tabIndexPreferences.getPreferredTabIndex({ context: context });
      expect(result).toBe(1);
    });

    it('does not treat null as undefined', function () {
      testIndex1 = undefined;
      testIndex2 = null;
      var result = tabIndexPreferences.getPreferredTabIndex({ context: context });
      expect(result).toBe(null);
    });

    it('does not treat zero as undefined', function () {
      testIndex1 = undefined;
      testIndex2 = 0;
      var result = tabIndexPreferences.getPreferredTabIndex({ context: context });
      expect(result).toBe(0);
    });
  });
});
