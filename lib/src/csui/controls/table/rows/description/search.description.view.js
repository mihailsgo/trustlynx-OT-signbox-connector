/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/controls/table/rows/description/description.view'
], function (_, $, Marionette, base, DescriptionView) {

  var SearchDescriptionView = DescriptionView.extend({

    templateHelpers: function () {
      var description = this.model.get("description"),
          summary = this.model.get("summary"),
          selectedSettings = this.options && this.options.tableView && this.options.tableView.selectedSettings,
          tableRowSummaryAvailable = (this.options && this.options.tableView && this.options.tableView.options.descriptionRowViewOptions.tableRowSummaryAvailable) || false,
          summary_description = false;

      switch (selectedSettings) {
        case 'SD' : {
          summary_description = true;
          break;
        }
        case 'SO' : {
          summary_description = true;
          description = undefined;
          break;
        }
        case 'SP' : {
          summary_description = true;
          summary && (description = undefined);
          break;
        }
        case 'DP' : {
          summary_description = true;
          description && (summary = undefined);
          break;
        }
        case 'DO' : {
          summary = undefined;
          break;
        }
        case 'NONE':
        default : {
          description = summary = undefined;
        }
      }
      return _.extend(DescriptionView.prototype.templateHelpers.apply(this), {
        complete_description: description,
        current_description: description,
        complete_summary: this.model.get("stringifiedSummary") ? this.model.get("stringifiedSummary") : summary,
        current_summary: summary,
        search_description: true,
        search_summary: true,
        summary_description_available: (summary_description && summary) && !tableRowSummaryAvailable,
        descriptionAvailable : description,
        summary_Available: tableRowSummaryAvailable && (summary_description && summary)
      });
    }
  });

  return SearchDescriptionView;
});
