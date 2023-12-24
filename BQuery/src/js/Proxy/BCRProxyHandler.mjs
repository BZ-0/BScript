import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class BCRProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    //
    get(target, name, receiver) {
        //if (["right", "left", "top", "bottom", "width", "height"].indexOf(name) >= 0) { return target[name]; };
        target = (target?.$data || target);
        const _got_ = target[name];
        return ((typeof _got_ == "function") ? (_got_?.bind?.(target) || _got_) : _got_);
    }

    // unpreferred...
    set(target, name, value) {
        target = (target?.$data || target);
        return true;
    }

    // 
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        return this.#self;
    }
}
