define(['csui/utils/commands/open.classic.page', 'csui/controls/dialog/dialog.view', 'csui/lib/backbone', 'i18n!dmss/commands/open.classic/impl/nls/lang', 'csui/utils/commandhelper', 'csui/utils/contexts/factories/connector', 'csui/utils/nodesprites', 'json!dmss/config/info.config.json'
], function (OpenClassicPageCommand, DialogView, Backbone, Translations, CommandHelper, ConnectorFactory, nodeSpriteCollection, settings) {
  'use strict';
  
  var redirectURI = function(session, docid){
    let sessionString = "?session=" + session;
    let docidString = "&docId=" + docid;
    let redirectURIString = "&redirectUrl=" + window.location.href;
    let url = settings.EXT_PORTAL_HOST_URL + "/extportal/alternative/document";
    
    url = url + sessionString + docidString + redirectURIString;

    return url;
  }

  var OpenClassicCommand = OpenClassicPageCommand.extend({
    
    defaults: {
      signature: 'dmssSign',
      scope: 'single'
    },

    enabled: function (nodes) {
      var node = CommandHelper.getJustOneNode(nodes);

      if (settings.ALLOWED_MIMETYPES.includes(node.attributes.mime_type ))
        return true;
      else 
        return false;
    },    

    getUrlQueryParameters: function (node, options) {
    },

    execute: function (nodeList, options){

      require(['csui/controls/dialog/dialog.view', 
      'dmss/commands/open.classic/impl/sign.view' 
      ], function(DialogView, CreateContainerView){  
        var connector = options.context.getObject(ConnectorFactory);
        var nodes = CommandHelper.getAtLeastOneNode(nodeList),
            containerIsCreated = false,
            containerModel = new Backbone.Model();
              
            var docListHTML = '<table class="container_doc_list binf-table dataTable"><thead><th class="csui-table-cell-name">' + Translations.docListHeader + '</th>'+ 
            '</thead>';

            var index = 0;
            var docIDs = [];
            var selected = 'checked';
            var firstDocName = '';

            //go thrue selected objects and draw table
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
   
             index = i + 1;
   
             var icon_cell = '<td class="csui-table-cell-type" data-csui-attribute="type">' +
              '<div class="csui-table-cell-name-div">' +
              '<a class="csui-table-cell-default-action" href="' + connector.connection.url + '/app/nodes/' + nodes.models[i].attributes.id + '" aria-label="' + nodes.models[i].attributes.name + '" tabindex="-1">' 
                + '<span class="csui-icon-group" title="' + nameTitleAria + '" aria-label="' + nameTitleAria + '"><span class="' + exactNodeSprite.attributes.className + '"></span>' +
                  '</span>' + nodes.models[i].attributes.name + 
                '</a>' 
            + '</div>' 
          + '</td>';
   
             if (i != 0)
               selected = '';
             else 
               firstDocName = nodes.models[i].attributes.name;
   
              docListHTML = docListHTML + '<tr style="display:block;">' + icon_cell + '</tr>';
   
               docIDs.push(nodes.models[i].attributes.id);
           }           

            var createView = new CreateContainerView({model: containerModel, docs:docListHTML}); 

            var dialog = new DialogView({
              title: Translations.dialogTitle,
              view:  createView
            });     
      
            dialog.show();

            createView.on('submit', function (e, params) {
              let endpoint = settings.GATEWAY_TICKET_API;
              let ticket = connector.connection.session.ticket;
              let selectedDocumentID = nodes.models[0].attributes.id;
              
                  Backbone.ajax({
                      type: "POST",
                      cache: false,
                      url: endpoint,
                      headers: { 'OTCSTICKET': ticket},
                      success: function(data){		
                        window.location.href = redirectURI(data.session, selectedDocumentID);
                      },
                      error: function(error){
                        alert(error);
                      }
                  })              
            })
      
          })
    }
    
  });

  return OpenClassicCommand;

});
