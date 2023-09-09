/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/pages/signin/signin.page.view',
  'csui/utils/authenticators/core.authenticators',
  'csui/utils/high.contrast/detector',
  'csui/utils/contexts/impl/csui.context.plugin'
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-signin', true);
});
