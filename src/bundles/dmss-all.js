// Placeholder for the build target file; the name must be the same,
// include public modules from this component

define([
  // add public files for this module here
    'hbs!dmss/commands/open.classic/impl/sign',
    'dmss/commands/open.classic/impl/sign.view',
    'dmss/commands/open.classic/open.classic.command',
    'dmss/commands/open.classic/open.classic.nodestable.toolitems'
], {});

require([
  'require',
  'css'
], function (require, css) {
  // Load the bundle-specific stylesheet
  css.styleLoad(require, 'dmss/bundles/dmss-all');
});