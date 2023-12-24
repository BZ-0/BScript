import AttributeHandler from "../Handler/AttributeHandler.mjs";
import EventHandler from "../Handler/EventHandler.mjs";
import BQueryProxyHandler from "../Proxy/BQueryProxyHandler.mjs";
import StyleProxyHandler from "../Proxy/StyleProxyHandler.mjs";
import ClassProxyHandler from "../Proxy/ClassProxyHandler.mjs";
import AttributeProxyHandler from "../Proxy/AttributeProxyHandler.mjs";
import PromiseProxyHandler from "../Proxy/PromiseProxyHandler.mjs";
import HTMLProxyHandler from "../Proxy/HTMLProxyHandler.mjs";
import BCRProxyHandler from "../Proxy/BCRProxyHandler.mjs";
import ScrollProxyHandler from "../Proxy/ScrollProxyHandler.mjs";

//
const wrap = (obj)=>{
    const _hack_ = function(){};
    _hack_.$data = obj;
    return _hack_;
}

//
export default class BQuery {
    #selector = "";
    #document = document;
    #idx = 0;
    #observer = null;
    #registry = new FinalizationRegistry(($H)=>{});

    // TODO! Attribute handler...
    #handler = new EventHandler();

    //
    constructor(selector, parent = document, $I = 0, $options = {}) {
        this.#selector = selector;
        this.#document = parent || document;
        this.#idx = $I;
        this.#handler = new EventHandler(this.#selector, this.#document, $I, $options);

        // TODO! finalization when someone goes to GC
        this.#registry = new FinalizationRegistry(($H)=>{
            
        });

        // TODO! support dynamic event binding
        this.#observer = new MutationObserver((mutationList, observer)=>{
            mutationList.forEach(($m)=>{
                // 
                switch($m.type) {
                    case "childList":
                    
                    break;
    
                    case "subtree":
                    
                    break;
                }

                // 
                this.#handler.$bind($m?.addedNodes?.filter?.(($e)=>(this.$contain($e))) || []);
                this.#handler.$unbind($m?.removedNodes || []);
            });
        });

        //
        this.#observer.observe(this.#document, {
            attributes: false, //true, 
            attributeOldValue: false, //true,
            childList: true, 
            subtree: true, 
            ...(this.$options = $options)
        });
    }

    // TODO! needs to add setter from object
    set attr(attrs) { return true; };
    set css(styles) { return true; };
    set html($html) { this.$queryAll.forEach(($c)=>($c.innerHTML = $html)); return true; }

    // TODO! multiple elements support
    get scroll() { return new Proxy(wrap(this.$query), new ScrollProxyHandler(this)); };
    get html() { return new Proxy(wrap(this.$query), new HTMLProxyHandler(this)); };
    get attr() { return new Proxy(wrap(this.$query), new AttributeProxyHandler(this)); };
    get class() { return new Proxy(wrap(this.$query?.classList), new ClassProxyHandler(this)); };
    get css() { return new Proxy(wrap(this.$query?.style), new StyleProxyHandler(this)); };
    get computedCSS() { return new Proxy(wrap(getComputedStyle(this.$query, "")), new StyleProxyHandler(this)); };
    get boundingClientRect() { return new Proxy(wrap(this.$query.getBoundingClientRect()), new BCRProxyHandler(this)); };



    //
    $contain($e) { return (this.$queryAll?.indexOf($e) >= 0); }
    $get($I = 0) { return new Proxy(new BQuery(this.#selector, this.#document, $I, this.$options), new BQueryProxyHandler()); }
    get() { return this.$query; }

    //
    get length() { return this.$queryAll.length; };
    get $query() { return this.$queryAll[this.#idx]; }
    get $queryAll() { return typeof this.#selector == "string" ? this.#document?.querySelectorAll?.(this.#selector) : (Array.isArray(this.#selector) ? this.#selector : [this.#selector]); }
    get $children() { return this.$query.children; }
    get parent() { return new Proxy(new BQuery(this.$query?.parentNode || this.$query?.getRootNode()?.host, document, 0, this.$options), new BQueryProxyHandler()); }
    get children() { return new Proxy(new BQuery(this.$children, this.$query), new BQueryProxyHandler()); };
    get siblings() { const $e = this.$query; return new Proxy(new BQuery(($e?.parentNode || $e?.getRootNode()?.host)?.children?.filter?.(($c)=>($c!=$e))), new BQueryProxyHandler()); }

    //
    on(name, cb, bubble = false) {
        this.#handler.$bind(this.$queryAll).$on(name, cb, bubble);
        return this;
    }

    //
    off(name, cb, bubble = false) {
        this.#handler.$off(name, cb, bubble);
        return this;
    }

    // use new proxy-promised syntax for...
    get ready() {
        return new Proxy(wrap(new Promise((resolve, reject)=>{
            
            if (this.$query.readyState != null) {
                if (this.$query.readyState != "loading") 
                { resolve({}); } else {
                    const _wrap_ = (e)=>{ 
                        this.$query?.removeEventListener?.("DOMContentLoaded", _wrap_);
                        resolve(e);
                    };
                    this.$query?.addEventListener?.("DOMContentLoaded", _wrap_);
                }
            } else { reject({}); };
        })), new PromiseProxyHandler(this));
    }
};
