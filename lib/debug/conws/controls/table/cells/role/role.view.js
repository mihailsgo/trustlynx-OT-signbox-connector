csui.define([
  'csui/lib/underscore',
  'csui/controls/table/cells/user/user.view',
  'csui/controls/table/cells/cell.registry',
  'csui/models/member',
  'conws/utils/commands/permissions/permissions.util',
  'hbs!conws/controls/table/cells/role/impl/role',
  'i18n!conws/controls/table/cells/role/impl/nls/lang',
  'css!conws/controls/table/cells/role/impl/role'
], function (_, UserCellView, cellViewRegistry, MemberModel, PermissionsUtil, roleTemplate, lang) {

  var RoleCellView = UserCellView.extend({

    renderValue: function () {
      var data = this.getValueData(),
        template = this.getTemplate(),
        // Making the entire data object undefined renders nothing; if the object
        // contains defined value the template should be prepared for it
        html = data ? template(data) : '';
      this.$el.html(html);
    },

    getTemplate: function () {
      var template;
      if (!!this.isWorkspaceRole && this.isWorkspaceRole) {
        template = roleTemplate;
      }
      else {
        // In this case load the user.view template
        template = this.template;
      }
      return template;
    },

    getValueData: function () {
      return _.extend(RoleCellView.__super__.getValueData.apply(this, arguments), {
        isWorkspaceRole: this.isWorkspaceRole,
        roleAria: _.str.sformat(lang.roleAria, this.getDisplayName()),
        roleAccessTitle: lang.roleAccessTitle
      })
    },

    constructor: function RoleCellView(options) {
      RoleCellView.__super__.constructor.apply(this, arguments);

      if (!!this.model && !!this.model.collection) {

        this.isWorkspaceRole = PermissionsUtil.isWorkspaceRole(this.model);

        if (!this.model.collection.extraMemberModels) {
          this.model.collection.extraMemberModels = [];
        }
        if (this.isWorkspaceRole) {
          var isModelExist = this.model.collection.extraMemberModels.some(function (memberModel) {
            return memberModel.get("id") === this.model.get("right_id_expand").id
          }, this);
          // only add to extraMemberModels if it doesnot exist.
          if (!isModelExist) {
            var memberModel = new MemberModel(this.model.get("right_id_expand"))
            memberModel.nodeModel = this.options.nodeModel;
            this.model.collection.extraMemberModels.push(memberModel);
          }
        }
      }
    }
  });
  cellViewRegistry.registerByColumnKey('right_id', RoleCellView);
  return RoleCellView;
});
