/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'require', 'nuc/lib/underscore', 'nuc/lib/jquery'
], function (module, require, _, $) {
  'use strict';

  describe('Extension Loader', function () {
    if (!window.require) {
      return it('Modules cannot be unloaded in the release mode.');
    }

    function requireTestModule() {
      var deferred = $.Deferred();
      require(['csui-ext!extensible'], deferred.resolve, deferred.reject);
      return deferred.promise();
    }

    afterEach(function () {
      window.csui.requirejs.s.contexts._.config.config.extensible = {};
      window.csui.requirejs.undef('csui-ext');
      window.csui.requirejs.undef('csui-ext!extensible');
      window.csui.requirejs.config({
        config: {
          'csui-ext': {
            ignoreRequireErrors: false,
            modulePrefixesToRetry: [
              'nuc', 'csui', 'classifications', 'esoc', 'wiki', 'workflow', 'webreports'
            ]
          }
        }
      });
    });

    it('returns nothing with no configuration', function (done) {
      requireTestModule().done(function (extensible) {
        expect(extensible).toBeUndefined();
        done();
      }); 
    });

    it('returns nothing with no extensions', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            other: {}
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(extensible).toBeUndefined();
        done();
      }); 
    });

    it('returns nothing with empty extension array', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: []
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(0);
        done();
      }); 
    });

    it('returns nothing with empty extension object', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: {}
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(0);
        done();
      }); 
    });

    it('loads single extension module from array', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: ['nuc/lib/underscore']
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(1);
        expect(extensible[0]).toBe(_);
        done();
      }); 
    });

    it('loads two extension modules from array', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: ['nuc/lib/underscore', 'nuc/lib/jquery']
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(2);
        expect(extensible[0]).toBe(_);
        expect(extensible[1]).toBe($);
        done();
      }); 
    });

    it('loads single extension module from object', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: {
              test: ['nuc/lib/underscore']
            }
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(1);
        expect(extensible[0]).toBe(_);
        done();
      }); 
    });

    it('loads two extension modules from object', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: {
              test: ['nuc/lib/underscore', 'nuc/lib/jquery']
            }
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(2);
        expect(extensible[0]).toBe(_);
        expect(extensible[1]).toBe($);
        done();
      }); 
    });

    it('loads two extension modules from two objects', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: {
              test1: ['nuc/lib/underscore'],
              test2: ['nuc/lib/jquery']
            }
          }
        }
      });
      requireTestModule().done(function (extensible) {
        expect(_.isArray(extensible)).toBeTruthy();
        expect(extensible.length).toEqual(2);
        expect(extensible[0]).toBe(_);
        expect(extensible[1]).toBe($);
        done();
      }); 
    });

    it('fails with an invalid extension module by default', function (done) {
      window.csui.requirejs.config({
        config: {
          extensible: {
            extensions: ['invalid/test']
          }
        }
      });
      requireTestModule().fail(done); 
    });

    it('loads extension modules from both mapped original and new module names', function (done) {
      window.csui.requirejs.config({
        config: {
          'csui/lib/test/mapped.module': {
            extensions: {
              test1: ['nuc/lib/underscore']
            }
          },
          'nuc/lib/test/mapped.module': {
            extensions: {
              test2: ['nuc/lib/jquery']
            }
          }
        }
      });
      require(['csui-ext!nuc/lib/test/mapped.module'], function (extensions) {
        expect(_.isArray(extensions)).toBeTruthy();
        expect(extensions.length).toEqual(2);
        expect(extensions[0] !== extensions[1]).toBeTruthy();
        expect(extensions[0] === _ || extensions[0] === $).toBeTruthy();
        expect(extensions[1] === _ || extensions[1] === $).toBeTruthy();
        done();
      });
    });

    describe('if module loading errors are disabled', function () {
      beforeEach(function () {
        window.csui.requirejs.config({
          config: {
            'csui-ext': {
              ignoreRequireErrors: true
            }
          }
        });
        window.csui.requirejs.undef('csui-ext');
        define('valid/test', function () {
          return true;
        });
      });

      afterEach(function () {
        window.csui.requirejs.config({
          config: {
            'csui-ext': {
              ignoreRequireErrors: false,
              modulePrefixesToRetry: ['csui']
            }
          }
        });
        window.csui.requirejs.undef('csui-ext');
        window.csui.requirejs.undef('valid/test');
      });

      it('returns nothing with an invalid extension module', function (done) {
        window.csui.requirejs.config({
          config: {
            extensible: {
              extensions: ['invalid/test']
            }
          }
        });
        requireTestModule().done(function (extensible) {
          expect(_.isArray(extensible)).toBeTruthy();
          expect(extensible.length).toEqual(0);
          done();
        });
      });

      it('returns only csui modules with valid and invalid extensions by default', function (done) {
        window.csui.requirejs.config({
          config: {
            extensible: {
              extensions: ['nuc/lib/underscore', 'valid/test', 'invalid/test']
            }
          }
        });
        requireTestModule().done(function (extensible) {
          expect(_.isArray(extensible)).toBeTruthy();
          expect(extensible.length).toEqual(1);
          expect(extensible[0]).toBe(_);
          done();
        });
      });

      it('returns configured retriable modules with valid and invalid extensions', function (done) {
        window.csui.requirejs.config({
          config: {
            'csui-ext': {
              modulePrefixesToRetry: ['nuc', 'csui', 'valid']
            },
            extensible: {
              extensions: ['nuc/lib/underscore', 'invalid/test', 'valid/test']
            }
          }
        });
        requireTestModule().done(function (extensible) {
          expect(_.isArray(extensible)).toBeTruthy();
          expect(extensible.length).toEqual(2);
          expect(extensible[0]).toBe(_);
          expect(extensible[1]).toBeTruthy();
          done();
        });
      });
    });
  });
});
