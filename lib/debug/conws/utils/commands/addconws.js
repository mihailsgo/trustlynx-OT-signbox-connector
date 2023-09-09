/**
 * Created by stefang on 14.09.2015.
 */
csui.define(['require',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/base',
  'csui/utils/log',
  'csui/models/command',
  'csui/models/node/node.model',
  'i18n!conws/utils/commands/nls/commands.lang',
  // style conws-initializing and conws-add-workspace
  //'css!xecmpf/controls/property.panels/reference/impl/reference.panel'
], function (require, $, _, base, log,
    CommandModel,
    NodeModel,
    lang) {

  var forwardToTable = false;

  var AddWorkspaceCommand = CommandModel.extend({

    defaults:{
      signature: 'AddConnectedWorkspace',
      name: lang.CommandNameAddConnectedWorkspace,
      verb: "create",//lang.CommandVerbCopy,
      doneVerb: "created",//lang.CommandDoneVerbCopy,
      scope: 'single'
    },

    enabled: function(status){
      return true;
    },

    execute: function (status, options) {

      var deferred = $.Deferred(),
          data = status.data || {},
          container = status.container || {},
          wsType = data.wsType || {},
          template = data.template || {},
          subType = data.subType,
          subTypeName = data.subTypeName,
          newNode = new NodeModel({
            "type": subType, //options.addableType,
            "type_name": subTypeName,
            "container": true,
            "name": "", // start with empty name
            "parent_id": container.attributes.id,
            "rm_enabled": wsType.rm_enabled,
            "sub_folder_id": 0
          }, {
            connector: status.container.connector
          });

      //status.container.cmdContainer = "AddConwsContainer";
      //newNode.cmdNode = "AddConwsNode";

      if (forwardToTable) {
        status.forwardToTable = true;
        deferred.resolve(newNode);
      }
      else {
        status.suppressSuccessMessage = true;
        require(['csui/models/nodes',
          'csui/widgets/metadata/metadata.add.item.controller',
          'csui/dialogs/modal.alert/modal.alert',
          'csui/controls/globalmessage/globalmessage',
          'conws/models/workspacecreateforms',
          'conws/models/metadata.controller',
          'csui/behaviors/default.action/default.action.behavior',
          'csui/utils/contexts/factories/next.node'
        ], function (NodeCollection,
            MetadataAddItemController,
            ModalAlert,
            GlobalMessage,
            WorkspaceCreateFormCollection,
            WorkspaceMetadataController,
            DefaultActionBehavior,
            NextNodeModelFactory
        ) {

          // substitute nodes list, so we do not change the selection!
          status.nodes = new NodeCollection([newNode]);

          //status.cmdStatus = "AddConwsStatus";
          //status.nodes.cmdNodes = "AddConwsNodes";
          //options.cmdOptions = "AddConwsOptions";

          // Override the default form source for the creation dialog
          // and the default controller to create the new object
          options = _.extend({
            formCollection: options.formCollection || new WorkspaceCreateFormCollection(undefined, {
              node: status.container,
              type: subType, //options.addableType
              wsType: wsType,
              template: template
            }),
            metadataController: options.metadataController || new WorkspaceMetadataController(undefined, {
              type: subType,
              wsType: wsType,
              template: template,
              collection: status.collection
            })
          }, options);

          options.dialogTitle = _.str.sformat(lang.AddConwsMetadataDialogTitle,template.name||lang.BusinessWorkspace);
          options.addButtonTitle = lang.AddConwsMetadataDialogAddButtonTitle;

          var formCollection = options.formCollection;
          var formOptions = formCollection.options || (formCollection.options = {});
          var metadataAddItemController = formOptions.metadataAddItemController || (formOptions.metadataAddItemController = new MetadataAddItemController());

          // methods for handling of name field: set readonly style and placeholder in name field.
          function hideNameAndView() {
            // hide initial place holder as we don't have the read-only information from the server
            var dialog = metadataAddItemController.dialog;
            if (dialog && dialog.$el) {
              dialog.$el.addClass("conws-initializing");
              formCollection.off(null,hideNameAndView);
            }
          }
          function unhideNameAndView() {
            // make name field visible again.
            var dialog = metadataAddItemController.dialog;
            if (dialog && dialog.$el) {
              dialog.$el.removeClass("conws-initializing");
              formCollection.off(null,unhideNameAndView);
            }
          }

          function successWithLinkMessage() {
            var message = _.str.sformat(lang.BusinessWorkspaceSuccessfullyCreated, newNode.get('name'));
            var msgOptions = {
              context: status.context,
              nextNodeModelFactory: NextNodeModelFactory,
              link_url: DefaultActionBehavior.getDefaultActionNodeUrl(newNode),
              link_label: lang.CommandMessageOpen,
              targetFolder: newNode
            };
            GlobalMessage.showMessage('success_with_link', message, undefined, msgOptions);
          }

          // show node in table or show success message
          function showNodeOrMessage() {
            var update = false;
            status.collection.forEach(function (item) {
              if (item.get("id") === newNode.get("id")) {
                item.set(newNode.attributes);
                update = true;
              }
            });
            if (!update) {
              var folder_id = status.collection.node.get('id'),
                  parent_id = newNode.get('parent_id'),
                  sub_folder_id = newNode.get('sub_folder_id');
              if (folder_id === parent_id || folder_id === -parent_id) {
                  status.collection.add(newNode, {at: 0});
              } else {
                if ( folder_id !== sub_folder_id && sub_folder_id !== 0 ) { //CWS-5155
                  var sub_folder = new NodeModel( {id: sub_folder_id }, { connector: status.container.connector, collection: status.collection });
                  sub_folder.fetch( { success: function () {
                    if ( sub_folder.get('parent_id') === folder_id ) {
                      if (status.collection.findWhere({id: sub_folder.get("id")}) === undefined) {
                        sub_folder.isLocallyCreated = true;
                        status.collection.add(sub_folder, {at: 0});
                      }
                    }
                    // as the workspace got created at different place
                    // show message after subFolder added to the nodes table
                    successWithLinkMessage();
                  }, error: function(err) {
                    ModalAlert.showError(lang.ErrorAddingSubfolderToNodesTable);
                    successWithLinkMessage();
                  }});
                } else {
                  // simply show message If the workspace got created
                  // in target location (XYZ folder) but created from (ABC folder)
                  successWithLinkMessage();
                }
              }
            }
          }

          // if enabled open new BWS after creation CWS-4584
          function openNewWorkspace() {
            status.context.viewStateModel.set('conwsNavigate', 'browseView' );
            var nextNode = status.context.getModel(NextNodeModelFactory);
            nextNode.set('id', newNode.get('id'));
          }

          // set special class on the dialog, so we can give our own styles on the dialog
          formCollection.on("request",function() {
            var dialog = metadataAddItemController.dialog;
            if (dialog && dialog.$el) {
              dialog.$el.addClass("conws-add-workspace");
            }
          });

          formCollection.once("request",hideNameAndView); // hide when forms is fetched first time
          formCollection.once("sync",unhideNameAndView); // unhide when forms have been fetched
          formCollection.once("error",unhideNameAndView); // unhide also in error case
          formCollection.on("sync",function(){ updateNameAndView(newNode,formCollection,metadataAddItemController);});
          formCollection.on("error",function(model, response, options){
              var errmsg = response && (new base.Error(response)).message || lang.errorGettingCreateForm;
              log.error("Fetching the create forms failed: {0}",errmsg) && console.error(log.last);
              ModalAlert.showError(errmsg);
          });

          metadataAddItemController
              .displayForm(status, options)
              .then(function () {
                newNode.isLocallyCreated = true;
                if (newNode.attributes.direct_open){
                  openNewWorkspace();
                } else {
                  showNodeOrMessage();
                }
                deferred.resolve.apply(deferred, arguments);
              })
              .fail(function (error) {
                if (error instanceof Error) {
                  deferred.reject(error);
                } else {
                  // cancel clicked or escape pressed
                  deferred.reject();
                }
              });
          // set controller, so unit tests can get the view and wait for end of rendering.
          status.metadataAddItemController = metadataAddItemController;
        }, function (error) {
          deferred.reject(error);
        });
      }

      return deferred.promise();
    }
  });

  function updateNameAndView (nodeModel, formCollection, metadataAddItemController) {
    // we have special behavior for the name field, depending on the forms result.
    // so we put the code here, where we have access to the name field in the dialog header.
    var general = formCollection.at(0);
    if (!nodeModel.get("id")) {
      // due to LPAD-50061, the form collection is fetched after save.
      // to avoid CWS-1140, we change the name only if id is not set.
      var data = general.get("data");
      if (data) {
        var name = data.name;
        log.debug("name fetched and used: {0}",name) && console.log(log.last);
        nodeModel.set("name",name);
      } else {
        // if no server data object is set, then we set an empty name.
        log.debug("name set to empty.") && console.log(log.last);
        nodeModel.set("name","");
      }
    }
    var metadataView = metadataAddItemController.metadataAddItemPropView,
        headerView = metadataView && metadataView.metadataHeaderView,
        nameView = headerView && headerView.metadataItemNameView;
    if (nameView) {
      var gs = general.get("schema"),
          isReadOnly = (gs && gs.properties && gs.properties.name && gs.properties.name.readonly) ? true : false,
          placeHolder = isReadOnly ? lang.nameIsGeneratedAutomatically : undefined;
      nameView.setPlaceHolder(placeHolder);
      if (isReadOnly && metadataView && metadataView.metadataPropertiesView) {
        metadataView.metadataPropertiesView.once("render:forms",function() {
		  //If read only, remove the role for the place holder text
          this.options.metadataView.metadataHeaderView.metadataItemNameView.$el.find('span.title').removeAttr("role");
		  var focusEl = this.currentlyFocusedElement();
          if (focusEl) {
            focusEl.trigger('focus');
          }
        });
      }
    }
  }

  return AddWorkspaceCommand;
});
