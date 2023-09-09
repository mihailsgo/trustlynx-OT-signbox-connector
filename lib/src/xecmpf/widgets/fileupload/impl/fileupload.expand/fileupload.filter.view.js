/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/behaviors/keyboard.navigation/tabable.region.behavior',
    'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
    'xecmpf/widgets/fileupload/impl/factory/fileupload.collection.factory',
    'hbs!xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.filter',
    'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
    'css!xecmpf/widgets/fileupload/impl/fileupload'
], function (Marionette, _, $, TabableRegionBehavior, LayoutViewEventsPropagationMixin,
    FileUploadCollectionFactory, template, lang) {

    'use strict';

    var FileUploadFilterView = Marionette.LayoutView.extend({

        template: template,

        templateHelpers: function () {
            var completeCollection = this.model.models,
                totcalCount = 0, missing = "Missing", missingCount, outDated = "Outdated", outDatedCount,
                inProcess = "In Process", inProcessCount,
                locationID, locName, checkedAll = '', checkedMissing = '', checkedOutdated = '', checkedInProcess = '',
                checked = "checked", grpByLocation = [];
                
            completeCollection.forEach(function (item) {
                var alreadyExists = false;
                switch(item.get('status')) {
                    case "missingDocuments":
                        missing = item.get('label');
                        missingCount = item.get('count')
                        totcalCount = totcalCount + 1;
                        checkedMissing = checked;
                    break;

                    case "outdatedDocuments":
                        outDated = item.get('label');
                        outDatedCount = item.get('count');
                        totcalCount = totcalCount + 1;
                        checkedOutdated = checked;
                    break;

                    case "inprocessDocuments":
                        inProcess = item.get('label');
                        inProcessCount = item.get('count');
                        totcalCount = totcalCount + 1;
                        checkedInProcess = checked;                        
                    break;
                }

                locationID = item.get('location_id');
                locName = item.get('location_name')
                grpByLocation.forEach(function (loc) {
                    if (loc.id === locationID) {
                        alreadyExists = true;
                        loc.count = loc.count + 1;
                        return;
                    }
                });
                if (!alreadyExists) {
                    grpByLocation.push({
                        name: locName,
                        count: 1,
                        id: locationID
                    });
                }
            });
            if ( checkedMissing === checked && checkedOutdated === checked && checkedInProcess === checked){

                checkedAll = checked;
            }
            return {
                headerFilterTitle: lang.refineBy,
                status: lang.status,
                locations: lang.locations,
                totcalCount: totcalCount,
                inProcess: inProcess,
                outDated: outDated,
                missing: missing,
                checkedMissing: checkedMissing,
                checkedOutdated: checkedOutdated,
                checkedInProcess: checkedInProcess,
                allFilterLabel: lang.allFilterLabel,
                inProcessCount: inProcessCount,
                outDatedCount: outDatedCount,
                missingCount: missingCount,
                locArray: grpByLocation,
                checked: checked,
                checkedAll: checkedAll
            };
        },

        constructor: function FileUploadFilterView(options) {
            this.options = options;
            this.completeCollection = this.options.context.getCollection(FileUploadCollectionFactory)
            Marionette.LayoutView.prototype.constructor.apply(this, arguments);
            this.propagateEventsToRegions();
        },

        initialize: function () {
            var self = this;
            this.model = this.options.context.getModel(FileUploadCollectionFactory);
            this.model.on("sync", function () {
                self.render();
            });
        },

        events: {
            'click #selectAll': 'toggleCheckBoxAll',
            'click .fileupload-status': 'toggleSelection',
            'click .xecmpf-fileupload-location-name': 'toggleSelection',
            'keydown': 'onKeyInView',
            'click .fileupload-status-toggle': 'toggleStatus',
            'click .fileupload-locations-toggle': 'toggleLocation'
        },

        behaviors: {
            TabableBehavior: {
                behaviorClass: TabableRegionBehavior
            }
        },

        isTabable: function () {
            return this.$('*[tabindex]').length > 0;
        },

        currentlyFocusedElement: function (event) {
            var tabElements = this.$('*[tabindex]:visible');

            if (tabElements.length) {
                tabElements.prop('tabindex', 0);
            }

            if (!!event && event.shiftKey) {
                return $(tabElements[tabElements.length - 1]);
            }
            else {
                return $(tabElements[0]);
            }
        },

        onKeyInView: function (event) {
            if (event.keyCode === 13 || event.keyCode === 32) {
                event.currentTarget = event.target.parentNode;
                this.toggleSelection(event);
            }
        },

        toggleCheckBoxAll: function (event) {
            var statusList = this.options.extendedView.completeCollection ? this.options.extendedView.completeCollection.status : [];
            
            if (this.$el.find("[id='selectAll']:checked").length === 1) {
                $('.status-filter input:not(:checked)').each(function () {
                    $(this).prop("checked", true).trigger('change');
                    if (this.id === "xecmpf-fileupload-status-missing") {
                        statusList.push("missingDocuments");
                    } else if (this.id === "xecmpf-fileupload-status-outDated") {
                        statusList.push("outdatedDocuments");
                    } else if (this.id === "xecmpf-fileupload-status-inprocess") {
                        statusList.push("inprocessDocuments");
                    }
                    
                });
            } else {
                $('.status-filter input:checked').each(function () {
                    $(this).prop("checked", false).trigger('change');
                });
            }

            var parentView = this.options.extendedView;
            parentView.completeCollection.status = statusList;
            parentView.completeCollection.locations = null;
            parentView.completeCollection.resetLimit();
            parentView.completeCollection.fetch({ reload: true });
            
        },

        toggleStatus: function (event) {
            var statusToggle = $('.fileupload-status-toggle');
            if (statusToggle.hasClass('fileupload-status-show')) {
                $('.fileupload-status-content').hide();
                statusToggle.removeClass('fileupload-status-show');
                statusToggle.addClass('fileupload-status-hide');
                statusToggle.removeClass('icon-expandArrowUp');
                statusToggle.addClass('icon-expandArrowDown');
            } else if (statusToggle.hasClass('fileupload-status-hide')) {
                $('.fileupload-status-content').show();
                statusToggle.removeClass('fileupload-status-hide');
                statusToggle.addClass('fileupload-status-show');
                statusToggle.removeClass('icon-expandArrowDown');
                statusToggle.addClass('icon-expandArrowUp');
            }
        },

        toggleLocation: function (event) {
            var locationTaggle = $('.fileupload-locations-toggle');
            if (locationTaggle.hasClass('fileupload-locations-show')) {
                $('.fileupload-location-body').hide();
                locationTaggle.removeClass('fileupload-locations-show');
                locationTaggle.addClass('fileupload-locations-hide');
                locationTaggle.removeClass('icon-expandArrowUp');
                locationTaggle.addClass('icon-expandArrowDown');
            } else if (locationTaggle.hasClass('fileupload-locations-hide')) {
                $('.fileupload-location-body').show();
                locationTaggle.removeClass('fileupload-locations-hide');
                locationTaggle.addClass('fileupload-locations-show');
                locationTaggle.removeClass('icon-expandArrowDown');
                locationTaggle.addClass('icon-expandArrowUp');
            }
        },

        toggleSelection: function (event) {
            var statusList = [], locationList = [];
            if ($('.fileupload-status-body .csui-selected-checkbox input:not(:checked)').length > 0) {
                $('.fileupload-status-body .csui-selected-checkbox input:checked').each(function () {
                    var id = this.id;
                    if (id === "xecmpf-fileupload-status-missing") {
                        statusList.push("missingDocuments");
                    } else if (id === "xecmpf-fileupload-status-outDated") {
                        statusList.push("outdatedDocuments");
                    } else if (id === "xecmpf-fileupload-status-inprocess") {
                        statusList.push("inprocessDocuments");
                    }
                });
                event.data = statusList;
                $('#selectAll').prop("checked", false).trigger('change');
            } else {
                $('#selectAll').prop("checked", true).trigger('change');
            }

            $('.fileupload-location-body .csui-selected-checkbox input:checked').each(function () {
                if (this.name) {
                    locationList.push(this.name);
                }
            });
            
            var parentView = this.options.extendedView;
            parentView.completeCollection.status = statusList;
            if(event.currentTarget.className === "xecmpf-fileupload-location-name"){
                parentView.completeCollection.locations = locationList;            
            } else {
                parentView.completeCollection.locations = null;
            }
            parentView.completeCollection.resetLimit();
            parentView.completeCollection.fetch({ reload: true });
            
        },

        filterTableData: function (filterCriteria) {
            var statusList = filterCriteria.statusList;
            var locationList = filterCriteria.locationList, i;
            
            var completeCollection = this.model.models;
            var filteredData = [];

            completeCollection.forEach(function (item) {
                var statusOK = false;
                var locationOK = false;
                var itemStatus = item.get('status');
                var itemLoc = item.get('location_id');
                var i;

                if (statusList && statusList.length > 0) {
                    for (i = 0; i < statusList.length; i++) {
                        if (itemStatus === statusList[i]) {
                            statusOK = true;
                            break;
                        }

                    }
                } else {
                    statusOK = true;
                }

                if (locationList && locationList.length > 0) {
                    for (i = 0; i < locationList.length; i++) {
                        if (itemLoc === locationList[i]) {
                            locationOK = true;
                            break;
                        }
                    }
                } else {
                    locationOK = true;
                }


                if (statusOK && locationOK) {
                    filteredData.push(item);
                }
            });

            return filteredData;
        }
    });

    _.extend(FileUploadFilterView.prototype, LayoutViewEventsPropagationMixin);
    return FileUploadFilterView;
});