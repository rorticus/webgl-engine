import {vec3} from "gl-matrix";

export enum LightType {
    Point = 1
}

export class Light {
    position = vec3.create();
    color = vec3.create();
    type: LightType = LightType.Point;
}