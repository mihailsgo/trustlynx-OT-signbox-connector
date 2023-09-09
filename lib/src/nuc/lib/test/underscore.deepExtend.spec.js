/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore.deepExtend'], function (deepExtend) {
  'use strict';

  // Tests from https://github.com/jalik/js-deep-extend.

  describe('deepExtend(null, null)', () => {
    it('should return null', () => {
        const a = null;
        const b = null;
        expect(deepExtend(a, b)).toBeNull();
    });
  });

  describe('deepExtend(undefined, undefined)', () => {
    it('should return undefined', () => {
        const a = undefined;
        const b = undefined;
        expect(deepExtend(a, b)).toBeUndefined();
    });
  });

  // Objects

  describe('deepExtend(object, null)', () => {
    it('should return an object', () => {
        const a = { a: 1 };
        const b = null;
        expect(deepExtend(a, b)).toEqual(a);
    });
  });

  describe('deepExtend(object, undefined)', () => {
    it('should return an object', () => {
        const a = { a: 1 };
        const b = undefined;
        expect(deepExtend(a, b)).toEqual(a);
    });
  });

  describe('deepExtend(object, object)', () => {
    it('should replace existing attributes', () => {
        const a = { a: 1 };
        const b = { a: 2 };
        expect(deepExtend(a, b)).toEqual(b);
    });
  });

  describe('deepExtend(object, object)', () => {
    it('should merge new attributes', () => {
        const a = { a: 1 };
        const b = { b: 2 };
        const r = { a: 1, b: 2 };
        expect(deepExtend(a, b)).toEqual(r);
    });
  });

  describe('deepExtend(object, object)', () => {
    it('should merge objects recursively', () => {
        const a = { a: { b: 1, c: 3 }, d: 4 };
        const b = { a: { b: 2 } };
        const r = { a: { b: 2, c: 3 }, d: 4 };
        expect(deepExtend(a, b)).toEqual(r);
    });
  });

  // Arrays

  describe('deepExtend(array, array)', () => {
    it('should merge arrays by replacing index value', () => {
        const a = [0, 1];
        const b = [0, 2];
        expect(deepExtend(a, b)).toEqual(b);
    });
  });

  describe('deepExtend(array, array)', () => {
    it('should not ignore null values when merging arrays', () => {
        const a = [0, 1];
        const b = [0, null];
        const r = [0, null];
        expect(deepExtend(a, b)).toEqual(r);
    });
  });

  // Arrays to Object

  describe('deepExtend(object, array)', () => {
    it('should merge arrays into objects', () => {
        const a = {};
        const b = [1];
        const r = { 0: 1 };
        expect(deepExtend(a, b)).toEqual(r);
    });
  });

  describe('deepExtend({}, { __proto__: { polluted: "polluted" } })', () => {
    it('should not pollute prototype', () => {
        const a = {};
        const b = JSON.parse('{"__proto__": {"polluted": "polluted"}}');
        const result = deepExtend(a, b);
        expect(typeof result).toBeTruthy();
        expect(typeof result).toEqual('object');
        expect(Object.keys(result).length).toEqual(0);
        expect({}.polluted).toBeUndefined();
    });
  });
});
