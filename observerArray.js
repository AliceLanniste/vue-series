/** 
 * 在最简observer基础上实现一个vue2版本的observer
 * 之前mvvm中的observe只能检测非嵌套对象，现在要做一个可以检测嵌套对象
*/
/**
 *  let obj = {
  a: {
    aa: {
      aaa: 123,
      bbb: 456,
    },
    bb: "obj.a.bb",
  },
  b: "obj.b",
}; 
 */



function observe(obj) {
    if (!isObject(obj)) {
        return
    }
    let ob;
   
        ob = new Observer(obj)
    
    return ob
}


class Observer{
    constructor(obj) {
       
        this.walk(obj)
    }

    walk(obj) {
        for (const key of Object.keys(obj)) {
            defineReactive(obj,key)
        }
    }


}

function defineReactive(obj,key) {
   
    let val = obj[key]
    let childObj = observe(val)
    Object.defineProperty(obj,key,{
        get() {
           console.log('getter trigger')
            return val
        },

        set(newVal) {
            if (newVal === val) {
                return
            }    
            console.log('setter trigger')        
            val = newVal
            childObj = observe(newVal)
        }
    })
}



function isObject(obj) {
    return obj !== null && typeof obj ==='object'
}

let obj = {
    a: {
      aa: {
        aaa: 123,
        bbb: 456,
      },
      bb: "obj.a.bb",
    },
    b: "obj.b",
  };


  observe(obj)
  console.log(obj.a.aa.aaa = 234)
/**
 * output:
 *  getter trigger
 *  getter trigger
 *  setter trigger
    234
 */   



// vue2无法检测 property 的添加或移除。使用Vue.set(vm.someObject, 'b', 2)，来添加

//Vue2无法检测数组通过索引赋值，vm.items[indexOfItem] = newValue
//修改数组的length，vm.items.length = newLength
//在vue2中变更数组的方法如pop，push等，都被vue重写,下面代码重点为了研究如何覆盖原始方法
//在vue2中如果发现obj是数组的话其实不是直接监测，而是重写方法。原因是`defineProperty`其实可以触发数组索引
//考虑性能原因，选择重写数组方法是更好的选择。
//因此 obj如果是数组类型，那么通过Object.setPrototypeOf(obj,arrayMethods)，将数组原型对象覆盖来达到目的。

  function observe2(obj) {
    if (!isObject(obj)) {
        return
    }
    let ob
    if (typeof obj.__ob__ !== 'undefined') {
        ob = obj.__ob__
    }else {
        ob = new Observer2(obj)
    }

    return ob
  }


  class Observer2 {
    constructor(obj) {
        def(obj,'__ob__',this)
        if (Array.isArray(obj)) {
            Object.setPrototypeOf(obj,arrayMethods)
        } else {
            this.walk(obj)
        }
    }


    walk(obj) {
        
        for (const key of Object.keys(obj)) {
            defineReactive(obj,key)
        }
        
    }

    observerArray(items) {
        for (let index = 0; index < items.length; index++) {
                observe2(items[index])            
        }
    }
  }

// override Array， 重写Array方法
//首先定义了一个def函数，这个函数就是用来定义属性的，在重写array方法时，这个函数就用来覆盖本身方法
//在 methodsToPatch.forEach(()=>....)函数内部，将改动的数据inserted，直接调用`observerArray`
//去监测
  function def(obj, key, value, enumerable= false) {
    Object.defineProperty(obj, key, {
      value,
      enumerable,
      writable: true,
      configurable: true,
    });
  }


const originalArray = Array.prototype
const arrayMethods = Object.create(originalArray)

const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse',
  ];

  methodsToPatch.forEach((method) =>{
    const original = arrayMethods[method]
     def(arrayMethods,method, function (...args) {
        console.log('array methods override')
        const result = original.apply(this,args)
        const ob = this.__ob__
        let inserted
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args    
                break;
            case 'splice':
                inserted = args.slice(2)
                break;
        }
            if (inserted) {
                ob.observerArray(inserted)
            }
        return result
     })
  })


let a = [1,2,3]
observe2(a)
console.log('array',a.splice(1,1,5))  
/** 
 * array methods override
 * array [ 2 ]
 */
