/**
 * Created by stefang on 12.10.2015.
 */
csui.define(["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url",
  "csui/utils/base"
], function (_, $, Backbone, Url, base) {

  // handling server calls for metadata
  function MetadataController(status, options, attributes) {
    this.status = status || {};
    this.options = options || {};
    this.attributes = attributes || {};
  }

  _.extend(MetadataController.prototype, Backbone.Events, {

    save: function (model, data) {
      // Pass the data via 'attributes' param.  They would be set to the node model.

      // Note: if data does not contain common attributes,
      // it should be passed via the second param as options as the following:
      //   model.save({}, {data: data, wait: true, patch: true})
      // We'll revisit this later if such scenario arises.

      return model.save(data, {
        wait: true,
        patch: true
      });
    },

    createItem: function (model, formsValues) {
      if (!model.connector) {
        return $.Deferred().reject();
      }

      if(!!model && !!model.attributes && !!model.attributes.parent_id){
        formsValues.source_parent_id = model.attributes.parent_id;
      }

      // FormData available (IE10+, WebKit)
      var formData = new FormData();
      formData.append('body', JSON.stringify(_.extend({
        template_id: this.options.template ? this.options.template.id : undefined
      },formsValues)));

      var url = model.connector.getConnectionUrl().getApiBase('v2');
      var options = {
        type: 'POST',
        url: Url.combine(url, "businessworkspaces"),
        data: formData,
        contentType: false,
        processData: false
      };

      model.connector.extendAjaxOptions(options);

      var collection = this.options.collection;
      return model.connector.makeAjaxCall(options)
        .then(function (response) {
          // Update all attributes sent from the server. Currently there is only the id.
          // But do not propagate the events to the view.
          // As we fetch the new node to also get all actions, all change events are triggered,
          // except "change:id". But this event is not needed: only the MetadataPropertiesView
          // is listening on it, to get the create forms again.
          // But this is not needed and not desired in this case. So we are safe to do a silent set.
          model.set(response.results, { silent: true });
          //updating the model collection 
          model.collection = collection;
          model.attributes.sub_folder_id = response.results.sub_folder_id;
          return model.fetch({ collection: collection });
        });
    }

  });

  MetadataController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataController, {version: "1.0"});

  return MetadataController;
});
