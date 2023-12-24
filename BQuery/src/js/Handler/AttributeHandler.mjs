//
export default class AttributeHandler {
    #attributes = {};
    #attribMap = new WeakMap();
    #elements = [];
    #registry = new FinalizationRegistry(($H)=>{});

    //
    constructor(selector, parent = document, $I = 0, $options = {}) {
        this.#attributes = {};
        this.#elements = [];
        this.#attribMap = new WeakMap();
        this.#registry = new FinalizationRegistry(($H)=>{
            
        });
    }
}
