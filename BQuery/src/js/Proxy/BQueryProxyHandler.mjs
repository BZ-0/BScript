//
export default class BQueryProxyHandler {
    constructor() {
        
    }

    //
    get(target, name, receiver) {
        //if (!isNaN(name)) { return new Proxy(new BQuery(target.$children[parseInt(name)]), this); };
        target = (target?.$data || target);
        if (!isNaN(parseInt(name))) { return target.$get(parseInt(name)); };
        if (name == "length") { return target.$queryAll.length; };
        const _got_ = target[name];
        if (typeof _got_ == "function" && (typeof _got_?.bind == "function")) { return (_got_?.bind?.(target) || _got_); };
        return _got_;
    }

    //
    set(target, name, value) {
        target = (target?.$data || target);
        target[name] = value;
        return true;
    }
}
