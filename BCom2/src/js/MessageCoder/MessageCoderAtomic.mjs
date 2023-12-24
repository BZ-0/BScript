// @ts-nocheck
"use strict"

//
import AutoDetector from "../Reflection/AutoDetector.mjs"
import MessageCoderWorker from "./MessageCoderWorker.mjs"
import SyncPromise, { $getter } from "../Library/SyncPromise.mjs"

//
import { wrapFunc, AccessReflection } from "../Reflection/DirectReflection.mjs"
import { _LOG_ } from "../Library/Symbols.mjs"

// for protocol
export default class MessageCoderAtomic extends MessageCoderWorker {
    $isAtomic = true
    $proxify = null
    $encodingRules = null
    $decodingRules = null

    //
    constructor($sup) {
        super($sup)

        //
        this.$isAtomic = true

        //
        const $proxify = ([$code], { $untyped }) => {
            return this.$dictionary.$temp(
                $getter($untyped),
                {
                    ["&origin"]: $code?.["&proxy"],
                    ["&root"]: $code?.["&root"] ?? $code?.["&origin"],
                    ["&persistent"]: $code?.["&persistent"]
                },
                $untyped
            )?.["&code"]
        }

        //
        this.$encodingRules = new Map([
            //
            [
                "array",
                ([_, $shared], { $untyped }) => {
                    return $untyped.map((e) => this.encodeMember(e, $shared))
                }
            ],
            ["worker", $proxify],
            ["socket", $proxify],
            ["class", $proxify],
            ["proxy", $proxify],

            // i.e. transfer policy (except shared)
            [
                "shared",
                ([_, $shared], { $wrap }) => {
                    const $data = $wrap?.["&data"]
                    const $index = $data ? $shared?.length ?? -1 : -1
                    if ($data) $shared?.push?.((($data?.buffer && $data.BYTES_PER_ELEMENT) || $data instanceof DataView) && !($data instanceof WebAssembly.Memory) ? $data?.buffer || $data : $data)
                    return {
                        ["&typeof"]: "shared",
                        ["&byteOffset"]: $data?.byteOffset || 0,
                        ["&byteLength"]: $data?.byteLength || 0,
                        ["&index"]: $index,
                        ["&type"]: this.$detector.$typedarray($data)
                    }
                }
            ],

            //
            [
                "transfer",
                ([_, $shared], { $wrap, $receiver }) => {
                    return this.$dictionary.$temp(
                        (async () => {
                            {
                                const $data = await $wrap?.["&data"]
                                const $index = $data ? $shared?.length ?? -1 : -1
                                const $raw = (($data?.buffer && $data.BYTES_PER_ELEMENT) || $data instanceof DataView) && !($data instanceof WebAssembly.Memory) ? $data?.buffer || $data : $data

                                // set an ReadbackReflection proxy object around identifier
                                if ($receiver && this.$detector.$dropShared($raw)) {
                                    $wrap["&data"] = $receiver?.$transfer?.([$raw], $shared)
                                } else {
                                    // just add to transfer list
                                    if ($raw) $shared?.push?.($raw)
                                }

                                //
                                return {
                                    ["&isCode"]: true,
                                    ["&meta"]: $wrap?.["&meta"],
                                    ["&typeof"]: "transfer",
                                    ["&byteOffset"]: $data.byteOffset || 0,
                                    ["&byteLength"]: $data.byteLength || 0,
                                    ["&index"]: (await $wrap?.["&data"]?.["&index"]) ?? $index,
                                    ["&local"]: await $wrap?.["&data"]?.["&local"], // will be used for feedback resolve
                                    ["&type"]: this.$detector.$typedarray($data)
                                }
                            }
                        })(),
                        {
                            ["&typeof"]: "access",
                            ["&origin"]: $code?.["&proxy"],
                            ["&root"]: $code?.["&root"] ?? $code?.["&origin"],
                            ["&persistent"]: $code?.["&persistent"]
                        }
                    )?.["&code"]
                }
            ],

            //
            [
                "promise",
                ([$code, $shared], { $untyped }) => {
                    return this.$dictionary.$temp(
                        $getter($untyped),
                        {
                            ["&typeof"]: "access",
                            ["&origin"]: $code?.["&proxy"],
                            ["&root"]: $code?.["&root"] ?? $code?.["&origin"],
                            ["&persistent"]: $code?.["&persistent"]
                        },
                        $untyped
                    )?.["&code"]
                }
            ],

            // i.e. copy policy
            [
                "typedarray",
                ([_], { $wrap }) => {
                    return $wrap?.["&data"]
                }
            ],

            //
            [
                "object",
                ([_, $shared], { $untyped }) => {
                    return Object.fromEntries(
                        Object.entries($untyped).map((pair) => {
                            return [pair[0], this.encodeMember(pair[1], $shared)]
                        })
                    )
                }
            ]
        ])

        //
        this.$decodingRules = new Map([
            [
                "transfer",
                ([coded, shared], { $sender }) => {
                    const $buffer = shared?.[coded["&index"]]
                    const $instance = this.$detector.$typewrap(coded["&type"], $buffer?.buffer || $buffer, coded["&byteOffset"] + ($buffer?.byteOffset || 0), coded["&byteLength"] || 0, coded?.["&meta"])

                    // send identifier of transferred object
                    $sender?.$feedback?.(coded, $instance) // will be stored in $temp directionary for access
                    return $instance
                }
            ],

            [
                "shared",
                ([coded, shared]) => {
                    const $buffer = shared?.[coded["&index"]]
                    if (!coded["&type"] || coded["&type"] == "$unk") return $buffer
                    return this.$detector.$typewrap(coded["&type"], $buffer?.buffer || $buffer, coded["&byteOffset"] + ($buffer?.byteOffset || 0), coded["&byteLength"] || 0)
                }
            ],

            //
            [
                "class",
                ([_]) => {
                    throw Error("Currently, class can't to be a decodable!")
                }
            ],

            //
            [
                "access",
                async ([coded, shared]) => {
                    // when async mode, access should to be also decoded
                    return new Proxy(
                        wrapFunc({
                            ["&code"]: { ["&typeof"]: "promise" },
                            ["&data"]: new Proxy(coded, new AccessReflection(Reflect, this.$handler)).then(($) => {
                                return this.decodeMember($, shared)
                            })
                        }),
                        this.$handler.$promiseReflection
                    )
                }
            ],

            //
            [
                "proxy",
                ([coded]) => {
                    //console.log(coded?.["&origin"], coded?.["&proxy"]);
                    // ask as by proxy, also by origin
                    // (note: you must mean, that `origin` means original obj directly, while `proxy` may be a chain of proxy)
                    const hasOrigin = this.$dictionary.$get(coded?.["&root"], coded?.["&persistent"]) ?? this.$dictionary.$get(coded?.["&origin"], coded?.["&persistent"]) ?? this.$dictionary.$get(coded?.["&proxy"], coded?.["&persistent"])
                    if (hasOrigin) return hasOrigin

                    //
                    return new Proxy(
                        wrapFunc({
                            ["&data"]: null,
                            ["&code"]: coded
                        }),
                        this.$requestReflect
                    )
                }
            ],
            [
                "array",
                ([coded, shared]) => {
                    return (coded["&data"] ?? coded).map((m) => this.decodeMember(m, shared))
                }
            ],
            [
                "object",
                ([coded, shared]) => {
                    const _entries_ = Object.entries(coded["&data"] ?? coded)
                    return Object.fromEntries(
                        _entries_.map((pair) => {
                            return [pair[0], this.decodeMember(pair[1], shared)]
                        })
                    )
                }
            ],
            [
                "typedarray",
                ([coded]) => {
                    return coded?.["&data"] ?? coded
                }
            ]
        ])

        // TODO? Planned to use when working and return to client stage...
        this.$transcodingRules = new Map([])
    }

    // almost full support planned on v2.3
    waitResponseSync($buffer = null, $timeout = 1000) {
        const btime = performance.now()
        const u32a = new Uint32Array($buffer, 0, 1)
        while (Atomics.load(u32a, 0) <= 0) {
            if (performance.now() - btime >= $timeout) break
        }
        return this.decodeMessage([new Uint8Array($buffer, 8, Atomics.load(u32a, 0)), $buffer], [])
    }

    //
    decodeMessage([$message, $buffer = null], $shared = []) {
        const _unwrap_ = (
            this.$decode ||
            ((e) => {
                return this.$msgpck?.decode(e, { useBigInt64: true })
            })
        )?.($message)
        _unwrap_.$args = _unwrap_.$args?.map?.((m) => this.decodeMember(m, $shared)) ?? []
        //console.log(_unwrap_.$args);
        return [[_unwrap_, $buffer], $shared.concat([$buffer])]
    }

    //
    encodeMessage([$data, $buffer = null, $receive = false], $shared = []) {
        $buffer ??=
            typeof SharedArrayBuffer != "undefined"
                ? new SharedArrayBuffer(4096 + 8, {
                      maxByteLength: 65536 + 8
                  })
                : new ArrayBuffer(4096 + 8, {
                      maxByteLength: 65536 + 8
                  })

        $data.$worker = typeof $data.$worker == "string" ? $data.$worker : undefined // unsupported...
        $data.$args = $data.$args?.map?.((e) => this.encodeMember(e, $shared)) ?? []
        const _wrap_ = (
            this.$encode ||
            ((e) => {
                return this.$msgpck?.encode(e, { useBigInt64: true })
            })
        )?.($data)

        //
        if ($receive) {
            // when received by remote, need to copy buffer
            if ($buffer.byteLength - 8 < _wrap_.byteLength) $buffer.grow(_wrap_.byteLength + 8)
            const _copy_ = new Uint8Array($buffer, 8, _wrap_.byteLength)
            _copy_.set(_wrap_)
            const _len_ = new Uint32Array($buffer, 0, 1)
            if (typeof Atomics != "undefined") {
                Atomics.store(_len_, 0, _wrap_.byteLength)
            } else {
                _len_[0] = _wrap_.byteLength
            }
            return [[_copy_, $buffer], $shared.concat([_copy_.buffer, $buffer])]
        } else {
            const _copy_ = new Uint8Array(_wrap_)
            return [[_copy_, $buffer], $shared.concat([_copy_.buffer, $buffer])]
        }
    }

    // TODO! Needs client-side error handling...
    decodeError(..._) {
        throw Error("Unhandled internal error...")
    }

    // TODO! Needs client-side error handling...
    encodeError([$data, $buffer], $shared = []) {
        delete $data?.$args
        delete $data?.["&data"]
        const _wrap_ = (
            this.$encode ||
            ((e) => {
                return this.$msgpck?.encode(e, { useBigInt64: true })
            })
        )?.($data)
        return [[_wrap_, $buffer], $shared.concat([_wrap_.buffer, $buffer])]
    }

    //
    decodeMember(coded, shared = []) {
        // if is null, prefer don't decode...
        if (!coded || ["object", "function"].indexOf(typeof coded) < 0) return coded
        if (!coded?.["&typeof"]) coded = new AutoDetector(coded)["&code"]
        return this.$decodingRules.get(coded?.["&typeof"])?.([coded, shared]) ?? coded?.["&data"] ?? coded
    }

    //
    encodeMember($wrap, $shared = []) {
        if (["object", "function"].indexOf(typeof $wrap) < 0) return $wrap

        //
        const $untyped = $wrap
        let $typeof = $wrap?.["&typeof"]
        if (!$typeof) {
            $wrap = new AutoDetector($wrap)
            $typeof = $wrap?.["&typeof"]
        }

        //
        return this.$encodingRules.get($typeof)?.([$wrap["&code"], $shared], { $wrap, $untyped }) ?? $wrap?.["&data"]
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBdXRvRGV0ZWN0b3IiLCJNZXNzYWdlQ29kZXJXb3JrZXIiLCJTeW5jUHJvbWlzZSIsIiRnZXR0ZXIiLCJ3cmFwRnVuYyIsIkFjY2Vzc1JlZmxlY3Rpb24iLCJfTE9HXyIsIk1lc3NhZ2VDb2RlckF0b21pYyIsIiRpc0F0b21pYyIsIiRwcm94aWZ5IiwiJGVuY29kaW5nUnVsZXMiLCIkZGVjb2RpbmdSdWxlcyIsImNvbnN0cnVjdG9yIiwiJHN1cCIsIiRjb2RlIiwiJHVudHlwZWQiLCIkZGljdGlvbmFyeSIsIiR0ZW1wIiwiTWFwIiwiXyIsIiRzaGFyZWQiLCJtYXAiLCJlIiwiZW5jb2RlTWVtYmVyIiwiJHdyYXAiLCIkZGF0YSIsIiRpbmRleCIsImxlbmd0aCIsInB1c2giLCJidWZmZXIiLCJCWVRFU19QRVJfRUxFTUVOVCIsIkRhdGFWaWV3IiwiV2ViQXNzZW1ibHkiLCJNZW1vcnkiLCJieXRlT2Zmc2V0IiwiYnl0ZUxlbmd0aCIsIiRkZXRlY3RvciIsIiR0eXBlZGFycmF5IiwiJHJlY2VpdmVyIiwiJHJhdyIsIiRkcm9wU2hhcmVkIiwiJHRyYW5zZmVyIiwiT2JqZWN0IiwiZnJvbUVudHJpZXMiLCJlbnRyaWVzIiwicGFpciIsImNvZGVkIiwic2hhcmVkIiwiJHNlbmRlciIsIiRidWZmZXIiLCIkaW5zdGFuY2UiLCIkdHlwZXdyYXAiLCIkZmVlZGJhY2siLCJFcnJvciIsIlByb3h5IiwiUmVmbGVjdCIsIiRoYW5kbGVyIiwidGhlbiIsIiQiLCJkZWNvZGVNZW1iZXIiLCIkcHJvbWlzZVJlZmxlY3Rpb24iLCJoYXNPcmlnaW4iLCIkZ2V0IiwiJHJlcXVlc3RSZWZsZWN0IiwibSIsIl9lbnRyaWVzXyIsIiR0cmFuc2NvZGluZ1J1bGVzIiwid2FpdFJlc3BvbnNlU3luYyIsIiR0aW1lb3V0IiwiYnRpbWUiLCJwZXJmb3JtYW5jZSIsIm5vdyIsInUzMmEiLCJVaW50MzJBcnJheSIsIkF0b21pY3MiLCJsb2FkIiwiZGVjb2RlTWVzc2FnZSIsIlVpbnQ4QXJyYXkiLCIkbWVzc2FnZSIsIl91bndyYXBfIiwiJGRlY29kZSIsIiRtc2dwY2siLCJkZWNvZGUiLCJ1c2VCaWdJbnQ2NCIsIiRhcmdzIiwiY29uY2F0IiwiZW5jb2RlTWVzc2FnZSIsIiRyZWNlaXZlIiwiU2hhcmVkQXJyYXlCdWZmZXIiLCJtYXhCeXRlTGVuZ3RoIiwiQXJyYXlCdWZmZXIiLCIkd29ya2VyIiwidW5kZWZpbmVkIiwiX3dyYXBfIiwiJGVuY29kZSIsImVuY29kZSIsImdyb3ciLCJfY29weV8iLCJzZXQiLCJfbGVuXyIsInN0b3JlIiwiZGVjb2RlRXJyb3IiLCJlbmNvZGVFcnJvciIsImluZGV4T2YiLCJnZXQiLCIkdHlwZW9mIl0sInNvdXJjZXMiOlsiQzpcXFByb2plY3RzXFxCWjBcXEJDb20yXFxzcmNcXGNpdmV0XFxNZXNzYWdlQ29kZXJcXE1lc3NhZ2VDb2RlckF0b21pYy5jaXZldCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtbm9jaGVja1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vXG5pbXBvcnQgQXV0b0RldGVjdG9yIGZyb20gXCIuLi9SZWZsZWN0aW9uL0F1dG9EZXRlY3RvclwiO1xuaW1wb3J0IE1lc3NhZ2VDb2RlcldvcmtlciBmcm9tIFwiLi9NZXNzYWdlQ29kZXJXb3JrZXJcIjtcbmltcG9ydCBTeW5jUHJvbWlzZSwgeyAkZ2V0dGVyIH0gZnJvbSBcIi4uL0xpYnJhcnkvU3luY1Byb21pc2VcIlxuXG4vL1xuaW1wb3J0IHsgd3JhcEZ1bmMsIEFjY2Vzc1JlZmxlY3Rpb24gfSBmcm9tIFwiLi4vUmVmbGVjdGlvbi9EaXJlY3RSZWZsZWN0aW9uXCI7XG5pbXBvcnQgeyBfTE9HXyB9IGZyb20gXCIuLi9MaWJyYXJ5L1N5bWJvbHNcIjtcblxuLy8gZm9yIHByb3RvY29sXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZXNzYWdlQ29kZXJBdG9taWMgZXh0ZW5kcyBNZXNzYWdlQ29kZXJXb3JrZXIge1xuICAgICRpc0F0b21pYyA9IHRydWU7XG4gICAgJHByb3hpZnkgPSBudWxsO1xuICAgICRlbmNvZGluZ1J1bGVzID0gbnVsbDtcbiAgICAkZGVjb2RpbmdSdWxlcyA9IG51bGw7XG5cbiAgICAvL1xuICAgIGNvbnN0cnVjdG9yKCRzdXApIHtcbiAgICAgICAgc3VwZXIoJHN1cCk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgdGhpcy4kaXNBdG9taWMgPSB0cnVlO1xuXG4gICAgICAgIC8vXG4gICAgICAgIGNvbnN0ICRwcm94aWZ5ID0gKFskY29kZV0sIHskdW50eXBlZH0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRkaWN0aW9uYXJ5LiR0ZW1wKCRnZXR0ZXIoJHVudHlwZWQpLCB7XG4gICAgICAgICAgICAgICAgW1wiJm9yaWdpblwiXTogJGNvZGU/LltcIiZwcm94eVwiXSwgXG4gICAgICAgICAgICAgICAgW1wiJnJvb3RcIl06ICgkY29kZT8uW1wiJnJvb3RcIl0gPz8gJGNvZGU/LltcIiZvcmlnaW5cIl0pLFxuICAgICAgICAgICAgICAgIFtcIiZwZXJzaXN0ZW50XCJdOiAkY29kZT8uW1wiJnBlcnNpc3RlbnRcIl1cbiAgICAgICAgICAgIH0sICR1bnR5cGVkKT8uW1wiJmNvZGVcIl07XG4gICAgICAgIH07XG5cbiAgICAgICAgLy9cbiAgICAgICAgdGhpcy4kZW5jb2RpbmdSdWxlcyA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIFtcImFycmF5XCIsIChbXywgJHNoYXJlZF0sIHskdW50eXBlZH0pID0+IHsgcmV0dXJuICR1bnR5cGVkLm1hcCgoZSkgPT4gdGhpcy5lbmNvZGVNZW1iZXIoZSwgJHNoYXJlZCkpOyB9XSxcbiAgICAgICAgICAgIFtcIndvcmtlclwiLCAkcHJveGlmeV0sXG4gICAgICAgICAgICBbXCJzb2NrZXRcIiwgJHByb3hpZnldLFxuICAgICAgICAgICAgW1wiY2xhc3NcIiwgJHByb3hpZnldLFxuICAgICAgICAgICAgW1wicHJveHlcIiwgJHByb3hpZnldLFxuXG4gICAgICAgICAgICAvLyBpLmUuIHRyYW5zZmVyIHBvbGljeSAoZXhjZXB0IHNoYXJlZClcbiAgICAgICAgICAgIFtcInNoYXJlZFwiLCAoW18sICRzaGFyZWRdLCB7JHdyYXB9KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgJGRhdGEgPSAkd3JhcD8uW1wiJmRhdGFcIl07XG4gICAgICAgICAgICAgICAgY29uc3QgJGluZGV4ID0gJGRhdGEgPyAoJHNoYXJlZD8ubGVuZ3RoID8/IC0xKSA6IC0xO1xuICAgICAgICAgICAgICAgIGlmICgkZGF0YSkgJHNoYXJlZD8ucHVzaD8uKFxuICAgICAgICAgICAgICAgICAgICAoJGRhdGE/LmJ1ZmZlciAmJiAkZGF0YS5CWVRFU19QRVJfRUxFTUVOVCB8fCAkZGF0YSBpbnN0YW5jZW9mIERhdGFWaWV3KSAmJiAhKCRkYXRhIGluc3RhbmNlb2YgV2ViQXNzZW1ibHkuTWVtb3J5KSA/IFxuICAgICAgICAgICAgICAgICAgICAoJGRhdGE/LmJ1ZmZlciB8fCAkZGF0YSkgOiAkZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgW1wiJnR5cGVvZlwiXTogXCJzaGFyZWRcIiwgXG4gICAgICAgICAgICAgICAgICAgIFtcIiZieXRlT2Zmc2V0XCJdOiAkZGF0YT8uYnl0ZU9mZnNldCB8fCAwLCBcbiAgICAgICAgICAgICAgICAgICAgW1wiJmJ5dGVMZW5ndGhcIl06ICRkYXRhPy5ieXRlTGVuZ3RoIHx8IDAsIFxuICAgICAgICAgICAgICAgICAgICBbXCImaW5kZXhcIl06ICRpbmRleCwgXG4gICAgICAgICAgICAgICAgICAgIFtcIiZ0eXBlXCJdOiB0aGlzLiRkZXRlY3Rvci4kdHlwZWRhcnJheSgkZGF0YSlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfV0sXG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICBbXCJ0cmFuc2ZlclwiLCAoW18sICRzaGFyZWRdLCB7JHdyYXAsICRyZWNlaXZlcn0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy4kZGljdGlvbmFyeS4kdGVtcChhc3luYyBkbyB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRkYXRhID0gYXdhaXQgJHdyYXA/LltcIiZkYXRhXCJdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCAkaW5kZXggPSAkZGF0YSA/ICgkc2hhcmVkPy5sZW5ndGggPz8gLTEpIDogLTE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0ICRyYXcgPSAoJGRhdGE/LmJ1ZmZlciAmJiAkZGF0YS5CWVRFU19QRVJfRUxFTUVOVCB8fCAkZGF0YSBpbnN0YW5jZW9mIERhdGFWaWV3KSAmJiAhKCRkYXRhIGluc3RhbmNlb2YgV2ViQXNzZW1ibHkuTWVtb3J5KSA/ICgkZGF0YT8uYnVmZmVyIHx8ICRkYXRhKSA6ICRkYXRhO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNldCBhbiBSZWFkYmFja1JlZmxlY3Rpb24gcHJveHkgb2JqZWN0IGFyb3VuZCBpZGVudGlmaWVyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkcmVjZWl2ZXIgJiYgdGhpcy4kZGV0ZWN0b3IuJGRyb3BTaGFyZWQoJHJhdykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR3cmFwW1wiJmRhdGFcIl0gPSAkcmVjZWl2ZXI/LiR0cmFuc2Zlcj8uKFskcmF3XSwgJHNoYXJlZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBqdXN0IGFkZCB0byB0cmFuc2ZlciBsaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHJhdykgJHNoYXJlZD8ucHVzaD8uKCRyYXcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBbXCImaXNDb2RlXCJdOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiJm1ldGFcIl06ICR3cmFwPy5bXCImbWV0YVwiXSwgXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCImdHlwZW9mXCJdOiBcInRyYW5zZmVyXCIsIFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiJmJ5dGVPZmZzZXRcIl06ICggJGRhdGEuYnl0ZU9mZnNldCkgfHwgMCwgXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCImYnl0ZUxlbmd0aFwiXTogKCAkZGF0YS5ieXRlTGVuZ3RoKSB8fCAwLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIiZpbmRleFwiXTogKGF3YWl0ICR3cmFwPy5bXCImZGF0YVwiXT8uW1wiJmluZGV4XCJdKSA/PyAkaW5kZXgsIFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wiJmxvY2FsXCJdOiAoYXdhaXQgJHdyYXA/LltcIiZkYXRhXCJdPy5bXCImbG9jYWxcIl0pLCAvLyB3aWxsIGJlIHVzZWQgZm9yIGZlZWRiYWNrIHJlc29sdmVcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcIiZ0eXBlXCJdOiB0aGlzLiRkZXRlY3Rvci4kdHlwZWRhcnJheSgkZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIFtcIiZ0eXBlb2ZcIl06IFwiYWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgIFtcIiZvcmlnaW5cIl06ICRjb2RlPy5bXCImcHJveHlcIl0sIFxuICAgICAgICAgICAgICAgICAgICBbXCImcm9vdFwiXTogKCRjb2RlPy5bXCImcm9vdFwiXSA/PyAkY29kZT8uW1wiJm9yaWdpblwiXSksXG4gICAgICAgICAgICAgICAgICAgIFtcIiZwZXJzaXN0ZW50XCJdOiAkY29kZT8uW1wiJnBlcnNpc3RlbnRcIl1cbiAgICAgICAgICAgICAgICB9KT8uW1wiJmNvZGVcIl07XG4gICAgICAgICAgICB9XVxuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgW1wicHJvbWlzZVwiLCAoWyRjb2RlLCAkc2hhcmVkXSwgeyR1bnR5cGVkfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLiRkaWN0aW9uYXJ5LiR0ZW1wKCRnZXR0ZXIoJHVudHlwZWQpLCB7XG4gICAgICAgICAgICAgICAgICAgIFtcIiZ0eXBlb2ZcIl06IFwiYWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgIFtcIiZvcmlnaW5cIl06ICRjb2RlPy5bXCImcHJveHlcIl0sIFxuICAgICAgICAgICAgICAgICAgICBbXCImcm9vdFwiXTogKCRjb2RlPy5bXCImcm9vdFwiXSA/PyAkY29kZT8uW1wiJm9yaWdpblwiXSksXG4gICAgICAgICAgICAgICAgICAgIFtcIiZwZXJzaXN0ZW50XCJdOiAkY29kZT8uW1wiJnBlcnNpc3RlbnRcIl1cbiAgICAgICAgICAgICAgICB9LCAkdW50eXBlZCk/LltcIiZjb2RlXCJdO1xuICAgICAgICAgICAgfV0sXG5cbiAgICAgICAgICAgIC8vIGkuZS4gY29weSBwb2xpY3lcbiAgICAgICAgICAgIFtcInR5cGVkYXJyYXlcIiwgKFtfXSwgeyR3cmFwfSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiAoICR3cmFwPy5bXCImZGF0YVwiXSk7XG4gICAgICAgICAgICB9XSxcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIFtcIm9iamVjdFwiLCAoW18sICRzaGFyZWRdLCB7JHVudHlwZWR9KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcygkdW50eXBlZCkubWFwKCAocGFpcikgPT4geyByZXR1cm4gW3BhaXJbMF0sIHRoaXMuZW5jb2RlTWVtYmVyKHBhaXJbMV0sICRzaGFyZWQpXTsgfSkpO1xuICAgICAgICAgICAgfV0sXG4gICAgICAgIF0pO1xuXG4gICAgICAgIC8vXG4gICAgICAgIHRoaXMuJGRlY29kaW5nUnVsZXMgPSBuZXcgTWFwKFtcbiAgICAgICAgICAgIFtcInRyYW5zZmVyXCIsIChbY29kZWQsIHNoYXJlZF0sIHskc2VuZGVyfSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0ICRidWZmZXIgPSBzaGFyZWQ/Lltjb2RlZFtcIiZpbmRleFwiXV07XG4gICAgICAgICAgICAgICAgY29uc3QgJGluc3RhbmNlID0gdGhpcy4kZGV0ZWN0b3IuJHR5cGV3cmFwKGNvZGVkW1wiJnR5cGVcIl0sICRidWZmZXI/LmJ1ZmZlciB8fCAkYnVmZmVyLCBjb2RlZFtcIiZieXRlT2Zmc2V0XCJdICsgKCRidWZmZXI/LmJ5dGVPZmZzZXR8fDApLCBjb2RlZFtcIiZieXRlTGVuZ3RoXCJdfHwwLCBjb2RlZD8uW1wiJm1ldGFcIl0pO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VuZCBpZGVudGlmaWVyIG9mIHRyYW5zZmVycmVkIG9iamVjdFxuICAgICAgICAgICAgICAgICRzZW5kZXI/LiRmZWVkYmFjaz8uKGNvZGVkLCAkaW5zdGFuY2UpOyAvLyB3aWxsIGJlIHN0b3JlZCBpbiAkdGVtcCBkaXJlY3Rpb25hcnkgZm9yIGFjY2Vzc1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5zdGFuY2U7XG4gICAgICAgICAgICB9XSxcblxuICAgICAgICAgICAgW1wic2hhcmVkXCIsIChbY29kZWQsIHNoYXJlZF0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCAkYnVmZmVyID0gc2hhcmVkPy5bY29kZWRbXCImaW5kZXhcIl1dO1xuICAgICAgICAgICAgICAgIGlmICghY29kZWRbXCImdHlwZVwiXSB8fCBjb2RlZFtcIiZ0eXBlXCJdID09IFwiJHVua1wiKSByZXR1cm4gJGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy4kZGV0ZWN0b3IuJHR5cGV3cmFwKGNvZGVkW1wiJnR5cGVcIl0sICRidWZmZXI/LmJ1ZmZlciB8fCAkYnVmZmVyLCBjb2RlZFtcIiZieXRlT2Zmc2V0XCJdICsgKCRidWZmZXI/LmJ5dGVPZmZzZXR8fDApLCBjb2RlZFtcIiZieXRlTGVuZ3RoXCJdfHwwKTtcbiAgICAgICAgICAgIH1dLFxuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgW1wiY2xhc3NcIiwgKFtfXSkgPT4geyB0aHJvdyBFcnJvcihcIkN1cnJlbnRseSwgY2xhc3MgY2FuJ3QgdG8gYmUgYSBkZWNvZGFibGUhXCIpOyB9XSxcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIFtcImFjY2Vzc1wiLCBhc3luYyAoW2NvZGVkLCBzaGFyZWRdKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gd2hlbiBhc3luYyBtb2RlLCBhY2Nlc3Mgc2hvdWxkIHRvIGJlIGFsc28gZGVjb2RlZFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJveHkod3JhcEZ1bmMoe1xuICAgICAgICAgICAgICAgICAgICBbXCImY29kZVwiXTogeyBbXCImdHlwZW9mXCJdOiBcInByb21pc2VcIiB9LFxuICAgICAgICAgICAgICAgICAgICBbXCImZGF0YVwiXTogbmV3IFByb3h5KGNvZGVkLCBuZXcgQWNjZXNzUmVmbGVjdGlvbihSZWZsZWN0LCB0aGlzLiRoYW5kbGVyKSkudGhlbigoJCk9PntcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRlY29kZU1lbWJlcigkLCBzaGFyZWQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLCB0aGlzLiRoYW5kbGVyLiRwcm9taXNlUmVmbGVjdGlvbik7XG4gICAgICAgICAgICB9XSxcblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIFtcInByb3h5XCIsIChbY29kZWRdKSA9PiB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhjb2RlZD8uW1wiJm9yaWdpblwiXSwgY29kZWQ/LltcIiZwcm94eVwiXSk7XG4gICAgICAgICAgICAgICAgLy8gYXNrIGFzIGJ5IHByb3h5LCBhbHNvIGJ5IG9yaWdpblxuICAgICAgICAgICAgICAgIC8vIChub3RlOiB5b3UgbXVzdCBtZWFuLCB0aGF0IGBvcmlnaW5gIG1lYW5zIG9yaWdpbmFsIG9iaiBkaXJlY3RseSwgd2hpbGUgYHByb3h5YCBtYXkgYmUgYSBjaGFpbiBvZiBwcm94eSlcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNPcmlnaW4gPSBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGljdGlvbmFyeS4kZ2V0KGNvZGVkPy5bXCImcm9vdFwiXSwgY29kZWQ/LltcIiZwZXJzaXN0ZW50XCJdKSA/PyBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGljdGlvbmFyeS4kZ2V0KGNvZGVkPy5bXCImb3JpZ2luXCJdLCBjb2RlZD8uW1wiJnBlcnNpc3RlbnRcIl0pID8/IFxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRkaWN0aW9uYXJ5LiRnZXQoY29kZWQ/LltcIiZwcm94eVwiXSwgY29kZWQ/LltcIiZwZXJzaXN0ZW50XCJdKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzT3JpZ2luKSByZXR1cm4gaGFzT3JpZ2luO1xuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb3h5KHdyYXBGdW5jKHtcbiAgICAgICAgICAgICAgICAgICAgW1wiJmRhdGFcIl06IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIFtcIiZjb2RlXCJdOiBjb2RlZFxuICAgICAgICAgICAgICAgIH0pLCB0aGlzLiRyZXF1ZXN0UmVmbGVjdCk7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFtcImFycmF5XCIsIChbY29kZWQsIHNoYXJlZF0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNvZGVkW1wiJmRhdGFcIl0gPz8gY29kZWQpLm1hcCgobSkgPT4gdGhpcy5kZWNvZGVNZW1iZXIobSwgc2hhcmVkKSk7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFtcIm9iamVjdFwiLCAoW2NvZGVkLCBzaGFyZWRdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgX2VudHJpZXNfID0gT2JqZWN0LmVudHJpZXMoY29kZWRbXCImZGF0YVwiXSA/PyBjb2RlZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhfZW50cmllc18ubWFwKChwYWlyKSA9PiB7IHJldHVybiBbcGFpclswXSwgdGhpcy5kZWNvZGVNZW1iZXIocGFpclsxXSwgc2hhcmVkKV07IH0pKTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgW1widHlwZWRhcnJheVwiLCAoW2NvZGVkXSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2RlZD8uW1wiJmRhdGFcIl0gPz8gY29kZWQ7XG4gICAgICAgICAgICB9XVxuICAgICAgICBdKTtcblxuICAgICAgICAvLyBUT0RPPyBQbGFubmVkIHRvIHVzZSB3aGVuIHdvcmtpbmcgYW5kIHJldHVybiB0byBjbGllbnQgc3RhZ2UuLi5cbiAgICAgICAgdGhpcy4kdHJhbnNjb2RpbmdSdWxlcyA9IG5ldyBNYXAoW10pO1xuICAgIH1cblxuICAgIC8vIGFsbW9zdCBmdWxsIHN1cHBvcnQgcGxhbm5lZCBvbiB2Mi4zXG4gICAgd2FpdFJlc3BvbnNlU3luYygkYnVmZmVyID0gbnVsbCwgJHRpbWVvdXQgPSAxMDAwKSB7XG4gICAgICAgIGNvbnN0IGJ0aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGNvbnN0IHUzMmEgPSBuZXcgVWludDMyQXJyYXkoJGJ1ZmZlciwgMCwgMSk7XG4gICAgICAgIHdoaWxlIChBdG9taWNzLmxvYWQodTMyYSwgMCkgPD0gMCkge1xuICAgICAgICAgICAgaWYgKChwZXJmb3JtYW5jZS5ub3coKSAtIGJ0aW1lKSA+PSAkdGltZW91dCkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZGVjb2RlTWVzc2FnZShbbmV3IFVpbnQ4QXJyYXkoJGJ1ZmZlciwgOCwgQXRvbWljcy5sb2FkKHUzMmEsIDApKSwgJGJ1ZmZlcl0sIFtdKTtcbiAgICB9XG5cbiAgICAvL1xuICAgIGRlY29kZU1lc3NhZ2UoWyRtZXNzYWdlLCAkYnVmZmVyID0gbnVsbF0sICRzaGFyZWQgPSBbXSkge1xuICAgICAgICBjb25zdCBfdW53cmFwXyA9ICh0aGlzLiRkZWNvZGUgfHwgKChlKSA9PiB7IHJldHVybiAodGhpcy4kbXNncGNrKT8uZGVjb2RlKGUsIHt1c2VCaWdJbnQ2NDogdHJ1ZX0pOyB9KSk/LigkbWVzc2FnZSk7XG4gICAgICAgIF91bndyYXBfLiRhcmdzID0gKF91bndyYXBfLiRhcmdzPy5tYXA/LigobSkgPT4gdGhpcy5kZWNvZGVNZW1iZXIobSwgJHNoYXJlZCkpID8/IFtdKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhfdW53cmFwXy4kYXJncyk7XG4gICAgICAgIHJldHVybiBbW191bndyYXBfLCAkYnVmZmVyXSwgJHNoYXJlZC5jb25jYXQoWyRidWZmZXJdKV07XG4gICAgfVxuXG4gICAgLy9cbiAgICBlbmNvZGVNZXNzYWdlKFskZGF0YSwgJGJ1ZmZlciA9IG51bGwsICRyZWNlaXZlID0gZmFsc2VdLCAkc2hhcmVkID0gW10pIHtcbiAgICAgICAgJGJ1ZmZlciA/Pz0gdHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyICE9IFwidW5kZWZpbmVkXCIgPyBuZXcgU2hhcmVkQXJyYXlCdWZmZXIoNDA5Nis4LCB7XG4gICAgICAgICAgICBtYXhCeXRlTGVuZ3RoOiA2NTUzNis4XG4gICAgICAgIH0pIDogbmV3IEFycmF5QnVmZmVyKDQwOTYrOCwge1xuICAgICAgICAgICAgbWF4Qnl0ZUxlbmd0aDogNjU1MzYrOFxuICAgICAgICB9KTtcblxuICAgICAgICAkZGF0YS4kd29ya2VyID0gKHR5cGVvZiAkZGF0YS4kd29ya2VyID09IFwic3RyaW5nXCIgPyAkZGF0YS4kd29ya2VyIDogdW5kZWZpbmVkKTsgLy8gdW5zdXBwb3J0ZWQuLi5cbiAgICAgICAgJGRhdGEuJGFyZ3MgPSAoKCRkYXRhLiRhcmdzPy5tYXA/LigoZSkgPT4gdGhpcy5lbmNvZGVNZW1iZXIoZSwgJHNoYXJlZCkpID8/IFtdKSk7XG4gICAgICAgIGNvbnN0IF93cmFwXyA9ICh0aGlzLiRlbmNvZGUgfHwgKChlKSA9PiB7IHJldHVybiAodGhpcy4kbXNncGNrKT8uZW5jb2RlKGUsIHt1c2VCaWdJbnQ2NDogdHJ1ZX0pOyB9KSk/LigkZGF0YSk7XG5cbiAgICAgICAgLy9cbiAgICAgICAgaWYgKCRyZWNlaXZlKSB7IC8vIHdoZW4gcmVjZWl2ZWQgYnkgcmVtb3RlLCBuZWVkIHRvIGNvcHkgYnVmZmVyXG4gICAgICAgICAgICBpZiAoKCRidWZmZXIuYnl0ZUxlbmd0aC04KSA8IF93cmFwXy5ieXRlTGVuZ3RoKSAkYnVmZmVyLmdyb3coX3dyYXBfLmJ5dGVMZW5ndGgrOCk7XG4gICAgICAgICAgICBjb25zdCBfY29weV8gPSBuZXcgVWludDhBcnJheSgkYnVmZmVyLCA4LCBfd3JhcF8uYnl0ZUxlbmd0aCk7IF9jb3B5Xy5zZXQoX3dyYXBfKTtcbiAgICAgICAgICAgIGNvbnN0IF9sZW5fID0gbmV3IFVpbnQzMkFycmF5KCRidWZmZXIsIDAsIDEpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBBdG9taWNzICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBBdG9taWNzLnN0b3JlKF9sZW5fLCAwLCBfd3JhcF8uYnl0ZUxlbmd0aCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9sZW5fWzBdID0gX3dyYXBfLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW1tfY29weV8sICRidWZmZXJdLCAkc2hhcmVkLmNvbmNhdChbX2NvcHlfLmJ1ZmZlciwgJGJ1ZmZlcl0pXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IF9jb3B5XyA9IG5ldyBVaW50OEFycmF5KF93cmFwXyk7XG4gICAgICAgICAgICByZXR1cm4gW1tfY29weV8sICRidWZmZXJdLCAkc2hhcmVkLmNvbmNhdChbX2NvcHlfLmJ1ZmZlciwgJGJ1ZmZlcl0pXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8hIE5lZWRzIGNsaWVudC1zaWRlIGVycm9yIGhhbmRsaW5nLi4uXG4gICAgZGVjb2RlRXJyb3IoLi4uXykge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlVuaGFuZGxlZCBpbnRlcm5hbCBlcnJvci4uLlwiKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPISBOZWVkcyBjbGllbnQtc2lkZSBlcnJvciBoYW5kbGluZy4uLlxuICAgIGVuY29kZUVycm9yKFskZGF0YSwgJGJ1ZmZlcl0sICRzaGFyZWQgPSBbXSkge1xuICAgICAgICBkZWxldGUgJGRhdGE/LiRhcmdzO1xuICAgICAgICBkZWxldGUgJGRhdGE/LltcIiZkYXRhXCJdO1xuICAgICAgICBjb25zdCBfd3JhcF8gPSAodGhpcy4kZW5jb2RlIHx8ICgoZSkgPT4geyByZXR1cm4gKHRoaXMuJG1zZ3Bjayk/LmVuY29kZShlLCB7dXNlQmlnSW50NjQ6IHRydWV9KTsgfSkpPy4oJGRhdGEpO1xuICAgICAgICByZXR1cm4gW1tfd3JhcF8sICRidWZmZXJdLCAkc2hhcmVkLmNvbmNhdChbX3dyYXBfLmJ1ZmZlciwgJGJ1ZmZlcl0pXTtcbiAgICB9XG5cbiAgICAvL1xuICAgIGRlY29kZU1lbWJlcihjb2RlZCwgc2hhcmVkID0gW10pIHtcbiAgICAgICAgLy8gaWYgaXMgbnVsbCwgcHJlZmVyIGRvbid0IGRlY29kZS4uLlxuICAgICAgICBpZiAoIWNvZGVkIHx8IFtcIm9iamVjdFwiLCBcImZ1bmN0aW9uXCJdLmluZGV4T2YodHlwZW9mIGNvZGVkKSA8IDApIHJldHVybiBjb2RlZDtcbiAgICAgICAgaWYgKCFjb2RlZD8uW1wiJnR5cGVvZlwiXSkgY29kZWQgPSBuZXcgQXV0b0RldGVjdG9yKGNvZGVkKVtcIiZjb2RlXCJdO1xuICAgICAgICByZXR1cm4gKHRoaXMuJGRlY29kaW5nUnVsZXMuZ2V0KGNvZGVkPy5bXCImdHlwZW9mXCJdKT8uKFtjb2RlZCwgc2hhcmVkXSkgPz8gKGNvZGVkPy5bXCImZGF0YVwiXSkgPz8gY29kZWQpO1xuICAgIH1cblxuICAgIC8vIFxuICAgIGVuY29kZU1lbWJlcigkd3JhcCwgJHNoYXJlZCA9IFtdKSB7XG4gICAgICAgIGlmIChbXCJvYmplY3RcIiwgXCJmdW5jdGlvblwiXS5pbmRleE9mKHR5cGVvZiAkd3JhcCkgPCAwKSByZXR1cm4gJHdyYXA7IFxuXG4gICAgICAgIC8vXG4gICAgICAgIGNvbnN0ICR1bnR5cGVkID0gJHdyYXA7XG4gICAgICAgIGxldCAkdHlwZW9mID0gJHdyYXA/LltcIiZ0eXBlb2ZcIl07XG4gICAgICAgIGlmICghJHR5cGVvZikge1xuICAgICAgICAgICAgJHdyYXAgPSBuZXcgQXV0b0RldGVjdG9yKCR3cmFwKTtcbiAgICAgICAgICAgICR0eXBlb2YgPSAkd3JhcD8uW1wiJnR5cGVvZlwiXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vXG4gICAgICAgIHJldHVybiB0aGlzLiRlbmNvZGluZ1J1bGVzLmdldCgkdHlwZW9mKT8uKFskd3JhcFtcIiZjb2RlXCJdLCAkc2hhcmVkXSwgeyR3cmFwLCAkdW50eXBlZH0pID8/ICR3cmFwPy5bXCImZGF0YVwiXTtcbiAgICB9XG59O1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLFk7O0FBRUE7QUFDQSxPQUFPQSxZQUFZO0FBQ25CLE9BQU9DLGtCQUFrQjtBQUN6QixPQUFPQyxXQUFXLElBQUlDLE9BQU87O0FBRTdCO0FBQ0EsU0FBU0MsUUFBUSxFQUFFQyxnQkFBZ0I7QUFDbkMsU0FBU0MsS0FBSzs7QUFFZDtBQUNBLGVBQWUsTUFBTUMsa0JBQWtCLFNBQVNOLGtCQUFrQixDQUFDO0VBQy9ETyxTQUFTLEdBQUcsSUFBSTtFQUNoQkMsUUFBUSxHQUFHLElBQUk7RUFDZkMsY0FBYyxHQUFHLElBQUk7RUFDckJDLGNBQWMsR0FBRyxJQUFJOztFQUVyQjtFQUNBQyxXQUFXQSxDQUFDQyxJQUFJLEVBQUU7SUFDZCxLQUFLLENBQUNBLElBQUksQ0FBQzs7SUFFWDtJQUNBLElBQUksQ0FBQ0wsU0FBUyxHQUFHLElBQUk7O0lBRXJCO0lBQ0EsTUFBTUMsUUFBUSxHQUFHQSxDQUFDLENB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
