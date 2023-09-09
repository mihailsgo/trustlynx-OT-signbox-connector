/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

(function () {
  'use strict';
  var csui = window.csui || (window.csui = {});
  if (!csui.requirejs && window.requirejs) {
    csui.requirejs = window.requirejs;
    csui.require = window.require;
    csui.define = window.define;
  }
  var currentScript = document.currentScript || (function () {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
  if (!currentScript) {
    throw new Error('Cannot detect the CS UI path');
  }
  var smartPath = currentScript.getAttribute('data-smart-path') ||
                  currentScript.getAttribute('data-csui-path');
  if (!smartPath) {
    smartPath = currentScript.src;
    var queryStart = smartPath.indexOf('?');
    if (queryStart > 0) {
      smartPath = smartPath.substring(0, queryStart);
    }
    var anchorStart = smartPath.indexOf('#');
    if (anchorStart > 0) {
      smartPath = smartPath.substring(0, anchorStart);
    }
    var lastSlash = smartPath.lastIndexOf('/');
    smartPath = lastSlash > 0 ? smartPath.substring(0, lastSlash) : '.';
  }

  csui.require.config({
    paths: {
      smart: smartPath
    },

    rename: {'esoc/widgets/userprofile/tab.extension':'smart/controls/user/tab.extension'},

    waitSeconds: 30
  });
}());
