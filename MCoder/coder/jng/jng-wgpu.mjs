import * as vec4 from "../esm/vec4.js";
import * as mat4 from "../esm/mat4.js";
import * as vec3 from "../esm/vec3.js";
import * as mat3 from "../esm/mat3.js";

//
const _vertex_ = await (await fetch(new URL("./wgsl/_gdi3_.vert.wgsl", import.meta.url).href)).text();
const _fragment_ = await (await fetch(new URL("./wgsl/_gdi3_.frag.wgsl", import.meta.url).href)).text();

//
const signed_crc_table = () => {
    let c = 0;
    const table = new Array(256);
    for (let n = 0; n != 256; ++n) {
        c = n;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
        table[n] = c;
    }
    return typeof Int32Array !== 'undefined' ? new Int32Array(table) : table;
};

//
const T0 = signed_crc_table();
const slice_by_16_tables = T => {
    let c = 0,
        v = 0,
        n = 0;
    const table = typeof Int32Array !== 'undefined' ? new Int32Array(4096) : new Array(4096);

    //
    for (n = 0; n != 256; ++n) table[n] = T[n];
    for (n = 0; n != 256; ++n) {
        v = T[n];
        for (c = 256 + n; c < 4096; c += 256) v = table[c] = (v >>> 8) ^ T[v & 0xff];
    }

    //
    const out = [];
    for (n = 1; n != 16; ++n) out[n - 1] = typeof Int32Array !== 'undefined' ? table.subarray(n * 256, n * 256 + 256) : table.slice(n * 256, n * 256 + 256);
    return out;
};

//
const TT = slice_by_16_tables(T0);
const T1 = TT[0],
    T2 = TT[1],
    T3 = TT[2],
    T4 = TT[3],
    T5 = TT[4];
const T6 = TT[5],
    T7 = TT[6],
    T8 = TT[7],
    T9 = TT[8],
    Ta = TT[9];
const Tb = TT[10],
    Tc = TT[11],
    Td = TT[12],
    Te = TT[13],
    Tf = TT[14];

//
const crc32_buf = (B, seed) => {
    let C = seed ^ -1,
        L = B.length - 15,
        i = 0;
    for (; i < L; ) C = Tf[B[i++] ^ (C & 255)] ^ Te[B[i++] ^ ((C >> 8) & 255)] ^ Td[B[i++] ^ ((C >> 16) & 255)] ^ Tc[B[i++] ^ (C >>> 24)] ^ Tb[B[i++]] ^ Ta[B[i++]] ^ T9[B[i++]] ^ T8[B[i++]] ^ T7[B[i++]] ^ T6[B[i++]] ^ T5[B[i++]] ^ T4[B[i++]] ^ T3[B[i++]] ^ T2[B[i++]] ^ T1[B[i++]] ^ T0[B[i++]];
    L += 15;
    while (i < L) C = (C >>> 8) ^ T0[(C ^ B[i++]) & 0xff];
    return ~C;
};

//
const drawColorSpace = 'srgb-linear';
const sRGB = {
    gamma: 0.45,
    rxy: new Float32Array([0.64, 0.33]),
    gxy: new Float32Array([0.3, 0.6]),
    bxy: new Float32Array([0.15, 0.06]),
    wxy: new Float32Array([0.3127, 0.329])
};





class ArrayBufferWrap {
    constructor(buffer, byteOffset = 0, byteLength = 0) {
        this.buffer = buffer;
        this.$byteLength = byteLength;
        this.$byteOffset = byteOffset;
    }

    get byteLength() {
        return this.$byteLength || this.buffer.byteLength || 0;
    }

    get byteOffset() {
        return this.$byteOffset || this.buffer.byteOffset || 0;
    }
}

//
export const calcXYZ = (U, B) => {
    //
    let rgb_xyz_c = mat3.transpose(mat3.fromValues(), mat3.fromValues(
        ...vec3.fromValues(...U.rxy, 1.0-U.rxy[0]-U.rxy[1]),
        ...vec3.fromValues(...U.gxy, 1.0-U.gxy[0]-U.gxy[1]),
        ...vec3.fromValues(...U.bxy, 1.0-U.bxy[0]-U.bxy[1])
    ));

    //
    let xyz_rgb_c = mat3.invert(new Float32Array(B.buffer, B.byteOffset, 10), rgb_xyz_c);
    let s_out = new Float32Array(B.buffer, B.byteOffset + 40, 4);

    //
    vec3.transformMat3(s_out, vec3.fromValues(...U.wxy.map((i) => i / U.wxy[1]), (1.0 - U.wxy[0] - U.wxy[1]) / U.wxy[1]), mat3.transpose(mat3.create(), xyz_rgb_c));

    //
    xyz_rgb_c[9] = U.gamma;

    //
    return B;
}

//
const debugCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    canvas.convertToBlob = ({type, quality})=>{
        return new Promise((r) => {
            canvas.toBlob(r, type, quality);
        });
    }
    return canvas;
};

//
export class CanvasOutput {
    constructor(device, width, height) {
        const canvas = debugCanvas(width, height); //new OffscreenCanvas(width, height);
        const context = canvas.getContext("webgpu", {
            preserveDrawingBuffer: true,
            colorSpace: "srgb"
        });

        //
        const devicePixelRatio = window.devicePixelRatio;
        const presentationFormat = navigator?.gpu?.getPreferredCanvasFormat?.() ?? "rgba8unorm";

        //
        canvas.width = width; //* devicePixelRatio;
        canvas.height = height; //* devicePixelRatio;

        //
        context.configure({
            device,
            format: presentationFormat,
            alphaMode: "premultiplied",
            colorSpace: "srgb"
        });

        //
        this.canvas = canvas;
        this.context = context
        this.device = device;
        this.format = presentationFormat;
    }

    //
    getView() {
        return this.context.getCurrentTexture().createView();
    }

    //
    $getCanvas() {
        return this.canvas;
    }
}

//
export class TextureOutput {
    constructor(device, width, height, format = "rgba8unorm") {
        this.device = device;
        this.texture = device.createTexture({
            size: [width, height, 1],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
    }

    //
    getView() {
        return this.texture.createView({ dimension: "2d" });
    }
}

//
export class UniformGroup {
    constructor(device, pipeline, byteLength) {
        const uniformBuffer = device.createBuffer({
            size: byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        //
        this.device = device;
        this.binding = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: (this.uniformBuffer = uniformBuffer) }
                }
            ]
        });
    }

    //
    writeData(arrayBuffer, bOffset = 0) {
        if (arrayBuffer instanceof ArrayBuffer || arrayBuffer instanceof SharedArrayBuffer) {
            return this.device.queue.writeBuffer(this.uniformBuffer, bOffset, arrayBuffer, 0, arrayBuffer.byteLength);
        } else {
            return this.device.queue.writeBuffer(this.uniformBuffer, bOffset, arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
        }
    }

    //
    getBinding() {
        return this.binding;
    }
}

//
export class ImageInput {
    constructor(device, imageBitmap, format = "rgba8unorm-srgb") {
        this.device = device;
        this.texture = device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.image = imageBitmap;
    }

    //
    async update() {
        this.device.queue.copyExternalImageToTexture({ source: this.image, flipY: true }, { texture: this.texture, colorSpace: "srgb", premultipliedAlpha: false }, [this.image.width, this.image.height]);
        return this;
    }

    //
    getView() {
        return this.texture.createView({ dimension: "2d" });
    }
}

//
export class ImageGroup {
    constructor(device, pipeline, input) {
        this.binding = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(2),
            entries: input.map((I, i) => ({
                binding: i,
                resource: I.getView()
            }))
        });
    }

    //
    getBinding() {
        return this.binding;
    }
}

//
export class ImageSampler {
    constructor(device, pipeline) {
        this.binding = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: device.createSampler({
                        magFilter: "nearest",
                        minFilter: "nearest"
                    })
                }
            ]
        });
    }

    //
    getBinding() {
        return this.binding;
    }
}

//
export class GDI3WGPU {
    constructor() {}

    async init() {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();

        //
        this.adapter = adapter;
        this.device = device;

        //
        return this;
    }

    async quad() {
        const quad = new Float32Array([
             -1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 
              1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 
             -1.0,  1.0, 0.0, 1.0, 0.0, 1.0, 
             -1.0,  1.0, 0.0, 1.0, 0.0, 1.0, 
              1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 
              1.0,  1.0, 0.0, 1.0, 1.0, 1.0, 
        ]);

        //
        const vbo = this.device.createBuffer({
            size: quad.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(vbo.getMappedRange()).set(quad);
        vbo.unmap();
        return vbo;
    }

    async pipeline(device, vert, frag, format) {
        const pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: device.createShaderModule({ code: vert }),
                entryPoint: "main",
                buffers: [
                    {
                        arrayStride: 24,
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: "float32x4" },
                            { shaderLocation: 1, offset: 16, format: "float32x2" }
                        ]
                    }
                ]
            },
            fragment: {
                module: device.createShaderModule({ code: frag }),
                entryPoint: "main",
                targets: [{ format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "none"
            }
        });

        //
        return pipeline;
    }

    //
    async render({ pipeline, bindings, vbo, output }) {
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: output.getView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: "load",
                    storeOp: "store"
                }
            ]
        });
        passEncoder.setPipeline(pipeline);
        bindings.map((B, i) => {
            passEncoder.setBindGroup(i, B?.getBinding() ?? B);
        });
        passEncoder.setVertexBuffer(0, vbo);
        passEncoder.draw(6);
        passEncoder.end();
        return this.device.queue.submit([commandEncoder.finish()]);
    }
}




//
const _white_ = fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=').then(r => r.blob());
const _temp = {};
const _module = new Promise(async R => {
    _temp.filter =
        typeof CanvasFilter != 'undefined'
            ? new CanvasFilter([
                  {
                      filter: 'colorMatrix',
                      type: 'matrix',
                      values: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
                  }
              ])
            : null;

    //if (!_temp.filter) {
    try {
        _temp.gdi = new GDI3WGPU().init();
    } catch (e) {
        console.error(e);
    }
    //}

    R(_temp);
});

//
class PNGChunk {
    constructor(slice, name = 'IEND', length = 0) {
        this.data = null;
        this.view = null;
        this.length = length;
        this.name = name;
        this.slice = slice;
        this.crc32 = 0;
    }

    compile() {
        if (!this.slice) {
            this.slice = new Uint8Array(new ArrayBuffer(this.length + 4 + 4 + 4));
            new Uint8Array(this.slice.buffer, this.slice.byteOffset + 8, this.length).set(this.data);
        }

        const view = new DataView(this.slice.buffer, this.slice.byteOffset, this.length + 4 + 4 + 4);
        view.setUint32(0, this.length, false);
        view.setUint32(4, this.name.charCodeAt(0) | (this.name.charCodeAt(1) << 8) | (this.name.charCodeAt(2) << 16) | (this.name.charCodeAt(3) << 24), true);
        view.setUint32(this.length + 4 + 4, (this.crc32 = crc32_buf(new Uint8Array(this.slice.buffer, this.slice.byteOffset + 4, this.length + 4))), false);
        return this;
    }
}

//
class ChunkReader {
    constructor(data, offset = 0) {
        this.data = data;
        this.offset = offset;
        this.chunks = [];
        this.signature = null;
        this.chunk = null;
    }

    readSignature() {
        this.signature = new Uint8Array(this.data, this.offset, 8);
        this.offset += 8;
        this.chunk = new PNGChunk();
    }

    readLength() {
        if (!this.chunk) {
            this.chunk = new PNGChunk();
        }
        this.chunk.length = new DataView(this.data, this.offset, 4).getUint32(0, false);
        this.offset += 4;
    }

    readName() {
        this.chunk.name = new TextDecoder().decode(new Uint8Array(this.data, this.offset, 4));
        this.offset += 4;
    }

    readCRC() {
        this.chunk.crc32 = new DataView(this.data, this.offset, 4).getUint32(0, false);
        this.offset += 4;
    }

    readData() {
        this.chunk.data = new Uint8Array(this.data, this.offset, this.chunk.length);
        this.chunk.view = new DataView(this.data, this.offset, this.chunk.length);
        this.offset += this.chunk.length;
    }

    makeSlice() {
        this.chunks.push(this.chunk);
        this.chunk.slice = new Uint8Array(this.data, this.offset - this.chunk.length - 4 - 4 - 4, this.chunk.length + 4 + 4 + 4);
        this.chunk = new PNGChunk();
    }
}

//
class ReconstructPNG {
    #PNGsignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    //
    constructor(chunks, header) {
        this.idats = chunks.filter(chunk => {
            //chunk.name != "JHDR" &&
            //chunk.name != "JDAT" &&
            //chunk.name != "JDAA" &&
            //chunk.name != "JEND"
            return chunk.name == 'IDAT';
        });
        this.chunks = [];
        this.header = header;
    }

    encodePLTE() {
        const PLTE = new PNGChunk();
        const SIZE = (1 << this.header.bitDepth) * 3;
        const data = new ArrayBuffer(SIZE + 4 + 4 + 4);
        PLTE.length = SIZE;
        PLTE.name = 'PLTE';
        PLTE.data = new Uint8Array(data, 8, SIZE);
        PLTE.view = new DataView(data, 8, SIZE);
        PLTE.data.set(new Uint8Array(SIZE).fill(255));
        PLTE.slice = new Uint8Array(data);
        this.chunks.push(PLTE.compile());
        return this;
    }

    encodeTRNS() {
        const tRNS = new PNGChunk();
        const SIZE = 1 << this.header.bitDepth;
        const data = new ArrayBuffer(SIZE + 4 + 4 + 4);
        tRNS.length = SIZE;
        tRNS.name = 'tRNS';
        tRNS.data = new Uint8Array(data, 8, SIZE);
        tRNS.view = new DataView(data, 8, SIZE);
        tRNS.data.set(new Uint8Array(SIZE).map((_, I) => I << (8 - this.header.bitDepth)));
        tRNS.slice = new Uint8Array(data);
        this.chunks.push(tRNS.compile());
        return this;
    }

    encodeIHDR() {
        const IHDR = new PNGChunk();
        const data = new ArrayBuffer(13 + 4 + 4 + 4);
        IHDR.length = 13;
        IHDR.name = 'IHDR';
        IHDR.data = new Uint8Array(data, 8, 13);
        IHDR.view = new DataView(data, 8, 13);
        IHDR.view.setUint32(0, this.header.width, false);
        IHDR.view.setUint32(4, this.header.height, false);
        IHDR.view.setUint8(8, this.header.bitDepth, false);
        IHDR.view.setUint8(9, 0, false);
        //IHDR.view.setUint8(10, 0, false);
        IHDR.view.setUint8(10, 0, false);
        IHDR.view.setUint8(11, this.filter, false);
        IHDR.view.setUint8(12, this.interlace, false);
        IHDR.slice = new Uint8Array(data);
        this.chunks.splice(0, 0, IHDR.compile());
        return this;
    }

    encodeIEND() {
        const IEND = new PNGChunk();
        const data = new ArrayBuffer(0 + 4 + 4 + 4);
        IEND.length = 0;
        IEND.slice = new Uint8Array(data);
        IEND.name = 'IEND';
        this.chunks.push(IEND.compile());
        return this;
    }

    encode() {
        this.encodeIHDR();
        this.chunks.push(...this.idats);
        this.encodeIEND();
        return new Blob(
            [
                this.#PNGsignature,
                ...this.chunks.map(chunk => {
                    return chunk.slice;
                })
            ],
            { type: 'image/png' }
        );
    }
}

//
class InjectPNG {
    #PNGsignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    //
    constructor(chunks) {
        this.chunks = chunks.filter(chunk => ['JHDR', 'JDAT', 'JDAA', 'JEND', 'IEND', 'IDAT', 'gAMA', 'cHRM'].indexOf(chunk.name) < 0);
    }

    //
    inject() {
        let IHDRi = this.reader.chunks.findIndex(chunk => chunk.name == 'IHDR');
        this.reader.chunks.splice(IHDRi + 1, 0, ...this.chunks);
        return this;
    }

    //
    recode(binPNG, byteOffset = 0, limit = 0xffffffff) {
        this.reader = new ChunkReader(binPNG, byteOffset);
        this.reader.readSignature();
        while (this.reader.offset < Math.min(this.reader.data.byteLength, byteOffset + limit)) {
            this.reader.readLength();
            this.reader.readName();
            this.reader.readData();
            this.reader.readCRC();
            this.reader.makeSlice();
            if (this.reader.chunks.slice(-1)[0].name == 'IEND') {
                break;
            }
        }

        //
        this.reader.chunks = [...this.reader.chunks];
        this.inject();

        //
        return new Blob(
            [
                this.#PNGsignature,
                ...this.reader.chunks.map(chunk => {
                    return chunk.slice;
                })
            ],
            { type: 'image/png' }
        );
    }
}

//
export default class OpenJNG {
    #JNGSignature = new Uint8Array([0x8b, 0x4a, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    #options = {};
    #URL = '';
    #DIR = '';
    #module = null;
    #loading = null;

    //
    constructor(options) {
        this.#JNGSignature = new Uint8Array([0x8b, 0x4a, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        this.#options = {
            ...options
        };
    }

    async #load(url, handle) {
        // fixes issue with fetch
        if (typeof url == 'string') {
            url = url.trim() || '';
            if (url.startsWith('.')) {
                url = location.origin + '/' + url;
            }
            if (url.startsWith('/')) {
                url = location.origin + url;
            }
        }

        //
        this.#URL = url;
        this.#DIR ||= location.hostname;

        //
        let fs = null;

        //
        try {
            fs = (await import('indexeddb-fs')).default;
        } catch (e) {
            //console.error(e);
        }

        // Check if a directory exists
        if (fs) {
            let _exists = false;
            try {
                _exists = await fs.isDirectory((this.#DIR ||= '' + location.hostname.hashCode()));
            } catch (e) {}
            if (!_exists) {
                await fs.createDirectory(this.#DIR);
            }
        }

        //
        if (fs) {
            let _exists = false;
            try {
                _exists = await fs.isDirectory((this.#DIR += '/framelib'));
            } catch (e) {}
            if (!_exists) {
                await fs.createDirectory(this.#DIR);
            }
        }

        //
        let response = url;
        try {
            response = url instanceof Response ? url : await fetch(url instanceof Blob ? URL.createObjectURL(url) : url, { mode: 'cors', keepalive: true });
        } catch (e) {
            console.log(url);
            console.error(e);
        }

        //
        const blob = url instanceof Blob ? url : response.ok ? await response.blob() : null;
        const fr = new FileReader();

        //
        if (response.ok) {
            const pm = new Promise((r, e) => {
                (fr.onload = r), (fr.onerror = e);
            });
            fr.readAsArrayBuffer(blob);
            await pm;

            //try {
            return await handle(fr.result, blob);
            //} catch(e) {
            //console.error(e);
            //}
        } else {
            console.error('URL: ' + url + ', Error HTTP: ' + response.status);
        }

        return blob;
    }

    //
    #concat(resultConstructor, ...arrays) {
        let totalLength = 0;
        for (let arr of arrays) {
            totalLength += arr.length;
        }
        let result = new resultConstructor(totalLength);
        let offset = 0;
        for (let arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    #compare(a, b) {
        for (let i = a.length; -1 < i; i -= 1) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    #equal32(a, b) {
        const ua = new Uint32Array(a.buffer, a.byteOffset, a.byteLength / 4);
        const ub = new Uint32Array(b.buffer, b.byteOffset, b.byteLength / 4);
        return this.#compare(ua, ub);
    }

    #checkSignature(reader) {
        return this.#equal32(reader.signature, this.#JNGSignature);
    }

    #readBody(reader) {
        //
        while (reader.offset < reader.data.byteLength) {
            reader.readLength();
            reader.readName();
            reader.readData();
            reader.readCRC();
            reader.makeSlice();
            if (reader.chunks.slice(-1)[0].name == 'IEND') {
                break;
            }
        }

        //
        const cxy = reader.chunks.find(chunk => chunk.name == 'cHRM');
        const gam = reader.chunks.find(chunk => chunk.name == 'gAMA');

        //
        const $result = {};
        $result.correction = {};

        // color correction
        if (cxy) {
            $result.correction.wxy = new Float32Array([cxy.view.getUint32(0, false) / 100000.0, cxy.view.getUint32(4, false) / 100000.0]);
            $result.correction.rxy = new Float32Array([cxy.view.getUint32(8, false) / 100000.0, cxy.view.getUint32(12, false) / 100000.0]);
            $result.correction.gxy = new Float32Array([cxy.view.getUint32(16, false) / 100000.0, cxy.view.getUint32(20, false) / 100000.0]);
            $result.correction.bxy = new Float32Array([cxy.view.getUint32(24, false) / 100000.0, cxy.view.getUint32(28, false) / 100000.0]);
        }

        // gamma correction
        if (gam) {
            $result.correction.gamma = gam.view.getUint32(0, false) / 100000.0;
        }

        //
        $result.header = this.#readHeader(reader);

        {
            $result.RGB = this.#concatJDAT(reader);
        }

        {
            if (($result.header.compression == 8 && $result.header.bitDepth > 0) || reader.chunks.find(chunk => chunk.name == 'JDAA' || chunk.name == 'JdAA')) {
                $result.A = this.#concatJDAA(reader);
            } else if (($result.header.compression == 0 && $result.header.bitDepth > 0) || reader.chunks.find(chunk => chunk.name == 'IDAT')) {
                //if (this.alphaHeader.bitDepth <= 8) { this.indexedAvailable = true; };
                $result.A = this.#reconstructPNG(reader, $result.header);
            }
        }

        //
        $result.inject = new InjectPNG(reader.chunks);
        return $result;
    }

    //
    #readImage(reader) {
        reader.readSignature();
        if (this.#checkSignature(reader)) {
            return this.#readBody(reader);
        }
        return {};
    }

    //
    #readHeader(reader) {
        const header = reader.chunks.find(chunk => chunk.name === 'JHDR');
        return {
            width: header.view.getUint32(0, false),
            height: header.view.getUint32(4, false),
            bitDepth: header.view.getUint8(12, false),
            compression: header.view.getUint8(13, false),
            filter: header.view.getUint8(14, false),
            interlace: header.view.getUint8(15, false)
        };
    }

    //
    async asPNG() {
        return (await this.#combine())
            .$getCanvas()
            .convertToBlob({ type: 'image/png' })
            .then($b => {
                return fetch(URL.createObjectURL($b)).then(async r => {
                    return (await this.#loading).inject.recode(await r.arrayBuffer());
                });
            });
    }

    //
    async asImageBitmap() {
        return (await this.#combine()).$getCanvas().transferToImageBitmap();
    }

    //
    load(url) {
        this.#loading = this.#load(url, async (AB, blob) => {
            return this.#readImage(new ChunkReader(AB));
        });
        return this;
    }

    //
    #reconstructPNG(reader, header) {
        return new ReconstructPNG(reader.chunks, header).encode();
    }

    //
    #concatJDAT(reader) {
        const JDATs = reader.chunks.filter(chunk => chunk.name == 'JDAT');
        return new Blob(
            JDATs.map(chunk => chunk.data),
            { type: 'image/jpeg' }
        );
    }

    //
    #concatJDAA(reader) {
        const JDATs = reader.chunks.filter(chunk => chunk.name == 'JDAA' || chunk.name == 'JdAA');
        return new Blob(
            JDATs.map(chunk => chunk.data),
            { type: 'image/jpeg' }
        );
    }

    //
    #combine() {
        return this.#loading.then($r => {
            const $p = (async () => Promise.all([createImageBitmap($r.RGB, { colorSpaceConversion: 'none', resizeQuality: 'pixelated' }), createImageBitmap($r.A || (await _white_), { colorSpaceConversion: 'none', resizeQuality: 'pixelated' }), new Promise(async R => R((this.#module ??= await _module)))]))();
            return $p.then(async (A_RGB) => {
                const gdi3 = await A_RGB[2].gdi;
                const rgb = await new ImageInput(gdi3.device, A_RGB[0], "rgba8unorm-srgb").update();
                const a = await new ImageInput(gdi3.device, A_RGB[1], "r8unorm").update();
                const fbo = new CanvasOutput(gdi3.device, A_RGB[0].width, A_RGB[0].height);
                const pipeline = await gdi3.pipeline(gdi3.device, _vertex_, _fragment_, fbo.format);
                const vbo = await gdi3.quad();
                const sampler = new ImageSampler(gdi3.device, pipeline);
                const uniform = new UniformGroup(gdi3.device, pipeline, 64);

                //
                uniform.writeData(calcXYZ(Object.assign({ ...sRGB }, $r.correction), new ArrayBufferWrap(new ArrayBuffer(64))), 0);

                //
                const _ = await gdi3.render({ pipeline, vbo, bindings: [uniform, sampler, new ImageGroup(gdi3.device, pipeline, [rgb, a])], output: fbo });
                return fbo;
            });
        });
    }
}
