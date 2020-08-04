import {mat4, vec3, vec4} from "gl-matrix";
import {Light} from "./Light";
import {GameObject} from "./GameObject";
import { Engine } from "./Engine";

export interface SceneRenderContext {
    gl: WebGLRenderingContext;
    projectionMatrix: mat4;
    // TODO: Rename this to something that doesn't have a u_ in front of it..
    u_ambientColor: vec3;
    pointLights: Light[];
}

export interface GameComponentContext {
    engine: Engine;
    deltaInSeconds: number;
}

export interface GameComponent {
    tag?: string;
    update: (context: GameComponentContext, gameObject: GameObject) => void;
}
