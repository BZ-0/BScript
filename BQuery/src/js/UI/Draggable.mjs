import { convertPointFromPageToNode } from "../Core/GeometryUtils.mjs"
import { exchange, promiseAnimationFrame, promiseDomContentLoaded } from "BTyped2/src/js/Utils/Utils.mjs"
import _style_ from "../../css/UI/Draggable.css?raw";

//
export class DragAxis {
    constructor(size, applicant) {
        this.size = size;
        this.last = 0;
        this.shift = 0;
        this.applicant = ()=>applicant(this.shift);
        this.pointerId = -1;
    }
}

//
export default class Draggable {
    //
    #handle = null;
    #style = null;
    #content = null;
    #self = null;

    //
    constructor(self) {
        this.#self = self;
        this.#style = document.createElement("style");

        //
        (async()=>{
            this.#style.textContent = _style_;
            self.classList.add("drag-able");
            requestAnimationFrame(()=>{
                this.$loadFromStorage();
            });
        })();

        //
        this.#handle = document.createElement("slot");
        this.#handle.classList?.add("handle");
        this.#handle.setAttribute("name", "handle");

        //
        this.#content = document.createElement("slot");
        this.#content.classList?.add("content");
        this.#content.setAttribute("name", "content");

        //
        self.attachShadow({ mode: "open" });
        self.shadowRoot.appendChild(this.#handle);
        self.shadowRoot.appendChild(this.#content);
        self.shadowRoot.appendChild(this.#style);

        //
        window.addEventListener("beforeunload", this.$saveToStorage.bind(this));
        window.addEventListener("unload", this.$saveToStorage.bind(this));
        window.addEventListener("load", this.$saveToStorage.bind(this));

        //
        this.axis = [
            new DragAxis(()=>this.offsetWidth,  (shift)=> this.#self.style.setProperty("--x", shift + "px")),
            new DragAxis(()=>this.offsetHeight, (shift)=> this.#self.style.setProperty("--y", shift + "px"))
        ];
        

        {
            this.#handle.parentNode.addEventListener("pointerdown", (e)=> {
                this.focus();
                e.preventDefault();
                const offset = convertPointFromPageToNode(this.parentNode || this.getRootNode().host, e.pageX, e.pageY);
                this.axis.map((a, i)=>{ a.pointerId = e.pointerId; a["last"] = offset[["x","y"][i]]; a.applicant(); });
            });
            
            //
            document.addEventListener("pointermove", (e)=> {
                if (this.axis.find((a)=>(a.pointerId == e.pointerId))) { 
                    e.preventDefault();
                    const offset = convertPointFromPageToNode(this.parentNode || this.getRootNode().host, e.pageX, e.pageY);
                    this.axis.map((a, i)=>{
                        if (a.pointerId == e.pointerId) {
                            const _axis_ = offset[["x","y"][i]]||0;
                            a.shift += (_axis_ - (exchange(a, "last", _axis_)||0))||0;
                            // TODO: limit 'shift', of corrections
                            a.applicant();
                        }
                    });
                };
            });

            //
            document.addEventListener("pointerup", (e)=> {
                if (this.axis.find((a)=>(a.pointerId == e.pointerId))) { e.preventDefault();
                    //const offset = convertPointFromPageToNode(this.parentNode || this.getRootNode().host, e.pageX, e.pageY);
                    this.axis.map((a, i)=>{
                        if (a.pointerId == e.pointerId) { a.pointerId = -1; a.applicant(); };
                    });
                };
            });
        }

        //
        Promise.any([promiseDomContentLoaded(), promiseAnimationFrame()]).then(()=>{
            this.$loadFromStorage();
        });

        //
        this.$loadFromStorage();
    }

    $saveToStorage() {
        if (this.#self.hasAttribute("storage")) {
            if (!isNaN(this.axis[0].shift)) { localStorage.setItem(this.#self.getAttribute("storage") + "-x", this.axis[0].shift); };
            if (!isNaN(this.axis[1].shift)) { localStorage.setItem(this.#self.getAttribute("storage") + "-y", this.axis[1].shift); };
        }
        return this;
    }

    $loadFromStorage() {
        if (this.#self.hasAttribute("storage")) {
            this.axis[0].shift = parseFloat(localStorage.getItem(this.#self.getAttribute("storage") + "-x"))||0;
            this.axis[1].shift = parseFloat(localStorage.getItem(this.#self.getAttribute("storage") + "-y"))||0;
            this.axis.map((e)=>e.applicant());
        }
        return this;
    }

    disconnectedCallback() {
        
    }

    connectedCallback() {
        return Promise.any([promiseDomContentLoaded(), promiseAnimationFrame()]).then(()=>{
            this.$loadFromStorage(); 
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        
    }

    static get observedAttributes() {
        return [];
    }
}
