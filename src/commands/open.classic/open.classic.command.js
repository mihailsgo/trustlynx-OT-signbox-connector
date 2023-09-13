define(['csui/utils/commands/open.classic.page', 'csui/controls/dialog/dialog.view', 'csui/lib/backbone', 'i18n!dmss/commands/open.classic/impl/nls/lang', 'csui/utils/commandhelper', 'csui/utils/contexts/factories/connector', 'csui/utils/nodesprites', 'json!dmss/config/info.config.json'
], function (OpenClassicPageCommand, DialogView, Backbone, Translations, CommandHelper, ConnectorFactory, nodeSpriteCollection, settings) {
  'use strict';

  const singleMode = 'single';
  const multiMode = 'multi';
  const modeSign = 'Sign';
  const modeShare = 'Share';
  const modeShareAndSign = 'Share And Sign';

  var getDialogTitle = function(mode){
    let dialogTitle = "";

    switch (mode){
      case modeSign:
           dialogTitle = Translations.submitSignLabel;
           break;
      case modeShare:
           dialogTitle = Translations.submitShareLabel;
           break;
      default: 
           dialogTitle = Translations.dialogTitleShareOrSign;  
    }
    
    return dialogTitle;
  }
  
  var isSingleAsiceOrPDF = function(nodes){
    if ((nodes.models.length == 1) && (settings.ALLOWED_MIMETYPES.includes(nodes.models[0].attributes.mime_type))) {
      return true;
    } else {
      return false;
    }
  }

  var internalPortalRedirect = function(docId){
      window.location = settings.INTERNAL_PORTAL_URL + "?id=" + docId;
  }

  var buildInterface = function(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerView, mode){
    let docListHTML = '<table class="container_doc_list binf-table dataTable"><thead><th class="csui-table-cell-name">' + Translations.docListHeader + '</th>'+ 
    '</thead>';
    let endpointCreateContainer = settings.COMPOSE_CONTAINER_API;

    if (isSinglePdfOrAsice){
      docListHTML = docListHTML + drawBrowseViewHTML(nodes, connector, singleMode);
    } else {
      docListHTML = docListHTML + drawBrowseViewHTML(nodes, connector, multiMode) + '</table>';
    }

    let dialogTitle = getDialogTitle(mode);
    let createView = new CreateContainerView({model: containerModel, docs:docListHTML, mode: mode}); 
    let dialog = new DialogView({
      title: dialogTitle,
      view:  createView
    });    
 
    //BELOW ARE EVENTS FOR BOTH CONT. CREATION INTERFACE
    createView.on('sign', function (e) {

      console.info('sign event detected');

      let endpointAlternateView = settings.GATEWAY_ALTERNATE_VIEW_API;
      let ticket = connector.connection.session.ticket;
      let needConCreation = !isSinglePdfOrAsice;
      
      if (needConCreation){
        createView.ui.status.text("Creating container and redirecting to signing view...");

        let containerID = getContainerPlaceholderId(createView.ui.verselection);
        let newContainerName = changeExtensionToAsice(getContainerPlaceholderName(createView.ui.verselection));
        let nodeList = getCheckedNodes(createView.ui.conselection);
        
        createContainer(endpointCreateContainer, ticket, nodeList, containerID, newContainerName, function(data){
          console.info(data);
          if (!data.error){
              getAlternateViewURL(endpointAlternateView, ticket, containerID, rootFolderID, function(result){
                if (!result.error) {
                    window.location = result.location;
                } else 
                {
                  createView.ui.status.text(result.error);
                  refreshView(createView.ui);
                }
              })
          } else {
            createView.ui.status.text(data.error);
          }
        });
      } else {
        let id = nodes.models[0].attributes.id;

        //open SignBox alternative view for created container ID  
        createView.ui.status.text("Redirecting to signing view...");
       
        getAlternateViewURL(endpointAlternateView, ticket, id, rootFolderID, function(result){
          if (!result.error) {
              window.location = result.location;
          } else 
          {
            createView.ui.status.text(result.error);
            refreshView(createView.ui);
          }
        })
      }

    }) 
    
    //share to start external signing process
    
    createView.on('share', function (e) {

      console.info('share event detected');

      let needConCreation = !isSinglePdfOrAsice;
      let ticket = connector.connection.session.ticket;
      
      if (needConCreation){
        createView.ui.status.text("Creating container and redirecting to signing view...");
        createView.ui.status.show();  

        let containerID = getContainerPlaceholderId(createView.ui.verselection);
        let newContainerName = changeExtensionToAsice(getContainerPlaceholderName(createView.ui.verselection));
        let nodeList = getCheckedNodes(createView.ui.conselection);
        
        createContainer(endpointCreateContainer, ticket, nodeList, containerID, newContainerName, function(data){
          
          console.info(data);

          if (!data.error){
             internalPortalRedirect(containerID);
          } else {
            createView.ui.status.text(data.error);
            refreshView(createView.ui);
          }
        });
      } else {
        let id = nodes.models[0].attributes.id;
        internalPortalRedirect(id);
      }
    })      
    

    return dialog;
  }

  //remove loading icon and button disabled effect
  var refreshView = function(ui){
    ui.loader.addClass('binf-hidden'); 
    ui.sign.removeClass('binf-disabled').removeAttr('disabled');
    ui.share.removeClass('binf-disabled').removeAttr('disabled');
  }

  var changeExtensionToAsice = function(name){
    return name.replace(/\.[^/.]+$/, "") + ".asice"
  }

  var getCheckedNodes = function(checkbtns){
    let nodes = [];

    for (let i = 0; i < checkbtns.length; i++){
      if (checkbtns[i].checked) {
        let currentNode = {}
        try{
          currentNode.documentId = checkbtns[i].id.split('chk_')[1];
          currentNode.fileName = checkbtns[i].dataset.name;
          nodes.push(currentNode);
        } catch(e){
          console.info(e);
        }
      }
    }    

    return nodes;
  }

  var getContainerPlaceholderName = function(radiobtns){
    let containerName = "";

    for (let i = 0; i < radiobtns.length; i++){
      if (radiobtns[i].checked) {
        try{
          containerName = radiobtns[i].dataset.name;
        } catch(e){
          console.info(e);
        }
        break;
      }
    }

    return containerName;
  }

  var getContainerPlaceholderId = function(radiobtns){
    let containerID = 0;

    for (let i = 0; i < radiobtns.length; i++){
      if (radiobtns[i].checked) {
        try{
         containerID = radiobtns[i].id.split('radio_')[1];
        } catch(e){
          console.info(e);
        }
        break;
      }
    }

    return containerID;
  }
  
  var getAlternateViewURL = function(endpoint, ticket, id, rootFolderID, callback){
      Backbone.ajax({
        type: "POST",
        cache: false,
        url: endpoint,
        data: {
          redirecturl: settings.OTCS_REDIRECT_URL + rootFolderID,
          documentid: id
        },
        headers: { 'OTCSTICKET': ticket},
        success: function(data){		
          try {
            callback(
                      {
                         location: data.location
                      }   
                  );
          } catch(e){
            callback(
              {
                 error: settings.ERROR_GENERAL
              }   
          );
          }
        },
        error: function(error){
          console.info(error);
          callback(
            {
              error: settings.ERROR_GENERAL
            }  
          )
        }
      })    
  }

  //return created container ID
  var createContainer = function(endpointCreateContainer, ticket, docs, addver, name, callback){
    let containerid;
      //ajax request to create container
      Backbone.ajax({
        type: "POST",
        cache: false,
        contentType: "application/json",
        url: endpointCreateContainer,
        dataType: "json",
        data: JSON.stringify(
                              {
                                "documentId": addver,
                                "newDocumentName": name,
                                "containerDocuments": docs
                              })
        ,
        headers: { 'OTCSTICKET': ticket},
        success: function(data){		
          try {
              callback(data);
          } catch(e){
            callback(
              {
                 error: settings.ERROR_GENERAL
              }   
             );
          }
        },
        error: function(error){
          callback(
            {
              error: settings.ERROR_GENERAL
            }
          )
        }
    })

    return containerid;
  }

  // draw browse view html. Mode single doc / multi docs.
  var drawBrowseViewHTML = function(nodes, connector, mode){
    let docListHTML = '';
    let radioCheckFirst = '';

    for (let i = 0; i < nodes.models.length; i++){
      let nameTitleAria = '';
      let exactNodeSprite = nodeSpriteCollection.findByNode(nodes.models[i]) || {};
      let mimeTypeFromNodeSprite = '';

    if (exactNodeSprite.attributes) {
      mimeTypeFromNodeSprite = exactNodeSprite.get('mimeType');
    }
    let title = mimeTypeFromNodeSprite || nodes.models[i].get("type_name") || this.model.get("type");
    if (nodes.models[i].get("name") && title) {
      nameTitleAria = title;
    }
    
    if (i == 0)
      radioCheckFirst = 'checked';
    else 
      radioCheckFirst = '';
    
    let radio_cell = (mode == multiMode) ? '<td><input ' + radioCheckFirst + ' data-name="' + nodes.models[i].attributes.name + '" class="otdoc_version" type="radio" id="radio_' + nodes.models[i].attributes.id + '" name="addversion" /></td>' : '<td></td>';
    let checkbox_cell = (mode == multiMode) ? '<td><input class="otdoc_container" type="checkbox" data-name="' + nodes.models[i].attributes.name + '" id="chk_' + nodes.models[i].attributes.id + '" data-id="' + nodes.models[i].attributes.id + '" checked /></td>' : '<td></td>';

    let icon_cell = '<td class="csui-table-cell-type" data-csui-attribute="type">' +
      '<div class="csui-table-cell-name-div">' +
      '<a class="csui-table-cell-default-action" href="' + connector.connection.url + '/app/nodes/' + nodes.models[i].attributes.id + '" aria-label="' + nodes.models[i].attributes.name + '" tabindex="-1">' 
        + '<span class="csui-icon-group" title="' + nameTitleAria + '" aria-label="' + nameTitleAria + '"><span class="' + exactNodeSprite.attributes.className + '"></span>' +
          '</span>' + nodes.models[i].attributes.name + 
        '</a>' 
    + '</div>' 
    + '</td>';
      docListHTML = docListHTML + '<tr style="display:block;">' + checkbox_cell + radio_cell + icon_cell + '</tr>';
    }

    return docListHTML;
  }

  var OpenClassicCommand = OpenClassicPageCommand.extend({
    
    defaults: {
      signature: 'dmssSign',
      scope: 'single'
    },

    enabled: function (nodes) {
      return true;
    },    

    getUrlQueryParameters: function (node, options) {
    },

    execute: function (nodeList, options){

      let buttonTypePressed = options.addableTypeName,
          connector = options.context.getObject(ConnectorFactory),
          ticket = connector.connection.session.ticket,
          endpointAlternateView = settings.GATEWAY_ALTERNATE_VIEW_API;     

      require(['csui/controls/dialog/dialog.view', 
      'dmss/commands/open.classic/impl/sign.view' 
      ], function(DialogView, CreateContainerView){  
       let  nodes = CommandHelper.getAtLeastOneNode(nodeList),
            containerModel = new Backbone.Model(),
            rootFolderID = nodes.models[0].attributes.parent_id,
            isSinglePdfOrAsice = isSingleAsiceOrPDF(nodes);

             switch (buttonTypePressed){
              case "Sign": 
                if (isSinglePdfOrAsice){
                  getAlternateViewURL(endpointAlternateView, ticket, nodes.models[0].attributes.id, rootFolderID, function(result){
                    if (!result.error) {
                        window.location = result.location;
                    } else 
                    {
                      console.log(result.error);
                    }
                  })                   
                } else {
                    //container interface
                    let dialog = buildInterface(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerView, modeSign);
                        dialog.show();
                }
              break;
              case "Share": 
                  if (isSinglePdfOrAsice){
                      internalPortalRedirect(nodes.models[0].attributes.id);
                  } else {
                    //container interface
                    let dialog = buildInterface(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerView, modeShare);
                        dialog.show();                    
                  }             
              break;
              case "Sign or share as ASICE": 
                  //container interface
                  let dialog = buildInterface(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerView, modeShareAndSign);
                  dialog.show();                    
              break;
            }
          })
        }
 });

  return OpenClassicCommand;

});
