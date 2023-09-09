csui.define([
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'conws/widgets/team/impl/participants.columns',
  'i18n!conws/widgets/team/impl/nls/team.lang'
], function (TemplatedCellView, cellViewRegistry, ParticipantsTableColumnCollection, lang) {

  var LoginCellView = TemplatedCellView.extend({

        className: 'csui-truncate',

        getValueData: function () {
          // get name in case of users
          var value = this.model.displayLogin();
          // return
          return {
            value: value,
            formattedValue: value
          };
        }
      }
  );

  cellViewRegistry.registerByColumnKey(ParticipantsTableColumnCollection.columnNames.login, LoginCellView);

  return LoginCellView;
});

