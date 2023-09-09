csui.define('greet/commands/hello/impl/nls/lang',{
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('greet/commands/hello/impl/nls/root/lang',{

  toolbarButtonTitle: 'Hello',

  dialogTitle: 'Greeting',

  message: 'Hello, {0}!'

});


csui.define('greet/commands/hello/hello.command',['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!greet/commands/hello/impl/nls/lang'
], function (require, _, $, CommandModel, CommandHelper, lang) {
  'use strict';

  // Dependencies needed only for the command execution
  var ModalAlert;

  var HelloCommand = CommandModel.extend({

    defaults: {
      signature: 'greet-hello',
      name: lang.toolbarButtonTitle
    },

    enabled: function (status) {
      // Check that a single node, which can be modified, was selected
      var node = CommandHelper.getJustOneNode(status);
      return !!node;
    },

    execute: function (status, options) {
      var self = this,
          deferred = $.Deferred();
      // Require additional modules needed for the command execution first
      // when they are needed here; not right away in the module callback
      csui.require(['csui/dialogs/modal.alert/modal.alert'
      ], function () {
        ModalAlert = arguments[0];

        // Greet the node and relay the result state to the caller
        var node = CommandHelper.getJustOneNode(status),
            message = _.str.sformat(lang.message, node.get('name'));
        ModalAlert
            .showInformation(message, lang.dialogTitle)
            .always(function () {
              // Do not pass anything in case of success to prevent any
              // automatic success handling by the caller.
              deferred.resolve();
            });
      }, function (error) {
        // Pass the module loading error to be handled by the caller
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  return HelloCommand;

});

csui.define('greet/commands/add.hello/impl/nls/lang',{
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('greet/commands/add.hello/impl/nls/root/lang',{

  toolbarButtonTitle: 'Hello',

  dialogTitle: 'Greeting',

  message: 'Hello, {0}!'

});


csui.define('greet/commands/add.hello/add.hello.command',['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'i18n!greet/commands/add.hello/impl/nls/lang'
], function (require, _, $, CommandModel, lang) {
  'use strict';

  // Dependencies needed only for the command execution
  var NodeModel;

  var AddHelloCommand = CommandModel.extend({

    defaults: {
      signature: 'greet-add-hello',
      name: lang.toolbarButtonTitle
    },

    enabled: function (status, options) {
      // Check that there is a container available
      return status.container && status.container.get('container');
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      
      // Require additional modules needed for the command execution first
      // when they are needed here; not right away in the module callback
      csui.require(['csui/models/node/node.model'
      ], function () {
        NodeModel = arguments[0];

        // Create a new node, initially with empty name
        var node = new NodeModel({
          // Mandatory properties
          parent_id: status.container.get('id'),
          type: options.addableType,
          name: '',
          // Properties allowing correct display of the inline form
          type_name: options.addableTypeName
        }, {
          connector: status.container.connector
        });
        
        deferred.resolve(node);
        
      }, function (error) {
        // Pass the module loading error to be handled by the caller
        deferred.reject(error);
      });

      // Let the inline form in the table continue
      status.forwardToTable = true;
      return deferred.promise();
    }

  });

  return AddHelloCommand;

});

csui.define('greet/commands/add.hello/add.hello.template.command',['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/models/command', 'csui/utils/commandhelper',
  'i18n!greet/commands/add.hello/impl/nls/lang'
], function (require, _, $, Backbone, CommandModel, CommandHelper, lang) {
  'use strict';

  // Dependencies needed only for the command execution
  var NodeModel, NodeCollection, MetadataAddItemController,
      HelloCreateFormCollection, HelloCreateController,
      GlobalMessage;

  var AddHelloTemplateCommand = CommandModel.extend({

    defaults: {
      signature: 'greet-add-hello-template',
      name: lang.toolbarButtonTitle
    },

    enabled: function (status, options) {
      // Check that the subtype is addable
      var addableTypes = status.data && status.data.addableTypes;
      return addableTypes && addableTypes.get(12345);
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          template = new Backbone.Model({id: status.data.template_id});
      
      // Require additional modules needed for the command execution first
      // when they are needed here; not right away in the module callback
      csui.require(['csui/models/node/node.model', 'csui/models/nodes',
        'csui/widgets/metadata/metadata.add.item.controller',
        'csui/controls/globalmessage/globalmessage',
        'greet/commands/add.hello/impl/hello.create.forms',
        'greet/commands/add.hello/impl/hello.create.controller'
      ], function () {
        NodeModel = arguments[0];
        NodeCollection = arguments[1];
        MetadataAddItemController = arguments[2];
        GlobalMessage = arguments[3];
        HelloCreateFormCollection = arguments[4];
        HelloCreateController = arguments[5];

        // Create a new node, initially with empty name
        var node = new NodeModel({
              // Mandatory properties
              parent_id: status.container.get('id'),
              type: options.addableType,
              name: '',
              // Properties allowing correct display of the inline form
              type_name: options.addableTypeName
            }, {
              connector: status.container.connector
            }),
            metadataAddItemController = new MetadataAddItemController();

        // Substitute nodes list, so we do not change the selection
        status.nodes = new NodeCollection([node]);

        // options = _.extend({
        //   // Override the user input forms for the object creation
        //   formCollection: new HelloCreateFormCollection(undefined, {
        //     node: status.container,
        //     template: template
        //   }),
        //   // Override the server call for the object creation
        //   metadataController: new HelloCreateController()
        // }, options);

        // Open the creation dialog
        metadataAddItemController
            .displayForm(status, options)
            .then(function () {
              // Make the node appear at the top and emphasized as new
              if (status.collection) {
                node.isLocallyCreated = true;
                status.collection.unshift(node);
              }
              // Server returns no attributes with the created node;
              // fetch them by an extra call
              return node.fetch();
            })
            .done(deferred.resolve)
            .fail(deferred.reject);
        
      }, function (error) {
        // Pass the module loading error to be handled by the caller
        deferred.reject(error);
      });

      // Let the full dialog continue and handle success and errors
      status.suppressSuccessMessage = true;
      return deferred.promise();
    }

  });

  return AddHelloTemplateCommand;

});

csui.define('greet/commands/hello/hello.nodestable.toolitems',['i18n!greet/commands/hello/impl/nls/lang'
], function (lang) {
  'use strict';

  return {
    otherToolbar: [
      {
        signature: 'greet-hello',
        name: lang.toolbarButtonTitle
      }
    ]
  };

});

csui.define('greet/commands/add.hello/impl/hello.templates',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
    'csui/models/mixins/node.resource/node.resource.mixin'
], function (_, Backbone, Url, NodeResourceMixin) {
  'use strict';

  var HelloTemplateModel = Backbone.Model.extend({

    constructor: function HelloTemplateModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    
    parse: function (response, options) {
      return response.data.properties;
    }

  });

  var HelloTemplateCollection = Backbone.Collection.extend({

    model: HelloTemplateModel,

    constructor: function HelloTemplateCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeNodeResource(options);
    },

    isFetchable: function () {
      return this.node.isFetchable();
    },

    url: function () {
      var url = this.node.urlBase().replace('/v1/', '/v2/');
      return Url.combine(url, '/hellotemplates');
    },

    parse: function (response, options) {
      return response.results;
    }

  });

  NodeResourceMixin.mixin(HelloTemplateCollection.prototype);

  return HelloTemplateCollection;

});

csui.define('greet/commands/add.hello/add.hello.tabletoolbar.extension',['csui/utils/base', 'csui/utils/log',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/toolbar/toolitem.model',
  'greet/commands/add.hello/add.hello.command',
  'greet/commands/add.hello/impl/hello.templates',
  'i18n!greet/commands/add.hello/impl/nls/lang'
], function (base, log, GlobalMessage, ToolItemModel,
  AddHelloCommand, HelloTemplateCollection, lang) {
  'use strict';

  // Callback called when a toolbar is created.
  return function (tableToolbarView) {

    // When the item adding toolbar is populated, additional object types
    // or other item kinds like templates can be appended to it.
    tableToolbarView.on('before:updateAddToolbar', function (args) {
      if (args.container) {
        populateHelloItems(args);
        populateHelloTemplates(args);
      }
    });

  };

  // Checking the command availability using a command instance:
  //
  // var addHelloCommand = new AddHelloCommand();
  // if (addHelloCommand.enabled({container: args.container}))
  function populateHelloItems(args) {
    var addHelloCommand = new AddHelloCommand();
    if (addHelloCommand.enabled({container: args.container})) {
      args.toolbarItems.push(new ToolItemModel({
        signature: "greet-add-hello",
        name: lang.toolbarButtonTitle,
        group: 'greet',
        type: 12345
      }));
    }
  }

  // Checking the command availability asynchronously:
  //
  // var done = args.async();
  // performAsynchronousCheck(...)
  //     .done(function () {
  //       populate toolItems
  //     })
  //     .always(done);
  function populateHelloTemplates(args) {
    var templates = new HelloTemplateCollection(undefined, {
                      node: args.container
                    }),
        done = args.async();
    templates
        .fetch()
        .done(function () {
          var toolItems = templates.map(function (template) {
            return new ToolItemModel({
              signature: "greet-add-hello-template",
              name: template.get('name'),
              group: 'greet',
              type: 12345,
              commandData: {
                template_id: template.get('id')
              }
            });
          });
          args.toolbarItems.push.apply(args.toolbarItems, toolItems);
        })
        .fail(function (request) {
          var error = new base.Error(request);
          log.error('Getting Hello Templates failed. {0}', error) &&
          console.error(log.last);
          GlobalMessage.showMessage('error',
            'Getting Hello Templates failed.', error.message);
        })
        .always(done);
  }

});

csui.define('greet/controls/cells/hello/impl/nls/lang',{
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('greet/controls/cells/hello/impl/nls/root/lang',{

  "text/plain": "Text",
  "text/html": "Hypertext",
  "application/pdf": "Portable",
  "image/jpg": "Picture",
  "image/png": "Picture",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Tablesheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "Slides"

});


csui.define('greet/controls/cells/hello/hello.view',['csui/controls/table/cells/cell/cell.view',
  'csui/controls/table/cells/cell.registry',
  'csui/controls/table/table.columns',
  'i18n!greet/controls/cells/hello/impl/nls/lang'
], function (CellView, cellViewRegistry, tableColumns, lang) {

  // Declares a column which renders a friendly MIME type of the current item
  var HelloCellView = CellView.extend({

    getValueText: function () {
      var mimeType = this.model.get('mime_type');
      return lang[mimeType] || mimeType || '';
    }

  });

  // Register this cell view for the `mime_type` column key, which can be
  // added by the `featuredColumns` to the node table on the client side
  cellViewRegistry.registerByColumnKey('mime_type', HelloCellView);

  // Make the column always appear behind the system columns, which have
  // sequence number < 100; custom columns have sequence number > 1000
  tableColumns.add({
    key: 'mime_type',
    sequence: 600
  });

  return HelloCellView;

});

csui.define('greet/commands/add.hello/impl/hello.inlineform.view',['csui/controls/table/inlineforms/inlineform.registry',
  'csui/controls/table/inlineforms/generic/generic.view'
], function (inlineFormViewRegistry, InlineFormGenericView) {

  inlineFormViewRegistry.registerByAddableType(12345, InlineFormGenericView);
  InlineFormGenericView.prototype.getAddableCommandInfo = function () {
    return {
      signature: "greet-add-hello",
      group: "greet"
    };
  };
  return InlineFormGenericView;

});

csui.define('greet/commands/add.hello/custom.inlineform/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('greet/commands/add.hello/custom.inlineform/impl/nls/root/lang',{
  NamePlaceholder: 'Enter name',
  DescriptionPlaceholder: 'Enter description'
});



/* START_TEMPLATE */
csui.define('hbs!greet/commands/add.hello/custom.inlineform/impl/hello.inlineform',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "hasError";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-inlineform-group csui-inlineform-group-error\">\r\n    <div class=\"text-danger\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"errorMessage") || (depth0 != null ? lookupProperty(depth0,"errorMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"errorMessage","hash":{},"loc":{"start":{"line":28,"column":29},"end":{"line":28,"column":45}}}) : helper)))
    + "</div>\r\n  </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<form>\r\n  <div class=\"csui-inlineform-group greet-inlineform-group-hello\">\r\n    <input type=\"text\" value=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":30},"end":{"line":3,"column":38}}}) : helper)))
    + "\" placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"namePlaceholder") || (depth0 != null ? lookupProperty(depth0,"namePlaceholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"namePlaceholder","hash":{},"loc":{"start":{"line":3,"column":53},"end":{"line":3,"column":72}}}) : helper)))
    + "\"\r\n           class=\"binf-form-control csui-inlineform-input-name "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"validationFailed_Name") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":4,"column":63},"end":{"line":5,"column":17}}})) != null ? stack1 : "")
    + "\">\r\n    <input type=\"text\" value=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"description") || (depth0 != null ? lookupProperty(depth0,"description") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"description","hash":{},"loc":{"start":{"line":6,"column":30},"end":{"line":6,"column":45}}}) : helper)))
    + "\" placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"descriptionPlaceholder") || (depth0 != null ? lookupProperty(depth0,"descriptionPlaceholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"descriptionPlaceholder","hash":{},"loc":{"start":{"line":6,"column":60},"end":{"line":6,"column":86}}}) : helper)))
    + "\"\r\n           class=\"binf-hidden-xs binf-hidden-sm binf-form-control greet-inlineform-input-hello\">\r\n    <button type=\"button\" class=\"csui-btn-metadata btn\"><span\r\n        class=\"icon icon-toolbar-metadata\"></span></button>\r\n    <button type=\"submit\"\r\n            class=\"csui-btn-save csui-btn btn binf-btn-default\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"SaveButtonLabel") || (depth0 != null ? lookupProperty(depth0,"SaveButtonLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"SaveButtonLabel","hash":{},"loc":{"start":{"line":11,"column":64},"end":{"line":11,"column":83}}}) : helper)))
    + "</button>\r\n    <button type=\"button\" class=\"csui-btn-cancel csui-btn btn\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"CancelButtonLabel") || (depth0 != null ? lookupProperty(depth0,"CancelButtonLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"CancelButtonLabel","hash":{},"loc":{"start":{"line":12,"column":63},"end":{"line":12,"column":84}}}) : helper)))
    + "</button>\r\n  </div>\r\n  <div class=\"binf-hidden-md binf-hidden-lg binf-hidden-xl binf-hidden-xxl csui-inlineform-group\r\ngreet-inlineform-group-hello-wrapped\">\r\n    <input type=\"text\" value=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"description") || (depth0 != null ? lookupProperty(depth0,"description") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"description","hash":{},"loc":{"start":{"line":16,"column":30},"end":{"line":16,"column":45}}}) : helper)))
    + "\" placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"descriptionPlaceholder") || (depth0 != null ? lookupProperty(depth0,"descriptionPlaceholder") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"descriptionPlaceholder","hash":{},"loc":{"start":{"line":16,"column":60},"end":{"line":16,"column":86}}}) : helper)))
    + "\"\r\n           class=\"binf-form-control greet-inlineform-input-hello\">\r\n    <button type=\"button\" class=\"csui-btn-metadata btn\"><span\r\n        class=\"csui-icon icon-metadata\"></span>\r\n    </button>\r\n    <button type=\"submit\"\r\n            class=\"csui-btn-save csui-btn binf-btn binf-btn-default\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"SaveButtonLabel") || (depth0 != null ? lookupProperty(depth0,"SaveButtonLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"SaveButtonLabel","hash":{},"loc":{"start":{"line":22,"column":69},"end":{"line":22,"column":88}}}) : helper)))
    + "</button>\r\n    <button type=\"button\" class=\"csui-btn-cancel csui-btn btn\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"CancelButtonLabel") || (depth0 != null ? lookupProperty(depth0,"CancelButtonLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"CancelButtonLabel","hash":{},"loc":{"start":{"line":23,"column":63},"end":{"line":23,"column":84}}}) : helper)))
    + "</button>\r\n  </div>\r\n</form>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"haveErrorMessage") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":26,"column":0},"end":{"line":30,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('greet_commands_add.hello_custom.inlineform_impl_hello.inlineform', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!greet/commands/add.hello/custom.inlineform/impl/hello.inlineform',[],function(){});
csui.define('greet/commands/add.hello/custom.inlineform/hello.inlineform.view',['csui/lib/jquery', 'csui/lib/underscore',
  'i18n!greet/commands/add.hello/custom.inlineform/impl/nls/lang',
  'csui/controls/table/inlineforms/inlineform.registry',
  'csui/controls/table/inlineforms/inlineform/impl/inlineform.view',
  "hbs!greet/commands/add.hello/custom.inlineform/impl/hello.inlineform",
  "css!greet/commands/add.hello/custom.inlineform/impl/hello.inlineform"
], function ($, _, lang, inlineFormViewRegistry, InlineFormView, template) {
  'use strict';

  var HelloInlineFormView = InlineFormView.extend({

        className: function () {
          var className = "csui-inlineform-hello";
          if (InlineFormView.prototype.className) {
            className += ' ' + _.result(InlineFormView.prototype, 'className');
          }
          return className;
        },

        template: template,

        templateHelpers: function () {
          var data = this._templateHelpers();
          return _.extend(data, {
            namePlaceholder: lang.NamePlaceholder,
            descriptionPlaceholder: lang.DescriptionPlaceholder
          });
        },

        viewToModelData: function () {
          this._viewToModelData();

          var input = _.find(this.ui.descriptionInput, function (input) {
                return input.offsetHeight > 0;
              }),
              value = $(input).val().trim();
          this.model.set('description', value, {silent: true});
        },

        ui: {
          descriptionInput: '.greet-inlineform-input-hello'
        },

        events: {
          'keyup @ui.descriptionInput': 'keyReleased'
        },

        constructor: function HelloInlineFormView(options) {
          this.options = options || {};

          this.ui = _.extend({}, this.ui, InlineFormView.prototype.ui);
          this.events = _.extend({}, this.events, InlineFormView.prototype.events);

          InlineFormView.prototype.constructor.apply(this, arguments);
        },

        _saveIfOk: function () {
          this.viewToModelData();
          var name = this.model.get('name');
          var description = this.model.get('description');
          if (name.length > 0) {
            this._save({name: name, url: description});
          }
        }

      },
      {
        CSSubType: 12345 // Content Server Subtype of Url is 140
      }
  );

  inlineFormViewRegistry.registerByAddableType(HelloInlineFormView.CSSubType, HelloInlineFormView);

  return HelloInlineFormView;

});

csui.define('greet/widgets/hello/impl/hello.model',[
  // MVC component support
  'csui/lib/backbone',
  // CS REST API URL parsing and combining
  'csui/utils/url'
], function (Backbone, Url) {

  var HelloModel = Backbone.Model.extend({

    // Declare model properties with default values
    defaults: {
      name: 'Unnamed'
    },

    // Constructor gives an explicit name to the object in the debugger
    constructor: function HelloModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      // Enable this model for communication with the CS REST API
      if (options && options.connector) {
        options.connector.assignTo(this);
      }
    },

    // Computes the REST API URL using the connection options
    url: function () {
      // /auth returns information about the authenticated user
      return Url.combine(this.connector.connection.url, '/auth');
    },

    // Massage the server response, so that it looks like object attributes
    parse: function (response) {
      // All attributes are placed below the `data` key
      return response.data;
    }

  });

  return HelloModel;

});

csui.define('greet/widgets/hello/impl/hello.model.factory',[
  'csui/utils/contexts/factories/factory',   // Factory base to inherit from
  'csui/utils/contexts/factories/connector', // Factory for the server connector
  'greet/widgets/hello/impl/hello.model'     // Model to create the factory for
], function (ModelFactory, ConnectorFactory, HelloModel) {

  var HelloModelFactory = ModelFactory.extend({

    // Unique prefix of the default model instance, when this model is placed
    // to a context to be shared by multiple widgets
    propertyPrefix: 'hello',

    constructor: function HelloModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      // Obtain the server connector from the application context to share
      // the server connection with the rest of the application; include
      // the options, which can contain settings for dependent factories
      var connector = context.getObject(ConnectorFactory, options);

      // Expose the model instance in the `property` key on this factory
      // instance to be used by the context
      this.property = new HelloModel(undefined, {
        connector: connector
      });
    },

    fetch: function (options) {
      // Just fetch the model exposed by this factory
      return this.property.fetch(options);
    }

  });

  return HelloModelFactory;

});

// Lists explicit locale mappings and fallbacks

csui.define('greet/widgets/hello/impl/nls/hello.lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

// Defines localizable strings in the default language (English)

csui.define('greet/widgets/hello/impl/nls/root/hello.lang',{
  helloMessage: 'Hello {0} {1}!',
  waitMessage: 'One moment, please...'
});



/* START_TEMPLATE */
csui.define('hbs!greet/widgets/hello/impl/hello',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<span>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":1,"column":6},"end":{"line":1,"column":17}}}) : helper)))
    + "</span>\r\n";
}});
Handlebars.registerPartial('greet_widgets_hello_impl_hello', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!greet/widgets/hello/impl/hello',[],function(){});
// An application widget is exposed via a RequireJS module
csui.define('greet/widgets/hello/hello.view',[
  'csui/lib/underscore',                           // Cross-browser utility belt
  'csui/lib/marionette',                           // MVC application support
  'greet/widgets/hello/impl/hello.model.factory',  // Factory for the data model
  'i18n!greet/widgets/hello/impl/nls/hello.lang',  // Use localizable texts
  'hbs!greet/widgets/hello/impl/hello',            // Template to render the HTML
  'css!greet/widgets/hello/impl/hello'             // Stylesheet needed for this view
], function (_, Marionette, HelloModelFactory, lang, template) {

  // An application widget is a view, because it should render a HTML fragment
  var HelloView = Marionette.ItemView.extend({

    // Outermost parent element should contain a unique widget-specific class
    className: 'greet-hello panel panel-default',

    // Template method rendering the HTML for the view
    template: template,

    // Mix additional properties in the template input data
    templateHelpers: function () {
      // Say hello to the authenticated user, if the model has been fetched,
      // otherwise show a waiting message
      var message = this.model.get('id') ?
                    _.str.sformat(lang.helloMessage,
                        this.model.get('first_name'),
                        this.model.get('last_name')) :
                    lang.waitMessage;
      return {
        message: message
      };
    },

    // Constructor gives an explicit name to the object in the debugger and
    // can update the options for the parent view, which `initialize` cannot
    constructor: function HelloView(options) {
      // Obtain the model with the data shown by this view; using the model
      // factory with the context makes the model instance not only shareable
      // with other widgets through the context, but also fetched at the same
      // moment as the other models.
      options.model = options.context.getModel(HelloModelFactory);

      // Models and collections passed via options to the parent constructor
      // are wired to
      Marionette.ItemView.prototype.constructor.call(this, options);

      // Whenever properties of the model change, re-render the view
      this.listenTo(this.model, 'change', this.render);
    }

  });

  return HelloView;

});

csui.define('greet/widgets/metadata/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('greet/widgets/metadata/impl/nls/root/lang',{

  helloTabTitle: 'Hello'

});



/* START_TEMPLATE */
csui.define('hbs!greet/widgets/metadata/panels/hello/metadata.hello',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "Hello, "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":1,"column":7},"end":{"line":1,"column":15}}}) : helper)))
    + "!\r\n";
}});
Handlebars.registerPartial('greet_widgets_metadata_panels_hello_metadata.hello', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!greet/widgets/metadata/panels/hello/metadata.hello',[],function(){});
csui.define('greet/widgets/metadata/panels/hello/metadata.hello.view',['csui/lib/marionette',
  'hbs!greet/widgets/metadata/panels/hello/metadata.hello',
  'css!greet/widgets/metadata/panels/hello/metadata.hello'
], function (Marionette, template) {

  var MetadataHelloView = Marionette.ItemView.extend({

    className: 'greet-metadata-hello',

    template: template,

    constructor: function MetadataHelloView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }

  });

  return MetadataHelloView;

});

csui.define('greet/widgets/metadata/metadata.panels',['i18n!greet/widgets/metadata/impl/nls/lang',
  'greet/widgets/metadata/panels/hello/metadata.hello.view'
], function (lang, MetadataHelloView) {

  return [

    {
      title: lang.helloTabTitle,
      sequence: 100,
      contentView: MetadataHelloView
    }

  ];

});


/* START_TEMPLATE */
csui.define('hbs!greet/widgets/metadata/property.panels/hello/metadata.hello.property',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h3>Greetings</h3>\r\n\r\n<p>Hello, "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":10},"end":{"line":3,"column":18}}}) : helper)))
    + ", in "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"action","hash":{},"loc":{"start":{"line":3,"column":23},"end":{"line":3,"column":33}}}) : helper)))
    + " action!</p>\r\n";
}});
Handlebars.registerPartial('greet_widgets_metadata_property.panels_hello_metadata.hello.property', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!greet/widgets/metadata/property.panels/hello/metadata.hello.property',[],function(){});
csui.define('greet/widgets/metadata/property.panels/hello/metadata.hello.property.view',['csui/lib/marionette',
  'hbs!greet/widgets/metadata/property.panels/hello/metadata.hello.property',
  'css!greet/widgets/metadata/property.panels/hello/metadata.hello.property'
], function (Marionette, template) {

  var MetadataHelloPropertyView = Marionette.ItemView.extend({

    className: 'greet-metadata-property-hello',

    template: template,

    templateHelpers: function () {
      return {
        action: this.options.action || 'update'
      };
    },

    constructor: function MetadataHelloPropertyView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    // This view is being shown during the node creation too;
    // because a form view is expected, this view implements
    // a partial FormView interface too

    validate: function () {
      return true;
    },

    getValues: function () {
      // These values will be merged into the creational object posted
      // to the server; if the model has 'role_name' property defined,
      // the properties will be posted nested in that role
      return {};
    }

  });

  return MetadataHelloPropertyView;

});

csui.define('greet/widgets/metadata/property.panels/hello/metadata.hello.property.controller',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'i18n!greet/widgets/metadata/impl/nls/lang',
  'greet/widgets/metadata/property.panels/hello/metadata.hello.property.view'
], function (_, $, Backbone, Marionette, lang, MetadataHelloPropertyView) {

  var MetadataHelloPropertyController = Marionette.Controller.extend({

    constructor: function MetadataHelloPropertyController(options) {
      Marionette.Controller.prototype.constructor.apply(this, arguments);
    },

    getPropertyPanels: function (options) {
      return this._getCommonPropertyPanels();
    },

    getPropertyPanelsForCreate: function (options) {
      return this._getCommonPropertyPanels();
    },

    getPropertyPanelsForMove: function (options) {
      return this._getCommonPropertyPanels();
    },

    getPropertyPanelsForCopy: function (options) {
      return this._getCommonPropertyPanels();
    },

    _getCommonPropertyPanels: function () {
      var panelModel = new Backbone.Model(_.extend({
        title: lang.helloTabTitle
      }, this.options.model.attributes));
      return $
          .Deferred()
          .resolve([
            {
              model: panelModel,
              contentView: MetadataHelloPropertyView
            }
          ])
          .promise();
    }

  });

  return MetadataHelloPropertyController;

});

csui.define('greet/widgets/metadata/metadata.property.panels',['i18n!greet/widgets/metadata/impl/nls/lang',
  'greet/widgets/metadata/property.panels/hello/metadata.hello.property.controller'
], function (lang, MetadataHelloPropertyController) {

  return [

    {
      sequence: 20,
      controller: MetadataHelloPropertyController
    }

  ];

});

csui.define('greet/perspective.overrides/hello.search/search.perspectives',[],function () {

  return [
    {
      equals: {where: 'hello'},
      module: 'json!greet/perspective.overrides/hello.search/impl/perspectives/search.json'
    }
  ];

});


csui.define('json!greet/perspective.overrides/hello.search/impl/perspectives/search.json',{
  "type": "grid",
  "options": {
    "rows": [
      {
        "columns": [
          {
            "sizes": {
              "sm": 3,
              "md": 2,
              "xxl": 1
            },
            "heights": {
              "xs": "full"
            },
            "widget": {
              "type": "greet/widgets/hello"
            }
          },
          {
            "sizes": {
              "sm": 9,
              "md": 10,
              "xxl": 11
            },
            "heights": {
              "xs": "full"
            },
            "widget": {
              "type": "csui/widgets/search.results",
              "options": {
              }
            }
          }
        ]
      }
    ]
  }
}
);

csui.define('greet/widgets/greeting/greeting.subject.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory'
], function (module, _, Backbone, ModelFactory) {

  var GreetingSubjectModelFactory = ModelFactory.extend({

    propertyPrefix: 'greetingSubject',

    constructor: function GreetingSubjectModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var greetingSubject = this.options.greetingSubject || {};
      if (!(greetingSubject instanceof Backbone.Model)) {
        var config = module.config();
        greetingSubject = new Backbone.Model(greetingSubject.attributes, _.extend({},
            greetingSubject.options, config.options));
      }
      this.property = greetingSubject;
    }

  });

  return GreetingSubjectModelFactory;

});

csui.define('greet/perspective.context.plugins/greetings/hello.perspective.context.plugin',['csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/application.scope.factory',
  'greet/widgets/greeting/greeting.subject.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin'
], function (_, Backbone, ApplicationScopeModelFactory,
    GreetingSubjectModelFactory, PerspectiveContextPlugin) {
  'use strict';

  var HelloPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function LandingPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory)
          .on('change', this._fetchHelloPerspective, this);
      this.greetingSubject = this.context
          .getModel(GreetingSubjectModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change:id', this._fetchHelloPerspective, this);
    },

    _fetchHelloPerspective: function () {
      // Skip scopes handled by other plugin
      var subject = this.greetingSubject.get('id');
      if (!subject && this.applicationScope.id !== 'greetings') {
        return;
      }
      this.applicationScope.set('id', 'greetings');
      var perspectivePath = 'json!greet/perspective.context.plugins/greetings/impl/perspectives/',
          perspectiveModule = subject ? 'one.greeting.json' : 'all.greetings.json';
      this.context.loadPerspective(perspectivePath + perspectiveModule);
    }

  });

  return HelloPerspectiveContextPlugin;

});

csui.define('greet/perspective.routers/greetings/hello.perspective.router',['csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/application.scope.factory',
  'greet/widgets/greeting/greeting.subject.factory'
], function (PerspectiveRouter, ApplicationScopeModelFactory,
    GreetingSubjectModelFactory) {
  'use strict';

  var HelloPerspectiveRouter = PerspectiveRouter.extend({

    routes: {
      'greetings': 'openAllGreetings',
      'greetings/:id': 'openOneGreeting'
    },

    constructor: function HelloPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change', this._updateUrl);

      this.greetingSubject = this.context.getModel(GreetingSubjectModelFactory);
      this.listenTo(this.greetingSubject, 'change', this._updateUrl);
    },

    openAllGreetings: function () {
      this.greetingSubject.clear();
      this.applicationScope.set('id', 'greetings');
    },

    openOneGreeting: function (id) {
      this.greetingSubject.set('id', id);
    },

    onOtherRoute: function () {
      this.greetingSubject.clear({silent: true});
    },

    _updateUrl: function () {
      // Skip scopes handled by other routers
      var subject = this.greetingSubject.get('id');
      if (!subject && this.applicationScope.id !== 'greetings') {
        return;
      }
      var url = 'greetings';
      if (subject) {
        url += '/' + subject;
      }
      this.navigate(url);
    }

  });

  return HelloPerspectiveRouter;

});


csui.define('json!greet/perspective.context.plugins/greetings/impl/perspectives/all.greetings.json',{
  "type": "grid",
  "options": {
    "rows": [
      {
        "columns": [
          {
            "sizes": {
              "md": 12
            },
            "widget": {
              "type": "greet/widgets/hello",
              "options": {
              }
            }
          }
        ]
      }
    ]
  }
}
);


csui.define('json!greet/perspective.context.plugins/greetings/impl/perspectives/one.greeting.json',{
  "type": "grid",
  "options": {
    "rows": [
      {
        "columns": [
          {
            "sizes": {
              "md": 12
            },
            "heights": {
              "xs": "full"
            },
            "widget": {
              "type": "greet/widgets/greeting",
              "options": {
              }
            }
          }
        ]
      }
    ]
  }
}
);


csui.define('json!greet/widgets/hello/hello.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "Hello",
  "description": "Welcomes the current user.",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {}
  }
}
);

// Placeholder for the build target file; the name must be the same,
// include public modules from this component

csui.define('bundles/greet-all',[
  // Commands
  'greet/commands/hello/hello.command',
  'greet/commands/add.hello/add.hello.command',
  'greet/commands/add.hello/add.hello.template.command',

  // Toolbar buttons
  'greet/commands/hello/hello.nodestable.toolitems',
  'greet/commands/add.hello/add.hello.tabletoolbar.extension',

  // Cell views
  'greet/controls/cells/hello/hello.view',

  // Inline forms
  'greet/commands/add.hello/impl/hello.inlineform.view',
  'greet/commands/add.hello/custom.inlineform/hello.inlineform.view',
  

  // Application widgets
  'greet/widgets/hello/hello.view',

  // Metadata widget extensions
  "greet/widgets/metadata/metadata.panels",
  "greet/widgets/metadata/metadata.property.panels",

  // Perspective overrides
  'greet/perspective.overrides/hello.search/search.perspectives',
  'json!greet/perspective.overrides/hello.search/impl/perspectives/search.json',

  // Perspective context plugins and routers
  'greet/perspective.context.plugins/greetings/hello.perspective.context.plugin',
  'greet/perspective.routers/greetings/hello.perspective.router',
  'json!greet/perspective.context.plugins/greetings/impl/perspectives/all.greetings.json',
  'json!greet/perspective.context.plugins/greetings/impl/perspectives/one.greeting.json',

  // Widget manifests
  'json!greet/widgets/hello/hello.manifest.json'
], {});

csui.require(['require', 'css'], function (require, css) {

  css.styleLoad(require, 'greet/bundles/greet-all', true);

});

