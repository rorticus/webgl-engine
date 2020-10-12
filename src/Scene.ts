import { GameObject } from "./GameObject";
import { mat4, vec3, vec4 } from "gl-matrix";
import { Camera } from "./Camera";
import { Light, LightType } from "./Light";
import {
	PrimitiveData,
	ProgramInfo,
	Renderable,
	SingleRenderable,
} from "./webgl/interfaces";
import {
	createAttributesFromArrays,
	createSkyboxTexture,
	setBuffersAndAttributes,
	setUniforms,
} from "./webgl/utils";
import { quad } from "./webgl/primitives";
import { GameComponentContext, RenderPhase } from "./interfaces";

export class Scene {
	private _layers: GameObject[] = [];

	ambientColor = vec3.fromValues(0.1, 0.1, 0.1);
	pointLights: Light[];

	camera: Camera;

	skybox: Renderable | null;

	constructor() {
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
		this._layers.forEach((layer) => layer.update(context));
	}

	addGameObject(go: GameObject, layer = 0) {
		if (this._layers[layer] === undefined) {
			this._layers[layer] = new GameObject();
		}

		this._layers[layer].add(go);
	}

	removeGameObject(go: GameObject) {
		this._layers.forEach((layer) => {
			layer.remove(go);
		});
	}

	getObjectById(id: string) {
		for (let i = 0; i < this._layers.length; i++) {
			const go = this._layers[i].getObjectById(id, true);
			if (go) {
				return go;
			}
		}

		return undefined;
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
			phase: "standard" as const,
		};

		this._layers.forEach((layer, index) => {
			gl.clear(gl.DEPTH_BUFFER_BIT);

			const additionalPhases: Record<RenderPhase, GameObject[]> = {
				alpha: [],
				standard: [],
			};

			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			layer.render({
				...renderContext,
				addToRenderPhase: (phase: RenderPhase, go: GameObject) =>
					additionalPhases[phase].push(go),
			});

			if (index === 0) {
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

			if (additionalPhases.alpha.length) {
				gl.depthMask(false);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

				additionalPhases.alpha.forEach((go) => {
					go.render({
						...renderContext,
						phase: "alpha" as const,
						addToRenderPhase: () => undefined,
					});
				});

				gl.depthMask(true);
				gl.blendFunc(gl.ONE, gl.ZERO);
			}
		});
	}
}
