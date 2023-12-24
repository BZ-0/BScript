// @ts-nocheck
"use strict"

//
import AutoDetector from "../Reflection/AutoDetector.mjs"
import RequestReflection from "../Reflection/RequestReflection.mjs"
import PromiseReflection from "../Reflection/PromiseReflection.mjs"
import ReferenceDictionary from "../Protocol/ReferenceDictionary.mjs"
import { IndirectReflection } from "../Reflection/DirectReflection.mjs"
import { $unwrap } from "../Reflection/PromiseReflection.mjs"
import { isWorker, $symbols, $contextify, uuidv4 } from "../Library/Symbols.mjs"

/**
 *
 * @export
 * @class BaseHandler
 */
export default class BaseHandler {
    /** @type {MessageHandler} */
    $messageHandler = null

    /** @type {Map<String, ResponseTransmitter>} */
    $responseTransmitters = new Map()

    /** @type {Map<String, ResponseReceiver>} */
    $responseReceivers = new Map()

    /** @type {Array<MessageCoderAsync|MessageCoderAtomic|MessageCoderNetwork|MessageCoderWorker>} */
    $inbox = null

    /** @type {Array<MessageCoderAsync|MessageCoderAtomic|MessageCoderNetwork|MessageCoderWorker>} */
    $outbox = null

    /** */
    $reflect = Reflect

    /** @type {RequestReflection} */
    $requestReflect = Reflect

    /** @type {IndirectReflection} */
    $indirectReflect = Reflect

    /** @type {PromiseReflection} */
    $promiseReflect = Reflect

    /** */
    $dictionary = null

    /** */
    $detector = null

    //
    constructor(_, $options = {}) {
        $options = {
            prefix: "",
            base: new Map(),
            ...($options || {})
        }

        //
        this.$detector = new AutoDetector({})
        this.$dictionary = new ReferenceDictionary()

        /** @type {Reflect} */
        this.$reflect = Reflect

        /** @type {RequestReflection} */
        this.$requestReflect = new RequestReflection(this)

        /** @type {IndirectReflection} */
        this.$indirectReflect = new IndirectReflection(this.$reflect, this.$dictionary)

        /** @type {PromiseReflection} */
        this.$promiseReflect = new PromiseReflection()
    }

    //
    $unchan($msg, $e) {
        return [
            $msg[0],
            $msg[1].map((e) => {
                if (e["&typeof"] == "port") return $e.ports[e["&port"]]
                return e
            }),
            ...$msg.slice(2)
        ]
    }

    //
    $chan($msg) {
        let portIdx = 0
        return [
            $msg[0],
            $msg[1].map((e) => {
                if (e instanceof MessagePort) return { "&port": portIdx++, "&typeof": "port" }
                return e
            }),
            ...$msg.slice(2)
        ]
    }

    //
    $newUUID() {
        return crypto?.randomUUID?.() ?? uuidv4()
    }

    //
    $transfer($cid, $transferable, $shared) {
        const indices = $transferable.map((_, i) => $shared.length + i)
        $shared.push(...$transferable)
        const $promise = this.$messageHandler.$promise($cid)
        return {
            "&data": $promise["&data"],
            "&code": {
                ...$promise["&code"],
                "&index": indices[0]
            }
        }
    }

    /** */
    $request({}) {
        return null
    }

    /**
     * Make object are accessible from host or remote
     * @param  {Object | Function} $obj object or class to share access
     * @param  {String} $proxy access object or name
     * @return {Proxy<Object | Function>} access code with proxy into class
     */
    register($obj, $proxy = null) {
        return this.$dictionary.$register($obj, $proxy)
    }

    /**
     * Make are access into object or class
     * @param  {String} $proxy access object or name
     * @return {Proxy<Object | Function>} access code with proxy into class
     */
    access($proxy, { $persistent = true, $async = false, $identify = true } = {}) {
        return this.$request({ $cmd: "access", $identify, $async, $persistent, $args: [$proxy?.["&proxy"] || $proxy] })
    }
}

/**
 *
 */
export class WrapHandle {
    #enablePromise = false

    constructor(enablePromise = false) {
        this.#enablePromise = enablePromise
    }

    //
    get($handle, $name) {
        if ($name == "&isCode") {
            return false
        }
        if ($name == "&isWrap") {
            return true
        }
        if ($name == "&code") {
            return $handle?.["&code"] ?? {}
        }
        if ($name == "&data") {
            return new Proxy($handle, this)
        }
        if ($name.at(0) == "&") {
            return ($handle?.["&code"] ?? {})?.[$name]
        }

        //
        if (["catch", "then", "finally"].indexOf($name) >= 0) {
            const $ak = $unwrap($handle.access("$keys", { $identify: isWorker, $persistent: true })).then(($keys) => {
                const $m = Object.fromEntries(
                    $keys.map(($k) => {
                        return [$k, $handle.access($k, { $persistent: true, $identify: isWorker })]
                    })
                )
                $m["socket"] = $handle["socket"]
                $m["worker"] = $handle["worker"]
                return $m
            })
            return $contextify($ak, $ak?.[$name])
        }

        //
        if (["socket", "worker"].indexOf($name) >= 0) {
            return $handle[$name]
        }

        //
        if (["catch", "then", "finally", "constructor", "prototype", "toString", "valueOf"].indexOf($name) >= 0) {
            return null
        }

        //
        if ($name.at(0) == "&" || Object.values($symbols).indexOf($name) >= 0) {
            return null
        }

        //
        try {
            $name += ""
        } catch (_) {
            return null
        }
        return $handle.access($name)
    }

    set($handle, $name, $value) {
        return $handle.register($value, $name)
    }

    ownKeys($handle) {
        return $unwrap($handle.access("$keys"))
    }

    has($handle, $name) {
        return $unwrap($handle.access("$keys")).then(($k) => {
            return $k.indexOf($name) >= 0
        })
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBdXRvRGV0ZWN0b3IiLCJSZXF1ZXN0UmVmbGVjdGlvbiIsIlByb21pc2VSZWZsZWN0aW9uIiwiUmVmZXJlbmNlRGljdGlvbmFyeSIsIkluZGlyZWN0UmVmbGVjdGlvbiIsIiR1bndyYXAiLCJpc1dvcmtlciIsIiRzeW1ib2xzIiwiJGNvbnRleHRpZnkiLCJ1dWlkdjQiLCJCYXNlSGFuZGxlciIsIiRtZXNzYWdlSGFuZGxlciIsIiRyZXNwb25zZVRyYW5zbWl0dGVycyIsIk1hcCIsIiRyZXNwb25zZVJlY2VpdmVycyIsIiRpbmJveCIsIiRvdXRib3giLCIkcmVmbGVjdCIsIlJlZmxlY3QiLCIkcmVxdWVzdFJlZmxlY3QiLCIkaW5kaXJlY3RSZWZsZWN0IiwiJHByb21pc2VSZWZsZWN0IiwiJGRpY3Rpb25hcnkiLCIkZGV0ZWN0b3IiLCJjb25zdHJ1Y3RvciIsIl8iLCIkb3B0aW9ucyIsInByZWZpeCIsImJhc2UiLCIkdW5jaGFuIiwiJG1zZyIsIiRlIiwibWFwIiwiZSIsInBvcnRzIiwic2xpY2UiLCIkY2hhbiIsInBvcnRJZHgiLCJNZXNzYWdlUG9ydCIsIiRuZXdVVUlEIiwiY3J5cHRvIiwicmFuZG9tVVVJRCIsIiR0cmFuc2ZlciIsIiRjaWQiLCIkdHJhbnNmZXJhYmxlIiwiJHNoYXJlZCIsImluZGljZXMiLCJpIiwibGVuZ3RoIiwicHVzaCIsIiRwcm9taXNlIiwiJHJlcXVlc3QiLCJyZWdpc3RlciIsIiRvYmoiLCIkcHJveHkiLCIkcmVnaXN0ZXIiLCJhY2Nlc3MiLCIkcGVyc2lzdGVudCIsIiRhc3luYyIsIiRpZGVudGlmeSIsIiRjbWQiLCIkYXJncyIsIldyYXBIYW5kbGUiLCJlbmFibGVQcm9taXNlIiwiZ2V0IiwiJGhhbmRsZSIsIiRuYW1lIiwiUHJveHkiLCJhdCIsImluZGV4T2YiLCIkYWsiLCJ0aGVuIiwiJGtleXMiLCIkbSIsIk9iamVjdCIsImZyb21FbnRyaWVzIiwiJGsiLCJ2YWx1ZXMiLCJzZXQiLCIkdmFsdWUiLCJvd25LZXlzIiwiaGFzIl0sInNvdXJjZXMiOlsiQzpcXFByb2plY3RzXFxCWjBcXEJDb20yXFxzcmNcXGNpdmV0XFxIYW5kbGVyc1xcQmFzZUhhbmRsZXIuY2l2ZXQiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQHRzLW5vY2hlY2tcblwidXNlIHN0cmljdFwiO1xuXG4vL1xuaW1wb3J0IEF1dG9EZXRlY3RvciBmcm9tIFwiLi4vUmVmbGVjdGlvbi9BdXRvRGV0ZWN0b3JcIjtcbmltcG9ydCBSZXF1ZXN0UmVmbGVjdGlvbiBmcm9tIFwiLi4vUmVmbGVjdGlvbi9SZXF1ZXN0UmVmbGVjdGlvblwiO1xuaW1wb3J0IFByb21pc2VSZWZsZWN0aW9uIGZyb20gXCIuLi9SZWZsZWN0aW9uL1Byb21pc2VSZWZsZWN0aW9uXCI7XG5pbXBvcnQgUmVmZXJlbmNlRGljdGlvbmFyeSBmcm9tIFwiLi4vUHJvdG9jb2wvUmVmZXJlbmNlRGljdGlvbmFyeVwiO1xuaW1wb3J0IHsgSW5kaXJlY3RSZWZsZWN0aW9uIH0gZnJvbSBcIi4uL1JlZmxlY3Rpb24vRGlyZWN0UmVmbGVjdGlvblwiO1xuaW1wb3J0IHsgJHVud3JhcCB9IGZyb20gXCIuLi9SZWZsZWN0aW9uL1Byb21pc2VSZWZsZWN0aW9uXCI7XG5pbXBvcnQgeyBpc1dvcmtlciwgJHN5bWJvbHMsICRjb250ZXh0aWZ5LCB1dWlkdjQgfSBmcm9tIFwiLi4vTGlicmFyeS9TeW1ib2xzXCI7XG5cbi8qKlxuICpcbiAqIEBleHBvcnRcbiAqIEBjbGFzcyBCYXNlSGFuZGxlclxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCYXNlSGFuZGxlciB7XG4gICAgLyoqIEB0eXBlIHtNZXNzYWdlSGFuZGxlcn0gKi9cbiAgICAkbWVzc2FnZUhhbmRsZXIgPSBudWxsO1xuXG4gICAgLyoqIEB0eXBlIHtNYXA8U3RyaW5nLCBSZXNwb25zZVRyYW5zbWl0dGVyPn0gKi9cbiAgICAkcmVzcG9uc2VUcmFuc21pdHRlcnMgPSBuZXcgTWFwKCk7XG5cbiAgICAvKiogQHR5cGUge01hcDxTdHJpbmcsIFJlc3BvbnNlUmVjZWl2ZXI+fSAqL1xuICAgICRyZXNwb25zZVJlY2VpdmVycyA9IG5ldyBNYXAoKTtcblxuICAgIC8qKiBAdHlwZSB7QXJyYXk8TWVzc2FnZUNvZGVyQXN5bmN8TWVzc2FnZUNvZGVyQXRvbWljfE1lc3NhZ2VDb2Rlck5ldHdvcmt8TWVzc2FnZUNvZGVyV29ya2VyPn0gKi9cbiAgICAkaW5ib3ggPSBudWxsO1xuXG4gICAgLyoqIEB0eXBlIHtBcnJheTxNZXNzYWdlQ29kZXJBc3luY3xNZXNzYWdlQ29kZXJBdG9taWN8TWVzc2FnZUNvZGVyTmV0d29ya3xNZXNzYWdlQ29kZXJXb3JrZXI+fSAqL1xuICAgICRvdXRib3ggPSBudWxsO1xuXG4gICAgLyoqICovXG4gICAgJHJlZmxlY3QgPSBSZWZsZWN0O1xuXG4gICAgLyoqIEB0eXBlIHtSZXF1ZXN0UmVmbGVjdGlvbn0gKi9cbiAgICAkcmVxdWVzdFJlZmxlY3QgPSBSZWZsZWN0O1xuXG4gICAgLyoqIEB0eXBlIHtJbmRpcmVjdFJlZmxlY3Rpb259ICovXG4gICAgJGluZGlyZWN0UmVmbGVjdCA9IFJlZmxlY3Q7XG5cbiAgICAvKiogQHR5cGUge1Byb21pc2VSZWZsZWN0aW9ufSAqL1xuICAgICRwcm9taXNlUmVmbGVjdCA9IFJlZmxlY3Q7XG5cbiAgICAvKiogKi9cbiAgICAkZGljdGlvbmFyeSA9IG51bGw7XG5cbiAgICAvKiogKi9cbiAgICAkZGV0ZWN0b3IgPSBudWxsO1xuXG4gICAgLy9cbiAgICBjb25zdHJ1Y3RvcihfLCAkb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgICRvcHRpb25zID0ge1xuICAgICAgICAgICAgcHJlZml4OiBcIlwiLFxuICAgICAgICAgICAgYmFzZTogbmV3IE1hcCgpLFxuICAgICAgICAgICAgLi4uKCRvcHRpb25zfHx7fSlcbiAgICAgICAgfTtcblxuICAgICAgICAvL1xuICAgICAgICB0aGlzLiRkZXRlY3RvciA9IG5ldyBBdXRvRGV0ZWN0b3Ioe30pO1xuICAgICAgICB0aGlzLiRkaWN0aW9uYXJ5ID0gbmV3IFJlZmVyZW5jZURpY3Rpb25hcnkoKTtcblxuICAgICAgICAvKiogQHR5cGUge1JlZmxlY3R9ICovXG4gICAgICAgIHRoaXMuJHJlZmxlY3QgPSBSZWZsZWN0O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7UmVxdWVzdFJlZmxlY3Rpb259ICovXG4gICAgICAgIHRoaXMuJHJlcXVlc3RSZWZsZWN0ID0gbmV3IFJlcXVlc3RSZWZsZWN0aW9uKHRoaXMpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7SW5kaXJlY3RSZWZsZWN0aW9ufSAqL1xuICAgICAgICB0aGlzLiRpbmRpcmVjdFJlZmxlY3QgPSBuZXcgSW5kaXJlY3RSZWZsZWN0aW9uKHRoaXMuJHJlZmxlY3QsIHRoaXMuJGRpY3Rpb25hcnkpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7UHJvbWlzZVJlZmxlY3Rpb259ICovXG4gICAgICAgIHRoaXMuJHByb21pc2VSZWZsZWN0ID0gbmV3IFByb21pc2VSZWZsZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLy9cbiAgICAkdW5jaGFuKCRtc2csICRlKSB7XG4gICAgICAgIHJldHVybiBbJG1zZ1swXSwgJG1zZ1sxXS5tYXAoKGUpPT57XG4gICAgICAgICAgICBpZiAoZVtcIiZ0eXBlb2ZcIl0gPT0gXCJwb3J0XCIpIHJldHVybiAkZS5wb3J0c1tlW1wiJnBvcnRcIl1dO1xuICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgIH0pLCAuLi4kbXNnLnNsaWNlKDIpXTtcbiAgICB9XG5cbiAgICAvL1xuICAgICRjaGFuKCRtc2cpIHtcbiAgICAgICAgbGV0IHBvcnRJZHggPSAwO1xuICAgICAgICByZXR1cm4gWyRtc2dbMF0sICRtc2dbMV0ubWFwKChlKT0+e1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNZXNzYWdlUG9ydCkgcmV0dXJuIHtcIiZwb3J0XCI6IHBvcnRJZHgrKywgXCImdHlwZW9mXCI6IFwicG9ydFwifTtcbiAgICAgICAgICAgIHJldHVybiBlO1xuICAgICAgICB9KSwgLi4uJG1zZy5zbGljZSgyKV07XG4gICAgfVxuXG4gICAgLy9cbiAgICAkbmV3VVVJRCgpIHsgcmV0dXJuIChjcnlwdG8/LnJhbmRvbVVVSUQ/LigpID8/IHV1aWR2NCgpKTsgfVxuXG4gICAgLy9cbiAgICAkdHJhbnNmZXIoJGNpZCwgJHRyYW5zZmVyYWJsZSwgJHNoYXJlZCkge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gJHRyYW5zZmVyYWJsZS5tYXAoKF8saSkgPT4gJHNoYXJlZC5sZW5ndGgraSk7XG4gICAgICAgICRzaGFyZWQucHVzaCguLi4kdHJhbnNmZXJhYmxlKTtcbiAgICAgICAgY29uc3QgJHByb21pc2UgPSB0aGlzLiRtZXNzYWdlSGFuZGxlci4kcHJvbWlzZSgkY2lkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwiJmRhdGFcIjogJHByb21pc2VbXCImZGF0YVwiXSxcbiAgICAgICAgICAgIFwiJmNvZGVcIjoge1xuICAgICAgICAgICAgICAgIC4uLiRwcm9taXNlW1wiJmNvZGVcIl0sXG4gICAgICAgICAgICAgICAgXCImaW5kZXhcIjogaW5kaWNlc1swXVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKiAqL1xuICAgICRyZXF1ZXN0KHt9KSB7IHJldHVybiBudWxsOyB9XG5cbiAgICAvKipcbiAgICAgKiBNYWtlIG9iamVjdCBhcmUgYWNjZXNzaWJsZSBmcm9tIGhvc3Qgb3IgcmVtb3RlXG4gICAgICogQHBhcmFtICB7T2JqZWN0IHwgRnVuY3Rpb259ICRvYmogb2JqZWN0IG9yIGNsYXNzIHRvIHNoYXJlIGFjY2Vzc1xuICAgICAqIEBwYXJhbSAge1N0cmluZ30gJHByb3h5IGFjY2VzcyBvYmplY3Qgb3IgbmFtZVxuICAgICAqIEByZXR1cm4ge1Byb3h5PE9iamVjdCB8IEZ1bmN0aW9uPn0gYWNjZXNzIGNvZGUgd2l0aCBwcm94eSBpbnRvIGNsYXNzXG4gICAgICovXG4gICAgcmVnaXN0ZXIoJG9iaiwgJHByb3h5ID0gbnVsbCkgeyByZXR1cm4gdGhpcy4kZGljdGlvbmFyeS4kcmVnaXN0ZXIoJG9iaiwgJHByb3h5KTsgfTtcblxuICAgIC8qKlxuICAgICAqIE1ha2UgYXJlIGFjY2VzcyBpbnRvIG9iamVjdCBvciBjbGFzc1xuICAgICAqIEBwYXJhbSAge1N0cmluZ30gJHByb3h5IGFjY2VzcyBvYmplY3Qgb3IgbmFtZVxuICAgICAqIEByZXR1cm4ge1Byb3h5PE9iamVjdCB8IEZ1bmN0aW9uPn0gYWNjZXNzIGNvZGUgd2l0aCBwcm94eSBpbnRvIGNsYXNzXG4gICAgICovXG4gICAgYWNjZXNzKCRwcm94eSwge1xuICAgICAgICAkcGVyc2lzdGVudCA9IHRydWUsXG4gICAgICAgICRhc3luYyA9IGZhbHNlLFxuICAgICAgICAkaWRlbnRpZnkgPSB0cnVlXG4gICAgfSA9IHt9KSB7IHJldHVybiB0aGlzLiRyZXF1ZXN0KHskY21kOiBcImFjY2Vzc1wiLCAkaWRlbnRpZnksICRhc3luYywgJHBlcnNpc3RlbnQsICRhcmdzOiBbJHByb3h5Py5bXCImcHJveHlcIl0gfHwgJHByb3h5XX0pOyB9O1xuXG59XG5cbi8qKlxuICogXG4gKi9cbmV4cG9ydCBjbGFzcyBXcmFwSGFuZGxlIHtcbiAgICAjZW5hYmxlUHJvbWlzZSA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoZW5hYmxlUHJvbWlzZSA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuI2VuYWJsZVByb21pc2UgPSBlbmFibGVQcm9taXNlO1xuICAgIH1cblxuICAgIC8vXG4gICAgZ2V0KCRoYW5kbGUsICRuYW1lKSB7XG4gICAgICAgIGlmICgkbmFtZSA9PSBcIiZpc0NvZGVcIilcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCRuYW1lID09IFwiJmlzV3JhcFwiKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICgkbmFtZSA9PSBcIiZjb2RlXCIpIFxuICAgICAgICAgICAgcmV0dXJuICgkaGFuZGxlPy5bXCImY29kZVwiXSA/PyB7fSk7XG4gICAgICAgIGlmICgkbmFtZSA9PSBcIiZkYXRhXCIpIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm94eSgkaGFuZGxlLCB0aGlzKTtcbiAgICAgICAgaWYgKCRuYW1lLmF0KDApID09IFwiJlwiKSBcbiAgICAgICAgICAgIHJldHVybiAoJGhhbmRsZT8uW1wiJmNvZGVcIl0gPz8ge30pPy5bJG5hbWVdO1xuXG4gICAgICAgIC8vXG4gICAgICAgIGlmIChbXCJjYXRjaFwiLCBcInRoZW5cIiwgXCJmaW5hbGx5XCJdLmluZGV4T2YoJG5hbWUpID49IDApIHtcbiAgICAgICAgICAgIGNvbnN0ICRhayA9ICR1bndyYXAoJGhhbmRsZS5hY2Nlc3MoXCIka2V5c1wiLCB7JGlkZW50aWZ5OiBpc1dvcmtlciwgJHBlcnNpc3RlbnQ6IHRydWV9KSkudGhlbigoJGtleXMpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCAkbSA9IE9iamVjdC5mcm9tRW50cmllcygka2V5cy5tYXAoKCRrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbJGssICRoYW5kbGUuYWNjZXNzKCRrLCB7JHBlcnNpc3RlbnQ6IHRydWUsICRpZGVudGlmeTogaXNXb3JrZXJ9KV07XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICRtW1wic29ja2V0XCJdID0gJGhhbmRsZVtcInNvY2tldFwiXTtcbiAgICAgICAgICAgICAgICAkbVtcIndvcmtlclwiXSA9ICRoYW5kbGVbXCJ3b3JrZXJcIl07XG4gICAgICAgICAgICAgICAgcmV0dXJuICRtO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gJGNvbnRleHRpZnkoJGFrLCAkYWs/LlskbmFtZV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9cbiAgICAgICAgaWYgKFtcInNvY2tldFwiLCBcIndvcmtlclwiXS5pbmRleE9mKCRuYW1lKSA+PSAwKSBcbiAgICAgICAgICAgIHJldHVybiAkaGFuZGxlWyRuYW1lXTtcbiAgICAgICAgXG4gICAgICAgIC8vXG4gICAgICAgIGlmIChbXCJjYXRjaFwiLCBcInRoZW5cIiwgXCJmaW5hbGx5XCIsIFwiY29uc3RydWN0b3JcIiwgXCJwcm90b3R5cGVcIiwgXCJ0b1N0cmluZ1wiLCBcInZhbHVlT2ZcIl0uaW5kZXhPZigkbmFtZSkgPj0gMCkgXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICAvL1xuICAgICAgICBpZiAoJG5hbWUuYXQoMCkgPT0gXCImXCIgfHwgT2JqZWN0LnZhbHVlcygkc3ltYm9scykuaW5kZXhPZigkbmFtZSkgPj0gMCkgXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICAvL1xuICAgICAgICB0cnkgeyAkbmFtZSArPSBcIlwiOyB9IGNhdGNoIChfKSB7IHJldHVybiBudWxsOyB9O1xuICAgICAgICByZXR1cm4gJGhhbmRsZS5hY2Nlc3MoJG5hbWUpO1xuICAgIH1cblxuICAgIHNldCgkaGFuZGxlLCAkbmFtZSwgJHZhbHVlKSB7XG4gICAgICAgIHJldHVybiAkaGFuZGxlLnJlZ2lzdGVyKCR2YWx1ZSwgJG5hbWUpO1xuICAgIH1cblxuICAgIG93bktleXMoJGhhbmRsZSkge1xuICAgICAgICByZXR1cm4gJHVud3JhcCgkaGFuZGxlLmFjY2VzcyhcIiRrZXlzXCIpKVxuICAgIH1cblxuICAgIGhhcygkaGFuZGxlLCAkbmFtZSkge1xuICAgICAgICByZXR1cm4gJHVud3JhcCgkaGFuZGxlLmFjY2VzcyhcIiRrZXlzXCIpKS50aGVuKCgkaykgPT4geyByZXR1cm4gJGsuaW5kZXhPZigkbmFtZSkgPj0gMCB9KTtcbiAgICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0EsWTs7QUFFQTtBQUNBLE9BQU9BLFlBQVk7QUFDbkIsT0FBT0MsaUJBQWlCO0FBQ3hCLE9BQU9DLGlCQUFpQjtBQUN4QixPQUFPQyxtQkFBbUI7QUFDMUIsU0FBU0Msa0JBQWtCO0FBQzNCLFNBQVNDLE9BQU87QUFDaEIsU0FBU0MsUUFBUSxFQUFFQyxRQUFRLEVBQUVD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
