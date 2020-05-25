import { GameObject } from "./GameObject";
import { vec3, vec4 } from "gl-matrix";
import { Camera } from "./Camera";
import { Light, LightType } from "./Light";

export class Scene {
	private _gameObjects: GameObject[];

	ambientColor = vec3.fromValues(0.1, 0.1, 0.1);
	pointLights: Light[];

	camera: Camera;

	constructor() {
		this._gameObjects = [];
		this.camera = new Camera();

		const light1 = new Light();
		light1.type = LightType.Point;
		light1.position = vec3.fromValues(0, 0, 0);
		light1.color = vec3.fromValues(0, 0, 0);

		const light2 = new Light();
		light2.type = LightType.Point;
		light2.position = vec3.fromValues(0, 0, 0);
		light2.color = vec3.fromValues(0, 0, 0);

		this.pointLights = [light1, light2];
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
			pointLights: this.pointLights,
		};

		this._gameObjects.forEach((gameObject) => {
			gameObject.render(renderContext);
		});
	}
}
