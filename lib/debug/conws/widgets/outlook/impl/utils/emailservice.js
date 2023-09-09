csui.define(['module',
    'csui/lib/jquery',
    'conws/widgets/outlook/impl/utils/utility',
    'i18n!conws/widgets/outlook/impl/nls/lang'
], function EmailSerivce(module, $, WkspUtil, lang) {

        return {

            constants : {
                cs_config_missing: lang.config_CS_missing,
                retrieve_email_error: lang.error_retrieve_email
            },

            getCurrentMailboxItem: getCurrentMailboxItem,
            emailItemChanged: emailItemChanged,
            insertLink: insertLink
        };

        function getCurrentMailboxItem(isEdit) {
            var deferred = $.Deferred();

            var editMode = (typeof isEdit === 'undefined')? false : isEdit;

            try {
                var currentEmail = null,
                    currentUser = window.Office.context.mailbox.userProfile.emailAddress;

                if (editMode){
                    currentEmail = window.Office.context.mailbox.item;
                } else{
                    currentEmail = window.Office.cast.item.toItemRead(window.Office.context.mailbox.item);
                    currentEmail.archivableAttachments = [];
                    for (var i = 0; i < currentEmail.attachments.length; i++) {
                        var attachment = currentEmail.attachments[i];
                        if (attachment.attachmentType === window.Office.MailboxEnums.AttachmentType.File){
                            currentEmail.archivableAttachments.push(attachment);
                        }
                    }
                }

                deferred.resolve({
                    currentEmail: currentEmail,
                    currentUser: currentUser
                });
            } catch (error) {
                deferred.reject(error);
            }

            return deferred.promise();
        }

        function emailItemChanged(eventArgs){
            if (WkspUtil.SavingSubmitted){
                WkspUtil.EmailChangedAfterSaving = true;
                return;
            } else {
                WkspUtil.EmailChangedAfterSaving = false;
            }

            var item = window.Office.context.mailbox.item,
                previousItem = window.CurrentEmailItem,
                yPosition = window.pageYOffset;

            if (previousItem.itemId === item.itemId){
                return;
            }
            
            var currentEmail = window.Office.cast.item.toItemRead(item);
            currentEmail.archivableAttachments = [];
            for (var i = 0; i < currentEmail.attachments.length; i++) {
                var attachment = currentEmail.attachments[i];
                if (attachment.attachmentType === window.Office.MailboxEnums.AttachmentType.File){
                    currentEmail.archivableAttachments.push(attachment);
                }
            }
            window.CurrentEmailItem = currentEmail;

            if (previousItem === null){
                return;
            }

            WkspUtil.writeTrace("Email has been switched. New email subject: " + item.subject);

            window.CurrentEmailItem = window.Office.cast.item.toItemRead(item);
            WkspUtil.uiShow(WkspUtil.PreSaveSection);
            if (WkspUtil.PreSaveSection === "standardSections"){
                WkspUtil.uiShow("customSearchButton");
            }
            
            WkspUtil.uiHide("savePanel");
            if (WkspUtil.ScorllPositionBeforeSaving !== -1){
                window.scrollTo(0, WkspUtil.ScorllPositionBeforeSaving);
                WkspUtil.ScorllPositionBeforeSaving = -1;
            } else {
                window.scrollTo(0, yPosition);
            }

            if (WkspUtil.SuggestedWkspsView !== null){
                WkspUtil.SuggestedWkspsView.refresh();
            }
        }

        function insertLink(name, url){
            var deferred = $.Deferred();

            if (typeof window.Office.context === 'undefined' ||
                typeof window.Office.context.mailbox === 'undefined' ||
                typeof window.Office.context.mailbox.item === 'undefined' ||
                window.Office.context.mailbox.item === null){
                deferred.reject({message: lang.warning_no_outlook_context});
                return deferred.promise();
            }

            var emailItem = window.Office.context.mailbox.item;
            
            emailItem.body.getTypeAsync(
                function (result) {
                    if (result.status === window.Office.AsyncResultStatus.Failed){
                        deferred.reject({message: result.error.message});
                    }
                    else {
                        // Successfully got the type of item body.
                        // Set data of the appropriate type in body.
                        if (result.value === window.Office.MailboxEnums.BodyType.Html) {
                            // Body is of HTML type.
                            emailItem.body.setSelectedDataAsync(
                                name + ':<br><a href="' + url + '">' + url + '</a> ',
                                { coercionType: window.Office.CoercionType.Html},
                                function (asyncResult) {
                                    if (asyncResult.status === window.Office.AsyncResultStatus.Failed){
                                        deferred.reject({message: asyncResult.error.message});
                                    }
                                    else {
                                        deferred.resolve({});
                                    }
                                });
                        }
                        else {
                            // Body is of text type. 
                            emailItem.body.setSelectedDataAsync(
                                name + ':\n' + url + ' ',
                                { coercionType: window.Office.CoercionType.Text},
                                function (asyncResult) {
                                    if (asyncResult.status === window.Office.AsyncResultStatus.Failed){
                                        deferred.reject({message: asyncResult.error.message});
                                    }
                                    else {
                                        deferred.resolved({});
                                    }
                                 });
                        }
                    }
                });
        
            return deferred.promise();
        }

    }
);
