import BString from "../src/js/index.mjs"

// BE ACCURE - UNICODE SAMPLE STRING!
const EXAMPLE0 = "a Ā 𐀀 文 🦄";

//
const _utf8b_ = BString.as(EXAMPLE0, "utf8_uint8");
const _utf8_ = EXAMPLE0;
const _base64_valid_ = "YSDEgCDwkICAIOaWhyDwn6aE";

//
console.log(_utf8_);
console.log(_utf8b_);
console.log(BString.as(_utf8b_, "uint8_utf8"));

//
console.log(BString.as(_utf8_, "utf8_base64"));
console.log(BString.as(_utf8b_, "uint8_base64"));
console.log(BString.as(_utf8_, "utf8_binary"));
console.log(BString.as(_utf8b_, "uint8_binary"));

//
const _utf16b_ = BString.as(EXAMPLE0, "utf16_uint8");
const _utf16_ = EXAMPLE0;

//
console.log(_utf16_);
console.log(_utf16b_);
console.log(BString.as(_utf16b_, "uint8_utf16"));

//
console.log(BString.as(_utf16_, "utf16_base64"));
console.log(BString.as(_utf16b_, "uint8_base64"));
console.log(BString.as(_utf16_, "utf16_binary"));
console.log(BString.as(_utf16b_, "uint8_binary"));
