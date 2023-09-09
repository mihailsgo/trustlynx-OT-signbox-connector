csui.define([
    'csui/lib/underscore',
    "csui/lib/jquery",
    'csui/lib/backbone',
    'csui/lib/marionette',
    'csui/utils/url',
    'csui/dialogs/modal.alert/modal.alert',
    'csui/utils/nodesprites',
    'hbs!conws/widgets/outlook/impl/wksp/impl/wksp',
    'conws/widgets/outlook/impl/folder/folders.view',
    'conws/widgets/outlook/impl/utils/utility',
    'conws/widgets/outlook/impl/utils/csservice',
    'conws/widgets/outlook/impl/dialog/saveSection.view',
    'conws/widgets/outlook/impl/wksp/impl/wksp.model',
    'conws/widgets/outlook/impl/utils/emailservice',
    'i18n!conws/widgets/outlook/impl/nls/lang'
], function (_, $, Backbone, Marionette, Url, ModalAlert, NodeSprites, template, FoldersView, WkspUtil, CSService, SaveView, WkspModel, EmailService, lang) {

    var WkspView = Marionette.LayoutView.extend({

        className: 'ListItem', 

        template: template,

        templateHelpers: function() {
            return {
                id: this.id,
                name: this.name,
                iconClass: this.getIconClass(),
                typeName: this.typeName,
                toggleStatus: this.hasChild && this.expendable ? WkspUtil.ToggleStatusExpand : WkspUtil.ToggleStatusEmpty,
                openLinkTitle: lang.wksp_open_link,
                linkToWS: this.accessUrl,
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
            $toggleIcon: '#toggleIcon',
            $saveMenuItem: '#wkspSaveMenuItem',
            $saveButton: '#saveEmailButton'
        },

        events: {
            'click .listItemWksp': 'clickWksp',
            'mouseenter #wkspItem': 'showActionBar',
            'mouseleave #wkspItem': 'hideActionBar',
            'click #saveEmailButton': 'saveEmail',
            'focusin #saveEmailButton, #wkspOpenButton': 'buttonFocused',
            'focusout #saveEmailButton, #wkspOpenButton, #wkspNameDiv': 'buttonFocusOut',
            'keyup #toggleIcon, #wkspNameDiv, #saveEmailButton': 'processKeyUp',
            'keydown #wkspNameDiv, #wkspOpenButton': 'processKeyDown'
        },

        initialize: function (options) {
            this.listenTo(this.model, 'change', this.renderToggleIcon);
        },

        constructor: function WkspView(options) {
            this.model = options.model;
            var props = options.model.get('data').properties;
            this.name = props.name;
            this.id = props.id;
            this.typeName = props.type_name;
            this.type = props.type;

            this.isEdit = (typeof props.isEdit !== 'undefined')? props.isEdit : false;
            
            // only workspaces are expendable
            this.hasChild = props.container && props.size > 0 && props.type === 848;
            this.connector = WkspUtil.getConnector(); 
            this.accessUrl = Url.combine((new Url(this.connector.connection.url)).getCgiScript(), 'app/nodes', this.id);

            var enableEmailSaving = this.model.get('enableEmailSaving');
            //if email saving is disabled do not expand workspaces
            this.expendable = (enableEmailSaving !== undefined ? enableEmailSaving : true) && WkspUtil.emailSavingConfig.allowExpandWorkspace;            
            
            this.folderRetrieved = false;
            this.folderExpended = false;

            var self = this;

            //update pre config folder only when email saving is enabled
            if (!this.isEdit && (enableEmailSaving === undefined || enableEmailSaving)){
                this.updateModelForPreConfigFolder(self);
            } else if (this.isEdit){
                setTimeout(function(){
                    var saveMenuItem = self.ui.$saveMenuItem,
                        saveButton = self.ui.$saveButton;
                    saveMenuItem.css("display", "inline-block");
                    saveButton.attr("title", lang.insert_action);
                });
            }

            Marionette.LayoutView.prototype.constructor.call(this, options);
        },

        processKeyUp: function(e){
            if ($(e.target).data("id") !== this.id){
                return;
            }

            if (e.which === 13 || e.which === 32) {
                if (e.target.id === "toggleIcon"){
                    this.clickWksp(e);
                } 
                else if (e.target.id === "saveEmailButton"){
                    this.saveEmail(e);
                }
            } else if (e.which === 9 && e.target.id === "wkspNameDiv"){
                this.showActionBar(e);
            }
        },

        processKeyDown: function(e){
            if (e.which !== 9){
                return;
            }
            if ((!e.shiftKey && e.target.id === "wkspOpenButton") ||
                (e.shiftKey && e.target.id === "wkspNameDiv") ){
                    this.hideActionBar(e);
                }
        },

        buttonFocused: function(e){
            if (e.target.id !== "saveEmailButton" && e.target.id !== "wkspOpenButton"){
                return;
            }
            var div = e.target.querySelector("div");
            if (div !== null){
                $(div).css("outline", "1px dotted grey");
                $(div).css("outline-offset", "2px");
            }
        },

        buttonFocusOut: function(e){
            var self = this;
            if (e.target.id === "saveEmailButton" || e.target.id === "wkspOpenButton" || e.target.id === "wkspNameDiv"){
                setTimeout(function(e){
                    var focusId = document.activeElement.id;
                    if (focusId !== "saveEmailButton" && focusId !== "wkspOpenButton" && focusId !== "wkspNameDiv"){
                        self.hideActionBar(e);
                    }
                }, 50);

                if (e.target.id !== "wkspNameDiv") {
                    var div = e.target.querySelector("div");
                    if (div !== null){
                        $(div).css("outline", "");
                        $(div).css("outline-offset", "");
                    }
                }
            }
        },

        clickWksp: function(event) {
            if (event.target.id === "saveEmailButton" || event.target.id === "wkspOpenButton"){
                return;
            }

            var self = this;

            //do not expand it if it is disabled because enableEmailSaving flag is false
            if (!self.expendable){
                return;
            }

            if (!self.expendable || !self.hasChild) {
                return;
            }

            var toToggle = $(event.target).data("id");
            if (toToggle && toToggle === "noToggle") {
                return;
            }

            if (!self.folderRetrieved) {
                var foldersView = new FoldersView({
                    connector: this.connector,
                    id: self.id,
                    parentNode: self,
                    pageSize: WkspUtil.pageSize,
                    pageNo: 1,
                    isEdit: this.isEdit
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

        saveEmail: function(event) {
            var self = this;
            var targetId = $(event.currentTarget).data("id");
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

            var folderId = self.saveFolderId,
                folderName = self.saveFolderName,
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

        keyEnterWksp: function(event) {
            if (event.keyCode === 13 || event.keyCode === 27) {
                this.$(".listItemWkspName").trigger('click');
            }
        },

        showActionBar: function () {
            var bar = this.ui.$actionBar;
            bar.css("display", "block");
            setTimeout(function () {
                bar.addClass("binf-in");
            }, 300);
        },

        hideActionBar: function () {
            var bar = this.ui.$actionBar;
            bar.css("display", "none");
            bar.removeClass("binf-in");
        },

        renderToggleIcon: function () {
            this.hasChild = this.model.get('hasChild');
            var toggleIcon = this.ui.$toggleIcon;
            if (!this.hasChild || !this.expendable) {
                this.toggleStatus = WkspUtil.ToggleStatusEmpty;
            }

            toggleIcon.attr('class', this.toggleStatus);
            var tabIndex = this.toggleStatus === WkspUtil.ToggleStatusEmpty ? "-1" : "0";
            toggleIcon.attr('tabindex', tabIndex);
            if (tabIndex === "-1"){
                $("#conwsoutlook-body").focus();
            }
        },

        updateModelForPreConfigFolder: function (self) {
            if (!WkspUtil.emailSavingConfig.preConfigFolderToSave.enabled) {
                return;
            }

            var wkspModel = new WkspModel({ id: self.id }, {connector: self.connector});

            var fetchPromise = wkspModel.getPreConfigFolder();
            fetchPromise.done(function (result) {
                var saveMenuItem = self.ui.$saveMenuItem,
                    saveButton = self.ui.$saveButton;
                    
                if (result.hasPreConfigFolder) {
                    //self.model.set("preConfigFolder", { folderId: result.folderId, folderName: result.folderName });
                    self.saveFolderId = result.folderId;
                    self.saveFolderName = result.folderName;
                    saveMenuItem.css("display", "inline-block");
                    saveButton.attr("title", lang.title_save_email_to + result.folderName);
                } else {
                    saveMenuItem.css("display", "none");
                }
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
                iconClass = "icon csui-icon mime_folder";
            }
            return iconClass;
        }
    });

    return WkspView;

});