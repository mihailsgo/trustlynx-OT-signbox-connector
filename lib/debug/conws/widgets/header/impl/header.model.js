csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/mixins/node.connectable/node.connectable.mixin',
  'csui/models/member',
  'csui/lib/jquery.when.all'
], function (_, $, Backbone, Url, NodeConnectableMixin, MemberModel) {

  var HeaderModel = Backbone.Model.extend({

    // constructor gives an explicit name to the object in the debugger
    constructor: function HeaderModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.makeNodeConnectable(options);
      if (this.node.get("type") === 848) {
        // if we are initialized with a workspace node, we get initially all attributes from it
        // but note: there are no business properties yet, as the model is not yet fetched
        this.set(this.node.attributes);
      }
      this.listenTo(this.node,"change:name",function(){
        if (this.node.get("type") === 848) {
          this.set("name",this.node.get("name"));
        }
      })
    },

    // computes the REST API URL used to access the business workspace information
    // required for the header.
    url: function () {
      return Url.combine(new Url(this.connector.connection.url).getApiBase('v2'),
          '/businessworkspaces/' + this.node.get('id') +
          '?metadata&fields=categories&include_icon=true&expand=' +
          encodeURIComponent('properties{create_user_id,modify_user_id,owner_group_id,owner_user_id,reserved_user_id}'));
    },

    // parses the REST call response and stores the data
    parse: function (response) {
      // store allowed actions
      this.actions = response.results.actions && response.results.actions.data;
      // store business properties
      var data = response.results.data || {};
      this.display_urls = data.display_urls || {};
      this.business_properties = data.business_properties || {};
      // store icon information
      if (this.business_properties.workspace_widget_icon_content) {
        this.icon = {
          content: this.business_properties.workspace_widget_icon_content,
          location: 'node'
        }
      } else if (this.business_properties.workspace_type_widget_icon_content) {
        this.icon = {
          content: this.business_properties.workspace_type_widget_icon_content,
          location: 'type'
        }
      } else {
        this.icon = {
          content: null,
          location: 'none'
        }
      }
      // store category information
      this.categories = data.categories || {};
      // store metadata information
      this.metadata = response.results.metadata || {};
      // as a workaround I set these properties, as
      // otherwise the model doesn't change
      data.properties.workspace_type_id = this.business_properties.workspace_type_id;
      data.properties.workspace_type_name = this.business_properties.workspace_type_name;
      data.properties.workspace_widget_icon_content = this.icon.content;
      // return workspace node info
      return data.properties;
    },

    // true if the model is fetched already
    isWorkspaceType: function () {
      return (this.get('workspace_type_id') !== undefined);
    },

    // returns the available action if available,
    // otherwise undefined.
    hasAction: function (name) {
      var ret;
      if (this.actions) {
        ret = this.actions[name];
      }
      return ret;
    },

    expandMemberValue: function (value) {
      var self = this;
      var key = value.name + '_expand';
      var category = key.split('_')[0];
      // fetch the member information if it doesn't exist already
      if (_.isUndefined(self.categories[category][key])) {
        var ids = _.isArray(value.value) ? value.value : [value.value];
        var values = ids.slice(0);

        var deferred = [];
        _.each(ids, function (id) {
          var member = new MemberModel({id: id}, {connector: self.connector});
          deferred.push(member.fetch({
            success: function (response) {
              // append to expanded values
              values[_.indexOf(values, id)] = response.attributes;
            },
            error: function (response) {
              // append to expanded values
              values[_.indexOf(values, id)] = id;
            }
          }));
        });
        // trigger change when all items are fetched
        $.whenAll.apply($, deferred).done(function () {
          // set values and trigger 'change' event.
          self.categories[category][key] = values;
          self.trigger('change');
        });
      }
    }
  });

  NodeConnectableMixin.mixin(HeaderModel.prototype)

  // return the model
  return HeaderModel;

});
