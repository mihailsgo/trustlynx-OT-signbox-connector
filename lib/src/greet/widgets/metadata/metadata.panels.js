/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['i18n!greet/widgets/metadata/impl/nls/lang',
  'greet/widgets/metadata/panels/hello/metadata.hello.view'
], function (lang, MetadataHelloView) {

  return [

    {
      title: lang.helloTabTitle,
      sequence: 100,
      contentView: MetadataHelloView
    }

  ];

});
