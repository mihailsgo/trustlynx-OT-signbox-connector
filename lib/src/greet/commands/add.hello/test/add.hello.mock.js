/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery.mockjax',
  'csui/lib/jquery.parse.param', 'json!./add.hello.data.json'
], function (_, mockjax, parseParam, mockData) {
  'use strict';

  function getV2Node(node) {
    return {
      actions: getNodeActions(node),
      data: {
        properties: node
      },
      metadata: {
        properties: mockData.nodeMetadata
      }
    };
  }

  function getV2Template(template) {
    return {
      data: {
        properties: template
      }
    };
  }

  function getAncestors(nodeId, includeSelf) {
    var node = mockData.nodes[nodeId];
    if (node) {
      var path = includeSelf ? [node] : [],
          parent_id = node.parent_id.id || node.parent_id;
      if (parent_id > 0) {
        path = getAncestors(parent_id, true).concat(path);
      }
      return path;
    }
  }

  function getNodeActions(node) {
    return _
        .chain(mockData.nodeActions[node.type] || [])
        .reduce(function (result, action) {
          result[action] = {};
          return result;
        }, {})
        .value();
  }

  var mocks = [];

  return {

    enable: function () {

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/auth'),
        responseText: {}
      }));

      mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/actions(?:\\?(.*))?$'),
        urlParams: ['query'], // ids, actions
        response: function (settings) {
          var parameters = parseParam(settings.urlParams.query),
              filteredNodes = _.filter(mockData.nodes, function (node) {
                return _.contains(parameters.ids, node.id.toString());
              });
          _.each(filteredNodes, function (node) {
            node.actions = getNodeActions(node);
          });
          this.dataType = 'json';
          this.responseText = {
            results: _.reduce(filteredNodes, function (results, node) {
              if (node) {
                results[node.id] = {
                  data: node.actions
                };
              }
              return results;
            }, {})
          };
        }
      });

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/([^/?]+)(?:\\?(.*))?$'),
        urlParams: ['nodeId', 'query'], // actions, perspective
        type: 'GET',
        response: function (settings) {
          var nodeId = +settings.urlParams.nodeId,
              node = mockData.nodes[nodeId];
          this.responseText = getV2Node(node);
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/([^/]+)/nodes(?:\\?(.*))?$'),
        urlParams: ['nodeId', 'query'],
        response: function (settings) {
          var nodeId = +settings.urlParams.nodeId,
              parent = mockData.nodes[nodeId],
              allChildren = _.filter(mockData.nodes, function (node) {
                var parent_id = node.parent_id.id || node.parent_id;
                return parent_id === nodeId;
              }),
              parameters = parseParam(settings.urlParams.query),
              filterBy = _.chain(_.keys(parameters))
                  .filter(function (key) {
                    return key.indexOf('where_') === 0 && parameters[key];
                  })
                  .map(function (key) {
                    return {
                      property: key.substring(6),
                      value: parameters[key]
                    };
                  })
                  .value(),
              filteredChildren = _.filter(allChildren, function (node) {
                return _.all(filterBy, function (filterBy) {
                  var property = filterBy.property,
                      filterValue = filterBy.value.toLowerCase(),
                      actualValue = node[property];
                  if (actualValue != null) {
                    actualValue = actualValue.toString().toLowerCase();
                  }
                  switch (property) {
                  case 'type':
                    return filterValue === '-1' ? node.container :
                           filterValue === actualValue;
                  }
                  if (_.isString(actualValue)) {
                    return actualValue.toLowerCase().indexOf(filterValue) >= 0;
                  }
                  return actualValue === filterValue;
                });
              }),
              sortBy = parameters.sort,
              sortValues = sortBy ? _.isArray(sortBy) && sortBy || [sortBy] : [],
              sortCriteria = _.chain(sortValues.concat('asc_name'))
                  .compact()
                  .unique()
                  .map(function (sortBy) {
                    sortBy = sortBy.split(/_(.+)/, 2);
                    return {
                      ascending: sortBy[0] === 'asc',
                      property: sortBy[1]
                    };
                  })
                  .value(),
              sortedChildren = filteredChildren.sort(function (left, right) {
                function getValues(property) {
                  var leftValue = left[property],
                      rightValue = right[property];
                  if (property === 'type') {
                    left.container || (leftValue += 1000000);
                    right.container || (rightValue += 1000000);
                  } else if (property.indexOf('date') >= 0) {
                    leftValue && (leftValue = new Date(leftValue));
                    rightValue && (rightValue = new Date(rightValue));
                  }
                  return {
                    left: leftValue || null,
                    right: rightValue || null
                  };
                }

                var sortBy = _.find(sortCriteria, function (sortBy) {
                  var values = getValues(sortBy.property);
                  return values.left !== values.right;
                });
                if (sortBy) {
                  var values = getValues(sortBy.property);
                  return values.left > values.right === sortBy.ascending;
                }
              }),
              pageSize = +parameters.limit || 10,
              pageIndex = +parameters.page || 1,
              firstIndex = (pageIndex - 1) * pageSize,
              lastIndex = firstIndex + pageSize,
              limitedChildren = sortedChildren.slice(firstIndex, lastIndex);
          _.each(limitedChildren, function (node) {
            node.actions = getNodeActions(node);
          });
          this.responseText = {
            data: limitedChildren,
            definitions: mockData.nodeMetadata,
            definitions_order: ['type', 'name', 'size', 'modify_date', 'wnd_comments'],
            page: pageIndex,
            limit: pageSize,
            total_count: filteredChildren.length,
            page_total: Math.round(filteredChildren.length / pageSize),
            range_min: 1,
            range_max: Math.round(filteredChildren.length / pageSize),
            sort: sortBy || 'asc_name'
          };
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/([^/]+)/ancestors'),
        urlParams: ['nodeId'],
        response: function (settings) {
          var nodeId = +settings.urlParams.nodeId;
          this.responseText = {
            ancestors: getAncestors(nodeId, true)
          };
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/([^/]+)/addablenodetypes'),
        urlParams: ['nodeId'],
        response: function (settings) {
          var nodeId = +settings.urlParams.nodeId,
              response = {
                data: {},
                definitions: {}
              };
          if (nodeId === 2000) {
            var addableTypes = [
              {
                type: 12345,
                type_name: 'Hello Object'
              }
            ];
            response.data = _.reduce(addableTypes, function (result, addable) {
              result[addable.type] = '?type=' + addable.type;
              return result;
            }, {});
            response.definitions = _.reduce(addableTypes, function (result, addable) {
              result[addable.type] = {
                name: addable.type_name
              };
              return result;
            }, {});
          }
          this.responseText = response;
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/([^/]+)/hellotemplates'),
        urlParams: ['nodeId'],
        response: function (settings) {
          var nodeId = +settings.urlParams.nodeId,
              results = [];
          if (nodeId === 2000) {
            results.push.apply(results, _.map(mockData.templates, getV2Template));
          }
          this.responseText = {
            results: results
          };
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/([^/]+)/facets'),
        urlParams: ['nodeId'],
        responseText: {}
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/([^/]+)/categories'),
        urlParams: ['nodeId'],
        responseText: {}
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/forms/nodes/create\\?(.*)?$'),
        urlParams: ['query'], // parent_id, type
        response: function (settings) {
          var parameters = parseParam(settings.urlParams.query),
              parentId = +parameters.parent_id;
          if (parentId !== 2000) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.responseText = {
              error: 'Invalid parent node.'
            };
            return;
          }
          this.responseText = {
            forms: [
              {
                id: 'general',
                data: {
                  parent_id: parentId,
                  type: +parameters.type,
                  name: '',
                  description: ''
                },
                schema: mockData.generalCreateFormSchema,
                options: mockData.generalCreateFormOptions
              }
            ]
          };
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/forms/hello/create\\?(.*)?$'),
        urlParams: ['query'], // parent_id, template_id
        response: function (settings) {
          var parameters = parseParam(settings.urlParams.query),
              parentId = +parameters.parent_id,
              templateId = +parameters.template_id,
              template = _.findWhere(mockData.templates, {id: templateId});
          if (parentId !== 2000) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.responseText = {
              error: 'Invalid parent node.'
            };
            return;
          }
          if (!template) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.responseText = {
              error: 'Invalid template identifier.'
            };
            return;
          }
          this.responseText = {
            forms: [
              {
                id: 'general',
                data: {
                  parent_id: parentId,
                  template_id: templateId,
                  type: +parameters.type,
                  name: '',
                  description: ''
                },
                schema: mockData.generalCreateFormSchema,
                options: mockData.generalCreateFormOptions
              },
              mockData.categiriesCreateForm
            ]
          };
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes(?:\\?.*)?$'),
        type: 'POST',
        response: function (settings) {
          var body = JSON.parse(parseParam(settings.data).body),
              parentId = +body.parent_id,
              parent = mockData.nodes[parentId];
          if (parentId !== 2000) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.responseText = {
              error: 'Invalid parent node.'
            };
            return;
          }
          var children = _.filter(mockData.nodes, function (node) {
                var parent_id = node.parent_id.id || node.parent_id;
                return parent_id === parentId;
              }),
              conflict = _.any(children, function (child) {
                return child.name === body.name;
              });
          if (conflict) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.dataType = 'json';
            this.responseText = {
              error: 'Node with the same name already exists.'
            };
            return;
          }
          if (body.type !== 12345) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.dataType = 'json';
            this.responseText = {
              error: 'Invalid node type.'
            };
            return;
          }
          var now = new Date().toISOString().replace(/\..+$/, ''),
              node = {
                "id": 100000 + (+_.uniqueId()),
                "favorite": false,
                "name": body.name,
                "type": body.type,
                "create_date": now,
                "create_user_id": 1000,
                "description": body.description,
                "modify_date": now,
                "modify_user_id": 1000,
                "parent_id": parentId,
                "volume_id": parent.volume_id
              };
          mockData.nodes[node.id] = node;
          ++parent.size;
          this.responseText = node;
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/hellonodes(?:\\?.*)?$'),
        type: 'POST',
        response: function (settings) {
          var body = JSON.parse(settings.data.get('body')),
              parentId = +body.parent_id,
              parent = mockData.nodes[parentId],
              templateId = +body.template_id,
              template = _.findWhere(mockData.templates, {id: templateId});
          if (parentId !== 2000) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.responseText = {
              error: 'Invalid parent node.'
            };
            return;
          }
          if (!template) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.responseText = {
              error: 'Invalid template identifier.'
            };
            return;
          }
          var children = _.filter(mockData.nodes, function (node) {
                var parent_id = node.parent_id.id || node.parent_id;
                return parent_id === parentId;
              }),
              conflict = _.any(children, function (child) {
                return child.name === body.name;
              });
          if (conflict) {
            this.status = 400;
            this.statusText = 'Bad Request';
            this.dataType = 'json';
            this.responseText = {
              error: 'Node with the same name already exists.'
            };
            return;
          }
          var now = new Date().toISOString().replace(/\..+$/, ''),
              node = {
                "id": 100000 + (+_.uniqueId()),
                "favorite": false,
                "name": body.name,
                "type": 12345,
                "create_date": now,
                "create_user_id": 1000,
                "description": body.description,
                "modify_date": now,
                "modify_user_id": 1000,
                "parent_id": parentId,
                "volume_id": parent.volume_id
              };
          mockData.nodes[node.id] = node;
          ++parent.size;
          this.responseText = node;
        }
      }));

    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop())) {
        mockjax.clear(mock);
      }
    }

  };

});
