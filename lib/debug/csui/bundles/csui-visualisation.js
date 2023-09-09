//D3 v 5.16.0

csui.define('csui/lib/d3',['exports'], function (exports) { 'use strict';

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll(select) {
    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  function matcher(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant(x) {
    return function() {
      return x;
    };
  }

  var keyPrefix = "$"; // Protect against keys like “__proto__”.

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = {},
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function(d) { data[++j] = d; });
      return data;
    }

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = value.call(parent, parent && parent.__data__, j, parents),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
    if (onupdate != null) update = onupdate(update);
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(selection) {

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function() { nodes[++i] = this; });
    return nodes;
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    var size = 0;
    this.each(function() { ++size; });
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove : typeof value === "function"
              ? styleFunction
              : styleConstant)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction
            : textConstant)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  var filterEvents = {};

  exports.event = null;

  if (typeof document !== "undefined") {
    var element = document.documentElement;
    if (!("onmouseenter" in element)) {
      filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
    }
  }

  function filterContextListener(listener, index, group) {
    listener = contextListener(listener, index, group);
    return function(event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener(listener, index, group) {
    return function(event1) {
      var event0 = exports.event; // Events can be reentrant (e.g., focus).
      exports.event = event1;
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
        exports.event = event0;
      }
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, capture) {
    var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
    return function(d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
          this.addEventListener(o.type, o.listener = listener, o.capture = capture);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, capture) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    if (capture == null) capture = false;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
    return this;
  }

  function customEvent(event1, listener, that, args) {
    var event0 = exports.event;
    event1.sourceEvent = exports.event;
    exports.event = event1;
    try {
      return listener.apply(that, args);
    } finally {
      exports.event = event0;
    }
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection([[document.documentElement]], root);
  }

  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection([[document.querySelector(selector)]], [document.documentElement])
        : new Selection([[selector]], root);
  }

  function create(name) {
    return select(creator(name).call(document.documentElement));
  }

  var nextId = 0;

  function local() {
    return new Local;
  }

  function Local() {
    this._ = "@" + (++nextId).toString(36);
  }

  Local.prototype = local.prototype = {
    constructor: Local,
    get: function(node) {
      var id = this._;
      while (!(id in node)) if (!(node = node.parentNode)) return;
      return node[id];
    },
    set: function(node, value) {
      return node[this._] = value;
    },
    remove: function(node) {
      return this._ in node && delete node[this._];
    },
    toString: function() {
      return this._;
    }
  };

  function sourceEvent() {
    var current = exports.event, source;
    while (source = current.sourceEvent) current = source;
    return current;
  }

  function point(node, event) {
    var svg = node.ownerSVGElement || node;

    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }

    var rect = node.getBoundingClientRect();
    return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
  }

  function mouse(node) {
    var event = sourceEvent();
    if (event.changedTouches) event = event.changedTouches[0];
    return point(node, event);
  }

  function selectAll(selector) {
    return typeof selector === "string"
        ? new Selection([document.querySelectorAll(selector)], [document.documentElement])
        : new Selection([selector == null ? [] : selector], root);
  }

  function touch(node, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

    for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return point(node, touch);
      }
    }

    return null;
  }

  function touches(node, touches) {
    if (touches == null) touches = sourceEvent().touches;

    for (var i = 0, n = touches ? touches.length : 0, points = new Array(n); i < n; ++i) {
      points[i] = point(node, touches[i]);
    }

    return points;
  }

  function ascending$1(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending$1(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending$1);
  var bisectRight = ascendingBisect.right;
  var bisectLeft = ascendingBisect.left;

  function pairs(array, f) {
    if (f == null) f = pair;
    var i = 0, n = array.length - 1, p = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = f(p, p = array[++i]);
    return pairs;
  }

  function pair(a, b) {
    return [a, b];
  }

  function cross(values0, values1, reduce) {
    var n0 = values0.length,
        n1 = values1.length,
        values = new Array(n0 * n1),
        i0,
        i1,
        i,
        value0;

    if (reduce == null) reduce = pair;

    for (i0 = i = 0; i0 < n0; ++i0) {
      for (value0 = values0[i0], i1 = 0; i1 < n1; ++i1, ++i) {
        values[i] = reduce(value0, values1[i1]);
      }
    }

    return values;
  }

  function descending(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  function number(x) {
    return x === null ? NaN : +x;
  }

  function variance(values, valueof) {
    var n = values.length,
        m = 0,
        i = -1,
        mean = 0,
        value,
        delta,
        sum = 0;

    if (valueof == null) {
      while (++i < n) {
        if (!isNaN(value = number(values[i]))) {
          delta = value - mean;
          mean += delta / ++m;
          sum += delta * (value - mean);
        }
      }
    }

    else {
      while (++i < n) {
        if (!isNaN(value = number(valueof(values[i], i, values)))) {
          delta = value - mean;
          mean += delta / ++m;
          sum += delta * (value - mean);
        }
      }
    }

    if (m > 1) return sum / (m - 1);
  }

  function deviation(array, f) {
    var v = variance(array, f);
    return v ? Math.sqrt(v) : v;
  }

  function extent(values, valueof) {
    var n = values.length,
        i = -1,
        value,
        min,
        max;

    if (valueof == null) {
      while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
          min = max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = values[i]) != null) {
              if (min > value) min = value;
              if (max < value) max = value;
            }
          }
        }
      }
    }

    else {
      while (++i < n) { // Find the first comparable value.
        if ((value = valueof(values[i], i, values)) != null && value >= value) {
          min = max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = valueof(values[i], i, values)) != null) {
              if (min > value) min = value;
              if (max < value) max = value;
            }
          }
        }
      }
    }

    return [min, max];
  }

  var array = Array.prototype;

  var slice = array.slice;
  var map = array.map;

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function identity(x) {
    return x;
  }

  function sequence(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

    var i = -1,
        n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
        range = new Array(n);

    while (++i < n) {
      range[i] = start + i * step;
    }

    return range;
  }

  var e10 = Math.sqrt(50),
      e5 = Math.sqrt(10),
      e2 = Math.sqrt(2);

  function ticks(start, stop, count) {
    var reverse,
        i = -1,
        n,
        ticks,
        step;

    stop = +stop, start = +start, count = +count;
    if (start === stop && count > 0) return [start];
    if (reverse = stop < start) n = start, start = stop, stop = n;
    if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

    if (step > 0) {
      start = Math.ceil(start / step);
      stop = Math.floor(stop / step);
      ticks = new Array(n = Math.ceil(stop - start + 1));
      while (++i < n) ticks[i] = (start + i) * step;
    } else {
      start = Math.floor(start * step);
      stop = Math.ceil(stop * step);
      ticks = new Array(n = Math.ceil(start - stop + 1));
      while (++i < n) ticks[i] = (start - i) / step;
    }

    if (reverse) ticks.reverse();

    return ticks;
  }

  function tickIncrement(start, stop, count) {
    var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
    return power >= 0
        ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
        : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
  }

  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;
    else if (error >= e5) step1 *= 5;
    else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
  }

  function sturges(values) {
    return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
  }

  function histogram() {
    var value = identity,
        domain = extent,
        threshold = sturges;

    function histogram(data) {
      var i,
          n = data.length,
          x,
          values = new Array(n);

      for (i = 0; i < n; ++i) {
        values[i] = value(data[i], i, data);
      }

      var xz = domain(values),
          x0 = xz[0],
          x1 = xz[1],
          tz = threshold(values, x0, x1);

      // Convert number of thresholds into uniform thresholds.
      if (!Array.isArray(tz)) {
        tz = tickStep(x0, x1, tz);
        tz = sequence(Math.ceil(x0 / tz) * tz, x1, tz); // exclusive
      }

      // Remove any thresholds outside the domain.
      var m = tz.length;
      while (tz[0] <= x0) tz.shift(), --m;
      while (tz[m - 1] > x1) tz.pop(), --m;

      var bins = new Array(m + 1),
          bin;

      // Initialize bins.
      for (i = 0; i <= m; ++i) {
        bin = bins[i] = [];
        bin.x0 = i > 0 ? tz[i - 1] : x0;
        bin.x1 = i < m ? tz[i] : x1;
      }

      // Assign data to bins by value, ignoring any outside the domain.
      for (i = 0; i < n; ++i) {
        x = values[i];
        if (x0 <= x && x <= x1) {
          bins[bisectRight(tz, x, 0, m)].push(data[i]);
        }
      }

      return bins;
    }

    histogram.value = function(_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : constant$1(_), histogram) : value;
    };

    histogram.domain = function(_) {
      return arguments.length ? (domain = typeof _ === "function" ? _ : constant$1([_[0], _[1]]), histogram) : domain;
    };

    histogram.thresholds = function(_) {
      return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant$1(slice.call(_)) : constant$1(_), histogram) : threshold;
    };

    return histogram;
  }

  function threshold(values, p, valueof) {
    if (valueof == null) valueof = number;
    if (!(n = values.length)) return;
    if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
    if (p >= 1) return +valueof(values[n - 1], n - 1, values);
    var n,
        i = (n - 1) * p,
        i0 = Math.floor(i),
        value0 = +valueof(values[i0], i0, values),
        value1 = +valueof(values[i0 + 1], i0 + 1, values);
    return value0 + (value1 - value0) * (i - i0);
  }

  function freedmanDiaconis(values, min, max) {
    values = map.call(values, number).sort(ascending$1);
    return Math.ceil((max - min) / (2 * (threshold(values, 0.75) - threshold(values, 0.25)) * Math.pow(values.length, -1 / 3)));
  }

  function scott(values, min, max) {
    return Math.ceil((max - min) / (3.5 * deviation(values) * Math.pow(values.length, -1 / 3)));
  }

  function max(values, valueof) {
    var n = values.length,
        i = -1,
        value,
        max;

    if (valueof == null) {
      while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
          max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = values[i]) != null && value > max) {
              max = value;
            }
          }
        }
      }
    }

    else {
      while (++i < n) { // Find the first comparable value.
        if ((value = valueof(values[i], i, values)) != null && value >= value) {
          max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = valueof(values[i], i, values)) != null && value > max) {
              max = value;
            }
          }
        }
      }
    }

    return max;
  }

  function mean(values, valueof) {
    var n = values.length,
        m = n,
        i = -1,
        value,
        sum = 0;

    if (valueof == null) {
      while (++i < n) {
        if (!isNaN(value = number(values[i]))) sum += value;
        else --m;
      }
    }

    else {
      while (++i < n) {
        if (!isNaN(value = number(valueof(values[i], i, values)))) sum += value;
        else --m;
      }
    }

    if (m) return sum / m;
  }

  function median(values, valueof) {
    var n = values.length,
        i = -1,
        value,
        numbers = [];

    if (valueof == null) {
      while (++i < n) {
        if (!isNaN(value = number(values[i]))) {
          numbers.push(value);
        }
      }
    }

    else {
      while (++i < n) {
        if (!isNaN(value = number(valueof(values[i], i, values)))) {
          numbers.push(value);
        }
      }
    }

    return threshold(numbers.sort(ascending$1), 0.5);
  }

  function merge(arrays) {
    var n = arrays.length,
        m,
        i = -1,
        j = 0,
        merged,
        array;

    while (++i < n) j += arrays[i].length;
    merged = new Array(j);

    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }

    return merged;
  }

  function min(values, valueof) {
    var n = values.length,
        i = -1,
        value,
        min;

    if (valueof == null) {
      while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
          min = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = values[i]) != null && min > value) {
              min = value;
            }
          }
        }
      }
    }

    else {
      while (++i < n) { // Find the first comparable value.
        if ((value = valueof(values[i], i, values)) != null && value >= value) {
          min = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = valueof(values[i], i, values)) != null && min > value) {
              min = value;
            }
          }
        }
      }
    }

    return min;
  }

  function permute(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  }

  function scan(values, compare) {
    if (!(n = values.length)) return;
    var n,
        i = 0,
        j = 0,
        xi,
        xj = values[j];

    if (compare == null) compare = ascending$1;

    while (++i < n) {
      if (compare(xi = values[i], xj) < 0 || compare(xj, xj) !== 0) {
        xj = xi, j = i;
      }
    }

    if (compare(xj, xj) === 0) return j;
  }

  function shuffle(array, i0, i1) {
    var m = (i1 == null ? array.length : i1) - (i0 = i0 == null ? 0 : +i0),
        t,
        i;

    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0];
      array[m + i0] = array[i + i0];
      array[i + i0] = t;
    }

    return array;
  }

  function sum(values, valueof) {
    var n = values.length,
        i = -1,
        value,
        sum = 0;

    if (valueof == null) {
      while (++i < n) {
        if (value = +values[i]) sum += value; // Note: zero and null are equivalent.
      }
    }

    else {
      while (++i < n) {
        if (value = +valueof(values[i], i, values)) sum += value;
      }
    }

    return sum;
  }

  function transpose(matrix) {
    if (!(n = matrix.length)) return [];
    for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m;) {
      for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
        row[j] = matrix[j][i];
      }
    }
    return transpose;
  }

  function length(d) {
    return d.length;
  }

  function zip() {
    return transpose(arguments);
  }

  function initRange(domain, range) {
    switch (arguments.length) {
      case 0: break;
      case 1: this.range(domain); break;
      default: this.range(range).domain(domain); break;
    }
    return this;
  }

  function initInterpolator(domain, interpolator) {
    switch (arguments.length) {
      case 0: break;
      case 1: this.interpolator(domain); break;
      default: this.interpolator(interpolator).domain(domain); break;
    }
    return this;
  }

  var prefix = "$";

  function Map() {}

  Map.prototype = map$1.prototype = {
    constructor: Map,
    has: function(key) {
      return (prefix + key) in this;
    },
    get: function(key) {
      return this[prefix + key];
    },
    set: function(key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function(key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function() {
      for (var property in this) if (property[0] === prefix) delete this[property];
    },
    keys: function() {
      var keys = [];
      for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
      return keys;
    },
    values: function() {
      var values = [];
      for (var property in this) if (property[0] === prefix) values.push(this[property]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
      return entries;
    },
    size: function() {
      var size = 0;
      for (var property in this) if (property[0] === prefix) ++size;
      return size;
    },
    empty: function() {
      for (var property in this) if (property[0] === prefix) return false;
      return true;
    },
    each: function(f) {
      for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  };

  function map$1(object, f) {
    var map = new Map;

    // Copy constructor.
    if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) map.set(i, object[i]);
      else while (++i < n) map.set(f(o = object[i], i, object), o);
    }

    // Convert object to map.
    else if (object) for (var key in object) map.set(key, object[key]);

    return map;
  }

  function Set() {}

  var proto = map$1.prototype;

  Set.prototype = set.prototype = {
    constructor: Set,
    has: proto.has,
    add: function(value) {
      value += "";
      this[prefix + value] = value;
      return this;
    },
    remove: proto.remove,
    clear: proto.clear,
    values: proto.keys,
    size: proto.size,
    empty: proto.empty,
    each: proto.each
  };

  function set(object, f) {
    var set = new Set;

    // Copy constructor.
    if (object instanceof Set) object.each(function(value) { set.add(value); });

    // Otherwise, assume it’s an array.
    else if (object) {
      var i = -1, n = object.length;
      if (f == null) while (++i < n) set.add(object[i]);
      else while (++i < n) set.add(f(object[i], i, object));
    }

    return set;
  }

  var array$1 = Array.prototype;

  var map$2 = array$1.map;
  var slice$1 = array$1.slice;

  var implicit = {name: "implicit"};

  function ordinal() {
    var index = map$1(),
        domain = [],
        range = [],
        unknown = implicit;

    function scale(d) {
      var key = d + "", i = index.get(key);
      if (!i) {
        if (unknown !== implicit) return unknown;
        index.set(key, i = domain.push(d));
      }
      return range[(i - 1) % range.length];
    }

    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [], index = map$1();
      var i = -1, n = _.length, d, key;
      while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
      return scale;
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), scale) : range.slice();
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    scale.copy = function() {
      return ordinal(domain, range).unknown(unknown);
    };

    initRange.apply(scale, arguments);

    return scale;
  }

  function band() {
    var scale = ordinal().unknown(undefined),
        domain = scale.domain,
        ordinalRange = scale.range,
        range = [0, 1],
        step,
        bandwidth,
        round = false,
        paddingInner = 0,
        paddingOuter = 0,
        align = 0.5;

    delete scale.unknown;

    function rescale() {
      var n = domain().length,
          reverse = range[1] < range[0],
          start = range[reverse - 0],
          stop = range[1 - reverse];
      step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
      if (round) step = Math.floor(step);
      start += (stop - start - step * (n - paddingInner)) * align;
      bandwidth = step * (1 - paddingInner);
      if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
      var values = sequence(n).map(function(i) { return start + step * i; });
      return ordinalRange(reverse ? values.reverse() : values);
    }

    scale.domain = function(_) {
      return arguments.length ? (domain(_), rescale()) : domain();
    };

    scale.range = function(_) {
      return arguments.length ? (range = [+_[0], +_[1]], rescale()) : range.slice();
    };

    scale.rangeRound = function(_) {
      return range = [+_[0], +_[1]], round = true, rescale();
    };

    scale.bandwidth = function() {
      return bandwidth;
    };

    scale.step = function() {
      return step;
    };

    scale.round = function(_) {
      return arguments.length ? (round = !!_, rescale()) : round;
    };

    scale.padding = function(_) {
      return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
    };

    scale.paddingInner = function(_) {
      return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
    };

    scale.paddingOuter = function(_) {
      return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
    };

    scale.align = function(_) {
      return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
    };

    scale.copy = function() {
      return band(domain(), range)
          .round(round)
          .paddingInner(paddingInner)
          .paddingOuter(paddingOuter)
          .align(align);
    };

    return initRange.apply(rescale(), arguments);
  }

  function pointish(scale) {
    var copy = scale.copy;

    scale.padding = scale.paddingOuter;
    delete scale.paddingInner;
    delete scale.paddingOuter;

    scale.copy = function() {
      return pointish(copy());
    };

    return scale;
  }

  function point$1() {
    return pointish(band.apply(null, arguments).paddingInner(1));
  }

  function csuiDefine(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
      reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
      reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
      reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
      reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
      reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  csuiDefine(Color, color, {
    copy: function(channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable: function() {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
        : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
        : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
        : null) // invalid hex
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  csuiDefine(Rgb, rgb, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (-0.5 <= this.r && this.r < 255.5)
          && (-0.5 <= this.g && this.g < 255.5)
          && (-0.5 <= this.b && this.b < 255.5)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));

  function rgb_formatHex() {
    return "#" + hex(this.r) + hex(this.g) + hex(this.b);
  }

  function rgb_formatRgb() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }

  function hex(value) {
    value = Math.max(0, Math.min(255, Math.round(value) || 0));
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  csuiDefine(Hsl, hsl, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "hsl(" : "hsla(")
          + (this.h || 0) + ", "
          + (this.s || 0) * 100 + "%, "
          + (this.l || 0) * 100 + "%"
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  var deg2rad = Math.PI / 180;
  var rad2deg = 180 / Math.PI;

  // https://observablehq.com/@mbostock/lab-and-rgb
  var K = 18,
      Xn = 0.96422,
      Yn = 1,
      Zn = 0.82521,
      t0 = 4 / 29,
      t1 = 6 / 29,
      t2 = 3 * t1 * t1,
      t3 = t1 * t1 * t1;

  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) return hcl2lab(o);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = rgb2lrgb(o.r),
        g = rgb2lrgb(o.g),
        b = rgb2lrgb(o.b),
        y = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn), x, z;
    if (r === g && g === b) x = z = y; else {
      x = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
      z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
    }
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }

  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }

  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }

  csuiDefine(Lab, lab, extend(Color, {
    brighter: function(k) {
      return new Lab(this.l + K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker: function(k) {
      return new Lab(this.l - K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb: function() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      x = Xn * lab2xyz(x);
      y = Yn * lab2xyz(y);
      z = Zn * lab2xyz(z);
      return new Rgb(
        lrgb2rgb( 3.1338561 * x - 1.6168667 * y - 0.4906146 * z),
        lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z),
        lrgb2rgb( 0.0719453 * x - 0.2289914 * y + 1.4052427 * z),
        this.opacity
      );
    }
  }));

  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
  }

  function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
  }

  function lrgb2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }

  function rgb2lrgb(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
    var h = Math.atan2(o.b, o.a) * rad2deg;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }

  function hcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }

  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }

  function hcl2lab(o) {
    if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }

  csuiDefine(Hcl, hcl, extend(Color, {
    brighter: function(k) {
      return new Hcl(this.h, this.c, this.l + K * (k == null ? 1 : k), this.opacity);
    },
    darker: function(k) {
      return new Hcl(this.h, this.c, this.l - K * (k == null ? 1 : k), this.opacity);
    },
    rgb: function() {
      return hcl2lab(this).rgb();
    }
  }));

  var A = -0.14861,
      B = +1.78277,
      C = -0.29227,
      D = -0.90649,
      E = +1.97294,
      ED = E * D,
      EB = E * B,
      BC_DA = B * C - D * A;

  function cubehelixConvert(o) {
    if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
        bl = b - l,
        k = (E * (g - l) - C * bl) / D,
        s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
        h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
    return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
  }

  function cubehelix(h, s, l, opacity) {
    return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
  }

  function Cubehelix(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  csuiDefine(Cubehelix, cubehelix, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
          l = +this.l,
          a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
          cosh = Math.cos(h),
          sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh)),
        this.opacity
      );
    }
  }));

  function basis(t1, v0, v1, v2, v3) {
    var t2 = t1 * t1, t3 = t2 * t1;
    return ((1 - 3 * t1 + 3 * t2 - t3) * v0
        + (4 - 6 * t2 + 3 * t3) * v1
        + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
        + t3 * v3) / 6;
  }

  function basis$1(values) {
    var n = values.length - 1;
    return function(t) {
      var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
          v1 = values[i],
          v2 = values[i + 1],
          v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
          v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  function basisClosed(values) {
    var n = values.length;
    return function(t) {
      var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
          v0 = values[(i + n - 1) % n],
          v1 = values[i % n],
          v2 = values[(i + 1) % n],
          v3 = values[(i + 2) % n];
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  function constant$2(x) {
    return function() {
      return x;
    };
  }

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function hue(a, b) {
    var d = b - a;
    return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant$2(isNaN(a) ? b : a);
  }

  var interpolateRgb = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function rgbSpline(spline) {
    return function(colors) {
      var n = colors.length,
          r = new Array(n),
          g = new Array(n),
          b = new Array(n),
          i, color;
      for (i = 0; i < n; ++i) {
        color = rgb(colors[i]);
        r[i] = color.r || 0;
        g[i] = color.g || 0;
        b[i] = color.b || 0;
      }
      r = spline(r);
      g = spline(g);
      b = spline(b);
      color.opacity = 1;
      return function(t) {
        color.r = r(t);
        color.g = g(t);
        color.b = b(t);
        return color + "";
      };
    };
  }

  var rgbBasis = rgbSpline(basis$1);
  var rgbBasisClosed = rgbSpline(basisClosed);

  function numberArray(a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0,
        c = b.slice(),
        i;
    return function(t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }

  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  function array$2(a, b) {
    return (isNumberArray(b) ? numberArray : genericArray)(a, b);
  }

  function genericArray(a, b) {
    var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(na),
        c = new Array(nb),
        i;

    for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];

    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b = +b, function(t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  function object(a, b) {
    var i = {},
        c = {},
        k;

    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};

    for (k in b) {
      if (k in a) {
        i[k] = interpolateValue(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function interpolateString(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  function interpolateValue(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant$2(b)
        : (t === "number" ? interpolateNumber
        : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
        : b instanceof color ? interpolateRgb
        : b instanceof Date ? date
        : isNumberArray(b) ? numberArray
        : Array.isArray(b) ? genericArray
        : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
        : interpolateNumber)(a, b);
  }

  function discrete(range) {
    var n = range.length;
    return function(t) {
      return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
  }

  function hue$1(a, b) {
    var i = hue(+a, +b);
    return function(t) {
      var x = i(t);
      return x - 360 * Math.floor(x / 360);
    };
  }

  function interpolateRound(a, b) {
    return a = +a, b = +b, function(t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  var degrees = 180 / Math.PI;

  var identity$1 = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var cssNode,
      cssRoot,
      cssView,
      svgNode;

  function parseCss(value) {
    if (value === "none") return identity$1;
    if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
    cssNode.style.transform = value;
    value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
    cssRoot.removeChild(cssNode);
    value = value.slice(7, -1).split(",");
    return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
  }

  function parseSvg(value) {
    if (value == null) return identity$1;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var rho = Math.SQRT2,
      rho2 = 2,
      rho4 = 4,
      epsilon2 = 1e-12;

  function cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }

  function sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }

  function tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }

  // p0 = [ux0, uy0, w0]
  // p1 = [ux1, uy1, w1]
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
        ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
        dx = ux1 - ux0,
        dy = uy1 - uy0,
        d2 = dx * dx + dy * dy,
        i,
        S;

    // Special case for u0 ≅ u1.
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    }

    // General case.
    else {
      var d1 = Math.sqrt(d2),
          b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
          b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
          r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
          r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S,
            coshr0 = cosh(r0),
            u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      };
    }

    i.duration = S * 1000;

    return i;
  }

  function hsl$1(hue) {
    return function(start, end) {
      var h = hue((start = hsl(start)).h, (end = hsl(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
  }

  var hsl$2 = hsl$1(hue);
  var hslLong = hsl$1(nogamma);

  function lab$1(start, end) {
    var l = nogamma((start = lab(start)).l, (end = lab(end)).l),
        a = nogamma(start.a, end.a),
        b = nogamma(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.l = l(t);
      start.a = a(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  function hcl$1(hue) {
    return function(start, end) {
      var h = hue((start = hcl(start)).h, (end = hcl(end)).h),
          c = nogamma(start.c, end.c),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.c = c(t);
        start.l = l(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
  }

  var hcl$2 = hcl$1(hue);
  var hclLong = hcl$1(nogamma);

  function cubehelix$1(hue) {
    return (function cubehelixGamma(y) {
      y = +y;

      function cubehelix$1(start, end) {
        var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
            s = nogamma(start.s, end.s),
            l = nogamma(start.l, end.l),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.h = h(t);
          start.s = s(t);
          start.l = l(Math.pow(t, y));
          start.opacity = opacity(t);
          return start + "";
        };
      }

      cubehelix$1.gamma = cubehelixGamma;

      return cubehelix$1;
    })(1);
  }

  var cubehelix$2 = cubehelix$1(hue);
  var cubehelixLong = cubehelix$1(nogamma);

  function piecewise(interpolate, values) {
    var i = 0, n = values.length - 1, v = values[0], I = new Array(n < 0 ? 0 : n);
    while (i < n) I[i] = interpolate(v, v = values[++i]);
    return function(t) {
      var i = Math.max(0, Math.min(n - 1, Math.floor(t *= n)));
      return I[i](t - i);
    };
  }

  function quantize(interpolator, n) {
    var samples = new Array(n);
    for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
    return samples;
  }

  function constant$3(x) {
    return function() {
      return x;
    };
  }

  function number$1(x) {
    return +x;
  }

  var unit = [0, 1];

  function identity$2(x) {
    return x;
  }

  function normalize(a, b) {
    return (b -= (a = +a))
        ? function(x) { return (x - a) / b; }
        : constant$3(isNaN(b) ? NaN : 0.5);
  }

  function clamper(domain) {
    var a = domain[0], b = domain[domain.length - 1], t;
    if (a > b) t = a, a = b, b = t;
    return function(x) { return Math.max(a, Math.min(b, x)); };
  }

  // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
  // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
  function bimap(domain, range, interpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
    else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
    return function(x) { return r0(d0(x)); };
  }

  function polymap(domain, range, interpolate) {
    var j = Math.min(domain.length, range.length) - 1,
        d = new Array(j),
        r = new Array(j),
        i = -1;

    // Reverse descending domains.
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }

    while (++i < j) {
      d[i] = normalize(domain[i], domain[i + 1]);
      r[i] = interpolate(range[i], range[i + 1]);
    }

    return function(x) {
      var i = bisectRight(domain, x, 1, j) - 1;
      return r[i](d[i](x));
    };
  }

  function copy(source, target) {
    return target
        .domain(source.domain())
        .range(source.range())
        .interpolate(source.interpolate())
        .clamp(source.clamp())
        .unknown(source.unknown());
  }

  function transformer() {
    var domain = unit,
        range = unit,
        interpolate = interpolateValue,
        transform,
        untransform,
        unknown,
        clamp = identity$2,
        piecewise,
        output,
        input;

    function rescale() {
      piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }

    function scale(x) {
      return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
    }

    scale.invert = function(y) {
      return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
    };

    scale.domain = function(_) {
      return arguments.length ? (domain = map$2.call(_, number$1), clamp === identity$2 || (clamp = clamper(domain)), rescale()) : domain.slice();
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
    };

    scale.rangeRound = function(_) {
      return range = slice$1.call(_), interpolate = interpolateRound, rescale();
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = _ ? clamper(domain) : identity$2, scale) : clamp !== identity$2;
    };

    scale.interpolate = function(_) {
      return arguments.length ? (interpolate = _, rescale()) : interpolate;
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    return function(t, u) {
      transform = t, untransform = u;
      return rescale();
    };
  }

  function continuous(transform, untransform) {
    return transformer()(transform, untransform);
  }

  function formatDecimal(x) {
    return Math.abs(x = Math.round(x)) >= 1e21
        ? x.toLocaleString("en").replace(/,/g, "")
        : x.toString(10);
  }

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimalParts(1.23) returns ["123", 0].
  function formatDecimalParts(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  function exponent(x) {
    return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
  }

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  }

  function formatNumerals(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }

  formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
    this.align = specifier.align === undefined ? ">" : specifier.align + "";
    this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === undefined ? undefined : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === undefined ? "" : specifier.type + "";
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width === undefined ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
        + (this.trim ? "~" : "")
        + this.type;
  };

  // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
  function formatTrim(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  }

  function formatRounded(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  var formatTypes = {
    "%": function(x, p) { return (x * 100).toFixed(p); },
    "b": function(x) { return Math.round(x).toString(2); },
    "c": function(x) { return x + ""; },
    "d": formatDecimal,
    "e": function(x, p) { return x.toExponential(p); },
    "f": function(x, p) { return x.toFixed(p); },
    "g": function(x, p) { return x.toPrecision(p); },
    "o": function(x) { return Math.round(x).toString(8); },
    "p": function(x, p) { return formatRounded(x * 100, p); },
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
    "x": function(x) { return Math.round(x).toString(16); }
  };

  function identity$3(x) {
    return x;
  }

  var map$3 = Array.prototype.map,
      prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function formatLocale(locale) {
    var group = locale.grouping === undefined || locale.thousands === undefined ? identity$3 : formatGroup(map$3.call(locale.grouping, Number), locale.thousands + ""),
        currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
        currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
        decimal = locale.decimal === undefined ? "." : locale.decimal + "",
        numerals = locale.numerals === undefined ? identity$3 : formatNumerals(map$3.call(locale.numerals, String)),
        percent = locale.percent === undefined ? "%" : locale.percent + "",
        minus = locale.minus === undefined ? "-" : locale.minus + "",
        nan = locale.nan === undefined ? "NaN" : locale.nan + "";

    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          trim = specifier.trim,
          type = specifier.type;

      // The "n" type is an alias for ",g".
      if (type === "n") comma = true, type = "g";

      // The "" type, and any invalid type, is an alias for ".12~g".
      else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

      // If zero fill is specified, padding goes after sign and before digits.
      if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision === undefined ? 6
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      function format(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix,
            i, n, c;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Determine the sign. -0 is not less than 0, but 1 / -0 is!
          var valueNegative = value < 0 || 1 / value < 0;

          // Perform the initial formatting.
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

          // Trim insignificant zeros.
          if (trim) value = formatTrim(value);

          // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": value = valuePrefix + value + valueSuffix + padding; break;
          case "=": value = valuePrefix + padding + value + valueSuffix; break;
          case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
          default: value = padding + valuePrefix + value + valueSuffix; break;
        }

        return numerals(value);
      }

      format.toString = function() {
        return specifier + "";
      };

      return format;
    }

    function formatPrefix(specifier, value) {
      var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: newFormat,
      formatPrefix: formatPrefix
    };
  }

  var locale;

  defaultLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
    minus: "-"
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    exports.format = locale.format;
    exports.formatPrefix = locale.formatPrefix;
    return locale;
  }

  function precisionFixed(step) {
    return Math.max(0, -exponent(Math.abs(step)));
  }

  function precisionPrefix(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
  }

  function precisionRound(step, max) {
    step = Math.abs(step), max = Math.abs(max) - step;
    return Math.max(0, exponent(max) - exponent(step)) + 1;
  }

  function tickFormat(start, stop, count, specifier) {
    var step = tickStep(start, stop, count),
        precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return exports.formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return exports.format(specifier);
  }

  function linearish(scale) {
    var domain = scale.domain;

    scale.ticks = function(count) {
      var d = domain();
      return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
    };

    scale.tickFormat = function(count, specifier) {
      var d = domain();
      return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
    };

    scale.nice = function(count) {
      if (count == null) count = 10;

      var d = domain(),
          i0 = 0,
          i1 = d.length - 1,
          start = d[i0],
          stop = d[i1],
          step;

      if (stop < start) {
        step = start, start = stop, stop = step;
        step = i0, i0 = i1, i1 = step;
      }

      step = tickIncrement(start, stop, count);

      if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
        step = tickIncrement(start, stop, count);
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
        step = tickIncrement(start, stop, count);
      }

      if (step > 0) {
        d[i0] = Math.floor(start / step) * step;
        d[i1] = Math.ceil(stop / step) * step;
        domain(d);
      } else if (step < 0) {
        d[i0] = Math.ceil(start * step) / step;
        d[i1] = Math.floor(stop * step) / step;
        domain(d);
      }

      return scale;
    };

    return scale;
  }

  function linear$1() {
    var scale = continuous(identity$2, identity$2);

    scale.copy = function() {
      return copy(scale, linear$1());
    };

    initRange.apply(scale, arguments);

    return linearish(scale);
  }

  function identity$4(domain) {
    var unknown;

    function scale(x) {
      return isNaN(x = +x) ? unknown : x;
    }

    scale.invert = scale;

    scale.domain = scale.range = function(_) {
      return arguments.length ? (domain = map$2.call(_, number$1), scale) : domain.slice();
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    scale.copy = function() {
      return identity$4(domain).unknown(unknown);
    };

    domain = arguments.length ? map$2.call(domain, number$1) : [0, 1];

    return linearish(scale);
  }

  function nice(domain, interval) {
    domain = domain.slice();

    var i0 = 0,
        i1 = domain.length - 1,
        x0 = domain[i0],
        x1 = domain[i1],
        t;

    if (x1 < x0) {
      t = i0, i0 = i1, i1 = t;
      t = x0, x0 = x1, x1 = t;
    }

    domain[i0] = interval.floor(x0);
    domain[i1] = interval.ceil(x1);
    return domain;
  }

  function transformLog(x) {
    return Math.log(x);
  }

  function transformExp(x) {
    return Math.exp(x);
  }

  function transformLogn(x) {
    return -Math.log(-x);
  }

  function transformExpn(x) {
    return -Math.exp(-x);
  }

  function pow10(x) {
    return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
  }

  function powp(base) {
    return base === 10 ? pow10
        : base === Math.E ? Math.exp
        : function(x) { return Math.pow(base, x); };
  }

  function logp(base) {
    return base === Math.E ? Math.log
        : base === 10 && Math.log10
        || base === 2 && Math.log2
        || (base = Math.log(base), function(x) { return Math.log(x) / base; });
  }

  function reflect(f) {
    return function(x) {
      return -f(-x);
    };
  }

  function loggish(transform) {
    var scale = transform(transformLog, transformExp),
        domain = scale.domain,
        base = 10,
        logs,
        pows;

    function rescale() {
      logs = logp(base), pows = powp(base);
      if (domain()[0] < 0) {
        logs = reflect(logs), pows = reflect(pows);
        transform(transformLogn, transformExpn);
      } else {
        transform(transformLog, transformExp);
      }
      return scale;
    }

    scale.base = function(_) {
      return arguments.length ? (base = +_, rescale()) : base;
    };

    scale.domain = function(_) {
      return arguments.length ? (domain(_), rescale()) : domain();
    };

    scale.ticks = function(count) {
      var d = domain(),
          u = d[0],
          v = d[d.length - 1],
          r;

      if (r = v < u) i = u, u = v, v = i;

      var i = logs(u),
          j = logs(v),
          p,
          k,
          t,
          n = count == null ? 10 : +count,
          z = [];

      if (!(base % 1) && j - i < n) {
        i = Math.round(i) - 1, j = Math.round(j) + 1;
        if (u > 0) for (; i < j; ++i) {
          for (k = 1, p = pows(i); k < base; ++k) {
            t = p * k;
            if (t < u) continue;
            if (t > v) break;
            z.push(t);
          }
        } else for (; i < j; ++i) {
          for (k = base - 1, p = pows(i); k >= 1; --k) {
            t = p * k;
            if (t < u) continue;
            if (t > v) break;
            z.push(t);
          }
        }
      } else {
        z = ticks(i, j, Math.min(j - i, n)).map(pows);
      }

      return r ? z.reverse() : z;
    };

    scale.tickFormat = function(count, specifier) {
      if (specifier == null) specifier = base === 10 ? ".0e" : ",";
      if (typeof specifier !== "function") specifier = exports.format(specifier);
      if (count === Infinity) return specifier;
      if (count == null) count = 10;
      var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
      return function(d) {
        var i = d / pows(Math.round(logs(d)));
        if (i * base < base - 0.5) i *= base;
        return i <= k ? specifier(d) : "";
      };
    };

    scale.nice = function() {
      return domain(nice(domain(), {
        floor: function(x) { return pows(Math.floor(logs(x))); },
        ceil: function(x) { return pows(Math.ceil(logs(x))); }
      }));
    };

    return scale;
  }

  function log() {
    var scale = loggish(transformer()).domain([1, 10]);

    scale.copy = function() {
      return copy(scale, log()).base(scale.base());
    };

    initRange.apply(scale, arguments);

    return scale;
  }

  function transformSymlog(c) {
    return function(x) {
      return Math.sign(x) * Math.log1p(Math.abs(x / c));
    };
  }

  function transformSymexp(c) {
    return function(x) {
      return Math.sign(x) * Math.expm1(Math.abs(x)) * c;
    };
  }

  function symlogish(transform) {
    var c = 1, scale = transform(transformSymlog(c), transformSymexp(c));

    scale.constant = function(_) {
      return arguments.length ? transform(transformSymlog(c = +_), transformSymexp(c)) : c;
    };

    return linearish(scale);
  }

  function symlog() {
    var scale = symlogish(transformer());

    scale.copy = function() {
      return copy(scale, symlog()).constant(scale.constant());
    };

    return initRange.apply(scale, arguments);
  }

  function transformPow(exponent) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
    };
  }

  function transformSqrt(x) {
    return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x);
  }

  function transformSquare(x) {
    return x < 0 ? -x * x : x * x;
  }

  function powish(transform) {
    var scale = transform(identity$2, identity$2),
        exponent = 1;

    function rescale() {
      return exponent === 1 ? transform(identity$2, identity$2)
          : exponent === 0.5 ? transform(transformSqrt, transformSquare)
          : transform(transformPow(exponent), transformPow(1 / exponent));
    }

    scale.exponent = function(_) {
      return arguments.length ? (exponent = +_, rescale()) : exponent;
    };

    return linearish(scale);
  }

  function pow() {
    var scale = powish(transformer());

    scale.copy = function() {
      return copy(scale, pow()).exponent(scale.exponent());
    };

    initRange.apply(scale, arguments);

    return scale;
  }

  function sqrt() {
    return pow.apply(null, arguments).exponent(0.5);
  }

  function quantile() {
    var domain = [],
        range = [],
        thresholds = [],
        unknown;

    function rescale() {
      var i = 0, n = Math.max(1, range.length);
      thresholds = new Array(n - 1);
      while (++i < n) thresholds[i - 1] = threshold(domain, i / n);
      return scale;
    }

    function scale(x) {
      return isNaN(x = +x) ? unknown : range[bisectRight(thresholds, x)];
    }

    scale.invertExtent = function(y) {
      var i = range.indexOf(y);
      return i < 0 ? [NaN, NaN] : [
        i > 0 ? thresholds[i - 1] : domain[0],
        i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
      ];
    };

    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [];
      for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
      domain.sort(ascending$1);
      return rescale();
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    scale.quantiles = function() {
      return thresholds.slice();
    };

    scale.copy = function() {
      return quantile()
          .domain(domain)
          .range(range)
          .unknown(unknown);
    };

    return initRange.apply(scale, arguments);
  }

  function quantize$1() {
    var x0 = 0,
        x1 = 1,
        n = 1,
        domain = [0.5],
        range = [0, 1],
        unknown;

    function scale(x) {
      return x <= x ? range[bisectRight(domain, x, 0, n)] : unknown;
    }

    function rescale() {
      var i = -1;
      domain = new Array(n);
      while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
      return scale;
    }

    scale.domain = function(_) {
      return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
    };

    scale.range = function(_) {
      return arguments.length ? (n = (range = slice$1.call(_)).length - 1, rescale()) : range.slice();
    };

    scale.invertExtent = function(y) {
      var i = range.indexOf(y);
      return i < 0 ? [NaN, NaN]
          : i < 1 ? [x0, domain[0]]
          : i >= n ? [domain[n - 1], x1]
          : [domain[i - 1], domain[i]];
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : scale;
    };

    scale.thresholds = function() {
      return domain.slice();
    };

    scale.copy = function() {
      return quantize$1()
          .domain([x0, x1])
          .range(range)
          .unknown(unknown);
    };

    return initRange.apply(linearish(scale), arguments);
  }

  function threshold$1() {
    var domain = [0.5],
        range = [0, 1],
        unknown,
        n = 1;

    function scale(x) {
      return x <= x ? range[bisectRight(domain, x, 0, n)] : unknown;
    }

    scale.domain = function(_) {
      return arguments.length ? (domain = slice$1.call(_), n = Math.min(domain.length, range.length - 1), scale) : domain.slice();
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), n = Math.min(domain.length, range.length - 1), scale) : range.slice();
    };

    scale.invertExtent = function(y) {
      var i = range.indexOf(y);
      return [domain[i - 1], domain[i]];
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    scale.copy = function() {
      return threshold$1()
          .domain(domain)
          .range(range)
          .unknown(unknown);
    };

    return initRange.apply(scale, arguments);
  }

  var t0$1 = new Date,
      t1$1 = new Date;

  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
    }

    interval.floor = function(date) {
      return floori(date = new Date(+date)), date;
    };

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };

    interval.round = function(date) {
      var d0 = interval(date),
          d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [], previous;
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
      while (previous < start && start < stop);
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        if (date >= date) {
          if (step < 0) while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
          } else while (--step >= 0) {
            while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
          }
        }
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0$1.setTime(+start), t1$1.setTime(+end);
        floori(t0$1), floori(t1$1);
        return Math.floor(count(t0$1, t1$1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  }

  var millisecond = newInterval(function() {
    // noop
  }, function(date, step) {
    date.setTime(+date + step);
  }, function(start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function(k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return newInterval(function(date) {
      date.setTime(Math.floor(date / k) * k);
    }, function(date, step) {
      date.setTime(+date + step * k);
    }, function(start, end) {
      return (end - start) / k;
    });
  };

  var durationSecond = 1e3;
  var durationMinute = 6e4;
  var durationHour = 36e5;
  var durationDay = 864e5;
  var durationWeek = 6048e5;

  var second = newInterval(function(date) {
    date.setTime(date - date.getMilliseconds());
  }, function(date, step) {
    date.setTime(+date + step * durationSecond);
  }, function(start, end) {
    return (end - start) / durationSecond;
  }, function(date) {
    return date.getUTCSeconds();
  });

  var minute = newInterval(function(date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
  }, function(date, step) {
    date.setTime(+date + step * durationMinute);
  }, function(start, end) {
    return (end - start) / durationMinute;
  }, function(date) {
    return date.getMinutes();
  });

  var hour = newInterval(function(date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
  }, function(date, step) {
    date.setTime(+date + step * durationHour);
  }, function(start, end) {
    return (end - start) / durationHour;
  }, function(date) {
    return date.getHours();
  });

  var day = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
  }, function(date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function(date) {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  var month = newInterval(function(date) {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setMonth(date.getMonth() + step);
  }, function(start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function(date) {
    return date.getMonth();
  });

  var year = newInterval(function(date) {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  // An optimized implementation for this simple case.
  year.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };

  var utcMinute = newInterval(function(date) {
    date.setUTCSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * durationMinute);
  }, function(start, end) {
    return (end - start) / durationMinute;
  }, function(date) {
    return date.getUTCMinutes();
  });

  var utcHour = newInterval(function(date) {
    date.setUTCMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * durationHour);
  }, function(start, end) {
    return (end - start) / durationHour;
  }, function(date) {
    return date.getUTCHours();
  });

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / durationDay;
  }, function(date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / durationWeek;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  var utcMonth = newInterval(function(date) {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, function(start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, function(date) {
    return date.getUTCMonth();
  });

  var utcYear = newInterval(function(date) {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  // An optimized implementation for this simple case.
  utcYear.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };

  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }

  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }

  function newDate(y, m, d) {
    return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
  }

  function formatLocale$1(locale) {
    var locale_dateTime = locale.dateTime,
        locale_date = locale.date,
        locale_time = locale.time,
        locale_periods = locale.periods,
        locale_weekdays = locale.days,
        locale_shortWeekdays = locale.shortDays,
        locale_months = locale.months,
        locale_shortMonths = locale.shortMonths;

    var periodRe = formatRe(locale_periods),
        periodLookup = formatLookup(locale_periods),
        weekdayRe = formatRe(locale_weekdays),
        weekdayLookup = formatLookup(locale_weekdays),
        shortWeekdayRe = formatRe(locale_shortWeekdays),
        shortWeekdayLookup = formatLookup(locale_shortWeekdays),
        monthRe = formatRe(locale_months),
        monthLookup = formatLookup(locale_months),
        shortMonthRe = formatRe(locale_shortMonths),
        shortMonthLookup = formatLookup(locale_shortMonths);

    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "f": formatMicroseconds,
      "g": formatYearISO,
      "G": formatFullYearISO,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "q": formatQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatSeconds,
      "u": formatWeekdayNumberMonday,
      "U": formatWeekNumberSunday,
      "V": formatWeekNumberISO,
      "w": formatWeekdayNumberSunday,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };

    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "f": formatUTCMicroseconds,
      "g": formatUTCYearISO,
      "G": formatUTCFullYearISO,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "q": formatUTCQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatUTCSeconds,
      "u": formatUTCWeekdayNumberMonday,
      "U": formatUTCWeekNumberSunday,
      "V": formatUTCWeekNumberISO,
      "w": formatUTCWeekdayNumberSunday,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };

    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "f": parseMicroseconds,
      "g": parseYear,
      "G": parseFullYear,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "q": parseQuarter,
      "Q": parseUnixTimestamp,
      "s": parseUnixTimestampSeconds,
      "S": parseSeconds,
      "u": parseWeekdayNumberMonday,
      "U": parseWeekNumberSunday,
      "V": parseWeekNumberISO,
      "w": parseWeekdayNumberSunday,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };

    // These recursive directive definitions must be deferred.
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);

    function newFormat(specifier, formats) {
      return function(date) {
        var string = [],
            i = -1,
            j = 0,
            n = specifier.length,
            c,
            pad,
            format;

        if (!(date instanceof Date)) date = new Date(+date);

        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
            else pad = c === "e" ? " " : "0";
            if (format = formats[c]) c = format(date, pad);
            string.push(c);
            j = i + 1;
          }
        }

        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }

    function newParse(specifier, Z) {
      return function(string) {
        var d = newDate(1900, undefined, 1),
            i = parseSpecifier(d, specifier, string += "", 0),
            week, day$1;
        if (i != string.length) return null;

        // If a UNIX timestamp is specified, return it.
        if ("Q" in d) return new Date(d.Q);
        if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

        // If this is utcParse, never use the local timezone.
        if (Z && !("Z" in d)) d.Z = 0;

        // The am-pm flag is 0 for AM, and 1 for PM.
        if ("p" in d) d.H = d.H % 12 + d.p * 12;

        // If the month was not specified, inherit from the quarter.
        if (d.m === undefined) d.m = "q" in d ? d.q : 0;

        // Convert day-of-week and week-of-year to day-of-year.
        if ("V" in d) {
          if (d.V < 1 || d.V > 53) return null;
          if (!("w" in d)) d.w = 1;
          if ("Z" in d) {
            week = utcDate(newDate(d.y, 0, 1)), day$1 = week.getUTCDay();
            week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay.offset(week, (d.V - 1) * 7);
            d.y = week.getUTCFullYear();
            d.m = week.getUTCMonth();
            d.d = week.getUTCDate() + (d.w + 6) % 7;
          } else {
            week = localDate(newDate(d.y, 0, 1)), day$1 = week.getDay();
            week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
            week = day.offset(week, (d.V - 1) * 7);
            d.y = week.getFullYear();
            d.m = week.getMonth();
            d.d = week.getDate() + (d.w + 6) % 7;
          }
        } else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
          day$1 = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
        }

        // If a time zone is specified, all fields are interpreted as UTC and then
        // offset according to the specified time zone.
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }

        // Otherwise, all fields are in local time.
        return localDate(d);
      };
    }

    function parseSpecifier(d, specifier, string, j) {
      var i = 0,
          n = specifier.length,
          m = string.length,
          c,
          parse;

      while (i < n) {
        if (j >= m) return -1;
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }

      return j;
    }

    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }

    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }

    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }

    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }

    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }

    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }

    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }

    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }

    function formatQuarter(d) {
      return 1 + ~~(d.getMonth() / 3);
    }

    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }

    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }

    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }

    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }

    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }

    function formatUTCQuarter(d) {
      return 1 + ~~(d.getUTCMonth() / 3);
    }

    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.toString = function() { return specifier; };
        return f;
      },
      parse: function(specifier) {
        var p = newParse(specifier += "", false);
        p.toString = function() { return specifier; };
        return p;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.toString = function() { return specifier; };
        return f;
      },
      utcParse: function(specifier) {
        var p = newParse(specifier += "", true);
        p.toString = function() { return specifier; };
        return p;
      }
    };
  }

  var pads = {"-": "", "_": " ", "0": "0"},
      numberRe = /^\s*\d+/, // note: ignores next directive
      percentRe = /^%/,
      requoteRe = /[\\^$*+?|[\]().{}]/g;

  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "",
        string = (sign ? -value : value) + "",
        length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }

  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }

  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }

  function formatLookup(names) {
    var map = {}, i = -1, n = names.length;
    while (++i < n) map[names[i].toLowerCase()] = i;
    return map;
  }

  function parseWeekdayNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }

  function parseWeekdayNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.u = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberISO(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.V = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }

  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }

  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
  }

  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }

  function parseQuarter(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
  }

  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }

  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }

  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }

  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }

  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }

  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }

  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }

  function parseMicroseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 6));
    return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
  }

  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }

  function parseUnixTimestamp(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.Q = +n[0], i + n[0].length) : -1;
  }

  function parseUnixTimestampSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.s = +n[0], i + n[0].length) : -1;
  }

  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }

  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }

  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }

  function formatDayOfYear(d, p) {
    return pad(1 + day.count(year(d), d), p, 3);
  }

  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }

  function formatMicroseconds(d, p) {
    return formatMilliseconds(d, p) + "000";
  }

  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }

  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }

  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }

  function formatWeekdayNumberMonday(d) {
    var day = d.getDay();
    return day === 0 ? 7 : day;
  }

  function formatWeekNumberSunday(d, p) {
    return pad(sunday.count(year(d) - 1, d), p, 2);
  }

  function dISO(d) {
    var day = d.getDay();
    return (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
  }

  function formatWeekNumberISO(d, p) {
    d = dISO(d);
    return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
  }

  function formatWeekdayNumberSunday(d) {
    return d.getDay();
  }

  function formatWeekNumberMonday(d, p) {
    return pad(monday.count(year(d) - 1, d), p, 2);
  }

  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatYearISO(d, p) {
    d = dISO(d);
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatFullYearISO(d, p) {
    var day = d.getDay();
    d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+"))
        + pad(z / 60 | 0, "0", 2)
        + pad(z % 60, "0", 2);
  }

  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }

  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }

  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }

  function formatUTCDayOfYear(d, p) {
    return pad(1 + utcDay.count(utcYear(d), d), p, 3);
  }

  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }

  function formatUTCMicroseconds(d, p) {
    return formatUTCMilliseconds(d, p) + "000";
  }

  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }

  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }

  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }

  function formatUTCWeekdayNumberMonday(d) {
    var dow = d.getUTCDay();
    return dow === 0 ? 7 : dow;
  }

  function formatUTCWeekNumberSunday(d, p) {
    return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
  }

  function UTCdISO(d) {
    var day = d.getUTCDay();
    return (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
  }

  function formatUTCWeekNumberISO(d, p) {
    d = UTCdISO(d);
    return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
  }

  function formatUTCWeekdayNumberSunday(d) {
    return d.getUTCDay();
  }

  function formatUTCWeekNumberMonday(d, p) {
    return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
  }

  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCYearISO(d, p) {
    d = UTCdISO(d);
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCFullYearISO(d, p) {
    var day = d.getUTCDay();
    d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCZone() {
    return "+0000";
  }

  function formatLiteralPercent() {
    return "%";
  }

  function formatUnixTimestamp(d) {
    return +d;
  }

  function formatUnixTimestampSeconds(d) {
    return Math.floor(+d / 1000);
  }

  var locale$1;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;

  defaultLocale$1({
    dateTime: "%x, %X",
    date: "%-m/%-d/%Y",
    time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  function defaultLocale$1(definition) {
    locale$1 = formatLocale$1(definition);
    timeFormat = locale$1.format;
    timeParse = locale$1.parse;
    utcFormat = locale$1.utcFormat;
    utcParse = locale$1.utcParse;
    return locale$1;
  }

  var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

  function formatIsoNative(date) {
    return date.toISOString();
  }

  var formatIso = Date.prototype.toISOString
      ? formatIsoNative
      : utcFormat(isoSpecifier);

  function parseIsoNative(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  }

  var parseIso = +new Date("2000-01-01T00:00:00.000Z")
      ? parseIsoNative
      : utcParse(isoSpecifier);

  var durationSecond$1 = 1000,
      durationMinute$1 = durationSecond$1 * 60,
      durationHour$1 = durationMinute$1 * 60,
      durationDay$1 = durationHour$1 * 24,
      durationWeek$1 = durationDay$1 * 7,
      durationMonth = durationDay$1 * 30,
      durationYear = durationDay$1 * 365;

  function date$1(t) {
    return new Date(t);
  }

  function number$2(t) {
    return t instanceof Date ? +t : +new Date(+t);
  }

  function calendar(year, month, week, day, hour, minute, second, millisecond, format) {
    var scale = continuous(identity$2, identity$2),
        invert = scale.invert,
        domain = scale.domain;

    var formatMillisecond = format(".%L"),
        formatSecond = format(":%S"),
        formatMinute = format("%I:%M"),
        formatHour = format("%I %p"),
        formatDay = format("%a %d"),
        formatWeek = format("%b %d"),
        formatMonth = format("%B"),
        formatYear = format("%Y");

    var tickIntervals = [
      [second,  1,      durationSecond$1],
      [second,  5,  5 * durationSecond$1],
      [second, 15, 15 * durationSecond$1],
      [second, 30, 30 * durationSecond$1],
      [minute,  1,      durationMinute$1],
      [minute,  5,  5 * durationMinute$1],
      [minute, 15, 15 * durationMinute$1],
      [minute, 30, 30 * durationMinute$1],
      [  hour,  1,      durationHour$1  ],
      [  hour,  3,  3 * durationHour$1  ],
      [  hour,  6,  6 * durationHour$1  ],
      [  hour, 12, 12 * durationHour$1  ],
      [   day,  1,      durationDay$1   ],
      [   day,  2,  2 * durationDay$1   ],
      [  week,  1,      durationWeek$1  ],
      [ month,  1,      durationMonth ],
      [ month,  3,  3 * durationMonth ],
      [  year,  1,      durationYear  ]
    ];

    function tickFormat(date) {
      return (second(date) < date ? formatMillisecond
          : minute(date) < date ? formatSecond
          : hour(date) < date ? formatMinute
          : day(date) < date ? formatHour
          : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
          : year(date) < date ? formatMonth
          : formatYear)(date);
    }

    function tickInterval(interval, start, stop, step) {
      if (interval == null) interval = 10;

      // If a desired tick count is specified, pick a reasonable tick interval
      // based on the extent of the domain and a rough estimate of tick size.
      // Otherwise, assume interval is already a time interval and use it.
      if (typeof interval === "number") {
        var target = Math.abs(stop - start) / interval,
            i = bisector(function(i) { return i[2]; }).right(tickIntervals, target);
        if (i === tickIntervals.length) {
          step = tickStep(start / durationYear, stop / durationYear, interval);
          interval = year;
        } else if (i) {
          i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
          step = i[1];
          interval = i[0];
        } else {
          step = Math.max(tickStep(start, stop, interval), 1);
          interval = millisecond;
        }
      }

      return step == null ? interval : interval.every(step);
    }

    scale.invert = function(y) {
      return new Date(invert(y));
    };

    scale.domain = function(_) {
      return arguments.length ? domain(map$2.call(_, number$2)) : domain().map(date$1);
    };

    scale.ticks = function(interval, step) {
      var d = domain(),
          t0 = d[0],
          t1 = d[d.length - 1],
          r = t1 < t0,
          t;
      if (r) t = t0, t0 = t1, t1 = t;
      t = tickInterval(interval, t0, t1, step);
      t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
      return r ? t.reverse() : t;
    };

    scale.tickFormat = function(count, specifier) {
      return specifier == null ? tickFormat : format(specifier);
    };

    scale.nice = function(interval, step) {
      var d = domain();
      return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
          ? domain(nice(d, interval))
          : scale;
    };

    scale.copy = function() {
      return copy(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format));
    };

    return scale;
  }

  function time() {
    return initRange.apply(calendar(year, month, sunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]), arguments);
  }

  function utcTime() {
    return initRange.apply(calendar(utcYear, utcMonth, utcSunday, utcDay, utcHour, utcMinute, second, millisecond, utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]), arguments);
  }

  function transformer$1() {
    var x0 = 0,
        x1 = 1,
        t0,
        t1,
        k10,
        transform,
        interpolator = identity$2,
        clamp = false,
        unknown;

    function scale(x) {
      return isNaN(x = +x) ? unknown : interpolator(k10 === 0 ? 0.5 : (x = (transform(x) - t0) * k10, clamp ? Math.max(0, Math.min(1, x)) : x));
    }

    scale.domain = function(_) {
      return arguments.length ? (t0 = transform(x0 = +_[0]), t1 = transform(x1 = +_[1]), k10 = t0 === t1 ? 0 : 1 / (t1 - t0), scale) : [x0, x1];
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = !!_, scale) : clamp;
    };

    scale.interpolator = function(_) {
      return arguments.length ? (interpolator = _, scale) : interpolator;
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    return function(t) {
      transform = t, t0 = t(x0), t1 = t(x1), k10 = t0 === t1 ? 0 : 1 / (t1 - t0);
      return scale;
    };
  }

  function copy$1(source, target) {
    return target
        .domain(source.domain())
        .interpolator(source.interpolator())
        .clamp(source.clamp())
        .unknown(source.unknown());
  }

  function sequential() {
    var scale = linearish(transformer$1()(identity$2));

    scale.copy = function() {
      return copy$1(scale, sequential());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function sequentialLog() {
    var scale = loggish(transformer$1()).domain([1, 10]);

    scale.copy = function() {
      return copy$1(scale, sequentialLog()).base(scale.base());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function sequentialSymlog() {
    var scale = symlogish(transformer$1());

    scale.copy = function() {
      return copy$1(scale, sequentialSymlog()).constant(scale.constant());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function sequentialPow() {
    var scale = powish(transformer$1());

    scale.copy = function() {
      return copy$1(scale, sequentialPow()).exponent(scale.exponent());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function sequentialSqrt() {
    return sequentialPow.apply(null, arguments).exponent(0.5);
  }

  function sequentialQuantile() {
    var domain = [],
        interpolator = identity$2;

    function scale(x) {
      if (!isNaN(x = +x)) return interpolator((bisectRight(domain, x) - 1) / (domain.length - 1));
    }

    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [];
      for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
      domain.sort(ascending$1);
      return scale;
    };

    scale.interpolator = function(_) {
      return arguments.length ? (interpolator = _, scale) : interpolator;
    };

    scale.copy = function() {
      return sequentialQuantile(interpolator).domain(domain);
    };

    return initInterpolator.apply(scale, arguments);
  }

  function transformer$2() {
    var x0 = 0,
        x1 = 0.5,
        x2 = 1,
        t0,
        t1,
        t2,
        k10,
        k21,
        interpolator = identity$2,
        transform,
        clamp = false,
        unknown;

    function scale(x) {
      return isNaN(x = +x) ? unknown : (x = 0.5 + ((x = +transform(x)) - t1) * (x < t1 ? k10 : k21), interpolator(clamp ? Math.max(0, Math.min(1, x)) : x));
    }

    scale.domain = function(_) {
      return arguments.length ? (t0 = transform(x0 = +_[0]), t1 = transform(x1 = +_[1]), t2 = transform(x2 = +_[2]), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1), scale) : [x0, x1, x2];
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = !!_, scale) : clamp;
    };

    scale.interpolator = function(_) {
      return arguments.length ? (interpolator = _, scale) : interpolator;
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    return function(t) {
      transform = t, t0 = t(x0), t1 = t(x1), t2 = t(x2), k10 = t0 === t1 ? 0 : 0.5 / (t1 - t0), k21 = t1 === t2 ? 0 : 0.5 / (t2 - t1);
      return scale;
    };
  }

  function diverging() {
    var scale = linearish(transformer$2()(identity$2));

    scale.copy = function() {
      return copy$1(scale, diverging());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function divergingLog() {
    var scale = loggish(transformer$2()).domain([0.1, 1, 10]);

    scale.copy = function() {
      return copy$1(scale, divergingLog()).base(scale.base());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function divergingSymlog() {
    var scale = symlogish(transformer$2());

    scale.copy = function() {
      return copy$1(scale, divergingSymlog()).constant(scale.constant());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function divergingPow() {
    var scale = powish(transformer$2());

    scale.copy = function() {
      return copy$1(scale, divergingPow()).exponent(scale.exponent());
    };

    return initInterpolator.apply(scale, arguments);
  }

  function divergingSqrt() {
    return divergingPow.apply(null, arguments).exponent(0.5);
  }

  var pi = Math.PI,
      tau = 2 * pi,
      epsilon = 1e-6,
      tauEpsilon = tau - epsilon;

  function Path() {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null; // end of current subpath
    this._ = "";
  }

  function path() {
    return new Path;
  }

  Path.prototype = path.prototype = {
    constructor: Path,
    moveTo: function(x, y) {
      this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
    },
    closePath: function() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._ += "Z";
      }
    },
    lineTo: function(x, y) {
      this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    quadraticCurveTo: function(x1, y1, x, y) {
      this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    bezierCurveTo: function(x1, y1, x2, y2, x, y) {
      this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
    },
    arcTo: function(x1, y1, x2, y2, r) {
      x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
      var x0 = this._x1,
          y0 = this._y1,
          x21 = x2 - x1,
          y21 = y2 - y1,
          x01 = x0 - x1,
          y01 = y0 - y1,
          l01_2 = x01 * x01 + y01 * y01;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: " + r);

      // Is this path empty? Move to (x1,y1).
      if (this._x1 === null) {
        this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
      }

      // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
      else if (!(l01_2 > epsilon));

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
        this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
      }

      // Otherwise, draw an arc!
      else {
        var x20 = x2 - x0,
            y20 = y2 - y0,
            l21_2 = x21 * x21 + y21 * y21,
            l20_2 = x20 * x20 + y20 * y20,
            l21 = Math.sqrt(l21_2),
            l01 = Math.sqrt(l01_2),
            l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
            t01 = l / l01,
            t21 = l / l21;

        // If the start tangent is not coincident with (x0,y0), line to.
        if (Math.abs(t01 - 1) > epsilon) {
          this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
        }

        this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
      }
    },
    arc: function(x, y, r, a0, a1, ccw) {
      x = +x, y = +y, r = +r, ccw = !!ccw;
      var dx = r * Math.cos(a0),
          dy = r * Math.sin(a0),
          x0 = x + dx,
          y0 = y + dy,
          cw = 1 ^ ccw,
          da = ccw ? a0 - a1 : a1 - a0;

      // Is the radius negative? Error.
      if (r < 0) throw new Error("negative radius: " + r);

      // Is this path empty? Move to (x0,y0).
      if (this._x1 === null) {
        this._ += "M" + x0 + "," + y0;
      }

      // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
      else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._ += "L" + x0 + "," + y0;
      }

      // Is this arc empty? We’re done.
      if (!r) return;

      // Does the angle go the wrong way? Flip the direction.
      if (da < 0) da = da % tau + tau;

      // Is this a complete circle? Draw two arcs to complete the circle.
      if (da > tauEpsilon) {
        this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
      }

      // Is this arc non-empty? Draw an arc!
      else if (da > epsilon) {
        this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
    },
    rect: function(x, y, w, h) {
      this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
    },
    toString: function() {
      return this._;
    }
  };

  function constant$4(x) {
    return function constant() {
      return x;
    };
  }

  var abs = Math.abs;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var max$1 = Math.max;
  var min$1 = Math.min;
  var sin = Math.sin;
  var sqrt$1 = Math.sqrt;

  var epsilon$1 = 1e-12;
  var pi$1 = Math.PI;
  var halfPi = pi$1 / 2;
  var tau$1 = 2 * pi$1;

  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
  }

  function asin(x) {
    return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
  }

  function arcInnerRadius(d) {
    return d.innerRadius;
  }

  function arcOuterRadius(d) {
    return d.outerRadius;
  }

  function arcStartAngle(d) {
    return d.startAngle;
  }

  function arcEndAngle(d) {
    return d.endAngle;
  }

  function arcPadAngle(d) {
    return d && d.padAngle; // Note: optional!
  }

  function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
    var x10 = x1 - x0, y10 = y1 - y0,
        x32 = x3 - x2, y32 = y3 - y2,
        t = y32 * x10 - x32 * y10;
    if (t * t < epsilon$1) return;
    t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
    return [x0 + t * x10, y0 + t * y10];
  }

  // Compute perpendicular offset line of length rc.
  // http://mathworld.wolfram.com/Circle-LineIntersection.html
  function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
    var x01 = x0 - x1,
        y01 = y0 - y1,
        lo = (cw ? rc : -rc) / sqrt$1(x01 * x01 + y01 * y01),
        ox = lo * y01,
        oy = -lo * x01,
        x11 = x0 + ox,
        y11 = y0 + oy,
        x10 = x1 + ox,
        y10 = y1 + oy,
        x00 = (x11 + x10) / 2,
        y00 = (y11 + y10) / 2,
        dx = x10 - x11,
        dy = y10 - y11,
        d2 = dx * dx + dy * dy,
        r = r1 - rc,
        D = x11 * y10 - x10 * y11,
        d = (dy < 0 ? -1 : 1) * sqrt$1(max$1(0, r * r * d2 - D * D)),
        cx0 = (D * dy - dx * d) / d2,
        cy0 = (-D * dx - dy * d) / d2,
        cx1 = (D * dy + dx * d) / d2,
        cy1 = (-D * dx + dy * d) / d2,
        dx0 = cx0 - x00,
        dy0 = cy0 - y00,
        dx1 = cx1 - x00,
        dy1 = cy1 - y00;

    // Pick the closer of the two intersection points.
    // TODO Is there a faster way to determine which intersection to use?
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

    return {
      cx: cx0,
      cy: cy0,
      x01: -ox,
      y01: -oy,
      x11: cx0 * (r1 / r - 1),
      y11: cy0 * (r1 / r - 1)
    };
  }

  function arc() {
    var innerRadius = arcInnerRadius,
        outerRadius = arcOuterRadius,
        cornerRadius = constant$4(0),
        padRadius = null,
        startAngle = arcStartAngle,
        endAngle = arcEndAngle,
        padAngle = arcPadAngle,
        context = null;

    function arc() {
      var buffer,
          r,
          r0 = +innerRadius.apply(this, arguments),
          r1 = +outerRadius.apply(this, arguments),
          a0 = startAngle.apply(this, arguments) - halfPi,
          a1 = endAngle.apply(this, arguments) - halfPi,
          da = abs(a1 - a0),
          cw = a1 > a0;

      if (!context) context = buffer = path();

      // Ensure that the outer radius is always larger than the inner radius.
      if (r1 < r0) r = r1, r1 = r0, r0 = r;

      // Is it a point?
      if (!(r1 > epsilon$1)) context.moveTo(0, 0);

      // Or is it a circle or annulus?
      else if (da > tau$1 - epsilon$1) {
        context.moveTo(r1 * cos(a0), r1 * sin(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > epsilon$1) {
          context.moveTo(r0 * cos(a1), r0 * sin(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      }

      // Or is it a circular or annular sector?
      else {
        var a01 = a0,
            a11 = a1,
            a00 = a0,
            a10 = a1,
            da0 = da,
            da1 = da,
            ap = padAngle.apply(this, arguments) / 2,
            rp = (ap > epsilon$1) && (padRadius ? +padRadius.apply(this, arguments) : sqrt$1(r0 * r0 + r1 * r1)),
            rc = min$1(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
            rc0 = rc,
            rc1 = rc,
            t0,
            t1;

        // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
        if (rp > epsilon$1) {
          var p0 = asin(rp / r0 * sin(ap)),
              p1 = asin(rp / r1 * sin(ap));
          if ((da0 -= p0 * 2) > epsilon$1) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
          else da0 = 0, a00 = a10 = (a0 + a1) / 2;
          if ((da1 -= p1 * 2) > epsilon$1) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
          else da1 = 0, a01 = a11 = (a0 + a1) / 2;
        }

        var x01 = r1 * cos(a01),
            y01 = r1 * sin(a01),
            x10 = r0 * cos(a10),
            y10 = r0 * sin(a10);

        // Apply rounded corners?
        if (rc > epsilon$1) {
          var x11 = r1 * cos(a11),
              y11 = r1 * sin(a11),
              x00 = r0 * cos(a00),
              y00 = r0 * sin(a00),
              oc;

          // Restrict the corner radius according to the sector angle.
          if (da < pi$1 && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
            var ax = x01 - oc[0],
                ay = y01 - oc[1],
                bx = x11 - oc[0],
                by = y11 - oc[1],
                kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt$1(ax * ax + ay * ay) * sqrt$1(bx * bx + by * by))) / 2),
                lc = sqrt$1(oc[0] * oc[0] + oc[1] * oc[1]);
            rc0 = min$1(rc, (r0 - lc) / (kc - 1));
            rc1 = min$1(rc, (r1 - lc) / (kc + 1));
          }
        }

        // Is the sector collapsed to a line?
        if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

        // Does the sector’s outer ring have rounded corners?
        else if (rc1 > epsilon$1) {
          t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
          t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

          context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

          // Have the corners merged?
          if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

          // Otherwise, draw the two corners and the ring.
          else {
            context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
            context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
          }
        }

        // Or is the outer ring just a circular arc?
        else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

        // Is there no inner ring, and it’s a circular sector?
        // Or perhaps it’s an annular sector collapsed due to padding?
        if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

        // Does the sector’s inner ring (or point) have rounded corners?
        else if (rc0 > epsilon$1) {
          t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
          t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

          context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

          // Have the corners merged?
          if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

          // Otherwise, draw the two corners and the ring.
          else {
            context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
            context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
          }
        }

        // Or is the inner ring just a circular arc?
        else context.arc(0, 0, r0, a10, a00, cw);
      }

      context.closePath();

      if (buffer) return context = null, buffer + "" || null;
    }

    arc.centroid = function() {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
          a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$1 / 2;
      return [cos(a) * r, sin(a) * r];
    };

    arc.innerRadius = function(_) {
      return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : innerRadius;
    };

    arc.outerRadius = function(_) {
      return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : outerRadius;
    };

    arc.cornerRadius = function(_) {
      return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$4(+_), arc) : cornerRadius;
    };

    arc.padRadius = function(_) {
      return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), arc) : padRadius;
    };

    arc.startAngle = function(_) {
      return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : startAngle;
    };

    arc.endAngle = function(_) {
      return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : endAngle;
    };

    arc.padAngle = function(_) {
      return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$4(+_), arc) : padAngle;
    };

    arc.context = function(_) {
      return arguments.length ? ((context = _ == null ? null : _), arc) : context;
    };

    return arc;
  }

  function Linear(context) {
    this._context = context;
  }

  Linear.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; // proceed
        default: this._context.lineTo(x, y); break;
      }
    }
  };

  function curveLinear(context) {
    return new Linear(context);
  }

  function x(p) {
    return p[0];
  }

  function y(p) {
    return p[1];
  }

  function line() {
    var x$1 = x,
        y$1 = y,
        defined = constant$4(true),
        context = null,
        curve = curveLinear,
        output = null;

    function line(data) {
      var i,
          n = data.length,
          d,
          defined0 = false,
          buffer;

      if (context == null) output = curve(buffer = path());

      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) output.lineStart();
          else output.lineEnd();
        }
        if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
      }

      if (buffer) return output = null, buffer + "" || null;
    }

    line.x = function(_) {
      return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$4(+_), line) : x$1;
    };

    line.y = function(_) {
      return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$4(+_), line) : y$1;
    };

    line.defined = function(_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : constant$4(!!_), line) : defined;
    };

    line.curve = function(_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
    };

    line.context = function(_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
    };

    return line;
  }

  function area() {
    var x0 = x,
        x1 = null,
        y0 = constant$4(0),
        y1 = y,
        defined = constant$4(true),
        context = null,
        curve = curveLinear,
        output = null;

    function area(data) {
      var i,
          j,
          k,
          n = data.length,
          d,
          defined0 = false,
          buffer,
          x0z = new Array(n),
          y0z = new Array(n);

      if (context == null) output = curve(buffer = path());

      for (i = 0; i <= n; ++i) {
        if (!(i < n && defined(d = data[i], i, data)) === defined0) {
          if (defined0 = !defined0) {
            j = i;
            output.areaStart();
            output.lineStart();
          } else {
            output.lineEnd();
            output.lineStart();
            for (k = i - 1; k >= j; --k) {
              output.point(x0z[k], y0z[k]);
            }
            output.lineEnd();
            output.areaEnd();
          }
        }
        if (defined0) {
          x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
          output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
        }
      }

      if (buffer) return output = null, buffer + "" || null;
    }

    function arealine() {
      return line().defined(defined).curve(curve).context(context);
    }

    area.x = function(_) {
      return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$4(+_), x1 = null, area) : x0;
    };

    area.x0 = function(_) {
      return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$4(+_), area) : x0;
    };

    area.x1 = function(_) {
      return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), area) : x1;
    };

    area.y = function(_) {
      return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$4(+_), y1 = null, area) : y0;
    };

    area.y0 = function(_) {
      return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$4(+_), area) : y0;
    };

    area.y1 = function(_) {
      return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$4(+_), area) : y1;
    };

    area.lineX0 =
    area.lineY0 = function() {
      return arealine().x(x0).y(y0);
    };

    area.lineY1 = function() {
      return arealine().x(x0).y(y1);
    };

    area.lineX1 = function() {
      return arealine().x(x1).y(y0);
    };

    area.defined = function(_) {
      return arguments.length ? (defined = typeof _ === "function" ? _ : constant$4(!!_), area) : defined;
    };

    area.curve = function(_) {
      return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
    };

    area.context = function(_) {
      return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
    };

    return area;
  }

  function descending$1(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  function identity$5(d) {
    return d;
  }

  function pie() {
    var value = identity$5,
        sortValues = descending$1,
        sort = null,
        startAngle = constant$4(0),
        endAngle = constant$4(tau$1),
        padAngle = constant$4(0);

    function pie(data) {
      var i,
          n = data.length,
          j,
          k,
          sum = 0,
          index = new Array(n),
          arcs = new Array(n),
          a0 = +startAngle.apply(this, arguments),
          da = Math.min(tau$1, Math.max(-tau$1, endAngle.apply(this, arguments) - a0)),
          a1,
          p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
          pa = p * (da < 0 ? -1 : 1),
          v;

      for (i = 0; i < n; ++i) {
        if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
          sum += v;
        }
      }

      // Optionally sort the arcs by previously-computed values or by data.
      if (sortValues != null) index.sort(function(i, j) { return sortValues(arcs[i], arcs[j]); });
      else if (sort != null) index.sort(function(i, j) { return sort(data[i], data[j]); });

      // Compute the arcs! They are stored in the original data's order.
      for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
        j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
          data: data[j],
          index: i,
          value: v,
          startAngle: a0,
          endAngle: a1,
          padAngle: p
        };
      }

      return arcs;
    }

    pie.value = function(_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : constant$4(+_), pie) : value;
    };

    pie.sortValues = function(_) {
      return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
    };

    pie.sort = function(_) {
      return arguments.length ? (sort = _, sortValues = null, pie) : sort;
    };

    pie.startAngle = function(_) {
      return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$4(+_), pie) : startAngle;
    };

    pie.endAngle = function(_) {
      return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$4(+_), pie) : endAngle;
    };

    pie.padAngle = function(_) {
      return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$4(+_), pie) : padAngle;
    };

    return pie;
  }

  var curveRadialLinear = curveRadial(curveLinear);

  function Radial(curve) {
    this._curve = curve;
  }

  Radial.prototype = {
    areaStart: function() {
      this._curve.areaStart();
    },
    areaEnd: function() {
      this._curve.areaEnd();
    },
    lineStart: function() {
      this._curve.lineStart();
    },
    lineEnd: function() {
      this._curve.lineEnd();
    },
    point: function(a, r) {
      this._curve.point(r * Math.sin(a), r * -Math.cos(a));
    }
  };

  function curveRadial(curve) {

    function radial(context) {
      return new Radial(curve(context));
    }

    radial._curve = curve;

    return radial;
  }

  function lineRadial(l) {
    var c = l.curve;

    l.angle = l.x, delete l.x;
    l.radius = l.y, delete l.y;

    l.curve = function(_) {
      return arguments.length ? c(curveRadial(_)) : c()._curve;
    };

    return l;
  }

  function lineRadial$1() {
    return lineRadial(line().curve(curveRadialLinear));
  }

  function areaRadial() {
    var a = area().curve(curveRadialLinear),
        c = a.curve,
        x0 = a.lineX0,
        x1 = a.lineX1,
        y0 = a.lineY0,
        y1 = a.lineY1;

    a.angle = a.x, delete a.x;
    a.startAngle = a.x0, delete a.x0;
    a.endAngle = a.x1, delete a.x1;
    a.radius = a.y, delete a.y;
    a.innerRadius = a.y0, delete a.y0;
    a.outerRadius = a.y1, delete a.y1;
    a.lineStartAngle = function() { return lineRadial(x0()); }, delete a.lineX0;
    a.lineEndAngle = function() { return lineRadial(x1()); }, delete a.lineX1;
    a.lineInnerRadius = function() { return lineRadial(y0()); }, delete a.lineY0;
    a.lineOuterRadius = function() { return lineRadial(y1()); }, delete a.lineY1;

    a.curve = function(_) {
      return arguments.length ? c(curveRadial(_)) : c()._curve;
    };

    return a;
  }

  function pointRadial(x, y) {
    return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
  }

  var slice$2 = Array.prototype.slice;

  function linkSource(d) {
    return d.source;
  }

  function linkTarget(d) {
    return d.target;
  }

  function link(curve) {
    var source = linkSource,
        target = linkTarget,
        x$1 = x,
        y$1 = y,
        context = null;

    function link() {
      var buffer, argv = slice$2.call(arguments), s = source.apply(this, argv), t = target.apply(this, argv);
      if (!context) context = buffer = path();
      curve(context, +x$1.apply(this, (argv[0] = s, argv)), +y$1.apply(this, argv), +x$1.apply(this, (argv[0] = t, argv)), +y$1.apply(this, argv));
      if (buffer) return context = null, buffer + "" || null;
    }

    link.source = function(_) {
      return arguments.length ? (source = _, link) : source;
    };

    link.target = function(_) {
      return arguments.length ? (target = _, link) : target;
    };

    link.x = function(_) {
      return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant$4(+_), link) : x$1;
    };

    link.y = function(_) {
      return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant$4(+_), link) : y$1;
    };

    link.context = function(_) {
      return arguments.length ? ((context = _ == null ? null : _), link) : context;
    };

    return link;
  }

  function curveHorizontal(context, x0, y0, x1, y1) {
    context.moveTo(x0, y0);
    context.bezierCurveTo(x0 = (x0 + x1) / 2, y0, x0, y1, x1, y1);
  }

  function curveVertical(context, x0, y0, x1, y1) {
    context.moveTo(x0, y0);
    context.bezierCurveTo(x0, y0 = (y0 + y1) / 2, x1, y0, x1, y1);
  }

  function curveRadial$1(context, x0, y0, x1, y1) {
    var p0 = pointRadial(x0, y0),
        p1 = pointRadial(x0, y0 = (y0 + y1) / 2),
        p2 = pointRadial(x1, y0),
        p3 = pointRadial(x1, y1);
    context.moveTo(p0[0], p0[1]);
    context.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
  }

  function linkHorizontal() {
    return link(curveHorizontal);
  }

  function linkVertical() {
    return link(curveVertical);
  }

  function linkRadial() {
    var l = link(curveRadial$1);
    l.angle = l.x, delete l.x;
    l.radius = l.y, delete l.y;
    return l;
  }

  var circle = {
    draw: function(context, size) {
      var r = Math.sqrt(size / pi$1);
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau$1);
    }
  };

  var cross$1 = {
    draw: function(context, size) {
      var r = Math.sqrt(size / 5) / 2;
      context.moveTo(-3 * r, -r);
      context.lineTo(-r, -r);
      context.lineTo(-r, -3 * r);
      context.lineTo(r, -3 * r);
      context.lineTo(r, -r);
      context.lineTo(3 * r, -r);
      context.lineTo(3 * r, r);
      context.lineTo(r, r);
      context.lineTo(r, 3 * r);
      context.lineTo(-r, 3 * r);
      context.lineTo(-r, r);
      context.lineTo(-3 * r, r);
      context.closePath();
    }
  };

  var tan30 = Math.sqrt(1 / 3),
      tan30_2 = tan30 * 2;

  var diamond = {
    draw: function(context, size) {
      var y = Math.sqrt(size / tan30_2),
          x = y * tan30;
      context.moveTo(0, -y);
      context.lineTo(x, 0);
      context.lineTo(0, y);
      context.lineTo(-x, 0);
      context.closePath();
    }
  };

  var ka = 0.89081309152928522810,
      kr = Math.sin(pi$1 / 10) / Math.sin(7 * pi$1 / 10),
      kx = Math.sin(tau$1 / 10) * kr,
      ky = -Math.cos(tau$1 / 10) * kr;

  var star = {
    draw: function(context, size) {
      var r = Math.sqrt(size * ka),
          x = kx * r,
          y = ky * r;
      context.moveTo(0, -r);
      context.lineTo(x, y);
      for (var i = 1; i < 5; ++i) {
        var a = tau$1 * i / 5,
            c = Math.cos(a),
            s = Math.sin(a);
        context.lineTo(s * r, -c * r);
        context.lineTo(c * x - s * y, s * x + c * y);
      }
      context.closePath();
    }
  };

  var square = {
    draw: function(context, size) {
      var w = Math.sqrt(size),
          x = -w / 2;
      context.rect(x, x, w, w);
    }
  };

  var sqrt3 = Math.sqrt(3);

  var triangle = {
    draw: function(context, size) {
      var y = -Math.sqrt(size / (sqrt3 * 3));
      context.moveTo(0, y * 2);
      context.lineTo(-sqrt3 * y, -y);
      context.lineTo(sqrt3 * y, -y);
      context.closePath();
    }
  };

  var c = -0.5,
      s = Math.sqrt(3) / 2,
      k = 1 / Math.sqrt(12),
      a = (k / 2 + 1) * 3;

  var wye = {
    draw: function(context, size) {
      var r = Math.sqrt(size / a),
          x0 = r / 2,
          y0 = r * k,
          x1 = x0,
          y1 = r * k + r,
          x2 = -x1,
          y2 = y1;
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineTo(c * x0 - s * y0, s * x0 + c * y0);
      context.lineTo(c * x1 - s * y1, s * x1 + c * y1);
      context.lineTo(c * x2 - s * y2, s * x2 + c * y2);
      context.lineTo(c * x0 + s * y0, c * y0 - s * x0);
      context.lineTo(c * x1 + s * y1, c * y1 - s * x1);
      context.lineTo(c * x2 + s * y2, c * y2 - s * x2);
      context.closePath();
    }
  };

  var symbols = [
    circle,
    cross$1,
    diamond,
    square,
    star,
    triangle,
    wye
  ];

  function symbol() {
    var type = constant$4(circle),
        size = constant$4(64),
        context = null;

    function symbol() {
      var buffer;
      if (!context) context = buffer = path();
      type.apply(this, arguments).draw(context, +size.apply(this, arguments));
      if (buffer) return context = null, buffer + "" || null;
    }

    symbol.type = function(_) {
      return arguments.length ? (type = typeof _ === "function" ? _ : constant$4(_), symbol) : type;
    };

    symbol.size = function(_) {
      return arguments.length ? (size = typeof _ === "function" ? _ : constant$4(+_), symbol) : size;
    };

    symbol.context = function(_) {
      return arguments.length ? (context = _ == null ? null : _, symbol) : context;
    };

    return symbol;
  }

  function noop() {}

  function point$2(that, x, y) {
    that._context.bezierCurveTo(
      (2 * that._x0 + that._x1) / 3,
      (2 * that._y0 + that._y1) / 3,
      (that._x0 + 2 * that._x1) / 3,
      (that._y0 + 2 * that._y1) / 3,
      (that._x0 + 4 * that._x1 + x) / 6,
      (that._y0 + 4 * that._y1 + y) / 6
    );
  }

  function Basis(context) {
    this._context = context;
  }

  Basis.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 =
      this._y0 = this._y1 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 3: point$2(this, this._x1, this._y1); // proceed
        case 2: this._context.lineTo(this._x1, this._y1); break;
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; break;
        case 2: this._point = 3; this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
        default: point$2(this, x, y); break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };

  function basis$2(context) {
    return new Basis(context);
  }

  function BasisClosed(context) {
    this._context = context;
  }

  BasisClosed.prototype = {
    areaStart: noop,
    areaEnd: noop,
    lineStart: function() {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 =
      this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 1: {
          this._context.moveTo(this._x2, this._y2);
          this._context.closePath();
          break;
        }
        case 2: {
          this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
          this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
          this._context.closePath();
          break;
        }
        case 3: {
          this.point(this._x2, this._y2);
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          break;
        }
      }
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._x2 = x, this._y2 = y; break;
        case 1: this._point = 2; this._x3 = x, this._y3 = y; break;
        case 2: this._point = 3; this._x4 = x, this._y4 = y; this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6); break;
        default: point$2(this, x, y); break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };

  function basisClosed$1(context) {
    return new BasisClosed(context);
  }

  function BasisOpen(context) {
    this._context = context;
  }

  BasisOpen.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 =
      this._y0 = this._y1 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; break;
        case 1: this._point = 2; break;
        case 2: this._point = 3; var x0 = (this._x0 + 4 * this._x1 + x) / 6, y0 = (this._y0 + 4 * this._y1 + y) / 6; this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0); break;
        case 3: this._point = 4; // proceed
        default: point$2(this, x, y); break;
      }
      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
    }
  };

  function basisOpen(context) {
    return new BasisOpen(context);
  }

  function Bundle(context, beta) {
    this._basis = new Basis(context);
    this._beta = beta;
  }

  Bundle.prototype = {
    lineStart: function() {
      this._x = [];
      this._y = [];
      this._basis.lineStart();
    },
    lineEnd: function() {
      var x = this._x,
          y = this._y,
          j = x.length - 1;

      if (j > 0) {
        var x0 = x[0],
            y0 = y[0],
            dx = x[j] - x0,
            dy = y[j] - y0,
            i = -1,
            t;

        while (++i <= j) {
          t = i / j;
          this._basis.point(
            this._beta * x[i] + (1 - this._beta) * (x0 + t * dx),
            this._beta * y[i] + (1 - this._beta) * (y0 + t * dy)
          );
        }
      }

      this._x = this._y = null;
      this._basis.lineEnd();
    },
    point: function(x, y) {
      this._x.push(+x);
      this._y.push(+y);
    }
  };

  var bundle = (function custom(beta) {

    function bundle(context) {
      return beta === 1 ? new Basis(context) : new Bundle(context, beta);
    }

    bundle.beta = function(beta) {
      return custom(+beta);
    };

    return bundle;
  })(0.85);

  function point$3(that, x, y) {
    that._context.bezierCurveTo(
      that._x1 + that._k * (that._x2 - that._x0),
      that._y1 + that._k * (that._y2 - that._y0),
      that._x2 + that._k * (that._x1 - x),
      that._y2 + that._k * (that._y1 - y),
      that._x2,
      that._y2
    );
  }

  function Cardinal(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }

  Cardinal.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._x2 =
      this._y0 = this._y1 = this._y2 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 2: this._context.lineTo(this._x2, this._y2); break;
        case 3: point$3(this, this._x1, this._y1); break;
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
        case 2: this._point = 3; // proceed
        default: point$3(this, x, y); break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };

  var cardinal = (function custom(tension) {

    function cardinal(context) {
      return new Cardinal(context, tension);
    }

    cardinal.tension = function(tension) {
      return custom(+tension);
    };

    return cardinal;
  })(0);

  function CardinalClosed(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }

  CardinalClosed.prototype = {
    areaStart: noop,
    areaEnd: noop,
    lineStart: function() {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
      this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 1: {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
        case 2: {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
        case 3: {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
      }
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
        case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
        case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
        default: point$3(this, x, y); break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };

  var cardinalClosed = (function custom(tension) {

    function cardinal(context) {
      return new CardinalClosed(context, tension);
    }

    cardinal.tension = function(tension) {
      return custom(+tension);
    };

    return cardinal;
  })(0);

  function CardinalOpen(context, tension) {
    this._context = context;
    this._k = (1 - tension) / 6;
  }

  CardinalOpen.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._x2 =
      this._y0 = this._y1 = this._y2 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; break;
        case 1: this._point = 2; break;
        case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
        case 3: this._point = 4; // proceed
        default: point$3(this, x, y); break;
      }
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };

  var cardinalOpen = (function custom(tension) {

    function cardinal(context) {
      return new CardinalOpen(context, tension);
    }

    cardinal.tension = function(tension) {
      return custom(+tension);
    };

    return cardinal;
  })(0);

  function point$4(that, x, y) {
    var x1 = that._x1,
        y1 = that._y1,
        x2 = that._x2,
        y2 = that._y2;

    if (that._l01_a > epsilon$1) {
      var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
          n = 3 * that._l01_a * (that._l01_a + that._l12_a);
      x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
      y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
    }

    if (that._l23_a > epsilon$1) {
      var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
          m = 3 * that._l23_a * (that._l23_a + that._l12_a);
      x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
      y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
    }

    that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
  }

  function CatmullRom(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }

  CatmullRom.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._x2 =
      this._y0 = this._y1 = this._y2 = NaN;
      this._l01_a = this._l12_a = this._l23_a =
      this._l01_2a = this._l12_2a = this._l23_2a =
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 2: this._context.lineTo(this._x2, this._y2); break;
        case 3: this.point(this._x2, this._y2); break;
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;

      if (this._point) {
        var x23 = this._x2 - x,
            y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }

      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; break;
        case 2: this._point = 3; // proceed
        default: point$4(this, x, y); break;
      }

      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };

  var catmullRom = (function custom(alpha) {

    function catmullRom(context) {
      return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
    }

    catmullRom.alpha = function(alpha) {
      return custom(+alpha);
    };

    return catmullRom;
  })(0.5);

  function CatmullRomClosed(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }

  CatmullRomClosed.prototype = {
    areaStart: noop,
    areaEnd: noop,
    lineStart: function() {
      this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
      this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
      this._l01_a = this._l12_a = this._l23_a =
      this._l01_2a = this._l12_2a = this._l23_2a =
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 1: {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
        case 2: {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
        case 3: {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
      }
    },
    point: function(x, y) {
      x = +x, y = +y;

      if (this._point) {
        var x23 = this._x2 - x,
            y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }

      switch (this._point) {
        case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
        case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
        case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
        default: point$4(this, x, y); break;
      }

      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };

  var catmullRomClosed = (function custom(alpha) {

    function catmullRom(context) {
      return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
    }

    catmullRom.alpha = function(alpha) {
      return custom(+alpha);
    };

    return catmullRom;
  })(0.5);

  function CatmullRomOpen(context, alpha) {
    this._context = context;
    this._alpha = alpha;
  }

  CatmullRomOpen.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 = this._x2 =
      this._y0 = this._y1 = this._y2 = NaN;
      this._l01_a = this._l12_a = this._l23_a =
      this._l01_2a = this._l12_2a = this._l23_2a =
      this._point = 0;
    },
    lineEnd: function() {
      if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;

      if (this._point) {
        var x23 = this._x2 - x,
            y23 = this._y2 - y;
        this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
      }

      switch (this._point) {
        case 0: this._point = 1; break;
        case 1: this._point = 2; break;
        case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
        case 3: this._point = 4; // proceed
        default: point$4(this, x, y); break;
      }

      this._l01_a = this._l12_a, this._l12_a = this._l23_a;
      this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
      this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
      this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
    }
  };

  var catmullRomOpen = (function custom(alpha) {

    function catmullRom(context) {
      return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
    }

    catmullRom.alpha = function(alpha) {
      return custom(+alpha);
    };

    return catmullRom;
  })(0.5);

  function LinearClosed(context) {
    this._context = context;
  }

  LinearClosed.prototype = {
    areaStart: noop,
    areaEnd: noop,
    lineStart: function() {
      this._point = 0;
    },
    lineEnd: function() {
      if (this._point) this._context.closePath();
    },
    point: function(x, y) {
      x = +x, y = +y;
      if (this._point) this._context.lineTo(x, y);
      else this._point = 1, this._context.moveTo(x, y);
    }
  };

  function linearClosed(context) {
    return new LinearClosed(context);
  }

  function sign(x) {
    return x < 0 ? -1 : 1;
  }

  // Calculate the slopes of the tangents (Hermite-type interpolation) based on
  // the following paper: Steffen, M. 1990. A Simple Method for Monotonic
  // Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
  // NOV(II), P. 443, 1990.
  function slope3(that, x2, y2) {
    var h0 = that._x1 - that._x0,
        h1 = x2 - that._x1,
        s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
        s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
        p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }

  // Calculate a one-sided slope.
  function slope2(that, t) {
    var h = that._x1 - that._x0;
    return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
  }

  // According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
  // "you can express cubic Hermite interpolation in terms of cubic Bézier curves
  // with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
  function point$5(that, t0, t1) {
    var x0 = that._x0,
        y0 = that._y0,
        x1 = that._x1,
        y1 = that._y1,
        dx = (x1 - x0) / 3;
    that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
  }

  function MonotoneX(context) {
    this._context = context;
  }

  MonotoneX.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x0 = this._x1 =
      this._y0 = this._y1 =
      this._t0 = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      switch (this._point) {
        case 2: this._context.lineTo(this._x1, this._y1); break;
        case 3: point$5(this, this._t0, slope2(this, this._t0)); break;
      }
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      this._line = 1 - this._line;
    },
    point: function(x, y) {
      var t1 = NaN;

      x = +x, y = +y;
      if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; break;
        case 2: this._point = 3; point$5(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
        default: point$5(this, this._t0, t1 = slope3(this, x, y)); break;
      }

      this._x0 = this._x1, this._x1 = x;
      this._y0 = this._y1, this._y1 = y;
      this._t0 = t1;
    }
  };

  function MonotoneY(context) {
    this._context = new ReflectContext(context);
  }

  (MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
    MonotoneX.prototype.point.call(this, y, x);
  };

  function ReflectContext(context) {
    this._context = context;
  }

  ReflectContext.prototype = {
    moveTo: function(x, y) { this._context.moveTo(y, x); },
    closePath: function() { this._context.closePath(); },
    lineTo: function(x, y) { this._context.lineTo(y, x); },
    bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
  };

  function monotoneX(context) {
    return new MonotoneX(context);
  }

  function monotoneY(context) {
    return new MonotoneY(context);
  }

  function Natural(context) {
    this._context = context;
  }

  Natural.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x = [];
      this._y = [];
    },
    lineEnd: function() {
      var x = this._x,
          y = this._y,
          n = x.length;

      if (n) {
        this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
        if (n === 2) {
          this._context.lineTo(x[1], y[1]);
        } else {
          var px = controlPoints(x),
              py = controlPoints(y);
          for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
            this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
          }
        }
      }

      if (this._line || (this._line !== 0 && n === 1)) this._context.closePath();
      this._line = 1 - this._line;
      this._x = this._y = null;
    },
    point: function(x, y) {
      this._x.push(+x);
      this._y.push(+y);
    }
  };

  // See https://www.particleincell.com/2012/bezier-splines/ for derivation.
  function controlPoints(x) {
    var i,
        n = x.length - 1,
        m,
        a = new Array(n),
        b = new Array(n),
        r = new Array(n);
    a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
    for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
    a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
    for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
    a[n - 1] = r[n - 1] / b[n - 1];
    for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
    b[n - 1] = (x[n] + a[n - 1]) / 2;
    for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
    return [a, b];
  }

  function natural(context) {
    return new Natural(context);
  }

  function Step(context, t) {
    this._context = context;
    this._t = t;
  }

  Step.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x = this._y = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
    },
    point: function(x, y) {
      x = +x, y = +y;
      switch (this._point) {
        case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
        case 1: this._point = 2; // proceed
        default: {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
      }
      this._x = x, this._y = y;
    }
  };

  function step(context) {
    return new Step(context, 0.5);
  }

  function stepBefore(context) {
    return new Step(context, 0);
  }

  function stepAfter(context) {
    return new Step(context, 1);
  }

  function none$1(series, order) {
    if (!((n = series.length) > 1)) return;
    for (var i = 1, j, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
      s0 = s1, s1 = series[order[i]];
      for (j = 0; j < m; ++j) {
        s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
      }
    }
  }

  function none$2(series) {
    var n = series.length, o = new Array(n);
    while (--n >= 0) o[n] = n;
    return o;
  }

  function stackValue(d, key) {
    return d[key];
  }

  function stack() {
    var keys = constant$4([]),
        order = none$2,
        offset = none$1,
        value = stackValue;

    function stack(data) {
      var kz = keys.apply(this, arguments),
          i,
          m = data.length,
          n = kz.length,
          sz = new Array(n),
          oz;

      for (i = 0; i < n; ++i) {
        for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
          si[j] = sij = [0, +value(data[j], ki, j, data)];
          sij.data = data[j];
        }
        si.key = ki;
      }

      for (i = 0, oz = order(sz); i < n; ++i) {
        sz[oz[i]].index = i;
      }

      offset(sz, oz);
      return sz;
    }

    stack.keys = function(_) {
      return arguments.length ? (keys = typeof _ === "function" ? _ : constant$4(slice$2.call(_)), stack) : keys;
    };

    stack.value = function(_) {
      return arguments.length ? (value = typeof _ === "function" ? _ : constant$4(+_), stack) : value;
    };

    stack.order = function(_) {
      return arguments.length ? (order = _ == null ? none$2 : typeof _ === "function" ? _ : constant$4(slice$2.call(_)), stack) : order;
    };

    stack.offset = function(_) {
      return arguments.length ? (offset = _ == null ? none$1 : _, stack) : offset;
    };

    return stack;
  }

  function expand(series, order) {
    if (!((n = series.length) > 0)) return;
    for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
      for (y = i = 0; i < n; ++i) y += series[i][j][1] || 0;
      if (y) for (i = 0; i < n; ++i) series[i][j][1] /= y;
    }
    none$1(series, order);
  }

  function diverging$1(series, order) {
    if (!((n = series.length) > 0)) return;
    for (var i, j = 0, d, dy, yp, yn, n, m = series[order[0]].length; j < m; ++j) {
      for (yp = yn = 0, i = 0; i < n; ++i) {
        if ((dy = (d = series[order[i]][j])[1] - d[0]) > 0) {
          d[0] = yp, d[1] = yp += dy;
        } else if (dy < 0) {
          d[1] = yn, d[0] = yn += dy;
        } else {
          d[0] = 0, d[1] = dy;
        }
      }
    }
  }

  function silhouette(series, order) {
    if (!((n = series.length) > 0)) return;
    for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
      for (var i = 0, y = 0; i < n; ++i) y += series[i][j][1] || 0;
      s0[j][1] += s0[j][0] = -y / 2;
    }
    none$1(series, order);
  }

  function wiggle(series, order) {
    if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
    for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
      for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
        var si = series[order[i]],
            sij0 = si[j][1] || 0,
            sij1 = si[j - 1][1] || 0,
            s3 = (sij0 - sij1) / 2;
        for (var k = 0; k < i; ++k) {
          var sk = series[order[k]],
              skj0 = sk[j][1] || 0,
              skj1 = sk[j - 1][1] || 0;
          s3 += skj0 - skj1;
        }
        s1 += sij0, s2 += s3 * sij0;
      }
      s0[j - 1][1] += s0[j - 1][0] = y;
      if (s1) y -= s2 / s1;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    none$1(series, order);
  }

  function appearance(series) {
    var peaks = series.map(peak);
    return none$2(series).sort(function(a, b) { return peaks[a] - peaks[b]; });
  }

  function peak(series) {
    var i = -1, j = 0, n = series.length, vi, vj = -Infinity;
    while (++i < n) if ((vi = +series[i][1]) > vj) vj = vi, j = i;
    return j;
  }

  function ascending$2(series) {
    var sums = series.map(sum$1);
    return none$2(series).sort(function(a, b) { return sums[a] - sums[b]; });
  }

  function sum$1(series) {
    var s = 0, i = -1, n = series.length, v;
    while (++i < n) if (v = +series[i][1]) s += v;
    return s;
  }

  function descending$2(series) {
    return ascending$2(series).reverse();
  }

  function insideOut(series) {
    var n = series.length,
        i,
        j,
        sums = series.map(sum$1),
        order = appearance(series),
        top = 0,
        bottom = 0,
        tops = [],
        bottoms = [];

    for (i = 0; i < n; ++i) {
      j = order[i];
      if (top < bottom) {
        top += sums[j];
        tops.push(j);
      } else {
        bottom += sums[j];
        bottoms.push(j);
      }
    }

    return bottoms.reverse().concat(tops);
  }

  function reverse(series) {
    return none$2(series).reverse();
  }

  var slice$3 = Array.prototype.slice;

  function identity$6(x) {
    return x;
  }

  var top = 1,
      right = 2,
      bottom = 3,
      left = 4,
      epsilon$2 = 1e-6;

  function translateX(x) {
    return "translate(" + (x + 0.5) + ",0)";
  }

  function translateY(y) {
    return "translate(0," + (y + 0.5) + ")";
  }

  function number$3(scale) {
    return function(d) {
      return +scale(d);
    };
  }

  function center(scale) {
    var offset = Math.max(0, scale.bandwidth() - 1) / 2; // Adjust for 0.5px offset.
    if (scale.round()) offset = Math.round(offset);
    return function(d) {
      return +scale(d) + offset;
    };
  }

  function entering() {
    return !this.__axis;
  }

  function axis(orient, scale) {
    var tickArguments = [],
        tickValues = null,
        tickFormat = null,
        tickSizeInner = 6,
        tickSizeOuter = 6,
        tickPadding = 3,
        k = orient === top || orient === left ? -1 : 1,
        x = orient === left || orient === right ? "x" : "y",
        transform = orient === top || orient === bottom ? translateX : translateY;

    function axis(context) {
      var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
          format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$6) : tickFormat,
          spacing = Math.max(tickSizeInner, 0) + tickPadding,
          range = scale.range(),
          range0 = +range[0] + 0.5,
          range1 = +range[range.length - 1] + 0.5,
          position = (scale.bandwidth ? center : number$3)(scale.copy()),
          selection = context.selection ? context.selection() : context,
          path = selection.selectAll(".domain").data([null]),
          tick = selection.selectAll(".tick").data(values, scale).order(),
          tickExit = tick.exit(),
          tickEnter = tick.enter().append("g").attr("class", "tick"),
          line = tick.select("line"),
          text = tick.select("text");

      path = path.merge(path.enter().insert("path", ".tick")
          .attr("class", "domain")
          .attr("stroke", "currentColor"));

      tick = tick.merge(tickEnter);

      line = line.merge(tickEnter.append("line")
          .attr("stroke", "currentColor")
          .attr(x + "2", k * tickSizeInner));

      text = text.merge(tickEnter.append("text")
          .attr("fill", "currentColor")
          .attr(x, k * spacing)
          .attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));

      if (context !== selection) {
        path = path.transition(context);
        tick = tick.transition(context);
        line = line.transition(context);
        text = text.transition(context);

        tickExit = tickExit.transition(context)
            .attr("opacity", epsilon$2)
            .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d) : this.getAttribute("transform"); });

        tickEnter
            .attr("opacity", epsilon$2)
            .attr("transform", function(d) { var p = this.parentNode.__axis; return transform(p && isFinite(p = p(d)) ? p : position(d)); });
      }

      tickExit.remove();

      path
          .attr("d", orient === left || orient == right
              ? (tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H0.5V" + range1 + "H" + k * tickSizeOuter : "M0.5," + range0 + "V" + range1)
              : (tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V0.5H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + ",0.5H" + range1));

      tick
          .attr("opacity", 1)
          .attr("transform", function(d) { return transform(position(d)); });

      line
          .attr(x + "2", k * tickSizeInner);

      text
          .attr(x, k * spacing)
          .text(format);

      selection.filter(entering)
          .attr("fill", "none")
          .attr("font-size", 10)
          .attr("font-family", "sans-serif")
          .attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");

      selection
          .each(function() { this.__axis = position; });
    }

    axis.scale = function(_) {
      return arguments.length ? (scale = _, axis) : scale;
    };

    axis.ticks = function() {
      return tickArguments = slice$3.call(arguments), axis;
    };

    axis.tickArguments = function(_) {
      return arguments.length ? (tickArguments = _ == null ? [] : slice$3.call(_), axis) : tickArguments.slice();
    };

    axis.tickValues = function(_) {
      return arguments.length ? (tickValues = _ == null ? null : slice$3.call(_), axis) : tickValues && tickValues.slice();
    };

    axis.tickFormat = function(_) {
      return arguments.length ? (tickFormat = _, axis) : tickFormat;
    };

    axis.tickSize = function(_) {
      return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
    };

    axis.tickSizeInner = function(_) {
      return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
    };

    axis.tickSizeOuter = function(_) {
      return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
    };

    axis.tickPadding = function(_) {
      return arguments.length ? (tickPadding = +_, axis) : tickPadding;
    };

    return axis;
  }

  function axisTop(scale) {
    return axis(top, scale);
  }

  function axisRight(scale) {
    return axis(right, scale);
  }

  function axisBottom(scale) {
    return axis(bottom, scale);
  }

  function axisLeft(scale) {
    return axis(left, scale);
  }

  var noop$1 = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames$1(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames$1(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set$1(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var frame = 0, // is an animation frame pending?
      timeout = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock = typeof performance === "object" && performance.now ? performance : Date,
      setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout$1(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(function(elapsed) {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  var emptyOn = dispatch("start", "end", "cancel", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create$1(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = get$1(node, id);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }

  function set$2(node, id) {
    var schedule = get$1(node, id);
    if (schedule.state > STARTED) throw new Error("too late; already running");
    return schedule;
  }

  function get$1(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
    return schedule;
  }

  function create$1(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = timer(schedule, 0, self.time);

    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start, self.delay, self.time);

      // If the elapsed delay is less than our first sleep, start immediately.
      if (self.delay <= elapsed) start(elapsed - self.delay);
    }

    function start(elapsed) {
      var i, j, n, o;

      // If the state is not SCHEDULED, then we previously errored on start.
      if (self.state !== SCHEDULED) return stop();

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // While this element already has a starting transition during this frame,
        // defer starting an interrupting transition until that transition has a
        // chance to tick (and possibly end); see d3/d3-transition#54!
        if (o.state === STARTED) return timeout$1(start);

        // Interrupt the active transition, if any.
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions.
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("cancel", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see d3/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      timeout$1(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(node, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }

    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id];
      for (var i in schedules) return; // eslint-disable-line no-unused-vars
      delete node.__transition;
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule = set$2(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule = set$2(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get$1(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule = set$2(this, id);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get$1(node, id).value[name];
    };
  }

  function interpolate(a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber
        : b instanceof color ? interpolateRgb
        : (c = color(b)) ? (b = c, interpolateRgb)
        : interpolateString)(a, b);
  }

  function attrRemove$1(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$1(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$1(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrConstantNS$1(fullname, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrFunction$1(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function attrFunctionNS$1(fullname, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function transition_attr(name, value) {
    var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
    return this.attrTween(name, typeof value === "function"
        ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
        : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
  }

  function attrInterpolate(name, i) {
    return function(t) {
      this.setAttribute(name, i.call(this, t));
    };
  }

  function attrInterpolateNS(fullname, i) {
    return function(t) {
      this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
    };
  }

  function attrTweenNS(fullname, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = namespace(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get$1(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set$2(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set$2(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get$1(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set$2(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get$1(this.node(), id).ease;
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition) {
    if (transition._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set$2;
    return function() {
      var schedule = sit(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get$1(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get$1(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select.call(node, node.__data__, i, group), child, inherit = get$1(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection$1 = selection.prototype.constructor;

  function transition_selection() {
    return new Selection$1(this._groups, this._parents);
  }

  function styleNull(name, interpolate) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }

  function styleRemove$1(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$1(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function styleFunction$1(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue(this, name),
          value1 = value(this),
          string1 = value1 + "";
      if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function styleMaybeRemove(id, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
    return function() {
      var schedule = set$2(this, id),
          on = schedule.on,
          listener = schedule.value[key] == null ? remove || (remove = styleRemove$1(name)) : undefined;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

      schedule.on = on1;
    };
  }

  function transition_style(name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
    return value == null ? this
        .styleTween(name, styleNull(name, i))
        .on("end.style." + name, styleRemove$1(name))
      : typeof value === "function" ? this
        .styleTween(name, styleFunction$1(name, i, tweenValue(this, "style." + name, value)))
        .each(styleMaybeRemove(this._id, name))
      : this
        .styleTween(name, styleConstant$1(name, i, value), priority)
        .on("end.style." + name, null);
  }

  function styleInterpolate(name, i, priority) {
    return function(t) {
      this.style.setProperty(name, i.call(this, t), priority);
    };
  }

  function styleTween(name, value, priority) {
    var t, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
      return t;
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant$1(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$1(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction$1(tweenValue(this, "text", value))
        : textConstant$1(value == null ? "" : value + ""));
  }

  function textInterpolate(i) {
    return function(t) {
      this.textContent = i.call(this, t);
    };
  }

  function textTween(value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_textTween(value) {
    var key = "text";
    if (arguments.length < 1) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, textTween(value));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get$1(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  function transition_end() {
    var on0, on1, that = this, id = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = {value: reject},
          end = {value: function() { if (--size === 0) resolve(); }};

      that.each(function() {
        var schedule = set$2(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }

        schedule.on = on1;
      });
    });
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function transition(name) {
    return selection().transition(name);
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = selection.prototype;

  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    textTween: transition_textTween,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease,
    end: transition_end
  };

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        return defaultTiming.time = now(), defaultTiming;
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  selection.prototype.interrupt = selection_interrupt;
  selection.prototype.transition = selection_transition;

  var root$1 = [null];

  function active(node, name) {
    var schedules = node.__transition,
        schedule,
        i;

    if (schedules) {
      name = name == null ? null : name + "";
      for (i in schedules) {
        if ((schedule = schedules[i]).state > SCHEDULED && schedule.name === name) {
          return new Transition([[node]], root$1, name, +i);
        }
      }
    }

    return null;
  }

  exports.FormatSpecifier = FormatSpecifier;
  exports.active = active;
  exports.arc = arc;
  exports.area = area;
  exports.areaRadial = areaRadial;
  exports.ascending = ascending$1;
  exports.axisBottom = axisBottom;
  exports.axisLeft = axisLeft;
  exports.axisRight = axisRight;
  exports.axisTop = axisTop;
  exports.bisect = bisectRight;
  exports.bisectLeft = bisectLeft;
  exports.bisectRight = bisectRight;
  exports.bisector = bisector;
  exports.clientPoint = point;
  exports.create = create;
  exports.creator = creator;
  exports.cross = cross;
  exports.curveBasis = basis$2;
  exports.curveBasisClosed = basisClosed$1;
  exports.curveBasisOpen = basisOpen;
  exports.curveBundle = bundle;
  exports.curveCardinal = cardinal;
  exports.curveCardinalClosed = cardinalClosed;
  exports.curveCardinalOpen = cardinalOpen;
  exports.curveCatmullRom = catmullRom;
  exports.curveCatmullRomClosed = catmullRomClosed;
  exports.curveCatmullRomOpen = catmullRomOpen;
  exports.curveLinear = curveLinear;
  exports.curveLinearClosed = linearClosed;
  exports.curveMonotoneX = monotoneX;
  exports.curveMonotoneY = monotoneY;
  exports.curveNatural = natural;
  exports.curveStep = step;
  exports.curveStepAfter = stepAfter;
  exports.curveStepBefore = stepBefore;
  exports.customEvent = customEvent;
  exports.descending = descending;
  exports.deviation = deviation;
  exports.extent = extent;
  exports.formatDefaultLocale = defaultLocale;
  exports.formatLocale = formatLocale;
  exports.formatSpecifier = formatSpecifier;
  exports.histogram = histogram;
  exports.interpolate = interpolateValue;
  exports.interpolateArray = array$2;
  exports.interpolateBasis = basis$1;
  exports.interpolateBasisClosed = basisClosed;
  exports.interpolateCubehelix = cubehelix$2;
  exports.interpolateCubehelixLong = cubehelixLong;
  exports.interpolateDate = date;
  exports.interpolateDiscrete = discrete;
  exports.interpolateHcl = hcl$2;
  exports.interpolateHclLong = hclLong;
  exports.interpolateHsl = hsl$2;
  exports.interpolateHslLong = hslLong;
  exports.interpolateHue = hue$1;
  exports.interpolateLab = lab$1;
  exports.interpolateNumber = interpolateNumber;
  exports.interpolateNumberArray = numberArray;
  exports.interpolateObject = object;
  exports.interpolateRgb = interpolateRgb;
  exports.interpolateRgbBasis = rgbBasis;
  exports.interpolateRgbBasisClosed = rgbBasisClosed;
  exports.interpolateRound = interpolateRound;
  exports.interpolateString = interpolateString;
  exports.interpolateTransformCss = interpolateTransformCss;
  exports.interpolateTransformSvg = interpolateTransformSvg;
  exports.interpolateZoom = zoom;
  exports.interrupt = interrupt;
  exports.line = line;
  exports.lineRadial = lineRadial$1;
  exports.linkHorizontal = linkHorizontal;
  exports.linkRadial = linkRadial;
  exports.linkVertical = linkVertical;
  exports.local = local;
  exports.matcher = matcher;
  exports.max = max;
  exports.mean = mean;
  exports.median = median;
  exports.merge = merge;
  exports.min = min;
  exports.mouse = mouse;
  exports.namespace = namespace;
  exports.namespaces = namespaces;
  exports.pairs = pairs;
  exports.permute = permute;
  exports.pie = pie;
  exports.piecewise = piecewise;
  exports.pointRadial = pointRadial;
  exports.precisionFixed = precisionFixed;
  exports.precisionPrefix = precisionPrefix;
  exports.precisionRound = precisionRound;
  exports.quantile = threshold;
  exports.quantize = quantize;
  exports.radialArea = areaRadial;
  exports.radialLine = lineRadial$1;
  exports.range = sequence;
  exports.scaleBand = band;
  exports.scaleDiverging = diverging;
  exports.scaleDivergingLog = divergingLog;
  exports.scaleDivergingPow = divergingPow;
  exports.scaleDivergingSqrt = divergingSqrt;
  exports.scaleDivergingSymlog = divergingSymlog;
  exports.scaleIdentity = identity$4;
  exports.scaleImplicit = implicit;
  exports.scaleLinear = linear$1;
  exports.scaleLog = log;
  exports.scaleOrdinal = ordinal;
  exports.scalePoint = point$1;
  exports.scalePow = pow;
  exports.scaleQuantile = quantile;
  exports.scaleQuantize = quantize$1;
  exports.scaleSequential = sequential;
  exports.scaleSequentialLog = sequentialLog;
  exports.scaleSequentialPow = sequentialPow;
  exports.scaleSequentialQuantile = sequentialQuantile;
  exports.scaleSequentialSqrt = sequentialSqrt;
  exports.scaleSequentialSymlog = sequentialSymlog;
  exports.scaleSqrt = sqrt;
  exports.scaleSymlog = symlog;
  exports.scaleThreshold = threshold$1;
  exports.scaleTime = time;
  exports.scaleUtc = utcTime;
  exports.scan = scan;
  exports.select = select;
  exports.selectAll = selectAll;
  exports.selection = selection;
  exports.selector = selector;
  exports.selectorAll = selectorAll;
  exports.shuffle = shuffle;
  exports.stack = stack;
  exports.stackOffsetDiverging = diverging$1;
  exports.stackOffsetExpand = expand;
  exports.stackOffsetNone = none$1;
  exports.stackOffsetSilhouette = silhouette;
  exports.stackOffsetWiggle = wiggle;
  exports.stackOrderAppearance = appearance;
  exports.stackOrderAscending = ascending$2;
  exports.stackOrderDescending = descending$2;
  exports.stackOrderInsideOut = insideOut;
  exports.stackOrderNone = none$2;
  exports.stackOrderReverse = reverse;
  exports.style = styleValue;
  exports.sum = sum;
  exports.symbol = symbol;
  exports.symbolCircle = circle;
  exports.symbolCross = cross$1;
  exports.symbolDiamond = diamond;
  exports.symbolSquare = square;
  exports.symbolStar = star;
  exports.symbolTriangle = triangle;
  exports.symbolWye = wye;
  exports.symbols = symbols;
  exports.thresholdFreedmanDiaconis = freedmanDiaconis;
  exports.thresholdScott = scott;
  exports.thresholdSturges = sturges;
  exports.tickFormat = tickFormat;
  exports.tickIncrement = tickIncrement;
  exports.tickStep = tickStep;
  exports.ticks = ticks;
  exports.touch = touch;
  exports.touches = touches;
  exports.transition = transition;
  exports.transpose = transpose;
  exports.variance = variance;
  exports.window = defaultView;
  exports.zip = zip;

  Object.defineProperty(exports, '__esModule', { value: true });

});

csui.define('csui/controls/charts/visual.count/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/controls/charts/visual.count/impl/nls/root/lang',{
    TotalCount: ' Total count',
    Total: 'Total',
    OTPrimary: 'Evening 10',
    OTSecondary: 'Coral 10',
    OTTertiary: 'Garden 10',
    DataClarity: 'Clarity 20',
    DataClarityPatterned: 'Patterned 20',
    OTNavy: 'Navy 6',
    OTTeal: 'Teal 6',
    OTIndigo: 'Indigo 6',
    OTPlum: 'Plum 6',
    OTMagenta: 'Magenta 6',
    NodataDefaultText: 'No data was returned',
    A11yTableCaption: 'Categorical items and their item count.'
});


csui.define('csui/controls/charts/visual.count/impl/visual.count.themes',['i18n!csui/controls/charts/visual.count/impl/nls/lang'], function(lang) {
    'use strict';
    var VisualCountThemes =  [
        {
            name: 'otPrimary',
            label: lang.OTPrimary,
            palette: ['#111b58','#00b8ba','#2E3D98','#09bcef','#4f3690','#7e929f','#5d0026','#055e78','#f05822','#090e2c'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otSecondary',
            label: lang.OTSecondary,
            palette: ['#4f3690','#004267','#7e929f','#111b58','#00b8ba','#2e3d98','#a7261b','#a0006b','#e00051','#5d0026'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otTertiary',
            label: lang.OTTertiary,
            palette: ['#006353','#8cc53e','#003B4D','#0084ce','#4f3690','#067d14','#111b58','#00b8ba','#2e3d98','#775909'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'dataClarity',
            label: lang.DataClarity,
            palette: ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#7f7f7f','#bcbd22','#17becf','#e377c2','#8c564b','#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5','#c7c7c7','#dbdb8d','#9edae5','#f7b6d2','#c49c94'],
            other: '#999',
            opacity: 1
        },
        {
            name: 'dataClarityPatterned',
            label: lang.DataClarityPatterned,
            palette: ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#7f7f7f','#bcbd22','#17becf','#e377c2','#8c564b','#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5','#c7c7c7','#dbdb8d','#9edae5','#f7b6d2','#c49c94'],
            other: '#999',
            opacity: 1
        },
        {
            name: 'otNavy',
            label: lang.OTNavy,
            palette: ['#090e2c','#0d1442','#111b58','#414979','#70769b','#a0a4bc'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otTeal',
            label: lang.OTTeal,
            palette: ['#005c5d','#008a8b','#00b8ba','#33c6c8','#66d4d6','#99e3e3'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otIndigo',
            label: lang.OTIndigo,
            palette: ['#171f4c','#232e72','#2e3d98','#5864ad','#828bc1','#abb1d6'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otPlum',
            label: lang.OTPlum,
            palette: ['#281b48','#3b296c','#4f3690','#725ea6','#9586bc','#b9afd3'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otMagenta',
            label: lang.OTMagenta,
            palette: ['#500036','#780050','#a0006b','#b33389','#c666a6','#d999c4'],
            other: '#777',
            opacity: 1
        }
    ];

    return VisualCountThemes;
});

csui.define('css!csui/controls/charts/visual.count/impl/visual.count',[],function(){});
csui.define('csui/controls/charts/visual.count/impl/visual.count.chart.view',[
    'csui/lib/backbone', 'csui/lib/marionette3', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/d3', 'csui/lib/numeral', // 3rd party libraries
    'csui/controls/charts/visual.count/impl/visual.count.themes',
    'i18n!csui/controls/charts/visual.count/impl/nls/lang',
    'css!csui/controls/charts/visual.count/impl/visual.count'
], function(Backbone, Marionette, _, $, d3, numeral, VisualCountThemes, lang){
    'use strict';

    var VisualCountChartView = Marionette.View.extend({

        defaults: {
            marginTop: 20,
            marginRight: 20,
            marginBottom: 20,
            marginLeft: 20,
            xAxisLabelMargin: 0,
            maxCategoryLabelLength: 18,
            transitionDuration: 600,
            defaultCategoryColor: '#eaeaea',
            chartTextColor: '#222',
            chartBackgroundColor: '#f7f7f7',
            patternCount: 9, // the number of pattern definitions in the patterndef view template
            chartOptions: {
                // these default chart options may be passed in as a backbone model. See markdown.
                showAsPercentage: false,
                animate: true,
                chartTitle: '',
                showAxisLabels: true,
                showValueLabels: true,
                showCountAxis: true,
                countAxisTicks: 6,
                showLegend: true,
                themeName: 'dataClarity',
                showTotal: true,
                showGridLines: true,
                patternOverlayContrast: 0.1
            },
            // Warning - adjusting these ratios may make charts unreadable at certain screen sizes
            labelTypes: {
                default: {
                    heightRatio: 0.02,
                    min: 11,
                    max: 18
                },
                'tick': {
                    heightRatio: 0.025
                },
                'value': {
                    heightRatio: 0.025
                },
                'radial': {
                    heightRatio: 0.05
                },
                'legend': {
                    heightRatio: 0.05,
                    min: 10,
                    max: 20
                },
                'legendTitle': {
                    heightRatio: 0.06,
                    min: 14,
                    max: 24
                },
                'axis': {
                    heightRatio: 0.04,
                    min: 14,
                    max: 20
                },
                'total': {
                    heightRatio: 0.03,
                    min: 12,
                    max: 20
                },
                'title': {
                    heightRatio: 0.06,
                    min: 16,
                    max: 28
                }
            }
        },

        themes: VisualCountThemes,

        className: 'csui-visual-count-chart-container',

        template: false,

        constructor: function VisualCountChartView(options){
            this.chartContext = {};

            var optionsToApply = _.clone(this.defaults.chartOptions);

            // apply chartOptions as combination of defaults and those supplied
            if (options.chartOptions) {
                this.chartOptions = options.chartOptions; // Note: Backbone.Model, not object
                optionsToApply = _.defaults(options.chartOptions.toJSON(),optionsToApply);
                this.chartOptions.set(optionsToApply);
            }
            else {
                this.chartOptions = new Backbone.Model(this.defaults.chartOptions);
            }

            this.columns = options.columns;
            this.viewId = options.viewId;

            this.listenTo(options.collection, 'update', this._preUpdate);
            this.listenTo(options.collection, 'reset', function(){
                this.trigger('redraw:chart');
            });

            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        chartType: null, // Define a unique name in extended objects to identify your visualization type

        onDomRefresh: function () {
            var chartContext = this.getChartContext(),
                d3Chart = (chartContext) ? chartContext.d3Chart : undefined;

            // Only draw the chart if it doesn't already exist
            if (!d3Chart) {
                this.draw();
            }
        },

        create: function (chartContext) {
            // override this stub to implement the code to create your visualization
            var d3Chart = chartContext.d3Chart;

            return d3Chart;
        },

        appendChartTitle: function(chartContext) {
            var d3Chart = chartContext.d3Chart;

            d3Chart.append('g')
                .attr('transform', 'translate(' + chartContext.containerWidth / 2 + ',20)')
                .attr('class', 'csui-visual-count-chart-title')
                .append('text')
                .style('text-anchor', 'middle')
                .style('font-size', this.getScaledFontSize(chartContext,'title'))
                .text(this.chartOptions.get('chartTitle'));

            return d3Chart;
        },

        appendGroups: function(chartContext){
            // override this stub to append any group elements elements of your visualization
            // underneath the root element
            var d3Chart = chartContext.d3Chart;
            return d3Chart;
        },

        update: function (chartContext) {
            // override this stub to implement the code to update your visualization
            var d3Chart = chartContext.d3Chart;

            return d3Chart;
        },

        draw: function () {
            var chartContext = this.chartContext;

            if (!this.collection.isEmpty()) {
                chartContext.chartData = this.getChartDataJSON();
                chartContext.activeColumn = this.getActiveColumn();
                chartContext.previousActiveColumn = this.getActiveColumn(); // needed for detecting change
                chartContext.countColumn = this.getCountColumn();
                chartContext.height = this.getChartHeight(chartContext);
                chartContext.width = this.getChartWidth(chartContext);
                chartContext.pieCenter = {
                    x: (this.chartOptions.get('showLegend')) ? chartContext.width / 3 : chartContext.width / 2, // center pie at 1/3 width of legend is shown
                    y: chartContext.height / 2
                };
                // assign unique and persistent colors to each category.
                chartContext.colorMap = _.map(_.pluck(chartContext.chartData, this.getActiveColumnName(chartContext)), function(item,index) {
                    return {
                        category: (_.isString(item)) ? item.toLowerCase() : item,
                        index: index
                    };
                });
                chartContext.showPatternOverlay = this.chartOptions.get('themeName') === 'dataClarityPatterned' && this.chartOptions.get('patternOverlayContrast') > 0;

                chartContext.transitionDuration = 0;
                if (this.chartOptions.get('showChartTitle')) {
                    chartContext.height -= 100;
                }

                this.appendRootElement(chartContext);
                chartContext.d3Chart = this.appendChartTitle(chartContext);
                chartContext.d3Chart = this.appendGroups(chartContext);
                chartContext.d3Chart = this.create(chartContext);

                this.chartContext = chartContext;
            }
        },

        activeColumnChanged: function() {
            var chartContext = this.chartContext,
                activeColumn = this.getActiveColumn();
            return (chartContext.previousActiveColumn && chartContext.previousActiveColumn.get('name') !== activeColumn.get('name'));
        },

        getChartContext: function(){
            return this.chartContext;
        },

        checkSign: function (x) {
            //TODO: move to a utils script
            if (!Math.sign) {
                // polyfill for older browsers
                Math.sign = function (x) {
                    return ((x > 0) - (x < 0)) || +x;
                };
            }
            return Math.sign(x);
        },

        shortenText: function(t) {
            //TODO: move to a utils script

            t = t || '';
            var maxLength = this.defaults.maxCategoryLabelLength;
            t = (t.length >= maxLength) ? t.substr(0, maxLength) + '\u2026' : t;
            return t;
        },

        formatCount: function(n){
            //TODO: move to a utils script

            var formattedValue, formatTemplate,
                countColumn = this.getCountColumn(),
                format = countColumn.get('client_format').type;

            switch(format) {
                case "si":
                    formattedValue = this.formatSi(n);
                    break;
                case "bytes":
                    // determine which format we want:
                    formatTemplate = (n < 1024) ? '0b' : '0.0b';
                    // call the function to format it:
                    formattedValue = numeral(n).format( formatTemplate );
                    break;
                case "business":
                    formattedValue = this.formatBusiness(n).replace('G','B'); // change Giga to Billion
                    break;
                default:
                    formattedValue = n.toString();
            }
            return formattedValue;
        },

        formatSi: function(n) {
            //TODO: move to a utils script
            //TODO: add locale relevant suffix. This requires a d3.locale instance definition for each country we support

            var formatNumber = d3.format('.3s'),
                displayNumber = formatNumber(n);

            n = n.toPrecision(3) || 0;
            n = Number(n); // remove precision decimal places for integers

            if (n === 0 || (n >= 1 && n < 1000) || (n <= -1 && n > -1000)) {
                // for numbers that have no suffix, remove unwanted trailing zeros that d3.format leaves when using SI notation. This is an issue with d3.format that the author has no intention of fixing: see https://github.com/d3/d3-format/issues/44
                displayNumber = n.toString();
            }

            return displayNumber;
        },

        formatBusiness: function(n) {
            //TODO: add currency prefix $. This requires a d3.locale instance definition for each country we support
            var formatNumber = d3.format('.3s');

            return formatNumber(n);
        },

        getChartData: function(){
//            return this.collection;
        },

        getChartDataJSON: function(){
            return this.collection.toJSON();
        },

        getActiveColumn: function(){
            return this.columns.findWhere(function(column){
                return column.get('active_column');
            });
        },

        getCountColumn: function(){
            return this.columns.findWhere(function(column){
                return column.get('count_column');
            });
        },

        getTotalCount: function(chartData){
            return chartData.reduce(_.bind(function (memo, value) {
                return memo + this.getCountValue(this.getChartContext(),value);
            }, this), 0);
        },

        getTransitionDuration: function() {
            if (this.chartOptions.get('animate') && !this.skipAnimation) {
                return this.defaults.transitionDuration;
            }
            else {
                return 0;
            }
        },

        getMarginTop: function () {
            return this.defaults.marginTop;
        },

        getMarginBottom: function () {
            return this.defaults.marginBottom;
        },

        getMarginLeft: function () {
            var marginLeft = this.defaults.marginLeft;
            if (this.chartOptions.get('showAxisLabels')) {
                marginLeft = this.defaults.marginLeft + this.defaults.xAxisLabelMargin;
            }
            return marginLeft;
        },

        getMarginRight: function () {
            return this.defaults.marginRight;
        },

        getChartWidth: function (chartContext) {
            var chartWidth = chartContext.containerWidth - this.getMarginLeft() - this.getMarginRight();
            return (chartWidth > 0) ? chartWidth : 0;
        },

        getChartHeight: function (chartContext) {
            var chartHeight = chartContext.containerHeight - this.getMarginTop() - this.getMarginBottom();
            return (chartHeight > 0) ? chartHeight : 0;
        },

        appendRootElement: function(chartContext){
            var containerDimensions = this.getContainerDimensions(),

                // Append a root element for the SVG
                d3Chart = d3.select(this.el)
                            .append('svg')
                            .attr('class','csui-visual-count-chart')
                            .attr('aria-hidden', 'true')
                            .attr('width', containerDimensions.width)
                            .attr('height', containerDimensions.height)
                            .attr('fill', this.defaults.chartBackgroundColor),

                // Append a root element for a screen-reader friendly tabular version of the data
                a11yTable = d3.select(this.el)
                    .append('div')
                    .attr('class','csui-visual-count-a11y-table-wrapper');

            chartContext.containerHeight = containerDimensions.height;
            chartContext.containerWidth = containerDimensions.width;
            chartContext.height = this.getChartHeight(chartContext);
            chartContext.width = this.getChartWidth(chartContext);
            chartContext.pieCenter = {
                x: (this.chartOptions.get('showLegend')) ? chartContext.width / 3 : chartContext.width / 2, // center pie at 1/3 width of legend is shown
                y: chartContext.height / 2
            };
            chartContext.d3Chart = d3Chart;
            chartContext.a11yTable = a11yTable;
            this.initA11yTable(chartContext);
        },

        updateRootElement: function(chartContext){
            var containerDimensions = this.getContainerDimensions(),
                d3Chart = chartContext.d3Chart;

            d3Chart.select('svg.csui-visual-count-chart')
                    .attr('width', containerDimensions.width)
                    .attr('height', containerDimensions.height);

            chartContext.containerHeight = containerDimensions.height;
            chartContext.containerWidth = containerDimensions.width;
            chartContext.d3Chart = d3Chart;

            return chartContext;
        },

        initA11yTable: function(chartContext) {
            // create the table structure for an accessibility (a11y) table aimed at screen-readers.
            var a11yTable = chartContext.a11yTable
                    .append('table');

            a11yTable.append('caption')
                .html(this.chartOptions.get('chartTitle') || lang.A11yTableCaption);

            a11yTable.append('thead'); // THEAD is not actually needed for screen readers
            a11yTable.append('tbody');

            return chartContext;
        },

        updateA11yTable: function(chartContext) {
            var chartView = this,
                chartData = chartContext.chartData,
                a11yTable = chartContext.a11yTable.select('tbody'),
                a11yTableRows;

            a11yTableRows = a11yTable
                .selectAll('tr')
                .data(chartData, function (d) {
                    return chartView.getDataValue(chartContext, d);
                });

            //TODO: This standard D3 update pattern only adds new items to the DOM - existing items have their content modified. Consequently, DOM order of data does not always reflect visual chart sort order.

            // remove old data
            a11yTableRows.exit().remove();

            // update existing data
            a11yTableRows.select('th')
                .text(function (d) {
                    return chartView.getDataLabel(chartContext, d);
                });
            a11yTableRows.select('td')
                .text(function (d) {
                    var uiValue = chartView.getCountValue(chartContext, d);
                    if (chartView.chartOptions.get('showAsPercentage')) {
                        uiValue = ((chartView.getCountValue(chartContext, d) / chartView.getTotalCount(chartData)) * 100).toFixed(1) + '%';
                    }
                    return uiValue ;
                });

            // add new data
            a11yTableRows = a11yTableRows.enter()
                .append('tr');

            a11yTableRows
                .append('th')
                .attr('scope','row')
                .text(function (d) {
                    return chartView.getDataLabel(chartContext, d);
                });

            a11yTableRows
                .append('td')
                .text(function (d) {
                    var uiValue = chartView.getCountValue(chartContext, d);
                    if (chartView.chartOptions.get('showAsPercentage')) {
                        uiValue = ((chartView.getCountValue(chartContext, d) / chartView.getTotalCount(chartData)) * 100).toFixed(1) + '%';
                    }
                    return uiValue ;
                });

            return chartContext;
        },

        getContainerDimensions: function(){
            var boundingRect = this.el.getBoundingClientRect(),
                width = boundingRect.width,
                height = boundingRect.height;

            return {
                height: height,
                width: width
            };
        },

        getCountValue: function(chartContext,d){
            var countColumnName = this.getCountColumnName(chartContext);
            return this.getCaseInsensitiveProperty(d,countColumnName);
        },

        getCountLabel: function(chartContext,d){
            var countColumnName = this.getCountColumnName(chartContext);
            return this.getCaseInsensitiveProperty(d,countColumnName + '_formatted');
        },

        getDataValue: function(chartContext,d){
            var activeColumnName = this.getActiveColumnName(chartContext);
            return this.getCaseInsensitiveProperty(d,activeColumnName);
        },

        getDataLabel: function(chartContext,d){
            var activeColumnName = this.getActiveColumnName(chartContext);
            return this.getCaseInsensitiveProperty(d,activeColumnName + '_formatted');
        },

        getActiveColumnKey: function(chartContext){
            return chartContext.activeColumn.get('column_key');
        },

        getActiveColumnName: function(chartContext){
            return chartContext.activeColumn.get('name');
        },

        getActiveColumnLabel: function(chartContext){
            return chartContext.activeColumn.get('name_formatted');
        },

        getCountColumnName: function(chartContext){
            return chartContext.countColumn.get('name');
        },

        getTheme: function(name) {
            var theme = this.themes[0];

            if (!_.isUndefined(name)) {
                theme = _.findWhere(this.themes,{ name: name } ) || theme;
            }

            return theme;
        },

        getPatternFill: function(chartContext,d,i) {
            return 'url(#'+ this.viewId +'-pattern' + i % this.defaults.patternCount + ')';
        },

        getCategoryColor: function(chartContext,d) {
            // maps a theme color to a category's unique ID, so that colors are consistent when data changes
            var colorMap = chartContext.colorMap,
                colorMapLength,
                palette = chartContext.theme.palette,
                categoryName = this.getDataValue(chartContext, d),
                categoryColor = [],
                colorIndex = 0;

            if (_.isString(categoryName)) {
                categoryName = categoryName.toLowerCase();
            }

            colorMapLength = colorMap.length;

            if (_.has(d,'grouped_category') && d.grouped_category) {
                // categories that are grouped have a dedicated colour outside the regular palette to ensure consistent UX
                return chartContext.theme.other;
            }
            else {
                if (categoryColor.length === 0) {
                    // new category
                    colorMap.push({
                        category: categoryName,
                        index: colorMapLength
                    });
                }

                categoryColor = _.where(colorMap,{ category: categoryName });
                // get index of next available color in the theme via modulus
                colorIndex = (categoryColor.length && _.has(categoryColor[0],'index')) ? categoryColor[0].index % palette.length : -1;

                if (colorIndex > -1) {
                    return palette[colorIndex];
                }
                else {
                    return this.defaults.defaultCategoryColor;
                }
            }
        },

        getScaledFontSize: function(chartContext,type) {

            type = type || 'default';
            
            var labelTypes = this.defaults.labelTypes,
            labelType = labelTypes[type],
            fontSize = chartContext.height * labelType.heightRatio,
            minSize = labelType.min || labelTypes['default'].min,
            maxSize = labelType.max || labelTypes['default'].max;

            if (fontSize < minSize) {
                return minSize;
            }
            else if (fontSize > maxSize) {
                return maxSize;
            }

            return fontSize;
        },

        getCaseInsensitiveProperty: function(obj, name) {
            if (obj && name){
                return obj[name] || obj[_.find(_.keys(obj), function(key){
                    return key.toLowerCase() === name.toLowerCase();
                })];
            } else {
                return undefined;
            }
        },

        _updateChart: function(updatedCollection) {

            var chartContext = this.getChartContext();

            if (chartContext) {
                if (this.columns && !this.columns.isEmpty()) {
                    chartContext.countColumn = this.getCountColumn();
                    chartContext.activeColumn = this.getActiveColumn();
                }
                if (this.activeColumnChanged() || updatedCollection.length === 0) {
                    this.trigger('redraw:chart');
                } else {
                    chartContext.transitionDuration = this.getTransitionDuration();
                    chartContext.chartData = this.getChartDataJSON();
                    if (chartContext.d3Chart) {
                        this.updateRootElement(chartContext);
                        this.updateA11yTable(chartContext);
                    }
                    if (chartContext.chartCreated) {
                        this.update(chartContext);
                    }
                }

            }
        },

        _preUpdate: function() {

            if (this.chartContext && _.has(this.chartContext,'chartData')) {
                this._updateChart(this.chartContext.chartData);
            }
            else {
                this.draw();
            }
        }

    });

    return VisualCountChartView;

});
csui.define('csui/controls/charts/visual.count/impl/chart.types/visual.count.bar.view',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/d3', // 3rd party libraries
    'csui/controls/charts/visual.count/impl/visual.count.chart.view',
    'i18n!csui/controls/charts/visual.count/impl/nls/lang'
], function (_, $, d3, VisualCountChartView, lang) {

    var VisualCountBarView = VisualCountChartView.extend({

        constructor: function VisualCountBarView(options) {
            VisualCountChartView.prototype.constructor.apply(this, arguments);

            this.defaults = _.defaults({
                // override any defaults set in VisualCountChartView
                marginTop: 30,
                marginRight: 30,
                marginBottom: 30,
                marginLeft: 30,
                marginLeftMax: 300,
                categoryAxisLabelMargin: 20,
                barValueLabelsOffset: 10,
                isVerticalOrientation: true
            },VisualCountChartView.prototype.defaults);
        },

        chartType: null, // Define a unique name in extended objects to identify your visualization type

        create: function (chartContext) {
            // For a vertical bar chart countAxis is the Y axis, for a horizontal chart countAxis is the X axis
            chartContext.countScale = this.getCountScale(chartContext);
            chartContext.countAxis = this.getCountAxis(chartContext);

            chartContext.categoryScale = this.getCategoryScale(chartContext);
            chartContext.categoryAxis = this.getCategoryAxis(chartContext);

            chartContext.XAxisGroup = this.appendXAxisGroup(chartContext);
            chartContext.YAxisGroup = this.appendYAxisGroup(chartContext);

            chartContext.gridlinesGroup = this.appendGridlinesGroup(chartContext);
            chartContext.zeroLine = this.appendZeroLine(chartContext);
            chartContext.barGroup = this.appendBarGroup(chartContext);
            chartContext.valueLabels = this.appendBarValueLabels(chartContext);

            chartContext.theme = this.getTheme(this.chartOptions.get('themeName'));
            chartContext.patternOverlayContrast = this.chartOptions.get('patternOverlayContrast');

            if (this.chartOptions.get('showAxisLabels')) {
                this.appendXAxisLabel(chartContext);
                this.appendYAxisLabel(chartContext);
            }

            if (this.chartOptions.get('showTotal')) {
                this.appendTotalCount(chartContext);
            }
            chartContext.chartCreated = true;
            this.update(chartContext);

            return chartContext.d3Chart;
        },

        update: function (chartContext) {

            var genericBarView = this,
                chartData = chartContext.chartData,
                categoryScale = chartContext.categoryScale,
                countScale = chartContext.countScale,
                limits = (this.defaults.isVerticalOrientation) ? [chartContext.height,0] : [0,chartContext.width], //TODO: for RTL, swap the horizontal limits
                extent = d3.extent(chartData.map(function (d) {
                    return genericBarView.getCountValue(chartContext, d);
                }));

            // update the domain of the data (range)
            categoryScale.domain(chartData.map(function (d) {
                return genericBarView.getDataLabel(chartContext, d);
            }));

            // generally the yaxis should start from 0, unless it has negative values
            // multiplying extents by 1.1 increases the chart area by 10% to accomodate bar annotations
            extent = (extent[0] > 0) ? [0, extent[1]*1.1] : [extent[0] * 1.1, extent[1] * 1.1];

            countScale.domain(extent)
                .range(limits)
                .nice(); // extend range to nearest nice value

            genericBarView.updateAxes(chartContext);
            genericBarView.updateTicksWithAttrs(chartContext);

            genericBarView.updateBars(chartContext);
            if (chartContext.showPatternOverlay) {
                genericBarView.updateBarPatternOverlays(chartContext);
            }

            genericBarView.updateA11yTable(chartContext);


            if (!this.chartOptions.get('showCountAxis') || this.chartOptions.get('showValueLabels')) {
                // value labels are shown when countAxis is hidden
                genericBarView.updateValueLabels(chartContext);
            }

            if (this.chartOptions.get('showTotal')) {
                genericBarView.updateTotal(chartContext);
            }

            _.delay(function() {
                // allow a short timeout to allow for SVG render time.
                // Ticklabels need to be rendered before we can get their width
                genericBarView.updateTickLabelOrientation(chartContext);
            },100);

        },

        updateAxes: function(chartContext) {

            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                countScale = chartContext.countScale,
                lineLength = -chartContext.width,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                translation = '0,' + countScale(0),
                xAxis = this.getCategoryAxis(chartContext),
                yAxis = (this.chartOptions.get('showCountAxis')) ? this.getCountAxis(chartContext) : null,
                memo;

            if (!this.defaults.isVerticalOrientation) {
                lineLength = chartContext.height;
                translation = countScale(0) + ',0';
                // swap axes;
                memo = xAxis;
                xAxis = yAxis; // intentional
                yAxis = memo;
            }

            if (!this.chartOptions.get('showGridLines')) {
                lineLength = 0;
            }

            // update the category axis
            if (!_.isNull(xAxis)) {
                chartContext.XAxisGroup
                    .transition(t)
                    .call(xAxis)
                    .selectAll('text');
            }

            // update the count axis
            if (!_.isNull(yAxis)) {
                chartContext.YAxisGroup
                    .transition(t)
                    .call(yAxis);
            }

            // update gridlines
            chartContext.gridlinesGroup
                .transition(t)
                .call(genericBarView.getCountAxis(chartContext)
                    .tickFormat('')
                    .tickSize(lineLength))
                .selectAll('line')
                .attr('class', 'csui-visual-count-gridline');

            // zero line
            chartContext.zeroLine
                .transition(t)
                .attr('transform', 'translate(' + translation + ')');

            return d3Chart;
        },

        updateBars: function(chartContext) {

            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                categoryScale = chartContext.categoryScale,
                countScale = chartContext.countScale,
                colorOpacity = chartContext.theme.opacity,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                barMagnitudeProp = 'height', // the variable dimension that shows magnitude of data value
                barThicknessProp = 'width',
                xProp = 'x',
                yProp = 'y';

            if (!this.defaults.isVerticalOrientation) {
                // bars grow horizontally
                barMagnitudeProp = 'width';
                barThicknessProp = 'height';
                xProp = 'y';
                yProp = 'x';
            }

            // join the new data with the existing
            var bars = chartContext.barGroup
                .selectAll('.csui-visual-count-bar')
                .data(chartData, function (d) {
                    return genericBarView.getDataValue(chartContext, d);
                });

            // remove any categories that are no longer in data
            bars.exit()
                .attr('fill-opacity', 0.3)
                .attr('fill','#000')
                .transition(t)
                .attr('fill-opacity', 0)
                .remove();

            // add bars for categories that are new in the data
            bars.enter()
                .append('rect')
                .attr('class', 'csui-visual-count-bar')
                .attr('fill-opacity', colorOpacity)
                .attr('fill', '#999')
                .attr(xProp, function(d) {
                    return categoryScale(genericBarView.getDataLabel(chartContext, d));
                })
                .attr(yProp, function() {
                    return countScale(0);
                })
                .attr(barThicknessProp, categoryScale.bandwidth())
                .attr(barMagnitudeProp, 0)

                // update bars that may have changed
                .merge(bars)
                .transition(t)
                .attr('fill', function (d, i) {
                    return genericBarView.getCategoryColor(chartContext,d);
                })
                .attr(xProp, function(d) {
                    return categoryScale(genericBarView.getDataLabel(chartContext, d));
                })
                .attr(yProp, function(d) {
                    var countValue = genericBarView.getCountValue(chartContext,d),
                        yPos = (genericBarView.defaults.isVerticalOrientation) ? Math.max(0,countValue) : Math.min(0,countValue);
                    return countScale(yPos);
                })
                .attr(barThicknessProp, categoryScale.bandwidth())
                .attr(barMagnitudeProp, function (d) {
                    var barMagnitude = countScale(genericBarView.getCountValue(chartContext,d));
                    return Math.abs(barMagnitude - countScale(0));
                });

            return d3Chart;
        },

        updateBarPatternOverlays: function(chartContext) {
            // duplicates the bars so that pattern-filled overlays can be superimposed
            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                categoryScale = chartContext.categoryScale,
                countScale = chartContext.countScale,
                overlayContrast = chartContext.patternOverlayContrast,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                barMagnitudeProp = 'height', // the variable dimension that shows magnitude of data value
                barThicknessProp = 'width',
                xProp = 'x',
                yProp = 'y';

            if (!this.defaults.isVerticalOrientation) {
                // bars grow horizontally
                barMagnitudeProp = 'width';
                barThicknessProp = 'height';
                xProp = 'y';
                yProp = 'x';
            }

            // join the new data with the existing
            var bars = chartContext.barGroup
                .selectAll('.csui-visual-count-bar-overlay')
                .data(chartData, function (d) {
                    return genericBarView.getDataValue(chartContext, d);
                });

            // remove any categories that are no longer in data
            bars.exit()
                .attr('fill-opacity', 0.3)
                .attr('fill','#000')
                .transition(t)
                .attr('fill-opacity', 0)
                .remove();

            // add bars for categories that are new in the data
            bars.enter()
                .append('rect')
                .attr('class', 'csui-visual-count-bar-overlay')
                .attr('fill-opacity', overlayContrast)
                .attr('fill', '#999')
                .attr(xProp, function(d) {
                    return categoryScale(genericBarView.getDataLabel(chartContext, d));
                })
                .attr(yProp, function() {
                    return countScale(0);
                })
                .attr(barThicknessProp, categoryScale.bandwidth())
                .attr(barMagnitudeProp, 0)

                // update bars that may have changed
                .merge(bars)
                .transition(t)
                .attr('fill', function (d, i) {
                    return genericBarView.getPatternFill(chartContext,d,i);
                })
                .attr(xProp, function(d) {
                    return categoryScale(genericBarView.getDataLabel(chartContext, d));
                })
                .attr(yProp, function(d) {
                    var countValue = genericBarView.getCountValue(chartContext,d),
                        yPos = (genericBarView.defaults.isVerticalOrientation) ? Math.max(0,countValue) : Math.min(0,countValue);
                    return countScale(yPos);
                })
                .attr(barThicknessProp, categoryScale.bandwidth())
                .attr(barMagnitudeProp, function (d) {
                    var barMagnitude = countScale(genericBarView.getCountValue(chartContext,d));
                    return Math.abs(barMagnitude - countScale(0));
                });

            return d3Chart;
        },

        updateValueLabels: function(chartContext) {

            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                categoryScale = chartContext.categoryScale,
                countScale = chartContext.countScale,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                isVertical = this.defaults.isVerticalOrientation,
                fontSize = this.getScaledFontSize(chartContext,'value'),
                barThickness = categoryScale.bandwidth(),
                xProp = 'x',
                yProp = 'y';

            if (!this.defaults.isVerticalOrientation) {
                xProp = 'y';
                yProp = 'x';
            }

            function getDisplayValue(d) {

                var displayValue = '',
                    countValue;

                if ((isVertical && barThickness > 24) || (!isVertical && barThickness >= fontSize)) {

                    // only show value labels if there is room
                    displayValue = genericBarView.formatCount(genericBarView.getCountValue(chartContext, d));

                    if (genericBarView.chartOptions.get('showAsPercentage')) {
                        countValue = genericBarView.getCountValue(chartContext, d);
                        if (countValue !== 0) {
                            displayValue = ((countValue / genericBarView.getTotalCount(chartData)) * 100).toFixed(1);
                        }
                        displayValue += '%';
                    }
                }

                return displayValue;
            }

            function getLabelPositionX(d) {
                // Note that X and Y are flipped for horizontal charts
                var dataLabel =  genericBarView.getDataLabel(chartContext, d) || genericBarView.getDataValue(chartContext, d),
                    labelPosition = categoryScale(dataLabel) + (barThickness / 2);

                if (!isVertical) {
                    labelPosition += (fontSize / 2);
                }

                return labelPosition;
            }

            function getLabelPositionY(d) {
                // Note that X and Y are flipped for horizontal charts
                var sign = genericBarView.checkSign(genericBarView.getCountValue(chartContext, d)) || 1, // zero is treated as positive for label offset purposes
                    labelOffset = genericBarView.defaults.barValueLabelsOffset,
                    labelPosition;

                if (isVertical) {
                    labelOffset += fontSize;
                    labelOffset = (labelOffset * sign) - fontSize;
                    labelPosition = countScale(genericBarView.getCountValue(chartContext,d)) - labelOffset;
                }
                else {
                    labelOffset = (labelOffset * sign);
                    labelPosition = countScale(genericBarView.getCountValue(chartContext,d)) + labelOffset;
                }

                return labelPosition;
            }

            function getTextAnchorPosition(d) {
                var anchorPos = 'middle';
                if (!isVertical) {
                    anchorPos = (genericBarView.getCountValue(chartContext, d) < 0) ? 'end' : 'start';
                }
                return anchorPos;
            }

            // join the new data with the existing
            var valueLabels = chartContext.valueLabels
                .selectAll('.csui-visual-count-value-label')
                .data(chartData, function (d) {
                    return genericBarView.getDataValue(chartContext, d);
                });

            // remove annotations for bars that are no longer present
            valueLabels
                .exit()
                .transition(t)
                .attr('fill-opacity',0)
                .delay(100)
                .remove();

            // add annotations for all new bars
            valueLabels
                .enter()
                .append('text')
                .attr('class', 'csui-visual-count-value-label')
                .attr('dy','-0.5em')
                .style('font-size', fontSize)
                .style('text-anchor', function(d) {
                    return getTextAnchorPosition(d);
                })
                .attr(xProp, function (d) {
                    return getLabelPositionX(d);
                })
                .attr(yProp, countScale(0))
                // update annotations for bars that may have changed height or position
                .merge(valueLabels)
                .attr('fill-opacity', 0.2)
                .transition(t)
                .attr('dy','-0.1em')
                .style('text-anchor', function(d) {
                    return getTextAnchorPosition(d);
                })
                .attr(xProp, function (d) {
                    return getLabelPositionX(d);
                })
                .attr(yProp, function (d) {
                    return getLabelPositionY(d);
                })
                .delay(100)
                .attr('fill-opacity', 1)
                .text(function(d) {
                    return getDisplayValue(d);
                });

            return d3Chart;
        },

        updateTicksWithAttrs: function(chartContext) {
            var d3Chart = chartContext.d3Chart;

            d3Chart.select('.y.axis')
                .selectAll('text')
                .attr('aria-label',function(d) {
                    return d;
                });

            d3Chart.select('.x.axis')
                .selectAll('text')
                .attr('aria-label',function(d) {
                    return d;
                });
        },

        updateTickLabelOrientation: function(chartContext) {
            var d3Chart = chartContext.d3Chart,
                categoryScale = chartContext.categoryScale,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                longestTickLabelWidth = 0,
                rotationDegree = 30,
                tickLabels = d3Chart.select('.x.axis')
                    .selectAll('text')
                    .style('font-size',this.getScaledFontSize(chartContext,'tick'))
                    .attr('dy', '0.8em');

            if (!this.defaults.isVerticalOrientation) {
                tickLabels = d3Chart.select('.y.axis')
                    .selectAll('text')
                    .style('font-size',this.getScaledFontSize(chartContext,'tick'))
                    .attr('dx', '-0.5em');
            }

            // iterate the categoryAxis tick labels and find the longest label
            _.each(tickLabels.nodes(), function(item) {
                var tickLabelWidth = item.getComputedTextLength();
                longestTickLabelWidth = (tickLabelWidth > longestTickLabelWidth) ? tickLabelWidth : longestTickLabelWidth;
            });

            // increase the severity of the tick rotation based on browser zoom level
            if (window.devicePixelRatio >= 2) {
                rotationDegree = -50;
            } 

            // perform a 2nd pass now that we have the width
            if (this.defaults.isVerticalOrientation) {
                // category labels on the X axis
                // note: rotation should be applied to all elements or none - not on a per label basis.
                if (longestTickLabelWidth > categoryScale.bandwidth()) {
                    tickLabels
                        .style('text-anchor', 'end')
                        .transition(t)
                        .attr('transform', function () {
                            return 'rotate(' + rotationDegree + ')';
                        });
                } else {
                    tickLabels
                        .style('text-anchor', 'middle')
                        .transition(t)
                        .attr('transform', function () {
                            return 'rotate(0)';
                        });
                }
            }
            else {
                // category labels on the Y axis
                if (longestTickLabelWidth > this.defaults.marginLeft) {
                    this.defaults.marginLeft = Math.min(this.defaults.marginLeftMax, longestTickLabelWidth);
                }
            }

        },

        updateTotal: function(chartContext){
            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                totalCount = this.getTotalCount(chartData),
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms);

            d3Chart.select('.csui-visual-count-total')
                .attr('fill-opacity',0)
                .transition(t)
                .attr('fill-opacity',1)
                .text(lang.Total+': ' + genericBarView.formatCount(totalCount));

            return d3Chart;
        },

        getCategoryScale: function(chartContext){
            var genericBarView = this,
                chartData = chartContext.chartData,
                limit = (this.defaults.isVerticalOrientation) ? chartContext.width : chartContext.height;

            return d3.scaleBand()
                .range([0, limit])
                .round(true)
                .padding(0.1)
                .domain(chartData.map(function (d) {
                    return genericBarView.getDataLabel(chartContext, d);
                }));
        },

        getCategoryAxis: function(chartContext){
            var categoryScale = chartContext.categoryScale,
                axisGenerator = (this.defaults.isVerticalOrientation) ? d3.axisBottom : d3.axisLeft;

            return axisGenerator(categoryScale).tickFormat(_.bind(this.shortenText,this));
        },

        getCountScale: function(){
            return d3.scaleLinear();
        },

        getCountAxis: function(chartContext){
            var genericBarView = this,
                countScale = chartContext.countScale,
                axisGenerator = (this.defaults.isVerticalOrientation) ? d3.axisLeft : d3.axisBottom,
                countAxisTicks =this.chartOptions.get('countAxisTicks');

            //return axisGenerator(countScale).ticks(countAxisTicks).tickFormat(_.bind(genericBarView.formatCount, genericBarView));
            return axisGenerator(countScale);

        },

        appendGroups: function (chartContext) {
            var genericBarView = this,
                d3Chart = chartContext.d3Chart;

            return d3Chart.append('g')
                .attr('transform', 'translate(' + genericBarView.getMarginLeft() + ',' + genericBarView.getMarginTop() + ')')
                .attr('class', 'csui-visual-count-bar-chart');
        },

        appendXAxisGroup: function(chartContext) {
            var d3Chart = chartContext.d3Chart;

            return d3Chart.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + chartContext.height + ')');
        },

        appendYAxisGroup: function(chartContext) {
            var d3Chart = chartContext.d3Chart;

            return d3Chart.append('g')
                .attr('class', 'y axis');
        },

        appendZeroLine: function(chartContext) {

            var d3Chart = chartContext.d3Chart,
                zeroLineLimit = chartContext.width,
                zeroLinePos = chartContext.height,
                zeroLineStart = 'x1',
                zeroLineEnd = 'x2';
            // note that 'x1','x2' and 'y1','y2' are expected property names in D3 API.

            if (!this.defaults.isVerticalOrientation) {
                zeroLinePos = chartContext.width;
                zeroLineStart = 'y1';
                zeroLineEnd = 'y2';
                zeroLineLimit = chartContext.height;
            }

            return d3Chart.append('g')
                .attr('class', 'csui-visual-count-zero-line')
                .append('line')
                .attr(zeroLineStart,0)
                .attr(zeroLineEnd,zeroLineLimit)
                .attr('transform', 'translate(0,' + zeroLinePos + ')');
        },

        appendGridlinesGroup: function(chartContext) {
            var d3Chart = chartContext.d3Chart;

            return d3Chart.append('g')
                .attr('class', 'csui-visual-count-gridlines');
        },

        appendXAxisLabel: function(chartContext){
            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                width = chartContext.width,
                height = chartContext.height,
                xAxisLabel = (this.defaults.isVerticalOrientation) ? genericBarView.getActiveColumnLabel(chartContext) : lang.TotalCount,
                label = d3Chart.append('g').attr('class','csui-visual-count-axis-label'),
                backgroundColor = this.defaults.chartBackgroundColor,
                textColor = this.defaults.chartTextColor;

            label.append('rect')
                .attr('class', 'csui-visual-count-x-label-background')
                .attr('y', height + genericBarView.getMarginBottom() - (this.getScaledFontSize(chartContext,'axis')*2))
                .attr('x', 0)
                .attr('width', width)
                .attr('height', this.getScaledFontSize(chartContext,'axis') + 3)
                .style('fill', backgroundColor)
                .style('fill-opacity', 0.8);

            label.append('text')
                .attr('class', 'csui-visual-count-x-label')
                .text(xAxisLabel)
                .attr('y', height + genericBarView.getMarginBottom() - 15)
                .attr('x', (width / 2))
                .style('text-anchor', 'middle')
                .style('fill', textColor)
                .style('font-size', this.getScaledFontSize(chartContext,'axis'));

            return label;
        },

        appendYAxisLabel: function(chartContext){
            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                height = chartContext.height,
                yAxisLabel = (this.defaults.isVerticalOrientation) ? lang.TotalCount : genericBarView.getActiveColumnLabel(chartContext),
                label = d3Chart.append('g').attr('class','csui-visual-count-axis-label'),
                backgroundColor = this.defaults.chartBackgroundColor,
                textColor = this.defaults.chartTextColor;

            label.append('rect')
                .attr('class', 'csui-visual-count-x-label-background')
                .attr('y', 0)
                .attr('x', -genericBarView.getMarginLeft())
                .attr('width', this.getScaledFontSize(chartContext,'axis') + 3)
                .attr('height', height)
                .style('fill', backgroundColor)
                .style('fill-opacity', 0.8);

            label.append('text')
                .attr('class', 'csui-visual-count-y-label')
                .text(yAxisLabel)
                .attr('transform', 'rotate(-90)')
                .attr('y', -genericBarView.getMarginLeft())
                .attr('x', -(height / 2))
                .attr('dy', this.getScaledFontSize(chartContext,'axis'))
                .style('fill', textColor)
                .style('text-anchor', 'middle')
                .style('font-size', this.getScaledFontSize(chartContext,'axis'));

            return label;
        },

        appendBarGroup: function(chartContext){

            var d3Chart = chartContext.d3Chart;

            return d3Chart.append('g').attr('class', 'csui-visual-count-bars');
        },

        appendBarValueLabels: function(chartContext){

            var d3Chart = chartContext.d3Chart;

            return d3Chart.append('g').attr('class', 'csui-visual-count-chart-labels');

        },

        appendTotalCount: function(chartContext){
            var genericBarView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                height = chartContext.height,
                totalCount = genericBarView.getTotalCount(chartData),
                textColor = this.defaults.chartTextColor;

            d3Chart.append('text')
                .attr('class', 'csui-visual-count-total')
                .attr('text-anchor', 'left')
                .attr('alignment-baseline', 'baseline')
                .attr('y', height + genericBarView.getMarginBottom() - 15)
                .attr('x', 0 - genericBarView.getMarginLeft() + 20)
                .text(lang.Total+': ' + genericBarView.formatCount(totalCount))
                .style('fill', textColor)
                .style('font-size', this.getScaledFontSize(chartContext,'total'));

        }
    });

    return VisualCountBarView;

});

csui.define('csui/controls/charts/visual.count/impl/chart.types/bar/visual.count.verticalbar.view',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/d3', // 3rd party libraries
    'csui/controls/charts/visual.count/impl/visual.count.chart.view',
    'csui/controls/charts/visual.count/impl/chart.types/visual.count.bar.view'
], function (_, $, d3, VisualCountChartView, VisualCountBarView) {

    var VisualCountVerticalBarView = VisualCountBarView.extend({

        constructor: function VisualCountVerticalBarView(options) {
            VisualCountBarView.prototype.constructor.apply(this, arguments);

            this.defaults = _.defaults({
                // override any defaults set in VisualCountChartView
                marginTop: (this.chartOptions.get('chartTitle')) ? 50 : 30,
                marginLeft: (this.chartOptions.get('showAxisLabels')) ? 80 : (this.chartOptions.get('showCountAxis')) ? 60 : 30,
                marginBottom: (this.chartOptions.get('showAxisLabels') || this.chartOptions.get('showTotal')) ? 100 : 80,
                marginRight: 30,
                barValueLabelsOffset: 6,
                isVerticalOrientation: true
            }, VisualCountBarView.prototype.defaults);
        },

        chartType: 'verticalBar'

    });

    return VisualCountVerticalBarView;

});

csui.define('csui/controls/charts/visual.count/impl/chart.types/bar/visual.count.horizontalbar.view',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/d3', // 3rd party libraries
    'csui/controls/charts/visual.count/impl/visual.count.chart.view',
    'csui/controls/charts/visual.count/impl/chart.types/visual.count.bar.view'
], function (_, $, d3, VisualCountChartView, VisualCountBarView) {

    var VisualCountHorizontalBarView = VisualCountBarView.extend({

        constructor: function VisualCountHorizontalBarView(options) {
            VisualCountBarView.prototype.constructor.apply(this, arguments);

            var marginBottom = 30;

            if (this.chartOptions.get('showCountAxis')) {
                marginBottom += 20;
            }

            if (this.chartOptions.get('showAxisLabels') || this.chartOptions.get('showTotal')) {
                marginBottom += 40;
            }

            this.defaults = _.defaults({
                // override any defaults set in VisualCountChartView
                marginTop: (this.chartOptions.get('chartTitle')) ? 50 : 30,
                marginLeft: (this.chartOptions.get('showAxisLabels')) ? 140 : 120,
                marginLeftMax: 200,
                marginBottom: marginBottom,
                marginRight: 30,
                barValueLabelsOffset: 8,
                isVerticalOrientation: false
            }, VisualCountBarView.prototype.defaults);
        },

        chartType: 'horizontalBar'

    });

    return VisualCountHorizontalBarView;

});

csui.define('csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.pie.view',[
    'csui/lib/underscore', 'csui/lib/d3', // 3rd party libraries
    'csui/controls/charts/visual.count/impl/visual.count.chart.view',
    'i18n!csui/controls/charts/visual.count/impl/nls/lang'
], function (_, d3, VisualCountChartView,lang) {

    var VisualCountPieView = VisualCountChartView.extend({

        constructor: function VisualCountPieView(options) {
            // Call the parent constructor to ensure the object is built with all the inherited features.
            VisualCountChartView.prototype.constructor.apply(this, arguments);

            this.defaults = _.defaults({
                // override any defaults set in VisualCountChartView
                marginTop: (this.chartOptions.get('chartTitle')) ? 60 : 40,
                marginRight: 30,
                marginBottom: 30,
                marginLeft: 30,
                innerRadius: 0,
                innerRadiusNudge: function(radius) {
                    return radius / 2;
                },
                outerRadius: function(radius){
                    return radius;
                },
                innerLabelRadius: function(radius){
                    return radius - 10;
                },
                outerLabelRadius: function(radius){
                    return radius + 40;
                },
                maxLegendLabelChars: 28

            },VisualCountChartView.prototype.defaults);

        },

        chartType: 'pie',

        create: function(chartContext) {
            var pieChartView = this;

            chartContext.theme = this.getTheme(this.chartOptions.get('themeName'));
            chartContext.pie = d3.pie()
                .sort(null)
                .value(function (d) {
                    return pieChartView.getCountValue(chartContext, d);
                });

            chartContext.radius = pieChartView.getRadius(chartContext.height, chartContext.width);
            chartContext.arc = d3.arc()
                .innerRadius(pieChartView.getInnerRadius(chartContext.radius))
                .outerRadius(pieChartView.getOuterRadius(chartContext.radius));
            chartContext.labelArc = d3.arc()
                .innerRadius(pieChartView.getInnerLabelRadius(chartContext.radius))
                .outerRadius(pieChartView.getOuterLabelRadius(chartContext.radius));
            chartContext.innerLabelArc = d3.arc()
                .innerRadius(pieChartView.getInnerRadiusNudge(chartContext.radius))
                .outerRadius(pieChartView.getOuterRadius(chartContext.radius));
            chartContext.legendHeightRatio = this.defaults.legendHeightRatio;
            chartContext.patternOverlayContrast = this.chartOptions.get('patternOverlayContrast');

            chartContext.arcTween = function(newSlice) {
                var i = d3.interpolate(this.currentSlice, newSlice);
                this.currentSlice = i(0);
                return function (t) {
                    return chartContext.arc(i(t));
                };
            },
            chartContext.arcCentroid = function(d) {
                // note this function is necessary due to some browsers converting small numbers to scientific notation strings
                // these are not valid in a SVG transform syntax.
                // see the d3 API under d3.interpolateNumber() for more info
                var x = chartContext.arc.centroid(d)[0],
                    y = chartContext.arc.centroid(d)[1],
                    centroid = {
                        x: !isNaN(x) ? x : 0,
                        y: !isNaN(y) ? y : 0
                    };

                return centroid;
            };

            if (this.chartOptions.get('showTotal')) {
                pieChartView.appendTotal(chartContext);
            }
            chartContext.chartCreated = true;
            pieChartView.update(chartContext);

            return chartContext.d3Chart;
        },

        update: function(chartContext) {
            var pieChartView = this;

            pieChartView.updateSlices(chartContext);
            if (chartContext.showPatternOverlay) {
                pieChartView.updateSlicePatternOverlays(chartContext);
            }
            if (this.chartOptions.get('showLegend')) {
                pieChartView.updateLegend(chartContext);
                _.delay(function() {
                    // allow a short timeout to allow for SVG render time.
                    pieChartView.updateLegendLabelSize(chartContext);
                },300);
            }
            else {
                pieChartView.updateSliceLabelLines(chartContext);
                pieChartView.updateCategoryLabels(chartContext);
            }
            if (this.chartOptions.get('showValueLabels')) {
                pieChartView.updateValueLabels(chartContext);
            }
            if (this.chartOptions.get('showTotal')) {
                pieChartView.updateTotal(chartContext);
            }

            pieChartView.updateA11yTable(chartContext);
        },

        updateSlices: function(chartContext) {

            var pieChartView = this,
                chartData = chartContext.chartData,
                d3Chart = chartContext.d3Chart,
                pie = chartContext.pie,
                arc = chartContext.arc,
                arcTween = chartContext.arcTween,
                arcCentroid = chartContext.arcCentroid,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                colorOpacity = chartContext.theme.opacity;

            // join the data with the slices
            var pieSlices = d3Chart.select('.csui-visual-count-pie-chart')
                .selectAll('.csui-visual-count-pie-slice')
                .data(pie(chartData));

            // remove unwanted slices
            pieSlices
                .exit()
                .attr('fill','#999')
                .transition(t)
                .attr('fill-opacity',0)
                .remove();

            // update existing slices
            pieSlices
                .transition(t)
                .attr('fill', function (d) {
                    return pieChartView.getCategoryColor(chartContext,d.data);
                })
                .attrTween('d',arcTween);

            // enter new slices
            pieSlices
                .enter()
                .append('g')
                .attr('class', 'csui-visual-count-pie-slice-group')
                .append('path')
                .attr('class', 'csui-visual-count-pie-slice')
                .attr('fill', '#999')
                .attr('d',arc)
                .attr('transform',function(d) {
                    return 'translate(' + arcCentroid(d).x + ',' + arcCentroid(d).y + ')';
                })
                .attr('fill-opacity',0)
                .transition(t)
                .attr('transform','translate(0,0)')
                .attr('fill-opacity', colorOpacity)
                .attr('fill', function (d) {
                    return pieChartView.getCategoryColor(chartContext,d.data);
                })
                .each(function(d) {
                    this.currentSlice = d;
                });

            return d3Chart;

        },

        updateSlicePatternOverlays: function(chartContext) {

            var pieChartView = this,
                chartData = chartContext.chartData,
                d3Chart = chartContext.d3Chart,
                pie = chartContext.pie,
                arc = chartContext.arc,
                arcTween = chartContext.arcTween,
                arcCentroid = chartContext.arcCentroid,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                overlayContrast = chartContext.patternOverlayContrast;

            // join the data with the slices
            var pieSlices = d3Chart.select('.csui-visual-count-pie-chart')
                .selectAll('.csui-visual-count-pie-slice-overlay')
                .data(pie(chartData));

            // remove unwanted slices
            pieSlices
                .exit()
                .attr('fill','#999')
                .transition(t)
                .attr('fill-opacity',0)
                .remove();

            // update existing slices
            pieSlices
                .transition(t)
                .attr('fill', function (d,i) {
                    return pieChartView.getPatternFill(chartContext,d,i);
                })
                .attr('fill-opacity', overlayContrast)
                .attrTween('d',arcTween);

            // enter new slices
            pieSlices
                .enter()
                .append('g')
                .attr('class', 'csui-visual-count-pie-slice-group')
                .append('path')
                .attr('class', 'csui-visual-count-pie-slice-overlay')
                .attr('fill', '#999')
                .attr('d',arc)
                .attr('transform',function(d) {
                    return 'translate(' + arcCentroid(d).x + ',' + arcCentroid(d).y + ')';
                })
                .attr('fill-opacity',0)
                .transition(t)
                .attr('transform','translate(0,0)')
                .attr('fill-opacity', overlayContrast)
                .attr('fill', function (d,i) {
                    return pieChartView.getPatternFill(chartContext,d,i);
                })
                .each(function(d) {
                    this.currentSlice = d;
                });

            return d3Chart;

        },

        updateCategoryLabels: function(chartContext){

            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                pie = chartContext.pie,
                pieLabel = pieChartView.pieLabel,
                labelArc = chartContext.labelArc,
                ms = chartContext.transitionDuration,
                label = false,
                t = d3.transition().duration(ms);

            function textAnchor(d) {
                // anchor text left or right depending on x position relative to center
                return (labelArc.centroid(d)[0] < 0) ? 'end' : 'start';
            }

            if (!pieChartView.chartOptions.get('showLegend')) {
                label = true;
            }

            // join the data with the slices
            var categoryLabels = d3Chart.select('.csui-visual-count-pie-chart')
                .selectAll('.csui-visual-count-chart-label.outside')
                .data(pie(chartData));

            // update existing labels
            categoryLabels
                .transition(t)
                .attr('transform', function (d) {
                    return 'translate(' + labelArc.centroid(d) + ')';
                })
                .attr('text-anchor', textAnchor)
                .attr('aria-label', function (d) {
                    return pieLabel(chartContext,d,pieChartView,true);
                })
                .text(function(d) {
                    return (d.value !== 0) ? pieLabel(chartContext,d,pieChartView,true) : '';
                });

            categoryLabels
                .exit()
                .transition(t)
                .attr('fill-opacity',0)
                .remove();

            categoryLabels
                .enter()
                .append('text')
                .attr('class', 'csui-visual-count-chart-label outside')
                .style('font-size', this.getScaledFontSize(chartContext,'radial'))
                .attr('fill-opacity',0)
                .attr('transform', function (d) {
                    return 'translate(' + labelArc.centroid(d) + ')';
                })
                .transition(t)
                .attr('fill-opacity',1)
                .attr('text-anchor', textAnchor)
                .attr('alignment-baseline', 'middle')
                .attr('aria-label', function (d) {
                    return pieLabel(chartContext,d,pieChartView,true);
                })
                .text(function(d) {
                    return (d.value !== 0) ? pieLabel(chartContext,d,pieChartView,true) : '';
                });

            return d3Chart;
        },

        updateValueLabels: function(chartContext){

            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                pie = chartContext.pie,
                pieLabel = pieChartView.pieLabel,
                innnerLabelArc = chartContext.innerLabelArc,
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms);

            // join the data with the slices
            var valueLabels = d3Chart.select('.csui-visual-count-pie-chart')
                .selectAll('.csui-visual-count-value-label')
                .data(pie(chartData));

            // update existing labels
            valueLabels
                .transition(t)
                .attr('transform', function (d) {
                    return 'translate(' + innnerLabelArc.centroid(d) + ')';
                })
                .attr('aria-label', function (d) {
                    return pieLabel(chartContext,d,pieChartView);
                })
                .text(function(d) {
                    return (d.value !== 0) ? pieLabel(chartContext,d,pieChartView) : '';
                });

            valueLabels
                .exit()
                .transition(t)
                .attr('fill-opacity',0)
                .remove();

            valueLabels
                .enter()
                .append('text')
                .attr('class', 'csui-visual-count-value-label inside')
                .style('font-size', this.getScaledFontSize(chartContext,'value'))
                .attr('fill-opacity',0)
                .attr('transform', function (d) {
                    return 'translate(' + innnerLabelArc.centroid(d) + ')';
                })
                .transition(t)
                .attr('fill-opacity',1)
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr('aria-label', function (d) {
                    return pieLabel(chartContext,d,pieChartView);
                })
                .text(function(d) {
                    return (d.value !== 0) ? pieLabel(chartContext,d,pieChartView) : '';
                });

            return d3Chart;
        },

        updateSliceLabelLines: function(chartContext) {

            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                pie = chartContext.pie,
                radius = chartContext.radius,
                lineStartArc = d3.arc()
                    .innerRadius(radius)
                    .outerRadius(pieChartView.getOuterRadius(radius)),
                lineEndArc = d3.arc()
                    .innerRadius(radius)
                    .outerRadius(pieChartView.getOuterLabelRadius(radius) - 20),
                lineGenerator = d3.line(),
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms);

            // join the data with the slices
            var pieSliceLabelLines = d3Chart.select('.csui-visual-count-pie-chart')
                .selectAll('.csui-visual-count-chart-labelline')
                .data(pie(chartData));

            pieSliceLabelLines
                .attr('stroke-opacity',0)
                .transition(t)
                .attr('stroke-opacity',1)
                .attr('d', function(d) {
                    var points = [lineStartArc.centroid(d), (d.value === 0) ? lineStartArc.centroid(d) : lineEndArc.centroid(d)];
                    return lineGenerator(points);
                });

            pieSliceLabelLines.exit()
                .transition(t)
                .attr('stroke-opacity',0)
                .remove();

            pieSliceLabelLines.enter()
                .append('path')
                .attr('stroke-opacity',0)
                .attr('class','csui-visual-count-chart-labelline')
                .transition(t)
                .attr('stroke-opacity',1)
                .attr('d', function(d) {
                    var points = [lineStartArc.centroid(d), (d.value === 0) ? lineStartArc.centroid(d) : lineEndArc.centroid(d)];
                    return lineGenerator(points);
                });

            return d3Chart;
        },

        updateLegend: function(chartContext){

            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                pieLegendContainer = d3Chart.select('.csui-visual-count-pie-legend-container'),
                colorOpacity = chartContext.theme.opacity,
                overlayContrast = chartContext.patternOverlayContrast,
                chartHeight = this.getChartHeight(chartContext),
                activeColumn = this.getActiveColumnLabel(chartContext),
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                fontSize = getLegendFontSize(),
                legendLabels,
                longestLegendLabelWidth,
                textColor = this.defaults.chartTextColor,
                patternOverlays = this.chartOptions.get('themeName') === 'dataClarityPatterned';

            function getLegendFontSize() {
                // provides a variable size according to number of categories
                var fontSize = pieChartView.getScaledFontSize(chartContext,'legend'),
                    maxFontSize = pieChartView.defaults.labelTypes.legend.max,
                    minFontSize = pieChartView.defaults.labelTypes.legend.min,
                    margins = pieChartView.defaults.marginTop + pieChartView.defaults.marginBottom;

                // calculate the total height of all legends
                if ((fontSize * chartData.length) + margins > chartHeight) {
                    fontSize = chartHeight / (chartData.length + margins);
                }

                fontSize = (fontSize > maxFontSize) ? maxFontSize : fontSize;
                fontSize = (fontSize < minFontSize) ? minFontSize : fontSize;

                return fontSize;
            }

            function legendYPos(i) {
                var legendHeight = fontSize * 1.6,
                    offset = (legendHeight * chartData.length) / 2;

                return (i * legendHeight) - offset;
            }

            function explode(d, offset) {
                var radial = (d.startAngle + d.endAngle) / 2,
                    offsetX = Math.sin(radial) * offset,
                    offsetY = -Math.cos(radial) * offset;
                return {
                    x: offsetX,
                    y: offsetY
                };
            }

            var legends = pieLegendContainer.selectAll('.csui-visual-count-pie-legend')
                    .data(chartData);

            // update existing legends

            legends
                .transition(t)
                .attr('transform', function (d,i) {
                    return 'translate(0,' + legendYPos(i) + ')';
                });

            legends
                .select('.csui-visual-count-pie-legend-text')
                .style('font-size', fontSize)
                .style('fill', textColor)
                .attr('fill-opacity', 0)
                .transition(t)
                .attr('fill-opacity', 1)
                .attr('dx', fontSize * 1.1)
                .attr('dy', fontSize)
                .attr('aria-label',function (d) {
                    return pieChartView.getDataLabel(chartContext, d);
                })
                .text(function (d) {
                    return pieChartView.getDataLabel(chartContext, d);
                });

            legends
                .select('.csui-visual-count-pie-legend-swatch')
                .attr('r', fontSize / 1.5)
                .attr('cy',fontSize - (fontSize / 3))
                .attr('fill-opacity', colorOpacity)
                .attr('fill', function (d) {
                    return pieChartView.getCategoryColor(chartContext,d);
                });

            if (patternOverlays) {
                // apply pattern overlay to swatches
                legends
                    .select('.csui-visual-count-pie-legend-swatch-overlay')
                    .attr('r', fontSize / 1.5)
                    .attr('cy', fontSize - (fontSize / 3))
                    .attr('fill-opacity', overlayContrast)
                    .attr('fill', function (d, i) {
                        return pieChartView.getPatternFill(chartContext, d, i);
                    });
            }

            // remove unwanted legends
            var legendsExit = legends.exit();

            legendsExit
                .select('.csui-visual-count-pie-legend-text')
                .transition(t)
                .attr('fill-opacity',0);

            legendsExit
                .select('.csui-visual-count-pie-legend-swatch')
                .attr('fill','#999')
                .transition(t)
                .attr('fill-opacity',0);

            legendsExit
                .transition(t)
                .remove();

            // enter new legends
            var legendsEnter = legends.enter()
                .append('g')
                .attr('class', 'csui-visual-count-pie-legend')
                .on('mousedown', function (target,index) {
                    d3Chart.selectAll('.csui-visual-count-pie-slice,.csui-visual-count-pie-legend-swatch,.csui-visual-count-pie-legend-text')
                        .attr('fill-opacity', 0.3)
                        .filter(function (d,i) {
                            return i === index;
                        })
                        .attr('fill-opacity', 1);
                    d3Chart.selectAll('.csui-visual-count-pie-slice')
                        .filter(function (d,i) {
                            return i === index;
                        })
                        .attr('transform', function(d) {
                            var offset = explode(d,10);
                            return 'translate(' + offset.x + ',' + offset.y + ')';
                        });
                })
                .on('mouseup', function () {
                    d3Chart.selectAll('.csui-visual-count-pie-slice,.csui-visual-count-pie-legend-swatch,.csui-visual-count-pie-legend-text')
                        .attr('fill-opacity', colorOpacity);
                    d3Chart.selectAll('.csui-visual-count-pie-slice')
                        .attr('transform', function() {
                            return 'translate(0,0)';
                        });
                });

            legendsEnter
                .attr('transform', 'translate(0,0)')
                .transition(t)
                .attr('transform', function (d,i) {
                    return 'translate(0,' + legendYPos(i) + ')';
                });

            legendsEnter
                .append('circle')
                .attr('class', 'csui-visual-count-pie-legend-swatch')
                .attr('fill-opacity',0)
                .transition(t)
                .attr('fill-opacity', colorOpacity)
                .attr('fill', function (d) {
                    return pieChartView.getCategoryColor(chartContext,d);
                })
                .attr('r', fontSize / 1.5)
                .attr('cx',0)
                .attr('cy',fontSize - (fontSize / 3));

            if (patternOverlays) {
                // apply pattern overlay to swatches
                legendsEnter
                    .append('circle')
                    .attr('class','csui-visual-count-pie-legend-swatch-overlay')
                    .attr('r', fontSize / 1.5)
                    .attr('cy', fontSize - (fontSize / 3))
                    .attr('fill-opacity', overlayContrast)
                    .attr('fill', function (d, i) {
                        return pieChartView.getPatternFill(chartContext, d, i);
                    });
            }

            legendsEnter
                .append('text')
                .attr('class', 'csui-visual-count-pie-legend-text')
                .style('font-size', fontSize)
                .style('fill', textColor)
                .attr('fill-opacity',0)
                .transition(t)
                .delay(200)
                .attr('fill-opacity',1)
                .attr('dx', fontSize * 1.1)
                .attr('dy', fontSize)
                .attr('aria-label',function (d) {
                    return pieChartView.getDataLabel(chartContext, d);
                })
                .text(function (d) {
                    return pieChartView.getDataLabel(chartContext, d);
                });

            if (this.chartOptions.get('showAxisLabels')) {
                // update the legend title
                var legendTitle = pieLegendContainer;

                legendTitle
                    .select('.csui-visual-count-pie-legend-active-column')
                    .transition(t)
                    .attr('fill-opacity', 0)
                    .remove();

                legendTitle
                    .append('text')
                    .attr('class', 'csui-visual-count-pie-legend-active-column')
                    .style('font-size', this.getScaledFontSize(chartContext,'legendTitle'))
                    .style('fill', textColor)
                    .attr('fill-opacity', 0)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'baseline')
                    .attr('y', 0)
                    .attr('x', 0)
                    .attr('dy', -this.getScaledFontSize(chartContext,'legendTitle') * 1.3)
                    .transition(t)
                    .attr('fill-opacity', 1)
                    .text(activeColumn);
            }
        },

        updateLegendLabelSize: function(chartContext) {
            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                legendLabels = d3Chart.selectAll('.csui-visual-count-pie-legend-text'),
                maxLegendWidth = chartContext.width / 4;

            _.each(legendLabels.nodes(), function(item) {
                var text = item.textContent;
                if (item.getComputedTextLength() > maxLegendWidth) {
                    text = text.substring(0, pieChartView.defaults.maxLegendLabelChars);
                    text += '...';
                    item.textContent = text;
                }
            });
        },

        updateTotal: function(chartContext){
            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                totalCount = this.getTotalCount(chartData),
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms),
                textColor = this.defaults.chartTextColor;

            d3Chart.select('.csui-visual-count-total')
                .attr('fill-opacity',0)
                .transition(t)
                .attr('fill-opacity',1)
                .style('fill', textColor)
                .text(lang.Total + ': ' + pieChartView.formatCount(totalCount));

            return d3Chart;
        },

        getRadius: function(height, width){
            return Math.min(width / 3, height / 2); // 1/3 of width or half of height
        },
        
        getInnerRadius: function(radius){
            return _.isFunction(this.defaults.innerRadius) ? this.defaults.innerRadius.call(this, radius) : this.defaults.innerRadius;
        },

        getInnerRadiusNudge: function(radius){
            return _.isFunction(this.defaults.innerRadiusNudge) ? this.defaults.innerRadiusNudge.call(this, radius) : this.defaults.innerRadiusNudge;
        },
        
        getOuterRadius: function(radius){
            return _.isFunction(this.defaults.outerRadius) ? this.defaults.outerRadius.call(this, radius) : this.defaults.outerRadius;
        },

        getInnerLabelRadius: function(radius){
            return _.isFunction(this.defaults.innerLabelRadius) ? this.defaults.innerLabelRadius.call(this, radius) : this.defaults.innerLabelRadius;
        },

        getOuterLabelRadius: function(radius){
            return _.isFunction(this.defaults.outerLabelRadius) ? this.defaults.outerLabelRadius.call(this, radius) : this.defaults.outerLabelRadius;
        },

        appendGroups: function (chartContext) {
            var d3Chart = chartContext.d3Chart,
                minPadding = 60, // minimum padding between chart and legend when widget width is reduced
                pieCenter = chartContext.pieCenter,
                height = chartContext.height;

            d3Chart.append('g')
                   .attr('transform', 'translate(' + this.getMarginLeft() + ',' + this.getMarginTop() + ')')
                   .attr('class', 'csui-visual-count-vis-wrapper');

            d3Chart.select('.csui-visual-count-vis-wrapper')
                   .append('g')
                   .attr('class', 'csui-visual-count-pie-chart')
                   .attr('transform', 'translate(' + pieCenter.x + ',' + pieCenter.y + ')');

            if (this.chartOptions.get('showLegend')) {
                d3Chart.select('.csui-visual-count-vis-wrapper')
                    .append('g')
                    .attr('class', 'csui-visual-count-pie-legend-container')
                    .attr('height', height)
                    .attr('transform', 'translate(' + (pieCenter.x * 2 + minPadding) + ',' + pieCenter.y + ')'); // center at 2/3 + padding
            }

            return d3Chart;
        },

        appendTotal: function(chartContext) {
            var d3Chart = chartContext.d3Chart,
                height = chartContext.height;

            d3Chart.select('.csui-visual-count-vis-wrapper')
                .append('g')
                .attr('class', 'csui-visual-count-pie-total-container')
                .append('text')
                .attr('class', 'csui-visual-count-total')
                .style('font-size', this.getScaledFontSize(chartContext,'total'))
                .attr('text-anchor', 'left')
                .attr('alignment-baseline', 'baseline')
                .attr('y', height + this.getMarginBottom() - 15)
                .attr('x', 0 - this.getMarginLeft() + 20);
        },

        pieLabel: function(chartContext,d,pieChartView,label) {
            var actual = pieChartView.getCountValue(chartContext, d.data),
                percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1),
                radius = chartContext.radius,
                arcSize = d.endAngle - d.startAngle, // in radians
                minRadius = 60, // minimum radius for labels to appear
                minArcLength = 30; // ratio of radius to arcSize to determine if label will appear on this arc (arcSize / minArcSizeRatio)

            if (label) {
                // show category label
                label = pieChartView.getDataLabel(chartContext, d.data);
            }
            else {
                // numeric value or percentage
                label = (pieChartView.chartOptions.get('showAsPercentage')) ? percentage + ' %' : pieChartView.formatCount(actual);
                // hide label if no room
                label = ((radius * arcSize >= minArcLength) && (radius >= minRadius)) ? label : '';
                // hide label if value is zero
                label = (d.value !== 0) ? label : '';
            }

            return label;
        }

    });

    return VisualCountPieView;

});

csui.define('csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.donut.view',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/d3', // 3rd party libraries
    'csui/controls/charts/visual.count/impl/visual.count.chart.view',
    'csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.pie.view',
    'i18n!csui/controls/charts/visual.count/impl/nls/lang'
], function (_, $, d3, VisualCountChartView, VisualCountPieView, lang) {

    var VisualCountDonutView = VisualCountPieView.extend({

        constructor: function VisualCountDonutView(options) {
            VisualCountPieView.prototype.constructor.apply(this, arguments);

            this.defaults = _.defaults({
                marginTop: (this.chartOptions.get('chartTitle')) ? 50 : 40,
                marginRight: 30,
                marginBottom: 30,
                marginLeft: 30,
                donutWidth: 1.5,
                outerRadius: function(radius){
                    return radius;
                },
                innerLabelRadius: function(radius){
                    return radius - 10;
                },
                outerLabelRadius: function(radius){
                    return radius + 50;
                }
            },VisualCountPieView.prototype.defaults);

            this.defaults.innerRadius = function(radius){
                return radius / this.defaults.donutWidth;
            };

            this.defaults.innerRadiusNudge = function(radius){
                return radius / this.defaults.donutWidth;
            };
        },

        chartType: 'donut',

        appendTotal: function(chartContext){

            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                pieCenter = chartContext.pieCenter,
                height = chartContext.height,
                width = chartContext.width,
                totalCount = this.getTotalCount(chartData),
                textColor = this.defaults.chartTextColor;

            function fontSizeForTotal(innerDiscSize) {
                var stringLength = (pieChartView.formatCount(totalCount).length),
                    fontRatios = [1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8], // a hash is faster than Math ;-)
                    fontRatio = (stringLength <= fontRatios.length) ? fontRatios[stringLength - 1] : 12; // 12 is smallest size possible
                return innerDiscSize / fontRatio;
            }

            var minFontSize = 10,
                radius = this.getRadius(height, width),
                donutWidth = this.defaults.donutWidth,
                innerDiscMargin = 10,
                donutHole = (radius / donutWidth) - innerDiscMargin > 0 ? (radius / donutWidth) - innerDiscMargin : 0,
                valueFontSize = (fontSizeForTotal(radius / donutWidth) >= minFontSize) ? fontSizeForTotal(radius / donutWidth) : minFontSize,
                labelRatio = 2.8,
                valueOffsetRatio = 10,
                labelOffsetRatio = 1.5,
                donutTotal = d3Chart.select('.csui-visual-count-vis-wrapper')
                    .append('g')
                    .attr('class','csui-visual-count-pie-total-roundel')
                    .attr('transform', 'translate(' + pieCenter.x + ',' + pieCenter.y + ')'); // center at 1/3

            donutTotal.append('g')
                .attr('class', 'csui-visual-count-pie-total-label-disc')
                .append('circle')
                .attr('transform', 'translate(0,0)')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', donutHole);

            donutTotal.append('text')
                .attr('transform', 'translate(0,' + (-(valueFontSize / labelOffsetRatio)) + ')')
                .attr('class', 'csui-visual-count-pie-total-label')
                .attr('text-anchor', 'middle')
                .attr('font-size', valueFontSize / labelRatio)
                .style('fill', textColor)
                .text(function () {
                 // only show label if font is big enough
                 return (valueFontSize / labelRatio >= 8) ? lang.Total : '';
                });

            donutTotal.append('text')
                .attr('class', 'csui-visual-count-total')
                .attr('transform', 'translate(0,' + (valueFontSize / valueOffsetRatio) + ')')
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr('font-size', valueFontSize) // pass in the inner disc radius to get the right font size
                .style('fill', textColor)
                .text(pieChartView.formatCount(totalCount));
        },

        updateTotal: function(chartContext){
            var pieChartView = this,
                d3Chart = chartContext.d3Chart,
                chartData = chartContext.chartData,
                totalCount = this.getTotalCount(chartData),
                ms = chartContext.transitionDuration,
                t = d3.transition().duration(ms);

            d3Chart.select('.csui-visual-count-total')
                .attr('fill-opacity',0)
                .transition(t)
                .duration(ms)
                .attr('fill-opacity',1)
                .text(pieChartView.formatCount(totalCount));

            return d3Chart;
        }
    });

    return VisualCountDonutView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/charts/visual.count/impl/visual.count.empty',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-visual-count-empty\"><p class=\"csui-visual-count-nodata-message\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"text") || (depth0 != null ? lookupProperty(depth0,"text") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"text","hash":{},"loc":{"start":{"line":1,"column":88},"end":{"line":1,"column":96}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"text") || (depth0 != null ? lookupProperty(depth0,"text") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"text","hash":{},"loc":{"start":{"line":1,"column":98},"end":{"line":1,"column":106}}}) : helper)))
    + "</p></div>";
}});
Handlebars.registerPartial('csui_controls_charts_visual.count_impl_visual.count.empty', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/charts/visual.count/impl/visual.count.empty.view',['csui/lib/marionette3',
    'hbs!csui/controls/charts/visual.count/impl/visual.count.empty',
    'i18n!csui/controls/charts/visual.count/impl/nls/lang'
], function (Marionette, template, lang) {


    var NoDataView = Marionette.View.extend({

        constructor: function NoDataView() {
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        className: 'csui-visual-count-empty-container',

        template: template,

        templateContext: function() {
            return {
                text: this.options.text || lang.NodataDefaultText
            };
        }

    });

    return NoDataView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/controls/charts/visual.count/impl/visual.count.patterndef',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<svg class=\"csui-visual-count-patterns\" aria-hidden=\"true\">\r\n    <defs>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":3,"column":21},"end":{"line":3,"column":31}}}) : helper)))
    + "-pattern0\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- no pattern (solid fill) -->\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":6,"column":21},"end":{"line":6,"column":31}}}) : helper)))
    + "-pattern1\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- right diagonal even stripes -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" xlink:href=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzMnLz4KPC9zdmc+\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":10,"column":21},"end":{"line":10,"column":31}}}) : helper)))
    + "-pattern2\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- regular diamonds -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" xlink:href=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgc3R5bGU9IiIgeT0iNTAiIHg9IjUwIiB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEwNywgMC43MDcxMDcsIC0wLjcwNzEwNywgMC43MDcxMDcsIDEwMCwgLTQxLjQyMTM1NikiLz4KPC9zdmc+\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":14,"column":21},"end":{"line":14,"column":31}}}) : helper)))
    + "-pattern3\" patternUnits=\"userSpaceOnUse\" width=\"8\" height=\"8\">\r\n            <!-- horizontal even stripes -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"8\" height=\"8\" xlink:href=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiBzdHlsZT0iIi8+Cjwvc3ZnPg==\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":18,"column":21},"end":{"line":18,"column":31}}}) : helper)))
    + "-pattern4\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- wallpaper dots -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" xlink:href=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIHN0eWxlPSIiIGN4PSI1MCIgY3k9IjUwIiByPSIxNSIvPgogIDxjaXJjbGUgc3R5bGU9IiIgY3g9IjEwMCIgcj0iMTUiLz4KICA8Y2lyY2xlIHN0eWxlPSIiIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjE1Ii8+CiAgPGNpcmNsZSBzdHlsZT0iIiBjeT0iMTAwIiByPSIxNSIvPgogIDxjaXJjbGUgc3R5bGU9IiIgcj0iMTUiLz4KPC9zdmc+\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":22,"column":21},"end":{"line":22,"column":31}}}) : helper)))
    + "-pattern5\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- left diagonal even stripes -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" xlink:href=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJtYXRyaXgoMCwgMSwgLTEsIDAsIDEwLCAwKSIvPgogIDxwYXRoIGQ9Ik0gLTEgMSBMIDEgLTEgTSAwIDEwIEwgMTAgMCBNIDkgMTEgTCAxMSA5IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIHRyYW5zZm9ybT0ibWF0cml4KDAsIDEsIC0xLCAwLCAxMCwgMCkiLz4KPC9zdmc+\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":26,"column":21},"end":{"line":26,"column":31}}}) : helper)))
    + "-pattern6\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- regular dots -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" xlink:href=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScgLz4KICA8Y2lyY2xlIGN4PScxLjUnIGN5PScxLjUnIHI9JzEuNScgZmlsbD0nYmxhY2snLz4KPC9zdmc+Cg==\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":30,"column":21},"end":{"line":30,"column":31}}}) : helper)))
    + "-pattern7\" patternUnits=\"userSpaceOnUse\" width=\"10\" height=\"10\">\r\n            <!-- wallpaper diamonds -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" xlink:href=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpieD0iaHR0cHM6Ly9ib3h5LXN2Zy5jb20iPgogIDxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBzdHlsZT0iIiB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEwNywgMC43MDcxMDcsIC0wLjcwNzEwNywgMC43MDcxMDcsIDQ4LjI4NDI3OSwgLTguMjg0MjgxKSIgYng6b3JpZ2luPSIwLjIwNzEwNiAwLjUiLz4KICA8cmVjdCB4PSI4MCIgeT0iLTIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSIiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTA3LCAwLjcwNzEwNywgLTAuNzA3MTA3LCAwLjcwNzEwNywgMjkuMjg5MzIyLCAtNzAuNzEwNjc4KSIgYng6b3JpZ2luPSIwLjUgMC41Ii8+CiAgPHJlY3QgeD0iODAiIHk9IjgwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSIiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTA3LCAwLjcwNzEwNywgLTAuNzA3MTA3LCAwLjcwNzEwNywgMTAwLCAtNDEuNDIxMzU2KSIgYng6b3JpZ2luPSIwLjUgMC41Ii8+CiAgPHJlY3QgeD0iLTIwIiB5PSI4MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBzdHlsZT0iIiB0cmFuc2Zvcm09Im1hdHJpeCgwLjcwNzEwNywgMC43MDcxMDcsIC0wLjcwNzEwNywgMC43MDcxMDcsIDcwLjcxMDY3OCwgMjkuMjg5MzIyKSIgYng6b3JpZ2luPSIwLjUgMC41Ii8+CiAgPHJlY3QgeD0iLTIwIiB5PSItMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgc3R5bGU9IiIgdHJhbnNmb3JtPSJtYXRyaXgoMC43MDcxMDcsIDAuNzA3MTA3LCAtMC43MDcxMDcsIDAuNzA3MTA3LCAwLCAwKSIgYng6b3JpZ2luPSIwLjUgMC41Ii8+Cjwvc3ZnPg==\"></image>\r\n        </pattern>\r\n        <pattern id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"viewId") || (depth0 != null ? lookupProperty(depth0,"viewId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"viewId","hash":{},"loc":{"start":{"line":34,"column":21},"end":{"line":34,"column":31}}}) : helper)))
    + "-pattern8\" patternUnits=\"userSpaceOnUse\" width=\"8\" height=\"8\">\r\n            <!-- vertical even stripes -->\r\n            <image class=\"pattern-overlay\" x=\"0\" y=\"0\" width=\"8\" height=\"8\" xlink:href=\"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpieD0iaHR0cHM6Ly9ib3h5LXN2Zy5jb20iPgogIDxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSIxMDAiIHN0eWxlPSIiIGJ4Om9yaWdpbj0iMCAwIi8+Cjwvc3ZnPg==\"></image>\r\n        </pattern>\r\n    </defs>\r\n</svg>\r\n\r\n";
}});
Handlebars.registerPartial('csui_controls_charts_visual.count_impl_visual.count.patterndef', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/charts/visual.count/impl/visual.count.patterndef.view',[
    'csui/lib/marionette3', 'hbs!csui/controls/charts/visual.count/impl/visual.count.patterndef'
], function(Marionette, template){
    'use strict';

    var VisualCountPatterndefView = Marionette.View.extend({

        className: 'csui-visual-count-patterndef-container',

        template: template,

        constructor: function VisualCountPatterndefView(options){

            this.viewId = options.viewId;
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        templateContext: function(options) {
            return {
                viewId: this.viewId
            };
        }
    });

    return VisualCountPatterndefView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/controls/charts/visual.count/impl/visual.count',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-visual-count-patterndef-container\"></div>\r\n<div class=\"csui-visual-count-chart-container\"></div>";
}});
Handlebars.registerPartial('csui_controls_charts_visual.count_impl_visual.count', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/charts/visual.count/visual.count.view',[
    'csui/lib/marionette3',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/controls/progressblocker/blocker',
    'csui/controls/charts/visual.count/impl/chart.types/bar/visual.count.verticalbar.view',
    'csui/controls/charts/visual.count/impl/chart.types/bar/visual.count.horizontalbar.view',
    'csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.donut.view',
    'csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.pie.view',
    'csui/controls/charts/visual.count/impl/visual.count.empty.view',
    'csui/controls/charts/visual.count/impl/visual.count.patterndef.view',
    'hbs!csui/controls/charts/visual.count/impl/visual.count',
    'css!csui/controls/charts/visual.count/impl/visual.count'
], function(Marionette, _, $,
            BlockingView,
            VerticalBarChartView,
            HorizontalBarChartView,
            DonutChartView,
            PieChartView,
            EmptyView,
            PatternDefView,
            template){
    'use strict';

    var VisualCountView = Marionette.View.extend({

        className: 'csui-visual-count-container',

        template: template,

        regions: {
            chart: {
                el: '.csui-visual-count-chart-container',
                replaceElement: true
            },
            patternDef: {
                el: '.csui-visual-count-patterndef-container'
            }
        },

        constructor: function VisualCountView(options) {

            BlockingView.imbue({
                parent: this
            });

            this.chartView = this._getChartView(options);
            Marionette.View.prototype.constructor.apply(this, arguments);

            this.options.viewId = _.uniqueId('visual-count');

            // SVG needs to be redrawn when the container is re-sized
            var self = this;
            this.onWinRefresh = _.debounce(function() {
                self.render();
            },20);
            $(window).on("resize.app", this.onWinRefresh);

            this.listenTo(options.collection, 'reset', this.render)
                .listenTo(options.collection, 'request', this.blockActions)
                .listenTo(options.collection, 'sync error', this.onCollectionSynced)
                .listenTo(options.chartOptions, 'change', this.render);
        },

        templateContext: function(options) {
            return {
                viewId: this.options.viewId
            };
        },

        childViewEvents: {
            'redraw:chart': 'render'
        },

        onDomRefresh: function(){
            var ChartView = this.chartView;

            this.chartViewInstance = new ChartView(this.options);
            this.showChildView('chart', this.chartViewInstance);
            this.showChildView('patternDef', new PatternDefView(this.options));
        },

        onCollectionSynced: function(collection) {

            this.unblockActions();

            var $chart = $('svg',this.$el);

            if (collection && collection.isEmpty()) {
                this._renderEmptyView();
            }
            else if ($chart.length === 0) {
                this.render();
            }
        },

        onDestroy: function () {
            $(window).off("resize.app", this.onWinRefresh);
        },

        _renderEmptyView: function () {
            this.showChildView('chart', new EmptyView());
        },

        _getChartView: function (options) {
            var chartType = options && options.chartType,
                chartView = VerticalBarChartView;

            if (chartType){
                switch(chartType) {
                    case "donut":
                        chartView = DonutChartView;
                        break;
                    case "pie":
                        chartView = PieChartView;
                        break;
                    case "horizontalBar":
                        chartView = HorizontalBarChartView;
                        break;
                    case "verticalBar":
                        // although this is the same as the default case, it's more semantic to include it here
                        chartView = VerticalBarChartView;
                        break;
                    default:
                        // VerticalBarChartView
                }
            }

            return chartView;
        }

    });

    return VisualCountView;

});
csui.define('bundles/csui-visualisation',[

  // d3 visualisation library
  "csui/lib/d3",

  // Controls
  "csui/controls/charts/visual.count/visual.count.view"

], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-visualisation', true);
});

