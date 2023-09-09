/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/marionette',
  'i18n!workflow/widgets/workitem/workitem.attachments/impl/nls/lang',
  'css!workflow/widgets/workitem/workitem.attachments/impl/workitem.attachments'
], function (_, Marionette, lang) {
  'use strict';
  var EmptyDragAndDropView = Marionette.ItemView.extend({
    template: "<div></div>",
    className: 'workitem-attachments-emptylist',
    tagName: 'li',    
    constructor: function EmptyDragAndDropView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }
  });
  return EmptyDragAndDropView;
}); 