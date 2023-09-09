csui.define([
  'csui/lib/underscore',
  'csui/models/command',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (_, CommandModel, lang) {

  var ExportCommand = CommandModel.extend({

    defaults: {
      signature: 'Export',
      name: lang.CommandNameExport,
      scope: 'multiple'
    },

    constructor: function (options) {
      CommandModel.prototype.constructor.call(this, arguments);
    },

    enabled: function (status) {
      if (status && status.nodes && status.nodes.length > 0) {
        return true;
      } else {
        return false;
      }
    },

    execute: function (status, options) {
      // invoke download
      var file = 'export.csv';
      var csv = this._export(status.nodes.models);
      this._download(csv, file);
    },

    _exportHeader: function () {
      var ret = '';
      return ret;
    },

    _exportModel: function () {
      var ret = '';
      return ret;
    },

    _export: function (models) {
      // prepare model export csv
      var self = this;
      var csv = this._exportHeader() + '\n';
      _.each(models, function (current) {
        csv += self._exportModel(current) + '\n';
      });
      return csv;
    },

    _download: function (text, file) {
      // create blob
      var blob = new Blob([text], {type: 'text/csv'});
      // try multiple options to invoke the csv download
      if (!!window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, file);
      } else {
        var link = document.createElement("a");
        link.download = file;
        link.innerHTML = "Download File";
        if ('webkitURL' in window) {
          // Chrome allows the link to be clicked without actually adding it to the DOM.
          link.href = window.webkitURL.createObjectURL(blob);
        } else {
          // Firefox requires the link to be added to the DOM before it can be clicked.
          link.href = window.URL.createObjectURL(blob);
          link.style.display = "none";
          link.onclick = function (event) {
            document.body.removeChild(event.target);
          };
          document.body.appendChild(link);
        }
        link.trigger('click');
      }
    }
  });

  return ExportCommand;
});



