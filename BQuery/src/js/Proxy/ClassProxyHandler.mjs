import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class ClassProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    //
    get(target, name, receiver) {
        target = (target?.$data || target);
        return target?.contains?.(name);
    }

    //
    set(target, name, another) {
        target = (target?.$data || target);
        if (typeof another == "string"  && target?.contains?.(name)) { target?.replace?.(name, another); };
        if (typeof another == "boolean") { 
            if (!another &&  target?.contains?.(name)) { target?.remove?.(name); };
            if ( another && !target?.contains?.(name)) { target?.add?.(name); };
        };
        return true;
    }

    //
    has(target, name, receiver) {
        target = (target?.$data || target);
        return target?.contains?.(name);
    }

    // TODO! support an functor too
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        return this.#self;
    }
}
