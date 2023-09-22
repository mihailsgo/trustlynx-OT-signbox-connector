define([
  'json!dmss/dmss-extensions.json'
], function (extensions) {
  'use strict';

  describe('The extension', function () {
    beforeAll(function () {
      expect(typeof extensions).toEqual('object');
      var collection = extensions[
            'csui/models/server.module/server.module.collection'];
      expect(typeof collection).toEqual('object');
      var modules = collection.modules;
      expect(typeof modules).toEqual('object');
      this.module = modules['dmss'];
    });

    it('registers the module', function () {
      expect(typeof this.module).toEqual('object');
    });

    it('declares a version', function () {
      var version = this.module.version;
      if (releaseMode()) {
        expect(typeof version).toEqual('string');
        expect(version).not.toEqual('1.0.5');
      } else {
        expect(version).toEqual('1.0.1');
      }
    });

    function releaseMode() {
      var scripts = document.getElementsByTagName('script'),
          scriptCount = scripts.length, i;
      for (i = 0; i < scriptCount; ++i) {
        if (/\/nuc-loader\.js\b/.test(scripts[i].src || '')) {
          return true;
        }
      }
    }
  });
});
