/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/marionette3',
    'csui/lib/backbone',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/controls.list.view',
    'webreports/widgets/visual.data.filtered.count/impl/models/visual.count/chart.controls/chart.controls.model',
    'i18n!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/nls/lang',
    'hbs!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/visual.count.controls',
    'css!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/impl/visual.count.controls'
], function (_, $, Marionette, Backbone, VisualCountControlsListView, VisualCountChartControlsModel, lang, template) {

      var VisualCountControlsView = Marionette.View.extend({

          className: "webreports-visual-count-controls",

          constructor: function VisualCountControlsView(options) {
              if (!options.model){
                  options.model = new VisualCountChartControlsModel({
                      vis_type: options.type,
                      active_column: options.activeColumn,
                      theme_name: options.themeName,
                      sort_by: options.sortBy || 'Count',
                      sort_order: options.sortOrder || 'desc',
                      view_value_as_percentage: options.viewValueAsPercentage,
                      group_after: options.groupAfter
                  });
              }

              if (options.chartCollection){
                  this.chartCollection = options.chartCollection;
                  this.chartCollection.chartControlsModel = options.model;
              } else {
                  throw 'VisualCountControlsView requires a chart collection';
              }

              if (options.columnCollection){
                  this.columnCollection = options.columnCollection;
              } else {
                  throw 'VisualCountControlsView requires a columns collection';
              }

              Marionette.View.prototype.constructor.apply(this, arguments);

              this.listenTo(options.columnCollection, 'update', this.onColumnsChanged);
              this.listenTo(this, 'option:changed', this.onOptionChanged);

          },

          regions: {
              leftControls: {
                  el: '.webreports-visual-count-control-group.webreports-controls-lhs'
              },
              rightControls: {
                  el: '.webreports-visual-count-control-group.webreports-controls-rhs'
              }
          },

          template: template,

          onRender: function(){
              var lhsOptionsCollection = this._getLHSOptionsCollection(),
                  rhsOptionsCollection = this._getRHSOptionsCollection(),
                  moreThanOneColumn = this.model.get('column_names').length > 1;

              if (moreThanOneColumn) {
                  this.showChildView('leftControls', new VisualCountControlsListView({
                      originatingView: this,
                      collection: lhsOptionsCollection
                  }));
              }

              this.showChildView('rightControls', new VisualCountControlsListView({
                  originatingView: this,
                  collection: rhsOptionsCollection
              }));
          },

          onDomRefresh: function () {
              this._reFocus();
          },

          _getLHSOptionsCollection: function () {
              var activeColumnSelectName = "webreports-select-active-column",
                  columnNames = _.map(this.model.get('column_names'), function (column, index) {
                      return {
                          value: column,
                          label: this.model.get('column_names_formatted')[index],
                          selected: this.model.get('active_column') === column
                      };
                  }, this);

              return new Backbone.Collection([{
                  label: lang.activeColumn,
                  key: "activeColumn",
                  options: columnNames,
                  name: activeColumnSelectName,
                  id: this._getSelectID(activeColumnSelectName)
              }]);

          },

          _getRHSOptionsCollection: function () {
              var sortBySelectName = "webreports-select-sort-options",
                  valueAsPercentageSelectName = "webreports-select-value-as-percentage",
                  groupAfterSelectName = "webreports-select-group-after",
                  themeSelectName = "webreports-select-theme",
                  themeOptions = [
                      {value:"otPrimary", selected: this.model.get("theme_name") === "otPrimary", label: lang.OTPrimary},
                      {value:"otSecondary", selected: this.model.get("theme_name") === "otSecondary", label: lang.OTSecondary},
                      {value:"otTertiary", selected: this.model.get("theme_name") === "otTertiary", label: lang.OTTertiary},
                      {value:"dataClarity", selected: this.model.get("theme_name") === "dataClarity", label: lang.DataClarity},
                      {value:"dataClarityPatterned", selected: this.model.get("theme_name") === "Patterned", label: lang.DataClarityPatterned},
                      {value:"otNavy", selected: this.model.get("theme_name") === "otNavy", label: lang.OTNavy},
                      {value:"otTeal", selected: this.model.get("theme_name") === "otTeal", label: lang.OTTeal},
                      {value:"otIndigo", selected: this.model.get("theme_name") === "otIndigo", label: lang.OTIndigo},
                      {value:"otPlum", selected: this.model.get("theme_name") === "otPlum", label: lang.OTPlum},
                      {value:"otMagenta", selected: this.model.get("theme_name") === "otMagenta", label: lang.OTMagenta}
                  ],
                  sortOptions = [
                      {value:"Count|asc", selected: (this.model.get("sort_by") === "Count" && this.model.get("sort_order") === "asc"), label: lang.count+':'+ lang.asc},
                      {value:"Count|desc", selected: (this.model.get("sort_by") === "Count" && this.model.get("sort_order") === "desc"), label: lang.count+':'+ lang.desc},
                      {value:"ordinal|asc", selected: (this.model.get("sort_by") === "ordinal" && this.model.get("sort_order") === "asc"), label: lang.activeColumn+':'+ lang.asc},
                      {value:"ordinal|desc", selected: (this.model.get("sort_by") === "ordinal" && this.model.get("sort_order") === "desc"), label: lang.activeColumn+':'+ lang.desc}
                  ],
                  viewValueAsPercentage = [
                      {value:"true", selected: this.model.get("view_value_as_percentage"), label: lang.percentage},
                      {value:"false", selected: !this.model.get("view_value_as_percentage"), label: lang.actual}
                  ],
                  groupAfter = _.map([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], function (value) {
                      return {
                          value: value,
                          label: value,
                          selected: this.model.get('group_after') === value
                      };
                  }, this);

              return new Backbone.Collection([
                  {
                      label: lang.theme,
                      key: "themeName",
                      options: themeOptions,
                      name: themeSelectName,
                      id: this._getSelectID(themeSelectName)
                  },
                  {
                      label: lang.sortBy,
                      key: "sortBy",
                      options: sortOptions,
                      name: sortBySelectName,
                      id: this._getSelectID(sortBySelectName)
                  },
                  {
                      label: lang.showValuesAs,
                      key: "ViewValueAsPercentage",
                      options: viewValueAsPercentage,
                      name: valueAsPercentageSelectName,
                      id: this._getSelectID(valueAsPercentageSelectName)
                  },
                  {
                      label: lang.groupAfter,
                      key: "groupAfter",
                      options: groupAfter,
                      name: groupAfterSelectName,
                      id: this._getSelectID(groupAfterSelectName)
                  }]);
          },

          _getSelectID: function(name){
              return _.uniqueId(name + "_");
          },

          _reFocus: function () {
              var that = this;
              setTimeout(function () {
                  if (that.options && that.options.lastRegion && that.options.lastRegion.length > 0 ) {
                      var lastActiveRegion = $("select[name=" + that.options.lastRegion + "]");
                      lastActiveRegion.focus();
                  }
              }, 1);
          },

          onOptionChanged: function(args) {
              this.updateControlsModel(args);
              this.options.lastRegion = document.querySelector('#' + args.selectModel.get('id') + '').attributes.name.value;
              this._reFocus;
          },

          onColumnsChanged: function(){
              this.model.updateColumnData(this.columnCollection);
              this.render();
          },

          updateControlsModel: function(args) {
              var optionModel,
                  value,
                  changedAttributes = {},
                  chartControlsModel = this.model,
                  selectModel = args.selectModel,
                  optionCollection = args.optionCollection,
                  selectKey = selectModel.get("key");

              switch (selectKey) {
                  case 'activeColumn':
                      optionModel = optionCollection.findWhere({
                          value: args.value
                      });
                      changedAttributes = {
                          active_column: optionModel.get("value"),
                          active_column_formatted: optionModel.get("label")
                      };
                      break;
                  case 'sortBy':
                      value = args.value;

                      var sortOptions = value.split("|"),
                          sortBy = sortOptions[0],
                          sortOrder = sortOptions[1];

                      changedAttributes = {
                          sort_by: sortBy,
                          sort_order: sortOrder
                      };
                      break;
                  case 'ViewValueAsPercentage':
                      changedAttributes = {
                          view_value_as_percentage: (args.value === 'true')
                      };
                      break;
                  case 'groupAfter':
                      changedAttributes = {
                          group_after: parseInt(args.value)
                      };
                      break;
                  case 'themeName':
                      optionModel = optionCollection.findWhere({
                          value: args.value
                      });
                      changedAttributes = {
                          theme_name: optionModel.get('value')
                      };
                      break;
                  default:
                      console.warn("Invalid select key");
              }

              if (!_.isEmpty(changedAttributes)){
                  chartControlsModel.set(changedAttributes);
                  this.trigger("chart:options:updated", changedAttributes);
              }
          }
      });

    return VisualCountControlsView;

});
