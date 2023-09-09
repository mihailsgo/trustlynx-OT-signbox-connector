/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(function () {
  'use strict';

  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function mergeArrays(target, source) {
    if (!source) {
      return target || [];
    }
    if (!target) {
      return source || [];
    }
    for (var i = 0, l = source.length; i < l; ++i) {
      var item = source[i];
      if (target.indexOf(item) < 0) {
        target.push(item);
      }
    }
    return target;
  }
  function mergeExtraData(objects) {
    if (!Array.isArray(objects)) {
      objects = Array.prototype.slice.call(arguments);
    }
    var merged = {};
    for (var i = 0, l = objects.length; i < l; ++i) {
      var object = objects[i];
      if (!object) {
        continue;
      }
      for (var key in object) {
        if (hasOwnProperty.call(object, key)) {
          merged[key] = mergeArrays(object[key], merged[key]);
        }
      }
    }
    return merged;
  }

  return mergeExtraData;
});
