/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['workflow/widgets/workitem/workitem.body/workitem.body.view',
  'i18n!workflow/widgets/metadata/impl/nls/lang'
], function (WorkItemPropertiesView, lang) {
  'use strict';
  return {

    title: lang.workflowPropertiesLabel,
    sequence: 100,
    name: 'workflow-properties',
    contentView: WorkItemPropertiesView
  };

});