/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/binf/js/binf',
  'csui/lib/binf/js/binf-switch',
  'csui/lib/fastclick',
  'csui/lib/hammer',
  'csui/lib/jquery.redraw',
  'csui/lib/jquery.renametag',
  'csui/lib/jquery.scrollbarwidth',
  'csui/lib/jquery.touchSwipe',
  'csui/lib/jquery.ui/js/jquery-ui',
  'csui/lib/perfect-scrollbar',
  'csui/lib/exif'
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-libraries', true);
});
