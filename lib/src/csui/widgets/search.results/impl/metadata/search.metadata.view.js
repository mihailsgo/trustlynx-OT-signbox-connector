/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery','csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/base',
  'csui/controls/table/cells/cell.factory', 'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/search/category/category.popover.list.view',
  'csui/utils/types/date', 'i18n!csui/widgets/search.results/impl/nls/lang',
  'hbs!csui/widgets/search.results/impl/metadata/search.metadata',
  'css!csui/widgets/search.results/impl/search.results'
], function ($,_, Marionette, base, cellViewFactory, cellView, CategoryPopover, date, lang, itemTemplate) {
  "use strict";

  var SearchMetadataItemView = Marionette.ItemView.extend({
    className: "csui-search-item-details binf-col-lg-12",
    template: itemTemplate,
    attributes: {
      'role': 'listitem'
    },

    events: {
      'click .csui-count': 'openPopover',
      'keydown .csui-search-metadata-value': 'onKeyInView'
    },

    constructor: function SearchMetadataItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      var CellView = cellViewFactory.getCellView(this.model);
      if (CellView.columnClassName === "") {
        CellView = cellView;
      }
      var column = {
        CellView: CellView,
        attributes: this.model.attributes,
        name: this.model.get("key"),
        title: this.model.get('title') || this.model.get('name') ||
          this.model.get("column_name")
      };
      this.metadataView = new CellView({
          tagName: 'span',
          model: this.options.searchItemModel,
          column: column,
          originatingView: this.options.originatingView,
          searchMetadataView: this
        });
    },

    templateHelpers: function () {
      if (this._index < this.options.displayCount) {
        if (this._index < 2) {
          this.el.classList.add('csui-search-result-item-tobe-hide');
        }
      } else {
        this.el.classList.add('csui-search-hidden-items');
        this.el.classList.add('truncated-' + this.options.rowId);
      }
      var metadataValue = this.metadataView.getValueData && this.metadataView.getValueData();
      return {
        label: this.model.get("name"),
        titleAttr : this.model.get("titleAttr") || this.model.get("name"),
        value: metadataValue &&
               (metadataValue.formattedValue || metadataValue.value || metadataValue.name),
        tooltipText: metadataValue &&
                     (metadataValue.value || metadataValue.name || metadataValue.nameAria),
        count: metadataValue && metadataValue.count
      };
    },

    onRender: function(){
      if(this.metadataView.collection){
        var searchMetadataValue = $(this.$el.find('.csui-search-metadata-value')),
        searchMetadataAria = this.metadataView.getValueData && this.metadataView.getValueData().value;
        searchMetadataValue.attr('tabindex', 0);
        searchMetadataValue.attr('aria-label', searchMetadataAria);
        searchMetadataValue.attr('role', 'button');
      }
    },

    openPopover: function (event) {
      this.metadataView.openPopover(event);
    },

    onKeyInView : function(event){
      this.metadataView.onKeyInView(event);
    }
  });

  var SearchMetadataCollectionView = Marionette.CollectionView.extend({
    className: "csui-search-items-metadata",
    childView: SearchMetadataItemView,
    ui: {
      fieldsToBeHiddenOnHover: '.csui-search-result-item-tobe-hide'
    },
    childViewOptions: function () {
      return {
        rowId: this.options.rowId,
        searchItemModel: this.model,
        displayCount: this.childDisplayCount,
        originatingView: this.options.originatingView
      };
    },

    constructor: function SearchMetadataCollectionView(options) {
      options || (options = {});
      this.options = options;

      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      var desc    = this.model.get("description"),
          summary = this.model.get("summary");

      this.childDisplayCount = ((summary && summary.length) || (desc && desc.length)) ? 3 : 2;
    },
    filter: function (child, index, collection) {
      if (child.get('key') === 'size' || child.get('key') === 'OTObjectSize') {
        return (this.model.get(child.get('key')) &&
                this.model.get(child.get('key') + "_formatted") !== "");
      } else if (["OTLocation", "OTName", "OTMIMEType", "reserved", "favorite"].indexOf(
              child.get('key')) >= 0) {
        return;
      } else {
        return (this.model.get(child.get('key')) && this.model.get(child.get('key')) !== "");
      }
    },
    onRender: function () {
      var collection = this.collection;
      this.collection.comparator = function (model) {
        return model.get("definitions_order");
      };
      this.collection.sort();
      this.bindUIElements();
    }
  });

  return SearchMetadataCollectionView;
});