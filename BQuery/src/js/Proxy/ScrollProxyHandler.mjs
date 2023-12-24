import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class ScrollProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    //
    get(target, name, receiver) {
        target = (target?.$data || target);
        if (name == "right") { return target["scrollLeft"] + target["scrollWidth"]; };
        if (name == "bottom") { return target["scrollTop"] + target["scrollHeight"]; };
        if (name == "left") { return target["scrollLeft"]; };
        if (name == "top") { return target["scrollTop"]; };
        if (name == "width") { return target["scrollWidth"]; };
        if (name == "height") { return target["scrollHeight"]; };
    }

    // unpreferred...
    set(target, name, value) {
        target = (target?.$data || target);
        return true;
    }

    // TODO! alternate of "scrollTo" or "scrollBy"
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        return this.#self;
    }
}
