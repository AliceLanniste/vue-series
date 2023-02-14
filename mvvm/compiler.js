class Compiler {
    
    constructor(el,vm) {
        this.$vm = vm
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);
        if (this.$el) {
            this.$fragment = this.createFragment(this.$el);
            this.init();
            this.$el.appendChild(this.$fragment);
        }
    }

    init() {
        this.compileElement(this.$fragment);
      
    }

    compileElement(el) {
        let childNodes = el.childNodes
        let that = this
        Array.prototype.slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/g;
            let array;  
            if (that.isTextNode(node) && reg.test(text)) {
                that.compileText(node, RegExp.$1.trim());
            }
          
        });
    }

    compileText(node,text) {
       this.getVMData(this.$vm,node,text)
    }


    createFragment(el) {
        let fragement = document.createDocumentFragment()
        let child = el.firstChild
        fragement.appendChild(child)
        return fragement
    }

    isElementNode(node) {
        return node.nodeType === 1
    }

    isTextNode(node) {
        return node.nodeType === 3
    }

    textUpdater(node,value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }

    getVMData(vm,node,variable) {
        let that = this
        let innervm =vm
        innervm.$watch(()=>that.textUpdater.call(that,node,innervm[variable]))
        innervm[variable] ='heel'
    }
}
