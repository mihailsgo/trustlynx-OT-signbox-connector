/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(function () {
  'use strict';
  describe('Test regex used in sprite.js to generate spritePath', function () {
        var regex = /(^[^?]+)(\?.*)?$/;

        var replaceWith = '$1/REMAINING$2';

        it('no ?', function () {
          var url = '../../src';
          var replaced = url.replace(regex, replaceWith);
          expect(replaced).toBe('../../src/REMAINING');
        });

        it('missing cache busting', function () {
          var url = '../../src?';
          var replaced = url.replace(regex, replaceWith);
          expect(replaced).toBe('../../src/REMAINING?');
        });

        it('cache busting parameter exists', function () {
          var url = '../../src?v=12345.876.982';
          var replaced = url.replace(regex, replaceWith);
          expect(replaced).toBe('../../src/REMAINING?v=12345.876.982');
        });

        it('corrupt cache busting parameter with extra ?', function () {
          var url = '../../src?v=12345.876?982';
          var replaced = url.replace(regex, replaceWith);
          expect(replaced).toBe('../../src/REMAINING?v=12345.876?982');
        });

      }
  );
});