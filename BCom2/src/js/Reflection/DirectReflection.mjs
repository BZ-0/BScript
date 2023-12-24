// @ts-nocheck
"use strict"

//
import { $symbols, $names, $contextify, FakeReflect } from "../Library/Symbols.mjs"

//
export class BaseReflection {
    /** @type {Reflect} */
    $reflect = typeof Reflect != "undefined" ? Reflect : FakeReflect

    //
    constructor(reflect) {
        this.$reflect = reflect ?? (typeof Reflect != "undefined" ? Reflect : FakeReflect)
    }

    //
    $data($hack) {
        return $hack?.["&data"]
    }

    //
    get($hack, ...$args) {
        if ($args[0] == "&isCode") {
            return false
        }
        if ($args[0] == "&isWrap") {
            return true
        }
        if (["&data", "&code"].indexOf($args[0]) >= 0) {
            return $hack?.[$args[0]]
        }
        if ([$symbols["&data"]].indexOf($args[0]) >= 0) {
            return this.$data($hack)
        }
        if ($args[0]?.at?.(0) == "&") {
            return $hack?.["&code"]?.[$args[0]]
        }

        //
        if (Object.values($symbols).indexOf($args[0]) >= 0) {
            $args[0] = $names[$args[0]]
            const $w = this.$data($hack)?.["&code"] ?? $hack?.["&code"]
            return $contextify($w, this.$reflect.get($w, ...$args))
        }

        //
        if (["then", "catch", "finally"].indexOf($args[0]) >= 0) {
            const $w = this.$data($hack)
            if ($w?.[$args[0]]) {
                return $contextify($w, $w?.[$args[0]])
            } else {
                const $p = new Promise(($) => $($w))
                return $contextify($p, $p?.[$args[0]])
            }
            //return null;
        }

        //
        const $data = this.$data($hack)
        return $contextify($data, this.$reflect.get($data, ...$args))
    }

    set($hack, ...$args) {
        if ($args[0] == "&data") {
            $hack["&data"] = $args[1]
            return true
        }
        return this.$reflect.set(this.$data($hack), ...$args)
    }

    deleteProperty($hack, ...$args) {
        return this.$reflect.deleteProperty(this.$data($hack), ...$args)
    }

    construct($hack, ...$args) {
        return this.$reflect.construct(this.$data($hack), ...$args)
    }

    apply($hack, ...$args) {
        return this.$reflect.apply(this.$data($hack), ...$args)
    }

    ownKeys($hack, ...$args) {
        return this.$reflect.ownKeys(this.$data($hack), ...$args)
    }

    has($hack, ...$args) {
        return this.$reflect.has(this.$data($hack), ...$args)
    }
}

//
export class DirectReflection extends BaseReflection {
    //
    constructor($reflect = typeof Reflect != "undefined" ? Reflect : FakeReflect) {
        super($reflect)
    }

    //
    $data($hack) {
        return $hack?.["&data"]
    }
}

//
export class GetterReflection extends BaseReflection {
    //
    constructor($reflect = typeof Reflect != "undefined" ? Reflect : FakeReflect) {
        super($reflect)
    }

    //
    $data($hack) {
        return ($hack?.["&data"] ?? $hack)()
    }
}

// from remote side...
export class IndirectReflection extends BaseReflection {
    #dictionary = null

    //
    constructor(reflect = typeof Reflect != "undefined" ? Reflect : FakeReflect, dictionary = null) {
        super(reflect)
        this.#dictionary = dictionary
    }

    //
    $data($hack) {
        const $wrap = this.#dictionary.$get($hack?.["&origin"], $hack?.["&persistent"]) ?? this.#dictionary.$get($hack?.["&proxy"], $hack?.["&persistent"]) ?? $hack?.["&data"]
        return $wrap
    }
}

// from remote side...
export class AccessReflection extends BaseReflection {
    #dictionary = null
    #worker = null

    //
    constructor(reflect = typeof Reflect != "undefined" ? Reflect : FakeReflect, worker = null) {
        super(reflect)
        this.#worker = worker
    }

    //
    $data($hack) {
        return ($hack["&data"] = $hack["&data"] ?? this.#worker.access($hack["&proxy"], $hack["&persistent"]))
    }
}

// from remote side...
export class ReadbackReflection extends BaseReflection {
    #worker = null

    //
    constructor(worker) {
        super(Reflect)
        this.#worker = worker
    }

    //
    $data($hack) {
        if ($hack?.["&typeof"] == "readback") {
            $hack["&typeof"] = "data"
            $hack["&data"] = this.#worker.$request({
                $cmd: "access",
                $identify: true,
                $persistent: false,
                $args: [
                    $hack["&data"].then(($) => {
                        return $["&origin"]
                    })
                ]
            })
        }
        return $hack["&data"]
    }
}

//
export const defaultReflection = new DirectReflection()
export const wrapFunc = ($ = {}) => {
    const $Direct = function $Direct() {
        Object.assign(this, $)
    }
    Object.assign($Direct, $)
    return $Direct //new Proxy(, defaultReflection);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyIkc3ltYm9scyIsIiRuYW1lcyIsIiRjb250ZXh0aWZ5IiwiRmFrZVJlZmxlY3QiLCJCYXNlUmVmbGVjdGlvbiIsIiRyZWZsZWN0IiwiUmVmbGVjdCIsImNvbnN0cnVjdG9yIiwicmVmbGVjdCIsIiRkYXRhIiwiJGhhY2siLCJnZXQiLCIkYXJncyIsImluZGV4T2YiLCJhdCIsIk9iamVjdCIsInZhbHVlcyIsIiR3IiwiJHAiLCJQcm9taXNlIiwiJCIsInNldCIsImRlbGV0ZVByb3BlcnR5IiwiY29uc3RydWN0IiwiYXBwbHkiLCJvd25LZXlzIiwiaGFzIiwiRGlyZWN0UmVmbGVjdGlvbiIsIkdldHRlclJlZmxlY3Rpb24iLCJJbmRpcmVjdFJlZmxlY3Rpb24iLCJkaWN0aW9uYXJ5IiwiJHdyYXAiLCIkZ2V0IiwiQWNjZXNzUmVmbGVjdGlvbiIsIndvcmtlciIsImFjY2VzcyIsIlJlYWRiYWNrUmVmbGVjdGlvbiIsIiRyZXF1ZXN0IiwiJGNtZCIsIiRpZGVudGlmeSIsIiRwZXJzaXN0ZW50IiwidGhlbiIsImRlZmF1bHRSZWZsZWN0aW9uIiwid3JhcEZ1bmMiLCIkRGlyZWN0IiwiYXNzaWduIl0sInNvdXJjZXMiOlsiQzpcXFByb2plY3RzXFxCWjBcXEJDb20yXFxzcmNcXGNpdmV0XFxSZWZsZWN0aW9uXFxEaXJlY3RSZWZsZWN0aW9uLmNpdmV0Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1ub2NoZWNrXG5cInVzZSBzdHJpY3RcIjtcblxuLy9cbmltcG9ydCB7ICRzeW1ib2xzLCAkbmFtZXMsICRjb250ZXh0aWZ5LCBGYWtlUmVmbGVjdCB9IGZyb20gXCIuLi9MaWJyYXJ5L1N5bWJvbHNcIjtcblxuLy9cbmV4cG9ydCBjbGFzcyBCYXNlUmVmbGVjdGlvbiB7XG4gICAgLyoqIEB0eXBlIHtSZWZsZWN0fSAqL1xuICAgICRyZWZsZWN0ID0gKHR5cGVvZiBSZWZsZWN0ICE9IFwidW5kZWZpbmVkXCIgPyBSZWZsZWN0IDogRmFrZVJlZmxlY3QpO1xuXG4gICAgLy9cbiAgICBjb25zdHJ1Y3RvcihyZWZsZWN0KSB7XG4gICAgICAgIHRoaXMuJHJlZmxlY3QgPSByZWZsZWN0ID8/ICh0eXBlb2YgUmVmbGVjdCAhPSBcInVuZGVmaW5lZFwiID8gUmVmbGVjdCA6IEZha2VSZWZsZWN0KTtcbiAgICB9XG5cbiAgICAvL1xuICAgICRkYXRhKCRoYWNrKSB7XG4gICAgICAgIHJldHVybiAkaGFjaz8uW1wiJmRhdGFcIl07XG4gICAgfVxuXG4gICAgLy9cbiAgICBnZXQoJGhhY2ssIC4uLiRhcmdzKSB7XG4gICAgICAgIGlmICgkYXJnc1swXSA9PSBcIiZpc0NvZGVcIikgXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICgkYXJnc1swXSA9PSBcIiZpc1dyYXBcIilcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoW1wiJmRhdGFcIiwgXCImY29kZVwiXS5pbmRleE9mKCRhcmdzWzBdKSA+PSAwKSBcbiAgICAgICAgICAgIHJldHVybiAkaGFjaz8uWyRhcmdzWzBdXTtcbiAgICAgICAgaWYgKFskc3ltYm9sc1tcIiZkYXRhXCJdXS5pbmRleE9mKCRhcmdzWzBdKSA+PSAwKSBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRkYXRhKCRoYWNrKTtcbiAgICAgICAgaWYgKCRhcmdzWzBdPy5hdD8uKDApID09IFwiJlwiKSBcbiAgICAgICAgICAgIHJldHVybiAkaGFjaz8uW1wiJmNvZGVcIl0/LlskYXJnc1swXV07XG5cbiAgICAgICAgLy9cbiAgICAgICAgaWYgKE9iamVjdC52YWx1ZXMoJHN5bWJvbHMpLmluZGV4T2YoJGFyZ3NbMF0pID49IDApIHsgXG4gICAgICAgICAgICAkYXJnc1swXSA9ICRuYW1lc1skYXJnc1swXV07XG4gICAgICAgICAgICBjb25zdCAkdyA9IHRoaXMuJGRhdGEoJGhhY2spPy5bXCImY29kZVwiXSA/PyAkaGFjaz8uW1wiJmNvZGVcIl07XG4gICAgICAgICAgICByZXR1cm4gJGNvbnRleHRpZnkoJHcsIHRoaXMuJHJlZmxlY3QuZ2V0KCR3LCAuLi4kYXJncykpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9cbiAgICAgICAgaWYgKFtcInRoZW5cIiwgXCJjYXRjaFwiLCBcImZpbmFsbHlcIl0uaW5kZXhPZigkYXJnc1swXSkgPj0gMCkge1xuICAgICAgICAgICAgY29uc3QgJHcgPSB0aGlzLiRkYXRhKCRoYWNrKTtcbiAgICAgICAgICAgIGlmICgkdz8uWyRhcmdzWzBdXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkY29udGV4dGlmeSgkdywgJHc/LlskYXJnc1swXV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCAkcCA9IG5ldyBQcm9taXNlKCgkKSA9PiAkKCAkdyApKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGNvbnRleHRpZnkoJHAsICRwPy5bJGFyZ3NbMF1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvL1xuICAgICAgICBjb25zdCAkZGF0YSA9IHRoaXMuJGRhdGEoJGhhY2spO1xuICAgICAgICByZXR1cm4gJGNvbnRleHRpZnkoJGRhdGEsIHRoaXMuJHJlZmxlY3QuZ2V0KCRkYXRhLCAuLi4kYXJncykpO1xuICAgIH1cblxuICAgIHNldCgkaGFjaywgLi4uJGFyZ3MpIHtcbiAgICAgICAgaWYgKCRhcmdzWzBdID09IFwiJmRhdGFcIikgeyBcbiAgICAgICAgICAgICRoYWNrW1wiJmRhdGFcIl0gPSAkYXJnc1sxXTsgXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHJlZmxlY3Quc2V0KHRoaXMuJGRhdGEoJGhhY2spLCAuLi4kYXJncyk7XG4gICAgfVxuXG4gICAgZGVsZXRlUHJvcGVydHkoJGhhY2ssIC4uLiRhcmdzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRyZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHRoaXMuJGRhdGEoJGhhY2spLCAuLi4kYXJncyk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0KCRoYWNrLCAuLi4kYXJncykge1xuICAgICAgICByZXR1cm4gdGhpcy4kcmVmbGVjdC5jb25zdHJ1Y3QodGhpcy4kZGF0YSgkaGFjayksIC4uLiRhcmdzKTtcbiAgICB9XG5cbiAgICBhcHBseSgkaGFjaywgLi4uJGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHJlZmxlY3QuYXBwbHkodGhpcy4kZGF0YSgkaGFjayksIC4uLiRhcmdzKTtcbiAgICB9XG5cbiAgICBvd25LZXlzKCRoYWNrLCAuLi4kYXJncykge1xuICAgICAgICByZXR1cm4gdGhpcy4kcmVmbGVjdC5vd25LZXlzKHRoaXMuJGRhdGEoJGhhY2spLCAuLi4kYXJncyk7XG4gICAgfVxuXG4gICAgaGFzKCRoYWNrLCAuLi4kYXJncykge1xuICAgICAgICByZXR1cm4gdGhpcy4kcmVmbGVjdC5oYXModGhpcy4kZGF0YSgkaGFjayksIC4uLiRhcmdzKTtcbiAgICB9XG59O1xuXG5cbi8vXG5leHBvcnQgY2xhc3MgRGlyZWN0UmVmbGVjdGlvbiBleHRlbmRzIEJhc2VSZWZsZWN0aW9uIHtcblxuICAgIC8vXG4gICAgY29uc3RydWN0b3IoJHJlZmxlY3QgPSAodHlwZW9mIFJlZmxlY3QgIT0gXCJ1bmRlZmluZWRcIiA/IFJlZmxlY3QgOiBGYWtlUmVmbGVjdCkpIHtcbiAgICAgICAgc3VwZXIoJHJlZmxlY3QpO1xuICAgIH1cblxuICAgIC8vXG4gICAgJGRhdGEoJGhhY2spIHtcbiAgICAgICAgcmV0dXJuICRoYWNrPy5bXCImZGF0YVwiXTtcbiAgICB9XG59O1xuXG4vL1xuZXhwb3J0IGNsYXNzIEdldHRlclJlZmxlY3Rpb24gZXh0ZW5kcyBCYXNlUmVmbGVjdGlvbiB7XG5cbiAgICAvL1xuICAgIGNvbnN0cnVjdG9yKCRyZWZsZWN0ID0gKHR5cGVvZiBSZWZsZWN0ICE9IFwidW5kZWZpbmVkXCIgPyBSZWZsZWN0IDogRmFrZVJlZmxlY3QpKSB7XG4gICAgICAgIHN1cGVyKCRyZWZsZWN0KTtcbiAgICB9XG5cbiAgICAvL1xuICAgICRkYXRhKCRoYWNrKSB7XG4gICAgICAgIHJldHVybiAoJGhhY2s/LltcIiZkYXRhXCJdID8/ICRoYWNrKSgpO1xuICAgIH1cbn07XG5cbi8vIGZyb20gcmVtb3RlIHNpZGUuLi5cbmV4cG9ydCBjbGFzcyBJbmRpcmVjdFJlZmxlY3Rpb24gZXh0ZW5kcyBCYXNlUmVmbGVjdGlvbiB7XG4gICAgI2RpY3Rpb25hcnkgPSBudWxsO1xuXG4gICAgLy9cbiAgICBjb25zdHJ1Y3RvcihyZWZsZWN0ID0gKHR5cGVvZiBSZWZsZWN0ICE9IFwidW5kZWZpbmVkXCIgPyBSZWZsZWN0IDogRmFrZVJlZmxlY3QpLCBkaWN0aW9uYXJ5ID0gbnVsbCkge1xuICAgICAgICBzdXBlcihyZWZsZWN0KTtcbiAgICAgICAgdGhpcy4jZGljdGlvbmFyeSA9IGRpY3Rpb25hcnk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAkZGF0YSgkaGFjaykge1xuICAgICAgICBjb25zdCAkd3JhcCA9IFxuICAgICAgICAgICAgdGhpcy4jZGljdGlvbmFyeS4kZ2V0KCRoYWNrPy5bXCImb3JpZ2luXCJdLCAkaGFjaz8uW1wiJnBlcnNpc3RlbnRcIl0pID8/XG4gICAgICAgICAgICB0aGlzLiNkaWN0aW9uYXJ5LiRnZXQoJGhhY2s/LltcIiZwcm94eVwiXSwgJGhhY2s/LltcIiZwZXJzaXN0ZW50XCJdKSA/P1xuICAgICAgICAgICAgJGhhY2s/LltcIiZkYXRhXCJdXG4gICAgICAgIHJldHVybiAkd3JhcDtcbiAgICB9XG59O1xuXG4vLyBmcm9tIHJlbW90ZSBzaWRlLi4uXG5leHBvcnQgY2xhc3MgQWNjZXNzUmVmbGVjdGlvbiBleHRlbmRzIEJhc2VSZWZsZWN0aW9uIHtcbiAgICAjZGljdGlvbmFyeSA9IG51bGw7XG4gICAgI3dvcmtlciA9IG51bGw7XG5cbiAgICAvL1xuICAgIGNvbnN0cnVjdG9yKHJlZmxlY3QgPSAodHlwZW9mIFJlZmxlY3QgIT0gXCJ1bmRlZmluZWRcIiA/IFJlZmxlY3QgOiBGYWtlUmVmbGVjdCksIHdvcmtlciA9IG51bGwpIHtcbiAgICAgICAgc3VwZXIocmVmbGVjdCk7XG4gICAgICAgIHRoaXMuI3dvcmtlciA9IHdvcmtlcjtcbiAgICB9XG5cbiAgICAvL1xuICAgICRkYXRhKCRoYWNrKSB7XG4gICAgICAgIHJldHVybiAoJGhhY2tbXCImZGF0YVwiXSA9ICgkaGFja1tcIiZkYXRhXCJdID8/IHRoaXMuI3dvcmtlci5hY2Nlc3MoJGhhY2tbXCImcHJveHlcIl0sICRoYWNrW1wiJnBlcnNpc3RlbnRcIl0pKSk7XG4gICAgfVxufTtcblxuLy8gZnJvbSByZW1vdGUgc2lkZS4uLlxuZXhwb3J0IGNsYXNzIFJlYWRiYWNrUmVmbGVjdGlvbiBleHRlbmRzIEJhc2VSZWZsZWN0aW9uIHtcbiAgICAjd29ya2VyID0gbnVsbDtcblxuICAgIC8vXG4gICAgY29uc3RydWN0b3Iod29ya2VyKSB7XG4gICAgICAgIHN1cGVyKFJlZmxlY3QpO1xuICAgICAgICB0aGlzLiN3b3JrZXIgPSB3b3JrZXI7XG4gICAgfVxuXG4gICAgLy9cbiAgICAkZGF0YSgkaGFjaykge1xuICAgICAgICBpZiAoJGhhY2s/LltcIiZ0eXBlb2ZcIl0gPT0gXCJyZWFkYmFja1wiKSB7XG4gICAgICAgICAgICAkaGFja1tcIiZ0eXBlb2ZcIl0gPSBcImRhdGFcIjtcbiAgICAgICAgICAgICRoYWNrW1wiJmRhdGFcIl0gPSB0aGlzLiN3b3JrZXIuJHJlcXVlc3QoeyRjbWQ6IFwiYWNjZXNzXCIsICRpZGVudGlmeTogdHJ1ZSwgJHBlcnNpc3RlbnQ6IGZhbHNlLCAkYXJnczogWyRoYWNrW1wiJmRhdGFcIl0udGhlbigoJCkgPT4geyBcbiAgICAgICAgICAgICAgICByZXR1cm4gJFtcIiZvcmlnaW5cIl07XG4gICAgICAgICAgICB9KV19KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJGhhY2tbXCImZGF0YVwiXTtcbiAgICB9XG5cbn07XG5cbi8vXG5leHBvcnQgY29uc3QgZGVmYXVsdFJlZmxlY3Rpb24gPSBuZXcgRGlyZWN0UmVmbGVjdGlvbigpO1xuZXhwb3J0IGNvbnN0IHdyYXBGdW5jID0gKCQgPSB7fSkgPT4ge1xuICAgIGNvbnN0ICREaXJlY3QgPSBmdW5jdGlvbiAkRGlyZWN0KCkge1xuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsICQpO1xuICAgIH07XG4gICAgT2JqZWN0LmFzc2lnbigkRGlyZWN0LCAkKTtcbiAgICByZXR1cm4gJERpcmVjdDsvL25ldyBQcm94eSgsIGRlZmF1bHRSZWZsZWN0aW9uKTtcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxZOztBQUVBO0FBQ0EsU0FBU0EsUUFBUSxFQUFFQyxNQUFNLEVBQUVDLFdBQVcsRUFBRUMsV0FBVzs7QUFFbkQ7QUFDQSxPQUFPLE1BQU1DLGNBQWMsQ0FBQztFQUN4QjtFQUNBQyxRQUFRLEdBQUksT0FBT0MsT0FBTyxJQUFJLFdBQVcsR0FBR0EsT0FBTyxHQUFHSCxXQUFXOztFQUVqRTtFQUNBSSxXQUFXQSxDQUFDQyxPQUFPLEVBQUU7SUFDakIsSUFBSSxDQUFDSCxRQUFRLEdBQUdHLE9BQU8sS0FBSyxPQUFPRixPQUFPLElBQUksV0FBVyxHQUFHQSxPQUFPLEdBQUdILFdBQVcsQ0FBQztFQUN0Rjs7RUFFQTtFQUNBTSxLQUFLQSxDQUFDQyxLQUFLLEVBQUU7SUFDVCxPQUFPQSxLQUFLLEdBQUcsT0FBTyxDQUFDO0VBQzNCOztFQUVBO0VBQ0FDLEdBQUdBLENBQUNELEtBQUssRUFBRSxHQUFHRSxLQUFLLEVBQUU7SUFDakIsSUFBSUEsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsRUFBQztNQUN0QixPQUFPLEtBQUs7SUFBQztJQUNqQixJQUFJQSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxFQUFDO01BQ3RCLE9BQU8sSUFBSTtJQUFDO0lBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUNDLE9BQU8sQ0FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxD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
