
function watch(effect) {
    console.log('watch.js',effect)
    globalEffect = effect
    globalEffect()
    globalEffect = null
} 