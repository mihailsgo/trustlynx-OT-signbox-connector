/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/controls/toolbar/toolitems.mask'
], function (
  ToolItemsMask) {

  'use strict';

  describe("ToolitemsMaskTest", function(){

    it("extend and restore mask",function(){
      var toolItemsMask = new ToolItemsMask();
      expect(toolItemsMask.blacklist.length).toEqual(0,"initialized blacklist");
      expect(toolItemsMask.whitelist.length).toEqual(0,"initialized whitelist");
      toolItemsMask.extendMask({"blacklist":["Favorite2","Comment"]});
      toolItemsMask.extendMask({"whitelist":['Delete']});
      expect(JSON.stringify(toolItemsMask.blacklist)).toEqual('[{"signature":"Favorite2"},{"signature":"Comment"}]',"extended blacklist");
      expect(JSON.stringify(toolItemsMask.whitelist)).toEqual('[{"signature":"Delete"}]',"extended whitelist");
      toolItemsMask.restoreMask();
      expect(toolItemsMask.blacklist.length).toEqual(0,"restored blacklist");
      expect(toolItemsMask.whitelist.length).toEqual(0,"restored whitelist");
    });

  });

});
