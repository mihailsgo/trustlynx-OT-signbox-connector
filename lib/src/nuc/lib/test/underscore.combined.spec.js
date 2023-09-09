/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/lib/underscore.string', 'nuc/lib/underscore.deepExtend'
], function (_, str, deepExtend) {
  'use strict';

  describe('depending on underscore, underscore.string and underscore.deepExtend', function () {
    it('loads all modules well', () => {
      expect(_).toBeDefined();
      expect(str).toBeDefined();
      expect(_.str).toBe(str);
      expect(deepExtend).toBeDefined();
      expect(_.deepExtend).toBe(deepExtend);
    });
  });
});
