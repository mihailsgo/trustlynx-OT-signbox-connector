/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "i18n!csui/controls/table/inlineforms/base/impl/nls/lang",
], function (lang) {
  return [
    {
      equals: {type: 0},  // 0: folder sub-type
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: {type: -1},  // -1: generic for rename action
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: {type: 1},  // 1: shortcut sub-type
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.ShortcutNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: {type: 298},  // 298: collection sub-type
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: { type: 1308}, // 1308: Support Asset Folder
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: { type: 136 }, // 136: Compound Document sub-type
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: { type: 800 },  // 800: Intelligent Filing Folder
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            multilingual: true
          }
        }
      }
    },
    {
      equals: {type: 140}, // 140: Url sub-type
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.UrlNamePlaceholder,
            multilingual: true
          },
          url: {
            type: 'text',
            required: true,
            namePlaceholder: lang.UrlAddressPlaceholder,
            regex: /^[a-z0-9]+:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*(\:[0-9]{1,5})?(([0-9]{1,5})?\/.*)?$/i
          }
        }
      }
    }
  ];
});