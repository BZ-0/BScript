const _wnd_ = typeof window == "undefined" ? {} : window;

/* */
export const _DOMMatrix_ = typeof DOMMatrix != "undefined" ? DOMMatrix : WebKitCSSMatrix;
export const ifNull = (a,b)=>((a != null) ? (a||0) : (b||0));
export const neg = (a)=>(-a);

//
export const _identity_ = `matrix3d(
    1.0, 0.0, 0.0, 0.0, 
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
)`;

//
export class Point {
    constructor(x, y, z) { this.x = x, this.y = y, this.z = z };

    transformBy(matrix) {
        var tmp = matrix.multiply(new _DOMMatrix_(_identity_).translate(this.x, this.y, this.z));
        return new Point(tmp.m41, tmp.m42, tmp.m43);
    }
}

//
export const getTransformationMatrix = (element) => {
    let fromNodeTransform = new _DOMMatrix_(_identity_);
    let x = element;
    while (x && x !== x.ownerDocument.documentElement) {
        let transform = new _DOMMatrix_(_identity_);
        if (x.computedStyleMap) {
            /* TODO: support of transform-origin */
            const computed = x.computedStyleMap().get("transform");
            transform = (computed && computed.value != "none") ? computed.toMatrix() : transform;
        } else {
            try {
                const computed = _wnd_.getComputedStyle(x, "").getPropertyValue("transform");
                transform = (computed && computed != "none") ? new _DOMMatrix_(computed) : transform;
            } catch(e) {};
        }

        // get transform origin for correction
        let origin = [(x.offsetWidth||0)/2, (x.offsetHeight||0)/2];
        try {
            origin = _wnd_.getComputedStyle(x, "").getPropertyValue("transform-origin").split(" ").map((V)=>parseFloat(V.replace("px", ""))).map((_,i)=>ifNull(_, origin[i]));
        } catch(e) {};

        //
        if (transform) {
            fromNodeTransform = new _DOMMatrix_(_identity_)
                .translate(...origin)
                .multiply(new _DOMMatrix_(_identity_)
                    .multiply(transform)
                    .translate(...origin.map(neg))
                )
                .multiply(fromNodeTransform);
        }
        x = x.parentNode || x?.getRootNode()?.host;
    }

    const w = element.offsetWidth;
    const h = element.offsetHeight;
    const p1 = new Point(0, 0, 0).transformBy(fromNodeTransform);
    const p2 = new Point(w, 0, 0).transformBy(fromNodeTransform);
    const p3 = new Point(w, h, 0).transformBy(fromNodeTransform);
    const p4 = new Point(0, h, 0).transformBy(fromNodeTransform);
    const left = Math.min(p1.x, p2.x, p3.x, p4.x);
    const top = Math.min(p1.y, p2.y, p3.y, p4.y);
    const rect = element.getBoundingClientRect();
    return new _DOMMatrix_(_identity_).translate(
        (_wnd_.scrollX || _wnd_.pageXOffset || 0) + rect.left - left, 
        (_wnd_.scrollY || _wnd_.pageYOffset || 0) + rect.top - top, 0
    ).multiply(fromNodeTransform);
}

export const convertPointFromPageToNode = _wnd_.webkitConvertPointFromPageToNode || ((element, pageX, pageY) => {
    return new Point(pageX, pageY, 0).transformBy(getTransformationMatrix(element).inverse());
});

export const convertPointFromNodeToPage = _wnd_.webkitConvertPointFromNodeToPage || ((element, offsetX, offsetY) => {
    return new Point(offsetX, offsetY, 0).transformBy(getTransformationMatrix(element));
});
