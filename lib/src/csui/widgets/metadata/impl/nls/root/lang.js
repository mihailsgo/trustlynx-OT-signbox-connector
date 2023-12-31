/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define({
  metadataRegionAria: 'Metadata content',
  properties: 'Properties',
  versions: 'Versions',
  general: 'General',
  audit: 'Audit',
  releases: 'Releases',
  MenuItemRename: 'Rename',
  MenuItemEdit: 'Edit',
  MenuItemCopy: 'Copy',
  MenuItemMove: 'Move',
  MenuItemDownload: 'Download',
  MenuItemReserve: 'Reserve',
  MenuItemUnreserve: 'Unreserve',
  MenuItemAddVersion: 'Add version',
  MenuItemDelete: 'Delete',
  addItemMetadataDialogButtonAddTitle: 'Add',
  addItemMetadataDialogButtonUploadTitle: 'Upload',
  addItemMetadataDialogButtonCancelTitle: 'Cancel',
  addItemMetadataDialogTitle1: 'Add {0}',
  addItemMetadataDialogTitleGeneric: 'Item',
  addDocumentMetadataDialogTitle: 'Upload file',
  addFolderMetadataDialogTitle: 'Upload folder',
  addDocumentsMetadataDialogTitle: 'Upload files',
  addFoldersMetadataDialogTitle: 'Upload folders',
  addItemsMetadataDialogTitle: 'Upload items',
  addDocumentMetadataDialogAddButtonTitle: 'Upload',
  addItemPlaceHolderName: 'Enter name',
  emptyObjectNameAria: 'Object name',
  itemTitleAria: '{0}, click to edit',
  editNameTooltip: 'Edit name',
  saveEditNameTooltip: 'Save',
  cancelEditNameTooltip: 'Cancel',
  failedToSaveName: 'Failed to save name.',
  failedToCreateItem: 'Failed to create the new item.',
  failedToValidateForms: 'Failed to validate all Forms.  Please check that all required fields are entered.',
  switchLanguageTooltip: 'Switch language',
  gotoPreviousCategoryTooltip: 'Show previous Category',
  gotoNextCategoryTooltip: 'Show next Category',
  addNewProperties: 'Add properties',
  addNewCategory: 'Add a new Category',
  addNewCategoryDialogTitle: 'Add Category',
  addNewCategoryDialogAddButtonTitle: 'Add',
  removeCategoryTooltip: 'Remove this Category',
  removeCategoryWarningTitle: 'Remove Category',
  removeCategoryWarningMessage: 'Do you want to remove Category "{0}"?',
  removeCategoryFailMessageTitle: 'Remove Category Failed',
  removeCategoryFailMessage: 'Failed to remove Category "{0}". \n\n{1}',
  getPropertyPanelsFailTitle: 'Error Loading Properties',
  getCategoryActionsFailTitle: 'Get Category Actions',
  getCategoryActionsFailMessage: 'Failed to get Category actions for node "{0}". \n\n{1}',
  getActionsForACategoryFailMessage: 'Failed to get actions for Category "{0}" of node "{1}". \n\n{2}',
  addNewCategoryFailTitle: 'Add Category to node',
  addNewCategoryFailMessage: 'Failed to add Category "{0}" to node "{1}" with node ID "{2}". \n\n{3}',
  categoryExistsMessage: 'Error: Category "{0}" already exists.',
  loadNewCategoryFailTitle: 'Get new Category Form',
  loadNewCategoryFailMessage: 'Failed to get Form for Category "{0}" on node "{1}" with node ID "{2}". \n\n{3}',
  selectCategoryTitle: 'Select a Category to add',
  selectCategoryButtonLabel: 'Add',
  viewShortcutMessage: 'View shortcut',
  viewOriginalMessage: 'View original',
  shortcutLocationLabel: 'Original location',
  closeMetadataButtonTooltip: 'Close metadata',
  formValidationErrorMessage: 'Required fields must be filled',
  hideValidationErrorMessageIconTooltip: 'Hide validation error',
  missingRequiredMetadataForDocuments: 'Missing required metadata for some document(s).',
  goBackTooltip: 'Go back',
  onlyRequiredFieldsLabel: 'Only required fields (*)',
  defaultDialogTitle: 'Metadata',
  defaultDialogOkButtonTitle: 'OK',
  defaultDialogCancelButtonTitle: 'Cancel',
  moveOneItemMetadataDialogTitle: 'Move {0} item',
  moveMultipleItemsMetadataDialogTitle: 'Move {0} items',
  moveItemsMetadataDialogButtonTitle: 'Move',
  copyOneItemMetadataDialogTitle: 'Copy {0} item',
  copyMultipleItemsMetadataDialogTitle: 'Copy {0} items',
  copyItemsMetadataDialogButtonTitle: 'Copy',
  missingRequiredMetadataForObjects: 'Missing required metadata for some object(s).',
  inheritanceOriginalProperties: 'with original properties',
  inheritanceDestinationProperties: 'with destination properties',
  inheritanceMergedProperties: 'with combined properties',
  requiredTooltip: 'Required',
  requiredPassedTooltip: 'Required fields satisfied.',
  restructureOneItemMetadataDialogTitle: 'Restructure {0} item',
  restructureMultipleItemsMetadataDialogTitle: 'Restructure {0} items',
  restructureItemsMetadataDialogButtonTitle: 'Restructure',
  ToolbarItemVersionInfo: 'Properties',
  ToolbarItemVersionDelete: 'Delete',
  ToolbarItemPromoteVersion: 'Promote to major',
  ToolbarItemVersionPurgeAll: 'Purge all previous Versions',
  ToolbarItemVersionDownload: 'Download',
  ToolbarItemDocVersionPreview: 'View',
  ToolbarItemCopyLink: 'Copy link',
  ToolbarItemEmailLink: 'Mail as link',
  ToolbarItemMore: 'More actions',
  versionColumnSizeTitle: 'Size',
  versionColumnVersionNumberTitle: 'Version',
  openDoc: 'Open {0}',
  openDocAria: 'Open {0} {1}',
  versionNumInBrowserTitle: 'Version {0}',
  docPreviewAlt: 'Document Preview',
  versionTableAria: 'Versions of {0}',
  action: 'Action',
  date: 'Date',
  user: 'User',
  auditNoResultsPlaceholder: "No results found",
  auditTableAria: 'Audit events of {0}',
  release: 'Release',
  created: 'Created',
  createdBy: 'Created By',
  releasesNoResultsPlaceholder: 'There are no releases available for this compound document.',
  releasesTableAria: 'Releases of {0}',
  formFieldItemIdLabel: 'Item ID',
  formFieldSizeLabel: 'Size',
  formFieldTypeLabel: 'Type',
  formFieldReservedStatusLabel: 'Status',
  formFieldReservedByLabel: 'Reserved by',

  UrlLabel: "Web address",
  UrlTitle: "Web address",
  alpacaPlaceholderNotAvailable: 'n/a',
  alpacaPlaceholderUrl: 'Add web address',
  alpacaPlaceholderOTNodePicker: 'Select',
  alpacaPlaceholderDescription: 'Add description',
  NoOwner: '<No Owner>',
  showMore: 'Show more',
  showMoreAria: 'Show more actions of {0}',
  collapse: 'Hide item list',
  expand: 'Show item list',
  permissionPage: "Permission Page of {0}"
});
