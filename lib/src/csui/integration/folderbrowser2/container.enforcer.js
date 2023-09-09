/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module'], function (module) {
  return [
    {
      decides: function (node) {
        return module.config().enabled && node.get('container');
      },
      important: true,
      module: 'json!csui/utils/contexts/perspective/impl/perspectives/container.json'
    }
  ];
});
