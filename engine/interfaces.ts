import {mat4, vec3, vec4} from "gl-matrix";
import {Light} from "./Light";

export interface SceneRenderContext {
    gl: WebGLRenderingContext;
    projectionMatrix: mat4;
    u_ambientColor: vec3;
    pointLights: Light[];
}
