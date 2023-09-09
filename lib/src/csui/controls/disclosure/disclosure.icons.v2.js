/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/controls/icons.v2',
], function (iconRegistry) {
  iconRegistry.registerIcons(
      {
        "csui_caret_up": '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                         ' class="csui-icon-v2' +
                         ' csui-impl-icon-v2__caret_up"' +
                         ' xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 18' +
                         ' 18" xml:space="preserve"> <polyline' +
                         ' fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round"' +
                         ' stroke-miterlimit="10" points="4,12 9,7 14,12 "/></svg>',
        "csui_caret_down": '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" class="csui-icon-v2' +
                           ' csui-impl-icon-v2__caret_down"' +
                           ' xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0' +
                           ' 18 18" xml:space="preserve"> <polyline' +
                           ' fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round"' +
                           ' stroke-miterlimit="10" points="14,7 9,12 4,7 "/></svg>'
      }
  );
});