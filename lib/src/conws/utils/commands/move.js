/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/commands/move',
  'csui/utils/url',
  'csui/dialogs/modal.alert/modal.alert',
  'i18n!conws/utils/commands/nls/commands.lang'
], function ($, _, MoveCommand, Url, ModalAlert, lang) {
  var CWSMoveCommand = MoveCommand.extend({

    getExternalBodyParams: function (connector, selectedNodeIds) {

      var dfd = $.Deferred(),
        self = this;

      require(
        ['csui/controls/dialog/dialog.view',
          'conws/dialogs/regen.reference/regen.reference.view'],
        function (DialogView, RegenView) {
          var url = new Url(connector.connection.url).getApiBase('v2');
          var formData = {};
          formData.nodeId_list = selectedNodeIds;
          var fullUrl = Url.combine(url + 'canregenerateref');
          var ajaxOptions = {
            type: 'POST',
            url: fullUrl,
            data: formData,
            success: function (response, status, jXHR) {
              if (response.results.canRegenReference) {
                self._view = new RegenView();
                var dialog = new DialogView({
                  headerView: '',
                  view: self._view,
                  className: "conws-regen-ref-boolean-dialog",
                  buttons: [{
                    label: lang.apply,
                    default: true,
                    close: true
                  }]
                });
                dialog.listenTo(dialog, 'destroy', function () {
                  self.externalBodyParams = self._view.model.toJSON();
                  dfd.resolve(self.externalBodyParams);
                });
                dialog.show();
              } else {
                dfd.resolve({ 'ref_regen': false });
              }
            },
            error: function (xhr, status, text) {
              var errorContent = xhr.responseJSON ?
                (xhr.responseJSON.errorDetail ? xhr.responseJSON.errorDetail :
                  xhr.responseJSON.error) : lang.defaultErrorGenerateNumber;
              ModalAlert.showError(errorContent);
            }
          };
          connector.extendAjaxOptions(ajaxOptions);
          connector.makeAjaxCall(ajaxOptions);

        }, function (error) {
          console.log('Error while loading Dialog modules ', error)
        });

      return dfd.promise();
    }
  });
  MoveCommand.prototype = CWSMoveCommand.prototype;
  return MoveCommand;
});