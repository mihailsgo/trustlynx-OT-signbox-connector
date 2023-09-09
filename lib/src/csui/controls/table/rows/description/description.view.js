/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
'i18n!csui/controls/table/rows/description/impl/nls/lang',
  'hbs!csui/controls/table/rows/description/impl/description',
  'css!csui/controls/table/rows/description/impl/description'
], function (_, $, Marionette, base, lang, template) {

  var DescriptionView = Marionette.ItemView.extend({

    className: function () {
      if (this._collapsedHeightIsOneLine) {
        return "cs-description csui-description-short-lines-1";
      } else {
        return "cs-description";
      } 
    },

    template: template,

    templateHelpers: function () {
      var description = this.model.get("instructions")
        || this.model.get("description") || '',
        summary = this.model.get('summary') || '';
      this.exceededDescription = false;
      if (this.options.tableView.options.parentView &&
        this.options.tableView.options.parentView.options.useAppContainer &&
        description && description.toString().length > 254) {
        description = description + "...";
        this.exceededDescription = true;
      }
      return {
        complete_description: this.exceededDescription ? lang.suggestedTooltip : description,
        current_description: description,
        complete_summary: summary,
        current_summary: summary,
        descriptionAvailable: description
      };
    },

    ui: {
      description: '.description',
      summary:'.summary',
    },

    constructor: function DescriptionView(options) {

      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

  });

  return DescriptionView;

});
