/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette',
  'i18n!xecmpf/controls/draganddrop/impl/nls/lang',
  'hbs!xecmpf/controls/draganddrop/impl/draganddrop',
  'css!xecmpf/controls/draganddrop/impl/draganddrop'
], function (module, $, _, Marionette, lang, template) {

  var config = _.defaults({}, module.config(), {
    detectLeaveDelay: 100
  });

  var DragAndDropView = Marionette.ItemView.extend({

    template: template,
    className: "xecmpf-dropMessage",

    ui: {
      message: '.xecmpf-messageBox'
    },

    templateHelpers: function () {
      return {
        message: lang.dropMessage
      };
    },

    constructor: function DragAndDropView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);

      this.addableTypes = options.addableTypes;
      this.wantDragAndDrop = true;
      this.context = options.context;
      this.visible = false;
      this.parentView = options.originatingView || options.parentView;
    },

    setDragParentView: function (parentView, selector) {
      this.parentView = parentView;
      this._parentEl = _.isString(selector) && parentView.$(selector) ||
                       selector.length !== undefined && selector ||
                       selector && $(selector) ||
                       parentView.$el;
      this.render();
      this._parentEl.append(this.el);
      if (this.shouldDragAndDrop()) {
        this.disable();
        this._setDragEvents();
      }
      return true;
    },

    onDestroy: function () {
      if (this.shouldDragAndDrop()) {
        if (this._parentEl) {
          this._parentEl
              .off("dragover", this.dragOver)
              .off("dragleave", this.dragLeave)
              .off("drop", this.dragDrop);
        }
      }
    },

    _setDragEvents: function () {
      this.dragOver = _.bind(this.onOverView, this);
      this.dragLeave = _.bind(this.onLeaveView, this);
      this.dragDrop = _.bind(this.onDropView, this);
      this._parentEl
          .on("dragover", this.dragOver)
          .on("dragleave", this.dragLeave)
          .on("drop", this.dragDrop);
    },

    enable: function (triggerEvent) {
      if (!this.visible) {
        if (triggerEvent !== false) {
          this.trigger('drag:over');
        }
        this.$el.show();
        this.visible = true;
      }
    },

    disable: function (currentEvent) {
      this.$el.hide();
      this.trigger('drag:leave');
      this.visible = false;
    },

    shouldDragAndDrop: function () {
      var browserSupported = false,
          sampleDiv        = document.createElement('div');
      if ((window.File && window.FileReader && window.FileList && window.Blob) &&
          (('draggable' in sampleDiv) ||
           ('ondragstart' in sampleDiv && 'ondrop' in sampleDiv))) {
        browserSupported = true;
      }

      return browserSupported && this.wantDragAndDrop;
    },

    canAdd: function () {
      return this.addableTypes === '144';
    },

    onOverView: function (currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();

      if (this.leaveViewTimeout) {
        clearTimeout(this.leaveViewTimeout);
        this.leaveViewTimeout = undefined;
      }
      else {
        this.enable(false);
      }
      var dataTransfer   = currentEvent.originalEvent &&
                           currentEvent.originalEvent.dataTransfer,
          items          = dataTransfer.items,
          validItems     = items && items.length && _.all(items, function (item) {
                return item.kind === 'file';
              }),
          types          = dataTransfer && dataTransfer.types,
          validTypes     = types && types.length && _.any(types, function (type) {
                return type.toLowerCase() === 'files';
              }),
          invalidMessage = lang.dropInvalid;
      this.valid = items && validItems || validTypes;
      dataTransfer.dropEffect = 'copy';

      if (!this.canAdd()) {
        this.valid = false;
        invalidMessage = lang.dropNotPermitted;
      }

      if (this.valid) {
        if (this.$el.hasClass('csui-disabled')) {
          this._restMessage();
          this.$el.removeClass('csui-disabled');
        }
        this.trigger('drag:over', this, {disabled: false});
      } else {
        if (!this.$el.hasClass('csui-disabled')) {
          this.ui.message.text(invalidMessage);
          this.$el.addClass('csui-disabled');
        }
        this.trigger('drag:over', this, {disabled: true});
      }
    },

    onLeaveView: function (currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      if (!this.leaveViewTimeout) {
        this.leaveViewTimeout = setTimeout(_.bind(function () {
          this.leaveViewTimeout = undefined;
          this.disable();
        }, this), config.detectLeaveDelay);
      }
    },

    onDropView: function (currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      var self         = this,
          dataTransfer = currentEvent.originalEvent &&
                         currentEvent.originalEvent.dataTransfer ||
              {
                files: currentEvent.originalEvent &&
                       currentEvent.originalEvent.target &&
                       currentEvent.originalEvent.target.files || []
              };
      this.checkFiles(dataTransfer).always(function (files) {
        files = _.reject(files, function (file) {
          return file instanceof Error;
        });
        console.log("Dropped files length", files.length);
        self.parentView.onDrop && self.parentView.onDrop(files);
      });
      this.disable();
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
        var reader   = new FileReader(),
            deferred = $.Deferred(),
            aborted;

        if (file.size === 0) {
          var errorS0 = new Error('size is 0');
          errorS0.file = file;
          return deferred.reject(errorS0);
        }
        reader.addEventListener('load', function () {
          deferred.resolve(file);
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

    _restMessage: function () {
      if (this._isRendered) {
        this.ui.message.text(this._getDropPossibleMessage());
      }
    },

    _getDropPossibleMessage: function () {
      return lang.dropMessage;
    }

  });

  return DragAndDropView;

});
