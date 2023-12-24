import { exchange, promiseAnimationFrame, promiseDomContentLoaded } from "BTyped2/src/js/Utils/Utils.mjs"
import _style_ from "../../css/UI/SliderX.css?raw";

//
export default class SliderX {
    #scrollable = null;
    #slot = null;
    #style = null;
    #self = null;

    //
    constructor(self) {
        this.#self = self;
        this.#scrollable = document.createElement("div");
        this.#slot = document.createElement("slot");
        this.#style = document.createElement("style");
        this.#scrollable.classList.add("scrollable");

        //
        (async()=>{
            this.#style.textContent = await _loader_("../../../css/UI/SliderX.css");
            this.#self.classList.add("slider-x");
        })();

        //
        const E = this.#scrollable;
        E.addEventListener("wheel", (e)=>{
            e.preventDefault();

            // abuse a scrolling bug?
            if (e.deltaY > 0) { E.scrollBy( 10, 0); };
            if (e.deltaY < 0) { E.scrollBy(-10, 0); };
        });

        //
        this.#self.attachShadow({ mode: "open" });
        this.#self.shadowRoot.appendChild(this.#scrollable);
        this.#self.shadowRoot.appendChild(this.#style);
        this.#scrollable.appendChild(this.#slot);
    }

    disconnectedCallback() {
        
    }

    connectedCallback() {
        
    }

    attributeChangedCallback(name, oldValue, newValue) {
        
    }

    static get observedAttributes() {
        return [];
    }
}
