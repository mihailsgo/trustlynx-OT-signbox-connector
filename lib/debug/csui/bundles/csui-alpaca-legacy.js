csui.define('csui/lib/alpaca/js/alpaca',["csui/lib/jquery", "csui/lib/alpaca/js/alpaca.lite", "csui/lib/handlebars",
    "csui/lib/binf/js/binf", "csui/lib/moment", "i18n!csui/lib/alpaca/nls/lang"
], function ($, Alpaca, Handlebars, Bootstrap, moment, lang) {
    //TODO: replace with better deprecation check during build phase
    console.warn("It is recommended to use alpaca.lite for better performance");
    var jQuery = $;

    (function($) {
        
        Alpaca.Fields.AddressField = Alpaca.Fields.ObjectField.extend(
            /**
             * @lends Alpaca.Fields.AddressField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.ObjectField#getFieldType
                 */
                getFieldType: function () {
                    return "address";
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.ObjectField#setup
                 */
                setup: function () {
                    this.base();
    
                    if (this.data === undefined) {
                        this.data = {
                            street: ['', '']
                        };
                    }
    
                    this.schema = {
                        "title": "Home Address",
                        "type": "object",
                        "properties": {
                            "street": {
                                "title": "Street",
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "maxLength": 30,
                                    "minItems": 0,
                                    "maxItems": 3
                                }
                            },
                            "city": {
                                "title": "City",
                                "type": "string"
                            },
                            "state": {
                                "title": "State",
                                "type": "string",
                                "enum": ["AL", "AK", "AS", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FM", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MH", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PW", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VI", "VA", "WA", "WV", "WI", "WY"]
                            },
                            "zip": {
                                "title": "Zip Code",
                                "type": "string",
                                "pattern": /^(\d{5}(-\d{4})?)?$/
                            }
                        }
                    };
                    Alpaca.merge(this.options, {
                        "fields": {
                            "zip": {
                                "maskString": "99999",
                                "size": 5
                            },
                            "state": {
                                "optionLabels": ["ALABAMA", "ALASKA", "AMERICANSAMOA", "ARIZONA", "ARKANSAS", "CALIFORNIA", "COLORADO", "CONNECTICUT", "DELAWARE", "DISTRICTOFCOLUMBIA", "FEDERATEDSTATESOFMICRONESIA", "FLORIDA", "GEORGIA", "GUAM", "HAWAII", "IDAHO", "ILLINOIS", "INDIANA", "IOWA", "KANSAS", "KENTUCKY", "LOUISIANA", "MAINE", "MARSHALLISLANDS", "MARYLAND", "MASSACHUSETTS", "MICHIGAN", "MINNESOTA", "MISSISSIPPI", "MISSOURI", "MONTANA", "NEBRASKA", "NEVADA", "NEWHAMPSHIRE", "NEWJERSEY", "NEWMEXICO", "NEWYORK", "NORTHCAROLINA", "NORTHDAKOTA", "NORTHERNMARIANAISLANDS", "OHIO", "OKLAHOMA", "OREGON", "PALAU", "PENNSYLVANIA", "PUERTORICO", "RHODEISLAND", "SOUTHCAROLINA", "SOUTHDAKOTA", "TENNESSEE", "TEXAS", "UTAH", "VERMONT", "VIRGINISLANDS", "VIRGINIA", "WASHINGTON", "WESTVIRGINIA", "WISCONSIN", "WYOMING"]
                            }
                        }
                    });
    
                    if (Alpaca.isEmpty(this.options.addressValidation)) {
                        this.options.addressValidation = true;
                    }
                },
    
                /**
                 * @see Alpaca.Field#isContainer
                 */
                isContainer: function () {
                    return false;
                },
    
                /**
                 * Returns address in a single line string.
                 *
                 * @returns {String} Address as a single line string.
                 */
                getAddress: function () {
                    var value = this.getValue();
                    if (this.view.type === "view") {
                        value = this.data;
                    }
                    var address = "";
                    if (value) {
                        if (value.street) {
                            $.each(value.street, function (index, value) {
                                address += value + " ";
                            });
                        }
                        if (value.city) {
                            address += value.city + " ";
                        }
                        if (value.state) {
                            address += value.state + " ";
                        }
                        if (value.zip) {
                            address += value.zip;
                        }
                    }
    
                    return address;
                },
    
                /**
                 * @see Alpaca.Field#afterRenderContainer
                 */
                afterRenderContainer: function (model, callback) {
    
                    var self = this;
    
                    this.base(model, function () {
                        var container = self.getContainerEl();
    
                        // apply additional css
                        $(container).addClass("alpaca-addressfield");
    
                        if (self.options.addressValidation && !self.isDisplayOnly()) {
                            $('<div style="clear:both;"></div>').appendTo(container);
                            var mapButton = $('<div class="alpaca-form-button">Show Google Map</div>').appendTo(container);
                            if (mapButton.button) {
                                mapButton.button({
                                    text: true
                                });
                            }
                            mapButton.on('click', function () {
    
                                if (google && google.maps) {
                                    var geocoder = new google.maps.Geocoder();
                                    var address = self.getAddress();
                                    if (geocoder) {
                                        geocoder.geocode({
                                            'address': address
                                        }, function (results, status) {
                                            if (status === google.maps.GeocoderStatus.OK) {
                                                var mapCanvasId = self.getId() + "-map-canvas";
                                                if ($('#' + mapCanvasId).length === 0) {
                                                    $("<div id='" + mapCanvasId + "' class='alpaca-field-address-mapcanvas'></div>").appendTo(self.getFieldEl());
                                                }
    
                                                var map = new google.maps.Map(document.getElementById(self.getId() + "-map-canvas"), {
                                                    "zoom": 10,
                                                    "center": results[0].geometry.location,
                                                    "mapTypeId": google.maps.MapTypeId.ROADMAP
                                                });
    
                                                var marker = new google.maps.Marker({
                                                    map: map,
                                                    position: results[0].geometry.location
                                                });
    
                                            }
                                            else {
                                                self.displayMessage("Geocoding failed: " + status);
                                            }
                                        });
                                    }
    
                                }
                                else {
                                    self.displayMessage("Google Map API is not installed.");
                                }
                            }).wrap('<small/>');
    
                            if (self.options.showMapOnLoad) {
                                mapButton.trigger('click');
                            }
                        }
    
                        callback();
    
                    });
                },
    
                /**
                 * @see Alpaca.Fields.ObjectField#getType
                 */
                getType: function () {
                    return "any";
                }
    
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.ObjectField#getTitle
                 */
                getTitle: function () {
                    return "Address";
                },
    
                /**
                 * @see Alpaca.Fields.ObjectField#getDescription
                 */
                getDescription: function () {
                    return "Standard US Address with Street, City, State and Zip. Also comes with support for Google map.";
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.ObjectField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "validateAddress": {
                                "title": "Address Validation",
                                "description": "Enable address validation if true",
                                "type": "boolean",
                                "default": true
                            },
                            "showMapOnLoad": {
                                "title": "Whether to show the map when first loaded",
                                "type": "boolean"
                            }
                        }
                    });
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.ObjectField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "validateAddress": {
                                "helper": "Address validation if checked",
                                "rightLabel": "Enable Google Map for address validation?",
                                "type": "checkbox"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("address", Alpaca.Fields.AddressField);

    })(jQuery);

    (function($) {
        
        Alpaca.Fields.CKEditorField = Alpaca.Fields.TextAreaField.extend(
            /**
             * @lends Alpaca.Fields.CKEditorField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextAreaField#getFieldType
                 */
                getFieldType: function () {
                    return "ckeditor";
                },
    
                /**
                 * @see Alpaca.Fields.TextAreaField#setup
                 */
                setup: function () {
                    if (!this.data) {
                        this.data = "";
                    }
    
                    this.base();
    
                    if (typeof (this.options.ckeditor) == "undefined") {
                        this.options.ckeditor = {};
                    }
                },
    
                afterRenderControl: function (model, callback) {
                    var self = this;
    
                    this.base(model, function () {
    
                        // see if we can render CK Editor
                        if (!self.isDisplayOnly() && self.control && typeof (CKEDITOR) !== "undefined") {
                            // use a timeout because CKEditor has some odd timing dependencies
                            setTimeout(function () {
    
                                self.editor = CKEDITOR.replace($(self.control)[0], self.options.ckeditor);
    
                            }, 500);
                        }
    
                        // if the ckeditor's dom element gets destroyed, make sure we clean up the editor instance
                        $(self.control).on('destroyed', function () {
    
                            if (self.editor) {
                                self.editor.removeAllListeners();
                                self.editor.destroy(false);
                                self.editor = null;
                            }
    
                        });
    
                        callback();
                    });
                },
    
                initControlEvents: function () {
                    var self = this;
    
                    setTimeout(function () {
    
                        // click event
                        self.editor.on("click", function (e) {
                            self.onClick.call(self, e);
                            self.trigger("click", e);
                        });
    
                        // change event
                        self.editor.on("change", function (e) {
                            self.onChange();
                            self.triggerWithPropagation("change", e);
                        });
    
                        // blur event
                        self.editor.on('blur', function (e) {
                            self.onBlur();
                            self.trigger("blur", e);
                        });
    
                        // focus event
                        self.editor.on("focus", function (e) {
                            self.onFocus.call(self, e);
                            self.trigger("focus", e);
                        });
    
                        // keypress event
                        self.editor.on("key", function (e) {
                            self.onKeyPress.call(self, e);
                            self.trigger("keypress", e);
                        });
    
                        // NOTE: these do not seem to work with CKEditor?
                        /*
                        // keyup event
                        self.editor.on("keyup", function(e) {
                            self.onKeyUp.call(self, e);
                            self.trigger("keyup", e);
                        });
        
                        // keydown event
                        self.editor.on("keydown", function(e) {
                            self.onKeyDown.call(self, e);
                            self.trigger("keydown", e);
                        });
                        */
    
                    }, 525); // NOTE: odd timing dependencies
                },
    
                setValue: function (value) {
                    var self = this;
    
                    // be sure to call into base method
                    this.base(value);
    
                    if (self.editor) {
                        self.editor.setData(value);
                    }
                },
    
                getValue: function () {
                    var self = this;
    
                    var value = this.base();
    
                    if (self.editor) {
                        value = self.editor.getData();
                    }
    
                    return value;
                },
    
                /**
                 * @see Alpaca.Field#destroy
                 */
                destroy: function () {
                    // destroy the plugin instance
                    if (this.editor) {
                        this.editor.destroy();
                        this.editor = null;
                    }
    
                    // call up to base method
                    this.base();
                }
    
                /* builder_helpers */
    
                /**
                 * @see Alpaca.Fields.TextAreaField#getTitle
                 */
                ,
                getTitle: function () {
                    return "CK Editor";
                },
    
                /**
                 * @see Alpaca.Fields.TextAreaField#getDescription
                 */
                getDescription: function () {
                    return "Provides an instance of a CK Editor control for use in editing HTML.";
                },
    
                /**
                 * @private
                 * @see Alpaca.ControlField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "ckeditor": {
                                "title": "CK Editor options",
                                "description": "Use this entry to provide configuration options to the underlying CKEditor plugin.",
                                "type": "any"
                            }
                        }
                    });
                },
    
                /**
                 * @private
                 * @see Alpaca.ControlField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "ckeditor": {
                                "type": "any"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("ckeditor", Alpaca.Fields.CKEditorField);

        
    })(jQuery);

    (function($) {
        
        Alpaca.CloudCmsConnector = Alpaca.Connector.extend(
            /**
             * @lends Alpaca.CloudCmsConnector.prototype
             */
            {
                /**
                 * Makes initial connections to data source.
                 *
                 * @param {Function} onSuccess onSuccess callback.
                 * @param {Function} onError onError callback.
                 */
                connect: function (onSuccess, onError) {
                    var self = this;
    
                    Gitana.connect(this.config, function (err) {
    
                        if (err) {
                            onError(err);
                            return;
                        }
    
                        self.gitana = this;
    
                        self.gitana.datastore("content").readBranch("master").then(function () {
    
                            self.branch = this;
    
                            onSuccess();
                        });
                    });
                },
    
                /**
                 * Loads data from Cloud CMS.
                 *
                 * @param {String} nodeId the node id to load
                 * @param {Function} onSuccess onSuccess callback
                 * @param {Function} onError onError callback
                 */
                loadData: function (nodeId, successCallback, errorCallback) {
                    Chain(this.branch).trap(function (err) {
                        errorCallback(err);
                        return false;
                    }).readNode(nodeId).then(function () {
    
                        var obj = JSON.parse(JSON.stringify(this));
    
                        successCallback(obj);
                    });
                },
    
                /**
                 * Loads json schema from Cloud CMS.
                 *
                 * @param {Object|String} qname the definition qname to load
                 * @param {Function} onSuccess onSuccess callback.
                 * @param {Function} onError onError callback.
                 */
                loadSchema: function (qname, successCallback, errorCallback) {
                    Chain(this.branch).trap(function (err) {
                        errorCallback(err);
                        return false;
                    }).readDefinition(qname).then(function () {
    
                        var obj = JSON.parse(JSON.stringify(this));
    
                        successCallback(obj);
                    });
                },
    
                /**
                 * Loads json options from Cloud CMS.
                 *
                 * @param {Object|String} formNodeId the form to load
                 * @param {Function} onSuccess onSuccess callback.
                 * @param {Function} onError onError callback.
                 */
                loadOptions: function (formNodeId, successCallback, errorCallback) {
                    Chain(this.branch).trap(function (err) {
                        errorCallback(err);
                        return false;
                    }).readNode(formNodeId).then(function () {
    
                        var obj = JSON.parse(JSON.stringify(this));
    
                        successCallback(obj);
                    });
                },
    
                /**
                 * Loads a referenced JSON schema by it's qname from Cloud CMS.
                 *
                 * @param {Object|String} qname schema to load
                 * @param {Function} onSuccess onSuccess callback.
                 * @param {Function} onError onError callback.
                 */
                loadReferenceSchema: function (qname, successCallback, errorCallback) {
                    Chain(this.branch).trap(function (err) {
                        errorCallback(err);
                        return false;
                    }).readDefinition(qname).then(function () {
    
                        var obj = JSON.parse(JSON.stringify(this));
    
                        successCallback(obj);
                    });
                },
    
                /**
                 * Loads referenced JSON options by it's form key from Cloud CMS.
                 *
                 * @param {Object|String} formKey form to load.
                 * @param {Function} onSuccess onSuccess callback.
                 * @param {Function} onError onError callback.
                 */
                loadReferenceOptions: function (formKey, successCallback, errorCallback) {
                    successCallback({});
                }
    
            });
    
        Alpaca.registerConnectorClass("cloudcms", Alpaca.CloudCmsConnector);
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.ColorField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.ColorField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#setup
                 */
                setup: function () {
                    // default html5 input type = "color";
                    this.inputType = "color";
    
                    this.base();
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "color";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getType
                 */
                getType: function () {
                    return "string";
                },
    
                /* builder_helpers */
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Color Field";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "A color picker for selecting hexadecimal color values";
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("color", Alpaca.Fields.ColorField);
        Alpaca.registerDefaultSchemaFieldMapping("color", "color");
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.CountryField = Alpaca.Fields.SelectField.extend(
            /**
             * @lends Alpaca.Fields.CountryField.prototype
             */
            {
                /**
                 * @see Alpaca.Field#getFieldType
                 */
                getFieldType: function () {
                    return "country";
                },
    
                /**
                 * @see Alpaca.Fields.Field#setup
                 */
                setup: function () {
                    // defaults
                    if (Alpaca.isUndefined(this.options.capitalize)) {
                        this.options.capitalize = false;
                    }
    
                    this.schema["enum"] = [];
                    this.options.optionLabels = [];
    
                    var countriesMap = this.getMessage("countries");
                    if (countriesMap) {
                        for (var countryKey in countriesMap) {
                            this.schema["enum"].push(countryKey);
    
                            var label = countriesMap[countryKey];
                            if (this.options.capitalize) {
                                label = label.toUpperCase();
                            }
    
                            this.options.optionLabels.push(label);
                        }
                    }
    
                    this.base();
                }
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Country Field";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "Provides a dropdown selector of countries keyed by their ISO3 code.  The names of the countries are read from the I18N bundle for the current locale.";
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
    
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "capitalize": {
                                "title": "Capitalize",
                                "description": "Whether the values should be capitalized",
                                "type": "boolean",
                                "default": false,
                                "readonly": true
                            }
                        }
                    });
    
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "capitalize": {
                                "type": "checkbox"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("country", Alpaca.Fields.CountryField);
        Alpaca.registerDefaultFormatFieldMapping("country", "country");
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.EmailField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.EmailField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "email";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#setup
                 */
                setup: function () {
                    // default html5 input type = "email";
                    this.inputType = "email";
    
                    this.base();
    
                    if (!this.schema.pattern) {
                        this.schema.pattern = Alpaca.regexps.email;
                    }
                },
    
                /**
                 * @see Alpaca.Fields.TextField#handleValidate
                 */
                handleValidate: function () {
                    var baseStatus = this.base();
    
                    var valInfo = this.validation;
    
                    if (!valInfo["invalidPattern"]["status"]) {
                        valInfo["invalidPattern"]["message"] = this.getMessage("invalidEmail");
                    }
    
                    return baseStatus;
                }
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Email Field";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "Email Field.";
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getSchemaOfSchema
                 */
                getSchemaOfSchema: function () {
                    var pattern = (this.schema && this.schema.pattern) ? this.schema.pattern : Alpaca.regexps.email;
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "pattern": {
                                "title": "Pattern",
                                "description": "Field Pattern in Regular Expression",
                                "type": "string",
                                "default": pattern,
                                "enum": [pattern],
                                "readonly": true
                            },
                            "format": {
                                "title": "Format",
                                "description": "Property data format",
                                "type": "string",
                                "default": "email",
                                "enum": ["email"],
                                "readonly": true
                            }
                        }
                    });
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getOptionsForSchema
                 */
                getOptionsForSchema: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "format": {
                                "type": "text"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerMessages({
            // Removed format from error message (according to new specifications :  the format will
            // be in the placeholder of email field).
            //"invalidEmail": "Invalid Email address e.g. info@cloudcms.com"
    
            "invalidEmail": lang.invalidEmail
        });
        Alpaca.registerFieldClass("email", Alpaca.Fields.EmailField);
        Alpaca.registerDefaultFormatFieldMapping("email", "email");
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.PersonalNameField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.PersonalNameField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "personalname";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#setValue
                 */
                setValue: function (val) {
                    var upperValue = "";
    
                    for (var i = 0; i < val.length; i++) {
                        if (i === 0) {
                            upperValue += val.charAt(i).toUpperCase();
                        }
                        else if (val.charAt(i - 1) === ' ' || val.charAt(i - 1) === '-' || val.charAt(i - 1) === "'") {
                            upperValue += val.charAt(i).toUpperCase();
                        }
                        else {
                            upperValue += val.charAt(i);
                        }
                    }
    
                    if (upperValue != this.getValue()) // jshint ignore:line
                    {
                        this.base(upperValue);
                    }
                },
    
                /**
                 * @see Alpaca.ControlField#onKeyPress
                 */
                onKeyPress: function (e) {
                    this.base(e);
    
                    var _this = this;
    
                    Alpaca.later(25, this, function () {
                        var v = _this.getValue();
                        _this.setValue(v);
                    });
    
                }
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Personal Name";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "Text Field for personal name with captical letter for first letter & after hyphen, space or apostrophe.";
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("personalname", Alpaca.Fields.PersonalNameField);
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.CurrencyField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.CurrencyField.prototype
             */
            {
                /**
                 * @constructs
                 * @augments Alpaca.Fields.TextField
                 *
                 * @class Currency Control
                 *
                 * @param {Object} container Field container.
                 * @param {Any} data Field data.
                 * @param {Object} options Field options.
                 * @param {Object} schema Field schema.
                 * @param {Object|String} view Field view.
                 * @param {Alpaca.Connector} connector Field connector.
                 * @param {Function} errorCallback Error callback.
                 */
                constructor: function (container, data, options, schema, view, connector, errorCallback) {
                    options = options || {};
    
                    var pfOptionsSchema = this.getSchemaOfPriceFormatOptions().properties;
                    for (var i in pfOptionsSchema) {
                        var option = pfOptionsSchema[i];
                        if (!(i in options)) {
                            options[i] = option["default"] || undefined;
                        }
                    }
    
                    if (typeof (data) !== "undefined") {
                        data = "" + parseFloat(data).toFixed(options.centsLimit);
                    }
    
                    this.base(container, data, options, schema, view, connector, errorCallback);
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "currency";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#postRender
                 */
                afterRenderControl: function (model, callback) {
    
                    var self = this;
    
                    var field = this.getControlEl();
    
                    this.base(model, function () {
    
                        $(field).priceFormat(self.options);
    
                        callback();
    
                    });
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getValue
                 */
                getValue: function () {
    
                    var field = this.getControlEl();
    
                    var val = $(field).is('input') ? field.val() : field.hmtl();
                    if (this.options.unmask || this.options.round !== "none") {
                        var unmasked = function () {
                            var result = '';
                            for (var i in val) {
                                var cur = val[i];
                                if (!isNaN(cur)) {
                                    result += cur;
                                } else if (cur === this.options.centsSeparator) {
                                    result += '.';
                                }
                            }
                            return parseFloat(result);
                        }.bind(this)();
                        if (this.options.round !== "none") {
                            unmasked = round(this.options.round)(unmasked);
                            if (!this.options.unmask) {
                                var result = [];
                                var unmaskedString = "" + unmasked;
                                for (var i = 0, u = 0; i < val.length; i++) {
                                    if (!isNaN(val[i])) {
                                        result.push(unmaskedString[u++] || 0);
                                    } else {
                                        result.push(val[i]);
                                    }
                                }
                                return result.join('');
                            }
                        }
                        return unmasked;
                    } else {
                        return val;
                    }
                }
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Currency Field";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "Provides an automatically formatted and configurable input for entering currency amounts.";
                },
    
                getSchemaOfPriceFormatOptions: function () {
                    return {
                        "properties": {
                            "allowNegative": {
                                "title": "Allow Negative",
                                "description": "Determines if negative numbers are allowed.",
                                "type": "boolean",
                                "default": false
                            },
                            "centsLimit": {
                                "title": "Cents Limit",
                                "description": "The limit of fractional digits.",
                                "type": "number",
                                "default": 2,
                                "minimum": 0
                            },
                            "centsSeparator": {
                                "title": "Cents Separator",
                                "description": "The separator between whole and fractional amounts.",
                                "type": "text",
                                "default": "."
                            },
                            "clearPrefix": {
                                "title": "Clear Prefix",
                                "description": "Determines if the prefix is cleared on blur.",
                                "type": "boolean",
                                "default": false
                            },
                            "clearSuffix": {
                                "title": "Clear Suffix",
                                "description": "Determines if the suffix is cleared on blur.",
                                "type": "boolean",
                                "default": false
                            },
                            "insertPlusSign": {
                                "title": "Plus Sign",
                                "description": "Determines if a plus sign should be inserted for positive values.",
                                "type": "boolean",
                                "default": false
                            },
                            "limit": {
                                "title": "Limit",
                                "description": "A limit of the length of the field.",
                                "type": "number",
                                "default": undefined,
                                "minimum": 0
                            },
                            "prefix": {
                                "title": "Prefix",
                                "description": "The prefix if any for the field.",
                                "type": "text",
                                "default": "$"
                            },
                            "round": {
                                "title": "Round",
                                "description": "Determines if the field is rounded. (Rounding is done when getValue is called and is not reflected in the UI)",
                                "type": "string",
                                "enum": ["up", "down", "nearest", "none"],
                                "default": "none"
                            },
                            "suffix": {
                                "title": "Suffix",
                                "description": "The suffix if any for the field.",
                                "type": "text",
                                "default": ""
                            },
                            "thousandsSeparator": {
                                "title": "Thousands Separator",
                                "description": "The separator between thousands.",
                                "type": "string",
                                "default": ","
                            },
                            "unmask": {
                                "title": "Unmask",
                                "description": "If true then the resulting value for this field will be unmasked.  That is, the resulting value will be a float instead of a string (with the prefix, suffix, etc. removed).",
                                "type": "boolean",
                                "default": true
                            }
                        }
                    };
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
                    return Alpaca.merge(this.base(), this.getSchemaOfPriceFormatOptions());
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "allowNegative": {
                                "type": "checkbox"
                            },
                            "centsLimit": {
                                "type": "number"
                            },
                            "centsSeparator": {
                                "type": "text"
                            },
                            "clearPrefix": {
                                "type": "checkbox"
                            },
                            "clearSuffix": {
                                "type": "checkbox"
                            },
                            "insertPlusSign": {
                                "type": "checkbox"
                            },
                            "limit": {
                                "type": "number"
                            },
                            "prefix": {
                                "type": "text"
                            },
                            "round": {
                                "type": "select"
                            },
                            "suffix": {
                                "type": "text"
                            },
                            "thousandsSeparator": {
                                "type": "string"
                            },
                            "unmask": {
                                "type": "checkbox"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("currency", Alpaca.Fields.CurrencyField);
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.EditorField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.EditorField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "editor";
                },
    
                setup: function () {
                    var self = this;
    
                    this.base();
    
                    if (!self.options.aceTheme) {
                        self.options.aceTheme = "ace/theme/chrome";
                    }
    
                    if (!self.options.aceMode) {
                        self.options.aceMode = "ace/mode/json";
                    }
    
                    if (typeof (self.options.beautify) == "undefined") {
                        self.options.beautify = true;
                    }
    
                    if (self.options.beautify && this.data) {
                        if (self.options.aceMode === "ace/mode/json") {
                            if (Alpaca.isObject(this.data)) {
                                // convert to string to format it
                                this.data = JSON.stringify(this.data, null, "    ");
                            }
                            else if (Alpaca.isString(this.data)) {
                                // convert to object and then back to string to format it
                                this.data = JSON.stringify(JSON.parse(this.data), null, "    ");
                            }
                        }
    
                        if (self.options.aceMode === "ace/mode/html") {
                            if (typeof (html_beautify) !== "undefined") {
                                this.data = html_beautify(this.data);
                            }
                        }
    
                        if (self.options.aceMode === "ace/mode/css") {
                            if (typeof (css_beautify) !== "undefined") {
                                this.data = css_beautify(this.data);
                            }
                        }
    
                        if (self.options.aceMode === "ace/mode/javascript") {
                            if (typeof (js_beautify) !== "undefined") {
                                this.data = js_beautify(this.data);
                            }
                        }
                    }
    
                    if (self.options.aceMode === "ace/mode/json") {
                        if (!this.data || this.data === "{}") {
                            this.data = "{\n\t\n}";
                        }
                    }
    
                },
    
                /**
                 * @see Alpaca.Fields.TextField#postRender
                 */
                afterRenderControl: function (model, callback) {
                    var self = this;
    
                    this.base(model, function () {
    
                        if (self.control) {
                            // ACE HEIGHT
                            var aceHeight = self.options.aceHeight;
                            if (aceHeight) {
                                $(self.control).css("height", aceHeight);
                            }
    
                            // ACE WIDTH
                            var aceWidth = self.options.aceWidth;
                            if (!aceWidth) {
                                aceWidth = "100%";
                            }
                            $(self.control).css("width", aceWidth);
                        }
    
                        // locate where we will insert the editor
                        var el = $(self.control)[0];
    
                        // ace must be included ahead of time
                        if (!ace && window.ace) {
                            ace = window.ace;
                        }
    
                        if (!ace) {
                            Alpaca.logError("Editor Field is missing the 'ace' Cloud 9 Editor");
                        }
                        else {
                            self.editor = ace.edit(el);
                            self.editor.setOptions({
                                maxLines: Infinity
                            });
    
                            self.editor.getSession().setUseWrapMode(true);
    
                            // theme
                            var aceTheme = self.options.aceTheme;
                            self.editor.setTheme(aceTheme);
    
                            // mode
                            var aceMode = self.options.aceMode;
                            self.editor.getSession().setMode(aceMode);
    
                            self.editor.renderer.setHScrollBarAlwaysVisible(false);
                            //this.editor.renderer.setVScrollBarAlwaysVisible(false); // not implemented
                            self.editor.setShowPrintMargin(false);
    
                            // set data onto editor
                            self.editor.setValue(self.data);
                            self.editor.clearSelection();
    
                            // clear undo session
                            self.editor.getSession().getUndoManager().reset();
    
                            // FIT-CONTENT the height of the editor to the contents contained within
                            if (self.options.aceFitContentHeight) {
                                var heightUpdateFunction = function () {
    
                                    var first = false;
                                    if (self.editor.renderer.lineHeight === 0) {
                                        first = true;
                                        self.editor.renderer.lineHeight = 16;
                                    }
    
                                    // http://stackoverflow.com/questions/11584061/
                                    var newHeight = self.editor.getSession().getScreenLength() * self.editor.renderer.lineHeight + self.editor.renderer.scrollBar.getWidth();
    
                                    $(self.control).height(newHeight.toString() + "px");
    
                                    // This call is required for the editor to fix all of
                                    // its inner structure for adapting to a change in size
                                    self.editor.resize();
    
                                    if (first) {
                                        window.setTimeout(function () {
                                            self.editor.clearSelection();
                                        }, 100);
                                    }
                                };
    
                                // Set initial size to match initial content
                                heightUpdateFunction();
    
                                // Whenever a change happens inside the ACE editor, update
                                // the size again
                                self.editor.getSession().on('change', heightUpdateFunction);
                            }
    
                            // READONLY
                            if (self.schema.readonly) {
                                self.editor.setReadOnly(true);
                            }
    
                            // if the editor's dom element gets destroyed, make sure we clean up the editor instance
                            // normally, we expect Alpaca fields to be destroyed by the destroy() method but they may also be
                            // cleaned-up via the DOM, thus we check here.
                            $(el).on('destroyed', function () {
    
                                if (self.editor) {
                                    self.editor.destroy();
                                    self.editor = null;
                                }
    
                            });
                        }
    
                        callback();
                    });
    
                },
    
                /**
                 * @see Alpaca.Field#destroy
                 */
                destroy: function () {
                    // destroy the editor instance
                    if (this.editor) {
                        this.editor.destroy();
                        this.editor = null;
                    }
    
                    // call up to base method
                    this.base();
                },
    
                /**
                 * @return the ACE editor instance
                 */
                getEditor: function () {
                    return this.editor;
                },
    
                /**
                 * @see Alpaca.ControlField#handleValidate
                 */
                handleValidate: function () {
                    var baseStatus = this.base();
    
                    var valInfo = this.validation;
    
                    var wordCountStatus = this._validateWordCount();
                    valInfo["wordLimitExceeded"] = {
                        "message": wordCountStatus ? "" : Alpaca.substituteTokens(this.getMessage("wordLimitExceeded"), [this.options.wordlimit]),
                        "status": wordCountStatus
                    };
    
                    var editorAnnotationsStatus = this._validateEditorAnnotations();
                    valInfo["editorAnnotationsExist"] = {
                        "message": editorAnnotationsStatus ? "" : this.getMessage("editorAnnotationsExist"),
                        "status": editorAnnotationsStatus
                    };
    
                    return baseStatus && valInfo["wordLimitExceeded"]["status"] && valInfo["editorAnnotationsExist"]["status"];
                },
    
                _validateEditorAnnotations: function () {
                    if (this.editor) {
                        var annotations = this.editor.getSession().getAnnotations();
                        if (annotations && annotations.length > 0) {
                            return false;
                        }
                    }
    
                    return true;
                },
    
                /**
                 * Validate for word limit.
                 *
                 * @returns {Boolean} True if the number of words is equal to or less than the word limit.
                 */
                _validateWordCount: function () {
                    if (this.options.wordlimit && this.options.wordlimit > -1) {
                        var val = this.editor.getValue();
    
                        if (val) {
                            var wordcount = val.split(" ").length;
                            if (wordcount > this.options.wordlimit) {
                                return false;
                            }
                        }
                    }
    
                    return true;
                },
    
                /**
                 * Force editor to resize to ensure it gets drawn correctly.
                 * @override
                 */
                onDependentReveal: function () {
                    if (this.editor) {
                        this.editor.resize();
                    }
                },
    
                /**
                 *@see Alpaca.Fields.TextField#setValue
                 */
                setValue: function (value) {
                    var self = this;
    
                    if (this.editor) {
                        if (self.schema.type == "object" && Alpaca.isObject(value)) {
                            // format
                            value = JSON.stringify(value, null, "    ");
                        }
    
                        this.editor.setValue(value);
                        self.editor.clearSelection();
                    }
    
                    // be sure to call into base method
                    this.base(value);
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getValue
                 */
                getValue: function () {
                    var value = null;
    
                    if (this.editor) {
                        value = this.editor.getValue();
                    }
    
                    // if expected type back is "object", we do the conversion
                    if (this.schema.type == "object") {
                        if (!value) {
                            value = {};
                        }
                        else {
                            value = JSON.parse(value);
                        }
                    }
    
                    return value;
                }
    
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Editor";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "Editor";
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "aceTheme": {
                                "title": "ACE Editor Theme",
                                "description": "Specifies the theme to set onto the editor instance",
                                "type": "string",
                                "default": "ace/theme/twilight"
                            },
                            "aceMode": {
                                "title": "ACE Editor Mode",
                                "description": "Specifies the mode to set onto the editor instance",
                                "type": "string",
                                "default": "ace/mode/javascript"
                            },
                            "aceWidth": {
                                "title": "ACE Editor Height",
                                "description": "Specifies the width of the wrapping div around the editor",
                                "type": "string",
                                "default": "100%"
                            },
                            "aceHeight": {
                                "title": "ACE Editor Height",
                                "description": "Specifies the height of the wrapping div around the editor",
                                "type": "string",
                                "default": "300px"
                            },
                            "aceFitContentHeight": {
                                "title": "ACE Fit Content Height",
                                "description": "Configures the ACE Editor to auto-fit its height to the contents of the editor",
                                "type": "boolean",
                                "default": false
                            },
                            "wordlimit": {
                                "title": "Word Limit",
                                "description": "Limits the number of words allowed in the text area.",
                                "type": "number",
                                "default": -1
                            }
                        }
                    });
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "aceTheme": {
                                "type": "text"
                            },
                            "aceMode": {
                                "type": "text"
                            },
                            "wordlimit": {
                                "type": "integer"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
    
            });
    
        Alpaca.registerMessages({
            "wordLimitExceeded": "The maximum word limit of {0} has been exceeded.",
            "editorAnnotationsExist": "The editor has errors in it that must be corrected"
        });

        Alpaca.registerFieldClass("editor", Alpaca.Fields.EditorField);
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.IPv4Field = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.IPv4Field.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "ipv4";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#setup
                 */
                setup: function () {
                    this.base();
    
                    if (!this.schema.pattern) {
                        this.schema.pattern = Alpaca.regexps.ipv4;
                    }
                },
    
                /**
                 * @see Alpaca.Fields.TextField#handleValidate
                 */
                handleValidate: function () {
                    var baseStatus = this.base();
    
                    var valInfo = this.validation;
    
                    if (!valInfo["invalidPattern"]["status"]) {
                        valInfo["invalidPattern"]["message"] = this.getMessage("invalidIPv4");
                    }
    
                    return baseStatus;
                }
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "IP Address Field";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "IP Address Field.";
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getSchemaOfSchema
                 */
                getSchemaOfSchema: function () {
                    var pattern = (this.schema && this.schema.pattern) ? this.schema.pattern : Alpaca.regexps.ipv4;
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "pattern": {
                                "title": "Pattern",
                                "description": "Field Pattern in Regular Expression",
                                "type": "string",
                                "default": pattern,
                                "readonly": true
                            },
                            "format": {
                                "title": "Format",
                                "description": "Property data format",
                                "type": "string",
                                "enum": ["ip-address"],
                                "default": "ip-address",
                                "readonly": true
                            }
                        }
                    });
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getOptionsForSchema
                 */
                getOptionsForSchema: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "format": {
                                "type": "text"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerMessages({
            "invalidIPv4": lang.invalidIPv4
        });
        Alpaca.registerFieldClass("ipv4", Alpaca.Fields.IPv4Field);
        Alpaca.registerDefaultFormatFieldMapping("ip-address", "ipv4");
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.GridField = Alpaca.Fields.ArrayField.extend(
            /**
             * @lends Alpaca.Fields.GridField.prototype
             */
            {
                /**
                 * @see Alpaca.ControlField#getFieldType
                 */
                getFieldType: function () {
                    return "grid";
                },
    
                setup: function () {
                    this.base();
    
                    if (typeof (this.options.grid) == "undefined") {
                        this.options.grid = {};
                    }
                },
    
                afterRenderContainer: function (model, callback) {
                    var self = this;
    
                    this.base(model, function () {
    
                        // convert the data array into the grid's expected format
                        var gridData = [];
    
                        // add in headers
                        var headers = [];
                        for (var key in self.options.fields) {
                            var fieldDefinition = self.options.fields[key];
    
                            var label = key;
                            if (fieldDefinition.label) {
                                label = fieldDefinition.label;
                            }
    
                            headers.push(label);
                        }
                        gridData.push(headers);
    
                        for (var i = 0; i < self.data.length; i++) {
                            var row = [];
                            for (var key2 in self.data[i]) {
                                row.push(self.data[i][key2]);
                            }
                            gridData.push(row);
                        }
    
                        /*
                        // TODO
                        var gridData = [
                            ["Maserati", "Mazda", "Mercedes", "Mini", "Mitsubishi"],
                            ["2009", 0, 2941, 4303, 354, 5814],
                            ["2010", 5, 2905, 2867, 412, 5284],
                            ["2011", 4, 2517, 4822, 552, 6127],
                            ["2012", 2, 2422, 5399, 776, 4151]
                        ];
                        */
    
                        var holder = $(self.container).find(".alpaca-container-grid-holder");
    
                        var gridConfig = self.options.grid;
                        gridConfig.data = gridData;
    
                        $(holder).handsontable(gridConfig);
    
                        callback();
                    });
                },
    
                /**
                 * @see Alpaca.ControlField#getType
                 */
                getType: function () {
                    return "array";
                }
    
                /* builder_helpers */
                ,
    
                /**
                 * @see Alpaca.ControlField#getTitle
                 */
                getTitle: function () {
                    return "Grid Field";
                },
    
                /**
                 * @see Alpaca.ControlField#getDescription
                 */
                getDescription: function () {
                    return "Renders array items into a grid";
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("grid", Alpaca.Fields.GridField);
        
    })(jQuery);

    (function($) {
        
        Alpaca.usHoldings = {};

    Alpaca.usHoldings.territories = {
        "American Samoa": "AS",
        "District Of Columbia": "DC",
        "Federated States Of Micronesia": "FM",
        "Guam": "GU",
        "Marshall Islands": "MH",
        "Northern Mariana Islands": "MP",
        "Palau": "PW",
        "Puerto Rico": "PR",
        "Virgin Islands": "VI"
    };

    Alpaca.usHoldings.states = {
        "Alabama": "AL",
        "Alaska": "AK",
        "Arizona": "AZ",
        "Arkansas": "AR",
        "California": "CA",
        "Colorado": "CO",
        "Connecticut": "CT",
        "Delaware": "DE",
        "Florida": "FL",
        "Georgia": "GA",
        "Hawaii": "HI",
        "Idaho": "ID",
        "Illinois": "IL",
        "Indiana": "IN",
        "Iowa": "IA",
        "Kansas": "KS",
        "Kentucky": "KY",
        "Louisiana": "LA",
        "Maine": "ME",
        "Maryland": "MD",
        "Massachusetts": "MA",
        "Michigan": "MI",
        "Minnesota": "MN",
        "Mississippi": "MS",
        "Missouri": "MO",
        "Montana": "MT",
        "Nebraska": "NE",
        "Nevada": "NV",
        "New Hampshire": "NH",
        "New Jersey": "NJ",
        "New Mexico": "NM",
        "New York": "NY",
        "North Carolina": "NC",
        "North Dakota": "ND",
        "Ohio": "OH",
        "Oklahoma": "OK",
        "Oregon": "OR",
        "Pennsylvania": "PA",
        "Rhode Island": "RI",
        "South Carolina": "SC",
        "South Dakota": "SD",
        "Tennessee": "TN",
        "Texas": "TX",
        "Utah": "UT",
        "Vermont": "VT",
        "Virginia": "VA",
        "Washington": "WA",
        "West Virginia": "WV",
        "Wisconsin": "WI",
        "Wyoming": "WY"
    };

    Alpaca.Fields.StateField = Alpaca.Fields.SelectField.extend(
        /**
         * @lends Alpaca.Fields.StateField.prototype
         */
        {
            /**
             * @see Alpaca.Fields.TextField#getFieldType
             */
            getFieldType: function () {
                return "state";
            },

            /**
             * @see Alpaca.Fields.TextField#setup
             */
            setup: function () {
                // defaults
                if (Alpaca.isUndefined(this.options.capitalize)) {
                    this.options.capitalize = false;
                }
                if (Alpaca.isUndefined(this.options.includeStates)) {
                    this.options.includeStates = true;
                }
                if (Alpaca.isUndefined(this.options.includeTerritories)) {
                    this.options.includeTerritories = true;
                }
                if (Alpaca.isUndefined(this.options.format)) {
                    this.options.format = "name";
                }

                // validate settings
                if (this.options.format === "name" || this.options.format === "code") {
                    // valid formats
                }
                else {
                    Alpaca.logError("The configured state format: " + this.options.format + " is not a legal value [name, code]");

                    // default to name format
                    this.options.format = "name";
                }

                // configure
                var holdings = Alpaca.retrieveUSHoldings(
                    this.options.includeStates,
                    this.options.includeTerritories,
                    (this.options.format === "code"),
                    this.options.capitalize);

                this.schema["enum"] = holdings.keys;
                this.options.optionLabels = holdings.values;

                this.base();
            }


            /* builder_helpers */
            ,

            /**
             * @see Alpaca.Fields.TextField#getTitle
             */
            getTitle: function () {
                return "State Field";
            },

            /**
             * @see Alpaca.Fields.TextField#getDescription
             */
            getDescription: function () {
                return "Provides a dropdown selector of states and/or territories in the United States, keyed by their two-character code.";
            },

            /**
             * @private
             * @see Alpaca.Fields.TextField#getSchemaOfOptions
             */
            getSchemaOfOptions: function () {

                return Alpaca.merge(this.base(), {
                    "properties": {
                        "format": {
                            "title": "Format",
                            "description": "How to represent the state values in the selector",
                            "type": "string",
                            "default": "name",
                            "enum": ["name", "code"],
                            "readonly": true
                        },
                        "capitalize": {
                            "title": "Capitalize",
                            "description": "Whether the values should be capitalized",
                            "type": "boolean",
                            "default": false,
                            "readonly": true
                        },
                        "includeStates": {
                            "title": "Include States",
                            "description": "Whether to include the states of the United States",
                            "type": "boolean",
                            "default": true,
                            "readonly": true
                        },
                        "includeTerritories": {
                            "title": "Include Territories",
                            "description": "Whether to include the territories of the United States",
                            "type": "boolean",
                            "default": true,
                            "readonly": true
                        }
                    }
                });

            },

            /**
             * @private
             * @see Alpaca.Fields.TextField#getOptionsForOptions
             */
            getOptionsForOptions: function () {
                return Alpaca.merge(this.base(), {
                    "fields": {
                        "format": {
                            "type": "text"
                        },
                        "capitalize": {
                            "type": "checkbox"
                        },
                        "includeStates": {
                            "type": "checkbox"
                        },
                        "includeTerritories": {
                            "type": "checkbox"
                        }
                    }
                });
            }

            /* end_builder_helpers */
        });

    Alpaca.registerFieldClass("state", Alpaca.Fields.StateField);
    Alpaca.registerDefaultFormatFieldMapping("state", "state");

    /**
     * Helper function to retrieve the holdings of US states and territories.
     *
     * @param {Boolean} includeStates whether to include US states
     * @param {Boolean} includeTerritories whether to include US territories
     * @param {Boolean} codeValue whether to hand back US holding codes (instead of names)
     * @param {Boolean} capitalize whether to capitalize the values handed back
     *
     * @returns {Object} an object containing "keys" and "values", both of which are arrays.
     */
    Alpaca.retrieveUSHoldings = (function () {
        return function (includeStates, includeTerritories, codeValue, capitalize) {
            var res = {
                keys: [],
                values: []
            };
            var opts = $.extend(
                {},
                includeStates ? Alpaca.usHoldings.states : {},
                includeTerritories ? Alpaca.usHoldings.territories : {}
            );
            var sorted = Object.keys(opts);
            sorted.sort();
            for (var i in sorted) {
                var state = sorted[i];
                var key = opts[state];
                var value = codeValue ? key : state;
                if (capitalize) {
                    value = value.toUpperCase();
                }
                res.keys.push(key);
                res.values.push(value);
            }
            return res;
        };
    })();
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.TinyMCEField = Alpaca.Fields.TextAreaField.extend(
            /**
             * @lends Alpaca.Fields.tinyMCEField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextAreaField#getFieldType
                 */
                getFieldType: function () {
                    return "tinymce";
                },
    
                /**
                 * @see Alpaca.Fields.TextAreaField#setup
                 */
                setup: function () {
                    var self = this;
    
                    if (!this.data) {
                        this.data = "";
                    }
    
                    if (!self.options.toolbar) {
                        self.options.toolbar = "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image";
                    }
    
                    this.base();
                },
    
                setValue: function (value) {
                    var self = this;
    
                    // be sure to call into base method
                    this.base(value);
    
                    if (self.editor) {
                        self.editor.setContent(value);
                    }
                },
    
                getValue: function () {
                    var self = this;
    
                    var returnVal = null;
    
                    if (self.editor) {
                        returnVal = self.editor.getContent()
                    }
    
                    return returnVal;
                },
    
                initControlEvents: function () {
                    var self = this;
    
                    setTimeout(function () {
    
                        // click event
                        self.editor.on("click", function (e) {
                            self.onClick.call(self, e);
                            self.trigger("click", e);
                        });
    
                        // change event
                        self.editor.on("change", function (e) {
                            self.onChange();
                            self.triggerWithPropagation("change", e);
                        });
    
                        // blur event
                        self.editor.on('blur', function (e) {
                            self.onBlur();
                            self.trigger("blur", e);
                        });
    
                        // focus event
                        self.editor.on("focus", function (e) {
                            self.onFocus.call(self, e);
                            self.trigger("focus", e);
                        });
    
                        // keypress event
                        self.editor.on("keypress", function (e) {
                            self.onKeyPress.call(self, e);
                            self.trigger("keypress", e);
                        });
    
                        // keyup event
                        self.editor.on("keyup", function (e) {
                            self.onKeyUp.call(self, e);
                            self.trigger("keyup", e);
                        });
    
                        // keydown event
                        self.editor.on("keydown", function (e) {
                            self.onKeyDown.call(self, e);
                            self.trigger("keydown", e);
                        });
                    }, 525);
                },
    
                afterRenderControl: function (model, callback) {
                    var self = this;
                    this.base(model, function () {
    
                        if (!self.isDisplayOnly() && self.control) {
                            var rteFieldID = self.control[0].id;
    
                            setTimeout(function () {
    
                                tinyMCE.init({
                                    init_instance_callback: function (editor) {
                                        self.editor = editor;
    
                                        callback();
                                    },
                                    selector: "#" + rteFieldID,
                                    toolbar: self.options.toolbar
                                });
    
                            }, 500);
                        }
                    });
                },
    
                /**
                 * @see Alpaca.Field#destroy
                 */
                destroy: function () {
                    // destroy the plugin instance
                    if (this.editor) {
                        this.editor.remove();
                        this.editor = null;
                    }
    
                    // call up to base method
                    this.base();
                },
    
    
                /* builder_helpers */
    
                /**
                 * @see Alpaca.Fields.TextAreaField#getTitle
                 */
                getTitle: function () {
                    return "TinyMCE Editor";
                },
    
                /**
                 * @see Alpaca.Fields.TextAreaField#getDescription
                 */
                getDescription: function () {
                    return "Provides an instance of a TinyMCE control for use in editing HTML.";
                },
    
                /**
                 * @private
                 * @see Alpaca.ControlField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "toolbar": {
                                "title": "TinyMCE toolbar options",
                                "description": "Toolbar options for TinyMCE plugin.",
                                "type": "string"
                            }
                        }
                    });
                },
    
                /**
                 * @private
                 * @see Alpaca.ControlField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "toolbar": {
                                "type": "text"
                            }
                        }
                    });
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerFieldClass("tinymce", Alpaca.Fields.TinyMCEField);
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.ImageField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.ImageField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function() {
                    return "image";
                }
        
                /* builder_helpers */
                ,
        
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function() {
                    return "Image Field";
                },
        
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function() {
                    return "Image Field.";
                }
        
                /* end_builder_helpers */
            });
        
        Alpaca.registerFieldClass("image", Alpaca.Fields.ImageField);
        
    })(jQuery);

    (function($) {

        
    
        Alpaca.Fields.JSONField = Alpaca.Fields.TextAreaField.extend(
        /**
         * @lends Alpaca.Fields.JSONField.prototype
         */
        {
            /**
             * @see Alpaca.Fields.TextAreaField#getFieldType
             */
            getFieldType: function() {
                return "json";
            },
    
            /**
             * @see Alpaca.ContainerField#getValue
             */
            setValue: function(value)
            {
                if (Alpaca.isObject(value) || typeof(value) === "object")
                {
                    value = JSON.stringify(value, null, 3);
                }
    
                this.base(value);
            },
    
            /**
             * @see Alpaca.ContainerField#getValue
             */
            getValue: function()
            {
                var val = this.base();
    
                if (val && Alpaca.isString(val))
                {
                    val = JSON.parse(val);
                }
    
                return val;
            },
    
            /**
             * @see Alpaca.Fields.TextField#handleValidate
             */
            handleValidate: function()
            {
                var baseStatus = this.base();
    
                var valInfo = this.validation;
    
                var status = this._validateJSON();
                valInfo["stringNotAJSON"] = {
                    "message": status.status ? "" : this.getMessage("stringNotAJSON") +" "+ status.message,
                    "status": status.status
                };
    
                return baseStatus && valInfo["stringNotAJSON"]["status"] ;
            },
    
            /**
             * Validates if it is a valid JSON object.
             * @returns {Boolean} true if it is a valid JSON object
             */
            _validateJSON: function()
            {
                var textValue = this.control.val();
    
                // allow null
                if (Alpaca.isValEmpty(textValue))
                {
                    return {
                        "status" : true
                    };
                }
    
                // parse the string
                try
                {
                    var obj = JSON.parse(textValue);
    
                    // format the string as well
                    this.setValue(JSON.stringify(obj, null, 3));
                    return {
                        "status" : true
                    };
                }
                catch(e)
                {
                    return {
                        "status" : false,
                        "message" : e.message
                    };
                }
            },
    
            /**
             * @see Alpaca.Fields.TextAreaField#postRender
             */
            afterRenderControl: function(model, callback)
            {
                var self = this;
    
                this.base(model, function() {
    
                    if (self.control)
                    {
                        // Some auto-formatting capabilities
                        self.control.on('keypress', function(e) {
    
                            var code = e.keyCode || e.wich;
    
                            if (code === 34) {
                                self.control.insertAtCaret('"');
                            }
                            if (code === 123) {
                                self.control.insertAtCaret('}');
                            }
                            if (code === 91) {
                                self.control.insertAtCaret(']');
                            }
                        });
    
                        self.control.on('keypress', 'Ctrl+l', function() {
                            self.getFieldEl().removeClass("alpaca-field-focused");
    
                            // set class from state
                            self.refreshValidationState();
                        });
    
                        self.control.attr('title','Type Ctrl+L to format and validate the JSON string.');
                    }
    
                    callback();
    
                });
    
            }
    
            /* builder_helpers */
            ,
    
            /**
             * @see Alpaca.Fields.TextAreaField#getTitle
             */
            getTitle: function() {
                return "JSON Editor";
            },
    
            /**
             * @see Alpaca.Fields.TextAreaField#getDescription
             */
            getDescription: function() {
                return "Editor for JSON objects with basic validation and formatting.";
            }
    
            /* end_builder_helpers */
        });
    
        // Additional Registrations
        Alpaca.registerMessages({
            "stringNotAJSON": "This value is not a valid JSON string."
        });
    
        Alpaca.registerFieldClass("json", Alpaca.Fields.JSONField);
    
        $.fn.insertAtCaret = function (myValue) {
    
            return this.each(function() {
    
                //IE support
                if (document.selection) {
    
                    this.trigger('focus');
                    sel = document.selection.createRange();
                    sel.text = myValue;
                    this.trigger('focus');
    
                } else if (this.selectionStart || this.selectionStart == '0') { // jshint ignore:line
    
                    //MOZILLA / NETSCAPE support
                    var startPos = this.selectionStart;
                    var endPos = this.selectionEnd;
                    var scrollTop = this.scrollTop;
                    this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
                    this.trigger('focus');
                    this.selectionStart = startPos /*+ myValue.length*/;
                    this.selectionEnd = startPos /*+ myValue.length*/;
                    this.scrollTop = scrollTop;
    
                } else {
    
                    this.value += myValue;
                    this.trigger('focus');
                }
            });
        };
    
        /*
         * jQuery Hotkeys Plugin
         * Copyright 2010, John Resig
         * Dual licensed under the MIT or GPL Version 2 licenses.
         *
         * Based upon the plugin by Tzury Bar Yochay:
         * http://github.com/tzuryby/hotkeys
         *
         * Original idea by:
         * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        */
        jQuery.hotkeys = {
            version: "0.8",
    
            specialKeys: {
                8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
                20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
                37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
                96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
                104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
                112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
                120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
            },
    
            shiftNums: {
                "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
                "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
                ".": ">",  "/": "?",  "\\": "|"
            }
        };
    
        function keyHandler( handleObj ) {
            // Only care when a possible input has been specified
            if ( typeof handleObj.data !== "string" ) {
                return;
            }
    
            var origHandler = handleObj.handler,
                keys = handleObj.data.toLowerCase().split(" ");
    
            handleObj.handler = function( event ) {
                // Don't fire in text-accepting inputs that we didn't directly bind to
                if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
                     event.target.type === "text") ) {
                    return;
                }
    
                // Keypress represents characters, not special keys
                var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
                    character = String.fromCharCode( event.which ).toLowerCase(),
                    key, modif = "", possible = {};
    
                // check combinations (alt|ctrl|shift+anything)
                if ( event.altKey && special !== "alt" ) {
                    modif += "alt+";
                }
    
                if ( event.ctrlKey && special !== "ctrl" ) {
                    modif += "ctrl+";
                }
    
                // TODO: Need to make sure this works consistently across platforms
                if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
                    modif += "meta+";
                }
    
                if ( event.shiftKey && special !== "shift" ) {
                    modif += "shift+";
                }
    
                if ( special ) {
                    possible[ modif + special ] = true;
    
                } else {
                    possible[ modif + character ] = true;
                    possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;
    
                    // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
                    if ( modif === "shift+" ) {
                        possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
                    }
                }
    
                for ( var i = 0, l = keys.length; i < l; i++ ) {
                    if ( possible[ keys[i] ] ) {
                        return origHandler.apply( this, arguments );
                    }
                }
            };
        }
    
        jQuery.each([ "keydown", "keyup", "keypress" ], function() {
            jQuery.event.special[ this ] = { add: keyHandler };
        });
    
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.ZipcodeField = Alpaca.Fields.TextField.extend(
            /**
             * @lends Alpaca.Fields.ZipcodeField.prototype
             */
            {
                /**
                 * @see Alpaca.Fields.TextField#getFieldType
                 */
                getFieldType: function () {
                    return "zipcode";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#setup
                 */
                setup: function () {
                    this.base();
    
                    this.options.format = (this.options.format ? this.options.format : "nine");
    
                    if (this.options.format === "nine") {
                        this.schema.pattern = Alpaca.regexps["zipcode-nine"];
                    }
                    else if (this.options.format === "five") {
                        this.schema.pattern = Alpaca.regexps["zipcode-five"];
                    }
                    else {
                        Alpaca.logError("The configured zipcode format: " + this.options.format + " is not a legal value [five, nine]");
    
                        // default to nine format
                        this.options.format = "nine";
                        this.schema.pattern = Alpaca.regexps["zipcode-nine"];
                    }
    
                    // set mask string
                    if (this.options.format === "nine") {
                        this.options["maskString"] = "99999-9999";
                    }
                    else if (this.options.format === "five") {
                        this.options["maskString"] = "99999";
                    }
                },
    
                /**
                 * @see Alpaca.Fields.TextField#handleValidate
                 */
                handleValidate: function () {
                    var baseStatus = this.base();
    
                    var valInfo = this.validation;
    
                    if (!valInfo["invalidPattern"]["status"]) {
    
                        if (this.options.format === "nine") {
                            valInfo["invalidPattern"]["message"] = this.getMessage("invalidZipcodeFormatNine");
                        }
                        else if (this.options.format === "five") {
                            valInfo["invalidPattern"]["message"] = this.getMessage("invalidZipcodeFormatFive");
                        }
                    }
    
                    return baseStatus;
                }
    
    
    
                /* builder_helpers */
                ,
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getSchemaOfOptions
                 */
                getSchemaOfOptions: function () {
    
                    return Alpaca.merge(this.base(), {
                        "properties": {
                            "format": {
                                "title": "Format",
                                "description": "How to represent the zipcode field",
                                "type": "string",
                                "default": "five",
                                "enum": ["five", "nine"],
                                "readonly": true
                            }
                        }
                    });
    
                },
    
                /**
                 * @private
                 * @see Alpaca.Fields.TextField#getOptionsForOptions
                 */
                getOptionsForOptions: function () {
                    return Alpaca.merge(this.base(), {
                        "fields": {
                            "format": {
                                "type": "text"
                            }
                        }
                    });
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getTitle
                 */
                getTitle: function () {
                    return "Zipcode Field";
                },
    
                /**
                 * @see Alpaca.Fields.TextField#getDescription
                 */
                getDescription: function () {
                    return "Provides a five or nine-digital US zipcode control with validation.";
                }
    
                /* end_builder_helpers */
            });
    
        Alpaca.registerMessages({
            "invalidZipcodeFormatFive": "Invalid Five-Digit Zipcode (#####)",
            "invalidZipcodeFormatNine": "Invalid Nine-Digit Zipcode (#####-####)"
        });
        Alpaca.registerFieldClass("zipcode", Alpaca.Fields.ZipcodeField);
        Alpaca.registerDefaultFormatFieldMapping("zipcode", "zipcode");

        /**
        * Defines the base class implementation for views.  All views in Alpaca ultimately extend this form.
        * This provides the ideal place for any global overrides of view templates, message bundles or other settings.
        */
        Alpaca.registerView({
            "id": "base",
            "title": "Abstract base view",
            "messages": {
                "countries": {
                    "afg": "Afghanistan",
                    "ala": "Aland Islands",
                    "alb": "Albania",
                    "dza": "Algeria",
                    "asm": "American Samoa",
                    "and": "Andorra",
                    "ago": "Angola",
                    "aia": "Anguilla",
                    "ata": "Antarctica",
                    "atg": "Antigua and Barbuda",
                    "arg": "Argentina",
                    "arm": "Armenia",
                    "abw": "Aruba",
                    "aus": "Australia",
                    "aut": "Austria",
                    "aze": "Azerbaijan",
                    "bhs": "Bahamas",
                    "bhr": "Bahrain",
                    "bgd": "Bangladesh",
                    "brb": "Barbados",
                    "blr": "Belarus",
                    "bel": "Belgium",
                    "blz": "Belize",
                    "ben": "Benin",
                    "bmu": "Bermuda",
                    "btn": "Bhutan",
                    "bol": "Bolivia",
                    "bih": "Bosnia and Herzegovina",
                    "bwa": "Botswana",
                    "bvt": "Bouvet Island",
                    "bra": "Brazil",
                    "iot": "British Indian Ocean Territory",
                    "brn": "Brunei Darussalam",
                    "bgr": "Bulgaria",
                    "bfa": "Burkina Faso",
                    "bdi": "Burundi",
                    "khm": "Cambodia",
                    "cmr": "Cameroon",
                    "can": "Canada",
                    "cpv": "Cape Verde",
                    "cym": "Cayman Islands",
                    "caf": "Central African Republic",
                    "tcd": "Chad",
                    "chl": "Chile",
                    "chn": "China",
                    "cxr": "Christmas Island",
                    "cck": "Cocos (Keeling), Islands",
                    "col": "Colombia",
                    "com": "Comoros",
                    "cog": "Congo",
                    "cod": "Congo, the Democratic Republic of the",
                    "cok": "Cook Islands",
                    "cri": "Costa Rica",
                    "hrv": "Croatia",
                    "cub": "Cuba",
                    "cyp": "Cyprus",
                    "cze": "Czech Republic",
                    "civ": "Cote d'Ivoire",
                    "dnk": "Denmark",
                    "dji": "Djibouti",
                    "dma": "Dominica",
                    "dom": "Dominican Republic",
                    "ecu": "Ecuador",
                    "egy": "Egypt",
                    "slv": "El Salvador",
                    "gnq": "Equatorial Guinea",
                    "eri": "Eritrea",
                    "est": "Estonia",
                    "eth": "Ethiopia",
                    "flk": "Falkland Islands (Malvinas),",
                    "fro": "Faroe Islands",
                    "fji": "Fiji",
                    "fin": "Finland",
                    "fra": "France",
                    "guf": "French Guiana",
                    "pyf": "French Polynesia",
                    "atf": "French Southern Territories",
                    "gab": "Gabon",
                    "gmb": "Gambia",
                    "geo": "Georgia",
                    "deu": "Germany",
                    "gha": "Ghana",
                    "gib": "Gibraltar",
                    "grc": "Greece",
                    "grl": "Greenland",
                    "grd": "Grenada",
                    "glp": "Guadeloupe",
                    "gum": "Guam",
                    "gtm": "Guatemala",
                    "ggy": "Guernsey",
                    "gin": "Guinea",
                    "gnb": "Guinea-Bissau",
                    "guy": "Guyana",
                    "hti": "Haiti",
                    "hmd": "Heard Island and McDonald Islands",
                    "vat": "Holy See (Vatican City State),",
                    "hnd": "Honduras",
                    "hkg": "Hong Kong",
                    "hun": "Hungary",
                    "isl": "Iceland",
                    "ind": "India",
                    "idn": "Indonesia",
                    "irn": "Iran, Islamic Republic of",
                    "irq": "Iraq",
                    "irl": "Ireland",
                    "imn": "Isle of Man",
                    "isr": "Israel",
                    "ita": "Italy",
                    "jam": "Jamaica",
                    "jpn": "Japan",
                    "jey": "Jersey",
                    "jor": "Jordan",
                    "kaz": "Kazakhstan",
                    "ken": "Kenya",
                    "kir": "Kiribati",
                    "prk": "Korea, Democratic People's Republic of",
                    "kor": "Korea, Republic of",
                    "kwt": "Kuwait",
                    "kgz": "Kyrgyzstan",
                    "lao": "Lao People's Democratic Republic",
                    "lva": "Latvia",
                    "lbn": "Lebanon",
                    "lso": "Lesotho",
                    "lbr": "Liberia",
                    "lby": "Libyan Arab Jamahiriya",
                    "lie": "Liechtenstein",
                    "ltu": "Lithuania",
                    "lux": "Luxembourg",
                    "mac": "Macao",
                    "mkd": "Macedonia, the former Yugoslav Republic of",
                    "mdg": "Madagascar",
                    "mwi": "Malawi",
                    "mys": "Malaysia",
                    "mdv": "Maldives",
                    "mli": "Mali",
                    "mlt": "Malta",
                    "mhl": "Marshall Islands",
                    "mtq": "Martinique",
                    "mrt": "Mauritania",
                    "mus": "Mauritius",
                    "myt": "Mayotte",
                    "mex": "Mexico",
                    "fsm": "Micronesia, Federated States of",
                    "mda": "Moldova, Republic of",
                    "mco": "Monaco",
                    "mng": "Mongolia",
                    "mne": "Montenegro",
                    "msr": "Montserrat",
                    "mar": "Morocco",
                    "moz": "Mozambique",
                    "mmr": "Myanmar",
                    "nam": "Namibia",
                    "nru": "Nauru",
                    "npl": "Nepal",
                    "nld": "Netherlands",
                    "ant": "Netherlands Antilles",
                    "ncl": "New Caledonia",
                    "nzl": "New Zealand",
                    "nic": "Nicaragua",
                    "ner": "Niger",
                    "nga": "Nigeria",
                    "niu": "Niue",
                    "nfk": "Norfolk Island",
                    "mnp": "Northern Mariana Islands",
                    "nor": "Norway",
                    "omn": "Oman",
                    "pak": "Pakistan",
                    "plw": "Palau",
                    "pse": "Palestinian Territory, Occupied",
                    "pan": "Panama",
                    "png": "Papua New Guinea",
                    "pry": "Paraguay",
                    "per": "Peru",
                    "phl": "Philippines",
                    "pcn": "Pitcairn",
                    "pol": "Poland",
                    "prt": "Portugal",
                    "pri": "Puerto Rico",
                    "qat": "Qatar",
                    "rou": "Romania",
                    "rus": "Russian Federation",
                    "rwa": "Rwanda",
                    "reu": "Reunion",
                    "blm": "Saint Barthelemy",
                    "shn": "Saint Helena",
                    "kna": "Saint Kitts and Nevis",
                    "lca": "Saint Lucia",
                    "maf": "Saint Martin (French part)",
                    "spm": "Saint Pierre and Miquelon",
                    "vct": "Saint Vincent and the Grenadines",
                    "wsm": "Samoa",
                    "smr": "San Marino",
                    "stp": "Sao Tome and Principe",
                    "sau": "Saudi Arabia",
                    "sen": "Senegal",
                    "srb": "Serbia",
                    "syc": "Seychelles",
                    "sle": "Sierra Leone",
                    "sgp": "Singapore",
                    "svk": "Slovakia",
                    "svn": "Slovenia",
                    "slb": "Solomon Islands",
                    "som": "Somalia",
                    "zaf": "South Africa",
                    "sgs": "South Georgia and the South Sandwich Islands",
                    "esp": "Spain",
                    "lka": "Sri Lanka",
                    "sdn": "Sudan",
                    "sur": "Suriname",
                    "sjm": "Svalbard and Jan Mayen",
                    "swz": "Swaziland",
                    "swe": "Sweden",
                    "che": "Switzerland",
                    "syr": "Syrian Arab Republic",
                    "twn": "Taiwan, Province of China",
                    "tjk": "Tajikistan",
                    "tza": "Tanzania, United Republic of",
                    "tha": "Thailand",
                    "tls": "Timor-Leste",
                    "tgo": "Togo",
                    "tkl": "Tokelau",
                    "ton": "Tonga",
                    "tto": "Trinidad and Tobago",
                    "tun": "Tunisia",
                    "tur": "Turkey",
                    "tkm": "Turkmenistan",
                    "tca": "Turks and Caicos Islands",
                    "tuv": "Tuvalu",
                    "uga": "Uganda",
                    "ukr": "Ukraine",
                    "are": "United Arab Emirates",
                    "gbr": "United Kingdom",
                    "usa": "United States",
                    "umi": "United States Minor Outlying Islands",
                    "ury": "Uruguay",
                    "uzb": "Uzbekistan",
                    "vut": "Vanuatu",
                    "ven": "Venezuela",
                    "vnm": "Viet Nam",
                    "vgb": "Virgin Islands, British",
                    "vir": "Virgin Islands, U.S.",
                    "wlf": "Wallis and Futuna",
                    "esh": "Western Sahara",
                    "yem": "Yemen",
                    "zmb": "Zambia",
                    "zwe": "Zimbabwe"
                }
            }
        });
        
    })(jQuery);

    (function($) {
        
        Alpaca.Fields.ObjectField = Alpaca.Fields.ObjectField.extend({

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            //
            // WIZARD
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////////////
    
            /**
             * Wraps the current object into a wizard container and wires up the navigation and buttons so that
             * wizard elements flip nicely.
             */
            wizard: function () {
                var self = this;
    
                // config-driven
                var stepDescriptors = this.wizardConfigs.steps;
                if (!stepDescriptors) {
                    stepDescriptors = [];
                }
                var wizardTitle = this.wizardConfigs.title;
                var wizardDescription = this.wizardConfigs.description;
                var buttonDescriptors = this.wizardConfigs.buttons;
                if (!buttonDescriptors) {
                    buttonDescriptors = {};
                }
                if (!buttonDescriptors["previous"]) {
                    buttonDescriptors["previous"] = {}
                }
                if (!buttonDescriptors["previous"].title) {
                    buttonDescriptors["previous"].title = "Previous";
                }
                if (!buttonDescriptors["previous"].align) {
                    buttonDescriptors["previous"].align = "left";
                }
                if (!buttonDescriptors["previous"].type) {
                    buttonDescriptors["previous"].type = "button";
                }
                if (!buttonDescriptors["next"]) {
                    buttonDescriptors["next"] = {}
                }
                if (!buttonDescriptors["next"].title) {
                    buttonDescriptors["next"].title = "Next";
                }
                if (!buttonDescriptors["next"].align) {
                    buttonDescriptors["next"].align = "right";
                }
                if (!buttonDescriptors["next"].type) {
                    buttonDescriptors["next"].type = "button";
                }
    
                if (!this.wizardConfigs.hideSubmitButton) {
                    if (!buttonDescriptors["submit"]) {
                        buttonDescriptors["submit"] = {}
                    }
                    if (!buttonDescriptors["submit"].title) {
                        buttonDescriptors["submit"].title = "Submit";
                    }
                    if (!buttonDescriptors["submit"].align) {
                        buttonDescriptors["submit"].align = "right";
                    }
                    if (!buttonDescriptors["submit"].type) {
                        buttonDescriptors["submit"].type = "button";
                    }
                }
    
                for (var buttonKey in buttonDescriptors) {
                    if (!buttonDescriptors[buttonKey].type) {
                        buttonDescriptors[buttonKey].type = "button";
                    }
                }
                var showSteps = this.wizardConfigs.showSteps;
                if (typeof (showSteps) == "undefined") {
                    showSteps = true;
                }
                var showProgressBar = this.wizardConfigs.showProgressBar;
                var performValidation = this.wizardConfigs.validation;
                if (typeof (performValidation) == "undefined") {
                    performValidation = true;
                }
    
                // DOM-driven configuration
                var wizardTitle = $(this.field).attr("data-alpaca-wizard-title");
                var wizardDescription = $(this.field).attr("data-alpaca-wizard-description");
                var _wizardValidation = $(this.field).attr("data-alpaca-wizard-validation");
                if (typeof (_wizardValidation) != "undefined") {
                    performValidation = _wizardValidation ? true : false;
                }
                var _wizardShowSteps = $(this.field).attr("data-alpaca-wizard-show-steps");
                if (typeof (_wizardShowSteps) != "undefined") {
                    showSteps = _wizardShowSteps ? true : false;
                }
                var _wizardShowProgressBar = $(this.field).attr("data-alpaca-wizard-show-progress-bar");
                if (typeof (_wizardShowProgressBar) != "undefined") {
                    showProgressBar = _wizardShowProgressBar ? true : false;
                }
    
                // find all of the steps
                var stepEls = $(this.field).find("[data-alpaca-wizard-role='step']");
    
                // DOM-driven configuration of step descriptors
                if (stepDescriptors.length == 0) {
                    stepEls.each(function (i) {
    
                        var stepDescriptor = {};
    
                        var stepTitle = $(this).attr("data-alpaca-wizard-step-title");
                        if (typeof (stepTitle) != "undefined") {
                            stepDescriptor.title = stepTitle;
                        }
                        if (!stepDescriptor.title) {
                            stepDescriptor.title = "Step " + i;
                        }
    
                        var stepDescription = $(this).attr("data-alpaca-wizard-step-description");
                        if (typeof (stepDescription) != "undefined") {
                            stepDescriptor.description = stepDescription;
                        }
                        if (!stepDescriptor.description) {
                            stepDescriptor.description = "Step " + i;
                        }
    
                        stepDescriptors.push(stepDescriptor);
                    });
                }
    
                // assume something for progress bar if not specified
                if (typeof (showProgressBar) == "undefined") {
                    if (stepDescriptors.length > 1) {
                        showProgressBar = true;
                    }
                }
    
    
                // model for use in rendering the wizard
                var model = {};
                model.wizardTitle = wizardTitle;
                model.wizardDescription = wizardDescription;
                model.showSteps = showSteps;
                model.performValidation = performValidation;
                model.steps = stepDescriptors;
                model.buttons = buttonDescriptors;
                model.schema = self.schema;
                model.options = self.options;
                model.data = self.data;
                model.showProgressBar = showProgressBar;
                model.markAllStepsVisited = this.wizardConfigs.markAllStepsVisited;
                model.view = self.view;
    
                // render the actual wizard
                var wizardTemplateDescriptor = self.view.getTemplateDescriptor("wizard", self);
                if (wizardTemplateDescriptor) {
                    var wizardEl = Alpaca.tmpl(wizardTemplateDescriptor, model);
    
                    $(self.field).append(wizardEl);
    
                    var wizardNav = $(wizardEl).find(".alpaca-wizard-nav");
                    var wizardSteps = $(wizardEl).find(".alpaca-wizard-steps");
                    var wizardButtons = $(wizardEl).find(".alpaca-wizard-buttons");
                    var wizardProgressBar = $(wizardEl).find(".alpaca-wizard-progress-bar");
    
                    // move steps into place
                    $(wizardSteps).append(stepEls);
    
                    (function (wizardNav, wizardSteps, wizardButtons, model) {
    
                        var currentIndex = 0;
    
                        var previousButtonEl = $(wizardButtons).find("[data-alpaca-wizard-button-key='previous']");
                        var nextButtonEl = $(wizardButtons).find("[data-alpaca-wizard-button-key='next']");
                        var submitButtonEl = $(wizardButtons).find("[data-alpaca-wizard-button-key='submit']");
    
                        // snap into place a little controller to work the buttons
                        // assume the first step
                        var refreshSteps = function () {
                            // NAV
                            if (model.showSteps) {
                                if (!model.visits) {
                                    model.visits = {};
                                }
    
                                // optionally mark all steps as visited
                                if (model.markAllStepsVisited) {
                                    var stepElements = $(wizardNav).find("[data-alpaca-wizard-step-index]");
                                    for (var g = 0; g < stepElements.length; g++) {
                                        model.visits[g] = true;
                                    }
                                }
    
                                // mark current step as visited
                                model.visits[currentIndex] = true;
    
                                var stepElements = $(wizardNav).find("[data-alpaca-wizard-step-index]");
                                $(stepElements).removeClass("binf-disabled");
                                $(stepElements).removeClass("completed");
                                $(stepElements).removeClass("binf-active");
                                $(stepElements).removeClass("visited");
                                for (var g = 0; g < stepElements.length; g++) {
                                    if (g < currentIndex) {
                                        $(wizardNav).find("[data-alpaca-wizard-step-index='" + g + "']").addClass("completed");
                                    }
                                    else if (g === currentIndex) {
                                        $(wizardNav).find("[data-alpaca-wizard-step-index='" + g + "']").addClass("binf-active");
                                    }
                                    else {
                                        if (model.visits && model.visits[g]) {
                                            // do not mark disabled for this case
                                        }
                                        else {
                                            $(wizardNav).find("[data-alpaca-wizard-step-index='" + g + "']").addClass("binf-disabled");
                                        }
    
                                    }
    
                                    if (model.visits && model.visits[g]) {
                                        $(wizardNav).find("[data-alpaca-wizard-step-index='" + g + "']").addClass("visited");
                                    }
                                }
                            }
    
                            // PROGRESS BAR
                            if (model.showProgressBar) {
                                var valueNow = currentIndex + 1;
                                var valueMax = model.steps.length + 1;
                                var width = parseInt(((valueNow / valueMax) * 100), 10) + "%";
    
                                $(wizardProgressBar).find(".binf-progress-bar").attr("aria-valuemax", valueMax);
                                $(wizardProgressBar).find(".binf-progress-bar").attr("aria-valuenow", valueNow);
                                $(wizardProgressBar).find(".binf-progress-bar").css("width", width);
                            }
    
    
                            // BUTTONS
    
                            // hide everything
                            previousButtonEl.hide();
                            nextButtonEl.hide();
                            submitButtonEl.hide();
    
                            // simple case
                            if (model.steps.length == 1) {
                                submitButtonEl.show();
                            }
                            else if (model.steps.length > 1) {
                                if (currentIndex > 0) {
                                    previousButtonEl.show();
                                }
    
                                nextButtonEl.show();
    
                                if (currentIndex == 0) {
                                    nextButtonEl.show();
                                }
                                else if (currentIndex == model.steps.length - 1) {
                                    nextButtonEl.hide();
                                    submitButtonEl.show();
                                }
                            }
    
                            // hide all steps
                            $(wizardSteps).find("[data-alpaca-wizard-role='step']").hide();
                            $($(wizardSteps).find("[data-alpaca-wizard-role='step']")[currentIndex]).show();
    
                        };
    
                        var assertValidation = function (buttonId, callback) {
                            if (!model.performValidation) {
                                callback(true);
                                return;
                            }
    
                            // collect all of the fields on the current step
                            var fields = [];
    
                            var currentStepEl = $($(wizardSteps).find("[data-alpaca-wizard-role='step']")[currentIndex]);
                            $(currentStepEl).find(".alpaca-field").each(function () {
                                var fieldId = $(this).attr("data-alpaca-field-id");
                                if (fieldId) {
                                    var field = self.childrenById[fieldId];
                                    if (field) {
                                        fields.push(field);
                                    }
                                }
                            });
    
                            // wrap into validation functions
                            var fns = [];
                            for (var i = 0; i < fields.length; i++) {
                                fns.push(function (field) {
                                    return function (cb) {
                                        field.refreshValidationState(true, function () {
                                            cb();
                                        });
                                    }
                                }(fields[i]));
                            }
    
                            // run all validations
                            Alpaca.series(fns, function () {
    
                                var valid = true;
                                for (var i = 0; i < fields.length; i++) {
                                    valid = valid && fields[i].isValid(true);
                                }
    
                                // custom validation function?
                                var b = model.buttons[buttonId];
                                if (b && b.validate) {
                                    b.validate.call(self, function (_valid) {
                                        valid = valid && _valid;
                                        callback(valid);
                                    });
                                }
                                else {
                                    callback(valid);
                                }
                            });
                        };
    
                        $(previousButtonEl).on('click', function (e) {
                            e.preventDefault();
    
                            if (currentIndex >= 1) {
                                //assertValidation("previous", function(valid) {
    
                                //if (valid)
                                //{
                                var b = model.buttons["previous"];
                                if (b) {
                                    if (b.click) {
                                        b.click.call(self, e);
                                    }
                                }
    
                                currentIndex--;
    
                                refreshSteps();
                                //}
                                //});
                            }
                        });
    
                        $(nextButtonEl).on('click', function (e) {
                            e.preventDefault();
    
                            if (currentIndex + 1 <= model.steps.length - 1) {
                                assertValidation("next", function (valid) {
    
                                    if (valid) {
                                        var b = model.buttons["next"];
                                        if (b) {
                                            if (b.click) {
                                                b.click.call(self, e);
                                            }
                                        }
    
                                        currentIndex++;
    
                                        refreshSteps();
                                    }
                                });
                            }
                        });
    
                        $(submitButtonEl).on('click', function (e) {
                            e.preventDefault();
    
                            if (currentIndex === model.steps.length - 1) {
                                assertValidation("submit", function (valid) {
    
                                    if (valid) {
                                        var b = model.buttons["submit"];
                                        if (b) {
                                            if (b.click) {
                                                b.click.call(self, e);
                                            }
                                            else {
                                                // are we in a form?
                                                if (self.form) {
                                                    self.form.submit();
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        });
    
                        // all custom buttons
                        $(wizardButtons).find("[data-alpaca-wizard-button-key]").each(function () {
                            var key = $(this).attr("data-alpaca-wizard-button-key");
                            if (key != "submit" && key != "next" && key != "previous") { // standard buttons have different behavior
                                var b = model.buttons[key];
                                if (b && b.click) {
                                    $(this).on('click', function (b) {
                                        return function (e) {
                                            b.click.call(self, e);
                                        };
                                    }(b));
                                }
                            }
                        });
    
                        $(wizardNav).find("[data-alpaca-wizard-step-index]").on('click', function (e) {
                            e.preventDefault();
    
                            var navIndex = $(this).attr("data-alpaca-wizard-step-index");
                            if (navIndex) {
                                navIndex = parseInt(navIndex, 10);
    
                                if (navIndex == currentIndex || (model.visits && model.visits[navIndex])) {
                                    // if we're going backwards, then we do not run validation
                                    if (navIndex < currentIndex) {
                                        currentIndex = navIndex;
                                        refreshSteps();
                                    }
                                    else if (navIndex > currentIndex) {
                                        assertValidation(null, function (valid) {
    
                                            if (valid) {
                                                currentIndex = navIndex;
                                                refreshSteps();
                                            }
                                        });
                                    }
                                    else {
                                        // current item should not be clickable
                                    }
                                }
                            }
                        });
    
                        self.on("moveToStep", function (event) {
    
                            var index = event.index;
                            var skipValidation = event.skipValidation;
    
                            if ((typeof (index) !== "undefined") && index <= model.steps.length - 1) {
                                if (skipValidation) {
                                    currentIndex = index;
                                    refreshSteps();
                                }
                                else {
                                    assertValidation(null, function (valid) {
    
                                        if (valid) {
                                            currentIndex = index;
    
                                            refreshSteps();
                                        }
                                    });
                                }
                            }
                        });
    
                        self.on("advanceOrSubmit", function (event) {
    
                            assertValidation(null, function (valid) {
    
                                if (valid) {
                                    if (currentIndex === model.steps.length - 1) {
                                        $(submitButtonEl).trigger('click');
                                    }
                                    else {
                                        $(nextButtonEl).trigger('click');
                                    }
                                }
                            });
                        });
    
    
                        refreshSteps();
    
                    }(wizardNav, wizardSteps, wizardButtons, model));
                }
            },
    
            /**
             * Renders a configuration-based wizard without a layout template.
             */
            autoWizard: function () {
                var stepBindings = this.wizardConfigs.bindings;
                if (!stepBindings) {
                    stepBindings = {};
                }
    
                for (var propertyId in this.childrenByPropertyId) {
                    if (!stepBindings.hasOwnProperty(propertyId)) {
                        stepBindings[propertyId] = 1;
                    }
                }
    
                // should we create steps?
                var createSteps = true;
                if ($(this.field).find("[data-alpaca-wizard-role='step']").length > 0) {
                    // already there
                    createSteps = false;
                }
    
                var step = 1;
                var col = [];
                do {
                    // collect fields in this step
                    col = [];
                    for (var propertyId in stepBindings) {
                        if (stepBindings[propertyId] == step) {
                            if (this.childrenByPropertyId && this.childrenByPropertyId[propertyId]) {
                                col.push(this.childrenByPropertyId[propertyId].field);
                            }
                        }
                    }
    
                    if (col.length > 0) {
                        var stepEl = null;
                        if (createSteps) {
                            stepEl = $('<div data-alpaca-wizard-role="step"></div>');
                            $(this.field).append(stepEl);
                        }
                        else {
                            stepEl = $($(this.field).find("[data-alpaca-wizard-role='step']")[step - 1]);
                        }
    
                        // move elements in
                        for (var i = 0; i < col.length; i++) {
                            $(stepEl).append(col[i]);
                        }
    
                        step++;
                    }
                }
                while (col.length > 0);
    
                // now run the normal wizard
                this.wizard();
            },
    
        });
        
    })(jQuery);

    return Alpaca;

    // Helper functions

    function round() {
        var strategies = {
            up: Math.ceil,
            down: function (input) { return ~~input; },
            nearest: Math.round
        };
        return function (strategy) {
            return strategies[strategy];
        };
    }
});

csui.define('bundles/csui-alpaca-legacy',[

    'csui/lib/alpaca/js/alpaca',

], {});
