/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['i18n!xecmpf/widgets/myattachments/nls/myattachments.lang',
  "xecmpf/widgets/myattachments/metadata.attachments.view",
  "xecmpf/widgets/workflows/metadata.workflows.view",
  "i18n!xecmpf/widgets/workflows/nls/workflows.lang"
], function (lang, MyAttachmentsView, workflowTableView, workflowLang) {

  return [

    {
      title: lang.attachmentsTabTitle,
      sequence: 40,
      contentView: MyAttachmentsView
    },

    {
      title: workflowLang.title,
      sequence: 50,
      name: workflowLang.name,
      contentView: workflowTableView
    }

  ];

});
