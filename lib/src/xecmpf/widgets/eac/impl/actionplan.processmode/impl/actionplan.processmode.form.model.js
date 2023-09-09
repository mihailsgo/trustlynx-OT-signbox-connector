/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

define(['csui/models/form', 'i18n!xecmpf/widgets/eac/impl/nls/lang'], function (FormModel, lang
) {

    var ActionPlanProcessModeFormModel = FormModel.extend({
        constructor: function ActionPlanProcessModeFormModel(attributes, options) {
            this.options = options || (options = {});
            attributes || (attributes = {
                schema: { properties: {} },
                options: { fields: {} },
                date: {}
            });
            FormModel.prototype.constructor.call(this, attributes, options);
        },

        initialize: function (attributes, options) {
            this._setAttributes();
        },

        _setAttributes: function () {
            var that = this;
            var run_as = '';
            var process_mode = '';
            if(!!this.options.eventModel && !!this.options.eventModel.attributes.data && !!this.options.eventModel.attributes.data.processMode){
                process_mode = this.options.eventModel.attributes.data.processMode
            }
            if(!!this.options.eventModel && !!this.options.eventModel.attributes.data && !!this.options.eventModel.attributes.data.runAs){
                run_as = this.options.eventModel.attributes.data.runAs
            }
            
            this.set({
                schema: {
                    properties: {
                        run_as: {
                            required: true,
                            type: "otcs_user_picker"
                        },
                        process_mode: {
                            type: "text",
                            readonly: true,
                            default: lang.asynchronouslyProcessLabel
                        }
                    }
                },
                options: {
                    fields: {
                        run_as: {
                            label: lang.runAs,
                            type: "otcs_user_picker",
                            events: {
                                change: function () {
                                    that.setValue(this.path, this.getValue());
                                }
                            }
                        },
                        process_mode: {
                            label: lang.processMode,
                            type: "text",
                            readonly: true,
                            removeDefaultNone: true
                        }
                    }
                },
                data: {
                    run_as: run_as,
                    process_mode: process_mode
                }
            });
        }

    });
    return ActionPlanProcessModeFormModel;
});