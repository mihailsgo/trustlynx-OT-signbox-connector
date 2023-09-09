csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/lib/handlebars',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'conws/widgets/team/impl/behaviors/list.keyboard.behavior',
  'conws/widgets/team/impl/dialogs/role/impl/role.details.member.view',
  'i18n!conws/widgets/team/impl/nls/team.lang'
], function (_, $, Marionette, Handlebars, TabableRegionBehavior, ListKeyboardBehavior, MemberView,
    lang) {

  var RoleDetailsMembersList = Marionette.CollectionView.extend({

    // CSS class names
    className: 'conws-role-details-members-list',

    // child views for the list
    childView: MemberView,

    // view tag
    tagName: 'ul',

    events: {
      'keydown': 'onKeyDown'
    },

    // view behaviors
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListKeyboard: {
        behaviorClass: ListKeyboardBehavior
      }
    },

    // filter model
    filterModel: {},

    // constructor for the Roles list
    constructor: function RoleDetailsMembersList(options) {
      options || (options = {});

      // the model has to be a RolesCollection with the filterList method
      this.collection = options.model;
      // filterModel is the FilterModel with the filter criteria
      this.filterModel = options.filterModel;

      // apply properties to parent
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
      // listen on the change of the filter
      this.listenTo(this.filterModel, 'change', this.render);
      this.listenTo(this.filterModel, 'change:filter', function () {
        // when search filter changes, reset the focus element to the first item
        this.selectedIndex = 0;
      });
    },

    addChild: function (child, ChildView, index) {
      if (!_.isUndefined(this.filterModel)) {
        var filter = this.filterModel.get('filter');
        if (!_.isUndefined(filter) && filter.length > 0) {
          var name = child.displayName().toLowerCase();
          if (name.indexOf(filter.toLowerCase()) < 0) {
            return; // do not render this item
          }
        }
      }
      // no filter or filter does match render the item
      Marionette.CollectionView.prototype.addChild.apply(this, arguments);
    }
  });

  return RoleDetailsMembersList;
});
