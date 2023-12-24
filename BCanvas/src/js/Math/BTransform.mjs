//
export default class BTransform {
    #matrix = [1, 0, 0, 1, 0, 0];
    #cmds = [];

    //
    constructor() {
        this.#matrix = matrix;
        this.#cmds = [];
    }

    //
    translate(x, y) {
        this.#cmds.push({$cmd: "translate", $args: [x, y]});
        return this;
    }

    //
    scale(sx, sy) {
        this.#cmds.push({$cmd: "scale", $args: [sx, sy || sx]});
        return this;
    }

    //
    rotate(rad) {
        this.#cmds.push({$cmd: "rotate", $args: [rad]});
        return this;
    }

    //
    $apply(ctx) {
        this.#cmds.forEach(($c)=>ctx[$c.$cmd](...$c.$args));
        return this;
    }
};
