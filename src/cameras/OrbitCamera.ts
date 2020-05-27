import {Camera} from "../Camera";
import {mat4, quat, vec3} from "gl-matrix";

export class OrbitCamera extends Camera {
    radius = 5;
    azimuth = 0;
    elevation = 0;

    closestDistance = 0;
    farthestDistance = 0;


    apply(aspectRatio: number) {
        this.position = vec3.fromValues(0, 0, this.radius);

        const q = quat.create();
        quat.identity(q);
        quat.rotateY(q, q, this.azimuth);
        quat.rotateX(q, q, this.elevation);

        vec3.set(this.position, 0, 0, this.radius);
        vec3.transformQuat(this.position, this.position, q);

        super.apply(aspectRatio);
    }
}