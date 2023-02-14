
function watch(effect) {
    globalEffect = effect
    globalEffect()
    globalEffect = null
} 