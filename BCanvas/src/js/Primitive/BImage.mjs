import BDrawable from "./BDrawable.mjs";

//
export default class BImage extends BDrawable {
    #image = null;

    //
    constructor(image, options = {}) {
        super((ctx)=>{
            if (this.#image && !(this.#image instanceof Promise)) {
                ctx.drawImage(this.#image, 0, 0);
            }
        }, options);

        //
        this.$load(image);
    }

    //
    $load(image) {
        this.#image = null;
        if (image instanceof Promise) {
            return (this.#image = image.then(($I)=>this.$load($I)));
        } else
        if (typeof image == "string") {
            return (this.#image = fetch(image).then(($r)=>$r.blob()).then(($b)=>createImageBitmap($b)).then(($I)=>this.#image = $I));
        } else 
        if (image instanceof Blob) {
            return (this.#image = createImageBitmap(image).then(($I)=>this.#image = $I));
        }
        return (this.#image = image);
    }
};
