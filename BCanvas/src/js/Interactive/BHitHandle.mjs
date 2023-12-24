//
export default class BHitHandle {
    #hits = [];

    //
    constructor(hits) {
        this.#hits = hits;
    }

    //
    get(target, name, receiver) {
        if (typeof name == "number" || !isNaN(parseInt(name))) { return this.#hits[parseInt(name)]?.$hits; };

        // length are available
        if (name == "length") { return this.#hits.length; };

        // 
        if ([
            "toReversed",
            "toSpliced",
            "toSorted",
            "filter", 
            "map", 
            "slice", 
            "flat", 
            "flatMap", 
            "concat", 
            "find", 
            "findIndex", 
            "findLast", 
            "findLastIndex", 
            "some", 
            "reduce"
        ].indexOf(name) >= 0) { 
            return this.#hits?.[name]?.bind?.(this.#hits);
        };

        //
        if (name == "$hits") { return this.#hits.flat(); };

        //
        const _got_ = target[name];
        if (typeof _got_ == "function") { return _got_.bind(target); };
        return _got_;
    }
}
