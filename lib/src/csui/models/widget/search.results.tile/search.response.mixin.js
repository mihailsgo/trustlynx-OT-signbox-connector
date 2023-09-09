/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore', 'csui/utils/base', 'csui/utils/accessibility',
    'csui/models/ancestor', 'csui/models/node/node.model'
], function (_, base, Accessibility, AncestorModel, NodeModel) {
  'use strict';
  var accessibleTable = Accessibility.isAccessibleTable();
  var SearchResponseMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeSearchResponse: function (options) {
          return this;
        },
        parseSearchResponse: function (resp, options) {
          var sorting = resp.collection.sorting;
          this.orderBy = (this.orderBy) ? this.orderBy : sorting && sorting.sort && sorting.sort[0];
          this.previousOrderBy = this.orderBy;
          var jsonResponse = resp.results;
          if (jsonResponse) {
            for (var response in jsonResponse) {
              if (jsonResponse.hasOwnProperty(response)) {
                if (!!jsonResponse[response].data && !!jsonResponse[response].data.properties) {
                  if (!!jsonResponse[response].nickname) {
                    jsonResponse[response].data.properties.nickname = jsonResponse[response].nickname;
                  }
                  if (!!jsonResponse[response].data.versions &&
                      !!jsonResponse[response].data.versions.file_size) {
                    jsonResponse[response].data.properties.size = jsonResponse[response].data.versions.file_size;
                  }
                  if (!!jsonResponse[response].data.versions &&
                      !!jsonResponse[response].data.versions.version_id) {
                    jsonResponse[response].data.properties.version_id = jsonResponse[response].data.versions.version_id;
                  }
                  if (!!jsonResponse[response].data.properties &&
                      !!jsonResponse[response].data.properties.container &&
                      jsonResponse[response].data.properties.container) {
                    jsonResponse[response].data.properties.size = jsonResponse[response].data.properties.container_size;
                  }
                  if (!!jsonResponse[response].data.properties.reserved_user_id_expand) {
                    jsonResponse[response].data.properties.reserved_user_id = jsonResponse[response].data.properties.reserved_user_id_expand;
                  }
                }

                if (!!jsonResponse[response].links && !!jsonResponse[response].links.ancestors) {
                  var breadcrumbsObj = [],
                      ancestors      = jsonResponse[response].links.ancestors,
                      ancestorIds    = [];
                  if (ancestors) {
                    for (var breadcrumbIdx in ancestors) {
                      if (ancestors.hasOwnProperty(breadcrumbIdx)) {
                        var ancestorModel = new AncestorModel();
                        var breadcrumbIndex = parseInt(breadcrumbIdx, 10),
                            breadcrumbItem  = {};
                        var currentObject = ancestors[breadcrumbIndex];
                        breadcrumbItem.id = currentObject.href.substring(
                            currentObject.href.lastIndexOf("/") + 1,
                            currentObject.href.length);
                        breadcrumbItem.volume_id = breadcrumbIndex === 0 ?
                                                   breadcrumbItem.id : ancestorIds[0];
                        breadcrumbItem.parent_id = breadcrumbIndex === 0 ? '-1' :
                                                   ancestorIds[breadcrumbIndex - 1];
                        if (NodeModel.usesIntegerId) {
                          breadcrumbItem.id = parseInt( breadcrumbItem.id );
                          breadcrumbItem.volume_id = parseInt(breadcrumbItem.volume_id);
                          breadcrumbItem.parent_id = parseInt(breadcrumbItem.parent_id);
                        }
                        ancestorIds.push(breadcrumbItem.id);
                        breadcrumbItem.name = currentObject.name;
                        breadcrumbItem.showAsLink = true;
                        ancestorModel.attributes = breadcrumbItem;
                        breadcrumbsObj.push(ancestorModel);
                      }
                    }
                  }
                  jsonResponse[response].data.properties.ancestors = breadcrumbsObj;
                }
                for (var region in jsonResponse[response].data.regions) {
                  if (jsonResponse[response].data.regions.hasOwnProperty(region)) {
                    jsonResponse[response].data.properties[region] = jsonResponse[response].data.regions[region];

                  }
                }
                if (!!jsonResponse[response].search_result_metadata) {
                  jsonResponse[response].data.properties.search_result_metadata = jsonResponse[response].search_result_metadata;
                }
              }
            }
          }
        },

        parseBrowsedItems: function (response, options) {
          return response.results;
        },

       
      });
    }
  };

  return SearchResponseMixin;
});
