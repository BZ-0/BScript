import { getPixelPack } from "./env"

//
export function makeARGB(fileData: usize, width: u32, height: u32): void {
  let W: u32 = width*4;
  let Wr = (W>>4)<<4;
  for (let Y:u32=0;Y<height;Y++) {
    let P: usize = getPixelPack(0,Y,width,1,fileData+Y*W);
    for (let X:u32=0;X<Wr;X+=16) {
      let pX: usize = P+X;
      v128.store(pX, v128.swizzle(v128.load(pX), i8x16(3,0,1,2, 7,4,5,6, 11,8,9,10, 15,12,13,14)));
    }
    for (let X:u32=Wr;X<W;X+=4) {
      let pX: usize = P+X;
      let pI: u8[] = [load<u8>(pX+3), load<u8>(pX+0), load<u8>(pX+1), load<u8>(pX+2)];
      store<u8>(pX+0, pI[0]);
      store<u8>(pX+1, pI[1]);
      store<u8>(pX+2, pI[2]);
      store<u8>(pX+3, pI[3]);
    }
  }
}

//
export function makeBGRA(fileData: usize, width: u32, height: u32): void {
  let W: u32 = width*4;
  let Wr = (W>>4)<<4;
  for (let Y:u32=0;Y<height;Y++) {
    let P: usize = getPixelPack(0,Y,width,1,fileData+Y*W);
    for (let X:u32=0;X<Wr;X+=16) {
      let pX: usize = P+X;
      v128.store(pX, v128.swizzle(v128.load(pX), i8x16(2,1,0,3, 5,6,4,7, 10,9,8,11, 14,13,12,15)));
    }
    for (let X:u32=Wr;X<W;X+=4) {
      let pX: usize = P+X;
      let pI: u8[] = [load<u8>(pX+2), load<u8>(pX+1), load<u8>(pX+0), load<u8>(pX+3)]
      store<u8>(pX+0, pI[0]);
      store<u8>(pX+1, pI[1]);
      store<u8>(pX+2, pI[2]);
      store<u8>(pX+3, pI[3]);
    }
  }
}

//
export function makeRGBA(fileData: usize, width: u32, height: u32): void {
  let W: u32 = width*4;
  for (let Y:u32=0;Y<height;Y++) {
    let P: usize = getPixelPack(0,Y,width,1,fileData+Y*W);
  }
}

//
function i32x4_dot_i8x16(a: v128, b: v128): v128 {
  return i32x4.add(
    i32x4.dot_i16x8_s(i16x8.extend_low_i8x16_u(a), i16x8.extend_low_i8x16_u(b)), 
    i32x4.dot_i16x8_s(i16x8.extend_high_i8x16_u(a), i16x8.extend_high_i8x16_u(b))
  );
}

//
function u32x4_extadd_quarters_u8x16(a: v128): v128 {
  return i32x4.extadd_pairwise_i16x8_u(i16x8.extadd_pairwise_i8x16_u(a));
}

//
export function premakeA(fileData: usize, payload: usize, width: u32, height: u32): void {
  let W: u32 = width*4;
  let Wr = (W>>4)<<4;

  //
  for (let Y:u32=0;Y<height;Y++) {
    let P: usize = fileData+Y*(W+6);
    
    // lane with filter 0
    store<u8>(5+P, 0); getPixelPack(0,Y,width,1,payload);
    for (let X:u32=0;X<Wr;X+=16) {
      v128.store(6+P+X, /*v128.or(v128.load(6+P+X),*/ v128.shl<u32>(v128.and(v128.load(payload+X), i32x4(0x000000FF, 0x000000FF, 0x000000FF, 0x000000FF)), 24))/*)*/;
    }
    for (let X:u32=Wr;X<W;X+=4) {
      store<u32>(6+P+X, /*load<u32>(6+P+X)|*/((load<u32>(payload+X)&0x000000FF)<<24));
    }
  }
}

//
export function makePNGData(fileData: usize, payload: usize, width: u32, height: u32): void {
  let W: u32 = width*4;

  //
  const REM: u16 = 65521;
  const weight_lo_v: v128 = i8x16(32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17);
  const weight_hi_v: v128 = i8x16(16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1);

  //
  let a: u32 = 1, b: u32 = 0;
  let S: u32 = W+1;

  //
  for (let Y:u32=0;Y<height;Y++) {
    let P: usize = fileData+Y*(W+6);
    store<u8>(0+P, Y==height-1?1:0);
    store<u16>(1+P, <u16>S);
    store<u16>(3+P, ~(<u16>S));

    // lane with filter 0
    store<u8>(5+P, 0); getPixelPack(0,Y,width,1,6+P);

    //
    let p_v = i32x4(a*(S>>5), 0, 0, 0);
    let a_v = i32x4(0, 0, 0, 0);
    let b_v = i32x4(b, 0, 0, 0);

    //
    let Sr = (S>>5)<<5;

    //
    for (let X:u32=0;X<Sr;X+=32) {
      let v_lo: v128 = v128.load(5+P+X), v_hi: v128 = v128.load(5+P+X+16);
      p_v = i32x4.add(p_v, a_v);

      a_v = i32x4.add(a_v, u32x4_extadd_quarters_u8x16(v_lo));
      b_v = i32x4.add(b_v, i32x4_dot_i8x16(v_lo, weight_lo_v));

      a_v = i32x4.add(a_v, u32x4_extadd_quarters_u8x16(v_hi));
      b_v = i32x4.add(b_v, i32x4_dot_i8x16(v_hi, weight_hi_v));
    }

    //
    b_v = i32x4.add(b_v, i32x4.shl(p_v, 5));

    //
    a_v = i32x4.add(a_v, v128.swizzle(a_v, i8x16( 8,9,10,11, 12,13,14,15, 0,1,2,3, 4,5,6,7)));
    a_v = i32x4.add(a_v, v128.swizzle(a_v, i8x16( 4,5,6,7, 0,1,2,3, 12,13,14,15, 8,9,10,11)));
    a += i32x4.extract_lane(a_v, 0);

    //
    b_v = i32x4.add(b_v, v128.swizzle(b_v, i8x16( 8,9,10,11, 12,13,14,15, 0,1,2,3, 4,5,6,7)));
    b_v = i32x4.add(b_v, v128.swizzle(b_v, i8x16( 4,5,6,7, 0,1,2,3, 12,13,14,15, 8,9,10,11)));
    b = i32x4.extract_lane(b_v, 0);

    //
    a %= REM; b %= REM;

    //
    for (let X=Sr;X<S;X++) { b += (a += load<u8>(5+P+X)); }
    if (a >= REM) a -= REM; a %= REM; b %= REM;
  }

  //
  store<u32>(fileData+height*(W+6), bswap<u32>(((b << 16) | a)));
}

//
export function makePNGData_RGBX32(fileData: usize, payload: usize, width: u32, height: u32): void {
  let W: u32 = width*4;

  //
  const REM: u16 = 65521;
  const weight_lo_v: v128 = i8x16(32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17);
  const weight_hi_v: v128 = i8x16(16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1);

  //
  let a: u32 = 1, b: u32 = 0;
  let S: u32 = W+1;
  let Wr = (W>>4)<<4;

  //
  for (let Y:u32=0;Y<height;Y++) {
    let P: usize = fileData+Y*(W+6);
    store<u8>(0+P, Y==height-1?1:0);
    store<u16>(1+P, <u16>S);
    store<u16>(3+P, ~(<u16>S));

    // lane with filter 0
    store<u8>(5+P, 0); getPixelPack(0,Y,width,1,payload);
    for (let X:u32=0;X<Wr;X+=16) {
      v128.store(6+P+X, v128.or(v128.load(6+P+X), v128.and(v128.load(payload+X), i32x4(0x00FFFFFF, 0x00FFFFFF, 0x00FFFFFF, 0x00FFFFFF))));
    }
    for (let X:u32=Wr;X<W;X+=4) {
      store<u32>(6+P+X, load<u32>(6+P+X)|(load<u32>(payload+X)&0x00FFFFFF));
    }

    //
    let p_v = i32x4(a*(S>>5), 0, 0, 0);
    let a_v = i32x4(0, 0, 0, 0);
    let b_v = i32x4(b, 0, 0, 0);

    //
    let Sr = (S>>5)<<5;

    //
    for (let X:u32=0;X<Sr;X+=32) {
      let v_lo: v128 = v128.load(5+P+X), v_hi: v128 = v128.load(5+P+X+16);
      p_v = i32x4.add(p_v, a_v);

      a_v = i32x4.add(a_v, u32x4_extadd_quarters_u8x16(v_lo));
      b_v = i32x4.add(b_v, i32x4_dot_i8x16(v_lo, weight_lo_v));

      a_v = i32x4.add(a_v, u32x4_extadd_quarters_u8x16(v_hi));
      b_v = i32x4.add(b_v, i32x4_dot_i8x16(v_hi, weight_hi_v));
    }

    //
    b_v = i32x4.add(b_v, i32x4.shl(p_v, 5));

    //
    a_v = i32x4.add(a_v, v128.swizzle(a_v, i8x16( 8,9,10,11, 12,13,14,15, 0,1,2,3, 4,5,6,7)));
    a_v = i32x4.add(a_v, v128.swizzle(a_v, i8x16( 4,5,6,7, 0,1,2,3, 12,13,14,15, 8,9,10,11)));
    a += i32x4.extract_lane(a_v, 0);

    //
    b_v = i32x4.add(b_v, v128.swizzle(b_v, i8x16( 8,9,10,11, 12,13,14,15, 0,1,2,3, 4,5,6,7)));
    b_v = i32x4.add(b_v, v128.swizzle(b_v, i8x16( 4,5,6,7, 0,1,2,3, 12,13,14,15, 8,9,10,11)));
    b = i32x4.extract_lane(b_v, 0);

    //
    a %= REM; b %= REM;

    //
    for (let X=Sr;X<S;X++) { b += (a += load<u8>(5+P+X)); }
    if (a >= REM) a -= REM; a %= REM; b %= REM;
  }

  //
  store<u32>(fileData+height*(W+6), bswap<u32>(((b << 16) | a)));
}

//
export function alloc(size: u32): usize {
  return heap.alloc(size);
}

//
export function free(ptr: u32): void {
  return heap.free(ptr);
}
