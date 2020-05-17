import {vec3} from "gl-matrix";

export enum LightType {
    Point = 1
}

export class Light {
    position: vec3;
    color: vec3;
    type: LightType;
}