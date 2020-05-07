import { GameObject } from "./GameObject";
import { mat4 } from "gl-matrix";
import { Camera } from "./Camera";

export class Scene {
	private _gameObjects: GameObject[];
	private _camera: Camera;

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

		this._camera.apply(viewportWidth / viewportHeight);
		mat4.multiply(mvMatrix, mvMatrix, this._camera.viewMatrix);

        const invertMatrix = mat4.create();
        const normalMatrix = mat4.create();

		this._gameObjects.forEach((gameObject) => {
			mvMatrixStack.push(mat4.clone(mvMatrix));

			mat4.multiply(mvMatrix, mvMatrix, gameObject.modelMatrix);

            mat4.invert(invertMatrix, mvMatrix);
            mat4.transpose(normalMatrix, invertMatrix);

            gameObject.render(gl);

            mvMatrix = mvMatrixStack.pop();
		});
	}
}
