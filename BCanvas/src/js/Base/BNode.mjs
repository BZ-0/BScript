export class BTrigger {
    constructor() {
        this.counter = 0;
        this.listener = new Set();
    }

    //
    on(cb) {
        this.listener.add(cb);
        return this;
    }

    //
    off(cb) {
        this.listener.remove(cb);
        return this;
    }
}

//
export default class BNode {
    $options = {};

    //
    constructor(options = {}, parent = null) {
        this.$triggers = new Map();
        this.$transform = options.transform ?? (new BTransform());
        this.$parent = parent;
    }

    // it's me!
    get $hits() { return this; }

    //
    $draw(ctx, $deviation) {
        return this;
    }

    //
    $trigger(name, pointer, from = null) {
        const trigger = this.$triggers.get(name);
        if (trigger) { // 
            if (name == "pointermove" && !trigger.pointers.has(pointer.pointerId)) {
                this.$trigger("pointermove", pointer, from);
            } else {
                trigger.counter ??= 0; const count = trigger.counter++;
                trigger.listener?.forEach?.((cb)=>{ cb(pointer, from ?? this, count) });
            }
            trigger.pointers.set(pointer.pointerId, pointer);
        }
        this.$parent?.$trigger?.(name, pointer, this);
        trigger.counter = 0;
        return this;
    }

    //
    $begin(ctx, $deviation) {
        ctx.save();
        if (this.$options.clip) { ctx.clip(this.$options.clip); };
        this.$transform.$apply(ctx);
        return this;
    }

    //
    $end(ctx, $deviation) {
        ctx.restore();
        return this;
    }

    //
    on($name, callback) {
        if (!this.$triggers.has($name)) {
            this.$triggers.set($name, new Trigger());
        }
        this.$triggers?.get?.($name)?.on?.(callback);
        return this;
    }

    //
    off($name, callback) {
        this.$triggers?.get?.($name)?.off?.(callback);
        return this;
    }

    //
    $hitTest(ctx, pointer, $deviation) {
        this.$begin(ctx, $deviation);
        const $result = this.$options.path ? (ctx.isPointInPath(this.$options.path, pointer.x, pointer.y) ? this : null) : false;
        this.$end(ctx, $deviation);

        // trigger pointerleave when negative result
        if (!$result && this.$triggers?.get("pointermove")?.pointers?.has?.(pointer.pointerId)) {
            this.$triggers.get("pointermove").pointers.remove(pointer.pointerId);
            this.$trigger("pointerleave", pointer, this);
        };

        //
        return $result;
    }
}
