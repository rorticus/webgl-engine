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

		mat4.translate(mvMatrix, mvMatrix, [0, -2, -7]);

		this._gameObjects.forEach((gameObject) => {
			mvMatrixStack.push(mat4.clone(mvMatrix));

			// mat4.multiply(mvMatrix, mvMatrix, gameObject.localMatrix);

			if (gameObject.renderable) {
				gl.useProgram(gameObject.renderable.programInfo.program);
				setUniforms(gameObject.renderable.programInfo, {
					u_projectionMatrix: projectionMatrix,
					u_matrix: mvMatrix,
				});
			}

			gameObject.render(gl);

			mvMatrix = mvMatrixStack.pop();
		});
	}
}
