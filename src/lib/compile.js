class Compile {
  constructor(el, vm) {
    this.$vm = vm
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)
    if (this.$el) {
      this.$fragment = this.nodeToFragment(this.$el)
      this.init()
      this.$el.appendChild(this.$fragment)
    }
  }

  init() {
    this.compileElement(this.$fragment)
  }

  isElementNode(el) {
    return el.nodeType == 1;
  }

  isTextNode(el) {
    return el.nodeType == 3;
  }

  isDirective(attr) {
      return attr.indexOf('v-') === 0;
  }

  isEventDirective(dir) {
      return dir.indexOf('on') === 0;
  }

  nodeToFragment(el) {
    const fragment = document.createDocumentFragment()
    let child
    while (child = el.firstChild) {
      fragment.appendChild(child)
    }
    return fragment
  }

  compile(node) {
    var nodeAttrs = node.attributes;
    var that = this;
    Array.from(nodeAttrs).forEach(attr => {
      var attrName = attr.name
      if (that.isDirective(attrName)) {
        var attrVal = attr.value
        var dir = attrName.substring(2)
        if (that.isEventDirective(dir)) {
          compileUtil.eventHandler(node, that.$vm, attrVal, dir)
        } else {
          compileUtil[dir] && compileUtil[dir](node, that.$vm, attrVal)
        }
        node.removeAttribute(attrName);
      }
    });
  }

  compileElement(el) {
    const childNodes = el.childNodes;
    const me = this;
    Array.from(childNodes).forEach(node => {
      let text = node.textContent
      let reg = /\{\{(.*)\}\}/
      if (me.isElementNode(node)) {
        me.compile(node);
      } else if (me.isTextNode(node) && reg.test(text)) {
        me.compileText(node, RegExp.$1)
      }
      if (node.childNodes && node.childNodes.length) {
        me.compileElement(node);
      }
    });
  }

  compileText(node, exp) {
    compileUtil.text(node, this.$vm, exp);
  }
}



const compileUtil = {
  bind(node, vm, exp, dir) {
    const updaterFn = updater[dir + 'Updater'];
    updaterFn && updaterFn(node, this._getVMVal(vm, exp));
    new Watcher(vm, exp, (value, oldValue) => {
      updaterFn && updaterFn(node, value, oldValue);
    });
  },

  text(node, vm, exp) {
    this.bind(node, vm, exp, 'text');
  },

  html(node, vm, exp) {
    this.bind(node, vm, exp, 'html');
  },

  class(node, vm, exp) {
    this.bind(node, vm, exp, 'class');
  },

  model(node, vm, exp) {
    this.bind(node, vm, exp, 'model');
    let val = this._getVMVal(vm, exp)
    node.addEventListener('input', e => {
      var newValue = e.target.value
      if (val === newValue) {
          return
      }
      this._setVMVal(vm, exp, newValue)
      val = newValue
    })
  },

  eventHandler(node, vm, exp, dir) {
    var eventType = dir.split(':')[1],
      fn = vm.$options.methods && vm.$options.methods[exp];
    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false);
    }
  },

  _getVMVal(vm, exp) {
    var val = vm._data;
    exp = exp.split('.');
    exp.forEach(k => {
        val = val[k];
    });
    return val;
  },

  _setVMVal(vm, exp, value) {
    var val = vm._data
    exp = exp.split('.')
    exp.forEach((k, i) => {
      if (i < exp.length - 1) {
        val = val[k]
      } else {
        val[k] = value
      }
    });
  }
};

const updater = {
  textUpdater(node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value;
  },

  htmlUpdater(node, value) {
    node.innerHTML = typeof value == 'undefined' ? '' : value;
  },

  classUpdater(node, value, oldValue) {
    const className = node.className.replace(oldValue, '').replace(/\s$/, '')
    const space = className && String(value) ? ' ' : ''
    node.className = className + space + value
  },

  modelUpdater(node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value
  }
};
