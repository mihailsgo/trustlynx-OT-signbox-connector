/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette',
  'csui/lib/backbone', 'csui/utils/log', 'i18n!csui/controls/draganddrop/impl/nls/lang',
  'csui/controls/globalmessage/globalmessage', 'csui/controls/fileupload/fileupload',
  'csui/dialogs/modal.alert/modal.alert', 'csui/utils/dragndrop.supported.subtypes',
  'csui/utils/base','csui/utils/url','csui/models/node/node.addable.type.collection',
  'csui/models/node/node.model', 'hbs!csui/controls/draganddrop/impl/draganddrop',
  'csui/controls/draganddrop/impl/uploaditems',
  'css!csui/controls/draganddrop/impl/draganddrop', 'csui/lib/jquery.when.all'
], function (module, $, _, Marionette, Backbone, log, lang, GlobalMessage,
    fileUploadHelper, ModalAlert, DragndropSupportedSubtypes, base, URL, NodeAddableTypeCollection,
    NodeModel, template, UploadService) {
  'use strict';

  var config = _.defaults({}, module.config(), {
    detectLeaveDelay: 10,
    hideDropMessageDelay: 100,
    hideWarningAlert: false,
    fileSubTypes : [144, 801, 1307],
    folderSubTypes : [800, 1308] //800 : Intelligent Filing Folder and 1308 : support asset folder
  });

  var DragAndDropView = Marionette.ItemView.extend({
    template: template,
    className: 'csui-dropMessage',

    ui: {
      message: '.csui-messageBox'
    },

    constructor: function DragAndDropView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);

      this.collection = options.collection;
      this.container = options.container;
      this.addableTypes = options.addableTypes;
      this.wantDragAndDrop = true;
      this.context = options.context;
      this.visible = false;
      this.highlightedTarget = options.highlightedTarget;
      this.parentView = options.originatingView || options.parentView;
      this.listenTo(this.options.container, "change:name", this._resetMessage);
    },

    setDragParentView: function (parentView, selector) {
      this._parentEl = _.isString(selector) && parentView.$(selector) ||
                       selector.length !== undefined && selector ||
                       selector && $(selector) ||
                       parentView.$el;
      this.render();
      if (!parentView.csuiDropMessage) {
        parentView.csuiDropMessage = this.$el;
        this._parentEl.append(parentView.csuiDropMessage);
      }
      this.parentView = parentView || this.parentView;
      if (this.shouldDragAndDrop()) {
        this.parentView.csuiDropMessage.hide();
        this.disable();
        this._setDragEvents();
      }
      return true;
    },

    onDestroy: function () {
      if (this.shouldDragAndDrop()) {
        if (this._parentEl) {
          this._parentEl
          .off('dragover', this.dragOver)
          .off('dragleave', this.dragLeave)
          .off('drop', this.dragDrop);
        }
      }
    },

    stopListeningDragEvent: function (element, parentView) {
      $(element) && parentView &&
      $(element).off("dragover", parentView.dragOver)
      .off("dragleave", parentView.dragLeave)
      .off("drop", parentView.dragDrop);
    },

    _setDragEvents: function () {
      this.dragOver = _.bind(this.onOverView, this);
      this.dragLeave = _.bind(this.onLeaveView, this);
      this.dragDrop = _.bind(this.onDropView, this);
      this._parentEl
      .on('dragover', this.dragOver)
      .on('dragleave', this.dragLeave)
      .on('drop', this.dragDrop);
    },

    getSupportedSubType: function () {
      var supportedType = {
        type: 144,
        type_name: "Document"
      };
      return supportedType;
    },

    enable: function (triggerEvent) {
      if (!this.visible) {
        if (triggerEvent !== false) {
          this.trigger('drag:over');
        }
        this.parentView.csuiDropMessage.show();
        this.visible = true;
      }
      if (this.canAdd()) {
        var node = this.getSupportedSubType();
        this.options.addableType = node.type;
        this.options.addableTypeName = node.type_name;
      }
    },

    disable: function (currentEvent) {
      this.trigger('drag:leave', this);
      if (!this.parentView.leaveViewTimeout) {
        this.parentView.leaveViewTimeout = setTimeout(_.bind(function () {
          this.parentView.leaveViewTimeout = undefined;
          this.parentView.csuiDropMessage.hide();
        }, this), config.hideDropMessageDelay);
      }
    },

    shouldDragAndDrop: function () {
      return this.wantDragAndDrop;
    },

    canAdd: function () {
      if (this.addableTypes && this.addableTypes.length && this._isSupportedType(this.addableTypes, DragndropSupportedSubtypes)) {
        return true;
      } else if (!this.addableTypes) {
        return true;
      } else {
        return false;
      }
    },

    _isSupportedType: function (addableTypes, subTypes) {
      var subType = subTypes.filter(function(type) {
        return addableTypes.get(type);
      });
      return subType[0] !== undefined;
    },


    isDndSupportedContainer: function (container) {
      return $.inArray(container.get('type'), DragndropSupportedSubtypes) !== -1;
    },

    onOverView: function (currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      if (!!this.parentView.leaveViewTimeout) {
        clearTimeout(this.parentView.leaveViewTimeout);
        this.parentView.leaveViewTimeout = undefined;
      }

      if (this.leaveViewTimeout) {
        clearTimeout(this.leaveViewTimeout);
        this.leaveViewTimeout = undefined;
      } else {
        this.enable(false);
      }
      var dataTransfer = currentEvent.originalEvent &&
                         currentEvent.originalEvent.dataTransfer,
          items = dataTransfer.items,
          isFolder = items && items.length === 1 && !items[0].type,
          validItems = items && items.length && _.all(items, function (item) {
            return item.kind === 'file';
          }),
          types = dataTransfer && dataTransfer.types,
          validTypes = types && types.length && _.any(types, function (type) {
            return type.toLowerCase() === 'files';
          }),
          invalidMessage = lang.dropInvalid;
      this.valid = items && validItems || validTypes;
      
      dataTransfer.dropEffect = 'copy';

      if (!this.canAdd()) {
        var validContainer = this.isDndSupportedContainer(this.parentView.container);
        this.valid = validContainer && this.options.isSupportedRowView;
        invalidMessage = lang.dropNotPermitted;
      }
      var isFileTarget = config.fileSubTypes.indexOf(this.container.get('type')) >= 0;
      if ((isFolder && isFileTarget) ||
          this.valid && items && items.length > 1 && isFileTarget) {
        if (!this.currentRowHighlightedTarget) {
          this.currentRowHighlightedTarget = this.highlightedTarget;
          this.highlightedTarget = undefined;
        }
        if (this.parentView.addableTypes && 
          (!this._isSupportedType(this.parentView.addableTypes, config.fileSubTypes))) {
          this.valid = false;
        }

      } else {
        if (this.currentRowHighlightedTarget) {
          this.highlightedTarget = this.currentRowHighlightedTarget;
          this.currentRowHighlightedTarget = undefined;
        }
      }
      if (this.valid) {
        this._resetMessage({items: items});
      }
      if (!this.overViewTimeout) {
        this.overViewTimeout = setTimeout(_.bind(function () {
          this.overViewTimeout = undefined;
          if (this.valid) {
            this.parentView.csuiDropMessage.hasClass('csui-disabled') &&
            this.parentView.csuiDropMessage.removeClass('csui-disabled');
            this.trigger('drag:over', this,
                {disabled: false, highlightedTarget: this.highlightedTarget});
            this.parentView.csuiDropMessage.show();
            this.visible = true;
          } else {
            !this.parentView.csuiDropMessage.hasClass('csui-disabled') &&
            this.parentView.csuiDropMessage.addClass('csui-disabled');
            this.parentView.csuiDropMessage.html(this.template({message: invalidMessage}));
            this.parentView.csuiDropMessage.show();
            this.visible = true;
            this.trigger('drag:over', this, {disabled: true});
          }
        }, this), config.detectLeaveDelay);
      }
    },

    onLeaveView: function (currentEvent) {

      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      if (!this.leaveViewTimeout) {
        this.leaveViewTimeout = setTimeout(_.bind(function () {
          this.leaveViewTimeout = undefined;
          this.disable(currentEvent);
        }, this), config.detectLeaveDelay);
      }
      if (this.overViewTimeout) {
        clearTimeout(this.overViewTimeout);
        this.overViewTimeout = undefined;
      }
    },

    onDropView: function (currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      if (this.overViewTimeout) {
        clearTimeout(this.overViewTimeout);
        this.overViewTimeout = undefined;
      }
      if(this.valid){
        var self = this,
          dataTransfer = currentEvent.originalEvent &&
                         currentEvent.originalEvent.dataTransfer ||
              {
                files: currentEvent.originalEvent &&
                       currentEvent.originalEvent.target &&
                       currentEvent.originalEvent.target.files || []
              },
          container = config.fileSubTypes.indexOf(this.container.get('type')) >= 0 ?
                      self.parentView.container :
                      self.container,
          singleFileDrop = dataTransfer.files.length === 1,
          dataTransferEntryIsFile = singleFileDrop && dataTransfer.items &&
                                    dataTransfer.items[0].webkitGetAsEntry() &&
                                    dataTransfer.items[0].webkitGetAsEntry().isFile,
          isHttpProtocal = window.location.href.toLowerCase().indexOf('http') === 0 ? true : false;
        if (container && container.get('type') === 136 && !container.get("fileOrder")) { //fetch order_next value before each upload set
          var url = container.connector.getConnectionUrl().getApiBase('v2'),
            query = URL.combineQueryString({
              fields: ['properties{order_next}'],
            }),
          ajaxOptions = {
            url: URL.combine(url, 'nodes', container.get('id'), '?' + query),
            type: 'GET',
            contentType: 'application/x-www-form-urlencoded'
          };
          container.connector.makeAjaxCall(ajaxOptions).always(function (resp) {
            resp.results && container.set("order_next", resp.results.data.properties.order_next);
          });
        }
        dataTransfer.dropEffect = 'copy';
        if (self.canAdd() ||
            (self.isDndSupportedContainer(self.parentView.container) &&
            self.options.isSupportedRowView)) {
          if (dataTransferEntryIsFile &&
              config.fileSubTypes.indexOf(self.container.get('type')) >= 0 ) {
            self.parentView.blockActions();
            self.checkFiles(dataTransfer).always(function (files) {
              self.container.fetch().done(function () {
                if (files.length) {
                  var status = {},
                      dropTargetName = self.container.get("name"),
                      options = options || {};
                  status = {
                    container: self.container,
                    context: self.context,
                    originatingView: self.parentView
                  };
                  if (!self.options.isSupportedRowView || config.fileSubTypes.indexOf(self.container.get('type')) >= 0) {
                    status.collection = self.collection;
                  }
                  var action = self.container.actions.findWhere({signature: 'addversion'});
                  if (action) {
                    status.actionType = action.actionType || 'ADD_VERSION';
                    if (GlobalMessage.isActionInProgress(status.actionType, lang.AddVersionNotAllowed,
                        lang.dialogTitle)) {
                      return $.Deferred().resolve().promise();
                    }
                    ModalAlert.confirmQuestion(
                        _.str.sformat(lang.dialogTemplate, dropTargetName), lang.dialogTitle, {})
                    .done(function (result) {
                      self._addVersionToFile(files[0].file, status, options);
                    });
                  } else {
                    if (container.get('reserved')) {
                      GlobalMessage.showMessage('warning',
                          _.str.sformat(lang.addVersionDeniedForReservedItem));
                    } else {
                      GlobalMessage.showMessage('warning',
                          _.str.sformat(lang.addVersionDenied, dropTargetName));
                    }
                  }
                }
              }).fail(function (request) {
                if (request) {
                  var error = new base.Error(request);
                  GlobalMessage.showMessage('error', error.message);
                }
              }).always(function () {
                self.parentView.unblockActions();
              });
            });
          } else {
            if (!dataTransfer.items || !isHttpProtocal) { // IE browser,Safari.
              var fileType = dataTransfer.types[0];
              self.checkFiles(dataTransfer).always(function (files) {
                var successFiles = _.filter(files, function (file) {
                  return !(file instanceof Error);
                });
                if ((successFiles && successFiles.length)) {
                  if (successFiles.length) {
                    self.parentView.blockActions();
                    var status = {},
                        dropTargetName = container.get("name"),
                        options = options || {};
                    status = {
                      container: container,
                      context: self.context,
                      originatingView: self.parentView
                    };
                    if (!self.options.isSupportedRowView || config.fileSubTypes.indexOf(self.container.get('type')) >= 0) {
                      status.collection = self.collection;
                    }
                    self.getAddableTypes(container).then(function (addableTypes) {
                      if (addableTypes && addableTypes.length &&
                          (self._isSupportedType(addableTypes, DragndropSupportedSubtypes))) {
                        status.skipProgressBar = false;
                        if (successFiles.length) {
                          UploadService.uploadFiles(successFiles, status).always(function (promises) {
                            var isSubFolder = !status.collection; //target is subfolder
                            isSubFolder && status.container.fetch();
                          });
                        }
                      } else {
                        GlobalMessage.showMessage('warning',
                            _.str.sformat(lang.addFileDenied, dropTargetName));
                      }
                      self.parentView.unblockActions();
                    }).fail(function (error) {
                      self.parentView.unblockActions();
                      if (error) {
                        var err = new base.Error(error);
                        GlobalMessage.showMessage('error', err.message);
                      }
                    });
                  }
                } else {
                  if (base.isIE11() && fileType === "Files") {
                    GlobalMessage.showMessage('error', lang.ieFolderSupportError);
                  } else if (base.isSafari() && fileType === "Files") {
                    GlobalMessage.showMessage('error', lang.safariFolderSupportError);
                  } else {
                    GlobalMessage.showMessage('error', lang.dropNotPermitted);
                  }
                }
              });
            } else {
              this._prepareForResolveConflicts(dataTransfer, container).done(
                  function (firstLevelItems, entries) {
                    self.parentView.blockActions();
                    var folderExist, langMessage;
                    if (firstLevelItems.length) {
                      folderExist = _.find(firstLevelItems, function (item) {
                        return !item.file;
                      });
                    }
                    var status = {},
                        dropTargetName = container.get("name"),
                        options = options || {};
                    status = {
                      container: container,
                      context: self.context,
                      originatingView: self.parentView,
                      excludeAddVersionforFolders: self.options.excludeAddVersionforFolders ||
                                                  !!folderExist,

                      excludeAddVersion: self.options.excludeAddVersion
                    };
                    if (!self.options.isSupportedRowView || config.fileSubTypes.indexOf(self.container.get('type')) >= 0) {
                      status.collection = self.collection;
                    }
                    self.getAddableTypes(container).then(function (addableTypes) {
                      if (addableTypes && addableTypes.length &&
                          (addableTypes.find("type", [144, 801]) || addableTypes.get(0))) {
                        UploadService.handleResolveConflictsAndMetadata(firstLevelItems, status)
                        .done(function (nodes) {
                          entries = entries.filter(function (entry) {
                            var node = nodes.findWhere({name: entry.name});
                            entry.node = node;
                            return !!entry.node;
                          });
                          var processing = self.selectFiles(entries, container, nodes);
                          processing
                          .always(function (files, failedItems, numberOfFoldersCreated,
                              foldersAtFirstLevel) {
                            self.parentView.unblockActions();
                            if ((files && files.length)) {
                              self.parentView.blockActions();
                              files && UploadService.validateNodes(files, container)
                              .done(function (cleanFiles, conflictFiles) {
                                options.skipProgressBar = false;
                                options.openMetadata = false;
                                options.inheritance = 'original';
                                options.UploadFileCollection = self.options.UploadFileCollection;
                                if (cleanFiles.length) {
                                  options.skipResolveNamingConflicts = true;
                                  UploadService.uploadFilesDirectly(cleanFiles, status,
                                      options).always(function (promises) {
                                    self.updateChildrenCount(foldersAtFirstLevel, status);
                                  });
                                }
                                self.parentView.unblockActions();
                              });
                            } else if (numberOfFoldersCreated) {
                              self.updateChildrenCount(foldersAtFirstLevel, status);
                              if (numberOfFoldersCreated === 1) {
                                var folderName = foldersAtFirstLevel[0].get('newName') ||
                                                foldersAtFirstLevel[0].get('name');
                                langMessage = _.str.sformat(lang.OneFolderSuccessfullyUploaded,
                                    folderName);
                              } else {
                                langMessage = _.str.sformat(lang.AllFoldersSuccessfullyUploaded,
                                    numberOfFoldersCreated);
                              }
                              GlobalMessage.showMessage("success", langMessage);
                            }
                            if (failedItems.length) {
                              langMessage = (failedItems.length === 1) ?
                                            lang.FolderCreationError :
                                            lang.MultipleFolderCreationError;
                              GlobalMessage.showMessage('error',
                                  _.str.sformat(langMessage, failedItems.length));
                            }
                          });
                        }).fail(function (error) {
                          self.parentView.unblockActions();
                          if (error) {
                            var err = new base.Error(error);
                            err.message && GlobalMessage.showMessage('error', err.message);
                          }
                        });
                      } else {
                        self.parentView.unblockActions();
                        GlobalMessage.showMessage('warning',
                            _.str.sformat(lang.addFileDenied, dropTargetName));
                      }
                    }).fail(function (error) {
                      self.parentView.unblockActions();
                      if (error) {
                        var err = new base.Error(error);
                        err.message && GlobalMessage.showMessage('error', err.message);
                      }
                    });
                  }).fail(function (error) {
                    self.parentView.unblockActions();
                    if (error) {
                      var err = new base.Error(error);
                      err.message && GlobalMessage.showMessage('error', err.message);
                    }
                  });
            }
          }
        } else {
          var nodeName = self.container.get('name');
          GlobalMessage.showMessage('error', _.str.sformat(lang.addTypeDenied, nodeName));
        }
      }
      

      this.disable();
    },

    getAddableTypes: function (container) {
      var deferred = $.Deferred();

      if (this.addableTypes) {
        deferred.resolve(this.addableTypes);
      } else if (!this.addableTypes) {
        var addableTypes = new NodeAddableTypeCollection(undefined, {
          node: container
        });
        addableTypes.fetch()
        .done(function () {
          deferred.resolve(addableTypes);
        }).fail(function (error) {
          deferred.reject(error);
        });
      }

      return deferred.promise();
    },

    _addVersionToFile: function (file, status, options) {
      config.actionType = status.actionType;
      require([
        'csui/controls/fileupload/impl/addversion.controller'
      ], function (AddVersionController) {
        var addVersionController = new AddVersionController({
          view: status.originatingView,
          selectedNode: status.container
        });
        return addVersionController
        .uploadFile(file, config);
      });
    },

    selectFiles: function (entries, container, nodes) {

      return this._traverseItems(entries, container, nodes) ||
             this.checkFiles(entries);
    },
    _prepareForResolveConflicts: function (dataTransfer, container) {
      var items = dataTransfer.items,
          traversing = $.Deferred(),
          readEntriesPromises = [],
          firstLevelItems = [],
          entries = [],
          isSupportedFolder =  config.folderSubTypes.indexOf(container.get('type')) >= 0;

      if (items) {
        _.each(items, function (item) {
          var promise = $.Deferred();
          var entry = item.webkitGetAsEntry && item.webkitGetAsEntry() ||
                      item.getAsEntry && item.getAsEntry();
          if (entry) {
            readEntriesPromises.push(promise);
            entries.push(entry);
            if (entry.isFile) {
              firstLevelItems.push({
                file: {
                  name: entry.name,
                  type: item.type
                },
                container: container
              });
              promise.resolve();

            } else if (entry.isDirectory) {
              var reader = entry.createReader();
              var folder = {
                "type" : isSupportedFolder ? container.get('type') : 0,
                "type_name" : isSupportedFolder ? container.get('type_name') : "Folder",
                "container": true,
                "name": entry.name,
                "parent_id": container.get("id"),
                "parent": container
              };

              reader.readEntries(function (entries) {
                if (entries.length) {
                  _.extend(folder, {
                    "enforcedRequiredAttrsForFolders": true
                  });

                }else {
                  _.extend(folder, {
                    "isFolderEmpty": true
                  });
                }
                folder = new NodeModel(folder, {
                  connector: container.connector
                });
                folder.parent = container;
                firstLevelItems.push(folder);
                promise.resolve();
              }, function (error) {
                if (error) {
                  var err = new base.Error(error);
                  GlobalMessage.showMessage('error', err.message);
                }
                promise.reject();
              });
            }
          }
        }, this);
        $.when.apply($, readEntriesPromises).done(function() {
          traversing.resolve(firstLevelItems, entries);
        }).fail(traversing.reject);
      }
      return traversing.promise();
    },

    _traverseItems: function (entries, container, nodes) {
      var traversing = $.Deferred(),
          level = 0,
          files = [],
          self = this,
          failedItems = [],
          foldersAtFirstLevel = [],
          numberOfFoldersCreated = 0;
      if (entries && _.every(entries, function (entry) {
        if (entry) {
          var node = nodes.findWhere({name: entry.name});
          entry.newName = node.get('newName') || entry.name;
          entry.node = node;
          processEntry('.', container, entry);
          return true;
        }
      }, this)) {
        if (!level) {
          traversing.resolve();
        }

        return traversing.then(function () {
          var method = 'reject';
          if (files.length) {
            method = 'resolve';
          }
          return $
          .Deferred()
              [method](files, failedItems, numberOfFoldersCreated, foldersAtFirstLevel)
          .promise();
        });
      }

      function startEntry() {
        return ++level;
      }

      function finishEntry() {
        level && --level;
        if (!level) {
          traversing.resolve();
        }
      }

      function processEntry(path, container, entry) {
        startEntry();
        var node = entry.node,
            newName = node && node.get('newName'),
            isVersion = node && node.get('newVersion'),
            isFirstLevel = false;
        container.subItems = container.subItems ? container.subItems : [];
        path = path + '/' + (entry.newName || entry.name);
        if (entry.isFile) {
          entry.file(function (file) {
            if (node) {
              files.push({
                file: file,
                newName: newName || entry.name,
                id: isVersion && node.get('id'),
                newVersion: isVersion,
                data: node.get('extended_data'),
                type: node.get('type')
              });
            } else {
              files.push({
                file: file,
                container: container,
                newName: newName || entry.name
              });
            }
            container.subItems.push({
              file: file,
              container: container
            });
            finishEntry();
          }, function (error) {
            var file = {
              name: entry.name,
              container: container,
              error: new Error(error),
              isFile: entry.isFile
            };
            failedItems.push(file);
            finishEntry();
          });
          return true;
        } else if (entry.isDirectory) {
          var reader = entry.createReader(),
              folder = {
                "container": true,
                "name": newName || entry.name,
                "parent_id": container.get("id"),
                "parent": container,
                "enforcedRequiredAttrsForFolders": true
              },
              isSupportedFolder =  config.folderSubTypes.indexOf(container.get('type')) >= 0;

          folder = entry.node || new NodeModel(folder, {
            connector: self.parentView.connector
          });
          folder.parent = container;
          folder.set({
            type : isSupportedFolder ? container.get('type') : 0,
            type_name : isSupportedFolder ? container.get('type_name') : "Folder"
          }, {
            silent : true
          });

          var status = {};
          isFirstLevel = self.parentView.container.get('id') === container.get('id');
          status = {
            collection: isFirstLevel ? self.collection : undefined,
            container: container,
            context: self.context,
            originatingView: self.parentView
          };
          UploadService.create(folder, status).done(function (node) {

            if (node.get('id')) {
              numberOfFoldersCreated++;
              container.subItems.push(node);
              node.isLocallyCreated = true;
              if (isFirstLevel) {
                self.collection.unshift(node);
                foldersAtFirstLevel.push(node);
              }

              var totalEnties = [];
              var readEntries = function () {
                reader.readEntries(function (entries) {
                  if (!entries.length) {
                    totalEnties.forEach(processEntry.bind(self, path, node));
                    finishEntry();
                  } else {
                    node.hasEntries = true;
                    totalEnties = totalEnties.concat(entries);
                    readEntries();
                  }
                }, function (error) {
                  if (error) {
                    var err = new base.Error(error);
                    GlobalMessage.showMessage('error', err.message);
                  }
                  finishEntry();
                });
              };
              readEntries();
            } else {
              failedItems.push(node);
              finishEntry();
            }
          }).fail(function (folder, error) {
            folder.error = error;
            failedItems.push(folder);
            finishEntry();
          });
        } else {
          finishEntry();
        }
      }

    },

    checkFiles: function (dataTransfer) {
      var files = dataTransfer.files;
      if (files) {
        return $.whenAll
        .apply($, _.map(files, _.bind(checkFile, this)))
        .then(function (results) {
          return results;
        }, function (files) {
          return $
          .Deferred()
          .reject(files)
          .promise();
        });
      }
      return $
      .Deferred()
      .reject([])
      .promise();

      function checkFile(file) {
        var reader = new FileReader(),
            deferred = $.Deferred(),
            aborted,
            firstLevelItems = {};

        if (file.size === 0) {
          var errorS0 = new Error('size is 0');
          errorS0.file = file;
          return deferred.reject(errorS0);
        }
        reader.addEventListener('load', function () {
          firstLevelItems.file = file;
          firstLevelItems.container = this.container;
          deferred.resolve(firstLevelItems);
          aborted = true;
          reader.abort();
        });
        reader.addEventListener('error', function () {
          if (!aborted) {
            var error = new Error('No file');
            error.file = file;
            deferred.reject(error);
          }
        });
        try {
          var sz = Math.min(file.size, 512);
          var slice = file.slice(0, sz);
          reader.readAsArrayBuffer(slice);
        } catch (err) {
          var error = new Error(err.message);
          error.file = file;
          deferred.reject(error);
        }
        return deferred.promise();
      }
    },

    _resetMessage: function (options) {
      if (this._isRendered) {
        var msgEle = this.parentView.csuiDropMessage;
        msgEle && msgEle.length &&
        msgEle.html(this.template(this._getDropPossibleMessage(options)));
      }
    },

    _getDropPossibleMessage: function (options) {
      var items = options && options.items,
          itemsCount = items && items.length,
          isFolder = itemsCount === 1 && !items[0].type,

          dropMessage = function () {
            if (itemsCount && itemsCount > 1) {
              return lang.MultipleFilesDropMessage;
            } else if (itemsCount && isFolder) {
              return lang.singleFolderDropMessage;
            } else if (itemsCount) {
              return lang.singleFileDropMessage;
            } else {
              return lang.defaultDropMessage;
            }

          },
          fullMessage = {},
          isFileTarget = config.fileSubTypes.indexOf(this.container.get('type')) >= 0;
      fullMessage.fileName = (itemsCount && itemsCount > 1 && isFileTarget) ||
                             (isFileTarget && isFolder) ?
                             this.parentView.container.get('name') :
                             this.container.get('name');
      fullMessage.message = dropMessage();
      return fullMessage;
    },

    updateChildrenCount: function (foldersAtFirstLevel, status) {
      if (status.collection) { //target is current container
        _.each(foldersAtFirstLevel, function (folder) {
          folder.hasEntries && folder.fetch();
        });
      } else {//target is subfolder
        status.container.fetch();
      }
    }
  });

  return DragAndDropView;
});
