

class MVVM{
    constructor(options) {
        this.el = options.el
        let data = options.data || {}
        let that = this
        this.data =reactive2(data)
        Object.keys(data).forEach(function(key) {
            that._proxyData(key);
        });
        
        console.log('mvvm',this.data)
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
    

}