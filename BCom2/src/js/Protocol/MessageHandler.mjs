// @ts-nocheck
"use strict"

//
import { _LOG_ } from "../Library/Symbols.mjs"
import DataChannel from "./DataChannel.mjs"
import PathReflect from "../Reflection/PathReflect.mjs"

//
export default class MessageHandler {
    /** @type {Map<String, ResponseReceiver>} */
    #responseReceivers = {}

    /** @type {Map<String, ResponseTransmitter>} */
    #responseTransmitters = {}

    /** @type {MessageCoderAsync|MessageCoderAtomic|MessageCoderNetwork|MessageCoderWorker} */
    #outboxCoder = null

    /** @type {PathReflect} */
    #reflect = PathReflect

    /** @type {ReferenceDictionary} */
    #dictionary = null

    /** @type {Map<String, DataChannel>} */
    #channels = new Map()

    /** @type {BaseHandler|WorkerHandler|SocketHandler} */
    #handle = null

    /** @type {FinalizationRegistry} */
    #finalization = null

    /** @type {WeakMap} */
    #cib = null

    /**
     *
     * @param {Map<String, ResponseReceiver>} responseReceivers
     * @param {Map<String, ResponseTransmitter>} responseTransmitters
     * @param {MessageCoderAsync|MessageCoderAtomic|MessageCoderNetwork|MessageCoderWorker} outboxCoder
     * @param {ReferenceDictionary} dictionary
     * @param {BaseHandler|WorkerHandler|SocketHandler} handle
     */
    constructor(responseReceivers, responseTransmitters, outboxCoder, dictionary, handle) {
        this.#responseTransmitters = responseTransmitters
        this.#responseReceivers = responseReceivers
        this.#outboxCoder = outboxCoder
        this.#dictionary = dictionary
        this.#reflect = PathReflect //PathReflect;//(typeof Reflect != "undefined" ? Reflect : FakeReflect);
        this.#channels = new Map()
        this.#handle = handle
        this.#finalization = new FinalizationRegistry(($cid) => {
            this.#channels.delete($cid)
        })
        this.#cib = new WeakMap()
    }

    //
    $initiate({ "&cid": $cid = null }) {
        if ($cid && !this.#channels.has($cid)) {
            const $new = new DataChannel($cid, this.#dictionary, this.#handle, this)
            this.#channels.set($cid, $new)
            return $new
        }
        return this.#channels.get($cid)
    }

    //
    $finalizer($holder, $cid) {
        if (!this.#cib.has($holder)) {
            this.#cib.set($holder, $cid)
            this.#finalization.register($holder, $cid)
        }
        return this
    }

    //
    $promise($cid) {
        return this.#channels.get($cid).$promise()
    }

    //
    async handleRequest([{ $id = "", $cmd = "", $worker = null, $args = [], $persistent = true, $cid = null, $type = "unknown" }, $buffer = null]) {
        {
            switch ($type) {
                // got message
                case "message":
                    if ($cid) {
                        const $channel = this.#channels.get($cid)
                        $channel?.handleMessage?.({ $cmd }, { ...$args[0] })
                    }
                //break;

                //
                case "request": {
                    //
                    const responseTransmitter = this.#responseTransmitters.shift($id)
                    if (responseTransmitter) {
                        const $tf = []
                        const $proxy = await $args.shift()
                        let $obj = null,
                            $got = null

                        try {
                            $obj = this.#dictionary.$get($proxy, $persistent) ?? $proxy
                            $got = $cmd == "access" ? $obj : this.#reflect[$cmd]($obj, ...(await Promise.all($args)))

                            //
                            responseTransmitter.resolve(
                                ...(await this.#outboxCoder.encodeMessage(
                                    [
                                        {
                                            $id,
                                            $cmd,
                                            $type: "result",
                                            $worker,
                                            $args: [$got]
                                        },
                                        $buffer,
                                        true
                                    ],
                                    $tf
                                ))
                            )
                        } catch (e) {
                            console.error(e)
                            responseTransmitter.reject(
                                ...(await this.#outboxCoder.encodeError(
                                    [
                                        {
                                            $id,
                                            $cmd,
                                            $type: "error",
                                            $worker,
                                            $args: [`Error Message: ${e?.message};\nFile Name: ${e?.fileName};\nLine Number: ${e?.lineNumber}`],
                                            $message: e?.message,
                                            $fileName: e?.fileName,
                                            $lineNumber: e?.lineNumber
                                        },
                                        $buffer,
                                        true
                                    ],
                                    $tf
                                ))
                            )
                        }
                    }
                }
                //break;

                case "result": {
                    const responseReceiver = this.#responseReceivers.shift($id)
                    if (responseReceiver) {
                        // needs to add "&buffer" into receiver?!
                        responseReceiver.resolve(...(await $args))
                    }
                }
                //break;

                case "error": {
                    const responseReceiver = this.#responseReceivers.shift($id)
                    if (responseReceiver) {
                        responseReceiver.reject(...(await $args))
                    }
                }
                //break;

                default:
            }
        }
        return
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfTE9HXyIsIkRhdGFDaGFubmVsIiwiUGF0aFJlZmxlY3QiLCJNZXNzYWdlSGFuZGxlciIsInJlc3BvbnNlUmVjZWl2ZXJzIiwicmVzcG9uc2VUcmFuc21pdHRlcnMiLCJvdXRib3hDb2RlciIsInJlZmxlY3QiLCJkaWN0aW9uYXJ5IiwiY2hhbm5lbHMiLCJNYXAiLCJoYW5kbGUiLCJmaW5hbGl6YXRpb24iLCJjaWIiLCJjb25zdHJ1Y3RvciIsIkZpbmFsaXphdGlvblJlZ2lzdHJ5IiwiJGNpZCIsImRlbGV0ZSIsIldlYWtNYXAiLCIkaW5pdGlhdGUiLCJoYXMiLCIkbmV3Iiwic2V0IiwiZ2V0IiwiJGZpbmFsaXplciIsIiRob2xkZXIiLCJyZWdpc3RlciIsIiRwcm9taXNlIiwiaGFuZGxlUmVxdWVzdCIsIiRpZCIsIiRjbWQiLCIkd29ya2VyIiwiJGFyZ3MiLCIkcGVyc2lzdGVudCIsIiR0eXBlIiwiJGJ1ZmZlciIsIiRjaGFubmVsIiwiaGFuZGxlTWVzc2FnZSIsInJlc3BvbnNlVHJhbnNtaXR0ZXIiLCJzaGlmdCIsIiR0ZiIsIiRwcm94eSIsIiRvYmoiLCIkZ290IiwiJGdldCIsIlByb21pc2UiLCJhbGwiLCJyZXNvbHZlIiwiZW5jb2RlTWVzc2FnZSIsImUiLCJjb25zb2xlIiwiZXJyb3IiLCJyZWplY3QiLCJlbmNvZGVFcnJvciIsIm1lc3NhZ2UiLCJmaWxlTmFtZSIsImxpbmVOdW1iZXIiLCIkbWVzc2FnZSIsIiRmaWxlTmFtZSIsIiRsaW5lTnVtYmVyIiwicmVzcG9uc2VSZWNlaXZlciJdLCJzb3VyY2VzIjpbIkM6XFxQcm9qZWN0c1xcQlowXFxCQ29tMlxcc3JjXFxjaXZldFxcUHJvdG9jb2xcXE1lc3NhZ2VIYW5kbGVyLmNpdmV0Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1ub2NoZWNrXG5cInVzZSBzdHJpY3RcIjtcblxuLy9cbmltcG9ydCB7IF9MT0dfIH0gZnJvbSBcIi4uL0xpYnJhcnkvU3ltYm9sc1wiO1xuaW1wb3J0IERhdGFDaGFubmVsIGZyb20gXCIuL0RhdGFDaGFubmVsXCI7XG5pbXBvcnQgUGF0aFJlZmxlY3QgZnJvbSBcIi4uL1JlZmxlY3Rpb24vUGF0aFJlZmxlY3RcIjtcblxuLy8gXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZXNzYWdlSGFuZGxlciB7XG5cbiAgICAvKiogQHR5cGUge01hcDxTdHJpbmcsIFJlc3BvbnNlUmVjZWl2ZXI+fSAqL1xuICAgICNyZXNwb25zZVJlY2VpdmVycyA9IHt9O1xuXG4gICAgLyoqIEB0eXBlIHtNYXA8U3RyaW5nLCBSZXNwb25zZVRyYW5zbWl0dGVyPn0gKi9cbiAgICAjcmVzcG9uc2VUcmFuc21pdHRlcnMgPSB7fTtcblxuICAgIC8qKiBAdHlwZSB7TWVzc2FnZUNvZGVyQXN5bmN8TWVzc2FnZUNvZGVyQXRvbWljfE1lc3NhZ2VDb2Rlck5ldHdvcmt8TWVzc2FnZUNvZGVyV29ya2VyfSAqL1xuICAgICNvdXRib3hDb2RlciA9IG51bGw7XG5cbiAgICAvKiogQHR5cGUge1BhdGhSZWZsZWN0fSAqL1xuICAgICNyZWZsZWN0ID0gUGF0aFJlZmxlY3Q7XG5cbiAgICAvKiogQHR5cGUge1JlZmVyZW5jZURpY3Rpb25hcnl9ICovXG4gICAgI2RpY3Rpb25hcnkgPSBudWxsO1xuXG4gICAgLyoqIEB0eXBlIHtNYXA8U3RyaW5nLCBEYXRhQ2hhbm5lbD59ICovXG4gICAgI2NoYW5uZWxzID0gbmV3IE1hcCgpO1xuXG4gICAgLyoqIEB0eXBlIHtCYXNlSGFuZGxlcnxXb3JrZXJIYW5kbGVyfFNvY2tldEhhbmRsZXJ9ICovXG4gICAgI2hhbmRsZSA9IG51bGw7XG5cbiAgICAvKiogQHR5cGUge0ZpbmFsaXphdGlvblJlZ2lzdHJ5fSAqL1xuICAgICNmaW5hbGl6YXRpb24gPSBudWxsO1xuXG4gICAgLyoqIEB0eXBlIHtXZWFrTWFwfSAqL1xuICAgICNjaWIgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNYXA8U3RyaW5nLCBSZXNwb25zZVJlY2VpdmVyPn0gcmVzcG9uc2VSZWNlaXZlcnMgXG4gICAgICogQHBhcmFtIHtNYXA8U3RyaW5nLCBSZXNwb25zZVRyYW5zbWl0dGVyPn0gcmVzcG9uc2VUcmFuc21pdHRlcnMgXG4gICAgICogQHBhcmFtIHtNZXNzYWdlQ29kZXJBc3luY3xNZXNzYWdlQ29kZXJBdG9taWN8TWVzc2FnZUNvZGVyTmV0d29ya3xNZXNzYWdlQ29kZXJXb3JrZXJ9IG91dGJveENvZGVyIFxuICAgICAqIEBwYXJhbSB7UmVmZXJlbmNlRGljdGlvbmFyeX0gZGljdGlvbmFyeSBcbiAgICAgKiBAcGFyYW0ge0Jhc2VIYW5kbGVyfFdvcmtlckhhbmRsZXJ8U29ja2V0SGFuZGxlcn0gaGFuZGxlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJlc3BvbnNlUmVjZWl2ZXJzLCByZXNwb25zZVRyYW5zbWl0dGVycywgb3V0Ym94Q29kZXIsIGRpY3Rpb25hcnksIGhhbmRsZSkge1xuICAgICAgICB0aGlzLiNyZXNwb25zZVRyYW5zbWl0dGVycyA9IHJlc3BvbnNlVHJhbnNtaXR0ZXJzO1xuICAgICAgICB0aGlzLiNyZXNwb25zZVJlY2VpdmVycyA9IHJlc3BvbnNlUmVjZWl2ZXJzO1xuICAgICAgICB0aGlzLiNvdXRib3hDb2RlciA9IG91dGJveENvZGVyO1xuICAgICAgICB0aGlzLiNkaWN0aW9uYXJ5ID0gZGljdGlvbmFyeTtcbiAgICAgICAgdGhpcy4jcmVmbGVjdCA9IFBhdGhSZWZsZWN0Oy8vUGF0aFJlZmxlY3Q7Ly8odHlwZW9mIFJlZmxlY3QgIT0gXCJ1bmRlZmluZWRcIiA/IFJlZmxlY3QgOiBGYWtlUmVmbGVjdCk7XG4gICAgICAgIHRoaXMuI2NoYW5uZWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLiNoYW5kbGUgPSBoYW5kbGU7XG4gICAgICAgIHRoaXMuI2ZpbmFsaXphdGlvbiA9IG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeSgoJGNpZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy4jY2hhbm5lbHMuZGVsZXRlKCRjaWQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4jY2liID0gbmV3IFdlYWtNYXAoKTtcbiAgICB9XG5cbiAgICAvL1xuICAgICRpbml0aWF0ZSh7XCImY2lkXCI6ICRjaWQgPSBudWxsfSkge1xuICAgICAgICBpZiAoJGNpZCAmJiAhdGhpcy4jY2hhbm5lbHMuaGFzKCRjaWQpKSB7XG4gICAgICAgICAgICBjb25zdCAkbmV3ID0gbmV3IERhdGFDaGFubmVsKCRjaWQsIHRoaXMuI2RpY3Rpb25hcnksIHRoaXMuI2hhbmRsZSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLiNjaGFubmVscy5zZXQoJGNpZCwgJG5ldyk7XG4gICAgICAgICAgICByZXR1cm4gJG5ldztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy4jY2hhbm5lbHMuZ2V0KCRjaWQpO1xuICAgIH1cblxuICAgIC8vXG4gICAgJGZpbmFsaXplcigkaG9sZGVyLCAkY2lkKSB7XG4gICAgICAgIGlmICghdGhpcy4jY2liLmhhcygkaG9sZGVyKSkge1xuICAgICAgICAgICAgdGhpcy4jY2liLnNldCgkaG9sZGVyLCAkY2lkKTtcbiAgICAgICAgICAgIHRoaXMuI2ZpbmFsaXphdGlvbi5yZWdpc3RlcigkaG9sZGVyLCAkY2lkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvL1xuICAgICRwcm9taXNlKCRjaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2NoYW5uZWxzLmdldCgkY2lkKS4kcHJvbWlzZSgpO1xuICAgIH1cblxuICAgIC8vXG4gICAgYXN5bmMgaGFuZGxlUmVxdWVzdChbe1xuICAgICAgICAkaWQgPSBcIlwiLCBcbiAgICAgICAgJGNtZCA9IFwiXCIsIFxuICAgICAgICAkd29ya2VyID0gbnVsbCwgXG4gICAgICAgICRhcmdzID0gW10sIFxuICAgICAgICAkcGVyc2lzdGVudCA9IHRydWUsIFxuICAgICAgICAkY2lkID0gbnVsbCwgXG4gICAgICAgICR0eXBlID0gXCJ1bmtub3duXCJcbiAgICB9LCAkYnVmZmVyID0gbnVsbF0pIHtcbiAgICAgICAge1xuICAgICAgICAgICAgc3dpdGNoICgkdHlwZSkge1xuICAgICAgICAgICAgICAgIC8vIGdvdCBtZXNzYWdlXG4gICAgICAgICAgICAgICAgY2FzZSBcIm1lc3NhZ2VcIjogaWYgKCRjaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgJGNoYW5uZWwgPSB0aGlzLiNjaGFubmVscy5nZXQoJGNpZCk7XG4gICAgICAgICAgICAgICAgICAgICRjaGFubmVsPy5oYW5kbGVNZXNzYWdlPy4oeyRjbWR9LCB7Li4uJGFyZ3NbMF19KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9icmVhaztcblxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlcXVlc3RcIjoge1xuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZVRyYW5zbWl0dGVyID0gdGhpcy4jcmVzcG9uc2VUcmFuc21pdHRlcnMuc2hpZnQoJGlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlVHJhbnNtaXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0ICR0ZiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgJHByb3h5ID0gYXdhaXQgJGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCAkb2JqID0gbnVsbCwgJGdvdCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJG9iaiA9ICh0aGlzLiNkaWN0aW9uYXJ5LiRnZXQoJHByb3h5LCAkcGVyc2lzdGVudCkgPz8gJHByb3h5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZ290ID0gKCRjbWQgPT0gXCJhY2Nlc3NcIiA/ICRvYmogOiB0aGlzLiNyZWZsZWN0WyRjbWRdKCRvYmosIC4uLihhd2FpdCBQcm9taXNlLmFsbCgkYXJncykpKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVHJhbnNtaXR0ZXIucmVzb2x2ZSguLi4oYXdhaXQgdGhpcy4jb3V0Ym94Q29kZXIuZW5jb2RlTWVzc2FnZShbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaWQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY21kLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHR5cGU6IFwicmVzdWx0XCIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd29ya2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkYXJnczogWyRnb3RdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sICRidWZmZXIsIHRydWVdLCAkdGYpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVHJhbnNtaXR0ZXIucmVqZWN0KC4uLihhd2FpdCB0aGlzLiNvdXRib3hDb2Rlci5lbmNvZGVFcnJvcihbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaWQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkY21kLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHR5cGU6IFwiZXJyb3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdvcmtlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGFyZ3M6IFtgRXJyb3IgTWVzc2FnZTogJHtlPy5tZXNzYWdlfTtcXG5GaWxlIE5hbWU6ICR7ZT8uZmlsZU5hbWV9O1xcbkxpbmUgTnVtYmVyOiAke2U/LmxpbmVOdW1iZXJ9YF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRtZXNzYWdlOiBlPy5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZmlsZU5hbWU6IGU/LmZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbGluZU51bWJlcjogZT8ubGluZU51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sICRidWZmZXIsIHRydWVdLCAkdGYpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2JyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlc3VsdFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlUmVjZWl2ZXIgPSB0aGlzLiNyZXNwb25zZVJlY2VpdmVycy5zaGlmdCgkaWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VSZWNlaXZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmVlZHMgdG8gYWRkIFwiJmJ1ZmZlclwiIGludG8gcmVjZWl2ZXI/IVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VSZWNlaXZlci5yZXNvbHZlKC4uLmF3YWl0ICRhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvL2JyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcImVycm9yXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VSZWNlaXZlciA9IHRoaXMuI3Jlc3BvbnNlUmVjZWl2ZXJzLnNoaWZ0KCRpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZVJlY2VpdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVJlY2VpdmVyLnJlamVjdCguLi5hd2FpdCAkYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9icmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFxuICAgIH1cbn07XG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0EsWTs7QUFFQTtBQUNBLFNBQVNBLEtBQUs7QUFDZCxPQUFPQyxXQUFXO0FBQ2xCLE9BQU9DLFdBQVc7O0FBRWxCO0FBQ0EsZUFBZSxNQUFNQyxjQUFjLENBQUM7O0VBRWhDO0VBQ0EsQ0FBQUMsaUJBQWtCLEdBQUcsQ0FBQyxDQUFDOztFQUV2QjtFQUNBLENBQUFDLG9CQUFxQixHQUFHLENBQUMsQ0FBQzs7RUFFMUI7RUFDQSxDQUFBQyxXQUFZLEdBQUcsSUFBSTs7RUFFbkI7RUFDQSxDQUFBQyxPQUFRLEdBQUdMLFdBQVc7O0VBRXRCO0VBQ0EsQ0FBQU0sVUFBVyxHQUFHLElBQUk7O0VBRWxCO0VBQ0EsQ0FBQUMsUUFBUyxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDOztFQUVyQjtFQUNBLENBQUFDLE1BQU8sR0FBRyxJQUFJOztFQUVkO0VBQ0EsQ0FBQUMsWUFBYSxHQUFHLElBQUk7O0VBRXBCO0VBQ0EsQ0FBQUMsR0FBSSxHQUFHLElBQUk7O0VBRVg7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJQyxXQUFXQSxDQUFDVixpQkFBaUIsRUFBRUMsb0JBQW9CLEVBQUVDLFdBQVcsRUFBRUUsVUFBVSxFQUFFRyxNQUFNLEVBQUU7SUFDbEYsSUFBSSxDQUFDLENBQUFOLG9CQUFxQixHQUFHQSxvQkFBb0I7SUFDakQsSUFBSSxDQUFDLENBQUFELGlCQUFrQixHQUFHQSxpQkFBaUI7SUFD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
