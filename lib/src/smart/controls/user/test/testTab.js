/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore','nuc/lib/backbone', 'nuc/lib/marionette'
], function (_, Backbone, Marionette) {
  "use strict";
 function formatTabs(params) {
   var arr= [];
   for(var i =1; i<5;i++){
    arr.push({
      tabName: _.str.sformat("loremIpsum{0}", i),
      index: i,
      tabDisplayName: _.str.sformat("Lorem Ipsum {0}", i),
      tabContentView: Marionette.ItemView.extend({
        template: function () {
          return '<div class="content"> <div class="user-profile-content" > <h1> Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups. </h1> </div></div>';
        },
        className: _.str.sformat("tab-content-{0}", i),
        constructor: function TestView(options) {
          options = options || {};
          Marionette.ItemView.prototype.constructor.call(this, options);
      }
      }),
      showTab: function (model, options) {
        return this.index <= window.tabsLen;
      }
    });
   }
   arr[3].tabCount= {
    getItemCount: function (model, options) {
      return i;
    }
  };
   return arr;
 }
  return formatTabs();
});