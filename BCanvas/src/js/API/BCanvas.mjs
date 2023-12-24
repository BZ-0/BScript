import BGroup from "../Base/BGroup.mjs";
import BEvent from "../Interactive/BEvent.mjs";

//
export default class BCanvas extends BGroup {
    #ctx = null;
    #canvas = null;
    #phantom = null;
    #loop = ()=>{};
    #event = null;

    //
    constructor(ctx, options) {
        super(options);

        //
        this.#ctx = ctx;
        this.#canvas = ctx.canvas;
        this.#phantom = new OffscreenCanvas(
            (this.#canvas.width/Math.min(this.#canvas.height, this.#canvas.width)), 
            (this.#canvas.height/Math.min(this.#canvas.height, this.#canvas.width))
        ).getContext("2d");
        this.$options = options;

        //
        this.#event = new BEvent(this, this.$options.handler ?? this.#canvas, this.#phantom);
        this.#loop = async ($t)=>{
            while (true) {
                await new Promise((r)=>requestAnimationFrame(r));
                this.$draw(this.#ctx);
            }
            return true;
        }

        //
        this.#loop();
    }

    //
    get $handler() {
        return this.$options.handler;
    }

    //
    get $container() {
        return this.$options.container;
    }

    // DPI scaling support
    get $scale() {
        if (typeof this.$options.scale == "number") {
            return [this.$options.scale, this.$options.scale];
        } else
        if (Array.isArray(this.$options.scale)) {
            return [this.$options.scale[0], this.$options.scale[1]];
        } else 
        if (typeof this.$options.scale == "object") {
            return [this.$options.scale.x, this.$options.scale.y];
        }
        return [1, 1];
    }

    //
    $begin(ctx, $dev) {
        ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        ctx.save();
        ctx.scale(...this.$scale);
        super.$begin(ctx, $dev);
        return this;
    }

    //
    $end(ctx, $dev) {
        super.$end(ctx, $dev);
        ctx.restore();
        return this;
    }
};
