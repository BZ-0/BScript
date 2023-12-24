import Module from "./jxl2png.js"
const _module_ = Module({
    print: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.warn(text);
    },
    printErr: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.error(text);
    },
});

//
export const jxl2png = async(bin) => {
    const $mod = await _module_;
    const $ptr = $mod._calloc(1, bin.byteLength);
    const $in = $mod._calloc(1, 8);
    const $out = $mod._calloc(1, 8);

    //
    new Uint8Array($mod.HEAP8.buffer, $ptr, bin.byteLength).set(bin);
    const _in_ = new DataView($mod.HEAP8.buffer, $in, 8);
          _in_.setUint32(0, $ptr, true);
          _in_.setUint32(4, bin.byteLength, true);

    //
    const status = $mod._RecodeJXLtoPNG($in, $out);

    //
    const _out_ = new DataView($mod.HEAP8.buffer, $out, 8);
    const $data = _out_.getUint32(0, true), $size = _out_.getUint32(4, true);
    const _png_ = new Uint8Array(new Uint8Array($mod.HEAP8.buffer, $data, $size));

    // free memory...
    $mod._free($data);
    $mod._free($out);
    $mod._free($ptr);
    $mod._free($in);

    //
    return _png_;
}

//
export const loadJXL = (url) => {
    return fetch(url).then((r)=>{
        return r.arrayBuffer().then((ab)=>{
            return jxl2png(new Uint8Array(ab));
        });
    });
}
