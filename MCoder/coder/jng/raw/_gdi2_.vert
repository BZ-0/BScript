#version 300 es
precision lowp float;
precision lowp int;

out highp vec2 texcoord;

void main() {
    const lowp vec2 _vertex_[4] = vec2[4](
        vec2(-1.f, -1.f),
        vec2( 1.f, -1.f),
        vec2( 1.f,  1.f),
        vec2(-1.f,  1.f)
    );
    
    texcoord = vec2(_vertex_[gl_VertexID].xy*0.5f+0.5f);
    texcoord.y = 1.f - texcoord.y;
    gl_Position = vec4(_vertex_[gl_VertexID], 0.f, 1.f);
}