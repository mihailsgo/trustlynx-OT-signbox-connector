csui.define([
    'csui/lib/underscore',
    "csui/lib/jquery",
    'csui/lib/backbone',
    'csui/lib/marionette',
    'csui/utils/url',
    'csui/dialogs/modal.alert/modal.alert',
    'csui/utils/nodesprites',

    'conws/widgets/outlook/impl/utils/emailservice',
    'hbs!conws/widgets/outlook/impl/folder/impl/item',
    'conws/widgets/outlook/impl/utils/utility',
    'conws/widgets/outlook/impl/dialog/saveSection.view',
    'i18n!conws/widgets/outlook/impl/nls/lang', 
    'css!conws/widgets/outlook/impl/conwsoutlook' 

], function (_, $, Backbone, Marionette, Url, ModalAlert, NodeSprites, EmailService, template, WkspUtil, SaveView, lang) {
    var FolderView = Marionette.LayoutView.extend({
        className: 'FolderItem',

        template: template,

        templateHelpers: function () {
            return {
                serverOrigin: window.ServerOrigin,
                supportFolder: window.ContentServerSupportPath,
                iconClass: this.iconClass,         
                id: this.id,
                name: this.name,
                typeName: this.typeName,
                toggleStatus: this.hasChild ? WkspUtil.ToggleStatusExpand : WkspUtil.ToggleStatusEmpty,
                tabIndex: this.hasChild ? "0" : "-1",
                saveTitle: this.isEdit? lang.insert_action : lang.title_save_email,
                actionIcon: this.isEdit ? "copyLink" : "emailSaveIcon"
            }
        },

        regions: {
            subFolders: '#subFolders'
        },

        ui: {
            $actionBar: '.wkspFolder-actiondiv',
            $toggleIcon: '#toggleIcon'
        },

        events: {
            'click .listItemFolder': 'clickFolder',
            'mouseenter #wkspFolderItem': 'showActionBar',
            'mouseleave #wkspFolderItem': 'hideActionBar',
            'click #saveEmailButton': 'saveEmail',
            'focusin #saveEmailButton': 'buttonFocused',
            'focusout #saveEmailButton, #folderNameDiv': 'buttonFocusOut',
            'keyup #toggleIcon, #folderNameDiv, #saveEmailButton': 'processKeyUp',
            'keydown #folderNameDiv, #saveEmailButton': 'processKeyDown'
        },

        initialize: function (options) {
            this.listenTo(this.model, 'change', this.renderToggleIcon);
        },

        constructor: function FolderView(options) {
            this.model = options.model;
            this.name = options.model.get('data').properties.name;
            this.id = options.model.get('data').properties.id;
            this.type = options.model.get('data').properties.type;
            this.typeName = options.model.get('data').properties.type_name;
            this.hasChild = options.model.get('data').properties.container_size > 0;
            this.isEdit = options.model.get('data').properties.isEdit;
            this.connector = WkspUtil.getConnector();
            this.accessUrl = Url.combine((new Url(this.connector.connection.url)).getCgiScript(), 'app/nodes', this.id);


            this.folderRetrieved = false;
            this.folderExpended = false;

            this.iconClass = 'wkspContentIcon ' + this.getIconClass();

            Marionette.LayoutView.prototype.constructor.call(this, options);
        },

        clickFolder: function (e) {
            if (event.target.id === "saveEmailButton" || event.target.id === "moreLink"){
                return;
            }

            var self = this;

            if (!self.hasChild) {
                return;
            }

            var targetId = $(e.target).data("id");

            if (targetId !== self.id || targetId === "noToggle") {
                return;
            }

            var FoldersView = (window.csui) ? window.csui.require('conws/widgets/outlook/impl/folder/folders.view') :
                window.require('conws/widgets/outlook/impl/folder/folders.view');

            if (!self.folderRetrieved) {
                var foldersView = new FoldersView({
                    connector: self.connector,
                    id: self.id,
                    parentNode: self,
                    pageSize: WkspUtil.pageSize,
                    pageNo: 1,
                    isEdit: self.isEdit
                });
                self.getRegion('subFolders').show(foldersView);
                //toggle icon and the flags are set in the FoldersView
            } else if (self.folderExpended) {
                self.getRegion('subFolders').$el.hide();
                self.folderExpended = false;
                self.toggleStatus = WkspUtil.ToggleStatusExpand;
            } else {
                self.getRegion('subFolders').$el.show();
                self.folderExpended = true;
                self.toggleStatus = WkspUtil.ToggleStatusCollapse;
            }

            var toggleIcon = this.ui.$toggleIcon;
            toggleIcon.attr('class', self.toggleStatus);
        },

        renderToggleIcon: function () {
            this.hasChild = this.model.get('hasChild');
            var toggleIcon = this.ui.$toggleIcon;
            if (!this.hasChild) {
                this.toggleStatus = WkspUtil.ToggleStatusEmpty;
            }
            toggleIcon.attr('class', this.toggleStatus);
            var tabIndex = this.toggleStatus === WkspUtil.ToggleStatusEmpty ? "-1" : "0";
            toggleIcon.attr('tabindex', tabIndex);
            if (tabIndex === "-1"){
                $("#conwsoutlook-body").focus();
            }
        },

        showActionBar: function (e) {
            var self = this;
            var targetId = $(e.currentTarget).data("id");
            if (targetId !== self.id) {
                return;
            }

            if (self.type !== 751 && WkspUtil.emailSavingConfig.onlySaveToEmailFolder) {
                return;
            }

            var bar = this.ui.$actionBar;
            bar.css("display", "block");
            setTimeout(function () {
                bar.addClass("binf-in");
            }, 300);
        },

        hideActionBar: function (e) {
            var self = this;
            if (self.type === 0 && WkspUtil.emailSavingConfig.onlySaveToEmailFolder) {
                return;
            }

            var bar = this.ui.$actionBar;
            bar.css("display", "none");
            bar.removeClass("binf-in");
        },

        processKeyUp: function(e){
            if ($(e.target).data("id") !== this.id){
                return;
            }

            if (e.which === 13 || e.which === 32) {
                if (e.target.id === "toggleIcon"){
                    this.clickFolder(e);
                } else if (e.target.id === "saveEmailButton"){
                    this.saveEmail(e);
                    this.hideActionBar(e);
                }
            }

            if (e.which === 9 && e.target.id === "folderNameDiv"){
                this.showActionBar(e);
            }
        },

        processKeyDown: function(e){
            if ($(e.target).data("id") !== this.id){
                return;
            }

            if (e.which !== 9){
                return;
            }
            if ((e.shiftKey && e.target.id === "folderNameDiv") ||
                (!e.shiftKey && e.target.id === "saveEmailButton")){
                    this.hideActionBar(e);
                }
        },

        buttonFocused: function(e){
            if (e.target.id !== "saveEmailButton"){
                return;
            }
            var div = e.target.querySelector("div");
            if (div !== null){
                $(div).css("outline", "1px dotted grey");
                $(div).css("outline-offset", "2px");
            }
        },

        buttonFocusOut: function(e){
            if (e.target.id !== "saveEmailButton" && e.target.id !== "folderNameDiv"){
                return;
            }

            var self = this;
            setTimeout(function(e){
                var focusId = document.activeElement.id;
                if (focusId !== "saveEmailButton" && focusId !== "folderNameDiv"){
                    self.hideActionBar(e);
                }
            }, 50);

            var div = e.target.querySelector("div");
            if (div !== null){
                $(div).css("outline", "");
                $(div).css("outline-offset", "");
            }
        },

        saveEmail: function(e) {
            var self = this;
            var targetId = $(e.currentTarget).data("id");
            if (targetId !== self.id) {
                return;
            }

            if (self.isEdit){
                return self.insertLink(event);
            }

            if (window.CurrentEmailItem == null) {
                ModalAlert.showWarning(lang.warning_no_outlook_context);
                return;
            }

            var folderId = self.id,
                folderName = self.name,
                connector = self.connector,
                emailItem = window.CurrentEmailItem;
            
            WkspUtil.ScorllPositionBeforeSaving = window.pageYOffset;

            var saveRegion = new Marionette.Region({
                el: '#savePanel'
            });
            var saveEmailView = new SaveView({
                connector: connector, 
                folderId: folderId,
                folderName: folderName,
                proposedEmailName: emailItem.subject,
                attachments: emailItem.archivableAttachments
            });
            saveRegion.show(saveEmailView);
            $("#conwsoutlook-body").focus();
        },

        insertLink: function(event){
            var self = this;

            var insertPromise = EmailService.insertLink(self.name, self.accessUrl);
            insertPromise.fail(function (error) {
                ModalAlert.showWarning(error.message);
                return;
            });
            insertPromise.done(function(){
                return;
            });
        },

        getIconClass: function() {
            var self = this,
                atts = self.model.attributes,
                node = {type: self.type};
            if (atts != null && atts.data != null && atts.data.properties != null) {
                node = atts.data.properties;
            }

            var iconClass = "";
            try {
                iconClass = "icon " + NodeSprites.findClassByNode(node);
            } catch(err){
                if (node.type === 751){
                    iconClass = "wkspEmailFolderIcon";
                } else if (node.container || node.type === 0){
                    iconClass = "icon csui-icon mime_folder";
                } else{
                    iconClass = "icon csui-icon mime_document";
                } 
            }
            return iconClass;
        }

    });

    return FolderView;

});