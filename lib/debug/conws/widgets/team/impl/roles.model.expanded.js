csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/utils/base',
  'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/node.connectable/node.connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model',
  'csui/models/nodechildren',
  'csui/models/browsable/client-side.mixin',
  'conws/widgets/team/impl/cells/metadata',
  'conws/widgets/team/impl/roles.columns',
  'conws/widgets/team/impl/participant.model',
  'i18n!conws/widgets/team/impl/nls/team.lang'
], function (_, $, Backbone, base, Url, ConnectableMixin, NodeConnectableMixin, FetchableMixin,
    NodeChildrenColumnModel, NodeChildrenColumnCollection, NodeModel, NodeChildrenCollection,
    ClientSideBrowsableMixin, Metadata, RolesTableColumnCollection, ParticipantModel, lang) {

  var RolesColumnModel = NodeChildrenColumnModel.extend({
    constructor: function RolesColumnModel() {
      NodeChildrenColumnModel.prototype.constructor.apply(this, arguments);
    }
  });

  var RolesColumnCollection = NodeChildrenColumnCollection.extend({

    model: RolesColumnModel,

    // private
    getColumnModels: function (columnKeys, definitions) {
      // get column collection
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      // enable sorting for all columns except 'avatar' column.
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey !== RolesTableColumnCollection.columnNames.avatar) {
          column.sort = true;
        }
      });
      // return
      return columns;
    }
  });

  // TODO: RolesModel and TeamModel have the same implementation. Refactor to have
  // TODO: a base implementation.
  var RoleModel = NodeModel.extend({

    constructor: function RoleModel(attributes, options) {
      NodeModel.prototype.constructor.apply(this, arguments);
      // update the role attributes
      this.set({
        'conws_rolename': this.displayName(),
        'conws_rolemembers': this.displayMembers(),
        'conws_rolename_formatted': this.displayNameFormatted(),
        'name': this.nameFormatted()
      });
    },

    urlBase: function () {
      var wid = this.collection && this.collection.node && this.collection.node.get('id');
      var rid = this.get('id');
      var url = this.connector.getConnectionUrl().getApiBase('v2');
      return Url.combine(url, 'businessworkspaces', wid, 'roles', rid);
    },

    parse: function (response, options) {

      var self = this;
      // members
      var col = new Backbone.Collection();

      // comperator for members collection using the display name
      col.comparator = function (m1, m2) {
        var ret1 = m1.get('display_name');
        var ret2 = m2.get('display_name');

        return ret1.localeCompare(ret2);
      }

      _.each(response.data.members, function (m) {
        var mm = new ParticipantModel(m, options);
        col.push(mm);
      });

      // sort the members collection for the role
      col.sort();

      this.members = col;
      // parse
      return NodeModel.prototype.parse.call(this, response, options);
    },

    displayName: function () {
      var ret = this.get('display_name');
      return ret;
    },

    displayNameFormatted: function () {
      return this.get('leader') ? (this.get('display_name') + ' ' + lang.rolesNameColTeamLead) : this.get('display_name');
    },

    nameFormatted: function () {
      return this.get('leader') ? (this.get('name') + ' ' + lang.rolesNameColTeamLead) : this.get('name');
    },

    displayMembers: function () {
      var ret = this.getLeadingMember();
      if (ret) {
        var indicator = this.getMembersIndicator();
        if (indicator) {
          ret = ret + ' ' + indicator;
        }
      }
      return ret;
    },

    getLeadingMember: function () {
      var first = '';
      if (this.members && this.members.length > 0) {
        first = this.getMemberName(this.members.at(0));
      }
      return first;
    },

    getMembersIndicator: function () {
      var ret = '';
      if (this.members.length > 1) {
        ret = '+' + (this.members.length - 1);
      }
      return ret;
    },

    getMemberName: function (member) {
      var ret = '';
      if (member) {
        ret = member.get('display_name') ? member.get('display_name') : member.get('name');
      }
      return ret;
    },

    getMemberType: function () {
      return 'role';
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
    },

    // evaluates the 'delete-role' action and returns
    // true if available
    canDelete: function () {
      return (this.actions.get('delete-role') !== undefined);
    }
  });

  // TODO: RoleCollection and TeamCollection differ only in the parsing
  // TODO: function. Refactor to have a base implementation.
  var RoleCollection = Backbone.Collection.extend({

        model: RoleModel,

        constructor: function RoleCollection(attributes, options) {
          _.defaults(options, {orderBy:  RolesTableColumnCollection.columnNames.name + ' asc'});
          Backbone.Collection.prototype.constructor.apply(this, arguments);
          this.context = options && options.context ? options.context : undefined;
          // Support collection cloning
          if (options) {
            this.options = _.pick(options, ['connector', 'context', 'autoreset', 'node',
              'includeResources', 'fields', 'expand', 'commands']);
          }
          this.makeConnectable(options)
              .makeNodeConnectable(options)
              .makeFetchable(options)
              .makeClientSideBrowsable(options);

          this.columns = new RolesColumnCollection();
        },

        clone: function () {
          // Provide the options; they may include connector and other parameters
          var clone = new this.constructor(this.models, this.options);
          // Clone sub-models not covered by Backbone
          if (this.columns) {
            clone.columns.reset(this.columns.toJSON());
          }
          // Clone properties about the full (not-yet fetched) collection
          clone.actualSkipCount = this.actualSkipCount;
          clone.totalCount = this.totalCount;
          clone.filteredCount = this.filteredCount;
          return clone;
        },

        url: function () {
          var id = this.node.get('id');
          var url = this.connector.getConnectionUrl().getApiBase('v2');
          return Url.combine(url, 'businessworkspaces', id, 'roles?fields=members');
        },

        parse: function (response) {

          // roles
          var roles = response.results;
          _.each(roles, function (role) {
            // add display name to role
            role.data.properties = _.extend({display_name: role.data.properties.name},
                role.data.properties);
          });

          // create metadata for custom column models
          var metadata = {
            conws_roleavatar: Metadata.integer(
                RolesTableColumnCollection.columnNames.avatar, lang.rolesAvatarColTitle),
            conws_rolename: Metadata.string(
                RolesTableColumnCollection.columnNames.name, lang.rolesNameColTitle),
            conws_rolemembers: Metadata.string(
                RolesTableColumnCollection.columnNames.roles, lang.rolesParticipantsColTitle)
          };

          // create column models
          this.columns && this.columns.resetCollection(
              this.columns.getColumnModels(_.keys(metadata), metadata), this.options);

          // return roles
          return roles;
        }
      }
  );
  ClientSideBrowsableMixin.mixin(RoleCollection.prototype);
  ConnectableMixin.mixin(RoleCollection.prototype);
  NodeConnectableMixin.mixin(RoleCollection.prototype);
  FetchableMixin.mixin(RoleCollection.prototype);
  return RoleCollection;

});
