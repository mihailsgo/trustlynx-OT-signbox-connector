/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/contexts/factories/connector',
  'csui/models/member',
  'csui/models/members',
  'csui/models/browsable/browsable.mixin',
  'csui/utils/url',
  'csui/controls/typeaheadpicker/typeaheadpicker.view',
  'csui-ext!csui/controls/userpicker/userpicker.view',
  'css!csui/controls/userpicker/impl/userpicker'
], function (_, $,
    ConnectorFactory, MemberModel, MemberCollection, BrowsableMixin, Url,
    TypeaheadPickerView, extensionView) {
  var PagingMemberCollection = MemberCollection.extend({

    constructor: function PagingMemberCollection(models,options){
      MemberCollection.prototype.constructor.apply(this, arguments);
      this.options = _.pick(options,"onRetrieveMembers","widgetoptions","nameAttribute");
      options.top = options.limit;
      this.makeBrowsable(options);
    },

    url: function(){
      this.query = this.filters && this.filters[this.options.nameAttribute||"name"];
      var url = MemberCollection.prototype.url.apply(this, arguments);
      var skipCount = this.skipCount ? this.skipCount - (this.mergeCount||0) : 0;
      var page = skipCount ? (Math.floor(skipCount / this.topCount)) + 1 : 1;
      return url + "&page="+page;
    },

    fetch: function() {
      var query = this.query;
      var options = this.options;
      var collection = this;
      return MemberCollection.prototype.fetch.apply(this,arguments).then(function(){
        if (typeof options.onRetrieveMembers === 'function') {
          options.onRetrieveMembers({
            collection: collection
          });
        }
        if (options.widgetoptions && options.widgetoptions.collection &&
            options.widgetoptions.collection.extraMemberModels &&
            options.widgetoptions.collection.extraMemberModels.length) {
            var filteredModels = _.filter(options.widgetoptions.collection.extraMemberModels, function (model) {
              if (!collection.comparator) {
                return model.get('name_formatted').toLowerCase().indexOf(query.toLowerCase()) !== -1;
              }
              return collection.comparator(model)
                .indexOf(query.toLowerCase()) !== -1;
            });
            var length = collection.length;
            collection.add(filteredModels,{merge:true});
            var added = collection.length - length;
            collection.mergeCount = collection.skipCount ? collection.mergeCount + added : added;
            collection.skipCount += added;
            collection.totalCount += collection.mergeCount;
        }
      }.bind(this));
    },

    parse: function(response){
      var results = MemberCollection.prototype.parse.apply(this, arguments);
      var collection = response.collection || response,
          paging     = collection.paging;
      this.totalCount = paging && paging.total_count;
      return results;
    }
  });

  BrowsableMixin.mixin(PagingMemberCollection.prototype);

  var UserPickerView = TypeaheadPickerView.extend({

    constructor: function UserPickerView(options) {

      $.extend(true,options||{},{
        css: {
          itemPicker: 'csui-control-userpicker',
          noResults: 'csui-user-picker-no-results'
        },
        expandFields: ['group_id', 'leader_id']
      });

      var connector;
      if (options.collection) {
        connector = options.collection.connector;
      } else {
        if (!options.context) {
          throw new Error('Context is missing in the constructor options');
        }
        connector = options.context.getObject(ConnectorFactory);
      }
      if (!options.model) {
        options.model = new MemberModel(undefined, {connector: connector});
      }
      if (!options.collection) {
        options.enableInfiniteScrolling = options.enableInfiniteScrolling!=null ? options.enableInfiniteScrolling : true;
        options.collection = new PagingMemberCollection(undefined, {
          onRetrieveMembers: options.onRetrieveMembers,
          widgetoptions: options.widgetoptions,
          nameAttribute: options.model.nameAttribute,
          connector: connector,
          memberFilter: options.memberFilter,
          expandFields: options.expandFields,
          limit: options.limit,
          orderBy: options.orderBy || 'asc_name',
          comparator: (!options.enableInfiniteScrolling && function (item) {
            return item.get('name_formatted').toLowerCase();
          })
        });
      }
      options.TypeaheadItemView = function(model) {
        return _.find(_.flatten(extensionView), {type: model.get('type')}).viewClass;
      };

      TypeaheadPickerView.prototype.constructor.call(this, options);

      this.listenTo(this,"typeahead:picker:open",function(){ this.trigger("userpicker:open");});
      this.listenTo(this,"typeahead:picker:close",function(){ this.trigger("userpicker:close");});

    },

  });

  return UserPickerView;

});
