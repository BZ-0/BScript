//
const _vertex_ = await (await fetch(new URL("./raw/_gdi2_.vert", import.meta.url).href)).text();
const _fragment_ = await (await fetch(new URL("./raw/_gdi2_.frag", import.meta.url).href)).text();

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
const compileShader = (gl, shaderSource, shaderType) => {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        throw 'could not compile shader:' + gl.getShaderInfoLog(shader);
    }
    return shader;
};

//
const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        throw 'program failed to link:' + gl.getProgramInfoLog(program);
    }
    return program;
};

//
const typeMap = (gl, internal) =>
    ({
        [gl.R8UI]: gl.UNSIGNED_BYTE,
        [gl.RG8UI]: gl.UNSIGNED_BYTE,
        [gl.RGB8UI]: gl.UNSIGNED_BYTE,
        [gl.RGBA8UI]: gl.UNSIGNED_BYTE,
        [gl.R16UI]: gl.UNSIGNED_SHORT,
        [gl.RG16UI]: gl.UNSIGNED_SHORT,
        [gl.RGB16UI]: gl.UNSIGNED_SHORT,
        [gl.RGBA16UI]: gl.UNSIGNED_SHORT,
        [gl.R32UI]: gl.UNSIGNED_INT,
        [gl.RG32UI]: gl.UNSIGNED_INT,
        [gl.RGB32UI]: gl.UNSIGNED_INT,
        [gl.RGBA32UI]: gl.UNSIGNED_INT,
        [gl.R8]: gl.UNSIGNED_BYTE,
        [gl.RG8]: gl.UNSIGNED_BYTE,
        [gl.RGB8]: gl.UNSIGNED_BYTE,
        [gl.RGBA8]: gl.UNSIGNED_BYTE,

        //
        [gl.SRGB8]: gl.UNSIGNED_BYTE,
        [gl.SRGB8_ALPHA8]: gl.UNSIGNED_BYTE,

        // may be other formats
        [gl.SRGB_ALPHA]: gl.UNSIGNED_BYTE,
        [gl.SRGB]: gl.UNSIGNED_BYTE,

        //
        [gl.R16]: gl.UNSIGNED_SHORT,
        [gl.RG16]: gl.UNSIGNED_SHORT,
        [gl.RGB16]: gl.UNSIGNED_SHORT,
        [gl.RGBA16]: gl.UNSIGNED_SHORT,
        [gl.R32]: gl.UNSIGNED_INT,
        [gl.RG32]: gl.UNSIGNED_INT,
        [gl.RGB32]: gl.UNSIGNED_INT,
        [gl.RGBA32]: gl.UNSIGNED_INT,
        [gl.R32F]: gl.FLOAT,
        [gl.RG32F]: gl.FLOAT,
        [gl.RGB32F]: gl.FLOAT,
        [gl.RGBA32F]: gl.FLOAT
    }[internal]);

//
const formatMap = (gl, internal) =>
    ({
        //
        [gl.SRGB8]: gl.RGB, //gl.SRGB,
        [gl.SRGB8_ALPHA8]: gl.RGBA, //gl.SRGB_ALPHA,

        // may be other formats
        [gl.SRGB_ALPHA]: gl.RGBA, //gl.SRGB_ALPHA,
        [gl.SRGB]: gl.RGB, //gl.SRGB,

        //
        [gl.R8UI]: gl.RED_INTEGER,
        [gl.RG8UI]: gl.RG_INTEGER,
        [gl.RGB8UI]: gl.RGB_INTEGER,
        [gl.RGBA8UI]: gl.RGBA_INTEGER,
        [gl.R16UI]: gl.RED_INTEGER,
        [gl.RG16UI]: gl.RG_INTEGER,
        [gl.RGB16UI]: gl.RGB_INTEGER,
        [gl.RGBA16UI]: gl.RGBA_INTEGER,
        [gl.R32UI]: gl.RED_INTEGER,
        [gl.RG32UI]: gl.RG_INTEGER,
        [gl.RGB32UI]: gl.RGB_INTEGER,
        [gl.RGBA32UI]: gl.RGBA_INTEGER,
        [gl.R8]: gl.RED,
        [gl.RG8]: gl.RG,
        [gl.RGB8]: gl.RGB,
        [gl.RGBA8]: gl.RGBA,
        [gl.R16]: gl.RED,
        [gl.RG16]: gl.RG,
        [gl.RGB16]: gl.RGB,
        [gl.RGBA16]: gl.RGBA,
        [gl.R32]: gl.RED,
        [gl.RG32]: gl.RG,
        [gl.RGB32]: gl.RGB,
        [gl.RGBA32]: gl.RGBA,
        [gl.R32F]: gl.RED,
        [gl.RG32F]: gl.RG,
        [gl.RGB32F]: gl.RGB,
        [gl.RGBA32F]: gl.RGBA
    }[internal]);

//
const drawColorSpace = 'srgb-linear';
const sRGB = {
    gamma: 1.0,
    rxy: new Float32Array([0.64, 0.33]),
    gxy: new Float32Array([0.3, 0.6]),
    bxy: new Float32Array([0.15, 0.06]),
    wxy: new Float32Array([0.3127, 0.329])
};

//
class GDI2 {
    //
    constructor() {
        this.canvas = new OffscreenCanvas(2, 2);
        this.gl = this.canvas.getContext('webgl2', {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true,
            alpha: true,
            depth: false,
            precision: 'highp',
            antialias: false,
            powerPreference: 'high-performance',
            desynchronized: true,
            willReadFrequently: true,
            colorSpace: drawColorSpace,

            // try to use fp16 draw buffer
            pixelFormat: 'float16',
            dataType: 'float16',
            colorType: 'float16'
        });

        //
        this.canvas?.configureHighDynamicRange?.({ mode: 'extended' });
        this.correction = { ...sRGB };

        // not working...
        this.unorm16 = this.gl.getExtension('EXT_texture_norm16');
        this.float32 = this.gl.getExtension('EXT_color_buffer_float');
        this.float16 = this.gl.getExtension('EXT_color_buffer_half_float');

        //
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
        this.gl.pixelStorei(this.gl.PACK_ALIGNMENT, 1);

        //this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        //this.gl.colorMask(true, true, true, true);
        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.bindVertexArray(this.gl.createVertexArray());

        //
        this.program = createProgram(this.gl, compileShader(this.gl, _vertex_, this.gl.VERTEX_SHADER), compileShader(this.gl, _fragment_, this.gl.FRAGMENT_SHADER));
    }

    //
    setCorrection(c) {
        this.correction = Object.assign({ ...sRGB }, c);
        return this;
    }

    //
    image(image, index = 0) {
        if (index == 0) {
            (this.width = image.width), (this.height = image.height);
        }

        //
        this.gl.unpackColorSpace = 'srgb-linear'; let internal = this.gl.RGB8;
        //this.gl.unpackColorSpace = 'srgb'; let internal = this.gl.SRGB8;

        //
        if (index == 1) {
            this.gl.unpackColorSpace = 'srgb';
            internal = this.gl.R8;
        }

        // Now that the image has loaded make copy it to the texture.
        const texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + index);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        //
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internal, formatMap(this.gl, internal), typeMap(this.gl, internal), image);

        //
        return this;
    }

    //
    onFramebuffer(internal = null) {
        internal ??= this.gl.RGBA8;

        //
        this.gl.activeTexture(this.gl.TEXTURE0 + 15);
        this.gl.bindTexture(this.gl.TEXTURE_2D, (this.output = this.gl.createTexture()));
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        //
        this.gl.clearBufferfv(this.gl.COLOR, 0, [0, 0, 0, 0]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internal, this.width, this.height, 0, formatMap(this.gl, internal), typeMap(this.gl, internal), null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, (this.fb = this.gl.createFramebuffer()));
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.output, 0);
        return this;
    }

    //
    onCanvas() {
        this.#resize(this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        //
        this.gl.colorSpace = drawColorSpace;
        this.gl.drawingBufferColorSpace = drawColorSpace;
        this.gl?.drawingBufferStorage?.(this.gl.RGBA16F, this.width, this.height);
        return this;
    }

    //
    gen() {
        //
        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.clearBufferfv(this.gl.COLOR, 0, [0, 0, 0, 0]);
        this.gl.disable(this.gl.BLEND);

        //
        const $program = this.program;
        this.gl.useProgram($program);
        this.gl.uniform1i(this.gl.getUniformLocation($program, `img_rgb`), 0);
        this.gl.uniform1i(this.gl.getUniformLocation($program, `img_a`), 1);
        this.gl.uniform1f(this.gl.getUniformLocation($program, `gamma`), this.correction.gamma);
        this.gl.uniform2fv(this.gl.getUniformLocation($program, `rxy`), this.correction.rxy);
        this.gl.uniform2fv(this.gl.getUniformLocation($program, `gxy`), this.correction.gxy);
        this.gl.uniform2fv(this.gl.getUniformLocation($program, `bxy`), this.correction.bxy);
        this.gl.uniform2fv(this.gl.getUniformLocation($program, `wxy`), this.correction.wxy);

        //
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        return this;
    }

    //
    #resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    //
    $getCanvas() {
        return this.canvas;
    }

    // TODO! Needs FP16 HDR support
    getImageData(x, y, width, height, options = {}) {
        const type = this.gl.getParameter(this.gl.IMPLEMENTATION_COLOR_READ_TYPE, (options.internal ??= this.gl.RGBA8));
        const pixels = type == this.gl.UNSIGNED_INT ? new Uint32Array(width * height * 4) : new Uint8Array(options.buffer, options.byteOffset, width * height * 4);

        //
        if (this.fb) {
            this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.fb);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.output);
        }
        this.gl.readPixels(x, y, width, height, formatMap(this.gl, options.internal), type, pixels, 0);

        //
        if (type == this.gl.UNSIGNED_INT) {
            if (options.buffer) {
                new Uint8Array(options.buffer, options.byteOffset, width * height * 4).set(pixels);
            } else {
                const backup = new Uint8Array(width * height * 4);
                backup.set(pixels);
                pixels = backup;
            }
        }

        //
        return {
            width: width,
            height: height,
            data: pixels,
            depth: 8
        };
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
        _temp.gdi = new GDI2();
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
            return $p.then(A_RGB => {
                return A_RGB[2].gdi.image(A_RGB[0], 0).image(A_RGB[1], 1).setCorrection($r.correction).onCanvas().gen();
            });
        });
    }
}
