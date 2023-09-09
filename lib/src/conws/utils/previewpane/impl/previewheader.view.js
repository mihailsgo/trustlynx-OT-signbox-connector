/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/lib/numeral',
  'csui/lib/moment',
  'csui/lib/handlebars',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/controls/icons.v2',
  'i18n',
  'hbs!conws/utils/previewpane/impl/previewheader',
  'css!conws/utils/icons/icons'
], function (_, Marionette, numeral, moment, Handlebars, DefaultActionBehavior, iconRegistry, i18n, headerTemplate) {
    var PreviewHeaderView = Marionette.ItemView.extend({

    constructor: function PreviewHeaderView() {
      Marionette.ItemView.apply(this, arguments);
    },

    behaviors:{
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    triggers: {
      'click .conws-preview-header-title': 'click:item'
    },

    className: 'preview-header',
    template: headerTemplate,

    onClickItem: function () {
      if (this.options.originatingView){
        var previewPane = this.options.originatingView;
        previewPane.destroy();
 
       if (previewPane.options.node){
          this.triggerMethod('execute:defaultAction', previewPane.options.node);
        }
      }
    }
  });

  return PreviewHeaderView;
});
