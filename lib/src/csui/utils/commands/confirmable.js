/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'require', 'csui/utils/commands/multiple.items'
], function (_, $, require, MultipleItemsCommand) {

  var ConfirmableCommand = {

    execute: function (status, options) {
      var self = this;
      return this
          ._confirmAction(status, options)
          .then(function () {
            return self._performActions(status, options);
          }, function (error) {
            return $.Deferred().reject().promise();
          });
    },

    _confirmAction: function (status, options) {
      var deferred = $.Deferred();

      if (this._getConfirmTemplate) {
        var data = this._getConfirmData(status, options),
            html = this._getConfirmTemplate(status, options)(data);
        require(['csui/dialogs/modal.alert/modal.alert'], _.bind(function (alertDialog) {
          var buttons = _.isFunction(this._getButtons) ? this._getButtons() : {};

          alertDialog.confirmQuestion($(html).text(), data.title, buttons)
              .done(function (arg) {
                deferred.resolve(arg);
              })
              .fail(function (arg) {
                deferred.reject(arg);
              });
        }, this));

      }
      else {
        deferred.resolve();
      }
      return deferred.promise();
    }

  };

  _.extend(ConfirmableCommand, _.omit(MultipleItemsCommand, 'execute'));

  return ConfirmableCommand;

});
