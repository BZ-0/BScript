import Scrollable from "./Scrollable.mjs";
import Draggable from "./Draggable.mjs";
import SliderX from "./SliderX.mjs";

//
if (!(typeof self != "undefined" && typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)) {

    try {
        customElements.define("drag-gable", class _DRAG_  extends HTMLDivElement {
            constructor() {
                super();
                this.$self = new Draggable(this);
            }

            disconnectedCallback(...$args) {
               return this.$self.disconnectedCallback(...$args);
            }

            connectedCallback(...$args) {
                return this.$self.connectedCallback(...$args);
            }

            attributeChangedCallback(...$args) {
                return this.$self.attributeChangedCallback(...$args);
            }
            
        }, { extends: "div" });

        //
        customElements.define("scroll-able", class _SCROLL_  extends HTMLDivElement {
            constructor() {
                super();
                this.$self = new Scrollable(this);
            }

            disconnectedCallback(...$args) {
               return this.$self.disconnectedCallback(...$args);
            }

            connectedCallback(...$args) {
                return this.$self.connectedCallback(...$args);
            }

            attributeChangedCallback(...$args) {
                return this.$self.attributeChangedCallback(...$args);
            }
            
        }, { extends: "div" });

        //
        customElements.define("slider-x", class _SLIDER_ extends HTMLDivElement {
            constructor() {
                super();
                this.$self = new SliderX(this);
            }

            disconnectedCallback(...$args) {
                return this.$self.disconnectedCallback(...$args);
            }

            connectedCallback(...$args) {
                return this.$self.connectedCallback(...$args);
            }

            attributeChangedCallback(...$args) {
                return this.$self.attributeChangedCallback(...$args);
            }
            
        }, { extends: "div" });
    } catch(e) {};
};

export * from "./Media.mjs";