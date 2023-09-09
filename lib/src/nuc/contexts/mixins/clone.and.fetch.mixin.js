/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/lib/backbone'
], function (_, Backbone) {
  'use strict';

  var CloneAndFetchMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeCloneAndFetch: function (options) {
          return this;
        },

        cloneAndFetch: function (options) {
          this.originalProperty = this.property;
          this.property = this.originalProperty.clone();

          if (this.originalProperty.autoreset !== undefined && this.property.autoreset ===
              undefined) {
            this.property.autoreset = this.originalProperty.autoreset;
          }

          return this.fetch(options);
        },

        copyFetchedResultsToOriginalProperty: function () {
          if (this.originalProperty instanceof Backbone.Collection) {

            var attributesToCopyBack = ['actualSkipCount', 'totalCount', 'filteredCount',
              'skipCount', 'topCount', 'orderBy', 'filters', 'orderOnRequest', 'pagination'];
            _.each(attributesToCopyBack, function (attributeName) {
              if (this.property[attributeName] !== undefined) {
                this.originalProperty[attributeName] = this.property[attributeName];
              }
            }, this);

            this.originalProperty.reset(this.property.models);
          } else {
            if (this.originalProperty instanceof Backbone.Model) {
              this.originalProperty.set(this.property.attributes);
            } else {
              throw new Error('Unsupported property');
            }
          }
          this.property = this.originalProperty;
          delete this.originalProperty;
        }

      });
    }
  };

  return CloneAndFetchMixin;
});
