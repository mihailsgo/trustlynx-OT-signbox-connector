/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/alpaca/js/alpaca.lite',
  'csui/controls/form/fields/alpaca/alptypeaheadfield.mixin',
  'csui/utils/contexts/factories/connector',
  'conws/models/workspacetypes/workspacetypes.model',
  'conws/models/workspacetypes/workspacetype.factory',
  'csui/controls/form/fields/typeaheadfield.view',
  'i18n!conws/controls/form/impl/nls/lang',
  'css!conws/controls/typeaheadpicker/impl/typeaheadpicker'
], function ( _, $,
  Alpaca,
  AlpTypeaheadFieldMixin,
  ConnectorFactory,
  WorkspaceTypesModel,
  WorkspaceTypeFactory,
  TypeaheadFieldView,
  lang ) {

  var ConwsWorkspaceTypeField = AlpTypeaheadFieldMixin.mixin({

    constructor: function ConwsWorkspaceTypeField(container, data, options, schema, view, connector, onError) {

      options = $.extend(true,options||{},{
        alpacaFieldType: 'otconws_workspacetype_id',
        css: {
          customImage: 'wksp-type-custom-image',
          defaultIcon: 'csui-icon csui-nodesprites'
        },
        lang: {
          alpacaPlaceholder: lang.alpacaPlaceholderOTWorkspaceTypePicker
        },
        pickerOptions: {
          collection: new WorkspaceTypesModel( undefined, {
            connector: connector.config.context.getObject(ConnectorFactory)
          }),
          css: {
          },
          titleSearchIcon: lang.titleWorkspaceTypeSearchIcon,
          itemOptions: {
            css: {
              customImage: 'csui-icon wksp-type-custom-image',
              defaultIcon: 'csui-icon csui-nodesprites'
            }
          },
          showAllOnClickIcon: true,
          typeaheadOptions: {
            minLength: 0
          }
        }
      });

      options.ItemModelFactory = WorkspaceTypeFactory;

      this.base(container, data, options, schema, view, connector, onError);
      this.makeAlpTypeaheadField();
    }

  });

  Alpaca.Fields.ConwsWorkspaceTypeField = Alpaca.Fields.TextField.extend(ConwsWorkspaceTypeField);
  Alpaca.registerFieldClass('otconws_workspacetype_id', Alpaca.Fields.ConwsWorkspaceTypeField, 'bootstrap-csui');
  Alpaca.registerFieldClass('otconws_workspacetype_id', Alpaca.Fields.ConwsWorkspaceTypeField, 'bootstrap-edit-horizontal');

  return $.alpaca.Fields.ConwsWorkspaceTypeField;
});
