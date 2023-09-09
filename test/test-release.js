(function () {
  'use strict';

  window.define = window.csui.define;
  // Enable the Karma adapter patch the RequireJS loaded from Nucleus;
  // window.require and window.requirejs are deleted by test-no-global-require later.
  window.require = window.csui.require;
  window.requirejs = window.csui.requirejs;
  window.csui.supportPath = '/lib/release';

  // Include the BINF stylesheet and mark body as parent of BINF widgets
  define('prepare-test-page', function () {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/base/lib/release/csui/themes/carbonfiber/theme.css';
    document.head.appendChild(link);
    document.body.classList.add('binf-widgets');
    // Adding smart control's style sheet to the browser as controls are depending on smart controls from now.
    var smartCSSLink = document.createElement('link');
    smartCSSLink.rel = 'stylesheet';
    smartCSSLink.href = '/base/lib/release/smart/bundles/smart-all.css';
    document.head.appendChild(smartCSSLink);
  });

  window.csui.require.config({
    // Minimum from the application config - module paths
    paths: {
      nuc: 'lib/release/nuc',
      smart: 'lib/release/smart',
      csui: 'lib/release/csui',
      'dmss': 'out-release',
      'csui/lib/bililiteRange': 'lib/src/csui/lib/bililiteRange',
      'csui/lib/jquery.simulate': 'lib/src/csui/lib/jquery.simulate',
      'csui/lib/jquery.simulate.ext': 'lib/src/csui/lib/jquery.simulate.ext',
      'csui/lib/jquery.simulate.key-sequence': 'lib/src/csui/lib/jquery.simulate.key-sequence'
    }
  });
}());
