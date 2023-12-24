//
const exp = (obj, m_name) => { return obj[m_name].bind(obj); };
const codec = new Map([
    ["utf8", { 
        "dec": exp(new TextDecoder(), "decode"), 
        "enc": exp(new TextEncoder(), "encode")
    }],
    ["utf16", { 
        "dec": (cde)=>(codes_str(cde)), 
        "enc": (str)=>(utf16_uint16(str))
    }],
]);

//
const use_dec = (name, code) => { return codec.get(name).dec(code); }
const use_enc = (name, str) => { return codec.get(name).enc(str); }

//
const r = (from,to,src) => { return AsMap[from].get(to)(src); }
const m = ($) => { return new Map($); }

//
const binary_base64 = btoa;
const base64_binary = atob;

//
const codes_str    = (src) => { return String.fromCodePoint(...src); };
const utf16_uint16 = (src) => { return Uint16Array.from(src.split("").map((e)=>(e.codePointAt(0)))) };
const utf8_binary  = (src) => { return unescape(encodeURIComponent(src)) };
const binary_utf8  = (src) => { return decodeURIComponent(escape(src)) };
const binary_uint8 = (src) => { return Uint8Array.from(src, (m) => m.codePointAt(0)); };

//
const as_uint16 = (src) => { return new Uint16Array(src.buffer, src.byteOffset, src.byteLength >> 1); }
const as_uint8  = (src) => { return new Uint8Array (src.buffer, src.byteOffset, src.byteLength >> 0); }

//
const u16 = "uint16", u8 = "uint8", bstr = "binary", utf16 = "utf16", utf8 = "utf8", b64 = "base64";

//
export const AsMap = {
    [u16]: m([
        [utf16  , (src) => { return codes_str(src);                   }],
        [b64    , (src) => { return binary_base64(r(u16, bstr, src)); }],
        [u8     , (src) => { return as_uint8(src);                    }],
        [bstr   , (src) => { return codes_str(as_uint8(src));         }],
    ]),
    [u8]: m([
        [utf8   , (src) => { return use_dec('utf8', src);             }],
        [utf16  , (src) => { return codes_str(as_uint16(src));        }],
        [b64    , (src) => { return binary_base64(codes_str(src));    }],
        [bstr   , (src) => { return codes_str(src);                   }],
        [u16    , (src) => { return as_uint16(src);                   }],
    ]),
    [bstr]: m([
        [utf8   , (src) => { return binary_utf8(src);                 }],
        [utf16  , (src) => { return codes_str(r(bstr, u16, src));     }],
        [b64    , (src) => { return binary_base64(src);               }],
        [u8     , (src) => { return binary_uint8(src);                }],
        [u16    , (src) => { return as_uint16(binary_uint8(src));     }],
    ]),
    [utf8]: m([
        [b64    , (src) => { return binary_base64(utf8_binary(src));  }],
        [bstr   , (src) => { return utf8_binary(src);                 }],
        [u8     , (src) => { return use_enc('utf8', src);             }],
    ]),
    [utf16]: m([
        [b64    , (src) => { return r(u16, b64,  utf16_uint16(src));  }],
        [u8     , (src) => { return r(u16, u8 ,  utf16_uint16(src));  }],
        [bstr   , (src) => { return r(u16, bstr, utf16_uint16(src));  }],
        [u16    , (src) => { return utf16_uint16(src);                }],
    ]),
    [b64]: m([
        [bstr   , (src) => { return base64_binary(src);               }],
        [utf8   , (src) => { return binary_utf8(base64_binary(src));  }],
        [utf16  , (src) => { return codes_str(r(b64, u16, src));      }],
        [u8     , (src) => { return binary_uint8(r(b64, bstr, src));  }],
        [u16    , (src) => { return as_uint16(r(b64, u8, src))        }],
    ]),
};

//
export default class BString {

    // reinterpret string from
    static as(what = "", coding = "native") {
        const pair = coding.split("_");
        const from = AsMap[pair[0]];
        return from.has(pair[1]) ? from.get(pair[1])(what) : what;
    }
}
