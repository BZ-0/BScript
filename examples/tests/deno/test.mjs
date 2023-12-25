// url_test.ts
import { assertEquals, assert } from "https://deno.land/std/assert/mod.ts";
import IW from "src/index.mjs";

// get worker internal library
const worker = new Worker(IW.WrapWorkerURL(new URL("./worker.mjs", import.meta.url).href), {type: "module", deno: { permissions: "inherit" }});
const _module_ = IW.WrapWorker(worker, {  });

//
const TestClass = _module_.test;
const std = _module_.std;
const access = new TestClass();

//
Deno.test({
    name: "Worker Test",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: async (t) => {

        //
        assert(await t.step({
            name: "Typed Array transfer test", 
            fn: async () => {
                const $val = (await std.transfer(access["reassign:proxy"]))[0];
                assertEquals($val, 7);
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));

        // re-assign class members (internal)
        assert(await t.step({
            name: "Typed Array assign test", 
            fn: async () => {
                await (access.reassign = access.copying);
                const $val = (await access.reassign)[0];
                assertEquals($val, 6);
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));

        // really internal assign of classes
        assert(await t.step({
            name: "String assign test", 
            fn: async () => {
                await (access.husband = access.brother);
                const $val = await access.husband.role;
                assertEquals($val, "brother");
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));

        //
        assert(await t.step({
            name: "Function proxy test", 
            fn: async () => {
                await (access.callback = (word)=>{ console.log("Hello " + word); });
                const $val = await access.recall("World!");
                assertEquals($val, "exactly");
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));

        //
        assert(await t.step({
            name: "TypedArrays transfer back test", 
            fn: async () => {
                // (should return array with 5)
                const $val = (await (access.transfer))[0];
                assertEquals($val, 5);
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));

        // 
        /*assert(await t.step({
            name: "SharedArrayBuffer test", 
            fn: async () => {
                assertEquals(typeof SharedArrayBuffer, "function");
                const sharedArrayBuffer = new SharedArrayBuffer(16);
                const sharedArray = new Uint32Array(sharedArrayBuffer);
                await access.change(sharedArrayBuffer);
                assertEquals(sharedArray[0], 5);
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));*/

        // only if has support...
        if (typeof ShadowRealm != "undefined") {
            assert(await t.step({
                name: "ShadowRealm test", 
                fn: async () => {
                    const shadow = await new std.ShadowRealm();
                    const func = shadow.evaluate(`(a, b, buf)=>{
                        console.log(buf);
                        return a + b;
                    }`);

                    const $val = await func(1,2);
                    if ($val != 3) { throw new Error("Expected 3, got " + $val); } else { console.log("OK"); }
                    return true;
                },
                sanitizeResources: false,
                sanitizeOps: false,
            }));
        }

        // 
        assert(await t.step({
            name: "Sync copy test", 
            fn: async () => {
                const $val = (await access["copying*"])[0];
                assertEquals($val, 6);
            },
            sanitizeResources: false,
            sanitizeOps: false,
        }));
    }
});
