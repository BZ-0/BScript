import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class AttributeProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    //
    get(target, name, receiver) {
        target = (target?.$data || target);
        return target?.getAttribute?.(name);
    }

    //
    set(target, name, value) {
        target = (target?.$data || target);
        target?.setAttribute?.(name, value);
        return true;
    }

    //
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        if (Array.isArray(args[0])) {
            return args[0].map(($e)=>target.getAttribute($e));
        } else
        if (typeof args[0] == "object") {
            Object.entries(args[0]).forEach(([$name, $value])=>{
                target.setAttribute($name, $value);
            });
        } else
        if (typeof args[0] == "string") {
            if (args[1] != null) {
                target.setAttribute(args[0], args[1]);
            } else {
                return target.getAttribute(args[0]);
            }
        }
        return this.#self;
    }
}
