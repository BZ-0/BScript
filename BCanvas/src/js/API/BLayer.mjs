import BGroup from "./BGroup.mjs";

//
export default class BLayer extends BGroup {
    constructor(options) {
        super(options);
        this.$options = options;
    }

    //
    $begin(ctx, $deviation = {}) {
        super.$begin(ctx, $deviation);
        ctx.beginLayer(ctx, {...(this.$options??{}), ...($deviation??{})});
        return this;
    }

    //
    $end(ctx, $deviation = {}) {
        ctx.endLayer(ctx);
        super.$end(ctx, $deviation);
        return this;
    }
};
