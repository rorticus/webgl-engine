import {GameObject} from "./GameObject";
import {vec4} from "gl-matrix";
import {Camera} from "./Camera";

export class Scene {
	private _gameObjects: GameObject[];

	ambientColor = vec4.fromValues(1, 1, 1, 1.0 );

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

		const renderContext = {
			gl,
			projectionMatrix: this.camera.viewProjectionMatrix,
			u_ambientColor: this.ambientColor
		};

		this._gameObjects.forEach((gameObject) => {
			gameObject.render(renderContext);
		});
	}
}
