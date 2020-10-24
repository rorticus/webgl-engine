export const vertexShader = `
attribute vec3 a_position;
attribute float a_size;
attribute vec4 a_color;
attribute float a_life;

uniform mat4 u_matrix;
uniform mat4 u_projectionMatrix;
uniform float u_heightOfNearPlane;

varying float v_life;
varying vec4 v_color;

void main() {
    vec4 position = u_projectionMatrix * u_matrix * vec4(a_position, 1.0);

    gl_Position = position;
    gl_PointSize = (u_heightOfNearPlane * a_size) / position.w;
    v_life = a_life;
    v_color = a_color;
}
`;

export const fragmentShader = `
precision mediump float;

varying float v_life;
varying vec4 v_color;

uniform sampler2D u_texture;
uniform bool u_hasTexture;

void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);

    if(r > 1.0) {
        discard;
    }

    vec4 baseColor = u_hasTexture ? texture2D(u_texture, gl_PointCoord) : vec4(1.0, 1.0, 1.0, 1.0);
    gl_FragColor = v_color * baseColor * vec4(1.0, 1.0, 1.0, (1.0 - v_life) * (1.0 - r));
}
`;
