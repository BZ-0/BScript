import { Zoom } from "../Core/ZoomMod.mjs"
import { convertPointFromPageToNode } from "../Core/GeometryUtils.mjs"
import { exchange, promiseAnimationFrame, promiseDomContentLoaded } from "BTyped2/src/js/Utils/Utils.mjs"

//
import _style_ from "../../css/UI/Scrollable.css?raw"

//
export class ScrollBar {
    //
    #percent = 0;
    #applicant = 0;
    #axisName = 0;

    //
    #sizeCoef = ()=>{};
    #diffOfBox = ()=>{};
    #percentOf = ()=>{};
    #parentSize = ()=>{};

    //
    constructor({className, axisName, sizeCoef, diffOfBox, applicant, percentOf}) {
        
        this.element = document.createElement("div");
        this.element.classList.add(className);
        this.track = document.createElement("div");
        this.track.classList.add("track");
        this.element.appendChild(this.track);

        //
        this.pointerId = -1;
        this.#percent = 0;

        //
        this.#percentOf = percentOf;
        this.#sizeCoef = sizeCoef;
        this.#applicant = applicant;
        this.#axisName = axisName;
        this.#diffOfBox = diffOfBox;
        //this.#ownSize = ()=>(this.track[["offsetWidth", "offsetHeight"][this.#axisName]]);
        this.#parentSize = ()=>(this.element[["offsetWidth", "offsetHeight"][this.#axisName]]);

        //
        this.element.addEventListener("pointerdown", (e)=>{
            e.preventDefault();
            this.pointerId = e.pointerId;
            this.element.focus();
            this.last = convertPointFromPageToNode(this.element, e.pageX, e.pageY)[["x","y"][this.#axisName]];

            if (!document.body.classList.contains("dragging")) {
                document.body.classList.add("dragging");
            }
        });

        //
        document.addEventListener("pointermove", (e)=>{
            if (e.pointerId == this.pointerId) {
                e.preventDefault();
                const offset = convertPointFromPageToNode(this.element, e.pageX, e.pageY);
                const _axis_ = offset[["x","y"][this.#axisName]]||0;
                this.shift = (this.shiftOf + (_axis_ - exchange(this, "last", _axis_)));
            } else {
                this.percentOf;
            }
        });

        //
        document.addEventListener("pointerup", (e)=>{
            if (e.pointerId == this.pointerId) {
                e.preventDefault();
                this.pointerId = -1;
                document.body.classList.remove("dragging");
            };
        });
    }

    get diffOfBox() {
        if (this.#sizeCoef() > 0.999) {
            this.element.style.setProperty("pointer-events", "none", "");
            this.element.style.setProperty("opacity", "0.0", "");
        } else {
            this.element.style.removeProperty("pointer-events");
            this.element.style.removeProperty("opacity");
        }
        return this.#diffOfBox();
    }

    get shiftOf() {
        this.track.style.setProperty("--offsetPercent", (this.#percent = Math.min(Math.max(this.#percent, 0.0), 1.0)));
        return this.#percent * this.diffSize;
    }

    get shift() {
        this.track.style.setProperty("--offsetPercent", (this.#percent = Math.min(Math.max(this.#percent, 0.0), 1.0)));
        this.#applicant(this.#percent, this.diffOfBox);
        return this.#percent * this.diffSize;
    }

    get percent() {
        const _diffOfBox_ = this.diffOfBox;
        this.track.style.setProperty("--offsetPercent", (this.#percent = Math.min(Math.max(this.#percentOf(_diffOfBox_), 0.0), 1.0)));
        this.#applicant(this.#percent, _diffOfBox_);
        return this.#percent;
    }

    set shift(a) {
        this.percent = (a) / Math.max(this.diffSize, 0.0001);
    }

    set percent(a) {
        this.track.style.setProperty("--offsetPercent", (this.#percent = Math.min(Math.max(a, 0.0), 1.0)));
        this.#applicant(this.#percent, this.diffOfBox);
    }

    get percentOf() {
        this.track.style.setProperty("--offsetPercent", (this.#percent = Math.min(Math.max(this.#percentOf(this.diffOfBox), 0.0), 1.0)));
        return this.#percent;
    }

    set percentOf(a) {
        this.track.style.setProperty("--offsetPercent", (this.#percent = Math.min(Math.max(a, 0.0), 1.0)));
    }

    get diffSize() {
        return (1.0 - this.#sizeCoef()) * this.parentSize; 
    }

    get ownSize() {
        const _ownSize_ = (this.#sizeCoef() * this.parentSize);
        this.track.style.setProperty("--ownSize", _ownSize_ + "px");
        return _ownSize_;
    }

    get parentSize() {
        const _parentSize_ = this.#parentSize();
        this.track.style.setProperty("--parentSize", _parentSize_ + "px");
        this.track.style.setProperty("--ownSize", (this.#sizeCoef() * _parentSize_) + "px");
        return _parentSize_;
    }
    
}

export default class Scrollable {
    #topLeftP = null;
    #topRightP = null;
    #bottomLeftP = null;
    #bottomRightP = null;
    #points = null;
    #scroll = null;
    #scrollable = null;
    #content = null;
    #slot = null;
    #style = null;
    #zoom = null;
    #blank = null;
    #self = null;

    //
    constructor(self) {
        // wlop-elements
        this.#self = self;
        this.#topLeftP = document.createElement("div"); this.#topLeftP.classList.add("top-left");
        this.#topRightP = document.createElement("div"); this.#topRightP.classList.add("top-right");
        this.#bottomLeftP = document.createElement("div"); this.#bottomLeftP.classList.add("bottom-left");
        this.#bottomRightP = document.createElement("div"); this.#bottomRightP.classList.add("bottom-right");
        this.#points = [this.#topLeftP, this.#topRightP, this.#bottomLeftP, this.#bottomRightP];

        //
        this.#scroll = [
            new ScrollBar({
                className: "scroll-x", axisName: 0, 
                sizeCoef: ()=>Math.min(Math.max((this.#scrollable.clientWidth / Math.max(this.#content.getBoundingClientRect().width, 0.0001)), 0.0), 1.0), 
                diffOfBox: ()=>(this.#content.getBoundingClientRect().width - this.#scrollable.clientWidth), 
                applicant: (percent, diffOfBox)=>(this.#scrollable.scrollTo({ left: percent * diffOfBox, behavior: "instant" })),
                percentOf: (diffOfBox)=>(this.#scrollable["scrollLeft"] / Math.max(diffOfBox, 0.0001))
            }),
            new ScrollBar({
                className: "scroll-y", axisName: 1, 
                sizeCoef: ()=>Math.min(Math.max((this.#scrollable.clientHeight / Math.max(this.#content.getBoundingClientRect().height, 0.0001)), 0.0), 1.0), 
                diffOfBox: ()=>(this.#content.getBoundingClientRect().height - this.#scrollable.clientHeight), 
                applicant: (percent, diffOfBox)=>(this.#scrollable.scrollTo({ top : percent * diffOfBox, behavior: "instant" })),
                percentOf: (diffOfBox)=>(this.#scrollable["scrollTop"] / Math.max(diffOfBox, 0.0001))
            })
        ];

        //
        this.#scrollable = document.createElement("div");
        this.#scrollable.classList.add("scrollable");

        //
        this.#content = document.createElement("div");
        this.#content.classList.add("content");

        //
        this.#slot = document.createElement("slot");
        this.#style = document.createElement("style");

        //
        (async()=>{
            this.#style.textContent = _style_;
            this.#self.classList.add("scroll-able");
            Promise.any([promiseDomContentLoaded(), promiseAnimationFrame()]).then(this.$loadFromStorage.bind(this));
        })();

        //
        this.addEventListener("resize", this.$resize.bind(this));
        this.#scrollable.addEventListener("resize", this.$resize.bind(this));
        this.#content.addEventListener("resize", this.$resize.bind(this));
        window.addEventListener("resize", this.$resize.bind(this));

        //
        window.addEventListener("load", ()=>{
            this.$loadFromStorage().$saveToStorage();
        });
        window.addEventListener("unload", this.$saveToStorage.bind(this));
        window.addEventListener("beforeunload", this.$saveToStorage.bind(this));
        window.addEventListener("resize", ()=> { this.$updateSize().$updateScroll(); });
        document.addEventListener("resize", ()=> { this.$updateSize().$updateScroll(); });
        this.#self.addEventListener("resize", ()=> { this.$updateSize().$updateScroll(); });
        this.#scrollable.addEventListener("resize", ()=> { this.$updateSize().$updateScroll() });
        this.#scrollable.addEventListener("scroll", (e)=> { 
            //e.preventDefault();
            this.$updateSize().$updateScroll() 
        });

        //
        this.#self.attachShadow({ mode: "open" });
        this.#points.forEach((E)=>this.#self.shadowRoot.appendChild(E));
        
        //
        this.handleDrag = (e)=>{
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        //
        this.#blank = document.createElement('canvas');
        this.#blank.width = 1;
        this.#blank.height = 1;
        this.#blank.style.display = "none";

        //
        {   
            this.#scrollable.appendChild(this.#content);
            this.#content.appendChild(this.#slot);
            this.#self.shadowRoot.appendChild(this.#scroll[0].element);
            this.#self.shadowRoot.appendChild(this.#scroll[1].element);
            this.#self.shadowRoot.appendChild(this.#scrollable);
            this.#self.shadowRoot.appendChild(this.#style);
        }

        //
        if (!this.#self.hasAttribute("pinch-and-zoom") || this.#self.getAttribute("pinch-and-zoom")) {
            this.#zoom = new Zoom(this.#content, {
                minZoom: 1,
                maxZoom: 10,
                rotate: false,
                pan: false
            });
        }

        //
        Promise.any([promiseDomContentLoaded(), promiseAnimationFrame()]).then(this.$loadFromStorage.bind(this));

        //
        this.$loadFromStorage();
    }

    //
    $resize() {
        this.#content.style.setProperty("--scale", parseFloat(this.#content.innerWidth / this.#scrollable.innerWidth).toPrecision(21));
    }

    //
    $saveToStorage() {
        if (this.#self.hasAttribute("storage")) {
            if (!isNaN(this.#scroll[0].percentOf)) { localStorage.setItem(this.#self.getAttribute("storage") + "-spX", this.#scroll[0].percentOf); };
            if (!isNaN(this.#scroll[1].percentOf)) { localStorage.setItem(this.#self.getAttribute("storage") + "-spY", this.#scroll[1].percentOf); };
        }
        return this;
    }

    //
    $loadFromStorage() {
        this.#scroll.map((e)=>{ e.diffSize; });
        if (this.#self.hasAttribute("storage")) {
            this.#scroll[0].percent = parseFloat(localStorage.getItem(this.#self.getAttribute("storage") + "-spX"))||this.#scroll[0].percent;
            this.#scroll[1].percent = parseFloat(localStorage.getItem(this.#self.getAttribute("storage") + "-spY"))||this.#scroll[1].percent;
        } else {
            this.$updateScroll();
        }
        return this;
    }

    //
    $updateScroll() { this.#scroll.map((e,i)=>(e.percentOf)); return this; }
    $updateSize() { this.#scroll.map((e)=>(e.diffSize)); return this; }

    //
    disconnectedCallback() {
        
    }

    //
    connectedCallback() {
        return Promise.any([promiseDomContentLoaded(), promiseAnimationFrame()]).then(this.$loadFromStorage.bind(this));
    }
    
    //
    attributeChangedCallback(name, oldValue, newValue) {
        
    }

    //
    static get observedAttributes() {
        return [];
    }
}
