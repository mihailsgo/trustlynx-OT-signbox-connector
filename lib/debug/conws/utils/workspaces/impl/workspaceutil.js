/**
 * Created by stefang on 11.12.2015.
 */
csui.define([
  'csui/lib/jquery',
  'csui/lib/underscore'
], function ($, _, Backbone, NodeModel) {

  function WorkspaceUtil () {}

  _.extend(WorkspaceUtil.prototype,{

    orderByAsString: function (orderBy,defCol,defOrd) {
      var sc;

      var ret, order = {sc:defCol, so:defOrd};
      if (orderBy) {
        order = _.defaults({sc:orderBy.sortColumn,so:orderBy.sortOrder},order);
      }
      // strip curly braces from sortColumn
      if (order.sc) {
        // syntax of the sortColumn is to be checked in the constructors, so no need to
        // raise a message here
        var parameterPlaceholder = /{([^:}]+)(:([^}]+))?}/g;
        var match = parameterPlaceholder.exec(order.sc);
        if (match) {
          order.sc = match[1];
        } else {
          order.sc = undefined;
        }
      }
      // if one of column or order is defined, then we must deliver something defined
      if (order.sc || order.so) {
        // and use a constant default, if one is undefined
        ret = _.str.sformat("{0} {1}", order.sc?order.sc:"name", order.so?order.so:"asc");
      }
      return ret;
    },

    getFilterValueString: function(colattrs,colvalue,allowempty) {
      var format = filter_map[type_key(colattrs.type)];
      if (!format) {
        if (allowempty) {
          return undefined;
        }
        format = "{0}";
      }
      return _.str.sformat(format,colvalue);
    },

    getFormFieldTemplate: function (colattrs) {
      // currently only support text fields (CWS-5783) in search form.
      if (colattrs.type!==-1) {
        return undefined;
      }
      return template_map[type_key(colattrs.type,colattrs.persona)] || template_map[type_key(colattrs.type)];
    }

  });

  function type_key(type,persona) {
    return [type,persona].toString();
  }

  var filter_map = {};
  filter_map[type_key(-1,"")] = "contains_{0}";

  var template_map = {};
  template_map[type_key(-1,"")] = {
    // normal text attribute
    options: { type: "text"},
    schema: { type: "string" } };
  template_map[type_key(2,"")] =  {
    // normal integer, like size and others
    options: { type: "integer" },
    schema: { type: "integer" }
  };
    undefined; 
  template_map[type_key(2,"node")] =
    // node picker
    undefined/*= not supported */; 
  template_map[type_key(2,"user")] = {
    // user picker
    options: {
      "type": "otcs_user_picker",
      "type_control": {
        "action": "api/v1/members",
        "method": "GET",
        "name": "user001",
        "parameters": {
          "filter_types": [
            0
          ],
          "select_types": [
            0
          ]
        }
      }
    },
    schema: {
      "type": "otcs_user_picker"
    }
  };
  template_map[type_key(14,"user")] = template_map[type_key(2,"user")];
  template_map[type_key(-7,"")] = {
    // date attribute
    options: { type: "date" },
    schema: { type: "string" }
  };
  template_map[type_key(5,"")] = {
    // boolean attribute
    options: { type: "checkbox" },
    schema: { type: "boolean" }
  };

  return new WorkspaceUtil();
});
