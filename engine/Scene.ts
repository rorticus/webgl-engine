import {GameObject} from "./GameObject";
import {vec3, vec4} from "gl-matrix";
import {Camera} from "./Camera";
import {Light, LightType} from "./Light";

export class Scene {
	private _gameObjects: GameObject[];

	ambientColor = vec3.fromValues(0.1, 0.1, 0.1);
	pointLight: Light;

	camera: Camera;

	constructor() {
		this._gameObjects = [];
		this.camera = new Camera();

		this.pointLight = new Light();
		this.pointLight.type = LightType.Point;
		this.pointLight.position = vec3.fromValues(0, 0, 0);
		this.pointLight.color = vec3.fromValues(1, 1, 1);
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
			u_ambientColor: this.ambientColor,
			pointLights: [
				this.pointLight
			]
		};

		this._gameObjects.forEach((gameObject) => {
			gameObject.render(renderContext);
		});
	}
}
