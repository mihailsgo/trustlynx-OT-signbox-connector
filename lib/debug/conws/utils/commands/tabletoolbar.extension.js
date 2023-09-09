/**
 * Created by stefang on 11.09.2015.
 */

csui.define( [
  "csui/lib/jquery", "csui/lib/underscore", "csui/utils/url",
  "csui/controls/globalmessage/globalmessage",
  'csui/controls/toolbar/toolitem.model',
  'i18n!conws/utils/commands/nls/commands.lang',
  'csui/utils/base'
], function ($, _, Url, GlobalMessage, ToolItemModel, lang, base) {

  function ToolbarExtension () {}

  _.extend(ToolbarExtension.prototype,{

    _addMenuItems: function (toolbarItems,businessWorkspaceTypes) {
      var toolItems = [];
      businessWorkspaceTypes.forEach(function(bwtype) {
        // note: signature of toolbar item must match with a command or indicates entry as separator
        if (bwtype.templates.length>0) {
          bwtype.templates.forEach(function(tmpl){
            // TODO: setting the sub type name for the sub type 848 to Business Workspace, this should be returned with the businessworkspacetypes REST call.
            var subTypeName = tmpl.subType === 848 ? lang.BusinessWorkspaceTypeName : '';
            var toolItem = new ToolItemModel({
              signature: "AddConnectedWorkspace",
              name: tmpl.name,
              type: tmpl.subType,
              group: 'conws',
              commandData: { wsType: bwtype, subType: tmpl.subType, subTypeName: subTypeName, template: tmpl }
            });
            toolItems.push(toolItem);
          });
        }
      });
      if (toolItems.length>0) {
        toolItems.sort(function(a,b) {
          var aname = a.get("name"),
              bname = b.get("name"),
              result = base.localeCompareString(aname,bname,{usage:"sort"});
          return result;
        });
        toolItems.forEach(function(toolItem){
          toolbarItems.push(toolItem);
        });
      }
    },

    OnUpdateToolbar: function (args) {
      var done = args.async(),
        //context = args.context,
          container = args.container,
        //addableTypes = args.addableTypes,
          toolbarItems = args.toolbarItems,
          conwsTemplateToolItem = _.find(toolbarItems, function (toolItem) {
            if (toolItem.attributes.type === 848) {
              return toolItem;
            }
          });

      if (!!conwsTemplateToolItem) {
        conwsTemplateToolItem.set("signature", "AddCONWSTemplate");
        conwsTemplateToolItem.set("group", "conws");
      }

	  // first get all addable wstypes for this container
      // URL is like: http://vmstg-dev4/OTCS/cs.exe/api/v1/nodes/{id}/businessworkspacetypes
      var deferred = $.Deferred();
      var getWsTypesUrl = Url.combine(container.urlBase(), 'businessworkspacetypes');
      var ajaxOptions = container.connector.extendAjaxOptions({
        type: 'GET',
        url: getWsTypesUrl
      });

      var that = this;
      container.connector.makeAjaxCall(ajaxOptions)
          .done(function (response, statusText, jqxhr) {

            if (response && response.businessworkspacetypes && response.businessworkspacetypes.length>0) {
              that._addMenuItems(toolbarItems,response.businessworkspacetypes);
            }

            deferred.resolve.apply(deferred, arguments);
            done();
          })
          .fail(function (jqXHR, statusText, error) {

            // show failure message
            var linesep = "\r\n",
                lines = [];
            if (statusText!=="error") {
              lines.push(statusText);
            }
            if (jqXHR.responseText) {
              var respObj = JSON.parse(jqXHR.responseText);
              if (respObj && respObj.error) {
                lines.push(respObj.error);
              }
            }
            if (error) {
              lines.push(error);
            }
            var errmsg = lines.length>0 ? lines.join(linesep) : undefined;
            GlobalMessage.showMessage("error",lang.ErrorLoadingAddItemMenu,errmsg);
            deferred.reject.apply(deferred, arguments);
            done();
          });

    }
  });

  return function (tableToolbarView) {

    //tableToolbarView.on('before:updateAddToolbar', _.bind(ToolbarExtension.OnUpdateToolbar,ToolbarExtension) );
    var extension = new ToolbarExtension();
    //tableToolbarView.on('before:updateAddToolbar', extension.OnUpdateToolbar.bind(this) );
    //tableToolbarView.on('before:updateAddToolbar', _.bind(extension.OnUpdateToolbar,extension) );
    tableToolbarView.on('before:updateAddToolbar', function() { extension.OnUpdateToolbar.apply(extension,arguments);} );

  };

});