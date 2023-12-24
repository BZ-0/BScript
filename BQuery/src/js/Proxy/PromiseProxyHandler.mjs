import BQueryProxyHandler from "./BQueryProxyHandler.mjs";

//
export default class PromiseProxyHandler {
    #self = null;

    //
    constructor(self) {
        this.#self = new Proxy(self, new BQueryProxyHandler());
    }

    //
    get(target, name, receiver) {
        target = (target?.$data || target);

        //
        const _got_ = target[name];
        if (_got_ != null) {
            return ((typeof _got_ == "function") ? (_got_?.bind?.(target) || _got_) : _got_);
        }

        // else, return from class
        const _sf_ = this.#self[name];
        return ((typeof _sf_ == "function") ? _sf_.bind(this.#self) : _sf_);
    }

    //
    set(target, name, value) {
        target = (target?.$data || target);
        return true;
    }

    // make an event-like
    apply(target, thisArg, args) {
        target = (target?.$data || target);
        if (typeof args[0] == "function") {
            
            /*return*/ new Proxy(target["then"].apply(target, args), this);
        }
        return this.#self;
    }
}
