define(['csui/utils/commands/open.classic.page', 'csui/controls/dialog/dialog.view', 'csui/lib/backbone', 'i18n!dmss/commands/open.classic/impl/nls/lang', 'csui/utils/commandhelper', 'csui/utils/contexts/factories/connector', 'csui/utils/nodesprites', 'json!dmss/config/info.config.json'
], function (OpenClassicPageCommand, DialogView, Backbone, Translations, CommandHelper, ConnectorFactory, nodeSpriteCollection, settings) {
  'use strict';

  const singleMode = 'single';
  const multiMode = 'multi';
  
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

          console.info(data);

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

    console.info({
      "documentId": addver,
      "newDocumentName": name,
      "containerDocuments": docs
    });

    console.info(docs);

      //ajax request to create container
      Backbone.ajax({
        type: "POST",
        cache: false,
        contentType: "application/json",
        url: settings.COMPOSE_CONTAINER_API,
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
            alert(e);
          }
        },
        error: function(error){
          alert(error);
        }
    })

    return containerid;
  }

  var parseNodeList = function(nodelist){
    let idlist = [];

    for (let i = 0; i < nodelist.models.length; i++){
      idlist.push(nodelist.models[i].attributes.id);
    }

    return idlist.toString();
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

      require(['csui/controls/dialog/dialog.view', 
      'dmss/commands/open.classic/impl/sign.view' 
      ], function(DialogView, CreateContainerView){  
        let connector = options.context.getObject(ConnectorFactory),
            nodes = CommandHelper.getAtLeastOneNode(nodeList),
            containerModel = new Backbone.Model(),
            isSinglePdfOrAsice = true,
            docListHTML = '<table class="container_doc_list binf-table dataTable"><thead><th class="csui-table-cell-name">' + Translations.docListHeader + '</th>'+ 
            '</thead>',
            rootFolderID = nodes.models[0].attributes.parent_id;

            //if only 1 node is selected and datatype is container
            if ((nodes.models.length == 1) && (settings.ALLOWED_MIMETYPES.includes(nodes.models[0].attributes.mime_type))){
              //then UI is not needed, only put information message about redirect  
              docListHTML = docListHTML + drawBrowseViewHTML(nodes, connector, singleMode);
               } else {
              //if selected more than 1 document, then container creation is must have
              isSinglePdfOrAsice = false;
              docListHTML = docListHTML + drawBrowseViewHTML(nodes, connector, multiMode) + '</table>';
            }

            var createView = new CreateContainerView({model: containerModel, docs:docListHTML}); 
            var dialog = new DialogView({
              title: Translations.dialogTitle,
              view:  createView
            });     
      
            dialog.show();

            createView.on('sign', function (e) {
              let endpointAlternateView = settings.GATEWAY_ALTERNATE_VIEW_API;
              let endpointCreateContainer = settings.COMPOSE_CONTAINER_API;
              let ticket = connector.connection.session.ticket;
              let needConCreation = !isSinglePdfOrAsice;
              
              if (needConCreation){
                createView.ui.status.text("Creating container and redirecting to signing view...");
                createView.ui.status.show();  

                let containerID = getContainerPlaceholderId(createView.ui.verselection);
                let newContainerName = changeExtensionToAsice(getContainerPlaceholderName(createView.ui.verselection));
                let nodeList = getCheckedNodes(createView.ui.conselection);
                
                createContainer(endpointCreateContainer, ticket, nodeList, containerID, newContainerName, function(data){
                    getAlternateViewURL(endpointAlternateView, ticket, containerID, rootFolderID, function(result){
                      if (!result.error) {
                          window.location = result.location;
                      } else 
                      {
                        createView.ui.status.text(result.error);
                        refreshView(createView.ui);
                      }
                    })
                });
              } else {
                let id = nodes.models[0].attributes.id;
     
                //open SignBox alternative view for created container ID  
                createView.ui.status.text("Redirecting to signing view...");
                createView.ui.status.show();          
                
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
    
          })
    }
    
  });

  return OpenClassicCommand;

});
