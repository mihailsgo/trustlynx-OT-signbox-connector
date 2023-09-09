csui.define([
  'csui/lib/underscore',
  'csui/lib/marionette',
  'i18n!conws/dialogs/addoreditrole/impl/nls/lang',
  'hbs!conws/dialogs/addoreditrole/impl/roleparticipants/impl/empty.roleparticipants',
  'css!conws/dialogs/addoreditrole/impl/roleparticipants/impl/empty.roleparticipants'
], function (_, Marionette, lang, template) {

  var EmptyRoleParticipantsView = Marionette.LayoutView.extend({

    template: template,

    templateHelpers: {
      message: lang.rolePartcipantsWithNoparticipantsMessage
    },

    constructor: function EmptyRoleParticipantsView(options) {
      options || (options = {});

      this.context = options.context;
      this.connector = options.connector;

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    }

  });
  // return view
  return EmptyRoleParticipantsView;
});