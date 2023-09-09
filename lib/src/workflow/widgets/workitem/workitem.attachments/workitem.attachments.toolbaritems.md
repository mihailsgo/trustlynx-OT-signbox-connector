# Workitem Attachments Toolbar Extension

  Has the definition of toolbars used in the workitem.attachmentitem.view.

## Example on how to add additional inline toolbar actions

To configure extra inline toolbar actions for workflow attachment items, which is 
supported by the extensible module `workflow/widgets/workitem/workitem.attachments/toolbaritems`:

    {
        'workflow/widgets/workitem/workitem.attachments/toolbaritems': {
            extensions: {
                // Module array should be wrapped in a map key to allow merging
                // of extensions from multiple calls to require.config; arrays
                // are not merged
                'samples': [
                  'samples/toolbars/samples.toolbaritems'
                ]
            }
        }
    }

Below is the example configuration for `samples/toolbars/samples.toolbaritems`:

    define(['i18n!samples/toolbars/impl/nls/lang',
            'css!samples/toolbars/impl/samples.toolbaritems'
      ], function (lang) {
        'use strict';

          return {
              inlineActionbar: [
                  {
                    signature: 'SampleCommand',
                    name: lang.sampleCommandLabel,
                    icon: 'icon icon-toolbar-sample',
                    group: 'other'
                  }
              ]
          };
      });

