/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/form',
  'csui/utils/base',
  'i18n!csui/dialogs/restructure/impl/nls/root/lang'
], function (_, $, FormModel, base, lang) {
  'use strict';

  var RestructureFormModel = FormModel.extend({
    defaults: {
      data: {},
      options: {},
      schema: {}
    },

    constructor: function RestructureFormModel(attributes, options) {
      options || (options = {});
      FormModel.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
      this._setFormAttributes();
    },

    _setFormAttributes: function () {
      var numNodes = this.options.models.length,
        value = Date.now();
      this.set({
        data: {
          location: '',
          startProcess: lang.immediate,
          startProcessAt: base.parseDate(value),
          notifyUsers: '',
          reference: '',
          comment: ''
        },
        options: {
          fields: {
            location: {
              hidden: false,
              hideInitValidationError: true,
              label: lang.targetLocation,
              readonly: false,
              placeholder: lang.locationPlaceholder,
              type: 'otcs_node_picker',
              type_control: {
                parameters: {
                  propertiesSeletor: true,
                  includeCombineProperties: (numNodes === 1),
                  dialogTitle: lang.selectTargetLocation,
                  addableTypes:[0],
                  selectableTypes: [-1],
                  unselectableTypes: [899], 
                  startLocation: "csui/dialogs/node.picker/start.locations/current.location",
                  startLocations: [
                    "csui/dialogs/node.picker/start.locations/current.location",
                    "csui/dialogs/node.picker/start.locations/enterprise.volume",
                    "csui/dialogs/node.picker/start.locations/favorites",
                    "csui/dialogs/node.picker/start.locations/recent.containers"
                  ],
                  initialContainer: this.options.container
                }
              }
            },
            startProcess: {
              hidden: false,
              hideInitValidationError: true,
              label: lang.startProcess,
              readonly: false,
              removeDefaultNone: true,
              type: 'select'
            },
            startProcessAt: {
              hidden: false,
              hideInitValidationError: true,
              label: lang.startProcessAt,
              readonly: false,
              type: 'datetime',
              dependencies: {
                startProcess: lang.schedule // Specify the required value for the dependant field to show
              }
            },
            reference: {
              label: lang.reference,
              hidden: false,
              hideInitValidationError: true,
              readonly: false,
              validate: true,
              type: 'text',
              size: 255
            },
            comment: {
              label: lang.comment,
              hidden: false,
              hideInitValidationError: true,
              readonly: false,
              type: 'textarea'
            },
            notifyUsers: {
              hidden: false,
              hideInitValidationError: true,
              label: lang.notifyUsers,
              clearField: true,
              readonly: false,
              type: 'otcs_user'
            }
          }
        },
        schema: {
          properties: {
            location: {
              readonly: false,
              required: true,
              title: lang.targetLocation,
              type: 'otcs_node_picker'
            },
            startProcess: {
              title: lang.startProcess,
              type: 'string',
              enum: [lang.immediate, lang.schedule]
            },
            startProcessAt: {
              readonly: false,
              required: false,
              title: lang.startProcessAt,
              type: 'string',
              dependencies: ['startProcess']
            },
            reference: {
              readonly: false,
              required: false,
              title: lang.reference,
              type: 'string'
            },
            comment: {
              readonly: false,
              required: false,
              title: lang.comment,
              type: 'string'
            },
            notifyUsers: {
              readonly: false,
              required: false,
              title: lang.notifyUsers,
              type: 'otcs_user'
            }
          },
          dependencies: {
            startProcessAt: ['startProcess']
          },
          type: 'object'
        }
      });
    },

  });

  return RestructureFormModel;
});
