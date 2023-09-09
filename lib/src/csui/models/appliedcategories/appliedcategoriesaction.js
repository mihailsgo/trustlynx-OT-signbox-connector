/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/appliedcategories', 'csui/models/version',
  'csui/models/appliedcategories/category.action.server.adaptor.mixin'
], function ($, _, Backbone, Url, AppliedCategoryCollection, VersionModel, ServerAdaptorMixin) {
  'use strict';

  var AppliedCategoryActionsCollection = AppliedCategoryCollection.extend({

    constructor: function AppliedCategoryActionsCollection(attributes, options) {
      AppliedCategoryCollection.prototype.constructor.apply(this, arguments);
      this.options = options || {};
      _.defaults(this.options, {urlResource: ''});
    },

    fetch: function () {
      if (this.node instanceof VersionModel ||
          this.node.get("id") === undefined || this.options.action) {
        this.fetching = false;
        this.fetched = true;
        return $.Deferred().resolve();
      }

      return AppliedCategoryCollection.prototype.fetch.apply(this, arguments);
    },

    isFetchable: function () {
      return this.node.isFetchableDirectly ? this.node.isFetchableDirectly() : false;
    }

  });
  ServerAdaptorMixin.mixin(AppliedCategoryActionsCollection.prototype);

  return AppliedCategoryActionsCollection;

});
