csui.define([
    'csui/lib/backbone',   
    'csui/utils/url',      
    'conws/widgets/outlook/impl/utils/utility'
], function (Backbone, Url, WkspUtil) {

    var simpleSearchresultModel = Backbone.Model.extend({

        defaults: {
            name: 'Unnamed'
        },

        constructor: function searchresultModel(attributes, options) {
            Backbone.Model.prototype.constructor.apply(this, arguments);

            if (options && options.context.connector) {
                options.context.connector.assignTo(this);

                this.pageSize = options.pageSize;
                this.pageNo = options.pageNo;
                this.isEdit = options.isEdit;

                this.nextPageUrl = "";
                this.query = options.query;
            }
        },

        url: function() {
            var url = WkspUtil.v1ToV2(this.connector.connection.url),
                query = this.query.toJSON(),
                cacheId = "",
                pagingString = "";

            if (this.nextPageUrl) {
                this.pageNo++;
                var regEx = /cache_id=\d+/g;
                var cacheIdEx = regEx.exec(this.nextPageUrl);
                cacheId = cacheIdEx.length > 0 ? cacheIdEx[0] : "";
            }

            pagingString = 'page=' + this.pageNo + '&limit=' + this.pageSize;
            query = Url.combineQueryString(query, pagingString, cacheId);

            return Url.combine(url, 'search?' + query);

        },

        parse: function (response) {
            if (this.isEdit){
                if (response && response.results && response.results.length > 0) {
                    for (var i = response.results.length-1; i >= 0; i--) {
                        response.results[i].data.properties.isEdit = true;
                    }
                }
            }
            
            return response;
        }

    });

    return simpleSearchresultModel;

});
