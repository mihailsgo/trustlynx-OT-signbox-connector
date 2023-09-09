/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/list/list.view',
  'hbs!xecmpf/widgets/fileupload/impl/fileupload.content/fileupload.info/fileupload.info.item',
  'css!xecmpf/widgets/fileupload/impl/fileupload.content/fileupload.info/fileupload.info'], function (_, Marionette, ListView, FileUploadInfoItemTemplate) {

    var FileUploadInfoItemView = Marionette.ItemView.extend({
      className: 'xecmpf-fileupload-doc-info',
      constructor: function FileUploadInfoItemView(options) {
        Marionette.ItemView.prototype.constructor.call(this, options);
      },
      template: FileUploadInfoItemTemplate,
      onRender: function (){
        var areaLabel = this.options.model.get('count') +" "+ this.options.model.get('label'); 
        this.$el.attr('role', "label" ).attr('tabindex', 0).attr('aria-label', areaLabel);
      }
    });

    return Marionette.CollectionView.extend({
      className: 'xecmpf-fileupload-info-list',
      constructor: function (options) {
        options = options || {};
        Marionette.CollectionView.prototype.constructor.call(this, options);
      },
      childView: FileUploadInfoItemView
    });

  });