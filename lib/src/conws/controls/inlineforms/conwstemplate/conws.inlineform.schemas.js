/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery",
  'conws/models/workspacetypes/workspacetypes.factory',
  'i18n!conws/controls/inlineforms/conwstemplate/impl/nls/lang'
], function ($, WorkspaceTypesFactory, lang) {
  return [
    {
      equals: {type: 848}, // 140: workspace sub-type
      addableCommandInfo: {
        signature: "AddCONWSTemplate",
        group: "conws"
      },
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NamePlaceholder,
            multilingual: true
          },
          reference_type: {
            type: 'select',
            required: true,
            hideInEditMode: true,
            namePlaceholder: lang.WSTypePlaceholder,
            getData: function (options) {
              var deferred      = $.Deferred(),
                  wstypes       = options.context.getModel(WorkspaceTypesFactory),
                  filterWsTypes = function (wstypes) {
                    var selectEnum = [];
                    wstypes.forEach(function (wst) {
                      selectEnum.push({
                        "value": wst.get('id'),
                        "displayName": wst.get('wksp_type_name'),
                        "selected": false
                      });
                    });
                    return selectEnum;
                  };

              if (!wstypes.fetched) {
                wstypes.fetch().done(function (wstypes) {
                  deferred.resolve(filterWsTypes(wstypes));
                });
              } else {
                deferred.resolve(filterWsTypes(wstypes));
              }
              return deferred.promise();
            }
          }
        }
      }
    }
  ];
});

