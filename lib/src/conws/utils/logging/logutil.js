/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([], function () {
  'use strict';

  var LogUtil = {
    stringify: function stringify(value,depth) {

      function stringifyValue(value,level) {

        var result;

        var index = visited.indexOf(value);
        if (index>=0) {
          index = cycles.indexOf(value);
          if (index<0) {
            index = cycles.push(value)-1;
          }
          result = 'cycle('+index+')';
        } else if (typeof value === "function") {
          if (value.prototype && value.prototype.constructor && value.prototype.constructor.name) {
            result = 'function '+value.prototype.constructor.name+'(...){...}';
          } else {
            result = 'function(...){...}';
          }
        } else if (value===null) {
          result = 'null';
        } else if (value===undefined) {
          result = 'undefined';
        } else if (Array.isArray(value)) {
          if (value.length>0) {
            if (level===undefined || level>0) {
              result = [];
              visited.push(value);
              value.forEach(function(el){
                result.push(stringifyValue(el,level&&level-1));
              });
              result = '[' + result.join() + ']';
              index = cycles.indexOf(value);
              if (index>=0) {
                result = 'cycle('+index+')' + result;
              }
            } else {
              result = '[...' + value.length + '...]';
            }
          } else {
            result = '[]';
          }
        } else if (typeof value === "object") {
          var keys = Object.keys(value);
          if (keys.length>0) {
            if (level===undefined || level>0) {
              result = [];
              visited.push(value);
              keys.forEach(function(el){
                result.push(stringifyValue(el,level&&level-1) + ':' + stringifyValue(value[el],level&&level-1));
              });
              result = '{' + result.join() + '}';
              index = cycles.indexOf(value);
              if (index>=0) {
                result = 'cycle('+index+')' + result;
              }
            } else {
              result = '{...' + keys.length + '...}';
            }
          } else {
            result = '{}';
          }
        } else {
          result = JSON.stringify(value);
        }

        if (result===undefined) {
          result = 'undefined';
        }

        return result;

      }

      if (arguments.length<2) {
        depth = 10;
      }

      var visited = [], cycles = [];
      return stringifyValue(value,depth);
    }

  };

  return LogUtil;

});
