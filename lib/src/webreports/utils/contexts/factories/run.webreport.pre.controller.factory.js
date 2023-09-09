/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/utils/contexts/factories/factory',
    'csui/utils/contexts/factories/connector',
    'webreports/controls/run.webreport.pre/run.webreport.pre.controller'
], function (_,ObjectFactory, ConnectorFactory, RunWRPreController) {

    var RunWebReportPreControllerFactory = ObjectFactory.extend({
        propertyPrefix: 'runwebreportprecontroller',

        constructor: function RunWebReportPreControllerFactory(context, options) {
            if (_.has(options,"attributes")){
                delete options.attributes;
            }
            if (_.has(options, this.propertyPrefix) && _.has(options[this.propertyPrefix], "attributes")){
                delete options[this.propertyPrefix].attributes;
            }

            ObjectFactory.prototype.constructor.apply(this, arguments);
            var connector = context.getObject(ConnectorFactory, options),
                modelOptions = _.extend( options.options, {
                    connector: connector
                });
            this.property = new RunWRPreController( {}, modelOptions );
        }

    });

    return RunWebReportPreControllerFactory;

});