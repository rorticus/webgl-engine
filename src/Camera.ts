import { mat4, vec3 } from "gl-matrix";

export class Camera {
	zNear = 1;
	zFar = 2000;
	fov = (60 * Math.PI) / 180;

	position = vec3.fromValues(0, 10, 0);
	lookAt = vec3.fromValues(0, 0, 0);
	right = vec3.fromValues(0, 0, 1);
	up = vec3.fromValues(0, 1, 0);

	projectionMatrix: mat4;
	cameraMatrix: mat4;
	viewProjectionMatrix = mat4.create();

	constructor() {
		this.projectionMatrix = mat4.create();
		this.cameraMatrix = mat4.create();

		mat4.identity(this.cameraMatrix);
	}

	apply(aspectRatio: number) {
        mat4.perspective(
            this.projectionMatrix,
            this.fov,
            aspectRatio,
            this.zNear,
            this.zFar
        );

        const cameraMatrix = mat4.create();

        mat4.targetTo(cameraMatrix, this.position, this.lookAt, this.up);

        const viewMatrix = mat4.create();
        mat4.invert(viewMatrix, cameraMatrix);

        mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, viewMatrix);
    }
}
