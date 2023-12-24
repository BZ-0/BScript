import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class StyleProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    //
    get(target, name, receiver) {
        target = (target?.$data || target);
        return target?.getPropertyValue?.(name);
    }

    //
    set(target, name, value) {
        target = (target?.$data || target);
        target?.setProperty?.(name, value, "");
        return true;
    }

    //
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        if (Array.isArray(args[0])) {
            return args[0].map(($e)=>target.getPropertyValue($e));
        } else
        if (typeof args[0] == "object") {
            Object.entries(args[0]).forEach(([$name, $value])=>{
                target.setProperty($name, $value, "");
            });
        } else
        if (typeof args[0] == "string") {
            if (args[1] != null) {
                target.setProperty(args[0], args[1], "");
            } else {
                return target.getPropertyValue(args[0]);
            }
        }
        return this.#self;
    }
}
