import { mat4, vec3 } from "gl-matrix";

export class Camera {
	zNear = 1;
	zFar = 2000;
	fov = (60 * Math.PI) / 180;

    cameraAngleInRadians = 0;
	radius = 0.5;
	lookAt = vec3.fromValues(0, 0, 0);

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
        mat4.translate(cameraMatrix, cameraMatrix, [0, 10, this.radius * 1.5]);

        const cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
        const up = [0, 1, 0];

        mat4.targetTo(cameraMatrix, cameraPosition, this.lookAt, up);

        const viewMatrix = mat4.create();
        mat4.invert(viewMatrix, cameraMatrix);

        const viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, this.projectionMatrix, viewMatrix);

        this.viewProjectionMatrix = viewProjectionMatrix;
    }
}
