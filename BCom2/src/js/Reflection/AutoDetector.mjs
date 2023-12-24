// @ts-nocheck
"use strict"

//
import { fp16m } from "../Library/Imports.mjs"
import { _LOG_, isPlainObject } from "../Library/Symbols.mjs"
import { wrapFunc, defaultReflection } from "./DirectReflection.mjs"

//
export default class AutoDetector {
    $rules = null
    $instances = []
    $transfer = []
    $shared = []
    $typed = {}

    //
    constructor(data) {
        //
        this.$instances = [
            //DataView,
            typeof OffscreenCanvas != "undefined" ? OffscreenCanvas : undefined,
            typeof OffscreenCanvasRenderingContext2D != "undefined" ? OffscreenCanvasRenderingContext2D : undefined,
            Promise
        ].filter((I) => {
            return typeof I != "undefined"
        })
        if (typeof HTMLCanvasElement != "undefined") {
            this.$instances.push(HTMLCanvasElement)
        }

        //
        this.$shared = [Blob].concat([typeof SharedWorker != "undefined" ? SharedWorker : undefined, typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : undefined, typeof WebAssembly.Module != "undefined" ? WebAssembly.Module : undefined]).filter((I) => {
            return typeof I != "undefined"
        })

        //
        this.$typed = {
            $u8: typeof Uint8Array != "undefined" ? Uint8Array : Array,
            $u8c: typeof Uint8ClampedArray != "undefined" ? Uint8ClampedArray : Array,
            $i8: typeof Int8Array != "undefined" ? Int8Array : Array,
            $u16: typeof Uint16Array != "undefined" ? Uint16Array : Array,
            $i16: typeof Int16Array != "undefined" ? Int16Array : Array,
            $u32: typeof Uint32Array != "undefined" ? Uint32Array : Array,
            $i32: typeof Int32Array != "undefined" ? Int32Array : Array,
            $f32: typeof Float32Array != "undefined" ? Float32Array : Array,
            $f64: typeof Float64Array != "undefined" ? Float64Array : Array,
            $i64: typeof BigInt64Array != "undefined" ? BigInt64Array : Array,
            $u64: typeof BigUint64Array != "undefined" ? BigUint64Array : Array,
            $dv: typeof DataView != "undefined" ? DataView : Array
            //"$mp": typeof MessagePort != "undefined" ? MessagePort : Array
        }

        // try to load float16 support
        this.$typed["$f16"] = fp16m?.Float16Array

        //
        this.$transfer = [
            ArrayBuffer,
            MessagePort,
            ReadableStream,
            WritableStream,
            TransformStream,
            WebAssembly.Memory

            /*
    Uint8Array,
    Uint8ClampedArray,
    Int8Array,
    Uint16Array,
    Int16Array,
    Uint32Array,
    Int32Array,
    Float16Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
    DataView,
    */

            //Blob,
        ]
            .concat([typeof OffscreenCanvas != "undefined" ? OffscreenCanvas : undefined, typeof SharedArrayBuffer != "undefined" ? SharedArrayBuffer : undefined, typeof ImageBitmap != "undefined" ? ImageBitmap : undefined, typeof AudioData != "undefined" ? AudioData : undefined, typeof VideoFrame != "undefined" ? VideoFrame : undefined])
            .filter((I) => {
                return typeof I != "undefined"
            })

        //
        this["&data"] = data
        this.$rules = new Map([
            [
                "promise",
                ($m) => {
                    return $m instanceof Promise
                }
            ],
            [
                "typedarray",
                ($m) => {
                    return ($m?.buffer && $m.BYTES_PER_ELEMENT) || $m instanceof DataView
                }
            ],
            [
                "array",
                ($m) => {
                    return Array.isArray($m) || $m instanceof Array
                }
            ],
            [
                "shared",
                ($m) => {
                    return typeof $m == "object" && this.$shared.some((C) => $m instanceof C)
                }
            ], // abscent
            [
                "transfer",
                ($m) => {
                    return typeof $m == "object" && this.$transfer.some((C) => $m instanceof C)
                }
            ], // abscent
            [
                "class",
                ($m) => {
                    return (typeof $m == "object" && (this.$instances.some((C) => $m instanceof C) || !isPlainObject($m))) || typeof $m == "function"
                }
            ],
            [
                "proxy",
                ($m) => {
                    return $m?.["&typeof"] == "proxy"
                }
            ],
            [
                "object",
                ($m) => {
                    return typeof $m == "object" || isPlainObject($m)
                }
            ]
        ])
    }

    //
    $dropShared($m) {
        return !this.$shared.some((C) => $m instanceof C || $m?.buffer instanceof C) && this.$transfer.some((C) => $m instanceof C || $m?.buffer instanceof C)
    }

    //
    $typewrap($t, $ab, $bo, $bl, $meta) {
        if (!$t || $t == "$unk" || !this.$typed[$t]) return $ab
        const $I = new this.$typed[$t]($ab, $bo, $bl / (this.$typed[$t]?.BYTES_PER_ELEMENT || 1))
        return $meta
            ? new Proxy(
                  wrapFunc({
                      ["&data"]: $I,
                      ["&code"]: {
                          ["&meta"]: $meta,
                          ["&typeof"]: "transfer"
                      }
                  }),
                  defaultReflection
              )
            : $I
    }

    //
    $typedarray($ta) {
        for (const $t in this.$typed) {
            if ($ta instanceof this.$typed[$t]) {
                return $t
            }
        }
        return "$unk"
    }

    //
    get ["&typeof"]() {
        if (this["&data"]?.["&typeof"]) {
            return this["&data"]?.["&typeof"]
        }
        for (const key of this.$rules.keys()) {
            if (this.$rules.get(key)(this["&data"])) {
                return key
            }
        }
        return "primitive"
    }

    //
    get ["&code"]() {
        return {
            "&persistent": false,
            "&typeof": this?.["&typeof"],
            "&data": this?.["&data"],
            "&isCode": true
        }
    }
}

//
AutoDetector.isPlainObject = isPlainObject

//
export { isPlainObject }
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmcDE2bSIsIl9MT0dfIiwiaXNQbGFpbk9iamVjdCIsIndyYXBGdW5jIiwiZGVmYXVsdFJlZmxlY3Rpb24iLCJBdXRvRGV0ZWN0b3IiLCIkcnVsZXMiLCIkaW5zdGFuY2VzIiwiJHRyYW5zZmVyIiwiJHNoYXJlZCIsIiR0eXBlZCIsImNvbnN0cnVjdG9yIiwiZGF0YSIsIk9mZnNjcmVlbkNhbnZhcyIsInVuZGVmaW5lZCIsIk9mZnNjcmVlbkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCIsIlByb21pc2UiLCJmaWx0ZXIiLCJJIiwiSFRNTENhbnZhc0VsZW1lbnQiLCJwdXNoIiwiQmxvYiIsImNvbmNhdCIsIlNoYXJlZFdvcmtlciIsIlNoYXJlZEFycmF5QnVmZmVyIiwiV2ViQXNzZW1ibHkiLCJNb2R1bGUiLCJVaW50OEFycmF5IiwiQXJyYXkiLCJVaW50OENsYW1wZWRBcnJheSIsIkludDhBcnJheSIsIlVpbnQxNkFycmF5IiwiSW50MTZBcnJheSIsIlVpbnQzMkFycmF5IiwiSW50MzJBcnJheSIsIkZsb2F0MzJBcnJheSIsIkZsb2F0NjRBcnJheSIsIkJpZ0ludDY0QXJyYXkiLCJCaWdVaW50NjRBcnJheSIsIkRhdGFWaWV3IiwiRmxvYXQxNkFycmF5IiwiQXJyYXlCdWZmZXIiLCJNZXNzYWdlUG9ydCIsIlJlYWRhYmxlU3RyZWFtIiwiV3JpdGFibGVTdHJlYW0iLCJUcmFuc2Zvcm1TdHJlYW0iLCJNZW1vcnkiLCJJbWFnZUJpdG1hcCIsIkF1ZGlvRGF0YSIsIlZpZGVvRnJhbWUiLCJNYXAiLCIkbSIsImJ1ZmZlciIsIkJZVEVTX1BFUl9FTEVNRU5UIiwiaXNBcnJheSIsInNvbWUiLCJDIiwiJGRyb3BTaGFyZWQiLCIkdHlwZXdyYXAiLCIkdCIsIiRhYiIsIiRibyIsIiRibCIsIiRtZXRhIiwiJEkiLCJQcm94eSIsIiR0eXBlZGFycmF5IiwiJHRhIiwiJnR5cGVvZiIsImtleSIsImtleXMiLCJnZXQiLCImY29kZSJdLCJzb3VyY2VzIjpbIkM6XFxQcm9qZWN0c1xcQlowXFxCQ29tMlxcc3JjXFxjaXZldFxcUmVmbGVjdGlvblxcQXV0b0RldGVjdG9yLmNpdmV0Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1ub2NoZWNrXG5cInVzZSBzdHJpY3RcIjtcblxuLy9cbmltcG9ydCB7IGZwMTZtIH0gZnJvbSBcIi4uL0xpYnJhcnkvSW1wb3J0c1wiO1xuaW1wb3J0IHsgX0xPR18sIGlzUGxhaW5PYmplY3QgfSBmcm9tIFwiLi4vTGlicmFyeS9TeW1ib2xzXCI7XG5pbXBvcnQgeyB3cmFwRnVuYywgZGVmYXVsdFJlZmxlY3Rpb24gfSBmcm9tIFwiLi9EaXJlY3RSZWZsZWN0aW9uXCI7XG5cbi8vXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRvRGV0ZWN0b3Ige1xuICAgICRydWxlcyA9IG51bGw7XG4gICAgJGluc3RhbmNlcyA9IFtdO1xuICAgICR0cmFuc2ZlciA9IFtdO1xuICAgICRzaGFyZWQgPSBbXTtcbiAgICAkdHlwZWQgPSB7fTtcblxuICAgIC8vXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICAvL1xuICAgICAgICB0aGlzLiRpbnN0YW5jZXMgPSBbXG4gICAgICAgICAgICAvL0RhdGFWaWV3LFxuICAgICAgICAgICAgdHlwZW9mIE9mZnNjcmVlbkNhbnZhcyAhPSBcInVuZGVmaW5lZFwiID8gT2Zmc2NyZWVuQ2FudmFzIDogdW5kZWZpbmVkLCBcbiAgICAgICAgICAgIHR5cGVvZiBPZmZzY3JlZW5DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgIT0gXCJ1bmRlZmluZWRcIiA/IE9mZnNjcmVlbkNhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA6IHVuZGVmaW5lZCwgUHJvbWlzZV0uZmlsdGVyKChJKSA9PiB7IHJldHVybiB0eXBlb2YgSSAhPSBcInVuZGVmaW5lZFwiOyB9KTtcbiAgICAgICAgaWYgKHR5cGVvZiBIVE1MQ2FudmFzRWxlbWVudCAhPSBcInVuZGVmaW5lZFwiKSB7IFxuICAgICAgICAgICAgdGhpcy4kaW5zdGFuY2VzLnB1c2goSFRNTENhbnZhc0VsZW1lbnQpOyBcbiAgICAgICAgfTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzLiRzaGFyZWQgPSBbQmxvYl0uY29uY2F0KFtcbiAgICAgICAgICAgIHR5cGVvZiBTaGFyZWRXb3JrZXIgIT0gXCJ1bmRlZmluZWRcIiA/IFNoYXJlZFdvcmtlciA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHR5cGVvZiBTaGFyZWRBcnJheUJ1ZmZlciAhPSBcInVuZGVmaW5lZFwiID8gU2hhcmVkQXJyYXlCdWZmZXIgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB0eXBlb2YgV2ViQXNzZW1ibHkuTW9kdWxlICE9IFwidW5kZWZpbmVkXCIgPyBXZWJBc3NlbWJseS5Nb2R1bGUgOiB1bmRlZmluZWQsXG4gICAgICAgIF0pLmZpbHRlcigoSSkgPT4geyByZXR1cm4gdHlwZW9mIEkgIT0gXCJ1bmRlZmluZWRcIjsgfSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgdGhpcy4kdHlwZWQgPSB7XG4gICAgICAgICAgICBcIiR1OFwiOiB0eXBlb2YgVWludDhBcnJheSAhPSBcInVuZGVmaW5lZFwiID8gVWludDhBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkdThjXCI6IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPSBcInVuZGVmaW5lZFwiID8gVWludDhDbGFtcGVkQXJyYXkgOiBBcnJheSxcbiAgICAgICAgICAgIFwiJGk4XCI6IHR5cGVvZiBJbnQ4QXJyYXkgIT0gXCJ1bmRlZmluZWRcIiA/IEludDhBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkdTE2XCI6IHR5cGVvZiBVaW50MTZBcnJheSAhPSBcInVuZGVmaW5lZFwiID8gVWludDE2QXJyYXkgOiBBcnJheSxcbiAgICAgICAgICAgIFwiJGkxNlwiOiB0eXBlb2YgSW50MTZBcnJheSAhPSBcInVuZGVmaW5lZFwiID8gSW50MTZBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkdTMyXCI6IHR5cGVvZiBVaW50MzJBcnJheSAhPSBcInVuZGVmaW5lZFwiID8gVWludDMyQXJyYXkgOiBBcnJheSxcbiAgICAgICAgICAgIFwiJGkzMlwiOiB0eXBlb2YgSW50MzJBcnJheSAhPSBcInVuZGVmaW5lZFwiID8gSW50MzJBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkZjMyXCI6IHR5cGVvZiBGbG9hdDMyQXJyYXkgIT0gXCJ1bmRlZmluZWRcIiA/IEZsb2F0MzJBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkZjY0XCI6IHR5cGVvZiBGbG9hdDY0QXJyYXkgIT0gXCJ1bmRlZmluZWRcIiA/IEZsb2F0NjRBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkaTY0XCI6IHR5cGVvZiBCaWdJbnQ2NEFycmF5ICE9IFwidW5kZWZpbmVkXCIgPyBCaWdJbnQ2NEFycmF5IDogQXJyYXksXG4gICAgICAgICAgICBcIiR1NjRcIjogdHlwZW9mIEJpZ1VpbnQ2NEFycmF5ICE9IFwidW5kZWZpbmVkXCIgPyBCaWdVaW50NjRBcnJheSA6IEFycmF5LFxuICAgICAgICAgICAgXCIkZHZcIjogdHlwZW9mIERhdGFWaWV3ICE9IFwidW5kZWZpbmVkXCIgPyBEYXRhVmlldyA6IEFycmF5LFxuICAgICAgICAgICAgLy9cIiRtcFwiOiB0eXBlb2YgTWVzc2FnZVBvcnQgIT0gXCJ1bmRlZmluZWRcIiA/IE1lc3NhZ2VQb3J0IDogQXJyYXlcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB0cnkgdG8gbG9hZCBmbG9hdDE2IHN1cHBvcnRcbiAgICAgICAgdGhpcy4kdHlwZWRbXCIkZjE2XCJdID0gZnAxNm0/LkZsb2F0MTZBcnJheTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzLiR0cmFuc2ZlciA9IFtcbiAgICAgICAgICAgIEFycmF5QnVmZmVyLCBcbiAgICAgICAgICAgIE1lc3NhZ2VQb3J0LCBcbiAgICAgICAgICAgIFJlYWRhYmxlU3RyZWFtLCBcbiAgICAgICAgICAgIFdyaXRhYmxlU3RyZWFtLCBcbiAgICAgICAgICAgIFRyYW5zZm9ybVN0cmVhbSwgXG4gICAgICAgICAgICBXZWJBc3NlbWJseS5NZW1vcnksXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICBVaW50OEFycmF5LFxuICAgICAgICAgICAgVWludDhDbGFtcGVkQXJyYXksXG4gICAgICAgICAgICBJbnQ4QXJyYXksXG4gICAgICAgICAgICBVaW50MTZBcnJheSxcbiAgICAgICAgICAgIEludDE2QXJyYXksXG4gICAgICAgICAgICBVaW50MzJBcnJheSxcbiAgICAgICAgICAgIEludDMyQXJyYXksXG4gICAgICAgICAgICBGbG9hdDE2QXJyYXksXG4gICAgICAgICAgICBGbG9hdDMyQXJyYXksXG4gICAgICAgICAgICBGbG9hdDY0QXJyYXksXG4gICAgICAgICAgICBCaWdJbnQ2NEFycmF5LFxuICAgICAgICAgICAgQmlnVWludDY0QXJyYXksXG4gICAgICAgICAgICBEYXRhVmlldyxcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIC8vQmxvYixcbiAgICAgICAgXS5jb25jYXQoW1xuICAgICAgICAgICAgdHlwZW9mIE9mZnNjcmVlbkNhbnZhcyAhPSBcInVuZGVmaW5lZFwiID8gT2Zmc2NyZWVuQ2FudmFzIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgdHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyICE9IFwidW5kZWZpbmVkXCIgPyBTaGFyZWRBcnJheUJ1ZmZlciA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHR5cGVvZiBJbWFnZUJpdG1hcCAhPSBcInVuZGVmaW5lZFwiID8gSW1hZ2VCaXRtYXAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB0eXBlb2YgQXVkaW9EYXRhICE9IFwidW5kZWZpbmVkXCIgPyBBdWRpb0RhdGEgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB0eXBlb2YgVmlkZW9GcmFtZSAhPSBcInVuZGVmaW5lZFwiID8gVmlkZW9GcmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgXSkuZmlsdGVyKChJKSA9PiB7IHJldHVybiB0eXBlb2YgSSAhPSBcInVuZGVmaW5lZFwiOyB9KTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzW1wiJmRhdGFcIl0gPSBkYXRhO1xuICAgICAgICB0aGlzLiRydWxlcyA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wicHJvbWlzZVwiLCAoJG0pID0+IHsgcmV0dXJuICgkbSBpbnN0YW5jZW9mIFByb21pc2UpOyB9XSxcbiAgICAgICAgICAgIFtcInR5cGVkYXJyYXlcIiwgKCRtKSA9PiB7IHJldHVybiAkbT8uYnVmZmVyICYmICRtLkJZVEVTX1BFUl9FTEVNRU5UIHx8ICRtIGluc3RhbmNlb2YgRGF0YVZpZXc7IH1dLFxuICAgICAgICAgICAgW1wiYXJyYXlcIiwgKCRtKSA9PiB7IHJldHVybiBBcnJheS5pc0FycmF5KCRtKSB8fCAkbSBpbnN0YW5jZW9mIEFycmF5OyB9XSxcbiAgICAgICAgICAgIFtcInNoYXJlZFwiLCAoJG0pID0+IHsgcmV0dXJuIHR5cGVvZiAkbSA9PSBcIm9iamVjdFwiICYmIHRoaXMuJHNoYXJlZC5zb21lKChDKSA9PiAoJG0gaW5zdGFuY2VvZiBDKSk7IH1dLCAvLyBhYnNjZW50XG4gICAgICAgICAgICBbXCJ0cmFuc2ZlclwiLCAoJG0pID0+IHsgcmV0dXJuIHR5cGVvZiAkbSA9PSBcIm9iamVjdFwiICYmIHRoaXMuJHRyYW5zZmVyLnNvbWUoKEMpID0+ICgkbSBpbnN0YW5jZW9mIEMpKTsgfV0sIC8vIGFic2NlbnRcbiAgICAgICAgICAgIFtcImNsYXNzXCIsICgkbSkgPT4geyByZXR1cm4gKHR5cGVvZiAkbSA9PSBcIm9iamVjdFwiICYmICh0aGlzLiRpbnN0YW5jZXMuc29tZSgoQykgPT4gKCRtIGluc3RhbmNlb2YgQykpIHx8ICFpc1BsYWluT2JqZWN0KCRtKSkpIHx8IHR5cGVvZiAkbSA9PSBcImZ1bmN0aW9uXCI7IH1dLFxuICAgICAgICAgICAgW1wicHJveHlcIiwgKCRtKSA9PiB7IHJldHVybiAkbT8uW1wiJnR5cGVvZlwiXSA9PSBcInByb3h5XCI7IH1dLFxuICAgICAgICAgICAgW1wib2JqZWN0XCIsICgkbSkgPT4geyByZXR1cm4gKHR5cGVvZiAkbSA9PSBcIm9iamVjdFwiIHx8IGlzUGxhaW5PYmplY3QoJG0pKTsgfV0sXG4gICAgICAgIF0pXG4gICAgfVxuXG4gICAgLy9cbiAgICAkZHJvcFNoYXJlZCgkbSkge1xuICAgICAgICByZXR1cm4gKCF0aGlzLiRzaGFyZWQuc29tZSgoQykgPT4gKCRtIGluc3RhbmNlb2YgQyB8fCAkbT8uYnVmZmVyIGluc3RhbmNlb2YgQykpICYmIHRoaXMuJHRyYW5zZmVyLnNvbWUoKEMpID0+ICgkbSBpbnN0YW5jZW9mIEMgfHwgJG0/LmJ1ZmZlciBpbnN0YW5jZW9mIEMpKSk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAkdHlwZXdyYXAoJHQsICRhYiwgJGJvLCAkYmwsICRtZXRhKSB7XG4gICAgICAgIGlmICghJHQgfHwgJHQgPT0gXCIkdW5rXCIgfHwgIXRoaXMuJHR5cGVkWyR0XSkgcmV0dXJuICRhYjtcbiAgICAgICAgY29uc3QgJEkgPSBuZXcgdGhpcy4kdHlwZWRbJHRdKCRhYiwgJGJvLCAkYmwgLyAodGhpcy4kdHlwZWRbJHRdPy5CWVRFU19QRVJfRUxFTUVOVHx8MSkpO1xuICAgICAgICByZXR1cm4gJG1ldGEgPyBuZXcgUHJveHkod3JhcEZ1bmMoe1xuICAgICAgICAgICAgW1wiJmRhdGFcIl06ICRJLFxuICAgICAgICAgICAgW1wiJmNvZGVcIl06IHtcbiAgICAgICAgICAgICAgICBbXCImbWV0YVwiXTogJG1ldGEsXG4gICAgICAgICAgICAgICAgW1wiJnR5cGVvZlwiXTogXCJ0cmFuc2ZlclwiLCBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksIGRlZmF1bHRSZWZsZWN0aW9uKSA6ICRJO1xuICAgIH1cblxuICAgIC8vXG4gICAgJHR5cGVkYXJyYXkoJHRhKSB7XG4gICAgICAgIGZvciAoY29uc3QgJHQgaW4gdGhpcy4kdHlwZWQpIHtcbiAgICAgICAgICAgIGlmICgkdGEgaW5zdGFuY2VvZiB0aGlzLiR0eXBlZFskdF0pIHsgXG4gICAgICAgICAgICAgICAgcmV0dXJuICR0IFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCIkdW5rXCI7XG4gICAgfVxuXG4gICAgLy9cbiAgICBnZXQgW1wiJnR5cGVvZlwiXSgpIHtcbiAgICAgICAgaWYgKHRoaXNbXCImZGF0YVwiXT8uW1wiJnR5cGVvZlwiXSkgeyBcbiAgICAgICAgICAgIHJldHVybiB0aGlzW1wiJmRhdGFcIl0/LltcIiZ0eXBlb2ZcIl07IFxuICAgICAgICB9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiB0aGlzLiRydWxlcy5rZXlzKCkpIHsgXG4gICAgICAgICAgICBpZiAodGhpcy4kcnVsZXMuZ2V0KGtleSkodGhpc1tcIiZkYXRhXCJdKSkgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5OyBcbiAgICAgICAgICAgIH07IFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gXCJwcmltaXRpdmVcIjtcbiAgICB9XG5cbiAgICAvL1xuICAgIGdldCBbXCImY29kZVwiXSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiJnBlcnNpc3RlbnRcIjogZmFsc2UsXG4gICAgICAgICAgICBcIiZ0eXBlb2ZcIjogdGhpcz8uW1wiJnR5cGVvZlwiXSxcbiAgICAgICAgICAgIFwiJmRhdGFcIjogdGhpcz8uW1wiJmRhdGFcIl0sXG4gICAgICAgICAgICBcIiZpc0NvZGVcIjogdHJ1ZVxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbi8vXG5BdXRvRGV0ZWN0b3IuaXNQbGFpbk9iamVjdCA9IGlzUGxhaW5PYmplY3Q7XG5cbi8vXG5leHBvcnQgeyBpc1BsYWluT2JqZWN0IH07XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0EsWTs7QUFFQTtBQUNBLFNBQVNBLEtBQUs7QUFDZCxTQUFTQyxLQUFLLEVBQUVDLGFBQWE7QUFDN0IsU0FBU0MsUUFBUSxFQUFFQyxpQkFBaUI7O0FB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