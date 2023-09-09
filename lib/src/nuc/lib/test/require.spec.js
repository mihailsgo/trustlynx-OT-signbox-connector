/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/test/mapped.module'], function (mappedModule) {
  'use strict';

  describe('RequireJS', function () {
    describe('configuration for mapped module names', function () {
      it('returns module configuration from the primary module name', function () {
        expect(mappedModule.primary).toBeTruthy();
      });

      it('returns module configuration from the alternative module name', function () {
        expect(mappedModule.alternative).toBeTruthy();
      });
    });

    describe('modules remapped for compatibility', function () {
      // simulate renaming of csui/original to nuc/moved
      // simulate remapping of nuc/moved to custom/adapted
      var originalMap, originalRename, originalBackwardRename,
          originalBackwardStarMap, originalRenameMerged;

      // remember cached backward maps and reset them
      beforeAll(function () {
        var config = csui.require.s.contexts._.config;
        originalMap = config.map;
        originalRename = config.rename;
        originalBackwardRename = config.backwardRename;
        originalBackwardStarMap = config.backwardStarMap;
        originalRenameMerged = config.renameMerged;
        delete config.map;
        delete config.rename;
        delete config.backwardRename;
        delete config.backwardStarMap;
        delete config.renameMerged;
      });

      // declare compatibility module renaming permanently
      // set module configuration for all three test modules
      beforeAll(function () {
        csui.require.config({
          rename: { 'csui/original': 'nuc/moved' },
          config: {
            'csui/original': { original: true },
            'nuc/moved': { moved: true },
            'custom/adapted': { adapted: true }
          }
        });
      });

      // redefine testing modules
      beforeEach(function () {
        csui.require.undef('csui/original');
        csui.define('csui/original', ['module'], function (module) {
          return { value: 'csui', config: module.config() };
        });
        csui.require.undef('nuc/moved');
        csui.define('nuc/moved', ['module'], function (module) {
          return { value: 'nuc', config: module.config() };
        });
        csui.require.undef('custom/adapted');
        csui.define('custom/adapted', ['module'], function (module) {
          return { value: 'custom', config: module.config() };
        });
      });

      // clear renaming and remapping
      beforeEach(function () {
        var config = csui.require.s.contexts._.config;
        delete config.map;
        delete config.backwardRename;
        delete config.backwardStarMap;
        delete config.renameMerged;
      });

      afterAll(function () {
        var config = csui.require.s.contexts._.config;
        config.map = originalMap;
        config.rename = originalRename;
        config.backwardRename = originalBackwardRename;
        config.backwardStarMap = originalBackwardStarMap;
        config.renameMerged = originalRenameMerged;
      });

      function expectCompleteConfig(config, adapted) {
        expect(config.original).toBeTruthy();
        expect(config.moved).toBeTruthy();
        if (adapted) {
          expect(config.adapted).toBeTruthy();
        }
      }

      // rename: csui/original -> nuc/moved
      it('loads the new module instead of the original one', function (done) {
        // renaming behaves just like remapping
        csui.require(['csui/original', 'nuc/moved'], function (exported1, exported2) {
          expect(exported1.value).toBe('nuc');
          expect(exported2.value).toBe('nuc');
          expectCompleteConfig(exported1.config, false);
          expectCompleteConfig(exported2.config, false);
          done();
        });
      });

      // rename: csui/original -> nuc/moved, adapt: csui/original -> custom/adapted
      it('loads the adapted module instead of the original one', function (done) {
        // remapping the original module name will affect the new module name too
        csui.require.config({
          map: { '*': { 'csui/original': 'custom/adapted' } }
        });
        csui.require(['csui/original', 'nuc/moved'], function (exported1, exported2) {
          expect(exported1.value).toBe('custom');
          expect(exported2.value).toBe('custom');
          expectCompleteConfig(exported1.config, true);
          expectCompleteConfig(exported2.config, true);
          done();
        });
      });

      // rename: csui/original -> nuc/moved, adapt: nuc/moved -> custom/adapted
      it('loads the adapted module instead of the new one', function (done) {
        // remapping the new module name will affect the original module name too
        csui.require.config({
          map: { '*': { 'nuc/moved': 'custom/adapted' } }
        });
        csui.require(['csui/original', 'nuc/moved'], function (exported1, exported2) {
          expect(exported1.value).toBe('custom');
          expect(exported2.value).toBe('custom');
          expectCompleteConfig(exported1.config, true);
          expectCompleteConfig(exported2.config, true);
          done();
        });
      });
    });
  });
});
