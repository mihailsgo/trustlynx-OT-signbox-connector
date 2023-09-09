csui.define(['csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model',
  "csui/models/nodechildren"
], function (_, Backbone, Url, ConnectableMixin, NodeChildrenColumnModel,
    NodeChildrenColumnCollection, NodeModel, NodeChildrenCollection) {

  var TeamColumnModel = NodeChildrenColumnModel.extend({});

  var TeamColumnCollection = NodeChildrenColumnCollection.extend({

    model: TeamColumnModel,

    // private
    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey === 'type' || columnKey === 'name' || columnKey === 'modify_date') {
          column.sort = true;
        }
      });
      return columns;
    }

  });

  var TeamModel = NodeModel.extend({

    parse: function (response, options) {
      this.memberType = response.memberType;
      this.member = response.member;
      this.roles = response.roles;
      return NodeModel.prototype.parse.call(this, response, options);
    },

    getLeadingRole: function () {
      var first = '';
      var lead = '';
      var roles = this.roles;
      _.each(roles, function (role) {
        first = roles[0].name;
        if (role.leader) {
          lead = role.name;
        }
      });
      return lead || first;
    },

    getRolesIndicator: function () {
      var ret = '';
      if (this.roles.length > 1) {
        ret = '+' + (this.roles.length - 1);
      }
      return ret;
    },

    getMemberType: function () {
      var ret = 'user';
      var member = this.member;
      if (member && member.type !== 0) {
        ret = 'group';
      }
      return ret;
    },

    // whenever the icon url has changed, trigger model
    // change event
    setIconUrl: function (url) {
      if (this.iconUrl !== url) {
        this.iconUrl = url;
        this.trigger('change', this, this.options);
      }
    },

    // gets the icon url
    getIconUrl: function () {
      return this.iconUrl;
    }
  });

  var TeamCollection = NodeChildrenCollection.extend({

        model: TeamModel,

        constructor: function TeamCollection(attributes, options) {
          Backbone.Collection.prototype.constructor.apply(this, arguments);
          this.context = options && options.context ? options.context : undefined;
          this.makeNodeResource(options)
              .makeConnectable(options)
              .makeBrowsable(options);

          this.columns = new TeamColumnCollection();
          this.listenTo(this, "sync", this._sortByName);
        },

        url: function () {
          var id = this.node.get('id');
          var url = this.connector.getConnectionUrl().getApiBase('v2');
          return Url.combine(url, 'businessworkspaces', id, 'roles?fields=members');
        },

        fetch: function () {
          return this.Fetchable.fetch.apply(this, arguments);
        },

        parse: function (response) {

          var team = {};

          var roles = response.results;
          _.each(roles, function (role, i) {
            // add display_name to role
            var r = _.clone(role.data.properties);
            r = _.extend({display_name: r.name}, r);
            var hasMembers = role.data.members.length;
            if (hasMembers) {
              // role has members
              _.each(role.data.members, function (member, j) {
                var teamMember = team[member.id];
                if (!teamMember) {
                  teamMember = {
                    data: {
                      properties: _.clone(member)
                    },
                    memberType: 'member',
                    member: _.clone(member),
                    roles: []
                  };
                  team[member.id] = teamMember;
                }
                teamMember.roles.push(r);
              });
            }
            else {
              // role is empty
              var teamRole = {
                data: {
                  properties: r
                },
                memberType: 'role',
                member: undefined,
                roles: [r]
              };
              team[role.data.properties.id] = teamRole;
            }
          });

          // return team
          return _.values(team);
        },

        _sortByName: function () {
          this.comparator = function (model1, model2) {
            // sorting by memeber type -> 'role' or 'member'
            // if both from the same type, sorting by display_name
            var type1 = model1.memberType;
            var type2 = model2.memberType;

            var name1, name2;
            if (type1 === type2) {	
			  name1 = !!model1.get('display_name') ? model1.get('display_name').toLowerCase() : undefined
			  name2 = !!model2.get('display_name') ? model2.get('display_name').toLowerCase() : undefined
            }
            return type1 > type2 ? 1 :
                   type1 < type2 ? -1 : type1 === type2 && name1 > name2 ? 1 :
                                        type1 === type2 && name1 < name2 ? -1 : 0;
          };
          this.sort();
        }
      }
  );

  ConnectableMixin.mixin(TeamCollection.prototype);
  return TeamCollection;

});
