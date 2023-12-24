import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class HTMLProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    // 
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        if (args[0] == null) { return target.innerHTML; };
        target.innerHTML = args[0];
        return this.#self;
    }
}
