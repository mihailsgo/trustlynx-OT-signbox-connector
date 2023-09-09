csui.define('smart/lib/binf/js/binf',['nuc/lib/jquery'], function(jQuery) {

+function ($) {
  'use strict';



  function transitionEnd() {
    var el = document.createElement('binf')

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'oTransitionEnd otransitionend',
      transition       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  $.fn.emulateTransitionEnd = function (duration) {
    var called = false
    var $el = this
    $(this).one('binfTransitionEnd', function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()

    if (!$.support.transition) return

    $.event.special.binfTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function (e) {
        if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
      }
    }
  })

}(jQuery);


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-binf-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '16.0.3'

  Alert.TRANSITION_DURATION = 150

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-binf-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    selector = selector === '#' ? [] : selector
    var $parent = $(document).find(selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.closest('.binf-alert')
    }

    $parent.trigger(e = $.Event('close.binf.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('binf-in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.binf.alert').remove()
    }

    $.support.transition && $parent.hasClass('binf-fade') ?
      $parent
        .one('binfTransitionEnd', removeElement)
        .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('binf.alert')

      if (!data) $this.data('binf.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.binf_alert

  $.fn.binf_alert             = Plugin
  $.fn.binf_alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.binf_alert.noConflict = function () {
    $.fn.binf_alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.binf.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);



+function ($) {
  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element  = $(element)
    this.options   = $.extend({}, Button.DEFAULTS, options)
    this.isLoading = false
  }

  Button.VERSION  = '16.0.3'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }

  Button.prototype.setState = function (state) {
    var d    = 'disabled'
    var $el  = this.$element
    var val  = $el.is('input') ? 'val' : 'html'
    var data = $el.data()

    state = state + 'Text'

    if (data.resetText == null) $el.data('resetText', $el[val]())

    // push to event loop to allow forms to submit
    setTimeout($.proxy(function () {
      $el[val](data[state] == null ? this.options[state] : data[state])

      if (state == 'loadingText') {
        this.isLoading = true
        $el.addClass(d).attr(d, d)
      } else if (this.isLoading) {
        this.isLoading = false
        $el.removeClass(d).removeAttr(d)
      }
    }, this), 0)
  }

  Button.prototype.toggle = function () {
    var changed = true
    var $parent = this.$element.closest('[data-binf-toggle="buttons"]')

    if ($parent.length) {
      var $input = this.$element.find('input')
      if ($input.prop('type') == 'radio') {
        if ($input.prop('checked') && this.$element.hasClass('binf-active')) changed = false
        else $parent.find('.binf-active').removeClass('binf-active')
      }
      if (changed) $input.prop('checked', !this.$element.hasClass('binf-active')).trigger('change')
    } else {
      this.$element.attr('aria-pressed', !this.$element.hasClass('binf-active'))
    }

    if (changed) this.$element.toggleClass('binf-active')
  }


  // BUTTON PLUGIN DEFINITION
  // ========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.button')
      var options = typeof option == 'object' && option

      if (!data) $this.data('binf.button', (data = new Button(this, options)))

      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  var old = $.fn.binf_button

  $.fn.binf_button             = Plugin
  $.fn.binf_button.Constructor = Button


  // BUTTON NO CONFLICT
  // ==================

  $.fn.binf_button.noConflict = function () {
    $.fn.binf_button = old
    return this
  }


  // BUTTON DATA-API
  // ===============

  $(document)
    .on('click.binf.button.data-api', '[data-binf-toggle^="button"]', function (e) {
      var $btn = $(e.target)
      if (!$btn.hasClass('binf-btn')) $btn = $btn.closest('.binf-btn')
      Plugin.call($btn, 'toggle')
      e.preventDefault()
    })
    .on('focus.binf.button.data-api blur.binf.button.data-api', '[data-binf-toggle^="button"]', function (e) {
      $(e.target).closest('.binf-btn').toggleClass('focus', /^focus(in)?$/.test(e.type))
    })

}(jQuery);


+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element)
    this.$indicators = this.$element.find('.binf-carousel-indicators')
    this.options     = options
    this.paused      =
        this.sliding     =
            this.interval    =
                this.$active     =
                    this.$items      = null

    this.options.keyboard && this.$element.on('keydown.binf.carousel', $.proxy(this.keydown, this))

    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
        .on('mouseenter.binf.carousel', $.proxy(this.pause, this))
        .on('mouseleave.binf.carousel', $.proxy(this.cycle, this))
  }

  Carousel.VERSION  = '16.0.3'

  Carousel.TRANSITION_DURATION = 600

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  }

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return
    switch (e.which) {
    case 37: this.prev(); break
    case 39: this.next(); break
    default: return
    }

    e.preventDefault()
  }

  Carousel.prototype.cycle = function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
    && !this.paused
    && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))

    return this
  }

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.binf-item')
    return this.$items.index(item || this.$active)
  }

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active)
    var willWrap = (direction == 'prev' && activeIndex === 0)
                   || (direction == 'next' && activeIndex == (this.$items.length - 1))
    if (willWrap && !this.options.wrap) return active
    var delta = direction == 'prev' ? -1 : 1
    var itemIndex = (activeIndex + delta) % this.$items.length
    return this.$items.eq(itemIndex)
  }

  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.binf-item.binf-active'))

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid.binf.carousel', function () { that.to(pos) }) // yes, "slid"
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.binf-next, .binf-prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.binf-item.binf-active')
    var $next     = next || this.getItemForDirection(type, $active)
    var isCycling = this.interval
    var direction = type == 'next' ? 'left' : 'right'
    var that      = this

    if ($next.hasClass('binf-active')) return (this.sliding = false)

    var relatedTarget = $next[0]
    var slideEvent = $.Event('slide.binf.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    })
    this.$element.trigger(slideEvent)
    if (slideEvent.isDefaultPrevented()) return

    this.sliding = true

    isCycling && this.pause()

    if (this.$indicators.length) {
      this.$indicators.find('.binf-active').removeClass('binf-active')
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
      $nextIndicator && $nextIndicator.addClass('binf-active')
    }

    var slidEvent = $.Event('slid.binf.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
    if ($.support.transition && this.$element.hasClass('binf-slide')) {
      var directionClass = 'binf-' + direction,
		  typeClass = 'binf-' + type;
      $next.addClass(typeClass)
      $next[0].offsetWidth // force reflow
      $active.addClass(directionClass)
      $next.addClass(directionClass)
      $active
          .one('binfTransitionEnd', function () {
            $next.removeClass([typeClass, directionClass].join(' ')).addClass('binf-active')
            $active.removeClass(['binf-active', directionClass].join(' '))
            that.sliding = false
            setTimeout(function () {
              that.$element.trigger(slidEvent)
            }, 0)
          })
          .emulateTransitionEnd(Carousel.TRANSITION_DURATION)
    } else {
      $active.removeClass('binf-active')
      $next.addClass('binf-active')
      this.sliding = false
      this.$element.trigger(slidEvent)
    }

    isCycling && this.cycle()

    return this
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.carousel')

      // For the next/prev chevrons, de-binf the property names so the action can be determined a little later:
      if ( option.hasOwnProperty( "binfSlide" ) ) {
        option.slide = option.binfSlide;
        delete option.binfSlide;
      }

      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('binf.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) action = action.replace( /binf-/i, "" ), data[action]() // De-binf the action name to match the corresponding function name
      else if (options.interval) data.pause().cycle()
    })
  }

  var old = $.fn.binf_carousel

  $.fn.binf_carousel             = Plugin
  $.fn.binf_carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.binf_carousel.noConflict = function () {
    $.fn.binf_carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  var clickHandler = function (e) {
    var $this   = $(this)
    var href = $this.attr('href')
    if (href) {
      href = href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7
    }

    var target  = $this.attr('data-binf-target') || href
    var $target = $(document).find(target)

    if (!$target.hasClass('binf-carousel')) return

    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-binf-slide-to')
    if (slideIndex) options.interval = false

    Plugin.call($target, options)

    if (slideIndex) {
      $target.data('binf.carousel').to(slideIndex)
    }

    e.preventDefault()
  }

  $(document)
        .on('touchend click.binf.carousel.data-api', '[data-binf-slide]', clickHandler)
        .on('touchend click.binf.carousel.data-api', '[data-binf-slide-to]', clickHandler)

  $(window).on('beforeload', function () {
    $('[data-binf-ride="carousel"]').each(function () {
      var $carousel = $(this)
      Plugin.call($carousel, $carousel.data())
    })
  })

}(jQuery);



+function ($) {
  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = function (element, options) {
    this.$element      = $(element)
    this.options       = $.extend({}, Collapse.DEFAULTS, options)
    this.$trigger      = $(this.options.trigger).filter('[href="#' + element.id + '"], [data-binf-target="#' + element.id + '"]')
    this.transitioning = null

    if (this.options.parent) {
      this.$parent = this.getParent()
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger)
    }

    if (this.options.toggle) this.toggle()
  }

  Collapse.VERSION  = '16.0.3'

  Collapse.TRANSITION_DURATION = 350

  Collapse.DEFAULTS = {
    toggle: true,
    trigger: '[data-binf-toggle="collapse"]'
  }

  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('binf-width')
    return hasWidth ? 'width' : 'height'
  }

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('binf-in')) return

    var activesData
    var actives = this.$parent && this.$parent.children('.binf-panel').children('.binf-in,' +
                                                                                ' .binf-collapsing')

    if (actives && actives.length) {
      activesData = actives.data('binf.collapse')
      if (activesData && activesData.transitioning) return
    }

    var startEvent = $.Event('show.binf.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    if (actives && actives.length) {
      Plugin.call(actives, 'hide')
      activesData || actives.data('binf.collapse', null)
    }

    var dimension = this.dimension()

    this.$element
      .removeClass('binf-collapse')
      .addClass('binf-collapsing')[dimension](0)
      .attr('aria-expanded', true)

    this.$trigger
      .removeClass('binf-collapsed')
      .attr('aria-expanded', true)

    this.transitioning = 1

    var complete = function () {
      this.$element
        .removeClass('binf-collapsing')
        .addClass('binf-collapse binf-in')[dimension]('')
      this.transitioning = 0
      this.$element
        .trigger('shown.binf.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    var scrollSize = $.camelCase(['scroll', dimension].join('-'))

    this.$element
      .one('binfTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize])
  }

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('binf-in')) return

    var startEvent = $.Event('hide.binf.collapse')
    this.$element.trigger(startEvent)
    if (startEvent.isDefaultPrevented()) return

    var dimension = this.dimension()

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight

    this.$element
      .addClass('binf-collapsing')
      .removeClass('binf-collapse binf-in')
      .attr('aria-expanded', false)

    this.$trigger
      .addClass('binf-collapsed')
      .attr('aria-expanded', false)

    this.transitioning = 1

    var complete = function () {
      this.transitioning = 0
      this.$element
        .removeClass('binf-collapsing')
        .addClass('binf-collapse')
        .trigger('hidden.binf.collapse')
    }

    if (!$.support.transition) return complete.call(this)

    this.$element
      [dimension](0)
      .one('binfTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)
  }

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('binf-in') ? 'hide' : 'show']()
  }

  Collapse.prototype.getParent = function () {
    return $(this.options.parent)
      .find('[data-binf-toggle="collapse"][data-binf-parent="' + this.options.parent + '"]')
      .each($.proxy(function (i, element) {
        var $element = $(element)
        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element)
      }, this))
      .end()
  }

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('binf-in')

    $element.attr('aria-expanded', isOpen)
    $trigger
      .toggleClass('binf-collapsed', !isOpen)
      .attr('aria-expanded', isOpen)
  }

  function getTargetFromTrigger($trigger) {
    var href
    var target = $trigger.attr('data-binf-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7

    return $(document).find(target)
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.collapse')
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && option == 'show') options.toggle = false
      if (!data) $this.data('binf.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_collapse

  $.fn.binf_collapse             = Plugin
  $.fn.binf_collapse.Constructor = Collapse


  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.binf_collapse.noConflict = function () {
    $.fn.binf_collapse = old
    return this
  }


  // COLLAPSE DATA-API
  // =================

  $(document).on('click.binf.collapse.data-api', '[data-binf-toggle="collapse"]', function (e) {
    var $this   = $(this)

    if (!$this.attr('data-binf-target')) e.preventDefault()

    var $target = getTargetFromTrigger($this)
    var data    = $target.data('binf.collapse')
    var option  = data ? 'toggle' : $.extend({}, $this.data(), { trigger: this })

    Plugin.call($target, option)
  })

}(jQuery);



+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.binf-dropdown-backdrop'
  var toggle   = '[data-binf-toggle="dropdown"]'
  var className   = '.binf-dropdown-menu'
  var Dropdown = function (element) {
    $(element).on('click.binf.dropdown', this.toggle)
    $(element).next(className).on('keydown', this.keydown);
  }

  Dropdown.VERSION = '16.0.3'

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.binf-disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('binf-open')

    clearMenus();
    $.fn.binf_dropdown_submenu.clearSubMenus();

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.binf-navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
      }

      $this.trigger('binf.dropdown.before.show');

      var relatedTarget = { relatedTarget: this }
      var button = e && e.which
      $parent.trigger(e = $.Event('show.binf.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true')

      $parent
        .toggleClass('binf-open')
        .trigger('shown.binf.dropdown', relatedTarget)

      if (button == undefined) {  // opening by keyboard such as enter(13) or space(32) or arrow
        // WAI-ARIA keyboard navigation for menu: put focus on first menu item after open
        $parent.find('li:first a').trigger('focus')
      }

      $this.trigger('binf.dropdown.after.show');
    }

    if ($parent.find('.binf-dropdown-menu').length) {
      $parent.find('.binf-dropdown-menu').off('dragenter').on('dragenter',
          Dropdown.prototype.dragenter);
    }

    return false
  }

  // [OT]: adding dragover prototype to drop down menu, such that when dragging files to nodes
  // table over drop down menu, immediately it has to close the menu, in which case, if it
  // requires to still keep open, in such cases the following prototype can be override.
  Dropdown.prototype.dragenter = function (e) {
    clearMenus(e);
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32|35|36)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

    var $this = $(this)
    var $parent  = getParent($this)
    var isActive = $parent.hasClass('binf-open')

    if (isActive && e.which == 32) return

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.binf-disabled, :disabled')) return

    if ((!isActive && e.which != 27) || (isActive && e.which == 27)) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    if (!isActive && e.which == 32) {
      return $this.trigger('click')
    }

    var desc = ' li:not(.binf-divider) a'
    var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc).filter(':visible')

    if (!$items.length) return

    var index = $items.index(e.target)

    if (e.which == 38 && index > 0)                 index--                        // up
    if (e.which == 40 && index < $items.length - 1) index++                        // down
    if (e.which == 36)                              index = 0                      // home
    if (e.which == 35)                              index = $items.length - 1      // end
    if (!~index)                                      index = 0

    $items.eq(index).trigger('focus')
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('binf-open')) return

      $parent.trigger(e = $.Event('hide.binf.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('binf-open').trigger('hidden.binf.dropdown', relatedTarget)
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-binf-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(document).find(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('dropdown')

      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.binf_dropdown

  $.fn.binf_dropdown             = Plugin
  $.fn.binf_dropdown.Constructor = Dropdown
  $.fn.binf_dropdown.clearMenus = clearMenus


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.binf_dropdown.noConflict = function () {
    $.fn.binf_dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.binf.dropdown.data-api', clearMenus)
    .on('click.binf.dropdown.data-api', '.binf-dropdown form', function (e) { e.stopPropagation() })
    .on('click.binf.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.binf.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.binf.dropdown.data-api', className + '[role="menu"]', Dropdown.prototype.keydown)
    .on('keydown.binf.dropdown.data-api', className + '[role="listbox"]', Dropdown.prototype.keydown)

}(jQuery);

+function ($) {
  'use strict';

  // DROPDOWN SUBMENU CLASS DEFINITION
  // =========================

  var backdrop = '.binf-dropdown-backdrop'
  var toggle   = '[data-binf-toggle="dropdown-submenu"]'
  var className   = '.binf-dropdown-submenu'
  var dataKey  = 'binf.dropdown.submenu'
  var showDelay  = 500
  var hideDelay  = 500
  var DropdownSubMenu = function (element) {
    this.init(element);
  }

  DropdownSubMenu.VERSION = '16.0.3'

  DropdownSubMenu.prototype.init = function (element) {
    this.$element  = $(element);
    this.$element.find('>a').attr('aria-expanded', 'false');
    this.$element.on('click.binf.dropdown.submenu', $.proxy(this.toggle, this));
    this.$element.on('keydown.binf.dropdown.submenu', $.proxy(this.keydown, this));

   // this.$element.on('mouseenter.binf.dropdown.submenu.data-api', $.proxy(this.enter, this));
    //this.$element.on('mouseleave.binf.dropdown.submenu.data-api', $.proxy(this.leave, this));
  }

  DropdownSubMenu.prototype.enter = function (obj) {
    var self = _getOrConstruct.call(this, obj);
    if (self && self.$element && self.$element.hasClass('binf-open')) {
      self.hoverState = 'in'
      return
    }
    clearTimeout(self.timeout)
    self.hoverState = 'in'

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show(obj)
    }, showDelay)
  }  

  DropdownSubMenu.prototype.leave = function (obj) {
    var self = _getOrConstruct.call(this, obj);
    if (self && self.$element && !self.$element.hasClass('binf-open')) {
      self.hoverState = 'out';
      return;
    }

    clearTimeout(self.timeout)

    self.hoverState = 'out'
    // obj.stopPropagation();
    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide(obj)
    }, hideDelay)
  }

  DropdownSubMenu.prototype.show = function (e) {
    if (this.$element.is('.binf-disabled, :disabled')) return
    if (this.$element.hasClass('binf-open')) return

    this.$element.trigger('binf.dropdown.submenu.before.show');

    var relatedTarget = { relatedTarget: this }
    var button = e && e.which
    this.$element.trigger(e = $.Event('show.binf.dropdown.submenu', relatedTarget))

    if (e.isDefaultPrevented()) return

    // Clear Siblings
    clearChildren(this.$element.parent());
    if (!this.$element.parents('.binf-dropdown.binf-open').length) {
      // Close all dropdowns if this submenu is not inside a dropdown
      $.fn.binf_dropdown.clearMenus();
    }

    this.$element.find('>a').attr('aria-expanded', 'true')

    this.$element
      .toggleClass('binf-open')
      .trigger('shown.binf.dropdown.submenu', relatedTarget)

    this.$element.trigger('binf.dropdown.submenu.after.show');

	if (button == undefined) {  // opening by keyboard such as enter(13) or space(32) or arrow
      // WAI-ARIA keyboard navigation for menu: put focus on first menu item after open
      this.$element.find('ul > li:first a').trigger('focus')
    }

    if (this.$element.find('.binf-dropdown-submenu').length) {
      this.$element.find('.binf-dropdown-submenu').off('dragenter').on('dragenter',
      DropdownSubMenu.prototype.dragenter);
    }
  }

  DropdownSubMenu.prototype.hide = function (e) {
    clearChildren(this.$element.parent());
  }

  DropdownSubMenu.prototype.toggle = function (e) {
    var self = _getOrConstruct.call(this, e);

    if (self.$element.is('.binf-disabled, :disabled')) return

    if (self.$element.find('.binf-dropdown-menu').has(e.target).length) {
      clearChildren(self.$element);
      e.stopPropagation();
      return;
    }

    var isActive = self.$element.hasClass('binf-open')
    if (!isActive) {
      this.show(e);
    } else {
      this.hide(e);
    }
    return false
  }

  // [OT]: adding dragover prototype to drop down menu, such that when dragging files to nodes
  // table over drop down menu, immediately it has to close the menu, in which case, if it
  // requires to still keep open, in such cases the following prototype can be override.
  DropdownSubMenu.prototype.dragenter = function (e) {
    clearSubMenus(e);
  }

  DropdownSubMenu.prototype.keydown = function (e) {
    if (!/(35|36|37|38|39|40|9|32|13|27)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return
    var self = _getOrConstruct.call(this, e);
    var $this = self.$element;
    var isActive  = $this.hasClass('binf-open'),
        isCurrent = self.$element.is($(e.target)) || self.$element.find(">a").is($(e.target)),
        isPullDown= $this.hasClass('binf-pull-down');

    if (isActive && e.which == 32) return

    if ($this.is('.binf-disabled, :disabled')) return

    if (isActive) {
      if ( e.which == 27 || e.which == 37 || (isCurrent && (isPullDown ? e.which == 38: e.which == 37))) {
        e.preventDefault()
        e.stopPropagation()
        $this.find("a:first").trigger('focus')
        self.hide();
      } else if (!isCurrent) {
        var desc = ' li:not(.binf-divider) a'
        var $items = $this.find('[role="menu"]' + desc + ', [role="listbox"]' + desc).filter(':visible')

        if (!$items.length) return

        var index = $items.index(e.target)
        var stopPropagation = true

        switch (e.which) {
          case 38:  //up
            if(index > 0) index--
            break
          case 40:  //down
            if(index < $items.length - 1) index++
            break
          case 36:  //home
            index = 0
            break
          case 35:  //end
            index = $items.length - 1
            break
          default:
            stopPropagation = false
        }

        if(stopPropagation) {
          e.preventDefault()
          e.stopPropagation()
          if(!~index) index = 0
          $items.eq(index).trigger('focus')
        }
      }
    } else {
      if (e.which == 32 || e.which == 13 || (isCurrent && (isPullDown ? e.which == 40:  e.which == 39))) {
        e.preventDefault()
        e.stopPropagation()
        self.show();
      }
    }
  }

  function _getOrConstruct(obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data(dataKey)

    if (!self) {
      self = new this.constructor(obj.currentTarget)
      $(obj.currentTarget).data(dataKey, self)
    }
    return self;
  }

  function clearSubMenu(e) {
    var $this         = $(this)
    var relatedTarget = { relatedTarget: this }

    if (!$this.hasClass('binf-open')) return

    $this.trigger(e = $.Event('hide.binf.dropdown.submenu', relatedTarget))

    if (e.isDefaultPrevented()) return

    $this.find('>a').attr('aria-expanded', 'false')
    $this.removeClass('binf-open').trigger('hidden.binf.dropdown.submenu', relatedTarget)
  }

  function clearChildren($this) {
    $this.find(className).each(clearSubMenu);
  }

  function clearSubMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(className).each(clearSubMenu)
  }

  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data(dataKey)

      if (!data) $this.data(dataKey, (data = new DropdownSubMenu(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_dropdown_submenu

  $.fn.binf_dropdown_submenu             = Plugin
  $.fn.binf_dropdown_submenu.Constructor = DropdownSubMenu
  $.fn.binf_dropdown_submenu.clearSubMenus = clearSubMenus


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.binf_dropdown_submenu.noConflict = function () {
    $.fn.binf_dropdown_submenu = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.binf.dropdown.submenu.data-api', clearSubMenus)
    .on('click.binf.dropdown.submenu.data-api', toggle, DropdownSubMenu.prototype.toggle)
    .on('keydown.binf.dropdown.submenu.data-api', toggle, DropdownSubMenu.prototype.keydown)
    .on('keydown.binf.dropdown.submenu.data-api', className + '[role="menu"]', DropdownSubMenu.prototype.keydown)

}(jQuery);



+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options        = options
    this.$body          = $(document.body)
    this.$element       = $(element)
    this.$backdrop      =
    this.isShown        = null
    this.scrollbarWidth = 0

    if (this.options.remote) {
      this.$element
        .find('.binf-modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.binf.modal')
        }, this))
    }
  }

  Modal.VERSION  = '16.0.3'

  Modal.TRANSITION_DURATION = 300
  Modal.BACKDROP_TRANSITION_DURATION = 150

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  var defaultContainer

  function getDefaultContainer () {
    if (!defaultContainer || !$.contains(document.body, defaultContainer)) {
      defaultContainer = $('<div>', {'class': 'binf-widgets'}).appendTo(document.body)[0]
    }
    return defaultContainer
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.binf.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.setScrollbar()
    this.$body.addClass('binf-modal-open')

    this.escape()
    this.resize()

    this.$element.on('click.dismiss.binf.modal', '[data-binf-dismiss="modal"]', $.proxy(this.hide, this))

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('binf-fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(getDefaultContainer()) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      if (that.options.backdrop) that.adjustBackdrop()
      that.adjustDialog()

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element
        .addClass('binf-in')
        .attr('aria-hidden', false)

      that.enforceFocus()

      var e = $.Event('shown.binf.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$element.find('.binf-modal-dialog') // wait for modal to slide in
          .one('binfTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.binf.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.escape()
    this.resize()

    $(document).off('focusin.binf.modal')

    this.$element
      // .removeClass('binf-in')
      .attr('aria-hidden', true)
      .off('click.dismiss.binf.modal')

    $.support.transition && this.$element.hasClass('binf-fade') ?
      this.$element
        .one('binfTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.binf.modal') // guard against infinite focus loop
      .on('focusin.binf.modal', $.proxy(function (e) {
        if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.binf.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.binf.modal')
    }
  }

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.binf.modal', $.proxy(this.handleUpdate, this))
    } else {
      $(window).off('resize.binf.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      // Avoid browser horizontal scrollbar after closing modal dialog, if we have more than one
      // dialog modal
      if (that.$element.parent().find(".cs-dialog.binf-modal").length <= 1) {
        that.$body.removeClass('binf-modal-open')
        that.resetScrollbar()
      }
      that.resetAdjustments()
      that.$element.trigger('hidden.binf.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('binf-fade') ? 'binf-fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="binf-modal-backdrop ' + animate + '" />')
        .prependTo(this.$element)
        .on('click.dismiss.binf.modal', $.proxy(function (e) {
          if (e.target !== e.currentTarget) return
          this.options.backdrop == 'static'
            ? this.$element[0].focus.call(this.$element[0])
            : this.hide.call(this)
        }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('binf-in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('binfTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('binf-in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('binf-fade') ?
        this.$backdrop
          .one('binfTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    if (this.options.backdrop) this.adjustBackdrop()
    this.adjustDialog()
  }

  Modal.prototype.adjustBackdrop = function () {
    this.$backdrop
      .css('height', 0)
      .css('height', this.$element[0].scrollHeight)
  }

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

    this.$element.css({
      paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    })
  }

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    })
  }

  Modal.prototype.checkScrollbar = function () {
    if (this.options.paddingWhenOverflowing !== false) {
      this.bodyIsOverflowing = document.body.scrollHeight > document.documentElement.clientHeight
    } else {
      // avoid vertical padding for scrollbar
      this.bodyIsOverflowing = false
    }

    this.scrollbarWidth = this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', '')
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'binf-modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('binf.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.binf_modal

  $.fn.binf_modal             = Plugin
  $.fn.binf_modal.Constructor = Modal

  $.fn.binf_modal.getDefaultContainer = getDefaultContainer


  // MODAL NO CONFLICT
  // =================

  $.fn.binf_modal.noConflict = function () {
    $.fn.binf_modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.binf.modal.data-api', '[data-binf-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var target  = $this.attr('data-binf-target') ||
      (href && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7

    var $target = $(document).find(target)
    var option  = $target.data('binf.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.binf.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.binf.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       =
    this.options    =
    this.enabled    =
    this.timeout    =
    this.hoverState =
    this.$element   = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '16.0.3'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="binf-tooltip" role="tooltip"><div class="binf-tooltip-arrow"></div><div class="binf-tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('binf.' + this.type)

    if (self && self.$tip && self.$tip.is(':visible')) {
      self.hoverState = 'in'
      return
    }

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('binf.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('binf.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('binf.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.binf.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('binf-fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
          .detach()
          .css({top: 0, left: 0, display: 'block'})
          .addClass('binf-' + placement)
          .data('binf.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var $container   = this.options.container ? $(this.options.container) : this.$element.parent()
        var containerDim = this.getPosition($container)

        placement = placement == 'bottom' && pos.bottom + actualHeight > containerDim.bottom ? 'top'    :
                    placement == 'top'    && pos.top    - actualHeight < containerDim.top    ? 'bottom' :
                    placement == 'right'  && pos.right  + actualWidth  > containerDim.width  ? 'left'   :
                    placement == 'left'   && pos.left   - actualWidth  < containerDim.left   ? 'right'  :
                    placement

        $tip
          .removeClass('binf-' + orgPlacement)
          .addClass('binf-' + placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        var prevHoverState = that.hoverState
        that.$element.trigger('shown.binf.' + that.type)
        that.hoverState = null

        if (prevHoverState == 'out') that.leave(that)
      }

      $.support.transition && this.$tip.hasClass('binf-fade') ?
        $tip
          .one('binfTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()
    }

    if ($tip && $tip.length) {
      $tip.off('dragenter').on('dragenter', $.proxy(Tooltip.prototype.dragenter, this));
    }
  }

  // [OT]: adding dragenter prototype to pop over, such that when dragging files to nodes
  // table over pop over body, immediately it has to close the pop over, in which case, if it
  // requires to still keep open, in such cases the following prototype can be override.
  Tooltip.prototype.dragenter = function (e) {
    this.$element.binf_popover('destroy');
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  = offset.top  + marginTop
    offset.left = offset.left + marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('binf-in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var isVertical          = /top|bottom/.test(placement)
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, isHorizontal) {
    this.arrow()
      .css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isHorizontal ? 'top' : 'left', '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.binf-tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('binf-fade binf-in binf-top binf-bottom binf-left binf-right')
  }

  Tooltip.prototype.hide = function (callback) {
    var that = this
    var $tip = this.tip()
    var e    = $.Event('hide.binf.' + this.type)

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      that.$element
        .removeAttr('aria-describedby')
        .trigger('hidden.binf.' + that.type)
      callback && callback()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('binf-in')

    $.support.transition && this.$tip.hasClass('binf-fade') ?
      $tip
        .one('binfTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof ($e.attr('data-binf-original-title')) != 'string') {
      $e.attr('data-binf-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element

    var el     = $element[0]
    var isBody = el.tagName == 'BODY'

    var elRect    = el.getBoundingClientRect()
    if (elRect.width == null) {
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
    }
    var elOffset  = isBody ? { top: 0, left: 0 } : $element.offset()
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-binf-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    return (this.$tip = this.$tip || $(this.options.template))
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.binf-tooltip-arrow'))
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('binf.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('binf.' + this.type, self)
      }
    }

    self.tip().hasClass('binf-in') ? self.leave(self) : self.enter(self)
  }

  Tooltip.prototype.destroy = function () {
    var that = this
    clearTimeout(this.timeout)
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('binf.' + that.type)
    })
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.tooltip')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('binf.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_tooltip

  $.fn.binf_tooltip             = Plugin
  $.fn.binf_tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.binf_tooltip.noConflict = function () {
    $.fn.binf_tooltip = old
    return this
  }

}(jQuery);



+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.binf_tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '16.0.3'

  Popover.DEFAULTS = $.extend({}, $.fn.binf_tooltip.Constructor.DEFAULTS, {
    placement: 'auto right',
    trigger: 'click',
    content: '',
    template: '<div class="binf-popover" role="tooltip"><div class="binf-arrow"></div><h3 class="binf-popover-title"></h3><div class="binf-popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.binf_tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.binf-popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.binf-popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('binf-fade binf-top binf-bottom binf-left binf-right binf-in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.binf-popover-title').html()) $tip.find('.binf-popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-binf-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.binf-arrow'))
  }

  Popover.prototype.tip = function () {
    if (!this.$tip) this.$tip = $(this.options.template)
    return this.$tip
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.popover')
      var options = typeof option == 'object' && option

      if (!data && option == 'destroy') return
      if (!data) $this.data('binf.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_popover

  $.fn.binf_popover             = Plugin
  $.fn.binf_popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.binf_popover.noConflict = function () {
    $.fn.binf_popover = old
    return this
  }

}(jQuery);



+function ($) {
  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  function ScrollSpy(element, options) {
    var process  = $.proxy(this.process, this)

    this.$body          = $('body')
    this.$scrollElement = $(element).is('body') ? $(window) : $(element)
    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)
    this.optionTarget   = this.options.target || ''
    this.selector       = (this.options.target || '') + ' .binf-nav li > a'
    this.offsets        = []
    this.targets        = []
    this.activeTarget   = null
    this.scrollHeight   = 0

    this.$scrollElement.on('scroll.binf.scrollspy', process)
    this.refresh()
    this.process()
  }

  ScrollSpy.VERSION  = '16.0.3'

  ScrollSpy.DEFAULTS = {
    offset: 10
  }

  ScrollSpy.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
  }

  ScrollSpy.prototype.refresh = function () {
    var self         = this,
        offsetMethod = 'offset',
        offsetBase   = 0,
        scrollEleObject = this.$scrollElement[0];


    if (!(scrollEleObject !== null && scrollEleObject === scrollEleObject.window)) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.offsets = []
    this.targets = []
    this.scrollHeight = this.getScrollHeight()

    var $parentTarget = this.$body.find(this.optionTarget).parent()

    this.$body
      .find(this.selector)
      .map(function () {
        var $el   = $(this)
        var href  = $el.data('target') || $el.attr('href')
        var $href = /^#./.test(href) && $parentTarget.find(href)

        return ($href
          && $href.length
          && $href.is(':visible')
          && [[$href[offsetMethod]().top + offsetBase, href]]) || null
      })
      .sort(function (a, b) { return a[0] - b[0] })
      .each(function () {
        self.offsets.push(this[0])
        self.targets.push(this[1])
      })
  }

  ScrollSpy.prototype.process = function () {
    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset
    var scrollHeight = this.getScrollHeight()
    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()
    var offsets      = this.offsets
    var targets      = this.targets
    var activeTarget = this.activeTarget
    var i

    if (this.scrollHeight != scrollHeight) {
      this.refresh()
    }

    if (scrollTop >= maxScroll) {
      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
    }

    if (activeTarget && scrollTop < offsets[0]) {
      this.activeTarget = null
      return this.clear()
    }

    for (i = offsets.length; i--;) {
      activeTarget != targets[i]
        && scrollTop >= offsets[i]
        && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
        && this.activate(targets[i])
    }
  }

  ScrollSpy.prototype.activate = function (target) {
    var selector = this.selector +
                   '[data-binf-target="' + target + '"],' +
                   this.selector + '[href="' + target + '"]'

    var active = $(selector).parents('li');

    if (!active.hasClass('binf-hidden')) {
      this.activeTarget = target;

      this.clear()
      active.addClass('binf-active')

      if (active.parent('.binf-dropdown-menu').length) {
        active = active
            .closest('li.binf-dropdown')
            .addClass('binf-active')
      }

      active.trigger('activate.binf.scrollspy');
    }
  }

  ScrollSpy.prototype.clear = function () {
    $(this.selector)
      .parentsUntil(this.options.target, '.binf-active')
      .removeClass('binf-active')
  }


  // SCROLLSPY PLUGIN DEFINITION
  // ===========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('binf.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_scrollspy

  $.fn.binf_scrollspy             = Plugin
  $.fn.binf_scrollspy.Constructor = ScrollSpy


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.binf_scrollspy.noConflict = function () {
    $.fn.binf_scrollspy = old
    return this
  }


  // SCROLLSPY DATA-API
  // ==================

  $(window).on('load.binf.scrollspy.data-api', function () {
    $('[data-binf-spy="scroll"]').each(function () {
      var $spy = $(this)
      Plugin.call($spy, $spy.data())
    })
  })

}(jQuery);



+function ($) {
  'use strict';

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.VERSION = '16.0.3'

  Tab.TRANSITION_DURATION = 150

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.binf-dropdown-menu)')
    var selector = $this.data('target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    if ($this.parent('li').hasClass('binf-active')) return

    var $previous = $ul.find('.binf-active:last a')
    var hideEvent = $.Event('hide.binf.tab', {
      relatedTarget: $this[0]
    })
    var showEvent = $.Event('show.binf.tab', {
      relatedTarget: $previous[0]
    })

    $previous.trigger(hideEvent)
    $this.trigger(showEvent)

    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $previous.trigger({
        type: 'hidden.binf.tab',
        relatedTarget: $this[0]
      })
      $this.trigger({
        type: 'shown.binf.tab',
        relatedTarget: $previous[0]
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .binf-active')
    var transition = callback
      && $.support.transition
      && (($active.length && $active.hasClass('binf-fade')) || !!container.find('> .binf-fade').length)

    function next() {
      // when transitions overlap, make sure to deactivate the really active tab
      var $active = container.find('> .binf-active')
      if ($active[0] === element[0]) return

      $active
        .removeClass('binf-active')
        .find('> .binf-dropdown-menu > .binf-active')
          .removeClass('binf-active')

      // only change 'aria-expanded' if this attribute was set
      if ($active.find('[data-binf-toggle="tab"]').attr('aria-expanded') !== undefined) {
        $active
          .find('[data-binf-toggle="tab"]')
            .attr('aria-expanded', false)
      }

      element.addClass('binf-active')

      // only set 'aria-expanded' for dropdown menu
      if (element.parent('.binf-dropdown-menu').length > 0) {
        element
          .find('[data-binf-toggle="tab"]')
            .attr('aria-expanded', true)
      }

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('binf-in')
      } else {
        element.removeClass('binf-fade')
      }

      if (element.parent('.binf-dropdown-menu').length > 0) {
        element
          .closest('li.binf-dropdown')
            .addClass('binf-active')
          .end()
          .find('[data-binf-toggle="tab"]')
            .attr('aria-expanded', true)
      }

      callback && callback()
    }

    $active.length && transition ?
      $active
        .one('binfTransitionEnd', next)
        .emulateTransitionEnd(Tab.TRANSITION_DURATION) :
      next()

    $active.removeClass('binf-in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('binf.tab')

      if (!data) $this.data('binf.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_tab

  $.fn.binf_tab             = Plugin
  $.fn.binf_tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.binf_tab.noConflict = function () {
    $.fn.binf_tab = old
    return this
  }


  // TAB DATA-API
  // ============

  var clickHandler = function (e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  }

  $(document)
    .on('click.binf.tab.data-api', '[data-binf-toggle="tab"]', clickHandler)
    .on('click.binf.tab.data-api', '[data-binf-toggle="pill"]', clickHandler)

}(jQuery);



+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.binf.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.binf.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))

    this.$element     = $(element)
    this.affixed      =
    this.unpin        =
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION  = '16.0.3'

  Affix.RESET    = 'binf-affix binf-affix-top binf-affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    var scrollTop    = this.$target.scrollTop()
    var position     = this.$element.offset()
    var targetHeight = this.$target.height()

    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

    if (this.affixed == 'bottom') {
      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    var initializing   = this.affixed == null
    var colliderTop    = initializing ? scrollTop : position.top
    var colliderHeight = initializing ? targetHeight : height

    if (offsetTop != null && scrollTop <= offsetTop) return 'top'
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

    return false
  }

  Affix.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset
    this.$element.removeClass(Affix.RESET).addClass('binf-affix')
    var scrollTop = this.$target.scrollTop()
    var position  = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var height       = this.$element.height()
    var offset       = this.options.offset
    var offsetTop    = offset.top
    var offsetBottom = offset.bottom
    var scrollHeight = $('body').height()

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

    if (this.affixed != affix) {
      if (this.unpin != null) this.$element.css('top', '')

      var affixType = 'binf-affix' + (affix ? '-' + affix : '')
      var e         = $.Event(affixType + '.binf.affix')

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      this.affixed = affix
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.binf.affix')
    }

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      })
    }
  }


  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('binf.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('binf.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.binf_affix

  $.fn.binf_affix             = Plugin
  $.fn.binf_affix.Constructor = Affix


  // AFFIX NO CONFLICT
  // =================

  $.fn.binf_affix.noConflict = function () {
    $.fn.binf_affix = old
    return this
  }


  // AFFIX DATA-API
  // ==============

  $(window).on('beforeload', function () {
    $('[data-binf-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
      if (data.offsetTop    != null) data.offset.top    = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);

});

csui.define('smart/themes/carbonfiber/smart.mimetype.icons',[], function () {
  return {
"csui_mime_document":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" class="csui-icon-v2 csui-icon-v2__csui_mime_document"><g><g><g><path fill="#D7DFE2" d="M4,4v24c0,1.657,1.343,3,3,3h18c1.657,0,3-1.343,3-3V7l-6-6H7C5.343,1,4,2.343,4,4z"/></g></g><g><g><path fill="#D7DFE2" d="M7,31.5c-1.93,0-3.5-1.57-3.5-3.5V4c0-1.93,1.57-3.5,3.5-3.5h15.207L28.5,6.793V28 c0,1.93-1.57,3.5-3.5,3.5H7z"/><path fill="#FFFFFF" d="M22,1l6,6v21c0,1.657-1.343,3-3,3H7c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H22 M22.414,0H22H7 C4.794,0,3,1.794,3,4v24c0,2.206,1.794,4,4,4h18c2.206,0,4-1.794,4-4V7V6.586l-0.293-0.293l-6-6L22.414,0L22.414,0z"/></g></g><g><polygon fill="#627784" points="7.459,1 4,4.459 4,5.874 8.874,1 		"/><polygon fill="#627784" points="11.626,1 4,8.626 4,10.041 13.04,1 		"/><polygon fill="#627784" points="15.793,1 4,12.793 4,14.207 17.207,1 		"/><polygon fill="#627784" points="19.959,1 4,16.959 4,18.374 21.374,1 		"/><polygon fill="#627784" points="23.063,2.063 4,21.126 4,22.541 23.77,2.77 		"/><polygon fill="#627784" points="25.146,4.146 4,25.293 4,26.707 25.853,4.853 		"/><path fill="#627784" d="M27.23,6.23L4.255,29.204c0.139,0.316,0.333,0.6,0.566,0.848L27.937,6.937L27.23,6.23z"/><path fill="#627784" d="M28,9.626L6.661,30.966C6.773,30.979,6.884,31,7,31h1.04L28,11.04V9.626z"/><polygon fill="#627784" points="28,13.792 10.793,31 12.207,31 28,15.207 		"/><polygon fill="#627784" points="28,17.959 14.959,31 16.374,31 28,19.374 		"/><polygon fill="#627784" points="28,22.126 19.126,31 20.54,31 28,23.54 		"/><polygon fill="#627784" points="28,26.292 23.293,31 24.707,31 28,27.707 		"/></g><polygon fill-rule="evenodd" clip-rule="evenodd" fill="#4D575B" points="22,1 22,7 28,7 	"/></g><g/><g/><g/></svg>',
"csui_mime_folder":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" class="csui-icon-v2 csui-icon-v2__csui_mime_folder"><g/><g/><g><g><g><path fill="#B36601" d="M1.5,27.5V6.513c0-1.11,0.897-2.013,2-2.013h7.897c0.467,0,0.936,0.167,1.319,0.472l3.668,3.239 C16.646,8.417,16.819,8.5,17,8.5h10.5c1.103,0,2,0.897,2,2v17H1.5z"/><g><path fill="#FFFFFF" d="M11.397,5c0.366,0,0.722,0.136,1.009,0.364l3.648,3.222C16.341,8.813,16.634,9,17,9h10.5 c0.828,0,1.5,0.672,1.5,1.5V27H2V6.513C2,5.684,2.672,5,3.5,5H11.397 M11.397,4H3.5C2.121,4,1,5.127,1,6.513V27v1h1h27h1v-1 V10.5C30,9.122,28.878,8,27.5,8H17c-0.027,0-0.102-0.024-0.305-0.183l-3.626-3.203l-0.02-0.018L13.027,4.58 C12.555,4.206,11.976,4,11.397,4L11.397,4z"/></g></g></g><g><path fill="#E3992E" d="M3,26h25V12c0-0.552-0.448-1-1-1H4c-0.552,0-1,0.448-1,1V26z"/></g><g><polygon fill="#DD8100" points="3,26 28,26 28,13 		"/></g></g><g/></svg>',
"csui_mime_image":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" class="csui-icon-v2 csui-icon-v2__csui_mime_image"><g/><g/><g><g><g><path fill="#0072AA" d="M7,31.5c-1.93,0-3.5-1.57-3.5-3.5V4c0-1.93,1.57-3.5,3.5-3.5h15.207L28.5,6.793V28 c0,1.93-1.57,3.5-3.5,3.5H7z"/><path fill="#FFFFFF" d="M22,1l6,6v21c0,1.657-1.343,3-3,3H7c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H22 M22.414,0H22H7 C4.794,0,3,1.794,3,4v24c0,2.206,1.794,4,4,4h18c2.206,0,4-1.794,4-4V7V6.586l-0.293-0.293l-6-6L22.414,0L22.414,0z"/></g></g><polygon fill-rule="evenodd" clip-rule="evenodd" fill="#004B71" points="22,1 22,7 28,7 	"/><path fill="#004B71" d="M19,13.025V9H9v10h4.025c0.253,2.803,2.606,5,5.475,5c3.038,0,5.5-2.462,5.5-5.5 C24,15.631,21.803,13.278,19,13.025z M10,10h8v3.025c-2.638,0.238-4.737,2.337-4.975,4.975H10V10z M18,14.051V18h-3.949 C14.284,15.923,15.923,14.284,18,14.051z M18.5,23c-2.31,0-4.197-1.756-4.449-4H19v-4.949c2.244,0.252,4,2.139,4,4.449 C23,20.981,20.981,23,18.5,23z"/><path fill="#FFFFFF" d="M19,12.025V8H9v10h4.025c0.253,2.803,2.606,5,5.475,5c3.038,0,5.5-2.462,5.5-5.5 C24,14.631,21.803,12.278,19,12.025z M10,9h8v3.025c-2.638,0.238-4.737,2.337-4.975,4.975H10V9z M18,13.051V17h-3.949 C14.284,14.923,15.923,13.284,18,13.051z M18.5,22c-2.31,0-4.197-1.756-4.449-4H19v-4.949c2.244,0.252,4,2.139,4,4.449 C23,19.981,20.981,22,18.5,22z"/></g><g/></svg>',
"csui_mime_pdf":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" class="csui-icon-v2 csui-icon-v2__csui_mime_pdf"><g><g><g><path fill="#DF3324" d="M7,31.5c-1.93,0-3.5-1.57-3.5-3.5V4c0-1.93,1.57-3.5,3.5-3.5h15.207L28.5,6.793V28 c0,1.93-1.57,3.5-3.5,3.5H7z"/><path fill="#FFFFFF" d="M22,1l6,6v21c0,1.657-1.343,3-3,3H7c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H22 M22.414,0H22H7 C4.794,0,3,1.794,3,4v24c0,2.206,1.794,4,4,4h18c2.206,0,4-1.794,4-4V7V6.586l-0.293-0.293l-6-6L22.414,0L22.414,0z"/></g></g><polygon fill-rule="evenodd" clip-rule="evenodd" fill="#BA150D" points="22,1 22,7 28,7 	"/><path fill="#BA150D" d="M25.122,18.573c-0.44-0.693-1.927-0.839-3.096-0.839c-0.611,0-1.316,0.044-2.079,0.131 c-0.536-0.304-1.054-0.646-1.517-1.015c-1.188-0.975-2.069-2.631-2.625-4.293c0.21-1.214,0.238-2.285,0.257-3.374l0.01-0.537 c0.001-0.052-0.023-0.096-0.05-0.137c0.047-0.037,0.08-0.09,0.092-0.153c0.104-0.546,0.059-0.927-0.138-1.165 c-0.2-0.241-0.48-0.257-0.607-0.241l-0.356-0.003c-0.327,0-0.588,0.248-0.698,0.661c-0.31,1.158-0.159,3.106,0.432,5.057 c-0.373,1.294-0.94,2.855-1.858,4.704c-2.08,4.188-3.667,6.501-4.751,6.84c0.193-0.591,1.142-1.95,2.665-3.088 c0.105-0.078,0.132-0.224,0.062-0.334c-0.07-0.111-0.214-0.149-0.328-0.087c-2.182,1.16-3.144,2.508-3.305,3.311 c-0.041,0.202-0.015,0.36,0.046,0.488c0.004,0.018,0.012,0.031,0.02,0.048c0.01,0.015,0.01,0.038,0.022,0.052 c0.021,0.026,0.048,0.047,0.077,0.062c0.001,0,0.001,0.002,0.002,0.002l0.439,0.226C7.981,24.963,8.138,25,8.302,25 c1.041,0,2.437-1.535,4.23-4.619c1.947-0.693,4.611-1.255,7.039-1.503c1.548,0.819,3.235,1.3,4.316,1.3 c0.901,0,1.148-0.339,1.196-0.624c0.003-0.017-0.005-0.034-0.005-0.051c0.023-0.021,0.052-0.036,0.065-0.066 C25.33,19.043,25.234,18.75,25.122,18.573z M24.614,19.186c0.047,0.051,0.054,0.089,0.053,0.12 c-0.075,0.026-0.185,0.051-0.382,0.051c-0.592,0-1.496-0.228-2.477-0.612c0.083-0.001,0.174-0.008,0.255-0.008 C24.04,18.739,24.515,19.081,24.614,19.186z M15.245,7.761c0.017-0.05,0.045-0.105,0.073-0.153c0.127,0.123,0.26,0.342,0.301,0.728 c0.004,0.04,0.03,0.07,0.051,0.102c-0.048,0.036-0.082,0.09-0.094,0.153c-0.042,0.206-0.08,0.458-0.125,0.757 c-0.046,0.308-0.105,0.684-0.182,1.106C15.071,9.308,15.057,8.316,15.245,7.761z M13.845,17.996 c0.732-1.41,1.205-2.595,1.529-3.654c0.57,1.272,1.333,2.444,2.293,3.271c0.202,0.174,0.42,0.337,0.642,0.496 c-1.706,0.304-3.569,0.801-5.337,1.513C13.254,19.116,13.545,18.575,13.845,17.996z"/><path fill="#FFFFFF" d="M25.122,17.627c-0.44-0.693-1.927-0.839-3.096-0.839c-0.611,0-1.316,0.044-2.079,0.131 c-0.536-0.304-1.054-0.646-1.517-1.015c-1.188-0.975-2.069-2.631-2.625-4.293c0.21-1.214,0.238-2.285,0.257-3.374l0.01-0.537 c0.001-0.052-0.023-0.096-0.05-0.137c0.047-0.037,0.08-0.09,0.092-0.153c0.104-0.546,0.059-0.927-0.138-1.165 c-0.2-0.241-0.48-0.257-0.607-0.241l-0.356-0.003c-0.327,0-0.588,0.248-0.698,0.661c-0.31,1.158-0.159,3.106,0.432,5.057 c-0.373,1.294-0.94,2.855-1.858,4.704c-2.08,4.188-3.667,6.501-4.751,6.84c0.193-0.591,1.142-1.95,2.665-3.088 c0.105-0.078,0.132-0.224,0.062-0.334c-0.07-0.111-0.214-0.149-0.328-0.087c-2.182,1.16-3.144,2.508-3.305,3.311 c-0.041,0.202-0.015,0.36,0.046,0.488c0.004,0.018,0.012,0.031,0.02,0.048c0.01,0.015,0.01,0.038,0.022,0.052 C7.34,23.68,7.367,23.7,7.397,23.716c0.001,0,0.001,0.002,0.002,0.002l0.439,0.226c0.144,0.073,0.3,0.11,0.464,0.11 c1.041,0,2.437-1.535,4.23-4.619c1.947-0.693,4.611-1.255,7.039-1.503c1.548,0.819,3.235,1.3,4.316,1.3 c0.901,0,1.148-0.339,1.196-0.624c0.003-0.017-0.005-0.034-0.005-0.051c0.023-0.021,0.052-0.036,0.065-0.066 C25.33,18.098,25.234,17.804,25.122,17.627z M24.614,18.24c0.047,0.051,0.054,0.089,0.053,0.12 c-0.075,0.026-0.185,0.051-0.382,0.051c-0.592,0-1.496-0.228-2.477-0.612c0.083-0.001,0.174-0.008,0.255-0.008 C24.04,17.793,24.515,18.135,24.614,18.24z M15.245,6.815c0.017-0.05,0.045-0.105,0.073-0.153c0.127,0.123,0.26,0.342,0.301,0.728 c0.004,0.04,0.03,0.07,0.051,0.102c-0.048,0.036-0.082,0.09-0.094,0.153c-0.042,0.206-0.08,0.458-0.125,0.757 c-0.046,0.308-0.105,0.684-0.182,1.106C15.071,8.362,15.057,7.37,15.245,6.815z M13.845,17.05c0.732-1.41,1.205-2.595,1.529-3.654 c0.57,1.272,1.333,2.444,2.293,3.271c0.202,0.174,0.42,0.337,0.642,0.496c-1.706,0.304-3.569,0.801-5.337,1.513 C13.254,18.17,13.545,17.629,13.845,17.05z"/></g><g/><g/><g/></svg>',
 };
});
csui.define('smart/themes/carbonfiber/smart.mimetype.colorschema.icons',[], function () {
  return {
"csui_colorschema_mime_folder":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 16 16" class="csui-icon-v2 csui-icon-v2__csui_colorschema_mime_folder"><path d="M14.15,4.16H8.42c-0.21,0-0.37-0.11-0.53-0.23L5.84,2.2C5.68,2.07,5.48,2,5.27,2H1.83 C1.37,2,0.99,2.38,0.99,2.84v9.43c0,0.4,0.33,0.73,0.73,0.73h12.55c0.4,0,0.73-0.33,0.73-0.73V5C14.99,4.53,14.61,4.16,14.15,4.16z" fill="#98A8B2" class="csui-icon-v2-colorFirst"/><path d="M5.27,2c0.21,0,0.41,0.07,0.57,0.2l2.05,1.73c0.16,0.12,0.32,0.23,0.53,0.23h5.73 c0.46,0,0.84,0.37,0.85,0.84v7.27c0,0.4-0.33,0.73-0.73,0.73H1.72c-0.4,0-0.73-0.33-0.73-0.73V2.84C0.99,2.38,1.37,2,1.83,2H5.27 M5.27,1H1.83C0.815,1-0.01,1.825-0.01,2.84v9.43c0,0.954,0.776,1.73,1.73,1.73h12.55c0.954,0,1.73-0.776,1.73-1.73V5 c-0.022-1.024-0.851-1.84-1.85-1.84H8.529C8.525,3.157,8.521,3.153,8.516,3.15L6.485,1.436C6.134,1.151,5.708,1,5.27,1L5.27,1z" fill="#FFFFFF" class="csui-icon-v2-colorSecond"/></svg>',
 };
});
csui.define('smart/themes/carbonfiber/smart.action.icons',[], function () {
  return {
"csui_action_arrow_back":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 18 18" enable-background="new 0 0 18 18" class="csui-icon-v2 csui-icon-v2-action-icon csui-icon-v2__csui_action_arrow_back"><path fill="#333333" d="M17,8.021H4.014l6.146-5.588L8.796,1L0,9.001L8.796,17l1.364-1.433l-6.15-5.59H17c0.553,0,1-0.438,1-0.978 C18,8.459,17.553,8.021,17,8.021z"/></svg>',
"csui_action_chat24":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2-action-icon csui-icon-v2__csui_action_chat24"><circle cx="16" cy="16" r="14" fill="#FFFFFF" fill-opacity="0.01" class="csui-icon-v2-state"/><path d="M16.003,7H9.336C8.452,7,7.604,7.351,6.979,7.976c-0.625,0.625-0.976,1.473-0.976,2.357v3.333 c0,0.884,0.351,1.732,0.976,2.357C7.604,16.649,8.452,17,9.336,17v1.802c0,0.743,0.454,0.922,1.01,0.396L12.67,17h3.333 c0.884,0,1.732-0.351,2.357-0.976c0.625-0.625,0.976-1.473,0.976-2.357v-3.333c0-0.884-0.351-1.732-0.976-2.357 C17.735,7.351,16.887,7,16.003,7z M25.998,15.334v3.33c0,0.89-0.34,1.73-0.97,2.36s-1.47,0.98-2.36,0.98v1.8 c0,0.1-0.01,0.18-0.02,0.24c-0.03,0.16-0.14,0.3-0.29,0.37c-0.06,0.03-0.13,0.04-0.2,0.04c-0.09,0-0.19-0.02-0.27-0.07 c-0.06-0.04-0.14-0.1-0.23-0.19l-2.32-2.19h-3.33c-0.79,0-1.55-0.28-2.15-0.79c-0.52-0.44-0.89-1.02-1.07-1.67 c-0.04-0.18,0.01-0.37,0.14-0.5l0.26-0.24c0.09-0.09,0.22-0.14,0.34-0.14h2.47c1.34,0,2.6-0.52,3.54-1.46 c0.94-0.95,1.46-2.2,1.46-3.54v-1.16c0-0.28,0.23-0.5,0.5-0.5h1.17c0.89,0,1.73,0.34,2.36,0.97S25.998,14.444,25.998,15.334z" fill="#333333" class="csui-icon-v2-metaphor0"/><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
"csui_action_close32":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2-action-icon csui-icon-v2__csui_action_close32"><circle cx="16" cy="16" r="14" fill="none" class="csui-icon-v2-state"/><path d="M9.071,9.071c0.391-0.391,1.024-0.391,1.414,0L16,14.586l5.515-5.515 c0.39-0.391,1.024-0.391,1.414,0c0.39,0.391,0.39,1.024,0,1.414L17.414,16l5.515,5.515c0.39,0.39,0.39,1.024,0,1.414 c-0.391,0.39-1.024,0.39-1.414,0L16,17.414l-5.515,5.515c-0.391,0.39-1.024,0.39-1.414,0c-0.391-0.391-0.391-1.024,0-1.414 L14.586,16l-5.515-5.515C8.68,10.094,8.68,9.461,9.071,9.071z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
"csui_action_copy32":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2-action-icon csui-icon-v2__csui_action_copy32"><circle cx="16" cy="16" r="14" fill="none" class="csui-icon-v2-state"/><g><path d="M7,19.444V8.556C7,7.696,7.703,7,8.571,7h7.071L18,9.333V10h-2.429C14.16,10,13,11.134,13,12.556V21H8.571 C7.703,21,7,20.304,7,19.444z" opacity="0.6" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><path d="M14,12.556v10.889C14,24.304,14.703,25,15.571,25h7.857C24.297,25,25,24.304,25,23.444V13.333L22.643,11 h-7.072C14.703,11,14,11.696,14,12.556z" fill="#333333" class="csui-icon-v2-metaphor1"/></g><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
"csui_action_more32":'<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="csui-icon-v2 csui-icon-v2-action-icon csui-icon-v2__csui_action_more32"><circle cx="16" cy="16" r="14" fill="none" class="csui-icon-v2-state"/><path d="M9.25,18c1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25C8.007,13.5,7,14.507,7,15.75 S8.007,18,9.25,18z M16,18c1.243,0,2.25-1.007,2.25-2.25S17.243,13.5,16,13.5s-2.25,1.007-2.25,2.25S14.757,18,16,18z M25,15.75 c0,1.243-1.007,2.25-2.25,2.25s-2.25-1.007-2.25-2.25s1.007-2.25,2.25-2.25S25,14.507,25,15.75z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
 };
});
csui.define('smart/utils/high.contrast/detector',[],function () {
  'use strict';

  var highContrast;

  function detectHighContrast() {
    // See https://github.com/hanshillen/HCMDS
    var testBackgroundColor = "rgb(127, 127, 127)";
    var lightBackgroundColor = "rgb(255, 255, 255)";
    // var darkBackgroundColor = "rgb(0, 0, 0)";
    var div = document.createElement('div');
    var style = div.style;
    style.backgroundColor = testBackgroundColor;
    style.borderWidth = '1px';
    style.borderStyle = 'solid';
    style.borderTopColor = '#ff0000';
    style.borderRightColor = '#00ffff';
    style.position = 'absolute';
    style.left = '-9999px';
    style.width = div.style.height = '2px';
    var body = document.body;
    body.appendChild(div);
    style = window.getComputedStyle(div);
    var backgroundColor = style.backgroundColor;
    if (backgroundColor === testBackgroundColor) {
      highContrast = 0;
    } else {
      if (backgroundColor === lightBackgroundColor) {
        highContrast = 2; // dark on light
      } else {
        highContrast = 1; // light on dark
      }
    }

    //    highContrast = style.borderTopColor === style.borderRightColor;
    body.removeChild(div);

    var method = highContrast ? 'add' : 'remove',
        hcMode = highContrast === 2 ? 'csui-highcontrast-dark-on-light' :
                 'csui-highcontrast-light-on-dark';

    document.documentElement.classList[method]('csui-highcontrast');
    document.documentElement.classList[method](hcMode);
  }

  return {
    load: function (name, _require, onLoad, config) {
      function ensureHighContrastDetection() {
        if (document.readyState === 'complete') {
          if (highContrast === undefined) {
            detectHighContrast();
          }
          onLoad(highContrast);
          return true;
        }
      }

      if (config.isBuild) {
        onLoad(null);
      } else {
        if (!ensureHighContrastDetection()) {
          document.addEventListener('readystatechange', ensureHighContrastDetection);
        }
      }
    }
  };
});

/**
 * This returns all the icons information which are generated by grunt.
 * ie., this file has to keep update once the new file is being introduced in Grunt.js under
 * "generateSVGs" task.
 */
csui.define('smart/controls/icons.v2/impl/core.smart.icons.v2',[
  'smart/themes/carbonfiber/smart.mimetype.icons',
  'smart/themes/carbonfiber/smart.mimetype.colorschema.icons',
  'smart/themes/carbonfiber/smart.action.icons'
], function (MimeTypeIcons, MimeTypeColorSchemaIcons, ActionIcons) {
  'use strict';

  var coreSmartIcons = [];

  MimeTypeIcons && coreSmartIcons.push(MimeTypeIcons);
  MimeTypeColorSchemaIcons && coreSmartIcons.push(MimeTypeColorSchemaIcons);
  ActionIcons && coreSmartIcons.push(ActionIcons);

  return coreSmartIcons;
});



csui.define('css!smart/controls/icons.v2/impl/icons.v2',[],function(){});
csui.define('smart/controls/icons.v2/icons.v2',[
  'module',
  'nuc/lib/underscore',
  'nuc/lib/handlebars',
  "nuc/utils/log",
  'smart/controls/icons.v2/impl/core.smart.icons.v2',
  'csui-ext!smart/controls/icons.v2/icons.v2',
  'css!smart/controls/icons.v2/impl/icons.v2'
], function (module, _,
    Handlebars,
    log,
    CoreSmartIcons,
    otherIcons) {

  var initialIcons = {
    missingIcon: '<svg class="csui-icon-v2 csui-icon-v2__icon_missing" version="1.1"' +
                 ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
                 ' x="0px" y="0px"	viewBox="0 0 12 12"' +
                 ' xml:space="preserve"><path fill="#DF3B14"' +
                 ' d="M6,12c-3.3083,0-6-2.6917-6-6s2.6917-6,6-6s6,2.6917,6,6S9.3083,12,6,12z' +
                 ' M6,0.9231' +
                 ' C3.2006,0.9231,0.9231,3.2006,0.9231,6c0,2.799,2.2775,5.0769,5.0769,5.0769c2.799,' +
                 '0,5.0769-2.2779,5.0769-5.0769	C11.0769,3.2006,8.799,0.9231,6,0.9231z"/>' +
                 '<path fill="#DF3B14"' +
                 ' d="M3.8284,9.0947c-0.2362,0-0.4724-0.0901-0.6526-0.2704c-0.3606-0.3606-0.3606-0.9447,' +
                 '0-1.3053 l4.3431-4.3436c0.3606-0.3606,0.9447-0.3606,1.3053,0s0.3606,0.9447,0,' +
                 '1.3053L4.4811,8.8242 C4.3008,9.0045,4.0646,9.0947,3.8284,9.0947z"/>' +
                 '</svg>',
  };

  function IconRegistry() {
    this._icons = {};

    // calculate the mapping from color name to the css class at creation time once
    this._colorThemesMap = {};
    var colorThemes = [
      'tree',
      'outline light',
      'outline dark',
      'ot navy',
      'ot indigo',
      'ot plum',
      'ot teal',
      'ot light blue',
      'ot steal',
      'ot cloud'
    ];
    var colorThemesMap = this._colorThemesMap;
    _.each(colorThemes, function (colorThemeName) {
      var cssClassName = colorThemeName.replace(/ /g, '-').replace(/\+/g, '').toLowerCase();
      colorThemesMap[colorThemeName] = cssClassName;
    });
  }

  _.extend(IconRegistry.prototype, {

    _isPlainObject: function (o) {
      return _.isObject(o) && o.constructor === Object;
    },

    getIconByName: function (iconName) {
      var icon = this._icons[iconName];
      if (icon) {
        return icon;
      } else {
        log.warn("Don't have icon with name " + iconName) && console.log(log.last);
        return this._icons['missingIcon'];
      }
    },

    getClassForSize: function (iconOptions) {
      switch (iconOptions.size) {
      case 'xlarge':
        return 'csui-icon-v2-size-xlarge';
      case 'large':
        return 'csui-icon-v2-size-large';
      case 'normal':
        return 'csui-icon-v2-size-normal';
      case 'small':
        return 'csui-icon-v2-size-small';
      case 'xsmall':
        return 'csui-icon-v2-size-xsmall';
      case 'contain':
        return 'csui-icon-v2-size-contain';  // scale to outer box size
      default:
        return 'csui-icon-v2-size-normal';
      }
    },

    getIconByNameWithOptions: function (iconOptions) {
      var self = this;
      var icon;
      var additionalClasses = '';
      if (iconOptions && this._isPlainObject(iconOptions)) {
        if (iconOptions.iconName) {
          icon = this.getIconByName(iconOptions.iconName);
        } else {
          throw new Error('Missing iconName in {{{icon-v2 }}} handlebars tag');
        }
        if (iconOptions.theme) {
          additionalClasses += ' csui-icon-v2-theme-' + iconOptions.theme;
        }
        // allStateByElement overrides the single state flags
        if (iconOptions.allStateByElement) {
          iconOptions.hoverStateByElement = true;
          iconOptions.activeStateByElement = true;
          iconOptions.focusStateByElement = true;
          iconOptions.disabledStateByElement = true;
        }
        if (iconOptions.hoverStateByElement) {
          additionalClasses += ' csui-icon-v2-with-hover-by-el';
        }
        if (iconOptions.activeStateByElement) {
          additionalClasses += ' csui-icon-v2-with-active-by-el';
        }
        if (iconOptions.focusStateByElement) {
          additionalClasses += ' csui-icon-v2-with-focus-by-el';
        }
        if (iconOptions.disabledStateByElement) {
          additionalClasses += ' csui-icon-v2-with-disabled-by-el';
        }
        if (iconOptions.states) {
          additionalClasses += ' csui-icon-v2-with-states';
        }
        if (iconOptions.handleRTL) {
          additionalClasses += ' smart-handle-rtl';
        }
        if (iconOptions.on) {
          additionalClasses += ' csui-icon-v2-on';
        }
        if (iconOptions.grayscale) {
          if (!iconOptions.filter) {
            additionalClasses += ' csui-icon-v2-grayscale';
            log.info("Usage of 'grayscale' is deprecated in icons-v2. Use filter='grayscale'" +
                     " instead.") && console.log(log.last);
          } else {
            log.warn("Can't use deprecated option 'grayscale' together with 'filter'. 'grayscale'" +
                     "will be ignored.") && console.log(log.last);
          }
        }
        // allow filter option only if 'theme', 'states' and 'on' attributes are NOT USED
        if (iconOptions.filter && !iconOptions.theme && !iconOptions.states && !iconOptions.on) {
          switch (iconOptions.filter) {
          case 'grayscale':
            additionalClasses += ' csui-icon-v2-filter_grayscale';
            break;
          default:
            log.warn("Specified 'filter' attribute value is not supported in icons-v2. Ignoring" +
                     " it.") && console.log(log.last);
          }
        }

        // allow colorTheme option only if 'theme', 'states' and 'on' attributes are NOT USED
        var iconOptionColorTheme = iconOptions['colorTheme'];
        if (iconOptionColorTheme) {
          if (iconOptions.theme || iconOptions.states || iconOptions.on) {
            log.debug("Specified colorTheme '" + iconOptionColorTheme +
                      "' is ignored, because at least on of the following attributes is set:" +
                      " 'theme', 'states', 'on'") && console.log(log.last);
          } else {
            var cssClassForColorTheme = self._colorThemesMap[iconOptionColorTheme.toLowerCase()];
            if (cssClassForColorTheme) {
              additionalClasses += ' csui-icon-v2-colortheme--' + cssClassForColorTheme;
            } else {
              log.warn("Specified 'colorTheme " + iconOptionColorTheme +
                       " is not supported in icons-v2. Ignoring it.") && console.log(log.last);
            }
          }
        }

        if (iconOptions.size) {
          additionalClasses += ' ' + this.getClassForSize(iconOptions);
        } else {
          // set default size
          additionalClasses += ' csui-icon-v2-size-normal';
        }

        if (additionalClasses) {
          // add the additional classes by replacing part of the existing classes in svg string
          icon = icon.replace('class="csui-icon-v2 ',
              'class="csui-icon-v2' + additionalClasses + ' ');
        }
      }
      return icon;
    },

    registerIcons: function (icons) {
      if (!this._isPlainObject(icons)) {
        throw new Error('registerIcons must have plain object as parameter');
      }
      var iconNames = _.keys(icons);
      for (var i = 0; i < iconNames.length; i++) {
        var iconName = iconNames[i];
        if (this._icons[iconName]) {
          throw new Error('duplicate icon name tried to register: ' + iconName);
        }
        this._icons[iconName] = icons[iconName];
      }
    }

  });

  var iconRegistry = new IconRegistry();  // return the instance of this class

  iconRegistry.registerIcons(initialIcons);

  var registerArrayIcons = function (arrayIcons) {
    for (var i = 0; i < arrayIcons.length; i++) {
      var iconsMap = arrayIcons[i];
      iconRegistry.registerIcons(iconsMap);
    }
  };

  if (otherIcons) {
    // otherIcons has array of objects with key for each extension
    if (_.isArray(otherIcons)) {
      registerArrayIcons(otherIcons);
    } else {
      iconRegistry.registerIcons(otherIcons);
    }
  }

  // register smart core icons.
  registerArrayIcons(CoreSmartIcons);

  Handlebars.registerHelper("icon-v2", function (options) {
    var iconOptions = options.hash;
    var icon = iconRegistry.getIconByNameWithOptions(iconOptions);
    return icon;
  });

  return iconRegistry;
});


csui.define('css!smart/controls/icon/impl/icon.view',[],function(){});
csui.define('smart/controls/icon/icon.view',['nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/lib/marionette',
  'smart/controls/icons.v2/icons.v2',
  'css!smart/controls/icon/impl/icon.view'
], function ($, _, Backbone, Marionette, iconRegistry) {
  'use strict';

  return Marionette.ItemView.extend({

    // all controls should have csui-control-view for applying common css */
    className: 'csui-icon-v2-view',

    // don't use the default div, because it wouldn't be valid html to insert a div inside a
    // span, if the icon should be displayed within a span
    tagName: 'span',

    constructor: function IconView(options) {
      options || (options = {});

      if (!options.model) {
        options.model = new Backbone.Model(
            _.pick(options, 'iconName', 'theme', 'on', 'size', 'states', 'grayscale', 'filter',
                'colorTheme', 'hoverStateByElement', 'activeStateByElement', 'focusStateByElement',
                'disabledStateByElement', 'allStateByElement'));
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    modelEvents: {
      'change': 'render'
    },

    // override render from marionette to render svg instead of template
    render: function () {
      this._ensureViewIsIntact();

      this.triggerMethod('before:render', this);

      var svgHtml = iconRegistry.getIconByNameWithOptions(this.model.attributes);
      this.attachElContent(svgHtml);
      var sizeClass = iconRegistry.getClassForSize(this.model.attributes);
      this.$el.addClass(sizeClass);
      this.isRendered = true;
      this.bindUIElements();

      this.triggerMethod('render', this);

      return this;
    },

    setIcon: function (iconName) {
      this.model.set('iconName', iconName);
    },

    setIconStateIsOn: function (on) {
      this.model.set('on', on);
    },

  });
});

csui.define('smart/behaviors/keyboard.navigation/smart.tabables.behavior',['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/marionette', 'nuc/utils/log', 'nuc/utils/base'
], function (module, _, $, Marionette, log, base) {
  'use strict';
 // this file is only for smart controls. NOT TO BE USED BY OTHER MODULES 
  log = log(module.id);

  // Default static options for the behaviour object
  var config = module.config();

  var accessibilityRegionClass = 'csui-acc-tab-region';
  var accessibilityActiveRegionClass = 'csui-acc-tab-region-active';

  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  // This behavior implements a controller for one or more views with the tabable.region.behavior
  // applied.
  var TabablesBehavior = Marionette.Behavior.extend({

        constructor: function TabablesBehavior(options, view) {
          Marionette.Behavior.prototype.constructor.apply(this, arguments);

          var self = this;

          this.view = view;
          this._pushTabableHandler();

          this.tabableRegions = [];
          this.mustSortTabableRegions = false;

          // Backbone/Marionette events (are removed in destroy)
          this.listenTo(view, 'render', this._registerEventHandlers);
          this.listenTo(view, 'destroy', this._popTabableHandler);
          this.listenTo(view, 'dom:refresh', this.setFocusInActiveTabableRegion);

          //In order to prevent tab from going outside a contained area (i.e. dialog),
          //keydown is monitored on the behavioral view. The event listener will only prevent
          //tab outside the behavior view if parameter "containTabFocus' is set to true.
          // LPAD-54770, Make sure that keydown event is registered only once after view creation
          setTimeout(function () {
            view.$el.on('keydown.csui-tabables', function (event) {
              if (event.keyCode === 9 && getOption.call(self, 'containTabFocus')) {
                return self._maintainTabFocus(event);
              }
            });
          });

          //Used for cases where focus should be removed from the active behavior region
          //and placed in the text focusable region. For example when 'escape' is used to
          //to move focus outside of a textbox area to the next tabable region.
          this.listenTo(view, 'changed:focus', this._setFocusToNextRegion);
        }, // constructor

        registerTabableRegion: function (tabableRegion) {
          if ($.contains(this.view.el, tabableRegion.view.el)) {
            this.unregisterTabableRegionBehavior(tabableRegion);
            this.tabableRegions.push(tabableRegion);
            this.mustSortTabableRegions = true;
            return true;
          } else {
            log.debug('registerTabableRegion: not registering non descendant view ' +
                      tabableRegion.view.constructor.name) &&
            console.log(log.last);
            return false;
          }
        },

        unregisterTabableRegionBehavior: function (tabableRegion) {
          if (tabableRegion) {
            if (_.contains(this.tabableRegions, tabableRegion)) {
              // remove that tabableRegionBehavior from the tabableRegions array
              log.debug('unregisterTabableRegion for view' + tabableRegion.view.constructor.name) &&
              console.log(log.last);

              this.tabableRegions = _.reject(this.tabableRegions,
                  function (trb) { return trb === tabableRegion; });

              // log.debug("Unsorted tabable regions:") && console.log(log.last);
              // _.each(this.tabableRegions, function (tabableRegionBehavior) {
              //   log.debug(" " + tabableRegionBehavior.view.constructor.name) &&
              //   console.log(log.last);
              // });

            }
          }
        },

        _pushTabableHandler: function () {
          log.debug('_pushTabableHandler in view ' + this.view.constructor.name) &&
          console.log(log.last);
          if (TabablesBehavior.tabablesHandlers.length > 0) {
            var topTabablesHandler = _.last(TabablesBehavior.tabablesHandlers);

            /*
                        var activeIdx = this._getActiveIndex();
                        if (activeIdx !== undefined) {
                          this.activeTabableRegionIndexBeforePush = activeIdx;
                          var activeTabableRegion = this.tabableRegions[activeIdx];
                          this.focusedElementBeforePush = activeTabableRegion.getCurrentlyFocusedElementFromView();
                        } else {
                          delete this.focusedElementBeforePush;
                          delete this.activeTabableRegionIndexBeforePush;
                        }
            */

            // invalidate all tabindexes in the current tabable regions before adding the new
            // "layer" of tabable regions at the top of the stack.
            // This prevents navigating by tab to any of this tabable regions.
            _.each(topTabablesHandler.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
              topTabablesHandler._clearTabIndexes.call(topTabablesHandler, tabableRegion.view);
            }, this);

          }
          TabablesBehavior.tabablesHandlers.push(this);

          // log.debug("Tabables after Push:");
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name);
          // });
        },

        _popTabableHandler: function () {
          if (TabablesBehavior.tabablesHandlers.length > 0) {

            var tabableHandlerToPop = _.last(TabablesBehavior.tabablesHandlers);

            log.debug('_popTabableHandler in view ' + tabableHandlerToPop.view.constructor.name) &&
            console.log(log.last);

            _.each(tabableHandlerToPop.tabableRegions, function (tabableRegion) {
              tabableRegion._unregisterEventHandlers.call(tabableRegion);
            });

            // LPAD-54770. Remove keydown listener
            tabableHandlerToPop.view.$el.off('keydown.csui-tabables');

            tabableHandlerToPop.stopListening(tabableHandlerToPop.view);
            TabablesBehavior.tabablesHandlers.pop();

            // after removing the tabables handler from the stack let the tabable regions, that
            // are now on top of the stack re-set its tabindex values to make it keyboard
            // navigable again
            if (TabablesBehavior.tabablesHandlers.length > 0) {
              var topTabableHandler = _.last(TabablesBehavior.tabablesHandlers);
              _.each(topTabableHandler.tabableRegions, function (tabableRegion) {
                tabableRegion.setInitialTabIndex.call(tabableRegion);
                tabableRegion._registerEventHandlers.call(tabableRegion);
              });

              topTabableHandler._setFocusInActiveTabableRegion();
            }
          }
          // log.debug("Tabables after Pop:") && console.log(log.last);
          // _.each(TabablesBehavior.tabablesHandlers, function (tabableHandler) {
          //   log.debug("    TabablesBehavior of view " + tabableHandler.view.constructor.name) &&
          //   console.log(log.last);
          // });
        },

        _sortTabableRegions: function () {
          var tabableRegions = this.tabableRegions;
          var sortedTabableRegions = [];
          var tabableRegionElements = this.view.$el.find('.' + accessibilityRegionClass);
          tabableRegionElements.each(function (index, el) {
            var trb = _.find(tabableRegions, function (tabableRegion) {
              return tabableRegion.view.el === el;
            });
            if (trb) {
              sortedTabableRegions.push(trb);
            }
          });
          this.tabableRegions = sortedTabableRegions;
          this.mustSortTabableRegions = false;

          // log.debug("Sorted tabable regions:") && console.log(log.last);
          // _.each(this.tabableRegions, function (tabableRegion) {
          //   log.debug("    " + tabableRegion.view.constructor.name) && console.log(log.last);
          // });
        },

        //Get the next tabable region with an accessible focusable element.
        _getNextActiveRegion: function (shiftTab, recursiveNavigate) {
          var regions = this.tabableRegions, i, tabableRegion;

          // don't select regions for tabable which are hidden.
          regions = _.filter(regions, function (region) {
            return !region.$el.hasClass('binf-hidden');
          });

          var lastIndex   = regions.length - 1,
              activeIndex = this._getActiveIndex(regions);

          if (recursiveNavigate) {
            i = shiftTab ? (activeIndex === 0 ? lastIndex : activeIndex - 1) :
                (activeIndex === lastIndex ? 0 : activeIndex + 1);
          } else {
            i = shiftTab ? (activeIndex === 0 ? 0 : activeIndex - 1) :
                (activeIndex === lastIndex ? lastIndex : activeIndex + 1);
          }

          // return tabableRegion if it has only one tabable element.
          if (regions.length === 1) {
            tabableRegion = regions[0];
            return tabableRegion;
          }

          while (i != activeIndex) {
            tabableRegion = regions[i];
            var elToFocus = tabableRegion.getCurrentlyFocusedElementFromView(shiftTab);
            if (tabableRegion.view.isTabable() && elToFocus &&
                base.isVisibleInWindowViewport(elToFocus)) {
              // Do not focus elements out of the visible viewport rectangle;
              // it brings them to the visible screen, ignoring the absolute
              // positioning or transforms, if they were applied earlier
              return tabableRegion;
            }

            if (shiftTab) {
              if (i === 0) {
                i = recursiveNavigate ? lastIndex : activeIndex;
              }
              else if (i > 0) {
                --i;
              }
            }
            else {
              if (i === lastIndex) {
                i = recursiveNavigate ? 0 : activeIndex;
              }
              else if (i < lastIndex) {
                ++i;
              }
            }
          }
        },
        //Due to cases (like the target browser where regions are added and removed throughout a dialog
        //display) where regions may be placed out of order due to views being dynamically added and removed
        //throughout the life cycle of the parent container, sort order is reset on every index request.
        _getActiveIndex: function (regions) {
          if (this.currentlyActiveTabableRegion) {
            this._sortTabableRegions();
            var currentlyActive = this.currentlyActiveTabableRegion,
              tabableRegions  = this.tabableRegions;
            if (!!regions) {
              tabableRegions = regions;
            }
            for (var i = 0; i < tabableRegions.length; i++) {
              if (currentlyActive.view.cid === tabableRegions[i].view.cid) {
                return i;
              }
            }
          }
        },

        _deactivateCurrentActiveTabableRegion: function () {
          var activeIdx = this._getActiveIndex();

          if (activeIdx !== undefined && !!this.tabableRegions[activeIdx]) {
            var activeView = this.tabableRegions[activeIdx].view;
            var tabRegionEl = activeView.$el;

            tabRegionEl.removeClass(accessibilityActiveRegionClass);
            delete this.currentlyActiveTabableRegion;
            if (activeView.accDeactivateTabableRegion) {
              log.debug('deactivating tabable region ' + activeView.constructor.name) &&
              console.log(log.last);

              this.tabableRegions[activeIdx].ignoreFocusEvents = true;
              activeView.accDeactivateTabableRegion.call(activeView);
              this.tabableRegions[activeIdx].ignoreFocusEvents = false;
            }
          }
          return activeIdx;
        },

        _setTabableRegionActive: function (tabableRegion, shiftTab) {
          log.debug('activating ' + tabableRegion.view.constructor.name + ' as active tabable' +
                    ' region') && console.log(log.last);

          this._deactivateCurrentActiveTabableRegion();
          tabableRegion.view.$el.addClass(accessibilityActiveRegionClass);
          this.currentlyActiveTabableRegion = tabableRegion;
          if (tabableRegion.view.accActivateTabableRegion) {
            tabableRegion.ignoreFocusEvents = true;
            tabableRegion.view.accActivateTabableRegion.call(tabableRegion.view, shiftTab);
            tabableRegion.ignoreFocusEvents = false;
          }
        },

        _setFocusInActiveTabableRegion: function (shiftTab) {
          if (this.currentlyActiveTabableRegion && 
                document.body.contains(this.currentlyActiveTabableRegion.el)) {
            // this._setTabableRegionActive(this.currentlyActiveTabableRegion);
            this.currentlyActiveTabableRegion.setFocus(shiftTab);
          } else {
            // try to focus on a preferred region if no one is known as the active region, but
            // don't store it as the currently active one. This must be actively done by a
            // tabable region.
            var tabableRegionsByWeight = _.sortBy(this.tabableRegions, function (tabableRegion) {
              return tabableRegion.view.options.initialActivationWeight;
            });
            //var preferredRegion = _.last(tabableRegionsByWeight);

            var preferredRegion;
            tabableRegionsByWeight.reverse().some(function(region) {
              if (!region.options.notSetFocus) {
                preferredRegion = region;
                return true;
              }
            });

            if (preferredRegion && preferredRegion.view.options.initialActivationWeight > 0) {
              log.debug("setFocus: " + preferredRegion.view.constructor.name) && console.log(log.last);
              preferredRegion.setFocus(shiftTab);

              if (document.activeElement.tagName === 'BODY') {
                log.error("setFocus Failed: " + preferredRegion.view.constructor.name) && console.log(log.last);
              }

              log.debug("document.activeElement: " + document.activeElement.tagName) && console.log(log.last);            }
          }
        },

        _clearTabIndexes: function (view) {
          // log.debug('_clearTabIndexes in view ' + view.constructor.name) && console.log(log.last);
          // find tabable/focusable elements including the view.$el element
          var focusables = view.$el.find(TabablesBehavior.focusablesSelector).addBack(
              TabablesBehavior.focusablesSelector);
          if (focusables.length) {
            focusables.prop('tabindex', -1);
          } else {
            log.debug('_clearTabIndexes: no focusables found in ' + view.constructor.name) &&
            console.log(log.last);
          }
        },

        _maintainTabFocus: function (event) {
          var shiftTab    = event.shiftKey,
              activeIndex = this._getActiveIndex();
          //If an activeIndex is not available it is because regional focus has not
          //been set yet and this is the first tab request.
          if (activeIndex !== undefined) {
            var activeRegion = this.tabableRegions[activeIndex];
            var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
            if (!!activeRegion && activeRegion.onlastTabElement(shiftTab, event)) {
              var nextActiveRegion = this._getNextActiveRegion(shiftTab, false);
              if (!nextActiveRegion) {
                nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);

              }
              if (nextActiveRegion) {
                this._setTabableRegionActive(nextActiveRegion, shiftTab);
                this._setFocusInActiveTabableRegion(shiftTab);
              }
              return false;
            }
          }
          return true;
        },

        _setFocusToNextRegion: function setFocusToNextRegion(shiftTab) {
          var recursiveNavigate = getOption.call(this, 'recursiveNavigation');
          var nextActiveRegion = this._getNextActiveRegion(shiftTab, recursiveNavigate);
          if (nextActiveRegion) {
            this._setTabableRegionActive(nextActiveRegion);
            this._setFocusInActiveTabableRegion();
          }
        }
      },
      {
        // array with all TabablesBehavior instances
        tabablesHandlers: [],

        focusablesSelector: 'a[href], area[href], input, select, textarea, button,' +
                            ' iframe, object, embed, *[tabindex], *[contenteditable]',

        clearTabIndexes: function (view) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, view.el)) {
            tabablesBehavior._clearTabIndexes.call(tabablesBehavior, view);
          }
        },

        setTabableRegionActive: function (tabableRegion) {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior && $.contains(tabablesBehavior.view.el, tabableRegion.view.el)) {
            tabablesBehavior._setTabableRegionActive.call(tabablesBehavior, tabableRegion);
          }
        },

        registerTabableRegion: function (tabableRegion) {
          log.debug('registerTabableRegion for view ' + tabableRegion.view.constructor.name) &&
          console.log(log.last);

          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            return tabablesBehavior.registerTabableRegion.call(tabablesBehavior, tabableRegion);
          }
        },

        unregisterTabableRegion: function (tabableRegion) {
          if (tabableRegion) {
            // make it simple: don't search for the tabables behavior instance. Just remove it
            // from everyone.
            _.each(TabablesBehavior.tabablesHandlers, function (tabablesBehavior) {
              tabablesBehavior.unregisterTabableRegionBehavior.call(tabablesBehavior,
                  tabableRegion);
            });
          }
        },

        // Activate (set focus) of the region that has the highest weight value in the tabable
        // region behavior options.
        //  This should be called when regions are actually shown in the dom.
        //  If a region is already active, skip initial activation.

        setFocusInActiveTabableRegion: function activateInitialTabableRegion() {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._setFocusInActiveTabableRegion.call(tabablesBehavior);
          }
        },

        popTabableHandler: function () {
          var tabablesBehavior = _.last(TabablesBehavior.tabablesHandlers);
          if (tabablesBehavior) {
            tabablesBehavior._popTabableHandler();
          }
        }

      });

  // TODO: Expose this functionality and make it generic for other behaviors
  function getOption(property, source) {
    var options = source || this.options || {};
    var value = options[property];
    return _.isFunction(value) ? options[property].call(this.view) : value;
  }

  return TabablesBehavior;
});

csui.define('smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/marionette', 'nuc/utils/log', 'nuc/utils/base',
  'smart/behaviors/keyboard.navigation/smart.tabables.behavior'
], function (module, _, $, Marionette, log, base, TabablesBehavior) {
  'use strict';

// this file is only for smart controls. NOT TO BE USED BY OTHER MODULES 
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.
  // FIXME: deprecated - Remove this behavior class.

  var TabableRegionBehavior = Marionette.Behavior.extend({

      defaults: {
        initialActivationWeight: 0
      },

      constructor: function TabableRegionBehavior(options, view) {
        Marionette.Behavior.prototype.constructor.apply(this, arguments);

        this.view = view;
        view.tabableRegionBehavior = this;

        // merge behavior defaults into view
        _.extend(view, this.defaults);

        // add default implementation to view if it does not have one
        _.defaults(view, {
            // TODO remove use of isTabable because there is no code that gets called when the user
            // presses the tab key
            isTabable: function () {
              return true;  // default: this view can be reached by tab
            },
            onLastTabElement: function () {
              return true;  //most regions will only have one tab, with further navigation handled through arrow keys
            }
          }
        );

        if (view.options && !view.options.initialActivationWeight) {
          view.options.initialActivationWeight = this.options.initialActivationWeight;
        }

        this._registerEventHandlers();

      },

      _registerEventHandlers: function () {
        if (!this._eventsRegistered) {
          var view = this.view;
          var self = this;

          // log.debug('_registerEventHandlers ' + view.constructor.name) && console.log(log.last);

          this.listenTo(view, 'render', this._applyClasses);
          this.listenTo(view, 'dom:refresh', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              self.isRegistered = true;
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'refresh:tabindexes', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (self.isRegistered) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });

          this.listenTo(view, 'destroy', function () {
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            self.isRegistered = false;
          });
          this.listenTo(view, 'tabable', function () {
            TabablesBehavior.clearTabIndexes(view);
            if (TabablesBehavior.registerTabableRegion(this)) {
              this.setInitialTabIndex();
              TabablesBehavior.setFocusInActiveTabableRegion();
            }
          });
          this.listenTo(view, 'tabable:not', function () {
            TabablesBehavior.unregisterTabableRegion(this);
            TabablesBehavior.clearTabIndexes(view);
            this.isRegistered = false;
          });

          this.listenTo(view, 'changed:focus', function () {
            if (self.isRegistered) {
              this.moveTabIndex();
            }
          });

          this.listenTo(view, 'escaped:focus', function () {
            TabablesBehavior.setFocusInActiveTabableRegion();
          });
          this._eventsRegistered = true;
        }
      },

      _unregisterEventHandlers: function () {
        var view = this.view;
        // log.debug('_unregisterEventHandlers ' + view.constructor.name) && console.log(log.last);

        this.stopListening(view);
        this._eventsRegistered = false;
      },

      getCurrentlyFocusedElementFromView: function (shiftTab) {
        if (_.isFunction(this.view.currentlyFocusedElement)) {
          var focusEl = this.view.currentlyFocusedElement({shiftKey: shiftTab});
          return (focusEl instanceof $ ? focusEl : $(focusEl));
        } else {
          if (_.isString(this.view.currentlyFocusedElement)) {
            return this.view.$(this.view.currentlyFocusedElement);
          } else {
            log.debug('setInitialTabIndex: ' + this.view.constructor.name + ' does not have' +
              ' currentlyFocusedElement -> not setting tabindex in that view ') &&
            console.log(log.last);
            return $();
          }
        }
      },

      onlastTabElement: function (shiftTab, event) {
        return this.view.onLastTabElement(shiftTab, event);
      },

      setFocus: function (shiftTab) {
        // Not set focus if the view is requested so that the behavior is not stealing the focus.
        // After rendering, the view is setting focus on element at same location by itself.
        if (this.options.notSetFocus) {
          return;
        }

        var elToFocus = this.getCurrentlyFocusedElementFromView(shiftTab);
        // Do not focus elements out of the visible viewport rectangle;
        // it brings them to the visible screen, ignoring the absolute
        // positioning or transforms, if they were applied earlier
        if (elToFocus && base.isVisibleInWindowViewport(elToFocus)) {
          this.ignoreFocusEvents = true;
          elToFocus.trigger('focus');
          this.ignoreFocusEvents = false;
        }
      },

      setInitialTabIndex: function () {
        // TabablesBehavior.clearTabIndexes(this.view);
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
        }
        if (this.view.isTabable()) {
          try {
            this.currentlyFocusedElement = this.getCurrentlyFocusedElementFromView();
            if (this.currentlyFocusedElement && this.currentlyFocusedElement.length > 0) {
              var self = this;
              this.currentlyFocusedElement.prop('tabindex', 0);
              this.currentlyFocusedElement.addClass(
                TabableRegionBehavior.accessibilityActiveElementClass);
              this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
                if (!self.ignoreFocusEvents) {
                  TabablesBehavior.setTabableRegionActive(self);
                }
              });
            }
          } catch (e) {
            console.warn('Could not set as active element: ', this.view.cid, e.message);
          }

        } else {
          this.currentlyFocusedElement = $();
        }
      },

      moveTabIndex: function () {
        var self = this;
        if (this.currentlyFocusedElement) {
          this.currentlyFocusedElement.off('focus.' + this.view.cid);
          this.currentlyFocusedElement.prop('tabindex', -1);
          this.currentlyFocusedElement.removeClass(
            TabableRegionBehavior.accessibilityActiveElementClass);
          this.currentlyFocusedElement = $();

        }
        var newlyFocusedElement = this.getCurrentlyFocusedElementFromView();
        newlyFocusedElement.prop('tabindex', 0);
        this.currentlyFocusedElement = newlyFocusedElement;
        this.currentlyFocusedElement.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.currentlyFocusedElement.on('focus.' + this.view.cid, function () {
          if (!self.ignoreFocusEvents) {
            TabablesBehavior.setTabableRegionActive(self);
          }
        });
      },

      _applyClasses: function () {
        this.$el.addClass(TabableRegionBehavior.accessibilityRegionClass);
      }
    },
    {
      accessibilityRegionClass: 'csui-acc-tab-region',
      accessibilityActiveRegionClass: 'csui-acc-tab-region-active',
      accessibilityFocusableClass: 'csui-acc-focusable',
      accessibilityActiveElementClass: 'csui-acc-focusable-active'
    }
  );

  return TabableRegionBehavior;
});


/* START_TEMPLATE */
csui.define('hbs!smart/mixins/dropdown/dropdown',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"disabled") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":19},"end":{"line":8,"column":72}}})) != null ? stack1 : "")
    + "\">\n            <a role=\"menuitem\" href=\"#\" class=\""
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"disabled") : stack1),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":47},"end":{"line":9,"column":100}}})) != null ? stack1 : "")
    + "\"\n                aria-label= \""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"label") : stack1), depth0))
    + "\" tabindex=\"-1\">\n                "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"attributes") : depth0)) != null ? lookupProperty(stack1,"label") : stack1), depth0))
    + "\n            </a>\n        </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "binf-disabled";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"binf-dropdown csui-dropdown\" role=\"menuitem\">\n    <a href=\"\" class=\"binf-dropdown-toggle\" data-binf-toggle=\"dropdown\" role=\"button\" aria-expanded=\"false\" tabindex=\"0\"\n        aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"moreButtonsAria") || (depth0 != null ? lookupProperty(depth0,"moreButtonsAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"moreButtonsAria","hash":{},"loc":{"start":{"line":3,"column":20},"end":{"line":3,"column":39}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"moreButtonsAria") || (depth0 != null ? lookupProperty(depth0,"moreButtonsAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"moreButtonsAria","hash":{},"loc":{"start":{"line":3,"column":48},"end":{"line":3,"column":67}}}) : helper)))
    + "\" aria-expanded=\"false\">\n        "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":false,"size":(depth0 != null ? lookupProperty(depth0,"size") : depth0),"iconName":"csui_action_more32"},"loc":{"start":{"line":4,"column":8},"end":{"line":4,"column":74}}})) != null ? stack1 : "")
    + "\n    </a>\n    <ul class=\"binf-dropdown-menu  csui-dropdown-list\" role=\"menu\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"list") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":8},"end":{"line":14,"column":17}}})) != null ? stack1 : "")
    + "    </ul>\n</div>";
}});
Handlebars.registerPartial('smart_mixins_dropdown_dropdown', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!smart/mixins/dropdown/dropdown',[],function(){});
csui.define('smart/mixins/dropdown/dropdown.view',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/lib/marionette',
'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/mixins/dropdown/dropdown',
  'css!smart/mixins/dropdown/dropdown'
], function (_, $, Backbone, Marionette, TabableRegion, dropdownTemplate) {

  
  var DropDownView = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'smart-dropdown',
    template: dropdownTemplate,
    triggers: {
      'click': 'click'
    },
    ui: {
      dropdown: '.csui-dropdown',
      dropDownMenu: '.csui-dropdown > .binf-dropdown-toggle',
      dropDownList: '.csui-dropdown .csui-dropdown-list',
      dropDownListItem: '.csui-dropdown ul.csui-dropdown-list a'
    },
    events: {

      'click @ui.dropDownMenu': 'onDropdownClick',
      'keydown @ui.dropDownMenu': 'onDropdownClick',
      'click @ui.dropDownListItem': 'onListClick',
      'keydown @ui.dropDownListItem': 'onKeyView',
    },

    templateHelpers: function () {
      return {
        list: this.options.collection.models,
        moreButtonsAria: "jikhi",
        size: this.footerView.size || 'normal'
      };
    },

    constructor: function DropDownView(options, footerView) {
      options || (options = {});
      Marionette.ItemView.apply(this, arguments);
      this.footerView = footerView;
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },

    isTabable: function () {
      return this.$el.is(':not(:disabled)') && this.$el.is(':not(:hidden)');
    },

    currentlyFocusedElement: function (event) {
      var tabElements = this.$('*[tabindex]:not(.binf-disabled )');
      if (tabElements.length) {
        tabElements.prop('tabindex', 0);
      }
      return (this.footerView.checkResizer && this.footerView.checkResizer(event)) || $(tabElements[0]);
    },

    onKeyView: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.footerView.isESC = false;
      switch (event.keyCode) {
        case 13:
        case 32:
          $(event.target).click();
          break;
        // esc 
        case 27:
          if (this.ui.dropdown.hasClass("binf-open")) {
            this.ui.dropdown.removeClass("binf-open");
            this.ui.dropDownMenu.trigger("focus");
            this.footerView.isESC = true;
          }
          break;
        //top arrow
        case 38:
          this.getPrevEle($(event.currentTarget)).trigger("focus");
          break;
        // down arrow
        case 40:
          this.getNextEle($(event.currentTarget)).trigger("focus");
          break;
      }
    },

    getNextEle: function (ele) {
      var idx = this.ui.dropDownListItem.index(ele);
      return $(_.find(this.ui.dropDownListItem, function (item, i) {
        return i > idx && !$(item).hasClass("binf-disabled");
      }));
    },

    getPrevEle: function (ele) {
      var idx = this.ui.dropDownListItem.get().reverse().indexOf(ele[0]);
      return $(_.find(this.ui.dropDownListItem.get().reverse(), function (item, i) {
        return i > idx && !$(item).hasClass("binf-disabled");
      }));
    },
    
    getCornerEle: function (elements,last) {
      var items = last? elements.get().reverse() : elements;
      return $(_.find(items, function (item) {
        return !$(item).hasClass("binf-disabled");
      }));
    },
    onDropdownClick: function (event) {
      this.footerView.isESC = false;
      if ((event.type === 'keypress'
        && (event.keyCode === 13 || event.keyCode === 32))
        || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        var ele = this.ui.dropdown;
        if (ele.hasClass("binf-open")) {
          ele.removeClass("binf-open");
          this.ui.dropDownMenu.attr("aria-expanded",false);
        } else {
          ele.addClass("binf-open");
          this.ui.dropDownMenu.attr("aria-expanded",true);
          this.getCornerEle(this.ui.dropDownListItem).trigger("focus");
        }
      }
    },

    onListClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var i = this.ui.dropDownListItem.index(event.currentTarget);
      var ele = this.options.collection.models[i];
      if (ele.get("disabled")) {
        event.stopImmediatePropagation();
      } else {
        this.footerView.trigger("button:click button:click:" + ele.get("type"), ele.attributes);
      }
    }
  });

  return DropDownView;
});

csui.define('smart/mixins/generic.utilities/footerview.responsiveness.mixin',['nuc/lib/underscore', 'nuc/lib/marionette',
  'nuc/lib/backbone',
  'nuc/lib/jquery',
  'smart/mixins/dropdown/dropdown.view'
], function (_, Marionette, Backbone, $, DropDownView) {
  'use strict';

  var FooterViewResponsiveMixin = {


    updateFooterView: function (view, availableWidth) {
      this.view = view;
      this.availableWidth = availableWidth || (view.$el.width());
      this._getDisplayWidth();
      var length = this.view.displayWidth.length;
      this.dropdown = new DropDownView({
        collection: new Backbone.Collection(),
      }, view);
      if (view.$el.is(":visible") && length && this.availableWidth <= this.view.displayWidth[0]) {
        this.shrink(this.availableWidth, length);
        this.view._addChildView(this.dropdown, this.view.collection.length);
      } else {
        this.expand();
      }
    },

    shrink: function (availableWidth, length) {
      var lastEle = this.view.displayWidth[0],
        filteredCollection =  this.view.completeCollection && _.filter(this.view.completeCollection.models, function (item) {
          return !item.get('hidden');
        });
      for (var i = length - 1; i >= 0; i--) {
        if (availableWidth >= (lastEle - this.view.displayWidth[i]) + 48 && filteredCollection) {
          this.dropdown.options.collection.add(filteredCollection.slice(i, length));
          this.view.collection.reset(filteredCollection.slice(0, i));
          break;
        }
      }
    },

    expand: function () {
      if (this.view && this.view.completeCollection) {
        this.view.collection.reset(this.view.completeCollection.models);
      }
      this.dropdown && this.dropdown.destroy();
    },

    _getDisplayWidth: function (flag) {
      if ((this.view.displayWidth && this.view.displayWidth.length != 0) && !this.view.flag) {
        return this.view.displayWidth;
      }
      this._calculateDisplayWidth();
      return this.view.displayWidth;
    },

    _calculateDisplayWidth: function () {
      this.view.displayWidth = [];
      var childs = this.view.el.children,
        displayWidth = 0;
      for (var i = childs.length - 1; i >= 0; i--) {
        if ($(childs[i]) && $(childs[i]).is(":visible")) {
          displayWidth += (childs[i].offsetWidth + 16);
          this.view.displayWidth.unshift(displayWidth);
        }
      }
      this.view.flag = false;
    }


    // _eventsToPropagateToViews: ['dom:refresh']
  };

  return FooterViewResponsiveMixin;

});

csui.define('smart/mixins/generic.utilities/headerview.responsiveness.mixin',['nuc/lib/underscore', 'nuc/lib/marionette'
], function (_, Marionette) {
  'use strict';

  var HeaderViewResponsiveMixin = {
    // Placeholder
  };

  return HeaderViewResponsiveMixin;

});

csui.define('smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',['nuc/lib/underscore', 'nuc/lib/marionette'
], function (_, Marionette) {
  'use strict';

  var LayoutViewEventsPropagationMixin = {

    propagateEventsToRegions: function () {
      _.each(this._eventsToPropagateToRegions,
          _.bind(this._propagateEventToRegions, this));
    },

    _propagateEventToRegions: function (name) {
      //console.log('Propagating', name,
      //    'within', Object.getPrototypeOf(this).constructor.name);
      this.listenTo(this, name, function () {
        var regions;
        if (this.regionManager) {
          regions = this.regionManager.getRegions();
        } else {
          regions = this.getRegions();
        }

        _.each(regions, function (region) {
          var view = region.currentView;
          // Check if the region contains a view, if the view has already
          // triggered render and show events and if the view element has
          // been added to the document.
          if (view && (view._isShown || view._isAttached) && view._isRendered &&
              Marionette.isNodeAttached(view.el)) {
            //console.log('Triggering', name,
            //    'from', Object.getPrototypeOf(this).constructor.name,
            //    'to', Object.getPrototypeOf(region.currentView).constructor.name);
            var parameters = Array.prototype.slice.call(arguments);
            parameters.unshift(region.currentView, name);
            Marionette.triggerMethodOn.apply(Marionette, parameters);
          }
        }, this);
      });
    },
    mixin: function (prototype) {
      _.extend(prototype, {
        propagateEventsToRegions: this.propagateEventsToRegions,
        _propagateEventToRegions: this._propagateEventToRegions,
        _eventsToPropagateToRegions: this._eventsToPropagateToRegions
      });
    },
    _eventsToPropagateToRegions: ['dom:refresh']

  };

  return LayoutViewEventsPropagationMixin;

});

csui.define('smart/mixins/view.events.propagation/view.events.propagation.mixin',['nuc/lib/underscore', 'nuc/lib/marionette'
], function (_, Marionette) {
  'use strict';

  var ViewEventsPropagationMixin = {

    propagateEventsToViews: function () {
      var views = Array.prototype.slice.call(arguments);
      _.each(this._eventsToPropagateToViews,
          _.bind(this._propagateEventToViews, this, views));
    },

    cancelEventsToViewsPropagation: function () {
      var views = Array.prototype.slice.call(arguments);
      _.each(this._eventsToPropagateToViews,
          _.bind(this._cancelEventToViewsPropagation, this, views));
    },

    _propagateEventToViews: function (views, name) {
      _.each(views, function (view) {
        //console.log('Propagating', name,
        //    'from', Object.getPrototypeOf(this).constructor.name,
        //    'to', Object.getPrototypeOf(view).constructor.name);
        //var parentView = this;
        var childView = view;
        view.listenTo(this, name, function () {
          //console.log('Triggering', name,
          //    'from', Object.getPrototypeOf(parentView).constructor.name,
          //    'to', Object.getPrototypeOf(childView).constructor.name);
          // Check if the view has already triggered render and show events
          // and if the view element has been added to the document.
          if ((childView._isShown || childView._isAttached) && childView._isRendered &&
              Marionette.isNodeAttached(childView.el)) {
            var parameters = Array.prototype.slice.call(arguments);
            parameters.unshift(childView, name);
            Marionette.triggerMethodOn.apply(Marionette, parameters);
          }
          // context provided to be able to stop listening
        }, this);
      }, this);
    },

    _cancelEventToViewsPropagation: function (views, name) {
      _.each(views, function (view) {
        //console.log('Cancelling propagation', name,
        //    'from', Object.getPrototypeOf(this).constructor.name,
        //    'to', Object.getPrototypeOf(view).constructor.name);
        // context provided to identify this origin as registrator
        view.stopListening(this, name, undefined, this);
      }, this);
    },

    _eventsToPropagateToViews: ['dom:refresh']

  };

  return ViewEventsPropagationMixin;

});

csui.define('smart/utils/smart.base',[
    'nuc/lib/underscore', 'nuc/lib/jquery', 'i18n'
], function (_, $, i18n) {
    'use strict';

    function isRTL() {
        return i18n.settings.rtl === true || document.documentElement.dir === 'rtl';
    }
    return {
        isRTL: isRTL
    };
});


/* START_TEMPLATE */
csui.define('hbs!smart/controls/breadcrumbs/impl/breadcrumb',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"url","hash":{},"loc":{"start":{"line":2,"column":11},"end":{"line":2,"column":18}}}) : helper)))
    + "\" class=\"binf-dropdown-toggle csui-subcrumb csui-acc-focusable\" role=\"button\"\n     data-binf-toggle=\"dropdown\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"subcrumbAria") || (depth0 != null ? lookupProperty(depth0,"subcrumbAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"subcrumbAria","hash":{},"loc":{"start":{"line":3,"column":45},"end":{"line":3,"column":61}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"subcrumbTooltip") || (depth0 != null ? lookupProperty(depth0,"subcrumbTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"subcrumbTooltip","hash":{},"loc":{"start":{"line":3,"column":70},"end":{"line":3,"column":89}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":91},"end":{"line":3,"column":99}}}) : helper)))
    + "</a>\n  <ul class=\"binf-dropdown-menu csui-normal-scrolling\" role=\"menu\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"subcrumbs") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":4},"end":{"line":12,"column":13}}})) != null ? stack1 : "")
    + "  </ul>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"inactive") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"loc":{"start":{"line":6,"column":6},"end":{"line":11,"column":13}}})) != null ? stack1 : "");
},"3":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li role=\"menuitem\"><a data-id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "</a>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li role=\"menuitem\"><a class='csui-breadcrumb csui-acc-focusable' href=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"url") : depth0), depth0))
    + "\"\n               data-id=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"name") : depth0), depth0))
    + "</a>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"inactive") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"loc":{"start":{"line":15,"column":2},"end":{"line":20,"column":9}}})) != null ? stack1 : "");
},"8":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":16,"column":4},"end":{"line":16,"column":12}}}) : helper)))
    + "\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a class='csui-breadcrumb csui-acc-focusable' href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"url") || (depth0 != null ? lookupProperty(depth0,"url") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"url","hash":{},"loc":{"start":{"line":18,"column":56},"end":{"line":18,"column":63}}}) : helper)))
    + "\" data-id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"id") || (depth0 != null ? lookupProperty(depth0,"id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"id","hash":{},"loc":{"start":{"line":18,"column":74},"end":{"line":18,"column":80}}}) : helper)))
    + "\"\n       title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":19,"column":14},"end":{"line":19,"column":22}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":19,"column":24},"end":{"line":19,"column":32}}}) : helper)))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasSubCrumbs") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(7, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":21,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('smart_controls_breadcrumbs_impl_breadcrumb', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/controls/breadcrumbs/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('smart/controls/breadcrumbs/impl/nls/root/lang',{
  subcrumbTooltip: 'Show full path',
  subcrumbAria: 'Show full path',
  breadcrumbAria: 'Breadcrumb'
});


csui.define('smart/controls/breadcrumbs/breadcrumb.view',[
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/marionette',
  'nuc/utils/base', 'hbs!smart/controls/breadcrumbs/impl/breadcrumb',
  'i18n!smart/controls/breadcrumbs/impl/nls/lang'
], function (_, $, Marionette, base, template, lang) {
  'use strict';

  var BreadcrumbItemView = Marionette.ItemView.extend({
    tagName: 'li',

    template: template,

    modelEvents: {
      change: 'render'
    },

    events: {
      'click a.csui-breadcrumb': 'onClickLink'
    },

    onClickLink: function (e) {
      if (base.isControlClick(e)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
        e.preventDefault();
        e.stopPropagation();

        var model = this.model;
        if (model.get('subcrumbs').length > 0) {
          var id = $(e.target).data('id');
          model = this._getModel(id);
        }
        this.triggerMethod('click:ancestor', model);
      }
    },

    className: function () {
      var cname,
          // Constructor of this object has not been finished yet;
          // subcrumbs as an array have not been ensured yet
          subCrumbs = this.model.get('subcrumbs');

      if (this.options.isLastChild) {
        cname = 'binf-active';
      } else if (subCrumbs && subCrumbs.length > 0) {
        cname = 'binf-dropdown';
      } else {
        cname = 'tail';
      }

      return cname;
    },

    /**
     * If the ancestor points to a real node, which is connected to a server, set href of the link
     * to the open the container perspective of the ancestor
     *
     * @param crumb
     * @returns {string}
     */
    getAncestorUrl: function (crumb) {
      // If the current model has information regarding href source link consider it, otherwise
      // by default apply '#'.
      return crumb.get('hrefSrc') || '#';
    },

    /**
     * It returns the actual display name based on the availablity of suitable parameter
     * existance in the model.
     *
     * @returns {string}
     */
    getDisplayName: function () {
      return this.model.get('displayName') || this.model.get('name_formatted') ||
             this.model.get('name');
    },

    templateHelpers: function () {
      var options   = this.options,
          subCrumbs = _.map(this.model.get('subcrumbs'), _.bind(function (crumb) {
            return _.extend(crumb.toJSON(), {url: this.getAncestorUrl(crumb)});
          }, this));
      return {
        inactive: this.model.get('inactive') || options.isLastChild,
        hasSubCrumbs: subCrumbs.length > 0,
        subcrumbs: subCrumbs,
        name: this.getDisplayName(),
        url: this.getAncestorUrl(this.model),
        subcrumbTooltip: lang.subcrumbTooltip,
        subcrumbAria: lang.subcrumbAria
      };
    },

    onRender: function () {
      // aria-current can not be set on the last/active element as that is not a link. html validity issue.
      // TODO the inactive/informational last element is counted by the screenreader but can not be reached
    },

    constructor: function BreadcrumbItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      // Make using the view-model easier in this view
      if (!this.model.has('subcrumbs')) {
        this.model.set('subcrumbs', [], {silent: true});
      }
    },

    _getModel: function (id) {
      var subCrumbs = this.model.get('subcrumbs'),
          model     = null;

      for (var i = 0; i < subCrumbs.length; i++) {
        if (subCrumbs[i].get('id') === id) {
          model = subCrumbs[i];
          break;
        }
      }
      return model;
    }
  });

  return BreadcrumbItemView;
});


csui.define('css!smart/controls/breadcrumbs/impl/breadcrumbs',[],function(){});
csui.define('smart/controls/breadcrumbs/breadcrumbs.view',[
  'nuc/lib/underscore',
  'nuc/lib/jquery',
  'nuc/lib/backbone',
  'nuc/lib/marionette',
  'smart/controls/breadcrumbs/breadcrumb.view',
  'smart/lib/binf/js/binf',
  'css!smart/controls/breadcrumbs/impl/breadcrumbs',
  //'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior'
], function (_,
    $,
    Backbone,
    Marionette,
    BreadCrumbItemView
    //TabableRegionBehavior
) {

  var BreadCrumbCollectionView = Marionette.CollectionView.extend({

    tagName: 'ol',

    className: function () {
      return 'binf-breadcrumb binf-breadcrumb-' + this.options.theme;
    },

    // TODO: enable it once behavior is moved to smart controls.
    // behaviors: {
    //   TabableRegion: {
    //     behaviorClass: TabableRegionBehavior
    //   }
    // },

    childView: BreadCrumbItemView,

    childViewOptions: function (model, index) {
      return {
        childIndex: index,
        isLastChild: index === (model.get("showAsLink") ? this.collection.size() :
                                this.collection.size() - 1)
      };
    },

    /**
     * @name BreadCrumbCollectionView
     * @extends Marionette.CollectionView
     * @constructs
     * @param options {Object} - Recognized option properties:
     * @param options.context {object} - current page context.
     * @param options.collection {object} - Ancestors collection.
     */
    constructor: function BreadcrumbCollectionView(options) {
      options || (options = {});
      this.completeCollection = options.collection;
      options.collection = new Backbone.Collection();
      options.theme = options.theme || 'light'; // supports 'dark' and 'light' themes only
      Marionette.CollectionView.call(this, options);
      this.listenTo(this,"readjust:breadcrumbs",this.refresh);
    },

    is: 'BreadcrumbCollectionView',

    /**
     * @param options
     * initialize - initialize basic information and events
     */
    initialize: function (options) {

      this.listenTo(this.completeCollection, 'update reset', this.synchronizeCollections);
      this.listenTo(this, 'sync:collection', this.synchronizeCollections);
      this.stop = this.options.stop || {};
      this.options.noOfItemsToShow = parseInt(this.options.noOfItemsToShow, 10);
      this._startSubCrumbs = this.options.startSubCrumbs !== undefined ?
                             parseInt(this.options.startSubCrumbs, 10) : 1;
      this._subCrumbsLength = 0;

      this.accLastBreadcrumbElementFocused = true;
      this.accNthBreadcrumbElementFocused = 0;

      this.resizeTimer = undefined;
      $(window).on('resize.' + this.cid, {view: this}, this._onWindowResize);
    },

    /**
     * @private method
     * @param event
     *
     */
    _onWindowResize: function (event) {
      if (event && event.data && event.data.view) {
        var self = event.data.view;
        // optimization for rapid mouse movement and redraw when mouse movement slows down or stop
        if (self.resizeTimer) {
          clearTimeout(self.resizeTimer);
        }
        self.resizeTimer = setTimeout(function () {
          self._adjustToFit();
        }, 200);
      }
    },

    events: {'keydown': 'onKeyInView'},

    _breadcrumbSelector: 'a.csui-acc-focusable:visible',

    /**
     *
     * @returns boolean
     *
     */
    isTabable: function () {
      return this.collection.models.length > 1;
    },

    /**
     *
     * @returns html dom element
     *
     */
    currentlyFocusedElement: function () {
      if (this.isTabable()) {
        if (this.accLastBreadcrumbElementFocused) {
          return this.$(this._breadcrumbSelector + ':last');
        } else {
          var breadcrumbElements = this.$(this._breadcrumbSelector);
          return $(breadcrumbElements[this.accNthBreadcrumbElementFocused]);
        }
      } else {
        return $();
      }
    },

    onKeyInView: function (event) {
      var allBreadcrumbElements, allSubcrumbsElements;
      switch (event.keyCode) {
      case 37:
        // left arrow key
        if (this.$el.find(".binf-open").length === 1) {
          this.hideSubCrumbs();
        }
        allBreadcrumbElements = this.$(this._breadcrumbSelector);
        if (this.accLastBreadcrumbElementFocused) {
          if (allBreadcrumbElements.length > 1) {
            this.accLastBreadcrumbElementFocused = false;
            this.accNthBreadcrumbElementFocused = allBreadcrumbElements.length - 2;
          }
        } else {
          if (this.accNthBreadcrumbElementFocused > 0) {
            this.accNthBreadcrumbElementFocused--;
          }
        }
        this.trigger('changed:focus', this);
        this.currentlyFocusedElement().trigger('focus');

        break;

      case 38:
        // up arrow key
        if (this.$el.find(".binf-open").length === 1) {
            allSubcrumbsElements = this.$("li[role = 'menuitem']");
            if (allSubcrumbsElements.first().find("a").length && allSubcrumbsElements.first().find("a")[0] === document.activeElement) {
               allSubcrumbsElements.last().find("a") && allSubcrumbsElements.last().find("a").trigger('focus');
               event.preventDefault();
               event.stopPropagation();
            }
        }
        break;

      case 39:
        // right arrow key
        if (this.$el.find(".binf-open").length === 1) {
          this.hideSubCrumbs();
        }
        if (!this.accLastBreadcrumbElementFocused) {
          allBreadcrumbElements = this.$(this._breadcrumbSelector);
          if (this.accNthBreadcrumbElementFocused < allBreadcrumbElements.length - 1) {
            this.accNthBreadcrumbElementFocused++;
            this.trigger('changed:focus', this);
            this.currentlyFocusedElement().trigger('focus');
          }
        }
        break;

        case 40:
          // down arrow key
          if (this.$el.find(".binf-open").length === 1) {
            allSubcrumbsElements = this.$("li[role = 'menuitem']");
            if (allSubcrumbsElements.last().find("a").length && allSubcrumbsElements.last().find("a")[0] == document.activeElement) {
              allSubcrumbsElements.first().find("a") && allSubcrumbsElements.first().find("a").trigger('focus');
               event.preventDefault();
               event.stopPropagation();
            }
          }
          break;

      }
    },

    /**
     *
     * @param skipAdjustToFit
     * once colletion udpated it will trigger automatically and render view with new collection
     */
    synchronizeCollections: function (skipAdjustToFit) {
      this.trigger('before:synchronized');
      var excerpt = this.completeCollection.last(this.completeCollection.length) || [];
      if (this.stop && this.stop.id) {
        this._removeAncestorsFromStopPoint(excerpt, this.stop.id);
      }
      this._removeAncestorsToNumItemsToShow(excerpt);
      this._subCrumbsLength = 0;
      this.currentIndex = 0;
      this._refreshBreadCrumbsDisplay();
      // execute _adjustToFit if and only if the parent has added all breadcrumbs elements to DOM.
      if (typeof skipAdjustToFit === 'boolean') {
        if (!skipAdjustToFit) {
          this._adjustToFit();
        }
      } else {
        this._adjustToFit();
      }
      this.trigger('after:synchronized');
    },

    /**
     *
     * @private
     */
    _refreshBreadCrumbsDisplay: function () {
      var subCrumbs,
          subCrumbsMenu,
          displayArr = this.completeCollection.last(this.completeCollection.length) || [];
      if (this.stop && this.stop.id) {
        this._removeAncestorsFromStopPoint(displayArr, this.stop.id);
      }
      this._removeAncestorsToNumItemsToShow(displayArr);
      if (this._subCrumbsLength > 0) {
        subCrumbs = _.range(this._startSubCrumbs, this._startSubCrumbs + this._subCrumbsLength).map(
            function (rangeVal) {
              return displayArr[rangeVal];
            }
        );
        subCrumbsMenu = {
          id: -1,
          name: '...',
          subcrumbs: subCrumbs
        };
        displayArr.splice(this._startSubCrumbs, this._subCrumbsLength, subCrumbsMenu);
      }

      displayArr.length && this.collection.reset(displayArr);
    },

    /**
     *
     * reload the breadcrumb view and auto adjust based on available width
     */
    refresh: function () {
      this._adjustToFit();
    },

    /**
     *
     * @private
     * based on width either _shrinkToFit or _expandToFit the breadcrumb view
     */
    _adjustToFit: function () {
      this.$el && this.$el.addClass("smart-loading-breadcrumbs");
      var maxDisplayWidth = this._getMaxDisplayWidth(),
        childElementsWidthArray = this._getDisplayWidth(),
        eleWidth = childElementsWidthArray[childElementsWidthArray.length - 1];
      if (eleWidth > maxDisplayWidth) {
        this._shrinkToFit(maxDisplayWidth);
      } else if (eleWidth < maxDisplayWidth) {
        this._expandToFit(maxDisplayWidth);
      }
      var tabEvent = $.Event('tab:content:field:changed');
      this.trigger(tabEvent);
      this.$el && this.$el.removeClass("smart-loading-breadcrumbs");
    },

    /**
     *
     * @private
     * if  width is small shrink the view to auto adjust
     */
    _shrinkToFit: function (maxDisplayWidth) {
      this._startSubCrumbs = (this._startSubCrumbs > (this.collection.length - 3)) ? 1 :
        this._startSubCrumbs;
      var shrinkableItems = this.completeCollection.length - this._startSubCrumbs - 1,subCrumbs;
      if (maxDisplayWidth > 0) {
        var displayWidth = this._getDisplayWidth(), childrenTotalWidth = displayWidth[displayWidth.length - 1];
        if (childrenTotalWidth > maxDisplayWidth && (shrinkableItems > 0 ||
          shrinkableItems === 0 &&
          window.devicePixelRatio === 2 &&
          this._subCrumbsLength === 0)) {
          this.currentIndex = this.currentIndex || 0;
          var i;
          for (i = 0; i < displayWidth.length - 1; i++) {
            if (maxDisplayWidth > ((childrenTotalWidth - displayWidth[i]) + 32)) {
              var idx = i + 1;
              this._startSubCrumbs = (this._startSubCrumbs >= (this.collection.length - idx)) ? 1 :
                this._startSubCrumbs;
              shrinkableItems = this.completeCollection.length - this._startSubCrumbs - 1;
              if (this._subCrumbsLength + idx - this.currentIndex <= shrinkableItems) {
                subCrumbs = idx - this.currentIndex;
                this.currentIndex = idx;
              }
              else {
                subCrumbs = shrinkableItems - this.currentIndex;
                this.currentIndex = shrinkableItems;
              }
              this._adjustSubCrumbsLengthBy(subCrumbs);
              break;
            }
          }
          if(i >=  displayWidth.length-1){
            this._adjustSubCrumbsLengthBy(shrinkableItems - this.currentIndex);
            this.currentIndex = shrinkableItems;
          }
        }
      }
    },

    /**
     *
     * @private
     * if  width is larger expand the view to auto adjust
     */
    _expandToFit: function (maxDisplayWidth) {
      var shrinkableItems = this.collection.size() - this._startSubCrumbs - 2;
      if (maxDisplayWidth > 0) {
        var displayWidth = this._getDisplayWidth(),
          childrenTotalWidth = displayWidth[displayWidth.length - 1];
        if (this._subCrumbsLength > 0 && childrenTotalWidth < maxDisplayWidth) {
          this._adjustSubCrumbsLengthBy(0 - this.currentIndex);
          this.currentIndex = 0;
        } else if (shrinkableItems > 0 && childrenTotalWidth > maxDisplayWidth) {
          this._adjustSubCrumbsLengthBy(1);
        }
      }
    },

    /**
     *
     * @private
     */
    _adjustSubCrumbsLengthBy: function (amt) {
      this._subCrumbsLength += amt;
      this._subCrumbsLength = Math.min(this._subCrumbsLength,
          this.completeCollection.size() - this._startSubCrumbs);
      this._refreshBreadCrumbsDisplay();
    },

    /**
     *
     * @private
     * get max width of view
     */
    _getMaxDisplayWidth: function () {
      return (this.el.offsetWidth * 0.9);
    },

    /**
     *
     * @private
     */
    _getDisplayWidth: function () {
      if (this.displayWidth && this.displayWidth.length != 0 && this.completeCollection.length === this.displayWidth.length) {
        return this.displayWidth;
      }
      this.displayWidth = [];
        var childs = this.el.children,
       displayWidth=0;
      for (var i = 0; i < childs.length; i++) {
        if ($(childs[i]) && $(childs[i]).is(":visible")) {
          displayWidth += childs[i].offsetWidth;
          this.displayWidth.push(displayWidth);
        }
      }
      return this.displayWidth;
    },

    /**
     *
     * @param hideBreadcrumb
     * hide/show the breadcrumb view based on parameter
     */
    hide: function (hideBreadcrumb) {
      if (hideBreadcrumb) {
        this.el.classList.add('binf-hidden');
      } else {
        this.el.classList.remove('binf-hidden');
      }
      return true;
    },

    /**
     *
     * hide the subcrumbs
     */
    hideSubCrumbs: function () {
      var $subCrumb = this.$el.find('li.binf-dropdown');
      if ($subCrumb && $subCrumb.hasClass('binf-open')) {
        this.$el.find('.csui-subcrumb').trigger('click');
      }
    },

    /**
     *@param newId
     * update the stop.id value
     */
    updateStopId: function (newId) {
      this.stop.id = newId;
    },

    /**
     * @private
     * @param collection
     * @param stopId
     */
    _removeAncestorsFromStopPoint: function (collection, stopId) {
      for (var i = 0; i < collection.length; i++) {
        if (collection[i].get('id') === stopId) {
          collection.splice(0, i);
          break;
        }
      }
    },

    /**
     * @private
     * @param collection
     */
    _removeAncestorsToNumItemsToShow: function (collection) {
      if (this.options.noOfItemsToShow && this.options.noOfItemsToShow >= 0) {
        var limit = (this.options.noOfItemsToShow >= collection.length) ? 0 :
                    collection.length - this.options.noOfItemsToShow;
        collection.splice(0, limit);
      }
    },

    /**
     * on before destroy remove the events
     */
    onBeforeDestroy: function () {
      $(window).off('resize.' + this.cid, this._onWindowResize);
    }

  });

  return BreadCrumbCollectionView;

});


/* START_TEMPLATE */
csui.define('hbs!smart/controls/error/impl/error',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-suggestion\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"suggestion") || (depth0 != null ? lookupProperty(depth0,"suggestion") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"suggestion","hash":{},"loc":{"start":{"line":10,"column":33},"end":{"line":10,"column":47}}}) : helper)))
    + "</div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-error-icon-div\">\n  <div class=\"csui-error-icon-parent\">\n    <div class=\"csui-error-icon notification_error\"></div>\n  </div>\n\n</div>\n<div class=\"csui-normal-scrolling\">\n  <div class=\"csui-message\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":8,"column":28},"end":{"line":8,"column":39}}}) : helper)))
    + "</div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"suggestion") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":9,"column":2},"end":{"line":11,"column":9}}})) != null ? stack1 : "")
    + "</div>\n";
}});
Handlebars.registerPartial('smart_controls_error_impl_error', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!smart/controls/error/impl/error',[],function(){});
csui.define('smart/controls/error/error.view',[
  'nuc/lib/jquery',
  'nuc/lib/marionette',
  'hbs!smart/controls/error/impl/error',
  'smart/lib/binf/js/binf',
  'css!smart/controls/error/impl/error',
], function ($, Marionette, template) {
  'use strict';

  var ErrorView = Marionette.ItemView.extend({
    className: function () {
      var className = 'csui-error content-tile csui-error-container';
      if (this.options.low) {
        className += ' csui-low';
      }
      return className;
    },

    template: template,

    modelEvents: {
      change: 'render'
    },

    ui: {
      messageArea: '.csui-message',
      iconArea: '.csui-error-icon-parent'
    },

    events: {
      "mouseenter": 'showPopover',
      "mouseleave": 'hidePopover'
    },
    /**
     * @name ErrorView
     * @extends Marionette.ItemView
     * @constructs
     * @param options {Object} - Recognized option properties:
     * @param options.low {Boolean} - Initialy text will display in middle. Default is *false*.   
     * @param options.model {Object} - Model to use as view model.
     */
    constructor: function ErrorView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    getPopoverEle: function () {
      return this.ui.iconArea;
    },
     /**
     *
     * @returns {boolean}
     * if true title will display in popover
     */
    canShowPopover: function () {
      return (!!this.options.model.get('title'));
    },
    /**
     *
     * intilization the popover with required options if applicable 
     */
    onShow: function () {
      if (this.canShowPopover()) {
        var that = this;
        this.$el.closest('.csui-disabled').removeClass('csui-disabled');
        this.getPopoverEle().binf_popover({
          content: this.options.model.get('title'),
          html: true,
          placement: function () {
            //source element should be the wrapper element in small shortcuts widgets
            var popOverSource = !!that.options.low ? that.ui.messageArea : that.ui.iconArea,
                maxWidth      = popOverSource.width(),
                maxHeight     = popOverSource.height(),
                offset        = popOverSource.offset(),
                window_left   = offset.left,
                window_top    = offset.top,
                window_right  = (($(window).width()) -
                                 (window_left + popOverSource.outerWidth(true))),
                window_bottom = (($(window).height()) -
                                 (window_top + popOverSource.outerHeight(true)));
            if (window_right > maxWidth) {
              return "right";
            } else if (window_left > maxWidth) {
              return "left";
            } else if (window_bottom > maxHeight) {
              return "bottom";
            } else {
              return "top";
            }
          }
        });
      }
    },
    /**
     *
     * on mouseover show popover
     */
    showPopover: function (e) {
      if (this.canShowPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.getPopoverEle().binf_popover('show');
      }
    },
    /**
     *
     * on mouseleave hide popover
     */
    hidePopover: function (e) {
      if (this.canShowPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.getPopoverEle().binf_popover('hide');
      }
    }

  });

  return ErrorView;

});

// TODO: needs to be enable once respective component is being moved here
csui.define('smart/controls/dialog/footer.view',['nuc/lib/backbone','nuc/lib/marionette','nuc/lib/underscore',
//'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
], function (Backbone, Marionette, _
  //  TabableRegion
) {

  /**
   * @class binf-btn
   * @fires click - on the button
   * @description
   ## Dialog Footer Control

   The footer.view.js implements a marionette.ItemView that renders childview - ButtonView.
   */
  var ButtonView = Marionette.ItemView.extend({

    tagName: 'button',

    className: 'binf-btn',

    template: false,

    triggers: {
      'click': 'click'
    },

    // TODO: needs to be enable once respective component is being moved here
    // behaviors: {
    //   TabableRegion: {
    //     behaviorClass: TabableRegion
    //   }
    // },

    /**
     * @name ButtonView
     * @extends Marionette.View
     * @constructs
     */
    constructor: function ButtonView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenTo(this,"dom:refresh", _.bind(this.onDomRefresh, this));
    },

    /**
     *
     * @returns true if the elements have the tabindex attribute
     */
    isTabable: function () {
      return this.$el.is(':not(:disabled)') && this.$el.is(':not(:hidden)');
    },

    /**
     * @returns currently focused element
     */
    currentlyFocusedElement: function () {
      if (this.$el) {
        this.$el.prop('tabindex', 0);
      }
      return this.$el;
    },

    onRender: function () {
      var button = this.$el,
          attributes = this.model.attributes;
      button.text(attributes.label);
      button.addClass(
          attributes['default'] ? 'binf-btn-primary cs-add-button' : 'binf-btn-default');
      if (attributes.toolTip) {
        button.attr('title', attributes.toolTip);
      }
      if (attributes.id) {
        button.attr('id', attributes.id);
      }
      if (attributes.separate) {
        button.addClass('cs-separate');
      }
      this.updateButton(attributes);
     
    },

    onDomRefresh: function () {
      if (this.isTabable()) {
        this.currentlyFocusedElement();
      }
    },

    /**
     * @param attributes
     * updateButton - Enables/disables button based on the flag hidden
     */
    updateButton: function (attributes) {
      var $button = this.$el;
      attributes || (attributes = {});
      if (attributes.hidden !== undefined) {
        if (attributes.hidden) {
          $button.addClass('binf-hidden');
        } else {
          $button.removeClass('binf-hidden');
        }
      }
      if (attributes.disabled !== undefined) {
        $button.prop('disabled', attributes.disabled);
      }
      this.trigger("dom:refresh");
    }

  });

  /**
   * @description

   The footer.view.js implements a marionette.ItemView that renders a view in the footer of the Dialog.
   */
  var DialogFooterView = Marionette.CollectionView.extend({

    childView: ButtonView,

    /**
     * @name DialogFooterView
     * @extends Marionette.CollectionView
     * @constructs
     */
    constructor: function DialogFooterView(options) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.completeCollection = new Backbone.Collection();
      if(this.collection && this.collection.length){
      this.completeCollection.add(this.collection.toJSON(), { silent: true });
      }
    },
    onDomRefresh: function () {
      this.children.each(function (buttonView) {
        buttonView.trigger('dom:refresh');
      });
    },

    /**
     * @returns array of buttons
     */
    getButtons: function () {
      return this.children.toArray();
    },

    /**
     * @param id
     * @param attributes
     * updateButton - enables/disables button
     */
    updateButton: function (id, attributes) {
      var button = this.collection.get(id),
      completeCollectionButton = this.completeCollection.get(id);

      if (completeCollectionButton) {
      completeCollectionButton.set(attributes);
      }

      if (button) {
        this.children
            .findByModel(button)
            .updateButton(attributes);
      } else {
        // If the footer comes from the dialog template including the buttons,
        // the collection of dynamically created buttons is empty.
        // The template has to provide correct initial classes for the buttons
        // and their identifiers must be present in the "data-cs-id" attribute.
        ButtonView.updateButton(this.$('[data-cs-id="' + id + '"]'), attributes);
      }
    }

  });

  return DialogFooterView;
});


/* START_TEMPLATE */
csui.define('hbs!smart/controls/dialog/impl/dialog.header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"actionIconNameLeft") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"loc":{"start":{"line":2,"column":2},"end":{"line":10,"column":9}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconNameLeft") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"loc":{"start":{"line":12,"column":2},"end":{"line":33,"column":9}}})) != null ? stack1 : "")
    + "\n\n    <h2 class=\"tile-title binf-modal-title csui-heading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":36,"column":57},"end":{"line":36,"column":66}}}) : helper)))
    + "</h2>\n  </div>\n\n    <div class=\"cs-header-control\"></div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showCloseIcon") : depth0),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.noop,"loc":{"start":{"line":41,"column":2},"end":{"line":52,"column":9}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"tile-type-action-icon cs-icon-left\" tabindex=\"0\">\n      "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","iconName":(depth0 != null ? lookupProperty(depth0,"actionIconNameLeft") : depth0)},"loc":{"start":{"line":4,"column":6},"end":{"line":4,"column":61}}})) != null ? stack1 : "")
    + "\n    </span>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"actionIconLeft") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":4},"end":{"line":9,"column":11}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <span class=\"tile-type-action-icon cs-icon-left "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"actionIconLeft") || (depth0 != null ? lookupProperty(depth0,"actionIconLeft") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"actionIconLeft","hash":{},"loc":{"start":{"line":8,"column":54},"end":{"line":8,"column":72}}}) : helper)))
    + "\" tabindex=\"0\"></span>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"tile-type-icon\">\n      "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","iconName":(depth0 != null ? lookupProperty(depth0,"iconNameLeft") : depth0)},"loc":{"start":{"line":14,"column":6},"end":{"line":14,"column":55}}})) != null ? stack1 : "")
    + "\n    </span>\n    <div class=\"tile-title\">\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconLeft") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"loc":{"start":{"line":18,"column":4},"end":{"line":32,"column":11}}})) != null ? stack1 : "");
},"10":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <span class=\"tile-type-icon cs-icon-left "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconLeft") || (depth0 != null ? lookupProperty(depth0,"iconLeft") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconLeft","hash":{},"loc":{"start":{"line":19,"column":49},"end":{"line":19,"column":61}}}) : helper)))
    + "\"></span>\n      <div class=\"tile-title\">\n";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"imageLeftUrl") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.program(15, data, 0),"loc":{"start":{"line":22,"column":6},"end":{"line":31,"column":13}}})) != null ? stack1 : "");
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <div class=\"tile-type-image "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imageLeftClass") || (depth0 != null ? lookupProperty(depth0,"imageLeftClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imageLeftClass","hash":{},"loc":{"start":{"line":23,"column":38},"end":{"line":23,"column":56}}}) : helper)))
    + "\">\n            <span class=\"tile-type-icon tile-type-icon-img\">\n              <img src=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"imageLeftUrl") || (depth0 != null ? lookupProperty(depth0,"imageLeftUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"imageLeftUrl","hash":{},"loc":{"start":{"line":25,"column":24},"end":{"line":25,"column":40}}}) : helper)))
    + "\" alt=\"\" aria-hidden=\"true\">\n            </span>\n          </div>\n        <div class=\"tile-title\">\n";
},"15":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"tile-title cs-text-only\">\n";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"cs-close smart-v2-icon-parent\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseButtonTooltip") || (depth0 != null ? lookupProperty(depth0,"dialogCloseButtonTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseButtonTooltip","hash":{},"loc":{"start":{"line":42,"column":56},"end":{"line":42,"column":84}}}) : helper)))
    + "\"\n          tabindex=\"0\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseAria") || (depth0 != null ? lookupProperty(depth0,"dialogCloseAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseAria","hash":{},"loc":{"start":{"line":43,"column":35},"end":{"line":43,"column":54}}}) : helper)))
    + "\" role=\"button\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconNameRight") : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.program(20, data, 0),"loc":{"start":{"line":44,"column":8},"end":{"line":50,"column":15}}})) != null ? stack1 : "")
    + "      </div>\n";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","iconName":(depth0 != null ? lookupProperty(depth0,"iconNameRight") : depth0)},"loc":{"start":{"line":45,"column":10},"end":{"line":45,"column":60}}})) != null ? stack1 : "")
    + "\n";
},"20":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconRight") : depth0),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.noop,"loc":{"start":{"line":47,"column":10},"end":{"line":49,"column":17}}})) != null ? stack1 : "");
},"21":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <div class=\"icon circular "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconRight") || (depth0 != null ? lookupProperty(depth0,"iconRight") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconRight","hash":{},"loc":{"start":{"line":48,"column":36},"end":{"line":48,"column":49}}}) : helper)))
    + "\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"expandedHeader") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":53,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('smart_controls_dialog_impl_dialog.header', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/controls/dialog/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('smart/controls/dialog/impl/nls/root/lang',{

  dialogCloseButtonTooltip: 'Close',
  dialogCloseAria: 'Close {0} dialog',
  defaultButtonLabel: 'Cancel'

});



csui.define('css!smart/controls/dialog/impl/dialog',[],function(){});
csui.define('smart/controls/dialog/header.view',[
  'nuc/lib/underscore', 
  'nuc/lib/jquery', 
  'nuc/lib/marionette',
  //'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/controls/dialog/impl/dialog.header',
  'i18n!smart/controls/dialog/impl/nls/lang',
  'css!smart/controls/dialog/impl/dialog'
], function (_, $, Marionette,
   // TabableRegion,
    headerTemplate, lang) {

  /**
   * @description

   ## Dialog Header Control

   The header.view.js implements a marionette.ItemView that renders a view in the header of the Dialog.
   */

  var DialogHeaderView = Marionette.ItemView.extend({

    template: headerTemplate,
    // TODO: needs to be enable once respective component is being moved here
    // behaviors: {
    //   TabableRegion: {
    //     behaviorClass: TabableRegion
    //   }
    // },
    
    ui: {
      headerControl: '.cs-header-control',
      closeButton:'.cs-close'
    },

    events: {
      'keydown': 'onKeyInView'
    },

    /**
     *
     * @returns {{iconLeft: *, iconNameLeft: string, actionIconLeft: *, actionIconNameLeft: string, imageLeftUrl: *, imageLeftClass: *, title: *, ariaLabelledBy: *, iconRight: *, iconNameRight: string, expandedHeader: *,  dialogCloseButtonTooltip: (*|string), dialogCloseAria: (*|string)}}
     */
    templateHelpers: function () {
      return {
        iconLeft: this.options.iconLeft,
        iconNameLeft: this.options.iconNameLeft,
        actionIconLeft: this.options.actionIconLeft,
        actionIconNameLeft: this.options.actionIconNameLeft,
        imageLeftUrl: this.options.imageLeftUrl,
        imageLeftClass: this.options.imageLeftClass,
        title: this.options.title,
        iconRight: this.options.iconRight,
        iconNameRight: this.options.iconNameRight,
        expandedHeader: this.options.expandedHeader,
        dialogCloseButtonTooltip: lang.dialogCloseButtonTooltip,
        dialogCloseAria: _.str.sformat(lang.dialogCloseAria, this.options.title),
        showCloseIcon: this.options.iconNameRight || this.options.iconRight ? true : false 
      };
    },

    /**
     * @name DialogHeaderView
     * @extends Marionette.View
     * @constructs
     */
    constructor: function DialogHeaderView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.$el.addClass('smart-dialog-header');
    },

    /**
     *
     * @returns true if the elements have the tabindex attribute
     */
    isTabable: function () {
      return this.$('*[tabindex]').length > 0;
    },

    /**
     * @param event
     * @returns currently focused element
     */
    currentlyFocusedElement: function (event) {
      var tabElements = this.$('*[tabindex]');
      if (tabElements.length) {
        tabElements.prop('tabindex', 0);
      }
      if (!this.options.iconRight && !this.options.iconNameRight) {
        this.ui.closeButton.attr("tabindex", -1);
      }
      if (!!event && event.shiftKey) {
        return $(tabElements[tabElements.length - 1]);
      } else {
        return $(tabElements[0]) && $(tabElements[0]).trigger('focus');
      }
    },

    /**
     * @param shiftTab
     * @param event
     * @returns true if focus is on last tabable element else false.
     */
    onLastTabElement: function (shiftTab, event) {
      // return true if focus is on last tabable element else false.
      return (shiftTab && event.target === this.$('*[tabindex]')[0]);
    },

    /**
     * @param event
     *
     */
    onKeyInView: function (event) {
      var keyCode = event.keyCode;

      //Enter/space
      if (keyCode === 13 || keyCode === 32) {
        $(event.target).trigger('click');
      }
    },

    onRender: function () {
      var headers = this.options.headers || [];
      if (headers.length) {
        _.each(headers, function (header) {
          var $header = this._renderHeader(header);
          this.$el.append($header);
        }, this);
      }
      var headerControl = this.options.headerControl;
      if (headerControl) {
        this.ui.headerControl.append(headerControl.$el);
        headerControl.render();
        headerControl.trigger('dom:refresh');
      }

      if (!!this.options.actionIconLeft) {
        this._adjustTitleCSS();
      }
    },

    onDomRefresh: function () {
      var headerControl = this.options.headerControl;
      if (headerControl) {
        headerControl.triggerMethod('dom:refresh');
        headerControl.triggerMethod('after:show');
      }
      if(this.isTabable()){
        this.currentlyFocusedElement();
      }
    },

    /**
     *
     * @private
     */
    _renderHeader: function (options) {
      var div = $('<div class="modal-header-item"></div>')
          .text(options.label);
      if (options.class) {
        div.addClass(options.class);
      }
      return div;
    },

    /**
     *
     * @private
     */
    _adjustTitleCSS: function (options) {
      this.$el.find('div.tile-title').addClass('tile-action-icon-tittle');
    }

  });

  return DialogHeaderView;
});


/* START_TEMPLATE */
csui.define('hbs!smart/controls/dialog/impl/dialog',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-modal-body cs-dialog cs-dialog-bodymessage\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"bodyMessage") || (depth0 != null ? lookupProperty(depth0,"bodyMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"bodyMessage","hash":{},"loc":{"start":{"line":5,"column":67},"end":{"line":5,"column":82}}}) : helper)))
    + "</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"binf-modal-body\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"binf-modal-dialog "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"binfDialogSizeClassName") || (depth0 != null ? lookupProperty(depth0,"binfDialogSizeClassName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"binfDialogSizeClassName","hash":{},"loc":{"start":{"line":1,"column":30},"end":{"line":1,"column":57}}}) : helper)))
    + "\" role=\"dialog\" aria-modal=\"true\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":1,"column":103},"end":{"line":1,"column":112}}}) : helper)))
    + "\" aria-hidden=\"false\">\n  <div class=\"binf-modal-content\" >\n    <div class=\"tile-header binf-modal-header\"></div>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"bodyMessage") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":4,"column":4},"end":{"line":8,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"binf-modal-footer binf-hidden\"></div>\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('smart_controls_dialog_impl_dialog', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/utils/non-emptying.region/non-emptying.region',['nuc/lib/marionette'], function (Marionette) {
  'use strict';

  var NonEmptyingRegion = Marionette.Region.extend({

    constructor: function NonEmptyingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function (view) {
      if (this.options && this.options.prependChild) {
        this.el.insertBefore(view.el, this.el.childNodes[0]);
      } else if (this.options && this.options.index >= 0) {
        this.el.insertBefore(view.el, this.el.childNodes[this.options.index]);
      } else {
        this.el.appendChild(view.el);
      }
    },

    empty: function (options) {
      var view = this.currentView;
      if (view) {
        view.off('destroy', this.empty, this);
        this.triggerMethod('before:empty', view);
        if (!(options && options.preventDestroy)) {
          this._destroyView();
        }
        this.triggerMethod('empty', view);
        delete this.currentView;
      }
      return this;
    },

    _destroyView: function () {
      var view = this.currentView;
      if (view.isDestroyed === true || view._isDestroyed) {
        return;
      }

      if (!view.supportsDestroyLifecycle) {
        Marionette.triggerMethodOn(view, 'before:destroy', view);
      }
      if (view.destroy) {
        view.destroy();
      } else {
        view.remove();
        if (typeof view.isDestroyed === 'function') {
          view._isDestroyed = true;
        } else {
          view.isDestroyed = true;
        }
      }
      if (!view.supportsDestroyLifecycle) {
        Marionette.triggerMethodOn(view, 'destroy', view);
      }
    }

  });

  return NonEmptyingRegion;

});

// TODO: needs to be enable once respective component is being moved here
csui.define('smart/controls/dialog/dialog.view',['module', 
  'nuc/lib/underscore', 
  'nuc/lib/jquery',
  'nuc/lib/backbone', 
  'nuc/lib/marionette',
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'smart/mixins/generic.utilities/footerview.responsiveness.mixin',
 // 'smart/behaviors/keyboard.navigation/smart.tabables.behavior',
  'smart/controls/dialog/footer.view',
  'smart/controls/dialog/header.view',
  'hbs!smart/controls/dialog/impl/dialog',
  'i18n!smart/controls/dialog/impl/nls/lang',
  'smart/utils/non-emptying.region/non-emptying.region',
  'nuc/utils/log',
  'i18n',
  'css!smart/controls/dialog/impl/dialog',
  'smart/lib/binf/js/binf'
], function (module, _, $, Backbone, Marionette,
    LayoutViewEventsPropagationMixin,
    FooterViewResponsiveMixin,
   // TabablesBehavior, 
    DialogFooterView, DialogHeaderView, dialogTemplate, lang,
     NonEmptyingRegion, 
    log,
    i18n) {

  log = log(module.id);

  /**
   * @description
   ## Dialog Control

   The dialog.view.js implements a marionette.LayoutView that renders a view in a modal dialog and waits for the user to close it.
   */

  var DialogView = Marionette.LayoutView.extend({
    /**
     *
     * @returns {{className: (*|string)}}
     */
    className: function () {
      var className = 'cs-dialog binf-modal binf-fade';
      if (this.options.className) {
        className += ' ' + _.result(this.options, 'className');
      }
      return className;
    },

    attributes: {
      'tabindex': '-1', // prevent focus to move outside dialog when tabbing through
      'aria-hidden': 'true'
    },

    template: dialogTemplate,

    // TODO: needs to be enable once respective component is being moved here
    // behaviors: {
    //   TabablesBehavior: {
    //     behaviorClass: TabablesBehavior,
    //     recursiveNavigation: true,
    //     containTabFocus: true
    //   }
    // },

    regions: {
      body: '.binf-modal-body',
      header: '.binf-modal-header',
      footer: '.binf-modal-footer'
    },

    ui: {
      header: '.binf-modal-header',
      footer: '.binf-modal-footer',
      body: '.binf-modal-body'
    },

    events: {
      'hide.binf.modal': 'onHiding',
      'hidden.binf.modal': 'onHidden',
      'click .cs-close': 'onClickClose',
      'shown.binf.modal': 'onShown',
      'keyup': 'onKeyInView', // must be keyup, because subviews want to intercept too
      'setCurrentTabFocus': 'setCurrentTabFocus',
      'tabNextRegion': 'tabNextRegion',
      'click .tile-type-action-icon': 'onClickActionIcon'
    },

    /**
     *
     * @returns {{binfDialogSizeClassName: (*|string), bodyMessage: (*|string)}}
     */
    templateHelpers: function () {
      var binfDialogSizeClassName = '';
      !!this.options.fullSize && (binfDialogSizeClassName = 'binf-modal-full');
      !!this.options.largeSize && (binfDialogSizeClassName = 'binf-modal-lg');
      !!this.options.midSize && (binfDialogSizeClassName = 'binf-modal-md');
      !!this.options.smallSize && (binfDialogSizeClassName = 'binf-modal-sm');
      return {
        binfDialogSizeClassName: binfDialogSizeClassName,
        bodyMessage: this.options.bodyMessage,
        title: this.options.title,
      };
    },

    /**
     * @name DialogView
     * @extends Marionette.LayoutView
     * @constructs
     */
    constructor: function DialogView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      $(window).on('resize', _.bind(this.onDomRefresh,this));
      this.$el.on('resize', this.onDomRefresh);
      // TODO: needs to be enable once respective component is being moved here
      //   this.listenToOnce(this, 'hide', TabablesBehavior.popTabableHandler);
        this.propagateEventsToRegions();
        this.currentFooterView = false;
    },

    onDomRefresh: function () { 
      if (this.footerView && !this.footerView.$el.hasClass("binf-hidden") && this.currentFooterView) {
        this.updateFooterView(this.footerView);
      }
    },

    onKeyInView: function (event) {
      // Don't close the Modal dialog if the default is prevented by subview.
      // Subviews such as popover or open menu would just close itself but not close Modal dialog.
      if (event.keyCode === 27 && !event.isDefaultPrevented()) {
        event.stopPropagation();
        this.destroy();
      }
      if (event.keyCode === 9) {
        if (this.$el.is(document.activeElement)) {
          var ele = event.shiftKey ? this.getActiveRegion(true) : this.getActiveRegion();
          $(ele).trigger("focus");
          event.stopPropagation();
        }
      }
    },
    
    getActiveRegion: function (last) {
      var tabElements = this.$el.find('*[tabindex=0]:not(:disabled):visible, input');
      if (last && tabElements.length) {
        return tabElements[tabElements.length - 1];
      } else {
        return tabElements.length && tabElements[0];
      }
    },

    /**
     * Sets focus on the current tab positioned element
     */
    setCurrentTabFocus: function () {
      this.focusOnLastRegion = true;
      this.$el.trigger('focus');
    },

    tabNextRegion: function () {
      this.trigger('changed:focus');
    },

    /**
     * Show dialog in NonEmptyingRegion
     */
    show: function () {
      var container = $.fn.binf_modal.getDefaultContainer(),
          region = new NonEmptyingRegion({el: container});
      region.show(this);
      return this;
    },

    onRender: function () {
      this.$el.addClass(DialogView.prototype.className.call(this))
          .attr({
            'tabindex': 0,
            'aria-label': this.options.dialogTxtAria || this.options.title || '',
            'role': 'region'
          });
      this._renderHeader();

      if (this.options.view) {
        this.body.show(this.options.view);
      }

      this._renderFooter();
    },

    /**
     * Adjusts the position of dialog after show
     */
    onShow: function () {
      // Firefox workaround for absolute modal dialogs, it does not position to active element.
      // Scroll the main-body down e.g. 2/3 and open an absolute modal dialog and in Firefox it will start at window position 0.
      // => navigate to pos 0    (Firefox likes window instead of 'body')
      $(window).scrollTop(0);

      this.$el.binf_modal({
        backdrop: 'static',
        keyboard: false,
        paddingWhenOverflowing: false
      });
    },

    /**
     * destroys the current view
     */
    kill: function () {
      this.destroy();
      return true;
    },

    /**
     * hide then destroys the dialog
     */
    destroy: function () {
      // If destroying was not triggered by the modal plugin, hide the
      // dialog first using that interface to prevent memory leaks
      if (this.$el.is(':visible')) {
        this.$el.binf_modal('hide');
      } else {
        DialogView.__super__.destroy.apply(this, arguments);
      }
      this._scrollToBegin();
      return this;
    },

    /**
     * @param id
     * @param options
     * updateButton - updates the button in the footerview if available
     */
    updateButton: function (id, options) {
      var footerView = this.footerView;
      if (!footerView.updateButton) {
        throw new Error('Dialog footer does not support button updating.');
      }
      footerView.updateButton(id, options);
    },

    /**
     * @param view
     * showView - shows the view in the body of dialog
     */
    showView: function (view) {
      this.body.show(view);
      view.triggerMethod('after:show');
    },

    /**
     * triggers the events after the dialog(header,footer) view is shown
     */
    onShown: function () {
      if (this.footerView && !this.footerView.$el.hasClass("binf-hidden") && this.currentFooterView) {
        this.updateFooterView(this.footerView);
        this.footerView.$el.removeClass("smart-footer-btn-wrapper");
      }
      if (this.options.view && this.options.view.triggerMethod) {
        this.options.view.triggerMethod('dom:refresh');
        this.options.view.triggerMethod('after:show');
      }
      if (this.headerView && this.headerView.triggerMethod) {
        this.headerView.triggerMethod('dom:refresh');
        this.headerView.triggerMethod('after:show');
      }
      if (this.footerView && this.footerView.triggerMethod) {
        this.footerView.triggerMethod('dom:refresh');
        this.footerView.triggerMethod('after:show');
      }
    },

    onHiding: function () {
      var self = this;
      this.$el.addClass('binf-fadein');
        setTimeout(function(){
          self.triggerMethod('before:hide');
        }, 300);  
    },

    onHidden: function () {
      this.triggerMethod('hide');
      this.destroy();
    },

    /**
     * @param event
     * onClickClose - closes the dialog and destroys
     */
    onClickClose: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.destroy();
    },

    /**
     * @param event
     *
     */
    onClickActionIcon: function (event) {
      //originating view listens this event and then executes their call back function
      this.options.view.trigger("click:actionIcon");
    },

    /**
     * @param view
     * onClickButton - executes the button's action, in footer view
     */
    onClickButton: function (view) {
      var attributes = view.model ? view.model.attributes : view;
      if (attributes.click) {
        attributes.click({
          dialog: this,
          button: this.$el,
          buttonAttributes: attributes
        });
      }
      if (attributes.close) {
        this.destroy();
      }
    },

    /**
     *
     * @private
     */
    _scrollToBegin: function () {
      // move the scrollbar of the "body" to the leftmost or rightmost position
      if (i18n.settings.rtl === true) {
        var pos = $('body').width();
        $('body').scrollLeft(pos);
      } else {
        $('body').scrollLeft(0);
      }
    },

    /**
     *
     * @private
     */
    _renderHeader: function () {
      var headerView = this.headerView = this.options.headerView,
          expandedHeader = this.options.standardHeader !== undefined ?
                           this.options.standardHeader : !this.options.template;
      if (headerView) {
        this.header.show(headerView);
      } else {
        var options = {
          iconLeft: this.options.iconLeft,
          iconNameLeft: this.options.iconNameLeft,
          actionIconLeft: this.options.actionIconLeft,
          actionIconNameLeft: this.options.actionIconNameLeft,
          imageLeftUrl: this.options.imageLeftUrl,
          imageLeftClass: this.options.imageLeftClass,
          title: this.options.title,
          iconRight: this.options.iconRight,
          iconNameRight: this.options.iconNameRight ? this.options.iconNameRight :
                         this.options.iconRight || this.options.buttons ? undefined : 'csui_action_close32',
          headers: this.options.headers,
          headerControl: this.options.headerControl,
          expandedHeader: expandedHeader,
          el: this.ui.header[0]
        };
        headerView = this.headerView = new DialogHeaderView(options);
        headerView.render();
        this.header.attachView(headerView);
        this.headerView.trigger('dom:refresh');
      }
    },

    /**
     *
     * @private
     */
    _renderFooter: function () {
      var footerView = this.footerView = this.options.footerView;
      if (footerView) {
        this.ui.footer.removeClass('binf-hidden');
        this.footer.show(footerView);
      } else {
        this.currentFooterView = true;
        var buttons = this.options.buttons || [];
        if (buttons.length) {
          this.ui.footer.removeClass('binf-hidden');
         var checkClose = buttons.some(function (button) {
            return button.close;
          });
          if (!checkClose) {
            buttons.push({
              id: lang.defaultButtonLabel,
              label: lang.defaultButtonLabel,
              close: true
            });
          }
        }
       
        footerView = this.footerView = new DialogFooterView({
          collection: new Backbone.Collection(buttons),
          el: this.ui.footer[0]
        });
        this.listenTo(footerView, 'childview:click button:click', this.onClickButton);
        this.footerView.$el.addClass("smart-footer-btn-wrapper");
        footerView.render();
        this.footer.attachView(footerView);
      }
    }

  }); 
  _.extend(DialogView.prototype, FooterViewResponsiveMixin);

  // TODO: needs to be enable once respective component is being moved here
   _.extend(DialogView.prototype, LayoutViewEventsPropagationMixin);

  return DialogView;

});

csui.define('smart/controls/pagination/impl/keyevent.navigation',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/base'
], function (_, $, base) {
  'use strict';

  var KeyEventNavigation = {
    isTabable: function () {
      if (base.isVisibleInWindowViewport(this.ui.pageSizeMenu) ||
          base.isVisibleInWindowViewport(this.ui.navPagingMenu)) {
        this.focusedElement = this.ui.dropDownMenu.is(':visible') ? this.ui.dropDownMenu :
                              this.ui.navPagingMenu.find('ul li:first-child a');
        return true;
      }
    },

    currentlyFocusedElement: function () {
      var activeChild = this.getActiveChild();
      return activeChild;
    },

     /**
     * @param event
     *
     */
    onKeyInView: function (event) {
      var keyCode = event.keyCode,
       continueEvent = true,
       activeChild = this.getActiveChild();
      this.activeChild || (this.activeChild = this.focusedElement);
      switch (keyCode) {
      //Enter and space
      case 32:
      case 13:
        if (this.activeChild === this.ui.dropDownMenu) {
          event.stopPropagation();
          event.preventDefault();
          $(event.target).trigger('click');
          continueEvent = true;
        }
        this.executeAction(this.activeChild);
        break;
      case 9:
        // add tabindex zero once focus is moved outof pagination
        if (this.activeChild !== this.focusedElement) {
          this.ui.dropDownMenu.attr('tabindex', '-1');
          this.activeChild.attr('tabindex', '0');
        } else {
          this.ui.dropDownMenu.attr('tabindex', '0');
        }
        break;
          //right arrow
      case 39:
        var nextChild = this._getNextActiveChild();
        nextChild &&  this.setNextActiveChild(nextChild);
        break;
          //left arrow
      case 37:
        var prevChild = this._getPrevActiveChild();        
        this.activeChild.attr('tabindex', '-1');
        this.setNextActiveChild(prevChild);
        break;
          //up arrow
      case 38:
        if (this.ui.dropDownMenu.parent().hasClass('binf-open')) {
          continueEvent = true;
        }
        else{
          this._pageUp();
        }        
        break;
          //page up
      case 33:
        this._pageUp();
        break;
          //down arrow
      case 40:
        if (this.ui.dropDownMenu.parent().hasClass('binf-open')) {
          continueEvent = true;
        }
        else {
          this._pageDown();
        }  
        break;
          //page down
      case 34:
        this._pageDown();
        break;
          //home
      case 36:
        this._activateHomeElem();
        continueEvent = false;
        break;
          //end
      case 35:
        this._activateEndElem();
        continueEvent = false;
        break;
      }
      return continueEvent;
    },

    /**
     * @param activeChild
     *
     */
    executeAction: function (activeChild) {
      if (activeChild) {
        var pageId = activeChild.attr('data-pageid');
        var nextPageMenu = activeChild.attr('data-slidepage');

        if (nextPageMenu) {
          var pageMenu = parseInt(nextPageMenu, 10);
          this.slidePageMenu(pageMenu);
          this.activeChild = this.ui.navPagingMenu.find('a').first();
          this.activateChild(true, this.activeChild);
        }
        else if (pageId) {
          var pageNum = parseInt(pageId, 10);
          this.changePage(pageNum);
          this.activeChild.removeClass('csui-acc-focusable-active');
        }
      }
    },

     /**
     * @param setActive
     * @param activeChild
     */
    activateChild: function (setActive, activeChild) {
      activeChild || (activeChild = this.getActiveChild());
      if (setActive) {
        activeChild.addClass('csui-acc-focusable-active');
        activeChild.trigger('focus');
      }
      else {
        activeChild.removeClass('csui-acc-focusable-active');
      }
    },

     /**
     * @param child
     */
    setActiveChild: function (child) {
      this.activeChild = child;
    },

    getActiveChild: function () {
      this.activeChild ||
      (this.activeChild = this.ui.dropDownMenu.is(':visible') ? this.ui.dropDownMenu :
                          this.ui.navPagingMenu.find('ul li:first-child a'));
      return this.activeChild;
    },

     /**
     * @param nextChild
     */
    setNextActiveChild: function (nextChild) {
      if (nextChild !== this.activeChild) {
        this.activateChild(false, this.activeChild);
        this.activateChild(true, nextChild);
        this.activeChild = nextChild;
      }
    },

    resetActiveChild: function () {
      var activeChild = this.activeChild;
      this.activateChild(false);
      this.activeChild = null;
      if (activeChild) {

        var pageId = activeChild.attr('data-pageid');
        var pageMenu = activeChild.attr('data-slidepage');

        if (pageId) {
          this.activeChild = this._updatedChildPosition(pageId, activeChild);
        }
        else if (pageMenu && (this.numSlideMenus > 1)) {
          var nextPageTab = activeChild.parent().prev();
          if (nextPageTab.length > 0) {
            nextPageTab = nextPageTab.find('a');
          }
          else {
            nextPageTab = activeChild.parent().next().find('a');
          }
          pageId = nextPageTab.attr('data-pageid');
          this.activeChild = this._updatedChildPosition(pageId, nextPageTab);
        }
      }
      if (base.isVisibleInWindowViewport(this.ui.pageSizeMenu) ||
          base.isVisibleInWindowViewport(this.ui.navPagingMenu)) {
        this.focusedElement = this.ui.dropDownMenu.is(':visible') ? this.ui.dropDownMenu :
                              this.ui.navPagingMenu.find('ul li:first-child a');
        this.activeChild || (this.activeChild = this.focusedElement);
      }
    },

     /**
      * @private
      * @param pageId
      * @param activeChild
      */
    _updatedChildPosition: function (pageId, activeChild) {
      pageId = parseInt(pageId, 10);
      if (this.totalCount > this.pageSize) {
        var numPages = this.numPages - 1;
        pageId = pageId > (numPages) ? numPages : pageId;
        var pageMenu = Math.floor(pageId / this.pageTabsPerMenu);
        if (pageMenu > 0) {
          this._initializePageTabMenu(true, true, pageMenu);
        }

        pageId += '';
        activeChild = _.find(this.ui.navPagingMenu.find('a'), function (child) {
          return $(child).attr('data-pageid') === pageId;
        });

        return $(activeChild);
      }
      return null;
    },

    /**
      * @private
      * 
      */
    _getPrevActiveChild: function () {
      var nextChild = this.focusedElement,
          activeChild = this.activeChild,
          activeEle = $(document.activeElement);

      //account for no paging tabs
      var nextSibling = activeChild.parent().prev().find('a');
      if (!activeEle.is(activeChild)) {
        nextSibling = activeEle.parent().prev().find('a');
      }
      if (nextSibling.length > 0) {
        nextChild = nextSibling;
        // remove tabindex for current active page
        if (!activeEle.hasClass('binf-dropdown-toggle') && activeEle.attr('tabindex') === '0') {
          activeEle.attr('tabindex', '-1');
          this.ui.dropDownMenu.attr('tabindex', '0');
        }
      }
      return nextChild;
    },

    /**
      * @private
      */
    _getNextActiveChild: function () {
      var nextChild = this.focusedElement,
          activeChild = this.activeChild,
          activeEle = $(document.activeElement);

      //account for no paging tabs
      var nextSibling = activeChild.parent().next().find('a');

      if (!activeEle.is(activeChild)) {
        nextSibling = activeEle.parent().next().find('a');
      }
      if (nextSibling.length > 0) {
        nextChild = nextSibling;
        // remove tabindex for current active page
        if (!activeEle.hasClass('binf-dropdown-toggle') && activeEle.attr('tabindex') === '0') {
          activeEle.attr('tabindex', '-1');
          this.ui.dropDownMenu.attr('tabindex', '0');
        }
      } else if (activeEle.hasClass('binf-dropdown-toggle')) {
        nextChild = this.ui.navPagingMenu.find('a').first();
      } else {
        nextChild = null;
      }
      return nextChild;
    },

    /**
      * @private
      */
    _activateHomeElem: function () {
      this.activeChild.attr('tabindex', '-1');
      this.activeChild = this._getFirstElem();
      this.activateChild(true, this.activeChild);
    },

    /**
      * @private
      */
    _activateEndElem: function () {      
      this.activeChild.attr('tabindex', '-1');
      this.activeChild = this._getLastElem();
      this.activateChild(true, this.activeChild);
    },

     /**
      * returns the last element in pagedropdown if opened, else last element in page navigation
      * @private
      */
    _getLastElem: function () {
      if(this.ui.dropDownMenu.parent().hasClass('binf-open')){
        return this.$el.find('.binf-dropdown ul > li:last-child > a ');
     } 
      return this.ui.navPagingMenu.find('a').last();
    },

     /**
      * returns the first element in pagedropdown if opened, else first element in page navigation
      * @private
      */
      _getFirstElem: function () {
        if(this.ui.dropDownMenu.parent().hasClass('binf-open')){
           return this.$el.find('.binf-dropdown ul > li:first-child > a ');
        } 
        return this.ui.navPagingMenu.find('a').first();
      },

    /**
      * @private
      */
    _pageUp: function () {
      var pageTab = this.ui.navPagingMenu.find('a').last();
      this._page(pageTab);
    },

    /**
      * @private
      * @param activeChild
      */
    _page: function (activeChild) {
      var nextPageMenu = activeChild.attr('data-slidepage');
      if (nextPageMenu) {
        this.activateChild(false, this.activeChild);
        this.activeChild = activeChild;
        this.executeAction(this.activeChild);
      }
    },

    /**
      * @private
      */
     _pageDown: function () {
      var pageTab = this.ui.navPagingMenu.find('a').first();
      this._page(pageTab);
    }

  };

  return KeyEventNavigation;

});

csui.define('smart/controls/pagination/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('smart/controls/pagination/impl/nls/root/localized.strings',{
  // controls/pagination
  PageNavBarTotalItems: "{0} items",
  PageNavBarSingleItem: "1 item",
  PageNavBarItemsPerPage: "{0} per page",
  PageNavBarShowAll: "Show all",
  PageNTotalsAria: "Showing page {0} of {1}, {2} items overall",
  ShowPageNAria: "Show page {0} of {1}",
  PreviousPagesAria: "Show previous pages",
  NextPagesAria: "Show next pages",
  SinglePageTotalsAria: "Showing {0} items",
  PageSizeMenuAria: "Select page size, {0} per page",
  PageSizeChoiceAria: "Pagination, show {0} per page",
  PaginationLandmarkAria: "Pagination",
  PageNavBarAboutItems: "About {0} items",
  PreviousLable: "Previous",
  NextLable: "Next",
});



/* START_TEMPLATE */
csui.define('hbs!smart/controls/pagination/impl/nodespagination',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"expanded-pager pager-filter csui-pagesize-menu\">\n    <div class=\"binf-dropdown csui-dropdown\">\n      <a href=\"\" class=\"binf-dropdown-toggle\" data-binf-toggle=\"dropdown\" role=\"button\"\n         aria-expanded=\"false\" tabindex=\"0\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"pageSizeMenuAria") || (depth0 != null ? lookupProperty(depth0,"pageSizeMenuAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"pageSizeMenuAria","hash":{},"loc":{"start":{"line":5,"column":56},"end":{"line":5,"column":76}}}) : helper)))
    + "\">\n        <div class=\"csui-pageSize binf-hidden-xs\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"itemsPerPage") || (depth0 != null ? lookupProperty(depth0,"itemsPerPage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"itemsPerPage","hash":{},"loc":{"start":{"line":6,"column":50},"end":{"line":6,"column":66}}}) : helper)))
    + "</div>\n        <div class=\"csui-icon icon-expandArrowDown binf-visible-xs\"></div>\n      </a>\n      <ul class=\"binf-dropdown-menu binf-dropdown-menu-left csui-dropdown-list\" role=\"menu\"></ul>\n    </div>\n  </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "binf-hidden-xs";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showPageSizeMenu") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":12,"column":7}}})) != null ? stack1 : "")
    + "  <div></div>\n  <div class=\"csui-pagination\">\n    <div class=\"csui-paging-navbar\">\n      <ul class=\"binf-hidden\">\n        <li class=\"csui-overflow\"></li>\n      </ul>\n    </div>\n  </div>\n<div class=\"csui-total-container-items "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"checkForPageLinks") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":21,"column":39},"end":{"line":21,"column":85}}})) != null ? stack1 : "")
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"totalItems") || (depth0 != null ? lookupProperty(depth0,"totalItems") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"totalItems","hash":{},"loc":{"start":{"line":21,"column":87},"end":{"line":21,"column":101}}}) : helper)))
    + "</div>\n";
}});
Handlebars.registerPartial('smart_controls_pagination_impl_nodespagination', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!smart/controls/pagination/impl/nodespagination',[],function(){});
csui.define('smart/controls/pagination/nodespagination.view',[
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/utils/log',
  'nuc/lib/backbone',
  'nuc/lib/marionette', 
  //'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'smart/controls/pagination/impl/keyevent.navigation',
  'i18n!smart/controls/pagination/impl/nls/localized.strings',
  'hbs!smart/controls/pagination/impl/nodespagination',
  'css!smart/controls/pagination/impl/nodespagination',
  'smart/lib/binf/js/binf'
], function ($, _, log, Backbone, Marionette, /*TabableRegionBehavior,*/ KeyEventNavigation,
      lang, template) {
  'use strict';

  var NodesPaginationView = Marionette.ItemView.extend({

    template: template,
    className: 'csui-pager',
    ui: {
      totalCount: '> .csui-total-container-items',
      pageSizeMenu: '> .csui-pagesize-menu',
      dropDownMenu: '> .csui-pagesize-menu > .csui-dropdown > .binf-dropdown-toggle',
      dropDownList: '> .csui-pagesize-menu .csui-dropdown-list',
      navPagingMenu: '> .csui-pagination > .csui-paging-navbar',
      dropDownListItem: '> .csui-pagesize-menu ul.csui-dropdown-list a'
    },

    templateHelpers: function () {
      var totalCount = this._getTotalCount();
      var pageSize = this.pageSize && this.pageSize > 0 ? this.pageSize : 30;
      this.pageTotalAria = totalCount <= pageSize ?
                           _.str.sformat(lang.SinglePageTotalsAria, totalCount) :
                           _.str.sformat(lang.PageNTotalsAria, this.currentPageNum,
                              Math.ceil(totalCount / pageSize), totalCount); // Removed 1 + Math.foor(), this was adding 1 extra page when totalCount%pageSize is 0 (Identified bug in QA verification of SVF-1568). Math.ceil is right utility fn to use here.

      this.nextPagesAria = lang.NextPagesAria;
      this.previousPagesAria = lang.PreviousPagesAria;

      return {
        showPageSizeMenu: this._showPageSizeMenu(),
        totalItems: this._getTotalDisplayCount(),
        itemsPerPage: _.str.sformat(lang.PageNavBarItemsPerPage, this.selectedPageSize),
        pageSizeMenuAria: _.str.sformat(lang.PageSizeMenuAria, this.selectedPageSize),
        checkForPageLinks: this._getTotalCount() > this.pageSize
      };
    },

    events: {
      'keydown @ui.dropDownListItem': 'resetPageSizeKeyUp',
      'click .csui-pagesize-menu ul.csui-dropdown-list a': 'resetPageSize',
      'click .csui-paging-navbar > ul > li:not(.csui-overflow) > a': 'onChangePage',
      'click .csui-pagination  li.csui-overflow > a': 'onSlidePageMenu',
      'keydown': 'onKeyInView'
    },

    // behaviors: {
    //   TabableRegion: {
    //     behaviorClass: TabableRegionBehavior
    //   }
    // },

    /**
     * @name NodesPaginationView
     * @extends Marionette.ItemView
     * @constructs
     * @param options {Object} - Recognized option properties:
     * @param options.pageSize - Number of items to be displayed in a page .
     * @param currentPageNum - Active page number to be displayed.
     * @param ddList - paze size dropdown list.
     */
    constructor: function NodesPaginationView(options) {
      options || (options = {});
      options.pageSize || (options.pageSize = 30);

      Marionette.ItemView.prototype.constructor.call(this, options);

      this.addPaging = true;
      this.currentPageNum = 1;
      this.ddList = this.defaultDDList = options.defaultDDList || [30, 50, 100];
      this.skipCollectionRequest = false;
      //For Versions, we get all the versions at a time and doing pagination at client side
      //when ever we delete and add version skip the immediate pagination
      this.skipPaginationUpdateRequest = !!options.skipPaginationUpdateRequest;
      this.pageSize = this.selectedPageSize = this.options.pageSize;
      this.rendered = false;
      this.pageTotalAriaLast = undefined;
      this.pageTotalTimeoutHandle = undefined;
      this.aboutPrefix = this.options.aboutPrefix === undefined ? true : this.options.aboutPrefix;

      var skip = this.options.pageNumber ? this.options.pageNumber * this.options.pageSize : 0;
      if (this.collection) {
        this.resetCollection(skip, this.options.pageSize, false);
        this.listenTo(this.collection, 'reset', this.collectionChange); // render after reset of collection
        this.listenTo(this.collection, 'add', this._maintainPageSize); // render after an item upload
        this.listenTo(this.collection, 'remove', this._maintainPageSize); // render after a delete item
        this.listenTo(this.collection, 'paging:change', this._collectionPageInfoChanged);

         //Refresh setting for new node before request is made.
        this.listenTo(this, 'reset:attributes', this.resetAttributes);
        
      }

      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
    },

    onDestroy: function () {
      $(window).off("resize.app", this.onWinRefresh);
    },

    windowRefresh: function () {
      if (this._isRendered) {
        var initializePageTabMenu = this.totalCount > this.pageSize;
        initializePageTabMenu && this._initializePageTabMenu(false, true);
        this.resetActiveChild();
      }
    },

    /**
     * Resets collection and recalculate pagesize
     */
    collectionChange: function () {
      var slideBars = this.$el.find('.csui-paging-navbar ul');

      this.totalCount = 0;
      //In JQuery 'remove' and 'empty' behave the same. They both clean events and caching of the childNodes.
      //The only difference with 'empty' is that it also removes each child element of the slideBar using 'removeChild',
      //where 'remove' just removes the parentNode. If was found using Chrome Profiler that UL Li elements were not getting
      //cleaned up by GC if just 'remove' was call. This appears to be related to some system caching of the element. Also
      //if we grab the '.csui-paging-navbar' element in attempt to empty it, again LI elements do not get cleaned up and show
      //as detached.
      slideBars.empty();
      slideBars.remove();

      //revert back to the last page size set before collections was updated
      if (this.lastAction !== 'setPageSize') {
        this._reCalculatePageSizes();
      }

      this.lastAction = '';
      this.render();

      if (this.collection.actualSkipCount === 0 && this.collection.skipCount !== 0) {
        this.resetCollection(0, this.pageSize, false);
      }

    },

     //This function is called when a node module change is made. It refreshes all setting for the new node.
     resetAttributes: function () {
      if(!$(this.ui.dropDownMenu).is(':visible')){
        $(this.ui.dropDownList).removeAttr('role');
        this.ui.dropDownList && $(this.ui.dropDownList).empty();
        this.$el.parent().removeAttr('role aria-label');
        this.$el.removeAttr('role aria-label');
      }
      this.pageSize = this.selectedPageSize = this.options.pageSize;
      this.totalCount = 0;
      this.resetRenderFlags();
      if (this._isRendered) {
        this.setActiveChild(this.ui.dropDownMenu);
      }
    },

    /**
     *
     * set addpaging true
     */
    resetRenderFlags: function () {
      this.addPaging = true;
    },

    /**
     *
     *event handler, called when user clicked the page-number-link: remove the 'active' class at li elements with active class set and add the 'active' class to the clicked element. Then call setLimit at the collection to request the new data from the server.
     */
    onChangePage: function (e) {
      e.preventDefault();
      e.stopPropagation();
      var targetPageTab = $(e.currentTarget),
          pageNum       = parseInt(targetPageTab.attr('data-pageid'), 10);
      this.changePage(pageNum);
      this.setActiveChild(targetPageTab);
    },

     /**
     * @param pageNum
     * resets collection on changing the page
     */
    changePage: function (pageNum) {
      var pageSize = this.pageSize;
      this.currentPageNum = pageNum + 1;
      var skipCount = pageNum * pageSize;
      this.collection.pagination = this.addPaging;
      this.collection.trigger('new:page');
      this.resetCollection(skipCount, pageSize, true);

      this.templateHelpers();
    },

    /**
     * @param skipItems
     * @param pageSize
     * @param autoFetch
     *Set the new offset to the children collection and let it load new data from server. Note: the view is rendered automatically when the collection gets filled with new data, because in the constructor we registered on the reset event at the collection
     */
    resetCollection: function (skipItems, pageSize, autoFetch) {
      var resetObj = {skipItems:skipItems, pageSize:pageSize, autoFetch:autoFetch, paginationView:this};
      this.collection.trigger('collection:set:limit', resetObj);
    },

    resetPageSizeKeyUp: function (e) {
      if (e.keyCode === 32) {
        this.resetPageSize(e);
      }
      return true;
    },

    resetPageSize: function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.collection.pagination = this.addPaging;
      var newPageSize = parseInt($(e.currentTarget).attr('data-pagesize'), 10);
      this.setPageSize(newPageSize, true);
      this.setActiveChild(this.ui.dropDownMenu);
    },

    setPageSize: function (size, autoFetch) {
      this.pageSize = this.selectedPageSize = size;
      if (this.skipCollectionRequest || !autoFetch) {
        this.skipCollectionRequest = false;
      } else {
        this.rendered = false;
        this.resetCollection(0, size, autoFetch);
      }
      this.lastAction = 'setPageSize';
      this.currentPageNum = 1;
      this.trigger('pagesize:updated', this);
    },

    _setPageTotalAria: function () {
      if (this.pageTotalAria != this.pageTotalAriaLast) {
        // avoid writing the same value again to avoid repetitive spoken info which might mask other texts
        this.$el.parent().children(".binf-sr-only").html(this.pageTotalAria);
        this.pageTotalAriaLast = this.pageTotalAria;
        this.pageTotalTimeoutHandle = undefined;
      }
    },

    onRender: function () {
      var collection = this.collection;

      // add the binf-sr-only div near the top so it is not covered by the binf-hidden for empty folders
      var sronlyExists = this.$el.parent().children(".binf-sr-only");
      if (!(sronlyExists && sronlyExists.length)) {
        this.$el.before('<div class="binf-sr-only" aria-live="polite"></div>');
      }

      //Check that all data needed has been received and initialized. DropDown list
      //is looked at to see if one will appear or not. Both Node container size and collection sizes
      //are used to account for cases where node data is known before collection is received, and collection is known
      //and node data is not (i.e. Favorites view).
      if (this._validCollection(collection)) {
        this.pageSize = (this.pageSize > this.options.pageSize) &&
                        (this.pageSize > this.totalCount) ? this.totalCount : this.pageSize;
        this.rendered = true;
        this.$el.removeClass('binf-hidden');
        this._initializeDDList();
        if (this.pageTotalTimeoutHandle) {
          clearTimeout(this.pageTotalTimeoutHandle);
        }
        this.pageTotalTimeoutHandle = setTimeout(this._setPageTotalAria.bind(this), 1200);
      } else {
        this.$el.addClass('binf-hidden');
        if (!this.pageTotalTimeoutHandle) {
          this.pageTotalTimeoutHandle = setTimeout(this._setPageTotalAria.bind(this), 2400);
        }
      }

      this.trigger('render:complete');
    },

    //Account for Window resizing effecting the appearance of the pagination bar
    onDomRefresh: function () {

      //Wait for render command to finish successfully first, before sizing.
      if (this._validCollection(this.collection) && this.rendered) {
        this.totalCount = this._getTotalCount();
        var totalCount = this.totalCount;
        if (totalCount !== 0 && this._showPageSizeMenu()) {
          this._setPageSizeMenu();
          if (totalCount > this.pageSize) {
            this._initializePageTabMenu(true, true);
          }
        }
        this.resetActiveChild();
      }
    },

    onSlidePageMenu: function (e) {
      e.preventDefault();
      e.stopPropagation();
      var nextPgMenu = parseInt($(e.currentTarget).attr('data-slidepage'), 10);
      var prevBtnClicked = $(e.currentTarget).hasClass('csui-overflow-left');
      this.slidePageMenu(nextPgMenu, prevBtnClicked);
    },

    slidePageMenu: function (nextPgMenu, prevBtnClicked) {
      var el = this.$el;
      this._initializePageTabMenu(true, true, nextPgMenu);
      el.find('.csui-pages-' + nextPgMenu).addClass('csui-slide');
      if (prevBtnClicked && prevBtnClicked === true) {
        el.find(' .csui-paging-navbar ').addClass('csui-prev-active');
      } else {
        el.find(' .csui-paging-navbar ').removeClass('csui-prev-active');
      }
    },

    getDDList: function (tt) {
      var ddItemLists  = this.defaultDDList,
          ddListLength = ddItemLists.length,
          ddList       = [];

      for (var i = 0; i < ddListLength; i++) {
        ddList.push(ddItemLists[i]);
      }

      return ddList;
    },
     
    /**
     *
     * @private
     */
    _getOverflowIconWidth: function () {
      if (!this.overFlowIcon || this.overFlowIcon === 0) {
        //To avoid possible memory leaks due to a retained reference to the csui-overflow in the
        //view's 'ui' collection, a direct jquery find is used instead.
        var overFlowIcon = this.$el.find('.csui-paging-navbar > ul > li.csui-overflow');
        this.overFlowIcon = parseInt(overFlowIcon.css('min-width'), 10);
      }
      return this.overFlowIcon;
    },
 
    /**
     *
     * @private
     */
    _getPageTabMinWidth: function () {
      // var pageTabs = this.$el.find('.csui-paging-navbar ul li');
      if (!this.pageTabMinWidth || this.pageTabMinWidth === 0) {
        //To avoid possible memory leaks due to a retained reference to the csui-overflow in the
        //view's 'ui' collection, a direct jquery find is used instead.
        var pageTab = this.$el.find('.csui-paging-navbar > ul > li');
        this.pageTabMinWidth = parseInt(pageTab.css('min-width'), 10);
        pageTab = null;
      }
      this.pageTabMinWidth = 46;
      return this.pageTabMinWidth;
    },

    /**
     *
     * @private
     */
    //Initialize the options for the drop down page size. The maximum
    //size should not exceed the total collection count.
    _initializeDDList: function () {

      this.ddList = this.getDDList(this.totalCount);
    },

     /**
     * @private
     * @param collection
     */
    _validCollection: function (collection) {
      var retVal     = false,
          totalCount = this.totalCount;

      if (!collection) {
        log.error('Pagination won\'t be rendered (collection is not set)') &&
        console.error(log.last);
      } else {
        var collectionCount = this._getTotalCount(collection);
        this.totalCount = totalCount && totalCount < collectionCount ? totalCount : collectionCount;

        if (collectionCount && collectionCount > 0) {
          retVal = true;
        }
      }

      return retVal;
    },
     
     /**
     * @private
     */
    _getTotalDisplayCount: function () {
      var collection   = this.collection,
          totalCount   = this._getTotalCount(),
          displayCount = '';

      if (totalCount > 0) {
        displayCount = totalCount === 1 ? lang.PageNavBarSingleItem :
                       totalCount === collection.skipCount + collection.length ?
                       lang.PageNavBarTotalItems : this.aboutPrefix === true
                       ? lang.PageNavBarAboutItems : lang.PageNavBarTotalItems;

        displayCount = _.str.sformat(displayCount, totalCount);
      }

      return displayCount;
    },

    /**
     * @private
     * 
     */
     // do not show page size selection dropdown, when total items count in the container
     // is less than the least selectable page size option.
    _showPageSizeMenu :  function () {
      return this._getTotalCount() > this.ddList[0];
    },

    /**
     * @private
     */
    _setPageSizeMenu: function () {
      var totalCount = this._getTotalCount();
      if (totalCount !== 0) {
        if (this.ddList.length >= 1) {
          this._addPageSizeOptions(totalCount);
        }
      }
    },

    /**
     * @private
     * @param totalCount
     */
    _addPageSizeOptions: function (totalCount) {
      var html      = '',
          listArray = [],
          ddList    = this.ddList,
          pageSize  = this.pageSize;

      this.ui.dropDownList[0].innerHTML = '';
      for (var i = ddList.length - 1; i >= 0; i--) {
        // if page size options are 30, 50, 100 and total items count is 45,
        // then show only relevant page size options i.e only 30, 50.
        if (totalCount > ddList[i] || totalCount > ddList[i - 1]) {
          var ddListItem  = ddList[i],
              txt         = _.str.sformat(lang.PageNavBarItemsPerPage, ddListItem),
              ariaTxt     = _.str.sformat(lang.PageSizeChoiceAria, ddListItem),
              className   = (ddListItem === this.selectedPageSize) ? 'csui-select' : '',
              ariaCurrent = (ddListItem === pageSize) ? ' aria-current="true" ' : '',
              str         = '<li role="none">' +
                            '<a role="menuitem" href="#" class="' +
                            className + '" data-pagesize=' + ddListItem + ariaCurrent +
                            ' aria-label="' + ariaTxt +
                            '"><span class="csui-pagination-checked icon-listview-checkmark"></span>' +
                            txt + '</a></li>';

          listArray.push(str);
          html += str;
        }
      }

      this.ui.dropDownList.append(html);
      return true;
    },

     /**
     * @private
     * @param forceReset
     * @param activateMenu
     * @param activeMenu
     */
    _initializePageTabMenu: function (forceReset, activateMenu, activeMenu) {
      // create a navigation landmark with proper label as navigation alternative for screenreader users.
      // will not be there when pagination items are not shown.
      this.$el.parent().attr('role', 'navigation').attr('aria-label', lang.PaginationLandmarkAria);
      // make all the buttons/links in the pagination menu part of a menubar
      this.$el.attr('role', 'navigation').attr('aria-label', lang.PaginationLandmarkAria);

      var minPageTabWidth   = this._getPageTabMinWidth(),
          overflowIconWidth = this._getOverflowIconWidth();
      this._setPageTabMenu(minPageTabWidth, overflowIconWidth, forceReset, activateMenu,
          activeMenu);
    },
    // use the values from the server response to calculate the pagination
    //  topCount: page size
    //  actualSkipCount: number of items skipped for a specific page
    //  totalCount: total number of items in the container node
    _setPageTabMenu: function (minPageTabWidth, nextIconWidth, forceReset, activateMenu,
        activeMenu) {
      var numPages = this.numPages = Math.ceil(this._getTotalCount() / this.pageSize);
      var pageTabsPerMenu = this._getPageTabsPerSlideMenu(minPageTabWidth, nextIconWidth, numPages);
      this.numSlideMenus = Math.ceil(numPages / pageTabsPerMenu);

      if (forceReset || (pageTabsPerMenu !== this.pageTabsPerMenu)) {
        this.pageTabsPerMenu = pageTabsPerMenu;
        //If activate new menu then destroy old menu
        activateMenu && this.ui.navPagingMenu.html('');
        this._addSideMenu(this.numSlideMenus, pageTabsPerMenu, numPages, activateMenu, activeMenu);
      }
    },

    /**
     * @private
     * @param minPageTabWidth
     * @param nextIconWidth
     * @param numPages
     */
    _getPageTabsPerSlideMenu: function (minPageTabWidth, nextIconWidth, numPages) {
      var navMenuWidth = this.ui.navPagingMenu.width(),
          pageTabs     = Math.floor(navMenuWidth / minPageTabWidth);

      //If more than on page menu, then reduce tab count based on the appearance of
      //next and previous icon
      if (pageTabs < numPages) {
        pageTabs = Math.floor((navMenuWidth - 2*nextIconWidth) / minPageTabWidth); /** Previous & next are always taking space and having same width. **/
        (pageTabs <= 0) && (pageTabs = 1);
      }
      return pageTabs;
    },

     /**
     * @private
     * @param numSlideMenus
     * @param pageTabsPerMenu
     * @param numPages
     * @param activate
     * @param currSlideMenu
     */
    _addSideMenu: function (numSlideMenus, pageTabsPerMenu, numPages, activate, currSlideMenu) {

      var navPagingMenu = this.ui.navPagingMenu,
          skipCount     = this.collection.skipCount,
          totalCount    = this.totalCount,
          pageSize      = this.pageSize,
          currPage      = skipCount > totalCount ? numPages - 1 : skipCount / pageSize;

      currSlideMenu = currSlideMenu == null ? Math.floor(currPage / pageTabsPerMenu) :
                      currSlideMenu;
      var startPageNum = currSlideMenu * pageTabsPerMenu;

      var html     = '',
          slideBar = $(
              '<ul class="binf-nav expanded-pager pager-tabs csui-pages csui-pages-' +
              currSlideMenu + '"></ul>');

      if (currSlideMenu > 0) {
        html += '<li class="csui-overflow"><a href="#" tabindex="-1" class="csui-overflow-left" data-slidePage="'
                + (currSlideMenu - 1) +
                '" aria-label="' + this.previousPagesAria + '" title="' + this.previousPagesAria +
                '"><span>' + lang.PreviousLable + '</span></a></li>';
      } else {
        html += '<li class="csui-overflow smart-empty-placeholder"></li>';
      }

      html += this._addPageTabs(startPageNum, currPage, pageTabsPerMenu, numPages);
      if (activate) {
        slideBar.addClass('csui-active');
      }

      if (currSlideMenu < numSlideMenus - 1) {
        html += '<li class="csui-overflow"><a href="#" tabindex="-1" class="csui-overflow-right" data-slidePage="'
                + (currSlideMenu + 1) +
                '" aria-label="' + this.nextPagesAria + '" title="' + this.nextPagesAria +
                '"><span>' + lang.NextLable + '</span></a></li>';
      } else {
        html += '<li class="csui-overflow smart-empty-placeholder"></li>';
      }
      // Added below code to remove space is displayed on last slide page
      if (currSlideMenu === numSlideMenus - 1) {
        this.$el.find(".csui-pagination").find(".csui-paging-navbar").addClass(
            "csui-last-slidePage");
      } else {
        this.$el.find(".csui-pagination").find(".csui-paging-navbar").removeClass(
            "csui-last-slidePage");
      }

      slideBar.append(html);
      navPagingMenu.html(slideBar);
    },

    
     /**
     * @private
     * @param startPage
     * @param currPage
     * @param pageTabsPerMenu
     * @param numPages
     */
    _addPageTabs: function (startPage, currPage, pageTabsPerMenu, numPages) {
      var retVal = false;
      var endPage = ((startPage + pageTabsPerMenu) >= numPages) ? numPages :
                    startPage + pageTabsPerMenu;
      var html = '';

      for (var pageNum = startPage; pageNum < endPage; pageNum++) {
        var txt = pageNum + 1;
        html += '<li><a href="#" tabindex="-1" class="';

        if ((pageNum) === currPage) {
          html += 'csui-activePage" aria-current="page';
        }

        var showAria = _.str.sformat(lang.ShowPageNAria, txt, numPages);
        html += '" data-pageid="' + pageNum + '" aria-label="' + showAria + '" title="' + showAria +
                '"><span>' + txt + '</span></a></li>';
      }

      return html;

    },

     /**
     * @private
     * 
     */
    _reCalculatePageSizes: function () {
      this._calculateSelectPageSize();
      this._reCalculatePageSize();
    },

    /**
     * @private
     * 
     */
    //Determine what the page size should be based on the last user selected size and available
    //drop-down page sizes.
    _calculateSelectPageSize: function () {

      var selectedPageSize = this.selectedPageSize,
          collectionTotal  = this._getTotalCount(),
          sizeList         = this.defaultDDList;

      this.selectedPageSize = _.indexOf(sizeList, selectedPageSize) > -1 ? selectedPageSize :
                              (selectedPageSize >= collectionTotal) ? collectionTotal :
                              _.find(sizeList, function (size) {
                                return selectedPageSize < size;
                              });
    },

    /**
     * @private
     * 
     */
    _reCalculatePageSize: function () {
      var defaultPageSize = this.options.pageSize,
          collectionCount = this._getTotalCount();

      this.pageSize = collectionCount === 0 ? defaultPageSize :
                      ((this.selectedPageSize > collectionCount) ? collectionCount :
                       this.selectedPageSize);
    },

    /**
     * @private
     * @param model
     * @param collection
     * @param trigger
     */
    //Maintain page size as items are being uploaded and added to the top of the table list.
    _maintainPageSize: function (model, collection, trigger) {
      //Set csuiIsSelected property to false for newly added models
      if (collection.isPoped) {
        delete collection.isPoped;
        return true;
      }
      if (model.get('csuiIsSelected')) { model.set('csuiIsSelected', false);}
      //maintain collection count after add or remove
      this._updateTotalCount(trigger);

      this.resetRenderFlags();
      this._initializeDDList(false);

      if (this.skipPaginationUpdateRequest && !!this.collection.allModels &&
          this.collection.allModels.length === this.collection.skipCount) {
        // update skipCount when we delete all the items in last page
        this.collection.skipCount = this.collection.skipCount - this.collection.topCount;
      }

      //Skip collection request as page size is re-configured on new collection size. We don't want to force a new collection call, with
      //a new page size, as items are being added to the table during an upload. We just
      //want to increase the display total and pagination tabs.
      this.skipCollectionRequest = true;
      this._reCalculatePageSizes();
      this.render();
      return true;
    },

     /**
     * @private
     * @param collection
     */
    _getTotalCount: function (collection) {
      var totalCount = 0;
      if (!collection) {
        collection = this.collection;
      }
      if (collection) {
        totalCount = collection.filteredCount;
        if (totalCount == null) {
          totalCount = collection.totalCount;
        }
        if (totalCount == null) {
          totalCount = collection.length;
        }
      }
      return totalCount;
    },

    /**
     * @private
     * @param trigger
     */
    _updateTotalCount: function (trigger) {
      var difference = trigger.add ? 1 : -1;
      this.totalCount += difference;
      if (this.collection.filteredCount != null) {
        this.collection.filteredCount += difference;
      }
      if (this.collection.totalCount != null) {
        this.collection.totalCount += difference;
      }
    },

    /**
     * @private
     */
    _collectionPageInfoChanged: function () {
      this.pageSize = this.selectedPageSize = parseInt(this.collection.topCount);
    }

  });

  _.extend(NodesPaginationView.prototype, KeyEventNavigation);
  return NodesPaginationView;
});

csui.define('smart/controls/progressblocker/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('smart/controls/progressblocker/impl/nls/root/lang',{
  loadingText: "Loading.."
});



/* START_TEMPLATE */
csui.define('hbs!smart/controls/progressblocker/impl/blocker',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"outer-border\">\n    <div class=\"loader\"></div>\n    <div class=\"binf-sr-only\" aria-live=\"polite\" aria-busy=\"true\">\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"loadingText") || (depth0 != null ? lookupProperty(depth0,"loadingText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"loadingText","hash":{},"loc":{"start":{"line":4,"column":6},"end":{"line":4,"column":21}}}) : helper)))
    + "\n    </div>\n  </div>\n  <div class=\"csui-common-loading-parent-wrapper binf-hidden\">\n    <div class=\"csui-loading-3dots\">\n    <div class=\"csui-loading-dots-wrapper\">\n      <span class=\"csui-loading-dot\"></span>\n      <span class=\"csui-loading-dot\"></span>\n      <span class=\"csui-loading-dot\"></span>\n    </div>\n     <div class=\"placeholder\" aria-live=\"polite\" aria-busy=\"true\">\n      "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"loadingText") || (depth0 != null ? lookupProperty(depth0,"loadingText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"loadingText","hash":{},"loc":{"start":{"line":15,"column":6},"end":{"line":15,"column":21}}}) : helper)))
    + "\n    </div>\n    </div>\n  </div>";
}});
Handlebars.registerPartial('smart_controls_progressblocker_impl_blocker', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!smart/controls/progressblocker/impl/blocker',[],function(){});
csui.define('smart/controls/progressblocker/blocker',[
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/marionette', 'nuc/utils/log',
  'i18n!smart/controls/progressblocker/impl/nls/lang',
  'hbs!smart/controls/progressblocker/impl/blocker',
  'css!smart/controls/progressblocker/impl/blocker'
], function (module, _, $, Marionette, log, lang, template) {
  'use strict';

  log = log(module.id);

  var config = module.config();
  _.defaults(config, {
    delay: 10,
    disableDelay: 10,
    globalOnly: false
  });
  var suppressedViews = [],
      globalBlockingView, detachableBlockingView;

  var BlockingView = Marionette.ItemView.extend({
    className: 'load-container binf-hidden',
    template: template,

    /**
     * @name BlockingView
     * @extends Marionette.ItemView
     * @constructs
     * @param options {Object} - Recognized option properties:
     * @param options.parentView {object} - constructor of the parentView.
     * @param options.local {Boolean} - another local blocking view will work alone.
     */
    constructor: function BlockingView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.parentView = options.parentView;
      this.counter = 0;
    },

    /**
     *
     * @returns {{showloadingWheel: boolean, loadingText: string}}
     */
    serializeData: function () {
      return {
        showloadingWheel: !!this.showloadingWheel,
        darkBackground: !!this.parentView.darkBackground,
        loadingText: this.parentView.loadingText || lang.loadingText
      };
    },

    /**
     *
     * Enables blocking view based on local boolean value.
     * guard against multiple enabling calls.
     */
    enable: function () {
      if (!this.options.local) {
        var blockingView = this._getGlobalBlockingView();
        if (blockingView) {
          log.debug(
              'Blocking view delegates global enabling by {0} ({1}) to {2} ({3}), counter: {4}.',
              log.getObjectName(this.parentView), this.parentView.cid,
              log.getObjectName(blockingView.parentView), blockingView.parentView.cid,
              blockingView.counter) && console.log(log.last);
          if (detachableBlockingView) {
            suppressBlockingView(this);
          } else {
            return blockingView.enable();
          }
        }
      }
      // guard against multiple enabling calls
      if (this.counter) {
        ++this.counter;
      } else {
        this.counter = 1;
        if (this.disableTimeout) {
          clearTimeout(this.disableTimeout);
          this.disableTimeout = undefined;
        } else {
          // delay the actual display by the configured time period
          this.enableTimeout = setTimeout(_.bind(function () {
            this.enableTimeout = undefined;
            this._show();
            log.debug('Blocking view enabled by {0} ({1}).',
                log.getObjectName(this.parentView), this.parentView.cid)
            && console.log(log.last);
            Marionette.triggerMethodOn(this.parentView, 'enable:blocking', this);
          }, this), BlockingView.getModuleConfigs().delay);
        }
      }
    },

    /**
     *
     * Disables blocking view based on local boolean value.
     * guard against multiple disabling calls.
     */
    disable: function () {
      if (!this.options.local) {
        var blockingView = this._getGlobalBlockingView();
        if (blockingView) {
          log.debug(
              'Blocking view delegates global disabling by {0} ({1}) to {2} ({3}), counter: {4}.',
              log.getObjectName(this.parentView), this.parentView.cid,
              log.getObjectName(blockingView.parentView), blockingView.parentView.cid,
              blockingView.counter) && console.log(log.last);
          if (!detachableBlockingView) {
            return blockingView.disable();
          }
        }
      }
      // guard against multiple disabling calls
      if (this.counter > 1) {
        --this.counter;
      } else if (this.counter === 0) {
        log.debug('Blocking view has been already disabled by {0} ({1}).',
            log.getObjectName(this.parentView), this.parentView.cid)
        && console.log(log.last);
      } else {
        this.counter = 0;
        // if the showing delay hasn't ended yet just cancel the display
        if (this.enableTimeout) {
          clearTimeout(this.enableTimeout);
          this.enableTimeout = undefined;
          releaseBlockingViews(this);
        } else {
          // delay the actual hiding in case another showing should come quickly
          this.disableTimeout = setTimeout(_.bind(function () {
            this.disableTimeout = undefined;
            this._hide();
            log.debug('Blocking view disabled by {0} ({1}).',
                log.getObjectName(this.parentView), this.parentView.cid)
            && console.log(log.last);
            releaseBlockingViews(this);
            Marionette.triggerMethodOn(this.parentView, 'disable:blocking', this);
          }, this), BlockingView.getModuleConfigs().disableDelay);
        }
      }
    },

    /**
     *
     * Destroys current blocking view
     */
    onBeforeDestroy: function () {
      this._clearTimeouts();
      this._resetGlobalBlockingView();
    },

    /**
     *
     * @param detachable
     */
    makeGlobal: function (detachable) {
      // The outermost view, which usually means the first view, should win
      if (!globalBlockingView) {
        detachableBlockingView = !!detachable;
        globalBlockingView = this;
        this.$el.addClass('csui-global');
      }
    },

    /**
     *
     * @private
     */
    _getGlobalBlockingView: function () {
      // If this view is the global view, return false; otherwise and endless recursion
      // would occur constantly delegating the operation to the global view
      if (globalBlockingView && globalBlockingView !== this &&
          // Join the global blocking view, if using just the global one was forced,
          // or if the global one is enabled; otherwise let the local one work
          (BlockingView.getModuleConfigs().globalOnly || globalBlockingView.counter)) {
        return globalBlockingView;
      }
    },

    /**
     *
     * @private
     */
    _resetGlobalBlockingView: function () {
      if (globalBlockingView === this) {
        globalBlockingView = undefined;
        this.$el.removeClass('csui-global');
      }
    },

    /**
     *
     * @private
     */
    _clearTimeouts: function () {
      if (this.enableTimeout) {
        clearTimeout(this.enableTimeout);
      }
      if (this.disableTimeout) {
        clearTimeout(this.disableTimeout);
      }
    },

    /**
     *
     * @private
     */
    _show: function () {
      this.$el.addClass(!!this.parentView.darkBackground ? 'smart-loading-state-dark-theme' : '');
      this.$el.removeClass('binf-hidden');
    },

    /**
     *
     * @private
     */
    _hide: function () {
      this.$el.addClass('binf-hidden');
    }
  });

  /**
   *
   * Adds blocking view functionalities to parent view.
   * blockActions - shows loading wheel in parent view.
   * blockWithoutIndicator - blocks actions in parent view without loading wheel.
   * unblockActions - removes loading wheel in parent view.
   * showBlockingView - appends blocking view to parent view while rendering.
   * destroyBlockingView -removes blocking view from parent view while destroying.
   */
  var ParentWithBlockingView = {
    blockActions: function () {
      logParentBlockActions.call(this, true);
      showImage(this.blockingView.$el, this.blockingView.showloadingWheel);
      this.blockingView.enable();
      ++this._blockingCounter;
      return this;
    },

    blockWithoutIndicator: function () {
      logParentBlockActions.call(this, false);
      hideImage(this.blockingView.$el);
      this.blockingView.enable();
      ++this._blockingCounter;
      return this;
    },

    unblockActions: function () {
      if (this === this.blockingView.parentView) {
        log.debug('Blocking view asked for disabling for {0} ({1}), counter: {2}.',
            log.getObjectName(this), this.cid, this.blockingView.counter)
        && console.log(log.last);
      } else {
        log.debug(
            'Blocking view asked for disabling for {0} ({1}) by {2} ({3}), counter: {4}.',
            log.getObjectName(this), this.cid,
            log.getObjectName(this.blockingView.parentView),
            this.blockingView.parentView.cid, this.blockingView.counter)
        && console.log(log.last);
      }
      this.blockingView.disable();
      if (this._blockingCounter) {
        --this._blockingCounter;
      }
      return this;
    },

    showBlockingView: function () {
      log.debug('Blocking view is showing for {0} ({1}).',
          log.getObjectName(this), this.cid) && console.log(log.last);
      this.blockingView.render();
      this.blockingView.parentView.$el.append(this.blockingView.el);
    },

    destroyBlockingView: function () {
      log.debug('Blocking view is destroying for {0} ({1}).',
          log.getObjectName(this), this.cid) && console.log(log.last);
      if (this._blockingCounter) {
        log.debug('Blocking view needs cleanup for {0} ({1}), counter: {2}.',
            log.getObjectName(this), this.cid, this._blockingCounter)
        && console.log(log.last);
      }
      while (this._blockingCounter) {
        this.unblockActions();
      }
      this.blockingView.destroy();
    }
  };

  /**
   *
   * @param view
   */
  function suppressBlockingView(view) {
    log.debug('Blocking view is suppressing {0} ({1}).',
        log.getObjectName(view.parentView), view.parentView.cid)
    && console.log(log.last);
    hideImage(view.$el, view.showloadingWheel);
    suppressedViews.push(view);
  }

  /**
   *
   * @param view
   */
  function releaseBlockingViews(view) {
    if (view === globalBlockingView) {
      suppressedViews.forEach(function (view) {
        log.debug('Blocking view is releasing {0} ({1}).',
            log.getObjectName(view.parentView), view.parentView.cid)
        && console.log(log.last);
        showImage(view.$el, view.showloadingWheel);
      });
      suppressedViews = [];
    }
  }

  /**
   *
   * @param element
   * @param showloadingWheel
   */
  function showImage(element, showloadingWheel) {
    if (element.closest(".initialLoading").length !== 0 && !showloadingWheel) {
      element.find('.csui-common-loading-parent-wrapper').removeClass('binf-hidden');
      element.find('.outer-border').addClass('binf-hidden');
    } else {
      element.find('.outer-border').removeClass('binf-hidden');
      element.find('.csui-common-loading-parent-wrapper').addClass('binf-hidden');
    }
  }

  /**
   *
   * @param element
   */
  function hideImage(element) {
    element.find('.csui-common-loading-parent-wrapper').addClass('binf-hidden');
    element.find('.outer-border').addClass('binf-hidden');
  }

  /**
   *
   * @param indicator
   */
  function logParentBlockActions(indicator) {
    indicator = indicator ? 'with' : 'without';
    if (this === this.blockingView.parentView) {
      log.debug(
          'Blocking view asked for enabling {0} indicator for {1} ({2}), counter: {3}.',
          indicator, log.getObjectName(this), this.cid, this.blockingView.counter)
      && console.log(log.last);
    } else {
      log.debug(
          'Blocking view asked for enabling for {0} indicator for {0} ({1}) by {2} ({3}), counter: {4}.',
          indicator, log.getObjectName(this), this.cid,
          log.getObjectName(this.blockingView.parentView),
          this.blockingView.parentView.cid, this.blockingView.counter)
      && console.log(log.last);
    }
  }

  /**
   *
   * imbuing blocking view functionality in parent view and listens to show, destroy events
   * @param parent
   * @param parentView
   */
  BlockingView.imbue = function (parent, parentView) {
    var options;
    if (Object.getPrototypeOf(parent) === Object.prototype) {
      options = parent;
      parent = options.parent;
      parentView = options.parentView;
    } else {
      options = {};
    }
    parentView || (parentView = parent);
    var blockingView = new BlockingView({
      parentView: parentView,
      local: options.local
    });
    parent.blockingView = blockingView;
    parent.blockingPrototype = ParentWithBlockingView;
    _.extend(parent, ParentWithBlockingView);
    parent._blockingCounter = 0;
    parent.listenTo(parentView, 'render', parent.showBlockingView)
        .listenTo(parentView, 'before:destroy', parent.destroyBlockingView);
    var perspective = parentView.context ? parentView.context.perspective :
                      parentView.options && parentView.options.context ?
                      parentView.options.context.perspective : undefined;
    var widgets = perspective && perspective.get('options') &&
                  !_.isEmpty(perspective.get('options').widgets);
    var lcr = perspective && perspective.get('options') &&
              !_.isEmpty(perspective.get('options').center) &&
              _.isEmpty(perspective.get('options').left) &&
              _.isEmpty(perspective.get('options').right);
    var grid = perspective && perspective.get('options') && perspective.get('options').rows;
    var check = !_.isEmpty(grid) && Object.keys(grid).length === 1 &&
                Object.keys(grid[0].columns).length === 1;
    if (!perspective || (!widgets && lcr) || check) {
      blockingView.showloadingWheel = true;
    }

  };

  /**
   *
   * Blocking view delegates the blocking to child
   *
   */
  var ChildWithBlockingView = {

    blockActions: function () {
      logChildBlockActions.call(this);
      this.childWithBlockingView.blockActions();
      return this;
    },

    blockWithoutIndicator: function () {
      logChildBlockActions.call(this);
      this.childWithBlockingView.blockWithoutIndicator();
      return this;
    },

    unblockActions: function () {
      log.debug('Blocking view delegates disabling for {0} ({1}) to {2} ({3}).',
          log.getObjectName(this), this.cid,
          log.getObjectName(this.childWithBlockingView),
          this.childWithBlockingView.cid) && console.log(log.last);
      this.childWithBlockingView.unblockActions();
      return this;
    }
  };

  function logChildBlockActions() {
    log.debug('Blocking view delegates enabling for {0} ({1}) to {2} ({3}).',
        log.getObjectName(this), this.cid, log.getObjectName(this.childWithBlockingView),
        this.childWithBlockingView.cid) && console.log(log.last);
  }

  /**
   *
   * @param suppress
   */
  function toggleSuppression(suppress) {
    // TODO: Find a way how to mark the outermost element for the local widgets.
    var method = suppress ? 'addClass' : 'removeClass';
    $('.binf-widgets .load-container')[method]('csui-no-blocking');
  }

  BlockingView.suppressAll = function () {
    toggleSuppression(true);
  };

  BlockingView.resumeAll = function () {
    toggleSuppression(false);
  };

  BlockingView.getModuleConfigs = function () {
    return config;
  };

  /**
   * if any existing/old leading application has it, still they can set and override the default
   * config options by using this method.
   *
   * @param customConfig
   * @returns {*}
   */
  BlockingView.setModuleConfigs = function (customConfig) {
    return _.extend(config, customConfig);
  };

  BlockingView.delegate = function (parent, child) {
    if (Object.getPrototypeOf(parent) === Object.prototype) {
      var options = parent;
      parent = options.parent;
      child = options.child;
    }
    parent.childWithBlockingView = child;
    parent.childWithBlockingViewPrototype = ChildWithBlockingView;
    _.extend(parent, ChildWithBlockingView);
  };

  return BlockingView;
});

/* START_TEMPLATE */
csui.define('hbs!smart/controls/side.panel/impl/footer',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"cs-footer-left\"></div>\n<div class=\"cs-footer-right\"></div>\n";
}});
Handlebars.registerPartial('smart_controls_side.panel_impl_footer', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!smart/controls/side.panel/impl/button',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"size":((stack1 = (depth0 != null ? lookupProperty(depth0,"v2Icon") : depth0)) != null ? lookupProperty(stack1,"size") : stack1),"states":((stack1 = (depth0 != null ? lookupProperty(depth0,"v2Icon") : depth0)) != null ? lookupProperty(stack1,"states") : stack1),"iconName":((stack1 = (depth0 != null ? lookupProperty(depth0,"v2Icon") : depth0)) != null ? lookupProperty(stack1,"iconName") : stack1)},"loc":{"start":{"line":2,"column":2},"end":{"line":2,"column":79}}})) != null ? stack1 : "")
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"v2Icon") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":3,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('smart_controls_side.panel_impl_button', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/controls/side.panel/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('smart/controls/side.panel/impl/nls/root/lang',{
    btnBack: 'Back',
    btnNext: 'Next',
    btnCancel: 'Cancel',
    closeBtnTooltip: 'Close',
    closeBtnAria: 'Close {0}',
    moreButtonsAria: 'More footer buttons'
});



csui.define('css!smart/controls/side.panel/impl/side.panel',[],function(){});
csui.define('smart/controls/side.panel/impl/footer.view',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/lib/marionette',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/controls/side.panel/impl/footer',
  'hbs!smart/controls/side.panel/impl/button',
  'smart/mixins/generic.utilities/footerview.responsiveness.mixin',
  'i18n!smart/controls/side.panel/impl/nls/lang',
  'css!smart/controls/side.panel/impl/side.panel'
], function (_, $, Backbone, Marionette, TabableRegion, template, btnTemplate, FooterViewResponsiveMixin, lang) {

  var ButtonView = Marionette.ItemView.extend({
    tagName: 'button',
    className: 'cs-footer-btn',
    template: btnTemplate,
    triggers: {
      'click': 'click'
    },
    attributes: function () {
      var attributes = this.model.get('attributes') || {};
      return attributes;
    },
    constructor: function ButtonView(options) {
      options || (options = {});
      var model  = options.model || new Backbone.Model(),
          v2Icon = model && model.get('v2Icon');
      if (v2Icon) {
        v2Icon = _.defaults(v2Icon, {
          iconName: '',
          states: false,
          size: 'normal'
        });
        options.model.set('v2Icon', v2Icon, {silent: true});
      }
      Marionette.ItemView.apply(this, arguments);
      this.listenTo(this.model, "change", this.render);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
   // set `tabindex` as -1 in the below two scenarios to avoid setting focus on these situations.
    isTabable: function () {
     return this.$el.is(':not(:disabled)') && this.$el.is(':not(:hidden)');
    },

    currentlyFocusedElement: function (event) {
      var resizerElement= this._parent.setResizer(event);
     if (this.$el.prop('tabindex') === -1) {
       this.$el.prop('tabindex', 0);
     }
     return  resizerElement || this.$el;
    },

    onLastTabElement: function (shiftTab, event) {
     var last = this.$el.parents('.cs-footer-control').find('.cs-footer-btn').last();
     return last.is(this.$el) && !shiftTab && last.is($(event.target));
    },

    onRender: function () {
      var button     = this.$el,
          attributes = this.model.attributes,
          className  = attributes.className;
      button.text(attributes.label);
      button.addClass(className || 'binf-btn binf-btn-default');
      if (attributes.toolTip) {
        button.attr('title', attributes.toolTip);
      }
      if (attributes.separate) {
        button.addClass('cs-separate');
      }
      if (attributes.id) {
        button.attr('id', attributes.id);
      }
      this.updateButton(attributes);
    },

    updateButton: function (attributes) {
      var $button = this.$el;
      attributes || (attributes = {});
      if (attributes.hidden !== undefined) {
        if (attributes.hidden) {
          $button.addClass('binf-hidden');
        } else {
          $button.removeClass('binf-hidden');
        }
      }
      if (attributes.disabled !== undefined) {
        $button.prop('disabled', attributes.disabled);
        attributes.disabled ? $button.addClass('binf-disabled') :
        $button.removeClass('binf-disabled');
      }
    }
  }, {
    BTN_TYPE_BACK: 'back',
    BTN_TYPE_NEXT: 'next',
    BTN_TYPE_CANCEL: 'cancel',
    BTN_TYPE_ACTION: 'action'
  });

  var ButtonsGroup = Marionette.CollectionView.extend({
    childView: ButtonView,
    className: 'cs-sidepanel-btngroup',
    constructor: function ButtonsGroup(options) {
      options || (options = {});
      Marionette.CollectionView.apply(this, arguments);
      this.listenTo(this, "button:click", this.delegateEvent);
    },

    onDomRefresh: function () {
      this.children.each(function (buttonView) {
        buttonView.trigger('dom:refresh');
      });
    },

    delegateEvent: function (ele) {
      this.options.footerView.trigger("button:click button:click:" + ele.type, ele);
    },

    setResizer: function (e) {
      return this.options.footerView.checkResizer(e);
    }
  });

  
  var SidePanelFooterView = Marionette.LayoutView.extend({

    template: template,

    className: 'cs-footer-control',

    regions: {
      leftContainer: '.cs-footer-left',
      rightContainer: '.cs-footer-right'
    },

    templateHelpers: function () {
      return {};
    },

    constructor: function SidePanelFooterView(options) {
      options || (options = {});
      Marionette.LayoutView.apply(this, arguments);
      this.leftCollection = new Backbone.Collection();
      this.rightCollection = new Backbone.Collection();
      this.listenTo(this, "update:footer", this.updateFooter);
    },

    checkResizer: function (e) {
      var parent = this._parent._parent;
      var tabResizer = e.shiftKey && parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement) && parent._parent.flag;
      var shiftTabResizer = !e.shiftKey && !parent._parent.options.layout.header && parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement) && parent._parent.flag;
      if (tabResizer || shiftTabResizer) {
        return parent._parent.ui.resizer;
      }
      return 0;
    },

    onRender: function () {
      var options = {
        sidePanelView: this.options.parentView,
        footerView: this
      };
      this.leftGroup = new ButtonsGroup(_.extend(options, {
        collection: this.leftCollection
      }));
      this.rightGroup = new ButtonsGroup(_.extend(options, {
        collection: this.rightCollection
      }));
      this.rightGroup.completeCollection = new Backbone.Collection();
      this.rightGroup.completeCollection.add(this.rightCollection.toJSON(), { silent: true });
      this.leftContainer.show(this.leftGroup);
      this.rightContainer.show(this.rightGroup);
      this.listenTo(this.rightGroup.completeCollection, "reset", _.bind(function () {
        this.rightGroup.flag= true;
      }, this));
      this.listenTo(this.rightGroup.completeCollection, "change update", _.bind(function () {
        this.rightGroup.flag = true;
        this.expand();
        this.options.parentView.trigger("update:footerview");
      }, this));
      this.listenTo(this.leftGroup, "childview:click", this._onButtonClick);
      this.listenTo(this.rightGroup, "childview:click", this._onButtonClick);
    },

    _onButtonClick: function (btnView) {
      var btn = btnView.model;
      btn && this.trigger("button:click button:click:" + btn.get("type"), btn.attributes);
    },

    update: function (options) {

      var footerOptions = options.slide.footer ||
                          _.pick(options.slide, 'buttons', 'leftButtons', 'rightButtons'),
          leftButtons   = footerOptions.leftButtons || [],
          rightButtons  = footerOptions.rightButtons || [];

      if (footerOptions.hide) {
        this.$el.addClass('binf-hidden');
      } else {
        this.$el.removeClass('binf-hidden');
      }

      if (_.isArray(footerOptions.buttons)) {
        rightButtons = Array.prototype.concat(rightButtons, footerOptions.buttons);
      }

      if (options.slideIndex > 0) {
        this._addButtonIfNotFound(leftButtons, 0, {
          type: ButtonView.BTN_TYPE_BACK,
          toolTip: lang.btnBack,
          className: "cs-go-back arrow_back csui-has-v2icon",
          v2Icon: {
            iconName: 'csui_action_arrow_back',
            states: true,
            handleRTL: true,
            size: 'xsmall'
          },      
        });
      }
      if (options.slideIndex + 1 < options.totalSlides) {
        this._addButtonIfNotFound(rightButtons, rightButtons.length, {
          type: ButtonView.BTN_TYPE_NEXT,
          label: lang.btnNext,
          className: 'binf-btn binf-btn-primary'
        });
      }
      this._addButtonIfNotFound(rightButtons, rightButtons.length, {
        type: ButtonView.BTN_TYPE_CANCEL,
        id: 'csui-side-panel-cancel',
        label: this.options.footerButtonLabel ? this.options.footerButtonLabel : lang.btnCancel
      });

      this.leftCollection.reset(leftButtons);
      this.rightCollection.reset(rightButtons);
      this.rightGroup.completeCollection.reset(this.rightCollection.models);
      this.options.parentView.trigger("update:footerview");
    },

    _addButtonIfNotFound: function (buttons, index, options) {
      var found = _.find(buttons, function (btn) {
        return btn.type === options.type;
      });
      if (!found) {
        buttons.splice(index, 0, options);
      }
    },

    updateButton: function (id, attributes) {
      var button = this.leftCollection.get(id) || this.rightCollection.get(id);
      var activeElement = $(document.activeElement);
      if (button) {
        button.set(attributes);
        // if update button triggering on keyup event causing re-rendering and loosing focus
        activeElement.attr('type') === 'text' && !!activeElement.val() &&
        activeElement.trigger('focus');
      }
    },

    onDomRefresh: function () {
      this.leftGroup.triggerMethod('dom:refresh');
      this.rightGroup.triggerMethod('dom:refresh');
      this.options.parentView.trigger("update:footerview");
    },

    updateFooter: function () {
      var availableWidth = (this.$el.width() - this.leftGroup.$el.width()) - 40;
      if (this.$el.is(":visible") ){
      this.updateFooterView(this.rightGroup, availableWidth);
      }
    }
    
  });

  _.extend(SidePanelFooterView.prototype, FooterViewResponsiveMixin);

  return SidePanelFooterView;
});


/* START_TEMPLATE */
csui.define('hbs!smart/controls/side.panel/impl/header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-sidepanel-title csui-normal-scrolling\">\n    <h1 class=\"csui-sidepanel-heading\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":2,"column":51},"end":{"line":2,"column":60}}}) : helper)))
    + "\" role=\"alert\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":2,"column":75},"end":{"line":2,"column":84}}}) : helper)))
    + "</h1>\n    <h2 class=\"csui-sidepanel-subheading\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"subTitle") || (depth0 != null ? lookupProperty(depth0,"subTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"subTitle","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":54}}}) : helper)))
    + "</h2>\n</div>\n<div class=\"csui-sidepanel-close smart-v2-icon-parent\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeTooltip") || (depth0 != null ? lookupProperty(depth0,"closeTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeTooltip","hash":{},"loc":{"start":{"line":5,"column":62},"end":{"line":5,"column":78}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeAria") || (depth0 != null ? lookupProperty(depth0,"closeAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeAria","hash":{},"loc":{"start":{"line":5,"column":92},"end":{"line":5,"column":105}}}) : helper)))
    + "\" tabindex=\"-1\" role=\"button\">\n    "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","iconName":"csui_action_close32"},"loc":{"start":{"line":6,"column":4},"end":{"line":6,"column":63}}})) != null ? stack1 : "")
    + "\n</div>";
}});
Handlebars.registerPartial('smart_controls_side.panel_impl_header', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/controls/side.panel/impl/header.view',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/marionette',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/controls/side.panel/impl/header',
  'i18n!smart/controls/side.panel/impl/nls/lang',
  'css!smart/controls/side.panel/impl/side.panel'
], function (_, $, Marionette, TabableRegion, template, lang) {

  var SidePanelHeaderView = Marionette.ItemView.extend({

    template: template,

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    isTabable: function () {
     return this.$('*[tabindex]').length > 0;
    },
    
    currentlyFocusedElement: function (event) {
      var parent = this._parent._parent;
      if (parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement)) {
        return parent._parent.ui.resizer;
      }
     return this.$('*[tabindex]')[0];
    },
    
    onLastTabElement: function (shiftTab, event) {
     // return true if focus is on last tabable element else false.
     return (shiftTab && event.target === this.$('*[tabindex]')[0]);
    },

    className: 'cs-header-control',

    ui: {
      title: '.csui-sidepanel-title .csui-sidepanel-heading',
      subTitle: '.csui-sidepanel-title .csui-sidepanel-subheading',
      closeBtn: '.csui-sidepanel-close'
    },

    events: {
      'keydown': 'onKeyInView'
    },

    triggers: {
      "click @ui.closeBtn": "close:click"
    },

    onKeyInView: function (event) {
      var keyCode = event.keyCode;

      //Enter/space
      if (keyCode === 13 || keyCode === 32) {
        $(event.target).trigger('click');
      }
    },

    templateHelpers: function () {
      return {
        closeTooltip: lang.closeBtnTooltip,
        closeAria: lang.closeBtnTooltip // the actual title is not yet known at this point
      };
    },

    constructor: function SidePanelHeaderView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'update:header', this.update);
    },

    update: function (slide) {
      this.ui.title.text(slide.title);
      this.ui.title.attr({'title': slide.title});
      this.ui.closeBtn.attr('aria-label', _.str.sformat(lang.closeBtnAria, slide.title));
      if (!!slide.subTitle) {
        this.ui.title.removeClass('csui-no-subheading');
        this.ui.subTitle.removeClass('binf-hidden');
        this.ui.subTitle.text(slide.subTitle);
        this.ui.subTitle.attr({'title': slide.subTitle});
      } else {
        this.ui.subTitle.addClass('binf-hidden');
        this.ui.title.addClass('csui-no-subheading');
      }
    }

  });

  return SidePanelHeaderView;
});

/* START_TEMPLATE */
csui.define('hbs!smart/controls/side.panel/impl/side.panel',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"csui-sidepanel-backdrop\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <div class=\"csui-side-panel-resizer csui-resize-cursor-icon\"  aria-label=\"resizer\" role=\"seperator\" aria-valuemin=\"432px\" aria-valuemax=\"100%\" tabindex=\"0\" role=\"button\">\n    </div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"csui-sidepanel-header\"></div>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return " csui-sidepanel-no-header ";
},"9":function(container,depth0,helpers,partials,data) {
    return " csui-sidepanel-no-footer ";
},"11":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"csui-sidepanel-footer\"></div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"backdrop") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":3,"column":7}}})) != null ? stack1 : "")
    + "<div class=\"csui-sidepanel-container\" aria-modal=\"true\" tabindex=\"0\" role=\"dialog\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":4,"column":95},"end":{"line":4,"column":104}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"enableResize") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":5,"column":2},"end":{"line":8,"column":9}}})) != null ? stack1 : "")
    + "  <div class=\"csui-side-panel-main\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasHeader") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":10,"column":4},"end":{"line":12,"column":11}}})) != null ? stack1 : "")
    + "\n    <div class=\"csui-sidepanel-body csui-normal-scrolling "
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasHeader") : depth0),{"name":"unless","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"loc":{"start":{"line":14,"column":58},"end":{"line":14,"column":116}}})) != null ? stack1 : "")
    + "\n      "
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasFooter") : depth0),{"name":"unless","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":15,"column":6},"end":{"line":15,"column":64}}})) != null ? stack1 : "")
    + "\"></div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasFooter") : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"loc":{"start":{"line":17,"column":4},"end":{"line":19,"column":11}}})) != null ? stack1 : "")
    + "\n  </div>\n</div>\n";
}});
Handlebars.registerPartial('smart_controls_side.panel_impl_side.panel', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/controls/side.panel/side.panel.view',['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/backbone', 'nuc/lib/marionette',
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'smart/behaviors/keyboard.navigation/smart.tabables.behavior',
  'smart/controls/side.panel/impl/footer.view',
  'smart/controls/side.panel/impl/header.view',
  'hbs!smart/controls/side.panel/impl/side.panel',
  'smart/utils/non-emptying.region/non-emptying.region',
  'nuc/utils/log',
  'nuc/utils/base',
  'smart/utils/smart.base',
  'i18n',
  'css!smart/controls/side.panel/impl/side.panel',
  'smart/lib/binf/js/binf'
], function (module, _, $, Backbone, Marionette, LayoutViewEventsPropagationMixin,
  TabablesBehavior, FooterView, HeaderView, template, NonEmptyingRegion, log, base, smartbase, i18n) {
  log = log(module.id);

  var config = module.config(),
    LAYOUT_DEFAULTS = {
      header: true,
      footer: true,
      mask: true,
      resize: false,
      size: "small"
    },

    SIZECLASSES = {
      small: 'csui-sidepanel-small',
      medium: 'csui-sidepanel-medium',
      large: 'csui-sidepanel-large',
      custom: 'csui-sidepanel-custom'
    },

    DEFAULTS = _.defaults(config, {
      backdrop: 'static',
      keyboard: true,
      focus: true,
      openFrom: 'right',
      layout: _.defaults(config.layout || {}, LAYOUT_DEFAULTS)
    });

  var SidePanelView = Marionette.LayoutView.extend({

    className: function () {
      var classNames = ['csui-sidepanel'];
      if (!!this.options.sidePanelClassName) {
        classNames.push(this.options.sidePanelClassName);
      }
      if (SidePanelView.SUPPORTED_SLIDE_ANIMATIONS.indexOf(this.options.openFrom) !== -1) {
        classNames.push('csui-sidepanel--from-' + this.options.openFrom);
      }
      if (!this.options.layout.mask) {
        classNames.push('csui-sidepanel-with-no-mask');
      }
      if (this.options.layout.resize) {
        classNames.push('csui-sidepanel-with-resize');
      }
      classNames.push(SIZECLASSES[this.options.layout.size]);      
      return _.unique(classNames).join(' ');
    },

    attributes: {
      tabindex: -1
    },

    template: template,

    templateHelpers: function () {
      return {
        backdrop: this.options.backdrop,
        hasHeader: this.options.layout.header,
        hasFooter: this.options.layout.footer,
        enableResize: this.options.layout.resize,
        title: this.options.title
      };
    },
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    ui: {
      body: '.csui-sidepanel-body',
      header: '.csui-sidepanel-header',
      backdrop: '.csui-sidepanel-backdrop',
      container: '.csui-sidepanel-container',
      resizer: '.csui-side-panel-resizer'
    },

    events: {
      'click @ui.backdrop': 'onBackdropClick',
      'keyup': 'onKeyInView',
      'keydown': 'handleKeyDown'
    },

    regions: function () {
      return {
        header: '@ui.header',
        body: '@ui.body',
        footer: '.csui-sidepanel-footer'
      };
    },

    constructor: function SidePanelView(options) {
      var layoutDefaults = _.defaults(options.layout || {}, LAYOUT_DEFAULTS);
      options = _.defaults(options, DEFAULTS);
      options.layout = layoutDefaults;
      options.backdrop = options.layout.mask && options.backdrop;
      var slides = this.extractSlides(options);
      if (!slides || !_.isArray(slides) || !slides.length) {
        throw new Marionette.Error({
          name: 'NoSildesError',
          message: '"slides" must be specified'
        });
      }
      this.slides = slides;

      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      $(window).on('resize', {view: this}, this.onDomRefresh);
      this.$el.on('resize', this.onDomRefresh);
      this.propagateEventsToRegions();
    },

    extractSlides: function (options) {
      if (_.isArray(options.slides) && options.slides.length) {
        return options.slides;
      }
      var slideInfo = _.pick(options, 'title', 'subTitle', 'headerView', 'content', 'footer',
          'buttons', 'leftButtons', 'rightButtons');
      if (_.isEmpty(slideInfo)) {
        return undefined;
      }
      return [slideInfo];
    },

    getWidth: function(el){
      return el && el.width();
    },

    onDomRefresh: function (event) {
      var self = event && event.data && event.data.view;
      self = self || this;
      self.updateFooter();
    },

    updateFooter: function () {
      var self= this;
      var callbackUpdateFooter = function () {
        self && self.options.layout.footer && self.footerView.trigger('update:footer');
      };
      callbackUpdateFooter();
      self && self.options.layout.resize && self.$el.find(".csui-sidepanel-container").on(self._transitionEnd(), callbackUpdateFooter);
    },

    _transitionEnd: _.once(
      function () {
        var transitions = {
          transition: 'transitionend',
          WebkitTransition: 'webkitTransitionEnd',
          MozTransition: 'transitionend',
          OTransition: 'oTransitionEnd otransitionend'
        },
          element = document.createElement('div'),
          transition;
        for (transition in transitions) {
          if (typeof element.style[transition] !== 'undefined') {
            return transitions[transition];
          }
        }
      }),

    setWidth: function (el, flag) {
      setTimeout(_.bind(function () {
        flag = this.options.openFrom === 'left' || smartbase.isRTL() ? !flag : flag;
        var width = this.getWidth(el);
        var widthInPercentage = (width * 100) / (document.body.clientWidth > this.$el.width() ? document.body.clientWidth : this.$el.width());
        var newWidth = flag ? widthInPercentage + 15 : widthInPercentage - 15;
        newWidth = newWidth > 100 ? 100 : newWidth;
        el.width(newWidth + "%");
        el.find(".csui-side-panel-resizer").attr("aria-valuenow",newWidth + "%");
        this.updateFooter();
        return;
      }, this), 300);
    },

    handleKeyDown: function (event){ 
      this.trigger('keydown', event);
      if (event.keyCode === 9) {
        var footerlast = this.options.layout.footer && this.footerView.$el.find('.cs-footer-btn, a.binf-dropdown-toggle').last();
        var headerFirst = this.options.layout.header && this.headerView.$el.find('*[tabindex]').last();
        var tabResizer = !event.shiftKey && (event.target === this.ui.container[0] || (footerlast && footerlast.is(event.target)));
        var shiftTabResizer = event.shiftKey && (headerFirst && headerFirst.is(event.target));

        if (event.target === this.ui.resizer[0] && event.shiftKey) {
          this.options.layout.footer && footerlast.trigger("focus");
          event.preventDefault();
          event.stopPropagation();
        }

        else if (tabResizer || shiftTabResizer || event.target === this.ui.container[0]) {
          if (this.options.layout.resize) {
            this.ui.resizer.trigger("focus");
            this.flag = true;
            event.preventDefault();
            event.stopPropagation();
          }

        } else {
          this.flag = false;
        }
      }
      var isESC = this.options.layout.footer ? !this.footerView.isESC : true;
      if (this.options.keyboard && event.keyCode === 27 && !event.isDefaultPrevented() &&  isESC) {
        this.hide();
      }

      if (this.ui.resizer.length && event && $(event.target)[0] === this.ui.resizer[0]) {
        if (event.keyCode === 37) {
          this.setWidth(this.$el.find('.csui-sidepanel-container'), true);
        }
        if (event.keyCode === 39) {
          this.setWidth(this.$el.find('.csui-sidepanel-container'), false);
        }
      }
    },

    onKeyInView: function (event) {
      // Don't close if the default is prevented by subview.
      // Subviews such as popover or open menu would just close itself but not close panel.
      var isESC = this.options.layout.footer ? !this.footerView.isESC : true;
      if (this.options.keyboard && event.keyCode === 27 && !event.isDefaultPrevented() &&  isESC) {
        this.hide();
      }
    },

    onBackdropClick: function () {
      if (this.options.backdrop === 'static') {
        this.$el.trigger('focus');
      } else {
        this.hide();
      }
    },

    updateButton: function (id, options) {
      if (this.options.layout.footer) {
        if (!this.footerView.updateButton) {
          throw new Error('Dialog footer does not support button updating.');
        }
        this.footerView.updateButton(id, options);
      }
    },

    show: function (callback) {
      this.trigger("before:show");
      // Check AndCreatePanel
      if (!Marionette.isNodeAttached(this.el)) {
        var container = $.fn.binf_modal.getDefaultContainer(),
            region    = new NonEmptyingRegion({
              el: container
            });
        region.show(this);
        // Show sidepanel in next evenloop, to be attached DOM, for the transition to be applied.
        setTimeout(_.bind(this._doShow, this, callback));
      } else {
        this._doShow(callback);
      }
      return this;
    },

    _doShow: function (callback) {
      this.$el.addClass("csui-sidepanel-visible");
      $('body').addClass('csui-sidepanel-open');
      this.options.focus && this.ui.container[0].focus();
      this.trigger("after:show");
      _.isFunction(callback) && callback.call(this);
    },

    close: function () {
      log.warn('DEPRECATED: .close() has been deprecated. Use .hide() instead.')
      && console.warn(log.last);
      this.hide();
    },

    hide: function (callback) {
      this.trigger("before:hide");
      this.doDestroy(function () {
        this.trigger("after:hide");
        _.isFunction(callback) && callback.call(this);
      });
    },

    destroy: function () {
      this.hide();
    },

    doDestroy: function (callback) {
      base.onTransitionEnd(this.$el, function () {
        Marionette.LayoutView.prototype.destroy.call(this);
        _.isFunction(callback) && callback.call(this);
      }, this);
      this.$el.removeClass("csui-sidepanel-visible");
    },

    onDestroy: function () {
      this._doCleanup();
    },

    _doCleanup: function () {
      $('body').removeClass('csui-sidepanel-open');
    },

    onRender: function () {

      if (this.options.layout.header) {
        this.headerView = new HeaderView(this.options);
        this.header.show(this.headerView);
      }

      this.contentHolders = [];

      if (this.options.layout.footer) {
        this.options.parentView = this;
        this.footerView = new FooterView(this.options);
        this.footer.show(this.footerView);
        this.listenTo(this, "update:footerview", this.updateFooter);
        this.listenTo(this, "after:show", this.updateFooter);
      }

      this._registerEventHandlers();
      this._showSlide(0, this.onSetFocus);

      if (this.options.layout.resize) {
        csui.require(['smart/controls/side.panel/impl/side.panel.util'], _.bind(function (SidePanelUtil) {
          var panelResizeOptions = {
            handleSelector: ".csui-side-panel-resizer",
            resizeHeight: false
          };
          if (!!this.options.contentView) {
            panelResizeOptions.view = this.options.contentView;
          }
          if (!!this.options.thresholdWidth) {
            panelResizeOptions.thresholdWidth = this.options.thresholdWidth;
          }
          if(this.options.layout.footer){
            panelResizeOptions.sidePanelView = this;
          }
          this.$el.find('.csui-sidepanel-container').panelResizable(panelResizeOptions);
        }, this));
      }
    },

    _registerEventHandlers: function () {
      if (this.options.layout.footer) {
        this.listenTo(this.footerView, "button:click:back", this._onBackClick)
            .listenTo(this.footerView, "button:click:next", this._onNextClick)
            .listenTo(this.footerView, "button:click:cancel", this._onCancelClick)
            .listenTo(this.footerView, "button:click", this._onBtnClick)
            .stopListening(this.footerView, "update:header")
            .listenTo(this.footerView, "update:header", _.bind(function (headerModel) {
              // update header title from footer
              this.headerView.trigger('update:header', headerModel);
              this._updateTitle(headerModel);
            }, this));
      }
      this.listenTo(this, "click:next", this._onNextClick);
      this.listenTo(this, "click:previous", this._onBackClick);

      this.listenTo(this, "refresh:buttons", this.refreshButtons);
      this.listenTo(this, "update:button", this.updateButton);
      if (this.options.layout.header) {
        this.listenTo(this.headerView, "close:click", _.bind(function(){
          this.trigger('close:button:clicked');
          this.hide();
        }, this));
      }
    },

    _updateTitle: function (options) {
      var slide = this.slides[this.currentSlideIndex];
      if (!!slide) {
        slide.title = options.title;
        slide.subTitle = options.subTitle;
      }
    },

    _onBackClick: function () {
      this._showSlide(this.currentSlideIndex - 1);
    },

    _onNextClick: function () {
      this._showSlide(this.currentSlideIndex + 1);
    },

    _onCancelClick: function () {
      this.hide();
    },

    _onBtnClick: function (btn) {
      if (_.isFunction(btn.click)) {
        var clickEvent = $.Event('click');
        btn.click(clickEvent, this.currentSlide);
        if (clickEvent.isDefaultPrevented()) {
          return;
        }
      }
      Marionette.triggerMethodOn(this.currentSlide.content, "button:click", btn);
      if (btn.close) {
        this.hide();
      }
    },

    /**
     * Slide: {
     * }
     *
     * @param {Integer} slideIndex
     */
    _showSlide: function (slideIndex, finishCallback) {
      this._cleanUpCurrentSlide();
      // TODO check index bounds
      var slide = this.slides[slideIndex];
      this.trigger("show:slide", slide, slideIndex);

      this._updateHeader(slide);
      this._updateBody(slide, slideIndex, finishCallback);
      if (this.options.layout.footer) {
        this.footerView.update({
          slide: slide,
          slideIndex: slideIndex,
          totalSlides: this.slides.length
        });
        if (slide.footer && slide.footer.hide) {
          this.$el.addClass('no-footer');
        } else {
          this.$el.removeClass('no-footer');
        }
      }

      this.currentSlide = slide;
      this.currentSlideIndex = slideIndex;
      this.trigger("shown:slide", slide, slideIndex);
      this.listenTo(slide.content, "update:button", this.updateButton);
      // update header title from sidepanel body
      this.stopListening(slide.content, "update:header")
          .listenTo(slide.content, "update:header", _.bind(function (headerModel) {
            this.headerView.trigger('update:header', headerModel);
            this._updateTitle(headerModel);
          }, this));
      this._completeSlideShow(slide);
    },

    _completeSlideShow: function (slide) {
      if (!!slide.containerClass) {
        this.ui.container.addClass(slide.containerClass);
      }
    },

    _cleanUpCurrentSlide: function () {
      if (!this.currentSlide) {
        return;
      }
      if (this.currentSlide.containerClass) {
        this.ui.container.removeClass(this.currentSlide.containerClass);
      }
    },

    _updateHeader: function (slide) {
      if (this.options.layout.header) {
        if (!_.isUndefined(this.currentSlideIndex) &&
            this.slides[this.currentSlideIndex] &&
            this.slides[this.currentSlideIndex].headerView) {
          // Hide current header
          this.slides[this.currentSlideIndex].headerView.$el.addClass('binf-hidden');
        }
        if (!!slide.headerView) {
          var headerRegion = new NonEmptyingRegion({
            el: this.ui.header
          });
          headerRegion.show(slide.headerView);
          slide.headerView.$el.removeClass('binf-hidden');
          this.headerView.$el.addClass('binf-hidden');
        } else {
          this.headerView.$el.removeClass('binf-hidden');
          this.headerView.trigger('update:header', slide);
        }
      }
    },

    onSetFocus: function () {
      this._focusonFirstFocusableElement();
    },

    _focusonFirstFocusableElement: function () {
      var focusableElements = base.findFocusables(this.ui.body);
      if (focusableElements.length) {
        focusableElements.first().trigger("focus");
      }
    },

    _updateBody: function (slide, index, finishCallback) {
      if (!slide.content) {
        throw new Marionette.Error({
          name: 'NoContentError',
          message: '"content" must be specified.'
        });
      }
      if (!_.isUndefined(this.currentSlideIndex)) {
        var currentContent = this.contentHolders[this.currentSlideIndex];
        currentContent.$el.removeClass('csui-slide-visible');
        currentContent.$el.addClass('csui-slide-hidden');
        this.stopListening(currentContent, 'dom:refresh');
      }

      if (index >= this.contentHolders.length) {
        // Slide showing for the first time
        this.contentHolders.push(slide.content);
        var bodyRegion = new NonEmptyingRegion({
          el: this.ui.body
        });
        this.listenToOnce(slide.content, 'show', function () {
          _.isFunction(finishCallback) && finishCallback.call(this);
        });
        bodyRegion.show(slide.content);
        this.listenToOnce(slide.content, 'dom:refresh', function () {
          this.triggerMethod('dom:refresh');
        });
      }
      var content = this.contentHolders[index];
      content.$el.removeClass('csui-slide-hidden');
      content.$el.addClass('csui-slide-visible');
    },

    onShow: function () {
      if (this.options.layout.footer && this.footerView && this.footerView.triggerMethod) {
        this.footerView.triggerMethod('dom:refresh');
        this.footerView.triggerMethod('after:show');
      }
    }

  }, {
    SUPPORTED_SLIDE_ANIMATIONS: ["left", "right"]
  });

  LayoutViewEventsPropagationMixin.mixin(SidePanelView.prototype);

  return SidePanelView;
});

csui.define('smart/controls/side.panel/impl/side.panel.util',['nuc/lib/jquery', 'smart/utils/smart.base'], function (jQuery, SmartBase) {
  (function ($, undefined) {
    if ($.fn.panelResizable) {
      return;
    }

    $.fn.panelResizable = function fnPanelResizable(options) {
      var opt                      = {
            // selector for handle that starts dragging
            handleSelector: null,
            // resize the width
            resizeWidth: true,
            // resize the height
            resizeHeight: true,
            // hook into start drag operation (event passed)
            onDragStart: null,
            // hook into stop drag operation (event passed)
            onDragEnd: null,
            // hook into each drag operation (event passed)
            onDrag: null,
            // disable touch-action on $handle
            // prevents browser level actions like forward back gestures
            touchActionNone: true,
            // if this value provides, then it expects view as well
            // to execute respective callback functions.
            thresholdWidth: null,
            // if required, based on circumstance it will trigger events to this view
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

        /**
         * Set width in percentage, so that on resize window it won't cause any issues.
         *
         * @param el
         * @param width
         */
        function setWidth(el, width) {
          var widthInPercentage = (width * 100) / document.body.clientWidth;
          el.width(widthInPercentage + "%");
          // Let 'csui-side-panel-resizer' this calss come in options from the callee file like sidepanel/header/footer instead of hard coding here
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

          // reset changed values
          $el.css("transition", startTransition);

          if (opt.onDragEnd) {
            opt.onDragEnd(e, $el, opt);
          }

          // Let 'csui-side-panel-resizer' this calss come in options from the callee file like sidepanel/header/footer instead of hard coding here
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

/* START_TEMPLATE */
csui.define('hbs!smart/dialogs/modal.alert/impl/modal.alert',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      class=\"binf-modal-dialog binf-modal-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogSize") || (depth0 != null ? lookupProperty(depth0,"dialogSize") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogSize","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":56}}}) : helper)))
    + "\"\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "      class=\"binf-modal-dialog\"\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      aria-labelledby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dlgTitleId") || (depth0 != null ? lookupProperty(depth0,"dlgTitleId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dlgTitleId","hash":{},"loc":{"start":{"line":9,"column":23},"end":{"line":9,"column":37}}}) : helper)))
    + "\"\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-modal-header "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"headerClass") || (depth0 != null ? lookupProperty(depth0,"headerClass") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"headerClass","hash":{},"loc":{"start":{"line":15,"column":36},"end":{"line":15,"column":51}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showTitleCloseButton") : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"loc":{"start":{"line":16,"column":8},"end":{"line":21,"column":15}}})) != null ? stack1 : "")
    + "        <h4 class=\"binf-modal-title\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showTitleIcon") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"loc":{"start":{"line":23,"column":10},"end":{"line":25,"column":17}}})) != null ? stack1 : "")
    + "          <span class=\"title-text\" id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dlgTitleId") || (depth0 != null ? lookupProperty(depth0,"dlgTitleId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dlgTitleId","hash":{},"loc":{"start":{"line":26,"column":39},"end":{"line":26,"column":53}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"title") || (depth0 != null ? lookupProperty(depth0,"title") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"title","hash":{},"loc":{"start":{"line":26,"column":55},"end":{"line":26,"column":64}}}) : helper)))
    + "</span>\n        </h4>\n      </div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <button type=\"button\" class=\"binf-close\" data-binf-dismiss=\"modal\"\n                  aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeButtonAria") || (depth0 != null ? lookupProperty(depth0,"closeButtonAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeButtonAria","hash":{},"loc":{"start":{"line":18,"column":30},"end":{"line":18,"column":49}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"closeButtonTooltip") || (depth0 != null ? lookupProperty(depth0,"closeButtonTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"closeButtonTooltip","hash":{},"loc":{"start":{"line":18,"column":58},"end":{"line":18,"column":80}}}) : helper)))
    + "\" tabindex=\"0\">\n            <span class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"titleCloseIcon") || (depth0 != null ? lookupProperty(depth0,"titleCloseIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"titleCloseIcon","hash":{},"loc":{"start":{"line":19,"column":30},"end":{"line":19,"column":48}}}) : helper)))
    + "\"></span>\n          </button>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <span class=\"icon "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"titleIcon") || (depth0 != null ? lookupProperty(depth0,"titleIcon") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"titleIcon","hash":{},"loc":{"start":{"line":24,"column":30},"end":{"line":24,"column":43}}}) : helper)))
    + "\"></span>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <button type=\"button\" class=\"binf-btn binf-btn-primary csui-yes csui-default\" tabindex=\"0\"\n              data-binf-dismiss=\"modal\" \n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"disableYes") : stack1),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"loc":{"start":{"line":38,"column":10},"end":{"line":40,"column":17}}})) != null ? stack1 : "")
    + "      >"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"labelYes") : stack1), depth0))
    + "</button>      \n";
},"13":function(container,depth0,helpers,partials,data) {
    return "            disabled=\"true\"\n";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <button type=\"button\" class=\"binf-btn binf-btn-default csui-no\" tabindex=\"0\"\n              data-binf-dismiss=\"modal\"\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"disableNo") : stack1),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"loc":{"start":{"line":46,"column":10},"end":{"line":48,"column":17}}})) != null ? stack1 : "")
    + "      >"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"labelNo") : stack1), depth0))
    + "</button>\n";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <button class=\"binf-btn binf-btn-default csui-cancel\" tabindex=\"0\"\n              data-binf-dismiss=\"modal\" \n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"disableCancel") : stack1),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"loc":{"start":{"line":54,"column":10},"end":{"line":56,"column":17}}})) != null ? stack1 : "")
    + "      >"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"labelCancel") : stack1), depth0))
    + "</button>      \n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div role=\"alertdialog\"\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"dialogSize") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":2,"column":4},"end":{"line":6,"column":11}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showHeader") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":4},"end":{"line":10,"column":11}}})) != null ? stack1 : "")
    + "    aria-describedby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dlgMsgId") || (depth0 != null ? lookupProperty(depth0,"dlgMsgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dlgMsgId","hash":{},"loc":{"start":{"line":11,"column":22},"end":{"line":11,"column":34}}}) : helper)))
    + "\"      \n>\n  <div class=\"binf-modal-content\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showHeader") : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"loc":{"start":{"line":14,"column":4},"end":{"line":29,"column":11}}})) != null ? stack1 : "")
    + "\n    <div class=\"binf-modal-body\" id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dlgMsgId") || (depth0 != null ? lookupProperty(depth0,"dlgMsgId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dlgMsgId","hash":{},"loc":{"start":{"line":31,"column":37},"end":{"line":31,"column":49}}}) : helper)))
    + "\"></div>\n\n    <div class=\"binf-modal-footer\">\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"showYes") : stack1),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"loc":{"start":{"line":35,"column":4},"end":{"line":42,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"showNo") : stack1),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"loc":{"start":{"line":43,"column":4},"end":{"line":50,"column":11}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"buttons") : depth0)) != null ? lookupProperty(stack1,"showCancel") : stack1),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.noop,"loc":{"start":{"line":51,"column":4},"end":{"line":58,"column":11}}})) != null ? stack1 : "")
    + "  </div>\n  </div>\n  </div>\n\n";
}});
Handlebars.registerPartial('smart_dialogs_modal.alert_impl_modal.alert', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('smart/dialogs/modal.alert/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('smart/dialogs/modal.alert/impl/nls/root/lang',{
  YesButtonLabel: "Yes",
  NoButtonLabel: "No",
  OkButtonLabel: "OK",
  CancelButtonLabel: "Cancel",
  CloseButtonLabel: "Close",
  CloseButtonAria: "Close dialog",
  DefaultWarningTitle: "Warning",
  DefaultInfoTitle: "Information",
  DefaultErrorTitle: "Error",
  DefaultSuccessTitle: "Success",
  DefaultMessageTitle: "Message",
  DefaultQuestionTitle: "Question"
});



csui.define('css!smart/dialogs/modal.alert/impl/modal.alert',[],function(){});

csui.define('css!smart/controls/globalmessage/globalmessage_icons',[],function(){});
csui.define('smart/dialogs/modal.alert/modal.alert',['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/marionette', 'nuc/lib/backbone',
  'nuc/utils/log', 'nuc/utils/base',
  'nuc/lib/handlebars',
  'hbs!smart/dialogs/modal.alert/impl/modal.alert',
  'i18n!smart/dialogs/modal.alert/impl/nls/lang',
  //'smart/behaviors/keyboard.navigation/tabkey.behavior',
  'smart/lib/binf/js/binf',
  'css!smart/dialogs/modal.alert/impl/modal.alert',
  'css!smart/controls/globalmessage/globalmessage_icons',
  'css!smart/controls/dialog/impl/dialog'

], function (module, _, $, Marionette, Backbone, log, base, Handlebars, template, lang /*TabKeyBehavior*/) {

  log = log(module.id);

  var SimpleMessageModel = Backbone.Model.extend({

    defaults: {
      message: ''
    },

    constructor: function SimpleMessageModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var SimpleMessageView = Marionette.ItemView.extend({
    className: 'csui-simple-message-view',

    template: Handlebars.compile('{{message}}'),

    constructor: function SimpleMessageView(options) {
      options.model = new SimpleMessageModel({message: options.message});

      Marionette.ItemView.prototype.constructor.call(this, options);
    }

  });

  var ModalAlertView = Marionette.LayoutView.extend({

    className: function () {
      var className = 'csui-alert cs-dialog binf-modal binf-fade';
      if (this.options.modalClass) {
        className += ' ' + this.options.modalClass;
      }
      return className;
    },

    template: template,

    ui: {
      defaultButton: '.binf-modal-footer > .csui-default',
      buttonYes: '.binf-modal-footer > .binf-btn.csui-yes',
      buttonNo: '.binf-modal-footer > .binf-btn.csui-no',
      buttonCancel: '.binf-modal-footer > .binf-btn.csui-cancel'
    },

    regions: {
      bodyRegion: '.binf-modal-body'
    },

    triggers: {
      'click .csui-yes': 'click:yes',
      'click .csui-no': 'click:no'
    },

    events: {
      'shown.binf.modal': 'onShown',
      'hide.binf.modal': 'onHiding',
      'hidden.binf.modal': 'onHidden',
      'keydown': 'onKeyDown'
    },
    // behaviors: {
    //   TabKeyBehavior: {
    //     behaviorClass: TabKeyBehavior,
    //     recursiveNavigation: true
    //   }
    // },

    constructor: function ModalAlertView(options) {
      // remember focused element      
      this.previousFocusedElement = document.activeElement;

      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      // If message is specified (including empty message) convert it to bodyView
      if (this.options.message || !this.options.bodyView) {
        this.options.bodyView = SimpleMessageView;
        this.options.bodyViewOptions = {message: (this.options.message || '')};
        this.options = _.omit(this.options, 'message');
      }
      options = this.options;

      // Make keys like 'labelYes' from 'Yes' to be able to merge them into options.buttons.
      // Do the same for tooltip and aria, so resulting in 'tooltipYes' and 'ariaYes'.
      var buttonData = _.reduce(ModalAlertView.buttonData, function (result, value, key) {
        result['label' + key] = value.label;
        result['tooltip' + key] = value.tooltip;
        result['aria' + key] = value.aria;
        return result;
      }, {});
      // Show just the close button if no buttons were specified; ensure all button labels
      options.buttons = _.defaults({}, _.isEmpty(options.buttons) ?
                                       ModalAlertView.buttons.Close :
                                       options.buttons, buttonData);
      // Show an information alert if no styling was specified
      _.defaults(options, ModalAlertView.defaultOptions.Information, {
        // Center vertically by default
        centerVertically: true,
        // If an empty title was provided, turn off the dialog header
        showHeader: options.title !== ''
      });

      this._deferred = $.Deferred();
    },

    templateHelpers: function () {
      var templateVals = _(this.options).clone();
      templateVals.dlgTitleId = _.uniqueId('dlgTitle');
      templateVals.dlgMsgId = _.uniqueId('dlgMsg');
      templateVals.closeButtonAria = templateVals.buttons.ariaClose;
      templateVals.closeButtonTooltip = templateVals.buttons.tooltipClose;
      templateVals.bodyViewExists = templateVals.bodyView != false;
      return templateVals;
    },

    show: function () {
      this.render();
      var staticBackdrop = this.options.staticBackdrop === false ? this.options.staticBackdrop : true;
      this.$el.binf_modal({
        backdrop: staticBackdrop ? 'static' : true,
        keyboard: this.options.closeWithEsc !== false
      });
      this.$el.attr('tabindex', 0);
      if (this.options.centerVertically) {
        this.centerVertically();
      }
      this.$el.binf_modal('show');
      this.triggerMethod('show');
      var promise = this._deferred.promise(),
          self = this;
      // TODO: Added only for testing purposes.  How to make modal alert
      // testable without this on the public interface?
      promise.close = function () {
        self.$el.binf_modal('hide');
        return promise;
      };
      return promise;
    },

    centerVertically: function () {
      var $clone;
      var top;

      // add clone of modalAlert to document
      $clone = this.$el.clone();
      $clone.css('display', 'block');
      $clone.appendTo($.fn.binf_modal.getDefaultContainer());

      // calculate top of centered position
      top = Math.round(($clone.height() - $clone.find('.binf-modal-content').height()) / 2);
      top = top > 0 ? top : 0;

      $clone.remove();

      // set top of modalAlert
      this.$el.find('.binf-modal-content').css("margin-top", top);
    },

    onShown: function () {
      this._deferred.notify({state: 'shown'});
      // this._setTabFocus(false);
      this.trigger('modalalert:after:shown', false);

    },

    onHiding: function () {
      var self = this;
      this.$el.addClass('binf-fadein');
        setTimeout(function(){
          self._deferred.notify({state: 'hiding'});
        }, 300);
    },

    onRender: function () {
      var bodyView = new this.options.bodyView(this.options.bodyViewOptions);
      this.showChildView('bodyRegion', bodyView);
    },

    onDestroy: function () {
      if (this.previousFocusedElement && document.body.contains(this.previousFocusedElement)) {
        this.previousFocusedElement.focus();
      }
    },

    // The currently used buttons are provided in the "this.options.buttons" parameter.
    // The "settingsObj" object is an object with the wanted disableXXX settings e.g. { disableYes: false, disableNo: true }.
    updateButtons: function (settingsObj) {
      if (settingsObj) {
        var hasYes, hasNo, hasCancel;

        // we have 3 predefined buttons
        // we support only modifying already existing buttons for now
        if (this.options.buttons.showYes) {
          hasYes = true;
        }
        if (this.options.buttons.showNo) {
          hasNo = true;
        }
        if (this.options.buttons.showCancel) {
          hasCancel = true;
        }
        var disableSettings = _.pick(settingsObj, 'disableYes', 'disableNo', 'disableCancel');
        this.options.buttons = _.extend({}, this.options.buttons, disableSettings);

        // Render destroys the view and recreates it again with initial values (timer) which is
        // not useable in our case. So modify the DOM and let the browser update the buttons.
        // this.render();
        var val;
        if (hasYes) {
          this.ui.buttonYes[0].disabled = !!this.options.buttons.disableYes;
        }
        if (hasNo) {
          this.ui.buttonNo[0].disabled = !!this.options.buttons.disableNo;
        }
        if (hasCancel) {
          this.ui.buttonCancel[0].disabled = !!this.options.buttons.disableCancel;
        }
      }
    },

    onHidden: function (event) {
      this.destroy();
      // Trigger callbacks and promises when the hiding animation ended
      if (this.options.callback) {
        this.options.callback(this._result);
      }
      if (this._result) {
        this._deferred.resolve(this._result);
      } else {
        this._deferred.reject(this._result);
      }
    },

    onKeyDown: function (event) {
      var keyCode = event.keyCode;
      switch (keyCode) {
      case 13:
        // Click the default button by Enter if no sub-control is focused
        if (event.target === this.el) {
          this.ui.defaultButton.trigger('click');
        } else {
          $(event.target).trigger('click');
        }
        break;
          //Tab
      case 9:
        //  return this._setTabFocus(event.shiftKey);
        this.trigger('modalalert:after:shown', event.shiftKey);
        return false;
      }
    },

    onClickYes: function () {
      this._result = true;
    },

    onClickNo: function () {
      this._result = false;
    }

  }, {

    defaultOptions: {
      Success: {
        title: lang.DefaultSuccessTitle,
        titleIcon: 'csui-icon-notification-success-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'success-header'
      },
      Information: {
        title: lang.DefaultInfoTitle,
        titleIcon: 'csui-icon-notification-information-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'info-header'
      },
      Warning: {
        title: lang.DefaultWarningTitle,
        titleIcon: 'csui-icon-notification-warning-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'warning-header'
      },
      Error: {
        title: lang.DefaultErrorTitle,
        titleIcon: 'csui-icon-notification-error-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'error-header'
      },
      Message: {
        title: lang.DefaultMessageTitle,
        titleIcon: '',
        showTitleIcon: false,
        titleCloseIcon: 'csui-icon-dismiss',
        showTitleCloseButton: false,
        headerClass: 'message-header'
      },
      Question: {
        title: lang.DefaultQuestionTitle,
        titleIcon: 'csui-icon-notification-confirmation-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'question-header'
      }
    },

    buttons: {
      YesNoCancel: {
        showYes: true,
        showNo: true,
        showCancel: true
        // disableYes: false,
        // disableNo: false,
        // disableCancel: false
      },
      YesNo: {
        showYes: true,
        showNo: true,
        showCancel: false
      },
      OkCancel: {
        showYes: true,
        labelYes: lang.OkButtonLabel,
        showNo: false,
        showCancel: true
      },
      Ok: {
        showYes: true,
        labelYes: lang.OkButtonLabel,
        showNo: false,
        showCancel: false
      },
      Cancel: {
        showYes: false,
        showNo: false,
        showCancel: true
      },
      Close: {
        showYes: false,
        showNo: false,
        showCancel: true,
        labelCancel: lang.CloseButtonLabel
      }
    },

    buttonData: {
      Yes: {
        label: lang.YesButtonLabel,
        tooltip: lang.YesButtonLabel,
        aria: ''
      },
      No: {
        label: lang.NoButtonLabel,
        tooltip: lang.NoButtonLabel,
        aria: ''
      },
      Ok: {
        label: lang.OkButtonLabel,
        tooltip: lang.OkButtonLabel,
        aria: ''
      },
      Cancel: {
        label: lang.CancelButtonLabel,
        tooltip: lang.CancelButtonLabel,
        aria: ''
      },
      Close: {
        label: lang.CloseButtonLabel,
        tooltip: lang.CloseButtonLabel,
        aria: lang.CloseButtonAria
      }
    },

    showSuccess: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Success,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showInfo: function (callback, message, title, options) {
      // log.warn('The method \'showInfo\' has been deprecated and will be removed.' +
      //          '  Use \'showInformation\' instead.') && console.warn(log.last);
      // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
      this.showInformation.apply(this, arguments);
    },

    showInformation: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Information,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showWarning: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Warning,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showError: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Error,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showMessage: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Message,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    confirmSuccess: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Success,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmInfo: function (callback, message, title, options) {
      // FIXME: Remove this method.
      log.warn('The method \'configInfo\' has been deprecated and will be removed.' +
               '  Use \'configInformation\' instead.') && console.warn(log.last);
      log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
      this.confirmInformation.apply(this, arguments);
    },

    confirmInformation: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Information,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmWarning: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Warning,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmError: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Error,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmQuestion: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Question,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmMessage: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Message,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    _makeOptions: function (parameters, defaultOptions, defaultButtons) {
      var callback = parameters[0],
          message = parameters[1],
          title = parameters[2],
          options = parameters[3];
      // If callback was not provided as the first parameter, shift the others
      if (typeof callback !== 'function') {
        options = title;
        title = message;
        message = callback;
        callback = undefined;
      }
      if (typeof message === 'object') {
        // If only options object was passed in, use it
        options = _.clone(message);
      } else if (typeof title === 'object') {
        // If options object was passed in after the message, use it
        options = _.defaults({message: message}, title);
      } else {
        // If options object was passed in after the message and title, use it
        options = _.defaults({
          message: message,
          title: title
        }, options);
      }
      options.buttons = _.defaults({}, options.buttons, defaultButtons);
      options.callback = callback;
      return _.defaults(options, defaultOptions);
    },

    _show: function (options) {
      var alert = new ModalAlertView(options);
      return alert.show();
    }

  });

  return ModalAlertView;

});

csui.define('bundles/smart-all',[
  // libraries
  // Begin: binf library entries
  'smart/lib/binf/js/binf',
  // End: binf library entries

  // Begin: v2 icons and it's supported classes
  "smart/themes/carbonfiber/smart.mimetype.icons",
  "smart/themes/carbonfiber/smart.mimetype.colorschema.icons",
  "smart/themes/carbonfiber/smart.action.icons",

  'smart/utils/high.contrast/detector',
  'smart/controls/icons.v2/impl/core.smart.icons.v2',
  'smart/controls/icon/icon.view',

  'smart/controls/icons.v2/icons.v2',
  // End: v2 icons and it's supported classes

  //mixins
  // Begin: Responsive Header and Footer mixin entries
  'smart/mixins/generic.utilities/footerview.responsiveness.mixin',
  'smart/mixins/generic.utilities/headerview.responsiveness.mixin',
  // End: Responsive Header and Footer mixin entries

  // Begin: dropdown view
  'smart/mixins/dropdown/dropdown.view',
  // End: dropdown view

  // Begin: layoutview event propagation mixin entries
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  // End: layoutview event propagation mixin entries

  // Begin: view event propagation mixin entries
  'smart/mixins/view.events.propagation/view.events.propagation.mixin',
  // End: view event propagation mixin entries

  // Utilities
  'smart/utils/smart.base',

  //controls
  // Begin: breadcrumbs entries
  'smart/controls/breadcrumbs/breadcrumbs.view',
  'smart/controls/breadcrumbs/breadcrumb.view',
  // End: breadcrumbs entries

  // Begin: error view entries
  'smart/controls/error/error.view',
  // End: error view entries

  // Begin: generic dialog view entries
  'smart/controls/dialog/dialog.view',
  'smart/controls/dialog/footer.view',
  'smart/controls/dialog/header.view',
  // End: generic dialog view entries

  
  // Begin: globalmessage entries
  // 'smart/controls/globalmessage/globalmessage',
  // 'smart/controls/globalmessage/impl/messagedialog.view',
  // 'smart/controls/globalmessage/impl/custom.wrapper.view',
  // End: globalmessage entries

  // Begin: pagination view entries
  'smart/controls/pagination/nodespagination.view',
  'smart/controls/pagination/impl/nls/root/localized.strings',
  // End: pagination view entries

  // Begin: blocking view entries
  'smart/controls/progressblocker/blocker',
  // End: blocking view entries

  // Begin: progresspanel entries
  // 'smart/controls/progresspanel/progresspanel',
  // 'smart/controls/progresspanel/impl/progresspanel/test/progresspanel.mock',
  // End: progresspanel entries

  // Begin: side panel view entries
  'smart/controls/side.panel/side.panel.view',
  'smart/controls/side.panel/impl/side.panel.util',
  // End: side panel view entries

  // Begin: tab panel view entries
  // 'smart/controls/tab.panel/tab.panel.view',
  // 'smart/controls/tab.panel/tab.links.ext.view',
  // 'smart/controls/tab.panel/tab.links.ext.scroll.mixin',
  // End: tab panel view entries

  // Begin: mini profile view entries
  //'smart/controls/user/miniprofile.view',
  // End: mini profile view entries

  // Begin: user profile view entries
  //'smart/controls/user/user.profile.view',
  // End: user profile view entries

  // Begin: modalalert view entries
  'smart/dialogs/modal.alert/modal.alert',
  'smart/dialogs/modal.alert/impl/nls/root/lang',
  // End: modalalert view entries

  //utils
  // Begin: non-emptying region view entries
  'smart/utils/non-emptying.region/non-emptying.region'
  // End: non-emptying region view entries

], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'smart/bundles/smart-all', true);
});
