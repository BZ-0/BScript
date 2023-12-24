// @ts-nocheck
"use strict"

//
import { wrapFunc, defaultReflection } from "../Reflection/DirectReflection.mjs"
import { GetterReflection } from "../Reflection/DirectReflection.mjs"
import { LazyReflection } from "../Reflection/PromiseReflection.mjs"
import { uuidv4 } from "./Symbols.mjs"

/**
 * @export
 * @class STD
 */
export default class STD {
    static typify($typeof, $data, $code = {}) {
        return new Proxy(
            wrapFunc({
                ["&data"]: $data?.["&data"] ?? $data,
                ["&code"]: {
                    ...$code,
                    ["&isCode"]: true,
                    ["&typeof"]: $typeof
                }
            }),
            defaultReflection
        )
    }

    /**
     * Make object are potentially transferrable
     * @param {Object} $data transferrable object
     * @return {Proxy<Object>} access code with proxy into class
     */
    static transfer($data, $meta) {
        return STD.typify("transfer", $data?.["&data"] ?? $data, {
            "&meta": $meta ?? { "&cid": crypto?.randomUUID?.() ?? uuidv4() }
        })
    }

    /**
     * Make object are potentially shared (currently, alias of transfer)
     * @param {Object} $data shared object
     * @return {Proxy<Object>} access code with proxy into class
     */
    static shared($data) {
        return STD.typify("shared", $data)
    }

    /**
     * Alias for TypeScript, due `class` is reserved keyword
     * @alias classed
     * @deprecated
     */
    static class($data) {
        return STD.classed($data)
    }

    /**
     * Make object are class with proxied access
     * @param {Object} $data shared object
     * @return {Proxy<Object>} access code with proxy into class
     */
    static classed($data) {
        $data = $data["&data"] ?? $data
        if (["function", "object"].indexOf(typeof $data) < 0) {
            return $data
        }
        return STD.typify("class", $data)
    }

    /**
     * Make object are class with proxied access
     * @param {Object} $data shared object
     * @return {Proxy<Object>} access code with proxy into class
     */
    static proxy($data, $persistent = false) {
        $data = $data["&data"] ?? $data
        if (["function", "object"].indexOf(typeof $data) < 0) {
            return $data
        }
        return STD.typify("proxy", $data, {
            "&persistent": $persistent ?? false
        })
    }

    /**
     * Make serializable object
     * @param {Object} $data shared object
     * @return {Proxy<Object>} access code with proxy into class
     */
    static object($data) {
        $data = $data["&data"] ?? $data
        if (["function"].indexOf(typeof $data) >= 0) {
            throw Error("Function can't to be an object...")
        }
        return STD.typify("object", $data)
    }

    /**
     *
     * @param {*} $call
     * @returns
     */
    static getter($call) {
        return new Proxy(
            wrapFunc({
                ["&data"]: $call["&data"] ?? $call,
                ["&code"]: {
                    ["&isCode"]: true,
                    ["&typeof"]: "getter"
                }
            }),
            new GetterReflection()
        )
    }

    /**
     *
     * @param {*} $call
     * @returns
     */
    static lazy($call) {
        return new Proxy(
            wrapFunc({
                ["&data"]: $call["&data"] ?? $call,
                ["&code"]: {
                    ["&isCode"]: true,
                    ["&typeof"]: "lazy"
                }
            }),
            new LazyReflection()
        )
    }

    /**
     *
     * @param {*} $call
     * @returns
     */
    static fetch = (typeof self != "undefined" ? self : global).fetch
    static createImageBitmap = (typeof self != "undefined" ? self : global).createImageBitmap
    static OffscreenCanvas = (typeof self != "undefined" ? self : global).OffscreenCanvas

    // better use that feature...
    static ShadowRealm = (typeof self != "undefined" ? self : global).ShadowRealm

    //
    //static WrapSocket = null;
    //static WrapWorker = null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ3cmFwRnVuYyIsImRlZmF1bHRSZWZsZWN0aW9uIiwiR2V0dGVyUmVmbGVjdGlvbiIsIkxhenlSZWZsZWN0aW9uIiwidXVpZHY0IiwiU1REIiwidHlwaWZ5IiwiJHR5cGVvZiIsIiRkYXRhIiwiJGNvZGUiLCJQcm94eSIsInRyYW5zZmVyIiwiJG1ldGEiLCJjcnlwdG8iLCJyYW5kb21VVUlEIiwic2hhcmVkIiwiY2xhc3MiLCJjbGFzc2VkIiwiaW5kZXhPZiIsInByb3h5IiwiJHBlcnNpc3RlbnQiLCJvYmplY3QiLCJFcnJvciIsImdldHRlciIsIiRjYWxsIiwibGF6eSIsImZldGNoIiwic2VsZiIsImdsb2JhbCIsImNyZWF0ZUltYWdlQml0bWFwIiwiT2Zmc2NyZWVuQ2FudmFzIiwiU2hhZG93UmVhbG0iXSwic291cmNlcyI6WyJDOlxcUHJvamVjdHNcXEJaMFxcQkNvbTJcXHNyY1xcY2l2ZXRcXExpYnJhcnlcXFN0YW5kYXJkLmNpdmV0Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1ub2NoZWNrXG5cInVzZSBzdHJpY3RcIjtcblxuLy9cbmltcG9ydCB7IHdyYXBGdW5jLCBkZWZhdWx0UmVmbGVjdGlvbiB9IGZyb20gXCIuLi9SZWZsZWN0aW9uL0RpcmVjdFJlZmxlY3Rpb25cIjtcbmltcG9ydCB7IEdldHRlclJlZmxlY3Rpb259IGZyb20gXCIuLi9SZWZsZWN0aW9uL0RpcmVjdFJlZmxlY3Rpb25cIjtcbmltcG9ydCB7IExhenlSZWZsZWN0aW9uIH0gZnJvbSBcIi4uL1JlZmxlY3Rpb24vUHJvbWlzZVJlZmxlY3Rpb25cIjtcbmltcG9ydCB7IHV1aWR2NCB9IGZyb20gXCIuL1N5bWJvbHNcIlxuXG4vKipcbiAqIEBleHBvcnRcbiAqIEBjbGFzcyBTVERcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU1REIHtcbiAgICBzdGF0aWMgdHlwaWZ5KCR0eXBlb2YsICRkYXRhLCAkY29kZSA9IHt9KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkod3JhcEZ1bmMoe1xuICAgICAgICAgICAgW1wiJmRhdGFcIl06ICRkYXRhPy5bXCImZGF0YVwiXSA/PyAkZGF0YSxcbiAgICAgICAgICAgIFtcIiZjb2RlXCJdOiB7XG4gICAgICAgICAgICAgICAgLi4uJGNvZGUsXG4gICAgICAgICAgICAgICAgW1wiJmlzQ29kZVwiXTogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgW1wiJnR5cGVvZlwiXTogJHR5cGVvZlxuICAgICAgICAgICAgfVxuICAgICAgICB9KSwgZGVmYXVsdFJlZmxlY3Rpb24pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ha2Ugb2JqZWN0IGFyZSBwb3RlbnRpYWxseSB0cmFuc2ZlcnJhYmxlXG4gICAgICogQHBhcmFtIHtPYmplY3R9ICRkYXRhIHRyYW5zZmVycmFibGUgb2JqZWN0XG4gICAgICogQHJldHVybiB7UHJveHk8T2JqZWN0Pn0gYWNjZXNzIGNvZGUgd2l0aCBwcm94eSBpbnRvIGNsYXNzXG4gICAgICovXG4gICAgc3RhdGljIHRyYW5zZmVyKCRkYXRhLCAkbWV0YSkge1xuICAgICAgICByZXR1cm4gU1RELnR5cGlmeShcInRyYW5zZmVyXCIsICRkYXRhPy5bXCImZGF0YVwiXSA/PyAkZGF0YSwge1xuICAgICAgICAgICAgXCImbWV0YVwiOiAkbWV0YSA/PyB7XCImY2lkXCI6IChjcnlwdG8/LnJhbmRvbVVVSUQ/LigpID8/IHV1aWR2NCgpKX1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1ha2Ugb2JqZWN0IGFyZSBwb3RlbnRpYWxseSBzaGFyZWQgKGN1cnJlbnRseSwgYWxpYXMgb2YgdHJhbnNmZXIpXG4gICAgICogQHBhcmFtIHtPYmplY3R9ICRkYXRhIHNoYXJlZCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtQcm94eTxPYmplY3Q+fSBhY2Nlc3MgY29kZSB3aXRoIHByb3h5IGludG8gY2xhc3NcbiAgICAgKi9cbiAgICBzdGF0aWMgc2hhcmVkKCRkYXRhKSB7IFxuICAgICAgICByZXR1cm4gU1RELnR5cGlmeShcInNoYXJlZFwiLCAkZGF0YSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciBUeXBlU2NyaXB0LCBkdWUgYGNsYXNzYCBpcyByZXNlcnZlZCBrZXl3b3JkXG4gICAgICogQGFsaWFzIGNsYXNzZWRcbiAgICAgKiBAZGVwcmVjYXRlZFxuICAgICAqL1xuICAgIHN0YXRpYyBjbGFzcygkZGF0YSkgeyByZXR1cm4gU1RELmNsYXNzZWQoJGRhdGEpOyB9O1xuXG4gICAgLyoqXG4gICAgICogTWFrZSBvYmplY3QgYXJlIGNsYXNzIHdpdGggcHJveGllZCBhY2Nlc3NcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gJGRhdGEgc2hhcmVkIG9iamVjdFxuICAgICAqIEByZXR1cm4ge1Byb3h5PE9iamVjdD59IGFjY2VzcyBjb2RlIHdpdGggcHJveHkgaW50byBjbGFzc1xuICAgICAqL1xuICAgIHN0YXRpYyBjbGFzc2VkKCRkYXRhKSB7XG4gICAgICAgICRkYXRhID0gJGRhdGFbXCImZGF0YVwiXSA/PyAkZGF0YTtcbiAgICAgICAgaWYgKFtcImZ1bmN0aW9uXCIsIFwib2JqZWN0XCJdLmluZGV4T2YodHlwZW9mICRkYXRhKSA8IDApIHsgXG4gICAgICAgICAgICByZXR1cm4gJGRhdGE7IFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gU1RELnR5cGlmeShcImNsYXNzXCIsICRkYXRhKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWFrZSBvYmplY3QgYXJlIGNsYXNzIHdpdGggcHJveGllZCBhY2Nlc3NcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gJGRhdGEgc2hhcmVkIG9iamVjdFxuICAgICAqIEByZXR1cm4ge1Byb3h5PE9iamVjdD59IGFjY2VzcyBjb2RlIHdpdGggcHJveHkgaW50byBjbGFzc1xuICAgICAqL1xuICAgIHN0YXRpYyBwcm94eSgkZGF0YSwgJHBlcnNpc3RlbnQgPSBmYWxzZSkge1xuICAgICAgICAkZGF0YSA9ICRkYXRhW1wiJmRhdGFcIl0gPz8gJGRhdGE7XG4gICAgICAgIGlmIChbXCJmdW5jdGlvblwiLCBcIm9iamVjdFwiXS5pbmRleE9mKHR5cGVvZiAkZGF0YSkgPCAwKSB7IFxuICAgICAgICAgICAgcmV0dXJuICRkYXRhOyBcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFNURC50eXBpZnkoXCJwcm94eVwiLCAkZGF0YSwge1xuICAgICAgICAgICAgXCImcGVyc2lzdGVudFwiOiAkcGVyc2lzdGVudCA/PyBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1ha2Ugc2VyaWFsaXphYmxlIG9iamVjdFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAkZGF0YSBzaGFyZWQgb2JqZWN0XG4gICAgICogQHJldHVybiB7UHJveHk8T2JqZWN0Pn0gYWNjZXNzIGNvZGUgd2l0aCBwcm94eSBpbnRvIGNsYXNzXG4gICAgICovXG4gICAgc3RhdGljIG9iamVjdCgkZGF0YSkge1xuICAgICAgICAkZGF0YSA9ICRkYXRhW1wiJmRhdGFcIl0gPz8gJGRhdGE7XG4gICAgICAgIGlmIChbXCJmdW5jdGlvblwiXS5pbmRleE9mKHR5cGVvZiAkZGF0YSkgPj0gMCkgeyBcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiRnVuY3Rpb24gY2FuJ3QgdG8gYmUgYW4gb2JqZWN0Li4uXCIpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gU1RELnR5cGlmeShcIm9iamVjdFwiLCAkZGF0YSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7Kn0gJGNhbGwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgc3RhdGljIGdldHRlcigkY2FsbCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb3h5KHdyYXBGdW5jKHtcbiAgICAgICAgICAgIFtcIiZkYXRhXCJdOiAkY2FsbFtcIiZkYXRhXCJdID8/ICRjYWxsLFxuICAgICAgICAgICAgW1wiJmNvZGVcIl06IHtcbiAgICAgICAgICAgICAgICBbXCImaXNDb2RlXCJdOiB0cnVlLCBcbiAgICAgICAgICAgICAgICBbXCImdHlwZW9mXCJdOiBcImdldHRlclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLCBuZXcgR2V0dGVyUmVmbGVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0geyp9ICRjYWxsIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHN0YXRpYyBsYXp5KCRjYWxsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkod3JhcEZ1bmMoe1xuICAgICAgICAgICAgW1wiJmRhdGFcIl06ICRjYWxsW1wiJmRhdGFcIl0gPz8gJGNhbGwsXG4gICAgICAgICAgICBbXCImY29kZVwiXToge1xuICAgICAgICAgICAgICAgIFtcIiZpc0NvZGVcIl06IHRydWUsIFxuICAgICAgICAgICAgICAgIFtcIiZ0eXBlb2ZcIl06IFwibGF6eVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLCBuZXcgTGF6eVJlZmxlY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHsqfSAkY2FsbCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBzdGF0aWMgZmV0Y2ggPSAodHlwZW9mIHNlbGYgIT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiBnbG9iYWwpLmZldGNoO1xuICAgIHN0YXRpYyBjcmVhdGVJbWFnZUJpdG1hcCA9ICh0eXBlb2Ygc2VsZiAhPSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IGdsb2JhbCkuY3JlYXRlSW1hZ2VCaXRtYXA7XG4gICAgc3RhdGljIE9mZnNjcmVlbkNhbnZhcyA9ICh0eXBlb2Ygc2VsZiAhPSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IGdsb2JhbCkuT2Zmc2NyZWVuQ2FudmFzO1xuXG4gICAgLy8gYmV0dGVyIHVzZSB0aGF0IGZlYXR1cmUuLi5cbiAgICBzdGF0aWMgU2hhZG93UmVhbG0gPSAodHlwZW9mIHNlbGYgIT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiBnbG9iYWwpLlNoYWRvd1JlYWxtO1xuXG4gICAgLy9cbiAgICAvL3N0YXRpYyBXcmFwU29ja2V0ID0gbnVsbDtcbiAgICAvL3N0YXRpYyBXcmFwV29ya2VyID0gbnVsbDtcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxZOztBQUVBO0FBQ0EsU0FBU0EsUUFBUSxFQUFFQyxpQkFBaUI7QUFDcEMsU0FBU0MsZ0JBQWdCO0FBQ3pCLFNBQVNDLGNBQWM7QUFDdkIsU0FBU0MsTUFBTTs7QUFFZjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsTUFBTUMsR0FBRyxDQUFDO0VBQ3JCLE9BQU9DLE1BQU1BLENBQUNDLE9BQU8sRUFBRUMsS0FBSyxFQUFFQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7SUFDdEMsT0FBTyxJQUFJQyxLQUFLLENBQUNWLFFBQVEsQ0FBQztNQUN0QixDQUFDLE9BQU8sR0FBR1EsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJQSxLQUFLO01BQ3BDLENBQUMsT0FBTyxHQUFHO1FBQ1AsR0FBR0MsS0FBSztRQUNSLENBQUMsU0FBUyxHQUFHLElBQUk7UUFDakIsQ0FBQyxTQUFTLEdBQUdGO01BQ2pCO0lBQ0osQ0FBQyxDQUFDLEVBQUVOLGlCQUFpQixDQUFDO0VBQzFCOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7RUFDSSxPQUFPVSxRQUFRQSxDQUFDSCxLQUFLLEVBQUVJLEtBQUssRUFBRTtJQUMxQixPQUFPUCxHQUFHLENBQUNDLE1BQU0sQ0FBQyxVQUFVLEVBQUVFLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSUEsS0FBSyxFQUFFO01BQ3JELE9BQU8sRUFBRUksS0FBSyxJQUFJLEVBQUMsTUFBTSxFQUFHQyxNQUFNLEVBQUVDLFVBQVUsR0FBRyxDQUFDLElBQUlWLE1BQU0sQ0FBQyxDQUFFO0lBQ25FLENBQUMsQ0FBQztFQUNOOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7RUFDSSxPQUFPVyxNQUFNQSxDQUFDUCxLQUFLLEVBQUU7SUFD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
