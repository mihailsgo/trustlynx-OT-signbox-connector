/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/user.avatar.color',
  'csui/utils/nodesprites',
  'csui/controls/node-type.icon/node-type.icon.view'
], function ( _, $,
  UserAvatarColor, nodeSpriteCollection, NodeTypeIconView) {

  var NodeTypeIconViewMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {

        makeNodeTypeIconItemView: function () {
          this.listenTo(this,"destroy",function(){
            if (this.nodeTypeIconView) {
              this.nodeTypeIconView.destroy();
            }
          });
        },
        renderNodeTypeIconView: function(node,targetElement,iconClasses,imageClasses,options) {
          var target = $(targetElement);
          targetElement = target[0] ? target : targetElement;
          iconClasses = iconClasses || "";
          imageClasses = imageClasses || "";
          options = options || {};
          var csuiInitials = (" "+iconClasses+" ").indexOf(" csui-initials ")>=0;
          var nodeTypeOptions = {
            node: node,
            nodeSprite: csuiInitials ? new nodeSpriteCollection.model({ className: iconClasses }) : options.nodeSprite,
            size: options.size
          };
          this.nodeTypeIconView && this.nodeTypeIconView.destroy();
          var nodeTypeIconView = this.nodeTypeIconView = new NodeTypeIconView(nodeTypeOptions);
          nodeTypeIconView.render();
          nodeTypeIconView.$el.removeAttr("title aria-label");
          nodeTypeIconView.$el.addClass(targetElement.attr("class"));
          if (csuiInitials) {
            var initials = node.attributes.initials;
            var backcolor;
            if (initials) {
              backcolor = UserAvatarColor.getUserAvatarColor(node.attributes);
            } else {
              var name = node.get(node.nameAttribute||'name')||'';
              var ii = name.trim().indexOf(' ');
              initials = ii>0 ? name[0]+name[ii+1] : name.substring(0,2);
              backcolor = UserAvatarColor.getUserAvatarColor({initials:initials});
            }
            nodeTypeIconView.ui.iconElement.text(initials);
            nodeTypeIconView.ui.iconElement.css("background", backcolor);
          }
          nodeTypeIconView.ui.iconElement.addClass(iconClasses);
          nodeTypeIconView.ui.imageElement.addClass(imageClasses);
          targetElement.replaceWith(nodeTypeIconView.el);
        }
      });
    }
  };

  return NodeTypeIconViewMixin;
});
