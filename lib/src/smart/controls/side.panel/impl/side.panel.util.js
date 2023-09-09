/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/jquery', 'smart/utils/smart.base'], function (jQuery, SmartBase) {
  (function ($, undefined) {
    if ($.fn.panelResizable) {
      return;
    }

    $.fn.panelResizable = function fnPanelResizable(options) {
      var opt                      = {
            handleSelector: null,
            resizeWidth: true,
            resizeHeight: true,
            onDragStart: null,
            onDragEnd: null,
            onDrag: null,
            touchActionNone: true,
            thresholdWidth: null,
            view: null
          },
          CLASSNAME_IN_RESIZE_MODE = 'csui-sidepanel-resizing-mode-on';
      if (typeof options == "object") {
        opt = $.extend(opt, options);
      }

      return this.each(function () {
        var startPos, startTransition;

        var $el = $(this);
        var $handle = opt.handleSelector ? $(opt.handleSelector) : $el;

        if (opt.touchActionNone) {
          $handle.css("touch-action", "none");
        }

        $el.addClass("csui-panel-resizable");
        $handle.on('mousedown.rsz touchstart.rsz', startDragging);

        function noop(e) {
          e.stopPropagation();
          e.preventDefault();
        }

        function startDragging(e) {
          $el.addClass(CLASSNAME_IN_RESIZE_MODE);
          startPos = getMousePos(e);
          startPos.width = parseInt($el.width(), 10);
          startPos.height = parseInt($el.height(), 10);

          startTransition = $el.css("transition");
          $el.css("transition", "none");

          if (opt.onDragStart) {
            if (opt.onDragStart(e, $el, opt) === false) {
              return;
            }
          }
          opt.dragFunc = doDrag;

          $(document).on('mousemove.rsz', opt.dragFunc);
          $(document).on('mouseup.rsz', stopDragging);
          if (window.Touch || navigator.maxTouchPoints) {
            $(document).on('touchmove.rsz', opt.dragFunc);
            $(document).on('touchend.rsz', stopDragging);
          }
          $(document).on('selectstart.rsz', noop); // disable selection
        }
        function setWidth(el, width) {
          var widthInPercentage = (width * 100) / document.body.clientWidth;
          el.width(widthInPercentage + "%");
          el.find(".csui-side-panel-resizer").attr("aria-valuenow",widthInPercentage + "%");
          return;
        }

        function doDrag(e) {
          var pos   = getMousePos(e),
              isRTL = SmartBase.isRTL();

          if (opt.resizeWidth) {
            var newWidth;

            if (isRTL) { // if RTL
              newWidth = startPos.width + pos.x - startPos.x;
            } else { // if LTR
              newWidth = startPos.width - pos.x + startPos.x;
            }

            setWidth($el, newWidth);
          }

          if (opt.resizeHeight) {
            var newHeight = startPos.height + pos.y - startPos.y;
            $el.height(newHeight);
          }

          if (opt.onDrag) {
            opt.onDrag(e, $el, opt);
          }
        }

        function stopDragging(e) {
          $el.removeClass(CLASSNAME_IN_RESIZE_MODE);
          e.stopPropagation();
          e.preventDefault();

          $(document).off('mousemove.rsz', opt.dragFunc);
          $(document).off('mouseup.rsz', stopDragging);

          if (window.Touch || navigator.maxTouchPoints) {
            $(document).off('touchmove.rsz', opt.dragFunc);
            $(document).off('touchend.rsz', stopDragging);
          }
          $(document).off('selectstart.rsz', noop);
          $el.css("transition", startTransition);

          if (opt.onDragEnd) {
            opt.onDragEnd(e, $el, opt);
          }
          if (e.target.classList.contains('csui-side-panel-resizer') && !!opt.thresholdWidth &&
              !!opt.view) {

            var remainingLef   = e.target.parentElement.offsetLeft,
                currentWidth   = e.target.parentElement.offsetWidth,
                availableWidth = remainingLef + currentWidth,
                thresholdWidth = availableWidth * (opt.thresholdWidth / 100);

            if (currentWidth < thresholdWidth) {
              opt.view.layoutState.width = currentWidth;
            }

            if (!!opt.view.fullPagePreview) {
              if (currentWidth !== availableWidth) {
                opt.view.fullPagePreview = false;
                if (currentWidth > thresholdWidth) {
                  setWidth($el, (thresholdWidth - 10));
                }
                opt.view.trigger('panel:collapse');
              }
            } else if (currentWidth > thresholdWidth) {
              setWidth($el, availableWidth);
              opt.view.fullPagePreview = true;
              opt.view.trigger('panel:expand');
            } else {
              opt.view.trigger('panel:collapse');
            }
          } else {
            opt.view && opt.view.trigger('panel:collapse');
          }
          opt.sidePanelView && opt.sidePanelView.trigger('update:footerview');
          return false;
        }

        function getMousePos(e) {
          var pos = {x: 0, y: 0, width: 0, height: 0};
          if (typeof e.clientX === "number") {
            pos.x = e.clientX;
            pos.y = e.clientY;
          } else if (e.originalEvent.touches) {
            pos.x = e.originalEvent.touches[0].clientX;
            pos.y = e.originalEvent.touches[0].clientY;
          } else {
            return null;
          }

          return pos;
        }
      });
    };
  })(jQuery, undefined);
});