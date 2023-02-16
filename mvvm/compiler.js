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
        this.compile(this.$fragment);
      
    }

    compile(el) {
        let childNodes = el.childNodes
        let that = this
        
        Array.prototype.slice.call(childNodes).forEach(function(node) {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/g;
            let array; 
            if (that.isElementNode(node)) {
               
                that.compileElement(node)
            } else if (that.isTextNode(node) && reg.test(text)) {
                that.compileText(node, RegExp.$1.trim());
            }

            if (node.childNodes && node.childNodes.length) {
                that.compile(node);
            }
          
        });
    }

    compileElement(node) {
       let nodeAttrs = node.attributes
       let that = this
       Array.prototype.slice.call(nodeAttrs).forEach((attribute) =>{
            let attrName =attribute.name
            if (that.isDirective(attrName)) {
                let value = attribute.value
                let subName = attrName.substring(2)
                if (that.isEventDirective(subName)) {
                    that.eventHandler(node,this.$vm,value,subName)
                } else {
                    
                }
                node.removeAttribute(attrName);
            }
            
       })
       
    }
    compileText(node,text) {
       this.getVMData(this.$vm,node,text)
    }


    createFragment(el) {
        let fragement = document.createDocumentFragment()
        let child = el.firstChild
        while(child) {
            fragement.appendChild(child)
            child = el.firstChild;

        }
      
        return fragement
    }

    isElementNode(node) {
        return node.nodeType === 1
    }

    isTextNode(node) {
        return node.nodeType === 3
    }
    
    isDirective(attrName) {
        return attrName.indexOf('v-') === 0
    }

    isEventDirective(name) {
        console.log('isEventDirective',name)
        return name.indexOf('on') === 0;
    }
  

    getVMData(vm,node,variable) {
        let that = this
        let innervm =vm
        innervm.$watch(()=>that.textUpdater.call(that,node,innervm[variable]))
       
    }
    
    textUpdater(node,value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    }

    modelUpdater(node,value,oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }



    eventHandler(node, vm, value, name) {
        var eventType = name.split(':')[1],
            fn = vm.options.methods && vm.options.methods[value];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    }
}
