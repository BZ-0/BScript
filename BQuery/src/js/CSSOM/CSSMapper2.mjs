//
export * from "./SkyDesign2.module.scss"

//
const updatePixelRatio = ()=>{
    const doc = document.documentElement;
    if (doc) {
        if (doc.attributeStyleMap) {
            doc.attributeStyleMap.set("--device-pixel-ratio", window.devicePixelRatio ?? 1);
        } else {
            doc.style.setProperty("--device-pixel-ratio", window.devicePixelRatio ?? 1);
        }
    }
}

updatePixelRatio();

//
window.addEventListener("resize", updatePixelRatio);

//
if (typeof CSS != "undefined" && CSS.registerProperty) {
    CSS.registerProperty({ name: '--page-x', syntax: '<length>', inherits: true, initialValue: CSS.px(0), });
    CSS.registerProperty({ name: '--page-y', syntax: '<length>', inherits: true, initialValue: CSS.px(0), });
    CSS.registerProperty({ name: '--client-x', syntax: '<length>', inherits: true, initialValue: CSS.px(0), });
    CSS.registerProperty({ name: '--client-y', syntax: '<length>', inherits: true, initialValue: CSS.px(0), });
}

//
document.addEventListener("mousemove", (e)=>{
    const doc = document.documentElement;
    doc.style.setProperty("--page-x", e.pageX + "px");
    doc.style.setProperty("--page-y", e.pageY + "px");
    doc.style.setProperty("--client-x", e.clientX + "px");
    doc.style.setProperty("--client-y", e.clientY + "px");
});

//
const _adapt_ = ()=>{
    const mvp = document.getElementById('vp');
    if (mvp) {
        if (screen.width <= 480) {
            mvp.setAttribute('content',mvp.getAttribute('content').replace("device-width", "480"));
        } else {
            mvp.setAttribute('content',mvp.getAttribute('content').replace("480", "device-width"));
        }
    }
};

//
document.addEventListener("DOMContentLoaded", _adapt_);
window.addEventListener("load", _adapt_);
window.addEventListener("resize", _adapt_); _adapt_();
