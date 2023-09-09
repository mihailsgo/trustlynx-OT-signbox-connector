/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

require.config({
  "paths": {
    "nuc": ".",
    "css": "lib/css",
    "csui-ext": "utils/load-extensions/load-extensions",
    "hbs": "lib/hbs",
    "i18n": "lib/i18n",
    "json": "lib/json",
    "less": "lib/less",
    "txt": "lib/text"
  },
  "hbs": {
    "disableI18n": true,
    "disableHelpers": true,
    "templateExtension": "hbs"
  },
  "less": {
    "sourceMap": {
      "sourceMapFileInline": true
    }
  }
});
