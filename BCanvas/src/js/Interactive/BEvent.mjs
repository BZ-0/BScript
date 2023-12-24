import { convertPointFromPageToNode } from "../Geometry/GeometryUtils.mjs";

//
export default class BEvent {
    constructor(canvas, handler, phantom) {
        this.$canvas = canvas;
        this.$handler = handler;
        this.$phantom = phantom;
        this.$pointers = new Map();

        //
        this.$handler?.addEventListener?.("pointerdown", (e)=>{
            const {x, y} = convertPointFromPageToNode(this.$canvas, e.pageX, e.pageY);
            if (!this.$pointers.has(e.pointerId)) {
                this.$pointers.set(e.pointerId, {});
            }

            //
            const pntr = this.$pointers.get(e.pointerId);
            pntr.x = x, pntr.y = y, pntr.pointerId = e.pointerId;

            //
            this.$canvas.$hitTest(this.$phantom, pntr)?.map?.((H)=>{
                H.$trigger("pointerdown", pntr);
            });
        });

        //
        this.$handler?.addEventListener?.("pointerenter", (e)=>{
            const {x, y} = convertPointFromPageToNode(this.$canvas, e.pageX, e.pageY);
            if (!this.$pointers.has(e.pointerId)) {
                this.$pointers.set(e.pointerId, {});
            }

            //
            const pntr = this.$pointers.get(e.pointerId);
            pntr.x = x, pntr.y = y, pntr.pointerId = e.pointerId;

            //
            this.$canvas.$hitTest(this.$phantom, pntr)?.map?.((H)=>{
                H.$trigger("pointerenter", pntr);
            });
        });

        //
        this.$handler?.addEventListener?.("pointerleave", (e)=>{
            const {x, y} = convertPointFromPageToNode(this.$canvas, e.pageX, e.pageY);
            if (!this.$pointers.has(e.pointerId)) {
                this.$pointers.set(e.pointerId, {});
            }

            //
            const pntr = this.$pointers.get(e.pointerId);
            pntr.x = x, pntr.y = y, pntr.pointerId = e.pointerId;

            //
            this.$canvas.$hitTest(this.$phantom, pntr)?.map?.((H)=>{
                H.$trigger("pointerleave", pntr);
            });
        });

        //
        document?.addEventListener?.("pointermove", (e)=>{
            const {x, y} = convertPointFromPageToNode(this.$canvas, e.pageX, e.pageY);
            if (!this.$pointers.has(e.pointerId)) {
                this.$pointers.set(e.pointerId, {});
            }

            //
            const pntr = this.$pointers.get(e.pointerId);
            pntr.x = x, pntr.y = y, pntr.pointerId = e.pointerId;

            //
            this.$canvas.$hitTest(this.$phantom, pntr.x, pntr.y)?.map?.((H)=>{
                H.$trigger("pointermove", pntr);
            });
        });

        //
        document?.addEventListener?.("pointerup", (e)=>{
            const {x, y} = convertPointFromPageToNode(this.$canvas, e.pageX, e.pageY);
            if (!this.$pointers.has(e.pointerId)) {
                this.$pointers.set(e.pointerId, {});
            }

            //
            const pntr = this.$pointers.get(e.pointerId);
            pntr.x = x, pntr.y = y, pntr.pointerId = e.pointerId;

            //
            this.$canvas.$hitTest(this.$phantom, pntr.x, pntr.y)?.map?.((H)=>{
                H.$trigger("pointerup", pntr);
            });

            //
            delete this.$pointers[e.pointerId];
        });
    }
}
