/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/jquery', 'nuc/lib/jquery.mockjax'], function ($, mockjax) {

  var DataManager = function DataManager() {};

  DataManager.enable =  function () {
    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2020(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodeData(2020, 30)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2020/nodes(.*)$'),
      responseTime: 50,
      responseText: DataManager.nodesData(30, 30, 1, 2020)
    });


    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2060(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodeData(2060, 60)
    });
    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2060/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(60, 30, 2, 2060)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2080(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodeData(2080, 63)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2080/nodes(?:\\?(.*)(page=2)(.*))$'),
      responseTime: 50,
      responseText: DataManager.nodesData(33, 30, 2, 2080)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2080/nodes(?:\\?(.*)(page=3)(.*))$'),
      responseTime: 50,
      responseText: DataManager.nodesData(33, 30, 2, 2080)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2080/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(63, 30, 3, 2080)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2090(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodeData(2090, 0)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2090/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(0, 30, 0, 2090)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2091(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodeData(2091, 47)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2091/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(47, 50, 1, 2091)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2092/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(800, 30, 27, 2092)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2093/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(50, 30, 2, 2093)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2094/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(100, 30, 4, 2094)
    });
    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2021/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(5,2021)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/202210/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(50,10,5,202210)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/202230/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(50,30,2,202230)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/202250/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(50,50,1,202250)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/202310/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(300,10,30,202310)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/202330/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(300,30,10,202330)
    });

    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/202350/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(300,50,6,202350)
    });
    
    mockjax({
      name: 'controls/pagination/test/pagination.mock',
      url: new RegExp('^//server/otcs/cs/api/v2/nodes/2023100/nodes(?:\\?(.*))?$'),
      responseTime: 50,
      responseText: DataManager.nodesData(300,100,3,2023100)
    });
  };

  DataManager.disable = function () {
    mockjax.clear();
  };

  DataManager.nodeData = function (id, size) {
    var responseText = {"addable_types":[{"icon":"\/alphasupport\/webdoc\/folder.gif","type":0,"type_name":"Folder"},{"icon":"\/alphasupport\/tinyali.gif","type":1,"type_name":"Shortcut"},{"icon":"\/alphasupport\/webattribute\/16category.gif","type":131,"type_name":"Category"},{"icon":"\/alphasupport\/webdoc\/cd.gif","type":136,"type_name":"Compound Document"},{"icon":"\/alphasupport\/webdoc\/url.gif","type":140,"type_name":"URL"},{"icon":"\/alphasupport\/webdoc\/doc.gif","type":144,"type_name":"Document"},{"icon":"\/alphasupport\/task\/16tasklist.gif","type":204,"type_name":"Task List"},{"icon":"\/alphasupport\/channel\/16channel.gif","type":207,"type_name":"Channel"}],"available_actions":[{"parameterless":false,"read_only":true,"type":"browse","type_name":"Browse","webnode_signature":null},{"parameterless":false,"read_only":false,"type":"update","type_name":"Update","webnode_signature":null}],"available_roles":[{"type":"audit","type_name":"Audit"},{"type":"categories","type_name":"Categories"}],"data":{"container":true,"container_size":53,"create_date":"2003-10-01T13:30:55","create_user_id":1000,"description":"","description_multilingual":{"en":""},"guid":null,"icon":"\/alphasupport\/webdoc\/icon_library.gif","icon_large":"\/alphasupport\/webdoc\/icon_library_large.gif","id":2000,"modify_date":"2015-04-16T13:47:47","modify_user_id":1000,"name":"Enterprise","name_multilingual":{"en":"Enterprise"},"owner_group_id":1001,"owner_user_id":1000,"parent_id":-1,"reserved":false,"reserved_date":null,"reserved_user_id":0,"type":141,"type_name":"Enterprise Workspace","versions_control_advanced":false,"volume_id":-2000},"definitions":{"container":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"container","multi_value":false,"name":"Container","persona":"","read_only":true,"required":false,"type":5,"type_name":"Boolean","valid_values":[],"valid_values_name":[]},"container_size":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"container_size","max_value":null,"min_value":null,"multi_value":false,"name":"Container Size","persona":"","read_only":true,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"create_date":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"include_time":true,"key":"create_date","multi_value":false,"name":"Created","persona":"","read_only":true,"required":false,"type":-7,"type_name":"Date","valid_values":[],"valid_values_name":[]},"create_user_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"create_user_id","max_value":null,"min_value":null,"multi_value":false,"name":"Created By","persona":"user","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"description":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"description","max_length":null,"min_length":null,"multiline":true,"multilingual":true,"multi_value":false,"name":"Description","password":false,"persona":"","read_only":false,"regex":"","required":false,"type":-1,"type_name":"String","valid_values":[],"valid_values_name":[]},"guid":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"guid","multi_value":false,"name":"GUID","persona":"","read_only":false,"required":false,"type":-95,"type_name":"GUID","valid_values":[],"valid_values_name":[]},"icon":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"icon","max_length":null,"min_length":null,"multiline":false,"multilingual":false,"multi_value":false,"name":"Icon","password":false,"persona":"","read_only":false,"regex":"","required":false,"type":-1,"type_name":"String","valid_values":[],"valid_values_name":[]},"icon_large":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"icon_large","max_length":null,"min_length":null,"multiline":false,"multilingual":false,"multi_value":false,"name":"Large Icon","password":false,"persona":"","read_only":false,"regex":"","required":false,"type":-1,"type_name":"String","valid_values":[],"valid_values_name":[]},"id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"id","max_value":null,"min_value":null,"multi_value":false,"name":"ID","persona":"node","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"modify_date":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"include_time":true,"key":"modify_date","multi_value":false,"name":"Modified","persona":"","read_only":true,"required":false,"type":-7,"type_name":"Date","valid_values":[],"valid_values_name":[]},"modify_user_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"modify_user_id","max_value":null,"min_value":null,"multi_value":false,"name":"Modified By","persona":"user","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"name":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"name","max_length":null,"min_length":null,"multiline":false,"multilingual":true,"multi_value":false,"name":"Name","password":false,"persona":"","read_only":false,"regex":"","required":false,"type":-1,"type_name":"String","valid_values":[],"valid_values_name":[]},"owner_group_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"owner_group_id","max_value":null,"min_value":null,"multi_value":false,"name":"Owned By","persona":"group","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"owner_user_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"owner_user_id","max_value":null,"min_value":null,"multi_value":false,"name":"Owned By","persona":"user","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"parent_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"parent_id","max_value":null,"min_value":null,"multi_value":false,"name":"Parent ID","persona":"node","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"reserved":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"reserved","multi_value":false,"name":"Reserved","persona":"","read_only":false,"required":false,"type":5,"type_name":"Boolean","valid_values":[],"valid_values_name":[]},"reserved_date":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"include_time":true,"key":"reserved_date","multi_value":false,"name":"Reserved","persona":"","read_only":false,"required":false,"type":-7,"type_name":"Date","valid_values":[],"valid_values_name":[]},"reserved_user_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"reserved_user_id","max_value":null,"min_value":null,"multi_value":false,"name":"Reserved By","persona":"member","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"type":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"type","max_value":null,"min_value":null,"multi_value":false,"name":"Type","persona":"","read_only":true,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]},"type_name":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"type_name","max_length":null,"min_length":null,"multiline":false,"multilingual":false,"multi_value":false,"name":"Type","password":false,"persona":"","read_only":true,"regex":"","required":false,"type":-1,"type_name":"String","valid_values":[],"valid_values_name":[]},"versions_control_advanced":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"versions_control_advanced","multi_value":false,"name":"Versions Control Advanced","persona":"","read_only":false,"required":false,"type":5,"type_name":"Boolean","valid_values":[],"valid_values_name":[]},"volume_id":{"allow_undefined":false,"bulk_shared":false,"default_value":null,"description":null,"hidden":false,"key":"volume_id","max_value":null,"min_value":null,"multi_value":false,"name":"VolumeID","persona":"node","read_only":false,"required":false,"type":2,"type_name":"Integer","valid_values":[],"valid_values_name":[]}},"definitions_base":["container","container_size","create_date","create_user_id","description","guid","icon","icon_large","id","modify_date","modify_user_id","name","owner_group_id","owner_user_id","parent_id","reserved","reserved_date","reserved_user_id","type","type_name","versions_control_advanced","volume_id"],"definitions_order":["id","type","type_name","name","description","parent_id","volume_id","guid","create_date","create_user_id","modify_date","modify_user_id","owner_user_id","owner_group_id","reserved","reserved_date","reserved_user_id","icon","icon_large","versions_control_advanced","container","container_size"],"perspective":{"options":{"rows":[{"columns":[{"sizes":{"md":12},"widget":{"options":{},"type":"nodestable"}}]}]},"type":"grid"},"type":141,"type_info":{"advanced_versioning":false,"container":true},"type_name":"Enterprise Workspace"};
    responseText.data.id = id;
    responseText.data.container_size = size;
    return responseText;
  };
  DataManager.nodesData = function (numItems, pgSize, pgTotal,id) {
    var responseText = {"collection":{"paging":{"columns":[{"data_type":2,"key":"type","name":"Type","sort_key":"type","type":906},{"data_type":-1,"key":"name","name":"Name","sort_key":"name","type":906},{"data_type":-1,"key":"size_formatted","name":"Size","sort_key":"size","type":906},{"data_type":401,"include_time":true,"key":"modify_date","name":"Modified","sort_key":"modify_date","type":906},{"data_type":14,"key":"create_user_id","name":"Created By","persona":"member","sort_key":"","type":906},{"data_type":2,"key":"wnd_comments","name":"Comments","sort_key":"","type":2},{"data_type":14,"key":"reserved_user_id","name":"Reserved By","persona":"member","sort_key":"","type":906}],"limit":30,"links":{"data":{"previous":{"body":"","content_type":"","href":"\/api\/v2\/app\/container\/2000\/page?fields=followups&fields=properties{wksp_type_name,rm_enabled}&fields=rmiconsdata&fields=sharing_info&fields=signature_info&limit=30&page=2&sort=asc_name","method":"GET","name":"Previous"}}},"page":3,"page_total":3,"range_max":73,"range_min":61,"total_count":73},"sorting":{"sort":[{"key":"sort","value":"asc_name"}]}},"links":{"data":{"self":{"body":"","content_type":"","href":"\/api\/v2\/app\/container\/2000\/page?fields=followups&fields=properties{wksp_type_name,rm_enabled}&fields=rmiconsdata&fields=sharing_info&fields=signature_info&limit=30&page=3&sort=asc_name","method":"GET","name":""}}},"results":[]};


    var totalPages = Math.round(numItems/pgSize),
     currentPageItems = totalPages === pgTotal ? (pgSize - ((pgTotal*pgSize) - numItems)) : 0,
     totalData = !!currentPageItems ? currentPageItems : (numItems < pgSize? numItems : pgSize), i;
    for (i = 1; i <= totalData; i++) {
      var data = {"comments":0,"container":false,"create_date":"2021-07-28T02:25:06","create_user_id":1000,"create_user_id_expand":{"name":"Admin"},"data":{"rmiconsdata":{"class_id":0,"official":0,"show_classify":false,"show_hold":false,"show_hold_tab":false,"show_label_tab":true,"show_official":false,"show_xref":false,"show_xref_tab":false},"sharing_info":{"is_shared":false}},"description":null,"favorite":false,"hidden":false,"id":53368916,"mime_type":null,"modify_date":"2021-07-28T02:25:06","modify_images":[],"modify_user_id":1000,"modify_user_id_expand":{"name":"Admin"},"name":"test shortcut","openable":true,"original_id":53366412,"original_id_expand":{"container":true,"mime_type":null,"openable":true,"type":0,"type_name":"Folder","version_number":0},"owner_user_id":1000,"owner_user_id_expand":{"name":"Admin"},"parent_id":2000,"parent_id_expand":null,"permissions_model":"advanced","reserved_date":null,"reserved_shared_collaboration":false,"reserved_user_id":null,"reserved_user_id_expand":null,"size":null,"size_formatted":"","state":{"properties":{"metadata_token":""}},"status":null,"type":1,"type_name":"Shortcut","wnd_comments":null};
      data.id = i;
      responseText.results.push(data);
    }

    responseText.collection.length = i;
    responseText.collection.paging.page = totalPages;
    responseText.collection.paging.limit = i;
    responseText.collection.paging.page_total = pgTotal;
    responseText.collection.paging.range_max = pgSize;
    responseText.collection.paging.total_count = numItems;
    return responseText;
  };

  return DataManager;
});
