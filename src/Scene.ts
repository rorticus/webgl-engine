import { GameObject } from "./GameObject";
import { mat4, vec3, vec4 } from "gl-matrix";
import { Camera } from "./Camera";
import { Light, LightType } from "./Light";
import { PrimitiveData, ProgramInfo, Renderable } from "./webgl/interfaces";
import {
	createAttributesFromArrays,
	createSkyboxTexture,
	setBuffersAndAttributes,
	setUniforms,
} from "./webgl/utils";
import { quad } from "./webgl/primitives";
import { GameComponentContext } from "./interfaces";

export class Scene {
	private _gameObjects: GameObject[];

	ambientColor = vec3.fromValues(0.1, 0.1, 0.1);
	pointLights: Light[];

	camera: Camera;

	skybox: Renderable | null;

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

		this.skybox = null;
	}

	loadSkymap(
		gl: WebGLRenderingContext,
		programInfo: ProgramInfo,
		sources: {
			positiveX: string;
			negativeX: string;
			positiveY: string;
			negativeY: string;
			positiveZ: string;
			negativeZ: string;
		}
	) {
		this.skybox = {
			programInfo,
			renderables: [
				{
					attributes: createAttributesFromArrays(gl, quad()),
					uniforms: {
						u_skybox: createSkyboxTexture(gl, sources),
					},
				},
			],
		};
	}

	update(context: GameComponentContext) {
		this._gameObjects.forEach((go) => go.update(context));
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

		if (this.skybox) {
			gl.depthFunc(gl.LEQUAL);

			const inverse = mat4.create();
			mat4.invert(inverse, this.camera.viewProjectionMatrix);

			gl.useProgram(this.skybox.programInfo.program);
			setBuffersAndAttributes(
				gl,
				this.skybox.programInfo,
				this.skybox.renderables[0].attributes
			);
			setUniforms(this.skybox.programInfo, {
				...this.skybox.renderables[0].uniforms,
				u_viewDirectionProjectionInverse: inverse,
			});

			gl.drawArrays(
				gl.TRIANGLES,
				0,
				this.skybox.renderables[0].attributes.numElements || 0
			);
			gl.depthFunc(gl.LESS);
		}
	}
}
