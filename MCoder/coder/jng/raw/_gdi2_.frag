#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

in highp vec2 texcoord;

uniform highp sampler2D img_rgb;
uniform highp sampler2D img_a;

layout (location = 0) out highp vec4 fragColor;

// Converts a color from linear light gamma to sRGB gamma
highp vec3 fromLinear(in highp vec3 linearRGB) {
    bvec3 cutoff = lessThan(linearRGB, vec3(0.0031308));
    highp vec3 higher = vec3(1.055)*pow(linearRGB, vec3(1.0/2.4)) - vec3(0.055);
    highp vec3 lower = linearRGB * vec3(12.92);
    return mix(higher, lower, cutoff).xyz;
}

highp vec4 fromLinear(in highp vec4 linearRGB) {
    bvec4 cutoff = lessThan(linearRGB, vec4(0.0031308));
    highp vec4 higher = vec4(1.055)*pow(linearRGB, vec4(1.0/2.4)) - vec4(0.055);
    highp vec4 lower = linearRGB * vec4(12.92);
    return vec4(mix(higher, lower, cutoff).xyz, linearRGB.w);
}

// Converts a color from sRGB gamma to linear light gamma
highp vec4 toLinear(in highp vec4 sRGB) {
    bvec4 cutoff = lessThan(sRGB, vec4(0.04045));
    highp vec4 higher = pow((sRGB + vec4(0.055))/vec4(1.055), vec4(2.4));
    highp vec4 lower = sRGB/vec4(12.92);
    return vec4(mix(higher, lower, cutoff).xyz, sRGB.w);
}

//
uniform vec2 rxy;
uniform vec2 gxy;
uniform vec2 bxy;
uniform vec2 wxy;
uniform float gamma;

//
const mat3x3 srgb_xyz = mat3x3(
    0.4124564,  0.3575761,  0.1804375,
    0.2126729,  0.7151522,  0.0721750,
    0.0193339,  0.1191920,  0.9503041
);

//
const mat3x3 xyz_srgb = mat3x3(
    3.2404542, -1.5371385, -0.4985314,
    -0.9692660,  1.8760108,  0.0415560,
    0.0556434, -0.2040259,  1.0572252
);

//
void main() {
    //
    mat3x4 rgb_xyz_c = transpose(mat4x3(
        vec3(rxy, 1.f-rxy.x-rxy.y),
        vec3(gxy, 1.f-gxy.x-gxy.y),
        vec3(bxy, 1.f-bxy.x-bxy.y),
        vec3(0.f)
    ));

    //
    vec4 scale = vec4(wxy, 1.f-wxy.x-wxy.y, wxy.y) * inverse(mat4x4(rgb_xyz_c[0], rgb_xyz_c[1], rgb_xyz_c[2], vec4(0.0, 0.0, 0.0, 1.0)));
    vec4 linearXYZ = vec4(texture(img_rgb, texcoord.xy).xyz*srgb_xyz, 1.0);
    vec4 linearRGB = (linearXYZ/linearXYZ.w)*inverse(mat4x4(rgb_xyz_c[0], rgb_xyz_c[1], rgb_xyz_c[2], vec4(0.f, 0.f, 0.f, 1.0))) / scale;
    fragColor = vec4(pow(linearRGB.xyz/linearRGB.w, vec3(0.45f / gamma)), texture(img_a, texcoord.xy).x);
}
