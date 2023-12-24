const selectors = new Map([]);

//
const attributeObserver = new MutationObserver(async (mutationList, observer)=>{
    mutationList.forEach(async (mut)=>{
        if (["class", "id", "style"].indexOf(mut.attributeName) >= 0) {
            const value = mut.target.getAttribute(mut.attributeName);
            if (value != mut.oldValue) {
                for (const [selector, fns] of selectors.entries()) {
                    if (Array.from(ROOT.querySelectorAll(selector)).indexOf(mut.target) > -1) { 
                        fns.map((F)=>F([mut.target]));
                    };
                }
            }
        }
    });
});

//
const aMap = new WeakMap([]);

//
const applyAttrib = async (elements, attribs)=>{
    for (const [key, value] of attribs.entries()) {
        elements.map(async (e,I)=>{
            if (["id", "class", "style"].indexOf(key) < 0 && !key.startsWith("az-")) {
                e.setAttribute(key, (typeof value == "function") ? (await value(e,I)) : value);
            }

            //
            if (!e.getAttributeNS("azs", "az-bound")) {
                attributeObserver.observe(e, {attributes: true});
                e.setAttributeNS("azs", "az-bound", true);

                //
                e.addEventListener("pointerenter", (evt)=>{
                    e.classList.add(`az-hover-${evt.pointerId}`);
                });

                //
                e.addEventListener("pointerleave", (evt)=>{
                    e.classList.remove(`az-hover-${evt.pointerId}`);
                });

                //
                e.addEventListener("pointerdown", (evt)=>{
                    e.classList.add(`az-active-${evt.pointerId}`);
                });

                //
                document.addEventListener("pointerup", (evt)=>{
                    e.classList.remove(`az-active-${evt.pointerId}`);
                }, true);
            }
        });
    }
}

//
const reflectAttribInStyle = async (elements, attribs)=>{
    for (const [key, unit] of attribs.entries()) {
        elements.map(async (e,I)=>{
            const K = await ((typeof key == "function") ? key(e,I) : key);
            e?.style?.setPropety?.((K.startsWith("az-") ? `--${K}` : `--az-${K}`), (typeof unit == "function") ? (await unit?.(e?.getAttribute?.(K))) : (`${e?.getAttribute?.(K)}${unit ?? ""}`), "");
        });
    }
}

//
const eMap = new WeakMap([]);
const applyEvents = async (elements, args)=>{
    elements.map(async (e,I)=>{
        if (!eMap.has(e)) { eMap.set(e, []); }

        //
        const evts = eMap.get(e);
        if (evts.indexOf(args) < 0) {
            evts.push(args);
            e.addEventListener(...args);
        }
    });
}

//
const nodeObserver = new MutationObserver(async (mutationList, observer)=>{
    for (const [selector, fns] of selectors.entries()) {
        mutationList.forEach(async (mut)=>{
            const elements = Array.from(mut.target.querySelectorAll(selector));
            const elems = mut.childList?.filter((e)=>{
                return (elements.indexOf(e) > -1);
            })||[];

            //
            if (elements.indexOf(mut.target) > -1 && elems.indexOf(mut.target) < 0) { elems.push(mut.target); };

            //
            fns.map((F)=>F(elems));
        });
    }
});

//
const ROOT = document.body;
nodeObserver.observe(ROOT, {childList: true, subtree: true});

//
export default class AZS {
    static async prebind(selector, fn) {
        if (!selectors.has(selector)) {
            selectors.set(selector, [fn]);
        } else {
            selectors.get(selector).push(fn);
        }

        //
        fn(Array.from(ROOT.querySelectorAll(selector)));
    }

    //
    static async sheet(selector, attributes) {
        AZS.prebind(selector, (elements)=>{
            // pre-set attributes
            applyAttrib(elements, (attributes instanceof Map ? attributes : new Map(attributes)));
        });
    }

    //
    static async event(selector, args) {
        AZS.prebind(selector, (elements)=>{
            // pre-set attributes
            applyEvents(elements, args);
        });
    }

    //
    static async attribCSS(selector, attributes) {
        AZS.prebind(selector, (elements)=>{
            reflectAttribInStyle(elements, attributes);
        });
    }
}
