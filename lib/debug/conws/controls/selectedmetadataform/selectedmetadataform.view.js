csui.define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base', 'csui/utils/url',
  'csui/controls/form/form.view','csui/controls/globalmessage/globalmessage'
], function (_, $, base, Url, FormView, GlobalMessage) {

  function getSelectorPath(root,node) {
    var path;
    while (node.length) {
      if ($(node).is(root)) {
        return path ? '>' + path : '';
      }
      var realNode = node[0], name = realNode.localName;
      if (!name) { break; }
      name = name.toLowerCase();

      var parent = node.parent();

      var allSiblings = parent.children();
      var index = allSiblings.index(realNode) + 1;
      name += ':nth-child(' + index + ')';

      path = name + (path ? '>' + path : '');
      node = parent;
    }
    return root ? undefined : path;
  }

  function getFocusInfo(view) {
    var focusPath;
    var focused = view.$el.find(":focus");
    if (focused.length) {
      var control = focused;
      while (control && control.length && !control.attr("data-alpaca-field-id")) {
        control = control.parent();
      }
      if (control.length) {
        focusPath = getSelectorPath(view.$el,control)
      }
    }
    var scrolltop = view.$el.parent().parent().scrollTop();
    return {focused:focused,focusPath:focusPath,scrolltop:scrolltop};
  }

  function restoreFocus(view,focusInfo) {
    if (focusInfo.scrolltop>=0) {
      view.$el.parent().parent().scrollTop(focusInfo.scrolltop);
    }
    var focused = view.$el.find(":focus");
    if (!focused.is(focusInfo.focused)) {
      if (focusInfo.focusPath) {
        var control = view.$el.find(focusInfo.focusPath),
            tofocus = control.find(".alpaca-control .cs-field-read button");
        tofocus.trigger('click');
      }
    }
  }

  // call given function if callback has been called the specified count of times
  function CallOnCount(count,fct) {
    this.count = count;
    this.fct = fct;
    this.callback = function callback () {
      if (this.count>0) {
        this.count = this.count - 1;
        if (this.count===0) {
          this.fct.call();
        }
      }
    }
  }

  function makeCountCallback(count,fct) {
    // set timeout to 0, just causes, that code is called after current thread execution
    // we need this, so setting focus and scroll position is done after field layout
    var coc = new CallOnCount(count,function(){setTimeout(fct,0);});
    return _.bind(coc.callback,coc);
  }

  // due to lack in csui, setting an array value with different length runs into error.
  // to avoid this we add/remove required items.
  function adaptChildrenLength(el,val) {
    var ii;
    if (el.children && el.children.length) {
      if (val && val.length) {
        if (val.length>el.children.length) {
          for (ii = el.children.length; ii<val.length; ii++) {
            var data = val[ii];
            var options = _.extend({},el.children[0].options);
            var schema = _.extend({},el.children[0].schema);
            el.addItem(ii,schema,options,data,function(){});
          }
        } else if (val.length<el.children.length) {
          for (ii = el.children.length-1; ii >= val.length; ii--) {
            el.removeItem(ii,function(){});
          }
        }
      }
    }
  }

  // determine all fields displaying the changed attribute, except the one identified by path.
  // on error only the one identified by path.
  function getRefreshFields(children,changes,path,iserror) {
    var fields = [];
    for (var ii=0; ii<children.length; ii++) {
      var el = children[ii];
      if (el.propertyId && changes.hasOwnProperty(el.propertyId) && path.hasOwnProperty(el.propertyId) ) {
        if (iserror ? el.path===path : el.path!==path[el.propertyId]) {
          fields.push(el);
        }
      } else if (el.children) {
        fields = fields.concat(getRefreshFields(el.children,changes,path,iserror));
      }
    }
    return fields;
  }

  // refresh fields if same attribute is displayed in different fields
  // and on error this function is used to restore old values
  // also restores scroll position and focus field
  function refreshFields(view,focus,changes,path,iserror) {
    // to improve: find scroll parent better.
    var fields = getRefreshFields(view.form.children,changes,path,iserror);
    if (fields.length) {
      var callback = makeCountCallback(fields.length,function(){
        restoreFocus(view,focus);
      });
      fields.forEach(function(el){
        adaptChildrenLength(el,changes[el.propertyId]);
        el.setValue(changes[el.propertyId]);
        el.refresh(callback);
      });
    }
  }

  var SelectedMetadataFormView = FormView.extend({

    constructor: function SelectedMetadataFormView(options) {
      FormView.prototype.constructor.call(this, options);

      this.node = this.options.node;
      this.listenTo(this, 'change:field', function(args){
		  this._saveField(args);
	  });
    },

    _saveField: function (args) {
      // must search for changed property, as in the rest call only attributes from one single
      // category can be changed and it runs into an error, if other attributes are passed.
      if(this._hasDependentFields(args)){
        // To store the dependent attribute ids against its path
        var dependentFieldMappings = {};
        // Fetching the the top most parent tkl object 
        var topFieldView = this._getTopMostTKLParentField(args.fieldView);
        this._getDependencyFields(topFieldView, dependentFieldMappings);
        this._saveChanges(dependentFieldMappings, args.value);
      }
      else{
        var property = this.form.getControlByPath(args.path[0]==='/'?args.path.substring(1):args.path);
        this._saveChanges(property.propertyId,args.value,property.path,true);
	  }
    },

    /**
     * To check if the category attribute has any children/dependent attributes
     * returns true if category attribute has dependent attributes else false
     *
     * @param arguments
    */
    _hasDependentFields: function (arguments) {
      var args;
      if (arguments.fieldView && arguments.fieldView.type && arguments.fieldView.type === 'array') {
        args = arguments.fieldView.children[0];
      } else {
        args = arguments;
      }
      if (typeof args.fieldView !== 'undefined') {
        if (typeof args.fieldView.isTKLField !== 'undefined') {
          if (args.fieldView.isTKLField) {
            if ((!!args.fieldView.children && args.fieldView.children.length > 0) || (!!args.fieldView.parentViews && args.fieldView.parentViews.length > 0)) {
              return true;
            }
            else {
              return false;
            }
          }
          else {
            return false;
          }
        }
        else {
          return false;
        }
      }
      else {
        return false;
      }
    },

    /**
    * Get all TKL depedent values in object format
    *
    * @param fieldView
    * @param dependentFieldMappings
    */
    _getDependencyFields: function (fieldView, dependentFieldMappings) {
      var fieldEleView, fieldPropertyId, fieldPath;
      if (!!fieldView.type && fieldView.type === 'array') {
        fieldEleView = fieldView.children && fieldView.children[0].fieldView;
        fieldPropertyId = fieldView.propertyId;
        fieldPath = fieldView.path;
      } else if (fieldView.alpacaField) {
        fieldEleView = fieldView;
        fieldPropertyId = fieldView.alpacaField.propertyId;
        fieldPath = fieldView.alpacaField.path;
      }
      if (fieldEleView && fieldEleView.alpacaField && fieldPropertyId) {
        if (!dependentFieldMappings.hasOwnProperty(fieldPropertyId)) {
          dependentFieldMappings[fieldPropertyId] = fieldPath;
          if (fieldEleView.children && fieldEleView.children.length > 0) {
            for (var i = 0; i < fieldEleView.children.length; i++) {
              this._getDependencyFields(fieldEleView.children[i], dependentFieldMappings);
            }
          }
        }
      }
    },

    /**
     * Retrives the top most parent tkl attribute to iterate from the top
     *
     * @param fieldView
     */
    _getTopMostTKLParentField: function (fieldView) {
      var fieldEleView;
      if (!!fieldView.type && fieldView.type === 'array') {
        fieldEleView = fieldView.children && fieldView.children[0].fieldView;
      } else if (fieldView.alpacaField) {
        fieldEleView = fieldView;
      }
      if (fieldEleView && fieldEleView.parentViews && fieldEleView.parentViews.length > 0) {
        for (var i = 0; i < fieldEleView.parentViews.length; i++) {
          return this._getTopMostTKLParentField(fieldEleView.parentViews[i]);
        }
      } else {
        return fieldView;
      }
    },

    /**
     * Save changes of a single/multiple category attribute(s) to the server
     *
     * @param property  Either it may contain single or multiple category attributes
     * @param value     value of the property
     * @param path      path of the property
     * @param isInSync  Introduced isInSync to save dependent tkl values synchronously
     *                  if no dependent tkl's are provided async is restored
     */
    _saveChanges: function (property,value,path,isInSync) {
      var formView, values, segpath, segments, propertyId,
        change = {},
        changes = {},
        paths = {},
        properties = {};
      var formValues = this.getValues();
      var formViewList = this.metadataview && this.metadataview.formViewList;
      if (formViewList && formViewList.length > 0) {
        for (var index = 0; index < formViewList.length; index++) {
          formView = formViewList[index];
          formValues = Object.assign(formValues, formView.getValues());
        }
      }

      // Checking whether the property is object or string.
      if (typeof property === 'object') {
        properties = property;
      } else {
        properties[property] = path
      }

      _.each(properties, function (val, key) {
        values = formValues;
        propertyId = key;
        path = val;
        segpath = path[0] === '/' ? path.substring(1) : path;
        segments = segpath.split('/');
        for (var ii = 0; ii < segments.length - 1; ii++) {
          if (values) {
            values = values[segments[ii]];
          }
        }
        if (values) {
          _.each(values, function (val, id) {
            var idStartsWith = id.substring(0, propertyId.length),
              idEndsWith = id.substring(propertyId.length + 1);
            if (id === propertyId || (!!idStartsWith && !!idEndsWith && propertyId === idStartsWith && !isNaN(idEndsWith))) {
              change[id] = val;
              changes[id] = val;
              paths[id] = path;
            }
          }, changes);
        }
        if (Object.keys(changes).length === 0 && propertyId) {
          change[propertyId] = value;
          changes[propertyId] = value
        }
        // if --> when attributes from multivalued set are added in PMan, 
        //Previously, In this case we are using PUT without Multivalued set Id, so adding the Set Id to the Changed property.
        // changed the implementation as we have some issues while saving in this scenario
        if (propertyId.search("x") > 0) {
          var temp = {},
            parentPropertyId;
          temp[propertyId] = changes[propertyId];
          delete changes[propertyId];
          delete change[propertyId];
          parentPropertyId = propertyId.substring(0, propertyId.indexOf("x") - 1);
          changes[parentPropertyId] = [temp];
          change[parentPropertyId] = [temp];
        }
      });

      if (!this.node) {
        throw new Error('Missing node to save the categories to.');
      }
      if (this._validate(change)) {
        var focus = getFocusInfo(this);
        this._blockActions();
        return this.node.connector.makeAjaxCall(this.node.connector.extendAjaxOptions({
              type: 'PUT',
              url: Url.combine(this.node.urlBase(), 'categories', propertyId.split('_')[0]),
              // proper formating is done in makeAjaxCall
              data: changes,
			  async: isInSync
            }))
            .done(_.bind(function () {
              this.model.updateData(change);
              refreshFields(this,focus,change,paths,false);
              this.trigger('forms:sync');
              // event for keyboard navigation
              var event = $.Event('tab:content:field:changed');
              this.$el.trigger(event);
            }, this))
            .fail(_.bind(function (jqxhr) {
              var restore = this.model.restoreData(change);
              refreshFields(this,focus,restore,paths,true);
              var error = new base.Error(jqxhr);
              GlobalMessage.showMessage('error', error.message);
              this.trigger('forms:error');
            }, this))
            .always(_.bind(function () {
              this._unblockActions();
            }, this));
      }
      return $.Deferred().reject().promise();
    }
  });

  return SelectedMetadataFormView;
});
