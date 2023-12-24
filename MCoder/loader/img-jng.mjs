import { JNG } from "/coder/index.mjs";

//
const _LOG_ = (...$args) => {
    console.log(...$args);
    return $args[0];
};

//
export default class JNGImage extends HTMLImageElement {
    //
    constructor() {
        super();
        const self = this;

        //
        this._empty = `data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=`;
        self.addEventListener("error", (e) => {
            e.preventDefault();
            this._loadImage(self.srcset || self.src);
        });

        //
        self.srcset = self.srcset;
        self.src = self.src;

        //
        this._prefetch(self.srcset || self.src);
    }

    _prefetch(_source) {
        (_source.split(",") || [_source]).map((_src_) => {
            const _spaced_ = _src_.split(" ") || [_src_];
            const _media_ = _spaced_.length > 1 ? _spaced_.pop() : "";

            //
            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = _spaced_.join(" ") || _media_;
            link.as = "fetch";
            link.fetchpriority = "low";
            document.head.appendChild(link);

            //
            link.onload = () => {
                document.head.removeChild(link);
            };
        });
    }

    _loadImage(_source) {
        //
        const self = this;
        const _srcset = (_source.split(",") || [_source]).map((_src_) => {
            const _spaced_ = _src_.split(" ") || [_src_];
            const _media_ = _spaced_.length > 1 ? _spaced_.pop() : "";
            return {
                url: _spaced_.join(" ") || _media_,
                media: _media_
            };
        });

        //
        if (!_srcset) {
            return this;
        }

        // make set srcset
        const _images = Promise.all(
            _srcset.map(async (src) => {
                try {
                    src.url = await new JNG().load(src.url).asPNG().then(URL.createObjectURL);
                } catch (e) {
                    console.error(e);
                }
                return src;
            })
        ).then((_I) => {
            const style = document.createElement("style");
            style.innerHTML = `img[src="${_source}"][is="img-jng"] {
    content: image-set(${_I
        .map((src) => {
            return `url("${src.url}") ${src.media}`;
        })
        .join(", ")});
}`;

            document.head.appendChild(style);
        });

        return this;
    }

    disconnectedCallback() {}
    connectedCallback() {
        this._prefetch(this.srcset || this.src);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this._prefetch(newValue);
    }

    static get observedAttributes() {
        return ["src", "srcset"];
    }
}

customElements.define("img-jng", JNGImage, { extends: "img" });
