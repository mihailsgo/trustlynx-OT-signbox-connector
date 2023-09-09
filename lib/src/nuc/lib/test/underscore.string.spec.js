/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore.string'], function (string) {
  'use strict';

  // Just try loading the script to test that local define functions
  // do not break RequireJS method detection.
  describe('underscore.string', function () {
    it('can be loaded', () => {
      expect(string).toBeDefined();
    });
  });
});
