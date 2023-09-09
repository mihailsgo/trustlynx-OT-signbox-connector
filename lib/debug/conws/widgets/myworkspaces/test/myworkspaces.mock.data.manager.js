csui.define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.mockjax', 'csui/utils/log',
  'conws/utils/test/testutil'
], function (_, $, mockjax, log, TestUtil) {

      var doLog      = false,
          logConsole = function (logobj) {
            doLog && log.info(logobj) && console.log(log.last);
          };

      var baseUrl               = '//server/otcs/cs/api/v2/businessworkspaces',
          metadataCustomColumns = {
            "124_1": {
              "align": "center",
              "name": "Rating",
              "sort": true,
              "type": -1,
              "width_weight": 1
            },
            "123_2": {
              "align": "left",
              "name": "Industry",
              "sort": true,
              "type": -1,
              "width_weight": 1
            },
            "123_1": {
              "align": "left",
              "name": "Area",
              "sort": true,
              "type": -1,
              "width_weight": 1
            },
            "123_3": {
              "align": "left",
              "name": "Number",
              "sort": true,
              "type": 2,
              "width_weight": 1
            }
          },
          metadataNode          = {
            "size": {
              "align": "right",
              "name": "Size",
              "persona": "",
              "sort": false,
              "type": 2,
              "width_weight": 0
            },
            "favorite": {
              "align": "center",
              "name": "Favorite",
              "persona": "",
              "type": 5,
              "width_weight": 0
            },
            "id": {
              "align": "right",
              "name": "ID",
              "persona": "node",
              "sort": false,
              "type": 2,
              "width_weight": 0
            },
            "modify_date": {
              "align": "left",
              "name": "Modified",
              "persona": "",
              "sort": false,
              "type": -7,
              "width_weight": 0
            },
            "name": {
              "align": "left",
              "name": "Name",
              "persona": "",
              "sort": true,
              "type": -1,
              "width_weight": 100
            },
            "type": {
              "align": "center",
              "name": "Type",
              "persona": "",
              "sort": false,
              "type": 2,
              "width_weight": 0
            },
            "wnd_modifiedby": {
              "align": "center",
              "name": "Modified By",
              "persona": "user",
              "sort": false,
              "type": 2,
              "width_weight": 0
            },
            "type_name": {
              "align": "left",
              "name": "Type",
              "persona": "",
              "sort": false,
              "type": -1,
              "width_weight": 1
            },
            "container": {
              "align": "center",
              "name": "Container",
              "persona": "",
              "sort": false,
              "type": 5,
              "width_weight": 0
            }
          },
          DataManager           = function DataManager() {
          };

      DataManager.returnError = function (workspaceTypeId, filterColumn) {
        var sorting  = "asc_name",
            pageSize = 30,
            errorURL = baseUrl + '?where_workspace_type_id=' + workspaceTypeId +
                       '&fields=' +
                       encodeURIComponent('properties{124_1,wnd_modifiedby,123_2,123_1,type,name,size,modify_date,favorite,id,type_name,container}') +
                       '&action=properties-properties' +
                       '&expanded_view=true&expand_users=true' + '&limit=' + pageSize + '&page=' +
                       '1' +
                       '&sort=' + sorting + '&global_metadata&where_' + filterColumn + '=error';
        logConsole("adding url to mockjax: " + errorURL);
        mockjax({
          url: errorURL,
          responseTime: 0,
          status: 404,
          statusText: 'Invalid response received.'
        });
        return "Invalid response received.";
      };

      DataManager.test = function (totalCount, title, workspaceTypeId, defaultAction, addCustomColumns) {
        DataManager._prepare(totalCount, title, workspaceTypeId, defaultAction, addCustomColumns);
      };

      DataManager.testIntCustomColumn = function (totalCount, title, workspaceTypeId, defaultAction) {
        DataManager._prepare(totalCount, title, workspaceTypeId, defaultAction, false, true);
      };

      // Provide to filter by custom column 123_1 additionally to name
      DataManager.testAddFilterExpanded123_1 = function (totalCount, title, workspaceTypeId, defaultAction) {
        DataManager._prepare(totalCount, title, workspaceTypeId, defaultAction, true, false, true);
      };

      // Prepare proper mockjax calls
      DataManager._prepare = function (totalCount, title, workspaceTypeId, defaultAction, addCustomColumns,
          addIntCustomColumns, filter123_1) {
        totalCount = totalCount + 1;
        // Create calls for all possibilities
        var sorting  = ["asc_name", "desc_name"],
            pageSize = 30,
            pages    = Math.floor(totalCount / pageSize);

        if (addCustomColumns) {
          sorting.push("asc_123_1", "desc_123_1", "asc_123_2", "desc_123_2", "asc_124_1",
              "desc_124_1");
        }

        // Get correct number of calls needed for paging
        if (totalCount % pageSize > 0) {
          pages++;
        }

        DataManager._provideMockjax(totalCount, title, workspaceTypeId, defaultAction, addCustomColumns, sorting,
            pageSize, pages, false, undefined, addIntCustomColumns);

        // prepare 50 less hits (at least 5) with for filter called 'filter'
        totalCount = totalCount > 50 ? totalCount - 50 : 5;
        var filter = 'filter';
        title = title + filter;
        DataManager._provideMockjax(totalCount, title, workspaceTypeId, defaultAction, addCustomColumns, sorting,
            pageSize, pages, filter, filter123_1);

        // Satisfy the favourite star button, which fetches favourite groups
        // speculatively in the background.
        mockjax({
          url: new RegExp('^//server/otcs/cs/api/v2/members/favorites(\\?.*)?'),
          responseTime: 0,
          responseText: {
            results: []
          }
        });
      };

      DataManager._provideMockjax = function (totalCount, title, workspaceTypeId, defaultAction, addCustomColumns,
          sorting, pageSize, pages, filter, filter123_1, addIntCustomColumns) {
        for (var i = 0; i <= pages; i++) {
          var limit      = pageSize,
              page       = i + 1,
              idFrom     = pageSize * i + 1,
              idTo       = pageSize * i + pageSize + 1,
              filterPart = '';
          idTo = idTo > totalCount ? totalCount : idTo;

          if (filter) {
            filterPart = '&where_name=contains_' + filter;
          }
          if (filter123_1) {
            filterPart = filterPart + '&where_123_1=contains_' + filter;
          }

          var fieldsCollapsedParam = '&fields=' +
                                     encodeURIComponent('properties{id,container,name,type,type_name}') +
                                     '&action=properties-properties',
              fieldsExpandedParam  = '',
              metadataParam        = '&global_metadata';

          if (addCustomColumns) {
            fieldsExpandedParam = '&fields=' +
                                  encodeURIComponent('properties{124_1,wnd_modifiedby,123_2,123_1,type,name,size,modify_date,favorite,id,type_name,container}') +
                                                     '&action=properties-properties';
          } else if (addIntCustomColumns) {
            fieldsExpandedParam = '&fields=' +
                                  encodeURIComponent('properties{123_3,type,name,size,modify_date,favorite,id,type_name,container}') +
                                  '&action=properties-properties';
          } else {
            fieldsExpandedParam = '&fields=' +
                                  encodeURIComponent('properties{type,name,size,modify_date,favorite,id,type_name,container}') +
                                  '&action=properties-properties';
          }

          sorting.forEach(function (sort) {
            var urls         = [
                  baseUrl + '?where_workspace_type_id=' + workspaceTypeId + fieldsExpandedParam +
                  '&expanded_view=true' + '&limit=' + limit + '&page=' + page +
                  metadataParam + '&expand_users=true&sort=' + sort + filterPart,
                  baseUrl + '?where_workspace_type_id=' + workspaceTypeId + fieldsExpandedParam +
                  '&expanded_view=true' + '&limit=' + limit + '&page=' + page +
                  '&expand_users=true&sort=' + sort + filterPart + metadataParam,
                  baseUrl + '?where_workspace_type_id=' + workspaceTypeId + fieldsExpandedParam +
                  '&expanded_view=true&expand_users=true' + '&limit=' + limit + '&page=' + page +
                  '&sort=' + sort + metadataParam + filterPart,
                  baseUrl + '?where_workspace_type_id=' + workspaceTypeId + fieldsExpandedParam +
                  '&limit=' + limit + '&expanded_view=true&expand_users=true' + '&page=' + page +
                  metadataParam + '&sort=' + sort + filterPart,
                  baseUrl + '?where_workspace_type_id=' + workspaceTypeId + fieldsExpandedParam +
                  '&expanded_view=true&expand_users=true' + '&limit=' + limit + '&page=' + page +
                  '&sort=' + sort + metadataParam + filterPart
                ],
                responseText = DataManager._createElements(workspaceTypeId, defaultAction, idFrom, idTo, title,
                    totalCount, sort, addCustomColumns || addIntCustomColumns, filter, filter123_1);
            urls.forEach(function (url) {
              logConsole("adding url to mockjax: " + url);
              mockjax({
                url: url,
                responseTime: 0,
                response: _.partial(function(options,responseText) {
                  TestUtil.assertWkspMockConsistency(options.url,responseText,'my workspaces 1');
                  this.status = 200;
                  this.responseText = responseText;
                },_,responseText)
              });
            });
          });

          // For collapsed view no custom columns are fetched and expanded_view is false
          var urls = [
            baseUrl + '?where_workspace_type_id=' + workspaceTypeId + fieldsCollapsedParam +
            '&expanded_view=false' + '&limit=' + limit + '&page=' + page + metadataParam +
            filterPart
          ];
          var responseText = DataManager._createElements(workspaceTypeId, defaultAction, idFrom, idTo, title,
              totalCount, undefined, false, filter, filter123_1);
          urls.forEach(function (url) {
            logConsole("adding url to mockjax: " + url);
            mockjax({
              url: url,
              responseTime: 0,
              response: _.partial(function(options,responseText) {
                TestUtil.assertWkspMockConsistency(options.url,responseText,'my workspaces 2');
                this.status = 200;
                this.responseText = responseText;
              },_,responseText)
            });
          });
        }
      };

      DataManager._createElements = function (workspaceTypeId, defaultAction, idFrom, idTo, name, totalCount,
          sorting, addCustomColumns, filter, filter123_1) {
        var filter123_1Value = filter123_1 ? 'filter' : '';

        var compareWorkspacesDesc   = function (a, b) {
              if (a.data.properties.name < b.data.properties.name) {
                return 1;
              }
              if (a.data.properties.name > b.data.properties.name) {
                return -1;
              }
              return 0;
            }, compareWorkspacesAsc = function (a, b) {
              if (a.data.properties.name < b.data.properties.name) {
                return -1;
              }
              if (a.data.properties.name > b.data.properties.name) {
                return 1;
              }
              return 0;
            },
            response                = {
              results: [],
              paging: {
                total_count: totalCount,
                actions: {next: {}}
              },
              wksp_info: {},
              meta_data: {},
              meta_data_order: {}
            };

        var fav = true;
        if (idFrom < idTo) {
          for (var i = idFrom; i < idTo; i++) {

            fav = !fav;
            var date = new Date(new Date().setDate(new Date().getDate() - i));
            var dd = date.getDate();
            var mm = date.getMonth() + 1;
            var yyyy = date.getFullYear();
            if (dd < 10) {
              dd = '0' + dd
            }
            if (mm < 10) {
              mm = '0' + mm
            }
            date = yyyy + '-' + mm + '-' + dd;

            var data = {data: {}};
            var size = Math.floor(Math.random() * (10 - 1));
            data.data.properties = {
              container: true,
              id: i,
              name: name + i,
              type: 848,
              type_name: "Business Workspace",
              modify_date: date + "T12:27:07",
              favorite: !fav,
              size: size,
              size_formatted: size + " Items",
              wnd_modifiedby: 1000,
              wnd_modifiedby_expand: {
                name: "Admin",
                type_name: "User"
              }
            };

            if(defaultAction){
              data.actions = {
                "data": {
                  "open": {
                    "body": "",
                    "content_type": "",
                    "form_href": "",
                    "href": "/api/v2/nodes/" + i + "/nodes",
                    "method": "GET",
                    "name": "Open"
                  }
                },
                "map": {
                  "default_action": "open"
                },
                "order": [
                  "open"
                ]
              };
            }


            response.results.push(data);
            if (addCustomColumns) {
              _.extend(response.results[response.results.length - 1].data.properties, {
                "123_1": "Europa" + Math.floor(Math.random() * (10 - 1)) + filter123_1Value,
                "123_2": Math.floor(Math.random() * (10 - 1)) + 1,
                "124_1": "High Tech" + Math.floor(Math.random() * (10 - 1)),
                "123_3": 1
              });

              _.extend(response.meta_data.properties,
                  metadataCustomColumns);
            }
          }
        }

        // order
        if (sorting && sorting.indexOf("desc") > -1) {
          response.results.sort(compareWorkspacesDesc);
        } else {
          response.results.sort(compareWorkspacesAsc);
        }

        // Metadata
        response.meta_data = {};
        response.meta_data.properties = metadataNode;

        if (addCustomColumns) {
          _.extend(response.meta_data.properties, metadataCustomColumns);
        }

        response.meta_data_order = { properties: null };

        var icon = null;
        if (workspaceTypeId < 3) {
          icon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjU1MS4wNjJweCIgaGVpZ2h0PSI1NTEuMDYycHgiIHZpZXdCb3g9IjAgMCA1NTEuMDYyIDU1MS4wNjIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU1MS4wNjIgNTUxLjA2MjsiDQoJIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPHBhdGggZD0iTTQ2NS4xOSw0NTMuNDU5YzE0Ljc0OSw2Ny42ODgtNTguNzUyLDgyLjM3NS05MS4xMjcsNzMuNTYycy05OC40MS0xMC4yODEtOTguNDEtMTAuMjgxcy02Ni4yMTgsMS40NjktOTguNTkzLDEwLjI4MQ0KCQljLTMyLjM3NSw4Ljg3NC0xMDUuOTM3LTUuODc1LTkxLjI0OS03My41NjJzNzkuNDM4LTY0Ljc1LDk3LjE4Ni0xNTUuOTk5YzE3LjY4Ny05MS4yNDksOTIuNzE4LTg1LjM3NCw5Mi43MTgtODUuMzc0DQoJCXM3NC44NDctNS44NzUsOTIuNTM1LDg1LjM3NEMzODUuODc1LDM4OC43MDksNDUwLjUwMiwzODUuNzcxLDQ2NS4xOSw0NTMuNDU5eiBNMzQzLjU4NiwyMDYuMTUNCgkJYzM5Ljg0MSwxMS41MDUsODMuODQ0LTE5Ljk1MSw5OC4zNDktNzAuMjU4YzE0LjUwNC01MC4yNDUtNS45OTgtMTAwLjMwNy00NS44MzktMTExLjgxMg0KCQljLTM5Ljg0Mi0xMS41MDYtODMuODQ0LDE5Ljk1MS05OC4zNDksNzAuMjU4QzI4My4yNDMsMTQ0LjU4MywzMDMuNzQ1LDE5NC42NDUsMzQzLjU4NiwyMDYuMTV6IE01MDguNzAzLDE4Ny44NTINCgkJYy0zOC4zNzItMTUuNjY4LTg1LjQ5NiwxMC44OTQtMTA1LjI2NCw1OS4zNjNjLTE5Ljc2OCw0OC40NzEtNC43MTIsMTAwLjQzLDMzLjY2LDExNi4wMzUNCgkJYzM4LjM3MiwxNS42MDYsODUuNDk2LTEwLjg5NCwxMDUuMjY0LTU5LjM2NEM1NjIuMTMxLDI1NS40MTYsNTQ3LjA3NiwyMDMuNTE5LDUwOC43MDMsMTg3Ljg1MnogTTIwNy40MTYsMjA2LjE1DQoJCWMzOS44NDEtMTEuNTA2LDYwLjM0My02MS41NjcsNDUuODM5LTExMS44MTJzLTU4LjU2OC04MS43MDItOTguMzQ5LTcwLjE5NmMtMzkuNzgsMTEuNTA1LTYwLjM0Myw2MS41NjYtNDUuODM5LDExMS44MTINCgkJQzEyMy41NzIsMTg2LjE5OSwxNjcuNTc1LDIxNy42NTUsMjA3LjQxNiwyMDYuMTV6IE0xMTMuOTYzLDM2My4yNWMzOC4zNzMtMTUuNjY3LDUzLjQyOC02Ny42MjYsMzMuNjYtMTE2LjAzNQ0KCQlzLTY2Ljg5Mi03NS4wMzEtMTA1LjI2NC01OS4zNjNDMy45ODcsMjAzLjUxOS0xMS4wNjgsMjU1LjQ3OCw4LjcsMzAzLjg4NkMyOC40NjcsMzUyLjM1Niw3NS41OTEsMzc4LjkxNywxMTMuOTYzLDM2My4yNXoiLz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K';
        }

        response.wksp_info.wksp_type_icon = icon;

        return response;
      };

      return DataManager;
    }
)
;
