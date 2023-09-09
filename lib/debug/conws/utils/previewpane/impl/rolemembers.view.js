// Shows a list of team members
csui.define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/controls/list/list.view',
  'csui/controls/list/emptylist.view',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/behaviors/expanding/expanding.behavior',
  'conws/widgets/header/impl/header.model.factory',
  'conws/widgets/team/impl/team.model.factory',
  'conws/widgets/team/impl/teamtables.view',
  'csui/utils/nodesprites',
  'conws/widgets/team/impl/controls/listitem/listitemteammember.view',
  'i18n!conws/utils/previewpane/impl/nls/previewpane.lang',
  'hbs!conws/utils/previewpane/impl/rolemembers.empty',
  'css!conws/utils/previewpane/impl/previewpane'
], function (_, $, Marionette, ListView, EmptyView, LimitingBehavior, ExpandingBehavior,
    HeaderModelFactory, TeamCollectionFactory,
    TeamTablesView, NodeSpriteCollection, ListItem, lang, RoleMembersEmptyTemplate) {

  // Empty team view
  var RoleMembersEmptyView = Marionette.ItemView.extend({

    constructor: function RoleMembersEmptyView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    template: RoleMembersEmptyTemplate
  });

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var RoleMembersView = Marionette.CollectionView.extend({

    //className: 'conws-preview binf-list-group' + ListView.prototype.className,

    constructor: function RoleMembersView(options) {
      // initialize team view
      options || (options = {});
      options.data || (options.data = {});

      // apply properties to parent
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },

    getEmptyView: function () {
      return EmptyView;
    },

    emptyViewOptions: function () {
      return {
        templateHelpers: {
          text: this.options.noRoleMembersMessage
        }
      }
    },

    childView: ListItem,

    childViewOptions: function () {
      return {
        templateHelpers: function () {
          return {
            name: this.model.get('display_name'),
            email: this.model.get('business_email'),
            isUser: this.model.get('type') === 0,
            stage: {
              value: this.model.getLeadingRole(),
              label: this.model.getRolesIndicator()
            }
          }
        },
        context: this.options.context,
        miniProfile: false
      }
    },

    childEvents: {
      'click:profile': 'onClickProfile'
    },

    onClickProfile: function (view, data) {
      this.triggerMethod('click:member', data);
    },

    /*
    getExpandableDialogIcon: function () {
        // initialize
        var ret = {
            icon: undefined,
            image: undefined
        };
        // calculate the images to show
        if (this.options.data.showTitleIcon) {
            // we want to show a workspace specific icon
            if (this.options.data.showWorkspaceImage) {
                if (this.headerModel.icon.location !== 'none') {
                    ret.image = this.headerModel.icon.content;
                } else {
                    ret.icon = NodeSpriteCollection.findByNode(this.headerModel).get('className');
                }
            } else {
                // default header icon style
                ret.icon = 'title-icon title-team';
            }
        }
        // return
        return ret;
    },
    */

    onClickHeader: function (target) {
      this.triggerMethod('expand');
    }
  });

  return RoleMembersView;

})
;
