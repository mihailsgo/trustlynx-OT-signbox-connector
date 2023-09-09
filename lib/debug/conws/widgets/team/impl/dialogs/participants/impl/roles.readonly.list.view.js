csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/lib/handlebars',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'conws/widgets/team/impl/behaviors/list.keyboard.behavior',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/dialogs/participants/impl/roles.readonly.list',
  'css!conws/widgets/team/impl/cells/roles/impl/roles'
], function (_, $, Marionette, Handlebars, TabableRegionBehavior, ListKeyboardBehavior,
    lang, template) {

  var RolesReadOnlyList = Marionette.LayoutView.extend({

    template: template,

    events: {
      'keydown': 'onKeyDown'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListKeyboard: {
        behaviorClass: ListKeyboardBehavior
      }
    },

    // constructor for the readonly roles list
    constructor: function RolesReadOnlyList(options) {

      //used for accessibility
      this.selectedIndex = 0;

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    // template helper to prepare the model for the view
    templateHelpers: function () {
      return {
        roles: this.model.toJSON()
      }
    }
  });

  return RolesReadOnlyList;
});
