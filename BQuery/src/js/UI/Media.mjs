//
if (!(typeof self != "undefined" && typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)) {

    //
    customElements.define("media-query", class _MEDIA_ extends HTMLDivElement {
        constructor() {
            super();
            this.#matchCase();
            this.classList.add("media");

            //
            window.addEventListener("resize", this.#matchCase.bind(this));
        }

        //
        #matchCase() {
            if (window.matchMedia(this.getAttribute("media")).matches) {
                this.style.setProperty("display","contents","important");
            } else {
                this.style.setProperty("display","none","important");
            }
        }

        //
        disconnectedCallback(...$args) {
            return this;
        }

        //
        connectedCallback(...$args) {
            this.#matchCase();
            return this;
        }

        //
        attributeChangedCallback(...$args) {
            return this;
        }
        
    }, { extends: "div" });

};
