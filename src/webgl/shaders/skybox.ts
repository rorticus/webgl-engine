export const vertexShader = `
attribute vec4 a_position;
varying vec4 v_position;

void main() {
    v_position = a_position;
    gl_Position = a_position;
    gl_Position.z = 1.0;
}
`;

export const fragmentShader = `
precision mediump float;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

varying vec4 v_position;

void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
}
`;
