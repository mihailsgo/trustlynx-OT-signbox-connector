csui.define([
    'csui/lib/jquery'
], function ($) {

    var GotoLocationExtension = {

        navigate: function (node, options) {
            var deferred = $.Deferred();

            options.context.viewStateModel.set('conwsNavigate', 'gotoLocation' );

            return deferred.reject().promise();
        }

    };

    return GotoLocationExtension;
});