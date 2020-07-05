export const vertexShader = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_matrix * a_position;
    v_texcoord = vec2(a_texcoord.x, 1.0 - a_texcoord.y);
}
`;

export const fragmentShader = `
precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texcoord;

void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;
