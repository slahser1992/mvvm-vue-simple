const observe = value => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return;
  }
  return new Observer(value);
}

class Observer {
  constructor(data) {
    this.data = data
    this.run(data)
  }

  run(data) {
    for(var key in data) {
      if (data.hasOwnProperty(key)) {
        this.defineReactive(data, key, data[key])
      }
    }
  }

  defineReactive(data, key, value) {
    const dep = new Dep()
    const childObj = observe(value)
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get: () => {
        if(Dep.target) {
          dep.depend()
        }
        return value
      },
      set: (newVal) => {
        if (newVal === value) {
            return;
        }
        value = newVal;
        observe(value);
        dep.notify();
      }
    })
  }
}

var uid = 0
class Dep {
  constructor() {
    this.id = uid++
    this.subs = []
  }

  addSub(target) {
    this.subs.push(target)
  }

  depend() {
    Dep.target.addDep(this);
  }

  notify() {
    this.subs.forEach(sub => sub.update())
  }
}
