import { mat4, vec3 } from "gl-matrix";

export class Camera {
    left = vec3.fromValues(1, 0, 0);
    up = vec3.fromValues(0, 1, 0);
    dir = vec3.fromValues(0, 0, 1);
    pos = vec3.fromValues(0, 0, 0);
    projectionMatrix: mat4;
    viewMatrix: mat4;
    fieldOfView = 55;
    nearClippingPlane = 0.1;
    farClippingPlane = 1000;

    getLeft() {
        return vec3.clone(this.left);
    }

    getPosition() {
        return vec3.clone(this.pos);
    }

    getProjectionMatrix() {
        return mat4.clone(this.projectionMatrix);
    }

    getViewMatrix() {
        return mat4.clone(this.viewMatrix);
    }

    getUp() {
        return vec3.clone(this.up);
    }

    getNearClippingPane() {
        return this.nearClippingPlane;
    }

    getFieldOfView() {
        return this.fieldOfView;
    }

    setFarClippingPlane(fcp: number) {
        if (fcp > 0) {
            this.farClippingPlane = fcp;
        }
    }

    setFieldOFView(fov: number) {
        if (fov > 0 && fov < 180) {
            this.fieldOfView = fov;
        }
    }

    setNearClippingPlane(ncp: number) {
        if (ncp > 0) {
            this.nearClippingPlane = ncp;
        }
    }

    apply(aspectRatio: number) {
        const matView = mat4.create();
        const lookAtPosition = vec3.create();
        vec3.add(lookAtPosition, this.pos, this.dir);
        mat4.lookAt(matView, this.pos, lookAtPosition, this.up);
        mat4.translate(
            matView,
            matView,
            vec3.fromValues(-this.pos[0], -this.pos[1], -this.pos[2])
        );
        this.viewMatrix = matView;
        this.projectionMatrix = mat4.create();
        mat4.perspective(
            this.projectionMatrix,
            (this.fieldOfView * Math.PI) / 180,
            aspectRatio,
            this.nearClippingPlane,
            this.farClippingPlane
        );
    }
}