import IW from "src/index.mjs";
import {main} from "../worker/main.mjs"

//import { Worker, isMainThread, parentPort, workerData, } from 'node:worker_threads'

const $R = location?.href ?? Deno?.cwd?.();

const importMap = {
    "imports": {
        ".":`${$R}.`,
        "cbor-x/": `${$R}cbor-x/`,
        "cbor-x": `${$R}cbor-x/index.js`,
        "@petamoriken/": `${$R}@petamoriken/`,
        "@petamoriken/float16": `${$R}@petamoriken/float16/browser/float16.mjs`,
        "src/": `${$R}src/`,
        "test/": `${$R}test/`,
        "deps/": `${$R}deps/`,
        "BTyped2/": `${$R}BTyped2/`
    }
}

// get worker internal library
const worker = new Worker(IW.WrapWorkerURL(new URL("../worker/worker.mjs", import.meta.url).href, importMap), {
    type: "module", 
    deno: { permissions: "inherit" },
    importMap: import.meta.importMap
});

//
main(worker);
