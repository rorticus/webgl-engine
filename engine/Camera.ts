import { mat4, vec3 } from "gl-matrix";

export class Camera {
	zNear = 1;
	zFar = 2000;
	fov = (60 * Math.PI) / 180;

    cameraAngleInRadians = 0;
	radius = 10;

	projectionMatrix: mat4;
	cameraMatrix: mat4;
	viewProjectionMatrix: mat4;

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
        mat4.identity(cameraMatrix);
        mat4.rotateY(cameraMatrix, cameraMatrix, this.cameraAngleInRadians);
        mat4.translate(cameraMatrix, cameraMatrix, [0, 0, this.radius * 1.5]);

        const viewMatrix = mat4.create();
        mat4.invert(viewMatrix, cameraMatrix);

        const viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, this.projectionMatrix, viewMatrix);

        this.viewProjectionMatrix = viewProjectionMatrix;
    }
}
