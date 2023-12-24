//
export default class BPath extends BDrawable {
    constructor(options = {}) {
        super((ctx)=>{
            if (this.$options.fill) { ctx.fill(this.$options.path); };
            if (this.$options.stroke) { ctx.stroke(this.$options.path); };
        }, options);
    }

    
};
