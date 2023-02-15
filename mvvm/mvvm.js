

class MVVM{
    constructor(options) {
        this.el = options.el
        this.options = options
        let data = options.data || {}
        let that = this
        this.data =reactive2(data)
        Object.keys(data).forEach(function(key) {
            that._proxyData(key);
        });
        
        this.$compile = new Compiler(this.el,this)
                                        
        
    }

    $watch(effect) {
        console.log('mvvm$watch',effect)
        watch(effect)
      
    }
    
    _proxyData(key) {
        let that = this;
        Object.defineProperty(that, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return that.data[key];
            },
            set: function proxySetter(newVal) {
                that.data[key] = newVal;
            }
        });
    }
    
    _initComputed() {
        let computed = this.options.computed
        let that = this
        Object.keys(computed).forEach((key)=>{
            Object.defineProperty(that,key,{
                get:  typeof computed[key] ==='function'
                            ?computed[key]()
                            :computed[key],

                set: function (newValue) {
                    
                }
            })
        })
    }
}