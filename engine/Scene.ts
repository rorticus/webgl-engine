import { GameObject } from "./GameObject";
import { mat4 } from "gl-matrix";
import { setUniforms } from "./webgl/utils";

export class Scene {
	private _gameObjects: GameObject[];

	constructor() {
		this._gameObjects = [];
	}

	update(deltaInSeconds: number) {
		this._gameObjects.forEach((go) => go.update(deltaInSeconds));
	}

	addGameObject(go: GameObject) {
		this._gameObjects.push(go);
	}

	removeGameObject(go: GameObject) {
		const index = this._gameObjects.indexOf(go);

		if (index >= 0) {
			this._gameObjects.splice(index, 1);
		}
	}

	render(
		viewportWidth: number,
		viewportHeight: number,
		gl: WebGLRenderingContext
	) {
		let mvMatrix = mat4.create();
		mat4.identity(mvMatrix);

		const mvMatrixStack: mat4[] = [mat4.clone(mvMatrix)];

		const aspect = viewportWidth / viewportHeight;
		const zNear = 0.1;
		const zFar = 2000;
		const projectionMatrix = mat4.create();
		mat4.perspective(
			projectionMatrix,
			(60 * Math.PI) / 180,
			aspect,
			zNear,
			zFar
		);

		const numFs = 5;
		const radius = 200;

		const cameraMatrix = mat4.create();
		mat4.rotateY(cameraMatrix, cameraMatrix, (45 * Math.PI) / 180);
		mat4.translate(cameraMatrix, cameraMatrix, [0, 0, radius * 1.5]);

		const viewMatrix = mat4.create();
		mat4.invert(viewMatrix, cameraMatrix);

		const viewProjectionMatrix = mat4.create();
		mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

		mat4.copy(mvMatrix, viewProjectionMatrix);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		this._gameObjects.forEach((gameObject) => {
			mvMatrixStack.push(mat4.clone(mvMatrix));

			mat4.multiply(mvMatrix, mvMatrix, gameObject.localMatrix);
			//
			// mat4.invert(invertMatrix, mvMatrix);
			// mat4.transpose(normalMatrix, invertMatrix);

			if (gameObject.renderable) {
				setUniforms(gameObject.renderable.uniforms, {
					u_matrix: mvMatrix,
				});
			}

			gameObject.render(gl);

			mvMatrix = mvMatrixStack.pop();
		});
	}
}
