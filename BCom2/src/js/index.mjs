// @ts-nocheck
"use strict"

//
export * from "./Library/Symbols.mjs"

//
import AutoDetector from "./Reflection/AutoDetector.mjs"
import MessageCoder from "./MessageCoder/MessageCoderWorker.mjs"
import ReferenceDictionary from "./Protocol/ReferenceDictionary.mjs"
import MessageHandler from "./Protocol/MessageHandler.mjs"

//
import ResponseReceiver from "./Response/Receiver.mjs"
import ResponseTransmitter from "./Response/Transmitter.mjs"

//
import { DirectReflection, IndirectReflection } from "./Reflection/DirectReflection.mjs"

//
import WorkerHandler, { WrapWorker } from "./Handlers/WorkerHandler.mjs"
import SocketHandler, { WrapSocket } from "./Handlers/SocketHandler.mjs"
import STD from "./Library/Standard.mjs"

// auto-register from worker
export const InitializeInstance = (options) => {
    if (options.self) {
        // node-JS custom
        IW.Instance ??= WrapWorker(options.self, options)
    } else if (typeof self != "undefined" && ((typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) || !!self.Bun || !!self.Deno)) {
        IW.Instance ??= WrapWorker(self, options)
    }
    return IW.Instance
}

/**
 *
 * @param {string} aURL a string representing the URL of the module script the worker will execute.
 * @returns {string} The string representing the URL of the script the worker will execute.
 */

// FOR DEVELOPMENT ONLY
const IWLib = "src/js/index.mjs"
const WrapWorkerURL = (aURL, importMap = null, options = "{}") => {
    // baseURL, esModuleShimsURL are considered to be known in advance
    // esModuleShimsURL - must point to the non-CSP build of ES Module Shims,
    // namely the `es-module-shim.wasm.js` output: es-module-shims/dist/es-module-shims.wasm.js
    if (!importMap || typeof Deno != "undefined") {
        return URL.createObjectURL(
            new Blob(
                [
                    `import IW from "${IWLib}"
            import * as _module_ from '${aURL}';
            Object.assign(IW.InitializeInstance(${options}), _module_);`
                ],
                { type: "application/javascript" }
            )
        )
    } else {
        const esModuleShimsURL = "https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js"
        return URL.createObjectURL(
            new Blob(
                [
                    `//importScripts('${esModuleShimsURL}'); // classic
            import * as _shim_ from '${esModuleShimsURL}'; // module
            importShim.addImportMap(${JSON.stringify(importMap)});
            const _module_ = importShim('${aURL}');
            await importShim("${IWLib}").then(async (IW) => {
                Object.assign(IW.InitializeInstance(${options}), await _module_);
            })`
                ],
                { type: "application/javascript" }
            )
        )
    }
}

//
export default class IW {
    /**
     * Worker wrapper class instance
     */
    static WHandle = WorkerHandler
    static WrapWorker = WrapWorker

    static SHandle = SocketHandler
    static WrapSocket = WrapSocket
    static WrapWorkerURL = WrapWorkerURL

    //static Instance = null;

    /**
     * For modding purpose...
     */
    static Component = {
        WorkerHandler,
        ReferenceDictionary,
        DirectReflection,
        IndirectReflection,
        AutoDetector,
        MessageHandler,
        MessageCoder,
        ResponseReceiver,
        ResponseTransmitter
    }

    //
    static proxy = STD.proxy
    static classed = STD.classed
    static shared = STD.shared
    static transfer = STD.transfer

    //
    static InitializeInstance = InitializeInstance
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJBdXRvRGV0ZWN0b3IiLCJNZXNzYWdlQ29kZXIiLCJSZWZlcmVuY2VEaWN0aW9uYXJ5IiwiTWVzc2FnZUhhbmRsZXIiLCJSZXNwb25zZVJlY2VpdmVyIiwiUmVzcG9uc2VUcmFuc21pdHRlciIsIkRpcmVjdFJlZmxlY3Rpb24iLCJJbmRpcmVjdFJlZmxlY3Rpb24iLCJXb3JrZXJIYW5kbGVyIiwiV3JhcFdvcmtlciIsIlNvY2tldEhhbmRsZXIiLCJXcmFwU29ja2V0IiwiU1REIiwiSW5pdGlhbGl6ZUluc3RhbmNlIiwib3B0aW9ucyIsInNlbGYiLCJJVyIsIkluc3RhbmNlIiwiV29ya2VyR2xvYmFsU2NvcGUiLCJCdW4iLCJEZW5vIiwiSVdMaWIiLCJXcmFwV29ya2VyVVJMIiwiYVVSTCIsImltcG9ydE1hcCIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJ0eXBlIiwiZXNNb2R1bGVTaGltc1VSTCIsIkpTT04iLCJzdHJpbmdpZnkiLCJXSGFuZGxlIiwiU0hhbmRsZSIsIkNvbXBvbmVudCIsInByb3h5IiwiY2xhc3NlZCIsInNoYXJlZCIsInRyYW5zZmVyIl0sInNvdXJjZXMiOlsiQzpcXFByb2plY3RzXFxCWjBcXEJDb20yXFxzcmNcXGNpdmV0XFxpbmRleC5jaXZldCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtbm9jaGVja1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vXG5leHBvcnQgKiBmcm9tIFwiLi9MaWJyYXJ5L1N5bWJvbHNcIjtcblxuLy9cbmltcG9ydCBBdXRvRGV0ZWN0b3IgZnJvbSBcIi4vUmVmbGVjdGlvbi9BdXRvRGV0ZWN0b3JcIjtcbmltcG9ydCBNZXNzYWdlQ29kZXIgZnJvbSBcIi4vTWVzc2FnZUNvZGVyL01lc3NhZ2VDb2RlcldvcmtlclwiO1xuaW1wb3J0IFJlZmVyZW5jZURpY3Rpb25hcnkgZnJvbSBcIi4vUHJvdG9jb2wvUmVmZXJlbmNlRGljdGlvbmFyeVwiO1xuaW1wb3J0IE1lc3NhZ2VIYW5kbGVyIGZyb20gXCIuL1Byb3RvY29sL01lc3NhZ2VIYW5kbGVyXCI7XG5cbi8vXG5pbXBvcnQgUmVzcG9uc2VSZWNlaXZlciBmcm9tIFwiLi9SZXNwb25zZS9SZWNlaXZlclwiO1xuaW1wb3J0IFJlc3BvbnNlVHJhbnNtaXR0ZXIgZnJvbSBcIi4vUmVzcG9uc2UvVHJhbnNtaXR0ZXJcIjtcblxuLy9cbmltcG9ydCB7IERpcmVjdFJlZmxlY3Rpb24sIEluZGlyZWN0UmVmbGVjdGlvbiB9IGZyb20gXCIuL1JlZmxlY3Rpb24vRGlyZWN0UmVmbGVjdGlvblwiO1xuXG4vL1xuaW1wb3J0IFdvcmtlckhhbmRsZXIsIHsgV3JhcFdvcmtlciB9IGZyb20gXCIuL0hhbmRsZXJzL1dvcmtlckhhbmRsZXJcIjtcbmltcG9ydCBTb2NrZXRIYW5kbGVyLCB7IFdyYXBTb2NrZXQgfSBmcm9tIFwiLi9IYW5kbGVycy9Tb2NrZXRIYW5kbGVyXCI7XG5pbXBvcnQgU1REIGZyb20gXCIuL0xpYnJhcnkvU3RhbmRhcmRcIjtcblxuLy8gYXV0by1yZWdpc3RlciBmcm9tIHdvcmtlclxuZXhwb3J0IGNvbnN0IEluaXRpYWxpemVJbnN0YW5jZSA9IChvcHRpb25zKSA9PiB7XG4gICAgaWYgKG9wdGlvbnMuc2VsZikgeyAvLyBub2RlLUpTIGN1c3RvbVxuICAgICAgICBJVy5JbnN0YW5jZSA/Pz0gV3JhcFdvcmtlcihvcHRpb25zLnNlbGYsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT0gXCJ1bmRlZmluZWRcIiAmJiAodHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmIGluc3RhbmNlb2YgV29ya2VyR2xvYmFsU2NvcGUgfHwgISFzZWxmLkJ1biB8fCAhIXNlbGYuRGVubykpIHtcbiAgICAgICAgSVcuSW5zdGFuY2UgPz89IFdyYXBXb3JrZXIoc2VsZiwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBJVy5JbnN0YW5jZTtcbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSB7c3RyaW5nfSBhVVJMIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgVVJMIG9mIHRoZSBtb2R1bGUgc2NyaXB0IHRoZSB3b3JrZXIgd2lsbCBleGVjdXRlLlxuICogQHJldHVybnMge3N0cmluZ30gVGhlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFVSTCBvZiB0aGUgc2NyaXB0IHRoZSB3b3JrZXIgd2lsbCBleGVjdXRlLlxuICovXG5cbi8vIEZPUiBERVZFTE9QTUVOVCBPTkxZXG5jb25zdCBJV0xpYiA9IFwic3JjL2pzL2luZGV4Lm1qc1wiO1xuY29uc3QgV3JhcFdvcmtlclVSTCA9IChhVVJMLCBpbXBvcnRNYXAgPSBudWxsLCBvcHRpb25zID0gXCJ7fVwiKSA9PiB7XG4gICAgLy8gYmFzZVVSTCwgZXNNb2R1bGVTaGltc1VSTCBhcmUgY29uc2lkZXJlZCB0byBiZSBrbm93biBpbiBhZHZhbmNlXG4gICAgLy8gZXNNb2R1bGVTaGltc1VSTCAtIG11c3QgcG9pbnQgdG8gdGhlIG5vbi1DU1AgYnVpbGQgb2YgRVMgTW9kdWxlIFNoaW1zLCBcbiAgICAvLyBuYW1lbHkgdGhlIGBlcy1tb2R1bGUtc2hpbS53YXNtLmpzYCBvdXRwdXQ6IGVzLW1vZHVsZS1zaGltcy9kaXN0L2VzLW1vZHVsZS1zaGltcy53YXNtLmpzXG4gICAgaWYgKCFpbXBvcnRNYXAgfHwgdHlwZW9mIERlbm8gIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbXG4gICAgICAgICAgICBgaW1wb3J0IElXIGZyb20gXCIke0lXTGlifVwiXG4gICAgICAgICAgICBpbXBvcnQgKiBhcyBfbW9kdWxlXyBmcm9tICcke2FVUkx9JztcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oSVcuSW5pdGlhbGl6ZUluc3RhbmNlKCR7b3B0aW9uc30pLCBfbW9kdWxlXyk7YFxuICAgICAgICBdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyB9KSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBlc01vZHVsZVNoaW1zVVJMID0gXCJodHRwczovL2dhLmpzcG0uaW8vbnBtOmVzLW1vZHVsZS1zaGltc0AxLjguMC9kaXN0L2VzLW1vZHVsZS1zaGltcy5qc1wiXG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtcbiAgICAgICAgICAgIGAvL2ltcG9ydFNjcmlwdHMoJyR7ZXNNb2R1bGVTaGltc1VSTH0nKTsgLy8gY2xhc3NpY1xuICAgICAgICAgICAgaW1wb3J0ICogYXMgX3NoaW1fIGZyb20gJyR7ZXNNb2R1bGVTaGltc1VSTH0nOyAvLyBtb2R1bGVcbiAgICAgICAgICAgIGltcG9ydFNoaW0uYWRkSW1wb3J0TWFwKCR7SlNPTi5zdHJpbmdpZnkoaW1wb3J0TWFwKX0pO1xuICAgICAgICAgICAgY29uc3QgX21vZHVsZV8gPSBpbXBvcnRTaGltKCcke2FVUkx9Jyk7XG4gICAgICAgICAgICBhd2FpdCBpbXBvcnRTaGltKFwiJHtJV0xpYn1cIikudGhlbihhc3luYyAoSVcpID0+IHtcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKElXLkluaXRpYWxpemVJbnN0YW5jZSgke29wdGlvbnN9KSwgYXdhaXQgX21vZHVsZV8pO1xuICAgICAgICAgICAgfSlgXG4gICAgICAgIF0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnIH0pKVxuICAgIH1cbn1cblxuLy9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElXIHtcbiAgICAvKipcbiAgICAgKiBXb3JrZXIgd3JhcHBlciBjbGFzcyBpbnN0YW5jZVxuICAgICAqL1xuICAgIHN0YXRpYyBXSGFuZGxlID0gV29ya2VySGFuZGxlcjtcbiAgICBzdGF0aWMgV3JhcFdvcmtlciA9IFdyYXBXb3JrZXI7XG5cbiAgICBzdGF0aWMgU0hhbmRsZSA9IFNvY2tldEhhbmRsZXI7XG4gICAgc3RhdGljIFdyYXBTb2NrZXQgPSBXcmFwU29ja2V0O1xuICAgIHN0YXRpYyBXcmFwV29ya2VyVVJMID0gV3JhcFdvcmtlclVSTDtcblxuICAgIC8vc3RhdGljIEluc3RhbmNlID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEZvciBtb2RkaW5nIHB1cnBvc2UuLi5cbiAgICAgKi9cbiAgICBzdGF0aWMgQ29tcG9uZW50ID0ge1xuICAgICAgICBXb3JrZXJIYW5kbGVyLCBcbiAgICAgICAgUmVmZXJlbmNlRGljdGlvbmFyeSwgXG4gICAgICAgIERpcmVjdFJlZmxlY3Rpb24sIFxuICAgICAgICBJbmRpcmVjdFJlZmxlY3Rpb24sXG4gICAgICAgIEF1dG9EZXRlY3RvciwgXG4gICAgICAgIE1lc3NhZ2VIYW5kbGVyLFxuICAgICAgICBNZXNzYWdlQ29kZXIsXG4gICAgICAgIFJlc3BvbnNlUmVjZWl2ZXIsXG4gICAgICAgIFJlc3BvbnNlVHJhbnNtaXR0ZXJcbiAgICB9O1xuXG4gICAgLy9cbiAgICBzdGF0aWMgcHJveHkgPSBTVEQucHJveHk7XG4gICAgc3RhdGljIGNsYXNzZWQgPSBTVEQuY2xhc3NlZDtcbiAgICBzdGF0aWMgc2hhcmVkID0gU1RELnNoYXJlZDtcbiAgICBzdGF0aWMgdHJhbnNmZXIgPSBTVEQudHJhbnNmZXI7XG5cbiAgICAvL1xuICAgIHN0YXRpYyBJbml0aWFsaXplSW5zdGFuY2UgPSBJbml0aWFsaXplSW5zdGFuY2U7XG59O1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLFk7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLE9BQU9BLFlBQVk7QUFDbkIsT0FBT0MsWUFBWTtBQUNuQixPQUFPQyxtQkFBbUI7QUFDMUIsT0FBT0MsY0FBYzs7QUFFckI7QUFDQSxPQUFPQyxnQkFBZ0I7QUFDdkIsT0FBT0MsbUJBQW1COztBQUUxQjtBQUNBLFNBQVNDLGdCQUFnQixFQUFFQyxrQkFBa0I7O0FBRTdDO0FBQ0EsT0FBT0MsYUFBYSxJQUFJQyxVQUFVO0FBQ2xDLE9BQU9DLGFBQWEsSUFBSUMsVUFBVTtBQUNsQyxPQUFPQyxHQUFHOztBQUVWO0FBQ0EsT0FBTyxNQUFNQyxrQkFBa0IsR0FBR0EsQ0FBQ0Ms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
