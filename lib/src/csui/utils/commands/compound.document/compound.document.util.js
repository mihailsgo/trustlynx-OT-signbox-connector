/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore'],
  function (_) {

    function verifyNodeAncestors(context) {
      var ancestorCollection, isAncestorReleaseOrRevision;
      ancestorCollection = _.has(context._factories.ancestors.property, "models") &&
        context._factories.ancestors.property.models;
      isAncestorReleaseOrRevision = _.find(ancestorCollection, function (ancestor) {
        return _.contains([138, 139], ancestor.attributes.type);
      });
      if (!!isAncestorReleaseOrRevision) {
        return false;
      }
      else {
        return true;
      }
    }
    return {
      verifyNodeAncestors: verifyNodeAncestors,
    };
  });