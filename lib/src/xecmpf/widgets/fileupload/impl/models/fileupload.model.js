/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


 define(['csui/lib/underscore',
 'csui/lib/backbone',
 'csui/utils/url',
 'csui/models/mixins/connectable/connectable.mixin',
 'csui/models/mixins/fetchable/fetchable.mixin'],
 function (_, Backbone, Url, ConnectableMixin, FetchableMixin) {

   var FileUploadModel = Backbone.Model.extend({
     constructor: function FileUploadModel(attributes, options) {
       options = options || {};
       this.options = options;
       Backbone.Model.prototype.constructor.apply(this, arguments);
       this.makeConnectable(options);
       this.makeFetchable(options);
     },
     url: function (options) {
       return Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), '/businessworkspaces/', this.options.node.get('id'), '/fileupload')
     },
     parse: function (response) {
       var result = response.results;
       result.data = new Backbone.Collection(result.data);
       return result;
     }
   });
   ConnectableMixin.mixin(FileUploadModel.prototype);
   FetchableMixin.mixin(FileUploadModel.prototype);

   return FileUploadModel;

 });
