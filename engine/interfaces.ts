import {mat4} from "gl-matrix";

export interface SceneRenderContext {
    gl: WebGLRenderingContext;
    projectionMatrix: mat4;
}
