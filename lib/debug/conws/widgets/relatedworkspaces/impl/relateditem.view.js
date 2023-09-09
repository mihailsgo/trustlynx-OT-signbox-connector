// Shows a list of workspaces related to the current one
csui.define(['module', 'csui/lib/underscore', 'csui/lib/marionette', 'csui/lib/jquery',
  'conws/utils/previewpane/previewpane.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/utils/base',
  'csui/lib/numeral',
  'i18n!conws/widgets/relatedworkspaces/impl/nls/lang',
  'hbs!conws/widgets/relatedworkspaces/impl/relateditem',
  'css!conws/widgets/relatedworkspaces/impl/relateditem'
], function (module, _, Marionette, $,
    PreviewPaneView,
    DefaultActionBehavior,
    base,
    numeral,
    lang,
    itemTemplate) {

  var RelatedItemView = Marionette.ItemView.extend({

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    constructor: function RelatedItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    triggers: {
      'click .conws-relateditem-border': 'click:item'
    },

    events: {
      'mouseenter': 'showPreviewPane',
      'mouseleave': 'hidePreviewPane'
    },

    onClickItem: function () {
      this.destroyPreviewPane();
      this.triggerMethod('execute:defaultAction', this.model);
    },

    onBeforeDestroy: function (e) {
      this.destroyPreviewPane();
    },

    showPreviewPane: function () {
      if (this.options && this.options.data && this.options.data.preview && (this.options.data.preview.roleId || this.options.data.preview.metadata)) {
        if (!this.previewPane) {
          this.previewPane = new PreviewPaneView({
            parent: this,
            context: this.options.context,
            config: this.options.data && this.options.data.preview,
            node: this.model
          });
        }
        this.previewPane.show();
      }
    },

    hidePreviewPane: function () {
      if (this.previewPane) {
        this.previewPane.delayedHide();
      }
    },

    destroyPreviewPane: function() {
      if (this.previewPane) {
        this.previewPane.destroy();
        delete this.previewPane;
      }
    },

    className: 'conws-relateditem-object clearfix',
    template: itemTemplate,

    serializeData: function () {

      // prepare values
      var allval = this._getObject(this.options.data || {});

      var values = {};

      // take only values we want
      allval.title && (values.title = allval.title);
      allval.description && (values.description = allval.description);
      allval.topRight && (values.topRight = allval.topRight);
      allval.bottomLeft && (values.bottomLeft = allval.bottomLeft);
      allval.bottomRight && (values.bottomRight = allval.bottomRight);

      // default values if still no value is set
      values.title || (values.title = {value: this.model.get('name')});
      values.name || (values.name = this.model.get('name'));
      values.id || (values.id = this.model.get('id'));
      values.defaultActionUrl = DefaultActionBehavior.getDefaultActionNodeUrl(this.model);

      // provide property to indicate that this is not the last item
      if (this.model.get("id") !==
          this.model.collection.models[this.model.collection.models.length - 1].get("id")) {
        values.notLastItem = true;
      }

      values.inactive = this.defaultActionController.hasAction(this.model) ? '' : 'inactive';

      return values;
    },

    templateHelpers: function (data) {
      return data;
    },

    // Loop over configuration and set proper content that should be displayed
    _getObject: function (object) {
      return _.reduce(object, function (result, expression, name) {
        if (typeof expression !== 'object') {
          expression = this.self._getValue(expression);
        } else if (typeof expression === 'object') {
          if(name === 'value' || name === 'label') {
            var exp = base.getClosestLocalizedString(expression);
            expression = this.self._getValue(exp);
          }
          else {
            expression = this.self._getObject(expression);
          }
        }
        result[name] = expression;

        return result;
      }, {}, {"self": this});
    },

    _getValue: function (expression) {
      // Replace the {} parameter placeholders
      var parameterPlaceholder = /{([^:}]+)(:([^}]+))?}/g,
          match, propertyName, placeholder, value, valueFormat, result = expression;
      // Go over every parameter placeholder found
      // Don't change expression while doing this, because exec remembers position of last matches
      while ((match = parameterPlaceholder.exec(expression))) {
        placeholder = match[0];
        propertyName = match[1];
        valueFormat = match[3];
        // Format the value according to his type
        if (this.model.collection.columns.models) {
          value = this._formatPlaceholder(propertyName, valueFormat, this.model.attributes,
              this.model.collection.columns.models);
        }

        // Replace the placeholder with the value found
        result = result.replace(placeholder, value);
      }
      return result;
    },

    // returns a type specifically formatted model value.
    _formatPlaceholder: function (propertyName, valueFormat, attributes, columnModels) {
      var value, column, type, suffix = "_expand", orgPropertyName = propertyName;

      column = _.find(columnModels, function (obj) {
        return obj.get("column_key") === propertyName;
      });
      type = column && column.get("type") || undefined;

      // If exist use expanded property
      propertyName = attributes[propertyName + suffix] ? propertyName + suffix : propertyName;
      value = attributes[propertyName] || "";

      switch (type) {
      case -7:
        value = base.formatDate(value);
        break;
      case 5:
        // Type 5 is a boolean and in this case format properly
        value = attributes[propertyName + "_formatted"];
        if (value === null || value === undefined) {
          value = '';
        }
        break;
      case 2, 14:
        // Type 2 and 14 can be user or group and in this case format properly
        // Check for type_name : user + expand -> user
        // Check for type_name : group + expand -> group
        if (propertyName.indexOf(suffix, this.length - suffix.length) !== -1 &&
            (attributes[propertyName].type_name === "User" || attributes[propertyName].type_name === "Group")) {
          value = base.formatMemberName(value);
        }
        else {
          // If exist use _formatted property
          value = attributes[orgPropertyName + "_formatted"];
        }

        // No break because it must also be checked for default!
        /* falls through */
      default:
        // Allow currency to applied for different types, e.g. also a string can be
        // formatted as currency
        if (valueFormat === 'currency') {
          // FIXME: format properly if csui provide formating currencies, for now use default
          value = numeral(value).format();
        }

        // In case the value is still expanded object (e.g. user property is undefined, ...)
        // Set value the not expanded property
        if (typeof value === 'object') {
          value = attributes[orgPropertyName] || "";
        }
      }
      return value;
    }
  });

  return RelatedItemView;

});
