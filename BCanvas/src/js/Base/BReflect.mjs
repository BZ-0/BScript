// under reflection may be layer, or any other with clipping
export default class BReflect extends BNode {
    constructor(options = {}) {
        super(options);
    }

    // it's me!
    get $hits() { return this; }

    //
    $draw(ctx, $deviation) {
        this.$begin(ctx, $deviation);
        this.$options.$reflect.$draw(ctx, {...(this.$options.$deviation??{}), ...($deviation??{})});
        this.$end(ctx, $deviation);
        return this;
    }

    //
    $hitTest(ctx, pointer) {
        return false;
    }
}
