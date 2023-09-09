/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/form/impl/fields/csformfield.view',
  'csui/utils/contexts/factories/connector',
  'csui/dialogs/multilingual.text.picker/languages',
  'i18n!csui/dialogs/multilingual.text.picker/impl/nls/lang',
  'hbs!csui/dialogs/multilingual.text.picker/impl/multilingual.form',
  'css!csui/dialogs/multilingual.text.picker/impl/multilingual.form',
  'csui/lib/binf/js/binf',
  'csui/lib/handlebars.helpers.xif'
], function (_, $, Backbone, Marionette, FormFieldView, ConnectorFactory, Languages, lang, template) {

  var i18n = csui.require.s.contexts._.config.config.i18n;
  var loadableLocales = (i18n && i18n.availableLanguages);
  if (!loadableLocales || loadableLocales.length == 0) {
    loadableLocales = [];
  }

  var MultiLingualFormView = Marionette.LayoutView.extend({
    template: template,
    className: 'cs-multilingual-form',

    templateHelpers: function () {
      return {
        formHeading: lang.formHeading,
        languages: this.languages,
        data: this.data
      };
    },

    constructor: function MultiLingualForm(options) {
      Marionette.LayoutView.apply(this, arguments);
      this._prepareLanguages();
      this.data = _.extend({}, options.data || {});
    },

    _prepareLanguages: function () {
      this.languages = _.map(loadableLocales, function (enabled, lang) {
        var splittedLang = loadableLocales[lang].languageCode.split('_'),
        langUpdated = splittedLang.length === 2 ? splittedLang[1] : splittedLang[1]+'-'+splittedLang[2];
        return _.defaults({}, Languages[langUpdated], {
          LanguageCode: langUpdated,
          LanguageName: loadableLocales[lang].displayName,
          LanguageNameLocal: loadableLocales[lang].displayName
        });
      });
    },

    getData: function () {
      var that = this,
        data = this.data;
      _.each(this.languages, function (lang) {
        data[lang.LanguageCode] = that.$el.find('#input-' + lang.LanguageCode).val();
      });
      return data;
    }
  });
  return MultiLingualFormView;
});