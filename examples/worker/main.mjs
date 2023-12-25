import IW from "src/index.mjs";

//
export const main = async (worker)=>{

    //
    worker.addEventListener("error", (e) => { console.error(e); })

    // TODO! waiting worker imports
    await new Promise((r)=>setTimeout(r, 200));

    //
    const _vk_ = IW.WrapWorker(worker, {  });
    const _module_ = _vk_//["ws"];

    //
    const TestClass = await _module_.test;
    const std = await _module_.std;

    //
    console.log("connected?");

    // needs to await for access to sync wait
    const access = new TestClass();

    // force to sync mode (better in worker itself, useless for websockets)
    console.log(await access["copying*"]);

    // (should return array with 7, useless for websockets bridge)
    console.log(await std.transfer(access["reassign:proxy"]));

    // re-assign class members (internal)
    // don't know why can't to wait an assign
    await (access["reassign"] = access.copying); //await access.reassign;

    // (should return array with 6)
    console.log(await access.reassign);

    // really internal assign of classes
    await (access.husband = access.brother);

    // (should return 'brother')
    console.log(await access.husband.role);

    // example with `apply` proxy type
    await (access.callback = (word)=>{
        console.log("Hello " + word);
    });

    //
    // (should return 'Hello World!' and 'exactly')
    console.log(await access.recall("World!"));

    // test deletement
    delete access.husband;
    delete access.brother;

    //
    const sharedArrayBuffer = new SharedArrayBuffer(16);
    const sharedArray = new Uint32Array(sharedArrayBuffer);

    // set to remote value
    await access.change(sharedArrayBuffer);

    // (should return array with 5)
    console.log(await (access.transfer));

    // get local result
    // (should return '5')
    console.log(sharedArray[0]);

    // only if has support...
    if (typeof ShadowRealm != "undefined") {
        //console.log(await std.ShadowRealm);
        const shadow = await new std.ShadowRealm();
        //console.log(shadow);
        const func = shadow.evaluate(`(a, b, buf)=>{
            console.log(buf);
            return a + b;
        }`);

        // browser can't pass typed arrays or array buffers into shadow-realms...
        console.log(await func(1,2));
    }

}
