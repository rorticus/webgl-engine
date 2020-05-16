import {mat4, vec4} from "gl-matrix";

export interface SceneRenderContext {
    gl: WebGLRenderingContext;
    projectionMatrix: mat4;
    u_ambientColor: vec4;
}
