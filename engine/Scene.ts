import { GameObject } from "./GameObject";
import { mat4 } from "gl-matrix";
import { setUniforms } from "./webgl/utils";
import { Camera } from "./Camera";

export class Scene {
	private _gameObjects: GameObject[];
	camera: Camera;

	constructor() {
		this._gameObjects = [];
		this.camera = new Camera();
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
		this.camera.apply(viewportWidth / viewportHeight);

		let mvMatrix = mat4.create();
		mat4.identity(mvMatrix);

		const mvMatrixStack: mat4[] = [mat4.clone(mvMatrix)];

		this._gameObjects.forEach((gameObject) => {
			mvMatrixStack.push(mat4.clone(mvMatrix));

			mat4.multiply(mvMatrix, mvMatrix, gameObject.worldMatrix);

			if (gameObject.renderable) {
				gl.useProgram(gameObject.renderable.programInfo.program);
				setUniforms(gameObject.renderable.programInfo, {
					u_projectionMatrix: this.camera.viewProjectionMatrix,
					u_matrix: mvMatrix,
				});
			}

			gameObject.render(gl);

			mvMatrix = mvMatrixStack.pop();
		});
	}
}
