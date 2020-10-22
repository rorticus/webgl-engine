export const vertexShader = `
attribute vec3 a_position;
attribute float a_size;
attribute vec4 a_color;
attribute float a_life;

uniform mat4 u_matrix;
uniform mat4 u_projectionMatrix;
uniform float u_heightOfNearPlane;

varying float v_life;

void main() {
    vec4 position = u_projectionMatrix * u_matrix * vec4(a_position, 1.0);

    gl_Position = position;
    gl_PointSize = (u_heightOfNearPlane * a_size) / position.w;
    v_life = a_life;
}
`;

export const fragmentShader = `
precision mediump float;

varying float v_life;

void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);

    if(r > 1.0) {
        discard;
    }

    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0 - v_life);
}
`;
