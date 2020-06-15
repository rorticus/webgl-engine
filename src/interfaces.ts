import {mat4, vec3, vec4} from "gl-matrix";
import {Light} from "./Light";
import {GameObject} from "./GameObject";

export interface SceneRenderContext {
    gl: WebGLRenderingContext;
    projectionMatrix: mat4;
    u_ambientColor: vec3;
    pointLights: Light[];
}

export interface GameComponentContext {
    services: {};
    deltaInSeconds: number;
}

export type GameComponent = (context: GameComponentContext, gameObject: GameObject) => void;
