csui.define('csui/utils/command.error',["module",
  "csui/lib/jquery",
  "csui/lib/underscore",
  'csui/lib/backbone',
  "csui/utils/log",
  "csui/utils/base"
], function (module, $, _, Backbone, log, base) {

  // constructor!!
  function CommandError(arg1, arg2) {

    if (!arg1) {
      throw new Error("No argument passed");
    }

    function applyArg2() {
      // the second argument can be a object with errorDetails and/or node members or just
      // a single errorDetails string or a NodeModel
      if (arg2 && _.isString(arg2)) {
        this.errorDetails = arg2;
      } else {
        if (arg2 instanceof Backbone.Model) {
          this.node = arg2;
        } else {
          if (arg2 && _.isObject(arg2)) {
            if (arg2.errorDetails && _.isString(arg2.errorDetails)) {
              this.errorDetails = arg2.errorDetails;
            }
            if (arg2.node instanceof Backbone.Model) {
              this.node = arg2.node;
            }
            if (arg2.requestError && _.isObject(arg2.requestError)) {
              var requestMessage = new base.RequestErrorMessage(arg2.requestError);
              if (this.message) {
                if (!this.errorDetails) {
                  this.errorDetails = requestMessage.message;
                }
              } else {
                this.message = requestMessage.message;
                if (!this.errorDetails) {
                  this.errorDetails = requestMessage.errorDetails;
                }
              }
            }
          }
        }
      }
    }

    if (arg1 instanceof Error) {
      this.message = arg1.message;
      if (arg1.stack) {
        this.stack = arg1.stack;
      }
    } else {
      if (_.isString(arg1)) {
        this.message = arg1;
      } else {
        var requestMessage = new base.RequestErrorMessage(arg1);
        this.message = requestMessage.message;
        this.errorDetails = requestMessage.errorDetails;
        this.statusCode = requestMessage.statusCode;
      }
    }
    applyArg2.call(this);
    this.name = "CommandError";
  }

  CommandError.prototype = Object.create(Error.prototype);

  return CommandError;

});


csui.define('csui/utils/commands/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/commands/nls/root/localized.strings',{

  // Add
  ShortcutPickerTitle: "Select target for Shortcut",

  // AddItemMetadata
  CommandNameAddItemMetadata: "Add Item with metadata",

  CommandNameAddVersion: "AddVersion",
  AddVersionNotAllowed : 'Unable to add version. Please try again when the current operation is finished',

  // Copy
  CommandTitleCopy: "Copy items",
  CommandNameCopy: "Copy",
  CommandVerbCopy: "copy",
  DialogTitleSingleCopy: "Copy {0} item",
  DialogTitleCopy: "Copy {0} items",
  SomeFilesNotCopiedSuccessfully: 'Some items were not successfully copied.',
  CopyingNodes: 'Copying {0} nodes',
  CopyingNode: 'Copying 1 node',
  CopyPageLeavingWarning: "If you leave the page now, pending items will not be copied.",
  CopyingOneItem: 'Copying "{0}"',
  CopyItems: 'Copying {0} items',
  CopySomeItems: 'Copying {0} items',
  CopyItemsNoneMessage: "No items copied.",
  CopyOneItemSuccessMessage: '"{0}" copied',
  CopySomeItemsSuccessMessage: '{0} items successfully copied.',
  CopyManyItemsSuccessMessage: '{0} items successfully copied.',
  CopyOneItemFailMessage: '"{0}" failed to copy',
  CopyManyItemsOneFailMessage: "1 item failed to copy.",
  CopySomeItemsFailMessage: '{0} items failed to copy.',
  CopyManyItemsFailMessage: '{0} items failed to copy.',
  CopySomeItemsFailMessage2: '{2} items failed to copy.',    // {2} !!
  CopyManyItemsFailMessage2: '{2} items failed to copy.',    // {2} !!
  CopyingLocationLabel :  'Copying to "{0}"',
  CopiedLocationLabel : 'Copied to "{0}"',
  CopyNotAllowed : 'Unable to copy. Please try again when the current operation is finished',

  // Delete
  DeleteCommandConfirmDialogTitle: "Delete",
  DeleteButtonLabel: "Delete",
  DeleteCommandConfirmDialogHtml: "<span class='msgIcon WarningIcon'>" +
                                  "<%- message %>" +
                                  "</span>",
  DeleteCommandConfirmDialogSingleMessage: 'Do you want to delete "{0}"?',
  DeleteCommandConfirmDialogMultipleMessage: "Do you want to delete {0} items?",
  CommandTitleDelete: "Delete items",
  CommandNameDelete: "Delete",
  CommandVerbDelete: "delete",
  DeletePageLeavingWarning: "If you leave the page now, pending items will not be deleted.",
  DeleteItemFailed: 'Deleting item "{0}" failed.',
  DeleteItems: 'Deleting {0} items',
  DeletingOneItem: 'Deleting "{0}"',
  DeletingSomeItems: 'Deleting {0} items',
  DeleteItemsNoneMessage: "No items deleted.",
  DeleteOneItemSuccessMessage: '"{0}" deleted.',
  DeleteSomeItemsSuccessMessage: "{0} items successfully deleted.",
  DeleteManyItemsSuccessMessage: "{0} items successfully deleted.",
  DeleteOneItemFailMessage: '"{0}" failed to delete.',
  DeleteManyItemsOneFailMessage: "1 item failed to delete.",
  DeleteSomeItemsFailMessage: "{0} items failed to delete.",
  DeleteManyItemsFailMessage: "{0} items failed to delete.",
  DeleteSomeItemsFailMessage2: "{2} items failed to delete.",   // {2} !!
  DeleteManyItemsFailMessage2: "{2} items failed to delete.",   // {2} !!
  deletingLocationLabel: 'Deleting from "{0}"',
  deletedLocationLabel: 'Deleted from "{0}"',
  DeleteNotAllowed : 'Unable to delete. Please try again when the current operation is finished',

  ApplyingManyItemsSuccessMessage: "Applied successfully to {0} items.",
  ApplyingOneItemFailMessage: "Failed to apply to 1 item.",
  ApplyingManyItemsFailMessage2: "Failed to apply to {0} items.",

  // Download
  CommandNameDownload: "Download",
  CommandVerbDownload: "download",

  // Zip & Download
  CommandNameZipDownload: "Download",
  CommandVerbZipDownload: "Download",
  VerifyZipAndDownloadPrefetch: "Verifying items",
  ExtractingZipAndDownload: "Extracting items",
  CompressingZipAndDownload: "Compressing items",
  CleanUpZipAndDownload: "Cleaning up",
  PreFlightDialogBtnContinue: "Continue",
  DownloadDialogBtnDownload: "Download",
  DialogBtnCancel: "Cancel",
  InvalidArchiveCharacters: "Special characters cannot be used in archive name: *\\?:<>|\"\/&",
  InvalidArchiveName: "Invalid archive name.",
  TheArchiveNameCannotBeEmpty: "Archive name cannot be empty.",
  TheArchiveNameMaxLength: "Archive name is greater than the maximum length (248)",

  // Move
  CommandTitleMove: "Move items",
  CommandNameMove: "Move",
  CommandNameVerbMove: "move",
  DialogTitleSingleMove: "Move {0} item",
  DialogTitleMove: "Move {0} items",
  SomeFilesNotMovedSuccessfully: 'Some items were not successfully moved.',
  MovePageLeavingWarning: "If you leave the page now, pending items will not be moved.",
  MovingNodes: 'Moving {0} nodes',
  MovingNode: 'Moving 1 node',
  MovingOneItem: 'Moving "{0}"',
  MovingItems: 'Moving {0} items',
  MovingSomeItems: 'Moving {0} items',
  MoveItemsNoneMessage: "No items moved.",
  MoveOneItemSuccessMessage: '"{0}" moved',
  MoveSomeItemsSuccessMessage: '{0} items successfully moved.',
  MoveManyItemsSuccessMessage: '{0} items successfully moved.',
  MoveManyItemsOneFailMessage: "1 item failed to move.",
  MoveOneItemFailMessage: '"{0}" failed to move',
  MoveSomeItemsFailMessage: '{0} items failed to move.',
  MoveManyItemsFailMessage: '{0} items failed to move.',
  MoveSomeItemsFailMessage2: '{2} items failed to move.',    // {2} !!
  MoveManyItemsFailMessage2: '{2} items failed to move.',    // {2} !!
  MovingLocationLabel :  'Moving to "{0}"',
  MovedLocationLabel : 'Moved to "{0}"',
  MoveNotAllowed : 'Unable to move. Please try again when the current operation is finished',

  // Paste
  CommandNamePaste: "Paste",

  // Reserve
  CommandNameReserve: "Reserve",
  CommandVerbReserve: "reserve",
  ReservePageLeavingWarning: "If you leave the page now, pending items will not be reserved.",
  ReserveItemsNoneMessage: "No items reserved.",
  ReserveOneItemSuccessMessage: "1 item successfully reserved.",
  ReserveSomeItemsSuccessMessage: "{0} items successfully reserved.",
  ReserveManyItemsSuccessMessage: "{0} items successfully reserved.",
  ReserveOneItemFailMessage: "1 item failed to reserve.",
  ReserveSomeItemsFailMessage: "{0} items failed to reserve.",
  ReserveManyItemsFailMessage: "{0} items failed to reserve.",

  //Add Favorite
  CommandNameFavorite: "Add Favorite",
  CommandVerbFavorite: "update Favorites",
  CommandDoneVerbFavorite: "added to Favorites",
  CommandRemovedVerbFavorite: "removed from Favorites",
  updateFavoriteFailTitle: "Update Favorite",
  updateFavoriteFailMessage: 'Failed to update Favorite for node "{0}". \n\n{1}',

  //Description
  CommandDescriptionToggle: "Description Toggle",
  CommandHideDescription: "Hide description",
  CommandShowDescription: "Show description",

  // Share
  CommandNameEmailLink: "Send to",
  CommandVerbEmailLink: "send",
  EmailLinkSubject: 'I want to share the following links with you',
  EmailLinkDesktop: "Link for Desktop and Android",
  EmailAppleLinkFormat: "Link for iOS Mobile",
  EmailLinkCommandFailedWithTooMuchItemsErrorMessage: "Mail as link failed. Too many items were selected.",

  // SignOut
  SignOutCommandName: "Sign Out",

  // SwitchToClassic
  SwitchToClassicCommandName: "Classic View",

  //ContentServerAdministration
  ContentServerAdministrationCommandName: "Administration",

  // Unreserve
  CommandNameUnreserve: "Unreserve",
  CommandVerbUnreserve: "unreserve",
  UnreservePageLeavingWarning: "If you leave the page now, pending items will not be unreserved.",
  UnreserveItemsNoneMessage: "No items unreserved.",
  UnreserveOneItemSuccessMessage: "1 item successfully unreserved.",
  UnreserveSomeItemsSuccessMessage: "{0} items successfully unreserved.",
  UnreserveManyItemsSuccessMessage: "{0} items successfully unreserved.",
  UnreserveOneItemFailMessage: "1 item failed to unreserve.",
  UnreserveSomeItemsFailMessage: "{0} items failed to unreserve.",
  UnreserveManyItemsFailMessage: "{0} items failed to unreserve.",

  // UserProfile
  UserProfileCommandName: "Profile",

  // Upload
  CommandTitleUpload: "Upload documents",
  UploadNotAllowed : 'Unable to upload. Please try again when the current operation is finished',
  // remaining see src/controls/globalmessage/impl/progresspanel/impl/nls/root/progresspanel.lang.js

  //Rename
  CommandVerbRename: "rename",

  //Filter Save
  CommandNameSaveFilter: "Save As",
  CommandVerbSaveFilter: "Save As",
  DialogTitleSaveFilter: "Save as",
  SaveFilterCommandSuccessfully: "{0} virtual folder created successfully.",

  // Edit
  NoEditUrl: 'Web page for editing of this document is not available.',

  // Copy Link
  CommandNameCopyLink: "Copy link",
  CommandVerbCopyLink: "copy link",
  CopyLinkSuccessMessage: "Link copied to clipboard.",
  CopyLinkFailMessage: "Copy link has failed to copy the link to clipboard.",

  //permissions commands
  DeletePermissionCommandRemoveOwner: "Remove owner",
  DeletePermissionCommandRemoveGroup: "Remove owner group",
  DeletePermissionCommandRemovePublicAccess: "Remove Public Access",
  DeletePermissionCommandRemoveOther: "Remove from list",
  DeletePermissionCommandConfirmDialogTitle: 'Remove {0}',
  DeletePermissionCommandConfirmDialogSingleMessage: 'Do you want to remove {0}' +
                                                     ' from this permissions list?',
  DeletePermissionCommandConfirmDialogPublicAccessMessage: 'Are you sure you want to remove' +
                                                           ' {0} from this permissions list?',
  DeletePermissionCommandSuccessMessage: "{0} was removed from the permissions list.",
  DeletePermissionCommandSuccessMessageWithCount: "{0} was removed from the permissions list of" +
                                                  " {1}.",
  DeletePermissionCommandFailMessage: "Failed to remove {0} from the permissions list.",
  publicAccess: 'Public Access',
  RestorePublicAccessSuccessMessage: "{0} restored",
  RestorePublicAccessSuccessMessageWithCount: "{0} restored to the permission list of {1}",
  undefinedCollection: 'Collection is undefined',
  EditPermissionCommandFailMessage: "Failed to edit {0} from the permissions list.",
  Owner: 'owner',

  CommandNameAddOwnerOrOwnerGroup: "Add Owner Or Owner Group",
  AddOwnerOrGroup: "Add owner or owner group",
  AddOwner: "Add owner",
  AddOwnerGroup: "Add owner group",
  CommandNameAddUserorGroup: 'Add user or group',
  CommandNameRestorePublicAccess: 'Restore public access',
  AddButtonLabel: 'Add',
  AddOwnerOrGroupDialogTitle: "Add Owner or Owner group",
  AddOwnerDialogTitle: "Add Owner",
  AddOwnerGroupDialogTitle: "Add Owner group",

  ChangeOwnerPermissionCommand: 'Change owner',
  ChangeOwnerGroupPermissionCommand: 'Change owner group',

  AddUserOrGroupSuccess: '{0} added successfully',
  AddUserOrGroupFailure: '{0} failed to add',
  AddUserOrGroupSuccessWithCount: '{0} was added to the permissions list of {1}.',

  formatForNone: "{0} items",
  formatForOne: "{0} item",
  formatForTwo: "{0} items",
  formatForFive: "{0} items",

  AppliedPermissions: 'Permissions applied selected item',
  AppliedPermissionsOneSuccess: 'Permissions applied to {0} item',
  AppliedPermissionsOnlySuccess: 'Permissions applied to {0} items',
  AppliedPermissionsOneFailure: 'Permissions failed to apply {0} item',
  AppliedPermissionsOnlyFailure: 'Permissions failed to apply {0} items',
  AppliedPermissionsSuccessAndFailure: 'Permissions applied to {0} items and failed to apply {1}' +
                                       ' items',

  // CommandHelper
  CommandSuccessfullySingular: "{0} item successfully {1}.",
  CommandFailedSingular: "{0} item failed to {1}.",
  CommandSuccessfullyPlural: "{0} items successfully {1}.",
  CommandFailedPlural: "{0} items failed to {1}.",
  CommandFailedPartial: "{0} of {1} items failed to {2}.",

  NoConnectivity: "No connectivity",
  GoToOffline: "Go to offline files?",

  viewTypeUnsupported: 'This content type is not currently supported on a mobile device.',

  MobileIOS: "iOS Mobile",
  DesktopAndroid: "Desktop and Android",
  Close: 'Close',
  addButton: "Add",
  otheruser: "other user",
  addDocument: "Add Document",
  allUsersAndGroups: "Users and Groups",
  addUsersAndGroups: "Add users or groups",
  addGroups:"Add Groups",
  allGroups: "Groups",
  cancelButtonLabel: "Cancel",
  applyButtonLabel: "Apply",
  ThumbnailTitle: "Grid view",
  ListViewTitle: "Browse view",
  DensityLabel: "Density",
  error: "Error",

  //edit perspective
  EditPerspective: "Edit page",
  editPerspectiveErrorMessage: "The page cannot be edited. It is used as template for multiple pages",
  editPageDialogMessage: "Who will see the page edits?",
  editPageButton: "Everyone",
  personalizePageButton: "Only you",
  editPageCancelButton: "Cancel",
  editPageTitle: "Edit page",

  //create perspective
  CreatePerspective: "Create new perspective",
  //custom view form as side panel
  searchButtonMessage: "Search",
  personalizePage: "Personalize page",

  BackButtonToolItem: "Go Back",

  MissingNodeId: "invalid node or missing node id.",

  //Create revision
  revision: "Revision ",
  currentRevision: "Current revision",
  newRevision: "New revision",
  revisionName: "Revision name",
  createRevisionHeaderTitle: "Create revision",
  submitButton: "Submit",
  cancelButton: "Cancel",
  revisionSuccessMsg: 'Created new revision' + ' ‘{0}’ '+ 'successfully.',
  
  //Create release
  GotoLocationLinkLabel: "Go to location",
  release: "Release ",
  currentRelease: "Current release",
  newRelease: "New release",
  releaseName: "Release name",
  createReleaseHeaderTitle: "Create release",
  releaseSuccessMsg: 'Created new release' + ' ‘{0}’ ' + 'successfully.',
  noneLabel: '<None>',

   // View releases
   CommandNameViewReleases: "View Releases",

   // Compound documents
   compoundDocumentHeaderTitle: "Compound document",

   // Reorganize
   Reorganize :"Reorganize",
   ReorganizeSuccessMsg: "Reorganization of items completed successfully.",

  // About box
   brandTitle: "opentext | ",

  //Save Query
  CommandNameSaveQuery: "Save As query",
  CommandVerbSaveQuery: "Save As query",
  DialogTitleSaveQuery: "Save search as",
  SaveQueryCommandSuccessfully: "{0} created successfully.",
  saveButtonLabel: "Save",

  //Update Query
  CommandNameUpdateQuery: "Update query",
  CommandVerbUpdateQuery: "Update query",
  UpdateQueryCommandSuccessfully: "{0} updated successfully.",

  //Restructure command
  CommandNameRestructure: "Restructure",
  RestructureDialogTitle: 'Restructure',
  Restructure: 'Restructure',
  confirmationRestructure: "Restructuring will start as scheduled. Assigned users will be notified about the progress.",
  errorRestructure: "Unable to start restructuring.",
  files: 'files',
  CommandTitleRestructure: "Restructure items", 
  DialogTitleSingleRestructure: "Restructure {0} item", 
  DialogTitleRestructure: "Restructure {0} items", 
  RestructuringNodes: 'Restructure {0} nodes', 
  RestructuringNode: 'Restructure 1 node', 
  RestructureNotAllowed : 'Unable to Restructure. Please try again when the current operation is finished', 
});

csui.define('csui/utils/commands/versions/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/commands/versions/nls/root/localized.strings',{

  // DeleteVersion
  CommandNameVersionDelete: "Delete Version",
  CommandVerbVersionDelete: "delete",
  DeleteCommandConfirmDialogTitle: "Delete",
  VersionDeleteCommandConfirmDialogSingleMessage: 'Do you want to delete version {0} from "{1}"?',
  VersionDeleteCommandConfirmDialogMultipleMessage: "Do you want to delete {0} versions?",
  DeleteVersionPageLeavingWarning: "If you leave the page now, pending versions will not be" +
                                   " deleted.",

  DeleteVersions: 'Deleting {0} versions',
  DeletingSomeVersions: 'Deleting {0} versions',
  DeletingOneVersion: 'Deleting version',
  DeleteVersionItemsNoneMessage: "No versions deleted.",
  DeleteVersionOneItemSuccessMessage: "1 version succeeded to delete.",
  DeleteVersionSomeItemsSuccessMessage: "{0} versions succeeded to delete.",
  DeleteVersionManyItemsSuccessMessage: "{0} versions succeeded to delete.",
  DeleteVersionOneItemFailMessage: "1 version failed to delete.",
  DeleteVersionSomeItemsFailMessage: "{0} versions failed to delete.",
  DeleteVersionManyItemsFailMessage: "{0} versions failed to delete.",
  DeleteVersionSomeItemsFailMessage2: "{2} versions failed to delete.",   // {2} !!!
  DeleteVersionManyItemsFailMessage2: "{2} versions failed to delete.",   // {2} !!!

  //PromoteVersion
  CommandNamePromoteVersion: 'Promote to Major Version',
  CommandVerbPromoteVersion: 'Promote to Major Version',
  MessageVersionPromoted: 'Version successfully promoted',
  DialogPromoteVersion: 'version {0} promoting to {1}',

  // TODO: this is only here, because the CommandHelper.handleExecutionResults does an extension
  // TODO: remove this if the handleExecutionResults is not used anymore or the extension is removed
  CommandSuccessfullySingular: "{0} version successfully {1}.",
  CommandFailedSingular: "{0} version failed to {1}.",
  CommandSuccessfullyPlural: "{0} versions successfully {1}.",
  CommandFailedPlural: "{0} versions failed to {1}.",
  CommandFailedPartial: "{0} of {1} versions failed to {2}.",

  MissingVersionInfo: "invalid version or missing required version info.",

});


csui.define('csui/utils/commandhelper',[
  'require', 'module', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/backbone', 'csui/utils/base', 'csui/utils/command.error',
  'i18n!csui/utils/commands/nls/localized.strings',
  'i18n!csui/utils/commands/versions/nls/localized.strings',
  'csui/models/version', 'csui/lib/jquery.when.all'
], function (require, module, $, _, Backbone, base, CommandError,
    lang, versionsLang, VersionModel) {
  'use strict';

  var config = module.config();
  var defaultLang = _.clone(lang);
  var CommandHelper = function () {};

  _.extend(CommandHelper.prototype, Backbone.Events, {

    checkNodeTypesAndRights: function (nodes, types, rights) {
      _.isArray(nodes) || nodes && (nodes = [nodes]);
      var container = _.contains(types, -1);
      return nodes && nodes.length && _.all(nodes, function (node) {
            return (_.contains(types, node.get("type")) ||
                    container && node.get("container")) &&
                   _.all(rights, function (right) {
                     return node.get("perm_" + right);
                   });
          });
    },

    checkNodeTypes: function (nodes, types) {
      _.isArray(nodes) || nodes && (nodes = [nodes]);
      var container = _.contains(types, -1);
      return nodes && nodes.length && _.all(nodes, function (node) {
            var attributes = base.isBackbone(node) ? node.attributes : node;
            return _.contains(types, attributes.type) ||
                   container && attributes.container;
          });
    },

    checkNodeRights: function (nodes, rights) {
      _.isArray(nodes) || nodes && (nodes = [nodes]);
      return nodes && nodes.length && _.all(nodes, function (node) {
            var attributes = base.isBackbone(node) ? node.attributes : node;
            return _.all(rights, function (right) {
              return attributes["perm_" + right];
            });
          });
    },

    getJustOneNode: function (status) {
      var node = status.nodes && status.nodes.length === 1 && status.nodes.at(0);
      return node;
    },

    getAtLeastOneNode: function (status) {
      if (status.nodes) {
        return status.nodes;
      }

      var ViewCollection = Backbone.Collection.extend(
          status.collection ? {model: status.collection.model} : {}
      );

      return new ViewCollection();
    },

    updateNode: function (node, attributesToUpdate) {
      var self = this;
      return node
          .save(attributesToUpdate, {
            wait: true,
            patch: true,
            silent: true
          })
          .then(function () {
            return node.fetch({force:true});
          })
          .then(function () {
            return node;
          }, function (error) {
            var commandError = new CommandError(error, node);
            return $.Deferred().reject(commandError);
          });
    },

    // TODO: The drawback of this function is that it uses localized strings where text gets composed with help of placeholders (doneVerb).
    // TODO: This introduces great problems for localization.
    // Returns a promise which is resolved when all given promises are resolved. The returned
    // promise gets an array with the collected results of all given promises.
    // If options.suppressSuccessMessage == true then no success message is displayed.
    handleExecutionResults: function (promise, options) {
      var handleExecutionResultsDeferred = $.Deferred(),
          modulePromise = $.Deferred();

      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function(GlobalMessage) {
        modulePromise.resolve(GlobalMessage);
      }, modulePromise.reject);

      $.whenAll(modulePromise, promise)
       .always(function (parameters) {
        var GlobalMessage = parameters[0],
            results = parameters[1];
        if (!_.isArray(results)) {
          results = [results];
        }

        // At this point all promises from all commands are either resolved or rejected
        // If the command execution was successful, the node is in the results. If the command
        // failed the result is Error
        var okCnt = 0;
        var failedCnt = 0;
        _.each(results, function (result) {
          if (result !== undefined && !result.cancelled) {
            if (result instanceof Error) {
              failedCnt++;
            } else {
              okCnt++;
            }
          }
        });
        if (failedCnt === 0 && okCnt === 0) {
          // user canceled confirmation dialog or
          // no parameter was intentionally specified for e.g. resolve and reject to skip error handling
          handleExecutionResultsDeferred.reject();
          return;
        }
        var commandError = results[0];
        // the command itself took care of the status  and error handling

        if (commandError instanceof VersionModel) {
          // let's override language bundles based on model type.
          _.extend(defaultLang, versionsLang);
        } else {
          _.extend(defaultLang, lang);
        }

        if (results.length === 1) {
          if (okCnt === 1) {
            if (!options.suppressSuccessMessage) {
              GlobalMessage.showMessage("success",
                  _.str.sformat(defaultLang.CommandSuccessfullySingular, okCnt,
                      options.command.get('doneVerb')));
            }
          } else {
            var message = commandError.errorDetails || commandError.message;

            if (config.offlineSupport && commandError.statusCode === 0) {
              handleExecutionResultsDeferred.reject(commandError);
            }
            else if (!options.suppressFailMessage && !commandError.suppressFailMessage) {
              GlobalMessage.showMessage("error",
                  _.str.sformat(defaultLang.CommandFailedSingular, failedCnt,
                      options.command.get('verb')),
                  message);
            }
          }
        } else {
          if (failedCnt === 0) {
            // all were successful
            if (!options.suppressSuccessMessage) {
              GlobalMessage.showMessage("success",
                  _.str.sformat(defaultLang.CommandSuccessfullyPlural, okCnt,
                      options.command.get('doneVerb')
                  ));
            }
          } else {
            if (okCnt === 0) {
              // all failed
              if (config.offlineSupport && commandError.statusCode === 0) {
                handleExecutionResultsDeferred.reject(commandError);
              }
              else if (!options.suppressFailMessage && !commandError.suppressFailMessage) {
                GlobalMessage.showMessage("error",
                    _.str.sformat(defaultLang.CommandFailedPlural, failedCnt,
                        options.command.get('verb')
                    ));
              }
            } else if (!options.suppressFailMessage && !commandError.suppressFailMessage) {
              if (!!options.customError) {
                GlobalMessage.showMessage('error', results[1]);
              } else {
                // some failed, some were successful
                GlobalMessage.showMessage("error",
                  _.str.sformat(defaultLang.CommandFailedPartial, failedCnt, results.length,
                      options.command.get('verb')
                ));
              }
            }
          }
        }
        handleExecutionResultsDeferred.resolve(results);
      });
      // return a promise - table toolbar waits for it to do anything else after command
      // execution (like display inline form)
      return handleExecutionResultsDeferred.promise();
    },

    _getErrorMessageFromResponse: function (err) {
      var errorMessage;
      if (err && err.responseJSON && err.responseJSON.error) {
        errorMessage = err.responseJSON.error;
      } else {
        var errorHtml = base.MessageHelper.toHtml();
        base.MessageHelper.reset();
        errorMessage = $(errorHtml).text();
      }
      return errorMessage;
    },

    // TODO: Deprecate and remove this method in favour of node.fetch.
    refreshModelAttributesFromServer: function (node, collection) {
      var tempNode = node.clone();
      tempNode.collection = collection || node.collection;
      return tempNode.fetch()
                     .then(function () {
                       node.set(tempNode.attributes);
                       if (tempNode.original) {
                         node.original = tempNode.original;
                       }
                       return node;
                     });
    },

    showOfflineMessage: function (error, yesCallBck, noCallBack) {
      if (error && error.statusCode === 0 && config.offlineSupport) {
        var self = this;

        csui.require(['csui/dialogs/modal.alert/modal.alert'],
            function (modalAlert) {

              modalAlert.showInformation(defaultLang.GoToOffline, defaultLang.NoConnectivity,
                  {
                    buttons: modalAlert.buttons.YesNo
                  })
                  .always(function (answer) {
                    if (answer) {
                      yesCallBck ? yesCallBck() : window.location.href = "#offline.list";
                    }
                    else {
                      noCallBack ? noCallBack() : self.trigger('offline:refused');
                    }
                  });
            });
        return true;
      }
    }
  });

  var helperInstance = new CommandHelper();
  return helperInstance;

});

csui.define('csui/models/command',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/commandhelper'
], function (_, Backbone, CommandHelper) {

  // {
  //   defaults: {
  //     signature:   unique identifier among all commands
  //     name:        title to show in the UI by default
  //     command_key: permitted action identifier(s) returned by the server
  //     openable:    use the "openable" node attribute to enable the command
  //     types:       node types supported by the command
  //     scope:       node scope to work at: singe|multiple
  //  },
  //
  //   getCommandKey: function () {
  //     returns an array of signatures of required permitted actions
  //     (optional, the attribute command_key will be checked otherwise)
  //   },
  //
  //   enabled: function (status) {
  //     returns boolean if this command should be enabled or available;
  //     the default implementation checks the presence of a permitted
  //     action (command_key) or openability, with consideration of the
  //     supported scope and types
  //     (optional, the attributes command_key, openable, types and scope
  //      will be checked otherwise)
  //   },
  //
  //   execute: function (status, options) {
  //     executes this command; no default implementation
  //   }
  // }

  var CommandModel = Backbone.Model.extend({
    idAttribute: 'signature',

    constructor: function CommandModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    getCommandKey: function () {
      var commandKey = this.get('command_key');
      return commandKey ? Array.isArray(commandKey) ? commandKey : [commandKey] : [];
    },

    enabled: function (status, options) {
      var scope = this.get('scope');
      var nodes = this._getNodesByScope(status, scope);
      if (scope && !(nodes && nodes.length)) {
        return false;
      }

      var types = this.get('types') || [];
      if (types.length && !this.checkTypes(nodes, types)) {
        return false;
      }

      var openable = this.get('openable');
      // If openability was requested and all nodes are openable,
      // no permitted actions checks will be performed.
      if (openable && this.checkOpenability(nodes)) {
        return true;
      }

      var signatures = this.getCommandKey && this.getCommandKey()
        || this.get('command_key') || [];
      // If sole openability was requested and is not granted
      // and no permitted actions were requested in addition,
      // the command will be disabled.
      if (openable && !signatures.length) {
        return false;
      }
      // If either no permissions were requested or all were granted,
      // the command will be enabled.
      return !signatures.length || this.checkPermittedActions(nodes, signatures);
    },

    isNonPromoted: function (status) {
      var scope         = this.get("scope"),
          nodes         = this._getNodesByScope(status, scope),
          signatures    = this.getCommandKey && this.getCommandKey()
                            || this.get('command_key') || [],
          isNonPromoted = false;

      // if at least one node is selected and at least one selected node
      // has action which is non-promoted
      if (nodes && nodes.length) {
        var checkFn = this._getNonPromotedCheckFunctionsForSignatures(signatures);
        if (checkFn) {
          _.find(nodes, function (node) {
            var action = checkFn(node);
            if (action && action.get('csuiNonPromotedAction') === true) {
              isNonPromoted = true;
              return true;
            }
          });
        }
      }
      return isNonPromoted;
    },

    _getNodesByScope: function (status, scope) {
      // get the array of nodes which the command should apply to
      // according to the scope which the command is capable of
      var nodes;
      switch (scope) {
      case "single":
        nodes = CommandHelper.getJustOneNode(status);
        nodes && (nodes = [nodes]);
        break;
      default: // without a specific scope, use case "multiple"
        // the checks below use an array; not a Backbone.Collection
        nodes = CommandHelper.getAtLeastOneNode(status).models;
        break;
      }
      return nodes;
    },

    _getCheckFunctionsForSignatures: function (signatures) {
      if (signatures && signatures.length) {
        if (_.isArray(signatures)) {
          return function (node) {
            return _.any(signatures, function (signature) {
              return node.actions && node.actions.findRecursively(signature);
            });
          };
        }
        return function (node) {
          return node.actions && node.actions.findRecursively(signatures);
        };  
      }
    },

    _getNonPromotedCheckFunctionsForSignatures: function (signatures) {
      var checkFn;
      if (signatures) {
        if (_.isArray(signatures) && signatures.length) {
          checkFn = function (node) {
            var action;
            _.find(signatures, function (signature) {
              action = node.actions && node.actions.findRecursively(signature);
              return !!action;
            });
            return action;
          };
        } else if (_.isString(signatures)) {
          checkFn = function (node) {
            return node.actions && node.actions.findRecursively(signatures);
          };
        }
      }
      return checkFn;
    },

    checkTypes: function (nodes, types) {
      // if at least one node is selected and each selected node
      // has its type among the supported ones, the command is enabled
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = [nodes];
        }
        if (nodes.length) {
          return nodes.every(function (node) {
            return types.indexOf(node.get('type')) >= 0;
          });
        }
      }
      return false;
    },

    checkOpenability: function (nodes) {
      // if at least one node is selected and each selected node
      // has the "openable" attribute set, the command is enabled
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = [nodes];
        }
        if (nodes.length) {
          return nodes.every(function (node) {
            return node.get('openable');
          });
        }
      }
      return false;
    },

    checkPermittedActions: function (nodes, signatures) {
      // if at least one node is selected and each selected node
      // has the right action in actions, the command is enabled
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = [nodes];
        }
        if (nodes.length) {
          // If no action signatures were specified, default to permitted
          // actions requested bu this command.
          if (!signatures) {
            signatures = this.getCommandKey && this.getCommandKey()
              || this.get('command_key') || [];
          }
          var checkNode = this._getCheckFunctionsForSignatures(signatures);
          // if no command_key is specified, the descended command is
          // always enabled; but it usually overrides the enabled() method
          return !checkNode || _.all(nodes, checkNode);
        }
      }
      return false;
    },

    _getNodeActionForSignature: function (node, signatures) {
      var action;
      if (node) {
        var checkNode = this._getCheckFunctionsForSignatures(signatures);
        if (!!checkNode) {
          action = checkNode.call(this, node);
        }
      }
      return action;
    }
  });

  return CommandModel;
});

csui.define('csui/utils/commands/back.to.last.fragment',['module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, $, _, CommandModel, lang) {
  'use strict';

  var BackToLastFragment = CommandModel.extend({

    defaults: {
      signature: 'BackToLastFragment',
      name: lang.GoBack
    },

    enabled: function (status, options) {

      var config = _.extend({
            enabled: false
          }, module.config()),
          context = status.context || options && options.context;

      if (!context || !config.enabled) {
        return false;
      }

      var viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        return !!viewStateModel.getLastHistoryEntry();
      }
    },

    execute: function (status, options) {
      var context = status.context || options && options.context,
          viewStateModel = context && context.viewStateModel;

      if (viewStateModel) {
        viewStateModel.set('browsing', true);
        viewStateModel.restoreLastFragment();
      }

      return $.Deferred().resolve().promise();
    }

  });

  return BackToLastFragment;

});

csui.define('csui/integration/folderbrowser/commands/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/integration/folderbrowser/commands/go.to.node.history',['module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'csui/integration/folderbrowser/commands/nls/localized.strings'
], function (module, require, $, _, CommandModel, lang) {
  'use strict';

  var visitedNodesByContext = {};

  var GoToNodeHistoryCommand = CommandModel.extend({

    defaults: {
      signature: 'Back',
      name: lang.GoToHistory
    },

    enabled: function (status, options) {
      // Module configuration can change later, than this module has been
      // required and its callback executed. Repeat reading its config.
      var config = _.extend({
            enabled: false
          }, module.config()),
          context = status.context || options && options.context,
          visitedNodes;
      // Context us not mandatory; some commands can work without it,
      // and those, which cannot, should say it
      if (!context) {
        return false;
      }
      if (config.enabled) {
        this._ensureGoBackList(context);
      }
      visitedNodes = visitedNodesByContext[context.cid] || [];
      // Top node is the current one. At least one more node below is needed
      // for being able to go back to it.
      return config.enabled && visitedNodes.length > 1;
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/utils/contexts/factories/next.node'
      ], function (NextNodeModelFactory) {
        var context = status.context || options && options.context,
            nextNode = context.getModel(NextNodeModelFactory),
            visitedNodes = visitedNodesByContext[context.cid] || [];
        // Do not crash if somebody executed this command without asking
        // if it is enabled first. Sanity check.
        if (visitedNodes.length > 1) {
          // Top node is the current one. Pop it, so that the previous one
          // on the stack can become the current one.
          visitedNodes.pop();
          nextNode.set('id', visitedNodes[visitedNodes.length - 1]);
        }
        deferred.resolve();
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    clearHistory: function (context) {
      delete visitedNodesByContext[context.cid];
    },

    _ensureGoBackList: function (context) {
      // There is only one command instance on the page, once the command
      // has been required, but there can be multiple contexts.
      var visitedNodes = visitedNodesByContext[context.cid];
      if (visitedNodes) {
        return;
      }
      visitedNodes = visitedNodesByContext[context.cid] = [];
      csui.require(['csui/utils/contexts/factories/node',
        'csui/utils/contexts/factories/next.node'
      ], function (NodeModelFactory, NextNodeModelFactory) {
        var nextNode = context.getModel(NextNodeModelFactory);
        // Ensure, that the initially empty stack start with the current node.
        visitCurrentNode(NodeModelFactory);
        // Whenever the context is fetched, ensure, that the new node gets
        // pushed on the top of the stack.
        context.on('request', function () {
          visitCurrentNode(NodeModelFactory);
        });
        // Some components either do not wait for context's "request" event,
        // or they registered their listener earlier, than this command.
        // Get the new node before a context plugin decides to fetch context.
        nextNode.on('change:id', function () {
          visitCurrentNode(NextNodeModelFactory);
        });
        function visitCurrentNode(Factory) {
          var node = context.getModel(Factory),
              nodeId = node.get('id');
          // Node ID could be reset, if nextNode event has been caught.
          // If both nextNode's and node's events are triggered, this
          // function will be called with the same node ID.
          if (nodeId && visitedNodes[visitedNodes.length - 1] !== nodeId) {
            visitedNodes.push(nodeId);
          }
        }
      });
    }

  });

  return GoToNodeHistoryCommand;

});

csui.define('csui/integration/folderbrowser/commands/nls/root/localized.strings',{
  "GoToHistory": "Go Back",
  "OpenFullPageContainer": "Open Full Page Container"
});


csui.define('csui/integration/folderbrowser/commands/open.full.page.container',[
  'module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command',
  'i18n!csui/integration/folderbrowser/commands/nls/localized.strings'
], function (module, require, $, _, CommandModel, lang) {
  'use strict';

  var OpenFullPageWorkpsace = CommandModel.extend({
    defaults: {
      signature: 'Page',
      name: lang.OpenFullPageContainer
    },

    enabled: function (status, options) {
      var config = _.extend({
        enabled: false
      }, module.config());
      return config.enabled && !!status.container;
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/utils/node.links/node.links'], function (nodeLinks) {
        window.open(nodeLinks.getUrl(status.container));
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    }
  });

  return OpenFullPageWorkpsace;
});

csui.define('csui/integration/folderbrowser2/commands/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/integration/folderbrowser2/commands/nls/root/localized.strings',{
  "OpenFullPageContainer": "Open Full Page Container"
});


csui.define('csui/integration/folderbrowser2/commands/open.full.page.container',[
  'module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command',
  'i18n!csui/integration/folderbrowser2/commands/nls/localized.strings'
], function (module, require, $, _, CommandModel, lang) {
  'use strict';

  var OpenFullPageWorkpsace = CommandModel.extend({
    defaults: {
      signature: 'Page',
      name: lang.OpenFullPageContainer
    },

    enabled: function (status, options) {
      var config = _.extend({
        enabled: false
      }, module.config());
      return config.enabled && !!status.container;
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/utils/node.links/node.links'], function (nodeLinks) {
        window.open(nodeLinks.getUrl(status.container));
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    }
  });

  return OpenFullPageWorkpsace;
});

csui.define('csui/models/commands',['csui/lib/underscore', 'csui/lib/backbone', 'csui/models/command'
], function (_, Backbone, CommandModel) {

  var CommandCollection = Backbone.Collection.extend({

    model: CommandModel,

    constructor: function CommandCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    clone: function () {
      // Provide the options; they may include other parameters
      var clone = new this.constructor(this.models, this.options);
      clone.signatures = _.clone(this.signatures);
      return clone;
    },

    // Get 'command_key' filtering by toolbarItems using signatures.
    getSignatures: function (toolbarItems) {
      var sigArray = [];
      _.mapObject(toolbarItems, function (val, key) {
        sigArray = _.union(sigArray, _.without(val.getCollection().pluck('signature'), 'disabled'));
      });

      var commands = this.clone();
      var commandsToRemove = [];
      commands.each(function (command) {
        if (sigArray.indexOf(command.get('signature')) === -1) {
          commandsToRemove.push(command);
        }
      });
      commands.remove(commandsToRemove, {silent: true});

      return commands.getAllSignatures();
    },

    getAllSignatures: function () {
      return _
          .chain(this.models)
          .invoke('getCommandKey')
          .map(function (commandKeys) {
            // If there are multiple command keys to check, take just the
            // first one, which is the V2 one needed for the URL query
            var firstCommandKey = commandKeys[0];
            // If the 'default' command key is requested, add the concrete
            // key too; v1 expects 'default' and v2 'open', while the
            // concrete action would be at the third place then.
            if (firstCommandKey === 'default') {
              return ['default', 'open', commandKeys[2]];
            }
            return commandKeys;
          })
          .flatten()
          .compact()
          .invoke('toLowerCase')
          .unique()
          .value();
    }

  });

  return CommandCollection;

});


csui.define('csui/utils/commands',[
  'csui/lib/underscore', 'csui/models/commands',
  // Load extra commands to be added to the common collection
  'csui-ext!csui/utils/commands'
], function (_, CommandCollection, extraCommands) {
  'use strict';

  var commands = new CommandCollection();

  _.extend(commands, {
    signatures: {
      browse: 'Browse',
      open: 'Open',
      download: 'Download',
      add: 'Add',
      navigate: 'Navigate',
      original: 'Original'
    },
    version: '1.0'
  });

  if (extraCommands) {
    commands.add(
        _.chain(extraCommands)
         .flatten(true)
         .map(function (Command) {
           return new Command();
         })
         .value()
    );
  }

  return commands;
});


/* START_TEMPLATE */
csui.define('hbs!csui/dialogs/file.open/impl/file.open',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<input type=\"file\" style=\"display:none\" "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"multiple") || (depth0 != null ? lookupProperty(depth0,"multiple") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"multiple","hash":{},"loc":{"start":{"line":1,"column":40},"end":{"line":1,"column":52}}}) : helper)))
    + ">\r\n";
}});
Handlebars.registerPartial('csui_dialogs_file.open_impl_file.open', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/dialogs/file.open/file.open.dialog',['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/utils/log', 'csui/utils/base',
  'hbs!csui/dialogs/file.open/impl/file.open'
], function (module, _, $, Marionette, log, base, template) {
  'use strict';

  log = log(module.id);

  var FileOpenDialog = Marionette.ItemView.extend({

    className: 'csui-file-open',

    template: template,

    templateHelpers: function () {
      return {
        multiple: this.options.multiple ? 'multiple' : ''
      };
    },

    ui: {
      fileInput: 'input'
    },

    events: {
      'change @ui.fileInput': '_processFiles'
    },

    constructor: function FileOpenDialog(options) {
      // Memoize properties, which can be provided as functions
      this.className = _.result(this, 'className');

      // If the previous caller didn't destroy the dialog, do it now.
      // The view should be garbage collected. There should be just
      // one dialog on the page at the same time.
      var earlierElement = $(document.body).find('> .' + this.className);
      if (earlierElement.length) {
        log.debug('Removing an earlier file-open input element.')
        && console.log(log.last);
        earlierElement.remove();
      }

      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    onDestroy: function(){
      this.ui.fileInput.off();
    },

    show: function () {
      log.debug('Showing a file-open input element.')
      && console.log(log.last);
      this.render();
      $(document.body).append(this.el);
      this.ui.fileInput.trigger('click');
      this.ui.fileInput.trigger('focus');
    },

    _processFiles: function (event) {
      var originalEvent = event.originalEvent,
          files = originalEvent.target.files ||
                  originalEvent.dataTransfer &&
                  originalEvent.dataTransfer.files;
      log.debug(files.length + ' file(s) selected by a file-open input element.')
      && console.log(log.last);
      this.trigger('add:files', files);
    }

  });

  return FileOpenDialog;

});

csui.define('csui/utils/commands/add/add.mixin',["require", "csui/lib/jquery", "csui/lib/underscore",
  "csui/utils/url", "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/log", "csui/utils/base", "csui/utils/commandhelper",
  'csui/models/node/node.model',
  'csui/dialogs/file.open/file.open.dialog'
], function (require, $, _, URL, lang, log, base, CommandHelper,
  NodeModel, FileOpenDialog) {
  'use strict';

  var AddMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        _selectFilesForUpload: function (status, options) {
          var fileOpenDialog,
              deferred = $.Deferred();
          var container = status.container || options.container;
          if (container && container.get('type') === 136 && !container.get("fileOrder")) { //fetch order_next value before each upload set
            var url = container.connector.getConnectionUrl().getApiBase('v2'),
              query = URL.combineQueryString({
                fields: ['properties{order_next}'],
              }),
            ajaxOptions = {
              url: URL.combine(url, 'nodes', container && container.get('id'), '?' + query),
              type: 'GET',
              contentType: 'application/x-www-form-urlencoded'
            };
            container && container.connector.makeAjaxCall(ajaxOptions).always(function (resp) {
              //ignoring the failed scenario as it is not required, handling with .always
                resp.results && container.set("order_next", resp.results.data.properties.order_next);
            });
          }
          // View to provide the area for the drag'n'drop overlay-view, which will
          // turn up when files are dragged over it and trigger an event when the
          // files are dropped on it.
          csui.require(['csui/controls/globalmessage/globalmessage'
          ], function (GlobalMessage) {
            if (GlobalMessage.isActionInProgress(options.actionType, lang.UploadNotAllowed,
                lang.CommandTitleAdd)) {
              return deferred.resolve();
            }
            fileOpenDialog = new FileOpenDialog({multiple: true});
            deferred.resolve(); // resolve immediately because fileOpenDialog can't trigger anything
            // on cancel
            fileOpenDialog
              .listenTo(fileOpenDialog, 'add:files', function (files) {
                csui.require(['csui/controls/fileupload/fileupload'
                ], function (fileUploadHelper) {
                  deferred.resolve();
                  var uploadController = fileUploadHelper.newUpload(status, options);
                  uploadController.addFilesToUpload(files, {
                    collection: status.collection,
                    excludeAddVersion: options.excludeAddVersion,
                    excludeAddVersionforFolders: options.excludeAddVersion
                  });
                  uploadController.listenTo(uploadController, 'destroy', function () {
                    fileOpenDialog.destroy();
                  });
                });
              }).show();
          });
          return deferred.promise();
        },

        // The type_name is used before the actual node is created to supply
        // the right icon, to provide the placeholder text for entering the
        // node name, to make the title of the creation dialog etc.
        _getAddableTypeName: function (status, options) {
          // The command caller can override the type name returned by
          // /addablenodetypes
          if (options.addableTypeName) {
            return options.addableTypeName;
          }
          // The enable method checks, that the type exists
          var addableType = status.data.addableTypes.findWhere({
            type: options.addableType
          });
          // The type_name is he same as returned by the server from the node
          // info calls; nodeSpriteCollection should be used to show the
          // displayable node type name and icon
          return addableType.get('type_name');
        }

      });

    }
  };

  return AddMixin;

});

csui.define('csui/utils/commands/add.categories',["require", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/base", "csui/utils/log",
  "csui/models/command"
], function (require, $, _, base, log, CommandModel) {

  var AddCategories = CommandModel.extend({

    defaults: {
      signature: 'AddCategory',
      command_key: ['addcategory', 'AddCategory'],
      scope: "single"
    },

    enabled: function (status, options) {
      var scope = this.get("scope");
      var nodes = this._getNodesByScope(status, scope);

      if (nodes && nodes.length > 0) {
        // since this is a 'single' scope command, just check one node
        if (nodes[0].get('id') === undefined) {
          // ********* NOTE: **********
          // For Create scenario, the server team does not deliver a RestAPI call to get the
          // actions. Both Stefan Greim from CWS and Alex Gerasimov from RM have special
          // requirements to enable/disable the actions based on the workflow/object state.
          // Ferda came up with a solution by checking:
          // - if there is no form[role_name='categories'], then allow the 'AddCategory' command
          // - or if there is form[role_name='categories'], then check custom field in Alpaca form:
          //   >> options.forms[role_name='categories'].schema.additionalProperties = true/false
          // Then enable/disable the 'AddCategory' action based on this value.
          //
          // Stefan and Alex will set this value in their code if they want to override and control
          // the 'AddCategory' command.  For their commands such as 'AddClassifications', they will
          // implement similar logics as of this 'add.categories' command in their command
          // implementation of the enabled() method.

          var enabled = true;
          if (status.originalFormCollection) {
            status.originalFormCollection.each(function (form) {
              if (form.get('role_name') === 'categories' &&
                  form.get('schema').additionalProperties === false) {
                enabled = false;
              }
            });
          }
          return enabled;
        } else {
          // For Edit/Copy/Move scenario, check the node for the actions
          return CommandModel.prototype.enabled.apply(this, arguments);
        }
      }
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/widgets/metadata/metadata.add.categories.controller'
      ], function (MetadataAddCategoriesController) {

        /* Options needed:
        var options = {
          action: this.options.action,
          node: this.options.node,
          collection: this.options.collection,
          container: this.options.container,
          inheritance: this.options.inheritance,
          context: this.options.context,
          parentView: this.options.parentView,  // use for blocking view and callback
          addPropertiesCallback: this.options.addPropertiesCallback  // to insert the new Category
        }; */

        var metadataAddCatController = new MetadataAddCategoriesController();
        metadataAddCatController.AddNewCategory(options)
            .done(function (resp) {
              if (options.addPropertiesCallback) {
                options.addPropertiesCallback.call(options.parentView, resp.catModel);
              }
              deferred.resolve();
            })
            .fail(function (err) {
              deferred.reject(err);
            });

      }, function (error) {
        log.warn('Failed to load MetadataAddCategoriesController. {0}', error)
        && console.warn(log.last);
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  return AddCategories;

});

csui.define('csui/utils/commands/compound.document/compound.document.util',['csui/lib/underscore'],
  function (_) {

    function verifyNodeAncestors(context) {
      var ancestorCollection, isAncestorReleaseOrRevision;
      ancestorCollection = _.has(context._factories.ancestors.property, "models") &&
        context._factories.ancestors.property.models;
      isAncestorReleaseOrRevision = _.find(ancestorCollection, function (ancestor) {
        return _.contains([138, 139], ancestor.attributes.type);
      });
      // restricting commands only to compound documents which are not part
      // of any release/revision (type 138/139)
      if (!!isAncestorReleaseOrRevision) {
        return false;
      }
      else {
        return true;
      }
    }
    return {
      verifyNodeAncestors: verifyNodeAncestors,
    };
  });
csui.define('csui/utils/commands/add',["module", "require", "csui/lib/jquery", "csui/lib/underscore",
  "csui/utils/log", "csui/models/command", 'csui/models/node/node.model',
  'csui/utils/commands/add/add.mixin',
  'csui/utils/commands/compound.document/compound.document.util',
  "i18n!csui/utils/commands/nls/localized.strings"
], function (module, require, $, _, log, CommandModel, NodeModel, AddMixin, CompoundDocumentsUtil, lang) {
  'use strict';

  var config                   = module.config(),
    supportTypes               = [0, 1, 140, 144, 298, 1307, 1308, 800, 801],
    noFormTypes                = [144, 801, 1307],
      extSignatures            = [],
      extSupportTypes          = config.extSupportTypes || {},
      extNoFormTypes           = config.extNoFormTypes || {},
      extAddCommandsSignatures = config.extAddCommandSignatures || {};

  supportTypes = Array.prototype.concat.apply(supportTypes, _.values(extSupportTypes));
  noFormTypes = Array.prototype.concat.apply(noFormTypes, _.values(extNoFormTypes));
  extSignatures = Array.prototype.concat.apply(extSignatures, _.values(extAddCommandsSignatures));

  var AddCommand = CommandModel.extend({

    defaults: {
      signature: "Add"
    },

    enabled: function (status) {
      status || (status = {});
      if (status.container && status.container.get('container')) {
        //Hide the add toolbar for the type collection 298
        if (status.container.get("type") === 298 || (status.container.get("type") === 136 && !CompoundDocumentsUtil.verifyNodeAncestors(status.context))) {
          return false;
        }
        status.data || (status.data = {});
        var addableTypes = status.data.addableTypes;
        return addableTypes && _.any(supportTypes, function (type) {
          return !!addableTypes.get(type);
        });
      }
      return false;
    },

    execute: function (status, options) {
      if (options && options.addableType === undefined) {
        throw new Error('Missing options.addableType');
      }
      // the command handles multiple addable types (Content Server SubType)
      var newNode, promise,
          addableTypeName = this._getAddableTypeName(status, options);
      // if status.forwardToTable == true then tabletoolbar (the command controller) can
      // delegate the action to the table.view (used for inline forms)
      switch (options.addableType) {
      case 0: // folder
      case 298: // collection
      case 1308: // Support Asset Folder
      case 800: // Intelligent Filing Folder
        status.forwardToTable = true;
        newNode = new NodeModel({
          "type": options.addableType,
          "type_name": addableTypeName,
          "container": true,
          "name": "" // start with empty name
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;
      case 136: // compound document
        status.forwardToTable = true;
        newNode = new NodeModel({
          "type": options.addableType,
          "type_name": addableTypeName,
          "container": true,
          "name": "" // start with empty name
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;
      case 140: // url (Content Server SubType)
        status.forwardToTable = true;
        newNode = new NodeModel({
          "type": options.addableType,
          "type_name": addableTypeName,
          "container": false,
          "name": "" // start with empty name
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;
      case 1: // short-cut (Content Server SubType)
        status.forwardToTable = true;
        promise = this._selectShortcutTarget(status, options);
        break;
      case 144: // document (Content Server SubType)
      case 1307: // Support Asset
      case 801: // Document (to be filled)
        status.suppressSuccessMessage = true;
        options.actionType = 'UPLOAD';
        promise = this._selectFilesForUpload(status, options);
        break;
      default :
        promise = this._executeExtCommands(status, options);
      }
      // TODO: The add command is no actual command.  It cannot say when it
      // is finished - the node has been added.  Client which report the
      // command status show immediately success.  It should be redesigned.

      return promise;
    },

    _executeExtCommands: function(status, options) {
      var def = $.Deferred(),
          self = this;

      csui.require(['csui/utils/commands'
      ], function (commands) {
        for (var i = 0; i < extSignatures.length; i++) {
          var command = commands.get(extSignatures[i]);
          if (command.supportTypes &&
              _.indexOf(command.supportTypes, options.addableType) > -1) {
            command.execute(status, options)
              .done(def.resolve)
              .fail(def.reject);
            break;
          }
        }

        if (i === extSignatures.length){
          self.noAddCommandMessage(options)
            .fail(def.reject);
        }
      });
      return def.promise();
    },

    noAddCommandMessage: function (options) {
      var errMsg = "The \"Add\" action for the addableType " +
                   options.addableType + " is not implemented";
      log.debug(errMsg) && console.log(log.last);
      return $.Deferred().reject({
        error: errMsg,
        commandSignature: this.signature
      }).promise();
    },

    _selectShortcutTarget: function (status, options) {
      var self     = this,
          deferred = $.Deferred();
      csui.require(['csui/dialogs/node.picker/node.picker'
      ], function (NodePicker) {
        var pickerOptions   = {
              dialogTitle: lang.ShortcutPickerTitle,
              connector: status.container.connector,
              context: options.context,
              initialContainer: status.container,
              globalSearch: true,
              startLocation: 'recent.containers',
              startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
                'favorites', 'recent.containers'],
              unselectableTypes: [141, 142, 133],
              resolveShortcuts: true,
              resultOriginalNode: true
            },
            addableTypeName = self._getAddableTypeName(status, options);
        self.nodePicker = new NodePicker(pickerOptions);
        return self.nodePicker
          .show()
          .then(function (args) {
            var node = args.nodes[0];
            var newNode = new NodeModel({
              "type": 1,
              "type_name": addableTypeName,
              "container": false,
              "name": node.get('name'),
              "original_id": node.get('id'),
              // Show the right icon for this not-yet-saved node
              "original_id_expand": node.attributes
            }, {
              connector: status.container.connector,
              collection: status.collection
            });
            return newNode;
          })
          .done(function () {
            deferred.resolve.apply(deferred, arguments);
          })
          .fail(function () {
            deferred.reject.apply(deferred, arguments);
          });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  }, {

    isAddableTypeWithoutInlineForm: function (addableType) {
      return noFormTypes.indexOf( addableType) !== -1;
    }

  });

  AddMixin.mixin(AddCommand.prototype);

  return AddCommand;

});

csui.define('csui/utils/commands/add.item.metadata',["module", "require", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
  "csui/utils/log", "csui/utils/commandhelper", "csui/models/command"
], function (module, require, _, $, Backbone, log, CommandHelper, CommandModel) {

  var AddItemMetadataCommand = CommandModel.extend({

    defaults: {
      signature: "AddItemMetadata",
      command_key: "Add_Item",
      scope: "single"
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/widgets/metadata/metadata.add.item.controller'
      ], function (MetadataAddItemController) {
        var metadataAddItemController = new MetadataAddItemController();
        metadataAddItemController
            .displayForm(status, options)
            .done(function () {
              deferred.resolve.apply(deferred, arguments);
            })
            .fail(function () {
              deferred.reject.apply(deferred, arguments);
            });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  AddItemMetadataCommand.version = "1.0";

  return AddItemMetadataCommand;

});

csui.define('csui/utils/commands/add.version',[
  'module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/models/command', 'csui/utils/commandhelper',
  'csui/dialogs/file.open/file.open.dialog'
], function (module, require, $, _, lang, CommandModel, CommandHelper,
    FileOpenDialog) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    actionType: 'ADD_VERSION',
    hideWarningAlert: false
  });

  var GlobalMessage;
  var AddVersionCommand = CommandModel.extend({
    defaults: {
      signature: "AddVersion",
      command_key: "addversion",
      name: lang.CommandNameAddVersion,
      scope: "single"
    },

    execute: function (status, options) {
      status || (status = {});
      var deferred = $.Deferred(),
          self     = this;

      this.trigger('close:dialogView:form');
      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function () {
        GlobalMessage = arguments[0];
        if (GlobalMessage.isActionInProgress(config.actionType, lang.AddVersionNotAllowed, lang.CommandNameAddVersion)) {
          return deferred.resolve();
        }
        if (!!status.tableView) {
          status.tableView.lockedForOtherContols = false;
        }
        self._pickFileAndUpload(status, options).done(deferred.resolve);
        status.suppressSuccessMessage = true;
        var file = status.file;

        if (file) {
          self
              ._addVersionController(file, status)
              .done(deferred.resolve)
              .fail(deferred.reject);
        }
      });
      return deferred.promise();
    },

    _pickFileAndUpload: function (status, options) {
      var fileOpenDialog = new FileOpenDialog({multiple: false}),
          deferred       = $.Deferred(),
          self           = this;
      deferred.resolve();
      fileOpenDialog
          .listenTo(fileOpenDialog, 'add:files', function (files) {
            self._addVersionController(files[0], status)
                .done(deferred.resolve)
                .fail(deferred.reject)
                .always(function () {
                  fileOpenDialog.destroy();
                });
          })
          .show();
      return deferred.promise();
    },

    _addVersionController: function (file, status) {
      var deferred = $.Deferred();
      csui.require([
        'csui/controls/fileupload/impl/addversion.controller'
      ], function (AddVersionController) {
        var node = CommandHelper.getJustOneNode(status);
        var addVersionController = new AddVersionController({
          status: status,
          view: status.originatingView,
          selectedNode: node
        });

        return addVersionController
            .uploadFile(file, config).done(deferred.resolve);

      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise();
    },

  });

  return AddVersionCommand;
});

csui.define('csui/utils/commands/open.node.perspective',['require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (require, $, _, CommandModel, CommandHelper, lang) {
  'use strict';

  var OpenNodePerspectiveCommand = CommandModel.extend({

    execute: function (status, options) {
      var deferred = $.Deferred();
      options && options.originatingView && options.originatingView.trigger('destroy:gallery');
      csui.require(['csui/utils/contexts/factories/next.node'
      ], function (NextNodeModelFactory) {
        var context = status.context || options && options.context,
            nextNode = context.getModel(NextNodeModelFactory),
            node = CommandHelper.getJustOneNode(status);
        if (!node || !node.get('id')) {
          deferred.reject({message: lang.MissingNodeId});
          return;
        }

        var viewState = context.viewStateModel.get('state');
        if (viewState) {
          context.viewStateModel.set('state', _.omit(viewState, 'filter'), {silent: true});
        }

        // The nodestable uses this event to remove the order_by from the viewStateModel
        nextNode.trigger('before:change:id', node, options && options.originatingView);
        // If the nextNode and node are the same we will lose the id if we do unset on
        // the nextNode
        var id = node.get('id');
        nextNode.unset('id', { silent: true }).set('id', id);
        deferred.resolve();
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  return OpenNodePerspectiveCommand;

});

csui.define('csui/utils/commands/browse',['csui/utils/commands/open.node.perspective', 'csui/utils/commandhelper'
], function (OpenNodePerspectiveCommand, CommandHelper) {
  'use strict';

  var BrowseCommand = OpenNodePerspectiveCommand.extend({
    defaults: {
      signature: 'Browse',
      // The server has no concrete action for children browsing;
      // the 'default' command key has to be the first one
      // WARNING: No other command should use the 'default'/'open'
      // command key.  Always request a concrete command key from
      // your REST API developer.
      command_key: ['default', 'open', 'browse', 'Browse'],
      scope: 'single'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('container') && (
          // Some scenarios receive nodes only with the open-ability flag.
          node.get('openable')
          // Other scenarios receive nodes with permitted actions, but because
          // they are older, they do not include the open-ability flag.
          || this.checkPermittedActions(node));
    }
  });

  return BrowseCommand;
});

csui.define('csui/utils/commands/collection/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/commands/collection/nls/root/lang',{
  collectCommandSignature: 'Collect',
  addItemsToolTip: 'Add Items',
  collectItemsDialogTitle: 'Add items',
  selectCollectionDialogTitle: 'Select collection',
  selectButtonLabel: 'Add',
  selectCollectButtonLabel: 'Collect',
  conflictsItemsHeader: 'Listed items will not be added',
  conflictsDialogCloseLabel: 'Close',
  CollectItemsNoneMessage: "No items added.",
  CollectOneItemSuccessMessage: '1 new item was successfully added',
  CollectManyItemsSuccessMessage: '{0} new items were successfully added',
  CollectOneItemFailMessage: '1 of your collected items already added',
  CollectManyItemsFailMessage: '{0} of your collected items are already added',
  RemoveCollectItemsCommandConfirmDialogHtml: "<span class='msgIcon WarningIcon'>" +
                                              "<%- message %>" +
                                              "</span>",
  RemoveCommandConfirmDialogSingleMessage: 'Do you want to remove "{0}" from collection?',
  RemoveCommandConfirmDialogMultipleMessage: "Do you want to remove {0} items from collection?",
  RemoveCommandConfirmDialogTitle: "Remove from collection",
  RemoveItemsNoneMessage: "No items removed from collection.",
  RemoveOneItemSuccessMessage: "1 item successfully removed from collection.",
  RemoveSomeItemsSuccessMessage: "{0} items successfully removed from collection.",
  RemoveManyItemsSuccessMessage: "{0} items successfully removed from collection.",
  RemoveOneItemFailMessage: "1 item failed to remove from collection.",
  RemoveSomeItemsFailMessage: "{0} items failed to remove from collection.",
  RemoveManyItemsFailMessage: "{0} items failed to remove from collection.",
  RemoveSomeItemsFailMessage2: "{2} items failed to remove from collection.",
  RemoveManyItemsFailMessage2: "{2} items failed to remove from collection.",
  RemoveItems: 'Removing {0} items from collection',
  RemovingOneItem: 'Removing item from collection',
  RemovingSomeItems: 'Removing {0} items from collection',
  CollectingOneItem: 'Collecting item',
  CollectingItems: 'Collecting {0} items',
  CollectManyItemsFailMessage2: '{2} items failed to Collecting.',
  removefromCollection: "Remove from collection"
});

csui.define('csui/utils/commands/collection/collect.items',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/utils/url', 'csui/utils/command.error',
  'csui/models/command', 'i18n!csui/utils/commands/collection/nls/lang',
  'csui/utils/base', 'csui/models/nodes',
  'csui/lib/underscore.string'
], function (module, require, _, $, Backbone, Url, CommandError, CommandModel,
    lang, base, NodeCollection) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 3
  });

  var GlobalMessage, TaskQueue, UploadFileCollection, PageLeavingBlocker,
      NextNodeModelFactory, CollectionConflictView,
      CollectCommand = CommandModel.extend({
        defaults: {
          signature: 'CollectionCanCollect',
          name: lang.addItemsToolTip,
          command_key: ['collectionCanCollect'],
          scope: 'single',
          successMessages: {
            formatForOne: lang.CollectOneItemSuccessMessage,
            formatForTwo: lang.CollectManyItemsSuccessMessage,
            formatForMany: lang.CollectManyItemsSuccessMessage,
            formatForFive: lang.CollectManyItemsSuccessMessage
          },
          errorMessages: {
            formatForOne: lang.CollectOneItemFailMessage,
            formatForTwo: lang.CollectManyItemsFailMessage,
            formatForMany: lang.CollectManyItemsFailMessage,
            formatForFive: lang.CollectManyItemsFailMessage
          }
        },

        enabled: function (status) {
          var enableCollectionCanCollect = false;
          if (status.container.get('type') === 298) {
            status.nodes = new NodeCollection([status.container]);

            enableCollectionCanCollect = CollectCommand.__super__.enabled.apply(this, arguments);

            // front-end workaround as there is no support from REST-API side (LPAD-94582).
            // "workaround": if the current container is asking for "collect" command along with
            // 'collectioncancollect' in REST API request, then if there is no 'collect' action
            // is returned in the REST API response for the current user, let's not enable this
            // 'collectioncancollect' command as well.
            if (enableCollectionCanCollect) {
              var commands = status.container.commands;
              if (commands &&
                  (commands.indexOf('Collect') > 0 || commands.indexOf('collect') > 0)) {
                enableCollectionCanCollect = !!(status.container.actions.get('Collect') ||
                                                status.container.actions.get('collect'));
              }
            }

          }
          return enableCollectionCanCollect;
        },

        execute: function (status, options) {
          var deferred = $.Deferred(),
              self     = this;

          csui.require(['csui/controls/globalmessage/globalmessage',
            'csui/controls/conflict.resolver/impl/collection.conflicts/collection.conflicts.view',
            'csui/utils/taskqueue',
            'csui/models/fileuploads', 'csui/utils/page.leaving.blocker',
            'csui/utils/contexts/factories/next.node'
          ], function () {
            GlobalMessage = arguments[0];
            CollectionConflictView = arguments[1];
            TaskQueue = arguments[2];
            UploadFileCollection = arguments[3];
            PageLeavingBlocker = arguments[4];
            NextNodeModelFactory = arguments[5];
            self._addToCollection(status, options)
                .done(function (selectedOptions) {
                  var selectedNodes    = selectedOptions.nodes,
                      nodes            = _.map(selectedNodes, function (node) {
                        return {
                          name: node.get('name'),
                          state: 'pending',
                          count: 0,
                          total: 1,
                          node: node
                        };
                      }),
                      targetFolder     = status.container,
                      uploadCollection = new UploadFileCollection(nodes, {connector: connector}),
                      connector        = status.container && status.container.connector;
                  status.container.collection = status.collection;
                  self._announceOperationStart(status);
                  uploadCollection.each(function (fileUpload) {
                    var node = fileUpload.get('node');
                    fileUpload.node = node;
                    fileUpload.unset('node');
                    fileUpload.set('mime_type', node.get('mime_type'));
                  });

                  self._addSelectedNodesToCollection(uploadCollection, connector, targetFolder,
                      status.collection)
                      .then(function (promises) {
                        GlobalMessage.hideFileUploadProgress();
                        var result = self._checkPromises(promises);
                        if (result.failedNodes.length) {
                          self._showDialog(result.failedNodes).then(
                              function (resolveOption, dialog) {
                                dialog.kill();
                                //if any success items are there then show global message
                                if (result.successNodes.length) {
                                  self._showGlobalMessage(result.successNodes.length);
                                }
                              });

                        } else if (result.successNodes.length) {
                          self._showGlobalMessage(result.successNodes.length);
                        }
                      });
                  self._announceOperationEnd(status);
                  deferred.resolve();
                })
                .fail(function (error) {
                  if (error && !error.cancelled) {
                    self.showError(error);
                  }
                  deferred.reject();
                });
          });
          return deferred.promise();
        },

        _addToCollection: function (status, options) {
          var self     = this,
              deferred = $.Deferred();

          csui.require(['csui/dialogs/node.picker/node.picker'],
              function (NodePicker) {
                var pickerOptions = _.extend({
                  selectableTypes: [],
                  showAllTypes: true,
                  orderBy: 'type asc',
                  dialogTitle: lang.collectItemsDialogTitle,
                  selectButtonLabel: lang.selectButtonLabel,
                  globalSearch: true,
                  selectMultiple: true,
                  context: options ? options.context : status.context,
                  startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
                    'favorites', 'recent.containers'],
                  resolveShortcuts: true
                }, status);

                self.nodePicker = new NodePicker(pickerOptions);

                self.nodePicker
                    .show()
                    .done(function () {
                      deferred.resolve.apply(deferred, arguments);
                    })
                    .fail(function () {
                      deferred.reject.apply(deferred, arguments);
                    });
              }, function (error) {
                deferred.reject(error);
              });
          return deferred.promise();
        },

        _addSelectedNodesToCollection: function (uploadCollection, connector, targetFolder,
            targetCollection) {
          var self     = this,
              queue    = new TaskQueue({
                parallelism: config.parallelism
              }),
              count    = 0,
              promises = _.map(uploadCollection.models, function (model) {
                var deferred = $.Deferred();
                queue.pending.add({
                  worker: function () {
                    var node     = model.node,
                        node_id  = node.get('id'),
                        targetId = targetFolder.get('id');
                    self._collectNode(connector, targetId, node_id)
                        .done(function () {
                          // self._addToCurrentTable(model, targetCollection);
                          model.set('count', 1);
                          model.deferred.resolve(model);
                          self._addToCurrentTable(model.node, targetCollection, targetId);
                          deferred.resolve(model);
                        })
                        .fail(function (cause) {
                          deferred.resolve(model);
                        });
                    return deferred.promise();
                  }
                });
                count++;
                return deferred.promise(promises);  // return promises
              });
          GlobalMessage.showFileUploadProgress(uploadCollection, {
            oneFileTitle: lang.CollectingOneItem,
            oneFileSuccess: lang.CollectOneItemSuccessMessage,
            multiFileSuccess: lang.CollectManyItemsSuccessMessage,
            oneFilePending: lang.CollectingOneItem,
            multiFilePending: lang.CollectingItems,
            oneFileFailure: lang.CollectOneItemFailMessage,
            multiFileFailure: lang.CollectManyItemsFailMessage2,
            someFileSuccess: lang.CollectManyItemsSuccessMessage,
            someFilePending: lang.CollectingItems,
            someFileFailure: lang.CollectManyItemsFailMessage2,
            enableCancel: false
          });

          return $.whenAll.apply($, promises);
        },

        _collectNode: function (connector, targetFolderID, node_id) {
          var deferred = $.Deferred();
          var nodeAttr = {
            "collection_id": targetFolderID
          };

          var collectOptions = {
            url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/' + node_id),
            type: 'PUT',
            data: nodeAttr,
            contentType: 'application/x-www-form-urlencoded'
          };

          connector.makeAjaxCall(collectOptions).done(function (resp) {
            deferred.resolve(resp);

          }).fail(function (resp) {
            deferred.reject(resp);
          });
          return deferred.promise();
        },

        _getListView: function (conflictFiles) {
          var retVal = new CollectionConflictView(_.extend({}, {collection: conflictFiles}));
          return retVal;
        },

        _showDialog: function (conflictFiles) {
          var deferred = $.Deferred(),
              buttons  = [{
                id: 'close',
                close: true,
                label: lang.conflictsDialogCloseLabel,
                toolTip: lang.conflictsDialogCloseLabel,
                click: function (args) {
                  deferred.resolve('close', args.dialog);
                }
              }];
          this._showConflictDialog(conflictFiles, buttons);
          return deferred;
        },

        _showConflictDialog: function (collection, buttons) {
          var self     = this,
              deferred = $.Deferred();
          csui.require(['csui/controls/dialog/dialog.view'], function (DialogView) {
            var failureMessage = base.formatMessage(collection.length, self.get("errorMessages")),
                dialog         = new DialogView({
                  title: failureMessage,
                  midSize: true,
                  iconLeft: 'csui-icon-notification-information',
                  className: "csui-collection-conflicts-dialog",
                  view: self._getListView(collection),
                  buttons: buttons
                });
            dialog.show();
            return dialog;
          });

        },

        _checkPromises: function (promises) {
          if (!_.isArray(promises)) {
            promises = [promises];
          }

          var successPromises = new Backbone.Collection(),
              failedPromises  = new Backbone.Collection();

          _.each(promises, function (prom) {
            if (prom !== undefined) {
              if (!prom.cancelled) {
                if (prom.get("count") === undefined) {
                  //which is not resolved or rejected
                } else if (prom.get("count")) {
                  successPromises.push(prom);
                }
                else {
                  failedPromises.push(prom);
                }
              }
            }
          });

          return {
            successNodes: successPromises,
            failedNodes: failedPromises
          };
        },

        _addToCurrentTable: function (collectItem, targetCollection, targetId) {
          collectItem.refernce_id = targetId;
          collectItem.fetch({collection: targetCollection})
              .then(function () {
                var clonedCollectItem = collectItem.clone();
                clonedCollectItem.isLocallyCreated = true;
                targetCollection.unshift(clonedCollectItem);
              });
        },

        _showGlobalMessage: function (successCount) {
          var successMessage = base.formatMessage(successCount, this.get("successMessages"));
          GlobalMessage.showMessage("success", successMessage);
        },
        _announceOperationStart: function (status) {
          var originatingView = status.originatingView;
          if (originatingView.blockActions) {
            originatingView.blockActions();
          }
          PageLeavingBlocker.enable(this.get('pageLeavingWarning'));
        },

        _announceOperationEnd: function (status) {
          PageLeavingBlocker.disable();
          var originatingView = status.originatingView;
          if (originatingView.unblockActions) {
            originatingView.unblockActions();
          }
        }
      });

  return CollectCommand;
});

csui.define('csui/utils/commands/multiple.items',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/base', 'csui/utils/commandhelper', 'csui/utils/command.error'
], function (module, require, _, $, base, CommandHelper, CommandError) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 3
  });

  // Dependencies initialized during execution
  var PageLeavingBlocker;

  var MultipleItemsCommand = {

    execute: function (status, options) {
      // avoid messages from handleExecutionResults
      // we use our own evaluation here and show message
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;

      return this._performActions(status, options);
    },

    _performActions: function (status, options) {
      var deferred = $.Deferred(),
          self = this,
          promises;
      csui.require(['csui/utils/taskqueue', 'csui/utils/page.leaving.blocker'
      ], function (TaskQueue) {
        PageLeavingBlocker = arguments[1];
        options = options || {};
        if (!options.context) {
          options.context = status.context;
        }
        self._announceStart(status);
        var nodes = CommandHelper.getAtLeastOneNode(status),
            queue = new TaskQueue({
              parallelism: options.parallelism || config.parallelism
            });

        promises = nodes.map(function (node, index) {
          var deferred = $.Deferred();
          queue.pending.add({
            worker: function () {
              self._performAction(node, options)
                  .done(deferred.resolve)
                  .fail(function(error){
                    deferred.reject(error);
                  });
              return deferred.promise();
            }
          });
          return deferred.promise();
        });

        // return a promise that has an array with results of original promises
        $.whenAll
            .apply($, promises)
            .always(_.bind(self._announceFinish, self, status))
            .done(function () {
              if(!status.suppressMultipleSuccessMessage) {
                self.showSuccess(promises);
              }
              deferred.resolve.apply(deferred, arguments);      // pass the original arguments to handler, so that events are triggered
            })
            .fail(function () {
              if(!status.suppressMultipleFailMessage) {
                self.showError(promises);
              }
              deferred.reject.apply(deferred, arguments);      // pass the original arguments to handler, so that events are triggered
            });

      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    showError: function(promises) {
      var errorMessage,
          successMessage;

      var checkResult = this._checkPromises(promises);
      if(checkResult) {
        var countFailed = checkResult.countFailed;
        var countOk = checkResult.countOk;

        errorMessage = this._getErrorMessage(countFailed);

        var msg;
        if(countOk > 0) {
          successMessage = this._getSuccessMessage(countOk);
          msg = successMessage + " " + errorMessage;
        } else {
          msg = errorMessage;
        }

        csui.require([
          'csui/controls/globalmessage/globalmessage'
        ], function (GlobalMessage) {
          GlobalMessage.showMessage("error", msg, undefined, {});
        });
      }
    },

    showSuccess: function(promises) {
      var successMessage;

      var checkResult = this._checkPromises(promises);
      if (checkResult) {
        var countOk = checkResult.countOk;

        successMessage = this._getSuccessMessage(countOk);

        csui.require([
          'csui/controls/globalmessage/globalmessage'
        ], function (GlobalMessage) {
          GlobalMessage.showMessage("success", successMessage, undefined, {});
        });
      }
    },

    showSuccessWithLink: function(promises, msgOptions) {
      var successMessage;

      var checkResult = this._checkPromises(promises);
      if (checkResult) {
        var countOk = checkResult.countOk;

        successMessage = this._getSuccessMessage(countOk);

        csui.require([
          'csui/controls/globalmessage/globalmessage'
        ], function (GlobalMessage) {
          GlobalMessage.showMessage("success_with_link", successMessage, undefined, msgOptions);
        });
      }
    },

    // helper
    _getErrorMessage: function(cnt) {
      var emessages = this.get("errorMessages");
      var errorMessage = base.formatMessage(cnt, emessages);

      return errorMessage;
    },

    // helper
    _getSuccessMessage: function(cnt) {
      var smessages = this.get("successMessages");
      var successMessage = base.formatMessage(cnt, smessages);

      return successMessage;
    },

    // Analyzes the given promises and returns a result object with:
    // {
    //   countOk: okCnt,
    //   countFailed: failedCnt
    // }
    //
    _checkPromises: function(promises) {
      if (!_.isArray(promises)) {
        promises = [promises];
      }

      var okCnt = 0;
      var failedCnt = 0;

      // At this point all promises from all commands must either be resolved or rejected.
      _.each(promises, function (prom) {
        if (prom !== undefined) {
          // an error or a node can be cancelled, skip it from counting.
          // pressing "cancel" button may result in object with cancelled flag set.
          if (!prom.cancelled) {
            if (prom instanceof CommandError) {
              failedCnt++;
            } else if (typeof prom.state !== 'undefined' && typeof prom.state === 'function') {
              // if state exists, evaluate it
              if (prom.state() && prom.state().toLowerCase() === 'resolved') {
                okCnt++;
              } else {
                failedCnt++;
              }
            } else {
              // some model or anything else
              okCnt++;
            }
          }
        }
      });

      return {
        countOk: okCnt,
        countFailed: failedCnt
      };
    },

    _setViewStateModelMultiItemOperationStatus: function (context, started) {
      var viewStateModel = context && context.viewStateModel;
      viewStateModel && viewStateModel.set('multiItemOperationRunning', started);
    },

    _announceStart: function (status) {
     if(!status.deleteBlockAction){
        var originatingView = status.originatingView;
        if (originatingView && originatingView.blockActions) {
          originatingView.blockActions();
        }
        var pageLeavingWarning = this.get('pageLeavingWarning');
        if (pageLeavingWarning) {
          PageLeavingBlocker.enable(pageLeavingWarning);
        }
      }
      this._setViewStateModelMultiItemOperationStatus(status.context, true);
    },

    _announceFinish: function (status) {
      this._setViewStateModelMultiItemOperationStatus(status.context, false);

      if (this.get('pageLeavingWarning')) {
        PageLeavingBlocker.disable();
      }
      var originatingView = status.originatingView;
      if (originatingView && originatingView.unblockActions) {
        originatingView.unblockActions();
      }
    }

  };

  return MultipleItemsCommand;

});

csui.define('csui/utils/commands/confirmable',['csui/lib/underscore', 'csui/lib/jquery',
  'require', 'csui/utils/commands/multiple.items'
], function (_, $, require, MultipleItemsCommand) {

  var ConfirmableCommand = {

    execute: function (status, options) {
      var self = this;
      return this
          ._confirmAction(status, options)
          .then(function () {
            return self._performActions(status, options);
          }, function (error) {
            return $.Deferred().reject().promise();
          });
    },

    _confirmAction: function (status, options) {
      var deferred = $.Deferred();

      if (this._getConfirmTemplate) {
        var data = this._getConfirmData(status, options),
            // FIXME: Use text instead of HTML template
            html = this._getConfirmTemplate(status, options)(data);
        csui.require(['csui/dialogs/modal.alert/modal.alert'], _.bind(function (alertDialog) {

          // apply custom buttons and labels if any, from respective views.
          var buttons = _.isFunction(this._getButtons) ? this._getButtons() : {};

          alertDialog.confirmQuestion($(html).text(), data.title, buttons)
              .done(function (arg) {
                deferred.resolve(arg);
              })
              .fail(function (arg) {
                deferred.reject(arg);
              });
        }, this));

      }
      else {
        deferred.resolve();
      }
      return deferred.promise();
    }

  };

  _.extend(ConfirmableCommand, _.omit(MultipleItemsCommand, 'execute'));

  return ConfirmableCommand;

});

csui.define('csui/utils/commands/collection/remove.collected.items',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper', 'csui/utils/url',
  'i18n!csui/utils/commands/collection/nls/lang',
  'csui/utils/commands/confirmable', 'csui/utils/commands/multiple.items',
  'csui/utils/command.error'
], function (module, require, _, $, CommandModel, CommandHelper, Url, lang,
    ConfirmableCommand, MultipleItemsCommand, CommandError) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 1
  });

  var GlobalMessage;

  var RemoveCollectionItemsCommand = CommandModel.extend({
    defaults: {
      signature: 'RemoveCollectedItems',
      command_key: 'removefromcollection',
      name: lang.removefromCollection,
      pageLeavingWarning: lang.DeletePageLeavingWarning,
      scope: 'multiple',
      successMessages: {
        formatForNone: lang.RemoveItemsNoneMessage,
        formatForOne: lang.RemoveOneItemSuccessMessage,
        formatForTwo: lang.RemoveSomeItemsSuccessMessage,
        formatForFive: lang.RemoveManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.RemoveItemsNoneMessage,
        formatForOne: lang.RemoveOneItemFailMessage,
        formatForTwo: lang.RemoveSomeItemsFailMessage,
        formatForFive: lang.RemoveManyItemsFailMessage
      }
    },


    allowCollectionRefetch: false,

    _getConfirmTemplate: function (status, options) {
      return _.template(lang.RemoveCollectItemsCommandConfirmDialogHtml);
    },

    _getConfirmData: function (status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var msg = (nodes.length === 1 ?
                 _.str.sformat(lang.RemoveCommandConfirmDialogSingleMessage,
                     nodes.at(0).get('name')) :
                 _.str.sformat(lang.RemoveCommandConfirmDialogMultipleMessage,
                     nodes.length) );
      return {
        title: lang.RemoveCommandConfirmDialogTitle,
        message: msg
      };
    },

    _performAction: function (model, options) {
      var node                = model.node,
          d                   = $.Deferred(),
          nodeAttr            = {
            "collection_id": options.container.get("id"),
            "operation": "remove"
          },
          connector           = options.container.connector,
          containerCollection = options.containerCollection,

          collectOptions      = {
            url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/' + node.get("id")),
            type: 'PUT',
            data: nodeAttr,
            contentType: 'application/x-www-form-urlencoded'
          },

          jqxhr               = connector.makeAjaxCall(collectOptions).done(function (resp) {
            model.set('count', 1);
            containerCollection.remove(node);
            model.deferred.resolve(model);
            d.resolve(model);
          }).fail(function (error) {
            var commandError = error ? new CommandError(error, model) :
                               error;
            model.deferred.reject(model, commandError);
            if (!error) {
              jqxhr.abort();
            }
            d.reject(commandError);
          });

      return d.promise();
    },

    startGlobalMessage: function (uploadCollection) {
      GlobalMessage.showFileUploadProgress(uploadCollection, {
        oneFileTitle: lang.RemovingOneItem,
        oneFileSuccess: lang.RemoveOneItemSuccessMessage,
        multiFileSuccess: lang.RemoveManyItemsSuccessMessage,
        oneFilePending: lang.RemovingOneItem,
        multiFilePending: lang.RemoveItems,
        oneFileFailure: lang.RemoveOneItemFailMessage,
        multiFileFailure: lang.RemoveManyItemsFailMessage2,
        someFileSuccess: lang.RemoveSomeItemsSuccessMessage,
        someFilePending: lang.RemovingSomeItems,
        someFileFailure: lang.RemoveSomeItemsFailMessage2,
        enableCancel: false
      });
    }

  });

  _.extend(RemoveCollectionItemsCommand.prototype, ConfirmableCommand, {
    execute: function (status, options) {
      var deferred = $.Deferred(),
          self     = this;

      // avoid messages from handleExecutionResults
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;

      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function (localGlobalMessage) {
        GlobalMessage = localGlobalMessage;
        self._executeRemoveCollectionItems(status, options)
            .then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },

    _executeRemoveCollectionItems: function (status, options) {
      var self = this;
      options || (options = {});
      var nodes       = CommandHelper.getAtLeastOneNode(status),
          node        = nodes.length === 1 && nodes.first(),
          deferred    = $.Deferred(),
          commandData = status.data || {},
          context     = status.context || options.context;

      options.parallelism || (options.parallelism = config.parallelism);

      var showProgressDialog = commandData.showProgressDialog != null ?
                               commandData.showProgressDialog : true;

      ConfirmableCommand.execute.apply(this, arguments)
          .done(function (results) {
            if (showProgressDialog) {
              GlobalMessage.hideFileUploadProgress();
            }
            // For mobile we refresh last page in order to retrieve pushed
            // up items after a delete.
            if (options.infiniteScroll) {
              status.collection.fetch({
                reset: false,
                remove: false,
                merge: true
              });
            }
            //to refetch collection in table View
            self.allowCollectionRefetch = true;
            deferred.resolve(results);
          })
          .fail(function (args) {
            //only return a result if there is at least one successful delete.
            //This way the waiting CommandHelper in the tabletoolbar.view will trigger
            //an execute complete event.
            var oneSuccess = args && _.find(args, function (result) {
                  return !(result instanceof CommandError);
                });
            var rejectResults = oneSuccess ? oneSuccess : args;
            deferred.reject(rejectResults);
          });

      return deferred.promise();
    },

    _performActions: function (status, options) {
      options || (options = {});
      var self               = this,
          deferred           = $.Deferred(),
          commandData        = status.data || {},
          showProgressDialog = commandData.showProgressDialog != null ?
                               commandData.showProgressDialog : true;

      options.container || (options.container = status.container);
      options.containerCollection = status.collection;
      csui.require(['csui/models/fileuploads'
      ], function (UploadFileCollection) {
        var models = status.nodes.models;
        var nodes = _.map(models, function (node) {
          return {
            name: node.get('name'),
            state: 'pending',
            count: 0,
            total: 1,
            node: node
          };
        });
        var connector = models && models[0] && models[0].connector;
        var uploadCollection = new UploadFileCollection(nodes, {connector: connector});
        var newStatus = _.defaults({nodes: uploadCollection}, status);
        uploadCollection.each(function (fileUpload) {
          // Replace the new node in the file upload model with the existing
          // one to be able to destroy it; sync and destroy events will be
          // triggered on it and the parent collection and view will see them.
          var node = fileUpload.get('node');
          fileUpload.node = node;
          fileUpload.unset('node');
          fileUpload.set('mime_type', node.get('mime_type'));

        });

        if (showProgressDialog) {
          self.startGlobalMessage(uploadCollection);
        }

        // do not display our result messages in _performActions
        newStatus.suppressMultipleSuccessMessage = true;
        newStatus.suppressMultipleFailMessage = true;

        MultipleItemsCommand._performActions.call(self, newStatus, options)
            .done(function (results) {
              if (showProgressDialog) {
                GlobalMessage.hideFileUploadProgress();
              }
              self.showSuccess(results);
              deferred.resolve(results);
            })
            .fail(function (errors) {
              if (!showProgressDialog) {
                self.showError(errors);
              }
              return deferred.reject(errors);
            });
      }, deferred.reject);
      return deferred.promise();
    }
  });

  return RemoveCollectionItemsCommand;
});

/**
 *
 * This command shouldn't be used directly, this command is only for `copy` and `move`.
 * `copy` and `move` commands should extend this parent command and must provide the required information.
 * This parent command contains the common API for both `copy` and `move` actions.
 *
 **/

csui.define('csui/utils/commands/copy.move',[
  'module', 'require', 'csui/lib/underscore', "csui/utils/base",
  'csui/lib/jquery', 'csui/utils/log', 'csui/utils/url',
  'i18n!csui/utils/commands/nls/localized.strings', 'csui/models/command',
  'csui/utils/commandhelper',
  'csui/utils/commands/multiple.items'
], function (module, require, _, base, $, log, Url, lang, CommandModel, CommandHelper,
    MultipleItemsCommand) {
  'use strict';

  // Dependencies loaded in the execute method first
  var GlobalMessage, ConflictResolver,
      ApplyPropertiesSelectorView, UploadFileCollection, PageLeavingBlocker, nodeLinks,actionType, ApplicationScope;

  // create a helper parent where we can derive from and do additional function modifications
  var CommandParent = CommandModel.extend({
    constructor: function (options) {
      CommandModel.prototype.constructor.call(this, options);
    }
  });
  _.extend(CommandParent.prototype, MultipleItemsCommand);     // apply needed mixin

  var CopyMoveCommand = CommandParent.extend({
    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      var labels = self.get('labels');
      actionType = self.get('command');
      // avoid messages from handleExecutionResults
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      csui.require([
        'csui/controls/globalmessage/globalmessage',
        'csui/controls/conflict.resolver/conflict.resolver',
        'csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view',
        'csui/models/fileuploads', 'csui/utils/page.leaving.blocker',
        'csui/utils/node.links/node.links',
        'csui/utils/contexts/factories/application.scope.factory'
      ], function () {
        GlobalMessage = arguments[0];
        ConflictResolver = arguments[1];
        ApplyPropertiesSelectorView = arguments[2];
        UploadFileCollection = arguments[3];
        PageLeavingBlocker = arguments[4];
        nodeLinks = arguments[5];
        ApplicationScope = arguments[6];
        if (GlobalMessage.isActionInProgress(actionType, labels.titleNotAllowed,
                labels.commandTitle)) {
          return deferred.resolve();
        }
        self._selectActionOptions(status, options, labels)
            .done(function (selectedOptions) {
              var selectedNodes = status.nodes;
              var targetFolder = selectedOptions.nodes[0];
              var applyProperties = selectedOptions.applyProperties;
              var bundleNumber = new Date().getTime();

              // note: in some scenarios such as expanded tile, the status.container is undefined
              var copyToCurrentFolder = status.container ?
                                        (targetFolder.get('id') === status.container.get('id')) :
                                        false;

              self._announceOperationStart(status);

              var namesToResolve = selectedNodes.map(function (node) {
                var returnObj = {
                  id: node.get('id'),
                  name: node.get('name'),
                  container: node.get('container'),
                  mime_type: node.get('mime_type'),
                  original_id: node.get('original_id'),
                  original: node.original,
                  type: node.get('type'),
                  size: node.get('size'),
                  type_name: node.get('type_name'),
                  state: 'pending',
                  count: 0,
                  total: 1,
                  enableCancel: false,
                  bundleNumber: bundleNumber
                };
                var type = node.get('type');
                if (type === 144 || type === 749 || type === 736 || type === 30309) {
                  returnObj.size_formatted = node.get('size_formatted');
                } else if (type === 140) {
                  returnObj.url = node.get('url');
                }
                returnObj.actions = node.actions;
                returnObj.targetLocation = {
                  id: targetFolder.get('id'),
                  url: nodeLinks.getUrl(targetFolder)
                };
                var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
                if (mlDataEnabled) {
                  returnObj.multilingual_provided = true,
                  !!node.has("name_multilingual") &&
                  (returnObj.name_multilingual = node.get("name_multilingual"));
                  !!node.has("description_multilingual") &&
                  (returnObj.description_multilingual = node.get("description_multilingual"));
                }
                return returnObj;
              });
              var actionNamesToResolve = _.map(namesToResolve, function (name) {
                return _.clone(name);
              });
              self._resolveNamingConflicts(targetFolder, actionNamesToResolve, labels)
                  .done(function (actionInstructions) {

                    _.each(actionInstructions, function (instruction) {
                      if (instruction.id === undefined) {
                        instruction.id = _.findWhere(namesToResolve,
                            {name: instruction.name}).id;
                      }
                    });

                    self._metadataHandling(actionInstructions, labels,
                        _.extend(selectedOptions, {context: context, targetFolder: targetFolder}))
                        .done(function () {
                          // TODO: Make the progressbar a reusable component; do not
                          // misuse the file-upload-progressbar for other scenarios.
                          // TODO: Handle this in the multi-item command to be consistent
                          // with other commands; do not override the delete command only.
                          var uploadCollection = new UploadFileCollection(actionInstructions, {
                            container: targetFolder ? targetFolder.clone() : undefined
                          });
                          // Replace the new node in the file upload model with the existing
                          // one to be able to destroy it; sync and destroy events will be
                          // triggered on it and the parent collection and view will see them.
                          if (labels.commandName === lang.CommandNameMove) {
                            uploadCollection.each(function (model) {
                              model.node = selectedNodes.findWhere({
                                id: model.get('id')
                              });
                            });
                          } else {
                            uploadCollection.each(function (model) {
                              var sourceNode = selectedNodes.findWhere({
                                id: model.get('id')
                              });
                              model.node.set(_.omit(sourceNode.attributes, 'id'));
                            });

                          }

                          // note: in some scenarios such as expanded tile, the status.container is undefined
                          var connector = status.container && status.container.connector;
                          if (connector === undefined) {
                            var aNode = CommandHelper.getAtLeastOneNode(status).first();
                            aNode && (connector = aNode.connector);
                          }
                          var applicationScope = status.originatingView && status.originatingView.context && status.originatingView.context.getModel(ApplicationScope);
                          var opts = {
                                uploadCollection: uploadCollection,
                                connector: connector,
                                targetFolder: targetFolder,
                                applyProperties: applyProperties,
                                status: status,
                                context: context,
                                copyToCurrentFolder: copyToCurrentFolder,
                                collection: status.collection,
                                applicationScopeId : applicationScope && applicationScope.id
                              };
                          self._doActionSelectedNodes(opts)
                              .done(function () {
                                deferred.resolve(self._doPostExecute(opts));
                              }).always(function () {
                                self._announceOperationEnd(status);
                                (labels.commandName === lang.CommandNameMove) &&
                                opts.context.trigger('current:folder:changed');
                              }).fail(function () {
                                // Returning nothing prevents the common error message
                                // from being shown.
                                deferred.reject();
                              });

                        })
                        .fail(function () {
                          self._announceOperationEnd(status);
                          deferred.reject();
                        });

                  })
                  .fail(function (error) {
                    // resolve namingConflicts
                    if (error && error.userAction && error.userAction ===
                                                     "cancelResolveNamingConflicts") {
                      self.trigger("resolve:naming:conflicts:cancelled");
                    } else if (error && !error.cancelled) {  // if not undefined (cancel) then display error
                      self.showError(error);
                    }
                    self._announceOperationEnd(status);
                    deferred.reject();
                  });
            })
            .fail(function (error) {
              if (error && !error.cancelled) { // if not undefined (cancel) then display error
                self.showError(error);
              }
              deferred.reject();
            });

      }, deferred.reject);          // require

      return deferred.promise();    // return empty promise!
    },

    _announceOperationStart: function (status) {
      var originatingView = status.originatingView;
      if (originatingView.blockActions) {
        originatingView.blockActions();
      }
      PageLeavingBlocker.enable(this.get('pageLeavingWarning'));
    },

    _announceOperationEnd: function (status) {
      PageLeavingBlocker.disable();
      this._unblockPageActions(status);
    },

    _unblockPageActions: function(status) {
       var originatingView = status.originatingView;
       originatingView.unblockActions && originatingView.unblockActions();
    },

    _selectActionOptions: function (status, options, labels) {
      var self = this;
      var deferred = $.Deferred();

      csui.require(['csui/dialogs/node.picker/node.picker'],
          function (NodePicker) {
            //account for a copy command coming from a folders context menu.
            // note: in some scenarios such as expanded tile, the status.container is undefined
            var contextMenuCopy = status.container ?
                                  (status.container.get('id') ===
                                   status.nodes.models[0].get('id')) : false;
            var numNodes = status.nodes.length;
            var dialogTitle = _.str.sformat(
                numNodes > 1 ? labels.dialogTitle : labels.dialogTitleSingle, numNodes);
            var pickerOptions = _.extend({
              command: actionType,
              selectableTypes: [-1],
              unselectableTypes: [899],
              addableTypes: [0], // Allowing folders to add from picker. Revisit when LPAD-61637 done.
              showAllTypes: true,
              orderBy: 'type asc',
              dialogTitle: dialogTitle,
              initialContainer: status.container || status.nodes.models[0].parent,
              initialSelection: status.nodes,
              startLocation: contextMenuCopy ? 'recent.containers' : '',
              includeCombineProperties: (numNodes === 1),
              propertiesSeletor: true,
              globalSearch: true,
              disableSearchFromHere: true,
              context: options ? options.context : status.context,
              startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
                'favorites', 'recent.containers'],
              resolveShortcuts: true,
              resultOriginalNode: true,
              includeResources: ['show_hidden']
            }, status);

            self.nodePicker = new NodePicker(pickerOptions);
            self.originatingView = status.originatingView;
            self.nodePicker
                .show()
                .done(function () {
                  deferred.resolve.apply(deferred, arguments);
                })
                .fail(function () {
                  deferred.reject.apply(deferred, arguments);
                });
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    },

    _resolveNamingConflicts: function (targetFolder, nodeNames, labels) {
      var h1 = (nodeNames.length === 1) ? labels.actionNode :
               _.str.sformat(labels.actionName, nodeNames.length);
      var conflictResolver = new ConflictResolver({
        h1Label: h1,
        actionBtnLabel: labels.commandName,
        excludeAddVersion: true,
        container: targetFolder,
        files: nodeNames,
        originatingView: this.originatingView
      });
      return conflictResolver.run();
    },

    _metadataHandling: function (items, labels, options) {
      var deferred = $.Deferred();
      this.originatingView && this.originatingView._blockingCounter === 0 &&
      this.originatingView.blockActions();
      csui.require(['csui/widgets/metadata/metadata.copy.move.items.controller'
      ], function (MetadataCopyMoveItemsController) {
        var openMetadata = options.openSelectedProperties;
        var applyProperties = options.applyProperties;
        var metadataController = new MetadataCopyMoveItemsController();
        var controllerFunction;

        // open the metadata view
        if (openMetadata) {
          controllerFunction = metadataController.CopyMoveItemsWithMetadata;
        } else if (applyProperties === ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES ||
                   applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES) {
          // check for required metadata
          controllerFunction = metadataController.CopyMoveItemsRequiredMetadata;
        } else {
          return deferred.resolve();
        }

        if (applyProperties === ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES) {
          options.inheritance = 'original';
        } else if (applyProperties === ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES) {
          options.inheritance = 'destination';
        } else if (applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES) {
          options.inheritance = 'merged';
        }

        options.action = actionType;
        controllerFunction.call(metadataController, items, options)
            .done(function () {
              deferred.resolve();
            })
            .fail(function (error) {
              deferred.reject(error);
            });

      }, function (error) {
        log.warn('Failed to load MetadataCopyMoveItemsController. {0}', error)
        && console.warn(log.last);
        deferred.reject(error);
      });

      return deferred.promise();
    },

    _addToCurrentTable: function (node, targetCollection) {
      node.isLocallyCreated = true;
      node.fetch({collection: targetCollection})
          .then(function () {
            targetCollection.unshift(node);
          });
    },
    checkMultilingualInfo : function (instruction, params) {
        if (!!instruction.multilingual_provided) {
            _.extend(params, {
                name_multilingual: instruction.name_multilingual
            });
            instruction.description_multilingual &&  _.extend(params, {
              description_multilingual: instruction.description_multilingual
          });
        }
    }
  });

  return CopyMoveCommand;
});
  
csui.define('csui/utils/commands/copy',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commands/copy.move',
  'csui/utils/command.error'
], function (module, require, _, $, lang, ActionModel, CommandError) {
  'use strict';

  var config = _.extend({}, module.config());

  _.defaults(config, {
    actionType: 'copy',
    parallelism: 3,
    allowMultipleInstances: true
  });


  // create helper parent
  var CopyCommand = ActionModel.extend({
    defaults: {
      signature: "Copy",
      command_key: ['copy', 'Copy'],
      name: lang.CommandNameCopy,
      verb: lang.CommandVerbCopy,
      pageLeavingWarning: lang.CopyPageLeavingWarning,
      allowMultipleInstances: config.allowMultipleInstances,
      scope: "multiple",
      successMessages: {
        formatForNone: lang.CopyItemsNoneMessage,
        formatForOne: lang.CopyOneItemSuccessMessage,
        formatForTwo: lang.CopySomeItemsSuccessMessage,
        formatForFive: lang.CopyManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.CopyItemsNoneMessage,
        formatForOne: lang.CopyOneItemFailMessage,
        formatForTwo: lang.CopySomeItemsFailMessage,
        formatForFive: lang.CopyManyItemsFailMessage
      },
      labels: {
        actionName: lang.CopyingNodes,
        actionNode: lang.CopyingNode,
        commandTitle: lang.CommandTitleCopy,
        commandName: lang.CommandNameCopy,
        dialogTitle: lang.DialogTitleCopy,
        dialogTitleSingle: lang.DialogTitleSingleCopy,
        titleNotAllowed: lang.CopyNotAllowed
      },
      command: config.actionType

    },

    _doActionSelectedNodes: function (opts) {
      var exResult = $.Deferred();
      csui.require(['csui/utils/contexts/factories/next.node',
            'csui/controls/globalmessage/globalmessage', 'csui/utils/taskqueue'],
          _.bind(function (NextNodeModelFactory, GlobalMessage, TaskQueue) {
            var self     = this,
                queue    = new TaskQueue({
                  parallelism: config.parallelism
                }),
                promises = _.map(opts.uploadCollection.models, function (model) {
                  var deferred = $.Deferred();
                  queue.pending.add({
                    worker: function () {
                      var attributes = model.attributes,
                          targetId   = opts.targetFolder.get('id');

                      self._getCategories(attributes, opts.connector, targetId,
                          opts.applyProperties)
                          .done(function (categories) {
                            self._copyNode(categories, attributes, opts.connector, targetId,
                                model.node)
                                .done(function () {
                                  model.set('count', 1);
                                  model.deferred.resolve(model);
                                  opts.copyToCurrentFolder &&
                                  self._addToCurrentTable(model.node, opts.collection);
                                  deferred.resolve(attributes);
                                })
                                .fail(function (cause) {
                                  var errMsg = new CommandError(cause);
                                  model.deferred.reject(model, errMsg);
                                  deferred.reject(errMsg);
                                });
                          })
                          .fail(function (cause) {
                            var errMsg = new CommandError(cause);
                            model.deferred.reject(model, errMsg);
                            deferred.reject(errMsg);
                          });
                      return deferred.promise();
                    }
                  });
                  return deferred.promise(promises);      // return promises
                });

            GlobalMessage.showProgressPanel(opts.uploadCollection, {
              oneFileTitle: lang.CopyingOneItem,
              oneFileSuccess: lang.CopyOneItemSuccessMessage,
              multiFileSuccess: lang.CopyManyItemsSuccessMessage,
              oneFilePending: lang.CopyingOneItem,
              multiFilePending: lang.CopyItems,
              multiFileOneFailure: lang.CopyManyItemsOneFailMessage,
              oneFileFailure: lang.CopyOneItemFailMessage,
              multiFileFailure: lang.CopyManyItemsFailMessage,
              someFileSuccess: lang.CopySomeItemsSuccessMessage,
              someFilePending: lang.CopySomeItems,
              someFileFailure: lang.CopySomeItemsFailMessage2,
              locationLabelPending: lang.CopyingLocationLabel,
              locationLabelCompleted: lang.CopiedLocationLabel,
              enableCancel: false,
              actionType: config.actionType,
              allowMultipleInstances: config.allowMultipleInstances,
              context: opts.context,
              nextNodeModelFactory: NextNodeModelFactory
            });

            this._unblockPageActions(opts.status);
            return $.whenAll.apply($, promises).then(exResult.resolve, exResult.reject);

          }, this), exResult.reject);
      return exResult.promise();
    },

    _doPostExecute: function (opts) {
      var targetNodeIncurrentCollection;
      if (opts.status.collection && opts.status.originatingView &&
          opts.status.originatingView.findNodeFromCollection) {
        targetNodeIncurrentCollection = opts.status.originatingView.findNodeFromCollection(
            opts.status.collection, opts.targetFolder);
      } else if (opts.status.collection) {
        targetNodeIncurrentCollection = opts.status.collection.get(
            opts.targetFolder.get('id')) ||
                                        opts.status.collection.findWhere({
                                          id: opts.targetFolder.get('id')
                                        });
      }
      !opts.copyToCurrentFolder && targetNodeIncurrentCollection &&
      targetNodeIncurrentCollection.fetch();
      return opts.uploadCollection;

    },
    _copyNode: function (categories, instruction, connector, targetFolderID, node) {
      var nodeAttr = {
        "original_id": instruction.id,
        "parent_id": targetFolderID,
        "name": instruction.newName ? instruction.newName : instruction.name,
        "roles": categories
      };
      _.extend(nodeAttr, instruction.extended_data);
      _.isFunction(this.checkMultilingualInfo) && this.checkMultilingualInfo(instruction, nodeAttr);
      // FileUploadModel should be created with a container or connector
      // to make its node cloneable.  But if not needed, use the default
      // container of the upload controller to provide the connector.
      if (!node.connector) {
        connector.assignTo(node);
      }

      return node.save(undefined, {
        data: nodeAttr,
        url: connector.connection.url + '/nodes'
      });
    },

    _getCategories: function (attributes, connector, targetFolderID, applyProperties) {
      var deferred = $.Deferred(),
          self     = this;
      if (attributes.extended_data && attributes.extended_data.roles) {
        deferred.resolve(attributes.extended_data.roles);
      } else if (!!applyProperties && applyProperties === 1) { // keep the original categories.
        deferred.resolve({});
      } else {
        var getCategoriesOptions = {
          url: connector.connection.url + '/forms/nodes/copy?' +
               $.param({
                 id: attributes.id,
                 parent_id: targetFolderID
               })
        };

        connector.makeAjaxCall(getCategoriesOptions)
            .then(function (response) {
              var form = response.forms[1],
                  data = form && form.data || {};
              var categoryGroupMapping;
              categoryGroupMapping = {};
              csui.require(['csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view'],
                function (ApplyPropertiesSelectorView) {
                  categoryGroupMapping[ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES] = 'original';
                  categoryGroupMapping[ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES] = 'destination';
                  categoryGroupMapping[ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES] = 'merged';
                  var categories = data[categoryGroupMapping[applyProperties]];
                  deferred.resolve({ "categories": categories });
                });
            })
            .fail(function (error) {
              deferred.reject(error);
            });
      }
      return deferred.promise();
    }
  });
  return CopyCommand;
});

csui.define('csui/utils/routing',['module', 'csui/lib/underscore'
], function (module, _) {
  'use strict';

  var developmentPage = module.config().developmentPage;
  // TODO: Deprecate and remove configurability for the two muodules.
  readOldSettings('csui/pages/start/perspective.routing');
  readOldSettings('csui/pages/start/impl/perspective.router');

  function readOldSettings(moduleName) {
    if (developmentPage === undefined) {
      var oldConfig = window.csui.requirejs.s.contexts._.config
        .config[moduleName] || {};
      developmentPage = oldConfig.developmentPage;
    }
  }

  return {
    routesWithSlashes: function () {
      // Append the client application paths to the "server" page path, when
      // we run on the server; append the client application paths in back of
      // the hash, when we run on a development HTML page
      return /\/app(?:\/.*)?$/.test(location.pathname) || !developmentPage;
    }  
  };
});


csui.define('csui/utils/node.links/node.links',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'csui/utils/routing',
  // Load and register external node link rules
  'csui-ext!csui/utils/node.links/node.links'
], function (_, Backbone, Url, RulesMatchingMixin, routing, rules) {
  'use strict';

  var routesWithSlashes = routing.routesWithSlashes();

  var NodeLinkModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      url: null
    },

    constructor: function NodeLinkModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(NodeLinkModel.prototype);

  var NodeLinkCollection = Backbone.Collection.extend({
    model: NodeLinkModel,
    comparator: 'sequence',

    constructor: function NodeLinkCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    getUrl: function (node, options) {
      // Make the URLs point to the original node, if the current node is
      // a shortcut; leave generation point to itself for now, until
      // we support it properly
      var type = node.get('type');
      if (type === 1 && node.original && node.original.get('id') > 0) {
        node = node.original;
      }
      var rule = this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
      if (rule) {
        var url = rule.get('getUrl')(node, options);
        return this.completeUrl(node, url, options);
      }
    },

    completeUrl: function (node, url, options) {
      if (!url) {
        return location.href;
      }

      var connector = node.connector || options && options.connector;
      var serverUrl = new Url(connector && connector.connection.url ||
                              location.href);
      var absoluteUrl = serverUrl.makeAbsoluteUrl(url, this._getApplicationUrlPrefix(serverUrl));      
      var context = options && options.context,
          viewStateModel = context && context.viewStateModel,
          currentRouter = viewStateModel && viewStateModel.get('activeRouterInstance'),
          urlParams = currentRouter && currentRouter.nextNode &&
                      currentRouter.nextNode.get('id') === node.get('id') && currentRouter.buildUrlParams();
      if (urlParams) {
        absoluteUrl += '?' + urlParams;
      }
      return absoluteUrl;
    },

    _getApplicationUrlPrefix: function (serverUrl) {
      return this.getHomeUrl(serverUrl);
    },

    getHomeUrl: function (serverUrl) {

      // Application URLs start after '#' on the development pages, while
      // on the actual server they are merged with the main access point
      var applicationUrlPrefix;
      if (routesWithSlashes) {
        applicationUrlPrefix = Url.combine(serverUrl.getCgiScript(), '/app/');
      } else {
        // Robustness for FF browser returning string 'null' instead of 'file://' in location.origin.
        var origin = (location.origin && location.origin.indexOf('://') > 0) ? location.origin : new Url(location.href).getOrigin();
        applicationUrlPrefix = origin + location.pathname +
                               location.search + '#';
      }
      return applicationUrlPrefix;
    }
  });

  var nodeLinks = new NodeLinkCollection();

  if (rules) {
    nodeLinks.add(_.flatten(rules, true));
  }

  return nodeLinks;
});

csui.define('csui/utils/commands/copy.link',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command','csui/utils/commandhelper',
  'csui/utils/node.links/node.links',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel,
    CommandHelper, NodeLinks, lang) {
  'use strict';

  var config = _.extend({}, module.config());

  var CopyLinkCommand = CommandModel.extend({
    defaults: {
      signature: 'CopyLink',
      name: lang.CommandNameCopyLink
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return !!node;
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          node     = CommandHelper.getJustOneNode(status),
          urlOptions = {context: status.context},
          nodeLink = status.url ? NodeLinks.completeUrl(node, status.url, urlOptions) : NodeLinks.getUrl(node, urlOptions),
          success  = this._copyToClipboard(nodeLink);
      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        if (success) {
          deferred.resolve();
          GlobalMessage.showMessage('success', lang.CopyLinkSuccessMessage);
        } else {
          deferred.reject();
          GlobalMessage.showMessage('error', lang.CopyLinkFailMessage);
        }
      }, deferred.reject);
      return deferred.promise();
    },

    _copyToClipboard: function (nodeLink) {
      if (window.clipboardData) { /*Workaround for IE*/
        window.clipboardData.setData('Text', nodeLink);
        return true;
      } else {
        /* Create a fake text node in body, select it by creating a range, trigger copy command,
         remove fake text node*/
        var success  = false,
            element  = document.createTextNode(nodeLink),
            elParent = document.createElement('span');
        //Set styles for span, so that text node doesn't use widget styles
        elParent.style.color = 'black';
        elParent.style.background = 'tranparent';
        elParent.style.backgroundColor = 'white';

        elParent.appendChild(element);
        document.body.appendChild(elParent);
        if (window.getSelection) { // moz, opera, webkit, ie11
          var selection = window.getSelection();
          selection.removeAllRanges();
          var range = document.createRange();
          range.selectNodeContents(element);
          selection.addRange(range);
          success = document.execCommand("copy");
          selection.removeAllRanges();
        }
        document.body.removeChild(elParent);
        return success;
      }
    }
  });

  return CopyLinkCommand;
});

//TODO Check if this should be moved to pman 
csui.define('csui/models/perspective/perspective.model',["module", 'csui/lib/underscore', "csui/lib/backbone",
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  "csui/utils/log", "csui/utils/base", 'csui/utils/url'
], function (module, _, Backbone, UploadableMixin, ConnectableMixin, log,
    base, Url) {
  "use strict";

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var PerspectiveModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    constructor: function PerspectiveModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = _.pick(options, ['connector']);
      this.makeUploadable(options)
          .makeConnectable(options);
    },

    getPerspectiveId: function() {
      return this.get('id');
    },

    getPerspective: function () {
      return this.get('perspective');
    },

    setPerspective: function (attributes, options) {
      this.set('perspective', attributes, options);
    },

    update: function (changes) {
      this.set.apply(this, arguments);
    },

    isNew: function () {
      return !this.get('id') || this.get('id') === 0;
    },

    urlBase: function () {
      var id  = this.get('id'),
          url = this.connector.connection.url;
      if (!id) {
        // Create a new node by POST /perspectives
        url = Url.combine(url, 'perspectives');
      } else if (!_.isNumber(id) || id > 0) {
        // Access an existing node by VERB /perspectives/:id
        url = Url.combine(url, 'perspectives', id);
      } else {
        throw new Error('Unsupported id value');
      }
      return url;
    },

    url: function () {
      var url = this.urlBase();
      return url;
    },

    prepareFormData: function (data, options) {
      return {pData: JSON.stringify(data)};
    }
  });

  UploadableMixin.mixin(PerspectiveModel.prototype);
  ConnectableMixin.mixin(PerspectiveModel.prototype);

  return PerspectiveModel;

});
csui.define('csui/utils/commands/create.perspective',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper', 'csui/utils/url',
  'csui/models/perspective/perspective.model',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel, CommandHelper,
    Url, PerspectiveModel, lang) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/contexts/perspective'] || {};
  config = _.extend({
    enableInlinePerspectiveEditing: true
  }, config, module.config());

  var ConnectorFactory, NodeModelFactory, AncestorCollectionFactory;

  var CreatePerspectiveCommand = CommandModel.extend({

    defaults: {
      signature: 'CreatePerspective',
      name: lang.CreatePerspective
    },

    enabled: function (status, options) {
      var context    = status.context || options && options.context,
          attributes = context.perspective.attributes;
      if (attributes.id === undefined && attributes.canEditPerspective &&
          context._applicationScope.attributes.id === "node") {
        return true;
      }
      return false;
    },

    execute: function (status, options) {
      var context         = status.context || options && options.context,
          isInlineEditing = (options && options.inlinePerspectiveEditing) ||
                            config.enableInlinePerspectiveEditing;
      if (isInlineEditing) {
        // Edit perspective of page inline in SmartUI
        return this._editInline(status, options, context);
      } else {
        // Navigate to class Perspective Management console
        return this._editInClassicPMan(status, options, context);
      }
    },

    /**
     * Prepare new perspective config required for current node since no perspective is configured yet.
     */
    _preparePerspectiveConfig: function (context) {
      var perspectiveConfig = {
            "perspective": {
              "type": "flow",
              "options": {
                "widgets": [
                  {
                    "type": "csui/widgets/nodestable"
                  }
                ]
              }
            },
            "overrideType": "genericContainer",
            "scope": "local",
            "containerType": "-1",
            "cascading": "false"
          },
          node              = CommandHelper.getJustOneNode(status) ||
                              context.getModel(NodeModelFactory),
          collection        = context.getCollection(AncestorCollectionFactory);
      perspectiveConfig.nodepath = this._getNodePath(collection);
      perspectiveConfig.node = node.get('id');
      perspectiveConfig.containerType = node.get('type');
      perspectiveConfig.title = node.get('name');
      return perspectiveConfig;
    },

    _editInline: function (status, options, context) {
      var deferred = $.Deferred(), self = this;
      csui.require(['csui/utils/contexts/factories/node',
        'csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/ancestors',
        'csui/perspective.manage/pman.view'
      ], function () {
        NodeModelFactory = arguments[0];
        ConnectorFactory = arguments[1];
        AncestorCollectionFactory = arguments[2];
        var PManView          = arguments[3],
            // Create new perspective
            perspectiveConfig = self._preparePerspectiveConfig(context, NodeModelFactory,
                AncestorCollectionFactory);
        // Append current timestamp to avoid name conflicts in perspective volume
        perspectiveConfig.title = perspectiveConfig.title + ' ' + new Date().getTime();
        var perspective = new PerspectiveModel(perspectiveConfig,
            {connector: context.getObject(ConnectorFactory)});
        var pmanView = new PManView({
          context: context,
          perspective: perspective
        });
        pmanView.show();
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },

    _editInClassicPMan: function (status, options, context) {
      var deferred = $.Deferred(), self = this;
      csui.require(['csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/node',
        'csui/utils/contexts/factories/ancestors'
      ], function () {
        ConnectorFactory = arguments[0];
        NodeModelFactory = arguments[1];
        AncestorCollectionFactory = arguments[2];
        var f = self._getForm(context, status);
        f.submit();
        f.remove();
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },

    _getForm: function (context, status) {
      var f = $("<form target='_blank' method='POST' style='display:none;'></form>").attr({
        action: this._getUrl(context, status)
      }).appendTo(document.body);

      var params = this._getUrlQueryParameters(context, status);

      for (var i in params) {
        if (params.hasOwnProperty(i)) {
          $('<input type="hidden" />').attr({
            name: i,
            value: params[i]
          }).appendTo(f);
        }
      }

      return f;
    },

    _getUrl: function (context, status) {
      var connector      = context.getObject(ConnectorFactory),
          cgiUrl         = new Url(connector.connection.url).getCgiScript(),
          perspectiveUrl = cgiUrl.toString() + "/perspectivemgr";

      return perspectiveUrl;
    },

    _getUrlQueryParameters: function (context, status) {
      var perspectiveConfig = this._preparePerspectiveConfig(context, NodeModelFactory,
          AncestorCollectionFactory);
      perspectiveConfig.ui = {
        "elements": {
          "btn-mode-code": true,
          "btn-view-general": true,
          "btn-view-rules": false,
          "btn-view-layout": true,
          "btn-view-widgets": true,

          "view-perspective-action": true,
          "perspective-action-create": true,
          "perspective-action-edit": true,
          "perspective-action-copy": true,

          "view-perspective-form": true,
          "perspective-title": true,
          "perspective-type": true,
          "perspective-scope": true,
          "perspective-nodetypes": true,
          "perspective-node": true,
          "perspective-cascading": true,

          "display-size-msg": false,
          "rules-code": true,

          "layout-flow": true,
          "layout-left-center-right": true,
          "layout-grid": false,
          "layout-tabbed": false
        },
        "widgetGroupsBlacklist": [],
        "widgetsWhitelist": [],
        "disableGrouping": false
      };
      return {
        config: JSON.stringify(perspectiveConfig)
      };
    },

    _getNodePath: function (collection) {
      var nodepath = "";
      collection.each(function (model) {
        nodepath += nodepath ? ':' : '';
        nodepath += model.get('name');
      });
      return nodepath;
    }

  });

  return CreatePerspectiveCommand;
});

csui.define('csui/utils/commands/node',['csui/lib/underscore', 'csui/models/command',
  'csui/utils/commands/multiple.items'
], function (_, CommandModel, MultipleItemsCommand) {

  var NodeCommand = CommandModel.extend({

    _performAction: function (node, options) {
      throw new Error('Method not implemented in the descendant command.');
    }

  });

  _.extend(NodeCommand.prototype, MultipleItemsCommand);

  return NodeCommand;

});

csui.define('csui/utils/commands/delete',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/log', 'csui/utils/commandhelper', 'csui/utils/commands/node',
  'csui/utils/commands/multiple.items', 'csui/utils/commands/confirmable',
  'csui/utils/command.error'
], function (module, require, _, $, lang, log, CommandHelper, NodeCommand,
    MultipleItemsCommand, ConfirmableCommand, CommandError) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 1,
    actionType: 'DELETE',
    allowMultipleInstances: true,
    deleteSelfHandler: null
  });

  var UploadFileCollection, NextNodeModelFactory, GlobalMessage;

  var DeleteCommand = NodeCommand.extend({
    defaults: {
      signature: 'Delete',
      command_key: ['delete', 'Delete'],
      name: lang.CommandNameDelete,
      verb: lang.CommandVerbDelete,
      pageLeavingWarning: lang.DeletePageLeavingWarning,
      allowMultipleInstances: config.allowMultipleInstances,
      scope: 'multiple',
      successMessages: {
        formatForNone: lang.DeleteItemsNoneMessage,
        formatForOne: lang.DeleteOneItemSuccessMessage,
        formatForTwo: lang.DeleteSomeItemsSuccessMessage,
        formatForFive: lang.DeleteManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.DeleteItemsNoneMessage,
        formatForOne: lang.DeleteOneItemFailMessage,
        formatForTwo: lang.DeleteSomeItemsFailMessage,
        formatForFive: lang.DeleteManyItemsFailMessage
      }
    },

    allowCollectionRefetch: false,

    _getConfirmTemplate: function (status, options) {
      return _.template(lang.DeleteCommandConfirmDialogHtml);
    },

    _getConfirmData: function (status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var msg = (nodes.length === 1 ?
                 _.str.sformat(lang.DeleteCommandConfirmDialogSingleMessage,
                     nodes.at(0).get('name')) :
                 _.str.sformat(lang.DeleteCommandConfirmDialogMultipleMessage,
                     nodes.length));
      return {
        title: lang.DeleteCommandConfirmDialogTitle,
        message: msg
      };
    },

    _getButtons: function () {
      var buttons = {
        'buttons': {
          labelYes: lang.DeleteButtonLabel,
          labelNo: lang.DialogBtnCancel
        }
      };

      return buttons;
    },

    // Perform the delete action. Return a promise, which is resolved with the deleted node if
    // successful or rejected with the error.
    // Note, that the node is used later to display the name of the deleted item.
    _performAction: function (model, options) {
      var node = model.node;
      var d = $.Deferred();
      node.trigger('before:delete', node);
      var jqxhr = node.destroy({
            wait: true
          })
          .done(function () {
            node.trigger('delete', node);
            model.set('count', 1);
            model.deferred.resolve(model);
            d.resolve(node);
          })
          .fail(function (error) {
            var commandError = error ? new CommandError(error, node) :
                               error;
            model.deferred.reject(model, commandError);
            if (!error) {
              jqxhr.abort();
            }
            d.reject(commandError);
          });

      var originatingView = options.originatingView;
      if (originatingView && originatingView.unblockActions) {
        originatingView.unblockActions();
      }

      return d.promise();
    },

    // keep in sync with versions/delete.js
    startGlobalMessage: function (uploadCollection, options) {
      /* GlobalMessage.showFileUploadProgress(uploadCollection, {
        oneFileTitle: isVersionModel ? versionLang.DeletingOneVersion : lang.DeletingOneFile,
        oneFileSuccess: isVersionModel ? versionLang.DeleteVersionOneItemSuccessMessage : lang.DeleteOneItemSuccessMessage,
        multiFileSuccess: isVersionModel ? versionLang.DeleteVersionManyItemsSuccessMessage : lang.DeleteManyItemsSuccessMessage,
        oneFilePending: isVersionModel ? versionLang.DeletingOneVersion : lang.DeletingOneFile,
        multiFilePending: isVersionModel ? versionLang.DeleteVersions : lang.DeleteFiles,
        oneFileFailure: isVersionModel ? versionLang.DeleteVersionOneItemFailMessage : lang.DeleteOneItemFailMessage,
        multiFileFailure: isVersionModel ? versionLang.DeleteVersionManyItemsFailMessage2 : lang.DeleteManyItemsFailMessage2,
        someFileSuccess: isVersionModel ? versionLang.DeleteVersionSomeItemsSuccessMessage : lang.DeleteSomeItemsSuccessMessage,
        someFilePending: isVersionModel ? versionLang.DeletingSomeVersions : lang.DeletingSomeFiles,
        someFileFailure: isVersionModel ? versionLang.DeleteVersionSomeItemsFailMessage2 : lang.DeleteSomeItemsFailMessage2,
        enableCancel: false
      }); */
      GlobalMessage.showProgressPanel(uploadCollection, {
        oneFileTitle: lang.DeletingOneItem,
        oneFileSuccess: lang.DeleteOneItemSuccessMessage,
        multiFileSuccess: lang.DeleteManyItemsSuccessMessage,
        oneFilePending: lang.DeletingOneItem,
        multiFilePending: lang.DeleteItems,
        multiFileOneFailure: lang.DeleteManyItemsOneFailMessage,
        oneFileFailure: lang.DeleteOneItemFailMessage,
        multiFileFailure: lang.DeleteManyItemsFailMessage,
        someFileSuccess: lang.DeleteSomeItemsSuccessMessage,
        someFilePending: lang.DeletingSomeItems,
        someFileFailure: lang.DeleteSomeItemsFailMessage,
        enableCancel: false,
        originatingView: options.originatingView,
        locationLabelPending: lang.deletingLocationLabel,
        locationLabelCompleted: lang.deletedLocationLabel,
        allowMultipleInstances: config.allowMultipleInstances,
        actionType: config.actionType
      });
    }
  });

  _.extend(DeleteCommand.prototype, ConfirmableCommand, {
    execute: function (status, options) {
      var deferred = $.Deferred(),
          self     = this;

      // avoid messages from handleExecutionResults (must be set here and not in any async
      // callbacks, because it is used in the calling code immediately after calling execute)
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      status.deleteBlockAction = true;

      csui.require([
        'csui/models/fileuploads',
        'csui/utils/contexts/factories/next.node',
        'csui/controls/globalmessage/globalmessage'
      ], function (localUploadFileCollection, localNextNodeModelFactory,
          localGlobalMessage) {
        UploadFileCollection = localUploadFileCollection;
        NextNodeModelFactory = localNextNodeModelFactory;
        GlobalMessage = localGlobalMessage;
        if (GlobalMessage.isActionInProgress(config.actionType, lang.DeleteNotAllowed,
                lang.CommandTitleDelete)) {
          return deferred.resolve();
        }
        self._executeDelete(status, options)
            .then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },

    _executeDelete: function (status, options) {
      var self = this;
      options || (options = {});
      var nodes    = CommandHelper.getAtLeastOneNode(status),
          node     = nodes.length === 1 && nodes.first(),
          deferred = $.Deferred(),
          context  = status.context || options.context;

      options.parallelism || (options.parallelism = config.parallelism);
      options.originatingView = status.originatingView;

      // Do not use 'apply' with 'arguments' array because the 'options' parameter that is
      // undefined and locally set will not be passed on with the locally set value.
      // Use 'call' with parameters list.
      ConfirmableCommand.execute.call(this, status, options)
          .done(function (results) {

            // If the current container is deleted, open its parent
            if (node && node === status.container) {
              var handlerModule = config.deleteSelfHandler ||
                                  'csui/utils/commands/delete/delete.self.handler';
              require([handlerModule], function (handler) {
                handler(node, _.extend({}, status, options));
                deferred.resolve();
              }, deferred.reject);
            }
            // For mobile we refresh last page in order to retrieve pushed
            // up items after a delete.
            else if (options.infiniteScroll) {
              status.collection.fetch({
                reset: false,
                remove: false,
                merge: true
              });
            }
            //to refetch collection in table View
            self.allowCollectionRefetch = true;
            deferred.resolve(results);
          })
          .fail(function (args) {
            //only return a result if there is at least one successful delete.
            //This way the waiting CommandHelper in the tabletoolbar.view will trigger
            //an execute complete event.
            var oneSuccess = args && _.find(args, function (result) {
                  return !(result instanceof CommandError);
                });
            var rejectResults = oneSuccess ? oneSuccess : args;
            deferred.reject(rejectResults);
          });

      return deferred.promise();
    },

    _performActions: function (status, options) {
      var self               = this,
          deferred           = $.Deferred(),
          commandData        = status.data || {},
          showProgressDialog = commandData.showProgressDialog != null ?
                               commandData.showProgressDialog : true,
          models             = status.nodes.models;
      var nodes = _.map(models, function (node) {
        return {
          name: node.get('name'),
          state: 'pending',
          count: 0,
          total: 1,
          node: node
        };
      });
      var connector = models && models[0] && models[0].connector;
      var uploadCollection = new UploadFileCollection(nodes, {
        connector: connector,
        container: status.container ? status.container.clone() : undefined
      });
      var newStatus = _.defaults({nodes: uploadCollection}, status);
      var bundleNumber = new Date().getTime();
      // TODO: Make the progressbar a reusable component; do not
      // misuse the file-upload-progressbar for other scenarios.
      // TODO: Handle this in the multi-item command to be consistent
      // with other commands; do not override the delete command only.
      uploadCollection.each(function (fileUpload) {
        // Replace the new node in the file upload model with the existing
        // one to be able to destroy it; sync and destroy events will be
        // triggered on it and the parent collection and view will see them.
        var node = fileUpload.get('node');
        fileUpload.node = node;
        fileUpload.unset('node');
        fileUpload.set('bundleNumber', bundleNumber);
        fileUpload.set('mime_type', node.get('mime_type'));

      });

      // var isVersionModel = uploadCollection.models[0].node instanceof VersionModel;
      if (showProgressDialog) {
        this.startGlobalMessage(uploadCollection, options);
      }

      var originatingView = status.originatingView;
      if (originatingView && originatingView.unblockActions) {
        originatingView.unblockActions();
      }

      // do not display our result messages in _performActions
      newStatus.suppressMultipleSuccessMessage = true;
      newStatus.suppressMultipleFailMessage = true;

      MultipleItemsCommand._performActions.call(this, newStatus, options)
          .done(function (results) {
            deferred.resolve(results);
          })
          .fail(function (errors) {
            if (!showProgressDialog) {
              self.showError(errors);
            }
            return deferred.reject(errors);
          });
      return deferred.promise();
    }
  });

  return DeleteCommand;
});

csui.define( 'csui/utils/commands/delete/delete.self.handler',[
  "csui/lib/jquery", "csui/lib/underscore"
], function ($, _) {

  function goBackToFolder(id, context) {
    var viewStateModel = context.viewStateModel;
    if (viewStateModel) {
      var historyEntry = viewStateModel.getLastHistoryEntry();
      if (historyEntry && historyEntry.fragment === 'nodes/' + id) {
        viewStateModel.restoreLastFragment();
        return true;
      }
    }
  }

  return function (node, options) {
    var context = options && options.context;
    if (context && context.hasModel('nextNode')) {
      var nextNode = context.getModel('nextNode');
      var parent = node.get('parent_id');

      if (parent) {
        var id = parent.id || parent;
        if (!goBackToFolder(id, context)) {
          // if we can't go back then go forward. The next command will add entry to the viewStateModel history
          nextNode.set('id', id);
        }
      }
    }
  };
});


csui.define('csui/utils/commands/preview.plugins/preview.plugins',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'csui-ext!csui/utils/commands/preview.plugins/preview.plugins'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var PreviewPluginModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      plugin: null
    },

    constructor: function OpenPluginModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(PreviewPluginModel.prototype);

  var PreviewPluginCollection = Backbone.Collection.extend({
    model: PreviewPluginModel,
    comparator: 'sequence',

    constructor: function PreviewPluginCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByNode: function (node, options) {
      var rule = this.find(function (item) {
        return item.matchRules(node, item.attributes, options);
      });
      return rule && rule.get('plugin');
    }
  });

  var previewPlugins = new PreviewPluginCollection();

  if (rules) {
    previewPlugins.add(_
      .chain(rules)
      .flatten(true)
      .map(function (rule) {
        return _.defaults({
          plugin: new rule.plugin()
        }, rule);
      })
      .value());
  }

  return previewPlugins;
});

csui.define('csui/utils/commands/doc.preview',[
  'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper',
  'csui/utils/commands/preview.plugins/preview.plugins',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (require, _, $, CommandModel, CommandHelper, previewPlugins, lang) {
  'use strict';

  var commandData = {
    includeContainers: true,
    ifNotOpenDelegate: true,
    fullView: false
  };

  var DocPreviewCommand = CommandModel.extend({
    defaults: {
      signature: 'DocPreview',
      command_key: ['docpreview', 'DocPreview'],
      scope: 'multiple',
      name: lang.DocumentPreview
    },

    delegatableOpenCommand: 'OpenDocument',

    enabled: function (status, options) {
      var disablePreview = status.originatingView && status.originatingView.disablePreview;
      if (disablePreview) {
        return false;
      }

      var nodes = CommandHelper.getAtLeastOneNode(status),
          valid = true;

      // check each selected node, if at least one failed to preview, return false.
      if (nodes && nodes.length) {
        nodes.each(_.bind(function (node) {
          var validateCurrentNode = valid && this._validateCurrentNode(node, status, options);
          if (!validateCurrentNode) {
            valid = false;
          }
        }, this));
      } else {
        valid = false;
      }

      return valid;
    },

    _getData: function (status) {
      var data    = status && status.data ? status.data : {},
          cmdData = _.defaults(data, commandData);
      return cmdData;
    },

    _validateCurrentNode: function (node, status, options) {

      var context = status.context || options && options.context,
          plugin  = previewPlugins.findByNode(node, {context: context}),
          cmdData = this._getData(status);

      if (!plugin) {
        return false;
      }

      // if the current toolbar item's command data want to skip doc preview command for containers, then return
      // false.
      if (!cmdData.includeContainers && !!node.get('container')) {
        return false;
      }

      // get custom validateNode from plugin, if not available execute default validateNode.
      var validateNode = plugin.validateNode || this.validateNode;

      if (!validateNode(node, status)) {
        return false;
      }

      // TODO: Is it better to implement ifNotOpenDelegate and ifNotDefaultAction
      // in the command controller instead of in each command like this?
      var isOpenDelegate = cmdData && cmdData.ifNotOpenDelegate &&
                           getOpenDelegateSignature(this, status, options) ===
                           this.get('signature');
      if (isOpenDelegate) {
        return false;
      }
      return true;
    },

    /**
     * By default, this command should not be enabled for all viewers.
     *
     * @param node
     * @param status
     * @returns {boolean}
     */
    validateNode: function (node, status) {
      return false;
    },

    execute: function (status, options) {
      var nodes           = CommandHelper.getAtLeastOneNode(status),
          context         = status.context || options && options.context,
          originatingView = status.originatingView || options.originatingView,
          cmdData         = this._getData(status),
          fullViewMode    = (cmdData && cmdData.fullView) || (options && options.fullView) ||
                            (status.originatingView && status.originatingView.previewInFullMode);

      if (fullViewMode) {
        var nodez      = nodes.models[0],
            pluginz    = previewPlugins.findByNode(nodez, {context: context}),
            WidgetView = pluginz.widgetView;

        var deferred = $.Deferred();
        csui.require([
          'csui/utils/commands/impl/full.page.modal/full.page.modal.view',
          WidgetView
        ], function (FullPageModal, widgetView) {
          var viewerView    = new widgetView({
                context: context,
                model: nodez
              }),
              fullPageModal = new FullPageModal({
                view: viewerView
              });
          fullPageModal.on('destroy', function () {
                deferred.resolve();
              })
              .show();

          // set the focus on the first tool item in viewer's toolbar.
          fullPageModal.$el.on('shown.binf.modal', function () {
            var firstBtn = $(fullPageModal.$el.find('button')[0]);
            firstBtn && firstBtn.trigger('focus');
          });

        }, deferred.reject);
        return deferred.promise();

      } else {

        originatingView = originatingView.options && originatingView.options.originatingView ||
                          originatingView;

        // obtain first node from the selected nodes
        // if items selected from the current page only, then it renders the first document in the
        // current list, if items selected from previous or next pages, then either first item in
        // the current page select or if none of the items from the current page is selected, then
        // considers the first item from the selected nodes.
        var selectedNodes = originatingView.collection && originatingView.collection.length ?
                            _.filter(originatingView.collection.models, function (model) {
                              var id = model.get('id');
                              if (nodes.find(id)) {
                                return model;
                              }
                            }) : nodes.models[0],
            firstNode     = selectedNodes.length ?
                            _.intersection(originatingView.collection.models, nodes.models)[0] :
                            nodes.models[0];
        // null check if first node is undefined
        firstNode = !firstNode ? nodes.models[0] : firstNode;

        // if side panel is already opened then pass the new node to existing side panel.
        if (!!originatingView.ensureSidePanel ||
            ( this.docPreviewView && !!this.docPreviewView.openSidePanel)) {
          this.docPreviewView.trigger('open:new:doc:preview', firstNode, originatingView);
        } else {
          originatingView.ensureSidePanel = true;
          var plugin = previewPlugins.findByNode(firstNode, {context: context});

          this._openInSidepanel(firstNode, plugin, originatingView, context);
        }

        return $.Deferred().resolve().promise();
      }
    },

    /**
     * This method opens the side panel, and integrate `docpreview.view` inside side panel as
     * content view.
     *
     * @param status
     * @param node
     * @param context
     * @private
     */
    _openInSidepanel: function (node, plugin, originatingView, context) {
      var self = this;
      csui.require([
        'csui/controls/side.panel/side.panel.view',
        'csui/controls/doc.preview/doc.preview.view'
      ], function (SidePanelView, DocumentPreviewView) {
        var documentPreviewView = new DocumentPreviewView({
              model: node,
              plugin: plugin,
              originatingView: originatingView,
              context: context,
              resizableWrapperClass: '.csui-sidepanel-container'
            }),
            sidePanelView       = new SidePanelView({
              slides: [{
                content: documentPreviewView
              }],
              sidePanelClassName: 'csui-sidepanel-doc-preview',
              layout: {header: false, footer: false, mask: false, resize: true, size: 'medium'},
              contentView: documentPreviewView,
              thresholdWidth: 95,
              context: context,
              keyboard: false
            });

        sidePanelView.show();
        documentPreviewView.openSidePanel = true;
        self.docPreviewView = documentPreviewView;
        /**
         * This anonymous function cleans side panel view created as part of this action by
         * listening it's integrated view's `before:destroy` event.
         */
        var viewStateModel = context.viewStateModel,
            cleanup        = function () {
              sidePanelView.stopListening(viewStateModel,
                  'change:' + viewStateModel.CONSTANTS.STATE);
              // as side panel is going to destroy, reset `ensureSidePanel` to false.
              originatingView.ensureSidePanel = false;
              documentPreviewView.openSidePanel = false;
              // remove highlighted rows if any...
              $('.csui-doc-preview-state').removeClass('csui-doc-preview-state');
              self.docPreviewView.trigger("destroy");
              self.docPreviewView = undefined;
              // hide and destroy side panel view.
              sidePanelView.hide();
              sidePanelView.destroy();
              // Inform the originating view that current document preview has been closed.
              originatingView && originatingView.trigger('doc:preview:closed');
            };

        sidePanelView.listenTo(documentPreviewView, 'before:destroy', cleanup);
        // on clicking on another tab in a business workspace or other cases where viewstate is modified
        viewStateModel && sidePanelView.listenTo(viewStateModel,
            'change:' + viewStateModel.CONSTANTS.STATE, cleanup);
      });
    }
  });

  function getOpenDelegateSignature(command, status, options) {
    var commands = command.collection;
    if (commands) {
      var openCommand = commands.get(command.delegatableOpenCommand);
      if (openCommand) {
        var delegate = openCommand.getDelegatedCommand(status, options);
        return delegate && delegate.get('signature');
      }
    }
  }

  return DocPreviewCommand;
});

csui.define('csui/utils/commands/download',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/url', 'csui/utils/commandhelper',
  'csui/models/command', 'csui/models/version'
], function (_, $, base, lang, Url, CommandHelper,
    CommandModel, VersionModel) {
  'use strict';

  // TODO: Introduce a shared configuration concept.
  var config = window.csui.requirejs.s.contexts._.config.config['csui/utils/commands/open'];

  var DownloadCommand = CommandModel.extend({
    defaults: {
      signature: "Download",
      command_key: ['download', 'Download'],
      name: lang.CommandNameDownload,
      verb: lang.CommandVerbDownload,
      doneVerb: lang.CommandDoneVerbDownload,
      scope: "single"
    },

    execute: function (status, options) {
      var node = this._getNode(status);

      if (base.isAppleMobile()) {
        // in case of iOS open the document in a new tab
        return this._openContent(node, options);
      } else {
        return this._downloadContent(node, options);
      }
    },

    _getNode: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      var type = node.get('type');
      // In search results, Generation node carries the version_number (not in the original node).
      var generationVersionNumber = node.get('version_number');

      // Apply the open/download command always to the Shortcut or Generation target.
      // The original node reference must be expanded.
      if (node.original && node.original.get('id') > 0) {
        if (type === 1 || type === 2) {  // Shortcut or Generation
          node = node.original;
        }
        if (type === 2 && generationVersionNumber !== undefined) {  // Generation
          node.set('version_number', generationVersionNumber, {silent: true});
        }
      }

      // In Search Results, the collection can contain models with non current version but these
      // models are not of type VersionModel.  Such models need the version_number.
      // Check for the 'current_version=false' that is set explicitly.
      // Note: the Search Results code does not always set/have 'current_version=true' explicitly.
      var versionsObj = node.get('versions');
      var currentVersion = !(versionsObj && (versionsObj.current_version === false));

      // Always open or download with the latest version.
      // Remove the version number properties if the node is not a VersionModel nor Generation.
      // Same for Search Results latest/current version.
      if (!(node instanceof VersionModel) && type !== 2 && currentVersion) {
        var cloneNode = node.clone();
        var versionNumProps = ['version_number', 'version_number_major', 'version_number_minor',
          'version_number_name'];
        versionNumProps.forEach(function (property) {
          cloneNode.unset(property, {silent: true});
          if (cloneNode.attributes.versions && _.isObject(cloneNode.attributes.versions)) {
            delete cloneNode.attributes.versions[property];
          }
        });
        return cloneNode;
      }

      return node;
    },

    _downloadContent: function (node, options) {
      return this._downloadContentWithPage(node, options);
    },

    _downloadContentWithPage: function (node, options) {
      var deferred = $.Deferred();
      options || (options = {});
      options.openInNewTab = !!options.openInNewTab;    // default should be false
      csui.require(['csui/utils/open.authenticated.page'], function (openAuthenticatedPage) {
        var cgiUrl = new Url(node.connector.connection.url).getCgiScript();
        var query = {
          func: 'doc.fetchcsui',
          nodeid: node.get('id'),
          action: 'download'
        };
        var versionNumber = node.get('version_number');
        if (versionNumber != null) {
          query.vernum = versionNumber;
        }
        var downloadUrl = Url.appendQuery(cgiUrl, Url.combineQueryString(query));
        return openAuthenticatedPage(node.connector, downloadUrl, options)
          .then(deferred.resolve, deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },

    _openContent: function (node, options) {
      options || (options = {});
      var content = window.open("");
      var downloadOptions = { window: content };
      // Calling window.open("") returns null in the SAP Fiori Client.
      if (!content || !content.location) {
        downloadOptions = { window: parent.window };
        content = null;
      }
      return this._downloadContentWithPage(node, _.extend(options, downloadOptions))
      .then(function() {
        if (content) {
          content.focus();
        }
        return $.Deferred().resolve();
      }, function() {
        if (content) {
          content.close();
        }
        return $.Deferred().reject();
      });
    }

  });

  return DownloadCommand;
});

csui.define('csui/utils/commands/open.base',[
    'csui/lib/underscore', 'csui/models/command', 'csui/utils/commandhelper'
  ], function (_, CommandModel, CommandHelper) {
    'use strict';

    var OpenBaseCommand = CommandModel.extend({
      // The command that extends this base command must provide an
      // 'openDelegates' prioritized colletion that contains the list
      // of specific delegatable commands.
      openDelegates: null,

      // Collect required permitted actions from all delegates, so that these
      // actions will be requested ahead for a proper command enabling.
      getCommandKey: function () {
        if(!this.openDelegates) {
          return [];
        }

        var commandKeys = this.openDelegates.map(function (delegate) {
          var command = delegate.get('command');
          return command.getCommandKey && command.getCommandKey()
            || command.get('command_key') || [];
        });
        return _
          .chain(commandKeys)
          .flatten()
          .invoke('toLowerCase')
          .unique()
          .value();
      },

      enabled: function (status, options) {
        // The execution is possible only if the command extending this base command provides
        // the delegates collection.
        if(!this.openDelegates) {
          return false;
        }

        var node = CommandHelper.getJustOneNode(status);
        // Allow only a single node to be opened.
        if (!node) {
          return false;
        }
        // TODO: Ask for content:true to be added to the REST API. They added
        // versionable:true, which will be great for the version history enabling,
        // but not for content opening, because containers can be versionable too.
        // TODO: Move E-mail and Drawing to their modules
        var type = node.get('type');
        if (!(type && _.contains(['144', '749', '736', '801'], type.toString()))) {
          return false;
        }
        // Check permissions of the least demanding command - the fallback,
        // which is evaluated at the end of the prioritized collection.
        var fallbackCommand = this.openDelegates.last().get('command');
        return fallbackCommand.enabled(status, options);
      },

      execute: function (status, options) {
        var delegatedCommand = this.getDelegatedCommand(status, options);
        return delegatedCommand.execute(status, options);
      },

      getDelegatedCommand: function (status, options) {
        var node = CommandHelper.getJustOneNode(status);
        return node && this.openDelegates.findByNode(node, status, options);
      }
    });

    return OpenBaseCommand;
  });


csui.define('csui/utils/commands/open.document/delegates/open.document.delegates',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external document opening command delegates
  'csui-ext!csui/utils/commands/open.document/delegates/open.document.delegates'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var OpenDocumentDelegateModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      command: null
    },

    constructor: function OpenDocumentDelegateModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    },

    enabled: function (node, status, options) {
      var context = status.context || options && options.context;
      var matchOptions = { context: context };
      return this.matchRules(node, this.attributes, matchOptions) &&
        this.get('command').enabled(status, options);
    }
  });

  RulesMatchingMixin.mixin(OpenDocumentDelegateModel.prototype);

  var OpenDocumentDelegateCollection = Backbone.Collection.extend({
    model: OpenDocumentDelegateModel,
    comparator: 'sequence',

    constructor: function OpenDocumentDelegateCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByNode: function (node, status, options) {
      var rule = this.find(function (rule) {
        return rule.enabled(node, status, options);
      });
      return rule && rule.get('command');
    }
  });

  var openDocumentDelegates = new OpenDocumentDelegateCollection();

  if (rules) {
    openDocumentDelegates.add(_
      .chain(rules)
      .flatten(rules)
      .map(function (rule) {
        return _.defaults({
          command: new rule.command()
        }, rule);
      })
      .value());
  }

  return openDocumentDelegates;
});

csui.define('csui/utils/commands/open.document/open.document',[
  'csui/lib/underscore', 'csui/utils/commands/open.base',
  'csui/utils/commands/open.document/delegates/open.document.delegates'
], function (_, OpenBaseCommand, openDocumentDelegates) {
  'use strict';

  var OpenDocumentCommand = OpenBaseCommand.extend({
    defaults: { signature: 'OpenDocument' },

    openDelegates: openDocumentDelegates
  });

  return OpenDocumentCommand;
});

csui.define('csui/utils/commands/zipanddownload',["module", "require", "csui/lib/underscore", "csui/lib/jquery",
  "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/command.error",
  "csui/utils/commandhelper", "csui/models/command", "csui/utils/url"
], function (module, require, _, $, lang, CommandError, CommandHelper,
    CommandModel, URL) {
  'use strict';

  var config = _.extend({}, module.config());

  // Dependencies loaded in the execute method first
  var GlobalMessage, PreFlightModel, StagesModel, ModalAlert, stageInterval = 2000;

  var ZipAndDownloadCommand = CommandModel.extend({

    defaults: {
      signature: "ZipAndDownload",
      command_key: ['ZipAndDownload', 'zipanddownload'],
      name: lang.CommandNameZipDownload,
      verb: lang.CommandVerbZipDownload,
      doneVerb: lang.CommandDoneVerbDownload,
      scope: "multiple",
      selfBlockOnly: true
    },

    enabled: function (status) {
      var flag = false;
      if(!status.nodes || !status.nodes.models){
        return false;
      }

      if (status.nodes.models.length === 1) {
        var node = CommandHelper.getJustOneNode(status),
            zipAndDownloadExists;
        for (var idx = 0; idx < status.nodes.models.length; idx++) {
          zipAndDownloadExists = _.filter(
              status.nodes.models && status.nodes.models[idx].actions &&
              status.nodes.models[idx].actions.models,
              function (action) { return action.id === "zipanddownload"; });
        }
        if (node.get("container") && zipAndDownloadExists.length > 0) {
          flag = true;
        }
      } else if (status.nodes.models.length > 1) {
        var count = 0;
        for (var index = 0; index < status.nodes.models.length; index++) {
          var downloadExists = _.filter(status.nodes.models && status.nodes.models[index].actions &&
                                        status.nodes.models[index].actions.models,
              function (action) { return action.id === "zipanddownload"; });
          if (downloadExists.length > 0) {
            count++;
          }
        }
        if (count > 0 && count === status.nodes.models.length) {
          flag = true;
        }
      }
      return flag;
    },

    execute: function (status, options) {
      this.set('isExecuting', true);
      if (this.stagesModel) {
        delete this.stagesModel;  // to prepare fresh model with new job id
      }
      var nodes = CommandHelper.getAtLeastOneNode(status),
          self  = this;
      this.options = options || {};
      this._deferred = $.Deferred();
      this.connector = this.options.connector ||
                       status.collection && status.collection.connector ||
                       status.container && status.container.connector ||
                       nodes.models && nodes.models[0].connector;

      csui.require(['csui/controls/globalmessage/globalmessage',
        "csui/models/zipanddownload/zipanddownload.preflight",
        "csui/models/zipanddownload/zipanddownload.stages",
        "csui/dialogs/modal.alert/modal.alert"
      ], function () {
        GlobalMessage = arguments[0];
        PreFlightModel = arguments[1];
        StagesModel = arguments[2];
        ModalAlert = arguments[3];
        //Verify the selected nodes will able to zip and download
        //TODO: enable preflight once rest api handles the permissions check
        /*self._preFlightCheck(status, nodes).done(
          function (preFlightModel) {
            if (preFlightModel.get('results').data.jobs.total_skipped > 0) {
              require([
                'csui/controls/zipanddownload/impl/preflight.dialog/preflight.dialog.view'
              ], function (PreflightDialogView) {
                var dialogOptions = {
                  model: preFlightModel,
                  buttons: [
                    {
                      id: 'zipDownload',
                      label: lang.PreFlightDialogBtnContinue,
                      click: _.bind(self.stageAndPrepareDownload, self, status, nodes, preFlightModel),
                      'default': true
                    },
                    {
                      label: lang.DialogBtnCancel,
                      click: _.bind(self.onClickCancelButton, self)

                    }
                  ]
                };
                self._showDialogBox(PreflightDialogView, status, nodes, dialogOptions);
              });
            } else {
              self.stageAndPrepareDownload(status, nodes, preFlightModel);
            }
          });*/
        self.stageAndPrepareDownload(status, nodes, {});
      });
      // this._deferred.resolve();  // Do not block other actions
      this._deferred.always(function () {
        self.set('isExecuting', false);
      });
      return this._deferred.promise();
    },

    _preFlightCheck: function (status, nodes) {
      var deferred = $.Deferred();
      var self     = this,
          formData = {
            id_list: nodes.pluck('id'),
            type: 'ZipAndDownload'
          };
      var preFlightModel = new PreFlightModel(formData, status);
      preFlightModel.preflight = true;
      var preflightXHR = preFlightModel.save(formData, {
        silent: true,
        wait: true
      }).done(function () {
        deferred.resolve(preFlightModel);
      }).fail(function (error) {
        var commandError = error ? new CommandError(error, preFlightModel) :
                           error;
        if (error.statusText !== 'abort') {
          ModalAlert.showError(commandError.message, lang.error);
        }
        self._deferred.reject({cancelled: true});
        deferred.reject(preFlightModel, commandError);
      });
      GlobalMessage.showLoader(preflightXHR, {
        label: lang.VerifyZipAndDownloadPrefetch
      });
      return deferred.promise();
    },

    _getJobId: function (status, nodes) {
      var url         = this.connector.getConnectionUrl().getApiBase('v2'),
          formData    = {
            id_list: nodes.pluck('id'),
            type: 'ZipAndDownload'
          },
          ajaxOptions = {
            url: URL.combine(url, 'zipanddownload'),
            type: 'POST',
            data: formData,
            contentType: 'application/x-www-form-urlencoded'
          };
      return this.connector.makeAjaxCall(ajaxOptions);
    },

    changeStageMessage: function (xhr) {
      // better pass a model to global message loader panel and update that model so that loader
      // panel view re-renders itself
      var currentStage = this.stagesModel && this.stagesModel.get('current_stage') || 0;
      var message = currentStage === 0 ? lang.ExtractingZipAndDownload :
                    (currentStage === 1 ? lang.CompressingZipAndDownload :
                     lang.CleanUpZipAndDownload);
      GlobalMessage.changeLoaderMessage(message, xhr);
    },

    _checkStage: function (status, jobIdModel, deferred) {
      deferred = deferred || $.Deferred();
      this.stagesModel || (this.stagesModel = new StagesModel(jobIdModel, {
        connector: this.connector
      }));
      var self    = this,
          promise = deferred.promise(),
          xhr     = this.stagesModel.fetch();
      this.changeStageMessage(xhr);
      xhr.done(function () {
        if (self.stagesModel.get('complete')) {
          deferred.resolve(self.stagesModel);
        } else {
          if (self.stagesModel.get('stage_summary').some(function (stage) {
                return !stage.complete;
              })) {
            self.stageCheckTimeout = setTimeout(function () {
              clearTimeout(self.stageCheckTimeout);
              self.stageCheckTimeout = undefined;
              self._checkStage(status, jobIdModel, deferred);
            }, stageInterval);
          } else {
            deferred.resolve(self.stagesModel);
          }
        }
      });
      promise.abort = xhr.abort;   // helper for loader panel view cancel
      return promise;
    },

    _showDialogBox: function (view, status, nodes, dialogOptions) {
      var self = this;
      // dialog view
      self._dialog = new view(_.extend(dialogOptions, {
        status: status,
        nodes: nodes,
        iconLeft: 'notification_warning'
      }));
      self._dialog.listenTo(self._dialog, 'hide', _.bind(self.onHideDialog, self));
      self._dialog.show();
    },

    onHideDialog: function () {
      if (this._deferred) {
        if (this._deferred.state() === 'pending') {
          this._deferred.reject({cancelled: true});
        }
      }
    },

    stageAndPrepareDownload: function (status, nodes, preFlightModel) {
      var self         = this,
          deferred     = $.Deferred(),
          currentStage = self.stagesModel && self.stagesModel.get('current_stage') || 0;
      self._getJobId(status, nodes).done(function (jobIdModel) {
        jobIdModel = jobIdModel.results.data.jobs;
        var checkStage = self._checkStage(status, jobIdModel);
        GlobalMessage.showLoader(checkStage, {
          label: currentStage === 0 ? lang.ExtractingZipAndDownload :
                 (currentStage === 1 ? lang.CompressingZipAndDownload :
                  lang.CleanUpZipAndDownload),
          onDestroy: function (success) {
            if (self.stageCheckTimeout) {
              clearTimeout(self.stageCheckTimeout);
            }
            success ? self._deferred.resolve() : self._deferred.reject();
          }
        });
        checkStage.done(
            function (stagesModel) {
              deferred.resolve();
              if (stagesModel && stagesModel.get('complete') &&
                  stagesModel.get('current_stage') === stagesModel.get('stage_summary').length) {
                csui.require([
                  'csui/controls/zipanddownload/impl/download.dialog/download.dialog.view', 
                  'csui/utils/base', 
                  'csui/utils/open.authenticated.page',
                  'csui/controls/zipanddownload/impl/dialog.header/dialog.header.view'
                ], function (DownloadDialogView, base, openAuthenticatedPage, DialogHeaderView) {
                  deferred.resolve();
                  var dialogOptions = {
                    model: stagesModel,
                    status: status,
                    // title: lang.downloadDialogTitle,
                    headerView: new DialogHeaderView({
                          title: lang.downloadDialogTitle,
                          describedBy: "download-zip-file",
                          source: 'downloadZip'
                        }),
                    //preFlightModel: preFlightModel,
                    buttons: [
                      {
                        id: 'zipDownload',
                        label: lang.DownloadDialogBtnDownload,
                        click: _.bind(function () {
                          //validate the name
                          var archiveName = this._dialog.ui.fileName.val(),
                              isValidName = false;
                          if (/^[\W]+/.test(archiveName)) {
                            //Allowing download of other languages(non-english)
                            if (/[^\u0000-\u007F]/g.test(archiveName)) {
                              isValidName = true;
                            }
                          }
                          var nameErrorMsg = '';
                          if (archiveName.trim().length === 0) {
                            nameErrorMsg = lang.TheArchiveNameCannotBeEmpty;
                          } else if (archiveName.trim().length > 248) {
                            nameErrorMsg = lang.TheArchiveNameMaxLength;
                          } else if (archiveName.search(
                                  /[\?\:<>\*\|\"\\\/\\&]/g) !== -1) {
                            nameErrorMsg = lang.InvalidArchiveCharacters;
                          } else if (/^[\W]+/.test(archiveName) && !isValidName) {
                            nameErrorMsg = lang.InvalidArchiveName;
                          } else {
                            if (this._dialog.options.status &&
                                this._dialog.options.status.originatingView) {
                              var toolItem = this._dialog.options.status.originatingView.$el.find(
                                  '[data-csui-command=' + this.get("signature").toLowerCase() +
                                  '] a.binf-disabled');
                              if (toolItem.length > 0) {
                                toolItem.removeClass("binf-disabled");
                              }
                            }
                            if (!/(.)+(.zip)$/i.test(archiveName)) {
                              archiveName += '.zip';
                            }
                            /*  window.open(URL.combine(this.connector.connection.url.replace(/\/api\/v[1|2]\/?/gi, ''),
                             StagesModel.get('link')));  */
                            // Resource interpreted as Document but transferred with MIME type
                            // application/octet-stream:
                            var downloadURL = URL.appendQuery(URL.combine(
                              this.connector.connection.url.replace(/\/api\/v[1|2]/gi, ''),
                              stagesModel.get('link')),
                              'downloadName=' + encodeURIComponent(archiveName));
                            openAuthenticatedPage(this.connector, downloadURL, { openInNewTab: false })
                              .then(deferred.resolve, deferred.reject);
                             this._dialog.destroy();
                            delete this._dialog;
                          }
                          if (nameErrorMsg.length) {
                            this._dialog.ui.errorEl.html(nameErrorMsg).attr('role','alert');
                            var nameErrorId = this._dialog.ui.errorEl.attr('id');
                            this._dialog.ui.fileName.attr({'aria-invalid': true, 'aria-describedby': nameErrorId} );
                          }
                        }, self),
                        'default': true,
                        disabled: stagesModel.get('total_completed') === 0
                      }, {
                        label: lang.DialogBtnCancel,
                        close: true,
                        click: _.bind(self.onClickCancelButton, self)
                      }
                    ]
                  };
                  self._showDialogBox(DownloadDialogView, status, nodes, dialogOptions);
                });
              } else {
                ModalAlert.showError(stagesModel.get('status_formatted'));
              }
            }).fail(function (error) {
          GlobalMessage.showMessage('error', error.statusText);
          deferred.reject(error);
        });
      });
      if (this._dialog) {
        this._dialog.destroy();
        delete this._dialog;
      }
    },

    onClickCancelButton: function () {
      if (this._dialog.options.status && this._dialog.options.status.originatingView) {
        var toolItem = this._dialog.options.status.originatingView.$el.find(
            '[data-csui-command=' + this.get("signature").toLowerCase() +
            '] a.binf-disabled');
        if (toolItem.length > 0) {
          toolItem.removeClass("binf-disabled");
        }
      }
      this._dialog.destroy();
      delete this._dialog;
    }
  });
  return ZipAndDownloadCommand;
});

csui.define('csui/utils/commands/open.classic.page',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url',
  'csui/utils/commandhelper', 'csui/models/command',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, Url, CommandHelper, CommandModel, lang) {
  'use strict';

  var config = _.extend({
    openInNewTab: true
  }, module.config());

  var OpenClassicPageCommand = CommandModel.extend({

    execute: function (status, options) {
      // TODO: Remove this. Commands have to return false from enabled()
      // in this case.
      if (config.classicUnsupported) {
        return this._classicUnsupported(status);
      }
      var node = CommandHelper.getJustOneNode(status);
      // TODO: Merge status and options on a higher level
      return this._navigateTo(node, _.extend({}, status, options));
    },

    getUrl: function (node, options) {
      var connector = node.connector || options.connector,
          url = new Url(connector.connection.url).getCgiScript(),
          urlQuery = this.getUrlQueryParameters(node, options);
      if (urlQuery && !_.isString(urlQuery)) {
        urlQuery = $.param(urlQuery);
      }
      if (urlQuery) {
        url += '?' + urlQuery;
      }
      return url;
    },

    getUrlQueryParameters: function (node, options) {
    },

    openInNewTab: function () {
      return config.openInNewTab;
    },

    shouldCloseTabAfterRedirect: false,

    _classicUnsupported: function (status) {
      var deferred = $.Deferred();
      status.suppressFailMessage = true;
      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
        ModalAlert.showInfo(lang.viewTypeUnsupported);
      });
      return deferred.reject();
    },

    _navigateTo: function (node, options) {
      var url, openInNewTab, shouldCloseTabAfterRedirect,
          config, closeUrl, connection;

      // If no URL is available, the terminal command can formulate
      // a meaningful message
      try {
        url = this.getUrl(node, options);
      } catch (error) {
        return $
            .Deferred()
            .reject(error)
            .promise();
      }

      openInNewTab = this.openInNewTab;
      if (_.isFunction(openInNewTab)) {
        openInNewTab = openInNewTab.call(this);
      }

      shouldCloseTabAfterRedirect = this.shouldCloseTabAfterRedirect;
      if (_.isFunction(shouldCloseTabAfterRedirect)) {
        shouldCloseTabAfterRedirect = shouldCloseTabAfterRedirect.call(this);
      }

      // Append nextURL parameter pointing to the current or to a
      // self-closing page, when the classic page has been submitted
      if (shouldCloseTabAfterRedirect) {
        // Use the self-closing page, only if a new window is opened;
        // otherwise go back to the current page
        if (openInNewTab) {
          connection = (node.connector || options.connector).connection;
          // Ask for the configuration first here; it can be set later
          // during requiring of other modules
          closeUrl = module.config().closeUrl ||
                     Url.appendQuery( new Url(connection.url).getCgiScript(),
                         'func=csui.closewindow' );

          if (!new Url(closeUrl).isAbsolute()) {
            if (closeUrl[0] !== '/') {
              closeUrl = Url.appendQuery(
                  new Url(connection.url).getCgiScript(), closeUrl);
            } else {
              closeUrl = Url.combine(
                  new Url(connection.url).getOrigin(), closeUrl);
            }
          }
        } else {
          closeUrl = location.href;
        }
        url = Url.appendQuery(url, Url.combineQueryString({
          nextURL: closeUrl
        }));
      }

      if (openInNewTab) {
        window
            .open(url, '_blank')
            .focus();
      } else {
        location.href = url;
      }

      return $.Deferred().resolve().promise();
    }

  }, {
    openInNewTab: config.openInNewTab
  });

  return OpenClassicPageCommand;

});

csui.define('csui/utils/commands/edit',['csui/lib/jquery.parse.param', 'csui/utils/commandhelper',
  'csui/utils/url', 'csui/utils/commands/open.classic.page',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (parseParam, CommandHelper, Url, OpenClassicPageCommand, lang) {
  'use strict';

  var EditCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'Edit',
      command_key: 'edit',
      scope: 'single'
    },

    shouldCloseTabAfterRedirect: true,
	
	getUrlUnavailableError: function() {
		return lang.NoEditUrl;
	},

    getUrl: function (node, options) {
      var signature = this.get("command_key"),
          action = this._getNodeActionForSignature(node, signature),
          url, connection;
      if (action) {
        url = action.get('href');
        if (url) {
          if (!new Url(url).isAbsolute()) {
            connection = (node.connector || options.connector).connection;
            if (url[0] !== '/') {
              url = Url.appendQuery(new Url(connection.url).getCgiScript(), url);
            } else {
              url = Url.combine(new Url(connection.url).getOrigin(), url);
            }
          }
          return url;
        }
      }
      throw new Error(this.getUrlUnavailableError());
    }

  });

  return EditCommand;

});

csui.define('csui/utils/commands/editactivex',['csui/lib/jquery.parse.param', 'csui/utils/commandhelper',
  'csui/utils/url', 'csui/utils/commands/open.classic.page'
], function (parseParam, CommandHelper, Url, OpenClassicPageCommand, lang) {
  'use strict';

  var EditActiveX = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'EditActiveX',
      command_key: 'editactivex',
      scope: 'single'
    },

    shouldCloseTabAfterRedirect: true,

    enabled: function (status, options) {
      var node = CommandHelper.getJustOneNode(status),
	      signature = this.get('command_key'),
          action = this._getNodeActionForSignature(node, signature);
      // Set the value of name and promoted from the /nodes/actions response
      if (action) {
        var toolItem = status.toolItem || options && options.toolItem;
        if (toolItem) {
          var name = action.get('name');
          if (name) {
            toolItem.set('name', name);
            return true;
          }
        }
      }
      return false;
    },

    getUrl: function (node, options) {
      var signature = this.get("command_key"),
          action = this._getNodeActionForSignature(node, signature),
          url, connection;
      if (action) {
        url = action.get('href');
        if (url) {
          if (!new Url(url).isAbsolute()) {
            connection = (node.connector || options.connector).connection;
            if (url[0] !== '/') {
              url = Url.appendQuery(new Url(connection.url).getCgiScript(), url);
            } else {
              url = Url.combine(new Url(connection.url).getOrigin(), url);
            }
          }
          return url;
        }
      }
      throw new Error(lang.NoEditUrl);
    }

  });

  return EditActiveX;

});

csui.define('csui/utils/commands/editofficeonline',['csui/lib/jquery.parse.param', 'csui/utils/commandhelper',
  'csui/utils/url', 'csui/utils/commands/open.classic.page'
], function (parseParam, CommandHelper, Url, OpenClassicPageCommand, lang) {
  'use strict';

  var EditOfficeOnline = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'EditOfficeOnline',
      command_key: 'editofficeonline',
      scope: 'single'
    },

    shouldCloseTabAfterRedirect: true,

    enabled: function (status, options) {
      var node = CommandHelper.getJustOneNode(status),
	      signature = this.get('command_key'),
          action = this._getNodeActionForSignature(node, signature);
      // Set the value of name and promoted from the /nodes/actions response
      if (action) {
        var toolItem = status.toolItem || options && options.toolItem;
        if (toolItem) {
          var name = action.get('name');
          if (name) {
            toolItem.set('name', name);
            return true;
          }
        }
      }
      return false;
    },

    getUrl: function (node, options) {
      var signature = this.get("command_key"),
          action = this._getNodeActionForSignature(node, signature),
          url, connection;
      if (action) {
        url = action.get('href');
        if (url) {
          if (!new Url(url).isAbsolute()) {
            connection = (node.connector || options.connector).connection;
            if (url[0] !== '/') {
              url = Url.appendQuery(new Url(connection.url).getCgiScript(), url);
            } else {
              url = Url.combine(new Url(connection.url).getOrigin(), url);
            }
          }
          return url;
        }
      }
      throw new Error(lang.NoEditUrl);
    }

  });

  return EditOfficeOnline;

});

csui.define('csui/models/perspective/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
], function (_, $, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        isFetchableDirectly: function () {
          return this.get('id') > 0;
        },

        urlBase: function () {
          var id  = this.get('id'),
              url = this.connector.connection.url;
          if (!id) {
            // Create a new node by POST /perspectives
            url = Url.combine(url, 'perspectives');
          } else if (!_.isNumber(id) || id > 0) {
            // Access an existing node by VERB /perspectives/:id
            url = Url.combine(url, 'perspectives', id);
          } else {
            throw new Error('Unsupported id value');
          }
          return url;
        },

        url: function () {
          var url = this.urlBase();
          return url;
        },

        parse: function (response) {

          var perspectives = response.perspectives;
          if (!perspectives) {
            // Update response
            return response;
          }

          if(perspectives.length === 0){
            // Perspectives are empty for GET request
            return {};
          }
          perspectives = _.each(perspectives, function (perspective) {
            perspective.cascading = perspective.cascading + '';
            perspective.containerType = perspective.container_type;
            perspective.constantData = perspective.constant_data;
            perspective.overrideType = perspective.override_type;
            perspective.overrideId = perspective.override_id;
            perspective.nodepath = perspective.node_path;
            perspective.rules = perspective.rule_data;
            perspective.perspective = JSON.parse(perspective.perspective);
            perspective.constant_extraction_mode = perspective.container_type;
            perspective.pnodepath = perspective.perspective_node_path;
          });
          return {
            'perspectives': perspectives
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
  
//TODO Check if this should be moved to pman
csui.define('csui/models/perspective/perspective.template.model',["module", 'csui/lib/underscore', "csui/lib/backbone",
  "csui/models/perspective/server.adaptor.mixin",
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/perspective.model',
  "csui/utils/log", "csui/utils/base"
], function (module, _, Backbone, ServerAdaptorMixin, UploadableMixin, ConnectableMixin,
    PerspectiveModel, log,
    base) {
  "use strict";

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var PerspectiveTemplateModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    constructor: function PerspectiveTemplateModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = _.pick(options, ['connector']);
      this.makeUploadable(options)
          .makeConnectable(options)
          .makeServerAdaptor(options);
    },

    isNew: function () {
      return !this.get('id') || this.get('id') === 0;
    },

    isFetchable: function () {
      return !!this.get('id');
    },

    set: function (key, value, options) {
      var attrs;
      if (key == null) {
        return this;
      }
      if (typeof key === 'object') {
        attrs = key;
        options = value;
      } else {
        (attrs = {})[key] = value;
      }
      if (attrs.perspectives) {
        key = 'perspectives';
        var perspectiveCollection = new Backbone.Collection();
        options = _.pick(this.options, ['connector']);

        _.each(attrs.perspectives, function (perspective) {
          //default 'id' for the current perspective model will be replaced with perspective 'id'
          //later  as models in the collection need to have unique 'id'
          perspectiveCollection.add(new PerspectiveModel(perspective, options));
        });
        value = perspectiveCollection;
        (attrs = {})[key] = value;
      }
      // do the usual set
      return Backbone.Model.prototype.set.call(this, attrs, options);
    }
  });

  UploadableMixin.mixin(PerspectiveTemplateModel.prototype);
  ConnectableMixin.mixin(PerspectiveTemplateModel.prototype);
  ServerAdaptorMixin.mixin(PerspectiveTemplateModel.prototype);

  return PerspectiveTemplateModel;

});

csui.define('csui/utils/commands/edit.perspective',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper', 'csui/utils/url',
  'csui/models/perspective/perspective.template.model',
  'csui/models/perspective/perspective.model',
  'csui/utils/perspective/perspective.util',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel, CommandHelper,
    Url, PerspectiveTemplateModel, PerspectiveModel, PerspectiveUtil, lang) {
  'use strict';
  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/contexts/perspective'] || {};
  config = _.extend({
    enableInlinePerspectiveEditing: true,
    enablePersonalization: true
  }, config, module.config());

  var ConnectorFactory, NodeModelFactory, AncestorCollectionFactory;

  var EditPerspectiveCommand = CommandModel.extend({

    defaults: {
      signature: 'EditPerspective',
      name: lang.EditPerspective
    },

    enabled: function (status, options) {
      var context     = status.context || options && options.context,
          perspective = context.perspective;
      if (!perspective) {
        return false;
      }
      return this._enablePersonalizePage(perspective, options, context) ||
             this._enableEditPerspective(perspective) ||
             this._enableCreatePerspective(perspective, context);
    },

    /**
     * Enable "Personalize Page" only when
     *  - Current page is Landing Page
     *  - Perspective Type is "flow"
     *  - All of the widgets of flow perspective are having "w_id".
     *  - Version info available in perspective
     *
     * @param {Backbone.Model} perspective - context.perspective
     * @param {status.options} options
     * @param {PerspectiveContext} context
     */
    _enablePersonalizePage: function (perspective, options, context) {
      var enable = (config.enablePersonalization || options.enablePersonalization) &&
                   !context._applicationScope.get('id') && // Landing Page only
                   (perspective.get('type') === 'flow' ||
                   perspective.get('type') === 'sidepanel-right' || 
                   perspective.get('type') === 'sidepanel-left')/** && perspective.has('override') &&
           !!perspective.get('override').perspective_version*/;
      if (!enable) {
        return enable;
      }
      // TODO move this prerequisite check to respective perspective view since it perspective payload varies from type to type
      var perspectiveOptions = perspective.get('options');
      var allWidgetsHasIds = perspectiveOptions &&
                             _.every(perspectiveOptions.widgets, PerspectiveUtil.hasWidgetId);
      return allWidgetsHasIds;
    },

    _enableEditPerspective: function (perspective) {
      return (perspective.has('id') || perspective.has('perspective_id')) &&
             perspective.get('canEditPerspective');
    },

    _enableCreatePerspective: function (perspective, context) {
      return !(perspective.has('id') || perspective.has('perspective_id')) &&
             perspective.get('canEditPerspective') &&
             context._applicationScope.get('id') === "node";
    },

    execute: function (status, options) {
      var deferred    = $.Deferred(),
          context     = status.context || options && options.context,
          perspective = context.perspective;

      if (perspective.has('id')) {
        this._fetchPerspective(context, perspective).then(_.bind(function (perspectiveModel) {
          if (perspectiveModel) {
            this._continueExecution(status, options, deferred, perspectiveModel);
          }
        }, this), deferred.reject);
      } else {
        // Create new perspective.
        this._continueExecution(status, options, deferred);
      }
      return deferred.promise();
    },

    _continueExecution: function (status, options, deferred, perspectiveModel) {
      var context                 = status.context || options && options.context,
          perspective             = context.perspective,
          enablePersonalization   = this._enablePersonalizePage(perspective, options, context),
          enableEditPerspective   = this._enableEditPerspective(perspective),
          enableCreatePerspective = this._enableCreatePerspective(perspective, context);
      if (enablePersonalization) {
        if (enableEditPerspective || enableCreatePerspective) {
          this._promptToChooseEditPage(status, options, context, deferred, perspectiveModel);
        } else {
          this._doPersonalizePage(status, options, context, deferred);
        }
      } else {
        this._doEditPage(status, options, context, deferred, perspectiveModel);
      }
    },

    _fetchPerspective: function (context, perspective) {
      var deferred      = $.Deferred(),
          perspectiveId = perspective.get('id') ||
                          perspective.get('perspective_id');
      csui.require(['csui/utils/contexts/factories/connector', 'csui/dialogs/modal.alert/modal.alert'],
          _.bind(function (ConnectorFactory, alertDialog) {
            var perspectiveTemplate = new PerspectiveTemplateModel(
                {id: perspectiveId},
                {connector: context.getObject(ConnectorFactory)});
            perspectiveTemplate.fetch().then(_.bind(function () {
              var allPerspectives = perspectiveTemplate.get('perspectives');
              if (allPerspectives && allPerspectives.length != 1) {
                //show warning dialog as the perspective template is used by multiple nodes
                alertDialog.showError(lang.editPerspectiveErrorMessage)
                    .done(function () {
                      deferred.resolve();
                    })
                    .fail(deferred.reject);
              } else {
                deferred.resolve(allPerspectives.at(0));
              }

            }, this), deferred.reject);
          }, this));
      return deferred.promise();
    },

    _doPersonalizePage: function (status, options, context, deferred) {
      csui.require(['csui/perspective.manage/pman.view', 'csui/utils/contexts/factories/node',
            'csui/models/perspective/personalization.model', 'csui/utils/contexts/factories/connector',
            'csui/utils/contexts/factories/application.scope.factory',
            'csui/utils/contexts/factories/user'],
          function (PManView, NodeModelFactory, PersonalizationModel, ConnectorFactory,
              ApplicationScopeModelFactory, UserModelFactory) {
            var applicationScope = context.getModel(ApplicationScopeModelFactory),
                sourceModel;
            if (applicationScope.id == 'node') {
              sourceModel = CommandHelper.getJustOneNode(status) ||
                            context.getModel(NodeModelFactory);
            } else {
              sourceModel = context.getModel(UserModelFactory);
            }
            var currentPerspective = sourceModel.get('perspective'),
                overrideInfo       = currentPerspective.override,
                defPersonal        = _.pick(currentPerspective, 'type', 'options',
                    'perspective_version',
                    'perspective_id');
            defPersonal = _.defaults(defPersonal,
                _.pick(overrideInfo, 'perspective_version', 'perspective_id'));
            defPersonal.perspective_id = defPersonal.perspective_id ||
                                         currentPerspective.id;
            var personalization = new PersonalizationModel({},
                {
                  context: context,
                  connector: context.getObject(ConnectorFactory),
                  sourceModel: sourceModel,
                  perspective: currentPerspective,
                });
            personalization.setPerspective(defPersonal);
            PersonalizationModel.loadPersonalization(sourceModel, context).then(
                function (result) {
                  if (!!result) {
                    personalization.setPerspective(result);
                  }
                  var pmanView = new PManView({
                    context: context,
                    perspective: personalization,
                    mode: PerspectiveUtil.MODE_PERSONALIZE
                  });
                  pmanView.show();
                  deferred.resolve();
                });
          }, deferred.reject);
    },

    _doEditPage: function (status, options, context, deferred, perspectiveModel) {
      if (this._enableEditPerspective(context.perspective)) {
        this._doEditPerspective(status, options, context, deferred, perspectiveModel);
      } else if (this._enableCreatePerspective(context.perspective, context)) {
        this._doCreatePerspective(status, options, context, deferred);
      }
    },

    _doCreatePerspective: function (status, options, context, deferred) {
      var isInlineEditing = (options && options.inlinePerspectiveEditing) ||
                            config.enableInlinePerspectiveEditing;
      if (isInlineEditing) {
        // Edit perspective of page inline in SmartUI
        this._createInline(status, options, context, deferred);
      } else {
        // Navigate to class Perspective Management console
        this._createInClassicPMan(status, options, context, deferred);
      }
    },

    _doEditPerspective: function (status, options, context, deferred, perspectiveModel) {
      var isInlineEditing = (options && options.inlinePerspectiveEditing) ||
                            config.enableInlinePerspectiveEditing;
      if (isInlineEditing) {
        // Edit perspective of page inline in SmartUI
        this._editInline(perspectiveModel, context, deferred);
      } else {
        // Navigate to class Perspective Management console
        this._editInClassicPMan(status, options, context, deferred);
      }
    },

    _promptToChooseEditPage: function (status, options, context, deferred, perspectiveModel) {
      var self = this;
      //   deferred = $.Deferred();
      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        self.dialog = alertDialog.confirmQuestion(lang.editPageDialogMessage,
            lang.editPageTitle,
            {
              buttons: {
                showYes: true,
                labelYes: lang.editPageButton,
                showNo: true,
                labelNo: lang.personalizePageButton,
                showCancel: true,
                labelCancel: lang.editPageCancelButton
              },
            }).then(function (result) {
          if (result === true) {
            // Edit Page
            self._doEditPage(status, options, context, deferred, perspectiveModel);
          }
        }, function (result) {
          if (result === false) {
            // Personalize Page
            self._doPersonalizePage(status, options, context, deferred);
          } else {
            // Cancel
            deferred.resolve();
          }
        });
      }, deferred.reject);
    },

    _editInline: function (perspectiveModel, context, deferred) {
      csui.require(['csui/perspective.manage/pman.view'],
          function (PManView) {
            var perspectiveId = context.perspective.get('id') ||
                                context.perspective.get('perspective_id');
            var currentPerspective = perspectiveModel;
            currentPerspective.set('id', perspectiveId);
            var pmanView = new PManView({
              context: context,
              perspective: currentPerspective
            });
            pmanView.show();
            deferred.resolve();
          }, deferred.reject);
    },

    _editInClassicPMan: function (status, options, context, deferred) {
      var self = this;
      csui.require(['csui/utils/contexts/factories/connector'
      ], function () {
        ConnectorFactory = arguments[0];
        var f = self._getEditForm(context, status);
        f.submit();
        f.remove();
        deferred.resolve();
      }, deferred.reject);
    },

    _getEditForm: function (context, status) {
      var f = $("<form target='_blank' method='POST' style='display:none;'></form>").attr({
        action: this._getUrl(context, status)
      }).appendTo(document.body);

      var params = this._getEditUrlQueryParameters(context);

      for (var i in params) {
        if (params.hasOwnProperty(i)) {
          $('<input type="hidden" />').attr({
            name: i,
            value: params[i]
          }).appendTo(f);
        }
      }

      return f;
    },

    _getUrl: function (context, status) {
      var connector      = context.getObject(ConnectorFactory),
          cgiUrl         = new Url(connector.connection.url).getCgiScript(),
          perspectiveUrl = cgiUrl.toString() + "/perspectivemgr";
      return perspectiveUrl;
    },

    _getEditUrlQueryParameters: function (context) {
      var perspective_id = context.perspective.attributes.id,
          parameters;
      if (perspective_id !== undefined && perspective_id > 0) {
        parameters = {
          perspective_id: perspective_id
        };
      } else {
        parameters = {};
      }
      return parameters;
    },

    /**
     * Prepare new perspective config required for current node since no perspective is configured yet.
     */
    _preparePerspectiveConfig: function (context) {
      var perspectiveConfig = {
            "perspective": {
              "type": "flow",
              "options": {
                "widgets": [
                  {
                    "type": "csui/widgets/nodestable"
                  }
                ]
              }
            },
            "overrideType": "genericContainer",
            "scope": "local",
            "containerType": "-1",
            "cascading": "false"
          },
          node              = CommandHelper.getJustOneNode(status) ||
                              context.getModel(NodeModelFactory),
          collection        = context.getCollection(AncestorCollectionFactory);
      perspectiveConfig.nodepath = this._getNodePath(collection);
      perspectiveConfig.node = node.get('id');
      perspectiveConfig.containerType = node.get('type');
      perspectiveConfig.title = node.get('name');
      return perspectiveConfig;
    },

    _createInline: function (status, options, context, deferred) {
      var self = this;
      csui.require(['csui/utils/contexts/factories/node',
        'csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/ancestors',
        'csui/perspective.manage/pman.view'
      ], function () {
        NodeModelFactory = arguments[0];
        ConnectorFactory = arguments[1];
        AncestorCollectionFactory = arguments[2];
        var PManView          = arguments[3],
            // Create new perspective
            perspectiveConfig = self._preparePerspectiveConfig(context, NodeModelFactory,
                AncestorCollectionFactory);
        // Append current timestamp to avoid name conflicts in perspective volume
        perspectiveConfig.title = perspectiveConfig.title + ' ' + new Date().getTime();
        var perspective = new PerspectiveModel(perspectiveConfig,
            {connector: context.getObject(ConnectorFactory)});
        var pmanView = new PManView({
          context: context,
          perspective: perspective
        });
        pmanView.show();
        deferred.resolve();
      }, deferred.reject);
    },

    _createInClassicPMan: function (status, options, context, deferred) {
      var self = this;
      csui.require(['csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/node',
        'csui/utils/contexts/factories/ancestors'
      ], function () {
        ConnectorFactory = arguments[0];
        NodeModelFactory = arguments[1];
        AncestorCollectionFactory = arguments[2];
        var f = self._getCreateForm(context, status);
        f.submit();
        f.remove();
        deferred.resolve();
      }, deferred.reject);
    },

    _getCreateForm: function (context, status) {
      var f = $("<form target='_blank' method='POST' style='display:none;'></form>").attr({
        action: this._getUrl(context, status)
      }).appendTo(document.body);

      var params = this._getCreateUrlQueryParameters(context, status);

      for (var i in params) {
        if (params.hasOwnProperty(i)) {
          $('<input type="hidden" />').attr({
            name: i,
            value: params[i]
          }).appendTo(f);
        }
      }

      return f;
    },

    _getCreateUrlQueryParameters: function (context, status) {
      var perspectiveConfig = this._preparePerspectiveConfig(context, NodeModelFactory,
          AncestorCollectionFactory);
      perspectiveConfig.ui = {
        "elements": {
          "btn-mode-code": true,
          "btn-view-general": true,
          "btn-view-rules": false,
          "btn-view-layout": true,
          "btn-view-widgets": true,

          "view-perspective-action": true,
          "perspective-action-create": true,
          "perspective-action-edit": true,
          "perspective-action-copy": true,

          "view-perspective-form": true,
          "perspective-title": true,
          "perspective-type": true,
          "perspective-scope": true,
          "perspective-nodetypes": true,
          "perspective-node": true,
          "perspective-cascading": true,

          "display-size-msg": false,
          "rules-code": true,

          "layout-flow": true,
          "layout-left-center-right": true,
          "layout-grid": false,
          "layout-tabbed": false
        },
        "widgetGroupsBlacklist": [],
        "widgetsWhitelist": [],
        "disableGrouping": false
      };
      return {
        config: JSON.stringify(perspectiveConfig)
      };
    },

    _getNodePath: function (collection) {
      var nodepath = "";
      collection.each(function (model) {
        nodepath += nodepath ? ':' : '';
        nodepath += model.get('name');
      });
      return nodepath;
    }

  });

  return EditPerspectiveCommand;
});
csui.define('csui/utils/commands/editwebdav',['csui/lib/jquery.parse.param', 'csui/utils/commandhelper',
  'csui/utils/url', 'csui/utils/commands/open.classic.page'
], function (parseParam, CommandHelper, Url, OpenClassicPageCommand, lang) {
  'use strict';

  var EditWebDAV = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'EditWebDAV',
      command_key: 'editwebdav',
      scope: 'single'
    },

    shouldCloseTabAfterRedirect: true,

    enabled: function (status, options) {
      var node = CommandHelper.getJustOneNode(status),
	      signature = this.get('command_key'),
          action = this._getNodeActionForSignature(node, signature);
      // Set the value of name and promoted from the /nodes/actions response
      if (action) {
        var toolItem = status.toolItem || options && options.toolItem;
        if (toolItem) {
          var name = action.get('name');
          if (name) {
            toolItem.set('name', name);
            return true;
          }
        }
      }
      return false;
    },

    getUrl: function (node, options) {
      var signature = this.get("command_key"),
          action = this._getNodeActionForSignature(node, signature),
          url, connection;
      if (action) {
        url = action.get('href');
        if (url) {
          if (!new Url(url).isAbsolute()) {
            connection = (node.connector || options.connector).connection;
            if (url[0] !== '/') {
              url = Url.appendQuery(new Url(connection.url).getCgiScript(), url);
            } else {
              url = Url.combine(new Url(connection.url).getOrigin(), url);
            }
          }
          return url;
        }
      }
      throw new Error(lang.NoEditUrl);
    }

  });

  return EditWebDAV;

});

csui.define('csui/utils/commands/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/commands/nls/root/lang',{
  // Filter
  FilterCollapseTooltip: 'Hide filters',
  TreeBrowseCollapseTooltip: 'Hide navigation tree',

  // Share
  EmailLinkSubject: 'I want to share the following links with you',
  EmailLinkDesktop: "Link for Desktop and Android",
  EmailAppleLinkFormat: "Link for iOS Mobile",

  // Reserve
  CommandNameReserve: "Reserve",
  CommandVerbReserve: "reserve",
  ReservePageLeavingWarning: "If you leave the page now, pending items will not be reserved.",
  ReserveItemsNoneMessage: "No items reserved.",
  ReserveOneItemSuccessMessage: "1 item successfully reserved.",
  ReserveSomeItemsSuccessMessage: "{0} items successfully reserved.",
  ReserveManyItemsSuccessMessage: "{0} items successfully reserved.",
  ReserveOneItemFailMessage: "1 item failed to reserve.",
  ReserveSomeItemsFailMessage: "{0} items failed to reserve.",
  ReserveManyItemsFailMessage: "{0} items failed to reserve.",

  // Unreserve
  CommandNameUnreserve: "Unreserve",
  CommandVerbUnreserve: "unreserve",
  UnreservePageLeavingWarning: "If you leave the page now, pending items will not be unreserved.",
  UnreserveItemsNoneMessage: "No items unreserved.",
  UnreserveOneItemSuccessMessage: "1 item successfully unreserved.",
  UnreserveSomeItemsSuccessMessage: "{0} items successfully unreserved.",
  UnreserveManyItemsSuccessMessage: "{0} items successfully unreserved.",
  UnreserveOneItemFailMessage: "1 item failed to unreserve.",
  UnreserveSomeItemsFailMessage: "{0} items failed to unreserve.",
  UnreserveManyItemsFailMessage: "{0} items failed to unreserve.",

   // Lock
   CommandNameLock: "Lock",
   CommandVerbLock: "lock",
   LockPageLeavingWarning: "If you leave the page now, pending items will not be locked.",
   LockItemsNoneMessage: "No items locked.",
   LockOneItemSuccessMessage: "1 item successfully locked.",
   LockSomeItemsSuccessMessage: "{0} items successfully locked.",
   LockManyItemsSuccessMessage: "{0} items successfully locked.",
   LockOneItemFailMessage: "1 item failed to lock.",
   LockSomeItemsFailMessage: "{0} items failed to lock.",
   LockManyItemsFailMessage: "{0} items failed to lock.",

    // Unlock
    CommandNameUnlock: "Unlock",
    CommandVerbUnlock: "unlock",
    UnlockPageLeavingWarning: "If you leave the page now, pending items will not be unlocked.",
    UnlockItemsNoneMessage: "No items unlocked.",
    UnlockOneItemSuccessMessage: "1 item successfully unlocked.",
    UnlockSomeItemsSuccessMessage: "{0} items successfully unlocked.",
    UnlockManyItemsSuccessMessage: "{0} items successfully unlocked.",
    UnlockOneItemFailMessage: "1 item failed to unlock.",
    UnlockSomeItemsFailMessage: "{0} items failed to unlock.",
    UnlockManyItemsFailMessage: "{0} items failed to unlock.",

});


csui.define('csui/utils/commands/email.link',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/url', 'csui/utils/command.error',
  'csui/models/command', 'csui/utils/commandhelper',
  'csui/models/version',
  'i18n!csui/utils/commands/nls/lang',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/node.info.sprites',
  'csui/lib/underscore.string'
], function (module, require, _, $, Url, CommandError, CommandModel,
    CommandHelper, VersionModel, publicLang, lang, extraLinksInfo) {
  'use strict';

  var config = _.extend({
    rewriteApplicationURL: false,
    enableAppleSupport: false,
    appleNodeLinkBase: 'x-otm-as-cs16://?launchUrl=nodes/'
  }, module.config());

  var nodeLinks, GlobalMessage,
      NEW_LINE = '\n'; // constant variable to add new line.

  var EmailLinkCommand = CommandModel.extend({
    defaults: {
      signature: 'EmailLink',
      name: lang.CommandNameEmailLink,
      verb: lang.CommandVerbEmailLink
    },

    enabled: function (status) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      return nodes && nodes.length;
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      status.suppressFailMessage = true;

      csui.require([
        'csui/utils/node.links/node.links',
        'csui/controls/globalmessage/globalmessage'
      ], function () {
        nodeLinks = arguments[0];
        GlobalMessage = arguments[1];
        if (status.originatingView && status.originatingView.blockActions) {
          status.originatingView.blockActions();
        }
        var context = status.context || (options && options.context);
        // LPAD-83785: The _getNodesLinks() function calls 'getCustomUrl', which is currently coded as a synchronous
        // ajax call.  This causes the browser to lock up while waiting for the synchronous call to finish for each
        // selected node.  We need to use setTimeout to create a small delay to allow things like the progressblocker
        // display the spinning wheel before these calls start.  Once they fix their code and make the calls
        // asynchronous, this hack can be removed.
        setTimeout(function () {
          // TODO: Share the node e-mail link gathering code and the e-mail formatting code by creating a new module for it
          var nodes = CommandHelper.getAtLeastOneNode(status);
          var applicationUrl = self._getApplicationUrl(nodes, context);
          var body = self._getNodesLinks(nodes, applicationUrl, context);
          var newHref = 'mailto:?subject=' + self._getEMailSubject(nodes) + '&body=' + encodeURIComponent(body);
          var error = self._openNewHref(newHref);

          if (error) {
            var message = error.errorDetails || error.message;
            GlobalMessage.showMessage("error", message);
            deferred.reject(error);
          } else {
            deferred.resolve();
          }

          if (status.originatingView && status.originatingView.unblockActions) {
            status.originatingView.unblockActions();
          }
        }, 100);
      }, deferred.reject);

      return deferred.promise();
    },

    _getEMailSubject: function(nodes) {
      var title = " ";
      if (nodes && nodes.length === 1) {
        title = nodes.first().get('name');
      }
      return encodeURIComponent(title);
    },

    _getApplicationUrl: function (nodes) {
      var connector = nodes.first().connector;
      return Url.combine(new Url(connector.connection.url).getCgiScript(), '/app');
    },

    _openNewHref: function (newHref) {
      if (newHref.length > 2048) {
        return new CommandError(lang.EmailLinkCommandFailedWithTooMuchItemsErrorMessage);
      } else {
        window.location.href = newHref;
      }
    },

    isiOSEnabled: function (nodes) {
      // currently there is no mobile support for versions and also the iOSText is not formed
      // using nodeLinks.getUrl but instead uses only nodeId. So, disabling this flag if it being
      // executed for a version.
      return config.enableAppleSupport && !(nodes.first() instanceof VersionModel);
    },

    _getNodesLinks: function (nodes, applicationUrl, context) {

      var iOSEnabled  = this.isiOSEnabled(nodes),
          iOSText     = lang.EmailAppleLinkFormat,
          androidText = publicLang.EmailLinkDesktop + NEW_LINE,
          desktopText = nodes.map(function (node) {
            var name         = node.get('name') + ":",
                actionUrl = nodeLinks.getUrl(node, {context: context}),
                nodeLinkInfo = '';
            
            if (config.rewriteApplicationURL) {
              // This disallows using the hash part, when the slash-based routing is enabled.
              // But it should be no problem, because it is temporary for the mobile
              // application only. and it didn't offer such contract for the old scenarios.
              var hash = actionUrl.lastIndexOf('#');
              if (hash >= 0) {
                actionUrl = applicationUrl + '/' + actionUrl.substr(hash + 1);
              }
            }

            if (iOSEnabled) {
              // This is not the node ID returned by nodeLinks.getUrl.
              // There is no extensibility applied, which can happen there.
              // I am not sure, if it is worth to fix it.
              var nodeId = (node.get('type') === 1) ? node.original.get('id') : node.get('id');
              iOSText += NEW_LINE + name + NEW_LINE + config.appleNodeLinkBase +
                         nodeId;
            }

            nodeLinkInfo = name + NEW_LINE + actionUrl;

            // Currently, the version model doesn't expect any additional info.
            // TODO: As the command seems dependent on a node model, see if it would be better
            // for this to be refactored and extended by another command specifically written
            // for versions.
            if (extraLinksInfo && !(node instanceof VersionModel)) {
              extraLinksInfo.each(function (extraLinkInfo) {
                // TODO: need to check what parameters to be include in nodeLinksOptions
                var nodeLinksOptions = {
                      NEW_LINE: NEW_LINE,
                      context: context,
                      node: node
                    },
                    extraInfo        = '';
                try {
                  extraInfo = $.trim(extraLinkInfo.get('getCustomUrl')(nodeLinksOptions));
                } catch (error) {
                  console.error(error);
                }
                nodeLinkInfo += extraInfo.length ? (NEW_LINE + extraInfo + NEW_LINE) : '';
              });
            }

            return nodeLinkInfo;
          }).join(NEW_LINE);

      return iOSEnabled ? androidText + desktopText + NEW_LINE + NEW_LINE + iOSText : desktopText;

    }
  });

  return EmailLinkCommand;
});

csui.define('csui/utils/commands/execute.saved.query',[
  'require', 'csui/lib/jquery', 'csui/utils/commandhelper',
  'csui/models/command', 'i18n!csui/utils/commands/nls/localized.strings'
], function (require, $, CommandHelper, CommandModel, lang) {
  'use strict';

  var ExecuteSavedQueryCommand = CommandModel.extend({
    defaults: {
      signature: 'ExecuteSavedQuery',
      scope: 'single'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 258
             // If the object data does not contain the open-ability flag, consider
             // the object open-able for compatibility with older REST API.
             && node.get('openable') !== false;
    },

    execute: function (status, options) {
      var node    = CommandHelper.getJustOneNode(status),
          context = status.context || options && options.context;
      if (node.get('custom_view_search')) {
        // Custom Search has form created and assigned to it. Open from in sidepanel
        return this._openFormInSidepanel(node, context);
      } else {
        this._triggerSearchResults(node, context);
      }
    },

    _triggerSearchResults: function (node, context) {
      var deferred = $.Deferred();
      csui.require([
        'csui/utils/contexts/factories/search.query.factory'
      ], function (SearchQueryModelFactory) {
        var searchQuery = context.getModel(SearchQueryModelFactory);
        searchQuery.clear({silent: true});
        searchQuery.set('query_id', node.get('id'));
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },

    _openFormInSidepanel: function (node, context) {
      var deferred = $.Deferred();
      csui.require(
          ['csui/controls/side.panel/side.panel.view',
            'csui/widgets/search.custom/impl/search.object.view',
            'csui/widgets/search.custom/impl/search.customquery.factory'],
          function (SidePanelView, SearchCustomObjectView, SearchCustomQueryFactory) {
            var savedQuery = context.getCollection(SearchCustomQueryFactory, {
              attributes: {
                id: node.get('id')
              }
            });
            savedQuery.ensureFetched().then(function () {
              var schema = savedQuery.get('schema'),
                  title  = schema.title ? schema.title : node.get('name');

              var customSearchForm = new SearchCustomObjectView({
                context: context,
                model: savedQuery,
                savedSearchQueryId: node.get('id'),
                hideSearchButton: true,
                showInSearchResultsNewPerspective: true
              });

              var sidePanel = new SidePanelView({
                slides: [{
                  title: title,
                  content: customSearchForm,
                  footer: {
                    buttons: [{
                      label: lang.searchButtonMessage,
                      type: 'action',
                      id: 'search-btn',
                      className: 'binf-btn binf-btn-primary',
                      disabled: false
                    }]
                  }
                }],
                sidePanelClassName: 'cvs-in-sidepanel'
              });
              customSearchForm.listenTo(customSearchForm, 'render:form', function() {
                sidePanel.triggerMethod('set:focus');
              });
              sidePanel.show();
              sidePanel.listenTo(customSearchForm, "button:click", function (actionButton) {
                if (actionButton.id === 'search-btn') {
                  customSearchForm.loadCustomSearch();
                }
                sidePanel.hide();
              });

              sidePanel.listenTo(customSearchForm, 'enable:search', function (isSearchEnabled) {
                customSearchForm.trigger("update:button", "search-btn", {
                  disabled: !isSearchEnabled
                });
              });

              sidePanel.listenTo(customSearchForm, 'click:search', function () {
                // Close Side panel when search triggered from CVS as it would navigate to search result.
                sidePanel.hide();
              });
              deferred.resolve();
            })
                .fail(function () {
                  deferred.reject();
                });
          }, deferred.reject);
      return deferred.promise();
    }
  });

  return ExecuteSavedQueryCommand;
});

csui.define('csui/utils/commands/execute.search.form.query',[
    'require', 'csui/lib/jquery', 'csui/utils/commandhelper',
    'csui/models/command', 'i18n!csui/utils/commands/nls/localized.strings'
  ], function (require, $, CommandHelper, CommandModel, lang) {
    'use strict';
  
    var ExecuteSearchFormQueryCommand = CommandModel.extend({
      defaults: {
        signature: 'ExecuteSearchForm',
        scope: 'single'
      },
  
      enabled: function (status) {
        var node = CommandHelper.getJustOneNode(status);
        return node && node.get('type') === 292;
      },
  
      execute: function (status, options) {
        var node    = CommandHelper.getJustOneNode(status),
            context = status.context || options && options.context;
        if (node.get('type')) {
          // Custom Search has form created and assigned to it. Open from in sidepanel
          return this._openFormInSidepanel(node, context);
        } else {
          this._triggerSearchResults(node, context);
        }
      },
  
      _triggerSearchResults: function (node, context) {
        var deferred = $.Deferred();
        csui.require([
          'csui/utils/contexts/factories/search.formquery.factory'
        ], function (SearchQueryModelFactory) {
          var searchQuery = context.getModel(SearchQueryModelFactory);
          searchQuery.clear({silent: true});
          searchQuery.set('query_id', node.get('id'));
          deferred.resolve();
        }, deferred.reject);
        return deferred.promise();
      },
  
      _openFormInSidepanel: function (node, context) {
        var deferred = $.Deferred();
        csui.require(
            ['csui/controls/side.panel/side.panel.view',
              'csui/widgets/search.forms/search.form.view',
              'csui/widgets/search.forms/search.form.factory'],
            function (SidePanelView, SearchFormView, SearchFormQueryFactory) {
              var savedQuery = context.getCollection(SearchFormQueryFactory, {
                attributes: {
                  id: node.get('id')
                }
              });
              savedQuery.ensureFetched().then(function () {
                var schema = savedQuery.get('schema'),
                    title  = schema.title ? schema.title : node.get('name');
  
                var searchFormView = new SearchFormView({
                  context: context,
                  model: savedQuery,
                  searchFormId: node.get('id'),
                  hideSearchButton: true,
                  showInSearchResultsNewPerspective: true
                });
  
                var sidePanel = new SidePanelView({
                  slides: [{
                    title: title,
                    content: searchFormView,
                    footer: {
                      buttons: [{
                        label: lang.searchButtonMessage,
                        type: 'action',
                        id: 'search-btn',
                        className: 'binf-btn binf-btn-primary',
                        disabled: false
                      }]
                    }
                  }],
                  sidePanelClassName: 'cvs-in-sidepanel'
                });
                searchFormView.listenTo(searchFormView, 'render:form', function() {
                  sidePanel.triggerMethod('set:focus');
                });
                sidePanel.show();
                sidePanel.listenTo(searchFormView, "button:click", function (actionButton) {
                  if (actionButton.id === 'search-btn') {
                    searchFormView.loadCustomSearch();
                  }
                  sidePanel.hide();
                });
  
                sidePanel.listenTo(searchFormView, 'enable:search', function (isSearchEnabled) {
                    searchFormView.trigger("update:button", "search-btn", {
                    disabled: !isSearchEnabled
                  });
                });
  
                sidePanel.listenTo(searchFormView, 'click:search', function () {
                  // Close Side panel when search triggered from CVS as it would navigate to search result.
                  sidePanel.hide();
                });
                deferred.resolve();
              })
                  .fail(function () {
                    deferred.reject();
                  });
            }, deferred.reject);
        return deferred.promise();
      }
    });
  
    return ExecuteSearchFormQueryCommand;
  });
  
csui.define('csui/utils/commands/favorite.add',["require", 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore',
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commandhelper", "csui/utils/commands/node",
  'csui/utils/command.error'
], function (require, $, base, _, lang, CommandHelper, NodeCommand, CommandError) {
  'use strict';

  var FavoriteCommand = NodeCommand.extend({

    defaults: {
      signature: "Favorite",
      command_key: ['favorite', 'favorite'],
      scope: "single",
      name: lang.CommandNameFavorite,
      verb: lang.CommandVerbFavorite,
      doneVerb: lang.CommandDoneVerbFavorite
    },

    //only one node allowed at a time
    enabled: function (status, options) {
      if (options && options.data && options.data.useContainer) {
        return status.container && !status.container.get('favorite');
      } else {
        var nodes = CommandHelper.getAtLeastOneNode(status);
        return nodes && (nodes.length === 1) && !nodes.models[0].get('favorite');
      }
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      var originatingView = status.originatingView;

      csui.require([
        'csui/models/favorite.model',
        'csui/dialogs/modal.alert/modal.alert'
      ], function (FavoriteModel, ModalAlert) {
        var model;
        if (status.data && status.data.useContainer) {
          model = status.container;
        } else {
          model = status.nodes.models[0];
        }
        var modelId = model.get('id');
        var favModel = new FavoriteModel({
              node: model,
              id: modelId,
              selected: false
            },
            {connector: model.connector}
        );
        favModel.addToFavorites()
            .done(function (results) {
              model.set('favorite', true);
              originatingView.trigger('fav:change');
              deferred.resolve(results);
            })
            .fail(function (err) {
              deferred.reject(new CommandError(err));
            });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });

  return FavoriteCommand;

});

csui.define('csui/utils/commands/favorite.remove',["require", 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore',
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commandhelper", "csui/utils/commands/node",
  'csui/utils/command.error'
], function (require, $, base, _, lang, CommandHelper, NodeCommand, CommandError) {
  'use strict';

  var NonFavoriteCommand = NodeCommand.extend({

    defaults: {
      signature: "NonFavorite",
      command_key: ['nonfavorite', 'NonFavorite'],
      scope: "single",
      verb: lang.CommandVerbFavorite,
      doneVerb: lang.CommandRemovedVerbFavorite
    },

    //only one node allowed at a time
    enabled: function (status, options) {
      if (options && options.data && options.data.useContainer) {
        return status.container && status.container.get('favorite');
      } else {
        var nodes = CommandHelper.getAtLeastOneNode(status);
        return nodes && (nodes.length === 1) && nodes.models[0].get('favorite');
      }
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      var originatingView = status.originatingView;

      csui.require([
        'csui/models/favorite.model',
        'csui/dialogs/modal.alert/modal.alert'
      ], function (FavoriteModel, ModalAlert) {
        var model;
        if (status.data && status.data.useContainer) {
          model = status.container;
        } else {
          model = status.nodes.models[0];
        }
        var modelId = model.get('id');
        var favModel = new FavoriteModel({
              node: model,
              id: modelId,
              selected: false
            },
            {connector: model.connector}
        );
        favModel.removeFromFavorites()
            .done(function (results) {
              model.set('favorite', false);
              originatingView.trigger('fav:change');
              deferred.resolve(results);
            })
          .fail(function (err) {
            deferred.reject(new CommandError(err));
          });

      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });

  return NonFavoriteCommand;

});

csui.define('csui/utils/commands/inlineedit',["require", "csui/lib/underscore", "csui/lib/jquery",
  "csui/models/command", "csui/utils/commandhelper"
], function (require, _, $, CommandModel, CommandHelper) {
  'use strict';

  var InlineEditCommand = CommandModel.extend({

    defaults: {
      signature: "InlineEdit",
      // Inline editing may need more permissions than just for renaming;
      // if it was a problem the login would have to be extended.
      command_key: ['rename', 'Rename'],
      scope: "single"
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/controls/table/inlineforms/inlineform.factory'
      ], function (inlineFormViewFactory) {
        var node = status.nodes && status.nodes.length === 1 && status.nodes.at(0);

        var inlineFormView = inlineFormViewFactory.getInlineFormView(node.get('type'));
        if (!inlineFormView) {
          // fallback to generic for rename action
          inlineFormView = inlineFormViewFactory.getInlineFormView(-1);
        }
        if (inlineFormView) {
          node.inlineFormView = inlineFormView;
          node.set('csuiInlineFormErrorMessage', 'dummy', {silent: true});
          node.unset('csuiInlineFormErrorMessage');
        }

        deferred.resolve();
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  _.extend(InlineEditCommand, {

    version: "1.0"

  });

  return InlineEditCommand;

});


csui.define('csui/utils/commands/move',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commands/copy.move',
  'csui/utils/url',
  'csui/utils/command.error',
  'csui-ext!csui/utils/commands/move'
], function (module, require, _, $, lang, ActionModel, Url, CommandError, MoveCallEndPoint) {
  'use strict';

  var config = _.extend({}, module.config());
  _.defaults(config, {
    actionType: 'move',
    parallelism: 3,
    allowMultipleInstances: true
  });
  
  var MoveCommand = ActionModel.extend({
    defaults: {
      signature: "Move",
      command_key: ['move', 'Move'],
      name: lang.CommandNameMove,
      verb: lang.CommandNameVerbMove,
      pageLeavingWarning: lang.MovePageLeavingWarning,
      allowMultipleInstances: config.allowMultipleInstances,
      scope: "multiple",
      successMessages: {
        formatForNone: lang.MoveItemsNoneMessage,
        formatForOne: lang.MoveOneItemSuccessMessage,
        formatForTwo: lang.MoveSomeItemsSuccessMessage,
        formatForFive: lang.MoveManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.MoveItemsNoneMessage,
        formatForOne: lang.MoveOneItemFailMessage,
        formatForTwo: lang.MoveSomeItemsFailMessage,
        formatForFive: lang.MoveManyItemsFailMessage
      },
      labels: {
        actionName: lang.MovingNodes,
        actionNode: lang.MovingNode,
        commandTitle: lang.CommandTitleMove,
        commandName: lang.CommandNameMove,
        dialogTitle: lang.DialogTitleMove,
        dialogTitleSingle: lang.DialogTitleSingleMove,
        titleNotAllowed: lang.MoveNotAllowed
      },
      command: config.actionType

    },

    allowCollectionRefetch: false,

    _doActionSelectedNodes: function (opts) {
      var exResult = $.Deferred();
      csui.require(['csui/utils/contexts/factories/next.node',
            'csui/controls/globalmessage/globalmessage', 'csui/utils/taskqueue'],
          _.bind(function (NextNodeModelFactory, GlobalMessage, TaskQueue) {

            var self     = this,
                queue    = new TaskQueue({
                  parallelism: config.parallelism
              }),
              selectedNodeIds = opts.status && opts.status.nodes && opts.status.nodes.models.map(function (model) {
                return model.get('id');
              });

            this.getExternalBodyParams(opts.connector, selectedNodeIds).then(function (extBodyParams) {
                  var promises = _.map(opts.uploadCollection.models, function (model) {
                  var deferred = $.Deferred();
                  queue.pending.add({
                    worker: function () {
                      var promise,
                          attributes = model.attributes;
                      model.node.trigger('before:move', model.node);
                      if (attributes.extended_data && attributes.extended_data.roles) {
                        // metadata was already set interactively by the user via MetadataView
                        promise = self._actionNodeWithMetadata(attributes, opts.connector,
                            opts.targetFolder.get('id'), opts.status, extBodyParams);
                      } else {
                        promise = self._moveNode(attributes, opts.connector,
                            opts.targetFolder.get('id'),
                            opts.applyProperties, opts.status, extBodyParams);
                      }
                      promise
                          .done(function () {
                            model.node.trigger('move', model.node);
                            model.set('count', 1);
                            model.deferred.resolve(model);
                            deferred.resolve(model);
                          })
                          .fail(function (cause) {
                            var errObj = new CommandError(cause);
                            model.deferred.reject(model, errObj);
                            deferred.reject(errObj);
                          });
                      return deferred.promise();
                    }
                  });
                  return deferred.promise(promises);      // return promises
                });
                return $.whenAll.apply($, promises).then(exResult.resolve, exResult.reject);
              });

            GlobalMessage.showProgressPanel(opts.uploadCollection, {
              oneFileTitle: lang.MovingOneItem,
              oneFileSuccess: lang.MoveOneItemSuccessMessage,
              multiFileSuccess: lang.MoveManyItemsSuccessMessage,
              oneFilePending: lang.MovingOneItem,
              multiFilePending: lang.MovingItems,
              multiFileOneFailure: lang.MoveManyItemsOneFailMessage,
              oneFileFailure: lang.MoveOneItemFailMessage,
              multiFileFailure: lang.MoveManyItemsFailMessage,
              someFileSuccess: lang.MoveSomeItemsSuccessMessage,
              someFilePending: lang.MovingSomeItems,
              someFileFailure: lang.MoveSomeItemsFailMessage,
              locationLabelPending: lang.MovingLocationLabel,
              locationLabelCompleted: lang.MovedLocationLabel,
              enableCancel: false,
              actionType: config.actionType,
              allowMultipleInstances: config.allowMultipleInstances,
              context: opts.context,
              nextNodeModelFactory: NextNodeModelFactory
            });
            this._unblockPageActions(opts.status);       

          }, this), exResult.reject);
      return exResult.promise();
    },

    _moveNode: function (instruction, connector, targetFolderID, applyProperties, status, extBodyParams) {
      var self = this;
      var deferred= $.Deferred();
      return this._getCategories(connector, instruction.id, targetFolderID, applyProperties)
          .then(function (categories) {
            var categoryGroupMapping;
            var bodyParam;
            var moveOptions;

            categoryGroupMapping = {};
            csui.require(
              ['csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view'],
              function (ApplyPropertiesSelectorView) {
                categoryGroupMapping[ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES] = 'original';
                categoryGroupMapping[ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES] = 'destination';
                categoryGroupMapping[ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES] = 'merged';

                bodyParam = {
                  "parent_id": targetFolderID,
                  "name": instruction.newName ? instruction.newName : instruction.name,
                  "roles": {
                    "categories": categories[categoryGroupMapping[applyProperties]]
                  }
                };
                _.extend(bodyParam, instruction.extended_data);
                _.isFunction(self.checkMultilingualInfo) && self.checkMultilingualInfo(instruction, bodyParam);
                bodyParam = _.extend({}, extBodyParams, bodyParam);
                moveOptions = {
                  url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/',
                    instruction.id),
                  method: 'PUT',
                  data: bodyParam,
                  contentType: connector.getAjaxContentType()
                };

                connector.makeAjaxCall(moveOptions).then(function (model) {
                  deferred.resolve(model);
                }).fail(function (error) {
                  deferred.reject(error);

                });

              });
            return deferred.promise();
          });
    },

    externalBodyParams: {},

    getExternalBodyParams: function (connector, selectedNodeIds) {
      return $.Deferred().resolve(this.externalBodyParams).promise();
    },

    _doPostExecute: function (opts) {
      var self = this,
      uploadFileModels = [],
      //After move operation, instead of removing nodes from collection update its location for below application scope ids
      applicationScopeIds = ["recentlyaccessed", "favorites", "searchresults"],
      replaceParentId = applicationScopeIds.indexOf(opts.applicationScopeId) !== -1;
      //Remove uploadable nodes, not selected items
      opts.uploadCollection.models && opts.uploadCollection.models.length > 0 &&
      _.each(opts.uploadCollection.models, function (filemodel) {
        if (replaceParentId) {
          filemodel.node.attributes.parent_id_expand = opts.targetFolder.attributes;
        }
        uploadFileModels.push(filemodel.node);
      });
      // status.collection can be undefined; for example: go to Properties
      // dropdown menu of the current folder in table header, then use the
      // Move command from the item's dropdown menu in Properties view.
      if (self.nodePicker && self.nodePicker._dialog && self.nodePicker._dialog.isDestroyed) {
        if (replaceParentId && opts.status.collection) {
          uploadFileModels.forEach(function (model) {
            var index = opts.status.collection.findIndex(model);
            opts.status.collection.remove(model);
            opts.status.collection.add(model, { at: index });
          });
        } else {
          opts.status.collection && opts.status.collection.remove(uploadFileModels);     // remove only processed nodes and not all selected
        //to refetch collection in table View
          self.allowCollectionRefetch = true;
        }
        return uploadFileModels;
      }
    },

    _getCategories: function (connector, nodeID, targetFolderID, applyProperties) {
      if (!!applyProperties && applyProperties === 1) { // keep the original categories.
        return $.Deferred().resolve({}).promise();
      }
      var getCategoriesOptions = {
        url: connector.connection.url + '/forms/nodes/move?' +
             $.param({
               id: nodeID,
               parent_id: targetFolderID
             })
      };

      return connector.makeAjaxCall(getCategoriesOptions)
          .then(function (response) {
            var form = response.forms[1];
            return form && form.data || {};
          });
      },

      _actionNodeWithMetadata: function (instruction, connector, targetFolderID, status, extBodyParams) {
        var self = this;
          var bodyParam = _.extend({}, extBodyParams, {
            "parent_id": targetFolderID,
            "name": instruction.newName ? instruction.newName : instruction.name
          }),
            moveOptions = {
              url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/',
                instruction.id),
              method: 'PUT',
              data: bodyParam,
              contentType: connector.getAjaxContentType()
            };
            _.extend(bodyParam, instruction.extended_data);
          return connector.makeAjaxCall(moveOptions);
      }
    });

    return MoveCommand;
  });

csui.define('csui/utils/commands/navigate',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
  'csui/utils/commandhelper', 'csui/models/command',
  'csui/models/node/node.model', 'csui/utils/node.links/node.links'
], function (module, _, $, base, CommandHelper, CommandModel, NodeModel,
    nodeLinks) {
  'use strict';

  var config = _.extend({
    openInNewTab: true
  }, module.config());

  var NavigateCommand = CommandModel.extend({

    defaults: {
      signature: 'Navigate'
    },

    // As long as you can see the URL object, you can navigate to the target
    // URL stored on it.
    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 140;
    },

    execute: function (status, options) {
      var node = CommandHelper.getJustOneNode(status);
      return this._navigateTo(node, options);
    },

    _navigateTo: function (node, options) {
      var url = node.get('url'),
          promise = $.Deferred(),
          content;

      function finish() {
        content || (content = window);
        content.location.href = nodeLinks.completeUrl(node, url);
        content.focus();
        promise.resolve();
      }

      if (config.openInNewTab) {
        content = window.open('', '_blank');
        // Calling window.open("") returns null in the SAP Fiori Client.
        if (!content || !content.location) {
          content = null;
        }
      }

      if (url) {
        finish();
      } else {
        // The node model does not contain the URL information; not every
        // REST API call may return it, unfortunately.
        node = new NodeModel({id: node.get('id')}, {
          connector: node.connector,
          fields: {
            properties: ['url']
          }
        });
        node.fetch()
            .done(function () {
              url = node.get('url');
              if (url) {
                finish();
              } else if (content) {
                content.close();
              }
            })
            .fail(function (request) {
              if (content) {
                content.close();
              }
              promise.reject(new base.Error(request));
            });
      }
      return promise.promise();
    }

  });

  return NavigateCommand;
});


csui.define('csui/utils/commands/open.plugins/open.plugins',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external document opening plugin rules
  'csui-ext!csui/utils/commands/open.plugins/open.plugins'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var OpenPluginModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      plugin: null
    },

    constructor: function OpenPluginModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(OpenPluginModel.prototype);

  var OpenPluginCollection = Backbone.Collection.extend({
    model: OpenPluginModel,
    comparator: 'sequence',

    constructor: function OpenPluginCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByNode: function (node, options) {
      var openInNewTab, widgetOnly;
      if (options) {
        openInNewTab = options.openInNewTab;
        widgetOnly = options.widgetOnly;
      }
      var rule = this.find(function (item) {
        var plugin = item.get('plugin');
        // Plugins opening a full page can be used in both
        // the current and a new windows, unless a widget
        // was requested.
        return (widgetOnly !== true &&
                (plugin.openWindow || plugin.getUrl ||
                plugin.getUrlQuery) ||
                // Plugins supporting only a widget mode can be
                // opened in the current window only (for now).
                widgetOnly !== false && openInNewTab !== true &&
                (plugin.openWidget || plugin.createWidget)
               ) && item.matchRules(node, item.attributes);
      });
      return rule && rule.get('plugin');
    }
  });

  var openPlugins = new OpenPluginCollection();

  if (rules) {
    openPlugins.add(_.chain(rules)
                     .flatten(true)
                     .map(function (rule) {
                       return _.defaults({
                         plugin: new rule.plugin()
                       }, rule);
                     })
                     .value());
  }

  return openPlugins;
});

csui.define('csui/utils/commands/open',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/url', 'csui/models/node.actions', 'csui/utils/commandhelper', 'csui/utils/commands/download',
  'csui/utils/commands/open.plugins/open.plugins'
], function (module, require, _, $, Url, NodeActionCollection, CommandHelper, DownloadCommand, openPlugins) {
  'use strict';

  var config = _.extend({
    // If overridden, true will always open a new window,
    // false will always use the current window.
    openInNewTab: null,

    // If overridden, true will always download the document;
    // opening it in the viewer or natively will not be offered.
    forceDownload: false,	
	
    extSupportTypes: {}
  }, module.config());
  
   var supportTypes = [144, 749, 736, 2];
  supportTypes = Array.prototype.concat.apply(supportTypes, _.values(config.extSupportTypes));

  var openAuthenticatedPage, NextNodeModelFactory;

  var OpenCommand = DownloadCommand.extend({
    defaults: {
      signature: 'Open',
      // Open has a different UI behaviour than download, but both are about
      // the content access, which decide the permission.  There is no
      // 'open-document' action anyway in the current REST API response.
      command_key: ['default', 'open', 'download', 'Download'],
      scope: 'single',

      openable: true,
      types: supportTypes
    },

    // TODO: Ask for content:true to be added to the REST API. They added
    // versionable:true, which will be great for the version history enabling,
    // but not for content opening, because containers can be versionable too.
    // TODO: Move E-mail and Drawing to their modules
    // TODO: Deprecate this command in favour of OpenDocument. Introduce a new
    // OpenDocumentContent command, which will check permissions properly.
    // Permitted actions for content access are not checked in the enabled method! This was
    // the usability compromise done when "fast-browsing" was introduced.
    // The permissions are checked before the execution. If they are missing,
    // the document perspective will be opened instead of the content, which
    // is not what the Open command originally did. It is what the
    // configurable OpenDocument command does.

    execute: function (status, options) {
      var node = this._getNode(status);
      // check permission before execution, show overview page if not permitted.
      return this.checkPermission(node).then(_.bind(function(permitted) {
        if(!permitted) {
          return this._showOverview(node, options);
        }

        if (config.forceDownload) {
          return this._downloadContent(node, options, 'download');
        }

        var plugin = openPlugins.findByNode(node, {
          openInNewTab: config.openInNewTab
        });

        return plugin ? this._openContent(node, options, plugin) : this._downloadContent(node, options, 'download');
      }, this));
    },

    _openContent: function (node, options, plugin) {
      if (config.openInNewTab) {
        return this._openWindow(plugin, node, window.open(''), options);
      }
      if (plugin.widgetView) {
        return this._openWidget(plugin.widgetView, node, options);
      }
      var content = config.openInNewTab === false ?
                    window : window.open('');

      return this._openWindow(plugin, node, content, options);
    },

    _openWidget: function (view, node, options) {
      var deferred = $.Deferred();
      csui.require([
        'csui/utils/commands/impl/full.page.modal/full.page.modal.view',
        view
      ], function (FullPageModal, ViewerView) {
        var viewerView = new ViewerView({
              context: options.context,
              model: node
            }),
            fullPageModal = new FullPageModal({
              view: viewerView
            });
        fullPageModal.on('destroy', function () {
                       deferred.resolve();
                     })
                     .show();
      }, deferred.reject);
      return deferred.promise();
    },

    _openWindow: function (plugin, node, content, options) {
      var deferred = $.Deferred();
      var self = this;
      csui.require([
        'csui/utils/open.authenticated.page'
      ], function () {
        openAuthenticatedPage = arguments[0];
        // Calling window.open("") returns null in the SAP Fiori Client.
        var opened = true;
        if (!content || !content.location) {
          content = parent.window;
          opened = false;
        }
        // Prefer the full-URL-retrieving method, then try
        // the URL-query-only-retrieving method
        var promise = plugin.getUrl && plugin.getUrl(node) ||
                      plugin.getUrlQuery(node);
        promise.then(function (url) {
          return self._openURL(plugin, node, content, url, options);
        }, function (error) {
          if (opened && content !== window) {
            content.close();
          }
          deferred.reject(error);
          return $.Deferred().reject();
        })
        .then(function () {
          if (opened) {
            content.focus();
          }
          deferred.resolve();
        });
      }, deferred.reject);
      return deferred.promise();
    },

    _openURL: function (plugin, node, content, url, options) {
      var connector = node.connector || options.connector;
      // If the URL-query-only-retrieving method was used,
      // prepend the CGI URL base to complete the URL
      if (!plugin.getUrl) {
        url = Url.appendQuery(
            new Url(connector.connection.url).getCgiScript(),
            Url.combineQueryString(url));
      }
      if (plugin.needsAuthentication && plugin.needsAuthentication(node)) {
        return openAuthenticatedPage(connector, url, {
          window: content,
          openInNewTab: config.openInNewTab
        });
      }
      content.location.href = url;
      return $.Deferred().resolve().promise();
    },

    // public method for other components to check if permissions are enabled for this command.
    checkPermission: function (node) {
      function doCheckActions () {
        if(node.actions.get('download')) {
          return true;
        } else {
          return false;
        }
      }

      if(!node.actions.length) {
        // fetch the openable actions and append to the node for reuse.
        var openables = new NodeActionCollection(undefined, {
          connector: node.connector,
          nodes: [ node.get('id') ],
          commands: [ 'download' ]
        });

        var promise = $.Deferred();

        openables.fetch().then(function () {
          var nodeId = node.get('id');
          var openable = openables.get(nodeId);
          node.actions.add(openable.actions.models);
          var permitted = doCheckActions();
          promise.resolve(permitted);
        });

        return promise;
      } else {
        // actions are already available, make the check.
        return $.Deferred().resolve(doCheckActions()).promise();
      }
    },

    _showOverview: function (node, options) {
      var deferred = $.Deferred();
      csui.require([
        'csui/utils/contexts/factories/next.node'
      ], function () {
        NextNodeModelFactory = arguments[0];
        var nextNode = options.context.getModel(NextNodeModelFactory);
        var nodeId = node.get('id');

        nextNode.set('id', nodeId);
      }, deferred.reject);

      return deferred.promise();
    }
  });

  return OpenCommand;
});

csui.define('csui/utils/commands/open.discussion',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenDiscussionCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenDiscussion'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 215;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'view',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenDiscussionCommand;

});

csui.define('csui/utils/commands/open.milestone',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenMilestoneCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenMilestone'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 212;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'BrowseMilestone',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenMilestoneCommand;

});

csui.define('csui/utils/commands/open.channel',['csui/utils/commandhelper',
  'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenChannelCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenChannel'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 207;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'ViewChannel',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenChannelCommand;

});


csui.define('csui/utils/commands/open.news',['csui/utils/commandhelper',
  'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenNewsCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenNews'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 208;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'ViewNews',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenNewsCommand;

});


csui.define('csui/utils/commands/open.poll',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenPollCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenPoll'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 218;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'OpenPoll',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenPollCommand;

});

csui.define('csui/utils/commands/open.prospector',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenProspectorCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenProspector'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 384;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'ProspectorBrowse',
        objId: node.get('id'),
        order: '-SCORE',
        summaries: 1,
        nexturl: location.href
      };
    }

  });

  return OpenProspectorCommand;

});

csui.define('csui/utils/commands/open.specific.classic.page',[
  'csui/utils/commands/open.classic.page',
  'csui/utils/commandhelper',
  'csui/utils/classic.nodes/classic.nodes'
], function (OpenClassicPageCommand, CommandHelper, classicNodes) {
  'use strict';

  var OpenSpecificClassicPageCommand = OpenClassicPageCommand.extend({
    defaults: {
      signature: 'OpenSpecificClassicPage'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node
          // If the object data does not contain the open-ability flag, consider
          // the object open-able for compatibility with older REST API.
          && node.get('openable') !== false
          && classicNodes.isSupported(node);
    },

    getUrl: function (node, options) {
      return classicNodes.getUrl(node);
    }
  });

  return OpenSpecificClassicPageCommand;
});

csui.define('csui/utils/commands/open.specific.node.perspective',[
  'csui/utils/commands/open.node.perspective',
  'csui/utils/commandhelper',
  'csui/utils/smart.nodes/smart.nodes'
], function (OpenNodePerspectiveCommand, CommandHelper, smartNodes) {
  'use strict';

  var OpenSpecificNodePerspectiveCommand = OpenNodePerspectiveCommand.extend({
    defaults: {
      signature: 'OpenSpecificNodePerspective'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node
          // If the object data does not contain the open-ability flag, consider
          // the object open-able for compatibility with older REST API.
          && node.get('openable') !== false
          && smartNodes.isSupported(node);
    }
  });

  return OpenSpecificNodePerspectiveCommand;
});

csui.define('csui/utils/commands/open.task',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenTaskCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenTask'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 206;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'BrowseTask',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenTaskCommand;

});

csui.define('csui/utils/commands/open.taskgroup',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenTaskGroupCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenTaskGroup'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 205;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'BrowseTaskGroup',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenTaskGroupCommand;

});

csui.define('csui/utils/commands/open.tasklist',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenTaskListCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenTaskList'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 204;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'BrowseTaskList',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenTaskListCommand;

});

csui.define('csui/utils/commands/open.topic',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var OpenTopicCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenTopic'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status),
          type = node && node.get('type');
      return type === 130 || type === 134;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'view',
        objId: node.get('id'),
        show: 1,
        nexturl: location.href
      };
    }

  });

  return OpenTopicCommand;

});

csui.define('csui/utils/commands/permissions',['module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/command.error', 'csui/utils/commandhelper',
  'csui/models/command', 'csui/models/nodes'
], function (module, require, _, $, Backbone, Marionette,
    CommandError, CommandHelper, CommandModel, NodeCollection) {
  'use strict';

  var PermissionsCommand = CommandModel.extend({

    defaults: {
      signature: 'permissions',
      command_key: ['permissions', 'Permissions'],
      scope: 'multiple',
      commands: 'csui/utils/commands'
    },

    _executeWithSaveState: function (status, options) {
      var deferred           = $.Deferred(),
          selected           = status.nodes,
          container          = status.container,
          navigationView     = true, nodes,
          metadatanavigation = !!status.originatingView ? status.originatingView.$el.closest(
              '.cs-metadata-navigation-wrapper') : [];

      if (selected && selected.first() === container) {
        // The container properties were requested for the container
        selected = container;
        navigationView = false;
      } else {
        nodes = this._getAtLeastOneNode(status);
        selected = selected.first();
      }

      var context = status.context || options && options.context;

      csui.require(['csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
        this.get('commands'), 'csui/utils/contexts/factories/metadata.factory'
      ], function (PermissioNavigationWidget, commands, MetadataFactory) {

        var nodeId = selected.get('id'), metadataModel;

        if (status.originatingView instanceof PermissioNavigationWidget) {
          // bring back shortcut Node and maintain in slected node  if at all node has any..
          !!status.originatingView.mdv && status.originatingView.mdv.model.get('shortcutNode') ?
          selected.attributes.shortcutNode = status.originatingView.mdv.model.get('shortcutNode') :
          selected;

          var shortcut = status.originatingView.mdv.model.get('shortcutNode');
          if (shortcut) {
            nodeId = shortcut.get('id');
          }

          metadataModel = context.getModel(MetadataFactory);
          var metadata_info   = metadataModel.get('metadata_info') || {};

          metadataModel.set('metadata_info', {
            id: nodeId,
            model: selected,
            navigationView: navigationView,
            originatingView: status.originatingView,
            targetView: status.originatingView,
            collection: metadata_info.collection,
            navigator: metadata_info.navigator,
            commands: commands,
            showCloseIcon: status.originatingView ? false : true,
            showBackIcon: status.originatingView ? true : false,
            selectedTab: status.selectedTab,
            showPermissionView: true
          });

        }
        else if (navigationView) {
          if (status.collection && status.collection.models &&
              status.collection.models.length > 0) {

            metadataModel = context.getModel(MetadataFactory);
            metadataModel.set('metadata_info', {
              id: nodeId,
              navigator: true,
              model: selected,
              containerCollection: status.collection,  // this is the full collection
              collection: nodes,  // as UX design, this collection can be a subset
              selected: selected,
              originatingView: status.originatingView,
              commands: commands,
              isExpandedView: status.originatingView &&
                              !!status.originatingView.options.isExpandedView,
              nameAttribute: options ? options.nameAttribute : undefined,
              showCloseIcon: status.originatingView ? false : true,
              selectedTab: status.selectedTab,
              showPermissionView: true
            });

          } else {

            if (status.originatingView &&
                status.originatingView.supportOriginatingView === undefined) {
              status.originatingView.supportOriginatingView = true;
            }

            metadataModel = context.getModel(MetadataFactory);
            metadataModel.set('metadata_info', {
              id: nodeId,
              model: selected,
              navigationView: navigationView,
              originatingView: status.originatingView,
              targetView: status.originatingView,
              commands: commands,
              showCloseIcon: status.originatingView ? false : true,
              showBackIcon: status.originatingView ? true : false,
              selectedTab: status.selectedTab,
              showPermissionView: true
            });

          }
        } else {
          if (status.originatingView &&
              status.originatingView.supportOriginatingView === undefined) {
            status.originatingView.supportOriginatingView = true;
          }

          metadataModel = context.getModel(MetadataFactory);
          metadataModel.set('metadata_info', {
            id: nodeId,
            model: selected,
            navigationView: navigationView,
            originatingView: status.originatingView,
            targetView: status.originatingView,
            commands: commands,
            showCloseIcon: status.originatingView ? false : true,
            showBackIcon: status.originatingView ? true : false,
            selectedTab: status.selectedTab,
            showPermissionView: true
          });

        }

      });
      return deferred.promise();
    },

    _executeWithoutSaveState: function (status, options) {
      var self               = this,
          deferred           = $.Deferred(),
          selected           = status.nodes,
          container          = status.container,
          navigationView     = true, nodes,
          metadatanavigation = !!status.originatingView ? status.originatingView.$el.closest(
              '.cs-metadata-navigation-wrapper') : [];

      if (selected && selected.first() === container) {
        // The container properties were requested for the container
        selected = container;
        navigationView = false;
      } else {
        nodes = this._getAtLeastOneNode(status);
        selected = selected.first();
      }

      // The metadatanavigation view gets invoked from the nodestable and the search results
      // differently. In Both cases I did not see a reason why adding the cs-metadata-no-bg-color
      // class. Actually adding it creates an issues when the metadatanavigation is launched from
      // the nodestable.
      /*if (metadatanavigation.length > 0) {
        metadatanavigation.addClass("cs-metadata-no-bg-color");
      }*/

      var context = status.context || options && options.context;

      csui.require(['csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
        'csui/widgets/metadata/metadata.view', 'csui/controls/dialog/dialog.view',
        'csui/widgets/permissions/permissions.view', this.get('commands')
      ], function (PermissioNavigationWidget, MetadataView, DialogView, PermissionsView, commands) {

        var permissionsView, nodeId = selected.get('id'),
            showInDialogView        = status.data && !!status.data.dialogView;
        if (status.originatingView instanceof PermissioNavigationWidget) {
          // bring back shortcut Node and maintain in slected node  if at all node has any..
          !!status.originatingView.mdv && status.originatingView.mdv.model.get('shortcutNode') ?
          selected.attributes.shortcutNode = status.originatingView.mdv.model.get('shortcutNode') :
          selected;
          permissionsView = new MetadataView({
            model: selected,
            originatingView: status.originatingView,
            containerCollection: status.collection,
            context: context,
            commands: commands,
            showCloseIcon: status.originatingView ? false : true,
            showBackIcon: status.originatingView ? false : true,
            activeTab: status.originatingView.mdv && status.originatingView.mdv.metadataTabView &&
                       status.originatingView.mdv.metadataTabView.options.activeTab,
            selectedTab: status.originatingView.mdv && status.originatingView.mdv.metadataTabView &&
                         status.originatingView.mdv.metadataTabView.tabLinks.selected,
            showPermissionView: true
          });
        }
        else if (navigationView) {
          if (status.collection && status.collection.models &&
              status.collection.models.length > 0) {
            permissionsView = new PermissioNavigationWidget({
              container: container,
              containerCollection: status.collection,  // this is the full collection
              collection: nodes,  // as UX design, this collection can be a subset
              selected: selected,
              originatingView: status.originatingView,
              context: context,
              commands: commands,
              isExpandedView: status.originatingView &&
                              !!status.originatingView.options.isExpandedView,
              nameAttribute: options ? options.nameAttribute : undefined,
              showCloseIcon: status.originatingView ? false : true,
              selectedTab: status.selectedTab,
              showPermissionView: true
            });
          } else {
            if (status.originatingView &&
                status.originatingView.supportOriginatingView === undefined) {
              status.originatingView.supportOriginatingView = true;
            }
            permissionsView = new MetadataView({
              model: selected,
              originatingView: status.originatingView,
              targetView: status.originatingView,
              context: context,
              commands: commands,
              showCloseIcon: status.originatingView ? false : true,
              showBackIcon: status.originatingView ? true : false,
              selectedTab: status.selectedTab,
              showPermissionView: true
            });
            if (status.originatingView) {
              status.originatingView.permissionsView = permissionsView;
            }
          }
        } else {
          if (status.originatingView &&
              status.originatingView.supportOriginatingView === undefined) {
            status.originatingView.supportOriginatingView = true;
          }
          permissionsView = new MetadataView({
            model: selected,
            originatingView: status.originatingView,
            targetView: status.originatingView,
            context: context,
            commands: commands,
            showCloseIcon: status.originatingView ? false : true,
            showBackIcon: status.originatingView ? true : false,
            selectedTab: status.selectedTab,
            showPermissionView: true
          });
          if (status.originatingView) {
            status.originatingView.permissionsView = permissionsView;
          }
        }
        //Replace metadata content view with permissions widget
        if (status.originatingView instanceof PermissioNavigationWidget) {
          if (status.originatingView.mdv && status.originatingView.mdv.metadataTabView) {
            self.listenTo(permissionsView, 'metadata:close:without:animation', function () {
              if (status.originatingView.originatingView) {
                var $originatingView = status.originatingView.originatingView.$el,
                    $csProperties = $($originatingView.parent().find('.cs-properties-wrapper')[0]);
                $originatingView.show();
                status.originatingView.triggerMethod('dom:refresh');
                !!status.collection && (status.collection.requireSwitched = false);
                permissionsView.destroy();
                $csProperties.remove();
                deferred.resolve();
              }
            });
            status.originatingView.mdv.destroy();
            status.originatingView.showPermissionView = true;
            permissionsView.render();
            Marionette.triggerMethodOn(permissionsView, 'before:show');
            status.originatingView.$el.find(".metadata-content").append(permissionsView.el);
            Marionette.triggerMethodOn(permissionsView, 'show');
          }
        }// replace the originatingView with sliding left/right animation
        else if (status.originatingView && !showInDialogView) {

          var _showOriginatingView, $csProperties;
          var $originatingView = status.originatingView.$el;
          var ntWidthVal = $originatingView.width();
          var ntWidth = ntWidthVal + 'px';
          $originatingView.parent().append("<div class='cs-permissions-wrapper'></div>");
          $csProperties = $($originatingView.parent().find('.cs-permissions-wrapper')[0]);
          $csProperties.hide();
          permissionsView.render();
          _.isFunction(status.originatingView.unblockActions) && status.originatingView.unblockActions();
          Marionette.triggerMethodOn(permissionsView, 'before:show');
          $csProperties.append(permissionsView.el);

          $originatingView = $originatingView.parent().find(".cs-properties-wrapper").length > 0 ?
                             $originatingView.parent().find(".cs-properties-wrapper") :
                             $originatingView;

          $originatingView.hide();
          $csProperties.show();
          if (status.originatingView.metadataView) {
            $originatingView.parent().find(".cs-properties-wrapper").remove();
            status.originatingView.metadataView &&
            status.originatingView.metadataView.destroy();
          }
          Marionette.triggerMethodOn(permissionsView, 'show');
          $originatingView.promise().done(function () {
            status.originatingView.isDisplayed = false;
          });

          _showOriginatingView = function () {
            if (metadatanavigation.length > 0) {
              metadatanavigation.removeClass("cs-metadata-no-bg-color");
            }
            $csProperties.hide();
            status.originatingView.$el.show();
            status.originatingView.metadataView &&
            status.originatingView.metadataView.destroy();
            status.originatingView.permissionsView &&
            status.originatingView.permissionsView.destroy();
            status.originatingView.triggerMethod('dom:refresh');
            status.originatingView.isDisplayed = true;
            //reset required switch to default.
            !!status.collection && (status.collection.requireSwitched = false);
            // Trigger an event to let originating view aware of closing properties view and going back to it.
            // Hence originatingView can handle it and do necessary actions (if any).
            status.originatingView.trigger('permissions:view:destroyed');
            permissionsView.destroy();
            $csProperties.remove();
            deferred.resolve();

          };

          self.listenTo(permissionsView, 'metadata:close',
              _.bind(_showOriginatingView, self));
          self.listenTo(permissionsView, 'metadata:close:without:animation', function () {
            $originatingView.show();
            status.originatingView.triggerMethod('dom:refresh');
            !!status.collection && (status.collection.requireSwitched = false);
            permissionsView.destroy();
            $csProperties.remove();
            deferred.resolve();
          });

        } else {  // show permissionsView View in a modal dialog
          if (permissionsView.metadataTabView) {
            // edit permission popover should be in dialog element
            // not on body , else we loose focus on first element of popover
            permissionsView.metadataTabView.options.isExpandedView = true;
          }
          self.dialog = new DialogView({
            className: 'cs-permissions',
            largeSize: true,
            view: permissionsView
          });

          self.dialog.show();

          // UX specs does not have header bar
          self.dialog.ui.header.hide();
          self.dialog.listenTo(permissionsView, 'metadata:close', function () {
            self.dialog.destroy();
            deferred.resolve();
          });
          self.dialog.listenTo(permissionsView, 'metadata:close:without:animation',
              function () {
                self.dialog.destroy();
                deferred.resolve();
              });
        }
      });
      return deferred.promise();
    },

    execute: function (status, options) {
      var deferred           = $.Deferred(),
          selected           = status.nodes,
          container          = status.container,
          navigationView     = true, nodes,
          metadatanavigation = !!status.originatingView ? status.originatingView.$el.closest(
              '.cs-metadata-navigation-wrapper') : [];

      if (selected && selected.first() === container) {
        // The container properties were requested for the container
        selected = container;
        navigationView = false;
      } else {
        nodes = this._getAtLeastOneNode(status);
        selected = selected.first();
      }

      var context = status.context || options && options.context;

      csui.require(['csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
        this.get('commands'), 'csui/utils/contexts/factories/metadata.factory'
      ], function (PermissioNavigationWidget, commands, MetadataFactory) {

        var nodeId = selected.get('id'), metadataModel;

        if (status.originatingView instanceof PermissioNavigationWidget) {
          // bring back shortcut Node and maintain in slected node  if at all node has any..
          !!status.originatingView.mdv && status.originatingView.mdv.model.get('shortcutNode') ?
          selected.attributes.shortcutNode = status.originatingView.mdv.model.get('shortcutNode') :
          selected;

          var shortcut = status.originatingView.mdv.model.get('shortcutNode');
          if (shortcut) {
            nodeId = shortcut.get('id');
          }

          metadataModel = context.getModel(MetadataFactory);
          var metadata_info   = metadataModel.get('metadata_info') || {};

          metadataModel.set('metadata_info', {
            id: nodeId,
            model: selected,
            navigationView: navigationView,
            originatingView: status.originatingView,
            targetView: status.originatingView,
            collection: metadata_info.collection,
            navigator: metadata_info.navigator,
            commands: commands,
            showCloseIcon: status.originatingView ? false : true,
            showBackIcon: status.originatingView ? true : false,
            selectedTab: status.selectedTab,
            showPermissionView: true
          });

        }
        else if (navigationView) {
          if (status.collection && status.collection.models &&
              status.collection.models.length > 0) {

            metadataModel = context.getModel(MetadataFactory);
            metadataModel.set('metadata_info', {
              id: nodeId,
              navigator: true,
              model: selected,
              containerCollection: status.collection,  // this is the full collection
              collection: nodes,  // as UX design, this collection can be a subset
              selected: selected,
              originatingView: status.originatingView,
              commands: commands,
              isExpandedView: status.originatingView &&
                              !!status.originatingView.options.isExpandedView,
              nameAttribute: options ? options.nameAttribute : undefined,
              showCloseIcon: status.originatingView ? false : true,
              selectedTab: status.selectedTab,
              showPermissionView: true
            });

          } else {

            if (status.originatingView &&
                status.originatingView.supportOriginatingView === undefined) {
              status.originatingView.supportOriginatingView = true;
            }

            metadataModel = context.getModel(MetadataFactory);
            metadataModel.set('metadata_info', {
              id: nodeId,
              model: selected,
              navigationView: navigationView,
              originatingView: status.originatingView,
              targetView: status.originatingView,
              commands: commands,
              showCloseIcon: status.originatingView ? false : true,
              showBackIcon: status.originatingView ? true : false,
              selectedTab: status.selectedTab,
              showPermissionView: true
            });

          }
        } else {
          if (status.originatingView &&
              status.originatingView.supportOriginatingView === undefined) {
            status.originatingView.supportOriginatingView = true;
          }

          metadataModel = context.getModel(MetadataFactory);
          metadataModel.set('metadata_info', {
            id: nodeId,
            model: selected,
            navigationView: navigationView,
            originatingView: status.originatingView,
            targetView: status.originatingView,
            commands: commands,
            showCloseIcon: status.originatingView ? false : true,
            showBackIcon: status.originatingView ? true : false,
            selectedTab: status.selectedTab,
            showPermissionView: true
          });

        }

      });
      return deferred.promise();
    },

    _getAtLeastOneNode: function (status) {
      if (!status.nodes) {
        return new NodeCollection();
      }
      if (status.nodes.length === 1 && status.collection) {
        return status.collection;
      } else {
        return status.nodes;
      }
    }
  });
  return PermissionsCommand;
});
csui.define('csui/utils/commands/properties',['module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/command.error', 'csui/utils/commandhelper',
  'csui/models/command', 'csui/models/nodes'
], function (module, require, _, $, Backbone, Marionette,
    CommandError, CommandHelper, CommandModel, NodeCollection, MetadataFactory) {
  'use strict';

  var PropertiesCommand = CommandModel.extend({

    defaults: {
      signature: 'Properties',
      command_key: ['properties', 'Properties'],
      openable: true,
      scope: 'multiple',
      commands: 'csui/utils/commands'
    },

    _executeWithSaveState: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/utils/contexts/factories/metadata.factory',
               'csui/widgets/metadata/header.dropdown.menu.items', this.get('commands')
      ], function (MetadataFactory, metadataDropdownMenuItems, commands) {
        var context         = status.context || options && options.context,
            metadataModel = context.getModel(MetadataFactory),
            node            = CommandHelper.getJustOneNode(status) || (status.nodes && status.nodes.at(0)),
            container = status.container,
            selected = status.nodes,
            originatingView = status.originatingView,
            metadataNavigator = true,
            nodes;

        var metadata_info = metadataModel.get('metadata_info') || {},
            collection = nodes;

        if (metadata_info && metadata_info.navigator) {
          metadataNavigator = true;
          collection = metadata_info.collection;
        } else {
          // The third condition of checking for if metadata_info.navigationView is false is
          // to cover for the condition when the single permissions is viewed and the user
          // selects to view properties for single node.
          if (selected && selected.first() === container || !!status.noMetadataNavigation ||
                (metadata_info && metadata_info.navigationView === false) ) {
            // The container properties were requested for the container
            metadataNavigator = false;
          } else {
            nodes = collection = this._getAtLeastOneNode(status);
          }
        }

        if (!metadataNavigator) {
          if(originatingView && originatingView.options.refetchNodeActions && nodes) {
            var commandSignatures = commands.getSignatures(metadataDropdownMenuItems);
            nodes.each(function (node) {
              if(!!node.refetchNodeActions) {
                node.nonPromotedActionCommands = commandSignatures;
                node.set({csuiLazyActionsRetrieved: false}, {silent:true});
              }
            });
          }
        }

        var nodeId = node.get('id'),
            shortcut = node.get('shortcutNode');
        if (shortcut) {
          nodeId = shortcut.get('id');
        }

        metadataModel.set('metadata_info', {
              id: nodeId,
              model: node,
              navigator: metadataNavigator,
              collection: collection,
              selectedTab: status.selectedTab,
              selectedProperty: status.selectedProperty,
              isThumbnailView: status.originatingView && status.originatingView.thumbnailView
        });

        deferred.resolve();
      }.bind(this), function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    _isInMetadataPerspective: function (context) {
      var deferred = $.Deferred();
      csui.require(['csui/utils/contexts/factories/metadata.factory'
      ], function (MetadataFactory) {
        var metadataModel = context.getModel(MetadataFactory);
        var metadataInfo = metadataModel.get('metadata_info');
        if (metadataInfo && _.keys(metadataInfo).length > 0) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }.bind(this), function (error) {
        deferred.reject(error);
      });
      return deferred.promise();

    },

    _executeWithoutSaveState: function (status, options) {
      var context = status.context || (options && options.context),
          self = this,
          deferred = $.Deferred(),
          selected = status.nodes,
          container = status.container,
          navigationView = true,
          nodes;

      if (selected && selected.first() === container) {
        // The container properties were requested for the container
        selected = container;
        navigationView = false;
      } else {
        nodes = this._getAtLeastOneNode(status);
      }

      var originatingView = status.originatingView || (options && options.originatingView);
      csui.require(['csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
        'csui/widgets/metadata/metadata.view', 'csui/controls/dialog/dialog.view',
        'csui/models/nodeversions', this.get('commands')
      ], function (MetadataNavigationWidget, MetadataView, DialogView,
          NodeVersionCollection, commands) {

        var metadata, showInDialogView = status.data && !!status.data.dialogView;
        if (navigationView) {
          if (status.collection && status.collection.models &&
              status.collection.models.length > 0) {
            metadata = new MetadataNavigationWidget({
              container: container,
              containerCollection: status.collection,  // this is the full collection
              collection: nodes,  // as UX design, this collection can be a subset
              selected: selected,
              originatingView: originatingView,
              context: context,
              commands: commands,
              nameAttribute: options ? options.nameAttribute : undefined,
              showCloseIcon: originatingView ? false : true,
              selectedTab: status.selectedTab,
              selectedProperty: status.selectedProperty,
              showThumbnails: status.showThumbnails,
              enableViewState: false
            });
          } else {
            if (originatingView && originatingView.supportOriginatingView === undefined) {
              originatingView.supportOriginatingView = true;
            }
            metadata = new MetadataView({
              model: selected.get("id") ? selected : selected.models[0],
              navigationView: false,
              originatingView: originatingView,
              targetView: originatingView,
              context: context,
              commands: commands,
              showCloseIcon: originatingView ? false : true,
              showBackIcon: originatingView ? true : false,
              selectedTab: status.selectedTab,
              selectedProperty: status.selectedProperty,
              enableViewState: false
            });
            if (originatingView) {
              originatingView.metadataView = metadata;
            }
          }
        } else {
          if (originatingView && originatingView.supportOriginatingView === undefined) {
            originatingView.supportOriginatingView = true;
          }
          metadata = new MetadataView({
            model: selected,
            navigationView: false,
            originatingView: originatingView,
            targetView: originatingView,
            context: context,
            commands: commands,
            showCloseIcon: originatingView ? false : true,
            showBackIcon: originatingView ? true : false,
            selectedTab: status.selectedTab,
            selectedProperty: status.selectedProperty,
            enableViewState: false
          });
          if (originatingView) {
            originatingView.metadataView = metadata;
          }
        }

        //if the view is metadata navigation view, then change only metadataview part.
        if (originatingView instanceof MetadataNavigationWidget &&
            !(status.collection instanceof NodeVersionCollection)) {
          if (originatingView.mdv && originatingView.mdv.metadataTabView) {
            metadata = null;
            originatingView.showPermissionView = false;
            context.viewStateModel && context.viewStateModel.setSessionViewState('permissions', false);
            originatingView._showNode(selected.get("id") ? selected : selected.models[0]);
          }
        } // replace the originatingView with sliding left/right animation
        else if (originatingView && !showInDialogView) {
          originatingView.triggerMethod('metadata:created', metadata);
          var _showOriginatingView, $csProperties;
          var $originatingView = originatingView.$el;
          var ntWidthVal = $originatingView.width();
          var ntWidth = ntWidthVal + 'px';

          $originatingView.parent().append("<div class='cs-properties-wrapper'></div>");
          $originatingView.parent().addClass('csui-node-properties-wrapper');
          $csProperties = $($originatingView.parent().find('.cs-properties-wrapper')[0]);
          $csProperties.hide();

          metadata.render();
          Marionette.triggerMethodOn(metadata, 'before:show');
          $csProperties.append(metadata.el);
          _.isFunction(originatingView.unblockActions) && originatingView.unblockActions();
          $originatingView = $originatingView.parent().find(".cs-permissions-wrapper").length > 0 ?
                             $originatingView.parent().find(".cs-permissions-wrapper") :
                             $originatingView;
          $originatingView.hide();
          $csProperties.show();
          if (originatingView.permissionsView) {
            $originatingView.parent().find(".cs-permissions-wrapper").remove();
            originatingView.permissionsView &&
            originatingView.permissionsView.destroy();
          }
          Marionette.triggerMethodOn(metadata, 'show');
          $originatingView.promise().done(function () {
            originatingView.isDisplayed = false;
          });

          _showOriginatingView = function () {
            $csProperties.hide();
            originatingView.$el.show();
            originatingView.metadataView && originatingView.metadataView.destroy();
            originatingView.permissionsView &&
              originatingView.permissionsView.destroy();
            originatingView.triggerMethod('dom:refresh');
            originatingView.isDisplayed = true;
            //reset required switch to default.
            !!status.collection && (status.collection.requireSwitched = false);
            // Trigger an event to let originating view aware of closing properties view and going back to it.
            // Hence originatingView can handle it and do necessary actions (if any).
            // For ex: Coming to properties page from Wiki, delete latest version, and going back,
            // should fetch & update WIKI page with latest available version.
            originatingView.trigger('properties:view:destroyed');
            $originatingView.parent().removeClass('csui-node-properties-wrapper');
            metadata.destroy();
            $csProperties.remove();
            deferred.resolve();

          };

          self.listenTo(metadata, 'metadata:close', _.bind(_showOriginatingView, self));
          self.listenTo(metadata, 'metadata:close:without:animation', function () {
                $originatingView.show();
                originatingView.triggerMethod('dom:refresh');
                //reset required switch to default.
                !!status.collection && (status.collection.requireSwitched = false);

            metadata.destroy();
            $csProperties.remove();
            deferred.resolve();
          });

        } else {  // show Metadata View in a modal dialog

          self.dialog = new DialogView({
            className: 'cs-properties',
            largeSize: true,
            view: metadata
          });

          self.dialog.show();

          // UX specs does not have header bar
          self.dialog.ui.header.hide();
          self.dialog.listenTo(metadata, 'metadata:close', function () {
            self.dialog.destroy();
          });

          self.dialog.listenTo(metadata, 'metadata:close:without:animation', function () {
            self.dialog.destroy();
          });

          self.dialog.listenTo(self.dialog, 'before:hide', function () {
            deferred.resolve();
          });

        }

      }, function (error) {
        deferred.reject(new CommandError(error));
      });

      return deferred.promise();
    },

    execute: function (status, options) {

      var context = status.context || (options && options.context);

      // When the permissions are displayed in the metadata navigation, it uses this
      // command to display the properties again. So we can't use the routing again when the
      // permissions are displayed.
      // We also will not use the routing when the permissions are displayed in the nodestable.
      // We can't open the properties when the Root router is active because we can't do the
      // back button twice.
      if (context && context.viewStateModel &&
            context.viewStateModel.get('history') &&
            context.viewStateModel.get('enabled')) {
        return this._executeWithSaveState(status, options);
      }

      return this._executeWithoutSaveState(status, options);
    },

    _getAtLeastOneNode: function (status) {
      var nodes = new NodeCollection();
      if (!status.nodes) {
        return nodes;
      }
      if (status.nodes.length === 1 && status.collection) {
        if (!status.collection.findWhere({id: status.nodes.models[0].get('id')})) {
          nodes.add(status.nodes.models[0]);
          nodes.add(status.collection.models);
          return nodes;
        } else {
          return status.collection;
        }
      } else {
        return status.nodes;
      }
    }
  });

  return PropertiesCommand;

});

csui.define('csui/utils/commands/rename',[
  'csui/models/command'
], function (CommandModel) {
  'use strict';

  var RenameCommand = CommandModel.extend({
    defaults: {
      signature: 'Rename',
      command_key: ['rename', 'Rename'],
      scope: "single"
    },

    // returns promise of node.sync
    rename: function (node, name) {
      return node
          .save({name: name}, {
            wait: true,
            patch: true
          });
    },

    // This command is not to be executed.
  });

  return RenameCommand;
});

csui.define('csui/utils/commands/rename.favorite',["require", "csui/lib/underscore", "csui/lib/jquery",
  "csui/models/command", "csui/utils/commandhelper"
], function (require, _, $, CommandModel, CommandHelper) {
  'use strict';

  var RenameFavoriteCommand = CommandModel.extend({

    defaults: {
      signature: "FavoriteRename",
      // Inline editing may need more permissions than just for renaming;
      // if it was a problem the login would have to be extended.
      command_key: ['favorite_rename'],
      scope: "single"
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require(['csui/controls/table/inlineforms/favorite/favorite.view'
      ], function (inlineFormFavoriteView) {
        var node = status.nodes && status.nodes.length === 1 && status.nodes.at(0);

          node.inlineFormView = inlineFormFavoriteView;
          node.set('csuiInlineFormErrorMessage', 'dummy', {silent: true});
          node.unset('csuiInlineFormErrorMessage');

        deferred.resolve();
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  _.extend(RenameFavoriteCommand, {

    version: "1.0"

  });

  return RenameFavoriteCommand;

});

csui.define('csui/utils/commands/reserve',[
  "require", "module", "csui/lib/underscore", "csui/lib/jquery",
  'i18n!csui/utils/commands/nls/lang',
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commandhelper", "csui/utils/commands/node", "csui/models/command"
], function (require, module, _, $,  publicLang, lang, CommandHelper, NodeCommand, CommandModel) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });

  var ReserveCommand = NodeCommand.extend({
    defaults: {
      signature: "ReserveDoc",
      command_key: ['reserve', 'ReserveDoc'],
      name: publicLang.CommandNameReserve,
      verb: lang.CommandVerbReserve,
      pageLeavingWarning: lang.ReservePageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.ReserveItemsNoneMessage,
        formatForOne: publicLang.ReserveOneItemSuccessMessage,
        formatForTwo: publicLang.ReserveSomeItemsSuccessMessage,
        formatForFive: publicLang.ReserveManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.ReserveItemsNoneMessage,
        formatForOne: publicLang.ReserveOneItemFailMessage,
        formatForTwo: publicLang.ReserveSomeItemsFailMessage,
        formatForFive: publicLang.ReserveManyItemsFailMessage
      }
    },

    // Remove the reserve action for previous versions 
    enabled: function (status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      //TODO: remove condition specific to release/revision once LPAD-98530 is fixed
      var isReleaseOrRevision = _.find(nodes.models, function (node) {
        return _.contains([138, 139], node.get('type'));
      });
      if (isReleaseOrRevision) {
        return false;
      }
      else {
        if (nodes && nodes.length) {
          var isOlderVersion = nodes.some(function (node) {
            return node.has('versions') && node.get('versions').current_version === false;
          });
          if (isOlderVersion) {
            return false;
          }
        }
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
    },
                                         
    _performAction: function (node, options) {
      var deferred = $.Deferred();
      node.isReservedClicked = true;
      csui.require([
        'csui/utils/contexts/factories/user'
      ], function (UserModelFactory) {
        var user = options.context.getModel(UserModelFactory);
        user.ensureFetched()
            .then(function () {
              return CommandHelper.updateNode(node, {
                reserved_user_id: user.get('id')
              });
            })
            .then(deferred.resolve, deferred.reject);
        }, deferred.reject);
      return deferred.promise();
    }
  });

  return ReserveCommand;
});

csui.define('csui/utils/commands/compound.document/compound.document',["csui/lib/underscore",
    "i18n!csui/utils/commands/nls/localized.strings", "csui/models/command",
], function (_, lang,CommandModel) {
    'use strict';

    var CompoundDocumentCommand = CommandModel.extend({

        defaults: {
            signature: "CompoundDocument",
            // added all command keys related to compound documents, as this command has to be displayed even if any one of them is present
            command_key: ['CompoundDocument', 'compounddocument','createrelease','createrevision','Reorganize','releases'],
            name: lang.compoundDocumentHeaderTitle,
            verb: lang.compoundDocumentHeaderTitle,
            doneVerb: lang.compoundDocumentHeaderTitle,
            scope: "multiple"
        }
    });
    return CompoundDocumentCommand;
});
csui.define('csui/utils/commands/compound.document/create.revision',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command", "csui/utils/url"
], function (_, $, Backbone, lang, CommandHelper, CommandModel, URL) {
    'use strict';

    var CreateRevisionCommand = CommandModel.extend({

        defaults: {
            signature: "CreateRevision",
            command_key: ['CreateRevision', 'createrevision'],
            name: lang.createRevisionHeaderTitle,
            verb: lang.createRevisionHeaderTitle,
            doneVerb: lang.createRevisionHeaderTitle,
            scope: "single"
        },

        execute: function (status, options) {
            var nodes = CommandHelper.getAtLeastOneNode(status),
                self = this,
                node = CommandHelper.getJustOneNode(status);
            this.model = node;
            this.options = options || {};
            this.context = status && status.context;
            this._deferred = $.Deferred();
            this.connector = this.options.connector ||
                status.collection && status.collection.connector ||
                status.container && status.container.connector ||
                nodes.models && nodes.models[0].connector;
            self._showDialogBox();
            return this._deferred.promise();
        },

        _showDialogBox: function () {
            var self = this;
            csui.require(["csui/controls/dialog/dialog.view",
                "csui/controls/compound.document/dialog.view/create.release.revision.view",
                "csui/controls/progressblocker/blocker"
            ], function (DialogView, CreateRevisionView, BlockingView) {
                var nodeId = self.model.get('id'),
                    url = self.connector.getConnectionUrl().getApiBase('v2'),
                    ajaxOptions = {
                        url: URL.combine(url, 'nodes/' + nodeId + '/releases'),
                        type: 'GET',
                        contentType: 'application/x-www-form-urlencoded'
                    };
                self.connector.makeAjaxCall(ajaxOptions).done(function (resp) {
                    var releaseNumber = 0, revisionNumber = 0;
                    _.each(resp.results, function (node) {
                        if (releaseNumber < node.data.properties.release) {
                            releaseNumber = node.data.properties.release;
                            revisionNumber = 0;
                        }
                        if (node.data.properties.type_name === "Revision" && releaseNumber === node.data.properties.release) {
                            revisionNumber = revisionNumber > node.data.properties.revision ?
                                revisionNumber : node.data.properties.revision;
                        }
                    });
                    self._view = new CreateRevisionView({
                        iconLeft: 'notification_warning',
                        currentVersionLabel: lang.currentRevision,
                        currentVersionNumber: releaseNumber === 0 && revisionNumber === 0 ? lang.noneLabel : releaseNumber + '.' + revisionNumber,
                        newVersionLabel: lang.newRevision,
                        newVersionNumber: releaseNumber + '.' + (revisionNumber + 1),
                        versionNameLabel: lang.revisionName,
                        versionNameNumber: lang.revision + releaseNumber + '.' + (revisionNumber + 1),
                        originatingView: self,
                        arialabel: lang.createRevisionHeaderTitle,
                        className: 'csui-create-revision'
                    });
                    self._dialog = new DialogView({
                        headerTitle: lang.createRevisionHeaderTitle,
                        view: self._view,
                        standardHeader: false,
                        midSize: true,
                        className: 'csui-create-revision-dialog',
                        headers: [
                            {
                                label: lang.createRevisionHeaderTitle,
                                class: 'csui-heading'
                            }],
                        buttons: [
                            {
                                id: 'submit',
                                label: lang.submitButton,
                                click: _.bind(self.onClickSubmitButton, self),
                                'default': true
                            }, {
                                label: lang.cancelButton,
                                close: true,
                                click: _.bind(self.onClickCancelButton, self)
                            }
                        ],
                        dialogTxtAria: lang.createRevisionHeaderTitle
                    });
                    self._view.listenTo(self._view, 'after:show', function () {
                        self._view.ui.nameInput.trigger('focus');
                    });
                    self._dialog.listenTo(self._dialog, 'hide', _.bind(self.onHideDialog, self));
                    BlockingView.imbue(self._dialog);
                    self._dialog.show();
                });
            });
        },

        onHideDialog: function () {
            if (this._deferred) {
                if (this._deferred.state() === 'pending') {
                    this._deferred.reject({ cancelled: true });
                }
            }
        },

        onClickSubmitButton: function () {
            var that = this, successMsg, targetLocation,
                validationSuccess = this._view._validate();
            if (validationSuccess || _.isUndefined(validationSuccess)) {
                csui.require(["csui/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/next.node", "csui/utils/node.links/node.links", "csui/models/nodechildren", "csui/models/node/node.model"
                ], function (GlobalMessage, NextNodeModelFactory, nodeLinks, NodeChildrenCollection, NodeModel) {
                    that._dialog.blockActions();
                    var value = that._dialog.$el.find('.csui-archive-name').val().trim(),
                        nodeId = that.model.get('id');
                    var url = that.connector.getConnectionUrl().getApiBase('v2'),
                        formData = {
                            "name": value
                        },
                        ajaxOptions = {
                            url: URL.combine(url, 'nodes/' + nodeId + '/revisions?'),
                            type: 'POST',
                            data: formData,
                            contentType: 'application/x-www-form-urlencoded'
                        };
                    successMsg = _.str.sformat(lang.revisionSuccessMsg, formData.name);
                    that.connector.makeAjaxCall(ajaxOptions).done(function (response) {
                        that._dialog.unblockActions();
                        that._dialog.destroy();
                        delete that._dialog;
                        that._deferred.resolve();
                        var hasLinks, nodeUrl,
                            node = new NodeModel({
                                id: response.results.data.properties.id
                            }, {
                                connector: that.connector
                            }),
                            childrenCollection, childNode, childNodeId;
                        childrenCollection = new NodeChildrenCollection(undefined, { node: node, autoreset: true });
                        childrenCollection.fetch().done(function (resp) {
                            childNode = _.has(resp.data[0], 'id') && resp.data[0].id;
                            childNodeId = !!childNode ? childNode : node;
                            nodeUrl = new Backbone.Model(resp.data[0]);
                            targetLocation = {
                                id: childNodeId,
                                url: nodeLinks.getUrl(nodeUrl)
                            };
                            hasLinks = targetLocation && targetLocation.url ? true : false;
                            GlobalMessage.showMessage('success', successMsg, '', {
                                gotoLocation: lang.GotoLocationLinkLabel,
                                targetLocation: targetLocation,
                                targetLocationUrl: targetLocation && targetLocation.url,
                                doAutoClose: hasLinks,
                                context: that.context,
                                nextNodeModelFactory: NextNodeModelFactory
                            });
                        });
                    }).fail(function (error) {
                        that._dialog.unblockActions();
                        that._dialog.destroy();
                        delete that._dialog;
                        that._deferred.reject();
                        if (error && error.responseText) {
                            var errorObj = JSON.parse(error.responseText);
                            GlobalMessage.showMessage('error', errorObj.error);
                        }
                    });
                });
            }
        },

        onClickCancelButton: function () {
            this._dialog.destroy();
            delete this._dialog;
        }
    });
    return CreateRevisionCommand;
});

csui.define('csui/utils/commands/compound.document/create.release',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command", "csui/utils/url",
], function (_, $, Backbone, lang, CommandHelper, CommandModel, URL) {
    'use strict';

    var CreateRevisionCommand = CommandModel.extend({

        defaults: {
            signature: "CreateRelease",
            command_key: ['CreateRelease', 'createrelease'],
            name: lang.createReleaseHeaderTitle,
            verb: lang.createReleaseHeaderTitle,
            doneVerb: lang.createReleaseHeaderTitle,
            scope: "single"
        },

        execute: function (status, options) {
            var nodes = CommandHelper.getAtLeastOneNode(status),
                self = this,
                node = CommandHelper.getJustOneNode(status);
            this.model = node;
            this.options = options || {};
            this.context = status && status.context;
            this._deferred = $.Deferred();
            this.connector = this.options.connector ||
                status.collection && status.collection.connector ||
                status.container && status.container.connector ||
                nodes.models && nodes.models[0].connector;
            self._showDialogBox();
            return this._deferred.promise();
        },

        _showDialogBox: function () {
            var self = this;
            csui.require(["csui/controls/dialog/dialog.view",
                "csui/controls/compound.document/dialog.view/create.release.revision.view",
                "csui/controls/progressblocker/blocker"
            ], function (DialogView, CreateReleaseView, BlockingView) {
                var nodeId = self.model.get('id'),
                    url = self.connector.getConnectionUrl().getApiBase('v2'),
                    ajaxOptions = {
                        url: URL.combine(url, 'nodes/' + nodeId + '/releases'),
                        type: 'GET',
                        contentType: 'application/x-www-form-urlencoded'
                    };
                self.connector.makeAjaxCall(ajaxOptions).done(function (resp) {
                    var releaseNumber = 0, newReleaseNumber;
                    _.each(resp.results, function (node) {
                        if (node.data.properties.type_name === "Release") {
                            releaseNumber = releaseNumber > node.data.properties.release ?
                                releaseNumber : node.data.properties.release;
                        }
                    });
                    newReleaseNumber = releaseNumber + 1;

                    self._view = new CreateReleaseView({
                        iconLeft: 'notification_warning',
                        currentVersionLabel: lang.currentRelease,
                        currentVersionNumber: releaseNumber === 0 ? lang.noneLabel : releaseNumber + '.' + 0,
                        newVersionLabel: lang.newRelease,
                        newVersionNumber: newReleaseNumber + '.' + 0,
                        versionNameLabel: lang.releaseName,
                        versionNameNumber: lang.release + newReleaseNumber + '.' + 0,
                        originatingView: self,
                        arialabel: lang.createReleaseHeaderTitle,
                        className: 'csui-create-release'
                    });

                    self._dialog = new DialogView({
                        headerTitle: lang.createReleaseHeaderTitle,
                        view: self._view,
                        standardHeader: false,
                        midSize: true,
                        className: 'csui-create-release-dialog',
                        headers: [
                            {
                                label: lang.createReleaseHeaderTitle,
                                class: 'csui-heading'
                            }],
                        buttons: [
                            {
                                id: 'submit',
                                label: lang.submitButton,
                                click: _.bind(self.onClickSubmitButton, self),
                                'default': true
                            }, {
                                label: lang.cancelButton,
                                close: true,
                                click: _.bind(self.onClickCancelButton, self)
                            }
                        ],
                        dialogTxtAria: lang.createReleaseHeaderTitle
                    });
                    self._view.listenTo(self._view, 'after:show', function () {
                        self._view.ui.nameInput.trigger('focus');
                    });
                    BlockingView.imbue(self._dialog);
                    self._dialog.listenTo(self._dialog, 'hide', _.bind(self.onHideDialog, self));
                    self._dialog.show();
                });
            });
        },

        onHideDialog: function () {
            if (this._deferred) {
                if (this._deferred.state() === 'pending') {
                    this._deferred.reject({ cancelled: true });
                }
            }
        },

        onClickSubmitButton: function () {
            var that = this, successMsg, targetLocation,
                validationSuccess = this._view._validate();
            if (validationSuccess || _.isUndefined(validationSuccess)) {
                csui.require(["csui/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/next.node", "csui/utils/node.links/node.links", "csui/models/nodechildren", "csui/models/node/node.model"
                ], function (GlobalMessage, NextNodeModelFactory, nodeLinks, NodeChildrenCollection, NodeModel) {
                    that._dialog.blockActions();
                    var value = that._dialog.$el.find('.csui-archive-name').val().trim(),
                        nodeId = that.model.get('id');
                    var url = that.connector.getConnectionUrl().getApiBase('v2'),
                        formData = {
                            "name": value
                        },
                        ajaxOptions = {
                            url: URL.combine(url, 'nodes/' + nodeId + '/releases?'),
                            type: 'POST',
                            data: formData,
                            contentType: 'application/x-www-form-urlencoded'
                        };
                    successMsg = _.str.sformat(lang.releaseSuccessMsg, formData.name);
                    that.connector.makeAjaxCall(ajaxOptions).done(function (response) {
                        that._dialog.unblockActions();
                        that._dialog.destroy();
                        delete that._dialog;
                        that._deferred.resolve();
                        var hasLinks, nodeUrl,
                            node = new NodeModel({
                                id: response.results.data.properties.id
                            }, {
                                connector: that.connector
                            }),
                            childrenCollection, childNode, childNodeId;
                        childrenCollection = new NodeChildrenCollection(undefined, { node: node, autoreset: true });
                        childrenCollection.fetch().done(function (resp) {
                            childNode = _.has(resp.data[0], 'id') && resp.data[0].id;
                            childNodeId = !!childNode ? childNode : node;
                            nodeUrl = new Backbone.Model(resp.data[0]);
                            targetLocation = {
                                id: childNodeId,
                                url: nodeLinks.getUrl(nodeUrl)
                            };
                            hasLinks = targetLocation && targetLocation.url ? true : false;
                            GlobalMessage.showMessage('success', successMsg, '', {
                                gotoLocation: lang.GotoLocationLinkLabel,
                                targetLocation: targetLocation,
                                targetLocationUrl: targetLocation && targetLocation.url,
                                doAutoClose: hasLinks,
                                context: that.context,
                                nextNodeModelFactory: NextNodeModelFactory
                            });
                        });
                    }).fail(function (error) {
                        that._dialog.unblockActions();
                        that._dialog.destroy();
                        delete that._dialog;
                        that._deferred.reject();
                        if (error && error.responseText) {
                            var errorObj = JSON.parse(error.responseText);
                            GlobalMessage.showMessage('error', errorObj.error);
                        }
                    });
                });
            }
        },

        onClickCancelButton: function () {
            this._dialog.destroy();
            delete this._dialog;
        }
    });
    return CreateRevisionCommand;
});
csui.define('csui/utils/commands/compound.document/reorganize',["require", "csui/lib/underscore", "csui/lib/jquery",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command"
], function (require, _, $, lang, CommandHelper,
    CommandModel) {
    'use strict';

    // Dependencies loaded in the execute method first
    var  DialogView;

    var ReorganizeCommand = CommandModel.extend({

        defaults: {
            signature: "Reorganize",
            command_key: ['Reorganize', 'reorganize'],
            name: lang.Reorganize,
            verb: lang.Reorganize,
            doneVerb: lang.Reorganize,
            scope: "single",
            selfBlockOnly: true
        },

        execute: function (status, options) {
            this.set('isExecuting', true);
            if (this.stagesModel) {
                delete this.stagesModel;  // to prepare fresh model with new job id
            }
            var nodes = CommandHelper.getAtLeastOneNode(status),
                self = this;
                var node = CommandHelper.getJustOneNode(status);
                this.model = node;
            this.options = options || {};
            this._deferred = $.Deferred();
            this.originatingView = status.originatingView;
            this.originatingView.blockActions();
            this.connector = this.options.connector ||
                status.collection && status.collection.connector ||
                status.container && status.container.connector ||
                nodes.models && nodes.models[0].connector;

            csui.require(["csui/controls/side.panel/side.panel.view", 
            "csui/controls/compound.document/reorganize/reorganize.view",
            'csui/controls/globalmessage/globalmessage',
            'nuc/utils/url'
            ], function (SidePanelView, ReorganizeView, GlobalMessage, URL) {
                DialogView = arguments[0];
                var reorganizeView = new ReorganizeView({
                    context: status.context,
                    connector: self.connector,
                    originatingView: self.originatingView,
                    node: self.model
                    });
                self.sidePanel = new SidePanelView({
                    title: lang.Reorganize,
                    content: reorganizeView,
                    footer: {
                        buttons: [{
                        label: lang.submitButton,
                        id: 'submit',
                        className: 'binf-btn binf-btn-primary csui-submit',
                        }]
                    }
                });
                reorganizeView.options.sidePanel = self.sidePanel;
                reorganizeView.listenToOnce(reorganizeView.collection, 'sync', function() {
                    var sidePanel = self.sidePanel;
                    var collection = sidePanel.options.content.collection;
                    sidePanel.options.footer.buttons[0].disabled = collection.length === 0;
                    sidePanel.show();
                    sidePanel.listenTo(sidePanel.footerView, "button:click", function(event) {
                        $('body .ghostElem').remove();
                        sidePanel.hide();
                        if (event.id === 'submit') {
                            var that = self,
                                nodeId = that.model.get('id'),
                                formData = {
                                    "order": collection.orderedList,"compact": true
                                };
                            var url = that.connector.getConnectionUrl().getApiBase('v2'),
                                ajaxOptions = {
                                    url: URL.combine(url, 'nodes/' + nodeId + '/order'),
                                    type: 'PUT',
                                    data: formData,
                                    contentType: 'application/x-www-form-urlencoded'
                                };
                            that.connector.makeAjaxCall(ajaxOptions).done(function (response) {
                                that._deferred.resolve();
                                GlobalMessage.showMessage('success', lang.ReorganizeSuccessMsg);
                                that.originatingView.collection.fetched = false;
                                that.originatingView.collection.fetch();
                            }).fail(function (error) {
                                that._deferred.reject();
                                if (error && error.responseText) {
                                    var errorObj = JSON.parse(error.responseText);
                                    GlobalMessage.showMessage('error', errorObj.error);
                                }
                            });
                        }
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'before:hide', function () {
                       self._deferred.resolve();
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'after:show', function () {
                        if (this.options.content.collection.length && 
                            _.contains([1, 2, 136],this.options.content.collection.models[0].get('type'))) {
                            this.footerView.$el.find('.csui-submit').length &&
                            $(this.footerView.$el.find('.csui-submit')).prop('disabled', true);
                        }
                        if (self.sidePanel.$el.find('.binf-switch').hasClass('binf-switch-disabled')) {
                            self.sidePanel.$el.find('.binf-switch-container > input').attr('tabindex', -1);
                            self.sidePanel.$el.find('.csui-sidepanel-close').trigger('focus');
                        }
                        else {
                            self.sidePanel.$el.find('.binf-switch-container > input').trigger('focus');
                        }
                    });
                    self.sidePanel.listenTo(self.sidePanel, 'keydown', function (event) {
                        if (event.target.id === "submit" && event.keyCode === 9 && event.shiftKey) {
                            event.preventDefault();
                            event.stopPropagation();
                            this.contentHolders[0].reorganizeListView.focusIndex = 0;
                            $(this.contentHolders[0].reorganizeListView.$el.find('.csui-reorder-item')).removeClass('active');
                            var firstItem = $(this.contentHolders[0].reorganizeListView.$el.find('.csui-reorder-item')[0]);
                            firstItem.trigger('focus');
                            firstItem.addClass('active');
                        }
                    });
                });
                self.originatingView.unblockActions();
            });
            // this._deferred.resolve();  // Do not block other actions
            this._deferred.always(function () {
                self.set('isExecuting', false);
            });
            return this._deferred.promise();
        },
    });
    return ReorganizeCommand;
});

csui.define('csui/utils/commands/compound.document/lock',[
  "module", "csui/lib/underscore",
  'i18n!csui/utils/commands/nls/lang',
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commands/reserve",
  "csui/models/command",
  "csui/utils/commandhelper"
], function (module, _, publicLang, lang, ReserveCommand, CommandModel, CommandHelper) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });

  var LockCommand = ReserveCommand.extend({
    defaults: {
      signature: "Lock",
      command_key: ['reserve','Lock'],
      name: publicLang.CommandNameLock,
      verb: lang.CommandVerbLock,
      pageLeavingWarning: lang.LockPageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.LockItemsNoneMessage,
        formatForOne: publicLang.LockOneItemSuccessMessage,
        formatForTwo: publicLang.LockSomeItemsSuccessMessage,
        formatForFive: publicLang.LockManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.LockItemsNoneMessage,
        formatForOne: publicLang.LockOneItemFailMessage,
        formatForTwo: publicLang.LockSomeItemsFailMessage,
        formatForFive: publicLang.LockManyItemsFailMessage
      }
    },
    enabled: function (status) {
      //TODO: remove condition specific to release/revision once LPAD-98530 is fixed
      var isReleaseOrRevision = _.find(CommandHelper.getAtLeastOneNode(status).models, function (node, index) {
        return _.contains([138, 139], node.get('type'));
      });
      if (isReleaseOrRevision) {
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
      else {
        return false;
      }
    }
  });

  return LockCommand;
});
csui.define('csui/utils/commands/unreserve',['csui/lib/underscore',
  'i18n!csui/utils/commands/nls/lang',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/utils/commands/node',
  "csui/models/command"
], function (_, publicLang, lang, CommandHelper, NodeCommand, CommandModel) {
  'use strict';

  var UnreserveCommand = NodeCommand.extend({
    defaults: {
      signature: 'UnreserveDoc',
      command_key: ['unreserve', 'UnreserveDoc'],
      name: publicLang.CommandNameUnreserve,
      verb: lang.CommandVerbUnreserve,
      pageLeavingWarning: lang.UnreservePageLeavingWarning,
      scope: 'multiple',
      successMessages: {
        formatForNone: publicLang.UnreserveItemsNoneMessage,
        formatForOne: publicLang.UnreserveOneItemSuccessMessage,
        formatForTwo: publicLang.UnreserveSomeItemsSuccessMessage,
        formatForFive: publicLang.UnreserveManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.UnreserveItemsNoneMessage,
        formatForOne: publicLang.UnreserveOneItemFailMessage,
        formatForTwo: publicLang.UnreserveSomeItemsFailMessage,
        formatForFive: publicLang.UnreserveManyItemsFailMessage
      }
    },

     // Remove the unreserve action for previous versions
    enabled: function (status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      //TODO: remove condition specific to release/revision once LPAD-98530 is fixed
      var isReleaseOrRevision = _.find(nodes.models, function (node) {
        return _.contains([138, 139], node.get('type'));
      });
      if (isReleaseOrRevision) {
        return false;
      }
      else {
        if (nodes && nodes.length) {
          var isOlderVersion = nodes.some(function (node) {
            return node.has('versions') && node.get('versions').current_version === false;
          });
          if (isOlderVersion) {
            return false;
          }
        }
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
    },

    _performAction: function (node, options) {
      node.isUnreservedClicked = true;
      return CommandHelper.updateNode(node, {
        reserved_user_id: null
      });
    }
  });

  return UnreserveCommand;
});

csui.define('csui/utils/commands/compound.document/unlock',[
  "module", "csui/lib/underscore",
  'i18n!csui/utils/commands/nls/lang',
  "i18n!csui/utils/commands/nls/localized.strings",
   "csui/utils/commands/unreserve",
   "csui/models/command",
   "csui/utils/commandhelper"
], function (module, _,  publicLang, lang, UnreserveCommand,CommandModel, CommandHelper) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });

  var UnlockCommand = UnreserveCommand.extend({
    defaults: {
      signature: "Unlock",
      command_key: ['unreserve','Unlock'],
      name: publicLang.CommandNameUnlock,
      verb: lang.CommandVerbUnlock,
      pageLeavingWarning: lang.UnlockPageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.UnlockItemsNoneMessage,
        formatForOne: publicLang.UnlockOneItemSuccessMessage,
        formatForTwo: publicLang.UnlockSomeItemsSuccessMessage,
        formatForFive: publicLang.UnlockManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.UnlockItemsNoneMessage,
        formatForOne: publicLang.UnlockOneItemFailMessage,
        formatForTwo: publicLang.UnlockSomeItemsFailMessage,
        formatForFive: publicLang.UnlockManyItemsFailMessage
      }
    },

    enabled: function (status) {
      //TODO: remove condition specific to release/revision once LPAD-98530 is fixed
      var isReleaseOrRevision = _.find(CommandHelper.getAtLeastOneNode(status).models, function (node, index) {
        return _.contains([138, 139], node.get('type'));
      });
      if (isReleaseOrRevision) {
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
      else {
        return false;
      }
    }
  });

  return UnlockCommand;
});
csui.define('csui/utils/commands/compound.document/view.releases',["require", "csui/lib/underscore", "csui/lib/jquery",
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commandhelper", "csui/models/command", 'csui/models/nodes'
], function (require, _, $, lang, CommandHelper, CommandModel, NodeCollection) {
  'use strict';

  var ViewReleasesCommand = CommandModel.extend({

    defaults: {
      signature: "ViewReleases",
      command_key: ['releases', 'ViewReleases'],
      name: lang.CommandNameViewReleases,
      scope: "multiple",
      selfBlockOnly: true,
      commands: 'csui/utils/commands'
    },

    execute: function (status, options) {
      var context = status.context || options && options.context;
      if (status.originatingView && context && context.viewStateModel &&
        context.viewStateModel.get('history') &&
        context.viewStateModel.get('enabled') &&
        !status.showPermissionView) {
        var deferred = $.Deferred();
        csui.require(['csui/utils/contexts/factories/metadata.factory',
          'csui/widgets/metadata/header.dropdown.menu.items', this.get('commands')
        ], function (MetadataFactory, metadataDropdownMenuItems, commands) {
          var metadataModel = context.getModel(MetadataFactory),
            node = CommandHelper.getJustOneNode(status) || (status.nodes && status.nodes.at(0)),
            container = status.container,
            selected = status.nodes,
            originatingView = status.originatingView,
            navigationView = true,
            nodes;

          if (selected && selected.first() === container || !!status.noMetadataNavigation) {
            // The container properties were requested for the container
            navigationView = false;
          } else {
            nodes = this._getAtLeastOneNode(status);
          }

          if (originatingView && originatingView.options.refetchNodeActions && nodes) {
            var commandSignatures = commands.getSignatures(metadataDropdownMenuItems);
            nodes.each(function (node) {
              if (!!node.refetchNodeActions) {
                node.nonPromotedActionCommands = commandSignatures;
                node.set({ csuiLazyActionsRetrieved: false }, { silent: true });
              }
            });
          }
          metadataModel.set('metadata_info', {
            id: node.get('id'),
            model: node,
            navigator: navigationView,
            collection: nodes,
            selectedTab: 'releases', // releases of the compound document have to be displayed on navigation
          });

          deferred.resolve();
        }.bind(this), function (error) {
          deferred.reject(error);
        });
        return deferred.promise();
      }
    },

    _getAtLeastOneNode: function (status) {
      var nodes = new NodeCollection();
      if (!status.nodes) {
        return nodes;
      }
      if (status.nodes.length === 1 && status.collection) {
        if (!status.collection.findWhere({ id: status.nodes.models[0].get('id') })) {
          nodes.add(status.nodes.models[0]);
          nodes.add(status.collection.models);
          return nodes;
        } else {
          return status.collection;
        }
      } else {
        return status.nodes;
      }
    }
  });
  return ViewReleasesCommand;
});
csui.define('csui/utils/commands/compound.document/properties',['csui/utils/commands/properties'
], function (PropertiesCommand) {
  'use strict';

  var ReleasesPropertiesCommand = PropertiesCommand.extend({

    defaults: {
        signature: 'ReleasesProperties',
        command_key: ['properties','ReleasesProperties'],
        scope: 'multiple',
        commands: 'csui/utils/commands/compound.document/releases.commands'
    },

    execute: function (status, options) {
      // execute with save state for multiple compound documents
      
      if (!status.container && status.originatingView.collection) {
        status.originatingView.options.showReleasesView = false;
        return this._executeWithSaveState(status, options);
      } else {
        status.originatingView.options.showReleasesView = false;
        return this._executeWithoutSaveState(status, options);
      }
    },

    _getAtLeastOneNode: function (status) {
        // for metadata releases, use the collection passed in
        if (status.collection && status.nodes.length === 1) {
          return status.collection;
        }
        return status.nodes;
      }

  });

  return ReleasesPropertiesCommand;

});


csui.define('csui/utils/commands/compound.document/releases.commands',['csui/lib/underscore', 'csui/models/commands',
  'csui/utils/commands/compound.document/properties',
  'csui-ext!csui/utils/commands/compound.document/releases.commands'
], function (_, CommandCollection,
  ReleasesPropertiesCommand,
    extraCommands) {
  'use strict';

  var commands = new CommandCollection([
    new ReleasesPropertiesCommand(),
  ]);

  if (extraCommands) {
    commands.add(
        _.chain(extraCommands)
            .flatten(true)
            .map(function (Command) {
              return new Command();
            })
            .value()
    );
  }

  return commands;

});

csui.define('csui/utils/commands/run.livereport',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {

  var RunLiveReportCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'RunLiveReport'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 299;
    },

    getUrlQueryParameters: function (node, options) {
      return {
        func: 'll',
        objAction: 'RunReport',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return RunLiveReportCommand;

});

csui.define('csui/utils/commands/sign.out',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper', 'csui/utils/url',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel, CommandHelper, Url, lang) {
  'use strict';

  var ConnectorFactory, routing;

  var config = _.extend({
    enabled: true,
    signInPageUrl: 'signin.html'
  }, module.config());
  var enabled = config.enabled;

  var SignOutCommand = CommandModel.extend({
    defaults: {
      signature: 'SignOut',
      name: lang.SignOutCommandName
    },

    enabled: function () {
      return enabled;
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          context = status.context || options && options.context,
          self = this;
      csui.require([
        'csui/utils/contexts/factories/connector', 'csui/utils/routing'
      ], function () {
        ConnectorFactory = arguments[0];
        routing = arguments[1];
        self._signOut(context)
            .done(deferred.resolve)
            .fail(deferred.reject);
      }, deferred.reject);
      return deferred.promise();
    },

    _signOut: function (context) {
      var connector = context.getObject(ConnectorFactory),
          cgiUrl = new Url(connector.connection.url).getCgiScript();
      // Development HTML pages do not use the OTDS login page
      if (routing.routesWithSlashes()) {
        // Invalidate the authenticated session, get the secure request token
        // for the classic logout page and perform the logout by navigating there
        return connector.makeAjaxCall({
                  url: Url.combine(cgiUrl, 'api/v1/auth/logouttoken')
                })
                .then(function (response) {
                  connector.authenticator.unauthenticate({reason: 'logged-out'});
                  location.href = cgiUrl + '?func=csui.dologout&secureRequestToken=' +
                                  encodeURIComponent(response.token);
                });
      }

      // Invalidate the authenticated session and navigate to the login
      // page; this is used on the development pages
      connector.authenticator.unauthenticate({reason: 'logged-out'});
      var signInPageUrl = config.signInPageUrl,
          query = location.search;
      query += query ? '&' : '?';
      query += 'nextUrl=' + encodeURIComponent(location.pathname);
      location.href = signInPageUrl + query + location.hash;
      return $.Deferred().resolve().promise();
    }
  });

  return SignOutCommand;
});

csui.define('csui/utils/commands/switch.to.classic',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper', 'csui/utils/url',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commands/open.classic.page',
  'csui/utils/classic.nodes/classic.nodes'
], function (module, require, _, $, CommandModel, CommandHelper,
    Url, lang, OpenClassicPageCommand, ClassicNodes) {
  'use strict';

  var ConnectorFactory, NodeModelFactory;

  var config = _.extend({
    enabled: true,
    // Allow defining a value specific for this command
    openInNewTab: null
  }, module.config());
  // If no specific value was set, use the value for all Classic UI pages
  if (config.openInNewTab == null) {
    config.openInNewTab = OpenClassicPageCommand.openInNewTab;
  }

  var SwitchToClassicCommand = CommandModel.extend({

    defaults: {
      signature: 'SwitchToClassic',
      name: lang.SwitchToClassicCommandName
    },

    enabled: function (status, options) {
      if (!config.enabled) {
        return false;
      }
      var context = status.context || options && options.context,
          applicationScope = context.getModel('applicationScope');
      applicationScope = applicationScope && applicationScope.get('id');
      return applicationScope === '' || applicationScope === 'node';
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          context = status.context || options && options.context,
          target = config.openInNewTab && window.open('', '_blank') || window,
          self = this;
      target.focus();
      csui.require(['csui/utils/contexts/factories/connector',
               'csui/utils/contexts/factories/node'
      ], function () {
        ConnectorFactory = arguments[0];
        NodeModelFactory = arguments[1];
        target.location.href = self._getUrl(context, status);
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },

    _getUrl: function (context, status) {
      var connector = context.getObject(ConnectorFactory),
          cgiUrl = new Url(connector.connection.url).getCgiScript(),
          urlQueryParameters = this._getUrlQueryParameters(context, status),
          urlQuery = Url.combineQueryString(urlQueryParameters);
      return Url.appendQuery(cgiUrl, urlQuery);
    },

    _getUrlQueryParameters: function (context, status) {
      var node = CommandHelper.getJustOneNode(status) ||
                 context.getModel(NodeModelFactory),
          classicNode = ClassicNodes.find(function (item) {
            return item.matchRules(node, item.attributes);
          }),
          urlQuery    = classicNode && classicNode.get("urlQuery"),
          parameters;
      if (node !== undefined && node.get('id') > 0) {
        parameters = {
          func: 'll',
          objId: node.get('id')
        };
        if (urlQuery) {
          if (typeof urlQuery === 'string') {
            parameters = ClassicNodes._replaceParameters(classicNode.get("urlQuery"),
                node.attributes);
          } else if (typeof urlQuery === 'function') {
            parameters = urlQuery(node);
          }
        } else {
          if (node.get('container')) {
            parameters.objAction = 'browse';
            parameters.viewType = 1;
          } else {
            parameters.objAction = 'properties';
          }
        }
      } else {
        // Compute parameters for the "landing page" in Classic View.
        parameters = { classicview: '' };
      }
      return parameters;
    }

  });

  return SwitchToClassicCommand;

});

csui.define('csui/utils/commands/user.profile',[
  'require', 'csui/lib/jquery', 'csui/models/command', 'csui/utils/base',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (require, $, CommandModel, base, lang) {
  'use strict';

  var UserProfileCommand = CommandModel.extend({

    defaults: {
      signature: 'UserProfile',
      name: lang.UserProfileCommandName
    },

    enabled: function (status, options) {
      var toolItem = status.toolItem || options && options.toolItem;
      if (toolItem) {
        var context = status.context || options && options.context,
            user = context.getModel('user'),
            name = base.formatMemberName(user);
        toolItem.set('name', name);
      }
      return true;
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          context = status.context || options && options.context;
      csui.require([
        'csui/utils/contexts/factories/user',
        'esoc/controls/userwidget/userwidget.view',
        'esoc/widgets/userwidget/view/userprofile.view',
        'esoc/widgets/userwidget/view/miniprofile.view',
        'esoc/widgets/userwidget/view/simple.userwidget.view'
      ], function (UserModelFactory, UserWidgetView) {
        var user = context.getModel(UserModelFactory),
            userId = user.get('id'),
            userWidgetView = new UserWidgetView({
              model: user,
              connector: user.connector,
              userid: userId,
              context: context,
              baseElement: undefined,
              showUserProfileLink: true,
              showMiniProfile: false,
              enableSimpleSettingsModel: true,
              enableUploadProfilePicture: true,
              loggedUserId: userId,
              showUserSettings: true,
              showUserProfileSessions: true
            });
        userWidgetView.showUserProfileDialog();
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    }

  });

  return UserProfileCommand;

});

csui.define('csui/utils/commands/versions/delete',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/versions/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/utils/commands/delete',
], function (require, module, _, $, versionLang, CommandHelper, DeleteCommand) {
  'use strict';

  var VersionDeleteCommand = DeleteCommand.extend({
    defaults: {
      signature: 'VersionDelete',
      command_key: ['versions_delete','Delete'],
      name: versionLang.CommandNameVersionDelete,
      verb: versionLang.CommandVerbVersionDelete,
      pageLeavingWarning: versionLang.DeleteVersionPageLeavingWarning,
      scope: 'multiple',
      successMessages: {
        formatForNone: versionLang.DeleteVersionItemsNoneMessage,
        formatForOne: versionLang.DeleteVersionOneItemSuccessMessage,
        formatForTwo: versionLang.DeleteVersionSomeItemsSuccessMessage,
        formatForFive: versionLang.DeleteVersionManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: versionLang.DeleteVersionItemsNoneMessage,
        formatForOne: versionLang.DeleteVersionOneItemFailMessage,
        formatForTwo: versionLang.DeleteVersionSomeItemsFailMessage,
        formatForFive: versionLang.DeleteVersionManyItemsFailMessage
      }
    },

    enabled: function (status, options) {
      if (!VersionDeleteCommand.__super__.enabled.apply(this, arguments)) {
        return false;
      }
      var selectedVersions = CommandHelper.getAtLeastOneNode(status);

      if(selectedVersions.length > 0) {
        if(status.container && status.container.versions) {
          return status.container.versions.allModels &&
          selectedVersions.length < status.container.versions.allModels.length;
        } else {
          // if it is a single version in case of which the version collection is not available
          // (like for version.overview widget), just check for permitted actions and check the length
          // of selected versions.
          return selectedVersions.length == 1;
        }
      }

      return false;
    },

    _getConfirmData: function (status, options) {
      var versions = CommandHelper.getAtLeastOneNode(status);
      var message;
      if(versions.length === 1) {
        var versionNumber = versions.at(0).get('version_number_name'),
            parentNodeName = (status.container && status.container.get('name') || versions.at(0).get    ('id_expand') && versions.at(0).get('id_expand').name);
        message = _.str.sformat(versionLang.VersionDeleteCommandConfirmDialogSingleMessage,
          versionNumber,parentNodeName);
      } else {
        message =  _.str.sformat(versionLang.VersionDeleteCommandConfirmDialogMultipleMessage,
          versions.length);
      }
      return {
        title: versionLang.DeleteCommandConfirmDialogTitle,
        message: message
      };
    },

    startGlobalMessage: function (uploadCollection) {
      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        GlobalMessage.showFileUploadProgress(uploadCollection, {
          oneFileTitle: versionLang.DeletingOneVersion,
          oneFileSuccess: versionLang.DeleteVersionOneItemSuccessMessage,
          multiFileSuccess: versionLang.DeleteVersionManyItemsSuccessMessage,
          oneFilePending: versionLang.DeletingOneVersion,
          multiFilePending: versionLang.DeleteVersions,
          oneFileFailure: versionLang.DeleteVersionOneItemFailMessage,
          multiFileFailure: versionLang.DeleteVersionManyItemsFailMessage,
          someFileSuccess: versionLang.DeleteVersionSomeItemsSuccessMessage,
          someFilePending: versionLang.DeletingSomeVersions,
          someFileFailure: versionLang.DeleteVersionSomeItemsFailMessage,
          enableCancel: false
        });
      });
    }
  });

  return VersionDeleteCommand;
});

csui.define('csui/utils/commands/versions/download',['csui/utils/commands/download', 'csui/utils/url',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (DownloadCommand, Url, lang) {
  'use strict';

  var VersionDownloadCommand = DownloadCommand.extend({

    defaults: {
      signature: 'VersionDownload',
      command_key: ['versions_download','Open'],
      name: lang.CommandNameDownload,
      verb: lang.CommandVerbDownload,
      doneVerb: lang.CommandDoneVerbDownload,
      scope: 'single'
    },

    _getContentUrl: function (node, options, action, token) {
      var url = Url.combine(node.connector.connection.url, "nodes",
          node.get('id'), "versions", node.get('version_number'), "content");
      return url + "?action=" + action + "&token=" + encodeURIComponent(token);
    }

  });

  return VersionDownloadCommand;

});

csui.define('csui/utils/commands/versions/open',['csui/lib/jquery', 'csui/utils/commands/open','csui/utils/url'], function ($, OpenCommand, Url) {
  'use strict';

  // Support for both node and version models is provided
  // by the open command plugins themselves
  var VersionOpenCommand = OpenCommand.extend({
    defaults: {
      signature: 'VersionOpen',
      command_key: ['versions_open','Open'],
      scope: 'single'
    },

    // TODO: This is being overridden as the command keys for version related
    // commands are incorrect. Once they're fixed, we can check for 'open'
    // and this overridden implementation can be removed in favor of
    // openCommand's implementation where 'open' action can be added to the check.
    checkPermission: function (version) {
      // actions are directly available for versions, so make the check.
      var permitted = false;
      if(version.actions.get('Open')) {
         permitted = true;
      } else {
        permitted = false;
      }
      return $.Deferred().resolve(permitted).promise();
    },

    _showOverview: function (version, options) {
      var deferred = $.Deferred();
      csui.require([
        'csui/utils/contexts/factories/next.version'
      ], function (NextVersionModelFactory) {
        var nextVersion = options.context.getModel(NextVersionModelFactory);
        nextVersion.set({ id: version.get('id'), version_number: version.get('version_number') });
        deferred.resolve();
      }, deferred.reject);

      return deferred.promise();
    },

    _getContentUrl: function (node, options, action, token) {
      var url = Url.combine(node.connector.connection.url, "nodes",
          node.get('id'), "versions", node.get('version_number'), "content");
      return url + "?action=" + action + "&token=" + encodeURIComponent(token);
    }
  });

  return VersionOpenCommand;
});

csui.define('csui/utils/commands/versions/properties',['csui/utils/commands/properties', 'csui/models/version'
], function (PropertiesCommand, VersionModel) {
  'use strict';

  var VersionPropertiesCommand = PropertiesCommand.extend({

    defaults: {
      signature: 'VersionProperties',
      command_key: ['versions_properties','Properties'],
      scope: 'multiple',
      commands: 'csui/utils/commands/versions'
    },

    execute: function (status, options) {
      return this._executeWithoutSaveState(status, options);
    },

    _getAtLeastOneNode: function (status) {
      // for metadata version, use the collection passed in
      if (status.collection && status.nodes.length === 1) {
        return status.collection;
      }
      return status.nodes;
    }

  });

  return VersionPropertiesCommand;

});

csui.define('csui/utils/commands/versions/promote.version',[
  'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/versions/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/models/command', 'csui/models/version',
  'csui/utils/base', 'csui/utils/url'
], function (_, $, versionLang, CommandHelper, Command, VersionModel, base, Url) {
  'use strict';

  var PromoteVersionCommand = Command.extend({
    defaults: {
      signature: 'PromoteVersion',
      command_key: ['versions_promote','Promote'],
      name: versionLang.CommandNamePromoteVersion,
      verb: versionLang.CommandVerbPromoteVersion,
      scope: 'single'
    },

    enabled: function (status, options) {
      var selectedVersions = CommandHelper.getAtLeastOneNode(status);
      if(selectedVersions && selectedVersions.length === 1) {
        if(status.container) {
          return status.container.get('advanced_versioning');
        } else {
          var version = selectedVersions.first();
          if(version.get('id_expand')) {
            return version.get('id_expand').advanced_versioning;
          }
        }
      }
      return false;
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      this._confirmAction(status, options)
          .done(function () {
            deferred.resolve();
          })
          .fail(function () {
            deferred.reject();
          });

      return deferred.promise();
    },

    _confirmAction: function (status, options) {
      var deferred   = $.Deferred(),
          node       = status.container,
          newVersion = CommandHelper.getJustOneNode(status).clone(),
          connector  = (status.container && status.container.connector) || newVersion.connector;
      csui.require(['csui/controls/globalmessage/globalmessage'], function (GlobalMessage) {
        var data = {};
        newVersion.save(undefined, {
          data: data,
          type: 'POST',
          wait: true,
          url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/' + newVersion.get("id") +
               '/versions/' + newVersion.get("version_number") + '/promote')
        }).done(function () {
          if(!!node) { // if the container node exists, then
            newVersion.fetch().done(function () {
              if (node.versions || (!!node.attributes && !!node.attributes.versions)) {
                newVersion.isLocallyCreated = true;
                // TODO: Remove this, as soon as the version REST API returns actions
                fakeActions(node, newVersion);
                !!node.versions && node.versions.add(newVersion, {at: 0});
                if (Array.isArray(node.get('versions'))) {
                  !!node.attributes && !!node.attributes.versions &&
                  node.attributes.versions.push(newVersion.attributes);
                }
              }
              deferred.resolve();
              GlobalMessage.showMessage('success', versionLang.MessageVersionPromoted);
            });
          } else { // if the only the version model is fetched directly instead of the collection,
	           // then just resolve.
            deferred.resolve();
            GlobalMessage.showMessage('success', versionLang.MessageVersionPromoted);
          }
        }).fail(function (error) {
          deferred.reject();
          if (error) {
            var errorObj = new base.Error(error);
            GlobalMessage.showMessage('error', errorObj.message);
          }
        });
      });
      // TODO: Remove this, as soon as the version REST API returns actions
      // (Another workaround could be loading all versions anew)
      function fakeActions(node, version) {
        var actions = [];
        if (node.actions.findRecursively('download') || node.actions.findRecursively('Download')) {
          actions.push({signature: 'versions_download'}, {signature: 'versions_open'});
        }
        if (node.actions.findRecursively('delete') || node.actions.findRecursively('Delete')) {
          actions.push({signature: 'versions_delete'});
        }
        if (node.actions.findRecursively('properties') ||
            node.actions.findRecursively('Properties')) {
          actions.push({signature: 'versions_properties'});
        }
        version.actions.reset(actions);
      }

      return deferred.promise();
    },
  });

  return PromoteVersionCommand;
});

csui.define('csui/utils/commands/versions/doc.version.preview',[
    'csui/utils/commands/doc.preview',
  ], function (DocPreviewCommand) {
    'use strict';

    var DocVersionPreviewCommand = DocPreviewCommand.extend({
      defaults: {
        signature: 'DocVersionPreview'
      },

      delegatableOpenCommand: 'OpenVersionDelegate'
    });

    return DocVersionPreviewCommand;
  });


csui.define('csui/utils/commands/versions/open.version/delegates/open.version.delegates',[
    'csui/lib/underscore', 'csui/lib/backbone',
    'csui/models/mixins/rules.matching/rules.matching.mixin',
    // Load and register external document opening command delegates
    'csui-ext!csui/utils/commands/versions/open.version/delegates/open.version.delegates'
  ], function (_, Backbone, RulesMatchingMixin, rules) {
    'use strict';

    var OpenVersionDelegateModel = Backbone.Model.extend({
      defaults: {
        sequence: 100,
        command: null
      },

      constructor: function OpenVersionDelegateModel(attributes, options) {
        Backbone.Model.prototype.constructor.apply(this, arguments);
        this.makeRulesMatching(options);
      },

      enabled: function (node, status, options) {
        var context = status.context || options && options.context;
        var matchOptions = { context: context };
        return this.matchRules(node, this.attributes, matchOptions) &&
          this.get('command').enabled(status, options);
      }
    });

    RulesMatchingMixin.mixin(OpenVersionDelegateModel.prototype);

    var OpenVersionDelegateCollection = Backbone.Collection.extend({
      model: OpenVersionDelegateModel,
      comparator: 'sequence',

      constructor: function OpenVersionDelegateCollection(models, options) {
        Backbone.Collection.prototype.constructor.call(this, models, options);
      },

      findByNode: function (node, status, options) {
        var rule = this.find(function (rule) {
          return rule.enabled(node, status, options);
        });
        return rule && rule.get('command');
      }
    });

    var openVersionDelegates = new OpenVersionDelegateCollection();

    if (rules) {
      openVersionDelegates.add(_
        .chain(rules)
        .flatten(rules)
        .map(function (rule) {
          return _.defaults({
            command: new rule.command()
          }, rule);
        })
        .value());
    }

    return openVersionDelegates;
  });

csui.define('csui/utils/commands/versions/open.version/open.version.delegate',[
  'csui/lib/underscore', 'csui/utils/commands/open.base',
  'csui/utils/commands/versions/open.version/delegates/open.version.delegates'
], function (_, OpenBaseCommand, openVersionDelegates) {
  'use strict';

  var OpenVersionDelegateCommand = OpenBaseCommand.extend({
    defaults: { signature: 'OpenVersionDelegate' },

    openDelegates: openVersionDelegates
  });

  return OpenVersionDelegateCommand;
});

csui.define('csui/utils/commands/versions/open.version.perspective',['csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!csui/utils/commands/versions/nls/localized.strings'
], function ($, _, CommandModel, CommandHelper, lang) {
  'use strict';

  var OpenVersionPerspectiveCommand = CommandModel.extend({

    defaults: {
        signature: 'OpenVersionPerspective'
    },

    enabled: function (status) {
        var version = CommandHelper.getJustOneNode(status);
        return version && version.get('id') && version.get('version_number');
    },

    execute: function (status, options) {
      var deferred = $.Deferred();

      var context = status.context || options && options.context,
          nextVersion = context.getModel('nextVersion'),
          version = CommandHelper.getJustOneNode(status);

      if (!version || !version.get('id') || !version.get('version_number')) {
        deferred.reject({message: lang.MissingVersionInfo});
        return;
      }

      nextVersion.set({ id: version.get('id'), version_number: version.get('version_number') });
      deferred.resolve();

      return deferred.promise();
    }

  });

  return OpenVersionPerspectiveCommand;

});


csui.define('csui/utils/commands/versions',['csui/lib/underscore', 'csui/models/commands',
  'csui/utils/commands/versions/delete',
  'csui/utils/commands/versions/download',
  'csui/utils/commands/versions/open',
  'csui/utils/commands/versions/properties',
  'csui/utils/commands/versions/promote.version',
  'csui/utils/commands/versions/doc.version.preview',
  'csui/utils/commands/versions/open.version/open.version.delegate',
  'csui/utils/commands/versions/open.version.perspective',
  'csui/utils/commands/copy.link',
  'csui/utils/commands/email.link',
  // Load extra commands to be added to the common collection
  'csui-ext!csui/utils/commands/versions'
], function (_, CommandCollection,
    VersionDeleteCommand,
    VersionDownloadCommand,
    VersionOpenCommand,
    VersionPropertiesCommand,
    PromoteVersionCommand,
    DocVersionPreviewCommand,
    OpenVersionDelegateCommand,
    OpenVersionPerspectiveCommand,
    CopyLinkCommand,
    EmailLinkCommand,
    extraCommands) {
  'use strict';

  var commands = new CommandCollection([
    new VersionDeleteCommand(),
    new VersionDownloadCommand(),
    new VersionOpenCommand(),
    new VersionPropertiesCommand(),
    new PromoteVersionCommand(),
    new DocVersionPreviewCommand(),
    new OpenVersionDelegateCommand(),
    new OpenVersionPerspectiveCommand(),
    new CopyLinkCommand(),
    new EmailLinkCommand()
  ]);

  if (extraCommands) {
    commands.add(
        _.chain(extraCommands)
            .flatten(true)
            .map(function (Command) {
              return new Command();
            })
            .value()
    );
  }

  return commands;

});

csui.define('csui/utils/commands/filter',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log',
  'csui/utils/base', 'csui/utils/commandhelper', 'csui/models/command',
  'i18n!csui/utils/commands/nls/lang',

], function (module, _, $, log, base, CommandHelper, CommandModel, lang) {
  'use strict';

  var FilterCommand = CommandModel.extend({
    defaults: {
      signature: 'Filter'
    },

      enabled: function (status) {
          var config = module.config();
          if (config.enabled === false) {
              return false;
          }

          var isFilterShown = status && status.originatingView && status.originatingView.showFilter;
          if (isFilterShown === true && status.toolItem) {
              status.toolItem.set({'title': lang.FilterCollapseTooltip, toolItemAriaExpand: true, 'stateIsOn': true});
          }
          // Fix me: obtain these details from REST API, results.data.columns
          var isContainer = status.container && !!status.container.get('container');
          return !!isContainer && this._isSupported(status);
      },

    _isSupported: function (status) {
      // TODO: Make this extensible. not supported for Compound Document, Collection, and SAP DMS Folder.
      var container = status.container,
          notSupportedObjects = [136, 298];
      // Making this extensible. not supported for Virtual folder with zero items.
          if (status.collection && status.collection.length === 0 && container.get('type') === 899) {
            notSupportedObjects.push(899);
          }
       var   support             = $.inArray(container.get('type'), notSupportedObjects) === -1;
      return support;
    }

    // This command is not to be executed.
  });

  return FilterCommand;
});

csui.define('csui/utils/accessibility',['module'],
  function (module) {
  "use strict";

  var _accessibleMode = module.config().enabled || false;
  var _accessibleTable = module.config().accessibleTable || false;
  var _enforceDescriptionColumn = module.config().enforceDescriptionColumn;

  // holds state and functionality for the accessible mode of SmartUI.
  // components such as the table.view react to these settings and render / behave differently,
  // so the result will fare better in accessibility audits.
  var Accessibility = {

    // activates ALL settings affecting accessibility
    isAccessibleMode: function () {
      return _accessibleMode;
    },

    // only affects the table (folder browser) and related places
    isAccessibleTable: function() {
      return _accessibleMode || _accessibleTable;
    },

    shouldEnforceDescriptionColumn: function () {
      // If the value was not specified in the config, the variable will be undefined.  In this case default to true.
      if (_enforceDescriptionColumn === undefined) {
        return true;
      }

      return _enforceDescriptionColumn;
    }
  };

  return Accessibility;

});
csui.define('csui/utils/commands/description.toggle',["require", 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore',
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commandhelper", "csui/utils/commands/node",
  "csui/utils/command.error", "csui/utils/accessibility"
], function (require, $, base, _, lang, CommandHelper, NodeCommand, CommandError, Accessibility) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  var DescriptionToggleCommand = NodeCommand.extend({

    defaults: {
      signature: "ToggleDescription",
      command_key: ['description', 'description'],
      scope: "single",
      name: lang.CommandDescriptionToggle
    },

    //only one node allowed at a time
    enabled: function (status, options) {
      if (!accessibleTable && status.collection && !status.thumbnailViewState) {
        if (status.originatingView && status.originatingView.options.showDescriptions) {
          status.toolItem.attributes.name = lang.CommandHideDescription;
          status.toolItem.attributes.stateIsOn = true;
          // show descriptions in case table was already rendered
          status.originatingView.tableView.trigger('show:descriptions',true);
        }
        var nodeWithDescription = status.collection.find(function (node) {
          var descr = node.get('description');
          return !!descr;
        });
        return nodeWithDescription !== undefined;
      } else {
        return false;
      }
    },

    execute: function (status, options) {
      var originatingView = status.originatingView;
      var langStr;

      var toolbarListItem = originatingView.$el.find('li[data-csui-command="toggledescription"]');

      if (originatingView.options.showDescriptions) {
        originatingView.options.showDescriptions = false;
        langStr = lang.CommandShowDescription;
      } else {
        originatingView.options.showDescriptions = true;
        langStr = lang.CommandHideDescription;
      }

      // set stateIsOn in the toolItem to let it being drawn in the on state if stateIsOn is true
      // adjust tooltip and aria-label to the current state
      status.toolItem.set({
        'stateIsOn': originatingView.options.showDescriptions,
        'title': langStr,
        'aria-label': langStr
        }
      );

      originatingView.trigger('csui.description.toggled',
          {showDescriptions: originatingView.options.showDescriptions});
    }
  });

  return DescriptionToggleCommand;

});

csui.define('csui/utils/commands/thumbnail.toggle',["module", "require", 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/lib/underscore',
  'csui/models/command', 'csui/utils/accessibility',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, $, backbone, Marionette, _, CommandModel, Accessibility,  lang) {
  'use strict';
  var config = module.config();
  _.defaults(config, {
    enableGridView: false
  });
  var TaskQueue, Thumbnail,
      ThumbnailCommand = CommandModel.extend({

        defaults: {
          signature: "Thumbnail",
          command_key: ['thumbnail', 'thumbnail'],
          scope: "single",
          name: 'Thumbnail'
        },

        //only one node allowed at a time
        enabled: function (status, options) {
          if (status.collection && config.enableGridView &&  !Accessibility.isAccessibleMode()) {
            if (status.thumbnailViewState) {
              status.toolItem.attributes.iconName = "csui_action_switch_list32";
              status.toolItem.attributes.name = lang.ListViewTitle;
              status.toolItem.attributes.title = lang.ListViewTitle;
            }
            return true;
          } else {
            return false;
          }
        },

        execute: function (status, options) {
          var originatingView = status.originatingView || (options && options.originatingView),
              langStr,
              menuSelector    = '.csui-configuration-view .binf-dropdown-menu li[data-csui-command="thumbnail"] a';
          status.suppressFailMessage = true;
          status.suppressSuccessMessage = true;
          if (originatingView.thumbnailViewState) {
            langStr = lang.ThumbnailTitle;
            originatingView.$el.find('.binf-glyphicon-th-list').removeClass(
                "binf-glyphicon-th-list").addClass("binf-glyphicon-th-large");
            originatingView.$el.find('.binf-glyphicon-th-large')
                .parent().attr('title', langStr).attr('aria-label', langStr);
          } else {
            langStr = lang.ListViewTitle;
            originatingView.$el.find('.binf-glyphicon-th-large').addClass(
                "binf-glyphicon-th-list").removeClass("binf-glyphicon-th-large");
            originatingView.$el.find('.binf-glyphicon-th-list')
                .parent().attr('title', langStr).attr('aria-label', langStr);
          }
          originatingView.$el.find(menuSelector).attr('title', langStr)
              .contents().first().replaceWith(langStr);  // after the text, there can be right arrow
          return $.Deferred().resolve(status.collection).promise();
        }
      });

  return ThumbnailCommand;
});

csui.define('csui/utils/commands/save.filter',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings', 'csui/utils/url',
  'csui/models/command', 'csui/models/node/node.model'
], function (module, require, _, $, lang, Url, CommandModel, NodeModel) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 3
  });

  // Dependencies loaded in the execute method first
  var GlobalMessage, ConnectorFactory, NextNodeModelFactory, nodeLinks;

  var SaveFilterCommand = CommandModel.extend({
    defaults: {
      signature: "SaveFilter",
      command_key: ['savefilter', 'SaveFilter'],
      name: lang.CommandNameSaveFilter,
      verb: lang.CommandVerbSaveFilter
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      status.suppressSuccessMessage = true;
      csui.require([
        'csui/controls/globalmessage/globalmessage',
        'csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/next.node',
        'csui/utils/node.links/node.links'
      ], function () {
        GlobalMessage = arguments[0];
        ConnectorFactory = arguments[1];
        NextNodeModelFactory = arguments[2];
        nodeLinks = arguments[3];

        self._selectSaveFilterOptions(status, options)
            .done(function (selectedOptions) {
              var selectedNodes = status.nodes,
                  facets        = status.facets,
                  targetFolder  = selectedOptions.nodes[0],
                  filterName    = selectedOptions.filterName,
                  multiLingualData = selectedOptions.multiLingualData;
              var url = status.connector.getConnectionUrl().getApiBase('v2');
              var selectedFacets = [];
              $.each(facets.filters, function (idx, facet) {
                var facettypes = [], facetArrayType = [];
                if (facet.values instanceof Array) {
                  $.each(facet.values, function (index, facettype) {
                    facettypes.push(facettype.id);
                  });
                  facetArrayType.push(facet.id);
                  facetArrayType.push(facettypes);
                  selectedFacets.push(facetArrayType);
                }
              });
              var ajaxFormData = {
                'type': 899,
                'location_id': selectedNodes.models[0].get("id"),
                'name': filterName,
                'parent_id': targetFolder.get("id"),
                'selected_facets': selectedFacets
              };
              multiLingualData && _.extend(ajaxFormData,{
                name_multilingual: multiLingualData
              });
              var saveFilterOptions = {
                url: Url.combine(url, '/nodes'),
                type: 'POST',
                data: ajaxFormData,
                contentType: 'application/x-www-form-urlencoded'
              };

              status.connector.makeAjaxCall(saveFilterOptions)
                  .done(function (resp) {
                    deferred.resolve(resp.results);
                    var virtualFolderId   = resp.results.data.properties.id,
                        virtualFolderNode = new NodeModel({id: virtualFolderId},
                            {connector: context.getObject(ConnectorFactory)}),
                        name              = resp.results.data.properties.name,
                        msg               = _.str.sformat(lang.SaveFilterCommandSuccessfully, name),
                        options           = {
                          context: context,
                          nextNodeModelFactory: NextNodeModelFactory,
                          link_url: nodeLinks.getUrl(virtualFolderNode),
                          targetFolder: virtualFolderNode
                        },
                        dets; // leave details as undefined;
                    GlobalMessage.showMessage('success_with_link', msg, dets, options);
                  })
                  .fail(function (error) {
                    deferred.reject(error);
                    if (error && error.responseText) {
                      var errorObj = JSON.parse(error.responseText);
                      GlobalMessage.showMessage('error', errorObj.error);
                    }
                  });

            }).fail(function (error) {
          deferred.reject(error);
        });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    _selectSaveFilterOptions: function (status, options) {
      var self = this;
      var deferred = $.Deferred();

      csui.require(['csui/dialogs/node.picker/node.picker'],
          function (NodePicker) {
            var numNodes = status.nodes.length;
            var pickerOptions = _.extend({
              command: 'savefilter',
              selectableTypes: [-1],
              showAllTypes: true,
              orderBy: 'type asc',
              dialogTitle: lang.DialogTitleSaveFilter,
              initialContainer: status.container || status.nodes.models[0].parent,
              initialSelection: status.nodes,
              startLocation: '',
              includeCombineProperties: (numNodes === 1),
              propertiesSeletor: false,
              saveFilter: true,
              globalSearch: true,
              context: options ? options.context : status.context,
              startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
                'favorites', 'recent.containers'],
              resolveShortcuts: true,
              resultOriginalNode: true
            }, status);

            self.nodePicker = new NodePicker(pickerOptions);

            self.nodePicker
                .show()
                .done(function () {
                  deferred.resolve.apply(deferred, arguments);
                })
                .fail(function (error) {
                  deferred.reject.apply(deferred, arguments);
                });
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    }
  });

  return SaveFilterCommand;
});

csui.define('csui/utils/commands/save.query',[
  'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/models/command', 'csui/models/node/node.model'
], function (require, _, $, lang, CommandModel, NodeModel) {
  'use strict';

  // Dependencies loaded in the execute method first
  var GlobalMessage, ConnectorFactory, NextNodeModelFactory, nodeLinks, MetadataSaveQueryController;

  var SaveQueryCommand = CommandModel.extend({
    defaults: {
      signature: "SaveQuery",
      command_key: ['savequery', 'SaveQuery'],
      name: lang.CommandNameSaveQuery,
      verb: lang.CommandVerbSaveQuery
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      status.context = context;
      status.suppressSuccessMessage = true;
      csui.require([
        'csui/controls/globalmessage/globalmessage',
        'csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/next.node',
        'csui/utils/node.links/node.links',
        'csui/widgets/metadata/metadata.save.query.controller'
      ], function () {
        GlobalMessage = arguments[0];
        ConnectorFactory = arguments[1];
        NextNodeModelFactory = arguments[2];
        nodeLinks = arguments[3];
        MetadataSaveQueryController = arguments[4];

        self._selectSaveQueryOptions(status, options)
          .done(function (selectedOptions) {
            var targetFolder = selectedOptions.nodes[0],
              queryName = selectedOptions.filterName,
              multiLingualData = selectedOptions.multiLingualData;
            var ajaxFormData = {
              'type': 258,
              'name': queryName,
              'parent_id': targetFolder.get("id")
            };
            multiLingualData && _.extend(ajaxFormData, {
              name_multilingual: multiLingualData
            });

            var searchQueryModel = new NodeModel(ajaxFormData,
              {
                connector: status.connector
              });
            var metadataController = new MetadataSaveQueryController();

            metadataController._checkForRequiredMetadata(searchQueryModel, status).done(function (resp) {

              if (resp && resp.data) {
                ajaxFormData = _.extend(ajaxFormData, resp.data);
              }
              ajaxFormData = _.extend(ajaxFormData,
                {
                  search_cache_id: options.searching && options.searching.cache_id
                });

              var originatingView = status.originatingView;
              searchQueryModel.save(undefined, {
                data: ajaxFormData
              }).done(function (resp) {
                if (originatingView) {
                  originatingView.previousSavedQuery = resp.id;
                }
                deferred.resolve(resp);
                //Configure Go to location as parent folder of Saved search query
                var savedQueryParentNode = new NodeModel({ id: targetFolder.get("id") },
                  { connector: context.getObject(ConnectorFactory) }),
                  name = ajaxFormData.name,
                  msg = _.str.sformat(lang.SaveQueryCommandSuccessfully, name),
                  options = {
                    context: context,
                    nextNodeModelFactory: NextNodeModelFactory,
                    link_url: nodeLinks.getUrl(savedQueryParentNode),
                    targetFolder: savedQueryParentNode
                  },
                  dets; // leave details as undefined;
                GlobalMessage.showMessage('success_with_link', msg, dets, options);
              }).fail(function (error) {
                  deferred.reject(error);
                  if (error && error.responseText) {
                    var errorObj = JSON.parse(error.responseText);
                    GlobalMessage.showMessage('error', errorObj.error);
                  }
                });
            }).fail(function (error) {
              deferred.reject(error);
              if (error && error.responseText) {
                var errorObj = JSON.parse(error.responseText);
                GlobalMessage.showMessage('error', errorObj.error);
              }
            });
          }).fail(function (error) {
            deferred.reject(error);
          });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    _selectSaveQueryOptions: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      csui.require(['csui/dialogs/node.picker/node.picker'],
        function (NodePicker) {
          var pickerOptions = _.extend({
            command: 'savequery',
            selectableTypes: [-1],
            showAllTypes: true,
            orderBy: 'type asc',
            dialogTitle: lang.DialogTitleSaveQuery,
            startLocation: 'personal.volume',
            propertiesSeletor: false,
            saveFilter: true,
            globalSearch: true,
            context: options ? options.context : status.context,
            startLocations: ['enterprise.volume', 'personal.volume', 'favorites',
              'recent.containers'],
            resolveShortcuts: true,
            resultOriginalNode: true,
            selectButtonLabel: lang.saveButtonLabel
          }, status);

          self.nodePicker = new NodePicker(pickerOptions);

          self.nodePicker
            .show()
            .done(function () {
              deferred.resolve.apply(deferred, arguments);
            })
            .fail(function (error) {
              deferred.reject.apply(deferred, arguments);
            });
        }, function (error) {
          deferred.reject(error);
        });
      return deferred.promise();
    }
  });

  return SaveQueryCommand;
});
csui.define('csui/utils/commands/update.query',[
	'require', 'csui/lib/underscore', 'csui/lib/jquery',
	'i18n!csui/utils/commands/nls/localized.strings', 'csui/utils/url',
	'csui/models/command', 'csui/models/node/node.model'
], function (require, _, $, lang, Url, CommandModel, NodeModel) {
	'use strict';

	// Dependencies loaded in the execute method first
	var GlobalMessage, ConnectorFactory, NextNodeModelFactory, nodeLinks;

	var UpdateQueryCommand = CommandModel.extend({
		defaults: {
			signature: "UpdateQuery",
			command_key: ['updatequery', 'UpdateQuery'],
			name: lang.CommandNameUpdateQuery,
			verb: lang.CommandVerbUpdateQuery
		},

		execute: function (status, options) {
			var deferred = $.Deferred();
			var context = status.context || options && options.context;
			status.suppressSuccessMessage = true;
			csui.require([
				'csui/controls/globalmessage/globalmessage',
				'csui/utils/contexts/factories/connector',
				'csui/utils/contexts/factories/next.node',
				'csui/utils/node.links/node.links'
			], function () {
				GlobalMessage = arguments[0];
				ConnectorFactory = arguments[1];
				NextNodeModelFactory = arguments[2];
				nodeLinks = arguments[3];

				var url = status.connector.getConnectionUrl().getApiBase('v2');
				var ajaxFormData = {
					'search_cache_id': options.cache_id
				};
				var updateQueryOptions = {
					url: Url.combine(url, '/nodes/', options.queryId),
					type: 'PUT',
					data: ajaxFormData,
					contentType: 'application/x-www-form-urlencoded'
				};

				status.connector.makeAjaxCall(updateQueryOptions)
					.done(function (resp) {
						deferred.resolve(resp.results);
						//Get parent node's id of search query from the response 
						var updatedQueryParentNode = new NodeModel({ id: resp.results.data.properties.parent_id },
							{ connector: context.getObject(ConnectorFactory) }),
							name = resp.results.data.properties.name,
							msg = _.str.sformat(lang.UpdateQueryCommandSuccessfully, name),
							options = {
								context: context,
								nextNodeModelFactory: NextNodeModelFactory,
								link_url: nodeLinks.getUrl(updatedQueryParentNode),
								targetFolder: updatedQueryParentNode
							},
							dets;
						GlobalMessage.showMessage('success_with_link', msg, dets, options);
					})
					.fail(function (error) {
						deferred.reject(error);
						if (error && error.responseText) {
							var errorObj = JSON.parse(error.responseText);
							GlobalMessage.showMessage('error', errorObj.error);
						}
					});
			}, function (error) {
				deferred.reject(error);
			});
			return deferred.promise();
		}
	});

	return UpdateQueryCommand;
});
csui.define('csui/utils/commands/maximize.widget.view',['require', 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/models/command'
], function (require, $, base, _, lang, CommandHelper, CommandModel) {
  'use strict';

  var ExpandNodestableViewCommand = CommandModel.extend({

    defaults: {
      signature: "MaximizeWidgetView",
      scope: "single"
    },

    enabled: function (status, options) {
      var supportMaximizeWidget = $("body").hasClass("csui-support-maximize-widget");
      return (supportMaximizeWidget && $("body").hasClass("csui-maximized-widget-mode") === false);
    },

    execute: function (status, options) {
      status.context.trigger("maximize:widget", {widgetView: status.originatingView});
    }
  });

  return ExpandNodestableViewCommand;

});

csui.define('csui/utils/commands/restore.widget.size',['require', 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/models/command'
], function (require, $, base, _, lang, CommandHelper, CommandModel) {
  'use strict';

  var NormalizeNodestableViewCommand = CommandModel.extend({

    defaults: {
      signature: "RestoreWidgetViewSize",
      scope: "single"
    },

    enabled: function (status, options) {

      var isMaximizeMode = this.checkMaximizeMode(status);

      if (isMaximizeMode) {
        return false; //When showWidgetInMaxMode then disable the RestoreWidgetView
      } else {
        var supportMaximizeWidget = $("body").hasClass("csui-support-maximize-widget");
        return (supportMaximizeWidget && $("body").hasClass("csui-maximized-widget-mode") === true);
      }

    },

    checkMaximizeMode: function (status) {
      return status && status.context && status.context.perspective &&
             status.context.perspective.get("showWidgetInMaxMode");
    },

    execute: function (status, options) {
      status.context.trigger("restore:widget:size", {widgetView: status.originatingView});
    }
  });

  return NormalizeNodestableViewCommand;

});

csui.define('csui/utils/commands/permissions/apply.permission',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command','csui/utils/commandhelper',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel,
    CommandHelper, lang) {
  'use strict';

  var config = _.extend({}, module.config());

  var ApplyPermissionCommand = CommandModel.extend({
    defaults: {
      signature: 'ApplyPermission'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return false;
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      csui.require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        if (true) {
          deferred.resolve();
          GlobalMessage.showMessage('success', "Applied permissions to sub-items");
        } else {
          deferred.reject();
          GlobalMessage.showMessage('error', "Failed to apply permissions to sub-items");
        }
      }, deferred.reject);
      return deferred.promise();
    }
  });

  return ApplyPermissionCommand;
});

csui.define('csui/utils/commands/permissions/permission.util',[
  'module', 'require', 'csui/lib/underscore', "csui/lib/backbone", 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, Backbone, $, lang) {
  'use strict';

  function generateSuccessMessage(response, GlobalMessage) {
    var message;
    if (response.results.success > 0 && response.results.failure === 0) {
      message = _.str.sformat(
          response.results.success === 1 ? lang.AppliedPermissionsOneSuccess :
          lang.AppliedPermissionsOnlySuccess,
          response.results.success);
    } else if (response.results.success > 0 && response.results.failure > 0) {
      message = _.str.sformat(lang.AppliedPermissionsSuccessAndFailure,
          response.results.success, response.results.failure);
    } else if (response.results.success === 0 && response.results.failure > 0) {
      message = _.str.sformat(
          response.results.failure === 1 ? lang.AppliedPermissionsOneFailure :
          lang.AppliedPermissionsOnlyFailure,
          response.results.failure);
    }
    var errObject             = Backbone.Model.extend({
          defaults: {
            name: "",
            state: 'pending',
            commandName: 'ViewPermission'
          }
        }),
        errObjects            = [],
        failedFilesCollection = Backbone.Collection.extend({
          model: errObject
        }),
        errCollection         = new failedFilesCollection();

    for (var i = 0; response.results.failure > 0 && i < response.results.data.length; i++) {
      errObjects[i] = new errObject({
        name: response.results.data[i].name,
        mime_type: '',
        state: 'rejected'
      });
      errCollection.add(errObjects[i]);
    }
    var successCount = (response.results.success > 0 &&
                        response.results.failure > 0) ?
                       response.results.success : '',
        langTitle    = _.str.sformat(lang.ApplyingManyItemsSuccessMessage, successCount),
        successMsg   = successCount > 0 ? langTitle : ' ';

    response.results.failure > 0 ?
    GlobalMessage.showPermissionApplyingProgress(errCollection, {
      oneFileFailure: successMsg + lang.ApplyingOneItemFailMessage,
      someFileFailure: successMsg + _.str.sformat(lang.ApplyingManyItemsFailMessage2,
          errObjects.length),
      multiFileFailure: successMsg + _.str.sformat(lang.ApplyingManyItemsFailMessage2,
          errObjects.length)
    }) : '';

    (response.results.success > 0 && response.results.failure <= 0) ?
    GlobalMessage.showMessage('success', message ? message : lang.AppliedPermissions) : '';
  }

  return {
    generateSuccessMessage: generateSuccessMessage
  };
});
csui.define('csui/utils/commands/permissions/edit.permission',[
  'module', 'require', 'csui/lib/underscore', "csui/lib/backbone", 'csui/lib/jquery',
  'csui/utils/base',
  'csui/models/command', 'csui/utils/commandhelper', 'csui/utils/command.error',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commands/permissions/permission.util'
], function (module, require, _, Backbone, $, base, CommandModel,
    CommandHelper, CommandError, lang, PermissionUtil) {
  'use strict';

  var config = _.extend({}, module.config());

  var EditPermissionCommand = CommandModel.extend({
    defaults: {
      signature: 'EditPermission',
      command_key: ['editpermissions', 'Edit Permissions']
    },

    enabled: function (status) {
      var permissionModel        = status.model,
          type                   = permissionModel && permissionModel.get('right_id_expand') &&
                                                      permissionModel.get('right_id_expand').type,
          collection             = permissionModel && permissionModel.collection,
          right_id               = permissionModel && permissionModel.get('right_id'),
          permissionType         = permissionModel && permissionModel.get('type'),
          filterId               = status.filterId,
          nodeModel              = status.nodeModel || (status.originatingView &&
                                                        status.originatingView.model),
          userHasEditPermissions = nodeModel && nodeModel.actions &&
                                    !!nodeModel.actions.get({signature: 'editpermissions'}),
          memberTypeSupport      = [0,1],
          isDisable              = (memberTypeSupport.indexOf(type) < 0) && permissionType === "custom";
      if (!isDisable) {
        return !filterId && permissionType && (right_id || permissionType === "public") &&
             collection &&
             collection.options && collection.options.node && !!collection.options.node.get('id') &&
             userHasEditPermissions;
      } else {
        return false;
      }
    },

    execute: function (status, options) {
      var self            = this,
          deferred        = $.Deferred(),
          permissionModel = status.model,
          collection      = permissionModel.collection,
          targetView      = status.targetView;

      self.targetView = targetView;
      // avoid messages from handleExecutionResults
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;

      var failureMsg = this._getMessageWithUserDisplayName(lang.EditPermissionCommandFailMessage,
          permissionModel);
      var userHasEditPermissions = collection && collection.options && collection.options.node &&
                                   collection.options.node.actions.get(
                                       {signature: 'editpermissions'});

      if (collection && !!userHasEditPermissions) {
        permissionModel.nodeId = collection.options && collection.options.node &&
                                 collection.options.node.get('id');

        csui.require(
            ['csui/widgets/permissions/edit/edit.permission.helper',
              'csui/utils/contexts/factories/user', 'csui/controls/globalmessage/globalmessage',
              'csui/utils/permissions/permissions.precheck'
            ],
            function (EditPermissionHelper, UserModelFactory, GlobalMessage, PermissionPreCheck) {
              var user = status.originatingView.context.getModel(UserModelFactory);
              self.loginUserId = user.get('id');
              self.editPermissionHelper = new EditPermissionHelper({
                permissionModel: permissionModel,
                popoverPlacement: "left",
                popoverAtBodyElement: status.originatingView ?
                                      !status.originatingView.options.isExpandedView : true,
                popoverTargetElement: status.targetView.permissions.$el,
                readonly: false,
                originatingView: status.originatingView,
                applyTo: status.applyTo
              });
              self.editPermissionHelper._showSelectPermissionLevelPopover();
              self.editPermissionHelper.listenTo(self.editPermissionHelper,
                  "permissions:selected", function (userSelection) {
                    var saveAttr = {
                      "permissions": userSelection.permissions,
                      "apply_to": userSelection.apply_to,
                      "include_sub_types": userSelection.apply_to > 0 ?
                                           PermissionPreCheck.includeSubTypes() : []
                    };
                    if (userSelection.right_id) {
                      saveAttr.right_id = userSelection.right_id;
                    }
                    permissionModel.save(saveAttr, {
                      patch: true,  // let form data be 'body:{"name":"Pictures"}' and uploadable
                      // mixin makes it a PUT again (backbone would use PATCH)
                      wait: true,
                      silent: true
                    }).done(function (response) {

                      permissionModel.set(saveAttr, {silent: true});
                      status.originatingView.trigger('permission:changed', status);
                      //status.originatingView.render();
                      self.editPermissionHelper.destroy();
                      self.editPermissionHelper.unblockActions();
                      /*if (permissionModel.mustRefreshAfterPut !== false) {
                        return permissionModel.fetch();
                      }*/
                      deferred.resolve();
                      if (status.originatingView.model.get('permissions_model') !== 'simple') {
                        PermissionUtil.generateSuccessMessage(response, GlobalMessage);
                      } 
                    }).fail(function (error) {
                      var commandError = error ? new CommandError(error, permissionModel) :
                                         error;
                      GlobalMessage.showMessage('error', commandError);
                      deferred.reject(permissionModel, commandError);
                    });
                  });

              self.editPermissionHelper.listenTo(self.editPermissionHelper,
                  "closed:permission:level:popover", function () {
                    deferred.reject(permissionModel);
                  });
            });
      } else {
        return deferred.reject(
            new CommandError(failureMsg, {errorDetails: lang.undefinedCollection}));
      }
      return deferred.promise();
    },

    _getMessageWithUserDisplayName: function (unformattedMsg, permissionModel) {
      var displayName;
      if (permissionModel.get("right_id_expand")) {
        displayName = base.formatMemberName(permissionModel.get("right_id_expand"));
      } else if (permissionModel.get("type") === "public") {
        displayName = lang.publicAccess;
      }
      var msg = _.str.sformat(unformattedMsg, displayName);
      return msg;
    }
  });

  return EditPermissionCommand;
});

csui.define('csui/utils/commands/permissions/change.owner.permission',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', "csui/lib/marionette",
  'csui/models/command', 'csui/utils/command.error',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, _, $, Marionette, CommandModel, CommandError, lang) {
  'use strict';

  var config = _.extend({}, module.config());

  var ChangeOwnerPermissionCommand = CommandModel.extend({

    defaults: {
      signature: 'ChangeOwnerPermission',
      scope: 'single'
    },

    enabled: function (status) {
      var permissionModel    = status.model,
          type               = permissionModel && permissionModel.get('right_id_expand') &&
                                               permissionModel.get('right_id_expand').type,
          permissionType     = permissionModel && permissionModel.get('type'),
          nodeModel          = status.nodeModel || (status.originatingView &&
                                                 status.originatingView.model),
          enabled            = (permissionType &&
                               (permissionType === "owner" ||
                               permissionType === "group")) &&
                               (nodeModel && nodeModel.actions &&
                               !!nodeModel.actions.get({signature: 'editpermissions'})),
          title              = (enabled && permissionType === "owner") ?
                               lang.ChangeOwnerPermissionCommand :
                               lang.ChangeOwnerGroupPermissionCommand,
          memberTypeSupport  = [0,1],
          isDisable          = (memberTypeSupport.indexOf(type) < 0) && permissionType === "custom";
      if (permissionType === "group" && status.toolItem.attributes &&
          status.toolItem.attributes.icon) {
        status.toolItem.attributes.icon = "icon icon-group-change";
      }
      //set title
      status.toolItem && status.toolItem.set('name', title);

      return isDisable ? false : enabled;
    },

    execute: function (status, options) {
      var deferred          = $.Deferred(),
          permissionModel   = status.model,
          permissionType    = permissionModel.get("type"),
          collection        = permissionModel.collection,
          userExpandDetails = permissionModel.get("right_id_expand"),
          currentRow        = status.targetView.$el,
          self              = this;
      self.targetView = status.originatingView.permissionsContentView;
      var userHasEditPermissions = collection && collection.options && collection.options.node &&
                                   collection.options.node.actions.get(
                                       {signature: 'editpermissions'});

      if (collection && userHasEditPermissions) {
        permissionModel.nodeId = collection.options && collection.options.node &&
                                 collection.options.node.get('id');
        csui.require(['csui/controls/table/inlineforms/permissions/user.picker/user.picker.view',
              'csui/utils/contexts/factories/member', 'csui/models/permission/nodepermission.model',
              'csui/utils/contexts/factories/user', 'csui/utils/permissions/permissions.precheck'],
            function (UserPickerView, MemberModelFactory, NodePermissionModel, UserModelFactory,
                PermissionPreCheck) {
              var user = status.originatingView.context.getModel(UserModelFactory);
              self.loginUserId = user.get('id');
              var memberFilter = status.context.getModel(MemberModelFactory);
              var userPickerView = new UserPickerView({
                context: status.options ? status.options.context : status.context,
                userPickerModel: memberFilter,
                currentRow: currentRow,
                connector: status.connector,
                memberFilter: {type: (permissionType === 'owner' ? [0] : [1])}
              });
              currentRow.addClass("csui-changeowner-permission");
              currentRow.find(".member-info").addClass("binf-hidden");
              var userpickerRegion = new Marionette.Region({
                el: currentRow.find(".csui-inline-owner-change")
              });
              userpickerRegion.show(userPickerView);
              userPickerView.listenTo(userPickerView,
                  "change:completed", function (permissions) {
                    userpickerRegion.currentView.destroy();
                    deferred.resolve();
                  });
              userPickerView.listenTo(userPickerView, "member:selected:save",
                  function (args) {
                    var permissions = NodePermissionModel.getReadPermissions(),
                        saveAttr    = {
                          "permissions": permissionModel.get("permissions"),
                          "right_id": args.get("id"),
                          "include_sub_types": PermissionPreCheck.includeSubTypes()
                        };
                    permissionModel.set({'right_id_expand': args}, {silent: true});
                    permissionModel.save(saveAttr, {
                      patch: true,  // let form data be 'body:{"name":"Pictures"}' and uploadable
                      // mixin makes it a PUT again (backbone would use PATCH)
                      wait: true,
                      silent: true
                    }).done(function () {
                      permissionModel.set(saveAttr, {silent: true});
                      userpickerRegion.currentView.destroy();
                      currentRow.removeClass("csui-changeowner-permission");
                      currentRow.find(".member-info").removeClass(
                          "binf-hidden");

                      deferred.resolve();
                    }).fail(function (error) {
                      var commandError = error ? new CommandError(error, permissionModel) :
                                         error;
                      permissionModel.set({'right_id_expand': userExpandDetails}, {silent: true});
                      deferred.reject(permissionModel, commandError);
                    });
                  });
            });
      } else {
        var msg = _.str.sformat(lang.EditPermissionCommandFailMessage, lang.Owner);
        return deferred.reject(
            new CommandError(msg, {errorDetails: lang.undefinedCollection}));
      }
      return deferred.promise();
    }
  });
  return ChangeOwnerPermissionCommand;
});
csui.define('csui/utils/commands/permissions/delete.permission',[
  'module', 'require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/base', 'csui/models/command', 'csui/utils/commandhelper',
  'csui/utils/command.error', 'csui/utils/commands/confirmable',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, $, _, Backbone, base, CommandModel, CommandHelper,
    CommandError, ConfirmableCommand, lang) {
  'use strict';

  var config = _.extend({}, module.config());

  var GlobalMessage;

  var DeletePermissionCommand = CommandModel.extend({
    defaults: {
      signature: 'DeletePermission',
      scope: 'single'
    },

    allowCollectionRefetch: false,

    _getConfirmTemplate: function (status, options) {
      return _.template(lang.DeleteCommandConfirmDialogHtml);
    },

    _getConfirmData: function (status, options) {
      var permissionModel      = status.model,
          confirmDialogMessage = lang.DeletePermissionCommandConfirmDialogSingleMessage;
      if (permissionModel.get("type") === "public") {
        confirmDialogMessage = lang.DeletePermissionCommandConfirmDialogPublicAccessMessage;
      }
      var msg = this._getMessageWithUserDisplayName(
          confirmDialogMessage, permissionModel);

      var title = this._getMessageWithUserDisplayName(
          lang.DeletePermissionCommandConfirmDialogTitle, permissionModel);

      return {
        title: title,
        message: msg
      };
    },

    _getMessageWithUserDisplayName: function (unformattedMsg, permissionModel) {
      var displayName;
      if (permissionModel.get("right_id_expand")) {
        displayName = base.formatMemberName(permissionModel.get("right_id_expand"));
      } else if (permissionModel.get("type") === "public") {
        displayName = lang.publicAccess;
      }
      var msg;
      if (permissionModel.get('results') && permissionModel.get('results').success > 0) {
        msg = _.str.sformat(unformattedMsg, displayName,
            base.formatMessage(permissionModel.get('results').success, lang));
      } else {
        msg = _.str.sformat(unformattedMsg, displayName);
      }
      return msg;
    },

    enabled: function (status) {
      var permissionModel   = status.model,
          type              = permissionModel && permissionModel.get('right_id_expand') &&
                                               permissionModel.get('right_id_expand').type,
          collection        = permissionModel && permissionModel.collection,
          right_id          = permissionModel && permissionModel.get('right_id'),
          permissionType    = permissionModel && permissionModel.get('type'),
          filterId          = status.filterId,
          nodeModel         = status.nodeModel || (collection && collection.options &&
                                                  collection.options.node)
                                               || (status.originatingView && 
                                                  status.originatingView.model),
          enabled           = !filterId && permissionType &&
                              (right_id || permissionType === "public") &&
                              nodeModel.get('id') &&
                              nodeModel.actions &&
                              !!nodeModel.actions.get(
                                  {signature: 'editpermissions'}),
          memberTypeSupport = [0,1],
          isDisable         = (memberTypeSupport.indexOf(type) < 0) && permissionType === "custom";
      if (enabled) {
        this.setCommandTitle(status.toolItem, permissionModel);
      }

      return isDisable ? false : enabled;
    },

    setCommandTitle: function (toolItem, permissionModel) {
      var type = permissionModel.get("type"),
          title;
      if (type === "owner") {
        title = lang.DeletePermissionCommandRemoveOwner;
      } else if (type === "group") {
        title = lang.DeletePermissionCommandRemoveGroup;
      } else if (type === "public") {
        title = lang.DeletePermissionCommandRemovePublicAccess;
      } else {
        title = lang.DeletePermissionCommandRemoveOther;
      }
      toolItem.set("name", title);
    }
  });

  _.extend(DeletePermissionCommand.prototype, ConfirmableCommand, {
    execute: function (status, options) {
      var deferred = $.Deferred(),
          self     = this;
      options || (options = {});
      // avoid messages from handleExecutionResults
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;

      csui.require([
        'csui/controls/globalmessage/globalmessage',
        'csui/widgets/permissions/impl/edit/apply.permission/apply.permission.view',
        'csui/widgets/permissions/impl/edit/apply.permission/impl/header/apply.permission.header.view',
        'csui/controls/progressblocker/blocker',
        'csui/controls/dialog/dialog.view',
        'csui/utils/permissions/permissions.precheck'
      ], function (localGlobalMessage, ApplyPermissionView, ApplyPermissionHeaderView,
          BlockingView, DialogView, PermissionPreCheck) {
        GlobalMessage = localGlobalMessage;
        if (status.originatingView && status.originatingView.model &&
            status.originatingView.model.get("container")) {
          options.removePermission = true;
          self._executeDeletePermission(status, options, ApplyPermissionHeaderView,
              ApplyPermissionView, BlockingView, DialogView, PermissionPreCheck)
              .then(deferred.resolve, deferred.reject);
        } else {
          self._deletePermission(status, options).then(deferred.resolve, deferred.reject);
        }
      }, deferred.reject);
      return deferred.promise();
    },

    _deletePermission: function (status, options) {
      options || (options = {});
      return this._performActions(status, options);
    },

    _executeDeletePermission: function (status, options, ApplyPermissionHeaderView,
        ApplyPermissionView, BlockingView, DialogView, PermissionPreCheck) {
      options || (options = {});
      var deferred = $.Deferred();
      this.originatingView = status.originatingView;
      var headerView = new ApplyPermissionHeaderView({
        'removePermission': true,
        'permissionModel': status.model
      });
      this._view = new ApplyPermissionView({
        context: status.context,
        model: status.originatingView.model,
        permissionModel: status.model,
        removePermission: true,
        applyTo: status.applyTo,
        includeSubTypes: PermissionPreCheck.includeSubTypes(),
        originatingView: status.originatingView
      });
      var dialog = new DialogView({
        headerView: headerView,
        view: this._view,
        className: "csui-permissions-apply-dialog",
        midSize: true,
        buttons: [
          {
            id: 'apply',
            label: lang.applyButtonLabel,
            'default': true,
            click: function (args) {
              this._performActions(args).then(deferred.resolve, deferred.reject);
            }.bind(this)
          },
          {
            label: lang.cancelButtonLabel,
            close: true
          }
        ]
      });
      dialog.listenTo(dialog, 'hide', _.bind(this.onHideDialog, this));
      BlockingView.imbue(dialog);
      dialog.show();
      return deferred.promise();
    },

    onHideDialog: function () {
      var origView = this.originatingView;
      origView && origView.trigger("unblock:view:actions");
    },

    _performActions: function (status, options) {
      var self            = this,
          deferred        = $.Deferred(),
          permissionModel = status.dialog ? status.dialog.options.view.options.permissionModel :
                            status.model,
          permissionType  = permissionModel.get('type'),
          collection      = permissionModel.collection,
          failureMsg      = this._getMessageWithUserDisplayName(
              lang.DeletePermissionCommandFailMessage, permissionModel),
          deleteAttr;
          permissionModel.collection.models.forEach(function (item) {
            item.set('isAddNew', false);
          });
      if (collection && collection.options && collection.options.node &&
          collection.options.node.actions.get({signature: 'editpermissions'})) {
        permissionModel.nodeId = collection.options && collection.options.node &&
                                 collection.options.node.get('id');
        var container           = collection.options && collection.options.node &&
                                  collection.options.node.get("container"),
            permissionModelType = collection.options && collection.options.node &&
                                  collection.options.node.get("permissions_model");
        if (status.dialog) {
          permissionModel.apply_to = (container && permissionModelType === "advanced") &&
                                     status.dialog.options.view.subFolderSelected ? 2 :
                                     (container && permissionModelType === "advanced") ? 3 : 0;
          permissionModel.include_sub_types = permissionModel.apply_to > 0 ?
                                              status.dialog &&
                                              status.dialog.options.view.options.includeSubTypes :
              [];
        }
        if (self.originatingView && self.originatingView.blockActions) {
          self.destroyDialog(status);
          self.originatingView.blockActions();
        }
        var jqxhr = permissionModel.destroy({
          wait: true
        }).done(function (response) {
          //update the results
          permissionModel.set('results', response.results);
          self.originatingView && self.originatingView.trigger('permission:changed', self);
          if (self.originatingView && self.originatingView.unblockActions) {
            self.originatingView.unblockActions();
          }
          var successMsg = self._getMessageWithUserDisplayName(
              permissionModel.get('results') && permissionModel.get('results').success > 0 ?
              lang.DeletePermissionCommandSuccessMessageWithCount :
              lang.DeletePermissionCommandSuccessMessage, permissionModel);
          GlobalMessage.showMessage('success', successMsg);
          if (permissionType === "owner" || permissionType === "group") {
            //Check & Process for no owner condition
            collection.processForEmptyOwner && collection.processForEmptyOwner();
          }
          //self.destroyDialog(status);
          deferred.resolve(permissionModel);

        }).fail(function (error) {
          var commandError = error ? new CommandError(error, permissionModel) :
                             error;
          self.handleFailure(commandError, failureMsg);
          deferred.reject(permissionModel, commandError);
          if (!error) {
            jqxhr.abort();
          }
        }).always(function () {
          if (self.originatingView && self.originatingView.unblockActions) {
            self.originatingView.unblockActions();
          }
        });
        return deferred.promise();
      }
      else {
        self.destroyDialog(status);
        return deferred.reject(
            new CommandError(failureMsg, {errorDetails: lang.undefinedCollection}));
      }
    },

    handleFailure: function (commandError, oneFileFailure) {
      var errObject = Backbone.Model.extend({
            defaults: {
              name: "",
              state: 'pending',
              commandName: 'ViewPermission'
            }
          }),
          errObjects;

      var failedPermissionsCollection = Backbone.Collection.extend({
        model: errObject
      });
      var errCollection = new failedPermissionsCollection();
      errObjects = new errObject({
        name: commandError,
        mime_type: '',
        state: 'rejected'
      });
      errCollection.add(errObjects);
      GlobalMessage.showPermissionApplyingProgress(errCollection, {oneFileFailure: oneFileFailure});
    },

    destroyDialog: function (status) {
      status.dialog && status.dialog.destroy();
    }

  });

  return DeletePermissionCommand;
});

csui.define('csui/utils/commands/permissions/add.user.group',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
  'i18n!csui/utils/commands/nls/localized.strings', 'csui/utils/log',
  'csui/models/command', 'csui/utils/command.error'
], function (module, require, _, $, base, lang, log, CommandModel, CommandError) {
  'use strict';

  // Dependencies loaded in the execute method first
  var GlobalMessage, ModalAlert;
  var config = module.config();

  var AddUserOrGroupCommand = CommandModel.extend({
    defaults: {
      signature: "adduserorgroup",
      name: lang.CommandNameAddUserorGroup
    },

    enabled: function (status) {

      if (config && config.GrantAccessGroupOnly) {
        status.toolItem && status.toolItem.set({'name': lang.addGroups});
      }
      return true;
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      status.suppressSuccessMessage = true;
      csui.require(['csui/models/permission/nodepermission.model',
        'csui/utils/permissions/permissions.precheck',
        'csui/controls/globalmessage/globalmessage',
        'csui/dialogs/modal.alert/modal.alert'
      ], function (NodePermissionModel, PermissionPreCheck) {
        GlobalMessage = arguments[2];
        ModalAlert = arguments[3];

        self._selectAddUserOrGroupOptions(status, options)
            .done(function (selectedOptions) {
              var selectedMember      = selectedOptions.members,
                  selectedPermissions = selectedOptions.permissions,
                  permissionModelData = {
                    right_id: selectedMember.get('id'),
                    permissions: selectedPermissions,
                    apply_to: selectedOptions.apply_to,
                    include_sub_types: selectedOptions.apply_to > 0 ?
                                       PermissionPreCheck.includeSubTypes() : []
                  },
                  nodePermissionModel = new NodePermissionModel(permissionModelData, status);

              nodePermissionModel.nodeId = status.nodeId;
              if (status.originatingView && status.originatingView.blockActions) {
                status.originatingView.blockActions();
              }
              nodePermissionModel.save(permissionModelData, {
                silent: true,
                wait: true
              }).done(function () {
                nodePermissionModel.set({
                      right_id_expand: _.clone(selectedMember.attributes),
                      type: 'custom'
                    },
                    {silent: true});
                //status.permissionCollection.add(nodePermissionModel);
                GlobalMessage.showMessage('success',
                    self._getMessageWithUserDisplayName(nodePermissionModel));
                if (status.originatingView && status.originatingView.unblockActions) {
                  status.originatingView.unblockActions();
                }
                deferred.resolve(nodePermissionModel);
              }).fail(function (error) {
                var commandError = error ? new CommandError(error, nodePermissionModel) :
                                   error;
                if (status.originatingView && status.originatingView.unblockActions) {
                  status.originatingView.unblockActions();
                }
                GlobalMessage.showMessage('error', commandError);
                deferred.reject(nodePermissionModel, commandError);
              });
            })
            .fail(function (error) {
              deferred.reject(error);
            });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    _selectAddUserOrGroupOptions: function (status, options) {
      var self = this;
      var deferred = $.Deferred();

      csui.require(['csui/dialogs/members.picker/members.picker.wizard'],
          function (MembersPickerDialog) {
            var unSelectableMembers = status.originalCollection &&
                                      status.originalCollection.models &&
                                      status.originalCollection.models.length > 0 ?
                                      status.originalCollection.models :
                                      status.permissionCollection.models;
            unSelectableMembers = _.filter(unSelectableMembers, function (member) {
              return (member.get("type") === "custom");
            });
            var grantAccessGrpOnly = config && config.GrantAccessGroupOnly;
            var membersPickerDialog = new MembersPickerDialog({
              command: 'adduserorgroup',
              context: status.context,
              connector: status.connector,
              dialogClass: 'cs-permission-group-picker',
              displayName: (grantAccessGrpOnly) ? lang.allGroups : lang.allUsersAndGroups,
              dialogTitle: (grantAccessGrpOnly) ? lang.allGroups : lang.addUsersAndGroups,
              startLocation: (grantAccessGrpOnly) ? 'all.groups' : 'all.members',
              adduserorgroup: true,
              nodeModel: status.nodeModel,
              addButtonLabel: lang.AddButtonLabel,
              availablePermissions: status.permissionCollection.availablePermissions,
              startLocations: (grantAccessGrpOnly) ? ['all.groups', 'member.groups'] :
                  ['all.members', 'member.groups'],
              unselectableMembers: unSelectableMembers,
              applyTo: status.applyTo
            });
            membersPickerDialog
                .show()
                .done(function () {
                  deferred.resolve.apply(deferred, arguments);
                }).fail(function (error) {
              deferred.reject.apply(deferred, arguments);
            });
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    },

    _getMessageWithUserDisplayName: function (permissionModel) {
      var displayName;
      if (permissionModel.get("right_id_expand")) {
        displayName = base.formatMemberName(permissionModel.get("right_id_expand"));
      }
      var msg;
      if (permissionModel.get('results') && permissionModel.get('results').success > 0) {
        msg = _.str.sformat(lang.AddUserOrGroupSuccessWithCount, displayName,
            base.formatMessage(permissionModel.get('results').success, lang));
      } else {
        msg = _.str.sformat(lang.AddUserOrGroupSuccess, displayName);
      }
      return msg;
    }
  });

  return AddUserOrGroupCommand;
});
csui.define('csui/utils/commands/permissions/add.owner.group',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
  'i18n!csui/utils/commands/nls/localized.strings', 'csui/utils/log',
  'csui/models/command', 'csui/utils/command.error'
], function (module, require, _, $, base, lang, log, CommandModel, CommandError) {
  'use strict';

  // Dependencies loaded in the execute method first
  var GlobalMessage, ModalAlert;
  var config = module.config();

  var AddOwnerOrOwnerGroupCommand = CommandModel.extend({
    defaults: {
      signature: "addownerorgroup",
      name: lang.CommandNameAddOwnerOrOwnerGroup
    },

    enabled: function (status) {
      var collection     = status.originalCollection ? status.originalCollection :
                           status.permissionCollection,
          owner          = collection.findWhere({type: 'owner'}),
          noOwnerOrGroup = (owner && owner.get('permissions') === null),
          noGroup        = !collection.findWhere({type: 'group'}),
          enabled        = collection && (status.nodeModel && status.nodeModel.actions
                           && !!status.nodeModel.actions.get({signature: 'editpermissions'})) &&
                           (noOwnerOrGroup ||
                            noGroup || !owner),
          adminPrivilege = status.authUser &&
                           status.authUser.get('privilege_system_admin_rights');

      if (!adminPrivilege && config &&
          ((config.AdminRestoreOwner && config.AdminRestoreOwnerGroup) ||
           (!noOwnerOrGroup && noGroup && config.AdminRestoreOwnerGroup) ||
           (!noOwnerOrGroup && !noGroup && config.AdminRestoreOwner))) {
        enabled = adminPrivilege;
      }

      if (enabled && !!status.toolItem) {
        if (noOwnerOrGroup) {
          if (adminPrivilege) {
            status.toolItem.set('name', lang.AddOwnerOrGroup);
          } else {
            if (config && config.AdminRestoreOwner) {
              if (config && !config.AdminRestoreOwnerGroup) {
                status.toolItem.set('name', lang.AddOwnerGroup);
              }
            } else {
              if (config && config.AdminRestoreOwnerGroup) {
                status.toolItem.set('name', lang.AddOwner);
              } else {
                status.toolItem.set('name', lang.AddOwnerOrGroup);
              }
            }
          }
        } else if (noGroup) {
          status.toolItem.set('name', lang.AddOwnerGroup);
        } else {
          status.toolItem.set('name', lang.AddOwner);
        }
      }
      return enabled;
    },

    execute: function (status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      status.suppressSuccessMessage = true;
      csui.require(['csui/models/permission/nodepermission.model',
        'csui/utils/permissions/permissions.precheck',
        'csui/controls/globalmessage/globalmessage',
        'csui/dialogs/modal.alert/modal.alert'
      ], function (NodePermissionModel, PermissionPreCheck) {
        GlobalMessage = arguments[2];
        ModalAlert = arguments[3];

        self._selectAddOwnerOrOwnerGroupOptions(status, options)
            .done(function (selectedOptions) {
              var selectedMember      = selectedOptions.members,
                  selectedPermissions = selectedOptions.permissions,
                  type                = selectedMember.get('type') === 0 ? 'owner' : 'group',
                  permissionModelData = {
                    type: type,
                    right_id: selectedMember.get('id'),
                    permissions: selectedPermissions,
                    apply_to: selectedOptions.apply_to,
                    include_sub_type: selectedOptions.apply_to > 0 ?
                                      PermissionPreCheck.includeSubTypes() : []
                  },
                  saveAttr            = {
                    right_id: selectedMember.get('id'),
                    apply_to: selectedOptions.apply_to,
                    permissions: selectedPermissions
                  },
                  nodePermissionModel = new NodePermissionModel(permissionModelData, status);

              nodePermissionModel.nodeId = status.nodeModel ? status.nodeModel.get("id") :
                                           status.nodeId;
              if (status.originatingView && status.originatingView.blockActions) {
                status.originatingView.blockActions();
              }
              nodePermissionModel.save(saveAttr, {
                patch: true,
                silent: true,
                wait: true
              }).done(function () {
                nodePermissionModel.set(
                    {
                      right_id_expand: _.clone(selectedMember.attributes),
                      type: type,
                      addOwnerGroup: true
                    },
                    {silent: true});
                //status.permissionCollection.addOwnerOrGroup(nodePermissionModel);
                if (status.originatingView && status.originatingView.unblockActions) {
                  status.originatingView.unblockActions();
                }
                GlobalMessage.showMessage('success',
                    self._getMessageWithUserDisplayName(nodePermissionModel));
                deferred.resolve(nodePermissionModel);
              }).fail(function (error) {
                var commandError = error ? new CommandError(error, nodePermissionModel) :
                                   error;
                if (status.originatingView && status.originatingView.unblockActions) {
                  status.originatingView.unblockActions();
                }
                GlobalMessage.showMessage('error', commandError);
                deferred.reject(nodePermissionModel, commandError);
              });
            }).fail(function (error) {
          deferred.reject(error);
        });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },

    _selectAddOwnerOrOwnerGroupOptions: function (status, options) {
      var self              = this,
          deferred          = $.Deferred(),
          owner             = status.originalCollection ?
                              status.originalCollection.findWhere({type: 'owner'}) :
                              status.permissionCollection.findWhere({type: 'owner'}),
          displayName       = lang.allUsersAndGroups,
          selectableTypes, title, startLocation, startLocations,
          authUser = status.authUser || status.originatingView.options.authUser ||
                              (status.context && status.context._user);
      if (owner && owner.get('permissions') === null) {
        selectableTypes = [0, 1];
        title = lang.AddOwnerOrGroupDialogTitle;
        startLocation = 'all.members';
        startLocations = ['all.members', 'member.groups'];
        if (config && config.AdminRestoreOwner && !config.AdminRestoreOwnerGroup &&
            !(authUser.get('privilege_system_admin_rights'))) {
          startLocation = 'all.groups';
          displayName = lang.allGroups;
          selectableTypes = [1];
          startLocations = ['all.groups', 'member.groups'];
        } else if (config && !config.AdminRestoreOwner && config.AdminRestoreOwnerGroup &&
                   !(authUser.get('privilege_system_admin_rights'))) {
          startLocation = 'all.members';
          displayName = lang.allUsersAndGroups;
          selectableTypes = [0];
          startLocations = ['all.members', 'member.groups'];
        }

      }
      else {
        selectableTypes = owner ? [1] : [0];
        title = owner ? lang.AddOwnerGroupDialogTitle : lang.AddOwnerDialogTitle;
        displayName = owner ? lang.allGroups : displayName;
        startLocation = owner ? 'all.groups' : 'all.members';
        startLocations = owner ? ['all.groups', 'member.groups'] : ['all.members', 'member.groups'];
      }
      csui.require(['csui/dialogs/members.picker/members.picker.wizard'],
          function (MembersPickerDialog) {
            var membersPickerDialog = new MembersPickerDialog({
              command: 'addownerorownergroup',
              context: status.context,
              connector: status.connector,
              dialogClass: 'cs-permission-group-picker',
              displayName: displayName,
              dialogTitle: title,
              startLocation: startLocation,
              nodeModel: status.nodeModel,
              availablePermissions: status.permissionCollection.availablePermissions,
              adduserorgroup: true,
              addButtonLabel: lang.AddButtonLabel,
              startLocations: startLocations,
              selectableTypes: selectableTypes,              
              applyTo: status.applyTo
            });
            membersPickerDialog
                .show()
                .done(function () {
                  deferred.resolve.apply(deferred, arguments);
                }).fail(function (error) {
              deferred.reject.apply(deferred, arguments);
            });
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    },

    _getMessageWithUserDisplayName: function (permissionModel) {
      var displayName;
      if (permissionModel.get("right_id_expand")) {
        displayName = base.formatMemberName(permissionModel.get("right_id_expand"));
      }
      var msg;
      if (permissionModel.get('results') && permissionModel.get('results').success > 0) {
        msg = _.str.sformat(lang.AddUserOrGroupSuccessWithCount, displayName,
            base.formatMessage(permissionModel.get('results').success, lang));
      } else {
        msg = _.str.sformat(lang.AddUserOrGroupSuccess, displayName);
      }
      return msg;
    }
  });

  return AddOwnerOrOwnerGroupCommand;
});
csui.define('csui/utils/commands/permissions/restore.public.access',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/nls/localized.strings', 'csui/utils/base',
  'csui/utils/log', 'csui/models/command', 'csui/utils/command.error'
], function (module, require, _, $, lang, base, log, CommandModel,
    CommandError) {
  'use strict';

  var GlobalMessage;
  var config = module.config();

  var RestorePublicAccess = CommandModel.extend({
    defaults: {
      signature: 'restorepublicaccess',
      name: lang.CommandNameRestorePublicAccess
    },

    enabled: function (status) {
      var collection                   = status.originalCollection ? status.originalCollection :
                                         status.permissionCollection,
          nodeModel                    = status.nodeModel || (collection && collection.options &&
                                                            collection.options.node),
          userHasEditPermissionsAction = nodeModel && 
                                         nodeModel.actions.get({signature: 'editpermissions'}),
          authUser = status.authUser || (status.context && status.context._user);

      if (config && config.AdminRestorePublic) {
        userHasEditPermissionsAction = authUser &&
                                       authUser.get('privilege_system_admin_rights');
      }
      return collection && userHasEditPermissionsAction &&
             (!collection.findWhere({type: 'public'}));
    },

    execute: function (status) {
      var self       = this,
          deferred   = $.Deferred(),
          collection = status.permissionCollection,
          nodePermissionModel, saveAttr,
          nodeModel  = status.nodeModel || collection.node ||
                       (status.originatingView && status.originatingView.model);

      csui.require([
        'csui/models/permission/nodepermission.model',
        'csui/widgets/permissions/impl/edit/apply.permission/apply.permission.view',
        'csui/widgets/permissions/impl/edit/apply.permission/impl/header/apply.permission.header.view',
        'csui/controls/progressblocker/blocker',
        'csui/controls/dialog/dialog.view',
        'csui/controls/globalmessage/globalmessage',
        'csui/utils/permissions/permissions.precheck'
      ], function (NodePermissionModel, ApplyPermissionView, ApplyPermissionHeaderView,
          BlockingView, DialogView, localGlobalMessage, PermissionPreCheck) {
        GlobalMessage = localGlobalMessage;
        if (nodeModel && nodeModel.get("container")) {
          self._executeApplyPermission(status, nodeModel, ApplyPermissionHeaderView,
              ApplyPermissionView, BlockingView, DialogView, NodePermissionModel,
              PermissionPreCheck)
              .then(deferred.resolve, deferred.reject);
        } else {
          nodePermissionModel = new NodePermissionModel({type: 'public'}, status);
          saveAttr = {'permissions': NodePermissionModel.getReadPermissions()};
          nodePermissionModel.nodeId = status.nodeId;
          if (status.originatingView && status.originatingView.blockActions) {
            status.originatingView.blockActions();
          }
          nodePermissionModel.save(saveAttr, {
            patch: true,  // let form data be 'body:{"name":"Pictures"}' and uploadable
            // mixin makes it a PUT again (backbone would use PATCH)
            wait: true
          }).done(function () {
            nodePermissionModel.set({publicAccess: true}, {silent: true});
            //collection.addPublicAccess(nodePermissionModel);
            if (status.originatingView && status.originatingView.unblockActions) {
              status.originatingView.unblockActions();
            }
            var successMsg = self._getMessageWithUserDisplayName(
                nodePermissionModel.get('results') &&
                nodePermissionModel.get('results').success > 0 ?
                lang.RestorePublicAccessSuccessMessageWithCount :
                lang.RestorePublicAccessSuccessMessage, nodePermissionModel);
            GlobalMessage.showMessage('success', successMsg);
            deferred.resolve(nodePermissionModel);
          }).fail(function (error) {
            var commandError = error ? new CommandError(error, nodePermissionModel) :
                               error;
            if (status.originatingView && status.originatingView.unblockActions) {
              status.originatingView.unblockActions();
            }
            GlobalMessage.showMessage('error', commandError);
            deferred.reject(nodePermissionModel, commandError);
          });
        }
      });
      return deferred.promise();
    },

    _executeApplyPermission: function (status, nodeModel, ApplyPermissionHeaderView,
        ApplyPermissionView, BlockingView, DialogView, NodePermissionModel, PermissionPreCheck) {
      var deferred = $.Deferred();
      this.originatingView = status.originatingView;
      var headerView = new ApplyPermissionHeaderView({'restorePublicAccess': true});
      this._view = new ApplyPermissionView({
        context: status.context,
        model: nodeModel,
        permissionModel: new NodePermissionModel({type: 'public'}, status),
        permissions: NodePermissionModel.getReadPermissions(),
        includeSubTypes: PermissionPreCheck.includeSubTypes(),
        collection: status.permissionCollection,
        applyTo: status.applyTo,
        removePermission: false,
        originatingView: status.originatingView,
        restorePublicAccess: true
      });
      var dialog = new DialogView({
        headerView: headerView,
        view: this._view,
        className: "csui-permissions-apply-dialog",
        midSize: true,
        buttons: [
          {
            id: 'apply',
            label: lang.applyButtonLabel,
            'default': true,
            click: function(args) {              
              this._performActions(args).then(deferred.resolve,deferred.reject);
            }.bind(this)
         
          },
          {
            label: lang.cancelButtonLabel,
            close: true
          }
        ]
      });
      dialog.listenTo(dialog, 'hide', _.bind(this.onHideDialog, this));
      BlockingView.imbue(dialog);
      dialog.show();
      return deferred.promise();
    },

    onHideDialog: function () {
      var origView = this.originatingView;
      origView && origView.trigger("unblock:view:actions");
    },

    _performActions: function (status) {
      var self                = this,
          deferred            = $.Deferred(),
          permissionModel     = status.dialog ? status.dialog.options.view.options.permissionModel :
                                status.model,
          permissions         = status.dialog && status.dialog.options.view.options.permissions,
          originatingView     = status.dialog && status.dialog.options.view.options.originatingView,
          nodeModel           = status.dialog.options.view.model,
          collection          = status.dialog && status.dialog.options.view.options.collection,
          container           = nodeModel && nodeModel.get("container"),
          permissionModelType = nodeModel && nodeModel.get("permissions_model"), saveAttr;
          self.originatingView = originatingView;
          permissionModel.set('isAddNew', true);
      if (status.dialog) {
        permissionModel.apply_to = (container && permissionModelType === "advanced") &&
                                   status.dialog.options.view.subFolderSelected ? 2 :
                                   (container && permissionModelType === "advanced") ? 3 : 0;
        permissionModel.include_sub_types = permissionModel.apply_to > 0 ?
                                            status.dialog &&
                                            status.dialog.options.view.options.includeSubTypes : [];
      }
      saveAttr = {
        'permissions': permissions,
        'apply_to': permissionModel.apply_to,
        'include_sub_types': permissionModel.include_sub_types
      };
      permissionModel.nodeId = nodeModel.get("id");
      if (self.originatingView && self.originatingView.blockActions) {
        self.originatingView.blockActions();
      }
      permissionModel.save(saveAttr, {
        patch: true,  // let form data be 'body:{"name":"Pictures"}' and uploadable
        // mixin makes it a PUT again (backbone would use PATCH)
        wait: true
      }).done(function () {
        permissionModel.set({publicAccess: true}, {silent: true});
        self.destroyDialog(status);
        collection.addPublicAccess(permissionModel);
        if (self.originatingView && self.originatingView.unblockActions) {
          self.originatingView.unblockActions();
        }
        var successMsg = self._getMessageWithUserDisplayName(
            permissionModel.get('results') && permissionModel.get('results').success > 0 ?
            lang.RestorePublicAccessSuccessMessageWithCount :
            lang.RestorePublicAccessSuccessMessage, permissionModel);
        GlobalMessage.showMessage('success', successMsg);
        deferred.resolve(permissionModel);
      }).fail(function (error) {
        var commandError = error ? new CommandError(error, permissionModel) :
                           error;
        self.destroyDialog(status);
        if (self.originatingView && self.originatingView.unblockActions) {
          self.originatingView.unblockActions();
        }
        GlobalMessage.showMessage('error', commandError);
        deferred.reject(permissionModel, commandError);
      }); 
      return deferred.promise();     
    },

    _getMessageWithUserDisplayName: function (unformattedMsg, permissionModel) {
      var displayName;
      if (permissionModel.get("type") === "public") {
        displayName = lang.publicAccess;
      }
      var msg;
      if (permissionModel.get('results') && permissionModel.get('results').success > 0) {
        msg = _.str.sformat(unformattedMsg, displayName,
            base.formatMessage(permissionModel.get('results').success, lang));
      } else {
        msg = _.str.sformat(unformattedMsg, displayName);
      }
      return msg;
    },

    destroyDialog: function (status) {
      status.dialog && status.dialog.destroy();
    }
  });

  return RestorePublicAccess;
});

csui.define('csui/utils/commands/personalize.page',[
  'module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel, CommandHelper, lang) {
  'use strict';
  var config = _.extend({
    enablePersonalization: true
  }, config, module.config());

  var PersonalizePageCommand = CommandModel.extend({

    defaults: {
      signature: 'PersonalizePage',
      name: lang.personalizePage
    },

    enabled: function (status, options) {
      var context    = status.context || options && options.context,
          perspective = context.perspective;
      return config.enablePersonalization && perspective && (perspective.get('type') === 'flow'||
             perspective.get('type') === 'sidepanel-right' || perspective.get('type') === 'sidepanel-left');
    },

    execute: function (status, options) {
      var context         = status.context || options && options.context,
      enablePersonalization = (options && options.enablePersonalization) ||
                            config.enablePersonalization;
      if (enablePersonalization) {
        // Edit perspective of page inline in SmartUI
        return this._initPersonalization(status, options, context);
      }
    },

    _initPersonalization: function (status, options, context) {
      var deferred = $.Deferred(),
          self     = this;
      csui.require(['csui/perspective.manage/pman.view', 'csui/utils/contexts/factories/node', 
      'csui/models/perspective/personalization.model'],
          function (PManView,  NodeModelFactory, PersonalizationModel) {
                var node              = CommandHelper.getJustOneNode(status) ||
                              context.getModel(NodeModelFactory),
                              currentPerspective = context.perspective.toJSON(),
                personalizationModel = new PersonalizationModel(currentPerspective, {node: node, context: context});
                personalizationModel.fetch().then(function() {
                  var pmanView = new PManView({
                    context: context,
                    perspective: personalizationModel,
                    mode: PManView.MODE_PERSONALIZE
                  });
                  pmanView.show();
                  deferred.resolve();
                });                
          }, deferred.reject);
      return deferred.promise();
    },
  });

  return PersonalizePageCommand;
});

csui.define('csui/utils/commands/version.settings',['csui/models/command'
], function (CommandModel) {
  'use strict';

  var VersionSettingsCommand = CommandModel.extend({

    defaults: {
      signature: "VersionsControl",
      command_key: ['versionscontrol'],
      scope: "single",
      name: 'VersionsSettings'
    }
    // This command is not to be executed
  });

  return VersionSettingsCommand;
});


csui.define('csui/controls/treebrowse/navigation.tree',['module',
  'csui/lib/backbone', "csui-ext!csui/controls/treebrowse/navigation.tree"
], function (module, Backbone, moduleConfigs) {
  'use strict';

  var config            = module.config(),
      enableSystemLevel = !!config.enable;
  moduleConfigs = moduleConfigs || [];
  var configModel      = Backbone.Model.extend({
        defaults: {
          sequence: 100,
          enabled: function (status, options) {
            return false;
          },
          data: function (status, options) {
            return {};
          }
        }
      }),
      configCollection = Backbone.Collection.extend({
        model: configModel,
        comparator: 'sequence'
      });

  var NavigationTree = {

    enabled: function (status, options) {
      if (!!enableSystemLevel) {
        return true;
      }
      var enabled                = false,
          moduleConfigCollection = new configCollection(moduleConfigs);
      moduleConfigCollection.some(function (mConfig) {
        enabled = mConfig.get('enabled')(status, options);
        if (enabled) {
          status.originatingView.treeData = mConfig.get('data')(status, options);
        }
        enabled = enabled ? true : enabled;
        return enabled;
      });
      return enabled;
    }
  };

  return NavigationTree;

});

csui.define('csui/utils/commands/tree.browse',['csui/lib/jquery', 'csui/lib/underscore', 'csui/models/command',
  'csui/controls/treebrowse/navigation.tree',
  'i18n!csui/utils/commands/nls/lang'
], function ($, _, CommandModel, NavigationTree, lang) {
  'use strict';

  var TreeBrowseCommand = CommandModel.extend({

    defaults: {
      signature: "TreeBrowse",
      scope: "single"
    },

    enabled: function (status, options) {
      var showTree = status && status.originatingView && status.originatingView.showTree;
      if (showTree === true && status.toolItem) {
        status.toolItem.set({'title': lang.TreeBrowseCollapseTooltip, toolItemAriaExpand: true, 'stateIsOn': true});
      }

      return NavigationTree.enabled(status, options);
    },
  });

  return TreeBrowseCommand;

});

csui.define('csui/utils/commands/content.server.administration',['module', 'require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/models/command',
  'csui/utils/url', 'csui/utils/commands/open.classic.page',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, _, $, CommandModel, Url, OpenClassicPageCommand, lang) {

  'use strict';
  var ConnectorFactory;
  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/contexts/factories/user'] || {};
  config = _.extend({
    initialResponse: {
      data: {
        privilege_system_admin_rights: false
      }
    },
    // Allow defining a value specific for this command
    openInNewTab: null
  }, config, module.config());

  if (config.openInNewTab === null) {
    config.openInNewTab = OpenClassicPageCommand.openInNewTab;
  }

  var ContentServerAdministration = CommandModel.extend({

    defaults: {
      signature: 'ContentServerAdministration',
      name: lang.ContentServerAdministrationCommandName
    },

    enabled: function (status, options) {
      return config.initialResponse.data.privilege_system_admin_rights;
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          context  = status.context || options && options.context,
          target   = config.openInNewTab && window.open('', '_blank') || window,
          self     = this;
      target.focus();
      csui.require(['csui/utils/contexts/factories/connector',
      ], function () {
        ConnectorFactory = arguments[0];
        target.location.href = self._getUrl(context, status);
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    },

    _getUrl: function (context, status) {
      var connector          = context.getObject(ConnectorFactory),
          cgiUrl             = new Url(connector.connection.url).getCgiScript(),
          urlQueryParameters = this._getUrlQueryParameters(context, status),
          urlQuery           = Url.combineQueryString(urlQueryParameters);
      return Url.appendQuery(cgiUrl, urlQuery);
    },

    _getUrlQueryParameters: function (context, status) {
      var parameters = {func: 'admin.index'};
      return parameters;
    }

  });

  return ContentServerAdministration;

});
csui.define('csui/utils/commands/about.box',["module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
    "i18n!csui/utils/commands/nls/localized.strings",
    "csui/utils/commandhelper", "csui/models/command", "csui/utils/url",
], function (module, _, $, Backbone, lang, CommandHelper, CommandModel, URL) {
    'use strict';

    var config = module.config();
    _.defaults(config, {
        enableAboutBox: false,
        aboutBoxContentView: "csui/controls/about.box/about.box.view"
    });

    var AboutBoxCommand = CommandModel.extend({

        defaults: {
            signature: "AboutBox",
            command_key: ['AboutBox', 'AboutBox'],
            scope: "single"
        },

        enabled: function (status, options) {
            return config.enableAboutBox;
        },

        execute: function (status, options) {
            var nodes = CommandHelper.getAtLeastOneNode(status),
                node = CommandHelper.getJustOneNode(status);
            return this.showAboutBox();
        },

        showAboutBox: function () {
            var deferred = $.Deferred();
            var self                = this,
                aboutBoxContentView = config.aboutBoxContentView;
            csui.require(["csui/controls/dialog/dialog.view", "i18n!csui/pages/start/nls/lang",
                aboutBoxContentView
            ], function (DialogView, PublicLang, AboutBoxView) {
                var aboutBoxView = new AboutBoxView(),
                    dialogView   = new DialogView({
                        view: aboutBoxView,
                        midSize: true,
                        className: 'csui-about-box',
                        title: lang.brandTitle + PublicLang.ProductName,
                        headers: [
                            {
                                class: 'csui-logo-image'
                            }],

                    });
                dialogView.show();
                deferred.resolve();
                aboutBoxView &&
                aboutBoxView.listenToOnce(dialogView, 'destroy', function () {
                    aboutBoxView.trigger('destroy');
                });
            });
            return deferred.promise();
        }
    });
    return AboutBoxCommand;
});

csui.define('csui/utils/commands/restructure.command',['require', 'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/url',
  'csui/utils/base',
  'csui/models/command',
  'csui/utils/command.error',
  'i18n!csui/utils/commands/nls/root/localized.strings'
], function (require, module, _, $, Url, base, CommandModel, CommandError, lang) {
  'use strict';

  var config = _.extend({}, module.config());
  _.defaults(config, {
    actionType: 'restructure'
  });

  var RestructureView, GlobalMessage, DialogView, SidePanelView, ModalAlert, NodeLinks,
      ConflictResolver,
      ApplyPropertiesSelectorView,
      ensureDependencies = _.once(function () {
        var deferred = $.Deferred();
        csui.require(['csui/controls/globalmessage/globalmessage',
          'csui/dialogs/restructure/restructure.dialog',
          'csui/controls/dialog/dialog.view',
          'csui/dialogs/modal.alert/modal.alert',
          'csui/controls/side.panel/side.panel.view',
          'csui/utils/node.links/node.links',
          'csui/controls/conflict.resolver/conflict.resolver',
          'csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view',
          'csui/utils/page.leaving.blocker',
          'csui/utils/contexts/factories/application.scope.factory'
        ], function (arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
          GlobalMessage = arg1;
          RestructureView = arg2;
          DialogView = arg3;
          ModalAlert = arg4;
          SidePanelView = arg5;
          NodeLinks = arg6;
          ConflictResolver = arg7;
          ApplyPropertiesSelectorView = arg8;
          deferred.resolve();
        }, function (error) {
          deferred.reject(error);
        });
        return deferred.promise();
      });

  var RestructureCommand = CommandModel.extend({
    defaults: {
      signature: "Restructure",
      command_key: ["restructure", "restructure"],
      name: lang.CommandNameRestructure,
      scope: "multiple",
      labels: {
        actionName: lang.RestructuringNodes,
        actionNode: lang.RestructuringNode,
        commandTitle: lang.CommandTitleRestructure,
        commandName: lang.CommandNameRestructure,
        dialogTitle: lang.DialogTitleRestructure,
        dialogTitleSingle: lang.DialogTitleSingleRestructure,
        titleNotAllowed: lang.RestructureNotAllowed,
      },
    },

    enabled: function (status, options) {
      return CommandModel.prototype.enabled.call(this, status, options);
    },

    execute: function (status, options) {
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      status.restructureCommand = this;
      status.connector = this.connector =
          status.originatingView && status.originatingView.connector;

      this.context = status.context || (options && options.context);
      this.status = status;

      var self = this;

      return ensureDependencies().then(function () {
        var contentView = new RestructureView(status);
        var restructureDialog = new SidePanelView({
          title: lang.RestructureDialogTitle,
          subTitle: status.nodes.length + " " + lang.files,
          content: contentView,
          id: "csui-restructure-Slide-Panel",
          buttons: [
            {
              id: "restructure",
              className: "binf-btn binf-btn-primary",
              label: lang.Restructure,
              default: true,
              disabled: true,
              click: _.bind(self.onClickRestructureButton, self),
            },
          ],
        });
        self.restructureDialog = restructureDialog;
        self.contentView = contentView;
        restructureDialog.show();
      });
    },

    onClickRestructureButton: function () {
      var self     = this,
          deferred = $.Deferred();

      this._performRestructure()
          .done(function () {
            ModalAlert.showInformation(lang.confirmationRestructure, {
              titleIcon: "csui-icon-notification-information",
            });
            self.restructureDialog.destroy();
            deferred.resolve();
            self.status.nodes.reset();
          })
          .fail(function (error) {
            self._showError(error);
            deferred.reject();
          })
          .always(function () {
            self._unblockActions(self.contentView);
          });
    },

    _performRestructure: function () {
      var self     = this,
          deferred = $.Deferred();

      var selectedNodes = this.contentView.selectedNodes;
      var selectedOptions =
              this.contentView.restructureFormView.selectedOptions;
      var targetFolder =
              this.contentView.restructureFormView.selectedOptions[0];
      var applyProperties =
              this.contentView.restructureFormView.applyProperties;
      var bundleNumber = new Date().getTime();
      var labels = this.get("labels");
      var context = this.context;
      selectedOptions.applyProperties = applyProperties;
      selectedOptions.openSelectedProperties =
          this.contentView.restructureFormView.openSelectedProperties;


      this.restructureDialog.hide();
      var namesToResolve = selectedNodes.map(function (node) {
        var returnObj = {
          id: node.get("id"),
          name: node.get("name"),
          container: node.get("container"),
          mime_type: node.get("mime_type"),
          original_id: node.get("original_id"),
          original: node.original,
          type: node.get("type"),
          size: node.get("size"),
          type_name: node.get("type_name"),
          state: "pending",
          count: 0,
          total: 1,
          enableCancel: false,
          bundleNumber: bundleNumber,
        };
        var type = node.get("type");
        if (type === 144 || type === 749 || type === 736 || type === 30309) {
          returnObj.size_formatted = node.get("size_formatted");
        } else if (type === 140) {
          returnObj.url = node.get("url");
        }
        returnObj.actions = node.actions;
        returnObj.targetLocation = {
          id: targetFolder.get("id"),
          url: NodeLinks.getUrl(targetFolder),
        };
        var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
        if (mlDataEnabled) {
          (returnObj.multilingual_provided = true),
          !!node.has("name_multilingual") &&
          (returnObj.name_multilingual = node.get("name_multilingual"));
          !!node.has("description_multilingual") &&
          (returnObj.description_multilingual = node.get(
              "description_multilingual"
          ));
        }
        return returnObj;
      });
      var actionNamesToResolve = _.map(namesToResolve, function (name) {
        return _.clone(name);
      });

      this._resolveNamingConflicts(targetFolder, actionNamesToResolve, labels)
          .done(function (actionInstructions) {
            _.each(actionInstructions, function (instruction) {
              if (instruction.id === undefined) {
                instruction.id = _.findWhere(namesToResolve, {
                  name: instruction.name,
                }).id;
              }
            });
            var that = self;
            self
                ._metadataHandling(
                    actionInstructions,
                    labels,
                    _.extend(selectedOptions, {
                      context: context,
                      targetFolder: targetFolder,
                    })
                )
                .done(function () {
                  var connector, startProcess, notifyUsers, reference, comment, values,
                      selectedNodes, applyProperties, openSelectedProperties, selectedNodeIDs;

                  //reading values form Restructure form  view
                  values = that.contentView.restructureFormView.getValues();
                  connector = that.status.container && that.status.container.connector;
                  selectedNodes = that.status && that.status.nodes;
                  applyProperties = selectedOptions.applyProperties;
                  selectedNodeIDs = [];

                  if (values) {
                    startProcess = values.startProcessAt;
                    notifyUsers = values.notifyUsers;
                    reference = values.reference;
                    comment = values.comment;
                  }

                  _.each(selectedNodes.models, function (model) {
                    selectedNodeIDs.push({dataid: model.get("id")});
                  });

                  var options = {
                    connector: connector,
                    targetFolder: targetFolder,
                    applyProperties: applyProperties ? applyProperties - 1 : 0,
                    status: that.status,
                    context: context,
                    collection: that.status.collection,
                    startProcess: startProcess,
                    notifyUsers: notifyUsers,
                    reference: reference,
                    comment: comment,
                    selectedNodeIDs: selectedNodeIDs,
                  };

                  that
                      .getExternalBodyParams(
                          options.connector,
                          options.selectedNodeIDs
                      )
                      .then(function (extBodyParams) {
                        that
                            ._restructureNodeWithMetadata(
                                actionInstructions,
                                extBodyParams,
                                options
                            )
                            .done(function () {
                              deferred.resolve();
                            })
                            .fail(function (error) {
                              var errObj = new CommandError(error);
                              deferred.reject(errObj);
                            });
                      });
                })
                .fail(function () {
                  deferred.reject();
                });
          })
          .fail(function (error) {
            // resolve namingConflicts
            if (
                error &&
                error.userAction &&
                error.userAction === "cancelResolveNamingConflicts"
            ) {
              self.trigger("resolve:naming:conflicts:cancelled");
            } else if (error && !error.cancelled) {
              // if not undefined (cancel) then display error
              self.showError(error);
            }
            deferred.reject();
          });

      return deferred.promise();
    },

    checkMultilingualInfo: function (instructions, params) {
      _.each(instructions, function (instruction) {
        _.each(params.nodes, function(node){
            if((node.dataid === instruction.id) && !!instruction.multilingual_provided) {
              instruction.name_multilingual &&
             (node.name_multilingual = instruction.name_multilingual);
              instruction.description_multilingual &&
             (node.description_multilingual = instruction.description_multilingual);
            }
        });
      });
    },

    _resolveNamingConflicts: function (targetFolder, nodeNames, labels) {
      var h1 =
              nodeNames.length === 1
              ? labels.actionNode
              : _.str.sformat(labels.actionName, nodeNames.length);
      var conflictResolver = new ConflictResolver({
        h1Label: h1,
        actionBtnLabel: labels.commandName,
        excludeAddVersion: true,
        container: targetFolder,
        files: nodeNames,
        originatingView: this.originatingView,
      });
      return conflictResolver.run();
    },

    _metadataHandling: function (items, labels, options) {
      var deferred = $.Deferred();
      this.originatingView &&
      this.originatingView._blockingCounter === 0 &&
      this.originatingView.blockActions();
      csui.require([
        "csui/widgets/metadata/metadata.copy.move.items.controller",
      ], function (MetadataCopyMoveItemsController) {
        var openMetadata = options.openSelectedProperties;
        var applyProperties = options.applyProperties;
        var metadataController = new MetadataCopyMoveItemsController();
        var controllerFunction;

        // open the metadata view
        if (openMetadata) {
          controllerFunction = metadataController.CopyMoveItemsWithMetadata;
        } else if (
            applyProperties ===
            ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES ||
            applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES
        ) {
          // check for required metadata
          controllerFunction = metadataController.CopyMoveItemsRequiredMetadata;
        } else {
          return deferred.resolve();
        }

        if (
            applyProperties ===
            ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES
        ) {
          options.inheritance = "original";
        } else if (
            applyProperties ===
            ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES
        ) {
          options.inheritance = "destination";
        } else if (
            applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES
        ) {
          options.inheritance = "merged";
        }

        options.action = config.actionType;
        controllerFunction
            .call(metadataController, items, options)
            .done(function () {
              deferred.resolve();
            })
            .fail(function (error) {
              deferred.reject(error);
            });
      }, function (error) {
        deferred.reject(error);
      });

      return deferred.promise();
    },

    _showError: function (error) {
      if (error && !error.cancelled) {
        var cmdErr = new CommandError(error);

        GlobalMessage.showMessage(
            "error",
            lang.errorRestructure,
            cmdErr.errorDetails || cmdErr.message
        );
      }
      this.restructureDialog.destroy();
    },

    _blockActions: function (view) {
      var collectionView = view && (view.resultsView || view.tableView);
      collectionView && collectionView.blockActions();
    },

    _unblockActions: function (view) {
      var collectionView = view && (view.resultsView || view.tableView);
      collectionView && collectionView.unblockActions();
    },

    getExternalBodyParams: function (connector, selectedNodeIds) {
      return $.Deferred().resolve(this.externalBodyParams).promise();
    },

    externalBodyParams: {},

    _restructureNodeWithMetadata: function (
        instructions,
        extBodyParams,
        options
    ) {
      var bodyParam, url;

      url = Url.combine(
          this.connector.getConnectionUrl().getApiBase("v2") + "restructure"
      );
      bodyParam = {
        parent_id: options.targetFolder.get("id"),
        nodes: options.selectedNodeIDs,
        startdate: options.startProcess,
        userstobenotified: options.notifyUsers,
        subject: options.reference,
        message: options.comment,
        AttrSourceType: options.applyProperties,
      };
      _.extend(bodyParam, extBodyParams);

      //handle multilingual data
      _.isFunction(this.checkMultilingualInfo) &&
      this.checkMultilingualInfo(instructions, bodyParam);

      //handle category data
      _.each(instructions, function (instruction) {
        _.each(bodyParam.nodes , function(node) {
            if(node.dataid === instruction.id) {
              node.roles = instruction.extended_data && instruction.extended_data.roles;
            }
        });
      });

      var restructureOptions = this.connector.extendAjaxOptions({
        url: url,
        method: "PUT",
        data: bodyParam,
        contentType: this.connector.getAjaxContentType(),
      });

      return this.connector.makeAjaxCall(restructureOptions);
    },
  });
  return RestructureCommand;
});
csui.define('csui/temporary/cop/commands/open.blog',['csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {
  'use strict';

  var OpenBlogCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenBlog'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status),
          type = node && node.get('type');
      return type === 356 || type === 357;
    },

    getUrlQueryParameters: function (node, options) {
      var blog = node.get('type') === 356;
      return {
        func: 'll',
        objAction: blog ? 'view' : 'viewincontainer',
        // TODO: Is the logStopConditionID parameter important for the blog entry?
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenBlogCommand;

});

csui.define('csui/temporary/cop/commands/open.faq',['csui/lib/jquery', 'csui/utils/commandhelper',
  'csui/utils/commands/open.classic.page'
], function ($, CommandHelper, OpenClassicPageCommand) {
  'use strict';

  var OpenFaqCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenFAQ'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status),
          type = node && node.get('type');
      return type === 123475 || type === 123476;
    },

    getUrlQueryParameters: function (node, options) {
      var faq = node.get('type') === 123475,
          urlQuery = $.param({
            func: 'll',
            objAction: 'view',
            objId: faq ? node.get('id') : node.get('volume_id'),
            nexturl: location.href
          });
      return faq ? urlQuery : urlQuery + '#entry_' + node.get('id');
    }

  });

  return OpenFaqCommand;

});

csui.define('csui/temporary/cop/commands/open.forum',['csui/lib/jquery', 'csui/utils/commandhelper',
  'csui/utils/commands/open.classic.page'
], function ($, CommandHelper, OpenClassicPageCommand) {
  'use strict';

  var OpenForumCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenForum'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status),
          type = node && node.get('type');
      return type === 123469 || type === 123470;
    },

    getUrlQueryParameters: function (node, options) {
      var forum = node.get('type') === 123469;
      return {
        func: 'll',
        objAction: forum ? 'view' : 'viewincontainer',
        objId: node.get('id'),
        nexturl: location.href
      };
    }

  });

  return OpenForumCommand;

});

csui.define('csui/temporary/cop/commands/open.wiki',['csui/lib/jquery', 'csui/utils/url',
  'csui/utils/commandhelper', 'csui/utils/commands/open.classic.page'
], function ($, Url, CommandHelper, OpenClassicPageCommand) {
  'use strict';

  var OpenWikiCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenWiki'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status),
          type = node && node.get('type');
      return type === 5573 || type === 5574;
    },

    getUrl: function (node, options) {
      var url = OpenClassicPageCommand.prototype.getUrl.apply(this, arguments),
          wiki = node.get('type') === 5573;
      return wiki ? url : Url.combine(url, 'open', node.get('id'));
    },

    getUrlQueryParameters: function (node, options) {
      var wiki = node.get('type') === 5573;
      if (wiki) {
        return {
          func: 'll',
          objAction: 'browse',
          objId: node.get('id'),
          viewType: 1,
          nexturl: location.href
        };
      }
    }

  });

  return OpenWikiCommand;

});

csui.define('csui/temporary/cop/commands/open.mailstore',['csui/utils/commandhelper',
  'csui/utils/commands/open.classic.page'
], function (CommandHelper, OpenClassicPageCommand) {
  'use strict';

  var OpenMailStoreCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenMailStore'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status),
          type = node && node.get('type');
      return type === 3030331;
    },

    getUrlQueryParameters: function (node, options) {
      var mailStore = node.get('type') === 3030331;
      if (mailStore) {
        return {
          func: 'll',
          objAction: 'browse',
          objId: node.get('id'),
          viewType: 1,
          nexturl: location.href
        };
      }
    }
  });

  return OpenMailStoreCommand;

});


csui.define('csui/utils/commands/open.document/csui.open.document.delegates',[
  'module', 'csui/lib/underscore',
  'csui/utils/commands/open.specific.node.perspective',
  'csui/utils/commands/open', 'csui/utils/commands/doc.preview'
], function (module, _, OpenSpecificNodePerspectiveCommand,
    OpenDocumentContentCommand, DocPreviewCommand) {
  'use strict';

  var config = _.extend({
    allowViewContent: true,
    allowPerspective: false
  }, module.config());

  return [
    // Force the perspective to be opened instead of the content if the
    // according flag has been flipped. Otherwise the content opens by default.
    {
      sequence: 500,
      command: OpenSpecificNodePerspectiveCommand,
      decides: function (node, options) {
        // Perspective navigation is possible only with perspective context.
        // Do not allow navigating to document overview with other contexts.
        // TODO: Think about a better solutions for:
        // * Recognition of PerspectiveContext in the release build.
        // * Other contexts can perform a navigation. (PortalContext)
        var context = options && options.context;
        if (!(context && context.perspective)) {
          return false;
        }
        return config.allowPerspective;
      }
    },
    // Check enabling of the preview earlier than viewers, which are
    // implemented by the Open command..
    {
      sequence: 750,
      command: DocPreviewCommand
    },
    // Open the document content using one of open content plugins, if it
    // is not disabled. (It is enabled by default.)
    {
      sequence: 1000,
      command: OpenDocumentContentCommand,
      decides: function () {
        return config.allowViewContent;
      }
    },
    // Fall back to opening the node perspective if the node supports Smart UI
    // and is openability is not forbidden.
    {
      sequence: 10000,
      command: OpenSpecificNodePerspectiveCommand
    }
  ];
});

csui.define('csui/utils/commands/versions/open.version/csui.open.version.delegates',[
    'require', 'csui/lib/underscore',
    'csui/utils/commands/versions/open.version.perspective',
    'csui/utils/commands/versions/open', 'csui/utils/commands/versions/doc.version.preview'
  ], function (require, _, OpenVersionPerspectiveCommand,
      OpenVersionContentCommand, DocVersionPreviewCommand) {
    'use strict';

    var config = _.extend({
      allowViewContent: true,
      allowPerspective: false
    }, require.moduleConfig('csui/utils/commands/open.document/csui.open.document.delegates'));

    return [
      // Force the perspective to be opened instead of the content if the
      // according flag has been flipped. Otherwise the content opens by default.
      {
        sequence: 500,
        command: OpenVersionPerspectiveCommand,
        decides: function (version, options) {
          // Perspective navigation is possible only with perspective context.
          // Do not allow navigating to version overview with other contexts.
          // TODO: Think about a better solutions for:
          // * Recognition of PerspectiveContext in the release build.
          // * Other contexts can perform a navigation. (PortalContext)
          var context = options && options.context;
          if (!(context && context.perspective)) {
            return false;
          }
          return config.allowPerspective;
        }
      },
      // Check enabling of the preview earlier than viewers, which are
      // implemented by the Open command..
      {
        sequence: 750,
        command: DocVersionPreviewCommand
      },
      // Open the version content using one of open content plugins, if it
      // is not disabled. (It is enabled by default.)
      {
        sequence: 1000,
        command: OpenVersionContentCommand,
        decides: function () {
          return config.allowViewContent;
        }
      },
      // Fall back to opening the version perspective.
      {
        sequence: 10000,
        command: OpenVersionPerspectiveCommand
      }
    ];
  });


csui.define('csui/utils/commands/goto.location',['require', 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore', 'csui/lib/backbone',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/models/command',
  'csui/models/node/node.model',
  'csui-ext!csui/utils/commands/goto.location'
], function (require, $, base, _, Backbone, lang, CommandHelper, CommandModel, NodeModel, navExtensions) {
  'use strict';

  var GoToLocationCommand = CommandModel.extend({

    defaults: {
      signature: "goToLocation",
      scope: "single"
    },

    enabled: function (status, options) {
      var node = CommandHelper.getJustOneNode(status);
      var context = status.context || options && options.context;

      var currentNode;
      if (context.hasModel('node')) {
        currentNode = context.getModel('node');
      }

      var parentNode;
      if (node.parent) {
        parentNode = node.parent;
      }

      var theSameNode = false;
      if (currentNode && parentNode) {
        theSameNode = (currentNode.get('id') === parentNode.get('id'));
      }

      return node && this._isSupported(node) && !theSameNode;
    },

    _isSupported: function (node) {
      //this may be extend in future for other object types also,
      //now it supports document and email
      return node.parent && node.parent.isFetchable();
    },

    // TODO: Remove this, as soon as the actions for parents
    // or other expanded nodes  are returned by the server
    _makeAccessible: function () {
      return ['open'];
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          node = CommandHelper.getJustOneNode(status),
          nodeParent,
          navOptions = {originatingView: status.originatingView, context: status.context},
          self = this;

      if (node && this._isSupported(node)) {
        nodeParent = node.parent;
      } else if (!node.parent && status.model){
        nodeParent = status.model;
      }

      if (nodeParent) {
        
        if (nodeParent && nodeParent.get('type') === undefined) {
          // When the object is not accessible then we are not getting the parent type so we
          // need to retrieve this value as per the DefaultActionController implementation
          var parentNode = new NodeModel({
            id: nodeParent.get('id')
          }, {
            connector: nodeParent.connector,
            commands: this._makeAccessible()
          });

          parentNode.fetch().done(function (resp) {
            nodeParent = parentNode;
            self.navigate(nodeParent, navOptions);
            deferred.resolve();
          }).fail(function (resp) {
            csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
              var error = new base.Error(resp);
              ModalAlert.showError(error.message);
            });
            deferred.reject();
          });
        } else {
          this.navigate(nodeParent, navOptions);
          deferred.resolve();
        }
      }
      return deferred.promise();
    },

    executeDefaultAction: function (node, originatingView, context) {
      var args = {node: node};
      originatingView.trigger('before:defaultAction', args);
      var deferred = $.Deferred();
      if (!args.cancel) {
        csui.require(['csui/utils/commands'
        ], function (commands) {
          var command = commands.get('Browse');
          if (!command) {
            throw new Error('Invalid command: Browse');
          }
          var status  = {
                nodes: new Backbone.Collection([node])
              },
              options = {
                context: context,
                originatingView: originatingView
              };

          CommandHelper.handleExecutionResults(command.execute(status, options))
              .then(function () {
                originatingView.trigger('executed:defaultAction', args);
                deferred.resolve();
              });

        }, deferred.reject);

      }
    },

    navigate: function (node, options) {
      if (navExtensions) {
        var self = this;
        var promise = navExtensions.reduce(
          function (previousPromise, navExtension) {
            return previousPromise.catch(function (error) {
              if (error) {
                throw error;
              } else {
                return navExtension.navigate(node, options);
              }
            });
          }, $.Deferred().reject());

        return promise.catch(function (error) {
          if (error) {
            throw error;
          } else {
            self.executeDefaultAction(node, options.originatingView, options.context);
          }
        });
      } else {
        this.executeDefaultAction(node, options.originatingView, options.context);
        return $.Deferred().resolve().promise();
      }
    }

  });

  return GoToLocationCommand;

});

csui.define('csui/utils/commands/collection/collect',[
  'module', 'require', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/base', 'csui/utils/url', 'csui/lib/underscore',
  'i18n!csui/utils/commands/collection/nls/lang', 'csui/models/command',
  'csui/utils/commands/multiple.items', 'csui/utils/commandhelper'
], function (module, require, $, Backbone, base, Url, _, lang, CommandModel,
    MultipleItemsCommand, CommandHelper) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 3
  });

  var GlobalMessage, TaskQueue, UploadFileCollection, PageLeavingBlocker,
      NextNodeModelFactory, CollectionConflictView, nodeLinks;

  var CollectCommandParent = CommandModel.extend({});
  _.extend(CollectCommandParent.prototype, MultipleItemsCommand); //apply required mixin

  var CollectCommand = CollectCommandParent.extend({

    defaults: {
      signature: "Collect",
      scope: "multiple",
      command_key: ['collect', 'Collect'],
      successMessages: {
        formatForOne: lang.CollectOneItemSuccessMessage,
        formatForTwo: lang.CollectManyItemsSuccessMessage,
        formatForMany: lang.CollectManyItemsSuccessMessage,
        formatForFive: lang.CollectManyItemsSuccessMessage
      },
      errorMessages: {
        formatForOne: lang.CollectOneItemFailMessage,
        formatForTwo: lang.CollectManyItemsFailMessage,
        formatForMany: lang.CollectManyItemsFailMessage,
        formatForFive: lang.CollectManyItemsFailMessage
      }
    },

    enabled: function (status, options) {
      var enable = this._isSupported(status.container),
          nodes  = CommandHelper.getAtLeastOneNode(status);
      enable = !!enable && !!nodes && nodes.length;
      enable = enable && CollectCommand.__super__.enabled.apply(this, arguments);
      return enable;
    },

    _isSupported: function (node) {
      var unsupportedObjects = [298], //this may be extend in future for other object types also
          // in case of favorites and recently widgets container is undefined so still need to enable command
          support            = !!node ? $.inArray(node.get('type'), unsupportedObjects) === -1 :
                               true;
      return support;
    },

    execute: function (status, options) {
      var that     = this,
          deferred = $.Deferred();
      csui.require([
        'csui/controls/globalmessage/globalmessage',
        'csui/controls/conflict.resolver/impl/collection.conflicts/collection.conflicts.view',
        'csui/utils/taskqueue', 'csui/models/fileuploads', 'csui/utils/page.leaving.blocker',
        'csui/utils/contexts/factories/next.node', 'csui/utils/node.links/node.links'
      ], function () {
        GlobalMessage = arguments[0];
        CollectionConflictView = arguments[1];
        TaskQueue = arguments[2];
        UploadFileCollection = arguments[3];
        PageLeavingBlocker = arguments[4];
        NextNodeModelFactory = arguments[5];
        nodeLinks = arguments[6];

        that._addToCollection(status, options).done(function (container) {
          var selectedNodes    = status.nodes.models,
              nodes            = _.map(selectedNodes, function (node) {
                return {
                  name: node.get('name'),
                  state: 'pending',
                  count: 0,
                  total: 1,
                  node: node
                };
              }),
              targetFolder     = container.nodes,
              uploadCollection = new UploadFileCollection(nodes, {connector: connector}),
              connector        = (status.container && status.container.connector) ||
                                 (status.originatingView && status.originatingView.connector) ||
                                 (status.collection && status.collection.connector) ||
                                 (selectedNodes[0] && selectedNodes[0].connector);
          that._announceOperationStart(status);
          uploadCollection.each(function (fileUpload) {
            var node = fileUpload.get('node');
            fileUpload.node = node;
            fileUpload.unset('node');
            fileUpload.set('mime_type', node.get('mime_type'));
          });

          that._addSelectedNodesToCollection(uploadCollection, connector, targetFolder[0],
              status.collection)
              .then(function (promises) {
                GlobalMessage.hideFileUploadProgress();
                var result = that._checkPromisess(promises);
                if (result.failedNodes.length) {
                  that._showDialog(result.failedNodes).then(
                      function (resolveOption, dialog) {
                        dialog.kill();
                        //if any success items are there then show global message
                        if (result.successNodes.length) {
                          var msgOptions = {
                            context: status.context,
                            nextNodeModelFactory: NextNodeModelFactory,
                            link_url: nodeLinks.getUrl(targetFolder[0]),
                            targetFolder: targetFolder[0]
                          };
                          that.showSuccessWithLink(result.successNodes.models, msgOptions);
                        }
                      });

                } else if (result.successNodes.length) {
                  // display result message
                  var msgOptions = {
                    context: status.context,
                    nextNodeModelFactory: NextNodeModelFactory,
                    link_url: nodeLinks.getUrl(targetFolder[0]),
                    targetFolder: targetFolder[0]
                  };
                  that.showSuccessWithLink(promises, msgOptions);
                }
              });
          that._announceOperationEnd(status);
          var targetNodeInCurrentCollection;
          if (status.collection && status.originatingView &&
              status.originatingView.findNodeFromCollection) {
            targetNodeInCurrentCollection = status.originatingView.findNodeFromCollection(
                status.collection, targetFolder[0]);
          } else if (status.collection) {
            targetNodeInCurrentCollection = status.collection.get(targetFolder[0].get('id')) ||
                                            status.collection.findWhere(
                                                {id: targetFolder[0].get('id')});
          }
          targetNodeInCurrentCollection &&
          targetNodeInCurrentCollection.fetch();
        });

        deferred.resolve();
      });
      return deferred.promise();
    },

    _addToCollection: function (status, options) {
      var self     = this,
          deferred = $.Deferred();

      csui.require(['csui/dialogs/node.picker/node.picker'],
          function (NodePicker) {
            var pickerOptions = _.extend({
              selectableTypes: [298],
              addableTypes: [298],
              showAllTypes: true,
              orderBy: 'type asc',
              dialogTitle: lang.selectCollectionDialogTitle,
              selectButtonLabel: lang.selectCollectButtonLabel,
              globalSearch: true,
              selectMultiple: false,
              context: options ? options.context : status.context,
              startLocation: 'recent.containers',
              startLocations: ['enterprise.volume', 'current.location', 'personal.volume',
                'favorites', 'recent.containers'],
              resolveShortcuts: true,
              resultOriginalNode: true
            }, status);

            self.nodePicker = new NodePicker(pickerOptions);

            self.nodePicker
                .show()
                .done(function () {
                  deferred.resolve.apply(deferred, arguments);
                })
                .fail(function () {
                  deferred.reject.apply(deferred, arguments);
                });
          }, function (error) {
            deferred.reject(error);
          });
      return deferred.promise();
    },

    _addSelectedNodesToCollection: function (uploadCollection, connector, targetFolder,
        targetCollection) {
      var self     = this,
          queue    = new TaskQueue({
            parallelism: config.parallelism
          }),
          count    = 0,
          promises = _.map(uploadCollection.models, function (model) {
            var deferred = $.Deferred();
            queue.pending.add({
              worker: function () {
                var node     = model.node,
                    node_id  = node.get('id'),
                    targetId = targetFolder.get('id');
                self._collectNode(connector, targetId, node_id)
                    .done(function () {

                      model.set('count', 1);
                      model.deferred.resolve(model);

                      deferred.resolve(model);
                    })
                    .fail(function (cause) {
                      deferred.resolve(model);
                    });
                return deferred.promise();
              }
            });
            count++;
            return deferred.promise(promises);  // return promises
          });
      GlobalMessage.showFileUploadProgress(uploadCollection, {
        oneFileTitle: lang.CollectingOneItem,
        oneFileSuccess: lang.CollectOneItemSuccessMessage,
        multiFileSuccess: lang.CollectManyItemsSuccessMessage,
        oneFilePending: lang.CollectingOneItem,
        multiFilePending: lang.CollectingItems,
        oneFileFailure: lang.CollectOneItemFailMessage,
        multiFileFailure: lang.CollectManyItemsFailMessage2,
        someFileSuccess: lang.CollectManyItemsSuccessMessage,
        someFilePending: lang.CollectingItems,
        someFileFailure: lang.CollectManyItemsFailMessage2,
        enableCancel: false
      });

      return $.whenAll.apply($, promises);
    },

    _collectNode: function (connector, targetFolderID, node_id) {
      var deferred = $.Deferred();
      var nodeAttr = {
        "collection_id": targetFolderID
      };

      var collectOptions = {
        url: Url.combine(connector.getConnectionUrl().getApiBase('v2'), '/nodes/' + node_id),
        type: 'PUT',
        data: nodeAttr,
        contentType: 'application/x-www-form-urlencoded'
      };

      connector.makeAjaxCall(collectOptions).done(function (resp) {
        deferred.resolve(resp);

      }).fail(function (resp) {
        deferred.reject(resp);
      });
      return deferred.promise();
    },

    _checkPromisess: function (promises) {
      if (!_.isArray(promises)) {
        promises = [promises];
      }

      var successPromises = new Backbone.Collection(),
          failedPromises  = new Backbone.Collection();

      _.each(promises, function (prom) {
        if (prom !== undefined) {
          if (!prom.cancelled) {
            if (prom.get("count") === undefined) {
              //which is not resolved or rejected
            } else if (prom.get("count")) {
              successPromises.push(prom);
            }
            else {
              failedPromises.push(prom);
            }
          }
        }
      });

      return {
        successNodes: successPromises,
        failedNodes: failedPromises
      };
    },

    _showDialog: function (conflictFiles) {
      var deferred = $.Deferred(),
          buttons  = [{
            id: 'close',
            close: true,
            label: lang.conflictsDialogCloseLabel,
            toolTip: lang.conflictsDialogCloseLabel,
            click: function (args) {
              deferred.resolve('close', args.dialog);
            }
          }];
      this._showConflictDialog(conflictFiles, buttons);
      return deferred;
    },

    _showConflictDialog: function (collection, buttons) {
      var self     = this,
          deferred = $.Deferred();
      csui.require(['csui/controls/dialog/dialog.view'], function (DialogView) {
        var failureMessage = base.formatMessage(collection.length, self.get("errorMessages")),
            dialog         = new DialogView({
              title: failureMessage,
              midSize: true,
              iconLeft: 'csui-icon-notification-information',
              className: "csui-collection-conflicts-dialog",
              view: self._getListView(collection),
              buttons: buttons
            });
        dialog.show();
        return dialog;
      });

    },

    _getListView: function (conflictFiles) {
      var retVal = new CollectionConflictView(_.extend({}, {collection: conflictFiles}));
      return retVal;
    },

    _announceOperationStart: function (status) {
      var originatingView = status.originatingView;
      if (originatingView.blockActions) {
        originatingView.blockActions();
      }
      PageLeavingBlocker.enable(this.get('pageLeavingWarning'));
    },

    _announceOperationEnd: function (status) {
      PageLeavingBlocker.disable();
      var originatingView = status.originatingView;
      if (originatingView.unblockActions) {
        originatingView.unblockActions();
      }
    }

  });

  return CollectCommand;

});

csui.define('bundles/csui-commands',[
  // Commands
  'csui/utils/commands/back.to.last.fragment',
  'csui/integration/folderbrowser/commands/go.to.node.history',
  'csui/integration/folderbrowser/commands/open.full.page.container',
  'csui/integration/folderbrowser2/commands/open.full.page.container',
  'csui/utils/commands',
  'csui/utils/commands/add/add.mixin',
  'csui/utils/commands/add.categories',
  'csui/utils/commands/add',
  'csui/utils/commands/add.item.metadata',
  'csui/utils/commands/add.version',
  'csui/utils/commands/browse',
  'csui/utils/commands/collection/collect.items',
  'csui/utils/commands/collection/remove.collected.items',
  'csui/utils/commands/confirmable',
  'csui/utils/commands/copy',
  'csui/utils/commands/copy.link',
  'csui/utils/commands/create.perspective',
  'csui/utils/commands/delete',
  'csui/utils/commands/delete/delete.self.handler',
  'csui/utils/commands/doc.preview',
  'csui/utils/commands/download',
  'csui/utils/commands/open.base',
  'csui/utils/commands/open.document/open.document',
  'csui/utils/commands/zipanddownload',
  'csui/utils/commands/edit',
  // TODO: Move these 3 commands and also their toolbar
  // configurations (flyouts) to les.fastedit.
  'csui/utils/commands/editactivex',
  'csui/utils/commands/editofficeonline',
  'csui/utils/commands/edit.perspective',
  'csui/utils/commands/editwebdav',
  'csui/utils/commands/email.link',
  'csui/utils/commands/execute.saved.query',
  'csui/utils/commands/execute.search.form.query',
  'csui/utils/commands/favorite.add',
  'csui/utils/commands/favorite.remove',
  'csui/utils/commands/inlineedit',
  'csui/utils/commands/move',
  'csui/utils/commands/multiple.items',
  'csui/utils/commands/navigate',
  'csui/utils/commands/node',
  'csui/utils/commands/open',
  'csui/utils/commands/open.node.perspective',
  'csui/utils/commands/open.classic.page',
  'csui/utils/commands/open.discussion',
  'csui/utils/commands/open.milestone',
  'csui/utils/commands/open.channel',
  'csui/utils/commands/open.news',
  'csui/utils/commands/open.poll',
  'csui/utils/commands/open.prospector',
  'csui/utils/commands/open.specific.classic.page',
  'csui/utils/commands/open.specific.node.perspective',
  'csui/utils/commands/open.task',
  'csui/utils/commands/open.taskgroup',
  'csui/utils/commands/open.tasklist',
  'csui/utils/commands/open.topic',
  'csui/utils/commands/permissions',
  'csui/utils/commands/properties',
  'csui/utils/commands/rename',
  'csui/utils/commands/rename.favorite',
  'csui/utils/commands/reserve',
  'csui/utils/commands/compound.document/compound.document',
  'csui/utils/commands/compound.document/create.revision',
  'csui/utils/commands/compound.document/create.release',
  'csui/utils/commands/compound.document/reorganize',
  'csui/utils/commands/compound.document/lock',
  'csui/utils/commands/compound.document/unlock',
  'csui/utils/commands/compound.document/view.releases',
  'csui/utils/commands/compound.document/releases.commands',
  "csui/utils/commands/compound.document/properties",
  'csui/utils/commands/compound.document/compound.document.util',
  'csui/utils/commands/run.livereport',
  'csui/utils/commands/sign.out',
  'csui/utils/commands/switch.to.classic',
  'csui/utils/commands/unreserve',
  'csui/utils/commands/user.profile',
  'csui/utils/commands/versions',
  'csui/utils/commands/versions/delete',
  'csui/utils/commands/versions/download',
  'csui/utils/commands/versions/open',
  'csui/utils/commands/versions/promote.version',
  'csui/utils/commands/versions/properties',
  'csui/utils/commands/versions/doc.version.preview',
  'csui/utils/commands/versions/open.version.perspective',
  'csui/utils/commands/versions/open.version/open.version.delegate',
  'csui/utils/commands/filter',
  'csui/utils/commands/description.toggle',
  'csui/utils/commands/thumbnail.toggle',
  'csui/utils/commands/save.filter',
  'csui/utils/commands/save.query',
  'csui/utils/commands/update.query',
  'csui/utils/commands/maximize.widget.view',
  'csui/utils/commands/restore.widget.size',
  'csui/utils/commands/permissions/apply.permission',
  'csui/utils/commands/permissions/edit.permission',
  'csui/utils/commands/permissions/change.owner.permission',
  'csui/utils/commands/permissions/delete.permission',
  'csui/utils/commands/permissions/add.user.group',
  'csui/utils/commands/permissions/add.owner.group',
  'csui/utils/commands/permissions/restore.public.access',
  'csui/utils/commands/permissions/permission.util',
  'csui/utils/commands/personalize.page',
  'csui/utils/commands/version.settings',
  'csui/utils/commands/tree.browse',
  'csui/utils/commands/content.server.administration',
  'csui/utils/commands/about.box',
  'csui/utils/commands/restructure.command',

  // TODO: Remove this. Localizable string for csui commands  are
  // private in csui and must not be referred to from other components.
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commands/nls/root/localized.strings',
  'i18n!csui/utils/commands/collection/nls/lang',
  'csui/utils/commands/collection/nls/root/lang',

  // TODO: Remove this, as long as the module owners take over
  // the commands and default action rules
  'csui/temporary/cop/commands/open.blog',
  'csui/temporary/cop/commands/open.faq',
  'csui/temporary/cop/commands/open.forum',
  'csui/temporary/cop/commands/open.wiki',
  'csui/temporary/cop/commands/open.mailstore',

  // Other modules, that commands directly depend on.
  'csui/dialogs/file.open/file.open.dialog',
  'csui/models/command',
  'csui/models/commands',
  'csui/utils/accessibility',
  'csui/utils/command.error',
  'csui/utils/commandhelper',
  'csui/utils/commands/open.document/csui.open.document.delegates',
  'csui/utils/commands/open.document/delegates/open.document.delegates',
  'csui/utils/commands/versions/open.version/csui.open.version.delegates',
  'csui/utils/commands/versions/open.version/delegates/open.version.delegates',
  'csui/utils/commands/open.plugins/open.plugins',
  'csui/utils/commands/goto.location',
  'csui/utils/commands/collection/collect',
  'csui/utils/node.links/node.links',
  'csui/utils/routing'
], {});

