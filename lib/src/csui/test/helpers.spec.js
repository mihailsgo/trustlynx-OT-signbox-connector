/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(function () {
  'use strict';

  describe('Global helpers: csui.*', function () {
    it('getVersion returns the full version number', function () {
      expect(csui.getVersion()).toMatch(/^\d+\.\d+\.\d+\.\d+(?:[-._:0-9]+)?$/);
    });

    it('getExtensionModules returns information about csui', function (done) {
      csui.printExtensionModules();
      csui.getExtensionModules(function (serverModules) {
        var csui = serverModules.filter(function (module) {
          return module.id === 'csui';
        });
        expect(csui.length).toEqual(1);
        expect(csui[0].version).toBeTruthy();
        done();
      });
    });

    describe('setLanguage', function () {
      beforeAll(function () {
        window.csui.require.config({
          config: {
            i18n: {}
          }
        });
        this.i18n = csui.require.s.contexts._.config.config.i18n;
      });

      afterAll(function () {
        window.csui.require.config({
          config: {
            i18n: {
              locale: 'root',
              rtl: false
            }
          }
        });
      });

      it('supports single parameter supplying locale', function () {
        csui.setLanguage('en-us');
        expect(this.i18n.locale).toEqual('en-us');
      });

      it('supports two parameters supplying language and country',
          function () {
            csui.setLanguage('en', 'us');
            expect(this.i18n.locale).toEqual('en-us');
          });

      it('supports an object supplying locale as a property', function () {
        csui.setLanguage({locale: 'en-us'});
        expect(this.i18n.locale).toEqual('en-us');
      });

      it('normalizes the single parameter supplying locale', function () {
        csui.setLanguage('EN_US');
        expect(this.i18n.locale).toEqual('en-us');
      });

      it('normalizes the two parameters supplying language and country',
          function () {
            csui.setLanguage('EN', 'US');
            expect(this.i18n.locale).toEqual('en-us');
          });

      it('normalizes object supplying locale as a property', function () {
        csui.setLanguage({locale: 'EN_US'});
        expect(this.i18n.locale).toEqual('en-us');
      });

      it('sets the RTL mode to false by default for an LTR locale',
          function () {
            csui.setLanguage('en');
            expect(this.i18n.rtl).toBe(false);
          });

      it('sets the RTL mode to true by default for an RTL locale',
          function () {
            csui.setLanguage('ar');
            expect(this.i18n.rtl).toBe(true);
          });

      it('leaves the RTL mode intact if set explicitly as a parameter',
          function () {
            csui.setLanguage({
              locale: 'en',
              rtl: true
            });
            expect(this.i18n.rtl).toBe(true);
          });

      it('can reset once selected locale',
          function () {
            csui.setLanguage('ar');
            expect(this.i18n.locale).toEqual('ar');
            expect(this.i18n.rtl).toBe(true);
            csui.setLanguage(null);
            expect(this.i18n.locale).toEqual(null);
            expect(this.i18n.rtl).toBe(false);
          });
    });

    describe('needsRTL', function () {
      it('returns false for LTR languages', function () {
        expect(csui.needsRTL('af')).toBe(false);
        expect(csui.needsRTL('en')).toBe(false);
        expect(csui.needsRTL('en-US')).toBe(false);
      });

      it('returns true for RTL languages', function () {
        expect(csui.needsRTL('ar')).toBe(true);
        expect(csui.needsRTL('ar-EG')).toBe(true);
        expect(csui.needsRTL('fa')).toBe(true);
        expect(csui.needsRTL('he')).toBe(true);
        expect(csui.needsRTL('ur')).toBe(true);
        expect(csui.needsRTL('yi')).toBe(true);
      });
    });

    describe('onReady', function () {
      it('loads fixed modules for compatibility', function (done) {
        csui.onReady(function () {
          expect(typeof csui.Connector === 'function').toBeTruthy();
          expect(typeof csui.util === 'object').toBeTruthy();
          expect(typeof csui.util.Connector === 'function').toBeTruthy();
          expect(typeof csui.FolderBrowserWidget === 'function').toBeTruthy();
          expect(typeof csui.widget === 'object').toBeTruthy();
          expect(typeof csui.widget.FolderBrowserWidget === 'function').toBeTruthy();
          done();
        });
      });
    });

    describe('onReady2', function () {
      it('loads a specified module', function (done) {
        csui.onReady2(['csui/utils/connector'], function (Connector) {
          expect(typeof Connector === 'function').toBeTruthy();
          done();
        });
      });
    });

    describe('onReady3', function () {
      function mockXMLHttpRequest () {
        this.originalXMLHttpRequest = XMLHttpRequest;
        XMLHttpRequest = function () {
          XMLHttpRequest.requests.push(this);
        }
        XMLHttpRequest.requests = [];
        XMLHttpRequest.DONE = 4;
        XMLHttpRequest.prototype.open = function (method, url) {
          this.method = method;
          this.url = url;
          this.requestHeaders = {};
        };
        XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
          this.requestHeaders[name.toLowerCase()] = value;
        };
        XMLHttpRequest.prototype.getResponseHeader = function (name) {
          return this.responseHeaders[name.toLowerCase()];
        };
        XMLHttpRequest.prototype.send = function () {
          this.status = 200;
          this.statusText = 'OK';
          this.responseHeaders = {};
          this.responseHeaders.otcsticket = 'test';
          this.responseText = JSON.stringify({
            configurations: []
          })
          this.readyState = XMLHttpRequest.DONE;
          this.onreadystatechange();
        };
      }

      function unmockXMLHttpRequest () {
        XMLHttpRequest = this.originalXMLHttpRequest;
      }

      function checkXMLHttpRequest (locale, ticket) {
        expect(XMLHttpRequest.requests.length).toEqual(1);
        var request = XMLHttpRequest.requests[0];
        expect(request.method).toEqual('GET');
        expect(request.url).toEqual('http://server/otcs/cs/api/v1/csui/settings?uilocale=' + locale);
        if (ticket) {
          expect(request.requestHeaders.otcsticket).toEqual('test');
        } else {
          expect(request.requestHeaders.authorization).toEqual('Basic QWRtaW46bGl2ZWxpbms=');
        }
      }

      beforeAll(mockXMLHttpRequest);
      afterAll(unmockXMLHttpRequest);

      beforeEach(function () {
        delete csui.settingsData;
        XMLHttpRequest.requests = [];
        csui.require.config({
          config: {
            i18n: { 
              locale: null, // enforce defaulting by a falsy, but defined value
              loadableLocales: [] // enforce English by default
            }
          }
        });
        this.connection = {
          url: 'http://server/otcs/cs/api/v1',
          session: { ticket: 'test' }
        };
      });

      it('makes an AJAX call to fetch the default configuration', function (done) {
        csui.onReady3({ connection: this.connection }, function () {
          checkXMLHttpRequest('en', true);
          done();
        });
      });

      describe('if a specific locale is requested', function () {
        it('passes an available locale', function (done) {
          csui.require.config({
            config: {
              i18n: { locale: 'de', loadableLocales: ['de'] }
            }
          });
          csui.onReady3({ connection: this.connection }, function () {
            checkXMLHttpRequest('de', true);
            done();
          });
        });

        it('normalises locales to lower-case', function (done) {
          csui.require.config({
            config: {
              i18n: { locale: 'DE', loadableLocales: ['DE'] }
            }
          });
          csui.onReady3({ connection: this.connection }, function () {
            checkXMLHttpRequest('de', true);
            done();
          });
        });

        it('satisfies at least the language', function (done) {
          csui.require.config({
            config: {
              i18n: { locale: 'de-AT', loadableLocales: ['de'] }
            }
          });
          csui.onReady3({ connection: this.connection }, function () {
            checkXMLHttpRequest('de', true);
            done();
          });
        });

        it('resorts to other country with the same language', function (done) {
          csui.require.config({
            config: {
              i18n: { locale: 'pt-BR', loadableLocales: ['pt-PT'] }
            }
          });
          csui.onReady3({ connection: this.connection }, function () {
            checkXMLHttpRequest('pt-pt', true);
            done();
          });
        });

        it('ignores a not available locale', function (done) {
          csui.require.config({
            config: {
              i18n: { locale: 'cs', loadableLocales: ['de'] }
            }
          });
          csui.onReady3({ connection: this.connection }, function () {
            checkXMLHttpRequest('en', true);
            done();
          });
        });
      });

      it('passes through the connection information as a module export', function (done) {
        var connection = this.connection;
        csui.onReady3(
          { connection: connection },
          ['csui-options', 'csui/utils/connector'],
          function (csuiOptions, Connector) {
            expect(typeof csuiOptions === 'object').toBeTruthy();
            expect(csuiOptions.connection).toBe(connection);
            expect(typeof Connector === 'function').toBeTruthy();
            done();
          });
      });

      it('swaps initial means of authentication for OTCSTicket', function (done) {
        var connection = {
          url: 'http://server/otcs/cs/api/v1',
          credentials: {
            username: 'Admin',
            password: 'livelink'
          }
        };
        csui.onReady3({ connection: connection }, ['csui-options'], function (csuiOptions) {
          checkXMLHttpRequest('en', false);
          expect(typeof csuiOptions === 'object').toBeTruthy();
          expect(typeof csuiOptions.credentials === 'undefined').toBeTruthy();
          expect(typeof connection.session === 'object').toBeTruthy();
          expect(connection.session.ticket).toEqual('test');
          done();
        });
      });

      it('allows overriding and extending the configuration sent from the server', function (done) {
        var connection = this.connection;
        var requestedModules = ['csui/utils/connector'];
        var called;
        csui.onReady3({
          connection: connection,
          onBeforeLoadModules: function (csuiOptions, modules) {
            expect(typeof csuiOptions === 'object').toBeTruthy();
            expect(csuiOptions.connection).toBe(connection);
            expect(modules).toBe(requestedModules);
            requestedModules.forEach(function (module) {
              expect(modules).toContain(module);
            });
            called = true;
          }
        }, requestedModules, function () {
          expect(called).toBeTruthy();
          done();
        });
      });

      it('can be called multiple times and loads the settings only for the first time', function (done) {
        var connection = this.connection;
        csui.onReady3({ connection: connection }, function () {
          expect(XMLHttpRequest.requests.length).toEqual(1);
          csui.onReady3({ connection: connection }, function () {
            expect(XMLHttpRequest.requests.length).toEqual(1);
            done();
          });
        });
      });
    });
  });
});
