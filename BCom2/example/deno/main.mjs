import IW from "src/index.mjs";
import {main} from "../worker/main.mjs"

// get worker internal library
const worker = new Worker(IW.WrapWorkerURL(new URL("../worker/worker.mjs", import.meta.url).href), {
    type: "module", 
    deno: { permissions: "inherit" },
    importMap: import.meta.importMap
});

//
main(worker);
