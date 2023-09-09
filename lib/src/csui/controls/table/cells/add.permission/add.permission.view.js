/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'i18n!csui/controls/table/cells/add.permission/impl/nls/localized.strings'
], function ($, _, Backbone, Marionette, TemplatedCellView, cellViewRegistry, lang) {
  'use strict';

  var AddPermissionCellView = TemplatedCellView.extend({

    className: 'csui-row-inlinetoolbar',

    events: {
      'keydown': 'onKeyInView'
    },
    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        if(document.activeElement === this.el) {
          if(this.options.originatingView){
            this.options.originatingView.trigger("permission:inlineaction:clicked", {cellView: this});
          }
          this.$el.find('a.binf-dropdown-toggle').trigger('click');
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },

    renderValue: function () {
      var classes = _.result(this, 'className');
      if (classes) {
        this.$el.addClass(classes);
      }
      this.$el.attr({
        'aria-label': lang.ToolbarItemMore,
        'role': 'button'
      });
    },

    _onWindowResize: function () {
      if (this.$el.find('.binf-dropdown.binf-open').length) {
        this.$el.find('.binf-dropdown').removeClass("binf-open");
      }
    },

    constructor: function AddPermissionCellView(options) {
      AddPermissionCellView.__super__.constructor.apply(this, arguments);
      this.windowResizeHandler = _.bind(this._onWindowResize, this);
      $(window).on('resize', this.windowResizeHandler);
    }

  }, {
    hasFixedWidth: true,
    noTitleInHeader: true,
    isToolbar: true,
    columnClassName: 'csui-add-permission',
    widthFactor: 1 / 3.0,
  });

  cellViewRegistry.registerByColumnKey('addpermissions', AddPermissionCellView);

  return AddPermissionCellView;
});