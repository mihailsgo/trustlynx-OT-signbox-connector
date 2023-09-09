/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'csui/utils/base', 'csui/utils/node.links/node.links',
  'hbs!csui/controls/table/cells/name/impl/name',
  'i18n!csui/controls/table/impl/nls/lang',
  'css!csui/controls/table/cells/name/impl/name'
], function (_, TemplatedCellView, cellViewRegistry, base, nodeLinks, template, lang) {
  'use strict';

  var NameCellView = TemplatedCellView.extend({
      template: template,
      className: function () {
        var c = 'csui-truncate';
        if (base.isIE11()) {
          c += " csui-on-IE11";
        } else {
          c += " csui-not-on-IE11";
        }
        return c;
      },

      constructor: function NameCellView(options) {
        TemplatedCellView.prototype.constructor.apply(this, arguments);
        this.listenTo(this, 'before:render', function () {
          this.needsAriaLabel = !(this.options.column.defaultAction &&
                                  !this.model.get('inactive'));
        });
      },

      getValueData: function () {
        var model = this.model;
        if (model && model.changed && model.changed.name) {
          model.set({OTName: model.changed['name']});
        }

        var column   = this.options.column,
            promotedColumnFnt = column.attributes && column.attributes.promoted,
            promotedColumnInfo = model.get("promoted_column_info") || (promotedColumnFnt && promotedColumnFnt(model)) || {},
            name     = model.get(column.name),
            promotedColumnMessage = promotedColumnInfo.message,
            promoted = model.get("bestbet") || model.get("nickname") ||
                       promotedColumnMessage,
            defaultActionUrl = nodeLinks.getUrl(model);
        return {
          defaultAction: column.defaultAction,
          defaultActionUrl: defaultActionUrl,
          contextualMenu: column.contextualMenu,
          name: name,
          nameAria: _.str.sformat(lang.nameAria, name),
          nameNoOpenAria: _.str.sformat(lang.nameNoOpenAria, name),
          inactive: model.get('inactive'),
          promoted: (promoted && promoted.length > 0),
          promotedLabel: promotedColumnMessage || lang.promotedLabel,
          promotedAria: promotedColumnInfo.aria || lang.promotedLabel,
          promotedClass: promotedColumnInfo.class || ''
        };
      }
    },
    {
      widthFactor: 1.0,
      columnClassName: 'csui-table-cell-name',
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  );

  cellViewRegistry.registerByColumnKey('OTName', NameCellView);
  return NameCellView;
});
