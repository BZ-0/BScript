/* Full mod by USER_404 (adapt for EcmaScript of 2023 year, fix issues) */
/* Some, common or most originals by 'anitasv' */
/* https://github.com/anitasv/zoom */

//
import { convertPointFromPageToNode } from "./GeometryUtils.mjs"

//
export const scmult = (l, x) => [l * x[0], l * x[1]];
export const vcadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const wedge = (a, b) => a[0] * b[1] - a[1] * b[0];
export const apply = (A, x) => vcadd(scmult(x[0], A[0]), scmult(x[1], A[1]));
export const mult = (A, B) => [apply(A, B[0]), apply(A, B[1])];

//
export class Transform {
    constructor(A, b) { this.A = A, this.b = b; }
    css() {
        const A = this.A, b = this.b;
        return `scale(var(--scale)) matrix3d(${A?.[0]?.[0]??1}, ${A?.[0]?.[1]??0}, 0, 0, ${A?.[1]?.[0]??0}, ${A?.[1]?.[1]??1}, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)`;
    }
}

Transform.avg = (Z, I, progress) => {
    return new Transform(
        avgMatrix(Z.A, I.A, progress),
        avgVector(Z.b, I.b, progress)
    );
}

export const cascade = (T, U) => new Transform(mult(T.A, U.A), vcadd(apply(T.A, U.b), T.b));
export const rotate = (c, s) => [
    [c, s],
    [-s, c],
];
export const rotscale = (a, b) => {
    const alen = dot(a, a);
    const sig = dot(a, b);
    const del = wedge(a, b);
    return rotate(sig / alen, del / alen);
};
export const justscale = (a, b) => {
    const alen = Math.sqrt(dot(a, a));
    const blen = Math.sqrt(dot(b, b));
    const scale = blen / alen;
    return rotate(scale, 0);
};
export const magnification = (A) => Math.abs((A[0][0] + A[1][1]) / 2);
export const scaleMatrix = (A, l) => [scmult(l, A[0]), scmult(l, A[1])];
export const zoom = (s, d, allowRotation, minZoom, maxZoom, M = [Infinity, Infinity]) => {
    const a = minus(s[1], s[0]);
    const b = minus(d[1], d[0]);
    let rs = allowRotation ? rotscale(a, b) : justscale(a, b);

    const mag = magnification(rs);
    if (mag < minZoom) {
        rs = scaleMatrix(rs, minZoom / mag);
    } else if (mag > maxZoom) {
        rs = scaleMatrix(rs, maxZoom / mag);
    }

    const rs0 = apply(rs, s[0]);
    const t = minus(d[0], rs0);

    //t[0] = Math.min(Math.max(t[0], -M[0]/2), M[0]/2)||0,
    //t[1] = Math.min(Math.max(t[1], -M[1]/2), M[1]/2)||0

    return new Transform(rs, t);
};

export const avgVector = (u, v, progress) => {
    const u1 = scmult(1 - progress, u);
    const v1 = scmult(progress, v);
    return vcadd(u1, v1);
};

export const avgMatrix = (A, B, progress) => [
    avgVector(A[0], B[0], progress),
    avgVector(A[1], B[1], progress),
];
export const identity = () => new Transform([[1, 0], [0, 1]], [0, 0]);
export const defaults = (param, val) => (param === undefined ? val : param);
export const default_config = (cfg, cfg_def) => {
    const new_cfg = defaults(cfg, {});
    for (let k in cfg_def) {
        new_cfg[k] = defaults(new_cfg[k], cfg_def[k]);
    }
    return new_cfg;
};

//
Array.prototype.set = function (v) {
    const n = Math.min(this.length, v.length);
    for (let i = 0; i < n; ++i) this[i] = v[i];
    return this;
};

//
export const bounding = (offset, element)=>{
    const CB = element.getBoundingClientRect();
    const PB = element.parentNode.getBoundingClientRect();

    //
    const mnw = Math.min(CB.width  - PB.width , PB.width  - CB.width);
    const mnh = Math.min(CB.height - PB.height, PB.height - CB.height);
    const mxw = Math.max(CB.width  - PB.width , PB.width  - CB.width);
    const mxh = Math.max(CB.height - PB.height, PB.height - CB.height);

    //
    offset[0] = Math.min(Math.max(offset[0], mnw), 0);
    offset[1] = Math.min(Math.max(offset[1], mnh), 0);
}

//
export class Zoom {
    constructor(elem, config, wnd) {
        this.mayBeDoubleTap = null;
        this.isAnimationRunning = false;
        this.curTouch = 0;
        this.elem = elem;
        this.elemParent = this.elem.parentNode || this.elem?.getRootNode()?.host;
        this.activeZoom = identity();
        this.resultantZoom = identity();

        this.lastT = { coordinate: [0, 0] };
        this.touches = {};

        this.srcCoords = [0, 0];
        this.destCoords = [0, 0];

        this.config = default_config(config, {
            pan: false,
            rotate: true,
            minZoom: 0,
            maxZoom: Infinity,
        });

        this.wnd = wnd || window;
        //this.elem.style.setProperty("will-change", "transform", "");
        this.elem.style.setProperty("transform-origin", "0% 0%", "");

        const getCoordsDouble = (t) => {
            const K = Object.keys(t);
            return [
                t[K[0]]?.coordinate || [0, 0],
                t[K[1]]?.coordinate || [1, 1]
            ];
        };

        const getCoordsSingle = (t) => {
            const K = Object.keys(t);
            return [
                t[K[0]]?.coordinate.map((U)=>U+0) || [0, 0],
                t[K[0]]?.coordinate.map((U)=>U+1) || [1, 1]
            ];
        };

        const getCoords = (t) => (Object.keys(t).length > 1 ? getCoordsDouble(t) : getCoordsSingle(t));
        const setSrcAndDest = (touches) => {
            this.srcCoords = getCoords(touches);
            this.destCoords = this.srcCoords;
        };

        const setDest = (touches) => {
            this.destCoords = getCoords(touches);
        };

        const handleTouchEvent = (cb) => (evt) => {
            if (evt.pointerType != "touch") { return false; };

            //
            const offset = convertPointFromPageToNode(this.elemParent, evt.pageX, evt.pageY);
            this.lastT = Object.assign({}, this.touches[evt.pointerId] || this.lastT || { coordinate: [0, 0] });
            this.touches[evt.pointerId] = Object.assign(this.touches [evt.pointerId]||{}, {
                coordinate: [offset.x, offset.y]
            });

            //
            if (this.isAnimationRunning) {
                return false;
            }

            //
            const touches = this.touches;
            if (!touches) { return false; }

            //
            evt.preventDefault();
            cb(touches);
        };

        this._handleZoom = handleTouchEvent((touches) => {
            const numOfFingers = Object.keys(touches).length;
            if (numOfFingers !== this.curTouch) {
                this.curTouch = numOfFingers;
                this.finalize();
                if (numOfFingers !== 0) {
                    setSrcAndDest(touches);
                }
            } else {
                setDest(touches);
                this.previewZoom();
            }
        }).bind(this);

        this._handleTouchStart = handleTouchEvent((touches) => {
            const K = Object.keys(touches);
            if (K.length === 1) {
                if (this.mayBeDoubleTap !== null) {
                    this.wnd.clearTimeout(this.mayBeDoubleTap);
                    if (Math.hypot(...touches[K[0]].coordinate.map((E,i)=>(E-this.lastT.coordinate[i]))) < 10) {
                        this.reset(touches);
                    }
                    this.mayBeDoubleTap = null;
                } else {
                    // TODO: needs delta touch support!
                    this.mayBeDoubleTap = this.wnd.setTimeout(() => {
                        this.mayBeDoubleTap = null;
                    }, 300);
                }
            }
            if (K.length >= 1) {
                this.elem.style.setProperty("will-change", "transform, scroll-position", "");
                //this.elem.style.removeProperty("will-change");
            }
        }).bind(this);

        //
        this.elemParent.addEventListener("pointerdown", this._handleTouchStart);
        this.elemParent.addEventListener("pointerdown", this._handleZoom);
        document.addEventListener("pointermove", this._handleZoom);
        document.addEventListener("pointerup", this._handleTouchEnd = (evt)=>{
            if (evt.pointerType != "touch") return false;
            this.lastT = Object.assign({}, this.touches[evt.pointerId] || this.lastT || { coordinate: [0, 0] });
            delete this.touches[evt.pointerId];

            //
            const numOfFingers = Object.keys(this.touches).length;
            if (numOfFingers !== this.curTouch) {
                this.curTouch = numOfFingers;
                this.finalize();
                if (numOfFingers !== 0) {
                    setSrcAndDest(this.touches);
                }
            } else {
                setDest(this.touches);
                this.previewZoom();
            }

            //
            if (numOfFingers <= 0) { return false; };
            evt.preventDefault();

        });
    }

    destroy() {
        this.elemParent.removeEventListener("pointerdown", this._handleTouchStart);
        this.elemParent.removeEventListener("pointerdown", this._handleZoom);
        document.removeEventListener("pointermove", this._handleZoom);
        document.removeEventListener("pointerup", this._handleTouchEnd);
        //this.elem.style.removeProperty("will-change");
        this.elem.style.removeProperty("transform-origin");
        this.elem.style.removeProperty("transform");
    }

    previewZoom() {
        this.elem.style.setProperty("will-change", "transform, scroll-position", "");
        const zoomLevel = magnification(this.activeZoom.A);
        const minZoom = this.config["minZoom"] / zoomLevel;
        const maxZoom = this.config["maxZoom"] / zoomLevel;
        const additionalZoom = zoom(
            this.srcCoords,
            this.destCoords,
            this.config.rotate,
            minZoom,
            maxZoom
        );
        this.resultantZoom = cascade(additionalZoom, this.activeZoom);
        this.repaint();
    }

    setZoom(newZoom) {
        this.resultantZoom = newZoom;
        this.finalize();
        this.repaint();
    }

    finalize() {
        bounding(this.resultantZoom.b, this.elem);
        this.elem.style.removeProperty("will-change");
        this.activeZoom = this.resultantZoom;
    }

    repaint() {
        bounding(this.resultantZoom.b, this.elem);
        this.elem.style.setProperty("transform", this.resultantZoom.css(), "");
        if (this.resultantZoom?.b[0] != null) { this.elem.parentNode.scrollTo({ left: -(this.resultantZoom.b[0]||0), behavior: "instant" }); };
        if (this.resultantZoom?.b[1] != null) { this.elem.parentNode.scrollTo({ top : -(this.resultantZoom.b[1]||0), behavior: "instant" }); };
    }

    reset(touches) {
        if (this.wnd.requestAnimationFrame) {
            this.isAnimationRunning = true;
            const Z = this.activeZoom;
            let startTime = null;
            const step = (time) => {
                if (!startTime) {
                    startTime = time;
                }
                const progress = (time - startTime) / 100;
                if (progress >= 1) {
                    this.setZoom(identity());
                    this.isAnimationRunning = false;
                } else {
                    this.setZoom(Transform.avg(Z, identity(), progress));
                    this.wnd.requestAnimationFrame(step);
                }
            };
            this.wnd.requestAnimationFrame(step);
        } else {
            this.setZoom(identity());
        }
    }
}
