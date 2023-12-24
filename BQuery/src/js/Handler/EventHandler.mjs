//
export default class EventHandler {
    #events = {};
    #elements = [];
    #eventMap = new WeakMap();
    #registry = new FinalizationRegistry(($H)=>{});

    //
    constructor(selector, parent = document, $I = 0, $options = {}) {
        this.#events = {};
        this.#elements = [];
        this.#eventMap = new WeakMap();
        this.#registry = new FinalizationRegistry(($H)=>{
            
        });
    }

    //
    $on($evt, ...$e) {
        (this.#events[$evt] ||= []).push($e);
        this.#elements.forEach(($el)=>{
            $el.addEventListener($evt, ...$e);

            // fill-in an exist event
            const _mapped_ = this.#eventMap.get($el) || {};
            (_mapped_[$evt] ||= []).push($e);
            this.#eventMap.set($el, _mapped_);
        });
        return this;
    }

    //
    $off($evt, ...$e) {
        const $I = this.#events.findIndex(($ev)=>($ev[0] == $e?.[0]));
        if ($I >= 0) { this.#events.splice($I, 1); };
        this.#elements.forEach(($el)=>($el.removeEventListener($evt, ...$e)));
        return this;
    }

    //
    $unbind($els) {
        $els.forEach(($el)=>{
            const $I = this.#elements.indexOf($el);
            if ($I >= 0) { 
                this.#elements.splice($I, 1);
                this.#eventMap.delete($el);
                for (const $evt in this.#events) {
                    (this.#events[$evt] || []).forEach(($e)=>($el.removeEventListener($evt, ...$e)));
                }
            };
        });
        return this;
    }

    //
    $bind($els) {
        $els.forEach(($el, $I)=>{
            if (this.#elements.indexOf($el) < 0) { 
                this.#elements.push($el);
                const _mapped_ = this.#eventMap.get($el) || {};

                //
                for (const $evt in this.#events) {
                    const $es = this.#events[$evt] || [];

                    // remap events, using with WeakMap
                    if (!_mapped_[$evt]?.find?.(($as)=>($as==$es))) { 
                        $es.forEach(($e)=>($el.addEventListener($evt, ...$e)));
                    }
                    this.#events[$evt] = $es;
                };

                //
                Object.assign(_mapped_, this.#events);
                this.#eventMap.set($el, _mapped_);
            }
        });
        return this;
    }
}
