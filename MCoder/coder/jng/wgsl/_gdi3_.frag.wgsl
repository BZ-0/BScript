

@group(0) @binding(0) var<storage, read> b: array<f32, 16>;
@group(1) @binding(0) var sampl: sampler;
@group(2) @binding(0) var rgb: texture_2d<f32>;
@group(2) @binding(1) var alpha: texture_2d<f32>;

//
const srgb_xyz = mat3x3(
    0.4124564,  0.3575761,  0.1804375,
    0.2126729,  0.7151522,  0.0721750,
    0.0193339,  0.1191920,  0.9503041
);

//
const xyz_srgb = mat3x3(
    3.2404542, -1.5371385, -0.4985314,
    -0.9692660,  1.8760108,  0.0415560,
    0.0556434, -0.2040259,  1.0572252
);

//
fn fromLinear(linearRGB: vec3<f32>) -> vec3<f32> {
    var cutoff: vec3<bool> = vec3(linearRGB.x < 0.0031308, linearRGB.y < 0.0031308, linearRGB.z < 0.0031308);
    var higher: vec3<f32> = vec3(1.055)*pow(linearRGB, vec3(1.0/2.4)) - vec3(0.055);
    var lower: vec3<f32> = linearRGB * vec3(12.92);
    return select(higher, lower, cutoff);
}

//
@fragment
fn main(
  @location(0) fUV: vec2<f32>,
  @location(1) fPS: vec4<f32>
) -> @location(0) vec4<f32> {
    let xyz_rgb_c: mat3x3<f32> = mat3x3(b[0], b[1], b[2],  b[3], b[4], b[5],  b[6], b[7], b[8]);
    let gamma: f32 = b[9];
    let scale: vec4<f32> = vec4<f32>(b[10], b[11], b[12], b[13]);

    //
    let a: f32 = textureSample(alpha, sampl, fUV).x;
    let linearXYZ: vec4<f32> = vec4<f32>(textureSample(rgb, sampl, fUV).xyz*srgb_xyz, 1.0);
    let linearRGB: vec3<f32> = (linearXYZ.xyz/linearXYZ.w) * xyz_rgb_c / scale.xyz;
    return vec4<f32>(fromLinear(pow(linearRGB.xyz, vec3(0.45f / gamma)))*a, a);
}
