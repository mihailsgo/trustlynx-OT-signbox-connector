/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

function DataManager(_, Backbone) {

  var DataManager;

  DataManager = {
    ancestorInfo: [
      {
        "volume_id": -2000,
        "id": 2000,
        "parent_id": -1,
        "name": "Enterprise",
        "type": 141,
        "type_name": "Enterprise Workspace"
      },
      {
        "volume_id": -2000,
        "id": 3346,
        "parent_id": 2000,
        "name": "Engineering",
        "type": 0,
        "type_name": "Folder"
      },
      {
        "volume_id": -2000,
        "id": 2883,
        "parent_id": 3346,
        "name": "Development",
        "type": 0,
        "type_name": "Folder"
      },
      {
        "volume_id": -2000,
        "id": 1212,
        "parent_id": 2883,
        "name": "Core Hyderabad",
        "type": 0,
        "type_name": "Folder"
      },
      {
        "volume_id": -2000,
        "id": 4040,
        "parent_id": 1212,
        "name": "SmartUI",
        "type": 0,
        "type_name": "Folder"
      },
      {
        "volume_id": -2000,
        "id": 5050,
        "parent_id": 4040,
        "name": "SmartControls",
        "type": 0,
        "type_name": "Folder"
      },
      {
        "volume_id": -2000,
        "id": 6060,
        "parent_id": 5050,
        "name": "Breadcrumbs",
        "type": 0,
        "type_name": "Folder"
      },
      {
        "volume_id": -2000,
        "id": 7070,
        "parent_id": 6060,
        "name": "Current Location",
        "type": 0,
        "type_name": "Folder"
      }
    ],
    updateCollection: function (collection) {
      var newCollection = [];
      for (var item = 0;item < DataManager.ancestorInfo.length ; item++) {
        newCollection.push(new Backbone.Model(DataManager.ancestorInfo[item]));
      }
      collection.add(newCollection);
    }
  };
  return DataManager;
}

define([
  'nuc/lib/underscore',
  'nuc/lib/backbone'
], function (_, Backbone) {
  return DataManager(_, Backbone);
});
