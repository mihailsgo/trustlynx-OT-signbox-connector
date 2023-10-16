csui.define('dmss/commands/open.classic/impl/sign.view',['csui/lib/jquery', 'csui/lib/marionette',
  'i18n!dmss/commands/open.classic/impl/nls/lang',
  'hbs!dmss/commands/open.classic/impl/sign', 'csui/lib/backbone', 'csui/utils/contexts/factories/connector', 'json!dmss/config/dmss.config.json'
], function ($, Marionette, lang, template, Backbone, ConnectorFactory, config) {
  'use strict';

  var CreateContainerView = Marionette.ItemView.extend({

    initialize: function () {
    },

    onRender: function() {
      switch(this.options.mode){
        case 'Sign':
          this.ui.share.hide();
          this.ui.status.text(lang.createContainerInformationModeSign);
          break;
        case 'Share':
          this.ui.sign.hide();
          this.ui.status.text(lang.createContainerInformationModeShare);
          break;
        default: 
          this.ui.status.text(lang.createContainerInformationModeShareOrSin);
          break;
      }
    },

    constructor: function CreateContainerView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      
      this.model.set({
        uniqueId: this.cid,
        newName: this.model.get('oldName'),
        lang: lang,
        docs: this.options.docs
      });
      
    },

    className: 'container-create',

    template: template,

    ui: {
      error: '.container-error',
      share: '.container-share',
	    sign: '.container-sign',
      status: '.status-placeholder',
      form: '.main-form',
      loader: '.load-container',
      verselection: '.otdoc_version',
      conselection: '.otdoc_container'
    },

    events: {
      'click @ui.share': function (event) {
        event.preventDefault();
        this.triggerMethod('share', this);
      },
      'click @ui.sign': function (event) {
        event.preventDefault();
        this.triggerMethod('sign', this);
      }
    },

    modelEvents: {
      'change:errorMessage': function () {
        var errorMessage = this.model.get('errorMessage') || '',
            classMethod = errorMessage ? 'removeClass' : 'addClass';
        this.ui.error
            [classMethod]('binf-hidden')
            .text(errorMessage);
      }
    },

    onDomRefresh: function () {
      //this.ui.name.focus();
    },

    _shareFormFilled: function(){
       return true;
    },
  });
  return CreateContainerView;
});

csui.define('dmss/commands/open.classic/impl/nls/lang',{
  "root": true,
  "lv": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('dmss/commands/open.classic/impl/nls/root/lang',{
  toolbarButtonTitle: 'Sign',
  dialogTitle: 'Document signing',
  submitLabel: 'Create',
  submitSignLabel: 'Create ASICE container and sign',
  submitShareLabel: 'Create ASICE container and share',
  docListHeader: 'Selected Documents',
  addNewVersion: 'Add version',
  createNew: 'Create new document',
  categoriesLabel: 'Categories',
  categoryPlaceholder: 'Category name',
  containerName: 'Container name',
  containerNamePlaceholder: 'Container name',
  personCode: 'Person code',
  mobileNumbner: 'Mobile',
  conCreated: 'Container created. Signing in progress...',
  signFinish: 'Container signed successfully.',
  conError: 'Error occured. Please try again.',
  msgPIN2Question: 'Status: signing started. Enter PIN2. Verification code: ',
  msgContainerSignedDownload: 'Container signed. Container link: ',
  msgContainerCreatedDownload: 'Container created. Container link: ',
  download: 'download',
  msgErrorTryAgain: 'Error occured. Please try again.',
  msgRedirect: 'Redirecting to signing view',
  dialogTitleShareOrSign: 'Create container and share or sign',
  createContainerInformationModeSign: 'This action will create ASICE container from documents below and redirect you to signing view. Select document to which ASICE container will be added as new version.',
  createContainerInformationModeShare: 'This action will create ASICE container from documents below and redirect you to signing process initiation view. Select document to which ASICE container will be added as new version.',
  createContainerInformationModeShareOrSin: 'This action will create ASICE container from documents below and redirect you to signing view OR signing process initiation view depending on button pressed. Select document to which ASICE container will be added as new version.',
  createContainerAndRedirectSign: 'Creating container and redirecting to signing view...',
  /* BELOW ARE TECHNICAL FIELDS, DO NOT CHANGE WITHOUT CONSULTING */
  singleMode: 'single',
  multiMode: 'multi',
  modeSign: 'Sign',
  modeShare: 'Share',
  modeShareAndSign: 'Share And Sign',
  btnShareAndSignName: 'Sign or share as ASICE'  
});

csui.define('dmss/commands/open.classic/impl/nls/lv/lang',{
  toolbarButtonTitle: 'Izveidot / parakstīt konteineri',
  dialogTitle: 'Izveidot / parakstīt konteineri',
  submitLabel: 'Izveidot',
  submitSignLabel: 'Izveidot un parakstīt',
  submitShareLabel: 'Nosūtīt parakstīšanai',
  docListHeader: 'Dokumenti',
  addNewVersion: 'Pievienot versiju',
  createNew: 'Uztaisīt jauno dokumentu',
  categoriesLabel: 'Kategorijas',
  categoryPlaceholder: 'Kategorijas nosaukums',
  containerName: 'Konteinera nosaukums',
  containerNamePlaceholder: 'Konteinera nosaukums',
  personCode: 'Personas kods',
  mobileNumbner: 'Mob. numurs',
  conCreated: 'Konteineris ir izveidots. Notiek parakstīšana...',
  signFinish: 'Konteineris ir veiksmīgi parakstīts.',
  conError: 'Notika kļūda. Mēģiniet vēlreiz.',
  msgPIN2Question: 'Statuss: parakstīšanas procedūra ir uzsākta. Ievadiet PIN2. Pārbaudes kods: ',
  msgContainerSignedDownload: 'Konteineris tika parakstīts: ',
  msgContainerCreatedDownload: 'Konteineris izveidots: ',
  download: 'lejuplādēt',
  msgErrorTryAgain: 'Statuss: ir notikusi kļūda. Mēģiniet vēlreiz.',
  msgRedirect: 'Notiek redirekts parakstīšanas skatā',
  dialogTitleShareOrSign: 'Create container and share or sign',
  createContainerInformationModeSign: 'This action will create ASICE container from documents below and redirects you to signing view',
  createContainerInformationModeShare: 'This action will create ASICE container from documents below and redirects you to signing process initiation view',
  createContainerInformationModeShareOrSin: 'This action will create ASICE container from documents below and redirects you to signing view OR signing process initiation view depending on button pressed',
  createContainerAndRedirectSign: 'Creating container and redirecting to signing view...',
  /* BELOW ARE TECHNICAL FIELDS, DO NOT CHANGE WITHOUT CONSULTING */
  singleMode: 'single',
  multiMode: 'multi',
  modeSign: 'Sign',
  modeShare: 'Share',
  modeShareAndSign: 'Share And Sign',
  btnShareAndSignName: 'Sign or share as ASICE'  
});



csui.define('json!dmss/config/dmss.config.json',{
    "INTERNAL_PORTAL_URL": "https://signbox.mihails-test/sendFiles",
    "GATEWAY_ALTERNATE_VIEW_API": "http://localhost:92/api/auth/session/redirecturl",
    "COMPOSE_CONTAINER_API": "http://localhost:84/api/container/compose/existing",
    "OTCS_REDIRECT_URL": "http://localhost/otcs/cs.exe/app/nodes/",
    "ALLOWED_MIMETYPES": ["application/vnd.etsi.asic-e+zip", "application/pdf"],
    "ARCHIVE_PREFIX": "OTCS-"
}
);

csui.define('dmss/commands/open.classic/open.classic.command',['csui/utils/commands/open.classic.page', 'dmss/commands/open.classic/impl/sign.view', 'csui/controls/dialog/dialog.view', 'csui/lib/backbone', 'i18n!dmss/commands/open.classic/impl/nls/lang', 'csui/utils/commandhelper', 'csui/utils/contexts/factories/connector', 'csui/utils/nodesprites', 'json!dmss/config/dmss.config.json'
], function (OpenClassicPageCommand, CreateContainerViewModel ,DialogView, Backbone, Translations, CommandHelper, ConnectorFactory, nodeSpriteCollection, settings) {
  'use strict';

  const singleMode = Translations.singleMode;
  const multiMode = Translations.multiMode;
  const modeSign = Translations.modeSign;
  const modeShare = Translations.modeShare;
  const modeShareAndSign = Translations.modeShareAndSign;
  const btnShareAndSignName = Translations.btnShareAndSignName;

  var toggleLoading = function (ui) {
    if (ui.loader.hasClass('binf-hidden')) {
      ui.loader.removeClass('binf-hidden');
      ui.form.addClass('alpha');
    } else {
      ui.loader.addClass('binf-hidden');
      ui.form.removeClass('alpha');
    }
  };

  var getDialogTitle = function (mode) {
    let dialogTitle = "";

    switch (mode) {
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
  };

  var isSingleAsiceOrPDF = function (nodes) {
    if ((nodes.models.length == 1) && (settings.ALLOWED_MIMETYPES.includes(nodes.models[0].attributes.mime_type))) {
      return true;
    } else {
      return false;
    }
  };

  var internalPortalRedirect = function (docId, rootFolderID) {
    window.location = settings.INTERNAL_PORTAL_URL + "?id=" + settings.ARCHIVE_PREFIX + docId + '&redirectUrl=' + settings.OTCS_REDIRECT_URL + rootFolderID;
  };

  var buildInterface = function (containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerView, mode, rootFolderID) {
    let docListHTML = '<table class="container_doc_list binf-table dataTable"><thead><th class="csui-table-cell-name">' + Translations.docListHeader + '</th>' +
      '</thead>';
    let endpointCreateContainer = settings.COMPOSE_CONTAINER_API;

    if (isSinglePdfOrAsice) {
      docListHTML = docListHTML + drawBrowseViewHTML(nodes, connector, singleMode);
    } else {
      docListHTML = docListHTML + drawBrowseViewHTML(nodes, connector, multiMode) + '</table>';
    }

    let dialogTitle = getDialogTitle(mode);
    let createView = new CreateContainerView({ model: containerModel, docs: docListHTML, mode: mode });
    let dialog = new DialogView({
      title: dialogTitle,
      view: createView
    });

    //BELOW ARE EVENTS FOR BOTH CONT. CREATION INTERFACE
    createView.on('sign', function (e) {
      toggleLoading(createView.ui);

      let endpointAlternateView = settings.GATEWAY_ALTERNATE_VIEW_API;
      let ticket = connector.connection.session.ticket;
      let needConCreation = !isSinglePdfOrAsice;

      if ((needConCreation) || (mode == modeShareAndSign)) {
        createView.ui.status.text(Translations.createContainerAndRedirectSign);

        let nodeList = getCheckedNodes(createView.ui.conselection);
        let containerID = '';
        let newContainerName = '';

        if (nodes.models.length == 1) {
          newContainerName = changeExtensionToAsice(nodes.models[0].attributes.name);
        } else {
          newContainerName = changeExtensionToAsice(getContainerPlaceholderName(createView.ui.verselection));
        }
        //if single object but forced container creation
        if (nodes.models.length == 1) {
          containerID = nodes.models[0].attributes.id;
        } else {
          containerID = getContainerPlaceholderId(createView.ui.verselection);
        }
        createContainer(endpointCreateContainer, ticket, nodeList, containerID, newContainerName, function (data) {
          if (!data.error) {
            getAlternateViewURL(endpointAlternateView, ticket, containerID, rootFolderID, function (result) {
              if (!result.error) {
                window.location = result.location;
              } else {
                createView.ui.status.text(result.error);
                refreshView(createView.ui);
                toggleLoading(createView.ui);
              }
            });
          } else {
            createView.ui.status.text(data.error);
            toggleLoading(createView.ui);
          }
        });
      } else {
        let id = nodes.models[0].attributes.id;

        //IF ERROR ON INSTA REDIRECT SHOW IT IN ALERT AS SOON AS THERE IS NO OTHER INTERFACE
        getAlternateViewURL(endpointAlternateView, ticket, id, rootFolderID, function (result) {
          if (!result.error) {
            window.location = result.location;
          } else {
            createView.ui.status.text(result.error);
            refreshView(createView.ui);
            alert(result.error);
          }
        });
      }

    });

    //share to start external signing process
    createView.on('share', function (e) {
      toggleLoading(createView.ui);

      let needConCreation = !isSinglePdfOrAsice;
      let ticket = connector.connection.session.ticket;

      if ((needConCreation) || (mode == modeShareAndSign)) {
        createView.ui.status.text(Translations.createContainerAndRedirectSign);
        createView.ui.status.show();

        let nodeList = getCheckedNodes(createView.ui.conselection);
        let containerID = '';
        let newContainerName = '';

        //if single object but forced container creation
        if (nodes.models.length == 1) {
          containerID = nodes.models[0].attributes.id;
        } else {
          containerID = getContainerPlaceholderId(createView.ui.verselection);
        }
        if (nodes.models.length == 1) {
          newContainerName = changeExtensionToAsice(nodes.models[0].attributes.name);
        } else {
          newContainerName = changeExtensionToAsice(getContainerPlaceholderName(createView.ui.verselection));
        }
        createContainer(endpointCreateContainer, ticket, nodeList, containerID, newContainerName, function (data) {
          if (!data.error) {
            internalPortalRedirect(containerID, rootFolderID);
          } else {
            createView.ui.status.text(data.error);
            refreshView(createView.ui);
            toggleLoading(createView.ui);
          }
        });
      } else {
        let id = nodes.models[0].attributes.id;
        internalPortalRedirect(id, rootFolderID);
      }
    });

    return dialog;
  };

  //remove loading icon and button disabled effect
  var refreshView = function (ui) {
    ui.loader.addClass('binf-hidden');
    ui.sign.removeClass('binf-disabled').removeAttr('disabled');
    ui.share.removeClass('binf-disabled').removeAttr('disabled');
  };

  var changeExtensionToAsice = function (name) {
    return name.replace(/\.[^/.]+$/, "") + ".asice";
  };

  var getCheckedNodes = function (checkbtns) {
    let nodes = [];

    for (let i = 0; i < checkbtns.length; i++) {
      if (checkbtns[i].checked) {
        let currentNode = {};
        try {
          currentNode.documentId = checkbtns[i].id.split('chk_')[1];
          currentNode.fileName = checkbtns[i].dataset.name;
          nodes.push(currentNode);
        } catch (e) {
          console.info(e);
        }
      }
    }

    return nodes;
  };

  var getContainerPlaceholderName = function (radiobtns) {
    let containerName = "";

    for (let i = 0; i < radiobtns.length; i++) {
      if (radiobtns[i].checked) {
        try {
          containerName = radiobtns[i].dataset.name;
        } catch (e) {
          console.info(e);
        }
        break;
      }
    }

    return containerName;
  };

  var getContainerPlaceholderId = function (radiobtns) {
    let containerID = 0;

    for (let i = 0; i < radiobtns.length; i++) {
      if (radiobtns[i].checked) {
        try {
          containerID = radiobtns[i].id.split('radio_')[1];
        } catch (e) {
          console.info(e);
        }
        break;
      }
    }

    return containerID;
  };

  var getAlternateViewURL = function (endpoint, ticket, id, rootFolderID, callback) {
    Backbone.ajax({
      type: "POST",
      cache: false,
      url: endpoint,
      data: {
        redirecturl: settings.OTCS_REDIRECT_URL + rootFolderID,
        documentid: settings.ARCHIVE_PREFIX + id
      },
      headers: { 'OTCSTICKET': ticket },
      success: function (data) {
        try {
          callback(
            {
              location: data.location
            }
          );
        } catch (e) {
          callback(
            {
              error: Translations.msgErrorTryAgain
            }
          );
        }
      },
      error: function (error) {
        console.info(error);
        callback(
          {
            error: Translations.msgErrorTryAgain
          }
        );
      }
    });
  };

  //return created container ID
  var createContainer = function (endpointCreateContainer, ticket, docs, addver, name, callback) {
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
      headers: { 'OTCSTICKET': ticket },
      success: function (data) {
        callback(data);
      },
      error: function (error) {
        callback(
          {
            error: Translations.msgErrorTryAgain
          }
        );
      }
    });

    return containerid;
  };

  // draw browse view html. Mode single doc / multi docs.
  var drawBrowseViewHTML = function (nodes, connector, mode) {
    let docListHTML = '';
    let radioCheckFirst = '';

    for (let i = 0; i < nodes.models.length; i++) {
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

      if (i == 0) {
        radioCheckFirst = 'checked';
      }
      else {
        radioCheckFirst = '';
      }

      //let radio_cell = (mode == multiMode) ? '<td><input ' + radioCheckFirst + ' data-name="' + nodes.models[i].attributes.name + '" class="otdoc_version" type="radio" id="radio_' + nodes.models[i].attributes.id + '" name="addversion" /></td>' : '<td></td>';
      let radio_cell = (nodes.models.length > 1) ? '<td><input ' + radioCheckFirst + ' data-name="' + nodes.models[i].attributes.name + '" class="otdoc_version" type="radio" id="radio_' + nodes.models[i].attributes.id + '" name="addversion" /></td>' : '<td></td>';
      let checkbox_cell = '<td><input class="otdoc_container" type="checkbox" data-name="' + nodes.models[i].attributes.name + '" id="chk_' + nodes.models[i].attributes.id + '" data-id="' + nodes.models[i].attributes.id + '" checked /></td>';

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
  };

  var OpenClassicCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'dmssSign',
      scope: 'multi'
    },

    enabled: function (nodes) {
      if ((nodes.toolItem.attributes.name != btnShareAndSignName) && (nodes.nodes.length == 1) && (!settings.ALLOWED_MIMETYPES.includes(nodes.nodes.models[0].attributes.mime_type))) {
        return false;
      }
      else
        if ((nodes.toolItem.attributes.name != btnShareAndSignName) && (nodes.nodes.length > 1)) {
          return false;
        }
        else {
          return true;
        }
    },

    getUrlQueryParameters: function (node, options) {
    },

    execute: function (nodeList, options) {

      let buttonTypePressed = options.addableTypeName,
        connector = options.context.getObject(ConnectorFactory),
        ticket = connector.connection.session.ticket,
        endpointAlternateView = settings.GATEWAY_ALTERNATE_VIEW_API;

      //require(['dmss/commands/open.classic/impl/sign.view'
      //], function (CreateContainerView) {
        let nodes = CommandHelper.getAtLeastOneNode(nodeList),
          containerModel = new Backbone.Model(),
          rootFolderID = nodes.models[0].attributes.parent_id,
          isSinglePdfOrAsice = isSingleAsiceOrPDF(nodes);

        switch (buttonTypePressed) {
          case "Sign":
            if (isSinglePdfOrAsice) {
              getAlternateViewURL(endpointAlternateView, ticket, nodes.models[0].attributes.id, rootFolderID, function (result) {
                if (!result.error) {
                  window.location = result.location;
                } else {
                  console.log(result.error);
                }
              });
            } else {
              //container interface
              let dialog = buildInterface(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerViewModel, modeSign, rootFolderID);
              dialog.show();
            }
            break;
          case "Share":
            if (isSinglePdfOrAsice) {
              internalPortalRedirect(nodes.models[0].attributes.id, rootFolderID);
            } else {
              //container interface
              let dialog = buildInterface(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerViewModel, modeShare, rootFolderID);
              dialog.show();
            }
            break;
          case "Sign or share as ASICE":
            //container interface
            let dialog = buildInterface(containerModel, nodes, connector, isSinglePdfOrAsice, CreateContainerViewModel, modeShareAndSign, rootFolderID);
            dialog.show();
            break;
        }
      //});
    }
  });

  return OpenClassicCommand;

});

csui.define('dmss/commands/open.classic/open.classic.nodestable.toolitems',[],function () {
  'use strict';

  return {
    otherToolbar: [
      {
        signature: 'dmssSign',
        name: 'Sign'
      },
      {
        signature: 'dmssSign',
        name: 'Share',
      },
      {
        signature: 'dmssSign',
        name: 'Sign or share as ASICE'
      }
    ]
  };

});

// Placeholder for the build target file; the name must be the same,
// include public modules from this component

csui.define('bundles/dmss-all',[
    'dmss/commands/open.classic/open.classic.command',
    'dmss/commands/open.classic/open.classic.nodestable.toolitems'
], {});

csui.require([
  'require',
  'css'
], function (require, css) {
  // Load the bundle-specific stylesheet
  //css.styleLoad(require, 'dmss/bundles/dmss-all');
});

//# sourceMappingURL=dmss-all.js.map