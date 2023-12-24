import BNode from "../API./Base/BNode.mjs";

//
export default class BGroup extends BNode {
    constructor(options = {}) {
        super(options);
        this.$children = [];
    }

    //
    remove(children) {
        this.$children.splice(this.$children.$children?.indexOf?.(children), 1);
        return this;
    }

    //
    add(children) {
        children?.$parent?.remove(children); // remove children from previous parent
        this.$children.push(children);
        children.$parent = this;
        return this;
    }

    //
    $draw(ctx, $deviation) {
        this.$begin(ctx, $deviation);
        this.$children.forEach(($c)=>$c.$draw(ctx, $deviation));
        this.$end(ctx, $deviation);
        return this;
    }

    //
    $hitTest(ctx, pointer) {
        this.$begin(ctx, {optimizeForTest: true});
        const result = (this.$children.filter(($c)=>$c.$hitTest(ctx, pointer)))||[];
        this.$end(ctx, {optimizeForTest: true});
        return (result.length > 0) ? new Proxy(this, new BHitHandle(result)) : null;
    }
};
