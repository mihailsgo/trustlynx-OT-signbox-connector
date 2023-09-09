/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base',
  'i18n!csui/widgets/permissions/impl/nls/lang',
  'i18n!csui/widgets/permissions/nls/lang',
  'hbs!csui/widgets/permissions/impl/permissions.lookup/permissions.lookup',
  'css!csui/widgets/permissions/impl/permissions'
], function (module, _, $, Marionette, base, lang, publicLang, template) {

  var config = _.extend({
	    memberFilterType: [0, 1],
      orderBy: 'asc_name'
	  }, module.config());

  var PermissionsLookupView = Marionette.ItemView.extend({

    className: 'cs-permissions-lookup',

    template: template,
    
    initialize: function (options) {
      this.options = options;
    },

    constructor: function PermissionsLookupView(options) {
      var self = this;
      options || (options = {});
      options.data || (options.data = {});
      this.options = options;
      Marionette.ItemView.prototype.constructor.call(this, options);

    },

    onShow: function () {
      var self = this;
      require(['csui/controls/userpicker/userpicker.view'
      ], function (UserPickerView) {
        self.pickerView = new UserPickerView({
          context: self.options.context,
          memberFilter: {type: config.memberFilterType},
          widgetoptions: self.options,
          placeholder: publicLang.PermissionLookupPlaceHolder || lang.PermissionLookupPlaceHolder,
          prettyScrolling: true,
          orderBy: config.orderBy || '',
          limit: 20,
          model: self.options.userPickerModel,
          id_input: _.uniqueId("csui-permissions-user-picker-input")
        });
        var pickerRegion = new Marionette.Region({
          el: self.$el.find('#csui-permissions-user-picker')
        });
        pickerRegion.show(self.pickerView);
        self.pickerView && self.pickerView.ui.searchbox.trigger('focus');
        self.listenTo(self.pickerView, "item:change", self.processItemChange);
        self.listenTo(self.pickerView, "item:clear", self.processItemChange);
        self.listenTo(self.pickerView, "click item:clear", function () {
          self.trigger('close:addmenu');
        });             
      });
    },

    processItemChange: function () {
      var selectedModel = arguments.length > 0 && arguments[0].item;
      var param = {
        id: !!selectedModel ? selectedModel.get("id") : '',
        name: !!selectedModel ? selectedModel.get("name_formatted") : '',
        group_id: !!selectedModel && selectedModel.get("group_id_expand") ?
                  selectedModel.get("group_id_expand").id : '',
        initials: !!selectedModel ? selectedModel.get("initials") : '',
        photo_url: !!selectedModel ? selectedModel.get("photo_url") : '',
        selectedMember: !!selectedModel ? selectedModel : undefined,
        effectivePermissions: !!selectedModel
      };
      this.options.userPickerModel.set(param);
    }
  });

  return PermissionsLookupView;

});
