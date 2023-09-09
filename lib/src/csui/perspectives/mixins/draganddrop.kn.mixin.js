/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/underscore", "csui/lib/jquery",'i18n'], function (_, $, i18n) {
  "use strict";

  var DragAndDropKNMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        moveToRight: function (movableEle, focusableEle, widgetCells) {
          var self = this, isRtl = i18n && i18n.settings.rtl,
              nextEle = movableEle.next();

          function callback() {
            movableEle && movableEle.insertAfter(nextEle);
            focusableEle && focusableEle.trigger("focus");
            self.swapIndexPositions(widgetCells, movableEle.index(), nextEle.index());
          }

          nextEle.length && this.animation(movableEle, nextEle, !isRtl, callback);
        },

        moveToLeft: function (movableEle, focusableEle, widgetCells) {
          var self = this, isRtl = i18n && i18n.settings.rtl,
              prevEle = movableEle.prev();

          function callback() {
            movableEle && movableEle.insertBefore(prevEle);
            focusableEle && focusableEle.trigger("focus");
            self.swapIndexPositions(widgetCells, movableEle.index(), prevEle.index());
          }
          prevEle.length && this.animation(movableEle, prevEle, isRtl, callback);
        },

        animation: function (movableEle, destEle, isMovingRight, callback) {
          var positions = this.findPositions(movableEle, destEle),
              isEleInSameRow = (positions.destEle.top === positions.movableEle.top),
              destEleWidth = destEle.width(),
              movableEleWidth = movableEle.width(),self = this,duration = 400;
          movableEle.css('zIndex', 99999);
          destEle.css('zIndex', 99998);
          if(self.isAnimationInProgress){
            duration = 0;
            this.movableEleAnimate && this.movableEleAnimate.stop();
            this.destEleAnimate && this.destEleAnimate.stop();
          }
          self.isAnimationInProgress = true;
          this.movableEleAnimate =  movableEle.animate(
            {
              left: isEleInSameRow &&
                    isMovingRight ? destEleWidth :
                    positions.destEle.left - positions.movableEle.left,
              top: isEleInSameRow ? 0 : positions.destEle.top - positions.movableEle.top,
            },
            {duration: duration, easing: "easeInOutCubic", queue: false}
          );
          this.destEleAnimate =  destEle.animate(
            {
              left: isEleInSameRow ?
                    isMovingRight ? positions.movableEle.left - positions.destEle.left :
                    movableEleWidth < destEleWidth ? movableEleWidth : destEleWidth :
                    positions.movableEle.left - positions.destEle.left,
              top: isEleInSameRow ? 0 : positions.movableEle.top - positions.destEle.top,
            },
            {duration: duration, easing: "easeInOutCubic", queue: false}
          );
         $.when(
          this.movableEleAnimate , this.destEleAnimate
          ).always(function () {
            self.isAnimationInProgress = false;
            movableEle.css({
              top: 0,
              left: 0,
              zIndex: 'initial'
            });
            destEle.css({
              top: 0,
              left: 0,
              zIndex: 'initial'
            });
            callback();
          });
        },

        swapIndexPositions: function (widgetCells, old_index, new_index) {
          var temp = widgetCells[old_index];
          widgetCells[old_index] = widgetCells[new_index];
          widgetCells[new_index] = temp;
          return widgetCells;
        },

        findPositions: function (movableEle, destEle) {
          return {
            movableEle: movableEle.offset(),
            destEle: destEle.offset()
          };
        }
      });
    },
  };

  return DragAndDropKNMixin;
});
