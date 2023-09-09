(function () {
  'use strict';

  // Enable using the csui.require() statement in test spec modules;
  // they cannot use the global require(), if we want to share them
  // for both debug and release test runs
  window.csui.require = require;
  window.csui.requirejs = requirejs;
  window.csui.supportPath = '/lib/src';

  // Include the BINF stylesheet and mark body as parent of BINF widgets
  define('prepare-test-page', function () {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/base/lib/src/csui/themes/carbonfiber/theme.css';
    document.head.appendChild(link);
    document.body.classList.add('binf-widgets');
  });

  require.config({
    // Minimum from the application config - module paths
    paths: {
      nuc: 'lib/src/nuc',
      smart: 'lib/src/smart',
      csui: 'lib/src/csui',
      'dmss': 'src'
    }
  });
}());
