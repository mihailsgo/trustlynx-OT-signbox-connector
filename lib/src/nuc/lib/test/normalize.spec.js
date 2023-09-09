/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['../normalize'], function (normalize) {
  'use strict';

  describe('normalize', function () {
    describe('convertURIBase', function () {
      it('appends a path to the project root', function () {
        expect(normalize.convertURIBase(
          'a.svg', '/1/2/3.css', '/1')).toBe('1/2/a.svg');
      });

      it('cuts the parent item from the target path', function () {
        expect(normalize.convertURIBase(
          '../a.svg', '/1/2/3.css', '/1')).toBe('1/a.svg');
      });

      it('does not squash all leading ".." to one', function () {
        expect(normalize.convertURIBase(
          '../../a.svg', '/1/2/3.css', '/1')).toBe('a.svg');
      });

      it('removes unnecessary ".." in the middle of the path', function () {
        expect(normalize.convertURIBase(
          '../../a/../b.svg', '/1/2/3.css', '/1')).toBe('b.svg');
      });

      it('removes unnecessary "../.." in the middle of the path', function () {
        expect(normalize.convertURIBase(
          '../../a/b/../../c.svg', '/1/2/3.css', '/1')).toBe('c.svg');
      });
    });
  });
});
