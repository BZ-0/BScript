import BNode from "../Base/BNode.mjs";

//
export default class BDrawable extends BNode {
    #drawCmd = ()=>{};

    //
    constructor(drawCmd, options = {}) {
        super(options);
        this.#drawCmd = (ctx)=>{
            ((drawCmd) ?? ((ctx) => {}))(ctx);
            return this;
        };
    }

    //
    $draw(ctx) {
        this.$begin(ctx).#drawCmd(ctx).$end(ctx);
        return this;
    }
};
