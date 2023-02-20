什么是mvvm？
mvvm就是model-view-viewModel一种软件架构方式。 view是ui组件并接受用户的数据输入，viewModel连通view和model，model封装程序逻辑，viewModel得到数据调用model层封装的逻辑。
![mvvm](/assets/mvvm.PNG "mvvm")


vue.js就是个mvvm架构的框架，
```
<template>
    <div class="ccc">
        ...
        ...
        ...
    </div>
</template>

<script>
 ...
 ....
</script>
```

template为view，script为model ，vue.js则是viewModel,将两者连接。

双向绑定vue2.0使用`defineProperty` +观察者模式达成。

```
defineProperty(data,key, {
    get():
        observer.addSub()
        ...
    set(value):
        observer.notify()
        ...
})

```
通过给每个`key`添加getter/setter，达到数据劫持的效果,在getter/setter函数中加入observer的addSub/notify,每次data[key],就会加入订阅者，data[key]=xxx，就会触发subscriber。


