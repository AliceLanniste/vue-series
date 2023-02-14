class dependences {
    constructor() {
        this.subscribers = new Set()
    }


    depend() {
        this.subscribers.add(sub)
    }

    notify() {
        this.subscribers.forEach((sub) => {
            sub();
        });
    }
}

function reactive2(raw) {
    if (!raw) {
        return
    }

    if (typeof raw === 'object') {
        Object.keys(raw).forEach((key) =>{
            let dep = new dependences()
            let value = raw[key]
            Object.defineProperty(raw,key, {
                get: function () {
                    console.log('get')
                    dep.depend()
                    return value
                },
                set:function (newValue) {
                    console.log('数据变化')
                    if (newValue === value) {
                        return
                    }
                    value = newValue
                    dep.notify()
                }
            })

        })
        
    }
    return raw
}


let rawData= reactive2({count:1})
console.log('rawData',rawData.count)
rawData.count = 45

/**
 * 现在的问题是value已经变化了，如何加入subscriber
 *首先能加入sbuscriber是通过depend,depend放入get
*/ 